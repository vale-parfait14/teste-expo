import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card,Modal, Button } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaUserMd, FaSignInAlt, FaUserPlus, 
  FaMoon, FaSun, FaGlobe, FaCalendarAlt,
  FaHome, FaBuilding, FaLock, FaExternalLinkAlt,
  FaChevronRight, FaArrowRight  , FaHeartbeat, FaLungs, 
  FaMicroscope, FaBaby, FaThermometerHalf, 
  FaAppleAlt, FaLeaf, FaSyringe, FaFemale, 
  FaProcedures, FaHospitalUser, FaBone, 
  FaRibbon, FaTint, FaToilet, FaWalking, 
  FaUserNurse, FaWheelchair, FaHandHoldingMedical, 
  FaXRay, FaBrain, FaSmokingBan, FaCut,
  FaCog, FaRunning, FaYinYang
} from 'react-icons/fa';

import { 
  GiMedicines, GiHeartOrgan, GiLungs, GiStomach, 
  GiMedicalDrip, GiMedicalPack, GiMedicalThermometer,
  GiHairStrands
} from 'react-icons/gi';

import { 
  MdChildCare, MdPregnantWoman, MdOutlinePsychology
} from 'react-icons/md';
import { 
  RiMentalHealthFill, RiPsychotherapyFill
} from 'react-icons/ri';
import { BiBody } from 'react-icons/bi';

// Importez vos images ici
import logoImage from './assets1/_.jpeg';

