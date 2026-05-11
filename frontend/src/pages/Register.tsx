import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'participant' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/events');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registrering misslyckades');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem', textAlign: 'center' }}>
          Skapa konto
        </h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Namn</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label>E-post</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Lösenord (minst 8 tecken)</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} minLength={8} required />
          </div>
          <div className="form-group">
            <label>Roll</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="participant">Deltagare</option>
              <option value="organizer">Arrangör</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Registrerar...' : 'Registrera'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Har redan konto? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Logga in</Link>
        </p>
      </div>
    </div>
  );
}
