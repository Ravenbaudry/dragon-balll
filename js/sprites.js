// Sprites pixel art des personnages et des ennemis (grilles + palettes).
// Une ligne de 8 caractères dans une grille de 16 de large est recopiée en miroir.
const K = '#181020';
const SKIN = '#f8c898', SKIN_SH = '#d08858';

const BASE_PAL = { k: K, e: K, s: SKIN, S: SKIN_SH, w: '#ffffff', r: '#c83040', g: '#282830', a: SKIN };

const PALS = {
  goku: { h: '#202038', H: '#484878', c: '#f07c1c', C: '#b8520c', d: '#2c54c0', D: '#1a3480', p: '#f07c1c', P: '#b8520c', f: '#26347c', F: '#141c48', y: '#f8f0d8', a: '#2c54c0' },
  krillin: { e: '#a85a38', c: '#f07c1c', C: '#b8520c', d: '#2c54c0', D: '#1a3480', p: '#f07c1c', P: '#b8520c', f: '#26347c', F: '#141c48', y: '#f8f0d8', a: '#2c54c0' },
  bulma: { h: '#38b8b8', H: '#62d8d0', r: '#e83850', c: '#f088b8', C: '#c05890', d: '#fff4f8', p: SKIN, f: '#d03838', F: '#882020', a: '#f088b8' },
  roshi: { w: '#f4f4f4', g: '#282830', c: '#f0b040', C: '#c08020', d: '#e8e0b8', l: SKIN, L: SKIN_SH, f: '#a06030', u: '#58a040', U: '#2e6a24', a: '#f0b040' },
  yamcha: { h: '#1c1c2c', H: '#40405c', c: '#4c9a50', C: '#2e6a34', d: '#d8c08a', l: '#d8c08a', L: '#b09860', f: '#5a3a28', a: '#4c9a50' },
  pilaf: { s: '#9cc4f4', S: '#6c94d0', h: '#f4ecd8', H: '#c8bc9c', r: '#a03040', c: '#f0c840', C: '#b89020', d: '#c83838', f: K, a: '#f0c840' },
  oolong: { s: '#f8b0c0', S: '#d88098', n: '#f07890', c: '#4a8a4e', C: '#2e5e34', d: '#3a3028', l: '#4a8a4e', L: '#2e5e34', f: '#2a2018', a: '#4a8a4e' },
  villM1: { h: '#7a4a24', H: '#a06a3a', c: '#4a88c8', C: '#2e5c98', d: '#7a5a3a', l: '#7a5a3a', L: '#5a4028', f: '#4a3020', a: '#4a88c8' },
  villM2: { h: '#2a2a2a', H: '#4a4a4a', c: '#c84848', C: '#8a2a2a', d: '#5a5a7a', l: '#5a5a7a', L: '#3a3a5a', f: '#3a2a1a', a: '#c84848' },
  villM3: { h: '#d8b048', H: '#f0d070', c: '#7aa848', C: '#4e7a2c', d: '#6a5038', l: '#6a5038', L: '#4a3424', f: '#3a2a1a', a: '#7aa848' },
  villF1: { h: '#c8602a', H: '#e8884a', c: '#68b0d8', C: '#3a7ca8', d: '#ffffff', p: SKIN, f: '#a04020', F: '#6a2a14', a: '#68b0d8' },
  villF2: { h: '#3a2418', H: '#5a3a28', c: '#e0a040', C: '#a87020', d: '#c83838', p: SKIN, f: '#6a3a1a', F: '#3a1a0a', a: '#e0a040' },
  elder: { w: '#f0f0f0', c: '#8a6aa8', C: '#5c4478', d: '#e8c860', f: K, a: '#8a6aa8' },
  soldier: { h: '#5c6a5a', H: '#7c8c78', c: '#5c6a4a', C: '#3a4430', d: '#3a3a2a', l: '#3a3a2a', L: '#22221a', f: '#1a1a14', a: '#5c6a4a' },
  mai: { h: '#1c1c28', H: '#3c3c58', c: '#3c4c6c', C: '#283450', d: '#2a2a3a', l: '#2a2a3a', L: '#1a1a2a', f: '#1a1a1a', a: '#3c4c6c' },
  shu: { s: '#c89060', S: '#9a6438', w: '#f4e8d8', c: '#2a2a48', C: '#1a1a30', d: '#c83838', l: '#2a2a48', L: '#1a1a30', f: '#1a1a1a', a: '#2a2a48' },
  robot: { s: '#b8c0d0', S: '#7880a0', w: '#f0f4ff', r: '#ff3030', c: '#9098b0', C: '#606880', d: '#505870', l: '#7078a0', L: '#505878', f: '#383c50', a: '#9098b0' },
  bandit: { s: '#e0a878', S: '#b07848', h: '#c03030', H: '#e05050', c: '#6a5a40', C: '#4a3c28', d: '#3a3028', l: '#3a3028', L: '#2a2018', f: '#2a1a10', a: '#6a5a40' },
  brigand: { s: '#d09060', S: '#a06838', h: '#e8d8a8', H: '#fff4d0', c: '#a87848', C: '#7a5030', d: '#5a4030', l: '#5a4030', L: '#3a2818', f: '#2a1a10', a: '#a87848' },
};

