import { Request, Response } from 'express';
import { pool, withTransaction } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { parseId } from '../../utils/validation';
import { deleteOrphanAddresses, insertAddress, updateAddress } from '../addresses/address.repository';
import { findCustomerAddressId } from '../customers/customer.repository';
import * as repo from './pool.repository';
import { createPoolSchema, poolListQuery, updatePoolSchema } from './pool.schemas';

const notFound = () => new AppError('Piscina não encontrada.', 404);

/** Lista piscinas (opcional: ?customer_id=1) */
export async function list(req: Request, res: Response): Promise<void> {
  const { customer_id } = poolListQuery.parse(req.query);
  res.json(await repo.listPools(pool, customer_id));
}

/** Piscinas de um cliente: GET /customers/:id/pools */
export async function listByCustomer(req: Request, res: Response): Promise<void> {
  const customerId = parseId(req.params.id);
  if (!(await findCustomerAddressId(pool, customerId))) throw new AppError('Cliente não encontrado.', 404);
  res.json(await repo.listPools(pool, customerId));
}

export async function show(req: Request, res: Response): Promise<void> {
  const found = await repo.findPoolById(pool, parseId(req.params.id));
  if (!found) throw notFound();
  res.json(found);
}

/** RF04 - Cadastrar piscina */
export async function create(req: Request, res: Response): Promise<void> {
  const data = createPoolSchema.parse(req.body);

  const id = await withTransaction(async (tx) => {
    const customerAddressId = await findCustomerAddressId(tx, data.customer_id);
    if (!customerAddressId) throw new AppError('Cliente não encontrado.', 404);

    const addressId = data.use_customer_address ? customerAddressId : await insertAddress(tx, data.address!);
    return repo.insertPool(tx, data.customer_id, addressId, data);
  });
  res.status(201).json(await repo.findPoolById(pool, id));
}

/** RF04 - Alterar piscina */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const data = updatePoolSchema.parse(req.body);

  await withTransaction(async (tx) => {
    const current = await repo.findPoolAddressInfo(tx, id);
    if (!current) throw notFound();

    let addressId: number;
    if (data.use_customer_address) {
      addressId = current.customer_address_id;
    } else if (current.address_id === current.customer_address_id) {
      // Antes usava o endereço do cliente: cria um endereço próprio para a piscina
      addressId = await insertAddress(tx, data.address!);
    } else {
      await updateAddress(tx, current.address_id, data.address!);
      addressId = current.address_id;
    }

    await repo.updatePool(tx, id, addressId, data);
    if (addressId !== current.address_id) await deleteOrphanAddresses(tx, [current.address_id]);
  });
  res.json(await repo.findPoolById(pool, id));
}

/** RF04 / RN10 - Excluir piscina somente se não houver serviços vinculados */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  await withTransaction(async (tx) => {
    const current = await repo.findPoolAddressInfo(tx, id);
    if (!current) throw notFound();
    if (await repo.poolHasServices(tx, id)) {
      throw new AppError('Não é possível excluir a piscina: existem serviços vinculados a ela.', 409);
    }
    await repo.deletePool(tx, id);
    await deleteOrphanAddresses(tx, [current.address_id]);
  });
  res.status(204).send();
}
