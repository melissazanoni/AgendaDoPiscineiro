import './utils/validation'; // carrega as mensagens de validação em português
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { ensureAuthenticated } from './middlewares/auth';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { chargeRoutes } from './modules/charges/charge.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { poolRoutes } from './modules/pools/pool.routes';
import { serviceRoutes } from './modules/services/service.routes';

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rotas públicas
app.use('/auth', authRoutes);

// Rotas internas: exigem login (RN09)
app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
app.use('/customers', ensureAuthenticated, customerRoutes);
app.use('/pools', ensureAuthenticated, poolRoutes);
app.use('/services', ensureAuthenticated, serviceRoutes);
app.use('/charges', ensureAuthenticated, chargeRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(errorHandler);
