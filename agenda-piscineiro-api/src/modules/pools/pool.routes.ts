import { Router } from 'express';
import * as controller from './pool.controller';

export const poolRoutes = Router();

poolRoutes.get('/', controller.list);
poolRoutes.get('/:id', controller.show);
poolRoutes.post('/', controller.create);
poolRoutes.put('/:id', controller.update);
poolRoutes.delete('/:id', controller.remove);
