// Outils communs aux tests : ouverture du jeu dans Chromium, touches, attentes, rapport.
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });

// Ouvre le jeu dans un nouveau contexte (stockage vierge) et injecte les outils de test.
async function openGame(browser, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 768, height: 700 }, serviceWorkers: opts.serviceWorkers || 'block' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  await page.goto(url + (opts.file || ''));
  await page.waitForTimeout(400);
  if (opts.boot !== false) await page.addScriptTag({ path: path.join(__dirname, 'boot.js') });
  const G = {
    page, ctx, errors,
    idle: '(!Field.locks && !Field.battle && !UI.blocking())',
    ev: s => page.evaluate(s),
    wait: ms => page.waitForTimeout(ms),
    async key(k, n = 1, d = 90) { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(d); } },
    async tap(k = 'Enter') { await page.keyboard.down(k); await page.waitForTimeout(40); await page.keyboard.up(k); },
    async hold(k, ms) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); },
    // appuie sur Entrée jusqu'à ce que la condition (code JS) soit vraie
    async spam(until, ms = 30000, key = 'Enter') {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        await G.tap(key); await page.waitForTimeout(100);
        if (await page.evaluate(until)) return true;
      }
      return false;
    },
    async until(cond, ms = 30000, step = 150) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) { if (await page.evaluate(cond)) return true; await page.waitForTimeout(step); }
      return false;
    },
    shot: name => page.locator('#screen').screenshot({ path: path.join(OUT, name + '.png') }),
    prefer: list => page.evaluate('window.__prefer = ' + JSON.stringify(list)),
    close: () => ctx.close(),
  };
  return G;
}

// Petit rapport de test : chaque étape est OK ou ÉCHEC, on continue jusqu'au bout.
function reporter(name) {
  const fails = [];
  return {
    fails,
    step(label, ok, extra = '') {
      console.log((ok ? '  ok    ' : '  ÉCHEC ') + label + (extra ? '  ' + extra : ''));
      if (!ok) fails.push(name + ' › ' + label);
      return ok;
    },
    errors(list) {
      const real = list.filter(e => !/favicon|Service Worker registration blocked/i.test(e)); // bruit propre aux tests
      return this.step('aucune erreur JavaScript', !real.length, real.slice(0, 5).join(' | '));
    },
  };
}

module.exports = { openGame, reporter, OUT };
