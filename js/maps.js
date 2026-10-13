// Cartes, PNJ, événements et scénario (avec choix, affinités et quêtes).
const say = (who, txt, opts) => UI.say(who, txt, opts);
const ask = (who, txt, choices, opts) => UI.ask(who, txt, choices, opts);
const L = () => Field.leader();
const has = id => !!Game.member(id);

async function getItem(id, n = 1) {
  Game.give(id, n);
  SND.sfx('item');
  await say(null, 'Obtenu : ' + itemDef(id).name + (n > 1 ? ' x' + n : '') + ' !' + (GEAR[id] ? ' (Menu → Équipement)' : ''));
}
async function getBall(n) {
  Game.giveBall(n);
  SND.sfx('ball');
  await say(null, 'Boule de Cristal à ' + n + ' étoile' + (n > 1 ? 's' : '') + ' obtenue ! (' + Game.balls.length + '/7)');
}
async function joinParty(id, ent) {
  const where = Game.addMember(id);
  Field.syncParty();
  const a = Field.actors.find(x => x.id === id);
  if (ent) { if (a) { a.x = ent.x; a.y = ent.y; } ent.gone = true; }
  SND.sfx('levelup');
  await say(null, MEMBERS[id].name + (where === 'party' ? ' rejoint l\'équipe !' : ' rejoint la réserve ! (Menu → Équipe pour changer les héros actifs.)'));
  if (a) await Field.walkTo(a, L().x, L().y, 1.4);
  Field.history = [];
}
async function pushBack(dx, dy) {
  const l = L();
  await Field.walkTo(l, l.x + dx, l.y + dy, 1.3);
}
async function chapterCard(flag, num, title) {
  if (Game.flags[flag]) return;
  Game.flags[flag] = true;
  await UI.chapter(num, title);
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
const fire = (tx, ty, cond, scale = 1) => ({ kind: 'fire', tx, ty, cond, scale, phase: (tx * 7 + ty * 13) % 20 });

// =====================================================================
const MAPS = {};
const REP = (s, n = 1) => s.repeat(n);

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
    { kind: 'npc', id: 'shrineTalk', tx: 5, ty: 2, visible: false, solid: false, talk: () => say(null, 'Un portrait de Grand-père Gohan. Il a l\'air sévère mais gentil.') },
    { kind: 'trigger', tx: 4, ty: 6, tw: 2, th: 1, cond: () => !Game.hasBall(4), run: async () => {
      if (!Game.flags.intro || Game.hasBall(4)) return;
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
      await UI.chapter('Prologue', 'Le garçon à la queue de singe');
      await UI.fadeTo(0, 30);
      await say(null, "Mont Paozou. Loin de tout, un petit garçon à queue de singe vit seul dans la maison de son grand-père, parti depuis longtemps...");
      await say('Goku', "Bonjour Grand-père Gohan ! Aujourd'hui, je vais encore pêcher un poisson géant !");
      SND.sfx('door');
      await wait(20);
      Field.emote(g, '!');
      g.dir = 'down';
      await wait(30);
      b.visible = true;
      await Field.walkTo(b, b.x, b.y - 32, 1);
      await say('Bulma', "Ouf, enfin une maison ! Je m'appelle Bulma. Mon Dragon Radar indique qu'une Boule de Cristal se trouve ici !");
      const r = await ask('Goku', "(Une fille ? Goku n'en a jamais vu de sa vie...)", ["Tu es un monstre ? Tu n'as pas de queue !", 'Bonjour ! Tu veux manger avec moi ?', 'En garde ! Montre ce que tu vaux !']);
      if (r === 0) { await say('Bulma', "Un MONSTRE ?! Je suis une fille, espèce de malpoli ! Les humains n'ont pas de queue, c'est toi le bizarre !"); Game.addAff('bulma', -1); }
      else if (r === 1) { await say('Bulma', "Oh... c'est gentil ! Tu es plus poli que tu en as l'air. Mais c'est quoi, ce truc grillé ? Un lézard ?!"); Game.addAff('bulma', 1); }
      else await say('Bulma', 'Hé ! Doucement ! Range ce bâton, je ne suis pas venue me battre !');
      await say('Goku', "Une boule de cristal ? Tu parles du souvenir de Grand-père ? La boule à quatre étoiles, là, sur le coussin.");
      await say('Bulma', "C'est ça ! Il en existe sept dans le monde. Celui qui les réunit fait apparaître le dragon sacré Shenron... qui exauce un vœu, n'importe lequel !");
      await say('Goku', 'Un dragon ?! Trop fort ! Mais je ne donnerai jamais la boule de Grand-père.');
      await say('Bulma', "Alors viens avec moi ! On cherche les autres ensemble. Tu gardes la tienne, et moi... j'ai mon vœu. Marché conclu ?");
      await say('Goku', "Marché conclu ! En route pour l'aventure !");
      Game.flags.intro = true;
      Game.setQuest('main', 'paozu', true);
      await joinParty('bulma', b);
      await say(null, "Approche-toi de la boule et appuie sur Z (ou Entrée / bouton A) pour la prendre. X ou Échap ouvre le menu : Équipement, Style pour personnaliser Goku, etc.");
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
    'FF....,...........T.....~~,..,.#.,..T.FF',
    'FF...####.......,....r..~~.,..,.,.,.""FF',
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
  objects: [{ type: 'building', img: 'hut', x: 80, y: 52 }, { type: 'prop', img: 'tombe', x: 493, y: 38 }],
  entities: () => [
    warp(6, 6, 2, 1, 'maison', 4.5, 6, 'up'),
    warp(39, 13, 1, 2, 'foret', 1, 13.5, 'right'),
    sign(9, 7, 'Mont Paozou — Maison de Son Goku. « Défense de chasser les dinosaures du grand-père ! »'),
    { kind: 'npc', id: 'grave', tx: 31, ty: 3, visible: false, solid: false, talk: graveEvent },
    savePt(11, 8),
    chest('paozu1', 3, 22, 'tonique', 2),
    chest('paozu2', 36, 6, 'boisson_ki'),
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
      await say('Bulma', "D'après le radar, la boule la plus proche est dans la forêt, à l'est. Passe devant, Goku !");
      await say('Bulma', "Mais avant de partir... tu ne veux pas dire au revoir à ton grand-père ? Sa tombe est sur la colline, au nord-est, de l'autre côté de la rivière.");
      await say(null, "Astuce : les ennemis sont visibles. Touche-les pour combattre, ou évite-les. Maj pour courir. Les points scintillants soignent et sauvegardent. Le Journal (menu) suit tes quêtes.");
    });
  },
};
async function graveEvent() {
  if (Game.flags.grave) { await say(null, 'La tombe de Grand-père Gohan. Des fleurs sauvages poussent tout autour.'); return; }
  await say('Goku', 'Grand-père... Je pars en voyage avec Bulma. On va chercher les Boules de Cristal !');
  SND.playMusic('sad');
  await UI.fadeTo(0.55, 40, '#f0e0c0');
  await say(null, 'Le vent se lève sur la colline. Goku ferme les yeux... et entend une voix familière.');
  await say('Grand-père Gohan', "Goku... Tu as bien grandi. Souviens-toi de ce que je t'ai appris : la force n'a de sens que si elle a un but.");
  await say('Grand-père Gohan', 'Dis-moi, mon petit... Quelle promesse me fais-tu, avant de partir ?');
  await UI.fadeTo(0, 40);
  UI.fade.color = '#000';
  const r = await ask('Goku', 'Grand-père, je te promets...', ['Je deviendrai le plus fort du monde !', 'Je protégerai mes amis, toujours !']);
  const goku = Game.member('goku');
  SND.sfx('levelup');
  if (r === 0) {
    Game.flags.voie = 'force';
    applyBonus(goku, { atk: 3 });
    await say(null, 'Une détermination brûlante envahit Goku. (Force de Goku +3)');
    await say('Bulma', 'Pff, les garçons et leurs histoires de force... Allez, en route, champion !');
  } else {
    Game.flags.voie = 'coeur';
    applyBonus(goku, { hp: 20, def: 2 });
    await say(null, 'Une douce chaleur envahit Goku. (PV max +20, Défense +2)');
    await say('Bulma', "C'est... vraiment mignon, Goku. Ton grand-père doit être fier de toi.");
    Game.addAff('bulma', 1);
  }
  Game.flags.grave = true;
  SND.playMusic('field');
}

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
    { kind: 'herb', id: 'herbe', tx: 27, ty: 7, solid: false, box: [-6, -10, 12, 12], cond: () => !Game.flags.herb, talk: async e => {
      e.gone = true; Game.flags.herb = true;
      await getItem('herbe');
      if (Game.quest('grandmere') === 'start') Game.setQuest('grandmere', 'herbe');
      else await say('Bulma', "Une Herbe Médicinale ! Elle est très rare. Gardons-la, quelqu'un en aura peut-être besoin.");
    } },
    foe(12, 16, ['tigre']),
    foe(28, 5, ['loup', 'loup', 'loup']),
    foe(16, 12, ['ptero', 'tigre']),
    foe(22, 17, ['dino', 'dino']),
    foe(23, 26, ['tigre', 'ptero']),
    foe(10, 18, ['loup', 'tigre']),
    foe(8, 13, ['dino', 'ptero']),
    npc('umigame', null, 17, 6, turtleEvent, { mon: 'umigame', cond: () => !Game.flags.turtle }),
    npc('bear', null, 28.5, 24, null, { mon: 'ours', cond: () => !Game.flags.bear, solid: true, box: [-12, -10, 24, 10] }),
    { kind: 'trigger', tx: 26, ty: 21, tw: 6, th: 1, cond: () => !Game.flags.bear, once: true, run: bearEvent },
    { kind: 'ball', id: 'ball2', stars: 2, tx: 28.5, ty: 24, box: [-6, -10, 12, 10], cond: () => Game.flags.bear && !Game.hasBall(2), talk: async e => { e.gone = true; await getBall(2); } },
  ],
  async onEnter() { await Field.run(() => chapterCard('ch1', 'Chapitre 1', 'La forêt de Paozou')); },
};
async function turtleEvent(e) {
  await say('Tortue', "Snif... Je suis une tortue de mer. Je me suis perdue dans cette forêt... La mer, c'est par où ?");
  const r = await ask('Goku', '(La pauvre tortue a l\'air épuisée.)', ['Monte sur mon dos, je te porte !', 'Désolé, on est pressés...']);
  if (r === 1) {
    await say('Bulma', "Goku, on ne peut quand même pas la laisser là... Bon, d'accord, on a une mission. Mais ça me fait mal au cœur.");
    await say('Tortue', 'Snif... Je comprends...');
    return;
  }
  await say('Goku', "La mer ? C'est au sud, après la forêt ! Accroche-toi !");
  await say('Bulma', "Goku, une tortue de cent kilos sur le dos ?! ... Tu es vraiment pas normal, toi.");
  e.gone = true;
  Game.flags.turtle = true;
  Game.addKarma(1);
  Game.setQuest('tortue', 'carry');
  SND.sfx('item');
  await say(null, 'Goku porte la tortue sur son dos.');
}
async function bearEvent() {
  const bear = Field.ent('bear');
  Field.emote(bear, '!');
  SND.sfx('roar');
  await wait(30);
  await say('Ours Brigand', 'GRRR ! Qui ose traverser MA forêt ? Donnez-moi toute votre nourriture... et cette jolie boule qui brille !');
  await say('Goku', "Pas question ! Cette boule, on en a besoin. Et j'ai faim moi aussi !");
  await say('Bulma', 'Goku, il a un sabre énorme ! Fais attention !');
  bear.visible = false;
  await Battle.start(['ours'], { positions: [[bear.x, bear.y]], music: 'boss' });
  bear.visible = true;
  await say('Ours Brigand', "Ouille ouille... Pitié ! Je voulais juste manger... Depuis que les monstres sont devenus fous, la forêt n'a plus rien à offrir !");
  const r = await ask('Goku', "(Que faire de l'Ours Brigand ?)", ['Le laisser partir', 'Le chasser de la forêt !']);
  if (r === 0) {
    Game.flags.bearSpared = true; Game.addKarma(1);
    await say('Goku', "T'as faim ? Moi aussi j'ai souvent faim. Va, mais n'embête plus les voyageurs !");
    await say('Ours Brigand', "M-merci, petit... Tu es bizarre, mais gentil. Tiens, prends cette boule brillante.");
  } else {
    Game.flags.bearChased = true;
    await say('Goku', 'Va-t\'en loin d\'ici ! Et ne reviens jamais !');
    await say('Ours Brigand', "Waaah ! D'accord, d'accord ! Prends ta boule !");
  }
  await Field.walkTo(bear, bear.x + 70, bear.y + 10, 1.6);
  bear.gone = true;
  Game.flags.bear = true;
  const b = Field.addEntity({ kind: 'ball', id: 'ball2', stars: 2, x: 28 * 16 + 16, y: 24 * 16 + 14, box: [-6, -10, 12, 10], talk: async e => { e.gone = true; await getBall(2); } });
  b.t = 0;
  // Les espions de Pilaf
  await wait(30);
  const shu = Field.addEntity({ kind: 'npc', id: 'spy_shu', sprite: 'shu', x: 26 * 16 + 8, y: 27 * 16 + 14, dir: 'up' });
  const mai = Field.addEntity({ kind: 'npc', id: 'spy_mai', sprite: 'mai', x: 31 * 16 + 8, y: 27 * 16 + 14, dir: 'up' });
  await say('Shu', "Psst, Mai ! Sa Majesté Pilaf sera ravi : ces gamins ont déjà deux Boules de Cristal !");
  await say('Mai', "Silence, Shu ! Ils vont nous entendre... Retournons au château prévenir l'empereur.");
  Field.emote(L(), '!');
  await say('Bulma', 'Hé ! Qui êtes-vous ?! Vous nous espionnez ?');
  const c = await ask('Goku', "(Les deux espions s'enfuient vers le sud !)", ['Les poursuivre !', 'Les laisser filer']);
  if (c === 0) {
    shu.visible = false; mai.visible = false;
    await Battle.start(['shu_espion', 'mai_espion'], { positions: [[shu.x, shu.y], [mai.x, mai.y]] });
    shu.visible = true; mai.visible = true;
    await say('Shu', 'Aïe aïe ! Mai, on file !');
    await Promise.all([Field.walkTo(shu, shu.x, shu.y + 60, 2), Field.walkTo(mai, mai.x, mai.y + 60, 2)]);
    await say('Bulma', "Ils ont laissé tomber quelque chose... Un plan ! « Château de l'empereur Pilaf »... Gardons-le, ça peut servir.");
    await getItem('carte');
    Game.flags.spiesChased = true;
  } else {
    await Promise.all([Field.walkTo(shu, shu.x, shu.y + 60, 2), Field.walkTo(mai, mai.x, mai.y + 60, 2)]);
    await say('Bulma', 'Pilaf ? Jamais entendu parler... Bon, on a d\'autres chats à fouetter !');
    Game.flags.spiesFled = true;
  }
  shu.gone = true; mai.gone = true;
  Game.setQuest('main', 'plage');
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
    npc('roshi2', 'roshi', 30, 16, roshiAfter, { cond: () => Game.flags.roshi }),
    npc('krillin_npc', 'krillin', 30.5, 17, null, { cond: () => !Game.flags.roshi, visible: false }),
    { kind: 'trigger', tx: 28, ty: 1, tw: 2, th: 1, cond: () => !Game.flags.roshi, run: async () => {
      await say('Bulma', "Attends, Goku ! Le radar indique une boule toute proche... sur l'île, là-bas, près de la maison rose !");
      await pushBack(0, 18);
    } },
    { kind: 'npc', id: 'umi_beach', tx: 27, ty: 13, mon: 'umigame', cond: () => Game.flags.roshi, talk: () => say('Tortue', 'Merci encore de m\'avoir ramenée à la mer, Goku !') },
  ],
  async onEnter() {
    if (Game.flags.beachIntro) return;
    Game.flags.beachIntro = true;
    await Field.run(async () => {
      await chapterCard('ch2', 'Chapitre 2', 'La Kame House');
      await say('Bulma', "La mer ! Le radar indique une boule sur cette petite île... Il y a une drôle de maison rose, là-bas.");
      if (Game.flags.turtle) await say('Goku', "Regarde, tortue, c'est la mer ! On va trouver ta maison.");
    });
  },
};
async function roshiAfter() {
  const r = await ask('Tortue Géniale', 'Ho ho ho ! Alors, les jeunes, on vient s\'entraîner ?', ['S\'entraîner', 'Discuter', 'Au revoir'], { cancel: 2 });
  if (r === 0) return trainingMenu();
  if (r !== 1) return;
  await say('Tortue Géniale', "Bon voyage, les jeunes ! Et toi, jolie Bulma, reviens me voir quand tu veux, hé hé...");
  await say('Bulma', '...Vieux pervers.');
}

