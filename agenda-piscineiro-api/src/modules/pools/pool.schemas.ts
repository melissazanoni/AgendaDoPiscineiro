import { z } from 'zod';
import { today } from '../../utils/dates';
import { dateString, idSchema } from '../../utils/validation';
import { addressSchema } from '../addresses/address.schemas';

export const POOL_TYPES = ['fibra', 'vinil', 'alvenaria', 'azulejo', 'pastilha'] as const;
export const CUSTOMER_TYPES = [
  'residencia', 'condominio', 'sitio ou chacara', 'clube', 'hoteis e resorts', 'academias',
] as const;

const measure = z.number().positive().max(99999999.99).nullish().transform((v) => v ?? null);
const flag = z.boolean().default(false);

const poolFields = {
  description: z.string().trim().min(1).max(255),
  pool_type: z.enum(POOL_TYPES),
  customer_type: z.enum(CUSTOMER_TYPES),
  width: measure,
  length: measure,
  depth: measure,
  volume: measure,
  last_sand_change: dateString.nullish().transform((v) => v ?? null),
  has_heating: flag,
  has_ozone_treatment: flag,
  has_waterfall: flag,
  has_hydromassage: flag,
  has_led_lighting: flag,
  has_infinity_edge: flag,
  has_timer: flag,
  has_uv_treatment: flag,
  /** "Usar endereço do cliente": a piscina recebe o mesmo address_id do cliente. */
  use_customer_address: z.boolean().default(false),
  address: addressSchema.optional(),
};

const poolBase = z.object(poolFields);
type PoolBase = z.infer<typeof poolBase>;

function checkPool(data: PoolBase, ctx: z.RefinementCtx) {
  // RF04: largura, comprimento e profundidade OU o volume
  const hasAllDims = data.width !== null && data.length !== null && data.depth !== null;
  if (data.volume === null && !hasAllDims) {
    ctx.addIssue({
      code: 'custom',
      path: ['volume'],
      message: 'Informe largura, comprimento e profundidade ou, alternativamente, o volume.',
    });
  }
  if (!data.use_customer_address && !data.address) {
    ctx.addIssue({
      code: 'custom',
      path: ['address'],
      message: 'Informe o endereço da piscina ou marque "usar endereço do cliente".',
    });
  }
  if (data.last_sand_change && data.last_sand_change > today()) {
    ctx.addIssue({ code: 'custom', path: ['last_sand_change'], message: 'A data da troca de areia não pode ser futura.' });
  }
}

/** Se o volume não foi informado, calcula pelas medidas (m³). */
function fillVolume<T extends PoolBase>(data: T): T {
  if (data.volume === null && data.width && data.length && data.depth) {
    return { ...data, volume: Math.round(data.width * data.length * data.depth * 100) / 100 };
  }
  return data;
}

export const createPoolSchema = z
  .object({ customer_id: idSchema, ...poolFields })
  .superRefine(checkPool)
  .transform(fillVolume);

export const updatePoolSchema = poolBase.superRefine(checkPool).transform(fillVolume);

export type PoolInput = z.infer<typeof updatePoolSchema>;

export const poolListQuery = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
});
