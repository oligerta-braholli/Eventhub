import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';

interface CalendarDay {
  date: string;
  events: Event[];
}

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const MONTHS = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

function getFirstWeekdayOfMonth(year: number, month: number): number {
  // Returns 0=Mon … 6=Sun
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = getDaysInMonth(year, month);
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    api.get(`/events/calendar?from=${from}&to=${to}`)
      .then((r) => setDays(r.data.data.days))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const eventsByDate: Record<string, Event[]> = {};
  for (const d of days) eventsByDate[d.date] = d.events;

  const firstWeekday = getFirstWeekdayOfMonth(year, month);
  const totalDays = getDaysInMonth(year, month);
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-hero">
        <h1>Kalender</h1>
        <p>Events per dag och månad</p>
      </div>

      {/* Month navigation */}
      <div className="cal-nav">
        <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← Föregående</button>
        <h2 className="cal-month-title">{MONTHS[month]} {year}</h2>
        <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Nästa →</button>
      </div>

      {loading ? (
        <div className="spinner">Laddar kalender...</div>
      ) : (
        <div className="cal-grid">
          {/* Weekday headers */}
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="cal-weekday">{wd}</div>
          ))}

          {/* Empty cells before month starts */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />
          ))}

          {/* Day cells */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;

            return (
              <div key={dateStr} className={`cal-cell${isToday ? ' cal-cell--today' : ''}`}>
                <span className="cal-day-num">{dayNum}</span>
                <div className="cal-events">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev._id}
                      className="cal-event-pill"
                      onClick={() => navigate(`/events/${ev._id}`)}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
