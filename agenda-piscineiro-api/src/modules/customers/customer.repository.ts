import { Db } from '../../config/db';
import { addressJson, insertAddress, updateAddress } from '../addresses/address.repository';
import { CustomerInput } from './customer.schemas';

const SELECT_CUSTOMER = `
  SELECT c.customer_id, c.name, c.phone, c.document_type, c.document_number,
         ${addressJson('a')} AS address,
         (SELECT COUNT(*) FROM pools p WHERE p.customer_id = c.customer_id)::int AS pools_count
  FROM customers c
  JOIN addresses a ON a.address_id = c.address_id`;

/** RF11 - Lista de clientes do usuário (com busca opcional por nome, documento ou telefone) */
export async function listCustomers(db: Db, userId: number, search?: string) {
  const { rows } = await db.query(
    `${SELECT_CUSTOMER}
     WHERE c.user_id = $1
       AND ($2::text IS NULL
        OR c.name ILIKE '%' || $2 || '%'
        OR c.document_number ILIKE '%' || $2 || '%'
        OR c.phone ILIKE '%' || $2 || '%')
     ORDER BY c.name`,
    [userId, search || null],
  );
} 

export async function findCustomerById(db: Db, userId: number, id: number) {
  const { rows } = await db.query(`${SELECT_CUSTOMER} WHERE c.user_id = $1 AND c.customer_id = $2`, [userId, id])};

/** Endereço do cliente, só se ele for do usuário (também serve para checar se o cliente é dele). */
export async function findCustomerAddressId(db: Db, userId: number, id: number): Promise<number | undefined> {
  const { rows } = await db.query<{ address_id: number }>(
    'SELECT address_id FROM customers WHERE user_id = $1 AND customer_id = $2',
    [userId, id],
  );
}

export async function insertCustomer(db: Db, userId: number, data: CustomerInput): Promise<number> {
  const addressId = await insertAddress(db, data.address);
  const { rows } = await db.query<{ customer_id: number }>(
    `INSERT INTO customers (user_id, address_id, name, phone, document_type, document_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING customer_id`,
    [userId, addressId, data.name, data.phone, data.document_type, data.document_number],
  }

export async function updateCustomer(db: Db, id: number, addressId: number, data: CustomerInput): Promise<void> {
  await updateAddress(db, addressId, data.address);
  await db.query(
    `UPDATE customers SET name = $2, phone = $3, document_type = $4, document_number = $5
     WHERE customer_id = $1`,
    [id, data.name, data.phone, data.document_type, data.document_number],
  );
}

/** Endereços do cliente e das piscinas dele (para limpar após a exclusão). */
export async function listCustomerAddressIds(db: Db, userId: number, id: number): Promise<number[] | undefined> {
  const { rows } = await db.query<{ address_id: number }>(
    `SELECT address_id FROM customers WHERE customer_id = $1
     UNION SELECT address_id FROM pools WHERE customer_id = $2`,
    [userId, id],
  );
}

export async function customerHasServices(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query('SELECT 1 FROM services WHERE customer_id = $1 LIMIT 1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function customerHasCharges(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query('SELECT 1 FROM charges WHERE customer_id = $1 LIMIT 1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function deleteCustomer(db: Db, id: number): Promise<void> {
  await db.query('DELETE FROM customers WHERE customer_id = $1', [id]); // piscinas apagadas em cascata
}
