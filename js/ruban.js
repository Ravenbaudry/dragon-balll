// Arc du Ruban Rouge, 1re partie : personnages et ennemis de l'arc, chapitre 9 (village Jingle et Tour Muscle)
// et chapitre 10 (village Pingouin, Arale et le professeur Senbei).
const Ruban = (() => {
  const TS = 16;

  // ---------------- Retouches des têtes ----------------
  const paint = (g, y, x0, x1, ch, only) => { if (!g[y]) return; for (let x = x0; x <= x1; x++) if (g[y][x] !== '.' && (!only || only.includes(g[y][x]))) g[y][x] = ch; };
  const set = (g, y, x, ch) => { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch; };
  const MODS = {
    logo: { phase: 'body', fn(g, c) { if (c.dir === 'down') { set(g, 19, 14, 'v'); set(g, 19, 15, 'v'); set(g, 20, 15, 'v'); } else if (c.dir === 'right' && !c.attack) { set(g, 19, 12, 'v'); set(g, 20, 12, 'v'); } } }, // le ruban rouge sur la poitrine
    moustache: { phase: 'head', fn(g, c) { if (c.dir === 'down') { paint(g, 15, 8, 15, 'W'); set(g, 16, 8, 'W'); set(g, 16, 15, 'W'); } else if (c.dir === 'right') { paint(g, 15, 14, 18, 'W'); set(g, 16, 17, 'W'); } } },
    glasses: { phase: 'head', fn(g, c) { // grosses lunettes rondes (Senbei, Arale)
      if (c.dir === 'down') for (const x0 of [6, 13]) { paint(g, 12, x0, x0 + 4, 'g'); paint(g, 14, x0, x0 + 4, 'g'); set(g, 13, x0, 'g'); set(g, 13, x0 + 4, 'g'); paint(g, 13, x0 + 1, x0 + 3, 'W'); }
      else if (c.dir === 'right') { paint(g, 12, 15, 19, 'g'); paint(g, 14, 15, 19, 'g'); set(g, 13, 15, 'g'); set(g, 13, 19, 'g'); paint(g, 13, 16, 18, 'W'); }
    } },
    mask: { phase: 'head', fn(g, c) { // cagoule de ninja : seuls les yeux dépassent
      for (let y = 14; y <= 16; y++) paint(g, y, 4, 20, 'h', 'sStm');
      if (c.dir === 'down') paint(g, 12, 6, 17, 'h', 'sSt'); else if (c.dir === 'right') paint(g, 11, 12, 18, 'h', 'sSt');
    } },
    patch: { phase: 'head', fn(g, c) { // bandeau sur l'œil (Red)
      if (c.dir === 'down') { paint(g, 12, 5, 18, 'g'); paint(g, 13, 13, 16, 'g'); paint(g, 14, 13, 16, 'g'); }
      else if (c.dir === 'right') { paint(g, 11, 6, 18, 'g'); paint(g, 13, 16, 18, 'g'); paint(g, 14, 16, 18, 'g'); }
    } },
    horns: { phase: 'head', fn(g, c) {
      const xs = c.dir === 'right' ? [11, 15] : [6, 17];
      for (const x of xs) { set(g, 3, x, 'y'); set(g, 2, x, 'y'); set(g, 1, x + (x < 12 ? -1 : 1), 'y'); set(g, 4, x, 'y'); }
    } },
    hat: { phase: 'head', fn(g, c) { // chapeau pointu de sorcière (Baba)
      const cx = c.dir === 'right' ? 12 : 11;
      for (let y = 0; y <= 5; y++) { const w = Math.floor(y * 0.9); paint(g, y, cx - w, cx + 1 + w, 'u'); set(g, y, cx - w - 1, 'k'); set(g, y, cx + 2 + w, 'k'); }
      paint(g, 6, cx - 8, cx + 9, 'U'); set(g, 6, cx - 9, 'k'); set(g, 6, cx + 10, 'k'); paint(g, 7, cx - 8, cx + 9, 'k', 'hHjU.');
    } },
    braid: { phase: 'back', fn(g, c) { if (c.dir === 'right') for (let y = 12; y <= 21; y++) { set(g, y, 5, 'k'); set(g, y, 6, 'h'); set(g, y, 7, 'k'); } else if (c.dir === 'up') for (let y = 17; y <= 22; y++) { set(g, y, 11, 'h'); set(g, y, 12, 'h'); } } },
    fangs: { phase: 'head', fn(g, c) { if (c.dir === 'down') { set(g, 16, 10, 'w'); set(g, 16, 13, 'w'); } else if (c.dir === 'right') set(g, 16, 16, 'w'); } },
    bandages: { phase: 'head', fn(g) { for (let y = 5; y <= 16; y += 2) paint(g, y, 3, 20, 'H', 'hjsSt'); } },
    gohanMask: { phase: 'head', fn(g, c) { // le masque du mystérieux combattant... et son auréole
      if (c.dir === 'down') { paint(g, 9, 4, 19, 'v', 'swWtS'); paint(g, 10, 4, 19, 'v', 'swWtSk'); set(g, 10, 8, 'e'); set(g, 10, 9, 'e'); set(g, 10, 14, 'e'); set(g, 10, 15, 'e'); }
      else if (c.dir === 'right') { paint(g, 9, 7, 17, 'v', 'swWtS'); paint(g, 10, 7, 17, 'v', 'swWtSk'); set(g, 10, 14, 'e'); set(g, 10, 15, 'e'); }
      for (let x = 8; x <= 15; x++) set(g, 0, x, 'y');
      set(g, 1, 7, 'y'); set(g, 1, 16, 'y');
    } },
  };
  Object.assign(PALS, {
    soldat_rr: { h: '#5a6448', H: '#3a4230', j: '#8a9470', c: '#6a7450', C: '#454c34', q: '#949c78', d: '#3a3a2a', D: '#22221a', p: '#4a503a', P: '#2e3224', f: '#1a1a14', F: '#0a0a08', x: '#3a3a30', a: '#6a7450', v: '#e02828' },
    general_blanc: { h: '#f0f0f4', H: '#b8b8c8', j: '#ffffff', c: '#e8e8ee', C: '#a8a8b8', q: '#ffffff', d: '#3a3a4a', D: '#22222e', p: '#d8d8e0', P: '#a0a0b0', f: '#2a2a30', F: '#141418', x: '#4a4a50', a: '#e8e8ee', v: '#e02828', W: '#f4f4f8' },
    metallique: { s: '#9aa0b0', S: '#6a7080', t: '#d0d8e8', v: '#ff3030', V: '#a01818', c: '#7a8090', C: '#505868', q: '#aab0c0', d: '#e02828', D: '#a01818', p: '#606878', P: '#404858', f: '#303440', F: '#1a1e28', x: '#5a6070', a: '#7a8090' },
    murasaki: { h: '#6a3a9a', H: '#44226a', j: '#9a6ac8', c: '#6a3a9a', C: '#44226a', q: '#9a6ac8', d: '#d8c040', D: '#a08a20', p: '#5a2e88', P: '#3a1a5a', f: '#2a1a3a', F: '#140a20', x: '#4a3a5a', a: '#6a3a9a' },
    c8: { s: '#e2d6b8', S: '#b8a88a', t: '#f4ecd8', o: '#8a8a98', c: '#3c7a48', C: '#245030', q: '#68a874', d: '#2a2a2a', D: '#141414', p: '#3c7a48', P: '#245030', f: '#3a2a1a', F: '#20140a', x: '#5a4a3a', a: '#3c7a48' },
    suno: { h: '#f0d050', H: '#b89820', j: '#fff0a0', c: '#e86080', C: '#a83c58', q: '#ffa0b8', d: '#ffffff', D: '#c8c8d8', f: '#7a4a2a', F: '#4a2a10', x: '#a06a3a', a: '#e86080' },
    chef_jingle: { w: '#f2f2f6', W: '#b8b8c8', c: '#4a7ac8', C: '#2e5098', q: '#88b0f0', d: '#e8c860', D: '#b08c30', f: '#2a1a10', F: '#140a04', a: '#4a7ac8' },
    villageois_n: { h: '#6a4a2a', H: '#3a2410', j: '#9a7048', c: '#c84838', C: '#8a2a20', q: '#f08070', d: '#f0f0f0', D: '#b8b8c8', p: '#4a4a6a', P: '#2a2a4a', f: '#3a2a1a', F: '#20140a', x: '#5a4a3a', a: '#c84838' },
    senbei: { h: '#1c1c28', H: '#0c0c14', j: '#40405c', c: '#5a8a50', C: '#3a6034', q: '#90c088', d: '#f0f0f0', D: '#b0b0c0', p: '#4a4a5a', P: '#2a2a3a', f: '#5a3a1a', F: '#3a2410', x: '#7a5a3a', a: '#5a8a50' },
    arale: { h: '#6a4aa8', H: '#44307a', j: '#9a80d8', c: '#3c64c8', C: '#26408a', q: '#80a0f0', d: '#f0d040', D: '#b09820', f: '#e84040', F: '#a02020', x: '#ff8080', a: '#ffffff' },
    bleu: { h: '#f0d048', H: '#b89820', j: '#fff0a0', c: '#3a5aa8', C: '#24387a', q: '#7090d8', d: '#e8e8f0', D: '#a8a8b8', p: '#2e4888', P: '#1c2c5a', f: '#1a1a1a', F: '#0a0a0a', x: '#3a3a3a', a: '#3a5aa8', v: '#e02828' },
    tao: { h: '#1c1c28', H: '#0c0c14', j: '#40405c', c: '#e888a8', C: '#b05878', q: '#ffc0d4', d: '#f0f0f0', D: '#b8b8c8', p: '#f0f0f0', P: '#b8b8c8', f: '#1a1a1a', F: '#0a0a0a', x: '#3a3a3a', a: '#e888a8', W: '#1c1c28' },
    upa: { s: '#b07444', S: '#7c4a24', t: '#d89a64', h: '#1c1c28', H: '#0c0c14', j: '#40405c', c: '#f0ece0', C: '#bcb4a0', q: '#ffffff', d: '#c83838', D: '#8a2020', p: '#e4dccb', P: '#b0a690', f: '#6a4224', F: '#3e2410', x: '#8a5a34', a: '#b07444' },
    bora: { s: '#a06a3c', S: '#6c421e', t: '#c88a54', h: '#1c1c28', H: '#0c0c14', j: '#40405c', c: '#c8a060', C: '#8a6a30', q: '#e8c890', d: '#c83838', D: '#8a2020', p: '#c8a060', P: '#8a6a30', f: '#6a4224', F: '#3e2410', x: '#8a5a34', a: '#a06a3c' },
    rouge: { h: '#e04030', H: '#a02818', j: '#ff8070', c: '#a8382c', C: '#70201a', q: '#e07060', d: '#f0c040', D: '#b08820', p: '#5a2a24', P: '#3a1a14', f: '#1a1a1a', F: '#0a0a0a', x: '#3a3a3a', a: '#a8382c', v: '#ffffff', g: '#141414' },
    black: { s: '#8a5a3a', S: '#5e3a20', t: '#b07a54', h: '#141414', H: '#0a0a0a', j: '#3a3a3a', c: '#3a3a44', C: '#22222a', q: '#5a5a68', d: '#e02828', D: '#a01818', p: '#2a2a32', P: '#16161c', f: '#141414', F: '#0a0a0a', x: '#3a3a3a', a: '#3a3a44', v: '#e02828' },
    robot_pirate: { s: '#8a7a5a', S: '#5a4a34', t: '#c8b890', v: '#ffd030', V: '#a08010', c: '#6a5a40', C: '#44382a', q: '#9a8a68', d: '#c83838', D: '#8a2020', p: '#4a3c2c', P: '#2e2418', f: '#2a2018', F: '#140c08', x: '#4a3a28', a: '#6a5a40' },
    baba: { h: '#e8e8f0', H: '#b0b0c0', j: '#ffffff', c: '#5a2a8a', C: '#3a1a5a', q: '#8a5ab8', d: '#f0c040', D: '#b08820', f: '#3a1a5a', F: '#200c34', x: '#5a3a7a', a: '#5a2a8a', u: '#4a2078', U: '#2a1048' },
    dracula: { s: '#d8d8e8', S: '#a8a8c0', t: '#f0f0f8', h: '#141420', H: '#0a0a10', j: '#3a3a50', c: '#202028', C: '#101014', q: '#3a3a48', d: '#c82838', D: '#8a1822', f: '#141414', F: '#0a0a0a', x: '#3a3a3a', a: '#202028' },
    momie: { s: '#e8dcbc', S: '#b8a888', t: '#fff4dc', h: '#e8dcbc', H: '#b8a888', j: '#fff4dc', c: '#e8dcbc', C: '#b8a888', q: '#fff4dc', d: '#c8b890', D: '#988860', p: '#e8dcbc', P: '#b8a888', f: '#c8b890', F: '#988860', x: '#d8c8a0', a: '#e8dcbc', e: '#e84030' },
    invisible: { k: 'rgba(40,40,80,0.2)', s: null, S: null, t: null, h: null, H: null, j: null, m: null, c: null, C: null, q: null, d: '#e8e8f0', D: '#a8a8b8', p: '#d84848', P: '#982828', f: null, F: null, a: null },
    diable: { s: '#e04848', S: '#a02828', t: '#ff8080', h: '#1a1a24', H: '#0a0a10', j: '#3a3a50', c: '#2a1a3a', C: '#160c22', q: '#4a3a5a', d: '#f0c040', D: '#b08820', f: '#141414', F: '#0a0a0a', x: '#3a3a3a', a: '#2a1a3a', y: '#f0e8d0' },
    gohan_m: { w: '#f2f2f6', W: '#b8b8c8', c: '#5a6a3a', C: '#3a4824', q: '#8a9a60', d: '#c8a060', D: '#8a6a30', f: '#2a1a10', F: '#140a04', a: '#5a6a3a', h: '#8a3a2a', H: '#5a2018', j: '#c06050', v: '#e8e0d0', y: '#f8e060' },
  });
  Object.assign(CHARS, {
    soldat_rr: { head: 'soldier', body: 'tunic', pal: 'soldat_rr', mods: [MODS.logo] },
    general_blanc: { head: 'villM', body: 'tunic', pal: 'general_blanc', mods: [MODS.logo, MODS.moustache] },
    metallique: { head: 'robot', body: 'tunic', pal: 'metallique', mods: [MODS.logo] },
    murasaki: { head: 'villM', body: 'tunic', pal: 'murasaki', mods: [MODS.mask] },
    c8: { head: 'krillin', body: 'tunic', pal: 'c8' },
    suno: { head: 'villF', body: 'dress', pal: 'suno', short: true },
    chef_jingle: { head: 'elder', body: 'robe', pal: 'chef_jingle' },
    villageois_n: { head: 'villM', body: 'tunic', pal: 'villageois_n' },
    senbei: { head: 'villM', body: 'tunic', pal: 'senbei', mods: [MODS.glasses] },
    arale: { head: 'villF', body: 'dress', pal: 'arale', short: true, mods: [MODS.glasses] },
    bleu: { head: 'villM', body: 'tunic', pal: 'bleu', mods: [MODS.logo] },
    tao: { head: 'villM', body: 'tunic', pal: 'tao', mods: [MODS.moustache, MODS.braid] },
    upa: { head: 'villM', body: 'tunic', pal: 'upa', short: true, mods: [MODS.braid] },
    bora: { head: 'villM', body: 'tunic', pal: 'bora', mods: [MODS.braid] },
    rouge: { head: 'villM', body: 'tunic', pal: 'rouge', short: true, mods: [MODS.logo, MODS.patch] },
    black: { head: 'villM', body: 'tunic', pal: 'black', mods: [MODS.logo] },
    robot_pirate: { head: 'robot', body: 'tunic', pal: 'robot_pirate' },
    baba: { head: 'villF', body: 'robe', pal: 'baba', short: true, mods: [MODS.hat] },
    dracula: { head: 'villM', body: 'robe', pal: 'dracula', mods: [MODS.fangs] },
    momie: { head: 'villM', body: 'tunic', pal: 'momie', mods: [MODS.bandages] },
    invisible: { head: 'villM', body: 'tunic', pal: 'invisible', palOver: { l: null, L: null, f: null, F: null, x: null, a: null } },
    diable: { head: 'villM', body: 'robe', pal: 'diable', mods: [MODS.horns] },
    gohan_m: { head: 'gohan', body: 'robe', pal: 'gohan_m', mods: [MODS.gohanMask] },
  });

  // ---------------- Monstres ----------------
  // Buyon : une énorme gelée vivante (dessin généré)
  function blobRows(w, h) {
    const rows = [];
    const cx = w / 2, cy = h * 0.58, rx = w / 2 - 1, ry = h * 0.42;
    const inside = (x, y) => { const dy = (y - cy) / ry, dx = (x - cx) / (rx * (y < cy ? 0.75 + 0.25 * (1 + dy) : 1)); return dx * dx + dy * dy <= 1 && y < h - 1; };
    for (let y = 0; y < h; y++) {
      let r = '';
      for (let x = 0; x < w; x++) {
        if (!inside(x + 0.5, y + 0.5)) { r += (inside(x - 0.5, y + 0.5) || inside(x + 1.5, y + 0.5) || inside(x + 0.5, y - 0.5) || inside(x + 0.5, y + 1.5)) ? 'k' : '.'; continue; }
        const ex = Math.abs(x - (cx - 7)) <= 2 || Math.abs(x - (cx + 2)) <= 2;
        if (y >= h * 0.4 && y <= h * 0.4 + 4 && ex) r += (y === Math.round(h * 0.4) + 2 && (x === Math.round(cx - 8) || x === Math.round(cx + 1))) ? 'e' : 'w';
        else if (y === Math.round(h * 0.68) && x > cx - 9 && x < cx + 4) r += 'm';
        else if ((x - cx * 0.6) ** 2 / 20 + (y - h * 0.3) ** 2 / 6 < 1) r += 'y';
        else r += (x > cx + rx * 0.4 || y > cy + ry * 0.55) ? 'G' : 'g';
      }
      rows.push(r);
    }
    return rows;
  }
  Object.assign(MONSTERS, {
    loup_neige: { pal: { g: '#e8eef8', G: '#a8b4cc', w: '#ffffff', W: '#c8d0e0', r: '#40a0ff', t: '#ffffff' }, rows: MONSTERS.loup.rows },
    ours_polaire: { pal: { b: '#eef0f4', B: '#b0b6c6', y: '#ffffff', w: '#ffffff', r: '#3a6ad8', c: '#c84848', C: '#8a2a2a', d: '#3a2a20', m: '#e0e0f0', M: '#9090a8', h: '#8a8a98' }, rows: MONSTERS.ours.rows },
    buyon: { pal: { g: '#c860c8', G: '#8a3a90', y: '#f0a8f0', w: '#ffffff', e: '#181030', m: '#5a1a5a' }, rows: blobRows(44, 34) },
    buyon_gel: { pal: { g: '#a8d8f8', G: '#6898c8', y: '#ffffff', w: '#e8f8ff', e: '#183050', m: '#3a6a98' }, rows: blobRows(44, 34) },
    karine: { pal: { b: '#f4f4f8', B: '#b8b8c8', w: '#ffffff', e: '#181030', m: '#d06070', c: '#8a5a30' }, rows: MONSTERS.puar.rows.map((r, i) => (i >= 4 && i <= 17 ? '.c.' : '...') + r) },
    pingouin: { pal: { b: '#283050', B: '#141a30', w: '#ffffff', y: '#f0a020', e: '#181030' }, rows: [
      '...kkkkk....', '..kbbbbbk...', '.kbwbbwbbk..', '.kbebbebbk..', '.kbbyybbbk..', 'kbbwwwwbbbk.', 'kbwwwwwwbbk.',
      'kbwwwwwwbbkk', 'kbwwwwwwbbk.', '.kwwwwwwbk..', '..kwwwwbk...', '..kyk.kyk...', '.kyyk.kyyk..', '.kkk...kkk..'] },
    armure: { pal: { m: '#3a4a6a', M: '#222a40', y: '#d8d8e0', Y: '#9898a8', r: '#ff3030', c: '#d82828', w: '#e8f0ff', s: '#8a5a3a', e: '#181030' }, rows: MONSTERS.machine.rows },
    crabe_abysses: { pal: { r: '#3a7ad8', R: '#1e4a98', w: '#ffffff', e: '#181020', y: '#90c8ff' }, rows: MONSTERS.crabe.rows },
    murene: { pal: { g: '#3a9a8a', G: '#1e5a50', y: '#c8f0d8', r: '#ffe040', t: '#ff4060' }, rows: MONSTERS.serpent.rows },
  });

  // ---------------- Ennemis de l'arc ----------------
  Object.assign(ENEMIES, {
    soldat_rr: { name: 'Soldat du Ruban Rouge', char: 'soldat_rr', hp: 380, atk: 62, def: 30, spd: 16, xp: 130, zeni: 70, drop: ['super_tonique', 0.15], skills: [{ name: 'Rafale de Mitraillette', target: 'all', pow: 0.6, chance: 0.2 }] },
    loup_neige: { name: 'Loup des Neiges', spr: 'loup_neige', hp: 330, atk: 60, def: 24, spd: 22, xp: 118, zeni: 36, drops: [['viande', 0.3]], skills: [{ name: 'Morsure Glacée', target: 'one', pow: 1.2, chance: 0.22, st: 'stun', sc: 0.2 }] },
    ours_polaire: { name: 'Ours Brigand des Neiges', spr: 'ours_polaire', hp: 540, atk: 66, def: 32, spd: 10, xp: 160, zeni: 50, drops: [['viande', 0.45]], skills: [{ name: 'Étreinte Glacée', target: 'one', pow: 1.6, chance: 0.25 }] },
    metallique: { res: { phys: 0.7, ki: 1.25 }, immune: ['poison', 'sleep'], name: 'Sergent Métallique', char: 'metallique', hp: 2400, atk: 66, def: 40, spd: 12, xp: 900, zeni: 400, boss: true,
      skills: [{ name: 'Poing Blindé', target: 'one', pow: 1.8, chance: 0.3 }, { name: 'Charge Métallique', target: 'all', pow: 1.0, chance: 0.2 }] },
    murasaki: { name: 'Ninja Murasaki', char: 'murasaki', hp: 1500, atk: 64, def: 26, spd: 26, xp: 600, zeni: 250, boss: true,
      skills: [{ name: 'Pluie de Shurikens', target: 'one', pow: 0.5, hits: 3, chance: 0.3 }, { name: 'Bombe Fumigène', target: 'all', pow: 0.6, chance: 0.2, st: 'stun', sc: 0.35 }] },
    murasaki_c: { name: 'Frère Murasaki', char: 'murasaki', hp: 650, atk: 58, def: 22, spd: 24, xp: 220, zeni: 80, skills: [{ name: 'Shuriken', target: 'one', pow: 1.1, chance: 0.25 }] },
    buyon: { res: { phys: 0.15, ki: 0.7 }, immune: ['poison', 'sleep', 'stun'], name: 'Buyon', spr: 'buyon', hp: 3000, atk: 68, def: 30, spd: 8, xp: 0, zeni: 0, boss: true, big: true, yieldAt: 0.6, yieldMsg: 'Les coups rebondissent sur Buyon !',
      skills: [{ name: 'Écrasement Gluant', target: 'one', pow: 1.6, chance: 0.3, st: 'stun', sc: 0.3 }, { name: 'Vague de Gelée', target: 'all', pow: 0.9, chance: 0.2 }] },
    buyon_gel: { res: { phys: 2.2, ki: 1.3 }, immune: ['poison', 'sleep', 'burn'], name: 'Buyon (gelé)', spr: 'buyon_gel', hp: 3000, atk: 40, def: 20, spd: 3, xp: 1200, zeni: 500, boss: true, big: true },
    general_blanc: { name: 'Général Blanc', char: 'general_blanc', hp: 3600, atk: 70, def: 34, spd: 18, xp: 1500, zeni: 800, boss: true,
      skills: [{ name: 'Coup de Pied Retourné', target: 'one', pow: 1.7, chance: 0.25 }, { name: 'Rafale du Général', target: 'one', pow: 0.55, hits: 4, chance: 0.2 }, { name: 'Pistolet', target: 'all', pow: 0.7, chance: 0.15 }] },
    arale: { name: 'Arale', char: 'arale', hp: 2600, atk: 74, def: 60, spd: 34, xp: 900, zeni: 0, boss: true, yieldAt: 0.7, yieldMsg: 'Arale : « Hihi ! T\'es drôlement fort ! »',
      skills: [{ name: 'N\'cha Punch', target: 'one', pow: 2.0, chance: 0.25 }, { name: 'Course Supersonique', target: 'all', pow: 1.0, chance: 0.2 }, { name: 'Coup de Tête', target: 'one', pow: 1.4, chance: 0.2, st: 'stun', sc: 0.4 }] },
  });
  Object.assign(GEAR, {
    echarpe: { slot: 'acc', name: 'Écharpe de Suno', desc: 'Tricotée par Suno : chaude et douce. PV +30, Défense +4, et on ne craint plus le sommeil ni la paralysie.', stats: { hp: 30, def: 4 }, fx: 'awake', price: 0 },
    lunettes: { slot: 'acc', name: 'Lunettes de Senbei', desc: 'Une invention du professeur : Puissance +6, Vitesse +2, et la jauge se remplit 15 % plus vite.', stats: { mag: 6, spd: 2 }, fx: 'atb', price: 0 },
  });

  // C-8, l'androïde au grand cœur, se bat aux côtés de Goku dans la Tour Muscle
  Object.assign(MEMBERS, {
    c8: {
      name: 'C-8', sprite: 'c8',
      base: { hp: 96, ki: 10, atk: 15, def: 13, mag: 8, spd: 8 },
      grow: { hp: 17, ki: 1.6, atk: 3.3, def: 2.2, mag: 1.6, spd: 0.45 },
      techs: [['poing_acier', 1], ['rafale_c8', 1]],
    },
  });
  Object.assign(TECHS, {
    poing_acier: { name: 'Poing d\'Acier', ki: 4, target: 'enemy', kind: 'phys', pow: 2.5, anim: 'strike', desc: 'C-8 frappe de toute sa force.' },
    rafale_c8: { name: 'Rafale de C-8', ki: 6, target: 'enemy', kind: 'multi', pow: 0.85, hits: 4, anim: 'multi', desc: 'Quatre énormes coups de poing.' },
  });

  QUESTS.ruban = {
    title: 'L\'armée du Ruban Rouge', main: true,
    steps: {
      retour: 'Rentrer à la Kame House : Bulma a quelque chose à annoncer.',
      radar: 'Le radar indique une boule tout au nord, dans les neiges. Voyager en Kinto\'un jusqu\'au village Jingle.',
      jingle: 'Le Ruban Rouge occupe le village Jingle. Grimper la Tour Muscle, au nord du village, et vaincre le général Blanc.',
      radarcasse: 'C-8 a écrasé le radar en serrant Goku dans ses bras ! Le faire réparer au village Pingouin, à l\'est.',
      pingouin: 'Le professeur Senbei veut bien réparer le radar... mais Arale est partie avec son tournevis. La retrouver dans le village.',
      pirates: 'Le radar indique une boule sous la mer, à la Côte des Pirates, au sud-ouest.',
      grotte: 'Explorer la grotte des pirates et trouver la boule avant le général Bleu.',
      karine: 'Le radar indique la Terre sacrée de Karine. Upa et son père Bora y gardent une boule.',
      tour: 'Tao Paï Paï est trop fort... Grimper la Tour de Karine pour devenir plus fort.',
      revanche: 'Redescendre de la tour et prendre sa revanche sur Tao Paï Paï.',
      qg: 'Le Ruban Rouge détient deux boules. Assaut final sur leur quartier général, au nord-est !',
      baba: 'La boule à quatre étoiles est chez Baba la voyante, à l\'ouest. Vaincre ses cinq combattants.',
      voeu: 'Les sept boules sont réunies ! Invoquer Shenron pour ramener Bora à la vie.',
      done: 'L\'armée du Ruban Rouge est vaincue et Bora est revenu. Goku a revu son grand-père.',
    },
  };
  if (UI.SPEAKERS) Object.assign(UI.SPEAKERS, {
    'Soldat du Ruban Rouge': 'soldat_rr', 'Général Blanc': 'general_blanc', 'Sergent Métallique': 'metallique', 'Ninja Murasaki': 'murasaki', 'C-8': 'c8',
    'Suno': 'suno', 'Chef de Jingle': 'chef_jingle', 'Villageois de Jingle': 'villageois_n', 'Professeur Senbei': 'senbei', 'Arale': 'arale',
    'Général Bleu': 'bleu', 'Tao Paï Paï': 'tao', 'Upa': 'upa', 'Bora': 'bora', 'Commandant Red': 'rouge', 'Officier Black': 'black',
    'Robot Pirate': 'robot_pirate', 'Baba': 'baba', 'Dracula Man': 'dracula', 'La Momie': 'momie', 'L\'Homme Invisible': 'invisible', 'Akkuman': 'diable',
    'Combattant masqué': 'gohan_m', 'Buyon': 'mon:buyon', 'Karine': 'mon:karine', 'Pingouin': 'mon:pingouin',
  });

  // ---------------- Les boules de l'arc (le Dragon Radar les suit à part) ----------------
  const BALL_ORDER = [6, 2, 7, 5, 1, 3, 4];
  const RB_HINTS = { 6: 'Tour Muscle (village Jingle)', 2: 'Village Pingouin', 7: 'Grotte des pirates', 5: 'Terre sacrée de Karine', 1: 'QG du Ruban Rouge', 3: 'QG du Ruban Rouge', 4: 'Palais de Baba la voyante' };
  const rballs = () => (Game.extra.rb = Game.extra.rb || []);
  async function rball(n) {
    if (!rballs().includes(n)) { rballs().push(n); rballs().sort(); }
    SND.sfx('ball');
    await UI.say(null, 'Boule de Cristal à ' + n + ' étoile' + (n > 1 ? 's' : '') + ' obtenue ! (' + rballs().length + '/7)');
  }
  function radar() { return Game.flags.ch9 ? { balls: rballs(), order: BALL_ORDER, hints: RB_HINTS } : null; }

  // ---------------- Petits outils de mise en scène ----------------
  const say = (w, t) => UI.say(w, t);
  const ask = (w, t, c, o) => UI.ask(w, t, c, o);
  const L = () => Field.leader();
  const has = id => !!Game.member(id);
  async function fadeLoad(map, tx, ty, dir) { await UI.fadeTo(1, 20); Field.load(map, tx, ty, dir); await UI.fadeTo(0, 20); }
  function healParty(f) { for (const m of Game.party) if (m.hp > 0) m.hp = Math.min(m.maxhp, m.hp + Math.round(m.maxhp * f)); }
  function hurtParty(f) { for (const m of Game.party) if (m.hp > 1) m.hp = Math.max(1, m.hp - Math.round(m.maxhp * f)); }
  // pièges : piques qui sortent du sol à intervalles réguliers
  function spikes(id, tx, ty, period = 120, phase = 0) {
    return { kind: 'npc', id, tx, ty, turn: false, solid: false, spike: { period, phase }, sortOff: -40, get img() { return spikeImg(this.up); } };
  }
  const spikeCache = {};
  function spikeImg(up) {
    const k = up ? 1 : 0;
    if (spikeCache[k]) return spikeCache[k];
    const c = GFX.mk(16, 12), x = c.getContext('2d');
    x.fillStyle = '#2a2430'; x.fillRect(0, 4, 16, 8); x.fillStyle = '#4a4250'; x.fillRect(1, 5, 14, 6);
    for (let i = 0; i < 4; i++) {
      if (up) { x.fillStyle = K; x.fillRect(1 + i * 4, 0, 3, 9); x.fillStyle = '#d8d8e8'; x.fillRect(2 + i * 4, 0, 1, 8); }
      else { x.fillStyle = '#1a1420'; x.fillRect(2 + i * 4, 7, 1, 2); }
    }
    return (spikeCache[k] = c);
  }
  let trapCool = 0;
  function updateTraps() { // à appeler depuis map.update
    const Lx = L();
    if (!Lx) return;
    if (trapCool > 0) trapCool--;
    for (const e of Field.entities) {
      if (!e.spike || e.gone) continue;
      const t = (Game.frame + e.spike.phase) % e.spike.period;
      e.up = t < e.spike.period * 0.4;
      if (e.up && !trapCool && Math.abs(Lx.x - e.x) < 9 && Math.abs(Lx.y - e.y) < 8) {
        trapCool = 50; hurtParty(0.08); SND.sfx('hit'); Game.shake = 6;
        Field.effects.push({ type: 'text', x: Lx.x, y: Lx.y - 40, str: 'Aïe !', c: '#ff8060', life: 40 });
      }
    }
  }
  // bâtiments dessinés pour l'arc (créés à la première visite)
  const BUILD = {};
  function building(name) {
    if (GFX.tiles.buildings[name]) return;
    GFX.tiles.buildings[name] = BUILD[name]();
  }
  BUILD.muscle = () => { // la Tour Muscle : briques rouges, fenêtres et drapeau du Ruban Rouge
    const w = 96, h = 150, c = GFX.mk(w, h), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(6, 10, w - 12, h - 10);
    x.fillStyle = '#b84030'; x.fillRect(7, 11, w - 14, h - 12);
    for (let y = 14; y < h - 4; y += 6) for (let i = 0; i < 12; i++) { x.fillStyle = (i + y / 6) % 2 ? '#a03828' : '#c84838'; x.fillRect(8 + i * 7 + ((y / 6) % 2) * 3, y, 6, 4); }
    for (let f = 0; f < 5; f++) { const y = 18 + f * 24; for (const wx of [20, 44, 66]) { x.fillStyle = K; x.fillRect(wx, y, 10, 10); x.fillStyle = f % 2 ? '#f0d878' : '#5878a8'; x.fillRect(wx + 1, y + 1, 8, 8); } x.fillStyle = '#5a1810'; x.fillRect(7, y + 16, w - 14, 2); }
    x.fillStyle = K; x.fillRect(2, 4, w - 4, 8); x.fillStyle = '#e8e0d8'; x.fillRect(3, 5, w - 6, 6);
    x.fillStyle = K; x.fillRect(w / 2 - 1, 0, 2, 6); x.fillStyle = '#e02828'; x.fillRect(w / 2 + 1, 0, 10, 4);
    x.fillStyle = K; x.fillRect(36, h - 26, 24, 26); x.fillStyle = '#3a2418'; x.fillRect(37, h - 25, 22, 25); x.fillStyle = '#5a3a24'; x.fillRect(47, h - 25, 2, 25);
    x.fillStyle = '#e02828'; x.fillRect(30, h - 36, 36, 6); x.fillStyle = '#ffffff'; x.fillRect(42, h - 35, 12, 4);
    return c;
  };

  // =====================================================================
  // CHAPITRE 9 : le village Jingle et la Tour Muscle
  // =====================================================================
  MAPS.jingle = {
    name: 'Village Jingle', music: 'village', ground: 'g', snow: true, cliffTint: { a: '#9aa4b8', b: '#7a8498', c: '#5a6478', d: '#c8d0e0', top: '#f4f8ff', top2: '#c8d4e8' },
    rows: [
      'nnnnnnnnnnnnXXXXXXnnnnnnnnnnnn',
      'nnnnnnnnnnnnXXXXXXnnnnnnnnnnnn',
      'nnnn.....nnnXXXXXXnnn.....nnnn',
      'nnn.......nnXXXXXXnn.......nnn',
      'nn.....r...nXXXXXXn...r.....nn',
      'nn.........nXXXXXXn.........nn',
      'nn............pp............nn',
      'n.............pp.............n',
      'n...n.........pp.........n...n',
      'n.###.........pp........###..n',
      'n.###.........pp........###..n',
      'n.............pp.............n',
      'n....pppppppppppppppppppp....n',
      'n.....n.......pp.......n.....n',
      'nn............pp............nn',
      'nn..###.......pp.......###..nn',
      'nn..###.......pp.......###..nn',
      'nn............pp............nn',
      'nnn....r......pp......r....nnn',
      'nnn...........pp...........nnn',
      'nnnn..........pp..........nnnn',
      'nnnnn.........pp.........nnnnn',
      'nnnnnnn.......pp.......nnnnnnn',
      'nnnnnnnnnnnnnnppnnnnnnnnnnnnnn',
    ],
    patch() { building('muscle'); },
    hud: () => { // flocons de neige
      for (let i = 0; i < 40; i++) {
        const sp = 0.3 + (i % 4) * 0.15, x = (GFX.hash(i, 7) % SW + Math.sin(Game.frame * 0.02 + i) * 12 + SW) % SW, y = (GFX.hash(i, 8) % SH + Game.frame * sp) % SH;
        ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.85)' : 'rgba(220,232,255,0.7)'; ctx.fillRect(Math.round(x), Math.round(y), i % 5 ? 1 : 2, i % 5 ? 1 : 2);
      }
    },
    objects: [
      { type: 'building', img: 'muscle', x: 12 * TS, y: 6 * TS - 150, sortY: 6 * TS - 4 },
      { type: 'building', img: 'domeN', x: 2 * TS - 4, y: 9 * TS - 18 },
      { type: 'building', img: 'domeR', x: 24 * TS - 4, y: 9 * TS - 18 },
      { type: 'building', img: 'domeN', x: 4 * TS - 4, y: 15 * TS - 18 },
      { type: 'building', img: 'domeJ', x: 23 * TS - 4, y: 15 * TS - 18 },
    ],
    entities: () => [
      warp(14, 23, 2, 1, 'jingle', 14.5, 21, 'up'), // pas de sortie à pied : on repart en Kinto'un
      warp(14, 6, 2, 1, 'muscle1', 7.5, 10, 'up'),
      savePt(17, 12),
      npc('suno', 'suno', 4, 11, sunoTalk, { dir: 'down' }),
      npc('chef_jingle', 'chef_jingle', 25, 11, chefTalk, { dir: 'down' }),
      npc('villageois_n', 'villageois_n', 7, 17, () => say('Villageois de Jingle', Game.flags.blancDone ? 'Le Ruban Rouge est parti ! On va enfin pouvoir fêter l\'hiver comme avant !' : 'Les soldats du Ruban Rouge fouillent la neige jour et nuit... Ils cherchent une boule de cristal.'), { wander: true }),
      npc('c8_village', 'c8', 18, 9, c8Village, { cond: () => !!Game.flags.blancDone && !Game.member('c8'), dir: 'down' }),
      { kind: 'trigger', tx: 13, ty: 7, tw: 4, th: 1, cond: () => !Game.flags.jingleTalk, run: async () => { await say('Goku', 'Il faudrait d\'abord parler aux gens du village...'); await Field.walkTo(L(), L().x, L().y + 14, 1.2); } },
      foe(7, 5, ['soldat_rr', 'soldat_rr']),
      foe(22, 5, ['loup_neige', 'loup_neige']),
      foe(20, 19, ['ours_polaire']),
      foe(9, 20, ['soldat_rr', 'loup_neige']),
      chest('jingle1', 26, 17, 'super_tonique', 2),
      chest('jingle2', 3, 17, 'boisson_ki', 2),
    ],
    async onEnter() {
      if (Game.flags.jingleIntro) return;
      Game.flags.jingleIntro = true;
      await Field.run(async () => {
        SND.sfx('thunder');
        await say(null, 'Une tempête de neige souffle sur le grand Nord...');
        await say('Goku', 'Brrr ! Il fait drôlement froid, ici ! J\'aurais dû mettre un pull...');
        if (has('bulma')) await say('Bulma', 'Je te l\'avais dit ! Moi, j\'ai pris ma capsule-manteau. Hi hi.');
        const s = Field.ent('suno');
        await Field.walkTo(s, L().x - 18, L().y, 1.6);
        s.dir = 'right';
        await say('Suno', 'Oh ! Mais tu vas geler, habillé comme ça ! Je m\'appelle Suno. Viens vite te réchauffer au village !');
        await say('Goku', 'Merci ! Moi, c\'est Goku. Je cherche une boule de cristal... Le radar dit qu\'elle est par ici.');
        await say('Suno', 'Une boule de cristal ? Chut ! L\'armée du Ruban Rouge en cherche une aussi. Ils ont pris la Tour Muscle et ils nous obligent à creuser la neige pour eux...');
        await say('Suno', 'Mon papa... ils l\'ont emmené dans la tour. Va parler au chef du village, il t\'expliquera.');
        await Field.walkTo(s, 4 * TS + 8, 11 * TS + 14, 1.6);
        s.dir = 'down';
      });
    },
  };
  async function sunoTalk() {
    if (Game.flags.blancDone) { await say('Suno', 'Papa est rentré ! Merci, Goku... Et C-8 est si gentil : il m\'aide à porter le bois !'); return; }
    if (!Game.flags.echarpe) {
      Game.flags.echarpe = true;
      await say('Suno', 'Tiens, prends mon écharpe. Je l\'ai tricotée moi-même ! Comme ça, tu n\'auras plus froid.');
      await getItem('echarpe');
      return;
    }
    await say('Suno', 'Fais attention dans la tour... On dit que chaque étage est gardé par un monstre !');
  }
  async function chefTalk() {
    if (Game.flags.blancDone) { await say('Chef de Jingle', 'Le village Jingle te doit tout, mon garçon. Reviens quand tu veux !'); return; }
    Game.flags.jingleTalk = true;
    await say('Chef de Jingle', 'Le Ruban Rouge, c\'est une armée de bandits. Leur général Blanc s\'est installé en haut de la Tour Muscle, avec un monstre à chaque étage.');
    await say('Chef de Jingle', 'Ils ont emmené le papa de Suno pour l\'obliger à trouver la boule de cristal. Si seulement quelqu\'un pouvait les chasser...');
    await say('Goku', 'Je vais grimper cette tour et leur mettre une raclée ! Et je ramènerai le papa de Suno !');
    if (Game.quests.ruban !== 'jingle') Game.setQuest('ruban', 'jingle');
  }
  async function c8Village() {
    await say('C-8', 'Goku ! Je reste ici, avec Suno et les gens de Jingle. Ils m\'ont appelé « Hachan ». C\'est joli, non ?');
  }

  // --- Les étages de la Tour Muscle ---
  function floorRows(variant) {
    const r = [
      'XXXXXXXXXXXXXXXX',
      'XXXXXXXccXXXXXXX',
      'XXccccccccccccXX',
      'XXcIccccccccIcXX',
      'XXccccccccccccXX',
      'XXccccccccccccXX',
      'XXccccccccccccXX',
      'XXccccccccccccXX',
      'XXccccccccccccXX',
      'XXcIccccccccIcXX',
      'XXccccccccccccXX',
      'XXXXXXXccXXXXXXX',
      'XXXXXXXccXXXXXXX',
    ];
    if (variant === 'top') r[1] = 'XXXXXXXXXXXXXXXX';
    return r;
  }
  function steelDoor(flag) { // la porte de l'escalier s'ouvre quand le gardien est vaincu
    return { kind: 'npc', id: 'porte_' + flag, x: 8 * TS, y: 1 * TS + 14, turn: false, box: [-16, -14, 32, 16], cond: () => !Game.flags[flag], get img() { return doorImg(); },
      talk: () => say(null, 'Une lourde porte d\'acier. Elle ne s\'ouvrira pas tant que le gardien de l\'étage sera debout.') };
  }
  let doorC = null;
  function doorImg() {
    if (doorC) return doorC;
    const c = GFX.mk(32, 26), x = c.getContext('2d');
    x.fillStyle = K; x.fillRect(0, 0, 32, 26); x.fillStyle = '#7a8090'; x.fillRect(1, 1, 30, 24);
    x.fillStyle = '#9aa0b0'; x.fillRect(1, 1, 30, 3); x.fillStyle = '#505868'; x.fillRect(15, 4, 2, 21);
    for (const yy of [8, 16]) { x.fillStyle = '#5a6070'; x.fillRect(3, yy, 26, 2); }
    x.fillStyle = '#e02828'; x.fillRect(12, 10, 8, 4); x.fillStyle = '#fff'; x.fillRect(14, 11, 4, 2);
    return (doorC = c);
  }
  function openDoor(flag) { Game.flags[flag] = true; const d = Field.ent('porte_' + flag); if (d) { Field.effects.push({ type: 'smoke', x: d.x, y: d.y - 8, t: 30 }); d.gone = true; } SND.sfx('door'); }
  const floorObjs = [{ type: 'prop', img: 'torch', x: 5 * TS, y: 1 * TS }, { type: 'prop', img: 'torch', x: 10 * TS, y: 1 * TS }];
  const towerName = n => 'Tour Muscle — ' + (n === 1 ? '1er' : n + 'e') + ' étage';

  MAPS.muscle1 = {
    name: towerName(1), music: 'castle', ground: 'c', rows: floorRows(), objects: floorObjs,
    entities: () => [
      warp(7, 12, 2, 1, 'jingle', 14.5, 7.5, 'down'),
      warp(7, 1, 2, 1, 'muscle2', 7.5, 10, 'up'),
      steelDoor('metalDone'),
      npc('metallique', 'metallique', 7.5, 4, metalEvent, { cond: () => !Game.flags.metalDone }),
      foe(4, 7, ['soldat_rr', 'soldat_rr']),
      foe(11, 6, ['soldat_rr']),
      chest('muscle1', 13, 10, 'super_tonique', 2),
    ],
    async onEnter() { await Field.run(() => chapterCard('ch9tour', 'La Tour Muscle', 'Cinq étages, cinq gardiens')); },
  };
  async function metalEvent(e) {
    await Field.run(async () => {
      await say('Sergent Métallique', 'HALTE. INTRUS DÉTECTÉ. LE SERGENT MÉTALLIQUE NE LAISSE PASSER PERSONNE.');
      await say('Goku', 'Tu parles bizarrement, toi... T\'as mal à la gorge ?');
      e.visible = false;
      await Battle.start(['metallique'], { positions: [[e.x, e.y]], music: 'boss' });
      e.gone = true;
      SND.sfx('blast'); Game.shake = 10;
      Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 10, t: 40 });
      await say(null, 'Pof ! La tête du sergent saute dans un nuage d\'étincelles... C\'était un robot !');
      await say('Goku', 'Un robot ?! Pas étonnant qu\'il avait la peau si dure !');
      openDoor('metalDone');
    });
  }

  MAPS.muscle2 = {
    name: towerName(2), music: 'castle', ground: 'c', rows: floorRows(), objects: floorObjs,
    entities: () => [
      warp(7, 12, 2, 1, 'muscle1', 7.5, 2, 'down'),
      warp(7, 1, 2, 1, 'muscle3', 7.5, 10, 'up'),
      steelDoor('murasakiDone'),
      ...[[4, 5], [11, 5], [4, 8], [11, 8]].map(([tx, ty], i) => ({ kind: 'npc', id: 'cachette' + i, tx, ty, turn: false, cond: () => !Game.flags.murasakiDone, get img() { return GFX.tiles.props.pot; }, talk: () => potTalk(i) })),
      chest('muscle2', 2, 10, 'boisson_ki', 3),
    ],
    async onEnter() {
      if (Game.flags.murasakiIntro || Game.flags.murasakiDone) return;
      Game.flags.murasakiIntro = true;
      await Field.run(async () => {
        await say('Ninja Murasaki', 'Hé hé hé... Je suis le ninja Murasaki ! Trouve-moi si tu peux... Je me suis caché dans l\'une de ces jarres !');
        await say('Goku', 'Une partie de cache-cache ? Super !');
      });
    },
  };
  async function potTalk(i) {
    await Field.run(async () => {
      if (Game.flags.murasakiPot === undefined) Game.flags.murasakiPot = Math.floor(Math.random() * 4);
      if (i !== Game.flags.murasakiPot) {
        SND.sfx('swing'); hurtParty(0.06);
        await say('Ninja Murasaki', 'Raté ! Prends ça : shuriken ! Hé hé hé !');
        Game.flags.murasakiPot = [0, 1, 2, 3].filter(k => k !== i)[Math.floor(Math.random() * 3)]; // il change de cachette !
        return;
      }
      const pot = Field.ent('cachette' + i);
      SND.sfx('door');
      Field.effects.push({ type: 'smoke', x: pot.x, y: pot.y - 8, t: 30 });
      await say('Ninja Murasaki', 'Gloups ! Tu m\'as trouvé ?! Peu importe... Frères Murasaki, à l\'attaque !');
      await say(null, 'Deux autres ninjas tout à fait identiques tombent du plafond !');
      await Battle.start(['murasaki', 'murasaki_c', 'murasaki_c'], { positions: [[pot.x, pot.y]], music: 'boss' });
      Game.flags.murasakiDone = true;
      for (let k = 0; k < 4; k++) { const p = Field.ent('cachette' + k); if (p) p.gone = true; }
      await say('Ninja Murasaki', 'Aïe aïe aïe... Vous êtes trop forts. On abandonne ! Mais au 3e étage vous attend C-8, le monstre de Frankenstein... Hé hé...');
      openDoor('murasakiDone');
    });
  }

  MAPS.muscle3 = {
    name: towerName(3), music: 'castle', ground: 'c', rows: floorRows(), objects: floorObjs,
    entities: () => [
      warp(7, 12, 2, 1, 'muscle2', 7.5, 2, 'down'),
      warp(7, 1, 2, 1, 'muscle4', 7.5, 10, 'up'),
      steelDoor('c8Done'),
      npc('c8', 'c8', 7.5, 4, c8Event, { cond: () => !Game.flags.c8Done }),
      chest('muscle3', 13, 4, 'capsule_vie'),
    ],
  };
  async function c8Event(e) {
    await Field.run(async () => {
      Game.shake = 6; SND.sfx('roar');
      await say(null, 'Un géant aux boulons dans le cou se dresse devant l\'escalier...');
      await say('Général Blanc', '(par haut-parleur) C-8 ! Écrase ce gamin ! C\'est un ordre !');
      await say('C-8', '... Non. Je n\'aime pas me battre. Je ne veux faire de mal à personne.');
      await say('Général Blanc', 'Espèce de tas de ferraille inutile ! Je vais appuyer sur le bouton de ta bombe !');
      await say('Goku', 'Hé ! Laisse-le tranquille ! ... T\'es pas un monstre, toi. T\'es gentil. On devient amis ?');
      Field.emote(e, '!');
      await say('C-8', 'Des... amis ? Personne ne m\'a jamais dit ça. Je viens avec toi, Goku ! Je connais un passage vers le haut.');
      Game.flags.c8Done = true;
      Game.setQuest('ruban', 'jingle', true);
      await joinParty('c8', e);
      openDoor('c8Done');
    });
  }

  MAPS.muscle4 = {
    name: towerName(4), music: 'castle', ground: 'c', rows: floorRows(), objects: floorObjs,
    entities: () => [
      warp(7, 12, 2, 1, 'muscle3', 7.5, 2, 'down'),
      warp(7, 1, 2, 1, 'muscle5', 7.5, 10, 'up'),
      steelDoor('buyonDone'),
      { kind: 'trigger', tx: 5, ty: 6, tw: 6, th: 2, cond: () => !Game.flags.buyonDone, run: trapdoor },
      chest('muscle4', 2, 3, 'super_tonique', 3),
    ],
  };
  async function trapdoor() {
    await say('Général Blanc', '(par haut-parleur) Hé hé hé... Bienvenue au 4e étage. Et... AU REVOIR !');
    SND.sfx('door'); Game.shake = 10;
    await say(null, 'Le sol s\'ouvre sous les pieds de l\'équipe !');
    SND.sfx('jump');
    await UI.fadeTo(1, 16);
    Field.load('fosse', 9.5, 4, 'down');
    await UI.fadeTo(0, 16);
    Game.shake = 12; SND.sfx('bighit');
    await say('Goku', 'Ouille ouille... On est tombés au sous-sol ! Il fait un froid de canard, ici.');
    const b = Field.ent('buyon');
    Game.shake = 8; SND.sfx('roar');
    Field.emote(L(), '!');
    await say(null, 'Une énorme masse rose et tremblotante surgit de l\'ombre... C\'est Buyon !');
    b.visible = false;
    await Battle.start(['buyon'], { positions: [[b.x, b.y]], music: 'boss', canFlee: false });
    await say('Goku', 'Mes coups rebondissent sur lui... C\'est comme frapper dans de la gelée !');
    if (has('c8')) await say('C-8', 'Goku ! Le mur ! Derrière le mur, il y a le froid du dehors !');
    else await say('Goku', '... Mais oui ! Ce mur donne sur l\'extérieur. Et dehors, il fait moins quarante !');
    await say('Goku', 'Haaa... HAAA !');
    SND.sfx('bighit'); Game.shake = 20;
    UI.fade.color = '#ffffff'; UI.fade.v = 0.8; UI.fadeTo(0, 30).then(() => { UI.fade.color = '#000'; });
    await say(null, 'Goku pulvérise le mur ! Un vent glacial s\'engouffre... et Buyon se met à geler !');
    await Battle.start(['buyon_gel'], { positions: [[b.x, b.y]], music: 'boss', canFlee: false, hp: { enemy: 0.6 } });
    b.gone = true;
    Game.flags.buyonDone = true;
    SND.sfx('blast');
    await say(null, 'Buyon, gelé de la tête aux pieds, éclate en mille glaçons !');
    await say('Goku', 'Bon débarras ! Il y a une échelle là-bas, on remonte.');
  }
  MAPS.fosse = {
    name: 'Fosse de Buyon', music: 'volcano', ground: 'c', snow: true, cliffTint: { a: '#8a94a8', b: '#6a7488', c: '#4a5468', d: '#b8c0d0', top: '#e8eef8', top2: '#b8c4d8' },
    rows: [
      'CCCCCCCCCCCCCCCCCCC',
      'CCCCCCCCCCCCCCCCCCC',
      'CCccccccccccccccCCC',
      'CCccccccccccccccCCC',
      'CCccccccccccccccCCC',
      'CCccccccccccccccCCC',
      'CCccccccccccccccCCC',
      'CCccccccccccccccCCC',
      'CCCCCCCCCCCCCCCCCCC',
    ],
    entities: () => [
      { kind: 'npc', id: 'buyon', tx: 9, ty: 6, mon: 'buyon', turn: false, cond: () => !Game.flags.buyonDone, talk: null },
      warp(15, 2, 1, 1, 'muscle4', 7.5, 3, 'up'),
      sign(14, 3, 'Une vieille échelle remonte vers le 4e étage.'),
    ],
  };

  MAPS.muscle5 = {
    name: towerName(5), music: 'castle', ground: 'm', rows: floorRows('top'), objects: floorObjs.concat([{ type: 'prop', img: 'throne', x: 7 * TS - 4, y: 2 * TS - 6 }]),
    entities: () => [
      warp(7, 12, 2, 1, 'muscle4', 7.5, 2, 'down'),
      npc('general_blanc', 'general_blanc', 7.5, 4, blancEvent, { cond: () => !Game.flags.blancDone }),
      npc('papa_suno', 'villageois_n', 11, 3, null, { cond: () => !Game.flags.blancDone, dir: 'left' }),
    ],
  };
  async function blancEvent(e) {
    await Field.run(async () => {
      await say('Général Blanc', 'Alors c\'est toi, le gamin qui a battu tous mes gardiens ? Et toi, C-8, espèce de traître !');
      await say('Goku', 'Rends le papa de Suno, et quitte ce village !');
      await say('Général Blanc', 'Ha ! Personne ne donne d\'ordres au général Blanc ! Garde, à moi !');
      e.visible = false;
      await Battle.start(['general_blanc', 'soldat_rr'], { positions: [[e.x, e.y]], music: 'boss', canFlee: false });
      e.visible = true;
      await say('Général Blanc', 'N-non... Attends ! Si tu fais un pas de plus... j\'appuie sur ce bouton, et C-8 explose ! Il a une bombe dans le ventre !');
      if (has('c8')) await say('C-8', 'Goku... Pars. Ne t\'occupe pas de moi.');
      await say('Goku', 'Jamais de la vie !');
      SND.sfx('swing'); Game.shake = 12;
      await Tasks.tween(e, { x: e.x + 80, y: e.y - 40 }, 18, 'in');
      e.gone = true;
      await say(null, 'Plus vif que l\'éclair, Goku envoie le général Blanc par la fenêtre, avant qu\'il ait pu toucher le bouton !');
      Game.flags.blancDone = true;
      await say('Goku', 'Et voilà ! Ça t\'apprendra à embêter mes amis.');
      const p = Field.ent('papa_suno');
      await say('Villageois de Jingle', 'Merci, mon garçon ! Le général gardait ceci dans son coffre... C\'est ce que tu cherches, je crois ?');
      if (p) p.gone = true;
      await rball(6);
      await fadeLoad('jingle', 14.5, 12, 'down');
      await afterTower();
    });
  }
  async function afterTower() {
    await say('Suno', 'Papa ! Tu es revenu ! ... Merci, Goku ! Merci, C-8 !');
    await say('Chef de Jingle', 'Les soldats du Ruban Rouge se sont enfuis ! Le village Jingle est libre !');
    if (has('c8')) {
      await say('C-8', 'Goku... Je voudrais rester ici. Suno m\'a dit que je pouvais vivre au village. Je n\'ai jamais eu de maison.');
      await say('Goku', 'C\'est super, C-8 ! Tu seras bien ici. On se reverra, promis !');
      await say('C-8', 'Merci, Goku. Tu es mon premier ami. Viens là !');
      SND.sfx('bighit'); Game.shake = 6;
      await say(null, 'C-8 serre Goku dans ses bras... un peu trop fort. CRAC ! Quelque chose s\'est cassé dans la poche de Goku.');
      Game.removeMember('c8'); Field.syncParty();
    } else {
      SND.sfx('bighit');
      await say(null, 'En sautant de joie avec les enfants du village, Goku retombe lourdement sur sa poche. CRAC !');
    }
    await say('Goku', 'Oh non... Le Dragon Radar ! Il est en miettes !');
    if (has('bulma')) await say('Bulma', 'Mon radar ! Il me faudrait des pièces que je n\'ai pas... Mais j\'ai entendu parler d\'un génie, le professeur Senbei, au village Pingouin, à l\'est. Lui saura le réparer !');
    else await say('Chef de Jingle', 'Un appareil cassé ? On raconte qu\'un inventeur de génie vit au village Pingouin, tout à l\'est. Le professeur Senbei !');
    Game.flags.vu_pingouin = true; Game.flags.ch9done = true;
    Game.setQuest('ruban', 'radarcasse');
    SND.sfx('levelup');
    await say(null, 'Fin du chapitre 9. Le village Pingouin apparaît sur la carte du Kinto\'un.');
  }

  // =====================================================================
  // CHAPITRE 10 : le village Pingouin
  // =====================================================================
  MAPS.pingouin = {
    name: 'Village Pingouin', music: 'village', ground: '.',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TT.....,.......T.......,.....TTT',
      'T...###.....,.......###........T',
      'T...###.............###...,....T',
      'T..............................T',
      'T.......pppppppppppppppppp.....T',
      'T..,....p......,.........p..T..T',
      'T.......p..###......###..p.....T',
      'T..T....p..###......###..p.....T',
      'T.......p................p..,..T',
      'T.......pppppppppppppppppp.....T',
      'T...,..........pp..............T',
      'T..###.........pp.........###..T',
      'T..###.........pp.........###..T',
      'T..............pp....,.........T',
      'T.....T........pp..........T...T',
      'T..,...........pp..............T',
      'T..............pp.......,......T',
      'T......,.......pp..............T',
      'TTTTTTT........pp........TTTTTTT',
      'TTTTTTTTTTTTTTTppTTTTTTTTTTTTTTT',
    ],
    objects: [
      { type: 'building', img: 'labo', x: 20 * TS - 4, y: 2 * TS - 18 },
      { type: 'building', img: 'domeR', x: 4 * TS - 4, y: 2 * TS - 18 },
      { type: 'building', img: 'domeJ', x: 11 * TS - 4, y: 7 * TS - 18 },
      { type: 'building', img: 'dome3', x: 20 * TS - 4, y: 7 * TS - 18 },
      { type: 'building', img: 'domeN', x: 3 * TS - 4, y: 12 * TS - 18 },
      { type: 'building', img: 'domeR', x: 27 * TS - 4, y: 12 * TS - 18 },
      { type: 'prop', img: 'well', x: 15 * TS, y: 13 * TS },
    ],
    entities: () => [
      warp(15, 20, 2, 1, 'pingouin', 15.5, 18, 'up'),
      savePt(13, 16),
      npc('senbei', 'senbei', 21, 4, senbeiTalk, { dir: 'down' }),
      npc('arale', 'arale', 28, 16, araleTalk, { cond: () => !Game.flags.araleDone, wander: true }),
      npc('arale2', 'arale', 23, 4, () => say('Arale', Game.flags.ch11 ? 'N\'cha ! Le monsieur blond a volé très très loin ! Comme une fusée ! Hihi !' : 'N\'cha ! Bye-cha ! Reviens jouer, Goku !'), { cond: () => !!Game.flags.araleDone, dir: 'down' }),
      { kind: 'npc', id: 'pingouin1', tx: 6, ty: 6, mon: 'pingouin', wander: true, talk: () => say('Pingouin', 'Kwèèè ! (Bienvenue au village Pingouin !)') },
      { kind: 'npc', id: 'pingouin2', tx: 24, ty: 14, mon: 'pingouin', wander: true, talk: () => say('Pingouin', 'Kwè kwè ! (Arale court plus vite qu\'une voiture, tu sais !)') },
      npc('villageois_p', 'villF1', 9, 15, () => say('Villageoise', 'Ici, il se passe des choses bizarres tous les jours. Hier, le soleil s\'est levé à l\'ouest... Enfin, je crois.'), { wander: true }),
      chest('pingouin1', 30, 2, 'super_tonique', 2),
    ],
    async onEnter() {
      if (Game.flags.pingouinIntro) return;
      Game.flags.pingouinIntro = true;
      Game.flags.ch10 = true;
      await Field.run(async () => {
        await chapterCard('ch10card', 'Chapitre 10', 'Le village Pingouin');
        await say('Goku', 'C\'est ici, le village Pingouin ? Les maisons ressemblent à des champignons !');
        Game.setQuest('ruban', 'pingouin', true);
        const a = Field.ent('arale');
        if (a) { SND.sfx('swing'); await Tasks.tween(a, { x: L().x + 30, y: L().y }, 14); a.dir = 'left'; }
        await say('Arale', 'N\'cha ! Bonjour ! Je m\'appelle Arale ! Tu as une drôle de queue, toi ! Tu es un singe ?');
        await say('Goku', 'Euh... Moi, c\'est Goku. Je cherche le professeur Senbei !');
        await say('Arale', 'C\'est mon papa ! Il habite dans la maison bleue, là-haut. Bye-cha !');
        if (a) { SND.sfx('swing'); await Tasks.tween(a, { x: 28 * TS + 8, y: 16 * TS + 14 }, 16); }
        if (has('bulma')) await say('Bulma', 'Elle a couru à au moins trois cents à l\'heure... C\'est quoi, cette gamine ?!');
      });
    },
  };
  async function senbeiTalk() {
    if (Game.flags.radarRepare) { await say('Professeur Senbei', 'Si un jour ton radar retombe en panne, tu sais où me trouver ! Je suis un génie, après tout. Hé hé !'); return; }
    if (!Game.flags.araleDone) {
      await say('Professeur Senbei', 'Hmm ? Un Dragon Radar ? Quelle merveille de technologie ! Je peux le réparer en deux minutes...');
      await say('Professeur Senbei', '... Sauf qu\'Arale est partie jouer avec mon tournevis ! Elle court partout dans le village. Si tu la rattrapes, ramène-le-moi !');
      Game.setQuest('ruban', 'pingouin');
      return;
    }
    await say('Professeur Senbei', 'Mon tournevis ! Bien. Voyons voir... Un fil par-ci, une soudure par-là... Et voilà ! Il marche mieux qu\'avant !');
    SND.sfx('item');
    Game.flags.radarRepare = true;
    await say('Professeur Senbei', 'Et prends aussi mes lunettes de rechange. Elles rendent plus intelligent ! ... Enfin, ça dépend.');
    await getItem('lunettes');
    await say('Goku', 'Le radar bipe ! Il y a une boule au fond de la mer, près de la Côte des Pirates, au sud-ouest !');
    Game.flags.vu_pirates = true;
    Game.setQuest('ruban', 'pirates');
    SND.sfx('levelup');
    await say(null, 'Fin du chapitre 10. La Côte des Pirates apparaît sur la carte du Kinto\'un.');
  }
  async function araleTalk(e) {
    await Field.run(async () => {
      if (!Game.flags.pingouinIntro) return;
      await say('Arale', 'N\'cha ! Tu veux jouer avec moi ? On joue à la bagarre ! Le premier qui tombe a perdu !');
      const r = await ask('Goku', 'Une petite fille contre moi ?', ['D\'accord, on joue !', 'Plus tard'], { cancel: 1 });
      if (r !== 0) return;
      e.visible = false;
      const res = await Battle.start(['arale'], { positions: [[e.x, e.y]], music: 'boss', canFlee: false, spar: true, loseMsg: 'Arale a gagné !' });
      e.visible = true;
      if (res === 'win') await say('Arale', 'Hihi ! T\'es drôlement fort, toi ! Personne n\'avait jamais résisté à mon N\'cha Punch !');
      else {
        await say('Arale', 'Gagné ! Hihi ! Tu as volé jusqu\'aux nuages, c\'était trop rigolo !');
        await say('Goku', 'Aïe... Elle est encore plus forte que Tortue Géniale !');
      }
      await say('Arale', 'Tiens, le tournevis de papa ! Et regarde, j\'ai aussi trouvé une jolie bille orange avec des étoiles... Tu la veux ? Je te la donne !');
      Game.flags.araleDone = true;
      await rball(2);
      await say('Goku', 'Une Boule de Cristal ! Merci, Arale !');
      await say('Arale', 'N\'cha ! Bye-cha !');
      SND.sfx('swing');
      await Tasks.tween(e, { x: 23 * TS + 8, y: 4 * TS + 14 }, 16);
      e.gone = true;
      Field.addEntity({ kind: 'npc', id: 'arale2', sprite: 'arale', tx: 23, ty: 4, dir: 'down', talk: () => say('Arale', 'N\'cha ! Bye-cha ! Reviens jouer, Goku !') });
    });
  }

  // ---------------- Lancement de l'arc ----------------
  async function intro() { // à la Kame House, après le Championnat du monde
    Game.flags.ch9 = true;
    await Field.run(async () => {
      await chapterCard('ch9card', 'Chapitre 9', 'L\'armée du Ruban Rouge');
      await say('Bulma', 'Goku ! Krilin ! Venez voir ! J\'ai fabriqué un nouveau Dragon Radar, et les boules sont redevenues actives !');
      await say('Goku', 'Super ! Je vais enfin pouvoir retrouver la boule à quatre étoiles. C\'est le souvenir de mon grand-père...');
      await say('Tortue Géniale', 'Méfie-toi, Goku. On raconte qu\'une armée entière cherche les boules : l\'armée du Ruban Rouge. Ce sont des bandits sans pitié.');
      await say('Bulma', 'Le radar indique une boule tout au nord, au milieu des neiges. Près d\'un village appelé Jingle.');
      await say('Goku', 'Une armée de bandits ? Ça ne me fait pas peur ! Kinto\'un, direction le grand Nord !');
      Game.extra.rb = Game.extra.rb || [];
      Game.flags.vu_jingle = true;
      Game.setQuest('ruban', 'radar');
      await say(null, 'Le village Jingle apparaît sur la carte du Kinto\'un. (Menu → Kinto\'un)');
    });
  }
  const plage = MAPS.plage, beachEnter = plage.onEnter;
  plage.onEnter = async function () {
    if (beachEnter) await beachEnter.call(this);
    if (Game.flags.tournoiDone && !Game.flags.ch9) await intro();
  };

  return { MODS, spikes, updateTraps, building, BUILD, fadeLoad, healParty, hurtParty, intro, rball, rballs, radar };
})();
window.Ruban = Ruban;
