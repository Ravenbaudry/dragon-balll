// Interface : fenêtres façon Chrono Trigger, dialogues, choix, menus, boutique.
const UI = (() => {
  const YEL = '#f8e070', GRAY = '#8890b0', GREEN = '#80f080', RED = '#f87070', CYAN = '#80d8f8';

  function win(x, y, w, h, alpha = 1) {
    x = Math.round(x); y = Math.round(y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#080818'; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#4a62d8'); g.addColorStop(1, '#141c6a');
    ctx.fillStyle = g; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#d8e0ff';
    ctx.fillRect(x + 2, y + 1, w - 4, 1); ctx.fillRect(x + 1, y + 2, 1, h - 4);
    ctx.fillStyle = '#8898e0';
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1); ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + 2, y + 2, w - 4, 3);
    ctx.restore();
  }
  function bar(x, y, w, v, max, col, bg = '#101030') {
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 5);
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, 3);
    const f = max > 0 ? Math.round(w * clamp(v / max, 0, 1)) : 0;
    ctx.fillStyle = col; ctx.fillRect(x, y, f, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, f, 1);
  }
  function cursor(x, y) {
    const o = Math.floor(Game.frame / 8) % 2;
    FONT.draw(ctx, '►', x + o, y, '#ffffff');
  }
  function text(s, x, y, col = '#fff') { FONT.draw(ctx, s, x, y, col); }

  // ---------------- Fondu ----------------
  const fade = { v: 0, color: '#000' };
  function fadeTo(v, frames = 20, color) {
    if (color) fade.color = color;
    return Tasks.tween(fade, { v }, frames, 'inOut');
  }

  // ---------------- Dialogue ----------------
  let dlg = null;
  const DW = 240, DLINES = 3;
  // Portraits : nom affiché -> personnage
  const SPEAKERS = {
    'Goku': 'goku', 'Bulma': 'bulma', 'Krilin': 'krillin', 'Tortue Géniale': 'roshi', 'Vieil homme': 'roshi', 'Yamcha': 'yamcha',
    'Oolong': 'oolong', 'Pilaf': 'pilaf', 'Mai': 'mai', 'Shu': 'shu', 'Chichi': 'chichi', 'Chef du village': 'elder',
    'Grand-père Gohan': 'gohan', 'Marchand': 'villM2', 'Aubergiste': 'villF2', 'Villageoise': 'villF1', 'Villageois': 'villM1',
    'Garçon': 'villM3', 'Fillette': 'villF1', 'Garde': 'villM2', 'Nomade': 'villM1', 'Soldat': 'soldier', 'Chef Brigand': 'brigand',
    'Grand-mère': 'elder', 'Bandit': 'bandit', 'Mère': 'villF1',
    'Ours Brigand': 'mon:ours', 'Tortue': 'mon:umigame', 'Gyumao': 'mon:gyumao', 'Esprit du Volcan': 'mon:volcan', 'Puar': 'mon:puar',
    'Oolong Monstre': 'mon:taureau',
  };
  function portraitFor(name) {
    if (!name) return null;
    const key = SPEAKERS[name] || SPEAKERS[name.replace(/ \(.*\)$/, '')];
    if (!key) return null;
    return key.startsWith('mon:') ? GFX.monPortrait(key.slice(4)) : GFX.portrait(key);
  }
  function say(name, str, opts = {}) {
    return new Promise(res => {
      const por = opts.portrait !== false ? portraitFor(name) : null;
      const lines = FONT.wrap(str, DW - 16 - (por ? 48 : 0));
      const pages = [];
      for (let i = 0; i < lines.length; i += DLINES) pages.push(lines.slice(i, i + DLINES));
      dlg = { name, pages, page: 0, chars: 0, res, top: opts.top, choices: null, sel: 0, por };
      SND.sfx('cursor');
    });
  }
  function ask(name, str, choices, opts = {}) {
    return new Promise(res => {
      const por = portraitFor(name);
      const lines = FONT.wrap(str, DW - 16 - (por ? 48 : 0));
      dlg = { name, pages: [lines.slice(0, DLINES)], page: 0, chars: 0, res, choices, sel: opts.def || 0, cancel: opts.cancel, top: opts.top, por };
    });
  }
  function pageLen(p) { return p.reduce((a, l) => a + l.length, 0); }
  function updateDialog() {
    const d = dlg;
    const len = pageLen(d.pages[d.page]);
    if (d.chars < len) {
      d.chars += Input.down('a') || Input.down('b') ? 3 : 1;
      if (Game.frame % 3 === 0) SND.sfx('cursor');
      if (Input.pressed('a')) d.chars = len;
      return;
    }
    if (d.choices) {
      if (Input.repeat('up')) { d.sel = (d.sel + d.choices.length - 1) % d.choices.length; SND.sfx('cursor'); }
      if (Input.repeat('down')) { d.sel = (d.sel + 1) % d.choices.length; SND.sfx('cursor'); }
      if (Input.pressed('a')) { SND.sfx('confirm'); dlg = null; d.res(d.sel); }
      else if (Input.pressed('b') && d.cancel !== undefined) { SND.sfx('cancel'); dlg = null; d.res(d.cancel); }
      return;
    }
    if (Input.pressed('a') || Input.pressed('b')) {
      if (d.page < d.pages.length - 1) { d.page++; d.chars = 0; SND.sfx('cursor'); }
      else { dlg = null; d.res(); }
    }
  }
  function drawDialog() {
    const d = dlg;
    const h = 14 + (d.name ? 12 : 0) + DLINES * 12;
    const y = d.top ? 6 : SH - h - 6;
    win(8, y, DW, h);
    let ty = y + 5, tx = 16;
    if (d.por) {
      ctx.fillStyle = '#0c1040'; ctx.fillRect(13, y + 5, 42, h - 10);
      ctx.fillStyle = '#6878d0'; ctx.fillRect(13, y + 5, 42, 1); ctx.fillRect(13, y + h - 6, 42, 1); ctx.fillRect(13, y + 5, 1, h - 10); ctx.fillRect(54, y + 5, 1, h - 10);
      ctx.save(); ctx.beginPath(); ctx.rect(14, y + 6, 40, h - 12); ctx.clip();
      ctx.drawImage(d.por, 14, y + h - 6 - d.por.height);
      ctx.restore();
      tx = 62;
    }
    if (d.name) { text(d.name + ' :', tx, ty, YEL); ty += 12; }
    let left = d.chars;
    for (const l of d.pages[d.page]) {
      const s = l.slice(0, Math.max(0, left));
      text(s, tx, ty);
      left -= l.length;
      ty += 12;
    }
    const len = pageLen(d.pages[d.page]);
    if (d.chars >= len && !d.choices && Math.floor(Game.frame / 15) % 2) FONT.draw(ctx, '▼', 8 + DW - 14, y + h - 12, '#fff');
    if (d.choices && d.chars >= len) {
      const cw = Math.max(...d.choices.map(c => FONT.measure(c))) + 28;
      const ch = d.choices.length * 12 + 10;
      const cx = 8 + DW - cw, cy = d.top ? y + h + 2 : y - ch - 2;
      win(cx, cy, cw, ch);
      d.choices.forEach((c, i) => {
        text(c, cx + 18, cy + 5 + i * 12, i === d.sel ? '#fff' : '#c0c8e8');
        if (i === d.sel) cursor(cx + 6, cy + 5 + i * 12);
      });
    }
  }

  // ---------------- Notifications ----------------
  const notes = [];
  function notify(str, frames = 110) { notes.push({ str, t: frames }); }
  function drawNotes() {
    if (!notes.length) return;
    const n = notes[0];
    const w = FONT.measure(n.str) + 20;
    const a = Math.min(1, n.t / 15);
    win((SW - w) / 2, 10, w, 22, a);
    ctx.globalAlpha = a; FONT.drawCentered(ctx, n.str, SW / 2, 15, '#fff'); ctx.globalAlpha = 1;
    if (--n.t <= 0) notes.shift();
  }

  // ---------------- Menu principal (terrain) ----------------
  let menu = null;
  function openMenu() { menu = { sel: 0, sub: null }; SND.sfx('confirm'); }
  const MENU_ITEMS = ['Objets', 'Techniques', 'Équipe', 'Journal', 'Boules', 'Sauver', 'Son'];
  function memberCard(m, x, y, highlight) {
    const spr = GFX.char(MEMBERS[m.id].sprite);
    ctx.fillStyle = highlight ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0)'; ctx.fillRect(x, y, 158, 46);
    ctx.drawImage(m.hp > 0 ? spr.down[0] : spr.ko, x + 1, y + (m.hp > 0 ? 8 : 16));
    text(m.name, x + 28, y + 2, YEL);
    text('Niv ' + m.lv, x + 100, y + 2);
    text('PV', x + 28, y + 14, GRAY); FONT.drawRight(ctx, m.hp + '/' + m.maxhp, x + 96, y + 14, m.hp < m.maxhp / 4 ? RED : '#fff');
    bar(x + 100, y + 18, 54, m.hp, m.maxhp, '#58e070');
    text('Ki', x + 28, y + 25, GRAY); FONT.drawRight(ctx, m.ki + '/' + m.maxki, x + 96, y + 25);
    bar(x + 100, y + 29, 54, m.ki, m.maxki, '#58b8f8');
    text('Exp', x + 28, y + 36, GRAY); FONT.drawRight(ctx, String(xpToNext(m.lv) - m.xp), x + 96, y + 36, '#c0c8e8');
    bar(x + 100, y + 40, 54, m.xp, xpToNext(m.lv), '#f8c040');
  }
  function drawMenu() {
    win(4, 4, 170, 168);
    Game.party.forEach((m, i) => memberCard(m, 10, 10 + i * 52, menu.sub && menu.sub.pickMember && menu.sub.msel === i));
    win(178, 4, 74, 102);
    MENU_ITEMS.forEach((s, i) => {
      text(s, 194, 10 + i * 13, menu.sub ? '#a0a8c8' : '#fff');
      if (!menu.sub && i === menu.sel) cursor(182, 10 + i * 13);
    });
    win(178, 108, 74, 64);
    text('Zénis', 184, 113, GRAY); FONT.drawRight(ctx, String(Game.zeni), 246, 125);
    text(playTime(), 184, 141, '#c0c8e8');
    FONT.drawRight(ctx, '★ ' + Game.balls.length + '/7', 246, 155, YEL);
    win(4, 176, 248, 44);
    const loc = Field.map ? Field.map.name : '';
    if (!menu.sub) {
      const hint = ['Utiliser un objet.', 'Voir et utiliser les techniques.', 'Choisir les trois héros de l\'équipe active.', 'Quêtes en cours et liens avec tes amis.', 'Voir les Boules de Cristal (Dragon Radar).', 'Sauvegarder la partie.', 'Activer / couper le son (M).'][menu.sel];
      text(loc, 12, 182, YEL); text(hint, 12, 196);
    } else menu.sub.draw();
  }
  function itemList() { const l = Object.keys(Game.items).filter(k => Game.items[k] > 0 && ITEMS[k]); return l.filter(k => !ITEMS[k].key).concat(l.filter(k => ITEMS[k].key)); }
  function applyItemField(id, m) {
    const it = ITEMS[id];
    if (it.target === 'allyKO' && m.hp > 0) return false;
    if (it.target === 'ally' && m.hp <= 0) return false;
    if (it.hp) { if (m.hp >= m.maxhp) return false; m.hp = Math.min(m.maxhp, m.hp + it.hp); }
    if (it.ki) { if (m.ki >= m.maxki) return false; m.ki = Math.min(m.maxki, m.ki + it.ki); }
    if (it.revive) m.hp = Math.max(1, Math.floor(m.maxhp * it.revive));
    if (it.full) { m.hp = m.maxhp; m.ki = m.maxki; }
    Game.useItemStock(id);
    return true;
  }
  function subItems() {
    const s = {
      sel: 0, scroll: 0, pickMember: false, msel: 0,
      update() {
        const list = itemList();
        if (this.pickMember) {
          if (Input.repeat('up')) { this.msel = (this.msel + Game.party.length - 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.repeat('down')) { this.msel = (this.msel + 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.pressed('b')) { this.pickMember = false; SND.sfx('cancel'); }
          if (Input.pressed('a')) {
            const id = list[this.sel];
            if (applyItemField(id, Game.party[this.msel])) { SND.sfx('heal'); if (!Game.items[id]) { this.pickMember = false; this.sel = Math.max(0, this.sel - 1); } }
            else SND.sfx('buzz');
          }
          return;
        }
        if (!list.length) { if (Input.pressed('a') || Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); } return; }
        this.sel = clamp(this.sel, 0, list.length - 1);
        if (Input.repeat('up')) { this.sel = (this.sel + list.length - 1) % list.length; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % list.length; SND.sfx('cursor'); }
        if (Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); }
        if (Input.pressed('a')) { if (ITEMS[list[this.sel]].key) { SND.sfx('buzz'); return; } this.pickMember = true; this.msel = 0; SND.sfx('confirm'); }
      },
      draw() {
        const list = itemList();
        if (!list.length) { text('Aucun objet.', 12, 190); return; }
        win(60, 40, 136, Math.min(list.length, 8) * 12 + 10);
        this.scroll = clamp(this.scroll, Math.max(0, this.sel - 7), this.sel);
        list.slice(this.scroll, this.scroll + 8).forEach((id, i) => {
          const idx = i + this.scroll;
          const key = ITEMS[id].key;
          text(ITEMS[id].name, 78, 45 + i * 12, key ? (idx === this.sel ? '#ffe8a0' : '#c8b070') : idx === this.sel ? '#fff' : '#c0c8e8');
          if (!key) FONT.drawRight(ctx, 'x' + Game.items[id], 188, 45 + i * 12); else FONT.drawRight(ctx, '★', 188, 45 + i * 12, YEL);
          if (idx === this.sel && !this.pickMember) cursor(66, 45 + i * 12);
        });
        const it = ITEMS[list[this.sel]];
        const dl = FONT.wrap(it.desc, 232);
        text(dl[0], 12, 182);
        if (it.key) text(dl[1] || 'Objet important.', 12, 196, dl[1] ? '#fff' : YEL);
        else text(this.pickMember ? 'Sur qui ?' : 'Z : utiliser   X : retour', 12, 196, this.pickMember ? YEL : GRAY);
        if (this.pickMember) cursor(2, 26 + this.msel * 52);
      },
    };
    return s;
  }
  function subTechs() {
    return {
      msel: 0, pickMember: true, sel: 0, target: false, tsel: 0,
      update() {
        const m = Game.party[this.msel];
        if (this.pickMember) {
          if (Input.repeat('up')) { this.msel = (this.msel + Game.party.length - 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.repeat('down')) { this.msel = (this.msel + 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); }
          if (Input.pressed('a')) { this.pickMember = false; this.sel = 0; SND.sfx('confirm'); }
          return;
        }
        const list = m.techs;
        if (this.target) {
          if (Input.repeat('up')) { this.tsel = (this.tsel + Game.party.length - 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.repeat('down')) { this.tsel = (this.tsel + 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.pressed('b')) { this.target = false; SND.sfx('cancel'); }
          if (Input.pressed('a')) {
            const t = TECHS[list[this.sel]];
            if (m.ki < t.ki || m.hp <= 0) { SND.sfx('buzz'); return; }
            const targets = t.target === 'allAllies' ? Game.party.filter(p => p.hp > 0) : [Game.party[this.tsel]];
            let ok = false;
            for (const p of targets) {
              if (t.kind === 'heal' && p.hp > 0 && p.hp < p.maxhp) { p.hp = Math.min(p.maxhp, p.hp + Math.round(m.mag * t.pow + t.base)); ok = true; }
              if (t.kind === 'revive' && p.hp <= 0) { p.hp = Math.max(1, Math.floor(p.maxhp * t.pow)); ok = true; }
            }
            if (ok) { m.ki -= t.ki; SND.sfx('heal'); } else SND.sfx('buzz');
          }
          return;
        }
        if (Input.repeat('up')) { this.sel = (this.sel + list.length - 1) % list.length; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % list.length; SND.sfx('cursor'); }
        if (Input.pressed('b')) { this.pickMember = true; SND.sfx('cancel'); }
        if (Input.pressed('a')) {
          const t = TECHS[list[this.sel]];
          if (t.field && m.ki >= t.ki && m.hp > 0) { this.target = true; this.tsel = 0; SND.sfx('confirm'); } else SND.sfx('buzz');
        }
      },
      draw() {
        const m = Game.party[this.msel];
        if (this.pickMember) { cursor(2, 26 + this.msel * 52); text('Techniques de qui ?', 12, 182, YEL); return; }
        const list = m.techs;
        const duals = DUALS.filter(d => d.members.every(id => Game.member(id)) && d.members.includes(m.id) && d.req.every((r, i) => Game.member(d.members[i]).techs.includes(r)));
        const rows = list.length + duals.length;
        win(40, 30, 176, rows * 12 + 10 + (duals.length ? 4 : 0));
        list.forEach((id, i) => {
          const t = TECHS[id];
          text(t.name, 58, 35 + i * 12, m.ki >= t.ki ? (t.field ? '#fff' : '#c0c8e8') : '#7078a0');
          FONT.drawRight(ctx, t.ki + ' Ki', 208, 35 + i * 12, CYAN);
          if (i === this.sel) cursor(46, 35 + i * 12);
        });
        duals.forEach((d, j) => {
          const y = 39 + (list.length + j) * 12;
          text(d.name, 58, y, '#f8c0f0');
          const other = d.members.find(id => id !== m.id);
          FONT.drawRight(ctx, '+' + MEMBERS[other].name, 208, y, '#c8a0e0');
        });
        const t = TECHS[list[this.sel]];
        text(t.desc, 12, 182);
        text(this.target ? 'Sur qui ?' : (t.field ? 'Z : utiliser' : 'Utilisable en combat'), 12, 196, this.target ? YEL : GRAY);
        if (this.target) cursor(2, 26 + this.tsel * 52);
      },
    };
  }
  function subBalls() {
    return {
      update() { if (Input.pressed('a') || Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); } },
      draw() {
        win(28, 24, 200, 148);
        FONT.drawCentered(ctx, 'DRAGON RADAR', 128, 30, YEL);
        // écran du radar
        ctx.fillStyle = '#103818'; ctx.fillRect(48, 44, 160, 92);
        ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 1;
        for (let i = 0; i < 160; i += 16) { ctx.fillStyle = '#1c5a28'; ctx.fillRect(48 + i, 44, 1, 92); }
        for (let i = 0; i < 92; i += 16) { ctx.fillStyle = '#1c5a28'; ctx.fillRect(48, 44 + i, 160, 1); }
        for (let n = 1; n <= 7; n++) {
          const a = (n - 1) / 7 * Math.PI * 2 - Math.PI / 2;
          const bx = 128 + Math.cos(a) * 52, by = 90 + Math.sin(a) * 34;
          const have = Game.hasBall(n);
          ctx.drawImage(GFX.dragonBall(n, 14, !have), Math.round(bx - 8), Math.round(by - 8));
        }
        FONT.drawCentered(ctx, Game.balls.length + ' / 7', 128, 84, '#80ff90');
        const missing = [4, 2, 3, 5, 6, 1, 7].filter(n => !Game.hasBall(n));
        text(missing.length ? 'Prochaine : ' + BALL_HINTS[missing[0]] : 'Toutes réunies ! Shenron t\'attend...', 36, 144, missing.length ? '#fff' : YEL);
        text('Boules trouvées : ' + (Game.balls.join(', ') || 'aucune'), 12, 190, '#c0c8e8');
      },
    };
  }
  function subTeam() {
    return {
      sel: 0, pick: -1,
      list() { return Game.party.concat(Game.reserve); },
      update() {
        const L = this.list();
        if (Input.repeat('up')) { this.sel = (this.sel + L.length - 1) % L.length; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % L.length; SND.sfx('cursor'); }
        if (Input.pressed('b')) { if (this.pick >= 0) this.pick = -1; else menu.sub = null; SND.sfx('cancel'); return; }
        if (Input.pressed('a')) {
          if (!Game.reserve.length) { SND.sfx('buzz'); return; }
          if (L[this.sel].id === 'goku') { SND.sfx('buzz'); notify('Goku mène toujours l\'équipe !', 70); return; }
          if (this.pick < 0) { this.pick = this.sel; SND.sfx('confirm'); return; }
          const a = L[this.pick], b = L[this.sel];
          const aIn = Game.party.includes(a), bIn = Game.party.includes(b);
          if (aIn === bIn) { this.pick = this.sel; SND.sfx('cursor'); return; }
          const act = aIn ? a : b, res = aIn ? b : a;
          Game.party[Game.party.indexOf(act)] = res;
          Game.reserve[Game.reserve.indexOf(res)] = act;
          Field.syncParty();
          this.pick = -1;
          SND.sfx('confirm');
        }
      },
      draw() {
        const L = this.list();
        win(30, 20, 196, 18 + L.length * 22 + (Game.reserve.length ? 12 : 0));
        let y = 26;
        L.forEach((m, i) => {
          if (i === Game.party.length) { text('Réserve', 46, y, GRAY); y += 12; }
          const spr = GFX.char(MEMBERS[m.id].sprite);
          ctx.save(); ctx.beginPath(); ctx.rect(46, y - 2, 24, 20); ctx.clip();
          ctx.drawImage(spr.down[0], 46, y - 4); ctx.restore();
          text(m.name, 74, y + 2, i === this.pick ? '#80f080' : i === this.sel ? '#fff' : '#c0c8e8');
          text('Niv ' + m.lv, 140, y + 2, '#c0c8e8');
          FONT.drawRight(ctx, m.hp + '/' + m.maxhp, 218, y + 2, '#c0c8e8');
          if (i === this.sel) cursor(36, y + 2);
          y += 22;
        });
        text(Game.reserve.length ? (this.pick >= 0 ? 'Avec qui échanger ?' : 'Choisis un héros à échanger.') : 'Personne en réserve pour le moment.', 12, 182, this.pick >= 0 ? YEL : '#fff');
        text('Seuls 3 héros combattent. La réserve gagne aussi de l\'expérience.', 12, 196, GRAY);
      },
    };
  }
  function subJournal() {
    return {
      tab: 0, sel: 0,
      quests() { return Object.keys(Game.quests).filter(q => QUESTS[q]).sort((a, b) => (Game.quests[a] === 'done') - (Game.quests[b] === 'done') || (QUESTS[b].main ? 1 : 0) - (QUESTS[a].main ? 1 : 0)); },
      update() {
        if (Input.pressed('left') || Input.pressed('right')) { this.tab = 1 - this.tab; this.sel = 0; SND.sfx('cursor'); }
        const n = this.tab === 0 ? this.quests().length : COMPANIONS.length;
        if (n && Input.repeat('up')) { this.sel = (this.sel + n - 1) % n; SND.sfx('cursor'); }
        if (n && Input.repeat('down')) { this.sel = (this.sel + 1) % n; SND.sfx('cursor'); }
        if (Input.pressed('b') || Input.pressed('a')) { menu.sub = null; SND.sfx('cancel'); }
      },
      draw() {
        win(14, 12, 228, 160);
        FONT.draw(ctx, 'Quêtes', 40, 17, this.tab === 0 ? YEL : GRAY);
        FONT.draw(ctx, 'Liens', 150, 17, this.tab === 1 ? YEL : GRAY);
        FONT.draw(ctx, '< >', 210, 17, GRAY);
        ctx.fillStyle = '#8898e0'; ctx.fillRect(20, 30, 216, 1);
        if (this.tab === 0) {
          const Q = this.quests();
          if (!Q.length) { text('Aucune quête pour le moment.', 26, 40); return; }
          Q.slice(0, 10).forEach((q, i) => {
            const done = Game.quests[q] === 'done';
            text((done ? '✓ ' : QUESTS[q].main ? '★ ' : '• ') + QUESTS[q].title, 30, 36 + i * 12, done ? '#7880a8' : i === this.sel ? '#fff' : '#c0c8e8');
            if (i === this.sel) cursor(18, 36 + i * 12);
          });
          const q = Q[this.sel], st = QUESTS[q].steps[Game.quests[q]] || '';
          const ls = FONT.wrap(st, 232);
          text(ls[0] || '', 12, 182); text(ls[1] || '', 12, 196);
        } else {
          COMPANIONS.forEach((c, i) => {
            const met = c === 'chichi' ? Game.flags.metChichi : !!Game.member(c) || Game.flags['met_' + c];
            const name = c === 'chichi' ? 'Chichi' : MEMBERS[c].name;
            const y = 38 + i * 24;
            if (met) {
              const key = c === 'chichi' ? 'chichi' : MEMBERS[c].sprite;
              const p = GFX.portrait(key);
              ctx.save(); ctx.beginPath(); ctx.rect(30, y - 4, 22, 20); ctx.clip(); ctx.drawImage(p, 30, y - 6, 20, 21); ctx.restore();
            }
            text(met ? name : '???', 58, y + 2, i === this.sel ? '#fff' : '#c0c8e8');
            const a = Game.aff[c] || 0;
            if (met) for (let h = 0; h < 5; h++) FONT.draw(ctx, '♥', 120 + h * 8, y + 2, h < a ? '#ff6080' : '#404870');
            if (i === this.sel) cursor(18, y + 2);
          });
          const c = COMPANIONS[this.sel];
          const a = Game.aff[c] || 0;
          const mood = a >= 4 ? 'Un lien très fort vous unit.' : a >= 2 ? 'Une belle amitié.' : a >= 1 ? 'Ça commence bien.' : a < 0 ? 'Un peu froid entre vous...' : 'Vous vous connaissez à peine.';
          text(mood, 12, 182); text('Tes choix influencent tes liens... et la fin de l\'histoire.', 12, 196, GRAY);
        }
      },
    };
  }
  function updateMenu() {
    if (menu.sub) { menu.sub.update(); return; }
    if (Input.repeat('up')) { menu.sel = (menu.sel + MENU_ITEMS.length - 1) % MENU_ITEMS.length; SND.sfx('cursor'); }
    if (Input.repeat('down')) { menu.sel = (menu.sel + 1) % MENU_ITEMS.length; SND.sfx('cursor'); }
    if (Input.pressed('b')) { menu = null; SND.sfx('cancel'); return; }
    if (Input.pressed('a')) {
      const s = MENU_ITEMS[menu.sel];
      SND.sfx('confirm');
      if (s === 'Objets') menu.sub = subItems();
      else if (s === 'Techniques') menu.sub = subTechs();
      else if (s === 'Boules') menu.sub = subBalls();
      else if (s === 'Équipe') menu.sub = subTeam();
      else if (s === 'Journal') menu.sub = subJournal();
      else if (s === 'Sauver') {
        const ok = Game.save();
        menu.sub = { update() { if (Input.pressed('a') || Input.pressed('b')) menu.sub = null; }, draw() { text(ok ? 'Partie sauvegardée !' : 'Sauvegarde impossible sur ce navigateur.', 12, 188, ok ? GREEN : RED); } };
        if (ok) SND.sfx('save');
      } else if (s === 'Son') {
        const m = SND.toggleMute();
        notify(m ? 'Son coupé' : 'Son activé', 60);
      }
    }
  }

  // ---------------- Boutique ----------------
  let shop = null;
  function openShop(stock) { return new Promise(res => { shop = { stock, sel: 0, res }; }); }
  function updateShop() {
    const n = shop.stock.length + 1;
    if (Input.repeat('up')) { shop.sel = (shop.sel + n - 1) % n; SND.sfx('cursor'); }
    if (Input.repeat('down')) { shop.sel = (shop.sel + 1) % n; SND.sfx('cursor'); }
    if (Input.pressed('b') || (Input.pressed('a') && shop.sel === shop.stock.length)) { const r = shop.res; shop = null; SND.sfx('cancel'); r(); return; }
    if (Input.pressed('a')) {
      const id = shop.stock[shop.sel], it = ITEMS[id];
      if (Game.zeni >= it.price) { Game.zeni -= it.price; Game.addItem(id); SND.sfx('coin'); } else SND.sfx('buzz');
    }
  }
  function drawShop() {
    const h = (shop.stock.length + 1) * 12 + 10;
    win(24, 20, 208, h);
    shop.stock.forEach((id, i) => {
      const it = ITEMS[id];
      text(it.name, 42, 25 + i * 12, Game.zeni >= it.price ? '#fff' : '#7078a0');
      FONT.drawRight(ctx, it.price + ' Z', 176, 25 + i * 12, YEL);
      FONT.drawRight(ctx, 'x' + (Game.items[id] || 0), 222, 25 + i * 12, '#c0c8e8');
      if (i === shop.sel) cursor(30, 25 + i * 12);
    });
    text('Partir', 42, 25 + shop.stock.length * 12);
    if (shop.sel === shop.stock.length) cursor(30, 25 + shop.stock.length * 12);
    win(24, 20 + h + 4, 208, 22);
    text('Zénis : ' + Game.zeni, 32, 25 + h + 4, YEL);
    win(8, 170, 240, 46);
    const id = shop.stock[shop.sel];
    text(id ? ITEMS[id].desc : 'Revenez quand vous voulez !', 16, 176);
    text('Z : acheter   X : partir', 16, 196, GRAY);
  }

  // ---------------- Carte de chapitre ----------------
  let card = null;
  function chapter(num, title) {
    return new Promise(res => { card = { num, title, t: 0, res }; SND.sfx('save'); });
  }
  function updateCard() {
    card.t++;
    if ((card.t > 60 && (Input.pressed('a') || Input.pressed('b'))) || card.t > 260) { const r = card.res; card = null; r(); }
  }
  function drawCard() {
    const a = Math.min(1, card.t / 30, (270 - card.t) / 20);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
    ctx.globalAlpha = Math.max(0, a);
    const g = ctx.createLinearGradient(0, 80, 0, 140); g.addColorStop(0, 'rgba(80,90,200,0)'); g.addColorStop(0.5, 'rgba(80,90,200,0.35)'); g.addColorStop(1, 'rgba(80,90,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 80, SW, 60);
    FONT.drawCentered(ctx, card.num, SW / 2, 92, YEL);
    ctx.fillStyle = '#c0a040'; ctx.fillRect(SW / 2 - 50, 106, 100, 1);
    FONT.drawCentered(ctx, card.title, SW / 2, 112, '#ffffff');
    ctx.globalAlpha = 1;
  }

  function blocking() { return !!(dlg || menu || shop || card); }
  function update() {
    if (card) { updateCard(); return true; }
    if (dlg) { updateDialog(); return true; }
    if (shop) { updateShop(); return true; }
    if (menu) { updateMenu(); return true; }
    return false;
  }
  function draw() {
    if (menu) drawMenu();
    if (shop) drawShop();
    if (dlg) drawDialog();
    drawNotes();
    if (fade.v > 0) { ctx.globalAlpha = clamp(fade.v, 0, 1); ctx.fillStyle = fade.color; ctx.fillRect(0, 0, SW, SH); ctx.globalAlpha = 1; }
    if (card) drawCard(); // la carte de chapitre passe par-dessus les fondus
  }
  return { win, bar, cursor, text, say, ask, notify, fade, fadeTo, openMenu, openShop, chapter, update, draw, blocking, YEL, GRAY, GREEN, RED, CYAN, isMenu: () => !!menu };
})();
