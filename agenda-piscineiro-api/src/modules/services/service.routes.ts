import { Router } from 'express';
import * as controller from './service.controller';

export const serviceRoutes = Router();

serviceRoutes.get('/', controller.list);
serviceRoutes.get('/upcoming', controller.upcoming); // antes de '/:id'
serviceRoutes.get('/:id', controller.show);
serviceRoutes.post('/', controller.create);
serviceRoutes.put('/:id', controller.update);
serviceRoutes.patch('/:id/conclude', controller.conclude);
serviceRoutes.patch('/:id/cancel', controller.cancel);
serviceRoutes.delete('/:id', controller.remove);
