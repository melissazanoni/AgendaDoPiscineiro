import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { today } from '../../utils/dates';
import { parseId } from '../../utils/validation';
import { findCustomerById } from '../customers/customer.repository';
import * as repo from './charge.repository';
import {
  chargeListQuery, chargeStatusSchema, createChargeSchema, updateChargeSchema,
} from './charge.schemas';

const notFound = () => new AppError('Cobrança não encontrada.', 404);

async function getStatusOr404(id: number) {
  const status = await repo.findChargeStatus(pool, id);
  if (!status) throw notFound();
  return status;
}

/** RF09 - Histórico financeiro (?customer_id=&status=&from=&to=) com totais */
export async function list(req: Request, res: Response): Promise<void> {
  const filters = chargeListQuery.parse(req.query);
  const day = today();
  const [summary, charges] = await Promise.all([
    repo.summarizeCharges(pool, day, filters),
    repo.listCharges(pool, day, filters),
  ]);
  res.json({ summary, charges });
}

/** RF08 - Pagamentos de um cliente: GET /customers/:id/charges */
export async function listByCustomer(req: Request, res: Response): Promise<void> {
  const customerId = parseId(req.params.id);
  const customer = await findCustomerById(pool, customerId);
  if (!customer) throw new AppError('Cliente não encontrado.', 404);

  const filters = { ...chargeListQuery.parse(req.query), customer_id: customerId };
  const day = today();
  const [summary, charges] = await Promise.all([
    repo.summarizeCharges(pool, day, filters),
    repo.listCharges(pool, day, filters),
  ]);
  res.json({ customer: { customer_id: customer.customer_id, name: customer.name }, summary, charges });
}

export async function show(req: Request, res: Response): Promise<void> {
  const charge = await repo.findChargeById(pool, today(), parseId(req.params.id));
  if (!charge) throw notFound();
  res.json(charge);
}

/** RF07 - Registrar cobrança */
export async function create(req: Request, res: Response): Promise<void> {
  const data = createChargeSchema.parse(req.body);
  if (!(await findCustomerById(pool, data.customer_id))) throw new AppError('Cliente não encontrado.', 404);

  const id = await repo.insertCharge(pool, data);
  res.status(201).json(await repo.findChargeById(pool, today(), id));
}

/** Alterar cobrança (somente pendentes) */
export async function update(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if ((await getStatusOr404(id)) === 'pago') {
    throw new AppError('Cobranças pagas não podem ser alteradas. Volte o status para "pendente" antes.', 400);
  }
  const data = updateChargeSchema.parse(req.body);
  await repo.updateCharge(pool, id, data);
  res.json(await repo.findChargeById(pool, today(), id));
}

/** RN06 - Marcar como pago / pendente */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await getStatusOr404(id);
  const { payment_status } = chargeStatusSchema.parse(req.body);
  await repo.updateChargeStatus(pool, id, payment_status);
  res.json(await repo.findChargeById(pool, today(), id));
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  if ((await getStatusOr404(id)) === 'pago') {
    throw new AppError('Não é possível excluir uma cobrança já paga.', 400);
  }
  await repo.deleteCharge(pool, id);
  res.status(204).send();
}
