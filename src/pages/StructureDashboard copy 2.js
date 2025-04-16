ajuste :"import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc,setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db ,storage} from '../components/firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import AffiliationRequestsManagerMedecins from './AffiliationRequestsManagerMedecins.js'
import AffiliationRequestsManager from './AffiliationRequestsManager.js'

import 'bootstrap/dist/css/bootstrap.min.css';

const StructureDashboard = () => {
  const [structureData, setStructureData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const [medecins, setMedecins] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [showMedecinForm, setShowMedecinForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showRendezvousForm, setShowRendezvousForm] = useState(false);
  const [currentMedecin, setCurrentMedecin] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRendezvous, setCurrentRendezvous] = useState(null);
  const [filtreDate, setFiltreDate] = useState(new Date().toISOString().split('T')[0]);
  const [filtreMedecin, setFiltreMedecin] = useState('');
  // États pour les archives
const [archives, setArchives] = useState([]);
const [showArchiveForm, setShowArchiveForm] = useState(false);
const [currentArchive, setCurrentArchive] = useState(null);
const [archiveFiles, setArchiveFiles] = useState([]);
const [selectedFiles, setSelectedFiles] = useState([]);
const [filtreArchivePatient, setFiltreArchivePatient] = useState('');
// Ajoutez cette ligne avec les autres déclarations d'état au début du composant
const [pendingRequests, setPendingRequests] = useState([]);
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
    duree: 30,
    motif: '',
    statut: 'planifié'
  });
  
  // Constantes
  const specialites = ["Généraliste", "Cardiologue", "Dermatologue", "Pédiatre", "Gynécologue", "Ophtalmologue", "Autre"];
  const assurancesList = ["CNAM", "CNSS", "CNRPS", "Assurance privée", "Autre"];
  const joursSemaine = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const statutsRdv = ["planifié", "confirmé", "en cours", "terminé", "annulé", "absent"];
  const dureesRdv = [15, 30, 45, 60, 90, 120];
  
  const navigate = useNavigate();
  const auth = getAuth();

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
        }
      } else {
        navigate('/auth');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);


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
      } catch (error) {
        setMessage(`Erreur: ${error.message}`);
      }
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
        rdvData.push({ id: doc.id, ...doc.data() });
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
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    setCurrentMedecin(null);
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
      password: '',
      telephone: '',
      assurances: []
    });
    setCurrentPatient(null);
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
      duree: 30,
      motif: '',
      statut: 'planifié'
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
    
    for (const rdv of rdvDuJour) {
      const [rdvHeureH, rdvHeureM] = rdv.heure.split(':').map(Number);
      const rdvDebut = new Date();
      rdvDebut.setHours(rdvHeureH, rdvHeureM, 0, 0);
      
      const rdvFin = new Date();
      rdvFin.setHours(rdvHeureH, rdvHeureM + parseInt(rdv.duree), 0, 0);
      
      const nouveauRdvDebut = new Date();
      nouveauRdvDebut.setHours(heureH, heureM, 0, 0);
      
      const nouveauRdvFin = new Date();
      nouveauRdvFin.setHours(heureH, heureM + parseInt(duree), 0, 0);
      
      // Vérifier s'il y a chevauchement
      if (
        (nouveauRdvDebut >= rdvDebut && nouveauRdvDebut < rdvFin) ||
        (nouveauRdvFin > rdvDebut && nouveauRdvFin <= rdvFin) ||
        (nouveauRdvDebut <= rdvDebut && nouveauRdvFin >= rdvFin)
      ) {
        return false;
      }
    }
    
    return true;
  };

  const handleAddMedecin = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      
      // Créer l'utilisateur Firebase Authentication pour le médecin
      let medecinAuthId;
      
      if (!currentMedecin) {
        // Création d'un nouveau médecin - créer un compte utilisateur
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          medecinForm.email, 
          medecinForm.password
        );
        medecinAuthId = userCredential.user.uid;
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
        setMessage('Médecin ajouté avec succès.');
      }
      
      resetMedecinForm();
      setShowMedecinForm(false);
      fetchMedecins(user.uid);
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
      } catch (error) {
        setMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      
      // Créer l'utilisateur Firebase Authentication pour le patient
      let patientAuthId;
      
      if (!currentPatient) {
        // Création d'un nouveau patient - créer un compte utilisateur
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          patientForm.email, 
          patientForm.password
        );
        patientAuthId = userCredential.user.uid;
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
        setMessage('Patient ajouté avec succès.');
      }
      
      resetPatientForm();
      setShowPatientForm(false);
      fetchPatients(user.uid);
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
      } catch (error) {
        setMessage(`Erreur lors de la suppression: ${error.message}`);
      }
    }
  };

  

  // Fonctions CRUD pour les rendez-vous
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
      
      const rdvData = {
        ...rdvForm,
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
      duree: rdv.duree || 30,
      motif: rdv.motif || '',
      statut: rdv.statut || 'planifié'
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

  

  if (!structureData) return <div className="container mt-5">Chargement...</div>;

  
  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Bienvenue, {structureData.nom}</h3>
        <button onClick={handleLogout} className="btn btn-danger">Déconnexion</button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'info' ? 'active' : ''}`} 
            onClick={() => setActiveTab('info')}
          >
            Informations
          </button>
          <li className="nav-item">
  <button 
    className={`nav-link ${activeTab === 'affiliations' ? 'active' : ''}`} 
    onClick={() => setActiveTab('affiliations')}
  >
    Affiliations
    {pendingRequests.length > 0 && (
      <span className="badge bg-danger ms-1">{pendingRequests.length}</span>
    )}
  </button>
</li>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'medecins' ? 'active' : ''}`} 
            onClick={() => setActiveTab('medecins')}
          >
            Médecins
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`} 
            onClick={() => setActiveTab('patients')}
          >
            Patients
          </button>
{/* Ajouter ceci dans la liste des onglets */}
<li className="nav-item">
  <button 
    className={`nav-link ${activeTab === 'archives' ? 'active' : ''}`} 
    onClick={() => setActiveTab('archives')}
  >
    Archives
  </button>
</li>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'rendezvous' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rendezvous')}
          >
            Rendez-vous
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} 
            onClick={() => setActiveTab('password')}
          >
            Mot de passe
          </button>
        </li>
      </ul>

      {activeTab === 'affiliations' && (
  <AffiliationRequestsManagerMedecins />
)}

{/* Onglet Archives */}
{activeTab === 'archives' && (
  <div className="tab-content">
    <h3>Archives des patients</h3>
    <div className="mb-3">
      <button 
        className="btn btn-primary" 
        onClick={() => {
          resetArchiveForm();
          setShowArchiveForm(true);
        }}
      >
        Ajouter une archive
      </button>
    </div>
    
    {/* Formulaire d'ajout/modification d'archive */}
    {showArchiveForm && (
      <div className="card mb-4">
        <div className="card-header">
          {currentArchive ? "Modifier l'archive" : "Ajouter une archive"}
        </div>
        <div className="card-body">
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
              <div>
                {tagsList.map(tag => (
                  <div key={tag} className="form-check form-check-inline">
                    <input 
                      type="checkbox" 
                      id={`tag-${tag}`} 
                      name="tags" 
                      value={tag} 
                      className="form-check-input" 
                      checked={archiveForm.tags.includes(tag)} 
                      onChange={handleArchiveChange}
                    />
                    <label htmlFor={`tag-${tag}`} className="form-check-label">{tag}</label>
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
            
            {currentArchive && archiveForm.files.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Fichiers existants</label>
                <ul className="list-group">
                  {archiveForm.files.map((file, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDeleteFile(currentArchive.id, file.path, index)}
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="d-flex justify-content-between">
              <button type="submit" className="btn btn-primary">
                {currentArchive ? "Mettre à jour" : "Ajouter"}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowArchiveForm(false);
                  resetArchiveForm();
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    {/* Filtre par patient */}
    <div className="mb-3">
      <label htmlFor="filtreArchivePatient" className="form-label">Filtrer par patient</label>
      <select 
        id="filtreArchivePatient" 
        className="form-select" 
        value={filtreArchivePatient} 
        onChange={(e) => setFiltreArchivePatient(e.target.value)}
      >
        <option value="">Tous les patients</option>
        {patients.map(patient => (
          <option key={patient.id} value={patient.id}>
            {patient.prenom} {patient.nom}
          </option>
        ))}
      </select>
    </div>
    
    {/* Liste des archives */}
    <div className="table-responsive">
      <table className="table table-striped">
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
            .filter(archive => !filtreArchivePatient || archive.patientId === filtreArchivePatient)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(archive => (
              <tr key={archive.id}>
                <td>{archive.patientNom}</td>
                <td>{archive.titre}</td>
                <td>{new Date(archive.date).toLocaleDateString()}</td>
                <td>
                  {archive.tags && archive.tags.map(tag => (
                    <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                  ))}
                </td>
                <td>
                  {archive.files && archive.files.length > 0 ? (
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        type="button" 
                        id={`dropdownFiles-${archive.id}`} 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                      >
                        {archive.files.length} fichier(s)
                      </button>
                      <ul className="dropdown-menu" aria-labelledby={`dropdownFiles-${archive.id}`}>
                        {archive.files.map((file, index) => (
                          <li key={index}>
                            <a 
                              className="dropdown-item" 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    "Aucun fichier"
                  )}
                </td>
                <td>
                  <div className="btn-group">
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={() => handleEditArchive(archive)}
                    >
                      Modifier
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => handleDeleteArchive(archive.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
)}

      {activeTab === 'info' && (
        <div className="card p-4 shadow-sm">
          <h5 className="mb-3">Informations de la structure</h5>
          {Object.keys(form).map((key) => (
            key !== 'createdAt' && key !== 'updatedAt' ? (
              <div className="mb-3" key={key}>
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
          <button onClick={handleUpdate} className="btn btn-primary mt-2">Mettre à jour</button>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-4 shadow-sm">
          <h5 className="mb-3">Modifier le mot de passe</h5>
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={handlePasswordChange} className="btn btn-warning">Modifier le mot de passe</button>
        </div>
      )}

      {activeTab === 'medecins' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Liste des médecins</h5>
            <button 
              className="btn btn-success" 
              onClick={() => {
                resetMedecinForm();
                setShowMedecinForm(!showMedecinForm);
              }}
            >
              {showMedecinForm ? 'Annuler' : 'Ajouter un médecin'}
            </button>
          </div>

          {showMedecinForm && (
            <div className="card p-4 shadow-sm mb-4">
              <h5>{currentMedecin ? 'Modifier le médecin' : 'Ajouter un médecin'}</h5>
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
                      className="form-control"
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mot de passe {currentMedecin && '(laisser vide pour ne pas modifier)'}</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={medecinForm.password}
                      onChange={handleMedecinChange}
                      required={!currentMedecin}
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
                      placeholder="Précisez les autres assurances"
                      value={medecinForm.assuranceAutre || ''}
                      onChange={handleMedecinChange}
                    />
                  )}
                </div>

                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => {
                    resetMedecinForm();
                    setShowMedecinForm(false);
                  }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {currentMedecin ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {medecins.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Spécialité</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medecins.map((medecin) => (
                    <tr key={medecin.id}>
                      <td>{medecin.nom}</td>
                      <td>{medecin.prenom}</td>
                      <td>{medecin.specialite} {medecin.specialiteAutre ? `(${medecin.specialiteAutre})` : ''}</td>
                      <td>{medecin.telephone}</td>
                      <td>{medecin.email}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEditMedecin(medecin)}
                        >
                          Modifier
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteMedecin(medecin.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucun médecin n'a été ajouté. Utilisez le bouton "Ajouter un médecin" pour commencer.
            </div>
          )}
        </div>
      )}

      {/* Gestion des patients */}
      {activeTab === 'patients' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Liste des patients</h5>
            <button 
              className="btn btn-success" 
              onClick={() => {
                resetPatientForm();
                setShowPatientForm(!showPatientForm);
              }}
            >
              {showPatientForm ? 'Annuler' : 'Ajouter un patient'}
            </button>
          </div>

          {showPatientForm && (
            <div className="card p-4 shadow-sm mb-4">
              <h5>{currentPatient ? 'Modifier le patient' : 'Ajouter un patient'}</h5>
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Mot de passe {currentPatient && '(laisser vide pour ne pas modifier)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={patientForm.password}
                      onChange={handlePatientChange}
                      required={!currentPatient}
                      placeholder="Mot de passe de première connexion"
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
                      placeholder="Précisez les autres assurances"
                      value={patientForm.assuranceAutre || ''}
                      onChange={handlePatientChange}
                    />
                  )}
                </div>

                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => {
                    resetPatientForm();
                    setShowPatientForm(false);
                  }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {currentPatient ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {patients.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Date de naissance</th>
                    <th>Téléphone</th>
                    <th>Email</th>
                    <th>Assurances</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.nom}</td>
                      <td>{patient.prenom}</td>
                      <td>{patient.dateNaissance}</td>
                      <td>{patient.telephone}</td>
                      <td>{patient.email}</td>
                      <td>
                        {patient.assurances && patient.assurances.join(', ')}
                        {patient.assuranceAutre && `, ${patient.assuranceAutre}`}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEditPatient(patient)}
                        >
                          Modifier
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeletePatient(patient.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucun patient n'a été ajouté. Utilisez le bouton "Ajouter un patient" pour commencer.
            </div>
          )}
        </div>
      )}

      {/* Nouvel onglet pour les rendez-vous */}
      {activeTab === 'rendezvous' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Gestion des rendez-vous</h5>
            <button 
              className="btn btn-success" 
              onClick={() => {
                resetRdvForm();
                setShowRendezvousForm(!showRendezvousForm);
              }}
            >
              {showRendezvousForm ? 'Annuler' : 'Ajouter un rendez-vous'}
            </button>
          </div>

          {showRendezvousForm && (
            <div className="card p-4 shadow-sm mb-4">
              <h5>{currentRendezvous ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'}</h5>
              <form onSubmit={handleAddRendezvous}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Médecin</label>
                    <select
                      name="medecinId"
                      className="form-control"
                      value={rdvForm.medecinId}
                      onChange={handleRdvChange}
                      required
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map((medecin) => (
                        <option key={medecin.id} value={medecin.id}>
                          {medecin.prenom} {medecin.nom} - {medecin.specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Patient</label>
                    <select
                      name="patientId"
                      className="form-control"
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
                  <div className="col-md-6 mb-3">
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Durée (minutes)</label>
                    <select
                      name="duree"
                      className="form-control"
                      value={rdvForm.duree}
                      onChange={handleRdvChange}
                      required
                    >
                      {dureesRdv.map((duree) => (
                        <option key={duree} value={duree}>
                          {duree} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Heure</label>
                    {rdvForm.medecinId && rdvForm.date ? (
                      <select
                        name="heure"
                        className="form-control"
                        value={rdvForm.heure}
                        onChange={handleRdvChange}
                        required
                      >
                        <option value="">Sélectionner une heure</option>
                        {getCreneauxDisponibles().map((creneau) => (
                          <option key={creneau} value={creneau}>
                            {creneau}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-warning">
                        Veuillez d'abord sélectionner un médecin et une date
                      </div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Statut</label>
                    <select
                      name="statut"
                      className="form-control"
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

                <div className="mb-3">
                  <label className="form-label">Motif</label>
                  <textarea
                    name="motif"
                    className="form-control"
                    value={rdvForm.motif}
                    onChange={handleRdvChange}
                    rows="3"
                    placeholder="Motif du rendez-vous"
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={() => {
                    resetRdvForm();
                    setShowRendezvousForm(false);
                  }}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {currentRendezvous ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card p-4 shadow-sm mb-4">
            <h5>Filtrer les rendez-vous</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filtreDate}
                  onChange={(e) => setFiltreDate(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Médecin</label>
                <select
                  className="form-control"
                  value={filtreMedecin}
                  onChange={(e) => setFiltreMedecin(e.target.value)}
                >
                  <option value="">Tous les médecins</option>
                  {medecins.map((medecin) => (
                    <option key={medecin.id} value={medecin.id}>
                      {medecin.prenom} {medecin.nom} - {medecin.specialite}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {rendezVousFiltres.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Durée</th>
                    <th>Médecin</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVousFiltres.map((rdv) => {
                    const medecin = medecins.find(m => m.id === rdv.medecinId);
                    const patient = patients.find(p => p.id === rdv.patientId);
                    return (
                      <tr key={rdv.id} className={
                        rdv.statut === 'annulé' ? 'table-danger' : 
                        rdv.statut === 'terminé' ? 'table-success' : 
                        rdv.statut === 'en cours' ? 'table-primary' : 
                        rdv.statut === 'confirmé' ? 'table-info' : ''
                      }>
                        <td>{rdv.date}</td>
                        <td>{rdv.heure}</td>
                        <td>{rdv.duree} min</td>
                        <td>{medecin ? `${medecin.prenom} ${medecin.nom}` : rdv.medecinNom || 'N/A'}</td>
                        <td>{patient ? `${patient.prenom} ${patient.nom}` : rdv.patientNom || 'N/A'}</td>
                        <td>{rdv.motif || 'Non spécifié'}</td>
                        <td>
                          <span className={`badge ${
                            rdv.statut === 'annulé' ? 'bg-danger' :
                            rdv.statut === 'terminé' ? 'bg-success' :
                            rdv.statut === 'en cours' ? 'bg-primary' :
                            rdv.statut === 'confirmé' ? 'bg-info' :
                            rdv.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {rdv.statut.charAt(0).toUpperCase() + rdv.statut.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-info me-1"
                              onClick={() => handleEditRendezvous(rdv)}
                            >
                              <i className="bi bi-pencil"></i> Modifier
                            </button>
                            
                            <div className="dropdown">
                              <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id={`statut-${rdv.id}`} data-bs-toggle="dropdown" aria-expanded="false">
                                Statut
                              </button>
                              <ul className="dropdown-menu" aria-labelledby={`statut-${rdv.id}`}>
                                {statutsRdv.map(statut => (
                                  <li key={statut}>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleChangeStatutRendezvous(rdv.id, statut)}
                                      disabled={rdv.statut === statut}
                                    >
                                      {statut.charAt(0).toUpperCase() + statut.slice(1)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <button
                              className="btn btn-sm btn-danger ms-1"
                              onClick={() => handleDeleteRendezvous(rdv.id)}
                            >
                              <i className="bi bi-trash"></i> Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucun rendez-vous trouvé pour les critères sélectionnés.
            </div>
          )}
          
          {/* Calendrier des rendez-vous */}
          <div className="mt-4">
            <h5>Calendrier des rendez-vous</h5>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Heure</th>
                    {medecins.filter(m => !filtreMedecin || m.id === filtreMedecin).map(medecin => (
                      <th key={medecin.id}>{medecin.prenom} {medecin.nom}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, i) => {
                    const heure = `${i.toString().padStart(2, '0')}:00`;
                    return (
                      <tr key={heure}>
                        <td className="fw-bold">{heure}</td>
                        {medecins.filter(m => !filtreMedecin || m.id === filtreMedecin).map(medecin => {
                          const rdvs = rendezVousFiltres.filter(rdv => 
                            rdv.medecinId === medecin.id && 
                            rdv.heure.startsWith(i.toString().padStart(2, '0') + ':')
                          );
                          return (
                            <td key={`${medecin.id}-${heure}`} className="position-relative">
                              {rdvs.map(rdv => {
                                const patient = patients.find(p => p.id === rdv.patientId);
                                return (
                                  <div 
                                    key={rdv.id}
                                    className={`p-1 mb-1 rounded ${
                                      rdv.statut === 'annulé' ? 'bg-danger' :
                                      rdv.statut === 'terminé' ? 'bg-success' :
                                      rdv.statut === 'en cours' ? 'bg-primary' :
                                      rdv.statut === 'confirmé' ? 'bg-info' :
                                      rdv.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                                    } text-white`}
                                    style={{ 
                                      fontSize: '0.8rem',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleEditRendezvous(rdv)}
                                  >
                                    <div>{rdv.heure} - {patient ? `${patient.prenom} ${patient.nom}` : rdv.patientNom || 'N/A'}</div>
                                    <small>{rdv.motif}</small>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} mt-3`}>
          {message}
        </div>
      )}
<AffiliationRequestsManager />
    </div>
  );
};

export default StructureDashboard;
" pour que si la structure qui voit les demande d'affiliation et/ou les demandes de rendez-vous du patient  qui s'affiche dans :"import React, { useState, useEffect } from 'react';

" accepte une demande de rendez-vous  du patient  le patient est automatiquement enregistrer dans la structure est le patient apparait dans la liste  des patient de la structure  , si il accepte la demande de rendez-vous du patient le rendez-vous est automatiquement enregistrer dans la listes des rendez-vous de la structure .