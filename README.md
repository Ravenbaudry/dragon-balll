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
- **Techniques** : Kamehameha, Bâton Magique, Jan Ken, Capsules de Bulma, Taiyoken, Kienzan…
- **Techniques doubles** : quand deux héros ont leur jauge pleine, ils peuvent lancer *Capsule Frappe*, *Double Kamehameha* ou *Flash Bombe*.
- **3 héros jouables** : Goku, Bulma et Krilin, avec des niveaux et de nouvelles techniques qui s'apprennent.
- **8 zones** : maison de Goku, Mont Paozou, forêt, plage de la Kame House, route de montagne, village d'Aru, désert de Diablo et château de Pilaf.
- **4 boss** : l'Ours Brigand, Oolong, Yamcha et Puar, puis la Pilaf Machine (avec Shu et Mai).
- **Finale** : on invoque Shenron avec les 7 boules, et 4 vœux mènent à 4 fins différentes.
- Boutique, auberge, coffres, Dragon Radar (menu → Boules), sauvegarde.

## Structure du code

```
index.html        page, mise à l'échelle et commandes tactiles
js/font.js        police pixel art (avec les accents)
js/audio.js       musiques chiptune originales et effets sonores
js/sprites.js     sprites des personnages et des monstres (grilles + palettes)
js/gfx.js         tuiles procédurales, arbres, bâtiments, objets
js/data.js        héros, techniques, objets, ennemis
js/engine.js      entrées, tâches asynchrones, état de la partie, sauvegarde
js/ui.js          fenêtres, dialogues, menu, boutique
js/field.js       exploration : cartes, collisions, PNJ, ennemis visibles
js/battle.js      système de combat ATB
js/maps.js        cartes, événements et scénario
js/main.js        boucle principale, écran titre, finale et crédits
tools/standalone.js  génère une version en un seul fichier HTML
```

Tous les graphismes sont générés par le code au lancement : pixel art en grilles de caractères et tuiles procédurales. Il n'y a aucun fichier image.
