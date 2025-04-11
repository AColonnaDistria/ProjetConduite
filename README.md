Projet de conduite de projet (HAI810)

Nom de groupe: QT-800

Membres :
* Antoine Colonna d'Istria (acolonnadistria)
* Nanradoum Gentil (Reactor0)
* Valentino Cocks (vitno6)
* Mathis Rosier (Comitichini)

Projet QT Robot - Application de Lecture Interactive

Ce projet propose une application web interactive où un robot nommé QT raconte des histoires aux enfants tout en exprimant différentes émotions. À certains moments de l'histoire, les enfants doivent reconnaître l’émotion du robot et cliquer sur la bonne réponse parmi quatre choix.

Structure du Projet:
ProjetConduite-fenetreDeScenes/
│
├── public/                        # Contenu du site web (HTML/CSS/JS/audio)
│   ├── index.html                 # Page principale de l'application
│   ├── front.js                   # Script principal (affichage, audio, émotions, interactions)
│   ├── stylesheet.css             # Styles CSS
│   └── audio/                     # Audios des émotions (affection.opus, joie.opus, etc.)
│
├── make_story/                    # Génération automatique d’histoires
│   ├── make_story.js              # Générateur de fichiers JSON à partir d’un texte
│   ├── make_story_gtts.js         # Version avec génération audio (GTTS)
│   └── text.txt                   # Texte brut de l’histoire à transformer
│
├── server.js                      # Serveur Express.js pour servir les fichiers localement
├── firebase.json                  # Configuration Firebase Hosting
├── .firebaserc                    # ID du projet Firebase
└── README.md                      # Ce fichier (instructions du projet)


Fonctionnalités:
Lecture audio d’histoires par le robot QT.

Expressions faciales animées correspondant à l’émotion ressentie.

Interaction avec l’utilisateur : il doit deviner l’émotion en cliquant sur le bon bouton.

Possibilité d’ajouter plusieurs histoires.

Images qui changent automatiquement en fonction de l’histoire.

Application hébergée via Firebase Hosting:

Installation et Lancement en Local
1. Cloner le projet
bash
Copy
Edit
git clone <url-du-dépôt>
cd ProjetConduite

3. Installer les dépendances (pour le serveur)
npm install
4. Lancer le serveur local
node server.js
Le serveur sera accessible à l’adresse http://localhost:3000 (ou un autre port indiqué).

⚠️ Note : Si tu n’utilises pas le serveur server.js, tu peux simplement ouvrir public/index.html dans un navigateur ou déployer via Firebase.

🚀 Déploiement avec Firebase Hosting
Étapes à suivre :
Installer Firebase CLI :


npm install -g firebase-tools
Se connecter à son compte :


firebase login
Initialiser le projet :

firebase init
Choisir Hosting

Sélectionner le dossier public/

Ne pas configurer comme SPA (Single Page Application) sauf besoin spécifique

Ne pas écraser index.html s’il est demandé

Déployer :

bash
Copy
Edit
firebase deploy
Le lien de ton site sera affiché dans la console à la fin du déploiement.

📚 Ajouter une Histoire Personnalisée
Méthode 1 : Génération manuelle
Créer un fichier JSON représentant l’histoire :

json
Copy
Edit
{
  "name": "Titre de l’histoire",
  "audio": "/audio/mon_histoire.opus",
  "emotions": [
    { "time": 12, "emotion": "joie" },
    { "time": 25, "emotion": "peur" }
  ]
}
Ajoute ce fichier dans le bon répertoire et n’oublie pas d’inclure son chemin dans index.json.

Méthode 2 : Utiliser le générateur automatique
Ouvre le fichier make_story/text.txt et écris ton histoire.

Lance le script :


node make_story/make_story.js
Le fichier JSON sera généré à partir du texte.

Optionnel : tu peux utiliser make_story_gtts.js pour générer aussi l’audio via Google Text-to-Speech (GTTS).

Comportement de l'application:
L’audio principal de l’histoire joue automatiquement.

Quand une émotion est détectée à un moment précis (time dans le JSON), le robot s’arrête et affiche une expression.

L’enfant doit choisir parmi 4 boutons l’émotion affichée. Si correct : "bravo" est joué, sinon "perdu".

Après la réponse, l’histoire continue automatiquement.

Technique:

HTML/CSS/JS

Node.js + Express.js pour un serveur local simple

Firebase Hosting pour hébergement

GTTS (Google Text-to-Speech) pour la génération vocale automatique

Utilisation d’Audio, setTimeout, addEventListener, DOM API côté client
