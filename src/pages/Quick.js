import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarPlus, 
  faSpinner, 
  faCheck, 
  faTimes, 
  faQrcode, 
  faCopy, 
  faSearch, 
  faArrowLeft, 
  faEye,
  faChevronRight,
  faInfoCircle,
  faPhone,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const Quick = ({ isModal = false }) => {
  // Structure ID fixe pour recevoir toutes les demandes
  const STRUCTURE_ID_CIBLE = "KCjF9Zl0KyfLZWRMN5IZJzSKk903"; // ID de la structure cible
  const STRUCTURE_NOM = "Cabinet d'Ophtalmologie"; // Nom de la structure

  // États pour gérer les différentes vues
  const [currentView, setCurrentView] = useState('home'); // 'home', 'booking', 'verification', 'success'
  const [currentStep, setCurrentStep] = useState(1); // Pour le formulaire multi-étapes sur mobile
  
  // État du formulaire de rendez-vous
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    dateRdv: '',
    heureRdv: '',
    specialite: '',
    motif: '',
    premierRdv: true,
    porteurLunettes: false,
    porteurLentilles: false
  });

  // État pour la vérification
  const [verificationCode, setVerificationCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [rdvDetails, setRdvDetails] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  
  // États divers
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loadingSpecialites, setLoadingSpecialites] = useState(true);
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Détection de l'appareil
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Vérifier au chargement
    checkIfMobile();
    
    // Ajouter un écouteur pour les changements de taille
    window.addEventListener('resize', checkIfMobile);
    
    // Nettoyer l'écouteur
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Liste des spécialités ophtalmologiques par défaut
  const defaultSpecialites = [
    "Ophtalmologie générale",
    "Chirurgie réfractive",
    "Chirurgie de la cataracte",
    "Rétinologie",
    "Glaucome",
    "Ophtalmologie pédiatrique",
    "Neuro-ophtalmologie",
    "Cornée et surface oculaire",
    "Contactologie"
  ];

  // Liste des motifs courants en ophtalmologie
  const motifsCommuns = [
    "Contrôle de routine",
    "Renouvellement d'ordonnance lunettes",
    "Renouvellement d'ordonnance lentilles",
    "Vision floue",
    "Douleur oculaire",
    "Yeux rouges/irrités",
    "Sécheresse oculaire",
    "Examen pour le permis de conduire",
    "Autre"
  ];

  // Récupérer les spécialités disponibles dans la structure cible
  useEffect(() => {
    if (currentView === 'booking') {
      fetchStructureSpecialites();
    }
  }, [currentView]);

  const fetchStructureSpecialites = async () => {
    try {
      setLoadingSpecialites(true);
      
      // Récupérer le document de la structure
      const structureDocRef = doc(db, 'structures', STRUCTURE_ID_CIBLE);
      const structureDocSnap = await getDoc(structureDocRef);
      
      if (structureDocSnap.exists()) {
        const structureData = structureDocSnap.data();
        
        // Vérifier si la structure a des spécialités définies
        if (structureData.specialites && Array.isArray(structureData.specialites) && structureData.specialites.length > 0) {
          setSpecialites(structureData.specialites);
        } else {
          // Si la structure n'a pas de spécialités définies, récupérer les spécialités des médecins
          await fetchMedecinSpecialites();
        }
      } else {
        // Si le document de structure n'existe pas, récupérer les spécialités des médecins
        await fetchMedecinSpecialites();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des spécialités de la structure:", error);
      // En cas d'erreur, essayer de récupérer les spécialités des médecins
      await fetchMedecinSpecialites();
    } finally {
      setLoadingSpecialites(false);
    }
  };

  const fetchMedecinSpecialites = async () => {
    try {
      // Récupérer les médecins de la structure cible
      const q = query(collection(db, 'medecins'), where("structureId", "==", STRUCTURE_ID_CIBLE));
      const querySnapshot = await getDocs(q);
      
      // Vérifier si des documents ont été trouvés
      if (querySnapshot.empty) {
        // Si aucun médecin n'est trouvé, utiliser une liste de spécialités par défaut
        setSpecialites(defaultSpecialites);
      } else {
        // Extraire les spécialités uniques
        const specialitesSet = new Set();
        querySnapshot.forEach((doc) => {
          const medecin = doc.data();
          if (medecin.specialite) {
            specialitesSet.add(medecin.specialite);
          }
        });
        
        if (specialitesSet.size === 0) {
          // Si aucune spécialité n'est trouvée, utiliser une liste par défaut
          setSpecialites(defaultSpecialites);
        } else {
          setSpecialites(Array.from(specialitesSet).sort());
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des spécialités des médecins:", error);
      // En cas d'erreur, utiliser une liste de spécialités par défaut
      setSpecialites(defaultSpecialites);
      setMessage({ 
        text: "Impossible de charger les spécialités disponibles. Veuillez réessayer plus tard.", 
        type: "error" 
      });
    }
  };

  // Générer un code de vérification aléatoire
  const generateVerificationCode = () => {
    // Générer un code alphanumérique de 8 caractères
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Vérifier si le formulaire est valide (version desktop)
  const isFormValid = () => {
    const {  telephone, dateRdv, heureRdv, specialite } = formData;
    return  telephone && dateRdv && heureRdv && specialite;
  };

  // Vérifier si l'étape actuelle du formulaire est valide (version mobile)
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return  formData.telephone;
      case 2:
        return formData.dateRdv && formData.heureRdv && formData.specialite;
      case 3:
        return true; // L'étape 3 contient des champs optionnels
      default:
        return false;
    }
  };

  // Passer à l'étape suivante du formulaire (version mobile)
  const handleNextStep = () => {
    if (isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      setMessage({ text: "Veuillez remplir tous les champs obligatoires.", type: "error" });
    }
  };

  // Revenir à l'étape précédente du formulaire (version mobile)
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Formater le numéro de téléphone
  const formatPhoneNumber = (phone) => {
    // Supprimer les espaces, tirets et autres caractères non numériques
    let cleaned = phone.replace(/\D/g, '');
    
    // Si le numéro commence par un 0, le remplacer par le code pays
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1); // Code pays pour la France
    } 
    // Si le numéro ne commence pas par un +, ajouter le +
    else if (!cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned;
    }
    
    return cleaned;
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
  };

  // Copier le code de vérification dans le presse-papiers
  const copyToClipboard = () => {
    navigator.clipboard.writeText(verificationCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // Gérer à la fois le formulaire desktop et mobile
    
    if (!isMobile && !isFormValid()) {
      setMessage({ text: "Veuillez remplir tous les champs obligatoires.", type: "error" });
      return;
    }
    
    setLoading(true);
    
    try {
      // Formater le numéro de téléphone
      const formattedPhone = formatPhoneNumber(formData.telephone);
      
      // Générer un code de vérification unique
      const code = generateVerificationCode();
      setVerificationCode(code);
      
      // Formater la date pour l'affichage et le stockage
      const dateFormatted = formatDate(formData.dateRdv);
      
      // Créer un nouvel objet avec les données du formulaire
      const rdvData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formattedPhone,
        dateRdv: formData.dateRdv,
        dateFormatted: dateFormatted,
        heureRdv: formData.heureRdv,
        specialite: formData.specialite,
        motif: formData.motif || '',
        premierRdv: formData.premierRdv,
        porteurLunettes: formData.porteurLunettes,
        porteurLentilles: formData.porteurLentilles,
        structureId: STRUCTURE_ID_CIBLE,
        structureNom: STRUCTURE_NOM,
        status: 'pending',
        createdAt: new Date(),
        verificationCode: code
      };
      
      // Ajouter la demande à la collection quickAppointments
      await addDoc(collection(db, 'quickAppointments'), rdvData);
      
      setMessage({ 
        text: "Votre demande de rendez-vous a été envoyée avec succès.", 
        type: "success" 
      });
      
      // Enregistrer les détails du rendez-vous pour l'affichage du récapitulatif
      setRdvDetails({
        ...formData,
        dateFormatted: dateFormatted
      });
      
      // Passer à la vue de succès
      setCurrentView('success');
      
      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        dateRdv: '',
        heureRdv: '',
        specialite: '',
        motif: '',
        premierRdv: true,
        porteurLunettes: false,
        porteurLentilles: false
      });
      
      // Réinitialiser l'étape du formulaire pour la version mobile
      setCurrentStep(1);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      setMessage({ 
        text: "Une erreur est survenue lors de l'envoi de votre demande. Veuillez réessayer plus tard.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un rendez-vous par code de vérification
  const handleVerificationSearch = async (e) => {
    e.preventDefault();
    
    if (!searchCode || searchCode.trim() === '') {
      setSearchError("Veuillez saisir un code de vérification");
      return;
    }
    
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    
    try {
      // Rechercher dans la collection quickAppointments
      const q = query(
        collection(db, 'quickAppointments'), 
        where("verificationCode", "==", searchCode.trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setSearchError("Aucun rendez-vous trouvé avec ce code de vérification");
      } else {
        // Prendre le premier résultat (devrait être unique)
        const rdvDoc = querySnapshot.docs[0];
        const rdvData = rdvDoc.data();
        
        setSearchResult({
          ...rdvData,
          id: rdvDoc.id
        });
      }
    } catch (error) {
      console.error("Erreur lors de la recherche du rendez-vous:", error);
      setSearchError("Une erreur est survenue lors de la recherche. Veuillez réessayer plus tard.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Réinitialiser pour une nouvelle demande
  const handleNewRequest = () => {
    setCurrentView('home');
    setMessage({ text: '', type: '' });
    setVerificationCode('');
    setRdvDetails(null);
    setSearchResult(null);
    setSearchCode('');
    setSearchError('');
    setCurrentStep(1);
  };

  // Générer les options d'heures (de 8h à 18h par tranches de 15 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === 18 && minute > 0) continue; // Ne pas dépasser 18h00
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeString = `${formattedHour}:${formattedMinute}`;
        
        options.push(
          <option key={timeString} value={timeString}>
            {timeString}
          </option>
        );
      }
    }
    return options;
  };

  // Définir la date minimale (aujourd'hui)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtenir la classe de badge en fonction du statut
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'rescheduled':
        return 'bg-info';
      case 'pending':
      default:
        return 'bg-warning';
    }
  };

  // Traduire le statut en français
  const translateStatus = (status) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Refusé';
      case 'rescheduled':
        return 'Reporté';
      case 'pending':
      default:
        return 'En attente';
    }
  };

  // RENDU VERSION DESKTOP
  // Rendu de la page d'accueil avec les deux options (Desktop)
  const renderHomePageDesktop = () => {
    return (
      <div className="home-options">
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100 shadow-sm hover-card">
              <div className="card-body text-center d-flex flex-column">
                <div className="icon-container mb-3 mt-3">
                  <FontAwesomeIcon icon={faCalendarPlus} className="fa-3x text-primary" />
                </div>
                <h4 className="card-title">Prendre un rendez-vous</h4>
                <p className="card-text flex-grow-1">
                  Remplissez un formulaire simple pour demander un rendez-vous avec l'un de nos ophtalmologistes.
                </p>
                <button 
                  className="btn btn-primary btn-lg mt-3"
                  onClick={() => setCurrentView('booking')}
                >
                  Demander un rendez-vous
                </button>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card h-100 shadow-sm hover-card">
              <div className="card-body text-center d-flex flex-column">
                <div className="icon-container mb-3 mt-3">
                  <FontAwesomeIcon icon={faSearch} className="fa-3x text-primary" />
                </div>
                <h4 className="card-title">Vérifier un rendez-vous</h4>
                <p className="card-text flex-grow-1">
                  Consultez le statut de votre rendez-vous en utilisant le code de vérification qui vous a été fourni.
                </p>
                <button 
                  className="btn btn-outline-primary btn-lg mt-3"
                  onClick={() => setCurrentView('verification')}
                >
                  Vérifier mon rendez-vous
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu du formulaire de prise de rendez-vous (Desktop)
  const renderBookingFormDesktop = () => {
    return (
      <div className="booking-form">
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Retour
          </button>
          <h4 className="mb-0">Demande de rendez-vous ophtalmologique</h4>
        </div>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
            <FontAwesomeIcon 
              icon={message.type === 'success' ? faCheck : faTimes} 
              className="me-2" 
            />
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="nom" className="form-label">Nom Patient(e)</label>
              <input
                type="text"
                className="form-control"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label htmlFor="prenom" className="form-label">Prénom Patient(e)</label>
              <input
                type="text"
                className="form-control"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">Email </label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label htmlFor="telephone" className="form-label">Numéro de téléphone <span className="text-danger">du responsable*</span></label>
              <input
                type="tel"
                className="form-control"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Ex: 06 12 34 56 78"
                required
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="dateRdv" className="form-label">Date souhaitée <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                id="dateRdv"
                name="dateRdv"
                value={formData.dateRdv}
                onChange={handleChange}
                min={getMinDate()}
                required
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label htmlFor="heureRdv" className="form-label">Heure souhaitée <span className="text-danger">*</span></label>
              <select
                className="form-select"
                id="heureRdv"
                name="heureRdv"
                value={formData.heureRdv}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une heure</option>
                {generateTimeOptions()}
              </select>
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="specialite" className="form-label">Spécialité ophtalmologique <span className="text-danger">*</span></label>
            {loadingSpecialites ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <span>Chargement des spécialités...</span>
              </div>
            ) : (
              <select
                className="form-select"
                id="specialite"
                name="specialite"
                value={formData.specialite}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une spécialité</option>
                {specialites.map(specialite => (
                  <option key={specialite} value={specialite}>
                    {specialite}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="mb-3">
            <label htmlFor="motif" className="form-label">Motif de la consultation</label>
            <select
              className="form-select"
              id="motif"
              name="motif"
              value={formData.motif}
              onChange={handleChange}
            >
              <option value="">Sélectionner un motif</option>
              {motifsCommuns.map(motif => (
                <option key={motif} value={motif}>
                  {motif}
                </option>
              ))}
            </select>
            {formData.motif === "Autre" && (
              <textarea
                className="form-control mt-2"
                placeholder="Précisez le motif de votre consultation..."
                rows="2"
                name="motifAutre"
                value={formData.motifAutre || ""}
                onChange={handleChange}
              ></textarea>
            )}
          </div>
          
          <div className="mb-4">
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="premierRdv"
                name="premierRdv"
                checked={formData.premierRdv}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="premierRdv">
                C'est ma première consultation dans ce cabinet
              </label>
            </div>
            
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="porteurLunettes"
                name="porteurLunettes"
                checked={formData.porteurLunettes}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="porteurLunettes">
                Je porte des lunettes
              </label>
            </div>
            
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="porteurLentilles"
                name="porteurLentilles"
                checked={formData.porteurLentilles}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="porteurLentilles">
                Je porte des lentilles de contact
              </label>
            </div>
          </div>
          
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || loadingSpecialites || !isFormValid()}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                  Demander un rendez-vous
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Rendu du formulaire de vérification (Desktop)
  const renderVerificationFormDesktop = () => {
    return (
      <div className="verification-form">
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Retour
          </button>
          <h4 className="mb-0">Vérification de rendez-vous</h4>
        </div>
        
        {!searchResult ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="card-text mb-4">
                Entrez le code de vérification qui vous a été fourni lors de votre demande de rendez-vous pour consulter son statut.
              </p>
              
              <form onSubmit={handleVerificationSearch}>
                <div className="mb-3">
                  <label htmlFor="verificationCode" className="form-label">Code de vérification</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      id="verificationCode"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Ex: ABCD1234"
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faSearch} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              {searchError && (
                <div className="alert alert-danger mt-3">
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  {searchError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Détails du rendez-vous</h5>
            </div>
            <div className="card-body">
              <div className="row mb-2">
                <div className="col-md-6 text-md-end fw-bold">Patient:</div>
                <div className="col-md-6 text-md-start">{searchResult.prenom} {searchResult.nom}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-6 text-md-end fw-bold">Spécialité:</div>
                <div className="col-md-6 text-md-start">{searchResult.specialite}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-6 text-md-end fw-bold">Date souhaitée:</div>
                <div className="col-md-6 text-md-start">{searchResult.dateFormatted}</div>
              </div>
              <div className="row mb-2">
                <div className="col-md-6 text-md-end fw-bold">Heure souhaitée:</div>
                <div className="col-md-6 text-md-start">{searchResult.heureRdv}</div>
              </div>
              {searchResult.motif && (
                <div className="row mb-2">
                  <div className="col-md-6 text-md-end fw-bold">Motif:</div>
                  <div className="col-md-6 text-md-start">
                    {searchResult.motif}
                    {searchResult.motifAutre && ` - ${searchResult.motifAutre}`}
                  </div>
                </div>
              )}
              <div className="row mb-2">
                <div className="col-md-6 text-md-end fw-bold">Statut:</div>
                <div className="col-md-6 text-md-start">
                  <span className={`badge ${getStatusBadgeClass(searchResult.status)}`}>
                    {translateStatus(searchResult.status)}
                  </span>
                </div>
              </div>
              
              {/* Afficher les informations du médecin si la demande a été acceptée */}
              {searchResult.status === 'accepted' && searchResult.medecinNom && (
                <div className="row mb-2">
                  <div className="col-md-6 text-md-end fw-bold">Ophtalmologiste assigné:</div>
                  <div className="col-md-6 text-md-start">Dr. {searchResult.medecinNom}</div>
                </div>
              )}
              
              <div className="d-flex justify-content-between mt-4">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchResult(null)}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                  Nouvelle recherche
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('home')}
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu de la page de succès (Desktop)
  const renderSuccessPageDesktop = () => {
    return (
      <div className="success-page">
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Retour à l'accueil
          </button>
          <h4 className="mb-0">Demande envoyée avec succès</h4>
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body text-center py-4">
            <div className="success-icon mb-3">
              <FontAwesomeIcon icon={faCheck} className="text-success" size="3x" />
            </div>
            <h4>Demande envoyée avec succès!</h4>
            
            {/* Récapitulatif du rendez-vous */}
            {rdvDetails && (
              <div className="rdv-recap mt-4">
                <h5 className="mb-3">Récapitulatif de votre demande</h5>
                
                <div className="card mb-4">
                  <div className="card-body">
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Patient:</div>
                      <div className="col-md-6 text-md-start">{rdvDetails.prenom} {rdvDetails.nom}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Spécialité:</div>
                      <div className="col-md-6 text-md-start">{rdvDetails.specialite}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Date souhaitée:</div>
                      <div className="col-md-6 text-md-start">{rdvDetails.dateFormatted}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Heure souhaitée:</div>
                      <div className="col-md-6 text-md-start">{rdvDetails.heureRdv}</div>
                    </div>
                    {rdvDetails.motif && (
                      <div className="row mb-2">
                        <div className="col-md-6 text-md-end fw-bold">Motif:</div>
                        <div className="col-md-6 text-md-start">
                          {rdvDetails.motif}
                          {rdvDetails.motifAutre && ` - ${rdvDetails.motifAutre}`}
                        </div>
                      </div>
                    )}
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Première consultation:</div>
                      <div className="col-md-6 text-md-start">{rdvDetails.premierRdv ? 'Oui' : 'Non'}</div>
                    </div>
                    {rdvDetails.porteurLunettes && (
                      <div className="row mb-2">
                        <div className="col-md-6 text-md-end fw-bold">Porteur de lunettes:</div>
                        <div className="col-md-6 text-md-start">Oui</div>
                      </div>
                    )}
                    {rdvDetails.porteurLentilles && (
                      <div className="row mb-2">
                        <div className="col-md-6 text-md-end fw-bold">Porteur de lentilles:</div>
                        <div className="col-md-6 text-md-start">Oui</div>
                      </div>
                    )}
                    <div className="row mb-2">
                      <div className="col-md-6 text-md-end fw-bold">Statut:</div>
                      <div className="col-md-6 text-md-start">
                        <span className="badge bg-warning">En attente</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Code de vérification */}
                <div className="verification-code-container p-3 mb-4 border rounded bg-light">
                  <h6 className="mb-2">
                    <FontAwesomeIcon icon={faQrcode} className="me-2" />
                    Code de vérification
                  </h6>
                  <p className="small mb-2">
                    Conservez ce code pour vérifier le statut de votre demande ultérieurement.
                  </p>
                  <div className="verification-code d-flex align-items-center justify-content-center">
                    <div className="code-display p-2 px-3 bg-white border rounded me-2 fw-bold letter-spacing-2">
                      {verificationCode}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-secondary" 
                      onClick={copyToClipboard}
                      title="Copier le code"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      {codeCopied && <span className="ms-2 small">Copié!</span>}
                    </button>
                  </div>
                </div>
                
                <p className="mb-4">
                  Un membre de notre équipe traitera votre demande dans les plus brefs délais et vous contactera pour confirmer votre rendez-vous.
                </p>
                
                <div className="alert alert-info d-flex align-items-center">
                  <FontAwesomeIcon icon={faEye} className="me-2" />
                  <div>
                    <strong>Conseil:</strong> Si vous venez pour un examen de la vue, pensez à apporter vos lunettes ou lentilles actuelles ainsi que votre dernière ordonnance si vous en avez une.
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <button
                className="btn btn-primary me-2"
                onClick={() => setCurrentView('home')}
              >
                Retour à l'accueil
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => setCurrentView('booking')}
              >
                Nouvelle demande
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDU VERSION MOBILE
  // Rendu de la page d'accueil avec les deux options (Mobile)
  const renderHomePageMobile = () => {
    return (
      <div className="home-options">
      
        
        <div className="action-buttons">
          <button 
            className="btn btn-primary btn-lg  mb-5 d-flex justify-content-between align-items-center"
            onClick={() => setCurrentView('booking')}
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
            <span className="flex-grow-1 text-center">Prendre rendez-vous</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          
          <button 
            className="btn btn-outline-primary btn-lg w-100 mb-3 d-flex justify-content-between align-items-center"
            onClick={() => setCurrentView('verification')}
          >
            <FontAwesomeIcon icon={faSearch} className="me-2" />
            <span className="flex-grow-1 text-center">Vérifier un rendez-vous</span>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        
        <div className="quick-contact mt-5">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Contact rapide</h5>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faPhone} className="text-primary me-3" />
                <a href="tel:+33123456789" className="text-decoration-none">(+221) 338258058</a>
              </div>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-3" />
                33 rue D x avenue Aime Cesaire, fann résidence – Dakar – Sénégal
                <address className="mb-0"></address>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu du formulaire de prise de rendez-vous (étape 1 - Mobile)
  const renderBookingStep1Mobile = () => {
    return (
      <div className="booking-form-step">
        <div className="step-indicator mb-4">
          <div className="progress">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: "33%" }}
              aria-valuenow="33" 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <div className="step-text mt-2">Étape 1/3 : Vos coordonnées</div>
        </div>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
            <FontAwesomeIcon 
              icon={message.type === 'success' ? faCheck : faTimes} 
              className="me-2" 
            />
            {message.text}
          </div>
        )}
        
        <div className="mb-3">
          <label htmlFor="nom" className="form-label">Nom <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="prenom" className="form-label">Prénom <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control form-control-lg"
            id="prenom"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
          <input
            type="email"
            className="form-control form-control-lg"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="telephone" className="form-label">Téléphone <span className="text-danger">*</span></label>
          <input
            type="tel"
            className="form-control form-control-lg"
            id="telephone"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="06 12 34 56 78"
            required
          />
        </div>
        
        <div className="d-flex justify-content-between">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Retour
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleNextStep}
            disabled={!isCurrentStepValid()}
          >
            Suivant
            <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
          </button>
        </div>
      </div>
    );
  };

  // Rendu du formulaire de prise de rendez-vous (étape 2 - Mobile)
  const renderBookingStep2Mobile = () => {
    return (
      <div className="booking-form-step">
        <div className="step-indicator mb-4">
          <div className="progress">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: "66%" }}
              aria-valuenow="66" 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <div className="step-text mt-2">Étape 2/3 : Détails du rendez-vous</div>
        </div>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
            <FontAwesomeIcon 
              icon={message.type === 'success' ? faCheck : faTimes} 
              className="me-2" 
            />
            {message.text}
          </div>
        )}
        
        <div className="mb-3">
          <label htmlFor="dateRdv" className="form-label">Date souhaitée <span className="text-danger">*</span></label>
          <input
            type="date"
            className="form-control form-control-lg"
            id="dateRdv"
            name="dateRdv"
            value={formData.dateRdv}
            onChange={handleChange}
            min={getMinDate()}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="heureRdv" className="form-label">Heure souhaitée <span className="text-danger">*</span></label>
          <select
            className="form-select form-select-lg"
            id="heureRdv"
            name="heureRdv"
            value={formData.heureRdv}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner une heure</option>
            {generateTimeOptions()}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="specialite" className="form-label">Spécialité <span className="text-danger">*</span></label>
          {loadingSpecialites ? (
            <div className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <span>Chargement...</span>
            </div>
          ) : (
            <select
              className="form-select form-select-lg"
              id="specialite"
              name="specialite"
              value={formData.specialite}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner une spécialité</option>
              {specialites.map(specialite => (
                <option key={specialite} value={specialite}>
                  {specialite}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="d-flex justify-content-between">
          <button 
            className="btn btn-outline-secondary"
            onClick={handlePrevStep}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Précédent
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleNextStep}
            disabled={!isCurrentStepValid()}
          >
            Suivant
            <FontAwesomeIcon icon={faChevronRight} className="ms-2" />
          </button>
        </div>
      </div>
    );
  };

  // Rendu du formulaire de prise de rendez-vous (étape 3 - Mobile)
  const renderBookingStep3Mobile = () => {
    return (
      <div className="booking-form-step">
        <div className="step-indicator mb-4">
          <div className="progress">
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: "100%" }}
              aria-valuenow="100" 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <div className="step-text mt-2">Étape 3/3 : Informations complémentaires</div>
        </div>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
            <FontAwesomeIcon 
              icon={message.type === 'success' ? faCheck : faTimes} 
              className="me-2" 
            />
            {message.text}
          </div>
        )}
        
        <div className="mb-3">
          <label htmlFor="motif" className="form-label">Motif de la consultation</label>
          <select
            className="form-select form-select-lg"
            id="motif"
            name="motif"
            value={formData.motif}
            onChange={handleChange}
          >
            <option value="">Sélectionner un motif</option>
            {motifsCommuns.map(motif => (
              <option key={motif} value={motif}>
                {motif}
              </option>
            ))}
          </select>
          {formData.motif === "Autre" && (
            <textarea
              className="form-control mt-2"
              placeholder="Précisez le motif..."
              rows="2"
              name="motifAutre"
              value={formData.motifAutre || ""}
              onChange={handleChange}
            ></textarea>
          )}
        </div>
        
        <div className="mb-4">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="premierRdv"
              name="premierRdv"
              checked={formData.premierRdv}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="premierRdv">
              C'est ma première consultation
            </label>
          </div>
          
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="porteurLunettes"
              name="porteurLunettes"
              checked={formData.porteurLunettes}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="porteurLunettes">
              Je porte des lunettes
            </label>
          </div>
          
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="porteurLentilles"
              name="porteurLentilles"
              checked={formData.porteurLentilles}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="porteurLentilles">
              Je porte des lentilles
            </label>
          </div>
        </div>
        
        <div className="alert alert-info d-flex align-items-start mb-4">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2 mt-1" />
          <div>
            <small>N'oubliez pas d'apporter vos lunettes/lentilles actuelles et votre dernière ordonnance si vous en avez une.</small>
          </div>
        </div>
        
        <div className="d-flex justify-content-between">
          <button 
            className="btn btn-outline-secondary"
            onClick={handlePrevStep}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Précédent
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                Envoi...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="me-2" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Rendu du formulaire de prise de rendez-vous (Mobile - selon l'étape actuelle)
  const renderBookingFormMobile = () => {
    switch (currentStep) {
      case 1:
        return renderBookingStep1Mobile();
      case 2:
        return renderBookingStep2Mobile();
      case 3:
        return renderBookingStep3Mobile();
      default:
        return renderBookingStep1Mobile();
    }
  };

  // Rendu du formulaire de vérification (Mobile)
  const renderVerificationFormMobile = () => {
    return (
      <div className="verification-form">
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Retour
          </button>
          <h5 className="mb-0">Vérification de rendez-vous</h5>
        </div>
        
        {!searchResult ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="card-text mb-4">
                Entrez le code de vérification qui vous a été fourni.
              </p>
              
              <form onSubmit={handleVerificationSearch}>
                <div className="mb-3">
                  <label htmlFor="verificationCode" className="form-label">Code de vérification</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="verificationCode"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      placeholder="Ex: ABCD1234"
                      required
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={searchLoading}
                    >
                      {searchLoading ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faSearch} />
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              {searchError && (
                <div className="alert alert-danger mt-3">
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  {searchError}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Détails du rendez-vous</h5>
            </div>
            <div className="card-body">
              <div className="rdv-detail-item">
                <div className="rdv-detail-label">Patient</div>
                <div className="rdv-detail-value">{searchResult.prenom} {searchResult.nom}</div>
              </div>
              
              <div className="rdv-detail-item">
                <div className="rdv-detail-label">Spécialité</div>
                <div className="rdv-detail-value">{searchResult.specialite}</div>
              </div>
              
              <div className="rdv-detail-item">
                <div className="rdv-detail-label">Date</div>
                <div className="rdv-detail-value">{searchResult.dateFormatted}</div>
              </div>
              
              <div className="rdv-detail-item">
                <div className="rdv-detail-label">Heure</div>
                <div className="rdv-detail-value">{searchResult.heureRdv}</div>
              </div>
              
              {searchResult.motif && (
                <div className="rdv-detail-item">
                  <div className="rdv-detail-label">Motif</div>
                  <div className="rdv-detail-value">
                    {searchResult.motif}
                    {searchResult.motifAutre && ` - ${searchResult.motifAutre}`}
                  </div>
                </div>
              )}
              
              <div className="rdv-detail-item">
                <div className="rdv-detail-label">Statut</div>
                <div className="rdv-detail-value">
                  <span className={`badge ${getStatusBadgeClass(searchResult.status)}`}>
                    {translateStatus(searchResult.status)}
                  </span>
                </div>
              </div>
              
              {/* Afficher les informations du médecin si la demande a été acceptée */}
              {searchResult.status === 'accepted' && searchResult.medecinNom && (
                <div className="rdv-detail-item">
                  <div className="rdv-detail-label">Ophtalmologiste</div>
                  <div className="rdv-detail-value">Dr. {searchResult.medecinNom}</div>
                </div>
              )}
              
              <div className="d-grid gap-2 mt-4">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchResult(null)}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                  Nouvelle recherche
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('home')}
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu de la page de succès (Mobile)
  const renderSuccessPageMobile = () => {
    return (
      <div className="success-page">
        <div className="d-flex align-items-center mb-4">
          <button 
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setCurrentView('home')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
          </button>
          <h5 className="mb-0">Demande envoyée</h5>
        </div>
        
        <div className="card shadow-sm">
          <div className="card-body text-center py-4">
            <div className="success-icon mb-3">
              <FontAwesomeIcon icon={faCheck} className="text-success" size="2x" />
            </div>
            <h5>Demande envoyée avec succès!</h5>
            
            {/* Code de vérification */}
            <div className="verification-code-container p-3 mb-4 border rounded bg-light mt-4">
              <h6 className="mb-2">
                <FontAwesomeIcon icon={faQrcode} className="me-2" />
                Code de vérification
              </h6>
              <p className="small mb-2">
                Conservez ce code pour vérifier le statut de votre demande ultérieurement.
              </p>
              <div className="verification-code d-flex align-items-center justify-content-center">
                <div className="code-display p-2 px-3 bg-white border rounded me-2 fw-bold letter-spacing-2">
                  {verificationCode}
                </div>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={copyToClipboard}
                  title="Copier le code"
                >
                  <FontAwesomeIcon icon={faCopy} />
                  {codeCopied && <span className="ms-2 small">Copié!</span>}
                </button>
              </div>
            </div>
            
            {/* Récapitulatif du rendez-vous */}
            {rdvDetails && (
              <div className="rdv-recap mt-4">
                <h6 className="mb-3">Récapitulatif</h6>
                
                <div className="rdv-detail-list">
                  <div className="rdv-detail-item">
                    <div className="rdv-detail-label">Patient</div>
                    <div className="rdv-detail-value">{rdvDetails.prenom} {rdvDetails.nom}</div>
                  </div>
                  
                  <div className="rdv-detail-item">
                    <div className="rdv-detail-label">Spécialité</div>
                    <div className="rdv-detail-value">{rdvDetails.specialite}</div>
                  </div>
                  
                  <div className="rdv-detail-item">
                    <div className="rdv-detail-label">Date</div>
                    <div className="rdv-detail-value">{rdvDetails.dateFormatted}</div>
                  </div>
                  
                  <div className="rdv-detail-item">
                    <div className="rdv-detail-label">Heure</div>
                    <div className="rdv-detail-value">{rdvDetails.heureRdv}</div>
                  </div>
                </div>
                
                <div className="alert alert-info d-flex align-items-center mt-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                  <small>Nous vous contacterons bientôt pour confirmer votre rendez-vous.</small>
                </div>
              </div>
            )}
            
            <div className="d-grid gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={() => setCurrentView('home')}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDU PRINCIPAL
  // Choisir le rendu en fonction de l'appareil (mobile ou desktop)
  const renderContent = () => {
    if (isMobile) {
      // Rendu mobile
      switch (currentView) {
        case 'home':
          return renderHomePageMobile();
        case 'booking':
          return renderBookingFormMobile();
        case 'verification':
          return renderVerificationFormMobile();
        case 'success':
          return renderSuccessPageMobile();
        default:
          return renderHomePageMobile();
      }
    } else {
      // Rendu desktop
      switch (currentView) {
        case 'home':
          return renderHomePageDesktop();
        case 'booking':
          return renderBookingFormDesktop();
        case 'verification':
          return renderVerificationFormDesktop();
        case 'success':
          return renderSuccessPageDesktop();
        default:
          return renderHomePageDesktop();
      }
    }
  };

  return (
    <div className={`quick-container ${isMobile ? 'quick-mobile' : 'quick-desktop'}`}>
    
      
      <div className={`quick-body ${isMobile ? 'quick-mobile-body' : 'quick-desktop-body'}`}>
        {renderContent()}
      </div>
      
      <style jsx>{`
        .quick-container {
          width: 100%;
          overflow-x: hidden;
        }
        
        .quick-desktop {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px;
        }
        
        .quick-mobile {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .quick-mobile-header {
          background-color: #0070f3;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 18px;
          font-weight: 500;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        
        .quick-mobile-body {
          padding: 20px 15px;
        }
        
        .quick-desktop-body {
          padding: 20px 0;
        }
        
        /* Styles communs */
        .icon-container {
          width: 70px;
          height: 70px;
          background-color: rgba(0, 112, 243, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        .progress {
          height: 8px;
        }
        
        .progress-bar {
          background-color: #0070f3;
        }
        
        .step-text {
          font-size: 14px;
          color: #6c757d;
          text-align: center;
        }
        
        .rdv-detail-item {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .rdv-detail-item:last-child {
          border-bottom: none;
        }
        
        .rdv-detail-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 5px;
        }
        
        .success-icon {
          width: 60px;
          height: 60px;
          background-color: rgba(40, 167, 69, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        
        .letter-spacing-2 {
          letter-spacing: 2px;
        }
        
        .verification-code-container {
          background-color: rgba(0, 112, 243, 0.05);
        }
        
        /* Styles spécifiques pour mobile */
        @media (max-width: 768px) {
          .form-control-lg, .form-select-lg {
            font-size: 16px;
            padding: 12px;
          }
          
          .action-buttons .btn {
            padding: 15px;
            font-size: 16px;
          }
        }
        
        /* Ajustements pour les très petits écrans */
        @media (max-width: 360px) {
          .btn {
            padding: 0.375rem 0.5rem;
          }
          
          .quick-mobile-body {
            padding: 5px 1px;
          }
        }
      `}</style>
    </div>
  );
};

export default Quick;

