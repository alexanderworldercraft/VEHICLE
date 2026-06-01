import Fastify from "fastify";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import fastifyStatic from '@fastify/static';
import userRoutes from './routes/userRoutes.js';
import vehiculeRoutes from './routes/vehiculeRoutes.js';
import entretienRoutes from './routes/entretienRoutes.js';
import adminReferenceRoutes from './routes/adminReferenceRoutes.js';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { prisma as db } from "./services/db.js";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { Server as SocketIOServer } from "socket.io"; 
import { exec } from 'child_process';
import cron from 'node-cron';

// URL publique
const PUBLIC_URL = process.env.PUBLIC_URL;
// Host publique
const PUBLIC_HOST = process.env.PUBLIC_HOST;

// Créer l'équivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL publique affichée dans les logs uniquement.
// Le HTTPS public est géré par Nginx, pas par Fastify.
const serverUrl = `${process.env.PUBLIC_URL || 'http://127.0.0.1'}:${process.env.PORTS}`;

// Options de Fastify.
// En production derrière Nginx, Fastify doit rester en HTTP local.
const fastifyOptions = {
    ajv: {
        customOptions: {
            removeAdditional: true
        }
    }
};

// Active HTTPS uniquement si on le demande explicitement.
// Exemple .env local : FASTIFY_HTTPS=true
if (process.env.FASTIFY_HTTPS === 'true') {
    fastifyOptions.https = {
        key: fs.readFileSync(path.join(__dirname, 'ssl/private.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl/certificate.crt')),
    };
}

// Création d'une instance de Fastify avec le logger activé pour un suivi des requêtes et erreurs
const fastify = Fastify(fastifyOptions);

const io = new SocketIOServer(fastify.server, { 
    cors: { 
      origin: PUBLIC_URL, 
      methods: ["GET", "POST"], 
    }, 
  }); 
  
  fastify.decorate("io", io); 

// Enregistrement de la documentation Swagger avec Swagger-UI
fastify.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'VEHICLE API',
            description: 'API pour l\'application VEHICLE, Application web pour stocker et accéder facilement aux informations de mes véhicules sur un serveur personnel depuis tous mes appareils.',
            version: '1.0.0'
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        },
        host: PUBLIC_HOST,
        schemes: ['https'], // Utiliser https au lieu de http
        consumes: ['application/json'],
        produces: ['application/json'],
        components: {
            securitySchemes: {
                token: {
                    type: "https",
                    scheme: "bearer",
                    bearerFormat: "jwt",
                }
            }
        },
    },
});

fastify.register(fastifySwaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
        docExpansion: 'list'
    }
});

// Configurer CORS
fastify.register(fastifyCors, {
    origin: PUBLIC_URL, // Autoriser les requêtes depuis cette origine
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
});

// Enregistrement du plugin multipart
fastify.register(fastifyMultipart, {
    limits: { fileSize: 50 * 1024 * 1024 * 1024 }, // Limite à 50 Go
});

// Enregistrer les routes
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(vehiculeRoutes, { prefix: '/api/vehicule' });
fastify.register(entretienRoutes, { prefix: '/api/entretien' });
fastify.register(adminReferenceRoutes, { prefix: '/api/admin' });

// Bloquer l'accès direct aux pièces jointes d'entretien.
// Elles doivent passer par /api/entretien/:UtilisateurID/files/:EntretienFichierID avec JWT.
fastify.all('/uploads/vehicules/:UtilisateurID/:VehiculeID/entretiens/*', async (request, reply) => {
    reply.status(404).send({ error: 'Not found' });
});

// Enregistrer les fichiers statiques pour le frontend
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend/build'),
    prefix: '/', // Frontend accessible depuis la racine
    wildcard: true, // Permet de gérer React Router
    decorateReply: false, // Désactive l'ajout du décorateur "sendFile"
});

// Enregistrer les fichiers statiques pour les uploads
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'uploads'),
    prefix: '/uploads/', // Fichiers utilisateurs accessibles depuis /uploads/
});

// Gérer toutes les autres routes non définies (React Router support)
fastify.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html', path.join(__dirname, '../frontend/build'));
});

// Fonction pour garder la connexion à la base de données active
function keepDatabaseAlive() {
    db.$queryRaw`SELECT 1` // Utilise la syntaxe de requête brute de Prisma
        .then(() => {
            console.log("Ping à la base de données réussi");
        })
        .catch((err) => {
            console.error("Erreur lors du ping de la base de données :", err.message);
        });
}

// Configurer l'intervalle de ping (toutes les 7 heures)
setInterval(keepDatabaseAlive, 25200000);



// Configuration de la base de données pour la sauvegarde
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const BACKUP_DIR = path.join(__dirname, 'uploads/BDD');

// Assurez-vous que le dossier de sauvegarde existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// Fonction pour créer une sauvegarde de la base de données
function backupDatabase() {
    const timestamp = new Date();
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const backupFile = path.join(BACKUP_DIR, `BDD_${DB_NAME}_${year}-${month}-${day}.sql`);

    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} > ${backupFile}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            fastify.log.error(`Erreur lors de la sauvegarde : ${error.message}`);
            return;
        }
        if (stderr) {
            fastify.log.error(`Erreur stderr : ${stderr}`);
            return;
        }
        fastify.log.info(`Sauvegarde créée avec succès : ${backupFile}`);
    });
}

// Planifier la tâche hebdomadaire
const backupDayOfWeek = process.env.BACKUP_DAY_OF_WEEK || '0'; // 0 pour dimanche ('1' = lundi...)
const backupTime = process.env.BACKUP_TIME || '00:00'; // Heure par défaut : minuit
const [hours, minutes] = backupTime.split(':');

cron.schedule(`${minutes} ${hours} * * ${backupDayOfWeek}`, () => {
    console.log('Démarrage de la sauvegarde hebdomadaire...');
    backupDatabase();
});

// Démarrer le serveur
// const start = async () => {
//     try {
//         console.log(`Starting server on port ${process.env.PORTS}...`);
//         await fastify.listen({ port: process.env.PORTS, host: '0.0.0.0' });
//         console.log(`Server listening on ${process.env.HTTPS}:${process.env.PORTS}`);
//     } catch (err) {
//         console.error('Error starting server:', err);
//         process.exit(1);
//     }
// };
// start();
const start = async () => {
    try {
        console.log(`Starting server on port ${process.env.PORTS}...`);
        await fastify.listen({ port: process.env.PORTS, host: '0.0.0.0' });
        console.log(`Server listening on ${process.env.PUBLIC_URL}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
};
start();
