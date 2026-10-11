// Cartes, PNJ, événements et scénario.
const say = (who, txt, opts) => UI.say(who, txt, opts);
const L = () => Field.leader();

async function getItem(id, n = 1) {
  Game.addItem(id, n);
  SND.sfx('item');
  await say(null, 'Obtenu : ' + ITEMS[id].name + (n > 1 ? ' x' + n : '') + ' !');
}
async function getBall(n) {
  Game.giveBall(n);
  SND.sfx('ball');
  await say(null, 'Boule de Cristal à ' + n + ' étoile' + (n > 1 ? 's' : '') + ' obtenue ! (' + Game.balls.length + '/7)');
}
async function joinParty(id, ent) {
  Game.addMember(id);
  Field.syncParty();
  const a = Field.actors.find(x => x.id === id);
  if (ent) { a.x = ent.x; a.y = ent.y; ent.gone = true; }
  SND.sfx('levelup');
  await say(null, MEMBERS[id].name + ' rejoint l\'équipe !');
  await Field.walkTo(a, L().x, L().y, 1.4);
  Field.history = [];
}
async function pushBack(dx, dy) {
  const l = L();
  await Field.walkTo(l, l.x + dx, l.y + dy, 1.3);
}

// ----- Fabriques d'entités -----
function chest(id, tx, ty, item, n = 1) {
  return {
    kind: 'chest', id, tx, ty, talk: async e => {
      if (e.opened) { await say(null, 'Le coffre est vide.'); return; }
      e.opened = true; Game.flags['chest_' + id] = true;
      SND.sfx('door');
      await getItem(item, n);
    },
  };
}
const sign = (tx, ty, text) => ({ kind: 'sign', tx, ty, talk: () => say(null, text) });
const warp = (tx, ty, tw, th, to, dx, dy, dir) => ({ kind: 'warp', tx, ty, tw, th, to, dx, dy, dir });
const savePt = (tx, ty) => ({ kind: 'save', tx, ty });
function foe(tx, ty, group) {
  const d = ENEMIES[group[0]];
  return { kind: 'enemy', tx, ty, group, mon: d.spr, char: d.char };
}
const npc = (id, sprite, tx, ty, talk, extra = {}) => Object.assign({ kind: 'npc', id, sprite, tx, ty, talk }, extra);

// =====================================================================
const MAPS = {};

// ---------------- Maison de Goku ----------------
MAPS.maison = {
  name: 'Maison de Goku', music: 'title', ground: 'w',
  rows: [
    'WWWWWWWWWW',
    'WWWWWWWWWW',
    'W#www#ww#W',
    'W#wwwwwwwW',
    'Wwwwwww##W',
    'WwwwwwwwwW',
    'WwwwwwwwwW',
    'WWWWwwWWWW',
  ],
  objects: [
    { type: 'prop', img: 'bed', x: 16, y: 34 },
    { type: 'prop', img: 'shrine', x: 80, y: 26 },
    { type: 'prop', img: 'cushion', x: 80, y: 52, sortY: 40 },
    { type: 'prop', img: 'pot', x: 130, y: 34 },
    { type: 'prop', img: 'table', x: 116, y: 60 },
  ],
  entities: () => [
    { kind: 'ball', id: 'ball4', stars: 4, tx: 5, ty: 3, box: [-6, -10, 12, 10], cond: () => !Game.hasBall(4), talk: async e => {
      e.gone = true;
      await getBall(4);
      await say('Goku', 'Grand-père Gohan, je t\'emmène avec moi !');
    } },
    npc('bulma_intro', 'bulma', 4.5, 7, null, { cond: () => !Game.flags.intro, visible: false }),
    { kind: 'npc', id: 'shrineTalk', tx: 5, ty: 2, img: null, visible: false, solid: false, talk: () => say(null, 'Un portrait de Grand-père Gohan. Il a l\'air sévère mais gentil.') },
    { kind: 'trigger', tx: 4, ty: 6, tw: 2, th: 1, cond: () => Game.flags.intro && !Game.hasBall(4), run: async () => {
      await say('Bulma', 'Goku ! Tu n\'oublies pas la boule de ton grand-père ?');
      await pushBack(0, -8);
    } },
    warp(4, 7, 2, 1, 'paozu', 6.5, 7, 'down'),
  ],
  async onEnter() {
    if (Game.flags.intro) return;
    await Field.run(async () => {
      const b = Field.ent('bulma_intro');
      const g = L();
      g.dir = 'up';
      await UI.fadeTo(0, 30);
      await say(null, 'Mont Paozou, au cœur des montagnes. Un petit garçon à queue de singe vit seul dans la maison de son grand-père...');
      await say('Goku', 'Bonjour Grand-père Gohan ! Aujourd\'hui je vais encore pêcher un énorme poisson !');
      SND.sfx('door');
      await wait(20);
      Field.emote(g, '!');
      g.dir = 'down';
      await wait(30);
      b.visible = true;
      await Field.walkTo(b, b.x, b.y - 32, 1);
      await say('Bulma', 'Coucou ! Je m\'appelle Bulma. Mon Dragon Radar indique qu\'une Boule de Cristal se trouve ici !');
      await say('Goku', 'Une boule de cristal ? Tu parles du souvenir de Grand-père ? La boule à quatre étoiles, là, sur le coussin.');
      await say('Bulma', 'C\'est ça ! Il en existe sept. Celui qui les réunit fait apparaître le dragon sacré Shenron... qui exauce un vœu, n\'importe lequel !');
      await say('Goku', 'Un dragon ?! Trop fort ! Mais je ne donnerai pas la boule de Grand-père.');
      await say('Bulma', 'Alors viens avec moi ! On cherche les autres ensemble. Tu gardes la tienne, et moi... j\'ai mon vœu. Marché conclu ?');
      await say('Goku', 'Marché conclu ! En route pour l\'aventure !');
      Game.flags.intro = true;
      await joinParty('bulma', b);
      await say(null, 'Approche-toi de la boule et appuie sur Z (ou Entrée / bouton A) pour la prendre. X ou Échap ouvre le menu.');
    });
  },
};

