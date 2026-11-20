-- Remove todas as tabelas e tipos do sistema (APAGA TODOS OS DADOS).
DROP TABLE IF EXISTS charges, services, pools, customers, addresses, users CASCADE;
DROP TYPE IF EXISTS document_type_enum, pool_type_enum, filter_type_enum, customer_type_enum,
  service_frequency_enum, service_status_enum, charge_frequency_enum, payment_status_enum CASCADE;