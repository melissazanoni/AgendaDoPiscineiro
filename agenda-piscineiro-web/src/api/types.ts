// Tipos das respostas da API (mesmos nomes de colunas do banco).

export type User = { user_id: number; name: string; email: string };

export type Address = {
  address_id?: number;
  street: string;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  complement: string | null;
};

export type DocumentType = 'CPF' | 'CNPJ';

export type Customer = {
  customer_id: number;
  name: string;
  phone: string | null;
  document_type: DocumentType | null;
  document_number: string | null;
  address: Address;
  pools_count: number;
};

export type PoolType = 'fibra' | 'vinil' | 'alvenaria' | 'azulejo' | 'pastilha';
export type FilterType = 'areia' | 'zeolita' | 'cartucho' | 'bag' | 'diatomita';
export type CustomerType =
  | 'residencia' | 'condominio' | 'sitio ou chacara' | 'clube' | 'hoteis e resorts' | 'academias';

export type PoolFeatures = {
  has_heating: boolean;
  has_ozone_treatment: boolean;
  has_waterfall: boolean;
  has_hydromassage: boolean;
  has_led_lighting: boolean;
  has_infinity_edge: boolean;
  has_timer: boolean;
  has_uv_treatment: boolean;
};

export type Pool = PoolFeatures & {
  pool_id: number;
  customer_id: number;
  customer_name: string;
  description: string;
  pool_type: PoolType;
  filter_type: FilterType;
  customer_type: CustomerType;
  width: number | null;
  length: number | null;
  depth: number | null;
  volume: number | null;
  last_sand_change: string | null;
  uses_customer_address: boolean;
  address: Address;
};

export type ServiceStatus = 'agendado' | 'concluido' | 'cancelado';
export type ServiceFrequency = 'semanal' | 'quinzenal' | 'mensal';

export type Service = {
  service_id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  pool_id: number;
  pool_description: string;
  filter_type: FilterType;
  scheduled_date: string; // AAAA-MM-DD
  scheduled_time: string; // HH:MM
  description: string;
  recurrence: boolean;
  recurrence_frequency: ServiceFrequency | null;
  recurrence_months: number | null;
  status: ServiceStatus;
  execution_date: string | null;
  address: Address;
};

export type PaymentStatus = 'pendente' | 'pago';
export type ChargeFrequency = 'quinzenal' | 'mensal';

export type Charge = {
  charge_id: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  due_date: string;
  is_recurring: boolean;
  recurrence_frequency: ChargeFrequency | null;
  payment_status: PaymentStatus;
  is_overdue: boolean;
};

export type ChargeSummary = {
  count: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
};
