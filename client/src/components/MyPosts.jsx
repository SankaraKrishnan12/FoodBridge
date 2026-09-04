import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';
import FoodCard from './FoodCard';

export default function MyPosts() {
  const auth = useAuth();
  const [posts, setPosts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [postData, claimData] = await Promise.all([
          apiFetch('/food/mine', 'GET', null, auth.token),
          apiFetch('/claims/incoming', 'GET', null, auth.token),
        ]);
        setPosts(postData);
        setClaims(claimData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (auth.token) load();
  }, [auth.token]);

  const pendingByPost = claims.reduce((acc, claim) => {
    const key = claim.foodPost?._id;
    if (!key || claim.status !== 'pending') return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <p className="kicker">Donor</p>
      <h1 className="page-title">
        {auth.user?.role === 'Admin' ? 'All listings' : 'Your listings'}
      </h1>
      <p className="page-sub">Open a listing to edit it or handle requests.</p>
      {error && <p className="msg-err">{error}</p>}
      {loading && <p className="page-sub">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="page-sub">
          {auth.user?.role === 'Admin' ? 'No listings yet.' : 'You have not listed food yet.'}
        </p>
      )}
      <div className="card-grid">
        {posts.map((post) => (
          <FoodCard
            key={post._id}
            post={post}
            badge={
              pendingByPost[post._id]
                ? `${pendingByPost[post._id]} waiting`
                : post.status !== 'available'
                  ? post.status
                  : null
            }
          />
        ))}
      </div>
    </div>
  );
}
