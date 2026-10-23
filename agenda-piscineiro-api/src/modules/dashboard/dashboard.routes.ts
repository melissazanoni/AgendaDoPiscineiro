import { Router } from 'express';
import { dashboard } from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', dashboard);
