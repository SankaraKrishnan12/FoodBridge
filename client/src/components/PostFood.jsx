import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch'; // Adjust the path as necessary
import { useNavigate } from 'react-router-dom';

export default function PostFood() {
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('home-cooked');
  const [expiryDate, setExpiryDate] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [availabilityWindow, setAvailabilityWindow] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to get user's geolocation on mount
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        () => {}
      ); // Ignore error
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!auth.token) {
      setError('You must be logged in to post food.');
      return;
    }
    if (!latitude || !longitude) {
      setError('Please provide pickup location coordinates.');
      return;
    }
    try {
      const expiryDateISO = new Date(expiryDate).toISOString();
      const postData = {
        foodName,
        description,
        quantity: Number(quantity),
        category,
        expiryDate: expiryDateISO,
        location: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        },
        availabilityWindow,
      };
      await apiFetch('/food', 'POST', postData, auth.token);
      setSuccess('Food post created successfully!');
      // Reset form
      setFoodName('');
      setDescription('');
      setQuantity(1);
      setCategory('home-cooked');
      setExpiryDate('');
      setAvailabilityWindow('');
      setLatitude('');
      setLongitude('');
      // Redirect to home after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-[80%] mx-auto my-16 p-6 bg-white rounded shadow ">
      <h2 className="text-2xl font-semibold mb-4">Post Food</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Food Name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows="3"
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="number"
          min="1"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        >
          <option value="home-cooked">Home-cooked</option>
          <option value="packaged">Packaged</option>
        </select>
        <label className="block">
          Expiry Date and Time:
          <input
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
          />
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
            className="flex-1 px-4 py-2 border rounded bg-gray-100 border-gray-300"
          />
          <input
            type="text"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
            className="flex-1 px-4 py-2 border rounded bg-gray-100 border-gray-300"
          />
        </div>
        <input
          type="text"
          placeholder="Availability Window (e.g. 10:00 AM - 5:00 PM)"
          value={availabilityWindow}
          onChange={(e) => setAvailabilityWindow(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <div className="flex justify-center">
        <button to="/post" className="button align-center w-[20%] bg-green-600 hover:bg-green-700 text-white py-2 rounded text-center">
          Post Food
        </button>
        </div>
      </form>
    </div>
  );
}
