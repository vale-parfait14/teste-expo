import React, { useState } from 'react';
import { auth } from '../firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock, FaUserShield } from 'react-icons/fa';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/Accueil');
    } catch (error) {
      setMessage(isLogin ? 'Identifiants incorrects' : 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage('Veuillez entrer votre email pour réinitialiser le mot de passe');
      return;
    }
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Email de réinitialisation envoyé !');
    } catch (error) {
      setMessage('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/teste');
    } catch (error) {
      setMessage('Erreur de connexion avec Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-subtitle">
            {isLogin ? 'Connectez-vous pour continuer' : 'Inscrivez-vous pour commencer'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Inscription
          </button>
        </div>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button
            type="submit"
            className={`auth-button primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>

          {isLogin && (
            <button
              type="button"
              className="auth-link"
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              Mot de passe oublié ?
            </button>
          )}

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className={`auth-button google ${isLoading ? 'loading' : ''}`}
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <FaGoogle className="button-icon" />
            <span>Continuer avec Google</span>
          </button>
        </form>
        <div className="home-icon-container">
        <FaUserShield 
          className="home-icon"
          title='Connexion administrateur'
          onClick={() => navigate('/Admin')}
        />
      </div>
      </div>
    </div>
  );
}

export default Login;