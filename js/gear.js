// Équipements visibles (armes, tenues, couvre-chefs) et personnalisation de Goku.
// Chaque apparence (équipement + style) devient une variante de sprite : 'goku~...' dans CHARS.
const SLOTS = ['arme', 'tenue', 'tete', 'acc'];
const LOOK_SLOTS = ['arme', 'tenue', 'tete']; // l'accessoire ne se voit pas sur le sprite
const SLOT_NAMES = { arme: 'Arme', tenue: 'Tenue', tete: 'Tête', acc: 'Accessoire' };
const STAT_NAMES = { hp: 'PV', ki: 'Ki', atk: 'Force', def: 'Défense', mag: 'Puissance', spd: 'Vitesse' };

// Couleurs des pièces d'équipement (les chiffres sont des lettres de palette réservées à l'équipement)
const GEAR = {
  // ---- Armes ----
  nyoibo: { slot: 'arme', name: 'Bâton Magique', desc: 'Le Nyoibo de Grand-père Gohan, qui s\'allonge à volonté.', stats: { atk: 3, mag: 1 }, who: ['goku'], price: 0,
    art: { kind: 'staff', pal: { 1: '#d83828', 2: '#8a1c14', 3: '#f8d048' } } },
  baton_bambou: { slot: 'arme', name: 'Bâton de bambou', desc: 'Léger et solide. Parfait pour débuter.', stats: { atk: 2 }, price: 60,
    art: { kind: 'staff', pal: { 1: '#c8b860', 2: '#8a7a30', 3: '#5a7a30' } } },
  gants_cuir: { slot: 'arme', name: 'Gants de cuir', desc: 'Protègent les poings sans gêner les mouvements.', stats: { atk: 2, spd: 1 }, price: 80,
    art: { kind: 'gloves', pal: { 7: '#9a5a30', 8: '#5e3418' } } },
  sabre: { slot: 'arme', name: 'Sabre du Désert', desc: 'Une lame courbe forgée par les nomades.', stats: { atk: 6, spd: -1 }, who: ['goku', 'krillin', 'yamcha'], price: 260,
    art: { kind: 'sword', pal: { 1: '#e0e8f0', 2: '#8890a8', 3: '#f8c040', E: '#6a3a20' } } },
  gants_tortue: { slot: 'arme', name: 'Gants de la Tortue', desc: 'Offerts par Tortue Géniale aux élèves qui cassent toutes les briques.', stats: { atk: 5, spd: 2 }, price: 0,
    art: { kind: 'gloves', pal: { 7: '#f88820', 8: '#2858c8' } } },
  // ---- Tenues ----
  plastron: { slot: 'tenue', name: 'Plastron de cuir', desc: 'Un gilet épais qui encaisse bien les coups.', stats: { def: 3, hp: 15 }, price: 120,
    art: { top: ['#a06a3a', '#6a4220', '#d09a60'] } },
  kimono_kame: { slot: 'tenue', name: 'Kimono de la Tortue', desc: 'La tenue officielle de l\'école de Tortue Géniale.', stats: { def: 4, mag: 2, hp: 20 }, price: 0,
    art: { top: ['#f88820', '#c05810', '#ffc070'], pants: ['#f88820', '#c05810'], belt: ['#2858c8', '#183488', '#5888f0'], badge: true } },
  armure: { slot: 'tenue', name: 'Armure de soldat', desc: 'Une armure volée dans l\'arsenal de Pilaf. Un peu lourde.', stats: { def: 7, hp: 30, spd: -1 }, price: 0,
    art: { top: ['#8890a8', '#565c78', '#c8d0e8'], pads: true } },
  carapace: { slot: 'tenue', name: 'Carapace de Tortue', desc: 'La carapace d\'entraînement de Tortue Géniale. Très lourde !', stats: { def: 9, hp: 40, spd: -3 }, price: 0,
    art: { shell: true } },
  // ---- Couvre-chefs ----
  bandeau: { slot: 'tete', name: 'Bandeau rouge', desc: 'Un bandeau de combattant. Ça motive !', stats: { def: 1, spd: 1 }, price: 50,
    art: { band: ['#d83030', '#8a1818'], knot: true } },
  lunettes: { slot: 'tete', name: 'Lunettes d\'aviateur', desc: 'Comme celles de Bulma. On voit tout, même le Ki.', stats: { mag: 3, spd: 1 }, price: 150,
    art: { band: ['#8a5a30', '#5a3418'], lens: '#60e0f0' } },
  bandeau_kame: { slot: 'tete', name: 'Bandeau de la Tortue', desc: 'Réservé aux élèves au sens du rythme parfait.', stats: { atk: 2, mag: 2, def: 1 }, price: 0,
    art: { band: ['#f8f8f0', '#b8b8c0'], knot: true, plate: '#f88820' } },
  casque: { slot: 'tete', name: 'Casque à cornes', desc: 'Un casque de la famille du roi Gyumao.', stats: { def: 4, hp: 25 }, price: 0,
    art: { band: ['#8050c0', '#583090'], horns: '#f4ecd8' } },
};

