import { useEffect, useState } from 'react';
import { customersApi } from '../api/endpoints';
import type { Customer } from '../api/types';
import { formatDocument } from '../utils/format';

type Props = {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  error?: string;
};

/**
 * Campo "Cliente" do protótipo: busca entre os clientes cadastrados
 * e mostra cada resultado com o botão "Selecionar".
 */
export function CustomerPicker({ value, onChange, error }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) return;
    let active = true;
    setLoading(true);
    // Espera o usuário parar de digitar antes de buscar
    const timer = setTimeout(() => {
      customersApi
        .list(search.trim() || undefined)
        .then((list) => active && setResults(list))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, value]);

  if (value) {
    return (
      <div className="field">
        <span className="label">Cliente</span>
        <div className="picker-selected">
          <span>{value.name}</span>
          <button type="button" className="link link--sm" onClick={() => onChange(null)}>Trocar cliente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="field">
      <label className="label" htmlFor="customer-search">Cliente</label>
      <input
        id="customer-search"
        name="customer_id"
        className={`input ${error ? 'input--error' : ''}`}
        placeholder="Buscar cliente cadastrado..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoComplete="off"
      />
      <div className="picker-results">
        {loading && results.length === 0 && <div className="picker-empty">Buscando...</div>}
        {!loading && results.length === 0 && (
          <div className="picker-empty">
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        )}
        {results.slice(0, 5).map((c) => (
          <div key={c.customer_id} className="picker-item">
            <div>
              <div className="picker-item__name">{c.name}</div>
              <div className="picker-item__doc">
                {c.document_type ? `${c.document_type}: ${formatDocument(c.document_type, c.document_number)}` : 'Sem documento'}
              </div>
            </div>
            <button type="button" className="pill" onClick={() => onChange(c)}>Selecionar</button>
          </div>
        ))}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
