import { testDatabaseConnection, databaseConfig, pool } from '../src/lib/mysql';

try {
  const rows = await testDatabaseConnection();
  console.log(`Connected to MySQL database: ${databaseConfig.database}`);
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown database connection error';
  console.error(`Database connection failed: ${message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
