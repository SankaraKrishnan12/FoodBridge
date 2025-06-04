import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import DarkModeToggle from './DarkModeToggle';

export default function Header() {
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
