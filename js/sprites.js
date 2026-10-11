// Sprites des personnages : 24x32 pixels, style Chrono Trigger.
// Grilles de lettres + palettes. Une ligne de 12 caractères est recopiée en miroir (24 de large).
// 'k' = contour : il est automatiquement coloré (contour sélectif) quand il est à l'intérieur du sprite.
const K = '#120a1a';
const SKIN = '#fcd0a0', SKIN_SH = '#e09868', SKIN_HI = '#fff0dc';
const CW = 24, CH = 32, BODY_Y = 16;

const BASE_PAL = { k: K, s: SKIN, S: SKIN_SH, t: SKIN_HI, e: '#181030', w: '#ffffff', W: '#c0c0d0', m: '#a84848', i: '#3060c0', g: '#202028' };

const PALS = {
  goku: { h: '#22223a', H: '#101020', j: '#50508a', c: '#f88820', C: '#c05810', q: '#ffc070', d: '#2858c8', D: '#183488', z: '#5888f0', p: '#f88820', P: '#c05810', f: '#232f6c', F: '#121a40', x: '#5a6ab0', y: '#fff8e8', Y: '#c8c0b0', a: '#f88820' },
  krillin: { o: '#b87048', c: '#f88820', C: '#c05810', q: '#ffc070', d: '#2858c8', D: '#183488', z: '#5888f0', p: '#f88820', P: '#c05810', f: '#232f6c', F: '#121a40', x: '#5a6ab0', y: '#fff8e8', Y: '#c8c0b0', a: '#f88820' },
  bulma: { h: '#3cbcbc', H: '#1e8890', j: '#96f0e8', i: '#2c5cc8', c: '#f47cb0', C: '#c04c88', q: '#ffbcd8', d: '#8a50c8', D: '#5a3090', f: '#e04848', F: '#902828', x: '#ff9090', r: '#e83850', R: '#a02030', a: '#f47cb0' },
  roshi: { w: '#f6f6fa', W: '#b8b8c8', c: '#f0b040', C: '#c07c20', q: '#ffd890', d: '#7a5030', D: '#4a3018', p: '#e8dcb0', P: '#b8a880', l: SKIN, L: SKIN_SH, f: '#8a5a30', F: '#5a3a1a', x: '#b88050', u: '#5aa040', U: '#2e6a24', a: '#f0b040' },
  yamcha: { h: '#1c1c2c', H: '#0c0c18', j: '#45456a', c: '#4c9a50', C: '#2e6a34', q: '#88d088', d: '#c8a060', D: '#8a6a30', p: '#d8c08a', P: '#a89060', f: '#5a3a28', F: '#3a2418', x: '#8a6a50', o: '#c05050', a: '#4c9a50' },
  oolong: { s: '#f8b0c0', S: '#d88098', t: '#ffd8e2', n: '#f07890', N: '#b84868', c: '#4a8a4e', C: '#2e5e34', q: '#80b880', d: '#3a3028', D: '#22180e', p: '#4a8a4e', P: '#2e5e34', f: '#2a2018', F: '#140c08', x: '#5a4a38', m: '#a04050', a: '#4a8a4e' },
  pilaf: { s: '#9cc4f4', S: '#6c94d0', t: '#d0e8ff', h: '#f4ecd8', H: '#c8bc9c', j: '#ffffff', c: '#f0c840', C: '#b89020', q: '#fff0a0', d: '#c83838', D: '#8a2020', f: '#2a1a10', F: '#140a04', m: '#803040', a: '#f0c840' },
  mai: { h: '#1c1c28', H: '#0c0c14', j: '#40405c', i: '#802828', c: '#3c4c6c', C: '#283450', q: '#6878a0', d: '#202030', D: '#101018', p: '#2a2a3a', P: '#1a1a28', f: '#141414', F: '#0a0a0a', x: '#3a3a4a', a: '#3c4c6c' },
  shu: { s: '#c89060', S: '#9a6438', t: '#e8b888', w: '#f4e8d8', W: '#c8b8a8', c: '#2a2a48', C: '#1a1a30', q: '#4a4a70', d: '#c83838', D: '#8a2020', p: '#2a2a48', P: '#1a1a30', f: '#1a1a1a', F: '#0a0a0a', x: '#3a3a3a', e: '#181010', a: '#2a2a48' },
  robot: { s: '#b8c0d0', S: '#7880a0', t: '#eef4ff', v: '#ff3838', V: '#a01818', c: '#9098b0', C: '#606880', q: '#c8d0e8', d: '#505870', D: '#383c50', p: '#7078a0', P: '#505878', f: '#383c50', F: '#202430', x: '#6a7ab0', a: '#9098b0' },
  chichi: { h: '#1c1c2c', H: '#0c0c18', j: '#45456a', i: '#3a2050', c: '#e868a0', C: '#a83c70', q: '#ffb0d0', y: '#d8e0f0', Y: '#8890a8', d: '#8050c0', D: '#583090', f: '#c04878', F: '#802850', x: '#ff90c0', a: '#e868a0' },
  villM1: { h: '#7a4a24', H: '#4a2a10', j: '#a87048', c: '#4a88c8', C: '#2e5c98', q: '#88b8f0', d: '#5a3a1a', D: '#3a2410', p: '#7a5a3a', P: '#5a4028', f: '#4a3020', F: '#2a1a10', x: '#7a5a40', a: '#4a88c8' },
  villM2: { h: '#2a2a2a', H: '#141414', j: '#5a5a5a', c: '#c84848', C: '#8a2a2a', q: '#f08888', d: '#3a2a1a', D: '#20140a', p: '#5a5a7a', P: '#3a3a5a', f: '#3a2a1a', F: '#20140a', x: '#6a5a4a', a: '#c84848' },
  villM3: { h: '#d8b048', H: '#a07820', j: '#fff0a0', c: '#7aa848', C: '#4e7a2c', q: '#b0d880', d: '#5a3a1a', D: '#3a2410', p: '#6a5038', P: '#4a3424', f: '#3a2a1a', F: '#20140a', x: '#6a5a4a', a: '#7aa848' },
  villF1: { h: '#c8602a', H: '#8a3810', j: '#f0a060', c: '#68b0d8', C: '#3a7ca8', q: '#b0e0f8', d: '#ffffff', D: '#c0c0d0', f: '#a04020', F: '#6a2a14', x: '#d07050', a: '#68b0d8' },
  villF2: { h: '#3a2418', H: '#1a0c06', j: '#6a4a38', c: '#e0a040', C: '#a87020', q: '#ffd890', d: '#c83838', D: '#8a2020', f: '#6a3a1a', F: '#3a1a0a', x: '#9a6a4a', a: '#e0a040' },
  elder: { w: '#f2f2f6', W: '#b8b8c8', c: '#8a6aa8', C: '#5c4478', q: '#b8a0d0', d: '#e8c860', D: '#b08c30', f: '#2a1a10', F: '#140a04', a: '#8a6aa8' },
  gohan: { w: '#f2f2f6', W: '#b8b8c8', c: '#5a6a3a', C: '#3a4824', q: '#8a9a60', d: '#c8a060', D: '#8a6a30', f: '#2a1a10', F: '#140a04', a: '#5a6a3a', h: '#8a3a2a', H: '#5a2018', j: '#c06050' },
  soldier: { h: '#5c6a5a', H: '#3a4438', j: '#8c9c88', c: '#5c6a4a', C: '#3a4430', q: '#8a9878', d: '#3a3a2a', D: '#22221a', p: '#4a4a3a', P: '#2a2a20', f: '#1a1a14', F: '#0a0a08', x: '#3a3a30', a: '#5c6a4a' },
  bandit: { s: '#e0a878', S: '#b07848', t: '#f8c8a0', h: '#c03030', H: '#801818', j: '#f06060', c: '#6a5a40', C: '#4a3c28', q: '#9a8a68', d: '#3a3028', D: '#22180e', p: '#3a3028', P: '#22180e', f: '#2a1a10', F: '#140a04', x: '#4a3a28', a: '#6a5a40' },
  brigand: { s: '#d09060', S: '#a06838', t: '#f0b888', h: '#e8d8a8', H: '#b8a878', j: '#fff8d8', c: '#a87848', C: '#7a5030', q: '#d0a070', d: '#5a4030', D: '#3a2818', p: '#5a4030', P: '#3a2818', f: '#2a1a10', F: '#140a04', x: '#4a3a28', a: '#a87848' },
};

