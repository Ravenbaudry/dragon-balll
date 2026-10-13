// Arc du Ruban Rouge, 2e partie : chapitre 11 (la grotte des pirates et le général Bleu)
// et chapitre 12 (la Terre sacrée, la Tour de Karine et Tao Paï Paï).
const Ruban2 = (() => {
  const TS = 16;
  const say = (w, t) => UI.say(w, t);
  const ask = (w, t, c, o) => UI.ask(w, t, c, o);
  const L = () => Field.leader();
  const has = id => !!Game.member(id);
  const R = Ruban;

  // ---------------- Monstres et ennemis ----------------
  Object.assign(MONSTERS, {
    tigre_sacre: { pal: { o: '#f0f0f4', O: '#a8a8b8', G: '#202028', w: '#fff4e4', W: '#d8c8b0', y: '#ffffff', r: '#3060d0', t: '#ffffff' }, rows: MONSTERS.tigre.rows },
    aigle: { pal: { g: '#8a6a4a', G: '#5a4028', y: '#f0e0b0', Y: '#c0a878', r: '#ffd030' }, rows: MONSTERS.ptero.rows },
  });
  Object.assign(ENEMIES, {
    crabe_abysses: { res: { phys: 0.8, ki: 1.1 }, name: 'Crabe des Abysses', spr: 'crabe_abysses', hp: 480, atk: 70, def: 42, spd: 12, xp: 150, zeni: 45, drops: [['poisson', 0.4]], skills: [{ name: 'Pince Broyeuse', target: 'one', pow: 1.5, chance: 0.25 }] },
    murene: { name: 'Murène Électrique', spr: 'murene', hp: 420, atk: 72, def: 28, spd: 24, xp: 150, zeni: 40, skills: [{ name: 'Décharge', target: 'one', pow: 1.2, chance: 0.25, st: 'stun', sc: 0.35 }] },
    robot_pirate: { res: { phys: 0.75, ki: 1.2 }, immune: ['poison', 'sleep'], name: 'Robot Pirate', char: 'robot_pirate', hp: 3200, atk: 74, def: 40, spd: 13, xp: 1300, zeni: 600, boss: true,
      skills: [{ name: 'Sabre d\'Abordage', target: 'one', pow: 1.9, chance: 0.28 }, { name: 'Canon de Bord', target: 'all', pow: 1.0, chance: 0.2, st: 'burn', sc: 0.3 }] },
    bleu: { immune: ['stun'], name: 'Général Bleu', char: 'bleu', hp: 3800, atk: 76, def: 34, spd: 24, xp: 1800, zeni: 900, boss: true,
      skills: [{ name: 'Regard Paralysant', target: 'all', pow: 0.4, chance: 0.22, st: 'stun', sc: 0.6 }, { name: 'Prise de Judo', target: 'one', pow: 1.8, chance: 0.25 }, { name: 'Tir de Pistolet', target: 'one', pow: 1.2, chance: 0.15 }] },
    tigre_sacre: { name: 'Tigre Blanc', spr: 'tigre_sacre', hp: 560, atk: 80, def: 32, spd: 22, xp: 190, zeni: 50, drops: [['viande', 0.4]], skills: [{ name: 'Griffes', target: 'one', pow: 0.6, hits: 3, chance: 0.25 }] },
    aigle: { name: 'Aigle Géant', spr: 'aigle', hp: 450, atk: 78, def: 26, spd: 28, xp: 180, zeni: 45, fly: true, skills: [{ name: 'Piqué', target: 'one', pow: 1.6, chance: 0.25 }] },
    // Tao Paï Paï : imbattable la première fois...
    tao1: { immune: ['stun', 'sleep', 'poison'], name: 'Tao Paï Paï', char: 'tao', hp: 9999, atk: 130, def: 90, spd: 40, xp: 0, zeni: 0, boss: true, unkillable: true,
      skills: [{ name: 'Dodon Ray', target: 'one', pow: 2.4, chance: 0.3, beam: true, c1: '#f0c040', c2: '#fff8c0' }, { name: 'Frappe Éclair', target: 'one', pow: 1.6, chance: 0.3 }] },
    // ... mais Goku revient de la Tour de Karine
    tao2: { immune: ['sleep'], name: 'Tao Paï Paï', char: 'tao', hp: 4600, atk: 82, def: 36, spd: 28, xp: 2400, zeni: 1000, boss: true,
      skills: [{ name: 'Dodon Ray', target: 'one', pow: 2.2, chance: 0.22, beam: true, c1: '#f0c040', c2: '#fff8c0' }, { name: 'Super Dodon Ray', target: 'all', pow: 1.4, chance: 0.12, beam: true, c1: '#f0a020', c2: '#fff0a0' }, { name: 'Frappe Éclair', target: 'one', pow: 0.6, hits: 3, chance: 0.22 }] },
  });
  Object.assign(GEAR, {
    sabre_pirate: { slot: 'arme', name: 'Sabre du Pirate', desc: 'Le sabre rouillé d\'un capitaine oublié. Force +11, Vitesse +1.', stats: { atk: 11, spd: 1 }, price: 0 },
  });

  // ---------------- Décors ----------------
  R.BUILD.sousmarin = () => {
    const c = GFX.mk(72, 30), x = c.getContext('2d');
    x.fillStyle = K; x.beginPath(); x.ellipse(36, 20, 34, 9, 0, 0, 7); x.fill(); x.fillRect(28, 4, 16, 12);
    x.fillStyle = '#c83030'; x.beginPath(); x.ellipse(36, 20, 33, 8, 0, 0, 7); x.fill(); x.fillRect(29, 5, 14, 11);
    x.fillStyle = '#e86060'; x.fillRect(8, 15, 56, 2); x.fillRect(30, 6, 12, 2);
    for (const px of [16, 28, 40, 52]) { x.fillStyle = K; x.fillRect(px, 18, 5, 5); x.fillStyle = '#90d0ff'; x.fillRect(px + 1, 19, 3, 3); }
    x.fillStyle = K; x.fillRect(35, 0, 2, 6); x.fillStyle = '#ffffff'; x.fillRect(32, 9, 8, 4); x.fillStyle = '#e02828'; x.fillRect(34, 10, 4, 2);
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(0, 27, 72, 1);
    return c;
  };
  R.BUILD.karine_tour = () => { // le pied de la Tour de Karine : une colonne blanche qui monte au ciel
    const w = 48, h = 220, c = GFX.mk(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = K; x.fillRect(10, 0, 28, h);
    x.fillStyle = '#e8e8f0'; x.fillRect(11, 0, 26, h);
    x.fillStyle = '#c0c0d0'; x.fillRect(30, 0, 7, h);
    for (let y = 8; y < h; y += 14) { x.fillStyle = '#a8a8b8'; x.fillRect(11, y, 26, 1); x.fillStyle = '#d83030'; x.fillRect(15 + (y % 28 ? 0 : 10), y + 4, 6, 4); }
    x.fillStyle = '#ffffff'; x.fillRect(13, 0, 2, h);
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = g; x.fillRect(0, 0, w, 60); x.globalCompositeOperation = 'source-over'; // le sommet se perd dans le ciel
    x.fillStyle = K; x.fillRect(4, h - 14, 40, 14); x.fillStyle = '#b8b0a0'; x.fillRect(5, h - 13, 38, 12); x.fillStyle = '#d8d0c0'; x.fillRect(5, h - 13, 38, 2);
    return c;
  };

  // =====================================================================
  // CHAPITRE 11 : la grotte des pirates
  // =====================================================================
  MAPS.pirates = {
    name: 'Côte des Pirates', music: 'field', ground: '.',
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CC.......CCCCdCCCC......CC',
      'C...T...ppppppppppp..T...C',
      'C.......p.........p......C',
      'C..,....p....,....p...,..C',
      'C.....ppp.........ppp....C',
      'C.....p......r......p..T.C',
      'C.T...p.............p....C',
      'Cs....p.............p...sC',
      'sssssspssssssssssssspsssss',
      'ssssssssssssssssssssssssss',
      'sss~~~~~~~~~~~~~~~~~~~ssss',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    patch() { R.building('sousmarin'); },
    objects: [
      { type: 'building', img: 'cave', x: 13 * TS + 8 - 28, y: 2 * TS + 16 - 40, sortY: 2 * TS + 2 },
      { type: 'building', img: 'sousmarin', x: 9 * TS, y: 12 * TS + 6, sortY: 12 * TS, cond: () => !Game.flags.bleuDone },
    ],
    entities: () => [
      warp(13, 2, 1, 1, 'pirates1', 13.5, 15, 'up'),
      savePt(4, 8),
      npc('garde_g1', 'soldat_rr', 12, 3, null, { cond: () => !Game.flags.grotteGarde, dir: 'down' }),
      npc('garde_g2', 'soldat_rr', 14, 3, null, { cond: () => !Game.flags.grotteGarde, dir: 'down' }),
      { kind: 'trigger', tx: 10, ty: 4, tw: 7, th: 1, cond: () => !Game.flags.grotteGarde, run: gardesGrotte },
      foe(4, 11, ['crabe_abysses']),
      foe(19, 11, ['crabe_abysses', 'murene']),
      foe(21, 5, ['soldat_rr', 'soldat_rr']),
      chest('pirates0', 24, 9, 'super_tonique', 2),
    ].concat(window.Prog ? [window.Prog.fishSpot('pirates', 2, 11)] : []),
    async onEnter() {
      if (Game.flags.piratesIntro) return;
      Game.flags.piratesIntro = true;
      Game.flags.ch11 = true;
      await Field.run(async () => {
        await chapterCard('ch11card', 'Chapitre 11', 'La grotte des pirates');
        await say('Goku', 'Le radar indique la boule juste sous nos pieds... au fond de cette grotte !');
        await say(null, 'Un sous-marin rouge, frappé du ruban de l\'armée, flotte près de la plage.');
        if (has('bulma')) await say('Bulma', 'Le Ruban Rouge est déjà là ! On raconte que cette grotte était le repaire d\'un pirate... avec un trésor fabuleux !');
        if (has('krillin')) await say('Krilin', 'Un trésor ? Et des pièges, aussi, j\'imagine... Hé, pourquoi c\'est toujours moi qui passe devant ?');
        Game.setQuest('ruban', 'grotte');
      });
    },
  };
  async function gardesGrotte() {
    await say('Soldat du Ruban Rouge', 'Halte ! Le général Bleu a interdit l\'entrée de la grotte ! Demi-tour, morveux !');
    await say('Goku', 'Désolé, mais j\'ai besoin de passer !');
    await Battle.start(['soldat_rr', 'soldat_rr', 'soldat_rr'], { positions: [[Field.ent('garde_g1').x, Field.ent('garde_g1').y], [Field.ent('garde_g2').x, Field.ent('garde_g2').y]], music: 'boss' });
    Game.flags.grotteGarde = true;
    for (const id of ['garde_g1', 'garde_g2']) { const e = Field.ent(id); if (e) e.gone = true; }
    await say(null, 'Les gardes s\'enfuient en courant vers leur sous-marin !');
  }
  const caveTint = { a: '#5a6878', b: '#3e4a5a', c: '#283240', d: '#7a8898', top: '#4a6a78', top2: '#38545e' };
  MAPS.pirates1 = {
    name: 'Grotte des Pirates', music: 'volcano', ground: 'c', dark: true, cliffTint: caveTint,
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CCccccCCCCCCCCCCCCCCCCCcccCC',
      'CCccccCCCCCCCCCCCCCCCCCcccCC',
      'CCccccccccccccccccccccccccCC',
      'CCccccCCCCCCcccCCCCCCCCcccCC',
      'CCCCCCCCCCCCcccCCCCCCCCCCCCC',
      'C~~~~~~~~~~~bbb~~~~~~~~~~~~C',
      'C~~~~~~~~~~~bbb~~~~~~~~~~~~C',
      'CCCCcccCCCCCcccCCCCCcccCCCCC',
      'CCCCcccccccccccccccccccCCCCC',
      'CCCCcccCCCCCcccCCCCCcccCCCCC',
      'CCCCcccCCCCCcccCCCCCcccCCCCC',
      'CCccccccCCCCcccCCCCccccccCCC',
      'CCccccccCCCCcccCCCCccccccCCC',
      'CCCCCCCCCCCCcccCCCCCCCCCCCCC',
      'CCCCCCCCCCCCcccCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCccCCCCCCCCCCCCC',
    ],
    update: () => R.updateTraps(),
    entities: () => [
      warp(13, 17, 2, 1, 'pirates', 13.5, 3.5, 'down'),
      warp(24, 2, 1, 1, 'pirates2', 11, 17, 'up'),
      R.spikes('pic1', 13, 10, 100, 0), R.spikes('pic2', 10, 10, 100, 50), R.spikes('pic3', 16, 10, 100, 25),
      R.spikes('pic4', 13, 7, 90, 40), R.spikes('pic5', 13, 5, 90, 0), R.spikes('pic6', 18, 4, 110, 30), R.spikes('pic7', 8, 4, 110, 70),
      chest('pirates1a', 3, 3, 'boisson_ki', 2),
      chest('pirates1b', 23, 14, 'capsule_vie'),
      chest('pirates1c', 3, 14, 'super_tonique', 2),
      foe(6, 10, ['crabe_abysses', 'crabe_abysses']),
      foe(21, 11, ['murene', 'murene']),
      foe(24, 4, ['crabe_abysses', 'murene']),
      Explore.treasure('pirates_t', 5, 13, 'zeni', 900),
    ],
    async onEnter() {
      if (Game.flags.pirates1Intro) return;
      Game.flags.pirates1Intro = true;
      await Field.run(async () => {
        if (has('krillin')) await say('Krilin', 'Attention, il y a des piques qui sortent du sol ! Il faut passer quand ils sont rentrés...');
        else await say('Goku', 'Ouh là ! Des piques sortent du sol. Il faut bien regarder avant de passer !');
      });
    },
  };
  MAPS.pirates2 = {
    name: 'Grotte sous-marine', music: 'volcano', ground: 'c', cliffTint: caveTint, tint: 'rgba(30,80,200,0.16)',
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CCCCCCCCCcccccCCCCCCCCCC',
      'CCCCCCCCcccccccCCCCCCCCC',
      'CCCCCCCCcccccccCCCCCCCCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CC~~~~~ccccccccc~~~~~~CC',
      'CC~~~~~ccccccccc~~~~~~CC',
      'CCccccccccccccccccccccCC',
      'CCccccCCCCcccCCCCccccCCC',
      'CCccccCCCCcccCCCCccccCCC',
      'CCccccccccccccccccccccCC',
      'CC~~~cccc~~~~~cccc~~~~CC',
      'CC~~~cccc~~~~~cccc~~~~CC',
      'CCccccccccccccccccccccCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CCCCCCCCCCcccCCCCCCCCCCC',
      'CCCCCCCCCCCcCCCCCCCCCCCC',
    ],
    update: () => R.updateTraps(),
    hud: () => { // des bulles remontent dans l'eau
      for (let i = 0; i < 10; i++) { const x = (GFX.hash(i, 3) % SW), y = SH - ((Game.frame * (0.4 + (i % 3) * 0.2) + GFX.hash(i, 4) % SH) % SH); ctx.fillStyle = 'rgba(200,230,255,0.45)'; ctx.fillRect(Math.round(x + Math.sin(y * 0.05) * 3), Math.round(y), 2, 2); }
    },
    entities: () => [
      warp(11, 19, 1, 1, 'pirates1', 24, 3, 'down'),
      { kind: 'npc', id: 'porte_robot', x: 11.5 * TS, y: 5 * TS + 14, turn: false, box: [-24, -14, 48, 16], cond: () => !Game.flags.robotPirate, get img() { return grille(); },
        talk: () => say(null, 'Une grille rouillée, verrouillée par un mécanisme. Le robot doit en avoir la commande...') },
      npc('robot_pirate', 'robot_pirate', 11.5, 7.2, robotEvent, { cond: () => !Game.flags.robotPirate }),
      { kind: 'chest', id: 'tresor_pirate', tx: 11.5, ty: 3, talk: tresorEvent },
      chest('pirates2a', 3, 12, 'super_tonique', 3),
      chest('pirates2b', 20, 9, 'boisson_ki', 3),
      R.spikes('pic8', 6, 12, 90, 0), R.spikes('pic9', 16, 12, 90, 45), R.spikes('pic10', 11, 15, 80, 20), R.spikes('pic11', 12, 9, 80, 60),
      foe(4, 15, ['murene', 'crabe_abysses']),
      foe(19, 15, ['crabe_abysses', 'crabe_abysses']),
    ],
  };
  let grilleC = null;
  function grille() {
    if (grilleC) return grilleC;
    const c = GFX.mk(48, 26), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(0, 0, 48, 26); x.fillStyle = '#6a5040'; x.fillRect(1, 1, 46, 24);
    for (let i = 3; i < 46; i += 5) { x.fillStyle = '#3a2a20'; x.fillRect(i, 2, 2, 22); x.fillStyle = '#8a6a50'; x.fillRect(i, 2, 1, 22); }
    x.fillStyle = '#c8a040'; x.fillRect(21, 10, 6, 6); x.fillStyle = '#6a5020'; x.fillRect(23, 12, 2, 2);
    return (grilleC = c);
  }
  async function robotEvent(e) {
    await Field.run(async () => {
      await say('Robot Pirate', 'BIIIP. TRÉSOR DU CAPITAINE. ACCÈS INTERDIT. LES INTRUS SERONT... DÉCOUPÉS.');
      if (has('krillin')) await say('Krilin', 'Il a un sabre aussi grand que moi ! Goku, c\'est toi qui passes devant, cette fois !');
      e.visible = false;
      await Battle.start(['robot_pirate'], { positions: [[e.x, e.y]], music: 'boss' });
      e.gone = true;
      Game.flags.robotPirate = true;
      SND.sfx('blast'); Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 10, t: 40 });
      await say(null, 'Le robot pirate explose dans une gerbe d\'étincelles. La grille du trésor grince et s\'ouvre !');
      const g = Field.ent('porte_robot'); if (g) g.gone = true;
      SND.sfx('door');
      await getItem('sabre_pirate');
    });
  }
  async function tresorEvent(e) {
    await Field.run(async () => {
      if (e.opened) { await say(null, 'Le coffre du capitaine est vide.'); return; }
      e.opened = true; Game.flags.chest_tresor_pirate = true;
      SND.sfx('door');
      Game.zeni += 3000; SND.sfx('coin');
      await say(null, 'Le trésor du pirate ! Des pièces d\'or par milliers : 3000 Zénis !');
      await R.rball(7);
      await say('Général Bleu', 'Merci beaucoup, les enfants. Vous m\'avez épargné bien des efforts...');
      const b = Field.addEntity({ kind: 'npc', id: 'bleu', sprite: 'bleu', x: 11.5 * TS, y: 7 * TS + 14, dir: 'up' });
      await Field.walkTo(b, 11.5 * TS, 5 * TS + 14, 1.4);
      await say('Général Bleu', 'Je suis le général Bleu, de l\'armée du Ruban Rouge. Donnez-moi cette boule bien gentiment, et je vous laisserai peut-être repartir.');
      await say('Goku', 'Pas question ! C\'est moi qui l\'ai trouvée !');
      let scared = false;
      const mouse = Game.member('oolong') || Game.member('puar');
      if (mouse) {
        const r = await ask(mouse.name, 'Psst, Goku... J\'ai entendu dire que le général Bleu a horreur des souris !', ['Se transformer en souris !', 'Combattre normalement'], { cancel: 1 });
        if (r === 0) {
          SND.sfx('door'); Field.effects.push({ type: 'smoke', x: b.x - 16, y: b.y - 4, t: 30 });
          await say(mouse.name, 'Couiiic ! Couic couic !');
          await say('Général Bleu', 'UNE SOURIS ?! AAAAH ! Enlevez-la ! ENLEVEZ-LA DE LÀ !');
          scared = true;
        }
      }
      b.visible = false;
      await Battle.start(['bleu'], { positions: [[b.x, b.y]], music: 'boss', canFlee: false, hp: scared ? { enemy: 0.7 } : undefined });
      b.visible = true;
      await say('Général Bleu', 'Impossible... Battu par des gamins ! Mais vous ne sortirez pas d\'ici vivants !');
      SND.sfx('cursor');
      await say(null, 'Bleu appuie sur une télécommande et s\'enfuit. Un grondement sourd fait trembler la grotte...');
      b.gone = true;
      Game.flags.bleuDone = true;
      Game.shake = 20; SND.sfx('thunder');
      await say(null, 'L\'eau de la mer s\'engouffre dans la grotte ! Il faut fuir, vite !');
      if (has('bulma')) await say('Bulma', 'Par là ! Il y a un vieux tunnel des pirates. Le sous-marin de Bleu est peut-être resté au bout !');
      await R.fadeLoad('fuite', 2.5, 3, 'right');
      Fuite.start();
    });
  }

  // --- La fuite : l'eau monte dans le tunnel ---
  const Fuite = { x: 0, on: false, start() { this.x = -60; this.on = true; } };
  MAPS.fuite = {
    name: 'Tunnel des pirates', music: 'boss', ground: 'c', cliffTint: caveTint,
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      'CCccccccccccccccccccccccccccccccccCC',
      'CCccccCCCccccccCCCCccccccCCcccccccCC',
      'CCccccccccccccccccccccccccccccccccCC',
      'CCccccCCCCcccccccCCCcccccCCcccccccCC',
      'CCccccccccccccccccccccccccccccccccCC',
      'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    ],
    update() {
      R.updateTraps();
      if (!Fuite.on) return;
      Fuite.x += 0.95;
      const l = L();
      if (l.x >= 32 * TS) { Fuite.on = false; Field.run(escaped); return; }
      if (Fuite.x > l.x - 4) { Fuite.on = false; Field.run(drowned); }
    },
    hud() {
      if (!Fuite.on && !Game.flags.fuiteOk) return;
      const sx = Math.round(Fuite.x - Field.camX);
      if (sx > 0) {
        ctx.fillStyle = 'rgba(40,110,220,0.72)'; ctx.fillRect(0, 0, sx, SH);
        ctx.fillStyle = '#c8e8ff'; for (let y = 0; y < SH; y += 4) ctx.fillRect(sx + Math.round(Math.sin(y * 0.2 + Game.frame * 0.2) * 3), y, 3, 3);
      }
      if (Fuite.on) { UI.win(70, 4, 116, 18); FONT.drawCentered(ctx, 'Fuis vers la droite ! (Maj)', 128, 8, '#ffb0a0'); }
    },
    entities: () => [
      R.spikes('f1', 9, 3, 80, 0), R.spikes('f2', 13, 1, 70, 20), R.spikes('f3', 17, 5, 70, 40), R.spikes('f4', 21, 3, 80, 10), R.spikes('f5', 26, 1, 60, 30), R.spikes('f6', 29, 5, 60, 0),
    ],
  };
  async function drowned() {
    SND.sfx('cancel');
    R.hurtParty(0.2);
    await say(null, 'Glou glou... L\'eau a rattrapé l\'équipe ! Retour au début du tunnel.');
    await R.fadeLoad('fuite', 2.5, 3, 'right');
    Fuite.start();
  }
  async function escaped() {
    Game.flags.fuiteOk = true;
    SND.sfx('confirm');
    await say(null, 'Au bout du tunnel, une poche d\'air... et le sous-marin du général Bleu !');
    if (has('bulma')) await say('Bulma', 'Tout le monde à bord ! Je sais piloter ce genre d\'engin, il y a les mêmes à la Capsule Corp.');
    else await say('Goku', 'Un sous-marin ! Je vais appuyer sur tous les boutons... On verra bien !');
    await UI.fadeTo(1, 30);
    Field.load('pirates', 13.5, 10, 'down');
    await UI.fadeTo(0, 30);
    await say(null, 'Le sous-marin remonte à la surface dans un geyser d\'écume. Ouf ! Tout le monde est sain et sauf.');
    await bleuArale();
  }
  // Pendant ce temps, au village Pingouin...
  async function bleuArale() {
    await UI.fadeTo(1, 24);
    Field.load('pingouin', 15.5, 14, 'down');
    Field.hideParty = true;
    const b = Field.addEntity({ kind: 'npc', id: 'bleu_p', sprite: 'bleu', x: 15.5 * TS, y: 12 * TS + 14, dir: 'down', solid: false });
    const a = Field.addEntity({ kind: 'npc', id: 'arale_p', sprite: 'arale', x: 15.5 * TS, y: 16 * TS + 14, dir: 'up', solid: false });
    await UI.fadeTo(0, 24);
    await UI.chapter('Pendant ce temps...', 'au village Pingouin');
    await say('Général Bleu', 'Ce gamin à queue de singe... Je le retrouverai ! Hé, toi, la petite à lunettes ! Tu n\'aurais pas vu un garçon avec un bâton ?');
    await say('Arale', 'N\'cha ! Monsieur, vous avez une drôle de tête ! Vous voulez jouer ?');
    await say('Général Bleu', 'Jouer ? Moi ? Pousse-toi de mon chemin, microbe !');
    await say('Arale', 'Oh, c\'est pas gentil, ça... N\'CHA PUNCH !');
    SND.sfx('bighit'); Game.shake = 16;
    await Tasks.tween(b, { y: b.y - 260, x: b.x + 40 }, 34, 'in');
    b.gone = true;
    await say(null, 'Le général Bleu s\'envole par-delà les nuages... Ding ! Une petite étoile scintille dans le ciel.');
    await say('Arale', 'Hihi ! Il vole comme une fusée ! Bye-cha !');
    a.gone = true;
    Field.hideParty = false;
    await UI.fadeTo(1, 24);
    Field.load('pirates', 13.5, 10, 'down');
    await UI.fadeTo(0, 24);
    await say('Goku', 'Le radar bipe encore... La prochaine boule est vers la Terre sacrée de Karine, au nord-ouest !');
    Game.flags.vu_karine = true;
    Game.setQuest('ruban', 'karine');
    SND.sfx('levelup');
    await say(null, 'Fin du chapitre 11. La Terre sacrée de Karine apparaît sur la carte du Kinto\'un.');
  }

  // =====================================================================
  // CHAPITRE 12 : la Tour de Karine
  // =====================================================================
  MAPS.karine = {
    name: 'Terre sacrée de Karine', music: 'forest', ground: '.',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFF.....FFFFFFFFFFFFF',
      'FFFFFFFFFF..........FFFFFFFFFF',
      'FFFF......,.............FFFFFF',
      'FFF...T.............T.....FFFF',
      'FF............###....,.....FFF',
      'FF..,...T.....###...........FF',
      'FF............pp.......T....FF',
      'F.......pppppppppppppp.......F',
      'F..T....p............p...,...F',
      'F.......p...###......p.......F',
      'F.......p...###......p...T...F',
      'F..,....p............p.......F',
      'F.......pppppppppppppp.......F',
      'FF.T..........pp.........T..FF',
      'FF............pp............FF',
      'FFF...,.......pp.......,...FFF',
      'FFFF....T.....pp.....T....FFFF',
      'FFFFFF........pp........FFFFFF',
      'FFFFFFFFF.....pp.....FFFFFFFFF',
      'FFFFFFFFFFFF..pp..FFFFFFFFFFFF',
      'FFFFFFFFFFFFFFppFFFFFFFFFFFFFF',
    ],
    patch() { R.building('karine_tour'); },
    objects: [
      { type: 'building', img: 'karine_tour', x: 14 * TS, y: 7 * TS - 220, sortY: 7 * TS - 4 },
      { type: 'prop', img: 'tent', x: 12 * TS, y: 10 * TS - 6 },
      { type: 'prop', img: 'campfire', x: 18 * TS, y: 11 * TS },
    ],
    entities: () => [
      warp(14, 21, 2, 1, 'karine', 14.5, 19, 'up'),
      { kind: 'trigger', tx: 14, ty: 7, tw: 2, th: 1, run: climbTower },
      savePt(20, 15),
      npc('upa', 'upa', 16, 11, upaTalk, { dir: 'left' }),
      npc('bora', 'bora', 11, 12, () => say('Bora', 'Cette terre est sacrée. Mon fils Upa et moi, nous la protégeons depuis toujours.'), { cond: () => !Game.flags.taoArrive || !!Game.flags.boraVivant, dir: 'right' }),
      foe(5, 6, ['tigre_sacre']),
      foe(24, 10, ['aigle', 'aigle']),
      foe(6, 16, ['tigre_sacre', 'aigle']),
      chest('karine1', 2, 9, 'super_tonique', 3),
      chest('karine2', 26, 16, 'senzu'),
    ],
    async onEnter() {
      if (Game.flags.karineIntro) return;
      Game.flags.karineIntro = true;
      Game.flags.ch12 = true;
      await Field.run(karineIntro);
    },
  };
  async function karineIntro() {
    await chapterCard('ch12card', 'Chapitre 12', 'La Tour de Karine');
    await say('Goku', 'Ouah ! Cette tour monte jusqu\'au ciel ! On ne voit même pas le sommet !');
    const bora = Field.ent('bora'), upa = Field.ent('upa');
    await Field.walkTo(bora, L().x - 20, L().y - 6, 1.6); bora.dir = 'right';
    await say('Bora', 'Qui es-tu, étranger ? Encore un soldat du Ruban Rouge venu voler la boule sacrée ?');
    await say('Goku', 'Le Ruban Rouge ? Non ! Moi, je les combats ! Je m\'appelle Goku.');
    await Field.walkTo(upa, L().x + 20, L().y - 6, 1.6); upa.dir = 'left';
    await say('Upa', 'Papa ! Il a l\'air gentil, ce garçon... Il a une queue, comme un singe ! Hi hi !');
    await say('Bora', 'Hmm... Ton regard est pur. Pardonne-moi, Goku. Je suis Bora, et voici mon fils Upa. La boule que tu cherches est au pied de la tour, nous la gardons.');
    await say(null, 'Soudain, un sifflement déchire l\'air... Un pilier de pierre traverse le ciel et retombe dans un fracas énorme !');
    SND.sfx('bighit'); Game.shake = 20;
    const tao = Field.addEntity({ kind: 'npc', id: 'tao', sprite: 'tao', x: L().x, y: L().y - 60, dir: 'down' });
    await say('Tao Paï Paï', 'Je suis Tao Paï Paï, le plus grand tueur du monde. Le Ruban Rouge m\'a payé pour récupérer cette boule. Écartez-vous.');
    await say('Bora', 'Jamais ! Tu ne poseras pas tes mains sur la boule sacrée !');
    await Field.walkTo(bora, tao.x, tao.y + 18, 2.2);
    SND.sfx('bighit'); Game.shake = 14;
    Field.effects.push({ type: 'smoke', x: bora.x, y: bora.y - 10, t: 30 });
    await Tasks.tween(bora, { y: bora.y + 30 }, 12, 'out');
    await say(null, 'D\'un seul doigt, Tao Paï Paï repousse Bora, qui s\'écroule et ne se relève plus...');
    await say('Upa', 'PAPAAA !');
    bora.gone = true;
    Game.flags.taoArrive = true;
    await say('Goku', 'Toi... Tu vas me le payer !');
    tao.visible = false;
    await Battle.start(['tao1'], { positions: [[tao.x, tao.y]], music: 'boss', canFlee: false, spar: true, loseMsg: 'Tao Paï Paï est beaucoup trop fort...' });
    tao.visible = true;
    await say('Tao Paï Paï', 'Dodon Ray ! ... Hmpf. Un moucheron de moins. Je prends la boule.');
    await say(null, 'Tao Paï Paï s\'éloigne, la boule de Bora sous le bras, en croyant Goku vaincu pour de bon...');
    await Tasks.tween(tao, { y: tao.y - 200 }, 30, 'in');
    tao.gone = true;
    Game.healAll();
    await say('Goku', 'Ouille... J\'ai cru que j\'allais y passer. Heureusement, la boule à six étoiles, dans mon kimono, a arrêté le rayon !');
    await say('Upa', 'Goku... Papa ne se réveille pas... (snif)');
    await say('Goku', 'Upa... Je te promets une chose : quand j\'aurai réuni les sept boules, je demanderai à Shenron de ramener ton papa !');
    await say('Upa', 'C\'est vrai ? ... Alors écoute : en haut de la tour vit Karine, l\'ermite. On dit que celui qui boit son eau sacrée devient beaucoup plus fort !');
    await say('Goku', 'Plus fort ? Alors je grimpe ! Et après, je retrouverai ce Tao Paï Paï !');
    Game.setQuest('ruban', 'tour');
  }
  async function upaTalk() {
    if (Game.flags.boraVivant) { await say('Upa', 'Papa est revenu ! Merci, Goku ! Merci, Shenron !'); return; }
    if (Game.flags.taoDone) { await say('Upa', 'Merci d\'avoir vaincu Tao Paï Paï, Goku. N\'oublie pas ta promesse...'); return; }
    if (Game.flags.taoArrive) { await say('Upa', 'La Tour de Karine est juste là, au nord. Tu peux le faire, Goku !'); return; }
    await say('Upa', 'Bienvenue sur la Terre sacrée ! Papa dit que personne n\'est jamais monté en haut de la tour.');
  }
  async function climbTower() {
    if (!Game.flags.taoArrive) { await say(null, 'Une immense colonne blanche s\'élève jusqu\'aux nuages. Des milliers de prises sont gravées dans la pierre...'); await Field.walkTo(L(), L().x, L().y + 14, 1.2); return; }
    if (Game.flags.taoDone) { await say(null, 'La Tour de Karine. Le sommet se perd dans les nuages.'); await Field.walkTo(L(), L().x, L().y + 14, 1.2); return; }
    const r = await ask('Goku', 'Grimper la Tour de Karine ?', ['On grimpe !', 'Pas encore'], { cancel: 1 });
    if (r !== 0) { await Field.walkTo(L(), L().x, L().y + 14, 1.2); return; }
    const g = Game.member('goku') || Game.party[0];
    let tries = 0;
    for (;;) {
      const res = await MiniGames.run('grimpe', g);
      if (res && res.score >= 100) break;
      tries++;
      const opts = tries >= 2 ? ['Réessayer', 'Grimper doucement (sans chrono)', 'Redescendre'] : ['Réessayer', 'Redescendre'];
      const c = await ask('Goku', 'Ouille, j\'ai glissé... Je recommence ?', opts, { cancel: opts.length - 1 });
      if (c === opts.length - 1) { await Field.walkTo(L(), L().x, L().y + 14, 1.2); return; }
      if (c === 1 && tries >= 2) { await say(null, 'Goku grimpe lentement, prise après prise, pendant une journée entière...'); break; }
    }
    await UI.fadeTo(1, 30);
    Field.load('sommet', 8.5, 11, 'up');
    await UI.fadeTo(0, 30);
    await sommetArrive();
  }

  // --- Le mini-jeu de la grimpette ---
  const grimpe = {
    name: 'La Tour de Karine', who: 'Grimpeur', noCancel: true,
    help: 'Appuie sur Gauche et Droite en alternance pour grimper. Deux fois la même main : tu glisses ! Quand un oiseau arrive (!), maintiens Bas pour te plaquer contre la tour.',
    init(S) { Object.assign(S, { h: 0, last: null, breath: 100, birds: [], slip: 0, t: 0, frame: 0, hug: false, msg: '' }); },
    update(S, t) {
      const G = MiniGames.state();
      S.t = t; S.hug = Input.down('down');
      S.breath = Math.min(100, S.breath + 0.35);
      if (S.slip > 0) { S.slip--; S.h = Math.max(0, S.h - 0.12); }
      else if (!S.hug) for (const k of ['left', 'right']) if (Input.pressed(k)) {
        if (k === S.last || S.breath < 8) { S.slip = 30; S.last = null; SND.sfx('cancel'); S.msg = S.breath < 8 ? 'À bout de souffle !' : 'Même main : ça glisse !'; break; }
        S.last = k; S.h += 1.25; S.breath -= 6.5; S.frame++; SND.note(60 + Math.floor(S.h) % 12, 0.03, 'sq', 0.05); S.msg = '';
      }
      // oiseaux : annoncés d'un côté, ils traversent l'écran
      if (t % 150 === 60 && S.h < 96) S.birds.push({ side: Math.random() < 0.5 ? -1 : 1, t: 0 });
      for (const b of S.birds) {
        b.t++;
        if (b.t === 70 && !S.hug) { S.h = Math.max(0, S.h - 5); S.slip = 40; S.msg = 'Un oiseau t\'a fait lâcher prise !'; SND.sfx('hit'); Game.shake = 6; }
      }
      S.birds = S.birds.filter(b => b.t < 110);
      G.score = Math.floor(Math.min(100, S.h));
      if (S.h >= 100 || t > 60 * 75) G.done = true;
    },
    rank() { const G = MiniGames.state(), s = G.s; if (s.h < 100) return 0; return s.t < 60 * 35 ? 3 : s.t < 60 * 48 ? 2 : 1; },
    draw(S, t) {
      const k = Math.min(1, S.h / 100);
      const g = ctx.createLinearGradient(0, 0, 0, SH);
      g.addColorStop(0, k > 0.7 ? '#1a2a6a' : '#5aa0e8'); g.addColorStop(1, k > 0.7 ? '#5a80d0' : '#b8e0ff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
      // nuages qui défilent
      for (let i = 0; i < 6; i++) { const y = ((i * 47 + S.h * 9) % (SH + 40)) - 20; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect((i * 83) % 200 + (i % 2 ? 150 : -20), Math.round(y), 40, 8); ctx.fillRect((i * 83) % 200 + (i % 2 ? 158 : -12), Math.round(y) - 4, 22, 4); }
      // la tour
      ctx.fillStyle = K; ctx.fillRect(104, 0, 48, SH); ctx.fillStyle = '#e8e8f0'; ctx.fillRect(105, 0, 46, SH); ctx.fillStyle = '#c0c0d0'; ctx.fillRect(140, 0, 11, SH);
      for (let y = Math.round((S.h * 12) % 16) - 16; y < SH; y += 16) { ctx.fillStyle = '#a8a8b8'; ctx.fillRect(105, y, 46, 1); ctx.fillStyle = '#d83030'; ctx.fillRect(112 + ((y + Math.floor(S.h * 12 / 16) * 16) % 32 ? 0 : 20), y + 6, 6, 4); }
      // Goku agrippé (de dos)
      const sp = GFX.char(MiniGames.state().key);
      const img = S.slip > 0 ? sp.down[0] : sp.up[S.frame % 2 ? 1 : 2];
      ctx.drawImage(img, 104, 118 + (S.hug ? 4 : 0), 48, 64);
      // oiseaux
      for (const b of S.birds) {
        if (b.t < 50) { if (Math.floor(b.t / 6) % 2) FONT.draw(ctx, '!', b.side < 0 ? 16 : 236, 140, '#ff5040'); continue; }
        const p = (b.t - 50) / 50, x = b.side < 0 ? -20 + p * 300 : 276 - p * 300, y = 140 + Math.sin(b.t * 0.4) * 3;
        ctx.fillStyle = K; ctx.fillRect(Math.round(x) - 6, Math.round(y), 13, 3); ctx.fillStyle = '#5a4030'; ctx.fillRect(Math.round(x) - 5, Math.round(y) + 1, 11, 1); ctx.fillRect(Math.round(x) - 6 + (b.t % 8 < 4 ? 0 : 2), Math.round(y) - 3, 3, 3); ctx.fillRect(Math.round(x) + 4 - (b.t % 8 < 4 ? 0 : 2), Math.round(y) - 3, 3, 3);
      }
      // jauges
      UI.win(4, 4, 92, 30);
      FONT.draw(ctx, 'Hauteur : ' + Math.floor(Math.min(100, S.h)) + ' %', 10, 8, '#ffffff');
      ctx.fillStyle = '#20204a'; ctx.fillRect(10, 22, 80, 6); ctx.fillStyle = S.breath < 25 ? '#f06040' : '#60d0f0'; ctx.fillRect(10, 22, Math.round(80 * S.breath / 100), 6);
      UI.win(184, 4, 68, 18);
      FONT.drawRight(ctx, Math.max(0, 75 - Math.floor(t / 60)) + ' s', 246, 8, '#ffe060');
      if (S.msg) FONT.drawCentered(ctx, S.msg, 128, 200, '#ffb0a0');
      else if (S.hug) FONT.drawCentered(ctx, 'Goku se plaque contre la tour...', 128, 200, '#c0e0ff');
    },
  };
  if (typeof MiniGames !== 'undefined') MiniGames.GAMES.grimpe = grimpe;

  // --- Le sommet : attraper Karine ---
  function platformRows() {
    const rows = [];
    for (let y = 0; y < 14; y++) {
      let r = '';
      for (let x = 0; x < 18; x++) r += ((x + 0.5 - 9) ** 2 + ((y + 0.5 - 7) * 1.15) ** 2 <= 30) ? 'c' : 'K';
      rows.push(r);
    }
    for (const y of [12, 13]) rows[y] = rows[y].slice(0, 8) + 'cc' + rows[y].slice(10); // la descente
    return rows;
  }
  const Chase = { on: false, t: 0 };
  MAPS.sommet = {
    name: 'Sommet de la Tour de Karine', music: 'training', ground: 'c', rows: platformRows(),
    objects: [{ type: 'prop', img: 'shrine', x: 8 * TS, y: 2 * TS }],
    entities: () => [
      { kind: 'npc', id: 'karine', tx: 8.5, ty: 5, mon: 'karine', turn: false, talk: karineTalk },
      { kind: 'trigger', tx: 8, ty: 13, tw: 2, th: 1, run: descend },
    ],
    update() {
      if (!Chase.on) return;
      Chase.t++;
      const k = Field.ent('karine'), l = L();
      if (!k) return;
      let dx = k.x - l.x, dy = k.y - l.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = Math.max(1.15, 1.95 - Chase.t / 4000) * (d < 60 ? 1 : 0.5);
      dx /= d; dy /= d;
      const wob = Math.sin(Chase.t * 0.05) * 0.6;
      let vx = dx - dy * wob, vy = dy + dx * wob;
      const cx = 9 * TS, cy = 7 * TS + 6, rad = 72;
      let nx = k.x + vx * sp, ny = k.y + vy * sp;
      if (Math.hypot(nx - cx, (ny - cy) * 1.15) > rad) { // au bord : il longe la plateforme
        const tx = -(ny - cy), ty = nx - cx, tl = Math.hypot(tx, ty) || 1, side = (tx * dx + ty * dy) >= 0 ? 1 : -1;
        nx = k.x + tx / tl * sp * side; ny = k.y + ty / tl * sp * side;
        const pd = Math.hypot(nx - cx, (ny - cy) * 1.15); if (pd > rad) { nx = cx + (nx - cx) * rad / pd; ny = cy + (ny - cy) * rad / pd; }
      }
      k.x = nx; k.y = ny;
      if (Chase.t > 60 * 60) { Chase.on = false; Field.run(async () => { await say('Karine', 'Trop lent ! Hi hi. Repose-toi un peu, et reviens me voir quand tu veux réessayer.'); k.x = 8.5 * TS + 8; k.y = 5 * TS + 14; }); }
    },
    hud() { if (Chase.on) { UI.win(70, 4, 116, 18); FONT.drawCentered(ctx, 'Attrape Karine ! ' + Math.max(0, 60 - Math.floor(Chase.t / 60)) + ' s', 128, 8, '#ffe060'); } },
  };
  async function sommetArrive() {
    if (Game.flags.sommetIntro) return;
    Game.flags.sommetIntro = true;
    await Field.run(async () => {
      await say('Goku', 'Ouf... J\'y suis ! Le sommet de la tour !');
      await say('Karine', 'Tiens tiens... Un visiteur. Cela faisait trois cents ans. Je suis Karine, le gardien de cette tour.');
      await say('Goku', 'Un chat qui parle ?! ... Euh, bonjour ! Je voudrais boire l\'eau sacrée pour devenir plus fort !');
      await say('Karine', 'L\'eau sacrée est dans cette fiole. Si tu veux la boire... il faudra me l\'arracher des pattes ! Parle-moi quand tu seras prêt.');
    });
  }
  async function karineTalk() {
    if (Chase.on) { Chase.on = false; await caught(); return; }
    if (Game.flags.eauSacree) { await say('Karine', 'Redescends, Goku. Tao Paï Paï t\'attend en bas... Et prends soin de mes haricots magiques !'); return; }
    const r = await ask('Karine', 'Alors, petit, tu tentes ta chance ? Attrape-moi en moins d\'une minute ! (Maj pour courir)', ['C\'est parti !', 'Pas encore'], { cancel: 1 });
    if (r !== 0) return;
    Chase.on = true; Chase.t = 0;
    SND.sfx('confirm');
  }
  async function caught() {
    SND.sfx('item');
    await say('Karine', 'Miaou ! Tu m\'as eu ! Pas mal, pas mal du tout...');
    await say(null, 'Goku boit l\'eau sacrée d\'une traite...');
    await say('Goku', '... Hé ! Mais c\'est de l\'eau toute simple !');
    await say('Karine', 'Ho ho ho ! Bien sûr. Mais pour m\'attraper, tu as dû devenir bien plus rapide et plus fort qu\'avant. Voilà le vrai secret de l\'eau sacrée !');
    Game.flags.eauSacree = true;
    for (const m of Game.allMembers()) applyBonus(m, m.id === 'goku' ? { atk: 6, def: 4, spd: 3, mag: 4, hp: 60 } : { atk: 3, def: 2, spd: 1, mag: 2, hp: 30 });
    Game.healAll();
    SND.sfx('levelup');
    await say(null, 'L\'entraînement de Karine porte ses fruits : Goku devient beaucoup plus fort, et ses amis aussi !');
    await say('Karine', 'Tiens, prends aussi ces haricots magiques. Un seul guérit toutes les blessures. Allez, file !');
    await getItem('senzu', 5);
    Game.setQuest('ruban', 'revanche');
  }
  async function descend() {
    if (!Game.flags.eauSacree) { await say('Goku', 'Je ne vais pas redescendre maintenant ! Il faut d\'abord boire l\'eau sacrée de Karine.'); await Field.walkTo(L(), L().x, L().y - 14, 1.2); return; }
    await UI.fadeTo(1, 30);
    Field.load('karine', 14.5, 8, 'down');
    await UI.fadeTo(0, 30);
    if (!Game.flags.taoDone) await taoRevanche();
  }
  async function taoRevanche() {
    await say(null, 'À peine redescendu, Goku sent une présence glaciale...');
    const tao = Field.addEntity({ kind: 'npc', id: 'tao2', sprite: 'tao', x: L().x, y: L().y + 50, dir: 'up' });
    await say('Tao Paï Paï', 'Quoi ?! Tu es encore vivant ? Personne n\'a jamais survécu à mon Dodon Ray !');
    await say('Goku', 'Je suis allé m\'entraîner chez Karine. Cette fois, tu vas voir !');
    tao.visible = false;
    await Battle.start(['tao2'], { positions: [[tao.x, tao.y]], music: 'boss', canFlee: false });
    tao.visible = true;
    await say('Tao Paï Paï', 'Grr... Impossible ! Un gamin... Tiens, attrape ça ! Une grenade !');
    SND.sfx('jump');
    await say('Goku', 'Hop ! Je te la renvoie !');
    SND.sfx('blast'); Game.shake = 22;
    Field.effects.push({ type: 'smoke', x: tao.x, y: tao.y - 10, t: 50 });
    await wait(30);
    tao.gone = true;
    await say(null, 'BOUM ! Quand la fumée se dissipe, Tao Paï Paï a disparu. Sur le sol, il ne reste que la boule de Bora.');
    Game.flags.taoDone = true;
    await R.rball(5);
    await say('Upa', 'Goku ! Tu l\'as battu ! ... Papa serait si fier de toi.');
    await say('Goku', 'Plus que trois boules, Upa. Je tiendrai ma promesse.');
    await say('Goku', 'Le radar en montre deux ensemble, tout au nord-est... C\'est là que se cache l\'armée du Ruban Rouge ! Leur quartier général !');
    Game.flags.vu_qg = true;
    Game.setQuest('ruban', 'qg');
    SND.sfx('levelup');
    await say(null, 'Fin du chapitre 12. Le QG du Ruban Rouge apparaît sur la carte du Kinto\'un.');
  }

  return { Fuite, Chase };
})();
window.Ruban2 = Ruban2;
