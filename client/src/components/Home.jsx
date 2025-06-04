import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Add this line
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch'; // Adjust the path as necessary

export default function Home() {
  const [foodPosts, setFoodPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [requestingPostId, setRequestingPostId] = useState(null);
  const [requestError, setRequestError] = useState('');
  const auth = useAuth();

  useEffect(() => {
    async function fetchFood() {
      setLoading(true);
      try {
        const data = await apiFetch('/food');
        setFoodPosts(data);
        if (auth.user?.role === 'Recipient') {
          const claimData = await apiFetch('/claims', 'GET', null, auth.token);
          const requestedIds = claimData.map(c => c.foodPost._id);
          setRequests(requestedIds);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFood();
  }, [auth.user, auth.token]);

  const handleRequest = async (foodPostId) => {
    setRequestError('');
    setRequestingPostId(foodPostId);
    try {
      await apiFetch('/claims', 'POST', { foodPostId }, auth.token);
      setRequests(prev => [...prev, foodPostId]);
      alert('Request sent successfully.');
    } catch (err) {
      setRequestError(err.message);
    }
    setRequestingPostId(null);
  };

  return (
    <div className="food-feed-container">
      <h1 className="text-3xl font-bold mb-6">Available Food</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {requestError && <p className="text-red-500 mb-4">{requestError}</p>}
      {loading && <p>Loading...</p>}
      {!loading && foodPosts.length === 0 && <p>No food posts available currently.</p>}
      <div className="grid-2-cols">
        {foodPosts.map(post => {
          const isRequested = requests.includes(post._id);
          return (
            <div key={post._id} className="card" tabIndex={0}>
              <div className="card-content">
                <h2 className="card-title">{post.foodName}</h2>
                <p className="card-text">{post.description}</p>
                <p className="card-text">Quantity: {post.quantity}</p>
                <p className="card-text">Category: {post.category}</p>
                <p className="card-meta">Expires: {new Date(post.expiryDate).toLocaleString()}</p>
                <p className="card-meta">Donor: {post.donor?.username || 'Unknown'}</p>
                {auth.user?.role === 'Recipient' && (
                  <button
                    onClick={() => handleRequest(post._id)}
                    disabled={isRequested || requestingPostId === post._id}
                    className="button mt-4"
                    title={isRequested ? "Already requested" : "Request this food"}
                  >
                    {isRequested ? 'Requested' : requestingPostId === post._id ? 'Requesting...' : 'Request'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {auth.user ? (
        <div className="mt-4 text-center">
          <Link to="/post" className="button">
            Post Food
          </Link>
          {auth.user.role === 'Admin' && (
            <Link to="/admin" className="button ml-4">
              Admin Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p>
            <Link to="/login" className="text-blue-500 hover:underline">
              Log in
            </Link>{' '}
            to post food.
          </p>
        </div>
      )}
    </div>
  );
}
