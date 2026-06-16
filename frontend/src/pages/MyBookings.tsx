import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Booking } from '../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface WaitlistEntry {
  _id: string;
  position: number;
  quantity: number;
  event: { _id: string; title: string; startDate: string; status: string } | null;
}

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{title}</h2>
      <span style={{
        background: color,
        color: '#fff',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 700,
        padding: '0.15rem 0.6rem',
      }}>{count}</span>
    </div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelMsg, setCancelMsg] = useState<Record<string, string>>({});

  function fetchAll() {
    setLoading(true);
    Promise.all([api.get('/bookings/my'), api.get('/waitlist/my')])
      .then(([bRes, wRes]) => {
        setBookings(bRes.data.data.bookings);
        setWaitlist(wRes.data.data.entries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleLeaveWaitlist(eventId: string) {
    try {
      await api.delete(`/waitlist/${eventId}`);
      setWaitlist((prev) => prev.filter((e) => e.event?._id !== eventId));
    } catch (err: any) {
      console.error(err);
    }
  }

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

  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-hero">
        <h1>Mina bokningar</h1>
        <p>{confirmed.length} bokningar totalt</p>
        <button className="btn btn-secondary btn-sm" onClick={fetchAll} style={{ marginTop: '0.5rem' }}>
          Uppdatera
        </button>
      </div>

      {/* ── 1. Bekräftade ── */}
      <section style={{ marginBottom: '2.5rem' }}>
        <SectionHeader title="Bekräftade bokningar" count={confirmed.length} color="var(--success)" />
        {confirmed.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Inga bekräftade bokningar.</p>
            <Link to="/events" className="btn btn-primary">Utforska events</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {confirmed.map((b) => (
              <div key={b._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {b.event ? (
                    <Link to={`/events/${b.event._id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {b.event.title}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-muted)' }}>Event borttaget</span>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    <span>📅 {b.event ? formatDate(b.event.startDate) : '–'}</span>
                    <span style={{ margin: '0 0.5rem' }}>·</span>
                    <span>🎟 {b.ticketTypeName} × {b.quantity}</span>
                    <span style={{ margin: '0 0.5rem' }}>·</span>
                    <span>{b.totalPrice === 0 ? 'Gratis' : `${b.totalPrice} kr`}</span>
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className="badge badge-green">Bekräftad</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b._id)}>
                  Avboka
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Väntelistan ── */}
      {waitlist.length > 0 && (
        <section style={{ marginBottom: '2.5rem' }}>
          <SectionHeader title="Väntelistan" count={waitlist.length} color="var(--warning)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {waitlist.map((w) => (
              <div key={w._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {w.event ? (
                    <Link to={`/events/${w.event._id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {w.event.title}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Event borttaget</span>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    {w.event && <span>📅 {formatDate(w.event.startDate)}</span>}
                  </div>
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-yellow">Väntelistan — plats {w.position}</span>
                    <span className="badge badge-gray">{w.quantity} {w.quantity === 1 ? 'plats' : 'platser'} efterfrågad{w.quantity === 1 ? '' : 'e'}</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleLeaveWaitlist(w.event!._id)}>
                  Lämna väntelistan
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Avbokade ── */}
      {cancelled.length > 0 && (
        <section>
          <SectionHeader title="Avbokade" count={cancelled.length} color="var(--text-muted)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
            {cancelled.map((b) => (
              <div key={b._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {b.event ? (
                    <Link to={`/events/${b.event._id}`} style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                      {b.event.title}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-muted)' }}>Event borttaget</span>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    <span>📅 {b.event ? formatDate(b.event.startDate) : '–'}</span>
                    <span style={{ margin: '0 0.5rem' }}>·</span>
                    <span>🎟 {b.ticketTypeName} × {b.quantity}</span>
                    <span style={{ margin: '0 0.5rem' }}>·</span>
                    <span>{b.totalPrice === 0 ? 'Gratis' : `${b.totalPrice} kr`}</span>
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>
                    <span className="badge badge-red">Avbokad</span>
                    {cancelMsg[b._id] && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--success)', marginLeft: '0.5rem' }}>{cancelMsg[b._id]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
