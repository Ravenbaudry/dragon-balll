// Progression : compétences, maîtrise des techniques, effets des accessoires, cuisine (pêche, cueillette, recettes).
// Le combat (battle.js) interroge Prog pour chaque bonus.
const SKILLS = {
  vigueur: { name: 'Vigueur', cost: 1, desc: 'PV max +12 %.' },
  esprit: { name: 'Esprit vif', cost: 1, desc: 'Ki max +15 %.' },
  concentration: { name: 'Concentration', cost: 1, desc: '« Charger » rend 50 % du Ki au lieu de 30 %.' },
  parade: { name: 'Parade experte', cost: 1, desc: 'La fenêtre pour parer est plus large.' },
  fortune: { name: 'Chasseur de primes', cost: 1, desc: '+25 % de Zénis après les combats (cumulable).' },
  reflexes: { name: 'Réflexes', cost: 2, desc: 'La jauge de temps se remplit 10 % plus vite.' },
  premier: { name: 'Premier coup', cost: 2, desc: 'Commence chaque combat la jauge pleine.' },
  contre: { name: 'Contre-attaque', cost: 2, desc: '25 % de chances de riposter quand on est frappé au corps à corps.' },
  soigneur: { name: 'Mains guérisseuses', cost: 2, desc: 'Les soins donnés sont 25 % plus efficaces.' },
  tigre: { name: 'Œil du tigre', cost: 2, desc: 'Coups critiques +8 %.' },
  sain: { name: 'Corps sain', cost: 2, desc: 'Immunisé contre le poison et les brûlures.' },
  eveil: { name: 'Sommeil léger', cost: 2, desc: 'Immunisé contre le sommeil et la paralysie.' },
  tenace: { name: 'Ténacité', cost: 3, desc: 'Une fois par combat, survit à un coup fatal avec 1 PV.' },
  maitre: { name: 'Maître du Ki', cost: 3, desc: 'Les techniques de Ki sont 15 % plus puissantes.' },
  colosse: { name: 'Colosse', cost: 3, desc: 'Force et Défense +10 %.' },
};
const SKILL_KEYS = Object.keys(SKILLS);

// Ingrédients (pêche, cueillette, butin) et recettes
Object.assign(ITEMS, {
  poisson: { name: 'Poisson', desc: 'Pêché dans la mer ou l\'étang. À cuisiner (Menu → Cuisine).', ingr: true },
  viande: { name: 'Viande de dino', desc: 'Un beau morceau... Laissé par les dinosaures et les tigres.', ingr: true },
  fruit: { name: 'Fruit sauvage', desc: 'Juteux et sucré. Cueilli sur les arbres et les buissons.', ingr: true },
  champignon: { name: 'Champignon', desc: 'Un champignon des bois (comestible, promis).', ingr: true },
  herbes: { name: 'Herbes aromatiques', desc: 'Des herbes qui sentent bon. Parfaites pour les soupes.', ingr: true },
});
const RECIPES = [
  { id: 'brochettes', name: 'Brochettes de poisson', need: { poisson: 2 }, buff: { atk: 0.15 }, battles: 5, desc: 'Force +15 % pendant 5 combats.' },
  { id: 'salade', name: 'Salade de fruits', need: { fruit: 2 }, buff: { atb: 0.12 }, battles: 5, desc: 'Jauge de temps +12 % pendant 5 combats.' },
  { id: 'ragout', name: 'Ragoût de dinosaure', need: { viande: 1, champignon: 1 }, buff: { def: 0.15, regen: 0.03 }, battles: 5, desc: 'Défense +15 % et récupération de PV, 5 combats.' },
  { id: 'soupe', name: 'Soupe aux herbes', need: { herbes: 1, champignon: 1 }, buff: { mag: 0.12, ki: 2 }, battles: 5, desc: 'Puissance +12 % et 2 Ki par tour, 5 combats.' },
  { id: 'infusion', name: 'Infusion purifiante', need: { herbes: 2 }, buff: { pure: true }, battles: 6, desc: 'Protège du poison et des brûlures, 6 combats.' },
  { id: 'festin', name: 'Festin de Goku', need: { poisson: 1, viande: 1, fruit: 1 }, buff: { atk: 0.1, def: 0.1, mag: 0.1, atb: 0.08 }, battles: 8, desc: 'Force, Défense, Puissance +10 % et jauge +8 %, 8 combats.' },
];
// Maîtrise : nombre d'utilisations pour atteindre les niveaux 2 et 3
const MASTERY_STEPS = [12, 35];

