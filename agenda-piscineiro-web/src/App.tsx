import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { GuestOnly, RequireAuth } from './components/RequireAuth';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { ServiceDetailsPage } from './pages/agenda/ServiceDetailsPage';
import { ServiceFormPage } from './pages/agenda/ServiceFormPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { CustomerDetailsPage } from './pages/customers/CustomerDetailsPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { PoolFormPage } from './pages/customers/PoolFormPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewPaymentPage } from './pages/payments/NewPaymentPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Telas públicas */}
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/cadastro" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

          {/* Telas internas: exigem login (RN09) */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<DashboardPage />} />

            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/novo" element={<ServiceFormPage />} />
            <Route path="/agenda/:id" element={<ServiceDetailsPage />} />
            <Route path="/agenda/:id/editar" element={<ServiceFormPage />} />

            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/clientes/novo" element={<CustomerFormPage />} />
            <Route path="/clientes/:id" element={<CustomerDetailsPage />} />
            <Route path="/clientes/:id/editar" element={<CustomerFormPage />} />
            <Route path="/clientes/:customerId/piscinas/nova" element={<PoolFormPage />} />
            <Route path="/piscinas/:id/editar" element={<PoolFormPage />} />

            <Route path="/pagamentos" element={<PaymentsPage />} />
            <Route path="/pagamentos/novo" element={<NewPaymentPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
