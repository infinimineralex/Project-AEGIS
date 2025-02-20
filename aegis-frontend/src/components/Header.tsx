import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-400 bg-white/20 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/">
            <motion.img
              src="/white1.png"
              alt="Aegis Logo"
              className="h-10 w-auto"
              initial={{ opacity: 0.2 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </Link>
          <h1 className="ml-3 text-white text-2xl font-bold">Aegis</h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-white">Logged in as {user.username}.</span>
              <Link
                to="/dashboard"
                className="text-white font-medium hover:text-indigo-500 transition-colors"
              >
                Dashboard
              </Link>
              <button
                className="text-white hover:text-indigo-500 transition-colors"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>    
              <Link
                to="/register"
                className="text-white hover:text-indigo-500 transition-colors"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="text-white hover:text-indigo-500 transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;