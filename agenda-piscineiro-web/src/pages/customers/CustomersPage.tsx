import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customersApi, servicesApi } from '../../api/endpoints';
import { Alert, Empty, Loading, SearchIcon } from '../../components/ui';
import { useFlash } from '../../hooks/useFlash';
import { useLoad } from '../../hooks/useLoad';
import { plural } from '../../utils/format';

/** Figma: "2.2 Clientes" (RF11) */
export function CustomersPage() {
  const flash = useFlash();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  // Espera o usuário parar de digitar antes de buscar
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const customers = useLoad(() => customersApi.list(debounced || undefined), [debounced]);
  const services = useLoad(() => servicesApi.list(), []);

  const countFor = (customerId: number) =>
    (services.data ?? []).filter((s) => s.customer_id === customerId && s.status !== 'cancelado').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="title-lg" style={{ color: '#0b405d', fontSize: 32 }}>Clientes</h1>
          <p className="subtitle">Clientes cadastrados</p>
        </div>
        <Link to="/clientes/novo" className="btn btn--blue" style={{ width: 290, fontSize: 15, fontWeight: 700, borderRadius: 9 }}>
          + Novo cliente
        </Link>
      </div>

      {flash && <div style={{ marginBottom: 20 }}><Alert type="success">{flash}</Alert></div>}

      <label className="search" style={{ marginTop: 44 }}>
        <span className="sr-only">Pesquisar cliente</span>
        <SearchIcon />
        <input
          type="search" placeholder="Pesquisar cliente por nome, CPF/CNPJ ou telefone..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <h2 className="section-title" style={{ fontSize: 15, fontWeight: 700, marginTop: 36 }}>Clientes cadastrados</h2>

      {customers.error && <Alert>{customers.error}</Alert>}
      {customers.loading && !customers.data ? (
        <Loading />
      ) : customers.data?.length === 0 ? (
        <Empty>
          {debounced ? `Nenhum cliente encontrado para "${debounced}".` : 'Nenhum cliente cadastrado ainda. Clique em "+ Novo cliente" para começar.'}
        </Empty>
      ) : (
        <div className="list">
          {customers.data?.map((c) => (
            <Link key={c.customer_id} to={`/clientes/${c.customer_id}`} className="list-item">
              <div>
                <p className="list-item__title">{c.name}</p>
                <p className="list-item__meta">
                  {services.data ? plural(countFor(c.customer_id), 'serviço', 'serviços') : ' '}
                  {' · '}{plural(c.pools_count, 'piscina', 'piscinas')}
                </p>
              </div>
              <span className="list-item__chevron" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
