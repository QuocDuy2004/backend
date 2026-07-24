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

// Lazy pool — created on first use so env vars are fully resolved
let _pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool(databaseConfig);
  }
  return _pool;
}

// Keep backward compat — proxy to lazy pool
export const pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export async function testDatabaseConnection() {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query('SELECT DATABASE() AS databaseName, NOW() AS serverTime');
    return rows;
  } finally {
    connection.release();
  }
}
