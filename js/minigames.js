// Mini-jeux d'entraînement chez Tortue Géniale : rythme, livraison du lait, casse-briques, méditation.
const MiniGames = (() => {
  let G = null;
  const RANKS = ['C', 'B', 'A', 'S'];
  const RANK_COLS = ['#a0a8c8', '#80d8f8', '#80f080', '#f8e070'];
  const DIR_KEYS = ['up', 'right', 'down', 'left'];

  // ---------- Outils de dessin ----------
  const txtCache = {};
  function big(str, cx, y, scale, col, outline = K) {
    const key = str + col + outline;
    let c = txtCache[key];
    if (!c) {
      c = GFX.mk(FONT.measure(str) + 4, 15);
      const x = c.getContext('2d');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [0, 2], [1, 2]]) FONT.draw(x, str, 2 + dx, 1 + dy, outline, null);
      FONT.draw(x, str, 2, 1, col, null);
      txtCache[key] = c;
    }
    ctx.drawImage(c, Math.round(cx - c.width * scale / 2), Math.round(y), c.width * scale, c.height * scale);
  }
  function sky(top, bot, y0 = 0, y1 = SH) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, y0, SW, y1 - y0);
  }
  function arrow(x, y, dir, col, size = 5) { // flèche pixel
    ctx.fillStyle = col;
    for (let i = 0; i < size; i++) {
      const w = i * 2 + 1;
      if (dir === 'up') ctx.fillRect(x - i, y - size + i, w, 1);
      if (dir === 'down') ctx.fillRect(x - i, y + size - i, w, 1);
      if (dir === 'left') ctx.fillRect(x - size + i, y - i, 1, w);
      if (dir === 'right') ctx.fillRect(x + size - i, y - i, 1, w);
    }
    if (dir === 'up' || dir === 'down') ctx.fillRect(x - 1, dir === 'up' ? y : y - size + 1, 3, size);
    else ctx.fillRect(dir === 'left' ? x : x - size + 1, y - 1, size, 3);
  }
  const boxHit = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
  const spr = () => GFX.char(G.key);
  function drawChar(img, x, y, scale = 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 12 * scale, y + 31 * scale, 8 * scale, 2.5 * scale, 0, 0, 7); ctx.fill();
    ctx.drawImage(img, Math.round(x), Math.round(y), 24 * scale, 32 * scale);
  }

  // =====================================================================
  // 1. Rythme de la Tortue (façon Guitar Hero, trois colonnes)
  const FPB = 32, START = 128, TRAVEL = 90, HIT_Y = 176;
  const LANES = [88, 128, 168];
  const CHORDS = [[72, 76, 79], [69, 72, 76], [65, 69, 72], [67, 71, 74]]; // Do, La m, Fa, Sol
  const CHART = ['L...U...', 'R...U...', 'L.U.R.U.', 'R.U.L...', 'L.L.U.R.', 'U.R.U.L.', 'L.U.R.RU', 'R.U.L...',
    'U.L.U.R.', 'L.U.R.U.', 'L.UR.L.U', 'R...R.U.', 'LURULURU', 'R.U.L.U.', 'L.U.R.U.', 'U.......'];
  const rythme = {
    name: 'Rythme de la Tortue', stat: 'Ki max',
    help: 'Les Boules de Cristal tombent sur trois colonnes. Appuie sur Gauche, Haut ou Droite quand elles touchent les cercles !',
    init(S) {
      S.notes = []; S.fx = []; S.combo = 0; S.best = 0; S.hits = 0; S.pose = 0; S.dir = 'right'; S.press = [0, 0, 0];
      CHART.forEach((bar, b) => {
        for (let i = 0; i < 8; i++) {
          const lane = 'LUR'.indexOf(bar[i]);
          if (lane >= 0) S.notes.push({ t: START + (b * 8 + i) * FPB / 2, lane, midi: CHORDS[b % 4][lane] });
        }
      });
      S.last = S.notes[S.notes.length - 1].t;
      S.end = S.last + 110;
      S.max = S.notes.length * 100;
    },
    update(S, t) {
      if (t % FPB === 0) {
        const beat = t / FPB;
        if (t < START) SND.beat('h', 0.5);
        else if (t <= S.last) { SND.beat(beat % 2 ? 's' : 'k', 0.35); if (beat % 4 === 0) SND.note(CHORDS[Math.floor((t - START) / (FPB * 4)) % 4][0] - 24, 0.9, 'tri', 0.22); }
      } else if (t % FPB === FPB / 2 && t > START && t <= S.last) SND.beat('h', 0.25);
      ['left', 'up', 'right'].forEach((d, lane) => {
        if (!Input.pressed(d)) return;
        S.press[lane] = 8;
        let best = null, bd = 99;
        for (const n of S.notes) if (!n.done && n.lane === lane) { const dd = Math.abs(n.t - t); if (dd < bd) { bd = dd; best = n; } }
        if (best && bd <= 12) {
          best.done = 'hit';
          const q = bd <= 4 ? 0 : bd <= 8 ? 1 : 2;
          G.score += [100, 60, 30][q]; S.hits++; S.combo++; S.best = Math.max(S.best, S.combo);
          SND.note(best.midi, 0.22, 'p25', 0.17); SND.note(best.midi + 12, 0.12, 'p12', 0.05);
          S.fx.push({ lane, t: 0, txt: ['Parfait !', 'Bien !', 'Ok'][q], col: ['#f8e070', '#80f080', '#80d8f8'][q] });
          S.pose = 12; S.dir = lane === 0 ? 'left' : lane === 2 ? 'right' : (S.dir === 'left' ? 'right' : 'left');
        } else if (best && bd <= 30) { S.combo = 0; SND.sfx('miss'); }
      });
      for (const n of S.notes) if (!n.done && t - n.t > 12) { n.done = 'miss'; S.combo = 0; S.fx.push({ lane: n.lane, t: 0, txt: 'Raté', col: '#f87070' }); }
      for (let i = 0; i < 3; i++) if (S.press[i] > 0) S.press[i]--;
      if (S.pose > 0) S.pose--;
      S.fx = S.fx.filter(f => ++f.t < 30);
      if (t === S.last + 20 && G.score >= S.max * 0.75) SND.sfx('beam');
      if (t >= S.end) G.done = true;
    },
    rank(S) { const p = G.score / S.max; return p >= 0.9 ? 3 : p >= 0.75 ? 2 : p >= 0.55 ? 1 : 0; },
    draw(S, t) {
      sky('#402870', '#f89050', 0, 150);
      ctx.fillStyle = '#f8d870'; ctx.beginPath(); ctx.arc(128, 150, 26, Math.PI, 0); ctx.fill();
      sky('#3060a8', '#183870', 150, SH);
      for (let i = 0; i < 16; i++) { ctx.fillStyle = 'rgba(255,230,160,0.5)'; ctx.fillRect((i * 37 + t) % SW, 156 + (i * 13) % 60, 6, 1); }
      // colonnes
      LANES.forEach((x, i) => {
        ctx.fillStyle = S.press[i] ? 'rgba(255,255,255,0.22)' : 'rgba(10,10,40,0.35)'; ctx.fillRect(x - 15, 0, 30, SH);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 15, 0, 1, SH); ctx.fillRect(x + 14, 0, 1, SH);
        ctx.strokeStyle = S.press[i] ? '#ffffff' : '#d8e0ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, HIT_Y, 11, 0, 7); ctx.stroke();
        arrow(x, HIT_Y, ['left', 'up', 'right'][i], S.press[i] ? '#ffffff' : '#a8b8f0', 4);
      });
      // notes
      for (const n of S.notes) {
        if (n.done === 'hit') continue;
        const y = HIT_Y - (n.t - t) * (HIT_Y - 10) / TRAVEL;
        if (y < -16 || y > SH + 16) continue;
        ctx.globalAlpha = n.done === 'miss' ? 0.35 : 1;
        ctx.drawImage(GFX.dragonBall([1, 4, 7][n.lane], 14), Math.round(LANES[n.lane] - 8), Math.round(y - 8), 16, 16);
        ctx.globalAlpha = 1;
      }
      for (const f of S.fx) {
        ctx.globalAlpha = 1 - f.t / 30;
        FONT.drawCentered(ctx, f.txt, LANES[f.lane], HIT_Y - 26 - f.t, f.col);
        if (f.txt !== 'Raté') { ctx.strokeStyle = f.col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(LANES[f.lane], HIT_Y, 11 + f.t, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      // Goku et Tortue Géniale
      const s = spr();
      const beam = t > S.last + 20 && G.score >= S.max * 0.75;
      drawChar(beam ? s.attack : S.pose ? (S.dir === 'left' ? s.attackL : s.attack) : s.down[0], 6, 120 - (S.pose > 6 ? 4 : 0));
      const bob = Math.floor(t / (FPB / 2)) % 2;
      drawChar(GFX.char('roshi').down[0], 204, 122 + bob);
      if (beam) {
        const k = Math.min(1, (t - S.last - 20) / 20), len = (SW - 50) * k;
        ctx.fillStyle = '#80d8ff'; ctx.fillRect(50, 140, len, 12);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(50, 143, len, 6);
        big('KAMEHAMEHA !', 128, 60, 2, '#80d8ff', '#102050');
      }
      // interface
      FONT.draw(ctx, 'Score ' + G.score, 6, 6, '#ffffff');
      if (S.combo > 2) FONT.drawRight(ctx, 'Combo ' + S.combo, 250, 6, '#f8e070');
      if (t < START) big(['Prêt ?', '3', '2', '1'][Math.floor(t / FPB)] || '', 128, 80, 2, '#ffffff');
    },
  };

  // =====================================================================
  // 2. Livraison du lait (course avec sauts)
  const GROUND = 178;
  const lait = {
    name: 'Livraison du lait', stat: 'Vitesse', music: 'training',
    help: 'Livre le lait en courant ! Z / A ou Haut pour sauter par-dessus les rochers et attraper les bouteilles en l\'air.',
    init(S) { Object.assign(S, { x: 60, y: GROUND, vy: 0, speed: 2.2, dist: 0, obs: [], bottles: 0, hearts: 3, inv: 0, nextObs: 80, nextBottle: 30, parts: [], shake: 0, dur: 1800 }); },
    update(S, t) {
      S.speed = 2.2 + Math.min(1.1, t / 1400);
      S.dist += S.speed;
      const ground = S.y >= GROUND;
      if (ground && (Input.pressed('a') || Input.pressed('up'))) { S.vy = -4.9; SND.sfx('jump'); }
      S.vy += 0.24; S.y = Math.min(GROUND, S.y + S.vy); if (S.y >= GROUND) S.vy = 0;
      if (--S.nextObs <= 0) {
        const log = Math.random() < 0.35;
        S.obs.push({ kind: log ? 'log' : 'rock', x: 272, w: log ? 22 : 14, h: log ? 9 : 12 });
        S.nextObs = Math.max(58, Math.round(rand(70, 115) - t / 60));
      }
      if (--S.nextBottle <= 0) {
        const air = Math.random() < 0.5;
        if (!S.obs.some(o => o.kind !== 'bottle' && Math.abs(o.x - 272) < 26) || air) S.obs.push({ kind: 'bottle', x: 272, y: air ? GROUND - 44 : GROUND - 4 });
        S.nextBottle = Math.round(rand(44, 76));
      }
      const box = [S.x - 6, S.y - 26, 12, 24];
      for (const o of S.obs) {
        o.x -= S.speed;
        const ob = o.kind === 'bottle' ? [o.x - 5, o.y - 11, 10, 12] : [o.x - o.w / 2 + 4, GROUND - o.h + 3, o.w - 8, o.h - 3];
        if (o.gone || !boxHit(box, ob)) continue;
        if (o.kind === 'bottle') { o.gone = true; S.bottles++; SND.sfx('coin'); S.parts.push({ x: o.x, y: o.y - 10, t: 0, txt: '+1', col: '#ffffff' }); }
        else if (S.inv <= 0) {
          S.hearts--; S.inv = 70; S.shake = 10; SND.sfx('hit');
          S.parts.push({ x: S.x, y: S.y - 34, t: 0, txt: 'Le lait coule !', col: '#f87070' });
          if (S.hearts <= 0) G.done = true;
        }
      }
      S.obs = S.obs.filter(o => o.x > -30 && !o.gone);
      S.parts = S.parts.filter(p => ++p.t < 40);
      if (S.inv > 0) S.inv--;
      if (S.shake > 0) S.shake--;
      G.score = S.bottles + S.hearts * 4;
      if (t >= S.dur) G.done = true;
    },
    rank() { return G.score >= 30 ? 3 : G.score >= 22 ? 2 : G.score >= 14 ? 1 : 0; },
    draw(S, t) {
      const sx = S.shake ? Math.round(rand(-2, 2)) : 0;
      sky('#68b8f0', '#d8f0ff', 0, 150);
      ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(210, 40, 14, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { const x = ((i * 90 - S.dist * 0.1) % 360 + 360) % 360 - 50; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 30 + i * 12, 34, 6); ctx.fillRect(x + 6, 26 + i * 12, 20, 4); }
      for (let x = 0; x < SW; x++) { const h = 30 + Math.sin((x + S.dist * 0.25) * 0.03) * 12 + Math.sin((x + S.dist * 0.25) * 0.09) * 5; ctx.fillStyle = '#6a9ac8'; ctx.fillRect(x, 150 - h, 1, h); }
      ctx.fillStyle = '#3878d8'; ctx.fillRect(0, 140, SW, 14);
      ctx.fillStyle = '#58a040'; ctx.fillRect(0, 152, SW, GROUND - 152);
      ctx.fillStyle = '#c8a060'; ctx.fillRect(0, GROUND - 2, SW, SH - GROUND + 2);
      ctx.fillStyle = '#a07c40';
      for (let i = 0; i < 20; i++) ctx.fillRect(((i * 23 - S.dist) % SW + SW) % SW, GROUND + 6 + (i * 7) % 30, 4, 2);
      ctx.save(); ctx.translate(sx, 0);
      for (const o of S.obs) {
        if (o.kind === 'rock') { const r = GFX.tiles.rocks[0]; ctx.drawImage(r, Math.round(o.x - r.width / 2), GROUND - r.height + 2); }
        else if (o.kind === 'log') {
          ctx.fillStyle = K; ctx.fillRect(o.x - 12, GROUND - 10, 24, 10);
          ctx.fillStyle = '#8a5a30'; ctx.fillRect(o.x - 11, GROUND - 9, 22, 8);
          ctx.fillStyle = '#c89060'; ctx.fillRect(o.x + 7, GROUND - 8, 3, 6); ctx.fillStyle = '#5a3418'; ctx.fillRect(o.x - 9, GROUND - 6, 14, 1);
        } else {
          const y = Math.round(o.y + Math.sin((t + o.x) * 0.15) * 1.5);
          ctx.fillStyle = K; ctx.fillRect(o.x - 3, y - 11, 7, 11);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x - 2, y - 8, 5, 7); ctx.fillStyle = '#3878d8'; ctx.fillRect(o.x - 2, y - 10, 5, 2);
          ctx.fillStyle = '#d8e0f0'; ctx.fillRect(o.x + 1, y - 7, 1, 5);
        }
      }
      // Goku et sa caisse de lait
      if (!(S.inv && Math.floor(S.inv / 4) % 2)) {
        const s = spr(), f = S.y < GROUND ? 1 : [1, 0, 2, 0][Math.floor(t / 6) % 4];
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(S.x, GROUND, 7, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = K; ctx.fillRect(S.x - 15, S.y - 24, 10, 10);
        ctx.fillStyle = '#a06a3a'; ctx.fillRect(S.x - 14, S.y - 23, 8, 8);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(S.x - 13, S.y - 27, 2, 4); ctx.fillRect(S.x - 9, S.y - 27, 2, 4);
        ctx.drawImage(s.right[f], Math.round(S.x - 12), Math.round(S.y - 32));
      }
      ctx.restore();
      for (const p of S.parts) { ctx.globalAlpha = 1 - p.t / 40; FONT.drawCentered(ctx, p.txt, p.x, p.y - p.t * 0.5, p.col); ctx.globalAlpha = 1; }
      for (let h = 0; h < 3; h++) FONT.draw(ctx, '♥', 6 + h * 10, 6, h < S.hearts ? '#ff6080' : '#404870');
      ctx.fillStyle = K; ctx.fillRect(41, 5, 7, 11); ctx.fillStyle = '#ffffff'; ctx.fillRect(42, 8, 5, 7); ctx.fillStyle = '#3878d8'; ctx.fillRect(42, 6, 5, 2);
      FONT.draw(ctx, 'x' + S.bottles, 52, 6, '#ffffff');
      UI.bar(160, 10, 88, S.dur - t, S.dur, '#f8c040');
    },
  };

  // =====================================================================
  // 3. Casse-briques (jauge de précision)
  const briques = {
    name: 'Casse-briques', stat: 'Force', music: 'training',
    help: 'Frappe avec Z / A quand le curseur est dans la zone verte. Plus tu vises le centre, plus tu casses de briques !',
    init(S) { Object.assign(S, { round: 0, parts: [] }); this.next(S); },
    next(S) {
      const r = S.round;
      Object.assign(S, { phase: 'aim', anim: 0, cx: 48, dir: 1, n: 0, speed: [2.2, 2.8, 3.4, 4.0, 4.8][r], zw: [44, 36, 28, 22, 16][r] });
      S.zc = Math.round(rand(64 + S.zw / 2, 192 - S.zw / 2));
    },
    update(S) {
      if (S.phase === 'aim') {
        S.cx += S.dir * S.speed;
        if (S.cx > 208) { S.cx = 208; S.dir = -1; } else if (S.cx < 48) { S.cx = 48; S.dir = 1; }
        if (Input.pressed('a') || Input.pressed('up')) {
          const d = Math.abs(S.cx - S.zc), half = S.zw / 2;
          S.n = d <= 2 ? 10 : d <= half ? Math.round(10 - 3 * d / half) : Math.max(0, Math.round(5 - (d - half) / 6));
          G.score += S.n;
          S.label = S.n === 10 ? 'PARFAIT !' : S.n >= 7 ? 'Super !' : S.n >= 4 ? 'Bien' : 'Aïe...';
          SND.sfx(S.n >= 8 ? 'bighit' : S.n ? 'hit' : 'buzz');
          for (let i = 0; i < S.n; i++) for (const side of [-1, 1]) S.parts.push({ x: 176 + side * 8, y: 112 + i * 6, vx: side * rand(0.6, 2.4), vy: rand(-3, -0.5), t: 0 });
          S.phase = 'hit'; S.anim = 0;
        }
      } else if (++S.anim > 70) {
        S.round++;
        if (S.round >= 5) G.done = true; else this.next(S);
      }
      for (const p of S.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.t++; }
      S.parts = S.parts.filter(p => p.t < 60);
    },
    rank() { return G.score >= 46 ? 3 : G.score >= 38 ? 2 : G.score >= 28 ? 1 : 0; },
    draw(S, t) {
      // dojo
      ctx.fillStyle = '#c89060'; ctx.fillRect(0, 0, SW, 168);
      for (let x = 0; x < SW; x += 16) { ctx.fillStyle = (x / 16) % 2 ? '#b8804e' : '#d09a68'; ctx.fillRect(x, 0, 15, 168); }
      ctx.fillStyle = '#6a4220'; ctx.fillRect(0, 60, SW, 4);
      ctx.fillStyle = '#5a3418'; ctx.fillRect(18, 68, 44, 60); ctx.fillStyle = '#f0e4c0'; ctx.fillRect(20, 70, 40, 56);
      FONT.drawCentered(ctx, 'Kamé', 40, 92, '#d83030');
      ctx.fillStyle = '#8a5a30'; ctx.fillRect(0, 168, SW, SH - 168);
      for (let x = 0; x < SW; x += 32) { ctx.fillStyle = '#7a4c28'; ctx.fillRect(x, 168, 1, SH - 168); }
      // pile de briques
      const left = S.phase === 'hit' ? 10 - S.n : 10, shakeX = S.phase === 'hit' && S.anim < 10 ? Math.round(rand(-2, 2)) : 0;
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(160, 166, 32, 6); ctx.fillRect(162, 150, 4, 16); ctx.fillRect(186, 150, 4, 16);
      for (let i = 0; i < 10; i++) {
        if (i < 10 - left) continue;
        const y = 106 + i * 5;
        ctx.fillStyle = K; ctx.fillRect(157 + shakeX, y, 38, 5);
        ctx.fillStyle = '#c84838'; ctx.fillRect(158 + shakeX, y + 1, 36, 3); ctx.fillStyle = '#e87060'; ctx.fillRect(158 + shakeX, y + 1, 36, 1);
      }
      for (const p of S.parts) { ctx.fillStyle = K; ctx.fillRect(p.x - 1, p.y - 1, 9, 4); ctx.fillStyle = '#c84838'; ctx.fillRect(p.x, p.y, 7, 2); }
      const s = spr(), chop = S.phase === 'hit' && S.anim < 24;
      drawChar(chop ? s.attack : s.right[0], 104, 92 - (chop ? 6 : 0));
      drawChar(GFX.char('roshi').left[0], 210, 106 + Math.floor(t / 30) % 2, 1.5);
      // jauge
      UI.win(40, 18, 176, 30);
      ctx.fillStyle = '#101030'; ctx.fillRect(48, 30, 160, 8);
      ctx.fillStyle = '#40c050'; ctx.fillRect(S.zc - S.zw / 2, 30, S.zw, 8);
      ctx.fillStyle = '#a0ffa0'; ctx.fillRect(S.zc - 1, 30, 2, 8);
      arrow(Math.round(S.cx), 26, 'down', '#ffffff', 4);
      FONT.draw(ctx, 'Manche ' + Math.min(5, S.round + 1) + '/5', 8, 54, '#ffffff');
      FONT.drawRight(ctx, 'Briques : ' + G.score, 248, 54, '#f8e070');
      if (S.phase === 'hit') big(S.label + (S.n ? '  ' + S.n : ''), 128, 66, 1, S.n >= 7 ? '#f8e070' : '#ffffff');
    },
  };

  // =====================================================================
  // 4. Méditation (mémoire de séquences)
  const PADS = [[128, 54, '#e04848'], [196, 112, '#4880e8'], [128, 170, '#48c058'], [60, 112, '#e8c830']];
  const TONES = [72, 76, 79, 84];
  const meditation = {
    name: 'Méditation', stat: 'Puissance',
    help: 'Concentre-toi : observe l\'ordre dans lequel les symboles s\'allument, puis reproduis-le avec les flèches.',
    init(S) { Object.assign(S, { seq: Array.from({ length: 10 }, () => Math.floor(Math.random() * 4)), len: 3, phase: 'show', pt: 0, lit: -1, litT: 0, input: 0, best: 0 }); },
    update(S) {
      S.pt++;
      if (S.litT > 0 && --S.litT === 0) S.lit = -1;
      if (S.phase === 'show') {
        const k = Math.floor((S.pt - 30) / 26), off = (S.pt - 30) % 26;
        if (S.pt >= 30 && k < S.len && off === 0) { S.lit = S.seq[k]; S.litT = 18; SND.note(TONES[S.lit], 0.28, 'tri', 0.3); }
        if (k >= S.len && off > 10) { S.phase = 'input'; S.input = 0; S.pt = 0; }
      } else if (S.phase === 'input') {
        DIR_KEYS.forEach((d, i) => {
          if (!Input.pressed(d) || S.phase !== 'input') return;
          S.lit = i; S.litT = 12;
          if (i === S.seq[S.input]) {
            SND.note(TONES[i], 0.22, 'tri', 0.3);
            if (++S.input === S.len) { S.best = S.len; S.phase = 'ok'; S.pt = 0; G.score = S.best; }
          } else { SND.sfx('buzz'); S.phase = 'fail'; S.pt = 0; }
        });
      } else if (S.phase === 'ok' && S.pt > 40) {
        if (S.len >= 10) G.done = true;
        else { S.len++; S.phase = 'show'; S.pt = 0; SND.sfx('confirm'); }
      } else if (S.phase === 'fail' && S.pt > 60) G.done = true;
    },
    rank() { return G.score >= 10 ? 3 : G.score >= 8 ? 2 : G.score >= 6 ? 1 : 0; },
    draw(S, t) {
      sky('#060820', '#28306a');
      for (let i = 0; i < 50; i++) { if ((i + Math.floor(t / 25)) % 9 === 0) continue; ctx.fillStyle = i % 3 ? '#c0c8ff' : '#ffffff'; ctx.fillRect(GFX.hash(i, 5) % SW, GFX.hash(i, 6) % 150, 1, 1); }
      ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(30, 30, 10, 0, 7); ctx.fill();
      ctx.fillStyle = '#060820'; ctx.beginPath(); ctx.arc(35, 27, 9, 0, 7); ctx.fill(); // croissant de lune (surtout pas la pleine lune !)
      ctx.fillStyle = '#183060'; ctx.fillRect(0, 150, SW, SH - 150);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = 'rgba(200,220,255,0.3)'; ctx.fillRect((i * 41 + t * 0.3) % SW, 160 + (i * 17) % 60, 8, 1); }
      PADS.forEach(([x, y, col], i) => {
        const on = S.lit === i;
        if (on) { ctx.fillStyle = col + '55'; ctx.beginPath(); ctx.arc(x, y, 24, 0, 7); ctx.fill(); }
        ctx.fillStyle = K; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill();
        ctx.fillStyle = on ? col : '#2a3060'; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.stroke();
        arrow(x, y, DIR_KEYS[i], on ? '#ffffff' : col, 6);
      });
      const s = spr();
      drawChar(s.down[0], 104, 80 + Math.sin(t * 0.05) * 3);
      FONT.draw(ctx, 'Séquence : ' + S.len, 6, 6, '#ffffff');
      FONT.drawRight(ctx, 'Réussi : ' + S.best, 250, 6, '#f8e070');
      const msg = S.phase === 'show' ? 'Observe...' : S.phase === 'input' ? 'À toi ! (' + S.input + '/' + S.len + ')' : S.phase === 'ok' ? 'Bien !' : 'Raté...';
      FONT.drawCentered(ctx, msg, 128, 200, S.phase === 'fail' ? '#f87070' : '#ffffff');
    },
  };

  const GAMES = { rythme, lait, briques, meditation };

  // ---------- Déroulement ----------
  function run(id, member) {
    return new Promise(res => {
      const def = GAMES[id];
      G = { id, def, m: member, key: lookKey(member), phase: 'intro', t: 0, score: 0, s: {}, res, done: false };
      def.init.call(def, G.s);
      Game.mode = 'minigame';
      SND.stopMusic(true);
      Input.clear();
    });
  }
  function update() {
    if (!G) return;
    G.t++;
    if (G.phase === 'intro') {
      if (G.t > 20 && Input.pressed('a')) { G.phase = 'play'; G.t = 0; if (G.def.music) SND.playMusic(G.def.music); SND.sfx('confirm'); }
      else if (G.t > 20 && Input.pressed('b')) end(null);
      return;
    }
    if (G.phase === 'play') {
      G.def.update.call(G.def, G.s, G.t);
      if (G.done) {
        G.phase = 'result'; G.rt = 0; G.rank = G.def.rank.call(G.def, G.s);
        SND.stopMusic(false);
        SND.sfx(G.rank >= 2 ? 'levelup' : G.rank === 1 ? 'item' : 'cancel');
      }
      return;
    }
    G.rt++;
    if (G.rt > 45 && (Input.pressed('a') || Input.pressed('b'))) { SND.sfx('confirm'); end({ score: G.score, rank: G.rank }); }
  }
  function end(result) {
    const r = G.res;
    G = null;
    Game.mode = 'field';
    Input.clear();
    SND.playMusic(Field.map ? Field.map.music : 'field');
    r(result);
  }
  function draw() {
    if (!G) return;
    G.def.draw.call(G.def, G.s, G.phase === 'play' ? G.t : 0);
    if (G.phase === 'intro') {
      ctx.fillStyle = 'rgba(0,0,20,0.55)'; ctx.fillRect(0, 0, SW, SH);
      UI.win(20, 34, 216, 150);
      big(G.def.name, 128, 42, 1, '#f8e070');
      FONT.wrap(G.def.help, 196).forEach((l, i) => FONT.draw(ctx, l, 30, 66 + i * 12, '#ffffff'));
      FONT.draw(ctx, 'Élève : ' + G.m.name, 30, 132, '#80d8f8');
      FONT.draw(ctx, 'Récompense : ' + G.def.stat, 30, 145, '#80d8f8');
      if (Math.floor(G.t / 20) % 2) FONT.drawCentered(ctx, 'Z / A : commencer   X : retour', 128, 166, '#f8e070');
    } else if (G.phase === 'result') {
      ctx.fillStyle = 'rgba(0,0,20,' + Math.min(0.6, G.rt / 40) + ')'; ctx.fillRect(0, 0, SW, SH);
      UI.win(48, 50, 160, 116);
      FONT.drawCentered(ctx, 'Rang', 128, 58, '#c0c8e8');
      const s = Math.min(1, G.rt / 20);
      big(RANKS[G.rank], 128, 88 - 20 * s, 1 + 3 * s, RANK_COLS[G.rank]);
      FONT.drawCentered(ctx, 'Score : ' + G.score, 128, 132, '#ffffff');
      if (G.rt > 45 && Math.floor(G.rt / 20) % 2) FONT.drawCentered(ctx, 'Z / A : continuer', 128, 148, '#f8e070');
    }
  }
  return { run, update, draw, GAMES, RANKS, active: () => !!G, state: () => G };
})();
