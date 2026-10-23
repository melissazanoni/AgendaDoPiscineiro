import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { Alert, Field } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';

/** Figma: "Esqueceu Senha — RN09" (formulário e tela de e-mail enviado) */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const { submitting, error, fieldErrors, run, clearOnChange } = useSubmit();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const res = await authApi.forgotPassword(email);
      setDevLink(res.resetLink ?? null);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="auth auth--no-header">
        <div className="auth-card auth-card--slim">
          <p className="auth-card__brand">Agenda do Piscineiro</p>
          <h1 className="title-lg" style={{ color: 'var(--navy)', marginTop: 44 }}>Verifique seu e-mail</h1>
          <p className="subtitle" style={{ marginTop: 8 }}>
            Se o e-mail informado estiver cadastrado, enviaremos um link para redefinir sua senha.
          </p>
          <div className="alert alert--success" style={{ marginTop: 32, textAlign: 'center', fontWeight: 600, fontSize: 14, padding: 18 }}>
            Link enviado
          </div>
          <p className="subtitle-sm" style={{ marginTop: 28 }}>Não recebeu? Verifique a pasta de spam.</p>

          {devLink && (
            <div className="alert alert--info" style={{ marginTop: 20 }}>
              <strong>Modo de desenvolvimento:</strong> o envio de e-mail ainda não está configurado.{' '}
              <a className="link link--sm" href={devLink}>Clique aqui para redefinir a senha</a>.
            </div>
          )}

          <Link to="/login" className="link" style={{ marginTop: 34 }}>← Voltar para o login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth auth--no-header">
      <form className="auth-card auth-card--slim" onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <p className="auth-card__brand">Agenda do Piscineiro</p>
        <h1 className="title-xl">Esqueceu sua senha?</h1>
        <p className="subtitle" style={{ marginTop: 6 }}>
          Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
        </p>

        <div className="form" style={{ marginTop: 28 }}>
          <Field
            label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com"
            value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email}
          />
          <Alert>{error && !Object.keys(fieldErrors).length ? error : null}</Alert>
          <button className="btn btn--blue btn--block" style={{ marginTop: 14, fontSize: 13, borderRadius: 12 }} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </div>

        <Link to="/login" className="link" style={{ marginTop: 32 }}>← Voltar para o login</Link>
      </form>
    </div>
  );
}
