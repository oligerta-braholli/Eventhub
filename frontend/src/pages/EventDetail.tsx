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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [justBooked, setJustBooked] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [waitlistQuantity, setWaitlistQuantity] = useState<number>(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const [statusMsg, setStatusMsg] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setAlreadyBooked(false);
    setBookingMsg('');
    setLoading(true);

    const requests: Promise<any>[] = [
      api.get(`/events/${id}`),
      api.get(`/reviews/event/${id}`),
    ];
    if (user?.role === 'participant') {
      requests.push(api.get('/bookings/my'));
      requests.push(api.get('/waitlist/my'));
    }

    Promise.all(requests).then(([eRes, rRes, bRes, wRes]) => {
      if (cancelled) return;
      setEvent(eRes.data.data.event);
      setReviews(rRes.data.data.reviews);
      setAvgRating(rRes.data.data.avgRating);
      if (eRes.data.data.event.ticketTypes.length > 0) {
        setSelectedTicket(eRes.data.data.event.ticketTypes[0].name);
      }
      if (bRes) {
        const hasBooking = bRes.data.data.bookings.some(
          (b: any) => (String(b.event?._id) === id || String(b.event?.id) === id) && b.status === 'confirmed'
        );
        setAlreadyBooked(hasBooking);
      }
      if (wRes) {
        const myEntry = wRes.data.data.entries.find(
          (e: any) => String(e.event?._id) === id || String(e.event?.id) === id
        );
        setWaitlistPosition(myEntry ? myEntry.position : null);
        setWaitlistQuantity(myEntry ? myEntry.quantity : 1);
      }
    }).catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, user, authLoading]);

  async function handleBook() {
    if (!user) { navigate('/login'); return; }
    setBookingLoading(true);
    setBookingMsg('');
    try {
      await api.post('/bookings', { eventId: id, ticketTypeName: selectedTicket, quantity });
      setAlreadyBooked(true);
      setJustBooked(true);
      setShowPaymentForm(false);
      setCardData({ number: '', name: '', expiry: '', cvc: '' });
      setBookingMsg(`Din bokning är bekräftad! Du har bokat ${quantity} ${quantity === 1 ? 'plats' : 'platser'} (${selectedTicket}).`);
      const r = await api.get(`/events/${id}`);
      setEvent(r.data.data.event);
    } catch (err: any) {
      const msg: string = err.response?.data?.message ?? 'Bokningsfel';
      const responseStatus: string = err.response?.data?.status ?? '';
      if (err.response?.status === 409 && responseStatus !== 'waitlisted' && msg.includes('redan')) {
        setAlreadyBooked(true);
      } else {
        setBookingMsg(msg);
      }
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleJoinWaitlist() {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await api.post(`/waitlist/${id}`, { quantity });
      setWaitlistPosition(res.data.data.entry.position);
      setWaitlistQuantity(quantity);
      setBookingMsg('');
    } catch (err: any) {
      setBookingMsg(err.response?.data?.message ?? 'Fel vid väntelisteregistrering');
    }
  }

  async function handlePartialBookAndWaitlist() {
    if (!user) { navigate('/login'); return; }
    setBookingLoading(true);
    setBookingMsg('');
    const available = event!.availableSpots;
    const waitlistQty = quantity - available;
    try {
      await api.post('/bookings', { eventId: id, ticketTypeName: selectedTicket, quantity: available });
      const wRes = await api.post(`/waitlist/${id}`, { quantity: waitlistQty });
      setAlreadyBooked(true);
      setJustBooked(true);
      setWaitlistPosition(wRes.data.data.entry.position);
      setWaitlistQuantity(waitlistQty);
      const r = await api.get(`/events/${id}`);
      setEvent(r.data.data.event);
    } catch (err: any) {
      setBookingMsg(err.response?.data?.message ?? 'Fel');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleLeaveWaitlist() {
    try {
      await api.delete(`/waitlist/${id}`);
      setWaitlistPosition(null);
      setBookingMsg('');
    } catch (err: any) {
      setBookingMsg(err.response?.data?.message ?? 'Kunde inte lämna väntelistan');
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Är du säker på att du vill radera "${event?.title}"? Detta går inte att ångra.`)) return;
    try {
      await api.delete(`/events/${id}`);
      navigate('/events');
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message ?? 'Kunde inte radera eventet');
    }
  }

  async function handleStatusChange(status: 'completed' | 'cancelled' | 'published') {
    setStatusLoading(true);
    setStatusMsg('');
    try {
      await api.patch(`/events/${id}/status`, { status });
      const r = await api.get(`/events/${id}`);
      setEvent(r.data.data.event);
      setStatusMsg(
        status === 'completed' ? 'Eventet markerat som genomfört.' :
        status === 'cancelled' ? 'Eventet avbokat.' :
        'Eventet återpublicerat.'
      );
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message ?? 'Kunde inte ändra status');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!window.confirm('Är du säker på att du vill radera recensionen?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleUpdateReview(reviewId: string) {
    try {
      const res = await api.patch(`/reviews/${reviewId}`, { rating: editRating, comment: editComment });
      const updated = res.data.data.review;
      setReviews((prev) => {
        const newReviews = prev.map((r) => r._id === reviewId ? updated : r);
        const avg = newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;
        setAvgRating(avg);
        return newReviews;
      });
      setEditingReviewId(null);
    } catch (err: any) {
      console.error(err);
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
  const totalTicketTypeAvailable = event.ticketTypes.reduce(
    (sum, t) => sum + Math.max(0, t.quantity - t.sold),
    0
  );
  const eventHasSpots = event.availableSpots > 0;
  const isSoldOut = !eventHasSpots || totalTicketTypeAvailable === 0;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Left */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            {event.status === 'published' && !isSoldOut && <span className="badge badge-green">Platser kvar: {event.availableSpots}</span>}
            {isSoldOut && <span className="badge badge-yellow">Fullbokat</span>}
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
              {reviews.map((r) => {
                const isAuthor = r.author._id === user?._id;
                const isAdmin = user?.role === 'admin';
                const isEditing = editingReviewId === r._id;

                return (
                  <div key={r._id} className="card">
                    {isEditing ? (
                      <>
                        <StarRating value={editRating} onChange={(v) => setEditRating(v)} />
                        <textarea
                          rows={3}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          maxLength={1000}
                          style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', border: '2px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleUpdateReview(r._id)}>Spara</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingReviewId(null)}>Avbryt</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <strong>{r.author.name}</strong>
                          <StarRating value={r.rating} readOnly />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(r.createdAt).toLocaleDateString('sv-SE')}
                          </span>
                          {(isAuthor || isAdmin) && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {isAuthor && (
                                <button className="btn btn-secondary btn-sm" onClick={() => { setEditingReviewId(r._id); setEditRating(r.rating); setEditComment(r.comment); }}>
                                  Redigera
                                </button>
                              )}
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteReview(r._id)}>
                                Radera
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
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
                  {ticketType.price > 0 && showPaymentForm && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>💳 Kortuppgifter</span>
                        <button type="button" onClick={() => { setShowPaymentForm(false); setCardError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Avbryt</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Kortnummer</label>
                          <input
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            value={cardData.number}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                              const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                              setCardData((p) => ({ ...p, number: formatted }));
                            }}
                            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Kortinnehavarens namn</label>
                          <input
                            placeholder=""
                            value={cardData.name}
                            onChange={(e) => setCardData((p) => ({ ...p, name: e.target.value }))}
                            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Giltig till</label>
                            <input
                              placeholder="MM/ÅÅ"
                              maxLength={5}
                              value={cardData.expiry}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                const formatted = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
                                setCardData((p) => ({ ...p, expiry: formatted }));
                              }}
                              style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ width: '80px' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CVC</label>
                            <input
                              placeholder="123"
                              maxLength={3}
                              value={cardData.cvc}
                              onChange={(e) => setCardData((p) => ({ ...p, cvc: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                              style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        {cardError && <div style={{ color: 'red', fontSize: '0.85rem' }}>{cardError}</div>}
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          🔒 Säker betalning
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {bookingMsg && !alreadyBooked && (
                <div className={`alert ${bookingMsg.includes('väntelista') ? 'alert-success' : 'alert-error'}`}>
                  {bookingMsg}
                </div>
              )}
              {alreadyBooked && waitlistPosition !== null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="alert alert-success" style={{ margin: 0 }}>
                    {justBooked
                      ? `✓ Bokade ${quantity - waitlistQuantity} platser! ${waitlistQuantity} platser läggs på väntelistan (plats ${waitlistPosition}).`
                      : `Du har en bokning + väntelistan plats ${waitlistPosition} för ${waitlistQuantity} ${waitlistQuantity === 1 ? 'plats' : 'platser'}.`}
                  </div>
                  <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLeaveWaitlist}>
                    Lämna väntelistan
                  </button>
                </div>
              ) : alreadyBooked ? (
                <div className="alert alert-success" style={{ textAlign: 'center' }}>
                  {justBooked ? bookingMsg : 'Du har redan en bekräftad bokning för detta event.'}
                </div>
              ) : waitlistPosition !== null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="alert alert-success" style={{ textAlign: 'center', margin: 0 }}>
                    Du är på väntelistan — plats {waitlistPosition} · {waitlistQuantity} {waitlistQuantity === 1 ? 'plats' : 'platser'} efterfrågad{waitlistQuantity === 1 ? '' : 'e'}
                  </div>
                  <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLeaveWaitlist}>
                    Lämna väntelistan
                  </button>
                </div>
              ) : !isSoldOut && event.availableSpots >= quantity ? (
                !showPaymentForm && ticketType && ticketType.price > 0 ? (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowPaymentForm(true)}>
                    Boka nu
                  </button>
                ) : showPaymentForm && ticketType && ticketType.price > 0 ? (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                    if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvc) {
                      setCardError('Fyll i alla kortuppgifter.');
                      return;
                    }
                    setCardError('');
                    handleBook();
                  }} disabled={bookingLoading}>
                    {bookingLoading ? 'Bearbetar...' : `Betala ${ticketType.price * quantity} kr`}
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleBook} disabled={bookingLoading}>
                    {bookingLoading ? 'Bokar...' : 'Boka nu'}
                  </button>
                )
              ) : !isSoldOut && event.availableSpots > 0 ? (
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePartialBookAndWaitlist} disabled={bookingLoading}>
                  {bookingLoading ? 'Bokar...' : `Boka ${event.availableSpots} + väntelista för ${quantity - event.availableSpots}`}
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
            <div>
              <p style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: '1rem' }}>Detta event är inställt.</p>
              {(user?.role === 'organizer' || user?.role === 'admin') && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Hantera event</p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleStatusChange('published')}
                    disabled={statusLoading}
                  >
                    Återpublicera event
                  </button>
                  {statusMsg && (
                    <div className={`alert ${statusMsg.includes('markerat') || statusMsg.includes('avbokat') || statusMsg.includes('publicerat') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '0.75rem' }}>
                      {statusMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {event.status === 'completed' && (
            <div>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>Detta event har genomförts.</p>
              {(user?.role === 'admin' || event.organizer._id === user?._id) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Hantera event</p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleStatusChange('published')}
                    disabled={statusLoading}
                  >
                    Återpublicera event
                  </button>
                  {statusMsg && (
                    <div className={`alert ${statusMsg.includes('Kunde') || statusMsg.includes('denied') ? 'alert-error' : 'alert-success'}`} style={{ marginTop: '0.75rem' }}>
                      {statusMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(user?.role === 'admin' || event.organizer._id === user?._id) && event.status === 'published' && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Hantera event</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(user?.role === 'admin' || event.organizer._id === user?._id) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => navigate(`/events/${id}/edit`)}
                  >
                    Redigera event
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleStatusChange('completed')}
                  disabled={statusLoading}
                >
                  Markera som genomfört
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={statusLoading}
                >
                  Avboka event
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', justifyContent: 'center', background: '#7f1d1d' }}
                  onClick={handleDelete}
                >
                  Radera event permanent
                </button>
              </div>
              {statusMsg && (
                <div className={`alert ${statusMsg.includes('Kunde') || statusMsg.includes('denied') ? 'alert-error' : 'alert-success'}`} style={{ marginTop: '0.75rem' }}>
                  {statusMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
