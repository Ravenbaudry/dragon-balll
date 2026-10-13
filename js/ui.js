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
    'Ours Brigand': 'mon:ours', 'Tortue': 'mon:umigame', 'Doyenne': 'mon:umigame', 'Bébé tortue': 'mon:umigame', 'Gardien de Pierre': 'mon:golem', 'Gyumao': 'mon:gyumao', 'Esprit du Volcan': 'mon:volcan', 'Puar': 'mon:puar',
    'Oolong Monstre': 'mon:taureau', 'Goku (singe géant)': 'mon:oozaru',
    'Lunch': 'lunch', 'Présentateur': 'annonceur', 'Jackie Chun': 'jackie', 'Nam': 'nam', 'Bactérian': 'bacterian', 'Ranfan': 'ranfan', 'Moine': 'moine',
    'Passeur': 'villM2', 'Spectateur': 'villM1', 'Spectatrice': 'villF1', 'Giran': 'mon:giran',
  };
  function portraitFor(name) {
    if (!name) return null;
    const key = SPEAKERS[name] || SPEAKERS[name.replace(/ \(.*\)$/, '')];
    if (!key) return null;
    if (key.startsWith('mon:')) return GFX.monPortrait(key.slice(4));
    return GFX.portrait(MEMBERS[key] ? charKey(key) : key); // les héros apparaissent avec leur équipement
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
  const MENU_ITEMS = ['Objets', 'Techniques', 'Compétences', 'Équipement', 'Équipe', 'Style', 'Cuisine', 'Kinto\'un', 'Journal', 'Boules', 'Sauver', 'Options'];
  const MENU_HINTS = {
    Objets: 'Utiliser un objet.', Techniques: 'Voir et utiliser les techniques.', Compétences: 'Dépenser les points de compétence des héros.',
    Équipement: 'Armes, tenues, couvre-chefs et accessoires.', Équipe: 'Choisir les trois héros de l\'équipe active.', Style: 'Personnaliser l\'apparence de Goku.',
    Cuisine: 'Cuisiner des plats qui renforcent l\'équipe.', Journal: 'Quêtes en cours et liens avec tes amis.', Boules: 'Voir les Boules de Cristal (Dragon Radar).',
    Sauver: 'Sauvegarder la partie (3 emplacements).', Options: 'Difficulté, vitesse, aides, mini-carte, joueurs, son.',
  };
  function memberCard(m, x, y, highlight) {
    const spr = GFX.char(lookKey(m));
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
    if (menu.solo) { if (menu.sub) menu.sub.draw(); return; } // menu ouvert seul (options depuis l'écran titre)
    win(4, 4, 170, 168);
    Game.party.forEach((m, i) => memberCard(m, 10, 10 + i * 52, menu.sub && menu.sub.pickMember && menu.sub.msel === i));
    win(178, 4, 74, 142);
    MENU_ITEMS.forEach((s, i) => {
      const off = s === 'Kinto\'un' && !WorldMap.unlocked();
      text(s, 192, 9 + i * 11, off ? '#6870a0' : menu.sub ? '#a0a8c8' : '#fff');
      if (!menu.sub && i === menu.sel) cursor(181, 9 + i * 11);
    });
    win(178, 148, 74, 24);
    text('Zénis', 184, 154, GRAY); FONT.drawRight(ctx, String(Game.zeni), 246, 154, YEL);
    win(4, 176, 248, 46);
    const loc = Field.map ? Field.map.name : '';
    if (!menu.sub) {
      const item = MENU_ITEMS[menu.sel];
      const hint = item === 'Kinto\'un' ? (WorldMap.unlocked() ? 'Voler sur la carte du monde.' : 'Le nuage magique... il faudrait le trouver.') : MENU_HINTS[item];
      const obj = Hud.objective();
      text(loc, 12, 182, YEL); text(hint, 12, 196);
      if (obj) text('Objectif : ' + FONT.wrap(obj, 190)[0], 12, 208, '#a8f0c8');
      FONT.drawRight(ctx, '★' + Game.balls.length + '/7   ' + playTime(), 244, 182, '#c0c8e8');
    } else menu.sub.draw();
  }
  function itemList() { const l = Object.keys(Game.items).filter(k => Game.items[k] > 0 && ITEMS[k]); return l.filter(k => !ITEMS[k].key).concat(l.filter(k => ITEMS[k].key)); }
  function applyItemField(id, m) {
    const it = ITEMS[id];
    if (it.target === 'allyKO' && m.hp > 0) return false;
    if (it.cure && it.target === 'ally' && m.hp > 0 && m.hp >= m.maxhp) { Game.useItemStock(id); return true; }
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
        if (Input.pressed('a')) {
          const it = ITEMS[list[this.sel]];
          if (it.key || it.ingr) { SND.sfx('buzz'); if (it.ingr) notify('Un ingrédient : à cuisiner (Menu → Cuisine).', 90); return; }
          this.pickMember = true; this.msel = 0; SND.sfx('confirm');
        }
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
      msel: 0, pickMember: true, sel: 0, target: false, tsel: 0, pop: null,
      list(m) { return availTechs(m).concat((m.custom || []).length < MAX_CUSTOM ? ['__new'] : []); },
      update() {
        const m = Game.party[this.msel];
        if (this.pickMember) {
          if (Input.repeat('up')) { this.msel = (this.msel + Game.party.length - 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.repeat('down')) { this.msel = (this.msel + 1) % Game.party.length; SND.sfx('cursor'); }
          if (Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); }
          if (Input.pressed('a')) { this.pickMember = false; this.sel = 0; SND.sfx('confirm'); }
          return;
        }
        const list = this.list(m);
        this.sel = clamp(this.sel, 0, list.length - 1);
        if (this.pop) { // technique perso : utiliser, modifier, supprimer
          const P = this.pop, n = P.opts.length;
          if (Input.repeat('up')) { P.sel = (P.sel + n - 1) % n; SND.sfx('cursor'); }
          if (Input.repeat('down')) { P.sel = (P.sel + 1) % n; SND.sfx('cursor'); }
          if (Input.pressed('b')) { this.pop = null; SND.sfx('cancel'); return; }
          if (!Input.pressed('a')) return;
          const o = P.opts[P.sel], T = TECHS[list[this.sel]];
          if (o === 'Utiliser') { this.pop = null; if (m.ki >= T.ki && m.hp > 0) { this.target = true; this.tsel = 0; SND.sfx('confirm'); } else SND.sfx('buzz'); }
          else if (o === 'Modifier') { this.pop = null; menu.sub = subTechEditor(m, T.custom, this); SND.sfx('confirm'); }
          else if (o === 'Supprimer') { P.opts = ['Oui, supprimer', 'Non']; P.sel = 1; P.confirm = true; SND.sfx('cursor'); }
          else if (o === 'Oui, supprimer') { CustomTech.remove(m, T.custom); this.pop = null; this.sel = Math.max(0, this.sel - 1); SND.sfx('cancel'); notify('Technique oubliée.', 70); }
          else { this.pop = null; SND.sfx('cancel'); }
          return;
        }
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
          const id = list[this.sel];
          if (id === '__new') { menu.sub = subTechEditor(m, null, this); SND.sfx('confirm'); return; }
          const t = TECHS[id];
          if (t.custom) { this.pop = { sel: 0, opts: (t.field ? ['Utiliser'] : []).concat(['Modifier', 'Supprimer', 'Retour']) }; SND.sfx('confirm'); return; }
          if (t.field && m.ki >= t.ki && m.hp > 0) { this.target = true; this.tsel = 0; SND.sfx('confirm'); } else SND.sfx('buzz');
        }
      },
      draw() {
        const m = Game.party[this.msel];
        if (this.pickMember) { cursor(2, 26 + this.msel * 52); text('Techniques de qui ?', 12, 182, YEL); return; }
        const list = this.list(m);
        const duals = DUALS.filter(d => d.members.every(id => Game.member(id)) && d.members.includes(m.id) && d.req.every((r, i) => Game.member(d.members[i]).techs.includes(r)));
        const rows = Math.min(list.length, 9) + duals.length;
        win(40, 14, 176, rows * 12 + 10 + (duals.length ? 4 : 0));
        this.scroll = clamp(this.scroll || 0, Math.max(0, this.sel - 8), this.sel);
        list.slice(this.scroll, this.scroll + 9).forEach((id, j) => {
          const i = j + this.scroll, y = 19 + j * 12;
          if (id === '__new') { text('+ Créer une technique', 58, y, i === this.sel ? '#a0ffa0' : GREEN); }
          else {
            const t = TECHS[id];
            if (t.custom) { const C = TECH_COLORS[t.custom.color]; ctx.fillStyle = '#000'; ctx.fillRect(48, y + 2, 7, 7); ctx.fillStyle = C[2]; ctx.fillRect(49, y + 3, 5, 5); }
            text(t.name, 58, y, m.ki >= t.ki ? (t.custom ? '#ffd8a8' : t.field ? '#fff' : '#c0c8e8') : '#7078a0');
            FONT.drawRight(ctx, t.ki + ' Ki', 208, y, CYAN);
          }
          if (i === this.sel) cursor(44, y);
        });
        duals.forEach((d, j) => {
          const y = 23 + (Math.min(list.length, 9) + j) * 12;
          text(d.name, 58, y, '#f8c0f0');
          const other = d.members.find(id => id !== m.id);
          FONT.drawRight(ctx, '+' + MEMBERS[other].name, 208, y, '#c8a0e0');
        });
        const id = list[this.sel];
        if (this.pop) {
          const P = this.pop;
          win(150, 60, 96, P.opts.length * 12 + 10);
          P.opts.forEach((o, i) => { text(o, 166, 65 + i * 12, i === P.sel ? '#fff' : '#c0c8e8'); if (i === P.sel) cursor(154, 65 + i * 12); });
        }
        if (id === '__new') { text('Invente ta propre technique : forme, couleurs, coût...', 12, 182); text('Jusqu\'à ' + MAX_CUSTOM + ' techniques perso par héros.', 12, 196, GRAY); }
        else {
          const t = TECHS[id];
          text(t.desc, 12, 182);
          text(this.target ? 'Sur qui ?' : t.custom ? 'Z : options' : (t.field ? 'Z : utiliser' : 'Utilisable en combat'), 12, 196, this.target ? YEL : GRAY);
        }
        if (this.target) cursor(2, 26 + this.tsel * 52);
      },
    };
  }

  // ---------------- Atelier : création de techniques ----------------
  const KB_ROWS = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', 'abcdefghijklm', 'nopqrstuvwxyz', 'éèêàçôïû\'-!.0'];
  const KB_BTNS = ['Espace', 'Effacer', 'OK'];
  function subTechEditor(m, orig, back) {
    const BOX = { x: 10, y: 24, w: 118, h: 86 };
    const FIELDS = ['name', 'form', 'target', 'color', 'glow', 'size', 'effect', 'cost', 'ok'];
    const LABELS = { name: 'Nom', form: 'Forme', target: 'Cible', color: 'Couleur', glow: 'Éclat', size: 'Taille', effect: 'Effet', cost: 'Coût', ok: '' };
    let keyHook = null;
    const S = {
      sel: 0, d: orig ? Object.assign({}, orig) : CustomTech.fresh(), kb: null, P: null,
      rebuild() { this.P = CustomTech.preview(this.d, m, BOX); },
      fix() { // garde des choix compatibles entre eux
        const d = this.d, F = TECH_FORMS[d.form];
        if (!F.targets.includes(d.target)) d.target = F.targets[0];
        if (!CustomTech.effects(d).includes(d.effect)) d.effect = 'none';
        d.cost = clamp(Math.max(d.cost, TECH_EFFECTS[d.effect].cost + 2), COST_MIN, COST_MAX);
      },
      change(dx) {
        const d = this.d, f = FIELDS[this.sel];
        const cyc = (arr, v) => arr[(arr.indexOf(v) + dx + arr.length) % arr.length];
        if (f === 'name') d.name = CustomTech.randomName();
        else if (f === 'form') d.form = cyc(TECH_FORM_KEYS, d.form);
        else if (f === 'target') d.target = cyc(TECH_FORMS[d.form].targets, d.target);
        else if (f === 'color') d.color = (d.color + dx + TECH_COLORS.length) % TECH_COLORS.length;
        else if (f === 'glow') d.glow = (d.glow + dx + TECH_COLORS.length) % TECH_COLORS.length;
        else if (f === 'size') d.size = (d.size + dx + 3) % 3;
        else if (f === 'effect') d.effect = cyc(CustomTech.effects(d), d.effect);
        else if (f === 'cost') d.cost = clamp(d.cost + dx, COST_MIN, COST_MAX);
        else return;
        this.fix(); this.rebuild(); SND.sfx('cursor');
      },
      openKb() {
        this.kb = { text: this.d.name, old: this.d.name, row: 0, col: 0 };
        keyHook = e => { // saisie au clavier physique
          if (!this.kb) return;
          const k = e.key;
          if (k === 'Enter') { this.closeKb(); }
          else if (k === 'Escape') { this.kb.text = this.kb.old; this.closeKb(); }
          else if (k === 'Backspace') { this.kb.text = this.kb.text.slice(0, -1); SND.sfx('cursor'); }
          else if (k.length === 1 && /[\p{L}\d '!.\-]/u.test(k)) { if (this.kb.text.length < 16) this.kb.text += k; SND.sfx('cursor'); }
          else return;
          e.preventDefault(); e.stopImmediatePropagation();
        };
        window.addEventListener('keydown', keyHook, true);
      },
      closeKb() {
        if (keyHook) { window.removeEventListener('keydown', keyHook, true); keyHook = null; }
        const t = this.kb.text.trim();
        this.d.name = t || this.kb.old;
        this.kb = null;
        SND.sfx('confirm');
        Input.clear();
      },
      updateKb() {
        const K2 = this.kb, rows = KB_ROWS.length + 1;
        if (Input.repeat('up')) { K2.row = (K2.row + rows - 1) % rows; SND.sfx('cursor'); }
        if (Input.repeat('down')) { K2.row = (K2.row + 1) % rows; SND.sfx('cursor'); }
        const w = K2.row === KB_ROWS.length ? KB_BTNS.length : 13;
        if (Input.repeat('left')) { K2.col = (Math.min(K2.col, w - 1) + w - 1) % w; SND.sfx('cursor'); }
        if (Input.repeat('right')) { K2.col = (Math.min(K2.col, w - 1) + 1) % w; SND.sfx('cursor'); }
        K2.col = Math.min(K2.col, w - 1);
        if (Input.pressed('b')) { K2.text = K2.text.slice(0, -1); SND.sfx('cancel'); }
        if (Input.pressed('a')) {
          if (K2.row === KB_ROWS.length) {
            const b = KB_BTNS[K2.col];
            if (b === 'OK') { this.closeKb(); return; }
            if (b === 'Effacer') K2.text = K2.text.slice(0, -1);
            else if (K2.text.length < 16) K2.text += ' ';
          } else if (K2.text.length < 16) K2.text += KB_ROWS[K2.row][K2.col];
          SND.sfx('cursor');
        }
      },
      update() {
        if (this.P) CustomTech.stepPreview(this.P);
        if (this.kb) { this.updateKb(); return; }
        const n = FIELDS.length;
        if (Input.repeat('up')) { this.sel = (this.sel + n - 1) % n; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % n; SND.sfx('cursor'); }
        if (Input.repeat('left')) this.change(-1);
        if (Input.repeat('right')) this.change(1);
        if (Input.pressed('b')) { menu.sub = back; SND.sfx('cancel'); return; }
        if (Input.pressed('a')) {
          const f = FIELDS[this.sel];
          if (f === 'name') { this.openKb(); SND.sfx('confirm'); }
          else if (f === 'ok') {
            const id = CustomTech.save(m, this.d);
            back.sel = m.techs.indexOf(id);
            menu.sub = back;
            SND.sfx('levelup');
            notify((orig ? 'Technique modifiée : ' : 'Nouvelle technique : ') + this.d.name + ' !', 110);
          } else this.change(1);
        }
      },
      draw() {
        const d = this.d;
        win(4, 4, 248, 168);
        FONT.drawCentered(ctx, 'Atelier de techniques : ' + m.name, 128, 9, YEL);
        ctx.fillStyle = '#000'; ctx.fillRect(BOX.x - 1, BOX.y - 1, BOX.w + 2, BOX.h + 2);
        if (this.P) CustomTech.drawPreview(this.P);
        // résumé
        const st = CustomTech.stars(d), est = CustomTech.estimate(m, d), heal = CustomTech.isHeal(d);
        text('Coût', 12, 114, GRAY); FONT.drawRight(ctx, d.cost + ' Ki', 126, 114, CYAN);
        text('Puissance', 12, 126, GRAY); FONT.drawRight(ctx, '★'.repeat(st) + '☆'.repeat(5 - st), 126, 126, YEL);
        text(heal ? 'Soin' : 'Dégâts', 12, 138, GRAY); FONT.drawRight(ctx, '≈ ' + est, 126, 138, '#fff');
        if (d.cost > m.maxki) text('Ki max trop faible !', 12, 152, RED);
        else text('Ki de ' + m.name + ' : ' + m.maxki, 12, 152, GRAY);
        // réglages
        FIELDS.forEach((f, i) => {
          const y = 24 + i * 15, on = i === this.sel;
          if (on) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(134, y - 2, 114, 13); cursor(134, y); }
          if (f === 'ok') { FONT.drawCentered(ctx, orig ? 'Enregistrer' : 'Créer la technique', 194, y, on ? GREEN : '#c0f0c0'); return; }
          text(LABELS[f], 144, y, on ? '#fff' : GRAY);
          let v = '';
          if (f === 'name') v = d.name;
          else if (f === 'form') v = TECH_FORMS[d.form].name;
          else if (f === 'target') v = TARGET_NAMES[d.target];
          else if (f === 'color' || f === 'glow') {
            const C = TECH_COLORS[f === 'color' ? d.color : d.glow];
            v = C[0];
            const w = FONT.measure(v);
            ctx.fillStyle = '#000'; ctx.fillRect(244 - w - 11, y + 1, 9, 9); ctx.fillStyle = C[1]; ctx.fillRect(244 - w - 10, y + 2, 7, 7); ctx.fillStyle = C[2]; ctx.fillRect(244 - w - 8, y + 4, 3, 3);
          } else if (f === 'size') v = TECH_SIZES[d.size];
          else if (f === 'effect') v = TECH_EFFECTS[d.effect].name;
          else if (f === 'cost') v = d.cost + ' Ki';
          FONT.drawRight(ctx, v, 246, y, on ? YEL : '#e0e4ff');
        });
        // aide
        const f = FIELDS[this.sel];
        const help = {
          name: ['Le nom crié pendant l\'attaque.', 'Z : écrire le nom   Gauche/Droite : au hasard'],
          form: [TECH_FORMS[d.form].desc, 'Gauche/Droite : changer la forme'],
          target: ['Qui est touché par la technique.', 'Viser tout le monde réduit la puissance.'],
          color: ['La couleur principale de l\'énergie.', 'Gauche/Droite : changer'],
          glow: ['La couleur du cœur et de l\'éclat.', 'Gauche/Droite : changer'],
          size: ['La taille de l\'effet (purement visuelle).', 'Gauche/Droite : changer'],
          effect: [TECH_EFFECTS[d.effect].desc, 'Un effet coûte du Ki (' + TECH_EFFECTS[d.effect].cost + ') sans ajouter de puissance.'],
          cost: ['Plus la technique coûte de Ki, plus elle est puissante.', 'Gauche/Droite : ajuster (' + COST_MIN + ' à ' + COST_MAX + ')'],
          ok: [orig ? 'Enregistrer les changements.' : 'Ajouter la technique à ' + m.name + '.', 'X : annuler'],
        }[f];
        text(help[0], 12, 182); text(help[1], 12, 196, GRAY);
        if (this.kb) this.drawKb();
      },
      drawKb() {
        const K2 = this.kb;
        ctx.fillStyle = 'rgba(0,0,20,0.5)'; ctx.fillRect(0, 0, SW, SH);
        win(16, 30, 224, 140);
        FONT.drawCentered(ctx, 'Nom de la technique', 128, 36, YEL);
        ctx.fillStyle = '#0c1040'; ctx.fillRect(40, 50, 176, 14);
        const blink = Math.floor(Game.frame / 15) % 2 ? '_' : '';
        FONT.drawCentered(ctx, K2.text + blink, 128, 52, '#fff');
        KB_ROWS.forEach((r, j) => [...r].forEach((ch, i) => {
          const x = 30 + i * 15, y = 72 + j * 13, on = K2.row === j && K2.col === i;
          if (on) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 3, y - 2, 13, 12); }
          FONT.drawCentered(ctx, ch, x + 3, y, on ? YEL : '#e0e4ff');
        }));
        KB_BTNS.forEach((b, i) => {
          const x = 40 + i * 62, y = 140, on = K2.row === KB_ROWS.length && K2.col === i;
          ctx.fillStyle = on ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y - 2, 54, 13);
          FONT.drawCentered(ctx, b, x + 27, y, on ? YEL : '#fff');
        });
        win(4, 176, 248, 44);
        text('Tape au clavier, ou choisis les lettres avec Z.', 12, 182, '#fff');
        text('X : effacer   Entrée : valider (' + K2.text.length + '/16)', 12, 196, GRAY);
      },
    };
    S.fix(); S.rebuild();
    return S;
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
          const spr = GFX.char(lookKey(m));
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
              const key = c === 'chichi' ? 'chichi' : charKey(c);
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
  // ---------------- Équipement ----------------
  const DIRS4 = ['down', 'right', 'up', 'left'];
  function drawPreview(key, x, y, scale = 2) { // sprite qui tourne sur lui-même
    const spr = GFX.char(key), d = DIRS4[Math.floor(Game.frame / 50) % 4];
    const f = [1, 0, 2, 0][Math.floor(Game.frame / 10) % 4];
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 12 * scale, y + 31 * scale, 8 * scale, 2.5 * scale, 0, 0, 7); ctx.fill();
    ctx.drawImage(spr[d][f], x, y, 24 * scale, 32 * scale);
  }
  function statLines(m, x, y, diff) {
    const rows = [['PV', 'maxhp', 'hp'], ['Ki', 'maxki', 'ki'], ['Force', 'atk'], ['Défense', 'def'], ['Puissance', 'mag'], ['Vitesse', 'spd']];
    rows.forEach(([label, k, dk], i) => {
      const v = m[k], d = diff ? (diff[dk || k] || 0) : 0;
      text(label, x, y + i * 11, GRAY);
      FONT.drawRight(ctx, String(v + d), x + 74, y + i * 11, d > 0 ? GREEN : d < 0 ? RED : '#fff');
      if (d) FONT.drawRight(ctx, (d > 0 ? '▲' : '▼'), x + 84, y + i * 11, d > 0 ? GREEN : RED);
    });
  }
  function subEquip() {
    return {
      phase: 'member', msel: 0, ssel: 0, isel: 0, scroll: 0,
      members() { return Game.allMembers(); },
      items(m) {
        const slot = SLOTS[this.ssel];
        return [null].concat(Object.keys(Game.gear).filter(id => GEAR[id] && GEAR[id].slot === slot && Game.gear[id] > 0));
      },
      diffFor(m, id) {
        const slot = SLOTS[this.ssel], old = m.equip && m.equip[slot], d = {};
        if (old) for (const k in GEAR[old].stats) d[k] = (d[k] || 0) - GEAR[old].stats[k];
        if (id) for (const k in GEAR[id].stats) d[k] = (d[k] || 0) + GEAR[id].stats[k];
        return d;
      },
      update() {
        const L = this.members(), m = L[this.msel];
        const nav = (n, k) => { if (Input.repeat('up')) { this[k] = (this[k] + n - 1) % n; SND.sfx('cursor'); } if (Input.repeat('down')) { this[k] = (this[k] + 1) % n; SND.sfx('cursor'); } };
        if (this.phase === 'member') {
          nav(L.length, 'msel');
          if (Input.pressed('b')) { menu.sub = null; SND.sfx('cancel'); }
          if (Input.pressed('a')) { this.phase = 'slot'; this.ssel = 0; SND.sfx('confirm'); }
        } else if (this.phase === 'slot') {
          nav(SLOTS.length, 'ssel');
          if (Input.pressed('b')) { this.phase = 'member'; SND.sfx('cancel'); }
          if (Input.pressed('a')) { this.phase = 'item'; this.isel = 0; this.scroll = 0; SND.sfx('confirm'); }
        } else {
          const list = this.items(m);
          nav(list.length, 'isel');
          if (Input.pressed('b')) { this.phase = 'slot'; SND.sfx('cancel'); }
          if (Input.pressed('a')) {
            const id = list[this.isel], slot = SLOTS[this.ssel];
            if (id && !canEquip(m, id)) { SND.sfx('buzz'); notify('Seul' + (GEAR[id].who.length > 1 ? 's ' : ' ') + GEAR[id].who.map(w => MEMBERS[w].name).join(', ') + ' peu' + (GEAR[id].who.length > 1 ? 'vent' : 't') + ' l\'utiliser.', 90); return; }
            if (!id && !(m.equip && m.equip[slot])) { SND.sfx('buzz'); return; }
            equipItem(m, slot, id);
            Field.syncParty();
            SND.sfx(id ? 'item' : 'cancel');
            this.phase = 'slot';
          }
        }
      },
      draw() {
        const L = this.members(), m = L[this.msel];
        win(4, 4, 248, 168);
        L.forEach((p, i) => {
          const y = 12 + i * 31;
          const spr = GFX.char(lookKey(p));
          ctx.save(); ctx.beginPath(); ctx.rect(22, y - 2, 24, 28); ctx.clip(); ctx.drawImage(spr.down[0], 22, y - 4); ctx.restore();
          text(p.name, 48, y + 6, i === this.msel ? '#fff' : '#c0c8e8');
          if (i === this.msel && this.phase === 'member') cursor(10, y + 6);
        });
        ctx.fillStyle = '#8898e0'; ctx.fillRect(96, 10, 1, 156);
        const slot = SLOTS[this.ssel], list = this.phase === 'item' ? this.items(m) : null;
        const hover = list ? list[this.isel] : undefined;
        const tmp = list ? { id: m.id, style: m.style, equip: Object.assign({}, m.equip, { [slot]: hover && canEquip(m, hover) ? hover : null }) } : m;
        ctx.fillStyle = '#0c1040'; ctx.fillRect(102, 10, 56, 72);
        drawPreview(lookKey(tmp), 106, 12);
        statLines(m, 162, 12, list && (hover === null || canEquip(m, hover)) ? this.diffFor(m, hover) : null);
        SLOTS.forEach((sl, i) => {
          const y = 90 + i * 24;
          const id = m.equip && m.equip[sl];
          text(SLOT_NAMES[sl], 112, y, GRAY);
          text(id ? GEAR[id].name : '—', 112, y + 10, this.phase !== 'member' && i === this.ssel ? '#fff' : '#c0c8e8');
          if (this.phase === 'slot' && i === this.ssel) cursor(100, y + 10);
        });
        if (list) { // liste des objets par-dessus les emplacements, l'aperçu reste visible
          const h = Math.min(list.length, 6) * 12 + 10;
          win(100, 86, 150, h);
          this.scroll = clamp(this.scroll, Math.max(0, this.isel - 5), this.isel);
          list.slice(this.scroll, this.scroll + 6).forEach((id, i) => {
            const idx = i + this.scroll, ok = !id || canEquip(m, id);
            text(id ? GEAR[id].name : '— Retirer —', 116, 91 + i * 12, !ok ? '#7078a0' : idx === this.isel ? '#fff' : '#c0c8e8');
            if (id) FONT.drawRight(ctx, 'x' + Game.gear[id], 244, 91 + i * 12, '#c0c8e8');
            if (idx === this.isel) cursor(104, 91 + i * 12);
          });
        }
        if (this.phase === 'member') { text('Équiper qui ?', 12, 182, YEL); text('L\'équipement apparaît sur le personnage !', 12, 196, GRAY); }
        else if (this.phase === 'slot') { const id = m.equip && m.equip[slot]; text(id ? GEAR[id].desc : 'Rien d\'équipé.', 12, 182); text(id ? gearDesc(id) : 'Z : changer   X : retour', 12, 196, id ? CYAN : GRAY); }
        else if (hover) { text(GEAR[hover].desc, 12, 182); text(gearDesc(hover) + (canEquip(m, hover) ? '' : '  (pas pour ' + m.name + ')'), 12, 196, canEquip(m, hover) ? CYAN : RED); }
        else { text('Retirer l\'objet porté.', 12, 182); text('Z : valider   X : retour', 12, 196, GRAY); }
      },
    };
  }

  // ---------------- Style de Goku ----------------
  function subStyle() {
    return {
      sel: 0,
      update() {
        const g = Game.member('goku');
        const n = STYLE_KEYS.length;
        if (Input.repeat('up')) { this.sel = (this.sel + n - 1) % n; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % n; SND.sfx('cursor'); }
        const dx = Input.repeat('right') ? 1 : Input.repeat('left') ? -1 : 0;
        if (dx) {
          const key = STYLE_KEYS[this.sel], vals = STYLE_OPTS[key].vals, st = styleOf(g);
          let v = st[key];
          do { v = (v + dx + vals.length) % vals.length; } while (!styleUnlocked(key, v));
          st[key] = v; g.style = st;
          Field.syncParty();
          SND.sfx('cursor');
        }
        if (Input.pressed('a') || Input.pressed('b')) { menu.sub = null; SND.sfx('confirm'); }
      },
      draw() {
        const g = Game.member('goku'), st = styleOf(g), key = lookKey(g);
        win(4, 4, 248, 168);
        FONT.drawCentered(ctx, 'Style de Goku', 128, 10, YEL);
        ctx.fillStyle = '#0c1040'; ctx.fillRect(14, 26, 80, 104);
        drawPreview(key, 18, 30, 3);
        const por = GFX.portrait(key);
        ctx.fillStyle = '#0c1040'; ctx.fillRect(34, 134, 42, 32);
        ctx.save(); ctx.beginPath(); ctx.rect(35, 135, 40, 30); ctx.clip(); ctx.drawImage(por, 35, 135); ctx.restore();
        STYLE_KEYS.forEach((k, i) => {
          const y = 30 + i * 22, o = STYLE_OPTS[k], v = o.vals[st[k]];
          text(o.name, 108, y, i === this.sel ? '#fff' : GRAY);
          const col = v[1] || null;
          if (col) { ctx.fillStyle = '#000'; ctx.fillRect(107, y + 11, 10, 8); ctx.fillStyle = col; ctx.fillRect(108, y + 12, 8, 6); }
          FONT.draw(ctx, '< ' + v[0] + ' >', col ? 122 : 108, y + 10, i === this.sel ? YEL : '#c0c8e8');
          if (i === this.sel) cursor(96, y + 4);
        });
        text('Haut/Bas : choisir   Gauche/Droite : changer', 12, 182);
        text(Game.flags.goldHair ? 'Coiffure secrète débloquée !' : 'Un style secret s\'obtient chez Tortue Géniale...', 12, 196, GRAY);
      },
    };
  }
  // ---------------- Options ----------------
  function subOptions() {
    return {
      sel: 0,
      update() {
        const L = Opt.LIST, n = L.length;
        if (Input.repeat('up')) { this.sel = (this.sel + n - 1) % n; SND.sfx('cursor'); }
        if (Input.repeat('down')) { this.sel = (this.sel + 1) % n; SND.sfx('cursor'); }
        const dx = Input.repeat('right') || Input.pressed('a') ? 1 : Input.repeat('left') ? -1 : 0;
        if (dx) { const e = L[this.sel]; Opt.set(e.key, (Opt.get(e.key) + dx + e.vals.length) % e.vals.length); SND.sfx('cursor'); }
        if (Input.pressed('b')) { SND.sfx('cancel'); if (menu.solo) menu = null; else menu.sub = null; }
      },
      draw() {
        win(4, 4, 248, 168);
        FONT.drawCentered(ctx, 'Options', 128, 10, YEL);
        Opt.LIST.forEach((e, i) => {
          const y = 28 + i * 17, on = i === this.sel;
          if (on) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(10, y - 3, 236, 14); cursor(12, y); }
          text(e.name, 26, y, on ? '#fff' : GRAY);
          FONT.drawRight(ctx, '< ' + e.vals[Opt.get(e.key)] + ' >', 242, y, on ? YEL : '#e0e4ff');
        });
        win(4, 176, 248, 46);
        const e = Opt.LIST[this.sel];
        FONT.wrap(e.help[Opt.get(e.key)], 232).slice(0, 2).forEach((l, i) => text(l, 12, 182 + i * 12));
        text('Gauche/Droite : changer   X : retour', 12, 207, GRAY);
      },
    };
  }
  function openOptions() { menu = { sel: 0, solo: true, sub: subOptions() }; SND.sfx('confirm'); }
  // Choisir un emplacement de sauvegarde (null si annulé)
  async function chooseSlot(question = 'Sauvegarder dans quel emplacement ?') {
    const r = await ask(null, question, [1, 2, 3].map(n => Game.slotLabel(n)).concat(['Annuler']), { def: (Game.slot || 1) - 1, cancel: 3 });
    return r < 3 ? r + 1 : null;
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
      else if (s === 'Équipement') menu.sub = subEquip();
      else if (s === 'Style') menu.sub = subStyle();
      else if (s === 'Kinto\'un') {
        if (!WorldMap.unlocked()) { SND.sfx('buzz'); notify('Tu n\'as pas encore le nuage magique.', 80); return; }
        menu = null;
        Field.run(() => WorldMap.travel());
      }
      else if (s === 'Journal') menu.sub = subJournal();
      else if (s === 'Compétences') menu.sub = Prog.subSkills();
      else if (s === 'Cuisine') menu.sub = Prog.subCooking();
      else if (s === 'Options') menu.sub = subOptions();
      else if (s === 'Sauver') {
        menu = null;
        Field.run(async () => {
          const n = await chooseSlot();
          if (!n) return;
          const ok = Game.save(n);
          if (ok) SND.sfx('save');
          await say(null, ok ? 'Partie sauvegardée dans l\'emplacement ' + n + ' !' : 'Sauvegarde impossible sur ce navigateur.');
        });
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
      const id = shop.stock[shop.sel], it = itemDef(id);
      if (Game.zeni >= it.price) { Game.zeni -= it.price; Game.give(id); SND.sfx('coin'); } else SND.sfx('buzz');
    }
  }
  function drawShop() {
    const h = (shop.stock.length + 1) * 12 + 10;
    win(24, 20, 208, h);
    shop.stock.forEach((id, i) => {
      const it = itemDef(id), gear = !!GEAR[id];
      text(it.name, 42, 25 + i * 12, Game.zeni >= it.price ? (gear ? '#a8f0ff' : '#fff') : '#7078a0');
      FONT.drawRight(ctx, it.price + ' Z', 176, 25 + i * 12, YEL);
      FONT.drawRight(ctx, 'x' + (gear ? Game.gearOwned(id) : Game.items[id] || 0), 222, 25 + i * 12, '#c0c8e8');
      if (i === shop.sel) cursor(30, 25 + i * 12);
    });
    text('Partir', 42, 25 + shop.stock.length * 12);
    if (shop.sel === shop.stock.length) cursor(30, 25 + shop.stock.length * 12);
    win(24, 20 + h + 4, 208, 22);
    text('Zénis : ' + Game.zeni, 32, 25 + h + 4, YEL);
    win(8, 170, 240, 46);
    const id = shop.stock[shop.sel];
    if (id && GEAR[id]) { text(GEAR[id].desc, 16, 175); text(SLOT_NAMES[GEAR[id].slot] + ' : ' + gearDesc(id) + (GEAR[id].who ? ' (' + GEAR[id].who.map(w => MEMBERS[w].name).join(', ') + ')' : ''), 16, 187, CYAN); }
    else text(id ? ITEMS[id].desc : 'Revenez quand vous voulez !', 16, 176);
    text('Z : acheter   X : partir', 16, 201, GRAY);
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
  return { win, bar, cursor, text, say, ask, notify, fade, fadeTo, openMenu, openOptions, openShop, chooseSlot, chapter, update, draw, blocking, drawPreview, statLines, memberCard, YEL, GRAY, GREEN, RED, CYAN, isMenu: () => !!menu, closeMenu() { menu = null; }, closeSub() { if (menu) { if (menu.solo) menu = null; else menu.sub = null; } } };
})();
