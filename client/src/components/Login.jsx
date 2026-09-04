import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/users/login', 'POST', { username, password });
      auth.login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel">
      <p className="kicker">Account</p>
      <h1 className="page-title">Log in</h1>
      {error && <p className="msg-err">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className="field">
          Username or email
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Password
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="button">Enter</button>
      </form>
      <p className="page-sub" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
