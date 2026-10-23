import { Router } from 'express';
import { listByCustomer } from '../charges/charge.controller';
import { listByCustomer as listPoolsByCustomer } from '../pools/pool.controller';
import * as controller from './customer.controller';

export const customerRoutes = Router();

customerRoutes.get('/', controller.list);
customerRoutes.get('/:id', controller.show);
customerRoutes.post('/', controller.create);
customerRoutes.put('/:id', controller.update);
customerRoutes.delete('/:id', controller.remove);

// Atalhos por cliente
customerRoutes.get('/:id/charges', listByCustomer); // RF08
customerRoutes.get('/:id/pools', listPoolsByCustomer);