// ---- Accessoires : effets spéciaux en combat (voir progress.js) ----
Object.assign(GEAR, {
  haricot_chance: { slot: 'acc', name: 'Haricot porte-bonheur', desc: 'Une fois par combat, ranime avec la moitié des PV.', stats: {}, fx: 'revive', price: 0 },
  montre: { slot: 'acc', name: 'Montre de Bulma', desc: 'Une montre-capsule : la jauge de temps se remplit 15 % plus vite.', stats: {}, fx: 'atb', price: 420 },
  aimant: { slot: 'acc', name: 'Aimant à Zénis', desc: 'Attire les pièces : +50 % de Zénis après les combats.', stats: {}, fx: 'zeni', price: 300 },
  masque: { slot: 'acc', name: 'Masque à gaz', desc: 'Protège du poison et des brûlures.', stats: {}, fx: 'antitox', price: 240 },
  oreiller: { slot: 'acc', name: 'Oreiller de voyage', desc: 'On dort si bien qu\'on ne craint plus le sommeil ni la paralysie.', stats: {}, fx: 'awake', price: 240 },
  bracelet_ki: { slot: 'acc', name: 'Bracelet de Ki', desc: 'Rend 3 Ki à chaque tour.', stats: { ki: 4 }, fx: 'kiregen', price: 380 },
  grelot: { slot: 'acc', name: 'Grelot de Karine', desc: 'Un grelot porte-chance : esquive +12 %.', stats: { spd: 1 }, fx: 'dodge', price: 0 },
  pendentif: { slot: 'acc', name: 'Pendentif de plume', desc: 'Une plume sacrée : PV +40 et un peu de PV rendus à chaque tour.', stats: { hp: 40 }, fx: 'regen', price: 0 },
});

// ---------------- Personnalisation de Goku ----------------
const STYLE_OPTS = {
  gi: { name: 'Kimono', vals: [
    ['Orange', '#f88820', '#c05810', '#ffc070'], ['Bleu', '#3878d8', '#1c4890', '#80b0f8'], ['Rouge', '#d83838', '#8a1c1c', '#f88888'],
    ['Vert', '#48a050', '#2a6a30', '#90d890'], ['Violet', '#8a50c8', '#5a3090', '#c098f0'], ['Noir', '#3a3a48', '#1c1c28', '#6a6a80'], ['Blanc', '#f0f0f0', '#a8a8b8', '#ffffff']] },
  belt: { name: 'Ceinture', vals: [
    ['Bleue', '#2858c8', '#183488', '#5888f0'], ['Rouge', '#c83030', '#801818', '#f07070'], ['Noire', '#2a2a34', '#14141c', '#5a5a6a'],
    ['Jaune', '#e8c030', '#a07c10', '#fff080'], ['Verte', '#3a9040', '#205a24', '#80d080']] },
  boots: { name: 'Bottes', vals: [['Marine', '#232f6c', '#121a40', '#5a6ab0'], ['Noires', '#26262e', '#121216', '#55555f'], ['Rouges', '#a82828', '#601414', '#e06060'], ['Marron', '#6a4224', '#3e2410', '#9a6a44']] },
  hair: { name: 'Cheveux', vals: [['Noirs', '#22223a', '#101020', '#50508a'], ['Bruns', '#5a3420', '#2e180c', '#8a5a3a'], ['Roux', '#c8502a', '#7a2a14', '#f09060'],
    ['Bleu nuit', '#203c78', '#101e44', '#4a70c0'], ['Dorés', '#f8d830', '#c89810', '#fff8a0', 'goldHair']] },
  tail: { name: 'Queue', vals: [['Non'], ['Oui']] },
  emblem: { name: 'Emblème', vals: [['Aucun'], ['Kamé'], ['Étoile']] },
};
const STYLE_KEYS = ['gi', 'belt', 'boots', 'hair', 'tail', 'emblem'];
const STYLE_DEFAULT = { gi: 0, belt: 0, boots: 0, hair: 0, tail: 1, emblem: 1 };
function styleOf(m) { return Object.assign({}, STYLE_DEFAULT, m.style || {}); }
function styleUnlocked(key, i) { const v = STYLE_OPTS[key].vals[i]; return !v[4] || !!Game.flags[v[4]]; }

