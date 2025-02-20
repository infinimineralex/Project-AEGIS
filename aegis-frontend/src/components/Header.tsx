import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
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
        {/* TODO: Add navigation links or user profile here */}
      </div>
    </header>
  );
};

export default Header;