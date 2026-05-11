import { useEffect, useState } from 'react';
import api from '../services/api';
import { Event } from '../types';
import EventCard from '../components/EventCard';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [total, setTotal] = useState(0);

  function fetchEvents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
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

      {/* Filters */}
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
        <button type="submit" className="btn btn-primary">Sök</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setFrom(''); setTo(''); setTimeout(fetchEvents, 0); }}>
          Rensa
        </button>
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
