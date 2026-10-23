// Adiciona o id do usuário logado ao objeto Request do Express.
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export {};
