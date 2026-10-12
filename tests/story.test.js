// L'aventure complète, chapitre par chapitre, avec les « bons » ou les « mauvais » choix.
// Chaque étape part d'un état préparé (__test) pour rester rapide et indépendante.
const { openGame } = require('./helpers');

const STRONG = 'Game.allMembers().forEach(m => { m.atk = 999; m.mag = 999; m.spd = 99; m.maxhp = 9999; m.hp = 9999; }); 1';
const WEAK = 'Game.allMembers().forEach(m => { m.atk = 1; m.mag = 1; m.def = 0; m.hp = 5; m.maxhp = 5; }); 1';

function variant(which) {
  const good = which === 'good';
  return {
    title: 'histoire complète, ' + (good ? 'bons choix' : 'mauvais choix'),
    async run({ r, url, getBrowser }) {
      const G = await openGame(await getBrowser(), url);
      const { ev, spam, prefer, idle } = G;
      const runEv = fn => ev('Field.run(() => ' + fn + '()); 1');
      const step = (label, ok, extra) => r.step(label, ok, extra);

      // Prologue
      await prefer([good ? 'Bonjour' : 'monstre']);
      await G.key('Enter'); await G.wait(500);
      let ok = await spam('Game.flags.intro && ' + idle, 40000);
      await ev('__goto("ball4")');
      ok = ok && await spam('Game.hasBall(4) && ' + idle, 10000);
      step('prologue : Bulma rejoint, boule à 4 étoiles', ok && await ev('Game.inParty("bulma")'));
      // Tombe de Grand-père Gohan
      await ev('__test("paozu", 31, 4, {lv:3, dir:"up", flags:{grave:false, voie:null}})');
      await prefer([good ? 'protégerai' : 'plus fort']);
      ok = await spam('Game.flags.grave && ' + idle, 25000);
      step('tombe : promesse faite', ok && (await ev('Game.flags.voie')) === (good ? 'coeur' : 'force'));
      // Tortue perdue
      await ev('__test("foret", 17, 7, {lv:6, dir:"up"})'); await prefer([good ? 'Monte' : 'pressés']);
      ok = await spam(good ? 'Game.flags.turtle && ' + idle : '__picks.length > 0 && ' + idle, 20000);
      step('tortue ' + (good ? 'aidée' : 'laissée'), ok && !!(await ev('Game.flags.turtle')) === good);
      // Ours Brigand et espions
      await ev('__test("foret", 28.5, 19, {lv:6, flags:{turtle:true}})'); await ev(STRONG);
      await prefer(good ? ['laisser partir', 'poursuivre'] : ['chasser', 'filer']);
      await G.hold('ArrowDown', 500);
      ok = await spam('Game.flags.bear && (Game.flags.spiesChased || Game.flags.spiesFled) && ' + idle, 90000);
      await ev('__goto("ball2")');
      ok = ok && await spam('Game.hasBall(2) && ' + idle, 10000);
      step('ours ' + (good ? 'épargné' : 'chassé') + ', espions, boule 2', ok && !!(await ev(good ? 'Game.flags.bearSpared && Game.items.carte' : 'Game.flags.bearChased')));
      // Tortue Géniale et Krilin (duel perdu exprès en « mauvais » : pas de game over)
      await ev('__test("plage", 30, 17, {lv:7, flags:{turtle:true, bear:true}, balls:[4,2], dir:"up"})');
      await ev(good ? STRONG : WEAK);
      await prefer(good ? ['amis et', 'Bienvenue'] : ['manger', 'D\'abord un combat']);
      ok = await spam('Game.flags.roshi && ' + idle, 70000);
      step('Kame House : Kamehameha appris, Krilin rejoint' + (good ? '' : ' (duel perdu sans game over)'), ok && (await ev('Game.party.length === 3 && Game.mode === "field" && Game.party[0].techs.includes("kame")')));
      // Campement
      await ev('__test("route", 3.5, 20, {lv:8, party:["goku","bulma","krillin"], flags:{camp1:false, ch3:false}})');
      await prefer(good ? ['Bulma', 'intelligente'] : ['Krilin', 'déjà fort']);
      await runEv('MAPS.route.onEnter');
      step('feu de camp', await spam('Game.flags.ch3 && Field.mapId === "route" && ' + idle, 45000));
      // Marchand dévalisé
      if (good) {
        await ev('__goto("merchant")'); await prefer(['récupérer']);
        ok = await spam('Game.quest("marchand") === "start" && ' + idle, 20000);
        await ev(STRONG); await ev('__goto("chef")'); await prefer(['Rends']);
        ok = ok && await spam('Game.flags.chefBeaten && ' + idle, 45000);
        await ev('__goto("merchant")');
        step('quête du marchand', ok && await spam('Game.quest("marchand") === "done" && ' + idle, 20000));
      }
      // Village d'Aru
      await ev('__test("village", 20, 14, {lv:10, party:["goku","bulma","krillin"], flags:{roshi:true, herb:true}, items:' + (good ? '{herbe:1, tonique:3}' : '{tonique:3}') + ', zeni:400, balls:[2,3,4]})');
      await ev('__goto("grandma")'); await prefer([]);
      ok = await spam('Game.quest("grandmere") && ' + idle, 20000);
      step('grand-mère ' + (good ? 'guérie' : 'malade'), ok && (await ev('Game.quest("grandmere")')) === (good ? 'done' : 'start'));
      await ev('__goto("shady")'); await prefer([good ? 'Non merci' : 'Acheter']);
      ok = await spam('Game.flags.shady && ' + idle, 20000);
      step('marchande louche ' + (good ? 'évitée' : '(arnaque)'), ok && !!(await ev('Game.flags.shadyBought')) === !good);
      await ev(STRONG); await ev('__goto("oolong")'); await prefer([good ? 'pardonner' : 'livrer']);
      ok = await spam('Game.flags.oolong && ' + idle, 60000);
      step('Oolong ' + (good ? 'pardonné' : 'livré') + ', boule 5', ok && await ev('Game.hasBall(5) && ' + (good ? '!!Game.member("oolong")' : 'Game.flags.oolongJailed')));
      // Désert
      const pty = good ? '["goku","bulma","krillin","oolong"]' : '["goku","bulma","krillin"]';
      await ev('__test("desert", 29.5, 12, {lv:13, party:' + pty + ', flags:{roshi:true, oolong:true, oolongJoined:' + good + ', oolongJailed:' + !good + '}, balls:[2,3,4,5], dir:"up"})'); await ev(STRONG);
      if (good) {
        await ev('__goto("nomad")'); ok = await spam('Game.quest("boussole") === "start"', 20000);
        for (let i = 0; i < 20 && !(await ev(idle)); i++) await G.key('Escape', 1, 150);
        await ev('__goto("compass")'); ok = ok && await spam('Game.items.boussole && ' + idle, 10000);
        await ev('__goto("nomad")'); ok = ok && await spam('Game.quest("boussole") === "done" && ' + idle, 20000);
        step('quête de la boussole', ok);
        await ev('Field.leader().x = 29.5 * 16 + 8; Field.leader().y = 12 * 16 + 14; Field.leader().dir = "up"; 1');
      }
      await prefer([good ? 'Viens avec nous' : 'Retourne']);
      await G.hold('ArrowUp', 900);
      ok = await spam('Game.flags.yamcha && ' + idle, 60000);
      step('Yamcha ' + (good ? 'recruté' : 'renvoyé'), ok && !!(await ev('Game.member("yamcha")')) === good);
      // Mont Frypan
      const pty2 = good ? '["goku","bulma","krillin","oolong","yamcha"]' : '["goku","bulma","krillin"]';
      await ev('__test("frypan", 1, 14.5, {lv:16, party:' + pty2 + ', flags:{camp2:false, ch5:false, oolongJoined:' + good + ', yamchaJoined:' + good + '}, balls:[2,3,4,5]})');
      await prefer(good ? ['Yamcha', 'Bulma t\'aime'] : ['Personne']);
      await runEv('MAPS.frypan.onEnter');
      step('deuxième feu de camp', await spam('Game.flags.ch5 && Field.mapId === "frypan" && ' + idle, 45000));
      await ev(good ? STRONG : WEAK);
      await prefer(good ? ['pas des bandits', 'D\'accord ! C\'est quoi'] : ['Un combat', 'non merci']);
      await runEv('chichiEvent');
      ok = await spam('Game.flags.metChichi && Field.ent("chichi_npc") && ' + idle, 45000);
      step('Chichi ' + (good ? '(promesse)' : '(duel perdu, refus)'), ok && (await ev('Game.mode')) === 'field' && !!(await ev('Game.flags.chichiPromise')) === good);
      await ev(STRONG); await ev('__goto("gyumao")'); await prefer([good ? 'vaincre' : 'Kamehameha']);
      ok = await spam((good ? 'Game.flags.acceptedVolcano' : 'Game.flags.castleDestroyed') + ' && ' + idle, 35000);
      step(good ? 'Gyumao : mission acceptée' : 'château de Gyumao pulvérisé', ok);
      if (good) {
        await ev('__test("volcan", 14.5, 8, {lv:18, party:["goku","bulma","yamcha"], flags:{acceptedVolcano:true, metChichi:true, chichiPromise:true}, balls:[2,3,4,5], dir:"up"})'); await ev(STRONG);
        await G.hold('ArrowUp', 500);
        step('Esprit du Volcan vaincu, boule 6, casque offert', await spam('Game.flags.volcanBoss && Game.hasBall(6) && Field.mapId === "frypan" && ' + idle, 70000) && await ev('Game.gear.casque === 1'));
      }
      // Château de Pilaf, Shenron, pleine lune
      const fl = good ? '{grave:true, voie:"coeur", oolongJoined:true, yamchaJoined:true, met_yamcha:true, fireOut:true, chichiPromise:true, bearSpared:true, spiesChased:true}' : '{grave:true, voie:"force", oolongJailed:true, castleDestroyed:true, bearChased:true, shadyBought:true}';
      const q = good ? '{tortue:"done", grandmere:"done", marchand:"done", boussole:"done", gyumao:"done"}' : '{}';
      await ev('__test("trone", 8.5, 11, {lv:20, party:' + (good ? '["goku","bulma","krillin","oolong","yamcha"]' : '["goku","bulma","krillin"]') + ', flags:' + fl + ', quests:' + q + ', karma:' + (good ? 8 : 1) + ', items:' + (good ? '{carte:1, tonique:3}' : '{tonique:3}') + ', balls:[2,3,4,5,6], dir:"up"})'); await ev(STRONG);
      await prefer(good ? ['Oolong : se transformer'] : ['Accepter l\'aide']);
      await G.hold('ArrowUp', 400);
      ok = await spam('Game.flags.escaped && Field.mapId === "cellule" && ' + idle, 45000);
      step('piège de Pilaf et évasion', ok && (await ev('Game.balls.length')) === 0);
      await ev('Field.leader().x = 14 * 16 + 8; Field.leader().y = 8 * 16 + 10; Field.leader().dir = "down"; 1');
      await G.hold('ArrowDown', 400); await G.wait(800);
      await ev(STRONG);
      await G.hold('ArrowUp', 700);
      await prefer(good ? ['Goku', 'Revoir Grand-père', 'Faire ce vœu', 'Oolong : se changer'] : ['Oolong', 'Faire ce vœu', 'Krilin : un Kienzan']);
      step('Pilaf Machine vaincue', await spam('Game.flags.pilaf', 70000));
      step('Shenron apparaît', await spam('Main.Shenron.prog >= 1', 45000));
      ok = await spam('Game.mode === "epilogue"', 300000);
      step('vœu, chapitre de la pleine lune, queue coupée', ok && (await ev('Game.flags.wish')) === (good ? 'gohan' : 'oolong') && await ev('Game.flags.oozaru && !!Game.flags.tailCut && Game.member("goku").style.tail === 0'));
      for (let i = 0; i < 14 && (await ev('Game.mode')) === 'epilogue'; i++) { await G.wait(700); await G.key('Enter'); }
      step('épilogue et crédits', await spam('Game.mode === "ending"', 20000));
      await G.shot('story_' + which + '_fin');
      r.errors(G.errors);
      await G.close();
    },
  };
}
module.exports = { variant };
