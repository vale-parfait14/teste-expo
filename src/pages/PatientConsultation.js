import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal, Spinner, Badge, Tabs, Tab, InputGroup, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, deleteDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUserMd, FaCalendarAlt, FaClock, FaHospital, FaSearch, FaFilter, FaClipboardList, FaRegClock, FaStar, FaMapMarkerAlt, FaVideo, FaFileUpload, FaTrash, FaHeart, FaRegHeart, FaFileAlt, FaHistory, FaInfoCircle, FaRegCalendarCheck, FaMoneyBillWave, FaLanguage } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useMediaQuery } from 'react-responsive';

const PatientConsultation = () => {
  // États principaux
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [specialities, setSpecialities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultationRequest, setConsultationRequest] = useState({
    preferredDay: '',
    preferredTimeStart: '',
    preferredTimeEnd: '',
    reason: '',
    urgency: 'normale',
    type: 'presentiel',
    documents: [],
    symptoms: [],
    notes: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [favoritesDoctors, setFavoritesDoctors] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [insuranceOptions, setInsuranceOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(6);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomOptions] = useState([
    { value: 'fievre', label: 'Fièvre' },
    { value: 'toux', label: 'Toux' },
    { value: 'maux_tete', label: 'Maux de tête' },
    { value: 'fatigue', label: 'Fatigue' },
    { value: 'douleurs_musculaires', label: 'Douleurs musculaires' },
    { value: 'nausees', label: 'Nausées' },
    { value: 'diarrhee', label: 'Diarrhée' },
    { value: 'essoufflement', label: 'Essoufflement' },
    { value: 'perte_gout_odorat', label: 'Perte de goût/odorat' },
    { value: 'eruption_cutanee', label: 'Éruption cutanée' }
  ]);
  
  // Références
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 767 });
    // Ajoutez ces états au début du composant avec les autres états
    const [showAcceptedRequestsModal, setShowAcceptedRequestsModal] = useState(false);
    const [acceptedRequests, setAcceptedRequests] = useState([]);
    const [loadingAcceptedRequests, setLoadingAcceptedRequests] = useState(false);

    // Ajout dans les états au début du composant
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [respondedRequests, setRespondedRequests] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [showAcceptedConsultations, setShowAcceptedConsultations] = useState(false);

  // Récupérer les données du patient connecté
  const patientData = JSON.parse(localStorage.getItem('patientData'));
// Ajoutez cette fonction pour récupérer les demandes acceptées
const fetchAcceptedRequests = async () => {
  if (!patientData) return;
  
  try {
    setLoadingAcceptedRequests(true);
    const requestsQuery = query(
      collection(db, 'consultationRequests'),
      where('patientId', '==', patientData.uid),
      where('status', '==', 'accepted')
    );
    
    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setAcceptedRequests(requests);
    setLoadingAcceptedRequests(false);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes acceptées:', error);
    setLoadingAcceptedRequests(false);
  }
};


  useEffect(() => {
    if (!patientData) {
      setMessage('Veuillez vous connecter pour accéder à cette fonctionnalité');
      setLoading(false);
      return;
    }
    
    fetchDoctors();
    fetchPendingRequests();
    fetchFavorites();
    fetchRespondedRequests(); // Ajouter cette ligne
    fetchConsultationHistory();
    fetchAcceptedRequests(); // Ajoutez cette ligne

    
    // Préférence de thème
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Écouteur en temps réel pour les demandes
    const requestsQuery = query(
      collection(db, 'consultationRequests'),
      where('patientId', '==', patientData.uid)
    );
    
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(req => req.status === 'pending');
      
      setPendingRequests(requests);
    });
    
    return () => unsubscribe();
  }, []);
  

  const fetchRespondedRequests = async () => {
    if (!patientData) return;
    
    try {
      setLoadingResponses(true);
      const requestsQuery = query(
        collection(db, 'consultationRequests'),
        where('patientId', '==', patientData.uid),
        where('status', 'in', ['accepted', 'rejected'])
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRespondedRequests(requests);
      setLoadingResponses(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes traitées:', error);
      setLoadingResponses(false);
    }
  };

  

  const fetchConsultationHistory = async () => {
    if (!patientData) return;
    
    try {
      setLoadingHistory(true);
      const historyQuery = query(
        collection(db, 'consultations'),
        where('patientId', '==', patientData.uid),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setConsultationHistory(history);
      setLoadingHistory(false);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      setLoadingHistory(false);
    }
  };

  const fetchFavorites = async () => {
    if (!patientData) return;
    
    try {
      const favoriteRef = doc(db, 'patients', patientData.id);
      const favoritesQuery = query(
        collection(favoriteRef, 'favoriteDoctors')
      );
      
      const snapshot = await getDocs(favoritesQuery);
      const favorites = snapshot.docs.map(doc => doc.data().doctorId);
      setFavoritesDoctors(favorites);
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'consultationRequests'),
        where('patientId', '==', patientData.uid),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPendingRequests(requests);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes en attente:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const doctorsCollection = collection(db, 'medecins');
      const doctorsQuery = query(
        doctorsCollection,
        orderBy('nom'),
        limit(doctorsPerPage)
      );
      
      const doctorsSnapshot = await getDocs(doctorsQuery);
      
      const doctorsList = [];
      const specialitiesList = new Set();
      const insurancesList = new Set();
      
      doctorsSnapshot.forEach((doc) => {
        const doctorData = { id: doc.id, ...doc.data() };
        
        // Extraire les spécialités pour le filtre
        if (Array.isArray(doctorData.specialite)) {
          doctorData.specialite.forEach(spec => specialitiesList.add(spec));
        } else if (doctorData.specialite) {
          specialitiesList.add(doctorData.specialite);
        }
        
        // Extraire les assurances pour le filtre
        if (Array.isArray(doctorData.insurance)) {
          doctorData.insurance.forEach(ins => insurancesList.add(ins));
        }
        
        doctorsList.push(doctorData);
      });
      
      // Définir le dernier document pour la pagination
      setLastDoc(doctorsSnapshot.docs[doctorsSnapshot.docs.length - 1]);
      
      setDoctors(doctorsList);
      setFilteredDoctors(doctorsList);
      setSpecialities(Array.from(specialitiesList).sort());
      setInsuranceOptions(Array.from(insurancesList).sort());
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      setMessage('Erreur lors du chargement des médecins');
      setLoading(false);
    }
  };

  const fetchMoreDoctors = async () => {
    if (!lastDoc || !hasMore) return;
    
    try {
      setLoading(true);
      const doctorsCollection = collection(db, 'medecins');
      const doctorsQuery = query(
        doctorsCollection,
        orderBy('nom'),
        startAfter(lastDoc),
        limit(doctorsPerPage)
      );
      
      const doctorsSnapshot = await getDocs(doctorsQuery);
      
      if (doctorsSnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      
      const newDoctors = [];
      
      doctorsSnapshot.forEach((doc) => {
        newDoctors.push({ id: doc.id, ...doc.data() });
      });
      
      setLastDoc(doctorsSnapshot.docs[doctorsSnapshot.docs.length - 1]);
      setDoctors([...doctors, ...newDoctors]);
      
      // Appliquer les filtres actuels aux nouveaux médecins
      filterDoctors([...doctors, ...newDoctors]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement de plus de médecins:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    filterDoctors(doctors);
  }, [searchTerm, selectedSpeciality, selectedInsurance, activeTab, doctors]);

  const filterDoctors = (doctorsList) => {
    // Si on est sur l'onglet des consultations acceptées, ne pas filtrer les médecins
    if (activeTab === 'accepted') {
      return;
    }
    
    let filtered = [...doctorsList];
    
    // Filtrer par onglet actif
    if (activeTab === 'favorites') {
      filtered = filtered.filter(doctor => favoritesDoctors.includes(doctor.id));
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.nom?.toLowerCase().includes(term) || 
        doctor.prenom?.toLowerCase().includes(term)
      );
    }
    
    // Filtrer par spécialité
    if (selectedSpeciality) {
      filtered = filtered.filter(doctor => {
        if (Array.isArray(doctor.specialite)) {
          return doctor.specialite.includes(selectedSpeciality);
        } else {
          return doctor.specialite === selectedSpeciality;
        }
      });
    }
    
    // Filtrer par assurance
    if (selectedInsurance) {
      filtered = filtered.filter(doctor => {
        if (Array.isArray(doctor.insurance)) {
          return doctor.insurance.includes(selectedInsurance);
        }
        return false;
      });
    }
    
    setFilteredDoctors(filtered);
  };
  // Ajoutez cet useEffect pour écouter les mises à jour des demandes acceptées
useEffect(() => {
  if (!patientData) return;
  
  const acceptedRequestsQuery = query(
    collection(db, 'consultationRequests'),
    where('patientId', '==', patientData.uid),
    where('status', '==', 'accepted')
  );
  
  const unsubscribeAccepted = onSnapshot(acceptedRequestsQuery, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setAcceptedRequests(requests);
  });
  
  return () => {
    unsubscribeAccepted();
  };
}, [patientData]);


  const handleOpenModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    
    // Réinitialiser le formulaire
    setConsultationRequest({
      preferredDay: '',
      preferredTimeStart: '',
      preferredTimeEnd: '',
      reason: '',
      urgency: 'normale',
      type: 'presentiel',
      documents: [],
      symptoms: [],
      notes: ''
    });
    
    setUploadedFiles([]);
    setSelectedSymptoms([]);
    
    // Simuler la récupération des créneaux disponibles
    const mockTimeSlots = generateMockTimeSlots(doctor);
    setAvailableTimeSlots(mockTimeSlots);
  };

  // Fonction pour générer des créneaux horaires fictifs
  const generateMockTimeSlots = (doctor) => {
    if (!doctor.heureDebut || !doctor.heureFin) return [];
    
    const startHour = parseInt(doctor.heureDebut.split(':')[0]);
    const endHour = parseInt(doctor.heureFin.split(':')[0]);
    
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      // Simuler que certains créneaux sont déjà pris
      const isAvailable = Math.random() > 0.3;
      slots.push({
        start: `${hour}:00`,
        end: `${hour + 1}:00`,
        available: isAvailable
      });
    }
    
    return slots;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    try {
      const newFiles = [];
      
      for (const file of files) {
        // Limiter la taille du fichier à 5 Mo
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Le fichier ${file.name} dépasse la taille maximale de 5 Mo`);
          continue;
        }
        
                // Vérifier les types de fichiers autorisés
                const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!allowedTypes.includes(file.type)) {
                  toast.error(`Le type de fichier ${file.name} n'est pas autorisé`);
                  continue;
                }
                
                setUploadProgress(0);
                
                // Créer une référence dans Firebase Storage
                const storageRef = ref(storage, `patient_documents/${patientData.uid}/${Date.now()}_${file.name}`);
                
                // Téléverser le fichier
                const uploadTask = uploadBytes(storageRef, file);
                
                // Attendre la fin du téléversement
                await uploadTask;
                
                // Obtenir l'URL de téléchargement
                const downloadURL = await getDownloadURL(storageRef);
                
                newFiles.push({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  url: downloadURL
                });
                
                setUploadProgress(100);
              }
              
              setUploadedFiles([...uploadedFiles, ...newFiles]);
              
              // Mettre à jour la demande de consultation
              setConsultationRequest({
                ...consultationRequest,
                documents: [...consultationRequest.documents, ...newFiles]
              });
              
              toast.success('Documents téléchargés avec succès');
            } catch (error) {
              console.error('Erreur lors du téléversement des fichiers:', error);
              toast.error('Erreur lors du téléversement des fichiers');
            }
          };
        
          const removeFile = (index) => {
            const newFiles = [...uploadedFiles];
            newFiles.splice(index, 1);
            setUploadedFiles(newFiles);
            
            const newDocuments = [...consultationRequest.documents];
            newDocuments.splice(index, 1);
            
            setConsultationRequest({
              ...consultationRequest,
              documents: newDocuments
            });
          };
        
          const handleRequestSubmit = async (e) => {
            e.preventDefault();
            
            if (!selectedDoctor) {
              setMessage('Veuillez sélectionner un médecin');
              return;
            }
            
            try {
              // Vérifier si le créneau est disponible
              const isTimeSlotAvailable = checkTimeSlotAvailability();
              
              if (!isTimeSlotAvailable) {
                toast.error('Ce créneau horaire n\'est plus disponible. Veuillez en choisir un autre.');
                return;
              }
              
              // Création de la demande de consultation
              const requestData = {
                doctorId: selectedDoctor.id,
                doctorName: `Dr. ${selectedDoctor.nom} ${selectedDoctor.prenom}`,
                patientId: patientData.uid,
                patientName: `${patientData.nom} ${patientData.prenom}`,
                patientInfo: {
                  nom: patientData.nom,
                  prenom: patientData.prenom,
                  age: patientData.age,
                  sexe: patientData.sexe,
                  email: patientData.email,
                  telephone: patientData.telephone,
                  photo: patientData.photo || null
                },
                preferredDay: consultationRequest.preferredDay,
                preferredTimeStart: consultationRequest.preferredTimeStart,
                preferredTimeEnd: consultationRequest.preferredTimeEnd,
                reason: consultationRequest.reason,
                urgency: consultationRequest.urgency,
                type: consultationRequest.type,
                documents: consultationRequest.documents,
                symptoms: selectedSymptoms.map(s => s.label),
                notes: consultationRequest.notes,
                status: 'pending',
                createdAt: serverTimestamp()
              };
              
              await addDoc(collection(db, 'consultationRequests'), requestData);
              
              // Réinitialiser le formulaire
              setConsultationRequest({
                preferredDay: '',
                preferredTimeStart: '',
                preferredTimeEnd: '',
                reason: '',
                urgency: 'normale',
                type: 'presentiel',
                documents: [],
                symptoms: [],
                notes: ''
              });
              
              setUploadedFiles([]);
              setSelectedSymptoms([]);
              setShowModal(false);
              setShowSuccessModal(true);
              
              // Notification
              toast.success('Votre demande de consultation a été envoyée avec succès');
              
            } catch (error) {
              console.error('Erreur lors de la création de la demande:', error);
              toast.error('Erreur lors de l\'envoi de la demande de consultation');
            }
          };
        
          // Vérifier si le créneau horaire est disponible
          const checkTimeSlotAvailability = () => {
            const { preferredTimeStart } = consultationRequest;
            
            // Trouver le créneau correspondant
            const slot = availableTimeSlots.find(slot => slot.start === preferredTimeStart);
            
            // Si le créneau existe et est disponible
            return slot && slot.available;
          };
        
          const getAvailableDays = () => {
            if (!selectedDoctor || !selectedDoctor.joursDisponibles) return [];
            return selectedDoctor.joursDisponibles;
          };
        
          const handleTimeSlotSelection = (slot) => {
            if (!slot.available) return;
            
            setConsultationRequest({
              ...consultationRequest,
              preferredTimeStart: slot.start,
              preferredTimeEnd: slot.end
            });
          };
        
          const toggleFavorite = async (doctor) => {
            try {
              const isFavorite = favoritesDoctors.includes(doctor.id);
              const patientRef = doc(db, 'patients', patientData.id);
              
              if (isFavorite) {
                // Supprimer des favoris
                const favoritesQuery = query(
                  collection(patientRef, 'favoriteDoctors'),
                  where('doctorId', '==', doctor.id)
                );
                
                const snapshot = await getDocs(favoritesQuery);
                if (!snapshot.empty) {
                  await deleteDoc(snapshot.docs[0].ref);
                }
                
                setFavoritesDoctors(favoritesDoctors.filter(id => id !== doctor.id));
                toast.info(`Dr. ${doctor.nom} ${doctor.prenom} a été retiré de vos favoris`);
              } else {
                // Ajouter aux favoris
                await addDoc(collection(patientRef, 'favoriteDoctors'), {
                  doctorId: doctor.id,
                  addedAt: serverTimestamp()
                });
                
                setFavoritesDoctors([...favoritesDoctors, doctor.id]);
                toast.success(`Dr. ${doctor.nom} ${doctor.prenom} a été ajouté à vos favoris`);
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour des favoris:', error);
              toast.error('Erreur lors de la mise à jour des favoris');
            }
          };
        

          // Ajouter fonction pour supprimer une demande traitée
        const deleteRespondedRequest = async (requestId) => {
          try {
            await deleteDoc(doc(db, 'consultationRequests', requestId));
            setRespondedRequests(respondedRequests.filter(req => req.id !== requestId));
            toast.info('Demande supprimée avec succès');
          } catch (error) {
            console.error('Erreur lors de la suppression de la demande:', error);
            toast.error('Erreur lors de la suppression de la demande');
          }
        };



          const cancelRequest = async (requestId) => {
            try {
              await deleteDoc(doc(db, 'consultationRequests', requestId));
              setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
              toast.info('Demande de consultation annulée');
            } catch (error) {
              console.error('Erreur lors de l\'annulation de la demande:', error);
              toast.error('Erreur lors de l\'annulation de la demande');
            }
          };
        
          const toggleDarkMode = () => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            localStorage.setItem('darkMode', newDarkMode);
          };
        
          if (!patientData) {
            return (
              <Container className="mt-5">
                <Alert variant="warning">
                  Veuillez vous connecter pour accéder à cette fonctionnalité.
                </Alert>
              </Container>
            );
          }
        
          return (
            <div className={`consultation-container ${darkMode ? 'dark-mode' : ''}`}>
              <Container className="py-4">
                <ToastContainer position="top-right" autoClose={5000} />
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2 text-primary" />
                    Demande de Consultation
                  </h2>
                  <div className="d-flex gap-2">
                    <Button 
                      variant={darkMode ? "light" : "dark"} 
                      size="sm" 
                      onClick={toggleDarkMode}
                    >
                      {darkMode ? "Mode clair" : "Mode sombre"}
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? "Vue liste" : "Vue grille"}
                    </Button>
                  </div>
                </div>
        
                {message && (
                  <Alert variant="info" onClose={() => setMessage('')} dismissible>
                    {message}
                  </Alert>
                )}
        
                {/* Afficher le nombre de demandes en attente */}
                {pendingRequests.length > 0 && (
  <Alert variant="info" className="d-flex justify-content-between align-items-center">
    <div>
      <strong>Vous avez {pendingRequests.length} demande(s) en attente</strong>
    </div>
    <div className="d-flex gap-2">
      <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={() => setShowPendingRequests(true)}
      >
        <FaClipboardList className="me-2" />
        Voir mes demandes
      </Button>
      <Button 
        variant="outline-info" 
        size="sm" 
        onClick={() => {
          fetchRespondedRequests();
          setShowResponsesModal(true);
        }}
      >
        <FaRegCalendarCheck className="me-2" />
        Voir les réponses
      </Button>
      <Button 
        variant="outline-secondary" 
        size="sm" 
        onClick={() => setShowHistoryModal(true)}
      >
        <FaHistory className="me-2" />
        Historique
      </Button>
    </div>
  </Alert>
)}

        
                {/* Filtres */}
                <Card className="mb-4 shadow-sm">
                  <Card.Body>
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className="mb-3"
                    >
                      <Tab eventKey="all" title="Tous les médecins" />
                      <Tab eventKey="favorites" title={
                        <span>
                          <FaHeart className="me-1" />
                          Favoris
                        </span>
                      } />

