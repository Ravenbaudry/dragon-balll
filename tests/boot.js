// Outils injectés dans la page pendant les tests (jamais chargés par le jeu lui-même).

// État de test : carte, position, niveau, équipe, drapeaux
window.__test = function (map, tx, ty, opts = {}) {
  Tasks.reset(); Battle.reset(); Field.locks = 0; Field.battle = false; Main.Shenron.active = false; Main.Moon.active = false;
  Game.newGame();
  Game.flags = Object.assign({ intro: true, paozuIntro: true, beachIntro: true, castleIntro: true, camp1: true, camp2: true, ch1: true, ch2: true, ch3: true, ch4: true, ch5: true, ch6: true, grave: true, voie: 'coeur' }, opts.flags || {});
  Game.party = [makeMember('goku', opts.lv || 1)];
  equipItem(Game.party[0], 'arme', 'nyoibo', true);
  for (const id of (opts.party || ['goku', 'bulma'])) if (!Game.member(id)) Game.addMember(id);
  for (const m of Game.allMembers()) { while (m.lv < (opts.lv || 1)) levelUp(m); m.hp = m.maxhp; m.ki = m.maxki; }
  (opts.balls || []).forEach(n => Game.giveBall(n));
  Game.items = opts.items || { tonique: 3, boisson_ki: 2 };
  Game.zeni = opts.zeni || 50;
  Object.assign(Game.quests, opts.quests || {});
  Game.karma = opts.karma || 0;
  UI.fade.v = 0;
  Game.mode = 'field';
  Field.load(map, tx, ty, opts.dir || 'down');
  return 'ok';
};
// place le héros à côté d'une entité, tourné vers elle
window.__goto = function (id) {
  const e = Field.ent(id); if (!e) return 'no ent ' + id;
  const L = Field.leader();
  for (const [dx, dy, dir] of [[0, 14, 'up'], [0, -12, 'down'], [-14, 0, 'right'], [14, 0, 'left']]) {
    const x = e.x + dx, y = e.y + dy;
    if (!Field.blocked(x, y, null)) { for (const a of Field.actors) { a.x = x; a.y = y; } L.dir = dir; Field.snapCamera(); return 'ok'; }
  }
  return 'blocked';
};
// choix automatiques : on préfère les options contenant un des textes de __prefer
window.__prefer = []; window.__picks = [];
(function () {
  const ask = UI.ask;
  UI.ask = function (n, s, c, o = {}) {
    let def = o.def || 0;
    for (const p of window.__prefer) { const i = c.findIndex(x => x.includes(p)); if (i >= 0) { def = i; break; } }
    window.__picks.push((n || '') + ' | ' + s.slice(0, 50) + ' -> ' + c[def]);
    return ask(n, s, c, Object.assign({}, o, { def }));
  };
})();

