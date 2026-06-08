import { useEffect, useState } from 'react';
import api from '../services/api';
import { Event } from '../types';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

export default function Events() {
  const { user } = useAuth();
  const isManager = user?.role === 'organizer' || user?.role === 'admin';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);

  function fetchEvents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (status) params.set('status', status);
    params.set('limit', '20');

    api.get(`/events?${params.toString()}`)
      .then((r) => {
        setEvents(r.data.data.events);
        setTotal(r.data.data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchEvents(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents();
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-hero">
        <h1>Alla events</h1>
        <p>{total} event hittades</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <input
          style={{ flex: '1 1 200px', padding: '0.6rem 0.9rem', border: '2px solid var(--border)', borderRadius: 8, fontSize: '0.95rem' }}
          placeholder="Sök event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          style={{ padding: '0.6rem 0.9rem', border: '2px solid var(--border)', borderRadius: 8 }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          title="Från datum"
        />
        <input
          type="date"
          style={{ padding: '0.6rem 0.9rem', border: '2px solid var(--border)', borderRadius: 8 }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          title="Till datum"
        />
        {isManager && (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '0.6rem 0.9rem', border: '2px solid var(--border)', borderRadius: 8, fontSize: '0.95rem', background: '#fff' }}
          >
            <option value="">Alla publicerade</option>
            <option value="cancelled">Inställda</option>
            <option value="draft">Utkast</option>
            <option value="completed">Avslutade</option>
          </select>
        )}
        <button type="submit" className="btn btn-primary">Sök</button>
      </form>

      {loading ? (
        <div className="spinner">Laddar events...</div>
      ) : events.length === 0 ? (
        <div className="spinner">Inga events hittades.</div>
      ) : (
        <div className="events-grid">
          {events.map((e) => <EventCard key={e._id} event={e} />)}
        </div>
      )}
    </div>
  );
}
