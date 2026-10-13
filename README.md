# Dragon Ball – La Quête des 7 Boules

Un petit RPG 2D en pixel art, hommage à **Dragon Ball** et à **Chrono Trigger**.
Il tourne dans le navigateur, sans aucune dépendance : HTML5 Canvas et JavaScript, avec une musique chiptune générée par la Web Audio API.

> Jeu de fan non officiel et sans but commercial. Dragon Ball © Akira Toriyama / Bird Studio, Shueisha, Toei Animation.

## Jouer

- **Le plus simple** : ouvre `index.html` dans un navigateur (double-clic).
- **Ou avec un petit serveur local** : `npx serve .` (ou `python3 -m http.server`), puis ouvre l'adresse indiquée.
- **Version fichier unique** : `node tools/standalone.js` génère `dragon-ball.html`, un seul fichier facile à partager.
- **En ligne et sur téléphone** : voir ci-dessous.

### L'installer sur téléphone (et jouer hors connexion)

- **Android (Chrome)** : ouvre l'adresse du jeu, puis menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
- **iPhone (Safari)** : ouvre l'adresse, bouton **Partager** → **Sur l'écran d'accueil**.

Le jeu s'ouvre alors en plein écran comme une vraie application, avec son icône. Une fois lancé une première fois, il fonctionne même sans connexion. Quand le jeu est mis à jour, la nouvelle version est téléchargée automatiquement dès qu'il y a du réseau.

La partie se sauvegarde dans le navigateur (points de repos scintillants ou menu → Sauver).

## Commandes

| Action | Clavier | Manette | Tactile |
| --- | --- | --- | --- |
| Se déplacer | Flèches / ZQSD / WASD | Croix ou stick | Croix directionnelle |
| Valider / parler / ouvrir | Z, Entrée, Espace | A | A |
| Retour | X, Échap | B | B |
| Menu (et combat auto en combat) | C, Tab | Start / Y | MENU |
| Courir | Maj | X / gâchette | COURIR |
| Couper le son | M | | menu → Options |

**Mode 2 joueurs** (menu → Options) : le deuxième joueur dirige les 2e et 3e héros en combat avec I/J/K/L, U (valider) et O (retour), ou avec une deuxième manette.

Sur téléphone, les commandes tactiles s'affichent automatiquement.

## Ce qu'il y a dans le jeu

- **Exploration façon Chrono Trigger** : vue de dessus, les membres de l'équipe suivent le meneur, et les ennemis sont visibles sur la carte (pas de combats aléatoires).
- **Combats ATB sur le terrain** : le combat se déroule directement sur la carte, sans écran séparé. Chaque héros a sa jauge de temps (mode « attente » pendant les sous-menus).
- **Sprites détaillés** : personnages en 24x32 pixels avec ombrages et contours, monstres et boss redessinés, portraits dans les dialogues.
- **8 héros** : Goku, Bulma, Krilin, Yamcha, Oolong, et les nouveaux venus **Lunch** (elle change de personnalité en éternuant : douce soigneuse ou blonde à la mitraillette), **Puar** (il vole, esquive et se métamorphose) et **Chichi** (rayon du casque, et une vraie colère si Goku tombe). Trois combattent en même temps, les autres attendent en réserve (menu → Équipe). C-8 rejoint aussi l'équipe le temps de la Tour Muscle.
- **Techniques** : Kamehameha, Bâton Magique, Jan Ken, Capsules de Bulma, Taiyoken, Kienzan, Poing du Loup, Sokidan, Transformation…
- **Techniques doubles et triples** : *Double Kamehameha*, *Flash Bombe*, *Promesse Éternelle*… et, à trois, *Triple Kamehameha*, *Grande Farce*, *Ruée de la Tortue* ou *Pique-nique*.

### Des combats plus riches

- **Frappes au bon moment** : appuie au bon instant pour un coup parfait, une parade, ou un Kamehameha chargé à fond.
- **Garde et Concentrer** : se protéger (et regagner un peu de Ki), ou se concentrer pour recharger son Ki.
- **Attaques annoncées** : un « ! » prévient qu'un boss prépare une grosse attaque. Paralyser ou endormir l'ennemi l'interrompt.
- **Duel de rayons** : quand un ennemi lance un rayon, un héros qui connaît le Kamehameha riposte. Martèle le bouton pour repousser le rayon !
- **Terrain** : un ennemi projeté dans l'eau, la lave ou hors du ring, des éclaboussures sur les voisins, et les rochers qui protègent des attaques de Ki.
- **États et faiblesses** : poison, brûlure, sommeil, paralysie ; certains ennemis résistent aux coups ou au Ki, d'autres sont immunisés à certains états. Il y a même un ennemi invisible et un rayon diabolique sans effet sur un cœur pur...
- **Combat automatique**, **vitesse des combats** (normale, rapide, très rapide) et **mode 2 joueurs**.

