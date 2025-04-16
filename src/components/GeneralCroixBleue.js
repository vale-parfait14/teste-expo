import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Image, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../components/firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Swipeable } from 'react-swipeable';

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence, browserLocalPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaUserShield, FaLock, FaUser, FaUserMd, FaUserPlus, FaEnvelope, 
  FaPhone, FaCalendar, FaImage, FaClock, FaHospital, FaMapMarkerAlt, 
  FaGlobe, FaMobile, FaFile, FaArrowLeft, FaIdCard, FaVenusMars,
  FaShieldAlt, FaStethoscope, FaRegClock, FaRegCalendarAlt, FaEye, 
  FaEyeSlash, FaChevronLeft, FaChevronRight, FaCheck, FaTimes,
  FaArrowRight, FaFingerprint, FaCamera, FaInfoCircle, FaQuestion
} from 'react-icons/fa';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useSwipeable } from 'react-swipeable';

const GeneralCroixBleue
 = () => {
  const [formData, setFormData] = useState({
    insurances: []
  });
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState('patient');
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [structures, setStructures] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [orientation, setOrientation] = useState(window.orientation);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const formRef = useRef(null);
  
  const [insuranceOptions, setInsuranceOptions] = useState([
    { value: 'CNAM', label: 'CNAM' },
    { value: 'CNSS', label: 'CNSS' },
    { value: 'CNRPS', label: 'CNRPS' },
    { value: 'Assurance privée', label: 'Assurance privée' }
  ]);
  
  const [specialtyOptions, setSpecialtyOptions] = useState([
    { value: 'Médecine générale', label: 'Médecine générale' },
    { value: 'Cardiologie', label: 'Cardiologie' },
    { value: 'Pédiatrie', label: 'Pédiatrie' },
    { value: 'Dentisterie', label: 'Dentisterie' },
    { value: 'Dermatologie', label: 'Dermatologie' },
    { value: 'Gynécologie', label: 'Gynécologie' },
    { value: 'Ophtalmologie', label: 'Ophtalmologie' },
    { value: 'Orthopédie', label: 'Orthopédie' }
  ]);

  const [dayOptions] = useState([
    { value: 'Lundi', label: 'Lundi' },
    { value: 'Mardi', label: 'Mardi' },
    { value: 'Mercredi', label: 'Mercredi' },
    { value: 'Jeudi', label: 'Jeudi' },
    { value: 'Vendredi', label: 'Vendredi' },
    { value: 'Samedi', label: 'Samedi' },
    { value: 'Dimanche', label: 'Dimanche' }
  ]);

  // Gestion des swipes pour navigation mobile
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentStep < getMaxSteps()) {
        nextStep();
      }
    },
    onSwipedRight: () => {
      if (currentStep > 1) {
        prevStep();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  const getMaxSteps = () => {
    return 3; // Nombre maximal d'étapes pour tous les formulaires
  };

  useEffect(() => {
    setMounted(true);
    fetchStructures();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleOrientationChange = () => {
      setOrientation(window.orientation);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    setTimeout(() => {
      setShowLogo(false);
      setShowContent(true);
    }, 2000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });

  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });

  const [newUser, setNewUser] = useState({
    patient: {
      nom: '',
      prenom: '',
      age: '',
      sexe: '',
      telephone: '',
      email: '',
      password: '',
      adresse: '',
      antecedents: [],
      photo: null,
      visibility: 'private',
      structures: [],
      medecins: [],
      insurance: [],
    },
    doctor: {
      nom: '',
      prenom: '',
      specialite: [],
      telephone: '',
      email: '',
      password: '',
      photo: null,
      certifications: [],
      heureDebut: '',
      heureFin: '',
      joursDisponibles: [],
      structures: [],
      visibility: 'private',
      insurance: [],
    },
    structure: {
      name: '',
      email: '',
      password: '',
      address: '',
      creationYear: '',
      responsible: '',
      website: '',
      insurance: [],
      specialties: [],
      phones: {
        mobile: '',
        landline: ''
      },
      photoUrl: null,
      documents: {
        structureDocUrl: null,
        stateDocUrl: null
      }
    }
  });

  const fetchStructures = async () => {
    try {
      const structuresSnapshot = await getDocs(collection(db, "structures"));
      const structuresList = structuresSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setStructures(structuresList);
    } catch (error) {
      showMessage('Erreur lors du chargement des structures', 'danger');
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setMessage('');
    }, 5000);
  };

  const handleRoleChange = (role) => {
    setMessage('');
    setShowRegister(false);
    setActiveRole(role);
    setCurrentStep(1);
  };



  useEffect(() => {
    // Fonction pour calculer la hauteur correcte sur mobile
    const setVhVariable = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Exécuter au chargement et lors du redimensionnement
    setVhVariable();
    window.addEventListener('resize', setVhVariable);
    
    return () => {
      window.removeEventListener('resize', setVhVariable);
    };
  }, []);

  

  
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First check if this admin exists in Firestore
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", adminCredentials.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty && adminCredentials.email !== "admin@gmail.com") {
        showMessage('Accès non autorisé: Administrateur non reconnu', 'danger');
        setLoading(false);
        return;
      }

      // Proceed with login
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        adminCredentials.email, 
        adminCredentials.password
      );
      
      const user = userCredential.user;
      if (user) {
        // Check if super admin
        const isSuperAdmin = user.email === "admin@gmail.com";
        
        // Store admin info in localStorage
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('isSuperAdmin', isSuperAdmin);
        localStorage.setItem('adminData', JSON.stringify({
          email: user.email,
          lastLogin: user.metadata.lastSignInTime,
          creationTime: user.metadata.creationTime,
          isSuperAdmin: isSuperAdmin
        }));

        // Update last login in Firestore for regular admins
        if (!isSuperAdmin) {
          const adminDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, "admins", adminDoc.id), {
            lastLogin: new Date().toISOString()
          });
        }
        
        showMessage('Connexion réussie, redirection...', 'success');
        setTimeout(() => navigate('/Manager'), 1000);
      }
    } catch (error) {
      showMessage('Identifiants administrateur incorrects', 'danger');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showMessage('Email de réinitialisation envoyé. Vérifiez votre boîte de réception.', 'success');
      setShowForgotPassword(false);
    } catch (error) {
      showMessage(`Erreur: ${error.message}`, 'danger');
    }
    
    setLoading(false);
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Configuration de la persistance
      await setPersistence(auth, browserLocalPersistence);
      // Ajout pour sauvegarder le rôle actif
      localStorage.setItem('activeRole', activeRole);

      // 2. Authentification avec Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginCredentials.email,
        loginCredentials.password
      );

      // 3. Récupération des données utilisateur
      const user = userCredential.user;
      const userType = activeRole === 'patient' ? 'patients' :
                      activeRole === 'doctor' ? 'medecins' : 'structures';

      // 4. Requête Firestore pour les données spécifiques
      const q = query(
        collection(db, userType),
        where('uid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);

      // 5. Traitement et stockage des données
      if (!querySnapshot.empty) {
        const userData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
          lastLogin: new Date().toISOString() // Ajout d'un timestamp de connexion
        };
        
        // Stockage local des données
        localStorage.setItem(`${activeRole}Data`, JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Message de succès et redirection
        showMessage('Connexion réussie, redirection...', 'success');
        setTimeout(() => navigateToUserDashboard(activeRole), 1000);
      }
    } catch (error) {
      showMessage('Erreur de connexion: ' + error.message, 'danger');
    }
    setLoading(false);
  };

  const navigateToUserDashboard = (role) => {
    switch(role) {
      case 'patient':
        navigate('/PatientsDashboard');
        break;
      case 'doctor':
        navigate('/MedecinsDashboard');
        break;
      case 'structure':
        navigate('/structure-dashboard');
        break;
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérification de la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('La photo ne doit pas dépasser 5 Mo', 'warning');
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const takeMobilePhoto = () => {
    // Accéder à la caméra sur mobile
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // ou 'user' pour la caméra frontale
    
    input.onchange = (e) => {
      handlePhotoChange(e);
    };
    
    input.click();
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validation selon le rôle et l'étape
    if (activeRole === 'patient') {
      if (currentStep === 1) {
        if (!newUser.patient.nom) {
          errors.nom = 'Le nom est requis';
          isValid = false;
        }
        if (!newUser.patient.prenom) {
          errors.prenom = 'Le prénom est requis';
          isValid = false;
        }
        if (!newUser.patient.age) {
          errors.age = 'L\'âge est requis';
          isValid = false;
        } else if (newUser.patient.age < 0 || newUser.patient.age > 120) {
          errors.age = 'L\'âge doit être entre 0 et 120';
          isValid = false;
        }
        if (!newUser.patient.sexe) {
          errors.sexe = 'Le sexe est requis';
          isValid = false;
        }
        if (!newUser.patient.telephone) {
          errors.telephone = 'Le téléphone est requis';
          isValid = false;
        }
      } else if (currentStep === 3) {
        if (!newUser.patient.email) {
          errors.email = 'L\'email est requis';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(newUser.patient.email)) {
          errors.email = 'Format d\'email invalide';
          isValid = false;
        }
        if (!newUser.patient.password) {
          errors.password = 'Le mot de passe est requis';
          isValid = false;
        } else if (newUser.patient.password.length < 6) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
          isValid = false;
        }
      }
    } else if (activeRole === 'doctor') {
      if (currentStep === 1) {
        if (!newUser.doctor.nom) {
          errors.nom = 'Le nom est requis';
          isValid = false;
        }
        if (!newUser.doctor.prenom) {
          errors.prenom = 'Le prénom est requis';
          isValid = false;
        }
        if (!newUser.doctor.telephone) {
          errors.telephone = 'Le téléphone est requis';
          isValid = false;
        }
        if (!newUser.doctor.specialite || newUser.doctor.specialite.length === 0) {
          errors.specialite = 'Au moins une spécialité est requise';
          isValid = false;
        }
      } else if (currentStep === 2) {
        if (!newUser.doctor.joursDisponibles || newUser.doctor.joursDisponibles.length === 0) {
          errors.joursDisponibles = 'Sélectionnez au moins un jour';
          isValid = false;
        }
        if (!newUser.doctor.heureDebut) {
          errors.heureDebut = 'L\'heure de début est requise';
          isValid = false;
        }
        if (!newUser.doctor.heureFin) {
          errors.heureFin = 'L\'heure de fin est requise';
          isValid = false;
        }
      } else if (currentStep === 3) {
        if (!newUser.doctor.email) {
          errors.email = 'L\'email est requis';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(newUser.doctor.email)) {
          errors.email = 'Format d\'email invalide';
          isValid = false;
        }
        if (!newUser.doctor.password) {
          errors.password = 'Le mot de passe est requis';
          isValid = false;
        } else if (newUser.doctor.password.length < 6) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
          isValid = false;
        }
      }
    } else if (activeRole === 'structure') {
      if (currentStep === 1) {
        if (!newUser.structure.name) {
          errors.name = 'Le nom de la structure est requis';
          isValid = false;
        }
        if (!newUser.structure.address) {
          errors.address = 'L\'adresse est requise';
          isValid = false;
        }
        if (!newUser.structure.phones.mobile) {
          errors.mobile = 'Le téléphone mobile est requis';
          isValid = false;
        }
        if (!newUser.structure.creationYear) {
          errors.creationYear = 'L\'année de création est requise';
          isValid = false;
        }
        if (!newUser.structure.responsible) {
          errors.responsible = 'Le nom du responsable est requis';
          isValid = false;
        }
      } else if (currentStep === 3) {
        if (!newUser.structure.email) {
          errors.email = 'L\'email est requis';
          isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(newUser.structure.email)) {
          errors.email = 'Format d\'email invalide';
          isValid = false;
        }
        if (!newUser.structure.password) {
          errors.password = 'Le mot de passe est requis';
          isValid = false;
        } else if (newUser.structure.password.length < 6) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
          isValid = false;
        }
      }
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Afficher les erreurs et arrêter la soumission
      return;
    }
    
    setLoading(true);
    try {
      // 1. Configuration de la persistance
      await setPersistence(auth, browserLocalPersistence);
      localStorage.setItem('activeRole', activeRole);
  
      // 2. Création du compte Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser[activeRole].email,
        newUser[activeRole].password
      );
      const user = userCredential.user;
  
      // 3. Gestion de la photo de profil
      let photoUrl = '';
      if (photoFile) {
        const folder = activeRole === 'patient' ? 'patients' :
                      activeRole === 'doctor' ? 'doctors' : 'structures';
        const fileName = `${user.uid}_${Date.now()}_${photoFile.name}`;
        const photoRef = ref(storage, `${folder}/photos/${fileName}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }
  
      // 4. Préparation des données utilisateur
      const userData = {
        ...newUser[activeRole],
        photo: photoUrl,
        dateInscription: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        uid: user.uid,
        status: 'active',
        emailVerified: user.emailVerified
      };
  
      // 5. Ajout des données spécifiques selon le rôle
      if (activeRole === 'structure') {
        userData.insurance = newUser.structure.insurance || [];
        userData.specialties = newUser.structure.specialties || [];
      }
      if (activeRole === 'doctor') {
        userData.insurance = newUser.doctor.insurance || [];
        userData.specialite = newUser.doctor.specialite || [];
        userData.joursDisponibles = newUser.doctor.joursDisponibles || [];
      }
      if (activeRole === 'patient') {
        userData.insurance = newUser.patient.insurance || [];
      }
  
      // 6. Enregistrement dans Firestore
      const collectionName = activeRole === 'patient' ? 'patients' :
                            activeRole === 'doctor' ? 'medecins' : 'structures';
      const docRef = await addDoc(collection(db, collectionName), userData);
  
      // 7. Stockage local et session
      const completeUserData = { 
        id: docRef.id, 
        ...userData 
      };
      localStorage.setItem(`${activeRole}Data`, JSON.stringify(completeUserData));
      localStorage.setItem('isAuthenticated', 'true');
  
      // 8. Message de succès et redirection
      showMessage('Inscription réussie! Redirection...', 'success');
      setTimeout(() => navigateToUserDashboard(activeRole), 1500);
  
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      
      // Messages d'erreur personnalisés
      if (error.code === 'auth/email-already-in-use') {
        showMessage('Cette adresse email est déjà utilisée', 'danger');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('Adresse email invalide', 'danger');
      } else if (error.code === 'auth/weak-password') {
        showMessage('Le mot de passe est trop faible', 'danger');
      } else {
        showMessage('Erreur lors de l\'inscription: ' + error.message, 'danger');
      }
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (validateForm()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // L'utilisateur est connecté
        const userType = localStorage.getItem('activeRole') || 'patient';
        const q = query(
          collection(db, userType === 'patient' ? 'patients' : 
                       userType === 'doctor' ? 'medecins' : 'structures'),
          where('uid', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          };
          localStorage.setItem(`${userType}Data`, JSON.stringify(userData));
          navigateToUserDashboard(userType);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const renderPatientRegistrationStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaIdCard className="step-icon" />
              Informations personnelles
            </h5>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Nom"
                      value={newUser.patient.nom}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        patient: {...newUser.patient, nom: e.target.value}
                      })}
                      isInvalid={!!formErrors.nom}
                      required
                    />
                    {formErrors.nom && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.nom}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Prénom"
                      value={newUser.patient.prenom}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        patient: {...newUser.patient, prenom: e.target.value}
                      })}
                      isInvalid={!!formErrors.prenom}
                      required
                    />
                    {formErrors.prenom && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.prenom}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Âge</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaCalendar />
                    </span>
                    <Form.Control
                      type="number"
                      placeholder="Âge"
                      value={newUser.patient.age}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        patient: {...newUser.patient, age: e.target.value}
                      })}
                      isInvalid={!!formErrors.age}
                      required
                    />
                    {formErrors.age && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.age}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexe</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaVenusMars />
                    </span>
                    <Form.Select
                      value={newUser.patient.sexe}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        patient: {...newUser.patient, sexe: e.target.value}
                      })}
                      isInvalid={!!formErrors.sexe}
                      required
                    >
                      <option value="">Sélectionnez</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </Form.Select>
                    {formErrors.sexe && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.sexe}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaPhone />
                </span>
                <Form.Control
                  type="tel"
                  placeholder="Téléphone"
                  value={newUser.patient.telephone}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    patient: {...newUser.patient, telephone: e.target.value}
                  })}
                  isInvalid={!!formErrors.telephone}
                  required
                />
                {formErrors.telephone && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.telephone}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaMapMarkerAlt />
                </span>
                <Form.Control
                  type="text"
                  placeholder="Adresse"
                  value={newUser.patient.adresse}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    patient: {...newUser.patient, adresse: e.target.value}
                  })}
                />
              </div>
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowRight className="swipe-icon" />
              <span>Glissez pour continuer</span>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaShieldAlt className="step-icon" />
              Informations médicales
            </h5>
            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center">
                <FaShieldAlt className="me-2" />
                Assurance(s)
                <span className="ms-auto badge bg-info text-white">Facultatif</span>
              </Form.Label>
              <CreatableSelect
                isMulti
                name="insurances"
                options={insuranceOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={insuranceOptions.filter(option => 
                  newUser.patient.insurance?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    patient: {
                      ...newUser.patient,
                      insurance: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setInsuranceOptions([...insuranceOptions, newOption]);
                  setNewUser({
                    ...newUser,
                    patient: {
                      ...newUser.patient,
                      insurance: [...(newUser.patient.insurance || []), inputValue]
                    }
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez vos assurances..."
                noOptionsMessage={() => "Aucune assurance disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                  })
                }}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="d-flex align-items-center">
                <FaImage className="me-2" />
                Photo de profil
                <span className="ms-auto badge bg-info text-white">Facultatif</span>
              </Form.Label>
              <div className="photo-upload-container">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Aperçu" className="img-thumbnail" />
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="remove-photo"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <FaTimes /> Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="upload-options">
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      <FaImage className="upload-icon" />
                      <p>Galerie</p>
                      <input
                        id="photo-upload"
                        type="file"
                        className="file-input"
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                    </div>
                    
                    <div className="upload-divider">ou</div>
                    
                    <div 
                      className="upload-placeholder"
                      onClick={takeMobilePhoto}
                    >
                      <FaCamera className="upload-icon" />
                      <p>Caméra</p>
                    </div>
                  </div>
                )}
              </div>
              <Form.Text className="text-muted">
                Format JPG ou PNG, max 5 Mo
              </Form.Text>
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon me-2" />
              <span>Glissez pour naviguer</span>
              <FaArrowRight className="swipe-icon ms-2" />
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaFingerprint className="step-icon" />
              Créez votre compte
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={newUser.patient.email}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    patient: {...newUser.patient, email: e.target.value}
                  })}
                  isInvalid={!!formErrors.email}
                  required
                />
                {formErrors.email && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Mot de passe</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>
                <Form.Control
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={newUser.patient.password}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    patient: {...newUser.patient, password: e.target.value}
                  })}
                  isInvalid={!!formErrors.password}
                  required
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </Button>
                {formErrors.password && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                )}
              </div>
              <Form.Text className="text-muted">
                Le mot de passe doit contenir au moins 6 caractères
              </Form.Text>
            </Form.Group>
            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="termsCheck"
                required
              />
              <label className="form-check-label" htmlFor="termsCheck">
                J'accepte les <a href="#" className="text-primary">conditions d'utilisation</a> et la <a href="#" className="text-primary">politique de confidentialité</a>
              </label>
            </div>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon" />
              <span>Glissez pour revenir</span>
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="btn-submit">
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
                    Inscription...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" /> Terminer
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderDoctorRegistrationStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaIdCard className="step-icon" />
              Informations personnelles
            </h5>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Nom"
                      value={newUser.doctor.nom}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        doctor: {...newUser.doctor, nom: e.target.value}
                      })}
                      isInvalid={!!formErrors.nom}
                      required
                    />
                    {formErrors.nom && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.nom}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <Form.Control
                      type="text"
                      placeholder="Prénom"
                      value={newUser.doctor.prenom}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        doctor: {...newUser.doctor, prenom: e.target.value}
                      })}
                      isInvalid={!!formErrors.prenom}
                      required
                    />
                    {formErrors.prenom && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.prenom}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaPhone />
                </span>
                <Form.Control
                  type="tel"
                  placeholder="Téléphone"
                  value={newUser.doctor.telephone}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    doctor: {...newUser.doctor, telephone: e.target.value}
                  })}
                  isInvalid={!!formErrors.telephone}
                  required
                />
                {formErrors.telephone && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.telephone}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>
                <FaStethoscope className="me-2" />
                Spécialités médicales
              </Form.Label>
              <CreatableSelect
                isMulti
                name="specialties"
                options={specialtyOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={specialtyOptions.filter(option => 
                  newUser.doctor.specialite?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    doctor: {
                      ...newUser.doctor,
                      specialite: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setSpecialtyOptions([...specialtyOptions, newOption]);
                  setNewUser({
                    ...newUser,
                    doctor: {
                      ...newUser.doctor,
                      specialite: [...(newUser.doctor.specialite || []), inputValue]
                    }
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les spécialités..."
                noOptionsMessage={() => "Aucune spécialité disponible"}
                isInvalid={!!formErrors.specialite}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                    borderColor: formErrors.specialite ? '#dc3545' : base.borderColor,
                    '&:hover': {
                      borderColor: formErrors.specialite ? '#dc3545' : base.borderColor
                    }
                  })
                }}
                required
              />
              {formErrors.specialite && (
                <div className="text-danger mt-1 small">
                  {formErrors.specialite}
                </div>
              )}
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowRight className="swipe-icon" />
              <span>Glissez pour continuer</span>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaRegCalendarAlt className="step-icon" />
              Informations professionnelles
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaShieldAlt className="me-2" />
                Assurances acceptées
                <span className="ms-auto badge bg-info text-white">Facultatif</span>
              </Form.Label>
              <CreatableSelect
                isMulti
                name="insurances"
                options={insuranceOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={insuranceOptions.filter(option => 
                  newUser.doctor.insurance?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    doctor: {
                      ...newUser.doctor,
                      insurance: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setInsuranceOptions([...insuranceOptions, newOption]);
                  setNewUser({
                    ...newUser,
                    doctor: {
                      ...newUser.doctor,
                      insurance: [...(newUser.doctor.insurance || []), inputValue]
                    }
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les assurances..."
                noOptionsMessage={() => "Aucune option disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                  })
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaRegCalendarAlt className="me-2" />
                Jours de disponibilité
              </Form.Label>
              <Select
                isMulti
                name="days"
                options={dayOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={dayOptions.filter(option => 
                  newUser.doctor.joursDisponibles?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    doctor: {
                      ...newUser.doctor,
                      joursDisponibles: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                placeholder="Sélectionnez vos jours de disponibilité..."
                noOptionsMessage={() => "Aucun jour disponible"}
                isInvalid={!!formErrors.joursDisponibles}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                    borderColor: formErrors.joursDisponibles ? '#dc3545' : base.borderColor,
                    '&:hover': {
                      borderColor: formErrors.joursDisponibles ? '#dc3545' : base.borderColor
                    }
                  })
                }}
                required
              />
              {formErrors.joursDisponibles && (
                <div className="text-danger mt-1 small">
                  {formErrors.joursDisponibles}
                </div>
              )}
            </Form.Group>
            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaRegClock className="me-2" />
                    Heure de début
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={newUser.doctor.heureDebut}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      doctor: {...newUser.doctor, heureDebut: e.target.value}
                    })}
                    isInvalid={!!formErrors.heureDebut}
                    required
                  />
                  {formErrors.heureDebut && (
                    <Form.Control.Feedback type="invalid">
                      {formErrors.heureDebut}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaRegClock className="me-2" />
                    Heure de fin
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={newUser.doctor.heureFin}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      doctor: {...newUser.doctor, heureFin: e.target.value}
                    })}
                    isInvalid={!!formErrors.heureFin}
                    required
                  />
                  {formErrors.heureFin && (
                    <Form.Control.Feedback type="invalid">
                      {formErrors.heureFin}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>
                <FaImage className="me-2" />
                Photo de profil
                <span className="ms-auto badge bg-info text-white">Facultatif</span>
              </Form.Label>
              <div className="photo-upload-container">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Aperçu" className="img-thumbnail" />
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="remove-photo"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <FaTimes /> Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="upload-options">
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      <FaImage className="upload-icon" />
                      <p>Galerie</p>
                      <input
                        id="photo-upload"
                        type="file"
                        className="file-input"
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                    </div>
                    
                    <div className="upload-divider">ou</div>
                    
                    <div 
                      className="upload-placeholder"
                      onClick={takeMobilePhoto}
                    >
                      <FaCamera className="upload-icon" />
                      <p>Caméra</p>
                    </div>
                  </div>
                )}
              </div>
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon me-2" />
              <span>Glissez pour naviguer</span>
              <FaArrowRight className="swipe-icon ms-2" />
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaFingerprint className="step-icon" />
              Créez votre compte
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={newUser.doctor.email}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    doctor: {...newUser.doctor, email: e.target.value}
                  })}
                  isInvalid={!!formErrors.email}
                  required
                />
                {formErrors.email && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Mot de passe</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>
                <Form.Control
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={newUser.doctor.password}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    doctor: {...newUser.doctor, password: e.target.value}
                  })}
                  isInvalid={!!formErrors.password}
                  required
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </Button>
                {formErrors.password && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                )}
              </div>
              <Form.Text className="text-muted">
                Le mot de passe doit contenir au moins 6 caractères
              </Form.Text>
            </Form.Group>
            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="termsCheck"
                required
              />
              <label className="form-check-label" htmlFor="termsCheck">
                J'accepte les <a href="#" className="text-primary">conditions d'utilisation</a> et la <a href="#" className="text-primary">politique de confidentialité</a>
              </label>
            </div>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon" />
              <span>Glissez pour revenir</span>
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="btn-submit">
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
                    Inscription...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" /> Terminer
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderStructureRegistrationStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaHospital className="step-icon" />
              Informations générales
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>Nom de la structure</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaHospital /></span>
                <Form.Control
                  type="text"
                  placeholder="Nom de la structure"
                  value={newUser.structure.name}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {...newUser.structure, name: e.target.value}
                  })}
                  isInvalid={!!formErrors.name}
                  required
                />
                {formErrors.name && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaMapMarkerAlt /></span>
                <Form.Control
                  type="text"
                  placeholder="Adresse"
                  value={newUser.structure.address}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {...newUser.structure, address: e.target.value}
                  })}
                  isInvalid={!!formErrors.address}
                  required
                />
                {formErrors.address && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.address}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone mobile</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaMobile /></span>
                    <Form.Control
                      type="tel"
                      placeholder="Téléphone mobile"
                      value={newUser.structure.phones.mobile}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        structure: {
                          ...newUser.structure,
                          phones: {...newUser.structure.phones, mobile: e.target.value}
                        }
                      })}
                      isInvalid={!!formErrors.mobile}
                      required
                    />
                    {formErrors.mobile && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.mobile}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone fixe</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaPhone /></span>
                    <Form.Control
                      type="tel"
                      placeholder="Téléphone fixe"
                      value={newUser.structure.phones.landline}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        structure: {
                          ...newUser.structure,
                          phones: {...newUser.structure.phones, landline: e.target.value}
                        }
                      })}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Année de création</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaCalendar /></span>
                    <Form.Control
                      type="number"
                      placeholder="Année de création"
                      value={newUser.structure.creationYear}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        structure: {...newUser.structure, creationYear: e.target.value}
                      })}
                      isInvalid={!!formErrors.creationYear}
                      required
                    />
                    {formErrors.creationYear && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.creationYear}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Responsable</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text"><FaUser /></span>
                    <Form.Control
                      type="text"
                      placeholder="Responsable"
                      value={newUser.structure.responsible}
                      onChange={(e) => setNewUser({
                        ...newUser,
                        structure: {...newUser.structure, responsible: e.target.value}
                      })}
                      isInvalid={!!formErrors.responsible}
                      required
                    />
                    {formErrors.responsible && (
                      <Form.Control.Feedback type="invalid">
                        {formErrors.responsible}
                      </Form.Control.Feedback>
                    )}
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Site web</Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaGlobe /></span>
                <Form.Control
                  type="url"
                  placeholder="Site web (facultatif)"
                  value={newUser.structure.website}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {...newUser.structure, website: e.target.value}
                  })}
                />
              </div>
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowRight className="swipe-icon" />
              <span>Glissez pour continuer</span>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaStethoscope className="step-icon" />
              Informations médicales
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaShieldAlt className="me-2" />
                Assurances acceptées
              </Form.Label>
              <CreatableSelect
                isMulti
                name="insurances"
                options={insuranceOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={insuranceOptions.filter(option => 
                  newUser.structure.insurance?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      insurance: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setInsuranceOptions([...insuranceOptions, newOption]);
                  setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      insurance: [...(newUser.structure.insurance || []), inputValue]
                    }
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les assurances..."
                noOptionsMessage={() => "Aucune option disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                  })
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaStethoscope className="me-2" />
                Spécialités médicales
              </Form.Label>
              <CreatableSelect
                isMulti
                name="specialties"
                options={specialtyOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={specialtyOptions.filter(option => 
                  newUser.structure.specialties?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      specialties: selectedOptions ? selectedOptions.map(option => option.value) : []
                    }
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setSpecialtyOptions([...specialtyOptions, newOption]);
                  setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      specialties: [...(newUser.structure.specialties || []), inputValue]
                    }
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les spécialités..."
                noOptionsMessage={() => "Aucune spécialité disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                  })
                }}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Photo de l'établissement</Form.Label>
              <div className="photo-upload-container">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Aperçu" className="img-thumbnail" />
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="remove-photo"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <FaTimes /> Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="upload-options">
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      <FaImage className="upload-icon" />
                      <p>Galerie</p>
                      <input
                        id="photo-upload"
                        type="file"
                        className="file-input"
                        onChange={handlePhotoChange}
                        accept="image/*"
                      />
                    </div>
                    
                    <div className="upload-divider">ou</div>
                    
                    <div 
                      className="upload-placeholder"
                      onClick={takeMobilePhoto}
                    >
                      <FaCamera className="upload-icon" />
                      <p>Caméra</p>
                    </div>
                  </div>
                )}
              </div>
            </Form.Group>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon me-2" />
              <span>Glissez pour naviguer</span>
              <FaArrowRight className="swipe-icon ms-2" />
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button onClick={nextStep} className="btn-next">
                Continuer <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            {...handlers}
            className="form-step"
          >
            <h5 className="step-title">
              <FaFingerprint className="step-icon" />
              Créez votre compte
            </h5>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaEnvelope />
                </span>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={newUser.structure.email}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {...newUser.structure, email: e.target.value}
                  })}
                  isInvalid={!!formErrors.email}
                  required
                />
                {formErrors.email && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                )}
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Mot de passe</Form.Label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaLock />
                </span>
                <Form.Control
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={newUser.structure.password}
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {...newUser.structure, password: e.target.value}
                  })}
                  isInvalid={!!formErrors.password}
                  required
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </Button>
                {formErrors.password && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                )}
              </div>
              <Form.Text className="text-muted">
                Le mot de passe doit contenir au moins 6 caractères
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaFile className="me-2" />
                Document de la structure
              </Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaFile /></span>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      documents: {
                        ...newUser.structure.documents,
                        structureDocUrl: e.target.files[0]
                      }
                    }
                  })}
                  accept=".pdf,.doc,.docx"
                />
              </div>
              <Form.Text className="text-muted">
                Licence, autorisation ou autre document officiel
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>
                <FaFile className="me-2" />
                Document d'état
              </Form.Label>
              <div className="input-group">
                <span className="input-group-text"><FaFile /></span>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewUser({
                    ...newUser,
                    structure: {
                      ...newUser.structure,
                      documents: {
                        ...newUser.structure.documents,
                        stateDocUrl: e.target.files[0]
                      }
                    }
                  })}
                  accept=".pdf,.doc,.docx"
                />
              </div>
              <Form.Text className="text-muted">
                Document d'enregistrement officiel
              </Form.Text>
            </Form.Group>
            <div className="form-check mb-4">
              <input
                type="checkbox"
                className="form-check-input"
                id="termsCheck"
                required
              />
              <label className="form-check-label" htmlFor="termsCheck">
                J'accepte les <a href="#" className="text-primary">conditions d'utilisation</a> et la <a href="#" className="text-primary">politique de confidentialité</a>
              </label>
            </div>
            <div className="swipe-hint">
              <FaArrowLeft className="swipe-icon" />
              <span>Glissez pour revenir</span>
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="outline-secondary" onClick={prevStep}>
                <FaArrowLeft className="me-2" /> Retour
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="btn-submit">
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
                    Inscription...
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" /> Terminer
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const renderForgotPasswordForm = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="form-step"
      >
        <h5 className="step-title text-center">
          <FaQuestion className="step-icon" />
          Mot de passe oublié
        </h5>
        <p className="text-center text-muted mb-4">
          Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
        <Form onSubmit={handleForgotPassword}>
          <Form.Group className="mb-4">
            <Form.Label>Email</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaEnvelope />
              </span>
              <Form.Control
                type="email"
                placeholder="Votre adresse email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
          </Form.Group>
          <div className="d-grid gap-2 mb-3">
            <Button type="submit" variant="primary" disabled={loading}>
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
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>
          </div>
          <div className="text-center">
            <Button 
              variant="link" 
              className="p-0 text-secondary" 
              onClick={() => setShowForgotPassword(false)}
            >
              <FaArrowLeft className="me-2" /> Retour à la connexion
            </Button>
          </div>
        </Form>
      </motion.div>
    );
  };

  return (
    <Container fluid className="auth-container min-vh-100 d-flex align-items-center justify-content-center p-0">
      <Row className="w-100 m-0">
        {showLogo && (
          <Col xs={12} className="text-center mb-5">
            <div className="logo-container">
              <div className="text">
                <span className="letter s">C</span>
                <span className="letter e">C</span>
                <span className="letter n">B</span>
              </div>
            </div>
            <div className="loading-text">Chargement</div>
          </Col>
        )}

        {showContent && (
          <Col xs={12} sm={10} md={8} lg={6} className="p-0 mx-auto">
            <Card className="auth-card shadow-lg border-0 rounded-4">
              <Card.Header className="bg-white border-0 pt-4 pb-0 px-4">
                <div className="text-center mb-3">
                  <div className="logo-small">
                    <span className="logo-icon">+</span>
                    <span className="logo-text">CROIX BLEUE</span>
                  </div>
                </div>
                <Tabs
                  activeKey={activeRole}
                  onSelect={handleRoleChange}
                  className="mb-0 nav-fill custom-tabs"
                >
                  <Tab eventKey="patient" title={<><FaUser className="tab-icon" /><span className="tab-text">Patient</span></>} />
                  <Tab eventKey="doctor" title={<><FaUserMd className="tab-icon" /><span className="tab-text">Médecin</span></>} />
                  <Tab eventKey="structure" title={<><FaHospital className="tab-icon" /><span className="tab-text">Structure</span></>} />
                  <Tab eventKey="admin" title={<><FaUserShield className="tab-icon" /><span className="tab-text">Admin</span></>} />
                </Tabs>
              </Card.Header>
              {mounted && (
                <Card.Body className="p-4">
                  {message && (
                    <Alert variant={messageType} onClose={() => setMessage('')} dismissible className="mb-4 alert-custom">
                      {message}
                    </Alert>
                  )}

                  {activeRole === 'admin' ? (
                    <Form key="admin-form" onSubmit={handleAdminLogin} className="animate__animated animate__fadeIn">
                      <div className="text-center mb-4">
                        <div className="role-icon admin-icon">
                          <FaUserShield />
                        </div>
                        <h4 className="mt-3">Connexion Administrateur</h4>
                        <p className="text-muted">Accédez au panneau d'administration</p>
                      </div>
                      <Form.Group className="mb-3">
                        <Form.Label>Email administrateur</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaEnvelope />
                          </span>
                          <Form.Control
                            type="email"
                            placeholder="Email administrateur"
                            value={adminCredentials.email}
                            onChange={(e) => setAdminCredentials({
                              ...adminCredentials,
                              email: e.target.value
                            })}
                            required
                          />
                        </div>
                      </Form.Group>
                    
                      <Form.Group className="mb-4">
                        <Form.Label>Mot de passe</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <Form.Control
                            type={passwordVisible ? "text" : "password"}
                            placeholder="Mot de passe"
                            value={adminCredentials.password}
                            onChange={(e) => setAdminCredentials({
                              ...adminCredentials,
                              password: e.target.value
                            })}
                            required
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => setPasswordVisible(!passwordVisible)}
                          >
                            {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </div>
                      </Form.Group>
                    
                      <Button
                        type="submit"
                        className="btn-primary w-100 py-3 mb-3"
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
                            Connexion...
                          </>
                        ) : (
                          'Connexion Administrateur'
                        )}
                      </Button>
                    </Form>
                  ) : (
                    !showRegister ? (
                      // Login Form for Patient/Doctor/Structure
                      showForgotPassword ? (
                        renderForgotPasswordForm()
                      ) : (
                        <Form key="login-form" onSubmit={handleUserLogin} className="animate__animated animate__fadeIn">
                          <div className="text-center mb-4">
                            <div className={`role-icon ${activeRole}-icon`}>
                              {activeRole === 'patient' ? <FaUser /> : 
                               activeRole === 'doctor' ? <FaUserMd /> : <FaHospital />}
                            </div>
                            <h4 className="mt-3">
                              {activeRole === 'patient' ? 'Connexion Patient' : 
                               activeRole === 'doctor' ? 'Connexion Médecin' : 'Connexion Structure'}
                            </h4>
                            <p className="text-muted">
                              {activeRole === 'patient' ? 'Accédez à votre espace patient' : 
                               activeRole === 'doctor' ? 'Gérez vos rendez-vous et patients' : 'Administrez votre établissement'}
                            </p>
                          </div>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaEnvelope />
                              </span>
                              <Form.Control
                                type="email"
                                placeholder="Email"
                                value={loginCredentials.email}
                                onChange={(e) => setLoginCredentials({
                                  ...loginCredentials,
                                  email: e.target.value
                                })}
                                required
                              />
                            </div>
                          </Form.Group>

                          <Form.Group className="mb-4">
                            <Form.Label>Mot de passe</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text">
                                <FaLock />
                              </span>
                              <Form.Control
                                type={passwordVisible ? "text" : "password"}
                                placeholder="Mot de passe"
                                value={loginCredentials.password}
                                onChange={(e) => setLoginCredentials({
                                  ...loginCredentials,
                                  password: e.target.value
                                })}
                                required
                              />
                              <Button 
                                variant="outline-secondary"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                              >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                              </Button>
                            </div>
                            <div className="d-flex justify-content-end mt-2">
                              <Button 
                                variant="link" 
                                className="p-0 text-primary small" 
                                onClick={() => setShowForgotPassword(true)}
                              >
                                Mot de passe oublié ?
                              </Button>
                            </div>
                          </Form.Group>

                          <Button type="submit" className="btn-primary w-100 py-3 mb-3" disabled={loading}>
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
                                Connexion...
                              </>
                            ) : (
                              'Se connecter'
                            )}
                          </Button>
                          
                          <div className="text-center mt-4">
                            <p className="mb-0">Vous n'avez pas de compte ?</p>
                            <Button 
                              variant="link" 
                              className="p-0 text-primary" 
                              onClick={() => setShowRegister(true)}
                            >
                              Inscrivez-vous maintenant
                            </Button>
                          </div>
                        </Form>
                      )
                    ) : (
                      // Registration Form
                      <Form key="register-form" ref={formRef} onSubmit={handleRegister} className="animate__animated animate__fadeIn">
                        <div className="text-center mb-4">
                          <div className={`role-icon ${activeRole}-icon`}>
                            {activeRole === 'patient' ? <FaUserPlus /> : 
                             activeRole === 'doctor' ? <FaUserMd /> : <FaHospital />}
                          </div>
                          <h4 className="mt-3">
                            {activeRole === 'patient' ? 'Inscription Patient' : 
                             activeRole === 'doctor' ? 'Inscription Médecin' : 'Inscription Structure'}
                          </h4>
                          <p className="text-muted">
                            {activeRole === 'patient' ? 'Créez votre compte patient' : 
                             activeRole === 'doctor' ? 'Rejoignez notre réseau médical' : 'Enregistrez votre établissement'}
                          </p>
                          
                          {/* Progress Steps */}
                          <div className="progress-steps">
                            <div 
                              className={`step ${currentStep >= 1 ? 'active' : ''}`}
                              onClick={() => currentStep > 1 && setCurrentStep(1)}
                            >
                              1
                            </div>
                            <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                            <div 
                              className={`step ${currentStep >= 2 ? 'active' : ''}`}
                              onClick={() => currentStep > 2 && setCurrentStep(2)}
                            >
                              2
                            </div>
                            <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                            <div 
                              className={`step ${currentStep >= 3 ? 'active' : ''}`}
                              onClick={() => currentStep > 3 && setCurrentStep(3)}
                            >
                              3
                            </div>
                          </div>
                        </div>

                        {activeRole === 'patient' && renderPatientRegistrationStep()}
                        {activeRole === 'doctor' && renderDoctorRegistrationStep()}
                        {activeRole === 'structure' && renderStructureRegistrationStep()}
                        
                        <div className="text-center mt-4">
                          <p className="mb-0">Vous avez déjà un compte ?</p>
                          <Button 
                            variant="link" 
                            className="p-0 text-primary" 
                            onClick={() => setShowRegister(false)}
                          >
                            Connectez-vous
                          </Button>
                          </div>
                      </Form>
                    )
                  )}
                </Card.Body>
              )}
            </Card>
          </Col>
        )}
        
        <style jsx>{`
  /* Définition de variable pour la hauteur de la vue */
  :root {
    --vh: 1vh;
  }

  .auth-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
  }
  
  .auth-card {
    overflow: hidden;
    transition: all 0.3s ease;
    margin: auto;
    border-radius: 1.5rem !important;
    max-width: 100%;
    width: 100%;
    max-height: 95vh;
    overflow-y: auto;
  }

  /* Assurer que la rangée est centrée */
  .row.w-100 {
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    min-height: calc(var(--vh, 1vh) * 100);
  }
  
  /* Centrer la colonne contenant la carte */
  .col-xs-12, .col-sm-10, .col-md-8, .col-lg-6 {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: auto;
  }
  
  .custom-tabs {
    border-bottom: none;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .custom-tabs .nav-link {
    border: none;
    border-radius: 0;
    color: #6c757d;
    padding: 0.75rem 0.5rem;
    transition: all 0.3s ease;
    position: relative;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .custom-tabs .nav-link.active {
    color: #4285f4;
    background-color: transparent;
    font-weight: 600;
  }
  
  .custom-tabs .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #4285f4;
    border-radius: 3px 3px 0 0;
  }
  
  .tab-icon {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .tab-text {
    font-size: 0.75rem;
  }
  
  .logo-container {
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .text {
    font-size: 70px;
    font-weight: bold;
    color: #4285f4;
    text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
  }
  
  .letter {
    display: inline-block;
    opacity: 0;
    animation: tracking-in-expand 1s ease-in-out forwards;
  }
  
  .letter.s {
    animation: tracking-in-expand 1s ease-in-out forwards,
             wave-effect 2s infinite ease-in-out 0.1s;
  }
  
  .letter.e {
    animation: tracking-in-expand 1s ease-in-out forwards,
             wave-effect 2s infinite ease-in-out 0.3s;
  }
  
  .letter.n {
    animation: tracking-in-expand 1s ease-in-out forwards,
             wave-effect 2s infinite ease-in-out 0.5s;
  }
  
  .logo-small {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .logo-icon {
    font-size: 1.4rem;
    font-weight: bold;
    color: white;
    background-color: #4285f4;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-right: 0.5rem;
    box-shadow: 0 4px 8px rgba(66, 133, 244, 0.3);
  }
  
  .logo-text {
    font-size: 1.2rem;
    font-weight: 700;
    color: #4285f4;
    letter-spacing: 1px;
  }
  
  .role-icon {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    margin: 0 auto;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .patient-icon {
    background-color: rgba(66, 133, 244, 0.1);
    color: #4285f4;
  }
  
  .doctor-icon {
    background-color: rgba(52, 168, 83, 0.1);
    color: #34a853;
  }
  
  .structure-icon {
    background-color: rgba(251, 188, 5, 0.1);
    color: #fbbc05;
  }
  
  .admin-icon {
    background-color: rgba(234, 67, 53, 0.1);
    color: #ea4335;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #4285f4, #0d6efd);
    border: none;
    box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
    transition: all 0.3s ease;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(13, 110, 253, 0.4);
  }
  
  .btn-next {
    background: linear-gradient(135deg, #4285f4, #0d6efd);
    border: none;
    box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
    transition: all 0.3s ease;
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
  }
  
  .btn-next:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(13, 110, 253, 0.4);
  }
  
  .btn-submit {
    background: linear-gradient(135deg, #34a853, #28a745);
    border: none;
    box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
    transition: all 0.3s ease;
    padding: 0.5rem 1.5rem;
    border-radius: 50px;
  }
  
  .btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(40, 167, 69, 0.4);
  }
  
  .step-title {
    margin-bottom: 1.25rem;
    font-weight: 600;
    color: #495057;
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 0.75rem;
    display: flex;
    align-items: center;
  }
  
  .step-icon {
    margin-right: 0.5rem;
    color: #4285f4;
  }
  
  .progress-steps {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1.5rem;
    margin-top: 1rem;
  }
  
  .step {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #e9ecef;
    color: #6c757d;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .step.active {
    background-color: #4285f4;
    color: white;
    box-shadow: 0 2px 5px rgba(66, 133, 244, 0.3);
  }
  
  .step-line {
    flex-grow: 1;
    height: 2px;
    background-color: #e9ecef;
    margin: 0 0.5rem;
    transition: all 0.3s ease;
  }
  
  .step-line.active {
    background-color: #4285f4;
  }
  
  .photo-upload-container {
    border: 2px dashed #dee2e6;
    border-radius: 0.5rem;
    padding: 0.75rem;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .photo-upload-container:hover {
    border-color: #4285f4;
  }
  
  .upload-options {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .upload-placeholder {
    cursor: pointer;
    padding: 1rem;
    flex: 1;
    position: relative;
  }
  
  .upload-divider {
    padding: 0 1rem;
    color: #6c757d;
  }
  
  .upload-icon {
    font-size: 2rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
  }
  
  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .photo-preview {
    position: relative;
  }
  
  .photo-preview img {
    max-height: 150px;
    margin: 0 auto;
    display: block;
    border-radius: 0.5rem;
  }
  
  .remove-photo {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 0.75rem;
  }
  
  .swipe-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    font-size: 0.8rem;
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: rgba(0,0,0,0.03);
    border-radius: 50px;
  }
  
  .swipe-icon {
    color: #4285f4;
    animation: swipe-animation 1.5s infinite ease-in-out;
    margin: 0 0.5rem;
  }
  
  .form-step {
    padding: 0.5rem 0;
  }
  
  .alert-custom {
    border-radius: 0.5rem;
    border-left-width: 4px;
  }
  
  .input-group {
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .input-group-text {
    background-color: #f8f9fa;
    border-right: none;
    color: #6c757d;
  }
  
  .form-control {
    border-left: none;
    height: 45px;
  }
  
  .form-control:focus {
    box-shadow: none;
    border-color: #ced4da;
    border-left: none;
  }
  
  .form-control:focus + .input-group-text {
    border-color: #ced4da;
  }
  
  @keyframes tracking-in-expand {
    0% {
      letter-spacing: -0.5em;
      opacity: 0;
    }
    40% {
      opacity: 0.6;
    }
    100% {
      letter-spacing: normal;
      opacity: 1;
    }
  }
  
  @keyframes wave-effect {
    0%, 100% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(-8px);
    }
    50% {
      transform: translateY(4px);
    }
    75% {
      transform: translateY(-4px);
    }
  }
  
  @keyframes loading-dots {
    0% { content: "."; }
    33% { content: ".."; }
    66% { content: "..."; }
    100% { content: "."; }
  }
  
  @keyframes swipe-animation {
    0%, 100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(3px);
    }
  }
  
  .loading-text {
    position: absolute;
    bottom: 20px;
    font-size: 16px;
    color: #6c757d;
  }
  
  .loading-text::after {
    content: ".";
    animation: loading-dots 1.5s infinite steps(1);
  }
  
  /* Styles spécifiques pour mobile */
  @media (max-width: 576px) {
    .auth-card {
      margin: auto;
      width: 95%;
      max-height: 95vh;
      border-radius: 1.5rem !important;
    }
    
    .card-body {
      padding: 1rem;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .role-icon {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }
    
    .form-label {
      font-size: 0.9rem;
    }
    
    .btn {
      font-size: 0.9rem;
    }
    
    .text {
      font-size: 50px;
    }
    
    .step {
      width: 24px;
      height: 24px;
      font-size: 0.75rem;
    }
    
    h4 {
      font-size: 1.25rem;
    }
    
    p {
      font-size: 0.85rem;
    }
    
    .form-text {
      font-size: 0.75rem;
    }
    
    .upload-icon {
      font-size: 1.5rem;
    }
    
    .upload-placeholder p {
      font-size: 0.75rem;
      margin-bottom: 0;
    }
    
    .custom-tabs .nav-link {
      padding: 0.5rem 0.25rem;
    }
    
    .tab-icon {
      font-size: 1.1rem;
    }
    
    .tab-text {
      font-size: 0.7rem;
    }
    
    .logo-icon {
      width: 30px;
      height: 30px;
      font-size: 1.2rem;
    }
    
    .logo-text {
      font-size: 1rem;
    }
  }
  
  /* Orientation landscape pour mobile */
  @media (max-height: 500px) and (orientation: landscape) {
    .auth-card {
      margin: 0;
      border-radius: 0 !important;
    }
    
    .progress-steps {
      margin-bottom: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .role-icon {
      width: 50px;
      height: 50px;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
    
    h4 {
      margin-top: 0.5rem !important;
      font-size: 1.1rem;
    }
    
    p.text-muted {
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
    }
    
    .card-body {
      padding: 0.75rem;
    }
    
    .step-title {
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      font-size: 1rem;
    }
    
    .form-group {
      margin-bottom: 0.5rem !important;
    }
    
    .form-control, .input-group-text, .btn {
      height: 38px;
      padding-top: 0.4rem;
      padding-bottom: 0.4rem;
    }
    
    .swipe-hint {
      margin-top: 0.5rem;
      padding: 0.25rem;
    }
  }
  
  /* React Select custom styling */
  .basic-multi-select {
    margin-bottom: 1rem;
  }
  
  .select__control {
    border-radius: 0.375rem !important;
    border-color: #dee2e6 !important;
    min-height: 45px !important;
  }
  
  .select__control:hover {
    border-color: #4285f4 !important;
  }
  
  .select__control--is-focused {
    box-shadow: 0 0 0 0.25rem rgba(66, 133, 244, 0.25) !important;
    border-color: #4285f4 !important;
  }
  
  .select__multi-value {
    background-color: rgba(66, 133, 244, 0.1) !important;
    border-radius: 0.25rem !important;
  }
  
  .select__multi-value__label {
    color: #4285f4 !important;
    font-size: 0.85rem !important;
  }
  
  .select__multi-value__remove:hover {
    background-color: #dc3545 !important;
    color: white !important;
  }
  
  .select__menu {
    z-index: 3 !important;
  }
  
  /* Styles pour l'accessibilité tactile */
  .form-check-input, .form-check-label {
    cursor: pointer;
  }
  
  .form-check-input {
    width: 1.2rem;
    height: 1.2rem;
  }
  
  .form-check-label {
    padding-left: 0.25rem;
  }
  
  /* Styles pour le mode sombre du système */
  @media (prefers-color-scheme: dark) {
    .auth-container {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    
    .auth-card {
      background-color: #222736;
      color: #e1e1e1;
    }
    
    .card-header {
      background-color: #222736 !important;
      border-color: #333a4d !important;
    }
    
    .text-muted {
      color: #a0a0a0 !important;
    }
    
    .custom-tabs .nav-link {
      color: #a0a0a0;
    }
    
    .custom-tabs .nav-link.active {
      color: #4285f4;
    }
    
    .form-control, .input-group-text {
      background-color: #2a2f40;
      border-color: #3a3f50;
      color: #e1e1e1;
    }
    
    .form-control::placeholder {
      color: #8a8a8a;
    }
    
    .select__control {
      background-color: #2a2f40 !important;
      border-color: #3a3f50 !important;
    }
    
    .select__single-value, .select__input {
      color: #e1e1e1 !important;
    }
    
    .select__menu {
      background-color: #2a2f40 !important;
    }
    
    .select__option {
      color: #e1e1e1 !important;
    }
    
    .select__option--is-focused {
      background-color: #3a3f50 !important;
    }
    
    .select__option--is-selected {
      background-color: #4285f4 !important;
    }
    
    .photo-upload-container {
      border-color: #3a3f50;
    }
    
    .step {
      background-color: #3a3f50;
      color: #a0a0a0;
    }
    
    .step-line {
      background-color: #3a3f50;
    }
    
    .swipe-hint {
      background-color: rgba(255,255,255,0.05);
    }
  }
`}</style>



      </Row>
    </Container>
  );
};

export default GeneralCroixBleue
;
