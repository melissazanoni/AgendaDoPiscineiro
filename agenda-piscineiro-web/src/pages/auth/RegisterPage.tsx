import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Alert, Field } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';

/** Figma: "1.1 Cadastro" */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submitting, error, fieldErrors, run, clearOnChange } = useSubmit();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await register(name, email, password);
      navigate('/', { replace: true });
    });
  }

  return (
    <div className="auth auth--no-header" style={{ paddingTop: 115 }}>
      <form className="auth-card" style={{ minHeight: 650 }} onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <div className="auth-card__header" style={{ marginBottom: 66 }}>
          <h1 className="title-xl">Criar conta</h1>
          <p className="subtitle">Cadastre-se para começar a organizar seus serviços.</p>
        </div>

        <div className="form">
          <Field
            label="Nome" name="name" autoComplete="name" placeholder="Digite seu nome"
            value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name}
          />
          <Field
            label="E-mail" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail"
            value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email}
          />
          <Field
            label="Senha" name="password" type="password" autoComplete="new-password"
            placeholder="Crie uma senha (mínimo 6 caracteres)"
            value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password}
          />

          <Alert>{error && !Object.keys(fieldErrors).length ? error : null}</Alert>

          <button className="btn btn--navy btn--block" style={{ marginTop: 12 }} disabled={submitting}>
            {submitting ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: 30 }}>
          <span>Já possui uma conta?</span>
          <Link to="/login" className="link link--sm">Entrar</Link>
        </div>
      </form>
    </div>
  );
}
