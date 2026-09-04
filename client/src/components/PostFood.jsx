import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch';

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PostFood() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('home-cooked');
  const [expiryDate, setExpiryDate] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [availabilityWindow, setAvailabilityWindow] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        () => {}
      );
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !auth.token) return;
    async function load() {
      try {
        const post = await apiFetch(`/food/${id}`, 'GET', null, auth.token);
        setFoodName(post.foodName || '');
        setDescription(post.description || '');
        setQuantity(post.quantity || 1);
        setCategory(post.category || 'home-cooked');
        setExpiryDate(toDatetimeLocal(post.expiryDate));
        setAvailabilityWindow(post.availabilityWindow || '');
        const coords = post.location?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          setLongitude(String(coords[0]));
          setLatitude(String(coords[1]));
        }
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [isEdit, id, auth.token]);

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
      const form = new FormData();
      form.append('foodName', foodName);
      form.append('description', description);
      form.append('quantity', String(Number(quantity)));
      form.append('category', category);
      form.append('expiryDate', new Date(expiryDate).toISOString());
      form.append('availabilityWindow', availabilityWindow);
      form.append(
        'location',
        JSON.stringify({
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        })
      );
      if (photoFile) form.append('photo', photoFile);

      if (isEdit) {
        await apiFetch(`/food/${id}`, 'PATCH', form, auth.token);
        setSuccess('Food post updated.');
        setTimeout(() => navigate('/my-posts'), 800);
      } else {
        await apiFetch('/food', 'POST', form, auth.token);
        setSuccess('Food post created successfully!');
        setTimeout(() => navigate('/my-posts'), 800);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel wide">
      <p className="kicker">Listing</p>
      <h1 className="page-title">{isEdit ? 'Edit listing' : 'List food'}</h1>
      <p className="page-sub">Keep it specific: what it is, how many, when it should be collected.</p>
      {error && <p className="msg-err">{error}</p>}
      {success && <p className="msg-ok">{success}</p>}
      <form onSubmit={handleSubmit}>
        <label className="field">
          Name
          <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)} required />
        </label>
        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="3" />
        </label>
        <label className="field">
          Portions
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label className="field">
          Kind
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="home-cooked">Home-cooked</option>
            <option value="packaged">Packaged</option>
          </select>
        </label>
        <label className="field">
          Expires
          <input type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
        </label>
        <label className="field">
          Latitude
          <input type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
        </label>
        <label className="field">
          Longitude
          <input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
        </label>
        <label className="field">
          Collection window
          <input
            type="text"
            placeholder="e.g. 7–10pm"
            value={availabilityWindow}
            onChange={(e) => setAvailabilityWindow(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Photo {isEdit ? '(optional replacement)' : '(optional)'}
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
        </label>
        <button type="submit" className="button">
          {isEdit ? 'Save' : 'Publish'}
        </button>
      </form>
    </div>
  );
}
