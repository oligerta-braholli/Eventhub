import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Venue, TicketType } from '../types';

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    capacity: 100,
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get('/venues'),
    ]).then(([eRes, vRes]) => {
      const ev = eRes.data.data.event;
      setVenues(vRes.data.data.venues);
      setForm({
        title: ev.title,
        description: ev.description,
        venue: ev.venue._id,
        startDate: toLocalDatetime(ev.startDate),
        endDate: toLocalDatetime(ev.endDate),
        capacity: ev.capacity,
      });
      setTicketTypes(ev.ticketTypes.map((t: TicketType) => ({
        name: t.name,
        price: t.price,
        quantity: t.quantity,
        sold: t.sold,
      })));
    }).catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  function toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

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
    setSaving(true);
    try {
      await api.put(`/events/${id}`, { ...form, ticketTypes });
      navigate(`/events/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Kunde inte spara ändringar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="spinner">Laddar event...</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 700 }}>
      <div className="page-hero">
        <h1>Redigera event</h1>
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

        {/* Biljetttyper */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <label style={{ fontWeight: 600 }}>Biljetttyper</label>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTicketType}>+ Lägg till</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Namn</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pris (kr)</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Antal</span>
            <span />
          </div>
          {ticketTypes.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input placeholder="t.ex. Standard" value={t.name} onChange={(e) => updateTicket(i, 'name', e.target.value)} required />
              <input type="number" min={0} value={t.price} onChange={(e) => updateTicket(i, 'price', parseInt(e.target.value, 10))} required />
              <input type="number" min={1} value={t.quantity} onChange={(e) => updateTicket(i, 'quantity', parseInt(e.target.value, 10))} required />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTicketType(i)}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/events/${id}`)}>
            Avbryt
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={saving}>
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </div>
      </form>
    </div>
  );
}