// ---------------- Mont Paozou ----------------
MAPS.paozu = {
  name: 'Mont Paozou', music: 'field', ground: '.',
  rows: [
    'FFFFFFFFFFFFFFFFFFFFFFFF~~FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFF~~FFFFFFFFFFFFFF',
    'FFF..T...,....T...FFFFF.~~..T....,..FFFF',
    'FF....,...........T.....~~......""..T.FF',
    'FF...####.......,....r..~~..T.......""FF',
    'FF.T.####...........T...~~.....T......FF',
    'FF...#..#.......,.......~~..""....T...FF',
    'FF....pp.............T..~~...T....,...FF',
    'FF.,..pp......,.........~~..........T.FF',
    'FFT...pp....T.......""..~~..r.........FF',
    'FF....pp..........""""..~~.....,...T..FF',
    'FF..T.pp.....,..........~~.T.....""...FF',
    'FF....pp................~~....T.......FF',
    'FF....ppppppppppppppppppbbpppppppppppppp',
    'FF....ppppppppppppppppppbbpppppppppppppp',
    'FF..T......,....T.......~~......T.....FF',
    'FF.......""".........r..~~..T.....,...FF',
    'FF.T.....""""...T.......~~.......""...FF',
    'FF......................~~...T....""..FF',
    'FF..T....,......T.......~~............FF',
    'FFTT......r.............~~.....T......FF',
    'FF.T......""".....,.....~~..T.....T...FF',
    'FF..T.....""""..........~~............FF',
    'FFT.....T........T......~~..""....T...FF',
    'FF....,.........r.......~~..""""......FF',
    'FF..T...........T....T..~~......T..T..FF',
    'FF......................~~.T..........FF',
    'FFFF.T....T........T....~~....T.....FFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFF~~FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFF~~FFFFFFFFFFFFFF',
  ],
  objects: [{ type: 'building', img: 'hut', x: 80, y: 52 }],
  entities: () => [
    warp(6, 6, 2, 1, 'maison', 4.5, 6, 'up'),
    warp(39, 13, 1, 2, 'foret', 1, 13.5, 'right'),
    sign(9, 7, 'Mont Paozou — Maison de Son Goku. « Défense de chasser les dinosaures du grand-père ! »'),
    savePt(11, 8),
    chest('paozu1', 3, 22, 'tonique', 2),
    chest('paozu2', 36, 4, 'boisson_ki'),
    foe(14, 10, ['loup']),
    foe(13, 19, ['loup', 'loup']),
    foe(31, 9, ['dino']),
    foe(33, 19, ['ptero', 'loup']),
    foe(10, 25, ['dino', 'loup']),
    foe(30, 24, ['ptero', 'ptero']),
    foe(20, 7, ['loup', 'dino']),
  ],
  async onEnter() {
    if (Game.flags.paozuIntro) return;
    Game.flags.paozuIntro = true;
    await Field.run(async () => {
      await say('Bulma', 'D\'après le radar, la boule la plus proche est dans la forêt, à l\'est. Passe devant, Goku !');
      await say('Bulma', 'Et fais attention aux bêtes sauvages... Si elles nous voient, elles attaquent !');
      await say(null, 'Astuce : les ennemis sont visibles. Touche-les pour combattre, ou évite-les. Maintiens Maj pour courir. Les points scintillants soignent et sauvegardent.');
    });
  },
};

