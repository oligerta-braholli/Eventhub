import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Booking } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelMsg, setCancelMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/bookings/my')
      .then((r) => setBookings(r.data.data.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: string) {
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
      setCancelMsg((prev) => ({ ...prev, [id]: 'Avbokad' }));
    } catch (err: any) {
      setCancelMsg((prev) => ({ ...prev, [id]: err.response?.data?.message ?? 'Fel' }));
    }
  }

  if (loading) return <div className="spinner">Laddar bokningar...</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-hero">
        <h1>Mina bokningar</h1>
        <p>{bookings.length} bokningar totalt</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Du har inga bokningar ännu.</p>
          <Link to="/events" className="btn btn-primary">Utforska events</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((b) => (
            <div key={b._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <Link to={`/events/${b.event._id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                  {b.event.title}
                </Link>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                  <span>📅 {formatDate(b.event.startDate)}</span>
                  <span style={{ margin: '0 0.5rem' }}>·</span>
                  <span>🎟 {b.ticketTypeName} × {b.quantity}</span>
                  <span style={{ margin: '0 0.5rem' }}>·</span>
                  <span>{b.totalPrice === 0 ? 'Gratis' : `${b.totalPrice} kr`}</span>
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                    {b.status === 'confirmed' ? 'Bekräftad' : 'Avbokad'}
                  </span>
                </div>
                {cancelMsg[b._id] && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.4rem' }}>{cancelMsg[b._id]}</div>
                )}
              </div>
              {b.status === 'confirmed' && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b._id)}>
                  Avboka
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
