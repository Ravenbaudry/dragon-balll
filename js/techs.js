// Techniques personnalisées : le joueur choisit la forme, la cible, les couleurs, la taille, l'effet et le coût en Ki.
// La puissance découle du coût, ce qui garde l'équilibre du jeu.
const TECH_FORMS = {
  vague: { name: 'Vague', desc: 'Un rayon d\'énergie, comme le Kamehameha.', targets: ['enemy', 'allEnemies'], base: 1.0 },
  boule: { name: 'Boule', desc: 'Une sphère d\'énergie lancée en cloche, qui explose.', targets: ['enemy', 'allEnemies'], base: 1.05 },
  disque: { name: 'Disque', desc: 'Un disque tranchant qui ignore presque toute la défense.', targets: ['enemy'], base: 0.85 },
  rafale: { name: 'Rafale', desc: 'Une volée de petites boules d\'énergie.', targets: ['enemy', 'allEnemies'], base: 1.0 },
  meteore: { name: 'Météores', desc: 'Une pluie d\'énergie tombe du ciel sur la cible.', targets: ['allEnemies', 'enemy'], base: 0.95 },
  poing: { name: 'Poing', desc: 'Une charge éclair, le poing chargé de Ki (utilise la Force).', targets: ['enemy'], base: 1.15 },
  soin: { name: 'Aura de soin', desc: 'Une aura apaisante qui referme les blessures.', targets: ['ally', 'allAllies'], base: 1 },
};
const TECH_FORM_KEYS = Object.keys(TECH_FORMS);
const TARGET_NAMES = { enemy: 'Un ennemi', allEnemies: 'Tous les ennemis', ally: 'Un allié', allAllies: 'Toute l\'équipe' };
const TECH_COLORS = [
  ['Bleu Kamé', '#3070f8', '#80c8ff'], ['Jaune', '#d8a010', '#fff080'], ['Rose', '#d84890', '#ffa8d8'], ['Vert', '#28a040', '#90f090'],
  ['Rouge', '#d02020', '#ff9070'], ['Violet', '#7030c0', '#c8a0ff'], ['Blanc', '#a0a8c0', '#ffffff'], ['Orange', '#e06010', '#ffb050'],
  ['Cyan', '#10a0b8', '#90f8ff'], ['Ombre', '#302040', '#a070d0'], ['Doré', '#c08810', '#fff0a0'],
];
const TECH_SIZES = ['Petite', 'Moyenne', 'Énorme'];
const TECH_EFFECTS = {
  none: { name: 'Aucun', cost: 0, desc: 'Pas d\'effet en plus : toute l\'énergie va dans la puissance.' },
  stun: { name: 'Paralysie', cost: 4, desc: '35 % de chances de paralyser la cible un moment.' },
  pierce: { name: 'Perce-garde', cost: 3, desc: 'Ignore une grande partie de la défense.' },
  drain: { name: 'Vol de vie', cost: 4, desc: 'Le lanceur récupère 25 % des dégâts en PV.' },
  crit: { name: 'Critique', cost: 3, desc: '30 % de chances de coup critique (x1,5).' },
  revive: { name: 'Réveil', cost: 6, desc: 'Ranime aussi les alliés K.O. (40 % des PV).' },
  poison: { name: 'Poison', cost: 4, desc: '50 % de chances d\'empoisonner la cible.' },
  burn: { name: 'Brûlure', cost: 4, desc: '45 % de chances de brûler la cible.' },
};
const ATTACK_EFFECTS = ['none', 'stun', 'pierce', 'drain', 'crit', 'poison', 'burn'], HEAL_EFFECTS = ['none', 'revive'];
const MAX_CUSTOM = 4, COST_MIN = 2, COST_MAX = 30;

