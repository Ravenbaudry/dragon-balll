// Arc du Ruban Rouge : chapitres 9 à 13 et Baba la voyante, joués de bout en bout.
const { openGame } = require('./helpers');

const STRONG = 'Game.allMembers().forEach(m => { m.atk = 999; m.mag = 999; m.spd = 99; m.maxhp = 9999; m.hp = 9999; m.maxki = 99; m.ki = 99; });';
const FLAGS = '{roshi:true, wish:"gohan", oozaru:true, ch7:true, ch8:true, tournoiDone:true, kintounUsed:true, oolongJoined:true}';

module.exports = {
  title: 'arc du Ruban Rouge (chapitres 9 à 13, Baba la voyante)',
  async run({ r, url, getBrowser }) {
    const G = await openGame(await getBrowser(), url);
    const { ev, spam, idle } = G;
    const fly = async id => { // voyage en Kinto'un jusqu'à un lieu
      await ev('Field.run(() => WorldMap.travel()); 1');
      if (!(await G.until('!!WorldMap.state()', 20000))) return false;
      await ev(`(() => { const W = WorldMap.state(), s = WorldMap.SPOTS.find(p => p.id === "${id}"); W.x = s.x; W.y = s.y; W.fleet = null; })()`); await G.wait(80);
      await G.key('Enter');
      return G.until(`Field.mapId === "${id}"`, 20000);
    };
    const touch = (tx, ty) => ev(`(() => { for (const a of Field.actors) { a.x = ${tx} * 16 + 8; a.y = ${ty} * 16 + 10; } Field.history = []; Field.snapCamera(); return 1; })()`);
    const talk = async id => { await ev(`__goto("${id}")`); await G.tap('Enter'); };
    // les combats : équipe surpuissante, sauf contre Tao Paï Paï la première fois (défaite prévue)
    await ev(`(() => { const bs = Battle.start; Battle.start = function (g, o) { if (g.includes('tao1')) Game.party.forEach(m => { m.hp = 1; }); else { ${STRONG} } return bs.apply(this, arguments); }; return 1; })()`);
    await ev('__enableAI(true); window.__bot.on = true; 1');
    // les mini-jeux d'action (shoot'em up) sont abrégés
    await ev('setInterval(() => { const M = MiniGames.state(); if (M && M.phase === "play" && M.id !== "grimpe" && M.s && "over" in M.s && !M.s.over) M.s.over = 1; }, 200); 1');
    await G.prefer(['souris', 'Oui', 'Combattre', 'D\'accord', 'On grimpe', 'C\'est parti', 'Ramener Bora', 'Réessayer']);

    // ---- chapitre 9 ----
    await ev('__test("plage", 20, 16, {lv:24, party:["goku","bulma","krillin","oolong"], flags:' + FLAGS + ', quests:{main:"done", tournoi:"done"}}); Field.run(() => MAPS.plage.onEnter()); 1');
    let ok = await spam('Game.flags.ch9 && Game.quest("ruban") === "radar" && ' + idle, 60000);
    r.step('chapitre 9 : nouveau radar, le village Jingle sur la carte', ok && await ev('Game.flags.vu_jingle === true'));
    ok = await fly('jingle') && await spam('Game.flags.jingleIntro && ' + idle, 60000);
    await talk('suno'); await spam(idle, 20000);
    await talk('chef_jingle'); ok = ok && await spam('Game.quest("ruban") === "jingle" && ' + idle, 30000);
    r.step('village Jingle : Suno, son écharpe, le chef', ok && await ev('Game.gearOwned("echarpe") === 1'));
    await ev('Field.load("muscle1", 7.5, 9, "up"); 1'); await talk('metallique');
    ok = await spam('Game.flags.metalDone && ' + idle, 90000);
    await ev('Field.load("muscle2", 7.5, 9, "up"); 1');
    for (let k = 0; k < 12 && !(await ev('!!Game.flags.murasakiDone')); k++) { await talk('cachette' + (k % 4)); await spam(idle, 90000); }
    ok = ok && await ev('!!Game.flags.murasakiDone');
    await ev('Field.load("muscle3", 7.5, 9, "up"); 1'); await talk('c8');
    ok = ok && await spam('Game.flags.c8Done && ' + idle, 30000) && await ev('!!Game.member("c8")');
    r.step('Tour Muscle : Sergent Métallique, ninja Murasaki, C-8 devient notre ami', ok);
    await ev('Field.load("muscle4", 7.5, 9, "up"); 1'); await touch(7, 7);
    ok = await spam('Game.flags.buyonDone && ' + idle, 120000);
    r.step('la fosse de Buyon : il gèle quand Goku casse le mur', ok);
    await ev('Field.load("muscle5", 7.5, 9, "up"); 1'); await talk('general_blanc');
    ok = await spam('Game.flags.ch9done && Game.quest("ruban") === "radarcasse" && Field.mapId === "jingle" && ' + idle, 120000);
    r.step('général Blanc vaincu, boule 6, C-8 reste au village, radar cassé', ok && await ev('Ruban.rballs().includes(6) && !Game.member("c8") && Game.flags.vu_pingouin === true'));
    await G.shot('ruban_jingle');

    // ---- chapitre 10 ----
    ok = await fly('pingouin') && await spam('Game.flags.ch10 && ' + idle, 60000);
    await talk('senbei'); await spam(idle, 20000);
    await talk('arale'); ok = ok && await spam('Game.flags.araleDone && ' + idle, 90000);
    await talk('senbei'); ok = ok && await spam('Game.flags.radarRepare && Game.quest("ruban") === "pirates" && ' + idle, 30000);
    r.step('chapitre 10 : Arale, la boule 2, le radar réparé', ok && await ev('Ruban.rballs().includes(2) && Game.gearOwned("lunettes") === 1'));
    await G.shot('ruban_pingouin');

    // ---- chapitre 11 ----
    ok = await fly('pirates') && await spam('Game.flags.ch11 && ' + idle, 60000);
    await touch(13, 4); ok = ok && await spam('Game.flags.grotteGarde && ' + idle, 60000);
    r.step('chapitre 11 : la Côte des Pirates, les gardes de la grotte', ok);
    await ev('Field.load("pirates1", 13.5, 15, "up"); 1'); await G.wait(2500);
    r.step('grotte : les piques sortent du sol', await ev('Field.entities.some(e => e.spike && e.up) && Field.entities.some(e => e.spike && !e.up)'));
    await ev('Field.load("pirates2", 11, 12, "up"); 1'); await talk('robot_pirate');
    ok = await spam('Game.flags.robotPirate && ' + idle, 90000);
    await talk('tresor_pirate');
    ok = ok && await spam('Field.mapId === "fuite" && Ruban2.Fuite.on', 120000);
    r.step('robot pirate, trésor, boule 7 et général Bleu (Oolong en souris !)', ok && await ev('Game.flags.bleuDone && Ruban.rballs().includes(7) && window.__picks.some(p => p.includes("souris"))'));
    const x0 = await ev('Ruban2.Fuite.x'); await G.wait(800);
    r.step('fuite : l\'eau monte dans le tunnel', (await ev('Ruban2.Fuite.x')) > x0);
    await ev('(() => { for (const a of Field.actors) a.x = 33 * 16; return 1; })()');
    ok = await spam('Game.quest("ruban") === "karine" && ' + idle, 90000);
    r.step('sortie en sous-marin, Arale envoie Bleu dans les étoiles', ok && await ev('Game.flags.vu_karine === true && Field.mapId === "pirates"'));

    // ---- chapitre 12 ----
    ok = await fly('karine') && await spam('Game.quest("ruban") === "tour" && ' + idle, 120000);
    r.step('chapitre 12 : Tao Paï Paï, imbattable, emporte la boule', ok && await ev('Game.flags.taoArrive && (!Field.ent("bora") || Field.ent("bora").gone)'));
    await touch(14, 7);
    ok = await spam('Field.mapId === "sommet" && Game.flags.sommetIntro && ' + idle, 150000);
    r.step('la grimpette de la Tour de Karine', ok);
    await talk('karine'); await G.wait(400);
    for (let k = 0; k < 40 && !(await ev('!!Game.flags.eauSacree')); k++) { await talk('karine'); await G.wait(120); if (await ev('UI.blocking()')) await spam(idle, 15000); }
    await spam(idle, 30000);
    r.step('Karine attrapé : eau sacrée et haricots magiques', await ev('Game.flags.eauSacree && Game.items.senzu >= 5 && Game.quest("ruban") === "revanche"'));
    await touch(8, 13);
    ok = await spam('Game.flags.taoDone && Game.quest("ruban") === "qg" && ' + idle, 120000);
    r.step('revanche sur Tao Paï Paï, boule 5', ok && await ev('Ruban.rballs().includes(5) && Game.flags.vu_qg === true'));

    // ---- chapitre 13 ----
    ok = await fly('qg') && await spam('Game.flags.ch13 && Game.mode === "field" && ' + idle, 120000);
    r.step('chapitre 13 : la flotte du Ruban Rouge, puis l\'infiltration', ok && await ev('Field.entities.some(e => e.guard)'));
    await touch(14, 6); ok = await G.until('Field.mapId === "qg_int"', 10000);
    await G.wait(300);
    await talk('qg_carte'); await spam(idle, 20000);
    await talk('porte_bureau'); ok = ok && await spam('Game.flags.bureauOuvert && ' + idle, 20000);
    await touch(11, 4);
    ok = ok && await spam('Game.flags.qgDone && Game.quest("ruban") === "baba" && ' + idle, 150000);
    r.step('carte d\'accès, Red trahi par Black, Armure de Combat, boules 1 et 3', ok && await ev('[1, 3].every(n => Ruban.rballs().includes(n)) && Game.flags.vu_baba === true'));
    await G.shot('ruban_qg');

    // ---- Baba la voyante ----
    await ev('Field.load("qg", 15, 25, "up"); 1'); // on ressort dans la cour pour appeler le nuage
    r.step('après la victoire, plus de gardes dans la cour', await ev('!Field.entities.some(e => e.guard) && !Field.map.infiltration'));
    ok = await fly('baba') && await spam('Game.flags.babaIntro && ' + idle, 60000);
    await talk('baba');
    ok = ok && await spam('Game.quest("ruban") === "done" && Game.mode === "field" && Field.mapId === "karine" && ' + idle, 400000);
    r.step('Baba : cinq combattants, Grand-père Gohan, la boule 4', ok && await ev('Game.flags.babaDone && Game.gearOwned("talisman") === 1'));
    r.step('Shenron ramène Bora à la vie, épilogue', ok && await ev('Game.flags.boraVivant && !Main.Shenron.active && Ruban.rballs().length === 0 && !!Field.ent("bora")'));
    await G.shot('ruban_fin');
    r.errors(G.errors);
    await G.close();
  },
};
