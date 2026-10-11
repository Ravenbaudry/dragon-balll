// Construction des images : personnages, monstres, tuiles procédurales, décors.
const GFX = (() => {
  const TS = 16;
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hash(x, y, k = 0) {
    let h = (x * 374761393 + y * 668265263 + k * 2147483647) >>> 0;
    h = (h ^ (h >> 13)) * 1274126177 >>> 0;
    return (h ^ (h >> 16)) >>> 0;
  }
  const warned = new Set();
  function expand(rows, w) {
    return rows.map(r => {
      if (r.length === w / 2) r = r + r.split('').reverse().join('');
      if (r.length !== w && !warned.has(r)) { warned.add(r); console.warn('Ligne de sprite de longueur', r.length, '≠', w, ':', r); }
      return r.padEnd(w, '.').slice(0, w);
    });
  }
  function paint(ctx, rows, pal, ox = 0, oy = 0) {
    for (let y = 0; y < rows.length; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
  function mirror(src) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }
  function flash(src, color = '#ffffff') {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function rotate90(src) {
    const c = mk(src.height, src.width), x = c.getContext('2d');
    x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(src, 0, 0);
    return c;
  }

  // ---------------- Personnages ----------------
  function liftHalf(rows, half) {
    // Soulève le pied gauche (half=0) ou droit (half=1) d'un pixel : lignes 19-23 (indices 8-12 du corps)
    const out = rows.slice();
    const x0 = half ? 8 : 0, x1 = half ? 16 : 8;
    for (let i = 8; i <= 12; i++) {
      const src = i < 12 ? out[i + 1] : '.'.repeat(16);
      out[i] = out[i].slice(0, x0) + src.slice(x0, x1) + out[i].slice(x1);
    }
    return out;
  }
  function swayRobe(rows, dir) {
    const out = rows.slice();
    for (let i = 9; i <= 12; i++) {
      const r = out[i];
      out[i] = dir > 0 ? '.' + r.slice(0, 15) : r.slice(1) + '.';
    }
    return out;
  }
  function buildChar(name) {
    const def = CHARS[name];
    const pal = Object.assign({}, BASE_PAL, PALS[def.pal]);
    if (!pal.p) pal.p = pal.c; if (!pal.P) pal.P = pal.C;
    if (!pal.l) pal.l = pal.d; if (!pal.L) pal.L = pal.D || pal.d;
    if (!pal.F) pal.F = pal.f; if (!pal.D) pal.D = pal.d;
    const head = HEADS[def.head], body = BODIES[def.body], over = def.over ? OVERLAYS[def.over] : null;
    const out = {};
    for (const dir of ['down', 'up', 'right']) {
      const bRows = expand(body[dir], 16);
      const hRows = expand(head[dir], 16);
      const variants = [bRows];
      if (dir === 'right') {
        if (body.walk) body.walk.forEach(w => variants.push(bRows.slice(0, 8).concat(expand(w, 16))));
        else { variants.push(swayRobe(bRows, 1)); variants.push(swayRobe(bRows, -1)); }
      } else if (def.body === 'robe') {
        variants.push(swayRobe(bRows, 1)); variants.push(swayRobe(bRows, -1));
      } else {
        variants.push(liftHalf(bRows, 0)); variants.push(liftHalf(bRows, 1));
      }
      out[dir] = variants.map(br => {
        const c = mk(16, 24), x = c.getContext('2d');
        paint(x, br, pal, 0, 11);
        if (over && over[dir]) paint(x, expand(over[dir].slice(1), 16), pal, 0, over[dir][0]);
        paint(x, hRows, pal, 0, 0);
        return c;
      });
    }
    out.left = out.right.map(mirror);
    // Pose d'attaque (bras tendu vers la droite)
    const atk = mk(16, 24), ax = atk.getContext('2d');
    ax.drawImage(out.right[1], 0, 0);
    paint(ax, ['........kkkkkk..', '........kaasssk.', '........kkkkkk..'], pal, 1, 13);
    out.attack = atk;
    out.attackL = mirror(atk);
    out.ko = rotate90(out.down[0]);
    out.koL = mirror(out.ko);
    out.white = flash(out.right[0]);
    out.whiteL = mirror(out.white);
    return out;
  }
  const charCache = {};
  function char(name) { return charCache[name] || (charCache[name] = buildChar(name)); }

  const monCache = {};
  function monster(name) {
    if (monCache[name]) return monCache[name];
    const m = MONSTERS[name];
    const w = Math.max(...m.rows.map(r => r.length));
    const rows = m.rows.map(r => r.padEnd(w, '.'));
    const c = mk(w, rows.length);
    paint(c.getContext('2d'), rows, Object.assign({ k: K }, m.pal));
    const r = { img: c, imgR: mirror(c), white: flash(c), whiteR: flash(mirror(c)), w, h: rows.length };
    return (monCache[name] = r);
  }

  // ---------------- Formes utilitaires ----------------
  function shape(w, h, inside, colorAt, outline) {
    // Rend une forme pixel art : remplissage via colorAt(x,y) et contour 1px.
    const c = mk(w, h), x = c.getContext('2d');
    const m = [];
    for (let j = 0; j < h; j++) { m.push([]); for (let i = 0; i < w; i++) m[j].push(inside(i, j)); }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (m[j][i]) { x.fillStyle = colorAt(i, j); x.fillRect(i, j, 1, 1); }
      else if (outline && ((m[j][i - 1]) || (m[j][i + 1]) || (m[j - 1] && m[j - 1][i]) || (m[j + 1] && m[j + 1][i]))) {
        x.fillStyle = outline; x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }
  function inCircles(circles) {
    return (x, y) => circles.some(([cx, cy, r]) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r);
  }

  // ---------------- Arbres et décors hauts ----------------
  function makeTree(seed, pal) {
    pal = pal || { o: '#173a1c', d: '#2a6a2c', m: '#3c8c38', l: '#5cb048', h: '#8ad064', t: '#7a4a28', T: '#4a2c18' };
    const R = rng(seed);
    const circles = [[16, 15, 10], [9, 19, 7], [23, 19, 7], [16, 22, 8], [11, 11, 6], [21, 11, 6]];
    for (let i = 0; i < 3; i++) circles.push([8 + R() * 16, 10 + R() * 12, 3 + R() * 3]);
    const ins = inCircles(circles);
    const noise = {};
    const canopy = shape(32, 32, (x, y) => y < 31 && ins(x, y), (x, y) => {
      const k = x + ',' + y;
      if (noise[k] === undefined) noise[k] = R();
      const l = (-(x - 16) * 0.55 - (y - 14) * 0.85) / 12 + (noise[k] - 0.5) * 0.35;
      // grappes de feuilles
      const cl = Math.sin(x * 1.3 + Math.cos(y * 0.9) * 2) + Math.cos(y * 1.1 + x * 0.4);
      let v = l + cl * 0.08;
      if (v > 0.55) return pal.h;
      if (v > 0.2) return pal.l;
      if (v > -0.3) return pal.m;
      return pal.d;
    }, pal.o);
    const c = mk(32, 42), x = c.getContext('2d');
    // tronc
    x.fillStyle = pal.T; x.fillRect(12, 26, 8, 13); x.fillRect(11, 36, 10, 3);
    x.fillStyle = pal.t; x.fillRect(13, 26, 6, 12); x.fillRect(12, 36, 8, 2);
    x.fillStyle = '#9a6a3a'; x.fillRect(14, 28, 1, 8); x.fillRect(16, 30, 1, 4);
    x.fillStyle = pal.T; x.fillRect(17, 29, 1, 6);
    x.drawImage(canopy, 0, 0);
    return c;
  }
  function makePalm() {
    const c = mk(36, 48), x = c.getContext('2d');
    // tronc courbé
    for (let i = 0; i < 30; i++) {
      const t = i / 30, px = 18 + Math.sin(t * 2.2) * 5 * (1 - t) - 2, py = 46 - i * 1.1;
      x.fillStyle = '#4a2c18'; x.fillRect(Math.round(px) - 3, Math.round(py), 7, 2);
      x.fillStyle = i % 4 < 2 ? '#c8945a' : '#a87440'; x.fillRect(Math.round(px) - 2, Math.round(py), 5, 2);
      x.fillStyle = '#e0b478'; x.fillRect(Math.round(px) - 2, Math.round(py), 1, 1);
    }
    // feuilles
    const top = [16, 14];
    const fronds = [[-1, -0.25], [-0.85, 0.35], [-0.35, -0.9], [0.35, -0.9], [0.85, 0.35], [1, -0.25], [0, 0.6]];
    for (const [dx, dy] of fronds) {
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const px = top[0] + dx * i * 1.05, py = top[1] + dy * i * 0.9 + t * t * 9;
        const wdt = Math.max(1, Math.round(3.2 * Math.sin(t * Math.PI) + 0.5));
        x.fillStyle = '#173a1c'; x.fillRect(Math.round(px) - 1, Math.round(py) - wdt, 3, wdt * 2 + 1);
      }
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const px = top[0] + dx * i * 1.05, py = top[1] + dy * i * 0.9 + t * t * 9;
        const wdt = Math.max(0, Math.round(3.2 * Math.sin(t * Math.PI) - 0.5));
        x.fillStyle = i % 3 === 0 ? '#3c8c38' : '#5cb048'; x.fillRect(Math.round(px), Math.round(py) - wdt, 1, wdt * 2 + 1);
        x.fillStyle = '#8ad064'; x.fillRect(Math.round(px), Math.round(py) - wdt, 1, 1);
      }
    }
    // noix de coco
    x.fillStyle = '#4a2c18'; x.fillRect(14, 15, 3, 3); x.fillRect(18, 16, 3, 3);
    x.fillStyle = '#8a5a2a'; x.fillRect(15, 15, 1, 1); x.fillRect(19, 16, 1, 1);
    return c;
  }
  function makeCactus() {
    const cols = { o: '#1a3a18', d: '#2e7a34', m: '#48a048', l: '#78c868' };
    const ins = (x, y) => (x >= 6 && x <= 10 && y >= 2 && y <= 23) || (x >= 1 && x <= 3 && y >= 7 && y <= 14) || (x >= 1 && x <= 7 && y >= 13 && y <= 15) ||
      (x >= 13 && x <= 15 && y >= 4 && y <= 12) || (x >= 9 && x <= 15 && y >= 11 && y <= 13);
    const c = shape(17, 25, (x, y) => ins(x, y) && !((x === 6 || x === 10) && y === 2), (x, y) => {
      if ((x === 7 && y > 3) || (x === 2 && y < 13) || (x === 14 && y < 11)) return cols.l;
      if (x === 10 || x === 3 || x === 15 || y === 15 || y === 13 && x > 9) return cols.d;
      return cols.m;
    }, cols.o);
    const x = c.getContext('2d');
    x.fillStyle = '#f0f0c0';
    [[8, 5], [8, 10], [8, 16], [8, 20], [2, 9], [14, 7], [6, 14], [11, 12]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
    return c;
  }
  function makeRock(seed, tint) {
    const R = rng(seed);
    tint = tint || { o: '#2a2420', d: '#5a5048', m: '#7a7064', l: '#a09484', h: '#c8bca8' };
    const circles = [[8, 9, 6.5], [5, 10, 4.5], [11, 10, 4.5], [8 + R() * 2 - 1, 7, 4.5]];
    const ins = inCircles(circles);
    return shape(16, 15, (x, y) => y < 14 && ins(x, y), (x, y) => {
      const l = (-(x - 8) * 0.6 - (y - 8) * 0.8) / 6 + (R() - 0.5) * 0.3;
      if (l > 0.7) return tint.h;
      if (l > 0.2) return tint.l;
      if (l > -0.4) return tint.m;
      return tint.d;
    }, tint.o);
  }
  function makePine(seed) {
    const c = mk(28, 44), x = c.getContext('2d');
    x.fillStyle = '#3a2416'; x.fillRect(11, 32, 6, 10); x.fillStyle = '#6a4224'; x.fillRect(12, 32, 4, 9);
    const layers = [[14, 4, 4], [14, 10, 7], [14, 17, 10], [14, 24, 13]];
    layers.forEach(([cx, cy, hw], i) => {
      for (let yy = 0; yy < 10; yy++) {
        const w = Math.round(hw * (yy + 2) / 11);
        x.fillStyle = '#10241c'; x.fillRect(cx - w - 1, cy + yy, w * 2 + 3, 1);
      }
      for (let yy = 0; yy < 9; yy++) {
        const w = Math.round(hw * (yy + 2) / 11);
        x.fillStyle = '#1e4a38'; x.fillRect(cx - w, cy + yy, w * 2 + 1, 1);
        x.fillStyle = '#2e6a4a'; x.fillRect(cx - w, cy + yy, w, 1);
        x.fillStyle = '#4a8a5a'; x.fillRect(cx - w, cy + yy, 1, 1);
      }
    });
    return c;
  }

  // ---------------- Tuiles ----------------
  const THEMES = {
    grass: { base: '#58a848', d1: '#40903c', d2: '#2e6e30', l1: '#78c460', l2: '#a0dc80' },
    grassN: { base: '#3a5a6a', d1: '#2c4858', d2: '#1e3444', l1: '#4c7080', l2: '#6a8c98' },
  };
  function fillNoise(x, ox, oy, base, specks, seed) {
    x.fillStyle = base; x.fillRect(ox, oy, TS, TS);
    const R = rng(seed);
    for (const [col, n, sz] of specks) {
      x.fillStyle = col;
      for (let i = 0; i < n; i++) x.fillRect(ox + Math.floor(R() * TS), oy + Math.floor(R() * TS), sz || 1, 1);
    }
  }
  function drawGrass(x, ox, oy, seed, th) {
    th = th || THEMES.grass;
    x.fillStyle = th.base; x.fillRect(ox, oy, TS, TS);
    const R = rng(seed);
    for (let i = 0; i < 5; i++) {
      const px = ox + Math.floor(R() * 14) + 1, py = oy + Math.floor(R() * 13) + 2;
      x.fillStyle = th.d1; x.fillRect(px, py, 1, 1); x.fillRect(px - 1, py - 1, 1, 1); x.fillRect(px + 1, py - 1, 1, 1);
      x.fillStyle = th.l1; x.fillRect(px, py - 1, 1, 1);
    }
    for (let i = 0; i < 6; i++) { x.fillStyle = R() < 0.5 ? th.d1 : th.l1; x.fillRect(ox + Math.floor(R() * TS), oy + Math.floor(R() * TS), 1, 1); }
    if (R() < 0.25) { x.fillStyle = th.l2; x.fillRect(ox + Math.floor(R() * TS), oy + Math.floor(R() * TS), 1, 1); }
  }
  function drawFlowers(x, ox, oy, seed) {
    drawGrass(x, ox, oy, seed);
    const R = rng(seed + 7);
    const cols = ['#f8f8f8', '#f8e060', '#f06080', '#a0b0ff'];
    for (let i = 0; i < 3; i++) {
      const px = ox + 2 + Math.floor(R() * 12), py = oy + 2 + Math.floor(R() * 12);
      x.fillStyle = cols[Math.floor(R() * cols.length)];
      x.fillRect(px - 1, py, 3, 1); x.fillRect(px, py - 1, 1, 3);
      x.fillStyle = '#f0a030'; x.fillRect(px, py, 1, 1);
    }
  }
  function drawTallGrass(x, ox, oy, seed) {
    drawGrass(x, ox, oy, seed);
    const R = rng(seed + 3);
    for (let i = 0; i < 7; i++) {
      const px = ox + Math.floor(R() * 15), py = oy + 4 + Math.floor(R() * 11);
      x.fillStyle = '#2e6e30'; x.fillRect(px, py - 3, 1, 4); x.fillRect(px + 1, py - 2, 1, 3);
      x.fillStyle = '#88cc60'; x.fillRect(px, py - 4, 1, 1);
    }
  }
  const GROUND = {
    p: { base: '#d0a868', specks: [['#b08848', 10], ['#e4c488', 6], ['#8a6838', 3]] },
    s: { base: '#ecd8a0', specks: [['#d8c088', 10], ['#f8ecc8', 7], ['#c0a470', 2]] },
    d: { base: '#e4b46c', specks: [['#cc9858', 8], ['#f2cc8a', 6]] },
    c: { base: '#8a8aa0' },
    w: { base: '#b07840' },
    m: { base: '#b02838' },
  };
  function drawGround(x, ch, ox, oy, seed, tx, ty) {
    if (ch === 'd') {
      fillNoise(x, ox, oy, GROUND.d.base, GROUND.d.specks, seed);
      x.fillStyle = '#d0a060';
      const ph = (ty * 5) % 16;
      for (let i = 0; i < TS; i++) { const yy = Math.round(Math.sin((ox + i) * 0.4 + ph) * 1.5) + 6; x.fillRect(ox + i, oy + yy, 1, 1); x.fillRect(ox + i, oy + yy + 7, 1, 1); }
      return;
    }
    if (ch === 'c') { // dalles de pierre
      x.fillStyle = '#7c7c94'; x.fillRect(ox, oy, TS, TS);
      x.fillStyle = '#9494ac'; x.fillRect(ox + 1, oy + 1, 6, 6); x.fillRect(ox + 9, oy + 1, 6, 6); x.fillRect(ox + 1, oy + 9, 14, 6);
      x.fillStyle = '#a8a8c0'; x.fillRect(ox + 1, oy + 1, 6, 1); x.fillRect(ox + 9, oy + 1, 6, 1); x.fillRect(ox + 1, oy + 9, 14, 1);
      x.fillStyle = '#5c5c74'; x.fillRect(ox, oy + 7, TS, 1); x.fillRect(ox, oy + 15, TS, 1); x.fillRect(ox + 8, oy, 1, 8); x.fillRect(ox + (ty % 2 ? 4 : 12), oy + 8, 1, 8);
      return;
    }
    if (ch === 'w') { // plancher
      x.fillStyle = '#b07840'; x.fillRect(ox, oy, TS, TS);
      for (let i = 0; i < 4; i++) {
        x.fillStyle = i % 2 ? '#a06a36' : '#bc8448'; x.fillRect(ox, oy + i * 4, TS, 3);
        x.fillStyle = '#7a4c24'; x.fillRect(ox, oy + i * 4 + 3, TS, 1);
        x.fillRect(ox + ((tx * 7 + i * 5) % 16), oy + i * 4, 1, 3);
      }
      return;
    }
    if (ch === 'm') { // tapis rouge
      x.fillStyle = '#a82434'; x.fillRect(ox, oy, TS, TS);
      x.fillStyle = '#c03848'; for (let i = 0; i < TS; i += 4) x.fillRect(ox + i + (ty % 2) * 2, oy + 6, 2, 2);
      return;
    }
    const g = GROUND[ch];
    fillNoise(x, ox, oy, g.base, g.specks, seed);
  }
  function grassEdge(x, ox, oy, side, seed, th) {
    th = th || THEMES.grass;
    const R = rng(seed);
    for (let i = 0; i < TS; i++) {
      const d = 1 + Math.floor(R() * 3);
      for (let k = 0; k < d; k++) {
        let px, py;
        if (side === 'n') { px = i; py = k; } else if (side === 's') { px = i; py = 15 - k; }
        else if (side === 'w') { px = k; py = i; } else { px = 15 - k; py = i; }
        x.fillStyle = k === d - 1 ? th.d1 : th.base;
        x.fillRect(ox + px, oy + py, 1, 1);
      }
    }
  }
  function drawForest(x, ox, oy, seed, nb) {
    const R = rng(seed);
    const top = !nb.n, bot = !nb.s;
    x.fillStyle = '#1e4e24'; x.fillRect(ox, oy + (top ? 5 : 0), TS, TS - (top ? 5 : 0));
    const cols = ['#2a6a2c', '#3c8c38', '#4ea040'];
    for (let i = 0; i < 9; i++) {
      const cx = Math.floor(R() * 16), cy = Math.floor(R() * 16) + (top ? 4 : 0), r = 2 + Math.floor(R() * 3);
      if (cy > 15) continue;
      for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
        if (xx * xx + yy * yy > r * r) continue;
        const px = (cx + xx + 16) % 16, py = cy + yy;
        if (py < (top ? 4 : 0) || py > 15) continue;
        const l = -xx - yy;
        x.fillStyle = l > r * 0.8 ? '#6ab850' : l > 0 ? cols[2] : l > -r * 0.6 ? cols[1] : cols[0];
        x.fillRect(ox + px, oy + py, 1, 1);
      }
    }
    if (top) {
      for (let i = 0; i < TS; i++) {
        const h = 4 + Math.round(Math.sin((ox + i) * 0.7) * 1.5 + Math.sin((ox + i) * 0.31) * 1.2);
        x.fillStyle = '#173a1c'; x.fillRect(ox + i, oy + h - 1, 1, 1);
        x.fillStyle = '#5cb048'; x.fillRect(ox + i, oy + h, 1, 1);
        if (h - 1 > 0) { x.clearRect(ox + i, oy, 1, h - 1); }
      }
    }
    if (bot) {
      x.fillStyle = '#10301a'; x.fillRect(ox, oy + 12, TS, 4);
      x.fillStyle = '#4a2c18';
      for (let i = 2; i < TS; i += 6) x.fillRect(ox + i + (seed % 3), oy + 12, 2, 4);
    }
  }
  function drawCliff(x, ox, oy, seed, nb, tint) {
    const t = tint || { a: '#8a7458', b: '#6a5640', c: '#4a3a2a', d: '#a89070' };
    x.fillStyle = t.b; x.fillRect(ox, oy, TS, TS);
    const R = rng(seed);
    for (let i = 0; i < 5; i++) {
      const px = Math.floor(R() * 14), py = Math.floor(R() * 14), w = 3 + Math.floor(R() * 5);
      x.fillStyle = t.a; x.fillRect(ox + px, oy + py, Math.min(w, 16 - px), 2);
      x.fillStyle = t.c; x.fillRect(ox + px, oy + py + 2, Math.min(w, 16 - px), 1);
    }
    x.fillStyle = t.c; x.fillRect(ox + Math.floor(R() * 16), oy, 1, TS);
    if (!nb.n) { x.fillStyle = '#58a848'; x.fillRect(ox, oy, TS, 3); x.fillStyle = '#40903c'; x.fillRect(ox, oy + 3, TS, 1); x.fillStyle = t.d; x.fillRect(ox, oy + 4, TS, 1); }
    if (!nb.s) { x.fillStyle = t.c; x.fillRect(ox, oy + 14, TS, 2); }
  }
  function drawCastleWall(x, ox, oy, seed, nb) {
    const face = !nb.s;
    x.fillStyle = face ? '#6c6a84' : '#4a4860'; x.fillRect(ox, oy, TS, TS);
    if (face) {
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 4 : 0;
        x.fillStyle = '#84829c';
        for (let i = -off; i < TS; i += 8) x.fillRect(ox + Math.max(0, i + 1), oy + r * 4 + 1, Math.min(6, 16 - Math.max(0, i + 1)), 2);
        x.fillStyle = '#3c3a50'; x.fillRect(ox, oy + r * 4 + 3, TS, 1);
      }
      x.fillStyle = '#28263a'; x.fillRect(ox, oy + 15, TS, 1);
    } else {
      x.fillStyle = '#5a5872'; x.fillRect(ox + 1, oy + 1, 14, 14);
      x.fillStyle = '#3a3850'; x.fillRect(ox + 1, oy + 15, 14, 1);
    }
    if (!nb.n) {
      x.fillStyle = '#9a98b0';
      for (let i = 0; i < TS; i += 8) x.fillRect(ox + i, oy, 5, 3);
      x.fillStyle = '#28263a';
      for (let i = 0; i < TS; i += 8) x.fillRect(ox + i + 5, oy, 3, 3);
    }
  }
  function drawInWall(x, ox, oy, seed, nb, ty) {
    const face = !nb.s;
    if (face) {
      x.fillStyle = '#e8d8b0'; x.fillRect(ox, oy, TS, TS);
      x.fillStyle = '#d8c494'; for (let i = 1; i < TS; i += 4) x.fillRect(ox + i, oy + 2, 1, 10);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox, oy, TS, 2); x.fillRect(ox, oy + 12, TS, 4);
      x.fillStyle = '#a8743c'; x.fillRect(ox, oy + 12, TS, 1);
      x.fillStyle = '#5a3a1c'; x.fillRect(ox, oy + 15, TS, 1);
    } else {
      x.fillStyle = '#5a3a1c'; x.fillRect(ox, oy, TS, TS);
      x.fillStyle = '#7a4c24'; x.fillRect(ox + 2, oy + 2, 12, 12);
      x.fillStyle = '#8a5a2c'; x.fillRect(ox + 2, oy + 2, 12, 1);
    }
  }
  function drawBridge(x, ox, oy, vertical) {
    x.fillStyle = '#3878d8'; x.fillRect(ox, oy, TS, TS);
    if (!vertical) {
      x.fillStyle = '#5a3a1c'; x.fillRect(ox, oy + 1, TS, 14);
      for (let i = 0; i < TS; i += 4) { x.fillStyle = '#b07840'; x.fillRect(ox + i, oy + 2, 3, 12); x.fillStyle = '#d09858'; x.fillRect(ox + i, oy + 2, 3, 1); }
      x.fillStyle = '#3a2410'; x.fillRect(ox, oy + 1, TS, 1); x.fillRect(ox, oy + 14, TS, 1);
    } else {
      x.fillStyle = '#5a3a1c'; x.fillRect(ox + 1, oy, 14, TS);
      for (let i = 0; i < TS; i += 4) { x.fillStyle = '#b07840'; x.fillRect(ox + 2, oy + i, 12, 3); x.fillStyle = '#d09858'; x.fillRect(ox + 2, oy + i, 12, 1); }
      x.fillStyle = '#3a2410'; x.fillRect(ox + 1, oy, 1, TS); x.fillRect(ox + 14, oy, 1, TS);
    }
  }
  function drawFence(x, ox, oy) {
    x.fillStyle = '#4a2c14'; x.fillRect(ox, oy + 5, TS, 4); x.fillRect(ox + 2, oy + 2, 4, 12); x.fillRect(ox + 10, oy + 2, 4, 12);
    x.fillStyle = '#b07840'; x.fillRect(ox, oy + 6, TS, 2); x.fillRect(ox + 3, oy + 3, 2, 10); x.fillRect(ox + 11, oy + 3, 2, 10);
    x.fillStyle = '#d8a060'; x.fillRect(ox + 3, oy + 3, 2, 1); x.fillRect(ox + 11, oy + 3, 2, 1);
  }

  // Eau animée (dessinée à chaque image pour les tuiles visibles)
  function drawWater(x, sx, sy, tx, ty, t, nb, night) {
    const base = night ? '#203c78' : '#3878d8', dark = night ? '#183060' : '#2c64c0', light = night ? '#4060a0' : '#68a8f0', foam = night ? '#90a8d0' : '#e0f4ff';
    x.fillStyle = base; x.fillRect(sx, sy, TS, TS);
    x.fillStyle = dark;
    const ph = t * 0.05;
    for (let r = 0; r < 4; r++) {
      const yy = r * 4 + 2;
      const off = Math.floor((Math.sin(ph + (ty * 4 + r) * 0.8) + 1) * 4 + tx * 5 + r * 3) % 16;
      x.fillRect(sx + off, sy + yy, 5, 1);
    }
    x.fillStyle = light;
    for (let r = 0; r < 2; r++) {
      const off = Math.floor((Math.cos(ph * 1.3 + (tx + r) * 1.7) + 1) * 5 + ty * 3 + r * 7) % 14;
      x.fillRect(sx + off, sy + r * 8 + 5, 3, 1);
    }
    x.fillStyle = foam;
    const f = Math.floor(t / 20) % 2;
    if (!nb.n) { for (let i = 0; i < TS; i++) x.fillRect(sx + i, sy, 1, 1 + ((i + f + tx) % 3 === 0 ? 1 : 0)); }
    if (!nb.s) { for (let i = 0; i < TS; i++) x.fillRect(sx + i, sy + 15 - ((i + f) % 3 === 0 ? 1 : 0), 1, 1 + ((i + f) % 3 === 0 ? 1 : 0)); }
    if (!nb.w) { for (let i = 0; i < TS; i++) x.fillRect(sx, sy + i, 1 + ((i + f + ty) % 3 === 0 ? 1 : 0), 1); }
    if (!nb.e) { for (let i = 0; i < TS; i++) x.fillRect(sx + 15 - ((i + f) % 3 === 0 ? 1 : 0), sy + i, 1 + ((i + f) % 3 === 0 ? 1 : 0), 1); }
  }

  // ---------------- Bâtiments ----------------
  function makeHut() {
    const c = mk(64, 60), x = c.getContext('2d');
    // murs
    x.fillStyle = K; x.fillRect(5, 26, 54, 32);
    x.fillStyle = '#ecdcb4'; x.fillRect(6, 27, 52, 30);
    x.fillStyle = '#d0bc90'; x.fillRect(44, 27, 14, 30);
    x.fillStyle = '#f8ecc8'; x.fillRect(6, 27, 6, 30);
    x.fillStyle = '#b8a070'; x.fillRect(6, 54, 52, 3);
    // porte
    x.fillStyle = K; x.fillRect(25, 37, 14, 21);
    x.fillStyle = '#8a5a30'; x.fillRect(26, 38, 12, 20);
    x.fillStyle = '#a8743c'; x.fillRect(27, 39, 4, 18); x.fillRect(33, 39, 4, 18);
    x.fillStyle = '#e8c048'; x.fillRect(35, 47, 1, 2);
    // fenêtres rondes
    for (const wx of [14, 50]) {
      x.fillStyle = K; x.beginPath(); x.arc(wx, 40, 5, 0, 7); x.fill();
      x.fillStyle = '#8a5a30'; x.beginPath(); x.arc(wx, 40, 4, 0, 7); x.fill();
      x.fillStyle = '#284878'; x.beginPath(); x.arc(wx, 40, 3, 0, 7); x.fill();
      x.fillStyle = '#8ab0e0'; x.fillRect(wx - 2, 38, 1, 2);
    }
    // toit chinois
    for (let y = 0; y < 26; y++) {
      const t = y / 25;
      const half = Math.round(8 + t * t * 24 + t * 2);
      const cx = 32;
      x.fillStyle = K; x.fillRect(cx - half - 1, y + 4, half * 2 + 2, 1);
      x.fillStyle = y % 4 === 3 ? '#8a2c20' : '#c84a32';
      x.fillRect(cx - half, y + 4, half * 2, 1);
      x.fillStyle = '#e06a48'; x.fillRect(cx - half, y + 4, Math.round(half * 0.5), 1);
    }
    x.fillStyle = K; x.fillRect(0, 29, 64, 2);
    x.fillStyle = '#6a2018'; x.fillRect(1, 29, 62, 1);
    // bout relevé
    x.fillStyle = K; x.fillRect(0, 26, 2, 4); x.fillRect(62, 26, 2, 4);
    x.fillStyle = '#e8c048'; x.fillRect(30, 0, 4, 5); x.fillStyle = K; x.fillRect(29, 4, 6, 1);
    return c;
  }
  function makeKameHouse() {
    const c = mk(80, 68), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(7, 30, 66, 36);
    x.fillStyle = '#f4a8a0'; x.fillRect(8, 31, 64, 34);
    x.fillStyle = '#d88078'; x.fillRect(56, 31, 16, 34);
    x.fillStyle = '#fcc8c0'; x.fillRect(8, 31, 6, 34);
    x.fillStyle = '#c86860'; x.fillRect(8, 62, 64, 3);
    // porte + fenêtres
    x.fillStyle = K; x.fillRect(34, 43, 14, 23);
    x.fillStyle = '#5a7ab8'; x.fillRect(35, 44, 12, 22);
    x.fillStyle = '#7a9ad8'; x.fillRect(36, 45, 4, 20);
    x.fillStyle = '#f0d050'; x.fillRect(44, 54, 2, 2);
    for (const wx of [14, 56]) {
      x.fillStyle = K; x.fillRect(wx - 1, 42, 14, 12);
      x.fillStyle = '#fff'; x.fillRect(wx, 43, 12, 10);
      x.fillStyle = '#4870b0'; x.fillRect(wx + 1, 44, 10, 8);
      x.fillStyle = '#a0c0f0'; x.fillRect(wx + 2, 45, 3, 2);
      x.fillStyle = '#fff'; x.fillRect(wx + 5, 44, 1, 8); x.fillRect(wx + 1, 47, 10, 1);
    }
    // toit
    for (let y = 0; y < 28; y++) {
      const half = Math.round(18 + y * 0.85 + (y > 22 ? (y - 22) * 2 : 0));
      x.fillStyle = K; x.fillRect(40 - half - 1, y + 4, half * 2 + 2, 1);
      x.fillStyle = y % 5 === 4 ? '#a02020' : '#d83830';
      x.fillRect(40 - half, y + 4, half * 2, 1);
      x.fillStyle = '#f06050'; x.fillRect(40 - half, y + 4, 4, 1);
    }
    x.fillStyle = K; x.fillRect(21, 0, 38, 5); x.fillStyle = '#d83830'; x.fillRect(22, 1, 36, 3);
    // enseigne
    x.fillStyle = K; x.fillRect(8, 15, 64, 11);
    x.fillStyle = '#f8f0d8'; x.fillRect(9, 16, 62, 9);
    FONT.drawCentered(x, 'KAME HOUSE', 40, 15, '#c02020', null);
    return c;
  }
  function makeDome(band, door = true, sign) {
    const c = mk(56, 52), x = c.getContext('2d');
    const cx = 28;
    // dôme
    const dome = shape(56, 48, (i, j) => {
      const dx = (i - cx) / 26, dy = (j - 34) / 30;
      return j <= 46 && dx * dx + dy * dy <= 1 && j >= 4;
    }, (i, j) => {
      const l = (-(i - cx) * 0.7 - (j - 20) * 0.7) / 22;
      if (j >= 30 && j <= 33) return band;
      if (l > 0.55) return '#ffffff';
      if (l > 0.1) return '#f0ece0';
      if (l > -0.45) return '#d8d0c0';
      return '#b0a898';
    }, K);
    x.drawImage(dome, 0, 2);
    x.fillStyle = K; x.fillRect(2, 48, 52, 2);
    // hublots
    for (const wx of [13, 43]) {
      x.fillStyle = K; x.beginPath(); x.arc(wx, 26, 4.5, 0, 7); x.fill();
      x.fillStyle = '#2c4878'; x.beginPath(); x.arc(wx, 26, 3.5, 0, 7); x.fill();
      x.fillStyle = '#90b8f0'; x.fillRect(wx - 2, 24, 2, 1);
    }
    if (door) {
      x.fillStyle = K; x.fillRect(21, 32, 14, 18);
      x.beginPath(); x.arc(28, 33, 7, Math.PI, 0); x.fill();
      x.fillStyle = '#6a7a98'; x.fillRect(22, 33, 12, 17);
      x.beginPath(); x.arc(28, 33, 6, Math.PI, 0); x.fill();
      x.fillStyle = '#8a9ab8'; x.fillRect(23, 32, 3, 18);
    }
    if (sign) {
      const sw = FONT.measure(sign) + 6, sx = Math.round(28 - sw / 2);
      x.fillStyle = K; x.fillRect(sx - 1, 6, sw + 2, 11);
      x.fillStyle = '#f8e8a0'; x.fillRect(sx, 7, sw, 9);
      FONT.drawCentered(x, sign, 28, 6, '#803010', null);
    }
    return c;
  }
  function makeCave() {
    const c = mk(56, 40), x = c.getContext('2d');
    const t = { o: '#2a2018', d: '#6a5038', m: '#8a6a48', l: '#a88860', h: '#c8a878' };
    const R = rng(77);
    const rock = shape(56, 40, (i, j) => {
      const dx = (i - 28) / 27, dy = (j - 38) / 34;
      return dx * dx + dy * dy <= 1 && j < 39;
    }, (i, j) => {
      const l = (-(i - 28) * 0.5 - (j - 20) * 0.9) / 18 + (R() - 0.5) * 0.4;
      return l > 0.7 ? t.h : l > 0.2 ? t.l : l > -0.4 ? t.m : t.d;
    }, t.o);
    x.drawImage(rock, 0, 0);
    x.fillStyle = K; x.beginPath(); x.ellipse(28, 36, 11, 13, 0, Math.PI, 0); x.fill(); x.fillRect(17, 36, 22, 4);
    x.fillStyle = '#0a0610'; x.beginPath(); x.ellipse(28, 37, 9, 11, 0, Math.PI, 0); x.fill(); x.fillRect(19, 37, 18, 3);
    return c;
  }
  function makeCastle() {
    const W = 160, H = 128;
    const c = mk(W, H), x = c.getContext('2d');
    const st = { o: K, a: '#8a86a4', b: '#6e6a8a', c: '#525070', d: '#a8a4c0' };
    function wall(x0, y0, w, h) {
      x.fillStyle = st.o; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
      x.fillStyle = st.b; x.fillRect(x0, y0, w, h);
      for (let r = 0; r < h; r += 6) {
        const off = (r / 6) % 2 ? 5 : 0;
        x.fillStyle = st.a;
        for (let i = -off; i < w; i += 10) x.fillRect(x0 + Math.max(0, i + 1), y0 + r + 1, Math.max(0, Math.min(8, w - Math.max(0, i + 1))), 3);
        x.fillStyle = st.c; x.fillRect(x0, y0 + r + 5, w, 1);
      }
      x.fillStyle = st.d; x.fillRect(x0, y0, 2, h);
    }
    function onion(cx, cy, r, col, colD) {
      const s = shape(r * 2 + 3, r * 3 + 3, (i, j) => {
        const dx = (i - r - 1) / r, y2 = j / (r * 3);
        const width = y2 < 0.35 ? Math.sin(y2 / 0.35 * Math.PI / 2) * 0.25 : Math.sin(Math.min(1, (y2 - 0.1) / 0.75) * Math.PI) * 1;
        return Math.abs(dx) <= Math.max(0.12, width) && j < r * 3;
      }, (i, j) => (i < r * 0.8 ? col : i < r * 1.4 ? colD : '#1a6a5a'), K);
      x.drawImage(s, cx - r - 1, cy - r * 3);
      x.fillStyle = '#f0d050'; x.fillRect(cx - 1, cy - r * 3 - 5, 2, 6);
      x.fillStyle = K; x.fillRect(cx - 1, cy - r * 3 - 6, 2, 1);
    }
    // corps central
    wall(30, 48, 100, 78);
    // tours
    wall(4, 40, 30, 86); wall(126, 40, 30, 86);
    wall(62, 22, 36, 30);
    // créneaux
    for (const [x0, y0, w] of [[4, 34, 30], [126, 34, 30], [30, 42, 100], [62, 16, 36]]) {
      for (let i = 0; i < w; i += 8) { x.fillStyle = K; x.fillRect(x0 + i - 1, y0 - 1, 7, 8); x.fillStyle = st.a; x.fillRect(x0 + i, y0, 5, 7); x.fillStyle = st.d; x.fillRect(x0 + i, y0, 5, 1); }
    }
    onion(19, 34, 11, '#3cc0a0', '#28907a');
    onion(141, 34, 11, '#3cc0a0', '#28907a');
    onion(80, 16, 13, '#f0c040', '#c09020');
    // fenêtres
    for (const [wx, wy] of [[14, 60], [136, 60], [14, 86], [136, 86], [70, 30], [86, 30], [44, 64], [110, 64]]) {
      x.fillStyle = K; x.fillRect(wx - 1, wy - 5, 9, 15); x.beginPath(); x.arc(wx + 3.5, wy - 4, 4.5, Math.PI, 0); x.fill();
      x.fillStyle = '#f8d860'; x.fillRect(wx, wy - 4, 7, 13); x.beginPath(); x.arc(wx + 3.5, wy - 4, 3.5, Math.PI, 0); x.fill();
      x.fillStyle = '#e09020'; x.fillRect(wx + 3, wy - 6, 1, 15);
    }
    // grande porte
    x.fillStyle = K; x.fillRect(63, 88, 34, 40); x.beginPath(); x.arc(80, 90, 17, Math.PI, 0); x.fill();
    x.fillStyle = '#5a3418'; x.fillRect(65, 90, 30, 38); x.beginPath(); x.arc(80, 90, 15, Math.PI, 0); x.fill();
    x.fillStyle = '#7a4a24'; for (let i = 67; i < 94; i += 6) x.fillRect(i, 80, 3, 48);
    x.fillStyle = '#3a2010'; x.fillRect(79, 76, 2, 52);
    x.fillStyle = '#e8c048'; x.fillRect(75, 104, 3, 3); x.fillRect(82, 104, 3, 3);
    // blason de Pilaf
    x.fillStyle = K; x.fillRect(73, 54, 14, 16); x.fillStyle = '#c83838'; x.fillRect(74, 55, 12, 14);
    x.fillStyle = '#f0d050'; x.fillRect(78, 58, 4, 8); x.fillRect(76, 60, 8, 3);
    // drapeaux
    for (const fx of [19, 141]) { x.fillStyle = '#c83838'; x.fillRect(fx + 1, -1 + 2, 8, 5); }
    return c;
  }
  function makeStall() {
    const c = mk(40, 36), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(3, 8, 2, 26); x.fillRect(35, 8, 2, 26);
    x.fillStyle = '#8a5a2c'; x.fillRect(4, 9, 1, 24); x.fillRect(35, 9, 1, 24);
    for (let i = 0; i < 8; i++) { x.fillStyle = K; x.fillRect(i * 5, 2, 5, 9); x.fillStyle = i % 2 ? '#f8f0e0' : '#d83838'; x.fillRect(i * 5 + (i ? 0 : 1), 3, 5 - (i === 7 ? 1 : 0), 7); }
    x.fillStyle = K; x.fillRect(0, 10, 40, 1);
    x.fillStyle = K; x.fillRect(1, 22, 38, 13);
    x.fillStyle = '#b07840'; x.fillRect(2, 23, 36, 11);
    x.fillStyle = '#d09858'; x.fillRect(2, 23, 36, 2);
    x.fillStyle = '#e04030'; x.fillRect(6, 19, 4, 4); x.fillStyle = '#f0c040'; x.fillRect(12, 19, 4, 4); x.fillStyle = '#60b040'; x.fillRect(26, 19, 4, 4); x.fillStyle = '#f0f0f0'; x.fillRect(31, 18, 3, 5);
    return c;
  }

  // ---------------- Accessoires ----------------
  function makeProp(kind) {
    let c, x;
    switch (kind) {
      case 'bed':
        c = mk(16, 28); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(0, 0, 16, 28);
        x.fillStyle = '#8a5a2c'; x.fillRect(1, 1, 14, 26);
        x.fillStyle = '#f8f8f0'; x.fillRect(2, 2, 12, 6);
        x.fillStyle = '#4878c8'; x.fillRect(2, 9, 12, 17); x.fillStyle = '#6898e0'; x.fillRect(2, 9, 12, 2);
        return c;
      case 'table':
        c = mk(24, 18); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(0, 2, 24, 10); x.fillRect(2, 10, 3, 8); x.fillRect(19, 10, 3, 8);
        x.fillStyle = '#a06a36'; x.fillRect(1, 3, 22, 8); x.fillStyle = '#c48a4c'; x.fillRect(1, 3, 22, 2);
        x.fillStyle = '#7a4c24'; x.fillRect(3, 11, 1, 6); x.fillRect(20, 11, 1, 6);
        x.fillStyle = '#f0f0f0'; x.fillRect(5, 1, 6, 3); x.fillStyle = '#e8a040'; x.fillRect(6, 1, 4, 2);
        return c;
      case 'cushion':
        c = mk(16, 10); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(1, 2, 14, 8); x.fillStyle = '#c83848'; x.fillRect(2, 3, 12, 6); x.fillStyle = '#e8c048'; x.fillRect(1, 2, 2, 2); x.fillRect(13, 2, 2, 2);
        return c;
      case 'shrine':
        c = mk(16, 22); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(1, 4, 14, 18); x.fillStyle = '#7a3a1a'; x.fillRect(2, 5, 12, 16);
        x.fillStyle = '#f0e0b0'; x.fillRect(4, 7, 8, 9); x.fillStyle = '#c0b090'; x.fillRect(6, 9, 4, 4);
        x.fillStyle = K; x.fillRect(0, 2, 16, 3); x.fillStyle = '#c84a32'; x.fillRect(1, 2, 14, 2);
        return c;
      case 'pot':
        c = shape(12, 13, (i, j) => { const dx = (i - 6) / 5.5, dy = (j - 7.5) / 5.5; return dx * dx + dy * dy <= 1 || (j < 4 && i > 3 && i < 9); }, (i, j) => j < 3 ? '#a05a30' : (i < 5 ? '#d88850' : '#b06a38'), K);
        return c;
      case 'barrel':
        c = mk(14, 16); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(1, 0, 12, 16); x.fillRect(0, 2, 14, 12);
        x.fillStyle = '#9a6234'; x.fillRect(1, 1, 12, 14); x.fillStyle = '#c08048'; x.fillRect(2, 1, 4, 14);
        x.fillStyle = '#5a5a6a'; x.fillRect(1, 4, 12, 1); x.fillRect(1, 11, 12, 1);
        return c;
      case 'sign':
        c = mk(14, 16); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(6, 8, 2, 8); x.fillRect(0, 1, 14, 9);
        x.fillStyle = '#c89050'; x.fillRect(1, 2, 12, 7); x.fillStyle = '#7a4c24'; x.fillRect(3, 4, 8, 1); x.fillRect(3, 6, 6, 1);
        return c;
      case 'well':
        c = mk(24, 26); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(2, 2, 2, 14); x.fillRect(20, 2, 2, 14); x.fillRect(0, 0, 24, 4);
        x.fillStyle = '#c84a32'; x.fillRect(1, 1, 22, 2);
        x.fillStyle = K; x.fillRect(0, 13, 24, 13); x.fillStyle = '#9a96a8'; x.fillRect(1, 14, 22, 11);
        x.fillStyle = '#bab6c8'; for (let i = 1; i < 23; i += 5) x.fillRect(i, 15, 4, 3); x.fillStyle = '#1a2a48'; x.fillRect(3, 13, 18, 3);
        return c;
      case 'throne':
        c = mk(24, 32); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(2, 0, 20, 32);
        x.fillStyle = '#c83838'; x.fillRect(3, 1, 18, 30); x.fillStyle = '#e8c048'; x.fillRect(3, 1, 18, 3); x.fillRect(3, 18, 18, 3); x.fillRect(3, 1, 2, 30); x.fillRect(19, 1, 2, 30);
        x.fillStyle = '#a02020'; x.fillRect(6, 6, 12, 11);
        return c;
      case 'pillar':
        c = mk(16, 40); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(1, 0, 14, 40);
        x.fillStyle = '#a8a4c0'; x.fillRect(2, 1, 12, 38); x.fillStyle = '#c8c4dc'; x.fillRect(3, 4, 3, 32); x.fillStyle = '#7e7a98'; x.fillRect(11, 4, 3, 32);
        x.fillStyle = '#e8c048'; x.fillRect(2, 1, 12, 3); x.fillRect(2, 35, 12, 4);
        return c;
      case 'torch':
        c = mk(8, 20); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(2, 6, 4, 14); x.fillStyle = '#8a5a2c'; x.fillRect(3, 7, 2, 12);
        return c;
      case 'tv':
        c = mk(18, 18); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(0, 0, 18, 15); x.fillRect(3, 15, 2, 3); x.fillRect(13, 15, 2, 3);
        x.fillStyle = '#8a5a2c'; x.fillRect(1, 1, 16, 13); x.fillStyle = '#3a5a7a'; x.fillRect(2, 2, 11, 10); x.fillStyle = '#7aa0c8'; x.fillRect(3, 3, 3, 2);
        x.fillStyle = '#e8c048'; x.fillRect(14, 3, 2, 2); x.fillRect(14, 7, 2, 2);
        return c;
      case 'tent':
        c = mk(40, 32); x = c.getContext('2d');
        for (let y = 0; y < 30; y++) { const h = Math.round(4 + y * 0.6); x.fillStyle = K; x.fillRect(20 - h - 1, y + 2, h * 2 + 2, 1); x.fillStyle = y % 6 < 3 ? '#e8d8a8' : '#c8b080'; x.fillRect(20 - h, y + 2, h * 2, 1); }
        x.fillStyle = '#2a1a10'; for (let y = 12; y < 32; y++) { const h = Math.round((y - 12) * 0.35); x.fillRect(20 - h, y, h * 2 + 1, 1); }
        return c;
      case 'campfire':
        c = mk(16, 10); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(1, 6, 14, 4); x.fillStyle = '#7a4a24'; x.fillRect(2, 7, 12, 2);
        x.fillStyle = '#5a5a6a'; x.fillRect(0, 8, 3, 2); x.fillRect(13, 8, 3, 2);
        return c;
      case 'chest':
      case 'chestOpen': {
        c = mk(16, 14); x = c.getContext('2d');
        x.fillStyle = K; x.fillRect(0, 2, 16, 12);
        x.fillStyle = '#9a5a2a'; x.fillRect(1, 7, 14, 6); x.fillStyle = '#e8c048'; x.fillRect(1, 7, 14, 1); x.fillRect(7, 7, 2, 6);
        if (kind === 'chest') {
          x.fillStyle = '#b8743a'; x.fillRect(1, 3, 14, 4); x.fillStyle = '#d89050'; x.fillRect(1, 3, 14, 1);
          x.fillStyle = '#e8c048'; x.fillRect(7, 3, 2, 4); x.fillStyle = K; x.fillRect(7, 6, 2, 2);
        } else {
          x.clearRect(0, 0, 16, 2); x.fillStyle = K; x.fillRect(0, 0, 16, 4); x.fillStyle = '#3a2010'; x.fillRect(1, 3, 14, 4);
          x.fillStyle = '#b8743a'; x.fillRect(1, 1, 14, 2);
        }
        return c;
      }
    }
    return mk(1, 1);
  }

  // ---------------- Boules de cristal & effets ----------------
  const ballCache = {};
  function dragonBall(stars, size = 12, dim = false) {
    const key = stars + '_' + size + '_' + dim;
    if (ballCache[key]) return ballCache[key];
    const r = size / 2;
    const c = shape(size + 2, size + 2, (i, j) => { const dx = i - r - 0.5, dy = j - r - 0.5; return dx * dx + dy * dy <= r * r; }, (i, j) => {
      const l = (-(i - r) * 0.7 - (j - r) * 0.7) / r;
      if (dim) return l > 0.3 ? '#8a7a6a' : l > -0.3 ? '#6a5a4a' : '#4a3a2a';
      if (l > 0.75) return '#fff8d0';
      if (l > 0.3) return '#ffc040';
      if (l > -0.35) return '#f09020';
      return '#c05810';
    }, dim ? '#2a2018' : '#6a2808');
    const x = c.getContext('2d');
    x.fillStyle = dim ? '#5a2a2a' : '#e01818';
    const pos = {
      1: [[0, 0]], 2: [[-1.5, 0], [1.5, 0]], 3: [[0, -1.5], [-1.5, 1], [1.5, 1]], 4: [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]],
      5: [[0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]], 6: [[-2, -2], [2, -2], [-2.5, 0.5], [2.5, 0.5], [-1, 2.5], [1, 2.5]], 7: [[0, 0], [0, -2.5], [-2.2, -1.2], [2.2, -1.2], [-2.2, 1.5], [2.2, 1.5], [0, 2.8]],
    }[stars];
    const big = size >= 14, sc = size / 12 * (big ? 1.45 : 1.1);
    for (const [dx, dy] of pos) {
      const px = Math.round(r + 1 + dx * sc - 0.5), py = Math.round(r + 1 + dy * sc - 0.5);
      x.fillRect(px, py, 1, 1);
      if (big && stars <= 4) { x.fillRect(px - 1, py, 3, 1); x.fillRect(px, py - 1, 1, 1); x.fillRect(px - 1, py + 1, 1, 1); x.fillRect(px + 1, py + 1, 1, 1); }
    }
    return (ballCache[key] = c);
  }

  const tiles = {};
  function init() {
    tiles.trees = [0, 1, 2, 3].map(i => makeTree(101 + i * 17));
    tiles.treesN = [0, 1].map(i => makeTree(301 + i * 13, { o: '#0a1a20', d: '#142c3a', m: '#1e4050', l: '#2c5a68', h: '#3e7480', t: '#3a2a28', T: '#1a1018' }));
    tiles.palms = [0, 1].map(i => makePalm(55 + i * 9));
    tiles.cactus = makeCactus();
    tiles.rocks = [0, 1, 2].map(i => makeRock(21 + i * 5));
    tiles.rocksD = [0, 1].map(i => makeRock(41 + i * 5, { o: '#3a2418', d: '#8a5a38', m: '#a87448', l: '#c89060', h: '#e8b480' }));
    tiles.pines = [0, 1].map(i => makePine(i));
    tiles.buildings = {
      hut: makeHut(), kame: makeKameHouse(),
      dome1: makeDome('#4a7ac8'), dome2: makeDome('#d84848'), dome3: makeDome('#48a868'),
      shop: makeDome('#e8a020', true, 'BOUTIQUE'), inn: makeDome('#8a58c8', true, 'AUBERGE'),
      oolong: makeDome('#f080b0', true, 'OOLONG'),
      cave: makeCave(), castle: makeCastle(), stall: makeStall(),
    };
    tiles.props = {};
    for (const k of ['bed', 'table', 'cushion', 'shrine', 'pot', 'barrel', 'sign', 'well', 'throne', 'pillar', 'torch', 'tv', 'tent', 'campfire', 'chest', 'chestOpen']) tiles.props[k] = makeProp(k);
  }

  return {
    TS, mk, rng, hash, init, tiles, char, monster, dragonBall, flash, mirror,
    drawGrass, drawFlowers, drawTallGrass, drawGround, grassEdge, drawForest, drawCliff, drawCastleWall, drawInWall, drawBridge, drawFence, drawWater, THEMES,
  };
})();
