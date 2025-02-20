// CURRENTLY UNUSED
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Props {}

const MasterPasswordModal: React.FC<Props> = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [masterPassword, setMasterPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!masterPassword) {
      setError('Master password cannot be empty.');
      return;
    }

    // Here, I would typically verify the master password.
    // Since the master password isn't stored on the backend,
    // I just derive the key and proceed.

    // For enhanced security, I might prompt for master password again
    // when performing sensitive operations.

    // Derive encryption key
    // Assuming 'login' has already set the token,
    // and this modal is part of the login process
    // (Adjust based on context and flow)

    // We'll navigate to dashboard after setting the key
    login('', masterPassword); // Passing token as '' since login is already done
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <motion.div
        className="bg-gray-800 p-8 rounded-md shadow-lg w-11/12 max-w-md"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl mb-4 text-white">Enter Master Password</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="masterPassword"
              className="block text-sm font-medium text-gray-300"
            >
              Master Password
            </label>
            <input
              type="password"
              name="masterPassword"
              id="masterPassword"
              required
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
          >
            Submit
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default MasterPasswordModal;