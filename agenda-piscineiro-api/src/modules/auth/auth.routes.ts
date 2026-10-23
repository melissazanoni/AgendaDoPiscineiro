import { Router } from 'express';
import { ensureAuthenticated } from '../../middlewares/auth';
import * as controller from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', controller.register);
authRoutes.post('/login', controller.login);
authRoutes.post('/forgot-password', controller.forgotPassword);
authRoutes.post('/reset-password', controller.resetPassword);
authRoutes.get('/me', ensureAuthenticated, controller.me);
