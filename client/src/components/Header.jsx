import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';

export default function Header() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const toggleDark = () => {
    document.body.classList.toggle('dark');
    setDark(document.body.classList.contains('dark'));
  };

  useEffect(() => {
    let timer;
    async function loadNotes() {
      if (!auth.token) {
        setNotes([]);
        setUnread(0);
        return;
      }
      try {
        const data = await apiFetch('/users/notifications', 'GET', null, auth.token);
        setNotes(data.notifications || []);
        setUnread(data.unread || 0);
      } catch {
        /* keep last */
      }
    }
    loadNotes();
    if (auth.token) timer = setInterval(loadNotes, 20000);
    return () => clearInterval(timer);
  }, [auth.token]);

  async function toggleNotes() {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      try {
        await apiFetch('/users/notifications/read', 'PATCH', {}, auth.token);
        setUnread(0);
        setNotes((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <header className="site-head">
      <Link to="/" className="brand">
        Food<em>Bridge</em>
      </Link>
      <nav className="nav">
        {auth.user ? (
          <>
            <span className="who">{auth.user.username}</span>
            {['Donor', 'Admin'].includes(auth.user.role) && (
              <>
                <Link to="/post" className="nav-link">Post</Link>
                <Link to="/my-posts" className="nav-link">
                  {auth.user.role === 'Admin' ? 'Posts' : 'My posts'}
                </Link>
              </>
            )}
            {auth.user.role === 'Recipient' && (
              <Link to="/my-claims" className="nav-link">Claims</Link>
            )}
            {auth.user.role === 'Admin' && (
              <Link to="/admin" className="nav-link">Admin</Link>
            )}
            <div className="alerts">
              <button type="button" className="linkish" onClick={toggleNotes}>
                Alerts{unread > 0 ? ` ${unread}` : ''}
              </button>
              {open && (
                <div className="alerts-panel">
                  {notes.length === 0 && <p className="alert-item">Nothing new.</p>}
                  {notes.map((n) => (
                    <p key={n._id} className={`alert-item ${n.read ? '' : 'unread'}`}>
                      {n.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="linkish" onClick={toggleDark}>
              {dark ? 'Light' : 'Dark'}
            </button>
            <button type="button" className="button button-small button-ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button type="button" className="linkish" onClick={toggleDark}>
              {dark ? 'Light' : 'Dark'}
            </button>
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/signup" className="button button-small">Join</Link>
          </>
        )}
      </nav>
    </header>
  );
}
