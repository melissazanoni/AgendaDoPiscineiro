import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PublicHeader } from '../../components/AppLayout';
import { Alert, Field } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';

/** Figma: "1 - Login" */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submitting, error, fieldErrors, run, clearOnChange } = useSubmit();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/', { replace: true });
    });
  }

  return (
    <>
      <PublicHeader />
      <div className="auth">
        <form className="auth-card" onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
          <div className="auth-card__header">
            <h1 className="title-xl">Entrar</h1>
            <p className="subtitle">Acesse sua agenda e organize seus serviços.</p>
          </div>

          <div className="form">
            <Field
              label="E-mail" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail"
              value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email}
            />
            <div>
              <Field
                label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Digite sua senha"
                value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password}
              />
              <Link to="/esqueci-senha" className="link link--sm" style={{ marginTop: 10 }}>Esqueceu sua senha?</Link>
            </div>

            <Alert>{error && !Object.keys(fieldErrors).length ? error : null}</Alert>

            <button className="btn btn--navy btn--block" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="auth-footer">
            <span>Ainda não possui uma conta?</span>
            <Link to="/cadastro" className="link link--sm">Cadastre-se</Link>
          </div>
          <Link to="/cadastro" className="soft-button">Cadastre-se</Link>
        </form>
      </div>
    </>
  );
}
