// Uma função para cada rota da API usada pelas telas.
import { api, query } from './client';
import type {
  Address, Charge, ChargeFrequency, ChargeSummary, Customer, CustomerType, DocumentType, FilterType,
  PaymentStatus, Pool, PoolFeatures, PoolType, Service, ServiceFrequency, ServiceStatus, User,
} from './types';

// ---------- Autenticação ----------
type AuthResponse = { user: User; token: string };

export const authApi = {
  login: (email: string, password: string) => api<AuthResponse>('/auth/login', 'POST', { email, password }),
  register: (name: string, email: string, password: string) =>
    api<AuthResponse>('/auth/register', 'POST', { name, email, password }),
  forgotPassword: (email: string) =>
    api<{ message: string; resetLink?: string }>('/auth/forgot-password', 'POST', { email }),
  resetPassword: (token: string, password: string) =>
    api<{ message: string }>('/auth/reset-password', 'POST', { token, password }),
  me: () => api<User>('/auth/me'),
};

// ---------- Clientes ----------
export type CustomerInput = {
  name: string;
  phone: string | null;
  document_type: DocumentType | null;
  document_number: string | null;
  address: Omit<Address, 'address_id'>;
};

export const customersApi = {
  list: (search?: string) => api<Customer[]>('/customers' + query({ search })),
  get: (id: number) => api<Customer>(`/customers/${id}`),
  create: (data: CustomerInput) => api<Customer>('/customers', 'POST', data),
  update: (id: number, data: CustomerInput) => api<Customer>(`/customers/${id}`, 'PUT', data),
  remove: (id: number) => api<void>(`/customers/${id}`, 'DELETE'),
  pools: (id: number) => api<Pool[]>(`/customers/${id}/pools`),
};

// ---------- Piscinas ----------
export type PoolInput = PoolFeatures & {
  description: string;
  pool_type: PoolType;
  filter_type: FilterType;
  customer_type: CustomerType;
  width: number | null;
  length: number | null;
  depth: number | null;
  volume: number | null;
  last_sand_change: string | null;
  use_customer_address: boolean;
  address?: Omit<Address, 'address_id'>;
};

export const poolsApi = {
  get: (id: number) => api<Pool>(`/pools/${id}`),
  create: (customerId: number, data: PoolInput) =>
    api<Pool>('/pools', 'POST', { ...data, customer_id: customerId }),
  update: (id: number, data: PoolInput) => api<Pool>(`/pools/${id}`, 'PUT', data),
  remove: (id: number) => api<void>(`/pools/${id}`, 'DELETE'),
};

// ---------- Serviços ----------
export type ServiceInput = {
  customer_id: number;
  pool_id: number;
  scheduled_date: string;
  scheduled_time: string;
  description: string;
};

export type NewServiceInput = ServiceInput & {
  recurrence: boolean;
  recurrence_frequency: ServiceFrequency | null;
  recurrence_months: number | null;
};

export const servicesApi = {
  list: (filters: { status?: ServiceStatus; customer_id?: number; from?: string; to?: string } = {}) =>
    api<Service[]>('/services' + query(filters)),
  get: (id: number) => api<Service>(`/services/${id}`),
  create: (data: NewServiceInput) => api<{ total: number; services: Service[] }>('/services', 'POST', data),
  update: (id: number, data: ServiceInput) => api<Service>(`/services/${id}`, 'PUT', data),
  conclude: (id: number) => api<Service>(`/services/${id}/conclude`, 'PATCH', {}),
  cancel: (id: number) => api<Service>(`/services/${id}/cancel`, 'PATCH', {}),
};

// ---------- Cobranças ----------
export type ChargeInput = {
  customer_id: number;
  amount: number;
  due_date: string;
  is_recurring: boolean;
  recurrence_frequency: ChargeFrequency | null;
};

export const chargesApi = {
  list: (filters: { customer_id?: number; status?: PaymentStatus } = {}) =>
    api<{ summary: ChargeSummary; charges: Charge[] }>('/charges' + query(filters)),
  create: (data: ChargeInput) => api<Charge>('/charges', 'POST', data),
  setStatus: (id: number, payment_status: PaymentStatus) =>
    api<Charge>(`/charges/${id}/status`, 'PATCH', { payment_status }),
};
