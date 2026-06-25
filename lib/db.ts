import mysql, { Pool } from 'mysql2/promise';

// Pool é um tipo do mysql2 — sem TypeScript você nunca saberia
// que getPool() retorna especificamente um Pool, não qualquer objeto
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:                    process.env.DB_HOST     ?? 'localhost',
      port:                    Number(process.env.DB_PORT ?? 3306),
      user:                    process.env.DB_USER     ?? 'root',
      password:                process.env.DB_PASSWORD ?? '',
      database:                process.env.DB_NAME     ?? 'viagens_db',
      allowPublicKeyRetrieval: true,
      waitForConnections:      true,
      connectionLimit:         10,
    });
  }
  return pool;
}
