// Nouveaux héros : Lunch (deux personnalités), Puar (vole et se métamorphose), Chichi (colère quand Goku tombe).
Object.assign(PALS, {
  lunch: { h: '#2c3c7c', H: '#1a2450', j: '#5068b0', c: '#58a858', C: '#367a3a', q: '#a0e0a0', d: '#e83850', D: '#a02030', f: '#7a4a24', F: '#4a2a10', x: '#a06a3a', a: '#58a858' },
  lunch_b: { h: '#f0d040', H: '#b89820', j: '#fff0a0', c: '#58a858', C: '#367a3a', q: '#a0e0a0', d: '#e83850', D: '#a02030', f: '#7a4a24', F: '#4a2a10', x: '#a06a3a', a: '#58a858' },
});
// Puar : un sprite construit à partir de son dessin de monstre, qui flotte en l'air
function buildPuarSprite(G) {
  const m = G.monster('puar');
  const frame = (img, dy) => { const c = G.mk(24, 32), x = c.getContext('2d'); x.drawImage(img, Math.round(12 - m.w / 2), Math.round(27 - m.h + dy)); return c; };
  const right = [-4, -5, -6].map(d => frame(m.imgR, d)), left = [-4, -5, -6].map(d => frame(m.img, d));
  const attack = frame(m.imgR, -2);
  const out = { grids: {}, down: right, up: left, right, left, attack, attackL: G.mirror(attack) };
  out.ko = G.rotate90(right[0]); out.koL = G.mirror(out.ko);
  out.white = G.flash(right[0]); out.whiteL = G.mirror(out.white);
  out.pal = {};
  return out;
}
Object.assign(CHARS, {
  lunch: { head: 'villF', body: 'dress', pal: 'lunch' },
  lunch_b: { head: 'villF', body: 'dress', pal: 'lunch_b' },
  puar_h: { build: buildPuarSprite, mon: 'puar' },
});