// ---------------- Entraînement de la Tortue (mini-jeux) ----------------
const TRAINING = {
  rythme: { bonus: { ki: 3 }, prize: 'bandeau_kame', words: "Tu as le rythme dans la peau ! Tiens, voici le Bandeau de la Tortue." },
  lait: { bonus: { spd: 1 }, prize: 'carapace', words: "Tout le lait est livré ! Tu mérites ta propre carapace d'entraînement. Elle pèse vingt kilos, hé hé !" },
  briques: { bonus: { atk: 1 }, prize: 'gants_tortue', words: 'Toutes les briques, du premier coup ! Prends ces gants, ils protégeront tes poings.' },
  meditation: { bonus: { mag: 1 }, prize: 'kimono_kame', words: "Un esprit calme et clair... Tu es digne de porter le kimono de l'école de la Tortue !" },
};
const bestRank = (game, id) => (Game.train[id] || {})[game] || 0; // 0 = jamais, 1 à 4 = rangs C à S
const rankTag = r => (r ? ' [' + MiniGames.RANKS[r - 1] + ']' : '');
async function trainingMenu() {
  if (!Game.flags.trainIntro) {
    Game.flags.trainIntro = true;
    await say('Tortue Géniale', "L'entraînement de la Tortue développe le corps ET l'esprit ! Chaque exercice renforce une qualité différente.");
    await say('Tortue Géniale', 'Plus ton rang est bon, plus tu progresses. Et pour un rang S... je garde quelques surprises, hé hé.');
  }
  const ids = Object.keys(TRAINING);
  for (;;) {
    const best = g => Math.max(0, ...Game.allMembers().map(p => bestRank(g, p.id)));
    const c = await ask('Tortue Géniale', 'Quel exercice ?', ids.map(g => MiniGames.GAMES[g].name + rankTag(best(g))).concat(['Arrêter']), { cancel: ids.length });
    if (c >= ids.length) { await say('Tortue Géniale', "Bien travaillé ! Le repos fait aussi partie de l'entraînement."); return; }
    const game = ids[c], all = Game.allMembers();
    let m = all[0];
    if (all.length > 1) {
      const w = await ask('Tortue Géniale', "Qui s'entraîne ?", all.map(p => p.name + rankTag(bestRank(game, p.id))).concat(['Annuler']), { cancel: all.length });
      if (w >= all.length) continue;
      m = all[w];
    }
    await UI.fadeTo(1, 16);
    const run = MiniGames.run(game, m);
    UI.fade.v = 0;
    const res = await run;
    if (res) await trainingReward(game, m, res);
  }
}
async function trainingReward(game, m, res) {
  const T = TRAINING[game], rank = res.rank + 1, old = bestRank(game, m.id);
  await say('Tortue Géniale', [
    "Hmm... C'est un début. L'entraînement, c'est surtout de la persévérance !",
    'Pas mal, pas mal ! Mais tu peux faire mieux.',
    'Excellent ! Encore un petit effort et tu seras un vrai maître.',
    "Ho ho ho ! PARFAIT ! Même moi, à ton âge, je n'étais pas aussi doué !",
  ][res.rank]);
  const zeni = 10 + res.rank * 15;
  Game.zeni += zeni; SND.sfx('coin');
  if (rank > old) {
    Game.train[m.id] = Object.assign({}, Game.train[m.id], { [game]: rank });
    const b = {};
    for (const k in T.bonus) b[k] = T.bonus[k] * (rank - old);
    applyBonus(m, b);
    SND.sfx('levelup');
    await say(null, m.name + ' progresse ! (' + Object.keys(b).map(k => STAT_NAMES[k] + ' +' + b[k]).join(', ') + ')   +' + zeni + ' Zénis');
  } else await say(null, 'Pour progresser encore, ' + m.name + ' doit battre son record (rang ' + MiniGames.RANKS[old - 1] + ').   +' + zeni + ' Zénis');
  if (res.rank === 3 && !Game.flags['prize_' + game]) {
    Game.flags['prize_' + game] = true;
    await say('Tortue Géniale', T.words);
    await getItem(T.prize);
  }
  if (!Game.flags.goldHair && Object.keys(TRAINING).every(g => Game.flags['prize_' + g])) {
    Game.flags.goldHair = true;
    await say('Tortue Géniale', "Rang S à tous les exercices... Incroyable ! Tes cheveux brillent comme de l'or ! ... Ah non, c'est le soleil. Mais ça t'irait bien !");
    SND.sfx('levelup');
    await say(null, 'Style secret débloqué : les cheveux dorés ! (Menu → Style)');
  }
}
async function roshiTalk(e) {
  if (!Game.flags.turtle) {
    await say('Vieil homme', "Hmm ? Des visiteurs ? Hélas, je suis bien triste... Ma fidèle tortue a disparu dans la forêt de Paozou.");
    await say('Vieil homme', "Si vous la retrouvez, je vous donnerai une belle récompense. Peut-être même cette jolie boule orange...");
    await say('Bulma', "La Boule de Cristal ! Goku, il faut retrouver cette tortue. Elle doit être près de l'étang de la forêt.");
    Game.setQuest('tortue', 'start');
    return;
  }
  const g = L();
  const turtle = Field.addEntity({ kind: 'npc', id: 'umi_tmp', x: g.x - 14, y: g.y + 2, mon: 'umigame', solid: false });
  await say('Tortue', "Maître ! Je suis rentrée ! Ce garçon m'a portée jusqu'ici.");
  await say('Vieil homme', "Ma tortue ! Merci, merci ! Je suis Tortue Géniale, le grand maître des arts martiaux !");
  Game.setQuest('tortue', 'done');
  await say('Tortue Géniale', "Pour te remercier, mon garçon, voici le nuage magique Kinto'un. Seuls les cœurs purs peuvent monter dessus !");
  SND.sfx('item');
  await say(null, "Goku reçoit le nuage Kinto'un !");
  await say('Bulma', "Et la boule ? Vous avez bien une Boule de Cristal, non ? ... Hé ! Il m'a fait tomber de son nuage, ce truc !");
  await say('Tortue Géniale', 'Hé hé hé... Le nuage ne porte que les cœurs purs. Mais tiens, jeune fille, voici ta boule à trois étoiles.');
  await getBall(3);
  const goku = Game.member('goku');
  const q = await ask('Tortue Géniale', 'Dis-moi, petit... Que cherches-tu vraiment, dans ce voyage ?', ['La force ! Devenir super fort !', "Des amis et de l'aventure !", 'À manger. Beaucoup.']);
  if (q === 0) {
    await say('Tortue Géniale', "Ho ho, l'ambition ! N'oublie pas : un vrai maître s'entraîne pour protéger les autres. Tiens, voici un petit secret d'entraînement.");
    applyBonus(goku, { atk: 2, mag: 1 }); SND.sfx('levelup');
    await say(null, '(Force de Goku +2, Ki +1)');
  } else if (q === 1) {
    await say('Tortue Géniale', 'Une belle réponse... Les amis sont le plus grand des trésors. Prends ces haricots magiques : ils vous sauveront la vie.');
    await getItem('senzu', 2);
    Game.addAff('bulma', 1);
  } else {
    await say('Tortue Géniale', 'HO HO HO ! Honnête, au moins ! Moi aussi, j\'aime bien manger. Prends ces provisions !');
    await getItem('tonique', 4);
  }
  await say('Tortue Géniale', "Et maintenant, regarde bien. Voici la technique secrète de l'école de la Tortue...");
  e.dir = 'right';
  await wait(20);
  await say('Tortue Géniale', 'KA... MÉ... HA... MÉ...');
  SND.sfx('charge');
  Field.effects.push({ type: 'charge', x: e.x + 10, y: e.y - 16, t: 40 });
  await wait(40);
  await say('Tortue Géniale', 'HAAAAAA !');
  SND.sfx('beam');
  Field.effects.push({ type: 'beam', x1: e.x + 10, y1: e.y - 16, x2: e.x + 200, y2: e.y - 24, t: 60, life: 60 });
  Game.shake = 30;
  await wait(70);
  await say('Goku', 'Wouaaah ! Trop fort ! Attends... comme ça ? Ka... mé... ha... mé... HA !');
  if (!goku.techs.includes('kame')) { goku.techs.push('kame'); SND.sfx('levelup'); await say(null, 'Goku apprend la technique « Kamehameha » !'); }
  await say('Tortue Géniale', 'Incroyable... Il a réussi du premier coup !');
  const k = Field.ent('krillin_npc');
  k.x = 30 * 16 + 8; k.y = 15 * 16 + 12; k.dir = 'down';
  k.visible = true;
  SND.sfx('door');
  await Field.walkTo(k, 31 * 16 + 8, 16 * 16 + 14, 1.2);
  k.dir = 'left';
  await say('???', "Maître Tortue Géniale ! Je m'appelle Krilin ! Je suis venu du temple d'Orin pour devenir votre disciple !");
  await say('Tortue Géniale', 'Hmm... Tu veux t\'entraîner ? Alors pars en voyage avec ces jeunes gens. Rien ne vaut l\'aventure pour progresser !');
  await say('Krilin', "Avec ce petit à queue de singe ? ... Goku, c'est ça ? Je te préviens, je serai plus fort que toi !");
  const k2 = await ask('Goku', '(Krilin a l\'air très sûr de lui...)', ['Bienvenue, Krilin ! On sera amis !', "D'abord un combat ! Montre-moi ce que tu vaux !"]);
  if (k2 === 0) {
    Game.addAff('krillin', 1);
    await say('Krilin', 'Amis ? ... Bon, d\'accord. Mais on fera la course tous les matins !');
  } else {
    await say('Krilin', 'Un duel ? Ha ! Avec plaisir, je vais te mettre une raclée !');
    await say('Tortue Géniale', 'Un combat amical ! Ne vous faites pas trop mal, les jeunes.');
    k.visible = false;
    const res = await Battle.start(['krilin_duel'], { positions: [[k.x, k.y]], music: 'boss', canFlee: false, spar: true });
    k.visible = true;
    if (res === 'lose') {
      await say('Krilin', "Ha ha ! J'ai gagné ! ... Mais tu t'es bien battu. On s'entraînera ensemble, comme ça tu progresseras !");
      Game.addAff('krillin', 1);
    } else {
      await say('Krilin', "Ouf... Tu es vraiment fort ! Je retire ce que j'ai dit... enfin, presque. Entraînons-nous ensemble !");
      Game.addAff('krillin', 2);
    }
    Game.flags.krillinDuel = true;
  }
  Game.flags.roshi = true;
  await joinParty('krillin', k);
  turtle.gone = true;
  e.gone = true;
  Field.addEntity({ kind: 'npc', id: 'roshi2', sprite: 'roshi', x: e.x, y: e.y, talk: roshiAfter });
  Field.addEntity({ kind: 'npc', id: 'umi_beach', x: 27 * 16 + 8, y: 13 * 16 + 14, mon: 'umigame', talk: () => say('Tortue', 'Merci encore de m\'avoir ramenée à la mer, Goku !') });
  await say('Tortue Géniale', "Et revenez me voir quand vous voulez pour vous entraîner ! L'école de la Tortue est toujours ouverte.");
  await say('Bulma', "Le radar indique une autre boule au nord, de l'autre côté de la montagne. Il y a un village là-bas !");
  Game.setQuest('main', 'village');
  await say(null, 'Astuce : quand deux héros ont leur jauge pleine, ils peuvent lancer une technique double (en violet dans le menu Tech) !');
}

