# Dragon Ball – La Quête des 7 Boules

Un petit RPG 2D en pixel art, hommage à **Dragon Ball** et à **Chrono Trigger**.
Il tourne dans le navigateur, sans aucune dépendance : HTML5 Canvas et JavaScript, avec une musique chiptune générée par la Web Audio API.

> Jeu de fan non officiel et sans but commercial. Dragon Ball © Akira Toriyama / Bird Studio, Shueisha, Toei Animation.

## Jouer

- **Le plus simple** : ouvre `index.html` dans un navigateur (double-clic).
- **Ou avec un petit serveur local** : `npx serve .` (ou `python3 -m http.server`), puis ouvre l'adresse indiquée.
- **Version fichier unique** : `node tools/standalone.js` génère `dragon-ball.html`, un seul fichier facile à partager.
- **En ligne** : active GitHub Pages sur la branche (dossier racine) et le jeu sera jouable directement depuis le téléphone.

La partie se sauvegarde dans le navigateur (points de repos scintillants ou menu → Sauver).

## Commandes

| Action | Clavier | Tactile |
| --- | --- | --- |
| Se déplacer | Flèches / ZQSD / WASD | Croix directionnelle |
| Valider / parler / ouvrir | Z, Entrée, Espace | A |
| Retour / menu | X, Échap | B / MENU |
| Courir | Maj | COURIR |
| Couper le son | M | menu → Son |

Sur téléphone, les commandes tactiles s'affichent automatiquement.

## Ce qu'il y a dans le jeu

- **Exploration façon Chrono Trigger** : vue de dessus, les membres de l'équipe suivent le meneur, et les ennemis sont visibles sur la carte (pas de combats aléatoires).
- **Combats ATB sur le terrain** : le combat se déroule directement sur la carte, sans écran séparé. Chaque héros a sa jauge de temps (mode « attente » pendant les sous-menus).
- **Sprites détaillés** : personnages en 24x32 pixels avec ombrages et contours, monstres et boss redessinés, portraits dans les dialogues.
- **5 héros** : Goku, Bulma, Krilin, Yamcha et Oolong. Trois combattent en même temps, les autres attendent en réserve (menu → Équipe) et gagnent quand même de l'expérience.
- **Techniques** : Kamehameha, Bâton Magique, Jan Ken, Capsules de Bulma, Taiyoken, Kienzan, Poing du Loup, Sokidan, Transformation…
- **Techniques doubles** : quand deux héros ont leur jauge pleine, ils peuvent lancer *Double Kamehameha*, *Flash Bombe*, *Double Croc*, *Taureau Kamehameha*…

### Une histoire avec des choix

- **Un prologue et 7 chapitres** : maison de Goku, forêt de Paozou, Kame House, village d'Aru, désert de Diablo, Mont Frypan, château de Pilaf et la nuit de pleine lune.
- **Des choix qui comptent** : épargner ou chasser l'Ours Brigand, poursuivre les espions de Pilaf, pardonner à Oolong ou le livrer au village, recruter Yamcha ou non, promettre d'épouser Chichi… et sauver le château de Gyumao en affrontant l'Esprit du Volcan, ou tout pulvériser d'un Kamehameha.
- **Affinités** : tes réponses rapprochent (ou fâchent) tes compagnons. Les soirées au feu de camp permettent de mieux les connaître.
- **Quêtes secondaires** suivies dans le Journal (menu) : la tortue perdue, la grand-mère malade, le marchand dévalisé, la boussole du nomade, le château en flammes.
- **Conséquences** : l'évasion des cachots de Pilaf dépend de qui t'accompagne (Oolong, Yamcha, le plan des espions… ou un Kamehameha bien bruyant).
- **Finale** : Pilaf invoque Shenron, et il faut faire un vœu avant lui. Les vœux disponibles dépendent de ton aventure (revoir Grand-père Gohan, rebâtir le château de Gyumao, le vœu d'un compagnon…).
- **Épilogue et 3 fins** : chaque personnage connaît un destin différent selon tes choix, et ton karma décide de la fin (Le Cœur Pur, Le Petit Héros ou Le Garnement).

### Chapitre 7 : la pleine lune

Après le vœu, Pilaf enferme l'équipe dans une cage. La nuit tombe, les nuages s'écartent... et Goku regarde la pleine lune. Il se transforme en **singe géant** ! Sans Goku, ses amis doivent l'arrêter : frapper le singe ne sert à rien, il faut viser **sa queue**. On choisit ensuite qui la coupe (Yamcha, Oolong, Krilin ou Bulma), et l'épilogue s'en souvient.

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
- **Voyage rapide en Kinto'un** (menu → Kinto'un) : une fois le nuage obtenu chez Tortue Géniale, on survole la carte du monde et on choisit un lieu déjà visité. Goku décolle, traverse la carte sur son nuage et atterrit près du point de repos.
- **Personnalisation de Goku** (menu → Style) : couleur du kimono, de la ceinture, des bottes et des cheveux, queue de singe, emblème… et un style secret à débloquer.

### Et aussi

- **9 boss** : l'Ours Brigand, Krilin (duel amical), le Chef Brigand, Oolong, Yamcha et Puar, Chichi, l'Esprit du Volcan, la Pilaf Machine et Goku en singe géant.
- **13 zones**, dont le campement, le Mont Frypan, le cœur du volcan et les cachots du château.
- Boutiques (objets et équipements), auberge, coffres, Dragon Radar (menu → Boules), objets clés, sauvegarde.

## Structure du code

```
index.html        page, mise à l'échelle et commandes tactiles
js/font.js        police pixel art (avec les accents)
js/audio.js       musiques chiptune originales et effets sonores
js/sprites.js     sprites des personnages (têtes, corps, palettes)
js/monsters.js    monstres et boss (grilles + palettes)
js/gfx.js         tuiles procédurales, arbres, bâtiments, objets
js/data.js        héros, techniques, objets, ennemis, quêtes
js/gear.js        équipements visibles et personnalisation de Goku
js/techs.js       techniques personnalisées (atelier, aperçu, combat)
js/engine.js      entrées, tâches asynchrones, état de la partie, sauvegarde
js/ui.js          fenêtres, dialogues et portraits, menu, journal, boutique
js/field.js       exploration : cartes, collisions, PNJ, ennemis visibles
js/battle.js      système de combat ATB
js/minigames.js   mini-jeux d'entraînement de Tortue Géniale
js/worldmap.js    carte du monde et voyage en Kinto'un
js/maps.js        cartes, événements, scénario et choix
js/main.js        boucle principale, écran titre, finale, épilogue et crédits
tools/standalone.js  génère une version en un seul fichier HTML
```

Tous les graphismes sont générés par le code au lancement : pixel art en grilles de caractères et tuiles procédurales. Il n'y a aucun fichier image.
