import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/** RN09: só usuários autenticados acessam as rotas internas. */
export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('Faça login para acessar.', 401);

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(header.slice(7), env.jwtSecret) as jwt.JwtPayload;
  } catch {
    throw new AppError('Sessão inválida ou expirada. Faça login novamente.', 401);
  }
  if (payload.type !== 'access') throw new AppError('Sessão inválida. Faça login novamente.', 401);

  req.userId = Number(payload.sub);
  next();
}
