import React, { useState, useContext } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const MIN_PASSWORD_LENGTH = 4;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    masterPassword: '',
    confirmMasterPassword: '',
  });

  const [error, setError] = useState<string>('');
  // state for two-factor enrollment
  const [twofaSecret, setTwofaSecret] = useState<string>('');
  const [twofaCode, setTwofaCode] = useState<string>('');
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [step, setStep] = useState<number>(1); // 1: basic info; 2: 2FA verification

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Submit basic registration info
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.masterPassword !== form.confirmMasterPassword) {
      setError('Master passwords do not match.');
      return;
    }
    
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (form.masterPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Master password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    try {
      const response = await api.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // If the response includes a two-factor secret, require 2FA verification.
      if (response.data.twofaSecret) {
        setTwofaSecret(response.data.twofaSecret);
        setTempUserId(response.data.userId);  // Ensure backend returns the new user’s id.
        setStep(2);
        setError('');
      } else {
        // Otherwise, log in directly.
        login(response.data.token, form.masterPassword, response.data.salt);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  // Step 2: Verify the 2FA code
  const handleTwofaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUserId) {
      setError('Temporary user data missing.');
      return;
    }
    try {
      const verifyResponse = await api.post('/api/auth/verify-2fa', {
        userId: tempUserId,
        token: twofaCode,
      });
      // After successful 2FA verification, log in the user.
      login(verifyResponse.data.token, form.masterPassword, verifyResponse.data.salt);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '2FA verification failed.');
    }
  };

  if (step === 2) {
    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(background2.jpg)' }}
      >
        <motion.div
          className="max-w-md w-full bg-white/20 backdrop-blur-md p-8 shadow-lg rounded"
          initial={{ opacity: 0.5, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="text-gray-100 text-sm mb-1">Step 2 of 3: 2FA Verification</div>
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-red-500 h-2 rounded-full" style={{ width: "66%" }}></div>
            </div>
          </div>
          <h2 className="mb-6 text-center text-3xl font-extrabold text-white">
            Setup Two‑Factor Authentication
          </h2>
          <p className="mb-4 text-gray-100">
            Scan the QR code below in your authenticator app, then enter the generated code.
          </p>
          <div className="flex justify-center mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-red-500 rounded shadow-lg">
              <div className="p-5 rounded bg-white">
                <QRCodeSVG value={twofaSecret} size={200} bgColor="#ffffff" fgColor="#000000" />
              </div>
            </div>
          </div>
          <form onSubmit={handleTwofaVerify} className="space-y-4">
            <input
              type="text"
              value={twofaCode}
              onChange={(e) => setTwofaCode(e.target.value)}
              placeholder="Enter 2FA code"
              className="w-full p-2 rounded bg-gray-600 border border-gray-500 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-red-500 p-2 rounded text-white hover:bg-gradient-to-l shadow-lg"
              >
                Verify 2FA Code
              </button>
            </motion.div>
          </form>
          {error && <p className="text-red-300 mt-2">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(background2.jpg)' }}
    >
      <motion.div
        className="max-w-md w-full bg-white/20 backdrop-blur-md p-8 shadow-lg rounded"
        initial={{ opacity: 0.5, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="text-gray-100 text-sm mb-1">Step 1 of 3: Enter Account Details</div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-red-500 h-2 rounded-full" style={{ width: "33%" }}></div>
          </div>
        </div>
        <h2 className="mb-6 text-center text-3xl font-extrabold text-white">
          Create an Account
        </h2>
        {error && <div className="mb-4 text-gray-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username, Email, Password, Master Password fields remain as before */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-100"
            >
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              value={form.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-100"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-100"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={form.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <PasswordStrengthIndicator password={form.password} />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-100"
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Master Password Field */}
          <div>
            <label
              htmlFor="masterPassword"
              className="block text-sm font-medium text-gray-100"
            >
              Master Password
            </label>
            <input
              type="password"
              name="masterPassword"
              id="masterPassword"
              required
              value={form.masterPassword}
              onChange={handleChange}
              placeholder="Set your master password for encryption"
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Confirm Master Password Field */}
          <div>
            <label
              htmlFor="confirmMasterPassword"
              className="block text-sm font-medium text-gray-100"
            >
              Confirm Master Password
            </label>
            <input
              type="password"
              name="confirmMasterPassword"
              id="confirmMasterPassword"
              required
              value={form.confirmMasterPassword}
              onChange={handleChange}
              placeholder="Re-enter your master password"
              className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <motion.div whileTap={{ scale: 1.05 }} whileHover={{ scale: 1.02 }}>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
            >
              Register
            </button>
          </motion.div>
        </form>
        <div className="mt-4 text-center text-gray-100">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300"
          >
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;