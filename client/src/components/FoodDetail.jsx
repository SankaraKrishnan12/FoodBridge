import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import apiFetch, { mediaUrl } from '../utils/apiFetch';
import { formatPickup, mapUrl } from './FoodCard';

export default function FoodDetail() {
  const { id } = useParams();
  const auth = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [incoming, setIncoming] = useState([]);
  const [myClaim, setMyClaim] = useState(null);
  const [busy, setBusy] = useState(false);

  const donorId = post?.donor?._id || post?.donor;
  const canManage =
    auth.user &&
    (auth.user.role === 'Admin' || String(auth.user.id) === String(donorId));
  const remaining = post ? (post.quantityRemaining ?? post.quantity) : 0;
  const canRequest =
    auth.user?.role === 'Recipient' &&
    post?.status === 'available' &&
    remaining > 0 &&
    !myClaim;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/food/${id}`);
      setPost(data);
      if (auth.user?.role === 'Recipient' && auth.token) {
        const claims = await apiFetch('/claims', 'GET', null, auth.token);
        const list = Array.isArray(claims) ? claims : [];
        setMyClaim(
          list.find((c) => String(c.foodPost?._id || c.foodPost) === String(id)) || null
        );
      } else {
        setMyClaim(null);
      }
      if (auth.token && ['Donor', 'Admin'].includes(auth.user?.role)) {
        const all = await apiFetch('/claims/incoming', 'GET', null, auth.token);
        setIncoming(
          (Array.isArray(all) ? all : []).filter(
            (c) => String(c.foodPost?._id || c.foodPost) === String(id)
          )
        );
      } else {
        setIncoming([]);
      }
    } catch (err) {
      setError(err.message);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id, auth.token, auth.user?.role]);

  async function requestFood() {
    setBusy(true);
    try {
      const created = await apiFetch('/claims', 'POST', { foodPostId: id }, auth.token);
      const code = created.pickupCode || created.claim?.pickupCode;
      alert(code ? `Request sent. Pickup code: ${code}` : 'Request sent.');
      await load();
    } catch (err) {
      alert(err.message);
    }
    setBusy(false);
  }

  async function cancelPost() {
    if (!window.confirm('Cancel this listing? Pending requests will be rejected.')) return;
    try {
      await apiFetch(`/food/${id}/cancel`, 'PATCH', {}, auth.token);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateClaim(claimId, status) {
    let pickupCode;
    if (status === 'collected') {
      pickupCode = window.prompt('Enter the pickup code from the recipient');
      if (!pickupCode) return;
    }
    try {
      await apiFetch(`/claims/${claimId}`, 'PATCH', { status, pickupCode }, auth.token);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p className="page-sub">Loading…</p>;
  if (error) {
    return (
      <div>
        <p className="msg-err">{error}</p>
        <Link to="/">Back to listings</Link>
      </div>
    );
  }
  if (!post) return null;

  const photo = mediaUrl(post.photo);
  const leftPct = post.quantity
    ? Math.max(4, Math.round((remaining / post.quantity) * 100))
    : 0;
  const initial = (post.foodName || '?').trim().charAt(0).toUpperCase();

  return (
    <div>
      <p className="kicker">
        <Link to="/">Listings</Link>
        {canManage && (
          <>
            {' · '}
            <Link to="/my-posts">Your listings</Link>
          </>
        )}
      </p>
      <article className="product">
        <div className="product-media">
          <span className="pill">{post.status}</span>
          {photo ? (
            <img src={photo} alt="" />
          ) : (
            <div className="product-fallback">
              <span>{initial}</span>
              <em>{(post.category || '').replace(/-/g, ' ')}</em>
            </div>
          )}
        </div>
        <div className="product-info">
          <p className="kicker">{(post.category || '').replace(/-/g, ' ')}</p>
          <h1 className="page-title">{post.foodName}</h1>
          <p className="product-desc">{post.description}</p>
          <div className="portion">
            <div className="portion-bar"><i style={{ width: `${leftPct}%` }} /></div>
            <span>{remaining} of {post.quantity} portions left</span>
          </div>
          <dl className="specs">
            <div>
              <dt>Collect</dt>
              <dd>{post.availabilityWindow || 'Not set'}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{post.expiryDate ? new Date(post.expiryDate).toLocaleString() : '—'}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {formatPickup(post)}
                {mapUrl(post) && (
                  <>
                    {' · '}
                    <a href={mapUrl(post)} target="_blank" rel="noreferrer">Open map</a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{post.donor?.username || 'A donor'}</dd>
            </div>
          </dl>
          <div className="product-actions">
            {!auth.user && post.status === 'available' && remaining > 0 && (
              <Link to="/login" className="button">Log in to request</Link>
            )}
            {canRequest && (
              <button type="button" className="button" disabled={busy} onClick={requestFood}>
                {busy ? 'Sending…' : 'Request this food'}
              </button>
            )}
            {auth.user?.role === 'Recipient' && myClaim && (
              <Link to="/my-claims" className="button-ghost">Your claims</Link>
            )}
            {canManage && ['available', 'claimed'].includes(post.status) && (
              <Link to={`/post/${post._id}`} className="button-ghost">Edit</Link>
            )}
            {canManage && post.status !== 'cancelled' && post.status !== 'collected' && (
              <button type="button" className="button button-danger" onClick={cancelPost}>
                Cancel listing
              </button>
            )}
          </div>
          {auth.user?.role === 'Recipient' && myClaim && (
            <div className="ticket">
              <p className="kicker">Your pickup code</p>
              <span className="pickup-code">{myClaim.pickupCode || '—'}</span>
              <p className="card-meta" style={{ marginTop: '0.45rem' }}>
                {myClaim.status === 'approved'
                  ? 'Show this when you collect the food.'
                  : `Request is ${myClaim.status}.`}
              </p>
            </div>
          )}
        </div>
      </article>

      {canManage && (
        <section className="requests-panel">
          <h2>Requests</h2>
          {incoming.length === 0 ? (
            <p className="page-sub" style={{ marginBottom: 0 }}>No requests yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incoming.map((claim) => (
                  <tr key={claim._id}>
                    <td>{claim.recipient?.username || 'Unknown'}</td>
                    <td>{claim.status}</td>
                    <td className="space-x-2">
                      {claim.status === 'pending' && (
                        <>
                          <button type="button" className="button button-small" onClick={() => updateClaim(claim._id, 'approved')}>
                            Approve
                          </button>
                          <button type="button" className="button button-small button-danger" onClick={() => updateClaim(claim._id, 'rejected')}>
                            Reject
                          </button>
                        </>
                      )}
                      {claim.status === 'approved' && (
                        <button type="button" className="button button-small button-ghost" onClick={() => updateClaim(claim._id, 'collected')}>
                          Collected
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

