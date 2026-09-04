import React from 'react';
import { Link } from 'react-router-dom';
import { mediaUrl } from '../utils/apiFetch';

export function formatPickup(post) {
  const coords = post?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return 'Pickup not set';
  const [lng, lat] = coords;
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
}

export function mapUrl(post) {
  const coords = post?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return '';
  const [lng, lat] = coords;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export default function FoodCard({ post, badge }) {
  const photo = mediaUrl(post.photo);
  const remaining = post.quantityRemaining ?? post.quantity;

  return (
    <Link to={`/food/${post._id}`} className="card card-link">
      {photo ? <img src={photo} alt="" /> : <div className="card-ph" />}
      <div className="card-content">
        <h3 className="card-title">{post.foodName}</h3>
        {post.status && post.status !== 'available' && (
          <p className="card-meta">{post.status}</p>
        )}
        <p className="card-text">{post.description}</p>
        <p className="card-meta">{remaining} left · {post.category}</p>
        <p className="card-meta">{post.availabilityWindow || 'Window not set'}</p>
        {badge && <span className="card-badge">{badge}</span>}
      </div>
    </Link>
  );
}
