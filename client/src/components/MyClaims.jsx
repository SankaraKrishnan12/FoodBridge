import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';
import FoodCard from './FoodCard';

export default function MyClaims() {
  const auth = useAuth();
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch('/claims', 'GET', null, auth.token);
        setClaims(Array.isArray(data) ? data : data.claims || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (auth.token) load();
  }, [auth.token]);

  return (
    <div>
      <p className="kicker">Recipient</p>
      <h1 className="page-title">Your claims</h1>
      <p className="page-sub">Open a listing to see the pickup code and status.</p>
      {error && <p className="msg-err">{error}</p>}
      {loading && <p className="page-sub">Loading…</p>}
      {!loading && claims.length === 0 && (
        <p className="page-sub">You have not requested any food yet.</p>
      )}
      <div className="card-grid">
        {claims.map((claim) => {
          const post = claim.foodPost;
          if (!post) {
            return (
              <div key={claim._id} className="card">
                <div className="card-content">
                  <p className="card-title">Listing removed</p>
                  <p className="card-meta">{claim.status}</p>
                </div>
              </div>
            );
          }
          return (
            <FoodCard
              key={claim._id}
              post={post}
              badge={`${claim.status}${claim.pickupCode ? ` · ${claim.pickupCode}` : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
