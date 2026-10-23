import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { customersApi } from '../../api/endpoints';
import { Alert, Field, Loading, RadioGroup } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import { formatDocument, maskDocument, maskPhone } from '../../utils/format';

type DocChoice = 'CPF' | 'CNPJ' | 'none';

/** Figma: "2.2.1 - Novo Cliente", "2.2.1.1 Novo Cliente - CNPJ" e "2.2.3 Editar Cliente" (RF03) */
export function CustomerFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [phone, setPhone] = useState('');
  const [docType, setDocType] = useState<DocChoice>('CPF');
  const [document, setDocument] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const { submitting, error, fieldErrors, run, clearOnChange } = useSubmit();

  useEffect(() => {
    if (!editId) return;
    customersApi
      .get(editId)
      .then((c) => {
        setName(c.name);
        setStreet(c.address.street);
        setNumber(c.address.number ?? '');
        setCity(c.address.city ?? '');
        setNeighborhood(c.address.neighborhood ?? '');
        setComplement(c.address.complement ?? '');
        setPhone(c.phone ?? '');
        setDocType(c.document_type ?? 'none');
        setDocument(c.document_type ? formatDocument(c.document_type, c.document_number) : '');
      })
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  function changeDocType(value: DocChoice) {
    setDocType(value);
    setDocument('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const data = {
      name,
      phone: phone || null,
      document_type: docType === 'none' ? null : docType,
      document_number: docType === 'none' ? null : document || null,
      address: {
        street,
        number: number || null,
        neighborhood: neighborhood || null,
        city: city || null,
        complement: complement || null,
      },
    };
    run(async () => {
      const saved = editId ? await customersApi.update(editId, data) : await customersApi.create(data);
      navigate(`/clientes/${saved.customer_id}`, {
        state: { flash: editId ? 'Alterações salvas.' : 'Cliente cadastrado. Agora cadastre as piscinas dele.' },
      });
    });
  }

  if (loadingEdit) return <div className="page page--narrow"><Loading /></div>;
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
      <h1 className="title-lg">{editId ? 'Editar cliente' : 'Novo cliente'}</h1>
      {!editId && <p className="subtitle-sm">Cadastre os dados do cliente para seus atendimentos.</p>}
      <p className="muted" style={{ fontSize: 11, marginTop: 14 }}>* Campos obrigatórios</p>

      <form className="form" style={{ marginTop: 14 }} onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <Field label="Nome *" name="name" placeholder="Nome completo" value={name}
          onChange={(e) => setName(e.target.value)} error={f.name} />

        <div className="row row-address">
          <Field label="Endereço *" name="street" placeholder="Rua, avenida..." value={street}
            onChange={(e) => setStreet(e.target.value)} error={f['address.street']} />
          <Field label="Nº" name="number" placeholder="Número" value={number} maxLength={10}
            onChange={(e) => setNumber(e.target.value)} error={f['address.number']} />
        </div>

        <div className="row row-2">
          <Field label="Cidade" name="city" placeholder="Cidade" value={city}
            onChange={(e) => setCity(e.target.value)} error={f['address.city']} />
          <Field label="Bairro" name="neighborhood" placeholder="Bairro" value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)} error={f['address.neighborhood']} />
        </div>

        <div className="row row-2">
          <Field label="Complemento" name="complement" placeholder="Apto, bloco, referência..." value={complement}
            onChange={(e) => setComplement(e.target.value)} error={f['address.complement']} />
          <Field label="Telefone" name="phone" type="tel" placeholder="(00) 00000-0000" value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))} error={f.phone} />
        </div>

        <RadioGroup<DocChoice>
          label="Documento" name="document_type" value={docType} onChange={changeDocType}
          options={[{ value: 'CPF', label: 'CPF' }, { value: 'CNPJ', label: 'CNPJ' }, { value: 'none', label: 'Não informar' }]}
          error={f.document_type}
        />

        {docType !== 'none' && (
          <Field
            label={docType} name="document_number"
            placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
            value={document} onChange={(e) => setDocument(maskDocument(docType, e.target.value))}
            error={f.document_number}
          />
        )}

        <Alert>{error}</Alert>

        <button
          className={`btn ${editId ? 'btn--aqua' : 'btn--navy'} btn--block`}
          style={{ borderRadius: 12, ...(editId ? { color: '#fff' } : {}) }} disabled={submitting}
        >
          {submitting ? 'Salvando...' : editId ? 'Salvar alterações' : 'Salvar cliente'}
        </button>
        <Link to={editId ? `/clientes/${editId}` : '/clientes'} className="link link--sm">← Cancelar e voltar</Link>
      </form>
    </div>
  );
}
