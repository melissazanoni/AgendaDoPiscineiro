import { Link } from 'react-router-dom';
import { customersApi, servicesApi } from '../api/endpoints';
import { Alert, Empty, Loading } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { addDaysIso, formatLongDate, plural, todayIso } from '../utils/format';

/** Figma: "2 - Dashboard" (RF12) */
export function DashboardPage() {
  const today = todayIso();
  const tomorrow = addDaysIso(today, 1);

  const { data, loading, error } = useLoad(async () => {
    const [upcoming, allServices, customers] = await Promise.all([
      servicesApi.list({ status: 'agendado', from: today }),
      servicesApi.list(),
      customersApi.list(),
    ]);

    // Quantidade de serviços (não cancelados) de cada cliente
    const countByCustomer = new Map<number, number>();
    for (const s of allServices) {
      if (s.status === 'cancelado') continue;
      countByCustomer.set(s.customer_id, (countByCustomer.get(s.customer_id) ?? 0) + 1);
    }
    const topCustomers = customers
      .map((c) => ({ ...c, services: countByCustomer.get(c.customer_id) ?? 0 }))
      .sort((a, b) => b.services - a.services || a.name.localeCompare(b.name))
      .slice(0, 4);

    return {
      today: upcoming.filter((s) => s.scheduled_date === today).length,
      tomorrow: upcoming.filter((s) => s.scheduled_date === tomorrow).length,
      total: upcoming.length,
      topCustomers,
      totalCustomers: customers.length,
    };
  }, [today, tomorrow]);

  return (
    <div className="page">
      <div className="dashboard">
        <div className="dashboard__actions">
          <Link to="/agenda" className="btn btn--navy btn--sm">Visualizar agenda</Link>
          <Link to="/pagamentos" className="btn btn--blue btn--sm">Visualizar Pagamentos</Link>
        </div>
        <div className="dashboard__actions dashboard__actions--side">
          <Link to="/clientes" className="btn btn--aqua btn--sm btn--block">Visualizar clientes</Link>
        </div>

        {/* Visão geral */}
        <section className="card dashboard__panel">
          <h1 className="title-lg">Visão geral</h1>

          {error && <Alert>{error}</Alert>}
          {loading ? (
            <Loading />
          ) : data && (
            <div className="overview">
              <div className="overview__row overview__row--today">
                <div>
                  <p className="overview__label">Hoje</p>
                  <p className="overview__date">{formatLongDate(today)}</p>
                </div>
                <p className="overview__count">{plural(data.today, 'Serviço', 'Serviços')}</p>
              </div>
              <div className="overview__row">
                <div>
                  <p className="overview__label overview__label--dark">Amanhã</p>
                  <p className="overview__date">{formatLongDate(tomorrow)}</p>
                </div>
                <p className="overview__count">{plural(data.tomorrow, 'Serviço', 'Serviços')}</p>
              </div>
              <div className="overview__row">
                <p className="overview__total">Total Agendados</p>
                <p className="overview__count">{plural(data.total, 'Serviço', 'Serviços')}</p>
              </div>
            </div>
          )}

          <Link to="/agenda/novo" className="btn btn--blue btn--sm btn--block dashboard__bottom">+ Novo serviço</Link>
        </section>

        {/* Clientes */}
        <section className="card dashboard__panel dashboard__panel--side">
          <div>
            <h2 className="title-md" style={{ fontSize: 21 }}>Clientes</h2>
            <p className="subtitle" style={{ fontSize: 12 }}>
              {data ? `Resumo dos seus clientes (${plural(data.totalCustomers, 'cadastrado', 'cadastrados')})` : 'Resumo dos seus clientes'}
            </p>
          </div>

          {loading ? (
            <Loading />
          ) : data && data.topCustomers.length === 0 ? (
            <Empty>Nenhum cliente cadastrado ainda.</Empty>
          ) : (
            <div className="mini-list">
              {data?.topCustomers.map((c) => (
                <Link key={c.customer_id} to={`/clientes/${c.customer_id}`} className="mini-list__item">
                  <span className="mini-list__name">{c.name}</span>
                  <span className="mini-list__meta">{plural(c.services, 'serviço', 'serviços')}</span>
                </Link>
              ))}
            </div>
          )}

          <Link to="/clientes/novo" className="btn btn--aqua btn--sm btn--block dashboard__bottom">+ Novo cliente</Link>
        </section>
      </div>
    </div>
  );
}
