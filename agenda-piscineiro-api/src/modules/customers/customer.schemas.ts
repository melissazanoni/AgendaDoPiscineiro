import { z } from 'zod';
import { isValidCnpj, isValidCpf, normalizeDocument } from '../../utils/documents';
import { optionalText } from '../../utils/validation';
import { addressSchema } from '../addresses/address.schemas';

/** RF03 - Cliente com nome, endereço, cidade, telefone, CPF ou CNPJ */
export const customerSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    phone: optionalText(20),
    document_type: z.enum(['CPF', 'CNPJ']).nullish().transform((v) => v ?? null),
    document_number: optionalText(18),
    address: addressSchema,
  })
  .transform((data, ctx) => {
    const { document_type: type, document_number: number } = data;
    if (!type && !number) return data;

    if (!type) {
      ctx.addIssue({ code: 'custom', path: ['document_type'], message: 'Informe se o documento é CPF ou CNPJ.' });
      return z.NEVER;
    }
    if (!number) {
      ctx.addIssue({ code: 'custom', path: ['document_number'], message: `Informe o número do ${type}.` });
      return z.NEVER;
    }

    const normalized = normalizeDocument(type, number);
    const valid = type === 'CPF' ? isValidCpf(normalized) : isValidCnpj(normalized);
    if (!valid) {
      ctx.addIssue({ code: 'custom', path: ['document_number'], message: `${type} inválido.` });
      return z.NEVER;
    }
    return { ...data, document_number: normalized };
  });

export type CustomerInput = z.infer<typeof customerSchema>;

export const customerListQuery = z.object({
  search: z.string().trim().optional(),
});
