/** Erro "esperado" da aplicação: vira uma resposta HTTP com a mensagem e o status informados. */
export class AppError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = 'AppError';
  }
}
