import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch'; 

export default function AdminDashboard() {
  const auth = useAuth();
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [foodPosts, setFoodPosts] = useState([]);
  const [loadingFood, setLoadingFood] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [userEditRole, setUserEditRole] = useState(null); // { userId, newRole }

  // Fetch claims
  useEffect(() => {
    async function fetchClaims() {
      setLoadingClaims(true);
      setError('');
      try {
        const data = await apiFetch('/admin/claims', 'GET', null, auth.token);
        setClaims(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingClaims(false);
      }
    }
    if (auth.user?.role === 'Admin') fetchClaims();
  }, [auth]);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      setError('');
      try {
        const data = await apiFetch('/admin/users', 'GET', null, auth.token);
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingUsers(false);
      }
    }
    if (auth.user?.role === 'Admin') fetchUsers();
  }, [auth]);

  useEffect(() => {
    async function fetchFood() {
      setLoadingFood(true);
      try {
        const data = await apiFetch('/admin/food', 'GET', null, auth.token);
        setFoodPosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFood(false);
      }
    }
    if (auth.user?.role === 'Admin') fetchFood();
  }, [auth]);

  // Update claim status
  async function updateClaimStatus(claimId, status) {
    let pickupCode;
    if (status === 'collected') {
      pickupCode = window.prompt('Enter the pickup code from the recipient');
      if (!pickupCode) return;
    }
    try {
      const updatedClaim = await apiFetch(`/admin/claims/${claimId}`, 'PATCH', { status, pickupCode }, auth.token);
      const next = updatedClaim.claim || updatedClaim;
      setClaims((prev) => prev.map((c) => (c._id === claimId ? next : c)));
    } catch (err) {
      alert(err.message);
    }
  }

  // Update user role
  async function updateUserRole(userId, newRole) {
    try {
      const updatedUser  = await apiFetch(`/admin/users/${userId}`, 'PATCH', { role: newRole }, auth.token);
      setUsers(users.map(u => (u._id === userId ? updatedUser .user : u)));
      setUserEditRole(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function cancelFood(postId) {
    if (!window.confirm('Cancel this food post?')) return;
    try {
      const updated = await apiFetch(`/admin/food/${postId}/cancel`, 'PATCH', {}, auth.token);
      setFoodPosts(foodPosts.map((p) => (p._id === postId ? updated : p)));
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteFood(postId) {
    if (!window.confirm('Delete this food post and its claims?')) return;
    try {
      await apiFetch(`/admin/food/${postId}`, 'DELETE', null, auth.token);
      setFoodPosts(foodPosts.filter((p) => p._id !== postId));
    } catch (err) {
      alert(err.message);
    }
  }
  async function deleteUser (userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiFetch(`/admin/users/${userId}`, 'DELETE', null, auth.token);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  }

  if (auth.user?.role !== 'Admin') {
    return <p className="page-sub">Admins only.</p>;
  }

  const collected = claims.filter((c) => c.status === 'collected').length;
  const meals = foodPosts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

  return (
    <div className="stack">
      <div>
        <p className="kicker">Moderation</p>
        <h1 className="page-title">Admin</h1>
        <div className="stats">
          <div className="stat"><b>{users.length}</b><span>Users</span></div>
          <div className="stat"><b>{foodPosts.length}</b><span>Listings</span></div>
          <div className="stat"><b>{claims.length}</b><span>Claims</span></div>
          <div className="stat"><b>{collected}</b><span>Collected</span></div>
          <div className="stat"><b>{meals}</b><span>Portions</span></div>
        </div>
      </div>

      <section>
        <h2>Listings</h2>
        {loadingFood ? <p className="page-sub">Loadingâ€¦</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Donor</th>
                <th>Status</th>
                <th>Left</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {foodPosts.map((post) => (
                <tr key={post._id}>
                  <td>{post.foodName}</td>
                  <td>{post.donor?.username || 'â€”'}</td>
                  <td>{post.status}</td>
                  <td>{post.quantityRemaining ?? post.quantity}</td>
                  <td className="space-x-2">
                    {post.status !== 'cancelled' && post.status !== 'collected' && (
                      <button type="button" className="button button-small button-danger" onClick={() => cancelFood(post._id)}>
                        Cancel
                      </button>
                    )}
                    <button type="button" className="button button-small button-ghost" onClick={() => deleteFood(post._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Claims</h2>
        {loadingClaims ? <p className="page-sub">Loadingâ€¦</p> : (
          error ? <p className="msg-err">{error}</p> :
          <table className="data-table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Donor</th>
                <th>Recipient</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...claims].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0)).map((claim) => (
                <tr key={claim._id}>
                  <td>{claim.foodPost?.foodName || 'â€”'}</td>
                  <td>{claim.foodPost?.donor?.username || 'â€”'}</td>
                  <td>{claim.recipient?.username || 'â€”'}</td>
                  <td>{claim.status}</td>
                  <td className="space-x-2">
                    {claim.status === 'pending' && (
                      <>
                        <button type="button" className="button button-small" onClick={() => updateClaimStatus(claim._id, 'approved')}>
                          Approve
                        </button>
                        <button type="button" className="button button-small button-danger" onClick={() => updateClaimStatus(claim._id, 'rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                    {claim.status === 'approved' && (
                      <button type="button" className="button button-small button-ghost" onClick={() => updateClaimStatus(claim._id, 'collected')}>
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

      <section>
        <h2>People</h2>
        {loadingUsers ? <p className="page-sub">Loadingâ€¦</p> : (
          error ? <p className="msg-err">{error}</p> :
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {userEditRole?.userId === user._id ? (
                      <select
                        defaultValue={user.role}
                        onChange={(e) => setUserEditRole({ userId: user._id, newRole: e.target.value })}
                      >
                        <option value="Donor">Donor</option>
                        <option value="Recipient">Recipient</option>
                        <option value="Admin">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="space-x-2">
                    {userEditRole?.userId === user._id ? (
                      <>
                        <button
                          type="button"
                          className="button button-small"
                          onClick={() => updateUserRole(user._id, userEditRole.newRole)}
                          disabled={!userEditRole.newRole}
                        >
                          Save
                        </button>
                        <button type="button" className="button button-small button-ghost" onClick={() => setUserEditRole(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="button button-small button-ghost"
                          onClick={() => setUserEditRole({ userId: user._id, newRole: user.role })}
                        >
                          Role
                        </button>
                        <button type="button" className="button button-small button-danger" onClick={() => deleteUser(user._id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
