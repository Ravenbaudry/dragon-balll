// Données de jeu : héros, techniques, objets, ennemis, quêtes.
const MEMBERS = {
  goku: {
    name: 'Goku', sprite: 'goku',
    base: { hp: 62, ki: 12, atk: 12, def: 8, mag: 9, spd: 12 },
    grow: { hp: 13, ki: 2, atk: 3, def: 1.6, mag: 2.2, spd: 0.6 },
    techs: [['baton', 1], ['janken', 3], ['kame', 6], ['kame_geant', 13]],
  },
  bulma: {
    name: 'Bulma', sprite: 'bulma',
    base: { hp: 46, ki: 18, atk: 7, def: 6, mag: 12, spd: 10 },
    grow: { hp: 9, ki: 3, atk: 1.4, def: 1.2, mag: 2.8, spd: 0.5 },
    techs: [['soin', 1], ['pistolet', 1], ['bombe', 4], ['reveil', 7], ['soin_total', 10]],
  },
  krillin: {
    name: 'Krilin', sprite: 'krillin',
    base: { hp: 58, ki: 14, atk: 11, def: 9, mag: 10, spd: 13 },
    grow: { hp: 12, ki: 2.4, atk: 2.7, def: 1.7, mag: 2.4, spd: 0.7 },
    techs: [['rafale', 1], ['taiyoken', 1], ['kame_k', 7], ['kienzan', 12]],
  },
  yamcha: {
    name: 'Yamcha', sprite: 'yamcha',
    base: { hp: 70, ki: 14, atk: 15, def: 10, mag: 11, spd: 15 },
    grow: { hp: 13, ki: 2.2, atk: 3.1, def: 1.7, mag: 2.2, spd: 0.8 },
    techs: [['rogafu', 1], ['croc', 1], ['sokidan', 14]],
  },
  oolong: {
    name: 'Oolong', sprite: 'oolong',
    base: { hp: 52, ki: 16, atk: 8, def: 8, mag: 10, spd: 11 },
    grow: { hp: 10, ki: 2.6, atk: 1.9, def: 1.5, mag: 2.4, spd: 0.6 },
    techs: [['transfo', 1], ['gateau', 1], ['gaz', 9]],
  },
};

function xpToNext(lv) { return Math.round(8 + 12 * lv + 2.6 * lv * lv); }
function statsAt(id, lv) {
  const d = MEMBERS[id], s = {};
  for (const k in d.base) s[k] = Math.floor(d.base[k] + d.grow[k] * (lv - 1));
  return s;
}
function makeMember(id, lv = 1) {
  const s = statsAt(id, lv);
  const m = { id, name: MEMBERS[id].name, lv, xp: 0, maxhp: s.hp, maxki: s.ki, hp: s.hp, ki: s.ki, atk: s.atk, def: s.def, mag: s.mag, spd: s.spd, techs: [], bonus: {} };
  refreshTechs(m);
  return m;
}
function refreshTechs(m) {
  const learned = [];
  for (const [t, lv] of MEMBERS[m.id].techs) if (m.lv >= lv && !m.techs.includes(t)) { m.techs.push(t); learned.push(t); }
  return learned;
}
// Bonus permanents (choix de l'histoire) : { atk: 2, def: 1, ... }
function applyBonus(m, b) {
  m.bonus = m.bonus || {};
  for (const k in b) {
    m.bonus[k] = (m.bonus[k] || 0) + b[k];
    if (k === 'hp') { m.maxhp += b[k]; m.hp += b[k]; } else if (k === 'ki') { m.maxki += b[k]; m.ki += b[k]; } else m[k] += b[k];
  }
}
// Recalcule les statistiques : base du niveau + bonus permanents + équipement, puis compétences et formes (progress.js)
function recalcStats(m) {
  const s = statsAt(m.id, m.lv), b = m.bonus || {}, e = gearStats(m);
  const mul = k => (typeof Prog !== 'undefined' ? Prog.statMul(m, k) : 1);
  const nhp = Math.round((s.hp + (b.hp || 0) + (e.hp || 0)) * mul('hp')), nki = Math.round((s.ki + (b.ki || 0) + (e.ki || 0)) * mul('ki'));
  m.hp = Math.min(nhp, Math.max(m.hp > 0 ? 1 : 0, m.hp + nhp - m.maxhp)); m.ki = Math.min(nki, Math.max(0, m.ki + nki - m.maxki));
  m.maxhp = nhp; m.maxki = nki;
  for (const k of ['atk', 'def', 'mag', 'spd']) m[k] = Math.round((s[k] + (b[k] || 0) + (e[k] || 0)) * mul(k));
}
function levelUp(m) {
  m.lv++;
  recalcStats(m);
  return refreshTechs(m);
}

