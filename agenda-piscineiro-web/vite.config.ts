import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }, // a API aceita chamadas desta porta (FRONTEND_URL no .env do backend)
});
