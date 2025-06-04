import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import DarkModeToggle from './components/dark';
import './styles.css';

// Context for Authentication State
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser ] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = (user, token) => {
    setUser (user);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser (null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = { user, token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

// API base URL
const API_URL = 'http://localhost:5000/api';

// Helper: Make authenticated fetch
async function apiFetch(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_URL + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'API Error');
  }
  return res.json();
}

// Login Component
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/users/login', 'POST', { username, password });
      auth.login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Log In
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

// Signup Component
function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Donor');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/users/signup', 'POST', { username, email, password, role });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-gray-100 border-gray-300"
          required
        >
          <option value="Donor">Donor</option>
          <option value="Recipient">Recipient</option>
          <option value="Admin">Admin</option>
        </select>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}

// Home Component
function Home() {
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

// Post Food Component
function PostFood() {
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
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded shadow">
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
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Post Food
        </button>
      </form>
    </div>
  );
}

// Navigation Header
function Header() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };
  return (
    <header className="bg-white dark:bg-gray-800 shadow py-4 px-6 flex justify-between items-center sticky top-0 z-10">
      <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
        FoodBridge
      </Link>
      <nav className="flex items-center space-x-4">
        {auth.user ? (
          <>
            <span className="mr-4">Hi, {auth.user.username}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 text-white px-4 py-2 rounded shadow transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-blue-600 hover:underline">
              Log In
            </Link>
            <Link to="/signup" className="text-blue-600 hover:underline ml-4">
              Sign Up
            </Link>
          </>
        )}
        <DarkModeToggle />
      </nav>
    </header>
  );
}

// Protected route wrapper
function PrivateRoute({ children }) {
  const auth = useAuth();
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin Dashboard Component
function AdminDashboard() {
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
                          onClick={() => deleteUser (user._id)}
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


// Main App
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/post"
            element={
              <PrivateRoute>
                <PostFood />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
