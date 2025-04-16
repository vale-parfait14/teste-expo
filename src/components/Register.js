import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { FaUserShield, FaLock ,FaUser} from 'react-icons/fa';
function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const email = `${username}@admin.com`;
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/Manager');
    } catch (error) {
      setMessage('Identifiants administrateur incorrects');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Administration</h1>
          <p className="auth-subtitle">Accès réservé aux administrateurs</p>
        </div>

        {message && (
          <div className="auth-message error">
            {message}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="auth-form">
          <div className="input-group">
            <FaUserShield className="input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button primary">
            Connexion Administrateur
          </button>
          <div className="home-icon-container">
                  <FaUser  
                    className="home-icon"
                    title='Connexion utilisateur'
                    onClick={() => navigate('/')}
                  />
                </div>
        </form>
      </div>
    </div>
  );
}

export default Register;