const TECHS = {
  baton: { name: 'Bâton Magique', ki: 2, target: 'enemy', kind: 'phys', pow: 1.7, anim: 'staff', desc: 'Grand coup de Nyoibo, le bâton qui s\'allonge.' },
  janken: { name: 'Jan Ken', ki: 4, target: 'enemy', kind: 'janken', pow: 1, anim: 'janken', desc: 'Pierre, ciseaux ou papier : effet au hasard !' },
  kame: { name: 'Kamehameha', ki: 8, target: 'enemy', kind: 'ki', pow: 3.2, anim: 'beam', desc: 'La célèbre vague déferlante de la Tortue.' },
  kame_geant: { name: 'Kamehameha Géant', ki: 16, target: 'allEnemies', kind: 'ki', pow: 2.7, anim: 'beamAll', desc: 'Une vague immense qui frappe tous les ennemis.' },
  soin: { name: 'Capsule Soin', ki: 3, target: 'ally', kind: 'heal', pow: 2.0, base: 24, anim: 'heal', field: true, desc: 'Une capsule médicale qui soigne un allié (et ses états).' },
  pistolet: { name: 'Pistolet', ki: 2, target: 'enemy', kind: 'gun', pow: 1.3, anim: 'gun', desc: 'Tir précis qui ignore une partie de la défense.' },
  bombe: { name: 'Capsule Bombe', ki: 6, target: 'allEnemies', kind: 'ki', pow: 1.5, anim: 'bomb', desc: 'Une capsule explosive pour tous les ennemis.' },
  reveil: { name: 'Capsule Réveil', ki: 8, target: 'allyKO', kind: 'revive', pow: 0.5, anim: 'heal', field: true, desc: 'Ranime un allié K.O. avec la moitié de ses PV.' },
  soin_total: { name: 'Soin Total', ki: 12, target: 'allAllies', kind: 'heal', pow: 1.6, base: 40, anim: 'healAll', field: true, desc: 'Soigne toute l\'équipe.' },
  rafale: { name: 'Rafale', ki: 3, target: 'enemy', kind: 'multi', pow: 0.75, hits: 3, anim: 'multi', desc: 'Trois coups ultra-rapides.' },
  taiyoken: { name: 'Taiyoken', ki: 4, target: 'allEnemies', kind: 'stun', dur: 260, anim: 'flash', desc: 'Lumière aveuglante : les ennemis sont paralysés.' },
  kame_k: { name: 'Kamehameha', ki: 8, target: 'enemy', kind: 'ki', pow: 2.9, anim: 'beam', desc: 'Le Kamehameha appris auprès de Tortue Géniale.' },
  kienzan: { name: 'Kienzan', ki: 12, target: 'enemy', kind: 'pierce', pow: 3.4, anim: 'disc', desc: 'Disque d\'énergie tranchant : ignore la défense.' },
  rogafu: { name: 'Poing du Loup', ki: 5, target: 'enemy', kind: 'multi', pow: 0.58, hits: 4, anim: 'multi', desc: 'La danse des crocs du loup : quatre frappes sauvages.' },
  croc: { name: 'Croc du Loup', ki: 3, target: 'enemy', kind: 'phys', pow: 2.0, anim: 'strike', desc: 'Un coup de griffe foudroyant.' },
  sokidan: { name: 'Sokidan', ki: 10, target: 'enemy', kind: 'ki', pow: 3.5, anim: 'orb', desc: 'Une boule d\'énergie guidée par la pensée.' },
  transfo: { name: 'Transformation', ki: 5, target: 'enemy', kind: 'transfo', pow: 1, anim: 'transfo', desc: 'Oolong se transforme... en quoi ? Surprise !' },
  gateau: { name: 'Gâteau Partagé', ki: 6, target: 'allAllies', kind: 'heal', pow: 1.0, base: 22, anim: 'healAll', field: true, desc: 'Oolong partage (à contrecœur) ses gâteaux.' },
  gaz: { name: 'Gaz Puant', ki: 7, target: 'allEnemies', kind: 'kistun', pow: 1.0, dur: 160, anim: 'gas', desc: 'Une odeur insoutenable : dégâts, paralysie et poison.' },
};
// Techniques doubles (à la Chrono Trigger) : les deux héros doivent être prêts.
const DUALS = [
  { id: 'capsule_frappe', name: 'Capsule Frappe', members: ['goku', 'bulma'], req: ['baton', 'bombe'], ki: [4, 5], target: 'allEnemies', kind: 'phys', pow: 2.5, anim: 'dualBomb', desc: 'Bulma lance une capsule, Goku la frappe au bâton !' },
  { id: 'double_kame', name: 'Double Kamehameha', members: ['goku', 'krillin'], req: ['kame', 'kame_k'], ki: [8, 8], target: 'allEnemies', kind: 'ki2', pow: 3.6, anim: 'dualBeam', desc: 'Deux Kamehameha combinés.' },
  { id: 'flash_bombe', name: 'Flash Bombe', members: ['krillin', 'bulma'], req: ['taiyoken', 'bombe'], ki: [4, 5], target: 'allEnemies', kind: 'kistun', pow: 1.7, dur: 200, anim: 'dualFlash', desc: 'Taiyoken suivi d\'une explosion.' },
  { id: 'double_croc', name: 'Double Croc', members: ['goku', 'yamcha'], req: ['baton', 'croc'], ki: [4, 4], target: 'allEnemies', kind: 'phys', pow: 2.4, anim: 'dualStrike', desc: 'Goku et Yamcha fondent sur tous les ennemis.' },
  { id: 'rafale_loup', name: 'Rafale du Loup', members: ['krillin', 'yamcha'], req: ['rafale', 'rogafu'], ki: [5, 5], target: 'allEnemies', kind: 'phys', pow: 2.2, anim: 'dualStrike', desc: 'Un déluge de coups à deux.' },
  { id: 'capsule_farceuse', name: 'Capsule Farceuse', members: ['bulma', 'oolong'], req: ['bombe', 'transfo'], ki: [5, 4], target: 'allEnemies', kind: 'kistun', pow: 1.8, dur: 180, anim: 'dualBlast', desc: 'Oolong devient bombe, Bulma la lance !' },
  { id: 'taureau_kame', name: 'Taureau Kamehameha', members: ['goku', 'oolong'], req: ['kame', 'transfo'], ki: [8, 4], target: 'allEnemies', kind: 'ki2', pow: 3.0, anim: 'dualBlast', desc: 'Goku chevauche Oolong-taureau et charge !' },
  { id: 'loup_kame', name: 'Hurlement Kamé', members: ['krillin', 'yamcha'], req: ['kame_k', 'sokidan'], ki: [8, 8], target: 'allEnemies', kind: 'ki2', pow: 3.4, anim: 'dualBlast', desc: 'Kamehameha et Sokidan fusionnés.' },
];

