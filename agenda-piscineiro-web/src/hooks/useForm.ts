import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';

/**
 * Controla o envio de um formulário: mostra "Salvando...", a mensagem de erro
 * geral e os erros de cada campo devolvidos pela API.
 */
export function useSubmit() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function run(action: () => Promise<void>) {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  /** Use em <form onChange={clearOnChange}>: apaga o erro do campo assim que ele é alterado. */
  function clearOnChange(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (!name) return;
    setFieldErrors((prev) => {
      const keys = [name, `address.${name}`];
      // Mudar qualquer medida da piscina resolve o erro "informe as medidas ou o volume"
      if (['length', 'width', 'depth'].includes(name)) keys.push('volume');
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }

  return { submitting, error, fieldErrors, setError, setFieldErrors, run, clearOnChange };
}
