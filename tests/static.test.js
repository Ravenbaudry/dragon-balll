// Vérifications rapides, sans navigateur : syntaxe, lint, cartes, références, musiques, mode hors ligne.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const SOLID = new Set(['T', 'F', 'P', 'k', 'r', 'R', '~', 'C', 'X', 'W', '#', 'f', 'I', 'D', 'n', 'L', 'Y', 'H']);

module.exports = {
  title: 'syntaxe, lint, cartes et références',
  async run({ r }) {
    const index = read('index.html');
    const scripts = [...index.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
    r.step('index.html charge ' + scripts.length + ' scripts', scripts.length > 10);

    // ---- syntaxe ----
    const bad = [];
    for (const f of scripts.concat(fs.readdirSync(__dirname).filter(x => x.endsWith('.js')).map(x => 'tests/' + x), ['sw.js', 'tools/standalone.js'])) {
      try { new vm.Script(read(f), { filename: f }); } catch (e) { bad.push(f + ' : ' + e.message); }
    }
    r.step('syntaxe JavaScript', !bad.length, bad.join(' | '));

    // ---- lint : tous les scripts du jeu partagent la même portée, on les lint ensemble ----
    try {
      const { ESLint } = require('eslint');
      const globals = {};
      for (const n of 'window document localStorage navigator location performance requestAnimationFrame setInterval clearInterval setTimeout console Math JSON Object Array String Set Map Promise Float32Array Infinity parseFloat parseInt isNaN AudioContext'.split(' ')) globals[n] = 'readonly';
      const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: { languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals }, rules: { 'no-undef': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'error', 'no-const-assign': 'error' } } });
      const code = scripts.map(f => read(f)).join('\n;\n');
      const [res] = await eslint.lintText(code, { filePath: 'jeu.js' });
      const errs = res.messages.filter(m => m.severity === 2);
      r.step('lint (variables inconnues, doublons…)', !errs.length, errs.slice(0, 5).map(m => m.message + ' (ligne ' + m.line + ')').join(' | '));
    } catch (e) { r.step('lint', false, 'ESLint indisponible : ' + e.message); }

    // ---- données du jeu ----
    const ctx = { console, Math, UI: {}, Field: {}, Game: { flags: {}, hasBall: () => false, quest: () => null, member: () => null }, Battle: {}, SND: {}, wait: () => {}, Main: {}, window: {}, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), pick: a => a[0], rand: (a, b) => a };
    vm.createContext(ctx);
    for (const f of ['sprites', 'monsters', 'data', 'gear', 'techs', 'maps', 'tournoi', 'worldmap']) {
      const file = 'js/' + f + '.js';
      if (fs.existsSync(path.join(ROOT, file))) vm.runInContext(read(file).replace(/^const /gm, 'var ').replace(/^let /gm, 'var '), ctx, { filename: file });
    }
    const { MAPS, ENEMIES, ITEMS, GEAR, CHARS, MONSTERS, QUESTS } = ctx;
    const known = id => ITEMS[id] || GEAR[id];
    const pb = [];
    const src = scripts.map(f => read(f)).join('\n');
    for (const m of src.matchAll(/Battle\.start\(\[([^\]]*)\]/g)) for (const id of (m[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1))) if (!ENEMIES[id]) pb.push('ennemi inconnu ' + id);
    for (const m of src.matchAll(/(?<![.\w])getItem\('([a-z_]+)'/g)) if (!known(m[1])) pb.push('objet inconnu ' + m[1]);
    for (const m of src.matchAll(/openShop\(\[([^\]]*)\]/g)) for (const id of m[1].match(/'([^']+)'/g).map(x => x.slice(1, -1))) if (!known(id)) pb.push('article inconnu ' + id);
    for (const m of src.matchAll(/sprite: '([A-Za-z0-9_]+)'/g)) if (!CHARS[m[1]]) pb.push('sprite inconnu ' + m[1]);
    for (const m of src.matchAll(/npc\('[^']+', '([A-Za-z0-9_]+)'/g)) if (!CHARS[m[1]]) pb.push('sprite de PNJ inconnu ' + m[1]);
    for (const m of src.matchAll(/mon: '([a-z_]+)'/g)) if (!MONSTERS[m[1]]) pb.push('monstre inconnu ' + m[1]);
    for (const m of src.matchAll(/setQuest\('([a-z]+)', '([a-z]+)'/g)) { if (!QUESTS[m[1]]) pb.push('quête inconnue ' + m[1]); else if (!QUESTS[m[1]].steps[m[2]]) pb.push('étape inconnue ' + m[1] + '/' + m[2]); }
    for (const [id, d] of Object.entries(ENEMIES)) { if (d.spr && !MONSTERS[d.spr]) pb.push('sprite d\'ennemi inconnu ' + id); if (d.char && !CHARS[d.char]) pb.push('personnage d\'ennemi inconnu ' + id); }
    for (const [id, d] of Object.entries(ctx.TRAINING || {})) if (!GEAR[d.prize]) pb.push('prix d\'entraînement inconnu ' + id);
    r.step('références (ennemis, objets, sprites, quêtes)', !pb.length, pb.slice(0, 6).join(' | '));

    // ---- cartes ----
    const mp = [];
    const walk = (m, x, y) => { const t = (m.rows[Math.floor(y)] || '')[Math.floor(x)]; return t && !SOLID.has(t); };
    for (const [id, m] of Object.entries(MAPS)) {
      const w = m.rows[0].length;
      m.rows.forEach((row, i) => { if (row.length !== w) mp.push(id + ' : ligne ' + i + ' de longueur ' + row.length); });
      for (const e of m.entities()) {
        if (e.kind === 'warp') {
          const dm = MAPS[e.to];
          if (!dm) { mp.push(id + ' : sortie vers une carte inconnue ' + e.to); continue; }
          if (!walk(dm, (e.dx * 16 + 8) / 16, (e.dy * 16 + 14) / 16)) mp.push(id + ' → ' + e.to + ' : arrivée dans un mur');
          for (let x = e.tx; x < e.tx + (e.tw || 1); x++) for (let y = e.ty; y < e.ty + (e.th || 1); y++) if (!walk(m, x, y)) mp.push(id + ' : sortie sur une case pleine ' + x + ',' + y);
        } else if (e.tx !== undefined && !['trigger', 'fire'].includes(e.kind) && e.visible !== false && !walk(m, (e.tx * 16 + 8) / 16, (e.ty * 16 + 14) / 16)) {
          mp.push(id + ' : ' + e.kind + ' ' + (e.id || (e.group || []).join('+')) + ' dans un mur');
        }
      }
    }
    for (const s of ctx.WorldMap.SPOTS) { const [map, tx, ty] = s.land; if (!MAPS[map] || !walk(MAPS[map], (tx * 16 + 8) / 16, (ty * 16 + 14) / 16)) mp.push('Kinto\'un : atterrissage impossible à ' + s.name); }
    r.step('cartes (' + Object.keys(MAPS).length + ') : lignes, sorties, entités, atterrissages', !mp.length, mp.slice(0, 6).join(' | '));

    // ---- musiques : toutes les voies d'une boucle ont la même longueur ----
    const audio = read('js/audio.js');
    const SONGS = vm.runInNewContext('(' + audio.match(/const SONGS = (\{[\s\S]*?\n {2}\});/)[1] + ')');
    const sp = [];
    for (const [k, s] of Object.entries(SONGS)) {
      if (s.loop === false) continue;
      const lens = s.ch.map(c => c.n.trim().split(/\s+/).reduce((a, tok) => { const l = tok.split(':')[1]; return a + (l ? parseFloat(l) : c.d); }, 0));
      const max = Math.max(...lens);
      if (lens.some(l => max % l)) sp.push(k + ' (' + lens.join('/') + ')');
    }
    r.step('musiques en boucle bien alignées (' + Object.keys(SONGS).length + ')', !sp.length, sp.join(' | '));

    // ---- mode hors ligne : le service worker connaît tous les fichiers ----
    const sw = read('sw.js');
    const cached = [...sw.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
    const missing = scripts.filter(f => !cached.includes(f));
    const absent = cached.filter(f => f !== './' && !fs.existsSync(path.join(ROOT, f)));
    r.step('service worker : tous les scripts en cache, fichiers présents', !missing.length && !absent.length, missing.concat(absent).join(', '));
    const man = JSON.parse(read('manifest.webmanifest'));
    r.step('manifeste d\'application valide', man.icons.every(i => fs.existsSync(path.join(ROOT, i.src))) && !!man.start_url);
  },
};
