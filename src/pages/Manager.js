import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Tab, Table, Badge, Alert, Spinner, Modal, Form, Dropdown, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../components/firebase-config.js';
import { collection, query, where, getDocs, setDoc,doc, getDoc, updateDoc, deleteDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FaHospital, FaUserMd,FaSync, FaUsers,FaHome, FaCalendarCheck, FaHandshake, FaSignOutAlt, FaSearch, FaEye, FaCheck, FaTimes, FaFilter, FaDownload, FaInfoCircle, FaBars, FaChartLine, FaPercentage, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Manager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [superStructureData, setSuperStructureData] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [associationRequests, setAssociationRequests] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('structure');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentRequestType, setCurrentRequestType] = useState('');
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [message, setMessage] = useState('');


  // États pour la gestion des revenus
const [doctorFees, setDoctorFees] = useState({});
const [showRevenueSection, setShowRevenueSection] = useState(false);
const [newFee, setNewFee] = useState('');
const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState(null);
const [selectedDoctor, setSelectedDoctor] = useState(null);

const [showWeeklyDetails, setShowWeeklyDetails] = useState(false);
const [completedAppointments, setCompletedAppointments] = useState([]);
const [showSummaryModal, setShowSummaryModal] = useState(false);
const [summaryData, setSummaryData] = useState(null);

  // État pour les statistiques
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    pendingRequests: 0,
    pendingPatientRequests: 0,
    pendingAppointmentRequests: 0,
    acceptanceRate: 0,
    growthRate: 0
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Vérifier si l'utilisateur est connecté en tant que super structure
        const storedData = localStorage.getItem('superStructureData');
        if (!storedData) {
          navigate('/');
          return;
        }

        const superStructureData = JSON.parse(storedData);
        setSuperStructureData(superStructureData);
        
        // Charger les données de la structure
        await loadStructureData(superStructureData.structureDocId);
        
        // Charger les médecins, patients et demandes
        // Charger les médecins, patients, demandes et données financières
      await Promise.all([
        loadDoctors(superStructureData.structureDocId),
        loadPatients(superStructureData.structureDocId),
        loadAssociationRequests(superStructureData.structureDocId),
        loadPatientRequests(superStructureData.structureDocId),
        loadAppointmentRequests(superStructureData.structureDocId),
        loadDoctorFees(),
        loadCompletedAppointments()
      ]);

        // Générer des statistiques mensuelles simulées
        generateMonthlyStats();

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Erreur lors du chargement des données. Veuillez vous reconnecter.");
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate]);

  // Mettre à jour les statistiques générales basées sur les données réelles
useEffect(() => {
  if (doctors && patients && associationRequests && patientRequests && appointmentRequests) {
    setStats({
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      pendingRequests: associationRequests.filter(req => req.status === 'pending').length,
      pendingPatientRequests: patientRequests.filter(req => req.status === 'pending').length,
      pendingAppointmentRequests: appointmentRequests.filter(req => req.status === 'pending').length,
      acceptanceRate: calculateAcceptanceRate(),
      growthRate: calculateGrowthRate()
    });
    
    // Générer les statistiques mensuelles
    generateMonthlyStats();
  }
}, [doctors, patients, associationRequests, patientRequests, appointmentRequests]);

// Fonction pour calculer le taux d'acceptation global
const calculateAcceptanceRate = () => {
  const allRequests = [...associationRequests, ...patientRequests, ...appointmentRequests];
  const acceptedRequests = allRequests.filter(req => req.status === 'accepted').length;
  const totalRequests = allRequests.length || 1; // Éviter division par zéro
  return Math.round((acceptedRequests / totalRequests) * 100);
};