// Importez le composant QuickAppointment
import QuickAppointment from '../pages/QuickAppointment.js';

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('fr');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [structureLoginCount, setStructureLoginCount] = useState(0);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  const [isFlipped, setIsFlipped] = useState(false);
  
  const navigate = useNavigate();
  
  // Services médicaux pour le composant QuickAppointment
  const services = [
    { name: 'Médecine générale', description: 'Consultation avec un médecin généraliste', icon: <FaUserMd /> },
    { name: 'Cardiologie', description: 'Consultation et suivi cardiologique', icon: <FaHeartbeat /> },
    { name: 'Réadaptation Cardiovasculaire', description: 'Programmes de réadaptation cardiaque', icon: <GiHeartOrgan /> },
    { name: 'Chirurgie Cardiovasculaire', description: 'Interventions chirurgicales cardiovasculaires', icon: <FaHeartbeat /> },
    { name: 'Pneumologie', description: 'Traitement des maladies respiratoires', icon: <FaLungs /> },
    { name: 'Gastroentérologie', description: 'Soins du système digestif', icon: <GiStomach /> },
    { name: 'Endoscopie Digestive', description: 'Examens endoscopiques du système digestif', icon: <FaMicroscope /> },
    { name: 'Pédiatrie', description: 'Soins médicaux pour enfants', icon: <FaBaby /> },
    { name: 'Endocrinologie', description: 'Traitement des troubles hormonaux', icon: <FaThermometerHalf /> },
    { name: 'Nutrition', description: 'Conseils et suivi nutritionnels', icon: <FaAppleAlt /> },
    { name: 'Nutrithérapie', description: 'Thérapie par la nutrition', icon: <FaLeaf /> },
    { name: 'Diabétologie', description: 'Prise en charge du diabète', icon: <FaSyringe /> },
    { name: 'Gynécologie', description: 'Consultation et suivi gynécologique', icon: <FaFemale /> },
    { name: 'Anesthésie', description: 'Services d\'anesthésie', icon: <GiMedicalDrip /> },
    { name: 'Réanimation', description: 'Soins intensifs et réanimation', icon: <FaProcedures /> },
    { name: 'Dermatologie', description: 'Traitement des affections cutanées', icon: <BiBody /> },
    { name: 'Rhumatologie', description: 'Traitement des maladies rhumatismales', icon: <FaBone /> },
    { name: 'Cancérologie', description: 'Traitement des cancers', icon: <FaRibbon /> },
    { name: 'Hématologie', description: 'Traitement des maladies du sang', icon: <FaTint /> },
    { name: 'Urologie', description: 'Traitement des troubles urinaires', icon: <FaToilet /> },
    { name: 'Orthopédie', description: 'Soins de l\'appareil locomoteur', icon: <FaWalking /> },
    { name: 'Gériatrie', description: 'Soins médicaux pour personnes âgées', icon: <FaUserNurse /> },
    { name: 'Médecine Physique', description: 'Réhabilitation fonctionnelle', icon: <BiBody /> },
    { name: 'Rééducation', description: 'Services de rééducation', icon: <FaWheelchair /> },
    { name: 'Ostéopathie', description: 'Soins ostéopathiques', icon: <FaHandHoldingMedical /> },
    { name: 'Échographie', description: 'Examens échographiques', icon: <FaXRay /> },
    { name: 'Psychiatrie', description: 'Soins en santé mentale', icon: <FaBrain /> },
    { name: 'Addictologie', description: 'Traitement des addictions', icon: <FaSmokingBan /> },
    { name: 'Thérapie capillaire', description: 'Soins et traitements capillaires', icon: <GiHairStrands /> },
    { name: 'Thérapie cognitivo comportementale', description: 'Approche thérapeutique cognitive', icon: <MdOutlinePsychology /> },
    { name: 'Kinésithérapie', description: 'Soins de kinésithérapie', icon: <FaRunning /> },
    { name: 'Yoga', description: 'Séances de yoga thérapeutique', icon: <FaYinYang /> }
  ];

  // Textes multilingues
  const translations = {
    fr: {
      title: "Plateau Médical Pr Gabriel Senghor",
      subtitle: "Sélectionnez votre profil",
      roleQuestion: "Je suis un ...",
      patient: "Patient",
      patientDesc: "Rendez-vous et dossiers médicaux",
      doctor: "Professionnel de Santé",
      doctorDesc: "Gestion d'agenda et patients",
      actionQuestion: "Je souhaite...",
      login: "connexion",
      register: "inscription",
      guest: "Continuer en tant qu'invité",
      accessibility: "Accessibilité",
      darkMode: "Mode sombre",
      language: "Langue",
      copyright: "Tous droits réservés",
      structure: "Partenariat",
      structureDesc: "Notre solution",
      homepage: "Accueil",
      learnMore: "En savoir plus",
      structureLogin: "Connexion structure",
      welcome: "Vous souhaite la BIENVENUE",
      joinUs: "Rejoignez-nous",
      takeAppointment: "Prendre rendez-vous",
      appointmentDesc: "Consultation rapide sans compte",
      chooseProfile: "Santé •Nutrition •Bien-être",
      changeChoice: "Retour"
    },
    en: {
      title: "Plateau Médical Pr Gabriel Senghor",
      subtitle: "Select your profile",
      roleQuestion: "I am a...",
      patient: "Patient",
      patientDesc: "Appointments and medical records",
      doctor: "Healthcare Professional",
      doctorDesc: "Schedule and patients management",
      actionQuestion: "I want to...",
      login: "Log in",
      register: "Sign up",
      guest: "Continue as guest",
      accessibility: "Accessibility",
      darkMode: "Dark mode",
      language: "Language",
      copyright: "All rights reserved",
      structure: "Cooperation",
      structureDesc: "Our solution",
      homepage: "Home",
      learnMore: "Learn more",
      structureLogin: "Structure login",
      welcome: "WELCOME You",
      joinUs: "Join us",
      takeAppointment: "Book an appointment",
      appointmentDesc: "Quick consultation without account",
      chooseProfile: "Health • Nutrition • Well-being",
      changeChoice: "Back"
    }
  };
  
  const t = translations[language];

  // Détecter la taille de l'écran pour le responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Vérifier les préférences utilisateur stockées
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    const storedLanguage = localStorage.getItem('language') || 'fr';
    const storedAccessibility = localStorage.getItem('accessibilityMode') === 'true';
    
    setDarkMode(storedDarkMode);
    setLanguage(storedLanguage);
    setAccessibilityMode(storedAccessibility);
    
    // Simuler un chargement pour une transition fluide
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sauvegarder les préférences utilisateur
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('language', language);
    localStorage.setItem('accessibilityMode', accessibilityMode);
    
    if (accessibilityMode) {
      document.body.classList.add('accessibility-mode');
    } else {
      document.body.classList.remove('accessibility-mode');
    }
  }, [darkMode, language, accessibilityMode]);

  const handleRoleSelect = (role) => {
    if (selectedRole === role) {
      // Si on clique sur le même rôle déjà sélectionné, on revient à l'état initial
      setSelectedRole(null);
      setIsFlipped(false);
    } else {
      // Sinon, on sélectionne le nouveau rôle
      setSelectedRole(role);
      
      // Effet de flip avec délai
      setTimeout(() => {
        setIsFlipped(true);
      }, 300);
    }
  };
  
  // Fonction pour réinitialiser la sélection
  const resetSelection = () => {
    setIsFlipped(false);
    
    // Délai pour attendre que l'animation de flip se termine avant de réinitialiser le rôle
    setTimeout(() => {
      setSelectedRole(null);
    }, 300);
  };

  // Fonction pour gérer la redirection
  const handleNavigation = (action) => {
    if (!selectedRole && action !== 'guest' && action !== 'home' && 
        action !== 'structure' && action !== 'structureLogin') return;

    // Stocker les choix dans localStorage
    if (selectedRole) {
      localStorage.setItem('preSelectedRole', selectedRole);
      localStorage.setItem('preSelectedAction', action);
    }
    
    // Animation avant redirection
    setIsLoading(true);
    setTimeout(() => {
      if (action === 'home') {
        navigate('/');
      } else if (action === 'structure') {
        window.open('https://sen-amd.vercel.app/', '_blank');
      } else if (action === 'structureLogin') {
        navigate('/auth');
      } else {
        navigate(action === 'guest' ? '/' : '/auth');
      }
    }, 400);
  };

  // Fonction pour activer le bouton caché de connexion structure
  const handleLogoClick = () => {
    setStructureLoginCount(prev => prev + 1);
  };

  // Fonction pour gérer l'affichage du modal de rendez-vous
  const handleAppointmentModal = () => {
    setShowAppointmentModal(true);
  };

  // Fonction pour fermer le modal de rendez-vous
  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
  };

  // Variantes d'animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Animation du blob en arrière-plan
  const blobVariants = {
    animate: {
      scale: [1, 1.05, 1],
      borderRadius: ["60% 40% 30% 70%/60% 30% 70% 40%", "30% 60% 70% 40%/50% 60% 30% 60%", "60% 40% 30% 70%/60% 30% 70% 40%"],
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: "mirror"
      }
    }
  };

  // Animation du logo
  const logoVariants = {
    initial: { 
      rotate: 0,
      scale: 1
    },
    animate: { 
      rotate: 360,
      scale: [1, 1.1, 1],
      transition: {
        rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
        scale: { duration: 1.2, repeat: Infinity, repeatType: "reverse" }
      }
    }
  };

  // Variantes pour l'effet de flip - CORRIGÉES
  const cardFrontVariants = {
    front: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    back: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  const cardBackVariants = {
    front: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    back: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  // Couleurs pour les thèmes
  const colors = {
    light: {
      bg: "#f8fafc",
      primary: "#0284c7",
      secondary: "#0ea5e9",
      accent: "#0369a1",
      text: "#0f172a",
      card: "#ffffff",
      cardBorder: "rgba(0,0,0,0.05)",
      buttonText: "#ffffff"
    },
    dark: {
      bg: "#0f172a",
      primary: "#0ea5e9",
      secondary: "#38bdf8",
      accent: "#0284c7",
      text: "#f8fafc",
      card: "#1e293b",
      cardBorder: "rgba(255,255,255,0.1)",
      buttonText: "#0f172a"
    }
  };

  const theme = darkMode ? colors.dark : colors.light;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: theme.bg,
      color: theme.text,
      transition: 'all 0.3s ease'
    }}>
      {/* Éléments de fond dynamiques */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 1
      }}>
        {/* Blob animé 1 */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}30)`,
            borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%',
            filter: 'blur(60px)',
            zIndex: -1
          }}
        />
        
        {/* Blob animé 2 */}
        <motion.div
          variants={blobVariants}
          animate="animate"
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: `linear-gradient(135deg, ${theme.secondary}20, ${theme.accent}30)`,
            borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%',
            filter: 'blur(70px)',
            zIndex: -1
          }}
        />
        
        {/* Grille de fond */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(${theme.primary}05 1px, transparent 1px), 
                            linear-gradient(90deg, ${theme.primary}05 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.4,
          zIndex: -1
        }} />
      </div>

      {/* Modal de rendez-vous */}
     
 <Modal 
          show={showAppointmentModal} 
          onHide={() => setShowAppointmentModal(false)}
          size="lg"
          centered
          className="appointment-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>Demande de rendez-vous ophtalmologique</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <QuickAppointment />
          </Modal.Body>
        </Modal>
      <AnimatePresence>
        {isLoading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <motion.div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              {/* Logo animé pour le chargement */}
              <motion.div
                variants={logoVariants}
                initial="initial"
                animate="animate"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  background: theme.primary,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  overflow: 'hidden'
                }}
              >
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt="Logo" 
                    style={{
                      width: '60%',
                      height: '60%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: theme.bg,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    color: theme.primary
                  }}>
                    SAMD
                  </div>
                )}
              </motion.div>
              
              {/* Texte de chargement */}
              <motion.p
                style={{
                  color: theme.text,
                  fontWeight: '500',
                  letterSpacing: '2px',
                  fontSize: '14px'
                }}
                animate={{
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity
                }}
              >
                CHARGEMENT
              </motion.p>
              
              {/* Points de chargement animés */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: theme.primary
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      repeatType: 'loop',
                      delay: index * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: '100%', position: 'relative', zIndex: 3 }}
          >
            {/* Barre de navigation */}
            <motion.div 
              className="d-flex justify-content-between align-items-center"
              variants={itemVariants}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '1.5rem',
                zIndex: 100,
                background: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${theme.cardBorder}`
              }}
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoClick}
              >
                <h3 style={{ 
                  color: theme.primary, 
                  fontWeight: '700', 
                  margin: 0,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <motion.span
                    animate={{ 
                      color: [theme.primary, theme.secondary, theme.primary],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    SAMD
                  </motion.span>
                </h3>
              </motion.div>
              
              <div className="d-flex gap-4 align-items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                  title='Accueil'
                    variant="link" 
                    className="text-decoration-none" 
                    onClick={()=> navigate('/')}
                    style={{ 
                      textDecoration: 'none',
                      background: theme.primary,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      color: theme.buttonText,
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span style={{ position: 'relative', zIndex: 2 }}>
                      <i className='bi bi-house '></i>
                    </span>
                    <motion.div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: theme.primary,
                        zIndex: 1,
                        originX: 0
                      }}
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="link" 
                    className="d-flex justify-content-center align-items-center"
                    onClick={() => setDarkMode(!darkMode)}
                    style={{ 
                      textDecoration: 'none',
                      background: theme.primary,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      color: theme.buttonText,
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                    aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
                  >
                    {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button 
                    variant="link" 
                    className="d-flex justify-content-center align-items-center"
                    onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                    style={{ 
                      textDecoration: 'none',
                      background: 'transparent',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      color: theme.text,
                      border: `2px solid ${theme.primary}`,
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                    aria-label={language === 'fr' ? "Switch to English" : "Passer au français"}
                  >
                    {language === 'fr' ? 'EN' : 'FR'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Contenu principal */}
            <Container fluid className="h-100 d-flex flex-column" style={{ paddingTop: '100px', maxWidth: '1200px' }}>
              <Row className="flex-grow-1 justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Col xs={12} lg={10}>
                  <Row>
                    {/* Colonne de gauche - Titre et description */}
                    <Col xs={12} md={6} className="mb-4 mb-md-0">
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="mb-5 text-md-start text-center"
                      >

<p
                           className='d-block  d-md-none' 
                           style={{ 
                          color: darkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(15, 23, 42, 0.8)',
                          fontSize: '1rem',
                          maxWidth: '500px',
                          margin: isMobile ? '0 auto 2rem auto' : '0 0 2rem 0',
                          lineHeight: '1.6'
                        }}>
                          {t.welcome}!
                        </p>

                         <h1
                         className='d-block d-md-none'
                         
                         style={{ 
                          fontSize: isMobile ? '1.2rem' : '2rem', 
                          fontWeight: '1000', 
                          color: theme.text,
                          letterSpacing: '0px',
                          lineHeight: '1',
                          marginBottom: '0.1rem'
                        }}>
                          {t.title}
                          <motion.span
                            style={{
                              display: 'inline-block',
                              color: theme.primary
                            }}
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'loop'
                            }}
                          >
                            .
                          </motion.span>
                        </h1>

                        
                        <p
                        className='d-none  d-md-block'  
                        style={{ 
                          color: darkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(15, 23, 42, 0.8)',
                          fontSize: '1.9rem',
                          maxWidth: '500px',
                          margin: isMobile ? '0 auto 2rem auto' : '0 0 2rem 0',
                          lineHeight: '1.6'
                        }}>
                          {t.welcome} au
                        </p>

                        <h1  className='d-none d-md-block'
                        style={{ 
                          fontSize: isMobile ? '2rem' : '3rem', 
                          fontWeight: '800', 
                          color: theme.text,
                          letterSpacing: '0px',
                          lineHeight: '1.2',
                          marginBottom: '1.5rem'
                        }}>
                          {t.title}
                          <motion.span
                            style={{
                              display: 'inline-block',
                              color: theme.primary
                            }}
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: 'loop'
                            }}
                          >
                            .
                          </motion.span>
                        </h1>



                      

                        
                        <h2
                        className='d-none  d-md-block'  
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: '600',
                          color: theme.primary,
                          marginBottom: '2rem'
                        }}>
                          {t.chooseProfile}
                        </h2>
                      </motion.div>
                    </Col>
                    
                   {/* Colonne de droite - Sélection de rôle avec effet de flip */}
<Col xs={12} md={6}>
  <motion.div variants={itemVariants} className="mb-4">
    <div className="d-flex flex-column gap-4">
      {/* Carte Patient */}
      <AnimatePresence>
        {(!selectedRole || selectedRole === 'patient') && (
          <motion.div
            initial={selectedRole ? { opacity: 1, scale: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            style={{ position: 'relative' }}
          >
            {/* Face avant de la carte (visible quand non flippée) */}
            <motion.div
              animate={selectedRole === 'patient' && isFlipped ? 'back' : 'front'}
              variants={cardFrontVariants}
              style={{
                position: selectedRole === 'patient' && isFlipped ? 'absolute' : 'relative',
                width: '100%',
                zIndex: selectedRole === 'patient' && isFlipped ? 0 : 1
              }}
            >
              <Card 
                className="border-0"
                onClick={handleAppointmentModal}
                style={{
                  cursor: 'pointer',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: theme.card,
                  border: selectedRole === 'patient' ? `2px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
                  boxShadow: selectedRole === 'patient' 
                    ? `0 10px 30px ${theme.primary}40` 
                    : `0 4px 20px ${darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`,
                  transition: 'all 0.3s ease',
                  height: '120px'
                }}
              >
                <Card.Body className="d-flex align-items-center p-4">
                  <motion.div 
                    className="me-4"
                    style={{
                      backgroundColor: selectedRole === 'patient' ? theme.primary : theme.primary + '20',
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    animate={selectedRole === 'patient' ? {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 0 rgba(0,0,0,0)',
                        `0 0 20px ${theme.primary}80`,
                        '0 0 0 rgba(0,0,0,0)'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaUser 
                      size={24} 
                      color={selectedRole === 'patient' ? theme.buttonText : theme.primary} 
                    />
                  </motion.div>
                  <div className="text-start">
                    <h5 style={{ 
                      margin: 0, 
                      fontWeight: '600',
                      fontSize: '1.2rem',
                      color: theme.text
                    }}>
                      {t.patient}
                    </h5>
                    <p style={{
                      margin: '5px 0 0 0',
                      fontSize: '0.9rem',
                      color: darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(15, 23, 42, 0.7)'
                    }}>
                      {t.patientDesc}
                    </p>
                  </div>
                  {selectedRole === 'patient' && !isFlipped && (
                    <motion.div 
                      className="ms-auto"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, type: "spring" }}
                    >
                      <div 
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: theme.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.buttonText,
                          fontSize: '14px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      >
                        ✓
                      </div>
                    </motion.div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>

         

          </motion.div>
        )}
      </AnimatePresence>

      {/* Carte Professionnel de santé */}
      <AnimatePresence>
        {(!selectedRole || selectedRole === 'doctor') && (
          <motion.div
            initial={selectedRole ? { opacity: 1, scale: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            style={{ position: 'relative' }}
          >
            {/* Face avant de la carte (visible quand non flippée) */}
            <motion.div
              animate={selectedRole === 'doctor' && isFlipped ? 'back' : 'front'}
              variants={cardFrontVariants}
              style={{
                position: selectedRole === 'doctor' && isFlipped ? 'absolute' : 'relative',
                width: '100%',
                zIndex: selectedRole === 'doctor' && isFlipped ? 0 : 1
              }}
            >
              <Card 
                className="border-0"
                onClick={() => handleRoleSelect('doctor')}
                style={{
                  cursor: 'pointer',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: theme.card,
                  border: selectedRole === 'doctor' ? `2px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
                  boxShadow: selectedRole === 'doctor' 
                    ? `0 10px 30px ${theme.primary}40` 
                    : `0 4px 20px ${darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`,
                  transition: 'all 0.3s ease',
                  height: '120px'
                }}
              >
                <Card.Body className="d-flex align-items-center p-4">
                  <motion.div 
                    className="me-4"
                    style={{
                      backgroundColor: selectedRole === 'doctor' ? theme.primary : theme.primary + '20',
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    animate={selectedRole === 'doctor' ? {
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 0 0 rgba(0,0,0,0)',
                        `0 0 20px ${theme.primary}80`,
                        '0 0 0 rgba(0,0,0,0)'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaUserMd 
                      size={24} 
                      color={selectedRole === 'doctor' ? theme.buttonText : theme.primary} 
                    />
                  </motion.div>
                  <div className="text-start">
                    <h5 style={{ 
                      margin: 0, 
                      fontWeight: '600',
                      fontSize: '1.2rem',
                      color: theme.text
                    }}>
                      {t.doctor}
                    </h5>
                    <p style={{
                      margin: '5px 0 0 0',
                      fontSize: '0.9rem',
                      color: darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(15, 23, 42, 0.7)'
                    }}>
                      {t.doctorDesc}
                    </p>
                  </div>
                  {selectedRole === 'doctor' && !isFlipped && (
                    <motion.div 
                      className="ms-auto"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, type: "spring" }}
                    >
                      <div 
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: theme.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: theme.buttonText,
                          fontSize: '14px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      >
                        ✓
                      </div>
                    </motion.div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>

            {/* Face arrière de la carte (actions médecin) - visible quand flippée */}
            <motion.div
              animate={selectedRole === 'doctor' && isFlipped ? 'back' : 'front'}
              variants={cardBackVariants}
              style={{
                position: selectedRole === 'doctor' && isFlipped ? 'relative' : 'absolute',
                width: '100%',
                zIndex: selectedRole === 'doctor' && isFlipped ? 1 : 0,
                top: 0
              }}
            >
              <Card 
                className="border-0"
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: theme.card,
                  border: `2px solid ${theme.primary}`,
                  boxShadow: `0 10px 30px ${theme.primary}40`,
                  height: '220px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Card.Header 
                  className="d-flex align-items-center justify-content-between"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    border: 'none',
                    padding: '1rem 1.5rem'
                  }}
                >
                 
                  <Button 
                    variant="link" 
                    onClick={resetSelection}
                    style={{
                      color: 'white',
                      textDecoration: 'none',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.9rem'
                    }}
                  >
                    {t.changeChoice}
                   
                  </Button>
                  <div className="d-flex align-items-center">
                   
                    <h5 style={{ 
                      margin: 0, 
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '1.1rem'
                    }}>
                      {t.doctor}
                    </h5>

                    

                  </div>
                </Card.Header>

                <Card.Body className="d-flex flex-column justify-content-center p-4">
                  <Row className="g-3">
                    <Col xs={6}>
                      <motion.div 
                        whileHover={{ scale: 1.03, y: -3 }} 
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button 
                          variant="primary"
                          onClick={() => handleNavigation('login')}
                          className="w-100"
                          style={{
                            borderRadius: '14px',
                            fontWeight: '600',
                            backgroundColor: theme.primary,
                            color: theme.buttonText,
                            border: 'none',
                            padding: '0.8rem',
                            boxShadow: `0 8px 25px ${theme.primary}40`
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center">
                            <FaSignInAlt className="me-2" size={14} />
                            {t.login}
                          </div>
                        </Button>
                      </motion.div>
                    </Col>
                    
                    <Col xs={6}>
                      <motion.div 
                        whileHover={{ scale: 1.03, y: -3 }} 
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Button 
                          variant="outline-primary"
                          onClick={() => handleNavigation('register')}
                          className="w-100"
                          style={{
                            borderRadius: '14px',
                            fontWeight: '600',
                            borderColor: theme.primary,
                            borderWidth: '2px',
                            color: theme.primary,
                            background: 'transparent',
                            padding: '0.8rem'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-center">
                            <FaUserPlus className="me-2" size={14} />
                            {t.register}
                          </div>
                        </Button>
                      </motion.div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carte Partenariat (sans effet de flip) */}
      <AnimatePresence>
        {(!selectedRole) && (
          <motion.div
            whileHover={{ 
              scale: 1.02, 
              boxShadow: `0 20px 40px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}` 
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card 
              className="border-0"
              style={{
                cursor: 'pointer',
                borderRadius: '24px',
                overflow: 'hidden',
                background: theme.card,
                border: `1px solid ${theme.cardBorder}`,
                boxShadow: `0 4px 20px ${darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'}`,
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleNavigation('structure')}
            >
              <Card.Body className="d-flex align-items-center p-4">
                <motion.div 
                  className="me-4"
                  style={{
                    backgroundColor: theme.primary + '20',
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  whileHover={{ 
                    rotate: [0, 5, -5, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <FaBuilding size={24} color={theme.primary} />
                </motion.div>
                <div className="text-start">
                  <h5 style={{ 
                    margin: 0, 
                    fontWeight: '600',
                    fontSize: '1.2rem',
                    color: theme.text
                  }}>
                    {t.structure}
                  </h5>
                  <p style={{
                    margin: '5px 0 0 0',
                    fontSize: '0.9rem',
                    color: darkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(15, 23, 42, 0.7)'
                  }}>
                    {t.structureDesc}
                  </p>
                </div>
                <motion.div 
                  className="ms-auto"
                  whileHover={{ x: [0, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <FaExternalLinkAlt size={16} style={{ color: theme.primary, opacity: 0.8 }} />
                </motion.div>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>

  {/* Bouton caché pour la connexion structure */}
  <AnimatePresence>
    {structureLoginCount >= 5 && !selectedRole && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="mt-3"
      >
        <Button
          variant="link"
          onClick={() => handleNavigation('structureLogin')}
          className="d-flex align-items-center justify-content-center w-100"
          style={{ 
            textDecoration: 'none',
            color: theme.primary,
            fontSize: '0.9rem',
            padding: '0.8rem',
            background: theme.primary + '10',
            borderRadius: '16px',
            border: `1px solid ${theme.primary}30`
          }}
        >
          <FaLock size={14} className="me-2" /> {t.structureLogin}
        </Button>
      </motion.div>
    )}
  </AnimatePresence>
</Col>

                  </Row>
                </Col>
              </Row>

              {/* Pied de page */}
              <Row className="py-4 mt-3" style={{ marginTop: 'auto', zIndex: 5 }}>
                <Col className="text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                  >
                    <p style={{ 
                      color: darkMode ? 'rgba(248, 250, 252, 0.6)' : 'rgba(15, 23, 42, 0.6)', 
                      fontSize: '0.9rem', 
                      margin: 0,
                      fontWeight: '400'
                    }}>
                      &copy; {new Date().getFullYear()} {t.title} - {t.copyright}
                    </p>
                  </motion.div>
                </Col>
              </Row>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleSelector;