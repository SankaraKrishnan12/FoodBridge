import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import PostFood from './components/PostFood';
import MyPosts from './components/MyPosts';
import MyClaims from './components/MyClaims';
import FoodDetail from './components/FoodDetail';
import AdminDashboard from './components/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/post"
              element={
                <PrivateRoute roles={['Donor', 'Admin']}>
                  <PostFood />
                </PrivateRoute>
              }
            />
            <Route
              path="/post/:id"
              element={
                <PrivateRoute roles={['Donor', 'Admin']}>
                  <PostFood />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-posts"
              element={
                <PrivateRoute roles={['Donor', 'Admin']}>
                  <MyPosts />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-claims"
              element={
                <PrivateRoute roles={['Recipient']}>
                  <MyClaims />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={['Admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/food/:id" element={<FoodDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="site-foot">FoodBridge · leftover meals, nearby people</footer>
      </AuthProvider>
    </BrowserRouter>
  );
}