const HEADS = {
  goku: {
    down: ['....k..k..k.....', '...khk.khkhk.k..', '..khhhkhhhhhkhk.', '.khhHhhhhhhhhhk.', 'khhHhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', 'khhhshhsshhshhhk', 'khhsskssssksshhk', '.khsskssssksshk.', '..ksssssssssSk..', '...kkSssssSkk...'],
    up: ['....k..k..k.....', '...khk.khkhk.k..', '..khhhkhhhhhkhk.', '.khhhhhhhhhhhhk.', 'khhhhhhhhhhhHhhk', 'khhhhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', '.khhhhhhhhhhhhk.', '..khkhhhhhhkhk..', '...kkSssssSkk...'],
    right: ['.....k...k......', '..k.khk.khk.....', '.khkhhhkhhhk....', 'khhhhhhhhhhhk...', '.khhhhhhhhhhhk..', 'khhhhhhhhhhhhhk.', '.khhhhhhhhshhhk.', 'khhhhhhsssskssk.', '.khhhhhssssksssk', '..khhhkSssssssk.', '...kkk.kSsssskk.'],
  },
  krillin: {
    down: ['........', '........', '......kk', '....kkss', '...kssse', '..kssess', '..ksssss', '..ksskss', '..ksskss', '...kSsss', '....kkkk'],
    up: ['........', '........', '......kk', '....kkss', '...kssss', '..ksssss', '..ksssss', '..ksssss', '..kSssss', '...kSsss', '....kkkk'],
    right: ['................', '................', '......kkkk......', '....kksssskk....', '...kssssseesk...', '..kssssssessssk.', '..ksssssssssssk.', '..kSsssssssksk..', '..kSsSssssskssk.', '...kSssssssssk..', '....kkkkkkkkk...'],
  },
  bulma: {
    down: ['..........kk....', '......kkkkrrk...', '....kkhhhhkrrk..', '...khhhhhhhhkhk.', '..khhHhhhhhhhhk.', '..khhhhhhhhhhhhk', '..khshhhshhhshhk', '..khskssssksshhk', '..khskssssksshk.', '..khssssssssShk.', '..khkSssssSkhk..'],
    up: ['..........kk....', '......kkkkrrk...', '....kkhhhhkrrk..', '...khhhhhhhhkhk.', '..khhhhhhhhHhhk.', '..khhhhhhhhhhhhk', '..khhhhhhhhhhhhk', '..khhhhhhhhhhhk.', '..khhhhhhhhhhhk.', '..khhhhhhhhhhhk.', '...kkSssssSkk...'],
    right: ['..kk............', '.krrkkkkk.......', '.krkhhhhhkk.....', '..khhhhhhhhk....', '.khhhhhhhhhhk...', 'khhhhhhhhhhhhk..', 'khhhhhhhhshhshk.', '.khhhhhhsssksk..', '.khhhhhssssksssk', '.khhhhSsssssssk.', '..khkkkSsssskk..'],
  },
  roshi: {
    down: ['........', '........', '......kk', '....kkss', '...kssss', '..kwssss', '..kwswws', '..kwgggs', '..kwssss', '..kwwwww', '...kwwww', '....kwww', '.....kww', '......kk'],
    up: ['........', '........', '......kk', '....kkss', '...kssss', '..ksssss', '..ksssss', '..kwssss', '..kwssss', '..kwwwww', '...kkkkk'],
    right: ['................', '................', '......kkkk......', '....kksssskk....', '...ksssssssssk..', '..kwsssssssssk..', '..kwssssswwwssk.', '..kwwsssgggggk..', '..kwwssssssssk..', '..kwwwwwwwwwwwk.', '...kwwwwwwwwwk..', '.....kwwwwwwk...', '......kwwwwk....', '.......kkkk.....'],
  },
  elder: {
    down: ['........', '........', '......kk', '....kkss', '...kssss', '..kwssss', '..kwwwss', '..kwskss', '..kwssss', '..kwwwww', '...kwwww', '....kwww', '.....kkk'],
    up: ['........', '........', '......kk', '....kkss', '...kssss', '..ksssss', '..ksssss', '..kwssss', '..kwssss', '..kwwwww', '...kkkkk'],
    right: ['................', '................', '......kkkk......', '....kksssskk....', '...ksssssssssk..', '..kwsssssssssk..', '..kwssssswwwssk.', '..kwwsssssskssk.', '..kwwssssssssk..', '..kwwwwwwwwwwwk.', '...kwwwwwwwwwk..', '.....kwwwwwwk...', '......kkkkkk....'],
  },
  yamcha: {
    down: ['................', '....kkkkkkkk....', '...khhhhhhhhk...', '..khhhHhhhhhhk..', '.khhhhhhhhhhhhk.', '.khhhhhhhhhhhhk.', 'khhhshhhhhhshhhk', 'khhsskssssksshhk', 'khhsskssssksshhk', 'khhkssssssssShhk', 'khhkkSssssSkkhhk', 'kHk..........kHk', '.k............k.'],
    up: ['................', '....kkkkkkkk....', '...khhhhhhhhk...', '..khhhhhhhhhhk..', '.khhhhhhhhhhhhk.', '.khhhhhhhhhhhhk.', 'khhhhhhhhhHhhhhk', 'khhhhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', 'khhhhhhhhhhhhhhk', 'kHhhhhhhhhhhhhHk', '.kkkhhhhhhhhkkk.', '....kkkkkkkk....'],
    right: ['................', '....kkkkkkk.....', '...khhhhhhhk....', '..khhhhhhhhhk...', '.khhhhhhhhhhhk..', 'khhhhhhhhhhhhhk.', 'khhhhhhhhshhhhk.', 'khhhhhhhssskssk.', 'khhhhhhssssksssk', 'khhhhhhkSssssssk', 'khhhhhkkSsssskk.', 'kHhhhk..........', '.kkkk...........'],
  },
  pilaf: {
    down: ['........', '....kkkk', '...khhhh', '..khhHhh', '..kkkkkk', '.kSkssss', 'kSskssss', '.kkskkss', '..ksssss', '...kssrr', '....kkkk'],
    up: ['........', '....kkkk', '...khhhh', '..khhhhh', '..kkkkkk', '.kSkssss', 'kSskssss', '..ksssss', '..ksssss', '...kssss', '....kkkk'],
    right: ['................', '....kkkkkk......', '...khhhhhhk.....', '..khhhhhhHhk....', '..kkkkkkkkkkk...', '..kssssskSkssk..', '..ksssskSsksssk.', '..kssssskkskksk.', '..ksssssssssssk.', '...ksssssrrrsk..', '....kkkkkkkkk...'],
  },
  oolong: {
    down: ['........', '..kk....', '.kSsk...', '.kSsskkk', '..kSssss', '..ksssss', '..ksskss', '..ksssnn', '..kssnkn', '...ksnnn', '....kkkk'],
    up: ['........', '..kk....', '.kSsk...', '.kSsskkk', '..kSssss', '..ksssss', '..ksssss', '..ksssss', '..kSssss', '...kSsss', '....kkkk'],
    right: ['................', '....kk..........', '...kSsk.........', '...kSsskkkk.....', '...kSssssssk....', '..kssssssssskk..', '..ksssssskssnnk.', '..kSsssssssnnknk', '..kSssssssnnnnk.', '...kSsssssssk...', '....kkkkkkkk....'],
  },
  villM: {
    down: ['........', '........', '.....kkk', '...kkhhh', '..khhhhh', '..khHhhh', '..khhsss', '..khskss', '..ksskss', '...kssss', '....kkkk'],
    up: ['........', '........', '.....kkk', '...kkhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '...khhhh', '....kkkk'],
    right: ['................', '................', '.....kkkkkk.....', '...kkhhhhhhk....', '..khhhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhsssshk.', '..khhhhsssskssk.', '..khhhSsssskssk.', '...khSssssssk...', '....kkkkkkkk....'],
  },
  villF: {
    down: ['......kk', '.....khh', '....kkhh', '...khhhh', '..khhhhh', '..khHhhh', '..khhsss', '..khskss', '..khskss', '..khssss', '...kkSss'],
    up: ['......kk', '.....khh', '....kkhh', '...khhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '...kkSss'],
    right: ['......kkk.......', '.....khhhk......', '....kkhhhkk.....', '...khhhhhhhk....', '..khhhhhhhhhk...', '..khhhhhhhhhhk..', '..khhhhhhsssshk.', '..khhhhsssskssk.', '..khhhSsssskssk.', '..khhkSssssssk..', '...kkkkSsssskk..'],
  },
  soldier: {
    down: ['........', '........', '.....kkk', '...kkhhh', '..khhHhh', '..khhhhh', '..kkkkkk', '..ksskss', '..ksskss', '...kssss', '....kkkk'],
    up: ['........', '........', '.....kkk', '...kkhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..khhhhh', '..kSssss', '...kssss', '....kkkk'],
    right: ['................', '................', '.....kkkkkk.....', '...kkhhhhhhk....', '..khhhhhHhhhk...', '..khhhhhhhhhhk..', '..kkkkkkkkkkkkk.', '..kSsssssskssk..', '..kSsssssskssk..', '...kSssssssk....', '....kkkkkkk.....'],
  },
  mai: {
    down: ['........', '....kkkk', '...khhhh', '..khhhhh', '.khhHhhh', '.khhhhhh', '.khhhhhh', '.khsskss', '.khsskss', '.khsssss', '.khkSsss', '.kh.....', '..k.....'],
    up: ['........', '....kkkk', '...khhhh', '..khhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '.khhhhhh', '..kkkkkk'],
    right: ['................', '....kkkkkk......', '...khhhhhhk.....', '..khhhhhhhhk....', '.khhhhhhhhhhk...', '.khhhhhhhhhhhk..', '.khhhhhhhhhhhhk.', '.khhhhhhsssksk..', '.khhhhhssssksk..', '.khhhhhSsssssk..', '.khhhhhkSssskk..', '.khhhhk.........', '..kkkk..........'],
  },
  shu: {
    down: ['........', '..kk....', '..ksk...', '..ksskkk', '..ksssss', '..ksssss', '..ksksss', '..ksswww', '..ksswwk', '...kswww', '....kkkk'],
    up: ['........', '..kk....', '..ksk...', '..ksskkk', '..ksssss', '..ksssss', '..ksssss', '..ksssss', '..ksssss', '...kssss', '....kkkk'],
    right: ['................', '....kk..........', '....ksk.........', '....ksskkkk.....', '...kssssssssk...', '..kssssssssssk..', '..ksssssskssswk.', '..kSsssssswwwwwk', '..kSssssswwwwkkk', '...kSsssswwwwk..', '....kkkkkkkkk...'],
  },
  robot: {
    down: ['.......k', '....kkkk', '...kssss', '..kswsss', '..ksssss', '..kkkkkk', '..krrrrr', '..kkkkkk', '..ksSsSs', '..kSSSSS', '...kkkkk'],
    up: ['.......k', '....kkkk', '...kssss', '..ksssss', '..ksssss', '..kSssss', '..kSssss', '..kSssss', '..kSssss', '..kSSSSS', '...kkkkk'],
    right: ['.........k......', '....kkkkkkk.....', '...ksssssssk....', '..kswssssssk....', '..kssssssssk....', '..ksssskkkkkk...', '..ksssskrrrrk...', '..ksssskkkkkk...', '..ksSsSsSsSsk...', '..kSSSSSSSSSk...', '...kkkkkkkkk....'],
  },
};

// Corps : lignes 11 à 23 (13 lignes). walk = remplacement des lignes 19-23 en vue de profil.
const BODIES = {
  gi: {
    down: ['....kksS', '..kkcccd', '.kaakccd', '.ksskccc', '.kSSkCcc', '.kddkddd', '.ksskppp', '..kkkppp', '....kppk', '....kppk', '....kffk', '...kfffk', '...kkkk.'],
    up: ['....kkSS', '..kkcccc', '.kaakcyy', '.ksskcyy', '.kSSkCcc', '.kddkddd', '.ksskppp', '..kkkppp', '....kppk', '....kppk', '....kffk', '...kfffk', '...kkkk.'],
    right: ['......kssk......', '.....kccdk......', '....kckaakck....', '....kcksskck....', '....kCkSSkCk....', '....kdkddkdk....', '....kcksskpk....', '....kppkkppk....', '.....kppppk.....', '.....kppPpk.....', '.....kfffk......', '.....kffffk.....', '.....kkkkkk.....'],
    walk: [
      ['....kppppppk....', '...kppk..kppk...', '...kffk...kffk..', '..kfffk...kfffk.', '..kkkkk...kkkkk.'],
      ['.....kppppk.....', '.....kpPppk.....', '......kffk......', '......kfffk.....', '......kkkkk.....'],
    ],
  },
  dress: {
    down: ['....kksS', '...kcccc', '..kacccc', '.kakcccc', '.kSkCccc', '.kssdddd', '..kkcccc', '..kccccc', '.kCcCccc', '..kkkkkk', '....kssk', '....kffk', '....kkkk'],
    up: ['....kkSS', '...kcccc', '..kacccc', '.kakcccc', '.kSkCccc', '.kssdddd', '..kkcccc', '..kccccc', '.kCcCccc', '..kkkkkk', '....kssk', '....kffk', '....kkkk'],
    right: ['......kssk......', '.....kcccck.....', '....kcckccck....', '....kckakcck....', '....kckSkcck....', '....kdkskddk....', '....kcckkcck....', '....kccccccck...', '...kCcccccCcck..', '...kkkkkkkkkk...', '.....ksk.ksk....', '.....kfk.kffk...', '.....kk..kkkk...'],
    walk: [
      ['...kCcccccCcck..', '...kkkkkkkkkk...', '....ksk...ksk...', '...kffk...kffk..', '...kkk....kkkk..'],
      ['...kCcccccCcck..', '...kkkkkkkkkk...', '......kssk......', '......kfffk.....', '......kkkkk.....'],
    ],
  },
  shirt: {
    down: ['....kksS', '..kkcccc', '.kaakccc', '.kcckccc', '.kCCkccc', '.ksskCCC', '..kkkddd', '....kddd', '....kllk', '....kllk', '....kffk', '...kfffk', '...kkkk.'],
    up: ['....kkSS', '..kkcccc', '.kaakccc', '.kcckccc', '.kCCkccc', '.ksskCCC', '..kkkddd', '....kddd', '....kllk', '....kllk', '....kffk', '...kfffk', '...kkkk.'],
    right: ['......kssk......', '.....kcccck.....', '....kckaakck....', '....kckcckck....', '....kCkCCkCk....', '....kCksskCk....', '....kkddddkk....', '.....kddddk.....', '.....kllllk.....', '.....kllLlk.....', '.....kfffk......', '.....kffffk.....', '.....kkkkkk.....'],
    walk: [
      ['....kddddddk....', '...kllk..kllk...', '...kffk...kffk..', '..kfffk...kfffk.', '..kkkkk...kkkkk.'],
      ['.....kllllk.....', '.....kllLlk.....', '......kffk......', '......kfffk.....', '......kkkkk.....'],
    ],
  },
  robe: {
    down: ['....kksS', '...kcccc', '..kccccc', '.kcckccc', '.kcckccc', '.kddkccc', '.kssdccc', '..kkkccc', '..kccccc', '..kccccc', '..kCcccc', '..kCCCcc', '..kkkkkk'],
    up: ['....kkSS', '...kcccc', '..kccccc', '.kcckccc', '.kcckccc', '.kddkccc', '.kssdccc', '..kkkccc', '..kccccc', '..kccccc', '..kCcccc', '..kCCCcc', '..kkkkkk'],
    right: ['......kssk......', '.....kcccck.....', '....kcccccck....', '....kckcccck....', '....kckcccck....', '....kdkcccck....', '....kskccccck...', '....kkcccccck...', '....kcccccccck..', '...kccccccccck..', '...kCcccccccCk..', '...kCCcccccCCk..', '...kkkkkkkkkkk..'],
  },
};

const OVERLAYS = {
  shell: {
    up: [11, '................', '....kkkkkkkk....', '...kuuuuuuuuk...', '..kuUuuUUuuUuk..', '..kuuUUuuUUuuk..', '..kuUuuUUuuUuk..', '..kuuUUuuUUuuk..', '...kuuuuuuuuk...', '....kkkkkkkk....'],
    right: [12, '..kkk...........', '.kuuuk..........', '.kuUuk..........', '.kUuuk..........', '.kuUuk..........', '.kuuuk..........', '..kkk...........'],
    down: [12, '...k........k...', '...k........k...'],
  },
};

const CHARS = {
  goku: { head: 'goku', body: 'gi', pal: 'goku' },
  krillin: { head: 'krillin', body: 'gi', pal: 'krillin' },
  bulma: { head: 'bulma', body: 'dress', pal: 'bulma' },
  roshi: { head: 'roshi', body: 'shirt', pal: 'roshi', over: 'shell' },
  yamcha: { head: 'yamcha', body: 'shirt', pal: 'yamcha' },
  pilaf: { head: 'pilaf', body: 'robe', pal: 'pilaf' },
  oolong: { head: 'oolong', body: 'shirt', pal: 'oolong' },
  villM1: { head: 'villM', body: 'shirt', pal: 'villM1' },
  villM2: { head: 'villM', body: 'shirt', pal: 'villM2' },
  villM3: { head: 'villM', body: 'shirt', pal: 'villM3' },
  villF1: { head: 'villF', body: 'dress', pal: 'villF1' },
  villF2: { head: 'villF', body: 'dress', pal: 'villF2' },
  elder: { head: 'elder', body: 'robe', pal: 'elder' },
  soldier: { head: 'soldier', body: 'shirt', pal: 'soldier' },
  mai: { head: 'mai', body: 'shirt', pal: 'mai' },
  shu: { head: 'shu', body: 'shirt', pal: 'shu' },
  robot: { head: 'robot', body: 'shirt', pal: 'robot' },
  bandit: { head: 'villM', body: 'shirt', pal: 'bandit' },
  brigand: { head: 'villM', body: 'shirt', pal: 'brigand' },
};

// ---------------- Ennemis (tournés vers la gauche) ----------------
const MONSTERS = {
  loup: {
    pal: { g: '#8c94ac', G: '#5c6480', w: '#d0d8e8', r: '#e83838' },
    rows: ['..k..k..............', '.kgkkgk.............', '.kggggk..........kk.', 'kgrgggk.........kgk.', 'kggggggkkkkkkkkkgk..', 'kwwggggggggggggggk..', '.kwkgggggggggggGGk..', '..kkgggggggggggGGk..', '....kgwwwwgggGGGk...', '....kgkkgkkkkkGgk...', '....kgk.kgk..kgkgk..', '....kgk.kgk..kgkgk..', '...kkk.kkk..kkkkk...'],
  },
  dino: {
    pal: { g: '#68b048', G: '#3c7a30', y: '#e8d880', r: '#e83838' },
    rows: ['...kkkkk..........', '..kgggggk.........', '.kgrgggggk........', '.kgggggggk........', '.kwkwkgggk........', '..kkkkgggk........', '....kggggk........', '...kgyggggkk......', '..kgkyyggggGkk....', '...kkyyygggGGGkk..', '....kyyygggGGGGGk.', '....kyyyggGGkkkkk.', '.....kyggGGk......', '.....kggkGGk......', '.....kgk.kGk......', '....kkgk.kGkk.....', '....kkkk.kkkk.....'],
  },
  ptero: {
    pal: { b: '#b07858', B: '#7a4a38', y: '#e8c890', Y: '#c8a070', r: '#e83838' },
    rows: ['kk....................kk', 'kyk..................kyk', '.kyk................kyk.', '.kyyk......kk......kyyk.', '..kyyk....kbbk....kyyk..', '..kyYyk..kbbbbk..kyYyk..', '...kyYykkbrbbbkkkyYyk...', 'kkkkyyyybbbbbbbbyyyyk...', 'kbbbbbbbbbbbbbbbbkkk....', '.kkkkbbbbbbbbbBBk.......', '.....kkBbbbbBBkk........', '.......kBkkBkk..........', '.......kk..kk...........'],
  },
  tigre: {
    pal: { o: '#f09030', O: '#b85c18', w: '#f8f0e0', r: '#e83838', t: '#ffffff' },
    rows: ['..k...k...............', '.kok.kok..............', '.koookook.............', 'korookoook.......kk...', 'koooooooookkkkkkkkok..', 'kwwoookoooookoookook..', 'kwtwkooookoooookOOk...', '.kt.kooookooookOOOk...', '..k..kowwwwoooOOOk....', '.....kokkokkkkkOok....', '.....kok.kok..kokok...', '.....kok.kok..kokok...', '....kkk.kkk..kkkkk....'],
  },
  crabe: {
    pal: { r: '#e04830', R: '#a02818', w: '#ffffff' },
    rows: ['.kkk............kkk.', 'krrrk..........krrrk', 'krkrrk........krrkrk', '.k.krk.kk..kk.krk.k.', '....krkkwk.kwkkrk...', '.....kkkkkkkkkkk....', '....krrrrrrrrrrrk...', '...krrrrrrrrrrrrrk..', '..krRrrrrrrrrrrrRrk.', '..kRRrrrrrrrrrrrRRk.', '...kkRRRRRRRRRRRkk..', '..krk.krk...krk.krk.', '..kk..kk.....kk..kk.'],
  },
  scorpion: {
    pal: { b: '#d09038', B: '#905a18', y: '#f0e070', r: '#e83838' },
    rows: ['...............kkk..', '..............kbbbk.', '..............kbyk..', '...............kbk..', '..kk...........kbk..', '.kbbk..........kbk..', 'kbkbbk.......kkbbk..', '.kkbbbkkkkkkkbbbk...', '...kbbbbbbbbbbbk....', '..kbrbbbBbBbBbk.....', '.kbbbbBBbBbBbk......', '..kkBBkBkBkBkk......', '...kk.k.k.k.k.......'],
  },
  serpent: {
    pal: { g: '#7cb83c', G: '#4a7a20', y: '#e8e070', r: '#e83838', t: '#e83040' },
    rows: ['..kkkk..........', '.kggggk.........', 'kgrgggk.........', 'kggggggk........', '.kkkgggk........', 'tt.kgggk........', '....kgggk.......', '....kyggk.......', '.....kygk.......', '...kkkyggkkk....', '..kgggyyggggk...', '.kggGGkkkGGggk..', '.kgGkk...kkGgk..', '.kggGkkkkkGggk..', '..kgggGGGGggk...', '...kkkkkkkkk....'],
  },
  ours: {
    pal: { b: '#8a5a3a', B: '#5a3a24', y: '#d8b080', r: '#ff4030', c: '#a03830', C: '#6a2018', m: '#d8d8e8', M: '#8888a0', h: '#6a4a2a' },
    rows: ['...kk......kk...........', '..kbbk....kbbk..........', '..kbBkkkkkkBbk......kk..', '..kbbbbbbbbbbk.....kmMk.', '.kbbbbbbbbbbbbk...kmMk..', '.kbkkbbbbbkkbbk..kmMk...', '.kbkrbbbbbkrbbk.kmMk....', '.kbbbbyyyybbbbkkmMk.....', '..kbbyykkyybbk.kmMk.....', '..kbbbykkybbbkkmMk......', '...kbbyyyybbk.kkk.......', '..kkkbbbbbbkkkhhk.......', '.kbbkcccccckbbhhk.......', 'kbbbkccCCcckbbkk........', 'kbbkcccCCccckbbk........', 'kbbkccccccccckbk........', 'kbbkcccccccccbbk........', '.kkkCccccccCCkk.........', '...kbbbbbbbbbk..........', '...kbbbbbbbbbbk.........', '..kbbbbbkkbbbbk.........', '..kbbbbk..kbbbk.........', '..kbbbk...kbbbk.........', '.kBBBBk...kBBBBk........', '.kkkkkk...kkkkkk........'],
  },
  taureau: {
    pal: { b: '#9a5aa8', B: '#62307a', y: '#f0e8c0', Y: '#b8a880', r: '#ffe040', w: '#ffffff', c: '#c03030', C: '#801c1c' },
    rows: ['..kk..................kk..', '.kyyk................kyyk.', '.kyYk................kYyk.', '..kyYk..............kYyk..', '...kyyk..kkkkkkkk..kyyk...', '....kyykkbbbbbbbbkkyyk....', '.....kkbbbbbbbbbbbbkk.....', '......kbbbbbbbbbbbbk......', '.....kbbkrrkbbkrrkbbk.....', '.....kbbbkkbbbbkkbbbk.....', '.....kbbbbbbyybbbbbbk.....', '......kbbbyyyyyybbbk......', '......kbbyykyykyybbk......', '...kkkkbbkwkwwkwkbbkkkk...', '..kbbbbkbbbbbbbbbbkbbbbk..', '.kbbBbbbkkbbbbbbkkbbbBbbk.', '.kbBBbbbbbbbbbbbbbbbbBBbk.', '.kbBkbbbbbbBBbbbbbbbkBbk..', '.kbk.kbbbbBBBBbbbbbk.kbk..', 'kyyk.kccccccccccccck.kyyk.', 'kkkk..kccccccccccck..kkkk.', '......kbbbbkkbbbbbk.......', '......kbbbk..kbbbbk.......', '.....kBBBBk..kBBBBBk......', '.....kkkkkk..kkkkkkk......'],
  },
  puar: {
    pal: { b: '#88b8f0', B: '#5a88c8', w: '#ffffff' },
    rows: ['..k........k..', '.kbk......kbk.', '.kbbkkkkkkbbk.', '.kbbbbbbbbbbk.', 'kbbkwkbbkwkbbk', 'kbbkkkbbkkkbbk', 'kbbbbbbbbbbbbk', '.kbbbbkkbbbbk.', '..kbbbbbbbbk..', '...kkbbbbkk...', '....kbbbbk....', '...kbkbbkbk...', '...kk.kk.kk...', '..........kbk.'],
  },
  machine: {
    pal: { m: '#7a8ab0', M: '#4a5a80', y: '#f0d850', Y: '#b89820', r: '#ff4030', c: '#d04040', w: '#e8f0ff', s: '#9cc4f4' },
    rows: ['............kkkkkkkk............', '..........kkwwyyyyyykk..........', '.........kwwyyyyyyyyyyk.........', '........kwyyyysssssyyyyk........', '........kyyyysskkskyyyyk........', '........kyyyysssssssyyyk........', '........kYyyyyssrsssyyYk........', '.........kYYyyyyyyyyYYk.........', '......kkkkkkkkkkkkkkkkkkkk......', '.....kmmmmmmmmmmmmmmmmmmmmk.....', '....kmmwwmmmmmrrmmmmmmmmMMmk....', '...kmmwmmmmmmrrrrmmmmmmmMMMmk...', 'kkkkmmmmmmmmmmrrmmmmmmmmMMMmkkkk', 'kcckmmmmmmmmmmmmmmmmmmmmMMMmkcck', 'kcckMmmmmkkkkkkkkkkkkmmmMMMMkcck', 'kcckMMmmkcccccccccccckmmMMMMkcck', 'kmmkMMMmkcrcrcrcrcrcckmMMMMMkmmk', 'kmmk.kMMMkkkkkkkkkkkkMMMMMk.kmmk', 'kmmk..kkkkkkkkkkkkkkkkkkkk..kmmk', 'kwwk.....kmmk......kmmk.....kwwk', 'kmmmk....kmMk......kmMk....kmmmk', '.kkkk....kmMk......kmMk....kkkk.', '........kmmMMk....kmmMMk........', '.......kmmmMMMk..kmmmMMMk.......', '......kMMMMMMMMk.kMMMMMMMMk.....', '......kkkkkkkkkk.kkkkkkkkkk.....'],
  },
  umigame: {
    pal: { g: '#8ac060', G: '#5a8a3a', u: '#8a6a3a', U: '#5a3a20', y: '#c8a060' },
    rows: ['..kkk.............', '.kgggk...kkkkkk...', 'kgkggk.kkuyuyuukk.', 'kgggggkuuyuuyuuuuk', '.kkgggkuyuuyuuyuuk', '...kggkuuyuuyuuuk.', '...kgggkkkkkkkkkk.', '..kgggk.kggk.kggk.', '..kkkk..kkk..kkk..'],
  },
};
// Variantes de palette
MONSTERS.loup_noir = { pal: { g: '#4a4a62', G: '#2a2a3c', w: '#9098b0', r: '#ffd030' }, rows: MONSTERS.loup.rows };
MONSTERS.mouette = { pal: { b: '#e8e8f0', B: '#a0a0b8', y: '#ffffff', Y: '#c8c8d8', r: '#f0a020' }, rows: MONSTERS.ptero.rows };
MONSTERS.dino_rouge = { pal: { g: '#d05838', G: '#8a3020', y: '#f0d090', r: '#ffe040' }, rows: MONSTERS.dino.rows };
MONSTERS.serpent_sable = { pal: { g: '#d0a850', G: '#987028', y: '#f0e0a0', r: '#e83838', t: '#e83040' }, rows: MONSTERS.serpent.rows };
