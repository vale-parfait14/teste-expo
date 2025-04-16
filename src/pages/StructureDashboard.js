import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc,addDocs , setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import AffiliationRequestsManagerMedecins from './AffiliationRequestsManagerMedecins.js';
import AffiliationRequestsManagerPatients from './AffiliationRequestsManagerPatients.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUserMd, faUser, faCalendarAlt, faArchive, 
  faLink, faKey, faBars,faPlus,faArrowLeft,faArrowRight,faUserPlus,faCalendarPlus,faSignOutAlt, faPlusCircle, faFilter,
  faEdit, faTrash, faClock, faCheck, faTimes, faExclamationTriangle,
  faFile, faSearch, faChevronLeft, faChevronRight, faPhone, faEnvelope,
  faCalendarDay, faCalendarWeek, faCalendarCheck, faExchangeAlt, faEye
} from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './StructureDashboard.css';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { Modal, Button, Form } from 'react-bootstrap';

const StructureDashboard = () => {
  const [structureData, setStructureData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('rendezvous'); //info,  rendezvous , patients, doctors, 
  const [medecins, setMedecins] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [showMedecinForm, setShowMedecinForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showRendezvousForm, setShowRendezvousForm] = useState(false);
  const [currentMedecin, setCurrentMedecin] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRendezvous, setCurrentRendezvous] = useState(null);
  const [filtreDate, setFiltreDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  
  const [filtreMedecin, setFiltreMedecin] = useState('');
  const [archives, setArchives] = useState([]);
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [currentArchive, setCurrentArchive] = useState(null);
  const [archiveFiles, setArchiveFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filtreArchivePatient, setFiltreArchivePatient] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 999);
  
  const MAYTAPI_PRODUCT_ID = 'votre_product_id'; // À remplacer par votre Product ID Maytapi
const MAYTAPI_API_TOKEN = 'votre_api_token'; // À remplacer par votre token API Maytapi
const MAYTAPI_PHONE_ID = 'votre_phone_id'; // À remplacer par votre Phone ID Maytapi

// Fonction pour envoyer un message WhatsApp via Maytapi
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}/sendMessage`,
      headers: {
        'Content-Type': 'application/json',
        'x-maytapi-key': MAYTAPI_API_TOKEN
      },
      data: {
        to_number: phoneNumber,
        message: message,
        type: 'text'
      }
    });
    
    console.log('Message WhatsApp envoyé avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
    throw error;
  }
};



// Fonction pour générer un mot de passe aléatoire
const generateRandomPassword = (length = 10) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};



  // État du formulaire d'archive
  const [archiveForm, setArchiveForm] = useState({
    patientId: '',
    titre: '',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    files: []
  });
  
  // Constantes
  const tagsList = ["Consultation", "Examen", "Ordonnance", "Analyse", "Radiologie", "Hospitalisation", "Chirurgie", "Suivi", "Autre"];
  const storage = getStorage();
  
  // État du formulaire médecin
  const [medecinForm, setMedecinForm] = useState({
    nom: '',
    prenom: '',
    specialite: '',
    telephone: '',
    email: '',
    password: '',
    disponibilites: {
      lundi: { actif: false, debut: '08:00', fin: '18:00' },
      mardi: { actif: false, debut: '08:00', fin: '18:00' },
      mercredi: { actif: false, debut: '08:00', fin: '18:00' },
      jeudi: { actif: false, debut: '08:00', fin: '18:00' },
      vendredi: { actif: false, debut: '08:00', fin: '18:00' },
      samedi: { actif: false, debut: '08:00', fin: '18:00' },
      dimanche: { actif: false, debut: '08:00', fin: '18:00' }
    },
    assurances: []
  });
  
  // État du formulaire patient
  const [patientForm, setPatientForm] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    email: '',
    password: '',
    telephone: '',
    assurances: []
  });
  
  // État du formulaire rendez-vous
  const [rdvForm, setRdvForm] = useState({
    medecinId: '',
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    heure: '08:00',
    duree: 5,
    motif: '',
    statut: 'confirmé'
  });
  
  // Constantes
  const specialites = ["Généraliste", "Cardiologue", "Dermatologue", "Pédiatre", "Gynécologue", "Ophtalmologue", "Autre"];
  const assurancesList = ["CNAM", "CNSS", "CNRPS", "Assurance privée", "Autre"];
  const joursSemaine = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const statutsRdv = [ "confirmé", "terminé", "annulé"];
  const dureesRdv = [15, 30, 45, 60, 90, 120];
  
  // États pour la vue calendrier
  const [calendarView, setCalendarView] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showMedecinRdvModal, setShowMedecinRdvModal] = useState(false);
  const [selectedMedecinId, setSelectedMedecinId] = useState(null);
  const [showRdvDetailsModal, setShowRdvDetailsModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [draggedRdv, setDraggedRdv] = useState(null);
    // Variables d'état pour l'interface mobile
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileActionMenu, setShowMobileActionMenu] = useState(false);
    const [mobileDetailView, setMobileDetailView] = useState(null);
    const [mobileSearchActive, setMobileSearchActive] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');

    const [quickRequests, setQuickRequests] = useState([]);
    const [showQuickRequestsModal, setShowQuickRequestsModal] = useState(false);
    const [selectedQuickRequest, setSelectedQuickRequest] = useState(null);
    const [assignMedecinModal, setAssignMedecinModal] = useState(false);
    const [selectedMedecinForQuick, setSelectedMedecinForQuick] = useState('');
    const [quickRequestsCount, setQuickRequestsCount] = useState(0);

    

  const navigate = useNavigate();
  const auth = getAuth();

  // Gestion de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 999);
      if (window.innerWidth < 999) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'structures', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStructureData(docSnap.data());
          setForm(docSnap.data());
          fetchMedecins(user.uid);
          fetchPatients(user.uid);
          fetchRendezvous(user.uid);
          fetchArchives(user.uid);
          fetchPendingRequests(user.uid);
        }
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Récupérer les demandes d'affiliation en attente
  const fetchPendingRequests = async (structureId) => {
    try {
      const medecinRequestsQuery = query(
        collection(db, 'affiliationRequests'),
        where("structureId", "==", structureId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(medecinRequestsQuery);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setPendingRequests(requests);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes d'affiliation:", error);
    }
  };

  const fetchArchives = async (structureId) => {
    try {
      const q = query(collection(db, 'archives'), where("structureId", "==", structureId));
      const querySnapshot = await getDocs(q);
      const archivesData = [];
      querySnapshot.forEach((doc) => {
        archivesData.push({ id: doc.id, ...doc.data() });
      });
      setArchives(archivesData);
    } catch (error) {
      setMessage(`Erreur lors du chargement des archives: ${error.message}`);
    }
  };

  // Récupération des données
  const fetchMedecins = async (structureId) => {
    try {
      const q = query(collection(db, 'medecins'), where("structureId", "==", structureId));
      const querySnapshot = await getDocs(q);
      const medecinsData = [];
      querySnapshot.forEach((doc) => {
        medecinsData.push({ id: doc.id, ...doc.data() });
      });
      setMedecins(medecinsData);
    } catch (error) {
      setMessage(`Erreur lors du chargement des médecins: ${error.message}`);
    }
  };

  const fetchPatients = async (structureId) => {
    try {
      const q = query(collection(db, 'patients'), where("structureId", "==", structureId));
      const querySnapshot = await getDocs(q);
      const patientsData = [];
      querySnapshot.forEach((doc) => {
        patientsData.push({ id: doc.id, ...doc.data() });
      });
      setPatients(patientsData);
    } catch (error) {
      setMessage(`Erreur lors du chargement des patients: ${error.message}`);
    }
  };

  const fetchRendezvous = async (structureId) => {
    try {
      const q = query(collection(db, 'rendezvous'), where("structureId", "==", structureId));
      const querySnapshot = await getDocs(q);
      const rdvData = [];
      querySnapshot.forEach((doc) => {
        const rdv = doc.data();
        // Normaliser la date lors du chargement
        if (rdv.date) {
          // S'assurer que la date est correctement formatée (YYYY-MM-DD)
          const dateObj = new Date(rdv.date);
          if (!isNaN(dateObj.getTime())) {
            rdv.date = formatDateString(dateObj);
          }
        }
        rdvData.push({ id: doc.id, ...rdv });
      });
      setRendezvous(rdvData);
    } catch (error) {
      setMessage(`Erreur lors du chargement des rendez-vous: ${error.message}`);
    }
  };
  

  // Fonctions générales
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleUpdate = async () => {
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'structures', user.uid), form);
      setMessage('Informations mises à jour avec succès.');
      
      // Afficher le message puis le faire disparaître après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
      setMessage('Mot de passe mis à jour avec succès.');
      setNewPassword('');
      
      // Afficher le message puis le faire disparaître après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Gestion des formulaires d'archive
  const handleArchiveChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "tags") {
      const updatedArray = [...archiveForm.tags];
      if (checked) {
        updatedArray.push(value);
      } else {
        const index = updatedArray.indexOf(value);
        if (index > -1) {
          updatedArray.splice(index, 1);
        }
      }
      setArchiveForm({ ...archiveForm, [name]: updatedArray });
    } else {
      setArchiveForm({ ...archiveForm, [name]: value });
    }
  };
  
  const resetArchiveForm = () => {
    setArchiveForm({
      patientId: '',
      titre: '',
      description: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      files: []
    });
    setSelectedFiles([]);
    setCurrentArchive(null);
  };
  
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleAddArchive = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      const fileUrls = [];
      
      // Uploader les fichiers sélectionnés
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const storageRef = ref(storage, `archives/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          fileUrls.push({ name: file.name, url: downloadURL, path: storageRef.fullPath });
        }
      }
      
      // Récupérer les informations du patient pour les stocker dans l'archive
      const patient = patients.find(p => p.id === archiveForm.patientId);
      
      const archiveData = {
        ...archiveForm,
        patientNom: patient ? `${patient.prenom} ${patient.nom}` : '',
        files: currentArchive ? [...archiveForm.files, ...fileUrls] : fileUrls
      };
      
      if (currentArchive) {
        // Mise à jour d'une archive existante
        await updateDoc(doc(db, 'archives', currentArchive.id), {
          ...archiveData,
          updatedAt: new Date()
        });
        
        setMessage('Archive mise à jour avec succès.');
      } else {
        // Création d'une nouvelle archive
        await addDoc(collection(db, 'archives'), {
          ...archiveData,
          structureId: user.uid,
          createdAt: new Date()
        });
        
        setMessage('Archive ajoutée avec succès.');
      }
      
      resetArchiveForm();
      setShowArchiveForm(false);
      fetchArchives(user.uid);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  const handleEditArchive = (archive) => {
    setCurrentArchive(archive);
    setArchiveForm({
      patientId: archive.patientId || '',
      titre: archive.titre || '',
      description: archive.description || '',
      notes: archive.notes || '',
      date: archive.date || new Date().toISOString().split('T')[0],
      tags: archive.tags || [],
      files: archive.files || []
    });
    setShowArchiveForm(true);
  };
  
  const handleDeleteArchive = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette archive ?')) {
      try {
        // Récupérer l'archive pour obtenir les chemins des fichiers
        const archiveDoc = await getDoc(doc(db, 'archives', id));
        const archiveData = archiveDoc.data();
        
        // Supprimer les fichiers du stockage
        if (archiveData.files && archiveData.files.length > 0) {
          for (const file of archiveData.files) {
            if (file.path) {
              const fileRef = ref(storage, file.path);
              await deleteObject(fileRef);
            }
          }
        }
        
        // Supprimer le document de l'archive
        await deleteDoc(doc(db, 'archives', id));
        setMessage('Archive supprimée avec succès.');
        const user = auth.currentUser;
        fetchArchives(user.uid);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };
  
  const handleDeleteFile = async (archiveId, filePath, fileIndex) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        // Supprimer le fichier du stockage
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        
        // Mettre à jour le document de l'archive
        const archiveDoc = await getDoc(doc(db, 'archives', archiveId));
        const archiveData = archiveDoc.data();
        
        const updatedFiles = [...archiveData.files];
        updatedFiles.splice(fileIndex, 1);
        
        await updateDoc(doc(db, 'archives', archiveId), {
          files: updatedFiles,
          updatedAt: new Date()
        });
        
        setMessage('Fichier supprimé avec succès.');
        const user = auth.currentUser;
        fetchArchives(user.uid);
        
        // Si on est en train d'éditer cette archive, mettre à jour le formulaire
        if (currentArchive && currentArchive.id === archiveId) {
          setArchiveForm({
            ...archiveForm,
            files: updatedFiles
          });
        }
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };

  // Gestion des formulaires médecin
  const handleMedecinChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "assurances") {
      // Pour les checkboxes d'assurances
      const updatedArray = [...medecinForm.assurances];
      if (checked) {
        updatedArray.push(value);
      } else {
        const index = updatedArray.indexOf(value);
        if (index > -1) {
          updatedArray.splice(index, 1);
        }
      }
      setMedecinForm({ ...medecinForm, [name]: updatedArray });
    } else {
      setMedecinForm({ ...medecinForm, [name]: value });
    }
  };

  const handleDisponibiliteChange = (jour, field, value) => {
    setMedecinForm({
      ...medecinForm,
      disponibilites: {
        ...medecinForm.disponibilites,
        [jour]: {
          ...medecinForm.disponibilites[jour],
          [field]: field === 'actif' ? !medecinForm.disponibilites[jour].actif : value
        }
      }
    });
  };

  const resetMedecinForm = () => {
    setMedecinForm({
      nom: '',
      prenom: '',
      specialite: '',
      telephone: '',
      email: '',
      // Suppression du champ password
      disponibilites: {
        lundi: { actif: false, debut: '08:00', fin: '18:00' },
        mardi: { actif: false, debut: '08:00', fin: '18:00' },
        mercredi: { actif: false, debut: '08:00', fin: '18:00' },
        jeudi: { actif: false, debut: '08:00', fin: '18:00' },
        vendredi: { actif: false, debut: '08:00', fin: '18:00' },
        samedi: { actif: false, debut: '08:00', fin: '18:00' },
        dimanche: { actif: false, debut: '08:00', fin: '18:00' }
      },
      assurances: []
    });
    setCurrentMedecin(null);
  };

  const handleAddMedecin = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      
      // Générer un mot de passe aléatoire pour le nouveau médecin
      let medecinAuthId;
      let generatedPassword = '';
      
      if (!currentMedecin) {
        // Création d'un nouveau médecin - générer un mot de passe
        generatedPassword = generateRandomPassword(12);
        
        // Créer un compte utilisateur avec le mot de passe généré
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          medecinForm.email, 
          generatedPassword
        );
        medecinAuthId = userCredential.user.uid;
        
        // Formater le numéro de téléphone pour WhatsApp (ajouter le code pays si nécessaire)
        let phoneNumber = medecinForm.telephone;
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+221' + phoneNumber.substring(1); // Exemple pour la France
        }
        
        // Préparer le message de bienvenue
        const welcomeMessage = `Bonjour Dr. ${medecinForm.prenom} ${medecinForm.nom},\n\n` +
          `Bienvenue sur notre plateforme de gestion médicale!\n\n` +
          `Voici vos informations de connexion:\n` +
          `Email: ${medecinForm.email}\n` +
          `Mot de passe: ${generatedPassword}\n\n` +
          `Nous vous recommandons de changer votre mot de passe après votre première connexion.`;
        
        // Envoyer le message WhatsApp
        await sendWhatsAppMessage(phoneNumber, welcomeMessage);
      }
      
      // Convertir les disponibilités du format formulaire vers le format à stocker
      const disponibilitesAEnregistrer = [];
      Object.entries(medecinForm.disponibilites).forEach(([jour, valeur]) => {
        if (valeur.actif) {
          disponibilitesAEnregistrer.push({
            jour: jour.charAt(0).toUpperCase() + jour.slice(1),
            heureDebut: valeur.debut,
            heureFin: valeur.fin
          });
        }
      });
      
      const medecinData = {
        ...medecinForm,
        disponibilites: disponibilitesAEnregistrer,
        structureId: user.uid,
      };
      
      // Supprimer le mot de passe des données stockées
      delete medecinData.password;
      
      if (currentMedecin) {
        // Modification d'un médecin existant
        await updateDoc(doc(db, 'medecins', currentMedecin.id), {
          ...medecinData,
          updatedAt: new Date()
        });
        setMessage('Médecin mis à jour avec succès.');
      } else {
        // Création d'un nouveau médecin - utiliser l'ID d'authentification comme ID de document
        await setDoc(doc(db, 'medecins', medecinAuthId), {
          ...medecinData,
          createdAt: new Date()
        });
        setMessage('Médecin ajouté avec succès. Un message WhatsApp a été envoyé avec les informations de connexion.');
      }
      
      resetMedecinForm();
      setShowMedecinForm(false);
      fetchMedecins(user.uid);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };
  

  const handleEditMedecin = (medecin) => {
    setCurrentMedecin(medecin);
    
    // Conversion des disponibilités du format stocké vers le format du formulaire
    let disponibilitesFormattees = {
      lundi: { actif: false, debut: '08:00', fin: '18:00' },
      mardi: { actif: false, debut: '08:00', fin: '18:00' },
      mercredi: { actif: false, debut: '08:00', fin: '18:00' },
      jeudi: { actif: false, debut: '08:00', fin: '18:00' },
      vendredi: { actif: false, debut: '08:00', fin: '18:00' },
      samedi: { actif: false, debut: '08:00', fin: '18:00' },
      dimanche: { actif: false, debut: '08:00', fin: '18:00' }
    };
    
    // Si le médecin a des disponibilités existantes, les convertir
    if (medecin.disponibilites && Array.isArray(medecin.disponibilites)) {
      medecin.disponibilites.forEach(dispo => {
        const jour = dispo.jour.toLowerCase();
        if (disponibilitesFormattees[jour]) {
          disponibilitesFormattees[jour] = {
            actif: true,
            debut: dispo.heureDebut || '08:00',
            fin: dispo.heureFin || '18:00'
          };
        }
      });
    } else if (medecin.disponibilites && typeof medecin.disponibilites === 'object') {
      // Si les disponibilités sont déjà au bon format
      disponibilitesFormattees = medecin.disponibilites;
    }
    
    setMedecinForm({
      nom: medecin.nom || '',
      prenom: medecin.prenom || '',
      specialite: medecin.specialite || '',
      telephone: medecin.telephone || '',
      email: medecin.email || '',
      password: '',  // Ne pas afficher le mot de passe existant
      disponibilites: disponibilitesFormattees,
      assurances: medecin.assurances || []
    });
    setShowMedecinForm(true);
  };

  const handleDeleteMedecin = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      try {
        await deleteDoc(doc(db, 'medecins', id));
        setMessage('Médecin supprimé avec succès.');
        const user = auth.currentUser;
        fetchMedecins(user.uid);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  // Gestion des formulaires patient
  const handlePatientChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "assurances") {
      // Pour les checkboxes d'assurances
      const updatedArray = [...patientForm.assurances];
      if (checked) {
        updatedArray.push(value);
      } else {
        const index = updatedArray.indexOf(value);
        if (index > -1) {
          updatedArray.splice(index, 1);
        }
      }
      setPatientForm({ ...patientForm, [name]: updatedArray });
    } else {
      setPatientForm({ ...patientForm, [name]: value });
    }
  };

  const resetPatientForm = () => {
    setPatientForm({
      nom: '',
      prenom: '',
      dateNaissance: '',
      email: '',
      // Suppression du champ password
      telephone: '',
      assurances: []
    });
    setCurrentPatient(null);
  };



  const fetchQuickRequests = async (structureId) => {
    try {
      const q = query(
        collection(db, 'quickAppointments'),
        where("structureId", "==", structureId),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setQuickRequests(requests);
      setQuickRequestsCount(requests.length);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes rapides:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'structures', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStructureData(docSnap.data());
          setForm(docSnap.data());
          fetchMedecins(user.uid);
          fetchPatients(user.uid);
          fetchRendezvous(user.uid);
          fetchArchives(user.uid);
          fetchPendingRequests(user.uid);
          fetchQuickRequests(user.uid); // Ajout de la récupération des demandes rapides
        }
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // Fonction pour accepter une demande de rendez-vous rapide
  const handleAcceptQuickRequest = async () => {
    try {
      if (!selectedQuickRequest || !selectedMedecinForQuick) {
        setMessage("Veuillez sélectionner un médecin pour ce rendez-vous.");
        return;
      }

      const user = auth.currentUser;
      const medecin = medecins.find(m => m.id === selectedMedecinForQuick);
      
      // Créer un nouveau rendez-vous à partir de la demande rapide
      const rdvData = {
        medecinId: selectedMedecinForQuick,
        medecinNom: `${medecin.prenom} ${medecin.nom}`,
        medecinSpecialite: medecin.specialite,
        patientNom: `${selectedQuickRequest.prenom} ${selectedQuickRequest.nom}`,
        date: selectedQuickRequest.dateFormatted,
        heure: selectedQuickRequest.heureRdv,
        motif: selectedQuickRequest.motif || "Consultation",
        statut: "confirmé",
        structureId: user.uid,
        email: selectedQuickRequest.email,
        telephone: selectedQuickRequest.telephone,
        createdAt: new Date()
      };

      // Ajouter le rendez-vous à la collection rendezvous
      await addDoc(collection(db, 'rendezvous'), rdvData);
      
      // Mettre à jour le statut de la demande rapide
      await updateDoc(doc(db, 'quickAppointments', selectedQuickRequest.id), {
        status: "accepted",
        medecinId: selectedMedecinForQuick,
        medecinNom: `${medecin.prenom} ${medecin.nom}`,
        updatedAt: new Date()
      });

      // Envoyer une notification au patient (par email ou SMS si configuré)
      if (selectedQuickRequest.telephone) {
        try {
          const message = `Votre demande de rendez-vous a été acceptée. Dr. ${medecin.prenom} ${medecin.nom} vous recevra le ${selectedQuickRequest.dateFormatted} à ${selectedQuickRequest.heureRdv}. Votre code de vérification: ${selectedQuickRequest.verificationCode}`;
          await sendWhatsAppMessage(selectedQuickRequest.telephone, message);
        } catch (error) {
          console.error("Erreur lors de l'envoi du message WhatsApp:", error);
        }
      }

      setMessage("Demande de rendez-vous acceptée avec succès.");
      fetchQuickRequests(user.uid);
      fetchRendezvous(user.uid);
      setAssignMedecinModal(false);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour refuser une demande de rendez-vous rapide
  const handleRejectQuickRequest = async (requestId) => {
    if (window.confirm('Êtes-vous sûr de vouloir refuser cette demande de rendez-vous ?')) {
      try {
        const user = auth.currentUser;
        
        // Mettre à jour le statut de la demande rapide
        await updateDoc(doc(db, 'quickAppointments', requestId), {
          status: "rejected",
          updatedAt: new Date()
        });

        setMessage("Demande de rendez-vous refusée.");
        fetchQuickRequests(user.uid);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };

  // Ajouter un nouveau composant pour la section des demandes rapides
  const renderQuickRequestsSection = () => {
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>
            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
            Demandes de rendez-vous rapides
            {quickRequestsCount > 0 && (
              <span className="badge bg-danger ms-2">{quickRequestsCount}</span>
            )}
          </h5>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowQuickRequestsModal(true)}
          >
            Voir toutes les demandes
          </Button>
        </div>
        <div className="card-body">
          {quickRequests.length > 0 ? (
            <div className="quick-requests-preview">
              {quickRequests.slice(0, 3).map(request => (
                <div key={request.id} className="quick-request-item">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">{request.prenom} {request.nom}</h6>
                    <span className="badge bg-warning">En attente</span>
                  </div>
                  <div className="quick-request-details">
                    <p><strong>Date souhaitée:</strong> {request.dateFormatted}</p>
                    <p><strong>Heure:</strong> {request.heureRdv}</p>
                    <p><strong>Contact:</strong> {request.telephone}</p>
                    {request.motif && <p><strong>Motif:</strong> {request.motif}</p>}
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleRejectQuickRequest(request.id)}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-1" />
                      Refuser
                    </Button>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => {
                        setSelectedQuickRequest(request);
                        setAssignMedecinModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} className="me-1" />
                      Accepter
                    </Button>
                  </div>
                </div>
              ))}
              {quickRequests.length > 3 && (
                <div className="text-center mt-3">
                  <Button 
                    variant="link" 
                    onClick={() => setShowQuickRequestsModal(true)}
                  >
                    Voir {quickRequests.length - 3} demandes supplémentaires
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-3 text-muted">Aucune demande de rendez-vous rapide en attente</p>
          )}
        </div>
      </div>
    );
  };




  // Fonction pour formater un numéro de téléphone au format international
const formatPhoneNumberForWhatsApp = (phoneNumber, countryCode = '221') => {
  // Supprimer les espaces, tirets et autres caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Si le numéro commence par un 0, le remplacer par le code pays
  if (cleaned.startsWith('0')) {
    cleaned = '+' + countryCode + cleaned.substring(1);
  } 
  // Si le numéro ne commence pas par un +, ajouter le +
  else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

// Fonction améliorée pour envoyer un message WhatsApp avec gestion des erreurs
const sendWhatsAppMessageWithRetry = async (phoneNumber, message, maxRetries = 3) => {
  let retries = 0;
  let success = false;
  let lastError = null;
  
  while (retries < maxRetries && !success) {
    try {
      await sendWhatsAppMessage(phoneNumber, message);
      success = true;
    } catch (error) {
      lastError = error;
      retries++;
      
      // Attendre avant de réessayer (backoff exponentiel)
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  }
  
  if (!success) {
    console.error(`Échec de l'envoi du message WhatsApp après ${maxRetries} tentatives:`, lastError);
    // Enregistrer l'échec pour une tentative ultérieure
    await addDoc(collection(db, 'failedWhatsAppMessages'), {
      phoneNumber,
      message,
      createdAt: new Date(),
      error: lastError?.message || 'Unknown error'
    });
    throw new Error(`Impossible d'envoyer le message WhatsApp. Il sera réessayé plus tard.`);
  }
  
  return success;
};


// Fonction pour traiter les messages WhatsApp en échec
const processFailedWhatsAppMessages = async () => {
  try {
    const failedMessagesQuery = query(collection(db, 'failedWhatsAppMessages'), 
      where('retryCount', '<', 5));
    
    const snapshot = await getDocs(failedMessagesQuery);
    
    for (const doc of snapshot.docs) {
      const messageData = doc.data();
      try {
        await sendWhatsAppMessage(messageData.phoneNumber, messageData.message);
        
        // Message envoyé avec succès, supprimer de la file d'attente
        await deleteDoc(doc.ref);
        
        console.log(`Message en échec envoyé avec succès: ${doc.id}`);
      } catch (error) {
        // Incrémenter le compteur de tentatives
        await updateDoc(doc.ref, {
          retryCount: (messageData.retryCount || 0) + 1,
          lastRetry: new Date(),
          lastError: error.message
        });
        
        console.error(`Échec de l'envoi du message ${doc.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement des messages en échec:', error);
  }
};

// Exécuter le traitement des messages en échec périodiquement
useEffect(() => {
  const intervalId = setInterval(processFailedWhatsAppMessages, 15 * 60 * 1000); // Toutes les 15 minutes
  
  return () => clearInterval(intervalId);
}, []);


// Fonction pour afficher une notification plus détaillée
const showNotification = (message, type = 'success', duration = 5000) => {
  setMessage({
    text: message,
    type: type
  });
  
  setTimeout(() => setMessage(''), duration);
};




// Fonction pour créer un template de message de bienvenue
const createWelcomeTemplate = (firstName, lastName, email, password, isDoctor = false) => {
  const title = isDoctor ? `Dr. ${firstName} ${lastName}` : `${firstName} ${lastName}`;
  
  return {
    to_number: phoneNumber,
    type: "template",
    message: "welcome_message",
    params: [
      title,
      email,
      password
    ]
  };
};

// Utilisation avec l'API Maytapi pour les templates
const sendWhatsAppTemplate = async (phoneNumber, templateData) => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID}/${MAYTAPI_PHONE_ID}/sendTemplate`,
      headers: {
        'Content-Type': 'application/json',
        'x-maytapi-key': MAYTAPI_API_TOKEN
      },
      data: {
        to_number: phoneNumber,
        ...templateData
      }
    });
    
    console.log('Template WhatsApp envoyé avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du template WhatsApp:', error);
    throw error;
  }
};



  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      
      // Générer un mot de passe aléatoire pour le nouveau patient
      let patientAuthId;
      let generatedPassword = '';
      
      if (!currentPatient) {
        // Création d'un nouveau patient - générer un mot de passe
        generatedPassword = generateRandomPassword(12);
        
        // Créer un compte utilisateur avec le mot de passe généré
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          patientForm.email, 
          generatedPassword
        );
        patientAuthId = userCredential.user.uid;
        
        // Formater le numéro de téléphone pour WhatsApp (ajouter le code pays si nécessaire)
        let phoneNumber = patientForm.telephone;
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+33' + phoneNumber.substring(1); // Exemple pour la France
        }
        
        // Préparer le message de bienvenue
        const welcomeMessage = `Bonjour ${patientForm.prenom} ${patientForm.nom},\n\n` +
          `Bienvenue sur notre plateforme de gestion médicale!\n\n` +
          `Voici vos informations de connexion:\n` +
          `Email: ${patientForm.email}\n` +
          `Mot de passe: ${generatedPassword}\n\n` +
          `Nous vous recommandons de changer votre mot de passe après votre première connexion.`;
        
        // Envoyer le message WhatsApp
        await sendWhatsAppMessage(phoneNumber, welcomeMessage);
      }
      
      const patientData = {
        ...patientForm,
        structureId: user.uid,
      };
      
      // Supprimer le mot de passe des données stockées
      delete patientData.password;
      
      if (currentPatient) {
        // Modification d'un patient existant
        await updateDoc(doc(db, 'patients', currentPatient.id), {
          ...patientData,
          updatedAt: new Date()
        });
        setMessage('Patient mis à jour avec succès.');
      } else {
        // Création d'un nouveau patient - utiliser l'ID d'authentification comme ID de document
        await setDoc(doc(db, 'patients', patientAuthId), {
          ...patientData,
          createdAt: new Date()
        });
        setMessage('Patient ajouté avec succès. Un message WhatsApp a été envoyé avec les informations de connexion.');
      }
      
      resetPatientForm();
      setShowPatientForm(false);
      fetchPatients(user.uid);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  

  const handleEditPatient = (patient) => {
    setCurrentPatient(patient);
    setPatientForm({
      nom: patient.nom || '',
      prenom: patient.prenom || '',
      dateNaissance: patient.dateNaissance || '',
      email: patient.email || '',
      password: '',  // Ne pas afficher le mot de passe existant
      telephone: patient.telephone || '',
      assurances: patient.assurances || []
    });
    setShowPatientForm(true);
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      try {
        await deleteDoc(doc(db, 'patients', id));
        setMessage('Patient supprimé avec succès.');
        const user = auth.currentUser;
        fetchPatients(user.uid);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  // Gestion des formulaires rendez-vous
  const handleRdvChange = (e) => {
    const { name, value } = e.target;
    setRdvForm({ ...rdvForm, [name]: value });
  };

  const resetRdvForm = () => {
    setRdvForm({
      medecinId: '',
      patientId: '',
      date: new Date().toISOString().split('T')[0],
      heure: '08:00',
      duree: 15,
      motif: '',
      statut: 'confirmé'
    });
    setCurrentRendezvous(null);
  };

// Vérifier si l'heure de rendez-vous est disponible
const verifierDisponibilite = (medecinId, date, heure, duree, rdvIdAExclure = null) => {
  // Trouver le médecin
  const medecin = medecins.find(m => m.id === medecinId);
  if (!medecin) return false;
  
  // Vérifier le jour de la semaine
  const jourDate = new Date(date);
  const joursMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jourSemaine = joursMap[jourDate.getDay()];
  
  // Vérifier si le médecin travaille ce jour-là
  let disponibiliteJour = null;
  if (Array.isArray(medecin.disponibilites)) {
    disponibiliteJour = medecin.disponibilites.find(d => 
      d.jour.toLowerCase() === jourSemaine.toLowerCase()
    );
  } else if (medecin.disponibilites && medecin.disponibilites[jourSemaine]) {
    disponibiliteJour = medecin.disponibilites[jourSemaine].actif ? {
      heureDebut: medecin.disponibilites[jourSemaine].debut,
      heureFin: medecin.disponibilites[jourSemaine].fin
    } : null;
  }
  
  if (!disponibiliteJour) return false;
  
  // Vérifier si l'heure est dans la plage de disponibilité
  const heureDebut = disponibiliteJour.heureDebut || disponibiliteJour.debut;
  const heureFin = disponibiliteJour.heureFin || disponibiliteJour.fin;
  
  if (heure < heureDebut || heure > heureFin) return false;
  
  // Calculer l'heure de fin du rendez-vous
  const [heureH, heureM] = heure.split(':').map(Number);
  const heureFinRdv = new Date();
  heureFinRdv.setHours(heureH, heureM + parseInt(duree), 0, 0);
  const heureFinStr = `${heureFinRdv.getHours().toString().padStart(2, '0')}:${heureFinRdv.getMinutes().toString().padStart(2, '0')}`;
  
  if (heureFinStr > heureFin) return false;
  
  // Vérifier les chevauchements avec d'autres rendez-vous
  const rdvDuJour = rendezvous.filter(rdv => 
    rdv.medecinId === medecinId && 
    rdv.date === date && 
    rdv.statut !== 'annulé' &&
    rdv.id !== rdvIdAExclure
  );
  
  // Compter les rendez-vous à cette heure précise
  const rdvAuCreneau = rdvDuJour.filter(rdv => rdv.heure === heure);
  
  // Nombre maximum de rendez-vous simultanés autorisés
  const MAX_RDV_SIMULTANES = 3;
  
  // Si nous avons déjà atteint le nombre maximum de rendez-vous à cette heure
  if (rdvAuCreneau.length >= MAX_RDV_SIMULTANES) {
    return false;
  }
  
  return true;
};



  const handleAddRendezvous = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      
      // Vérifier la disponibilité
      const estDisponible = verifierDisponibilite(
        rdvForm.medecinId, 
        rdvForm.date, 
        rdvForm.heure, 
        rdvForm.duree,
        currentRendezvous?.id
      );
      
      if (!estDisponible) {
        setMessage("Erreur: Le médecin n'est pas disponible à cette heure ou il y a un conflit d'horaire.");
        return;
      }
      
      // Normaliser la date
      const dateObj = new Date(rdvForm.date);
      const normalizedDate = formatDateString(dateObj);
      
      const rdvData = {
        ...rdvForm,
        date: normalizedDate,
        structureId: user.uid,
      };
      
      // Récupérer les informations du médecin et du patient pour les stocker dans le rendez-vous
      const medecin = medecins.find(m => m.id === rdvForm.medecinId);
      const patient = patients.find(p => p.id === rdvForm.patientId);
      
      if (medecin) {
        rdvData.medecinNom = `${medecin.prenom} ${medecin.nom}`;
        rdvData.medecinSpecialite = medecin.specialite;
      }
      
      if (patient) {
        rdvData.patientNom = `${patient.prenom} ${patient.nom}`;
      }
      
      if (currentRendezvous) {
        // Modification d'un rendez-vous existant
        await updateDoc(doc(db, 'rendezvous', currentRendezvous.id), {
          ...rdvData,
          updatedAt: new Date()
        });
        setMessage('Rendez-vous mis à jour avec succès.');
      } else {
        // Création d'un nouveau rendez-vous
        await addDoc(collection(db, 'rendezvous'), {
          ...rdvData,
          createdAt: new Date()
        });
        setMessage('Rendez-vous ajouté avec succès.');
      }
      
      resetRdvForm();
      setShowRendezvousForm(false);
      fetchRendezvous(user.uid);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
    }
  };

  



  const handleEditRendezvous = (rdv) => {
    setCurrentRendezvous(rdv);
    setRdvForm({
      medecinId: rdv.medecinId || '',
      patientId: rdv.patientId || '',
      date: rdv.date || new Date().toISOString().split('T')[0],
      heure: rdv.heure || '08:00',
      duree: rdv.duree || '',
      motif: rdv.motif || '',
      statut: rdv.statut || 'confirmé'
    });
    setShowRendezvousForm(true);
  };

  const handleDeleteRendezvous = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteDoc(doc(db, 'rendezvous', id));
        setMessage('Rendez-vous supprimé avec succès.');
        const user = auth.currentUser;
        fetchRendezvous(user.uid);
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  const handleChangeStatutRendezvous = async (id, nouveauStatut) => {
    try {
      await updateDoc(doc(db, 'rendezvous', id), {
        statut: nouveauStatut,
        updatedAt: new Date()
      });
      setMessage('Statut du rendez-vous mis à jour avec succès.');
      const user = auth.currentUser;
      fetchRendezvous(user.uid);
      
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  };

  // Filtrer les rendez-vous par date et médecin
  const rendezVousFiltres = rendezvous.filter(rdv => {
    let correspondDate = true;
    let correspondMedecin = true;
    
    if (filtreDate) {
      correspondDate = rdv.date === filtreDate;
    }
    
    if (filtreMedecin) {
      correspondMedecin = rdv.medecinId === filtreMedecin;
    }
    
    return correspondDate && correspondMedecin;
  });

  // Trier les rendez-vous par heure
  rendezVousFiltres.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.heure.localeCompare(b.heure);
  });

  // Fonction pour obtenir les créneaux disponibles
  const getCreneauxDisponibles = () => {
    if (!rdvForm.medecinId || !rdvForm.date) return [];
    
    const medecin = medecins.find(m => m.id === rdvForm.medecinId);
    if (!medecin) return [];
    
    // Déterminer le jour de la semaine
    const jourDate = new Date(rdvForm.date);
    const joursMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const jourSemaine = joursMap[jourDate.getDay()];
    
    // Obtenir les horaires du médecin pour ce jour
    let heureDebut = '08:00';
    let heureFin = '18:00';
    
    if (Array.isArray(medecin.disponibilites)) {
      const disponibiliteJour = medecin.disponibilites.find(d => 
        d.jour.toLowerCase() === jourSemaine.toLowerCase()
      );
      
      if (disponibiliteJour) {
        heureDebut = disponibiliteJour.heureDebut;
        heureFin = disponibiliteJour.heureFin;
      } else {
        return []; // Le médecin ne travaille pas ce jour
      }
    } else if (medecin.disponibilites && medecin.disponibilites[jourSemaine]) {
      if (!medecin.disponibilites[jourSemaine].actif) {
        return []; // Le médecin ne travaille pas ce jour
      }
      heureDebut = medecin.disponibilites[jourSemaine].debut;
      heureFin = medecin.disponibilites[jourSemaine].fin;
    } else {
      return []; // Pas de disponibilités pour ce jour
    }
    
    // Générer des créneaux de 15 minutes
    const creneaux = [];
    let heure = heureDebut;
    
    while (heure < heureFin) {
      const [h, m] = heure.split(':').map(Number);
      const heureFinCreneau = new Date();
      heureFinCreneau.setHours(h, m + parseInt(rdvForm.duree), 0, 0);
      const heureFinStr = `${heureFinCreneau.getHours().toString().padStart(2, '0')}:${heureFinCreneau.getMinutes().toString().padStart(2, '0')}`;
      
      if (heureFinStr <= heureFin) {
        // Vérifier si le créneau est disponible (pas de chevauchement avec d'autres RDV)
        const estDisponible = verifierDisponibilite(
          rdvForm.medecinId, 
          rdvForm.date, 
          heure, 
          rdvForm.duree,
          currentRendezvous?.id
        );
        
        if (estDisponible) {
          creneaux.push(heure);
        }
      }
      
      // Passer au créneau suivant (par tranches de 15 minutes)
      const nextHeure = new Date();
      nextHeure.setHours(h, m + 15, 0, 0);
      heure = `${nextHeure.getHours().toString().padStart(2, '0')}:${nextHeure.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return creneaux;
  };

  // Fonction pour basculer l'état du menu latéral
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fonctions pour la vue calendrier
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };


  const getMonthData = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Ajouter les jours du mois précédent pour compléter la première semaine
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      const dateString = formatDateString(date);
      days.push({
        date: date,
        isCurrentMonth: false,
        hasEvents: false,
        events: [],
        dateString: dateString
      });
    }
    
    // Ajouter les jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = formatDateString(date);
      
      // Vérifier les rendez-vous pour cette date
      const dayEvents = rendezvous.filter(rdv => {
        return rdv.date === dateString;
      });
      
      // Obtenir les médecins uniques qui ont des rendez-vous ce jour
      const uniqueMedecins = [...new Set(dayEvents.map(rdv => rdv.medecinId))];
      
      days.push({
        date: date,
        isCurrentMonth: true,
        hasEvents: dayEvents.length > 0,
        events: dayEvents,
        medecinCount: uniqueMedecins.length,
        dateString: dateString
      });
    }
    
    // Ajouter les jours du mois suivant pour compléter la dernière semaine
    const totalDaysToShow = 42; // 6 semaines
    const remainingDays = totalDaysToShow - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateString = formatDateString(date);
      days.push({
        date: date,
        isCurrentMonth: false,
        hasEvents: false,
        events: [],
        dateString: dateString
      });
    }
    
    return days;
  }, [currentMonth, rendezvous]);


  const formatDateString = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };



  const handleDateClick = (day) => {
    if (day.hasEvents) {
      setSelectedDate(day);
      setShowDateModal(true);
    }
  };

  const handleMedecinClick = (medecinId) => {
    setSelectedMedecinId(medecinId);
    setShowMedecinRdvModal(true);
    setShowDateModal(false);
  };

  const handleRdvClick = (rdv) => {
    setSelectedRdv(rdv);
    setShowRdvDetailsModal(true);
  };

  const handleDragStart = (rdv) => {
    setDraggedRdv(rdv);
  };

  const handleDrop = async (targetRdv) => {
    if (!draggedRdv || draggedRdv.id === targetRdv.id) return;
    
    try {
      // Échanger les heures des rendez-vous
      const draggedHeure = draggedRdv.heure;
      const targetHeure = targetRdv.heure;
      
      await updateDoc(doc(db, 'rendezvous', draggedRdv.id), {
        heure: targetHeure,
        updatedAt: new Date()
      });
      
      await updateDoc(doc(db, 'rendezvous', targetRdv.id), {
        heure: draggedHeure,
        updatedAt: new Date()
      });
      
      setMessage('Rendez-vous échangés avec succès.');
      const user = auth.currentUser;
      fetchRendezvous(user.uid);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Erreur lors de l'échange: ${error.message}`);
    }
    
    setDraggedRdv(null);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const getMedecinsByDate = (date) => {
    const dateString = date.dateString || formatDateString(date.date);
    const rdvs = rendezvous.filter(rdv => rdv.date === dateString);
    const uniqueMedecinIds = [...new Set(rdvs.map(rdv => rdv.medecinId))];
    
    return uniqueMedecinIds.map(id => {
      const medecin = medecins.find(m => m.id === id);
      const medecinRdvs = rdvs.filter(rdv => rdv.medecinId === id);
      
      return {
        medecin: medecin,
        rdvCount: medecinRdvs.length
      };
    });
  };


const getMedecinRdvs = (medecinId, date) => {
  // Utiliser la date normalisée stockée dans l'objet day
  const dateString = date.dateString || formatDateString(date.date);
  
  return rendezvous
    .filter(rdv => rdv.medecinId === medecinId && rdv.date === dateString)
    .sort((a, b) => a.heure.localeCompare(b.heure));
};


// Fonction pour obtenir tous les créneaux avec leur statut (disponible, partiellement occupé ou complet)
const getCreneauxAvecStatut = () => {
  if (!rdvForm.medecinId || !rdvForm.date) return [];
  
  const medecin = medecins.find(m => m.id === rdvForm.medecinId);
  if (!medecin) return [];
  
  // Déterminer le jour de la semaine
  const jourDate = new Date(rdvForm.date);
  const joursMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jourSemaine = joursMap[jourDate.getDay()];
  
  // Obtenir les horaires du médecin pour ce jour
  let heureDebut = '08:00';
  let heureFin = '18:00';
  let disponibiliteJour = null;
  
  if (Array.isArray(medecin.disponibilites)) {
    disponibiliteJour = medecin.disponibilites.find(d => 
      d.jour.toLowerCase() === jourSemaine.toLowerCase()
    );
    
    if (disponibiliteJour) {
      heureDebut = disponibiliteJour.heureDebut;
      heureFin = disponibiliteJour.heureFin;
    } else {
      return []; // Le médecin ne travaille pas ce jour
    }
  } else if (medecin.disponibilites && medecin.disponibilites[jourSemaine]) {
    if (!medecin.disponibilites[jourSemaine].actif) {
      return []; // Le médecin ne travaille pas ce jour
    }
    heureDebut = medecin.disponibilites[jourSemaine].debut;
    heureFin = medecin.disponibilites[jourSemaine].fin;
  } else {
    return []; // Pas de disponibilités pour ce jour
  }
  
  // Récupérer les rendez-vous existants pour ce médecin et cette date
  const rdvDuJour = rendezvous.filter(rdv => 
    rdv.medecinId === rdvForm.medecinId && 
    rdv.date === rdvForm.date && 
    rdv.statut !== 'annulé' &&
    rdv.id !== currentRendezvous?.id
  );
  
  // Générer tous les créneaux possibles (par tranches de 15 minutes)
  const tousLesCreneaux = [];
  let heure = heureDebut;
  
  // Nombre maximum de rendez-vous simultanés autorisés
  const MAX_RDV_SIMULTANES = 3;
  
  while (heure < heureFin) {
    const [h, m] = heure.split(':').map(Number);
    const heureFinCreneau = new Date();
    heureFinCreneau.setHours(h, m + parseInt(rdvForm.duree), 0, 0);
    const heureFinStr = `${heureFinCreneau.getHours().toString().padStart(2, '0')}:${heureFinCreneau.getMinutes().toString().padStart(2, '0')}`;
    
    if (heureFinStr <= heureFin) {
      // Compter le nombre de rendez-vous à cette heure
      const rdvAuCreneau = rdvDuJour.filter(rdv => rdv.heure === heure);
      const nombreRdvAuCreneau = rdvAuCreneau.length;
      
      // Déterminer le statut du créneau
      let statut = 'disponible';
      if (nombreRdvAuCreneau >= MAX_RDV_SIMULTANES) {
        statut = 'complet';
      } else if (nombreRdvAuCreneau > 0) {
        statut = 'partiel';
      }
      
      tousLesCreneaux.push({
        heure: heure,
        statut: statut,
        nombreRdv: nombreRdvAuCreneau,
        estDisponible: statut !== 'complet'
      });
    }
    
    // Passer au créneau suivant (par tranches de 15 minutes)
    const nextHeure = new Date();
    nextHeure.setHours(h, m + 15, 0, 0);
    heure = `${nextHeure.getHours().toString().padStart(2, '0')}:${nextHeure.getMinutes().toString().padStart(2, '0')}`;
  }
  
  return tousLesCreneaux;
};



  const handleMobileTabChange = (tab) => {
    setActiveTab(tab);
    setShowMobileMenu(false);
    setMobileDetailView(null);
  };

  const handleMobileDetailView = (type, item) => {
    setMobileDetailView({ type, item });
  };

  const handleBackToList = () => {
    setMobileDetailView(null);
  };

  const handleMobileSearch = (e) => {
    setMobileSearchQuery(e.target.value);
  };

  const filteredMedecins = mobileSearchActive && mobileSearchQuery 
    ? medecins.filter(m => 
        `${m.nom} ${m.prenom}`.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
        m.specialite.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      )
    : medecins;

  const filteredPatients = mobileSearchActive && mobileSearchQuery 
    ? patients.filter(p => 
        `${p.nom} ${p.prenom}`.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      )
    : patients;

  const filteredRendezvous = mobileSearchActive && mobileSearchQuery 
    ? rendezvous.filter(r => 
        r.patientNom?.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
        r.medecinNom?.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      )
    : rendezvous;



  if (!structureData) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>
  );


  // Interface mobile style Instagram
  if (isMobile) {
    return (
      <div className="mobile-dashboard">
        {/* Header mobile */}
        <header className="mobile-header">
          {mobileDetailView ? (
            <div className="d-flex align-items-center">
              <button className="btn btn-link text-dark" onClick={handleBackToList}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <h5 className="mb-0 ms-2">
                {mobileDetailView.type === 'medecin' && `Dr. ${mobileDetailView.item.prenom} ${mobileDetailView.item.nom}`}
                {mobileDetailView.type === 'patient' && `${mobileDetailView.item.prenom} ${mobileDetailView.item.nom}`}
                {mobileDetailView.type === 'rendezvous' && 'Détails du rendez-vous'}
                {mobileDetailView.type === 'archive' && mobileDetailView.item.titre}
                {mobileDetailView.type === 'form-medecin' && (currentMedecin ? 'Modifier médecin' : 'Nouveau médecin')}
                {mobileDetailView.type === 'form-patient' && (currentPatient ? 'Modifier patient' : 'Nouveau patient')}
                {mobileDetailView.type === 'form-rendezvous' && (currentRendezvous ? 'Modifier RDV' : 'Nouveau RDV')}
                {mobileDetailView.type === 'form-archive' && (currentArchive ? 'Modifier archive' : 'Nouvelle archive')}
              </h5>
            </div>
          ) : (
            <>
              {mobileSearchActive ? (
                <div className="d-flex align-items-center w-100">
                  <button className="btn btn-link text-dark" onClick={() => setMobileSearchActive(false)}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <input 
                    type="text" 
                    className="form-control form-control-sm border-0 bg-light" 
                    placeholder="Rechercher..." 
                    value={mobileSearchQuery}
                    onChange={handleMobileSearch}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <h5 className="mb-0">{structureData.nom}</h5>
                  <div>
                    <button className="btn btn-link text-dark" onClick={() => setMobileSearchActive(true)}>
                      <FontAwesomeIcon icon={faSearch} />
                    </button>
                    <button className="btn btn-link text-dark ms-2" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                      <FontAwesomeIcon icon={faBars} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </header>

        {/* Menu mobile */}
        {showMobileMenu && (
          <div className="mobile-menu">
            <div className="list-group list-group-flush">
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('info')}>
                <FontAwesomeIcon icon={faHome} className="me-3" />
                Informations
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('affiliations')}>
                <FontAwesomeIcon icon={faLink} className="me-3" />
                Affiliations
                {pendingRequests.length > 0 && 
                  <span className="badge bg-danger ms-2">{pendingRequests.length}</span>
                }
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('medecins')}>
                <FontAwesomeIcon icon={faUserMd} className="me-3" />
                Médecins
                <span className="badge bg-info ms-2">{medecins.length}</span>
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('patients')}>
                <FontAwesomeIcon icon={faUser} className="me-3" />
                Patients
                <span className="badge bg-info ms-2">{patients.length}</span>
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('rendezvous')}>
                <FontAwesomeIcon icon={faCalendarAlt} className="me-3" />
                Rendez-vous
                <span className="badge bg-info ms-2">{rendezvous.length}</span>
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('archives')}>
                <FontAwesomeIcon icon={faArchive} className="me-3" />
                Archives
                <span className="badge bg-info ms-2">{archives.length}</span>
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={() => handleMobileTabChange('password')}>
                <FontAwesomeIcon icon={faKey} className="me-3" />
                Mot de passe
              </button>
              <button className="list-group-item list-group-item-action d-flex align-items-center" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} className="me-3" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Contenu principal mobile */}
        <div className="mobile-content">
          {/* Affichage des messages de notification */}
          {message && (
            <div className={`alert alert-dismissible fade show ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'}`} role="alert">
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          )}

          {/* Vue détaillée mobile */}
          {mobileDetailView && (
            <div className="mobile-detail-view">
              {/* Détail d'un médecin */}
              {mobileDetailView.type === 'medecin' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="text-center mb-4">
                      <div className="avatar-circle bg-primary text-white">
                        {mobileDetailView.item.prenom?.charAt(0)}{mobileDetailView.item.nom?.charAt(0)}
                      </div>
                      <h4 className="mt-3">Dr. {mobileDetailView.item.prenom} {mobileDetailView.item.nom}</h4>
                      <span className="badge bg-info">{mobileDetailView.item.specialite}</span>
                    </div>
                    
                    <div className="info-item">
                      <FontAwesomeIcon icon={faPhone} className="me-3 text-secondary" />
                      {mobileDetailView.item.telephone}
                    </div>
                    
                    <div className="info-item">
                      <FontAwesomeIcon icon={faEnvelope} className="me-3 text-secondary" />
                      {mobileDetailView.item.email}
                    </div>
                    
                    <h6 className="mt-4 mb-3">Disponibilités</h6>
                    <div className="disponibilites-container">
                      {Array.isArray(mobileDetailView.item.disponibilites) ? (
                        mobileDetailView.item.disponibilites.map((dispo, index) => (
                          <span key={index} className="badge bg-light text-dark me-1 mb-1">
                            {dispo.jour}: {dispo.heureDebut}-{dispo.heureFin}
                          </span>
                        ))
                      ) : (
                        Object.entries(mobileDetailView.item.disponibilites || {}).map(([jour, dispo]) => (
                          dispo.actif && (
                            <span key={jour} className="badge bg-light text-dark me-1 mb-1">
                              {jour.charAt(0).toUpperCase() + jour.slice(1)}: {dispo.debut}-{dispo.fin}
                            </span>
                          )
                        ))
                      )}
                    </div>
                    
                    <h6 className="mt-4 mb-3">Assurances acceptées</h6>
                    <div>
                      {mobileDetailView.item.assurances && mobileDetailView.item.assurances.map((assurance, index) => (
                        <span key={index} className="badge bg-light text-dark me-1 mb-1">
                          {assurance}
                        </span>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between mt-4">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => {
                          handleEditMedecin(mobileDetailView.item);
                          handleMobileDetailView('form-medecin', mobileDetailView.item);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
                            handleDeleteMedecin(mobileDetailView.item.id);
                            handleBackToList();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Détail d'un patient */}
              {mobileDetailView.type === 'patient' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="text-center mb-4">
                      <div className="avatar-circle bg-info text-white">
                        {mobileDetailView.item.prenom?.charAt(0)}{mobileDetailView.item.nom?.charAt(0)}
                      </div>
                      <h4 className="mt-3">{mobileDetailView.item.prenom} {mobileDetailView.item.nom}</h4>
                      <span className="badge bg-secondary">
                        {new Date().getFullYear() - new Date(mobileDetailView.item.dateNaissance).getFullYear()} ans
                      </span>
                    </div>
                    
                    <div className="info-item">
                      <strong>Date de naissance:</strong> {new Date(mobileDetailView.item.dateNaissance).toLocaleDateString()}
                    </div>
                    
                    <div className="info-item">
                      <FontAwesomeIcon icon={faPhone} className="me-3 text-secondary" />
                      {mobileDetailView.item.telephone}
                    </div>
                    
                    <div className="info-item">
                      <FontAwesomeIcon icon={faEnvelope} className="me-3 text-secondary" />
                      {mobileDetailView.item.email}
                    </div>
                    
                    <h6 className="mt-4 mb-3">Assurances</h6>
                    <div>
                      {mobileDetailView.item.assurances && mobileDetailView.item.assurances.map((assurance, index) => (
                        <span key={index} className="badge bg-light text-dark me-1 mb-1">
                          {assurance}
                        </span>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between mt-4">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => {
                          handleEditPatient(mobileDetailView.item);
                          handleMobileDetailView('form-patient', mobileDetailView.item);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
                            handleDeletePatient(mobileDetailView.item.id);
                            handleBackToList();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Détail d'un rendez-vous */}
              {mobileDetailView.type === 'rendezvous' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className={`status-indicator status-${mobileDetailView.item.statut}`}>
                      {mobileDetailView.item.statut.charAt(0).toUpperCase() + mobileDetailView.item.statut.slice(1)}
                    </div>
                    
                    <div className="info-item">
                      <strong>Médecin:</strong> Dr. {medecins.find(m => m.id === mobileDetailView.item.medecinId)?.prenom} {medecins.find(m => m.id === mobileDetailView.item.medecinId)?.nom || mobileDetailView.item.medecinNom}
                    </div>
                    
                    <div className="info-item">
                      <strong>Patient:</strong> {patients.find(p => p.id === mobileDetailView.item.patientId)?.prenom} {patients.find(p => p.id === mobileDetailView.item.patientId)?.nom || mobileDetailView.item.patientNom}
                    </div>
                    
                    <div className="info-item">
                      <strong>Date:</strong> {new Date(mobileDetailView.item.date).toLocaleDateString()}
                    </div>
                    
                    <div className="info-item">
                      <strong>Heure:</strong> {mobileDetailView.item.heure}
                    </div>
                    
                   {/* <div className="info-item">
                      <strong>Durée:</strong> {mobileDetailView.item.duree} minutes
                    </div> */}
                    
                    <div className="info-item">
                      <strong>Motif:</strong> {mobileDetailView.item.motif || 'Non spécifié'}
                    </div>
                    
                    <h6 className="mt-4 mb-3">Changer le statut</h6>
                    <div className="status-buttons">
                      {statutsRdv.map(statut => (
                        <button 
                          key={statut} 
                          className={`btn btn-sm me-1 mb-1 ${mobileDetailView.item.statut === statut ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => handleChangeStatutRendezvous(mobileDetailView.item.id, statut)}
                        >
                          {statut.charAt(0).toUpperCase() + statut.slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    <div className="d-flex justify-content-between mt-4">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => {
                          handleEditRendezvous(mobileDetailView.item);
                          handleMobileDetailView('form-rendezvous', mobileDetailView.item);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                            handleDeleteRendezvous(mobileDetailView.item.id);
                            handleBackToList();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Détail d'une archive */}
              {mobileDetailView.type === 'archive' && (
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h4 className="mb-3">{mobileDetailView.item.titre}</h4>
                    
                    <div className="info-item">
                      <strong>Patient:</strong> {mobileDetailView.item.patientNom}
                    </div>
                    
                    <div className="info-item">
                      <strong>Date:</strong> {new Date(mobileDetailView.item.date).toLocaleDateString()}
                    </div>
                    
                    <div className="mt-3">
                      {mobileDetailView.item.tags && mobileDetailView.item.tags.map((tag, index) => (
                        <span key={index} className="badge bg-info me-1 mb-1">{tag}</span>
                      ))}
                    </div>
                    
                    {mobileDetailView.item.description && (
                      <div className="mt-4">
                        <h6>Description</h6>
                        <p>{mobileDetailView.item.description}</p>
                      </div>
                    )}
                    
                    {mobileDetailView.item.notes && (
                      <div className="mt-4">
                        <h6>Notes</h6>
                        <p>{mobileDetailView.item.notes}</p>
                      </div>
                    )}
                    
                    {mobileDetailView.item.files && mobileDetailView.item.files.length > 0 && (
                      <div className="mt-4">
                        <h6>Fichiers ({mobileDetailView.item.files.length})</h6>
                        <ul className="list-group">
                          {mobileDetailView.item.files.map((file, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                              <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                              <span className="badge bg-primary rounded-pill">
                                <FontAwesomeIcon icon={faFile} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mt-4">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => {
                          handleEditArchive(mobileDetailView.item);
                          handleMobileDetailView('form-archive', mobileDetailView.item);
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Modifier
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cette archive ?')) {
                            handleDeleteArchive(mobileDetailView.item.id);
                            handleBackToList();
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire médecin mobile */}
              {mobileDetailView.type === 'form-medecin' && (
                <div className="mobile-form">
                  <form onSubmit={handleAddMedecin}>
                    <div className="mb-3">
                      <label className="form-label">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        className="form-control"
                        value={medecinForm.nom}
                        onChange={handleMedecinChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        className="form-control"
                        value={medecinForm.prenom}
                        onChange={handleMedecinChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Spécialité</label>
                      <select
                        name="specialite"
                        className="form-select"
                        value={medecinForm.specialite}
                        onChange={handleMedecinChange}
                        required
                      >
                        <option value="">Sélectionner une spécialité</option>
                        {specialites.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                      {medecinForm.specialite === 'Autre' && (
                        <input
                          type="text"
                          name="specialiteAutre"
                          className="form-control mt-2"
                          placeholder="Précisez la spécialité"
                          value={medecinForm.specialiteAutre || ''}
                          onChange={handleMedecinChange}
                        />
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        className="form-control"
                        value={medecinForm.telephone}
                        onChange={handleMedecinChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={medecinForm.email}
                        onChange={handleMedecinChange}
                        required
                      />
                    </div>
                    
                 
                    
                    <div className="mb-3">
                      <label className="form-label">Disponibilités</label>
                      <div className="accordion" id="disponibilitesAccordion">
                        {joursSemaine.map((jour) => (
                          <div className="accordion-item" key={jour}>
                            <h2 className="accordion-header" id={`heading-${jour}`}>
                              <button 
                                className="accordion-button collapsed" 
                                type="button" 
                                data-bs-toggle="collapse" 
                                data-bs-target={`#collapse-${jour}`} 
                                aria-expanded="false" 
                                aria-controls={`collapse-${jour}`}
                              >
                                {jour.charAt(0).toUpperCase() + jour.slice(1)}
                                {medecinForm.disponibilites[jour].actif && 
                                  <span className="badge bg-success ms-2">Actif</span>
                                }
                              </button>
                            </h2>
                            <div 
                              id={`collapse-${jour}`} 
                              className="accordion-collapse collapse" 
                              aria-labelledby={`heading-${jour}`} 
                              data-bs-parent="#disponibilitesAccordion"
                            >
                              <div className="accordion-body">
                                <div className="form-check form-switch mb-3">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`disponible-${jour}`}
                                    checked={medecinForm.disponibilites[jour].actif}
                                    onChange={() => handleDisponibiliteChange(jour, 'actif')}
                                  />
                                  <label className="form-check-label" htmlFor={`disponible-${jour}`}>
                                    Disponible ce jour
                                  </label>
                                </div>
                                
                                <div className="row">
                                  <div className="col-6">
                                    <label className="form-label">Début</label>
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={medecinForm.disponibilites[jour].debut}
                                      onChange={(e) => handleDisponibiliteChange(jour, 'debut', e.target.value)}
                                      disabled={!medecinForm.disponibilites[jour].actif}
                                    />
                                  </div>
                                  <div className="col-6">
                                    <label className="form-label">Fin</label>
                                    <input
                                      type="time"
                                      className="form-control"
                                      value={medecinForm.disponibilites[jour].fin}
                                      onChange={(e) => handleDisponibiliteChange(jour, 'fin', e.target.value)}
                                      disabled={!medecinForm.disponibilites[jour].actif}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Assurances acceptées</label>
                      <div className="d-flex flex-wrap">
                        {assurancesList.map((assurance) => (
                          <div className="form-check me-3 mb-2" key={assurance}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`assurance-medecin-${assurance}`}
                              name="assurances"
                              value={assurance}
                              checked={medecinForm.assurances.includes(assurance)}
                              onChange={handleMedecinChange}
                            />
                            <label className="form-check-label" htmlFor={`assurance-medecin-${assurance}`}>
                              {assurance}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentMedecin ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={handleBackToList}>
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulaire patient mobile */}
              {mobileDetailView.type === 'form-patient' && (
                <div className="mobile-form">
                  <form onSubmit={handleAddPatient}>
                    <div className="mb-3">
                      <label className="form-label">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        className="form-control"
                        value={patientForm.nom}
                        onChange={handlePatientChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        className="form-control"
                        value={patientForm.prenom}
                        onChange={handlePatientChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Date de naissance</label>
                      <input
                        type="date"
                        name="dateNaissance"
                        className="form-control"
                        value={patientForm.dateNaissance}
                        onChange={handlePatientChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        className="form-control"
                        value={patientForm.telephone}
                        onChange={handlePatientChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={patientForm.email}
                        onChange={handlePatientChange}
                        required
                      />
                    </div>
                    
                  
                    
                    <div className="mb-3">
                      <label className="form-label">Assurances</label>
                      <div className="d-flex flex-wrap">
                        {assurancesList.map((assurance) => (
                          <div className="form-check me-3 mb-2" key={assurance}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`assurance-patient-${assurance}`}
                              name="assurances"
                              value={assurance}
                              checked={patientForm.assurances.includes(assurance)}
                              onChange={handlePatientChange}
                            />
                            <label className="form-check-label" htmlFor={`assurance-patient-${assurance}`}>
                              {assurance}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentPatient ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={handleBackToList}>
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulaire rendez-vous mobile */}
              {mobileDetailView.type === 'form-rendezvous' && (
                <div className="mobile-form">
                  <form onSubmit={handleAddRendezvous}>
                    <div className="mb-3">
                      <label className="form-label">Médecin</label>
                      <select
                        name="medecinId"
                        className="form-select"
                        value={rdvForm.medecinId}
                        onChange={handleRdvChange}
                        required
                      >
                        <option value="">Sélectionner un médecin</option>
                        {medecins.map((medecin) => (
                          <option key={medecin.id} value={medecin.id}>
                            Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Patient</label>
                      <select
                        name="patientId"
                        className="form-select"
                        value={rdvForm.patientId}
                        onChange={handleRdvChange}
                        required
                      >
                        <option value="">Sélectionner un patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.prenom} {patient.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={rdvForm.date}
                        onChange={handleRdvChange}
                        required
                      />
                    </div>
                    
                    <div className="col-md-4 mb-3">
  <label className="form-label">Heure</label>
  <div className="time-slots-container">
  {rdvForm.medecinId && rdvForm.date ? (
    getCreneauxAvecStatut().map((creneau) => (
      <div 
        key={creneau.heure}
        className={`time-slot ${creneau.statut} ${rdvForm.heure === creneau.heure ? 'selected' : ''}`}
        onClick={() => {
          if (creneau.statut !== 'complet') {
            setRdvForm({...rdvForm, heure: creneau.heure});
          }
        }}
      >
        {creneau.heure}
        {creneau.statut === 'partiel' && (
          <div className="slot-info">
            {creneau.nombreRdv}/{3} occupé{creneau.nombreRdv > 1 ? 's' : ''}
          </div>
        )}
        {creneau.statut === 'complet' && (
          <div className="slot-info">Complet</div>
        )}
      </div>
    ))
  ) : (
    <div className="alert alert-info">
      Veuillez sélectionner un médecin et une date
    </div>
  )}
</div>

</div>

                 {  /*  
                    <div className="mb-3">
                      <label className="form-label">Durée (minutes)</label>
                      <select
                        name="duree"
                        className="form-select"
                        value={rdvForm.duree}
                        onChange={handleRdvChange}
                        required
                      >
                        {dureesRdv.map((duree) => (
                          <option key={duree} value={duree}>
                            {duree} min
                          </option>
                        ))}
                      </select>
                    </div> */  }
                    
                    <div className="mb-3">
                      <label className="form-label">Motif</label>
                      <textarea
                        name="motif"
                        className="form-control"
                        value={rdvForm.motif}
                        onChange={handleRdvChange}
                        rows="3"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Statut</label>
                      <select
                        name="statut"
                        className="form-select"
                        value={rdvForm.statut}
                        onChange={handleRdvChange}
                        required
                      >
                        {statutsRdv.map((statut) => (
                          <option key={statut} value={statut}>
                            {statut.charAt(0).toUpperCase() + statut.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentRendezvous ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={handleBackToList}>
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulaire archive mobile */}
              {mobileDetailView.type === 'form-archive' && (
                <div className="mobile-form">
                  <form onSubmit={handleAddArchive}>
                    <div className="mb-3">
                      <label htmlFor="patientId" className="form-label">Patient</label>
                      <select 
                        id="patientId" 
                        name="patientId" 
                        className="form-select" 
                        value={archiveForm.patientId} 
                        onChange={handleArchiveChange}
                        required
                      >
                        <option value="">Sélectionner un patient</option>
                        {patients.map(patient => (
                          <option key={patient.id} value={patient.id}>
                            {patient.prenom} {patient.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="titre" className="form-label">Titre</label>
                      <input 
                        type="text" 
                        id="titre" 
                        name="titre" 
                        className="form-control" 
                        value={archiveForm.titre} 
                        onChange={handleArchiveChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">Description</label>
                      <textarea 
                        id="description" 
                        name="description" 
                        className="form-control" 
                        value={archiveForm.description} 
                        onChange={handleArchiveChange}
                        rows="3"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label">Notes</label>
                      <textarea 
                        id="notes" 
                        name="notes" 
                        className="form-control" 
                        value={archiveForm.notes} 
                        onChange={handleArchiveChange}
                        rows="3"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="date" className="form-label">Date</label>
                      <input 
                        type="date" 
                        id="date" 
                        name="date" 
                        className="form-control" 
                        value={archiveForm.date} 
                        onChange={handleArchiveChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Tags</label>
                      <div className="d-flex flex-wrap">
                        {tagsList.map(tag => (
                          <div className="form-check me-3 mb-2" key={tag}>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              id={`tag-${tag}`} 
                              name="tags" 
                              value={tag}
                              checked={archiveForm.tags.includes(tag)}
                              onChange={handleArchiveChange}
                            />
                            <label className="form-check-label" htmlFor={`tag-${tag}`}>
                              {tag}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="files" className="form-label">Fichiers</label>
                      <input 
                        type="file" 
                        id="files" 
                        className="form-control" 
                        onChange={handleFileChange}
                        multiple
                      />
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mb-3">
                        <h6>Fichiers sélectionnés :</h6>
                        <ul className="list-group">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                              {file.name}
                              <span className="badge bg-primary rounded-pill">{(file.size / 1024).toFixed(2)} KB</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {currentArchive && archiveForm.files && archiveForm.files.length > 0 && (
                      <div className="mb-3">
                        <h6>Fichiers existants :</h6>
                        <ul className="list-group">
                          {archiveForm.files.map((file, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                              <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteFile(currentArchive.id, file.path, index)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentArchive ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={handleBackToList}>
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Vue liste mobile pour chaque onglet */}
          {!mobileDetailView && (
            <>
              {/* Onglet Informations */}
              {activeTab === 'info' && (
                <div className="mobile-info-view">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="text-center mb-4">
                        <div className="avatar-circle bg-primary text-white">
                          {structureData.nom?.charAt(0)}
                        </div>
                        <h4 className="mt-3">{structureData.nom}</h4>
                      </div>
                      
                      {Object.entries(form).map(([key, value]) => (
                        key !== 'createdAt' && key !== 'updatedAt' && key !== 'nom' ? (
                          <div className="mb-3" key={key}>
                            <label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                            <input
                              name={key}
                              value={value || ''}
                              onChange={handleChange}
                              className="form-control"
                              placeholder={key}
                            />
                          </div>
                        ) : null
                      ))}
                      
                      <div className="d-grid mt-4">
                        <button onClick={handleUpdate} className="btn btn-primary">
                          <FontAwesomeIcon icon={faCheck} className="me-2" />
                          Mettre à jour
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Affiliations */}
              {activeTab === 'affiliations' && (
                <div className="mobile-affiliations-view">
                  <ul className="nav nav-pills nav-justified mb-3">
                    <li className="nav-item">
                      <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#medecins-tab">
                        Médecins
                        {pendingRequests.filter(r => r.type === 'medecin').length > 0 && (
                          <span className="badge bg-danger ms-2">
                            {pendingRequests.filter(r => r.type === 'medecin').length}
                          </span>
                        )}
                      </button>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link" data-bs-toggle="tab" data-bs-target="#patients-tab">
                        Patients
                        {pendingRequests.filter(r => r.type === 'patient').length > 0 && (
                          <span className="badge bg-danger ms-2">
                            {pendingRequests.filter(r => r.type === 'patient').length}
                          </span>
                        )}
                      </button>
                    </li>
                  </ul>
                  <div className="tab-content">
                    <div className="tab-pane fade show active" id="medecins-tab">
                      <AffiliationRequestsManagerMedecins onRequestProcessed={fetchPendingRequests} />
                    </div>
                    <div className="tab-pane fade" id="patients-tab">
                      <AffiliationRequestsManagerPatients onRequestProcessed={fetchPendingRequests} />
                    </div>
                  </div>
                </div>
              )}



              {/* Onglet Médecins */}
              {activeTab === 'medecins' && (
                <div className="mobile-medecins-view">
                  <div className="list-group list-group-flush">
                    {filteredMedecins.length > 0 ? (
                      filteredMedecins.map((medecin) => (
                        <button
                          key={medecin.id}
                          className="list-group-item list-group-item-action d-flex align-items-center"
                          onClick={() => handleMobileDetailView('medecin', medecin)}
                        >
                          <div className="avatar-small bg-primary text-white me-3">
                            {medecin.prenom?.charAt(0)}{medecin.nom?.charAt(0)}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">Dr. {medecin.prenom} {medecin.nom}</h6>
                            <small className="text-muted">{medecin.specialite}</small>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-muted" />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">Aucun médecin n'a été ajouté</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Onglet Patients */}
              {activeTab === 'patients' && (
                <div className="mobile-patients-view">
                  <div className="list-group list-group-flush">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          className="list-group-item list-group-item-action d-flex align-items-center"
                          onClick={() => handleMobileDetailView('patient', patient)}
                        >
                          <div className="avatar-small bg-info text-white me-3">
                            {patient.prenom?.charAt(0)}{patient.nom?.charAt(0)}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{patient.prenom} {patient.nom}</h6>
                            <small className="text-muted">
                              {new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear()} ans
                            </small>
                          </div>
                          <FontAwesomeIcon icon={faChevronRight} className="text-muted" />
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-5">
                        <p className="text-muted">Aucun patient n'a été ajouté</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

             {/* Onglet Rendez-vous */}
{activeTab === 'rendezvous' && (
  <div className="mobile-rendezvous-view">
    <div className="calendar-header-mobile d-flex justify-content-between align-items-center mb-3">
      <button className="btn btn-sm btn-outline-secondary" onClick={handlePrevMonth}>
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <h6 className="mb-0">
        {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
      </h6>
      <button className="btn btn-sm btn-outline-secondary" onClick={handleNextMonth}>
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
    
    <div className="calendar-mobile mb-4">
      <div className="calendar-days">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
          <div key={index} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      
      <div className="calendar-body">
        {getMonthData().map((day, index) => (
          <div 
            key={index} 
            className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.hasEvents ? 'has-events' : ''}`}
            onClick={() => handleDateClick(day)}
          >
            <div className="date-number">{day.date.getDate()}</div>
            {day.hasEvents && (
              <div className="event-dot"></div>
            )}
          </div>
        ))}
      </div>
    </div>
    
    <h6 className="mb-3">Rendez-vous à venir</h6>
    <div className="list-group list-group-flush">
      {filteredRendezvous.length > 0 ? (
        filteredRendezvous
          .filter(rdv => new Date(rdv.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date) || a.heure.localeCompare(b.heure))
          .slice(0, 10)
          .map((rdv) => (
            <button
              key={rdv.id}
              className="list-group-item list-group-item-action"
              onClick={() => handleMobileDetailView('rendezvous', rdv)}
            >
              <div className={`rdv-item-mobile status-${rdv.statut}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">{rdv.patientNom}</h6>
                    <small>Dr. {rdv.medecinNom}</small>
                  </div>
                  <div className="text-end">
                    <span className={`badge status-badge-${rdv.statut}`}>
                      {rdv.statut.charAt(0).toUpperCase() + rdv.statut.slice(1)}
                    </span>
                    <div className="small text-muted">
                      {new Date(rdv.date).toLocaleDateString()} à {rdv.heure}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">Aucun rendez-vous à venir</p>
        </div>
      )}
    </div>
  </div>
)}


              {/* Onglet Archives */}
              {activeTab === 'archives' && (
                <div className="mobile-archives-view">
                  <div className="list-group list-group-flush">
                    {archives
                      .filter(archive => {
                        if (!filtreArchivePatient) return true;
                        const patientNom = archive.patientNom || '';
                        return patientNom.toLowerCase().includes(filtreArchivePatient.toLowerCase());
                      })
                      .map(archive => (
                        <button
                          key={archive.id}
                          className="list-group-item list-group-item-action"
                          onClick={() => handleMobileDetailView('archive', archive)}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0">{archive.titre}</h6>
                              <small className="text-muted">{archive.patientNom}</small>
                            </div>
                            <div className="text-end">
                              <div className="small text-muted">
                                {new Date(archive.date).toLocaleDateString()}
                              </div>
                              <div>
                                {archive.tags && archive.tags.slice(0, 2).map((tag, index) => (
                                  <span key={index} className="badge bg-info me-1">{tag}</span>
                                ))}
                                {archive.tags && archive.tags.length > 2 && (
                                  <span className="badge bg-secondary">+{archive.tags.length - 2}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    {archives.length === 0 && (
                      <div className="text-center py-5">
                        <p className="text-muted">Aucune archive n'a été ajoutée</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Onglet Mot de passe */}
              {activeTab === 'password' && (
                <div className="mobile-password-view">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                        <div className="mb-3">
                          <label className="form-label">Nouveau mot de passe</label>
                          <input
                            type="password"
                            className="form-control"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="d-grid">
                          <button type="submit" className="btn btn-primary">
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            Mettre à jour le mot de passe
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bouton d'action flottant style Instagram */}
        {!mobileDetailView && !showMobileMenu && (
          <div className="mobile-floating-action">
            <button 
              className="btn btn-primary btn-circle shadow"
              onClick={() => setShowMobileActionMenu(!showMobileActionMenu)}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            
            {showMobileActionMenu && (
              <div className="floating-action-menu">
                {activeTab === 'medecins' && (
                  <button 
                    className="btn btn-light btn-action-item shadow-sm"
                    onClick={() => {
                      resetMedecinForm();
                      handleMobileDetailView('form-medecin', null);
                      setShowMobileActionMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserMd} className="me-2" />
                    Nouveau médecin
                  </button>
                )}
                
                {activeTab === 'patients' && (
                  <button 
                    className="btn btn-light btn-action-item shadow-sm"
                    onClick={() => {
                      resetPatientForm();
                      handleMobileDetailView('form-patient', null);
                      setShowMobileActionMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Nouveau patient
                  </button>
                )}
                
                {activeTab === 'rendezvous' && (
                  <button 
                    className="btn btn-light btn-action-item shadow-sm"
                    onClick={() => {
                      resetRdvForm();
                      handleMobileDetailView('form-rendezvous', null);
                      setShowMobileActionMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                    Nouveau rendez-vous
                  </button>
                )}
                
                {activeTab === 'archives' && (
                  <button 
                    className="btn btn-light btn-action-item shadow-sm"
                    onClick={() => {
                      resetArchiveForm();
                      handleMobileDetailView('form-archive', null);
                      setShowMobileActionMenu(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faFile} className="me-2" />
                    Nouvelle archive
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation mobile style Instagram */}
        <nav className="mobile-nav">
          <button 
            className={`nav-item ${activeTab === 'info' ? 'active' : ''}`} 
            onClick={() => handleMobileTabChange('info')}
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
          <button 
            className={`nav-item ${activeTab === 'medecins' ? 'active' : ''}`} 
            onClick={() => handleMobileTabChange('medecins')}
          >
            <FontAwesomeIcon icon={faUserMd} />
          </button>
          <button 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} 
            onClick={() => handleMobileTabChange('patients')}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
          <button 
            className={`nav-item ${activeTab === 'rendezvous' ? 'active' : ''}`} 
            onClick={() => handleMobileTabChange('rendezvous')}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
          </button>
          <button 
            className={`nav-item ${activeTab === 'archives' ? 'active' : ''}`} 
            onClick={() => handleMobileTabChange('archives')}
          >
            <FontAwesomeIcon icon={faArchive} />
          </button>
        </nav>

        {/* Modals pour mobile */}
        <Modal show={showDateModal} onHide={() => setShowDateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              Rendez-vous du {selectedDate && selectedDate.date.toLocaleDateString()}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="list-group">
              {selectedDate && getMedecinsByDate(selectedDate).map((item, index) => (
                <button 
                  key={index} 
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => handleMedecinClick(item.medecin.id)}
                >
                  <div>
                    <h5>Dr. {item.medecin.prenom} {item.medecin.nom}</h5>
                    <p className="mb-1 text-muted">{item.medecin.specialite}</p>
                  </div>
                  <span className="badge bg-primary rounded-pill">{item.rdvCount} RDV</span>
                </button>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDateModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showMedecinRdvModal} onHide={() => setShowMedecinRdvModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedMedecinId && selectedDate && (
                <>
                  Rendez-vous de Dr. {medecins.find(m => m.id === selectedMedecinId)?.prenom} {medecins.find(m => m.id === selectedMedecinId)?.nom}
                  <p className="mb-0 fs-6 text-muted">
                    {selectedDate.date.toLocaleDateString()}
                  </p>
                </>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="rdv-list">
              {selectedMedecinId && selectedDate && getMedecinRdvs(selectedMedecinId, selectedDate).map((rdv) => (
                <div 
                  key={rdv.id} 
                  className={`rdv-item status-${rdv.statut}`}
                  onClick={() => handleRdvClick(rdv)}
                >
                  <div className="rdv-time">
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    {rdv.heure}{/* ({rdv.duree} min) */}
                  </div>
                  <div className="rdv-patient">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    {patients.find(p => p.id === rdv.patientId)?.prenom} {patients.find(p => p.id === rdv.patientId)?.nom || rdv.patientNom}
                  </div>
                  <div className="rdv-status">
                    <span className={`badge status-badge-${rdv.statut}`}>
                      {rdv.statut.charAt(0).toUpperCase() + rdv.statut.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMedecinRdvModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

 return (
    <div className="dashboard-container">
      {/* Menu latéral */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h3>{!sidebarCollapsed && structureData.nom}</h3>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <FontAwesomeIcon icon={sidebarCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>
        
        <div className="sidebar-menu">
          <ul>
            <li className={activeTab === 'info' ? 'active' : ''} onClick={() => setActiveTab('info')}>
              <FontAwesomeIcon icon={faHome} />
              {!sidebarCollapsed && <span>Informations</span>}
            </li>
            <li className={activeTab === 'affiliations' ? 'active' : ''} onClick={() => setActiveTab('affiliations')}>
              <FontAwesomeIcon icon={faLink} />
              {!sidebarCollapsed && <span>Affiliations</span>}
              {pendingRequests.length > 0 && 
                <span className="badge bg-danger">{pendingRequests.length}</span>
              }
            </li>
            <li className={activeTab === 'medecins' ? 'active' : ''} onClick={() => setActiveTab('medecins')}>
              <FontAwesomeIcon icon={faUserMd} />
              {!sidebarCollapsed && <span>Médecins</span>}
              <span className="badge bg-info">{medecins.length}</span>
            </li>
            <li className={activeTab === 'patients' ? 'active' : ''} onClick={() => setActiveTab('patients')}>
              <FontAwesomeIcon icon={faUser} />
              {!sidebarCollapsed && <span>Patients</span>}
              <span className="badge bg-info">{patients.length}</span>
            </li>
            <li className={activeTab === 'rendezvous' ? 'active' : ''} onClick={() => setActiveTab('rendezvous')}>
  <FontAwesomeIcon icon={faCalendarAlt} />
  {!sidebarCollapsed && <span>Rendez-vous</span>}
  <div className="badge-container">
    <span className="badge bg-info">{rendezvous.length}</span>
    {quickRequestsCount > 0 && (
      <span className="badge bg-danger quick-badge">{quickRequestsCount}</span>
    )}
  </div>
</li>

            <li className={activeTab === 'archives' ? 'active' : ''} onClick={() => setActiveTab('archives')}>
              <FontAwesomeIcon icon={faArchive} />
              {!sidebarCollapsed && <span>Archives</span>}
              <span className="badge bg-info">{archives.length}</span>
            </li>
            <li className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>
              <FontAwesomeIcon icon={faKey} />
              {!sidebarCollapsed && <span>Mot de passe</span>}
            </li>
            <li onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              {!sidebarCollapsed && <span>Déconnexion</span>}
            </li>
          </ul>
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* En-tête avec le titre de la section active */}
        <div className="content-header">
          <h2>
            {activeTab === 'info' && 'Informations de la structure'}
            {activeTab === 'affiliations' && 'Gestion des affiliations'}
            {activeTab === 'medecins' && 'Gestion des médecins'}
            {activeTab === 'patients' && 'Gestion des patients'}
            {activeTab === 'rendezvous' && 'Gestion des rendez-vous'}
            {activeTab === 'archives' && 'Archives des patients'}
            {activeTab === 'password' && 'Modification du mot de passe'}
          </h2>
          
          {/* Boutons d'action spécifiques à chaque onglet */}
          <div className="action-buttons">
            {activeTab === 'medecins' && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  resetMedecinForm();
                  setShowMedecinForm(!showMedecinForm);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                {showMedecinForm ? 'Annuler' : 'Ajouter un médecin'}
              </button>
            )}
            
            {activeTab === 'patients' && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  resetPatientForm();
                  setShowPatientForm(!showPatientForm);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                {showPatientForm ? 'Annuler' : 'Ajouter un patient'}
              </button>
            )}
            
            {activeTab === 'rendezvous' && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  resetRdvForm();
                  setShowRendezvousForm(!showRendezvousForm);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                {showRendezvousForm ? 'Annuler' : 'Ajouter un rendez-vous'}
              </button>
            )}
            
            {activeTab === 'archives' && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  resetArchiveForm();
                  setShowArchiveForm(!showArchiveForm);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                {showArchiveForm ? 'Annuler' : 'Ajouter une archive'}
              </button>
            )}
          </div>
        </div>

        {/* Affichage des messages de notification */}
        {message && (
          <div className={`alert alert-dismissible fade show ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'}`} role="alert">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
          </div>
        )}

        {/* Contenu des différents onglets */}
        <div className="content-body">
          {/* Onglet Informations */}
          {activeTab === 'info' && (
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="row">
                  {Object.keys(form).map((key) => (
                    key !== 'createdAt' && key !== 'updatedAt' ? (
                      <div className="col-md-6 mb-3" key={key}>
                        <label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                        <input
                          name={key}
                          value={form[key] || ''}
                          onChange={handleChange}
                          className="form-control"
                          placeholder={key}
                        />
                      </div>
                    ) : null
                  ))}
                </div>
                <div className="text-end mt-3">
                  <button onClick={handleUpdate} className="btn btn-primary">
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Mettre à jour
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Affiliations */}
          {activeTab === 'affiliations' && (
            <div className="card shadow-sm">
              <div className="card-body">
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button className="nav-link active" data-bs-toggle="tab" data-bs-target="#medecins-tab">
                      Demandes médecins
                      {pendingRequests.filter(r => r.type === 'medecin').length > 0 && (
                        <span className="badge bg-danger ms-2">
                          {pendingRequests.filter(r => r.type === 'medecin').length}
                        </span>
                      )}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link" data-bs-toggle="tab" data-bs-target="#patients-tab">
                      Demandes patients
                      {pendingRequests.filter(r => r.type === 'patient').length > 0 && (
                        <span className="badge bg-danger ms-2">
                          {pendingRequests.filter(r => r.type === 'patient').length}
                        </span>
                      )}
                    </button>
                  </li>
                </ul>
                <div className="tab-content">
                  <div className="tab-pane fade show active" id="medecins-tab">
                    <AffiliationRequestsManagerMedecins onRequestProcessed={fetchPendingRequests} />
                  </div>
                  <div className="tab-pane fade" id="patients-tab">
                    <AffiliationRequestsManagerPatients onRequestProcessed={fetchPendingRequests} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Médecins - Affichage en mode carte */}
          {activeTab === 'medecins' && (
            <div>
              {showMedecinForm && (
                <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h5>{currentMedecin ? 'Modifier le médecin' : 'Ajouter un médecin'}</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddMedecin}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          name="nom"
                          className="form-control"
                          value={medecinForm.nom}
                          onChange={handleMedecinChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Prénom</label>
                        <input
                          type="text"
                          name="prenom"
                          className="form-control"
                          value={medecinForm.prenom}
                          onChange={handleMedecinChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Spécialité</label>
                        <select
                          name="specialite"
                          className="form-select"
                          value={medecinForm.specialite}
                          onChange={handleMedecinChange}
                          required
                        >
                          <option value="">Sélectionner une spécialité</option>
                          {specialites.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                        {medecinForm.specialite === 'Autre' && (
                          <input
                            type="text"
                            name="specialiteAutre"
                            className="form-control mt-2"
                            placeholder="Précisez la spécialité"
                            value={medecinForm.specialiteAutre || ''}
                            onChange={handleMedecinChange}
                          />
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="tel"
                          name="telephone"
                          className="form-control"
                          value={medecinForm.telephone}
                          onChange={handleMedecinChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={medecinForm.email}
                          onChange={handleMedecinChange}
                          required
                        />
                      </div>
                    
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Disponibilités</label>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Jour</th>
                              <th>Disponible</th>
                              <th>Heure de début</th>
                              <th>Heure de fin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {joursSemaine.map((jour) => (
                              <tr key={jour}>
                                <td>{jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                                <td>
                                  <div className="form-check form-switch">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`disponible-${jour}`}
                                      checked={medecinForm.disponibilites[jour].actif}
                                      onChange={() => handleDisponibiliteChange(jour, 'actif')}
                                    />
                                    <label className="form-check-label" htmlFor={`disponible-${jour}`}>
                                      {medecinForm.disponibilites[jour].actif ? 'Oui' : 'Non'}
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={medecinForm.disponibilites[jour].debut}
                                    onChange={(e) => handleDisponibiliteChange(jour, 'debut', e.target.value)}
                                    disabled={!medecinForm.disponibilites[jour].actif}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="time"
                                    className="form-control"
                                    value={medecinForm.disponibilites[jour].fin}
                                    onChange={(e) => handleDisponibiliteChange(jour, 'fin', e.target.value)}
                                    disabled={!medecinForm.disponibilites[jour].actif}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Assurances acceptées</label>
                      <div className="d-flex flex-wrap">
                        {assurancesList.map((assurance) => (
                          <div className="form-check me-3 mb-2" key={assurance}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`assurance-medecin-${assurance}`}
                              name="assurances"
                              value={assurance}
                              checked={medecinForm.assurances.includes(assurance)}
                              onChange={handleMedecinChange}
                            />
                            <label className="form-check-label" htmlFor={`assurance-medecin-${assurance}`}>
                              {assurance}
                            </label>
                          </div>
                        ))}
                      </div>
                      {medecinForm.assurances.includes('Autre') && (
                        <input
                          type="text"
                          name="assuranceAutre"
                          className="form-control mt-2"
                          placeholder="Précisez l'assurance"
                          value={medecinForm.assuranceAutre || ''}
                          onChange={handleMedecinChange}
                        />
                      )}
                    </div>

                    <div className="text-end mt-3">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => {
                        resetMedecinForm();
                        setShowMedecinForm(false);
                      }}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentMedecin ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des médecins en mode carte */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {medecins.length > 0 ? (
                medecins.map((medecin) => (
                  <div className="col" key={medecin.id}>
                    <div className="card h-100 shadow-sm hover-card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <h5 className="card-title">Dr. {medecin.prenom} {medecin.nom}</h5>
                          <span className="badge bg-info">{medecin.specialite}</span>
                        </div>
                        <p className="card-text">
                          <FontAwesomeIcon icon={faPhone} className="me-2 text-secondary" />
                          {medecin.telephone}
                        </p>
                        <p className="card-text">
                          <FontAwesomeIcon icon={faEnvelope} className="me-2 text-secondary" />
                          {medecin.email}
                        </p>
                        <div className="mt-3">
                          <h6>Disponibilités:</h6>
                          <div className="disponibilites-container">
                            {Array.isArray(medecin.disponibilites) ? (
                              medecin.disponibilites.map((dispo, index) => (
                                <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                  {dispo.jour}: {dispo.heureDebut}-{dispo.heureFin}
                                </span>
                              ))
                            ) : (
                              Object.entries(medecin.disponibilites || {}).map(([jour, dispo]) => (
                                dispo.actif && (
                                  <span key={jour} className="badge bg-light text-dark me-1 mb-1">
                                    {jour.charAt(0).toUpperCase() + jour.slice(1)}: {dispo.debut}-{dispo.fin}
                                  </span>
                                )
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-top-0">
                        <div className="d-flex justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditMedecin(medecin)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteMedecin(medecin.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">Aucun médecin n'a été ajouté</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      resetMedecinForm();
                      setShowMedecinForm(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                    Ajouter un médecin
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Patients - Affichage en mode carte */}
        {activeTab === 'patients' && (
          <div>
            {showPatientForm && (
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h5>{currentPatient ? 'Modifier le patient' : 'Ajouter un patient'}</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddPatient}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nom</label>
                        <input
                          type="text"
                          name="nom"
                          className="form-control"
                          value={patientForm.nom}
                          onChange={handlePatientChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Prénom</label>
                        <input
                          type="text"
                          name="prenom"
                          className="form-control"
                          value={patientForm.prenom}
                          onChange={handlePatientChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date de naissance</label>
                        <input
                          type="date"
                          name="dateNaissance"
                          className="form-control"
                          value={patientForm.dateNaissance}
                          onChange={handlePatientChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Téléphone</label>
                        <input
                          type="tel"
                          name="telephone"
                          className="form-control"
                          value={patientForm.telephone}
                          onChange={handlePatientChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={patientForm.email}
                          onChange={handlePatientChange}
                          required
                        />
                      </div>
                   
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Assurances</label>
                      <div className="d-flex flex-wrap">
                        {assurancesList.map((assurance) => (
                          <div className="form-check me-3 mb-2" key={assurance}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`assurance-patient-${assurance}`}
                              name="assurances"
                              value={assurance}
                              checked={patientForm.assurances.includes(assurance)}
                              onChange={handlePatientChange}
                            />
                            <label className="form-check-label" htmlFor={`assurance-patient-${assurance}`}>
                              {assurance}
                            </label>
                          </div>
                        ))}
                      </div>
                      {patientForm.assurances.includes('Autre') && (
                        <input
                          type="text"
                          name="assuranceAutre"
                          className="form-control mt-2"
                          placeholder="Précisez l'assurance"
                          value={patientForm.assuranceAutre || ''}
                          onChange={handlePatientChange}
                        />
                      )}
                    </div>

                    <div className="text-end mt-3">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => {
                        resetPatientForm();
                        setShowPatientForm(false);
                      }}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentPatient ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Liste des patients en mode carte */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <div className="col" key={patient.id}>
                    <div className="card h-100 shadow-sm hover-card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <h5 className="card-title">{patient.prenom} {patient.nom}</h5>
                          <span className="badge bg-secondary">
                            {new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear()} ans
                          </span>
                        </div>
                        <p className="card-text">
                          <small className="text-muted">Né(e) le {new Date(patient.dateNaissance).toLocaleDateString()}</small>
                        </p>
                        <p className="card-text">
                          <FontAwesomeIcon icon={faPhone} className="me-2 text-secondary" />
                          {patient.telephone}
                        </p>
                        <p className="card-text">
                          <FontAwesomeIcon icon={faEnvelope} className="me-2 text-secondary" />
                          {patient.email}
                        </p>
                        <div className="mt-3">
                          <h6>Assurances:</h6>
                          <div>
                            {patient.assurances && patient.assurances.map((assurance, index) => (
                              <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                {assurance}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-top-0">
                        <div className="d-flex justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeletePatient(patient.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p className="text-muted">Aucun patient n'a été ajouté</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      resetPatientForm();
                      setShowPatientForm(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                    Ajouter un patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Rendez-vous - Vue mensuelle */}
        {activeTab === 'rendezvous' && (
          <div>
            {showRendezvousForm && (
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h5>{currentRendezvous ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'}</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddRendezvous}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Médecin</label>
                        <select
                          name="medecinId"
                          className="form-select"
                          value={rdvForm.medecinId}
                          onChange={handleRdvChange}
                          required
                        >
                          <option value="">Sélectionner un médecin</option>
                          {medecins.map((medecin) => (
                            <option key={medecin.id} value={medecin.id}>
                              Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Patient</label>
                        <select
                          name="patientId"
                          className="form-select"
                          value={rdvForm.patientId}
                          onChange={handleRdvChange}
                          required
                        >
                          <option value="">Sélectionner un patient</option>
                          {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                              {patient.prenom} {patient.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          name="date"
                          className="form-control"
                          value={rdvForm.date}
                          onChange={handleRdvChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
  <label className="form-label">Heure</label>
  <div className="time-slots-container">
    {rdvForm.medecinId && rdvForm.date ? (
      getCreneauxAvecStatut().map((creneau) => (
        <div 
          key={creneau.heure}
          className={`time-slot ${creneau.statut} ${rdvForm.heure === creneau.heure ? 'selected' : ''}`}
          onClick={() => {
            if (creneau.statut !== 'complet') {
              setRdvForm({...rdvForm, heure: creneau.heure});
            }
          }}
        >
          {creneau.heure}
          {creneau.statut === 'partiel' && (
            <div className="slot-info">
              {creneau.nombreRdv}/{3} occupé{creneau.nombreRdv > 1 ? 's' : ''}
            </div>
          )}
          {creneau.statut === 'complet' && (
            <div className="slot-info">Complet</div>
          )}
        </div>
      ))
    ) : (
      <div className="alert alert-info">
        Veuillez sélectionner un médecin et une date
      </div>
    )}
  </div>
</div>


                  {/*  <div className="col-md-4 mb-3">
                        <label className="form-label">Durée (minutes)</label>
                        <select
                          name="duree"
                          className="form-select"
                          value={rdvForm.duree}
                          onChange={handleRdvChange}
                          required
                        >
                          {dureesRdv.map((duree) => (
                            <option key={duree} value={duree}>
                              {duree} min
                            </option>
                          ))}
                        </select>
                      </div> */}
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Motif</label>
                        <textarea
                          name="motif"
                          className="form-control"
                          value={rdvForm.motif}
                          onChange={handleRdvChange}
                          rows="3"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Statut</label>
                        <select
                          name="statut"
                          className="form-select"
                          value={rdvForm.statut}
                          onChange={handleRdvChange}
                          required
                        >
                          {statutsRdv.map((statut) => (
                            <option key={statut} value={statut}>
                              {statut.charAt(0).toUpperCase() + statut.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-end mt-3">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => {
                        resetRdvForm();
                        setShowRendezvousForm(false);
                      }}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon={faCheck} className="me-2" />
                        {currentRendezvous ? 'Mettre à jour' : 'Ajouter'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

              {renderQuickRequestsSection()}


            {/* Vue calendrier des rendez-vous */}
            <div className="card shadow-sm mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
               
                <div className="d-flex align-items-center">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={handlePrevMonth}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  <h5 className="mb-0 mx-3">
                    {currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                  </h5>
                  <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleNextMonth}>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
                <div>
                  <h5>
                    Calendrier des rendez-vous
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 ms-2" />

                  </h5>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="calendar-container">
                  <div className="calendar-header">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, index) => (
                      <div key={index} className="calendar-cell header">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="calendar-body">
                    {getMonthData().map((day, index) => (
                      <div 
                        key={index} 
                        className={`calendar-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${day.hasEvents ? 'has-events' : ''}`}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="date-number">{day.date.getDate()}</div>
                        {day.hasEvents && (
                          <div className="event-indicator">
                            <span className="badge rounded-pill bg-primary">
                              {day.medecinCount} {day.medecinCount > 1 ? 'médecins' : 'médecin'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Archives */}
        {activeTab === 'archives' && (
          <div>
            {showArchiveForm && (
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h5>{currentArchive ? "Modifier l'archive" : "Ajouter une archive"}</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddArchive}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="patientId" className="form-label">Patient</label>
                        <select 
                          id="patientId" 
                          name="patientId" 
                          className="form-select" 
                          value={archiveForm.patientId} 
                          onChange={handleArchiveChange}
                          required
                        >
                          <option value="">Sélectionner un patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.prenom} {patient.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="titre" className="form-label">Titre</label>
                        <input 
                          type="text" 
                          id="titre" 
                          name="titre" 
                          className="form-control" 
                          value={archiveForm.titre} 
                          onChange={handleArchiveChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea 
                          id="description" 
                          name="description" 
                          className="form-control" 
                          value={archiveForm.description} 
                          onChange={handleArchiveChange}
                          rows="3"
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label htmlFor="notes" className="form-label">Notes</label>
                        <textarea 
                          id="notes" 
                          name="notes" 
                          className="form-control" 
                          value={archiveForm.notes} 
                          onChange={handleArchiveChange}
                          rows="3"
                          />
                        </div>
                      </div>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="date" className="form-label">Date</label>
                          <input 
                            type="date" 
                            id="date" 
                            name="date" 
                            className="form-control" 
                            value={archiveForm.date} 
                            onChange={handleArchiveChange}
                            required
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Tags</label>
                          <div className="d-flex flex-wrap">
                            {tagsList.map(tag => (
                              <div className="form-check me-3 mb-2" key={tag}>
                                <input 
                                  type="checkbox" 
                                  className="form-check-input" 
                                  id={`tag-${tag}`} 
                                  name="tags" 
                                  value={tag}
                                  checked={archiveForm.tags.includes(tag)}
                                  onChange={handleArchiveChange}
                                />
                                <label className="form-check-label" htmlFor={`tag-${tag}`}>
                                  {tag}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="files" className="form-label">Fichiers</label>
                        <input 
                          type="file" 
                          id="files" 
                          className="form-control" 
                          onChange={handleFileChange}
                          multiple
                        />
                        <div className="form-text">
                          Vous pouvez sélectionner plusieurs fichiers.
                        </div>
                      </div>
                      
                      {selectedFiles.length > 0 && (
                        <div className="mb-3">
                          <h6>Fichiers sélectionnés :</h6>
                          <ul className="list-group">
                            {selectedFiles.map((file, index) => (
                              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                {file.name}
                                <span className="badge bg-primary rounded-pill">{(file.size / 1024).toFixed(2)} KB</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {currentArchive && archiveForm.files && archiveForm.files.length > 0 && (
                        <div className="mb-3">
                          <h6>Fichiers existants :</h6>
                          <ul className="list-group">
                            {archiveForm.files.map((file, index) => (
                              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteFile(currentArchive.id, file.path, index)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-end mt-3">
                        <button type="button" className="btn btn-secondary me-2" onClick={() => {
                          resetArchiveForm();
                          setShowArchiveForm(false);
                        }}>
                          <FontAwesomeIcon icon={faTimes} className="me-2" />
                          Annuler
                        </button>
                        <button type="submit" className="btn btn-primary">
                          <FontAwesomeIcon icon={faCheck} className="me-2" />
                          {currentArchive ? "Mettre à jour" : "Ajouter"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Archives des patients</h5>
                  <div className="d-flex">
                    <input 
                      type="text" 
                      className="form-control form-control-sm me-2" 
                      placeholder="Rechercher un patient" 
                      value={filtreArchivePatient}
                      onChange={(e) => setFiltreArchivePatient(e.target.value)}
                    />
                    <button className="btn btn-sm btn-outline-secondary">
                      <FontAwesomeIcon icon={faSearch} />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {archives.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Titre</th>
                            <th>Date</th>
                            <th>Tags</th>
                            <th>Fichiers</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archives
                            .filter(archive => {
                              if (!filtreArchivePatient) return true;
                              const patientNom = archive.patientNom || '';
                              return patientNom.toLowerCase().includes(filtreArchivePatient.toLowerCase());
                            })
                            .map(archive => (
                            <tr key={archive.id}>
                              <td>{archive.patientNom}</td>
                              <td>{archive.titre}</td>
                              <td>{new Date(archive.date).toLocaleDateString()}</td>
                              <td>
                                {archive.tags && archive.tags.map((tag, index) => (
                                  <span key={index} className="badge bg-info me-1">{tag}</span>
                                ))}
                              </td>
                              <td>
                                {archive.files && (
                                  <span className="badge bg-secondary">{archive.files.length}</span>
                                )}
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-1"
                                  onClick={() => handleEditArchive(archive)}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteArchive(archive.id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p className="text-muted">Aucune archive n'a été ajoutée</p>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          resetArchiveForm();
                          setShowArchiveForm(true);
                        }}
                      >
                        <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                        Ajouter une archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Mot de passe */}
          {activeTab === 'password' && (
            <div className="card shadow-sm">
              <div className="card-body">
                <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
                  <div className="mb-3">
                    <label className="form-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="text-end">
                    <button type="submit" className="btn btn-primary">
                      <FontAwesomeIcon icon={faCheck} className="me-2" />
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales pour la gestion des rendez-vous */}
      {/* Modal pour afficher les médecins d'une date */}
      <Modal show={showDateModal} onHide={() => setShowDateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Rendez-vous du {selectedDate && selectedDate.date.toLocaleDateString()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="list-group">
            {selectedDate && getMedecinsByDate(selectedDate).map((item, index) => (
              <button 
                key={index} 
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                onClick={() => handleMedecinClick(item.medecin.id)}
              >
                <div>
                  <h5>Dr. {item.medecin.prenom} {item.medecin.nom}</h5>
                  <p className="mb-1 text-muted">{item.medecin.specialite}</p>
                </div>
                <span className="badge bg-primary rounded-pill">{item.rdvCount} RDV</span>
              </button>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDateModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour afficher les rendez-vous d'un médecin à une date donnée */}
      <Modal show={showMedecinRdvModal} onHide={() => setShowMedecinRdvModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMedecinId && selectedDate && (
              <>
                Rendez-vous de Dr. {medecins.find(m => m.id === selectedMedecinId)?.prenom} {medecins.find(m => m.id === selectedMedecinId)?.nom}
                <p className="mb-0 fs-6 text-muted">
                  {selectedDate.date.toLocaleDateString()}
                </p>
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="rdv-list">
            {selectedMedecinId && selectedDate && getMedecinRdvs(selectedMedecinId, selectedDate).map((rdv, index) => (
              <div 
                key={rdv.id} 
                className={`rdv-item ${draggedRdv?.id === rdv.id ? 'dragging' : ''} status-${rdv.statut}`}
                draggable
                onDragStart={() => handleDragStart(rdv)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(rdv)}
                onClick={() => handleRdvClick(rdv)}
              >
                <div className="rdv-time">
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  {rdv.heure}{/* ({rdv.duree} min) */}
                </div>
                <div className="rdv-patient">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  {patients.find(p => p.id === rdv.patientId)?.prenom} {patients.find(p => p.id === rdv.patientId)?.nom || rdv.patientNom}
                </div>
                <div className="rdv-status">
                  <span className={`badge status-badge-${rdv.statut}`}>
                    {rdv.statut.charAt(0).toUpperCase() + rdv.statut.slice(1)}
                  </span>
                </div>
                <div className="rdv-actions">
                  <button className="btn btn-sm btn-outline-secondary me-1" title="Voir détails">
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-primary me-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRendezvous(rdv);
                      setShowMedecinRdvModal(false);
                    }}
                    title="Modifier"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
                        handleDeleteRendezvous(rdv.id);
                        setShowMedecinRdvModal(false);
                      }
                    }}
                    title="Supprimer"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-center mt-3">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  resetRdvForm();
                  setRdvForm(prev => ({
                    ...prev,
                    medecinId: selectedMedecinId,
                    date: selectedDate.date.toISOString().split('T')[0]
                  }));
                  setShowRendezvousForm(true);
                  setShowMedecinRdvModal(false);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                Ajouter un rendez-vous
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-100 d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                <FontAwesomeIcon icon={faExchangeAlt} className="me-1" />
                Glisser-déposer pour échanger des rendez-vous
              </small>
            </div>
            <Button variant="secondary" onClick={() => setShowMedecinRdvModal(false)}>
              Fermer
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Modal pour afficher les détails d'un rendez-vous */}
      <Modal show={showRdvDetailsModal} onHide={() => setShowRdvDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails du rendez-vous</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRdv && (
            <div>
              <div className="mb-3">
                <h5>Médecin</h5>
                <p>{medecins.find(m => m.id === selectedRdv.medecinId)?.prenom} {medecins.find(m => m.id === selectedRdv.medecinId)?.nom || selectedRdv.medecinNom}</p>
              </div>
              <div className="mb-3">
                <h5>Patient</h5>
                <p>{patients.find(p => p.id === selectedRdv.patientId)?.prenom} {patients.find(p => p.id === selectedRdv.patientId)?.nom || selectedRdv.patientNom}</p>
              </div>
              <div className="mb-3">
                <h5>Date et heure</h5>
                <p>{new Date(selectedRdv.date).toLocaleDateString()} à {selectedRdv.heure} {/* ({selectedRdv.duree} min) */} </p>
              </div>
              <div className="mb-3">
                <h5>Motif</h5>
                <p>{selectedRdv.motif || 'Non spécifié'}</p>
              </div>
              <div className="mb-3">
                <h5>Statut</h5>
                <div>
                  {statutsRdv.map(statut => (
                    <button 
                      key={statut} 
                      className={`btn btn-sm me-1 mb-1 ${selectedRdv.statut === statut ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => handleChangeStatutRendezvous(selectedRdv.id, statut)}
                    >
                      {statut.charAt(0).toUpperCase() + statut.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRdvDetailsModal(false)}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              handleEditRendezvous(selectedRdv);
              setShowRdvDetailsModal(false);
            }}
          >
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Modifier
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour voir toutes les demandes rapides */}
      <Modal 
        show={showQuickRequestsModal} 
        onHide={() => setShowQuickRequestsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
            Demandes de rendez-vous rapides
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quickRequests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Date souhaitée</th>
                    <th>Heure</th>
                    <th>Motif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quickRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.prenom} {request.nom}</td>
                      <td>
                        <div>{request.telephone}</div>
                        <div><small>{request.email}</small></div>
                      </td>
                      <td>{request.dateFormatted}</td>
                      <td>{request.heureRdv}</td>
                      <td>{request.motif || "-"}</td>
                      <td>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleRejectQuickRequest(request.id)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </Button>
                        <Button 
                          variant="outline-success" 
                          size="sm"
                          onClick={() => {
                            setSelectedQuickRequest(request);
                            setAssignMedecinModal(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-4">Aucune demande de rendez-vous rapide en attente</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuickRequestsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour assigner un médecin à une demande */}
      <Modal 
        show={assignMedecinModal} 
        onHide={() => setAssignMedecinModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Assigner un médecin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuickRequest && (
            <div>
              <div className="mb-3">
                <h6>Détails de la demande:</h6>
                <p><strong>Patient:</strong> {selectedQuickRequest.prenom} {selectedQuickRequest.nom}</p>
                <p><strong>Date souhaitée:</strong> {selectedQuickRequest.dateFormatted}</p>
                <p><strong>Heure souhaitée:</strong> {selectedQuickRequest.heureRdv}</p>
                {selectedQuickRequest.motif && (
                  <p><strong>Motif:</strong> {selectedQuickRequest.motif}</p>
                )}
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner un médecin</Form.Label>
                <Form.Select 
                  value={selectedMedecinForQuick} 
                  onChange={(e) => setSelectedMedecinForQuick(e.target.value)}
                  required
                >
                  <option value="">Choisir un médecin</option>
                  {medecins.map(medecin => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAssignMedecinModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAcceptQuickRequest}
            disabled={!selectedMedecinForQuick}
          >
            Confirmer le rendez-vous
          </Button>
        </Modal.Footer>
      </Modal>
      <style jsx>{`/* Styles pour le dashboard */
.dashboard-container {
    display: flex;
    min-height: 100vh;
  }
  
  /* Styles pour la sidebar */
  .sidebar {
    width: 250px;
    background-color: #343a40;
    color: white;
    transition: all 0.3s;
    z-index: 1000;
    height: 100vh;
    position: fixed;
    overflow-y: auto;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
  
  .sidebar-header {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-header h3 {
    margin: 0;
    font-size: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .toggle-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
  }
  
  .sidebar-menu ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  
  .sidebar-menu li {
    padding: 15px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .sidebar-menu li:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-menu li.active {
    background-color: #007bff;
  }
  
  .sidebar-menu li span {
    margin-left: 10px;
    white-space: nowrap;
  }
  
  .sidebar-menu .badge {
    position: absolute;
    right: 15px;
  }
  
  /* Styles pour le contenu principal */
  .main-content {
    flex: 1;
    margin-left: 250px;
    padding: 20px;
    transition: all 0.3s;
  }
  
  .main-content.expanded {
    margin-left: 60px;
  }
  
  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .content-body {
    margin-bottom: 30px;
  }
  
  /* Styles pour les cartes */
  .hover-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .hover-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
  }
  
  /* Styles pour le calendrier */
  .calendar-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }
  
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
  }
  
  .calendar-cell {
    min-height: 100px;
    border: 1px solid #dee2e6;
    padding: 5px;
    position: relative;
  }
  
  .calendar-cell.header {
    min-height: auto;
    padding: 10px;
    text-align: center;
    font-weight: bold;
  }
  
  .calendar-cell.other-month {
    background-color: #f8f9fa;
    color: #adb5bd;
  }
  
  .calendar-cell.has-events {
    background-color: #e9f5ff;
    cursor: pointer;
  }
  
  .calendar-cell.has-events:hover {
    background-color: #d0e8ff;
  }
  
  .date-number {
    position: absolute;
    top: 5px;
    left: 5px;
    font-weight: bold;
  }
  
  .event-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  
  /* Styles pour les rendez-vous */
  .rdv-list {
    max-height: 500px;
    overflow-y: auto;
  }
  
  .rdv-item {
    padding: 10px 15px;
    margin-bottom: 10px;
    border-radius: 5px;
    background-color: #f8f9fa;
    border-left: 5px solid #007bff;
    display: flex;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .rdv-item:hover {
    background-color: #e9ecef;
  }
  
  .rdv-item.dragging {
    opacity: 0.5;
  }
  
  .rdv-time {
    font-weight: bold;
  }
  
  .rdv-patient {
    color: #495057;
  }
  
  .rdv-status {
    margin-top: 5px;
  }
  
  .rdv-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 5px;
  }
  
  /* Styles pour les statuts de rendez-vous */
  .status-planifié {
    border-left-color: #6c757d;
  }
  
  .status-confirmé {
    border-left-color: #28a745;
  }
  
  .status-en-cours {
    border-left-color: #007bff;
  }
  
  .status-terminé {
    border-left-color: #20c997;
  }
  
  .status-annulé {
    border-left-color: #dc3545;
  }
  
  .status-absent {
    border-left-color: #ffc107;
  }
  
  .status-badge-planifié {
    background-color: #6c757d;
  }
  
  .status-badge-confirmé {
    background-color: #28a745;
  }
  
  .status-badge-en-cours {
    background-color: #007bff;
  }
  
  .status-badge-terminé {
    background-color: #20c997;
  }
  
  .status-badge-annulé {
    background-color: #dc3545;
  }
  
  .status-badge-absent {
    background-color: #ffc107;
    color: #212529;
  }
  
  /* Responsive */
  @media (max-width: 999.98px) {
    .sidebar {
      width: 60px;
    }
    
    .sidebar.collapsed {
      margin-left: -60px;
    }
    
    .main-content {
      margin-left: 60px;
    }
    
    .main-content.expanded {
      margin-left: 0;
    }
  }
  
  @media (max-width: 767.98px) {
    .calendar-cell {
      min-height: 70px;
    }
  }
  
  @media (max-width: 575.98px) {
    .calendar-cell {
      min-height: 50px;
    }
    
    .date-number {
      font-size: 0.8rem;
    }
    
    .event-indicator {
      font-size: 0.7rem;
    }
  }
  
  /* Styles pour l'interface mobile */
@media (max-width: 999px) {
    /* Styles généraux */
    body {
      background-color: #fafafa;
    }
  
    .mobile-dashboard {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
  
    /* Header mobile */
    .mobile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 56px;
      padding: 0 16px;
      background-color: #fff;
      border-bottom: 1px solid #dbdbdb;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
  
    /* Menu mobile */
    .mobile-menu {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #fff;
      z-index: 999;
      overflow-y: auto;
    }
  
    /* Contenu principal mobile */
    .mobile-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 72px; /* Pour éviter que le contenu soit caché par la navigation */
    }
  
    /* Navigation mobile style Instagram */
    .mobile-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 56px;
      background-color: #fff;
      border-top: 1px solid #dbdbdb;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
  
    .mobile-nav .nav-item {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background: none;
      border: none;
      color: #262626;
      font-size: 1.25rem;
      padding: 0;
    }
  
    .mobile-nav .nav-item.active {
      color: #0d6efd;
    }
  
    /* Bouton d'action flottant */
    .mobile-floating-action {
      position: fixed;
      right: 16px;
      bottom: 72px;
      z-index: 900;
    }
  
    .btn-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.25rem;
    }
  
    .floating-action-menu {
      position: absolute;
      bottom: 64px;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 200px;
    }
  
    .btn-action-item {
      text-align: left;
      border-radius: 20px;
      padding: 8px 16px;
    }
  
    /* Styles pour les cartes et éléments de liste */
    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.75rem;
      margin: 0 auto;
    }
  
    .avatar-small {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1rem;
    }
  
    .info-item {
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }
  
    /* Styles pour le calendrier mobile */
    .calendar-mobile {
      background-color: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  
    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      background-color: #f8f9fa;
    }
  
    .calendar-day-header {
      padding: 8px 0;
      font-weight: bold;
      font-size: 0.8rem;
    }
  
    .calendar-body {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
  
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      border: 1px solid #f0f0f0;
    }
  
    .calendar-day.other-month {
      color: #ccc;
    }
  
    .date-number {
      font-size: 0.9rem;
    }
  
    .event-dot {
      width: 6px;
      height: 6px;
      background-color: #0d6efd;
      border-radius: 50%;
      position: absolute;
      bottom: 4px;
    }
  
    /* Styles pour les rendez-vous */
    .rdv-item-mobile {
      padding: 8px 0;
      border-left: 4px solid transparent;
    }
  
    .status-planifié {
      border-left-color: #ffc107;
    }
  
    .status-confirmé {
      border-left-color: #0d6efd;
    }
  
    .status-en-cours {
      border-left-color: #6f42c1;
    }
  
    .status-terminé {
      border-left-color: #198754;
    }
  
    .status-annulé {
      border-left-color: #dc3545;
    }
  
    .status-absent {
      border-left-color: #6c757d;
    }
  
    .status-badge-planifié {
      background-color: #ffc107;
      color: #212529;
    }
  
    .status-badge-confirmé {
      background-color: #0d6efd;
    }
  
    .status-badge-en-cours {
      background-color: #6f42c1;
    }
  
    .status-badge-terminé {
      background-color: #198754;
    }
  
    .status-badge-annulé {
      background-color: #dc3545;
    }
  
    .status-badge-absent {
      background-color: #6c757d;
    }
  
    .status-indicator {
      padding: 8px 16px;
      text-align: center;
      color: #fff;
      font-weight: bold;
      margin-bottom: 16px;
      border-radius: 4px;
    }
  
    .status-planifié.status-indicator {
      background-color: #ffc107;
      color: #212529;
    }
  
    .status-confirmé.status-indicator {
      background-color: #0d6efd;
    }
  
    .status-en-cours.status-indicator {
      background-color: #6f42c1;
    }
  
    .status-terminé.status-indicator {
      background-color: #198754;
    }
  
    .status-annulé.status-indicator {
      background-color: #dc3545;
    }
  
    .status-absent.status-indicator {
      background-color: #6c757d;
    }
  
    /* Styles pour les formulaires mobiles */
    .mobile-form {
      padding-bottom: 16px;
    }
  
    /* Styles pour les vues détaillées */
    .mobile-detail-view {
      padding-bottom: 16px;
    }
  
    /* Styles pour les statuts */
    .status-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  

  /* Styles pour les créneaux horaires */
.time-slots-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.time-slot {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.time-slot.disponible {
  background-color: #f8f9fa;
}

.time-slot.indisponible {
  background-color: #ffebee;
  color: #9e9e9e;
  cursor: not-allowed;
  opacity: 0.7;
}

.time-slot.selected {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.slot-info {
  font-size: 10px;
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  text-align: center;
}

/* Pour la version mobile */
@media (max-width: 768px) {
  .time-slots-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Styles pour les créneaux horaires */
.time-slots-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.time-slot {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.time-slot.disponible {
  background-color: #f8f9fa;
}

.time-slot.partiel {
  background-color: #fff3cd; /* Jaune clair pour indiquer partiellement occupé */
  color: #856404;
}

.time-slot.complet {
  background-color: #ffebee; /* Rouge clair pour indiquer complet */
  color: #9e9e9e;
  cursor: not-allowed;
  opacity: 0.7;
}

.time-slot.selected {
  background-color: #007bff;
  color: white !important;
  border-color: #007bff;
}

.time-slot.selected .slot-info {
  color: rgba(255, 255, 255, 0.8);
}

.slot-info {
  font-size: 10px;
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  text-align: center;
}

/* Pour la version mobile */
@media (max-width: 768px) {
  .time-slots-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Styles pour les créneaux horaires */
.time-slots-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 250px;
  overflow-y: auto;
}

.time-slot {
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  min-height: 70px;
  display: flex;
  flex-direction: column;
}

.time-header {
  font-weight: bold;
  margin-bottom: 4px;
}

.time-slot.disponible {
  background-color: #f8f9fa;
}

.time-slot.partiel {
  background-color: #fff3cd; /* Jaune clair pour indiquer partiellement occupé */
  color: #856404;
}

.time-slot.complet {
  background-color: #ffebee; /* Rouge clair pour indiquer complet */
  color: #9e9e9e;
  cursor: not-allowed;
  opacity: 0.7;
}

.time-slot.selected {
  background-color: #007bff;
  color: white !important;
  border-color: #007bff;
}

.time-slot.selected .slot-info {
  color: rgba(255, 255, 255, 0.8);
}

.slot-info {
  font-size: 10px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rdv-numero {
  font-size: 9px;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  margin-top: 2px;
}

.rdv-numero.current {
  background-color: rgba(0, 123, 255, 0.2);
  font-weight: bold;
}

.complet-text {
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 2px;
}

/* Pour la version mobile */
@media (max-width: 768px) {
  .time-slots-container {
    grid-template-columns: repeat(3, 1fr);
  }
}


/* Styles pour les demandes rapides */
.quick-requests-preview {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.quick-request-item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.quick-request-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.quick-request-details {
  font-size: 0.9rem;
}

.quick-request-details p {
  margin-bottom: 0.5rem;
}

.badge-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.quick-badge {
  position: relative;
  font-size: 0.65rem;
  padding: 3px 6px;
  border-radius: 50%;
  margin-left: -8px;
  margin-top: -8px;
}

/* Styles pour la vue mobile */
.mobile-dashboard .quick-request-item {
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .quick-requests-preview {
    gap: 10px;
  }
  
  .quick-request-item {
    padding: 10px;
  }
}


/* Style pour les rendez-vous rapides */
.rdv-item.quick-appointment {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.05);
}

.calendar-cell.has-quick-events {
  background-color: rgba(255, 152, 0, 0.1);
}

.event-indicator .badge.quick-badge {
  background-color: #ff9800;
}


/* Style pour les rendez-vous rapides */
.rdv-item.quick-appointment {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.08);
}

/* Badge pour les rendez-vous rapides */
.quick-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.7rem;
}

/* Indicateur dans le calendrier pour les jours avec des rendez-vous rapides */
.calendar-cell.has-quick-events {
  background-color: rgba(255, 152, 0, 0.1);
}

/* Style pour les rendez-vous rapides dans la liste */
.rdv-item-mobile.quick-appointment {
  border-left: 4px solid #ff9800;
}

/* Style pour les rendez-vous rapides */
.rdv-item.quick-appointment {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.08);
  position: relative;
}

.rdv-item.quick-appointment::before {
  content: "Rapide";
  position: absolute;
  top: 2px;
  right: 5px;
  font-size: 0.65rem;
  color: #ff9800;
  font-weight: bold;
}

/* Badge pour les rendez-vous rapides */
.quick-badge {
  background-color: #ff9800 !important;
}

/* Indicateur dans le calendrier pour les jours avec des rendez-vous rapides */
.calendar-cell.has-quick-events {
  background-color: rgba(255, 152, 0, 0.1);
}

/* Style pour les rendez-vous rapides dans la liste */
.rdv-item-mobile.quick-appointment {
  border-left: 4px solid #ff9800;
}
` }

</style>  
    </div>
  );                 
 
};

export default StructureDashboard;