// ---------------- Têtes (ligne 0 = haut du sprite) ----------------
const HEADS = {
  goku: {
    down: ['.......kk...', '..kk..khhk.k', '..khk.khhkkh', '...khkhhhhhh', '..kkhhhhjhhh', 'kkkhhhhjjhhh', '.khhhhhhhhhh', 'kkhhhhhhhhhh', '.khhhhhhhhhh', 'kHhhhkhhhkhh', '.kHhkhhskhhs', '.kHhkhsssshh', '..kHkssskkss', '...kkssswess', '....kSsseess', '.....kSssssm', '......kSssss', '.......kkkkk'],
    up: ['.......kk...', '..kk..khhk.k', '..khk.khhkkh', '...khkhhhhhh', '..kkhhhhhhhh', 'kkkhhhhhhhhh', '.khhhhhhhjhh', 'kkhhhhhhjjhh', '.khhhhhhhhhh', 'kHhhhhhhhhhh', '.kHhhhhhhhhh', '.kHhhhhhhhhh', '..kHhhhhhhhh', '...kkHhhhhhh', '....kkhhkhhh', '......kkkHkS', '........kkSS'],
    right: ['........k..k............', '...k...khkkhk...........', '...kk.khhkhhkk..........', '....kkhhhhhhhhk.........', '..kkhhhhhhhhhhhk........', '.kkhhhhhjjhhhhhhk.......', '..khhhhhhhjhhhhhhk......', '.kkhhhhhhhhhhhhhhhk.....', 'kkhhhhhhhhhhhhhhhhhk....', '.khhhhhhhhhhhhhhhhhhk...', 'kkHhhhhhhhhhshhhshhk....', '.kHhhhhhhhhsssshssk.....', '..kHhhhhhhkssssskksk....', '...kHhhhhkSssssswesk....', '....kkhhkSSssssseessk...', '......kkSSSsssssssk.....', '.......kSSSssssmsk......', '........kkkkkkkkk.......'],
  },
  krillin: {
    down: ['............', '............', '............', '............', '........kkkk', '......kksstt', '.....kssttss', '....ksstssss', '....ksssssss', '....ksssosssossosssk....', '....ksssosssossosssk....', '....ksssssss', '...kkssskkss', '..kSkssswess', '..kSkSsseess', '...kkSssssss', '.....kSssssm', '......kkkkkk'],
    up: ['............', '............', '............', '............', '........kkkk', '......kkssss', '.....kssssss', '....ksssssss', '....ksssssss', '....ksssssss', '....ksssssss', '....kSssssss', '...kkSssssss', '..kSkSssssss', '..kSkSSsssss', '...kkSSSssss', '.....kSSSSSS', '......kkkkkk'],
    right: ['', '', '', '', '..........kkkk..........', '........kksstk..........', '.......ksssttsk.........', '......kssttssssk........', '.....ksssssssssk........', '.....ksssssssossk.......', '.....kSssssssososk......', '.....kSssssssssssk......', '.....kSskkssssskksk.....', '.....kSkSkssssswesk.....', '.....kSkSkSssssseessk...', '......kSkkSsssssssk.....', '.......kSSSssssmsk......', '........kkkkkkkkk.......'],
  },
  bulma: {
    down: ['............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhjjhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhkshhsh', '...khksskkss', '...khksswiss', '...khkSsiiss', '...khkSssssm', '..khhhkSssss', '..khhhhkkkkk', '..khhhk.....', '...kkk......'],
    up: ['............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhjjhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '..kHhhhhhhhh', '..kHhhhhhhjh', '..kHhhhhhhhh', '...kHhhhhhhh', '....kkHhhhhh', '......kkkkkk'],
    right: ['..........kk.kk.........', '.........krrkrrk........', '......kkkkRrrrRkk.......', '.....khhhhkrrrkhhk......', '....khhhhhhkkkhhhhk.....', '...khhhhhjjhhhhhhhhk....', '...khhhhhhhjhhhhhhhhk...', '..khhhhhhhhhhhhhhhhhhk..', '..khhhhhhhhhhhhhhhhhk...', '..kHhhhhhhhhhhhhhhhhhk..', '..kHhhhhhhhhhshhhshhk...', '..kHhhhhhhhhsssshssk....', '..kHhhhhhhkssssskksk....', '..kHhhhhhkSssssswisk....', '..kHhhhhkSSsssssiissk...', '..kHhhhhkSSSsssssssk....', '..kHhhhhhkSSsssmsk......', '..kHhhhhhhkkkkkkk.......', '..kHhhhhhk..............', '...kHhhhk...............', '....kkkk................'],
    over: { down: [1, '...............kk.kk....', '..............krrkrrk...', '..............kRrrrRk...', '...............kkkkk....'], up: [1, '...............kk.kk....', '..............krrkrrk...', '..............kRrrrRk...', '...............kkkkk....'] },
  },
  roshi: {
    down: ['............', '............', '............', '............', '........kkkk', '......kksstt', '.....kssstts', '....ksssssss', '....ksssssss', '....ksssssss', '...kwkssssss', '...kwwkwwwss', '...kwkgwgggk', '...kwkggggSs', '...kwwsssssS', '...kwwwwwwww', '...kwwwwwWww', '....kwwwwwww', '.....kwwwwww', '......kwWwww', '.......kwwww', '........kkkk'],
    up: ['............', '............', '............', '............', '........kkkk', '......kksstt', '.....kssstts', '....ksssssss', '....ksssssss', '....ksssssss', '...kwsssssss', '...kwwssssss', '...kwwwsssss', '...kwwwwwwww', '...kWwwwwwww', '....kWWwwwww', '.....kkkkkkk'],
    right: ['', '', '', '', '..........kkkk..........', '........kksstk..........', '.......ksssttsk.........', '......kssssssssk........', '.....ksssssssssk........', '.....kssssssssssk.......', '....kwksssssssssk.......', '....kwwksssswwwssk......', '....kwwkssssggggggk.....', '....kwwkSsssgwggggk.....', '....kwwwSssssssSSSSk....', '....kwwwwwwwwwwwwwk.....', '.....kwwwwwwwwwwwk......', '......kwwwwwwwwwk.......', '.......kwwwwwwwk........', '........kwwWwwk.........', '.........kwwwk..........', '..........kkk...........'],
  },
  elder: {
    down: ['............', '............', '............', '............', '........kkkk', '......kksstt', '.....kssstts', '....ksssssss', '....ksssssss', '....ksssssss', '...kwkssssss', '...kwwkwwwss', '...kwksskkss', '...kwkSsssSs', '...kwwssssss', '...kwwwwwwww', '....kwwwwwww', '.....kwwwwww', '......kwwwww', '.......kkkkk'],
    up: ['............', '............', '............', '............', '........kkkk', '......kksstt', '.....kssstts', '....ksssssss', '....ksssssss', '....ksssssss', '...kwsssssss', '...kwwssssss', '...kwwwsssss', '...kwwwwwwww', '...kWwwwwwww', '....kWWwwwww', '.....kkkkkkk'],
    right: ['', '', '', '', '..........kkkk..........', '........kksstk..........', '.......ksssttsk.........', '......kssssssssk........', '.....ksssssssssk........', '.....kssssssssssk.......', '....kwksssssssssk.......', '....kwwksssswwwssk......', '....kwwksssssskksk......', '....kwwkSssssssssk......', '....kwwwSssssssSSSk.....', '....kwwwwwwwwwwwwk......', '.....kwwwwwwwwwwk.......', '......kwwwwwwwwk........', '.......kkkkkkkk.........'],
  },
  gohan: {
    down: ['............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khjhhhhh', '....khhhhhhh', '...kkkkkkkkk', '...kwkssssss', '...kwwkwwwss', '...kwksskkss', '...kwkSsssSs', '...kwwssssss', '...kwwwwwwww', '....kwwwwwww', '.....kwwwwww', '......kwwwww', '.......kkkkk'],
    up: ['............', '............', '........kkkk', '......kkhhhh', '.....khhhhhh', '....khhhhhhh', '....khhhhhhh', '...kkkkkkkkk', '...kwsssssss', '...kwwssssss', '...kwwwsssss', '...kwwwwwwww', '...kWwwwwwww', '....kWWwwwww', '.....kkkkkkk'],
    right: ['', '', '..........kkkk..........', '........kkhhhhk.........', '.......khhjhhhhk........', '......khhhhhhhhhk.......', '......khhhhhhhhhhk......', '.....kkkkkkkkkkkkkk.....', '....kwksssssssssk.......', '....kwwksssswwwssk......', '....kwwksssssskksk......', '....kwwkSssssssssk......', '....kwwwSssssssSSSk.....', '....kwwwwwwwwwwwwk......', '.....kwwwwwwwwwwk.......', '......kwwwwwwwwk........', '.......kkkkkkkk.........'],
  },
  yamcha: {
    down: ['............', '............', '........kkkk', '......kkhhhh', '.....khhhjhh', '....khhhjjhh', '...khhhhhhhh', '...khhhhhhhh', '..khhhhhhhhh', '..khhhhhhhhh', '..khhhhkhhhk', '..khhhkshhks', '.khhhksskkss', '.khhhksswess', '.khhkSsseess', '.khhkSssssms', '.khhhkSsssss', '.khhhhkkkkkk', '..khhhk.....', '...kkk......'],
    up: ['............', '............', '........kkkk', '......kkhhhh', '.....khhhjhh', '....khhhjjhh', '...khhhhhhhh', '...khhhhhhhh', '..khhhhhhhhh', '..khhhhhhhhh', '..khhhhhhhhh', '..khhhhhhhhh', '.khhhhhhhhhh', '.khhhhhhhhhh', '.kHhhhhhhhhh', '.kHhhhhhhhhh', '.kHhhhhhhhhh', '.kHhhhhhhhhh', '..kHhhhhhhhh', '...kkHhhhhhh', '.....kkkkkkk'],
    right: ['', '', '.........kkkkk..........', '.......kkhhhhhk.........', '......khhhhjhhhk........', '.....khhhhhjjhhhk.......', '....khhhhhhhhhhhhk......', '...khhhhhhhhhhhhhhk.....', '...khhhhhhhhhhhhhhhk....', '..khhhhhhhhhhhhhhhhhk...', '..kHhhhhhhhhhshhhshhk...', '..kHhhhhhhhhsssshssk....', '..kHhhhhhhkssssskksk....', '..kHhhhhhkSssssswesk....', '..kHhhhhkSSsssoseessk...', '..kHhhhhkSSSsssssssk....', '..kHhhhhhkSSsssmsk......', '..kHhhhhhhkkkkkkk.......', '..kHhhhhhk..............', '...kkkkkk...............'],
  },
  oolong: {
    down: ['............', '............', '............', '.kk.........', 'kSsk........', 'kSssk..kkkkk', '.kSsskksssss', '..kSssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...ksseessss', '...ksseessss', '...ksssnnnnn', '...kssnnknnn', '...kSssnnnnn', '....kSsssmmm', '.....kkkkkkk'],
    up: ['............', '............', '............', '.kk.........', 'kSsk........', 'kSssk..kkkkk', '.kSsskksssss', '..kSssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kSsssssss', '....kSSsssss', '.....kkkkkkk'],
    right: ['', '', '', '......kk................', '.....kSsk...............', '.....kSssk.kkkk.........', '......kSsskssssk........', '.......kssssssssk.......', '......ksssssssssk.......', '.....kssssssssssk.......', '.....ksssssssssssk......', '.....kSsssssseesk.......', '.....kSssssssessnnk.....', '.....kSsssssssnnnnnk....', '.....kSSssssssnnkNnk....', '......kSSssssssnnnk.....', '.......kSSssmmssk.......', '........kkkkkkkk........'],
  },
  pilaf: {
    down: ['............', '............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '.....khhhhhh', '....kkkkkkkk', 'kk..ksssssss', 'kSk.ksssssss', '.kSkksssssss', '..kSksskkkss', '...kksswwess', '...kksswwess', '....kSssssss', '....kSsssmmm', '.....kSsssss', '......kkkkkk'],
    up: ['............', '............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '.....khhhhhh', '....kkkkkkkk', 'kk..ksssssss', 'kSk.ksssssss', '.kSkksssssss', '..kSkSssssss', '...kkSssssss', '....kSssssss', '....kSSsssss', '....kSSSssss', '.....kSSSSSS', '......kkkkkk'],
    right: ['', '', '', '.........kkkk...........', '.......kkhhhhk..........', '......khhjhhhhk.........', '......khhhhhhhk.........', '.....kkkkkkkkkkk........', '..kk.kssssssssssk.......', '..kSSkssssssssssk.......', '...kSSkssssskkkssk......', '....kkSssssswwessk......', '.....kSssssswwessk......', '.....kSSssssssssssk.....', '.....kSSsssssmmmsk......', '......kSSssssssk........', '.......kkkkkkkk.........'],
  },
  mai: {
    down: ['............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhjhhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khksskkss', '...khksswiss', '...khkSsiiss', '...khkSssssm', '...khhkSssss', '...khhhkkkkk', '...khhhk....', '...khhhk....', '....kkk.....'],
    up: ['............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhjhhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '....kkkkkkkk'],
    right: ['', '', '.........kkkkk..........', '.......kkhhhhhk.........', '......khhhhjhhhk........', '.....khhhhhhjhhhk.......', '....khhhhhhhhhhhhk......', '...khhhhhhhhhhhhhhk.....', '...khhhhhhhhhhhhhhhk....', '..khhhhhhhhhhhhhhhhhk...', '..kHhhhhhhhhhhhhhhhhk...', '..kHhhhhhhhhhhhhhhhk....', '..kHhhhhhhkssssskksk....', '..kHhhhhhkSssssswisk....', '..kHhhhhkSSsssssiissk...', '..kHhhhhkSSSsssssssk....', '..kHhhhhhkSSsssmsk......', '..kHhhhhhhkkkkkkk.......', '..kHhhhhhk..............', '..kHhhhhhk..............', '...kkkkkk...............'],
  },
  shu: {
    down: ['............', '............', '..kk........', '..kSk.......', '..kSsk......', '..kSssk.kkkk', '...kSsskssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...ksseessss', '...ksseessss', '...ksssswwww', '...ksssswwwk', '...kSssswwww', '....kSsswwww', '.....kkkkkkk'],
    up: ['............', '............', '..kk........', '..kSk.......', '..kSsk......', '..kSssk.kkkk', '...kSsskssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kssssssss', '...kSsssssss', '...kSSssssss', '....kSSsssss', '.....kkkkkkk'],
    right: ['', '', '.......kk...............', '.......kSk..............', '.......kSsk.............', '.......kSsskkkk.........', '......kSssssssssk.......', '.....kssssssssssk.......', '.....ksssssssssssk......', '.....ksssssssssssk......', '.....kSssssssseesk......', '.....kSsssssssswwwwk....', '.....kSSsssssswwwwwkk...', '.....kSSsssssswwwwwwk...', '......kSSsssssswwwwk....', '.......kSSssssssk.......', '........kkkkkkkk........'],
  },
  robot: {
    down: ['............', '...........v', '...........k', '......kkkkkk', '.....kssssss', '....kstsssss', '....ksssssss', '....ksssssss', '....kkkkkkkk', '....kvvvvvvv', '....kvVvvVvv', '....kkkkkkkk', '....ksSsSsSs', '....kSSSSSSS', '.....kkkkkkk'],
    up: ['............', '...........v', '...........k', '......kkkkkk', '.....kssssss', '....ksssssss', '....ksssssss', '....ksssssss', '....kSssssss', '....kSssssss', '....kSssssss', '....kSssssss', '....kSSsssss', '....kSSSSSSS', '.....kkkkkkk'],
    right: ['', '..........v.............', '..........k.............', '......kkkkkkkk..........', '.....kssssssssk.........', '....kstssssssssk........', '....ksssssssssssk.......', '....ksssssssssssk.......', '....kssssskkkkkkk.......', '....kssssskvvvvvvk......', '....kssssskvVvvVvk......', '....kssssskkkkkkkk......', '....ksSsSsSsSsSsk.......', '....kSSSSSSSSSSSk.......', '.....kkkkkkkkkkk........'],
  },
  chichi: {
    down: ['...........k', '..........ky', '..........ky', '........kkky', '......kkcccc', '.....kccqccc', '....kcqccccc', '....kccccccc', '...kkkkkkkkk', '...khhhhhhhh', '...khhkshhsh', '...khksskkss', '...khksswiss', '...khkSsiiss', '...khkSssssm', '...khhkSssss', '...khhhkkkkk', '....kkk.....'],
    up: ['...........k', '..........ky', '..........ky', '........kkky', '......kkcccc', '.....kccqccc', '....kcqccccc', '....kccccccc', '...kkkkkkkkk', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '....kkHhhhhh', '......kkkkkk'],
    right: ['............k...........', '...........kyk..........', '...........kyk..........', '.........kkkyk..........', '.......kkcccccck........', '......kccqccccccck......', '.....kcqcccccccccck.....', '.....kccccccccccccck....', '....kkkkkkkkkkkkkkkk....', '...khhhhhhhhhhhhhhhk....', '..kHhhhhhhhhshhhshhk....', '..kHhhhhhhhhsssshssk....', '..kHhhhhhhkssssskksk....', '..kHhhhhhkSssssswisk....', '..kHhhhhkSSsssssiissk...', '..kHhhhhkSSSsssssssk....', '..kHhhhhhkSSsssmsk......', '...kkhhhhhkkkkkkk.......', '.....kkkkk..............'],
  },
  villM: {
    down: ['............', '............', '............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khsskkss', '....kssswess', '....kSsseess', '....kSsssssm', '.....kSsssss', '......kkkkkk'],
    up: ['............', '............', '............', '............', '........kkkk', '......kkhhhh', '.....khhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '....kHhhhhhh', '.....kHhhhhh', '......kkkkkk'],
    right: ['', '', '', '', '..........kkkk..........', '........kkhhhhk.........', '.......khhhjhhhk........', '......khhhhhhhhhk.......', '.....khhhhhhhhhhhk......', '.....khhhhhhhhhhhhk.....', '.....kHhhhhhhhhhhhk.....', '.....kHhhhhhhhsshhk.....', '.....kHhhhhhkssskksk....', '.....kHhhhhkSssswesk....', '......kkhhkSSssseessk...', '........kkSSSssssssk....', '.........kSSSsssmsk.....', '..........kkkkkkkk......'],
  },
  villF: {
    down: ['............', '..........kk', '.........khh', '.........khh', '........kkhh', '......kkhhhh', '.....khhjhhh', '....khhjhhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhks', '...khksskkss', '...khksswess', '...khkSseess', '...khkSssssm', '....kkkSssss', '......kkkkkk'],
    up: ['............', '..........kk', '.........khh', '.........khh', '........kkhh', '......kkhhhh', '.....khhhhhh', '....khhhhhhh', '....khhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...khhhhhhhh', '...kHhhhhhhh', '...kHhhhhhhh', '....kkHhhhhh', '......kkkkkk'],
    right: ['', '.........kkk............', '........khhhk...........', '........khhhk...........', '.......kkhhhkk..........', '.....kkhhhhhhhk.........', '....khhhhjhhhhhk........', '...khhhhhhjhhhhhk.......', '...khhhhhhhhhhhhhk......', '..khhhhhhhhhhhhhhhk.....', '..khhhhhhhhhhhhhhhk.....', '..kHhhhhhhhhhhsshhk.....', '..kHhhhhhhkssssskksk....', '..kHhhhhhkSssssswesk....', '...kHhhhkSSssssseessk...', '....kkhhkSSSsssssssk....', '......kkkSSSsssmsk......', '.........kkkkkkkk.......'],
  },
  soldier: {
    down: ['............', '............', '............', '............', '........kkkk', '......kkhhhh', '.....khhjhhh', '....khhjhhhh', '....khhhhhhh', '....khhhhhhh', '...kkkkkkkkk', '....kSssssss', '....kssskkss', '....kssswess', '....kSsseess', '....kSsssssm', '.....kSsssss', '......kkkkkk'],
    up: ['............', '............', '............', '............', '........kkkk', '......kkhhhh', '.....khhhhhh', '....khhhhhhh', '....khhhhhhh', '....khhhhhhh', '...kkkkkkkkk', '....kSssssss', '....kSssssss', '....kSssssss', '....kSssssss', '....kSSsssss', '.....kSSSSSS', '......kkkkkk'],
    right: ['', '', '', '', '..........kkkk..........', '........kkhhhhk.........', '.......khhhjhhhk........', '......khhhhhjhhhk.......', '.....khhhhhhhhhhhk......', '.....khhhhhhhhhhhhk.....', '....kkkkkkkkkkkkkkkkk...', '.....kSSsssssssssk......', '.....kSsssssssskksk.....', '.....kSssssssssswesk....', '......kSSsssssseessk....', '........kkSSSssssssk....', '.........kSSSsssmsk.....', '..........kkkkkkkk......'],
  },
};
HEADS.bandit = HEADS.villM; HEADS.brigand = HEADS.villM;

// ---------------- Corps (ligne 0 = ligne 16 du sprite) ----------------
// down/up : 16 lignes (miroir) ; right : 8 lignes du haut (16-23) ; attack : idem bras tendu.
const LEGS = {
  stand: ['........kppppPk.........', '........kppPppk.........', '........kLlkllk.........', '........kLlklLk.........', '........kLLklLk.........', '........kffkfffk........', '........kFfkfxffk.......', '........kkkkkkkkk.......'],
  walkA: ['........kppppPk.........', '.......kpppkppPk........', '......kLlLk.kllLk.......', '......kLlk...kllk.......', '.....kLLk....klLk.......', '.....kffk....kfffk......', '....kFffk....kfxffk.....', '....kkkkk....kkkkkk.....'],
  walkB: ['........kppppPk.........', '........kpPpppkk........', '........kLlklllLk.......', '........kLlk.klLk.......', '........kLLk.kffffk.....', '........kffk.kFfxfk.....', '.......kFffk..kkkkk.....', '.......kkkkk............'],
};
const BODIES = {
  gi: {
    down: ['..........kS', '......kkkcdd', '....kkcqccdd', '...kcckccccd', '...kcckccccc', '...ksskCcccc', '...kSskCcccc', '...kddkddddd', '...ksskppppD', '....kkkppppD', '......kpppPk', '......kpppPk', '......kLllLk', '.....kfffffk', '.....kfxfFFk', '.....kkkkkkk'],
    up: ['..........kS', '......kkkccc', '....kkcqccyy', '...kcckccyky', '...kcckcccyy', '...ksskCcccc', '...kSskCcccc', '...kddkddddd', '...ksskppppp', '....kkkppppp', '......kpppPk', '......kpppPk', '......kLllLk', '.....kfffffk', '.....kfFfFFk', '.....kkkkkkk'],
    right: ['..........kSsk..........', '........kkccccdk........', '.......kcqkcckcdk.......', '.......kCcksskcck.......', '.......kCcksSkcck.......', '.......kddkddkddk.......', '.......kppksskpDk.......', '.......kpppkkppk........'],
    attack: ['..........kSsk..........', '........kkccccdk........', '.......kcqccccdkkkkk....', '.......kccccccaassddssk.', '.......kCcccccaaSSddsSk.', '.......kCcccccckkkkkkk..', '.......kdddddddk........', '.......kpppppDk.........'],
  },
  tunic: {
    down: ['..........kS', '......kkkkcc', '....kkcqcccc', '...kcckccccc', '...kcckccccc', '...kCCkCcccc', '...ksskddddd', '...kSskCcccc', '....kkkppppp', '......kpppPk', '......kpppPk', '......kLllLk', '......kLllLk', '.....kfffffk', '.....kfxfFFk', '.....kkkkkkk'],
    up: ['..........kS', '......kkkkcc', '....kkcqcccc', '...kcckccccc', '...kcckccccc', '...kCCkCcccc', '...ksskddddd', '...kSskCcccc', '....kkkppppp', '......kpppPk', '......kpppPk', '......kLllLk', '......kLllLk', '.....kfffffk', '.....kfFfFFk', '.....kkkkkkk'],
    right: ['..........kSsk..........', '........kkcccck.........', '.......kcqkcckcck.......', '.......kCckcckcck.......', '.......kCckcckcck.......', '.......kddksskddk.......', '.......kCckSSkcck.......', '.......kCcckkccck.......'],
    attack: ['..........kSsk..........', '........kkccccckkkkk....', '.......kcqccccaaaassk...', '.......kccccccaaaaSsk...', '.......kCcccccckkkkkk...', '.......kdddddddk........', '.......kCcccccck........', '.......kCccccccck.......'],
  },
  dress: {
    down: ['..........kS', '.......kkccc', '.....kkcqccc', '....kcckcccc', '....ksskcccc', '....kSskCccc', '....ksskdddd', '....ksskcccc', '.....kkcCccc', '....kcCccccc', '....kCcCcCcc', '....kkkkkkkk', '.......kssk.', '.......kSsk.', '......kfffk.', '......kkkkk.'],
    up: ['..........kS', '.......kkccc', '.....kkcqccc', '....kcckcccc', '....ksskcccc', '....kSskCccc', '....ksskdddd', '....ksskcccc', '.....kkcCccc', '....kcCccccc', '....kCcCcCcc', '....kkkkkkkk', '.......kssk.', '.......kSsk.', '......kfffk.', '......kkkkk.'],
    right: ['..........kSsk..........', '.........kccccck........', '........kcqccccck.......', '........kckcckcck.......', '........kcksskcck.......', '........kCkSskcck.......', '........kdksskddk.......', '........kcckkkcck.......'],
    attack: ['..........kSsk..........', '.........kccccckkkkkk...', '........kcqccccaassssk..', '........kccccccaaSSssk..', '........kCcccccckkkkk...', '........kCccccck........', '........kddddddk........', '........kccccccck.......'],
    lower: {
      stand: ['.......kcccccccck.......', '......kcCcccccCcck......', '......kCcCcCcCcCck......', '......kkkkkkkkkkkk......', '..........kssk..........', '..........kSsk..........', '..........kfffk.........', '..........kkkkk.........'],
      walkA: ['.......kcccccccck.......', '......kcCcccccCcck......', '......kCcCcCcCcCck......', '......kkkkkkkkkkkk......', '.......kssk...kssk......', '......kSsk.....kSsk.....', '.....kffk......kfffk....', '.....kkkk......kkkkk....'],
      walkB: ['.......kcccccccck.......', '......kcCcccccCcck......', '......kCcCcCcCcCck......', '......kkkkkkkkkkkk......', '..........ksskssk.......', '..........kSskkSsk......', '.........kffk.kfffk.....', '.........kkkk.kkkkk.....'],
    },
  },
  robe: {
    down: ['..........kS', '.......kkkcc', '.....kkcqccc', '....kcckcccc', '....kcckcccc', '...kccckcccc', '...kdddkcccc', '...kkssdcccc', '....kkkcCccc', '.....kccCccc', '.....kcCcccc', '.....kCccccc', '....kcCccCcc', '....kCCcCCcc', '....kCCCCCCC', '....kkkkkkkk'],
    up: ['..........kS', '.......kkkcc', '.....kkcqccc', '....kcckcccc', '....kcckcccc', '...kccckcccc', '...kdddkcccc', '...kkcccCccc', '....kkkcCccc', '.....kccCccc', '.....kcCcccc', '.....kCccccc', '....kcCccCcc', '....kCCcCCcc', '....kCCCCCCC', '....kkkkkkkk'],
    right: ['..........kSsk..........', '.........kccccck........', '........kcqcccccck......', '........kcckccccck......', '........kcckccccck......', '.......kccckccccck......', '.......kdddkccccck......', '.......kkssdcccccck.....'],
    attack: ['..........kSsk..........', '.........kcccccckkkk....', '........kcqccccaaaassk..', '........kccccccaaaaSsk..', '........kcccccckkkkkk...', '.......kccccccccck......', '.......kccccccccck......', '.......kcccccccccck.....'],
    lower: ['........kkkcccccck......', '........kcccccccck......', '.......kccccccccck......', '.......kcCcccccccck.....', '......kcCccccccccck.....', '......kCCcccccccCCk.....', '......kCCCccccCCCCk.....', '......kkkkkkkkkkkkk.....'],
  },
};
// Carapace de Tortue Géniale
const OVERLAYS = {
  shell: {
    up: [17, '......kkkkkkkkkkkk......', '.....kuuuuuuuuuuuuk.....', '....kuuUuuuUUuuuUuuk....', '....kuUUUuUUUUuUUUuk....', '....kuuUuuuUUuuuUuuk....', '....kuuuUUuuuuUUuuuk....', '....kuuUUUuuuuUUUuuk....', '.....kuuUuuuuuuUuuk.....', '......kkkkkkkkkkkk......'],
    right: [17, '....kkk.................', '...kuuuk................', '..kuUuuuk...............', '..kUUUuuk...............', '..kuUuuuk...............', '..kuuUUuk...............', '...kuuuk................', '....kkk.................'],
    down: [17, '......k..........k......', '.......k........k.......', '........k......k........'],
  },
};

const CHARS = {
  goku: { head: 'goku', body: 'gi', pal: 'goku', short: true },
  krillin: { head: 'krillin', body: 'gi', pal: 'krillin', short: true },
  bulma: { head: 'bulma', body: 'dress', pal: 'bulma' },
  roshi: { head: 'roshi', body: 'tunic', pal: 'roshi', over: 'shell', short: true },
  yamcha: { head: 'yamcha', body: 'tunic', pal: 'yamcha' },
  oolong: { head: 'oolong', body: 'tunic', pal: 'oolong', short: true },
  pilaf: { head: 'pilaf', body: 'robe', pal: 'pilaf', short: true },
  mai: { head: 'mai', body: 'tunic', pal: 'mai' },
  shu: { head: 'shu', body: 'tunic', pal: 'shu' },
  robot: { head: 'robot', body: 'tunic', pal: 'robot' },
  chichi: { head: 'chichi', body: 'dress', pal: 'chichi', short: true },
  villM1: { head: 'villM', body: 'tunic', pal: 'villM1' },
  villM2: { head: 'villM', body: 'tunic', pal: 'villM2' },
  villM3: { head: 'villM', body: 'tunic', pal: 'villM3', short: true },
  villF1: { head: 'villF', body: 'dress', pal: 'villF1' },
  villF2: { head: 'villF', body: 'dress', pal: 'villF2' },
  elder: { head: 'elder', body: 'robe', pal: 'elder' },
  gohan: { head: 'gohan', body: 'robe', pal: 'gohan' },
  soldier: { head: 'soldier', body: 'tunic', pal: 'soldier' },
  bandit: { head: 'bandit', body: 'tunic', pal: 'bandit' },
  brigand: { head: 'brigand', body: 'tunic', pal: 'brigand' },
};
