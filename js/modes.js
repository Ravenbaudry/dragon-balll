// Nouveaux modes de jeu : shoot'em up sur le Kinto'un, infiltration (gardes, champ de vision, tonneaux), arène de défis.
const Modes = (() => {
  const TS = 16;

  // =====================================================================
  // 1. Shoot'em up : Goku sur le Kinto'un contre une escadrille
  const THEMES = {
    pilaf: { name: 'Escadrille de Pilaf', sky: ['#4890e0', '#a8d8ff'], body: '#5878c8', dark: '#2a3c78', eye: '#ff3030', boss: 'machine', bossName: 'Pilaf Machine' },
    ruban: { name: 'Escadrille du Ruban Rouge', sky: ['#c86040', '#f8c890'], body: '#c83838', dark: '#6a1818', eye: '#ffe040', boss: 'machine', bossName: 'Forteresse volante' },
  };
  let theme = 'pilaf';
  const shotImgs = {};
  function enemyImg(kind) {
    const T = THEMES[theme], key = theme + kind;
    if (shotImgs[key]) return shotImgs[key];
    let c;
    if (kind === 'drone') {
      c = GFX.mk(16, 12); const x = c.getContext('2d');
      x.fillStyle = K; x.beginPath(); x.ellipse(8, 7, 8, 4, 0, 0, 7); x.fill(); x.beginPath(); x.arc(8, 5, 4, Math.PI, 0); x.fill();
      x.fillStyle = T.body; x.beginPath(); x.ellipse(8, 7, 7, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#c8d0e8'; x.beginPath(); x.arc(8, 5, 3, Math.PI, 0); x.fill();
      x.fillStyle = T.eye; x.fillRect(4, 7, 2, 1); x.fillRect(10, 7, 2, 1);
    } else if (kind === 'plane') {
      c = GFX.mk(24, 12); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(2, 4, 20, 5); x.fillRect(8, 0, 6, 12); x.fillRect(19, 2, 4, 3);
      x.fillStyle = T.body; x.fillRect(3, 5, 18, 3); x.fillRect(9, 1, 4, 10);
      x.fillStyle = T.dark; x.fillRect(20, 3, 2, 2); x.fillStyle = '#a0e0ff'; x.fillRect(4, 5, 3, 2);
    } else { // mine
      c = GFX.mk(12, 12); const x = c.getContext('2d');
      x.fillStyle = K; x.beginPath(); x.arc(6, 6, 6, 0, 7); x.fill();
      x.fillStyle = '#505058'; x.beginPath(); x.arc(6, 6, 5, 0, 7); x.fill();
      x.fillStyle = T.eye; x.fillRect(5, 5, 2, 2); x.fillStyle = '#a0a0b0'; x.fillRect(0, 5, 2, 2); x.fillRect(10, 5, 2, 2); x.fillRect(5, 0, 2, 2); x.fillRect(5, 10, 2, 2);
    }
    return (shotImgs[key] = c);
  }
  const shmup = {
    name: 'Bataille dans le ciel', who: 'Pilote', noCancel: true,
    help: 'Flèches : voler. Goku tire tout seul. Z / A : Kamehameha (3 charges), qui balaie toute une ligne ! Évite les tirs et bats le chef de l\'escadrille.',
    init(S) {
      Object.assign(S, { p: { x: 40, y: 112, inv: 0, hp: 3, cd: 0, kame: 3 }, beam: 0, shots: [], bullets: [], foes: [], booms: [], t: 0, boss: null, kills: 0, over: 0, won: false, clouds: Array.from({ length: 9 }, (_, i) => ({ x: (i * 53) % SW, y: 20 + (i * 37) % 180, s: 0.5 + (i % 3) * 0.4 })) });
    },
    spawn(S, kind, y, o = {}) { S.foes.push(Object.assign({ kind, x: SW + 12, y, t: 0, hp: kind === 'plane' ? 3 : kind === 'mine' ? 2 : 1, y0: y }, o)); },
    update(S) {
      const G = MiniGames.state(), p = S.p;
      S.t++;
      if (S.over) { if (++S.over > 90) G.done = true; return; }
      // déplacement et tirs
      const sp = Input.down('run') ? 2.6 : 2;
      if (Input.down('left')) p.x -= sp; if (Input.down('right')) p.x += sp;
      if (Input.down('up')) p.y -= sp; if (Input.down('down')) p.y += sp;
      p.x = clamp(p.x, 14, 200); p.y = clamp(p.y, 24, 206);
      if (--p.cd <= 0) { p.cd = 9; S.shots.push({ x: p.x + 14, y: p.y - 4 }); SND.note(84, 0.03, 'p25', 0.05); }
      if (Input.pressed('a') && p.kame > 0 && !S.beam) { p.kame--; S.beam = 46; SND.sfx('beam'); Game.shake = 6; }
      if (p.inv > 0) p.inv--;
      for (const c of S.clouds) { c.x -= c.s; if (c.x < -40) c.x = SW + 20; }
      // vagues
      const t = S.t;
      if (t < 1700) {
        if (t % 50 === 10 && t < 600) this.spawn(S, 'drone', 40 + ((t * 37) % 150), { amp: 22 });
        if (t > 500 && t % 90 === 30) this.spawn(S, 'plane', 30 + ((t * 53) % 160));
        if (t > 900 && t % 70 === 0) this.spawn(S, 'mine', 30 + ((t * 71) % 170));
        if (t > 1100 && t % 40 === 20) this.spawn(S, 'drone', 30 + ((t * 29) % 170), { amp: 34 });
      } else if (!S.boss && !S.foes.length) {
        const m = GFX.monster(THEMES[theme].boss);
        S.boss = { x: SW + 40, y: 112, hp: 180, max: 180, t: 0, w: m.w, h: m.h };
        UI.notify(THEMES[theme].bossName + ' approche !', 100); SND.sfx('roar');
      }
      // ennemis
      for (const f of S.foes) {
        f.t++;
        if (f.kind === 'drone') { f.x -= 1.7; f.y = f.y0 + Math.sin(f.t * 0.06) * f.amp; }
        else if (f.kind === 'plane') { f.x -= f.x > 190 ? 1.6 : 0.7; if (f.t % 70 === 40) { const a = Math.atan2(p.y - f.y, p.x - f.x); S.bullets.push({ x: f.x - 8, y: f.y, vx: Math.cos(a) * 1.9, vy: Math.sin(a) * 1.9 }); } }
        else { f.x -= 1.1; f.y += Math.sin(f.t * 0.04) * 0.5; }
      }
      const B = S.boss;
      if (B) {
        B.t++;
        B.x += (190 - B.x) * 0.02; B.y = 112 + Math.sin(B.t * 0.02) * 70;
        if (B.t % 60 === 0) for (let i = -2; i <= 2; i++) S.bullets.push({ x: B.x - B.w / 2, y: B.y, vx: -2.2, vy: i * 0.6 });
        if (B.t % 110 === 50) { const a = Math.atan2(p.y - B.y, p.x - B.x); S.bullets.push({ x: B.x - B.w / 2, y: B.y - 10, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, big: true }); }
      }
      // tirs de Goku
      for (const s of S.shots) s.x += 5;
      const hit = (f, w, h, x, y) => Math.abs(f.x - x) < w && Math.abs(f.y - y) < h;
      for (const s of S.shots) {
        for (const f of S.foes) if (!s.gone && f.hp > 0 && hit(f, 10, 8, s.x, s.y)) { s.gone = true; f.hp--; if (f.hp <= 0) this.kill(S, f); }
        if (!s.gone && B && hit(B, B.w / 2, B.h / 2, s.x, s.y)) { s.gone = true; B.hp--; B.flash = 4; }
      }
      if (S.beam > 0) { // Kamehameha : toute la ligne
        S.beam--;
        for (const f of S.foes) if (f.hp > 0 && f.x > p.x && Math.abs(f.y - p.y) < 16) { f.hp = 0; this.kill(S, f); }
        S.bullets = S.bullets.filter(b => !(b.x > p.x && Math.abs(b.y - p.y) < 14));
        if (B && Math.abs(B.y - p.y) < B.h / 2 + 10) { B.hp -= 1.2; B.flash = 2; }
      }
      // tirs ennemis et collisions avec Goku
      for (const b of S.bullets) { b.x += b.vx; b.y += b.vy; }
      const hurt = () => { if (p.inv > 0) return; p.hp--; p.inv = 90; Game.shake = 8; SND.sfx('bighit'); if (p.hp <= 0) { S.over = 1; SND.sfx('cancel'); } };
      for (const b of S.bullets) if (!b.gone && Math.abs(b.x - p.x) < (b.big ? 8 : 6) && Math.abs(b.y - (p.y - 6)) < (b.big ? 8 : 6)) { b.gone = true; hurt(); }
      for (const f of S.foes) if (f.hp > 0 && Math.abs(f.x - p.x) < 12 && Math.abs(f.y - (p.y - 6)) < 10) { f.hp = 0; this.kill(S, f); hurt(); }
      if (B && B.hp <= 0 && !S.won) {
        S.won = true; S.over = 1; G.score += 50;
        for (let i = 0; i < 8; i++) S.booms.push({ x: B.x + (Math.random() - 0.5) * B.w, y: B.y + (Math.random() - 0.5) * B.h, t: -i * 6 });
        SND.sfx('blast'); Game.shake = 20; S.boss = null;
      }
      S.shots = S.shots.filter(s => !s.gone && s.x < SW + 10);
      S.bullets = S.bullets.filter(b => !b.gone && b.x > -10 && b.x < SW + 10 && b.y > -10 && b.y < SH + 10);
      S.foes = S.foes.filter(f => f.hp > 0 && f.x > -30);
      S.booms = S.booms.filter(o => ++o.t < 24);
    },
    kill(S, f) { S.kills++; MiniGames.state().score += f.kind === 'plane' ? 3 : f.kind === 'mine' ? 2 : 1; S.booms.push({ x: f.x, y: f.y, t: 0 }); SND.sfx('hit'); },
    rank() { const S = MiniGames.state().s; return S.won ? Math.min(3, S.p.hp) : 0; },
    draw(S) {
      const T = THEMES[theme], p = S.p;
      const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, T.sky[0]); g.addColorStop(1, T.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
      for (const c of S.clouds) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 20 + c.s * 10, 7, 0, 0, 7); ctx.fill(); }
      for (const f of S.foes) { const im = enemyImg(f.kind); ctx.drawImage(im, Math.round(f.x - im.width / 2), Math.round(f.y - im.height / 2)); }
      if (S.boss) { const m = GFX.monster(T.boss), B = S.boss; ctx.drawImage(B.flash ? m.white : m.img, Math.round(B.x - m.w / 2), Math.round(B.y - m.h / 2)); if (B.flash) B.flash--; }
      for (const s of S.shots) { ctx.fillStyle = '#ffe060'; ctx.fillRect(Math.round(s.x) - 3, Math.round(s.y) - 1, 6, 3); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1); }
      for (const b of S.bullets) { ctx.fillStyle = K; ctx.beginPath(); ctx.arc(b.x, b.y, b.big ? 5 : 3, 0, 7); ctx.fill(); ctx.fillStyle = b.big ? '#ff8030' : '#ff4060'; ctx.beginPath(); ctx.arc(b.x, b.y, b.big ? 4 : 2, 0, 7); ctx.fill(); }
      if (S.beam > 0) { const w = 9 + Math.sin(S.t) * 2; ctx.fillStyle = '#3070f8'; ctx.fillRect(p.x + 10, p.y - 6 - w, SW, w * 2); ctx.fillStyle = '#80c8ff'; ctx.fillRect(p.x + 10, p.y - 6 - w * 0.6, SW, w * 1.2); ctx.fillStyle = '#fff'; ctx.fillRect(p.x + 10, p.y - 6 - w * 0.25, SW, w * 0.5); }
      if (!(p.inv > 0 && Math.floor(p.inv / 4) % 2) && !(S.over && !S.won)) ctx.drawImage(GFX.rider(charKey('goku')), Math.round(p.x - 17), Math.round(p.y - 30));
      for (const o of S.booms) if (o.t >= 0) { const r = 4 + o.t * 0.8; ctx.globalAlpha = 1 - o.t / 24; ctx.fillStyle = '#f8a020'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill(); ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      // interface
      for (let i = 0; i < 3; i++) FONT.draw(ctx, '♥', 6 + i * 9, 5, i < p.hp ? '#ff5070' : '#404870');
      FONT.draw(ctx, 'Kamé :', 40, 5, '#a0e0ff');
      for (let i = 0; i < 3; i++) { ctx.fillStyle = K; ctx.beginPath(); ctx.arc(80 + i * 9, 9, 3.5, 0, 7); ctx.fill(); ctx.fillStyle = i < p.kame ? '#80c8ff' : '#303860'; ctx.beginPath(); ctx.arc(80 + i * 9, 9, 2.5, 0, 7); ctx.fill(); }
      FONT.drawRight(ctx, 'Score : ' + MiniGames.state().score, 250, 5, '#fff');
      if (S.boss) { ctx.fillStyle = K; ctx.fillRect(58, 216, 140, 5); ctx.fillStyle = '#e83030'; ctx.fillRect(59, 217, Math.round(138 * Math.max(0, S.boss.hp) / S.boss.max), 3); }
      if (S.over && S.won) FONT.drawCentered(ctx, 'Victoire !', 128, 100, UI.YEL);
      else if (S.over) FONT.drawCentered(ctx, 'Goku est tombé du nuage...', 128, 100, '#ffffff');
    },
  };
  // une bataille aérienne, avec récompense selon le rang
  async function skyBattle(th = 'pilaf') {
    theme = th;
    shmup.name = THEMES[th].name;
    const r = await MiniGames.run('shmup', Game.member('goku'));
    return r ? r.rank : 0;
  }

  // =====================================================================
  // 2. Infiltration : des gardes qui patrouillent, un champ de vision, des tonneaux pour se cacher
  let barrel = null;
  function barrelImg() {
    if (barrel) return barrel;
    const c = GFX.mk(18, 22), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(1, 1, 16, 21); x.fillRect(0, 3, 18, 17);
    x.fillStyle = '#9a6034'; x.fillRect(2, 2, 14, 19); x.fillRect(1, 4, 16, 15);
    x.fillStyle = '#c08048'; x.fillRect(4, 2, 3, 19);
    x.fillStyle = '#5a5a68'; x.fillRect(1, 6, 16, 2); x.fillRect(1, 15, 16, 2);
    return (barrel = c);
  }
  let hidden = false, caught = false, checkpoint = null;
  function guard(id, path, o = {}) {
    return Object.assign({ kind: 'npc', id, sprite: 'soldier', tx: path[0][0], ty: path[0][1], guard: { path, i: 0, wait: 0, speed: o.speed || 0.7, look: o.look || 4.6 }, turn: false, talk: null, solid: false }, o.extra || {});
  }
  function hideSpot(id, tx, ty) {
    return {
      kind: 'npc', id, tx, ty, turn: false, get img() { return barrelImg(); }, box: [-8, -9, 16, 10],
      talk: async () => {
        hidden = !hidden;
        const L = Field.leader();
        if (hidden) { L.img = barrelImg(); Field.hideFollowers = true; SND.sfx('door'); UI.notify('Caché dans le tonneau ! (Z : sortir) Bouger fait du bruit...', 110); }
        else { L.img = null; Field.hideFollowers = false; SND.sfx('door'); }
      },
    };
  }
  // ligne de vue : pas de mur entre le garde et le héros
  function sees(g, L) {
    const dx = L.x - g.x, dy = (L.y - 6) - (g.y - 10), d = Math.hypot(dx, dy), G2 = g.guard;
    const range = G2.look * TS;
    if (d > range) return false;
    const dirv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.dir];
    const cos = (dx * dirv[0] + dy * dirv[1]) / Math.max(1, d);
    if (cos < 0.82 && d > 12) return false;
    if (hidden && (!L.moving || d > 2 * TS)) return false;
    for (let s = 0.1; s < 1; s += 0.1) { const x = g.x + dx * s, y = g.y - 10 + dy * s; if (Field.solid[Math.floor(y / TS)] && Field.solid[Math.floor(y / TS)][Math.floor(x / TS)]) return false; }
    return true;
  }
  function update() {
    if (!Field.map || !Field.map.infiltration || Field.locks || Field.battle || UI.blocking()) return;
    const L = Field.leader();
    if (!checkpoint || checkpoint.map !== Field.mapId) checkpoint = { map: Field.mapId, x: L.x, y: L.y, dir: L.dir };
    for (const g of Field.entities) {
      if (!g.guard || g.gone) continue;
      const G2 = g.guard, pt = G2.path[G2.i], tx = pt[0] * TS + 8, ty = pt[1] * TS + 14;
      if (G2.wait > 0) { G2.wait--; g.moving = false; if (G2.wait % 40 === 20) g.dir = ['up', 'right', 'down', 'left'][(['up', 'right', 'down', 'left'].indexOf(g.dir) + 1) % 4]; }
      else {
        const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
        if (d <= G2.speed) { g.x = tx; g.y = ty; G2.i = (G2.i + 1) % G2.path.length; G2.wait = pt[2] || 30; }
        else { g.x += dx / d * G2.speed; g.y += dy / d * G2.speed; g.moving = true; g.anim++; g.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
      }
      if (!caught && sees(g, L)) { caught = true; Field.run(() => caughtBy(g)); return; }
    }
  }
  async function caughtBy(g) {
    Field.emote(g, '!');
    SND.sfx('encounter');
    await UI.say('Soldat', pick(['Halte ! Un intrus !', 'Hé ! Qui va là ?!', 'Alerte ! Alerte !']));
    await UI.fadeTo(1, 20);
    hidden = false; Field.hideFollowers = false;
    const L = Field.leader(); L.img = null;
    for (const a of Field.actors) { a.x = checkpoint.x; a.y = checkpoint.y; a.dir = checkpoint.dir; }
    Field.history = [];
    for (const e of Field.entities) if (e.guard) { e.x = e.guard.path[0][0] * TS + 8; e.y = e.guard.path[0][1] * TS + 14; e.guard.i = 0; e.guard.wait = 30; }
    Field.snapCamera();
    await UI.fadeTo(0, 20);
    await UI.say(null, 'Repéré ! Retour au point de départ. Cache-toi dans les tonneaux et observe les rondes...');
    caught = false;
  }
  function drawField(cx, cy) { // champs de vision des gardes
    if (!Field.map || !Field.map.infiltration) return;
    for (const g of Field.entities) {
      if (!g.guard || g.gone) continue;
      const a0 = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[g.dir], r = g.guard.look * TS;
      ctx.fillStyle = 'rgba(255,240,120,0.16)';
      ctx.beginPath(); ctx.moveTo(g.x - cx, g.y - 10 - cy); ctx.arc(g.x - cx, g.y - 10 - cy, r, a0 - 0.6, a0 + 0.6); ctx.closePath(); ctx.fill();
    }
  }
  function onLoad() { hidden = false; caught = false; checkpoint = null; Field.hideFollowers = false; }

  // La cour du château de nuit : le défi de Mai
  MAPS.cour_nuit = {
    name: 'Cour du château (nuit)', music: 'castle', ground: 'c', infiltration: true, tint: 'rgba(14,14,64,0.42)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XccccccccccccccccccccccccccX',
      'XccccccccccIccccIccccccccccX',
      'XccccccccccccccccccccccccccX',
      'XccIccccXXXXccccXXXXccccIccX',
      'XcccccccXXXXccccXXXXcccccccX',
      'XccccccccccccccccccccccccccX',
      'XccccccccccccccccccccccccccX',
      'XcccXXXXccccccccccccXXXXcccX',
      'XcccXXXXccccccccccccXXXXcccX',
      'XccccccccccccccccccccccccccX',
      'XccIcccccccccIIccccccccccIcX',
      'XccccccccccccccccccccccccccX',
      'XcccccccXXXXccccXXXXcccccccX',
      'XcccccccXXXXccccXXXXcccccccX',
      'XccccccccccccccccccccccccccX',
      'XccccccccccccccccccccccccccX',
      'XXXXXXXXXXXXXccXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXccXXXXXXXXXXXXX',
    ],
    entities: () => [
      warp(13, 19, 2, 1, 'chateau', 15, 25, 'down'),
      { kind: 'chest', id: 'cour_tresor', tx: 13, ty: 2, talk: async e => {
        if (e.opened) { await UI.say(null, 'Le coffre est vide.'); return; }
        e.opened = true; Game.flags.chest_cour_tresor = true; Game.flags.courDone = true;
        SND.sfx('door'); Game.zeni += 1500; SND.sfx('coin');
        await UI.say(null, 'Le magot de l\'empereur Pilaf : 1 500 Zénis ! Défi d\'infiltration réussi !');
        await getItem('masque');
      } },
      hideSpot('tonneau1', 3, 16), hideSpot('tonneau2', 22, 16), hideSpot('tonneau3', 10, 11), hideSpot('tonneau4', 17, 11),
      hideSpot('tonneau5', 2, 7), hideSpot('tonneau6', 25, 7), hideSpot('tonneau7', 12, 4),
      guard('garde1', [[2, 13], [25, 13, 50]], { speed: 0.8 }),
      guard('garde2', [[25, 8], [2, 8, 50]], { speed: 0.9 }),
      guard('garde3', [[14, 3, 70], [14, 6, 60]], { speed: 0.5, look: 3.6 }),
      guard('garde4', [[6, 16, 80], [6, 11, 80]], { speed: 0.6, look: 4 }),
      guard('garde5', [[21, 11, 80], [21, 16, 80]], { speed: 0.6, look: 4 }),
    ],
    async onEnter() {
      onLoad();
      if (Game.flags.courIntro) return;
      Game.flags.courIntro = true;
      await Field.run(async () => {
        await UI.say('Mai', 'Le trésor de Pilaf est tout au fond de la cour. Si les gardes te voient, tu recommences. Les tonneaux, c\'est pratique pour se cacher... Hi hi.');
        await UI.say(null, 'Défi d\'infiltration : atteins le coffre sans être repéré. Les zones jaunes montrent ce que voient les gardes.');
      });
    },
  };

  const chateau = MAPS.chateau.entities;
  MAPS.chateau.entities = () => chateau().concat([npc('mai_defi', 'mai', 12, 26, async () => {
    if (Game.flags.courDone) { await UI.say('Mai', 'Tu as vidé le coffre de l\'empereur... Ne lui dis jamais que c\'était mon idée !'); return; }
    const r = await UI.ask('Mai', 'Psst ! L\'empereur est parti en vacances. Un défi : traverse la cour du château cette nuit sans te faire voir des gardes, et le trésor est à toi !', ['Relever le défi', 'Non merci'], { cancel: 1 });
    if (r !== 0) return;
    await UI.fadeTo(1, 20);
    Field.load('cour_nuit', 13.5, 17, 'up');
    await UI.fadeTo(0, 20);
    await MAPS.cour_nuit.onEnter();
  }, { cond: () => !!Game.flags.wish })]);

  // =====================================================================
  // 3. Arène de défis (île Papaye, après le tournoi)
  const AX = 17 * TS, AY = 12 * TS, CAM = [AX - 134, AY - 116];
  const POOL = [['loup_noir', 'tigre'], ['crabe', 'mouette', 'crabe'], ['bandit', 'bandit'], ['scorpion', 'serpent', 'brigand'], ['salamandre', 'follet'], ['robot', 'soldat'],
    ['golem', 'salamandre_bleue'], ['shu', 'mai'], ['soldat', 'robot', 'soldat'], ['golem', 'golem', 'follet']];
  const RUSH = ['ours', 'chef_brigand', 'taureau', 'yamcha', 'chichi', 'volcan', 'machine', 'bacterian', 'giran', 'nam', 'jackie2'];
  const avgLv = () => Game.party.reduce((s, m) => s + m.lv, 0) / Game.party.length;
  const records = () => (Game.extra.records = Game.extra.records || {});
  async function arenaFight(group, o = {}) {
    const F = Field;
    F.camLock = true; F.camX = CAM[0]; F.camY = CAM[1];
    const res = await Battle.start(group, Object.assign({ canFlee: false, spar: true, music: 'boss', afterMusic: 'tournoi' }, o));
    F.camLock = true; F.camX = CAM[0]; F.camY = CAM[1];
    return res;
  }
  async function arenaBegin() {
    await UI.fadeTo(1, 16);
    for (const a of Field.actors) { a.x = AX - 48; a.y = AY + 2; a.dir = 'right'; }
    Field.history = [];
    Field.camLock = true; Field.camX = CAM[0]; Field.camY = CAM[1];
    await UI.fadeTo(0, 16);
  }
  async function arenaEnd() {
    await UI.fadeTo(1, 16);
    Field.camLock = false;
    for (const a of Field.actors) { a.x = 5 * TS + 8; a.y = 12 * TS + 14; a.dir = 'down'; }
    Field.history = []; Field.snapCamera();
    Game.healAll();
    await UI.fadeTo(0, 16);
  }
  async function reward(key, tiers) { // récompense à la première réussite de chaque palier
    const rec = records();
    rec.got = rec.got || {};
    for (const [need, item, n] of tiers) {
      const id = key + need;
      if (rec[key] >= need && !rec.got[id]) {
        rec.got[id] = true;
        if (item === 'zeni') { Game.zeni += n; SND.sfx('coin'); await UI.say('Moine', 'Récompense : ' + n + ' Zénis !'); }
        else await getItem(item, n || 1);
      }
    }
  }
  async function arena() {
    const rec = records();
    const opts = ['Survie (vagues)', 'Boss en série', 'Contre la montre', 'Défi : Goku seul', 'Défi : sans objets', 'Partir'];
    const c = await UI.ask('Moine', 'L\'arène des défis est ouverte aux champions ! Quel défi ? (Les héros sont soignés après chaque défi.)', opts, { cancel: 5 });
    if (c === 5) return;
    Game.healAll();
    await arenaBegin();
    const boost = 1 + Math.max(0, (avgLv() - 12) / 14);
    if (c === 0) {
      let wave = 0;
      for (;;) {
        const g = POOL[Math.min(POOL.length - 1, wave)];
        UI.notify('Vague ' + (wave + 1), 80);
        const r = await arenaFight(g, { boost: boost * (1 + wave * 0.06), music: 'battle' });
        if (r !== 'win') break;
        wave++;
        for (const m of Game.party) if (m.hp > 0) m.hp = Math.min(m.maxhp, m.hp + Math.round(m.maxhp * 0.15));
        if (wave >= 10) break;
      }
      rec.survie = Math.max(rec.survie || 0, wave);
      await arenaEnd();
      await UI.say('Moine', wave >= 10 ? 'Les dix vagues ! Incroyable !' : 'Vagues remportées : ' + wave + '. Record : ' + rec.survie + '.');
      await reward('survie', [[3, 'zeni', 400], [6, 'super_tonique', 3], [10, 'medaille', 1]]);
    } else if (c === 1) {
      let n = 0;
      for (const id of RUSH) {
        UI.notify('Boss ' + (n + 1) + ' / ' + RUSH.length + ' : ' + ENEMIES[id].name, 90);
        const r = await arenaFight([id], { boost: Math.max(1, boost * (1.3 - n * 0.04)) });
        if (r !== 'win') break;
        n++;
        for (const m of Game.party) { if (m.hp <= 0) m.hp = 1; m.hp = Math.min(m.maxhp, m.hp + Math.round(m.maxhp * 0.25)); m.ki = Math.min(m.maxki, m.ki + Math.round(m.maxki * 0.25)); }
      }
      rec.rush = Math.max(rec.rush || 0, n);
      await arenaEnd();
      await UI.say('Moine', n >= RUSH.length ? 'Tous les boss vaincus d\'affilée ! Tu es une légende !' : 'Boss vaincus : ' + n + ' / ' + RUSH.length + '.');
      await reward('rush', [[4, 'senzu', 1], [RUSH.length, 'bracelet_ki', 1]]);
    } else if (c === 2) {
      const f0 = Game.frame;
      const r = await arenaFight(['golem', 'salamandre_bleue', 'golem'], { boost: boost * 1.2 });
      const s = Math.round((Game.frame - f0) / 60);
      await arenaEnd();
      if (r === 'win') {
        const medal = s <= 45 ? 3 : s <= 75 ? 2 : 1;
        rec.chrono = Math.max(rec.chrono || 0, medal);
        rec.chronoBest = Math.min(rec.chronoBest || 999, s);
        await UI.say('Moine', 'Temps : ' + s + ' secondes. Médaille ' + ['', 'de bronze', 'd\'argent', 'd\'or'][medal] + ' ! (Record : ' + rec.chronoBest + ' s)');
        await reward('chrono', [[1, 'zeni', 300], [3, 'aimant', 1]]);
      } else await UI.say('Moine', 'Raté ! Il faut gagner, et vite.');
    } else if (c === 3) {
      const g = Game.member('goku'), party = Game.party, reserve = Game.reserve;
      Game.party = [g]; Game.reserve = party.concat(reserve).filter(m => m !== g); Field.syncParty();
      for (const a of Field.actors) { a.x = AX - 48; a.y = AY + 2; }
      const r = await arenaFight(['nam', 'giran'], { boost });
      Game.party = party; Game.reserve = reserve; Field.syncParty();
      await arenaEnd();
      if (r === 'win') { rec.solo = 1; await UI.say('Moine', 'Goku seul contre deux finalistes... et il gagne !'); await reward('solo', [[1, 'grelot', 1]]); }
      else await UI.say('Moine', 'Même les champions ont besoin de leurs amis, parfois.');
    } else {
      const r = await arenaFight(['jackie2'], { boost: boost * 1.1, noItems: true });
      await arenaEnd();
      if (r === 'win') { rec.noitem = 1; await UI.say('Moine', 'Sans le moindre objet ! Bravo !'); await reward('noitem', [[1, 'oreiller', 1]]); }
      else await UI.say('Moine', 'Sans objets, il faut savoir se garder et se concentrer...');
    }
  }
  GEAR.medaille = { slot: 'acc', name: 'Médaille de l\'Arène', desc: 'Remise aux héros qui ont survécu aux dix vagues.', stats: { atk: 3, def: 3, mag: 3, spd: 1 }, price: 0 };

  if (typeof MiniGames !== 'undefined') MiniGames.GAMES.shmup = shmup;
  return { skyBattle, update, drawField, onLoad, arena, guard, hideSpot, THEMES, hidden: () => hidden };
})();
window.Modes = Modes;
