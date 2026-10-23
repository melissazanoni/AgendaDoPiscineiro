import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { chargesApi, customersApi } from '../../api/endpoints';
import type { Charge, Customer, PaymentStatus } from '../../api/types';
import { Alert, Empty, Loading } from '../../components/ui';
import { useFlash } from '../../hooks/useFlash';
import { useLoad } from '../../hooks/useLoad';
import { formatDate, formatMoney } from '../../utils/format';

/** Figma: "2.3 Pagamentos" + "Status — Dropdown Aberto" (RF08, RF09, RN06) */
export function PaymentsPage() {
  const flash = useFlash();
  const [params, setParams] = useSearchParams();
  const customerId = params.get('cliente') ? Number(params.get('cliente')) : undefined;

  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<Customer[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const customer = useLoad(
    () => (customerId ? customersApi.get(customerId) : Promise.resolve(null)),
    [customerId],
  );
  const charges = useLoad(() => chargesApi.list({ customer_id: customerId }), [customerId]);

  function selectCustomer(c: Customer | null) {
    setMatches(null);
    setSearch(c ? c.name : '');
    setParams(c ? { cliente: String(c.customer_id) } : {});
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!search.trim()) return selectCustomer(null);
    setSearching(true);
    try {
      const found = await customersApi.list(search.trim());
      if (found.length === 1) selectCustomer(found[0]);
      else setMatches(found);
    } finally {
      setSearching(false);
    }
  }

  async function changeStatus(charge: Charge, status: PaymentStatus) {
    setUpdateError(null);
    try {
      await chargesApi.setStatus(charge.charge_id, status);
      charges.reload(); // atualiza a linha e os totais
    } catch (err) {
      setUpdateError((err as Error).message);
    }
  }

  const summary = charges.data?.summary;
  const list = charges.data?.charges ?? [];

  return (
    <div className="page page--medium">
      <div className="page-header" style={{ marginBottom: 36 }}>
        <div>
          <h1 className="title-lg">Histórico Financeiro</h1>
          <p className="subtitle-sm">Consulte os pagamentos e cobranças de cada cliente.</p>
        </div>
        <Link to="/pagamentos/novo" state={{ customerId }} className="btn btn--aqua" style={{ width: 248, fontSize: 15, marginTop: 13 }}>
          Lançar Pagamento
        </Link>
      </div>

      {flash && <div style={{ marginBottom: 20 }}><Alert type="success">{flash}</Alert></div>}

      <form onSubmit={handleSearch}>
        <label htmlFor="payment-search" className="label" style={{ fontSize: 16, color: 'var(--text)', marginBottom: 10 }}>
          Buscar Cliente
        </label>
        <div className="search-row">
          <input
            id="payment-search" className="input" style={{ height: 54, fontSize: 15 }}
            placeholder={customer.data ? customer.data.name : 'Nome, CPF/CNPJ ou telefone do cliente'}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn--aqua" style={{ height: 54, fontSize: 15 }} disabled={searching}>
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {matches && (
        <div className="matches">
          {matches.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>Nenhum cliente encontrado.</p>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 13 }}>Escolha o cliente:</p>
              {matches.map((c) => (
                <button key={c.customer_id} type="button" className="pill" onClick={() => selectCustomer(c)}>{c.name}</button>
              ))}
            </>
          )}
        </div>
      )}

      {customer.data && (
        <div className="filter-chip">
          Mostrando cobranças de <strong>{customer.data.name}</strong>
          <button type="button" className="link link--sm" onClick={() => selectCustomer(null)}>Ver todos os clientes</button>
        </div>
      )}

      {summary && summary.count > 0 && (
        <div className="summary">
          <div><span>Total</span><strong>{formatMoney(summary.total_amount)}</strong></div>
          <div><span>Pago</span><strong className="summary--paid">{formatMoney(summary.paid_amount)}</strong></div>
          <div><span>Pendente</span><strong>{formatMoney(summary.pending_amount)}</strong></div>
          <div><span>Vencido</span><strong className="summary--overdue">{formatMoney(summary.overdue_amount)}</strong></div>
        </div>
      )}

      {(charges.error || updateError) && <div style={{ marginTop: 16 }}><Alert>{charges.error ?? updateError}</Alert></div>}

      <div className="card table-card">
        {charges.loading && !charges.data ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty>Nenhuma cobrança registrada{customer.data ? ' para este cliente' : ''}.</Empty>
        ) : (
          <table className={`table ${customerId ? '' : 'table--with-customer'}`}>
            <thead>
              <tr>
                {!customerId && <th>Cliente</th>}
                <th>Data de vencimento</th>
                <th>Valor</th>
                <th>Recorrência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ch) => (
                <tr key={ch.charge_id}>
                  {!customerId && (
                    <td><Link to={`/pagamentos?cliente=${ch.customer_id}`} className="details__link">{ch.customer_name}</Link></td>
                  )}
                  <td>
                    {formatDate(ch.due_date)}
                    {ch.is_overdue && <span className="tag tag--overdue" style={{ marginLeft: 8 }}>Vencida</span>}
                  </td>
                  <td>{formatMoney(ch.amount)}</td>
                  <td>{ch.recurrence_frequency === 'mensal' ? 'Mensal' : ch.recurrence_frequency === 'quinzenal' ? 'Quinzenal' : 'Avulsa'}</td>
                  <td>
                    <select
                      className={`status-select ${ch.payment_status === 'pago' ? 'status-select--paid' : ''}`}
                      value={ch.payment_status} aria-label="Status do pagamento"
                      onChange={(e) => changeStatus(ch, e.target.value as PaymentStatus)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
