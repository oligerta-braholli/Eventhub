import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Event, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/reviews/event/${id}`),
    ]).then(([eRes, rRes]) => {
      setEvent(eRes.data.data.event);
      setReviews(rRes.data.data.reviews);
      setAvgRating(rRes.data.data.avgRating);
      if (eRes.data.data.event.ticketTypes.length > 0) {
        setSelectedTicket(eRes.data.data.event.ticketTypes[0].name);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleBook() {
    if (!user) { navigate('/login'); return; }
    setBookingLoading(true);
    setBookingMsg('');
    try {
      await api.post('/bookings', { eventId: id, ticketTypeName: selectedTicket, quantity });
      setBookingMsg('Bokning bekräftad!');
      const r = await api.get(`/events/${id}`);
      setEvent(r.data.data.event);
    } catch (err: any) {
      setBookingMsg(err.response?.data?.message ?? 'Bokningsfel');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleJoinWaitlist() {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/waitlist/${id}`);
      setBookingMsg('Du är nu på väntelistan!');
    } catch (err: any) {
      setBookingMsg(err.response?.data?.message ?? 'Fel vid väntelisteregistrering');
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewMsg('');
    try {
      await api.post('/reviews', { eventId: id, rating: reviewRating, comment: reviewComment });
      setReviewMsg('Tack för din recension!');
      const r = await api.get(`/reviews/event/${id}`);
      setReviews(r.data.data.reviews);
      setAvgRating(r.data.data.avgRating);
      setReviewComment('');
    } catch (err: any) {
      setReviewMsg(err.response?.data?.message ?? 'Kunde inte spara recension');
    }
  }

  if (loading) return <div className="spinner">Laddar...</div>;
  if (!event) return <div className="spinner">Event hittades inte.</div>;

  const ticketType = event.ticketTypes.find((t) => t.name === selectedTicket);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Left */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            {event.status === 'published' && !event.isFull && <span className="badge badge-green">Platser kvar: {event.availableSpots}</span>}
            {event.isFull && <span className="badge badge-yellow">Fullbokat</span>}
            {event.status === 'completed' && <span className="badge badge-gray">Genomfört</span>}
            {event.status === 'cancelled' && <span className="badge badge-red">Inställt</span>}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{event.title}</h1>

          {avgRating !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <StarRating value={Math.round(avgRating)} readOnly />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {avgRating.toFixed(1)} ({reviews.length} recensioner)
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <span>📅 {formatDate(event.startDate)} – {formatDate(event.endDate)}</span>
            {event.venue && <span>📍 {event.venue.name}, {event.venue.address}, {event.venue.city}</span>}
            <span>👤 Arrangör: {event.organizer?.name}</span>
          </div>

          <p style={{ lineHeight: 1.8, marginBottom: '2rem' }}>{event.description}</p>

          {/* Reviews */}
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Recensioner</h2>

          {event.status === 'completed' && user?.role === 'participant' && (
            <form onSubmit={handleReview} className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Lämna din recension</h3>
              <div style={{ marginBottom: '0.75rem' }}>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="form-group">
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Berätta om din upplevelse..."
                  required
                  maxLength={1000}
                />
              </div>
              {reviewMsg && <div className={`alert ${reviewMsg.startsWith('Tack') ? 'alert-success' : 'alert-error'}`}>{reviewMsg}</div>}
              <button type="submit" className="btn btn-primary btn-sm">Skicka recension</button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Inga recensioner ännu.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((r) => (
                <div key={r._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong>{r.author.name}</strong>
                    <StarRating value={r.rating} readOnly />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — booking panel */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>Boka biljett</h3>

          {event.status === 'published' && (
            <>
              <div className="form-group">
                <label>Biljetttyp</label>
                <select value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)}>
                  {event.ticketTypes.map((t) => (
                    <option key={t.name} value={t.name} disabled={t.sold >= t.quantity}>
                      {t.name} — {t.price === 0 ? 'Gratis' : `${t.price} kr`} ({t.quantity - t.sold} kvar)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Antal</label>
                <input type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} />
              </div>
              {ticketType && (
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Totalt</span>
                    <strong>{ticketType.price === 0 ? 'Gratis' : `${ticketType.price * quantity} kr`}</strong>
                  </div>
                </div>
              )}
              {bookingMsg && (
                <div className={`alert ${bookingMsg.includes('bekräftad') || bookingMsg.includes('väntelista') ? 'alert-success' : 'alert-error'}`}>
                  {bookingMsg}
                </div>
              )}
              {!event.isFull ? (
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleBook} disabled={bookingLoading}>
                  {bookingLoading ? 'Bokar...' : 'Boka nu'}
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleJoinWaitlist}>
                  Gå med i väntelistan
                </button>
              )}
              {!user && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
                  Du behöver <a href="/login" style={{ color: 'var(--primary)' }}>logga in</a> för att boka.
                </p>
              )}
            </>
          )}

          {event.status === 'cancelled' && (
            <p style={{ color: 'var(--danger)', textAlign: 'center' }}>Detta event är inställt.</p>
          )}
          {event.status === 'completed' && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Detta event har genomförts.</p>
          )}
        </div>
      </div>
    </div>
  );
}
