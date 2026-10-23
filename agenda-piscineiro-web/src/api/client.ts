// Cliente HTTP: todas as telas usam a função `api` para falar com o backend.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
const TOKEN_KEY = 'agenda-piscineiro:token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Erro devolvido pela API: mensagem principal + erros de cada campo. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

// Chamado quando o token expira (o AuthContext redireciona para o login)
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const token = tokenStorage.get();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se o backend está rodando.', 0);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const fields: Record<string, string> = {};
    for (const d of data.details ?? []) fields[d.field] = d.message;
    throw new ApiError(data.error ?? 'Erro inesperado.', res.status, fields);
  }
  return data as T;
}

/** Monta a query string ignorando valores vazios: { a: 1, b: '' } -> '?a=1' */
export function query(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}
