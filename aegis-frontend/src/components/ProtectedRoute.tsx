import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // Imports the AuthContext to check if the user is authenticated.

// Ensures children are valid JSX elements.
interface Props {
  children: JSX.Element;
}

// Redirects to the login page if the user is not authenticated.
const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;