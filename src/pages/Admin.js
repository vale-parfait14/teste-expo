import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../components/firebase-config.js';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserShield, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaBuilding, 
  FaKey, FaShieldAlt, FaFingerprint, FaChartLine, FaClipboardCheck,
  FaTools, FaDatabase, FaUserCog, FaSignInAlt
} from 'react-icons/fa';

const Admin = ({ show, onHide }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [structureData, setStructureData] = useState(null);
  const [authCode, setAuthCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [adminPrivileges, setAdminPrivileges] = useState([]);
  const navigate = useNavigate();

  // Liste des privilèges administrateur
  const availablePrivileges = [
    { id: 'manage_users', label: 'Gestion des utilisateurs', icon: <FaUserCog className="me-2" /> },
    { id: 'analytics', label: 'Statistiques et rapports', icon: <FaChartLine className="me-2" /> },
    { id: 'system_config', label: 'Configuration système', icon: <FaTools className="me-2" /> },
    { id: 'data_access', label: 'Accès aux données', icon: <FaDatabase className="me-2" /> },
    { id: 'audit', label: 'Journal d\'audit', icon: <FaClipboardCheck className="me-2" /> }
  ];

  useEffect(() => {
    // Réinitialiser le formulaire quand le modal s'ouvre
    if (show) {
      setCredentials({ email: '', password: '' });
      setMessage('');
      setStep(1);
      setAuthCode('');
      setVerificationSent(false);
      setAdminPrivileges([]);
      setStructureData(null);
    }
  }, [show]);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verifyStructureCredentials = async () => {
    setLoading(true);
    try {
      // Vérifier si l'email correspond à une structure existante
      const structuresRef = collection(db, "structures");
      const q = query(structuresRef, where("email", "==", credentials.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        showMessage('Aucune structure trouvée avec cet email', 'danger');
        setLoading(false);
        return;
      }
      
      // Authentifier avec Firebase
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Récupérer les données de la structure
      const structureDoc = querySnapshot.docs[0];
      const structureData = { id: structureDoc.id, ...structureDoc.data() };
      setStructureData(structureData);
      
      // Générer un code de vérification à 6 chiffres
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Stocker temporairement le code dans Firestore
      await updateDoc(doc(db, "structures", structureDoc.id), {
        adminVerificationCode: verificationCode,
        adminVerificationExpiry: new Date(Date.now() + 10 * 60000) // 10 minutes
      });
      
      // Simuler l'envoi d'un email (dans une application réelle, utilisez une fonction cloud)
      console.log(`Code de vérification: ${verificationCode}`);
      
      setVerificationSent(true);
      setStep(2);
      showMessage('Un code de vérification a été envoyé à votre email', 'success');
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      showMessage('Identifiants incorrects', 'danger');
    }
    setLoading(false);
  };

  const verifyAuthCode = async () => {
    setLoading(true);
    try {
      if (!structureData) {
        showMessage('Erreur: données de structure manquantes', 'danger');
        setLoading(false);
        return;
      }
      
      // Récupérer les données à jour de la structure
      const structureRef = doc(db, "structures", structureData.id);
      const structureSnap = await getDoc(structureRef);
      
      if (!structureSnap.exists()) {
        showMessage('Erreur: structure non trouvée', 'danger');
        setLoading(false);
        return;
      }
      
      const currentStructureData = structureSnap.data();
      
      // Vérifier le code
      if (currentStructureData.adminVerificationCode !== authCode) {
        showMessage('Code de vérification incorrect', 'danger');
        setLoading(false);
        return;
      }
      
      // Vérifier l'expiration
      const expiryDate = currentStructureData.adminVerificationExpiry.toDate();
      if (expiryDate < new Date()) {
        showMessage('Code de vérification expiré', 'danger');
        setLoading(false);
        return;
      }
      
      // Code valide, passer à l'étape suivante
      setStep(3);
      
      // Déterminer les privilèges par défaut en fonction des données de la structure
      const defaultPrivileges = ['manage_users', 'analytics'];
      setAdminPrivileges(defaultPrivileges);
      
      showMessage('Code vérifié avec succès', 'success');
    } catch (error) {
      console.error("Erreur de vérification:", error);
      showMessage('Erreur lors de la vérification du code', 'danger');
    }
    setLoading(false);
  };

  const handlePrivilegeToggle = (privilegeId) => {
    setAdminPrivileges(prev => {
      if (prev.includes(privilegeId)) {
        return prev.filter(id => id !== privilegeId);
      } else {
        return [...prev, privilegeId];
      }
    });
  };

  const completeAdminAccess = async () => {
    setLoading(true);
    try {
      if (!structureData) {
        showMessage('Erreur: données de structure manquantes', 'danger');
        setLoading(false);
        return;
      }
      
      // Créer ou mettre à jour l'entrée admin dans Firestore
      const adminData = {
        email: credentials.email,
        structureId: structureData.id,
        structureName: structureData.name,
        privileges: adminPrivileges,
        lastLogin: new Date().toISOString(),
        isStructureAdmin: true
      };
      
      // Vérifier si un admin existe déjà pour cette structure
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("structureId", "==", structureData.id));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Créer un nouvel admin
        await addDoc(collection(db, "admins"), adminData);
      } else {
        // Mettre à jour l'admin existant
        const adminDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "admins", adminDoc.id), adminData);
      }
      
      // Nettoyer le code de vérification
      await updateDoc(doc(db, "structures", structureData.id), {
        adminVerificationCode: null,
        adminVerificationExpiry: null
      });
      
      // Stocker les informations d'admin dans localStorage
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('isSuperAdmin', false);
      localStorage.setItem('adminData', JSON.stringify({
        ...adminData,
        lastLogin: new Date().toISOString(),
        creationTime: new Date().toISOString(),
        isSuperAdmin: false
      }));
      
      showMessage('Accès administrateur accordé, redirection...', 'success');
      setTimeout(() => {
        onHide();
        navigate('/Manager');
      }, 1500);
      
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
      showMessage('Erreur lors de la configuration des privilèges', 'danger');
    }
    setLoading(false);
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-4">
        <div className="admin-icon-container mx-auto mb-3">
          <FaUserShield className="admin-icon" />
        </div>
        <h4 className="fw-bold">Accès Administrateur Structure</h4>
        <p className="text-muted">
          Utilisez les identifiants de votre structure pour accéder au panneau d'administration
        </p>
      </div>

      <Form.Group className="mb-3">
        <Form.Label className="d-flex align-items-center">
          <FaEnvelope className="me-2 text-primary" />
          Email de la structure
        </Form.Label>
        <div className="input-group">
          <span className="input-group-text bg-light">
            <FaBuilding />
          </span>
          <Form.Control
            type="email"
            name="email"
            placeholder="Email de la structure"
            value={credentials.email}
            onChange={handleInputChange}
            required
            className="form-control-lg"
          />
        </div>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label className="d-flex align-items-center">
          <FaLock className="me-2 text-primary" />
          Mot de passe
        </Form.Label>
        <div className="input-group">
          <span className="input-group-text bg-light">
            <FaKey />
          </span>
          <Form.Control
            type={passwordVisible ? "text" : "password"}
            name="password"
            placeholder="Mot de passe de la structure"
            value={credentials.password}
            onChange={handleInputChange}
            required
            className="form-control-lg"
          />
          <Button 
            variant="outline-secondary"
            onClick={() => setPasswordVisible(!passwordVisible)}
          >
            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
          </Button>
        </div>
      </Form.Group>

      <div className="d-grid gap-2">
        <Button
          variant="primary"
          size="lg"
          className="btn-admin-login"
          onClick={verifyStructureCredentials}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Vérification...
            </>
          ) : (
            <>
              <FaShieldAlt className="me-2" />
              Vérifier les identifiants
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-4">
        <div className="verification-icon-container mx-auto mb-3">
          <FaFingerprint className="verification-icon" />
        </div>
        <h4 className="fw-bold">Vérification en deux étapes</h4>
        <p className="text-muted">
          Un code de vérification a été envoyé à l'adresse email associée à votre structure
        </p>
      </div>

      <div className="verification-info alert alert-info">
        <div className="d-flex align-items-center">
          <FaEnvelope className="me-3 fs-4" />
          <div>
            <p className="mb-0 fw-bold">Email envoyé à:</p>
            <p className="mb-0">{credentials.email}</p>
          </div>
        </div>
      </div>

      <Form.Group className="mb-4">
        <Form.Label className="d-flex align-items-center">
          <FaKey className="me-2 text-primary" />
          Code de vérification
        </Form.Label>
        <div className="verification-code-input">
          <Form.Control
            type="text"
            placeholder="Entrez le code à 6 chiffres"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
            className="form-control-lg text-center"
            maxLength={6}
          />
        </div>
        <div className="text-center mt-2">
          <Button 
            variant="link" 
            className="p-0 text-primary" 
            onClick={() => {
              if (!loading) {
                verifyStructureCredentials();
              }
            }}
            disabled={loading}
          >
            Renvoyer le code
          </Button>
        </div>
      </Form.Group>

      <div className="d-grid gap-2">
        <Button
          variant="primary"
          size="lg"
          className="btn-verify-code"
          onClick={verifyAuthCode}
          disabled={loading || authCode.length !== 6}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Vérification...
            </>
          ) : (
            <>
              <FaShieldAlt className="me-2" />
              Vérifier le code
            </>
          )}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setStep(1)}
          disabled={loading}
        >
          Retour
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-4">
        <div className="success-icon-container mx-auto mb-3">
          <FaUserCog className="success-icon" />
        </div>
        <h4 className="fw-bold">Configuration des privilèges</h4>
        <p className="text-muted">
          Sélectionnez les privilèges administrateur pour votre structure
        </p>
      </div>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <h5 className="card-title d-flex align-items-center mb-3">
            <FaShieldAlt className="me-2 text-primary" />
            Privilèges disponibles
          </h5>
          
          <div className="privileges-list">
            {availablePrivileges.map(privilege => (
              <div key={privilege.id} className="privilege-item">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`privilege-${privilege.id}`}
                    checked={adminPrivileges.includes(privilege.id)}
                    onChange={() => handlePrivilegeToggle(privilege.id)}
                  />
                  <label className="form-check-label d-flex align-items-center" htmlFor={`privilege-${privilege.id}`}>
                    {privilege.icon}
                    {privilege.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className="structure-info alert alert-light border mb-4">
        <div className="d-flex align-items-center">
          <FaBuilding className="me-3 fs-4 text-primary" />
          <div>
            <p className="mb-0 fw-bold">{structureData?.name}</p>
            <p className="mb-0 text-muted small">{structureData?.address}</p>
          </div>
        </div>
      </div>

      <div className="d-grid gap-2">
        <Button
          variant="primary"
          size="lg"
          className="btn-complete-access"
          onClick={completeAdminAccess}
          disabled={loading || adminPrivileges.length === 0}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Configuration...
            </>
          ) : (
            <>
              <FaSignInAlt className="me-2" />
              Accéder au panneau d'administration
            </>
          )}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setStep(2)}
          disabled={loading}
        >
          Retour
        </Button>
      </div>
    </motion.div>
  );

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      className="admin-access-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <div className="modal-steps w-100 d-flex justify-content-center">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaUserShield />
            </div>
            <span className="step-text">Identifiants</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaFingerprint />
            </div>
            <span className="step-text">Vérification</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
            <div className="step-icon">
              <FaUserCog />
            </div>
            <span className="step-text">Privilèges</span>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {message && (
          <Alert 
            variant={messageType} 
            onClose={() => setMessage('')} 
            dismissible 
            className="mb-4 alert-custom"
          >
            {message}
          </Alert>
        )}
        
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </AnimatePresence>
      </Modal.Body>
      
      <style jsx>{`
        .admin-access-modal .modal-content {
          border-radius: 1rem;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .modal-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0 1rem;
          margin-bottom: 1rem;
        }
        
        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        
        .step-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #f1f3f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #adb5bd;
          font-size: 1.25rem;
          transition: all 0.3s ease;
          margin-bottom: 0.5rem;
        }
        
        .step-indicator.active .step-icon {
          background-color: #4285f4;
          color: white;
          box-shadow: 0 4px 10px rgba(66, 133, 244, 0.3);
          transform: scale(1.1);
        }
        
        .step-text {
          font-size: 0.8rem;
          color: #adb5bd;
          transition: all 0.3s ease;
        }
        
        .step-indicator.active .step-text {
          color: #4285f4;
          font-weight: 600;
        }
        
        .step-line {
          flex-grow: 1;
          height: 3px;
          background-color: #f1f3f5;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }
        
        .step-line.active {
          background-color: #4285f4;
        }
        
        .admin-icon-container, .verification-icon-container, .success-icon-container {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .admin-icon-container {
          background: linear-gradient(135deg, #4285f4, #0d6efd);
          box-shadow: 0 10px 20px rgba(13, 110, 253, 0.2);
        }
        
        .verification-icon-container {
          background: linear-gradient(135deg, #fd7e14, #ffc107);
          box-shadow: 0 10px 20px rgba(253, 126, 20, 0.2);
        }
        
        .success-icon-container {
          background: linear-gradient(135deg, #20c997, #198754);
          box-shadow: 0 10px 20px rgba(32, 201, 151, 0.2);
        }
        
        .admin-icon, .verification-icon, .success-icon {
          font-size: 2.5rem;
          color: white;
        }
        
        .btn-admin-login, .btn-verify-code, .btn-complete-access {
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2);
        }
        
        .btn-admin-login:hover, .btn-verify-code:hover, .btn-complete-access:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(13, 110, 253, 0.3);
        }
        
        .verification-code-input .form-control {
          letter-spacing: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .verification-info {
          border-left: 4px solid #0dcaf0;
          background-color: rgba(13, 202, 240, 0.1);
        }
        
        .structure-info {
          border-left: 4px solid #4285f4;
        }
        
        .privileges-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .privilege-item {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          background-color: #f8f9fa;
          transition: all 0.2s ease;
        }
        
        .privilege-item:hover {
          background-color: #e9ecef;
          transform: translateX(5px);
        }
        
        .form-check-input {
          width: 2.5rem;
          height: 1.25rem;
          margin-top: 0;
        }
        
        .form-check-input:checked {
          background-color: #4285f4;
          border-color: #4285f4;
        }
        
        .form-check-label {
          cursor: pointer;
          padding-left: 0.5rem;
          font-weight: 500;
        }
        
        @media (max-width: 576px) {
          .step-text {
            display: none;
          }
          
          .step-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
          
          .admin-icon-container, .verification-icon-container, .success-icon-container {
            width: 70px;
            height: 70px;
          }
          
          .admin-icon, .verification-icon, .success-icon {
            font-size: 2rem;
          }
        }
      `}</style>
    </Modal>
  );
};

export default Admin;
