import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import DeleteAccountModal from '../components/DeleteAccountModal';
import PasswordResetModal from '../components/PasswordResetModal';
import FeedbackPopup from '../components/FeedbackPopup';
import { Jelly } from 'ldrs/react';
import 'ldrs/react/Jelly.css';

const VerifyEmail: React.FC = () => {
  const { user, token, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [verificationCode, setVerificationCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCodeField, setShowCodeField] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!user) {
      setVerifyError('User not found.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post(
        '/api/user/verify-email',
        { userId: user.id, code: verificationCode },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      
      // Update user state with verification status and redirect to dashboard
      if (response.data.token) {
        updateUser(response.data.token);
        setVerificationCode('');
        navigate('/dashboard'); // Redirect to dashboard after successful verification
      }
      
      setVerifyMessage(response.data.message);
      setVerifyError('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Verification failed.';
      setVerifyError(errMsg);
      setVerifyMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setLoading(true);
    if (!user) {
      setVerifyError('User not found.');
      setLoading(false);
      return;
    }
    setShowCodeField(true);
    try {
      const response = await api.post(
        '/api/user/send-verification',
        { userId: user.id, email: user.email },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      setVerifyMessage(response.data.message);
      setVerifyError('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to send verification email.';
      setVerifyError(errMsg);
      setVerifyMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url(background2.jpg)' }}
    >
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Jelly size={60} speed={0.9} color="#fff" />
        </div>
      )}
      <motion.div className="max-w-md w-full bg-white/20 backdrop-blur-md p-8 shadow-lg rounded space-y-6">
        <h2 className="text-3xl font-extrabold text-white text-center">
          Account Settings
        </h2>

        <div className="space-y-4">
          {/* Email Verification Section */}
          <div className="p-4 rounded">
            <h3 className="text-xl font-semibold text-white">Email Verification</h3>
            {user && user.is_verified ? (
              <p className="text-green-300">Your email is verified.</p>
            ) : (
              <>
                <p className="text-yellow-300">Your email is not verified.</p>
                <div className="flex flex-col gap-2 mt-2">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      onClick={handleSendVerificationCode}
                      className="w-full bg-blue-500 p-2 rounded text-white hover:bg-blue-600 shadow-lg"
                      disabled={showCodeField}
                    >
                      Send Verification Code
                    </button>
                  </motion.div>
                  {showCodeField && (
                    <form onSubmit={handleVerifyEmail} className="space-y-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter verification code"
                        className="w-full p-2 rounded bg-gray-600 border border-gray-500 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                      >
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-red-500 p-2 rounded text-white hover:bg-gradient-to-l shadow-lg"
                        >
                        Verify Email
                        </button>
                      </motion.div>
                    </form>
                  )}
                </div>
                {verifyMessage && (
                  <p className="text-green-300 mt-2">{verifyMessage}</p>
                )}
                {verifyError && (
                  <p className="text-white mt-2">{verifyError}</p>
                )}
              </>
            )}
          </div>

          {/* Account Management Section */}
          <div className="p-4 rounded">
            <h3 className="text-xl font-semibold text-white">Account Management</h3>
            <div className="flex flex-col space-y-2 mt-2">
              <motion.div
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => setShowResetModal(true)}
                  className="w-full bg-gray-500 p-2 rounded text-white hover:bg-gray-600 shadow-lg"
                >
                  Reset Password
                </button>
              </motion.div>
              <motion.div
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full bg-red-500 p-2 rounded text-white hover:bg-red-600 shadow-lg"
                >
                  Delete Account
                </button>
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-white p-2 rounded text-indigo-600 hover:bg-gray-200 shadow-lg"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </motion.div>

      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
      {showResetModal && <PasswordResetModal onClose={() => setShowResetModal(false)} />}
      <FeedbackPopup />
    </div>
  );
};

export default VerifyEmail;