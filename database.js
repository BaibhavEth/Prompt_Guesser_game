
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  user: 'neon',
  host: 'ep-mute-block-66953328.us-east-2.aws.neon.tech',
  database: 'neondb',
  password: 'PBhvVO6iRu0l',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
