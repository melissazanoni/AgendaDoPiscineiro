import { Router } from 'express';
import * as controller from './charge.controller';

export const chargeRoutes = Router();

chargeRoutes.get('/', controller.list);
chargeRoutes.get('/:id', controller.show);
chargeRoutes.post('/', controller.create);
chargeRoutes.put('/:id', controller.update);
chargeRoutes.patch('/:id/status', controller.updateStatus);
chargeRoutes.delete('/:id', controller.remove);