// Techniques à trois : les trois héros doivent être prêts en même temps.
const TRIPLES = [
  { id: 'triple_kame', name: 'Triple Kamehameha', members: ['goku', 'krillin', 'yamcha'], req: ['kame', 'kame_k', 'sokidan'], ki: [10, 10, 10], target: 'allEnemies', kind: 'ki', pow: 4.4, anim: 'tripleBeam', desc: 'Trois vagues d\'énergie qui n\'en font plus qu\'une.' },
  { id: 'grande_farce', name: 'Grande Farce', members: ['bulma', 'oolong', 'puar'], req: ['bombe', 'transfo', 'metamorphose'], ki: [6, 6, 6], target: 'allEnemies', kind: 'kistun', pow: 2.6, dur: 240, anim: 'tripleBlast', desc: 'Oolong et Puar se changent en bombes, Bulma les lance !' },
  { id: 'ruee_tortue', name: 'Ruée de la Tortue', members: ['goku', 'krillin', 'chichi'], req: ['baton', 'rafale', 'coup_pied'], ki: [6, 6, 6], target: 'allEnemies', kind: 'phys', pow: 3.6, anim: 'tripleStrike', desc: 'Trois élèves déchaînés frappent tous les ennemis.' },
  { id: 'pique_nique', name: 'Pique-nique Explosif', members: ['bulma', 'lunch', 'oolong'], req: ['soin', 'the_lunch', 'gateau'], ki: [6, 6, 6], target: 'allAllies', kind: 'heal', pow: 2.2, anim: 'tripleHeal', desc: 'Thé, gâteaux et capsule de soin : toute l\'équipe soignée et purifiée.' },
];

