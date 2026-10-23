// Componentes visuais reutilizados em várias telas.
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

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