Object.assign(MEMBERS, {
  lunch: {
    name: 'Lunch', sprite: 'lunch',
    base: { hp: 50, ki: 18, atk: 9, def: 7, mag: 12, spd: 12 },
    grow: { hp: 10.5, ki: 2.8, atk: 2.5, def: 1.3, mag: 2.6, spd: 0.7 },
    techs: [['eternuement', 1], ['the_lunch', 1], ['mitraillette', 1], ['grenade', 6], ['berceuse', 10]],
  },
  puar: {
    name: 'Puar', sprite: 'puar_h',
    base: { hp: 44, ki: 18, atk: 9, def: 6, mag: 11, spd: 16 },
    grow: { hp: 9.5, ki: 2.6, atk: 2.2, def: 1.2, mag: 2.4, spd: 0.9 },
    techs: [['metamorphose', 1], ['pique', 1], ['ultrason', 6]],
  },
  chichi: {
    name: 'Chichi', sprite: 'chichi',
    base: { hp: 60, ki: 14, atk: 14, def: 9, mag: 11, spd: 14 },
    grow: { hp: 12.5, ki: 2.2, atk: 3.0, def: 1.6, mag: 2.3, spd: 0.75 },
    techs: [['coup_pied', 1], ['rayon_casque', 1], ['tornade', 8]],
  },
});
Object.assign(TECHS, {
  eternuement: { name: 'Atchoum !', ki: 0, target: 'self', kind: 'sneeze', anim: 'hero', desc: 'Lunch éternue... et change de personnalité !' },
  the_lunch: { name: 'Thé de Lunch', ki: 6, target: 'allAllies', kind: 'heal', pow: 1.0, base: 26, anim: 'healAll', field: true, form: 'douce', desc: 'Un thé délicieux qui soigne et purifie toute l\'équipe.' },
  berceuse: { name: 'Berceuse', ki: 7, target: 'allEnemies', kind: 'sleep', anim: 'hero', form: 'douce', desc: 'Une douce chanson qui peut endormir les ennemis.' },
  mitraillette: { name: 'Mitraillette', ki: 4, target: 'enemy', kind: 'gun', pow: 0.5, hits: 5, anim: 'hero', form: 'blonde', desc: 'Une rafale de balles qui ignore une partie de la défense.' },
  grenade: { name: 'Grenade', ki: 7, target: 'allEnemies', kind: 'ki', pow: 1.6, anim: 'bomb', form: 'blonde', desc: 'Une grenade pour tous les ennemis (peut brûler).' },
  metamorphose: { name: 'Métamorphose', ki: 5, target: 'enemy', kind: 'transfo', anim: 'hero', desc: 'Puar se transforme : chauve-souris, ciseaux, géant ou nuage... Surprise !' },
  pique: { name: 'Piqué', ki: 3, target: 'enemy', kind: 'phys', pow: 2.1, anim: 'strike', desc: 'Puar fond sur l\'ennemi depuis le ciel.' },
  ultrason: { name: 'Ultrason', ki: 6, target: 'allEnemies', kind: 'kistun', pow: 0.7, anim: 'hero', desc: 'Un cri perçant : dégâts légers et paralysie.' },
  coup_pied: { name: 'Coup de Pied Sauté', ki: 3, target: 'enemy', kind: 'multi', pow: 0.8, hits: 3, anim: 'multi', desc: 'Trois coups de pied enchaînés.' },
  rayon_casque: { name: 'Rayon du Casque', ki: 7, target: 'enemy', kind: 'ki', pow: 3.0, anim: 'beam', c1: '#e83880', c2: '#ffa0d0', desc: 'Le casque de Chichi lance un rayon tranchant.' },
  tornade: { name: 'Tornade de la Princesse', ki: 10, target: 'allEnemies', kind: 'phys', pow: 1.7, anim: 'hero', desc: 'Chichi tourbillonne et frappe tous les ennemis.' },
});
DUALS.push(
  { id: 'promesse', name: 'Promesse Éternelle', members: ['goku', 'chichi'], req: ['kame', 'rayon_casque'], ki: [8, 6], target: 'allEnemies', kind: 'ki2', pow: 3.4, anim: 'dualBlast', desc: 'Goku et Chichi unissent Kamehameha et rayon du casque.' },
  { id: 'loup_volant', name: 'Loup Volant', members: ['yamcha', 'puar'], req: ['rogafu', 'pique'], ki: [5, 4], target: 'allEnemies', kind: 'phys', pow: 2.6, anim: 'dualStrike', desc: 'Puar porte Yamcha dans les airs pour une attaque plongeante.' },
  { id: 'capsule_grenade', name: 'Capsule Grenade', members: ['bulma', 'lunch'], req: ['bombe', 'grenade'], ki: [5, 5], target: 'allEnemies', kind: 'kistun', pow: 2.2, dur: 160, anim: 'dualBlast', desc: 'Bulma et Lunch bombardent tout le monde.' },
);
// Techniques utilisables selon la forme du héros (Lunch douce ou blonde)
function availTechs(m) { return (m.techs || []).filter(id => TECHS[id] && (!TECHS[id].form || TECHS[id].form === (m.form || 'douce'))); }

