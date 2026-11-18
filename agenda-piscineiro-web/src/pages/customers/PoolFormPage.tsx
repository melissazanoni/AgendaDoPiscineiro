import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customersApi, poolsApi, type PoolInput } from '../../api/endpoints';
import type { CustomerType, PoolFeatures, PoolType } from '../../api/types';
import { Alert, DateField, Field, Loading, RadioGroup, SelectField } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import {
  CUSTOMER_TYPE_LABELS, POOL_TYPE_LABELS, formatDecimal, parseDecimal, todayIso,
} from '../../utils/format';

const FEATURES: { key: keyof PoolFeatures; label: string }[] = [
  { key: 'has_heating', label: 'Aquecida' },
  { key: 'has_hydromassage', label: 'SPA / Hidromassagem' },
  { key: 'has_infinity_edge', label: 'Borda Infinita' },
  { key: 'has_waterfall', label: 'Cascata' },
  { key: 'has_led_lighting', label: 'Iluminação LED' },
  { key: 'has_timer', label: 'Timer' },
  { key: 'has_ozone_treatment', label: 'Tratamento com ozônio' },
  { key: 'has_uv_treatment', label: 'Tratamento UV' },
];

const NO_FEATURES: PoolFeatures = {
  has_heating: false, has_ozone_treatment: false, has_waterfall: false, has_hydromassage: false,
  has_led_lighting: false, has_infinity_edge: false, has_timer: false, has_uv_treatment: false,
};

type AddressChoice = 'customer' | 'other';

