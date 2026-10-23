import { z } from 'zod';
import { dateString, idSchema, timeString } from '../../utils/validation';

export const SERVICE_STATUS = ['agendado', 'concluido', 'cancelado'] as const; // RN05
export const SERVICE_FREQUENCIES = ['semanal', 'quinzenal', 'mensal'] as const;

const serviceFields = {
  customer_id: idSchema,
  pool_id: idSchema,
  scheduled_date: dateString,
  scheduled_time: timeString,
  description: z.string().trim().min(1).max(500),
};

/** RF05 - Serviço com data, descrição, horário e recorrência */
export const createServiceSchema = z
  .object({
    ...serviceFields,
    recurrence: z.boolean().default(false),
    recurrence_frequency: z.enum(SERVICE_FREQUENCIES).nullish().transform((v) => v ?? null),
    recurrence_months: z.number().int().min(1).max(24).nullish().transform((v) => v ?? null),
  })
  .transform((data, ctx) => {
    if (!data.recurrence) return { ...data, recurrence_frequency: null, recurrence_months: null };

    if (!data.recurrence_frequency) {
      ctx.addIssue({ code: 'custom', path: ['recurrence_frequency'], message: 'Informe a frequência (semanal, quinzenal ou mensal).' });
    }
    if (!data.recurrence_months) {
      ctx.addIssue({ code: 'custom', path: ['recurrence_months'], message: 'Informe por quantos meses o serviço se repete.' });
    }
    return data.recurrence_frequency && data.recurrence_months ? data : z.NEVER;
  });

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

/** Alteração de um serviço agendado (a recorrência não é alterada aqui) */
export const updateServiceSchema = z.object(serviceFields);
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const concludeServiceSchema = z.object({
  execution_date: dateString.optional(),
});

export const serviceListQuery = z.object({
  status: z.enum(SERVICE_STATUS).optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  pool_id: z.coerce.number().int().positive().optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});

export const upcomingQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
