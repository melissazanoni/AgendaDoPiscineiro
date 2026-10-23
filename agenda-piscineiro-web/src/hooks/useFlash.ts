import { useLocation } from 'react-router-dom';

/**
 * Mensagem de sucesso passada de uma tela para outra.
 * Ex.: navigate('/agenda', { state: { flash: 'Serviço agendado!' } })
 */
export function useFlash(): string | null {
  const location = useLocation();
  return (location.state as { flash?: string } | null)?.flash ?? null;
}
