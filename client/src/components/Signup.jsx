import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Donor');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/users/signup', 'POST', { username, email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel">
      <p className="kicker">Account</p>
      <h1 className="page-title">Join</h1>
      <p className="page-sub">Give extra food, or collect a meal. Pick one role to start.</p>
      {error && <p className="msg-err">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className="field">
          Username
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="field">
          I am a
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="Donor">Donor — I have extra food</option>
            <option value="Recipient">Recipient — I can collect food</option>
          </select>
        </label>
        <button type="submit" className="button">Create account</button>
      </form>
      <p className="page-sub" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
        Already joined? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