// ---------------- Statistiques ----------------
function gearStats(m) {
  const s = {};
  for (const slot of SLOTS) {
    const id = m.equip && m.equip[slot];
    if (id && GEAR[id]) for (const k in GEAR[id].stats) s[k] = (s[k] || 0) + GEAR[id].stats[k];
  }
  return s;
}
function applyGearStats(m, id, sign) {
  const st = GEAR[id].stats;
  for (const k in st) {
    const v = st[k] * sign;
    if (k === 'hp') { m.maxhp += v; m.hp = clamp(m.hp + Math.max(0, v), m.hp > 0 ? 1 : 0, m.maxhp); }
    else if (k === 'ki') { m.maxki += v; m.ki = clamp(m.ki + Math.max(0, v), 0, m.maxki); }
    else m[k] += v;
  }
}
function canEquip(m, id) { const g = GEAR[id]; return !!g && (!g.who || g.who.includes(m.id)); }
// Équipe (ou retire si id est null). free : l'objet ne vient pas de l'inventaire.
function equipItem(m, slot, id, free) {
  m.equip = m.equip || {};
  const old = m.equip[slot];
  if (old) { applyGearStats(m, old, -1); Game.addGear(old); }
  m.equip[slot] = null;
  if (id) {
    if (!free && !Game.useGear(id)) return false;
    m.equip[slot] = id;
    applyGearStats(m, id, 1);
  }
  if (typeof recalcStats === 'function' && m.lv) recalcStats(m);
  return true;
}
function gearDesc(id) {
  const g = GEAR[id];
  const st = Object.keys(g.stats).map(k => STAT_NAMES[k] + ' ' + (g.stats[k] > 0 ? '+' : '') + g.stats[k]).join(', ');
  return st || (g.fx ? 'Accessoire : effet spécial en combat' : '');
}
function itemDef(id) { return ITEMS[id] || GEAR[id]; }

