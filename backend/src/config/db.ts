import {Pool} from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'midnightops',
  password: process.env.POSTGRES_PASSWORD || 'midnightops',
  database: process.env.POSTGRES_DB || 'midnightops_db',
});

pool.on('connect', () => {
    console.log('Connected to postgreSQL on 0.0.0.0:5432');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
})

export default pool;