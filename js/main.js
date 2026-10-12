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
  const kintoun = () => GFX.kintoun();
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
    ctx.drawImage(GFX.char('goku').right[0], Math.round(cx + 5), Math.round(cy - 22));
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
    Shenron.active = false; Moon.active = false; epi = null;
    Tournoi.reset();
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
  // ---------------- Finale : Pilaf invoque Shenron ----------------
  const camPan = (y, frames) => Tasks.tween(Field, { camY: y }, frames, 'inOut');
  async function shenronFinale() {
    const S = Shenron;
    await UI.fadeTo(1, 30);
    SND.stopMusic(true);
    Field.load('chateau', 15.5, 8.6, 'down');
    Field.entities = Field.entities.filter(e => e.kind !== 'enemy');
    Field.hideParty = true;
    SND.stopMusic(false);
    Field.camLock = true;
    S.x = 16 * 16; S.y = 15 * 16;
    const LOW = S.y - 124, HIGH = S.y - 190;
    Field.camX = S.x - SW / 2; Field.camY = LOW;
    S.balls = [1, 2, 3, 4, 5, 6, 7].map((n, i) => {
      const a = i / 7 * Math.PI * 2 - Math.PI / 2;
      return { n, x: S.x + Math.cos(a) * 18, y: S.y + Math.sin(a) * 9, gone: false };
    });
    S.active = true; S.prog = 0; S.dark = 0; S.glow = 0;
    const pil = Field.addEntity({ kind: 'npc', id: 'f_pilaf', sprite: 'pilaf', x: S.x - 32, y: S.y + 4, dir: 'right' });
    const shu = Field.addEntity({ kind: 'npc', id: 'f_shu', sprite: 'shu', x: S.x - 48, y: S.y - 12, dir: 'right' });
    const mai = Field.addEntity({ kind: 'npc', id: 'f_mai', sprite: 'mai', x: S.x - 50, y: S.y + 20, dir: 'right' });
    await UI.fadeTo(0, 40);
    await say('Pilaf', 'Enfin ! Les sept Boules de Cristal sont à MOI ! Ha ha ha !');
    await Tasks.tween(S, { glow: 1 }, 50);
    await say('Pilaf', 'Sors de ces boules, dragon sacré ! Viens à moi, Shenron, et exauce mon vœu !');
    SND.playMusic('shenron');
    await Tasks.tween(S, { dark: 0.72 }, 60);
    SND.sfx('thunder'); Game.shake = 20;
    UI.fade.color = '#ffffff'; UI.fade.v = 0.8; UI.fadeTo(0, 20).then(() => { UI.fade.color = '#000'; });
    await wait(30);
    SND.sfx('roar');
    await Promise.all([Tasks.tween(S, { prog: 1 }, 170, 'out'), camPan(HIGH, 120)]);
    SND.sfx('thunder'); Game.shake = 16;
    await wait(40);
    await say('Shenron', 'JE SUIS SHENRON, LE DRAGON SACRÉ. JE PEUX EXAUCER UN VŒU, QUEL QU\'IL SOIT.');
    await say('Pilaf', 'Ha ha ha ! Shenron ! Je veux devenir le maître du mon...');
    await say('Bulma', 'ARRÊTEEEZ !');
    // l'équipe surgit du château
    await camPan(LOW, 40);
    Field.hideParty = false;
    const spots = [[S.x + 32, S.y + 16], [S.x + 52, S.y], [S.x + 56, S.y + 26]];
    await Promise.all(Field.actors.map(async (a, i) => {
      await wait(i * 10);
      await Field.walkTo(a, spots[i][0], spots[i][1], 2.2);
      a.dir = 'left';
    }));
    Field.history = [];
    pil.dir = 'right';
    Field.emote(pil, '!');
    await say('Pilaf', 'ENCORE VOUS ?! Shu ! Mai ! Arrêtez-les !');
    await say('Shu', 'Euh... Majesté... Ils ont détruit votre machine. Nous, on n\'a qu\'un pistolet et un shuriken...');
    await say('Bulma', 'Vite ! Il faut faire un vœu avant lui ! Le premier qui parle sera exaucé !');
    const wish = await chooseWish();
    await makeWish(wish, pil);
    // Shenron repart, les boules s'envolent
    await camPan(HIGH, 40);
    await say('Shenron', wish === 'krillin' ? 'LA VRAIE FORCE NE S\'OFFRE PAS... MAIS JE TE DONNE LE COURAGE DE LA CONQUÉRIR.' : 'TON VŒU EST EXAUCÉ.');
    SND.sfx('flash');
    UI.fade.color = '#ffffff'; UI.fade.v = 1; await UI.fadeTo(0, 40); UI.fade.color = '#000';
    await say('Shenron', 'ADIEU !');
    SND.sfx('roar');
    await Tasks.tween(S, { prog: 0 }, 50, 'in');
    SND.sfx('ball');
    await Promise.all(S.balls.map((b, i) => {
      const a = i / 7 * Math.PI * 2;
      return Tasks.tween(b, { x: b.x + Math.cos(a) * 200, y: b.y - 220 - Math.sin(a) * 40 }, 50, 'in');
    }));
    S.balls.forEach(b => { b.gone = true; });
    await Promise.all([Tasks.tween(S, { dark: wish === 'gohan' ? 0.4 : 0 }, 60), camPan(LOW, 50)]);
    Game.flags.wish = wish;
    await afterWish(wish, pil, shu, mai);
    await fullMoon(pil, shu, mai);
    await Tasks.tween(S, { dark: 0 }, 30);
    Game.setQuest('main', 'done', true);
    await say('Bulma', 'Les Boules de Cristal se sont dispersées aux quatre coins du monde... Dans un an, elles redeviendront actives.');
    await say('Goku', 'Génial ! Alors on les cherchera encore ensemble ! Hein, Bulma ?');
    await say('Bulma', 'Hi hi... On verra, petit singe. On verra !');
    await UI.fadeTo(1, 60);
    S.active = false;
    Field.camLock = false;
    const end = endingRank();
    await epilogue(buildEpilogue(wish, end));
    startCredits(end);
    await UI.fadeTo(0, 30);
  }

  // Qui fait le vœu ? (les options dépendent des compagnons et des choix passés)
  async function chooseWish() {
    const F = Game.flags;
    while (true) {
      const who = ['goku', 'bulma', 'krillin', 'yamcha', 'oolong'].filter(id => Game.member(id));
      const r = await UI.ask('Bulma', 'Qui fait le vœu ?', who.map(id => MEMBERS[id].name));
      const id = who[r];
      if (id !== 'goku') {
        const q = {
          bulma: ['Bulma', 'Le petit ami idéal ! (le vœu de Bulma)'],
          krillin: ['Krilin', 'Devenir plus fort ! (le vœu de Krilin)'],
          yamcha: ['Yamcha', 'Ne plus avoir peur des filles ! (le vœu de Yamcha)'],
          oolong: ['Oolong', 'Une culotte toute neuve ! (le vœu d\'Oolong)'],
        }[id];
        const c = await UI.ask(q[0], q[1], ['Faire ce vœu', 'Choisir quelqu\'un d\'autre'], { cancel: 1 });
        if (c === 0) return id;
        continue;
      }
      const opts = [];
      if (F.grave) opts.push(['gohan', 'Revoir Grand-père Gohan']);
      if (F.castleDestroyed) opts.push(['chateau', 'Rebâtir le château de Gyumao']);
      opts.push(['food', 'Une montagne de nourriture !']);
      opts.push(['paix', 'La paix dans le monde']);
      opts.push(['back', 'Laisser parler quelqu\'un d\'autre']);
      const c = await UI.ask('Goku', 'Mon vœu, c\'est...', opts.map(o => o[1]), { cancel: opts.length - 1 });
      if (opts[c][0] !== 'back') return opts[c][0];
    }
  }
  async function makeWish(w, pil) {
    const lines = {
      gohan: ['Goku', 'Shenron ! Je veux revoir mon grand-père Gohan ! Juste une fois !'],
      chateau: ['Goku', 'Shenron ! Je veux que le château de Gyumao soit reconstruit ! J\'ai fait une grosse bêtise...'],
      food: ['Goku', 'Shenron ! Je veux une montagne de nourriture ! Des raviolis, du poisson, des brochettes et des gâteaux !'],
      paix: ['Goku', 'Shenron ! Je veux la paix dans le monde ! Comme ça, plus personne n\'embêtera les gens !'],
      bulma: ['Bulma', 'Shenron ! Je veux le petit ami idéal ! Beau, fort, courageux... et un peu timide, pourquoi pas ?'],
      krillin: ['Krilin', 'Shenron ! Je veux devenir plus fort... assez fort pour protéger mes amis !'],
      yamcha: ['Yamcha', 'Shenron ! Je veux... ne plus avoir peur des filles !'],
      oolong: ['Oolong', 'Shenron ! Je veux... UNE CULOTTE TOUTE NEUVE !'],
    }[w];
    await say(lines[0], lines[1]);
    Field.emote(pil, '!');
    if (w === 'oolong') { await say('Bulma', 'OOLONG ?!'); await say('Pilaf', 'Une... une culotte ?!'); }
    else await say('Pilaf', 'NOOON ! Mon vœu ! C\'était MON vœu !');
    if (w === 'gohan') {
      await camPan(Field.camY - 66, 30);
      await say('Shenron', 'LE VIEIL HOMME A QUITTÉ CE MONDE IL Y A BIEN LONGTEMPS. JE NE PEUX PAS LE RAMENER À LA VIE...');
      await say('Shenron', 'MAIS SON ÂME POURRA TE PARLER... LE TEMPS D\'UN SOUFFLE DE VENT.');
    }
    if (w === 'chateau') Game.addKarma(2);
  }
  async function afterWish(w, pil, shu, mai) {
    const goku = Field.actors[0];
    if (w === 'gohan') {
      SND.playMusic('sad');
      const g = Field.addEntity({ kind: 'npc', id: 'f_gohan', sprite: 'gohan', x: Shenron.x, y: Shenron.y + 6, dir: 'right', ghost: 0, solid: false });
      SND.sfx('heal');
      await Tasks.tween(g, { ghost: 1 }, 60);
      await Field.walkTo(goku, Shenron.x + 22, Shenron.y + 8, 1);
      goku.dir = 'left';
      await say('Goku', 'G-Grand-père ?!');
      await say('Grand-père Gohan', 'Goku... Mon petit Goku. Comme tu as grandi...');
      if (Game.flags.voie === 'force') await say('Grand-père Gohan', 'Tu es devenu si fort ! Mais souviens-toi de ta promesse... et du but de ta force. Elle doit servir à protéger.');
      else await say('Grand-père Gohan', 'Tu as tenu ta promesse. Tu protèges tes amis, et tes amis te protègent. Je suis si fier de toi.');
      await say('Grand-père Gohan', 'Tu as gardé ma boule à quatre étoiles... Elle te mènera toujours vers des amis précieux.');
      await say('Grand-père Gohan', 'Ah, et surtout... ne regarde jamais la pleine lune, d\'accord ?');
      await say('Goku', 'Promis, Grand-père ! ... Pourquoi ?');
      await say('Grand-père Gohan', 'Ho ho ho... Mesdemoiselles, messieurs, prenez bien soin de mon petit-fils.');
      await say('Bulma', 'On vous le promet, Grand-père Gohan.');
      await Tasks.tween(g, { ghost: 0 }, 70);
      g.gone = true;
      await say('Goku', '... Merci, Shenron.');
      SND.playMusic('castle');
    } else if (w === 'food') {
      SND.sfx('item');
      await say(null, 'Une pluie de raviolis, de poissons grillés et de gâteaux tombe sur la cour du château !');
      await say('Goku', 'Miam ! Itadakimasu !');
      await say('Bulma', 'Goku... MON VŒU ! Mon petit ami parfait ! Grrr...');
    } else if (w === 'chateau') {
      await say(null, 'Au loin, vers le Mont Frypan, une lumière dorée enveloppe les ruines du château...');
      await say('Goku', 'Ouf. Gyumao et Chichi auront de nouveau une maison !');
      await say('Bulma', 'C\'est bien, Goku. Tu as réparé ta bêtise.');
      Game.addAff('bulma', 1, true);
    } else if (w === 'paix') {
      await say(null, 'Une douce lumière se répand sur la cour, puis sur le désert, puis sur le monde entier...');
      await say('Pilaf', 'Je... je me sens tout calme... J\'ai envie de... faire une sieste...');
    } else if (w === 'bulma') {
      if (Game.member('yamcha')) {
        await say('Yamcha', 'Hein ? Pourquoi est-ce que je brille tout à coup ?!');
        await say('Bulma', 'Yamcha... ? Oh. Ohhh ! Hi hi !');
        await say('Yamcha', 'J-je... euh... Bulma, tu veux... enfin... boire un thé un jour ?');
      } else {
        await say('Bulma', 'Hmm... Il ne se passe rien ? Bon. Mon petit ami idéal doit être en chemin !');
        await say('Goku', 'C\'est quoi, un petit ami ? Ça se mange ?');
      }
    } else if (w === 'krillin') {
      await say('Krilin', 'Je... je sens une énergie nouvelle ! Goku, la prochaine fois, je te bats à coup sûr !');
      await say('Goku', 'Hé hé ! On verra ça !');
    } else if (w === 'yamcha') {
      await say('Yamcha', 'Je n\'ai plus peur ! Bulma, tu es... tu es... très j-jolie ! ... J\'ai réussi ! Puar, j\'ai réussi !');
      await say('Bulma', 'Hi hi... Merci, Yamcha !');
    } else if (w === 'oolong') {
      SND.sfx('item');
      await say(null, 'Une culotte toute neuve tombe du ciel... et atterrit sur la tête d\'Oolong.');
      await say('Oolong', 'Hé hé ! Elle est toute douce !');
      await say('Bulma', 'Le vœu le plus important du monde... gaspillé pour une culotte. Mais au moins, Pilaf n\'a rien eu !');
    }
  }

  // ---------------- Chapitre 7 : la pleine lune ----------------
  const Moon = { active: false, a: 0, beat: 0, red: 0, open: 0 };
  let cageCanvas = null;
  function cageImg() { // la cage de Pilaf
    if (cageCanvas) return cageCanvas;
    const c = GFX.mk(84, 60), x = c.getContext('2d');
    for (let i = 0; i < 12; i++) { const bx = 2 + i * 7; x.fillStyle = K; x.fillRect(bx - 1, 4, 4, 54); x.fillStyle = '#a8b0c8'; x.fillRect(bx, 5, 2, 52); x.fillStyle = '#e8ecff'; x.fillRect(bx, 5, 1, 52); }
    x.fillStyle = K; x.fillRect(0, 0, 84, 7); x.fillRect(0, 53, 84, 7);
    x.fillStyle = '#787ea0'; x.fillRect(1, 1, 82, 5); x.fillRect(1, 54, 82, 5);
    x.fillStyle = '#c0c8e0'; x.fillRect(1, 1, 82, 1); x.fillRect(1, 54, 82, 1);
    return (cageCanvas = c);
  }
  function drawMoon() {
    const t = Game.frame;
    ctx.globalAlpha = Moon.a;
    const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#02030e'); g.addColorStop(1, '#1a1c48');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const [x, y, s] of stars) { if ((Math.floor(t / 20) + x) % 9 === 0) continue; ctx.fillStyle = s ? '#c0c8ff' : '#ffffff'; ctx.fillRect(x, y, 1, 1); }
    const r = 44 + Moon.beat * 4;
    ctx.fillStyle = 'rgba(255,250,210,0.12)'; ctx.beginPath(); ctx.arc(128, 76, r + 18, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,210,0.18)'; ctx.beginPath(); ctx.arc(128, 76, r + 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(128, 76, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8dcb0';
    for (const [dx, dy, cr] of [[-14, -10, 9], [12, 6, 12], [-6, 18, 6], [18, -16, 5], [-22, 8, 4]]) { ctx.beginPath(); ctx.arc(128 + dx, 76 + dy, cr, 0, 7); ctx.fill(); }
    // les nuages s'écartent
    for (const side of [-1, 1]) {
      const ox = 128 + side * (30 + Moon.open * 120);
      ctx.fillStyle = '#10122e';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(ox + side * i * 16, 60 + (i % 3) * 14, 26, 0, 7); ctx.fill(); }
    }
    // Goku, de dos, regarde la lune
    ctx.drawImage(GFX.char(charKey('goku')).up[0], 128 - 36, SH - 124, 72, 96);
    if (Moon.red > 0) { ctx.fillStyle = 'rgba(220,0,0,' + (Moon.red * (0.22 + Moon.beat * 0.3)) + ')'; ctx.fillRect(0, 0, SW, SH); }
    ctx.globalAlpha = 1;
  }
  async function fullMoon(pil, shu, mai) {
    const S = Shenron, F = Field, has = id => !!Game.member(id);
    if (Game.flags.wish === 'paix') await say('Pilaf', '*Bâille*... Vous êtes encore là, vous ? Shu, Mai... mettez-les dans la cage, que je fasse ma sieste tranquille...');
    else await say('Pilaf', 'Grrr... Mon vœu ! Vous m\'avez volé MON vœu ! Vous allez me le payer ! Shu ! Mai ! LA CAGE !');
    const cx = S.x + 44, cy = S.y + 24;
    const spots = [[cx - 16, cy - 4], [cx + 12, cy - 10], [cx + 6, cy + 10]];
    await Promise.all(F.actors.map((a, i) => F.walkTo(a, spots[i % 3][0], spots[i % 3][1], 1.8)));
    F.actors.forEach(a => { a.dir = 'left'; });
    SND.sfx('thunder');
    const cage = F.addEntity({ kind: 'img', img: cageImg(), x: cx, y: cy + 16 - 130, sortOff: 40, solid: false });
    await Tasks.tween(cage, { y: cy + 16 }, 18, 'in');
    SND.sfx('bighit'); Game.shake = 18;
    await say('Bulma', 'Kyaaa ! Une cage !');
    await say('Pilaf', 'Ha ha ha ! Demain matin, au lever du soleil, je vous ferai rôtir avec ma loupe géante ! Bonne nuit, misérables !');
    await Promise.all([pil, shu, mai].map(e => F.walkTo(e, e.x - 10, e.y + 150, 2.4)));
    pil.gone = shu.gone = mai.gone = true;
    // ----- Chapitre 7 -----
    await UI.chapter('Chapitre 7', 'La pleine lune');
    Game.flags.ch7 = true;
    SND.playMusic('sad');
    await Tasks.tween(S, { dark: 0.35 }, 30);
    await say(null, 'La nuit est tombée sur le château de Pilaf. Coincés dans la cage, nos héros attendent le matin...');
    await say('Bulma', 'Super... Enfermés dans une cage, et demain on finit grillés au soleil !');
    if (has('krillin')) await say('Krilin', 'Goku, tu ne peux pas tordre ces barreaux ?');
    await say('Goku', 'J\'ai essayé... Ils sont trop solides. Et j\'ai trop faim pour réfléchir.');
    if (has('oolong')) await say('Oolong', 'Et moi, je ne peux même pas me transformer : il y a trop peu de place là-dedans !');
    const goku = Game.member('goku');
    if (!styleOf(goku).tail) {
      goku.style = Object.assign(styleOf(goku), { tail: 1 }); F.syncParty();
      await say(null, 'La queue de Goku, jusque-là cachée sous sa ceinture, se met à frétiller...');
    }
    await say(null, 'Peu à peu, les nuages s\'écartent... et la lune apparaît.');
    // ----- la lune -----
    Object.assign(Moon, { active: true, a: 0, red: 0, beat: 0, open: 0 });
    SND.stopMusic(true);
    await Tasks.tween(Moon, { a: 1 }, 40);
    await Tasks.tween(Moon, { open: 1 }, 70);
    await say('Goku', 'Oh... La lune est toute ronde, ce soir. Elle est belle...');
    if (Game.flags.wish === 'gohan') await say('Goku', '...Grand-père m\'a dit de ne jamais regarder la pleine lune. Oups.');
    for (let i = 0; i < 4; i++) { // battements de cœur
      Moon.beat = 1; Moon.red = Math.min(1, Moon.red + 0.3); SND.beat('k', 1); Tasks.tween(Moon, { beat: 0 }, 14);
      await wait(14);
      Moon.beat = 0.7; SND.beat('k', 0.8); Tasks.tween(Moon, { beat: 0 }, 14);
      await wait(i < 3 ? 30 : 20);
    }
    await say('Bulma', 'Goku ? Goku, qu\'est-ce que tu as ?! Tes yeux... ils sont tout rouges !');
    // ----- transformation -----
    SND.sfx('roar'); Game.shake = 40;
    UI.fade.color = '#ffffff'; UI.fade.v = 1;
    Moon.active = false; S.dark = 0;
    cage.gone = true;
    const ga = F.actors.find(a => a.id === 'goku');
    if (ga) ga.hidden = true;
    const oz = F.addEntity({ kind: 'npc', id: 'oozaru', mon: 'oozaru', x: cx - 6, y: cy + 14, dir: 'left', solid: false });
    const tail = F.addEntity({ kind: 'npc', id: 'oozaru_tail', mon: 'queue', x: cx + 22, y: cy + 15, dir: 'left', solid: false });
    F.effects.push({ type: 'smoke', x: cx, y: cy - 10, t: 50 });
    await UI.fadeTo(0, 30); UI.fade.color = '#000';
    SND.sfx('roar'); Game.shake = 24;
    SND.playMusic('boss');
    await Promise.all(F.actors.filter(a => a.id !== 'goku').map((a, i) => F.walkTo(a, cx - 64 - (i % 2) * 18, cy - 20 + i * 18, 2.4)));
    F.actors.forEach(a => { a.dir = 'right'; });
    await say('Goku (singe géant)', 'GRAAAAAOOOOOH !');
    Game.shake = 30;
    await say('Bulma', 'Un... un singe géant ?! C\'est Goku ?!');
    if (has('yamcha')) await say('Yamcha', 'Les légendes disaient vrai... Un monstre qui apparaît les nuits de pleine lune ! C\'est sa queue ! Il faut lui couper la queue !');
    else await say('Krilin', 'C\'est la lune qui l\'a transformé ! Sa queue... Il faut viser sa queue !');
    // ----- combat : Goku ne peut pas se battre contre lui-même -----
    const party = Game.party, reserve = Game.reserve, all = party.concat(reserve);
    const fighters = ['krillin', 'yamcha', 'bulma', 'oolong'].map(id => Game.member(id)).filter(Boolean).slice(0, 3);
    Game.party = fighters; Game.reserve = all.filter(m => !fighters.includes(m));
    F.syncParty();
    let res;
    do {
      oz.visible = tail.visible = false;
      res = await Battle.start(['oozaru', 'queue'], {
        positions: [[oz.x, oz.y], [tail.x, tail.y]], music: 'boss', canFlee: false, spar: true,
        intro: Game.flags.ozIntro ? null : async () => { Game.flags.ozIntro = true; await UI.say('Bulma', 'Frapper Goku ne sert à rien, il est bien trop solide ! Visez la QUEUE !'); },
      });
      oz.visible = tail.visible = true;
      if (res === 'lose') await say('Bulma', 'Ouille... Il faut viser la queue, et rien d\'autre ! Allez, on recommence !');
    } while (res !== 'win');
    Game.party = party; Game.reserve = reserve;
    Game.flags.oozaru = true;
    // ----- qui coupe la queue ? -----
    const opts = [];
    if (has('yamcha')) opts.push(['yamcha', 'Yamcha : un coup de sabre !']);
    if (has('oolong')) opts.push(['oolong', 'Oolong : se changer en ciseaux !']);
    opts.push(['krillin', 'Krilin : un Kienzan bien précis !']);
    opts.push(['bulma', 'Bulma : tirer de toutes ses forces !']);
    const c = await UI.ask('Bulma', 'Il est sonné ! Vite, qui lui coupe la queue ?', opts.map(o => o[1]));
    const who = opts[c][0];
    Game.flags.tailCut = who;
    if (who === 'yamcha') { await say('Yamcha', 'Désolé, Goku... HAAAA !'); SND.sfx('swing'); }
    else if (who === 'oolong') { F.effects.push({ type: 'smoke', x: tail.x, y: tail.y - 14, t: 30 }); SND.sfx('door'); await say('Oolong', 'Transformation... en ciseaux géants ! Clic-clac !'); }
    else if (who === 'krillin') { SND.sfx('disc'); await say('Krilin', 'Kienzan ! ... Pardon, Goku !'); }
    else await say('Bulma', 'Hiiii... Mais lâche-moi ça, sale queue de singe ! ... Oh ! Elle s\'est détachée !');
    Game.addAff(who, 1, true);
    SND.sfx('bighit'); Game.shake = 20;
    tail.gone = true;
    F.effects.push({ type: 'smoke', x: oz.x, y: oz.y - 20, t: 60 });
    await wait(20);
    oz.gone = true;
    goku.style = Object.assign(styleOf(goku), { tail: 0 });
    F.syncParty();
    const g2 = F.actors.find(a => a.id === 'goku');
    if (g2) { g2.hidden = false; g2.x = oz.x; g2.y = oz.y; g2.dir = 'left'; }
    await wait(40);
    SND.playMusic('camp');
    await say('Goku', 'Ouaaah... J\'ai super bien dormi ! ... Hein ? Pourquoi le château est tout cassé ?');
    await say('Goku', 'Et... MA QUEUE ! Elle a disparu !');
    await say('Bulma', 'Euh... Elle est tombée toute seule ! Ça arrive, à ton âge !');
    await say('Goku', 'Ah bon ? Bah, tant pis. Ça me fera moins de poils à laver !');
    await say(null, '(Bulma repense à la légende du monstre qui, une nuit de pleine lune, ravagea le Mont Paozou... Mieux vaut que Goku ne sache jamais.)');
    await UI.fadeTo(1, 40, '#f8c890');
    await say(null, 'Le soleil se lève sur les ruines du château de Pilaf.');
    await UI.fadeTo(0, 40); UI.fade.color = '#000';
    await say('Pilaf', 'MON CHÂTEAU ! MON BEAU CHÂTEAU ! ... Vous me le paierez, bande de vauriens !');
  }

  function endingRank() {
    const k = Game.karma;
    if (k >= 7) return { title: 'Fin A : Le Cœur Pur', text: 'Goku remonte sur Kinto\'un. Seul un cœur pur peut voler sur le nuage magique... et il n\'a jamais été aussi rapide.' };
    if (k >= 4) return { title: 'Fin B : Le Petit Héros', text: 'Goku remonte sur Kinto\'un. Il a fait quelques bêtises, mais tout le monde, sur son chemin, se souviendra de lui.' };
    return { title: 'Fin C : Le Garnement', text: 'Goku remonte sur Kinto\'un. Le nuage hésite un instant... puis l\'emporte quand même. Il a encore beaucoup à apprendre.' };
  }
  // Épilogue : chaque personnage connaît un destin différent selon les choix du joueur.
  function buildEpilogue(w, end) {
    const F = Game.flags, A = Game.aff, has = id => !!Game.member(id), q = id => Game.quest(id);
    const out = [];
    const wishText = {
      gohan: [['goku', 'gohan'], 'Goku a revu son grand-père, le temps d\'un souffle de vent. Il garde la boule à quatre étoiles tout contre son cœur.'],
      chateau: [['chichi'], 'Le château de Gyumao renaît de ses cendres, plus beau qu\'avant. Gyumao pardonne tout et organise un festin de sept jours.'],
      food: [['goku'], 'Goku se régale pendant trois jours entiers. Il garde même un gâteau pour Grand-père Gohan, sur l\'autel de la maison.'],
      paix: [['pilaf'], 'Pendant toute une année, le monde vit en paix. Même l\'empereur Pilaf passe ses journées à faire la sieste.'],
      bulma: has('yamcha') ? [['bulma', 'yamcha'], 'Le vœu de Bulma a fonctionné... à sa manière. Yamcha l\'invite à boire un thé chaque dimanche, rouge comme une tomate.'] : [['bulma'], 'Bulma attend toujours son petit ami idéal. Dans le désert, un certain bandit éternue sans savoir pourquoi...'],
      krillin: [['krillin'], 'De retour au temple d\'Orin, Krilin n\'a plus peur de personne. Les moines qui se moquaient de lui l\'appellent désormais « Maître Krilin ».'],
      yamcha: [['yamcha'], 'Yamcha n\'a plus peur des filles ! ... Sauf de Bulma, quand elle se met en colère.'],
      oolong: [['oolong'], 'Oolong porte fièrement sa culotte neuve. On raconte que le monde a été sauvé... grâce à une culotte.'],
    }[w];
    out.push({ title: 'Le vœu', chars: wishText[0], text: wishText[1] });
    const b = A.bulma || 0;
    out.push({ title: 'Bulma', chars: ['bulma'], text: b >= 4 ? 'Bulma rentre à la Capitale de l\'Ouest. « Reviens me voir quand tu veux, Goku. Tu es mon meilleur ami, petit singe ! »'
      : b >= 1 ? 'Bulma rentre à la Capitale de l\'Ouest, son radar sous le bras. Elle a déjà hâte de repartir à l\'aventure.'
        : 'Bulma rentre chez elle en ronchonnant : « Plus jamais je ne voyage avec un garçon aussi malpoli ! » ... Mais elle reviendra.' });
    if (has('krillin')) out.push({ title: 'Krilin', chars: ['krillin', 'roshi'], text: (A.krillin || 0) >= 3 ? 'Krilin et Goku sont devenus les meilleurs amis du monde. Ils s\'entraînent chez Tortue Géniale pour le grand tournoi des arts martiaux.' : 'Krilin repart s\'entraîner chez Tortue Géniale. « La prochaine fois, Goku, c\'est moi qui gagne ! »' });
    if (F.yamchaJoined) out.push({ title: 'Yamcha et Puar', chars: ['yamcha'], mon: 'puar', text: 'Yamcha et Puar s\'installent à la Capitale de l\'Ouest, pour être près de Bulma... et apprendre enfin à lui parler.' });
    else if (F.met_yamcha) out.push({ title: 'Yamcha et Puar', chars: ['yamcha'], mon: 'puar', text: 'Yamcha et Puar errent dans le désert. Le loup solitaire pense souvent à une certaine fille aux cheveux bleus.' });
    if (F.oolongJoined) out.push({ title: 'Oolong', chars: ['oolong'], text: 'Oolong suit Bulma à la Capitale de l\'Ouest. Il a promis d\'être sage... et il tient parole. Enfin, presque.' });
    else if (F.oolongJailed) out.push({ title: 'Oolong', chars: ['oolong'], text: 'Oolong est resté au château de Pilaf, où il cuisine des gâteaux pour Shu et Mai. Il dit qu\'il ne s\'est jamais aussi bien porté.' });
    if (F.fireOut || w === 'chateau') out.push({ title: 'Chichi et Gyumao', chars: ['chichi'], mon: 'gyumao', text: F.chichiPromise ? 'Chichi n\'a pas oublié la promesse de Goku. Chaque soir, elle s\'entraîne en répétant : « Promis-promis ! » Un jour, elle viendra le chercher...' : 'Le château de Gyumao est sauvé. Chaque année, le roi organise un grand festin en l\'honneur des jeunes héros.' });
    else if (F.castleDestroyed) out.push({ title: 'Chichi et Gyumao', chars: ['chichi'], mon: 'gyumao', text: 'Gyumao et Chichi vivent sous une tente au pied du Mont Frypan. Chichi jure de ne jamais pardonner à Goku... enfin, peut-être un jour.' });
    const others = [];
    if (F.bearSpared) others.push('L\'Ours Brigand a ouvert un petit restaurant dans la forêt. Son poisson grillé est réputé.');
    else if (F.bearChased) others.push('L\'Ours Brigand rôde encore dans les montagnes, rancunier.');
    if (q('grandmere') === 'done') others.push('La grand-mère du village d\'Aru danse à nouveau à chaque fête.');
    if (q('marchand') === 'done') others.push('Le marchand raconte vos exploits sur toutes les routes.');
    if (q('boussole') === 'done') others.push('Le nomade du désert ne s\'est plus jamais perdu.');
    if (others.length) out.push({ title: 'Et les autres...', mon: F.bearSpared || F.bearChased ? 'ours' : null, text: others.slice(0, 3).join(' ') });
    out.push({ title: 'L\'empereur Pilaf', chars: ['shu', 'pilaf', 'mai'], text: F.oozaru ? 'Dans les ruines de son château, piétiné par un singe géant, l\'empereur Pilaf prépare déjà sa revanche. « Dans un an, les Boules seront à moi ! »' : 'Dans son château, l\'empereur Pilaf prépare déjà sa revanche. « Dans un an, les Boules de Cristal seront à moi ! »' });
    const nq = ['tortue', 'grandmere', 'marchand', 'boussole', 'gyumao'].filter(id => q(id) === 'done').length;
    out.push({ title: end.title, chars: ['goku'], cloud: true, text: end.text, foot: 'Quêtes accomplies : ' + nq + '/5   —   Karma : ' + Game.karma });
    return out;
  }
  let epi = null;
  function epilogue(slides, o = {}) {
    return new Promise(res => { epi = { slides, i: 0, t: 0, res, prefix: o.prefix }; Game.mode = 'epilogue'; SND.playMusic(o.music || (Game.flags.wish === 'gohan' ? 'sad' : 'camp')); UI.fade.v = 0; });
  }
  function updateEpilogue() {
    epi.t++;
    if (epi.t > 40 && (Input.pressed('a') || Input.pressed('b'))) {
      SND.sfx('cursor');
      epi.i++; epi.t = 0;
      if (epi.i >= epi.slides.length) { const r = epi.res; epi.done = true; r(); }
    }
  }
  function drawEpilogue() {
    const t = Game.frame;
    drawSky(t, '#000010', '#141048', '#3a2060');
    if (epi.done) return;
    const s = epi.slides[epi.i];
    ctx.globalAlpha = Math.min(1, epi.t / 24);
    FONT.drawCentered(ctx, epi.i === epi.slides.length - 1 ? s.title : (epi.prefix || 'Épilogue — ') + s.title, 128, 18, UI.YEL);
    ctx.fillStyle = '#c0a040'; ctx.fillRect(48, 32, 160, 1);
    const figs = [];
    for (const c of s.chars || []) figs.push({ img: GFX.char(charKey(c)).down[0], w: 48, h: 64 });
    if (s.mon) { const m = GFX.monster(s.mon); const k = m.h > 30 ? 1.5 : 2; figs.push({ img: m.img, w: m.w * k, h: m.h * k }); }
    const gap = 8, total = figs.reduce((a, f) => a + f.w, 0) + gap * Math.max(0, figs.length - 1);
    let x = 128 - total / 2;
    const bob = Math.round(Math.sin(t * 0.06) * 2);
    for (const f of figs) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + f.w / 2, 116, f.w * 0.3, 4, 0, 0, 7); ctx.fill();
      ctx.drawImage(f.img, Math.round(x), Math.round(116 - f.h + (s.cloud ? bob - 10 : 0)), f.w, f.h);
      x += f.w + gap;
    }
    if (s.cloud) ctx.drawImage(kintoun(), 128 - 34, 100 + bob, 68, 36);
    FONT.wrap(s.text, 224).forEach((l, k) => FONT.drawCentered(ctx, l, 128, 134 + k * 13, '#e8e8f8'));
    if (s.foot) FONT.drawCentered(ctx, s.foot, 128, 196, '#a0a8d8');
    ctx.globalAlpha = 1;
    if (epi.t > 40 && Math.floor(t / 15) % 2) FONT.draw(ctx, '▼', 238, 208, '#fff');
  }

  // ---------------- Crédits ----------------
  function startCredits(end) {
    Game.mode = 'ending';
    SND.playMusic('title');
    credits = {
      y: SH + 10, lines: [
        ['DRAGON BALL', 'big'], ['La Quête des 7 Boules', 'sub'], '', '',
        ['~ ' + end.title + ' ~', 'yel'], '', '',
        'Un petit RPG de fan non officiel,', 'hommage à Dragon Ball et Chrono Trigger.', '', '',
        ['Personnages', 'yel'], 'Son Goku', 'Bulma', 'Krilin', 'Tortue Géniale', 'Yamcha et Puar', 'Oolong', 'Chichi et le roi Gyumao', 'Grand-père Gohan', 'L\'empereur Pilaf, Shu et Mai', 'Shenron', '', '',
        ['Programmation, graphismes, musique', 'yel'], 'Pixel art, code et chiptune', 'créés avec Claude', '', '',
        ['Dragon Ball', 'yel'], '© Akira Toriyama / Bird Studio', 'Shueisha, Toei Animation', 'Œuvre de fan sans but commercial.', '', '',
        ['Merci d\'avoir joué !', 'yel'], 'As-tu découvert toutes les fins ?', '', '', Game.flags.ch8 ? 'Appuie sur Z pour revenir au titre' : 'Appuie sur Z pour continuer...',
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
    ctx.drawImage(GFX.char(charKey('goku')).right[0], Math.round(cx + 5), 190 - 22 + Math.round(Math.sin(t * 0.08) * 3));
    ctx.drawImage(kintoun(), Math.round(cx), 190 + Math.round(Math.sin(t * 0.08) * 3));
  }
  function updateCredits() {
    if (credits.end === undefined || credits.end > SH / 2 + 20) credits.y -= Input.down('a') ? 2 : 0.4;
    else if (Input.pressed('a')) {
      credits = null;
      if (!Game.flags.ch8) { Tournoi.begin(); return; } // chapitre 8 : « Un an plus tard »
      Game.mode = 'title'; titleSel = 0; SND.playMusic('title');
    }
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
      case 'minigame': MiniGames.update(); break;
      case 'worldmap': WorldMap.update(); break;
      case 'epilogue': updateEpilogue(); break;
      case 'ending': updateCredits(); break;
    }
  }
  function render() {
    switch (Game.mode) {
      case 'title': drawTitle(); break;
      case 'field':
        Field.draw();
        if (Shenron.active) drawShenron(Field.cx, Field.cy);
        Tournoi.draw();
        if (Moon.active) drawMoon();
        if (Field.battle) Battle.drawUI();
        break;
      case 'gameover': drawGameOver(); break;
      case 'minigame': MiniGames.draw(); break;
      case 'worldmap': WorldMap.draw(); break;
      case 'epilogue': drawEpilogue(); break;
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
  return { boot, gameOver, shenronFinale, Shenron, Moon, newGame, continueGame, epilogue };
})();
const Shenron = Main.Shenron;
Main.boot();