// ---------------- Forêt ----------------
MAPS.foret = {
  name: 'Forêt de Paozou', music: 'forest', ground: '.',
  rows: [
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFF..T....T..FFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFF.....~~~~.....FFFFFFFFFFF',
    'FFFFFFFFFFFFFF..T..~~~~~~..T..FFFFFFFFFF',
    'FFFFFFFFFFFFF.....~~~~~~~~.....FFFFFFFFF',
    'FFFFFFFFFFFFF..,..~~~~~~~~..,..FFFFFFFFF',
    'FFFFFFFFFFFFF.T....~~~~~~....T.FFFFFFFFF',
    'FFFFFFFFFFFFFF.......~~.......FFFFFFFFFF',
    'FFFFFFFFFFFFFFFFFF...pp...FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFF....pp....FFFFFFFFFFFFF',
    'FFFFFFFFFFFFF..T.....pp.T....FFFFFFFFFFF',
    'FFFFF..T....F........pp........T..FFFFFF',
    'pppppppppppppppppppppppppppppp.....FFFFF',
    'pppppppppppppppppppppppppppppp..T..FFFFF',
    'FFFF..T...F...T......,......pp..T..FFFFF',
    'FFFFF...TT....""""......T...pp.....FFFFF',
    'FFFFFF....T..."""".......F..pp..T..FFFFF',
    'FFFFFFF.T........T......FF..pp.....FFFFF',
    'FFFFFFFF.....T....,...FFF...pp...FFFFFFF',
    'FFFFFFFFF..T.......FFFFFF...pp..FFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFF..T....pp...FFFFFFF',
    'FFFFFFFFFFFFFFFFFFFF...,....pp..T.FFFFFF',
    'FFFFFFFFFFFFFFFFFFFF..T.....pp.....FFFFF',
    'FFFFFFFFFFFFFFFFFFFFF.......pp....T.FFFF',
    'FFFFFFFFFFFFFFFFFFFFFF..r...pp......FFFF',
    'FFFFFFFFFFFFFFFFFFFFFFF.....pp.....FFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFF...pp...FFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFF.pp.FFFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFF.pp.FFFFFFFFF',
  ],
  entities: () => [
    warp(0, 13, 1, 2, 'paozu', 38, 13.5, 'left'),
    warp(28, 29, 2, 1, 'plage', 8.5, 1, 'down'),
    savePt(31, 19),
    chest('foret1', 6, 16, 'boisson_ki'),
    chest('foret2', 15, 4, 'senzu'),
    chest('foret3', 33, 22, 'tonique', 3),
    foe(12, 16, ['tigre']),
    foe(28, 5, ['loup', 'loup', 'loup']),
    foe(16, 12, ['ptero', 'tigre']),
    foe(22, 17, ['dino', 'dino']),
    foe(23, 26, ['tigre', 'ptero']),
    foe(10, 18, ['loup', 'tigre']),
    foe(8, 13, ['dino', 'ptero']),
    npc('umigame', null, 17, 6, async e => {
      await say('Tortue', 'Snif... Je suis une tortue de mer. Je me suis perdue dans cette forêt... La mer, c\'est par où ?');
      await say('Goku', 'La mer ? C\'est au sud, après la forêt ! Monte sur mon dos, je t\'emmène !');
      await say('Bulma', 'Goku ! On n\'a pas le temps de jouer les nounous pour une tortue !');
      await say('Goku', 'Mais elle est toute seule... Allez, accroche-toi !');
      e.gone = true;
      Game.flags.turtle = true;
      SND.sfx('item');
      await say(null, 'Goku porte la tortue sur son dos.');
    }, { mon: 'umigame', cond: () => !Game.flags.turtle }),
    npc('bear', null, 28.5, 24, null, { mon: 'ours', cond: () => !Game.flags.bear, solid: true, box: [-12, -10, 24, 10] }),
    { kind: 'trigger', tx: 26, ty: 21, tw: 6, th: 1, cond: () => !Game.flags.bear, once: true, run: bearEvent },
    { kind: 'ball', id: 'ball2', stars: 2, tx: 28.5, ty: 24, box: [-6, -10, 12, 10], cond: () => Game.flags.bear && !Game.hasBall(2), talk: async e => { e.gone = true; await getBall(2); } },
  ],
};
async function bearEvent() {
  const bear = Field.ent('bear');
  Field.emote(bear, '!');
  SND.sfx('roar');
  await wait(30);
  await say('Ours Brigand', 'GRRR ! Qui ose traverser MA forêt ? Donnez-moi toute votre nourriture... et cette jolie boule qui brille !');
  await say('Goku', 'Pas question ! Cette boule, on en a besoin. Et j\'ai faim moi aussi !');
  await say('Bulma', 'Goku, il a un sabre énorme ! Fais attention !');
  bear.visible = false;
  await Battle.start(['ours'], { positions: [[bear.x, bear.y]], music: 'boss' });
  bear.gone = true;
  Game.flags.bear = true;
  await say('Ours Brigand', 'Ouille ouille... Tu frappes fort, gamin... Je m\'en vais !');
  await say('Bulma', 'Regarde ! Il a laissé tomber quelque chose... C\'est une Boule de Cristal !');
  const b = Field.addEntity({ kind: 'ball', id: 'ball2', stars: 2, x: bear.x, y: bear.y, box: [-6, -10, 12, 10], talk: async e => { e.gone = true; await getBall(2); } });
  b.t = 0;
}

