import { Db } from '../../config/db';
import { AddressInput } from './address.schemas';

/** Trecho de SELECT que devolve o endereço como objeto JSON. */
export const addressJson = (alias: string) => `json_build_object(
  'address_id', ${alias}.address_id, 'street', ${alias}.street, 'number', ${alias}.number,
  'neighborhood', ${alias}.neighborhood, 'city', ${alias}.city, 'complement', ${alias}.complement)`;

export async function insertAddress(db: Db, a: AddressInput): Promise<number> {
  const { rows } = await db.query<{ address_id: number }>(
    `INSERT INTO addresses (street, number, neighborhood, city, complement)
     VALUES ($1, $2, $3, $4, $5) RETURNING address_id`,
    [a.street, a.number, a.neighborhood, a.city, a.complement],
  );
  return rows[0].address_id;
}

export async function updateAddress(db: Db, id: number, a: AddressInput): Promise<void> {
  await db.query(
    `UPDATE addresses SET street = $2, number = $3, neighborhood = $4, city = $5, complement = $6
     WHERE address_id = $1`,
    [id, a.street, a.number, a.neighborhood, a.city, a.complement],
  );
}

/** Apaga endereços que não são mais usados por nenhum cliente ou piscina. */
export async function deleteOrphanAddresses(db: Db, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await db.query(
    `DELETE FROM addresses a
     WHERE a.address_id = ANY($1::int[])
       AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.address_id = a.address_id)
       AND NOT EXISTS (SELECT 1 FROM pools p WHERE p.address_id = a.address_id)`,
    [ids],
  );
}
