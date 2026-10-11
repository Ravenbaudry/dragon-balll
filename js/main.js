// Boucle principale, écran titre, game over, finale (Shenron) et crédits.
const Main = (() => {
  let titleSel = 0, overSel = 0, credits = null;
  const textCache = {};
  function bigText(str, cx, y, scale, col, outline = K) {
    const key = str + col + outline;
    let c = textCache[key];
    if (!c) {
      const w = FONT.measure(str) + 4;
      c = GFX.mk(w, 15);
      const x = c.getContext('2d');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [1, 2], [0, 2], [2, 2]]) FONT.draw(x, str, 2 + dx, 1 + dy, outline, null);
      FONT.draw(x, str, 2, 1, col, null);
      textCache[key] = c;
    }
    ctx.drawImage(c, Math.round(cx - c.width * scale / 2), Math.round(y), c.width * scale, c.height * scale);
  }
  let cloud = null;
  function kintoun() {
    if (cloud) return cloud;
    const ins = (x, y) => [[8, 9, 6], [16, 7, 7], [24, 9, 6], [13, 11, 5], [20, 11, 5]].some(([a, b, r]) => (x - a) ** 2 + (y - b) ** 2 <= r * r);
    cloud = (function () {
      const c = GFX.mk(34, 18), x = c.getContext('2d');
      for (let j = 0; j < 18; j++) for (let i = 0; i < 34; i++) {
        if (ins(i, j)) { x.fillStyle = j < 7 ? '#fff8b0' : j < 12 ? '#f8e060' : '#e0a828'; x.fillRect(i, j, 1, 1); }
        else if (ins(i - 1, j) || ins(i + 1, j) || ins(i, j - 1) || ins(i, j + 1)) { x.fillStyle = '#8a5a10'; x.fillRect(i, j, 1, 1); }
      }
      // traînée
      x.fillStyle = '#f8e060'; x.fillRect(29, 11, 4, 2); x.fillRect(31, 10, 3, 1);
      return c;
    })();
    return cloud;
  }
  const stars = Array.from({ length: 70 }, (_, i) => [GFX.hash(i, 1) % SW, GFX.hash(i, 2) % 140, GFX.hash(i, 3) % 3]);

  // ---------------- Titre ----------------
  function drawSky(t, top = '#0a0a30', mid = '#3a2a70', bot = '#f08850') {
    const g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const [x, y, s] of stars) {
      if ((Math.floor(t / 20) + x) % 7 === 0) continue;
      ctx.fillStyle = s === 0 ? '#ffffff' : s === 1 ? '#c0c8ff' : '#ffe8a0';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  function drawMountains(t) {
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = layer ? '#2a1a40' : '#4a2a58';
      for (let x = 0; x < SW; x++) {
        const h = layer ? 30 + Math.sin(x * 0.03 + 1) * 14 + Math.sin(x * 0.11) * 5 : 50 + Math.sin(x * 0.02) * 20 + Math.sin(x * 0.07 + 2) * 8;
        ctx.fillRect(x, SH - h, 1, h);
      }
    }
  }
  function drawTitle() {
    const t = Game.frame;
    drawSky(t);
    drawMountains(t);
    // boule à 4 étoiles géante
    const b = GFX.dragonBall(4, 14);
    const by = 28 + Math.sin(t * 0.04) * 3;
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 0.05) * 0.1;
    ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(128, by + 24, 30, 0, 7); ctx.fill();
    ctx.restore();
    ctx.drawImage(b, 128 - 24, by, 48, 48);
    bigText('DRAGON BALL', 128, 82, 3, '#f8a020', '#601808');
    bigText('La Quête des 7 Boules', 128, 128, 1, '#fff4c0', '#401020');
    // Goku sur Kinto'un
    const cx = ((t * 0.9) % (SW + 120)) - 60, cy = 150 + Math.sin(t * 0.08) * 4;
    ctx.drawImage(GFX.char('goku').right[0], Math.round(cx + 9), Math.round(cy - 15));
    ctx.drawImage(kintoun(), Math.round(cx), Math.round(cy));
    // menu
    const opts = menuOptions();
    opts.forEach((o, i) => {
      const y = 168 + i * 13;
      FONT.drawCentered(ctx, o, 128, y, i === titleSel ? '#ffffff' : '#a0a0c8');
      if (i === titleSel) UI.cursor(128 - FONT.measure(o) / 2 - 12, y);
    });
    FONT.drawCentered(ctx, 'Jeu de fan non officiel', 128, 208, '#8888b0');
  }
  function menuOptions() { return Game.hasSave() ? ['Continuer', 'Nouvelle partie'] : ['Nouvelle partie']; }
  function updateTitle() {
    const opts = menuOptions();
    if (SND.current() !== 'title' && Game.frame > 2) SND.playMusic('title');
    if (Input.repeat('up') || Input.repeat('down')) { titleSel = (titleSel + 1) % opts.length; SND.sfx('cursor'); }
    if (Input.pressed('a')) {
      SND.init();
      SND.sfx('confirm');
      if (opts[titleSel] === 'Continuer') continueGame(); else newGame();
    }
  }
  function resetWorld() {
    Tasks.reset(); Battle.reset();
    Field.locks = 0; Field.battle = false; Field.camLock = false;
    Shenron.active = false;
  }
  async function newGame() {
    resetWorld();
    Game.newGame();
    UI.fade.v = 1;
    Game.mode = 'field';
    Field.load('maison', 5, 4, 'up');
    await MAPS.maison.onEnter();
  }
  async function continueGame() {
    resetWorld();
    if (!Game.load()) return newGame();
    UI.fade.v = 1;
    Game.mode = 'field';
    const s = Game.spawn;
    Field.load(s.mapId, 0, 0, s.dir, s.x, s.y);
    await UI.fadeTo(0, 24);
  }

  // ---------------- Game over ----------------
  function gameOver() {
    resetWorld();
    Game.mode = 'gameover';
    overSel = 0;
    SND.playMusic('gameover');
    UI.fade.v = 1;
    UI.fadeTo(0, 40);
  }
  function drawGameOver() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#000000'); g.addColorStop(1, '#3a0818');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    bigText('GAME OVER', 128, 60, 3, '#e83838', '#200008');
    FONT.drawCentered(ctx, 'Même les plus grands guerriers tombent parfois...', 128, 110, '#c0a0b0');
    const opts = Game.hasSave() ? ['Reprendre la sauvegarde', 'Écran titre'] : ['Écran titre'];
    opts.forEach((o, i) => {
      FONT.drawCentered(ctx, o, 128, 150 + i * 14, i === overSel ? '#fff' : '#a08890');
      if (i === overSel) UI.cursor(128 - FONT.measure(o) / 2 - 12, 150 + i * 14);
    });
  }
  function updateGameOver() {
    const opts = Game.hasSave() ? ['load', 'title'] : ['title'];
    if (Input.repeat('up') || Input.repeat('down')) { overSel = (overSel + 1) % opts.length; SND.sfx('cursor'); }
    if (Input.pressed('a')) {
      SND.sfx('confirm');
      if (opts[overSel] === 'load') continueGame();
      else { Game.mode = 'title'; titleSel = 0; SND.playMusic('title'); }
    }
  }

  // ---------------- Shenron ----------------
  const Shenron = { active: false, prog: 0, dark: 0, x: 0, y: 0, balls: [], flash: 0, glow: 0 };
  function bodyPoint(s, t) {
    const S = Shenron;
    const x = S.x + Math.sin(s * Math.PI * 3.2 + t * 0.02) * (14 + s * 46) + s * 20;
    const y = S.y - 8 - s * 168 + Math.sin(s * 9 + t * 0.03) * 3;
    return [x, y];
  }
  function drawShenron(cx, cy) {
    const S = Shenron, t = Game.frame;
    if (S.dark > 0) { ctx.fillStyle = 'rgba(4,8,20,' + S.dark + ')'; ctx.fillRect(0, 0, SW, SH); }
    // boules
    for (const b of S.balls) {
      if (b.gone) continue;
      const img = GFX.dragonBall(b.n, 10);
      const gl = S.glow * (0.6 + Math.sin(t * 0.2 + b.n) * 0.4);
      if (gl > 0) { ctx.fillStyle = 'rgba(255,220,80,' + (gl * 0.5) + ')'; ctx.beginPath(); ctx.arc(b.x - cx, b.y - cy - 6, 9, 0, 7); ctx.fill(); }
      ctx.drawImage(img, Math.round(b.x - cx - 6), Math.round(b.y - cy - 12));
    }
    if (S.prog <= 0) return;
    const N = 70, upto = Math.floor(N * S.prog);
    const pts = [];
    for (let i = 0; i <= upto; i++) { const s = i / N; const [x, y] = bodyPoint(s, t); pts.push([x - cx, y - cy, s]); }
    // aura
    ctx.fillStyle = 'rgba(160,255,140,0.10)';
    for (const [x, y, s] of pts) { ctx.beginPath(); ctx.arc(x, y, 14 - s * 3 + Math.sin(t * 0.1 + s * 10) * 2, 0, 7); ctx.fill(); }
    const rad = s => 8 - s * 3 + Math.sin(s * Math.PI) * 2;
    ctx.fillStyle = '#0a2410';
    for (const [x, y, s] of pts) { ctx.beginPath(); ctx.arc(x, y, rad(s) + 1, 0, 7); ctx.fill(); }
    for (const [x, y, s] of pts) {
      ctx.fillStyle = '#3c9a44'; ctx.beginPath(); ctx.arc(x, y, rad(s), 0, 7); ctx.fill();
      ctx.fillStyle = '#5cc060'; ctx.beginPath(); ctx.arc(x - 2, y - 2, rad(s) * 0.5, 0, 7); ctx.fill();
    }
    pts.forEach(([x, y, s], i) => {
      if (i % 3 === 0) { ctx.fillStyle = '#e8d070'; ctx.fillRect(Math.round(x + rad(s) * 0.3), Math.round(y), 3, 2); }
      if (i % 4 === 0) { ctx.fillStyle = '#c84030'; ctx.fillRect(Math.round(x - rad(s) - 1), Math.round(y - 2), 2, 3); }
    });
    if (S.prog >= 0.98) drawHead(pts[pts.length - 1][0], pts[pts.length - 1][1], t);
  }
  function drawHead(x, y, t) {
    x = Math.round(x); y = Math.round(y);
    const k = '#0a2410', g = '#3c9a44', l = '#5cc060', d = '#2a6a30';
    // cornes
    ctx.fillStyle = '#e8d8a8';
    for (const s of [-1, 1]) { for (let i = 0; i < 12; i++) ctx.fillRect(x + s * (4 + i * 0.6), y - 10 - i, 2, 2); ctx.fillRect(x + s * 9, y - 18, 4 * s, 2); }
    // crâne
    ctx.fillStyle = k; ctx.beginPath(); ctx.ellipse(x, y - 4, 13, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 4, 12, 9, 0, 0, 7); ctx.fill();
    // museau
    ctx.fillStyle = k; ctx.beginPath(); ctx.ellipse(x - 14, y + 1, 12, 7, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(x - 14, y, 11, 6, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = d; ctx.fillRect(x - 25, y + 3, 18, 2);
    // mâchoire
    ctx.fillStyle = k; ctx.fillRect(x - 24, y + 5, 20, 4);
    ctx.fillStyle = '#e8d070'; ctx.fillRect(x - 23, y + 5, 18, 3);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 22 + i * 4, y + 4, 2, 2);
    // narine
    ctx.fillStyle = k; ctx.fillRect(x - 23, y - 2, 2, 2);
    // yeux rouges
    const glow = Math.floor(t / 8) % 2;
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 8, 7, 4);
    ctx.fillStyle = glow ? '#ff2020' : '#ff6040'; ctx.fillRect(x - 5, y - 8, 4, 4);
    ctx.fillStyle = k; ctx.fillRect(x - 7, y - 10, 9, 2);
    // moustaches
    ctx.fillStyle = '#c8e8a0';
    for (let i = 0; i < 34; i++) {
      ctx.fillRect(x - 24 - i, Math.round(y - 2 + Math.sin(i * 0.25 + t * 0.06) * 4 + i * 0.3), 1, 1);
      ctx.fillRect(x - 22 - i * 0.9, Math.round(y + 4 + Math.sin(i * 0.2 + t * 0.05 + 2) * 4 + i * 0.5), 1, 1);
    }
    // crinière
    ctx.fillStyle = '#c84030';
    for (let i = 0; i < 6; i++) ctx.fillRect(x + 8 + i * 2, y - 6 + i * 2, 3, 2);
  }
  async function shenronFinale() {
    const S = Shenron;
    await UI.fadeTo(1, 30);
    SND.stopMusic(true);
    Field.load('chateau', 15.5, 17, 'up');
    Field.entities = Field.entities.filter(e => e.kind !== 'enemy');
    SND.stopMusic(false);
    Field.camLock = true;
    S.x = 16 * 16; S.y = 15 * 16;
    Field.camX = S.x - SW / 2; Field.camY = S.y - 190;
    S.balls = [1, 2, 3, 4, 5, 6, 7].map((n, i) => {
      const a = i / 7 * Math.PI * 2 - Math.PI / 2;
      return { n, x: S.x + Math.cos(a) * 18, y: S.y + Math.sin(a) * 9, gone: false };
    });
    S.active = true; S.prog = 0; S.dark = 0; S.glow = 0;
    const party = Field.actors;
    const spots = [[S.x - 30, S.y + 30], [S.x, S.y + 38], [S.x + 30, S.y + 30]];
    party.forEach((a, i) => { a.x = spots[i][0]; a.y = spots[i][1]; a.dir = 'up'; });
    Field.history = [];
    await UI.fadeTo(0, 40);
    await say('Bulma', 'Voilà... Les sept Boules de Cristal, enfin réunies !');
    await say('Krilin', 'Elles... elles se mettent à briller !');
    await Tasks.tween(S, { glow: 1 }, 50);
    await say('Bulma', 'Sors de ces boules, dragon sacré ! Viens à nous, Shenron, et exauce notre vœu !');
    SND.playMusic('shenron');
    await Tasks.tween(S, { dark: 0.72 }, 60);
    SND.sfx('thunder'); Game.shake = 20;
    UI.fade.color = '#ffffff'; UI.fade.v = 0.8; UI.fadeTo(0, 20).then(() => { UI.fade.color = '#000'; });
    await wait(30);
    SND.sfx('roar');
    await Tasks.tween(S, { prog: 1 }, 170, 'out');
    SND.sfx('thunder'); Game.shake = 16;
    await wait(40);
    await say('Shenron', 'JE SUIS SHENRON, LE DRAGON SACRÉ. JE PEUX EXAUCER UN VŒU, QUEL QU\'IL SOIT.');
    await say('Goku', 'Wouaaah ! Un vrai dragon ! Il est géant !');
    const wishes = ['Une montagne de nourriture !', 'Le petit ami idéal pour Bulma', 'Devenir le plus fort du monde', 'La paix dans le monde'];
    const r = await UI.ask('Shenron', 'PRONONCEZ VOTRE VŒU !', wishes, { top: true });
    if (r === 0) await say('Goku', 'Moi je veux... une montagne de nourriture ! Des raviolis, du poisson, des boulettes et des gâteaux !');
    if (r === 1) await say('Bulma', 'Je veux... le petit ami idéal ! Grand, beau, fort... et un peu timide, pourquoi pas ?');
    if (r === 2) await say('Krilin', 'Je veux devenir le plus fort du monde ! Plus fort que Goku !');
    if (r === 3) await say('Goku', 'Euh... La paix dans le monde ! Comme ça, plus personne n\'embêtera les gens !');
    await say('Shenron', r === 2 ? 'CE VŒU EST TROP FACILE... L\'ENTRAÎNEMENT T\'Y CONDUIRA. MAIS SOIT !' : 'TON VŒU EST EXAUCÉ.');
    SND.sfx('flash');
    UI.fade.color = '#ffffff'; UI.fade.v = 1; await UI.fadeTo(0, 40); UI.fade.color = '#000';
    await say('Shenron', 'ADIEU !');
    SND.sfx('roar');
    await Tasks.tween(S, { prog: 0 }, 50, 'in');
    // les boules s'envolent aux quatre coins du monde
    SND.sfx('ball');
    await Promise.all(S.balls.map((b, i) => {
      const a = i / 7 * Math.PI * 2;
      return Tasks.tween(b, { x: b.x + Math.cos(a) * 200, y: b.y - 220 - Math.sin(a) * 40 }, 50, 'in');
    }));
    S.balls.forEach(b => { b.gone = true; });
    await Tasks.tween(S, { dark: 0 }, 60);
    const endings = [
      ['Une pluie de nourriture tombe du ciel sur le château !', 'Goku se régale pendant trois jours entiers, sous l\'œil furieux de Bulma.', 'Bulma : « Mon vœu ! Mon petit ami parfait ! GOKUUU ! »'],
      ['Au loin, dans le désert, une lumière dorée enveloppe Yamcha...', 'Quelques jours plus tard, il frappe à la porte de Bulma, rouge comme une tomate.', 'Goku : « C\'est quoi, un petit ami ? Ça se mange ? »'],
      ['Shenron disparaît en souriant. Goku et Krilin se regardent...', 'Et partent s\'entraîner chez Tortue Géniale, pour devenir les plus forts !', 'Le grand tournoi des arts martiaux les attend...'],
      ['Une douce lumière se répand sur le monde entier.', 'Même l\'empereur Pilaf, dans son château, décide de... faire une sieste.', 'Goku : « Bon ! On repart à l\'aventure ? »'],
    ][r];
    for (const e of endings) await say(null, e);
    await say('Bulma', 'Les Boules de Cristal se sont dispersées... Dans un an, elles redeviendront actives. Une nouvelle aventure commencera !');
    await say('Goku', 'Génial ! On les cherchera encore ensemble ! Hein, Bulma ? Krilin ?');
    await UI.fadeTo(1, 60);
    S.active = false;
    Field.camLock = false;
    startCredits(r);
    await UI.fadeTo(0, 30);
  }

  // ---------------- Crédits ----------------
  function startCredits(r) {
    Game.mode = 'ending';
    SND.playMusic('title');
    credits = {
      y: SH + 10, lines: [
        ['DRAGON BALL', 'big'], ['La Quête des 7 Boules', 'sub'], '', '',
        ['~ FIN ~', 'yel'], '', '',
        'Un petit RPG de fan non officiel,', 'hommage à Dragon Ball et Chrono Trigger.', '', '',
        ['Personnages', 'yel'], 'Son Goku', 'Bulma', 'Krilin', 'Tortue Géniale', 'Oolong', 'Yamcha et Puar', 'L\'empereur Pilaf, Shu et Mai', 'Shenron', '', '',
        ['Programmation, graphismes, musique', 'yel'], 'Pixel art, code et chiptune', 'créés avec Claude', '', '',
        ['Dragon Ball', 'yel'], '© Akira Toriyama / Bird Studio', 'Shueisha, Toei Animation', 'Œuvre de fan sans but commercial.', '', '',
        ['Merci d\'avoir joué !', 'yel'], '', '', '', 'Appuie sur Z pour revenir au titre',
      ],
    };
  }
  function drawCredits() {
    const t = Game.frame;
    drawSky(t, '#000010', '#101040', '#302060');
    let y = credits.y;
    for (const l of credits.lines) {
      const [s, k] = Array.isArray(l) ? l : [l, ''];
      if (y > -40 && y < SH + 20) {
        if (k === 'big') bigText(s, 128, y, 2, '#f8a020', '#601808');
        else if (k === 'sub') FONT.drawCentered(ctx, s, 128, y + 10, '#fff4c0');
        else FONT.drawCentered(ctx, s, 128, y, k === 'yel' ? UI.YEL : '#e0e0f0');
      }
      y += k === 'big' ? 34 : 14;
    }
    credits.end = y;
    const cx = ((t * 0.6) % (SW + 120)) - 60;
    ctx.drawImage(GFX.char('goku').right[0], Math.round(cx + 9), 190 - 15 + Math.round(Math.sin(t * 0.08) * 3));
    ctx.drawImage(kintoun(), Math.round(cx), 190 + Math.round(Math.sin(t * 0.08) * 3));
  }
  function updateCredits() {
    if (credits.end === undefined || credits.end > SH / 2 + 20) credits.y -= Input.down('a') ? 2 : 0.4;
    else if (Input.pressed('a')) { Game.mode = 'title'; titleSel = 0; credits = null; SND.playMusic('title'); }
  }

  // ---------------- Boucle ----------------
  function step() {
    Input.poll();
    Game.frame++;
    Tasks.tick();
    if (Input.pressed('mute')) { const m = SND.toggleMute(); UI.notify(m ? 'Son coupé (M)' : 'Son activé (M)', 60); }
    switch (Game.mode) {
      case 'title': if (!UI.blocking()) updateTitle(); break;
      case 'field': {
        const consumed = UI.update();
        if (Field.battle) Battle.update(consumed);
        Field.update(consumed);
        Game.playFrames++;
        break;
      }
      case 'gameover': updateGameOver(); break;
      case 'ending': updateCredits(); break;
    }
  }
  function render() {
    switch (Game.mode) {
      case 'title': drawTitle(); break;
      case 'field':
        Field.draw();
        if (Shenron.active) drawShenron(Field.cx, Field.cy);
        if (Field.battle) Battle.drawUI();
        break;
      case 'gameover': drawGameOver(); break;
      case 'ending': drawCredits(); break;
    }
    UI.draw();
  }
  let last = 0, acc = 0;
  let errors = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!last) last = now;
    acc += Math.min(100, now - last); last = now;
    let n = 0;
    try {
      while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
      render();
    } catch (e) {
      if (errors++ < 5) console.error(e);
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
  function boot() {
    GFX.init();
    requestAnimationFrame(loop);
  }
  return { boot, gameOver, shenronFinale, Shenron, newGame, continueGame };
})();
const Shenron = Main.Shenron;
Main.boot();
