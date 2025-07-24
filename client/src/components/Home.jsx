import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';

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
      {/* Intro Section with Background Image */}
      <section
  className="relative h-[60vh] bg-cover bg-center flex items-center justify-start text-white rounded mb-10 shadow px-10"
  style={{ backgroundImage: "url('https://t4.ftcdn.net/jpg/03/14/32/75/240_F_314327563_53uk7HoI85BWSZ01Nmyl2P3GSLra1H9x.jpg')" }} // Change path if needed
>
  <div className="absolute inset-0 bg-black/30 rounded" />
  
  <div className="relative text-left max-w-[45%]">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to FoodBridge</h1>
    <p className="text-lg md:text-xl leading-relaxed">
      <strong>FoodBridge</strong> connects people with surplus food to those in need.
      Reduce waste, support the community, and make a difference one meal at a time.
    </p>
  </div>
</section>


      <h2 className="text-3xl font-bold mb-6 text-center">Available Food</h2>

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
                <h3 className="card-title">{post.foodName}</h3>
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
                    {isRequested
                      ? 'Requested'
                      : requestingPostId === post._id
                        ? 'Requesting...'
                        : 'Request'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {auth.user ? (
        <div className="mt-6 text-center">
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
        <div className="mt-6 text-center">
          <p>
            <Link to="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>{' '}
            to post food.
          </p>
        </div>
      )}
    </div>
  );
}
