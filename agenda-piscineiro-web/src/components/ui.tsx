// Componentes visuais reutilizados em várias telas.
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { formatDate, maskDate, parseBrDate } from '../utils/format';

// ---------- Campo de texto com rótulo e erro ----------
type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`input ${error ? 'input--error' : ''}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ---------- Campo de data (sempre DD/MM/AAAA, independente do idioma do navegador) ----------
type DateFieldProps = {
  label: string;
  name: string;
  /** Valor no formato da API: 'AAAA-MM-DD' ('' se vazio ou incompleto). */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function DateField({ label, name, value, onChange, min, max, error, required, disabled, className }: DateFieldProps) {
  const [text, setText] = useState(value ? formatDate(value) : '');
  const [localError, setLocalError] = useState<string | undefined>();
  const lastEmitted = useRef(value);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Valor alterado de fora (ex.: carregamento na edição)
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(value ? formatDate(value) : '');
      setLocalError(undefined);
    }
  }, [value]);

  const emit = (iso: string) => {
    lastEmitted.current = iso;
    onChange(iso);
  };

  const handleText = (raw: string) => {
    const masked = maskDate(raw);
    setText(masked);
    setLocalError(undefined);
    emit(parseBrDate(masked));
  };

  const handleBlur = () => {
    if (text && !parseBrDate(text)) setLocalError('Data inválida (use DD/MM/AAAA).');
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); }
  };

  const shownError = localError ?? error;
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="date-input">
        <input
          id={name} name={name} type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10}
          autoComplete="off" required={required} disabled={disabled}
          className={`input ${shownError ? 'input--error' : ''}`} aria-invalid={Boolean(shownError)}
          value={text} onChange={(e) => handleText(e.target.value)} onBlur={handleBlur}
        />
        <button type="button" className="date-input__btn" onClick={openPicker} disabled={disabled}
          aria-label={`Abrir calendário: ${label}`}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <rect x="2" y="3.5" width="14" height="12.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 7.5h14M6 1.8v3.4M12 1.8v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <input
          ref={pickerRef} type="date" name={name} className="date-input__picker" tabIndex={-1} aria-hidden="true"
          min={min} max={max} value={value}
          onChange={(e) => { setText(e.target.value ? formatDate(e.target.value) : ''); setLocalError(undefined); emit(e.target.value); }}
        />
      </div>
      {shownError && <span className="field-error">{shownError}</span>}
    </div>
  );
}

// ---------- Lista suspensa ----------
type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
};

export function SelectField({ label, error, placeholder, options, id, className, ...props }: SelectFieldProps) {
  const selectId = id ?? props.name;
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="label" htmlFor={selectId}>{label}</label>
      <select id={selectId} className={`select ${error ? 'input--error' : ''}`} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ---------- Grupo de opções (● Sim  ○ Não) ----------
type RadioGroupProps<T extends string> = {
  label?: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  error?: string;
};

export function RadioGroup<T extends string>({ label, name, value, onChange, options, disabled, error }: RadioGroupProps<T>) {
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
      {label && <legend className="label">{label}</legend>}
      <div className="radio-group">
        {options.map((o) => (
          <label key={o.value} className="radio">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={disabled}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <span className="field-error">{error}</span>}
    </fieldset>
  );
}

// ---------- Avisos ----------
export function Alert({ type = 'error', children }: { type?: 'error' | 'success' | 'info'; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

// ---------- Carregando / erro / vazio ----------
export function Loading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="state">
      <div className="spinner" />
      {text}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state">{children}</div>;
}

// ---------- Ícones (desenhados a partir do protótipo) ----------
export function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return (
    <svg width="27" height="16" viewBox="0 0 27 16" aria-hidden="true"
      style={{ transform: direction === 'left' ? 'scaleX(-1)' : undefined }}>
      <path d="M1 8h24M18 1.5 25 8l-7 6.5" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="10.5" cy="7.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.6 11.4 2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
