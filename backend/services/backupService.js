import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, "../uploads/BDD");

const pad = (value) => String(value).padStart(2, "0");

const getTimestampParts = () => {
  const timestamp = new Date();
  return {
    year: timestamp.getFullYear(),
    month: pad(timestamp.getMonth() + 1),
    day: pad(timestamp.getDate()),
    hours: pad(timestamp.getHours()),
    minutes: pad(timestamp.getMinutes()),
    seconds: pad(timestamp.getSeconds()),
  };
};

const buildBackupFileName = ({ includeTime = false } = {}) => {
  const dbName = process.env.DB_NAME;
  const { year, month, day, hours, minutes, seconds } = getTimestampParts();
  const date = `${year}-${month}-${day}`;
  const suffix = includeTime ? `${date}_${hours}-${minutes}-${seconds}` : date;
  return `BDD_${dbName}_${suffix}.sql`;
};

export const ensureBackupDir = async () => {
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
};

export const createDatabaseBackup = async ({ includeTime = false } = {}) => {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!dbHost || !dbUser || !dbName) {
    throw new Error("Configuration de base de données incomplète pour la sauvegarde.");
  }

  await ensureBackupDir();

  const fileName = buildBackupFileName({ includeTime });
  const filePath = path.join(BACKUP_DIR, fileName);
  const args = ["-h", dbHost, "-u", dbUser];

  if (dbPassword) args.push(`-p${dbPassword}`);
  args.push(dbName);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const dump = spawn("mysqldump", args);
    let stderr = "";
    let settled = false;
    let dumpExitCode = null;
    let outputFinished = false;

    const fail = async (error) => {
      if (settled) return;
      settled = true;
      output.destroy();
      try {
        await fs.promises.unlink(filePath);
      } catch (_) {
        // Le fichier peut ne pas encore exister si mysqldump échoue au démarrage.
      }
      reject(error);
    };

    const resolveWhenDone = () => {
      if (settled || dumpExitCode === null || !outputFinished) return;
      if (dumpExitCode !== 0) {
        fail(new Error(stderr.trim() || `mysqldump terminé avec le code ${dumpExitCode}.`));
        return;
      }
      settled = true;
      resolve();
    };

    dump.stdout.pipe(output);
    dump.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    dump.on("error", fail);
    dump.on("close", (code) => {
      dumpExitCode = code;
      resolveWhenDone();
    });
    output.on("error", fail);
    output.on("finish", () => {
      outputFinished = true;
      resolveWhenDone();
    });
  });

  return { fileName, filePath };
};