<Tab eventKey="accepted" title={
    <span>
      <FaRegCalendarCheck className="me-1" />
      Consultations acceptées
    </span>
  } />
                    </Tabs>
                    
                    <Row className="g-3">
                      <Col md={4}>
                        <div className="input-group">
                          <span className="input-group-text bg-primary text-white">
                            <FaSearch />
                          </span>
                          <Form.Control
                            type="text"
                            placeholder="Rechercher un médecin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="input-group">
                          <span className="input-group-text bg-primary text-white">
                            <FaFilter />
                          </span>
                          <Form.Select
                            value={selectedSpeciality}
                            onChange={(e) => setSelectedSpeciality(e.target.value)}
                          >
                            <option value="">Toutes les spécialités</option>
                            {specialities.map((speciality, index) => (
                              <option key={index} value={speciality}>
                                {speciality}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="input-group">
                          <span className="input-group-text bg-primary text-white">
                            <FaMoneyBillWave />
                          </span>
                          <Form.Select
                            value={selectedInsurance}
                            onChange={(e) => setSelectedInsurance(e.target.value)}
                          >
                            <option value="">Toutes les assurances</option>
                            {insuranceOptions.map((insurance, index) => (
                              <option key={index} value={insurance}>
                                {insurance}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
        
                {/* Liste des médecins */}
                {viewMode === 'grid' ? (
  <Row className="g-4">
    {activeTab === 'accepted' ? (
      loadingAcceptedRequests ? (
        <Col className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Chargement des consultations acceptées...</p>
        </Col>
      ) : acceptedRequests.length === 0 ? (
        <Col className="text-center py-5">
          <Alert variant="light">
            Vous n'avez aucune consultation acceptée.
          </Alert>
        </Col>
      ) : (
        acceptedRequests.map((request) => (
          <Col key={request.id} xs={12} md={6} lg={4}>
            <Card className="h-100 shadow-sm hover-lift">
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    {request.doctorPhoto ? (
                      <img
                        src={request.doctorPhoto}
                        alt={`Dr. ${request.doctorName}`}
                        className="rounded-circle me-3"
                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                        style={{ width: '70px', height: '70px' }}
                      >
                        <FaUserMd size={30} className="text-secondary" />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">{request.doctorName}</h5>
                      <Badge bg="success">Consultation acceptée</Badge>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaCalendarAlt className="text-success me-2" />
                    <small>
                      <strong>Date:</strong> {request.appointmentDate ? new Date(request.appointmentDate.toDate()).toLocaleDateString() : request.preferredDay}
                    </small>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaClock className="text-success me-2" />
                    <small>
                      <strong>Heure:</strong> {request.appointmentTime || `${request.preferredTimeStart} - ${request.preferredTimeEnd || "Non spécifié"}`}
                    </small>
                  </div>
                  <div className="d-flex align-items-center">
                    <FaMapMarkerAlt className="text-success me-2" />
                    <small>
                      <strong>Type:</strong> {request.type === 'presentiel' ? 'En présentiel' : 'Téléconsultation'}
                    </small>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="mb-2">Motif de la consultation:</h6>
                  <p className="bg-light p-2 rounded">{request.reason || "Non spécifié"}</p>
                </div>

                {request.symptoms && request.symptoms.length > 0 && (
                  <div className="mb-3">
                    <h6 className="mb-2">Symptômes:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {request.symptoms.map((symptom, index) => (
                        <Badge key={index} bg="info" className="me-1">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.responseMessage && (
                  <div className="mb-3">
                    <h6 className="mb-2">Message du médecin:</h6>
                    <p className="bg-light p-2 rounded">{request.responseMessage}</p>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-3">
                
                  <div>
                    {request.type === 'teleconsultation' && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          toast.info("Le lien de téléconsultation sera disponible 15 minutes avant le rendez-vous");
                        }}
                      >
                        <FaVideo className="me-1" />
                        Lien
                      </Button>
                    )}
                  
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))
      )
    ) : (
      // Votre code existant pour l'affichage des médecins
      loading && filteredDoctors.length === 0 ? (
        <Col className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Chargement des médecins...</p>
        </Col>
      ) : filteredDoctors.length === 0 ? (
        <Col className="text-center py-5">
          <Alert variant="light">
            Aucun médecin ne correspond à votre recherche.
          </Alert>
        </Col>
      ) : (
        filteredDoctors.map((doctor) => (
          <Col key={doctor.id} xs={12} md={6} lg={4}>
            <Card className="h-100 shadow-sm hover-lift">
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    {doctor.photo ? (
                      <img
                        src={doctor.photo}
                        alt={`Dr. ${doctor.nom}`}
                        className="rounded-circle me-3"
                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                        style={{ width: '70px', height: '70px' }}
                      >
                        <FaUserMd size={30} className="text-secondary" />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h5>
                      <div className="d-flex flex-wrap gap-1">
                        {Array.isArray(doctor.specialite) ? (
                          doctor.specialite.map((spec, index) => (
                            <Badge key={index} bg="primary" className="me-1">
                              {spec}
                            </Badge>
                          ))
                        ) : (
                          <Badge bg="primary">{doctor.specialite}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 text-danger"
                    onClick={() => toggleFavorite(doctor)}
                  >
                    {favoritesDoctors.includes(doctor.id) ? (
                      <FaHeart size={20} />
                    ) : (
                      <FaRegHeart size={20} />
                    )}
                  </Button>
                </div>

                <hr />

                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <FaMapMarkerAlt className="text-secondary me-2" />
                    <small>{doctor.adresse || 'Adresse non spécifiée'}</small>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <FaClock className="text-secondary me-2" />
                    <small>
                      {doctor.heureDebut && doctor.heureFin 
                        ? `${doctor.heureDebut} - ${doctor.heureFin}` 
                        : 'Horaires non spécifiés'}
                    </small>
                  </div>
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="text-secondary me-2" />
                    <small>
                      {doctor.joursDisponibles && doctor.joursDisponibles.length > 0
                        ? doctor.joursDisponibles.join(', ')
                        : 'Jours non spécifiés'}
                    </small>
                  </div>
                </div>

                <div className="mb-3">
                  <h6 className="mb-2">Assurances acceptées:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {Array.isArray(doctor.insurance) && doctor.insurance.length > 0 ? (
                      doctor.insurance.map((ins, index) => (
                        <Badge key={index} bg="info" className="me-1">
                          {ins}
                        </Badge>
                      ))
                    ) : (
                      <small className="text-muted">Non spécifiées</small>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {doctor.languesParlees && doctor.languesParlees.length > 0
                          ? `Langues: ${doctor.languesParlees.join(', ')}`
                          : 'Langues non spécifiées'}
                      </Tooltip>
                    }
                  >
                    <span>
                      <FaLanguage className="text-info" size={20} />
                    </span>
                  </OverlayTrigger>
                  <Button
                    variant="primary"
                    onClick={() => handleOpenModal(doctor)}
                    className="px-3 py-2"
                  >
                    Demander une consultation
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))
      )
    )}
  </Row>
) : (
  // Vue liste
  <div className="doctor-list">
    {activeTab === 'accepted' ? (
      loadingAcceptedRequests ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="mt-3">Chargement des consultations acceptées...</p>
        </div>
      ) : acceptedRequests.length === 0 ? (
        <Alert variant="light" className="text-center py-5">
          Vous n'avez aucune consultation acceptée.
        </Alert>
      ) : (
        acceptedRequests.map((request) => (
          <Card key={request.id} className="mb-3 shadow-sm hover-lift">
            <Card.Body>
              <Row>
                <Col md={2} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                  {request.doctorPhoto ? (
                    <img
                      src={request.doctorPhoto}
                      alt={`Dr. ${request.doctorName}`}
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <FaUserMd size={35} className="text-secondary" />
                    </div>
                  )}
                </Col>
                <Col md={7}>
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-2">{request.doctorName}</h5>
                    <Badge bg="success" className="d-md-none">Acceptée</Badge>
                  </div>
                  <div className="d-flex flex-wrap mb-2">
                    <div className="me-3 d-flex align-items-center">
                      <FaCalendarAlt className="text-success me-1" size={14} />
                      <small>
                        <strong>Date:</strong> {request.appointmentDate ? new Date(request.appointmentDate.toDate()).toLocaleDateString() : request.preferredDay}
                      </small>
                    </div>
                    <div className="me-3 d-flex align-items-center">
                      <FaClock className="text-success me-1" size={14} />
                      <small>
                        <strong>Heure:</strong> {request.appointmentTime || `${request.preferredTimeStart} - ${request.preferredTimeEnd || "Non spécifié"}`}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap mb-2">
                    <div className="me-3 d-flex align-items-center">
                      <FaMapMarkerAlt className="text-success me-1" size={14} />
                      <small>
                        <strong>Type:</strong> {request.type === 'presentiel' ? 'En présentiel' : 'Téléconsultation'}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap">
                    <small className="text-muted me-2">Motif:</small>
                    <small>{request.reason || "Non spécifié"}</small>
                  </div>
                </Col>
                <Col md={3} className="d-flex flex-column justify-content-center align-items-end">
                  <Badge bg="success" className="mb-3 d-none d-md-block">Acceptée</Badge>
                  <div className="d-flex gap-2">
                    {request.type === 'teleconsultation' && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => {
                          toast.info("Le lien de téléconsultation sera disponible 15 minutes avant le rendez-vous");
                        }}
                      >
                        <FaVideo className="me-1" />
                        Lien
                      </Button>
                    )}
                    <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => {
                                              // Ajouter au calendrier ou autre action
                                              toast.info("Cette fonctionnalité sera disponible prochainement");
                                            }}
                                          >
                                            <FaRegCalendarCheck className="me-1" />
                                            Calendrier
                                          </Button>
                                        </div>
                                      </Col>
                                    </Row>
                                  </Card.Body>
                                </Card>
                              ))
                            )
                          ) : (
                            // Votre code existant pour l'affichage des médecins en vue liste
                            loading && filteredDoctors.length === 0 ? (
                              <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3">Chargement des médecins...</p>
                              </div>
                            ) : filteredDoctors.length === 0 ? (
                              <Alert variant="light" className="text-center py-5">
                                Aucun médecin ne correspond à votre recherche.
                              </Alert>
                            ) : (
                              filteredDoctors.map((doctor) => (
                                <Card key={doctor.id} className="mb-3 shadow-sm hover-lift">
                                  <Card.Body>
                                    <Row>
                                      <Col md={2} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                                        {doctor.photo ? (
                                          <img
                                            src={doctor.photo}
                                            alt={`Dr. ${doctor.nom}`}
                                            className="rounded-circle"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                          />
                                        ) : (
                                          <div 
                                            className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                            style={{ width: '80px', height: '80px' }}
                                          >
                                            <FaUserMd size={35} className="text-secondary" />
                                          </div>
                                        )}
                                      </Col>
                                      <Col md={7}>
                                        <div className="d-flex justify-content-between">
                                          <h5 className="mb-2">Dr. {doctor.nom} {doctor.prenom}</h5>
                                          <Button 
                                            variant="link" 
                                            className="p-0 text-danger d-md-none"
                                            onClick={() => toggleFavorite(doctor)}
                                          >
                                            {favoritesDoctors.includes(doctor.id) ? (
                                              <FaHeart size={20} />
                                            ) : (
                                              <FaRegHeart size={20} />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="d-flex flex-wrap gap-1 mb-2">
                                          {Array.isArray(doctor.specialite) ? (
                                            doctor.specialite.map((spec, index) => (
                                              <Badge key={index} bg="primary" className="me-1">
                                                {spec}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Badge bg="primary">{doctor.specialite}</Badge>
                                          )}
                                        </div>
                                        <div className="d-flex flex-wrap mb-2">
                                          <div className="me-3 d-flex align-items-center">
                                            <FaMapMarkerAlt className="text-secondary me-1" size={14} />
                                            <small>{doctor.adresse || 'Adresse non spécifiée'}</small>
                                          </div>
                                          <div className="me-3 d-flex align-items-center">
                                            <FaClock className="text-secondary me-1" size={14} />
                                            <small>
                                              {doctor.heureDebut && doctor.heureFin 
                                                ? `${doctor.heureDebut} - ${doctor.heureFin}` 
                                                : 'Horaires non spécifiés'}
                                            </small>
                                          </div>
                                        </div>
                                        <div className="d-flex flex-wrap">
                                          <small className="text-muted me-2">Assurances:</small>
                                          {Array.isArray(doctor.insurance) && doctor.insurance.length > 0 ? (
                                            doctor.insurance.map((ins, index) => (
                                              <Badge key={index} bg="info" className="me-1">
                                                {ins}
                                              </Badge>
                                            ))
                                          ) : (
                                            <small className="text-muted">Non spécifiées</small>
                                          )}
                                        </div>
                                      </Col>
                                      <Col md={3} className="d-flex flex-column justify-content-center align-items-end">
                                        <Button 
                                          variant="link" 
                                          className="p-0 text-danger mb-3 d-none d-md-block"
                                          onClick={() => toggleFavorite(doctor)}
                                        >
                                          {favoritesDoctors.includes(doctor.id) ? (
                                            <FaHeart size={20} />
                                          ) : (
                                            <FaRegHeart size={20} />
                                          )}
                                        </Button>
                                        <Button
                                          variant="primary"
                                          onClick={() => handleOpenModal(doctor)}
                                          className="w-100"
                                        >
                                          Demander une consultation
                                        </Button>
                                      </Col>
                                    </Row>
                                  </Card.Body>
                                </Card>
                              ))
                            )
                          )}
                        </div>
                      )}
                      



                {/* Pagination */}
                {filteredDoctors.length > 0 && hasMore && (
                  <div className="text-center mt-4">
                    <Button 
                      variant="outline-primary" 
                      onClick={fetchMoreDoctors}
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
                          Chargement...
                        </>
                      ) : (
                        'Voir plus de médecins'
                      )}
                    </Button>
                  </div>
                )}

        {/* Modal de demande de consultation */}
        <Modal 
          show={showModal} 
          onHide={() => setShowModal(false)}
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>Demande de consultation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDoctor && (
              <Form onSubmit={handleRequestSubmit}>
                <div className="mb-4">
                  <div className="d-flex align-items-center">
                    {selectedDoctor.photo ? (
                      <img
                        src={selectedDoctor.photo}
                        alt={`Dr. ${selectedDoctor.nom}`}
                        className="rounded-circle me-3"
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                        style={{ width: '80px', height: '80px' }}
                      >
                        <FaUserMd size={40} className="text-secondary" />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">Dr. {selectedDoctor.nom} {selectedDoctor.prenom}</h5>
                      <div className="d-flex flex-wrap">
                        {Array.isArray(selectedDoctor.specialite) ? (
                          selectedDoctor.specialite.map((spec, index) => (
                            <Badge key={index} bg="primary" className="me-1">
                              {spec}
                            </Badge>
                          ))
                        ) : (
                          <Badge bg="primary">{selectedDoctor.specialite}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultActiveKey="details" className="mb-4">
                  <Tab eventKey="details" title="Détails de la consultation">
                    <div className="p-3">
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="d-flex align-items-center">
                              <FaCalendarAlt className="me-2 text-primary" />
                              Jour préféré
                            </Form.Label>
                            <Form.Select
                              value={consultationRequest.preferredDay}
                              onChange={(e) => setConsultationRequest({
                                ...consultationRequest,
                                preferredDay: e.target.value
                              })}
                              required
                            >
                              <option value="">Sélectionner un jour</option>
                              {getAvailableDays().map((day, index) => (
                                <option key={index} value={day}>
                                  {day}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Jours où le médecin consulte
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="d-flex align-items-center">
                              <FaRegClock className="me-2 text-primary" />
                              Niveau d'urgence
                            </Form.Label>
                            <Form.Select
                              value={consultationRequest.urgency}
                              onChange={(e) => setConsultationRequest({
                                ...consultationRequest,
                                urgency: e.target.value
                              })}
                              required
                            >
                              <option value="normale">Normale</option>
                              <option value="urgente">Urgente</option>
                              <option value="très urgente">Très urgente</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label className="d-flex align-items-center">
                              <FaVideo className="me-2 text-primary" />
                              Type de consultation
                            </Form.Label>
                            <Form.Select
                              value={consultationRequest.type}
                              onChange={(e) => setConsultationRequest({
                                ...consultationRequest,
                                type: e.target.value
                              })}
                              required
                            >
                              <option value="presentiel">En présentiel</option>
                              <option value="teleconsultation">Téléconsultation</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Créneaux disponibles</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                              {availableTimeSlots.map((slot, index) => (
                                <Button
                                  key={index}
                                  variant={
                                    consultationRequest.preferredTimeStart === slot.start
                                      ? 'primary'
                                      : slot.available
                                      ? 'outline-primary'
                                      : 'outline-secondary'
                                  }
                                  size="sm"
                                  disabled={!slot.available}
                                  onClick={() => handleTimeSlotSelection(slot)}
                                  className="time-slot-btn"
                                >
                                  {slot.start} - {slot.end}
                                  {!slot.available && <span className="ms-1">(Indisponible)</span>}
                                </Button>
                              ))}
                            </div>
                            <Form.Text className="text-muted">
                              Cliquez sur un créneau disponible
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label className="d-flex align-items-center">
                          <FaClipboardList className="me-2 text-primary" />
                          Motif de la consultation
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Décrivez brièvement la raison de votre consultation..."
                          value={consultationRequest.reason}
                          onChange={(e) => setConsultationRequest({
                            ...consultationRequest,
                            reason: e.target.value
                          })}
                          required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaInfoCircle className="me-2 text-primary" />
                          Symptômes
                        </Form.Label>
                        <Select
                          isMulti
                          options={symptomOptions}
                          value={selectedSymptoms}
                          onChange={setSelectedSymptoms}
                          placeholder="Sélectionnez vos symptômes..."
                          className="basic-multi-select"
                          classNamePrefix="select"
                        />
                        <Form.Text className="text-muted">
                          Sélectionnez tous les symptômes que vous ressentez
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center">
                          <FaFileAlt className="me-2 text-primary" />
                          Notes supplémentaires
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Informations complémentaires pour le médecin..."
                          value={consultationRequest.notes}
                          onChange={(e) => setConsultationRequest({
                            ...consultationRequest,
                            notes: e.target.value
                          })}
                        />
                      </Form.Group>
                    </div>
                  </Tab>
                  <Tab eventKey="documents" title="Documents médicaux">
                    <div className="p-3">
                      <div className="mb-3">
                        <p className="mb-2">
                          Vous pouvez joindre des documents médicaux pertinents pour votre consultation 
                          (résultats d'analyses, radios, ordonnances, etc.)
                        </p>
                        <Button
                          variant="outline-primary"
                          onClick={() => fileInputRef.current.click()}
                          className="d-flex align-items-center"
                        >
                          <FaFileUpload className="me-2" />
                          Ajouter des documents
                        </Button>
                        <Form.Control
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="d-none"
                        />
                        <Form.Text className="text-muted">
                          Formats acceptés: JPG, PNG, PDF, DOC, DOCX. Taille max: 5 Mo par fichier.
                        </Form.Text>
                      </div>

                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="mb-3">
                          <div className="progress">
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              role="progressbar" 
                              style={{ width: `${uploadProgress}%` }}
                            >
                              {uploadProgress}%
                            </div>
                          </div>
                        </div>
                      )}

                      {uploadedFiles.length > 0 && (
                        <div className="mt-3">
                          <h6>Documents téléchargés ({uploadedFiles.length})</h6>
                          <div className="uploaded-files-list">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="uploaded-file-item d-flex align-items-center justify-content-between p-2 border rounded mb-2">
                                <div className="d-flex align-items-center">
                                  <FaFileAlt className="me-2 text-primary" />
                                  <div>
                                    <div>{file.name}</div>
                                    <small className="text-muted">
                                      {(file.size / 1024).toFixed(1)} Ko
                                    </small>
                                  </div>
                                </div>
                                <Button
                                  variant="link"
                                  className="text-danger p-0"
                                  onClick={() => removeFile(index)}
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleRequestSubmit}>
              Envoyer la demande
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de confirmation */}
        <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>Demande envoyée</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-4">
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix"></div>
                </div>
              </div>
              <h5>Votre demande de consultation a été envoyée avec succès!</h5>
              <p>
                Le médecin sera notifié de votre demande et vous recevrez une réponse 
                dans les plus brefs délais.
              </p>
            </div>
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowPendingRequests(true);
                }}
              >
                Voir mes demandes
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowSuccessModal(false)}
              >
                Fermer
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Modal des demandes en attente */}
        <Modal 
          show={showPendingRequests} 
          onHide={() => setShowPendingRequests(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>Mes demandes en attente</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pendingRequests.length === 0 ? (
              <Alert variant="info">
                Vous n'avez aucune demande de consultation en attente.
              </Alert>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id} className="mb-3 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="mb-2">{request.doctorName}</h5>
                      <Badge bg="warning" text="dark">En attente</Badge>
                    </div>
                    <p className="mb-2">
                      <strong>Jour:</strong> {request.preferredDay}
                    </p>
                    <p className="mb-2">
                      <strong>Heure:</strong> {request.preferredTimeStart} - {request.preferredTimeEnd}
                    </p>
                    <p className="mb-2">
                      <strong>Type:</strong> {request.type === 'presentiel' ? 'En présentiel' : 'Téléconsultation'}
                    </p>
                    <p className="mb-2">
                      <strong>Urgence:</strong> {request.urgency}
                    </p>
                    <p className="mb-2">
                      <strong>Motif:</strong> {request.reason}
                    </p>
                    {request.symptoms && request.symptoms.length > 0 && (
                      <div className="mb-2">
                        <strong>Symptômes:</strong>
                        <div className="d-flex flex-wrap mt-1">
                          {request.symptoms.map((symptom, index) => (
                            <Badge key={index} bg="info" className="me-1 mb-1">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {request.documents && request.documents.length > 0 && (
                      <p className="mb-2">
                        <strong>Documents:</strong> {request.documents.length} document(s) joint(s)
                      </p>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        Demande créée le {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                      </small>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => cancelRequest(request.id)}
                      >
                        Annuler la demande
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPendingRequests(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal d'historique des consultations */}
        <Modal 
          show={showHistoryModal} 
          onHide={() => setShowHistoryModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-secondary text-white">
            <Modal.Title>
              <FaHistory className="me-2" />
              Historique des consultations
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingHistory ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Chargement de l'historique...</p>
              </div>
            ) : consultationHistory.length === 0 ? (
              <Alert variant="info">
                Vous n'avez pas encore eu de consultations.
              </Alert>
            ) : (
              consultationHistory.map((consultation) => (
                <Card key={consultation.id} className="mb-3 shadow-sm">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="mb-2">{consultation.doctorName}</h5>
                      <Badge bg="success">Terminée</Badge>
                    </div>
                    <p className="mb-2">
                      <strong>Date:</strong> {new Date(consultation.date?.toDate()).toLocaleDateString()}
                    </p>
                    <p className="mb-2">
                      <strong>Type:</strong> {consultation.type === 'presentiel' ? 'En présentiel' : 'Téléconsultation'}
                    </p>
                    <p className="mb-2">
                      <strong>Diagnostic:</strong> {consultation.diagnostic || 'Non spécifié'}
                    </p>
                    {consultation.prescription && (
                      <p className="mb-2">
                        <strong>Prescription:</strong> {consultation.prescription}
                      </p>
                    )}
                    <div className="d-flex justify-content-end mt-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/consultation/${consultation.id}`)}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
              Fermer
            </Button>
          </Modal.Footer>
        </Modal>
        <style jsx>
{`/* Styles pour le composant PatientConsultation */

/* Styles généraux */
.consultation-container {
  transition: all 0.3s ease;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

/* Mode sombre */
.dark-mode {
  background-color: #121212;
  color: #e0e0e0;
}

.dark-mode .card {
  background-color: #1e1e1e;
  border-color: #333;
  color: #e0e0e0;
}

.dark-mode .modal-content {
  background-color: #1e1e1e;
  color: #e0e0e0;
}

.dark-mode .form-control,
.dark-mode .form-select {
  background-color: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}

.dark-mode .form-control:focus,
.dark-mode .form-select:focus {
  background-color: #2d2d2d;
  color: #e0e0e0;
}

.dark-mode .text-muted {
  color: #aaa !important;
}

.dark-mode .modal-header.bg-primary,
.dark-mode .modal-header.bg-success,
.dark-mode .modal-header.bg-info,
.dark-mode .modal-header.bg-secondary {
  border-bottom-color: #444;
}

.dark-mode .modal-footer {
  border-top-color: #444;
}

.dark-mode .alert-light {
  background-color: #2d2d2d;
  color: #e0e0e0;
  border-color: #444;
}

/* Styles pour les créneaux horaires */
.time-slot-btn {
  min-width: 110px;
  margin-bottom: 5px;
}

/* Animation de succès */
.success-checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  margin-bottom: 15px;
}

.success-checkmark .check-icon {
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: 50%;
  box-sizing: content-box;
  border: 4px solid #4CAF50;
}

.success-checkmark .check-icon::before {
  top: 3px;
  left: -2px;
  width
`}
          </style>


          {/* Modal des demandes traitées */}
<Modal 
  show={showResponsesModal} 
  onHide={() => setShowResponsesModal(false)}
  size="lg"
>
  <Modal.Header closeButton className="bg-info text-white">
    <Modal.Title>Réponses à mes demandes</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {loadingResponses ? (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Chargement des réponses...</p>
      </div>
    ) : respondedRequests.length === 0 ? (
      <Alert variant="info">
        Vous n'avez aucune réponse à vos demandes de consultation.
      </Alert>
    ) : (
      respondedRequests.map((request) => (
        <Card key={request.id} className="mb-3 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="mb-2">{request.doctorName}</h5>
              <Badge bg={request.status === 'accepted' ? 'success' : 'danger'}>
                {request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
              </Badge>
            </div>
            <p className="mb-2">
              <strong>Jour:</strong> {request.preferredDay}
            </p>
            <p className="mb-2">
              <strong>Heure:</strong> {request.preferredTimeStart} - {request.preferredTimeEnd}
            </p>
            <p className="mb-2">
              <strong>Type:</strong> {request.type === 'presentiel' ? 'En présentiel' : 'Téléconsultation'}
            </p>
            <p className="mb-2">
              <strong>Urgence:</strong> {request.urgency}
            </p>
            <p className="mb-2">
              <strong>Motif:</strong> {request.reason}
            </p>
            
            {request.responseMessage && (
              <div className="mt-3 p-3 bg-light rounded">
                <strong>Message du médecin:</strong>
                <p className="mb-0 mt-1">{request.responseMessage}</p>
              </div>
            )}
            
            {request.status === 'accepted' && request.appointmentDate && (
              <Alert variant="success" className="mt-3">
                <strong>Rendez-vous confirmé pour:</strong> {new Date(request.appointmentDate.toDate()).toLocaleDateString()} à {request.appointmentTime}
              </Alert>
            )}
            
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                Réponse reçue le {request.responseDate ? new Date(request.responseDate.toDate()).toLocaleDateString() : 'N/A'}
              </small>
              <div>
                {request.status === 'accepted' && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      // Ajouter au calendrier ou autre action
                      toast.info("Cette fonctionnalité sera disponible prochainement");
                    }}
                  >
                    <FaRegCalendarCheck className="me-1" />
                    Ajouter au calendrier
                  </Button>
                )}
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => deleteRespondedRequest(request.id)}
                >
                  <FaTrash className="me-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowResponsesModal(false)}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>


      </Container>
    </div>
  );
};

export default PatientConsultation;
