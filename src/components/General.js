import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../components/firebase-config.js';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaPhone, FaEnvelope, FaHome } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const AuthComponent = () => {
  const [view, setView] = useState('login');
  const [registerType, setRegisterType] = useState('medecin');
  const [showStructureRegister, setShowStructureRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showCustomMedecinSpecialite, setShowCustomMedecinSpecialite] = useState(false);
  const [showCustomAssurance, setShowCustomAssurance] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' ou 'phone'
  
  // États pour les menus déroulants
  const [showSpecialitesDropdown, setShowSpecialitesDropdown] = useState(false);
  const [showAssurancesDropdown, setShowAssurancesDropdown] = useState(false);
  const [showMedecinAssurancesDropdown, setShowMedecinAssurancesDropdown] = useState(false);
  const [showPatientAssurancesDropdown, setShowPatientAssurancesDropdown] = useState(false);
  
  // Références pour fermer les menus déroulants lors d'un clic à l'extérieur
  const specialitesDropdownRef = useRef(null);
  const assurancesDropdownRef = useRef(null);
  const medecinAssurancesDropdownRef = useRef(null);
  const patientAssurancesDropdownRef = useRef(null);
  
  const [formData, setFormData] = useState({
    // Champs communs
    email: '',
    password: '',
    telephone: '',
    
    // Champs structure
    nom: '',
    site: '',
    responsable: '',
    specialites: {}, // Modifié pour stocker plusieurs spécialités
    customSpecialite: '',
    assurances: {}, // Pour stocker plusieurs assurances
    customAssurance: '',
    
    // Champs médecin
    prenom: '',
    medecinSpecialite: '',
    customMedecinSpecialite: '',
    medecinAssurances: {}, // Pour stocker plusieurs assurances
    customMedecinAssurance: '',
    disponibilites: {
      lundi: { actif: false, debut: '08:00', fin: '18:00' },
      mardi: { actif: false, debut: '08:00', fin: '18:00' },
      mercredi: { actif: false, debut: '08:00', fin: '18:00' },
      jeudi: { actif: false, debut: '08:00', fin: '18:00' },
      vendredi: { actif: false, debut: '08:00', fin: '18:00' },
      samedi: { actif: false, debut: '08:00', fin: '18:00' },
      dimanche: { actif: false, debut: '08:00', fin: '18:00' }
    },
    
    // Champs patient
    dateNaissance: '',
    adresse: '',
    sexe: '',
    numeroAssurance: '',
    patientAssurances: {}, // Pour stocker plusieurs assurances
    customPatientAssurance: '',
    antecedentsMedicaux: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  // Listes pour les menus déroulants - Adaptées pour l'ophtalmologie
  const specialitesMedecin = [
    "Ophtalmologie générale",
    "Chirurgie réfractive",
    "Chirurgie de la cataracte",
    "Rétinologie",
    "Glaucome",
    "Ophtalmologie pédiatrique",
    "Neuro-ophtalmologie",
    "Cornée et surface oculaire",
    "Contactologie",
    "Autre"
  ];
  
  const assurancesList = ['CNAMGS', 'MAAB', 'Ascoma', 'Allianz', 'CNSS', 'NSIA', 'Sanlam', 'Autre'];
  const sexeOptions = ['Homme', 'Femme', 'Autre'];
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  // Effet pour gérer les clics en dehors des menus déroulants
  useEffect(() => {
    function handleClickOutside(event) {
      if (specialitesDropdownRef.current && !specialitesDropdownRef.current.contains(event.target)) {
        setShowSpecialitesDropdown(false);
      }
      if (assurancesDropdownRef.current && !assurancesDropdownRef.current.contains(event.target)) {
        setShowAssurancesDropdown(false);
      }
      if (medecinAssurancesDropdownRef.current && !medecinAssurancesDropdownRef.current.contains(event.target)) {
        setShowMedecinAssurancesDropdown(false);
      }
      if (patientAssurancesDropdownRef.current && !patientAssurancesDropdownRef.current.contains(event.target)) {
        setShowPatientAssurancesDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Effet pour vérifier l'état d'authentification au chargement
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // L'utilisateur est déjà connecté, vérifier son type et rediriger
        try {
          // Vérifier si l'utilisateur est une structure
          const structureDoc = await getDoc(doc(db, 'structures', user.uid));
          if (structureDoc.exists()) {
            navigate('/structuredashboard');
            return;
          }
          
          // Vérifier si l'utilisateur est un médecin
          const medecinDoc = await getDoc(doc(db, 'medecins', user.uid));
          if (medecinDoc.exists()) {
            navigate('/medecindashboard');
            return;
          }
          
          // Vérifier si l'utilisateur est un patient
          const patientDoc = await getDoc(doc(db, 'patients', user.uid));
          if (patientDoc.exists()) {
            navigate('/patientdashboard');
            return;
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du profil utilisateur:", error);
        }
      }
      setIsCheckingAuth(false);
    });
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [navigate]);

  // Effet pour effacer le message après 5 secondes
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Effet pour activer le mode structure après 3 clics sur le logo
  useEffect(() => {
    if (logoClicks >= 3) {
      setShowStructureRegister(true);
      setRegisterType('structure');
      setLogoClicks(0);
    }
  }, [logoClicks]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('disponibilites.')) {
      const [_, jour, prop] = name.split('.');
      setFormData(prev => ({
        ...prev,
        disponibilites: {
          ...prev.disponibilites,
          [jour]: {
            ...prev.disponibilites[jour],
            [prop]: type === 'checkbox' ? checked : value
          }
        }
      }));
    } else if (name === 'medecinSpecialite') {
      setShowCustomMedecinSpecialite(value === 'Autre');
      setFormData({ ...formData, [name]: value });
    } else if (name.startsWith('specialite-')) {
      // Gestion des cases à cocher de spécialité pour les structures
      const specialiteName = name.replace('specialite-', '');
      setFormData(prev => ({
        ...prev,
        specialites: {
          ...prev.specialites,
          [specialiteName]: checked
        }
      }));
    } else if (name.startsWith('assurance-')) {
      // Gestion des cases à cocher d'assurance pour les structures
      const assuranceName = name.replace('assurance-', '');
      setFormData(prev => ({
        ...prev,
        assurances: {
          ...prev.assurances,
          [assuranceName]: checked
        }
      }));
    } else if (name.startsWith('medecinAssurance-')) {
      // Gestion des cases à cocher d'assurance pour les médecins
      const assuranceName = name.replace('medecinAssurance-', '');
      setFormData(prev => ({
        ...prev,
        medecinAssurances: {
          ...prev.medecinAssurances,
          [assuranceName]: checked
        }
      }));
    } else if (name.startsWith('patientAssurance-')) {
      // Gestion des cases à cocher d'assurance pour les patients
      const assuranceName = name.replace('patientAssurance-', '');
      setFormData(prev => ({
        ...prev,
        patientAssurances: {
          ...prev.patientAssurances,
          [assuranceName]: checked
        }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCheckboxChange = (stateKey, itemName, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        [itemName]: isChecked
      }
    }));
  };

  // Fonction pour obtenir le texte à afficher sur le bouton du menu déroulant des spécialités
  const getSpecialitesButtonText = () => {
    const selectedSpecialites = Object.keys(formData.specialites).filter(key => formData.specialites[key]);
    if (selectedSpecialites.length === 0) return "Sélectionner les spécialités";
    if (selectedSpecialites.length === 1) return selectedSpecialites[0];
    return `${selectedSpecialites.length} spécialités sélectionnées`;
  };

  // Fonction pour obtenir le texte à afficher sur le bouton du menu déroulant des assurances
  const getAssurancesButtonText = (assurancesObj, defaultText) => {
    const selectedAssurances = Object.keys(assurancesObj).filter(key => assurancesObj[key]);
    if (selectedAssurances.length === 0) return defaultText;
    if (selectedAssurances.length === 1) return selectedAssurances[0];
    return `${selectedAssurances.length} assurances sélectionnées`;
  };

  // Fonction pour se connecter par téléphone
  const handlePhoneLogin = async () => {
    try {
      setLoading(true);
      
      if (!formData.telephone || !formData.password) {
        setMessage({ text: "Veuillez remplir tous les champs", type: 'error' });
        setLoading(false);
        return;
      }

      // Rechercher un utilisateur avec ce numéro de téléphone
      const patientsQuery = query(
        collection(db, 'patients'), 
        where("telephone", "==", formData.telephone)
      );
      
      const patientsSnapshot = await getDocs(patientsQuery);
      
      if (patientsSnapshot.empty) {
        setMessage({ text: "Aucun compte trouvé avec ce numéro de téléphone", type: 'error' });
        setLoading(false);
        return;
      }
      
      // Récupérer le premier patient correspondant
      const patientData = patientsSnapshot.docs[0].data();
      
      if (!patientData.email) {
        setMessage({ text: "Erreur: Ce compte n'a pas d'email associé", type: 'error' });
        setLoading(false);
        return;
      }
      
      // Utiliser l'email récupéré pour se connecter
      const auth = getAuth();
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, patientData.email, formData.password);
      
      setMessage({ text: 'Connexion réussie', type: 'success' });
      navigate('/patientdashboard');
      
    } catch (error) {
      setMessage({ text: "Numéro de téléphone ou mot de passe incorrect", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fonction de connexion modifiée pour gérer les deux méthodes
  const handleLogin = async () => {
    if (loginMethod === 'phone') {
      return handlePhoneLogin();
    }
    
    try {
      setLoading(true);
      
      // Définir la persistance à local par défaut pour garder l'utilisateur connecté
      const auth = getAuth();
      // Utilisation de browserLocalPersistence pour maintenir la session même après fermeture du navigateur
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Vérifier si l'utilisateur est une structure
      const structureDoc = await getDoc(doc(db, 'structures', user.uid));
      if (structureDoc.exists()) {
        setMessage({ text: 'Connexion réussie', type: 'success' });
        navigate('/structuredashboard');
        return;
      }
      
      // Vérifier si l'utilisateur est un médecin
      const medecinDoc = await getDoc(doc(db, 'medecins', user.uid));
      if (medecinDoc.exists()) {
        setMessage({ text: 'Connexion réussie', type: 'success' });
        navigate('/medecindashboard');
        return;
      }
      
      // Vérifier si l'utilisateur est un patient
      const patientDoc = await getDoc(doc(db, 'patients', user.uid));
      if (patientDoc.exists()) {
        setMessage({ text: 'Connexion réussie', type: 'success' });
        navigate('/patientdashboard');
        return;
      }
      
      // Si on arrive ici, l'utilisateur existe mais n'a pas de profil
      setMessage({ text: "Votre compte existe mais n'est associé à aucun profil. Veuillez contacter l'administrateur.", type: 'error' });
      await auth.signOut();
      
    } catch (error) {
      setMessage({ text: "Email ou mot de passe incorrect", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Convertir les objets en tableaux pour Firestore
  const getSelectedItems = (itemsObj) => {
    return Object.keys(itemsObj).filter(key => itemsObj[key]);
  };

  // Fonction spécifique pour les assurances qui gère le cas "Autre"
  const getSelectedAssurances = (assurancesObj, customValue) => {
    const selectedAssurances = Object.keys(assurancesObj).filter(key => assurancesObj[key]);
    
    // Ajouter l'assurance personnalisée si "Autre" est sélectionné
    if (assurancesObj["Autre"] && customValue) {
      selectedAssurances.push(customValue);
    }
    
    return selectedAssurances.length > 0 ? selectedAssurances : ["Non spécifiée"];
  };

  const handleRegisterStructure = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      // Définir la persistance avant l'inscription
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Obtenir les spécialités sélectionnées
      let selectedSpecialites = getSelectedItems(formData.specialites);
      
      // Ajouter la spécialité personnalisée si "Autre" est sélectionné
      if (formData.specialites["Autre"] && formData.customSpecialite) {
        selectedSpecialites.push(formData.customSpecialite);
      }
      
      // Si aucune spécialité n'est sélectionnée, utiliser "Non spécifiée"
      if (selectedSpecialites.length === 0) {
        selectedSpecialites = ["Non spécifiée"];
      }

      // Obtenir les assurances sélectionnées
      const selectedAssurances = getSelectedAssurances(formData.assurances, formData.customAssurance);

      await setDoc(doc(db, 'structures', user.uid), {
        nom: formData.nom || "Cabinet d'ophtalmologie",
        email: formData.email,
        site: formData.site || "",
        responsable: formData.responsable || "",
        specialites: selectedSpecialites,
        assurances: selectedAssurances,
        telephone: formData.telephone || "",
        dateCreation: new Date(),
        type: 'structure'
      });
      setMessage({ text: 'Inscription réussie', type: 'success' });
      navigate('/structuredashboard');
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMedecin = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      // Définir la persistance avant l'inscription
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Déterminer la spécialité finale
      let finalSpecialite = formData.medecinSpecialite;
      if (formData.medecinSpecialite === 'Autre' && formData.customMedecinSpecialite) {
        finalSpecialite = formData.customMedecinSpecialite;
      }

      // Obtenir les assurances sélectionnées
      const selectedAssurances = getSelectedAssurances(formData.medecinAssurances, formData.customMedecinAssurance);

      await setDoc(doc(db, 'medecins', user.uid), {
        nom: formData.nom || "Nom non spécifié",
        prenom: formData.prenom || "Prénom non spécifié",
        specialite: finalSpecialite || "Ophtalmologie générale",
        telephone: formData.telephone || "",
        email: formData.email,
        disponibilites: formData.disponibilites || {},
        assurances: selectedAssurances,
        dateCreation: new Date(),
        structureId: null,
        type: 'medecin'
      });
      setMessage({ text: 'Inscription réussie', type: 'success' });
      navigate('/medecindashboard');
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPatient = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      // Définir la persistance avant l'inscription
      await setPersistence(auth, browserLocalPersistence);
      
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Obtenir les assurances sélectionnées
      const selectedAssurances = getSelectedAssurances(formData.patientAssurances, formData.customPatientAssurance);

      await setDoc(doc(db, 'patients', user.uid), {
        nom: formData.nom || "Nom non spécifié",
        prenom: formData.prenom || "Prénom non spécifié",
        email: formData.email,
        telephone: formData.telephone || "",
        dateNaissance: formData.dateNaissance || "",
        adresse: formData.adresse || "",
        sexe: formData.sexe || "Non spécifié",
        numeroAssurance: formData.numeroAssurance || "",
        assurances: selectedAssurances,
        antecedentsMedicaux: formData.antecedentsMedicaux || "",
        dateCreation: new Date(),
        type: 'patient'
      });
      setMessage({ text: 'Inscription réussie', type: 'success' });
      navigate('/patientdashboard');
      
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (registerType === 'structure') {
      handleRegisterStructure();
    } else if (registerType === 'medecin') {
      handleRegisterMedecin();
    } else if (registerType === 'patient') {
      handleRegisterPatient();
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, formData.email);
      setMessage({ text: 'Email de réinitialisation envoyé', type: 'success' });
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Si nous sommes en train de vérifier l'authentification, afficher un indicateur de chargement
  if (isCheckingAuth) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Variantes d'animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        duration: 0.5 
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  // Hauteur fixe pour le formulaire
  const formHeight = 400; // Hauteur en pixels

  const CheckboxDropdown = ({ 
    items, 
    stateKey, 
    showDropdown, 
    setShowDropdown, 
    dropdownRef, 
    buttonText, 
    customField = null,
    label
  }) => {
    return (
      <div className="mb-3" ref={dropdownRef}>
        <label className="form-label">{label}</label>
        <div className="dropdown">
          <button 
            type="button" 
            className="form-select text-start d-flex justify-content-between align-items-center" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            <span>{buttonText}</span>
            <i className={`bi bi-chevron-${showDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu show w-100 p-2 shadow" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {items.map(item => (
                <div className="form-check" key={item}>
                  <input
                    type="checkbox"
                    id={`${stateKey}-${item}`}
                    className="form-check-input"
                    checked={formData[stateKey][item] || false}
                    onChange={(e) => handleCheckboxChange(stateKey, item, e.target.checked)}
                  />
                  <label 
                    className="form-check-label w-100" 
                    htmlFor={`${stateKey}-${item}`}
                    onClick={() => handleCheckboxChange(stateKey, item, !formData[stateKey][item])}
                    style={{ cursor: 'pointer' }}
                  >
                    {item}
                  </label>
                  {item === 'Autre' && formData[stateKey]['Autre'] && customField && (
                    <div className="mt-2 mb-2">
                      <input
                        type="text"
                        name={customField}
                        placeholder="Précisez..."
                        className="form-control form-control-sm"
                        value={formData[customField] || ''}
                        onChange={handleChange}
                        onClick={(e) => e.stopPropagation()} // Empêcher la fermeture du menu lors du clic sur l'input
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ 
           backgroundImage: `url('https://i.pinimg.com/736x/a0/4e/8a/a04e8ab43cd1caba9b74ea45e01c4d18.jpg')`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundColor: '#f8f9fa'
         }}>
      {/* Bouton pour retourner à l'accueil */}
      <Link 
        to="/" 
        className="btn btn-light btn-home position-absolute m-3 top-0 start-0 shadow-sm d-flex align-items-center"
      >
        <FaHome className="me-2" /> Accueil
      </Link>
      
      <motion.div 
        className="container"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="row g-0">
                {/* Section image latérale */}
                <div className="col-md-5 d-none d-md-block" 
                     style={{ 
                       backgroundColor: '#0070f3',
                       backgroundImage: 'linear-gradient(135deg, #0070f3 0%, #004db3 100%)',
                       position: 'relative'
                     }}>
                  <div className="d-flex flex-column h-100 justify-content-between p-4 text-white">
                    <div className="text-center mb-5">
                      <div
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          background: 'rgba(255,255,255,0.2)', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 15px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setLogoClicks(prev => prev + 1)}
                      >
                        <FaEye size={40} color="white" />
                      </div>
                      <h6 className="fw-bold fs-6">CABINET D'OPHTALMOLOGIE</h6>
                      <p className="opacity-75">Dr MAR NDIAYE</p>
                    </div>
                    
                    <div className="text-center">
                      {view === 'login' ? (
                        <div>
                         
                          <h4>Connexion</h4>
                          <p className="opacity-75">Accédez à votre espace patient</p>
                          </div>
                      ) : view === 'register' ? (
                        <div>
                        
                          <h4>Inscription</h4>
                          <p className="opacity-75">Rejoignez notre cabinet</p>
                        </div>
                      ) : (
                        <div>
                        
                          <h4>Récupération</h4>
                          <p className="opacity-75">Récupérez votre accès</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center opacity-75">
                      <small>&copy; CABINET D'OPHTALMOLOGIE {new Date().getFullYear()}</small>
                    </div>
                  </div>
                </div>
                
                {/* Section formulaire */}
                <div className="col-md-7">
                  <div className="card-body p-4 p-lg-5">
                  
                    
                    <div className="mb-4">
                      <ul className="nav nav-pills nav-justified">
                        <li className="nav-item">
                          <button 
                            onClick={() => setView('login')} 
                            className={`nav-link w-100 ${view === 'login' ? 'active' : ''}`}
                          >
                            Connexion
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            onClick={() => setView('register')} 
                            className={`nav-link w-100 ${view === 'register' ? 'active' : ''}`}
                          >
                            Inscription
                          </button>
                        </li>
                      </ul>
                    </div>

                    <AnimatePresence mode="wait">
                      {view === 'login' && (
                        <motion.div
                          key="login"
                          variants={formVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="mt-4"
                        >
                          {/* Onglets pour choisir la méthode de connexion */}
                          <div className="mb-4">
                            <ul className="nav nav-tabs nav-fill">
                              <li className="nav-item">
                                <button 
                                  className={`nav-link ${loginMethod === 'email' ? 'active' : ''}`}
                                  onClick={() => setLoginMethod('email')}
                                >
                                  <FaEnvelope className="me-2" /> Email
                                </button>
                              </li>
                              <li className="nav-item">
                                <button 
                                  className={`nav-link ${loginMethod === 'phone' ? 'active' : ''}`}
                                  onClick={() => setLoginMethod('phone')}
                                >
                                  <FaPhone className="me-2" /> Téléphone
                                </button>
                              </li>
                            </ul>
                          </div>
                          
                          {loginMethod === 'email' ? (
                            <>
                              <div className="form-floating mb-3">
                                <input 
                                  type="email" 
                                  name="email" 
                                  id="emailInput" 
                                  placeholder="Email" 
                                  className="form-control" 
                                  onChange={handleChange} 
                                />
                                <label htmlFor="emailInput">Email</label>
                              </div>
                              
                              <div className="form-floating mb-4">
                                <input 
                                  type="password" 
                                  name="password" 
                                  id="passwordInput" 
                                  placeholder="Mot de passe" 
                                  className="form-control" 
                                  onChange={handleChange} 
                                />
                                <label htmlFor="passwordInput">Mot de passe</label>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="form-floating mb-3">
                                <input 
                                  type="tel" 
                                  name="telephone" 
                                  id="telephoneInput" 
                                  placeholder="Numéro de téléphone" 
                                  className="form-control" 
                                  onChange={handleChange} 
                                />
                                <label htmlFor="telephoneInput">Numéro de téléphone</label>
                              </div>
                              
                              <div className="form-floating mb-4">
                                <input 
                                  type="password" 
                                  name="password" 
                                  id="passwordPhoneInput" 
                                  placeholder="Mot de passe" 
                                  className="form-control" 
                                  onChange={handleChange} 
                                />
                                <label htmlFor="passwordPhoneInput">Mot de passe</label>
                              </div>
                              
                              <p className="text-muted small mb-4">
                                <i className="bi bi-info-circle me-1"></i>
                                Connexion réservée aux patients!
                              </p>
                            </>
                          )}
                          
                          <button 
                            className="btn btn-primary w-100 py-3 mb-3" 
                            onClick={handleLogin}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            Se connecter
                          </button>
                          
                          <div className="text-center">
                            <button 
                              className="btn btn-link text-decoration-none" 
                              onClick={() => setView('reset')}
                            >
                              Mot de passe oublié ?
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {view === 'register' && (
                        <motion.div
                          key="register"
                          variants={formVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="mt-4"
                          style={{ 
                            height: `${formHeight}px`, 
                            overflowY: 'auto',
                            paddingRight: '10px' 
                          }}
                        >
                          {showStructureRegister ? (
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <h5 className="mb-0">Inscription Cabinet</h5>
                              <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                  setShowStructureRegister(false);
                                  setRegisterType('medecin');
                                }}
                              >
                                Retour
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group w-100 mb-4">
                              <button 
                                className={`btn ${registerType === 'medecin' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setRegisterType('medecin')}
                              >
                                Ophtalmologiste
                              </button>
                              <button 
                                className={`btn ${registerType === 'patient' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setRegisterType('patient')}
                              >
                                Patient
                              </button>
                            </div>
                          )}

                          {registerType === 'structure' && (
                            <>
                              <div className="form-floating mb-3">
                                <input type="text" name="nom" id="nomStructure" placeholder="Nom du cabinet" className="form-control" onChange={handleChange} />
                                <label htmlFor="nomStructure">Nom du cabinet</label>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="email" name="email" id="emailStructure" placeholder="Email" className="form-control" onChange={handleChange} />
                                    <label htmlFor="emailStructure">Email</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="password" name="password" id="passwordStructure" placeholder="Mot de passe" className="form-control" onChange={handleChange} />
                                    <label htmlFor="passwordStructure">Mot de passe</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="site" id="siteStructure" placeholder="Site web" className="form-control" onChange={handleChange} />
                                    <label htmlFor="siteStructure">Site web</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="telephone" id="telephoneStructure" placeholder="Téléphone" className="form-control" onChange={handleChange} />
                                    <label htmlFor="telephoneStructure">Téléphone</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="form-floating mb-3">
                                <input type="text" name="responsable" id="responsableStructure" placeholder="Responsable" className="form-control" onChange={handleChange} />
                                <label htmlFor="responsableStructure">Responsable</label>
                              </div>

                              {/* Menu déroulant pour les spécialités avec cases à cocher */}
                              <CheckboxDropdown 
                                items={specialitesMedecin}
                                stateKey="specialites"
                                showDropdown={showSpecialitesDropdown}
                                setShowDropdown={setShowSpecialitesDropdown}
                                dropdownRef={specialitesDropdownRef}
                                buttonText={getSpecialitesButtonText()}
                                customField="customSpecialite"
                                label="Spécialités ophtalmologiques"
                              />
                              
                              {/* Menu déroulant pour les assurances avec cases à cocher */}
                              <CheckboxDropdown 
                                items={assurancesList}
                                stateKey="assurances"
                                showDropdown={showAssurancesDropdown}
                                setShowDropdown={setShowAssurancesDropdown}
                                dropdownRef={assurancesDropdownRef}
                                buttonText={getAssurancesButtonText(formData.assurances, "Sélectionner les assurances")}
                                customField="customAssurance"
                                label="Assurances acceptées"
                              />
                            </>
                          )}

                          {registerType === 'medecin' && (
                            <>
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="nom" id="nomMedecin" placeholder="Nom" className="form-control" onChange={handleChange} />
                                    <label htmlFor="nomMedecin">Nom</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="prenom" id="prenomMedecin" placeholder="Prénom" className="form-control" onChange={handleChange} />
                                    <label htmlFor="prenomMedecin">Prénom</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="email" name="email" id="emailMedecin" placeholder="Email" className="form-control" onChange={handleChange} />
                                    <label htmlFor="emailMedecin">Email</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="password" name="password" id="passwordMedecin" placeholder="Mot de passe" className="form-control" onChange={handleChange} />
                                    <label htmlFor="passwordMedecin">Mot de passe</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="telephone" id="telephoneMedecin" placeholder="Téléphone" className="form-control" onChange={handleChange} />
                                    <label htmlFor="telephoneMedecin">Téléphone</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <select 
                                    name="medecinSpecialite" 
                                    className="form-select form-select-lg h-100" 
                                    onChange={handleChange}
                                    value={formData.medecinSpecialite}
                                    style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
                                  >
                                    <option value="">Spécialité ophtalmologique</option>
                                    {specialitesMedecin.map(specialite => (
                                      <option key={specialite} value={specialite}>{specialite}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              
                              {formData.medecinSpecialite === 'Autre' && (
                                <div className="form-floating mb-3">
                                  <input 
                                    type="text" 
                                    name="customMedecinSpecialite" 
                                    id="customMedecinSpecialite" 
                                    placeholder="Précisez votre spécialité" 
                                    className="form-control" 
                                    onChange={handleChange}
                                  />
                                  <label htmlFor="customMedecinSpecialite">Précisez votre spécialité</label>
                                </div>
                              )}
                              
                              {/* Menu déroulant pour les assurances avec cases à cocher */}
                              <CheckboxDropdown 
                                items={assurancesList}
                                stateKey="medecinAssurances"
                                showDropdown={showMedecinAssurancesDropdown}
                                setShowDropdown={setShowMedecinAssurancesDropdown}
                                dropdownRef={medecinAssurancesDropdownRef}
                                buttonText={getAssurancesButtonText(formData.medecinAssurances, "Sélectionner les assurances")}
                                customField="customMedecinAssurance"
                                label="Assurances acceptées"
                              />
                              
                              <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                  <label className="form-label fw-bold mb-2">Disponibilités</label>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                      // Définir toutes les disponibilités à actif
                                      const newDispos = {...formData.disponibilites};
                                      jours.forEach(jour => {
                                        newDispos[jour].actif = true;
                                      });
                                      setFormData({...formData, disponibilites: newDispos});
                                    }}
                                  >
                                    Tous les jours
                                  </button>
                                </div>
                                <div className="table-responsive">
                                  <table className="table table-sm table-hover">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Jour</th>
                                        <th>Actif</th>
                                        <th>Début</th>
                                        <th>Fin</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {jours.map(jour => (
                                        <tr key={jour}>
                                          <td className="align-middle">{jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                                          <td className="align-middle">
                                            <div className="form-check form-switch">
                                              <input
                                                type="checkbox"
                                                name={`disponibilites.${jour}.actif`}
                                                checked={formData.disponibilites[jour].actif}
                                                onChange={handleChange}
                                                className="form-check-input"
                                                id={`actif-${jour}`}
                                              />
                                              <label className="form-check-label" htmlFor={`actif-${jour}`}></label>
                                            </div>
                                          </td>
                                          <td>
                                          <input
                                              type="time"
                                              name={`disponibilites.${jour}.debut`}
                                              value={formData.disponibilites[jour].debut}
                                              onChange={handleChange}
                                              className="form-control form-control-sm"
                                              disabled={!formData.disponibilites[jour].actif}
                                            />
                                          </td>
                                          <td>
                                            <input
                                              type="time"
                                              name={`disponibilites.${jour}.fin`}
                                              value={formData.disponibilites[jour].fin}
                                              onChange={handleChange}
                                              className="form-control form-control-sm"
                                              disabled={!formData.disponibilites[jour].actif}
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </>
                          )}

                          {registerType === 'patient' && (
                            <>
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="nom" id="nomPatient" placeholder="Nom" className="form-control" onChange={handleChange} />
                                    <label htmlFor="nomPatient">Nom</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="prenom" id="prenomPatient" placeholder="Prénom" className="form-control" onChange={handleChange} />
                                    <label htmlFor="prenomPatient">Prénom</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="email" name="email" id="emailPatient" placeholder="Email" className="form-control" onChange={handleChange} />
                                    <label htmlFor="emailPatient">Email</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="password" name="password" id="passwordPatient" placeholder="Mot de passe" className="form-control" onChange={handleChange} />
                                    <label htmlFor="passwordPatient">Mot de passe</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="tel" name="telephone" id="telephonePatient" placeholder="Téléphone" className="form-control" onChange={handleChange} />
                                    <label htmlFor="telephonePatient">Téléphone</label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="date" name="dateNaissance" id="dateNaissancePatient" placeholder="Date de naissance" className="form-control" onChange={handleChange} />
                                    <label htmlFor="dateNaissancePatient">Date de naissance</label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="form-floating mb-3">
                                <input type="text" name="adresse" id="adressePatient" placeholder="Adresse" className="form-control" onChange={handleChange} />
                                <label htmlFor="adressePatient">Adresse</label>
                              </div>
                              
                              <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                  <select 
                                    name="sexe" 
                                    className="form-select form-select-lg h-100" 
                                    onChange={handleChange}
                                    style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
                                  >
                                    <option value="">Sélectionnez votre sexe</option>
                                    {sexeOptions.map(option => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-floating">
                                    <input type="text" name="numeroAssurance" id="numeroAssurancePatient" placeholder="Numéro d'assurance" className="form-control" onChange={handleChange} />
                                    <label htmlFor="numeroAssurancePatient">Numéro d'assurance</label>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Menu déroulant pour les assurances avec cases à cocher */}
                              <CheckboxDropdown 
                                items={assurancesList}
                                stateKey="patientAssurances"
                                showDropdown={showPatientAssurancesDropdown}
                                setShowDropdown={setShowPatientAssurancesDropdown}
                                dropdownRef={patientAssurancesDropdownRef}
                                buttonText={getAssurancesButtonText(formData.patientAssurances, "Sélectionner les assurances")}
                                customField="customPatientAssurance"
                                label="Assurances"
                              />
                              
                              <div className="form-floating mb-3">
                                <textarea 
                                  name="antecedentsMedicaux" 
                                  id="antecedentsMedicaux" 
                                  placeholder="Antécédents médicaux" 
                                  className="form-control" 
                                  style={{height: '100px'}}
                                  onChange={handleChange}
                                ></textarea>
                                <label htmlFor="antecedentsMedicaux">Antécédents ophtalmologiques (facultatif)</label>
                              </div>
                            </>
                          )}
                          
                          <button 
                            className="btn btn-primary w-100 py-3" 
                            onClick={handleRegister}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            S'inscrire
                          </button>
                        </motion.div>
                      )}

                      {view === 'reset' && (
                        <motion.div
                          key="reset"
                          variants={formVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="mt-4"
                        >
                          <p className="text-muted mb-4">
                            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                          </p>
                          
                          <div className="form-floating mb-4">
                            <input 
                              type="email" 
                              name="email" 
                              id="resetEmailInput" 
                              placeholder="Email" 
                              className="form-control" 
                              onChange={handleChange} 
                            />
                            <label htmlFor="resetEmailInput">Email</label>
                          </div>
                          
                          <button 
                            className="btn btn-primary w-100 py-3 mb-3" 
                            onClick={handleResetPassword}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ) : null}
                            Envoyer le lien de réinitialisation
                          </button>
                          
                          <div className="text-center">
                            <button 
                              className="btn btn-link text-decoration-none" 
                              onClick={() => setView('login')}
                            >
                              Retour à la connexion
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {message.text && (
                      <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'} mt-4`}>
                        {message.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Styles personnalisés pour le cabinet d'ophtalmologie */}
      <style jsx>{`
        .btn-primary {
          background-color: #0070f3;
          border-color: #0070f3;
        }
        
        .btn-primary:hover, .btn-primary:focus {
          background-color: #005bbf;
          border-color: #005bbf;
        }
        
        .btn-outline-primary {
          color: #0070f3;
          border-color: #0070f3;
        }
        
        .btn-outline-primary:hover, .btn-outline-primary:focus {
          background-color: #0070f3;
          border-color: #0070f3;
        }
        
        .nav-pills .nav-link.active {
          background-color: #0070f3;
        }
        
        .nav-tabs .nav-link.active {
          color: #0070f3;
          border-color: #dee2e6 #dee2e6 #fff;
          font-weight: 500;
        }
        
        .nav-tabs .nav-link {
          color: #6c757d;
        }
        
        .form-check-input:checked {
          background-color: #0070f3;
          border-color: #0070f3;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #0070f3;
          box-shadow: 0 0 0 0.25rem rgba(0, 112, 243, 0.25);
        }
        
        .dropdown-menu {
          border-color: rgba(0, 112, 243, 0.2);
        }
        
        .alert-success {
          background-color: rgba(0, 200, 83, 0.1);
          border-color: #00c853;
          color: #00a844;
        }
        
        .alert-danger {
          background-color: rgba(244, 67, 54, 0.1);
          border-color: #f44336;
          color: #e53935;
        }
        
        .btn-home {
          transition: all 0.3s ease;
          z-index: 100;
        }
        
        .btn-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default AuthComponent;
