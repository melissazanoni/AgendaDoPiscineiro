import { pool } from '../../config/db';

export type UserRow = {
  user_id: number;
  name: string;
  email: string;
  password: string;
  reset_token: string | null;
};

export type PublicUser = Pick<UserRow, 'user_id' | 'name' | 'email'>;

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [id]);
  return rows[0];
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<PublicUser> {
  const { rows } = await pool.query<PublicUser>(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
     RETURNING user_id, name, email`,
    [name, email, passwordHash],
  );
  return rows[0];
}

export async function setResetToken(userId: number, tokenHash: string | null): Promise<void> {
  await pool.query('UPDATE users SET reset_token = $2 WHERE user_id = $1', [userId, tokenHash]);
}

export async function updatePassword(userId: number, passwordHash: string): Promise<void> {
  await pool.query('UPDATE users SET password = $2, reset_token = NULL WHERE user_id = $1', [userId, passwordHash]);
}