const Prog = (() => {
  const has = (m, id) => !!(m && m.skills && m.skills.includes(id));
  const acc = m => (m && m.equip && m.equip.acc && GEAR[m.equip.acc] ? GEAR[m.equip.acc].fx : null);
  const dish = () => { const d = Game.extra && Game.extra.dish; return d && d.left > 0 ? RECIPES.find(r => r.id === d.id) : null; };
  const buff = k => { const r = dish(); return r && r.buff[k] ? r.buff[k] : 0; };
  const mOf = c => c.m || c;

  // ---------- Compétences ----------
  function points(m) { return Math.floor(m.lv / 2) + (m.spBonus || 0) - (m.skills || []).reduce((s, id) => s + (SKILLS[id] ? SKILLS[id].cost : 0), 0); }
  function learn(m, id) {
    if (has(m, id) || points(m) < SKILLS[id].cost) return false;
    m.skills = (m.skills || []).concat([id]);
    recalcStats(m);
    return true;
  }
  function statMul(m, k) {
    let v = 1;
    if (k === 'hp' && has(m, 'vigueur')) v *= 1.12;
    if (k === 'ki' && has(m, 'esprit')) v *= 1.15;
    if ((k === 'atk' || k === 'def') && has(m, 'colosse')) v *= 1.1;
    if (window.Heroes) v *= window.Heroes.statMul(m, k); // formes de Lunch...
    return v;
  }

  // ---------- Maîtrise des techniques ----------
  function masteryLv(m, id) { const u = (m.mastery || {})[id] || 0; return u >= MASTERY_STEPS[1] ? 3 : u >= MASTERY_STEPS[0] ? 2 : 1; }
  function techCost(m, id) { return Math.max(1, TECHS[id].ki - (masteryLv(m, id) - 1)); }
  function techPow(m, id) { return 1 + 0.1 * (masteryLv(m, id) - 1); }
  function useTech(c, id) {
    const m = mOf(c), before = masteryLv(m, id);
    m.mastery = m.mastery || {};
    m.mastery[id] = (m.mastery[id] || 0) + 1;
    const after = masteryLv(m, id);
    if (after > before) UI.notify('Maîtrise : ' + TECHS[id].name + ' niveau ' + after + ' !', 130);
  }

  // ---------- Effets en combat ----------
  const H = {
    statMul, masteryLv, techCost, techPow, useTech, points, learn,
    atkMul(c, kind) {
      const m = mOf(c);
      let v = 1 + (kind === 'ki' ? buff('mag') : buff('atk'));
      if (kind === 'ki' && has(m, 'maitre')) v *= 1.15;
      if (window.Heroes) v *= window.Heroes.atkMul(c, kind);
      return v;
    },
    defMul() { return 1 + buff('def'); },
    takenMul() { return 1; },
    tenacity(c) { if (!has(mOf(c), 'tenace') || c.tenaceUsed) return false; c.tenaceUsed = true; return true; },
    counter(c) { return has(mOf(c), 'contre') && Math.random() < 0.25; },
    immune(c, st) {
      const m = mOf(c), tox = st === 'poison' || st === 'burn';
      if (tox && (has(m, 'sain') || acc(m) === 'antitox' || buff('pure'))) return true;
      if (!tox && (has(m, 'eveil') || acc(m) === 'awake')) return true;
      return false;
    },
    luckyRevive(c) { if (acc(mOf(c)) !== 'revive' || c.luckyUsed) return false; c.luckyUsed = true; return true; },
    dodge(c) { return (acc(mOf(c)) === 'dodge' ? 0.12 : 0) + (window.Heroes ? window.Heroes.dodge(c) : 0); },
    critBonus(c) { return has(mOf(c), 'tigre') ? 0.08 : 0; },
    parryBonus(c) { return has(mOf(c), 'parade'); },
    chargeRate(c) { return has(mOf(c), 'concentration') ? 0.5 : 0.3; },
    healMul(c) { return has(mOf(c), 'soigneur') ? 1.25 : 1; },
    firstStrike(c) { return has(mOf(c), 'premier'); },
    zeniMul() {
      let v = 1;
      for (const m of Game.party) { if (has(m, 'fortune')) v += 0.25; if (acc(m) === 'zeni') v += 0.5; }
      return v;
    },
    atbMul(c) { const m = mOf(c); return (has(m, 'reflexes') ? 1.1 : 1) * (acc(m) === 'atb' ? 1.15 : 1) * (1 + buff('atb')); },
    onTurn(c, B) { // au début de chaque tour d'un héros
      const m = mOf(c);
      let ki = buff('ki') + (acc(m) === 'kiregen' ? 3 : 0);
      if (ki && c.ki < c.maxki) { ki = Math.min(ki, c.maxki - c.ki); c.ki += ki; }
      const rg = buff('regen') + (acc(m) === 'regen' ? 0.02 : 0);
      if (rg && c.hp > 0 && c.hp < c.maxhp) c.hp = Math.min(c.maxhp, c.hp + Math.max(1, Math.round(c.maxhp * rg)));
      if (window.Heroes) window.Heroes.onTurn(c, B);
    },
    afterBattle() {
      const d = Game.extra && Game.extra.dish;
      if (d && d.left > 0 && --d.left === 0) { const r = RECIPES.find(x => x.id === d.id); UI.notify('L\'effet du plat est terminé' + (r ? ' (' + r.name + ')' : '') + '.', 110); Game.extra.dish = null; }
    },
  };

  // ---------- Cuisine ----------
  const SHORT = { poisson: 'Poisson', viande: 'Viande', fruit: 'Fruit', champignon: 'Champignon', herbes: 'Herbes' };
  const ingrName = id => SHORT[id] || ITEMS[id].name;
  const canCook = r => Object.keys(r.need).every(k => (Game.items[k] || 0) >= r.need[k]);
  function cook(r) {
    for (const k in r.need) { for (let i = 0; i < r.need[k]; i++) Game.useItemStock(k); }
    Game.extra.dish = { id: r.id, left: r.battles };
    for (const m of Game.allMembers()) if (m.hp > 0) m.hp = Math.min(m.maxhp, m.hp + Math.round(m.maxhp * 0.3));
  }

  // ---------- Menus ----------
  function subSkills() {
    return {
      phase: 'member', msel: 0, sel: 0, scroll: 0, confirm: null,
      update() {
        const L = Game.allMembers(), m = L[this.msel];
        const nav = (n, k) => { if (Input.repeat('up')) { this[k] = (this[k] + n - 1) % n; SND.sfx('cursor'); } if (Input.repeat('down')) { this[k] = (this[k] + 1) % n; SND.sfx('cursor'); } };
        if (this.confirm) {
          if (Input.repeat('up') || Input.repeat('down')) { this.confirm.sel = 1 - this.confirm.sel; SND.sfx('cursor'); }
          if (Input.pressed('b')) { this.confirm = null; SND.sfx('cancel'); return; }
          if (Input.pressed('a')) {
            if (this.confirm.sel === 0 && learn(m, this.confirm.id)) { SND.sfx('levelup'); UI.notify(m.name + ' apprend « ' + SKILLS[this.confirm.id].name + ' » !', 100); Field.syncParty(); }
            else SND.sfx('cancel');
            this.confirm = null;
          }
          return;
        }
        if (this.phase === 'member') {
          nav(L.length, 'msel');
          if (Input.pressed('b')) { UI.closeSub(); SND.sfx('cancel'); }
          if (Input.pressed('a')) { this.phase = 'skill'; this.sel = 0; SND.sfx('confirm'); }
          return;
        }
        nav(SKILL_KEYS.length, 'sel');
        if (Input.pressed('b')) { this.phase = 'member'; SND.sfx('cancel'); return; }
        if (Input.pressed('a')) {
          const id = SKILL_KEYS[this.sel];
          if (has(m, id) || points(m) < SKILLS[id].cost) { SND.sfx('buzz'); return; }
          this.confirm = { id, sel: 0 }; SND.sfx('confirm');
        }
      },
      draw() {
        const L = Game.allMembers(), m = L[this.msel];
        UI.win(4, 4, 248, 168);
        L.forEach((p, i) => {
          const y = 10 + i * 22, sp = GFX.char(lookKey(p));
          ctx.save(); ctx.beginPath(); ctx.rect(20, y - 2, 22, 20); ctx.clip(); ctx.drawImage(sp.down[0], 19, y - 4); ctx.restore();
          UI.text(p.name, 44, y + 1, i === this.msel ? '#fff' : '#c0c8e8');
          FONT.drawRight(ctx, points(p) + ' pt', 92, y + 10, points(p) > 0 ? UI.YEL : UI.GRAY);
          if (i === this.msel && this.phase === 'member') UI.cursor(8, y + 1);
        });
        ctx.fillStyle = '#8898e0'; ctx.fillRect(96, 10, 1, 156);
        this.scroll = clamp(this.scroll, Math.max(0, this.sel - 12), this.sel);
        SKILL_KEYS.slice(this.scroll, this.scroll + 13).forEach((id, j) => {
          const i = j + this.scroll, y = 10 + j * 12, S = SKILLS[id], got = has(m, id), ok = !got && points(m) >= S.cost;
          UI.text((got ? '✓ ' : '') + S.name, 114, y, got ? UI.GREEN : ok ? (i === this.sel ? '#fff' : '#c0c8e8') : '#6870a0');
          FONT.drawRight(ctx, got ? '' : S.cost + ' pt', 244, y, ok ? UI.YEL : '#6870a0');
          if (i === this.sel && this.phase === 'skill') UI.cursor(102, y);
        });
        if (this.confirm) {
          UI.win(110, 70, 136, 46);
          UI.text('Apprendre ?', 124, 76, UI.YEL);
          ['Oui', 'Non'].forEach((o, i) => { UI.text(o, 136, 89 + i * 12, i === this.confirm.sel ? '#fff' : '#c0c8e8'); if (i === this.confirm.sel) UI.cursor(124, 89 + i * 12); });
        }
        if (this.phase === 'member') { UI.text('Compétences de qui ?', 12, 182, UI.YEL); UI.text('1 point tous les 2 niveaux. Les compétences sont définitives.', 12, 196, UI.GRAY); }
        else { const S = SKILLS[SKILL_KEYS[this.sel]]; UI.text(S.desc, 12, 182); UI.text(m.name + ' : ' + points(m) + ' point' + (points(m) > 1 ? 's' : '') + ' à dépenser', 12, 196, UI.GRAY); }
      },
    };
  }
  function subCooking() {
    return {
      sel: 0,
      update() {
        const n = RECIPES.length;
        if (Input.repeat('up')) { this.sel = (this.sel + n - 1) % n; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % n; SND.sfx('cursor'); }
        if (Input.pressed('b')) { UI.closeSub(); SND.sfx('cancel'); return; }
        if (Input.pressed('a')) {
          const r = RECIPES[this.sel];
          if (!canCook(r)) { SND.sfx('buzz'); return; }
          cook(r); SND.sfx('heal');
          UI.notify('Miam ! ' + r.name + ' : ' + r.desc, 160);
        }
      },
      draw() {
        UI.win(4, 4, 248, 168);
        FONT.drawCentered(ctx, 'Cuisine de Goku', 128, 9, UI.YEL);
        const d = Game.extra.dish, cur = dish();
        UI.text(cur ? 'Plat actif : ' + cur.name + ' (' + d.left + ' combats)' : 'Aucun plat actif.', 12, 24, cur ? UI.GREEN : UI.GRAY);
        RECIPES.forEach((r, i) => {
          const y = 40 + i * 18, ok = canCook(r);
          UI.text(r.name, 26, y, ok ? (i === this.sel ? '#fff' : '#c0c8e8') : '#6870a0');
          const need = Object.keys(r.need).map(k => ingrName(k) + ' ' + (Game.items[k] || 0) + '/' + r.need[k]).join(', ');
          FONT.draw(ctx, need, 26, y + 9, ok ? '#a8e8b0' : '#6870a0');
          if (i === this.sel) UI.cursor(12, y);
        });
        UI.win(4, 176, 248, 46);
        UI.text(RECIPES[this.sel].desc, 12, 182);
        UI.text('Un plat à la fois. Le repas rend 30 % des PV.', 12, 196, UI.GRAY);
        UI.text('Pêche, cueille... et chasse les dinos !', 12, 208, UI.GRAY);
      },
    };
  }

  // ---------- Points de pêche et de cueillette sur les cartes ----------
  const imgs = {};
  function spotImg(kind) {
    if (imgs[kind]) return imgs[kind];
    const c = GFX.mk(16, 14), x = c.getContext('2d');
    if (kind === 'peche') { // panneau de pêche et poisson
      x.fillStyle = K; x.fillRect(7, 4, 2, 10); x.fillRect(1, 0, 14, 7);
      x.fillStyle = '#a87040'; x.fillRect(2, 1, 12, 5); x.fillStyle = '#7a4c24'; x.fillRect(8, 5, 1, 9);
      x.fillStyle = '#4888e0'; x.fillRect(4, 3, 6, 2); x.fillRect(10, 2, 2, 4); x.fillStyle = '#fff'; x.fillRect(5, 3, 1, 1);
    } else if (kind === 'fruit') {
      x.fillStyle = K; x.beginPath(); x.ellipse(8, 8, 8, 6, 0, 0, 7); x.fill();
      x.fillStyle = '#3c9a44'; x.beginPath(); x.ellipse(8, 8, 7, 5, 0, 0, 7); x.fill();
      x.fillStyle = '#5cc060'; x.fillRect(4, 5, 4, 2);
      for (const [px, py] of [[4, 8], [9, 6], [11, 10], [7, 11]]) { x.fillStyle = '#e83040'; x.fillRect(px, py, 2, 2); x.fillStyle = '#ffa0a0'; x.fillRect(px, py, 1, 1); }
    } else if (kind === 'champignon') {
      for (const [px, s] of [[3, 1], [9, 0]]) {
        x.fillStyle = K; x.fillRect(px + 1, 8 - s, 3, 6 + s); x.fillRect(px - 1, 4 - s, 7, 5);
        x.fillStyle = '#f4ecd8'; x.fillRect(px + 2, 9 - s, 1, 5 + s);
        x.fillStyle = '#d83030'; x.fillRect(px, 5 - s, 5, 3); x.fillStyle = '#fff'; x.fillRect(px + 1, 5 - s, 1, 1); x.fillRect(px + 3, 6 - s, 1, 1);
      }
    } else { // herbes
      x.fillStyle = K; x.fillRect(2, 6, 12, 8);
      x.fillStyle = '#58b048'; for (let i = 0; i < 5; i++) x.fillRect(3 + i * 2, 4 + (i % 2) * 2, 1, 9);
      x.fillStyle = '#a0e080'; x.fillRect(5, 4, 1, 2); x.fillRect(9, 4, 1, 2); x.fillStyle = '#f0e060'; x.fillRect(7, 5, 1, 1);
    }
    return (imgs[kind] = c);
  }
  // cueillette : repousse après 3 minutes de jeu
  function gatherSpot(id, tx, ty, item, n = 1) {
    const kind = item === 'fruit' ? 'fruit' : item === 'champignon' ? 'champignon' : 'herbes';
    return {
      kind: 'npc', id: 'g_' + id, tx, ty, turn: false, get img() { return spotImg(kind); },
      cond: () => { const t = (Game.extra.pick || {})[id]; return t === undefined || Game.playFrames - t > 60 * 180; },
      talk: async e => {
        Game.extra.pick = Game.extra.pick || {};
        Game.extra.pick[id] = Game.playFrames;
        e.gone = true;
        const k = n + (Math.random() < 0.35 ? 1 : 0);
        Game.give(item, k);
        SND.sfx('item');
        await UI.say(null, 'Cueilli : ' + ITEMS[item].name + ' x' + k + ' !');
      },
    };
  }
  function fishSpot(id, tx, ty) {
    return {
      kind: 'npc', id: 'p_' + id, tx, ty, turn: false, get img() { return spotImg('peche'); },
      talk: async () => {
        const g = Game.member('goku');
        const r = await UI.ask(null, 'Un bon coin de pêche. Pêcher un moment ?', ['Pêcher', 'Plus tard'], { cancel: 1 });
        if (r !== 0) return;
        if (!Game.flags.fishTip) { Game.flags.fishTip = true; await UI.say('Goku', styleOf(g).tail ? 'Hé hé, je pêche avec ma queue ! Grand-père m\'a appris !' : 'Je n\'ai plus ma queue... Tant pis, je pêche avec mon bâton !'); }
        const res = await MiniGames.run('peche', g);
        if (!res || !res.score) { await UI.say(null, 'Les poissons ont été plus malins...'); return; }
        Game.give('poisson', res.score);
        SND.sfx('item');
        await UI.say(null, 'Pêché : Poisson x' + res.score + ' !');
      },
    };
  }
  // les nouveaux points sur les cartes existantes
  const SPOTS = {
    paozu: () => [gatherSpot('paozu_f', 4, 4, 'fruit'), gatherSpot('paozu_h', 20, 9, 'herbes')],
    foret: () => [gatherSpot('foret_c1', 9, 19, 'champignon'), gatherSpot('foret_c2', 29, 6, 'champignon'), gatherSpot('foret_f', 31, 16, 'fruit'), fishSpot('foret', 26, 5)],
    plage: () => [gatherSpot('plage_f', 3, 13, 'fruit'), fishSpot('plage', 19, 18)],
    route: () => [gatherSpot('route_c', 7, 12, 'champignon'), gatherSpot('route_h', 25, 4, 'herbes')],
    village: () => [gatherSpot('village_h', 26, 22, 'herbes'), gatherSpot('village_f', 7, 15, 'fruit')],
    desert: () => [gatherSpot('desert_h', 16, 6, 'herbes')],
    frypan: () => [gatherSpot('frypan_h', 26, 13, 'herbes')],
    papaye: () => [fishSpot('papaye', 15, 23), gatherSpot('papaye_f', 30, 18, 'fruit')],
  };
  for (const id in SPOTS) {
    const base = MAPS[id] && MAPS[id].entities;
    if (base) MAPS[id].entities = () => base().concat(SPOTS[id]());
  }

  // ---------- Mini-jeu : la pêche ----------
  const peche = {
    name: 'Pêche', who: 'Pêcheur', noCancel: false,
    help: 'Attends que le bouchon plonge, puis appuie sur Z / A ! Ensuite, appuie quand l\'aiguille passe dans la zone verte pour ferrer le poisson. Trois lancers.',
    init(S) { Object.assign(S, { cast: 0, phase: 'wait', pt: 0, bite: 80 + Math.floor(Math.random() * 120), needle: 0, nd: 1, zone: 0.6, caught: [], msg: '' }); },
    update(S) {
      const G = MiniGames.state();
      S.pt++;
      if (S.phase === 'wait') {
        if (Input.pressed('a')) { S.phase = 'show'; S.msg = 'Trop tôt ! Le poisson s\'enfuit.'; S.caught.push(0); S.pt = 0; SND.sfx('cancel'); }
        else if (S.pt >= S.bite) { S.phase = 'bite'; S.pt = 0; SND.sfx('encounter'); }
      } else if (S.phase === 'bite') {
        if (Input.pressed('a')) { S.phase = 'reel'; S.pt = 0; S.needle = 0; S.nd = 1; S.zone = 0.25 + Math.random() * 0.55; SND.sfx('confirm'); }
        else if (S.pt > 26) { S.phase = 'show'; S.msg = 'Raté... il a filé !'; S.caught.push(0); S.pt = 0; SND.sfx('cancel'); }
      } else if (S.phase === 'reel') {
        S.needle += S.nd * (0.018 + S.cast * 0.004);
        if (S.needle >= 1) { S.needle = 1; S.nd = -1; } else if (S.needle <= 0) { S.needle = 0; S.nd = 1; }
        if (Input.pressed('a')) {
          const d = Math.abs(S.needle - S.zone);
          const n = d < 0.035 ? 2 : d < 0.1 ? 1 : 0;
          S.caught.push(n); S.phase = 'show'; S.pt = 0;
          S.msg = n === 2 ? 'Un énorme poisson ! (x2)' : n === 1 ? 'Un poisson !' : 'Le fil a cassé...';
          SND.sfx(n ? 'item' : 'cancel');
        } else if (S.pt > 300) { S.caught.push(0); S.phase = 'show'; S.pt = 0; S.msg = 'Il s\'est décroché...'; }
      } else if (S.phase === 'show' && S.pt > 70) {
        if (++S.cast >= 3) { G.score = S.caught.reduce((a, b) => a + b, 0); G.done = true; }
        else { S.phase = 'wait'; S.pt = 0; S.bite = 60 + Math.floor(Math.random() * 140); S.msg = ''; }
      }
      G.score = S.caught.reduce((a, b) => a + b, 0);
    },
    rank() { const n = MiniGames.state().score; return n >= 5 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0; },
    draw(S, t) {
      const G = MiniGames.state();
      const g = ctx.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#80c8f8'); g.addColorStop(1, '#c8e8ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, 100);
      ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(210, 28, 12, 0, 7); ctx.fill();
      ctx.fillStyle = '#3878d8'; ctx.fillRect(0, 100, SW, SH - 100);
      for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect((i * 37 + t * 0.4) % SW, 110 + (i * 23) % 100, 10, 1); }
      ctx.fillStyle = '#8a8676'; ctx.beginPath(); ctx.ellipse(40, 112, 44, 14, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#a8a494'; ctx.beginPath(); ctx.ellipse(40, 108, 40, 10, 0, 0, 7); ctx.fill();
      const sp = GFX.char(G.key);
      ctx.drawImage(sp.right[0], 20, 46, 48, 64);
      // ligne et bouchon
      const bx = 170, by = 120 + (S.phase === 'bite' ? 6 + Math.sin(t * 0.8) * 3 : Math.sin(t * 0.06) * 2);
      ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(62, 70); ctx.quadraticCurveTo(120, 60, bx, by - 4); ctx.stroke();
      ctx.fillStyle = K; ctx.fillRect(bx - 3, by - 6, 7, 8); ctx.fillStyle = '#e83030'; ctx.fillRect(bx - 2, by - 5, 5, 3); ctx.fillStyle = '#fff'; ctx.fillRect(bx - 2, by - 2, 5, 3);
      if (S.phase === 'bite') { FONT.draw(ctx, '!', bx - 1, by - 22, '#ff4040'); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(bx, by + 2, 10 + (t % 10), 3, 0, 0, 7); ctx.stroke(); }
      if (S.phase === 'reel') {
        UI.win(40, 150, 176, 34);
        ctx.fillStyle = '#20204a'; ctx.fillRect(52, 164, 152, 8);
        ctx.fillStyle = '#2a8a3a'; ctx.fillRect(52 + Math.round(152 * (S.zone - 0.1)), 164, Math.round(152 * 0.2), 8);
        ctx.fillStyle = '#80f080'; ctx.fillRect(52 + Math.round(152 * (S.zone - 0.035)), 164, Math.round(152 * 0.07), 8);
        ctx.fillStyle = '#fff'; ctx.fillRect(52 + Math.round(152 * S.needle) - 1, 160, 3, 16);
        FONT.drawCentered(ctx, 'Ferre dans le vert !', 128, 152, UI.YEL);
      }
      FONT.draw(ctx, 'Lancer ' + Math.min(3, S.cast + 1) + ' / 3', 8, 6, '#203050');
      FONT.drawRight(ctx, 'Poissons : ' + G.score, 248, 6, '#203050');
      if (S.msg) FONT.drawCentered(ctx, S.msg, 128, 196, '#ffffff');
      else if (S.phase === 'wait') FONT.drawCentered(ctx, 'Patience...', 128, 196, '#d0e8ff');
    },
  };
  if (typeof MiniGames !== 'undefined') MiniGames.GAMES.peche = peche;

  return Object.assign(H, { subSkills, subCooking, gatherSpot, fishSpot, RECIPES, dish, has });
})();
window.Prog = Prog;
