import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import PasswordGenerator from '../components/PasswordGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiCopy, FiLock } from 'react-icons/fi';
import Notification from '../components/Notification';
import DeleteAccountModal from '../components/DeleteAccountModal';
import FeedbackPopup from '../components/FeedbackPopup';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

interface Credential {
  id: number;
  website: string;
  username: string;
  password: string; // Decrypted password
  notes: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const { token, decryptedKey, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [compromisedCredentials, setCompromisedCredentials] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const [form, setForm] = useState({
    website: '',
    username: '',
    password: '',
    notes: '',
  });

  const [editing, setEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // State to manage password visibility
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<number>>(new Set());

  // New state to toggle password visibility in the form
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);

  // New state for notification
  const [notification, setNotification] = useState<string>('');

  // New state for delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // New helper to check if password is pwned
  const checkIfPwned = async (password: string): Promise<boolean> => {
    const hash = CryptoJS.SHA1(password).toString().toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    try {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking HIBP API', error);
    }
    return false;
  };

  // Fetch credentials from backend
  const fetchCredentials = async () => {
    if (!token) {
      setError('Authentication token missing.');
      return;
    }

    try {
      const response = await api.get('/api/passwords', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Decrypt passwords
      const decryptedCredentials: Credential[] = response.data.credentials.map(
        (cred: any) => {
          const bytes = CryptoJS.AES.decrypt(cred.password, decryptedKey!);
          const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

          return {
            id: cred.id,
            website: cred.website,
            username: cred.username,
            password: decryptedPassword,
            notes: cred.notes,
            created_at: cred.created_at,
            updated_at: cred.updated_at,
          };
        }
      );

      setCredentials(decryptedCredentials);

      // Check each credential's password with HIBP API
      const compromisedSet = new Set<number>();
      await Promise.all(
        decryptedCredentials.map(async (cred) => {
          if (await checkIfPwned(cred.password)) {
            compromisedSet.add(cred.id);
          }
        })
      );
      setCompromisedCredentials(compromisedSet);
    } catch (err: any) {
      setError('Failed to fetch credentials.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle adding or updating credentials
  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decryptedKey) {
      setError('Encryption key missing.');
      return;
    }

    try {
      // Encrypt password
      const encryptedPassword = CryptoJS.AES.encrypt(
        form.password,
        decryptedKey
      ).toString();

      if (editing && currentId !== null) {
        // Update existing credential
        await api.put(
          `/api/passwords/${currentId}`,
          {
            website: form.website,
            username: form.username,
            password: encryptedPassword,
            notes: form.notes,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEditing(false);
        setCurrentId(null);
        setNotification('Credential updated successfully.');
      } else {
        // Create new credential
        await api.post(
          '/api/passwords',
          {
            website: form.website,
            username: form.username,
            password: encryptedPassword,
            notes: form.notes,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNotification('Credential added successfully.');
      }

      // Refresh credentials
      fetchCredentials();

      // Reset form
      setForm({
        website: '',
        username: '',
        password: '',
        notes: '',
      });
    } catch (err: any) {
      setError('Failed to save credential.');
      console.error(err);
    }
  };

  // Handle editing a credential
  const handleEdit = (cred: Credential) => {
    setForm({
      website: cred.website,
      username: cred.username,
      password: cred.password,
      notes: cred.notes,
    });
    setEditing(true);
    setCurrentId(cred.id);
  };

  // Handle deleting a credential
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    try {
      await api.delete(`/api/passwords/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchCredentials();
      setNotification('Credential deleted successfully.');
    } catch (err: any) {
      setError('Failed to delete credential.');
      console.error(err);
    }
  };

  // Handle password visibility toggle
  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswordIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: 'url(/public/background1.jpg)' }}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            {user && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Account
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {user && !user.is_verified && (
          <>
            {/* Updated progress bar for incomplete registration */}
            <div className="mb-4">
              <div className="text-gray-100 text-sm mb-1">Step 3 of 3: Verify Your Email</div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-red-500 h-2 rounded-full" 
                  style={{ width: `${(3/3)*100}%` }}
                />
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-red-500 text-white rounded">
              Please verify your email to add credentials.
              <button onClick={() => navigate('/verifyemail')} className="underline ml-2">
                Verify Now
              </button>
            </div>
          </>
        )}

        {/* Side-by-Side Layout for Form and Credentials */}
        <div className="flex flex-col md:flex-row gap-6 relative">
          {/* Credential Form - Always render but may be overlaid */}
          <motion.div
            className="w-full md:w-1/3 bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md relative hover:backdrop-blur-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Email Verification Overlay */}
            {user && !user.is_verified && (
              <motion.div
                className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-white/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <FiLock className="mb-4 h-24 w-24 text-white drop-shadow-lg" />
                <p className="mb-4 text-xl font-semibold text-white drop-shadow-lg">
                  Email Verification Required
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/verifyemail')}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-red-500 px-6 py-3 text-white shadow-lg hover:bg-gradient-to-l"
                >
                  Verify Your Email
                </motion.button>
              </motion.div>
            )}
            <div className={user && !user.is_verified ? "blur-sm" : ""}>
              <h2 className="text-xl font-semibold mb-4">
                {editing ? 'Edit Credential' : 'Add Credential'}
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-4">
                {/* Website Field */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-300">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    id="website"
                    required
                    value={form.website}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Password Field with Password Generator */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative z-10">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      required
                      value={form.password}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="mt-2 relative z-10 flex items-center">
                    <div className="flex-grow mr-2">
                      <PasswordStrengthIndicator password={form.password} />
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        type="button"
                        onClick={() => setShowFormPassword((prev) => !prev)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none"
                        title={showFormPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showFormPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                      </motion.button>
                      <PasswordGenerator
                        setPassword={(pwd: string) =>
                          setForm((prev) => ({ ...prev, password: pwd }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Notes Field */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    value={form.notes}
                    onChange={handleChange}
                    style={{ minHeight: '70px' }}
                    className="mt-1 block w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                  ></textarea>
                </div>

                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
                  >
                    {editing ? 'Update' : 'Add'}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Credentials List - No overlay */}
          <motion.div
            className="w-full md:w-2/3 bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md hover:backdrop-blur-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4">Your Credentials</h2>
            {credentials.length === 0 ? (
              <p className="text-gray-400">No credentials found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Website
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Password
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {credentials.map((cred) => (
                      <motion.tr key={cred.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{cred.website}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{cred.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className={`cursor-pointer px-2 py-1 rounded-md ${
                                visiblePasswordIds.has(cred.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-500 text-gray-300'
                              }`}
                              title="Toggle visibility"
                            >
                              {visiblePasswordIds.has(cred.id) ? cred.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cred.password);
                              }}
                              className="text-blue-400 hover:text-blue-300"
                              title="Copy Password"
                            >
                              <FiCopy size={18} />
                            </button>
                            <button
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {visiblePasswordIds.has(cred.id) ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{cred.notes}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {compromisedCredentials.has(cred.id) && (
                            <span className="text-red-500 font-semibold">Compromised</span>
                          )}
                          {!compromisedCredentials.has(cred.id) && (
                            <span className="text-green-500 font-semibold">Uncompromised</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(cred)}
                            className="text-indigo-400 hover:text-indigo-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cred.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
      <FeedbackPopup />
      <AnimatePresence>
        {notification && <Notification message={notification} onClose={() => setNotification('')} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;