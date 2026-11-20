// Funções de formatação (datas, dinheiro, documentos) usadas pelas telas.
import type { CustomerType, FilterType, PoolType, ServiceFrequency, ServiceStatus } from '../api/types';

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

/** Máscara enquanto digita: 25102026 -> 25/10/2026 */
export function maskDate(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

/** '25/10/2026' -> '2026-10-25' ('' se incompleta ou inexistente, ex.: 31/02) */
export function parseBrDate(text: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return '';
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = parseIso(iso);
  return toIsoDate(d) === iso ? iso : '';
}

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

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  areia: 'Areia',
  zeolita: 'Zeólita',
  cartucho: 'Cartucho (Refil)',
  bag: 'Bag (Bolsa)',
  diatomita: 'Diatomita',
};

export const FILTER_MAINTENANCE: Record<FilterType, {
  changeLabel: string;
  maxMonths: number | null;
  validityText: string;
  routine: string;
}> = {
  areia: {
    changeLabel: 'Última troca da areia',
    maxMonths: 24,
    validityText: '2 a 3 anos',
    routine: 'Retrolavagem (Lavar) semanal ou +5 a 10 psi no manômetro + Enxágue por 30s. Troca da areia a cada 2 a 3 anos.',
  },
  zeolita: {
    changeLabel: 'Última troca da zeólita',
    maxMonths: 36,
    validityText: '3 a 5 anos',
    routine: 'Retrolavagem (Lavar) semanal ou +5 a 10 psi no manômetro + Enxágue por 30s. Troca da zeólita a cada 3 a 5 anos.',
  },
  cartucho: {
    changeLabel: 'Última troca do refil (cartucho)',
    maxMonths: 6,
    validityText: '6 a 12 meses',
    routine: 'Retirar o refil e lavar entre as dobras com mangueira (sem alta pressão); desengordurar a cada 1–2 meses. Troca a cada 6 a 12 meses.',
  },
  bag: {
    changeLabel: 'Última troca da bolsa (bag)',
    maxMonths: 6,
    validityText: '6 a 12 meses',
    routine: 'Retirar a bolsa filtrante e lavar com mangueira a cada visita. Troca a cada 6 a 12 meses ou se houver desgaste.',
  },
  diatomita: {
    changeLabel: 'Última troca das grades (opcional)',
    maxMonths: null,
    validityText: 'Apenas se rasgar ou empenar',
    routine: 'Retrolavagem ao subir a pressão + reposição imediata do pó de diatomita pelo skimmer. Limpeza profunda das grades 1 a 2x/ano.',
  },
};

export function getFilterReplacementStatus(type: FilterType, lastChangeIso: string | null): string {
  const info = FILTER_MAINTENANCE[type];
  if (!lastChangeIso) return `Troca: não informada (vida útil: ${info.validityText})`;
  if (!info.maxMonths) return `Última troca das grades: ${formatDate(lastChangeIso)}`;

  const [y, m, d] = lastChangeIso.split('-').map(Number);
  const dueDate = new Date(y, m - 1 + info.maxMonths, d);
  const overdue = new Date() > dueDate;
  return `Última troca: ${formatDate(lastChangeIso)} (${overdue ? 'avaliar substituição' : 'dentro do prazo'})`;
}