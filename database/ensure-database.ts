import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const schemaPath = path.resolve(process.cwd(), 'database.sql');

// Read directly from process.env at call time to avoid esbuild freeze
function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'demo',
  };
}

type EnsureDatabaseOptions = {
  resetExisting?: boolean;
  log?: boolean;
};

function assertSafeDatabaseName(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error('DB_DATABASE may only contain letters, numbers, and underscores.');
  }
}

async function createServerConnection() {
  const cfg = getDbConfig();
  assertSafeDatabaseName(cfg.database);
  console.log(`[ensure-db] Connecting to ${cfg.host}:${cfg.port} user=${cfg.user} db=${cfg.database}`);

  return mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  });
}

async function hasTables(connection: mysql.Connection, databaseName: string) {
  const [rows] = await connection.query<any[]>(
    `SELECT COUNT(*) AS tableCount
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?`,
    [databaseName]
  );

  return Number(rows[0]?.tableCount || 0) > 0;
}

export async function ensureDatabaseSchema(options: EnsureDatabaseOptions = {}) {
  const { resetExisting = false, log = true } = options;
  const cfg = getDbConfig();
  const databaseName = cfg.database;

  const connection = await createServerConnection();

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${databaseName}\``);

    const shouldImportSchema = resetExisting || !(await hasTables(connection, databaseName));

    if (!shouldImportSchema) {
      if (log) {
        console.log(`Database ${databaseName} already has tables. Skipping schema import.`);
      }
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);

    if (log) {
      console.log(`Database schema imported into ${databaseName} from ${schemaPath}`);
    }
  } finally {
    await connection.end();
  }
}

export async function resetDatabaseSchema() {
  await ensureDatabaseSchema({ resetExisting: true });
}
