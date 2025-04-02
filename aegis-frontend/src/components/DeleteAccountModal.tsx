import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

interface DeleteAccountModalProps {
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose }) => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestCode = async () => {
    if (!user) return;
    try {
      await api.post(
        '/api/user/request-delete-account',
        { userId: user.id, email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestSent(true);
      setMessage('Deletion code sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request deletion code.');
    }
  };

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.post(
        '/api/user/confirm-delete-account',
        { userId: user.id, code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      logout();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      //initial={{ opacity: 0.8 }}
      //animate={{ opacity: 1 }}
      //exit={{ opacity: 0.8 }}
    >
      <motion.div className="bg-white/20 backdrop-blur-md p-6 rounded shadow-md w-96" initial={{ y: -50 }} animate={{ y: 0 }}>
        <h2 className="text-xl font-semibold mb-4">Delete Account</h2>
        {error && <div className="mb-2 text-red-500">{error}</div>}
        {message && <div className="mb-2 text-green-500">{message}</div>}
        {!requestSent ? (
          <button
            onClick={handleRequestCode}
            className="w-full bg-red-500 text-white p-2 rounded mb-4 shadow-lg hover:bg-red-600"
          >
            Request Deletion Code
          </button>
        ) : (
          <form onSubmit={handleConfirmDeletion} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter deletion code"
              className="p-2 w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button type="submit" className="w-full bg-red-600 text-white p-2 rounded shadow-lg hover:bg-red-700">
              Confirm Account Deletion
            </button>
          </form>
        )}
        <button onClick={onClose} className="mt-4 text-white-500 underline">
          Cancel Delete Request
        </button>
      </motion.div>
    </motion.div>
  );
};

export default DeleteAccountModal;