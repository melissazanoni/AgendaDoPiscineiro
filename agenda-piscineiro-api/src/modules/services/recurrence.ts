import { addDays, addMonths } from '../../utils/dates';

/**
 * Gera as datas de um serviço recorrente.
 * Ex.: início 05/10, semanal por 1 mês -> 05/10, 12/10, 19/10, 26/10, 02/11.
 */
export function generateOccurrences(
  start: string,
  frequency: 'semanal' | 'quinzenal' | 'mensal' | null,
  months: number | null,
): string[] {
  if (!frequency || !months) return [start];

  const end = addMonths(start, months); // limite (exclusivo)
  const dates: string[] = [];
  for (let i = 0; ; i++) {
    const date =
      frequency === 'mensal' ? addMonths(start, i) : addDays(start, i * (frequency === 'semanal' ? 7 : 14));
    if (date >= end) break;
    dates.push(date);
  }
  return dates;
}