// ---------------- Plage et Kame House ----------------
MAPS.plage = {
  name: 'Plage de la Kame House', music: 'field', ground: 's',
  rows: [
    'FFFFFFFFppFFFFFFFFFFFFFFFFFFppFFFFFF',
    'FFFFFFF.pp.FFFFFFFFFFFFFFFF.pp.FFFFF',
    'FFFFFF..pp..T.FFFFFFFFFFFT..pp..FFFF',
    'FFFF..T.pp.....T..FFFFFFF...pp...FFF',
    'FF.....,pp........T......T..pp....FF',
    'FF..T...pp.....,.......,....pp....FF',
    'FF.T....pp..........,.......pp...TFF',
    'FFsssssssssPssssssssssssPssssssssFFF',
    'FPssssssssssssssssssssssssssssssssPF',
    'FssssPssssssssssssssssssssssss~~~~~~',
    'Fsssssssssssssssssssssssssss~~~~~~~~',
    'FsssPssssssssssssssssssssss~~~~~~~~~',
    'Fssssssssssssssssssssssss~~sssssss~~',
    'Fsssssssssssssssssssssss~~~s#####s~~',
    'FssPssssssssssssssssssssssss#####s~~',
    'Fsssssssssssssssssssssss~~~s#####s~~',
    'Fssssssssssssssssssssss~~~~sPsssPs~~',
    'Fsssssssssssssssssssss~~~~~sssss~~~~',
    'FssPsssssssssssssssss~~~~~~~~~~~~~~~',
    'Fssssssssssssssssss~~~~~~~~~~~~~~~~~',
    'Fsssssssssssssss~~~~~~~~~~~~~~~~~~~~',
    'FsPssssssssss~~~~~~~~~~~~~~~~~~~~~~~',
    'Fssssssssss~~~~~~~~~~~~~~~~~~~~~~~~~',
    'Fsssssss~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'FFsss~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'FFF~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  objects: [{ type: 'building', img: 'kame', x: 448, y: 188 }],
  entities: () => [
    warp(8, 0, 2, 1, 'foret', 28.5, 28, 'up'),
    warp(28, 0, 2, 1, 'route', 3.5, 20, 'up'),
    savePt(10, 6),
    chest('plage1', 2, 22, 'tonique', 3),
    chest('plage2', 33, 12, 'capsule_vie'),
    foe(12, 12, ['crabe']),
    foe(18, 10, ['mouette']),
    foe(6, 19, ['crabe', 'mouette']),
    foe(14, 17, ['mouette', 'mouette']),
    foe(20, 15, ['crabe', 'crabe']),
    npc('roshi', 'roshi', 30, 16, roshiTalk, { cond: () => !Game.flags.roshi }),
    npc('roshi2', 'roshi', 30, 16, async () => {
      await say('Tortue Géniale', 'Ho ho ho ! Bon courage, les jeunes ! Et si vous croisez une jolie fille, envoyez-la-moi ! Hé hé...');
      await say('Bulma', '...Vieux pervers.');
    }, { cond: () => Game.flags.roshi }),
    npc('krillin_npc', 'krillin', 30.5, 17, null, { cond: () => !Game.flags.roshi, visible: false }),
    { kind: 'trigger', tx: 28, ty: 1, tw: 2, th: 1, cond: () => !Game.flags.roshi, run: async () => {
      await say('Bulma', 'Attends, Goku ! Le radar indique une boule toute proche... sur l\'île, là-bas, près de la maison rose !');
      await pushBack(0, 18);
    } },
    { kind: 'npc', id: 'umi_beach', tx: 27, ty: 13, mon: 'umigame', cond: () => Game.flags.roshi, talk: () => say('Tortue', 'Merci encore de m\'avoir ramenée à la mer, Goku !') },
  ],
  async onEnter() {
    if (Game.flags.beachIntro) return;
    Game.flags.beachIntro = true;
    await Field.run(async () => {
      await say('Bulma', 'La mer ! Le radar indique une boule sur cette petite île... Il y a une maison, là-bas.');
      if (Game.flags.turtle) await say('Goku', 'Regarde, tortue, c\'est la mer ! On va trouver ta maison.');
    });
  },
};
async function roshiTalk(e) {
  if (!Game.flags.turtle) {
    await say('Vieil homme', 'Hmm ? Des visiteurs ? Hélas, je suis bien triste... Ma fidèle tortue a disparu dans la forêt de Paozou.');
    await say('Vieil homme', 'Si vous la retrouvez, je vous donnerai une belle récompense. Peut-être même cette jolie boule orange...');
    await say('Bulma', 'La Boule de Cristal ! Goku, il faut retrouver cette tortue. Elle doit être près de l\'étang de la forêt.');
    return;
  }
  const g = L();
  const turtle = Field.addEntity({ kind: 'npc', id: 'umi_tmp', x: g.x - 14, y: g.y + 2, mon: 'umigame', solid: false });
  await say('Tortue', 'Maître ! Je suis rentrée ! Ce garçon m\'a portée jusqu\'ici.');
  await say('Vieil homme', 'Ma tortue ! Merci, merci ! Je suis Tortue Géniale, le grand maître des arts martiaux !');
  await say('Tortue Géniale', 'Pour te remercier, mon garçon, voici le nuage magique Kinto\'un. Seuls les cœurs purs peuvent monter dessus !');
  SND.sfx('item');
  await say(null, 'Goku reçoit le nuage Kinto\'un ! (Il le suit en volant... pour plus tard !)');
  await say('Bulma', 'Et la boule ? Vous avez bien une Boule de Cristal, non ?');
  await say('Tortue Géniale', 'Hé hé hé... Bien sûr. Tiens, jeune fille. Elle porte trois étoiles.');
  await getBall(3);
  await say('Tortue Géniale', 'Mais avant de partir, petit, regarde bien. Voici la technique secrète de l\'école de la Tortue...');
  e.dir = 'right';
  await wait(20);
  await say('Tortue Géniale', 'KA... MÉ... HA... MÉ...');
  SND.sfx('charge');
  Field.effects.push({ type: 'charge', x: e.x + 10, y: e.y - 13, t: 40 });
  await wait(40);
  await say('Tortue Géniale', 'HAAAAAA !');
  SND.sfx('beam');
  Field.effects.push({ type: 'beam', x1: e.x + 10, y1: e.y - 13, x2: e.x + 200, y2: e.y - 20, t: 60, life: 60 });
  Game.shake = 30;
  await wait(70);
  await say('Goku', 'Wouaaah ! Trop fort ! Attends... comme ça ? Ka... mé... ha... mé... HA !');
  const goku = Game.member('goku');
  if (!goku.techs.includes('kame')) { goku.techs.push('kame'); SND.sfx('levelup'); await say(null, 'Goku apprend la technique « Kamehameha » !'); }
  await say('Tortue Géniale', 'Incroyable... Il a réussi du premier coup !');
  const k = Field.ent('krillin_npc');
  k.x = 30 * 16 + 8; k.y = 15 * 16 + 12; k.dir = 'down';
  k.visible = true;
  SND.sfx('door');
  await Field.walkTo(k, 31 * 16 + 8, 16 * 16 + 14, 1.2);
  k.dir = 'left';
  await say('???', 'Maître Tortue Géniale ! Je m\'appelle Krilin ! Je suis venu de loin pour devenir votre disciple !');
  await say('Tortue Géniale', 'Hmm... Tu veux t\'entraîner ? Alors pars en voyage avec ces jeunes gens. Rien ne vaut l\'aventure pour progresser !');
  await say('Krilin', 'Avec ce petit à queue de singe ? ... D\'accord ! Goku, c\'est ça ? On verra qui est le plus fort !');
  await say('Goku', 'Ouais ! On s\'entraînera tous les jours !');
  Game.flags.roshi = true;
  await joinParty('krillin', k);
  turtle.gone = true;
  e.gone = true;
  Field.addEntity({ kind: 'npc', id: 'roshi2', sprite: 'roshi', x: e.x, y: e.y, talk: async () => { await say('Tortue Géniale', 'Ho ho ho ! Bon voyage, les jeunes ! Revenez me voir... surtout toi, jolie Bulma, hé hé !'); await say('Bulma', '...Vieux pervers.'); } });
  Field.addEntity({ kind: 'npc', id: 'umi_beach', x: 27 * 16 + 8, y: 13 * 16 + 14, mon: 'umigame', talk: () => say('Tortue', 'Merci encore de m\'avoir ramenée à la mer, Goku !') });
  await say('Bulma', 'Le radar indique d\'autres boules au nord. Il y a un village de l\'autre côté de la montagne !');
  await say(null, 'Astuce : quand deux héros ont leur jauge pleine, ils peuvent lancer une technique double (en violet dans le menu Tech) !');
}

// ---------------- Route de la montagne ----------------
MAPS.route = {
  name: 'Route de la Montagne', music: 'forest', ground: '.',
  rows: [
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFppFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFF.pp.FFF',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCCC..pp..CC',
    'CCCCCCCCCCCCCCCCCCCCCCCCCCC..Tpp...C',
    'FF..T....r.....T......,.......pp..FF',
    'FF.......CCCCC.........T......pp.TFF',
    'FF..T...CCCCCCC..""".........pp...FF',
    'FF......CCCCCCC.."""""..r.....pp..FF',
    'FF.T.....CCCCC........pppppppppp..FF',
    'FF.............~~.....pp..........FF',
    'FF..T..........~~..T..pp..T....T..FF',
    'FF......r......~~.....pp..........FF',
    'FF.T...........~~.....pp...r......FF',
    'FF......""".....~~....pp..........FF',
    'FF..T..""""....~~.....pp...T......FF',
    'FFpppppppppppppbbppppppp..........FF',
    'FF.pp..........~~.......T.........FF',
    'FF.pp...T......~~..r..............FF',
    'FF.pp..........~~.....T......T....FF',
    'FFTpp...,......~~.......,..T......FF',
    'FF.pp..........~~.................FF',
    'FFFppFFFFFFFFFF~~FFFFFFFFFFFFFFFFFFF',
  ],
  entities: () => [
    warp(3, 21, 2, 1, 'plage', 28.5, 1, 'down'),
    warp(30, 0, 2, 1, 'village', 17.5, 26, 'up'),
    savePt(33, 6),
    sign(6, 16, 'Route de la Montagne. Au nord : le Village d\'Aru. Attention aux bandits !'),
    chest('route1', 3, 4, 'super_tonique'),
    chest('route2', 33, 11, 'boisson_ki', 2),
    foe(8, 10, ['bandit']),
    foe(25, 12, ['loup_noir', 'loup_noir']),
    foe(10, 18, ['bandit', 'loup_noir']),
    foe(24, 5, ['dino_rouge']),
    foe(6, 6, ['mouette', 'bandit']),
    foe(28, 17, ['dino_rouge', 'loup_noir']),
  ],
};

// ---------------- Village d'Aru ----------------
MAPS.village = {
  name: 'Village d\'Aru', music: 'village', ground: '.',
  rows: [
    'FFFFFFFFF..FFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFF.pp.FFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFT.....pp.T......T.....###...T..FF',
    'FF.......pp..............###......FF',
    'FF..T....pp.....,.........p....T..FF',
    'FF.......pppppppppppppppppp.......FF',
    'FF.T.....pp.....................T.FF',
    'FF.......pp....T..................FF',
    'FF.###...pp.................###...FF',
    'FF.###...pp.................###...FF',
    'FF.....,.pp........##.............FF',
    'FF.......pp.......................FF',
    'FF..T....ppppppppppppppppp........FF',
    'FF.......ppppppp##pppppppp.....T..FF',
    'FF.......ppppppppppppppppp........FF',
    'FF..,............pp...............FF',
    'FF.T.............pp...........T...FF',
    'FF.###...........pp........###....FF',
    'FF.###...........pp........###....FF',
    'FF...............pp...............FF',
    'FF..T.......###..pp............T..FF',
    'FF..........###..pp.......,.......FF',
    'FF...,...........pp...............FF',
    'FF.T.............pp...T.........T.FF',
    'FFF..............pp..............FFF',
    'FFFF.............pp.........T...FFFF',
    'FFFFF.T..........pp............FFFFF',
    'FFFFFFFFFFFFFFFFFppFFFFFFFFFFFFFFFFF',
  ],
  objects: [
    { type: 'building', img: 'shop', x: 44, y: 110 },
    { type: 'building', img: 'inn', x: 444, y: 110 },
    { type: 'building', img: 'oolong', x: 396, y: 14 },
    { type: 'building', img: 'dome1', x: 44, y: 254 },
    { type: 'building', img: 'dome2', x: 428, y: 254 },
    { type: 'building', img: 'dome3', x: 188, y: 302 },
    { type: 'prop', img: 'well', x: 260, y: 198 },
    { type: 'building', img: 'stall', x: 300, y: 140, sortY: 172 },
  ],
  entities: () => [
    warp(17, 27, 2, 1, 'route', 30.5, 1, 'down'),
    warp(9, 0, 2, 1, 'desert', 19.5, 28, 'up'),
    savePt(12, 11),
    npc('shopkeeper', 'villM2', 6, 10, async () => {
      await say('Marchand', 'Bienvenue à la boutique du village ! Toniques, boissons... tout pour l\'aventure !');
      await UI.openShop(['tonique', 'super_tonique', 'boisson_ki', 'capsule_vie']);
    }),
    npc('innkeeper', 'villF2', 31, 10, async () => {
      const r = await UI.ask('Aubergiste', 'Bienvenue à l\'auberge ! Une bonne nuit pour toute l\'équipe : 15 Zénis. Ça vous dit ?', ['Dormir (15 Z)', 'Non merci'], { cancel: 1 });
      if (r !== 0) return;
      if (Game.zeni < 15) { await say('Aubergiste', 'Oh... Vous n\'avez pas assez de Zénis.'); return; }
      Game.zeni -= 15;
      await UI.fadeTo(1, 20);
      Game.healAll();
      SND.sfx('heal');
      await wait(40);
      await UI.fadeTo(0, 20);
      await say('Aubergiste', 'Bien dormi ? Toute l\'équipe est en pleine forme !');
    }),
    npc('elder', 'elder', 20, 13, async () => {
      if (!Game.flags.oolong) {
        await say('Chef du village', 'Ah, des voyageurs... Fuyez tant qu\'il est temps ! Le terrible Oolong terrorise notre village.');
        await say('Chef du village', 'C\'est un monstre qui peut prendre n\'importe quelle forme ! Il a enlevé nos jeunes filles et vit dans la maison rose, au nord-est.');
        await say('Goku', 'Un monstre ? Je vais le battre !');
        await say('Bulma', 'Et le radar indique justement une boule dans sa maison...');
      } else {
        await say('Chef du village', 'Merci, jeunes héros ! Nos filles sont revenues saines et sauves. Le chemin du désert, au nord, vous est ouvert.');
      }
    }),
    npc('mother', 'villF1', 6, 19, async () => {
      if (!Game.flags.oolong) await say('Villageoise', 'Ma fille... Oolong a emmené ma fille ! Je vous en prie, aidez-nous !');
      else await say('Villageoise', 'Ma fille est rentrée ! Elle dit qu\'Oolong la forçait à manger des gâteaux toute la journée... Quel monstre !');
    }),
    npc('kid', 'villM3', 24, 14, async () => {
      await say('Garçon', 'Tu as une queue de singe ?! Trop bizarre ! Moi je veux devenir aussi fort que le grand Tortue Géniale !');
    }, { wander: 2 }),
    npc('villager2', 'villM1', 26, 22, async () => {
      await say('Villageois', 'Les deux héros qui combattent ensemble, c\'est le secret ! On dit que les techniques combinées sont dévastatrices.');
    }, { wander: 2 }),
    npc('girl', 'villF1', 14, 23, async () => {
      if (!Game.flags.oolong) await say('Fillette', 'Chut ! Si Oolong m\'entend, il va m\'enlever moi aussi !');
      else await say('Fillette', 'Oolong n\'est qu\'un petit cochon peureux en vrai ! Hi hi !');
    }, { wander: 1 }),
    npc('gatekeeper', 'villM2', 9.5, 2, async e => {
      await say('Garde', 'Halte ! Le désert de Diablo est infesté de brigands. Et personne ne quitte le village tant qu\'Oolong n\'est pas vaincu !');
    }, { cond: () => !Game.flags.oolong, box: [-16, -8, 32, 9] }),
    npc('oolong', 'oolong', 26, 4, oolongEvent, { cond: () => !Game.flags.oolong }),
    npc('oolong2', 'oolong', 28, 5, async () => {
      await say('Oolong', 'Je suis un cochon honnête maintenant ! Enfin... presque. Bonne chance pour la suite, les amis !');
    }, { cond: () => Game.flags.oolong, wander: 1 }),
  ],
};
async function oolongEvent(e) {
  await say('Oolong', 'Hein ? Qu\'est-ce que vous me voulez ? Vous savez qui je suis ? Je suis le TERRIBLE Oolong !');
  await say('Goku', 'T\'es un cochon.');
  await say('Oolong', 'Grrr ! Vous allez voir ! TRANSFORMATION !');
  SND.sfx('door');
  Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 10, t: 40 });
  await wait(20);
  e.visible = false;
  await wait(20);
  await say('Oolong Monstre', 'GROAAAR ! Tremblez devant ma forme terrifiante !');
  await say('Krilin', 'Il s\'est transformé en monstre ! Goku, on y va ensemble !');
  await Battle.start(['taureau'], { positions: [[e.x, e.y]], music: 'boss' });
  Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 10, t: 40 });
  SND.sfx('door');
  await wait(20);
  e.visible = true;
  await say('Oolong', 'Aïe aïe aïe ! Pitié ! Ma transformation ne dure que cinq minutes... Je me rends !');
  await say('Bulma', 'Libère les filles du village ! Et donne-nous la Boule de Cristal que tu caches !');
  await say('Oolong', 'D\'accord, d\'accord ! Les filles sont libres. Et voilà votre boule... Je l\'avais trouvée dans la rivière.');
  await getBall(5);
  e.gone = true;
  Game.flags.oolong = true;
  const g = Field.ent('gatekeeper');
  if (g) g.gone = true;
  Field.addEntity({ kind: 'npc', id: 'oolong2', sprite: 'oolong', x: 28 * 16 + 8, y: 5 * 16 + 14, wander: 1, talk: () => say('Oolong', 'Je suis un cochon honnête maintenant ! Enfin... presque.') });
  await say('Bulma', 'Plus que deux... non, trois boules ! Le radar indique le désert, au nord du village.');
}