const ITEMS = {
  tonique: { name: 'Tonique', desc: 'Rend 60 PV à un allié.', price: 20, target: 'ally', hp: 60 },
  super_tonique: { name: 'Super Tonique', desc: 'Rend 220 PV à un allié.', price: 90, target: 'ally', hp: 220 },
  boisson_ki: { name: 'Boisson Ki', desc: 'Rend 15 points de Ki.', price: 45, target: 'ally', ki: 15 },
  capsule_vie: { name: 'Capsule de Vie', desc: 'Ranime un allié K.O. (50% PV).', price: 120, target: 'allyKO', revive: 0.5 },
  senzu: { name: 'Haricot Magique', desc: 'Rend tous les PV et le Ki, ranime.', price: 0, target: 'allyAny', full: true },
  remede: { name: 'Remède', desc: 'Soigne poison, brûlure, sommeil et paralysie (+40 PV).', price: 35, target: 'ally', hp: 40, cure: true },
  herbe: { name: 'Herbe Médicinale', desc: 'Une herbe rare qui pousse près de l\'étang de la forêt.', key: true },
  marchandise: { name: 'Sac du Marchand', desc: 'Les marchandises volées par les brigands.', key: true },
  boussole: { name: 'Boussole Dorée', desc: 'La boussole perdue du nomade de l\'oasis.', key: true },
  capsule_vide: { name: 'Capsule Vide', desc: 'Une « super capsule »... complètement vide. Arnaque !', key: true },
  carte: { name: 'Plan du Château', desc: 'Un plan volé aux espions de Pilaf. On y voit une sortie secrète.', key: true },
};

