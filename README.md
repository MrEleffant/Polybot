![LogoPolytech](https://www.polytech-reseau.org/wp-content/uploads/2021/03/cropped-logo_reseau_Polytech.png)

# Polybot
 
Bienvenu à Poytech !
Ce readme a pour objectif de te guider dans la mise en place de ton discord de classe pour ces 3 prochaines années.
Vous êtes bien sur libre de faire votre groupe de classe comme vous le souhaitez. Nous souhaitons simplement partager ce qui a fonctionné pour notre promotion.

Il est important de noter qu'il faudra héberger ce bot, libre à vous de choisir votre hébergeur.
Pour notre part ce sera sur une raspberry pi.

La mise en place du bot peut te prendre un peu de temps, mais c'est un gain de temps pour le reste de l'année...

En terme de difficulté, il n'y a rien d'inabordable pour quelqu'un qui souhaite faire une école d'ingénieur en informatique...

Ce bot sera opérationnel pour la rentrée scolaire 2023-2024.
*Il est possible que des changements soient nécessaires suite à l'évolution de Discord.js.*

**Prêt ? Aller c'est parti !**

Ce guide sera décomposé en plusieurs parties :
- [Préparation de l'environnement](#Préparation)
    - [Clonnage du discord](#Clonnage-du-discord)
    - [Création du bot](#Création-du-bot)
    - [Ajout du bot](#Ajout-du-bot)
- [Configuration](#configuration)
    - [Installation](#installation)
    - [Configuration du bot](#configuration-du-bot)
- [Utilisation](#utilisation)
- [Commandes](#commandes)

# Préparation
## Clonnage du discord
Cliquer ici -> [Clonner le Serveur](https://discord.new/VSjFR3PcZSHZ)
![Clonner le discord](https://media.discordapp.net/attachments/1092833982212751450/1109225226153242746/image.png)
- Choisir l'icône de votre serveur
- Choisir le nom de votre serveur
- Cliquer sur "Créer"

## Création du bot
Pour créer un bot, il faut se rendre sur le [portail développeur de Discord](https://discord.com/developers/applications).

![Création du bot](https://cdn.discordapp.com/attachments/1092833982212751450/1109227302820253857/image.png)
- Cliquer sur "New Application" en haut à droite
- Choisir le nom de votre bot "Polybot" par exemple
- Cliquer sur "Create"
- Cliquer sur "Bot" dans le menu de gauche
- Cliquer sur "Reset Token"
- Cliquer sur "Copy" pour copier le token du bot
- Pense à mettre un avatar pour ton bot

Conserve ce token précieusement, il sera nécessaire pour la suite.

Il faut également récupérer l'ID du bot.
Pour ce faire, sélectionne "General Information" dans le menu de gauche.
et copie l'ID de l'application. **"APPLICATION ID"**

Il te faudra également mettre ces Gateway Intents :
![Gateway Intents](https://media.discordapp.net/attachments/1092833982212751450/1109242883640402061/image.png)

## Ajout du bot
On va maintenant ajouter le bot sur le serveur.
Pour ce faire, il faut se rendre sur le lien suivant : [Permissions Calculator](https://discordapi.com/permissions.html)
Ajouter l'ID du bot dans le champ "Client ID" et cocher les permissions suivantes :
- **Administrator** On va pas faire dans la dans la dentelle.

Clique ensuite sur le lien généré et ajoute le bot sur le serveur. (tout en bas de la page "Link: *https://discord.com/api/oauth2/authorize?client_id=...*")

Choisi ensuite le serveur, et VOILA !

Il faut maintenant s'assuer que le bot soit en haut de la chaine alimentaire dans les roles du serveur.

![Bot en haut](https://cdn.discordapp.com/attachments/1092833982212751450/1109265601983168542/image.png)


# Configuration
## Installation
Il vous faudra installer [Node.js](https://nodejs.org/en/) sur votre machine.

Voilà un bon tuto pour l'installer sur Linux : [Tuto](https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/)

Pour installer le bot, il faut cloner le projet sur votre machine.
```bash
git clone https://github.com/MrEleffant/Polybot.git
```
Une fois le projet cloné, il faut installer les dépendances. *(dans le dossier du projet)*
```bash
npm install
```
Pour lier le bot au script il faut renseigner le TOKEN du bot dans le fichier `.env`
```bash
TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Pour lancer le bot, il suffit de lancer la commande suivante :
```bash
node .
```
Je te conseille d'utiliser [PM2](https://pm2.keymetrics.io/) pour gérer le bot.
Cela te permettra de garder le script en route en tout temps.
```bash	
npm install pm2 -g
```

```bash
pm2 start polybot.js --name polybot
```
## Configuration du bot
Maintenant que le bot est correctement installé, il faut le configurer.
pour ce faire il te faut coller l'id du serveur dans le fichier `.env`





# Autres liens utiles
- [Discord.js](https://discord.js.org/#/)
- [Discord.js Guide](https://discordjs.guide/)