// Moteur : écran, entrées clavier/tactile, tâches asynchrones, interpolations, sauvegarde.
const SW = 256, SH = 224;
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------------- Entrées ----------------
const Input = (() => {
  const MAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', ShiftLeft: 'run', ShiftRight: 'run', KeyM: 'mute', KeyC: 'menu', Tab: 'menu',
  };
  const held = {}, touch = {}, prev = {}, cur = {}, hold = {}, latch = {};
  window.addEventListener('keydown', e => {
    const b = MAP[e.code];
    if (b) { if (!held[b]) latch[b] = true; held[b] = true; e.preventDefault(); }
    SND.init();
  });
  window.addEventListener('keyup', e => { const b = MAP[e.code]; if (b) { held[b] = false; e.preventDefault(); } });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  function setTouch(b, v) { if (v && !touch[b]) latch[b] = true; touch[b] = v; if (v) SND.init(); }
  function poll() {
    for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'run', 'mute', 'menu']) {
      prev[b] = cur[b];
      cur[b] = !!(held[b] || touch[b] || latch[b]);
      latch[b] = false;
      hold[b] = cur[b] ? (hold[b] || 0) + 1 : 0;
    }
  }
  const down = b => !!cur[b];
  const pressed = b => cur[b] && !prev[b];
  const repeat = b => cur[b] && (!prev[b] || (hold[b] > 16 && hold[b] % 4 === 0));
  function clear() { for (const b in cur) { prev[b] = true; } }
  return { poll, down, pressed, repeat, setTouch, clear };
})();

// ---------------- Tâches et interpolations ----------------
const Tasks = {
  list: [], tweens: [],
  wait(n) { return new Promise(res => this.list.push({ n: Math.max(1, n | 0), res })); },
  until(fn) { return new Promise(res => this.list.push({ fn, res })); },
  tween(obj, props, frames, ease = 'inOut') {
    return new Promise(res => {
      const start = {};
      for (const k in props) start[k] = obj[k];
      this.tweens.push({ obj, props, start, frames: Math.max(1, frames), t: 0, ease, res });
    });
  },
  tick() {
    const l = this.list; this.list = [];
    for (const t of l) {
      if (t.fn ? t.fn() : --t.n <= 0) t.res(); else this.list.push(t);
    }
    const tw = this.tweens; this.tweens = [];
    for (const t of tw) {
      t.t++;
      let p = Math.min(1, t.t / t.frames);
      if (t.ease === 'inOut') p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      else if (t.ease === 'out') p = 1 - (1 - p) * (1 - p);
      else if (t.ease === 'in') p = p * p;
      for (const k in t.props) t.obj[k] = t.start[k] + (t.props[k] - t.start[k]) * p;
      if (t.t >= t.frames) t.res(); else this.tweens.push(t);
    }
  },
  reset() { this.list = []; this.tweens = []; },
};
const wait = n => Tasks.wait(n);

