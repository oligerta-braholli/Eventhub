import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-logo">EventHub</NavLink>
        <div className="navbar-links">
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/calendar">Kalender</NavLink>
          {user ? (
            <>
              <NavLink to="/my-bookings">Mina bokningar</NavLink>
              {(user.role === 'organizer' || user.role === 'admin') && (
                <NavLink to="/create-event">Skapa event</NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin">Admin</NavLink>
              )}
              <NavLink to="/profile" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {user.name} ({user.role})
              </NavLink>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logga ut
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Logga in</NavLink>
              <NavLink to="/register">Skapa konto</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
