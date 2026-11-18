import { z } from 'zod';
import { AppError } from './AppError';
import { isValidDate, normalizeTime } from './dates';

// ---------- Mensagens de validação em português ----------
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'Campo obrigatório.' };
      return { message: `Tipo inválido: esperado ${issue.expected}.` };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: issue.minimum === 1 ? 'Campo obrigatório.' : `Deve ter no mínimo ${issue.minimum} caracteres.` };
      }
      if (issue.type === 'number') {
        return { message: `Deve ser maior ${issue.inclusive ? 'ou igual a' : 'que'} ${issue.minimum}.` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `Deve ter no máximo ${issue.maximum} caracteres.` };
      if (issue.type === 'number') {
        return { message: `Deve ser menor ${issue.inclusive ? 'ou igual a' : 'que'} ${issue.maximum}.` };
      }
      break;
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'E-mail inválido.' };
      break;
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Opções: ${issue.options.join(', ')}.` };
  }
  return { message: ctx.defaultError };
});

// ---------- Peças reutilizáveis ----------
export const idSchema = z.number().int().positive();

export const dateString = z.string().refine(isValidDate, 'Data inválida.');

export const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Horário inválido (use HH:MM).')
  .transform(normalizeTime);

/** Texto opcional: '' ou ausente viram null. */
export const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

/** Lê o :id da URL. */
export function parseId(value: unknown, label = 'ID'): number {
  const result = z.coerce.number().int().positive().safeParse(value);
  if (!result.success) throw new AppError(`${label} inválido.`, 400);
  return result.data;
}
