import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`API Agenda do Piscineiro rodando em http://localhost:${env.port}`);
});