// ---------------- Feu de camp ----------------
MAPS.camp = {
  name: 'Campement', music: 'camp', ground: '.', night: true, glow: true,
  rows: [
    'FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFF',
    'FFFT......TFFF',
    'FF..........FF',
    'FF.,........FF',
    'FF....#.....FF',
    'FF..........FF',
    'FF......,...FF',
    'FFT........TFF',
    'FFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFF',
  ],
  objects: [{ type: 'prop', img: 'campfire', x: 96, y: 86, sortY: 90 }],
  entities: () => [fire(6, 5, null, 1)],
};
async function campScene(n) {
  await UI.fadeTo(1, 30);
  const back = { map: Field.mapId, x: L().x, y: L().y, dir: L().dir };
  Field.load('camp', 6, 7, 'up');
  Field.hideParty = true;
  const spots = [[6, 7, 'up'], [4, 5, 'right'], [8, 5, 'left'], [6, 3, 'down'], [4, 7, 'up'], [8, 7, 'up']];
  Game.allMembers().forEach((m, i) => Field.addEntity({ kind: 'npc', id: 'camp_' + m.id, sprite: lookKey(m), tx: spots[i][0], ty: spots[i][1], dir: spots[i][2] }));
  await UI.fadeTo(0, 40);
  if (n === 1) await camp1(); else await camp2();
  await UI.fadeTo(1, 40);
  Game.healAll();
  Field.hideParty = false;
  Field.load(back.map, 0, 0, back.dir, back.x, back.y);
  await UI.fadeTo(0, 30);
}
async function camp1() {
  await say(null, "La nuit tombe sur la route de la montagne. L'équipe installe son campement autour d'un feu de bois.");
  await say('Bulma', "Ouf, mes pieds ! Dire que j'ai une maison-capsule... restée à la Capitale de l'Ouest.");
  await say('Krilin', "Moi je dors à la belle étoile ! Un vrai guerrier n'a pas besoin de lit !");
  await say('Goku', 'Miam, ce poisson grillé est trop bon !');
  const r = await ask('Goku', '(Avec qui discuter avant de dormir ?)', ['Bulma', 'Krilin', 'Personne, dodo !']);
  if (r === 0) {
    await say('Bulma', "Tu sais, Goku... Mon père dirige Capsule Corporation, la plus grande entreprise du monde. Moi, je veux inventer des choses encore plus géniales !");
    await say('Bulma', "Et mon vœu... c'est un secret. Disons que je cherche le petit ami parfait. Romantique, hein ?");
    const c = await ask('Goku', '(Bulma regarde les étoiles.)', ['Un petit ami ? Ça se mange ?', 'Tu es la fille la plus intelligente que je connaisse !', 'Moi je serai ton ami pour toujours !']);
    if (c === 0) await say('Bulma', "Ha ha ha ! Tu es vraiment un cas, Goku... Laisse tomber.");
    else if (c === 1) { await say('Bulma', "Oh... merci, Goku. Venant de toi, c'est un vrai compliment !"); Game.addAff('bulma', 1); }
    else { await say('Bulma', "Hi hi... Toi, t'es encore un bébé. Mais... merci."); Game.addAff('bulma', 1); }
  } else if (r === 1) {
    await say('Krilin', "Au temple d'Orin, les autres moines se moquaient de moi parce que j'étais petit... Ils me faisaient faire toutes leurs corvées.");
    await say('Krilin', "Je veux devenir fort pour qu'on arrête de me marcher dessus. C'est pour ça que je suis venu voir Tortue Géniale.");
    const c = await ask('Goku', '(Krilin fixe le feu.)', ["On s'entraînera ensemble, tous les jours !", 'Moi, je te protégerai !', 'Moi je suis déjà fort, hé hé !']);
    if (c === 0) { await say('Krilin', 'Tous les jours ? ... Ouais ! Et un jour, je te battrai !'); Game.addAff('krillin', 1); }
    else if (c === 1) { await say('Krilin', "Me protéger ? ... Merci, Goku. Mais c'est moi qui te protégerai, tu vas voir !"); Game.addAff('krillin', 1); }
    else await say('Krilin', 'Frimeur ! Attends un peu, je vais te rattraper !');
  } else await say('Goku', 'Bonne nuit tout le monde ! Zzzz...');
  await say(null, 'Le feu crépite doucement. Demain, le village d\'Aru...');
}
async function camp2() {
  await say(null, "Au pied du Mont Frypan, l'air sent la fumée. L'équipe campe une dernière fois avant d'affronter la montagne de feu.");
  await say('Bulma', 'Plus que trois boules... On y est presque !');
  const who = ['bulma', 'krillin', 'yamcha', 'oolong'].filter(id => has(id));
  const names = who.map(id => MEMBERS[id].name).concat(['Personne, dodo !']);
  const r = await ask('Goku', '(Avec qui discuter ce soir ?)', names);
  const id = who[r];
  if (id === 'bulma') {
    await say('Bulma', "Tu sais, Goku... Au début, je te trouvais juste bizarre. Mais tu es toujours là quand ça va mal.");
    await say('Bulma', "Ta force me fait un peu peur, parfois. Promets-moi de ne pas faire de bêtises, d'accord ?");
    const c = await ask('Goku', '(Bulma a l\'air inquiète.)', ['Promis !', 'Je ne fais jamais de bêtises !']);
    if (c === 0) { await say('Bulma', 'Hi hi. Je te tiendrai à ta promesse !'); Game.addAff('bulma', 1); }
    else await say('Bulma', "Mais oui, mais oui... Le château de Pilaf va trembler, j'en suis sûre.");
  } else if (id === 'krillin') {
    await say('Krilin', "Goku... Au début, je voulais juste te battre. Maintenant, je suis content d'être ton ami.");
    const c = await ask('Goku', '(Krilin se gratte la tête, gêné.)', ['Meilleurs amis pour la vie !', 'Moi aussi, Krilin.']);
    Game.addAff('krillin', c === 0 ? 2 : 1);
    await say('Krilin', c === 0 ? 'Meilleurs amis pour la vie ! Hé hé !' : 'Hé hé... Bon, on dort ? Demain on cogne !');
  } else if (id === 'yamcha') {
    await say('Yamcha', "Puar et moi, on s'est connus à l'école de métamorphose... C'est mon seul vrai ami. Les filles, elles, me paralysent depuis toujours.");
    const c = await ask('Goku', '(Yamcha regarde discrètement Bulma.)', ["Bulma t'aime bien, je crois !", 'Ne plus avoir peur, ça s\'entraîne !', "C'est quoi, une fille ?"]);
    if (c === 0) { await say('Yamcha', 'T-tu crois ?! ... Je... je vais faire de mon mieux !'); Game.addAff('yamcha', 1); Game.flags.yamchaHope = true; }
    else if (c === 1) { await say('Yamcha', "Tu as raison. Un loup du désert ne recule devant rien ! ... Sauf les filles."); Game.addAff('yamcha', 1); }
    else await say('Yamcha', '...Tu es un drôle de gamin, toi.');
  } else if (id === 'oolong') {
    await say('Oolong', "J'ai été renvoyé de l'école de métamorphose... pour une bêtise que je ne raconterai pas. Et mes transformations ne durent que cinq minutes.");
    const c = await ask('Goku', '(Oolong boude dans son coin.)', ['Tu es plus courageux que tu le crois !', 'Tu ne voleras plus rien, promis ?', 'Tu peux te transformer en gâteau ?']);
    if (c === 0) { await say('Oolong', 'Moi ? Courageux ? ... Personne ne m\'avait jamais dit ça.'); Game.addAff('oolong', 1); }
    else if (c === 1) { await say('Oolong', "Promis, promis... Bon, peut-être un dernier gâteau de temps en temps."); Game.addKarma(1); }
    else { await say('Oolong', "Je peux, mais si tu me manges, je me retransforme dans ton ventre ! Hé hé !"); Game.addAff('oolong', 1); }
  } else await say('Goku', 'Bonne nuit ! Demain, on grimpe la montagne !');
  await say(null, 'Au loin, le volcan gronde. Une étrange lueur rouge éclaire le ciel...');
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
    'FF..T...CCCCCCC.."""..........pp..FF',
    'FF......CCCCCCC..""""".r......pp..FF',
    'FF.T.....CCCCC........pppppppppp..FF',
    'FF.............~~.....pp..........FF',
    'FF###..........~~..T..pp..T....T..FF',
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
  objects: [{ type: 'prop', img: 'tent', x: 30, y: 146 }, { type: 'prop', img: 'campfire', x: 96, y: 172, sortY: 176 }],
  entities: () => [
    warp(3, 21, 2, 1, 'plage', 28.5, 1, 'down'),
    warp(30, 0, 2, 1, 'village', 17.5, 26, 'up'),
    savePt(33, 6),
    sign(6, 16, "Route de la Montagne. Au nord : le Village d'Aru. Attention aux bandits !"),
    chest('route1', 3, 4, 'bandeau'),
    chest('route2', 33, 11, 'boisson_ki', 2),
    npc('merchant', 'villM1', 6, 19, merchantTalk),
    npc('chef', 'brigand', 6, 12, chefTalk, { cond: () => !Game.flags.chefBeaten, dir: 'right' }),
    foe(9, 10, ['bandit']),
    foe(25, 12, ['loup_noir', 'loup_noir']),
    foe(10, 18, ['bandit', 'loup_noir']),
    foe(24, 5, ['dino_rouge']),
    foe(18, 6, ['mouette', 'bandit']),
    foe(28, 17, ['dino_rouge', 'loup_noir']),
  ],
  async onEnter() {
    if (Game.flags.camp1) return;
    Game.flags.camp1 = true;
    await Field.run(async () => {
      await campScene(1);
      await chapterCard('ch3', 'Chapitre 3', "Le village d'Aru");
    });
  },
};
async function merchantTalk() {
  const q = Game.quest('marchand');
  if (!q) {
    await say('Marchand', "Snif... Des brigands m'ont tout pris ! Mes marchandises, mon argent... Leur camp est à l'ouest de la route.");
    const r = await ask('Goku', '(Le marchand pleure.)', ['On va récupérer vos affaires !', 'Pas le temps, désolé.']);
    if (r === 0) { Game.setQuest('marchand', 'start'); await say('Marchand', 'Vraiment ? Oh merci ! Mais attention, leur chef est une vraie brute !'); }
    else await say('Marchand', 'Je comprends... Snif...');
    return;
  }
  if (q === 'start') { await say('Marchand', "Leur camp est à l'ouest, près de la tente. Soyez prudents !"); return; }
  if (q === 'retour') {
    Game.useItemStock('marchandise');
    await say('Marchand', "Mes marchandises ! Tout est là ! Vous êtes de vrais héros ! Tenez, prenez ceci.");
    await getItem('super_tonique', 2);
    Game.zeni += 150; SND.sfx('coin');
    await say(null, 'Obtenu : 150 Zénis !');
    Game.setQuest('marchand', 'done'); Game.addKarma(1);
    return;
  }
  await say('Marchand', 'Grâce à vous, je peux reprendre la route. Je dirai partout que vous êtes des héros !');
}
async function chefTalk(e) {
  await say('Chef Brigand', "Encore des gamins ? Vous voulez finir comme ce marchand ? Dégagez, ou je vous écrase !");
  const r = await ask('Goku', '(Le chef brigand brandit une énorme massue.)', ['Rends ce que tu as volé !', 'Partir discrètement']);
  if (r === 1) return;
  if (!Game.quest('marchand')) Game.setQuest('marchand', 'start', true);
  e.visible = false;
  await Battle.start(['chef_brigand', 'bandit', 'bandit'], { positions: [[e.x, e.y]], music: 'boss' });
  e.visible = true;
  await say('Chef Brigand', "Aïe ouille... D'accord, d'accord ! Reprenez votre bric-à-brac et laissez-nous tranquilles !");
  Game.flags.chefBeaten = true;
  await getItem('marchandise');
  Game.setQuest('marchand', 'retour');
  await Field.walkTo(e, e.x - 40, e.y, 2);
  e.gone = true;
}

