import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Cabeçalho com o menu, usado em todas as telas internas. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <NavLink to="/" className="brand">Agenda do Piscineiro</NavLink>
          <nav className="nav" aria-label="Menu principal">
            <NavLink to="/" end className="nav__link">Início</NavLink>
            <NavLink to="/agenda" className="nav__link">Agenda</NavLink>
            <NavLink to="/clientes" className="nav__link">Clientes</NavLink>
            <NavLink to="/pagamentos" className="nav__link">Pagamentos</NavLink>
          </nav>
          <div className="user">
            <span>Olá, <span className="user__name">{user?.name.split(' ')[0]}</span></span>
            <button type="button" className="link link--sm" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

/** Cabeçalho simples das telas de login e cadastro. */
export function PublicHeader() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <span className="brand">Agenda do Piscineiro</span>
      </div>
    </header>
  );
}
