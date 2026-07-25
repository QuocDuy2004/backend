import mysql from 'mysql2/promise';
import { env } from '../server/config/env';

const { host, port, user, password, name: database, ssl, connectionLimit } = env.database;

export const databaseConfig = {
  host, port, user, password, database,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
  ...(ssl && { ssl: { rejectUnauthorized: false } }),
};

export const pool = mysql.createPool(databaseConfig);

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query('SELECT DATABASE() AS databaseName, NOW() AS serverTime');
    return rows;
  } finally {
    connection.release();
  }
}
