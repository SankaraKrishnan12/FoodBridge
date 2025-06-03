import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../App';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Recipient');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // UseAuth might be imported from context if needed for signup, but generally not used here
  // We handle signup then navigate to login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
          required
        >
          <option value="Donor">Donor</option>
          <option value="Recipient">Recipient</option>
          <option value="Admin">Admin</option>
        </select>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}

