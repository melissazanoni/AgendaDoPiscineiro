import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

// Mensagens amigáveis para violações de UNIQUE no banco
const uniqueMessages: Record<string, string> = {
  users_email_key: 'Este e-mail já está cadastrado.',
  customers_document_number_key: 'Já existe um cliente com este CPF/CNPJ.',
  services_unique_schedule: 'Já existe um serviço agendado para esta data e horário.',
};

type PgError = { code: string; constraint?: string };
const isPgError = (err: unknown): err is PgError =>
  typeof err === 'object' && err !== null && 'code' in err && 'severity' in err;

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos.',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  if (isPgError(err)) {
    switch (err.code) {
      case '23505': // unique_violation
        res.status(409).json({ error: uniqueMessages[err.constraint ?? ''] ?? 'Registro duplicado.' });
        return;
      case '23503': // foreign_key_violation
        res.status(409).json({ error: 'Este registro está vinculado a outros dados e não pode ser alterado/removido.' });
        return;
      case '23514': // check_violation
        res.status(400).json({ error: 'Os dados informados violam uma regra do banco de dados.' });
        return;
    }
  }

  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
}