// Fonction pour calculer le taux de croissance
const calculateGrowthRate = () => {
  // Calculer la croissance sur les 30 derniers jours par rapport aux 30 jours précédents
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);
  
  // Compter les nouveaux médecins et patients dans les deux périodes
  const recentDoctors = doctors.filter(doc => {
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
    return createdAt && createdAt >= thirtyDaysAgo;
  }).length;
  
  const previousDoctors = doctors.filter(doc => {
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
    return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;
  
  const recentPatients = patients.filter(pat => {
    const createdAt = pat.createdAt ? new Date(pat.createdAt) : null;
    return createdAt && createdAt >= thirtyDaysAgo;
  }).length;
  
  const previousPatients = patients.filter(pat => {
    const createdAt = pat.createdAt ? new Date(pat.createdAt) : null;
    return createdAt && createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;
  
  const doctorGrowth = previousDoctors === 0 ? 0 : 
    ((recentDoctors - previousDoctors) / previousDoctors) * 100;
  
  const patientGrowth = previousPatients === 0 ? 0 :
    ((recentPatients - previousPatients) / previousPatients) * 100;
  
  return isNaN((doctorGrowth + patientGrowth) / 2) ? 0 : (doctorGrowth + patientGrowth) / 2;
};


// Fonction pour générer des statistiques mensuelles basées sur les données réelles
const generateMonthlyStats = () => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const currentMonth = new Date().getMonth();
  
  // Créer un tableau pour stocker les 6 derniers mois
  const stats = [];
  
  // Calculer les statistiques pour les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    
    // Obtenir le premier et dernier jour du mois
    const year = new Date().getFullYear() - (monthIndex > currentMonth ? 1 : 0);
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    
    // Filtrer les données par mois
    const doctorsThisMonth = doctors.filter(doctor => {
      const createdAt = doctor.createdAt ? new Date(doctor.createdAt) : null;
      return createdAt && createdAt >= firstDay && createdAt <= lastDay;
    });
    
    const patientsThisMonth = patients.filter(patient => {
      const createdAt = patient.createdAt ? new Date(patient.createdAt) : null;
      return createdAt && createdAt >= firstDay && createdAt <= lastDay;
    });
    
    const appointmentsThisMonth = appointmentRequests.filter(req => {
      const requestDate = req.requestDate ? 
        (typeof req.requestDate.toDate === 'function' ? 
          req.requestDate.toDate() : new Date(req.requestDate)) : null;
      return requestDate && requestDate >= firstDay && requestDate <= lastDay;
    });
    
    // Calculer le taux d'acceptation
    const acceptedRequests = appointmentsThisMonth.filter(req => req.status === 'accepted').length;
    const totalRequests = appointmentsThisMonth.length || 1; // Éviter division par zéro
    const acceptanceRate = Math.round((acceptedRequests / totalRequests) * 100);
    
    stats.push({
      month: monthName,
      newDoctors: doctorsThisMonth.length,
      newPatients: patientsThisMonth.length,
      appointments: appointmentsThisMonth.length,
      acceptanceRate: acceptanceRate
    });
  }
  
  setMonthlyStats(stats);
  
  // Calculer les taux de croissance
  if (stats.length >= 2) {
    const lastMonthStats = stats[stats.length - 1];
    const prevMonthStats = stats[stats.length - 2];
    
    const doctorGrowth = prevMonthStats.newDoctors === 0 ? 0 : 
      ((lastMonthStats.newDoctors - prevMonthStats.newDoctors) / prevMonthStats.newDoctors) * 100;
    
    const patientGrowth = prevMonthStats.newPatients === 0 ? 0 :
      ((lastMonthStats.newPatients - prevMonthStats.newPatients) / prevMonthStats.newPatients) * 100;
    
    setStats(prev => ({
      ...prev,
      acceptanceRate: lastMonthStats.acceptanceRate,
      growthRate: isNaN((doctorGrowth + patientGrowth) / 2) ? 0 : (doctorGrowth + patientGrowth) / 2
    }));
  }
};



  // Fonction pour charger les données de la structure
  const loadStructureData = async (structureId) => {
    try {
      const structureDoc = await getDoc(doc(db, "structures", structureId));
      if (structureDoc.exists()) {
        setStructureData({ id: structureDoc.id, ...structureDoc.data() });
      } else {
        setError("Structure non trouvée.");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la structure:", error);
      setError("Erreur lors du chargement des données de la structure.");
    }
  };

  // Fonction pour charger les médecins
  const loadDoctors = async (structureId) => {
    try {
      const doctorsQuery = query(
        collection(db, "medecins"),
        where("structures", "array-contains", structureId)
      );
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const doctorsList = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsList);
      
      // Mise à jour des statistiques
      setStats(prev => ({ ...prev, totalDoctors: doctorsList.length }));
      
      return doctorsList;
    } catch (error) {
      console.error("Erreur lors du chargement des médecins:", error);
      setError("Erreur lors du chargement des médecins.");
      return [];
    }
  };

  // Fonction pour charger les patients
  const loadPatients = async (structureId) => {
    try {
      const patientsQuery = query(
        collection(db, "patients"),
        where("structures", "array-contains", structureId)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientsList = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(patientsList);
      
      // Mise à jour des statistiques
      setStats(prev => ({ ...prev, totalPatients: patientsList.length }));
      
      return patientsList;
    } catch (error) {
      console.error("Erreur lors du chargement des patients:", error);
      setError("Erreur lors du chargement des patients.");
      return [];
    }
  };

  // Fonction pour charger les demandes d'association
  const loadAssociationRequests = async (structureId) => {
    try {
      const requestsQuery = query(
        collection(db, "associationRequests"),
        where("structureId", "==", structureId),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requestsList = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAssociationRequests(requestsList);
      
      // Mise à jour des statistiques - compter uniquement les demandes en attente
      const pendingRequests = requestsList.filter(req => req.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingRequests }));
      
      return requestsList;
    } catch (error) {
      console.error("Erreur lors du chargement des demandes d'association:", error);
      setError("Erreur lors du chargement des demandes d'association.");
      return [];
    }
  };

  // Fonction pour charger les demandes d'affiliation de patients
  const loadPatientRequests = async (structureId) => {
    try {
      const requestsQuery = query(
        collection(db, "structureRequests"),
        where("structureId", "==", structureId),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requestsList = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPatientRequests(requestsList);
      
      // Mise à jour des statistiques - compter uniquement les demandes en attente
      const pendingRequests = requestsList.filter(req => req.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingPatientRequests: pendingRequests }));
      
      return requestsList;
    } catch (error) {
      console.error("Erreur lors du chargement des demandes d'affiliation de patients:", error);
      setError("Erreur lors du chargement des demandes d'affiliation de patients.");
      return [];
    }
  };

  // Fonction pour charger les demandes de rendez-vous
  const loadAppointmentRequests = async (structureId) => {
    try {
      const requestsQuery = query(
        collection(db, "appointmentRequests"),
        where("structureId", "==", structureId),
        where("status", "==", "pending")
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requestsList = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAppointmentRequests(requestsList);
      
      // Mise à jour des statistiques - compter uniquement les demandes en attente
      const pendingRequests = requestsList.filter(req => req.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingAppointmentRequests: pendingRequests }));
      
      return requestsList;
    } catch (error) {
      console.error("Erreur lors du chargement des demandes de rendez-vous:", error);
      setError("Erreur lors du chargement des demandes de rendez-vous.");
      return [];
    }
  };

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('superStructureData');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setError("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  // Fonction pour afficher les détails d'un élément
  const showDetails = (item, type) => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setShowDetailsModal(true);
  };

  const filterItems = (items) => {
    if (!items) return [];
    
    return items.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      
      // Vérifier si nom existe et est une chaîne
      const nomMatch = item.nom && typeof item.nom === 'string' && item.nom.toLowerCase().includes(searchLower);
      
      // Vérifier si prenom existe et est une chaîne
      const prenomMatch = item.prenom && typeof item.prenom === 'string' && item.prenom.toLowerCase().includes(searchLower);
      
      // Vérifier si email existe et est une chaîne
      const emailMatch = item.email && typeof item.email === 'string' && item.email.toLowerCase().includes(searchLower);
      
      // Vérifier si specialite existe
      let specialiteMatch = false;
      if (item.specialite) {
        // Si c'est un tableau, vérifier chaque élément
        if (Array.isArray(item.specialite)) {
          specialiteMatch = item.specialite.some(spec => 
            typeof spec === 'string' && spec.toLowerCase().includes(searchLower)
          );
        } 
        // Si c'est une chaîne
        else if (typeof item.specialite === 'string') {
          specialiteMatch = item.specialite.toLowerCase().includes(searchLower);
        }
      }
      
      // Pour les informations du docteur dans les demandes
      let doctorInfoMatch = false;
      if (item.doctorInfo) {
        const doctorNom = item.doctorInfo.nom && typeof item.doctorInfo.nom === 'string' && 
                          item.doctorInfo.nom.toLowerCase().includes(searchLower);
        const doctorPrenom = item.doctorInfo.prenom && typeof item.doctorInfo.prenom === 'string' && 
                             item.doctorInfo.prenom.toLowerCase().includes(searchLower);
        doctorInfoMatch = doctorNom || doctorPrenom;
      }
      
      // Pour les informations du patient dans les demandes
      let patientInfoMatch = false;
      if (item.patientInfo) {
        const patientNom = item.patientInfo.nom && typeof item.patientInfo.nom === 'string' && 
                           item.patientInfo.nom.toLowerCase().includes(searchLower);
        const patientPrenom = item.patientInfo.prenom && typeof item.patientInfo.prenom === 'string' && 
                              item.patientInfo.prenom.toLowerCase().includes(searchLower);
        patientInfoMatch = patientNom || patientPrenom;
      }
      
      return nomMatch || prenomMatch || emailMatch || specialiteMatch || doctorInfoMatch || patientInfoMatch;
    });
  };
  

  // Fonction pour filtrer les demandes par statut
  const filterByStatus = (items, statusField = 'status') => {
    if (filterStatus === 'all') return items;
    return items.filter(item => item[statusField] === filterStatus);
  };

  // Fonction pour exporter les données en CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    // Créer les en-têtes CSV à partir des clés du premier objet
    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' && typeof data[0][key] !== 'function'
    );
    
    // Créer les lignes CSV
    const csvRows = [
      headers.join(','), // En-têtes
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Échapper les virgules et les guillemets
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    
    // Créer le contenu CSV
    const csvContent = csvRows.join('\n');
    
    // Créer un objet Blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour gérer les réponses aux demandes d'association
  const handleAssociationResponse = async (requestId, doctorId, accepted) => {
    try {
      if (accepted) {
        // Mise à jour du statut de la demande
        await updateDoc(doc(db, 'associationRequests', requestId), {
          status: 'accepted',
          acceptedDate: new Date().toISOString()
        });

        // Ajout de la structure dans le tableau des structures du médecin
        const doctorRef = doc(db, 'medecins', doctorId);
        await updateDoc(doctorRef, {
          structures: arrayUnion(structureData.id),
          visibility: 'affiliated'  // Marquer le médecin comme affilié
        });

        // Récupérer les données du médecin
        const doctorDoc = await getDoc(doctorRef);
        const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

        // Ajouter le médecin au tableau local
        setDoctors(prevDoctors => [...prevDoctors, doctorData]);
        
        // Mettre à jour la liste des demandes d'association
        setAssociationRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'accepted', acceptedDate: new Date().toISOString() } 
              : req
          )
        );

        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          totalDoctors: prev.totalDoctors + 1,
          pendingRequests: prev.pendingRequests - 1
        }));
      } else {
        // Refuser la demande
        await updateDoc(doc(db, 'associationRequests', requestId), {
          status: 'rejected',
          rejectionDate: new Date().toISOString()
        });
        
        // Mettre à jour la liste des demandes d'association
        setAssociationRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'rejected', rejectionDate: new Date().toISOString() } 
              : req
          )
        );
        
        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests - 1
        }));
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la demande d\'association:', error);
      alert('Une erreur est survenue lors du traitement de la demande.');
    }
  };

  // Fonction pour gérer les réponses aux demandes d'affiliation de patients
  const handlePatientRequest = async (requestId, accepted, notes = '') => {
    try {
      const requestRef = doc(db, 'structureRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();
      const patientInfo = requestData.patientInfo;
      
      if (accepted) {
        // Vérifier si le patient existe déjà dans la collection patients
        const patientQuery = query(
          collection(db, 'patients'),
          where('email', '==', patientInfo.email)
        );
        const patientSnapshot = await getDocs(patientQuery);
        
        let patientRef;
        let patientDocId;
        
        if (!patientSnapshot.empty) {
          // Le patient existe déjà, mettre à jour ses structures
          patientDocId = patientSnapshot.docs[0].id;
          patientRef = doc(db, 'patients', patientDocId);
          await updateDoc(patientRef, {
            structures: arrayUnion(structureData.id)
          });
        } else {
          // Créer un nouveau patient
          let patientData = {
            ...patientInfo,
            structures: [structureData.id],
            visibility: 'affiliated',
            createdAt: new Date().toISOString(),
            status: 'active'
          };
          
          const newPatientRef = await addDoc(collection(db, 'patients'), patientData);
          patientDocId = newPatientRef.id;
          patientRef = newPatientRef;
        }
        
        // Mettre à jour la demande avec commentaire
        await updateDoc(requestRef, {
          status: 'accepted',
          acceptedDate: new Date().toISOString(),
          patientDocId: patientDocId,
          notes: notes,
          respondedBy: {
            userId: auth.currentUser?.uid,
            name: auth.currentUser?.displayName || 'Administrateur',
            timestamp: new Date().toISOString()
          }
        });
        
        // Mettre à jour la liste des demandes
        setPatientRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
        
        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          totalPatients: prev.totalPatients + 1,
          pendingPatientRequests: prev.pendingPatientRequests - 1
        }));
        
      } else {
        // Refuser la demande avec commentaire
        await updateDoc(requestRef, {
          status: 'rejected',
          rejectionDate: new Date().toISOString(),
          notes: notes,
          respondedBy: {
            userId: auth.currentUser?.uid,
            name: auth.currentUser?.displayName || 'Administrateur',
            timestamp: new Date().toISOString()
          }
        });
        
        // Mettre à jour la liste des demandes
        setPatientRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
        
        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          pendingPatientRequests: prev.pendingPatientRequests - 1
        }));
      }
      
    } catch (error) {
      console.error('Erreur lors du traitement de la demande de patient:', error);
      alert('Une erreur est survenue lors du traitement de la demande.');
    }
  };

  // Fonction pour gérer les demandes de rendez-vous
  const handleAppointmentRequest = async (requestId, accepted, notes = '') => {
    try {
      const requestRef = doc(db, 'appointmentRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();
      
      if (accepted) {
        // Accepter la demande de rendez-vous
        await updateDoc(requestRef, {
          status: 'accepted',
          acceptedDate: new Date().toISOString(),
          notes: notes,
          respondedBy: {
            userId: auth.currentUser?.uid,
            name: auth.currentUser?.displayName || 'Administrateur',
            timestamp: new Date().toISOString()
          }
        });
        
        // Créer un rendez-vous dans la collection appointments
        await addDoc(collection(db, 'appointments'), {
          patientId: requestData.patientId,
          doctorId: requestData.doctorId,
          structureId: structureData.id,
          date: requestData.appointmentDate,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          requestId: requestId
        });
        
        // Mettre à jour la liste des demandes
        setAppointmentRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
        
        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          pendingAppointmentRequests: prev.pendingAppointmentRequests - 1
        }));
        
      } else {
        // Refuser la demande avec commentaire
        await updateDoc(requestRef, {
          status: 'rejected',
          rejectionDate: new Date().toISOString(),
          notes: notes,
          respondedBy: {
            userId: auth.currentUser?.uid,
            name: auth.currentUser?.displayName || 'Administrateur',
            timestamp: new Date().toISOString()
          }
        });
        
        // Mettre à jour la liste des demandes
        setAppointmentRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
        
        // Mettre à jour les statistiques
        setStats(prev => ({
          ...prev,
          pendingAppointmentRequests: prev.pendingAppointmentRequests - 1
        }));
      }
      
    } catch (error) {
      console.error('Erreur lors du traitement de la demande de rendez-vous:', error);
      alert('Une erreur est survenue lors du traitement de la demande.');
    }
  };

  // Fonction pour ouvrir le modal de notes et préparer la réponse
  const prepareResponse = (requestId, type, accepted) => {
    setCurrentRequestId(requestId);
    setCurrentRequestType(type);
    
    if (accepted) {
      // Si c'est une acceptation, traiter directement sans notes
      handleResponse(requestId, type, true);
    } else {
      // Si c'est un refus, ouvrir le modal pour les notes
      setShowNotesModal(true);
    }
  };

  // Fonction pour gérer la réponse finale
  const handleResponse = (requestId, type, accepted) => {
    switch (type) {
      case 'association':
        const request = associationRequests.find(req => req.id === requestId);
        handleAssociationResponse(requestId, request.doctorId, accepted);
        break;
      case 'patient':
        handlePatientRequest(requestId, accepted, rejectNote);
        break;
      case 'appointment':
        handleAppointmentRequest(requestId, accepted, rejectNote);
        break;
      default:
        console.error('Type de demande non reconnu');
    }
    
    // Réinitialiser les états
    setCurrentRequestId(null);
    setCurrentRequestType('');
    setRejectNote('');
    setShowNotesModal(false);
  };

  // Fonction pour soumettre la réponse avec notes
  const submitResponseWithNotes = () => {
    handleResponse(currentRequestId, currentRequestType, false);
  };

  // Fonctions pour la gestion des revenus
  const loadDoctorFees = async () => {
    try {
      // Récupérer les frais des médecins depuis la collection fees
      const feesQuery = query(
        collection(db, "fees"),
        where("structureId", "==", superStructureData?.structureDocId)
      );
      
      const feesSnapshot = await getDocs(feesQuery);
      const feesData = {};
      
      feesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        feesData[data.doctorId] = {
          percentage: data.percentage || 0,
          id: doc.id
        };
      });
      
      setDoctorFees(feesData);
      return feesData;
    } catch (error) {
      console.error("Erreur lors du chargement des frais:", error);
      return {};
    }
  };

  const loadCompletedAppointments = async () => {
    try {
      // Récupérer les rendez-vous terminés des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("structureId", "==", superStructureData?.structureDocId),
        where("status", "==", "completed")
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCompletedAppointments(appointmentsList);
      return appointmentsList;
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
      return [];
    }
  };

  const updateDoctorFee = async (doctorId, percentage) => {
    try {
      const feeValue = parseFloat(percentage);
      
      if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
        setMessage("Le pourcentage doit être un nombre entre 0 et 100");
        return;
      }
      
      // Vérifier si un enregistrement existe déjà pour ce médecin
      const existingFee = doctorFees[doctorId];
      
      if (existingFee) {
        // Mettre à jour l'enregistrement existant
        await updateDoc(doc(db, "fees", existingFee.id), {
          percentage: feeValue,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Créer un nouvel enregistrement
        const newFeeRef = await addDoc(collection(db, "fees"), {
          doctorId: doctorId,
          structureId: superStructureData.structureDocId,
          percentage: feeValue,
          createdAt: new Date().toISOString()
        });
        
        // Mettre à jour l'état local
        setDoctorFees(prev => ({
          ...prev,
          [doctorId]: {
            percentage: feeValue,
            id: newFeeRef.id
          }
        }));
      }
      
      // Mettre à jour l'état local
      setDoctorFees(prev => ({
        ...prev,
        [doctorId]: {
          ...prev[doctorId],
          percentage: feeValue
        }
      }));
      
      setMessage("Frais mis à jour avec succès");
      setNewFee('');
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour des frais:", error);
      setMessage("Erreur lors de la mise à jour des frais");
    }
  };

  const calculateDoctorRevenue = (doctorId) => {
    // Filtrer les rendez-vous complétés pour ce médecin
    const doctorAppointments = completedAppointments.filter(
      appointment => appointment.doctorId === doctorId
    );
    
    // Calculer le nombre total de rendez-vous
    const totalAppointments = doctorAppointments.length;
    
    // Calculer le revenu total (simulé - dans un cas réel, vous auriez des montants de consultation)
    // Supposons un prix moyen de consultation de 50€
    const averageAppointmentPrice = 50;
    const totalRevenue = totalAppointments * averageAppointmentPrice;
    
    // Calculer la part de la structure
    const feePercentage = doctorFees[doctorId]?.percentage || 0;
    const structureRevenue = totalRevenue * (feePercentage / 100);
    
    return {
      totalAppointments,
      totalRevenue,
      feePercentage,
      structureRevenue,
      doctorRevenue: totalRevenue - structureRevenue
    };
  };

  const showDoctorRevenueDetails = (doctorId) => {
    const doctor = doctors.find(doc => doc.id === doctorId);
    if (!doctor) return;
    
    setSelectedDoctorForDetails(doctor);
    setShowWeeklyDetails(true);
  };

  // Fonction pour générer les données hebdomadaires du médecin sélectionné
  const generateWeeklyData = (doctorId) => {
    // Créer un tableau pour les 4 dernières semaines
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7 + 6));
      
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));
      
      // Filtrer les rendez-vous de cette semaine pour ce médecin
      const weekAppointments = completedAppointments.filter(appointment => {
        const appointmentDate = appointment.date ? 
          (typeof appointment.date.toDate === 'function' ? 
            appointment.date.toDate() : new Date(appointment.date)) : null;
        
        return appointment.doctorId === doctorId && 
               appointmentDate && 
               appointmentDate >= weekStart && 
               appointmentDate <= weekEnd;
      });
      
      // Calculer le revenu pour cette semaine
      const averageAppointmentPrice = 50;
      const weekRevenue = weekAppointments.length * averageAppointmentPrice;
      const feePercentage = doctorFees[doctorId]?.percentage || 0;
      const structureRevenue = weekRevenue * (feePercentage / 100);
      
      weeks.push({
        weekLabel: `Semaine ${4-i}`,
        appointments: weekAppointments.length,
        revenue: weekRevenue,
        structureRevenue: structureRevenue,
        doctorRevenue: weekRevenue - structureRevenue
      });
    }
    
    return weeks;
  };

  // Fonction pour générer un résumé des revenus
  const generateRevenueSummary = () => {
    // Calculer le revenu total de la structure
    let totalStructureRevenue = 0;
    let totalAppointments = 0;
    let doctorsWithRevenue = 0;
    
    doctors.forEach(doctor => {
      const revenue = calculateDoctorRevenue(doctor.id);
      totalStructureRevenue += revenue.structureRevenue;
      totalAppointments += revenue.totalAppointments;
      
      if (revenue.totalAppointments > 0) {
        doctorsWithRevenue++;
      }
    });
    
    // Trouver le médecin qui génère le plus de revenus
    let topDoctorId = null;
    let topDoctorRevenue = 0;
    
    doctors.forEach(doctor => {
      const revenue = calculateDoctorRevenue(doctor.id);
      if (revenue.structureRevenue > topDoctorRevenue) {
        topDoctorRevenue = revenue.structureRevenue;
        topDoctorId = doctor.id;
      }
    });
    
    const topDoctor = doctors.find(doc => doc.id === topDoctorId);
    
    const summary = {
      totalStructureRevenue,
      totalAppointments,
      doctorsWithRevenue,
      averageRevenuePerDoctor: doctorsWithRevenue > 0 ? totalStructureRevenue / doctorsWithRevenue : 0,
      topDoctor: topDoctor ? {
        nom: topDoctor.nom,
        prenom: topDoctor.prenom,
        revenue: topDoctorRevenue
      } : null
    };
    
    setSummaryData(summary);
    setShowSummaryModal(true);
  };

  // Si l'application est en cours de chargement
  if (loading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status" variant="primary" />
        <p className="mt-3">Chargement du tableau de bord...</p>
      </div>
    );
  }

  // Si une erreur s'est produite
  if (error) {
    return (
      <div className="error-container">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar fixe */}
      <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <FaHospital className="sidebar-icon" />
            <h3 className="sidebar-title">{structureData?.name || "Structure"}</h3>
          </div>
          <Button 
            variant="link" 
            className="sidebar-toggle d-md-none"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <FaTimes />
          </Button>
        </div>
        
        
        
        <div className="sidebar-menu">
          <Nav className="flex-column">
            <Nav.Item>
            <Nav.Link 
              className={activeTab === 'structure' ? 'active' : ''}
              onClick={() => setActiveTab('structure')}
             >
              <FaHome className="menu-icon" />
              <span className="menu-text">Structure</span>
            </Nav.Link>

            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'doctors' ? 'active' : ''}
                onClick={() => setActiveTab('doctors')}
              >
                <FaUserMd className="menu-icon" />
                <span className="menu-text">Médecins</span>
                <Badge pill bg="primary" className="menu-badge">{doctors.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'patients' ? 'active' : ''}
                onClick={() => setActiveTab('patients')}
              >
                <FaUsers className="menu-icon" />
                <span className="menu-text">Patients</span>
                <Badge pill bg="success" className="menu-badge">{patients.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'associationRequests' ? 'active' : ''}
                onClick={() => setActiveTab('associationRequests')}
              >
                <FaHandshake className="menu-icon" />
                <span className="menu-text">Demandes d'association</span>
                <Badge 
                  pill 
                  bg={stats.pendingRequests > 0 ? "warning" : "secondary"} 
                  className="menu-badge"
                >
                  {associationRequests.length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'patientRequests' ? 'active' : ''}
                onClick={() => setActiveTab('patientRequests')}
              >
                <FaUsers className="menu-icon" />
                <span className="menu-text">Demandes de patients</span>
                <Badge 
                  pill 
                  bg={stats.pendingPatientRequests > 0 ? "info" : "secondary"} 
                  className="menu-badge"
                >
                  {patientRequests.length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'appointmentRequests' ? 'active' : ''}
                onClick={() => setActiveTab('appointmentRequests')}
              >
                <FaCalendarCheck className="menu-icon" />
                <span className="menu-text">Demandes de RDV</span>
                <Badge 
                  pill 
                  bg={stats.pendingAppointmentRequests > 0 ? "danger" : "secondary"} 
                  className="menu-badge"
                >
                  {appointmentRequests.length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                className={activeTab === 'revenue' ? 'active' : ''}
                onClick={() => setActiveTab('revenue')}
              >
                <FaPercentage className="menu-icon" />
                <span className="menu-text">Revenus</span>
                <Badge pill bg="success" className="menu-badge">
                  {doctors.filter(doctor => doctorFees[doctor.id] > 0).length}
                </Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>
        
        <div className="sidebar-footer">
          <Button 
            variant="outline-light" 
            size="sm"
            className="sidebar-btn"
            onClick={() => setShowStatsModal(true)}
          >
            <FaChartLine className="btn-icon" />
            <span className="btn-text">Statistiques</span>
          </Button>
          <Button 
            variant="outline-light" 
            size="sm"
            className="sidebar-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="btn-icon" />
            <span className="btn-text">Déconnexion</span>
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`main-content ${showSidebar ? 'shifted' : ''}`}>
        {/* Header mobile */}
        <div className="mobile-header d-md-none">
          <Button 
            variant="link" 
            className="menu-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <FaBars />
          </Button>
          <h4 className="mobile-title">{structureData?.name || "Dashboard"}</h4>
          <div className="mobile-actions">
            <Button 
              variant="outline-primary" 
              size="sm"
              className="rounded-circle"
              onClick={() => setShowStatsModal(true)}
            >
              <FaChartLine />
            </Button>
          </div>
        </div>

        <Container fluid className="py-3">
          {/* En-tête avec statistiques */}
          <Row className="mb-4 stats-header">
            <Col md={3} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title">Médecins</h6>
                      <h3 className="stats-value">{stats.totalDoctors}</h3>
                    </div>
                    <div className="stats-icon">
                      <FaUserMd />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title">Patients</h6>
                      <h3 className="stats-value">{stats.totalPatients}</h3>
                    </div>
                    <div className="stats-icon">
                      <FaUsers />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title">Taux d'acceptation</h6>
                      <h3 className="stats-value">{stats.acceptanceRate}%</h3>
                    </div>
                    <div className="stats-icon">
                      <FaCheck />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} className="mb-3">
              <Card className="stats-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="stats-title">Croissance</h6>
                      <h3 className="stats-value">
                        {stats.growthRate > 0 ? (
                          <span className="text-success">
                            <FaArrowUp className="me-1" />
                            {Math.abs(stats.growthRate).toFixed(1)}%
                          </span>
                        ) : stats.growthRate < 0 ? (
                          <span className="text-danger">
                            <FaArrowDown className="me-1" />
                            {Math.abs(stats.growthRate).toFixed(1)}%
                          </span>
                        ) : (
                          <span>0%</span>
                        )}
                      </h3>
                    </div>
                    <div className="stats-icon">
                      <FaChartLine />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Barre de recherche et filtres */}
          <Row className="mb-4">
            <Col md={6} className="mb-2 mb-md-0">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <Form.Control
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </Col>
            <Col md={3} className="mb-2 mb-md-0">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  <FaFilter className="me-2" />
                  Filtrer par statut
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setFilterStatus('all')}>
                    Tous
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setFilterStatus('pending')}>
                    En attente
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setFilterStatus('accepted')}>
                    Acceptés
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setFilterStatus('rejected')}>
                    Refusés
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col md={3}>
              <Button 
                variant="outline-primary" 
                className="w-100"
                onClick={() => {
                  switch (activeTab) {
                    case 'doctors':
                      exportToCSV(doctors, 'medecins');
                      break;
                    case 'patients':
                      exportToCSV(patients, 'patients');
                      break;
                    case 'associationRequests':
                      exportToCSV(associationRequests, 'demandes_association');
                      break;
                    case 'patientRequests':
                      exportToCSV(patientRequests, 'demandes_patients');
                      break;
                    case 'appointmentRequests':
                      exportToCSV(appointmentRequests, 'demandes_rdv');
                      break;
                    default:
                      break;
                  }
                }}
              >
                <FaDownload className="me-2" />
                Exporter
              </Button>
            </Col>
          </Row>

          {/* Contenu principal basé sur l'onglet actif */}
          <Tab.Container activeKey={activeTab}>
            <Tab.Content>
              {/* Onglet Structure */}
              <Tab.Pane eventKey="structure">
                <Card>
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Informations de la structure</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4} className="text-center mb-4">
                        <div className="structure-logo">
                          {structureData?.photoUrl ? (
                            <img 
                              src={structureData.photoUrl} 
                              alt={structureData.name} 
                              className="img-fluid rounded-circle"
                              style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="placeholder-logo">
                              <FaHospital size={64} />
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={8}>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <th width="30%">Nom</th>
                              <td>{structureData?.name || "Non spécifié"}</td>
                            </tr>
                            <tr>
                              <th>Responsable</th>
                              <td>{structureData?.responsible || "Non spécifié"}</td>
                            </tr>
                            <tr>
                              <th>Email</th>
                              <td>{structureData?.email || "Non spécifié"}</td>
                            </tr>
                            <tr>
                              <th>Téléphone</th>
                              <td>{structureData?.phone || "Non spécifié"}</td>
                            </tr>
                            <tr>
                              <th>Adresse</th>
                              <td>{structureData?.address || "Non spécifiée"}</td>
                            </tr>
                            <tr>
                              <th>Ville</th>
                              <td>{structureData?.city || "Non spécifiée"}</td>
                            </tr>
                            <tr>
                              <th>Code postal</th>
                              <td>{structureData?.zipCode || "Non spécifié"}</td>
                            </tr>
                            <tr>
                              <th>Description</th>
                              <td>{structureData?.description || "Aucune description"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Médecins */}
              <Tab.Pane eventKey="doctors">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Liste des médecins</h5>
                    <Badge bg="light" text="dark" pill>
                      {filterItems(doctors).length} médecin(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {filterItems(doctors).length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Spécialité</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterItems(doctors).map(doctor => (
                            <tr key={doctor.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {doctor.photoUrl ? (
                                      <img 
                                        src={doctor.photoUrl} 
                                        alt={`${doctor.prenom} ${doctor.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUserMd />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">{doctor.prenom} {doctor.nom}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {Array.isArray(doctor.specialite) 
                                  ? doctor.specialite.join(', ') 
                                  : doctor.specialite || "Non spécifiée"}
                              </td>
                              <td>{doctor.email}</td>
                              <td>{doctor.phone || "Non spécifié"}</td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => showDetails(doctor, 'doctor')}
                                >
                                  <FaEye /> Détails
                                </Button>
                                {activeTab === 'revenue' && (
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => showDoctorRevenueDetails(doctor.id)}
                                  >
                                    <FaChartLine /> Revenus
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <FaUserMd size={48} className="text-muted mb-3" />
                        <h5>Aucun médecin trouvé</h5>
                        <p className="text-muted">
                          {searchQuery ? 
                            "Aucun médecin ne correspond à votre recherche." : 
                            "Aucun médecin n'est associé à votre structure pour le moment."}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Patients */}
              <Tab.Pane eventKey="patients">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Liste des patients</h5>
                    <Badge bg="light" text="dark" pill>
                      {filterItems(patients).length} patient(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {filterItems(patients).length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Date de naissance</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterItems(patients).map(patient => (
                            <tr key={patient.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {patient.photoUrl ? (
                                      <img 
                                        src={patient.photoUrl} 
                                        alt={`${patient.prenom} ${patient.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUsers />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">{patient.prenom} {patient.nom}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{patient.email}</td>
                              <td>{patient.phone || "Non spécifié"}</td>
                              <td>
                                {patient.birthdate ? new Date(patient.birthdate).toLocaleDateString() : "Non spécifiée"}
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => showDetails(patient, 'patient')}
                                >
                                  <FaEye /> Détails
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <FaUsers size={48} className="text-muted mb-3" />
                        <h5>Aucun patient trouvé</h5>
                        <p className="text-muted">
                          {searchQuery ? 
                            "Aucun patient ne correspond à votre recherche." : 
                            "Aucun patient n'est associé à votre structure pour le moment."}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Demandes d'association */}
              <Tab.Pane eventKey="associationRequests">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Demandes d'association de médecins</h5>
                    <Badge bg="light" text="dark" pill>
                      {filterItems(associationRequests).length} demande(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {filterItems(associationRequests).length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Médecin</th>
                            <th>Spécialité</th>
                            <th>Date de demande</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterItems(associationRequests).map(request => (
                            <tr key={request.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {request.doctorInfo?.photoUrl ? (
                                      <img 
                                        src={request.doctorInfo.photoUrl} 
                                        alt={`${request.doctorInfo.prenom} ${request.doctorInfo.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUserMd />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">
                                      {request.doctorInfo?.prenom} {request.doctorInfo?.nom}
                                    </span>
                                    <div className="small text-muted">{request.doctorInfo?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {Array.isArray(request.doctorInfo?.specialite) 
                                  ? request.doctorInfo.specialite.join(', ') 
                                  : request.doctorInfo?.specialite || "Non spécifiée"}
                              </td>
                              <td>
                                {request.requestDate ? 
                                  new Date(
                                    typeof request.requestDate === 'object' && request.requestDate.seconds
                                      ? request.requestDate.seconds * 1000
                                      : request.requestDate
                                  ).toLocaleDateString() 
                                  : "Non spécifiée"}
                              </td>
                              <td>
                                <Badge bg={
                                  request.status === 'pending' ? 'warning' :
                                  request.status === 'accepted' ? 'success' :
                                  'danger'
                                }>
                                  {request.status === 'pending' ? 'En attente' :
                                   request.status === 'accepted' ? 'Acceptée' :
                                   'Refusée'}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => showDetails(request, 'associationRequest')}
                                >
                                  <FaEye /> Détails
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      className="me-2"
                                      onClick={() => prepareResponse(request.id, 'association', true)}
                                    >
                                      <FaCheck /> Accepter
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => prepareResponse(request.id, 'association', false)}
                                    >
                                      <FaTimes /> Refuser
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <FaHandshake size={48} className="text-muted mb-3" />
                        <h5>Aucune demande d'association</h5>
                        <p className="text-muted">
                          {searchQuery ? 
                            "Aucune demande ne correspond à votre recherche." : 
                            "Vous n'avez aucune demande d'association en attente pour le moment."}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Demandes de patients */}
              <Tab.Pane eventKey="patientRequests">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Demandes d'affiliation de patients</h5>
                    <Badge bg="light" text="dark" pill>
                      {filterItems(patientRequests).length} demande(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {filterItems(patientRequests).length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Email</th>
                            <th>Date de demande</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterItems(patientRequests).map(request => (
                            <tr key={request.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {request.patientInfo?.photoUrl ? (
                                      <img 
                                        src={request.patientInfo.photoUrl} 
                                        alt={`${request.patientInfo.prenom} ${request.patientInfo.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUsers />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">
                                      {request.patientInfo?.prenom} {request.patientInfo?.nom}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>{request.patientInfo?.email || "Non spécifié"}</td>
                              <td>
                                {request.requestDate ? 
                                  new Date(
                                    typeof request.requestDate === 'object' && request.requestDate.seconds
                                      ? request.requestDate.seconds * 1000
                                      : request.requestDate
                                  ).toLocaleDateString() 
                                  : "Non spécifiée"}
                              </td>
                              <td>
                                <Badge bg={
                                  request.status === 'pending' ? 'warning' :
                                  request.status === 'accepted' ? 'success' :
                                  'danger'
                                }>
                                  {request.status === 'pending' ? 'En attente' :
                                   request.status === 'accepted' ? 'Acceptée' :
                                   'Refusée'}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => showDetails(request, 'patientRequest')}
                                >
                                  <FaEye /> Détails
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      className="me-2"
                                      onClick={() => prepareResponse(request.id, 'patient', true)}
                                    >
                                      <FaCheck /> Accepter
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => prepareResponse(request.id, 'patient', false)}
                                    >
                                      <FaTimes /> Refuser
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <FaUsers size={48} className="text-muted mb-3" />
                        <h5>Aucune demande de patient</h5>
                        <p className="text-muted">
                          {searchQuery ? 
                            "Aucune demande ne correspond à votre recherche." : 
                            "Vous n'avez aucune demande d'affiliation de patient en attente pour le moment."}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Demandes de rendez-vous */}
              <Tab.Pane eventKey="appointmentRequests">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Demandes de rendez-vous</h5>
                    <Badge bg="light" text="dark" pill>
                      {filterItems(appointmentRequests).length} demande(s)
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {filterItems(appointmentRequests).length > 0 ? (
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Patient</th>
                            <th>Médecin</th>
                            <th>Date souhaitée</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filterItems(appointmentRequests).map(request => (
                            <tr key={request.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {request.patientInfo?.photoUrl ? (
                                      <img 
                                        src={request.patientInfo.photoUrl} 
                                        alt={`${request.patientInfo.prenom} ${request.patientInfo.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUsers />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">
                                      {request.patientInfo?.prenom} {request.patientInfo?.nom}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm me-2">
                                    {request.doctorInfo?.photoUrl ? (
                                      <img 
                                        src={request.doctorInfo.photoUrl} 
                                        alt={`${request.doctorInfo.prenom} ${request.doctorInfo.nom}`} 
                                        className="rounded-circle"
                                        width="40"
                                        height="40"
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <FaUserMd />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="fw-bold">
                                      Dr. {request.doctorInfo?.prenom} {request.doctorInfo?.nom}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                {request.appointmentDate ? 
                                  new Date(
                                    typeof request.appointmentDate === 'object' && request.appointmentDate.seconds
                                      ? request.appointmentDate.seconds * 1000
                                      : request.appointmentDate
                                  ).toLocaleDateString() 
                                  : "Non spécifiée"}
                              </td>
                              <td>
                                <Badge bg={
                                  request.status === 'pending' ? 'warning' :
                                  request.status === 'accepted' ? 'success' :
                                  'danger'
                                }>
                                  {request.status === 'pending' ? 'En attente' :
                                   request.status === 'accepted' ? 'Acceptée' :
                                   'Refusée'}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  className="me-2"
                                  onClick={() => showDetails(request, 'appointmentRequest')}
                                >
                                  <FaEye /> Détails
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline-success" 
                                      size="sm"
                                      className="me-2"
                                      onClick={() => prepareResponse(request.id, 'appointment', true)}
                                    >
                                      <FaCheck /> Accepter
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => prepareResponse(request.id, 'appointment', false)}
                                    >
                                      <FaTimes /> Refuser
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <FaCalendarCheck size={48} className="text-muted mb-3" />
                        <h5>Aucune demande de rendez-vous</h5>
                        <p className="text-muted">
                          {searchQuery ? 
                            "Aucune demande ne correspond à votre recherche." : 
                            "Vous n'avez aucune demande de rendez-vous en attente pour le moment."}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              {/* Onglet Revenus */}
              <Tab.Pane eventKey="revenue">
                <Card className="mb-4">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Gestion des revenus</h5>
                    <Button 
                      variant="light" 
                      size="sm"
                      onClick={generateRevenueSummary}
                    >
                      <FaChartLine className="me-2" />
                      Voir le résumé
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-4">
                      <Col md={12}>
                        <Alert variant="info">
                          <FaInfoCircle className="me-2" />
                          Définissez le pourcentage des frais que votre structure prélève sur les consultations de chaque médecin.
                        </Alert>
                      </Col>
                    </Row>
                    
                    {message && (
                      <Alert 
                        variant={message.includes('succès') ? 'success' : 'danger'}
                        onClose={() => setMessage('')}
                        dismissible
                      >
                        {message}
                      </Alert>
                    )}
                    
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Spécialité</th>
                          <th>Pourcentage actuel</th>
                          <th>Nouveau pourcentage</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterItems(doctors).map(doctor => (
                          <tr key={doctor.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar-sm me-2">
                                  {doctor.photoUrl ? (
                                    <img 
                                      src={doctor.photoUrl} 
                                      alt={`${doctor.prenom} ${doctor.nom}`} 
                                      className="rounded-circle"
                                      width="40"
                                      height="40"
                                    />
                                  ) : (
                                    <div className="avatar-placeholder">
                                      <FaUserMd />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="fw-bold">{doctor.prenom} {doctor.nom}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              {Array.isArray(doctor.specialite) 
                                ? doctor.specialite.join(', ') 
                                : doctor.specialite || "Non spécifiée"}
                            </td>
                            <td>
                              <Badge bg={
                                doctorFees[doctor.id]?.percentage > 0 ? 'success' : 'secondary'
                              }>
                                {doctorFees[doctor.id]?.percentage || 0}%
                              </Badge>
                            </td>
                            <td>
                              <Form.Control 
                                type="number" 
                                min="0" 
                                max="100"
                                placeholder="Pourcentage"
                                value={selectedDoctor === doctor.id ? newFee : ''}
                                onChange={(e) => {
                                  setSelectedDoctor(doctor.id);
                                  setNewFee(e.target.value);
                                }}
                              />
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="me-2"
                                onClick={() => updateDoctorFee(doctor.id, newFee)}
                                disabled={selectedDoctor !== doctor.id || !newFee}
                              >
                                <FaCheck /> Appliquer
                              </Button>
                              <Button 
                                variant="outline-info" 
                                size="sm"
                                onClick={() => showDoctorRevenueDetails(doctor.id)}
                              >
                                <FaChartLine /> Statistiques
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Container>
      </div>

      {/* Modal pour afficher les détails */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItemType === 'doctor' && 'Détails du médecin'}
            {selectedItemType === 'patient' && 'Détails du patient'}
            {selectedItemType === 'associationRequest' && 'Détails de la demande d\'association'}
            {selectedItemType === 'patientRequest' && 'Détails de la demande de patient'}
            {selectedItemType === 'appointmentRequest' && 'Détails de la demande de rendez-vous'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              {/* Détails du médecin */}
              {selectedItemType === 'doctor' && (
                <Row>
                  <Col md={4} className="text-center mb-4">
                    <div className="detail-avatar">
                      {selectedItem.photoUrl ? (
                        <img 
                          src={selectedItem.photoUrl} 
                          alt={`${selectedItem.prenom} ${selectedItem.nom}`} 
                          className="img-fluid rounded-circle"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="placeholder-avatar">
                          <FaUserMd size={64} />
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col md={8}>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <th width="30%">Nom</th>
                          <td>{selectedItem.prenom} {selectedItem.nom}</td>
                        </tr>
                        <tr>
                          <th>Spécialité</th>
                          <td>
                            {Array.isArray(selectedItem.specialite) 
                              ? selectedItem.specialite.join(', ') 
                              : selectedItem.specialite || "Non spécifiée"}
                          </td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>{selectedItem.email}</td>
                        </tr>
                        <tr>
                          <th>Téléphone</th>
                          <td>{selectedItem.phone || "Non spécifié"}</td>
                        </tr>
                        <tr>
                          <th>Adresse</th>
                          <td>{selectedItem.address || "Non spécifiée"}</td>
                        </tr>
                        <tr>
                          <th>Ville</th>
                          <td>{selectedItem.city || "Non spécifiée"}</td>
                        </tr>
                        <tr>
                          <th>Code postal</th>
                          <td>{selectedItem.zipCode || "Non spécifié"}</td>
                        </tr>
                        <tr>
                          <th>Description</th>
                          <td>{selectedItem.description || "Aucune description"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              )}

              {/* Détails du patient */}
              {selectedItemType === 'patient' && (
                <Row>
                  <Col md={4} className="text-center mb-4">
                    <div className="detail-avatar">
                      {selectedItem.photoUrl ? (
                        <img 
                          src={selectedItem.photoUrl} 
                          alt={`${selectedItem.prenom} ${selectedItem.nom}`} 
                          className="img-fluid rounded-circle"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="placeholder-avatar">
                          <FaUsers size={64} />
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col md={8}>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <th width="30%">Nom</th>
                          <td>{selectedItem.prenom} {selectedItem.nom}</td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>{selectedItem.email}</td>
                        </tr>
                        <tr>
                          <th>Téléphone</th>
                          <td>{selectedItem.phone || "Non spécifié"}</td>
                        </tr>
                        <tr>
                          <th>Date de naissance</th>
                          <td>
                            {selectedItem.birthdate ? 
                              new Date(selectedItem.birthdate).toLocaleDateString() : 
                              "Non spécifiée"}
                          </td>
                        </tr>
                        <tr>
                          <th>Adresse</th>
                          <td>{selectedItem.address || "Non spécifiée"}</td>
                        </tr>
                        <tr>
                          <th>Ville</th>
                          <td>{selectedItem.city || "Non spécifiée"}</td>
                        </tr>
                        <tr>
                          <th>Code postal</th>
                          <td>{selectedItem.zipCode || "Non spécifié"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              )}

              {/* Détails de la demande d'association */}
              {selectedItemType === 'associationRequest' && (
                <>
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Informations sur le médecin</h5>
                      <Card>
                        <Card.Body>
                          <Row>
                            <Col md={3} className="text-center">
                              <div className="detail-avatar">
                                {selectedItem.doctorInfo?.photoUrl ? (
                                  <img 
                                    src={selectedItem.doctorInfo                                    .photoUrl} 
                                    alt={`${selectedItem.doctorInfo.prenom} ${selectedItem.doctorInfo.nom}`} 
                                    className="img-fluid rounded-circle"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="placeholder-avatar">
                                    <FaUserMd size={48} />
                                  </div>
                                )}
                              </div>
                            </Col>
                            <Col md={9}>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <th width="30%">Nom</th>
                                    <td>{selectedItem.doctorInfo?.prenom} {selectedItem.doctorInfo?.nom}</td>
                                  </tr>
                                  <tr>
                                    <th>Spécialité</th>
                                    <td>
                                      {Array.isArray(selectedItem.doctorInfo?.specialite) 
                                        ? selectedItem.doctorInfo.specialite.join(', ') 
                                        : selectedItem.doctorInfo?.specialite || "Non spécifiée"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>Email</th>
                                    <td>{selectedItem.doctorInfo?.email}</td>
                                  </tr>
                                  <tr>
                                    <th>Téléphone</th>
                                    <td>{selectedItem.doctorInfo?.phone || "Non spécifié"}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <h5>Détails de la demande</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <th width="30%">Date de demande</th>
                            <td>
                              {selectedItem.requestDate ? 
                                new Date(
                                  typeof selectedItem.requestDate === 'object' && selectedItem.requestDate.seconds
                                    ? selectedItem.requestDate.seconds * 1000
                                    : selectedItem.requestDate
                                ).toLocaleDateString() 
                                : "Non spécifiée"}
                            </td>
                          </tr>
                          <tr>
                            <th>Statut</th>
                            <td>
                              <Badge bg={
                                selectedItem.status === 'pending' ? 'warning' :
                                selectedItem.status === 'accepted' ? 'success' :
                                'danger'
                              }>
                                {selectedItem.status === 'pending' ? 'En attente' :
                                 selectedItem.status === 'accepted' ? 'Acceptée' :
                                 'Refusée'}
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <th>Message du médecin</th>
                            <td>{selectedItem.message || "Aucun message"}</td>
                          </tr>
                          {selectedItem.status === 'accepted' && (
                            <tr>
                              <th>Date d'acceptation</th>
                              <td>
                                {selectedItem.acceptedDate ? 
                                  new Date(selectedItem.acceptedDate).toLocaleDateString() : 
                                  "Non spécifiée"}
                              </td>
                            </tr>
                          )}
                          {selectedItem.status === 'rejected' && (
                            <>
                              <tr>
                                <th>Date de refus</th>
                                <td>
                                  {selectedItem.rejectionDate ? 
                                    new Date(selectedItem.rejectionDate).toLocaleDateString() : 
                                    "Non spécifiée"}
                                </td>
                              </tr>
                              <tr>
                                <th>Raison du refus</th>
                                <td>{selectedItem.rejectionReason || "Non spécifiée"}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </>
              )}

              {/* Détails de la demande de patient */}
              {selectedItemType === 'patientRequest' && (
                <>
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Informations sur le patient</h5>
                      <Card>
                        <Card.Body>
                          <Row>
                            <Col md={3} className="text-center">
                              <div className="detail-avatar">
                                {selectedItem.patientInfo?.photoUrl ? (
                                  <img 
                                    src={selectedItem.patientInfo.photoUrl} 
                                    alt={`${selectedItem.patientInfo.prenom} ${selectedItem.patientInfo.nom}`} 
                                    className="img-fluid rounded-circle"
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="placeholder-avatar">
                                    <FaUsers size={48} />
                                  </div>
                                )}
                              </div>
                            </Col>
                            <Col md={9}>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <th width="30%">Nom</th>
                                    <td>{selectedItem.patientInfo?.prenom} {selectedItem.patientInfo?.nom}</td>
                                  </tr>
                                  <tr>
                                    <th>Email</th>
                                    <td>{selectedItem.patientInfo?.email}</td>
                                  </tr>
                                  <tr>
                                    <th>Téléphone</th>
                                    <td>{selectedItem.patientInfo?.phone || "Non spécifié"}</td>
                                  </tr>
                                  <tr>
                                    <th>Date de naissance</th>
                                    <td>
                                      {selectedItem.patientInfo?.birthdate ? 
                                        new Date(selectedItem.patientInfo.birthdate).toLocaleDateString() : 
                                        "Non spécifiée"}
                                    </td>
                                  </tr>
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <h5>Détails de la demande</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <th width="30%">Date de demande</th>
                            <td>
                              {selectedItem.requestDate ? 
                                new Date(
                                  typeof selectedItem.requestDate === 'object' && selectedItem.requestDate.seconds
                                    ? selectedItem.requestDate.seconds * 1000
                                    : selectedItem.requestDate
                                ).toLocaleDateString() 
                                : "Non spécifiée"}
                            </td>
                          </tr>
                          <tr>
                            <th>Statut</th>
                            <td>
                              <Badge bg={
                                selectedItem.status === 'pending' ? 'warning' :
                                selectedItem.status === 'accepted' ? 'success' :
                                'danger'
                              }>
                                {selectedItem.status === 'pending' ? 'En attente' :
                                 selectedItem.status === 'accepted' ? 'Acceptée' :
                                 'Refusée'}
                              </Badge>
                            </td>
                          </tr>
                          <tr>
                            <th>Message du patient</th>
                            <td>{selectedItem.message || "Aucun message"}</td>
                          </tr>
                          {selectedItem.status !== 'pending' && (
                            <tr>
                              <th>Notes</th>
                              <td>{selectedItem.notes || "Aucune note"}</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </>
              )}

              {/* Détails de la demande de rendez-vous */}
              {selectedItemType === 'appointmentRequest' && (
                <>
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Informations sur le patient</h5>
                      <Card>
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3">
                            <div className="detail-avatar me-3">
                              {selectedItem.patientInfo?.photoUrl ? (
                                <img 
                                  src={selectedItem.patientInfo.photoUrl} 
                                  alt={`${selectedItem.patientInfo.prenom} ${selectedItem.patientInfo.nom}`} 
                                  className="rounded-circle"
                                  width="60"
                                  height="60"
                                />
                              ) : (
                                <div className="placeholder-avatar">
                                  <FaUsers size={32} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h6 className="mb-0">{selectedItem.patientInfo?.prenom} {selectedItem.patientInfo?.nom}</h6>
                              <p className="text-muted mb-0">{selectedItem.patientInfo?.email}</p>
                            </div>
                          </div>
                          <Table borderless size="sm">
                            <tbody>
                              <tr>
                                <th>Téléphone</th>
                                <td>{selectedItem.patientInfo?.phone || "Non spécifié"}</td>
                              </tr>
                              <tr>
                                <th>Date de naissance</th>
                                <td>
                                  {selectedItem.patientInfo?.birthdate ? 
                                    new Date(selectedItem.patientInfo.birthdate).toLocaleDateString() : 
                                    "Non spécifiée"}
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <h5>Informations sur le médecin</h5>
                      <Card>
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3">
                            <div className="detail-avatar me-3">
                              {selectedItem.doctorInfo?.photoUrl ? (
                                <img 
                                  src={selectedItem.doctorInfo.photoUrl} 
                                  alt={`${selectedItem.doctorInfo.prenom} ${selectedItem.doctorInfo.nom}`} 
                                  className="rounded-circle"
                                  width="60"
                                  height="60"
                                />
                              ) : (
                                <div className="placeholder-avatar">
                                  <FaUserMd size={32} />
                                </div>
                              )}
                            </div>
                            <div>
                              <h6 className="mb-0">Dr. {selectedItem.doctorInfo?.prenom} {selectedItem.doctorInfo?.nom}</h6>
                              <p className="text-muted mb-0">{selectedItem.doctorInfo?.email}</p>
                            </div>
                          </div>
                          <Table borderless size="sm">
                            <tbody>
                              <tr>
                                <th>Spécialité</th>
                                <td>
                                  {Array.isArray(selectedItem.doctorInfo?.specialite) 
                                    ? selectedItem.doctorInfo.specialite.join(', ') 
                                    : selectedItem.doctorInfo?.specialite || "Non spécifiée"}
                                </td>
                              </tr>
                              <tr>
                                <th>Téléphone</th>
                                <td>{selectedItem.doctorInfo?.phone || "Non spécifié"}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <h5>Détails du rendez-vous</h5>
                      <Card>
                        <Card.Body>
                          <Table bordered>
                            <tbody>
                              <tr>
                                <th width="30%">Date souhaitée</th>
                                <td>
                                  {selectedItem.appointmentDate ? 
                                    new Date(
                                      typeof selectedItem.appointmentDate === 'object' && selectedItem.appointmentDate.seconds
                                        ? selectedItem.appointmentDate.seconds * 1000
                                        : selectedItem.appointmentDate
                                    ).toLocaleDateString() + ' à ' +
                                    new Date(
                                      typeof selectedItem.appointmentDate === 'object' && selectedItem.appointmentDate.seconds
                                        ? selectedItem.appointmentDate.seconds * 1000
                                        : selectedItem.appointmentDate
                                    ).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    : "Non spécifiée"}
                                </td>
                              </tr>
                              <tr>
                                <th>Motif</th>
                                <td>{selectedItem.reason || "Non spécifié"}</td>
                              </tr>
                              <tr>
                                <th>Statut</th>
                                <td>
                                  <Badge bg={
                                    selectedItem.status === 'pending' ? 'warning' :
                                    selectedItem.status === 'accepted' ? 'success' :
                                    'danger'
                                  }>
                                    {selectedItem.status === 'pending' ? 'En attente' :
                                    selectedItem.status === 'accepted' ? 'Acceptée' :
                                    'Refusée'}
                                  </Badge>
                                </td>
                              </tr>
                              <tr>
                                <th>Date de demande</th>
                                <td>
                                  {selectedItem.requestDate ? 
                                    new Date(
                                      typeof selectedItem.requestDate === 'object' && selectedItem.requestDate.seconds
                                        ? selectedItem.requestDate.seconds * 1000
                                        : selectedItem.requestDate
                                    ).toLocaleDateString() 
                                    : "Non spécifiée"}
                                </td>
                              </tr>
                              {selectedItem.status !== 'pending' && (
                                <tr>
                                  <th>Notes</th>
                                  <td>{selectedItem.notes || "Aucune note"}</td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour les notes de rejet */}
      <Modal
        show={showNotesModal}
        onHide={() => setShowNotesModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Motif de refus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Veuillez indiquer le motif du refus (optionnel)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez cette demande..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={submitResponseWithNotes}>
            Refuser la demande
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour les statistiques */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Statistiques de la structure</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={12}>
              <h5>Évolution mensuelle</h5>
              <div className="chart-container">
                <Line 
                  data={{
                    labels: monthlyStats.map(stat => stat.month),
                    datasets: [
                      {
                        label: 'Nouveaux médecins',
                        data: monthlyStats.map(stat => stat.newDoctors),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.4
                      },
                      {
                        label: 'Nouveaux patients',
                        data: monthlyStats.map(stat => stat.newPatients),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4
                      },
                      {
                        label: 'Rendez-vous',
                        data: monthlyStats.map(stat => stat.appointments),
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Évolution sur les 6 derniers mois'
                      }
                    }
                  }}
                />
              </div>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={6}>
              <h5>Répartition des demandes</h5>
              <div className="chart-container">
                <Pie 
                  data={{
                    labels: ['Médecins', 'Patients', 'Rendez-vous'],
                    datasets: [
                      {
                        data: [
                          stats.pendingRequests,
                          stats.pendingPatientRequests,
                          stats.pendingAppointmentRequests
                        ],
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.6)',
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(255, 159, 64, 0.6)'
                        ],
                        borderColor: [
                          'rgba(54, 162, 235, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      },
                      title: {
                        display: true,
                        text: 'Demandes en attente'
                      }
                    }
                  }}
                />
              </div>
            </Col>
            <Col md={6}>
              <h5>Taux d'acceptation</h5>
              <div className="chart-container">
                <Bar 
                  data={{
                    labels: monthlyStats.map(stat => stat.month),
                    datasets: [
                      {
                        label: 'Taux d\'acceptation (%)',
                        data: monthlyStats.map(stat => stat.acceptanceRate),
                        backgroundColor: 'rgba(153, 102, 255, 0.6)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false
                      },
                      title: {
                        display: true,
                        text: 'Évolution du taux d\'acceptation'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <h5>Résumé des statistiques</h5>
              <ListGroup>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Nombre total de médecins
                  <Badge bg="primary" pill>{stats.totalDoctors}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Nombre total de patients
                  <Badge bg="success" pill>{stats.totalPatients}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Demandes en attente
                  <Badge bg="warning" pill>
                    {stats.pendingRequests + stats.pendingPatientRequests + stats.pendingAppointmentRequests}
                  </Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Taux d'acceptation global
                  <Badge bg="info" pill>{stats.acceptanceRate}%</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  Taux de croissance
                  <Badge bg={stats.growthRate >= 0 ? "success" : "danger"} pill>
                    {stats.growthRate >= 0 ? "+" : ""}{stats.growthRate.toFixed(1)}%
                  </Badge>
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              const statsData = [
                {
                  label: 'Statistiques générales',
                  totalDoctors: stats.totalDoctors,
                  totalPatients: stats.totalPatients,
                  pendingRequests: stats.pendingRequests + stats.pendingPatientRequests + stats.pendingAppointmentRequests,
                  acceptanceRate: stats.acceptanceRate,
                  growthRate: stats.growthRate
                }
              ];
              exportToCSV(statsData, 'statistiques_structure');
            }}
          >
            <FaDownload className="me-2" />
            Exporter les statistiques
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal pour les détails des revenus hebdomadaires */}
      <Modal
        show={showWeeklyDetails}
        onHide={() => setShowWeeklyDetails(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Détails des revenus - Dr. {selectedDoctorForDetails?.prenom} {selectedDoctorForDetails?.nom}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDoctorForDetails && (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <div className="detail-avatar me-3">
                          {selectedDoctorForDetails.photoUrl ? (
                            <img 
                              src={selectedDoctorForDetails.photoUrl} 
                              alt={`${selectedDoctorForDetails.prenom} ${selectedDoctorForDetails.nom}`} 
                              className="rounded-circle"
                              width="60"
                              height="60"
                            />
                          ) : (
                            <div className="placeholder-avatar">
                              <FaUserMd size={32} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="mb-0">Dr. {selectedDoctorForDetails.prenom} {selectedDoctorForDetails.nom}</h5>
                          <p className="text-muted mb-0">
                            {Array.isArray(selectedDoctorForDetails.specialite) 
                              ? selectedDoctorForDetails.specialite.join(', ') 
                              : selectedDoctorForDetails.specialite || "Non spécifiée"}
                          </p>
                        </div>
                      </div>
                      <hr />
                      <Row>
                        <Col md={4}>
                          <div className="stat-card">
                            <h6 className="stat-title">Pourcentage de frais</h6>
                            <h3 className="stat-value">{doctorFees[selectedDoctorForDetails.id]?.percentage || 0}%</h3>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="stat-card">
                            <h6 className="stat-title">Rendez-vous complétés</h6>
                            <h3 className="stat-value">
                              {calculateDoctorRevenue(selectedDoctorForDetails.id).totalAppointments}
                            </h3>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="stat-card">
                            <h6 className="stat-title">Revenu pour la structure</h6>
                            <h3 className="stat-value">
                              {calculateDoctorRevenue(selectedDoctorForDetails.id).structureRevenue}€
                            </h3>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={12}>
                  <h5>Évolution hebdomadaire</h5>
                  <div className="chart-container">
                    <Bar 
                      data={{
                        labels: generateWeeklyData(selectedDoctorForDetails.id).map(week => week.weekLabel),
                        datasets: [
                          {
                            label: 'Revenu de la structure (€)',
                            data: generateWeeklyData(selectedDoctorForDetails.id).map(week => week.structureRevenue),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                          },
                          {
                            label: 'Revenu du médecin (€)',
                            data: generateWeeklyData(selectedDoctorForDetails.id).map(week => week.doctorRevenue),
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Revenus des 4 dernières semaines'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Montant (€)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col md={12}>
                  <h5>Détails des rendez-vous</h5>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Semaine</th>
                        <th>Nombre de RDV</th>
                        <th>Revenu total</th>
                        <th>Part structure</th>
                        <th>Part médecin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generateWeeklyData(selectedDoctorForDetails.id).map((week, index) => (
                        <tr key={index}>
                          <td>{week.weekLabel}</td>
                          <td>{week.appointments}</td>
                          <td>{week.revenue}€</td>
                          <td>{week.structureRevenue.toFixed(2)}€</td>
                          <td>{week.doctorRevenue.toFixed(2)}€</td>
                        </tr>
                      ))}
                      <tr className="table-active fw-bold">
                        <td>Total</td>
                        <td>
                          {generateWeeklyData(selectedDoctorForDetails.id)
                            .reduce((sum, week) => sum + week.appointments, 0)}
                        </td>
                        <td>
                          {generateWeeklyData(selectedDoctorForDetails.id)
                            .reduce((sum, week) => sum + week.revenue, 0)}€
                        </td>
                        <td>
                          {generateWeeklyData(selectedDoctorForDetails.id)
                            .reduce((sum, week) => sum + week.structureRevenue, 0).toFixed(2)}€
                            </td>
                            <td>
                              {generateWeeklyData(selectedDoctorForDetails.id)
                                .reduce((sum, week) => sum + week.doctorRevenue, 0).toFixed(2)}€
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowWeeklyDetails(false)}>
                Fermer
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  const revenueData = generateWeeklyData(selectedDoctorForDetails.id);
                  exportToCSV(revenueData, `revenus_${selectedDoctorForDetails.nom}_${selectedDoctorForDetails.prenom}`);
                }}
              >
                <FaDownload className="me-2" />
                Exporter les données
              </Button>
            </Modal.Footer>
          </Modal>
    
          {/* Modal pour le résumé des revenus */}
          <Modal
            show={showSummaryModal}
            onHide={() => setShowSummaryModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Résumé des revenus</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {summaryData && (
                <>
                  <Row className="mb-4">
                    <Col md={12}>
                      <Card className="summary-card">
                        <Card.Body>
                          <h3 className="text-center mb-4">Revenu total de la structure</h3>
                          <div className="revenue-amount">
                            {summaryData.totalStructureRevenue.toFixed(2)}€
                          </div>
                          <p className="text-center text-muted">
                            Basé sur {summaryData.totalAppointments} rendez-vous complétés
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="stat-summary-card">
                        <div className="stat-icon">
                          <FaUserMd />
                        </div>
                        <div className="stat-info">
                          <h6>Médecins actifs</h6>
                          <h4>{summaryData.doctorsWithRevenue}</h4>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="stat-summary-card">
                        <div className="stat-icon">
                          <FaPercentage />
                        </div>
                        <div className="stat-info">
                          <h6>Revenu moyen par médecin</h6>
                          <h4>{summaryData.averageRevenuePerDoctor.toFixed(2)}€</h4>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  {summaryData.topDoctor && (
                    <Row>
                      <Col md={12}>
                        <Card>
                          <Card.Header className="bg-success text-white">
                            <h5 className="mb-0">Médecin le plus rentable</h5>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex align-items-center">
                              <div className="top-doctor-icon">
                                <FaUserMd size={32} />
                              </div>
                              <div className="ms-3">
                                <h5>Dr. {summaryData.topDoctor.prenom} {summaryData.topDoctor.nom}</h5>
                                <p className="mb-0">
                                  Revenu généré: <strong>{summaryData.topDoctor.revenue.toFixed(2)}€</strong>
                                </p>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSummaryModal(false)}>
                Fermer
              </Button>
            </Modal.Footer>
          </Modal>
          <style jsx>
      {
        `
        /* Styles généraux */
body {
  background-color: #f5f8fa;
  font-family: 'Roboto', sans-serif;
}

/* Styles pour le conteneur principal */
.dashboard-container {
  display: flex;
  min-height: 100vh;
}

/* Styles pour la sidebar */
.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #4a6baf 0%, #1d3a6e 100%);
  color: white;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  margin-left: 10px;
}

.sidebar-icon {
  font-size: 1.5rem;
}

.sidebar-profile {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info h6 {
  margin: 0;
  font-weight: 500;
}

.profile-info p {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-menu .nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.8rem 1.5rem;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.sidebar-menu .nav-link:hover,
.sidebar-menu .nav-link.active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-icon {
  margin-right: 10px;
  font-size: 1.1rem;
}

.menu-text {
  flex: 1;
}

.menu-badge {
  margin-left: 5px;
}

.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
}

.sidebar-btn {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48%;
}

.btn-icon {
  margin-right: 8px;
}

/* Styles pour le contenu principal */
.main-content {
  flex: 1;
  margin-left: 280px;
  transition: all 0.3s ease;
}

/* Styles pour les cartes de statistiques */
.stats-card {
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stats-title {
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 5px;
}

.stats-value {
  font-weight: 600;
  font-size: 1.8rem;
  margin: 0;
}

.stats-icon {
  font-size: 2rem;
  opacity: 0.7;
}

/* Styles pour la barre de recherche */
.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  padding-left: 40px;
  border-radius: 20px;
}

/* Styles pour les avatars */
.avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
  color: #6c757d;
  border-radius: 50%;
}

/* Styles pour les graphiques */
.chart-container {
  height: 300px;
  position: relative;
  margin-bottom: 1rem;
}

/* Styles pour les écrans mobiles */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(-100%);
    width: 240px;
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .main-content.shifted {
    margin-left: 240px;
  }
  
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .menu-toggle {
    padding: 0.5rem;
    font-size: 1.2rem;
  }
  
  .mobile-title {
    margin: 0;
    font-size: 1.2rem;
  }
}

/* Styles pour les détails modaux */
.detail-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.placeholder-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
  color: #6c757d;
  border-radius: 50%;
}

/* Styles pour le résumé des revenus */
.summary-card {
  text-align: center;
  border: none;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.revenue-amount {
  font-size: 3rem;
  font-weight: 700;
  color: #28a745;
  text-align: center;
  margin: 1rem 0;
}

.stat-summary-card {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
}

.stat-icon {
  font-size: 2rem;
  padding: 1rem;
  border-radius: 50%;
  background-color: #f0f2f5;
  color: #4a6baf;
  margin-right: 1rem;
}

.stat-info h6 {
  margin: 0;
  color: #6c757d;
}

.stat-info h4 {
  margin: 0;
  font-weight: 600;
}

.top-doctor-icon {
  padding: 1rem;
  border-radius: 50%;
  background-color: #e9f7ef;
  color: #28a745;
}

/* Styles pour la page de chargement */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

/* Styles pour la page d'erreur */
.error-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}

        `
      }
        </style>
        </div>
      
      );
    };
    
    export default Manager;
  