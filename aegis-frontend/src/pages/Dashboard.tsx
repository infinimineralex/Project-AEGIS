import React, { useEffect, useState, useContext, useRef } from 'react';
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
import { FiAlertTriangle } from 'react-icons/fi';
import { Jelly } from 'ldrs/react';
import 'ldrs/react/Jelly.css';

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
  const [editPulse, setEditPulse] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<number>>(new Set());
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const fetchCredentials = async () => {
    if (!token) {
      setError('Authentication token missing.');
      return;
    }
    if (!decryptedKey) {
      console.warn('No decryption key yet, skipping fetch.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/passwords', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      setError('Failed to fetch credentials. If you got here by reloading, please do not access this this page with a reload. This is interpreted as malicious. As such, please log in again to see your passwords.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decryptedKey) {
      setError('Encryption key missing.');
      return;
    }

    setSaving(true);
    try {
      const encryptedPassword = CryptoJS.AES.encrypt(
        form.password,
        decryptedKey
      ).toString();

      if (editing && currentId !== null) {
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

      fetchCredentials();

      setForm({
        website: '',
        username: '',
        password: '',
        notes: '',
      });
    } catch (err: any) {
      setError('Failed to save credential.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cred: Credential) => {
    setForm({
      website: cred.website,
      username: cred.username,
      password: cred.password,
      notes: cred.notes,
    });
    setEditing(true);
    setCurrentId(cred.id);
    setEditPulse(true);
    setTimeout(() => setEditPulse(false), 1000);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this credential?')) return;
    setDeletingId(id);
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
    } finally {
      setDeletingId(null);
    }
  };

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 relative"
      style={{ backgroundImage: 'url(background2.jpg)' }}
    >
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Jelly size={60} speed={0.9} color="#fff" />
        </div>
      )}
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

        <div className="flex flex-col md:flex-row gap-6 relative">
          <motion.div
            ref={formRef}
            className={`w-full md:w-1/3 bg-white/20 backdrop-blur-md p-6 rounded-lg shadow-md relative hover:backdrop-blur-lg ${editPulse ? 'ring-4 ring-blue-500 animate-pulse' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {saving && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 rounded-lg">
                    <Jelly size={40} speed={0.9} color="#fff" />
                  </div>
            )}
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
                {editing ? (
                  <motion.span
                    initial={{ scale: 1 }}
                    animate={{ scale: [1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-blue-300"
                  >
                    Edit Credential
                  </motion.span>
                ) : 'Add Credential'}
              </h2>
              <form onSubmit={handleAddOrUpdate} className="space-y-4 relative">
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
                        className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 focus:outline-none group relative"
                      >
                        {showFormPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        <span className="absolute bottom-full mb-2 w-32 bg-white/20 backdrop-blur-md text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {showFormPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </motion.button>
                      <div className="relative group">
                        <PasswordGenerator
                          setPassword={(pwd: string) =>
                            setForm((prev) => ({ ...prev, password: pwd }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

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

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 rounded-md shadow-lg text-white bg-gradient-to-r from-blue-500 to-red-500 hover:bg-gradient-to-l focus:outline-none"
                  >
                    {editing ? 'Update' : 'Add'}
                  </button>
                </motion.div>
              </form>
            </div>
          </motion.div>

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
                  <tbody className="divide-y divide-gray-500">
                    {credentials.map((cred) => (
                      <motion.tr
                        key={cred.id}
                        className={`relative transition-colors duration-200 ${compromisedCredentials.has(cred.id) ? 'bg-red-900/40' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">{cred.website}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-200">{cred.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className={`cursor-pointer px-2 py-1 rounded-md font-mono ${
                                visiblePasswordIds.has(cred.id)
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-500 text-gray-300'
                              }`}
                              title="Toggle visibility"
                            >
                              {visiblePasswordIds.has(cred.id) ? cred.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(cred.password);
                                setNotification('Password copied!');
                              }}
                              className="text-blue-400 hover:text-blue-300 p-1 group relative"
                              title="Copy Password"
                            >
                              <FiCopy size={18} />
                               <span className="absolute bottom-full mb-2 w-auto min-w-max bg-black/70 backdrop-blur-sm text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                Copy Password
                              </span>
                            </button>
                            <button
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="text-blue-400 hover:text-blue-300 p-1 group relative"
                            >
                              {visiblePasswordIds.has(cred.id) ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                               <span className="absolute bottom-full mb-2 w-auto min-w-max bg-black/70 backdrop-blur-sm text-white text-xs rounded py-1 px-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                {visiblePasswordIds.has(cred.id) ? 'Hide Password' : 'Show Password'}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300 cursor-pointer max-w-xs" onClick={() => setExpandedNoteId(cred.id)}>
                          {cred.notes && cred.notes.length > 10 ? (
                            <span title="Click to expand">
                              {expandedNoteId === cred.id
                                ? cred.notes.slice(0, 10) + '...'
                                : cred.notes.slice(0, 10) + '...'} {/*do not change for now, may change rendering*/}
                            </span>
                          ) : (
                            cred.notes || '-'
                          )}
                          <AnimatePresence>
                            {expandedNoteId === cred.id && cred.notes && cred.notes.length > 10 && (
                              <motion.div
                                initial={{ opacity: 1, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 1, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center"
                                onClick={() => setExpandedNoteId(null)}
                              >
                                <div className="bg-gradient-to-r from-blue-500 to-red-500 rounded-lg p-6 max-w-lg w-full shadow-xl relative" onClick={e => e.stopPropagation()}>
                                  <h3 className="text-lg font-semibold mb-2 text-white text-shadow-xl">Full Note: </h3>
                                  <div className="text-white whitespace-pre-wrap break-words max-h-96 overflow-y-auto">{cred.notes}</div>
                                  <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 shadow-lg" onClick={() => setExpandedNoteId(null)}>Close</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap relative">
                          {compromisedCredentials.has(cred.id) ? (
                            <div className="flex items-center gap-2 group relative">
                              <FiAlertTriangle className="text-red-400" aria-label="Compromised" />
                              <span className="text-red-400 font-semibold cursor-help">
                                Compromised!
                              </span>
                              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-xs bg-black/80 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-normal z-30 shadow-lg pointer-events-none">
                                This password was found in a data breach. You should change it immediately!
                              </span>
                            </div>
                          ) : (
                            <span className="text-green-400 font-semibold">Secure</span>
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
                            className="text-red-400 hover:text-red-300 relative"
                            disabled={deletingId === cred.id}
                          >
                            {deletingId === cred.id ? (
                              <span className="flex items-center">
                                <Jelly size={20} speed={1.1} color="#fff" />
                                <span className="ml-2">Deleting...</span>
                              </span>
                            ) : (
                              'Delete'
                            )}
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