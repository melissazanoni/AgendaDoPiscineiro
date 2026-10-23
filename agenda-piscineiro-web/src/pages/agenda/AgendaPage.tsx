import { useState } from 'react';
import { Link } from 'react-router-dom';
import { servicesApi } from '../../api/endpoints';
import type { Service } from '../../api/types';
import { Alert, ArrowIcon, Loading } from '../../components/ui';
import { useFlash } from '../../hooks/useFlash';
import { useLoad } from '../../hooks/useLoad';
import { addDaysIso, formatDate, todayIso, weekdayName } from '../../utils/format';

const VISIBLE_DAYS = 4; // 3 colunas inteiras + o começo da 4ª, como no protótipo

/** Figma: "2.1 Agenda" (RF06) */
export function AgendaPage() {
  const today = todayIso();
  const flash = useFlash();
  const [offset, setOffset] = useState(0); // quantos dias a partir de hoje
  const start = addDaysIso(today, offset);
  const end = addDaysIso(start, VISIBLE_DAYS - 1);

  const { data, loading, error } = useLoad(() => servicesApi.list({ from: start, to: end }), [start, end]);

  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDaysIso(start, i));
  const byDay = (day: string): Service[] =>
    (data ?? []).filter((s) => s.scheduled_date === day && s.status !== 'cancelado');

  return (
    <div className="page agenda-page">
      <h1 className="title-lg" style={{ color: 'var(--navy)', fontSize: 26 }}>Agenda</h1>

      <div className="agenda-toolbar">
        <Link to="/agenda/novo" className="btn btn--blue agenda-new">Novo serviço</Link>
        {offset > 0 && (
          <button type="button" className="link" onClick={() => setOffset(0)}>Voltar para hoje</button>
        )}
      </div>

      {flash && <div style={{ marginBottom: 16 }}><Alert type="success">{flash}</Alert></div>}
      {error && <Alert>{error}</Alert>}

      <div className="agenda">
        {offset > 0 && (
          <button
            type="button" className="agenda__nav agenda__nav--prev"
            onClick={() => setOffset((o) => Math.max(0, o - 1))} aria-label="Dia anterior"
          >
            <ArrowIcon direction="left" />
          </button>
        )}

        <div className="agenda__days">
          {days.map((day) => {
            const label = day === today ? 'Hoje' : day === addDaysIso(today, 1) ? 'Amanhã' : null;
            const services = byDay(day);
            return (
              <section key={day} className="day" aria-label={`${weekdayName(day)}, ${formatDate(day)}`}>
                <header className="day__header">
                  <span className="day__label">{label ?? ' '}</span>
                  <h2 className="day__weekday">{weekdayName(day)}</h2>
                  <p className="day__date">{formatDate(day)}</p>
                </header>

                {loading ? (
                  <Loading text="" />
                ) : services.length === 0 ? (
                  <p className="day__empty">Nenhum serviço agendado.</p>
                ) : (
                  <div className="day__list">
                    {services.map((s) => (
                      <Link key={s.service_id} to={`/agenda/${s.service_id}`} className="service-card">
                        <div className="service-card__top">
                          <span className="service-card__time">{s.scheduled_time}</span>
                          {s.status === 'concluido' && <span className="tag tag--concluido">Concluído</span>}
                        </div>
                        <p className="service-card__title">{s.description}</p>
                        <p className="service-card__customer">{s.customer_name}</p>
                        <p className="service-card__pool">{s.pool_description}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <button
          type="button" className="agenda__nav agenda__nav--next"
          onClick={() => setOffset((o) => o + 1)} aria-label="Próximo dia"
        >
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
