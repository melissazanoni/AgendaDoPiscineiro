// Funções de formatação (datas, dinheiro, documentos) usadas pelas telas.
import type { CustomerType, PoolType, ServiceFrequency, ServiceStatus } from '../api/types';

// ---------- Datas (sempre no formato da API: 'AAAA-MM-DD') ----------
const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayIso = () => toIsoDate(new Date());

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** '2026-10-25' -> '25/10/2026' */
export const formatDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '—');

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** '2026-09-09' -> '09 de Setembro de 2026' */
export function formatLongDate(iso: string): string {
  const d = parseIso(iso);
  return `${pad(d.getDate())} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export const weekdayName = (iso: string) => WEEKDAYS[parseIso(iso).getDay()];

// ---------- Dinheiro ----------
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatMoney = (value: number) => brl.format(value);

/** '1.234,56' ou '130' -> 1234.56 / 130 (null se inválido) */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/[^\d,.]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** '1,40' ou '1.4' -> 1.4 (null se vazio) */
export function parseDecimal(text: string): number | null {
  if (!text.trim()) return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export const formatDecimal = (n: number | null) =>
  n === null ? '' : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

// ---------- Documentos e telefone ----------
export function formatDocument(type: 'CPF' | 'CNPJ' | null, value: string | null): string {
  if (!type || !value) return '—';
  if (type === 'CPF' && value.length === 11) {
    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (type === 'CNPJ' && value.length === 14) {
    return value.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5');
  }
  return value;
}

/** Máscara enquanto digita: 52998224725 -> 529.982.247-25 */
export function maskDocument(type: 'CPF' | 'CNPJ', text: string): string {
  if (type === 'CPF') {
    const d = text.replace(/\D/g, '').slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  // CNPJ (aceita o formato alfanumérico)
  const c = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
  return c
    .replace(/^(.{2})(.)/, '$1.$2')
    .replace(/^(.{2})\.(.{3})(.)/, '$1.$2.$3')
    .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, '$1.$2.$3/$4')
    .replace(/\/(.{4})(.)/, '/$1-$2');
}

export function maskPhone(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

// ---------- Rótulos dos enums ----------
export const POOL_TYPE_LABELS: Record<PoolType, string> = {
  fibra: 'Fibra', vinil: 'Vinil', alvenaria: 'Alvenaria', azulejo: 'Azulejo', pastilha: 'Pastilha',
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  'sitio ou chacara': 'Sítio ou Chácara',
  condominio: 'Condomínio',
  residencia: 'Residência',
  clube: 'Clube',
  'hoteis e resorts': 'Hotéis e Resorts',
  academias: 'Academias',
};

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  agendado: 'Agendado', concluido: 'Concluído', cancelado: 'Cancelado',
};

export const FREQUENCY_LABELS: Record<ServiceFrequency, string> = {
  semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal',
};

export const plural = (n: number, singular: string, pluralForm: string) =>
  `${n} ${n === 1 ? singular : pluralForm}`;
