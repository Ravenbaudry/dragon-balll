// Chapitre 8 : « Un an plus tard », le 21e Championnat du monde des arts martiaux sur l'île Papaye.
// Personnages, ennemis, carte, déroulement du tournoi, tableau des combats et destruction de la lune.
const Tournoi = (() => {
  const TS = 16;

  // ---------------- Personnages ----------------
  Object.assign(PALS, {
    jackie: { h: '#e4e4ee', H: '#a4a4b8', j: '#ffffff', c: '#7e9c8c', C: '#526e60', q: '#aac8b8', d: '#e8dcc0', D: '#b0a080', p: '#e8dcc0', P: '#b0a080', f: '#202028', F: '#101014', x: '#404050', a: '#7e9c8c' },
    nam: { s: '#b07444', S: '#7c4a24', t: '#d89a64', h: '#f2eee2', H: '#c2baa6', j: '#ffffff', c: '#f0ece0', C: '#bcb4a0', q: '#ffffff', d: '#c83838', D: '#8a2020', p: '#e4dccb', P: '#b0a690', f: '#6a4224', F: '#3e2410', x: '#8a5a34', a: '#f0ece0' },
    annonceur: { h: '#f0c848', H: '#b08820', j: '#fff0a0', c: '#2a2a40', C: '#16161f', q: '#4c4c6a', d: '#f0f0f8', D: '#b0b0c0', p: '#2a2a40', P: '#16161f', f: '#141414', F: '#0a0a0a', x: '#3a3a3a', a: '#2a2a40' },
    bacterian: { s: '#d4a878', S: '#a07448', t: '#ecc898', h: '#4a3a2a', H: '#2a2018', j: '#6a5a44', c: '#8c8a58', C: '#5e5c36', q: '#b0ae7c', d: '#5a4630', D: '#3a2c1c', p: '#6a6448', P: '#4a4630', f: '#3a2a1a', F: '#20140a', x: '#5a4a3a', a: '#8c8a58' },
    ranfan: { h: '#1c1c28', H: '#0c0c14', j: '#40405c', c: '#d83c5c', C: '#982440', q: '#f8889c', d: '#f0c040', D: '#b08820', f: '#d83c5c', F: '#982440', x: '#f8889c', a: '#d83c5c' },
    moine: { h: '#fcd0a0', H: '#e09868', j: '#fff0dc', c: '#e88a30', C: '#b05c18', q: '#f8bc70', d: '#c84030', D: '#8a2418', f: '#5a3a1a', F: '#3a2410', a: '#e88a30' },
  });
  // Lunettes noires et moustache, posées sur la tête « villM »
  function shades(g, c) {
    const fill = (y, x0, x1, ch) => { for (let x = x0; x <= x1; x++) if (g[y][x] !== '.') g[y][x] = ch; };
    if (c.dir === 'down') { fill(13, 7, 16, 'g'); fill(14, 7, 10, 'g'); fill(14, 13, 16, 'g'); g[13][8] = 'W'; g[13][14] = 'W'; }
    else if (c.dir === 'right') { fill(13, 15, 18, 'g'); fill(14, 15, 18, 'g'); fill(13, 12, 14, 'k'); g[13][16] = 'W'; }
  }
  function moustache(g, c) {
    if (c.dir === 'down') { for (let x = 9; x <= 14; x++) g[15][x] = 'W'; g[16][9] = g[16][14] = 'W'; }
    else if (c.dir === 'right') { for (let x = 14; x <= 18; x++) g[15][x] = 'W'; g[16][17] = 'W'; }
  }
  Object.assign(CHARS, {
    jackie: { head: 'villM', body: 'tunic', pal: 'jackie', mods: [{ phase: 'head', fn: shades }, { phase: 'head', fn: moustache }] },
    nam: { head: 'villM', body: 'tunic', pal: 'nam' },
    annonceur: { head: 'villM', body: 'tunic', pal: 'annonceur', mods: [{ phase: 'head', fn: shades }] },
    bacterian: { head: 'villM', body: 'tunic', pal: 'bacterian' },
    ranfan: { head: 'villF', body: 'dress', pal: 'ranfan' },
    moine: { head: 'villM', body: 'robe', pal: 'moine' },
  });

  // ---------------- Équipements, ennemis, quête ----------------
  Object.assign(GEAR, {
    ceinture_champion: { slot: 'tenue', name: 'Ceinture du Champion', desc: 'La ceinture dorée du vainqueur du Championnat du monde.', stats: { atk: 5, def: 5, spd: 2, hp: 50 }, price: 0,
      art: { belt: ['#f0c030', '#b08010', '#fff080'] } },
    bandeau_argent: { slot: 'tete', name: 'Bandeau d\'Argent', desc: 'Offert au finaliste du Championnat du monde.', stats: { atk: 3, mag: 3, def: 1, spd: 1 }, price: 0,
      art: { band: ['#d8dce8', '#9098a8'], knot: true, plate: '#f0c030' } },
  });
  Object.assign(ENEMIES, {
    bacterian: {
      name: 'Bactérian', char: 'bacterian', hp: 1150, atk: 49, def: 21, spd: 13, xp: 320, zeni: 0, boss: true, immune: ['poison'],
      skills: [{ name: 'Haleine Fétide', target: 'one', pow: 1.5, chance: 0.25, st: 'poison', sc: 0.7 }, { name: 'Gratouille Crasseuse', target: 'one', pow: 0.55, hits: 3, chance: 0.2 }],
    },
    giran: {
      name: 'Giran', spr: 'giran', hp: 1500, atk: 52, def: 26, spd: 15, xp: 650, zeni: 0, boss: true, big: true,
      skills: [{ name: 'Coup de Queue', target: 'one', pow: 1.7, chance: 0.25 }, { name: 'Chewing-gum Gluant', target: 'one', pow: 0.5, hits: 3, chance: 0.2, st: 'stun', sc: 0.5 }, { name: 'Souffle de Giran', target: 'all', pow: 1.2, chance: 0.15 }],
    },
    nam: {
      name: 'Nam', char: 'nam', hp: 1600, atk: 56, def: 24, spd: 19, xp: 800, zeni: 0, boss: true,
      skills: [{ name: 'Croix Céleste', target: 'one', pow: 2.1, chance: 0.18 }, { name: 'Rafale du Désert', target: 'one', pow: 0.6, hits: 3, chance: 0.25 }],
    },
    // la finale, en deux temps : la pleine lune interrompt le premier
    jackie: {
      name: 'Jackie Chun', char: 'jackie', hp: 2600, atk: 60, def: 30, spd: 23, xp: 0, zeni: 0, boss: true, yieldAt: 0.5, yieldMsg: 'Le combat est interrompu !',
      skills: [{ name: 'Danse de l\'Ivrogne', target: 'one', pow: 0.5, hits: 4, chance: 0.25, st: 'sleep', sc: 0.2 }, { name: 'Poing de la Tortue', target: 'one', pow: 2.0, chance: 0.14 }],
    },
    jackie2: {
      name: 'Jackie Chun', char: 'jackie', hp: 2600, atk: 60, def: 30, spd: 23, xp: 1500, zeni: 0, boss: true,
      skills: [{ name: 'Kamehameha', target: 'one', pow: 2.1, chance: 0.12, beam: true }, { name: 'Danse de l\'Ivrogne', target: 'one', pow: 0.5, hits: 4, chance: 0.22, st: 'sleep', sc: 0.2 }, { name: 'Images Rémanentes', target: 'one', pow: 0.45, hits: 5, chance: 0.15 }, { name: 'Poing de la Tortue', target: 'one', pow: 2.0, chance: 0.12 }],
    },
  });
  QUESTS.tournoi = {
    title: 'Le Championnat du monde', main: true,
    steps: {
      depart: 'Le 21e Championnat du monde des arts martiaux a lieu sur l\'île Papaye. Le passeur attend sur la plage de la Kame House.',
      inscription: 'S\'inscrire auprès du moine, à gauche de l\'arène de l\'île Papaye.',
      done: 'Le 21e Championnat du monde est terminé !',
    },
  };

  // ---------------- Décors ----------------
  let arenaImg = null, boat = null;
  function makeArena() { // l'estrade de pierre : 12 x 6 dalles et sa bordure
    const w = 192, h = 106, c = GFX.mk(w, h), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(0, 0, w, h);
    x.fillStyle = '#8a8676'; x.fillRect(1, 1, w - 2, 94);
    for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 12; tx++) {
      const ox = tx * 16, oy = ty * 16, v = GFX.hash(tx, ty, 11) % 3;
      x.fillStyle = ['#c8c4b4', '#bcb8a8', '#d2cebe'][v]; x.fillRect(ox + 2, oy + 2, 14, 14);
      x.fillStyle = '#e6e2d2'; x.fillRect(ox + 2, oy + 2, 14, 1);
      x.fillStyle = '#a29e90'; x.fillRect(ox + 2, oy + 15, 14, 1);
    }
    x.fillStyle = '#e6e2d2'; x.fillRect(1, 1, w - 2, 1);
    // face avant de l'estrade
    x.fillStyle = '#6c6a5e'; x.fillRect(1, 96, w - 2, 9);
    x.fillStyle = '#56544a'; for (let i = 8; i < w; i += 16) x.fillRect(i, 96, 1, 9);
    x.fillStyle = '#86847a'; x.fillRect(1, 96, w - 2, 1);
    return c;
  }
  function boatImg() { // la barque du passeur
    if (boat) return boat;
    const c = GFX.mk(40, 26), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(19, 0, 3, 16);
    x.fillStyle = '#7a4c24'; x.fillRect(20, 1, 1, 15);
    x.fillStyle = K; for (let i = 0; i < 12; i++) x.fillRect(22, 2 + i, 2 + i, 1);
    x.fillStyle = '#f4f0e0'; for (let i = 1; i < 11; i++) x.fillRect(22, 2 + i, i, 1);
    x.fillStyle = K; x.fillRect(0, 15, 40, 2); x.fillRect(3, 17, 34, 6); x.fillRect(7, 23, 26, 2);
    x.fillStyle = '#b07440'; x.fillRect(1, 16, 38, 1); x.fillRect(4, 17, 32, 5); x.fillRect(8, 22, 24, 2);
    x.fillStyle = '#8a5428'; x.fillRect(4, 20, 32, 1); x.fillStyle = '#d89a5c'; x.fillRect(4, 17, 32, 1);
    return (boat = c);
  }

  // ---------------- Carte : l'île Papaye ----------------
  MAPS.papaye = {
    name: 'Île Papaye', music: 'tournoi', ground: '.',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FF.....T.....#######.......T....FF',
      'FF.T.....T...#######...T........FF',
      'FF........T..#######..........T.FF',
      'FF....,......#######....T.......FF',
      'FF...........#######......,.....FF',
      'FFT..........#######............FF',
      'FF.............ppp.............TFF',
      'FF..,.....pppppppppppppp.....,..FF',
      'FF........pccccccccccccp........FF',
      'FF.##.....pccccccccccccp...##...FF',
      'FF........pccccccccccccp........FF',
      'FF........pccccccccccccp.,......FF',
      'FF......,.pccccccccccccp........FF',
      'FF........pccccccccccccp........FF',
      'FF###.....pppppppppppppp....###.FF',
      'FF###....pppppppppppppppp...###.FF',
      'FF..............pp..............FF',
      'FF...,..........pp..........,...FF',
      'FF....T.....,...pp...,.....T....FF',
      'FF..............pp..............FF',
      'FFssssssssssPssssssssPssssssssssFF',
      'sssPsssssPssssssssssssssPsssssPsss',
      'sssssssssssssssswwssssssssssssssss',
      '~~~~~~~~~~~~~~~~ww~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~ww~~~~~~~~~~~~~~~~',
    ],
    patch() { if (!GFX.tiles.props.arena) GFX.tiles.props.arena = arenaImg || (arenaImg = makeArena()); },
    objects: [
      { type: 'prop', img: 'arena', x: 176, y: 144, sortY: -1000 },
      { type: 'building', img: 'pagoda', x: 208, y: 0 },
      { type: 'building', img: 'stall', x: 44, y: 140, sortY: 172 },
      { type: 'building', img: 'stall', x: 428, y: 140, sortY: 172 },
      { type: 'building', img: 'dome2', x: 28, y: 222 },
      { type: 'building', img: 'dome3', x: 444, y: 222 },
    ],
    entities: () => {
      const done = () => !!Game.flags.tournoiDone;
      return [
        savePt(13, 20),
        sign(15, 19, 'Île Papaye : 21e Championnat du monde des arts martiaux. Inscriptions auprès du moine, à gauche de l\'arène.'),
        npc('papaye_passeur', 'villM2', 17, 24, passeurPapaye, { dir: 'up' }),
        { kind: 'img', id: 'papaye_bateau', x: 18.5 * TS + 4, y: 25 * TS + 10, solid: false, get img() { return boatImg(); } },
        npc('papaye_moine', 'moine', 4, 11, moineTalk),
        npc('papaye_vendeur', 'villM1', 27, 11, vendeurTalk),
        npc('papaye_annonceur', 'annonceur', 19, 17, annonceurTalk),
        npc('papaye_jackie', 'jackie', 7, 7, jackieTalk, { cond: () => !done() }),
        npc('papaye_nam', 'nam', 26, 9, namTalk, { cond: () => !done() || !!Game.flags.namHelped }),
        { kind: 'npc', id: 'papaye_giran', mon: 'giran', tx: 29, ty: 13, talk: giranTalk },
        npc('papaye_bacterian', 'bacterian', 6, 13, () => say('Bactérian', 'Hé hé hé... Tu veux un câlin, petit ? Je ne me suis jamais lavé, mais je suis très affectueux !'), { cond: () => !done() }),
        npc('papaye_ranfan', 'ranfan', 25, 14, () => say('Ranfan', 'Je suis Ranfan. Méfie-toi, petit : mon charme est mon arme secrète !'), { cond: () => !done() }),
        npc('papaye_fan1', 'villF1', 12, 17, () => say('Spectatrice', done() ? 'Je n\'oublierai jamais cette finale... ni cette lune qui a disparu !' : 'J\'ai fait trois jours de bateau pour voir le tournoi ! On dit qu\'un enfant s\'est inscrit cette année...')),
        npc('papaye_fan2', 'villM3', 21, 18, () => say('Garçon', done() ? 'Quand je serai grand, je serai aussi fort que Goku !' : 'Quand je serai grand, je gagnerai le Championnat du monde !')),
        npc('papaye_fan3', 'villM1', 8, 9, () => say('Spectateur', 'Le Championnat du monde n\'a lieu que tous les trois ans. Ici, les combattants viennent du monde entier !')),
      ];
    },
    async onEnter() {
      if (Game.flags.papayeIntro) return;
      Game.flags.papayeIntro = true;
      await Field.run(async () => {
        await say('Bulma', 'Waouh, l\'île Papaye ! Il y a du monde partout !');
        if (has('krillin')) await say('Krilin', 'Regarde, Goku : l\'arène ! Pour s\'inscrire, il faut voir le moine, à gauche.');
        await say('Goku', 'Et ça sent bon la nourriture par ici ! Hé hé !');
        Game.setQuest('tournoi', 'inscription');
      });
    },
  };
  // le passeur de la Kame House
  const plageEntities = MAPS.plage.entities;
  MAPS.plage.entities = () => plageEntities().concat([
    npc('passeur', 'villM2', 21, 17, passeurPlage, { cond: () => !!Game.flags.ch8, dir: 'right' }),
    { kind: 'img', id: 'plage_bateau', x: 23.5 * TS, y: 17 * TS + 14, solid: false, cond: () => !!Game.flags.ch8, get img() { return boatImg(); } },
  ]);

  async function sail(to, tx, ty, dir) {
    SND.sfx('door');
    await UI.fadeTo(1, 24);
    await wait(30);
    Field.load(to, tx, ty, dir);
    await UI.fadeTo(0, 24);
    if (Field.map.onEnter) await Field.map.onEnter();
  }
  async function passeurPlage() {
    const r = await ask('Passeur', 'Ohé, les combattants ! Je vous emmène sur l\'île Papaye, pour le Championnat du monde ? La traversée est offerte !', ['Embarquer', 'Pas maintenant'], { cancel: 1 });
    if (r === 0) await sail('papaye', 16, 23, 'up');
  }
  async function passeurPapaye() {
    const r = await ask('Passeur', 'On rentre à la Kame House ?', ['Embarquer', 'Rester ici'], { cancel: 1 });
    if (r === 0) await sail('plage', 20, 16, 'down');
  }

  // ---------------- PNJ de l'île ----------------
  async function moineTalk() {
    if (Game.flags.tournoiDone) { await Modes.arena(); return; }
    const r = await ask('Moine', 'Bienvenue au 21e Championnat du monde des arts martiaux ! Voulez-vous inscrire vos combattants ?', ['Inscrire Goku et Krilin', 'Pas encore'], { cancel: 1 });
    if (r !== 0) return;
    const c = await ask(null, 'Une fois le tournoi commencé, les combats s\'enchaînent jusqu\'à la finale (les combattants sont soignés entre deux matchs). Prêt ?', ['C\'est parti !', 'Attendre un peu'], { cancel: 1 });
    if (c === 0) await tournament();
  }
  async function vendeurTalk() {
    await say('Marchand', 'Toniques, boissons, bandeaux... Tout pour les combattants !');
    await UI.openShop(['tonique', 'super_tonique', 'boisson_ki', 'capsule_vie', 'remede', 'bandeau', 'lunettes', 'plastron', 'montre', 'bracelet_ki', 'aimant']);
  }
  async function annonceurTalk() {
    if (!Game.flags.tournoiDone) await say('Présentateur', 'Je suis le présentateur officiel du tournoi ! Tu as l\'air bien jeune... Mais au Championnat du monde, l\'âge ne compte pas !');
    else await say('Présentateur', Game.flags.champion ? 'Le plus jeune champion de l\'histoire ! Et cette lune qui disparaît... Quelle soirée !' : 'Quelle finale ! Et cette lune qui disparaît... En vingt ans de carrière, je n\'avais jamais vu ça !');
  }
  async function jackieTalk() {
    if (Game.flags.jackieMet) { await say('Jackie Chun', 'Hm hm. On se retrouvera dans l\'arène, jeune homme.'); return; }
    Game.flags.jackieMet = true;
    await say('Jackie Chun', 'Hm hm... Tu as l\'air costaud, petit. Tu participes au tournoi ?');
    await say('Goku', 'Ouais ! ... Dites, monsieur, vous sentez exactement comme Tortue Géniale !');
    await say('Jackie Chun', 'Q-quoi ?! Pas du tout ! Je m\'appelle Jackie Chun, et je ne connais aucune tortue ! Hm hm !');
    await say('Bulma', 'Il est bizarre, ce vieux monsieur... Et ces lunettes noires, en plein jour ?');
  }
  async function namTalk() {
    if (Game.flags.tournoiDone) { await say('Nam', 'Grâce à vous, mon village aura de l\'eau pendant des années. Je ne l\'oublierai jamais.'); return; }
    await say('Nam', 'Je m\'appelle Nam. Je viens d\'un village du désert où il ne pleut plus depuis des mois.');
    await say('Nam', 'Je dois gagner ce tournoi. Pardonne-moi d\'avance, petit.');
  }
  async function giranTalk() {
    if (Game.flags.tournoiDone) await say('Giran', 'Hé, Goku ! Sans rancune ! Tu reviens quand tu veux, on ira voler ensemble !');
    else await say('Giran', 'Grrr... Ne m\'approche pas, gamin ! Je suis Giran, le monstre ailé ! ... Tu veux un chewing-gum ?');
  }

  // ---------------- Le tournoi ----------------
  const NAMES = [['Krilin', 'Bactérian'], ['Jackie Chun', 'Yamcha'], ['Goku', 'Giran'], ['Nam', 'Ranfan']];
  const AX = 17 * TS, AY = 12 * TS; // centre de l'arène
  const CAM = [AX - 134, AY - 116]; // caméra des combats : les deux combattants sur le ring
  const LEFT = [AX - 48, AY + 2], RIGHT = [AX + 48, AY - 2], ROW = 16 * TS + 14;
  const ROAMERS = ['papaye_jackie', 'papaye_nam', 'papaye_giran', 'papaye_bacterian', 'papaye_ranfan', 'papaye_annonceur', 'papaye_fan1', 'papaye_fan2', 'papaye_fan3'];
  let R = {}, board = null, C = null;

  function spawnCast() {
    const add = (id, sprite, x, y, dir = 'up', extra = {}) => Field.addEntity(Object.assign({ kind: 'npc', id: 't_' + id, sprite, x, y, dir, solid: false, row: x }, extra));
    const c = {};
    c.ann = add('ann', 'annonceur', AX, AY - 40, 'down');
    c.bulma = add('bulma', charKey('bulma'), 156, ROW);
    if (Game.member('oolong')) c.oolong = add('oolong', charKey('oolong'), 180, ROW);
    c.krillin = add('krillin', charKey('krillin'), 204, ROW);
    c.goku = add('goku', charKey('goku'), 228, ROW);
    c.yamcha = add('yamcha', charKey('yamcha'), 252, ROW);
    if (Game.member('yamcha')) c.puar = add('puar', null, 262, ROW - 2, 'up', { mon: 'puar', fly: true });
    c.ranfan = add('ranfan', 'ranfan', 292, ROW);
    c.bacterian = add('bacterian', 'bacterian', 316, ROW);
    c.nam = add('nam', 'nam', 340, ROW);
    c.jackie = add('jackie', 'jackie', 364, ROW);
    c.giran = add('giran', null, 370, AY + 46, 'left', { mon: 'giran' });
    c.fans = [add('fan1', 'villF1', 150, AY - 30, 'right'), add('fan2', 'villM3', 150, AY + 8, 'right'), add('fan3', 'villM1', 378, AY - 26, 'left')];
    return c;
  }
  async function showBoard(next) {
    board = { t: 0, next };
    SND.sfx('confirm');
    await wait(24);
    await Tasks.until(() => Input.pressed('a') || Input.pressed('b'));
    SND.sfx('cursor');
    board = null;
    await wait(4);
  }
  const enter = (e, [x, y], dir) => Field.walkTo(e, x, y, 1.5).then(() => { e.dir = dir; });
  const toRing = (a, b) => Promise.all([enter(a, LEFT, 'right'), enter(b, RIGHT, 'left')]);
  async function backToRow(...list) {
    await Promise.all(list.map(async e => { e.img = null; await Field.walkTo(e, e.row, e.mon ? AY + 46 : ROW, 1.6); e.dir = e.mon ? 'left' : 'up'; }));
  }
  async function clash(a, b, n = 3) { // échange de coups pour les combats racontés
    const ax = a.x, bx = b.x;
    for (let i = 0; i < n; i++) {
      const mx = (ax + bx) / 2;
      await Promise.all([Tasks.tween(a, { x: mx - 9 }, 7, 'in'), Tasks.tween(b, { x: mx + 9 }, 7, 'in')]);
      SND.sfx(i === n - 1 ? 'bighit' : 'hit'); Game.shake = i === n - 1 ? 8 : 3;
      Field.effects.push({ type: 'boom', x: mx, y: (a.y + b.y) / 2 - 16, r: 9, t: 16 });
      await Promise.all([Tasks.tween(a, { x: ax }, 9, 'out'), Tasks.tween(b, { x: bx }, 9, 'out')]);
      await wait(5);
    }
  }
  async function knockOut(e, dx, dy) { // éjecté hors de l'arène
    SND.sfx('bighit'); Game.shake = 10;
    await Promise.all([Tasks.tween(e, { x: e.x + dx, y: e.y + dy }, 24, 'out'), Field.jump(e, 20, 24)]);
    if (e.sprite) e.img = GFX.char(e.sprite)[dx < 0 ? 'ko' : 'koL'];
    SND.sfx('hit');
    await wait(20);
  }
  async function blink(e, x, dir) { // disparaît et réapparaît (images rémanentes)
    SND.sfx('swing');
    e.visible = false; await wait(10);
    e.x = x; e.dir = dir; e.visible = true;
  }
  const again = (who, line) => async () => { await say(who, line); return true; };

  // Un combat joué : seul le combattant choisi monte sur le ring.
  async function playMatch(id, foe, ent, o = {}) {
    const F = Field, m = Game.member(id), hero = C[id];
    const party = Game.party, reserve = Game.reserve;
    Game.party = [m]; Game.reserve = party.concat(reserve).filter(x => x !== m);
    m.hp = m.maxhp; m.ki = m.maxki;
    F.syncParty();
    const a = F.actors[0];
    a.x = hero.x; a.y = hero.y; a.dir = 'right'; a.hidden = false;
    hero.visible = false; ent.visible = false; F.hideParty = false;
    let res;
    for (;;) {
      res = await Battle.start([foe], { positions: [[ent.x, ent.y]], music: 'boss', canFlee: false, spar: true, hp: o.hp, intro: o.intro, afterMusic: 'tournoi' });
      F.camLock = true; F.camX = CAM[0]; F.camY = CAM[1];
      if (res === 'win' || !o.retry || !(await o.retry())) break;
    }
    hero.x = a.x; hero.y = a.y; hero.dir = 'right';
    F.hideParty = true; hero.visible = true; ent.visible = true;
    Game.party = party; Game.reserve = reserve; F.syncParty();
    m.hp = m.maxhp; m.ki = m.maxki;
    return res;
  }

  async function tournament() {
    const F = Field;
    if (!Game.member('krillin')) Game.addMember('krillin');
    await UI.fadeTo(1, 24);
    Game.healAll();
    R = {};
    for (const e of F.entities) if (ROAMERS.includes(e.id)) e.visible = false;
    C = spawnCast();
    F.hideParty = true; F.camLock = true; F.camX = CAM[0]; F.camY = CAM[1];
    SND.playMusic('tournoi');
    await UI.fadeTo(0, 24);
    await say('Présentateur', 'Mesdames et messieurs, bienvenue au 21e Championnat du monde des arts martiaux !');
    await say('Présentateur', 'Après des éliminatoires acharnées, voici les huit combattants de la phase finale !');
    await showBoard('Krilin contre Bactérian');
    await quarterFinals();
    await semiFinals();
    const winner = await final();
    await ceremony(winner);
  }

  async function quarterFinals() {
    const fl = Game.flags;
    // 1. Krilin contre Bactérian (joué)
    await say('Présentateur', 'Premier quart de finale ! Krilin, le jeune moine du temple d\'Orin, contre... le redoutable Bactérian !');
    await toRing(C.krillin, C.bacterian);
    await say('Bactérian', 'Hé hé hé... Je ne me suis jamais lavé de ma vie. Viens par là, petit !');
    await say('Krilin', 'Beurk ! Quelle odeur ! Je vais m\'évanouir avant même de le toucher !');
    await playMatch('krillin', 'bacterian', C.bacterian, {
      retry: again('Krilin', 'Attendez ! Je peux encore me battre !'),
      intro: async () => {
        if (fl.bactTip) return;
        fl.bactTip = true;
        await UI.say('Goku', 'Krilin ! Tu n\'as pas de nez ! Comment tu peux sentir quelque chose ?');
        await UI.say('Krilin', '... C\'est vrai, ça ! Je n\'ai pas de nez ! Allez, à l\'attaque !');
      },
    });
    await knockOut(C.bacterian, 56, 40);
    await say('Présentateur', 'Bactérian est hors de l\'arène ! Krilin est qualifié pour les demi-finales !');
    R.q1 = 0;
    await backToRow(C.krillin, C.bacterian);
    await showBoard('Jackie Chun contre Yamcha');
    // 2. Jackie Chun contre Yamcha (raconté)
    await say('Présentateur', 'Deuxième quart de finale ! Le mystérieux Jackie Chun contre Yamcha, le loup du désert !');
    await toRing(C.yamcha, C.jackie);
    await say('Yamcha', 'Je me suis entraîné toute l\'année ! Prépare-toi, papy !');
    await say('Jackie Chun', 'Hm hm. Montre-moi ça, jeune homme.');
    await say('Yamcha', 'Poing du Loup ! Aou-aou-aouuuh !');
    await clash(C.yamcha, C.jackie, 3);
    await say('Jackie Chun', 'Pas mal... mais beaucoup trop de fougue !');
    await blink(C.jackie, C.yamcha.x + 18, 'left');
    Field.emote(C.yamcha, '!');
    await wait(24);
    await knockOut(C.yamcha, -60, 30);
    await say('Présentateur', 'D\'une simple pichenette ! Yamcha est hors de l\'arène ! Jackie Chun est qualifié !');
    if (C.puar) await say('Puar', 'Yamcha ! Tu n\'as rien ?!');
    await say('Krilin', 'Ce vieux est incroyablement rapide... Et ce style... Ça me rappelle quelqu\'un.');
    R.q2 = 0;
    await backToRow(C.yamcha, C.jackie);
    await showBoard('Goku contre Giran');
    // 3. Goku contre Giran (joué)
    await say('Présentateur', 'Troisième quart de finale ! Le petit Goku contre Giran, le monstre ailé !');
    await toRing(C.goku, C.giran);
    await say('Giran', 'Grrr ! Un gamin ? Je vais t\'aplatir comme une crêpe !');
    await say('Goku', 'Ouah ! Un dragon qui parle ! Trop cool !');
    await playMatch('goku', 'giran', C.giran, { retry: again('Goku', 'Ouille... Encore ! Je veux recommencer !') });
    await knockOut(C.giran, 50, 30);
    await say('Présentateur', 'Giran est hors de l\'arène ! Goku est qualifié !');
    await say('Giran', 'Snif... Tu es vraiment fort, petit. Sans rancune ?');
    await say('Goku', 'Sans rancune ! Tu me prêteras ton chewing-gum ?');
    R.q3 = 0;
    await backToRow(C.goku, C.giran);
    await showBoard('Nam contre Ranfan');
    // 4. Nam contre Ranfan (raconté)
    await say('Présentateur', 'Dernier quart de finale ! Nam, le guerrier du désert, contre la charmante Ranfan !');
    await toRing(C.nam, C.ranfan);
    await say('Ranfan', 'Tu n\'oserais quand même pas frapper une demoiselle ?');
    await say('Nam', 'Pardonne-moi. Mon village compte sur moi.');
    SND.sfx('jump');
    await Promise.all([Field.jump(C.nam, 70, 44), Tasks.tween(C.nam, { x: RIGHT[0] - 16 }, 44)]);
    await say('Nam', 'Croix Céleste !');
    await knockOut(C.ranfan, 56, 36);
    await say('Présentateur', 'Un seul coup ! Ranfan est hors de l\'arène ! Nam est qualifié !');
    await say('Goku', 'Il a sauté super haut ! J\'ai hâte de me battre contre lui !');
    R.q4 = 0;
    await backToRow(C.nam, C.ranfan);
    await showBoard('Krilin contre Jackie Chun');
  }

  async function semiFinals() {
    const fl = Game.flags;
    // Krilin contre Jackie Chun (raconté)
    await say('Présentateur', 'Première demi-finale ! Krilin contre Jackie Chun !');
    await toRing(C.krillin, C.jackie);
    await say('Jackie Chun', 'Hm hm. Tu as bien progressé, mon garçon... Euh, je veux dire : jeune inconnu.');
    await say('Krilin', 'Hein ? On se connaît ? ... Peu importe ! Kamehameha !');
    SND.sfx('beam');
    Field.effects.push({ type: 'beam', x1: C.krillin.x + 10, y1: C.krillin.y - 16, x2: C.jackie.x + 40, y2: C.jackie.y - 16, life: 44, t: 44, w: 6 });
    await Field.jump(C.jackie, 34, 30);
    await wait(16);
    await say('Jackie Chun', 'Joli Kamehameha ! Mais encore un peu lent.');
    await blink(C.jackie, C.krillin.x + 18, 'left');
    await wait(16);
    await knockOut(C.krillin, -60, 30);
    await say('Présentateur', 'Krilin est hors de l\'arène ! Jackie Chun est en finale !');
    await say('Krilin', 'Je n\'ai même pas vu son coup... Goku, fais très attention à ce vieux.');
    R.s1 = 1;
    await backToRow(C.krillin, C.jackie);
    await showBoard('Goku contre Nam');
    // Goku contre Nam (joué), et la promesse
    await say('Présentateur', 'Deuxième demi-finale ! Goku contre Nam !');
    await toRing(C.goku, C.nam);
    await say('Nam', 'Goku... Dans mon village, il ne pleut plus depuis des mois. Avec le prix du tournoi, je pourrai acheter de l\'eau pour tout le monde.');
    await say('Nam', 'Alors je ne peux pas perdre. Pardonne-moi.');
    const c = await ask('Goku', 'Que répondre à Nam ?', ['« Je t\'aiderai, quoi qu\'il arrive ! »', '« Je ne retiendrai pas mes coups ! »']);
    fl.namPromise = c === 0;
    if (c === 0) {
      Game.addKarma(1);
      await say('Goku', 'Je t\'aiderai, quoi qu\'il arrive ! Mais d\'abord, on se bat à fond, d\'accord ?');
      await say('Nam', 'Tu es un garçon étrange... Merci. En garde !');
    } else {
      await say('Goku', 'Moi non plus, je ne veux pas perdre ! Je ne retiendrai pas mes coups !');
      await say('Nam', 'C\'est bien ainsi. En garde !');
    }
    await playMatch('goku', 'nam', C.nam, { retry: again('Goku', 'Il est fort... Encore une fois !') });
    await knockOut(C.nam, 56, 36);
    await say('Présentateur', 'Nam est hors de l\'arène ! Goku est en finale !');
    await say('Nam', 'Tu es plus fort que moi, Goku. Je l\'accepte.');
    R.s2 = 0;
    await backToRow(C.goku, C.nam);
    await showBoard('Goku contre Jackie Chun');
  }

  async function final() {
    const F = Field, M = Main.Moon;
    await say('Présentateur', 'Mesdames et messieurs... LA GRANDE FINALE ! Goku contre Jackie Chun !');
    await toRing(C.goku, C.jackie);
    await say('Bulma', 'Allez, Goku ! Montre-lui de quoi tu es capable !');
    await say('Jackie Chun', 'Hm hm... Voyons ce que tu as appris en un an, petit.');
    await say('Goku', 'Je vais tout donner ! ... Vous êtes sûr que vous ne connaissez pas Tortue Géniale ?');
    await say('Jackie Chun', 'Ab-absolument sûr ! En garde !');
    await playMatch('goku', 'jackie', C.jackie, { retry: again('Goku', 'Il est trop fort... Mais je n\'abandonne pas !') });
    // ----- la nuit tombe, la pleine lune se lève -----
    SND.stopMusic(true);
    await Tasks.tween(Sky, { night: 1 }, 90);
    await say(null, 'Le combat dure depuis des heures... La nuit est tombée sur l\'île Papaye.');
    await say('Jackie Chun', '(Ce garçon a une queue de singe... Et ce soir, c\'est la pleine lune ! Oh non...)');
    await say('Présentateur', 'Oh ! Regardez le ciel, mesdames et messieurs ! Quelle magnifique pleine lune !');
    Object.assign(M, { active: true, a: 0, red: 0, beat: 0, open: 1 });
    await Tasks.tween(M, { a: 1 }, 40);
    await say('Goku', 'Oh... La lune... Elle est toute ronde...');
    for (let i = 0; i < 4; i++) { // battements de cœur
      M.beat = 1; M.red = Math.min(1, M.red + 0.3); SND.beat('k', 1); Tasks.tween(M, { beat: 0 }, 14);
      await wait(14);
      M.beat = 0.7; SND.beat('k', 0.8); Tasks.tween(M, { beat: 0 }, 14);
      await wait(i < 3 ? 30 : 20);
    }
    await say('Krilin', 'Goku ? Goku, qu\'est-ce qui t\'arrive ?!');
    SND.sfx('roar'); Game.shake = 40;
    UI.fade.color = '#ffffff'; UI.fade.v = 1;
    M.active = false;
    C.goku.visible = false;
    const oz = F.addEntity({ kind: 'npc', id: 't_oozaru', mon: 'oozaru', x: LEFT[0] + 8, y: LEFT[1] + 16, dir: 'right', solid: false });
    F.effects.push({ type: 'smoke', x: oz.x, y: oz.y - 20, t: 50 });
    await UI.fadeTo(0, 30); UI.fade.color = '#000';
    SND.playMusic('boss');
    await say('Goku (singe géant)', 'GRAAAAAOOOOOH !');
    Game.shake = 30;
    for (const e of C.fans) F.walkTo(e, e.x + (e.x < AX ? -60 : 60), e.y + 90, 2.6).then(() => { e.gone = true; });
    await say('Présentateur', 'Un... un monstre géant ! Mettez-vous à l\'abri !');
    await say('Bulma', 'Oh non, pas encore ! Il a regardé la pleine lune !');
    if (C.oolong) await say('Oolong', 'On va tous se faire écraser ! Au secours !');
    await say('Krilin', 'C\'est... c\'est Goku ?! Vite, il faut lui couper la queue !');
    await say('Jackie Chun', 'Sa queue repoussera, et la lune reviendra chaque mois... Il n\'y a qu\'une seule solution.');
    await say('Jackie Chun', 'Pardonne-moi, lune !');
    SND.sfx('charge');
    F.effects.push({ type: 'charge', x: C.jackie.x, y: C.jackie.y - 16, life: 50, t: 50 });
    await wait(40);
    await moonShot();
    // ----- Goku redevient lui-même -----
    SND.sfx('flash');
    F.effects.push({ type: 'smoke', x: oz.x, y: oz.y - 20, t: 60 });
    oz.gone = true;
    C.goku.visible = true; C.goku.img = GFX.char(C.goku.sprite).ko;
    SND.playMusic('sad');
    await say('Krilin', 'Il... il a détruit la lune ?! Avec un Kamehameha ?! Mais seul Tortue Géniale en est capable...');
    await say('Bulma', 'Regardez ! Goku est redevenu normal !');
    await say('Présentateur', 'Mesdames et messieurs... La lune a disparu. Je... je n\'ai pas de mots.');
    await say('Présentateur', '... Mais le spectacle continue ! Après cette petite interruption, la finale reprend !');
    C.goku.img = null;
    await F.jump(C.goku, 6, 10);
    await say('Goku', 'Hein ? Je me suis endormi ? ... Pourquoi mon kimono est tout déchiré ?');
    await say('Krilin', 'Euh... c\'est une longue histoire ! Tiens, j\'avais un kimono de rechange.');
    await say('Jackie Chun', 'Hm hm... Alors, petit ? On termine ce combat ?');
    await say('Goku', 'Ouais ! Je suis un peu fatigué... mais je ne vais pas abandonner !');
    SND.playMusic('tournoi');
    const res = await playMatch('goku', 'jackie2', C.jackie, {
      hp: { party: 0.55, enemy: 0.4 },
      retry: async () => (await ask(null, 'Goku est au tapis... Recommencer la fin du combat ?', ['Recommencer', 'Accepter la défaite'])) === 0,
    });
    if (res !== 'win') {
      await knockOut(C.goku, -60, 30);
      await say('Présentateur', 'Goku est hors de l\'arène ! Le vainqueur est... JACKIE CHUN !');
      return 'jackie';
    }
    // ----- double K.O. : le premier debout gagne -----
    await say(null, 'Goku et Jackie Chun s\'élancent pour un dernier coup... Leurs poings se croisent...');
    SND.sfx('bighit'); Game.shake = 14;
    F.effects.push({ type: 'boom', x: AX, y: AY - 14, r: 16, t: 24 });
    C.goku.img = GFX.char(C.goku.sprite).ko; C.jackie.img = GFX.char('jackie').koL;
    await wait(30);
    await say('Présentateur', 'Double K.O. ! Les deux combattants sont au tapis ! Le premier qui se relève remporte le titre ! Je commence le compte !');
    const r = await MiniGames.run('relever', Game.member('goku'));
    const won = !!r && r.rank === 3;
    if (won) { C.goku.img = null; await say('Présentateur', '... huit, neuf... Goku est debout ! Jackie Chun reste au tapis !'); }
    else { C.jackie.img = null; await say('Présentateur', '... huit, neuf... Jackie Chun se relève le premier ! Goku ne peut plus bouger !'); }
    return won ? 'goku' : 'jackie';
  }

  async function ceremony(winner) {
    const F = Field, fl = Game.flags, champ = winner === 'goku';
    fl.tournoiDone = true; fl.champion = champ;
    Sky.night = Math.min(Sky.night, 0.6);
    SND.playMusic('victory');
    const w = champ ? C.goku : C.jackie, l = champ ? C.jackie : C.goku;
    w.img = null; l.img = null;
    await Promise.all([F.walkTo(w, AX, AY + 4, 1.2), F.walkTo(l, AX + (champ ? 44 : -44), AY + 8, 1.2)]);
    w.dir = 'down'; l.dir = 'down';
    await say('Présentateur', 'Mesdames et messieurs, le vainqueur du 21e Championnat du monde des arts martiaux est...');
    await say('Présentateur', champ ? 'GOKU ! Le plus jeune champion de toute l\'histoire du tournoi !' : 'JACKIE CHUN ! Mais quelle finale ! Bravo au petit Goku !');
    R.f = champ ? 1 : 0;
    for (const e of [C.bulma, C.krillin, C.oolong, C.yamcha]) if (e) F.jump(e, 8, 14);
    SND.sfx('levelup');
    await showBoard(null);
    Game.setQuest('tournoi', 'done');
    SND.playMusic('tournoi');
    if (champ) {
      await say('Goku', 'J\'ai gagné ?! YOUPIII !');
      await getItem('ceinture_champion');
      if (fl.namPromise) {
        await say('Goku', 'Nam ! Comme promis, la bourse du champion est pour ton village !');
        fl.namHelped = true; Game.addKarma(1);
      } else {
        const c = await ask('Goku', 'Le champion reçoit une bourse de 5 000 Zénis. Que faire ?', ['Donner la bourse à Nam', 'Garder la bourse']);
        if (c === 0) { await say('Goku', 'Nam ! Prends l\'argent pour ton village ! Moi, tant que j\'ai à manger, ça me va !'); fl.namHelped = true; Game.addKarma(1); }
        else { Game.zeni += 5000; SND.sfx('coin'); await say(null, 'Goku reçoit 5 000 Zénis !'); await say('Nam', 'Félicitations, Goku. Tu le mérites.'); }
      }
      if (fl.namHelped) await say('Nam', 'Goku... Je ne sais pas comment te remercier. Mon village est sauvé !');
    } else {
      await say('Goku', 'Zut, j\'ai perdu ! ... Mais c\'était trop génial ! La prochaine fois, c\'est moi qui gagnerai !');
      await getItem('bandeau_argent');
      await say('Jackie Chun', 'Nam... Ce prix, je n\'en ai pas besoin. Prends-le, pour ton village.');
      await say('Nam', 'Vous... vous feriez ça pour moi ? Merci, maître Jackie !');
      fl.namHelped = true;
    }
    await say('Jackie Chun', 'Hm hm... Au revoir, jeunes gens ! Continuez à vous entraîner !');
    SND.sfx('swing');
    F.effects.push({ type: 'smoke', x: C.jackie.x, y: C.jackie.y - 14, t: 30 });
    C.jackie.gone = true;
    await wait(30);
    await roshiReveal();
    await afterTournament();
  }

  async function roshiReveal() {
    const F = Field, fl = Game.flags;
    SND.playMusic('camp');
    const r = F.addEntity({ kind: 'npc', id: 't_roshi', sprite: 'roshi', x: AX, y: ROW + 60, dir: 'up', solid: false });
    await F.walkTo(r, AX, ROW, 1.2);
    r.dir = 'up';
    await say('Tortue Géniale', 'Ho ho ho ! Me voilà, me voilà ! Désolé, j\'avais une affaire très urgente... Alors, ce tournoi ?');
    await say('Krilin', 'Maître ! Vous avez tout raté ! Il y avait un vieux, Jackie Chun, il était incroyable ! Il a même détruit la lune !');
    await say('Tortue Géniale', 'La lune ? Ho ho... Elle a dû partir en vacances.');
    const c = await ask('Goku', 'Hmm...', ['« Jackie Chun, c\'était vous ! »', '« Vous avez raté un super combat ! »']);
    if (c === 0) {
      fl.jackieRevealed = true;
      await say('Goku', 'Jackie Chun, c\'était vous, hein ? Vous avez la même odeur... et le même Kamehameha !');
      await say('Tortue Géniale', '... Ho ho ho ! Bien vu, petit malin.');
      await say('Krilin', 'QUOI ?! C\'ÉTAIT VOUS ?!');
      await say('Tortue Géniale', 'Un maître doit rappeler à ses élèves qu\'il y a toujours plus fort qu\'eux. Sinon, ils deviennent orgueilleux et cessent de progresser.');
      await say('Tortue Géniale', 'Mais je suis fier de vous. Très, très fier.');
      if (fl.champion) await say('Tortue Géniale', 'Et toi, Goku... Tu as battu ton propre maître. Je n\'ai plus grand-chose à t\'apprendre !');
    } else {
      await say('Goku', 'Vous avez raté un super combat ! Il y avait un monsieur qui sentait exactement comme vous !');
      await say('Tortue Géniale', 'Ho ho... Quelle coïncidence !');
      await say(null, '(Tortue Géniale range discrètement une paire de lunettes noires dans sa poche...)');
    }
    await say('Tortue Géniale', 'Allez ! Pour fêter ça, je vous invite tous au restaurant !');
    await say('Goku', 'Ouaiiis ! À manger !');
  }

  function buildSlides() {
    const fl = Game.flags, out = [];
    out.push({ title: fl.champion ? 'Le champion' : 'Le finaliste', chars: ['goku'], text: fl.champion ? 'Goku est devenu le plus jeune champion de l\'histoire du tournoi. Ce qu\'il préfère dans sa ceinture dorée ? La boucle, parce qu\'elle brille.' : 'Goku a terminé deuxième, et il n\'est pas déçu du tout : « Il existe des gens encore plus forts que moi ! C\'est génial ! »' });
    out.push({ title: 'Krilin', chars: ['krillin'], text: 'Krilin a découvert qu\'on n\'a pas besoin de nez pour gagner un combat. Au temple d\'Orin, plus personne ne se moque de lui.' });
    out.push({ title: 'Nam', chars: ['nam'], text: fl.namHelped ? 'Grâce au prix du tournoi, le village de Nam a de l\'eau pour des années. Les enfants ont baptisé le nouveau puits « le puits de ' + (fl.champion ? 'Goku' : 'Jackie') + ' ».' : 'Nam est rentré dans son village les mains vides, mais la tête haute. Il reviendra au prochain tournoi.' });
    out.push({ title: 'Giran', mon: 'giran', text: 'Giran est rentré au pays des monstres ailés. Il mâche toujours son chewing-gum... et parle de Goku à tout le monde.' });
    out.push({ title: 'Yamcha', chars: ['yamcha'], mon: Game.member('yamcha') ? 'puar' : null, text: 'Yamcha s\'entraîne deux fois plus dur. « Au prochain tournoi, plus personne ne me sortira d\'une pichenette ! »' });
    out.push({ title: 'Jackie Chun', chars: ['jackie', 'roshi'], text: fl.jackieRevealed ? 'Le secret de Jackie Chun a été percé. Tortue Géniale a fait jurer à ses élèves de n\'en parler à personne... surtout pas à Bulma.' : 'Personne ne sait d\'où venait le mystérieux Jackie Chun. Tortue Géniale, lui, sourit chaque fois qu\'on en parle.' });
    out.push({ title: 'La lune', text: 'La lune a disparu du ciel. Les savants du monde entier n\'y comprennent rien. Au moins, Goku ne se transformera plus jamais en singe géant...' });
    out.push({ title: 'Fin du chapitre 8', chars: ['goku'], cloud: true, text: 'Dans trois ans aura lieu le 22e Championnat du monde... D\'ici là, l\'aventure continue !', foot: 'Merci d\'avoir joué !' });
    return out;
  }
  async function savePrompt() {
    const r = await ask(null, 'Sauvegarder la partie ?', ['Oui', 'Non'], { cancel: 1 });
    if (r !== 0) return;
    Game.healAll();
    const ok = Game.save();
    SND.sfx('save');
    await say(null, ok ? 'Partie sauvegardée !' : 'Sauvegarde impossible sur ce navigateur.');
  }
  async function afterTournament() {
    await UI.fadeTo(1, 40);
    Sky.night = 0; board = null;
    await Main.epilogue(buildSlides(), { prefix: 'Après le tournoi — ', music: 'camp' });
    Game.mode = 'field';
    UI.fade.v = 1;
    Field.load('papaye', 16, 17, 'down');
    await UI.fadeTo(0, 30);
    await say(null, 'Fin du chapitre 8 ! Tu peux continuer à explorer le monde, t\'entraîner chez Tortue Géniale ou inventer de nouvelles techniques.');
    await savePrompt();
  }

  // ---------------- « Un an plus tard » (après les crédits) ----------------
  function yearOfTraining() {
    for (const m of Game.allMembers()) {
      const pupil = m.id === 'goku' || m.id === 'krillin';
      for (let i = 0; i < (pupil ? 2 : 1); i++) { m.xp = 0; levelUp(m); }
      if (pupil) applyBonus(m, { atk: 3, def: 2, spd: 2, hp: 30 });
    }
    const g = Game.member('goku');
    if (g && !styleOf(g).tail) { g.style = Object.assign(styleOf(g), { tail: 1 }); Game.flags.tailBack = true; }
    Game.healAll();
  }
  async function begin() {
    Field.locks = 0; Field.battle = false;
    reset();
    yearOfTraining();
    Game.flags.ch8 = true;
    Game.mode = 'field';
    UI.fade.v = 1;
    Field.load('plage', 29, 17, 'up');
    await Field.run(async () => {
      const spots = [[29, 17], [31, 17], [27, 17]];
      Field.actors.forEach((a, i) => { const s = spots[i] || spots[0]; a.x = s[0] * TS + 8; a.y = s[1] * TS + 14; a.dir = 'up'; });
      await UI.chapter('Un an plus tard...', 'Sur l\'île de Tortue Géniale');
      await UI.chapter('Chapitre 8', 'Le Championnat du monde');
      SND.playMusic('training');
      await UI.fadeTo(0, 40);
      await say('Tortue Géniale', 'Ho ho ho ! Une année entière d\'entraînement... Goku, Krilin, vous avez bien travaillé.');
      await say(null, 'Pendant un an, Goku et Krilin ont livré le lait, labouré les champs à mains nues et nagé avec des requins, une carapace de vingt kilos sur le dos...');
      await say('Goku', 'Et maintenant, je cours aussi vite qu\'un guépard ! Même avec la carapace !');
      await say('Tortue Géniale', 'Il est temps de voir ce que vous valez. Le 21e Championnat du monde des arts martiaux commence demain, sur l\'île Papaye !');
      await say('Krilin', 'Le Championnat du monde ?! Là où se battent les plus grands maîtres ?');
      await say('Goku', 'Des gens super forts ? Génial ! On y va tout de suite !');
      await say('Tortue Géniale', 'Un passeur vous attend sur la plage, à l\'ouest. Moi, euh... j\'ai une affaire urgente. Je vous rejoindrai là-bas. Ho ho.');
      await say('Bulma', 'Une affaire urgente, le jour du tournoi ? Hmm... C\'est louche.');
      if (Game.flags.tailBack) {
        await say('Goku', 'Hé ! Regardez ! Ma queue a repoussé !');
        await say('Bulma', '(Oh non...) C-c\'est super, Goku ! Mais promets-moi de ne JAMAIS regarder la pleine lune, d\'accord ?');
        await say('Goku', 'Promis ! ... Pourquoi tout le monde me dit toujours ça ?');
      }
      if (Game.member('yamcha')) {
        await say('Yamcha', 'Moi aussi, je participe ! Puar et moi, on s\'est entraînés dur toute l\'année.');
        if (!Game.member('puar')) { await say('Puar', 'Et cette fois, je me bats avec vous ! Je vole, alors on ne me touche pas facilement !'); Game.addMember('puar'); SND.sfx('levelup'); await say(null, 'Puar rejoint l\'équipe !'); }
      }
      else await say(null, 'On raconte que Yamcha, le loup du désert, s\'est lui aussi inscrit au tournoi...');
      SND.sfx('levelup');
      await say(null, 'Un an d\'entraînement : Goku et Krilin gagnent deux niveaux et deviennent plus robustes. Leurs amis progressent aussi !');
      Game.setQuest('tournoi', 'depart');
      await savePrompt();
    });
  }

  // ---------------- La lune vole en éclats ----------------
  const Sky = { night: 0, on: false, a: 0, beam: 0, flash: 0, boom: 0 };
  let stars = null, frags = null;
  async function moonShot() {
    Object.assign(Sky, { on: true, a: 0, beam: 0, flash: 0, boom: 0 });
    await Tasks.tween(Sky, { a: 1 }, 30);
    await say('Jackie Chun', 'Ka... mé... ha... mé...');
    SND.sfx('charge');
    await wait(30);
    await say('Jackie Chun', 'HAAAAAAAAAAAAAA !');
    SND.sfx('beam');
    await Tasks.tween(Sky, { beam: 1 }, 34, 'in');
    SND.sfx('blast'); SND.sfx('thunder'); Game.shake = 30;
    Sky.boom = Game.frame; Sky.flash = 1;
    Tasks.tween(Sky, { flash: 0 }, 50);
    await wait(24);
    Sky.beam = 0;
    await wait(90);
    await say(null, 'Dans un éclair aveuglant... la lune vole en éclats.');
    await Tasks.tween(Sky, { a: 0 }, 30);
    Sky.on = false;
  }
  function drawSkyScene() {
    const t = Game.frame, mx = 128, my = 54, by = SH - 100;
    if (!stars) {
      stars = Array.from({ length: 60 }, (_, i) => [GFX.hash(i, 21) % SW, GFX.hash(i, 22) % 150, GFX.hash(i, 23) % 3]);
      frags = Array.from({ length: 16 }, (_, i) => {
        const a = i / 16 * Math.PI * 2 + (GFX.hash(i, 31) % 100) / 300, s = 0.3 + (GFX.hash(i, 32) % 100) / 90;
        return { vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2 + GFX.hash(i, 33) % 5 };
      });
    }
    ctx.globalAlpha = Sky.a;
    const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#02030e'); g.addColorStop(1, '#1c1e4c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const [x, y, s] of stars) { if ((Math.floor(t / 20) + x) % 9 === 0) continue; ctx.fillStyle = s ? '#c0c8ff' : '#ffffff'; ctx.fillRect(x, y, 1, 1); }
    if (!Sky.boom) {
      ctx.fillStyle = 'rgba(255,250,210,0.15)'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(mx, my, 24, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8dcb0';
      for (const [dx, dy, r] of [[-8, -6, 5], [7, 4, 7], [-4, 11, 3], [11, -9, 3]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, 7); ctx.fill(); }
    } else {
      const k = t - Sky.boom;
      const core = Math.max(0, 1 - k / 30); // le cœur de l'explosion rétrécit
      if (core > 0) {
        ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(mx, my, 22 * core, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 13 * core, 0, 7); ctx.fill();
      }
      const ring = Math.max(0, 1 - k / 60);
      if (ring > 0) { ctx.strokeStyle = 'rgba(160,210,255,' + ring + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, 10 + k * 2.2, 0, 7); ctx.stroke(); }
      for (const f of frags) { // éclats de lune : petits rochers anguleux
        const px = Math.round(mx + f.vx * k), py = Math.round(my + f.vy * k + 0.002 * k * k), r = f.r;
        const w = r + 1, h = Math.max(2, r - 1);
        ctx.fillStyle = K; ctx.fillRect(px - w - 1, py - h, w * 2 + 2, h * 2); ctx.fillRect(px - w + 1, py - h - 2, w * 2 - 2, h * 2 + 3);
        ctx.fillStyle = '#d8cca0'; ctx.fillRect(px - w, py - h, w * 2, h * 2); ctx.fillRect(px - w + 2, py - h - 1, w * 2 - 4, 1);
        ctx.fillStyle = '#fff4cc'; ctx.fillRect(px - w + 2, py - h - 1, w * 2 - 4, 1); ctx.fillRect(px - w, py - h, 1, h);
        ctx.fillStyle = '#a89c78'; ctx.fillRect(px - w + 1, py + h - 1, w * 2 - 1, 1);
        if (r > 3) { ctx.fillStyle = '#b8ac84'; ctx.fillRect(px - 1, py - 1, 2, 2); }
      }
    }
    // l'arène, et Jackie Chun de dos qui lance son Kamehameha
    ctx.fillStyle = K; ctx.fillRect(24, SH - 34, 208, 34);
    ctx.fillStyle = '#6c6a7e'; ctx.fillRect(25, SH - 33, 206, 33);
    ctx.fillStyle = '#8a889c'; ctx.fillRect(25, SH - 33, 206, 2);
    ctx.drawImage(GFX.char('jackie').up[0], mx - 24, SH - 98, 48, 64);
    if (Sky.beam > 0) {
      const top = by - (by - my) * Sky.beam, w = 8 + Math.sin(t * 0.8) * 1.5;
      ctx.fillStyle = '#3070f8'; ctx.fillRect(mx - w, top, w * 2, by - top);
      ctx.fillStyle = '#80c8ff'; ctx.fillRect(mx - w * 0.6, top, w * 1.2, by - top);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - w * 0.25, top, w * 0.5, by - top);
      for (const [y, r] of [[top, 1.6], [by, 1.3]]) { ctx.fillStyle = '#80c8ff'; ctx.beginPath(); ctx.arc(mx, y, w * r, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, y, w * r * 0.55, 0, 7); ctx.fill(); }
    }
    if (Sky.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Sky.flash + ')'; ctx.fillRect(0, 0, SW, SH); }
    ctx.globalAlpha = 1;
  }

  // ---------------- Tableau des combats ----------------
  function drawBoard() {
    board.t++;
    ctx.fillStyle = 'rgba(0,0,24,0.6)'; ctx.fillRect(0, 0, SW, SH);
    UI.win(8, 20, 240, 166);
    FONT.drawCentered(ctx, '21e Championnat du monde', 128, 27, UI.YEL);
    const ON = '#f8d050', OFF = '#5a6088';
    const seg = (x1, y1, x2, y2, on) => { ctx.fillStyle = on ? ON : OFF; ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1) + 1, Math.abs(y2 - y1) + 1); };
    const ys = [52, 70, 104, 122], semis = [R.s1, R.s2];
    for (let side = 0; side < 2; side++) {
      const X = x => side ? 256 - x : x;
      const mids = [];
      for (let p = 0; p < 2; p++) {
        const qi = side * 2 + p, res = R['q' + (qi + 1)];
        const a = ys[p * 2] + 4, b = ys[p * 2 + 1] + 4, mid = (a + b) / 2;
        mids.push(mid);
        NAMES[qi].forEach((n, k) => {
          const y = ys[p * 2 + k], lost = res !== undefined && res !== k;
          const col = lost ? '#6a7090' : '#ffffff';
          if (side) FONT.drawRight(ctx, n, 240, y, col); else FONT.draw(ctx, n, 16, y, col);
        });
        seg(X(74), a, X(84), a, res === 0); seg(X(74), b, X(84), b, res === 1);
        seg(X(84), a, X(84), mid, res === 0); seg(X(84), mid, X(84), b, res === 1);
        seg(X(84), mid, X(98), mid, res !== undefined);
      }
      const s = semis[side], M = (mids[0] + mids[1]) / 2;
      seg(X(98), mids[0], X(98), M, s === 0); seg(X(98), M, X(98), mids[1], s === 1);
      seg(X(98), M, X(116), M, s !== undefined && R.f === side);
    }
    // la coupe
    const cx = 128, cy = 86;
    ctx.fillStyle = K; ctx.fillRect(cx - 9, cy - 1, 19, 12); ctx.fillRect(cx - 3, cy + 10, 7, 5); ctx.fillRect(cx - 6, cy + 14, 13, 4);
    ctx.fillStyle = '#f0c030'; ctx.fillRect(cx - 8, cy, 17, 10); ctx.fillRect(cx - 2, cy + 10, 5, 5); ctx.fillRect(cx - 5, cy + 15, 11, 2);
    ctx.fillStyle = '#fff080'; ctx.fillRect(cx - 6, cy + 1, 3, 7);
    ctx.fillStyle = '#b08010'; ctx.fillRect(cx + 5, cy + 1, 3, 8);
    if (R.f !== undefined) FONT.drawCentered(ctx, 'Champion : ' + (R.f ? 'Goku' : 'Jackie Chun'), 128, 148, ON);
    else if (board.next) FONT.drawCentered(ctx, 'Prochain combat : ' + board.next, 128, 148, '#80d8f8');
    if (board.t > 24 && Math.floor(board.t / 20) % 2) FONT.drawCentered(ctx, 'Z / A : continuer', 128, 166, UI.GRAY);
  }

  function draw() {
    if (Sky.night > 0) { ctx.fillStyle = 'rgba(12,12,60,' + (0.5 * Sky.night) + ')'; ctx.fillRect(0, 0, SW, SH); }
    if (Sky.on) drawSkyScene();
    if (board) drawBoard();
  }
  function reset() { Sky.night = 0; Sky.on = false; Sky.beam = 0; Sky.flash = 0; board = null; }

  // ---------------- Mini-jeu : « Debout, Goku ! » ----------------
  const bigCache = {};
  function bigText(str, cx, y, scale, col) {
    let c = bigCache[str + col];
    if (!c) {
      c = GFX.mk(FONT.measure(str) + 4, 15);
      const x = c.getContext('2d');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [0, 2], [1, 2]]) FONT.draw(x, str, 2 + dx, 1 + dy, K, null);
      FONT.draw(x, str, 2, 1, col, null);
      bigCache[str + col] = c;
    }
    ctx.drawImage(c, Math.round(cx - c.width * scale / 2), Math.round(y), c.width * scale, c.height * scale);
  }
  const relever = {
    name: 'Debout, Goku !', who: 'Combattant', noCancel: true,
    help: 'Goku et Jackie Chun sont tous les deux au tapis ! Martèle Z / A le plus vite possible : Goku doit se relever avant Jackie... et avant la fin du compte !',
    init(S) { Object.assign(S, { g: 0, j: 0, n: 0, ct: 0, win: null, wt: 0, tap: 0 }); },
    update(S, t) {
      const G = MiniGames.state();
      if (S.win) { if (++S.wt > 100) G.done = true; return; }
      S.g = Math.max(0, S.g - 0.1); // la volonté retombe peu à peu...
      if (Input.pressed('a')) { S.g = Math.min(100, S.g + 5); S.tap = 6; SND.sfx('cursor'); } // ... et chaque appui la relance
      if (S.tap > 0) S.tap--;
      S.j = Math.min(100, S.j + 0.2 + Math.sin(t / 23) * 0.08);
      if (++S.ct >= 50) { S.ct = 0; S.n = Math.min(10, S.n + 1); SND.note(84, 0.15, 'tri', 0.3); }
      if (S.g >= 100) { S.win = 'goku'; SND.sfx('levelup'); } else if (S.j >= 100) { S.win = 'jackie'; SND.sfx('cancel'); }
      G.score = Math.round(S.g);
    },
    rank() { return MiniGames.state().s.win === 'goku' ? 3 : 0; },
    draw(S, t) {
      const G = MiniGames.state();
      const g = ctx.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#04061a'); g.addColorStop(1, '#22245a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, SW, 120);
      for (let i = 0; i < 40; i++) { if ((i + Math.floor(t / 25)) % 9 === 0) continue; ctx.fillStyle = i % 3 ? '#c0c8ff' : '#ffffff'; ctx.fillRect(GFX.hash(i, 41) % SW, GFX.hash(i, 42) % 100, 1, 1); }
      // la foule
      for (let i = 0; i < 26; i++) { const x = i * 10 + (i % 2) * 4; ctx.fillStyle = i % 3 ? '#14163a' : '#1c1e48'; ctx.beginPath(); ctx.arc(x, 116 - (GFX.hash(i, 43) % 6) - (S.win && (t + i * 3) % 20 < 10 ? 3 : 0), 7, 0, 7); ctx.fill(); }
      // l'arène
      ctx.fillStyle = '#8a8676'; ctx.fillRect(0, 120, SW, SH - 120);
      for (let r = 0; r < 6; r++) {
        const y = 120 + r * 18, h = 17;
        for (let c = 0; c < 10; c++) { ctx.fillStyle = (r + c) % 2 ? '#c8c4b4' : '#bcb8a8'; ctx.fillRect(c * 26 + (r % 2) * 13 - 13, y + 1, 25, h - 1); }
      }
      const gs = GFX.char(G.key), js = GFX.char('jackie');
      const stand = (img, x, z) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 24, 190, 16, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(img, x, 126 - z, 48, 64); };
      const lie = (img, x) => { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 32, 186, 26, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(img, x, 140, 64, 48); };
      const hop = S.win ? Math.abs(Math.sin(S.wt * 0.15)) * 10 : 0;
      if (S.win === 'goku') stand(gs.down[0], 36, hop); else lie(gs.ko, 26 + (S.tap ? 1 : 0));
      if (S.win === 'jackie') stand(js.down[0], 172, hop); else lie(js.koL, 166);
      // le compte
      bigText(S.n ? String(S.n) : '...', 128, 18, 3, S.n >= 8 ? '#f87070' : '#ffffff');
      FONT.drawCentered(ctx, 'Le compte de l\'arbitre', 128, 8, '#c0c8e8');
      // jauges
      const bar = (x, label, v, col) => { FONT.draw(ctx, label, x, 196, '#ffffff'); ctx.fillStyle = K; ctx.fillRect(x, 208, 102, 8); ctx.fillStyle = '#2a2e58'; ctx.fillRect(x + 1, 209, 100, 6); ctx.fillStyle = col; ctx.fillRect(x + 1, 209, Math.round(v), 6); };
      bar(14, 'Goku', S.g, '#f8a020'); bar(140, 'Jackie Chun', S.j, '#80c8a0');
      if (!S.win && Math.floor(t / 10) % 2) FONT.drawCentered(ctx, 'Martèle Z / A !', 128, 74, UI.YEL);
    },
    drawResult(G) {
      ctx.fillStyle = 'rgba(0,0,20,' + Math.min(0.6, G.rt / 40) + ')'; ctx.fillRect(0, 0, SW, SH);
      UI.win(40, 64, 176, 84);
      const won = G.rank === 3;
      bigText(won ? 'Goku est debout !' : 'Jackie est debout...', 128, 76, 1, won ? '#f8e070' : '#a0a8c8');
      FONT.drawCentered(ctx, won ? 'Il se relève avant la fin du compte !' : 'Goku n\'arrive plus à se relever.', 128, 104, '#ffffff');
      if (G.rt > 45 && Math.floor(G.rt / 20) % 2) FONT.drawCentered(ctx, 'Z / A : continuer', 128, 128, '#f8e070');
    },
  };
  if (typeof MiniGames !== 'undefined') MiniGames.GAMES.relever = relever;

  return { begin, draw, reset, sail, Sky, state: () => ({ R, board, C }) };
})();
