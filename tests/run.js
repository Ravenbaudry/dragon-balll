// Lance les tests du jeu.
//   node tests/run.js            -> tout
//   node tests/run.js static     -> vérifications rapides (sans navigateur)
//   node tests/run.js features story-good story-bad ...
const { start } = require('./server');
const { reporter } = require('./helpers');

const SUITES = {
  static: () => require('./static.test'),
  features: () => require('./features.test'),
  'story-good': () => require('./story.test').variant('good'),
  'story-bad': () => require('./story.test').variant('bad'),
  tournoi: () => require('./tournoi.test'),
  ruban: () => require('./ruban.test'),
};

(async () => {
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SUITES);
  for (const n of names) if (!SUITES[n]) { console.error('Suite inconnue : ' + n + ' (possibles : ' + Object.keys(SUITES).join(', ') + ')'); process.exit(2); }
  const { srv, url } = await start();
  let browser = null;
  const getBrowser = async () => {
    if (!browser) { const { chromium } = require('playwright'); browser = await chromium.launch(); }
    return browser;
  };
  const fails = [];
  const t0 = Date.now();
  for (const n of names) {
    const suite = SUITES[n]();
    console.log('\n=== ' + n + ' — ' + suite.title);
    const r = reporter(n);
    const s0 = Date.now();
    try { await suite.run({ r, url, getBrowser }); } catch (e) { r.step('exception', false, e.stack || String(e)); }
    console.log('  (' + Math.round((Date.now() - s0) / 1000) + ' s)');
    fails.push(...r.fails);
  }
  if (browser) await browser.close();
  srv.close();
  console.log('\n' + (fails.length ? fails.length + ' échec(s) :\n- ' + fails.join('\n- ') : 'Tous les tests sont passés.') + '  [' + Math.round((Date.now() - t0) / 1000) + ' s]');
  process.exit(fails.length ? 1 : 0);
})();
