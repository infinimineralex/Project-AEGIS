import React, { useState, useContext } from 'react';
import api from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.masterPassword !== form.confirmMasterPassword) {
      setError('Master passwords do not match.');
      return;
    }

    try {
      const response = await api.post('/api/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Save token and derive encryption key
      login(response.data.token, form.masterPassword, response.data.salt);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
    style={{ backgroundImage: 'url(/src/assets/background1.jpg)' }}
    >
      <motion.div
              className="max-w-md w-full bg-white/20 backdrop-blur-md p-8 shadow-lg rounded"
              initial={{ opacity: 0.5, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
        <h2 className="mb-6 text-center text-3xl font-extrabold text-white">
          Register
        </h2>

        {error && <div className="mb-4 text-gray-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
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

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
            >
              Register
            </button>
          </motion.div>
        </form>

        {/* Link to Login */}
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