import mysql from 'mysql2/promise';
import { env } from '../server/config/env';

export const databaseConfig = {
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: env.database.connectionLimit,
  queueLimit: 0,
  namedPlaceholders: true,
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