// ---------------- Village d'Aru ----------------
MAPS.village = {
  name: 'Village d\'Aru', music: 'village', ground: '.',
  rows: [
    'FFFFFFFFF..FFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFF.pp.FFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFT.....pp.T......T.....###...T..FF',
    'FF.......pp..............###......FF',
    'FF..T....pp.....,..........p...T..FF',
    'FF.......pppppppppppppppppp.......FF',
    'FF.T.....pp....................T..FF',
    'FF.......pp....T..................FF',
    'FF.###...pp..................###..FF',
    'FF.###...pp..................###..FF',
    'FF.....,.pp........##.............FF',
    'FF.......pp.......................FF',
    'FF..T....pppppppppppppppp.........FF',
    'FF.......ppppppp##pppppppp...T....FF',
    'FF.......pppppppppppppppp.........FF',
    'FF..,..........pp.................FF',
    'FF.T...........pp...........T.....FF',
    'FF.###.........pp..........###....FF',
    'FF.###.........pp..........###....FF',
    'FF.............pp.................FF',
    'FF..T......###.pp............T....FF',
    'FF.........###.pp......,..........FF',
    'FF...,.........pp.................FF',
    'FF.T...........pp...T........T....FF',
    'FFF............pp...............FFFF',
    'FFFF...........pp..........T...FFFFF',
    'FFFFF.T........pp............FFFFFFF',
    'FFFFFFFFFFFFFFFppFFFFFFFFFFFFFFFFFFF',
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
    warp(15, 27, 2, 1, 'route', 30.5, 1, 'down'),
    warp(9, 0, 2, 1, 'desert', 19.5, 28, 'up'),
    savePt(12, 11),
    npc('shopkeeper', 'villM2', 6, 10, async () => {
      await say('Marchand', 'Bienvenue à la boutique du village ! Toniques, boissons... tout pour l\'aventure !');
      await UI.openShop(['tonique', 'super_tonique', 'boisson_ki', 'capsule_vie', 'remede', 'bandeau', 'baton_bambou', 'gants_cuir', 'plastron', 'masque', 'oreiller']);
    }),
    npc('innkeeper', 'villF2', 31, 10, async () => {
      const r = await ask('Aubergiste', "Bienvenue à l'auberge ! Une bonne nuit pour toute l'équipe : 15 Zénis. Ça vous dit ?", ['Dormir (15 Z)', 'Non merci'], { cancel: 1 });
      if (r !== 0) return;
      if (Game.zeni < 15) { await say('Aubergiste', "Oh... Vous n'avez pas assez de Zénis."); return; }
      Game.zeni -= 15;
      await UI.fadeTo(1, 20);
      Game.healAll();
      SND.sfx('heal');
      await wait(40);
      await UI.fadeTo(0, 20);
      await say('Aubergiste', "Bien dormi ? Toute l'équipe est en pleine forme !");
    }),
    npc('elder', 'elder', 20, 13, async () => {
      if (!Game.flags.oolong) {
        await say('Chef du village', "Ah, des voyageurs... Fuyez tant qu'il est temps ! Le terrible Oolong terrorise notre village.");
        await say('Chef du village', "C'est un monstre qui peut prendre n'importe quelle forme ! Il a enlevé nos jeunes filles et vit dans la maison rose, au nord-est.");
        await say('Goku', 'Un monstre ? Je vais le battre !');
        await say('Bulma', 'Et le radar indique justement une boule dans sa maison...');
      } else await say('Chef du village', "Merci, jeunes héros ! Nos filles sont revenues saines et sauves. Le chemin du désert, au nord, vous est ouvert.");
    }),
    npc('grandma', 'elder', 30, 19, grandmaTalk),
    npc('mother', 'villF1', 6, 19, async () => {
      if (!Game.flags.oolong) await say('Villageoise', 'Ma fille... Oolong a emmené ma fille ! Je vous en prie, aidez-nous !');
      else await say('Villageoise', "Ma fille est rentrée ! Elle dit qu'Oolong la forçait à manger des gâteaux toute la journée... Quel monstre !");
    }),
    npc('kid', 'villM3', 24, 14, async () => {
      await say('Garçon', "Tu as une queue de singe ?! Trop bizarre ! Moi je veux devenir aussi fort que le grand Tortue Géniale !");
    }, { wander: 2 }),
    npc('villager2', 'villM1', 26, 22, async () => {
      await say('Villageois', "Il paraît que l'empereur Pilaf, au nord du désert, cherche lui aussi les Boules de Cristal. Méfiez-vous de ses espions !");
    }, { wander: 2 }),
    npc('girl', 'villF1', 14, 23, async () => {
      if (!Game.flags.oolong) await say('Fillette', "Chut ! Si Oolong m'entend, il va m'enlever moi aussi !");
      else await say('Fillette', "Oolong n'est qu'un petit cochon peureux en vrai ! Hi hi !");
    }, { wander: 1 }),
    npc('shady', 'mai', 13, 16, shadyTalk, { cond: () => !Game.flags.shady }),
    npc('gatekeeper', 'villM2', 9.5, 2, async () => {
      await say('Garde', "Halte ! Le désert de Diablo est infesté de brigands. Et personne ne quitte le village tant qu'Oolong n'est pas vaincu !");
    }, { cond: () => !Game.flags.oolong, box: [-16, -8, 32, 9] }),
    npc('oolong', 'oolong', 26, 4, oolongEvent, { cond: () => !Game.flags.oolong }),
  ],
};
async function grandmaTalk() {
  const q = Game.quest('grandmere');
  if (q === 'done') { await say('Grand-mère', 'Je me sens rajeunie de vingt ans ! Que les dieux vous protègent, mes enfants.'); return; }
  if (Game.items.herbe) {
    await say('Grand-mère', "Kof kof... Mais... c'est une Herbe Médicinale ! Vous l'avez trouvée pour moi ?");
    Game.useItemStock('herbe');
    SND.sfx('heal');
    await say('Grand-mère', 'Oh... je me sens déjà mieux ! Tenez, ce haricot magique vient de mon défunt mari. Il voudrait qu\'il vous serve.');
    await getItem('senzu');
    Game.setQuest('grandmere', 'done'); Game.addKarma(1); Game.addAff('bulma', 1, true);
    await say('Bulma', 'Goku... Tu es vraiment quelqu\'un de bien.');
    return;
  }
  await say('Grand-mère', "Kof kof... Je suis si malade... Seule une Herbe Médicinale pourrait me guérir. Il en pousse près de l'étang de la forêt de Paozou...");
  if (!q) Game.setQuest('grandmere', 'start');
}
async function shadyTalk(e) {
  await say('Marchande louche', "Psst ! Hé, les jeunes... Une Super Capsule ! Elle contient un avion à réaction ! Seulement 200 Zénis, une affaire !");
  const r = await ask('Goku', '(La marchande porte de grosses lunettes et un foulard...)', ['Acheter (200 Z)', 'Non merci']);
  if (r === 0) {
    if (Game.zeni < 200) { await say('Marchande louche', "Pas assez de Zénis ? Tant pis pour vous !"); return; }
    Game.zeni -= 200; SND.sfx('coin');
    await getItem('capsule_vide');
    await say('Marchande louche', 'Merci et... bon voyage ! Hi hi hi !');
    Game.flags.shadyBought = true;
    await say('Bulma', "Montre voir ! ... Elle est VIDE ! On s'est fait avoir !");
  } else {
    await say('Marchande louche', 'Hmpf ! Vous le regretterez !');
    await say('Bulma', "Cette voix... Je l'ai déjà entendue quelque part. Méfions-nous.");
  }
  Game.flags.shady = true;
  await Field.walkTo(e, e.x, e.y + 60, 2);
  e.gone = true;
}
async function oolongEvent(e) {
  await say('Oolong', "Hein ? Qu'est-ce que vous me voulez ? Vous savez qui je suis ? Je suis le TERRIBLE Oolong !");
  await say('Goku', "T'es un cochon.");
  await say('Oolong', 'Grrr ! Vous allez voir ! TRANSFORMATION !');
  SND.sfx('door');
  Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 12, t: 40 });
  await wait(20);
  e.visible = false;
  await wait(20);
  await say('Oolong Monstre', 'GROAAAR ! Tremblez devant ma forme terrifiante !');
  if (has('krillin')) await say('Krilin', "Il s'est transformé en monstre ! Goku, on y va ensemble !");
  await Battle.start(['taureau'], { positions: [[e.x, e.y]], music: 'boss' });
  Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 12, t: 40 });
  SND.sfx('door');
  await wait(20);
  e.visible = true;
  await say('Oolong', 'Aïe aïe aïe ! Pitié ! Ma transformation ne dure que cinq minutes... Je me rends !');
  await say('Bulma', 'Libère les filles du village ! Et donne-nous la Boule de Cristal que tu caches !');
  await say('Oolong', "D'accord, d'accord ! Les filles sont libres. Et voilà votre boule... Je l'avais trouvée dans la rivière.");
  await getBall(5);
  Game.flags.oolong = true;
  Game.flags.met_oolong = true;
  const r = await ask('Goku', "(Le chef du village arrive avec une corde...)", ["Lui pardonner et l'emmener avec nous", 'Le livrer aux villageois']);
  if (r === 0) {
    Game.flags.oolongJoined = true; Game.addKarma(1);
    await say('Goku', 'Tu viens avec nous ! Comme ça tu ne feras plus de bêtises.');
    await say('Oolong', "Hein ? Avec vous ? ... Bon, au moins je ne finirai pas en prison. Mais je préviens, je ne suis pas un guerrier !");
    await say('Bulma', 'Toi, je te surveille, cochon !');
    Game.addAff('oolong', 2, true);
    await joinParty('oolong', e);
  } else {
    Game.flags.oolongJailed = true;
    await say('Chef du village', 'Merci ! Nous allons le garder sous bonne surveillance. Voici 300 Zénis de récompense !');
    Game.zeni += 300; SND.sfx('coin');
    await say('Oolong', 'Noooon ! Pas la cave ! Il y a des araignées !');
    await Field.walkTo(e, e.x, e.y - 20, 1.5);
    e.gone = true;
  }
  const g = Field.ent('gatekeeper');
  if (g) g.gone = true;
  await say('Bulma', "Le radar indique une boule dans le désert, au nord du village. Allons-y !");
  Game.setQuest('main', 'desert');
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
    'CCdddddd~~~~dddddddddddddddddddddddddddd',
    'CCddddPdddddddddRddddddddddddddddddddddd',
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
    warp(39, 14, 1, 2, 'frypan', 1, 14.5, 'right'),
    savePt(22, 8),
    chest('desert1', 36, 24, 'super_tonique', 2),
    chest('desert2', 6, 3, 'senzu'),
    npc('nomad', 'villM1', 15, 12, nomadTalk),
    { kind: 'glint', id: 'compass', tx: 33, ty: 22, solid: false, box: [-6, -8, 12, 10], cond: () => !Game.flags.compass, talk: async e => {
      e.gone = true; Game.flags.compass = true;
      await getItem('boussole');
      if (Game.quest('boussole') === 'start') Game.setQuest('boussole', 'retour');
    } },
    foe(10, 8, ['scorpion']),
    foe(25, 13, ['serpent', 'serpent']),
    foe(15, 19, ['brigand']),
    foe(30, 20, ['scorpion', 'brigand']),
    foe(8, 23, ['serpent', 'scorpion']),
    foe(33, 16, ['brigand', 'brigand']),
    foe(22, 24, ['scorpion', 'serpent', 'scorpion']),
    npc('yamcha', 'yamcha', 29.5, 7, null, { cond: () => !Game.flags.yamcha, dir: 'down' }),
    { kind: 'npc', id: 'puar', tx: 31.2, ty: 7, mon: 'puar', fly: true, cond: () => !Game.flags.yamcha },
    { kind: 'trigger', tx: 25, ty: 9, tw: 10, th: 2, cond: () => !Game.flags.yamcha, once: true, run: yamchaEvent },
    { kind: 'trigger', tx: 8, ty: 1, tw: 2, th: 1, cond: () => !Game.hasBall(6), run: async () => {
      await say('Bulma', Game.flags.yamcha ? "Attends ! Le radar indique d'abord une boule à l'est, sur le Mont Frypan. Pilaf attendra !" : "Attends ! Le radar s'affole vers l'est du désert... Allons voir d'abord !");
      await pushBack(0, 18);
    } },
  ],
  async onEnter() { await Field.run(() => chapterCard('ch4', 'Chapitre 4', 'Le loup du désert')); },
};
async function nomadTalk() {
  const q = Game.quest('boussole');
  if (q === 'retour' || (Game.items.boussole && q !== 'done')) {
    Game.useItemStock('boussole');
    await say('Nomade', "Ma boussole dorée ! Sans elle, je tournais en rond depuis des jours ! Merci, merci !");
    await getItem('senzu');
    Game.zeni += 100; SND.sfx('coin');
    await say(null, 'Obtenu : 100 Zénis !');
    Game.setQuest('boussole', 'done'); Game.addKarma(1);
    return;
  }
  await say('Nomade', 'Un oasis, un feu, et de bonnes affaires ! Je vends de quoi survivre au désert.');
  if (!q) {
    await say('Nomade', "Ah, et si vous voyez une boussole dorée près des rochers du sud-est... c'est la mienne. Je l'ai perdue pendant une tempête.");
    Game.setQuest('boussole', 'start');
  }
  await UI.openShop(['tonique', 'super_tonique', 'boisson_ki', 'capsule_vie', 'lunettes', 'sabre', 'gants_cuir', 'plastron']);
}
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
  await say('Yamcha', "G-grr ! Bien sûr ! Prépare-toi, petit ! Puar, à l'attaque !");
  y.visible = false; p.visible = false;
  await Battle.start(['yamcha', 'puar'], { positions: [[y.x, y.y], [p.x, p.y]], music: 'boss' });
  y.visible = true; p.visible = true;
  Game.flags.yamcha = true; Game.flags.met_yamcha = true;
  await say('Yamcha', "Tu... tu es vraiment fort, petit. Je n'avais jamais perdu !");
  await say('Yamcha', "Je voulais vous voler vos boules pour faire un vœu... Ne plus être paralysé devant les filles. Ridicule, hein ?");
  await say('Yamcha', "Méfiez-vous : l'empereur Pilaf cherche lui aussi les boules. Son château est au nord du désert... Et le Mont Frypan, à l'est, crache du feu depuis des semaines.");
  const r = await ask('Goku', '(Yamcha baisse la tête, rouge de honte.)', ['Viens avec nous, Yamcha !', 'Retourne dans ton désert, voleur !']);
  if (r === 0) {
    await say('Yamcha', "Avec vous ? Avec... elle ? Je... euh... d'accord ! Le loup du désert vous suivra !");
    await say('Puar', "Youpi ! Je viens aussi, Yamcha !");
    if ((Game.aff.bulma || 0) >= 1 || Game.flags.yamchaHope) await say('Bulma', 'Hi hi, il est mignon quand il rougit...');
    Game.flags.yamchaJoined = true;
    Game.addAff('yamcha', 2, true);
    p.gone = true;
    await joinParty('yamcha', y);
  } else {
    await say('Yamcha', '...Tu as raison. Puar, on s\'en va. Mais on se reverra... Bulma !');
    Game.addKarma(0);
    await Promise.all([Field.walkTo(y, y.x + 60, y.y - 40, 1.6), Field.walkTo(p, p.x + 60, p.y - 40, 1.6)]);
    y.gone = true; p.gone = true;
  }
  await say('Bulma', "Le radar indique une boule à l'est, sur le Mont Frypan. Les deux dernières sont sûrement chez ce Pilaf...");
  Game.setQuest('main', 'frypan');
}