const CustomTech = (() => {
  const isHeal = d => d.form === 'soin';
  function effects(d) { return isHeal(d) ? HEAL_EFFECTS : ATTACK_EFFECTS; }
  // Puissance tirée du coût (après le coût de l'effet)
  function power(d) {
    const left = Math.max(1, d.cost - TECH_EFFECTS[d.effect].cost);
    const all = d.target === 'allEnemies' || d.target === 'allAllies';
    if (isHeal(d)) return { pow: (0.8 + 0.36 * left) * (all ? 0.5 : 1), base: Math.round((10 + 3.6 * left) * (all ? 0.6 : 1)) };
    return { pow: Math.max(0.6, 1.2 + 0.26 * left) * TECH_FORMS[d.form].base * (all ? 0.55 : 1) };
  }
  function stars(d) { const p = power(d).pow * (d.target === 'allEnemies' || d.target === 'allAllies' ? 1.8 : 1); return clamp(Math.round(p / (isHeal(d) ? 1.6 : 1.5)), 1, 5); }
  // Estimation contre un ennemi de référence (défense 20)
  function estimate(m, d) {
    const p = power(d);
    if (isHeal(d)) return Math.round(m.mag * p.pow + p.base);
    if (d.form === 'poing') return Math.round(m.atk * m.atk / (m.atk + 20) * p.pow);
    const defMul = d.form === 'disque' || d.effect === 'pierce' ? 0.15 : 0.6;
    return Math.round(m.mag * m.mag / (m.mag + 20 * defMul) * p.pow);
  }
  function describe(d) { return TECH_FORMS[d.form].name + ', ' + TARGET_NAMES[d.target].toLowerCase() + (d.effect !== 'none' ? ', ' + TECH_EFFECTS[d.effect].name.toLowerCase() : ''); }
  const techId = (m, d) => 'x_' + m.id + '_' + d.uid;
  function register(m, d) {
    const p = power(d), heal = isHeal(d);
    const id = techId(m, d);
    TECHS[id] = {
      name: d.name, ki: d.cost, target: heal && d.effect === 'revive' && d.target === 'ally' ? 'allyAny' : d.target,
      kind: heal ? 'heal' : d.form === 'poing' ? 'phys' : 'ki', pow: p.pow, base: p.base, anim: 'custom', custom: d,
      field: heal && d.effect !== 'revive', desc: 'Technique perso : ' + describe(d) + '.',
    };
    if (!m.techs.includes(id)) m.techs.push(id);
    return id;
  }
  function save(m, d) {
    m.custom = m.custom || [];
    if (!d.uid) { Game.flags.techSeq = (Game.flags.techSeq || 0) + 1; d.uid = String(Game.flags.techSeq); m.custom.push(d); }
    else { const i = m.custom.findIndex(c => c.uid === d.uid); if (i >= 0) m.custom[i] = d; else m.custom.push(d); }
    return register(m, d);
  }
  function remove(m, d) {
    const id = techId(m, d);
    m.custom = (m.custom || []).filter(c => c.uid !== d.uid);
    m.techs = m.techs.filter(t => t !== id);
  }
  function fresh() {
    return { name: randomName(), form: 'vague', target: 'enemy', color: 0, glow: 6, size: 1, effect: 'none', cost: 8 };
  }
  const PRE = ['Super', 'Méga', 'Ultra', 'Double', 'Tornade', 'Éclair', 'Dragon', 'Flamme', 'Tonnerre', 'Comète', 'Turbo'];
  const CORE = ['Kamé', 'Canon', 'Vague', 'Rayon', 'Poing', 'Boule', 'Disque', 'Blast', 'Météore', 'Flash', 'Typhon'];
  const SUF = ['Final', 'Géant', 'Céleste', 'Ultime', 'Sacré', 'Express', 'X', 'Zéro', 'Spécial'];
  function randomName() {
    for (;;) {
      const n = pick(PRE) + ' ' + pick(CORE) + (Math.random() < 0.5 ? ' ' + pick(SUF) : '');
      if (n.length <= 16) return n;
    }
  }

  // ---------- Déroulé visuel (commun à l'aperçu et au combat) ----------
  // caster : {x, y} (pieds) ; targets : [{x, y, cx, cy}] ; renvoie des événements datés en images.
  function timeline(d, caster, targets) {
    const C = TECH_COLORS[d.color], G = TECH_COLORS[d.glow];
    const c1 = C[1], c2 = C[2], c3 = G[2];
    const S = [0.7, 1, 1.45][d.size];
    const hx = caster.x + 8, hy = caster.y - 13;
    const ev = [], all = targets.length > 1 || d.target === 'allEnemies' || d.target === 'allAllies';
    const charge = (at, life, x = hx, y = hy) => ev.push({ at, pose: 'attack', sfx: 'charge', fx: { type: 'charge', x, y, life, c: c2 } });
    switch (d.form) {
      case 'vague': {
        charge(0, 36);
        const ty = targets.reduce((s, t) => s + t.cy, 0) / targets.length;
        ev.push({ at: 36, sfx: 'beam', fx: all ? { type: 'beam', x1: hx, y1: hy, x2: hx + 320, y2: ty, life: 50, w: 10 * S, c1, c2, c3 } : { type: 'beam', x1: hx, y1: hy, x2: targets[0].cx, y2: targets[0].cy, life: 46, w: 7 * S, c1, c2, c3 } });
        targets.forEach((t, i) => ev.push({ at: 48 + i * 4, hit: i }));
        return { ev, dur: 96 };
      }
      case 'boule': {
        charge(0, 30, hx, hy - 3);
        targets.forEach((t, i) => {
          ev.push({ at: 30 + i * 4, sfx: 'blast', fx: { type: 'orb', x1: hx, y1: hy - 3, x2: t.cx, y2: t.cy, life: 22, arc: 40, r: 6 * S, c: c2, c2: c3 } });
          ev.push({ at: 52 + i * 4, sfx: 'bighit', fx: { type: 'boom', x: t.cx, y: t.cy, r: 18 * S, c1, c2, c3 }, hit: i });
        });
        return { ev, dur: 82 + targets.length * 4 };
      }
      case 'disque': {
        charge(0, 30, caster.x + 2, caster.y - 30);
        ev.push({ at: 30, sfx: 'disc', fx: { type: 'disc', x1: caster.x + 2, y1: caster.y - 30, x2: targets[0].cx, y2: targets[0].cy, life: 18, w: 9 * S, c1, c2: c3 } });
        ev.push({ at: 48, hit: 0 });
        return { ev, dur: 76 };
      }
      case 'rafale': {
        charge(0, 20);
        for (let k = 0; k < 6; k++) {
          const i = k % targets.length, t = targets[i];
          ev.push({ at: 20 + k * 6, pose: k % 2 ? null : 'attack', sfx: 'blast', fx: { type: 'orb', x1: hx, y1: hy, x2: t.cx + rand(-3, 3), y2: t.cy + rand(-3, 3), life: 10, r: 3 * S, c: c2, c2: c3 } });
          ev.push({ at: 30 + k * 6, fx: { type: 'boom', x: t.cx, y: t.cy, r: 8 * S, life: 14, c1, c2, c3 }, hit: i, part: 1 / 6 * (all ? targets.length : 1) });
        }
        return { ev, dur: 30 + 6 * 6 + 24 };
      }
      case 'meteore': {
        charge(0, 26, hx, hy - 6);
        ev.push({ at: 24, sfx: 'blast', fx: { type: 'orb', x1: hx, y1: hy - 6, x2: hx + 10, y2: hy - 140, life: 14, r: 4 * S, c: c2, c2: c3 } });
        targets.forEach((t, i) => {
          for (let k = 0; k < 3; k++) {
            const at = 40 + i * 5 + k * 9, ox = (k - 1) * 7;
            ev.push({ at, fx: { type: 'orb', x1: t.cx + ox + 30, y1: t.cy - 120, x2: t.cx + ox, y2: t.cy, life: 14, r: 4 * S, c: c2, c2: c3 } });
            ev.push({ at: at + 14, sfx: k === 2 ? 'bighit' : 'hit', fx: { type: 'boom', x: t.cx + ox, y: t.cy, r: 12 * S, life: 18, c1, c2, c3 }, hit: i, part: 1 / 3 });
          }
        });
        return { ev, dur: 40 + targets.length * 5 + 3 * 9 + 40 };
      }
      case 'poing': {
        ev.push({ at: 0, sfx: 'charge', fx: { type: 'charge', x: caster.x, y: caster.y - 14, life: 22, c: c2 } });
        const t = targets[0];
        ev.push({ at: 22, dash: true });
        ev.push({ at: 34, sfx: 'bighit', fx: { type: 'boom', x: t.cx, y: t.cy, r: 16 * S, life: 20, c1, c2, c3 }, hit: 0 });
        return { ev, dur: 70 };
      }
      case 'soin': {
        ev.push({ at: 0, pose: 'attack', sfx: 'heal', fx: { type: 'charge', x: hx, y: hy, life: 20, c: c2 } });
        targets.forEach((t, i) => { ev.push({ at: 16 + i * 3, fx: { type: 'sparkle', x: t.cx, y: t.y, life: 36, c: c2 } }); ev.push({ at: 28 + i * 3, hit: i }); });
        return { ev, dur: 64 };
      }
    }
    return { ev, dur: 30 };
  }

  // ---------- En combat ----------
  // H : fonctions du combat (fx, wait, damage, heal, center, kiDmg, physDmg, melee, pop, party)
  async function run(T, a, targets, H) {
    const d = T.custom, heal = isHeal(d);
    if (heal && d.effect === 'revive' && d.target === 'allAllies') targets = H.party();
    const tg = targets.map(t => { const [cx, cy] = H.center(t); return { x: t.x, y: t.y, cx, cy }; });
    const { ev, dur } = timeline(d, { x: a.x, y: a.y }, tg);
    const p = power(d);
    const hit = (t, part) => {
      if (heal) {
        if (t.hp <= 0) { if (d.effect === 'revive') { t.hp = Math.max(1, Math.floor(t.maxhp * 0.4)); t.atb = 0; H.pop(t, 'Debout !', '#80ff90'); } }
        else { H.heal(t, Math.round(a.mag * p.pow + p.base)); H.cure(t); }
        return;
      }
      if (t.dead || t.hp <= 0) return;
      const pierce = d.form === 'disque' || d.effect === 'pierce';
      let n = d.form === 'poing' ? H.physDmg(a, t, p.pow) : H.kiDmg(a, t, p.pow, pierce ? 0.15 : 0.6);
      if (part) n = Math.max(1, Math.round(n * part));
      if (d.effect === 'crit' && Math.random() < 0.3) { n = Math.round(n * 1.5); H.pop(t, 'Critique !', '#ffe060'); }
      H.damage(t, n, { big: !part });
      if (d.effect === 'drain' && a.hp > 0) H.heal(a, Math.max(1, Math.round(n * 0.25)));
      if (d.effect === 'stun') H.status(t, 'stun', 0.35);
      if (d.effect === 'poison') H.status(t, 'poison', 0.5);
      if (d.effect === 'burn') H.status(t, 'burn', 0.45);
    };
    if (d.form === 'poing') { // charge, puis ruée au corps à corps
      for (const e of ev) if (e.at === 0) { SND.sfx(e.sfx); H.fx(e.fx.type, Object.assign({}, e.fx)); }
      await H.wait(22);
      const t = targets[0], boom = ev.find(e => e.hit === 0);
      await H.melee(a, t, async () => { const [cx, cy] = H.center(t); H.fx('boom', Object.assign({}, boom.fx, { x: cx, y: cy })); SND.sfx('bighit'); hit(t); }, { fast: true, hold: 14 });
      return;
    }
    for (let f = 0; f <= dur; f++) {
      for (const e of ev) {
        if (e.at !== f) continue;
        if (e.pose !== undefined) a.pose = e.pose;
        if (e.sfx) SND.sfx(e.sfx);
        if (e.fx) H.fx(e.fx.type, Object.assign({}, e.fx));
        if (e.hit !== undefined && targets[e.hit]) hit(targets[e.hit], e.part);
      }
      await H.wait(1);
    }
    a.pose = null;
  }

  // ---------- Aperçu animé (atelier) ----------
  function preview(d, member, box) {
    const P = { d, t: 0, fx: [], flash: [], member, box, dash: 0 };
    const multi = d.target === 'allEnemies' || d.target === 'allAllies';
    const bx = box.x, by = box.y;
    P.caster = { x: bx + 20, y: by + box.h - 12 };
    const spots = multi ? [[bx + box.w - 34, by + 40], [bx + box.w - 14, by + 60], [bx + box.w - 32, by + 82]] : [[bx + box.w - 24, by + box.h - 12]];
    P.targets = spots.map(([x, y]) => ({ x, y, cx: x, cy: y - (isHeal(d) ? 16 : 12) }));
    const tl = timeline(d, P.caster, P.targets);
    P.ev = tl.ev; P.dur = tl.dur + 30;
    return P;
  }
  function stepPreview(P) {
    P.t++;
    if (P.t > P.dur) { P.t = 0; P.fx = []; P.dash = 0; }
    for (const e of P.ev) {
      if (e.at !== P.t) continue;
      if (e.pose !== undefined) P.pose = e.pose;
      if (e.fx) P.fx.push(Object.assign({ t: 0 }, e.fx));
      if (e.dash) P.dash = 1;
      if (e.hit !== undefined) {
        const t = P.targets[e.hit];
        P.flash[e.hit] = 8;
        const n = estimate(P.member, P.d);
        if (!e.part || Math.random() < 0.4) P.fx.push({ type: 'text', x: t.cx, y: t.cy - 14, str: (isHeal(P.d) ? '+' : '-') + Math.max(1, Math.round(n * (e.part || 1))), c: isHeal(P.d) ? '#80ff90' : '#ffffff', life: 34, t: 0 });
      }
    }
    if (P.dash > 0 && P.dash < 30) P.dash++;
    P.flash = P.flash.map(f => Math.max(0, (f || 0) - 1));
  }
  function drawPreview(P) {
    const { x, y, w, h } = P.box;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#3a2a70'); g.addColorStop(1, '#a86060');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a7a3a'; ctx.fillRect(x, y + h - 22, w, 22); ctx.fillStyle = '#4a6a30'; ctx.fillRect(x, y + h - 22, w, 2);
    const heal = isHeal(P.d);
    P.targets.forEach((t, i) => {
      const fl = P.flash[i] > 0, sx = fl && !heal ? Math.round(rand(-1, 1)) : 0;
      if (heal) { const k = ['krillin', 'bulma', 'yamcha'][i % 3]; ctx.drawImage(GFX.char(charKey(k)).left[0], t.x - 12 + sx, t.y - 32); }
      else { // mannequin d'entraînement
        ctx.fillStyle = K; ctx.fillRect(t.x - 2 + sx, t.y - 8, 4, 8); ctx.fillRect(t.x - 7 + sx, t.y - 24, 14, 17); ctx.fillRect(t.x - 4 + sx, t.y - 31, 8, 8);
        ctx.fillStyle = '#8a5a30'; ctx.fillRect(t.x - 1 + sx, t.y - 8, 2, 7);
        ctx.fillStyle = fl ? '#ffffff' : '#d8b860'; ctx.fillRect(t.x - 6 + sx, t.y - 23, 12, 15); ctx.fillRect(t.x - 3 + sx, t.y - 30, 6, 6);
        ctx.fillStyle = fl ? '#ffffff' : '#a88838'; ctx.fillRect(t.x - 6 + sx, t.y - 16, 12, 2);
      }
    });
    // le lanceur (avance pour le poing)
    const spr = GFX.char(lookKey(P.member));
    const dx = P.dash ? Math.min(1, P.dash / 10) * (P.targets[0].x - P.caster.x - 20) * (P.dash < 20 ? 1 : Math.max(0, (30 - P.dash) / 10)) : 0;
    ctx.drawImage(P.pose === 'attack' || (P.dash > 8 && P.dash < 22) ? spr.attack : spr.right[0], Math.round(P.caster.x - 12 + dx), P.caster.y - 32);
    P.fx = P.fx.filter(f => { const keep = Battle.drawFx(f, 0, 0); f.t++; return keep; });
    ctx.restore();
  }
  return { power, stars, estimate, describe, register, save, remove, fresh, randomName, effects, isHeal, run, preview, stepPreview, drawPreview, techId };
})();
