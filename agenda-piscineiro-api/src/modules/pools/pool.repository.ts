import { Db } from '../../config/db';
import { addressJson } from '../addresses/address.repository';
import { PoolInput } from './pool.schemas';

// Colunas gravadas a partir do formulário (nomes fixos, sem entrada do usuário)
const POOL_COLUMNS = [
  'description', 'pool_type', 'customer_type', 'width', 'length', 'depth', 'volume', 'last_sand_change',
  'has_heating', 'has_ozone_treatment', 'has_waterfall', 'has_hydromassage',
  'has_led_lighting', 'has_infinity_edge', 'has_timer', 'has_uv_treatment',
] as const;

const SELECT_POOL = `
  SELECT p.pool_id, p.customer_id, c.name AS customer_name,
         ${POOL_COLUMNS.map((col) => `p.${col}`).join(', ')},
         (p.address_id = c.address_id) AS uses_customer_address,
         ${addressJson('a')} AS address
  FROM pools p
  JOIN customers c ON c.customer_id = p.customer_id
  JOIN addresses a ON a.address_id = p.address_id`;

export async function listPools(db: Db, userId: number, customerId?: number) {
  const { rows } = await db.query(
    `${SELECT_POOL}
     WHERE c.user_id = $1 AND ($2::int IS NULL OR p.customer_id = $2)
     ORDER BY c.name, p.description`,
    [userId, customerId ?? null],
  );
  return rows;
}  

export async function findPoolById(db: Db, userId: number, id: number) {
  const { rows } = await db.query(`${SELECT_POOL} WHERE c.user_id = $1 AND p.pool_id = $2`, [userId, id]);
  return rows[0];
}
/** Endereço atual da piscina e endereço do dono (para saber se são compartilhados). */
export async function findPoolAddressInfo(db: Db, userId: number, id: number) {
  const { rows } = await db.query<{ address_id: number; customer_address_id: number }>(
    `SELECT p.address_id, c.address_id AS customer_address_id
     FROM pools p JOIN customers c ON c.customer_id = p.customer_id
     WHERE c.user_id = $1 AND p.pool_id = $2`,
    [userId, id],
  return rows[0];
}

export async function insertPool(db: Db, customerId: number, addressId: number, data: PoolInput): Promise<number> {
  const placeholders = POOL_COLUMNS.map((_, i) => `$${i + 3}`).join(', ');
  const { rows } = await db.query<{ pool_id: number }>(
    `INSERT INTO pools (customer_id, address_id, ${POOL_COLUMNS.join(', ')})
     VALUES ($1, $2, ${placeholders}) RETURNING pool_id`,
    [customerId, addressId, ...POOL_COLUMNS.map((col) => data[col])],
  );
  return rows[0].pool_id;
}

export async function updatePool(db: Db, id: number, addressId: number, data: PoolInput): Promise<void> {
  const sets = POOL_COLUMNS.map((col, i) => `${col} = $${i + 3}`).join(', ');
  await db.query(
    `UPDATE pools SET address_id = $2, ${sets} WHERE pool_id = $1`,
    [id, addressId, ...POOL_COLUMNS.map((col) => data[col])],
  );
}

export async function poolHasServices(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query('SELECT 1 FROM services WHERE pool_id = $1 LIMIT 1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function deletePool(db: Db, id: number): Promise<void> {
  await db.query('DELETE FROM pools WHERE pool_id = $1', [id]);
}