// ---------------- État de la partie ----------------
const COMPANIONS = ['bulma', 'krillin', 'yamcha', 'oolong', 'chichi'];
const Game = {
  mode: 'title', frame: 0, playFrames: 0,
  party: [], reserve: [], items: {}, gear: {}, train: {}, zeni: 0, balls: [], flags: {}, aff: {}, karma: 0, quests: {},
  mapId: null, spawn: null, shake: 0,
  newGame() {
    this.party = [makeMember('goku', 1)];
    this.reserve = [];
    this.items = { tonique: 3 };
    this.gear = {}; this.train = {};
    equipItem(this.party[0], 'arme', 'nyoibo', true); // le bâton de Grand-père Gohan
    this.zeni = 50; this.balls = []; this.flags = {}; this.playFrames = 0;
    this.aff = {}; for (const c of COMPANIONS) this.aff[c] = 0;
    this.karma = 0; this.quests = {};
  },
  addItem(id, n = 1) { this.items[id] = (this.items[id] || 0) + n; },
  useItemStock(id) { if (this.items[id] > 0) { this.items[id]--; if (!this.items[id]) delete this.items[id]; return true; } return false; },
  addGear(id, n = 1) { this.gear[id] = (this.gear[id] || 0) + n; },
  useGear(id) { if (this.gear[id] > 0) { this.gear[id]--; if (!this.gear[id]) delete this.gear[id]; return true; } return false; },
  // nombre total possédé (inventaire + porté)
  gearOwned(id) { return (this.gear[id] || 0) + this.allMembers().filter(m => m.equip && SLOTS.some(s => m.equip[s] === id)).length; },
  // gagne un objet ou un équipement
  give(id, n = 1) { if (GEAR[id]) this.addGear(id, n); else this.addItem(id, n); },
  member(id) { return this.party.find(m => m.id === id) || this.reserve.find(m => m.id === id); },
  inParty(id) { return this.party.some(m => m.id === id); },
  // Ajoute un compagnon : dans l'équipe active s'il reste de la place, sinon en réserve.
  addMember(id) {
    if (this.member(id)) return 'party';
    const lv = Math.max(1, ...this.party.concat(this.reserve).map(m => m.lv));
    const m = makeMember(id, lv);
    if (id === 'yamcha') equipItem(m, 'arme', 'sabre', true); // le loup du désert garde son sabre
    if (this.party.length < 3) { this.party.push(m); return 'party'; }
    this.reserve.push(m); return 'reserve';
  },
  removeMember(id) { this.party = this.party.filter(m => m.id !== id); this.reserve = this.reserve.filter(m => m.id !== id); },
  allMembers() { return this.party.concat(this.reserve); },
  hasBall(n) { return this.balls.includes(n); },
  giveBall(n) { if (!this.balls.includes(n)) this.balls.push(n); this.balls.sort(); },
  takeBalls(list) { this.balls = this.balls.filter(n => !list.includes(n)); },
  healAll() { for (const m of this.allMembers()) { m.hp = m.maxhp; m.ki = m.maxki; } },
  addAff(id, n, quiet) {
    this.aff[id] = (this.aff[id] || 0) + n;
    if (!quiet && typeof UI !== 'undefined') {
      const name = MEMBERS[id] ? MEMBERS[id].name : (id === 'chichi' ? 'Chichi' : id);
      UI.notify(n > 0 ? '♥ ' + name + ' apprécie' : name + ' est déçu' + (id === 'bulma' || id === 'chichi' ? 'e' : '') + '...', 90);
    }
  },
  addKarma(n) { this.karma += n; },
  quest(id) { return this.quests[id]; },
  setQuest(id, state, quiet) {
    const was = this.quests[id];
    this.quests[id] = state;
    if (!quiet && was !== state && typeof UI !== 'undefined' && QUESTS[id]) {
      UI.notify((state === 'done' ? 'Quête terminée : ' : was ? 'Journal : ' : 'Nouvelle quête : ') + QUESTS[id].title, 120);
    }
  },
  save() {
    const data = {
      v: 2, party: this.party, reserve: this.reserve, items: this.items, gear: this.gear, train: this.train, zeni: this.zeni, balls: this.balls, flags: this.flags,
      aff: this.aff, karma: this.karma, quests: this.quests,
      mapId: Field.mapId, x: Field.leader().x, y: Field.leader().y, dir: Field.leader().dir, playFrames: this.playFrames,
    };
    try { localStorage.setItem('dbq_save', JSON.stringify(data)); return true; } catch (e) { return false; }
  },
  loadData() {
    try { const s = localStorage.getItem('dbq_save'); const d = s ? JSON.parse(s) : null; return d && d.v === 2 ? d : null; } catch (e) { return null; }
  },
  hasSave() { return !!this.loadData(); },
  load() {
    const d = this.loadData();
    if (!d) return false;
    this.party = d.party; this.reserve = d.reserve || []; this.items = d.items; this.zeni = d.zeni; this.balls = d.balls; this.flags = d.flags;
    this.aff = d.aff || {}; this.karma = d.karma || 0; this.quests = d.quests || {}; this.playFrames = d.playFrames || 0;
    this.gear = d.gear || {}; this.train = d.train || {};
    for (const m of this.allMembers()) { refreshTechs(m); for (const d of m.custom || []) CustomTech.register(m, d); }
    // anciennes sauvegardes : Goku récupère son bâton
    if (!d.gear) { const g = this.member('goku'); if (g && !(g.equip && g.equip.arme)) equipItem(g, 'arme', 'nyoibo', true); }
    this.spawn = { mapId: d.mapId, x: d.x, y: d.y, dir: d.dir };
    return true;
  },
};

function playTime() {
  const s = Math.floor(Game.playFrames / 60);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
  return h + ':' + String(m).padStart(2, '0');
}
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
