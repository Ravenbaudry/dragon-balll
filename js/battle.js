// Combat ATB "sur le terrain" à la Chrono Trigger : pas d'écran séparé, techniques doubles.
const Battle = (() => {
  let B = null;
  const CMDS = ['Attaque', 'Tech', 'Objet', 'Garde', 'Charger', 'Fuir'];
  const P = () => window.Prog; // progression (compétences, accessoires, plats, maîtrise) : voir progress.js
  // États : poison et brûlure font perdre des PV régulièrement, sommeil et paralysie bloquent la jauge
  const ST = { poison: { name: 'Empoisonné', col: '#c080f0' }, burn: { name: 'Brûlé', col: '#ff9040' }, sleep: { name: 'Endormi', col: '#80a8ff' }, stun: { name: 'Paralysé', col: '#ffe060' } };
  const P_SLOTS = [[86, 118], [58, 96], [60, 142]];
  const E_SLOTS = {
    1: [[182, 114]],
    2: [[174, 96], [200, 134]],
    3: [[178, 88], [208, 116], [174, 142]],
    4: [[170, 84], [206, 96], [176, 136], [212, 146]],
    5: [[166, 80], [202, 88], [184, 114], [166, 146], [212, 142]],
  };

  // ---------- Combattants ----------
  function partyC(m, actor) {
    const c = { side: 'p', m, id: m.id, name: m.name, sprite: lookKey(m), x: actor.x, y: actor.y, atb: 30 + Math.random() * 40, flash: 0, z: 0, pose: null, walking: false, queued: false, stun: 0, sleep: 0, poison: 0, burn: 0, guard: false, charged: false, anim: 0, actor };
    for (const k of ['hp', 'maxhp', 'ki', 'maxki', 'atk', 'def', 'mag', 'spd']) Object.defineProperty(c, k, { get: () => m[k], set: v => { m[k] = v; } });
    return c;
  }
  function enemyC(id, x, y) {
    const d = ENEMIES[id], hp = Math.max(1, Math.round(d.hp * Opt.enemyHp()));
    return { side: 'e', d, id, name: d.name, hp, maxhp: hp, atk: d.atk, def: d.def, mag: d.atk, spd: d.spd, x, y, atb: Math.random() * 50, flash: 0, z: 0, alpha: 1, dead: false, queued: false, stun: 0, sleep: 0, poison: 0, burn: 0, anim: 0, pose: null };
  }
  const livingParty = () => B.party.filter(c => c.hp > 0);
  const livingEnemies = () => B.enemies.filter(c => !c.dead && c.hp > 0);

  // ---------- Démarrage ----------
  function start(group, opts = {}) {
    return new Promise(async res => {
      const F = Field;
      F.battle = true; F.camLock = true;
      const cx = F.camX, cy = F.camY;
      const boss = group.some(id => ENEMIES[id].boss);
      B = {
        res, opts, boss, party: [], enemies: [], ready: [], actions: [], busy: true, menu: null, msg: null, pops: [], fx: [], phase: 'intro', t: 0,
        canFlee: opts.canFlee !== undefined ? opts.canFlee : !boss, saved: F.actors.map(a => ({ a, x: a.x, y: a.y, dir: a.dir })),
        prevMusic: SND.current(),
      };
      SND.sfx('encounter');
      SND.playMusic(opts.music || (boss ? 'boss' : 'battle'));
      B.party = Game.party.map((m, i) => partyC(m, F.actors[i]));
      const slots = E_SLOTS[Math.min(5, group.length)];
      group.forEach((id, i) => {
        let [sx, sy] = ENEMIES[id].slot || (ENEMIES[id].big ? [186, 124] : slots[i]);
        const e = enemyC(id, sx + cx, sy + cy);
        if (opts.ent && i === 0) { e.x = opts.ent.x; e.y = opts.ent.y; }
        else if (opts.positions && opts.positions[i]) { e.x = opts.positions[i][0]; e.y = opts.positions[i][1]; }
        else { e.z = 120; e.alpha = 0; }
        e.tx = sx + cx; e.ty = sy + cy;
        B.enemies.push(e);
      });
      if (opts.boost) for (const e of B.enemies) { // arène : ennemis renforcés
        e.maxhp = e.hp = Math.round(e.hp * opts.boost);
        e.atk = Math.round(e.atk * (1 + (opts.boost - 1) * 0.6)); e.def = Math.round(e.def * (1 + (opts.boost - 1) * 0.5));
      }
      if (opts.hp) { // points de vie imposés au départ (combat qui reprend)
        if (opts.hp.party) for (const c of B.party) c.hp = Math.max(1, Math.round(c.maxhp * opts.hp.party));
        if (opts.hp.enemy) for (const e of B.enemies) e.hp = Math.max(1, Math.round(e.maxhp * opts.hp.enemy));
      }
      // mise en place
      await wait(10);
      const moves = B.party.map((c, i) => {
        const [sx, sy] = P_SLOTS[i];
        c.walking = true;
        return Promise.all([Tasks.tween(c, { x: sx + cx, y: sy + cy }, 24, 'inOut'), arc(c, 10, 24)]).then(() => { c.walking = false; });
      });
      const emoves = B.enemies.map(e => {
        if (e.z > 0) return Promise.all([Tasks.tween(e, { z: 0, alpha: 1, x: e.tx, y: e.ty }, 26, 'in')]).then(() => SND.sfx('hit'));
        return Tasks.tween(e, { x: e.tx, y: e.ty }, 20);
      });
      await Promise.all(moves.concat(emoves));
      for (const c of B.party) if (c.hp <= 0) c.atb = 0; else if (P() && P().firstStrike(c)) c.atb = 100;
      B.phase = 'main'; B.busy = false;
      if (opts.intro) { B.busy = true; await opts.intro(); B.busy = false; }
    });
  }
  async function arc(c, h, frames) {
    for (let i = 0; i <= frames; i++) { c.z = Math.sin(i / frames * Math.PI) * h; await wait(1); }
    c.z = 0;
  }

  // ---------- Calculs ----------
  // multiplicateurs : bonus du lanceur (frappe au bon moment, concentration, maîtrise, plats...), difficulté, résistances
  function outMul(a, kind) {
    if (a.side === 'e') return Opt.enemyDmg();
    return (a.qteMul || 1) * (a.charged ? 1.25 : 1) * (a.techMul || 1) * (P() ? P().atkMul(a, kind) : 1);
  }
  function defOf(t) { return t.def * (t.side === 'p' && P() ? P().defMul(t) : 1); }
  function resMul(t, kind) {
    if (t.side !== 'e') return 1;
    const r = t.d.res && t.d.res[kind] !== undefined ? t.d.res[kind] : (t.d.fly ? (kind === 'phys' ? 0.6 : 1.2) : 1);
    if (r > 1.15) t.tag = ['Efficace !', '#ffb040']; else if (r < 0.85) t.tag = ['Résiste', '#a0a8c8'];
    return r;
  }
  function coverMul(t) { // un ennemi collé à un rocher ou un arbre est à couvert des attaques de Ki
    if (t.side !== 'e' || !Field.map) return 1;
    const tx = Math.floor(t.x / 16), ty = Math.floor((t.y - 4) / 16);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) if ('rRTkPnY'.includes(Field.tileAt(tx + dx, ty + dy) || '.')) { t.tag = ['À couvert', '#a0d0a0']; return 0.75; }
    return 1;
  }
  function physDmg(a, t, pow) {
    const atk = a.atk, def = defOf(t);
    return Math.max(1, Math.round(atk * atk / (atk + def) * pow * rand(0.9, 1.1) * outMul(a, 'phys') * resMul(t, 'phys')));
  }
  function kiDmg(a, t, pow, defMul = 0.6) {
    const mag = a.side === 'e' ? a.atk : a.mag;
    return Math.max(1, Math.round(mag * mag / (mag + defOf(t) * defMul) * pow * rand(0.9, 1.1) * outMul(a, 'ki') * resMul(t, 'ki') * coverMul(t)));
  }
  function pop(c, str, col = '#fff') { B.pops.push({ x: c.x, y: c.y - spriteH(c) - 4, str: String(str), col, t: 0 }); }
  function spriteH(c) {
    if (c.side === 'p' || c.d.char) return 30;
    return GFX.monster(c.d.spr).h + (c.d.fly ? 8 : 0);
  }
  function center(c) { return [c.x, c.y - spriteH(c) / 2 - c.z]; }
  function damage(t, n, opts = {}) {
    if (t.dead || (t.side === 'p' && t.hp <= 0)) return;
    if (t.side === 'p' && !opts.dot) { // garde, parade et protections
      if (t.guard) n *= 0.5;
      if (B.parry) n *= B.parry;
      if (P()) n *= P().takenMul(t);
      n = Math.max(1, Math.round(n));
    }
    if (t.side === 'p' && t.hp - n <= 0 && t.hp > 1 && P() && P().tenacity(t)) { n = t.hp - 1; fx('text', { x: t.x, y: t.y - 44, str: 'Ténacité !', c: '#ffb040', life: 50 }); }
    t.hp = Math.max(t.side === 'e' && t.d.unkillable ? 1 : 0, t.hp - n); // le singe géant ne tombe pas
    if (t.side === 'e' && t.d.yieldAt && t.hp <= t.maxhp * t.d.yieldAt) { t.hp = Math.max(1, t.hp); t.yielded = true; } // combat interrompu
    pop(t, n, opts.col || '#fff');
    if (t.tag) { fx('text', { x: t.x, y: t.y - spriteH(t) - 16, str: t.tag[0], c: t.tag[1], life: 36 }); t.tag = null; }
    if (t.sleep > 0 && !opts.dot) { t.sleep = 0; pop(t, 'Réveillé', '#80a8ff'); }
    t.flash = 10;
    if (opts.big) Game.shake = 8;
    SND.sfx(opts.big ? 'bighit' : 'hit');
    const [x, y] = center(t);
    fx('spark', { x, y });
    if (t.hp <= 0) onKO(t);
    // contre-attaque (compétence)
    else if (t.side === 'p' && opts.melee && opts.from && opts.from.side === 'e' && P() && P().counter(t)) {
      const f = opts.from;
      (async () => { await wait(10); if (B && !f.dead && f.hp > 0 && t.hp > 0) { fx('text', { x: t.x, y: t.y - 44, str: 'Riposte !', c: '#80f0ff', life: 40 }); damage(f, physDmg(t, f, 0.7)); } })();
    }
  }
  function addStatus(t, st, chance = 1, dur) {
    if (!t || t.dead || t.hp <= 0 || Math.random() >= chance) return false;
    if ((t.side === 'e' && t.d.immune && t.d.immune.includes(st)) || (t.side === 'p' && P() && P().immune(t, st))) { pop(t, 'Immunisé', '#c0c8e8'); return false; }
    const boss = t.side === 'e' && t.d.boss;
    if (st === 'poison') t.poison = 4;
    else if (st === 'burn') t.burn = 3;
    else if (st === 'sleep') t.sleep = boss ? 140 : 300;
    else if (st === 'stun') t.stun = Math.max(t.stun, dur || (boss ? 120 : 180));
    if ((st === 'stun' || st === 'sleep') && t.charging) { t.charging = null; fx('text', { x: t.x, y: t.y - spriteH(t) - 26, str: 'Interrompu !', c: '#80f0ff', life: 50 }); }
    pop(t, ST[st].name, ST[st].col);
    return true;
  }
  function cure(t) { if (t.poison || t.burn || t.sleep || (t.side === 'p' && t.stun)) { t.poison = 0; t.burn = 0; t.sleep = 0; if (t.side === 'p') t.stun = 0; pop(t, 'Soigné', '#80ff90'); } }
  function heal(t, n) {
    const real = Math.min(n, t.maxhp - t.hp);
    t.hp += real;
    pop(t, real, '#80ff90');
  }
  function onKO(t) {
    if (t.side === 'p' && P() && P().luckyRevive(t)) { // haricot porte-bonheur
      t.hp = Math.max(1, Math.floor(t.maxhp * 0.5));
      fx('sparkle', { x: t.x, y: t.y, life: 40, c: '#ffe080' });
      fx('text', { x: t.x, y: t.y - 44, str: 'Haricot porte-bonheur !', c: '#ffe080', life: 60 });
      return;
    }
    if (t.side === 'e') {
      t.queued = false; t.atb = 0;
      // la queue coupée, le singe géant s'effondre aussi
      if (t.d.kills) for (const o of B.enemies) if (o.id === t.d.kills && !o.dead && o.hp > 0) { o.hp = 0; onKO(o); }
      (async () => {
        SND.sfx('miss');
        for (let i = 0; i < 20; i++) { t.alpha = (i % 2) ? 0.3 : 0.9; await wait(2); }
        await Tasks.tween(t, { alpha: 0 }, 10);
        t.dead = true;
      })();
    } else {
      t.atb = 0; t.queued = false;
      B.ready = B.ready.filter(r => r !== t);
      B.actions = B.actions.filter(a => a.actor !== t && !(a.actors && a.actors.includes(t)));
      if (B.menu && B.menu.who === t) B.menu = null;
    }
  }

  // ---------- Effets visuels ----------
  function fx(type, o) { B.fx.push(Object.assign({ type, t: 0 }, o)); }
  function drawFx(f, cx, cy) {
    const t = f.t;
    switch (f.type) {
      case 'spark': {
        const x = f.x - cx, y = f.y - cy, r = 3 + t * 1.2;
        ctx.fillStyle = t < 4 ? '#ffffff' : '#ffe060';
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + 0.3;
          ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2);
        }
        if (t < 3) { ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 3, 6, 6); }
        return t < 10;
      }
      case 'boom': {
        const x = f.x - cx, y = f.y - cy, life = f.life || 24, p = t / life, r = (f.r || 14) * Math.min(1, p * 2.2);
        ctx.globalAlpha = 1 - Math.max(0, p - 0.5) * 2;
        ctx.fillStyle = f.c1 || '#e04010'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.fillStyle = f.c2 || '#f8a020'; ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, 7); ctx.fill();
        ctx.fillStyle = f.c3 || '#fff0a0'; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        return t < life;
      }
      case 'beam': {
        const life = f.life || 50;
        const x1 = f.x1 - cx, y1 = f.y1 - cy, x2 = f.x2 - cx, y2 = f.y2 - cy;
        const grow = Math.min(1, t / 10);
        const ex = x1 + (x2 - x1) * grow, ey = y1 + (y2 - y1) * grow;
        const fadeP = t > life - 12 ? (life - t) / 12 : 1;
        const w = Math.max(0.5, (f.w || 7) * fadeP + Math.sin(t * 0.8) * 1.2 * fadeP);
        const ang = Math.atan2(ey - y1, ex - x1), len = Math.hypot(ex - x1, ey - y1);
        ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
        ctx.fillStyle = f.c1 || '#3070f8'; ctx.fillRect(0, -w, len, w * 2);
        ctx.fillStyle = f.c2 || '#80c8ff'; ctx.fillRect(0, -w * 0.62, len, w * 1.24);
        ctx.fillStyle = f.c3 || '#ffffff'; ctx.fillRect(0, -w * 0.28, len, w * 0.56);
        ctx.fillStyle = f.c2 || '#80c8ff'; ctx.beginPath(); ctx.arc(len, 0, w * 1.5, 0, 7); ctx.fill();
        ctx.fillStyle = f.c3 || '#fff'; ctx.beginPath(); ctx.arc(len, 0, w * 0.9, 0, 7); ctx.fill();
        ctx.fillStyle = f.c2 || '#80c8ff'; ctx.beginPath(); ctx.arc(0, 0, w * 1.3, 0, 7); ctx.fill();
        ctx.restore();
        return t < life;
      }
      case 'charge': {
        const x = f.x - cx, y = f.y - cy, life = f.life || 40;
        for (let i = 0; i < 10; i++) {
          const a = i * 2.4 + t * 0.15, r = (1 - ((t * 1.5 + i * 7) % 30) / 30) * 22;
          ctx.fillStyle = i % 2 ? (f.c || '#80c8ff') : '#ffffff';
          ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2);
        }
        const g = Math.max(1, 2 + Math.min(6, t / 6) + Math.sin(t * 0.6));
        ctx.fillStyle = f.c || '#80c8ff'; ctx.beginPath(); ctx.arc(x, y, g, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, g * 0.5, 0, 7); ctx.fill();
        return t < life;
      }
      case 'orb': {
        const life = f.life || 16, p = Math.min(1, t / life);
        const x = f.x1 + (f.x2 - f.x1) * p - cx, y = f.y1 + (f.y2 - f.y1) * p - cy - Math.sin(p * Math.PI) * (f.arc || 0);
        ctx.fillStyle = f.c || '#ffe060'; ctx.beginPath(); ctx.arc(x, y, f.r || 3, 0, 7); ctx.fill();
        ctx.fillStyle = f.c2 || '#fff'; ctx.beginPath(); ctx.arc(x, y, (f.r || 3) * 0.5, 0, 7); ctx.fill();
        return t < life;
      }
      case 'disc': {
        const life = f.life || 24, p = Math.min(1, t / life);
        const x = f.x1 + (f.x2 - f.x1) * p - cx, y = f.y1 + (f.y2 - f.y1) * p - cy;
        const w = (f.w || 9) + Math.sin(t * 0.9) * 2;
        ctx.fillStyle = f.c1 || '#f8c020'; ctx.beginPath(); ctx.ellipse(x, y, w, 3, 0, 0, 7); ctx.fill();
        ctx.fillStyle = f.c2 || '#fff8b0'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.6, 1.5, 0, 0, 7); ctx.fill();
        return t < life;
      }
      case 'sparkle': {
        const life = f.life || 30;
        for (let i = 0; i < 8; i++) {
          const px = f.x - cx + Math.sin(i * 2.1 + t * 0.2) * 9, py = f.y - cy - ((t * 0.8 + i * 5) % 26);
          ctx.fillStyle = i % 2 ? (f.c || '#80ff90') : '#ffffff';
          ctx.fillRect(Math.round(px), Math.round(py), 1, 3); ctx.fillRect(Math.round(px) - 1, Math.round(py) + 1, 3, 1);
        }
        return t < life;
      }
      case 'flash': {
        const life = f.life || 30;
        ctx.globalAlpha = Math.max(0, 1 - t / life);
        ctx.fillStyle = f.c || '#ffffff'; ctx.fillRect(0, 0, SW, SH);
        ctx.globalAlpha = 1;
        return t < life;
      }
      case 'staff': {
        const life = f.life || 14, p = Math.min(1, t / 6);
        const x1 = f.x1 - cx, y1 = f.y1 - cy, x2 = x1 + (f.x2 - f.x1) * p, y2 = y1 + (f.y2 - f.y1) * p;
        ctx.strokeStyle = K; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#d83020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = '#f0c040'; ctx.fillRect(Math.round(x2) - 1, Math.round(y2) - 1, 3, 3);
        return t < life;
      }
      case 'smoke': case 'cloud': {
        const life = f.life || 30, p = t / life;
        ctx.globalAlpha = Math.max(0, 1 - p);
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2 + p * 2, r = 3 + p * (f.type === 'cloud' ? 12 : 14);
          ctx.fillStyle = f.type === 'cloud' ? (i % 2 ? '#a8d870' : '#78a848') : (i % 2 ? '#e8e8f0' : '#b8b8c8');
          ctx.beginPath(); ctx.arc(f.x - cx + Math.cos(a) * r, f.y - cy + Math.sin(a) * r * 0.7, 4 + p * 4, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return t < life;
      }
      case 'text': {
        const life = f.life || 60;
        const y = f.y - cy - Math.min(10, t * 0.5);
        FONT.drawCentered(ctx, f.str, f.x - cx, y, f.c || '#fff');
        return t < life;
      }
    }
    return false;
  }

  // ---------- Actions ----------
  function message(str, frames = 70) { B.msg = { str, t: frames }; }
  // ---------- Frappes au bon moment ----------
  // atk : appuyer quand l'anneau se referme ; def : parer au moment de l'impact ; charge : maintenir puis relâcher
  function owner(c) { return Opt.twoPlayers() && c && c.side === 'p' && B.party.indexOf(c) > 0 ? Input.p2 : Input.p1; }
  function qteAllowed() { return Opt.manual() && !autoActive(); }
  function startQTE(kind, who, targets, at) {
    if (!qteAllowed() || !who || who.hp <= 0) return;
    B.qte = { kind, who, targets, at, start: B.t, open: true, res: null, val: 0, holding: false };
    if (!Game.flags.qteHint) { Game.flags.qteHint = true; message('Appuie sur Z / A au bon moment !', 90); }
  }
  const qteDone = () => (B.qte && B.qte.open ? Tasks.until(() => !B || !B.qte || !B.qte.open) : null);
  function judge(Q, res) {
    Q.open = false; Q.res = res;
    const W = { perfect: ['Parfait !', '#ffe060', 1.35, 0.3], good: ['Bien !', '#ffffff', 1.15, 0.6], miss: ['Raté', '#8890b0', 1, 1] }[res];
    if (!W) return;
    if (Q.kind === 'def') {
      B.parry = W[3] < 1 ? W[3] : null;
      if (W[3] < 1) { SND.sfx('confirm'); for (const t of Q.targets) fx('text', { x: t.x, y: t.y - 46, str: res === 'perfect' ? 'Parade parfaite !' : 'Parade !', c: '#80f0ff', life: 40 }); }
      return;
    }
    const a = Q.who;
    a.qteRes = res;
    a.qteMul = Q.kind === 'charge' ? { perfect: 1.3, good: 1.12, miss: 1 }[res] : W[2];
    if (res !== 'miss') SND.sfx('confirm');
    const t = Q.kind === 'atk' && Q.targets[0] ? Q.targets[0] : a;
    fx('text', { x: t.x, y: t.y - spriteH(t) - 18, str: Q.kind === 'charge' && res === 'perfect' ? 'Charge parfaite !' : W[0], c: W[1], life: 40 });
  }
  function updateQTE() {
    const Q = B.qte;
    if (!Q || !Q.open) return false;
    const I = owner(Q.who);
    if (Q.kind === 'charge') {
      if (!Q.holding && I.pressed('a')) Q.holding = true;
      if (Q.holding) {
        if (I.down('a')) Q.val += 1 / 32;
        else judge(Q, Q.val >= 0.78 && Q.val <= 1.02 ? 'perfect' : Q.val >= 0.55 && Q.val <= 1.15 ? 'good' : 'miss');
      }
      if (Q.open && B.t >= Q.at) { if (Q.holding) judge(Q, Q.val <= 1.15 && Q.val >= 0.55 ? 'good' : 'miss'); else { Q.open = false; Q.res = 'none'; } }
      return true;
    }
    const wide = Q.kind === 'def' && (Q.targets.some(t => t.guard) || (P() && P().parryBonus(Q.who))) ? 1.6 : 1;
    const d = B.t - Q.at;
    if (I.pressed('a')) { const ad = Math.abs(d); judge(Q, ad <= 2 * wide ? 'perfect' : ad <= 6 * wide ? 'good' : 'miss'); }
    else if (d > 6 * wide) { Q.open = false; Q.res = 'none'; }
    return true;
  }
  // projection : un ennemi ordinaire poussé dans l'eau, la lave ou hors du ring est éliminé
  async function knock(t, dx) {
    const ox = t.x;
    await Tasks.tween(t, { x: t.x + dx }, 8, 'out');
    if (t.dead || t.hp <= 0 || t.d.boss || t.d.big || t.d.unkillable || !Field.map) return;
    const ty = Math.floor((t.y - 2) / 16), ch = Field.tileAt(Math.floor(t.x / 16), ty);
    let why = null;
    if (ch === '~') why = 'Plouf !';
    else if (ch === 'L') why = 'Dans la lave !';
    else if (Field.mapId === 'papaye' && ch !== 'c' && Field.tileAt(Math.floor(ox / 16), ty) === 'c') why = 'Hors du ring !';
    if (!why) return;
    fx('text', { x: t.x, y: t.y - spriteH(t) - 16, str: why, c: '#80c8ff', life: 50 });
    SND.sfx('miss');
    t.hp = 0; onKO(t);
  }
  function splash(a, t, pow) { // les ennemis voisins de la cible prennent une partie du choc
    for (const o of livingEnemies()) if (o !== t && Math.hypot(o.x - t.x, o.y - t.y) < 36) damage(o, Math.max(1, Math.round(kiDmg(a, o, pow) * 0.3)));
  }

  async function melee(a, t, onHit, opts = {}) {
    const sx = a.x, sy = a.y;
    const dir = t.x > a.x ? 1 : -1;
    const tw = t.side === 'e' && !t.d.char ? GFX.monster(t.d.spr).w / 2 : 8;
    const travel = opts.fast ? 8 : 12;
    if (a.side === 'p') startQTE('atk', a, [t], B.t + travel + 4);
    else if (!opts.noParry) startQTE('def', t, [t], B.t + travel + 4);
    a.walking = true;
    await Tasks.tween(a, { x: t.x - dir * (tw + 10), y: t.y + 1 }, travel, 'inOut');
    a.walking = false; a.pose = 'attack';
    SND.sfx('swing');
    await wait(4);
    await qteDone();
    await onHit();
    await wait(opts.hold || 10);
    a.pose = null; a.walking = true;
    await Tasks.tween(a, { x: sx, y: sy }, 12);
    a.walking = false;
  }
  function hitRoll(a, t) {
    if (t.stun > 0 || t.sleep > 0) return true;
    if (t.side === 'p' && a.side === 'e' && P() && Math.random() < P().dodge(t)) return false; // esquive (Puar vole, grelot...)
    return Math.random() > 0.05;
  }
  function crit(a) { return Math.random() < 0.07 + (a.side === 'p' && P() ? P().critBonus(a) : 0); }
  async function physicalHit(a, t, pow, opts = {}) {
    if (!hitRoll(a, t)) { pop(t, t.side === 'p' ? 'Esquive' : 'Raté', '#c0c8e8'); SND.sfx('miss'); return; }
    let n = physDmg(a, t, pow);
    const c = crit(a);
    if (c) { n = Math.round(n * 1.5); fx('text', { x: t.x, y: t.y - spriteH(t) - 14, str: 'Critique !', c: '#ffe060', life: 40 }); }
    damage(t, n, { big: c || opts.big, from: a, melee: true });
    if (a.side === 'p' && t.side === 'e' && (a.qteRes === 'perfect' || opts.knock) && !t.dead && t.hp > 0) knock(t, 18);
  }
  function retarget(t, side) {
    if (t && !(t.dead || t.hp <= 0)) return t;
    const pool = side === 'e' ? livingEnemies() : livingParty();
    return pool.length ? pick(pool) : null;
  }

  async function doAttack(a, t) {
    t = retarget(t, 'e');
    if (!t) return;
    await melee(a, t, () => physicalHit(a, t, 1));
  }
  async function beamFrom(a, targets, opts = {}) {
    const [hx, hy] = a.side === 'p' || a.d.char ? [a.x + (a.side === 'p' ? 8 : -8), a.y - 13] : [a.x - GFX.monster(a.d.spr).w / 3, center(a)[1]];
    a.pose = 'attack';
    SND.sfx('charge');
    const manual = a.side === 'p' && !opts.noQte && qteAllowed();
    fx('charge', { x: hx, y: hy, life: manual ? 58 : 40, c: opts.c2 });
    message(opts.name, 90);
    if (manual) { startQTE('charge', a, [], B.t + 56); await Tasks.until(() => !B || !B.qte || !B.qte.open); } else await wait(40);
    SND.sfx('beam');
    if (opts.all) {
      const ys = targets.map(t => center(t)[1]);
      const ty = ys.reduce((s, v) => s + v, 0) / ys.length;
      fx('beam', { x1: hx, y1: hy, x2: (B.party[0].x > a.x ? -40 : SW + 40) + Field.cx, y2: ty, life: 50, w: 12, c1: opts.c1, c2: opts.c2 });
    } else {
      const [tx, ty] = center(targets[0]);
      fx('beam', { x1: hx, y1: hy, x2: tx, y2: ty, life: 46, w: 7, c1: opts.c1, c2: opts.c2 });
    }
    await wait(12);
    await qteDone();
    for (const t of targets) { opts.onHit(t); await wait(4); }
    if (opts.splash && targets.length === 1) splash(a, targets[0], opts.splash);
    await wait(30);
    a.pose = null;
  }
  const techCost = (c, id) => (P() ? P().techCost(c.m, id) : TECHS[id].ki);
  async function doTech(a, id, target) {
    const T = TECHS[id];
    a.ki -= techCost(a, id);
    a.techMul = P() ? P().techPow(a.m, id) : 1;
    if (P()) P().useTech(a, id);
    message(T.name, 80);
    let targets;
    if (T.target === 'allEnemies') targets = livingEnemies();
    else if (T.target === 'allAllies') targets = livingParty();
    else if (T.target === 'enemy') targets = [retarget(target, 'e')].filter(Boolean);
    else targets = [target];
    if (!targets.length) return;
    if (T.custom) { // technique inventée par le joueur (voir techs.js)
      await CustomTech.run(T, a, targets, { fx, wait, damage, heal, center, kiDmg, physDmg, melee, pop, party: () => B.party, status: addStatus, cure });
      return;
    }
    switch (T.anim) {
      case 'hero': // techniques des nouveaux héros (heroes.js)
        await Heroes.techAnim(T, a, targets, { fx, wait, damage, heal, center, kiDmg, physDmg, melee, pop, message, status: addStatus, cure, party: () => B.party, enemies: livingEnemies, physicalHit });
        break;
      case 'staff': {
        const t = targets[0];
        await melee(a, t, async () => {
          const [tx, ty] = center(t);
          fx('staff', { x1: a.x + 6, y1: a.y - 13, x2: tx, y2: ty, life: 16 });
          await wait(5);
          await physicalHit(a, t, T.pow);
        }, { hold: 12 });
        break;
      }
      case 'janken': {
        const t = targets[0];
        const kind = pick(['Pierre', 'Ciseaux', 'Papier']);
        message('Jan... Ken...', 60);
        await melee(a, t, async () => {
          message(kind.toUpperCase() + ' !', 60);
          if (kind === 'Pierre') await physicalHit(a, t, 2.4, { big: true, knock: true });
          else if (kind === 'Ciseaux') { await physicalHit(a, t, 1.8); addStatus(t, 'stun', 1, 140); }
          else { for (const e of livingEnemies()) { const [x, y] = center(e); fx('boom', { x, y, r: 9, life: 18 }); damage(e, physDmg(a, e, 1.4)); await wait(4); } }
        }, { hold: 16 });
        break;
      }
      case 'beam': case 'beamAll':
        await beamFrom(a, targets, { name: T.name, all: T.anim === 'beamAll', c1: T.c1, c2: T.c2, splash: T.anim === 'beam' ? T.pow : 0, onHit: t => damage(t, kiDmg(a, t, T.pow), { big: true }) });
        break;
      case 'gun': {
        const t = targets[0];
        a.pose = 'attack';
        for (let i = 0; i < 2; i++) {
          SND.sfx('blast');
          const [tx, ty] = center(t);
          fx('orb', { x1: a.x + 8, y1: a.y - 13, x2: tx, y2: ty, life: 10, r: 2, c: '#ffe060' });
          await wait(10);
          if (!t.dead && t.hp > 0) damage(t, Math.max(1, Math.round(kiDmg(a, t, T.pow / 2, 0.25))));
          await wait(6);
        }
        a.pose = null;
        break;
      }
      case 'bomb': {
        a.pose = 'attack';
        SND.sfx('jump');
        for (const t of targets) { const [tx, ty] = center(t); fx('orb', { x1: a.x + 6, y1: a.y - 16, x2: tx, y2: ty, life: 20, arc: 30, r: 3, c: '#f0f0f0' }); }
        await wait(20);
        SND.sfx('bighit');
        Game.shake = 8;
        for (const t of targets) { const [tx, ty] = center(t); fx('boom', { x: tx, y: ty, r: 16 }); damage(t, kiDmg(a, t, T.pow)); addStatus(t, 'burn', 0.25); }
        await wait(24);
        a.pose = null;
        break;
      }
      case 'heal': case 'healAll': {
        a.pose = 'attack';
        SND.sfx('heal');
        for (const t of targets) {
          const [x] = center(t);
          fx('sparkle', { x, y: t.y, life: 36 });
          if (T.kind === 'revive') { if (t.hp <= 0) { t.hp = Math.max(1, Math.floor(t.maxhp * T.pow)); t.atb = 0; pop(t, 'Debout !', '#80ff90'); } }
          else if (t.hp > 0) { heal(t, Math.round(a.mag * T.pow * (P() ? P().healMul(a) : 1) + T.base)); cure(t); }
        }
        await wait(40);
        a.pose = null;
        break;
      }
      case 'multi': {
        const t = targets[0];
        await melee(a, t, async () => {
          for (let i = 0; i < T.hits; i++) {
            if (t.dead || t.hp <= 0) break;
            a.pose = i % 2 ? null : 'attack';
            await physicalHit(a, t, T.pow);
            await wait(8);
          }
          a.pose = 'attack';
        }, { hold: 6 });
        break;
      }
      case 'flash': {
        a.pose = 'attack';
        await wait(10);
        SND.sfx('flash');
        fx('flash', { life: 40 });
        await wait(20);
        for (const t of targets) addStatus(t, 'stun', 1, T.dur);
        await wait(30);
        a.pose = null;
        break;
      }
      case 'strike': {
        const t = targets[0];
        await melee(a, t, async () => {
          fx('spark', { x: center(t)[0], y: center(t)[1] });
          await physicalHit(a, t, T.pow, { big: true });
        }, { hold: 12, fast: true });
        break;
      }
      case 'orb': {
        const t = targets[0];
        a.pose = 'attack';
        SND.sfx('charge');
        fx('charge', { x: a.x + 8, y: a.y - 16, life: 30, c: '#ffe080' });
        await wait(30);
        SND.sfx('blast');
        const [tx, ty] = center(t);
        fx('orb', { x1: a.x + 8, y1: a.y - 16, x2: tx, y2: ty, life: 22, arc: 40, r: 6, c: '#ffe080' });
        await wait(22);
        fx('boom', { x: tx, y: ty, r: 18 });
        damage(t, kiDmg(a, t, T.pow), { big: true });
        splash(a, t, T.pow);
        await wait(24);
        a.pose = null;
        break;
      }
      case 'transfo': {
        const t = targets[0];
        const form = pick(['Taureau', 'Chauve-souris', 'Missile', 'Robot']);
        fx('smoke', { x: a.x, y: a.y - 14, life: 30 });
        SND.sfx('door');
        await wait(16);
        message('Transformation : ' + form + ' !', 70);
        if (form === 'Taureau') { await melee(a, t, () => physicalHit(a, t, 2.6, { big: true, knock: true }), { hold: 10 }); }
        else if (form === 'Missile') {
          for (const e of livingEnemies()) { const [x, y] = center(e); fx('orb', { x1: a.x, y1: a.y - 16, x2: x, y2: y, life: 16, r: 3, c: '#c0c0d0' }); }
          await wait(16); SND.sfx('bighit'); Game.shake = 8;
          for (const e of livingEnemies()) { const [x, y] = center(e); fx('boom', { x, y, r: 12 }); damage(e, kiDmg(a, e, 1.4)); }
          await wait(20);
        } else if (form === 'Chauve-souris') {
          await melee(a, t, async () => { await physicalHit(a, t, 1.2); addStatus(t, 'stun', 1, 200); }, { hold: 10, fast: true });
        } else {
          for (const p of livingParty()) { fx('sparkle', { x: p.x, y: p.y, life: 30, c: '#80c8ff' }); heal(p, Math.round(a.mag * 1.2 + 20)); cure(p); }
          SND.sfx('heal'); await wait(30);
        }
        fx('smoke', { x: a.x, y: a.y - 14, life: 24 });
        break;
      }
      case 'gas': {
        a.pose = 'attack';
        SND.sfx('miss');
        for (const t of targets) { const [x, y] = center(t); fx('cloud', { x, y, life: 50 }); }
        await wait(24);
        for (const t of targets) { damage(t, kiDmg(a, t, T.pow)); if (!addStatus(t, 'stun', 0.6, T.dur)) addStatus(t, 'poison', 0.5); }
        await wait(30);
        a.pose = null;
        break;
      }
      case 'disc': {
        const t = targets[0];
        a.pose = 'attack';
        fx('charge', { x: a.x + 2, y: a.y - 30, life: 30, c: '#f8c020' });
        SND.sfx('disc');
        await wait(30);
        const [tx, ty] = center(t);
        fx('disc', { x1: a.x + 2, y1: a.y - 30, x2: tx, y2: ty, life: 18 });
        await wait(18);
        damage(t, Math.round(a.mag * T.pow * 1.1 * rand(0.95, 1.05)), { big: true });
        await wait(24);
        a.pose = null;
        break;
      }
    }
  }
  async function doDual(d, actors, target) {
    const [a1, a2] = actors;
    a1.ki -= d.ki[0]; a2.ki -= d.ki[1];
    message(d.name + ' !', 120);
    const targets = livingEnemies();
    if (!targets.length) return;
    const goku = actors.find(c => c.id === 'goku'), bulma = actors.find(c => c.id === 'bulma'), krillin = actors.find(c => c.id === 'krillin');
    if (d.anim === 'dualBomb') {
      bulma.pose = 'attack';
      SND.sfx('jump');
      const mid = [goku.x + 30, goku.y - 40];
      fx('orb', { x1: bulma.x + 6, y1: bulma.y - 16, x2: mid[0], y2: mid[1], life: 20, arc: 20, r: 3, c: '#f0f0f0' });
      await wait(14);
      goku.walking = true;
      const gs = [goku.x, goku.y];
      await Tasks.tween(goku, { x: mid[0] - 10, y: mid[1] + 30 }, 8);
      goku.walking = false; goku.pose = 'attack';
      fx('staff', { x1: goku.x + 6, y1: goku.y - 13, x2: mid[0] + 10, y2: mid[1], life: 12 });
      SND.sfx('swing');
      await wait(6);
      for (const t of targets) { const [tx, ty] = center(t); fx('orb', { x1: mid[0], y1: mid[1], x2: tx, y2: ty, life: 10, r: 4, c: '#ffffff' }); }
      await wait(10);
      SND.sfx('bighit'); Game.shake = 12;
      for (const t of targets) { const [tx, ty] = center(t); fx('boom', { x: tx, y: ty, r: 20, life: 28 }); damage(t, Math.round((physDmg(goku, t, 1) + kiDmg(bulma, t, 1)) * d.pow / 2 * 1.2), { big: true }); }
      await wait(20);
      goku.pose = null; bulma.pose = null; goku.walking = true;
      await Tasks.tween(goku, { x: gs[0], y: gs[1] }, 12);
      goku.walking = false;
    } else if (d.anim === 'dualBeam') {
      goku.pose = 'attack'; krillin.pose = 'attack';
      SND.sfx('charge');
      fx('charge', { x: goku.x + 8, y: goku.y - 13, life: 46 });
      fx('charge', { x: krillin.x + 8, y: krillin.y - 13, life: 46 });
      await wait(46);
      SND.sfx('beam');
      const ys = targets.map(t => center(t)[1]);
      const ty = ys.reduce((s, v) => s + v, 0) / ys.length;
      const meet = [Math.max(goku.x, krillin.x) + 30, (goku.y + krillin.y) / 2 - 13];
      fx('beam', { x1: goku.x + 8, y1: goku.y - 13, x2: meet[0], y2: meet[1], life: 60, w: 6 });
      fx('beam', { x1: krillin.x + 8, y1: krillin.y - 13, x2: meet[0], y2: meet[1], life: 60, w: 6 });
      await wait(8);
      fx('beam', { x1: meet[0], y1: meet[1], x2: Field.cx + SW + 40, y2: ty, life: 52, w: 14 });
      await wait(12);
      for (const t of targets) { damage(t, Math.round((kiDmg(goku, t, 1) + kiDmg(krillin, t, 1)) * d.pow / 2 * 1.15), { big: true }); await wait(4); }
      await wait(36);
      goku.pose = null; krillin.pose = null;
    } else if (d.anim === 'dualStrike') {
      const homes = actors.map(c => [c.x, c.y]);
      for (const t of targets) {
        for (const c of actors) {
          if (t.dead || t.hp <= 0) break;
          c.walking = true;
          await Tasks.tween(c, { x: t.x - 18 + (c === a2 ? 6 : 0), y: t.y + (c === a2 ? 4 : -2) }, 7);
          c.walking = false; c.pose = 'attack';
          SND.sfx('swing');
          damage(t, Math.round((physDmg(a1, t, 1) + physDmg(a2, t, 1)) * d.pow / 4 * rand(0.95, 1.05)), { big: true });
          await wait(6);
          c.pose = null;
        }
      }
      await Promise.all(actors.map((c, i) => { c.walking = true; return Tasks.tween(c, { x: homes[i][0], y: homes[i][1] }, 12).then(() => { c.walking = false; }); }));
    } else if (d.anim === 'dualBlast') {
      for (const c of actors) { c.pose = 'attack'; fx('charge', { x: c.x + 8, y: c.y - 14, life: 40, c: '#ffd080' }); }
      SND.sfx('charge');
      await wait(40);
      SND.sfx('beam');
      for (const t of targets) for (const c of actors) { const [x, y] = center(t); fx('orb', { x1: c.x + 8, y1: c.y - 14, x2: x, y2: y, life: 14, r: 4, c: '#ffe8a0' }); }
      await wait(14);
      SND.sfx('bighit'); Game.shake = 12;
      for (const t of targets) {
        const [x, y] = center(t);
        fx('boom', { x, y, r: 20, life: 28 });
        const n = d.kind === 'ki2' ? (kiDmg(a1, t, 1) + kiDmg(a2, t, 1)) : (physDmg(a1, t, 1) + kiDmg(a2, t, 1));
        damage(t, Math.round(n * d.pow / 2 * 1.1), { big: true });
        if (d.kind === 'kistun') addStatus(t, 'stun', 1, d.dur || 160);
        await wait(3);
      }
      await wait(28);
      for (const c of actors) c.pose = null;
    } else if (d.anim === 'dualFlash') {
      krillin.pose = 'attack';
      await wait(10);
      SND.sfx('flash');
      fx('flash', { life: 36 });
      for (const t of targets) addStatus(t, 'stun', 1, d.dur);
      await wait(20);
      bulma.pose = 'attack';
      SND.sfx('jump');
      for (const t of targets) { const [tx, ty] = center(t); fx('orb', { x1: bulma.x + 6, y1: bulma.y - 16, x2: tx, y2: ty, life: 18, arc: 26, r: 3, c: '#f0f0f0' }); }
      await wait(18);
      SND.sfx('bighit'); Game.shake = 10;
      for (const t of targets) { const [tx, ty] = center(t); fx('boom', { x: tx, y: ty, r: 16 }); damage(t, Math.round((kiDmg(krillin, t, 1) + kiDmg(bulma, t, 1)) * d.pow / 2 * 1.1)); }
      await wait(28);
      krillin.pose = null; bulma.pose = null;
    }
  }
  async function doGuard(a) {
    a.guard = true;
    message(a.name + ' se met en garde', 60);
    SND.sfx('cursor');
    fx('sparkle', { x: a.x, y: a.y, life: 30, c: '#80c8ff' });
    const k = Math.max(1, Math.round(a.maxki * 0.05));
    a.ki = Math.min(a.maxki, a.ki + k);
    await wait(24);
  }
  async function doCharge(a) {
    a.pose = 'attack';
    message(a.name + ' se concentre...', 70);
    SND.sfx('charge');
    fx('charge', { x: a.x, y: a.y - 16, life: 44, c: '#ffe080' });
    await wait(44);
    const k = Math.min(a.maxki - a.ki, Math.max(5, Math.round(a.maxki * (P() ? P().chargeRate(a) : 0.3))));
    a.ki += k;
    a.charged = true;
    pop(a, '+' + k + ' Ki', '#80c8ff');
    a.pose = null;
    await wait(16);
  }
  function triplesFor(c) {
    const out = [];
    for (const d of TRIPLES) {
      if (!d.members.includes(c.id)) continue;
      const ps = d.members.map(id => B.party.find(p => p.id === id));
      if (ps.some(p => !p || p.hp <= 0)) continue;
      if (!d.req.every((r, i) => ps[i].m.techs.includes(r))) continue;
      const others = ps.filter(p => p !== c);
      const ready = others.every(o => o.atb >= 100 && !o.queued && !o.stun && !o.sleep);
      const ki = ps.every((p, i) => p.ki >= d.ki[i]);
      out.push({ triple: d, others, ok: ready && ki, ready, ki });
    }
    return out;
  }
  async function doTriple(d, actors) {
    actors.forEach((c, i) => { c.ki -= d.ki[i]; });
    message(d.name + ' !', 130);
    if (d.target === 'allAllies') {
      for (const c of actors) { c.pose = 'attack'; fx('charge', { x: c.x + 6, y: c.y - 14, life: 30, c: '#a0ffa0' }); }
      SND.sfx('heal'); await wait(30);
      for (const p of B.party) {
        fx('sparkle', { x: p.x, y: p.y, life: 40 });
        if (p.hp <= 0) { p.hp = Math.max(1, Math.floor(p.maxhp * 0.3)); p.atb = 0; pop(p, 'Debout !', '#80ff90'); }
        else { heal(p, Math.round(actors.reduce((s2, c) => s2 + c.mag, 0) / 3 * d.pow + 40)); cure(p); }
      }
      await wait(40);
      for (const c of actors) c.pose = null;
      return;
    }
    const targets = livingEnemies();
    if (!targets.length) return;
    const sum = (f, t) => actors.reduce((s2, c) => s2 + f(c, t, 1), 0);
    if (d.anim === 'tripleStrike') {
      const homes = actors.map(c => [c.x, c.y]);
      for (const t of targets) for (const c of actors) {
        if (t.dead || t.hp <= 0) break;
        c.walking = true;
        await Tasks.tween(c, { x: t.x - 18 + actors.indexOf(c) * 5, y: t.y - 4 + actors.indexOf(c) * 4 }, 6);
        c.walking = false; c.pose = 'attack';
        SND.sfx('swing'); fx('spark', { x: t.x, y: t.y - 14 });
        damage(t, Math.max(1, Math.round(sum(physDmg, t) * d.pow / 9 * rand(0.95, 1.05))), { big: true });
        await wait(5); c.pose = null;
      }
      await Promise.all(actors.map((c, i) => { c.walking = true; return Tasks.tween(c, { x: homes[i][0], y: homes[i][1] }, 12).then(() => { c.walking = false; }); }));
      return;
    }
    for (const c of actors) { c.pose = 'attack'; fx('charge', { x: c.x + 8, y: c.y - 13, life: 50, c: d.anim === 'tripleBeam' ? '#80c8ff' : '#ffd080' }); }
    SND.sfx('charge');
    await wait(50);
    SND.sfx('beam');
    if (d.anim === 'tripleBeam') {
      const meet = [Math.max(...actors.map(c => c.x)) + 32, actors.reduce((s2, c) => s2 + c.y, 0) / 3 - 13];
      const ty = targets.reduce((s2, t) => s2 + center(t)[1], 0) / targets.length;
      for (const c of actors) fx('beam', { x1: c.x + 8, y1: c.y - 13, x2: meet[0], y2: meet[1], life: 64, w: 6 });
      await wait(10);
      fx('beam', { x1: meet[0], y1: meet[1], x2: Field.cx + SW + 40, y2: ty, life: 56, w: 18 });
      Game.shake = 14;
      await wait(12);
      for (const t of targets) { damage(t, Math.max(1, Math.round(sum(kiDmg, t) * d.pow / 3 * 1.1)), { big: true }); await wait(4); }
    } else {
      for (const t of targets) for (const c of actors) { const [x, y] = center(t); fx('orb', { x1: c.x + 8, y1: c.y - 14, x2: x, y2: y, life: 16, arc: 24, r: 4, c: '#f0f0f0' }); }
      await wait(16);
      SND.sfx('bighit'); Game.shake = 12;
      for (const t of targets) { const [x, y] = center(t); fx('boom', { x, y, r: 22, life: 30 }); damage(t, Math.max(1, Math.round(sum(kiDmg, t) * d.pow / 3)), { big: true }); if (d.kind === 'kistun') addStatus(t, 'stun', 1, d.dur || 200); await wait(3); }
    }
    await wait(30);
    for (const c of actors) c.pose = null;
  }
  async function doItem(a, id, t) {
    const it = ITEMS[id];
    if (!Game.useItemStock(id)) return;
    message(it.name, 60);
    a.pose = 'attack';
    SND.sfx('heal');
    fx('sparkle', { x: t.x, y: t.y, life: 36, c: it.ki ? '#80c8ff' : '#80ff90' });
    await wait(10);
    if (it.revive && t.hp <= 0) { t.hp = Math.max(1, Math.floor(t.maxhp * it.revive)); t.atb = 0; pop(t, 'Debout !', '#80ff90'); }
    else if (it.full) { const was = t.hp; t.hp = t.maxhp; t.ki = t.maxki; if (was <= 0) t.atb = 0; pop(t, 'Max !', '#80ff90'); }
    else if (t.hp > 0) {
      if (it.cure) cure(t);
      if (it.hp) heal(t, it.hp);
      if (it.ki) { const r = Math.min(it.ki, t.maxki - t.ki); t.ki += r; pop(t, r + ' Ki', '#80c8ff'); }
    } else pop(t, 'Sans effet', '#c0c8e8');
    await wait(30);
    a.pose = null;
  }
  async function doFlee(a) {
    if (!B.canFlee) { message('Impossible de fuir !', 70); SND.sfx('buzz'); await wait(50); return false; }
    const ps = livingParty().reduce((s, c) => s + c.spd, 0) / Math.max(1, livingParty().length);
    const es = livingEnemies().reduce((s, c) => s + c.spd, 0) / Math.max(1, livingEnemies().length);
    const chance = clamp(0.55 + (ps - es) * 0.03, 0.25, 0.92);
    if (Math.random() < chance) {
      message('Fuite !', 60);
      SND.sfx('miss');
      for (const c of B.party) { c.walking = true; c.flee = true; }
      await Promise.all(B.party.map(c => Tasks.tween(c, { x: c.x - 70 }, 26)));
      return true;
    }
    message('Impossible de s\'échapper !', 70);
    SND.sfx('buzz');
    await wait(50);
    return false;
  }
  // Les boss annoncent leurs grosses attaques : le temps de se mettre en garde... ou de les interrompre (Taiyoken !)
  const teleWorthy = (e, sk) => e.d.boss && !sk.noTele && (sk.pow >= 1.6 || sk.target === 'all' || sk.beam);
  async function doEnemy(e, forced) {
    if (e.dead || e.hp <= 0) return;
    const party = livingParty();
    if (!party.length) return;
    let skill = forced || null;
    if (!skill) for (const s2 of e.d.skills || []) if (Math.random() < s2.chance) { skill = s2; break; }
    if (skill && !forced && teleWorthy(e, skill)) {
      e.charging = { skill, t: 150 };
      message(e.name + ' se prépare : ' + skill.name + ' !', 120);
      SND.sfx('charge');
      fx('charge', { x: e.x, y: e.y - spriteH(e) / 2, life: 40, c: '#ff8060' });
      await wait(24);
      return;
    }
    if (!skill) {
      const t = pick(party);
      await melee(e, t, () => physicalHit(e, t, 1));
      return;
    }
    message(skill.name, 80);
    if (skill.beam) { await enemyBeam(e, skill); return; }
    if (skill.target === 'all') {
      e.flash = 12;
      startQTE('def', party[0], livingParty(), B.t + 22);
      await Tasks.tween(e, { z: 10 }, 10);
      SND.sfx('roar');
      await wait(12);
      await qteDone();
      SND.sfx('bighit'); Game.shake = 10;
      for (const t of livingParty()) {
        const [tx, ty] = center(t);
        fx('boom', { x: tx, y: ty, r: 12, life: 20 });
        damage(t, physDmg(e, t, skill.pow), { from: e });
        if (skill.st) addStatus(t, skill.st, skill.sc || 0.3);
        await wait(3);
      }
      await Tasks.tween(e, { z: 0 }, 8);
      await wait(16);
    } else {
      const t = pick(party);
      await melee(e, t, async () => {
        const hits = skill.hits || 1;
        for (let i = 0; i < hits; i++) {
          if (t.hp <= 0) break;
          e.pose = i % 2 ? null : 'attack';
          await physicalHit(e, t, skill.pow, { big: hits === 1 });
          await wait(hits > 1 ? 7 : 2);
        }
        if (skill.st && t.hp > 0) addStatus(t, skill.st, skill.sc || 0.3);
        e.pose = 'attack';
      }, { hold: 12 });
    }
  }
  // Rayon d'un ennemi : un héros qui connaît une vague d'énergie riposte, et c'est le duel de rayons !
  function beamTechs(c) {
    return availTechs(c.m).filter(id => { const T = TECHS[id]; return T && (T.anim === 'beam' || T.anim === 'beamAll' || (T.custom && T.custom.form === 'vague' && !CustomTech.isHeal(T.custom))) && c.ki >= techCost(c, id); });
  }
  function clashCandidate(targets) {
    for (const h of targets.concat(livingParty().filter(p => !targets.includes(p)))) {
      if (h.hp <= 0 || h.stun > 0 || h.sleep > 0) continue;
      const ids = beamTechs(h);
      if (ids.length) return { h, id: ids.sort((x, y) => (TECHS[y].pow || 2.5) - (TECHS[x].pow || 2.5))[0] };
    }
    return null;
  }
  async function enemyBeam(e, skill) {
    const targets = skill.target === 'all' ? livingParty() : [pick(livingParty())];
    const cl = clashCandidate(targets);
    if (cl) { await beamClash(e, skill, cl.h, cl.id, targets); return; }
    startQTE('def', targets[0], targets, B.t + 52);
    await beamFrom(e, targets, {
      name: skill.name, all: skill.target === 'all', c1: skill.c1 || '#a030d0', c2: skill.c2 || '#f0a0ff', noQte: true,
      onHit: t => { damage(t, kiDmg(e, t, skill.pow), { big: true, from: e }); if (skill.st) addStatus(t, skill.st, skill.sc || 0.3); },
    });
  }
  async function beamClash(e, skill, h, techId, targets) {
    const T = TECHS[techId];
    h.ki -= techCost(h, techId);
    message(h.name + ' riposte : ' + T.name + ' !', 120);
    h.pose = 'attack'; e.pose = 'attack';
    SND.sfx('charge');
    fx('charge', { x: h.x + 8, y: h.y - 13, life: 30 });
    await wait(30);
    SND.sfx('beam');
    const ec = e.d.char ? [e.x - 8, e.y - 13] : [e.x - GFX.monster(e.d.spr).w / 3, center(e)[1]];
    const ratio = clamp(e.atk * Opt.enemyDmg() / Math.max(1, h.mag), 0.6, 1.8);
    const manual = qteAllowed();
    const C = B.clash = { h, e, pos: 0.5, t: 0, hx: h.x + 8, hy: h.y - 13, ex: ec[0], ey: ec[1], c1: skill.c1 || '#a030d0', c2: skill.c2 || '#f0a0ff', manual };
    const win = manual ? null : Math.random() < clamp(0.62 / ratio, 0.25, 0.85);
    while (C.t < 260 && C.pos > 0 && C.pos < 1) {
      await wait(1);
      C.t++;
      if (manual) { C.pos -= 0.0028 * ratio; if (owner(h).pressed('a')) { C.pos += 0.032; SND.sfx('cursor'); } }
      else C.pos += (win ? 0.006 : -0.006) + (Math.random() - 0.5) * 0.014;
      if (C.t % 5 === 0) Game.shake = 2;
    }
    const won = C.pos >= 0.5;
    const [bx, by] = [C.hx + (C.ex - C.hx) * (won ? 1 : 0), C.hy + (C.ey - C.hy) * (won ? 1 : 0)];
    B.clash = null;
    h.pose = null; e.pose = null;
    SND.sfx('bighit'); Game.shake = 16;
    fx('boom', { x: bx, y: by, r: 26, life: 30, c1: won ? '#3070f8' : C.c1, c2: won ? '#80c8ff' : C.c2, c3: '#ffffff' });
    if (won) {
      message('Le rayon est repoussé !', 80);
      damage(e, kiDmg(h, e, (T.pow || 2.5) * 1.6), { big: true });
    } else {
      message(e.name + ' l\'emporte !', 80);
      for (const t of targets) if (t.hp > 0) { damage(t, Math.round(kiDmg(e, t, skill.pow) * (t === h ? 1.3 : 1)), { big: true }); if (skill.st) addStatus(t, skill.st, skill.sc || 0.3); }
    }
    await wait(36);
  }

  // ---------- Boucle ----------
  async function runAction(act) {
    B.busy = true;
    const actors = act.actors || [act.actor];
    if (actors.some(c => c.hp <= 0 || c.dead)) { for (const c of actors) { c.queued = false; } B.busy = false; return; }
    if (actors.some(c => c.stun > 0 || c.sleep > 0)) { for (const c of actors) { c.queued = false; c.atb = 0; } B.busy = false; return; } // paralysé ou endormi : action perdue
    for (const c of actors) { c.atb = 0; if (c.side === 'p' && act.kind !== 'guard') c.guard = false; }
    try {
      if (act.kind === 'attack') await doAttack(act.actor, act.target);
      else if (act.kind === 'tech') await doTech(act.actor, act.id, act.target);
      else if (act.kind === 'dual') await doDual(act.dual, act.actors, act.target);
      else if (act.kind === 'triple') await doTriple(act.triple, act.actors);
      else if (act.kind === 'item') await doItem(act.actor, act.id, act.target);
      else if (act.kind === 'guard') await doGuard(act.actor);
      else if (act.kind === 'charge') await doCharge(act.actor);
      else if (act.kind === 'enemy') await doEnemy(act.actor, act.skill);
      else if (act.kind === 'flee') { if (await doFlee(act.actor)) { await finish('flee'); return; } }
    } catch (err) { console.error(err); }
    if (!B) return;
    for (const c of actors) {
      c.queued = false; c.atb = 0;
      c.qteMul = null; c.qteRes = null; c.techMul = null;
      if (c.side === 'p' && act.kind !== 'charge' && act.kind !== 'guard') c.charged = false;
    }
    B.parry = null; B.qte = null;
    await wait(6);
    B.busy = false;
    checkEnd();
  }
  function checkEnd() {
    if (!B || B.phase !== 'main') return;
    if (!livingEnemies().length || B.enemies.some(e => e.yielded)) { B.phase = 'victory'; victory(); }
    else if (!livingParty().length) { B.phase = 'defeat'; defeat(); }
  }
  async function victory() {
    B.busy = true; B.menu = null; B.ready = []; B.actions = [];
    await wait(30);
    SND.playMusic('victory');
    const yielded = B.enemies.find(e => e.yielded);
    message(yielded ? yielded.d.yieldMsg || 'Victoire !' : 'Victoire !', 999);
    for (const c of livingParty()) { c.pose = 'win'; }
    const jumps = livingParty().map(async (c, i) => { await wait(i * 6); await arc(c, 10, 18); await arc(c, 6, 14); });
    let xp = 0, zeni = 0; const drops = [];
    for (const e of B.enemies) {
      xp += e.d.xp; zeni += e.d.zeni;
      if (e.d.drop && Math.random() < e.d.drop[1]) drops.push(e.d.drop[0]);
      for (const [id, ch] of e.d.drops || []) if (Math.random() < ch) drops.push(id);
    }
    xp = Math.round(xp * Opt.xp());
    zeni = Math.round(zeni * (P() ? P().zeniMul() : 1));
    if (B.opts.drops) drops.push(...B.opts.drops);
    Game.zeni += zeni;
    for (const d of drops) Game.give(d);
    if (P()) P().afterBattle(B);
    await Promise.all(jumps);
    if (xp || zeni || drops.length) {
      B.result = { xp, zeni, drops };
      await Tasks.until(() => Input.pressed('a') || Input.pressed('b'));
      SND.sfx('confirm');
      B.result = null;
    } else await wait(50);
    for (const c of B.party) {
      const m = c.m;
      if (m.hp <= 0) m.hp = 1;
      m.xp += xp;
      while (m.xp >= xpToNext(m.lv)) {
        m.xp -= xpToNext(m.lv);
        const learned = levelUp(m);
        SND.sfx('levelup');
        await UI.say(null, m.name + ' passe au niveau ' + m.lv + ' !');
        for (const t of learned) await UI.say(null, m.name + ' apprend la technique « ' + TECHS[t].name + ' » !');
        for (const d of DUALS) {
          if (!d.members.includes(m.id) || !d.members.every(id => Game.member(id))) continue;
          if (!d.members.every(id => Game.member(id))) continue;
          const ok = d.req.every((r, i) => Game.member(d.members[i]).techs.includes(r));
          const key = 'dual_' + d.id;
          if (ok && !Game.flags[key]) { Game.flags[key] = true; await UI.say(null, 'Nouvelle technique double : « ' + d.name + ' » !'); }
        }
      }
    }
    for (const m of Game.reserve) {
      m.xp += Math.round(xp * 0.75);
      while (m.xp >= xpToNext(m.lv)) { m.xp -= xpToNext(m.lv); levelUp(m); }
    }
    await finish('win');
  }
  async function defeat() {
    B.busy = true; B.menu = null;
    if (B.opts.spar) { // combat amical : pas de game over
      message('Combat amical perdu...', 999);
      await wait(80);
      for (const c of B.party) c.hp = c.maxhp;
      await finish('lose');
      return;
    }
    message('L\'équipe est K.O. ...', 999);
    SND.stopMusic(true);
    await wait(90);
    await UI.fadeTo(1, 40);
    B.msg = null;
    Field.battle = false;
    B = null;
    Main.gameOver();
  }
  async function finish(result) {
    B.msg = null;
    for (const c of B.party) c.pose = null;
    if (result !== 'flee') {
      // retour en formation de terrain
      await Promise.all(B.saved.map(({ a, x, y, dir }, i) => {
        const c = B.party[i];
        if (!c) return null;
        c.walking = true;
        return Tasks.tween(c, { x, y }, 14).then(() => { a.dir = dir; });
      }));
    } else {
      await UI.fadeTo(1, 12);
    }
    for (const { a, x, y, dir } of B.saved) { a.x = x; a.y = y; a.dir = dir; a.moving = false; }
    for (const c of B.party) c.pose = null;
    for (const c of B.party) if (c.m.hp <= 0) c.m.hp = 1;
    Field.battle = false; Field.camLock = false; Field.history = [];
    const res = B.res, prev = B.prevMusic, opts = B.opts;
    B = null;
    if (result === 'flee') { await wait(4); await UI.fadeTo(0, 12); }
    SND.playMusic(opts.afterMusic || Field.map.music || prev);
    res(result);
  }

  function techUsable(c, id) { return c.ki >= TECHS[id].ki; }
  function dualsFor(c) {
    const out = [];
    for (const d of DUALS) {
      if (!d.members.includes(c.id)) continue;
      const partners = d.members.map(id => B.party.find(p => p.id === id));
      if (partners.some(p => !p || p.hp <= 0)) continue;
      if (!d.req.every((r, i) => partners[i].m.techs.includes(r))) continue;
      const other = partners.find(p => p !== c);
      const ready = other.atb >= 100 && !other.queued;
      const ki = partners.every((p, i) => p.ki >= d.ki[i]);
      out.push({ dual: d, other, ok: ready && ki, ready, ki });
    }
    return out;
  }
  function openMenu(c) { c.guard = false; B.menu = { who: c, level: 'cmd', sel: 0, cscroll: 0, lsel: 0, scroll: 0, list: [], pending: null, tsel: 0, cands: [], t: 0 }; SND.sfx('cursor'); }
  // ---------- Combat automatique ----------
  function autoActive() {
    if (!B) return false;
    if (B.autoMode !== undefined && B.autoMode !== null) return B.autoMode;
    const o = Opt.get('auto');
    return o === 2 || (o === 1 && !B.boss);
  }
  function autoChoose(c) {
    const party = B.party, alive = party.filter(p => p.hp > 0), foes = livingEnemies();
    if (!foes.length) return { kind: 'guard', actor: c };
    const can = id => availTechs(c.m).includes(id) && TECHS[id] && c.ki >= techCost(c, id);
    const low = alive.slice().sort((x, y) => x.hp / x.maxhp - y.hp / y.maxhp)[0];
    const ko = party.find(p => p.hp <= 0);
    const hurt = alive.filter(p => p.hp / p.maxhp < 0.5).length;
    if (ko && can('reveil')) return { kind: 'tech', actor: c, id: 'reveil', target: ko };
    const items = !B.opts.noItems;
    if (ko && items && Game.items.capsule_vie) return { kind: 'item', actor: c, id: 'capsule_vie', target: ko };
    for (const id of ['soin_total', 'gateau', 'the_lunch']) if (hurt >= 2 && can(id)) return { kind: 'tech', actor: c, id, target: alive[0] };
    if (low.hp / low.maxhp < 0.4 && can('soin')) return { kind: 'tech', actor: c, id: 'soin', target: low };
    if (items && low.hp / low.maxhp < 0.3) { const it = ['super_tonique', 'tonique'].find(i => Game.items[i]); if (it) return { kind: 'item', actor: c, id: it, target: low }; }
    if (items && (c.poison || c.burn) && c.hp / c.maxhp < 0.5 && Game.items.remede) return { kind: 'item', actor: c, id: 'remede', target: c };
    if (foes.some(e => e.charging) && c.hp / c.maxhp < 0.6) return { kind: 'guard', actor: c };
    const target = foes.slice().sort((x, y) => (x.d.unkillable ? 1 : 0) - (y.d.unkillable ? 1 : 0) || x.hp - y.hp)[0];
    for (const t3 of triplesFor(c)) if (t3.ok) return { kind: 'triple', triple: t3.triple, actors: t3.triple.members.map(id => party.find(p => p.id === id)), target };
    for (const d of dualsFor(c)) if (d.ok) return { kind: 'dual', dual: d.dual, actors: d.dual.members.map(id => party.find(p => p.id === id)), target };
    const score = id => { const T = TECHS[id]; return (T.pow || 2.5) * (T.hits || 1) * (T.target === 'allEnemies' ? foes.length * 0.8 : 1); };
    const dmg = availTechs(c.m).filter(id => can(id) && ['enemy', 'allEnemies'].includes(TECHS[id].target) && (TECHS[id].pow || TECHS[id].custom) && !['janken', 'transfo'].includes(TECHS[id].kind)).sort((x, y) => score(y) - score(x));
    if (dmg.length && Math.random() < 0.85) return { kind: 'tech', actor: c, id: dmg[0], target };
    if (!dmg.length && c.ki < c.maxki * 0.25 && c.m.techs.some(id => TECHS[id] && TECHS[id].pow) && Math.random() < 0.5) return { kind: 'charge', actor: c };
    return { kind: 'attack', actor: c, target };
  }
  function targetCands(type, c) {
    switch (type) {
      case 'enemy': return livingEnemies().sort((a, b) => (a.d.unkillable ? 1 : 0) - (b.d.unkillable ? 1 : 0) || a.y - b.y).map(e => [e]); // le singe géant passe en dernier
      case 'allEnemies': return [livingEnemies()];
      case 'ally': return B.party.filter(p => p.hp > 0).map(p => [p]);
      case 'allyKO': return B.party.filter(p => p.hp <= 0).map(p => [p]);
      case 'allyAny': return B.party.map(p => [p]);
      case 'allAllies': return [livingParty()];
    }
    return [[c]];
  }
  function goTarget(type, from) {
    const M = B.menu;
    const cands = targetCands(type, M.who);
    if (!cands.length || !cands[0].length) { SND.sfx('buzz'); return; }
    M.cands = cands; M.tsel = 0; M.from = from; M.level = 'target'; M.ttype = type;
    SND.sfx('confirm');
  }
  function commit(act) {
    if (act.kind === 'triple' || act.kind === 'dual') act.actors = act.actors.filter(Boolean);
    const actors = act.actors || [act.actor];
    for (const c of actors) { c.queued = true; B.ready = B.ready.filter(r => r !== c); }
    B.actions.push(act);
    B.menu = null;
    SND.sfx('confirm');
  }
  function battleItems() { return Object.keys(Game.items).filter(id => Game.items[id] > 0 && ITEMS[id] && !ITEMS[id].key && !ITEMS[id].ingr); }
  function updateMenu() {
    const M = B.menu, c = M.who, Input = owner(c); // en mode 2 joueurs, chacun dirige ses héros
    if (c.hp <= 0 || c.queued || c.stun > 0 || c.sleep > 0) { B.menu = null; return; }
    if (M.level === 'cmd') {
      if (Input.repeat('up')) { M.sel = (M.sel + CMDS.length - 1) % CMDS.length; SND.sfx('cursor'); }
      if (Input.repeat('down')) { M.sel = (M.sel + 1) % CMDS.length; SND.sfx('cursor'); }
      M.cscroll = clamp(M.cscroll, Math.max(0, M.sel - 3), M.sel);
      if (Input.pressed('b') && B.ready.length > 1) { B.ready.push(B.ready.shift()); B.menu = null; SND.sfx('cursor'); return; }
      if (Input.pressed('a')) {
        const cmd = CMDS[M.sel];
        if (cmd === 'Attaque') { M.pending = { kind: 'attack' }; goTarget('enemy', 'cmd'); }
        else if (cmd === 'Tech') {
          M.list = availTechs(c.m).map(id => ({ id, name: TECHS[id].name + (P() && P().masteryLv(c.m, id) > 1 ? ' ' + '+'.repeat(P().masteryLv(c.m, id) - 1) : ''), cost: techCost(c, id), ok: techUsable(c, id) }));
          for (const d of dualsFor(c)) M.list.push({ dual: d.dual, other: d.other, name: d.dual.name, cost: d.dual.ki[d.dual.members.indexOf(c.id)], ok: d.ok, why: !d.ready ? 'attend ' + d.other.name : (!d.ki ? 'Ki insuffisant' : '') });
          for (const d of triplesFor(c)) M.list.push({ triple: d.triple, others: d.others, name: d.triple.name, cost: d.triple.ki[d.triple.members.indexOf(c.id)], ok: d.ok, why: !d.ready ? 'attend ' + d.others.map(o => o.name).join(' et ') : (!d.ki ? 'Ki insuffisant' : '') });
          M.level = 'tech'; M.lsel = 0; M.scroll = 0; SND.sfx('confirm');
        } else if (cmd === 'Objet') {
          if (B.opts.noItems) { SND.sfx('buzz'); message('Objets interdits pendant ce défi !', 60); return; }
          const items = battleItems();
          if (!items.length) { SND.sfx('buzz'); message('Aucun objet !', 50); return; }
          M.list = items.map(id => ({ id, name: ITEMS[id].name, n: Game.items[id], ok: true }));
          M.level = 'item'; M.lsel = 0; M.scroll = 0; SND.sfx('confirm');
        } else if (cmd === 'Garde') commit({ kind: 'guard', actor: c });
        else if (cmd === 'Charger') commit({ kind: 'charge', actor: c });
        else if (cmd === 'Fuir') commit({ kind: 'flee', actor: c });
      }
      return;
    }
    if (M.level === 'tech' || M.level === 'item') {
      const n = M.list.length;
      if (Input.repeat('up')) { M.lsel = (M.lsel + n - 1) % n; SND.sfx('cursor'); }
      if (Input.repeat('down')) { M.lsel = (M.lsel + 1) % n; SND.sfx('cursor'); }
      M.scroll = clamp(M.scroll, Math.max(0, M.lsel - 3), M.lsel);
      if (Input.pressed('b')) { M.level = 'cmd'; SND.sfx('cancel'); return; }
      if (Input.pressed('a')) {
        const e = M.list[M.lsel];
        if (!e.ok) { SND.sfx('buzz'); return; }
        if (M.level === 'item') { M.pending = { kind: 'item', id: e.id }; goTarget(ITEMS[e.id].target, 'item'); }
        else if (e.dual) { M.pending = { kind: 'dual', dual: e.dual, other: e.other }; goTarget(e.dual.target, 'tech'); }
        else if (e.triple) { M.pending = { kind: 'triple', triple: e.triple, others: e.others }; goTarget(e.triple.target, 'tech'); }
        else { M.pending = { kind: 'tech', id: e.id }; goTarget(TECHS[e.id].target, 'tech'); }
      }
      return;
    }
    if (M.level === 'target') {
      M.cands = targetCands(M.ttype, c).filter(g => g.length);
      if (!M.cands.length) { M.level = M.from; return; }
      M.tsel = clamp(M.tsel, 0, M.cands.length - 1);
      if (Input.repeat('up') || Input.repeat('left')) { M.tsel = (M.tsel + M.cands.length - 1) % M.cands.length; SND.sfx('cursor'); }
      if (Input.repeat('down') || Input.repeat('right')) { M.tsel = (M.tsel + 1) % M.cands.length; SND.sfx('cursor'); }
      if (Input.pressed('b')) { M.level = M.from; SND.sfx('cancel'); return; }
      if (Input.pressed('a')) {
        const target = M.cands[M.tsel][0];
        const p = M.pending;
        if (p.kind === 'attack') commit({ kind: 'attack', actor: c, target });
        else if (p.kind === 'tech') commit({ kind: 'tech', actor: c, id: p.id, target });
        else if (p.kind === 'item') commit({ kind: 'item', actor: c, id: p.id, target });
        else if (p.kind === 'triple') {
          if (!p.others.every(o => o.atb >= 100 && !o.queued && o.hp > 0)) { SND.sfx('buzz'); M.level = 'cmd'; return; }
          commit({ kind: 'triple', triple: p.triple, actors: p.triple.members.map(id => B.party.find(q => q.id === id)), target });
        } else if (p.kind === 'dual') {
          if (!(p.other.atb >= 100 && !p.other.queued && p.other.hp > 0)) { SND.sfx('buzz'); M.level = 'cmd'; return; }
          commit({ kind: 'dual', dual: p.dual, actors: p.dual.members.map(id => B.party.find(q => q.id === id)), target });
        }
      }
    }
  }
  function update(consumed) {
    if (!B) return;
    B.t++;
    for (const c of B.party.concat(B.enemies)) { if (c.flash > 0) c.flash--; c.anim++; }
    if (B.msg && B.msg.t < 999) { if (--B.msg.t <= 0) B.msg = null; }
    if (B.phase !== 'main') return;
    const qte = updateQTE();
    if (Input.p1.pressed('menu') && !qte) { B.autoMode = !autoActive(); message('Combat automatique : ' + (B.autoMode ? 'activé' : 'désactivé'), 70); SND.sfx('cursor'); }
    const paused = B.busy || (B.menu && B.menu.level !== 'cmd');
    if (!paused) {
      for (const c of B.party) {
        if (c.hp <= 0 || c.queued) continue;
        if (c.stun > 0) { c.stun--; continue; }
        if (c.sleep > 0) { c.sleep--; continue; }
        if (c.atb < 100) { c.atb = Math.min(100, c.atb + (c.spd + 18) / 45 * (P() ? P().atbMul(c) : 1)); }
        if (c.atb >= 100 && !B.ready.includes(c)) { B.ready.push(c); if (P()) P().onTurn(c, B); }
      }
      for (const e of livingEnemies()) {
        if (e.queued || e.d.passive) continue;
        if (e.stun > 0) { e.stun--; continue; }
        if (e.sleep > 0) { e.sleep--; continue; }
        if (e.charging) { if (--e.charging.t <= 0) { e.queued = true; B.actions.push({ kind: 'enemy', actor: e, skill: e.charging.skill }); e.charging = null; } continue; }
        e.atb += (e.spd + 18) / 45 * (B.boss ? 0.95 : 0.9);
        if (e.atb >= 100) { e.atb = 100; e.queued = true; B.actions.push({ kind: 'enemy', actor: e }); }
      }
      // poison et brûlure
      for (const c of B.party.concat(livingEnemies())) {
        if (c.hp <= 0 || c.dead || !(c.poison > 0 || c.burn > 0)) continue;
        if (++c.dotT < 150) continue;
        c.dotT = 0;
        const burn = c.burn > 0;
        let n = Math.max(1, Math.round(c.maxhp * (burn ? 0.08 : 0.06)));
        if (c.side === 'e' && c.d.boss) n = Math.min(n, 90);
        const [x, y] = center(c);
        fx(burn ? 'boom' : 'cloud', { x, y, r: 6, life: 18, c1: '#e04010', c2: '#f8a020' });
        damage(c, n, { dot: true, col: burn ? '#ff9040' : '#c080f0' });
        if (burn) c.burn--; else c.poison--;
      }
    }
    if (!B.busy && B.actions.length) {
      // les actions du joueur passent en priorité si plusieurs sont prêtes
      const i = B.actions.findIndex(a => a.kind !== 'enemy');
      const act = B.actions.splice(i >= 0 && Math.random() < 0.7 ? i : 0, 1)[0];
      runAction(act);
    }
    if (!B.menu && B.ready.length && !UI.blocking() && !consumed) {
      while (B.ready.length && (B.ready[0].hp <= 0 || B.ready[0].queued || B.ready[0].stun > 0 || B.ready[0].sleep > 0)) B.ready.shift();
      if (B.ready.length) openMenu(B.ready[0]);
    }
    if (B.menu && autoActive() && B.menu.level === 'cmd' && !UI.blocking()) { // combat automatique
      if (++B.menu.t > 10) { const c = B.menu.who; if (c.hp > 0 && !c.queued) commit(autoChoose(c)); else B.menu = null; }
      return;
    }
    if (B.menu && !UI.blocking() && !consumed && !qte) updateMenu();
  }

  // ---------- Rendu ----------
  function drawStatus(c, x, y, h) {
    const t = B.t;
    if (c.stun > 0) for (let i = 0; i < 3; i++) { const a = c.anim * 0.15 + i * 2.1; FONT.draw(ctx, '★', Math.round(x + Math.cos(a) * 8 - 2), Math.round(y - h - 8 + Math.sin(a) * 2), '#ffe060', null); }
    if (c.sleep > 0) FONT.draw(ctx, 'z', Math.round(x + 6 + Math.sin(t * 0.05) * 2), Math.round(y - h - 6 - (t % 40) / 8), '#a0c0ff', null);
    if (c.poison > 0) { ctx.fillStyle = '#b070e0'; for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 20) % 40; ctx.fillRect(Math.round(x - 6 + i * 10), Math.round(y - h + 8 - k / 3), 2, 2); } }
    if (c.burn > 0) { const k = Math.floor(t / 4) % 3; ctx.fillStyle = '#ff8020'; ctx.fillRect(Math.round(x - 9), Math.round(y - h / 2 - k), 3, 4); ctx.fillStyle = '#ffe060'; ctx.fillRect(Math.round(x - 8), Math.round(y - h / 2 - k + 1), 1, 2); }
  }
  function drawables(cx, cy) {
    if (!B) return [];
    const out = [];
    for (const c of B.party) {
      out.push({
        y: c.y, d: () => {
          const x = c.x - cx, y = c.y - cy;
          const spr = GFX.char(c.sprite);
          let img;
          if (c.hp <= 0) img = spr.ko;
          else if (c.flash > 0 && c.flash % 4 < 2) img = spr.white;
          else if (c.pose === 'attack') img = spr.attack;
          else if (c.pose === 'win') img = spr.down[0];
          else if (c.flee) img = spr.left[[1, 0, 2, 0][Math.floor(c.anim / 6) % 4]];
          else if (c.walking) img = spr.right[[1, 0, 2, 0][Math.floor(c.anim / 6) % 4]];
          else img = spr.right[0];
          Field.drawShadow(x, y, 7, 3);
          if (c.charged && c.hp > 0) { ctx.fillStyle = 'rgba(255,224,128,' + (0.25 + Math.sin(B.t * 0.3) * 0.1) + ')'; ctx.beginPath(); ctx.ellipse(x, y - 15 - c.z, 13, 19, 0, 0, 7); ctx.fill(); }
          if (c.hp <= 0) ctx.drawImage(img, Math.round(x - 16), Math.round(y - 20));
          else ctx.drawImage(img, Math.round(x - 12), Math.round(y - 32 - c.z));
          if (c.guard && c.hp > 0) { ctx.strokeStyle = 'rgba(128,200,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 9, y - 14 - c.z, 7, -1.2, 1.2); ctx.stroke(); }
          if (c.hp > 0) drawStatus(c, x, y - c.z, 30);
        },
      });
    }
    for (const e of B.enemies) {
      if (e.dead) continue;
      out.push({
        y: e.y, d: () => {
          const x = e.x - cx, y = e.y - cy;
          ctx.globalAlpha = clamp(e.alpha, 0, 1);
          const white = e.flash > 0 && e.flash % 4 < 2;
          if (e.d.char) {
            const spr = GFX.char(e.d.char);
            let img = white ? spr.whiteL : (e.pose === 'attack' ? spr.attackL : spr.left[e.walking ? [1, 0, 2, 0][Math.floor(e.anim / 6) % 4] : 0]);
            Field.drawShadow(x, y);
            ctx.drawImage(img, Math.round(x - 12), Math.round(y - 32 - e.z));
          } else {
            const m = GFX.monster(e.d.spr);
            const bob = e.d.fly ? Math.sin(e.anim * 0.12) * 3 - 8 : (e.stun > 0 ? 0 : Math.round(Math.sin(e.anim * 0.08)));
            Field.drawShadow(x, y, Math.max(5, m.w * 0.35), 2.5);
            ctx.drawImage(white ? m.white : m.img, Math.round(x - m.w / 2), Math.round(y - m.h + bob - e.z));
          }
          ctx.globalAlpha = 1;
          drawStatus(e, x, y, spriteH(e));
          if (e.charging) { // grosse attaque annoncée
            const h = spriteH(e), k = Math.floor(B.t / 6) % 2;
            FONT.draw(ctx, '!', Math.round(x - 1), Math.round(y - h - 16 - k), '#ff6040');
            ctx.strokeStyle = 'rgba(255,96,64,' + (0.4 + k * 0.3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - h / 2, h / 2 + 4, h / 2 + 6, 0, 0, 7); ctx.stroke();
          }
        },
      });
    }
    return out;
  }
  function drawQTE(cx, cy) {
    const Q = B.qte;
    if (!Q || !Q.open) return;
    if (Q.kind === 'charge') { // jauge de charge au-dessus du héros
      const a = Q.who, x = Math.round(a.x - cx - 18), y = Math.round(a.y - cy - 48);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, 38, 7);
      ctx.fillStyle = '#20204a'; ctx.fillRect(x, y, 36, 5);
      ctx.fillStyle = '#2a7a3a'; ctx.fillRect(x + Math.round(36 * 0.78), y, Math.round(36 * 0.24), 5);
      ctx.fillStyle = Q.val > 1.02 ? '#f87070' : '#80c8ff'; ctx.fillRect(x, y + 1, Math.round(36 * Math.min(1.15, Q.val) / 1.15 * 1.0), 3);
      if (!Q.holding && Math.floor(B.t / 8) % 2) FONT.drawCentered(ctx, 'Maintiens Z', x + 18, y - 11, '#fff');
      return;
    }
    const left = Q.at - B.t;
    for (const t of Q.targets) {
      const [x0, y0] = center(t), x = x0 - cx, y = y0 - cy;
      if (Q.kind === 'def') FONT.draw(ctx, '!', Math.round(x - 1), Math.round(y - 30 - (left < 6 ? 2 : 0)), left <= 6 ? '#ff6040' : '#ffd0a0');
      const r = 7 + Math.max(0, left) * 2;
      ctx.lineWidth = 2;
      ctx.strokeStyle = Math.abs(left) <= 2 ? '#ffe060' : 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = Q.kind === 'def' ? '#80f0ff' : '#ffe060';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke();
      if (Q.kind === 'atk') break;
    }
  }
  function drawClash(cx, cy) {
    const C = B.clash, t = B.t;
    const px = C.hx + (C.ex - C.hx) * C.pos - cx, py = C.hy + (C.ey - C.hy) * C.pos - cy;
    const seg = (x1, y1, x2, y2, c1, c2) => {
      const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1), w = 6 + Math.sin(t * 0.8) * 1.5;
      ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
      ctx.fillStyle = c1; ctx.fillRect(0, -w, len, w * 2); ctx.fillStyle = c2; ctx.fillRect(0, -w * 0.6, len, w * 1.2); ctx.fillStyle = '#fff'; ctx.fillRect(0, -w * 0.25, len, w * 0.5);
      ctx.restore();
    };
    seg(C.hx - cx, C.hy - cy, px, py, '#3070f8', '#80c8ff');
    seg(C.ex - cx, C.ey - cy, px, py, C.c1, C.c2);
    const r = 10 + Math.sin(t * 0.7) * 3;
    ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(px, py, r + 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) { const a = t * 0.4 + i; ctx.fillStyle = i % 2 ? '#ffe060' : '#fff'; ctx.fillRect(Math.round(px + Math.cos(a) * (r + 8)), Math.round(py + Math.sin(a) * (r + 8)), 2, 2); }
    UI.win(48, 26, 160, 30);
    FONT.drawCentered(ctx, C.manual ? 'Duel de rayons ! Martèle Z / A !' : 'Duel de rayons !', 128, 31, Math.floor(t / 10) % 2 ? UI.YEL : '#fff');
    ctx.fillStyle = '#000'; ctx.fillRect(63, 44, 130, 7);
    ctx.fillStyle = C.c1; ctx.fillRect(64, 45, 128, 5);
    ctx.fillStyle = '#3070f8'; ctx.fillRect(64, 45, Math.round(128 * clamp(C.pos, 0, 1)), 5);
  }
  function drawUI() {
    if (!B) return;
    const cx = Field.cx, cy = Field.cy;
    B.fx = B.fx.filter(f => { const keep = drawFx(f, cx, cy); f.t++; return keep; });
    // nombres de dégâts
    B.pops = B.pops.filter(p => {
      p.t++;
      const b = p.t < 24 ? -Math.abs(Math.sin(p.t / 24 * Math.PI * 2)) * (p.t < 12 ? 10 : 4) : 0;
      FONT.drawCentered(ctx, p.str, p.x - cx, p.y - cy + b, p.col);
      return p.t < 60;
    });
    if (B.phase === 'intro') return;
    drawQTE(cx, cy);
    if (B.clash) drawClash(cx, cy);
    // message du haut
    const M = B.menu;
    let top = B.msg ? B.msg.str : null;
    if (M && M.level === 'target') top = M.cands[M.tsel].length > 1 ? (M.cands[M.tsel][0].side === 'e' ? 'Tous les ennemis' : 'Toute l\'équipe') : M.cands[M.tsel][0].name;
    if (M && (M.level === 'tech' || M.level === 'item')) {
      const e = M.list[M.lsel];
      top = e.triple ? (e.ok ? e.triple.desc : 'Technique à trois (' + e.why + ')') : e.dual ? (e.ok ? e.dual.desc : 'Technique double (' + e.why + ')') : (M.level === 'tech' ? TECHS[e.id].desc : ITEMS[e.id].desc);
    }
    if (top) {
      const w = Math.min(248, Math.max(120, FONT.measure(top) + 20));
      UI.win((SW - w) / 2, 4, w, 20);
      FONT.drawCentered(ctx, top, SW / 2, 8, '#fff');
    }
    // curseur de cible
    if (M && M.level === 'target') {
      for (const t of M.cands[M.tsel]) {
        const [x, y] = center(t);
        const w = t.side === 'e' && !t.d.char ? GFX.monster(t.d.spr).w / 2 : 8;
        const o = Math.floor(B.t / 6) % 2;
        FONT.draw(ctx, '►', Math.round(x - cx - w - 9 + o), Math.round(y - cy - 6), '#ffffff');
      }
    }
    // fenêtres du bas
    const sx = M ? 82 : 4, sw = M ? 170 : 248;
    UI.win(sx, 164, sw, 56);
    B.party.forEach((c, i) => {
      const y = 169 + i * 16;
      const ready = c.atb >= 100 && c.hp > 0;
      const active = M && M.who === c;
      UI.text(c.name, sx + 8, y, c.hp <= 0 ? '#f87070' : active ? '#ffffff' : ready ? UI.YEL : '#c8d0f0');
      if (active) FONT.draw(ctx, '►', sx + 2, y, '#fff');
      if (Opt.twoPlayers() && i > 0) { ctx.fillStyle = '#e06030'; ctx.fillRect(sx + 1, y + 1, 4, 7); }
      let ix = sx + 44; // petits carrés d'état
      for (const [k, col] of [['poison', '#b070e0'], ['burn', '#ff8020'], ['sleep', '#80a8ff'], ['stun', '#ffe060'], ['guard', '#80c8ff'], ['charged', '#ffe080']]) {
        if (c.hp > 0 && c[k]) { ctx.fillStyle = '#000'; ctx.fillRect(ix - 1, y + 1, 6, 6); ctx.fillStyle = col; ctx.fillRect(ix, y + 2, 4, 4); ix += 6; }
      }
      FONT.drawRight(ctx, String(c.hp), sx + 78, y, c.hp < c.maxhp / 4 ? '#f87070' : '#fff');
      FONT.drawRight(ctx, String(c.ki), sx + 104, y, '#80d8f8');
      const bw = sw - 120;
      const full = c.atb >= 100;
      ctx.fillStyle = '#000'; ctx.fillRect(sx + 111, y + 3, bw + 2, 6);
      ctx.fillStyle = '#20204a'; ctx.fillRect(sx + 112, y + 4, bw, 4);
      ctx.fillStyle = c.hp <= 0 ? '#503040' : full ? (Math.floor(B.t / 6) % 2 ? '#ffffff' : '#f8e070') : '#5890f8';
      ctx.fillRect(sx + 112, y + 4, Math.round(bw * Math.min(1, c.atb / 100)), 4);
    });
    if (autoActive()) { UI.win(SW - 56, 146, 52, 18); FONT.drawCentered(ctx, 'AUTO', SW - 30, 150, Math.floor(B.t / 20) % 2 ? UI.YEL : '#fff'); }
    if (M) {
      UI.win(4, 164, 76, 56);
      CMDS.slice(M.cscroll, M.cscroll + 4).forEach((s, j) => {
        const i = j + M.cscroll;
        const dim = (s === 'Fuir' && !B.canFlee) || (s === 'Objet' && (!battleItems().length || B.opts.noItems));
        UI.text(s, 20, 169 + j * 12, dim ? '#7078a0' : (M.level === 'cmd' ? '#fff' : '#a0a8c8'));
        if (M.level === 'cmd' && i === M.sel) UI.cursor(8, 169 + j * 12);
      });
      if (M.cscroll > 0) FONT.draw(ctx, '▲', 68, 160, '#fff');
      if (M.cscroll + 4 < CMDS.length) FONT.draw(ctx, '▼', 68, 213, '#fff');
      if (M.level === 'tech' || M.level === 'item' || (M.level === 'target' && (M.from === 'tech' || M.from === 'item'))) {
        const list = M.list;
        UI.win(82, 164, 170, 56);
        list.slice(M.scroll, M.scroll + 4).forEach((e, j) => {
          const i = j + M.scroll, y = 169 + j * 12;
          const col = e.ok ? (e.triple ? '#ffd890' : e.dual ? '#f8c0f0' : '#fff') : '#7078a0';
          UI.text(e.name, 98, y, col);
          if (M.level === 'tech' || M.from === 'tech') {
            if (e.dual) FONT.drawRight(ctx, '+' + e.other.name, 216, y, e.ok ? '#c8a0e0' : '#7078a0');
            if (e.triple) FONT.drawRight(ctx, '+2', 216, y, e.ok ? '#e8c070' : '#7078a0');
            FONT.drawRight(ctx, String(e.cost), 244, y, e.ok ? '#80d8f8' : '#7078a0');
          } else FONT.drawRight(ctx, 'x' + e.n, 244, y, '#fff');
          if (i === M.lsel) { if (M.level !== 'target') UI.cursor(86, y); else FONT.draw(ctx, '►', 86, y, '#a0a8c8'); }
        });
        if (M.scroll > 0) FONT.draw(ctx, '▲', 238, 158, '#fff');
        if (M.scroll + 4 < list.length) FONT.draw(ctx, '▼', 238, 213, '#fff');
      }
    }
    // résultat
    if (B.result) {
      const r = B.result;
      const lines = ['Expérience : ' + r.xp, 'Zénis : ' + r.zeni];
      for (const d of r.drops) lines.push('Obtenu : ' + itemDef(d).name);
      const h = lines.length * 12 + 12;
      UI.win(48, 30, 160, h);
      lines.forEach((l, i) => FONT.drawCentered(ctx, l, 128, 36 + i * 12, i < 2 ? '#fff' : UI.YEL));
    }
  }

  return { start, update, drawables, drawUI, drawFx, active: () => !!B, reset() { B = null; }, state: () => B };
})();