// spr = sprite de monstre, char = sprite humanoïde
const ENEMIES = {
  loup: { name: 'Loup', spr: 'loup', hp: 26, atk: 10, def: 4, spd: 10, xp: 9, zeni: 4, drop: ['tonique', 0.12] },
  dino: { name: 'P\'tit Dino', spr: 'dino', hp: 36, atk: 11, def: 6, spd: 6, xp: 11, zeni: 6, drop: ['tonique', 0.15], drops: [['viande', 0.3]] },
  ptero: { name: 'Ptérodactyle', spr: 'ptero', hp: 30, atk: 12, def: 4, spd: 14, xp: 12, zeni: 7, fly: true },
  tigre: { name: 'Tigre à dents de sabre', spr: 'tigre', hp: 72, atk: 18, def: 9, spd: 12, xp: 22, zeni: 14, drop: ['tonique', 0.2], drops: [['viande', 0.4]] },
  loup_noir: { name: 'Loup Noir', spr: 'loup_noir', hp: 60, atk: 19, def: 8, spd: 15, xp: 20, zeni: 9 },
  dino_rouge: { name: 'Dino Rouge', spr: 'dino_rouge', hp: 84, atk: 20, def: 10, spd: 8, xp: 24, zeni: 12, drop: ['boisson_ki', 0.15], drops: [['viande', 0.35]] },
  ours: {
    name: 'Ours Brigand', spr: 'ours', hp: 260, atk: 20, def: 10, spd: 9, xp: 110, zeni: 150, boss: true, drops: [['viande', 1], ['fruit', 1]],
    skills: [{ name: 'Coup de Sabre', target: 'one', pow: 1.6, chance: 0.3 }, { name: 'Sabre Tourbillon', target: 'all', pow: 0.9, chance: 0.22 }],
  },
  shu_espion: { name: 'Shu', char: 'shu', hp: 110, atk: 17, def: 7, spd: 15, xp: 30, zeni: 40, skills: [{ name: 'Shuriken', target: 'one', pow: 1.3, chance: 0.3 }] },
  mai_espion: { name: 'Mai', char: 'mai', hp: 95, atk: 16, def: 6, spd: 13, xp: 30, zeni: 40, skills: [{ name: 'Tir de Pistolet', target: 'one', pow: 1.3, chance: 0.3 }] },
  crabe: { res: { phys: 0.6, ki: 1.3 }, name: 'Crabe Géant', spr: 'crabe', hp: 95, atk: 22, def: 20, spd: 8, xp: 26, zeni: 16, drop: ['tonique', 0.2] },
  mouette: { name: 'Mouette Pirate', spr: 'mouette', hp: 66, atk: 22, def: 8, spd: 18, xp: 24, zeni: 12, fly: true },
  krilin_duel: { name: 'Krilin', char: 'krillin', hp: 240, atk: 21, def: 10, spd: 14, xp: 70, zeni: 0, boss: true, skills: [{ name: 'Rafale', target: 'one', pow: 0.62, hits: 3, chance: 0.35 }] },
  bandit: { name: 'Bandit', char: 'bandit', hp: 115, atk: 27, def: 13, spd: 12, xp: 32, zeni: 30, drop: ['boisson_ki', 0.15] },
  chef_brigand: {
    name: 'Chef Brigand', char: 'brigand', hp: 480, atk: 30, def: 14, spd: 12, xp: 160, zeni: 220, boss: true,
    skills: [{ name: 'Coup de Massue', target: 'one', pow: 1.7, chance: 0.3 }, { name: 'Bombe Fumigène', target: 'all', pow: 0.8, chance: 0.2, st: 'stun', sc: 0.3 }],
  },
  taureau: {
    name: 'Oolong Monstre', spr: 'taureau', hp: 820, atk: 31, def: 15, spd: 11, xp: 240, zeni: 260, boss: true,
    skills: [{ name: 'Charge Bestiale', target: 'one', pow: 1.7, chance: 0.3 }, { name: 'Souffle Puant', target: 'all', pow: 0.85, chance: 0.25, st: 'poison', sc: 0.5 }],
  },
  scorpion: { immune: ['poison'], name: 'Scorpion des Sables', spr: 'scorpion', hp: 145, atk: 34, def: 18, spd: 12, xp: 40, zeni: 20, drop: ['remede', 0.2], skills: [{ name: 'Dard Venimeux', target: 'one', pow: 1.1, chance: 0.25, st: 'poison', sc: 0.6 }] },
  serpent: { name: 'Serpent du Désert', spr: 'serpent_sable', hp: 125, atk: 33, def: 12, spd: 17, xp: 38, zeni: 18, skills: [{ name: 'Morsure', target: 'one', pow: 1.1, chance: 0.2, st: 'poison', sc: 0.5 }] },
  brigand: { name: 'Brigand du Désert', char: 'brigand', hp: 165, atk: 36, def: 15, spd: 13, xp: 46, zeni: 45, drop: ['super_tonique', 0.12] },
  yamcha: {
    name: 'Yamcha', char: 'yamcha', hp: 900, atk: 38, def: 20, spd: 20, xp: 380, zeni: 320, boss: true,
    skills: [{ name: 'Poing du Loup', target: 'one', pow: 0.62, hits: 4, chance: 0.35 }, { name: 'Croc du Loup', target: 'one', pow: 1.6, chance: 0.2 }],
  },
  puar: { name: 'Puar', spr: 'puar', hp: 170, atk: 22, def: 10, spd: 22, xp: 40, zeni: 30, fly: true },
  chichi: { name: 'Chichi', char: 'chichi', hp: 420, atk: 34, def: 16, spd: 19, xp: 160, zeni: 0, boss: true, skills: [{ name: 'Rayon du Casque', target: 'one', pow: 1.6, chance: 0.35, beam: true, c1: '#e83880', c2: '#ffa0d0' }] },
  salamandre: { immune: ['burn'], name: 'Salamandre', spr: 'salamandre', hp: 180, atk: 42, def: 18, spd: 14, xp: 62, zeni: 26, drop: ['tonique', 0.25], skills: [{ name: 'Crachat de Feu', target: 'one', pow: 1.3, chance: 0.2, st: 'burn', sc: 0.5 }] },
  salamandre_bleue: { immune: ['burn'], name: 'Salamandre Bleue', spr: 'salamandre_bleue', hp: 230, atk: 47, def: 22, spd: 16, xp: 76, zeni: 32, drop: ['boisson_ki', 0.2] },
  follet: { res: { phys: 0.5, ki: 1.3 }, immune: ['burn', 'poison'], name: 'Feu Follet', spr: 'follet', hp: 130, atk: 40, def: 10, spd: 22, xp: 56, zeni: 22, fly: true, skills: [{ name: 'Flammèche', target: 'all', pow: 0.6, chance: 0.25, st: 'burn', sc: 0.3 }] },
  golem: { res: { phys: 0.6, ki: 1.4 }, immune: ['burn'], name: 'Golem de Lave', spr: 'golem', hp: 320, atk: 46, def: 30, spd: 7, xp: 84, zeni: 38, drop: ['super_tonique', 0.2] },
  volcan: { immune: ['burn'], res: { ki: 0.85 },
    name: 'Esprit du Volcan', spr: 'volcan', hp: 2200, atk: 48, def: 24, spd: 12, xp: 720, zeni: 500, boss: true, big: true,
    skills: [{ name: 'Pluie de Lave', target: 'all', pow: 1.0, chance: 0.3, st: 'burn', sc: 0.35 }, { name: 'Poing de Magma', target: 'one', pow: 1.8, chance: 0.25 }],
  },
  robot: { res: { phys: 0.8, ki: 1.3 }, immune: ['poison', 'sleep'], name: 'Robot Garde', char: 'robot', hp: 260, atk: 52, def: 28, spd: 9, xp: 88, zeni: 40, drop: ['boisson_ki', 0.2] },
  soldat: { name: 'Soldat de Pilaf', char: 'soldier', hp: 230, atk: 50, def: 22, spd: 15, xp: 82, zeni: 55, drop: ['super_tonique', 0.15] },
  shu: { name: 'Shu', char: 'shu', hp: 420, atk: 45, def: 20, spd: 18, xp: 140, zeni: 80, skills: [{ name: 'Lame Ninja', target: 'one', pow: 1.5, chance: 0.3, st: 'poison', sc: 0.3 }] },
  mai: { name: 'Mai', char: 'mai', hp: 380, atk: 43, def: 18, spd: 16, xp: 140, zeni: 80, skills: [{ name: 'Rafale de Fusil', target: 'all', pow: 0.7, chance: 0.3 }] },
  // Chapitre 7 : Goku transformé en singe géant. Seule la queue peut être vaincue.
  oozaru: { immune: ['sleep', 'poison'],
    name: 'Goku (singe géant)', spr: 'oozaru', hp: 9999, atk: 54, def: 60, spd: 10, xp: 0, zeni: 0, boss: true, big: true, unkillable: true, slot: [176, 122],
    skills: [{ name: 'Poing géant', target: 'one', pow: 1.7, chance: 0.3 }, { name: 'Rugissement', target: 'all', pow: 0.8, chance: 0.18, st: 'stun', sc: 0.25 }, { name: 'Rayon buccal', target: 'all', pow: 1.3, chance: 0.12, beam: true, c1: '#e8a020', c2: '#fff0a0' }],
  },
  queue: { immune: ['sleep', 'poison', 'burn', 'stun'], name: 'Queue', spr: 'queue', hp: 900, atk: 1, def: 12, spd: 1, xp: 650, zeni: 0, passive: true, kills: 'oozaru', slot: [206, 124] },
  machine: { res: { phys: 0.8, ki: 1.2 }, immune: ['poison', 'sleep'],
    name: 'Pilaf Machine', spr: 'machine', hp: 2300, atk: 56, def: 30, spd: 12, xp: 0, zeni: 0, boss: true, big: true,
    skills: [{ name: 'Missiles Pilaf', target: 'all', pow: 1.05, chance: 0.28, st: 'burn', sc: 0.2 }, { name: 'Pince Broyeuse', target: 'one', pow: 1.8, chance: 0.25 }, { name: 'Laser Impérial', target: 'one', pow: 2.2, chance: 0.12, beam: true, c1: '#e83030', c2: '#ffb0a0' }],
  },
};

