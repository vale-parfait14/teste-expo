import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { 
  doc, getDoc, updateDoc, query, collection, where, getDocs, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db,storage } from '../components/firebase-config.js';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

import 'bootstrap/dist/css/bootstrap.min.css';
import MedecinStructurePlanning from './MedecinStructurePlanning.js';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const MedecinDashboard = () => {
  // États principaux
  const [medecinData, setMedecinData] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('rendezvous'); //rendezvous, info ,patients
  const [message, setMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // États pour la gestion du profil
  const [newPassword, setNewPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  
  // États pour les données métier
  const [rendezvous, setRendezvous] = useState([]);
  const [patients, setPatients] = useState([]);
  const [structures, setStructures] = useState([]);
  const [affiliationRequests, setAffiliationRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [affiliationStatus, setAffiliationStatus] = useState(null);

  // États pour le calendrier
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(true);
  const [rdvCountByDate, setRdvCountByDate] = useState({});

  // Navigation et authentification
  const navigate = useNavigate();
  const auth = getAuth();
  
  // Dans votre composant principal
  const [availabilities, setAvailabilities] = useState({
    Lundi: { disponible: true, debut_matin: "08:00", fin_matin: "12:00", debut_aprem: "14:00", fin_aprem: "18:00" },
    Mardi: { disponible: true, debut_matin: "08:00", fin_matin: "12:00", debut_aprem: "14:00", fin_aprem: "18:00" },
    Mercredi: { disponible: true, debut_matin: "08:00", fin_matin: "12:00", debut_aprem: "14:00", fin_aprem: "18:00" },
    Jeudi: { disponible: true, debut_matin: "08:00", fin_matin: "12:00", debut_aprem: "14:00", fin_aprem: "18:00" },
    Vendredi: { disponible: true, debut_matin: "08:00", fin_matin: "12:00", debut_aprem: "14:00", fin_aprem: "18:00" },
    Samedi: { disponible: false, debut_matin: "09:00", fin_matin: "12:00", debut_aprem: "", fin_aprem: "" },
    Dimanche: { disponible: false, debut_matin: "", fin_matin: "", debut_aprem: "", fin_aprem: "" }
  });

  const [editingAvailabilities, setEditingAvailabilities] = useState(false);


  // États pour la gestion des patients
const [newPatientForm, setNewPatientForm] = useState({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  dateNaissance: '',
  adresse: '',
  assurance: '',
  notes: '',
  isPrivate: true
});
const [showNewPatientModal, setShowNewPatientModal] = useState(false);
const [patientFilter, setPatientFilter] = useState('all'); // 'all', 'private', 'structure'

// États pour la gestion des sauvegardes
const [patientFiles, setPatientFiles] = useState({});
const [selectedPatient, setSelectedPatient] = useState(null);
const [patientNotes, setPatientNotes] = useState({});
const [fileUpload, setFileUpload] = useState(null);
const [patientNote, setPatientNote] = useState('');
const [patientSauvegardes, setPatientSauvegardes] = useState([]);


// Récupération des patients du médecin
const fetchPatients = async (medecinId) => {
  try {
    // Récupérer les patients privés du médecin
    const privateQuery = query(
      collection(db, 'patients'), 
      where("medecinId", "==", medecinId),
      where("isPrivate", "==", true)
    );
    const privateSnapshot = await getDocs(privateQuery);
    const privatePatients = privateSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(), 
      source: 'private' 
    }));
    
    // Récupérer les patients de la structure (si affilié)
    let structurePatients = [];
    if (medecinData?.structureId) {
      const structureQuery = query(
        collection(db, 'patients'), 
        where("structureId", "==", medecinData.structureId)
      );
      const structureSnapshot = await getDocs(structureQuery);
      structurePatients = structureSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        source: 'structure' 
      }));
    }
    
    // Combiner les deux listes et éliminer les doublons par ID
    const allPatients = [...privatePatients];
    structurePatients.forEach(patient => {
      if (!allPatients.some(p => p.id === patient.id)) {
        allPatients.push(patient);
      }
    });
    
    setPatients(allPatients);
    
    // Récupérer les fichiers et notes pour chaque patient
    allPatients.forEach(patient => {
      fetchPatientFiles(patient.id);
      fetchPatientNotes(patient.id);
    });
    
  } catch (error) {
    setMessage(`Erreur lors du chargement des patients: ${error.message}`);
  }
};


// Récupération des fichiers d'un patient
const fetchPatientFiles = async (patientId) => {
  try {
    const filesRef = ref(storage, `patients/${patientId}/files`);
    const filesList = await listAll(filesRef);
    
    const filesData = await Promise.all(
      filesList.items.map(async (fileRef) => {
        const url = await getDownloadURL(fileRef);
        return {
          name: fileRef.name,
          url,
          path: fileRef.fullPath,
          createdAt: new Date().toISOString()
        };
      })
    );
    
    setPatientFiles(prev => ({
      ...prev,
      [patientId]: filesData
    }));
    
  } catch (error) {
    // Si le dossier n'existe pas encore, c'est normal
    if (!error.code === 'storage/object-not-found') {
      console.error(`Erreur lors du chargement des fichiers du patient ${patientId}:`, error);
    }
  }
};

// Récupération des notes d'un patient
const fetchPatientNotes = async (patientId) => {
  try {
    const notesRef = collection(db, 'patients', patientId, 'notes');
    const notesSnapshot = await getDocs(notesRef);
    
    const notesData = notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setPatientNotes(prev => ({
      ...prev,
      [patientId]: notesData
    }));
    
  } catch (error) {
    console.error(`Erreur lors du chargement des notes du patient ${patientId}:`, error);
  }
};


