import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import EventCard from '../components/EventCard';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events?limit=6')
      .then((r) => setEvents(r.data.data.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
        color: '#fff',
        padding: '5rem 0',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2 }}>
            Välkommen till EventHub
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>
            Hitta, boka och hantera evenemang — enkelt och säkert.
          </p>
          <Link to="/events" className="btn btn-primary" style={{ background: '#fff', color: 'var(--primary)', fontSize: '1.05rem', padding: '0.8rem 2rem' }}>
            Utforska events →
          </Link>
        </div>
      </section>

      {/* Upcoming events */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Kommande events</h2>
            <Link to="/events" className="btn btn-secondary btn-sm">Se alla</Link>
          </div>
          {loading ? (
            <div className="spinner">Laddar...</div>
          ) : (
            <div className="events-grid">
              {events.map((e) => <EventCard key={e._id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section style={{ background: '#fff', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>
            Allt du behöver
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🎟️', title: 'Enkel bokning', desc: 'Boka biljetter på sekunder med kapacitetskontroll i realtid.' },
              { icon: '📋', title: 'Väntelista', desc: 'Missa aldrig ett populärt event — hamna på väntelistan automatiskt.' },
              { icon: '⭐', title: 'Recensioner', desc: 'Dela din upplevelse och hjälp andra hitta de bästa eventen.' },
              { icon: '🔒', title: 'GDPR-säkert', desc: 'Dina data skyddas och du kan begära anonymisering när som helst.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
