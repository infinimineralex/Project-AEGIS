import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import { Jelly } from 'ldrs/react';
import 'ldrs/react/Jelly.css';

interface PasswordResetModalProps {
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose }) => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [requestSent, setRequestSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.post(
        '/api/user/request-password-reset',
        { userId: user.id, email: user.email },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      setRequestSent(true);
      setMessage('Reset code sent to your email.');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.post(
        '/api/user/confirm-password-reset',
        { userId: user.id, code: resetCode, newPassword },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      setMessage('Password reset successfully. Please log in with your new password.');
      setError('');
      // Logout user after password reset
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded">
          <Jelly size={50} speed={0.9} color="#fff" />
        </div>
      )}
      <motion.div className="bg-white/20 backdrop-blur-md p-6 rounded shadow-md w-96" initial={{ y: -50 }} animate={{ y: 0 }}>
        <h2 className="text-xl font-semibold mb-4 text-white">Reset Password</h2>
        {error && <div className="mb-2 text-red-500">{error}</div>}
        {message && <div className="mb-2 text-green-500">{message}</div>}
        {!requestSent ? (
            <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            >
                <button
                    onClick={handleRequestCode}
                    className="w-full text-white p-2 rounded mb-4 shadow-lg bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
                >
                    Request Reset Code
                </button>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter reset code"
              className="p-2 w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="p-2 w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
            />
            <PasswordStrengthIndicator password={newPassword} />
            <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            >
                <button type="submit" className="w-full text-white p-2 rounded mb-4 shadow-lg bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none">
                Reset Password
                </button>
            </motion.div>
          </form>
        )}
        <button onClick={onClose} className="mt-4 text-white underline">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

export default PasswordResetModal;
