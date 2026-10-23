import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customersApi, servicesApi } from '../../api/endpoints';
import type { Customer, Pool, ServiceFrequency } from '../../api/types';
import { CustomerPicker } from '../../components/CustomerPicker';
import { Alert, Field, Loading, RadioGroup, SelectField } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import { FREQUENCY_LABELS, formatDate, plural, todayIso } from '../../utils/format';

type Kind = 'avulso' | 'recorrente';

const DURATIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: plural(i + 1, 'mês', 'meses'),
}));

/** Figma: "2.1.1 Novo Servico", "2.1.2 Novo Servico Recorrente" e "2.1.4 - Editar serviço" (RF05) */
export function ServiceFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pools, setPools] = useState<Pool[] | null>(null);
  const [poolId, setPoolId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [kind, setKind] = useState<Kind>('avulso');
  const [frequency, setFrequency] = useState<ServiceFrequency | ''>('');
  const [months, setMonths] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const { submitting, error, fieldErrors, setFieldErrors, run, clearOnChange } = useSubmit();

  // Edição: carrega o serviço e o cliente dele
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const s = await servicesApi.get(editId);
        if (s.status !== 'agendado') {
          setLoadError('Só é possível editar serviços com status "agendado".');
          return;
        }
        setCustomer(await customersApi.get(s.customer_id));
        setPoolId(String(s.pool_id));
        setDate(s.scheduled_date);
        setTime(s.scheduled_time);
        setDescription(s.description);
        setKind(s.recurrence ? 'recorrente' : 'avulso');
        setFrequency(s.recurrence_frequency ?? '');
        setMonths(s.recurrence_months ? String(s.recurrence_months) : '');
      } catch (err) {
        setLoadError((err as Error).message);
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [editId]);

  // Ao escolher o cliente, carrega as piscinas dele
  useEffect(() => {
    setPools(null);
    if (!customer) return;
    customersApi.pools(customer.customer_id).then((list) => {
      setPools(list);
      // Se o cliente tem só uma piscina, já deixa selecionada
      setPoolId((current) =>
        list.some((p) => String(p.pool_id) === current) ? current : list.length === 1 ? String(list[0].pool_id) : '',
      );
    });
  }, [customer]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!customer) errors.customer_id = 'Selecione um cliente.';
    else if (!poolId) errors.pool_id = 'Selecione a piscina.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const base = {
      customer_id: customer!.customer_id,
      pool_id: Number(poolId),
      scheduled_date: date,
      scheduled_time: time,
      description,
    };

    run(async () => {
      if (editId) {
        await servicesApi.update(editId, base);
        navigate(`/agenda/${editId}`, { state: { flash: 'Alterações salvas.' } });
        return;
      }
      const recurrent = kind === 'recorrente';
      const result = await servicesApi.create({
        ...base,
        recurrence: recurrent,
        recurrence_frequency: recurrent ? frequency || null : null,
        recurrence_months: recurrent && months ? Number(months) : null,
      });
      const flash = result.total > 1
        ? `${result.total} serviços agendados (de ${formatDate(result.services[0].scheduled_date)} a ${formatDate(result.services[result.total - 1].scheduled_date)}).`
        : 'Serviço agendado.';
      navigate('/agenda', { state: { flash } });
    });
  }

  if (loadingEdit) return <div className="page page--narrow"><Loading /></div>;
  if (loadError) {
    return (
      <div className="page page--narrow">
        <Alert>{loadError}</Alert>
        <Link to="/agenda" className="link back-link">← Voltar para a agenda</Link>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <h1 className="title-lg">{editId ? 'Editar serviço' : 'Novo serviço'}</h1>
      <p className="subtitle-sm">
        {editId ? 'Altere as informações do atendimento.' : 'Cadastre um novo atendimento na sua agenda.'}
      </p>

      <form className="form" style={{ marginTop: 24 }} onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <CustomerPicker value={customer} onChange={setCustomer} error={fieldErrors.customer_id} />

        {customer && (
          pools === null ? (
            <Loading text="Carregando piscinas..." />
          ) : pools.length === 0 ? (
            <Alert type="info">
              Este cliente ainda não tem piscinas cadastradas.{' '}
              <Link className="link link--sm" to={`/clientes/${customer.customer_id}/piscinas/nova`}>Cadastrar piscina</Link>
            </Alert>
          ) : (
            <SelectField
              label="Selecione a Piscina" name="pool_id" required placeholder="Selecione..."
              value={poolId} onChange={(e) => setPoolId(e.target.value)} error={fieldErrors.pool_id}
              options={pools.map((p) => ({ value: String(p.pool_id), label: p.description }))}
            />
          )
        )}

        <Field
          label="Data" name="scheduled_date" type="date" min={todayIso()}
          value={date} onChange={(e) => setDate(e.target.value)} error={fieldErrors.scheduled_date}
        />
        <Field
          label="Descrição" name="description" placeholder="Ex.: Limpeza completa da piscina" maxLength={500}
          value={description} onChange={(e) => setDescription(e.target.value)} error={fieldErrors.description}
        />

        <div className="row row-2" style={{ alignItems: 'start' }}>
          <Field
            label="Horário" name="scheduled_time" type="time"
            value={time} onChange={(e) => setTime(e.target.value)} error={fieldErrors.scheduled_time}
          />
          <div style={{ paddingTop: 4 }}>
            <RadioGroup<Kind>
              label="Tipo de Serviço" name="kind" value={kind} onChange={setKind} disabled={Boolean(editId)}
              options={[{ value: 'recorrente', label: 'Recorrente' }, { value: 'avulso', label: 'Avulso' }]}
            />
          </div>
        </div>

        {kind === 'recorrente' && (
          <div className="row row-2" style={{ alignItems: 'start', marginTop: 8 }}>
            <RadioGroup<ServiceFrequency | ''>
              label="Repetir a cada" name="recurrence_frequency" value={frequency} onChange={setFrequency}
              disabled={Boolean(editId)} error={fieldErrors.recurrence_frequency}
              options={(['semanal', 'mensal', 'quinzenal'] as const).map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
            />
            <SelectField
              label="Duração" name="recurrence_months" required placeholder="Selecione..."
              disabled={Boolean(editId)} options={DURATIONS} error={fieldErrors.recurrence_months}
              value={months} onChange={(e) => setMonths(e.target.value)}
            />
          </div>
        )}

        {editId && kind === 'recorrente' && (
          <Alert type="info">
            Esta alteração vale só para este dia. A recorrência não pode ser alterada: para mudar,
            cancele os serviços e agende novamente.
          </Alert>
        )}

        <Alert>{error}</Alert>

        <button
          className={`btn ${editId ? 'btn--blue' : 'btn--navy'} btn--block`}
          style={{ marginTop: 40, borderRadius: 12 }} disabled={submitting}
        >
          {submitting ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Agendar'}
        </button>
        <Link to={editId ? `/agenda/${editId}` : '/agenda'} className="link link--sm">← Cancelar e voltar</Link>
      </form>
    </div>
  );
}
