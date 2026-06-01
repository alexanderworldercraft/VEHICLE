# VEHICLE

**Vehicle Efficiency, History, Information & Consumption Log Engine**

VEHICLE est une application web personnelle de suivi de véhicules. Elle centralise les fiches véhicules, les relevés de carburant, l'historique de consommation, les coûts, les entretiens planifiés/réalisés, les pièces jointes et les exports d'archives.

Ce dépôt est la nouvelle base propre du projet. Il remplace l'ancien dépôt d'origine, devenu obsolète, par une version reconstruite autour de la refonte documentée dans la page `UpdatePage.js`.

## État de la refonte

La refonte a progressivement transformé VEHICLE d'une base vieillissante vers une application structurée, responsive et plus sûre.

Principales évolutions :

- `1.2.0` : remplacement de l'ancienne navigation par une sidebar desktop, un menu mobile et une page de mises à jour.
- `1.3.0` : refonte complète de la page véhicule avec tableau de bord sombre, statistiques, graphiques, derniers relevés et modal de consultation.
- `1.6.0` : ajout du dashboard global des véhicules actifs.
- `1.7.0` : harmonisation visuelle des pages Relevés, Paramètres, Administration et Mises à jour.
- `1.9.0` et `1.10.0` : ajout de Shield Mode, confidentialité renforcée et verrouillage backend des actions sensibles.
- `1.11.0` à `1.15.1` : ajout de la gestion des entretiens, historique, pièces jointes sécurisées, fichiers protégés par JWT, corrections responsive et affichage fiable des échéances.

Version applicative actuelle : `1.15.1`.

## Fonctionnalités

- Gestion des véhicules actifs et vendus.
- Suivi des relevés de carburant, kilométrage, prix, litres et consommation.
- Statistiques par véhicule : consommation moyenne, coût moyen, dépenses, kilométrage déclaré.
- Graphiques de consommation, prix carburant, kilométrage, répartition carburants et inclinaisons.
- Gestion des entretiens planifiés et réalisés.
- Pièces jointes d'entretien avec aperçu sécurisé pour images et PDF.
- Administration des données de référence : types, marques, carburants, catégories et types d'entretien.
- Shield Mode pour masquer les données sensibles et bloquer les actions d'écriture.
- Export d'archives véhicule avec données brutes CSV.
- Sauvegarde hebdomadaire MySQL via `mysqldump`.

## Stack technique

- Frontend : React 18, React Router, Tailwind CSS, Chart.js.
- Backend : Node.js, Fastify, Socket.IO, Swagger UI.
- Base de données : MySQL avec Prisma.
- Authentification : JWT.
- Uploads : stockage local dans `backend/uploads`.

## Structure

```text
backend/
  controllers/
  middlewares/
  prisma/
  routes/
  schemas/
  services/
  tests/
  vehicle.js

frontend/
  public/
  src/
```

Le dépôt ignore volontairement les dossiers locaux et sensibles :

- `archives/`
- `.env`
- `node_modules/`
- `frontend/build/`
- `backend/uploads/`
- `backend/ssl/`

Les fichiers d'exemple sont fournis avec des valeurs neutres :

- `backend/.env.example`
- `frontend/.env.example`

## Prérequis

- Node.js récent compatible avec React Scripts et Fastify.
- npm.
- MySQL.
- `mysqldump` si la sauvegarde automatique doit être utilisée.
- Certificats locaux uniquement si `FASTIFY_HTTPS=true`.

## Installation

Cloner le dépôt :

```bash
git clone https://github.com/alexanderworldercraft/VEHICLE.git
cd VEHICLE
```

Installer les dépendances backend :

```bash
cd backend
npm install
cp .env.example .env
```

Configurer `backend/.env` avec les accès MySQL, le secret JWT, l'URL publique et les comptes initiaux.

Installer les dépendances frontend :

```bash
cd ../frontend
npm install
cp .env.example .env
```

Configurer `frontend/.env` pour pointer vers l'API backend :

```env
REACT_APP_URL_LOCAL="http://localhost:1886"
REACT_APP_NAME="Vehicle"
REACT_APP_VER="1.15.1"
```

## Base de données

Créer une base MySQL, par exemple :

```sql
CREATE DATABASE vehicle;
```

Depuis `backend/`, appliquer les migrations Prisma :

```bash
npx prisma migrate deploy
npx prisma generate
```

Initialiser les données de base :

```bash
npm run seed
```

Le seed ajoute notamment les grades, états, données de référence et catégories/types d'entretien.

## Développement

Démarrer le frontend React :

```bash
cd frontend
npm start
```

Démarrer le backend :

```bash
cd backend
npm start
```

Par défaut, le backend lit `PORTS` dans `backend/.env`. Le frontend doit utiliser la même origine API via `REACT_APP_URL_LOCAL`.

## Build de production

Construire le frontend :

```bash
cd frontend
npm run build
```

Le backend sert ensuite `frontend/build` depuis Fastify :

```bash
cd ../backend
npm start
```

En production derrière Nginx, laisser généralement Fastify en HTTP local avec :

```env
FASTIFY_HTTPS=false
PUBLIC_URL="https://votre-domaine.example"
PUBLIC_HOST="votre-domaine.example"
```

## Sécurité

- Ne jamais versionner les fichiers `.env`.
- Ne jamais versionner `backend/ssl`, `backend/uploads` ou les sauvegardes SQL.
- Remplacer `JWT_SECRET`, les mots de passe initiaux et les accès MySQL avant tout déploiement.
- Les pièces jointes d'entretien sont protégées par API/JWT et ne doivent pas être exposées directement via `/uploads`.

## Documentation API

Une documentation Swagger UI est exposée par le backend sur :

```text
/documentation
```

L'URL complète dépend de `PUBLIC_URL`, `PUBLIC_HOST` et `PORTS`.

## Historique

Le détail fonctionnel des versions est maintenu dans :

```text
frontend/src/components/UpdatePage.js
```

Ce fichier sert de journal de refonte et décrit les évolutions depuis la base initiale jusqu'à la version actuelle.
