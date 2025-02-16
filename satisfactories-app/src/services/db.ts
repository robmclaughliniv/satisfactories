import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  // Use the POSTGRES_URL environment variable if available, otherwise build connection string from individual vars.
  connectionString: process.env.POSTGRES_URL || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`,
  
  // Pool configuration
  max: process.env.PG_MAX_POOL_SIZE ? parseInt(process.env.PG_MAX_POOL_SIZE, 10) : 20,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT ? parseInt(process.env.PG_IDLE_TIMEOUT, 10) : 30000,
  connectionTimeoutMillis: process.env.PG_CONNECTION_TIMEOUT ? parseInt(process.env.PG_CONNECTION_TIMEOUT, 10) : 2000,
  
  // Enable SSL in production if required.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rowCount: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default {
  query,
  pool,
};
