// Options du joueur, communes à toutes les sauvegardes : difficulté, vitesse des combats, aides, mini-carte, joueurs.
const Opt = (() => {
  const LIST = [
    { key: 'diff', name: 'Difficulté', vals: ['Facile', 'Normale', 'Difficile'], def: 1,
      help: ['Ennemis moins résistants, plus d\'expérience.', 'L\'aventure telle qu\'elle a été pensée.', 'Ennemis plus coriaces et plus agressifs.'] },
    { key: 'speed', name: 'Vitesse des combats', vals: ['Normale', 'Rapide', 'Très rapide'], def: 0,
      help: ['Les combats à la vitesse normale.', 'Combats une fois et demie plus rapides.', 'Combats deux fois plus rapides.'] },
    { key: 'timing', name: 'Frappes au bon moment', vals: ['Manuelles', 'Automatiques'], def: 0,
      help: ['Appuie au bon moment pour frapper fort, parer et charger le Kamehameha.', 'Aucun bouton à presser pendant les attaques.'] },
    { key: 'auto', name: 'Combat automatique', vals: ['Jamais', 'Petits ennemis', 'Toujours'], def: 0,
      help: ['Tu choisis toutes les actions. (En combat, Menu / C bascule en auto.)', 'Les héros se battent seuls contre les ennemis ordinaires.', 'Les héros se battent seuls, même contre les boss.'] },
    { key: 'minimap', name: 'Mini-carte', vals: ['Non', 'Oui'], def: 1, help: ['Pas de mini-carte.', 'Une petite carte de la zone, en haut à droite.'] },
    { key: 'objective', name: 'Objectif affiché', vals: ['Non', 'Oui'], def: 1, help: ['Pas de rappel.', 'Rappel de l\'objectif en entrant dans une zone.'] },
    { key: 'players', name: 'Joueurs', vals: ['1 joueur', '2 joueurs'], def: 0,
      help: ['Un seul joueur dirige tous les héros.', 'Le joueur 2 dirige les héros 2 et 3 en combat : I J K L, U et O, ou 2e manette.'] },
    { key: 'sound', name: 'Son', vals: ['Activé', 'Coupé'], def: 0, help: ['Musique et bruitages activés (M).', 'Musique et bruitages coupés (M).'] },
  ];
  const o = {};
  for (const e of LIST) o[e.key] = e.def;
  try { Object.assign(o, JSON.parse(localStorage.getItem('dbq_opts') || '{}')); } catch (e) { /* stockage indisponible */ }
  function save() { try { localStorage.setItem('dbq_opts', JSON.stringify(o)); } catch (e) { /* ignore */ } }
  function get(k) { return k === 'sound' ? (SND.isMuted() ? 1 : 0) : o[k]; }
  function set(k, v) {
    if (k === 'sound') { if (!!v !== SND.isMuted()) SND.toggleMute(); return; }
    o[k] = v; save();
  }
  return {
    LIST, get, set,
    enemyHp: () => [0.75, 1, 1.3][o.diff], // multiplicateurs selon la difficulté
    enemyDmg: () => [0.7, 1, 1.25][o.diff],
    xp: () => [1.25, 1, 1.1][o.diff],
    battleSpeed: () => [0, 0.5, 1][o.speed], // pas de jeu supplémentaires par image pendant les combats
    manual: () => o.timing === 0,
    twoPlayers: () => o.players === 1,
  };
})();