const BALL_HINTS = {
  1: 'Château de Pilaf', 2: 'Forêt de Paozou', 3: 'Kame House', 4: 'Maison de Goku',
  5: 'Village d\'Aru', 6: 'Mont Frypan', 7: 'Château de Pilaf',
};

// Journal : chaque quête a un titre et une description par étape.
const QUESTS = {
  main: {
    title: 'Les 7 Boules de Cristal', main: true,
    steps: {
      paozu: 'Le radar de Bulma indique une boule dans la forêt de Paozou, à l\'est.',
      plage: 'Une boule se trouve sur une île, près d\'une drôle de maison rose au sud de la forêt.',
      village: 'Le radar indique une boule au village d\'Aru, de l\'autre côté de la montagne.',
      desert: 'Une boule se cache dans le désert de Diablo, au nord du village... ou pas ?',
      frypan: 'Le radar indique le Mont Frypan, à l\'est du désert. Une fumée noire s\'en échappe...',
      chateau: 'Les deux dernières boules sont au château de l\'empereur Pilaf, au nord du désert.',
      evasion: 'Pilaf nous a tout volé ! S\'échapper de la prison et reprendre les boules.',
      done: 'Les sept boules ont été réunies.',
    },
  },
  tortue: { title: 'La tortue égarée', steps: { start: 'Un vieil homme de la plage a perdu sa tortue dans la forêt, près de l\'étang.', carry: 'Ramener la tortue au vieil homme de la Kame House.', done: 'La tortue est rentrée chez elle.' } },
  grandmere: { title: 'Le remède de la grand-mère', steps: { start: 'Une grand-mère du village est malade. Il lui faut une Herbe Médicinale de la forêt de Paozou.', herbe: 'Apporter l\'Herbe Médicinale à la grand-mère du village.', done: 'La grand-mère est guérie.' } },
  marchand: { title: 'Le marchand dévalisé', steps: { start: 'Des brigands ont volé un marchand sur la route de la montagne. Leur camp est à l\'ouest.', retour: 'Rapporter ses marchandises au marchand de la route.', done: 'Le marchand a retrouvé ses biens.' } },
  boussole: { title: 'La boussole du nomade', steps: { start: 'Le nomade de l\'oasis a perdu sa boussole dans le désert, près des rochers du sud-est.', retour: 'Rendre la boussole au nomade de l\'oasis.', done: 'Le nomade a retrouvé son chemin.' } },
  gyumao: { title: 'Le château en flammes', steps: { start: 'Le château du roi Gyumao brûle. Le feu vient du cœur du volcan : il faut vaincre l\'Esprit du Volcan.', done: 'Le feu est éteint et le château est sauvé.', detruit: 'Goku a pulvérisé le château pour récupérer la boule...' } },
};
