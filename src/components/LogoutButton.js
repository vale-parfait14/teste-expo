import React from 'react';
import { Button } from 'react-bootstrap';
import { signOut } from 'firebase/auth';
import { auth } from '../components/firebase-config.js';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase
      await signOut(auth);
      
      // 2. Clear all localStorage data
      localStorage.clear();
      
      // 3. Navigate to home page
      navigate('/');
      
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <Button 
      variant="danger" 
      onClick={handleLogout}
      className="d-flex align-items-center gap-2"
    >
      <FaSignOutAlt /> Se déconnecter
    </Button>
  );
};

export default LogoutButton;