// ---------------- Mont Frypan ----------------
MAPS.frypan = {
  name: 'Mont Frypan', music: 'volcano', ground: 'v', cliffTint: { a: '#5a4a48', b: '#3e3230', c: '#241a18', d: '#7a6058' }, tint: 'rgba(255,80,20,0.06)',
  rows: [
    REP('C', 36),
    'CCCCCCCCCCCCvvvvvvvvvCCCCCCCCCCCCCCC',
    'CCCCCCCCCCCvvvvvvvvvvvCCCCCCCvvvvCCC',
    'CCCCCCCCCCvv#######vvvvCCCCvv###vvCC',
    'CCCCCCCCCvvv#######vvvvvvvvvv#v#vvCC',
    'CCCCCCCCvvYv#######vvYvvvvvvvvvvvvCC',
    'CCCCCCCvvvvv#######vvvvvvvvYvvvvvvCC',
    'CCCCCCvvvvvv#######vvvvvvvvvvvvvvvCC',
    'CCCCCvvvYvvvvvvpvvvvvvvvvYvvvvvvvvCC',
    'CCCCvvvvvvvvvvvpvvvvvvvvvvvvvvvvvvCC',
    'CCCLLLLLLLLLLvvpvvLLLLLLLLLLLLLvvvCC',
    'CCLLLLLLLLLLLvvpvvLLLLLLLLLLLLLLvvCC',
    'CCvvvvvvYvvvvvvpvvvvvvvvvvvvvvvvvvCC',
    'CvvvRvvvvvvvvvvpvvvvvvYvvvvvRvvvvvCC',
    'ppppppppppppppppvvvvvvvvvvvvvvvvvvCC',
    'ppppppppppppppppvvvvvvvRvvvvvvvvvvCC',
    'CvvvvvYvvvvvvvvvvvvvvvvvvvvvvvYvvvCC',
    'CCvvvvvvvvvvRvvvvvvvvLLLLvvvvvvvvvCC',
    'CCCvvvvYvvvvvvvvvvvvLLLLLLvvvvYvvvCC',
    'CCCCvvvvvvvvvvvvvvvvvLLLLvvvvvvvvCCC',
    'CCCCCvvvvvvYvvvvvvvvvvvvvvvvvvvCCCCC',
    'CCCCCCCvvvvvvvvvvvvvvvvvvvvvvCCCCCCC',
    REP('C', 36),
  ],
  objects: [{ type: 'building', img: 'pagoda', x: 192, y: 16, cond: () => !Game.flags.castleDestroyed }, { type: 'building', img: 'cave', x: 460, y: 40 }],
  entities: () => [
    warp(0, 14, 1, 2, 'desert', 38, 14.5, 'left'),
    warp(30, 4, 1, 1, 'volcan', 14.5, 28, 'up'),
    savePt(3, 16),
    chest('fry1', 32, 12, 'super_tonique', 2),
    chest('fry2', 3, 12, 'capsule_vie'),
    npc('gyumao', null, 15.5, 8, gyumaoTalk, { mon: 'gyumao', box: [-14, -10, 28, 10] }),
    npc('chichi_npc', 'chichi', 18, 8.6, chichiTalk, { cond: () => Game.flags.metChichi && !Game.member('chichi') }),
    { kind: 'trigger', tx: 7, ty: 14, tw: 2, th: 2, cond: () => !Game.flags.metChichi, once: true, run: chichiEvent },
    fire(12, 7, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.4),
    fire(18, 7, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.4),
    fire(13, 4, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.2),
    fire(17, 4, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.2),
    fire(15, 2, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.6),
    fire(14, 6, () => !Game.flags.fireOut && !Game.flags.castleDestroyed, 1.0),
    foe(24, 13, ['salamandre']),
    foe(8, 17, ['follet', 'follet']),
    foe(27, 8, ['golem']),
    foe(27, 19, ['salamandre', 'follet']),
    foe(6, 9, ['salamandre_bleue']),
  ],
  patch() { // ruines du château
    if (Game.flags.castleDestroyed) for (let y = 3; y <= 7; y++) for (let x = 12; x <= 18; x++) Field.setTile(x, y, (x + y) % 3 === 0 ? 'R' : 'v');
  },
  async onEnter() {
    if (Game.flags.camp2) return;
    Game.flags.camp2 = true;
    await Field.run(async () => {
      await campScene(2);
      await chapterCard('ch5', 'Chapitre 5', 'Le Mont Frypan');
      await say('Bulma', "Quelle chaleur ! Regardez, là-haut... C'est un château ! Il est en feu !");
    });
  },
};
async function chichiEvent() {
  const c = Field.addEntity({ kind: 'npc', id: 'chichi_tmp', sprite: 'chichi', x: 12 * 16 + 8, y: 14 * 16 + 14, dir: 'left' });
  SND.sfx('jump');
  await Field.jump(c, 14, 18);
  await say('???', "Halte, bandits ! Vous n'irez pas plus loin ! Je suis Chichi, la fille du roi Gyumao !");
  Game.flags.metChichi = true;
  const r = await ask('Goku', '(La fillette pointe la lame de son casque vers vous...)', ["On n'est pas des bandits !", "Un combat ? D'accord !"]);
  if (r === 1) {
    c.visible = false;
    const res = await Battle.start(['chichi'], { positions: [[c.x, c.y]], music: 'boss', canFlee: false, spar: true });
    c.visible = true;
    await say('Chichi', res === 'lose' ? "Ha ! Je t'ai battu ! ... Mais tu es plutôt fort, pour un bandit." : 'Aïe... Tu es drôlement fort ! Plus fort que tous les garçons que je connais...');
  } else {
    await say('Chichi', "Ah bon ? ... C'est vrai que vous n'avez pas l'air méchants. Surtout toi, avec ta queue de singe !");
    Game.addAff('chichi', 1, true);
  }
  await say('Chichi', "Snif... Papa a besoin d'aide ! Notre château brûle depuis des semaines. Un esprit de feu s'est réveillé dans le volcan !");
  await say('Chichi', 'Dis... Tu es fort, et gentil. Quand on sera grands... tu voudras bien m\'épouser ?');
  const m = await ask('Goku', "(Épouser ? C'est quoi, ça ?)", ["D'accord ! C'est quoi, épouser ? Ça se mange ?", 'On verra quand on sera grands !', 'Euh... non merci !']);
  if (m === 0) {
    Game.flags.chichiPromise = true; Game.addAff('chichi', 2);
    await say('Chichi', "Kyaaa ! Il a dit oui ! C'est promis, hein ? Promis-promis !");
    await say('Bulma', "Goku... tu ne sais même pas ce que ça veut dire. Ça va te retomber dessus un jour, crois-moi.");
  } else if (m === 1) {
    Game.addAff('chichi', 1);
    await say('Chichi', 'Hi hi ! Alors je vais m\'entraîner pour devenir la plus jolie et la plus forte !');
  } else {
    Game.addAff('chichi', -1);
    await say('Chichi', 'Hmpf ! Tu le regretteras, Goku !');
  }
  await say('Chichi', 'Venez, Papa est devant le château !');
  await Field.walkTo(c, 15 * 16 + 8, c.y, 1.8);
  await Field.walkTo(c, 18 * 16 + 8, 8 * 16 + 24, 1.8);
  c.gone = true;
  Field.addEntity({ kind: 'npc', id: 'chichi_npc', sprite: 'chichi', x: 18 * 16 + 8, y: 8 * 16 + 24, talk: chichiTalk });
}
async function chichiTalk(e) {
  if (Game.flags.ch8 && !Game.member('chichi')) { await Heroes.recruitChichi(e); return; }
  if (Game.flags.fireOut) await say('Chichi', Game.flags.chichiPromise ? "Goku, n'oublie pas ta promesse ! Je t'attendrai !" : 'Merci, Goku ! Papa est tellement heureux !');
  else if (Game.flags.castleDestroyed) await say('Chichi', 'Hmpf ! Tu as détruit notre maison ! Je ne te parle plus !');
  else await say('Chichi', "L'Esprit du Volcan vit tout au fond de la grotte, à l'est. Sois prudent, Goku...");
}
async function gyumaoTalk() {
  if (Game.flags.fireOut) {
    if (!Game.hasBall(6)) return gyumaoReward();
    await say('Gyumao', 'Ohhh, mes amis ! Mon château est sauvé grâce à vous ! Revenez quand vous voulez, il y aura toujours un festin pour vous !');
    return;
  }
  if (Game.flags.castleDestroyed) { await say('Gyumao', "Mon château... Bouhouhou... Au moins, le feu est parti avec..."); return; }
  if (Game.flags.acceptedVolcano) { await say('Gyumao', "L'entrée du volcan est dans la grotte, à l'est. Je compte sur vous !"); return; }
  await say('Gyumao', 'Ohhh... Mon château ! Mon beau château ! Le feu de l\'Esprit du Volcan ne s\'éteint jamais...');
  await say('Gyumao', "Vous cherchez la Boule de Cristal ? Elle est tout en haut, dans la salle du trésor. Mais personne ne peut entrer dans ces flammes !");
  Game.setQuest('gyumao', 'start');
  const r = await ask('Goku', '(Que faire ?)', ["On va vaincre l'Esprit du Volcan !", 'Je souffle tout avec un Kamehameha !']);
  if (r === 0) {
    await say('Gyumao', "Vraiment ? Ohhh, merci ! L'entrée du volcan est dans la grotte, à l'est. Soyez prudents !");
    Game.flags.acceptedVolcano = true; Game.addKarma(1);
    return;
  }
  await say('Bulma', 'Goku, attends ! Tu vas tout détruire !');
  await say('Goku', 'Ka... mé... ha... mé...');
  const g = L();
  SND.sfx('charge');
  Field.effects.push({ type: 'charge', x: g.x, y: g.y - 30, t: 40 });
  await wait(40);
  await say('Goku', 'HAAAAA !');
  SND.sfx('beam');
  Field.effects.push({ type: 'beam', x1: g.x, y1: g.y - 30, x2: 15 * 16 + 8, y2: 2 * 16, t: 60, life: 60 });
  Game.shake = 50;
  SND.sfx('thunder');
  await wait(40);
  UI.fade.color = '#ffffff'; UI.fade.v = 1;
  Game.flags.castleDestroyed = true;
  MAPS.frypan.patch();
  Field.rebuild();
  for (const e of Field.entities) if (e.kind === 'fire') e.gone = true;
  await UI.fadeTo(0, 40); UI.fade.color = '#000';
  await say(null, 'Le château de Gyumao a disparu... Une petite boule orange retombe du ciel, encore fumante.');
  await getBall(6);
  await say('Gyumao', 'M... mon château... Il n\'en reste rien... Bouhouhou...');
  Game.addAff('chichi', -2); Game.addKarma(-2);
  Game.setQuest('gyumao', 'detruit');
  Game.setQuest('main', 'chateau');
  await say('Bulma', "Goku ! Tu avais promis de ne pas faire de bêtises ! ... Bon. Allons chez Pilaf, au nord du désert. Et vite, avant que Gyumao se fâche !");
}
async function gyumaoReward() {
  await say('Gyumao', "Le feu est éteint ! Le feu est ÉTEINT ! Vous êtes des héros ! Voici la Boule de Cristal, et toute ma gratitude !");
  await getBall(6);
  await getItem('senzu', 2);
  await say('Gyumao', 'Et prends aussi ce casque de ma famille. Il te portera chance, petit !');
  await getItem('casque');
  if (Game.flags.metChichi) { await say('Chichi', 'Goku, tu es le plus fort ! Je savais que tu y arriverais !'); Game.addAff('chichi', 1, true); }
  Game.setQuest('main', 'chateau');
  await say('Bulma', "Plus que deux boules, et elles sont chez ce fameux Pilaf. Direction le château, au nord du désert !");
}

