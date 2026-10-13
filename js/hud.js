// Affichages par-dessus l'exploration : mini-carte, rappel de l'objectif, détecteur du Dragon Radar.
const Hud = (() => {
  const TCOL = {
    '.': '#3c8a3a', ',': '#3c8a3a', '"': '#2e7a30', s: '#d8c088', p: '#a8804c', d: '#a8804c', c: '#8a8aa0', w: '#a87040', v: '#5a4440', m: '#a82434',
    '~': '#3070d0', L: '#d84010', b: '#a87040', B: '#a87040', z: '#e8f0f8', q: '#70788c', g: '#e8eef8', K: '#70b0f0',
  };
  const SOLID_COL = '#141a24';
  let mini = null, banner = null, lastMap = null;

  // Objectif : l'étape en cours de la quête principale la plus récente
  function objective() {
    const ids = Object.keys(QUESTS).filter(id => QUESTS[id].main).reverse();
    for (const id of ids) { const st = Game.quests[id]; if (st && st !== 'done') return QUESTS[id].steps[st] || null; }
    return null;
  }

  function buildMini() {
    const W = Field.W, H = Field.H, k = W > 40 || H > 34 ? 1 : 2;
    const c = GFX.mk(W * k, H * k), x = c.getContext('2d');
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      const ch = Field.tileAt(tx, ty);
      const c2 = Field.map.snow && '.,"'.includes(ch) ? 'g' : ch;
      x.fillStyle = Field.solid[ty][tx] && ch !== '~' && ch !== 'L' && ch !== 'K' ? SOLID_COL : (TCOL[c2] || '#3c8a3a');
      x.fillRect(tx * k, ty * k, k, k);
    }
    return { id: Field.mapId, v: Field.version, c, k };
  }
  function drawMini() {
    if (!mini || mini.id !== Field.mapId || mini.v !== Field.version) mini = buildMini();
    const { c, k } = mini, w = c.width, h = c.height, x0 = SW - w - 6, y0 = 6;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#000'; ctx.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
    ctx.fillStyle = '#8898e0'; ctx.fillRect(x0 - 2, y0 - 2, w + 4, 1); ctx.fillRect(x0 - 2, y0 + h + 1, w + 4, 1); ctx.fillRect(x0 - 2, y0 - 2, 1, h + 4); ctx.fillRect(x0 + w + 1, y0 - 2, 1, h + 4);
    ctx.drawImage(c, x0, y0);
    for (const e of Field.entities) {
      if (e.gone) continue;
      if (e.kind === 'warp') { ctx.fillStyle = '#f8d048'; ctx.fillRect(x0 + e.tx * k, y0 + e.ty * k, (e.tw || 1) * k, (e.th || 1) * k); }
      else if (e.kind === 'save') { ctx.fillStyle = '#80f0ff'; ctx.fillRect(x0 + Math.floor(e.x / 16) * k, y0 + Math.floor(e.y / 16) * k, k, k); }
    }
    ctx.globalAlpha = 1;
    const L = Field.leader();
    if (L && Math.floor(Game.frame / 12) % 3) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(x0 + L.x / 16 * k - 1), Math.round(y0 + (L.y - 4) / 16 * k - 1), Math.max(2, k + 1), Math.max(2, k + 1));
    }
  }
  function drawBanner() {
    const a = Math.min(1, banner.t / 20, (240 - banner.t) / 20);
    const line = FONT.wrap('Objectif : ' + banner.text, 200)[0];
    const w = FONT.measure(line) + 16;
    UI.win(4, SH - 26, w, 20, a);
    ctx.globalAlpha = a; FONT.draw(ctx, line, 12, SH - 21, '#a8f0c8'); ctx.globalAlpha = 1;
  }

  function draw() {
    if (Game.mode !== 'field' || !Field.map || Field.battle) return;
    const calm = !Field.locks && !UI.blocking() && !Field.hideParty;
    if (Field.mapId !== lastMap) {
      lastMap = Field.mapId;
      const obj = objective();
      banner = Opt.get('objective') && obj ? { text: obj, t: 0 } : null;
    }
    if (Field.map.hud) Field.map.hud(calm); // chronomètre, compteur... propres à une carte
    if (!calm) return;
    if (Opt.get('minimap')) drawMini();
    if (banner) { banner.t++; drawBanner(); if (banner.t >= 240) banner = null; }
    if (window.Explore) window.Explore.drawHud();
  }
  return { draw, objective, reset() { lastMap = null; banner = null; } };
})();
