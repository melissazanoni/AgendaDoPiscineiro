import { env } from '../config/env';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Data ('AAAA-MM-DD') e hora ('HH:MM:SS') atuais no fuso do sistema. */
export function now(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.appTimezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
  };
}

export const today = () => now().date;

export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

/** Soma meses mantendo o dia (31/01 + 1 mês = 28 ou 29/02). */
export function addMonths(date: string, months: number): string {
  const [y, m, day] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return format(new Date(Date.UTC(y, m - 1 + months, Math.min(day, lastDay))));
}

/** 'HH:MM' -> 'HH:MM:SS' */
export const normalizeTime = (time: string) => (time.length === 5 ? `${time}:00` : time);

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' */
export const formatBr = (date: string) => date.split('-').reverse().join('/');

/** true se a data + horário já passaram (RN03). */
export function isInPast(date: string, time: string): boolean {
  const n = now();
  return date < n.date || (date === n.date && normalizeTime(time) < n.time);
}
