import { Request, Response } from 'express';
import { pool, withTransaction } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { parseId } from '../../utils/validation';
import { deleteOrphanAddresses } from '../addresses/address.repository';
import * as repo from './customer.repository';
import { customerListQuery, customerSchema } from './customer.schemas';

const notFound = () => new AppError('Cliente não encontrado.', 404);

/** RF11 - Visualizar lista de clientes */
export async function list(req: Request, res: Response): Promise<void> {
  const { search } = customerListQuery.parse(req.query);
  res.json(await repo.listCustomers(pool, search));
}

export async function show(req: Request, res: Response): Promise<void> {
  const customer = await repo.findCustomerById(pool, parseId(req.params.id));
  if (!customer) throw notFound();
  res.json(customer);
}

/** RF03 - Cadastrar cliente */
export async function create(req: Request, res: Response): Promise<void> {
  const data = customerSchema.parse(req.body);
  const id = await withTransaction((tx) => repo.insertCustomer(tx, data));
  res.status(201).json(await repo.findCustomerById(pool, id));
}

/** RF03 - Alterar cliente */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const data = customerSchema.parse(req.body);

  await withTransaction(async (tx) => {
    const addressId = await repo.findCustomerAddressId(tx, id);
    if (!addressId) throw notFound();
    await repo.updateCustomer(tx, id, addressId, data);
  });
  res.json(await repo.findCustomerById(pool, id));
}

/** RF03 - Excluir cliente (somente se não tiver serviços nem cobranças) */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  await withTransaction(async (tx) => {
    if (!(await repo.findCustomerAddressId(tx, id))) throw notFound();
    if (await repo.customerHasServices(tx, id)) {
      throw new AppError('Não é possível excluir: o cliente possui serviços cadastrados.', 409);
    }
    if (await repo.customerHasCharges(tx, id)) {
      throw new AppError('Não é possível excluir: o cliente possui cobranças cadastradas.', 409);
    }
    const addressIds = await repo.listCustomerAddressIds(tx, id);
    await repo.deleteCustomer(tx, id);
    await deleteOrphanAddresses(tx, addressIds);
  });
  res.status(204).send();
}
