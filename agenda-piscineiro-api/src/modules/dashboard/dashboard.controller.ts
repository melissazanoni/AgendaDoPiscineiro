import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { addDays, addMonths, now } from '../../utils/dates';
import { listUpcoming } from '../services/service.repository';

/** RF12 - Resumo dos próximos serviços e da situação financeira */
export async function dashboard(_req: Request, res: Response): Promise<void> {
  const { date, time } = now();
  const weekEnd = addDays(date, 6);
  const monthStart = `${date.slice(0, 8)}01`;
  const monthEnd = addDays(addMonths(monthStart, 1), -1);

  const [upcoming, services, financial] = await Promise.all([
    listUpcoming(pool, date, time, weekEnd, 10),

    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM services WHERE status = 'agendado' AND scheduled_date = $1)::int               AS today,
         (SELECT COUNT(*) FROM services WHERE status = 'agendado' AND scheduled_date BETWEEN $1 AND $2)::int AS next_7_days,
         (SELECT COUNT(*) FROM services WHERE status = 'agendado' AND scheduled_date < $1)::int              AS awaiting_conclusion,
         (SELECT COUNT(*) FROM customers)::int AS customers,
         (SELECT COUNT(*) FROM pools)::int     AS pools`,
      [date, weekEnd],
    ),

    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE payment_status = 'pendente')::int                                    AS pending_count,
         COALESCE(SUM(amount) FILTER (WHERE payment_status = 'pendente'), 0)                         AS pending_amount,
         COUNT(*) FILTER (WHERE payment_status = 'pendente' AND due_date < $1)::int                  AS overdue_count,
         COALESCE(SUM(amount) FILTER (WHERE payment_status = 'pendente' AND due_date < $1), 0)       AS overdue_amount,
         COALESCE(SUM(amount) FILTER (WHERE due_date BETWEEN $2 AND $3), 0)                          AS month_total,
         COALESCE(SUM(amount) FILTER (WHERE payment_status = 'pago' AND due_date BETWEEN $2 AND $3), 0) AS month_paid
       FROM charges`,
      [date, monthStart, monthEnd],
    ),
  ]);

  const counts = services.rows[0];
  res.json({
    today: date,
    services: {
      today: counts.today,
      next_7_days: counts.next_7_days,
      awaiting_conclusion: counts.awaiting_conclusion, // agendados com data passada, ainda não concluídos
    },
    totals: { customers: counts.customers, pools: counts.pools },
    financial: financial.rows[0],
    upcoming_services: upcoming,
  });
}
