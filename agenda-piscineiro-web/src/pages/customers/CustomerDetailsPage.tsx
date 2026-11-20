import { Link, useNavigate, useParams } from 'react-router-dom';
import { customersApi, poolsApi } from '../../api/endpoints';
import type { Pool } from '../../api/types';
import { Alert, Empty, Loading } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import { useFlash } from '../../hooks/useFlash';
import { useLoad } from '../../hooks/useLoad';
import {
  FILTER_TYPE_LABELS, POOL_TYPE_LABELS, formatDecimal, formatDocument, getFilterReplacementStatus,
} from '../../utils/format';

/** Figma: "2.2.2 - Dados Cliente" */
export function CustomerDetailsPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const flash = useFlash();
  const customer = useLoad(() => customersApi.get(id), [id]);
  const pools = useLoad(() => customersApi.pools(id), [id]);
  const action = useSubmit();

  if (customer.loading) return <div className="page page--narrow"><Loading /></div>;
  const c = customer.data;
  if (!c) {
    return (
      <div className="page page--narrow">
        <Alert>{customer.error ?? 'Cliente não encontrado.'}</Alert>
        <Link to="/clientes" className="link back-link">← Voltar para clientes</Link>
      </div>
    );
  }

  function removeCustomer() {
    if (!window.confirm(`Excluir o cliente "${c!.name}" e todas as piscinas dele?`)) return;
    action.run(async () => {
      await customersApi.remove(id);
      navigate('/clientes', { state: { flash: 'Cliente excluído.' } });
    });
  }

  function removePool(pool: Pool) {
    if (!window.confirm(`Excluir a piscina "${pool.description}"?`)) return;
    action.run(async () => {
      await poolsApi.remove(pool.pool_id);
      pools.reload();
    });
  }

  return (
    <div className="page page--narrow">
      <h1 className="title-lg">Dados do Cliente</h1>

      {flash && !action.error && <div style={{ marginTop: 20 }}><Alert type="success">{flash}</Alert></div>}

      <section className="card customer-card">
        <h2 className="customer-card__name">{c.name}</h2>
        <dl className="customer-card__info">
          <div><dt>Endereço</dt><dd>{c.address.street}</dd></div>
          <div><dt>Nº</dt><dd>{c.address.number ?? '—'}</dd></div>
          <div><dt>Bairro</dt><dd>{c.address.neighborhood ?? '—'}</dd></div>
          <div><dt>Cidade</dt><dd>{c.address.city ?? '—'}</dd></div>
          <div><dt>Telefone</dt><dd>{c.phone ?? '—'}</dd></div>
          <div><dt>{c.document_type ?? 'Documento'}</dt><dd>{formatDocument(c.document_type, c.document_number)}</dd></div>
        </dl>
        {c.address.complement && <p className="customer-card__extra">Complemento: {c.address.complement}</p>}
      </section>

      <div className="button-row">
        <Link to={`/clientes/${id}/editar`} className="btn btn--navy" style={{ width: 210, fontSize: 16, borderRadius: 12 }}>
          Editar cliente
        </Link>
        <button type="button" className="btn btn--outline-danger" style={{ width: 140 }} onClick={removeCustomer} disabled={action.submitting}>
          Excluir Cliente
        </button>
        <Link to={`/pagamentos?cliente=${id}`} className="link" style={{ marginLeft: 'auto' }}>Ver pagamentos →</Link>
      </div>

      <div style={{ marginTop: 16 }}><Alert>{action.error}</Alert></div>

      <h2 className="title-md" style={{ marginTop: 56 }}>Piscinas</h2>
      <Link to={`/clientes/${id}/piscinas/nova`} className="btn btn--aqua" style={{ marginTop: 16, padding: '0 13px', borderRadius: 12 }}>
        Nova Piscina
      </Link>

      <div className="pool-list">
        {pools.loading ? (
          <Loading />
        ) : pools.data?.length === 0 ? (
          <Empty>Nenhuma piscina cadastrada para este cliente.</Empty>
        ) : (
          pools.data?.map((p, index) => {
            const filterType = p.filter_type ?? 'areia';
            return (
              <article key={p.pool_id} className="card pool-card">
                <span className="pool-card__index">{String(index + 1).padStart(2, '0')}</span>
                <div className="pool-card__body">
                  <h3 className="pool-card__title">{p.description}</h3>
                  <p className="pool-card__address">
                    {p.uses_customer_address
                      ? 'Endereço Padrão'
                      : `Endereço alternativo: ${p.address.street}${p.address.number ? `, ${p.address.number}` : ''}`}
                  </p>
                  <div className="pool-card__specs">
                    <span>Tipo: {POOL_TYPE_LABELS[p.pool_type]} · Filtro: {FILTER_TYPE_LABELS[filterType]}</span>
                    {p.length !== null && p.width !== null && (
                      <span>Tamanho: {formatDecimal(p.length)} × {formatDecimal(p.width)} m</span>
                    )}
                    {p.depth !== null && <span>Profundidade: {formatDecimal(p.depth)} m</span>}
                    {p.volume !== null && <span>Volume: {formatDecimal(p.volume)} m³</span>}
                    <span>{getFilterReplacementStatus(filterType, p.last_sand_change)}</span>
                  </div>
                </div>
                <div className="pool-card__actions">
                  <button type="button" className="btn btn--outline-danger" style={{ width: 140, borderRadius: 10 }}
                    onClick={() => removePool(p)} disabled={action.submitting}>
                    Excluir piscina
                  </button>
                  <Link to={`/piscinas/${p.pool_id}/editar`} className="btn btn--white" style={{ width: 140, borderRadius: 12 }}>
                    Editar piscina
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      <Link to="/clientes" className="link back-link" style={{ display: 'inline-flex' }}>← Voltar para clientes</Link>
    </div>
  );
}