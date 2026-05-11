import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Venue, TicketType } from '../types';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    capacity: 100,
    status: 'published' as const,
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'Standard', price: 0, quantity: 100, sold: 0 },
  ]);

  useEffect(() => {
    api.get('/venues').then((r) => {
      setVenues(r.data.data.venues);
      if (r.data.data.venues.length > 0) {
        setForm((prev) => ({ ...prev, venue: r.data.data.venues[0]._id }));
      }
    });
  }, []);

  function updateTicket(idx: number, field: keyof TicketType, value: string | number) {
    setTicketTypes((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  function addTicketType() {
    setTicketTypes((prev) => [...prev, { name: '', price: 0, quantity: 10, sold: 0 }]);
  }

  function removeTicketType(idx: number) {
    setTicketTypes((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.post('/events', { ...form, ticketTypes });
      navigate(`/events/${r.data.data.event._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Kunde inte skapa event');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 700 }}>
      <div className="page-hero">
        <h1>Skapa nytt event</h1>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Titel</label>
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required maxLength={200} />
        </div>
        <div className="form-group">
          <label>Beskrivning</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required maxLength={5000} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Startdatum & tid</label>
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Slutdatum & tid</label>
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Lokal</label>
            <select value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} required>
              {venues.map((v) => (
                <option key={v._id} value={v._id}>{v.name} — {v.city}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Kapacitet</label>
            <input type="number" min={1} value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value, 10) }))} required />
          </div>
        </div>

        {/* Ticket types */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontWeight: 600 }}>Biljetttyper</label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTicketType}>+ Lägg till</button>
          </div>
          {ticketTypes.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input placeholder="Namn (t.ex. Standard)" value={t.name} onChange={(e) => updateTicket(i, 'name', e.target.value)} required />
              <input type="number" placeholder="Pris kr" min={0} value={t.price} onChange={(e) => updateTicket(i, 'price', parseInt(e.target.value, 10))} required />
              <input type="number" placeholder="Antal" min={1} value={t.quantity} onChange={(e) => updateTicket(i, 'quantity', parseInt(e.target.value, 10))} required />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTicketType(i)}>✕</button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Skapar...' : 'Skapa event'}
        </button>
      </form>
    </div>
  );
}
