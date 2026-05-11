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
          {user ? (
            <>
              <NavLink to="/my-bookings">Mina bokningar</NavLink>
              {(user.role === 'organizer' || user.role === 'admin') && (
                <NavLink to="/create-event">Skapa event</NavLink>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {user.name} ({user.role})
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logga ut
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Logga in</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">Registrera</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
