import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import { Alert, Field } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';

/** Tela aberta pelo link do e-mail (não existe no Figma; segue o estilo de "Esqueceu Senha"). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const { submitting, error, fieldErrors, setFieldErrors, run, clearOnChange } = useSubmit();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setFieldErrors({ confirm: 'As senhas não são iguais.' });
      return;
    }
    run(async () => {
      await authApi.resetPassword(token, password);
      setDone(true);
    });
  }

  return (
    <div className="auth auth--no-header">
      <form className="auth-card auth-card--slim" onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <p className="auth-card__brand">Agenda do Piscineiro</p>
        <h1 className="title-xl">Nova senha</h1>

        {done ? (
          <>
            <div className="alert alert--success" style={{ marginTop: 28 }}>
              Senha alterada com sucesso. Faça login com a nova senha.
            </div>
            <Link to="/login" className="btn btn--navy btn--block" style={{ marginTop: 24 }}>Ir para o login</Link>
          </>
        ) : !token ? (
          <div style={{ marginTop: 28 }}>
            <Alert>Link inválido. Solicite um novo link de recuperação.</Alert>
          </div>
        ) : (
          <>
            <p className="subtitle" style={{ marginTop: 6 }}>Crie uma nova senha para acessar sua agenda.</p>
            <div className="form" style={{ marginTop: 28 }}>
              <Field
                label="Nova senha" name="password" type="password" autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password}
              />
              <Field
                label="Confirmar senha" name="confirm" type="password" autoComplete="new-password"
                placeholder="Digite a senha novamente"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} error={fieldErrors.confirm}
              />
              <Alert>{error && !Object.keys(fieldErrors).length ? error : null}</Alert>
              <button className="btn btn--blue btn--block" style={{ marginTop: 14 }} disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>
          </>
        )}

        {!done && <Link to="/esqueci-senha" className="link" style={{ marginTop: 32 }}>Solicitar novo link</Link>}
      </form>
    </div>
  );
}