// ---------------- Dessin sur la grille du sprite ----------------
const GearArt = (() => {
  const W = 24, H = 32;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  function line(x0, y0, x1, y1) {
    const pts = [], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    for (;;) {
      pts.push([x, y]);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return pts;
  }
  // mode : 'over' écrase, 'under' seulement dans le vide, 'body' écrase sauf la tête
  function set(g, x, y, ch, mode, c) {
    if (!inb(x, y)) return false;
    if (mode === 'under' && g[y][x] !== '.') return false;
    if (mode === 'body' && c.isHead(x, y)) return false;
    g[y][x] = ch;
    return true;
  }
  function outline(g, cells) {
    for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (inb(nx, ny) && g[ny][nx] === '.') g[ny][nx] = 'k';
    }
  }
  function rows(list) { return list.map(r => (r.length === W / 2 ? r + r.split('').reverse().join('') : r).padEnd(W, '.')); }
  function put(g, list, y0, mode, c) {
    rows(list).forEach((r, j) => { for (let i = 0; i < W; i++) if (r[i] !== '.') set(g, i, y0 + j, r[i], mode || 'over', c); });
  }
  const sideDir = c => c.dir;
  // Bâton ou sabre porté en travers du dos
  const PATH = { down: [23, 10, 2, 30], up: [0, 10, 21, 30], right: [4, 9, 9, 31] };
  function weapon(kind) {
    return (g, c) => {
      const [x0, y0, x1, y1] = PATH[sideDir(c)];
      const pts = line(x0, y0, x1, y1), n = pts.length, mode = c.dir === 'up' ? 'body' : 'under', drawn = [];
      pts.forEach(([x, y], i) => {
        let a = '1', b = '2';
        if (kind === 'staff' && (i < 2 || i >= n - 2)) a = b = '3';
        if (kind === 'sword') {
          if (i < 4) a = b = 'E';
          else if (i === 4) { a = b = '3'; if (set(g, x - 1, y, '3', mode, c)) drawn.push([x - 1, y]); if (set(g, x + 2, y, '3', mode, c)) drawn.push([x + 2, y]); }
          else if (i === n - 1) b = '.';
        }
        if (set(g, x, y, a, mode, c)) drawn.push([x, y]);
        if (b !== '.' && set(g, x + 1, y, b, mode, c)) drawn.push([x + 1, y]);
      });
      outline(g, drawn);
    };
  }
  function gloves(g, c) {
    const y1 = c.dir === 'right' ? 23 : 25;
    for (let y = 19; y <= y1; y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x];
      if (ch === 's' || ch === 't') g[y][x] = '7'; else if (ch === 'S') g[y][x] = '8';
    }
  }
  // Épaulières d'armure
  const PADS = {
    down: ['...kkkk.....', '..k9999k....', '..k9900k....', '...kkkk.....'],
    up: ['...kkkk.....', '..k9999k....', '..k9900k....', '...kkkk.....'],
    right: ['.........kkkkk..........', '........k99990k.........', '........k99000k.........', '.........kkkkk..........'],
  };
  function pads(g, c) { put(g, PADS[sideDir(c)], 17, 'body', c); }
  function shell(g, c) { const o = OVERLAYS.shell[sideDir(c)]; if (o) put(g, o.slice(1), o[0], 'body', c); }
  function badge(g, c) { // petit emblème sur la poitrine (vue de face)
    if (c.dir !== 'down' || c.type !== 'gi') return;
    for (let y = 19; y <= 21; y++) for (let x = 14; x <= 16; x++) g[y][x] = (x === 15 && y === 20) ? 'B' : 'A';
  }
  // Bandeaux, lunettes, casques : posés sur le front de chaque tête
  const ANCHOR = { goku: 8, krillin: 7, bulma: [9, 9, 8], yamcha: [9, 9, 8], oolong: 8 };
  function head(art) {
    return (g, c) => {
      const a = ANCHOR[c.def.head];
      if (a === undefined) return;
      const y = Array.isArray(a) ? a[['down', 'up', 'right'].indexOf(sideDir(c))] : a;
      let L = 99, R = -1;
      for (const r of [y, y + 1]) {
        const row = g[r];
        const l = row.findIndex(ch => ch !== '.'), rr = W - 1 - row.slice().reverse().findIndex(ch => ch !== '.');
        if (l < 0) continue;
        for (let x = l + 1; x < rr; x++) row[x] = r === y ? '4' : '5';
        row[l] = 'k'; row[rr] = 'k';
        L = Math.min(L, l); R = Math.max(R, rr);
      }
      if (R < 0) return;
      const mid = Math.floor((L + R) / 2), drawn = [];
      const dot = (x, yy, ch, mode = 'over') => { if (set(g, x, yy, ch, mode, c)) drawn.push([x, yy]); };
      if (art.knot) {
        if (c.dir === 'right') { dot(L - 1, y + 1, '4', 'under'); dot(L - 2, y + 2, '4', 'under'); dot(L - 1, y + 2, '5', 'under'); dot(L - 2, y + 3, '5', 'under'); }
        if (c.dir === 'up') { dot(11, y, '6'); dot(12, y, '6'); dot(11, y + 2, '4'); dot(11, y + 3, '5'); dot(13, y + 2, '4'); dot(13, y + 3, '5'); }
      }
      if (art.plate && c.dir === 'down') { g[y][11] = g[y][12] = g[y + 1][11] = g[y + 1][12] = '6'; }
      if (art.plate && c.dir === 'right') { g[y][R - 3] = g[y + 1][R - 3] = '6'; }
      if (art.lens) {
        if (c.dir === 'down') for (const x of [mid - 4, mid - 3, mid + 4, mid + 5]) { g[y][x] = '6'; g[y + 1][x] = '6'; }
        if (c.dir === 'right') for (const x of [R - 3, R - 2]) { g[y][x] = '6'; g[y + 1][x] = '6'; }
      }
      if (art.horns) {
        if (c.dir === 'right') { dot(mid, y - 1, '6'); dot(mid + 1, y - 2, '6'); dot(mid + 1, y - 3, '6'); dot(mid + 2, y - 4, '6'); }
        else {
          for (const [dx, dy] of [[1, -1], [0, -2], [0, -3], [-1, -4]]) { dot(L + 1 + dx, y + dy, '6'); dot(R - 1 - dx, y + dy, '6'); }
        }
      }
      outline(g, drawn);
    };
  }
  // Queue de singe de Goku
  const TAIL = {
    down: [[18, 25], [19, 26], [20, 27], [20, 28], [21, 29], [21, 30]],
    up: [[11, 24], [12, 25], [13, 26], [14, 27], [15, 28], [16, 29], [17, 29], [18, 28]],
    right: [[7, 24], [6, 25], [5, 25], [4, 24], [3, 23], [3, 22], [4, 21]],
  };
  function tail(g, c) {
    const d = sideDir(c), mode = d === 'up' ? 'body' : 'under', drawn = [];
    for (const [x, y] of TAIL[d]) { if (set(g, x, y, 'Z', mode, c)) drawn.push([x, y]); if (set(g, x, y + 1, 'b', 'under', c)) drawn.push([x, y + 1]); }
    outline(g, drawn);
  }
  return { weapon, gloves, pads, shell, badge, head, tail };
})();

