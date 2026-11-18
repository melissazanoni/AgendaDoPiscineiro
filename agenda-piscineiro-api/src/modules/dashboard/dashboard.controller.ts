import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { addDays, addMonths, now } from '../../utils/dates';
import { listUpcoming } from '../services/service.repository';

/** RF12 - Resumo dos próximos serviços e da situação financeira */
export async function dashboard(req: Request, res: Response): Promise<void> {
  const { date, time } = now();
  const weekEnd = addDays(date, 6);
  const monthStart = `${date.slice(0, 8)}01`;
  const monthEnd = addDays(addMonths(monthStart, 1), -1);

  const [upcoming, services, financial] = await Promise.all([
    listUpcoming(pool, req.userId!, date, time, weekEnd, 10),

    // Tudo filtrado pelo usuário logado ($3 / $4), via customers.user_id
    pool.query(
      `WITH my_services AS (
         SELECT s.status, s.scheduled_date FROM services s
         JOIN customers c ON c.customer_id = s.customer_id
         WHERE c.user_id = $3
       )
       SELECT
         (SELECT COUNT(*) FROM my_services WHERE status = 'agendado' AND scheduled_date = $1)::int               AS today,
         (SELECT COUNT(*) FROM my_services WHERE status = 'agendado' AND scheduled_date BETWEEN $1 AND $2)::int AS next_7_days,
         (SELECT COUNT(*) FROM my_services WHERE status = 'agendado' AND scheduled_date < $1)::int              AS awaiting_conclusion,
         (SELECT COUNT(*) FROM customers WHERE user_id = $3)::int AS customers,
         (SELECT COUNT(*) FROM pools p JOIN customers c ON c.customer_id = p.customer_id WHERE c.user_id = $3)::int AS pools`,
      [date, weekEnd, req.userId!],
    ),

    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ch.payment_status = 'pendente')::int                                       AS pending_count,
         COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pendente'), 0)                         AS pending_amount,
         COUNT(*) FILTER (WHERE ch.payment_status = 'pendente' AND ch.due_date < $1)::int                  AS overdue_count,
         COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pendente' AND ch.due_date < $1), 0)    AS overdue_amount,
         COALESCE(SUM(ch.amount) FILTER (WHERE ch.due_date BETWEEN $2 AND $3), 0)                          AS month_total,
         COALESCE(SUM(ch.amount) FILTER (WHERE ch.payment_status = 'pago' AND ch.due_date BETWEEN $2 AND $3), 0) AS month_paid
       FROM charges ch
       JOIN customers c ON c.customer_id = ch.customer_id
       WHERE c.user_id = $4`,
      [date, monthStart, monthEnd, req.userId!],
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
