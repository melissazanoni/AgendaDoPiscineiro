import { Link, useNavigate, useParams } from 'react-router-dom';
import { servicesApi } from '../../api/endpoints';
import { Alert, Loading } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import { useFlash } from '../../hooks/useFlash';
import { useLoad } from '../../hooks/useLoad';
import { FREQUENCY_LABELS, STATUS_LABELS, formatDate, plural, todayIso } from '../../utils/format';

/** Figma: "2.1.3 - Detalhes" (RN02, RN05) */
export function ServiceDetailsPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const flash = useFlash();
  const { data: service, setData, loading, error: loadError } = useLoad(() => servicesApi.get(id), [id]);
  const action = useSubmit();

  if (loading) return <div className="page page--details"><Loading /></div>;
  if (!service) {
    return (
      <div className="page page--details">
        <Alert>{loadError ?? 'Serviço não encontrado.'}</Alert>
        <Link to="/agenda" className="link back-link">← Voltar para a agenda</Link>
      </div>
    );
  }

  const isScheduled = service.status === 'agendado';
  const isFuture = service.scheduled_date > todayIso();

  function conclude() {
    if (!window.confirm('Marcar este serviço como concluído hoje?')) return;
    action.run(async () => setData(await servicesApi.conclude(id)));
  }

  function cancel() {
    if (!window.confirm('Cancelar este serviço? O horário ficará livre na agenda.')) return;
    action.run(async () => setData(await servicesApi.cancel(id)));
  }

  return (
    <div className="page page--details">
      <h1 className="title-lg" style={{ fontSize: 30 }}>Detalhes do agendamento</h1>
      <p className="subtitle">Confira as informações do serviço antes de realizar uma ação.</p>

      {flash && !action.error && <div style={{ marginTop: 20 }}><Alert type="success">{flash}</Alert></div>}

      <section className="card details">
        <h2 className="details__title">{service.description}</h2>
        <dl className="details__grid">
          <div>
            <dt>Cliente</dt>
            <dd><Link to={`/clientes/${service.customer_id}`} className="details__link">{service.customer_name}</Link></dd>
          </div>
          <div>
            <dt>Piscina</dt>
            <dd>{service.pool_description}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{formatDate(service.scheduled_date)}</dd>
          </div>
          <div>
            <dt>Horário</dt>
            <dd>{service.scheduled_time}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd><span className={`tag tag--${service.status}`} style={{ fontSize: 13, height: 26 }}>{STATUS_LABELS[service.status]}</span></dd>
          </div>
          {service.execution_date && (
            <div>
              <dt>Data de execução</dt>
              <dd>{formatDate(service.execution_date)}</dd>
            </div>
          )}
          {service.recurrence && service.recurrence_frequency && (
            <div>
              <dt>Recorrência</dt>
              <dd>
                {FREQUENCY_LABELS[service.recurrence_frequency]}
                {service.recurrence_months ? `, por ${plural(service.recurrence_months, 'mês', 'meses')}` : ''}
              </dd>
            </div>
          )}
          <div>
            <dt>Endereço</dt>
            <dd>
              {service.address.street}{service.address.number ? `, ${service.address.number}` : ''}
              {service.address.city ? ` — ${service.address.city}` : ''}
            </dd>
          </div>
        </dl>
      </section>

      <div style={{ marginTop: 24 }}><Alert>{action.error}</Alert></div>

      {isScheduled && (
        <div className="details__actions">
          <button type="button" className="btn btn--blue" onClick={() => navigate(`/agenda/${id}/editar`)}>Editar</button>
          <button
            type="button" className="btn btn--navy" onClick={conclude} disabled={action.submitting || isFuture}
            title={isFuture ? 'Só é possível concluir serviços de hoje ou de dias anteriores (RN02).' : undefined}
          >
            Concluir
          </button>
          <button type="button" className="btn btn--danger" onClick={cancel} disabled={action.submitting}>Cancelar serviço</button>
        </div>
      )}
      {isScheduled && isFuture && (
        <p className="subtitle-sm" style={{ marginTop: 10 }}>O botão Concluir é liberado a partir do dia do serviço.</p>
      )}

      <Link to="/agenda" className="link back-link" style={{ display: 'inline-flex', marginTop: 32 }}>← Voltar para a agenda</Link>
    </div>
  );
}
