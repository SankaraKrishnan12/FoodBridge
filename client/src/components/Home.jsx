import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';
import FoodCard from './FoodCard';

export default function Home() {
  const [foodPosts, setFoodPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);
  const auth = useAuth();

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null)
    );
  }, []);

  useEffect(() => {
    async function fetchFood() {
      setLoading(true);
      setError('');
      try {
        const qs =
          coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)
            ? `/food?lat=${coords.lat}&lng=${coords.lng}`
            : '/food';
        setFoodPosts(await apiFetch(qs));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFood();
  }, [auth.user, coords]);

  return (
    <div>
      <section className="hero">
        <div>
          <p className="kicker">Surplus food, locally</p>
          <h1>Someone nearby cooked more than they need.</h1>
          <p className="lede">
            List extra portions or pick up a meal that would otherwise go to waste.
            No marketplace. No fees. Just a time and a place.
          </p>
          <div className="hero-actions">
            {!auth.user && (
              <>
                <Link to="/signup" className="button">Start</Link>
                <Link to="/login" className="button-ghost">Log in</Link>
              </>
            )}
            {['Donor', 'Admin'].includes(auth.user?.role) && (
              <Link to="/post" className="button">List food</Link>
            )}
            {auth.user?.role === 'Recipient' && (
              <Link to="/my-claims" className="button-ghost">Your claims</Link>
            )}
          </div>
        </div>
        <div className="hero-aside">
          <div className="step">
            <span className="step-n">01</span>
            <p><strong>Offer</strong>Name the dish, how many portions, and when it can be collected.</p>
          </div>
          <div className="step">
            <span className="step-n">02</span>
            <p><strong>Ask</strong>Recipients request a listing. You get a short pickup code.</p>
          </div>
          <div className="step">
            <span className="step-n">03</span>
            <p><strong>Meet</strong>Show the code at the door. The rest is a shared table.</p>
          </div>
        </div>
      </section>

      <div className="section-head">
        <h2>Available now</h2>
        <span className="count">{loading ? '…' : `${foodPosts.length} listing${foodPosts.length === 1 ? '' : 's'}`}</span>
      </div>

      {error && <p className="msg-err">{error}</p>}
      {loading && <p className="page-sub">Looking nearby…</p>}
      {!loading && foodPosts.length === 0 && (
        <p className="page-sub">Nothing listed right now. Check again later, or post what you have extra.</p>
      )}

      <div className="card-grid">
        {foodPosts.map((post) => (
          <FoodCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