// ---------------- Désert ----------------
MAPS.desert = {
  name: 'Désert de Diablo', music: 'desert', ground: 'd', cliffTint: { a: '#c89060', b: '#a87044', c: '#6a4428', d: '#e0b07a' },
  rows: [
    'CCCCCCCCddCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCCddddCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
    'CCCCCCddddddCCCCCCCCCCCCCCCCdddddddCCCCC',
    'CCCCCddddddddkCCCCCCCCCCCCCdddddddddCCCC',
    'CCddddddRddddddCCCCCCCCCCCdd###dddddddCC',
    'CCdddkddddddddddCCCCCCCCdddd###ddddkddCC',
    'CCddddddddddddddddCCCCddddddddddddddddCC',
    'CCddddRddddddddddddddddddddddkddddddddCC',
    'CCdddddddddkddddddddddddddRdddddddddddCC',
    'CCddddddddddddddddddddddddddddddddRdddCC',
    'CCdddddddPddddddddddddddddddddddddddddCC',
    'CCddddd~~~~~dddddddddkddddddddddddddddCC',
    'CCdddPd~~~~~~ddddddddddddddRddddddddddCC',
    'CCddddd~~~~~~PddddddddddddddddddddkdddCC',
    'CCdddddd~~~~ddddddddddddddddddddddddddCC',
    'CCddddPdddddddddRdddddddddddddddddddddCC',
    'CCddddddddddddddddddddddddkdddddddddddCC',
    'CCdddkddddddddddddddddddddddddddddRdddCC',
    'CCddddddddddddddRdddddddddddddddddddddCC',
    'CCddddddddddddddddddddddddddddkdddddddCC',
    'CCddddddRdddddddddddddddddddddddddddddCC',
    'CCddddddddddddddddkdddddddddddddddddddCC',
    'CCddddddddddddddddddddddddddddRdddddddCC',
    'CCddkdddddddddddddddddddddddddddddddddCC',
    'CCdddddddddddddddddddddddddddddddkddddCC',
    'CCCddddddddRddddddddddddddddddddddddddCC',
    'CCCCddddddddddddddddddddddddddddddddCCCC',
    'CCCCCCddddddddddddddkdddddddddddddCCCCCC',
    'CCCCCCCCCCCCCCCCCCdddddCCCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCCCCCCddCCCCCCCCCCCCCCCCCCC',
  ],
  objects: [{ type: 'building', img: 'cave', x: 444, y: 56 }, { type: 'prop', img: 'tent', x: 196, y: 170 }, { type: 'prop', img: 'campfire', x: 236, y: 196, sortY: 190 }],
  entities: () => [
    warp(19, 29, 2, 1, 'village', 9.5, 1, 'down'),
    warp(8, 0, 2, 1, 'chateau', 15.5, 26, 'up'),
    savePt(22, 8),
    chest('desert1', 36, 24, 'super_tonique', 2),
    chest('desert2', 6, 3, 'senzu'),
    npc('nomad', 'villM1', 15, 12, async () => {
      await say('Nomade', 'Un oasis, un feu, et de bonnes affaires ! Je vends de quoi survivre au désert.');
      await UI.openShop(['tonique', 'super_tonique', 'boisson_ki', 'capsule_vie']);
    }),
    foe(10, 8, ['scorpion']),
    foe(25, 13, ['serpent', 'serpent']),
    foe(15, 19, ['brigand']),
    foe(30, 20, ['scorpion', 'brigand']),
    foe(8, 23, ['serpent', 'scorpion']),
    foe(33, 15, ['brigand', 'brigand']),
    foe(22, 24, ['scorpion', 'serpent', 'scorpion']),
    npc('yamcha', 'yamcha', 29.5, 7, null, { cond: () => !Game.flags.yamcha, dir: 'down' }),
    { kind: 'npc', id: 'puar', tx: 31.2, ty: 7, mon: 'puar', fly: true, cond: () => !Game.flags.yamcha },
    { kind: 'trigger', tx: 25, ty: 9, tw: 10, th: 2, cond: () => !Game.flags.yamcha, once: true, run: yamchaEvent },
    { kind: 'trigger', tx: 8, ty: 1, tw: 2, th: 1, cond: () => !Game.flags.yamcha, run: async () => {
      await say('Bulma', 'Attends ! Le radar indique une boule dans la grotte, à l\'est du désert. Allons-y d\'abord !');
      await pushBack(0, 18);
    } },
  ],
};
async function yamchaEvent() {
  const y = Field.ent('yamcha'), p = Field.ent('puar');
  SND.sfx('jump');
  await Field.jump(y, 12, 16);
  await Field.walkTo(y, y.x, y.y + 24, 1.6);
  await say('???', 'Halte-là ! Je suis Yamcha, le loup solitaire du désert ! Donnez-moi vos capsules et tout votre argent !');
  await say('Puar', 'Yamcha est le plus fort de tous ! Rendez-vous tout de suite !');
  await say('Yamcha', 'Hé hé... Hein ? Une... une FILLE ?! Je... euh... Je ne suis pas doué avec les filles...');
  await say('Bulma', 'Hi hi ! Il est plutôt mignon, ce bandit !');
  await say('Goku', 'Bon, on se bat ou pas ?');
  await say('Yamcha', 'G-grr ! Bien sûr ! Prépare-toi, petit ! Puar, à l\'attaque !');
  y.visible = false; p.visible = false;
  await Battle.start(['yamcha', 'puar'], { positions: [[y.x, y.y], [p.x, p.y]], music: 'boss' });
  y.visible = true; p.visible = true;
  Game.flags.yamcha = true;
  await say('Yamcha', 'Tu... tu es vraiment fort, petit. Je n\'avais jamais perdu !');
  await say('Yamcha', 'Tiens, prends cette boule. Et méfiez-vous : l\'empereur Pilaf cherche lui aussi les Boules de Cristal.');
  await say('Yamcha', 'Son château est au nord du désert... Il en a déjà deux !');
  await getBall(6);
  await say('Yamcha', 'Et... euh... Bulma, c\'est ça ? On... on se reverra peut-être ? Viens, Puar !');
  await Promise.all([Field.walkTo(y, y.x + 60, y.y - 40, 1.6), Field.walkTo(p, p.x + 60, p.y - 40, 1.6)]);
  y.gone = true; p.gone = true;
  await say('Bulma', 'Le château de Pilaf, au nord ! Les deux dernières boules sont là-bas. Allons-y !');
}

