import { Pool, PoolClient, types } from 'pg';
import { env } from './env';

// Ajustes de conversão de tipos do PostgreSQL para JavaScript:
types.setTypeParser(1082, (value) => value);                 // DATE    -> 'AAAA-MM-DD' (evita problemas de fuso)
types.setTypeParser(1700, (value) => parseFloat(value));     // NUMERIC -> number
types.setTypeParser(20, (value) => parseInt(value, 10));     // BIGINT (COUNT) -> number

export const pool = new Pool({ connectionString: env.databaseUrl });

/** Qualquer objeto capaz de executar SQL: o pool ou um client dentro de transação. */
export type Db = Pool | PoolClient;

/** Executa várias queries em uma transação: ou tudo é salvo, ou nada é salvo. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
