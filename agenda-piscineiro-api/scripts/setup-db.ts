// Cria as tabelas no banco configurado em DATABASE_URL.
// Uso: npm run db:setup   (cria)
//      npm run db:reset   (apaga tudo e recria)
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

const sqlFile = (name: string) => readFile(path.join(__dirname, '..', 'database', name), 'utf8');

async function main() {
  const reset = process.argv.includes('--reset');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    if (reset) {
      await client.query(await sqlFile('drop.sql'));
      console.log('Tabelas antigas removidas.');
    }
    await client.query(await sqlFile('schema.sql'));
    console.log('Banco de dados criado com sucesso.');
  } finally {
    await client.end();
  }
}

main().catch((err: Error) => {
  console.error('Erro ao criar o banco:', err.message);
  if (err.message.includes('already exists')) {
    console.error('As tabelas já existem. Use "npm run db:reset" para recriar (isso APAGA todos os dados).');
  }
  process.exit(1);
});
