import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import VerifyEmail from './pages/VerifyEmail';
import NotFound from './pages/NotFound';


const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Initial page load loading screen (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Will display loading screen on every route change after the first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-darkGray text-white relative">
      <Header />
      {loading && <LoadingScreen />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verifyemail"
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;