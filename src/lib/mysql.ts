import mysql from 'mysql2/promise';

// Read directly from process.env at call time — NOT from cached env module
// This avoids esbuild bundling issues where env values get frozen at build time
function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'demo',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    namedPlaceholders: true,
  };
}

// Keep databaseConfig for backward compat (ensure-database.ts uses it)
export const databaseConfig = {
  get host() { return process.env.DB_HOST || '127.0.0.1'; },
  get port() { return Number(process.env.DB_PORT) || 3306; },
  get user() { return process.env.DB_USER || 'root'; },
  get password() { return process.env.DB_PASSWORD || ''; },
  get database() { return process.env.DB_DATABASE || 'demo'; },
  waitForConnections: true,
  get connectionLimit() { return Number(process.env.DB_CONNECTION_LIMIT) || 10; },
  queueLimit: 0,
  namedPlaceholders: true,
};

// Lazy pool — recreated if env changes
let _pool: mysql.Pool | null = null;
let _poolConfig: string = '';

export function getPool(): mysql.Pool {
  const currentConfig = JSON.stringify(getDatabaseConfig());
  if (!_pool || _poolConfig !== currentConfig) {
    _pool = mysql.createPool(getDatabaseConfig());
    _poolConfig = currentConfig;
    console.log(`[mysql] Pool created with host=${process.env.DB_HOST} port=${process.env.DB_PORT}`);
  }
  return _pool;
}

// Proxy for backward compat
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
