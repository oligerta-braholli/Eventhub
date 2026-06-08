import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [confirm, setConfirm] = useState(false);

  async function handleExport() {
    setExportLoading(true);
    try {
      const r = await api.get('/gdpr/export');
      const blob = new Blob([JSON.stringify(r.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'min-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Kunde inte exportera data');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleAnonymize() {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteMsg('');
    try {
      await api.delete(`/gdpr/anonymize/${user._id}`);
      logout();
      navigate('/');
    } catch (err: any) {
      setDeleteMsg(err.response?.data?.message ?? 'Något gick fel');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
      <div className="page-hero">
        <h1>Min profil</h1>
        <p>Hantera ditt konto och din data</p>
      </div>

      {/* Kontoinfo */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Kontoinformation</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', width: 80 }}>Namn</span>
            <strong>{user.name}</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', width: 80 }}>E-post</span>
            <strong>{user.email}</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', width: 80 }}>Roll</span>
            <strong>{user.role}</strong>
          </div>
        </div>
      </div>

      {/* GDPR — exportera data */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Exportera min data</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Ladda ner all din personliga data som en JSON-fil (bokningar, recensioner, väntelista).
        </p>
        <button className="btn btn-secondary" onClick={handleExport} disabled={exportLoading}>
          {exportLoading ? 'Exporterar...' : 'Ladda ner min data'}
        </button>
      </div>

      {/* GDPR — radera konto */}
      <div className="card" style={{ borderColor: 'var(--danger)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger)' }}>
          Radera mitt konto
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Din personliga information anonymiseras permanent. Bokningar och recensioner bevaras men kopplas inte längre till dig.
        </p>
        {!confirm ? (
          <button className="btn btn-danger" onClick={() => setConfirm(true)}>
            Radera mitt konto
          </button>
        ) : (
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--danger)' }}>
              Är du säker? Detta går inte att ångra.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-danger" onClick={handleAnonymize} disabled={deleteLoading}>
                {deleteLoading ? 'Raderar...' : 'Ja, radera mitt konto'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
                Avbryt
              </button>
            </div>
          </div>
        )}
        {deleteMsg && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{deleteMsg}</div>}
      </div>
    </div>
  );
}
