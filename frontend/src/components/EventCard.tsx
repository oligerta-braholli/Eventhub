import { Link } from 'react-router-dom';
import { Event } from '../types';

interface Props {
  event: Event;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ event }: { event: Event }) {
  if (event.status === 'cancelled') return <span className="badge badge-red">Inställt</span>;
  if (event.status === 'completed') return <span className="badge badge-gray">Genomfört</span>;
  if (event.isFull) return <span className="badge badge-yellow">Fullbokat</span>;
  return <span className="badge badge-green">Platser kvar: {event.availableSpots}</span>;
}

export default function EventCard({ event }: Props) {
  return (
    <Link to={`/events/${event._id}`} style={{ display: 'block' }}>
      <div className="card" style={{ height: '100%', cursor: 'pointer' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <StatusBadge event={event} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          {event.title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          {event.description.slice(0, 100)}{event.description.length > 100 ? '…' : ''}
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>📅 {formatDate(event.startDate)}</span>
          {event.venue && (
            <span>📍 {event.venue.name}, {event.venue.city}</span>
          )}
          <span>👥 {event.capacity} platser</span>
        </div>
        {event.ticketTypes.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {event.ticketTypes.map((t) => (
              <span key={t.name} className="badge badge-purple">
                {t.name}: {t.price === 0 ? 'Gratis' : `${t.price} kr`}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
