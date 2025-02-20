import React, { createContext, useState, useEffect, ReactNode } from 'react';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Imports the Axios instance to make API requests (TODO for use later)

interface User {
  id: number;
  username: string;
  // Add other user properties if available
}

// Defines the shape of the user data.
interface AuthContextType {
  user: User | null;
  token: string | null;
  decryptedKey: string | null;
  login: (token: string, masterPassword: string) => void;
  logout: () => void;
}
// Specifies the context's structure, including user info, token, and functions to login and logout.
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  decryptedKey: null,
  login: () => {},
  logout: () => {},
});

interface Props {
  children: ReactNode;
}

/* COMPONENT:
State Management: Manages user, token, and decryption key.
parseJWT Function: Decodes the JWT token to extract user information.
login Function: Stores the token in localStorage, sets the token state, and derives the encryption key from the master password.
logout Function: Clears authentication data and redirects to the login page.
*/
export const AuthProvider: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);

  // Function to parse JWT and extract user info
  const parseJWT = (token: string): User | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Failed to parse JWT:', err);
      return null;
    }
  };

  // Fetch user data when token changes
  useEffect(() => {
    if (token) {
      const userData = parseJWT(token);
      if (userData) {
        setUser(userData);
      } else {
        // Invalid token
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    }
  }, [token]);

  // Login function
  const login = (token: string, masterPassword: string) => {
    localStorage.setItem('token', token);
    setToken(token);

    // Derive encryption key from master password using SHA-256
    const key = CryptoJS.SHA256(masterPassword).toString();
    setDecryptedKey(key);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDecryptedKey(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, decryptedKey, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};