const Heroes = (() => {
  const FORMS = { douce: { atk: 0.75, mag: 1.2 }, blonde: { atk: 1.35, mag: 0.65, spd: 1.1 } };
  function statMul(m, k) { return m.id === 'lunch' ? (FORMS[m.form || 'douce'][k] || 1) : 1; }
  function atkMul(c) {
    const B = Battle.state();
    if (c.m && c.m.id === 'chichi' && B && B.party.some(p => p.id === 'goku' && p.hp <= 0)) return 1.5; // colère de Chichi
    return 1;
  }
  function dodge(c) { return c.m && c.m.id === 'puar' ? 0.3 : 0; }
  // éternuement : Lunch change de personnalité
  function sneeze(c, B) {
    const m = c.m || c;
    m.form = m.form === 'blonde' ? 'douce' : 'blonde';
    recalcStats(m);
    if (c.m) c.sprite = lookKey(m);
    if (B) {
      B.fx.push({ type: 'smoke', x: c.x, y: c.y - 14, life: 26, t: 0 });
      B.fx.push({ type: 'text', x: c.x, y: c.y - 44, str: 'Atchoum !', c: '#ffffff', life: 50, t: 0 });
      B.msg = { str: m.form === 'blonde' ? 'Lunch devient blonde... et dangereuse !' : 'Lunch redevient douce et gentille.', t: 90 };
    }
    SND.sfx('miss');
  }
  function onTurn(c, B) { if (c.m && c.m.id === 'lunch' && Math.random() < 0.15) sneeze(c, B); }

  async function techAnim(T, a, targets, H) {
    const t = targets[0];
    switch (T.kind) {
      case 'sneeze': { sneeze(a, Battle.state()); await H.wait(40); break; }
      case 'sleep': {
        a.pose = 'attack';
        for (let i = 0; i < 4; i++) { H.fx('text', { x: a.x + 6 + i * 6, y: a.y - 30 - i * 4, str: 'z', c: '#a0c0ff', life: 40 }); await H.wait(6); }
        SND.sfx('heal');
        await H.wait(16);
        for (const e of targets) H.status(e, 'sleep', 0.55);
        await H.wait(20); a.pose = null;
        break;
      }
      case 'gun': {
        a.pose = 'attack';
        for (let i = 0; i < T.hits; i++) {
          if (t.dead || t.hp <= 0) break;
          SND.sfx('blast');
          const [tx, ty] = H.center(t);
          H.fx('orb', { x1: a.x + 8, y1: a.y - 14, x2: tx + (i % 2 ? 3 : -3), y2: ty, life: 7, r: 2, c: '#ffe060' });
          await H.wait(7);
          H.damage(t, Math.max(1, Math.round(H.kiDmg(a, t, T.pow, 0.25))));
          await H.wait(3);
        }
        a.pose = null;
        break;
      }
      case 'transfo': {
        const form = pick(['Chauve-souris', 'Ciseaux géants', 'Puar géant', 'Nuage doux']);
        H.fx('smoke', { x: a.x, y: a.y - 14, life: 30 });
        SND.sfx('door');
        await H.wait(16);
        H.message('Métamorphose : ' + form + ' !', 70);
        if (form === 'Chauve-souris') await H.melee(a, t, async () => { await H.physicalHit(a, t, 1.3); a.hp = Math.min(a.maxhp, a.hp + Math.round(a.maxhp * 0.12)); }, { fast: true });
        else if (form === 'Ciseaux géants') await H.melee(a, t, async () => { const n = Math.round(H.physDmg(a, t, 2.2) * (Math.random() < 0.4 ? 1.5 : 1)); H.damage(t, n, { big: true }); }, { hold: 12 });
        else if (form === 'Puar géant') await H.melee(a, t, () => H.physicalHit(a, t, 2.8, { big: true, knock: true }), { hold: 14 });
        else { SND.sfx('heal'); for (const p of H.party()) if (p.hp > 0) { H.fx('sparkle', { x: p.x, y: p.y, life: 30, c: '#c0e8ff' }); H.heal(p, Math.round(a.mag * 1.4 + 24)); H.cure(p); } await H.wait(30); }
        H.fx('smoke', { x: a.x, y: a.y - 14, life: 24 });
        break;
      }
      case 'kistun': { // ultrason
        a.pose = 'attack';
        SND.sfx('flash');
        for (let i = 0; i < 3; i++) { for (const e of targets) { const [x, y] = H.center(e); H.fx('boom', { x, y, r: 8 + i * 4, life: 14, c1: '#a0a8ff', c2: '#e0e8ff', c3: '#ffffff' }); } await H.wait(6); }
        for (const e of targets) { H.damage(e, H.kiDmg(a, e, T.pow)); H.status(e, 'stun', 0.45, 160); }
        await H.wait(24); a.pose = null;
        break;
      }
      case 'phys': { // tornade de Chichi
        const home = [a.x, a.y];
        SND.sfx('swing');
        for (const e of targets) {
          if (e.dead || e.hp <= 0) continue;
          a.walking = true;
          await Tasks.tween(a, { x: e.x - 16, y: e.y }, 7);
          a.walking = false; a.pose = 'attack';
          H.fx('spark', { x: e.x, y: e.y - 14 });
          SND.sfx('hit');
          H.damage(e, H.physDmg(a, e, T.pow), { big: true });
          await H.wait(6); a.pose = null;
        }
        a.walking = true;
        await Tasks.tween(a, { x: home[0], y: home[1] }, 12);
        a.walking = false;
        break;
      }
    }
  }

  // ---------- Recrutement ----------
  async function recruitLunch(e) {
    await UI.say('Lunch', 'Oh, bonjour ! Je m\'appelle Lunch. Je fais la cuisine et le ménage pour Tortue Géniale. Vous voulez du thé ?');
    await UI.say('Goku', 'Ouais ! Et des gâteaux aussi !');
    await UI.say('Lunch', 'Hi hi ! Oh... j\'ai le nez qui me chatouille... A... a... ATCHOUM !');
    SND.sfx('miss');
    Field.effects.push({ type: 'smoke', x: e.x, y: e.y - 14, t: 30 });
    e.sprite = 'lunch_b';
    await UI.say('Lunch', 'Hein ?! C\'est qui, vous, les mioches ?! Vous lorgnez mon trésor ? Je vais vous trouer la peau !');
    await UI.say('Krilin', 'Elle... elle a changé de couleur de cheveux ! Et de caractère !');
    await UI.say('Tortue Géniale', 'Ho ho ! Lunch change de personnalité chaque fois qu\'elle éternue. Douce et gentille... ou blonde et redoutable !');
    const r = await UI.ask('Goku', 'Elle est super forte ! Lunch, tu viens avec nous ?', ['Bienvenue, Lunch !', 'Peut-être plus tard']);
    if (r !== 0) { e.sprite = 'lunch'; await UI.say('Lunch', '(Elle éternue à nouveau...) Oh ! Pardon, je me suis encore emportée ? Revenez quand vous voulez !'); return; }
    await UI.say('Lunch', 'Pff ! D\'accord, mais c\'est moi qui commande ! ... Atchoum ! Oh, je serai ravie de vous accompagner !');
    e.sprite = 'lunch';
    await joinParty('lunch', e);
    if (!Game.flags.lunchTip) { Game.flags.lunchTip = true; await UI.say(null, 'En combat, Lunch éternue parfois et change de personnalité : soins et berceuse quand elle est douce, mitraillette et grenades quand elle est blonde. « Atchoum ! » change de forme à volonté.'); }
  }
  async function recruitPuar(e) {
    await UI.say('Puar', 'Goku ! Yamcha s\'entraîne tout seul dans les montagnes... Moi aussi, je veux devenir fort !');
    await UI.say('Puar', 'Je peux me transformer en n\'importe quoi pendant cinq minutes ! Et je vole, alors les coups ont du mal à me toucher !');
    const r = await UI.ask('Goku', 'Tu viens avec nous, Puar ?', ['Bien sûr !', 'Plus tard']);
    if (r !== 0) return;
    await joinParty('puar', e);
  }
  async function recruitChichi(e) {
    const F = Game.flags;
    if (F.chichiPromise) {
      await UI.say('Chichi', 'Goku ! Tu te souviens de ta promesse, hein ? Un jour, tu viendras me chercher...');
      await UI.say('Chichi', 'Mais en attendant, je ne vais pas rester là à t\'attendre ! Je veux m\'entraîner avec toi et devenir encore plus forte !');
    } else if (F.castleDestroyed && F.wish !== 'chateau') {
      await UI.say('Chichi', 'Hmpf ! Toi... Tu as détruit notre château. Papa et moi vivons sous une tente à cause de toi !');
      await UI.say('Chichi', 'Pour te faire pardonner, tu vas m\'emmener avec toi. Je veux voir le monde... et te surveiller !');
    } else {
      await UI.say('Chichi', 'Goku ! Papa dit qu\'une princesse doit savoir se battre. Emmène-moi avec toi, je veux m\'entraîner !');
    }
    const r = await UI.ask('Goku', 'Chichi veut rejoindre l\'équipe.', ['D\'accord, Chichi !', 'Plus tard']);
    if (r !== 0) { await UI.say('Chichi', 'Bon... Je t\'attends ici, alors ! Promis-promis !'); return; }
    await UI.say('Chichi', 'Youpi ! Attention, je suis bien plus forte que la dernière fois !');
    await joinParty('chichi', e);
    if (!F.chichiTip) { F.chichiTip = true; await UI.say(null, 'Si Goku est mis K.O., Chichi entre dans une colère noire : sa force augmente de moitié !'); }
  }

  // points de recrutement : Lunch à la Kame House, Puar à l'oasis (s'il n'est pas déjà avec Yamcha)
  const plage = MAPS.plage.entities;
  MAPS.plage.entities = () => plage().concat([npc('lunch_npc', 'lunch', 31, 17, recruitLunch, { cond: () => !!Game.flags.ch8 && !Game.member('lunch') })]);
  const desert = MAPS.desert.entities;
  MAPS.desert.entities = () => desert().concat([{ kind: 'npc', id: 'puar_npc', mon: 'puar', tx: 24, ty: 9, fly: true, talk: recruitPuar, cond: () => !!Game.flags.ch8 && !Game.member('puar') }]);

  return { statMul, atkMul, dodge, onTurn, sneeze, techAnim, recruitLunch, recruitPuar, recruitChichi };
})();
window.Heroes = Heroes;
