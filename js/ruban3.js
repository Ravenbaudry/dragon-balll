// Arc du Ruban Rouge, 3e partie : chapitre 13 (l'assaut du quartier général), le palais de Baba la voyante
// (cinq combattants et un mystérieux masqué), puis Shenron et la fin de l'arc.
const Ruban3 = (() => {
  const TS = 16;
  const say = (w, t) => UI.say(w, t);
  const ask = (w, t, c, o) => UI.ask(w, t, c, o);
  const L = () => Field.leader();
  const has = id => !!Game.member(id);
  const R = Ruban;

  // ---------------- Ennemis, objets ----------------
  Object.assign(ENEMIES, {
    soldat_elite: { name: 'Soldat d\'Élite', char: 'soldat_rr', hp: 560, atk: 80, def: 36, spd: 18, xp: 210, zeni: 90, drop: ['super_tonique', 0.18], skills: [{ name: 'Rafale de Mitraillette', target: 'all', pow: 0.65, chance: 0.22 }, { name: 'Grenade', target: 'all', pow: 0.8, chance: 0.12, st: 'burn', sc: 0.3 }] },
    robot_rr: { res: { phys: 0.8, ki: 1.2 }, immune: ['poison', 'sleep'], name: 'Robot de Combat', char: 'metallique', hp: 640, atk: 82, def: 42, spd: 12, xp: 230, zeni: 80, drop: ['boisson_ki', 0.2], skills: [{ name: 'Laser', target: 'one', pow: 1.5, chance: 0.25 }] },
    black: { name: 'Officier Black', char: 'black', hp: 2800, atk: 84, def: 36, spd: 24, xp: 1200, zeni: 600, boss: true,
      skills: [{ name: 'Rafale du Pistolet', target: 'one', pow: 0.5, hits: 4, chance: 0.25 }, { name: 'Coup de Crosse', target: 'one', pow: 1.7, chance: 0.2 }] },
    armure: { res: { phys: 0.85, ki: 1.15 }, immune: ['poison', 'sleep'], name: 'Armure de Combat', spr: 'armure', hp: 5200, atk: 86, def: 42, spd: 13, xp: 3200, zeni: 2000, boss: true, big: true,
      skills: [{ name: 'Missiles', target: 'all', pow: 1.1, chance: 0.26, st: 'burn', sc: 0.25 }, { name: 'Canon Laser', target: 'one', pow: 2.3, chance: 0.14, beam: true, c1: '#e83030', c2: '#ffb0a0' }, { name: 'Poing Mécanique', target: 'one', pow: 1.9, chance: 0.22 }] },
    // les cinq combattants de Baba
    dracula: { immune: ['sleep'], name: 'Dracula Man', char: 'dracula', hp: 3000, atk: 82, def: 32, spd: 26, xp: 1100, zeni: 0, boss: true,
      skills: [{ name: 'Morsure du Vampire', target: 'one', pow: 1.4, chance: 0.3, drain: 0.06 }, { name: 'Nuée de Chauves-souris', target: 'all', pow: 0.8, chance: 0.2 }] },
    invisible: { name: 'L\'Homme Invisible', char: 'invisible', hp: 2600, atk: 80, def: 30, spd: 30, xp: 1100, zeni: 0, boss: true, hidden: true,
      skills: [{ name: 'Coups Invisibles', target: 'one', pow: 0.5, hits: 4, chance: 0.3 }] },
    momie: { immune: ['poison', 'sleep'], res: { phys: 0.85 }, name: 'La Momie', char: 'momie', hp: 4200, atk: 88, def: 44, spd: 14, xp: 1300, zeni: 0, boss: true,
      skills: [{ name: 'Bandelettes', target: 'one', pow: 1.0, chance: 0.28, st: 'stun', sc: 0.5 }, { name: 'Poing Millénaire', target: 'one', pow: 1.9, chance: 0.2 }] },
    diable: { name: 'Akkuman', char: 'diable', hp: 3600, atk: 84, def: 36, spd: 22, xp: 1400, zeni: 0, boss: true,
      skills: [{ name: 'Rayon Diabolique', target: 'all', pow: 2.6, chance: 0.3, beam: true, pure: true, c1: '#c020c0', c2: '#ffa0ff' }, { name: 'Griffes du Diable', target: 'one', pow: 1.6, chance: 0.2 }] },
    gohan_m: { name: 'Combattant masqué', char: 'gohan_m', hp: 4600, atk: 88, def: 40, spd: 26, xp: 2500, zeni: 0, boss: true, yieldAt: 0.35, yieldMsg: 'Le combattant masqué baisse sa garde...',
      skills: [{ name: 'Bâton Magique', target: 'one', pow: 1.8, chance: 0.25 }, { name: 'Pierre-Feuille-Ciseaux', target: 'one', pow: 1.6, chance: 0.2, st: 'stun', sc: 0.3 }, { name: 'Kamehameha', target: 'one', pow: 2.1, chance: 0.14, beam: true }] },
  });
  ITEMS.carte_rr = { name: 'Carte d\'accès', desc: 'La carte magnétique d\'un officier du Ruban Rouge. Elle ouvre le bureau du commandant.', key: true };
  Object.assign(GEAR, {
    talisman: { slot: 'acc', name: 'Talisman de Grand-père', desc: 'Offert par Grand-père Gohan. PV +60, Force et Défense +4, et une fois par combat, il ranime avec la moitié des PV.', stats: { hp: 60, atk: 4, def: 4 }, fx: 'revive', price: 0 },
    medaille_rr: { slot: 'acc', name: 'Médaille du Ruban Rouge', desc: 'Trouvée dans le bureau du commandant Red. Force +5, Vitesse +3.', stats: { atk: 5, spd: 3 }, price: 0 },
  });

  // ---------------- Décors ----------------
  R.BUILD.qg_base = () => { // la façade du quartier général
    const w = 288, h = 100, c = GFX.mk(w, h), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(0, 22, w, h - 22);
    x.fillStyle = '#8a90a0'; x.fillRect(1, 23, w - 2, h - 24);
    for (let y = 30; y < h - 4; y += 8) { x.fillStyle = '#7a8090'; x.fillRect(1, y, w - 2, 1); }
    x.fillStyle = K; x.fillRect(0, 14, w, 12); x.fillStyle = '#c82828'; x.fillRect(1, 15, w - 2, 10); x.fillStyle = '#e85050'; x.fillRect(1, 15, w - 2, 2);
    for (const wx of [20, 52, 84, 196, 228, 260]) { x.fillStyle = K; x.fillRect(wx - 1, 38, 16, 14); x.fillStyle = '#f0d878'; x.fillRect(wx, 39, 14, 12); x.fillStyle = '#c0a850'; x.fillRect(wx + 6, 39, 2, 12); }
    // le grand ruban rouge
    x.fillStyle = K; x.fillRect(118, 28, 52, 30); x.fillStyle = '#f0f0f0'; x.fillRect(119, 29, 50, 28);
    x.fillStyle = '#d82828'; x.beginPath(); x.ellipse(134, 40, 10, 7, -0.3, 0, 7); x.fill(); x.beginPath(); x.ellipse(154, 40, 10, 7, 0.3, 0, 7); x.fill();
    x.fillRect(140, 37, 8, 8); x.fillRect(136, 44, 5, 11); x.fillRect(147, 44, 5, 11);
    // porte
    x.fillStyle = K; x.fillRect(127, h - 28, 34, 28); x.fillStyle = '#4a5060'; x.fillRect(128, h - 27, 32, 27); x.fillStyle = '#6a7080'; x.fillRect(143, h - 27, 2, 27);
    // tours radar
    for (const tx of [6, w - 22]) { x.fillStyle = K; x.fillRect(tx, 0, 16, 24); x.fillStyle = '#a0a6b6'; x.fillRect(tx + 1, 1, 14, 22); x.fillStyle = '#d82828'; x.fillRect(tx + 6, 3, 4, 4); }
    return c;
  };
  R.BUILD.palais_baba = () => { // le palais de la voyante : bulbes et boule de cristal
    const w = 160, h = 96, c = GFX.mk(w, h), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(10, 40, w - 20, h - 40); x.fillStyle = '#d8c8e8'; x.fillRect(11, 41, w - 22, h - 42);
    for (const [cx, r] of [[40, 16], [80, 24], [120, 16]]) {
      x.fillStyle = K; x.beginPath(); x.arc(cx, 44 - r * 0.3, r + 1, Math.PI, 0); x.fill(); x.fillRect(cx - 1, 44 - r * 1.6, 2, r);
      x.fillStyle = '#7a3aa8'; x.beginPath(); x.arc(cx, 44 - r * 0.3, r, Math.PI, 0); x.fill();
      x.fillStyle = '#a868d0'; x.beginPath(); x.arc(cx - r * 0.35, 44 - r * 0.5, r * 0.3, 0, 7); x.fill();
      x.fillStyle = '#f0c040'; x.beginPath(); x.arc(cx, 44 - r * 1.6, 3, 0, 7); x.fill();
    }
    for (const wx of [26, 50, 104, 128]) { x.fillStyle = K; x.beginPath(); x.arc(wx + 5, 58, 6, Math.PI, 0); x.fill(); x.fillRect(wx - 1, 58, 12, 14); x.fillStyle = '#4a2a6a'; x.beginPath(); x.arc(wx + 5, 58, 5, Math.PI, 0); x.fill(); x.fillRect(wx, 58, 10, 13); }
    x.fillStyle = K; x.beginPath(); x.arc(80, 76, 13, Math.PI, 0); x.fill(); x.fillRect(67, 76, 26, 20);
    x.fillStyle = '#2a1040'; x.beginPath(); x.arc(80, 76, 12, Math.PI, 0); x.fill(); x.fillRect(68, 76, 24, 20);
    return c;
  };
  let crystal = null;
  function crystalImg() { // Baba flotte sur sa boule de cristal
    if (crystal) return crystal;
    const c = GFX.mk(20, 16), x = c.getContext('2d');
    x.fillStyle = K; x.beginPath(); x.arc(10, 8, 8, 0, 7); x.fill();
    x.fillStyle = '#a8d8f0'; x.beginPath(); x.arc(10, 8, 7, 0, 7); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(6, 4, 3, 2); x.fillStyle = '#78b0d8'; x.beginPath(); x.arc(12, 10, 3, 0, 7); x.fill();
    return (crystal = c);
  }

  // =====================================================================
  // CHAPITRE 13 : l'assaut du QG du Ruban Rouge
  // =====================================================================
  const garde = (id, path, o = {}) => Modes.guard(id, path, Object.assign({ extra: { sprite: 'soldat_rr', cond: () => !Game.flags.qgDone } }, o));
  MAPS.qg = {
    name: 'QG du Ruban Rouge', music: 'castle', ground: 'c', get infiltration() { return !Game.flags.qgDone; }, tint: 'rgba(20,20,70,0.36)',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXcccc##################ccccXX',
      'XXcccc##################ccccXX',
      'XXcccc##################ccccXX',
      'XXcccc##################ccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccIccccccccccccccccccccIccXX',
      'XXccccXXccccccccccccccXXccccXX',
      'XXccccXXccccccIIccccccXXccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccXXccccccXXccccccccXX',
      'XXccccccccXXccccccXXccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccXXccccccccccccccccccXXccXX',
      'XXccXXccccccccccccccccccXXccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccIccccccccccccIccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXccccccccccccccccccccccccccXX',
      'XXXXXXXXXXXXXccccXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ],
    patch() { R.building('qg_base'); },
    objects: [{ type: 'building', img: 'qg_base', x: 6 * TS, y: 6 * TS - 100, sortY: 6 * TS - 4 }],
    entities: () => [
      warp(14, 6, 2, 1, 'qg_int', 11.5, 19, 'up'),
      ...[[3, 24], [26, 24], [9, 18], [20, 18], [5, 13], [24, 13], [14, 12], [8, 8], [21, 8]].map(([x, y], i) => Modes.hideSpot('caisse' + i, x, y)),
      garde('qg_g1', [[3, 11], [26, 11, 50]], { speed: 0.8 }),
      garde('qg_g2', [[26, 15], [3, 15, 50]], { speed: 0.9 }),
      garde('qg_g3', [[8, 20, 80], [21, 20, 80]], { speed: 0.6, look: 4 }),
      garde('qg_g4', [[11, 7, 90]], { look: 3.6 }),
      garde('qg_g5', [[18, 7, 90]], { look: 3.6 }),
    ],
    async onEnter() {
      Modes.onLoad();
      if (Game.flags.qgIntro) return;
      Game.flags.qgIntro = true;
      Game.flags.ch13 = true;
      await Field.run(async () => {
        await chapterCard('ch13card', 'Chapitre 13', 'L\'assaut du QG');
        await say(null, 'Des sirènes hurlent dans la nuit. Les projecteurs du quartier général balaient le ciel...');
        await say('Soldat du Ruban Rouge', '(haut-parleur) Alerte ! Un nuage jaune non identifié ! Escadrille, décollez !');
        await say('Goku', 'Ils nous ont repérés ! Kinto\'un, on remonte !');
        const rank = await Modes.skyBattle('ruban');
        if (rank > 0) await say('Goku', 'Escadrille du Ruban Rouge en miettes ! On redescend en douce...');
        else await say('Goku', 'Ouille ! Ils m\'ont fait tomber du nuage... Bon, au moins, je suis à l\'intérieur des murs !');
        await say(null, 'Infiltration : atteins la porte du quartier général sans te faire voir. Les caisses permettent de se cacher.');
        if (has('bulma')) await say('Bulma', 'Discrétion, Goku ! S\'ils donnent l\'alerte, ils vont cacher les boules.');
      });
    },
  };
  MAPS.qg_int = {
    name: 'QG du Ruban Rouge — Intérieur', music: 'castle', ground: 'c',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXmmmmmmmmmmXXXXXXX',
      'XXXXXXXmmmmmmmmmmXXXXXXX',
      'XXXXXXXmmmmmmmmmmXXXXXXX',
      'XXXXXXXmmmmmmmmmmXXXXXXX',
      'XXXXXXXXXXXmmXXXXXXXXXXX',
      'XXcccccccccmmcccccccccXX',
      'XXcccccccccmmcccccccccXX',
      'XXccXXXXXXXmmXXXXXXXccXX',
      'XXccXXXXXXXmmXXXXXXXccXX',
      'XXccccccXccmmccXccccccXX',
      'XXccccccXccmmccXccccccXX',
      'XXcccccccccmmcccccccccXX',
      'XXcccccccccmmcccccccccXX',
      'XXccccccXccmmccXccccccXX',
      'XXccccccXccmmccXccccccXX',
      'XXccXXXXXXXmmXXXXXXXccXX',
      'XXcccccccccmmcccccccccXX',
      'XXcccccccccmmcccccccccXX',
      'XXXXXXXXXXXmmXXXXXXXXXXX',
      'XXXXXXXXXXXmmXXXXXXXXXXX',
      'XXXXXXXXXXXmmXXXXXXXXXXX',
    ],
    objects: [{ type: 'prop', img: 'tv', x: 9 * TS, y: 1 * TS - 4 }, { type: 'prop', img: 'torch', x: 4 * TS, y: 5 * TS }, { type: 'prop', img: 'torch', x: 19 * TS, y: 5 * TS }],
    entities: () => [
      warp(11, 21, 2, 1, 'qg', 15, 25, 'up'),
      savePt(3, 7),
      { kind: 'npc', id: 'porte_bureau', x: 12 * TS, y: 5 * TS + 14, turn: false, box: [-16, -14, 32, 16], cond: () => !Game.flags.bureauOuvert, get img() { return bureauDoor(); }, talk: porteBureau },
      chest('qg_carte', 3, 11, 'carte_rr'),
      chest('qg_c1', 20, 11, 'super_tonique', 3),
      chest('qg_c2', 21, 14, 'boisson_ki', 3),
      npc('rouge', 'rouge', 11.5, 2, null, { cond: () => !Game.flags.qgDone, dir: 'down' }),
      npc('black', 'black', 14, 3, null, { cond: () => !Game.flags.qgDone, dir: 'left' }),
      { kind: 'trigger', tx: 9, ty: 4, tw: 6, th: 1, cond: () => !Game.flags.qgDone, run: bureauEvent },
      foe(5, 13, ['soldat_elite', 'soldat_elite']),
      foe(18, 12, ['robot_rr', 'soldat_elite']),
      foe(6, 17, ['soldat_elite', 'soldat_elite', 'soldat_elite']),
      foe(17, 7, ['robot_rr', 'robot_rr']),
    ],
  };
  let bureauC = null;
  function bureauDoor() {
    if (bureauC) return bureauC;
    const c = GFX.mk(32, 26), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(0, 0, 32, 26); x.fillStyle = '#8a3030'; x.fillRect(1, 1, 30, 24); x.fillStyle = '#a84848'; x.fillRect(1, 1, 30, 3);
    x.fillStyle = '#5a1818'; x.fillRect(15, 4, 2, 21); x.fillStyle = '#202430'; x.fillRect(22, 10, 6, 8); x.fillStyle = '#60e060'; x.fillRect(24, 12, 2, 2);
    return (bureauC = c);
  }
  async function porteBureau(e) {
    if (!Game.items.carte_rr) { await say(null, 'La porte du bureau du commandant. Un lecteur de carte clignote : « Accès réservé aux officiers. »'); return; }
    await say(null, 'Goku glisse la carte d\'accès dans le lecteur... Bip ! La porte coulisse.');
    Game.useItemStock('carte_rr');
    Game.flags.bureauOuvert = true;
    SND.sfx('door'); e.gone = true;
  }
  async function bureauEvent() {
    const red = Field.ent('rouge'), blk = Field.ent('black');
    await say('Commandant Red', 'Quoi ?! Un gamin, ici, dans mon bureau ?! Black ! Qu\'est-ce que fait la sécurité ?!');
    await say('Goku', 'C\'est toi, le chef du Ruban Rouge ? Rends-moi les boules de cristal !');
    await say('Commandant Red', 'Jamais ! Avec les sept boules, je vais enfin réaliser mon rêve...');
    await say('Officier Black', 'Votre rêve, commandant ? Dominer le monde, n\'est-ce pas ?');
    await say('Commandant Red', 'Le monde ? Pff ! Non, idiot. Je veux devenir... PLUS GRAND ! J\'en ai assez d\'être petit !');
    Field.emote(blk, '!');
    await say('Officier Black', '... Toute cette guerre, tous ces soldats... pour vos centimètres ? Vous êtes indigne de commander cette armée !');
    SND.sfx('bighit'); Game.shake = 10;
    await Tasks.tween(red, { x: red.x - 30 }, 10, 'out');
    red.gone = true;
    await say(null, 'D\'un coup terrible, Black envoie le commandant Red au tapis. Il ne se relèvera pas.');
    await say('Officier Black', 'C\'est moi qui commande, maintenant. Et je commence par écraser ce gamin !');
    blk.visible = false;
    await Battle.start(['black', 'soldat_elite'], { positions: [[blk.x, blk.y]], music: 'boss', canFlee: false });
    blk.visible = true;
    await say('Officier Black', 'Tu es coriace... Mais tu ne connais pas encore mon Armure de Combat !');
    SND.sfx('door'); Game.shake = 12;
    Field.effects.push({ type: 'smoke', x: blk.x, y: blk.y - 10, t: 40 });
    await say(null, 'Black saute dans une énorme armure robotisée qui surgit du plancher !');
    await Battle.start(['armure'], { positions: [[blk.x, blk.y]], music: 'boss', canFlee: false });
    blk.gone = true;
    SND.sfx('blast'); Game.shake = 24;
    await say(null, 'L\'Armure de Combat explose dans un fracas assourdissant ! L\'armée du Ruban Rouge n\'a plus de chef.');
    Game.flags.qgDone = true;
    await say('Goku', 'Les boules sont dans le coffre du commandant !');
    await R.rball(1);
    await R.rball(3);
    await getItem('medaille_rr');
    const c8 = Field.addEntity({ kind: 'npc', id: 'c8_qg', sprite: 'c8', x: 11.5 * TS + 8, y: 6 * TS + 14, dir: 'up' });
    await Field.walkTo(c8, 11.5 * TS + 8, 4 * TS + 14, 1.2);
    await say('C-8', 'Goku ! J\'ai appris que tu attaquais le quartier général... Je suis venu t\'aider ! ... Oh. C\'est déjà fini ?');
    await say('Goku', 'C-8 ! Hé hé, tu arrives juste à temps pour la fête !');
    c8.gone = true;
    await say('Goku', 'Six boules... Il manque la boule à quatre étoiles. Celle de Grand-père ! Le radar la montre tout à l\'ouest...');
    if (has('bulma')) await say('Bulma', 'À l\'ouest ? C\'est le palais de Baba, la voyante ! On dit qu\'elle retrouve tout ce qui est perdu... contre un prix.');
    Game.flags.vu_baba = true;
    Game.setQuest('ruban', 'baba');
    SND.sfx('levelup');
    await say(null, 'Fin du chapitre 13. Le palais de Baba apparaît sur la carte du Kinto\'un.');
  }

  // =====================================================================
  // BONUS : Baba la voyante et ses cinq combattants
  // =====================================================================
  const FIGHTERS = [
    { id: 'dracula', name: 'Dracula Man', intro: 'Dracula Man ! Le vampire de Transylvanie ! Attention, ses morsures lui rendent des forces...' },
    { id: 'invisible', name: 'L\'Homme Invisible', intro: 'L\'Homme Invisible ! On ne le voit pas... Une attaque sur tous les ennemis ou « Concentrer » permettra de le repérer !' },
    { id: 'momie', name: 'La Momie', intro: 'La Momie ! Trois mille ans de colère enroulés dans des bandelettes !' },
    { id: 'diable', name: 'Akkuman', intro: 'Akkuman ! Son Rayon Diabolique fait exploser ceux qui ont de mauvaises pensées... Seul un cœur pur n\'a rien à craindre !' },
    { id: 'gohan_m', name: 'Combattant masqué', intro: 'Et mon cinquième combattant... un mystérieux masqué venu de très, très loin !' },
  ];
  MAPS.baba = {
    name: 'Palais de Baba', music: 'tournoi', ground: '.', tint: 'rgba(90,30,120,0.12)',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.......##########.......T',
      'T..T....##########....T..T',
      'T.......##########.......T',
      'T.......##########.......T',
      'T.....cccccccccccccc.....T',
      'T.....cccccccccccccc.....T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~cccccccccccc~~~~~.T',
      'T.~~~~~~~~~~BB~~~~~~~~~~.T',
      'T.~~~~~~~~~~BB~~~~~~~~~~.T',
      'T.~~~~~~~~~~BB~~~~~~~~~~.T',
      'T.~~~~~~~~~~BB~~~~~~~~~~.T',
      'T.T....................T.T',
      'T....T..............T....T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    patch() { R.building('palais_baba'); },
    objects: [{ type: 'building', img: 'palais_baba', x: 8 * TS, y: 6 * TS - 96, sortY: 6 * TS - 4 }],
    entities: () => [
      savePt(4, 19),
      { kind: 'img', id: 'boule_baba', x: 12.5 * TS + 8, y: 7 * TS + 12, solid: false, get img() { return crystalImg(); } },
      npc('baba', 'baba', 12.5, 7, babaTalk, { dir: 'down', z: 10 }),
      npc('gohan_ami', 'gohan', 14.5, 7, () => say('Grand-père Gohan', 'Ho ho ! Tu es devenu un vrai guerrier, Goku. Je suis si fier de toi.'), { cond: () => !!Game.flags.babaDone && !Game.flags.gohanParti, dir: 'down' }),
    ],
    async onEnter() {
      if (Game.flags.babaIntro) return;
      Game.flags.babaIntro = true;
      await Field.run(async () => {
        await chapterCard('babacard', 'Bonus', 'Baba la voyante');
        await say('Goku', 'Ouah, quel drôle de palais... Et ce lac, il fait des bulles violettes !');
        await say('Baba', 'Hi hi hi ! Bienvenue au palais de Baba, la plus grande voyante du monde. Approche, petit, approche...');
      });
    },
  };
  async function babaTalk() {
    if (Game.flags.babaDone) { await say('Baba', 'Tu as battu mes cinq combattants... Personne n\'avait jamais fait ça. Reviens me voir quand tu veux, petit singe. Hi hi !'); return; }
    if (!Game.flags.babaAsk) {
      Game.flags.babaAsk = true;
      await say('Baba', 'Tu cherches la boule à quatre étoiles ? Je l\'ai, oui... Je l\'ai trouvée dans ma boule de cristal. Pour l\'avoir, il faut payer dix millions de Zénis...');
      await say('Goku', 'Dix millions ?! J\'ai même pas de quoi m\'acheter un bol de riz !');
      await say('Baba', '... ou bien vaincre mes cinq combattants, l\'un après l\'autre, sur l\'arène au-dessus du lac maudit. Hi hi hi ! Personne n\'y est jamais arrivé.');
    }
    const n = Game.flags.babaWins || 0;
    const r = await ask('Baba', n ? 'Tu as déjà vaincu ' + n + ' combattant' + (n > 1 ? 's' : '') + '. On continue ?' : 'Alors, tu acceptes le défi ?', ['Combattre !', 'Se préparer d\'abord'], { cancel: 1 });
    if (r !== 0) return;
    await Field.run(fights);
  }
  async function fights() {
    for (let i = Game.flags.babaWins || 0; i < FIGHTERS.length; i++) {
      const F = FIGHTERS[i];
      await UI.fadeTo(1, 16);
      for (const a of Field.actors) { a.x = 12.5 * TS + 8; a.y = 12 * TS + 14; a.dir = 'up'; }
      Field.history = [];
      const foe = Field.addEntity({ kind: 'npc', id: 'babafoe', sprite: CHARS[ENEMIES[F.id].char] ? ENEMIES[F.id].char : 'baba', x: 12.5 * TS + 8, y: 9 * TS + 14, dir: 'down' });
      if (F.id === 'invisible') foe.visible = false;
      await UI.fadeTo(0, 16);
      await say('Baba', 'Combat numéro ' + (i + 1) + ' ! ' + F.intro);
      if (F.id === 'invisible') await say('Goku', 'Euh... Il est où ? Je ne vois personne !');
      if (F.id === 'diable') await say('Akkuman', 'Hé hé hé... Mon Rayon Diabolique va faire exploser vos vilaines pensées !');
      if (F.id === 'gohan_m') await say('Combattant masqué', '...');
      foe.visible = false;
      const res = await Battle.start([F.id], { positions: [[foe.x, foe.y]], music: 'boss', canFlee: false, spar: true, loseMsg: F.name + ' a gagné...' });
      foe.gone = true;
      if (res !== 'win') { await say('Baba', 'Hi hi hi ! Perdu ! Repose-toi, et reviens retenter ta chance quand tu veux.'); return; }
      Game.flags.babaWins = i + 1;
      if (F.id === 'diable') await say('Goku', 'Son rayon ne m\'a rien fait du tout ! Je n\'ai pas de mauvaises pensées, moi !');
      if (F.id === 'gohan_m') { await gohanReveal(); return; }
      R.healParty(0.35);
      await say('Baba', 'Grr... Tu as battu ' + F.name + ' ! Bon, je t\'offre un peu de thé, et on passe au suivant.');
    }
  }
  async function gohanReveal() {
    const g = Field.addEntity({ kind: 'npc', id: 'gohan_m2', sprite: 'gohan_m', x: 12.5 * TS + 8, y: 9 * TS + 14, dir: 'down' });
    await say('Goku', 'Ce bâton... ces mouvements... Pierre-feuille-ciseaux... Ce sont les techniques de Grand-père !');
    await say('Combattant masqué', 'Ho ho ho... Tu as bien grandi, Goku.');
    SND.playMusic('sad');
    Field.effects.push({ type: 'smoke', x: g.x, y: g.y - 12, t: 30 });
    g.sprite = 'gohan';
    await say(null, 'Le combattant retire son masque... Sous l\'auréole, un visage souriant et familier.');
    await say('Goku', 'GRAND-PÈRE GOHAN !');
    await say('Grand-père Gohan', 'Le Grand Kaïo m\'a permis de revenir sur Terre pour une seule journée. Baba est ma vieille amie... Je voulais voir à quel point tu étais devenu fort.');
    await say('Goku', 'Grand-père... Tu sais, j\'ai retrouvé ta boule à quatre étoiles ! Enfin, presque...');
    await say('Grand-père Gohan', 'Je sais, Goku. Je t\'ai regardé depuis l\'autre monde. Tes amis, tes combats... Tu as un cœur pur et un grand courage. Je suis fier de toi.');
    if (Game.flags.wish === 'gohan') await say('Goku', 'La dernière fois, avec Shenron, je t\'ai vu juste un instant... Cette fois, on a une journée entière !');
    await say('Grand-père Gohan', 'Tiens. Garde ce talisman. Il te protégera quand je ne serai pas là.');
    await getItem('talisman');
    await say('Baba', '(snif) ... Bon, bon ! Un marché est un marché. Voilà ta boule à quatre étoiles, petit singe.');
    Game.flags.babaDone = true;
    await R.rball(4);
    Game.setQuest('ruban', 'voeu');
    await say(null, 'Goku et son grand-père passent la journée ensemble, à rire et à se battre pour de faux au bord du lac...');
    await UI.fadeTo(1, 40);
    g.gone = true;
    Game.flags.gohanParti = true;
    await wait(20);
    await UI.fadeTo(0, 40);
    await say(null, 'Au coucher du soleil, Grand-père Gohan est reparti vers l\'autre monde, en souriant.');
    await say('Goku', '... Au revoir, Grand-père. Maintenant, j\'ai une promesse à tenir. Upa m\'attend !');
    await finale();
  }

  // ---------------- Shenron : le vœu pour Bora ----------------
  async function finale() {
    const S = Main.Shenron;
    await UI.fadeTo(1, 30);
    SND.stopMusic(true);
    Field.load('karine', 15, 13, 'up');
    Field.entities = Field.entities.filter(e => e.kind !== 'enemy');
    Field.camLock = true;
    S.x = 15 * TS; S.y = 11 * TS;
    const LOW = S.y - 124, HIGH = S.y - 190;
    Field.camX = S.x - SW / 2; Field.camY = LOW;
    S.balls = [1, 2, 3, 4, 5, 6, 7].map((n, i) => { const a = i / 7 * Math.PI * 2 - Math.PI / 2; return { n, x: S.x + Math.cos(a) * 18, y: S.y + Math.sin(a) * 9, gone: false }; });
    S.active = true; S.prog = 0; S.dark = 0; S.glow = 0;
    const upa = Field.ent('upa'); if (upa) { upa.x = S.x + 36; upa.y = S.y + 30; upa.dir = 'left'; }
    for (const [i, a] of Field.actors.entries()) { a.x = S.x - 30 + i * 14; a.y = S.y + 34; a.dir = 'up'; }
    Field.history = [];
    await UI.fadeTo(0, 40);
    await say('Goku', 'Upa ! J\'ai les sept boules ! Regarde bien !');
    await Tasks.tween(S, { glow: 1 }, 50);
    await say('Goku', 'Sors de ces boules, dragon sacré ! Viens, Shenron !');
    SND.playMusic('shenron');
    await Tasks.tween(S, { dark: 0.72 }, 60);
    SND.sfx('thunder'); Game.shake = 20;
    UI.fade.color = '#ffffff'; UI.fade.v = 0.8; UI.fadeTo(0, 20).then(() => { UI.fade.color = '#000'; });
    await wait(30);
    SND.sfx('roar');
    await Promise.all([Tasks.tween(S, { prog: 1 }, 170, 'out'), Tasks.tween(Field, { camY: HIGH }, 120, 'inOut')]);
    SND.sfx('thunder'); Game.shake = 16;
    await wait(40);
    await say('Shenron', 'JE SUIS SHENRON, LE DRAGON SACRÉ. JE PEUX EXAUCER UN VŒU, QUEL QU\'IL SOIT.');
    await say('Upa', 'C\'est... c\'est lui, le dragon ?! Il est immense !');
    for (;;) {
      const r = await ask('Goku', 'Quel vœu faire ?', ['Ramener Bora à la vie', 'Devenir le plus fort du monde'], { cancel: -1 });
      if (r === 0) break;
      await say('Goku', 'Devenir le plus fort du monde... Non ! Ça, je veux y arriver tout seul, en m\'entraînant ! Et puis... j\'ai fait une promesse à Upa.');
    }
    await say('Goku', 'Shenron ! Ramène à la vie Bora, le papa d\'Upa, tué par Tao Paï Paï !');
    await say('Shenron', 'C\'EST UN VŒU FACILE À EXAUCER.');
    SND.sfx('flash');
    UI.fade.color = '#ffffff'; UI.fade.v = 1; await UI.fadeTo(0, 40); UI.fade.color = '#000';
    await say('Shenron', 'TON VŒU EST EXAUCÉ. ADIEU !');
    SND.sfx('roar');
    await Tasks.tween(S, { prog: 0 }, 50, 'in');
    SND.sfx('ball');
    await Promise.all(S.balls.map((b, i) => { const a = i / 7 * Math.PI * 2; return Tasks.tween(b, { x: b.x + Math.cos(a) * 200, y: b.y - 220 - Math.sin(a) * 40 }, 50, 'in'); }));
    S.balls.forEach(b => { b.gone = true; });
    await Promise.all([Tasks.tween(S, { dark: 0 }, 60), Tasks.tween(Field, { camY: LOW }, 50, 'inOut')]);
    S.active = false;
    Field.camLock = false;
    Game.extra.rb = [];
    const bora = Field.addEntity({ kind: 'npc', id: 'bora_vivant', sprite: 'bora', x: S.x, y: S.y + 6, dir: 'down' });
    Field.effects.push({ type: 'smoke', x: bora.x, y: bora.y - 10, t: 40 });
    SND.playMusic('camp');
    await say('Bora', '... Upa ? Upa, mon fils ! Que s\'est-il passé ? J\'ai fait un long, long rêve...');
    await say('Upa', 'PAPA ! (snif) Papa, tu es revenu ! C\'est Goku ! Il avait promis !');
    await say('Bora', 'Goku... Tu as tenu ta promesse. La Terre sacrée de Karine sera toujours ta maison.');
    await say('Goku', 'Hé hé ! Et l\'armée du Ruban Rouge, c\'est fini pour de bon !');
    Game.flags.boraVivant = true;
    Game.setQuest('ruban', 'done', true);
    Game.addKarma(1);
    await UI.fadeTo(1, 50);
    await Main.epilogue(slides(), { prefix: 'Fin de l\'arc — ', music: 'camp' });
    Game.mode = 'field';
    UI.fade.v = 1;
    Field.load('karine', 14.5, 12, 'down');
    await UI.fadeTo(0, 30);
    await say(null, 'Fin de l\'arc du Ruban Rouge ! Tu peux continuer à explorer le monde, relever les défis de l\'arène ou chercher les îles secrètes en Kinto\'un.');
    const r = await ask(null, 'Sauvegarder la partie ?', ['Oui', 'Non'], { cancel: 1 });
    if (r === 0) { Game.healAll(); const ok = Game.save(); SND.sfx('save'); await say(null, ok ? 'Partie sauvegardée !' : 'Sauvegarde impossible sur ce navigateur.'); }
  }
  function slides() {
    return [
      { title: 'Le village Jingle', chars: ['suno', 'c8'], text: 'C-8 vit désormais au village Jingle. Les enfants l\'appellent « Hachan » et grimpent sur ses épaules pour cueillir les pommes.' },
      { title: 'Le village Pingouin', chars: ['arale', 'senbei'], text: 'Au village Pingouin, Arale a un nouveau jeu : regarder passer dans le ciel une petite étoile qui ressemble beaucoup au général Bleu.' },
      { title: 'La Terre sacrée', chars: ['upa', 'bora'], text: 'Upa et Bora veillent de nouveau sur la Tour de Karine. Tout en haut, un chat blanc sourit dans sa moustache.' },
      { title: 'Le Ruban Rouge', chars: ['soldat_rr'], text: 'Sans chef, l\'armée du Ruban Rouge s\'est dispersée. Ses soldats sont rentrés chez eux... la plupart pour devenir boulangers.' },
      { title: 'L\'autre monde', chars: ['gohan'], text: 'Quelque part dans l\'autre monde, Grand-père Gohan raconte à qui veut l\'entendre les exploits de son petit-fils.' },
      { title: 'Fin de l\'arc du Ruban Rouge', chars: ['goku'], cloud: true, text: 'Et Goku ? Il est déjà reparti sur son nuage, à la recherche d\'adversaires toujours plus forts...', foot: 'Merci d\'avoir joué !' },
    ];
  }

  return { FIGHTERS, finale };
})();
window.Ruban3 = Ruban3;
