import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { chargesApi, customersApi } from '../../api/endpoints';
import type { ChargeFrequency, Customer } from '../../api/types';
import { CustomerPicker } from '../../components/CustomerPicker';
import { Alert, DateField, Field, RadioGroup } from '../../components/ui';
import { useSubmit } from '../../hooks/useForm';
import { parseMoney } from '../../utils/format';

type YesNo = 'sim' | 'nao';

/** Figma: "2.3.1 Novo Pagamento" (RF07) */
export function NewPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const presetCustomerId = (location.state as { customerId?: number } | null)?.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurring, setRecurring] = useState<YesNo>('nao');
  const [frequency, setFrequency] = useState<ChargeFrequency | ''>('');
  const { submitting, error, fieldErrors, setFieldErrors, run, clearOnChange } = useSubmit();

  // Veio da tela de pagamentos já filtrada por um cliente
  useEffect(() => {
    if (presetCustomerId) customersApi.get(presetCustomerId).then(setCustomer).catch(() => {});
  }, [presetCustomerId]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const value = parseMoney(amount);
    if (!customer) errors.customer_id = 'Selecione um cliente.';
    if (value === null) errors.amount = 'Informe o valor.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    run(async () => {
      await chargesApi.create({
        customer_id: customer!.customer_id,
        amount: value!,
        due_date: dueDate,
        is_recurring: recurring === 'sim',
        recurrence_frequency: recurring === 'sim' ? frequency || null : null,
      });
      navigate(`/pagamentos?cliente=${customer!.customer_id}`, { state: { flash: 'Cobrança registrada.' } });
    });
  }

  return (
    <div className="page page--medium">
      <h1 className="title-lg">Pagamentos e Mensalidades</h1>

      <form className="form" style={{ marginTop: 46 }} onSubmit={handleSubmit} onChange={clearOnChange} noValidate>
        <CustomerPicker value={customer} onChange={setCustomer} error={fieldErrors.customer_id} />

        <div className="form-narrow">
          <Field
            label="Valor do Serviço / Mensalidade (R$)" name="amount" inputMode="decimal" placeholder="Ex: 130,00"
            value={amount} onChange={(e) => setAmount(e.target.value)} error={fieldErrors.amount}
          />
          <DateField
            label="Data da Cobrança" name="due_date"
            value={dueDate} onChange={setDueDate} error={fieldErrors.due_date}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <RadioGroup<YesNo>
            label="Cobrança Recorrente?" name="is_recurring" value={recurring} onChange={setRecurring}
            options={[{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }]}
          />
        </div>

        {recurring === 'sim' && (
          <div style={{ marginTop: 20 }}>
            <RadioGroup<ChargeFrequency | ''>
              label="Recorrência:" name="recurrence_frequency" value={frequency} onChange={setFrequency}
              error={fieldErrors.recurrence_frequency}
              options={[{ value: 'mensal', label: 'Mensal' }, { value: 'quinzenal', label: 'Quinzenal' }]}
            />
          </div>
        )}

        <Alert>{error}</Alert>

        <button className="btn btn--navy btn--block" style={{ marginTop: 120, borderRadius: 12 }} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </button>
        <Link to="/pagamentos" className="link link--sm">← Cancelar e voltar</Link>
      </form>
    </div>
  );
}
