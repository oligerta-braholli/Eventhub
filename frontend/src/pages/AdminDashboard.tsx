import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Stats {
  users: { total: number; admins: number; organizers: number; participants: number };
  events: { total: number; published: number; draft: number; cancelled: number; completed: number };
  bookings: { total: number; confirmed: number; cancelled: number };
  waitlist: { total: number };
  recentUsers: { _id: string; name: string; email: string; role: string; createdAt: string }[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isAnonymized: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{label}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: 'badge-purple',
    organizer: 'badge-yellow',
    participant: 'badge-green',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    organizer: 'Arrangör',
    participant: 'Deltagare',
  };
  return <span className={`badge ${map[role] ?? 'badge-gray'}`}>{labels[role] ?? role}</span>;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleMsg, setRoleMsg] = useState<Record<string, string>>({});

  function fetchStats() {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }

  useEffect(() => {
    fetchStats();
    api.get('/admin/users')
      .then((r) => setUsers(r.data.data.users))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      const updatedUser = res.data.data.user;
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: updatedUser.role } : u));
      setRoleMsg((prev) => ({ ...prev, [userId]: '✓ Sparad' }));
      fetchStats();
      setTimeout(() => setRoleMsg((prev) => ({ ...prev, [userId]: '' })), 2000);
    } catch (err: any) {
      setRoleMsg((prev) => ({ ...prev, [userId]: err.response?.data?.message ?? 'Fel' }));
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="page-hero">
        <h1>Admin-dashboard</h1>
        <p>Översikt över plattformens användare, events och bokningar</p>
      </div>

      {/* ── Statistikkort ── */}
      {loadingStats ? (
        <div className="spinner">Laddar statistik...</div>
      ) : stats && (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Användare</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Totalt" value={stats.users.total} color="var(--primary)" />
            <StatCard label="Admins" value={stats.users.admins} color="#7c3aed" />
            <StatCard label="Arrangörer" value={stats.users.organizers} color="var(--warning)" />
            <StatCard label="Deltagare" value={stats.users.participants} color="var(--success)" />
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Events</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Totalt" value={stats.events.total} color="var(--primary)" />
            <StatCard label="Publicerade" value={stats.events.published} color="var(--success)" />
            <StatCard label="Utkast" value={stats.events.draft} color="var(--text-muted)" />
            <StatCard label="Avbokade" value={stats.events.cancelled} color="var(--danger)" />
            <StatCard label="Avslutade" value={stats.events.completed} color="var(--warning)" />
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Bokningar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <StatCard label="Totalt" value={stats.bookings.total} color="var(--primary)" />
            <StatCard label="Bekräftade" value={stats.bookings.confirmed} color="var(--success)" />
            <StatCard label="Avbokade" value={stats.bookings.cancelled} color="var(--danger)" />
            <StatCard label="Väntelistan" value={stats.waitlist.total} color="var(--warning)" />
          </div>
        </>
      )}

      {/* ── Alla användare ── */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Alla användare</h2>
      {loadingUsers ? (
        <div className="spinner">Laddar användare...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                <th style={thStyle}>Namn</th>
                <th style={thStyle}>E-post</th>
                <th style={thStyle}>Roll</th>
                <th style={thStyle}>Ändra roll</th>
                <th style={thStyle}>Registrerad</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr
                    key={u._id}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}
                  >
                    <td style={tdStyle}>
                      {u.isAnonymized
                        ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Anonymiserad</span>
                        : u.name}
                      {isSelf && <span style={{ color: 'var(--primary)', fontSize: '0.78rem', marginLeft: '0.4rem' }}>(du)</span>}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.88rem' }}>{u.email}</td>
                    <td style={tdStyle}><RoleBadge role={u.role} /></td>
                    <td style={tdStyle}>
                      {isSelf ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            style={{
                              padding: '0.3rem 0.5rem',
                              border: '2px solid var(--border)',
                              borderRadius: 6,
                              fontSize: '0.85rem',
                              background: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="participant">Deltagare</option>
                            <option value="organizer">Arrangör</option>
                            <option value="admin">Admin</option>
                          </select>
                          {roleMsg[u._id] && (
                            <span style={{
                              fontSize: '0.8rem',
                              color: roleMsg[u._id].startsWith('✓') ? 'var(--success)' : 'var(--danger)',
                              fontWeight: 600,
                            }}>
                              {roleMsg[u._id]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.88rem' }}>{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.93rem',
};
