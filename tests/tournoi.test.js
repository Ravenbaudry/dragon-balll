// Chapitre 8 : « Un an plus tard » et le Championnat du monde, avec deux parcours.
//  - Goku tient sa promesse à Nam, se relève le premier et devine qui est Jackie Chun ;
//  - Goku ne promet rien, reste au tapis et Jackie Chun l'emporte.
const { openGame } = require('./helpers');

const STRONG = 'Game.allMembers().forEach(m => { m.atk = 999; m.mag = 999; m.spd = 99; m.maxhp = 9999; m.hp = 9999; m.maxki = 99; m.ki = 99; }); 1';
const FLAGS = '{roshi:true, wish:"gohan", oozaru:true, tailCut:"krillin", ch7:true, met_yamcha:true, yamchaJoined:true, oolongJoined:true, kintounUsed:true}';

module.exports = {
  title: 'chapitre 8 : le Championnat du monde',
  async run({ r, url, getBrowser }) {
    for (const good of [true, false]) {
      const label = good ? '[champion] ' : '[finaliste] ';
      const G = await openGame(await getBrowser(), url);
      const { ev, spam, idle } = G;
      const step = (l, ok, extra) => r.step(label + l, ok, extra);

      // Après les crédits : un an plus tard, à la Kame House (la queue de Goku avait été coupée)
      await ev('__test("plage", 20, 16, {lv:21, party:["goku","bulma","krillin","yamcha","oolong"], flags:' + FLAGS + ', quests:{main:"done"}, karma:5}); const g = Game.member("goku"); g.style = Object.assign(styleOf(g), {tail:0}); Field.syncParty(); 1');
      await ev('Tournoi.begin(); 1');
      await G.prefer(['Oui']);
      let ok = await spam('Game.flags.ch8 && Game.quest("tournoi") === "depart" && ' + idle, 60000);
      step('un an plus tard : niveaux, queue repoussée, quête', ok && await ev('Game.member("goku").lv === 23 && Game.member("krillin").lv === 23 && styleOf(Game.member("goku")).tail === 1 && !!Field.ent("passeur")'));

      // Le passeur emmène l'équipe sur l'île Papaye
      await ev('__goto("passeur")'); await G.prefer(['Embarquer']);
      ok = await spam('Field.mapId === "papaye" && Game.quest("tournoi") === "inscription" && ' + idle, 30000);
      step('traversée vers l\'île Papaye', ok && await ev('!!Field.ent("papaye_moine") && !!Field.ent("papaye_jackie") && Game.flags.vu_papaye === true'));

      // Le tournoi, du tableau à la cérémonie
      await ev('(() => { const bs = Battle.start; Battle.start = function (...a) { ' + STRONG.replace(/ 1$/, '') + ' return bs.apply(this, a); }; return 1; })()');
      await ev('__enableAI(true); window.__bot.on = ' + good + '; 1'); // au mini-jeu final, le champion martèle le bouton, le finaliste non
      await G.prefer(good ? ['Inscrire', 'parti', 'aiderai', 'Recommencer', 'était vous', 'Oui'] : ['Inscrire', 'parti', 'retiendrai', 'Recommencer', 'raté un super', 'Oui']);
      await ev('__goto("papaye_moine")');
      const seen = {};
      const t0 = Date.now();
      while (Date.now() - t0 < 300000) {
        const st = await ev('JSON.stringify({ b: !!Tournoi.state().board, moon: Main.Moon.active, sky: Tournoi.Sky.on, boom: !!Tournoi.Sky.boom, mg: MiniGames.state() ? MiniGames.state().phase : null, f2: !!(Battle.state() && Battle.state().enemies[0].id === "jackie2") })');
        const s = JSON.parse(st);
        for (const k of Object.keys(s)) if (s[k] && !seen[k]) { seen[k] = true; if (k === 'sky') await G.shot('tournoi_lune'); if (k === 'b' && !seen.shotB) { seen.shotB = true; await G.shot('tournoi_tableau'); } }
        if (s.mg === 'play') { await G.wait(150); continue; }
        await G.tap('Enter'); await G.wait(100);
        if (await ev('Game.flags.tournoiDone && Game.mode === "field" && Field.mapId === "papaye" && !Field.ent("t_goku") && ' + idle)) break;
      }
      step('tableau des combats affiché', !!seen.b);
      step('pleine lune, singe géant et lune détruite', !!seen.moon && !!seen.boom);
      step('reprise de la finale puis « Debout, Goku ! »', !!seen.f2 && !!seen.mg);
      const res = JSON.parse(await ev('JSON.stringify({ done: Game.quest("tournoi"), champ: Game.flags.champion, nam: Game.flags.namHelped, promise: Game.flags.namPromise, rev: !!Game.flags.jackieRevealed, gear: Game.gear, mode: Game.mode, night: Tournoi.Sky.night, cast: Field.entities.filter(e => String(e.id).startsWith("t_")).length })'));
      step('tournoi terminé, retour sur l\'île', res.done === 'done' && res.mode === 'field' && res.night === 0 && res.cast === 0, JSON.stringify(res));
      if (good) step('Goku champion, promesse tenue, Jackie Chun démasqué', res.champ === true && res.promise === true && res.nam === true && res.rev === true && res.gear.ceinture_champion === 1, JSON.stringify(res));
      else step('Jackie Chun champion, bandeau d\'argent, secret gardé', res.champ === false && res.promise === false && res.nam === true && res.rev === false && res.gear.bandeau_argent === 1, JSON.stringify(res));
      // Le Kinto'un connaît l'île Papaye
      step('île Papaye sur la carte du Kinto\'un', await ev('WorldMap.SPOTS.some(s => s.id === "papaye") && Game.flags.vu_papaye === true'));
      await G.shot('tournoi_fin_' + (good ? 'champion' : 'finaliste'));
      r.errors(G.errors);
      await G.close();
    }
  },
};
