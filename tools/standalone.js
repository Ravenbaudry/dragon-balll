// Génère dragon-ball.html : le jeu complet dans un seul fichier.
// Usage : node tools/standalone.js [fichier-de-sortie]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dragon-ball.html');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => {
  const code = fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return '<script>\n' + code + '\n</script>';
});
// la version fichier unique n'a ni manifeste ni service worker
html = html.replace(/<!-- pwa -->[\s\S]*?<!-- \/pwa -->\n?/g, '');
fs.writeFileSync(out, html);
console.log('Écrit :', out, '(' + Math.round(html.length / 1024) + ' Ko)');
