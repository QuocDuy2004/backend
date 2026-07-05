import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const schemaPath = path.resolve(process.cwd(), 'database.sql');
const databaseName = process.env.DB_DATABASE || 'omnishop_backend';

if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
  throw new Error('DB_DATABASE may only contain letters, numbers, and underscores.');
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

try {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${databaseName}\``);
  await connection.query(schema);
  console.log(`Database schema imported into ${databaseName} from ${schemaPath}`);
} finally {
  await connection.end();
}
