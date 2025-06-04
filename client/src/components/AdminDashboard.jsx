import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import apiFetch from '../utils/apiFetch'; 

export default function AdminDashboard() {
  const auth = useAuth();
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
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

  // Update claim status
  async function updateClaimStatus(claimId, status) {
    try {
      const updatedClaim = await apiFetch(`/admin/claims/${claimId}`, 'PATCH', { status }, auth.token);
      setClaims(claims.map(c => (c._id === claimId ? updatedClaim.claim : c)));
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

  // Delete user
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
    return <p className="p-4 text-center">Access denied. Admins only.</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Manage Claims</h2>
        {loadingClaims ? <p>Loading claims...</p> : (
          error ? <p className="text-red-500">{error}</p> :
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Food</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">Recipient</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">Status</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-600 p-2">{claim.foodPost?.foodName || 'N/A'}</td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2">{claim.recipient?.username || 'N/A'}</td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 capitalize">{claim.status}</td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 space-x-2">
                    {claim.status === 'pending' && <>
                      <button
                        className="button bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
                        onClick={() => updateClaimStatus(claim._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="button bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                        onClick={() => updateClaimStatus(claim._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>}
                    {claim.status === 'approved' && (
                      <button
                        className="button bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                        onClick={() => updateClaimStatus(claim._id, 'collected')}
                      >
                        Mark Collected
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
        <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
        {loadingUsers ? <p>Loading users...</p> : (
          error ? <p className="text-red-500">{error}</p> :
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Username</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Email</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left">Role</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-600 p-2">{user.username}</td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2">{user.email}</td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 capitalize">
                    {userEditRole?.userId === user._id ? (
                      <select
                        defaultValue={user.role.toLowerCase()}
                        onChange={(e) => setUserEditRole({ userId: user._id, newRole: e.target.value })}
                        className="border border-gray-400 rounded p-1"
                      >
                        <option value="donor">Donor</option>
                        <option value="recipient">Recipient</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 p-2 space-x-2">
                    {userEditRole?.userId === user._id ? (
                      <>
                        <button
                          className="button bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
                          onClick={() => updateUserRole(user._id, userEditRole.newRole)}
                          disabled={!userEditRole.newRole}
                        >
                          Save
                        </button>
                        <button
                          className="button bg-gray-400 hover:bg-gray-500 text-black py-1 px-3 rounded"
                          onClick={() => setUserEditRole(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="button bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
                          onClick={() => setUserEditRole({ userId: user._id, newRole: user.role.toLowerCase() })}
                        >
                          Edit Role
                        </button>
                        <button
                          className="button bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                          onClick={() => deleteUser(user._id)}
                        >
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