// ---------------- Château de Pilaf (cour) ----------------
const CW = (s, n = 1) => s.repeat(n);
MAPS.chateau = {
  name: 'Château de Pilaf', music: 'castle', ground: 'c', night: true,
  rows: [
    CW('X', 11) + CW('#', 10) + CW('X', 11),
    CW('X', 11) + CW('#', 10) + CW('X', 11),
    CW('X', 11) + CW('#', 10) + CW('X', 11),
    'X' + CW('c', 10) + CW('#', 10) + CW('c', 10) + 'X',
    'X' + 'ccIcccccIc' + CW('#', 10) + 'cIcccccIcc' + 'X',
    'X' + CW('c', 10) + CW('#', 10) + CW('c', 10) + 'X',
    'X' + CW('c', 10) + CW('#', 10) + CW('c', 10) + 'X',
    'X' + CW('c', 10) + '####cc####' + CW('c', 10) + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + 'ccI' + CW('c', 11) + 'mm' + CW('c', 11) + 'Icc' + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + 'c.....' + CW('c', 8) + 'mm' + CW('c', 8) + '.....c' + 'X',
    'X' + 'c.n..n' + CW('c', 8) + 'mm' + CW('c', 8) + 'n..n.c' + 'X',
    'X' + 'c.....' + CW('c', 8) + 'mm' + CW('c', 8) + '.....c' + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + 'ccI' + CW('c', 11) + 'mm' + CW('c', 11) + 'Icc' + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + 'c.....' + CW('c', 8) + 'mm' + CW('c', 8) + '.....c' + 'X',
    'X' + 'cn.n.n' + CW('c', 8) + 'mm' + CW('c', 8) + 'n.n.nc' + 'X',
    'X' + 'c.....' + CW('c', 8) + 'mm' + CW('c', 8) + '.....c' + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + 'ccI' + CW('c', 11) + 'mm' + CW('c', 11) + 'Icc' + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    'X' + CW('c', 14) + 'mm' + CW('c', 14) + 'X',
    CW('X', 15) + 'mm' + CW('X', 15),
    CW('X', 15) + 'mm' + CW('X', 15),
    'dddRdddddddddddddddddddddddkdddd',
    CW('C', 15) + 'dd' + CW('C', 15),
  ],
  objects: [{ type: 'building', img: 'castle', x: 176, y: 0 }],
  entities: () => [
    warp(15, 7, 2, 1, 'trone', 8.5, 12, 'up'),
    warp(15, 27, 2, 1, 'desert', 8.5, 1, 'down'),
    savePt(6, 9),
    chest('chateau1', 2, 4, 'super_tonique', 2),
    chest('chateau2', 29, 4, 'capsule_vie', 2),
    foe(8, 14, ['robot']),
    foe(24, 14, ['soldat', 'soldat']),
    foe(10, 20, ['robot', 'soldat']),
    foe(22, 20, ['robot', 'robot']),
    foe(15, 11, ['soldat']),
    foe(24, 9, ['soldat', 'robot', 'soldat']),
  ],
  async onEnter() {
    if (Game.flags.castleIntro) return;
    Game.flags.castleIntro = true;
    await Field.run(async () => {
      await say('Bulma', 'Le château de Pilaf... Le radar indique deux boules à l\'intérieur !');
      await say('Krilin', 'Il y a des robots partout. Restons groupés !');
    });
  },
};

