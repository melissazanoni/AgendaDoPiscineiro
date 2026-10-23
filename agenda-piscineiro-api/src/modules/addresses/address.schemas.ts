import { z } from 'zod';
import { optionalText } from '../../utils/validation';

export const addressSchema = z.object({
  street: z.string().trim().min(1).max(150),
  number: optionalText(10),
  neighborhood: optionalText(150),
  city: optionalText(150),
  complement: optionalText(150),
});

export type AddressInput = z.infer<typeof addressSchema>;
