import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(255);
const password = z
  .string()
  .min(6, 'A senha deve ter no mínimo 6 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});
