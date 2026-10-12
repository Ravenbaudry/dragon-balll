// Fonctionnalités dans un vrai navigateur : démarrage, mini-jeux, entraînement, équipement, style,
// atelier de techniques, voyage en Kinto'un, sauvegarde, mode hors ligne, version fichier unique.
const path = require('path'), fs = require('fs'), os = require('os');
const { execFileSync } = require('child_process');
const { openGame } = require('./helpers');

const ALL_SPOTS = ['paozu', 'foret', 'plage', 'route', 'village', 'desert', 'frypan', 'chateau', 'papaye'];
const visited = ALL_SPOTS.map(v => '"vu_' + v + '":true').join(',');

module.exports = {
  title: 'démarrage, mini-jeux, équipement, style, atelier, Kinto\'un, sauvegarde, hors ligne',
  async run({ r, url, getBrowser }) {
    const browser = await getBrowser();

    // ---- démarrage et prologue ----
    {
      const G = await openGame(browser, url);
      await G.prefer(['Bonjour']);
      await G.key('Enter'); await G.wait(500);
      let ok = await G.spam('Game.flags.intro && ' + G.idle, 40000);
      await G.ev('__goto("ball4")');
      ok = ok && await G.spam('Game.hasBall(4) && ' + G.idle, 10000);
      r.step('nouvelle partie : prologue joué, boule à 4 étoiles prise', ok);
      r.step('Goku commence avec le Bâton Magique (visible sur le sprite)', await G.ev('Game.party[0].equip.arme === "nyoibo" && Field.actors[0].sprite.includes("nyoibo")'));
      r.errors(G.errors); await G.close();
    }

    // ---- mini-jeux avec le joueur automatique ----
    {
      const G = await openGame(browser, url);
      for (const [game, skill, minRank] of [['rythme', 1, 3], ['lait', 1, 1], ['briques', 1, 2], ['meditation', 1, 3]]) {
        await G.ev(`__test("plage", 30, 17, {lv:8, party:["goku","bulma"], flags:{roshi:true}}); window.__bot.on = true; window.__bot.skill = ${skill}; window.__r = null; MiniGames.run("${game}", Game.party[0]).then(x => window.__r = x || 'annulé'); 1`);
        await G.wait(400); await G.key('Enter');
        const t0 = Date.now();
        while (Date.now() - t0 < 90000) {
          await G.wait(250);
          const ph = await G.ev('MiniGames.state() ? MiniGames.state().phase : null');
          if (!ph) break;
          if (ph === 'result') { await G.wait(900); await G.key('Enter'); }
        }
        const res = await G.ev('window.__r');
        r.step('mini-jeu ' + game + ' terminé (rang ' + (res && res.rank !== undefined ? ['C', 'B', 'A', 'S'][res.rank] : '?') + ')', !!res && res.rank >= minRank && (await G.ev('Game.mode')) === 'field');
      }
      r.errors(G.errors); await G.close();
    }

    // ---- entraînement chez Tortue Géniale, équipement, style, combat ----
    {
      const G = await openGame(browser, url);
      await G.ev('__test("plage", 30, 17, {lv:8, party:["goku","bulma","krillin"], flags:{roshi:true}, zeni:100}); window.__bot.on = true; window.__bot.skill = 1; 1');
      const ki0 = await G.ev('Game.party[0].maxki');
      await G.ev('__goto("roshi2")'); await G.prefer(['S\'entraîner', 'Rythme', 'Goku']);
      for (let i = 0; i < 40 && !(await G.ev('MiniGames.active()')); i++) await G.key('Enter');
      await G.prefer(['Arrêter']);
      for (let i = 0; i < 400; i++) {
        await G.wait(250);
        const st = await G.ev('MiniGames.active() ? MiniGames.state().phase : "fini"');
        if (st === 'intro') await G.key('Enter');
        if (st === 'result') { await G.wait(900); await G.key('Enter'); }
        if (st === 'fini') break;
      }
      for (let i = 0; i < 40 && (await G.ev('Field.locks || UI.blocking()')); i++) await G.key('Enter');
      r.step('entraînement : rang S au rythme, Ki +12, bandeau gagné', await G.ev(`Game.party[0].maxki === ${ki0} + 12 && Game.gear.bandeau_kame === 1 && Game.train.goku.rythme === 4`));
      // menu Équipement : Goku > Tête > Bandeau de la Tortue
      await G.key('Escape'); await G.key('ArrowDown', 2); await G.key('Enter'); await G.key('Enter');
      await G.key('ArrowDown', 2); await G.key('Enter'); await G.key('ArrowDown'); await G.key('Enter');
      r.step('équipement porté et visible sur le terrain', await G.ev('Game.party[0].equip.tete === "bandeau_kame" && Field.actors[0].sprite.includes("bandeau_kame")'));
      await G.key('Escape'); await G.key('Escape');
      // menu Style : kimono bleu
      await G.key('ArrowDown', 2); await G.key('Enter'); await G.key('ArrowRight'); await G.key('Escape'); await G.key('Escape');
      r.step('style de Goku modifié', await G.ev('Game.party[0].style.gi === 1'));
      await G.shot('feat_style');
      await G.ev('Battle.start(["crabe"], {}); 1'); await G.wait(1500);
      r.step('le combat utilise l\'apparence équipée', await G.ev('Battle.state().party[0].sprite.includes("bandeau_kame")'));
      r.errors(G.errors); await G.close();
    }

    // ---- atelier de techniques ----
    {
      const G = await openGame(browser, url);
      await G.ev('__test("village", 20, 14, {lv:12, party:["goku","bulma","krillin"]})');
      await G.key('Escape'); await G.key('ArrowDown'); await G.key('Enter'); await G.key('Enter');
      const n = await G.ev('Game.party[0].techs.length');
      await G.key('ArrowDown', n); await G.key('Enter'); await G.wait(400);
      await G.key('ArrowDown'); await G.key('ArrowRight');          // forme : boule
      await G.key('ArrowDown'); await G.key('ArrowRight');          // cible : tous
      await G.key('ArrowDown'); await G.key('ArrowRight', 2);       // couleur
      await G.key('ArrowDown', 3); await G.key('ArrowRight');       // effet : paralysie
      await G.key('ArrowDown'); await G.key('ArrowRight', 8, 40);   // coût
      await G.key('ArrowUp', 7); await G.key('Enter');
      for (let i = 0; i < 20; i++) await G.page.keyboard.press('Backspace');
      await G.page.keyboard.type('Bombe Rose', { delay: 30 });
      await G.key('Enter'); await G.key('ArrowUp'); await G.key('Enter'); await G.wait(300);
      const T = await G.ev('(() => { const id = Game.party[0].techs.find(t => TECHS[t] && TECHS[t].custom); return id ? { name: TECHS[id].name, ki: TECHS[id].ki, form: TECHS[id].custom.form, target: TECHS[id].target, effect: TECHS[id].custom.effect } : null; })()');
      r.step('technique créée (nom tapé au clavier)', !!T && T.name === 'Bombe Rose' && T.form === 'boule' && T.target === 'allEnemies' && T.effect === 'stun' && T.ki === 16, JSON.stringify(T));
      await G.key('Escape', 3);
      // en combat
      await G.ev(`Game.party[0].ki = Game.party[0].maxki; window.__res = null; Battle.start(["loup","loup"], {}).then(x => window.__res = x);
        window.__cast = setInterval(() => { const B = Battle.state(); if (!B || !B.menu || B.menu.level !== 'cmd' || B.busy) return; const c = B.menu.who; const foes = B.enemies.filter(e => !e.dead && e.hp > 0); if (!foes.length) return;
          const id = c.id === 'goku' ? c.m.techs.find(t => TECHS[t].custom) : null; const act = id && c.ki >= TECHS[id].ki ? { kind: 'tech', actor: c, id, target: foes[0] } : { kind: 'attack', actor: c, target: foes[0] };
          if (act.kind === 'tech') window.__used = 1; c.queued = true; B.ready = B.ready.filter(x => x !== c); B.actions.push(act); B.menu = null; }, 50); 1`);
      for (let i = 0; i < 120 && !(await G.ev('window.__res')); i++) { await G.wait(200); if (i % 4 === 0) await G.key('Enter'); }
      r.step('la technique perso est lancée en combat', (await G.ev('window.__used')) === 1 && (await G.ev('window.__res')) === 'win');
      // conservée après rechargement
      await G.ev('Game.save()'); await G.page.reload(); await G.wait(500); await G.page.addScriptTag({ path: path.join(__dirname, 'boot.js') });
      await G.key('Enter'); await G.wait(1200);
      r.step('technique perso conservée dans la sauvegarde', await G.ev('Game.party[0].techs.some(t => TECHS[t] && TECHS[t].name === "Bombe Rose")'));
      r.errors(G.errors); await G.close();
    }

    // ---- voyage en Kinto'un ----
    {
      const G = await openGame(browser, url);
      await G.ev('__test("paozu", 11, 9, {lv:3, flags:{roshi:false}})');
      await G.key('Escape'); await G.key('ArrowDown', 5); await G.key('Enter'); await G.wait(200);
      r.step('Kinto\'un indisponible avant de recevoir le nuage', await G.ev('Game.mode === "field" && !WorldMap.active()'));
      await G.key('Escape');
      await G.ev(`__test("plage", 12, 8, {lv:12, party:["goku","bulma","krillin"], flags:{roshi:true, kintounUsed:true, papayeIntro:true, ${visited}}})`);
      const bad = [];
      for (let i = 0; i < ALL_SPOTS.length; i++) {
        await G.ev('Field.run(() => WorldMap.travel()); 1'); await G.wait(300);
        await G.ev(`WorldMap.state().sel = ${i}; 1`); await G.key('Enter');
        const ok = await G.until(`Field.mapId === "${ALL_SPOTS[i]}" && !Field.locks && !UI.blocking() && Game.mode === "field"`, 15000);
        const free = await G.ev('(() => { const L = Field.leader(); return !Field.blocked(L.x, L.y, null) && [[0,-6],[0,6],[-6,0],[6,0]].some(([dx,dy]) => !Field.blocked(L.x+dx, L.y+dy, null)); })()');
        if (!ok || !free) bad.push(ALL_SPOTS[i]);
      }
      r.step('vol et atterrissage vers les ' + ALL_SPOTS.length + ' destinations', !bad.length, bad.join(', '));
      await G.ev(`__test("maison", 5, 4, {flags:{roshi:true, ${visited}}})`);
      await G.ev('Field.run(() => WorldMap.travel()); 1'); await G.wait(400);
      r.step('le nuage refuse de venir à l\'intérieur', await G.ev('UI.blocking() && !WorldMap.active()'));
      r.errors(G.errors); await G.close();
    }

    // ---- sauvegarde complète ----
    {
      const G = await openGame(browser, url);
      await G.ev(`__test("frypan", 3, 17, {lv:12, party:["goku","bulma","krillin","yamcha"], flags:{castleDestroyed:true}, quests:{gyumao:"detruit"}, karma:3}); Game.addGear('bandeau'); equipItem(Game.member('bulma'), 'tete', 'bandeau'); Game.member('goku').style = {gi:3, hair:2, tail:0, emblem:2}; Game.train = {goku:{lait:3}}; 1`);
      const snap = 'JSON.stringify({eq: Game.allMembers().map(m => [m.id, m.equip, m.def, m.lv]), gear: Game.gear, st: Game.member("goku").style, train: Game.train, q: Game.quests, karma: Game.karma})';
      const before = await G.ev(snap);
      await G.ev('Game.save()'); await G.page.reload(); await G.wait(500);
      await G.key('Enter'); await G.wait(1200);
      r.step('sauvegarde et reprise identiques (équipe, équipement, style, quêtes)', (await G.ev(snap)) === before);
      r.step('le château détruit reste détruit après reprise', await G.ev('Field.mapId === "frypan" && Field.tileAt(15, 5) === "v"'));
      r.errors(G.errors); await G.close();
    }

    // ---- application installable et hors ligne ----
    {
      const G = await openGame(browser, url, { serviceWorkers: 'allow', boot: false });
      const active = await G.ev('navigator.serviceWorker.ready.then(x => !!x.active)');
      await G.wait(800);
      await G.ctx.setOffline(true);
      await G.page.reload(); await G.wait(800);
      r.step('service worker actif et jeu jouable hors connexion', active && await G.ev('typeof Main === "object" && Game.mode === "title"'));
      r.errors(G.errors); await G.close();
    }

    // ---- version en un seul fichier ----
    {
      const out = path.join(os.tmpdir(), 'dragon-ball-test.html');
      execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'standalone.js'), out]);
      const G = await openGame(browser, 'file://' + out, { boot: false });
      await G.key('Enter'); await G.wait(1500);
      r.step('version fichier unique : démarre une partie', await G.ev('Game.mode === "field" && Field.mapId === "maison"') && !fs.readFileSync(out, 'utf8').includes('serviceWorker'));
      r.errors(G.errors); await G.close();
    }
  },
};
