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

  function validate(): string {
    if (form.name.trim().length < 2) return 'Namnet måste vara minst 2 tecken';
    if (!/^[a-zA-ZåäöÅÄÖéèêëàâùûüîïôœæç\s]+$/.test(form.name))
      return 'Namnet får bara innehålla bokstäver och mellanslag';
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/events');
    } catch (err: any) {
      const firstError = err.response?.data?.errors?.[0]?.message;
      setError(firstError ?? err.response?.data?.message ?? 'Registrering misslyckades');
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
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              autoFocus
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Namn måste vara minst 2 tecken och bara innehålla bokstäver.
            </small>
          </div>
          <div className="form-group">
            <label>E-post</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Lösenord</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Lösenord ska innehålla minst 8 tecken, 1 siffra och 1 stor bokstav.
            </small>
          </div>
          <div className="form-group">
            <label>Roll</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="participant">Deltagare</option>
              <option value="organizer">Arrangör</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Har redan konto? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Logga in</Link>
        </p>
      </div>
    </div>
  );
}
