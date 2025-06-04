import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import PostFood from './components/PostFood';
import AdminDashboard from './components/AdminDashboard';
import PrivateRoute from './components/PrivateRoute'; 

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
