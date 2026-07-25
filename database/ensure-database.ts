import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { databaseConfig } from '../src/lib/mysql';

const schemaPath = path.resolve(process.cwd(), 'database.sql');
const databaseName = databaseConfig.database;

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
  assertSafeDatabaseName(databaseName);

  return mysql.createConnection({
    host:     databaseConfig.host,
    port:     databaseConfig.port,
    user:     databaseConfig.user,
    password: databaseConfig.password,
    multipleStatements: true,
    ...(databaseConfig.ssl && { ssl: { rejectUnauthorized: false } }),
  });
}

async function hasTables(connection: mysql.Connection) {
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
  const connection = await createServerConnection();

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${databaseName}\``);

    const shouldImportSchema = resetExisting || !(await hasTables(connection));

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