// ---------------- Cœur du volcan ----------------
MAPS.volcan = {
  name: 'Cœur du Volcan', music: 'volcano', ground: 'v', cliffTint: { a: '#4a3a38', b: '#2e2422', c: '#180e0c', d: '#6a4a40' }, tint: 'rgba(255,60,0,0.1)',
  rows: [
    REP('C', 30),
    'CCCCCCCCCvvvvvvvvvvvvCCCCCCCCC',
    'CCCCCCCCvvvvvvvvvvvvvvCCCCCCCC',
    'CCCCCCCvvLLvvvvvvvvLLvvCCCCCCC',
    'CCCCCCCvvLLvvvvvvvvLLvvCCCCCCC',
    'CCCCCCCCvvvvvvvvvvvvvvCCCCCCCC',
    'CCCCCCCCCCCvvvvvvvvCCCCCCCCCCC',
    'CCCCCCCCCCCCvvvvvvCCCCCCCCCCCC',
    'CCCLLLLLLCCCCvvvvCCCCLLLLLLCCC',
    'CCLLLLLLLLLCCvvvvCCLLLLLLLLLCC',
    'CCLLvvvvLLLLvvvvvvLLLLvvvvLLCC',
    'CCLvvvvvvLLLvvvvvvLLLvvvvvvLCC',
    'CCvvvvvvvvLLLvvvvLLLvvvvvvvvCC',
    'CCvvvRvvvvvvvvvvvvvvvvvRvvvvCC',
    'CCvvvvvvvvvvvvvvvvvvvvvvvvvvCC',
    'CCCvvvvvvLLLLLLLLLLLLvvvvvvCCC',
    'CCCCvvvvvLLLLLLLLLLLLvvvvvCCCC',
    'CCCCCvvvvvvvvvvvvvvvvvvvvCCCCC',
    'CCCCCCvvvvvvvvvvvvvvvvvvCCCCCC',
    'CCCCCCCCvvvvLLLLLLvvvvCCCCCCCC',
    'CCCCCCCvvvvLLLLLLLLvvvvCCCCCCC',
    'CCCCCCvvvvLLLLLLLLLLvvvvCCCCCC',
    'CCCCCCvvvvvvLLLLLLvvvvvvCCCCCC',
    'CCCCCCCvvvvvvvvvvvvvvvvCCCCCCC',
    'CCCCCCCCCCvvvvvvvvvvCCCCCCCCCC',
    'CCCCCCCCCCCCvvvvvvCCCCCCCCCCCC',
    'CCCCCCCCCCCCCvvvvCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCvvvvCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCvvCCCCCCCCCCCCCC',
    'CCCCCCCCCCCCCCvvCCCCCCCCCCCCCC',
  ],
  entities: () => [
    warp(14, 29, 2, 1, 'frypan', 30, 5.2, 'down'),
    savePt(15, 8),
    chest('vol1', 4, 11, 'senzu'),
    chest('vol2', 25, 11, 'capsule_vie', 2),
    foe(8, 20, ['golem']),
    foe(22, 17, ['salamandre', 'salamandre']),
    foe(5, 14, ['follet', 'follet', 'follet']),
    foe(24, 13, ['salamandre_bleue', 'follet']),
    foe(14, 13, ['golem', 'follet']),
    npc('esprit', null, 14.5, 3, null, { mon: 'volcan', cond: () => !Game.flags.volcanBoss, box: [-18, -10, 36, 10] }),
    { kind: 'trigger', tx: 11, ty: 6, tw: 8, th: 1, cond: () => !Game.flags.volcanBoss, once: true, run: volcanEvent },
    fire(9, 1, null, 1.2), fire(20, 1, null, 1.2),
  ],
  glow: true,
};
async function volcanEvent() {
  const e = Field.ent('esprit');
  SND.sfx('roar'); Game.shake = 20;
  await say('Esprit du Volcan', 'QUI OSE TROUBLER MON SOMMEIL DE FEU ? CE MONDE SERA RÉDUIT EN CENDRES !');
  await say('Goku', "C'est toi qui brûles le château de Gyumao ? Je vais t'éteindre !");
  e.visible = false;
  await Battle.start(['volcan'], { positions: [[e.x, e.y]], music: 'boss' });
  e.gone = true;
  Game.flags.volcanBoss = true;
  SND.sfx('thunder');
  await say(null, "L'Esprit du Volcan se dissipe dans un dernier rugissement. Le grondement de la montagne s'apaise enfin...");
  if (Game.flags.castleDestroyed) {
    await say('Bulma', "Si seulement on avait fait ça plus tôt... Le château de Gyumao serait encore debout.");
    await getItem('senzu');
    return;
  }
  Game.flags.fireOut = true;
  Game.setQuest('gyumao', 'done'); Game.addKarma(1); Game.addAff('chichi', 1, true);
  await UI.fadeTo(1, 30);
  Field.load('frypan', 15.5, 9.5, 'up');
  await UI.fadeTo(0, 30);
  await gyumaoReward();
}