/** Figma: "2.2.4 Nova Piscina", "2.2.5 End Alternativo" e "2.2.6 Editar Piscina" (RF04) */
export function PoolFormPage() {
  const params = useParams();
  const editId = params.id ? Number(params.id) : null;
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState<number | null>(params.customerId ? Number(params.customerId) : null);
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [poolType, setPoolType] = useState<PoolType | ''>('');
  const [features, setFeatures] = useState<PoolFeatures>(NO_FEATURES);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [volume, setVolume] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [sandChange, setSandChange] = useState('');
  const [addressChoice, setAddressChoice] = useState<AddressChoice>('customer');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { submitting, error, fieldErrors, setFieldErrors, run, clearOnChange } = useSubmit();

  useEffect(() => {
    (async () => {
      try {
        if (editId) {
          const p = await poolsApi.get(editId);
          setCustomerId(p.customer_id);
          setCustomerName(p.customer_name);
          setDescription(p.description);
          setPoolType(p.pool_type);
          setFeatures(Object.fromEntries(FEATURES.map((f) => [f.key, p[f.key]])) as PoolFeatures);
          setLength(formatDecimal(p.length));
          setWidth(formatDecimal(p.width));
          setDepth(formatDecimal(p.depth));
          setVolume(formatDecimal(p.volume));
          setCustomerType(p.customer_type);
          setSandChange(p.last_sand_change ?? '');
          setAddressChoice(p.uses_customer_address ? 'customer' : 'other');
          if (!p.uses_customer_address) {
            setStreet(p.address.street);
            setNumber(p.address.number ?? '');
            setCity(p.address.city ?? '');
            setNeighborhood(p.address.neighborhood ?? '');
          }
        } else if (customerId) {
          setCustomerName((await customersApi.get(customerId)).name);
        }
      } catch (err) {
        setLoadError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  // Volume calculado pelas medidas (mostrado como sugestão no campo Volume)
  const l = parseDecimal(length), w = parseDecimal(width), d = parseDecimal(depth);
  const computedVolume = l && w && d ? Math.round(l * w * d * 100) / 100 : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!poolType) errors.pool_type = 'Selecione o tipo da piscina.';
    if (!customerType) errors.customer_type = 'Selecione o tipo de cliente.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const data: PoolInput = {
      description,
      pool_type: poolType as PoolType,
      customer_type: customerType as CustomerType,
      ...features,
      length: l,
      width: w,
      depth: d,
      volume: parseDecimal(volume),
      last_sand_change: sandChange || null,
      use_customer_address: addressChoice === 'customer',
      address: addressChoice === 'other'
        ? { street, number: number || null, city: city || null, neighborhood: neighborhood || null, complement: null }
        : undefined,
    };

    run(async () => {
      if (editId) await poolsApi.update(editId, data);
      else await poolsApi.create(customerId!, data);
      navigate(`/clientes/${customerId}`, { state: { flash: editId ? 'Piscina atualizada.' : 'Piscina cadastrada.' } });
    });
  }

  if (loading) return <div className="page page--narrow"><Loading /></div>;
  if (loadError) {
    return (
      <div className="page page--narrow">
        <Alert>{loadError}</Alert>
        <Link to="/clientes" className="link back-link">← Voltar para clientes</Link>
      </div>
    );
  }

  const f = fieldErrors;
  return (
    <div className="page page--narrow">
      <h1 className="title-lg">{editId ? 'Editar piscina' : 'Nova piscina'}</h1>
      <p className="section-title" style={{ marginTop: 40 }}>Cliente: {customerName}</p>

      <form className="form" onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <Field label="Descrição" name="description" placeholder="Ex.: Piscina casa" maxLength={255}
          value={description} onChange={(e) => setDescription(e.target.value)} error={f.description} />

        <fieldset className="fieldset">
          <legend className="section-title">Tipo de piscina</legend>
          <div className="check-grid">
            {(Object.keys(POOL_TYPE_LABELS) as PoolType[]).map((t) => (
              <label key={t} className="check">
                <input type="radio" name="pool_type" checked={poolType === t} onChange={() => setPoolType(t)} />
                {POOL_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
          {f.pool_type && <span className="field-error">{f.pool_type}</span>}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="section-title">Recursos da piscina</legend>
          <div className="check-grid">
            {FEATURES.map((feat) => (
              <label key={feat.key} className="check">
                <input
                  type="checkbox" checked={features[feat.key]}
                  onChange={(e) => setFeatures({ ...features, [feat.key]: e.target.checked })}
                />
                {feat.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="section-title">Dimensão da piscina</legend>
          <p className="subtitle-sm" style={{ marginTop: -6, marginBottom: 14 }}>
            Informe comprimento, largura e profundidade (em metros) ou só o volume (m³).
          </p>
          <div className="dimensions">
            <Field label="Comprimento" name="length" inputMode="decimal" value={length}
              onChange={(e) => setLength(e.target.value)} error={f.length} />
            <Field label="Largura" name="width" inputMode="decimal" value={width}
              onChange={(e) => setWidth(e.target.value)} error={f.width} />
            <Field label="Profundidade" name="depth" inputMode="decimal" value={depth}
              onChange={(e) => setDepth(e.target.value)} error={f.depth} />
            <Field label="Volume" name="volume" inputMode="decimal" value={volume}
              placeholder={computedVolume ? `${formatDecimal(computedVolume)} m³` : ''}
              onChange={(e) => setVolume(e.target.value)} error={f.volume} />
          </div>
        </fieldset>

        <SelectField
          label="Tipo de cliente" name="customer_type" required placeholder="Selecione"
          value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType)} error={f.customer_type}
          options={Object.entries(CUSTOMER_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />

        <DateField label="Última troca de areia" name="last_sand_change" max={todayIso()}
          value={sandChange} onChange={setSandChange} error={f.last_sand_change} />

        <div className="form-section">
          <p className="section-title">Endereço</p>
          <RadioGroup<AddressChoice>
            name="address_choice" value={addressChoice} onChange={setAddressChoice} error={f.address}
            options={[
              { value: 'customer', label: 'Usar endereço do cliente' },
              { value: 'other', label: 'Cadastrar um endereço alternativo' },
            ]}
          />
        </div>

        {addressChoice === 'other' && (
          <>
            <div className="row row-address">
              <Field label="Endereço" name="street" placeholder="Rua, avenida..." value={street}
                onChange={(e) => setStreet(e.target.value)} error={f['address.street']} />
              <Field label="Nº" name="number" placeholder="Número" maxLength={10} value={number}
                onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="row row-2">
              <Field label="Cidade" name="city" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
              <Field label="Bairro" name="neighborhood" placeholder="Bairro" value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
          </>
        )}

        <Alert>{error}</Alert>

        <button className="btn btn--navy btn--block" style={{ marginTop: 40, borderRadius: 12 }} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar piscina'}
        </button>
        <Link to={customerId ? `/clientes/${customerId}` : '/clientes'} className="link link--sm">← Cancelar e voltar</Link>
      </form>
    </div>
  );
}