// ---------------- Salle du trône ----------------
MAPS.trone = {
  name: 'Salle du Trône', music: 'castle', ground: 'c',
  rows: [
    'XXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXX',
    'Xccccccc##cccccccX',
    'XcIccccc##cccccIcX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'XcIccccc' + 'mm' + 'cccccIcX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'XcIccccc' + 'mm' + 'cccccIcX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'XcIccccc' + 'mm' + 'cccccIcX',
    'Xccccccc' + 'mm' + 'cccccccX',
    'XXXXXXXX' + 'mm' + 'XXXXXXXX',
  ],
  objects: [{ type: 'prop', img: 'throne', x: 132, y: 30 }],
  entities: () => [
    warp(8, 13, 2, 1, 'chateau', 15.5, 8.2, 'down'),
    npc('pilaf', 'pilaf', 8.5, 4, null, { cond: () => !Game.flags.pilaf }),
    npc('shu', 'shu', 7, 5, null, { cond: () => !Game.flags.pilaf }),
    npc('mai', 'mai', 10, 5, null, { cond: () => !Game.flags.pilaf }),
    { kind: 'trigger', tx: 1, ty: 9, tw: 16, th: 1, cond: () => !Game.flags.pilaf, once: true, run: pilafEvent },
  ],
};
async function pilafEvent() {
  const p = Field.ent('pilaf'), s = Field.ent('shu'), m = Field.ent('mai');
  await say('Pilaf', 'Ha ha ha ha ! Bienvenue, misérables voleurs ! Je suis l\'empereur Pilaf, le futur maître du monde !');
  await say('Mai', 'Majesté, ils ont cinq Boules de Cristal avec eux !');
  await say('Pilaf', 'Parfait ! Avec mes deux boules, ça fait sept ! Je vais enfin pouvoir souhaiter... devenir le maître du monde !');
  await say('Goku', 'Tu les auras pas ! Rends-nous tes boules !');
  await say('Pilaf', 'Insolent ! Shu ! Mai ! Activez la PILAF MACHINE !');
  await say('Shu', 'Tout de suite, Majesté !');
  SND.sfx('thunder');
  Game.shake = 30;
  const mach = Field.addEntity({ kind: 'npc', id: 'mach', x: p.x, y: p.y + 30, mon: 'machine', solid: false });
  mach.z = 0;
  await Field.jump(p, 20, 20);
  p.visible = false;
  await say('Pilaf', 'Ha ha ! Tremblez devant ma superbe machine de guerre !');
  mach.visible = false; s.visible = false; m.visible = false;
  await Battle.start(['machine', 'shu', 'mai'], { positions: [[mach.x, mach.y], [s.x, s.y], [m.x, m.y]], music: 'boss', canFlee: false });
  Game.flags.pilaf = true;
  mach.gone = true;
  SND.sfx('bighit'); Game.shake = 40;
  Field.effects.push({ type: 'smoke', x: mach.x, y: mach.y - 14, t: 50 });
  await wait(30);
  p.visible = true; p.x = mach.x; p.y = mach.y;
  s.visible = true; m.visible = true;
  await say('Pilaf', 'C\'est impossible ! Ma magnifique machine... Battue par des enfants !');
  await say('Goku', 'Les boules ! Donne-les nous !');
  await say('Pilaf', 'Snif... Prenez-les, prenez-les ! Mais je reviendrai, vous m\'entendez ? JE REVIENDRAI !');
  await getBall(1);
  await getBall(7);
  await Promise.all([Field.walkTo(p, p.x, p.y - 40, 2), Field.walkTo(s, s.x - 30, s.y - 30, 2), Field.walkTo(m, m.x + 30, m.y - 30, 2)]);
  p.gone = true; s.gone = true; m.gone = true;
  await say('Bulma', 'On les a ! Les sept Boules de Cristal ! Sortons vite dans la cour pour appeler Shenron !');
  await Main.shenronFinale();
}
