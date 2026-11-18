import { Db } from '../../config/db';
import { ChargeFilters, CreateChargeInput, UpdateChargeInput } from './charge.schemas';

// $1 é sempre a data de hoje (para calcular se a cobrança está vencida)
const SELECT_CHARGE = `
  SELECT ch.charge_id, ch.customer_id, c.name AS customer_name, ch.amount, ch.due_date,
         ch.is_recurring, ch.recurrence_frequency, ch.payment_status,
         (ch.payment_status = 'pendente' AND ch.due_date < $1::date) AS is_overdue
  FROM charges ch
  JOIN customers c ON c.customer_id = ch.customer_id`;

// $6 é sempre o usuário logado (só enxerga cobranças dos próprios clientes)
const FILTER = `
  WHERE c.user_id = $6
    AND ($2::int IS NULL OR ch.customer_id = $2)
    AND ($3::payment_status_enum IS NULL OR ch.payment_status = $3)
    AND ($4::date IS NULL OR ch.due_date >= $4)
    AND ($5::date IS NULL OR ch.due_date <= $5)`;

const filterParams = (userId: number, today: string, f: ChargeFilters) =>
  [today, f.customer_id ?? null, f.status ?? null, f.from ?? null, f.to ?? null, userId];

/** RF08 / RF09 - Lista de cobranças do usuário com filtros */
export async function listCharges(db: Db, userId: number, today: string, f: ChargeFilters) {
  const { rows } = await db.query(
    `${SELECT_CHARGE} ${FILTER} ORDER BY ch.due_date DESC, ch.charge_id DESC`,
    filterParams(userId, today, f),
  );
  return rows;
}

/** Totais do histórico financeiro, com os mesmos filtros da lista */
export async function summarizeCharges(db: Db, userId: number, today: string, f: ChargeFilters) {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int                                                          AS count,
            COALESCE(SUM(ch.amount), 0)                                            AS total_amount,
            COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pago'), 0)     AS paid_amount,
            COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pendente'), 0) AS pending_amount,
            COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pendente' AND ch.due_date < $1::date), 0)
                                                                                   AS overdue_amount
     FROM charges ch
     JOIN customers c ON c.customer_id = ch.customer_id
     ${FILTER}`,
    filterParams(userId, today, f),
  );
  return rows[0];
}

export async function findChargeById(db: Db, userId: number, today: string, id: number) {
  const { rows } = await db.query(
    `${SELECT_CHARGE} WHERE c.user_id = $2 AND ch.charge_id = $3`,
    [today, userId, id],
  );
  return rows[0];
}

/** Status da cobrança, só se ela for de um cliente do usuário (também serve para checar se é dele). */
export async function findChargeStatus(db: Db, userId: number, id: number): Promise<'pendente' | 'pago' | undefined> {
  const { rows } = await db.query<{ payment_status: 'pendente' | 'pago' }>(
    `SELECT ch.payment_status FROM charges ch
     JOIN customers c ON c.customer_id = ch.customer_id
     WHERE c.user_id = $1 AND ch.charge_id = $2`,
    [userId, id],
  );
  return rows[0]?.payment_status;
}

export async function insertCharge(db: Db, d: CreateChargeInput): Promise<number> {
  const { rows } = await db.query<{ charge_id: number }>(
    `INSERT INTO charges (customer_id, amount, due_date, is_recurring, recurrence_frequency, payment_status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING charge_id`,
    [d.customer_id, d.amount, d.due_date, d.is_recurring, d.recurrence_frequency, d.payment_status],
  );
  return rows[0].charge_id;
}

export async function updateCharge(db: Db, id: number, d: UpdateChargeInput): Promise<void> {
  await db.query(
    `UPDATE charges SET amount = $2, due_date = $3, is_recurring = $4, recurrence_frequency = $5
     WHERE charge_id = $1`,
    [id, d.amount, d.due_date, d.is_recurring, d.recurrence_frequency],
  );
}

export async function updateChargeStatus(db: Db, id: number, status: 'pendente' | 'pago'): Promise<void> {
  await db.query('UPDATE charges SET payment_status = $2 WHERE charge_id = $1', [id, status]);
}

export async function deleteCharge(db: Db, id: number): Promise<void> {
  await db.query('DELETE FROM charges WHERE charge_id = $1', [id]);
}
