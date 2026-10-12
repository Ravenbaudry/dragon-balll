// Voyage rapide sur le nuage Kinto'un : on survole la carte du monde et on choisit un lieu déjà visité.
const WorldMap = (() => {
  const SPOTS = [
    { id: 'paozu', name: 'Mont Paozou', x: 40, y: 112, land: ['paozu', 11, 9, 'down'], desc: 'La maison de Goku et la tombe de Grand-père Gohan.' },
    { id: 'foret', name: 'Forêt de Paozou', x: 86, y: 120, land: ['foret', 31, 20, 'down'], desc: 'Une forêt profonde, son étang et ses herbes rares.' },
    { id: 'plage', name: 'Kame House', x: 116, y: 179, land: ['plage', 29, 17, 'up'], desc: 'La maison de Tortue Géniale. Idéal pour s\'entraîner !' },
    { id: 'route', name: 'Route de la Montagne', x: 132, y: 148, land: ['route', 33, 7, 'down'], desc: 'Le chemin des brigands, à travers la montagne.' },
    { id: 'village', name: 'Village d\'Aru', x: 150, y: 108, land: ['village', 12, 12, 'down'], desc: 'Boutique, auberge et villageois accueillants.' },
    { id: 'desert', name: 'Désert de Diablo', x: 158, y: 66, land: ['desert', 22, 9, 'down'], desc: 'Le territoire de Yamcha et l\'oasis du nomade.' },
    { id: 'frypan', name: 'Mont Frypan', x: 220, y: 70, land: ['frypan', 3, 17, 'down'], desc: 'Le royaume du roi Gyumao, au pied du volcan.' },
    { id: 'chateau', name: 'Château de Pilaf', x: 150, y: 28, land: ['chateau', 6, 10, 'down'], desc: 'Le repaire de l\'empereur Pilaf. Méfiance !' },
    { id: 'papaye', name: 'Île Papaye', x: 200, y: 179, land: ['papaye', 20, 20, 'up'], desc: 'L\'île du Championnat du monde des arts martiaux.' },
  ];
  const ROADS = [['paozu', 'foret'], ['foret', 'plage'], ['plage', 'route'], ['route', 'village'], ['village', 'desert'], ['desert', 'chateau'], ['desert', 'frypan'], ['plage', 'papaye']];
  const spot = id => SPOTS.find(s => s.id === id);
  const visited = s => !!Game.flags['vu_' + s.id];

  // ---------- Dessin de la carte (une seule fois) ----------
  let bg = null;
  function build() {
    const c = GFX.mk(SW, SH), x = c.getContext('2d');
    const LAND = [[130, 98, 112, 60], [58, 110, 52, 42], [150, 42, 70, 34], [216, 70, 34, 40], [92, 154, 40, 12]];
    const ISLES = [[121, 178, 12, 6], [200, 174, 14, 8]];
    const inE = (px, py, [cx, cy, rx, ry], n) => ((px - cx) / (rx + n)) ** 2 + ((py - cy) / (ry + n)) ** 2 <= 1;
    const land = (px, py) => { const n = (GFX.hash(px >> 2, py >> 2, 9) % 7) - 3; return LAND.some(e => inE(px, py, e, n)) || ISLES.some(e => inE(px, py, e, 0)); };
    const grid = [];
    for (let j = 0; j < SH; j++) { grid.push([]); for (let i = 0; i < SW; i++) grid[j].push(land(i, j)); }
    const near = (i, j, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const yy = j + dy, xx = i + dx; if (yy >= 0 && yy < SH && xx >= 0 && xx < SW && !grid[yy][xx]) return true; } return false; };
    const d2 = (i, j, cx, cy, rx, ry) => ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2;
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
      const h = GFX.hash(i, j, 4) % 100;
      let col;
      if (!grid[j][i]) col = near(i, j, 2) && !near(i, j, 0) ? '#5a8ee0' : h < 3 ? '#3a70c8' : '#2c5cb4';
      else if (near(i, j, 1)) col = '#f0e0a8';
      else if (d2(i, j, 158, 54, 64, 36) < 1) col = h < 8 ? '#c89858' : '#e0b878';
      else if (d2(i, j, 220, 68, 30, 34) < 1) col = h < 10 ? '#4a3430' : '#6a4a40';
      else if (d2(i, j, 62, 116, 46, 26) < 1) col = h < 25 ? '#246428' : '#2e7a34';
      else col = h < 10 ? '#4c9a40' : h > 94 ? '#78c058' : '#5aa848';
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    // arbres de la forêt
    for (let k = 0; k < 70; k++) {
      const tx = 24 + GFX.hash(k, 1, 7) % 82, ty = 98 + GFX.hash(k, 2, 7) % 34;
      if (d2(tx, ty, 62, 116, 44, 24) > 1) continue;
      x.fillStyle = '#123a18'; x.fillRect(tx - 2, ty - 1, 5, 4); x.fillStyle = '#3a9040'; x.fillRect(tx - 1, ty - 2, 3, 3); x.fillStyle = '#5ab858'; x.fillRect(tx - 1, ty - 2, 1, 1);
    }
    // montagnes
    for (const [mx, my, s] of [[118, 140, 8], [132, 134, 10], [146, 142, 8], [124, 158, 7], [176, 128, 7], [104, 136, 6], [190, 104, 7], [200, 120, 6]]) {
      for (let r = 0; r < s; r++) { x.fillStyle = r < 2 ? '#f0f0f8' : r % 2 ? '#7a7a8c' : '#8a8a9c'; x.fillRect(mx - r, my - s + r, r * 2 + 1, 1); }
      x.fillStyle = '#5a5a6a'; x.fillRect(mx, my - s + 2, 1, s - 2);
    }
    // dunes du désert
    for (let k = 0; k < 30; k++) { const dx = 110 + GFX.hash(k, 3, 7) % 96, dy = 34 + GFX.hash(k, 4, 7) % 40; if (d2(dx, dy, 158, 54, 60, 32) < 1) { x.fillStyle = '#c89858'; x.fillRect(dx, dy, 5, 1); x.fillStyle = '#f8d898'; x.fillRect(dx + 1, dy - 1, 3, 1); } }
    // volcan
    for (let r = 0; r < 14; r++) { x.fillStyle = r < 3 ? '#d83c10' : r % 2 ? '#3a2826' : '#4a3430'; x.fillRect(220 - r - 2, 48 + r, r * 2 + 5, 1); }
    x.fillStyle = '#f8a020'; x.fillRect(219, 49, 3, 2);
    // château de Pilaf
    x.fillStyle = K; x.fillRect(141, 19, 19, 12);
    x.fillStyle = '#8a90a8'; x.fillRect(142, 22, 17, 8); x.fillStyle = '#5a6078'; x.fillRect(148, 25, 5, 5);
    for (const tx of [141, 148, 156]) { x.fillStyle = K; x.fillRect(tx, 14, 5, 8); x.fillStyle = '#a8b0c8'; x.fillRect(tx + 1, 16, 3, 6); x.fillStyle = '#d83030'; x.fillRect(tx, 13, 5, 3); }
    // village d'Aru : petites maisons-dômes
    for (const [hx, hy] of [[142, 102], [152, 100], [158, 106], [146, 110]]) { x.fillStyle = K; x.fillRect(hx - 3, hy - 3, 7, 5); x.fillStyle = '#f0f0f8'; x.fillRect(hx - 2, hy - 2, 5, 3); x.fillStyle = '#5888d8'; x.fillRect(hx, hy, 1, 1); }
    // maison de Goku
    x.fillStyle = K; x.fillRect(30, 98, 9, 7); x.fillStyle = '#e8d8b0'; x.fillRect(31, 101, 7, 3); x.fillStyle = '#c84838'; x.fillRect(30, 98, 9, 3);
    // Kame House sur son île
    x.fillStyle = K; x.fillRect(122, 170, 9, 8); x.fillStyle = '#f8a8c0'; x.fillRect(123, 173, 7, 4); x.fillStyle = '#d83030'; x.fillRect(122, 170, 9, 3);
    x.fillStyle = '#3a9040'; x.fillRect(132, 173, 2, 3);
    // île Papaye : l'arène et la pagode du tournoi
    x.fillStyle = K; x.fillRect(186, 167, 11, 8); x.fillStyle = '#d0ccbc'; x.fillRect(187, 168, 9, 6); x.fillStyle = '#8a8676'; x.fillRect(187, 173, 9, 1);
    x.fillStyle = K; x.fillRect(204, 164, 7, 9); x.fillStyle = '#d84030'; x.fillRect(205, 167, 5, 5); x.fillStyle = '#3c8a54'; x.fillRect(203, 164, 9, 3);
    // routes en pointillés
    for (const [a, b] of ROADS) {
      const A = spot(a), B = spot(b), n = Math.hypot(B.x - A.x, B.y - A.y) / 4;
      for (let k = 1; k < n; k++) {
        if (k % 2) continue;
        const px = A.x + (B.x - A.x) * k / n, py = A.y + (B.y - A.y) * k / n;
        x.fillStyle = 'rgba(255,240,200,0.75)'; x.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    }
    return c;
  }

  // ---------- État ----------
  let W = null;
  function open(here) {
    return new Promise(res => {
      if (!bg) bg = build();
      W = { phase: 'select', here, sel: SPOTS.indexOf(here), t: 0, res };
      Game.mode = 'worldmap';
      SND.playMusic('title');
      Input.clear();
    });
  }
  function close(result) {
    const r = W.res;
    W = null;
    Game.mode = 'field';
    Input.clear();
    r(result);
  }
  function move(dx, dy) {
    const cur = SPOTS[W.sel];
    let best = -1, bd = 1e9;
    SPOTS.forEach((s, i) => {
      if (i === W.sel || !visited(s)) return;
      const vx = s.x - cur.x, vy = s.y - cur.y, d = Math.hypot(vx, vy);
      const dot = (vx * dx + vy * dy) / d;
      if (dot < 0.4) return; // dans la direction demandée (environ ±65°)
      const score = d * (2 - dot);
      if (score < bd) { bd = score; best = i; }
    });
    if (best >= 0) { W.sel = best; SND.sfx('cursor'); }
  }
  function update() {
    if (!W) return;
    W.t++;
    if (W.phase === 'select') {
      if (Input.repeat('left')) move(-1, 0);
      else if (Input.repeat('right')) move(1, 0);
      else if (Input.repeat('up')) move(0, -1);
      else if (Input.repeat('down')) move(0, 1);
      if (Input.pressed('a')) { SND.sfx('confirm'); close(SPOTS[W.sel]); }
      else if (Input.pressed('b')) { SND.sfx('cancel'); SND.playMusic(Field.map.music); close(null); }
    } else if (W.phase === 'fly') {
      if (W.t % 6 === 0) W.trail.push({ x: W.fx, y: W.fy, t: 0 });
      W.trail.forEach(p => p.t++);
      W.trail = W.trail.filter(p => p.t < 30);
      const k = Math.min(1, W.t / 80), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const A = W.from, B = W.to;
      W.fx = A.x + (B.x - A.x) * e;
      W.fy = A.y + (B.y - A.y) * e - Math.sin(k * Math.PI) * 26;
      if (W.t >= 95) close(B);
    }
  }
  function drawRider(x, y, t) {
    const img = GFX.rider(charKey('goku'));
    ctx.drawImage(img, Math.round(x - 17), Math.round(y - 44 + Math.sin(t * 0.12) * 2));
  }
  function draw() {
    if (!W) return;
    const t = W.t;
    ctx.drawImage(bg, 0, 0);
    // reflets sur la mer et fumée du volcan
    for (let i = 0; i < 14; i++) { const px = (GFX.hash(i, 8) % SW + t * 0.2) % SW, py = 186 + GFX.hash(i, 9) % 36; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(Math.round(px), py, 3, 1); }
    for (let i = 0; i < 4; i++) { const p = ((t + i * 25) % 100) / 100; ctx.fillStyle = 'rgba(80,70,70,' + (0.6 - p * 0.6) + ')'; ctx.beginPath(); ctx.arc(220 + p * 8, 46 - p * 26, 2 + p * 4, 0, 7); ctx.fill(); }
    // lieux
    SPOTS.forEach((s, i) => {
      const v = visited(s), on = W.phase === 'select' && i === W.sel;
      ctx.fillStyle = K; ctx.beginPath(); ctx.arc(s.x, s.y, on ? 6 : 5, 0, 7); ctx.fill();
      ctx.fillStyle = v ? (on ? '#ffffff' : '#f8c838') : '#6a7088'; ctx.beginPath(); ctx.arc(s.x, s.y, on ? 4 : 3, 0, 7); ctx.fill();
      if (v && s === W.here) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 - (t % 40) / 50) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.x, s.y, 6 + (t % 40) / 5, 0, 7); ctx.stroke(); }
    });
    if (W.phase === 'select') {
      const s = SPOTS[W.sel];
      drawRider(s.x, s.y - 4, t);
      UI.win(4, 4, 74, 20);
      FONT.drawCentered(ctx, 'Kinto\'un', 41, 8, UI.YEL);
      UI.win(4, 188, 248, 32);
      FONT.draw(ctx, s.name + (s === W.here ? ' (ici)' : ''), 12, 193, UI.YEL);
      FONT.drawRight(ctx, 'Z : voler  X : annuler', 244, 193, UI.GRAY);
      FONT.draw(ctx, s.desc, 12, 206, '#ffffff');
    } else {
      for (const p of W.trail) { ctx.fillStyle = 'rgba(255,240,140,' + (1 - p.t / 30) + ')'; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 2), 3, 3); }
      drawRider(W.fx, W.fy, t);
      UI.win(4, 188, 248, 32);
      FONT.drawCentered(ctx, 'En route pour : ' + W.to.name, 128, 199, '#ffffff');
    }
  }
  function flight(from, to) {
    return new Promise(res => {
      W = { phase: 'fly', from, to, t: 0, fx: from.x, fy: from.y, trail: [], res };
      Game.mode = 'worldmap';
      SND.sfx('disc');
    });
  }

  // ---------- Décollage et atterrissage sur le terrain ----------
  async function takeOff() {
    const L = Field.leader();
    const c = Field.addEntity({ kind: 'img', img: GFX.kintoun(), x: L.x + 150, y: L.y - 60, sortOff: 999, solid: false });
    SND.sfx('disc');
    await Tasks.tween(c, { x: L.x, y: L.y + 6 }, 34, 'out');
    await Field.partyGather();
    SND.sfx('jump');
    await Field.jump(L, 10, 14);
    Field.hideParty = true;
    c.img = GFX.rider(charKey('goku'));
    await wait(12);
    SND.sfx('disc');
    await Tasks.tween(c, { x: c.x + 230, y: c.y - 180 }, 40, 'in');
    c.gone = true;
  }
  async function land(dest) {
    await UI.fadeTo(1, 16);
    const [map, tx, ty, dir] = dest.land;
    Field.load(map, tx, ty, dir);
    Field.hideParty = true;
    const L = Field.leader();
    const c = Field.addEntity({ kind: 'img', img: GFX.rider(charKey('goku')), x: L.x - 220, y: L.y - 170, sortOff: 999, solid: false });
    await UI.fadeTo(0, 16);
    SND.sfx('disc');
    await Tasks.tween(c, { x: L.x, y: L.y + 6 }, 46, 'out');
    SND.sfx('jump');
    c.img = GFX.kintoun();
    Field.hideParty = false;
    await Field.jump(L, 8, 12);
    await Tasks.tween(c, { x: c.x - 230, y: c.y - 160 }, 36, 'in');
    c.gone = true;
    if (Field.map.onEnter) await Field.map.onEnter();
  }

  // Tout le voyage : choix du lieu, décollage, survol, atterrissage
  async function travel() {
    const here = spot(Field.mapId);
    if (!here) { await UI.say(null, 'Le nuage magique ne peut pas venir ici. Il faut être à l\'air libre !'); return; }
    Game.flags['vu_' + here.id] = true;
    const dest = await open(here);
    if (!dest) return;
    if (!Game.flags.kintounUsed) {
      Game.flags.kintounUsed = true;
      await UI.say('Goku', 'Kinto\'uuun !');
      await UI.say('Bulma', 'Attends-nous, Goku ! ... Ce nuage ne veut pas de moi ! Bon, je m\'accroche à ta ceinture, et pas de loopings !');
    }
    await takeOff();
    await flight(here, dest);
    await land(dest);
  }
  const unlocked = () => !!Game.flags.roshi;
  return { travel, update, draw, unlocked, SPOTS, active: () => !!W, state: () => W };
})();
