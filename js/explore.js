// Exploration : pouvoirs des héros sur la carte, blocs à pousser, trésors enterrés (Dragon Radar), grotte obscure,
// et un secret dans chaque zone.
const Explore = (() => {
  const TS = 16;
  const done = id => !!Game.flags['x_' + id];
  const mark = id => { Game.flags['x_' + id] = true; };

  // ---------- Petits dessins ----------
  const imgs = {};
  function img(kind) {
    if (imgs[kind]) return imgs[kind];
    let c;
    if (kind === 'rock') { // gros rocher fissuré
      c = GFX.mk(20, 18); const x = c.getContext('2d');
      x.fillStyle = K; x.beginPath(); x.ellipse(10, 10, 10, 8, 0, 0, 7); x.fill();
      x.fillStyle = '#8a8076'; x.beginPath(); x.ellipse(10, 10, 9, 7, 0, 0, 7); x.fill();
      x.fillStyle = '#b0a698'; x.beginPath(); x.ellipse(8, 7, 5, 3, 0, 0, 7); x.fill();
      x.fillStyle = '#5a524a'; x.fillRect(9, 6, 1, 4); x.fillRect(10, 10, 1, 3); x.fillRect(11, 12, 2, 1); x.fillRect(6, 12, 3, 1);
    } else if (kind === 'post') { // poteau au bord d'un passage
      c = GFX.mk(10, 16); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(3, 2, 5, 14); x.fillRect(1, 0, 9, 4);
      x.fillStyle = '#a87040'; x.fillRect(4, 3, 3, 12); x.fillStyle = '#d83020'; x.fillRect(2, 1, 7, 2); x.fillStyle = '#f0c040'; x.fillRect(4, 1, 3, 2);
    } else if (kind === 'hole') { // terrier / trou de souris
      c = GFX.mk(14, 8); const x = c.getContext('2d');
      x.fillStyle = '#3a2a1a'; x.beginPath(); x.ellipse(7, 5, 7, 3.5, 0, 0, 7); x.fill();
      x.fillStyle = '#0a0604'; x.beginPath(); x.ellipse(7, 5, 5, 2.5, 0, 0, 7); x.fill();
    } else if (kind === 'door') { // porte électronique
      c = GFX.mk(16, 24); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(0, 0, 16, 24);
      x.fillStyle = '#7880a0'; x.fillRect(1, 1, 14, 22); x.fillStyle = '#a8b0c8'; x.fillRect(1, 1, 14, 2);
      x.fillStyle = '#505878'; x.fillRect(7, 3, 2, 19);
      x.fillStyle = '#202430'; x.fillRect(10, 9, 4, 6); x.fillStyle = '#ff3030'; x.fillRect(11, 10, 2, 1); x.fillStyle = '#60e060'; x.fillRect(11, 12, 1, 1); x.fillRect(12, 13, 1, 1);
    } else if (kind === 'gate') { // grille de pierre
      c = GFX.mk(16, 26); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(0, 0, 16, 26);
      x.fillStyle = '#6a5a4a'; x.fillRect(1, 1, 14, 24);
      for (let i = 0; i < 4; i++) { x.fillStyle = '#4a3c30'; x.fillRect(2 + i * 4, 2, 2, 22); }
      x.fillStyle = '#e8c048'; x.fillRect(6, 11, 4, 4); x.fillStyle = '#a07820'; x.fillRect(7, 12, 2, 2);
    } else if (kind === 'block') { // bloc de pierre à pousser
      c = GFX.mk(16, 20); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(0, 0, 16, 20);
      x.fillStyle = '#9890a0'; x.fillRect(1, 1, 14, 18); x.fillStyle = '#c0b8c8'; x.fillRect(1, 1, 14, 4);
      x.fillStyle = '#706878'; x.fillRect(1, 15, 14, 4); x.fillStyle = '#585060'; x.fillRect(5, 8, 6, 1); x.fillRect(7, 6, 2, 5);
    } else if (kind === 'plate') { // dalle à pression
      c = GFX.mk(16, 10); const x = c.getContext('2d');
      x.fillStyle = K; x.fillRect(0, 1, 16, 9);
      x.fillStyle = '#c8a040'; x.fillRect(1, 2, 14, 7); x.fillStyle = '#f0d070'; x.fillRect(1, 2, 14, 2); x.fillStyle = '#806020'; x.fillRect(6, 4, 4, 3);
    }
    return (imgs[kind] = c);
  }

  // ---------- Héros capables ----------
  const kiUser = () => ['goku', 'krillin', 'chichi'].map(id => Game.member(id)).find(m => m && m.techs.some(t => ['kame', 'kame_k', 'rayon_casque'].includes(t)));
  const say = (w, t) => UI.say(w, t);

  // ---------- Fabriques d'entités ----------
  function rock(id, tx, ty) { // détruit d'un Kamehameha
    return {
      kind: 'npc', id: 'x_' + id, tx, ty, turn: false, get img() { return img('rock'); }, cond: () => !done(id), box: [-8, -14, 16, 16],
      talk: async e => {
        const m = kiUser();
        if (!m) { await say(null, 'Un énorme rocher bloque le passage. Il faudrait une technique très puissante pour le pulvériser...'); return; }
        const r = await UI.ask(null, 'Un énorme rocher bloque le passage.', [m.name + ' : un Kamehameha !', 'Laisser'], { cancel: 1 });
        if (r !== 0) return;
        const L = Field.leader();
        await say(m.name, m.id === 'chichi' ? 'Rayon du casque !' : 'Ka... mé... ha... mé... HAAA !');
        SND.sfx('beam');
        Field.effects.push({ type: 'beam', x1: L.x, y1: L.y - 14, x2: e.x, y2: e.y - 8, life: 30, t: 30, w: 6 });
        await wait(20);
        SND.sfx('bighit'); Game.shake = 12;
        Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 8, t: 40 });
        e.gone = true; mark(id);
        await wait(20);
        await say(null, 'Le rocher vole en éclats ! Le passage est libre.');
      },
    };
  }
  function gap(id, tx, ty, to, dir = 'down') { // franchi grâce au Bâton Magique
    return {
      kind: 'npc', id: 'x_' + id, tx, ty, turn: false, solid: false, get img() { return img('post'); },
      talk: async () => {
        const g = Game.member('goku');
        if (!g || !g.equip || g.equip.arme !== 'nyoibo') { await say(null, 'De l\'autre côté, il y a quelque chose... Avec le Bâton Magique de Goku, on pourrait passer ! (Menu → Équipement)'); return; }
        const r = await UI.ask('Goku', 'Je peux passer avec mon bâton !', ['Bâton, allonge-toi !', 'Rester ici'], { cancel: 1 });
        if (r !== 0) return;
        const L = Field.leader(), x2 = to[0] * TS + 8, y2 = to[1] * TS + 14;
        await say('Goku', 'Nyoibo, allonge-toi !');
        SND.sfx('swing');
        Field.effects.push({ type: 'staff', x1: L.x, y1: L.y - 8, x2, y2: y2 - 8, life: 40, t: 40 });
        await wait(14);
        SND.sfx('jump');
        await Promise.all([Tasks.tween(L, { x: x2, y: y2 }, 30, 'inOut'), Field.jump(L, 18, 30)]);
        for (const a of Field.actors) { a.x = x2; a.y = y2; a.dir = dir; }
        Field.history = [];
      },
    };
  }
  function hole(id, tx, ty, item, n = 1) { // Oolong ou Puar se change en souris
    return {
      kind: 'npc', id: 'x_' + id, tx, ty, turn: false, solid: false, get img() { return img('hole'); }, cond: () => !done(id),
      talk: async e => {
        const m = Game.member('oolong') || Game.member('puar');
        if (!m) { await say(null, 'Un petit trou... Quelque chose brille tout au fond. Il faudrait être aussi petit qu\'une souris !'); return; }
        const r = await UI.ask(null, 'Un petit trou. Quelque chose brille tout au fond...', [m.name + ' : en souris !', 'Laisser'], { cancel: 1 });
        if (r !== 0) return;
        await say(m.name, m.id === 'oolong' ? 'Pff... Bon, d\'accord. Transformation : souris !' : 'Je m\'en occupe ! Transformation : souris !');
        SND.sfx('door');
        Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 6, t: 30 });
        await wait(50);
        e.gone = true; mark(id);
        await say(m.name, 'Couic ! Regardez ce que j\'ai trouvé !');
        await getItem(item, n);
      },
    };
  }
  function door(id, tx, ty) { // porte électronique : Bulma la pirate
    return {
      kind: 'npc', id: 'x_' + id, tx, ty, turn: false, get img() { return img('door'); }, cond: () => !done(id), box: [-8, -14, 16, 16],
      talk: async e => {
        if (!Game.member('bulma')) { await say(null, 'Une porte électronique verrouillée par un code. Il faudrait un génie de la technique...'); return; }
        const r = await UI.ask(null, 'Une porte électronique, verrouillée par un code secret.', ['Bulma : pirater la porte', 'Laisser'], { cancel: 1 });
        if (r !== 0) return;
        await say('Bulma', 'Hmm... Un vieux modèle de la Capsule Corp. Fil rouge, fil bleu... et voilà !');
        for (let i = 0; i < 3; i++) { SND.sfx('cursor'); await wait(10); }
        SND.sfx('door');
        e.gone = true; mark(id);
        await say(null, 'La porte s\'ouvre dans un sifflement.');
      },
    };
  }
  function treasure(id, tx, ty, item, n = 1) { // enterré : le Dragon Radar le détecte
    return {
      kind: 'npc', id: 'x_' + id, tx, ty, treasure: true, visible: false, solid: false, cond: () => !done(id),
      talk: async e => {
        if (!Game.member('bulma')) { await say(null, 'La terre semble avoir été retournée ici...'); return; }
        await say('Bulma', 'Le radar bipe à toute vitesse ! Il y a quelque chose d\'enterré ici. Creuse, Goku !');
        SND.sfx('door'); Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 4, t: 30 });
        e.gone = true; mark(id);
        if (item === 'zeni') { Game.zeni += n; SND.sfx('coin'); await say(null, 'Un coffret plein de pièces : ' + n + ' Zénis !'); }
        else await getItem(item, n);
      },
    };
  }
  // blocs, dalles et grille : quand chaque dalle d'un groupe porte un bloc, la grille s'ouvre
  const BLOCKS = {};
  function block(id, tx, ty, group, plate) {
    BLOCKS[id] = { group, plate };
    const solved = () => done('gate_' + group);
    return { kind: 'npc', id: 'x_' + id, push: true, group, turn: false, get img() { return img('block'); }, get tx() { return solved() ? plate[0] : tx; }, get ty() { return solved() ? plate[1] : ty; }, box: [-8, -9, 16, 10] };
  }
  function plate(id, tx, ty, group) { return { kind: 'npc', id: 'x_' + id, plate: group, tx, ty, turn: false, solid: false, get img() { return img('plate'); }, sortOff: -30 }; }
  function gate(id, tx, ty, group) { return { kind: 'npc', id: 'x_' + id, gate: group, tx, ty, turn: false, get img() { return img('gate'); }, cond: () => !done('gate_' + group), box: [-8, -14, 16, 16] }; }

  // pousser un bloc : appelé quand le meneur avance contre lui
  let pushT = 0, pushing = false;
  function tryPush(L, dx, dy) {
    if (pushing || (dx && dy) || (!dx && !dy)) { pushT = 0; return; }
    const fx2 = L.x + dx * 9, fy2 = L.y - 2 + dy * 9;
    const b = Field.entities.find(e => e.push && !e.gone && Math.abs(e.x - fx2) < 9 && Math.abs(e.y - 6 - fy2) < 9);
    if (!b) { pushT = 0; return; }
    if (++pushT < 14) return;
    pushT = 0;
    if (Field.entities.some(p => p.plate === b.group && Math.abs(p.x - b.x) < 4 && Math.abs(p.y - b.y) < 4)) return; // posé sur sa dalle : il ne bouge plus
    const nx = b.x + dx * TS, ny = b.y + dy * TS;
    const tx = Math.floor(nx / TS), ty = Math.floor((ny - 2) / TS);
    const free = !Field.solid[ty] || Field.solid[ty][tx] === false;
    const occupied = Field.entities.some(e => e !== b && !e.gone && e.solid && e.visible !== false && Math.floor(e.x / TS) === tx && Math.floor((e.y - 2) / TS) === ty);
    if (!free || occupied || Field.tileAt(tx, ty) === null) { SND.sfx('buzz'); return; }
    pushing = true;
    SND.sfx('swing');
    Tasks.tween(b, { x: nx, y: ny }, 14).then(() => { pushing = false; checkPlates(b.group); });
  }
  function checkPlates(group) {
    if (done('gate_' + group)) return;
    const plates = Field.entities.filter(e => e.plate === group);
    const ok = plates.length && plates.every(p => Field.entities.some(b => b.push && b.group === group && Math.abs(b.x - p.x) < 4 && Math.abs(b.y - p.y) < 4));
    if (!ok) { SND.sfx('cursor'); return; }
    mark('gate_' + group);
    const g = Field.entities.find(e => e.gate === group);
    SND.sfx('door'); Game.shake = 8;
    if (g) { Field.effects.push({ type: 'smoke', x: g.x, y: g.y - 10, t: 40 }); g.gone = true; }
    UI.notify('Un mécanisme s\'enclenche... La grille s\'ouvre !', 120);
  }

  // ---------- La grotte secrète (derrière le rocher de la route) ----------
  MAPS.grotte = {
    name: 'Grotte Obscure', music: 'volcano', ground: 'v', dark: true,
    rows: [
      'CCCCCCCCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCCCCCCCC',
      'CCvvvvvCCCCCCCvvvvvvCC',
      'CCvvvvvCCCCCCvvvvvvvCC',
      'CCvvvvvvvvvvvvvvRvvvCC',
      'CCvvvvvCCCCCCvvvvvvvCC',
      'CCCCCCCCCCCCCvvvvvvCCC',
      'CCCCvvvvvvvCCCvvvvCCCC',
      'CCCvvvvvvvvvvvvvvvvvCC',
      'CCvvvvRvvvvvvvvvvvvvCC',
      'CCvvvvvvvCCCCCvvvvvvCC',
      'CCvvvvvCCvvvvCCvvvvvCC',
      'CCCvvvvCCvvvvCCvvvvCCC',
      'CCCCvvvvvvvvvvvvvvCCCC',
      'CCCCCCCCCvvvvCCCCCCCCC',
      'CCCCCCCCCCvvCCCCCCCCCC',
    ],
    entities: () => [
      warp(10, 15, 2, 1, 'route', 18, 4, 'down'),
      gate('grotte_grille', 7, 4, 'grotte'),
      block('grotte_b1', 9, 8, 'grotte', [12, 8]), plate('grotte_d1', 12, 8, 'grotte'),
      block('grotte_b2', 16, 10, 'grotte', [16, 12]), plate('grotte_d2', 16, 12, 'grotte'),
      chest('grotte_tresor', 3, 3, 'pendentif'),
      chest('grotte_coffre2', 18, 3, 'super_tonique', 2),
      foe(17, 5, ['golem', 'golem']),
      foe(4, 11, ['salamandre_bleue', 'salamandre']),
      treasure('grotte_t', 11, 12, 'senzu'),
    ],
    async onEnter() {
      if (Game.flags.grotteIntro) return;
      Game.flags.grotteIntro = true;
      await Field.run(async () => {
        await say(null, 'Il fait noir comme dans un four...');
        if (Game.member('krillin')) await say('Krilin', 'Attendez, j\'ai une idée ! Taiyoken ! ... Hé hé, avec un peu de lumière, c\'est mieux, non ?');
        else await say('Bulma', 'On n\'y voit rien ! Si Krilin était là, son Taiyoken nous éclairerait...');
      });
    },
  };
  // obscurité : un halo autour de l'équipe (plus grand si Krilin éclaire de son Taiyoken)
  function drawDark(cx, cy) {
    const L = Field.leader();
    if (!L) return;
    const lit = !!Game.member('krillin');
    const r = (lit ? 74 : 34) + Math.sin(Game.frame * 0.08) * 2;
    const x = Field.battle ? SW / 2 : L.x - cx, y = Field.battle ? SH / 2 - 20 : L.y - cy - 10;
    const g = ctx.createRadialGradient(x, y, r * 0.35, x, y, Field.battle ? r * 1.8 : r);
    g.addColorStop(0, 'rgba(0,0,8,0)'); g.addColorStop(1, 'rgba(0,0,8,0.94)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  }

  // ---------- Dragon Radar : un bip quand un trésor enterré est proche ----------
  function drawHud() {
    if (!Game.member('bulma')) return;
    const L = Field.leader();
    let best = 1e9;
    for (const e of Field.entities) if (e.treasure && !e.gone) best = Math.min(best, Math.hypot(e.x - L.x, e.y - L.y) / TS);
    if (best > 7) return;
    const period = Math.max(6, Math.round(6 + best * 8)), on = Game.frame % period < 4;
    if (Game.frame % period === 0) SND.note(best < 1 ? 96 : 88, 0.05, 'tri', 0.12);
    const x = 18, y = 18;
    ctx.fillStyle = K; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
    ctx.fillStyle = '#103818'; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.stroke();
    ctx.fillStyle = on ? '#ffe060' : '#80ff90'; ctx.beginPath(); ctx.arc(x, y, on ? 3 : 2, 0, 7); ctx.fill();
    if (best < 1) FONT.draw(ctx, 'Creuse ! (Z)', 34, 13, UI.YEL);
  }

  // ---------- Les secrets des zones ----------
  const SECRETS = {
    maison: () => [treasure('maison_tirelire', 8, 3, 'zeni', 300)],
    paozu: () => [rock('paozu_rocher', 37, 4), chest('paozu_cache', 37, 3, 'grelot'), treasure('paozu_t', 2, 21, 'super_tonique', 2), hole('paozu_terrier', 4, 27, 'capsule_vie')],
    foret: () => [rock('foret_rocher', 13, 6), chest('foret_cache', 13, 7, 'super_tonique', 2), hole('foret_terrier', 34, 23, 'boisson_ki', 2), treasure('foret_t', 7, 18, 'remede', 2)],
    plage: () => [gap('plage_aller', 29, 17, [29, 19], 'down'), gap('plage_retour', 29, 19, [29, 17], 'up'), chest('plage_ilot', 30, 20, 'aimant'), treasure('plage_t', 25, 3, 'fruit', 3)],
    route: () => [rock('route_grotte', 18, 4), warp(18, 3, 1, 1, 'grotte', 10.5, 14, 'up'), rock('route_rocher', 11, 4), chest('route_cache', 10, 4, 'boisson_ki', 3), treasure('route_t', 2, 20, 'remede', 2)],
    camp: () => [treasure('camp_t', 9, 4, 'viande', 2)],
    village: () => [door('village_entrepot', 4, 24), chest('village_entrepot', 3, 24, 'oreiller'), treasure('village_t', 5, 26, 'zeni', 200)],
    desert: () => [treasure('desert_t1', 5, 20, 'haricot_chance'), treasure('desert_t2', 34, 10, 'zeni', 500)],
    frypan: () => [rock('frypan_rocher', 5, 9), chest('frypan_cache', 4, 9, 'senzu')],
    volcan: () => [treasure('volcan_t', 14, 23, 'super_tonique', 3)],
    chateau: () => [door('chateau_arsenal', 25, 26), chest('chateau_arsenal', 26, 26, 'bracelet_ki')],
    trone: () => [treasure('trone_t', 16, 2, 'zeni', 800)],
    cellule: () => [hole('cellule_trou', 1, 7, 'capsule_vie')],
    papaye: () => [treasure('papaye_t', 5, 22, 'zeni', 400)],
  };
  for (const id in SECRETS) {
    const base = MAPS[id] && MAPS[id].entities;
    if (base) MAPS[id].entities = () => base().concat(SECRETS[id]());
  }
  // l'entrée de la grotte, dans la falaise de la route, et l'îlot de la plage
  const route = MAPS.route;
  route.rows[3] = route.rows[3].slice(0, 18) + 'd' + route.rows[3].slice(19);
  route.objects = (route.objects || []).concat([{ type: 'building', img: 'cave', x: 18 * TS + 8 - 28, y: 3 * TS + 16 - 40, sortY: 3 * TS + 2 }]);
  const plage = MAPS.plage;
  for (const ry of [19, 20]) plage.rows[ry] = plage.rows[ry].slice(0, 29) + 'ss' + plage.rows[ry].slice(31);

  // ---------- Les îles secrètes (découvertes en vol libre sur le Kinto'un) ----------
  GEAR.carapace = { slot: 'acc', name: 'Carapace millénaire', desc: 'Un éclat de la carapace de la doyenne : Défense +8, PV +30.', stats: { def: 8, hp: 30 }, price: 0 };
  GEAR.perle = { slot: 'acc', name: 'Perle du Dragon', desc: 'Une perle sacrée : Force, Puissance +4, Vitesse +2 et 3 Ki par tour.', stats: { atk: 4, mag: 4, spd: 2 }, fx: 'kiregen', price: 0 };
  ENEMIES.gardien = { res: { phys: 0.75, ki: 1.15 }, immune: ['poison', 'sleep'], name: 'Gardien de Pierre', spr: 'golem', hp: 1900, atk: 58, def: 34, spd: 11, xp: 900, zeni: 600, boss: true,
    skills: [{ name: 'Poing de Granit', target: 'one', pow: 1.8, chance: 0.28 }, { name: 'Séisme', target: 'all', pow: 0.95, chance: 0.22, st: 'stun', sc: 0.25 }] };
  const gather = (id, tx, ty, item) => (window.Prog ? [window.Prog.gatherSpot(id, tx, ty, item)] : []);
  const fish = (id, tx, ty) => (window.Prog ? [window.Prog.fishSpot(id, tx, ty)] : []);
  MAPS.ile_tortue = {
    name: 'Île de la Tortue', music: 'field', ground: 's',
    rows: [
      '~~~~~~~~~~~~~~~~',
      '~~~~~~ssss~~~~~~',
      '~~~~sssPssss~~~~',
      '~~~sss.,..sss~~~',
      '~~ssP......sss~~',
      '~~ss...T...,ss~~',
      '~sss.,.....sss~~',
      '~~ssss.....ssss~',
      '~~sssssssssssss~',
      '~~~sssssssssP~~~',
      '~~~~sssssssss~~~',
      '~~~~~~sssss~~~~~',
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
    ],
    entities: () => [
      savePt(11, 7),
      { kind: 'npc', id: 'doyenne', tx: 8, ty: 4, mon: 'umigame', talk: doyenneTalk },
      { kind: 'npc', id: 'bebe_tortue', tx: 4, ty: 9, mon: 'umigame', wander: true, talk: () => say('Bébé tortue', 'Pi pi ! Grand-mère a plus de mille ans, tu sais !') },
      chest('tortue_coffre', 12, 4, 'boisson_ki', 3),
      treasure('tortue_t', 9, 10, 'zeni', 1000),
    ].concat(fish('ile_tortue', 2, 8), gather('ile_tortue_f', 5, 4, 'fruit')),
    async onEnter() {
      if (Game.flags.ileTortueIntro) return;
      Game.flags.ileTortueIntro = true;
      await Field.run(() => say('Goku', 'Hé, une île qui n\'est sur aucune carte ! Et regardez toutes ces tortues !'));
    },
  };
  async function doyenneTalk() {
    await Field.run(async () => {
      if (Game.flags.doyenneDone) { await say('Doyenne', 'Merci encore pour le poisson, petit. Reviens quand tu veux.'); return; }
      if (!Game.flags.doyenneAsk) {
        Game.flags.doyenneAsk = true;
        await say('Doyenne', 'Ohhh... Un visiteur ! Cela faisait trois cents ans... Je suis la doyenne des tortues. La tortue de Tortue Géniale est ma petite-petite-fille.');
        await say('Doyenne', 'Mes vieilles nageoires ne me portent plus jusqu\'au large. Si tu m\'apportais 3 Poissons, je te donnerais un trésor.');
      }
      if ((Game.items.poisson || 0) < 3) { await say('Doyenne', 'Il me faut 3 Poissons... Tu peux pêcher sur la plage de mon île. (Tu en as ' + (Game.items.poisson || 0) + '.)'); return; }
      const r = await ask('Doyenne', 'Oh ! Ce sont des Poissons que je sens ?', ['Donner 3 Poissons', 'Pas maintenant'], { cancel: 1 });
      if (r !== 0) return;
      for (let i = 0; i < 3; i++) Game.useItemStock('poisson');
      Game.flags.doyenneDone = true;
      await say('Doyenne', 'Délicieux ! Comme au bon vieux temps... Tiens, un éclat de ma carapace. Il t\'a protégé mieux qu\'une armure.');
      await getItem('carapace');
    });
  }
  MAPS.ile_cachee = {
    name: 'Île Mystérieuse', music: 'field', ground: 's', tint: 'rgba(206,214,238,0.3)',
    rows: [
      '~~~~~~~~~~~~~~~~',
      '~~~~~TTTTTT~~~~~',
      '~~~TTT.cc.TTT~~~',
      '~~TT...cc...TT~~',
      '~~T,...cc...,T~~',
      '~~T....cc....T~~',
      '~~T....cc....T~~',
      '~~TT...cc...TT~~',
      '~~~T...cc...T~~~',
      '~~~ss..cc..ss~~~',
      '~~~ssssccssss~~~',
      '~~~~sssssssss~~~',
      '~~~~~~sssss~~~~~',
      '~~~~~~~~~~~~~~~~',
    ],
    entities: () => [
      { kind: 'npc', id: 'gardien', tx: 7.5, ty: 3, mon: 'golem', cond: () => !Game.flags.gardienDone, talk: gardienTalk },
      sealed(chest('ile_perle', 7.5, 2, 'perle')),
      sign(5, 9, 'Gravé dans la pierre : « Seul le cœur pur franchira le gardien. »'),
      treasure('ile_cachee_t', 11, 5, 'senzu', 2),
      foe(4, 6, ['follet', 'follet']),
      foe(11, 7, ['golem']),
    ].concat(gather('ile_cachee_c', 3, 4, 'champignon'), gather('ile_cachee_h', 12, 4, 'herbes')),
    async onEnter() {
      if (Game.flags.ileCacheeIntro) return;
      Game.flags.ileCacheeIntro = true;
      await Field.run(async () => {
        await say(null, 'Une brume épaisse enveloppe l\'île. Au bout d\'une allée de pierre se dresse un vieux sanctuaire...');
        if (Game.member('bulma')) await say('Bulma', 'Brr... Cet endroit me donne la chair de poule. Mais un sanctuaire, ça cache toujours un trésor !');
      });
    },
  };
  function sealed(c) { // le coffre du sanctuaire reste scellé tant que le gardien veille
    const open = c.talk;
    c.talk = async e => {
      if (!Game.flags.gardienDone && !e.opened) { await say(null, 'Le coffre est scellé par une force mystérieuse... Le gardien de pierre veille sur lui.'); return; }
      await open(e);
    };
    return c;
  }
  async function gardienTalk(e) {
    await Field.run(async () => {
      SND.sfx('roar'); Game.shake = 10;
      await say('Gardien de Pierre', 'HALTE. DEPUIS MILLE ANS, JE GARDE LA PERLE DU DRAGON. PROUVE TA FORCE, OU REPARS.');
      const r = await ask('Goku', 'Un gardien en pierre ? Il a l\'air costaud...', ['Combattre !', 'Repartir'], { cancel: 1 });
      if (r !== 0) return;
      e.visible = false;
      await Battle.start(['gardien'], { positions: [[e.x, e.y]], music: 'boss' });
      e.gone = true;
      Game.flags.gardienDone = true;
      SND.sfx('thunder');
      await say('Gardien de Pierre', 'TA FORCE... EST GRANDE... ET TON CŒUR... EST PUR. LA PERLE... EST À TOI...');
      await say(null, 'Le gardien se fige et retourne à la pierre. Le coffre du sanctuaire est accessible !');
    });
  }

  return { tryPush, drawDark, drawHud, rock, gap, hole, door, treasure, block, plate, gate, done };
})();
window.Explore = Explore;
