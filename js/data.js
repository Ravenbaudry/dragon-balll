// Données de jeu : héros, techniques, objets, ennemis.
const MEMBERS = {
  goku: {
    name: 'Goku', sprite: 'goku',
    base: { hp: 62, ki: 12, atk: 12, def: 8, mag: 9, spd: 12 },
    grow: { hp: 13, ki: 2, atk: 3, def: 1.6, mag: 2.2, spd: 0.6 },
    techs: [['baton', 1], ['janken', 3], ['kame', 6], ['kame_geant', 12]],
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
    techs: [['rafale', 1], ['taiyoken', 1], ['kame_k', 7], ['kienzan', 11]],
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
  const m = { id, name: MEMBERS[id].name, lv, xp: 0, maxhp: s.hp, maxki: s.ki, hp: s.hp, ki: s.ki, atk: s.atk, def: s.def, mag: s.mag, spd: s.spd, techs: [] };
  refreshTechs(m);
  return m;
}
function refreshTechs(m) {
  const learned = [];
  for (const [t, lv] of MEMBERS[m.id].techs) if (m.lv >= lv && !m.techs.includes(t)) { m.techs.push(t); learned.push(t); }
  return learned;
}
function levelUp(m) {
  m.lv++;
  const s = statsAt(m.id, m.lv);
  const dhp = s.hp - m.maxhp, dki = s.ki - m.maxki;
  m.maxhp = s.hp; m.maxki = s.ki; m.hp += dhp; m.ki += dki;
  m.atk = s.atk; m.def = s.def; m.mag = s.mag; m.spd = s.spd;
  return refreshTechs(m);
}

const TECHS = {
  baton: { name: 'Bâton Magique', ki: 2, target: 'enemy', kind: 'phys', pow: 1.7, anim: 'staff', desc: 'Grand coup de Nyoibo, le bâton qui s\'allonge.' },
  janken: { name: 'Jan Ken', ki: 4, target: 'enemy', kind: 'janken', pow: 1, anim: 'janken', desc: 'Pierre, ciseaux ou papier : effet au hasard !' },
  kame: { name: 'Kamehameha', ki: 8, target: 'enemy', kind: 'ki', pow: 3.2, anim: 'beam', desc: 'La célèbre vague déferlante de la Tortue.' },
  kame_geant: { name: 'Kamehameha Géant', ki: 16, target: 'allEnemies', kind: 'ki', pow: 2.7, anim: 'beamAll', desc: 'Une vague immense qui frappe tous les ennemis.' },
  soin: { name: 'Capsule Soin', ki: 3, target: 'ally', kind: 'heal', pow: 2.0, base: 24, anim: 'heal', field: true, desc: 'Une capsule médicale qui soigne un allié.' },
  pistolet: { name: 'Pistolet', ki: 2, target: 'enemy', kind: 'gun', pow: 1.3, anim: 'gun', desc: 'Tir précis qui ignore une partie de la défense.' },
  bombe: { name: 'Capsule Bombe', ki: 6, target: 'allEnemies', kind: 'ki', pow: 1.5, anim: 'bomb', desc: 'Une capsule explosive pour tous les ennemis.' },
  reveil: { name: 'Capsule Réveil', ki: 8, target: 'allyKO', kind: 'revive', pow: 0.5, anim: 'heal', field: true, desc: 'Ranime un allié K.O. avec la moitié de ses PV.' },
  soin_total: { name: 'Soin Total', ki: 12, target: 'allAllies', kind: 'heal', pow: 1.6, base: 40, anim: 'healAll', field: true, desc: 'Soigne toute l\'équipe.' },
  rafale: { name: 'Rafale', ki: 3, target: 'enemy', kind: 'multi', pow: 0.75, hits: 3, anim: 'multi', desc: 'Trois coups ultra-rapides.' },
  taiyoken: { name: 'Taiyoken', ki: 4, target: 'allEnemies', kind: 'stun', dur: 260, anim: 'flash', desc: 'Lumière aveuglante : les ennemis sont paralysés.' },
  kame_k: { name: 'Kamehameha', ki: 8, target: 'enemy', kind: 'ki', pow: 2.9, anim: 'beam', desc: 'Le Kamehameha appris auprès de Tortue Géniale.' },
  kienzan: { name: 'Kienzan', ki: 12, target: 'enemy', kind: 'pierce', pow: 3.4, anim: 'disc', desc: 'Disque d\'énergie tranchant : ignore la défense.' },
};
// Techniques doubles (à la Chrono Trigger) : les deux héros doivent être prêts.
const DUALS = [
  { id: 'capsule_frappe', name: 'Capsule Frappe', members: ['goku', 'bulma'], req: ['baton', 'bombe'], ki: [4, 5], target: 'allEnemies', kind: 'phys', pow: 2.5, anim: 'dualBomb', desc: 'Bulma lance une capsule, Goku la frappe au bâton !' },
  { id: 'double_kame', name: 'Double Kamehameha', members: ['goku', 'krillin'], req: ['kame', 'kame_k'], ki: [8, 8], target: 'allEnemies', kind: 'ki2', pow: 3.6, anim: 'dualBeam', desc: 'Deux Kamehameha combinés.' },
  { id: 'flash_bombe', name: 'Flash Bombe', members: ['krillin', 'bulma'], req: ['taiyoken', 'bombe'], ki: [4, 5], target: 'allEnemies', kind: 'kistun', pow: 1.7, dur: 200, anim: 'dualFlash', desc: 'Taiyoken suivi d\'une explosion.' },
];

const ITEMS = {
  tonique: { name: 'Tonique', desc: 'Rend 60 PV à un allié.', price: 20, target: 'ally', hp: 60 },
  super_tonique: { name: 'Super Tonique', desc: 'Rend 220 PV à un allié.', price: 90, target: 'ally', hp: 220 },
  boisson_ki: { name: 'Boisson Ki', desc: 'Rend 15 points de Ki.', price: 45, target: 'ally', ki: 15 },
  capsule_vie: { name: 'Capsule de Vie', desc: 'Ranime un allié K.O. (50% PV).', price: 120, target: 'allyKO', revive: 0.5 },
  senzu: { name: 'Haricot Magique', desc: 'Rend tous les PV et le Ki, ranime.', price: 0, target: 'allyAny', full: true },
};

// spr = sprite de monstre, char = sprite humanoïde
const ENEMIES = {
  loup: { name: 'Loup', spr: 'loup', hp: 26, atk: 10, def: 4, spd: 10, xp: 9, zeni: 4, drop: ['tonique', 0.12] },
  dino: { name: 'P\'tit Dino', spr: 'dino', hp: 36, atk: 11, def: 6, spd: 6, xp: 11, zeni: 6, drop: ['tonique', 0.15] },
  ptero: { name: 'Ptérodactyle', spr: 'ptero', hp: 30, atk: 12, def: 4, spd: 14, xp: 12, zeni: 7, fly: true },
  tigre: { name: 'Tigre à dents de sabre', spr: 'tigre', hp: 72, atk: 18, def: 9, spd: 12, xp: 22, zeni: 14, drop: ['tonique', 0.2] },
  loup_noir: { name: 'Loup Noir', spr: 'loup_noir', hp: 60, atk: 19, def: 8, spd: 15, xp: 20, zeni: 9 },
  dino_rouge: { name: 'Dino Rouge', spr: 'dino_rouge', hp: 84, atk: 20, def: 10, spd: 8, xp: 24, zeni: 12, drop: ['boisson_ki', 0.15] },
  ours: {
    name: 'Ours Brigand', spr: 'ours', hp: 260, atk: 20, def: 10, spd: 9, xp: 110, zeni: 150, boss: true,
    skills: [{ name: 'Coup de Sabre', target: 'one', pow: 1.6, chance: 0.3 }, { name: 'Sabre Tourbillon', target: 'all', pow: 0.9, chance: 0.22 }],
  },
  crabe: { name: 'Crabe Géant', spr: 'crabe', hp: 95, atk: 22, def: 20, spd: 8, xp: 26, zeni: 16, drop: ['tonique', 0.2] },
  mouette: { name: 'Mouette Pirate', spr: 'mouette', hp: 66, atk: 22, def: 8, spd: 18, xp: 24, zeni: 12, fly: true },
  bandit: { name: 'Bandit', char: 'bandit', hp: 115, atk: 27, def: 13, spd: 12, xp: 32, zeni: 30, drop: ['boisson_ki', 0.15] },
  taureau: {
    name: 'Oolong Monstre', spr: 'taureau', hp: 820, atk: 31, def: 15, spd: 11, xp: 240, zeni: 260, boss: true,
    skills: [{ name: 'Charge Bestiale', target: 'one', pow: 1.7, chance: 0.3 }, { name: 'Souffle Puant', target: 'all', pow: 0.85, chance: 0.25 }],
  },
  scorpion: { name: 'Scorpion des Sables', spr: 'scorpion', hp: 145, atk: 34, def: 18, spd: 12, xp: 40, zeni: 20, drop: ['tonique', 0.25] },
  serpent: { name: 'Serpent du Désert', spr: 'serpent_sable', hp: 125, atk: 33, def: 12, spd: 17, xp: 38, zeni: 18 },
  brigand: { name: 'Brigand du Désert', char: 'brigand', hp: 165, atk: 36, def: 15, spd: 13, xp: 46, zeni: 45, drop: ['super_tonique', 0.12] },
  yamcha: {
    name: 'Yamcha', char: 'yamcha', hp: 900, atk: 38, def: 20, spd: 20, xp: 380, zeni: 320, boss: true,
    skills: [{ name: 'Poing du Loup', target: 'one', pow: 0.62, hits: 4, chance: 0.35 }, { name: 'Coup du Croc', target: 'one', pow: 1.6, chance: 0.2 }],
  },
  puar: { name: 'Puar', spr: 'puar', hp: 170, atk: 22, def: 10, spd: 22, xp: 40, zeni: 30, fly: true },
  robot: { name: 'Robot Garde', char: 'robot', hp: 170, atk: 40, def: 22, spd: 9, xp: 56, zeni: 32, drop: ['boisson_ki', 0.2] },
  soldat: { name: 'Soldat de Pilaf', char: 'soldier', hp: 150, atk: 40, def: 18, spd: 15, xp: 52, zeni: 50, drop: ['super_tonique', 0.15] },
  shu: { name: 'Shu', char: 'shu', hp: 260, atk: 38, def: 16, spd: 18, xp: 90, zeni: 60, skills: [{ name: 'Lame Ninja', target: 'one', pow: 1.5, chance: 0.3 }] },
  mai: { name: 'Mai', char: 'mai', hp: 240, atk: 36, def: 14, spd: 16, xp: 90, zeni: 60, skills: [{ name: 'Rafale de Fusil', target: 'all', pow: 0.7, chance: 0.3 }] },
  machine: {
    name: 'Pilaf Machine', spr: 'machine', hp: 1800, atk: 50, def: 26, spd: 12, xp: 0, zeni: 0, boss: true, big: true,
    skills: [{ name: 'Missiles Pilaf', target: 'all', pow: 1.05, chance: 0.28 }, { name: 'Pince Broyeuse', target: 'one', pow: 1.8, chance: 0.25 }, { name: 'Laser Impérial', target: 'one', pow: 2.2, chance: 0.12 }],
  },
};

const BALL_HINTS = {
  1: 'Château de Pilaf', 2: 'Forêt de Paozou', 3: 'Kame House', 4: 'Maison de Goku',
  5: 'Village d\'Aru', 6: 'Désert de Diablo', 7: 'Château de Pilaf',
};