// Gestion du formulaire de nouveau patient
const handleNewPatientChange = (e) => {
  const { name, value, type, checked } = e.target;
  setNewPatientForm(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};

// Ajout d'un nouveau patient
const handleAddPatient = async (e) => {
  e.preventDefault();
  
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    // Validation des données minimales
    if (!newPatientForm.prenom || !newPatientForm.nom) {
      setMessage('Veuillez saisir au moins le nom et le prénom du patient.');
      return;
    }
    
    // Préparation des données du patient
    const patientData = {
      ...newPatientForm,
      medecinId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Si le patient est affilié à la structure
    if (!newPatientForm.isPrivate && medecinData?.structureId) {
      patientData.structureId = medecinData.structureId;
    }
    
    // Ajout du patient dans Firestore
    const patientRef = await addDoc(collection(db, 'patients'), patientData);
    
    // Mise à jour de la liste des patients
    const newPatient = {
      id: patientRef.id,
      ...patientData,
      source: newPatientForm.isPrivate ? 'private' : 'structure'
    };
    
    setPatients(prev => [...prev, newPatient]);
    
    // Réinitialisation du formulaire
    setNewPatientForm({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      dateNaissance: '',
      adresse: '',
      assurance: '',
      notes: '',
      isPrivate: true
    });
    
    setShowNewPatientModal(false);
    setMessage('Patient ajouté avec succès.');
    
  } catch (error) {
    setMessage(`Erreur lors de l'ajout du patient: ${error.message}`);
  }
};

// Sélection d'un patient pour la gestion des sauvegardes
const handleSelectPatient = (patient) => {
  setSelectedPatient(patient);
  fetchPatientFiles(patient.id);
  fetchPatientNotes(patient.id);
};

// Téléchargement d'un fichier pour un patient
const handleFileUpload = async () => {
  if (!fileUpload || !selectedPatient) return;
  
  try {
    const fileRef = ref(storage, `patients/${selectedPatient.id}/files/${fileUpload.name}`);
    await uploadBytes(fileRef, fileUpload);
    
    // Mise à jour de la liste des fichiers
    fetchPatientFiles(selectedPatient.id);
    
    setFileUpload(null);
    setMessage('Fichier téléchargé avec succès.');
    
  } catch (error) {
    setMessage(`Erreur lors du téléchargement du fichier: ${error.message}`);
  }
};

// Ajout d'une note pour un patient
const handleAddNote = async () => {
  if (!patientNote || !selectedPatient) return;
  
  try {
    const noteData = {
      content: patientNote,
      createdAt: serverTimestamp(),
      medecinId: auth.currentUser.uid,
      medecinNom: `Dr. ${medecinData.prenom} ${medecinData.nom}`
    };
    
    await addDoc(collection(db, 'patients', selectedPatient.id, 'notes'), noteData);
    
    // Mise à jour de la liste des notes
    fetchPatientNotes(selectedPatient.id);
    
    setPatientNote('');
    setMessage('Note ajoutée avec succès.');
    
  } catch (error) {
    setMessage(`Erreur lors de l'ajout de la note: ${error.message}`);
  }
};

// Suppression d'un fichier
const handleDeleteFile = async (filePath) => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    
    // Mise à jour de la liste des fichiers
    fetchPatientFiles(selectedPatient.id);
    
    setMessage('Fichier supprimé avec succès.');
    
  } catch (error) {
    setMessage(`Erreur lors de la suppression du fichier: ${error.message}`);
  }
};



  // Détection du redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSaveAvailabilities = () => {
    // Logique pour sauvegarder les disponibilités
    setMessage("Vos disponibilités ont été mises à jour avec succès");
    setEditingAvailabilities(false);
  };

  // Fonction pour formater une date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
      
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour convertir une date en format YYYY-MM-DD
  const formatDateForFilter = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Récupération des données du médecin connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const medecinDocRef = doc(db, 'medecins', user.uid);
          const medecinDocSnap = await getDoc(medecinDocRef);
          
          if (medecinDocSnap.exists()) {
            const data = medecinDocSnap.data();
            setMedecinData(data);
            
            // Ne pas définir le formulaire ici, car il sera initialisé lors du passage en mode édition
            
            if (data.structureId) {
              const structureDocRef = doc(db, 'structures', data.structureId);
              const structureDocSnap = await getDoc(structureDocRef);
              
              if (structureDocSnap.exists()) {
                setStructureData(structureDocSnap.data());
              }
            }
            
            fetchRendezvous(user.uid);
            fetchAffiliationRequests();
            
            setLoading(false);
          } else {
            setError("Aucune donnée trouvée pour ce médecin");
            setLoading(false);
          }
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      } else {
        navigate('/auth');
      }
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);

  // Vérification du statut d'affiliation
  useEffect(() => {
    const fetchAffiliationStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const medecinDoc = await getDoc(doc(db, 'medecins', currentUser.uid));
        if (medecinDoc.exists() && medecinDoc.data().structureId) {
          const structureDoc = await getDoc(doc(db, 'structures', medecinDoc.data().structureId));
          if (structureDoc.exists()) {
            setAffiliationStatus({
              status: 'affiliated',
              structureId: medecinDoc.data().structureId,
              structureName: structureDoc.data().nom,
              structureData: structureDoc.data()
            });
          }
        } else {
          const requestsQuery = query(
            collection(db, 'affiliationRequests'),
            where('medecinId', '==', currentUser.uid)
          );
          const requestsSnapshot = await getDocs(requestsQuery);
          const requestsData = [];
          
          for (const docSnap of requestsSnapshot.docs) {
            const requestData = docSnap.data();
            if (requestData.structureId) {
              const structureDoc = await getDoc(doc(db, 'structures', requestData.structureId));
              if (structureDoc.exists()) {
                requestsData.push({
                  id: docSnap.id,
                  ...requestData,
                  structureName: structureDoc.data().nom,
                  structureData: structureDoc.data()
                });
              }
            }
          }
          
          setAffiliationRequests(requestsData);
          
          if (requestsData.length === 0) {
            setAffiliationStatus({ status: 'none' });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du statut d\'affiliation:', error);
      }
    };
    
    fetchAffiliationStatus();
  }, [auth]);

  // Récupération des rendez-vous du médecin
  const fetchRendezvous = async (medecinId) => {
    try {
      const q = query(collection(db, 'rendezvous'), where("medecinId", "==", medecinId));
      const querySnapshot = await getDocs(q);
      const rdvData = [];
      const countByDate = {};
      
      for (const rdvDoc of querySnapshot.docs) {
        const rdv = { id: rdvDoc.id, ...rdvDoc.data() };
        
        if (rdv.patientId) {
          const patientDocRef = doc(db, 'patients', rdv.patientId);
          const patientDocSnap = await getDoc(patientDocRef);
          
          if (patientDocSnap.exists()) {
            const patientData = patientDocSnap.data();
            rdv.patientDetails = patientData;
            
            setPatients(prevPatients => {
              if (!prevPatients.some(p => p.id === rdv.patientId)) {
                return [...prevPatients, { id: rdv.patientId, ...patientData }];
              }
              return prevPatients;
            });
          }
        }
        
        // Compter les rendez-vous par date
        if (rdv.date) {
          if (countByDate[rdv.date]) {
            countByDate[rdv.date]++;
          } else {
            countByDate[rdv.date] = 1;
          }
        }
        
        rdvData.push(rdv);
      }
      
      rdvData.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.heure.localeCompare(b.heure);
      });
      
      setRendezvous(rdvData);
      setRdvCountByDate(countByDate);
    } catch (error) {
      setMessage(`Erreur lors du chargement des rendez-vous: ${error.message}`);
    }
  };

  // Récupération des structures disponibles
  const fetchAvailableStructures = async () => {
    try {
      setLoading(true);
      const structuresRef = collection(db, 'structures');
      const structuresSnapshot = await getDocs(structuresRef);
      
      const structuresData = [];
      structuresSnapshot.forEach(doc => {
        structuresData.push({ id: doc.id, ...doc.data() });
      });
      
      setStructures(structuresData);
      setLoading(false);
    } catch (error) {
      setMessage(`Erreur lors de la récupération des structures: ${error.message}`);
      setLoading(false);
    }
  };

  // Récupération des demandes d'affiliation
  const fetchAffiliationRequests = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const requestsRef = collection(db, 'affiliationRequests');
      const q = query(requestsRef, where('medecinId', '==', user.uid));
      const requestsSnapshot = await getDocs(q);
      
      const requestsData = [];
      const pendingIds = [];
      
      for (const requestDoc of requestsSnapshot.docs) {
        const requestData = { id: requestDoc.id, ...requestDoc.data() };
        
        if (requestData.structureId) {
          const structureDoc = await getDoc(doc(db, 'structures', requestData.structureId));
          if (structureDoc.exists()) {
            requestData.structureName = structureDoc.data().nom;
          }
        }
        
        requestsData.push(requestData);
        
        if (requestData.status === 'pending') {
          pendingIds.push(requestData.structureId);
        }
      }
      
      setAffiliationRequests(requestsData);
      setPendingRequests(pendingIds);
    } catch (error) {
      setMessage(`Erreur lors de la récupération des demandes d'affiliation: ${error.message}`);
    }
  };

  // Envoi d'une demande d'affiliation
  const sendAffiliationRequest = async (structureId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      if (pendingRequests.includes(structureId)) {
        setMessage("Une demande d'affiliation est déjà en cours pour cette structure.");
        return;
      }
      
      const affiliationRequest = {
        medecinId: user.uid,
        structureId: structureId,
        status: 'pending',
        createdAt: serverTimestamp(),
        medecinNom: `${medecinData.prenom} ${medecinData.nom}`,
        medecinSpecialite: medecinData.specialite
      };
      
      await addDoc(collection(db, 'affiliationRequests'), affiliationRequest);
      setPendingRequests([...pendingRequests, structureId]);
      fetchAffiliationRequests();
      
      setMessage("Demande d'affiliation envoyée avec succès.");
    } catch (error) {
      setMessage(`Erreur lors de l'envoi de la demande d'affiliation: ${error.message}`);
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      setMessage(`Erreur lors de la déconnexion: ${error.message}`);
    }
  };

  // Fonction pour convertir les disponibilités du format array au format objet
  const convertDisponibilitesArrayToObject = (disponibilitesArray) => {
    const disponibilitesObj = {
      lundi: { actif: false, debut: '08:00', fin: '18:00' },
      mardi: { actif: false, debut: '08:00', fin: '18:00' },
      mercredi: { actif: false, debut: '08:00', fin: '18:00' },
      jeudi: { actif: false, debut: '08:00', fin: '18:00' },
      vendredi: { actif: false, debut: '08:00', fin: '18:00' },
      samedi: { actif: false, debut: '08:00', fin: '18:00' },
      dimanche: { actif: false, debut: '08:00', fin: '18:00' }
    };
    
    if (Array.isArray(disponibilitesArray)) {
      disponibilitesArray.forEach(dispo => {
        const jourLower = dispo.jour.toLowerCase();
        if (disponibilitesObj.hasOwnProperty(jourLower)) {
          disponibilitesObj[jourLower] = {
            actif: true,
            debut: dispo.heureDebut,
            fin: dispo.heureFin
          };
        }
      });
    }
    
    return disponibilitesObj;
  };

  // Fonction pour convertir les disponibilités du format objet au format array
  const convertDisponibilitesObjectToArray = (disponibilitesObj) => {
    const disponibilitesArray = [];
    
    if (disponibilitesObj && typeof disponibilitesObj === 'object') {
      Object.entries(disponibilitesObj).forEach(([jour, valeur]) => {
        if (valeur.actif) {
          disponibilitesArray.push({
            jour: jour.charAt(0).toUpperCase() + jour.slice(1),
            heureDebut: valeur.debut,
            heureFin: valeur.fin
          });
        }
      });
    }
    
    return disponibilitesArray;
  };

  // Activation du mode édition
  const handleEditMode = () => {
    if (!editMode) {
      // Passage en mode édition
      const formData = { ...medecinData };
      
      // Convertir les disponibilités si elles sont au format tableau
      if (Array.isArray(formData.disponibilites)) {
        formData.disponibilites = convertDisponibilitesArrayToObject(formData.disponibilites);
      } else if (!formData.disponibilites) {
        // Si pas de disponibilités, initialiser avec des valeurs par défaut
        formData.disponibilites = {
          lundi: { actif: false, debut: '08:00', fin: '18:00' },
          mardi: { actif: false, debut: '08:00', fin: '18:00' },
          mercredi: { actif: false, debut: '08:00', fin: '18:00' },
          jeudi: { actif: false, debut: '08:00', fin: '18:00' },
          vendredi: { actif: false, debut: '08:00', fin: '18:00' },
          samedi: { actif: false, debut: '08:00', fin: '18:00' },
          dimanche: { actif: false, debut: '08:00', fin: '18:00' }
        };
      }
      
      setForm(formData);
    } else {
      // Annulation des modifications
      setForm({});
    }
    
    setEditMode(!editMode);
  };

  // Mise à jour du profil médecin
  const handleUpdate = async () => {
    try {
      const user = auth.currentUser;
      
      // Convertir les disponibilités du format objet au format tableau pour l'enregistrement
      const disponibilitesAEnregistrer = convertDisponibilitesObjectToArray(form.disponibilites);
      
      const updateData = {
        ...form,
        disponibilites: disponibilitesAEnregistrer,
        updatedAt: serverTimestamp()
      };
      
      // Supprimer les champs qui ne doivent pas être mis à jour
      delete updateData.createdAt;
      delete updateData.structureId;
      
      await updateDoc(doc(db, 'medecins', user.uid), updateData);
      setMessage('Informations mises à jour avec succès.');
      setEditMode(false);
      
      // Mettre à jour les données du médecin dans l'état local
      setMedecinData({
        ...medecinData,
        ...form,
        disponibilites: disponibilitesAEnregistrer
      });
    } catch (error) {
      setMessage(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  // Changement de mot de passe
  const handlePasswordChange = async () => {
    try {
      if (newPassword.length < 6) {
        setMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
      setMessage('Mot de passe mis à jour avec succès.');
      setNewPassword('');
    } catch (error) {
      setMessage(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
    }
  };

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestion des disponibilités
  const handleDisponibiliteChange = (jour, field, value) => {
    setForm(prev => ({
      ...prev,
      disponibilites: {
        ...prev.disponibilites,
        [jour]: {
          ...prev.disponibilites[jour],
          [field]: field === 'actif' ? !prev.disponibilites[jour].actif : value
        }
      }
    }));
  };

  // Gestion des assurances
  const handleAssuranceChange = (e) => {
    const { value, checked } = e.target;
    
    setForm(prev => {
      const updatedAssurances = [...(prev.assurances || [])];
      
      if (checked) {
        if (!updatedAssurances.includes(value)) {
          updatedAssurances.push(value);
        }
      } else {
        const index = updatedAssurances.indexOf(value);
        if (index > -1) {
          updatedAssurances.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        assurances: updatedAssurances
      };
    });
  };

  // Gestion du clic sur une date du calendrier
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCalendarView(false);
    setForm({...form, filtreDate: formatDateForFilter(date)});
  };

  // Retour à la vue calendrier
  const handleBackToCalendar = () => {
    setCalendarView(true);
  };

  // Animation variants pour les transitions
  const pageTransition = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.3 } }
  };
  
  const itemTransition = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader">
          <svg className="circular" viewBox="25 25 50 50">
            <circle className="path" cx="50" cy="50" r="20" fill="none" strokeWidth="3" strokeMiterlimit="10"/>
          </svg>
          <p className="mt-3">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h4>Une erreur est survenue</h4>
          <p>{error}</p>
          <button className="btn-primary" onClick={handleLogout}>
            Retour à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  // Fonction pour afficher le contenu du calendrier
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDateForFilter(date);
      const count = rdvCountByDate[dateStr];
      
      if (count) {
        return (
          <div className="calendar-rdv-count">
            <span>{count}</span>
          </div>
        );
      }
    }
    return null;
  };

  // Fonction pour déterminer les classes CSS du calendrier
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDateForFilter(date);
      return rdvCountByDate[dateStr] ? 'has-rdv' : null;
    }
  };

 

  // Rendu desktop original
  return (
    <div className={`dashboard-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-text"> 
Cabinet d'Ophtalmologie
Chirurgie Oculaire <br /> 

<span>Dr Mar Ndiaye</span>

</span>
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {medecinData?.prenom?.charAt(0)}{medecinData?.nom?.charAt(0)}
          </div>
          <div className="user-info">
            <h4>Dr. {medecinData?.prenom} {medecinData?.nom}</h4>
            <p>{medecinData?.specialite}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === 'info' ? 'active' : ''}>
              <button onClick={() => setActiveTab('info')}>
                <i className="bi bi-person-circle"></i>
                <span>Mon profil</span>
              </button>
            </li>
            <li className={activeTab === 'rendezvous' ? 'active' : ''}>
              <button onClick={() => setActiveTab('rendezvous')}>
                <i className="bi bi-calendar-check"></i>
                <span>Rendez-vous</span>
                {rendezvous.length > 0 && (
                  <span className="nav-badge">{rendezvous.length}</span>
                )}
              </button>
            </li>
            <li className={activeTab === 'patients' ? 'active' : ''}>
              <button onClick={() => setActiveTab('patients')}>
                <i className="bi bi-people"></i>
                <span>Patients</span>
                {patients.length > 0 && (
                  <span className="nav-badge">{patients.length}</span>
                )}
              </button>
            </li>
            <li className={activeTab === 'structures' ? 'active' : ''}>
              <button onClick={() => {
                setActiveTab('structures');
                fetchAvailableStructures();
              }}>
                <i className="bi bi-building"></i>
                <span>Structures</span>
              </button>
            </li>
            <li className={activeTab === 'password' ? 'active' : ''}>
              <button onClick={() => setActiveTab('password')}>
                <i className="bi bi-shield-lock"></i>
                <span>Sécurité</span>
              </button>
            </li>
            <li className={activeTab === 'sauvegardes' ? 'active' : ''}>
  <button onClick={() => setActiveTab('sauvegardes')}>
    <i className="bi bi-archive"></i>
    <span>Sauvegardes</span>
  </button>
</li>

          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            {activeTab === 'info' && <h1>Mon profil médical</h1>}
            {activeTab === 'rendezvous' && <h1>Gestion des rendez-vous</h1>}
            {activeTab === 'patients' && <h1>Liste des patients</h1>}
            {activeTab === 'structures' && <h1>Structures médicales</h1>}
            {activeTab === 'password' && <h1>Sécurité du compte</h1>}
          </div>
          <div className="header-actions">
            {activeTab === 'info' && (
              <button 
                className={`btn-action ${editMode ? 'active' : ''}`} 
                onClick={handleEditMode}
              >
                {editMode ? (
                  <>
                    <i className="bi bi-x-circle"></i>
                    <span>Annuler</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-pencil"></i>
                    <span>Modifier</span>
                  </>
                )}
              </button>
            )}
            {activeTab === 'rendezvous' && !calendarView && (
              <button 
                className="btn-action"
                onClick={handleBackToCalendar}
              >
                <i className="bi bi-calendar3"></i>
                <span>Retour au calendrier</span>
              </button>
            )}
            {activeTab === 'patients' && (
              <div className="search-container">
                <i className="bi bi-search"></i>
                <input 
                  type="text" 
                  placeholder="Rechercher un patient..."
                  value={form.searchPatient || ''}
                  onChange={(e) => setForm({...form, searchPatient: e.target.value})}
                />
              </div>
            )}
          </div>
        </header>

        <div className="content-body">
          <AnimatePresence mode="wait">
            {/* Onglet Informations */}
            {activeTab === 'info' && (
              <motion.div 
                className="content-panel"
                key="info"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {editMode ? (
                  <form className="edit-form">
                    <div className="card">
                      <div className="card-header">
                        <h2>Informations personnelles</h2>
                      </div>
                      <div className="card-body">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Prénom</label>
                            <input
                              type="text"
                              name="prenom"
                              value={form.prenom || ''}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="form-group">
                            <label>Nom</label>
                            <input
                              type="text"
                              name="nom"
                              value={form.nom || ''}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              name="email"
                              value={form.email || ''}
                              disabled
                              className="disabled"
                            />
                            <small>L'email ne peut pas être modifié</small>
                          </div>
                          <div className="form-group">
                            <label>Téléphone</label>
                            <input
                              type="tel"
                              name="telephone"
                              value={form.telephone || ''}
                              onChange={handleChange}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Spécialité</label>
                          <select
                            name="specialite"
                            value={form.specialite || ''}
                            onChange={handleChange}
                          >
                            <option value="">Sélectionner une spécialité</option>
                            {["Généraliste", "Cardiologue", "Dermatologue", "Pédiatre", "Gynécologue", "Ophtalmologue", "Autre"].map(spec => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                          {form.specialite === 'Autre' && (
                            <input
                              type="text"
                              className="mt-2"
                              name="specialiteAutre"
                              placeholder="Précisez votre spécialité"
                              value={form.specialiteAutre || ''}
                              onChange={handleChange}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card mt-4">
                      <div className="card-header">
                        <h2>Disponibilités</h2>
                      </div>
                      <div className="card-body">
                        <div className="availability-table">
                          <div className="table-header">
                            <div>Jour</div>
                            <div>Disponible</div>
                            <div>Début</div>
                            <div>Fin</div>
                          </div>
                          {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map(jour => {
                            const disponibilites = form.disponibilites || {};
                            const jourDisponibilite = disponibilites[jour] || { actif: false, debut: '08:00', fin: '18:00' };
                            
                            return (
                              <div className="table-row" key={jour}>
                                <div className="day">{jour.charAt(0).toUpperCase() + jour.slice(1)}</div>
                                <div className="active">
                                  <label className="toggle">
                                    <input
                                      type="checkbox"
                                      checked={jourDisponibilite.actif || false}
                                      onChange={() => handleDisponibiliteChange(jour, 'actif')}
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                                <div className="time">
                                  <input
                                    type="time"
                                    value={jourDisponibilite.debut || '08:00'}
                                    onChange={(e) => handleDisponibiliteChange(jour, 'debut', e.target.value)}
                                    disabled={!jourDisponibilite.actif}
                                  />
                                </div>
                                <div className="time">
                                  <input
                                    type="time"
                                    value={jourDisponibilite.fin || '18:00'}
                                    onChange={(e) => handleDisponibiliteChange(jour, 'fin', e.target.value)}
                                    disabled={!jourDisponibilite.actif}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="card mt-4">
                      <div className="card-header">
                        <h2>Assurances acceptées</h2>
                      </div>
                      <div className="card-body">
                      <div className="insurance-options">
                          {["CNAM", "CNSS", "CNRPS", "Assurance privée", "Autre"].map(assurance => (
                            <label className="checkbox-container" key={assurance}>
                              <input
                                type="checkbox"
                                value={assurance}
                                checked={(form.assurances || []).includes(assurance)}
                                onChange={handleAssuranceChange}
                              />
                              <span className="checkmark"></span>
                              {assurance}
                            </label>
                          ))}
                        </div>
                        {(form.assurances || []).includes('Autre') && (
                          <input
                            type="text"
                            className="mt-2"
                            name="assuranceAutre"
                            placeholder="Précisez les autres assurances"
                            value={form.assuranceAutre || ''}
                            onChange={handleChange}
                          />
                        )}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn-save" onClick={handleUpdate}>
                        <i className="bi bi-check-circle"></i>
                        Enregistrer les modifications
                      </button>
                      <button type="button" className="btn-cancel" onClick={handleEditMode}>
                        <i className="bi bi-x-circle"></i>
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-view">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h2>Informations personnelles</h2>
                      </div>
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <p><strong>Prénom:</strong> {medecinData?.prenom}</p>
                            <p><strong>Nom:</strong> {medecinData?.nom}</p>
                          </div>
                          <div className="col-md-6">
                            <p><strong>Email:</strong> {medecinData?.email}</p>
                            <p><strong>Téléphone:</strong> {medecinData?.telephone || 'Non spécifié'}</p>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <p><strong>Spécialité:</strong> {medecinData?.specialite} {medecinData?.specialiteAutre ? `(${medecinData.specialiteAutre})` : ''}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {structureData && (
                      <div className="card mb-4">
                        <div className="card-header">
                          <h2>Structure d'affiliation</h2>
                        </div>
                        <div className="card-body">
                          <motion.div 
                            className="structure-card-large"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.3 }}
                          >
                            <div className="structure-logo">
                              <i className="bi bi-building"></i>
                            </div>
                            <div className="structure-content">
                              <h3>{structureData.nom}</h3>
                              <div className="structure-details">
                                <div className="detail-item">
                                  <i className="bi bi-geo-alt"></i>
                                  <span>{structureData.adresse}</span>
                                </div>
                                <div className="detail-item">
                                  <i className="bi bi-telephone"></i>
                                  <span>{structureData.telephone}</span>
                                </div>
                                <div className="detail-item">
                                  <i className="bi bi-envelope"></i>
                                  <span>{structureData.email}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    )}

                    <div className="card mb-4">
                      <div className="card-header">
                        <h2>Disponibilités</h2>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Jour</th>
                                <th>Disponible</th>
                                <th>Horaires</th>
                              </tr>
                            </thead>
                            <tbody>
                              {["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map(jour => {
                                let disponible = false;
                                let horaires = "Non disponible";
                                
                                if (Array.isArray(medecinData?.disponibilites)) {
                                  const jourDisponibilite = medecinData.disponibilites.find(
                                    d => d.jour.toLowerCase() === jour.toLowerCase()
                                  );
                                  
                                  if (jourDisponibilite) {
                                    disponible = true;
                                    horaires = `${jourDisponibilite.heureDebut} - ${jourDisponibilite.heureFin}`;
                                  }
                                } else if (medecinData?.disponibilites && medecinData.disponibilites[jour]) {
                                  disponible = medecinData.disponibilites[jour].actif;
                                  if (disponible) {
                                    horaires = `${medecinData.disponibilites[jour].debut} - ${medecinData.disponibilites[jour].fin}`;
                                  }
                                }
                                
                                return (
                                  <motion.tr 
                                    key={jour}
                                    variants={itemTransition}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    transition={{ delay: 0.1 }}
                                  >
                                    <td className="fw-bold">{jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                                    <td>
                                      <span className={`badge ${disponible ? 'bg-success' : 'bg-secondary'}`}>
                                        {disponible ? 'Oui' : 'Non'}
                                      </span>
                                    </td>
                                    <td>{horaires}</td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h2>Assurances acceptées</h2>
                      </div>
                      <div className="card-body">
                        {medecinData?.assurances && medecinData.assurances.length > 0 ? (
                          <div className="insurance-tags">
                            {medecinData.assurances.map((assurance, index) => (
                              <motion.span 
                                key={assurance} 
                                className="insurance-tag"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(67, 97, 238, 0.4)' }}
                                transition={{ delay: 0.4 + index * 0.05 }}
                              >
                                {assurance}
                              </motion.span>
                            ))}
                            {medecinData.assuranceAutre && (
                              <motion.span 
                                className="insurance-tag"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(67, 97, 238, 0.4)' }}
                                transition={{ delay: 0.4 + medecinData.assurances.length * 0.05 }}
                              >
                                {medecinData.assuranceAutre}
                              </motion.span>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted">Aucune assurance spécifiée</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Onglet Rendez-vous */}
            {activeTab === 'rendezvous' && (
              <motion.div 
                className="content-panel"
                key="rendezvous"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {calendarView ? (
                  <div className="calendar-view">
                    <div className="card">
                      <div className="card-header">
                        <h2>Calendrier des rendez-vous</h2>
                        <p className="subtitle">Cliquez sur une date pour voir les rendez-vous</p>
                      </div>
                      <div className="card-body">
                        <div className="calendar-container">
                          <Calendar 
                            onChange={handleDateChange}
                            value={selectedDate}
                            tileContent={tileContent}
                            tileClassName={tileClassName}
                            locale="fr-FR"
                          />
                        </div>
                        <div className="calendar-legend">
                          <div className="legend-item">
                            <div className="legend-color has-rdv"></div>
                            <span>Rendez-vous programmés</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-color"></div>
                            <span>Aucun rendez-vous</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card mt-4">
                      <div className="card-header">
                        <h2>Statistiques</h2>
                      </div>
                      <div className="card-body">
                        <div className="stats-grid">
                          <motion.div 
                            className="stat-card"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.1 }}
                          >
                            <div className="stat-icon">
                              <i className="bi bi-calendar-check"></i>
                            </div>
                            <div className="stat-content">
                              <h3>{rendezvous.length}</h3>
                              <p>Rendez-vous totaux</p>
                            </div>
                          </motion.div>

                          <motion.div 
                            className="stat-card"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.2 }}
                          >
                            <div className="stat-icon blue">
                              <i className="bi bi-calendar-week"></i>
                            </div>
                            <div className="stat-content">
                              <h3>{rendezvous.filter(rdv => new Date(rdv.date) >= new Date()).length}</h3>
                              <p>Rendez-vous à venir</p>
                            </div>
                          </motion.div>

                          <motion.div 
                            className="stat-card"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.3 }}
                          >
                            <div className="stat-icon green">
                              <i className="bi bi-people"></i>
                            </div>
                            <div className="stat-content">
                              <h3>{patients.length}</h3>
                              <p>Patients</p>
                            </div>
                          </motion.div>

                          <motion.div 
                            className="stat-card"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.4 }}
                          >
                            <div className="stat-icon purple">
                              <i className="bi bi-clock-history"></i>
                            </div>
                            <div className="stat-content">
                              <h3>{Object.keys(rdvCountByDate).length}</h3>
                              <p>Jours de consultation</p>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="appointments-view">
                    <div className="card">
                      <div className="card-header">
                        <h2>Rendez-vous du {formatDate(selectedDate)}</h2>
                        <div className="date-navigation">
                          <button 
                            className="btn-icon"
                            onClick={() => {
                              const prevDate = new Date(selectedDate);
                              prevDate.setDate(prevDate.getDate() - 1);
                              setSelectedDate(prevDate);
                              setForm({...form, filtreDate: formatDateForFilter(prevDate)});
                            }}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <span className="current-date">{formatDate(selectedDate)}</span>
                          <button 
                            className="btn-icon"
                            onClick={() => {
                              const nextDate = new Date(selectedDate);
                              nextDate.setDate(nextDate.getDate() + 1);
                              setSelectedDate(nextDate);
                              setForm({...form, filtreDate: formatDateForFilter(nextDate)});
                            }}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                      <div className="card-body">
                        {rendezvous
                          .filter(rdv => rdv.date === form.filtreDate)
                          .length > 0 ? (
                          <div className="appointments-timeline">
                            {rendezvous
                              .filter(rdv => rdv.date === form.filtreDate)
                              .map((rdv, index) => (
                                <motion.div 
                                  className={`appointment-card ${rdv.statut}`}
                                  key={rdv.id}
                                  variants={itemTransition}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover="hover"
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <div className="appointment-time">
                                    <div className="time">{rdv.heure}</div>
                                    <div className="duration">{rdv.duree || '30 min'}</div>
                                  </div>
                                  <div className="appointment-details">
                                    <div className="patient-info">
                                      {rdv.patientDetails ? (
                                        <>
                                          <div className="patient-avatar">
                                            {rdv.patientDetails.prenom.charAt(0)}{rdv.patientDetails.nom.charAt(0)}
                                          </div>
                                          <div className="patient-name">
                                            {rdv.patientDetails.prenom} {rdv.patientDetails.nom}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="patient-name">{rdv.patientNom || 'Patient inconnu'}</div>
                                      )}
                                    </div>
                                    <div className="appointment-reason">
                                      <i className="bi bi-clipboard-pulse"></i>
                                      {rdv.motif}
                                    </div>
                                  </div>
                                  <div className="appointment-status">
                                    <span className="status-badge">
                                      {rdv.statut === 'en attente' ? 'En attente' :
                                       rdv.statut === 'confirmé' ? 'Confirmé' :
                                       rdv.statut === 'en cours' ? 'En cours' :
                                       rdv.statut === 'terminé' ? 'Terminé' :
                                       rdv.statut === 'annulé' ? 'Annulé' : rdv.statut}
                                    </span>
                                    <div className="appointment-actions">
                                      <button className="btn-icon" title="Voir détails">
                                        <i className="bi bi-eye"></i>
                                      </button>
                                      <button className="btn-icon" title="Modifier">
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            <div className="empty-icon">
                              <i className="bi bi-calendar-x"></i>
                            </div>
                            <h4>Aucun rendez-vous</h4>
                            <p>Aucun rendez-vous n'est prévu pour cette date.</p>
                            <button className="btn-primary">
                              <i className="bi bi-plus-circle"></i>
                              Créer un rendez-vous
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Onglet Patients */}
            {activeTab === 'patients' && (
              <motion.div 
                className="content-panel"
                key="patients"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >

<div className="filter-controls">
  <div className="filter-buttons">
    <button 
      className={patientFilter === 'all' ? 'active' : ''} 
      onClick={() => setPatientFilter('all')}
    >
      Tous les patients
    </button>
    <button 
      className={patientFilter === 'private' ? 'active' : ''} 
      onClick={() => setPatientFilter('private')}
    >
      Patients privés
    </button>
    <button 
      className={patientFilter === 'structure' ? 'active' : ''} 
      onClick={() => setPatientFilter('structure')}
    >
      Patients structure
    </button>
  </div>
</div>

                <div className="card">
                  <div className="card-header">
                    <h2>Mes patients</h2>
                    <button className="btn-primary" onClick={() => setShowNewPatientModal(true)}>
  <i className="bi bi-person-plus"></i>
  <span>Ajouter un patient</span>
</button>

                  </div>
                  <div className="card-body">
                    {patients.length > 0 ? (
                      <div className="patients-grid">
                      {patients
                          .filter(patient => {
                            // Filtre par recherche
                            if (form.searchPatient) {
                              const searchTerm = form.searchPatient.toLowerCase();
                              const matchesSearch = 
                                patient.nom?.toLowerCase().includes(searchTerm) ||
                                patient.prenom?.toLowerCase().includes(searchTerm) ||
                                patient.email?.toLowerCase().includes(searchTerm) ||
                                patient.telephone?.includes(searchTerm);
                              
                              if (!matchesSearch) return false;
                            }
                            
                            // Filtre par type
                            if (patientFilter === 'private') {
                              return patient.source === 'private';
                            } else if (patientFilter === 'structure') {
                              return patient.source === 'structure';
                            }
                            
                            return true;
                          })
                          .map((patient, index) => {
                            // Trouver le dernier rendez-vous de ce patient
                            const patientRdvs = rendezvous.filter(rdv => rdv.patientId === patient.id);
                            const lastRdv = patientRdvs.length > 0 ? 
                              patientRdvs.reduce((latest, current) => {
                                return new Date(latest.date) > new Date(current.date) ? latest : current;
                              }) : null;
                            
                            return (
                              <motion.div 
                                className="patient-card"
                                key={patient.id}
                                variants={itemTransition}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                transition={{ delay: index * 0.05 }}
                              >
                                <div className="patient-header">
                                  <div className="patient-avatar">
                                    {patient.prenom?.charAt(0)}{patient.nom?.charAt(0)}
                                  </div>
                                  <div className="patient-name">
                                    <h4>{patient.prenom} {patient.nom}</h4>
                                    <span className="patient-age">
                                      {patient.dateNaissance ? `Né(e) le ${formatDate(patient.dateNaissance)}` : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="patient-contact">
                                  <div className="contact-item">
                                    <i className="bi bi-telephone"></i>
                                    <span>{patient.telephone}</span>
                                  </div>
                                  <div className="contact-item">
                                    <i className="bi bi-envelope"></i>
                                    <span>{patient.email}</span>
                                  </div>
                                </div>
                                <div className="patient-visit">
                                  <div className="visit-label">Dernière visite</div>
                                  {lastRdv ? (
                                    <div className="visit-info">
                                      <div className="visit-date">{formatDate(lastRdv.date)}</div>
                                      <div className="visit-time">{lastRdv.heure}</div>
                                    </div>
                                  ) : (
                                    <div className="no-visit">Aucune visite</div>
                                  )}
                                </div>
                                <div className="patient-actions">
                                  <button 
                                    className="btn-action primary"
                                    onClick={() => navigate(`/patient/${patient.id}`)}
                                  >
                                    <i className="bi bi-folder"></i>
                                    Dossier
                                  </button>
                                  <button 
                                    className="btn-action secondary"
                                    onClick={() => navigate(`/nouveau-rdv/${patient.id}`)}
                                  >
                                    <i className="bi bi-calendar-plus"></i>
                                    Nouveau RDV
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="bi bi-people"></i>
                        </div>
                        <h4>Aucun patient trouvé</h4>
                        <p>Vous n'avez pas encore de patients enregistrés.</p>
                        <button className="btn-primary">
                          <i className="bi bi-person-plus"></i>
                          Ajouter un patient
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Onglet Structures */}
            {activeTab === 'structures' && (
              <motion.div 
                className="content-panel"
                key="structures"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {structureData && (
                  <div className="card mb-4">
                    <div className="card-header">
                      <h2>Ma structure actuelle</h2>
                    </div>
                    <div className="card-body">
                      <motion.div 
                        className="structure-card-large active"
                        variants={itemTransition}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: 0.1 }}
                      >
                        <div className="structure-logo">
                          <i className="bi bi-building-check"></i>
                        </div>
                        <div className="structure-content">
                          <h3>{structureData.nom}</h3>
                          <div className="structure-details">
                            <div className="detail-item">
                              <i className="bi bi-geo-alt"></i>
                              <span>{structureData.adresse}</span>
                            </div>
                            <div className="detail-item">
                              <i className="bi bi-telephone"></i>
                              <span>{structureData.telephone}</span>
                            </div>
                            <div className="detail-item">
                              <i className="bi bi-envelope"></i>
                              <span>{structureData.email}</span>
                            </div>
                            {structureData.siteWeb && (
                              <div className="detail-item">
                                <i className="bi bi-globe"></i>
                                <span>{structureData.siteWeb}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                <div className="card mb-4">
                  <div className="card-header">
                    <h2>Mes demandes d'affiliation</h2>
                  </div>
                  <div className="card-body">
                    {affiliationRequests.length > 0 ? (
                      <div className="requests-list">
                        {affiliationRequests.map((request, index) => (
                          <motion.div 
                            className={`request-card ${request.status}`}
                            key={request.id}
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            <div className="request-structure">
                              {request.structureName || 'Structure inconnue'}
                            </div>
                            <div className="request-date">
                              <i className="bi bi-calendar-date"></i>
                              {request.createdAt ? formatDate(request.createdAt) : 'Date inconnue'}
                            </div>
                            <div className="request-status">
                              <span className="status-indicator"></span>
                              {request.status === 'pending' ? 'En attente' :
                               request.status === 'approved' ? 'Approuvée' :
                               request.status === 'rejected' ? 'Rejetée' : request.status}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data">Vous n'avez pas de demandes d'affiliation en cours.</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Structures disponibles</h2>
                  </div>
                  <div className="card-body">
                    {loading ? (
                      <div className="loading-indicator">
                        <div className="spinner"></div>
                        <p>Chargement des structures...</p>
                      </div>
                    ) : structures.length > 0 ? (
                      <div className="structures-grid">
                        {structures.map((structure, index) => (
                          <motion.div 
                            className="structure-card"
                            key={structure.id}
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: 0.3 + index * 0.05 }}
                          >
                            <div className="structure-header">
                              <h5>{structure.nom}</h5>
                            </div>
                            <div className="structure-details">
                              <div className="detail-item">
                                <i className="bi bi-geo-alt"></i>
                                <span>{structure.adresse}</span>
                              </div>
                              <div className="detail-item">
                                <i className="bi bi-telephone"></i>
                                <span>{structure.telephone}</span>
                              </div>
                              <div className="detail-item">
                                <i className="bi bi-envelope"></i>
                                <span>{structure.email}</span>
                              </div>
                            </div>
                            <div className="structure-action">
                              {pendingRequests.includes(structure.id) ? (
                                <button className="btn-pending" disabled>
                                  <i className="bi bi-hourglass-split"></i>
                                  Demande en cours
                                </button>
                              ) : medecinData?.structureId === structure.id ? (
                                <button className="btn-current" disabled>
                                  <i className="bi bi-check-circle"></i>
                                  Structure actuelle
                                </button>
                              ) : (
                                <button 
                                  className="btn-affiliate"
                                  onClick={() => sendAffiliationRequest(structure.id)}
                                >
                                  <i className="bi bi-building-add"></i>
                                  Demander l'affiliation
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      ) : (
                      <div className="empty-state">
                        <div className="empty-icon">
                          <i className="bi bi-buildings"></i>
                        </div>
                        <h4>Aucune structure disponible</h4>
                        <p>Il n'y a pas de structures médicales disponibles pour le moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'password' && (
              <motion.div 
                className="content-panel"
                key="password"
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="card">
                  <div className="card-header">
                    <h2>Changer votre mot de passe</h2>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Nouveau mot de passe</label>
                      <div className="password-input">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Entrez votre nouveau mot de passe"
                        />
                        <i className="bi bi-shield-lock"></i>
                      </div>
                      <small>Le mot de passe doit contenir au moins 6 caractères</small>
                    </div>
                    <button 
                      className="btn-save mt-3"
                      onClick={handlePasswordChange}
                      disabled={newPassword.length < 6}
                    >
                      <i className="bi bi-check-circle"></i>
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>

                <div className="card mt-4">
                  <div className="card-header">
                    <h2>Sécurité du compte</h2>
                  </div>
                  <div className="card-body">
                    <div className="security-tips">
                      <div className="tip-item">
                        <div className="tip-icon">
                          <i className="bi bi-shield-check"></i>
                        </div>
                        <div className="tip-content">
                          <h4>Utilisez un mot de passe fort</h4>
                          <p>Combinez lettres majuscules et minuscules, chiffres et caractères spéciaux.</p>
                        </div>
                      </div>
                      <div className="tip-item">
                        <div className="tip-icon">
                          <i className="bi bi-fingerprint"></i>
                        </div>
                        <div className="tip-content">
                          <h4>Protégez vos informations de connexion</h4>
                          <p>Ne partagez jamais vos identifiants et déconnectez-vous après chaque session.</p>
                        </div>
                      </div>
                      <div className="tip-item">
                        <div className="tip-icon">
                          <i className="bi bi-clock-history"></i>
                        </div>
                        <div className="tip-content">
                          <h4>Changez régulièrement votre mot de passe</h4>
                          <p>Mettez à jour votre mot de passe tous les 3 mois pour plus de sécurité.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Onglet Sauvegardes */}
{activeTab === 'sauvegardes' && (
  <motion.div 
    className="content-panel"
    key="sauvegardes"
    variants={pageTransition}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    <div className="sauvegardes-layout">
      <div className="sauvegardes-sidebar">
        <div className="card">
          <div className="card-header">
            <h2>Patients</h2>
            <div className="search-container">
              <i className="bi bi-search"></i>
              <input 
                type="text" 
                placeholder="Rechercher un patient..."
                value={form.searchSauvegarde || ''}
                onChange={(e) => setForm({...form, searchSauvegarde: e.target.value})}
              />
            </div>
          </div>
          <div className="card-body">
            <div className="patients-list">
              {patients
                .filter(patient => {
                  if (!form.searchSauvegarde) return true;
                  const searchTerm = form.searchSauvegarde.toLowerCase();
                  return (
                    patient.nom?.toLowerCase().includes(searchTerm) ||
                    patient.prenom?.toLowerCase().includes(searchTerm)
                  );
                })
                .map(patient => (
                  <div 
                    key={patient.id} 
                    className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                    onClick={() => handleSelectPatient(patient)}
                  >
                    <div className="patient-avatar">
                      {patient.prenom?.charAt(0)}{patient.nom?.charAt(0)}
                    </div>
                    <div className="patient-info">
                      <div className="patient-name">{patient.prenom} {patient.nom}</div>
                      <div className="patient-type">
                        {patient.source === 'private' ? (
                          <span className="badge-private">Privé</span>
                        ) : (
                          <span className="badge-structure">Structure</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="sauvegardes-content">
        {selectedPatient ? (
          <>
            <div className="card mb-4">
              <div className="card-header">
                <h2>Dossier de {selectedPatient.prenom} {selectedPatient.nom}</h2>
                <div className="patient-badges">
                  {selectedPatient.source === 'private' ? (
                    <span className="badge-private">Patient privé</span>
                  ) : (
                    <span className="badge-structure">Patient structure</span>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="patient-details">
                  <div className="detail-row">
                    <div className="detail-label">Email:</div>
                    <div className="detail-value">{selectedPatient.email || 'Non spécifié'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Téléphone:</div>
                    <div className="detail-value">{selectedPatient.telephone || 'Non spécifié'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Date de naissance:</div>
                    <div className="detail-value">
                      {selectedPatient.dateNaissance ? formatDate(selectedPatient.dateNaissance) : 'Non spécifiée'}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Adresse:</div>
                    <div className="detail-value">{selectedPatient.adresse || 'Non spécifiée'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Assurance:</div>
                    <div className="detail-value">{selectedPatient.assurance || 'Non spécifiée'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-header">
                <h2>Fichiers</h2>
                <div className="file-upload">
                  <input 
                    type="file" 
                    id="file-upload" 
                    onChange={(e) => setFileUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-upload" className="btn-secondary">
                    <i className="bi bi-upload"></i>
                    <span>Sélectionner un fichier</span>
                  </label>
                  {fileUpload && (
                    <button 
                      className="btn-primary ml-2" 
                      onClick={handleFileUpload}
                    >
                      <i className="bi bi-check-circle"></i>
                      <span>Télécharger</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {patientFiles[selectedPatient.id]?.length > 0 ? (
                  <div className="files-list">
                    {patientFiles[selectedPatient.id].map((file, index) => (
                      <motion.div 
                        key={file.path} 
                        className="file-item"
                        variants={itemTransition}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="file-icon">
                          <i className="bi bi-file-earmark"></i>
                        </div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-date">Ajouté le {new Date(file.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                        <div className="file-actions">
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-icon"
                            title="Télécharger"
                          >
                            <i className="bi bi-download"></i>
                          </a>
                          <button 
                            className="btn-icon text-danger" 
                            title="Supprimer"
                            onClick={() => handleDeleteFile(file.path)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state small">
                    <div className="empty-icon">
                      <i className="bi bi-files"></i>
                    </div>
                    <h4>Aucun fichier</h4>
                    <p>Aucun fichier n'a été ajouté pour ce patient.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2>Notes</h2>
              </div>
              <div className="card-body">
                <div className="notes-container">
                  <div className="notes-list">
                    {patientNotes[selectedPatient.id]?.length > 0 ? (
                      patientNotes[selectedPatient.id]
                        .sort((a, b) => {
                          if (a.createdAt && b.createdAt) {
                            return b.createdAt.seconds - a.createdAt.seconds;
                          }
                          return 0;
                        })
                        .map((note, index) => (
                          <motion.div 
                            key={note.id} 
                            className="note-item"
                            variants={itemTransition}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="note-header">
                              <div className="note-author">{note.medecinNom}</div>
                              <div className="note-date">
                                {note.createdAt ? formatDate(note.createdAt) : 'Date inconnue'}
                              </div>
                            </div>
                            <div className="note-content">{note.content}</div>
                          </motion.div>
                        ))
                    ) : (
                      <div className="empty-state small">
                        <div className="empty-icon">
                          <i className="bi bi-journal-text"></i>
                        </div>
                        <h4>Aucune note</h4>
                        <p>Aucune note n'a été ajoutée pour ce patient.</p>
                      </div>
                    )}
                  </div>
                  <div className="add-note">
                    <textarea
                      placeholder="Ajouter une nouvelle note..."
                      value={patientNote}
                      onChange={(e) => setPatientNote(e.target.value)}
                      rows="3"
                    ></textarea>
                    <button 
                      className="btn-primary" 
                      onClick={handleAddNote}
                      disabled={!patientNote.trim()}
                    >
                      <i className="bi bi-plus-circle"></i>
                      <span>Ajouter une note</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-person-lines-fill"></i>
            </div>
            <h4>Sélectionnez un patient</h4>
            <p>Veuillez sélectionner un patient pour voir ses données et sauvegardes.</p>
          </div>
        )}
      </div>
    </div>
  </motion.div>
)}

          </AnimatePresence>
        </div>
      </main>
{/* Modal pour ajouter un nouveau patient */}
{showNewPatientModal && (
  <div className="modal-overlay">
    <div className="modal-container">
      <div className="modal-header">
        <h3>Ajouter un nouveau patient</h3>
        <button className="modal-close" onClick={() => setShowNewPatientModal(false)}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleAddPatient}>
          <div className="form-grid">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                name="prenom"
                value={newPatientForm.prenom}
                onChange={handleNewPatientChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="nom"
                value={newPatientForm.nom}
                onChange={handleNewPatientChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={newPatientForm.email}
                onChange={handleNewPatientChange}
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={newPatientForm.telephone}
                onChange={handleNewPatientChange}
              />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input
                type="date"
                name="dateNaissance"
                value={newPatientForm.dateNaissance}
                onChange={handleNewPatientChange}
              />
            </div>
            <div className="form-group">
              <label>Assurance</label>
              <input
                type="text"
                name="assurance"
                value={newPatientForm.assurance}
                onChange={handleNewPatientChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              name="adresse"
              value={newPatientForm.adresse}
              onChange={handleNewPatientChange}
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={newPatientForm.notes}
              onChange={handleNewPatientChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="isPrivate"
                checked={newPatientForm.isPrivate}
                onChange={handleNewPatientChange}
              />
              <span className="checkmark"></span>
              Patient privé (non visible par la structure)
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save">
              <i className="bi bi-person-plus"></i>
              Ajouter le patient
            </button>
            <button type="button" className="btn-cancel" onClick={() => setShowNewPatientModal(false)}>
              <i className="bi bi-x-circle"></i>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}




      {/* Message de notification */}
      <AnimatePresence>
        {message && (
          <motion.div 
            className="notification"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="notification-content">
              <i className="bi bi-info-circle"></i>
              <span>{message}</span>
            </div>
            <button 
              className="notification-close"
              onClick={() => setMessage('')}
            >
              <i className="bi bi-x"></i>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx>{`
        /* Variables de couleur avec animations */
        :root {
          --primary: #4361ee;
          --primary-light: #4895ef;
          --primary-dark: #3f37c9;
          --secondary: #4cc9f0;
          --success: #4ade80;
          --warning: #fbbf24;
          --danger: #f87171;
          --info: #60a5fa;
          --light: #f9fafb;
          --dark: #1f2937;
          --gray: #6b7280;
          --gray-light: #e5e7eb;
          --gray-dark: #4b5563;
          --body-bg: #f3f4f6;
          --card-bg: #ffffff;
          --sidebar-bg: #1e293b;
          --sidebar-hover: #334155;
          --sidebar-active: #3b82f6;
          --text-primary: #111827;
          --text-secondary: #4b5563;
          --text-muted: #9ca3af;
          --border-color: #e5e7eb;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          --transition: all 0.3s ease;
        }

        /* Styles de base */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--body-bg);
          color: var(--text-primary);
          line-height: 1.5;
        }

        /* Layout principal */
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          transition: var(--transition);
        }

        /* Sidebar */
        .sidebar {
          width: 280px;
          background-color: var(--sidebar-bg);
          color: white;
          display: flex;
          flex-direction: column;
          transition: var(--transition);
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          box-shadow: var(--shadow);
        }

        .sidebar-collapsed .sidebar {
          width: 80px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 1.25rem;
          color: white;
        }

        .logo i {
          font-size: 1.5rem;
          color: var(--primary-light);
        }

        .sidebar-collapsed .logo-text {
          display: none;
        }

        .sidebar-toggle {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: var(--transition);
        }

        .sidebar-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-collapsed .sidebar-user {
          justify-content: center;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .user-info {
          overflow: hidden;
          transition: var(--transition);
        }

        .sidebar-collapsed .user-info {
          display: none;
        }

        .user-info h4 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-info p {
          font-size: 0.875rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .sidebar-nav ul {
          list-style: none;
        }

        .sidebar-nav li {
          margin-bottom: 0.25rem;
        }

        .sidebar-nav button {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          color: white;
          font-size: 1rem;
          text-align: left;
          cursor: pointer;
          border-radius: 0.375rem;
          transition: var(--transition);
          position: relative;
        }

        .sidebar-collapsed .sidebar-nav button {
          justify-content: center;
          padding: 0.75rem;
        }

        .sidebar-nav button:hover {
          background-color: var(--sidebar-hover);
        }

        .sidebar-nav li.active button {
          background-color: var(--sidebar-active);
          color: white;
          font-weight: 500;
        }

        .sidebar-nav button i {
          font-size: 1.25rem;
          min-width: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-collapsed .sidebar-nav button span {
          display: none;
        }

        .nav-badge {
          position: absolute;
          top: 50%;
          right: 1.5rem;
          transform: translateY(-50%);
          background-color: var(--danger);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          min-width: 1.5rem;
          text-align: center;
        }

        .sidebar-collapsed .nav-badge {
          top: 0.5rem;
          right: 0.5rem;
          transform: none;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-logout {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar-collapsed .btn-logout {
          justify-content: center;
        }

        .btn-logout:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .sidebar-collapsed .btn-logout span {
          display: none;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          padding: 2rem;
          margin-left: 280px;
          transition: var(--transition);
        }

        .sidebar-collapsed .main-content {
          margin-left: 80px;
        }

        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .header-title h1 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          border: none;
          background-color: var(--primary);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-action:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .btn-action.active {
          background-color: var(--danger);
        }

        .btn-action.active:hover {
          background-color: #e05252;
          box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
        }

        .search-container {
          position: relative;
          width: 300px;
        }

        .search-container i {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray);
        }

        .search-container input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: var(--transition);
        }

        .search-container input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
        }

        /* Animations de couleur pour les cartes et éléments */
        .card {
          background-color: var(--card-bg);
          border-radius: 0.5rem;
          box-shadow: var(--shadow);
          overflow: hidden;
          transition: var(--transition);
        }

        .card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-3px);
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .card-body {
          padding: 1.5rem;
        }

        /* Styles pour le calendrier */
        .calendar-container {
          margin-bottom: 1.5rem;
        }

        .react-calendar {
          width: 100%;
          border: none;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-sm);
          padding: 1rem;
          font-family: 'Inter', sans-serif;
        }

        .react-calendar__navigation {
          margin-bottom: 1rem;
        }

        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 1rem;
          color: var(--text-primary);
          border-radius: 0.375rem;
          transition: var(--transition);
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: var(--primary-light);
          color: white;
        }

        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .react-calendar__month-view__days__day {
          border-radius: 0.375rem;
          transition: var(--transition);
        }

        .react-calendar__tile {
          max-width: 100%;
          padding: 0.75rem 0.5rem;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 0.875rem;
          color: var(--text-primary);
          position: relative;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: var(--primary-light);
          color: white;
          transform: scale(1.05);
        }

        .react-calendar__tile--now {
          background-color: rgba(67, 97, 238, 0.1);
          font-weight: 600;
        }

        .react-calendar__tile--active {
          background-color: var(--primary);
          color: white;
        }

        .react-calendar__tile.has-rdv {
          background-color: rgba(67, 97, 238, 0.1);
          font-weight: 500;
        }

        .calendar-rdv-count {
          position: absolute;
          bottom: 2px;
          right: 50%;
          transform: translateX(50%);
          background-color: var(--primary);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-legend {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          background-color: var(--gray-light);
        }

        .legend-color.has-rdv {
          background-color: rgba(67, 97, 238, 0.3);
        }

        /* Animations pour les éléments interactifs */
        .btn-primary {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-primary:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .btn-secondary {
          background-color: var(--gray-light);
          color: var(--text-primary);
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-secondary:hover {
          background-color: var(--gray);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background-color: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-icon:hover {
          background-color: var(--gray-light);
          color: var(--primary);
          transform: scale(1.1);
        }

        .btn-save {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-save:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .btn-cancel {
          background-color: var(--gray-light);
          color: var(--text-primary);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-cancel:hover {
          background-color: var(--gray);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }

        /* Styles pour les rendez-vous */
        .appointments-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .appointment-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: white;
          box-shadow: var(--shadow-sm);
          border-left: 4px solid var(--primary);
          transition: var(--transition);
        }

        .appointment-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
        }

        .appointment-card.en.attente {
          border-left-color: var(--warning);
        }

        .appointment-card.confirmé {
          border-left-color: var(--primary);
        }

        .appointment-card.en.cours {
          border-left-color: var(--info);
        }

        .appointment-card.terminé {
          border-left-color: var(--success);
        }

        .appointment-card.annulé {
          border-left-color: var(--danger);
          opacity: 0.7;
        }

        .appointment-time {
          width: 100px;
          text-align: center;
          padding-right: 1rem;
          border-right: 1px solid var(--border-color);
        }

        .appointment-time .time {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .appointment-time .duration {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .appointment-details {
          flex: 1;
          padding: 0 1rem;
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .patient-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .patient-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .appointment-reason {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .appointment-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: var(--gray-light);
          color: var(--text-secondary);
        }

        .appointment-card.en.attente .status-badge {
          background-color: rgba(251, 191, 36, 0.2);
          color: #b45309;
        }

        .appointment-card.confirmé .status-badge {
          background-color: rgba(67, 97, 238, 0.2);
          color: #3730a3;
        }

        .appointment-card.en.cours .status-badge {
          background-color: rgba(96, 165, 250, 0.2);
          color: #1e40af;
        }

        .appointment-card.terminé .status-badge {
          background-color: rgba(74, 222, 128, 0.2);
          color: #15803d;
        }

        .appointment-card.annulé .status-badge {
          background-color: rgba(248, 113, 113, 0.2);
          color: #b91c1c;
        }

        .appointment-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Notification */
        .notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-lg);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          z-index: 1000;
          max-width: 400px;
          animation: slideIn 0.3s ease-out forwards;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .notification-content i {
          font-size: 1.25rem;
          color: var(--primary);
        }

        .notification-close {
          background: transparent;
          border: none;
          color: var(--gray);
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: var(--transition);
        }

        .notification-close:hover {
          background-color: var(--gray-light);
          color: var(--danger);
        }

        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* États vides */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          color: var(--gray-light);
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }

        .empty-state h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          max-width: 400px;
        }

               @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Loader */
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: var(--body-bg);
        }

        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(67, 97, 238, 0.3);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Profil */
        .profile-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Structure */
        .structure-card-large {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 1rem;
        }

        .structure-logo {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background-color: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          flex-shrink: 0;
        }

        .structure-content {
          flex: 1;
        }

        .structure-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }

        .structure-details {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .detail-item i {
          color: var(--primary);
        }

        .insurance-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.5rem 0;
        }

        .insurance-tag {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background-color: rgba(67, 97, 238, 0.1);
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 500;
          transition: var(--transition);
        }

        .insurance-tag:hover {
          background-color: var(--primary);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .no-data {
          padding: 1rem 0;
          color: var(--text-secondary);
          font-style: italic;
        }

        /* Formulaire d'édition */
        .edit-form {
          padding: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: var(--transition);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
        }

        .form-group small {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .form-section {
          margin-bottom: 2rem;
        }

        .form-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .availability-table {
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          background-color: var(--gray-light);
          padding: 0.75rem 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border-color);
          align-items: center;
        }

        .table-row:hover {
          background-color: var(--light);
        }

        .day {
          font-weight: 500;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--gray-light);
          transition: var(--transition);
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: var(--transition);
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--success);
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .insurance-options {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 30px;
          cursor: pointer;
          font-size: 0.875rem;
          user-select: none;
        }

        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 20px;
          width: 20px;
          background-color: #fff;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          transition: var(--transition);
        }

        .checkbox-container:hover input ~ .checkmark {
          border-color: var(--primary);
        }

        .checkbox-container input:checked ~ .checkmark {
          background-color: var(--primary);
          border-color: var(--primary);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }

        .checkbox-container .checkmark:after {
          left: 7px;
          top: 3px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        /* Patients */
        .patients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .patient-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: var(--transition);
        }

        .patient-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .patient-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .patient-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .patient-name {
          flex: 1;
        }

        .patient-name h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .patient-age {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .patient-contact {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .contact-item i {
          color: var(--primary);
        }

        .patient-visit {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .visit-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .visit-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .no-visit {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .patient-actions {
          display: flex;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
        }

        .btn-action {
          flex: 1;
          padding: 0.625rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-action.primary {
          background-color: var(--primary);
          color: white;
        }

        .btn-action.primary:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .btn-action.secondary {
          background-color: rgba(67, 97, 238, 0.1);
          color: var(--primary);
        }

        .btn-action.secondary:hover {
          background-color: rgba(67, 97, 238, 0.2);
          transform: translateY(-2px);
        }

        /* Structures */
        .structures-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .structure-card {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: var(--transition);
        }

        .structure-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .structure-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .structure-header h5 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .structure-action {
          padding: 1rem 1.5rem;
        }

        .btn-affiliate {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 0.375rem;
          background-color: var(--primary);
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition);
        }

        .btn-affiliate:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .btn-pending {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 0.375rem;
          background-color: rgba(251, 191, 36, 0.2);
          color: #b45309;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: not-allowed;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-current {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 0.375rem;
          background-color: rgba(74, 222, 128, 0.2);
          color: #15803d;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: not-allowed;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .request-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          background-color: white;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .request-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
        }

        .request-structure {
          font-weight: 500;
          color: var(--text-primary);
        }

        .request-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .request-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .request-card.pending .request-status {
          color: #b45309;
        }

        .request-card.pending .status-indicator {
          background-color: #fbbf24;
        }

        .request-card.approved .request-status {
          color: #15803d;
        }

        .request-card.approved .status-indicator {
          background-color: #4ade80;
        }

        .request-card.rejected .request-status {
          color: #b91c1c;
        }

        .request-card.rejected .status-indicator {
          background-color: #f87171;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 0.5rem;
          background-color: white;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .stat-icon.blue {
          background-color: var(--info);
        }

        .stat-icon.green {
          background-color: var(--success);
        }

        .stat-icon.purple {
          background-color: #8b5cf6;
        }

        .stat-content {
          flex: 1;
        }

        .stat-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.25rem 0;
        }

        .stat-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Sécurité */
        .security-tips {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .tip-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(67, 97, 238, 0.1);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .tip-content h4 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .tip-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .password-input {
          position: relative;
        }

        .password-input input {
          padding-right: 2.5rem;
        }

        .password-input i {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .sidebar {
            width: 240px;
          }

          .sidebar-collapsed .sidebar {
            width: 70px;
          }

          .main-content {
            margin-left: 240px;
          }

          .sidebar-collapsed .main-content {
            margin-left: 70px;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }

          .sidebar .logo-text,
          .sidebar .user-info,
          .sidebar-nav button span {
            display: none;
          }

          .sidebar-nav button {
            justify-content: center;
            padding: 0.75rem;
          }

          .btn-logout {
            justify-content: center;
          }

          .btn-logout span {
            display: none;
          }

          .main-content {
            margin-left: 70px;
            padding: 1.5rem;
          }

          .content-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .search-container {
            width: 100%;
          }

          .profile-cards,
          .patients-grid,
          .structures-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 1rem;
          }

          .btn-action span {
            display: none;
          }

          .appointment-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .appointment-time {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding-right: 0;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
            text-align: left;
          }

          .appointment-status {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            margin-top: 0.5rem;
          }
        }


        /* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-container {
  background-color: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: var(--gray);
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  color: var(--danger);
}

.modal-body {
  padding: 1.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Filtres pour les patients */
.filter-controls {
  margin-bottom: 1.5rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-buttons button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  background-color: white;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
}

.filter-buttons button:hover {
  background-color: var(--gray-light);
}

.filter-buttons button.active {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Badges pour les types de patients */
.badge-private {
  background-color: rgba(67, 97, 238, 0.1);
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-structure {
  background-color: rgba(74, 222, 128, 0.1);
  color: #15803d;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Layout des sauvegardes */
.sauvegardes-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.sauvegardes-sidebar {
  height: calc(100vh - 150px);
  overflow-y: auto;
}

.sauvegardes-content {
  height: calc(100vh - 150px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.patients-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: var(--transition);
}

.patient-item:hover {
  background-color: rgba(67, 97, 238, 0.05);
}

.patient-item.active {
  background-color: rgba(67, 97, 238, 0.1);
}

.patient-info {
  flex: 1;
}

.patient-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.patient-type {
  font-size: 0.75rem;
}

/* Détails du patient */
.patient-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid var(--gray-light);
  padding-bottom: 0.75rem;
}

.detail-label {
  width: 150px;
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  flex: 1;
  color: var(--text-primary);
}

/* Fichiers */
.file-upload {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.file-item:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: rgba(67, 97, 238, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.file-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

/* Notes */
.notes-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.note-item {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.note-item:hover {
  box-shadow: var(--shadow);
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.note-author {
  font-weight: 500;
  color: var(--primary);
}

.note-date {
  color: var(--text-secondary);
}

.note-content {
  color: var(--text-primary);
  white-space: pre-wrap;
}

.add-note {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.add-note textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  transition: var(--transition);
}

.add-note textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.add-note button {
  align-self: flex-end;
}

/* État vide plus petit */
.empty-state.small {
  padding: 2rem 1rem;
}

.empty-state.small .empty-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.empty-state.small h4 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.empty-state.small p {
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Styles pour le formulaire d'ajout de patient */
.checkbox-group {
  margin-top: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.text-danger {
  color: var(--danger) !important;
}

/* Responsive pour les sauvegardes */
@media (max-width: 992px) {
  .sauvegardes-layout {
    grid-template-columns: 1fr;
  }
  
  .sauvegardes-sidebar,
  .sauvegardes-content {
    height: auto;
    max-height: 500px;
  }
}




      `}</style>
    </div>
  );
}

export default MedecinDashboard;