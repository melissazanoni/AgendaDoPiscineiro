import { z } from 'zod';
import { dateString, idSchema } from '../../utils/validation';

export const PAYMENT_STATUS = ['pendente', 'pago'] as const; // RN06

const chargeFields = {
  amount: z.number().positive().max(99999999.99).transform((v) => Math.round(v * 100) / 100),
  due_date: dateString,
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(['quinzenal', 'mensal']).nullish().transform((v) => v ?? null),
};

type Recurrence = { is_recurring: boolean; recurrence_frequency: 'quinzenal' | 'mensal' | null };

function checkRecurrence<T extends Recurrence>(data: T, ctx: z.RefinementCtx): T {
  if (!data.is_recurring) return { ...data, recurrence_frequency: null };
  if (!data.recurrence_frequency) {
    ctx.addIssue({ code: 'custom', path: ['recurrence_frequency'], message: 'Informe a frequência (quinzenal ou mensal).' });
    return z.NEVER;
  }
  return data;
}

/** RF07 - Registrar cobrança */
export const createChargeSchema = z
  .object({ customer_id: idSchema, ...chargeFields, payment_status: z.enum(PAYMENT_STATUS).default('pendente') })
  .transform(checkRecurrence);

export const updateChargeSchema = z.object(chargeFields).transform(checkRecurrence);
export type UpdateChargeInput = z.infer<typeof updateChargeSchema>;
export type CreateChargeInput = z.infer<typeof createChargeSchema>;

export const chargeStatusSchema = z.object({ payment_status: z.enum(PAYMENT_STATUS) });

export const chargeListQuery = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
  status: z.enum(PAYMENT_STATUS).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});
export type ChargeFilters = z.infer<typeof chargeListQuery>;