### Progression

- **Compétences** (menu → Compétences) : un point tous les deux niveaux pour apprendre des talents passifs (Vigueur, Contre-attaque, Ténacité, Premier coup, Œil du tigre...).
- **Maîtrise des techniques** : plus on utilise une technique, plus elle devient puissante et économique (niveaux 1 à 3).
- **Accessoires** : un emplacement de plus, avec des effets (relever un héros K.O., jauge plus rapide, Ki ou PV rendus à chaque tour, anti-poison, esquive...).
- **Cuisine** (menu → Cuisine) : pêche (Goku pêche avec sa queue !) et cueillette sur les cartes, puis des plats qui donnent un bonus pendant plusieurs combats.

### Exploration

- **Les pouvoirs des héros** : Goku allonge son Bâton Magique pour franchir un passage, pulvérise les rochers d'un Kamehameha, Oolong ou Puar se changent en souris pour fouiller un trou, Bulma pirate les portes électroniques, et le Taiyoken de Krilin éclaire les grottes obscures.
- **Un secret dans chaque zone**, une **grotte à énigmes** (blocs à pousser sur des dalles) et des **trésors enterrés** que le Dragon Radar de Bulma fait biper.
- **Kinto'un en vol libre** : on pilote le nuage au-dessus de la carte du monde, on atterrit où l'on veut... gare à la flotte de Pilaf (un shoot'em up) ! Deux **îles secrètes** se découvrent en survolant la mer : la doyenne des tortues et le gardien de pierre.

### Modes de jeu

- **Infiltration** : traverser la cour du château de Pilaf la nuit (le défi de Mai), puis le quartier général du Ruban Rouge, en se cachant dans les tonneaux.
- **Shoot'em up** sur le Kinto'un contre les flottes de Pilaf et du Ruban Rouge.
- **Arène de défis** (moine de l'île Papaye, après le tournoi) : survie en 10 vagues, enchaînement de boss, contre la montre, Goku seul, sans objets.
- **Mini-jeux** : entraînement de Tortue Géniale, pêche, grimpette de la Tour de Karine.

### Confort

- **3 niveaux de difficulté**, **3 emplacements de sauvegarde**, **mini-carte**, **rappel de l'objectif** en entrant dans une zone, **manette**, et toutes les options dans menu → Options.

### Une histoire avec des choix

- **Un prologue, 13 chapitres et un bonus** : maison de Goku, forêt de Paozou, Kame House, village d'Aru, désert de Diablo, Mont Frypan, château de Pilaf, la nuit de pleine lune, le Championnat du monde (après les crédits), puis tout l'**arc du Ruban Rouge** et Baba la voyante.
- **Des choix qui comptent** : épargner ou chasser l'Ours Brigand, poursuivre les espions de Pilaf, pardonner à Oolong ou le livrer au village, recruter Yamcha ou non, promettre d'épouser Chichi… et sauver le château de Gyumao en affrontant l'Esprit du Volcan, ou tout pulvériser d'un Kamehameha.
- **Affinités** : tes réponses rapprochent (ou fâchent) tes compagnons. Les soirées au feu de camp permettent de mieux les connaître.
- **Quêtes secondaires** suivies dans le Journal (menu) : la tortue perdue, la grand-mère malade, le marchand dévalisé, la boussole du nomade, le château en flammes.
- **Conséquences** : l'évasion des cachots de Pilaf dépend de qui t'accompagne (Oolong, Yamcha, le plan des espions… ou un Kamehameha bien bruyant).
- **Finale** : Pilaf invoque Shenron, et il faut faire un vœu avant lui. Les vœux disponibles dépendent de ton aventure (revoir Grand-père Gohan, rebâtir le château de Gyumao, le vœu d'un compagnon…).
- **Épilogue et 3 fins** : chaque personnage connaît un destin différent selon tes choix, et ton karma décide de la fin (Le Cœur Pur, Le Petit Héros ou Le Garnement).

### Chapitre 7 : la pleine lune

Après le vœu, Pilaf enferme l'équipe dans une cage. La nuit tombe, les nuages s'écartent... et Goku regarde la pleine lune. Il se transforme en **singe géant** ! Sans Goku, ses amis doivent l'arrêter : frapper le singe ne sert à rien, il faut viser **sa queue**. On choisit ensuite qui la coupe (Yamcha, Oolong, Krilin ou Bulma), et l'épilogue s'en souvient.

### Chapitre 8 : le Championnat du monde

Après les crédits, **un an plus tard** : Goku et Krilin ont fini leur entraînement chez Tortue Géniale (deux niveaux de plus), et la queue de Goku a repoussé... Le passeur de la Kame House emmène l'équipe sur l'**île Papaye** (aussi accessible ensuite en Kinto'un) pour le 21e Championnat du monde des arts martiaux.
- **Un vrai tableau de tournoi** à huit combattants : Krilin, Bactérian, Jackie Chun, Yamcha, Goku, Giran, Nam et Ranfan.
- **Des combats en un contre un** : Krilin contre Bactérian (il n'a pas de nez !), Goku contre Giran le monstre ailé, contre Nam, puis la finale contre le mystérieux **Jackie Chun**. Les autres combats sont mis en scène.
- **Des choix** : promettre ou non d'aider le village de Nam, garder ou donner la bourse du champion, et deviner (ou pas) qui se cache derrière les lunettes noires de Jackie Chun.
- **La finale** : la nuit tombe, la pleine lune se lève, Goku redevient singe géant... et Jackie Chun détruit la lune d'un Kamehameha. Le combat reprend, puis c'est le double K.O. : dans le mini-jeu *« Debout, Goku ! »*, il faut marteler le bouton pour que Goku se relève avant la fin du compte.
- **Deux issues** : champion (Ceinture du Champion) ou finaliste (Bandeau d'Argent), avec leur épilogue.

### L'arc du Ruban Rouge (chapitres 9 à 13 et bonus)

Après le tournoi, rentre à la Kame House : Bulma a fabriqué un nouveau radar, et Goku part à la recherche de la boule à quatre étoiles de son grand-père. Mais l'armée du Ruban Rouge cherche aussi les boules...
- **Chapitre 9, la Tour Muscle** : le village enneigé de Jingle, la petite Suno, puis cinq étages et leurs gardiens : le Sergent Métallique, le ninja Murasaki et ses frères (une partie de cache-cache dans les jarres), C-8 qui refuse de se battre et devient ton ami, la fosse de Buyon (les coups rebondissent... il faut le faire geler) et le général Blanc.
- **Chapitre 10, le village Pingouin** : le radar est cassé ! Le professeur Senbei peut le réparer, si tu retrouves Arale... et que tu survis à son « N'cha Punch ».
- **Chapitre 11, la grotte des pirates** : des piques qui sortent du sol, un robot pirate, un trésor, le général Bleu et son regard paralysant (Oolong ou Puar savent qu'il a peur des souris), puis une fuite contre la montre dans un tunnel qui se remplit d'eau.
- **Chapitre 12, la Tour de Karine** : Upa et Bora, Tao Paï Paï, imbattable la première fois... Il faut grimper la tour (mini-jeu), attraper Karine pour boire l'eau sacrée, puis redescendre prendre sa revanche.
- **Chapitre 13, l'assaut du QG** : la flotte du Ruban Rouge en shoot'em up, l'infiltration de la cour, le bureau du commandant Red, la trahison de Black et son Armure de Combat.
- **Bonus, Baba la voyante** : cinq combattants au-dessus du lac maudit (Dracula Man, l'Homme Invisible, la Momie, Akkuman et son rayon diabolique, et un mystérieux masqué...). Puis Shenron, et le vœu promis à Upa.

### Atelier de techniques

Menu → Techniques → « + Créer une technique » : chaque héros peut inventer jusqu'à 4 techniques personnelles.
- **Forme** : vague (comme le Kamehameha), boule, disque tranchant, rafale, pluie de météores, poing chargé ou aura de soin.
- **Cible** : un ennemi ou tous les ennemis (un allié ou toute l'équipe pour les soins).
- **Couleurs** : couleur principale et couleur de l'éclat (11 choix chacune), plus la **taille** de l'effet.
- **Effet bonus** : paralysie, perce-garde, vol de vie, critique (ou réveil des K.O. pour les soins).
- **Coût en Ki** : de 2 à 30. Plus la technique coûte cher, plus elle est puissante ; un effet bonus prend une partie du coût.
- **Nom** : à taper au clavier ou avec une grille de lettres (tactile), ou tiré au hasard.

Un aperçu animé montre la technique sur des mannequins d'entraînement, avec les dégâts estimés. Les techniques sont sauvegardées et utilisables en combat.

### Entraînement, équipement et style

- **Entraînement chez Tortue Géniale** : après sa rencontre, parle-lui à la Kame House pour lancer 4 mini-jeux simples, chacun avec un rang de C à S :
  - *Rythme de la Tortue* : un « Guitar Hero » simplifié à trois colonnes (Gauche, Haut, Droite) ; il augmente le Ki ;
  - *Livraison du lait* : une course où l'on saute les obstacles et attrape les bouteilles (Vitesse) ;
  - *Casse-briques* : frapper au bon moment sur une jauge de précision (Force) ;
  - *Méditation* : retenir et reproduire une suite de flèches (Puissance).
  
  Chaque héros peut s'entraîner. Battre son record rend plus fort, et un rang S rapporte un équipement exclusif.
- **Équipement visible sur les sprites** : armes (bâton, sabre, gants), tenues (plastron, kimono de la Tortue, armure, carapace) et couvre-chefs (bandeaux, lunettes, casque à cornes). Ils apparaissent sur le terrain, en combat et dans les portraits (menu → Équipement).
- **Voyage en Kinto'un** (menu → Kinto'un) : une fois le nuage obtenu chez Tortue Géniale, on survole librement la carte du monde et on atterrit sur un lieu connu (menu : passer d'un lieu à l'autre, Maj : voler plus vite).
- **Personnalisation de Goku** (menu → Style) : couleur du kimono, de la ceinture, des bottes et des cheveux, queue de singe, emblème… et un style secret à débloquer.

### Et aussi

- **Plus de 30 boss** : l'Ours Brigand, Krilin, le Chef Brigand, Oolong, Yamcha et Puar, Chichi, l'Esprit du Volcan, la Pilaf Machine, le singe géant, les combattants du tournoi, le gardien de pierre, puis tous ceux du Ruban Rouge et de Baba.
- **Plus de 35 zones**, des forêts de Paozou aux neiges de Jingle, de la grotte sous-marine au sommet de la Tour de Karine.
- Boutiques (objets et équipements), auberge, coffres, Dragon Radar (menu → Boules), objets clés, journal des quêtes.

## Structure du code

```
index.html        page, mise à l'échelle et commandes tactiles
js/font.js        police pixel art (avec les accents)
js/audio.js       musiques chiptune originales et effets sonores
js/sprites.js     sprites des personnages (têtes, corps, palettes)
js/monsters.js    monstres et boss (grilles + palettes)
js/gfx.js         tuiles procédurales, arbres, bâtiments, objets
js/options.js     options (difficulté, vitesse, combat auto, 2 joueurs...)
js/data.js        héros, techniques, objets, ennemis, quêtes
js/gear.js        équipements visibles, accessoires et personnalisation de Goku
js/techs.js       techniques personnalisées (atelier, aperçu, combat)
js/engine.js      entrées, tâches asynchrones, état de la partie, sauvegarde
js/ui.js          fenêtres, dialogues et portraits, menu, journal, boutique
js/field.js       exploration : cartes, collisions, PNJ, ennemis visibles
js/hud.js         mini-carte, rappel de l'objectif
js/battle.js      système de combat ATB (frappes au bon moment, duels de rayons...)
js/minigames.js   mini-jeux d'entraînement de Tortue Géniale
js/worldmap.js    carte du monde, vol libre en Kinto'un et flotte ennemie
js/maps.js        cartes, événements, scénario et choix
js/tournoi.js     chapitre 8 : île Papaye, tournoi, destruction de la lune
js/progress.js    compétences, maîtrise, cuisine, pêche et cueillette
js/heroes.js      Lunch, Puar et Chichi
js/explore.js     pouvoirs sur la carte, secrets, grotte à énigmes, îles secrètes
js/modes.js       shoot'em up, infiltration, arène de défis
js/ruban.js       arc du Ruban Rouge : personnages, chapitres 9 et 10
js/ruban2.js      chapitres 11 et 12 : la grotte des pirates, la Tour de Karine
js/ruban3.js      chapitre 13 et bonus : le QG, Baba la voyante, le vœu final
js/main.js        boucle principale, écran titre, finale, épilogue et crédits
manifest.webmanifest, sw.js, icons/   application installable et mode hors connexion
tools/standalone.js  génère une version en un seul fichier HTML
tests/            tests automatiques (voir ci-dessous)
```

Tous les graphismes du jeu sont générés par le code au lancement : pixel art en grilles de caractères et tuiles procédurales. Les seules images sont les icônes de l'application.

## Tests automatiques

```
npm install          # une seule fois (ESLint et Playwright)
npm test             # tous les tests
npm run test:static  # vérifications rapides, sans navigateur
node tests/run.js features story-good story-bad tournoi ruban
```

- **static** : syntaxe, lint, cartes (murs, sorties, atterrissages du Kinto'un), références aux ennemis, objets et sprites, musiques, fichiers du mode hors connexion.
- **features** : menus, équipement, style, mini-jeux, vol libre en Kinto'un et îles secrètes, atelier de techniques, sauvegarde, mode hors connexion.
- **story-good / story-bad** : toute l'aventure, du prologue aux crédits, avec les « bons » puis les « mauvais » choix.
- **tournoi** : le chapitre 8 en entier, une fois champion (promesse tenue, Jackie Chun démasqué) et une fois finaliste.
- **ruban** : tout l'arc du Ruban Rouge, de la Tour Muscle au vœu pour Bora.

Sur GitHub, ces tests tournent tout seuls à chaque envoi (onglet **Actions**). En cas d'échec, les captures d'écran sont jointes au résultat.