// Joueur automatique de combat : soigne, utilise techniques et techniques doubles (objets en option)
window.__enableAI = function (items) { window.__items = !!items; clearInterval(window.__ai); window.__ai = setInterval(() => {
  const B = Battle.state(); if (!B || !B.menu || B.menu.level !== 'cmd' || B.busy) return;
  const c = B.menu.who; if (c.hp <= 0 || c.queued) return;
  const party = B.party, alive = party.filter(p => p.hp > 0), foes = B.enemies.filter(e => !e.dead && e.hp > 0);
  if (!foes.length) return;
  const commit = act => { for (const a of act.actors || [act.actor]) { a.queued = true; B.ready = B.ready.filter(r => r !== a); } B.actions.push(act); B.menu = null; };
  const low = alive.slice().sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
  const ko = party.find(p => p.hp <= 0);
  const can = id => c.m.techs.includes(id) && c.ki >= TECHS[id].ki;
  if (ko && can('reveil')) return commit({ kind: 'tech', actor: c, id: 'reveil', target: ko });
  if (alive.filter(p => p.hp / p.maxhp < 0.5).length >= 2 && can('soin_total')) return commit({ kind: 'tech', actor: c, id: 'soin_total', target: alive[0] });
  if (alive.filter(p => p.hp / p.maxhp < 0.5).length >= 2 && can('gateau')) return commit({ kind: 'tech', actor: c, id: 'gateau', target: alive[0] });
  if (low.hp / low.maxhp < 0.4 && can('soin')) return commit({ kind: 'tech', actor: c, id: 'soin', target: low });
  if (window.__items) {
    if (ko && Game.items.capsule_vie) return commit({ kind: 'item', actor: c, id: 'capsule_vie', target: ko });
    if (low.hp / low.maxhp < 0.3) { const it = ['super_tonique', 'tonique', 'senzu'].find(i => Game.items[i]); if (it) return commit({ kind: 'item', actor: c, id: it, target: low }); }
  }
  const target = foes.slice().sort((a, b) => a.hp - b.hp)[0];
  // technique double prête ?
  for (const d of DUALS) {
    if (!d.members.includes(c.id)) continue;
    const ps = d.members.map(id => party.find(p => p.id === id));
    if (ps.some(p => !p || p.hp <= 0)) continue;
    if (!d.req.every((r, i) => ps[i].m.techs.includes(r))) continue;
    const other = ps.find(p => p !== c);
    if (other.atb >= 100 && !other.queued && ps.every((p, i) => p.ki >= d.ki[i])) return commit({ kind: 'dual', dual: d, actors: ps, target });
  }
  const dmg = c.m.techs.filter(id => can(id) && ['enemy', 'allEnemies'].includes(TECHS[id].target) && TECHS[id].pow && TECHS[id].kind !== 'janken' && TECHS[id].kind !== 'transfo')
    .sort((a, b) => (TECHS[b].pow * (TECHS[b].hits || 1) * (TECHS[b].target === 'allEnemies' ? foes.length * 0.8 : 1)) - (TECHS[a].pow * (TECHS[a].hits || 1) * (TECHS[a].target === 'allEnemies' ? foes.length * 0.8 : 1)));
  if (dmg.length && Math.random() < 0.85) return commit({ kind: 'tech', actor: c, id: dmg[0], target });
  return commit({ kind: 'attack', actor: c, target });
}, 50); };

// Joueur automatique des mini-jeux (adresse de 0 à 1)
window.__bot = { skill: 1, on: false };
(function loop() {
  requestAnimationFrame(loop);
  const G = MiniGames.state(); if (!window.__bot.on || !G || G.phase !== 'play') return;
  const S = G.s, t = G.t, sk = window.__bot.skill;
  if (G.id === 'lait') window.__last = { bottles: S.bottles, hearts: S.hearts, t };
  const press = b => { Input.setTouch(b, true); setTimeout(() => Input.setTouch(b, false), 20); };
  if (G.id === 'rythme') {
    for (const n of S.notes) if (!n.done && !n.botted && n.t - t <= 1) { n.botted = true; if (Math.random() < sk) press(['left', 'up', 'right'][n.lane]); }
  } else if (G.id === 'lait') {
    if (S.y >= 178) for (const o of S.obs) {
      const dx = o.x - S.x;
      if (o.kind !== 'bottle' && dx > o.w / 2 + 6 && dx < o.w / 2 + 14 && Math.random() < sk) { press('a'); break; }
      if (o.kind === 'bottle' && o.y < 160 && dx > 30 && dx < 38 && !S.obs.some(r => r.kind !== 'bottle' && r.x - S.x > 0 && r.x - S.x < 60) && Math.random() < sk) { press('a'); break; }
    }
  } else if (G.id === 'briques') {
    if (S.phase === 'aim' && Math.abs(S.cx - S.zc) <= (sk >= 1 ? S.speed / 2 + 0.3 : 10)) press('a');
  } else if (G.id === 'meditation') {
    if (S.phase === 'input' && S.pt % 14 === 7) { const want = S.seq[S.input]; press(['up', 'right', 'down', 'left'][Math.random() < sk ? want : (want + 1) % 4]); }
  } else if (G.id === 'relever') {
    if (t % 4 === 0 && Math.random() < sk) press('a');
  } else if (G.id === 'grimpe') { // Tour de Karine : on alterne les mains et on se plaque quand un oiseau arrive
    const danger = S.birds.some(b => b.t >= 50 && b.t <= 74);
    Input.setTouch('down', danger);
    if (!danger && S.slip <= 0 && t % 6 === 0 && S.breath > 14 && Math.random() < sk) press(S.last === 'left' ? 'right' : 'left');
  }
})();
