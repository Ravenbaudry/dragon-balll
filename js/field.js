// Exploration : chargement des cartes, rendu, déplacements, PNJ, ennemis visibles.
const Field = (() => {
  const TS = 16;
  const SOLID = new Set(['T', 'F', 'P', 'k', 'r', 'R', '~', 'C', 'X', 'W', '#', 'f', 'I', 'D', 'n']);
  const NATURAL = { T: '.', P: 's', k: 'd', R: 'd', I: 'c', n: '.' };
  const GRASSY = new Set(['.', ',', '"', 'T', 'n', 'F', 'f']);
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  const F = {
    map: null, mapId: null, W: 0, H: 0, rows: [], solid: [], base: null, objects: [], entities: [], actors: [], history: [],
    camX: 0, camY: 0, camLock: false, locks: 0, calm: 0, battle: false, waterTiles: [], touching: new Set(), effects: [], hideParty: false,
  };

  function tileAt(x, y) { if (x < 0 || y < 0 || x >= F.W || y >= F.H) return null; return F.rows[y][x]; }
  function groundOf(ch) { if (ch === '#' || ch === 'r') return F.map.ground || '.'; return NATURAL[ch] || ch; }
  function isGrassy(ch) {
    if (ch === null) return false;
    if (GRASSY.has(ch)) return true;
    if ((ch === '#' || ch === 'r') && (F.map.ground || '.') === '.') return true;
    return false;
  }

  function drawGroundTile(x, ch, tx, ty, seed) {
    const ox = tx * TS, oy = ty * TS;
    if (ch === '.') GFX.drawGrass(x, ox, oy, seed);
    else if (ch === ',') GFX.drawFlowers(x, ox, oy, seed);
    else if (ch === '"') GFX.drawTallGrass(x, ox, oy, seed);
    else if ('psdcwm'.includes(ch)) {
      GFX.drawGround(x, ch, ox, oy, seed, tx, ty);
      if ('psd'.includes(ch)) {
        if (isGrassy(tileAt(tx, ty - 1))) GFX.grassEdge(x, ox, oy, 'n', seed + 1);
        if (isGrassy(tileAt(tx, ty + 1))) GFX.grassEdge(x, ox, oy, 's', seed + 2);
        if (isGrassy(tileAt(tx - 1, ty))) GFX.grassEdge(x, ox, oy, 'w', seed + 3);
        if (isGrassy(tileAt(tx + 1, ty))) GFX.grassEdge(x, ox, oy, 'e', seed + 4);
      }
    } else { x.fillStyle = '#000'; x.fillRect(ox, oy, TS, TS); }
  }
  function renderBase() {
    const c = GFX.mk(F.W * TS, F.H * TS), x = c.getContext('2d');
    F.waterTiles = [];
    const same = (tx, ty, set) => { const t = tileAt(tx, ty); return t === null || set.includes(t); };
    for (let ty = 0; ty < F.H; ty++) for (let tx = 0; tx < F.W; tx++) {
      const ch = F.rows[ty][tx], ox = tx * TS, oy = ty * TS;
      const seed = GFX.hash(tx, ty, 7);
      const nb = set => ({ n: same(tx, ty - 1, set), s: same(tx, ty + 1, set), w: same(tx - 1, ty, set), e: same(tx + 1, ty, set) });
      switch (ch) {
        case 'F': drawGroundTile(x, F.map.ground === 's' ? 's' : '.', tx, ty, seed); GFX.drawForest(x, ox, oy, seed, nb('F')); break;
        case 'C': GFX.drawCliff(x, ox, oy, seed, nb('C'), F.map.cliffTint); break;
        case 'X': GFX.drawCastleWall(x, ox, oy, seed, nb('X')); break;
        case 'W': GFX.drawInWall(x, ox, oy, seed, nb('WD'), ty); break;
        case '~': x.fillStyle = '#3878d8'; x.fillRect(ox, oy, TS, TS); F.waterTiles.push([tx, ty]); break;
        case 'b': GFX.drawBridge(x, ox, oy, false); break;
        case 'B': GFX.drawBridge(x, ox, oy, true); break;
        case 'f': drawGroundTile(x, groundOf('#'), tx, ty, seed); GFX.drawFence(x, ox, oy); break;
        case 'D': x.fillStyle = '#000'; x.fillRect(ox, oy, TS, TS); break;
        default: drawGroundTile(x, groundOf(ch), tx, ty, seed);
      }
    }
    // ombres des grands éléments
    x.fillStyle = 'rgba(0,0,0,0.22)';
    for (let ty = 0; ty < F.H; ty++) for (let tx = 0; tx < F.W; tx++) {
      const ch = F.rows[ty][tx];
      if ('TPnk'.includes(ch)) { x.beginPath(); x.ellipse(tx * TS + 8, ty * TS + 13, ch === 'k' ? 6 : 10, 4, 0, 0, 7); x.fill(); }
    }
    for (const o of F.map.objects || []) {
      if (o.type === 'building') {
        const img = GFX.tiles.buildings[o.img];
        x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(o.x + 4, o.y + img.height - 4, img.width - 4, 5);
      }
    }
    F.base = c;
  }
  function buildObjects() {
    const objs = [];
    const T = GFX.tiles;
    for (let ty = 0; ty < F.H; ty++) for (let tx = 0; tx < F.W; tx++) {
      const ch = F.rows[ty][tx], ox = tx * TS, oy = ty * TS, h = GFX.hash(tx, ty, 3);
      let img = null, dx = 0, dy = 0, sy = oy + 12;
      if (ch === 'T') { img = (F.map.night ? T.treesN : T.trees)[h % (F.map.night ? 2 : 4)]; dx = -8; dy = -24; }
      else if (ch === 'P') { img = T.palms[h % 2]; dx = -10; dy = -32; }
      else if (ch === 'k') { img = T.cactus; dx = -1; dy = -9; }
      else if (ch === 'r') { img = T.rocks[h % 3]; dx = 0; dy = 1; sy = oy + 10; }
      else if (ch === 'R') { img = T.rocksD[h % 2]; dx = 0; dy = 1; sy = oy + 10; }
      else if (ch === 'n') { img = T.pines[h % 2]; dx = -6; dy = -27; }
      else if (ch === 'I') { img = T.props.pillar; dx = 0; dy = -24; sy = oy + 14; }
      if (img) objs.push({ img, x: ox + dx, y: oy + dy, sortY: sy });
    }
    for (const o of F.map.objects || []) {
      const img = o.type === 'building' ? T.buildings[o.img] : T.props[o.img];
      objs.push({ img, x: o.x, y: o.y, sortY: o.sortY !== undefined ? o.sortY : o.y + img.height - 4, flat: o.flat });
    }
    F.objects = objs;
  }

  // ---------------- Entités ----------------
  function makeEntity(def) {
    const e = Object.assign({ dir: 'down', frame: 0, anim: 0, moving: false, visible: true, solid: true, z: 0, t: Math.random() * 100 }, def);
    if (def.tx !== undefined) { e.x = def.tx * TS + 8; e.y = def.ty * TS + 14; }
    if (e.kind === 'warp' || e.kind === 'trigger') { e.solid = false; e.visible = false; }
    if (e.kind === 'save') { e.solid = false; }
    if (e.kind === 'enemy') { e.homeX = e.x; e.homeY = e.y; e.solid = false; e.cool = 0; }
    if (e.kind === 'chest' && Game.flags['chest_' + e.id]) e.opened = true;
    return e;
  }
  function entBox(e) {
    if (e.kind === 'warp' || e.kind === 'trigger') return [e.tx * TS, e.ty * TS, (e.tw || 1) * TS, (e.th || 1) * TS];
    if (e.kind === 'chest') return [e.x - 8, e.y - 12, 16, 12];
    if (e.box) return [e.x + e.box[0], e.y + e.box[1], e.box[2], e.box[3]];
    return [e.x - 6, e.y - 8, 12, 9];
  }
  function touchBox(e) {
    if (e.kind === 'save') return [e.x - 8, e.y - 10, 16, 12];
    if (e.kind === 'warp' || e.kind === 'trigger') return entBox(e);
    return null;
  }
  function inBox(px, py, b) { return px >= b[0] && px < b[0] + b[2] && py >= b[1] && py < b[1] + b[3]; }
  function boxHit(a, b) { return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]; }

  function tileSolid(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    const t = tileAt(tx, ty);
    if (t === null) return true;
    return F.solid[ty][tx];
  }
  function blocked(x, y, self) {
    const bx = [x - 5, y - 5, 10, 5];
    if (tileSolid(bx[0], bx[1]) || tileSolid(bx[0] + bx[2] - 1, bx[1]) || tileSolid(bx[0], bx[1] + bx[3] - 1) || tileSolid(bx[0] + bx[2] - 1, bx[1] + bx[3] - 1)) return true;
    for (const e of F.entities) {
      if (!e.solid || e === self || !e.visible || e.gone) continue;
      if (boxHit(bx, entBox(e))) return true;
    }
    if (self && self.kind) { // les PNJ évitent le héros
      const L = F.actors[0];
      if (L && boxHit(bx, [L.x - 5, L.y - 5, 10, 5])) return true;
    }
    return false;
  }

  function syncParty() {
    const L = F.actors[0];
    const x = L ? L.x : 0, y = L ? L.y : 0, dir = L ? L.dir : 'down';
    F.actors = Game.party.map((m, i) => {
      const old = F.actors.find(a => a.id === m.id);
      return old || { id: m.id, sprite: MEMBERS[m.id].sprite, x, y, dir, frame: 0, anim: 0, moving: false, z: 0 };
    });
  }

  function load(id, tx, ty, dir = 'down', px, py) {
    const m = MAPS[id];
    F.map = m; F.mapId = id;
    F.rows = m.rows.map(r => r.split(''));
    F.H = F.rows.length; F.W = Math.max(...m.rows.map(r => r.length));
    for (const r of F.rows) while (r.length < F.W) r.push('D');
    F.solid = F.rows.map(r => r.map(ch => SOLID.has(ch)));
    renderBase(); buildObjects();
    F.entities = (m.entities ? m.entities() : []).filter(d => !d.cond || d.cond()).map(makeEntity);
    F.actors = [];
    syncParty();
    const x = px !== undefined ? px : tx * TS + 8, y = py !== undefined ? py : ty * TS + 14;
    for (const a of F.actors) { a.x = x; a.y = y; a.dir = dir; a.moving = false; }
    F.history = [];
    F.touching = new Set(F.entities.filter(e => touchBox(e) && inBox(x, y - 2, touchBox(e))));
    F.camLock = false; F.hideParty = false; F.effects = []; F.calm = 90;
    snapCamera();
    if (m.music) SND.playMusic(m.music);
  }
  function snapCamera() {
    const L = F.actors[0];
    const mw = F.W * TS, mh = F.H * TS;
    F.camX = mw <= SW ? (mw - SW) / 2 : clamp(L.x - SW / 2, 0, mw - SW);
    F.camY = mh <= SH ? (mh - SH) / 2 : clamp(L.y - 8 - SH / 2, 0, mh - SH);
  }

  // ---------------- Scripts ----------------
  async function run(fn) {
    F.locks++;
    for (const a of F.actors) a.moving = false;
    try { await fn(); } catch (e) { console.error(e); } finally { F.locks--; F.calm = 90; Input.clear(); }
  }
  function locked() { return F.locks > 0 || F.battle; }
  function ent(id) { return F.entities.find(e => e.id === id); }
  function face(e, dir) { e.dir = dir; }
  function faceTo(e, other) {
    const dx = other.x - e.x, dy = other.y - e.y;
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  async function walkTo(e, x, y, speed = 1.2) {
    e.moving = true;
    while (true) {
      const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy);
      if (d <= speed) { e.x = x; e.y = y; break; }
      e.x += dx / d * speed; e.y += dy / d * speed;
      e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      await wait(1);
    }
    e.moving = false;
  }
  function walkTile(e, tx, ty, speed) { return walkTo(e, tx * TS + 8, ty * TS + 14, speed); }
  async function jump(e, h = 8, frames = 16) {
    for (let i = 0; i <= frames; i++) { e.z = Math.sin(i / frames * Math.PI) * h; await wait(1); }
    e.z = 0;
  }
  async function partyGather() {
    // les suiveurs rejoignent le meneur
    const L = F.actors[0];
    await Promise.all(F.actors.slice(1).map(a => walkTo(a, L.x, L.y, 1.6)));
    F.history = [];
  }
  function emote(e, ch = '!', frames = 50) { F.effects.push({ type: 'emote', e, ch, t: frames }); }

  // ---------------- Mise à jour ----------------
  function updateLeader() {
    const L = F.actors[0];
    let dx = 0, dy = 0;
    if (Input.down('left')) dx--; if (Input.down('right')) dx++;
    if (Input.down('up')) dy--; if (Input.down('down')) dy++;
    const sp = Input.down('run') ? 2 : 1.35;
    L.moving = false;
    if (dx || dy) {
      if (dx && dy) { dx *= 0.75; dy *= 0.75; }
      if (dy < 0) L.dir = 'up'; else if (dy > 0) L.dir = 'down';
      if (dx < 0 && !dy) L.dir = 'left'; else if (dx > 0 && !dy) L.dir = 'right';
      if (dx && dy && Math.abs(dx) >= Math.abs(dy)) L.dir = dx < 0 ? 'left' : 'right';
      const ox = L.x, oy = L.y;
      let nx = L.x + dx * sp, ny = L.y + dy * sp;
      if (!blocked(nx, L.y, null)) L.x = nx;
      else if (!dy) { // glisse dans les coins
        for (const s of [-4, -3, -2, -1, 1, 2, 3, 4]) if (!blocked(nx, L.y + s, null) && !blocked(L.x, L.y + s, null)) { L.y += Math.sign(s) * 0.75; break; }
      }
      if (!blocked(L.x, ny, null)) L.y = ny;
      else if (!dx) {
        for (const s of [-4, -3, -2, -1, 1, 2, 3, 4]) if (!blocked(L.x + s, ny, null) && !blocked(L.x + s, L.y, null)) { L.x += Math.sign(s) * 0.75; break; }
      }
      if (L.x !== ox || L.y !== oy) {
        L.moving = true;
        F.history.unshift({ x: L.x, y: L.y, dir: L.dir });
        if (F.history.length > 80) F.history.length = 80;
      }
    }
    // suiveurs
    for (let i = 1; i < F.actors.length; i++) {
      const a = F.actors[i], h = F.history[i * 14 - 1];
      a.moving = L.moving && !!h;
      if (h && L.moving) { a.x = h.x; a.y = h.y; a.dir = h.dir; }
    }
    if (Input.pressed('a')) interact();
    else if (Input.pressed('b') || Input.pressed('menu')) UI.openMenu();
  }
  function interact() {
    const L = F.actors[0];
    const [fx, fy] = DIRS[L.dir];
    const px = L.x + fx * 12, py = L.y - 3 + fy * 11;
    let best = null, bd = 1e9;
    for (const e of F.entities) {
      if (e.gone || !e.talk) continue;
      if (e.kind === 'trigger' || e.kind === 'warp') continue;
      const b = entBox(e);
      const cx = clamp(px, b[0], b[0] + b[2]), cy = clamp(py, b[1], b[1] + b[3]);
      const d = Math.hypot(cx - px, cy - py);
      if (d < 7 && d < bd) { bd = d; best = e; }
    }
    if (best) {
      const e = best;
      run(async () => {
        if (e.kind === 'npc' && e.turn !== false) faceTo(e, L);
        await e.talk(e);
      });
    }
  }
  function checkTouch() {
    const L = F.actors[0];
    const now = new Set();
    for (const e of F.entities) {
      const b = e.gone ? null : touchBox(e);
      if (!b) continue;
      if (inBox(L.x, L.y - 2, b)) {
        now.add(e);
        if (!F.touching.has(e)) {
          if (e.kind === 'warp') { F.touching = now; doWarp(e); return; }
          if (e.kind === 'trigger' && e.run) { const fn = e.run; if (e.once) e.gone = true; run(() => fn(e)); }
          if (e.kind === 'save') run(() => savePoint());
        }
      }
    }
    F.touching = now;
  }
  function doWarp(e) {
    run(async () => {
      SND.sfx('door');
      await UI.fadeTo(1, 14);
      load(e.to, e.dx, e.dy, e.dir || F.actors[0].dir);
      await wait(4);
      await UI.fadeTo(0, 14);
      if (F.map.onEnter) await F.map.onEnter();
    });
  }
  async function savePoint() {
    const r = await UI.ask(null, 'Un point de repos scintille. Te reposer et sauvegarder la partie ?', ['Oui', 'Non'], { cancel: 1 });
    if (r === 0) {
      Game.healAll();
      SND.sfx('heal');
      const ok = Game.save();
      await UI.say(null, ok ? 'L\'équipe est en pleine forme. Partie sauvegardée !' : 'L\'équipe est en pleine forme. (Sauvegarde impossible sur ce navigateur.)');
    }
  }

  function updateNPCs() {
    for (const e of F.entities) {
      if (e.gone) continue;
      e.t++;
      if (e.kind === 'npc' && e.wander && !locked()) {
        if (!e.wt || e.wt <= 0) {
          if (Math.random() < 0.5) { e.wdir = null; e.wt = 40 + Math.random() * 80; }
          else { e.wdir = pick(['up', 'down', 'left', 'right']); e.wt = 20 + Math.random() * 40; }
        }
        e.wt--;
        e.moving = false;
        if (e.wdir) {
          const [dx, dy] = DIRS[e.wdir];
          const nx = e.x + dx * 0.6, ny = e.y + dy * 0.6;
          const hx = e.homeX !== undefined ? e.homeX : (e.homeX = e.x), hy = e.homeY !== undefined ? e.homeY : (e.homeY = e.y);
          if (Math.abs(nx - hx) <= e.wander * TS && Math.abs(ny - hy) <= e.wander * TS && !blocked(nx, ny, e)) { e.x = nx; e.y = ny; e.moving = true; e.dir = e.wdir; }
          else e.wt = 0;
        }
      }
      if (e.kind === 'enemy' && !locked()) updateEnemy(e);
      if (e.moving || (e.kind === 'enemy')) e.anim++;
    }
  }
  function updateEnemy(e) {
    const L = F.actors[0];
    if (e.cool > 0) { e.cool--; return; }
    if (F.calm > 0) return;
    const dx = L.x - e.x, dy = L.y - e.y, d = Math.hypot(dx, dy);
    let mx = 0, my = 0;
    if (d < 70) { mx = dx / d * 0.75; my = dy / d * 0.75; e.alert = true; }
    else {
      e.alert = false;
      if (!e.wt || e.wt <= 0) { e.wa = Math.random() < 0.4 ? null : Math.random() * Math.PI * 2; e.wt = 30 + Math.random() * 60; }
      e.wt--;
      if (e.wa !== null && e.wa !== undefined) { mx = Math.cos(e.wa) * 0.4; my = Math.sin(e.wa) * 0.4; }
      if (Math.hypot(e.x + mx - e.homeX, e.y + my - e.homeY) > 40) { mx = (e.homeX - e.x) * 0.02; my = (e.homeY - e.y) * 0.02; }
    }
    if (mx && !tileSolid(e.x + mx + Math.sign(mx) * 5, e.y - 2)) e.x += mx;
    if (my && !tileSolid(e.x, e.y + my - (my < 0 ? 5 : 0))) e.y += my;
    if (mx) e.dir = mx < 0 ? 'left' : 'right';
    if (d < 15) {
      e.cool = 9999;
      run(async () => {
        const res = await Battle.start(e.group, { ent: e });
        if (res === 'win') e.gone = true;
        else e.cool = 150;
      });
    }
  }
  function updateCamera() {
    if (F.camLock) return;
    const L = F.actors[0];
    const mw = F.W * TS, mh = F.H * TS;
    const tx = mw <= SW ? (mw - SW) / 2 : clamp(L.x - SW / 2, 0, mw - SW);
    const ty = mh <= SH ? (mh - SH) / 2 : clamp(L.y - 8 - SH / 2, 0, mh - SH);
    F.camX += (tx - F.camX) * 0.25; F.camY += (ty - F.camY) * 0.25;
    if (Math.abs(tx - F.camX) < 0.3) F.camX = tx;
    if (Math.abs(ty - F.camY) < 0.3) F.camY = ty;
  }
  function update(consumed) {
    if (!locked() && !UI.blocking() && !consumed) { updateLeader(); if (!UI.blocking() && !locked()) checkTouch(); }
    else if (!locked()) for (const a of F.actors) a.moving = false;
    for (const a of F.actors) { if (a.moving) a.anim++; else a.anim = 0; }
    if (F.calm > 0 && !locked()) F.calm--;
    updateNPCs();
    updateCamera();
  }

  // ---------------- Rendu ----------------
  function charFrame(spr, dir, anim, moving) {
    const seq = [1, 0, 2, 0];
    const f = moving ? seq[Math.floor(anim / 8) % 4] : 0;
    return spr[dir][f];
  }
  function drawShadow(x, y, rx = 6, ry = 2.5) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y - 1), rx, ry, 0, 0, 7); ctx.fill();
  }
  function drawCharAt(name, x, y, dir, anim, moving, z = 0, img) {
    const spr = GFX.char(name);
    drawShadow(x, y);
    ctx.drawImage(img || charFrame(spr, dir, anim, moving), Math.round(x - 8), Math.round(y - 24 - z));
  }
  function drawEntity(e, cx, cy) {
    const x = e.x - cx, y = e.y - cy;
    switch (e.kind) {
      case 'npc':
        if (e.mon) { drawMonsterAt(e.mon, x, y, e.dir !== 'right', e.t, e.fly); break; }
        if (e.img) { ctx.drawImage(e.img, Math.round(x - e.img.width / 2), Math.round(y - e.img.height)); break; }
        drawCharAt(e.sprite, x, y, e.dir, e.anim, e.moving, e.z);
        break;
      case 'enemy': {
        const blink = e.cool > 0 && e.cool < 9999 && Math.floor(e.cool / 4) % 2;
        if (blink) break;
        if (e.char) drawCharAt(e.char, x, y, e.dir === 'right' ? 'right' : 'left', e.anim, true, 0);
        else drawMonsterAt(e.mon, x, y, e.dir !== 'right', e.t, ENEMIES[e.group[0]].fly);
        if (e.alert && !F.battle) FONT.draw(ctx, '!', x - 1, y - 34 + Math.sin(e.t * 0.3) * 2, '#ff6060');
        break;
      }
      case 'chest': ctx.drawImage(GFX.tiles.props[e.opened ? 'chestOpen' : 'chest'], Math.round(x - 8), Math.round(y - 14)); break;
      case 'ball': {
        const b = GFX.dragonBall(e.stars, 10);
        const bob = Math.sin(e.t * 0.08) * 1.5;
        drawShadow(x, y, 4, 2);
        ctx.drawImage(b, Math.round(x - 6), Math.round(y - 16 + bob));
        if (Math.floor(e.t / 6) % 8 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x - 3), Math.round(y - 13 + bob), 1, 1); }
        break;
      }
      case 'save': drawSave(x, y, e.t); break;
      case 'sign': ctx.drawImage(GFX.tiles.props.sign, Math.round(x - 7), Math.round(y - 16)); break;
      case 'img': ctx.drawImage(e.img, Math.round(x - e.img.width / 2), Math.round(y - e.img.height - (e.z || 0))); break;
    }
  }
  function drawSave(x, y, t) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t * 0.1) * 0.2;
    ctx.fillStyle = '#80f0ff';
    ctx.beginPath(); ctx.ellipse(x, y - 4, 8, 4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const a = t * 0.05 + i * Math.PI / 2;
      const px = x + Math.cos(a) * 7, py = y - 6 + Math.sin(a) * 3 - ((t * 0.5 + i * 10) % 16);
      ctx.fillStyle = i % 2 ? '#ffffff' : '#a0f8ff';
      ctx.fillRect(Math.round(px), Math.round(py), 1, 2); ctx.fillRect(Math.round(px) - 1, Math.round(py) + 1, 3, 0.01 + 0);
    }
    ctx.fillStyle = '#ffffff';
    const s = Math.floor(t / 8) % 3;
    ctx.fillRect(Math.round(x) - 1, Math.round(y - 12 - s), 2, 1); ctx.fillRect(Math.round(x), Math.round(y - 13 - s), 1, 3);
    ctx.restore();
  }
  function drawMonsterAt(name, x, y, faceLeft, t, fly, white) {
    const m = GFX.monster(name);
    const bob = fly ? Math.sin(t * 0.12) * 3 - 8 : 0;
    drawShadow(x, y, Math.max(5, m.w * 0.35), 2.5);
    const img = white ? (faceLeft ? m.white : m.whiteR) : (faceLeft ? m.img : m.imgR);
    ctx.drawImage(img, Math.round(x - m.w / 2), Math.round(y - m.h + bob));
  }

  function draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
    let sx = 0, sy = 0;
    if (Game.shake > 0) { sx = Math.round(rand(-1, 1) * Math.min(4, Game.shake)); sy = Math.round(rand(-1, 1) * Math.min(4, Game.shake)); Game.shake--; }
    const cx = Math.round(F.camX) + sx, cy = Math.round(F.camY) + sy;
    F.cx = cx; F.cy = cy;
    ctx.drawImage(F.base, -cx, -cy);
    // eau animée
    const t = Game.frame;
    const isW = (x, y) => { const c = tileAt(x, y); return c === null || c === '~' || c === 'b' || c === 'B'; };
    for (const [tx, ty] of F.waterTiles) {
      const px = tx * TS - cx, py = ty * TS - cy;
      if (px < -TS || py < -TS || px > SW || py > SH) continue;
      GFX.drawWater(ctx, px, py, tx, ty, t, { n: isW(tx, ty - 1), s: isW(tx, ty + 1), w: isW(tx - 1, ty), e: isW(tx + 1, ty) }, F.map.night);
    }
    // éléments plats au sol
    for (const e of F.entities) if (!e.gone && e.visible && e.kind === 'save') drawEntity(e, cx, cy);
    const list = [];
    for (const o of F.objects) {
      if (o.x - cx > SW || o.y - cy > SH || o.x + o.img.width - cx < 0 || o.y + o.img.height - cy < 0) continue;
      list.push({ y: o.sortY, d: () => ctx.drawImage(o.img, Math.round(o.x - cx), Math.round(o.y - cy)) });
    }
    for (const e of F.entities) {
      if (e.gone || !e.visible || e.kind === 'save') continue;
      if (F.battle && e.kind === 'enemy') continue;
      if (Math.abs(e.x - cx - SW / 2) > SW || Math.abs(e.y - cy - SH / 2) > SH) continue;
      list.push({ y: e.y + (e.sortOff || 0), d: () => drawEntity(e, cx, cy) });
    }
    if (!F.battle && !F.hideParty) for (let i = F.actors.length - 1; i >= 0; i--) {
      const a = F.actors[i];
      if (a.hidden) continue;
      list.push({ y: a.y + (i === 0 ? 0.5 : 0), d: () => drawCharAt(a.sprite, a.x - cx, a.y - cy, a.dir, a.anim, a.moving, a.z, a.img) });
    }
    list.sort((a, b) => a.y - b.y);
    for (const o of list) o.d();
    // en combat, les combattants passent au premier plan (pas cachés par les arbres)
    if (F.battle) { const bl = Battle.drawables(cx, cy).sort((a, b) => a.y - b.y); for (const o of bl) o.d(); }
    if (F.map.night) {
      ctx.fillStyle = 'rgba(16,16,70,0.42)'; ctx.fillRect(0, 0, SW, SH);
    }
    if (F.map.tint) { ctx.fillStyle = F.map.tint; ctx.fillRect(0, 0, SW, SH); }
    // effets (bulles d'émotion, fumée, techniques)
    F.effects = F.effects.filter(fx => {
      fx.age = (fx.age || 0) + 1;
      if (fx.type === 'emote') {
        const x = fx.e.x - cx, y = fx.e.y - cy - 34 - (fx.e.z || 0);
        UI.win(x - 7, y - 3, 14, 15);
        FONT.drawCentered(ctx, fx.ch, x, y, fx.ch === '!' ? '#ff8080' : '#fff');
        return --fx.t > 0;
      }
      if (fx.type === 'smoke') {
        const life = fx.t || 40, p = fx.age / life;
        ctx.globalAlpha = Math.max(0, 1 - p);
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2 + p, r = 4 + p * 16;
          ctx.fillStyle = i % 2 ? '#e8e8f0' : '#b8b8c8';
          ctx.beginPath(); ctx.arc(fx.x - cx + Math.cos(a) * r, fx.y - cy + Math.sin(a) * r * 0.7, 5 + p * 4, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        return fx.age < life;
      }
      return Battle.drawFx(Object.assign({}, fx, { t: fx.age, life: fx.life || fx.t }), cx, cy);
    });
  }

  return Object.assign(F, {
    load, update, draw, run, locked, ent, face, faceTo, walkTo, walkTile, jump, emote, partyGather, syncParty, snapCamera,
    leader: () => F.actors[0], tileAt, drawCharAt, drawMonsterAt, drawShadow, makeEntity, blocked,
    addEntity(def) { const e = makeEntity(def); F.entities.push(e); return e; },
    removeEntity(id) { const e = ent(id); if (e) e.gone = true; },
  });
})();