// ---------------- Château de Pilaf (cour) ----------------
MAPS.chateau = {
  name: 'Château de Pilaf', music: 'castle', ground: 'c', night: true,
  rows: [
    REP('X', 11) + REP('#', 10) + REP('X', 11),
    REP('X', 11) + REP('#', 10) + REP('X', 11),
    REP('X', 11) + REP('#', 10) + REP('X', 11),
    'X' + REP('c', 10) + REP('#', 10) + REP('c', 10) + 'X',
    'X' + 'ccIcccccIc' + REP('#', 10) + 'cIcccccIcc' + 'X',
    'X' + REP('c', 10) + REP('#', 10) + REP('c', 10) + 'X',
    'X' + REP('c', 10) + REP('#', 10) + REP('c', 10) + 'X',
    'X' + REP('c', 10) + '####cc####' + REP('c', 10) + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + 'ccI' + REP('c', 11) + 'mm' + REP('c', 11) + 'Icc' + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + 'c.....' + REP('c', 8) + 'mm' + REP('c', 8) + '.....c' + 'X',
    'X' + 'c.n..n' + REP('c', 8) + 'mm' + REP('c', 8) + 'n..n.c' + 'X',
    'X' + 'c.....' + REP('c', 8) + 'mm' + REP('c', 8) + '.....c' + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + 'ccI' + REP('c', 11) + 'mm' + REP('c', 11) + 'Icc' + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + 'c.....' + REP('c', 8) + 'mm' + REP('c', 8) + '.....c' + 'X',
    'X' + 'cn.n.n' + REP('c', 8) + 'mm' + REP('c', 8) + 'n.n.nc' + 'X',
    'X' + 'c.....' + REP('c', 8) + 'mm' + REP('c', 8) + '.....c' + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + 'ccI' + REP('c', 11) + 'mm' + REP('c', 11) + 'Icc' + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    'X' + REP('c', 14) + 'mm' + REP('c', 14) + 'X',
    REP('X', 15) + 'mm' + REP('X', 15),
    REP('X', 15) + 'mm' + REP('X', 15),
    'dddRdddddddddddddddddddddddkdddd',
    REP('C', 15) + 'dd' + REP('C', 15),
  ],
  objects: [{ type: 'building', img: 'castle', x: 176, y: 0 }],
  entities: () => [
    warp(15, 7, 2, 1, 'trone', 8.5, 12, 'up'),
    warp(15, 27, 2, 1, 'desert', 8.5, 1, 'down'),
    savePt(6, 9),
    chest('chateau1', 2, 4, 'armure'),
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
      await chapterCard('ch6', 'Chapitre 6', "L'empereur Pilaf");
      await say('Bulma', "Le château de Pilaf... Le radar indique deux boules à l'intérieur !");
      if (has('krillin')) await say('Krilin', 'Il y a des robots partout. Restons groupés !');
      if (Game.flags.spiesChased) await say('Bulma', "Le plan des espions montre des cachots sous le château... Espérons qu'on n'y finira pas !");
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
    { kind: 'trigger', tx: 1, ty: 9, tw: 16, th: 1, cond: () => !Game.flags.captured, once: true, run: trapEvent },
    { kind: 'trigger', tx: 1, ty: 9, tw: 16, th: 1, cond: () => Game.flags.escaped && !Game.flags.pilaf, once: true, run: pilafEvent },
  ],
};
async function trapEvent() {
  await say('Pilaf', "Ha ha ha ha ! Bienvenue, misérables voleurs ! Je suis l'empereur Pilaf, le futur maître du monde !");
  if (Game.flags.shadyBought) {
    await say('Mai', "Au fait, merci pour les 200 Zénis, petits naïfs ! Hi hi !");
    await say('Bulma', "La marchande louche du village ! C'était TOI ?! Rends-moi mon argent !");
  }
  if (Game.flags.spiesChased) await say('Shu', "Majesté, ce sont eux qui nous ont attaqués dans la forêt !");
  await say('Pilaf', 'Vos Boules de Cristal m\'intéressent beaucoup... Shu ! ACTIVE LA TRAPPE !');
  await say('Goku', 'Hein ? Quelle trap...');
  SND.sfx('thunder'); Game.shake = 30;
  await UI.fadeTo(1, 20, '#ffffff');
  Game.takeBalls([2, 3, 4, 5, 6]);
  Game.flags.captured = true;
  Game.setQuest('main', 'evasion');
  UI.fade.color = '#000';
  Field.load('cellule', 3.5, 3, 'down');
  await wait(30);
  await UI.fadeTo(0, 40);
  await escapeEvent();
}

