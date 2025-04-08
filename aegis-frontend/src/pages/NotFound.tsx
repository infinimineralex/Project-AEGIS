import React from 'react';
import { Link } from 'react-router-dom';
import MouseMoveEffect from '../components/MouseMoveEffect';

const NotFound: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center" style={{ backgroundImage: 'url(background2.jpg)' }}>
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>
      {/* Mouse move flair */}
      <MouseMoveEffect />
      <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">404</h1>
      <p className="mb-8 drop-shadow-lg">If you're here, please navigate back to the homepage. This page was not found.</p>
      <Link to="/" className="px-8 py-4 bg-white text-indigo-500 font-bold rounded-lg drop-shadow-lg hover:bg-gray-200 transition-colors">Go Home</Link>
    </div>
  );
};

export default NotFound;