// Palette d'un groupe de couleurs sur le vêtement
function garmentPal(top, pants, belt) {
  const p = {};
  if (top) Object.assign(p, { c: top[0], C: top[1], q: top[2], a: top[0] });
  if (pants) Object.assign(p, { p: pants[0], P: pants[1], l: pants[0], L: pants[1] });
  if (belt) Object.assign(p, { d: belt[0], D: belt[1], z: belt[2] });
  return p;
}

// Clé de sprite d'un héros, selon son équipement et (pour Goku) son style.
// Sprite de base d'un héros (Lunch change d'apparence quand elle éternue)
function memberSprite(m) { return m.id === 'lunch' && m.form === 'blonde' ? 'lunch_b' : MEMBERS[m.id].sprite; }
function lookKey(m) {
  if (!m) return null;
  const base = memberSprite(m);
  const eq = m.equip || {};
  const st = m.id === 'goku' ? styleOf(m) : null;
  const sig = LOOK_SLOTS.map(s => eq[s] || '').join(',') + (st ? '|' + STYLE_KEYS.map(k => st[k]).join('') : '');
  if (sig === ',,') return base;
  const key = base + '~' + sig;
  if (CHARS[key]) return key;
  const pal = {}, mods = [];
  if (st) {
    const gi = STYLE_OPTS.gi.vals[st.gi], belt = STYLE_OPTS.belt.vals[st.belt], boots = STYLE_OPTS.boots.vals[st.boots], hair = STYLE_OPTS.hair.vals[st.hair];
    Object.assign(pal, garmentPal(gi.slice(1), gi.slice(1), belt.slice(1)));
    Object.assign(pal, { f: boots[1], F: boots[2], x: boots[3], h: hair[1], H: hair[2], j: hair[3] });
    if (st.emblem === 0) Object.assign(pal, { y: gi[1], Y: gi[2] });
    if (st.emblem === 2) Object.assign(pal, { y: '#f8a020', Y: '#c86010', A: '#f8a020', B: '#d82020' });
    if (st.emblem === 1) Object.assign(pal, { A: '#fff8e8', B: '#202028' });
    if (st.emblem) mods.push({ phase: 'body', fn: GearArt.badge });
    if (st.tail) { mods.push({ phase: 'back', fn: GearArt.tail }); Object.assign(pal, { Z: '#8a5a30', b: '#5a3418' }); }
  }
  for (const slot of LOOK_SLOTS) {
    const g = GEAR[eq[slot]];
    if (!g || !g.art) continue;
    const a = g.art;
    if (a.kind === 'staff' || a.kind === 'sword') mods.push({ phase: 'back', fn: GearArt.weapon(a.kind) });
    if (a.kind === 'gloves') mods.push({ phase: 'body', fn: GearArt.gloves });
    if (a.pal) Object.assign(pal, a.pal);
    if (a.top || a.pants || a.belt) Object.assign(pal, garmentPal(a.top, a.pants, a.belt));
    if (a.badge) { mods.push({ phase: 'body', fn: GearArt.badge }); Object.assign(pal, { A: '#fff8e8', B: '#202028', y: '#fff8e8', Y: '#c8c0b0' }); }
    if (a.pads) { mods.push({ phase: 'body', fn: GearArt.pads }); Object.assign(pal, { 9: '#c8d0e8', 0: '#7880a0' }); }
    if (a.shell) { mods.push({ phase: 'body', fn: GearArt.shell }); Object.assign(pal, { u: '#5aa040', U: '#2e6a24' }); }
    if (a.band) {
      mods.push({ phase: 'head', fn: GearArt.head(a) });
      Object.assign(pal, { 4: a.band[0], 5: a.band[1], 6: a.lens || a.plate || a.horns || a.band[0] });
    }
  }
  CHARS[key] = Object.assign({}, CHARS[base], { palOver: pal, mods });
  return key;
}
// Clé de sprite pour un identifiant de héros (personnalisé s'il est dans l'équipe)
function charKey(id) { const m = Game.member(id); return m ? lookKey(m) : (MEMBERS[id] ? MEMBERS[id].sprite : id); }