// ---------------- Cachots ----------------
MAPS.cellule = {
  name: 'Cachots du château', music: 'castle', ground: 'c',
  rows: [
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XccccccXXccccccX',
    'XccccccXXccccccX',
    'XccccccXXccccccX',
    'XHHHHHHXXHHHHHHX',
    'XccccccccccccccX',
    'XccccccccccccccX',
    'XXXXXXXXXXXXXXcX',
    'XXXXXXXXXXXXXXcX',
  ],
  objects: [{ type: 'prop', img: 'paille', x: 24, y: 34 }, { type: 'prop', img: 'paille', x: 168, y: 34 }],
  patch() {
    if (Game.flags.escaped) for (let x = 1; x <= 6; x++) Field.setTile(x, 5, 'c');
    if (Game.flags.escaped && Game.flags.oolongJoined) for (let x = 9; x <= 14; x++) Field.setTile(x, 5, 'c');
  },
  entities: () => [
    warp(14, 9, 1, 1, 'trone', 8.5, 12, 'up'),
    npc('oolong_cell', 'oolong', 12, 3, null, { cond: () => Game.flags.oolongJailed && !Game.flags.oolongJoined }),
  ],
};
async function escapeEvent() {
  await say('Bulma', "Aïe, ma tête... Où sommes-nous ? ... NON ! Ils nous ont pris toutes les Boules de Cristal !");
  await say('Goku', "Ce Pilaf ! Il faut sortir d'ici, et vite !");
  const neighbor = Field.ent('oolong_cell');
  if (neighbor) await say('Oolong', "Psst ! C'est moi, Oolong ! Les villageois m'ont vendu à Pilaf comme cuisinier... Je peux vous aider à sortir, mais à une condition : vous m'emmenez !");
  const opts = [];
  if (has('oolong')) opts.push(['oolong', 'Oolong : se transformer en clé']);
  else if (neighbor) opts.push(['oolong2', "Accepter l'aide d'Oolong"]);
  if (has('yamcha')) opts.push(['yamcha', 'Yamcha : crocheter la serrure']);
  if (Game.items.carte) opts.push(['carte', 'Utiliser le plan des espions']);
  opts.push(['kame', 'Goku : Kamehameha sur les barreaux !']);
  const r = await ask('Goku', '(Comment s\'échapper ?)', opts.map(o => o[1]));
  const choice = opts[r][0];
  let loud = false;
  if (choice === 'oolong') {
    await say('Oolong', 'Laissez faire le maître... TRANSFORMATION... en clé !');
    Field.effects.push({ type: 'smoke', x: 3.5 * 16 + 8, y: 5 * 16 + 4, t: 30 });
    SND.sfx('door');
    await say('Bulma', "Bravo, Oolong ! Pour une fois, tes bêtises de métamorphose servent à quelque chose !");
    Game.addAff('oolong', 1);
  } else if (choice === 'oolong2') {
    await say('Oolong', "Marché conclu ! TRANSFORMATION... en clé ! Et hop, je me glisse dans votre serrure !");
    SND.sfx('door');
    Game.flags.oolongJoined = true; Game.addKarma(1);
    for (let x = 9; x <= 14; x++) Field.setTile(x, 5, 'c');
    Field.rebuild();
    await joinParty('oolong', neighbor);
    await say('Oolong', "Je vous suis ! Et cette fois, je serai sage... à peu près.");
  } else if (choice === 'yamcha') {
    await say('Yamcha', "Un loup du désert sait crocheter une serrure en trois secondes. Regardez bien !");
    SND.sfx('door');
    await say('Bulma', 'Wow, Yamcha ! Tu es plein de surprises !');
    Game.addAff('yamcha', 1); Game.addAff('bulma', 1, true);
  } else if (choice === 'carte') {
    await say('Bulma', "D'après le plan des espions, il y a un passage secret derrière la paille ! Une brique qui bouge... Là !");
    SND.sfx('door');
    Game.flags.secretPassage = true;
  } else {
    await say('Goku', 'Ka... mé... ha... mé... HAAAA !');
    SND.sfx('beam'); Game.shake = 30;
    await wait(30);
    loud = true;
  }
  for (let x = 1; x <= 6; x++) Field.setTile(x, 5, 'c');
  Field.rebuild();
  Game.flags.escaped = true;
  Game.setQuest('main', 'chateau');
  if (loud) {
    SND.sfx('encounter');
    await say('Soldat', "ALERTE ! Les prisonniers s'évadent !");
    await Battle.start(['soldat', 'soldat', 'robot'], {});
    await say('Goku', 'Allez, on fonce dans la salle du trône !');
  } else {
    await say('Goku', "Chut... Allons reprendre les boules à ce Pilaf, sans faire de bruit !");
    if (Game.flags.secretPassage) {
      await UI.fadeTo(1, 20);
      Field.load('trone', 8.5, 11, 'up');
      await UI.fadeTo(0, 20);
    }
  }
}
async function pilafEvent() {
  const p = Field.ent('pilaf'), s = Field.ent('shu'), m = Field.ent('mai');
  await say('Pilaf', "QUOI ?! Comment êtes-vous sortis de mes cachots ?! ... Peu importe ! J'ai maintenant les SEPT Boules de Cristal !");
  await say('Mai', 'Majesté, ils vont tout gâcher !');
  await say('Pilaf', 'Shu ! Mai ! Activez la PILAF MACHINE ! Écrasez ces vermisseaux !');
  await say('Shu', 'Tout de suite, Majesté !');
  SND.sfx('thunder');
  Game.shake = 30;
  const mach = Field.addEntity({ kind: 'npc', id: 'mach', x: p.x, y: p.y + 30, mon: 'machine', solid: false });
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
  await say('Pilaf', "C'est impossible ! Ma magnifique machine... Battue par des enfants !");
  await say('Pilaf', "Mais vous arrivez trop tard ! Les boules sont dans la cour ! Je vais invoquer Shenron TOUT DE SUITE ! Ha ha ha !");
  await Promise.all([Field.walkTo(p, p.x, p.y + 140, 2.4), Field.walkTo(s, s.x, s.y + 140, 2.4), Field.walkTo(m, m.x, m.y + 140, 2.4)]);
  p.gone = true; s.gone = true; m.gone = true;
  await say('Bulma', 'Il va faire son vœu ! Vite, Goku, dans la cour !');
  await Main.shenronFinale();
}
