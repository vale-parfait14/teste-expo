import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Nav, Tab, Badge, ListGroup, Spinner, Offcanvas, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {FaBell, FaUser, FaHospital, FaCalendarAlt, FaSignOutAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaUserMd, FaClock, FaBars, FaCommentMedical, FaCheck } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';
import Select from 'react-select';

const PatientDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});
  const navigate = useNavigate();
  
  // État pour le menu mobile
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Détection du type d'appareil
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 });
  const isDesktop = useMediaQuery({ minWidth: 992 });

  // États pour PatientRdv
  const [structuresOptions, setStructuresOptions] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [rdvLoading, setRdvLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  // États simplifiés pour les préférences
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [motif, setMotif] = useState('');
  
  // État pour le texte récapitulatif
  const [requestSummary, setRequestSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  
  // États pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Options pour les jours de la semaine
  const daysOptions = [
    { value: 'Lundi', label: 'Lundi' },
    { value: 'Mardi', label: 'Mardi' },
    { value: 'Mercredi', label: 'Mercredi' },
    { value: 'Jeudi', label: 'Jeudi' },
    { value: 'Vendredi', label: 'Vendredi' },
    { value: 'Samedi', label: 'Samedi' },
    { value: 'Dimanche', label: 'Dimanche' }
  ];
  
  // Options pour les créneaux horaires
  const timeSlotOptions = [
    { value: 'Matin (8h-12h)', label: 'Matin (8h-12h)' },
    { value: 'Midi (12h-14h)', label: 'Midi (12h-14h)' },
    { value: 'Après-midi (14h-18h)', label: 'Après-midi (14h-18h)' },
    { value: 'Soir (18h-20h)', label: 'Soir (18h-20h)' }
  ];
  
  // Options pour les motifs de consultation
  const motifOptions = [
    { value: 'Première consultation', label: 'Première consultation' },
    { value: 'Suivi médical', label: 'Suivi médical' },
    { value: 'Urgence', label: 'Urgence' },
    { value: 'Renouvellement d\'ordonnance', label: 'Renouvellement d\'ordonnance' },
    { value: 'Autre', label: 'Autre' }
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si les données du patient sont dans le localStorage
        const patientData = localStorage.getItem('patientData');
        
        if (!patientData) {
          navigate('/');
          return;
        }

        const parsedData = JSON.parse(patientData);
        setPatient(parsedData);
        
        // Charger les structures associées au patient
        await loadStructures(parsedData);
        
        // Configurer l'écoute en temps réel des rendez-vous
        setupAppointmentsListener(parsedData.id);
        
        // Charger les structures pour le formulaire de rendez-vous
        await fetchStructuresForRdv();
        
        // Configurer l'écoute des notifications
        setupNotificationsListener(parsedData.id);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement de vos données.");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadStructures = async (patientData) => {
    try {
      if (!patientData.structures || patientData.structures.length === 0) {
        return;
      }

      // Configurer l'écoute en temps réel des structures
      const unsubscribeStructures = [];
      
      patientData.structures.forEach(structureId => {
        const unsubscribe = onSnapshot(
          doc(db, 'structures', structureId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setStructures(prevStructures => {
                // Vérifier si la structure existe déjà dans le tableau
                const existingIndex = prevStructures.findIndex(s => s.id === structureId);
                const newStructure = { id: docSnapshot.id, ...docSnapshot.data() };
                
                if (existingIndex >= 0) {
                  // Mettre à jour la structure existante
                  const updatedStructures = [...prevStructures];
                  updatedStructures[existingIndex] = newStructure;
                  return updatedStructures;
                } else {
                  // Ajouter la nouvelle structure
                  return [...prevStructures, newStructure];
                }
              });
            }
          },
          (error) => {
            console.error(`Erreur lors de l'écoute de la structure ${structureId}:`, error);
          }
        );
        
        unsubscribeStructures.push(unsubscribe);
      });

      // Ajouter la fonction de nettoyage au useEffect
      return () => {
        unsubscribeStructures.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setError("Une erreur est survenue lors du chargement des structures associées.");
    }
  };

  const setupAppointmentsListener = (patientId) => {
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId)
      );
      
      // Configurer l'écoute en temps réel des rendez-vous
      const unsubscribeAppointments = onSnapshot(
        appointmentsQuery,
        async (querySnapshot) => {
          if (querySnapshot.empty) {
            setAppointments([]);
            setAssignedDoctors([]);
            setDoctorAppointments({});
            setLoading(false);
            return;
          }

          // Structure pour stocker les rendez-vous par médecin
          const appointmentsByDoctor = {};
          // Ensemble pour stocker les IDs uniques des médecins
          const doctorIds = new Set();
          
          // Organiser les rendez-vous par médecin
          querySnapshot.docs.forEach(doc => {
            const appointmentData = { id: doc.id, ...doc.data() };
            const doctorId = appointmentData.doctorId;
            
            if (doctorId) {
              doctorIds.add(doctorId);
              
              if (!appointmentsByDoctor[doctorId]) {
                appointmentsByDoctor[doctorId] = [];
              }
              
              appointmentsByDoctor[doctorId].push(appointmentData);
            }
          });
          
          // Récupérer les informations complètes des médecins
          const doctorsData = await Promise.all(
            Array.from(doctorIds).map(async (doctorId) => {
              const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
              if (doctorDoc.exists()) {
                return { id: doctorDoc.id, ...doctorDoc.data() };
              }
              return null;
            })
          );
          
          // Filtrer les médecins null
          const validDoctors = doctorsData.filter(d => d !== null);
          
          // Pour chaque rendez-vous, récupérer les infos de structure
          for (const doctorId in appointmentsByDoctor) {
            for (let i = 0; i < appointmentsByDoctor[doctorId].length; i++) {
              const apt = appointmentsByDoctor[doctorId][i];
              if (apt.structureId) {
                const structureDoc = await getDoc(doc(db, 'structures', apt.structureId));
                if (structureDoc.exists()) {
                  appointmentsByDoctor[doctorId][i].structureInfo = { 
                    id: structureDoc.id, 
                    ...structureDoc.data() 
                  };
                }
              }
            }
          }
          
          // Mettre à jour les états
          setAssignedDoctors(validDoctors);
          setDoctorAppointments(appointmentsByDoctor);
          setAppointments(Object.values(appointmentsByDoctor).flat());
          
          setLoading(false);
        },
        (error) => {
          console.error("Erreur lors de l'écoute des rendez-vous:", error);
          setError("Une erreur est survenue lors du chargement de vos rendez-vous.");
          setLoading(false);
        }
      );

      // Configurer l'écoute en temps réel pour chaque médecin
      const doctorListeners = new Map();
      
      const setupDoctorListeners = async (doctorIds) => {
        // Nettoyer les listeners existants pour les médecins qui ne sont plus pertinents
        for (const [docId, unsubscribe] of doctorListeners.entries()) {
          if (!doctorIds.has(docId)) {
            unsubscribe();
            doctorListeners.delete(docId);
          }
        }
        
        // Ajouter de nouveaux listeners pour les nouveaux médecins
        for (const doctorId of doctorIds) {
          if (!doctorListeners.has(doctorId)) {
            const unsubscribe = onSnapshot(
              doc(db, 'medecins', doctorId),
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  setAssignedDoctors(prevDoctors => {
                    const existingIndex = prevDoctors.findIndex(d => d.id === doctorId);
                    const newDoctor = { id: docSnapshot.id, ...docSnapshot.data() };
                    
                    if (existingIndex >= 0) {
                      const updatedDoctors = [...prevDoctors];
                      updatedDoctors[existingIndex] = newDoctor;
                      return updatedDoctors;
                    } else {
                      return [...prevDoctors, newDoctor];
                    }
                  });
                }
              },
              (error) => {
                console.error(`Erreur lors de l'écoute du médecin ${doctorId}:`, error);
              }
            );
            
            doctorListeners.set(doctorId, unsubscribe);
          }
        }
      };
      
      // Observer les changements dans les IDs des médecins
      const unsubscribeDoctorIds = onSnapshot(
        appointmentsQuery,
        (querySnapshot) => {
          const newDoctorIds = new Set();
          querySnapshot.docs.forEach(doc => {
            const doctorId = doc.data().doctorId;
            if (doctorId) {
              newDoctorIds.add(doctorId);
            }
          });
          
          setupDoctorListeners(newDoctorIds);
        }
      );
      
      // Fonction de nettoyage pour tous les listeners
      return () => {
        unsubscribeAppointments();
        unsubscribeDoctorIds();
        for (const unsubscribe of doctorListeners.values()) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration des listeners:", error);
      setError("Une erreur est survenue lors de la configuration des mises à jour en temps réel.");
      setLoading(false);
    }
  };

  // Charger les structures pour le formulaire de rendez-vous
  const fetchStructuresForRdv = async () => {
    try {
      const structuresSnapshot = await getDocs(collection(db, 'structures'));
      const structuresList = structuresSnapshot.docs.map(doc => ({
        value: doc.id,
        label: doc.data().name,
        specialties: doc.data().specialties || []
      }));
      setStructuresOptions(structuresList);
    } catch (error) {
      console.error('Erreur lors du chargement des structures:', error);
      setFeedback({
        type: 'danger',
        message: 'Impossible de charger les structures médicales.'
      });
    }
  };

    // Configurer l'écoute des notifications
    const setupNotificationsListener = (patientId) => {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', patientId),
        where('read', '==', false)
      );
  
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setNotifications(newNotifications);
        
        // Vérifier s'il y a de nouvelles notifications concernant les demandes de rendez-vous
        const appointmentNotifications = newNotifications.filter(
          notif => ['appointment_accepted', 'appointment_rejected', 'request_pending'].includes(notif.type)
        );
        
        if (appointmentNotifications.length > 0) {
          setHasNewNotifications(true);
        }
      });
  
      return unsubscribe;
    };
  
    const handleLogout = async () => {
      try {
        await signOut(auth);
        localStorage.removeItem('patientData');
        localStorage.removeItem('isAuthenticated');
        navigate('/');
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        setError("Une erreur est survenue lors de la déconnexion.");
      }
    };
  
    const handleTabSelect = (key) => {
      setActiveTab(key);
      if (isMobile) {
        setShowSidebar(false);
      }
    };
  
    // Mettre à jour les spécialités disponibles lorsqu'une structure est sélectionnée
    useEffect(() => {
      if (selectedStructure) {
        const structureData = structuresOptions.find(s => s.value === selectedStructure.value);
        if (structureData && structureData.specialties) {
          const specialtiesOptions = structureData.specialties.map(specialty => ({
            value: specialty,
            label: specialty
          }));
          setSpecialties(specialtiesOptions);
        } else {
          setSpecialties([]);
        }
      } else {
        setSpecialties([]);
      }
    }, [selectedStructure, structuresOptions]);
    
    // Générer le texte récapitulatif
    useEffect(() => {
      if (selectedStructure && selectedSpecialty && selectedDays.length > 0 && 
          selectedTimeSlots.length > 0 && motif) {
        
        const daysText = selectedDays.map(day => day.label).join(', ');
        const timeSlotsText = selectedTimeSlots.map(slot => slot.label).join(', ');
        
        const summary = `
          Demande de rendez-vous:
          
          Structure: ${selectedStructure.label}
          Spécialité: ${selectedSpecialty.label}
          Jours préférés: ${daysText}
          Horaires préférés: ${timeSlotsText}
          Motif de consultation: ${motif.label}
        `;
        
        setRequestSummary(summary);
      } else {
        setRequestSummary('');
      }
    }, [selectedStructure, selectedSpecialty, selectedDays, selectedTimeSlots, motif]);
  
    // Vérifier si le formulaire est complet
    const isFormComplete = () => {
      return selectedStructure && 
             selectedSpecialty && 
             selectedDays.length > 0 && 
             selectedTimeSlots.length > 0 && 
             motif;
    };
    
    // Afficher le récapitulatif
    const handleShowSummary = (e) => {
      e.preventDefault();
      if (isFormComplete()) {
        setShowSummary(true);
      } else {
        setFeedback({
          type: 'warning',
          message: 'Veuillez remplir tous les champs requis.'
        });
      }
    };
  
    // Gérer la soumission du formulaire de rendez-vous
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!isFormComplete()) {
        setFeedback({
          type: 'warning',
          message: 'Veuillez remplir tous les champs requis.'
        });
        return;
      }
  
      setRdvLoading(true);
      
      try {
        // Créer la demande de rendez-vous dans Firestore avec le texte récapitulatif
        const requestRef = await addDoc(collection(db, 'appointmentRequests'), {
          patientId: patient?.id,
          patientInfo: {
            nom: patient?.nom,
            prenom: patient?.prenom,
            email: patient?.email,
            telephone: patient?.telephone,
            age: patient?.age,
            sexe: patient?.sexe,
            insurance: patient?.insurance || []
          },
          structureId: selectedStructure.value,
          structureName: selectedStructure.label,
          specialty: selectedSpecialty.value,
          requestText: requestSummary.trim(),
          status: 'pending',
          requestDate: new Date().toISOString(),
          lastUpdate: new Date().toISOString()
        });
        
        // Créer une notification pour le patient
        await addDoc(collection(db, 'notifications'), {
          userId: patient?.id,
          title: 'Demande de rendez-vous envoyée',
          message: `Votre demande de rendez-vous en ${selectedSpecialty.value} a été envoyée à ${selectedStructure.label}.`,
          type: 'request_pending',
          requestId: requestRef.id,
          createdAt: new Date().toISOString(),
          read: false
        });
  
        setFeedback({
          type: 'success',
          message: 'Votre demande de rendez-vous a été envoyée avec succès!'
        });
  
        // Réinitialiser le formulaire
        setSelectedStructure(null);
        setSelectedSpecialty(null);
        setSelectedDays([]);
        setSelectedTimeSlots([]);
        setMotif(null);
        setShowSummary(false);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la demande:', error);
        setFeedback({
          type: 'danger',
          message: 'Une erreur s\'est produite lors de l\'envoi de votre demande.'
        });
      } finally {
        setRdvLoading(false);
      }
    };
  
    // Composant de tableau des demandes de rendez-vous
    const RequestsTable = ({ patientId }) => {
      const [requests, setRequests] = useState([]);
      const [tableLoading, setTableLoading] = useState(true);
  
      useEffect(() => {
        if (!patientId) return;
  
        const requestsQuery = query(
          collection(db, 'appointmentRequests'),
          where('patientId', '==', patientId)
        );
  
        const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
          const requestsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setRequests(requestsData);
          setTableLoading(false);
        });
  
        return () => unsubscribe();
      }, [patientId]);
  
      if (tableLoading) {
        return (
          <div className="text-center py-4">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Chargement...</span>
            </Spinner>
          </div>
        );
      }
  
      if (requests.length === 0) {
        return (
          <div className="text-center py-4">
            <p className="text-muted">Vous n'avez pas encore fait de demande de rendez-vous.</p>
          </div>
        );
      }
  
      return (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Date de demande</th>
                <th>Structure</th>
                <th>Spécialité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id}>
                  <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td>{request.structureName}</td>
                  <td>{request.specialty}</td>
                  <td>
                    <Badge bg={
                      request.status === 'pending' ? 'warning' :
                      request.status === 'accepted' ? 'success' : 'danger'
                    }>
                      {request.status === 'pending' ? 'En attente' :
                       request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                    </Badge>
                    {request.status === 'rejected' && request.notes && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Motif: {request.notes}
                        </small>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };
  
    if (loading) {
      return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">Chargement de vos données...</span>
        </Container>
      );
    }
  
    // Composant de barre latérale de navigation
    const SidebarNavigation = () => (
      <Card className="shadow-sm border-0 h-100">
        <Card.Body className="p-0">
          <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={handleTabSelect}>
            <Nav.Item>
              <Nav.Link eventKey="profile" className="d-flex align-items-center">
                <FaUser className="me-2" />
                Mon profil
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="structures" className="d-flex align-items-center">
                <FaHospital className="me-2" />
                Mes structures
                <Badge bg="primary" className="ms-auto">{structures.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="appointments" className="d-flex align-items-center">
                <FaCalendarAlt className="me-2" />
                Mes rendez-vous
                <Badge bg="primary" className="ms-auto">{appointments.length}</Badge>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="rdv" className="d-flex align-items-center">
                <FaCalendarAlt className="me-2" />
                Demander un RDV
                {hasNewNotifications && (
                  <Badge bg="danger" className="ms-auto">{notifications.length}</Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>
    );
  
    return (
      <Container fluid className="patient-dashboard py-4">
        {/* Header - Adapté pour mobile et desktop */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {isMobile && (
                      <Button 
                        variant="light" 
                        className="me-2 d-md-none" 
                        onClick={() => setShowSidebar(true)}
                      >
                        <FaBars />
                      </Button>
                    )}
                    <div className="patient-avatar me-3">
                      {patient?.photo ? (
                        <img 
                          src={patient.photo} 
                          alt={`${patient.nom} ${patient.prenom}`} 
                          className="rounded-circle"
                          style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="avatar-placeholder rounded-circle bg-primary d-flex align-items-center justify-content-center text-white" 
                          style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px' }}
                        >
                          <FaUser size={isMobile ? 20 : 30} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{patient?.nom} {patient?.prenom}</h4>
                      <p className="text-muted mb-0">
                        <FaIdCard className="me-1" />
                        Patient
                      </p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    {hasNewNotifications && (
                      <Button 
                        variant="outline-primary" 
                        className="position-relative me-2"
                        onClick={() => setShowNotificationsModal(true)}
                      >
                        <FaBell />
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {notifications.length}
                        </span>
                      </Button>
                    )}
                    <Button 
                      variant="outline-danger" 
                      onClick={handleLogout}
                      className="d-flex align-items-center"
                      size={isMobile ? "sm" : ""}
                    >
                      <FaSignOutAlt className={isMobile ? "" : "me-2"} />
                      {!isMobile && "Déconnexion"}
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
  
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
  
        {/* Version mobile: Sidebar comme Offcanvas */}
        {isMobile && (
          <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0">
              <SidebarNavigation />
            </Offcanvas.Body>
          </Offcanvas>
        )}
  
        <Row>
          {/* Sidebar pour desktop et tablette */}
          {!isMobile && (
            <Col md={3} lg={3} className="mb-4">
              <SidebarNavigation />
            </Col>
          )}
  
                  {/* Contenu principal - s'adapte à la largeur complète sur mobile */}
        <Col xs={12} md={9} lg={9}>
          <Tab.Content>
            {/* Onglet Profil */}
            <Tab.Pane eventKey="profile" active={activeTab === "profile"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaUser className="me-2" />
                    Informations personnelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <strong>Nom:</strong> {patient?.nom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Prénom:</strong> {patient?.prenom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Âge:</strong> {patient?.age} ans
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Sexe:</strong> {patient?.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                    <Col xs={12} md={6} className={isMobile ? 'mt-3' : ''}>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaEnvelope className="me-2 text-primary" />
                          <div className="text-break">
                            <strong>Email:</strong><br />
                            {patient?.email}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaPhoneAlt className="me-2 text-primary" />
                          <div>
                            <strong>Téléphone:</strong><br />
                            {patient?.telephone || 'Non renseigné'}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-primary" />
                          <div className="text-break">
                            <strong>Adresse:</strong><br />
                            {patient?.adresse || 'Non renseignée'}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                  </Row>

                  {patient?.insurance && patient.insurance.length > 0 && (
                    <div className="mt-4">
                      <h6>Assurances:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {patient.insurance.map((ins, index) => (
                          <Badge key={index} bg="info" className="p-2">
                            {ins}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient?.antecedents && patient.antecedents.length > 0 && (
                    <div className="mt-4">
                      <h6>Antécédents médicaux:</h6>
                      <ListGroup>
                        {patient.antecedents.map((ant, index) => (
                          <ListGroup.Item key={index}>{ant}</ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Onglet Structures */}
            <Tab.Pane eventKey="structures" active={activeTab === "structures"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaHospital className="me-2" />
                    Mes structures médicales
                  </h5>
                </Card.Header>
                <Card.Body>
                  {structures.length > 0 ? (
                    <Row xs={1} md={isTablet ? 1 : 2} className="g-4">
                      {structures.map(structure => (
                        <Col key={structure.id}>
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                {structure.photoUrl ? (
                                  <img 
                                    src={structure.photoUrl} 
                                    alt={structure.name} 
                                    className="me-3 rounded"
                                    style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="bg-light rounded d-flex align-items-center justify-content-center me-3" 
                                    style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px' }}
                                  >
                                    <FaHospital size={isMobile ? 20 : 25} className="text-primary" />
                                  </div>
                                )}
                                <div>
                                  <Card.Title className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>{structure.name}</Card.Title>
                                  {structure.specialties && structure.specialties.length > 0 && (
                                    <small className="text-muted">
                                      {structure.specialties.slice(0, 2).join(', ')}
                                      {structure.specialties.length > 2 && '...'}
                                    </small>
                                  )}
                                </div>
                              </div>
                              
                              <ListGroup variant="flush" className="small">
                                <ListGroup.Item className="px-0 py-2 text-break">
                                  <FaMapMarkerAlt className="me-2 text-primary" />
                                  {structure.address || 'Adresse non renseignée'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2">
                                  <FaPhoneAlt className="me-2 text-primary" />
                                  {structure.phones?.mobile || structure.phones?.landline || 'Téléphone non renseigné'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2 text-break">
                                  <FaEnvelope className="me-2 text-primary" />
                                  {structure.email || 'Email non renseigné'}
                                </ListGroup.Item>
                              </ListGroup>
                            </Card.Body>
                            <Card.Footer className="bg-white">
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted d-none d-md-block">
                                  Affilié depuis: {new Date(patient?.dateInscription || Date.now()).toLocaleDateString()}
                                </small>
                                <Button variant="outline-primary" size="sm" className="w-100 w-md-auto">
                                  Voir détails
                                </Button>
                              </div>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <FaHospital size={isMobile ? 30 : 40} className="text-muted mb-3" />
                      <h5 className={isMobile ? 'fs-6' : ''}>Aucune structure associée</h5>
                      <p className="text-muted">
                        Vous n'êtes actuellement affilié à aucune structure médicale.
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Onglet Rendez-vous */}
            <Tab.Pane eventKey="appointments" active={activeTab === "appointments"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaCalendarAlt className="me-2" />
                    Mes rendez-vous
                  </h5>
                </Card.Header>
                <Card.Body>
                  {assignedDoctors.length > 0 ? (
                    assignedDoctors.map(doctor => (
                      <div key={doctor.id} className="assigned-doctor-info mb-4">
                        <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                          <h5 className={`border-bottom pb-2 text-primary ${isMobile ? 'fs-6' : ''}`}>
                            <FaUserMd className="me-2" />
                            Dr. {doctor.nom} {doctor.prenom}
                          </h5>
                          <Row>
                            <Col xs={12} md={6}>
                              <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                              <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                              <p><strong>Email:</strong> {doctor.email}</p>
                            </Col>
                            <Col xs={12} md={6} className={isMobile ? 'mt-2' : ''}>
                              <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                              <p><strong>Jours disponibles:</strong></p>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                {doctor.disponibilite?.map(day => (
                                  <span key={day} className="badge bg-info">{day}</span>
                                ))}
                              </div>
                            </Col>
                          </Row>
                        </div>

                        <div className="appointments-section">
                          <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
                          {doctorAppointments[doctor.id]?.length > 0 ? (
                            <div className="appointments-list">
                              {doctorAppointments[doctor.id]
                                .sort((a, b) => {
                                  // Définir l'ordre des jours de la semaine
                                  const weekdayOrder = {
                                    'Lundi': 1,
                                    'Mardi': 2,
                                    'Mercredi': 3,
                                    'Jeudi': 4,
                                    'Vendredi': 5,
                                    'Samedi': 6,
                                    'Dimanche': 7
                                  };
                                  return weekdayOrder[a.day] - weekdayOrder[b.day];
                                })
                                .map(apt => (
                                  <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                                    <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between align-items-center'}`}>
                                      <div>
                                        <p className="mb-1">
                                          <FaCalendarAlt className="me-2 text-primary" />
                                          <strong>Jour:</strong> {apt.day}
                                        </p>
                                        <p className="mb-1">
                                          <FaClock className="me-2 text-primary" />
                                          <strong>Heure:</strong> {apt.timeSlot}
                                        </p>
                                        <p className={`${isMobile ? 'mb-2' : 'mb-0'}`}>
                                          <FaHospital className="me-2 text-primary" />
                                          <strong>Structure:</strong> {apt.structureInfo?.name || 'Non spécifiée'}
                                        </p>
                                      </div>
                                      <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'} ${isMobile ? 'align-self-start' : ''}`}>
                                        {apt.status === 'completed' ? 'Terminé' : 'En attente'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4">
                      <FaUserMd size={isMobile ? 30 : 40} className="text-muted mb-3" />
                      <p>Aucun médecin assigné pour le moment</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Nouvel onglet pour la demande de rendez-vous */}
            <Tab.Pane eventKey="rdv" active={activeTab === "rdv"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaCalendarAlt className="me-2" />
                    Demande de rendez-vous
                  </h5>
                </Card.Header>
                <Card.Body>
                  {feedback.message && (
                    <Alert 
                      variant={feedback.type} 
                      onClose={() => setFeedback({ type: '', message: '' })} 
                      dismissible
                    >
                      {feedback.message}
                    </Alert>
                  )}
                  
                  {!showSummary ? (
                    <Form onSubmit={handleShowSummary}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">
                          <FaHospital className="me-2" />
                          Structure médicale
                        </Form.Label>
                        <Select
                          options={structuresOptions}
                          value={selectedStructure}
                          onChange={setSelectedStructure}
                          placeholder="Sélectionnez une structure médicale"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          isDisabled={rdvLoading}
                          isSearchable
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">
                          <FaUserMd className="me-2" />
                          Spécialité médicale
                        </Form.Label>
                        <Select
                          options={specialties}
                          value={selectedSpecialty}
                          onChange={setSelectedSpecialty}
                          placeholder="Sélectionnez une spécialité"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          isDisabled={!selectedStructure || rdvLoading}
                          noOptionsMessage={() => "Aucune spécialité disponible pour cette structure"}
                          isSearchable
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">
                          <FaCalendarAlt className="me-2" />
                          Jours préférés
                        </Form.Label>
                        <Select
                          options={daysOptions}
                          value={selectedDays}
                          onChange={setSelectedDays}
                          placeholder="Sélectionnez un ou plusieurs jours"
                          isMulti
                          className="react-select-container"
                          classNamePrefix="react-select"
                          isDisabled={rdvLoading}
                        />
                        <Form.Text className="text-muted">
                          Vous pouvez sélectionner plusieurs jours qui vous conviennent.
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">
                          <FaClock className="me-2" />
                          Horaires préférés
                        </Form.Label>
                        <Select
                          options={timeSlotOptions}
                          value={selectedTimeSlots}
                          onChange={setSelectedTimeSlots}
                          placeholder="Sélectionnez un ou plusieurs créneaux horaires"
                          isMulti
                          className="react-select-container"
                          classNamePrefix="react-select"
                          isDisabled={rdvLoading}
                        />
                        <Form.Text className="text-muted">
                          Vous pouvez sélectionner plusieurs créneaux horaires qui vous conviennent.
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">
                          <FaCommentMedical className="me-2" />
                          Motif de consultation
                        </Form.Label>
                        <Select
                          options={motifOptions}
                          value={motif}
                          onChange={setMotif}
                          placeholder="Sélectionnez un motif de consultation"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          isDisabled={rdvLoading}
                        />
                      </Form.Group>
                      
                      <div className="d-grid">
                        <Button 
                          variant="primary" 
                          type="submit" 
                          size="lg" 
                          disabled={rdvLoading || !isFormComplete()}
                        >
                          Continuer
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <div>
                      <div className="border rounded p-3 mb-4 bg-light">
                        <h5 className="mb-3">Récapitulatif de votre demande</h5>
                        <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                          {requestSummary}
                        </pre>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setShowSummary(false)}
                          disabled={rdvLoading}
                        >
                          Modifier
                        </Button>
                        
                        <Button 
                          variant="success" 
                          onClick={handleSubmit}
                          disabled={rdvLoading}
                        >
                          {rdvLoading ? (
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
                            <>
                              <FaCheck className="me-2" />
                              Confirmer et envoyer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tableau des demandes de rendez-vous */}
                  <Card className="shadow-sm mt-4">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">
                        <FaCalendarAlt className="me-2" />
                        Mes demandes de rendez-vous
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <RequestsTable patientId={patient?.id} />
                    </Card.Body>
                  </Card>
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>

      {/* Modal des notifications */}
      <Modal 
        show={showNotificationsModal} 
        onHide={() => setShowNotificationsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-bell me-2"></i>
            Notifications
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notifications.length > 0 ? (
            <ListGroup>
              {notifications.map(notification => (
                <ListGroup.Item 
                  key={notification.id}
                  className={`notification-item ${
                    notification.type === 'appointment_accepted' ? 'border-success' : 
                    notification.type === 'appointment_rejected' ? 'border-danger' : 'border-info'
                  }`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="mb-1">{notification.message}</p>
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={async () => {
                        // Marquer comme lu
                        try {
                          await updateDoc(doc(db, 'notifications', notification.id), {
                            read: true
                          });
                          
                          // Mettre à jour l'état local
                          setNotifications(prev => 
                            prev.filter(n => n.id !== notification.id)
                          );
                          
                          if (notifications.length <= 1) {
                            setHasNewNotifications(false);
                          }
                        } catch (error) {
                          console.error('Erreur:', error);
                        }
                      }}
                    >
                      Marquer comme lu
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
              <p>Aucune notification non lue</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotificationsModal(false)}>
            Fermer
          </Button>
          {notifications.length > 0 && (
            <Button 
              variant="primary"
              onClick={async () => {
                try {
                  // Marquer toutes les notifications comme lues
                  const batch = writeBatch(db);
                  notifications.forEach(notification => {
                    batch.update(doc(db, 'notifications', notification.id), { read: true });
                  });
                  await batch.commit();
                  
                  setNotifications([]);
                  setHasNewNotifications(false);
                  setShowNotificationsModal(false);
                } catch (error) {
                  console.error('Erreur:', error);
                }
              }}
            >
              Tout marquer comme lu
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .patient-dashboard {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .nav-pills .nav-link {
          border-radius: 0;
          padding: 1rem;
          color: #495057;
        }
        
        .nav-pills .nav-link.active {
          background-color: #007bff;
          color: white;
        }
        
        .appointments-list {
          max-height: ${isMobile ? '400px' : '600px'};
          overflow-y: auto;
        }
        
        .appointments-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .appointments-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .appointments-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .appointments-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .notification-item {
          border-left-width: 4px;
        }
        
        .notification-item.border-success {
          border-left-color: #28a745;
        }
        
        .notification-item.border-danger {
          border-left-color: #dc3545;
        }
        
        .notification-item.border-info {
          border-left-color: #17a2b8;
        }
        
        /* Styles spécifiques pour mobile */
        @media (max-width: 767px) {
          .card-body {
            padding: 1rem;
          }
          
          .nav-pills .nav-link {
            padding: 0.75rem 1rem;
          }
          
          .text-break {
            word-break: break-word;
          }
        }
      `}</style>
    </Container>
  );
};

export default PatientDashboard;









import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Nav, Tab, Badge, ListGroup, Spinner, Offcanvas } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { FaUser, FaHospital, FaCalendarAlt, FaSignOutAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaUserMd, FaClock, FaBars } from 'react-icons/fa';
import { useMediaQuery } from 'react-responsive';

const PatientDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});
  const navigate = useNavigate();
  
  // État pour le menu mobile
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Détection du type d'appareil
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 });
  const isDesktop = useMediaQuery({ minWidth: 992 });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si les données du patient sont dans le localStorage
        const patientData = localStorage.getItem('patientData');
        
        if (!patientData) {
          navigate('/');
          return;
        }

        const parsedData = JSON.parse(patientData);
        setPatient(parsedData);
        
        // Charger les structures associées au patient
        await loadStructures(parsedData);
        
        // Configurer l'écoute en temps réel des rendez-vous
        setupAppointmentsListener(parsedData.id);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement de vos données.");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadStructures = async (patientData) => {
    try {
      if (!patientData.structures || patientData.structures.length === 0) {
        return;
      }

      // Configurer l'écoute en temps réel des structures
      const unsubscribeStructures = [];
      
      patientData.structures.forEach(structureId => {
        const unsubscribe = onSnapshot(
          doc(db, 'structures', structureId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setStructures(prevStructures => {
                // Vérifier si la structure existe déjà dans le tableau
                const existingIndex = prevStructures.findIndex(s => s.id === structureId);
                const newStructure = { id: docSnapshot.id, ...docSnapshot.data() };
                
                if (existingIndex >= 0) {
                  // Mettre à jour la structure existante
                  const updatedStructures = [...prevStructures];
                  updatedStructures[existingIndex] = newStructure;
                  return updatedStructures;
                } else {
                  // Ajouter la nouvelle structure
                  return [...prevStructures, newStructure];
                }
              });
            }
          },
          (error) => {
            console.error(`Erreur lors de l'écoute de la structure ${structureId}:`, error);
          }
        );
        
        unsubscribeStructures.push(unsubscribe);
      });

      // Ajouter la fonction de nettoyage au useEffect
      return () => {
        unsubscribeStructures.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setError("Une erreur est survenue lors du chargement des structures associées.");
    }
  };

  const setupAppointmentsListener = (patientId) => {
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId)
      );
      
      // Configurer l'écoute en temps réel des rendez-vous
      const unsubscribeAppointments = onSnapshot(
        appointmentsQuery,
        async (querySnapshot) => {
          if (querySnapshot.empty) {
            setAppointments([]);
            setAssignedDoctors([]);
            setDoctorAppointments({});
            setLoading(false);
            return;
          }

          // Structure pour stocker les rendez-vous par médecin
          const appointmentsByDoctor = {};
          // Ensemble pour stocker les IDs uniques des médecins
          const doctorIds = new Set();
          
          // Organiser les rendez-vous par médecin
          querySnapshot.docs.forEach(doc => {
            const appointmentData = { id: doc.id, ...doc.data() };
            const doctorId = appointmentData.doctorId;
            
            if (doctorId) {
              doctorIds.add(doctorId);
              
              if (!appointmentsByDoctor[doctorId]) {
                appointmentsByDoctor[doctorId] = [];
              }
              
              appointmentsByDoctor[doctorId].push(appointmentData);
            }
          });
          
          // Récupérer les informations complètes des médecins
          const doctorsData = await Promise.all(
            Array.from(doctorIds).map(async (doctorId) => {
              const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
              if (doctorDoc.exists()) {
                return { id: doctorDoc.id, ...doctorDoc.data() };
              }
              return null;
            })
          );
          
          // Filtrer les médecins null
          const validDoctors = doctorsData.filter(d => d !== null);
          
          // Pour chaque rendez-vous, récupérer les infos de structure
          for (const doctorId in appointmentsByDoctor) {
            for (let i = 0; i < appointmentsByDoctor[doctorId].length; i++) {
              const apt = appointmentsByDoctor[doctorId][i];
              if (apt.structureId) {
                const structureDoc = await getDoc(doc(db, 'structures', apt.structureId));
                if (structureDoc.exists()) {
                  appointmentsByDoctor[doctorId][i].structureInfo = { 
                    id: structureDoc.id, 
                    ...structureDoc.data() 
                  };
                }
              }
            }
          }
          
          // Mettre à jour les états
          setAssignedDoctors(validDoctors);
          setDoctorAppointments(appointmentsByDoctor);
          setAppointments(Object.values(appointmentsByDoctor).flat());
          
          setLoading(false);
        },
        (error) => {
          console.error("Erreur lors de l'écoute des rendez-vous:", error);
          setError("Une erreur est survenue lors du chargement de vos rendez-vous.");
          setLoading(false);
        }
      );

      // Configurer l'écoute en temps réel pour chaque médecin
      const doctorListeners = new Map();
      
      const setupDoctorListeners = async (doctorIds) => {
        // Nettoyer les listeners existants pour les médecins qui ne sont plus pertinents
        for (const [docId, unsubscribe] of doctorListeners.entries()) {
          if (!doctorIds.has(docId)) {
            unsubscribe();
            doctorListeners.delete(docId);
          }
        }
        
        // Ajouter de nouveaux listeners pour les nouveaux médecins
        for (const doctorId of doctorIds) {
          if (!doctorListeners.has(doctorId)) {
            const unsubscribe = onSnapshot(
              doc(db, 'medecins', doctorId),
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  setAssignedDoctors(prevDoctors => {
                    const existingIndex = prevDoctors.findIndex(d => d.id === doctorId);
                    const newDoctor = { id: docSnapshot.id, ...docSnapshot.data() };
                    
                    if (existingIndex >= 0) {
                      const updatedDoctors = [...prevDoctors];
                      updatedDoctors[existingIndex] = newDoctor;
                      return updatedDoctors;
                    } else {
                      return [...prevDoctors, newDoctor];
                    }
                  });
                }
              },
              (error) => {
                console.error(`Erreur lors de l'écoute du médecin ${doctorId}:`, error);
              }
            );
            
            doctorListeners.set(doctorId, unsubscribe);
          }
        }
      };
      
      // Observer les changements dans les IDs des médecins
      const unsubscribeDoctorIds = onSnapshot(
        appointmentsQuery,
        (querySnapshot) => {
          const newDoctorIds = new Set();
          querySnapshot.docs.forEach(doc => {
            const doctorId = doc.data().doctorId;
            if (doctorId) {
              newDoctorIds.add(doctorId);
            }
          });
          
          setupDoctorListeners(newDoctorIds);
        }
      );
      
      // Fonction de nettoyage pour tous les listeners
      return () => {
        unsubscribeAppointments();
        unsubscribeDoctorIds();
        for (const unsubscribe of doctorListeners.values()) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration des listeners:", error);
      setError("Une erreur est survenue lors de la configuration des mises à jour en temps réel.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('patientData');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setError("Une erreur est survenue lors de la déconnexion.");
    }
  };

  const handleTabSelect = (key) => {
    setActiveTab(key);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Chargement de vos données...</span>
      </Container>
    );
  }

  // Composant de barre latérale de navigation
  const SidebarNavigation = () => (
    <Card className="shadow-sm border-0 h-100">
      <Card.Body className="p-0">
        <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={handleTabSelect}>
          <Nav.Item>
            <Nav.Link eventKey="profile" className="d-flex align-items-center">
              <FaUser className="me-2" />
              Mon profil
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="structures" className="d-flex align-items-center">
              <FaHospital className="me-2" />
              Mes structures
              <Badge bg="primary" className="ms-auto">{structures.length}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="appointments" className="d-flex align-items-center">
              <FaCalendarAlt className="me-2" />
              Mes rendez-vous
              <Badge bg="primary" className="ms-auto">{appointments.length}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="patient-dashboard py-4">
      {/* Header - Adapté pour mobile et desktop */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {isMobile && (
                    <Button 
                      variant="light" 
                      className="me-2 d-md-none" 
                      onClick={() => setShowSidebar(true)}
                    >
                      <FaBars />
                    </Button>
                  )}
                  <div className="patient-avatar me-3">
                    {patient?.photo ? (
                      <img 
                        src={patient.photo} 
                        alt={`${patient.nom} ${patient.prenom}`} 
                        className="rounded-circle"
                        style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="avatar-placeholder rounded-circle bg-primary d-flex align-items-center justify-content-center text-white" 
                        style={{ width: isMobile ? '40px' : '60px', height: isMobile ? '40px' : '60px' }}
                      >
                        <FaUser size={isMobile ? 20 : 30} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{patient?.nom} {patient?.prenom}</h4>
                    <p className="text-muted mb-0">
                      <FaIdCard className="me-1" />
                      Patient
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline-danger" 
                  onClick={handleLogout}
                  className="d-flex align-items-center"
                  size={isMobile ? "sm" : ""}
                >
                  <FaSignOutAlt className={isMobile ? "" : "me-2"} />
                  {!isMobile && "Déconnexion"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      {/* Version mobile: Sidebar comme Offcanvas */}
      {isMobile && (
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarNavigation />
          </Offcanvas.Body>
        </Offcanvas>
      )}

      <Row>
        {/* Sidebar pour desktop et tablette */}
        {!isMobile && (
          <Col md={3} lg={3} className="mb-4">
            <SidebarNavigation />
          </Col>
        )}

        {/* Contenu principal - s'adapte à la largeur complète sur mobile */}
        <Col xs={12} md={9} lg={9}>
          <Tab.Content>
            {/* Onglet Profil */}
            <Tab.Pane eventKey="profile" active={activeTab === "profile"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaUser className="me-2" />
                    Informations personnelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <strong>Nom:</strong> {patient?.nom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Prénom:</strong> {patient?.prenom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Âge:</strong> {patient?.age} ans
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Sexe:</strong> {patient?.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                    <Col xs={12} md={6} className={isMobile ? 'mt-3' : ''}>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaEnvelope className="me-2 text-primary" />
                          <div className="text-break">
                            <strong>Email:</strong><br />
                            {patient?.email}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaPhoneAlt className="me-2 text-primary" />
                          <div>
                            <strong>Téléphone:</strong><br />
                            {patient?.telephone || 'Non renseigné'}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-primary" />
                          <div className="text-break">
                            <strong>Adresse:</strong><br />
                            {patient?.adresse || 'Non renseignée'}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                  </Row>

                  {patient?.insurance && patient.insurance.length > 0 && (
                    <div className="mt-4">
                      <h6>Assurances:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {patient.insurance.map((ins, index) => (
                          <Badge key={index} bg="info" className="p-2">
                            {ins}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient?.antecedents && patient.antecedents.length > 0 && (
                    <div className="mt-4">
                      <h6>Antécédents médicaux:</h6>
                      <ListGroup>
                        {patient.antecedents.map((ant, index) => (
                          <ListGroup.Item key={index}>{ant}</ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Onglet Structures */}
            <Tab.Pane eventKey="structures" active={activeTab === "structures"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaHospital className="me-2" />
                    Mes structures médicales
                  </h5>
                </Card.Header>
                <Card.Body>
                  {structures.length > 0 ? (
                    <Row xs={1} md={isTablet ? 1 : 2} className="g-4">
                      {structures.map(structure => (
                        <Col key={structure.id}>
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                {structure.photoUrl ? (
                                  <img 
                                    src={structure.photoUrl} 
                                    alt={structure.name} 
                                    className="me-3 rounded"
                                    style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="bg-light rounded d-flex align-items-center justify-content-center me-3" 
                                    style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px' }}
                                  >
                                    <FaHospital size={isMobile ? 20 : 25} className="text-primary" />
                                  </div>
                                )}
                                <div>
                                  <Card.Title className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>{structure.name}</Card.Title>
                                  {structure.specialties && structure.specialties.length > 0 && (
                                    <small className="text-muted">
                                      {structure.specialties.slice(0, 2).join(', ')}
                                      {structure.specialties.length > 2 && '...'}
                                    </small>
                                  )}
                                </div>
                              </div>
                              
                              <ListGroup variant="flush" className="small">
                                <ListGroup.Item className="px-0 py-2 text-break">
                                  <FaMapMarkerAlt className="me-2 text-primary" />
                                  {structure.address || 'Adresse non renseignée'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2">
                                  <FaPhoneAlt className="me-2 text-primary" />
                                  {structure.phones?.mobile || structure.phones?.landline || 'Téléphone non renseigné'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2 text-break">
                                  <FaEnvelope className="me-2 text-primary" />
                                  {structure.email || 'Email non renseigné'}
                                </ListGroup.Item>
                              </ListGroup>
                            </Card.Body>
                            <Card.Footer className="bg-white">
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted d-none d-md-block">
                                  Affilié depuis: {new Date(patient?.dateInscription || Date.now()).toLocaleDateString()}
                                </small>
                                <Button variant="outline-primary" size="sm" className="w-100 w-md-auto">
                                  Voir détails
                                </Button>
                              </div>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <FaHospital size={isMobile ? 30 : 40} className="text-muted mb-3" />
                      <h5 className={isMobile ? 'fs-6' : ''}>Aucune structure associée</h5>
                      <p className="text-muted">
                        Vous n'êtes actuellement affilié à aucune structure médicale.
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            {/* Onglet Rendez-vous */}
            <Tab.Pane eventKey="appointments" active={activeTab === "appointments"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className={`mb-0 ${isMobile ? 'fs-6' : ''}`}>
                    <FaCalendarAlt className="me-2" />
                    Mes rendez-vous
                  </h5>
                </Card.Header>
                <Card.Body>
                  {assignedDoctors.length > 0 ? (
                    assignedDoctors.map(doctor => (
                      <div key={doctor.id} className="assigned-doctor-info mb-4">
                        <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                          <h5 className={`border-bottom pb-2 text-primary ${isMobile ? 'fs-6' : ''}`}>
                            <FaUserMd className="me-2" />
                            Dr. {doctor.nom} {doctor.prenom}
                          </h5>
                          <Row>
                            <Col xs={12} md={6}>
                              <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                              <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                              <p><strong>Email:</strong> {doctor.email}</p>
                            </Col>
                            <Col xs={12} md={6} className={isMobile ? 'mt-2' : ''}>
                              <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                              <p><strong>Jours disponibles:</strong></p>
                              <div className="d-flex flex-wrap gap-1 mb-2">
                                {doctor.disponibilite?.map(day => (
                                  <span key={day} className="badge bg-info">{day}</span>
                                ))}
                              </div>
                            </Col>
                          </Row>
                        </div>

                        <div className="appointments-section">
                          <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
                          {doctorAppointments[doctor.id]?.length > 0 ? (
                            <div className="appointments-list">
                              {doctorAppointments[doctor.id]
                                .sort((a, b) => {
                                  // Définir l'ordre des jours de la semaine
                                  const weekdayOrder = {
                                    'Lundi': 1,
                                    'Mardi': 2,
                                    'Mercredi': 3,
                                    'Jeudi': 4,
                                    'Vendredi': 5,
                                    'Samedi': 6,
                                    'Dimanche': 7
                                  };
                                  return weekdayOrder[a.day] - weekdayOrder[b.day];
                                })
                                .map(apt => (
                                  <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                                    <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between align-items-center'}`}>
                                      <div>
                                        <p className="mb-1">
                                          <FaCalendarAlt className="me-2 text-primary" />
                                          <strong>Jour:</strong> {apt.day}
                                        </p>
                                        <p className="mb-1">
                                          <FaClock className="me-2 text-primary" />
                                          <strong>Heure:</strong> {apt.timeSlot}
                                        </p>
                                        <p className={`${isMobile ? 'mb-2' : 'mb-0'}`}>
                                          <FaHospital className="me-2 text-primary" />
                                          <strong>Structure:</strong> {apt.structureInfo?.name || 'Non spécifiée'}
                                        </p>
                                      </div>
                                      <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'} ${isMobile ? 'align-self-start' : ''}`}>
                                        {apt.status === 'completed' ? 'Terminé' : 'En attente'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4">
                      <FaUserMd size={isMobile ? 30 : 40} className="text-muted mb-3" />
                      <p>Aucun médecin assigné pour le moment</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>

      <style jsx>{`
        .patient-dashboard {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .nav-pills .nav-link {
          border-radius: 0;
          padding: 1rem;
          color: #495057;
        }
        
        .nav-pills .nav-link.active {
          background-color: #007bff;
          color: white;
        }
        
        .appointments-list {
          max-height: ${isMobile ? '400px' : '600px'};
          overflow-y: auto;
        }
        
        .appointments-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .appointments-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .appointments-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .appointments-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Styles spécifiques pour mobile */
        @media (max-width: 767px) {
          .card-body {
            padding: 1rem;
          }
          
          .nav-pills .nav-link {
            padding: 0.75rem 1rem;
          }
          
          .text-break {
            word-break: break-word;
          }
        }
      `}</style>
    </Container>
  );
};

export default PatientDashboard;




















import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Nav, Tab, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FaUser, FaHospital, FaCalendarAlt, FaSignOutAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaUserMd, FaClock } from 'react-icons/fa';

const PatientDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
    // Ajout de ces états dans PatientDashboard
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si les données du patient sont dans le localStorage
        const patientData = localStorage.getItem('patientData');
        
        if (!patientData) {
          navigate('/');
          return;
        }

        const parsedData = JSON.parse(patientData);
        setPatient(parsedData);
        
        // Charger les structures associées au patient
        await loadStructures(parsedData);
        
        // Charger les rendez-vous du patient
        await loadAppointments(parsedData.id);
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement de vos données.");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadStructures = async (patientData) => {
    try {
      if (!patientData.structures || patientData.structures.length === 0) {
        return;
      }

      const structuresData = await Promise.all(
        patientData.structures.map(async (structureId) => {
          const structureDoc = await getDoc(doc(db, 'structures', structureId));
          if (structureDoc.exists()) {
            return { id: structureDoc.id, ...structureDoc.data() };
          }
          return null;
        })
      );

      setStructures(structuresData.filter(s => s !== null));
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setError("Une erreur est survenue lors du chargement des structures associées.");
    }
  };


// Modification de la fonction loadAppointments
const loadAppointments = async (patientId) => {
  try {
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId)
    );
    
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    
    if (appointmentsSnapshot.empty) {
      return;
    }

    // Structure pour stocker les rendez-vous par médecin
    const appointmentsByDoctor = {};
    // Ensemble pour stocker les IDs uniques des médecins
    const doctorIds = new Set();
    
    // Organiser les rendez-vous par médecin
    appointmentsSnapshot.docs.forEach(doc => {
      const appointmentData = { id: doc.id, ...doc.data() };
      const doctorId = appointmentData.doctorId;
      
      if (doctorId) {
        doctorIds.add(doctorId);
        
        if (!appointmentsByDoctor[doctorId]) {
          appointmentsByDoctor[doctorId] = [];
        }
        
        appointmentsByDoctor[doctorId].push(appointmentData);
      }
    });
    
    // Récupérer les informations complètes des médecins
    const doctorsData = await Promise.all(
      Array.from(doctorIds).map(async (doctorId) => {
        const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
        if (doctorDoc.exists()) {
          return { id: doctorDoc.id, ...doctorDoc.data() };
        }
        return null;
      })
    );
    
    // Filtrer les médecins null
    const validDoctors = doctorsData.filter(d => d !== null);
    
    // Pour chaque rendez-vous, récupérer les infos de structure
    for (const doctorId in appointmentsByDoctor) {
      for (let i = 0; i < appointmentsByDoctor[doctorId].length; i++) {
        const apt = appointmentsByDoctor[doctorId][i];
        if (apt.structureId) {
          const structureDoc = await getDoc(doc(db, 'structures', apt.structureId));
          if (structureDoc.exists()) {
            appointmentsByDoctor[doctorId][i].structureInfo = { 
              id: structureDoc.id, 
              ...structureDoc.data() 
            };
          }
        }
      }
    }
    
    // Mettre à jour les états
    setAssignedDoctors(validDoctors);
    setDoctorAppointments(appointmentsByDoctor);
    setAppointments(Object.values(appointmentsByDoctor).flat());
    
    setLoading(false);
  } catch (error) {
    console.error("Erreur lors du chargement des rendez-vous:", error);
    setError("Une erreur est survenue lors du chargement de vos rendez-vous.");
    setLoading(false);
  }
};


  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('patientData');
      localStorage.removeItem('isAuthenticated');
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setError("Une erreur est survenue lors de la déconnexion.");
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Chargement de vos données...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="patient-dashboard py-4">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="patient-avatar me-3">
                    {patient?.photo ? (
                      <img 
                        src={patient.photo} 
                        alt={`${patient.nom} ${patient.prenom}`} 
                        className="rounded-circle"
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="avatar-placeholder rounded-circle bg-primary d-flex align-items-center justify-content-center text-white" style={{ width: '60px', height: '60px' }}>
                        <FaUser size={30} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-0">{patient?.nom} {patient?.prenom}</h4>
                    <p className="text-muted mb-0">
                      <FaIdCard className="me-2" />
                      Patient
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline-danger" 
                  onClick={handleLogout}
                  className="d-flex align-items-center"
                >
                  <FaSignOutAlt className="me-2" />
                  Déconnexion
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={3} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
                <Nav.Item>
                  <Nav.Link eventKey="profile" className="d-flex align-items-center">
                    <FaUser className="me-2" />
                    Mon profil
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="structures" className="d-flex align-items-center">
                    <FaHospital className="me-2" />
                    Mes structures
                    <Badge bg="primary" className="ms-auto">{structures.length}</Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="appointments" className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2" />
                    Mes rendez-vous
                    <Badge bg="primary" className="ms-auto">{appointments.length}</Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Tab.Content>
            <Tab.Pane eventKey="profile" active={activeTab === "profile"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <FaUser className="me-2" />
                    Informations personnelles
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <strong>Nom:</strong> {patient?.nom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Prénom:</strong> {patient?.prenom}
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Âge:</strong> {patient?.age} ans
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <strong>Sexe:</strong> {patient?.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                    <Col md={6}>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaEnvelope className="me-2 text-primary" />
                          <div>
                            <strong>Email:</strong><br />
                            {patient?.email}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaPhoneAlt className="me-2 text-primary" />
                          <div>
                            <strong>Téléphone:</strong><br />
                            {patient?.telephone || 'Non renseigné'}
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex align-items-center">
                          <FaMapMarkerAlt className="me-2 text-primary" />
                          <div>
                            <strong>Adresse:</strong><br />
                            {patient?.adresse || 'Non renseignée'}
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Col>
                  </Row>

                  {patient?.insurance && patient.insurance.length > 0 && (
                    <div className="mt-4">
                      <h6>Assurances:</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {patient.insurance.map((ins, index) => (
                          <Badge key={index} bg="info" className="p-2">
                            {ins}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient?.antecedents && patient.antecedents.length > 0 && (
                    <div className="mt-4">
                      <h6>Antécédents médicaux:</h6>
                      <ListGroup>
                        {patient.antecedents.map((ant, index) => (
                          <ListGroup.Item key={index}>{ant}</ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="structures" active={activeTab === "structures"}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <FaHospital className="me-2" />
                    Mes structures médicales
                  </h5>
                </Card.Header>
                <Card.Body>
                  {structures.length > 0 ? (
                    <Row xs={1} md={2} className="g-4">
                      {structures.map(structure => (
                        <Col key={structure.id}>
                          <Card className="h-100 shadow-sm">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                {structure.photoUrl ? (
                                  <img 
                                    src={structure.photoUrl} 
                                    alt={structure.name} 
                                    className="me-3 rounded"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className="bg-light rounded d-flex align-items-center justify-content-center me-3" style={{ width: '50px', height: '50px' }}>
                                    <FaHospital size={25} className="text-primary" />
                                  </div>
                                )}
                                <div>
                                  <Card.Title className="mb-0">{structure.name}</Card.Title>
                                  {structure.specialties && structure.specialties.length > 0 && (
                                    <small className="text-muted">
                                      {structure.specialties.slice(0, 2).join(', ')}
                                      {structure.specialties.length > 2 && '...'}
                                    </small>
                                  )}
                                </div>
                              </div>
                              
                              <ListGroup variant="flush" className="small">
                                <ListGroup.Item className="px-0 py-2">
                                  <FaMapMarkerAlt className="me-2 text-primary" />
                                  {structure.address || 'Adresse non renseignée'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2">
                                  <FaPhoneAlt className="me-2 text-primary" />
                                  {structure.phones?.mobile || structure.phones?.landline || 'Téléphone non renseigné'}
                                </ListGroup.Item>
                                <ListGroup.Item className="px-0 py-2">
                                  <FaEnvelope className="me-2 text-primary" />
                                  {structure.email || 'Email non renseigné'}
                                </ListGroup.Item>
                              
                                </ListGroup>
                            </Card.Body>
                            <Card.Footer className="bg-white">
                              <div className="d-flex justify-content-between">
                                <small className="text-muted">
                                  Affilié depuis: {new Date(patient?.dateInscription || Date.now()).toLocaleDateString()}
                                </small>
                                <Button variant="outline-primary" size="sm">
                                  Voir détails
                                </Button>
                              </div>
                            </Card.Footer>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-5">
                      <FaHospital size={40} className="text-muted mb-3" />
                      <h5>Aucune structure associée</h5>
                      <p className="text-muted">
                        Vous n'êtes actuellement affilié à aucune structure médicale.
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            
            <Tab.Pane eventKey="appointments" active={activeTab === "appointments"}>
  <Card className="shadow-sm border-0">
    <Card.Header className="bg-primary text-white">
      <h5 className="mb-0">
        <FaCalendarAlt className="me-2" />
        Mes rendez-vous
      </h5>
    </Card.Header>
    <Card.Body>
      {assignedDoctors.length > 0 ? (
        assignedDoctors.map(doctor => (
          <div key={doctor.id} className="assigned-doctor-info mb-4">
            <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
              <h5 className="border-bottom pb-2 text-primary">
                <i className="fas fa-user-md me-2"></i>
                Dr. {doctor.nom} {doctor.prenom}
              </h5>
              <Row>
                <Col md={6}>
                  <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                  <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                  <p><strong>Email:</strong> {doctor.email}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                  <p><strong>Jours disponibles:</strong></p>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {doctor.disponibilite?.map(day => (
                      <span key={day} className="badge bg-info">{day}</span>
                    ))}
                  </div>
                </Col>
              </Row>
            </div>

            <div className="appointments-section">
              <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
              {doctorAppointments[doctor.id]?.length > 0 ? (
                <div className="appointments-list">
                  {doctorAppointments[doctor.id]
                    .sort((a, b) => {
                      // Définir l'ordre des jours de la semaine
                      const weekdayOrder = {
                        'Lundi': 1,
                        'Mardi': 2,
                        'Mercredi': 3,
                        'Jeudi': 4,
                        'Vendredi': 5,
                        'Samedi': 6,
                        'Dimanche': 7
                      };
                      return weekdayOrder[a.day] - weekdayOrder[b.day];
                    })
                    .map(apt => (
                      <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="mb-1">
                              <i className="fas fa-calendar-day me-2 text-primary"></i>
                              <strong>Jour:</strong> {apt.day}
                            </p>
                            <p className="mb-0">
                              <i className="fas fa-clock me-2 text-primary"></i>
                              <strong>Heure:</strong> {apt.timeSlot}
                            </p>
                            <p className="mb-0">
                              <i className="fas fa-hospital me-2 text-primary"></i>
                              <strong>Structure:</strong> {apt.structureInfo?.name || 'Non spécifiée'}
                            </p>
                          </div>
                          <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                            {apt.status === 'completed' ? 'Terminé' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center p-4">
          <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
          <p>Aucun médecin assigné pour le moment</p>
        </div>
      )}
    </Card.Body>
  </Card>
</Tab.Pane>

          </Tab.Content>
        </Col>
      </Row>

      <style jsx>{`
        .patient-dashboard {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        
        .nav-pills .nav-link {
          border-radius: 0;
          padding: 1rem;
          color: #495057;
        }
        
        .nav-pills .nav-link.active {
          background-color: #007bff;
          color: white;
        }
        
        .appointments-list {
          max-height: 600px;
          overflow-y: auto;
        }
        
        .appointments-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .appointments-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .appointments-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        
        .appointments-list::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </Container>
  );
};

export default PatientDashboard;






















import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab, Badge, ListGroup, Spinner, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaUser, FaHospital, FaCalendarAlt, FaPhoneAlt, FaMapMarkerAlt, FaEnvelope, FaIdCard, FaVenusMars, FaSignOutAlt, FaFileInvoice, FaCalendarPlus, FaUserMd, FaClock } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // États pour la prise de rendez-vous
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [structureDoctors, setStructureDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const patientData = localStorage.getItem('patientData');
    
    if (!patientData) {
      navigate('/');
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const parsedPatientData = JSON.parse(patientData);
        setPatient(parsedPatientData);

        // Récupérer les structures associées au patient
        if (parsedPatientData.structures && parsedPatientData.structures.length > 0) {
          const structuresData = await Promise.all(
            parsedPatientData.structures.map(async (structureId) => {
              const structureDoc = await getDoc(doc(db, 'structures', structureId));
              if (structureDoc.exists()) {
                return { id: structureDoc.id, ...structureDoc.data() };
              }
              return null;
            })
          );
          setStructures(structuresData.filter(s => s !== null));
        }

        // Récupérer les rendez-vous du patient
        await fetchAppointments(parsedPatientData.id);
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError("Une erreur est survenue lors du chargement des données.");
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [navigate]);

  const fetchAppointments = async (patientId) => {
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', patientId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);

      // Récupérer les informations des médecins pour les rendez-vous
      const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctorId))];
      if (doctorIds.length > 0) {
        const doctorsData = await Promise.all(
          doctorIds.map(async (doctorId) => {
            const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
            if (doctorDoc.exists()) {
              return { id: doctorDoc.id, ...doctorDoc.data() };
            }
            return null;
          })
        );
        setDoctors(doctorsData.filter(d => d !== null));
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des rendez-vous:", err);
      setError("Une erreur est survenue lors du chargement des rendez-vous.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('patientData');
      navigate('/');
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
      setError("Une erreur est survenue lors de la déconnexion.");
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Médecin inconnu';
  };

  const getStructureName = (structureId) => {
    const structure = structures.find(s => s.id === structureId);
    return structure ? structure.name : 'Structure inconnue';
  };

  // Fonctions pour la prise de rendez-vous
  const openBookingModal = async (structure) => {
    setSelectedStructure(structure);
    setBookingSuccess(false);
    setBookingError('');
    
    try {
      // Récupérer les médecins de cette structure
      const doctorsQuery = query(
        collection(db, 'doctors'),
        where('structureIds', 'array-contains', structure.id)
      );
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const structureDoctorsData = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStructureDoctors(structureDoctorsData);
      setShowBookingModal(true);
    } catch (err) {
      console.error("Erreur lors de la récupération des médecins:", err);
      setBookingError("Impossible de charger les médecins de cette structure.");
    }
  };

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    setSelectedTimeSlot('');
    
    if (doctorId) {
      try {
        // Convertir la date sélectionnée au format jour de la semaine
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const dayOfWeek = days[selectedDate.getDay()];
        
        // Récupérer les disponibilités du médecin pour ce jour
        const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data();
          const availability = doctorData.availability || {};
          
          // Récupérer les créneaux disponibles pour ce jour
          const daySlots = availability[dayOfWeek] || [];
          
          // Récupérer les rendez-vous existants pour ce médecin à cette date
          const formattedDate = selectedDate.toISOString().split('T')[0];
          const existingAppointmentsQuery = query(
            collection(db, 'appointments'),
            where('doctorId', '==', doctorId),
            where('date', '==', formattedDate)
          );
          const existingAppointmentsSnapshot = await getDocs(existingAppointmentsQuery);
          const bookedTimeSlots = existingAppointmentsSnapshot.docs.map(doc => doc.data().timeSlot);
          
          // Filtrer les créneaux déjà réservés
          const availableSlots = daySlots.filter(slot => !bookedTimeSlots.includes(slot));
          setAvailableTimeSlots(availableSlots);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des disponibilités:", err);
        setBookingError("Impossible de charger les disponibilités du médecin.");
      }
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    
    // Réinitialiser les créneaux disponibles
    if (selectedDoctor) {
      handleDoctorChange({ target: { value: selectedDoctor } });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedTimeSlot || !bookingReason) {
      setBookingError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    setBookingLoading(true);
    setBookingError('');
    
    try {
      // Convertir la date sélectionnée au format jour de la semaine
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const dayOfWeek = days[selectedDate.getDay()];
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Créer le rendez-vous dans Firestore
      const appointmentData = {
        patientId: patient.id,
        doctorId: selectedDoctor,
        structureId: selectedStructure.id,
        date: formattedDate,
        day: dayOfWeek,
        timeSlot: selectedTimeSlot,
        reason: bookingReason,
        status: 'scheduled',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Mettre à jour la liste des rendez-vous
      await fetchAppointments(patient.id);
      
      setBookingSuccess(true);
      setBookingLoading(false);
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedDoctor('');
        setSelectedDate(new Date());
        setSelectedTimeSlot('');
        setBookingReason('');
        setBookingSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error("Erreur lors de la prise de rendez-vous:", err);
      setBookingError("Une erreur est survenue lors de la prise de rendez-vous.");
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Chargement...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </Container>
    );
  }

  return (
    <Container fluid className="patient-dashboard py-4">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="profile-image me-3">
                    {patient?.photoURL ? (
                      <img 
                        src={patient.photoURL} 
                        alt="Profile" 
                        className="rounded-circle" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-primary d-flex justify-content-center align-items-center text-white" 
                        style={{ width: '60px', height: '60px' }}
                      >
                        <FaUser size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-0">{patient?.firstName} {patient?.lastName}</h4>
                    <p className="text-muted mb-0">
                      <FaIdCard className="me-2" />
                      ID Patient: {patient?.id?.substring(0, 8)}
                    </p>
                  </div>
                </div>
                <Button variant="outline-danger" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" />
                  Déconnexion
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="profile" title={<span><FaUser className="me-2" />Profil</span>}>
                  <Row>
                    <Col md={4} className="mb-4">
                      <Card className="h-100 hover-card shadow-sm">
                        <Card.Body>
                          <h5 className="card-title mb-3">Informations personnelles</h5>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-center">
                              <span><FaUser className="me-2 text-primary" />Nom complet</span>
                              <span className="fw-bold">{patient?.firstName} {patient?.lastName}</span>
                            </ListGroup.Item>
                            {patient?.birthDate && (
                              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span><FaCalendarAlt className="me-2 text-primary" />Date de naissance</span>
                                <span className="fw-bold">{new Date(patient.birthDate).toLocaleDateString('fr-FR')}</span>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span><FaVenusMars className="me-2 text-primary" />Genre</span>
                                <span className="fw-bold">{patient?.gender === 'male' ? 'Homme' : 'Femme'}</span>
                              </ListGroup.Item>
                            )}
                            {patient?.phoneNumber && (
                              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span><FaPhoneAlt className="me-2 text-primary" />Téléphone</span>
                                <span className="fw-bold">{patient?.phoneNumber}</span>
                              </ListGroup.Item>
                            )}
                            {patient?.email && (
                              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span><FaEnvelope className="me-2 text-primary" />Email</span>
                                <span className="fw-bold">{patient?.email}</span>
                              </ListGroup.Item>
                            )}
                            {patient?.address && (
                              <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                <span><FaMapMarkerAlt className="me-2 text-primary" />Adresse</span>
                                <span className="fw-bold">{patient?.address}</span>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={8} className="mb-4">
                      <Card className="h-100 hover-card shadow-sm">
                        <Card.Body>
                          <h5 className="card-title mb-3">Mes structures médicales</h5>
                          {structures.length > 0 ? (
                            <Row>
                              {structures.map((structure) => (
                                <Col md={6} key={structure.id} className="mb-3">
                                  <Card className="border hover-card h-100">
                                    <Card.Body>
                                      <h6 className="fw-bold">
                                        <FaHospital className="me-2 text-primary" />
                                        {structure.name}
                                      </h6>
                                      {structure.address && (
                                        <p className="mb-2 small">
                                          <FaMapMarkerAlt className="me-2" />
                                          {structure.address}
                                        </p>
                                      )}
                                      {structure.phone && (
                                        <p className="mb-2 small">
                                          <FaPhoneAlt className="me-2" />
                                          {structure.phone}
                                        </p>
                                      )}
                                      <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="mt-2"
                                        onClick={() => openBookingModal(structure)}
                                      >
                                        <FaCalendarPlus className="me-2" />
                                        Prendre rendez-vous
                                      </Button>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          ) : (
                            <Alert variant="info">
                              Vous n'êtes associé à aucune structure médicale pour le moment.
                            </Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>
                
                <Tab eventKey="appointments" title={<span><FaCalendarAlt className="me-2" />Rendez-vous</span>}>
                  <Card className="hover-card shadow-sm">
                    <Card.Body>
                      <h5 className="card-title mb-3">Mes rendez-vous</h5>
                      
                      {appointments.length > 0 ? (
                        <ListGroup>
                          {appointments
                            .sort((a, b) => {
                              // Trier par jour de la semaine puis par heure
                              const weekdayOrder = {
                                'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
                                'Vendredi': 5, 'Samedi': 6, 'Dimanche': 7
                              };
                              
                              if (a.day !== b.day) {
                                return weekdayOrder[a.day] - weekdayOrder[b.day];
                              }
                              return a.timeSlot.localeCompare(b.timeSlot);
                            })
                            .map(appointment => (
                              <ListGroup.Item 
                                key={appointment.id}
                                className="mb-3 border rounded shadow-sm hover-item"
                              >
                                <Row className="align-items-center">
                                  <Col md={3} className="mb-3 mb-md-0">
                                    <div className="d-flex align-items-center">
                                      <div className="appointment-date-badge me-3">
                                        <div className="day-badge bg-primary text-white p-2 text-center rounded-top">
                                          {appointment.day}
                                        </div>
                                        <div className="time-badge bg-light p-2 text-center rounded-bottom border">
                                          {appointment.timeSlot}
                                        </div>
                                      </div>
                                      <Badge bg={appointment.status === 'completed' ? 'success' : 'warning'}>
                                        {appointment.status === 'completed' ? 'Terminé' : 'Planifié'}
                                      </Badge>
                                    </div>
                                  </Col>
                                  
                                  <Col md={4} className="mb-3 mb-md-0">
                                    <h6 className="mb-1">Médecin</h6>
                                    <p className="mb-0 fw-bold">
                                      <FaUser className="me-2 text-primary" />
                                      {getDoctorName(appointment.doctorId)}
                                    </p>
                                    
                                    {doctors.find(d => d.id === appointment.doctorId)?.specialite && (
                                      <p className="mb-0 text-muted small">
                                        <span className="me-2">Spécialité:</span>
                                        {doctors.find(d => d.id === appointment.doctorId)?.specialite}
                                      </p>
                                    )}
                                  </Col>
                                  
                                  <Col md={5}>
                                    <h6 className="mb-1">Structure</h6>
                                    <p className="mb-0 fw-bold">
                                      <FaHospital className="me-2 text-primary" />
                                      {getStructureName(appointment.structureId)}
                                    </p>
                                    
                                    {structures.find(s => s.id === appointment.structureId)?.address && (
                                      <p className="mb-0 text-muted small">
                                        <FaMapMarkerAlt className="me-2" />
                                        {structures.find(s => s.id === appointment.structureId)?.address}
                                      </p>
                                    )}
                                    
                                    {appointment.reason && (
                                      <p className="mb-0 text-muted small mt-2">
                                        <span className="fw-bold">Motif:</span> {appointment.reason}
                                      </p>
                                    )}
                                  </Col>
                                </Row>
                              </ListGroup.Item>
                            ))}
                        </ListGroup>
                      ) : (
                        <Alert variant="info">
                          Vous n'avez aucun rendez-vous pour le moment.
                          {structures.length > 0 && (
                            <div className="mt-3">
                              <p>Vous pouvez prendre rendez-vous dans l'une de vos structures associées:</p>
                              <Row>
                                {structures.map((structure) => (
                                  <Col md={4} key={structure.id} className="mb-3">
                                    <Card className="border hover-card h-100">
                                      <Card.Body>
                                        <h6 className="fw-bold">{structure.name}</h6>
                                        <Button 
                                          variant="outline-primary" 
                                          size="sm" 
                                          className="mt-2"
                                          onClick={() => openBookingModal(structure)}
                                        >
                                          <FaCalendarPlus className="me-2" />
                                          Prendre rendez-vous
                                        </Button>
                                      </Card.Body>
                                    </Card>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="documents" title={<span><FaFileInvoice className="me-2" />Documents</span>}>
                  <Card className="hover-card shadow-sm">
                    <Card.Body>
                      <h5 className="card-title mb-3">Mes documents médicaux</h5>
                      <Alert variant="info">
                        Cette fonctionnalité sera disponible prochainement.
                      </Alert>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de prise de rendez-vous */}
      <Modal 
        show={showBookingModal} 
        onHide={() => setShowBookingModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCalendarPlus className="me-2" />
            Prendre rendez-vous
            {selectedStructure && <span className="ms-2">- {selectedStructure.name}</span>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingSuccess ? (
            <Alert variant="success">
              Votre rendez-vous a été pris avec succès !
            </Alert>
          ) : (
            <>
              {bookingError && <Alert variant="danger">{bookingError}</Alert>}
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUserMd className="me-2" />
                    Médecin
                  </Form.Label>
                  <Form.Select 
                    value={selectedDoctor} 
                    onChange={handleDoctorChange}
                    required
                  >
                    <option value="">Sélectionnez un médecin</option>
                    {structureDoctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName} {doctor.specialite ? `(${doctor.specialite})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaCalendarAlt className="me-2" />
                        Date du rendez-vous
                      </Form.Label>
                      <div className="calendar-container border rounded p-2">
                        <Calendar 
                          onChange={handleDateChange} 
                          value={selectedDate} 
                          minDate={new Date()} 
                          locale="fr-FR"
                          className="w-100"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaClock className="me-2" />
                        Horaire disponible
                      </Form.Label>
                      {selectedDoctor ? (
                        availableTimeSlots.length > 0 ? (
                          <div className="time-slots-container">
                            {availableTimeSlots.map(slot => (
                              <Button
                                key={slot}
                                variant={selectedTimeSlot === slot ? "primary" : "outline-primary"}
                                className="me-2 mb-2"
                                onClick={() => setSelectedTimeSlot(slot)}
                              >
                                {slot}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <Alert variant="warning">
                            Aucun créneau disponible pour cette date.
                          </Alert>
                        )
                      ) : (
                        <Alert variant="info">
                          Veuillez d'abord sélectionner un médecin.
                        </Alert>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Motif du rendez-vous</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    required
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
            Annuler
          </Button>
          {!bookingSuccess && (
            <Button 
              variant="primary" 
              onClick={handleBookAppointment}
              disabled={!selectedDoctor || !selectedTimeSlot || !bookingReason || bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <FaCalendarPlus className="me-2" />
                  Confirmer le rendez-vous
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PatientDashboard;

                              







import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Tabs, Tab, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { FaUser, FaHospital, FaCalendarAlt, FaPhoneAlt, FaMapMarkerAlt, FaEnvelope, FaIdCard, FaVenusMars, FaSignOutAlt, FaFileInvoice } from 'react-icons/fa';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const patientData = localStorage.getItem('patientData');
    
    if (!patientData) {
      navigate('/');
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const parsedPatientData = JSON.parse(patientData);
        setPatient(parsedPatientData);

        // Récupérer les structures associées au patient
        if (parsedPatientData.structures && parsedPatientData.structures.length > 0) {
          const structuresData = await Promise.all(
            parsedPatientData.structures.map(async (structureId) => {
              const structureDoc = await getDoc(doc(db, 'structures', structureId));
              if (structureDoc.exists()) {
                return { id: structureDoc.id, ...structureDoc.data() };
              }
              return null;
            })
          );
          setStructures(structuresData.filter(s => s !== null));
        }

        // Récupérer les rendez-vous du patient
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', parsedPatientData.id)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);

        // Récupérer les informations des médecins pour les rendez-vous
        const doctorIds = [...new Set(appointmentsData.map(apt => apt.doctorId))];
        if (doctorIds.length > 0) {
          const doctorsData = await Promise.all(
            doctorIds.map(async (doctorId) => {
              const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
              if (doctorDoc.exists()) {
                return { id: doctorDoc.id, ...doctorDoc.data() };
              }
              return null;
            })
          );
          setDoctors(doctorsData.filter(d => d !== null));
        }

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('patientData');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('activeRole');
      navigate('/');
    } catch (error) {
      setError("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.nom} ${doctor.prenom}` : 'Médecin inconnu';
  };

  const getStructureName = (structureId) => {
    const structure = structures.find(s => s.id === structureId);
    return structure ? structure.name : 'Structure inconnue';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Chargement des données...</span>
      </Container>
    );
  }

  return (
    <Container fluid className="patient-dashboard py-4">
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                {patient?.photo ? (
                  <img 
                    src={patient.photo} 
                    alt={patient.nom} 
                    className="rounded-circle me-3"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '60px', height: '60px' }}
                  >
                    <FaUser size={24} />
                  </div>
                )}
                <div>
                  <h4 className="mb-0">{patient?.nom} {patient?.prenom}</h4>
                  <p className="text-muted mb-0">
                    <FaIdCard className="me-2" />
                    Patient
                  </p>
                </div>
              </div>
              <Button 
                variant="outline-danger" 
                onClick={handleLogout}
                className="d-flex align-items-center"
              >
                <FaSignOutAlt className="me-2" />
                Déconnexion
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}

      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-0 border-bottom-0"
              >
                <Tab eventKey="profile" title={<span><FaUser className="me-2" />Mon Profil</span>} />
                <Tab eventKey="structures" title={<span><FaHospital className="me-2" />Mes Structures</span>} />
                <Tab eventKey="appointments" title={<span><FaCalendarAlt className="me-2" />Mes Rendez-vous</span>} />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {activeTab === 'profile' && (
                <div className="profile-section">
                  <Row>
                    <Col md={4} className="mb-4">
                      <div className="text-center">
                        {patient?.photo ? (
                          <img 
                            src={patient.photo} 
                            alt={patient.nom} 
                            className="img-fluid rounded-circle mb-3 shadow-sm"
                            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                            style={{ width: '200px', height: '200px' }}
                          >
                            <FaUser size={64} className="text-secondary" />
                          </div>
                        )}
                        <h5>{patient?.nom} {patient?.prenom}</h5>
                        <p className="text-muted">
                          <FaIdCard className="me-2" />
                          ID: {patient?.id}
                        </p>
                      </div>
                    </Col>
                    <Col md={8}>
                      <h5 className="border-bottom pb-2 mb-4">Informations Personnelles</h5>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Nom complet</p>
                          <p className="fw-bold">{patient?.nom} {patient?.prenom}</p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Âge</p>
                          <p className="fw-bold">{patient?.age} ans</p>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Sexe</p>
                          <p className="fw-bold">
                            <FaVenusMars className="me-2" />
                            {patient?.sexe === 'M' ? 'Masculin' : 'Féminin'}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Email</p>
                          <p className="fw-bold">
                            <FaEnvelope className="me-2" />
                            {patient?.email}
                          </p>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Téléphone</p>
                          <p className="fw-bold">
                            <FaPhoneAlt className="me-2" />
                            {patient?.telephone}
                          </p>
                        </Col>
                        <Col sm={6}>
                          <p className="mb-1 text-muted">Adresse</p>
                          <p className="fw-bold">
                            <FaMapMarkerAlt className="me-2" />
                            {patient?.adresse || 'Non spécifiée'}
                          </p>
                        </Col>
                      </Row>
                      
                      <div className="mt-4">
                        <h5 className="border-bottom pb-2 mb-3">Assurances</h5>
                        {patient?.insurance && patient.insurance.length > 0 ? (
                          <div className="d-flex flex-wrap gap-2">
                            {patient.insurance.map((ins, index) => (
                              <Badge key={index} bg="info" className="py-2 px-3">
                                <FaFileInvoice className="me-2" />
                                {ins}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted fst-italic">Aucune assurance enregistrée</p>
                        )}
                      </div>
                      
                      {patient?.antecedents && patient.antecedents.length > 0 && (
                        <div className="mt-4">
                          <h5 className="border-bottom pb-2 mb-3">Antécédents Médicaux</h5>
                          <ul className="list-group">
                            {patient.antecedents.map((ant, index) => (
                              <li key={index} className="list-group-item">
                                {ant}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Col>
                  </Row>
                </div>
              )}

              {activeTab === 'structures' && (
                <div className="structures-section">
                  <h5 className="mb-4">Structures Médicales Associées</h5>
                  {structures.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                      {structures.map(structure => (
                        <Col key={structure.id}>
                          <Card className="h-100 shadow-sm hover-card">
                            <Card.Body>
                              <div className="d-flex align-items-center mb-3">
                                {structure.photoUrl ? (
                                  <img 
                                    src={structure.photoUrl} 
                                    alt={structure.name} 
                                    className="rounded me-3"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div 
                                    className="rounded bg-light d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '50px', height: '50px' }}
                                  >
                                    <FaHospital size={24} className="text-secondary" />
                                  </div>
                                )}
                                <h5 className="mb-0">{structure.name}</h5>
                              </div>
                              
                              <p className="mb-2">
                                <FaMapMarkerAlt className="me-2 text-primary" />
                                {structure.address || 'Adresse non spécifiée'}
                              </p>
                              
                              <p className="mb-2">
                                <FaPhoneAlt className="me-2 text-primary" />
                                Mobile: {structure.phones?.mobile || 'Non spécifié'}
                              </p>
                              
                              <p className="mb-2">
                                <FaPhoneAlt className="me-2 text-primary" />
                                Fixe: {structure.phones?.landline || 'Non spécifié'}
                              </p>
                              
                              <p className="mb-0">
                                <FaEnvelope className="me-2 text-primary" />
                                {structure.email || 'Email non spécifié'}
                              </p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Alert variant="info">
                      Vous n'êtes associé à aucune structure médicale pour le moment.
                    </Alert>
                  )}
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="appointments-section">
                  <h5 className="mb-4">Mes Rendez-vous</h5>
                  {appointments.length > 0 ? (
                    <ListGroup>
                                            {appointments
                        .sort((a, b) => {
                          // Trier par jour de la semaine puis par heure
                          const weekdayOrder = {
                            'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
                            'Vendredi': 5, 'Samedi': 6, 'Dimanche': 7
                          };
                          
                          if (a.day !== b.day) {
                            return weekdayOrder[a.day] - weekdayOrder[b.day];
                          }
                          return a.timeSlot.localeCompare(b.timeSlot);
                        })
                        .map(appointment => (
                          <ListGroup.Item 
                            key={appointment.id}
                            className="mb-3 border rounded shadow-sm hover-item"
                          >
                            <Row className="align-items-center">
                              <Col md={3} className="mb-3 mb-md-0">
                                <div className="d-flex align-items-center">
                                  <div className="appointment-date-badge me-3">
                                    <div className="day-badge bg-primary text-white p-2 text-center rounded-top">
                                      {appointment.day}
                                    </div>
                                    <div className="time-badge bg-light p-2 text-center rounded-bottom border">
                                      {appointment.timeSlot}
                                    </div>
                                  </div>
                                  <Badge bg={appointment.status === 'completed' ? 'success' : 'warning'}>
                                    {appointment.status === 'completed' ? 'Terminé' : 'Planifié'}
                                  </Badge>
                                </div>
                              </Col>
                              
                              <Col md={4} className="mb-3 mb-md-0">
                                <h6 className="mb-1">Médecin</h6>
                                <p className="mb-0 fw-bold">
                                  <FaUser className="me-2 text-primary" />
                                  {getDoctorName(appointment.doctorId)}
                                </p>
                                
                                {doctors.find(d => d.id === appointment.doctorId)?.specialite && (
                                  <p className="mb-0 text-muted small">
                                    <span className="me-2">Spécialité:</span>
                                    {doctors.find(d => d.id === appointment.doctorId)?.specialite}
                                  </p>
                                )}
                              </Col>
                              
                              <Col md={5}>
                                <h6 className="mb-1">Structure</h6>
                                <p className="mb-0 fw-bold">
                                  <FaHospital className="me-2 text-primary" />
                                  {getStructureName(appointment.structureId)}
                                </p>
                                
                                {structures.find(s => s.id === appointment.structureId)?.address && (
                                  <p className="mb-0 text-muted small">
                                    <FaMapMarkerAlt className="me-2" />
                                    {structures.find(s => s.id === appointment.structureId)?.address}
                                  </p>
                                )}
                                
                                {structures.find(s => s.id === appointment.structureId)?.phones?.mobile && (
                                  <p className="mb-0 text-muted small">
                                    <FaPhoneAlt className="me-2" />
                                    {structures.find(s => s.id === appointment.structureId)?.phones?.mobile}
                                  </p>
                                )}
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                    </ListGroup>
                  ) : (
                    <Alert variant="info">
                      Vous n'avez aucun rendez-vous planifié pour le moment.
                    </Alert>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .patient-dashboard {
          background-color: #f5f8fa;
          min-height: 100vh;
        }
        
        .hover-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
        }
        
        .hover-item {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .hover-item:hover {
          transform: translateX(5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
        }
        
        .appointment-date-badge {
          width: 100px;
        }
        
        .day-badge {
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .time-badge {
          font-weight: bold;
          color: #495057;
        }
      `}</style>
    </Container>
  );
};

export default PatientDashboard;








////////////////////////////////////////////////////////////////////

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  ButtonGroup,
  Table,
  ListGroup,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../components/firebase-config.js";
import { QRCode } from "react-qr-code";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import {
  FaMapMarkerAlt,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
  FaHospital,
  FaSearch,
  FaPaperPlane,
  FaFile,
  FaComment,
  FaTrash,
  FaEdit,
  FaQrcode,
  FaTimes,
  FaPrint,
  FaDownload,
  FaUser,
  FaUserMd,
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaSignOutAlt,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import "./PatientDashboard.css";

import Select from "react-select";

const PatientsDashboard = () => {
  const navigate = useNavigate();
  const patientData = JSON.parse(localStorage.getItem("patientData"));
  const [docRequests, setDocRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [createdByDoctors, setCreatedByDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [message, setMessage] = useState("");
  const [confirmedDoctors, setConfirmedDoctors] = useState(() => {
    const saved = localStorage.getItem("confirmedDoctors");
    return saved ? JSON.parse(saved) : {};
  });
  const [permanentConfirmations, setPermanentConfirmations] = useState(() => {
    const saved = localStorage.getItem("permanentConfirmations");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeTab, setActiveTab] = useState("accepted"); // Default tab is 'accepted'
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [consultationReason, setConsultationReason] = useState("");

  const [structures, setStructures] = useState([]);
  const [showStructureListModal, setShowStructureListModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [showAddToStructureModal, setShowAddToStructureModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);


  const [qrRefreshKey, setQrRefreshKey] = useState(Date.now());
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedDays, setSelectedDays] = useState({});
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [structureDetails, setStructureDetails] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editContent, setEditContent] = useState("");
  const fetchPatientDetails = async (patientId) => {
    try {
      const patientRef = doc(db, "patients", patientId);
      const patientDoc = await getDoc(patientRef);
      const patientData = patientDoc.data();

     

      let structureData = null;
      if (patientData.structureId) {
        const structureRef = doc(db, "structures", patientData.structureId);
        const structureDoc = await getDoc(structureRef);
        if (structureDoc.exists()) {
          structureData = {
            id: structureDoc.id,
            ...structureDoc.data(),
          };
        }
      }

      setSelectedPatientDetails(patientData);
      setAssignedDoctorsDetails(assignedDocs);
      setStructureDetails(structureData);
      setShowPatientDetailsModal(true);
    } catch (error) {
      setMessage("Erreur lors du chargement des détails");
    }
  };

  useEffect(() => {
    const fetchDoctorAvailability = async () => {
      const doctorsRef = collection(db, "medecins");
      const snapshot = await getDocs(doctorsRef);
      const doctorsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        joursDisponibles: doc.data().disponibilite || [],
      }));
      setAvailableDoctors(doctorsData);
    };
    fetchDoctorAvailability();
  }, []);
  useEffect(() => {
    if (patientData?.id) {
      fetchCreatedByDoctors();
      fetchAvailableDoctors();
      fetchAppointments();
    }
  }, [patientData?.id]);

  const fetchCreatedByDoctors = async () => {
    try {
      const patientRef = doc(db, "patients", patientData.id);
      const patientDoc = await getDoc(patientRef);
      if (patientDoc.exists() && patientDoc.data().createdBy) {
        const doctorRef = doc(db, "medecins", patientDoc.data().createdBy);
        const doctorDoc = await getDoc(doctorRef);
        if (doctorDoc.exists()) {
          setCreatedByDoctors([
            {
              id: doctorDoc.id,
              ...doctorDoc.data(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setMessage("Erreur lors du chargement des données du médecin");
    }
  };

  const fetchAvailableDoctors = async () => {
    const doctorsQuery = query(collection(db, "medecins"));
    const snapshot = await getDocs(doctorsQuery);
    setAvailableDoctors(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  const fetchAppointments = () => {
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", patientData.id)
    );
    const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointmentsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          // Change 'doc' to 'docSnapshot'
          const appointmentData = docSnapshot.data();
          const doctorRef = doc(db, "medecins", appointmentData.doctorId);
          const doctorDoc = await getDoc(doctorRef);
          return {
            id: docSnapshot.id,
            ...appointmentData,
            doctorInfo: doctorDoc.exists() ? doctorDoc.data() : null,
          };
        })
      );
      setAppointments(appointmentsData);
    });
    return unsubscribe;
  };
  const handleConsultationRequest = async () => {
    try {
      if (
        !selectedDoctor ||
        !selectedDay ||
        !selectedTimeSlot ||
        !selectedEndTime
      ) {
        setMessage("Veuillez remplir tous les champs");
        return;
      }
      const consultationRequest = {
        patientId: patientData.id,
        doctorId: selectedDoctor.id,
        patientInfo: patientData,
        doctorInfo: {
          nom: selectedDoctor.nom,
          prenom: selectedDoctor.prenom,
          specialite: selectedDoctor.specialite,
        },
        requestDate: new Date().toISOString(),
        status: "pending",
        preferredDay: selectedDay,
        preferredTimeStart: selectedTimeSlot,
        preferredTimeEnd: selectedEndTime,
        reason: consultationReason,
      };
      await addDoc(collection(db, "consultationRequests"), consultationRequest);
      setMessage("Demande de consultation envoyée avec succès");
      setShowConsultationModal(false);
      resetForm();
    } catch (error) {
      setMessage("Erreur lors de l'envoi de la demande");
      console.error(error);
    }
  };
  const resetForm = () => {
    setSelectedDoctor(null);
    setSelectedDay("");
    setSelectedTimeSlot("");
    setSelectedEndTime("");
    setConsultationReason("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setQrRefreshKey(Date.now());
    }, 24 * 60 * 60 * 1000); // Rafraîchit toutes les 24h
    return () => clearInterval(interval);
  }, []);

  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    let currentTime = new Date(`2000/01/01 ${startTime}`);
    const endDateTime = new Date(`2000/01/01 ${endTime}`);
    while (currentTime < endDateTime) {
      slots.push(
        currentTime.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }
    return slots;
  };

  const [acceptedConsultations, setAcceptedConsultations] = useState([]);
  // Add this useEffect to fetch accepted consultations
  useEffect(() => {
    if (patientData?.id) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "consultationRequests"),
          where("patientId", "==", patientData.id),
          where("status", "==", "accepted")
        ),
        async (snapshot) => {
          const consultationsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                acceptedAt: data.acceptedAt,
              };
            })
          );
          setAcceptedConsultations(consultationsData);
        }
      );
      return () => unsubscribe();
    }
  }, [patientData?.id]);

  const [documentRequests, setDocumentRequests] = useState([]);
  const [showDocumentRequestModal, setShowDocumentRequestModal] =
    useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);

  useEffect(() => {
    if (patientData?.id) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "documentRequests"),
          where("patientId", "==", patientData.id)
        ),
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDocumentRequests(requests);
        }
      );
      return () => unsubscribe();
    }
  }, [patientData?.id]);

  const handleDocumentRequest = async (requestId, isAccepted) => {
    try {
      if (isAccepted) {
        await updateDoc(doc(db, "documentRequests", requestId), {
          status: "accepted",
          respondedAt: new Date().toISOString(),
        });
        setShowDocumentRequestModal(true);
      } else {
        await updateDoc(doc(db, "documentRequests", requestId), {
          status: "rejected",
          respondedAt: new Date().toISOString(),
        });
      }
      setMessage(`Demande ${isAccepted ? "acceptée" : "refusée"} avec succès`);
    } catch (error) {
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  const handleShareDocuments = async (requestId, doctorId) => {
    try {
      const uploadedDocs = await Promise.all(
        selectedDocuments.map(async (file) => {
          const fileRef = ref(
            storage,
            `shared-documents/${patientData.id}/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return {
            name: file.name,
            url: url,
            sharedAt: new Date().toISOString(),
          };
        })
      );

      await updateDoc(doc(db, "patients", patientData.id), {
        sharedDocuments: arrayUnion(...uploadedDocs),
      });

      await updateDoc(doc(db, "documentRequests", requestId), {
        sharedDocuments: uploadedDocs,
        status: "completed",
      });

      setShowDocumentRequestModal(false);
      setMessage("Documents partagés avec succès");
    } catch (error) {
      setMessage("Erreur lors du partage des documents");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  useEffect(() => {
    const fetchCreatedByDoctors = async () => {
      try {
        if (!patientData?.id) {
          console.warn("Patient data is not available");
          return;
        }

        const patientRef = doc(db, "patients", patientData.id);
        const patientDoc = await getDoc(patientRef);

        if (patientDoc.exists() && patientDoc.data().createdBy) {
          const doctorRef = doc(db, "medecins", patientDoc.data().createdBy);
          const doctorDoc = await getDoc(doctorRef);

          if (doctorDoc.exists()) {
            setCreatedByDoctors([
              {
                id: doctorDoc.id,
                ...doctorDoc.data(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      }
    };

    fetchCreatedByDoctors();
  }, [patientData?.id]);

  const fetchAllStructures = async () => {
    setLoadingStructures(true);
    try {
      const structuresRef = collection(db, "structures");
      const querySnapshot = await getDocs(structuresRef);

      const structuresData = [];
      querySnapshot.forEach((doc) => {
        structuresData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setStructures(structuresData);
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setMessage("Erreur lors du chargement des structures");
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleShowStructureList = () => {
    setShowStructureListModal(true);
    fetchAllStructures();
  };

  // Ajoutez cette fonction pour envoyer la demande d'ajout à une structure
  {
    /*
const handleAddToStructure = async () => {
  try {
    if (!selectedStructure || !patientData) {
      setMessage('Données manquantes');
      return;
    }

    // Préparer les données de la demande
    const structureRequestData = {
      patientId: patientData.id,
      structureId: selectedStructure.id,
      structureName: selectedStructure.name,
      patientInfo: {
        nom: patientData.nom,
        prenom: patientData.prenom,
        age: patientData.age,
        sexe: patientData.sexe,
        email: patientData.email,
        telephone: patientData.telephone,
        photoURL: patientData.photoURL || null,
        insurances: patientData.insurances || []
      },
      status: 'pending',
      requestDate: serverTimestamp(),
      documents: patientData.documents || []
    };

    // Enregistrer la demande dans Firestore
    await addDoc(collection(db, 'structureRequests'), structureRequestData);
    
    // Mettre à jour l'état pour afficher la confirmation
    setRequestSent(true);
    setMessage('Demande envoyée avec succès à ' + selectedStructure.name);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande:', error);
    setMessage('Erreur lors de l\'envoi de la demande: ' + error.message);
  }
};*/
  }

  const handleSelectStructure = (structure) => {
    setSelectedStructure(structure);
    setShowStructureListModal(false);
    setShowAddToStructureModal(true);
  };

  const handleAddToStructure = async () => {
    try {
      if (!selectedStructure || !patientData) {
        setMessage("Données manquantes");
        return;
      }

      // Préparer les données de la demande
      const structureRequestData = {
        patientId: patientData.id,
        structureId: selectedStructure.id,
        structureName: selectedStructure.name,
        patientInfo: {
          nom: patientData.nom,
          prenom: patientData.prenom,
          age: patientData.age,
          sexe: patientData.sexe,
          email: patientData.email,
          telephone: patientData.telephone,
          photoURL: patientData.photoURL || null,
          insurances: patientData.insurances || [],
        },
        status: "pending",
        requestDate: serverTimestamp(),
        documents: patientData.documents || [],
      };

      // Enregistrer la demande dans Firestore
      await addDoc(collection(db, "structureRequests"), structureRequestData);

      // Mettre à jour l'état pour afficher la confirmation
      setRequestSent(true);
      setShowAddToStructureModal(false);
      setMessage("Demande envoyée avec succès à " + selectedStructure.name);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      setMessage("Erreur lors de l'envoi de la demande: " + error.message);
    }
  };

  return (
    <Container fluid className="py-4">
      {message && (
        <Alert
          variant={message.includes("succès") ? "success" : "danger"}
          onClose={() => setMessage("")}
          dismissible
          className="mb-3"
        >
          {message}
        </Alert>
      )}
      <div className="row mb-4">
        <div className="col">
          <div className="card border-0 rounded-4 shadow-lg transition-transform">
            <div className="card-header bg-primary bg-gradient p-1">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                {/* Patient Name Section */}
                <div className="patient-info flex-grow-0">
                  <div
                    onClick={() => fetchPatientDetails(patientData.id)}
                    className="text-white position-relative patient-link"
                  >
                    <h4 className="mb-0 d-flex align-items-center fw-bold fs-responsive">
                      <i className="bi bi-person-fill me-2"></i>
                      {patientData.nom}
                    </h4>
                  </div>
                </div>

                {/* Buttons Section */}
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowConsultationModal(true)}
                    className="btn btn-light px-2 py-1 d-flex align-items-center consultation-btn btn-responsive"
                  >
                    <i className="bi bi-person-vcard-fill me-1"></i>
                    <span className="button-text">Consultation</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    <span className="button-text">Déconnexion</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="nav nav-tabs mt-1 border-0 flex-nowrap overflow-auto">
                <button
                  className={`nav-link text-white ${
                    activeTab === "all" ? "active bg-info text-primary" : ""
                  }`}
                  onClick={() => setActiveTab("all")}
                  title="Afficher tous les champs"
                >
                  <i className="bi bi-grid-fill me-1"></i>
                  <span className="tab-text">Tout</span>
                </button>
                <button
                  className={`nav-link text-white ${
                    activeTab === "creators"
                      ? "active bg-info text-primary"
                      : ""
                  }`}
                  onClick={() => setActiveTab("creators")}
                  title="Médecins créateurs"
                >
                  <i className="bi bi-people-fill me-1"></i>
                  <span className="tab-text">Créateurs</span>
                </button>
               
                <button
                  className={`nav-link text-white ${
                    activeTab === "accepted"
                      ? "active bg-info text-primary"
                      : ""
                  }`}
                  onClick={() => setActiveTab("accepted")}
                  title="Médecins acceptés"
                >
                  <i className="bi bi-check-circle-fill me-1"></i>
                  <span className="tab-text">Acceptés</span>
                </button>
              
                <button
                  onClick={() => navigate("/PatientMessaging")}
                  className="btn btn-info px-2 py-1 d-flex align-items-center messaging-btn btn-responsive"
                >
                  <FaEnvelope className="me-1" />
                  <span className="button-text">Messagerie</span>
                </button>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={handleShowStructureList}
                >
                  <FaHospital className="me-2" />
                  Rejoindre une structure
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Created By Doctors Section */}
      {(activeTab === "all" || activeTab === "creators") && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-lg border-0 rounded-4 hover-lift">
              <Card.Header className="bg-success text-white p-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-people-fill me-2"></i>
                  <span className="fs-responsive">Médecins créateurs</span>
                </h5>

                {/* View Toggle Buttons */}
                <ButtonGroup>
                  <Button
                    variant={viewMode === "grid" ? "light" : "outline-light"}
                    onClick={() => setViewMode("grid")}
                  >
                    <i className="bi bi-grid"></i>
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "light" : "outline-light"}
                    onClick={() => setViewMode("table")}
                  >
                    <i className="bi bi-list"></i>
                  </Button>
                </ButtonGroup>
              </Card.Header>

              <Card.Body className="p-3">
                {viewMode === "grid" ? (
                  // Original Grid View
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {createdByDoctors.map((doctor) => {
                      const qrData = `
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}
                INFORMATIONS MÉDECIN
                Médecin: Dr. ${doctor.nom} ${doctor.prenom}
                Spécialité: ${doctor.specialite}
                Tel: ${doctor.telephone}
                Email: ${doctor.email}
                CONSULTATIONS
                Jours: ${patientData.joursDisponibles?.join(", ")}
                Horaires: ${patientData.appointmentSettings?.heureDebut} - ${
                        patientData.appointmentSettings?.heureFin
                      }
                Durée: ${
                  patientData.appointmentSettings?.consultationDuration
                } minutes
                Généré le: ${new Date().toLocaleString()}
                Valide jusqu'au: ${new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toLocaleString()}
              `;

                      return (
                        <Col key={doctor.id}>
                          <Card
                            className={`h-100 border-0 shadow-sm hover-lift-sm rounded-4 
                    ${
                      confirmedDoctors[doctor.id]
                        ? "bg-success bg-opacity-5"
                        : ""
                    }`}
                          >
                            <Card.Body className="p-responsive">
                              {/* Doctor Header */}
                              <div className="d-flex align-items-center mb-3">
                                <div className="doctor-avatar me-3">
                                  {doctor.photo ? (
                                    <img
                                      src={doctor.photo}
                                      alt="Doctor"
                                      className="rounded-circle"
                                    />
                                  ) : (
                                    <div className="avatar-placeholder">
                                      <i className="bi bi-person-fill"></i>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5 className="fs-responsive mb-1">
                                    Dr. {doctor.nom} {doctor.prenom}
                                  </h5>
                                  <Badge
                                    bg="primary"
                                    className="badge-responsive"
                                  >
                                    {doctor.specialite}
                                  </Badge>
                                </div>
                              </div>

                              {/* Consultation Days */}
                              <div className="info-section mb-3">
                                <h6 className="text-muted fs-responsive mb-2">
                                  <i className="bi bi-calendar-week me-2"></i>
                                  Jours de consultation
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {patientData.joursDisponibles?.map((jour) => (
                                    <Badge
                                      key={jour}
                                      bg="info"
                                      className="badge-responsive"
                                    >
                                      {jour}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Schedule Info */}
                              <div className="info-section mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <FaClock className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {
                                      patientData.appointmentSettings
                                        ?.heureDebut
                                    }{" "}
                                    -{patientData.appointmentSettings?.heureFin}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center">
                                  <FaClock className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    Durée:{" "}
                                    {
                                      patientData.appointmentSettings
                                        ?.consultationDuration
                                    }{" "}
                                    min
                                  </span>
                                </div>
                              </div>

                              {/* Contact Info */}
                              <div className="info-section mb-3">
                                <div className="contact-item">
                                  <FaPhone className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {doctor.telephone}
                                  </span>
                                </div>
                                <div className="contact-item">
                                  <FaEnvelope className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {doctor.email}
                                  </span>
                                </div>
                              </div>

                              <div className="d-grid gap-2">
                                {!permanentConfirmations[doctor.id] ? (
                                  <Button
                                    variant="success"
                                    className="btn-responsive"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(
                                          doc(db, "medecins", doctor.id),
                                          {
                                            isConfirmed: true,
                                            confirmedAt:
                                              new Date().toISOString(),
                                            isPermanentlyConfirmed: true,
                                          }
                                        );
                                        const newPermanentConfirmations = {
                                          ...permanentConfirmations,
                                          [doctor.id]: true,
                                        };
                                        setPermanentConfirmations(
                                          newPermanentConfirmations
                                        );
                                        localStorage.setItem(
                                          "permanentConfirmations",
                                          JSON.stringify(
                                            newPermanentConfirmations
                                          )
                                        );
                                        setMessage(
                                          "Consultation confirmée définitivement"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la confirmation"
                                        );
                                      }
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer définitivement
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="info"
                                      className="btn-responsive w-100 mb-2"
                                      onClick={() => {
                                        setSelectedQRData(qrData);
                                        setShowQRModal(true);
                                      }}
                                    >
                                      <i className="fas fa-qr-code me-2"></i>
                                      Voir Code QR
                                    </Button>

                                    <ButtonGroup size="sm">
                                      <Button
                                        variant="outline-primary"
                                        className="btn-responsive"
                                        onClick={() => {
                                          setSelectedDoctor(doctor);
                                          setShowConsultationModal(true);
                                        }}
                                      >
                                        <i className="fas fa-calendar-plus me-2"></i>
                                        Nouvelle consultation
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        className="btn-responsive"
                                        onClick={async () => {
                                          if (
                                            window.confirm(
                                              "Êtes-vous sûr de vouloir annuler cette consultation ?"
                                            )
                                          ) {
                                            try {
                                              const newPermanentConfirmations =
                                                { ...permanentConfirmations };
                                              delete newPermanentConfirmations[
                                                doctor.id
                                              ];
                                              setPermanentConfirmations(
                                                newPermanentConfirmations
                                              );
                                              localStorage.setItem(
                                                "permanentConfirmations",
                                                JSON.stringify(
                                                  newPermanentConfirmations
                                                )
                                              );

                                              await updateDoc(
                                                doc(db, "medecins", doctor.id),
                                                {
                                                  isConfirmed: false,
                                                  confirmedAt: null,
                                                  isPermanentlyConfirmed: false,
                                                }
                                              );
                                              setMessage(
                                                "Consultation annulée avec succès"
                                              );
                                            } catch (error) {
                                              setMessage(
                                                "Erreur lors de l'annulation: " +
                                                  error.message
                                              );
                                            }
                                          }
                                        }}
                                      >
                                        <i className="fas fa-times-circle me-2"></i>
                                        Annuler consultation
                                      </Button>
                                    </ButtonGroup>
                                  </>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  // New Table View
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Spécialité</th>
                          <th>Jours</th>
                          <th>Horaires</th>
                          <th>Contact</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdByDoctors.map((doctor) => {
                          const qrData = `
    INFORMATIONS PATIENT
    Nom: ${patientData?.nom || "N/A"}
    Prénom: ${patientData?.prenom || "N/A"}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}
    INFORMATIONS MÉDECIN
    Médecin: Dr. ${doctor.nom} ${doctor.prenom}
    Spécialité: ${doctor.specialite}
    Tel: ${doctor.telephone}
    Email: ${doctor.email}
    CONSULTATIONS
    Jours: ${patientData.joursDisponibles?.join(", ")}
    Horaires: ${patientData.appointmentSettings?.heureDebut} - ${
                            patientData.appointmentSettings?.heureFin
                          }
    Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
    Généré le: ${new Date().toLocaleString()}
    Valide jusqu'au: ${new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toLocaleString()}
  `;

                          return (
                            <tr
                              key={doctor.id}
                              className={
                                confirmedDoctors[doctor.id]
                                  ? "bg-success bg-opacity-5"
                                  : ""
                              }
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="doctor-avatar me-2">
                                    {doctor.photo ? (
                                      <img
                                        src={doctor.photo}
                                        alt="Doctor"
                                        className="rounded-circle"
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                        }}
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <i className="bi bi-person-fill"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="mb-0">
                                      Dr. {doctor.nom} {doctor.prenom}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="primary">{doctor.specialite}</Badge>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {patientData.joursDisponibles?.map((jour) => (
                                    <Badge
                                      key={jour}
                                      bg="info"
                                      className="badge-responsive"
                                    >
                                      {jour}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaClock className="text-primary me-2" />
                                  <small>
                                    {
                                      patientData.appointmentSettings
                                        ?.heureDebut
                                    }{" "}
                                    -{patientData.appointmentSettings?.heureFin}
                                    <br />
                                    Durée:{" "}
                                    {
                                      patientData.appointmentSettings
                                        ?.consultationDuration
                                    }{" "}
                                    min
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="contact-item">
                                  <FaPhone className="text-primary me-2" />
                                  <small>{doctor.telephone}</small>
                                </div>
                                <div className="contact-item">
                                  <FaEnvelope className="text-primary me-2" />
                                  <small>{doctor.email}</small>
                                </div>
                              </td>
                              <td>
                                {!permanentConfirmations[doctor.id] ? (
                                  <Button
                                    variant="success"
                                    className="btn-responsive"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(
                                          doc(db, "medecins", doctor.id),
                                          {
                                            isConfirmed: true,
                                            confirmedAt:
                                              new Date().toISOString(),
                                            isPermanentlyConfirmed: true,
                                          }
                                        );
                                        const newPermanentConfirmations = {
                                          ...permanentConfirmations,
                                          [doctor.id]: true,
                                        };
                                        setPermanentConfirmations(
                                          newPermanentConfirmations
                                        );
                                        localStorage.setItem(
                                          "permanentConfirmations",
                                          JSON.stringify(
                                            newPermanentConfirmations
                                          )
                                        );
                                        setMessage(
                                          "Consultation confirmée définitivement"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la confirmation"
                                        );
                                      }
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer définitivement
                                  </Button>
                                ) : (
                                  <ButtonGroup size="sm">
                                    <Button
                                      variant="info"
                                      className="btn-responsive w-100 mb-2"
                                      onClick={() => {
                                        setSelectedQRData(qrData);
                                        setShowQRModal(true);
                                      }}
                                    >
                                      <i className="fas fa-qr-code me-2"></i>
                                      Voir Code QR
                                    </Button>

                                    <Button
                                      variant="outline-primary"
                                      className="btn-responsive"
                                      onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setShowConsultationModal(true);
                                      }}
                                    >
                                      <i className="fas fa-calendar-plus me-2"></i>
                                      Nouvelle consultation
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      className="btn-responsive"
                                      onClick={async () => {
                                        if (
                                          window.confirm(
                                            "Êtes-vous sûr de vouloir annuler cette consultation ?"
                                          )
                                        ) {
                                          try {
                                            const newPermanentConfirmations = {
                                              ...permanentConfirmations,
                                            };
                                            delete newPermanentConfirmations[
                                              doctor.id
                                            ];
                                            setPermanentConfirmations(
                                              newPermanentConfirmations
                                            );
                                            localStorage.setItem(
                                              "permanentConfirmations",
                                              JSON.stringify(
                                                newPermanentConfirmations
                                              )
                                            );

                                            await updateDoc(
                                              doc(db, "medecins", doctor.id),
                                              {
                                                isConfirmed: false,
                                                confirmedAt: null,
                                                isPermanentlyConfirmed: false,
                                              }
                                            );
                                            setMessage(
                                              "Consultation annulée avec succès"
                                            );
                                          } catch (error) {
                                            setMessage(
                                              "Erreur lors de l'annulation: " +
                                                error.message
                                            );
                                          }
                                        }
                                      }}
                                    >
                                      <i className="fas fa-times-circle me-2"></i>
                                      Annuler consultation
                                    </Button>
                                  </ButtonGroup>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* QR Code Modal */}
            <Modal
              show={showQRModal}
              onHide={() => setShowQRModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                  <i className="fas fa-qr-code me-2"></i>
                  Code QR de consultation
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center p-4">
                {selectedQRData && (
                  <>
                    <QRCode
                      value={selectedQRData}
                      size={400}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      level="H"
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        height: "auto",
                        padding: "20px",
                      }}
                    />
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => {
                        const printWindow = window.open(
                          "",
                          "",
                          "width=600,height=600"
                        );
                        printWindow.document.write(`
                   <html>
                     <head>
                       <title>Code QR Consultation</title>
                       <style>
                         body {
                           display: flex;
                           flex-direction: column;
                           align-items: center;
                           justify-content: center;
                           height: 100vh;
                           margin: 0;
                           font-family: Arial, sans-serif;
                         }
                         .qr-container {
                           text-align: center;
                           padding: 20px;
                         }
                       </style>
                     </head>
                     <body>
                       <div class="qr-container">
                         ${document.querySelector(".modal-body").innerHTML}
                       </div>
                     </body>
                   </html>
                 `);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }}
                    >
                      <i className="fas fa-print me-2"></i>
                      Imprimer le Code QR
                    </Button>
                  </>
                )}
              </Modal.Body>
            </Modal>

            <style jsx>{`
              /* Your existing styles plus: */
              .modal-content {
                border-radius: 1rem;
                border: none;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
              }
              .modal-header {
                border-top-left-radius: 1rem;
                border-top-right-radius: 1rem;
              }
              .modal-body {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              @media (max-width: 576px) {
                .modal-body {
                  padding: 1rem;
                }
              }

              .table-responsive {
                overflow-x: auto;
              }

              .avatar-placeholder {
                width: 40px;
                height: 40px;
                background-color: #e9ecef;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
              }

              .contact-item {
                display: flex;
                align-items: center;
                margin-bottom: 0.25rem;
              }

              .table td {
                vertical-align: middle;
              }

              .btn-group .btn {
                padding: 0.25rem 0.5rem;
              }

              @media (max-width: 768px) {
                .table-responsive {
                  font-size: 0.875rem;
                }
              }
            `}</style>
          </Col>
        </Row>
      )}
    


      {/* Accepted Doctors Section */}
      {(activeTab === "all" || activeTab === "accepted") && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  Demandes de consultation acceptées
                </h5>
                <ButtonGroup>
                  <Button
                    variant={viewMode === "grid" ? "light" : "success"}
                    onClick={() => setViewMode("grid")}
                  >
                    <FaThLarge />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "light" : "success"}
                    onClick={() => setViewMode("table")}
                  >
                    <FaList />
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body>
                {viewMode === "grid" ? (
                  // Grid View
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {acceptedConsultations.map((consultation) => {
                      const qrData = `
                CONFIRMATION DE CONSULTATION
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}

                INFORMATIONS MÉDECIN
                Médecin: Dr. ${consultation.doctorInfo.nom} ${
                        consultation.doctorInfo.prenom
                      }
                Spécialité: ${consultation.doctorInfo.specialite}
                CONSULTATION
                Jour: ${consultation.preferredDay}
                Horaires: ${consultation.preferredTimeStart} - ${
                        consultation.preferredTimeEnd
                      }
                Motif: ${consultation.reason}
                Acceptée le: ${new Date(
                  consultation.acceptedAt
                ).toLocaleDateString()}
                Généré le: ${new Date().toLocaleString()}
              `;

                      return (
                        <Col key={consultation.id}>
                          <Card className="h-100">
                            <Card.Body>
                              {/* Doctor Info Section */}
                              <div className="d-flex align-items-center mb-3">
                                <div
                                  className="rounded-circle bg-success bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
                                  style={{ width: "64px", height: "64px" }}
                                >
                                  <FaUserMd
                                    size={30}
                                    className="text-success"
                                  />
                                </div>
                                <div>
                                  <h6 className="mb-1">
                                    Dr. {consultation.doctorInfo.nom}{" "}
                                    {consultation.doctorInfo.prenom}
                                  </h6>
                                  <Badge bg="success">
                                    {consultation.doctorInfo.specialite}
                                  </Badge>
                                </div>
                              </div>

                              {/* Appointment Details */}
                              <div className="mb-3">
                                <h6 className="text-muted mb-2">
                                  Détails du rendez-vous:
                                </h6>
                                <p className="mb-1">
                                  <FaCalendarAlt className="me-2 text-success" />
                                  Jour: {consultation.preferredDay}
                                </p>
                                <p className="mb-1">
                                  <FaClock className="me-2 text-success" />
                                  De: {consultation.preferredTimeStart} À:{" "}
                                  {consultation.preferredTimeEnd}
                                </p>
                              </div>

                              {/* Reason Section */}
                              <div className="mb-3">
                                <h6 className="text-muted mb-2">Motif:</h6>
                                <p className="mb-0">{consultation.reason}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="d-grid gap-2">
                                {!confirmedDoctors[consultation.id] ? (
                                  <Button
                                    variant="success"
                                    onClick={() => {
                                      const newConfirmedDoctors = {
                                        ...confirmedDoctors,
                                        [consultation.id]: true,
                                      };
                                      setConfirmedDoctors(newConfirmedDoctors);
                                      localStorage.setItem(
                                        "confirmedDoctors",
                                        JSON.stringify(newConfirmedDoctors)
                                      );
                                      setMessage("Consultation confirmée");
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer la consultation
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    onClick={() =>
                                      setShowQRModal(consultation.id)
                                    }
                                  >
                                    <i className="fas fa-qrcode me-2"></i>
                                    Voir QR Code
                                  </Button>
                                )}

                                <Button
                                  variant="danger"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?"
                                      )
                                    ) {
                                      try {
                                        await deleteDoc(
                                          doc(
                                            db,
                                            "consultationRequests",
                                            consultation.id
                                          )
                                        );
                                        const newConfirmedDoctors = {
                                          ...confirmedDoctors,
                                        };
                                        delete newConfirmedDoctors[
                                          consultation.id
                                        ];
                                        setConfirmedDoctors(
                                          newConfirmedDoctors
                                        );
                                        localStorage.setItem(
                                          "confirmedDoctors",
                                          JSON.stringify(newConfirmedDoctors)
                                        );
                                        setMessage(
                                          "Consultation supprimée avec succès"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la suppression: " +
                                            error.message
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <i className="fas fa-trash-alt me-2"></i>
                                  Supprimer définitivement
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>

                          {/* QR Code Modal */}
                          <Modal
                            show={showQRModal === consultation.id}
                            onHide={() => setShowQRModal(null)}
                            size="lg"
                            centered
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>QR Code - Consultation</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="text-center">
                              <QRCode
                                value={qrData}
                                size={400}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="H"
                                style={{
                                  width: "100%",
                                  maxWidth: "400px",
                                  padding: "20px",
                                }}
                              />
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                variant="secondary"
                                onClick={() => setShowQRModal(null)}
                              >
                                Fermer
                              </Button>
                              <Button
                                variant="primary"
                                onClick={() => {
                                  window.print();
                                }}
                              >
                                <i className="fas fa-print me-2"></i>
                                Imprimer
                              </Button>
                            </Modal.Footer>
                          </Modal>
                        </Col>
                      );
                    })}

                    {acceptedConsultations.length === 0 && (
                      <Col xs={12}>
                        <Alert variant="info">
                          <i className="fas fa-info-circle me-2"></i>
                          Aucune demande de consultation acceptée
                        </Alert>
                      </Col>
                    )}
                  </Row>
                ) : (
                  // Table View
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Date</th>
                          <th>Horaires</th>
                          <th>Motif</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acceptedConsultations.map((consultation) => (
                          <tr key={consultation.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-success bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                                  style={{ width: "40px", height: "40px" }}
                                >
                                  <FaUserMd
                                    size={20}
                                    className="text-success"
                                  />
                                </div>
                                <div>
                                  <div>
                                    Dr. {consultation.doctorInfo.nom}{" "}
                                    {consultation.doctorInfo.prenom}
                                  </div>
                                  <Badge bg="success">
                                    {consultation.doctorInfo.specialite}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td>{consultation.preferredDay}</td>
                            <td>
                              {consultation.preferredTimeStart} -{" "}
                              {consultation.preferredTimeEnd}
                            </td>
                            <td>{consultation.reason}</td>
                            <td>
                              {confirmedDoctors[consultation.id] ? (
                                <Badge bg="success">Confirmée</Badge>
                              ) : (
                                <Badge bg="warning">En attente</Badge>
                              )}
                            </td>
                            <td>
                              <ButtonGroup>
                                {!confirmedDoctors[consultation.id] ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                      const newConfirmedDoctors = {
                                        ...confirmedDoctors,
                                        [consultation.id]: true,
                                      };
                                      setConfirmedDoctors(newConfirmedDoctors);
                                      localStorage.setItem(
                                        "confirmedDoctors",
                                        JSON.stringify(newConfirmedDoctors)
                                      );
                                      setMessage("Consultation confirmée");
                                    }}
                                  >
                                    <i className="fas fa-check-circle"></i>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                      setShowQRModal(consultation.id)
                                    }
                                  >
                                    <i className="fas fa-qrcode"></i>
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?"
                                      )
                                    ) {
                                      try {
                                        await deleteDoc(
                                          doc(
                                            db,
                                            "consultationRequests",
                                            consultation.id
                                          )
                                        );
                                        const newConfirmedDoctors = {
                                          ...confirmedDoctors,
                                        };
                                        delete newConfirmedDoctors[
                                          consultation.id
                                        ];
                                        setConfirmedDoctors(
                                          newConfirmedDoctors
                                        );
                                        localStorage.setItem(
                                          "confirmedDoctors",
                                          JSON.stringify(newConfirmedDoctors)
                                        );
                                        setMessage(
                                          "Consultation supprimée avec succès"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la suppression: " +
                                            error.message
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </Button>
                              </ButtonGroup>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {/* Global QR Code Modal - Place this outside the mapping functions */}
                {acceptedConsultations.map((consultation) => {
                  const qrData = `
    CONFIRMATION DE CONSULTATION
    INFORMATIONS PATIENT
    Nom: ${patientData.nom}
    Prénom: ${patientData.prenom}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}

    INFORMATIONS MÉDECIN
    Médecin: Dr. ${consultation.doctorInfo.nom} ${
                    consultation.doctorInfo.prenom
                  }
    Spécialité: ${consultation.doctorInfo.specialite}
    CONSULTATION
    Jour: ${consultation.preferredDay}
    Horaires: ${consultation.preferredTimeStart} - ${
                    consultation.preferredTimeEnd
                  }
    Motif: ${consultation.reason}
    Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
    Généré le: ${new Date().toLocaleString()}
  `;

                  return (
                    <Modal
                      key={consultation.id}
                      show={showQRModal === consultation.id}
                      onHide={() => setShowQRModal(null)}
                      size="lg"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>QR Code - Consultation</Modal.Title>
                      </Modal.Header>
                      <Modal.Body className="text-center">
                        <QRCode
                          value={qrData}
                          size={400}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          level="H"
                          style={{
                            width: "100%",
                            maxWidth: "400px",
                            padding: "20px",
                          }}
                        />
                      </Modal.Body>
                      <Modal.Footer>
                        <Button
                          variant="secondary"
                          onClick={() => setShowQRModal(null)}
                        >
                          Fermer
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            window.print();
                          }}
                        >
                          <i className="fas fa-print me-2"></i>
                          Imprimer
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  );
                })}

                {acceptedConsultations.length === 0 && (
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Aucune demande de consultation acceptée
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
     



     
      {/* Details patient Section */}
      <Modal
        show={showPatientDetailsModal}
        onHide={() => setShowPatientDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaUser className="me-2" />
            Détails du Patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatientDetails && (
            <div>
              <Row>
                <Col md={4} className="text-center mb-4">
                  {selectedPatientDetails.photo ? (
                    <img
                      src={selectedPatientDetails.photo}
                      alt="Patient"
                      className="rounded-circle mb-3"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary bg-opacity-10 mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{ width: "150px", height: "150px" }}
                    >
                      <span className="h1 mb-0">
                        {selectedPatientDetails.nom?.[0]}
                        {selectedPatientDetails.prenom?.[0]}
                      </span>
                    </div>
                  )}
                  <h4>
                    {selectedPatientDetails.nom} {selectedPatientDetails.prenom}
                  </h4>
                  <Badge bg="primary">
                    {selectedPatientDetails.status || "Actif"}
                  </Badge>
                </Col>
                <Col md={8}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="mb-3">Informations personnelles</h5>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Âge:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.age} ans</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Sexe:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.sexe}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Email:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.email}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Téléphone:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.telephone}</Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {structureDetails && (
                    <Card className="mb-3">
                      <Card.Body>
                        <h5 className="mb-3">Structure d'affectation</h5>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Nom:
                          </Col>
                          <Col sm={8}>{structureDetails.name}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Adresse:
                          </Col>
                          <Col sm={8}>{structureDetails.address}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Contact:
                          </Col>
                          <Col sm={8}>{structureDetails.phones?.mobile}</Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}

                  
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={showConsultationModal}
        onHide={() => setShowConsultationModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-calendar-plus me-2"></i>
            Demande de consultation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sélectionner un médecin</Form.Label>
              <Form.Select
                onChange={(e) => {
                  const doctor = availableDoctors.find(
                    (d) => d.id === e.target.value
                  );
                  setSelectedDoctor(doctor);
                }}
              >
                <option value="">Choisir un médecin...</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {selectedDoctor && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Jour souhaité</Form.Label>
                  <Form.Select onChange={(e) => setSelectedDay(e.target.value)}>
                    <option value="">Choisir un jour...</option>
                    {selectedDoctor.disponibilite?.map((jour) => (
                      <option key={jour} value={jour}>
                        {jour}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de début</Form.Label>
                      <Form.Control
                        type="time"
                        min={selectedDoctor.heureDebut}
                        max={selectedDoctor.heureFin}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Disponible de {selectedDoctor.heureDebut} à{" "}
                        {selectedDoctor.heureFin}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de fin</Form.Label>
                      <Form.Control
                        type="time"
                        min={selectedTimeSlot || selectedDoctor.heureDebut}
                        max={selectedDoctor.heureFin}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Motif de consultation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    onChange={(e) => setConsultationReason(e.target.value)}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConsultationModal(false)}
          >
            <i className="fas fa-times me-2"></i>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConsultationRequest}
            disabled={!selectedDoctor || !selectedDay || !selectedTimeSlot}
          >
            <i className="fas fa-paper-plane me-2"></i>
            Envoyer la demande
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de liste des structures */}
      <Modal
        show={showStructureListModal}
        onHide={() => setShowStructureListModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaHospital className="me-2" />
            Sélectionner une structure médicale
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingStructures ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des structures...</p>
            </div>
          ) : structures.length > 0 ? (
            <div className="structure-list">
              <ListGroup>
                {structures.map((structure) => (
                  <ListGroup.Item
                    key={structure.id}
                    action
                    onClick={() => handleSelectStructure(structure)}
                    className="d-flex justify-content-between align-items-center p-3"
                  >
                    <div>
                      <div className="d-flex align-items-center">
                        <div className="structure-icon me-3 bg-light rounded-circle p-2">
                          <FaHospital size={24} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-1">{structure.name}</h6>
                          <small className="text-muted">
                            {structure.address || "Adresse non spécifiée"}
                          </small>
                        </div>
                      </div>
                      {structure.description && (
                        <p className="text-muted small mt-2 mb-0">
                          {structure.description.length > 100
                            ? structure.description.substring(0, 100) + "..."
                            : structure.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="rounded-pill"
                    >
                      <FaPlus className="me-1" /> Rejoindre
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : (
            <Alert variant="info">
              <FaInfoCircle className="me-2" />
              Aucune structure disponible pour le moment
            </Alert>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal de confirmation d'ajout à une structure */}
      <Modal
        show={showAddToStructureModal}
        onHide={() => setShowAddToStructureModal(false)}
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaHospital className="me-2" />
            Rejoindre {selectedStructure?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requestSent ? (
            <Alert variant="success">
              <FaCheckCircle className="me-2" />
              Votre demande a été envoyée avec succès à{" "}
              {selectedStructure?.name}. Vous serez notifié lorsque la structure
              aura traité votre demande.
            </Alert>
          ) : (
            <>
              <p>
                Vous êtes sur le point d'envoyer une demande pour rejoindre{" "}
                <strong>{selectedStructure?.name}</strong>.
              </p>
              <p>
                Les informations suivantes seront partagées avec la structure :
              </p>
              <ListGroup className="mb-3">
                <ListGroup.Item>Nom: {patientData.nom}</ListGroup.Item>
                <ListGroup.Item>Prénom: {patientData.prenom}</ListGroup.Item>
                <ListGroup.Item>Email: {patientData.email}</ListGroup.Item>
                <ListGroup.Item>
                  Téléphone: {patientData.telephone || "Non spécifié"}
                </ListGroup.Item>
              </ListGroup>
              <p className="text-muted small">
                <FaInfoCircle className="me-1" />
                La structure devra accepter votre demande avant que vous
                puissiez accéder à ses services.
              </p>
            </>
          )}
        </Modal.Body>
        {!requestSent && (
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddToStructureModal(false)}
            >
              Annuler
            </Button>
            <Button variant="success" onClick={handleAddToStructure}>
              <FaPaperPlane className="me-2" />
              Envoyer la demande
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
};
export default PatientsDashboard;












import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { auth, db } from '../components/firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { signOut } from 'firebase/auth';
import { Button, Card, Modal } from 'react-bootstrap';
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from 'qrcode.react'; // Update this line

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [showDoctorInfo, setShowDoctorInfo] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scannedAppointment, setScannedAppointment] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleShowQRCode = (appointment) => {
    setSelectedAppointment(appointment);
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedAppointment(null);
  };

  const [consultationRequest, setConsultationRequest] = useState({
    reason: '',
    preferredDate: '',
    symptoms: ''
  });

  const [sourceInfo, setSourceInfo] = useState({
    medecins: {},
    structures: {}
  });

  const [appointmentSources, setAppointmentSources] = useState({
    structures: {},
    medecins: {}
  });

  const handleScannerClose = () => {
    setShowScanner(false);
    setScannedData(null);
  };

  const initializeScanner = () => {
    const newScanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    newScanner.render(success, error => {
      console.error(error);
    });

    setScanner(newScanner);
  };

  const success = async (decodedText) => {
    if (decodedText) {
      try {
        const appointmentData = JSON.parse(decodedText);
        const appointmentMatch = appointments.find(apt => apt.id === appointmentData.id);
        
        if (appointmentMatch) {
          setScannedAppointment(appointmentMatch);
          if (scanner) {
            scanner.clear();
          }
          setShowScanner(false);
        }
      } catch (error) {
        console.error('Invalid QR code data:', error);
      }
    }
  };

  useEffect(() => {
    if (showScanner) {
      initializeScanner();
    }
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showScanner]);

  useEffect(() => {
    const fetchSourceInfo = async () => {
      try {
        const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
        const medecinsData = {};
        medecinsSnapshot.forEach(doc => {
          medecinsData[doc.id] = { id: doc.id, ...doc.data() };
        });

        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = {};
        structuresSnapshot.forEach(doc => {
          structuresData[doc.id] = { id: doc.id, ...doc.data() };
        });

        setSourceInfo({
          medecins: medecinsData,
          structures: structuresData
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des sources:", error);
      }
    };

    fetchSourceInfo();
  }, []);

  useEffect(() => {
    const fetchAppointmentSources = async () => {
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = {};
        structuresSnapshot.forEach(doc => {
          structuresData[doc.id] = { id: doc.id, ...doc.data() };
        });

        const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
        const medecinsData = {};
        medecinsSnapshot.forEach(doc => {
          medecinsData[doc.id] = { id: doc.id, ...doc.data() };
        });

        setAppointmentSources({
          structures: structuresData,
          medecins: medecinsData
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des sources:", error);
      }
    };

    fetchAppointmentSources();
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const patientQuery = query(
          collection(db, 'patients'),
          where('email', '==', currentUser.email)
        );
        const patientSnapshot = await getDocs(patientQuery);
        
        if (!patientSnapshot.empty) {
          const patientDoc = patientSnapshot.docs[0];
          setPatientData({ id: patientDoc.id, ...patientDoc.data() });

          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', patientDoc.id)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAppointments(appointmentsData);

          const notesQuery = query(
            collection(db, 'patientNotes'),
            where('patientId', '==', patientDoc.id)
          );
          const notesSnapshot = await getDocs(notesQuery);
          const notesData = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMedicalNotes(notesData);

          if (patientDoc.data().documents) {
            setDocuments(patientDoc.data().documents);
          }
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (patientData && patientData.medecinId) {
        try {
          const doctorRef = doc(db, 'medecins', patientData.medecinId);
          const doctorSnap = await getDoc(doctorRef);
          
          if (doctorSnap.exists()) {
            setDoctorInfo({
              id: doctorSnap.id,
              ...doctorSnap.data()
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des informations du médecin:", error);
        }
      }
    };

    if (patientData) {
      fetchDoctorInfo();
    }
  }, [patientData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    setShowConsultationForm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Mes Documents Médicaux</h3>
            </div>
            <div className="card-body">
              {documents.length > 0 ? (
                <div className="list-group">
                  {documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="list-group-item list-group-item-action"
                    >
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Aucun document médical disponible</p>
              )}
            </div>
          </div>
        );

        case 'appointments':
          return (
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Mes Rendez-vous</h3>
              </div>
              <div className="card-body">
                {appointments.length > 0 ? (
                  <div className="list-group">
                    {appointments.map(apt => (
                      <div key={apt.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-1">Rendez-vous du {apt.day}</h5>
                            <p className="mb-1">Heure: {apt.timeSlot}</p>
                            {apt.structureId ? (
                              <p className="mb-1 text-muted">
                                Structure: {appointmentSources.structures[apt.structureId]?.name}
                              </p>
                            ) : (
                              <p className="mb-1 text-muted">
                                Médecin: Dr. {appointmentSources.medecins[apt.doctorId]?.nom}
                              </p>
                            )}
                            <button
                              className="btn btn-primary btn-sm mt-2"
                              onClick={() => handleShowQRCode(apt)}
                            >
                              Afficher QR Code
                            </button>
                          </div>
                          <span className={`badge ${
                            apt.status === 'completed' ? 'bg-success' : 
                            apt.status === 'pending' ? 'bg-warning' : 'bg-primary'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Aucun rendez-vous programmé</p>
                )}
              </div>
            </div>
          );



      case 'consultation':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Demande de Consultation</h3>
            </div>
            <div className="card-body">
              {showConsultationForm ? (
                <form onSubmit={handleConsultationSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Motif de consultation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={consultationRequest.reason}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        reason: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date souhaitée</label>
                    <input
                      type="date"
                      className="form-control"
                      value={consultationRequest.preferredDate}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        preferredDate: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Symptômes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={consultationRequest.symptoms}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        symptoms: e.target.value
                      })}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Envoyer la demande
                  </button>
                </form>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConsultationForm(true)}
                >
                  Nouvelle demande de consultation
                </button>
              )}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Messagerie</h3>
            </div>
            <div className="card-body">
              <p className="text-muted">Service de messagerie à venir</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="alert alert-warning m-3" role="alert">
        Aucune donnée patient trouvée
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">
            {patientData.prenom} {patientData.nom}
          </span>
          
          <div className="navbar-nav mx-auto">
            <button 
              className={`btn btn-link nav-link ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Mes Documents Médicaux
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Mes Rendez-vous
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'consultation' ? 'active' : ''}`}
              onClick={() => setActiveTab('consultation')}
            >
              Demande de Consultation
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messagerie
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="button-text">Déconnexion</span>
          </button>
        </div>
      </nav>

      <div className="container mt-4 flex-grow-1">
        {renderContent()}
      </div>

      <Modal show={showQRModal} onHide={handleCloseQRModal} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Détails du Rendez-vous
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 text-center border-end">
              {selectedAppointment && (
                <div className="p-3">
                  <QRCodeSVG
                    value={JSON.stringify({
                      id: selectedAppointment.id,
                      date: selectedAppointment.day,
                      heure: selectedAppointment.timeSlot,
                      structure: appointmentSources.structures[selectedAppointment.structureId]?.name,
                      medecin: appointmentSources.medecins[selectedAppointment.doctorId]?.nom,
                      status: selectedAppointment.status
                    })}
                    size={256}
                    level="H"
                  />
                </div>
              )}
            </div>
            <div className="col-md-6">
              {selectedAppointment && (
                <div className="p-3">
                  <h5 className="border-bottom pb-2 mb-3">Informations du rendez-vous</h5>
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Date et Heure</h6>
                    <p className="mb-1">
                      <i className="bi bi-calendar-event me-2 text-primary"></i>
                      {selectedAppointment.day}
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-clock me-2 text-primary"></i>
                      {selectedAppointment.timeSlot}
                    </p>
                  </div>

                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Médecin</h6>
                    <p className="mb-1">
                      <i className="bi bi-person-badge me-2 text-primary"></i>
                      Dr. {appointmentSources.medecins[selectedAppointment.doctorId]?.nom}
                    </p>
                    {appointmentSources.medecins[selectedAppointment.doctorId]?.specialite && (
                      <p className="mb-0">
                        <i className="bi bi-briefcase me-2 text-primary"></i>
                        {appointmentSources.medecins[selectedAppointment.doctorId]?.specialite}
                      </p>
                    )}
                  </div>

                  {appointmentSources.structures[selectedAppointment.structureId]?.name && (
                    <div className="mb-3">
                      <h6 className="text-muted mb-2">Structure</h6>
                      <p className="mb-0">
                        <i className="bi bi-hospital me-2 text-primary"></i>
                        {appointmentSources.structures[selectedAppointment.structureId]?.name}
                      </p>
                    </div>
                  )}

                  <div>
                    <h6 className="text-muted mb-2">Statut</h6>
                    <span className={`badge ${
                      selectedAppointment.status === 'completed' ? 'bg-success' : 
                      selectedAppointment.status === 'pending' ? 'bg-warning' : 'bg-primary'
                    } px-3 py-2`}>
                      <i className="bi bi-check-circle me-2"></i>
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>
            Imprimer
          </Button>
          <Button variant="secondary" onClick={handleCloseQRModal}>
            <i className="bi bi-x-circle me-2"></i>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientDashboard;







import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { auth, db } from '../components/firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { signOut } from 'firebase/auth';
import { Button, Card } from 'react-bootstrap';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showConsultationForm, setShowConsultationForm] = useState(false);

  const [doctorInfo, setDoctorInfo] = useState(null);
const [showDoctorInfo, setShowDoctorInfo] = useState(false);

  const [consultationRequest, setConsultationRequest] = useState({
    reason: '',
    preferredDate: '',
    symptoms: ''
  });
  const [sourceInfo, setSourceInfo] = useState({
    medecins: {},
    structures: {}
  });
  const [appointmentSources, setAppointmentSources] = useState({
    structures: {},
    medecins: {}
  });

  useEffect(() => {
    const fetchSourceInfo = async () => {
      try {
        // Récupérer les informations des médecins
        const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
        const medecinsData = {};
        medecinsSnapshot.forEach(doc => {
          medecinsData[doc.id] = { id: doc.id, ...doc.data() };
        });
  
        // Récupérer les informations des structures
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = {};
        structuresSnapshot.forEach(doc => {
          structuresData[doc.id] = { id: doc.id, ...doc.data() };
        });
  
        setSourceInfo({
          medecins: medecinsData,
          structures: structuresData
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des sources:", error);
      }
    };
  
    fetchSourceInfo();
  }, []);

  // Ajoutez cet useEffect pour charger les informations des structures et médecins
useEffect(() => {
  const fetchAppointmentSources = async () => {
    try {
      // Récupérer les structures
      const structuresSnapshot = await getDocs(collection(db, 'structures'));
      const structuresData = {};
      structuresSnapshot.forEach(doc => {
        structuresData[doc.id] = { id: doc.id, ...doc.data() };
      });

      // Récupérer les médecins
      const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
      const medecinsData = {};
      medecinsSnapshot.forEach(doc => {
        medecinsData[doc.id] = { id: doc.id, ...doc.data() };
      });

      setAppointmentSources({
        structures: structuresData,
        medecins: medecinsData
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des sources:", error);
    }
  };

  fetchAppointmentSources();
}, []);


  useEffect(() => {
    const fetchPatientData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const patientQuery = query(
          collection(db, 'patients'),
          where('email', '==', currentUser.email)
        );
        const patientSnapshot = await getDocs(patientQuery);
        
        if (!patientSnapshot.empty) {
          const patientDoc = patientSnapshot.docs[0];
          setPatientData({ id: patientDoc.id, ...patientDoc.data() });

          // Fetch appointments
          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', patientDoc.id)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAppointments(appointmentsData);

          // Fetch medical notes
          const notesQuery = query(
            collection(db, 'patientNotes'),
            where('patientId', '==', patientDoc.id)
          );
          const notesSnapshot = await getDocs(notesQuery);
          const notesData = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMedicalNotes(notesData);

          // Fetch documents
          if (patientDoc.data().documents) {
            setDocuments(patientDoc.data().documents);
          }
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [currentUser, navigate]);


  // Ajouter cette fonction useEffect pour récupérer les informations du médecin
useEffect(() => {
  const fetchDoctorInfo = async () => {
    if (patientData && patientData.medecinId) {
      try {
        const doctorRef = doc(db, 'medecins', patientData.medecinId);
        const doctorSnap = await getDoc(doctorRef);
        
        if (doctorSnap.exists()) {
          setDoctorInfo({
            id: doctorSnap.id,
            ...doctorSnap.data()
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des informations du médecin:", error);
      }
    }
  };

  if (patientData) {
    fetchDoctorInfo();
  }
}, [patientData]);

 const handleLogout = async () => {
   try {
     await signOut(auth);
         localStorage.clear();
       navigate('/');
     
   } catch (error) {
     console.error('Erreur de déconnexion:', error);
   }
 };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    // Implement consultation request submission logic here
    setShowConsultationForm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Mes Documents Médicaux</h3>
            </div>
            <div className="card-body">
              {documents.length > 0 ? (
                <div className="list-group">
                  {documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="list-group-item list-group-item-action"
                    >
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Aucun document médical disponible</p>
              )}
            </div>
          </div>
        );
case 'appointments':
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="mb-0">Mes Rendez-vous</h3>
      </div>
      <div className="card-body">
        {appointments.length > 0 ? (
          <div className="list-group">
            {appointments.map(apt => (
              <div key={apt.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">Rendez-vous du {apt.day}</h5>
                    <p className="mb-1">Heure: {apt.timeSlot}</p>
                    {apt.structureId ? (
                      <p className="mb-1 text-muted">
                        <i className="bi bi-building me-2"></i>
                        Structure: {appointmentSources.structures[apt.structureId]?.name || 'Non spécifiée'}
                      </p>
                    ) : (
                      <p className="mb-1 text-muted">
                        <i className="bi bi-person-vcard me-2"></i>
                        Médecin: Dr. {appointmentSources.medecins[apt.doctorId]?.nom || ''} {appointmentSources.medecins[apt.doctorId]?.prenom || ''}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${
                    apt.status === 'completed' ? 'bg-success' : 
                    apt.status === 'pending' ? 'bg-warning' : 'bg-primary'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Aucun rendez-vous programmé</p>
        )}
      </div>
    </div>
  );
        
          return (
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Mes Rendez-vous</h3>
              </div>
              <div className="card-body">
                {appointments.length > 0 ? (
                  <div className="list-group">
                    {appointments.map(apt => (
                      <div key={apt.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-1">Rendez-vous du {apt.day}</h5>
                            <p className="mb-1">Heure: {apt.timeSlot}</p>
                            {apt.structureId ? (
                              <p className="mb-1 text-muted">
                                <i className="bi bi-building"></i> Structure: {sourceInfo.structures[apt.structureId]?.nom || 'Non spécifiée'}
                              </p>
                            ) : (
                              <p className="mb-1 text-muted">
                                <i className="bi bi-person-vcard"></i> Médecin: Dr. {sourceInfo.medecins[apt.doctorId]?.nom || 'Non spécifié'} {sourceInfo.medecins[apt.doctorId]?.prenom || ''}
                              </p>
                            )}
                          </div>
                          <span className={`badge ${
                            apt.status === 'completed' ? 'bg-success' : 
                            apt.status === 'pending' ? 'bg-warning' : 'bg-primary'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Aucun rendez-vous programmé</p>
                )}
              </div>
            </div>
          );
      case 'consultation':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Demande de Consultation</h3>
            </div>
            <div className="card-body">
              {showConsultationForm ? (
                <form onSubmit={handleConsultationSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Motif de consultation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={consultationRequest.reason}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        reason: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date souhaitée</label>
                    <input
                      type="date"
                      className="form-control"
                      value={consultationRequest.preferredDate}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        preferredDate: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Symptômes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={consultationRequest.symptoms}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        symptoms: e.target.value
                      })}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Envoyer la demande
                  </button>
                </form>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConsultationForm(true)}
                >
                  Nouvelle demande de consultation
                </button>
              )}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Messagerie</h3>
            </div>
            <div className="card-body">
              <p className="text-muted">Service de messagerie à venir</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="alert alert-warning m-3" role="alert">
        Aucune donnée patient trouvée
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand">
            {patientData.prenom} {patientData.nom}
          </span>
          
          <div className="navbar-nav mx-auto">
            <button 
              className={`btn btn-link nav-link ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Mes Documents Médicaux
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              Mes Rendez-vous
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'consultation' ? 'active' : ''}`}
              onClick={() => setActiveTab('consultation')}
            >
              Demande de Consultation
            </button>
            <button 
              className={`btn btn-link nav-link ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messagerie
            </button>
          </div>
          
          <button
              onClick={handleLogout}
              className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="button-text">Déconnexion</span>
            </button>
        </div>
      </nav>

      <div className="container mt-4 flex-grow-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default PatientDashboard;

à l'aide du code ajuste le composant :"PatientDashboard.js" qui a l'option d'afficher toutes les informations du patient qui se connecte avec le mail et le mot de passe avec :"General.js"  , l'option qui affiche un menu qui affiche le nom du patient au fond a gauche les boutons :"mes documents medicaux,mes rendez-vous , demande de consultation, messagerie" au milieu et le bouton de deconnexion au fond a droite, une option qui affiche en bas par defauts les rendez-vous , l'option qui permet au bouton "mes rendez-vous" d'afficher les rendez-vous  que le patient a avec ,utilise bootstrap pour les ajustement.



import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Modal, Row, Col, Badge,Form,Button ,Alert} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../components/firebase-config.js';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { FaHospital,FaUserCircle, FaSignOutAlt, FaCalendarCheck, FaUserEdit,FaUserMd,FaClipboardList } from 'react-icons/fa';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});
  
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [consultationReason, setConsultationReason] = useState('');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);


  const weekdayOrder = {
    'Lundi': 1,
    'Mardi': 2,
    'Mercredi': 3,
    'Jeudi': 4,
    'Vendredi': 5,
    'Samedi': 6,
    'Dimanche': 7
  };

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const patientDataStr = localStorage.getItem('patientData');
        if (patientDataStr) {
          const data = JSON.parse(patientDataStr);
          setPatientData(data);
          await fetchAppointments(data.id);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
      }
    };

    loadPatientData();
  }, []);

  const fetchAppointments = async (patientId) => {
    try {
      // First fetch the patient's structure assignments
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(assignmentsRef, where('patientId', '==', patientId));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      // Create a map of doctorId -> structureId from assignments
      const doctorStructureMap = {};
      assignmentsSnapshot.docs.forEach(doc => {
        const assignment = doc.data();
        doctorStructureMap[assignment.doctorId] = assignment.structureId;
      });
  
      // Fetch appointments
      const appointmentsRef = collection(db, 'appointments');
      const appointmentsQuery = query(appointmentsRef, where('patientId', '==', patientId));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
  
      const doctorIds = new Set();
      appointmentsSnapshot.docs.forEach(doc => {
        const appointment = doc.data();
        doctorIds.add(appointment.doctorId);
      });
  
      // Fetch doctors and their structure information
      const doctorsData = await Promise.all(
        Array.from(doctorIds).map(async (doctorId) => {
          const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
          const doctorData = doctorDoc.data();
          
          // Get structure info from assignments
          const structureId = doctorStructureMap[doctorId];
          if (structureId) {
            const structureDoc = await getDoc(doc(db, 'structures', structureId));
            const structureData = structureDoc.data();
            return {
              id: doctorId,
              ...doctorData,
              structureName: structureData.nom
            };
          }
          
          return {
            id: doctorId,
            ...doctorData,
            structureName: 'Non assigné'
          };
        })
      );
  
      setAssignedDoctors(doctorsData);
  
      // Group appointments by doctor
      const appointmentsByDoctor = {};
      appointmentsSnapshot.docs.forEach(doc => {
        const appointment = {
          id: doc.id,
          ...doc.data()
        };
        if (!appointmentsByDoctor[appointment.doctorId]) {
          appointmentsByDoctor[appointment.doctorId] = [];
        }
        appointmentsByDoctor[appointment.doctorId].push(appointment);
      });
  
      setDoctorAppointments(appointmentsByDoctor);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
   
  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const structuresRef = collection(db, 'structures');
        const structuresSnapshot = await getDocs(structuresRef);
        const structuresData = structuresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched structures:', structuresData); // For verification
        setStructures(structuresData);
      } catch (error) {
        console.error('Error fetching structures:', error);
      }
    };
  
    fetchStructures();
  }, []);
  

  const handleStructureChange = async (structureId) => {
    setSelectedStructure(structureId);
    try {
      const structureDoc = await getDoc(doc(db, 'structures', structureId));
      const structureData = structureDoc.data();
      setSpecialties(structureData.specialties || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const handleConsultationRequest = async (e) => {
    e.preventDefault();
    try {
      const consultationRequest = {
        patientId: patientData.id,
        patientName: `${patientData.nom} ${patientData.prenom}`,
        patientInfo: patientData,
        structureId: selectedStructure,
        specialty: selectedSpecialty,
        reason: consultationReason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'consultationRequests'), consultationRequest);
      setRequestStatus('success');
      setTimeout(() => {
        setShowConsultationModal(false);
        setRequestStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      setRequestStatus('error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand>
            <FaUserCircle className="me-2" />
            {patientData?.nom} {patientData?.prenom}
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link onClick={() => setShowAppointmentsModal(true)}>
                <FaCalendarCheck className="me-2" />
                Mes Rendez-vous
              </Nav.Link>
              <Nav.Link onClick={() => setShowConsultationModal(true)}>
        <FaHospital className="me-2" />
        Demande de Consultation
      </Nav.Link>
              <Nav.Link onClick={() => setShowProfileModal(true)}>
                <FaUserEdit className="me-2" />
                Mon Profil
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link onClick={handleLogout}>
                <FaSignOutAlt className="me-2" />
                Déconnexion
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaUserCircle className="me-2" />
            Mon Profil
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patientData && (
            <Row>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Informations Personnelles</h5>
                <p><strong>Nom:</strong> {patientData.nom}</p>
                <p><strong>Prénom:</strong> {patientData.prenom}</p>
                <p><strong>Age:</strong> {patientData.age} ans</p>
                <p><strong>Sexe:</strong> {patientData.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                <p><strong>Email:</strong> {patientData.email}</p>
                <p><strong>Téléphone:</strong> {patientData.telephone}</p>
              </Col>
              <Col md={6}>
                <h5 className="border-bottom pb-2">Assurances</h5>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {patientData.insurance?.map((ins, index) => (
                    <Badge key={index} bg="info">{ins}</Badge>
                  ))}
                </div>
                {patientData.photo && (
                  <div>
                    <h5 className="border-bottom pb-2">Photo</h5>
                    <img 
                      src={patientData.photo} 
                      alt="Profile" 
                      className="img-fluid rounded"
                      style={{ maxWidth: '200px' }}
                    />
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* Appointments Modal */}
      <Modal
  show={showAppointmentsModal}
  onHide={() => setShowAppointmentsModal(false)}
  size="lg"
>
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <FaCalendarCheck className="me-2" />
      Mes Rendez-vous
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {assignedDoctors.length > 0 ? (
      assignedDoctors.map(doctor => (
        <div key={doctor.id} className="assigned-doctor-info mb-4">
          <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
            <h5 className="border-bottom pb-2 text-primary">
              <FaUserMd className="me-2" />
              Dr. {doctor.nom} {doctor.prenom}
            </h5>
            <p><strong>Spécialité:</strong> {doctor.specialite}</p>
            <p><strong>Structure:</strong> {doctor.structureId}</p>
          </div>

          <div className="appointments-section">
            <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
            {doctorAppointments[doctor.id]?.length > 0 ? (
              <div className="appointments-list">
                {doctorAppointments[doctor.id]
                  .sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day])
                  .map(apt => (
                    <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="mb-1">
                            <strong>Jour:</strong> {apt.day}
                          </p>
                          <p className="mb-0">
                            <strong>Heure:</strong> {apt.timeSlot}
                          </p>
                        </div>
                        <Badge bg={apt.status === 'completed' ? 'success' : 'warning'}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="text-center p-4">
        <FaUserMd className="fa-3x text-muted mb-3" />
        <p>Aucun médecin assigné pour le moment</p>
      </div>
    )}
  </Modal.Body>
</Modal>

 {/* Consultation Request Modal */}
 <Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)}>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaHospital className="me-2" />
            Nouvelle Demande de Consultation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requestStatus === 'success' && (
            <Alert variant="success">
              Votre demande a été envoyée avec succès!
            </Alert>
          )}
          {requestStatus === 'error' && (
            <Alert variant="danger">
              Une erreur est survenue. Veuillez réessayer.
            </Alert>
          )}

          <Form onSubmit={handleConsultationRequest}>
            <Form.Group className="mb-3">
              <Form.Label>Structure</Form.Label>
              <Form.Select
  value={selectedStructure}
  onChange={(e) => handleStructureChange(e.target.value)}
  required
>
  <option value="">Sélectionnez une structure</option>
  {structures.map(structure => (
    <option key={structure.id} value={structure.id}>
      {structure.name} {/* Use the correct field name from your Firestore document */}
    </option>
  ))}
</Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Spécialité</Form.Label>
              <Form.Select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                required
              >
                <option value="">Sélectionnez une spécialité</option>
                {specialties.map((specialty, index) => (
                  <option key={index} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Motif de la consultation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={consultationReason}
                onChange={(e) => setConsultationReason(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
              Envoyer la demande
            </Button>
          </Form>
        </Modal.Body>
      </Modal>


    </>
  );
};

export default PatientDashboard;





import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, ButtonGroup,Table,ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db,auth,storage } from '../components/firebase-config.js';
import {QRCode} from "react-qr-code";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, serverTimestamp,query, where, getDocs, addDoc, onSnapshot,doc, getDoc , updateDoc, arrayUnion,deleteDoc} from 'firebase/firestore';
import {FaPaperPlane,FaFile, FaComment, FaTrash, FaEdit ,FaQrcode, FaTimes, FaPrint, FaDownload,FaUser, FaUserMd, FaCalendarAlt, FaClock, FaEnvelope, FaPhone, FaSignOutAlt ,FaThLarge, FaList} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import './PatientDashboard.css';

const PatientsDashboard = () => {
const navigate = useNavigate();
const [assignedDoctors, setAssignedDoctors] = useState([]);
const patientData = JSON.parse(localStorage.getItem('patientData'));
const [docRequests, setDocRequests] = useState([]);
const [selectedRequest, setSelectedRequest] = useState(null);
const [createdByDoctors, setCreatedByDoctors] = useState([]);
const [availableDoctors, setAvailableDoctors] = useState([]);
const [appointments, setAppointments] = useState([]);
const [showConsultationModal, setShowConsultationModal] = useState(false);
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
const [selectedDay, setSelectedDay] = useState('');
const [message, setMessage] = useState('');
const [confirmedDoctors, setConfirmedDoctors] = useState(() => {
const saved = localStorage.getItem('confirmedDoctors');
return saved ? JSON.parse(saved) : {};
});
const [permanentConfirmations, setPermanentConfirmations] = useState(() => {
const saved = localStorage.getItem('permanentConfirmations');
return saved ? JSON.parse(saved) : {};
});
const [activeTab, setActiveTab] = useState('accepted'); // Default tab is 'accepted'
const [isFlipped, setIsFlipped] = useState(false);
const [viewMode, setViewMode] = useState('grid');
const [selectedEndTime, setSelectedEndTime] = useState('');
const [consultationReason, setConsultationReason] = useState('');
const [assignedDoctorsList, setAssignedDoctorsList] = useState([]);


useEffect(() => {
const fetchAssignedDoctors = async () => {
if (!patientData?.id) return;
try {
const patientRef = doc(db, 'patients', patientData.id);
const patientDoc = await getDoc(patientRef);
if (patientDoc.exists()) {
const patientInfo = patientDoc.data();
const medecinIds = [];
if (patientInfo.medecinId) {
medecinIds.push(patientInfo.medecinId);
}
if (patientInfo.medecins && Array.isArray(patientInfo.medecins)) {
medecinIds.push(...patientInfo.medecins);
}
const doctorsData = await Promise.all(
medecinIds.map(async (medecinId) => {
const doctorRef = doc(db, 'medecins', medecinId);
const doctorDoc = await getDoc(doctorRef);
if (doctorDoc.exists()) {
return {
id: doctorDoc.id,
...doctorDoc.data()
};
}
return null;
})
);
setAssignedDoctorsList(doctorsData.filter(Boolean));
}
} catch (error) {
console.error('Erreur lors de la récupération des médecins:', error);
}
};

fetchAssignedDoctors();
const unsubscribe = onSnapshot(
doc(db, 'patients', patientData.id),
() => {
fetchAssignedDoctors();
}
);


return () => unsubscribe();
}, [patientData?.id]);

const [qrRefreshKey, setQrRefreshKey] = useState(Date.now());
const [selectedDoctors, setSelectedDoctors] = useState([]);
const [selectedDays, setSelectedDays] = useState({});
const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
const [showProfileModal, setShowProfileModal] = useState(false);
const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
const [assignedDoctorsDetails, setAssignedDoctorsDetails] = useState([]);
const [structureDetails, setStructureDetails] = useState(null);
const [showQRModal, setShowQRModal] = useState(false);
const [selectedQRData, setSelectedQRData] = useState(null);
const [selectedFile, setSelectedFile] = useState(null);
const [editContent, setEditContent] = useState('');
const fetchPatientDetails = async (patientId) => {
try {
const patientRef = doc(db, 'patients', patientId);
const patientDoc = await getDoc(patientRef);
const patientData = patientDoc.data();

const assignedDocs = [];
if (patientData.medecins && patientData.medecins.length > 0) {
for (const medecinId of patientData.medecins) {
const medecinRef = doc(db, 'medecins', medecinId);
const medecinDoc = await getDoc(medecinRef);
if (medecinDoc.exists()) {
assignedDocs.push({
id: medecinDoc.id,
...medecinDoc.data()
});
}
}
}

let structureData = null;
if (patientData.structureId) {
const structureRef = doc(db, 'structures', patientData.structureId);
const structureDoc = await getDoc(structureRef);
if (structureDoc.exists()) {
structureData = {
id: structureDoc.id,
...structureDoc.data()
};
}
}


setSelectedPatientDetails(patientData);
setAssignedDoctorsDetails(assignedDocs);
setStructureDetails(structureData);
setShowPatientDetailsModal(true);
} catch (error) {
setMessage('Erreur lors du chargement des détails');
}
};


useEffect(() => {
const fetchDoctorAvailability = async () => {
const doctorsRef = collection(db, 'medecins');
const snapshot = await getDocs(doctorsRef);
const doctorsData = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data(),
joursDisponibles: doc.data().disponibilite || []
}));
setAvailableDoctors(doctorsData);
};
fetchDoctorAvailability();
}, []);
useEffect(() => {
if (patientData?.id) {
fetchCreatedByDoctors();
fetchAvailableDoctors();
fetchAppointments();
}
}, [patientData?.id]);


const fetchCreatedByDoctors = async () => {
try {
const patientRef = doc(db, 'patients', patientData.id);
const patientDoc = await getDoc(patientRef);
if (patientDoc.exists() && patientDoc.data().createdBy) {
const doctorRef = doc(db, 'medecins', patientDoc.data().createdBy);
const doctorDoc = await getDoc(doctorRef);
if (doctorDoc.exists()) {
setCreatedByDoctors([{
id: doctorDoc.id,
...doctorDoc.data()
}]);
}
}
} catch (error) {
console.error('Error fetching doctor data:', error);
setMessage('Erreur lors du chargement des données du médecin');
}
};


const fetchAvailableDoctors = async () => {
const doctorsQuery = query(collection(db, 'medecins'));
const snapshot = await getDocs(doctorsQuery);
setAvailableDoctors(snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
})));
};


const fetchAppointments = () => {
const appointmentsQuery = query(
collection(db, 'appointments'),
where('patientId', '==', patientData.id)
);
const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
const appointmentsData = await Promise.all(
snapshot.docs.map(async (docSnapshot) => { // Change 'doc' to 'docSnapshot'
const appointmentData = docSnapshot.data();
const doctorRef = doc(db, 'medecins', appointmentData.doctorId);
const doctorDoc = await getDoc(doctorRef);
return {
id: docSnapshot.id,
...appointmentData,
doctorInfo: doctorDoc.exists() ? doctorDoc.data() : null
};
})
);
setAppointments(appointmentsData);
});
return unsubscribe;
};
const handleConsultationRequest = async () => {
try {
if (!selectedDoctor || !selectedDay || !selectedTimeSlot || !selectedEndTime) {
setMessage('Veuillez remplir tous les champs');
return;
}
const consultationRequest = {
patientId: patientData.id,
doctorId: selectedDoctor.id,
patientInfo: patientData,
doctorInfo: {
nom: selectedDoctor.nom,
prenom: selectedDoctor.prenom,
specialite: selectedDoctor.specialite
},
requestDate: new Date().toISOString(),
status: 'pending',
preferredDay: selectedDay,
preferredTimeStart: selectedTimeSlot,
preferredTimeEnd: selectedEndTime,
reason: consultationReason
};
await addDoc(collection(db, 'consultationRequests'), consultationRequest);
setMessage('Demande de consultation envoyée avec succès');
setShowConsultationModal(false);
resetForm();
} catch (error) {
setMessage('Erreur lors de l\'envoi de la demande');
console.error(error);
}
};
const resetForm = () => {
setSelectedDoctor(null);
setSelectedDay('');
setSelectedTimeSlot('');
setSelectedEndTime('');
setConsultationReason('');
};

useEffect(() => {
const interval = setInterval(() => {
setQrRefreshKey(Date.now());
}, 24*60*60*1000); // Rafraîchit toutes les 24h
return () => clearInterval(interval);
}, []);


const generateTimeSlots = (startTime, endTime, duration) => {
const slots = [];
let currentTime = new Date(`2000/01/01 ${startTime}`);
const endDateTime = new Date(`2000/01/01 ${endTime}`);
while (currentTime < endDateTime) {
slots.push(currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
currentTime.setMinutes(currentTime.getMinutes() + duration);
}
return slots;
};

const [acceptedConsultations, setAcceptedConsultations] = useState([]);
// Add this useEffect to fetch accepted consultations
useEffect(() => {
if (patientData?.id) {
const unsubscribe = onSnapshot(
query(
collection(db, 'consultationRequests'),
where('patientId', '==', patientData.id),
where('status', '==', 'accepted')
),
async (snapshot) => {
const consultationsData = await Promise.all(
snapshot.docs.map(async (doc) => {
const data = doc.data();
return {
id: doc.id,
...data,
acceptedAt: data.acceptedAt
};
})
);
setAcceptedConsultations(consultationsData);
}
);
return () => unsubscribe();
}
}, [patientData?.id]);

const [documentRequests, setDocumentRequests] = useState([]);
const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
const [selectedDocuments, setSelectedDocuments] = useState([]);
const [sharedDocuments, setSharedDocuments] = useState([]);


useEffect(() => {
  if (patientData?.id) {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'documentRequests'),
        where('patientId', '==', patientData.id)
      ),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocumentRequests(requests);
      }
    );
    return () => unsubscribe();
  }
}, [patientData?.id]);


const handleDocumentRequest = async (requestId, isAccepted) => {
  try {
    if (isAccepted) {
      await updateDoc(doc(db, 'documentRequests', requestId), {
        status: 'accepted',
        respondedAt: new Date().toISOString()
      });
      setShowDocumentRequestModal(true);
    } else {
      await updateDoc(doc(db, 'documentRequests', requestId), {
        status: 'rejected',
        respondedAt: new Date().toISOString()
      });
    }
    setMessage(`Demande ${isAccepted ? 'acceptée' : 'refusée'} avec succès`);
  } catch (error) {
    setMessage('Erreur lors du traitement de la demande');
  }
};

const handleShareDocuments = async (requestId, doctorId) => {
  try {
    const uploadedDocs = await Promise.all(
      selectedDocuments.map(async (file) => {
        const fileRef = ref(storage, `shared-documents/${patientData.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        return {
          name: file.name,
          url: url,
          sharedAt: new Date().toISOString()
        };
      })
    );

    await updateDoc(doc(db, 'patients', patientData.id), {
      sharedDocuments: arrayUnion(...uploadedDocs)
    });

    await updateDoc(doc(db, 'documentRequests', requestId), {
      sharedDocuments: uploadedDocs,
      status: 'completed'
    });

    setShowDocumentRequestModal(false);
    setMessage('Documents partagés avec succès');
  } catch (error) {
    setMessage('Erreur lors du partage des documents');
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
        localStorage.clear();
      navigate('/');
    
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

useEffect(() => {
  const fetchCreatedByDoctors = async () => {
    try {
      if (!patientData?.id) {
        console.warn('Patient data is not available');
        return;
      }
      
      const patientRef = doc(db, 'patients', patientData.id);
      const patientDoc = await getDoc(patientRef);
      
      if (patientDoc.exists() && patientDoc.data().createdBy) {
        const doctorRef = doc(db, 'medecins', patientDoc.data().createdBy);
        const doctorDoc = await getDoc(doctorRef);
        
        if (doctorDoc.exists()) {
          setCreatedByDoctors([{
            id: doctorDoc.id,
            ...doctorDoc.data()
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    }
  };

  fetchCreatedByDoctors();
}, [patientData?.id]);


return (
<Container fluid className="py-4">
{message && (
  <Alert 
    variant={message.includes('succès') ? 'success' : 'danger'}
    onClose={() => setMessage('')} 
    dismissible
    className="mb-3"
  >
    {message}
  </Alert>
)}
<div className="row mb-4">
  <div className="col">
    <div className="card border-0 rounded-4 shadow-lg transition-transform">
      <div className="card-header bg-primary bg-gradient p-1">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Patient Name Section */}
          <div className="patient-info flex-grow-0">
            <div
              onClick={() => fetchPatientDetails(patientData.id)}
              className="text-white position-relative patient-link"
            >
              <h4 className="mb-0 d-flex align-items-center fw-bold fs-responsive">
                <i className="bi bi-person-fill me-2"></i>
                {patientData.nom}
              </h4>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => setShowConsultationModal(true)}
              className="btn btn-light px-2 py-1 d-flex align-items-center consultation-btn btn-responsive"
            >
              <i className="bi bi-person-vcard-fill me-1"></i>
              <span className="button-text">Consultation</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="button-text">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="nav nav-tabs mt-1 border-0 flex-nowrap overflow-auto">
          <button
            className={`nav-link text-white ${activeTab === 'all' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('all')}
            title='Afficher tous les champs'
          >
            <i className="bi bi-grid-fill me-1"></i>
            <span className="tab-text">Tout</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'creators' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('creators')}
            title='Médecins créateurs'
          >
            <i className="bi bi-people-fill me-1"></i>
            <span className="tab-text">Créateurs</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'assigned' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('assigned')}
            title='Médecins assignés'
          >
            <i className="bi bi-person-badge-fill me-1"></i>
            <span className="tab-text">Assignés</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'accepted' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('accepted')}
            title='Médecins acceptés'
          >
            <i className="bi bi-check-circle-fill me-1"></i>
            <span className="tab-text">Acceptés</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'current' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('current')}
            title='Consultations en cours'
          >
            <i className="bi bi-calendar-check-fill me-1"></i>
            <span className="tab-text">Actuel</span>
          </button>
          <button
    onClick={() => navigate('/PatientMessaging')}
    className="btn btn-info px-2 py-1 d-flex align-items-center messaging-btn btn-responsive"
  >
    <FaEnvelope className="me-1" />
    <span className="button-text">Messagerie</span>
  </button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Created By Doctors Section */}
 {(activeTab === 'all' || activeTab === 'creators') && (
    <Row className="mb-4">
      <Col>
        <Card className="shadow-lg border-0 rounded-4 hover-lift">
          <Card.Header className="bg-success text-white p-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <i className="bi bi-people-fill me-2"></i>
              <span className="fs-responsive">Médecins créateurs</span>
            </h5>
            
            {/* View Toggle Buttons */}
            <ButtonGroup>
              <Button 
                variant={viewMode === 'grid' ? 'light' : 'outline-light'}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid"></i>
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'light' : 'outline-light'}
                onClick={() => setViewMode('table')}
              >
                <i className="bi bi-list"></i>
              </Button>
            </ButtonGroup>
          </Card.Header>

          <Card.Body className="p-3">
            {viewMode === 'grid' ? (
              // Original Grid View
              <Row xs={1} md={2} lg={3} className="g-4">
            {createdByDoctors.map(doctor => {
              const qrData = `
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}
                INFORMATIONS MÉDECIN
                Médecin: Dr. ${doctor.nom} ${doctor.prenom}
                Spécialité: ${doctor.specialite}
                Tel: ${doctor.telephone}
                Email: ${doctor.email}
                CONSULTATIONS
                Jours: ${patientData.joursDisponibles?.join(', ')}
                Horaires: ${patientData.appointmentSettings?.heureDebut} - ${patientData.appointmentSettings?.heureFin}
                Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
                Généré le: ${new Date().toLocaleString()}
                Valide jusqu'au: ${new Date(Date.now() + 24*60*60*1000).toLocaleString()}
              `;

              return (
                <Col key={doctor.id}>
                  <Card className={`h-100 border-0 shadow-sm hover-lift-sm rounded-4 
                    ${confirmedDoctors[doctor.id] ? 'bg-success bg-opacity-5' : ''}`}>
                    <Card.Body className="p-responsive">
                      {/* Doctor Header */}
                      <div className="d-flex align-items-center mb-3">
                        <div className="doctor-avatar me-3">
                          {doctor.photo ? (
                            <img src={doctor.photo} alt="Doctor" className="rounded-circle" />
                          ) : (
                            <div className="avatar-placeholder">
                              <i className="bi bi-person-fill"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="fs-responsive mb-1">Dr. {doctor.nom} {doctor.prenom}</h5>
                          <Badge bg="primary" className="badge-responsive">{doctor.specialite}</Badge>
                        </div>
                      </div>

                      {/* Consultation Days */}
                      <div className="info-section mb-3">
                        <h6 className="text-muted fs-responsive mb-2">
                          <i className="bi bi-calendar-week me-2"></i>
                          Jours de consultation
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {patientData.joursDisponibles?.map(jour => (
                            <Badge key={jour} bg="info" className="badge-responsive">{jour}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="info-section mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-primary me-2" />
                          <span className="fs-responsive">
                            {patientData.appointmentSettings?.heureDebut} - 
                            {patientData.appointmentSettings?.heureFin}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-primary me-2" />
                          <span className="fs-responsive">
                            Durée: {patientData.appointmentSettings?.consultationDuration} min
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="info-section mb-3">
                        <div className="contact-item">
                          <FaPhone className="text-primary me-2" />
                          <span className="fs-responsive">{doctor.telephone}</span>
                        </div>
                        <div className="contact-item">
                          <FaEnvelope className="text-primary me-2" />
                          <span className="fs-responsive">{doctor.email}</span>
                        </div>
                      </div>


                      <div className="d-grid gap-2">
                        {!permanentConfirmations[doctor.id] ? (
                          <Button
                            variant="success"
                            className="btn-responsive"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'medecins', doctor.id), {
                                  isConfirmed: true,
                                  confirmedAt: new Date().toISOString(),
                                  isPermanentlyConfirmed: true
                                });
                                const newPermanentConfirmations = {
                                  ...permanentConfirmations,
                                  [doctor.id]: true
                                };
                                setPermanentConfirmations(newPermanentConfirmations);
                                localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                                setMessage('Consultation confirmée définitivement');
                              } catch (error) {
                                setMessage('Erreur lors de la confirmation');
                              }
                            }}
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            Confirmer définitivement
                          </Button>
                        ) : (
                          <>
        
                            <Button
                              variant="info"
                              className="btn-responsive w-100 mb-2"
                              onClick={() => {
                                setSelectedQRData(qrData);
                                setShowQRModal(true);
                              }}
                            >
                              <i className="fas fa-qr-code me-2"></i>
                              Voir Code QR
                            </Button>
                          

                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-primary"
                                className="btn-responsive"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setShowConsultationModal(true);
                                }}
                              >
                                <i className="fas fa-calendar-plus me-2"></i>
                                Nouvelle consultation
                              </Button>
                              <Button
                                variant="outline-danger"
                                className="btn-responsive"
                                onClick={async () => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) {
                                    try {
                                      const newPermanentConfirmations = { ...permanentConfirmations };
                                      delete newPermanentConfirmations[doctor.id];
                                      setPermanentConfirmations(newPermanentConfirmations);
                                      localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                                      
                                      await updateDoc(doc(db, 'medecins', doctor.id), {
                                        isConfirmed: false,
                                        confirmedAt: null,
                                        isPermanentlyConfirmed: false
                                      });
                                      setMessage('Consultation annulée avec succès');
                                    } catch (error) {
                                      setMessage('Erreur lors de l\'annulation: ' + error.message);
                                    }
                                  }
                                }}
                              >
                                <i className="fas fa-times-circle me-2"></i>
                                Annuler consultation
                              </Button>
                            </ButtonGroup>
                          </>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
            ) : (
              
              // New Table View
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Médecin</th>
                      <th>Spécialité</th>
                      <th>Jours</th>
                      <th>Horaires</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {createdByDoctors.map(doctor => {
  const qrData = `
    INFORMATIONS PATIENT
    Nom: ${patientData?.nom || 'N/A'}
    Prénom: ${patientData?.prenom || 'N/A'}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}
    INFORMATIONS MÉDECIN
    Médecin: Dr. ${doctor.nom} ${doctor.prenom}
    Spécialité: ${doctor.specialite}
    Tel: ${doctor.telephone}
    Email: ${doctor.email}
    CONSULTATIONS
    Jours: ${patientData.joursDisponibles?.join(', ')}
    Horaires: ${patientData.appointmentSettings?.heureDebut} - ${patientData.appointmentSettings?.heureFin}
    Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
    Généré le: ${new Date().toLocaleString()}
    Valide jusqu'au: ${new Date(Date.now() + 24*60*60*1000).toLocaleString()}
  `;

  return (
    <tr key={doctor.id} className={confirmedDoctors[doctor.id] ? 'bg-success bg-opacity-5' : ''}>
    <td>
      <div className="d-flex align-items-center">
        <div className="doctor-avatar me-2">
          {doctor.photo ? (
            <img 
              src={doctor.photo} 
              alt="Doctor" 
              className="rounded-circle"
              style={{ width: '40px', height: '40px' }}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="bi bi-person-fill"></i>
            </div>
          )}
        </div>
        <div>
          <p className="mb-0">Dr. {doctor.nom} {doctor.prenom}</p>
        </div>
      </div>
    </td>
    <td>
      <Badge bg="primary">{doctor.specialite}</Badge>
    </td>
    <td>
      <div className="d-flex flex-wrap gap-1">
        {patientData.joursDisponibles?.map(jour => (
          <Badge key={jour} bg="info" className="badge-responsive">{jour}</Badge>
        ))}
      </div>
    </td>
    <td>
      <div className="d-flex align-items-center">
        <FaClock className="text-primary me-2" />
        <small>
          {patientData.appointmentSettings?.heureDebut} - 
          {patientData.appointmentSettings?.heureFin}
          <br/>
          Durée: {patientData.appointmentSettings?.consultationDuration} min
        </small>
      </div>
    </td>
    <td>
      <div className="contact-item">
        <FaPhone className="text-primary me-2" />
        <small>{doctor.telephone}</small>
      </div>
      <div className="contact-item">
        <FaEnvelope className="text-primary me-2" />
        <small>{doctor.email}</small>
      </div>
    </td>
    <td>
      {!permanentConfirmations[doctor.id] ? (
       <Button
       variant="success"
       className="btn-responsive"
       onClick={async () => {
         try {
           await updateDoc(doc(db, 'medecins', doctor.id), {
             isConfirmed: true,
             confirmedAt: new Date().toISOString(),
             isPermanentlyConfirmed: true
           });
           const newPermanentConfirmations = {
             ...permanentConfirmations,
             [doctor.id]: true
           };
           setPermanentConfirmations(newPermanentConfirmations);
           localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
           setMessage('Consultation confirmée définitivement');
         } catch (error) {
           setMessage('Erreur lors de la confirmation');
         }
       }}
     >
       <i className="fas fa-check-circle me-2"></i>
       Confirmer définitivement
     </Button>
      ) : (
        <ButtonGroup size="sm">
          <Button
          variant="info"
          className="btn-responsive w-100 mb-2"
          onClick={() => {
            setSelectedQRData(qrData);
            setShowQRModal(true);
          }}
        >
          <i className="fas fa-qr-code me-2"></i>
          Voir Code QR
        </Button>
      
          <Button
            variant="outline-primary"
            className="btn-responsive"
            onClick={() => {
              setSelectedDoctor(doctor);
              setShowConsultationModal(true);
            }}
          >
            <i className="fas fa-calendar-plus me-2"></i>
            Nouvelle consultation
          </Button>
          <Button
            variant="outline-danger"
            className="btn-responsive"
            onClick={async () => {
              if (window.confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) {
                try {
                  const newPermanentConfirmations = { ...permanentConfirmations };
                  delete newPermanentConfirmations[doctor.id];
                  setPermanentConfirmations(newPermanentConfirmations);
                  localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                  
                  await updateDoc(doc(db, 'medecins', doctor.id), {
                    isConfirmed: false,
                    confirmedAt: null,
                    isPermanentlyConfirmed: false
                  });
                  setMessage('Consultation annulée avec succès');
                } catch (error) {
                  setMessage('Erreur lors de l\'annulation: ' + error.message);
                }
              }
            }}
          >
            <i className="fas fa-times-circle me-2"></i>
            Annuler consultation
          </Button>
        </ButtonGroup>
      )}
    </td>
  </tr>
  );
})}

                  
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

       {/* QR Code Modal */}
       <Modal 
       show={showQRModal} 
       onHide={() => setShowQRModal(false)}
       size="lg"
       centered
     >
       <Modal.Header closeButton className="bg-primary text-white">
         <Modal.Title>
           <i className="fas fa-qr-code me-2"></i>
           Code QR de consultation
         </Modal.Title>
       </Modal.Header>
       <Modal.Body className="text-center p-4">
         {selectedQRData && (
           <>
             <QRCode
               value={selectedQRData}
               size={400}
               bgColor="#FFFFFF"
               fgColor="#000000"
               level="H"
               style={{
                 width: "100%",
                 maxWidth: "400px",
                 height: "auto",
                 padding: "20px"
               }}
             />
             <Button
               variant="primary"
               className="mt-4"
               onClick={() => {
                 const printWindow = window.open('', '', 'width=600,height=600');
                 printWindow.document.write(`
                   <html>
                     <head>
                       <title>Code QR Consultation</title>
                       <style>
                         body {
                           display: flex;
                           flex-direction: column;
                           align-items: center;
                           justify-content: center;
                           height: 100vh;
                           margin: 0;
                           font-family: Arial, sans-serif;
                         }
                         .qr-container {
                           text-align: center;
                           padding: 20px;
                         }
                       </style>
                     </head>
                     <body>
                       <div class="qr-container">
                         ${document.querySelector('.modal-body').innerHTML}
                       </div>
                     </body>
                   </html>
                 `);
                 printWindow.document.close();
                 printWindow.focus();
                 printWindow.print();
               }}
             >
               <i className="fas fa-print me-2"></i>
               Imprimer le Code QR
             </Button>
           </>
         )}
       </Modal.Body>
     </Modal>

     <style jsx>{`
       /* Your existing styles plus: */
       .modal-content {
         border-radius: 1rem;
         border: none;
         box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
       }
       .modal-header {
         border-top-left-radius: 1rem;
         border-top-right-radius: 1rem;
       }
       .modal-body {
         display: flex;
         flex-direction: column;
         align-items: center;
       }
       @media (max-width: 576px) {
         .modal-body {
           padding: 1rem;
         }
       }

       .table-responsive {
  overflow-x: auto;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.table td {
  vertical-align: middle;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
}

     `}</style>
     
      </Col>
    </Row>
  )}
{/* Assigned Doctors Section */}
{(activeTab === 'all' || activeTab === 'assigned') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" />
            Médecins Assignés
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'info'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'info'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          {viewMode === 'grid' ? (
            // Grid View
            <Row xs={1} md={2} lg={3} className="g-4">
              {assignedDoctorsList.map(doctor => (
<Col key={doctor.id}>
<Card className="h-100 hover-lift">
<Card.Body>
<div className="d-flex align-items-center mb-3">
{doctor.photo ? (
<img
src={doctor.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '64px', height: '64px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '64px', height: '64px' }}>
<FaUserMd size={30} className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
<Badge bg="info">{doctor.specialite}</Badge>
</div>
</div>


<div className="mb-3">
<h6 className="text-muted mb-2">Disponibilités:</h6>
<div className="d-flex flex-wrap gap-2">
{doctor.disponibilite?.map(jour => (
<Badge key={jour} bg="light" text="dark" className="border">
{jour}
</Badge>
))}
</div>
</div>


<div className="contact-info">
<div className="mb-2">
<FaPhone className="me-2 text-primary" />
{doctor.telephone}
</div>
<div className="mb-2">
<FaEnvelope className="me-2 text-primary" />
{doctor.email}
</div>
<div>
<FaClock className="me-2 text-primary" />
{doctor.heureDebut} - {doctor.heureFin}
</div>
</div>


<div className="mt-3 d-grid gap-2">
<ButtonGroup>
<Button variant="outline-primary" size="sm" onClick={() => window.location.href = `mailto:${doctor.email}`}>
<FaEnvelope className="me-1" />
Email
</Button>
<Button variant="outline-success" size="sm" onClick={() => window.location.href = `tel:${doctor.telephone}`}>
<FaPhone className="me-1" />
Appeler
</Button>
</ButtonGroup>
</div>
</Card.Body>
</Card>
</Col>
))}
            </Row>
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Nom</th>
                    <th>Spécialité</th>
                    <th>Disponibilités</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedDoctorsList.map(doctor => (
                    <tr key={doctor.id}>
                      <td style={{ width: '80px' }}>
                        {doctor.photo ? (
                          <img
                            src={doctor.photo}
                            alt="Doctor"
                            className="rounded-circle"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '50px', height: '50px' }}>
                            <FaUserMd size={25} className="text-primary" />
                          </div>
                        )}
                      </td>
                      <td>Dr. {doctor.nom} {doctor.prenom}</td>
                      <td><Badge bg="info">{doctor.specialite}</Badge></td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {doctor.disponibilite?.map(jour => (
                            <Badge key={jour} bg="light" text="dark" className="border">
                              {jour}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div>{doctor.telephone}</div>
                        <div>{doctor.email}</div>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button variant="outline-primary" onClick={() => window.location.href = `mailto:${doctor.email}`}>
                            <FaEnvelope className="me-1" />
                            Email
                          </Button>
                          <Button variant="outline-success" onClick={() => window.location.href = `tel:${doctor.telephone}`}>
                            <FaPhone className="me-1" />
                            Appeler
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {assignedDoctorsList.length === 0 && (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Aucun médecin assigné pour le moment
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Accepted Doctors Section */}
{(activeTab === 'all' || activeTab === 'accepted') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-check-circle me-2"></i>
            Demandes de consultation acceptées
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'success'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'success'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          {viewMode === 'grid' ? (
            // Grid View
          <Row xs={1} md={2} lg={3} className="g-4">
            {acceptedConsultations.map(consultation => {
              const qrData = `
                CONFIRMATION DE CONSULTATION
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}

                INFORMATIONS MÉDECIN
                Médecin: Dr. ${consultation.doctorInfo.nom} ${consultation.doctorInfo.prenom}
                Spécialité: ${consultation.doctorInfo.specialite}
                CONSULTATION
                Jour: ${consultation.preferredDay}
                Horaires: ${consultation.preferredTimeStart} - ${consultation.preferredTimeEnd}
                Motif: ${consultation.reason}
                Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
                Généré le: ${new Date().toLocaleString()}
              `;

              return (
                <Col key={consultation.id}>
                  <Card className="h-100">
                    <Card.Body>
                      {/* Doctor Info Section */}
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
                          style={{ width: '64px', height: '64px' }}>
                          <FaUserMd size={30} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-1">Dr. {consultation.doctorInfo.nom} {consultation.doctorInfo.prenom}</h6>
                          <Badge bg="success">{consultation.doctorInfo.specialite}</Badge>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="mb-3">
                        <h6 className="text-muted mb-2">Détails du rendez-vous:</h6>
                        <p className="mb-1">
                          <FaCalendarAlt className="me-2 text-success" />
                          Jour: {consultation.preferredDay}
                        </p>
                        <p className="mb-1">
                          <FaClock className="me-2 text-success" />
                          De: {consultation.preferredTimeStart} À: {consultation.preferredTimeEnd}
                        </p>
                      </div>

                      {/* Reason Section */}
                      <div className="mb-3">
                        <h6 className="text-muted mb-2">Motif:</h6>
                        <p className="mb-0">{consultation.reason}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-grid gap-2">
                        {!confirmedDoctors[consultation.id] ? (
                          <Button
                            variant="success"
                            onClick={() => {
                              const newConfirmedDoctors = {
                                ...confirmedDoctors,
                                [consultation.id]: true
                              };
                              setConfirmedDoctors(newConfirmedDoctors);
                              localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                              setMessage('Consultation confirmée');
                            }}
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            Confirmer la consultation
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => setShowQRModal(consultation.id)}
                          >
                            <i className="fas fa-qrcode me-2"></i>
                            Voir QR Code
                          </Button>
                        )}
                        
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?')) {
                              try {
                                await deleteDoc(doc(db, 'consultationRequests', consultation.id));
                                const newConfirmedDoctors = { ...confirmedDoctors };
                                delete newConfirmedDoctors[consultation.id];
                                setConfirmedDoctors(newConfirmedDoctors);
                                localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                setMessage('Consultation supprimée avec succès');
                              } catch (error) {
                                setMessage('Erreur lors de la suppression: ' + error.message);
                              }
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt me-2"></i>
                          Supprimer définitivement
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* QR Code Modal */}
                  <Modal
                    show={showQRModal === consultation.id}
                    onHide={() => setShowQRModal(null)}
                    size="lg"
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>QR Code - Consultation</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                      <QRCode
                        value={qrData}
                        size={400}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="H"
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          padding: "20px"
                        }}
                      />
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowQRModal(null)}>
                        Fermer
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          window.print();
                        }}
                      >
                        <i className="fas fa-print me-2"></i>
                        Imprimer
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </Col>
              );
            })}

            {acceptedConsultations.length === 0 && (
              <Col xs={12}>
                <Alert variant="info">
                  <i className="fas fa-info-circle me-2"></i>
                  Aucune demande de consultation acceptée
                </Alert>
              </Col>
            )}
          </Row>
       
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Médecin</th>
                    <th>Date</th>
                    <th>Horaires</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedConsultations.map(consultation => (
                    <tr key={consultation.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-success bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}>
                            <FaUserMd size={20} className="text-success" />
                          </div>
                          <div>
                            <div>Dr. {consultation.doctorInfo.nom} {consultation.doctorInfo.prenom}</div>
                            <Badge bg="success">{consultation.doctorInfo.specialite}</Badge>
                          </div>
                        </div>
                      </td>
                      <td>{consultation.preferredDay}</td>
                      <td>{consultation.preferredTimeStart} - {consultation.preferredTimeEnd}</td>
                      <td>{consultation.reason}</td>
                      <td>
                        {confirmedDoctors[consultation.id] ? (
                          <Badge bg="success">Confirmée</Badge>
                        ) : (
                          <Badge bg="warning">En attente</Badge>
                        )}
                      </td>
                      <td>
                        <ButtonGroup>
                          {!confirmedDoctors[consultation.id] ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                const newConfirmedDoctors = {
                                  ...confirmedDoctors,
                                  [consultation.id]: true
                                };
                                setConfirmedDoctors(newConfirmedDoctors);
                                localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                setMessage('Consultation confirmée');
                              }}
                            >
                              <i className="fas fa-check-circle"></i>
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowQRModal(consultation.id)}
                            >
                              <i className="fas fa-qrcode"></i>
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?')) {
                                try {
                                  await deleteDoc(doc(db, 'consultationRequests', consultation.id));
                                  const newConfirmedDoctors = { ...confirmedDoctors };
                                  delete newConfirmedDoctors[consultation.id];
                                  setConfirmedDoctors(newConfirmedDoctors);
                                  localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                  setMessage('Consultation supprimée avec succès');
                                } catch (error) {
                                  setMessage('Erreur lors de la suppression: ' + error.message);
                                }
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
{/* Global QR Code Modal - Place this outside the mapping functions */}
{acceptedConsultations.map(consultation => {
  const qrData = `
    CONFIRMATION DE CONSULTATION
    INFORMATIONS PATIENT
    Nom: ${patientData.nom}
    Prénom: ${patientData.prenom}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}

    INFORMATIONS MÉDECIN
    Médecin: Dr. ${consultation.doctorInfo.nom} ${consultation.doctorInfo.prenom}
    Spécialité: ${consultation.doctorInfo.specialite}
    CONSULTATION
    Jour: ${consultation.preferredDay}
    Horaires: ${consultation.preferredTimeStart} - ${consultation.preferredTimeEnd}
    Motif: ${consultation.reason}
    Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
    Généré le: ${new Date().toLocaleString()}
  `;

  return (
   <Modal
      key={consultation.id}
      show={showQRModal === consultation.id}
      onHide={() => setShowQRModal(null)}
      size="lg"
      centered
    >
   <Modal.Header closeButton>
     <Modal.Title>QR Code - Consultation</Modal.Title>
   </Modal.Header>
   <Modal.Body className="text-center">
     <QRCode
       value={qrData}
       size={400}
       bgColor="#FFFFFF"
       fgColor="#000000"
       level="H"
       style={{
         width: "100%",
         maxWidth: "400px",
         padding: "20px"
       }}
     />
   </Modal.Body>
   <Modal.Footer>
     <Button variant="secondary" onClick={() => setShowQRModal(null)}>
       Fermer
     </Button>
     <Button
       variant="primary"
       onClick={() => {
         window.print();
       }}
     >
       <i className="fas fa-print me-2"></i>
       Imprimer
     </Button>
   </Modal.Footer>
 </Modal>
  );
})}

          {acceptedConsultations.length === 0 && (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Aucune demande de consultation acceptée
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Assigned Doctor and Current Appointment Section */}
{(activeTab === 'all' || activeTab === 'current') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" />
            Mon Médecin Assigné et Rendez-vous Actuel
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'primary'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'primary'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body className="p-0">
          {viewMode === 'grid' ? (
            // Grid View
            <div className="p-3">
              {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => (
                <Row key={appointment.id} className="g-4 mb-4">
                   <Col md={6}>
<Card className="h-100 border-0 bg-light">
<Card.Body>
<h5 className="text-primary mb-4">Information du Médecin</h5>
{appointment.doctorInfo && (
<>
<div className="d-flex align-items-center mb-4">
{appointment.doctorInfo.photo ? (
<img
src={appointment.doctorInfo.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '64px', height: '64px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '64px', height: '64px' }}>
<FaUserMd size={30} className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {appointment.doctorInfo.nom} {appointment.doctorInfo.prenom}</h6>
<Badge bg="primary">{appointment.doctorInfo.specialite}</Badge>
</div>
</div>
<div className="contact-info">
<p className="mb-2">
<FaPhone className="me-2 text-primary" />
{appointment.doctorInfo.telephone}
</p>
<p className="mb-2">
<FaEnvelope className="me-2 text-primary" />
{appointment.doctorInfo.email}
</p>
<p className="mb-0">
<FaClock className="me-2 text-primary" />
{appointment.doctorInfo.heureDebut} - {appointment.doctorInfo.heureFin}
</p>
</div>
</>
)}
</Card.Body>
</Card>
</Col>
<Col md={6}>
<Card className="h-100 border-0 bg-light">
<Card.Body>
<h5 className="text-primary mb-4">Rendez-vous Actuel</h5>
<div className="appointment-info">
<p className="mb-1">
<FaCalendarAlt className="me-2 text-primary" />
<strong>Date:</strong> {appointment.day}
</p>
<p className="mb-1">
<FaClock className="me-2 text-primary" />
<strong>Heure:</strong> {appointment.timeSlot}
</p>
<Badge bg="success" className="px-3 py-2">
<i className="fas fa-check-circle me-2"></i>
Rendez-vous Confirmé
</Badge>

</div>
<Button
   variant="primary"
  size="lg"
    className=" mt-3"
    onClick={() => setShowQRModal(appointment.id)}
   >
  <FaQrcode className="me-1" />
     Voir le Code QR
   </Button>
</Card.Body>
</Card>
</Col>

                </Row>
              ))}
            </div>
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Médecin</th>
                    <th>Spécialité</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {appointment.doctorInfo.photo ? (
                            <img
                              src={appointment.doctorInfo.photo}
                              alt="Doctor"
                              className="rounded-circle me-2"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div className="rounded-circle bg-primary bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}>
                              <FaUserMd size={20} className="text-primary" />
                            </div>
                          )}
                          <div>Dr. {appointment.doctorInfo.nom} {appointment.doctorInfo.prenom}</div>
                        </div>
                      </td>
                      <td><Badge bg="primary">{appointment.doctorInfo.specialite}</Badge></td>
                      <td>{appointment.day}</td>
                      <td>{appointment.timeSlot}</td>
                      <td>
                        <small className="d-block">{appointment.doctorInfo.telephone}</small>
                        <small className="d-block">{appointment.doctorInfo.email}</small>
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowQRModal(appointment.id)}
                        >
                          <FaQrcode className="me-1" />
                          QR Code
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

{appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => {
            const qrData = `
              CONFIRMATION DE RENDEZ-VOUS
              PATIENT
              Nom: ${patientData.nom}
              Prénom: ${patientData.prenom}
              ID: ${patientData.id}
              Tel: ${patientData.telephone}
              MÉDECIN
              Dr. ${appointment.doctorInfo.nom} ${appointment.doctorInfo.prenom}
              Spécialité: ${appointment.doctorInfo.specialite}
              RENDEZ-VOUS
              Date: ${appointment.day}
              Heure: ${appointment.timeSlot}
              Status: ${appointment.status}
              ID RDV: ${appointment.id}
              Généré le: ${new Date().toLocaleString()}
            `;

            return (
              <Row key={appointment.id} className="g-4">
                



                {/* QR Code Modal */}
                <Modal
                  show={showQRModal === appointment.id}
                  onHide={() => setShowQRModal(null)}
                  size="lg"
                  centered
                >
                  <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                      <FaQrcode className="me-2" />
                      Code QR - Rendez-vous avec Dr. {appointment.doctorInfo.nom}
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                      <QRCode
                        value={qrData}
                        size={400}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="H"
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          padding: "20px"
                        }}
                      />
                    </div>
                    <div className="text-muted">
                      <small>Scannez ce code QR pour accéder aux détails de votre rendez-vous</small>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowQRModal(null)}>
                      <FaTimes className="me-2" />
                      Fermer
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        window.print();
                      }}
                    >
                      <FaPrint className="me-2" />
                      Imprimer
                    </Button>
                    <Button 
                      variant="success"
                      onClick={() => {
                        const qrImage = document.querySelector('canvas');
                        if (qrImage) {
                          const link = document.createElement('a');
                          link.download = `rdv-qr-${appointment.id}.png`;
                          link.href = qrImage.toDataURL();
                          link.click();
                        }
                      }}
                    >
                      <FaDownload className="me-2" />
                      Télécharger
                    </Button>
                  </Modal.Footer>
                </Modal>
              </Row>
            );
          })}          
          {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').length === 0 && (
            <Alert variant="info" className="m-3">
              <i className="fas fa-info-circle me-2"></i>
              Aucun rendez-vous actif pour le moment
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Details patient Section */}
<Modal
show={showPatientDetailsModal}
onHide={() => setShowPatientDetailsModal(false)}
size="lg"
>
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
<FaUser className="me-2" />
Détails du Patient
</Modal.Title>
</Modal.Header>
<Modal.Body>
{selectedPatientDetails && (
<div>
<Row>
<Col md={4} className="text-center mb-4">
{selectedPatientDetails.photo ? (
<img
src={selectedPatientDetails.photo}
alt="Patient"
className="rounded-circle mb-3"
style={{ width: '150px', height: '150px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 mb-3 mx-auto d-flex align-items-center justify-content-center"
style={{ width: '150px', height: '150px' }}>
<span className="h1 mb-0">{selectedPatientDetails.nom?.[0]}{selectedPatientDetails.prenom?.[0]}</span>
</div>
)}
<h4>{selectedPatientDetails.nom} {selectedPatientDetails.prenom}</h4>
<Badge bg="primary">{selectedPatientDetails.status || 'Actif'}</Badge>
</Col>
<Col md={8}>
<Card className="mb-3">
<Card.Body>
<h5 className="mb-3">Informations personnelles</h5>
<Row className="mb-2">
<Col sm={4} className="text-muted">Âge:</Col>
<Col sm={8}>{selectedPatientDetails.age} ans</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Sexe:</Col>
<Col sm={8}>{selectedPatientDetails.sexe}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Email:</Col>
<Col sm={8}>{selectedPatientDetails.email}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Téléphone:</Col>
<Col sm={8}>{selectedPatientDetails.telephone}</Col>
</Row>
</Card.Body>
</Card>

{structureDetails && (
<Card className="mb-3">
<Card.Body>
<h5 className="mb-3">Structure d'affectation</h5>
<Row className="mb-2">
<Col sm={4} className="text-muted">Nom:</Col>
<Col sm={8}>{structureDetails.name}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Adresse:</Col>
<Col sm={8}>{structureDetails.address}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Contact:</Col>
<Col sm={8}>{structureDetails.phones?.mobile}</Col>
</Row>
</Card.Body>
</Card>
)}


{assignedDoctorsDetails.length > 0 && (
<Card>
<Card.Body>
<h5 className="mb-3">Médecins assignés</h5>
{assignedDoctorsDetails.map(doctor => (
<div key={doctor.id} className="mb-3 p-3 border rounded">
<div className="d-flex align-items-center">
{doctor.photo ? (
<img
src={doctor.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '50px', height: '50px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '50px', height: '50px' }}>
<FaUserMd className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
<Badge bg="info">{doctor.specialite}</Badge>
</div>
</div>
<div className="mt-2">
<small className="text-muted d-block">
<FaEnvelope className="me-2" />
{doctor.email}
</small>
<small className="text-muted d-block">
<FaPhone className="me-2" />
{doctor.telephone}
</small>
</div>
</div>
))}
</Card.Body>
</Card>
)}
</Col>
</Row>
</div>
)}
</Modal.Body>
</Modal>

<Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)} size="lg">
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
<i className="fas fa-calendar-plus me-2"></i>
Demande de consultation
</Modal.Title>
</Modal.Header>
<Modal.Body>
<Form>
<Form.Group className="mb-3">
<Form.Label>Sélectionner un médecin</Form.Label>
<Form.Select
onChange={(e) => {
const doctor = availableDoctors.find(d => d.id === e.target.value);
setSelectedDoctor(doctor);
}}
>
<option value="">Choisir un médecin...</option>
{availableDoctors.map(doctor => (
<option key={doctor.id} value={doctor.id}>
Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
</option>
))}
</Form.Select>
</Form.Group>

{selectedDoctor && (
<>
<Form.Group className="mb-3">
<Form.Label>Jour souhaité</Form.Label>
<Form.Select onChange={(e) => setSelectedDay(e.target.value)}>
<option value="">Choisir un jour...</option>
{selectedDoctor.disponibilite?.map(jour => (
<option key={jour} value={jour}>{jour}</option>
))}
</Form.Select>
</Form.Group>

<Row>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>Heure de début</Form.Label>
<Form.Control
type="time"
min={selectedDoctor.heureDebut}
max={selectedDoctor.heureFin}
onChange={(e) => setSelectedTimeSlot(e.target.value)}
/>
<Form.Text className="text-muted">
Disponible de {selectedDoctor.heureDebut} à {selectedDoctor.heureFin}
</Form.Text>
</Form.Group>
</Col>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>Heure de fin</Form.Label>
<Form.Control
type="time"
min={selectedTimeSlot || selectedDoctor.heureDebut}
max={selectedDoctor.heureFin}
onChange={(e) => setSelectedEndTime(e.target.value)}
/>
</Form.Group>
</Col>
</Row>

<Form.Group className="mb-3">
<Form.Label>Motif de consultation</Form.Label>
<Form.Control
as="textarea"
rows={3}
placeholder="Décrivez brièvement le motif de votre consultation..."
onChange={(e) => setConsultationReason(e.target.value)}
/>
</Form.Group>
</>
)}
</Form>
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowConsultationModal(false)}>
<i className="fas fa-times me-2"></i>
Annuler
</Button>
<Button
variant="primary"
onClick={handleConsultationRequest}
disabled={!selectedDoctor || !selectedDay || !selectedTimeSlot}
>
<i className="fas fa-paper-plane me-2"></i>
Envoyer la demande
</Button>
</Modal.Footer>
</Modal>
</Container>
);
};
export default PatientsDashboard































  

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, ButtonGroup,Table,ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db,auth,storage } from '../components/firebase-config.js';
import {QRCode} from "react-qr-code";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, serverTimestamp,query, where, getDocs, addDoc, onSnapshot,doc, getDoc , updateDoc, arrayUnion,deleteDoc} from 'firebase/firestore';
import {FaPaperPlane,FaFile, FaComment, FaTrash, FaEdit ,FaQrcode, FaTimes, FaPrint, FaDownload,FaUser, FaUserMd, FaCalendarAlt, FaClock, FaEnvelope, FaPhone, FaSignOutAlt ,FaThLarge, FaList} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import './PatientDashboard.css';

const PatientsDashboard = () => {
const navigate = useNavigate();
const [assignedDoctors, setAssignedDoctors] = useState([]);
const patientData = JSON.parse(localStorage.getItem('patientData'));
const [docRequests, setDocRequests] = useState([]);
const [selectedRequest, setSelectedRequest] = useState(null);
const [createdByDoctors, setCreatedByDoctors] = useState([]);
const [availableDoctors, setAvailableDoctors] = useState([]);
const [appointments, setAppointments] = useState([]);
const [showConsultationModal, setShowConsultationModal] = useState(false);
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
const [selectedDay, setSelectedDay] = useState('');
const [message, setMessage] = useState('');
const [confirmedDoctors, setConfirmedDoctors] = useState(() => {
const saved = localStorage.getItem('confirmedDoctors');
return saved ? JSON.parse(saved) : {};
});
const [permanentConfirmations, setPermanentConfirmations] = useState(() => {
const saved = localStorage.getItem('permanentConfirmations');
return saved ? JSON.parse(saved) : {};
});
const [activeTab, setActiveTab] = useState('accepted'); // Default tab is 'accepted'
const [isFlipped, setIsFlipped] = useState(false);
const [viewMode, setViewMode] = useState('grid');
const [selectedEndTime, setSelectedEndTime] = useState('');
const [consultationReason, setConsultationReason] = useState('');
const [assignedDoctorsList, setAssignedDoctorsList] = useState([]);


useEffect(() => {
const fetchAssignedDoctors = async () => {
if (!patientData?.id) return;
try {
const patientRef = doc(db, 'patients', patientData.id);
const patientDoc = await getDoc(patientRef);
if (patientDoc.exists()) {
const patientInfo = patientDoc.data();
const medecinIds = [];
if (patientInfo.medecinId) {
medecinIds.push(patientInfo.medecinId);
}
if (patientInfo.medecins && Array.isArray(patientInfo.medecins)) {
medecinIds.push(...patientInfo.medecins);
}
const doctorsData = await Promise.all(
medecinIds.map(async (medecinId) => {
const doctorRef = doc(db, 'medecins', medecinId);
const doctorDoc = await getDoc(doctorRef);
if (doctorDoc.exists()) {
return {
id: doctorDoc.id,
...doctorDoc.data()
};
}
return null;
})
);
setAssignedDoctorsList(doctorsData.filter(Boolean));
}
} catch (error) {
console.error('Erreur lors de la récupération des médecins:', error);
}
};

fetchAssignedDoctors();
const unsubscribe = onSnapshot(
doc(db, 'patients', patientData.id),
() => {
fetchAssignedDoctors();
}
);


return () => unsubscribe();
}, [patientData?.id]);

const [qrRefreshKey, setQrRefreshKey] = useState(Date.now());
const [selectedDoctors, setSelectedDoctors] = useState([]);
const [selectedDays, setSelectedDays] = useState({});
const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
const [showProfileModal, setShowProfileModal] = useState(false);
const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
const [assignedDoctorsDetails, setAssignedDoctorsDetails] = useState([]);
const [structureDetails, setStructureDetails] = useState(null);
const [showQRModal, setShowQRModal] = useState(false);
const [selectedQRData, setSelectedQRData] = useState(null);
const [selectedFile, setSelectedFile] = useState(null);
const [editContent, setEditContent] = useState('');
const fetchPatientDetails = async (patientId) => {
try {
const patientRef = doc(db, 'patients', patientId);
const patientDoc = await getDoc(patientRef);
const patientData = patientDoc.data();

const assignedDocs = [];
if (patientData.medecins && patientData.medecins.length > 0) {
for (const medecinId of patientData.medecins) {
const medecinRef = doc(db, 'medecins', medecinId);
const medecinDoc = await getDoc(medecinRef);
if (medecinDoc.exists()) {
assignedDocs.push({
id: medecinDoc.id,
...medecinDoc.data()
});
}
}
}

let structureData = null;
if (patientData.structureId) {
const structureRef = doc(db, 'structures', patientData.structureId);
const structureDoc = await getDoc(structureRef);
if (structureDoc.exists()) {
structureData = {
id: structureDoc.id,
...structureDoc.data()
};
}
}


setSelectedPatientDetails(patientData);
setAssignedDoctorsDetails(assignedDocs);
setStructureDetails(structureData);
setShowPatientDetailsModal(true);
} catch (error) {
setMessage('Erreur lors du chargement des détails');
}
};


useEffect(() => {
const fetchDoctorAvailability = async () => {
const doctorsRef = collection(db, 'medecins');
const snapshot = await getDocs(doctorsRef);
const doctorsData = snapshot.docs.map(doc => ({
id: doc.id,
...doc.data(),
joursDisponibles: doc.data().disponibilite || []
}));
setAvailableDoctors(doctorsData);
};
fetchDoctorAvailability();
}, []);
useEffect(() => {
if (patientData?.id) {
fetchCreatedByDoctors();
fetchAvailableDoctors();
fetchAppointments();
}
}, [patientData?.id]);


const fetchCreatedByDoctors = async () => {
try {
const patientRef = doc(db, 'patients', patientData.id);
const patientDoc = await getDoc(patientRef);
if (patientDoc.exists() && patientDoc.data().createdBy) {
const doctorRef = doc(db, 'medecins', patientDoc.data().createdBy);
const doctorDoc = await getDoc(doctorRef);
if (doctorDoc.exists()) {
setCreatedByDoctors([{
id: doctorDoc.id,
...doctorDoc.data()
}]);
}
}
} catch (error) {
console.error('Error fetching doctor data:', error);
setMessage('Erreur lors du chargement des données du médecin');
}
};


const fetchAvailableDoctors = async () => {
const doctorsQuery = query(collection(db, 'medecins'));
const snapshot = await getDocs(doctorsQuery);
setAvailableDoctors(snapshot.docs.map(doc => ({
id: doc.id,
...doc.data()
})));
};


const fetchAppointments = () => {
const appointmentsQuery = query(
collection(db, 'appointments'),
where('patientId', '==', patientData.id)
);
const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
const appointmentsData = await Promise.all(
snapshot.docs.map(async (docSnapshot) => { // Change 'doc' to 'docSnapshot'
const appointmentData = docSnapshot.data();
const doctorRef = doc(db, 'medecins', appointmentData.doctorId);
const doctorDoc = await getDoc(doctorRef);
return {
id: docSnapshot.id,
...appointmentData,
doctorInfo: doctorDoc.exists() ? doctorDoc.data() : null
};
})
);
setAppointments(appointmentsData);
});
return unsubscribe;
};



const handleConsultationRequest = async () => {
try {
if (!selectedDoctor || !selectedDay || !selectedTimeSlot || !selectedEndTime) {
setMessage('Veuillez remplir tous les champs');
return;
}
const consultationRequest = {
patientId: patientData.id,
doctorId: selectedDoctor.id,
patientInfo: patientData,
doctorInfo: {
nom: selectedDoctor.nom,
prenom: selectedDoctor.prenom,
specialite: selectedDoctor.specialite
},
requestDate: new Date().toISOString(),
status: 'pending',
preferredDay: selectedDay,
preferredTimeStart: selectedTimeSlot,
preferredTimeEnd: selectedEndTime,
reason: consultationReason
};
await addDoc(collection(db, 'consultationRequests'), consultationRequest);
setMessage('Demande de consultation envoyée avec succès');
setShowConsultationModal(false);
resetForm();
} catch (error) {
setMessage('Erreur lors de l\'envoi de la demande');
console.error(error);
}
};
const resetForm = () => {
setSelectedDoctor(null);
setSelectedDay('');
setSelectedTimeSlot('');
setSelectedEndTime('');
setConsultationReason('');
};

useEffect(() => {
const interval = setInterval(() => {
setQrRefreshKey(Date.now());
}, 24*60*60*1000); // Rafraîchit toutes les 24h
return () => clearInterval(interval);
}, []);


const generateTimeSlots = (startTime, endTime, duration) => {
const slots = [];
let currentTime = new Date(`2000/01/01 ${startTime}`);
const endDateTime = new Date(`2000/01/01 ${endTime}`);
while (currentTime < endDateTime) {
slots.push(currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
currentTime.setMinutes(currentTime.getMinutes() + duration);
}
return slots;
};

const [acceptedConsultations, setAcceptedConsultations] = useState([]);
// Add this useEffect to fetch accepted consultations
useEffect(() => {
if (patientData?.id) {
const unsubscribe = onSnapshot(
query(
collection(db, 'consultationRequests'),
where('patientId', '==', patientData.id),
where('status', '==', 'accepted')
),
async (snapshot) => {
const consultationsData = await Promise.all(
snapshot.docs.map(async (doc) => {
const data = doc.data();
return {
id: doc.id,
...data,
acceptedAt: data.acceptedAt
};
})
);
setAcceptedConsultations(consultationsData);
}
);
return () => unsubscribe();
}
}, [patientData?.id]);

const [documentRequests, setDocumentRequests] = useState([]);
const [showDocumentRequestModal, setShowDocumentRequestModal] = useState(false);
const [selectedDocuments, setSelectedDocuments] = useState([]);
const [sharedDocuments, setSharedDocuments] = useState([]);


useEffect(() => {
  if (patientData?.id) {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'documentRequests'),
        where('patientId', '==', patientData.id)
      ),
      (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocumentRequests(requests);
      }
    );
    return () => unsubscribe();
  }
}, [patientData?.id]);


const handleDocumentRequest = async (requestId, isAccepted) => {
  try {
    if (isAccepted) {
      await updateDoc(doc(db, 'documentRequests', requestId), {
        status: 'accepted',
        respondedAt: new Date().toISOString()
      });
      setShowDocumentRequestModal(true);
    } else {
      await updateDoc(doc(db, 'documentRequests', requestId), {
        status: 'rejected',
        respondedAt: new Date().toISOString()
      });
    }
    setMessage(`Demande ${isAccepted ? 'acceptée' : 'refusée'} avec succès`);
  } catch (error) {
    setMessage('Erreur lors du traitement de la demande');
  }
};

const handleShareDocuments = async (requestId, doctorId) => {
  try {
    const uploadedDocs = await Promise.all(
      selectedDocuments.map(async (file) => {
        const fileRef = ref(storage, `shared-documents/${patientData.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        return {
          name: file.name,
          url: url,
          sharedAt: new Date().toISOString()
        };
      })
    );

    await updateDoc(doc(db, 'patients', patientData.id), {
      sharedDocuments: arrayUnion(...uploadedDocs)
    });

    await updateDoc(doc(db, 'documentRequests', requestId), {
      sharedDocuments: uploadedDocs,
      status: 'completed'
    });

    setShowDocumentRequestModal(false);
    setMessage('Documents partagés avec succès');
  } catch (error) {
    setMessage('Erreur lors du partage des documents');
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
        localStorage.clear();
      navigate('/');
    
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

return (
<Container fluid className="py-4">
{message && (
  <Alert 
    variant={message.includes('succès') ? 'success' : 'danger'}
    onClose={() => setMessage('')} 
    dismissible
    className="mb-3"
  >
    {message}
  </Alert>
)}
<div className="row mb-4">
  <div className="col">
    <div className="card border-0 rounded-4 shadow-lg transition-transform">
      <div className="card-header bg-primary bg-gradient p-1">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Patient Name Section */}
          <div className="patient-info flex-grow-0">
            <div
              onClick={() => fetchPatientDetails(patientData.id)}
              className="text-white position-relative patient-link"
            >
              <h4 className="mb-0 d-flex align-items-center fw-bold fs-responsive">
                <i className="bi bi-person-fill me-2"></i>
                {patientData.nom}
              </h4>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="d-flex gap-2 flex-wrap">
            <button
              onClick={() => setShowConsultationModal(true)}
              className="btn btn-light px-2 py-1 d-flex align-items-center consultation-btn btn-responsive"
            >
              <i className="bi bi-person-vcard-fill me-1"></i>
              <span className="button-text">Consultation</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="button-text">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="nav nav-tabs mt-1 border-0 flex-nowrap overflow-auto">
          <button
            className={`nav-link text-white ${activeTab === 'all' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('all')}
            title='Afficher tous les champs'
          >
            <i className="bi bi-grid-fill me-1"></i>
            <span className="tab-text">Tout</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'creators' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('creators')}
            title='Médecins créateurs'
          >
            <i className="bi bi-people-fill me-1"></i>
            <span className="tab-text">Créateurs</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'assigned' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('assigned')}
            title='Médecins assignés'
          >
            <i className="bi bi-person-badge-fill me-1"></i>
            <span className="tab-text">Assignés</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'accepted' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('accepted')}
            title='Médecins acceptés'
          >
            <i className="bi bi-check-circle-fill me-1"></i>
            <span className="tab-text">Acceptés</span>
          </button>
          <button
            className={`nav-link text-white ${activeTab === 'current' ? 'active bg-info text-primary' : ''}`}
            onClick={() => setActiveTab('current')}
            title='Consultations en cours'
          >
            <i className="bi bi-calendar-check-fill me-1"></i>
            <span className="tab-text">Actuel</span>
          </button>
          <button
    onClick={() => navigate('/PatientMessaging')}
    className="btn btn-info px-2 py-1 d-flex align-items-center messaging-btn btn-responsive"
  >
    <FaEnvelope className="me-1" />
    <span className="button-text">Messagerie</span>
  </button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Created By Doctors Section */}
 {(activeTab === 'all' || activeTab === 'creators') && (
    <Row className="mb-4">
      <Col>
        <Card className="shadow-lg border-0 rounded-4 hover-lift">
          <Card.Header className="bg-success text-white p-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <i className="bi bi-people-fill me-2"></i>
              <span className="fs-responsive">Médecins créateurs</span>
            </h5>
            
            {/* View Toggle Buttons */}
            <ButtonGroup>
              <Button 
                variant={viewMode === 'grid' ? 'light' : 'outline-light'}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid"></i>
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'light' : 'outline-light'}
                onClick={() => setViewMode('table')}
              >
                <i className="bi bi-list"></i>
              </Button>
            </ButtonGroup>
          </Card.Header>

          <Card.Body className="p-3">
            {viewMode === 'grid' ? (
              // Original Grid View
              <Row xs={1} md={2} lg={3} className="g-4">
            {createdByDoctors.map(doctor => {
              const qrData = `
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}
                INFORMATIONS MÉDECIN
                Médecin: Dr. ${doctor.nom} ${doctor.prenom}
                Spécialité: ${doctor.specialite}
                Tel: ${doctor.telephone}
                Email: ${doctor.email}
                CONSULTATIONS
                Jours: ${patientData.joursDisponibles?.join(', ')}
                Horaires: ${patientData.appointmentSettings?.heureDebut} - ${patientData.appointmentSettings?.heureFin}
                Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
                Généré le: ${new Date().toLocaleString()}
                Valide jusqu'au: ${new Date(Date.now() + 24*60*60*1000).toLocaleString()}
              `;

              return (
                <Col key={doctor.id}>
                  <Card className={`h-100 border-0 shadow-sm hover-lift-sm rounded-4 
                    ${confirmedDoctors[doctor.id] ? 'bg-success bg-opacity-5' : ''}`}>
                    <Card.Body className="p-responsive">
                      {/* Doctor Header */}
                      <div className="d-flex align-items-center mb-3">
                        <div className="doctor-avatar me-3">
                          {doctor.photo ? (
                            <img src={doctor.photo} alt="Doctor" className="rounded-circle" />
                          ) : (
                            <div className="avatar-placeholder">
                              <i className="bi bi-person-fill"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="fs-responsive mb-1">Dr. {doctor.nom} {doctor.prenom}</h5>
                          <Badge bg="primary" className="badge-responsive">{doctor.specialite}</Badge>
                        </div>
                      </div>

                      {/* Consultation Days */}
                      <div className="info-section mb-3">
                        <h6 className="text-muted fs-responsive mb-2">
                          <i className="bi bi-calendar-week me-2"></i>
                          Jours de consultation
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {patientData.joursDisponibles?.map(jour => (
                            <Badge key={jour} bg="info" className="badge-responsive">{jour}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="info-section mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-primary me-2" />
                          <span className="fs-responsive">
                            {patientData.appointmentSettings?.heureDebut} - 
                            {patientData.appointmentSettings?.heureFin}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-primary me-2" />
                          <span className="fs-responsive">
                            Durée: {patientData.appointmentSettings?.consultationDuration} min
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="info-section mb-3">
                        <div className="contact-item">
                          <FaPhone className="text-primary me-2" />
                          <span className="fs-responsive">{doctor.telephone}</span>
                        </div>
                        <div className="contact-item">
                          <FaEnvelope className="text-primary me-2" />
                          <span className="fs-responsive">{doctor.email}</span>
                        </div>
                      </div>


                      <div className="d-grid gap-2">
                        {!permanentConfirmations[doctor.id] ? (
                          <Button
                            variant="success"
                            className="btn-responsive"
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'medecins', doctor.id), {
                                  isConfirmed: true,
                                  confirmedAt: new Date().toISOString(),
                                  isPermanentlyConfirmed: true
                                });
                                const newPermanentConfirmations = {
                                  ...permanentConfirmations,
                                  [doctor.id]: true
                                };
                                setPermanentConfirmations(newPermanentConfirmations);
                                localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                                setMessage('Consultation confirmée définitivement');
                              } catch (error) {
                                setMessage('Erreur lors de la confirmation');
                              }
                            }}
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            Confirmer définitivement
                          </Button>
                        ) : (
                          <>
        
                            <Button
                              variant="info"
                              className="btn-responsive w-100 mb-2"
                              onClick={() => {
                                setSelectedQRData(qrData);
                                setShowQRModal(true);
                              }}
                            >
                              <i className="fas fa-qr-code me-2"></i>
                              Voir Code QR
                            </Button>
                          

                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-primary"
                                className="btn-responsive"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setShowConsultationModal(true);
                                }}
                              >
                                <i className="fas fa-calendar-plus me-2"></i>
                                Nouvelle consultation
                              </Button>
                              <Button
                                variant="outline-danger"
                                className="btn-responsive"
                                onClick={async () => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) {
                                    try {
                                      const newPermanentConfirmations = { ...permanentConfirmations };
                                      delete newPermanentConfirmations[doctor.id];
                                      setPermanentConfirmations(newPermanentConfirmations);
                                      localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                                      
                                      await updateDoc(doc(db, 'medecins', doctor.id), {
                                        isConfirmed: false,
                                        confirmedAt: null,
                                        isPermanentlyConfirmed: false
                                      });
                                      setMessage('Consultation annulée avec succès');
                                    } catch (error) {
                                      setMessage('Erreur lors de l\'annulation: ' + error.message);
                                    }
                                  }
                                }}
                              >
                                <i className="fas fa-times-circle me-2"></i>
                                Annuler consultation
                              </Button>
                            </ButtonGroup>
                          </>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
            ) : (
              
              // New Table View
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Médecin</th>
                      <th>Spécialité</th>
                      <th>Jours</th>
                      <th>Horaires</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {createdByDoctors.map(doctor => {
  const qrData = `
    INFORMATIONS PATIENT
    Nom: ${patientData.nom}
    Prénom: ${patientData.prenom}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}
    INFORMATIONS MÉDECIN
    Médecin: Dr. ${doctor.nom} ${doctor.prenom}
    Spécialité: ${doctor.specialite}
    Tel: ${doctor.telephone}
    Email: ${doctor.email}
    CONSULTATIONS
    Jours: ${patientData.joursDisponibles?.join(', ')}
    Horaires: ${patientData.appointmentSettings?.heureDebut} - ${patientData.appointmentSettings?.heureFin}
    Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
    Généré le: ${new Date().toLocaleString()}
    Valide jusqu'au: ${new Date(Date.now() + 24*60*60*1000).toLocaleString()}
  `;

  return (
    <tr key={doctor.id} className={confirmedDoctors[doctor.id] ? 'bg-success bg-opacity-5' : ''}>
    <td>
      <div className="d-flex align-items-center">
        <div className="doctor-avatar me-2">
          {doctor.photo ? (
            <img 
              src={doctor.photo} 
              alt="Doctor" 
              className="rounded-circle"
              style={{ width: '40px', height: '40px' }}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="bi bi-person-fill"></i>
            </div>
          )}
        </div>
        <div>
          <p className="mb-0">Dr. {doctor.nom} {doctor.prenom}</p>
        </div>
      </div>
    </td>
    <td>
      <Badge bg="primary">{doctor.specialite}</Badge>
    </td>
    <td>
      <div className="d-flex flex-wrap gap-1">
        {patientData.joursDisponibles?.map(jour => (
          <Badge key={jour} bg="info" className="badge-responsive">{jour}</Badge>
        ))}
      </div>
    </td>
    <td>
      <div className="d-flex align-items-center">
        <FaClock className="text-primary me-2" />
        <small>
          {patientData.appointmentSettings?.heureDebut} - 
          {patientData.appointmentSettings?.heureFin}
          <br/>
          Durée: {patientData.appointmentSettings?.consultationDuration} min
        </small>
      </div>
    </td>
    <td>
      <div className="contact-item">
        <FaPhone className="text-primary me-2" />
        <small>{doctor.telephone}</small>
      </div>
      <div className="contact-item">
        <FaEnvelope className="text-primary me-2" />
        <small>{doctor.email}</small>
      </div>
    </td>
    <td>
      {!permanentConfirmations[doctor.id] ? (
       <Button
       variant="success"
       className="btn-responsive"
       onClick={async () => {
         try {
           await updateDoc(doc(db, 'medecins', doctor.id), {
             isConfirmed: true,
             confirmedAt: new Date().toISOString(),
             isPermanentlyConfirmed: true
           });
           const newPermanentConfirmations = {
             ...permanentConfirmations,
             [doctor.id]: true
           };
           setPermanentConfirmations(newPermanentConfirmations);
           localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
           setMessage('Consultation confirmée définitivement');
         } catch (error) {
           setMessage('Erreur lors de la confirmation');
         }
       }}
     >
       <i className="fas fa-check-circle me-2"></i>
       Confirmer définitivement
     </Button>
      ) : (
        <ButtonGroup size="sm">
          <Button
          variant="info"
          className="btn-responsive w-100 mb-2"
          onClick={() => {
            setSelectedQRData(qrData);
            setShowQRModal(true);
          }}
        >
          <i className="fas fa-qr-code me-2"></i>
          Voir Code QR
        </Button>
      
          <Button
            variant="outline-primary"
            className="btn-responsive"
            onClick={() => {
              setSelectedDoctor(doctor);
              setShowConsultationModal(true);
            }}
          >
            <i className="fas fa-calendar-plus me-2"></i>
            Nouvelle consultation
          </Button>
          <Button
            variant="outline-danger"
            className="btn-responsive"
            onClick={async () => {
              if (window.confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) {
                try {
                  const newPermanentConfirmations = { ...permanentConfirmations };
                  delete newPermanentConfirmations[doctor.id];
                  setPermanentConfirmations(newPermanentConfirmations);
                  localStorage.setItem('permanentConfirmations', JSON.stringify(newPermanentConfirmations));
                  
                  await updateDoc(doc(db, 'medecins', doctor.id), {
                    isConfirmed: false,
                    confirmedAt: null,
                    isPermanentlyConfirmed: false
                  });
                  setMessage('Consultation annulée avec succès');
                } catch (error) {
                  setMessage('Erreur lors de l\'annulation: ' + error.message);
                }
              }
            }}
          >
            <i className="fas fa-times-circle me-2"></i>
            Annuler consultation
          </Button>
        </ButtonGroup>
      )}
    </td>
  </tr>
  );
})}

                  
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

       {/* QR Code Modal */}
       <Modal 
       show={showQRModal} 
       onHide={() => setShowQRModal(false)}
       size="lg"
       centered
     >
       <Modal.Header closeButton className="bg-primary text-white">
         <Modal.Title>
           <i className="fas fa-qr-code me-2"></i>
           Code QR de consultation
         </Modal.Title>
       </Modal.Header>
       <Modal.Body className="text-center p-4">
         {selectedQRData && (
           <>
             <QRCode
               value={selectedQRData}
               size={400}
               bgColor="#FFFFFF"
               fgColor="#000000"
               level="H"
               style={{
                 width: "100%",
                 maxWidth: "400px",
                 height: "auto",
                 padding: "20px"
               }}
             />
             <Button
               variant="primary"
               className="mt-4"
               onClick={() => {
                 const printWindow = window.open('', '', 'width=600,height=600');
                 printWindow.document.write(`
                   <html>
                     <head>
                       <title>Code QR Consultation</title>
                       <style>
                         body {
                           display: flex;
                           flex-direction: column;
                           align-items: center;
                           justify-content: center;
                           height: 100vh;
                           margin: 0;
                           font-family: Arial, sans-serif;
                         }
                         .qr-container {
                           text-align: center;
                           padding: 20px;
                         }
                       </style>
                     </head>
                     <body>
                       <div class="qr-container">
                         ${document.querySelector('.modal-body').innerHTML}
                       </div>
                     </body>
                   </html>
                 `);
                 printWindow.document.close();
                 printWindow.focus();
                 printWindow.print();
               }}
             >
               <i className="fas fa-print me-2"></i>
               Imprimer le Code QR
             </Button>
           </>
         )}
       </Modal.Body>
     </Modal>

     <style jsx>{`
       /* Your existing styles plus: */
       .modal-content {
         border-radius: 1rem;
         border: none;
         box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
       }
       .modal-header {
         border-top-left-radius: 1rem;
         border-top-right-radius: 1rem;
       }
       .modal-body {
         display: flex;
         flex-direction: column;
         align-items: center;
       }
       @media (max-width: 576px) {
         .modal-body {
           padding: 1rem;
         }
       }

       .table-responsive {
  overflow-x: auto;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.table td {
  vertical-align: middle;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

@media (max-width: 768px) {
  .table-responsive {
    font-size: 0.875rem;
  }
}

     `}</style>
     
      </Col>
    </Row>
  )}
{/* Assigned Doctors Section */}
{(activeTab === 'all' || activeTab === 'assigned') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" />
            Médecins Assignés
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'info'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'info'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          {viewMode === 'grid' ? (
            // Grid View
            <Row xs={1} md={2} lg={3} className="g-4">
              {assignedDoctorsList.map(doctor => (
<Col key={doctor.id}>
<Card className="h-100 hover-lift">
<Card.Body>
<div className="d-flex align-items-center mb-3">
{doctor.photo ? (
<img
src={doctor.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '64px', height: '64px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '64px', height: '64px' }}>
<FaUserMd size={30} className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
<Badge bg="info">{doctor.specialite}</Badge>
</div>
</div>


<div className="mb-3">
<h6 className="text-muted mb-2">Disponibilités:</h6>
<div className="d-flex flex-wrap gap-2">
{doctor.disponibilite?.map(jour => (
<Badge key={jour} bg="light" text="dark" className="border">
{jour}
</Badge>
))}
</div>
</div>


<div className="contact-info">
<div className="mb-2">
<FaPhone className="me-2 text-primary" />
{doctor.telephone}
</div>
<div className="mb-2">
<FaEnvelope className="me-2 text-primary" />
{doctor.email}
</div>
<div>
<FaClock className="me-2 text-primary" />
{doctor.heureDebut} - {doctor.heureFin}
</div>
</div>


<div className="mt-3 d-grid gap-2">
<ButtonGroup>
<Button variant="outline-primary" size="sm" onClick={() => window.location.href = `mailto:${doctor.email}`}>
<FaEnvelope className="me-1" />
Email
</Button>
<Button variant="outline-success" size="sm" onClick={() => window.location.href = `tel:${doctor.telephone}`}>
<FaPhone className="me-1" />
Appeler
</Button>
</ButtonGroup>
</div>
</Card.Body>
</Card>
</Col>
))}
            </Row>
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Nom</th>
                    <th>Spécialité</th>
                    <th>Disponibilités</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedDoctorsList.map(doctor => (
                    <tr key={doctor.id}>
                      <td style={{ width: '80px' }}>
                        {doctor.photo ? (
                          <img
                            src={doctor.photo}
                            alt="Doctor"
                            className="rounded-circle"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '50px', height: '50px' }}>
                            <FaUserMd size={25} className="text-primary" />
                          </div>
                        )}
                      </td>
                      <td>Dr. {doctor.nom} {doctor.prenom}</td>
                      <td><Badge bg="info">{doctor.specialite}</Badge></td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {doctor.disponibilite?.map(jour => (
                            <Badge key={jour} bg="light" text="dark" className="border">
                              {jour}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div>{doctor.telephone}</div>
                        <div>{doctor.email}</div>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button variant="outline-primary" onClick={() => window.location.href = `mailto:${doctor.email}`}>
                            <FaEnvelope className="me-1" />
                            Email
                          </Button>
                          <Button variant="outline-success" onClick={() => window.location.href = `tel:${doctor.telephone}`}>
                            <FaPhone className="me-1" />
                            Appeler
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {assignedDoctorsList.length === 0 && (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Aucun médecin assigné pour le moment
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Accepted Doctors Section */}
{(activeTab === 'all' || activeTab === 'accepted') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-check-circle me-2"></i>
            Demandes de consultation acceptées
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'success'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'success'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body>
          {viewMode === 'grid' ? (
            // Grid View
          <Row xs={1} md={2} lg={3} className="g-4">
            {acceptedConsultations.map(consultation => {
              const qrData = `
                CONFIRMATION DE CONSULTATION
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}

                INFORMATIONS MÉDECIN
                Médecin: Dr. ${consultation.doctorInfo.nom} ${consultation.doctorInfo.prenom}
                Spécialité: ${consultation.doctorInfo.specialite}
                CONSULTATION
                Jour: ${consultation.preferredDay}
                Horaires: ${consultation.preferredTimeStart} - ${consultation.preferredTimeEnd}
                Motif: ${consultation.reason}
                Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
                Généré le: ${new Date().toLocaleString()}
              `;

              return (
                <Col key={consultation.id}>
                  <Card className="h-100">
                    <Card.Body>
                      {/* Doctor Info Section */}
                      <div className="d-flex align-items-center mb-3">
                        <div className="rounded-circle bg-success bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
                          style={{ width: '64px', height: '64px' }}>
                          <FaUserMd size={30} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-1">Dr. {consultation.doctorInfo.nom} {consultation.doctorInfo.prenom}</h6>
                          <Badge bg="success">{consultation.doctorInfo.specialite}</Badge>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="mb-3">
                        <h6 className="text-muted mb-2">Détails du rendez-vous:</h6>
                        <p className="mb-1">
                          <FaCalendarAlt className="me-2 text-success" />
                          Jour: {consultation.preferredDay}
                        </p>
                        <p className="mb-1">
                          <FaClock className="me-2 text-success" />
                          De: {consultation.preferredTimeStart} À: {consultation.preferredTimeEnd}
                        </p>
                      </div>

                      {/* Reason Section */}
                      <div className="mb-3">
                        <h6 className="text-muted mb-2">Motif:</h6>
                        <p className="mb-0">{consultation.reason}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-grid gap-2">
                        {!confirmedDoctors[consultation.id] ? (
                          <Button
                            variant="success"
                            onClick={() => {
                              const newConfirmedDoctors = {
                                ...confirmedDoctors,
                                [consultation.id]: true
                              };
                              setConfirmedDoctors(newConfirmedDoctors);
                              localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                              setMessage('Consultation confirmée');
                            }}
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            Confirmer la consultation
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => setShowQRModal(consultation.id)}
                          >
                            <i className="fas fa-qrcode me-2"></i>
                            Voir QR Code
                          </Button>
                        )}
                        
                        <Button
                          variant="danger"
                          onClick={async () => {
                            if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?')) {
                              try {
                                await deleteDoc(doc(db, 'consultationRequests', consultation.id));
                                const newConfirmedDoctors = { ...confirmedDoctors };
                                delete newConfirmedDoctors[consultation.id];
                                setConfirmedDoctors(newConfirmedDoctors);
                                localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                setMessage('Consultation supprimée avec succès');
                              } catch (error) {
                                setMessage('Erreur lors de la suppression: ' + error.message);
                              }
                            }
                          }}
                        >
                          <i className="fas fa-trash-alt me-2"></i>
                          Supprimer définitivement
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>

                  {/* QR Code Modal */}
                  <Modal
                    show={showQRModal === consultation.id}
                    onHide={() => setShowQRModal(null)}
                    size="lg"
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>QR Code - Consultation</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                      <QRCode
                        value={qrData}
                        size={400}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="H"
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          padding: "20px"
                        }}
                      />
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowQRModal(null)}>
                        Fermer
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          window.print();
                        }}
                      >
                        <i className="fas fa-print me-2"></i>
                        Imprimer
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </Col>
              );
            })}

            {acceptedConsultations.length === 0 && (
              <Col xs={12}>
                <Alert variant="info">
                  <i className="fas fa-info-circle me-2"></i>
                  Aucune demande de consultation acceptée
                </Alert>
              </Col>
            )}
          </Row>
       
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Médecin</th>
                    <th>Date</th>
                    <th>Horaires</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedConsultations.map(consultation => (
                    <tr key={consultation.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-success bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}>
                            <FaUserMd size={20} className="text-success" />
                          </div>
                          <div>
                            <div>Dr. {consultation.doctorInfo.nom} {consultation.doctorInfo.prenom}</div>
                            <Badge bg="success">{consultation.doctorInfo.specialite}</Badge>
                          </div>
                        </div>
                      </td>
                      <td>{consultation.preferredDay}</td>
                      <td>{consultation.preferredTimeStart} - {consultation.preferredTimeEnd}</td>
                      <td>{consultation.reason}</td>
                      <td>
                        {confirmedDoctors[consultation.id] ? (
                          <Badge bg="success">Confirmée</Badge>
                        ) : (
                          <Badge bg="warning">En attente</Badge>
                        )}
                      </td>
                      <td>
                        <ButtonGroup>
                          {!confirmedDoctors[consultation.id] ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                const newConfirmedDoctors = {
                                  ...confirmedDoctors,
                                  [consultation.id]: true
                                };
                                setConfirmedDoctors(newConfirmedDoctors);
                                localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                setMessage('Consultation confirmée');
                              }}
                            >
                              <i className="fas fa-check-circle"></i>
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShowQRModal(consultation.id)}
                            >
                              <i className="fas fa-qrcode"></i>
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?')) {
                                try {
                                  await deleteDoc(doc(db, 'consultationRequests', consultation.id));
                                  const newConfirmedDoctors = { ...confirmedDoctors };
                                  delete newConfirmedDoctors[consultation.id];
                                  setConfirmedDoctors(newConfirmedDoctors);
                                  localStorage.setItem('confirmedDoctors', JSON.stringify(newConfirmedDoctors));
                                  setMessage('Consultation supprimée avec succès');
                                } catch (error) {
                                  setMessage('Erreur lors de la suppression: ' + error.message);
                                }
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
{/* Global QR Code Modal - Place this outside the mapping functions */}
{acceptedConsultations.map(consultation => {
  const qrData = `
    CONFIRMATION DE CONSULTATION
    INFORMATIONS PATIENT
    Nom: ${patientData.nom}
    Prénom: ${patientData.prenom}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}

    INFORMATIONS MÉDECIN
    Médecin: Dr. ${consultation.doctorInfo.nom} ${consultation.doctorInfo.prenom}
    Spécialité: ${consultation.doctorInfo.specialite}
    CONSULTATION
    Jour: ${consultation.preferredDay}
    Horaires: ${consultation.preferredTimeStart} - ${consultation.preferredTimeEnd}
    Motif: ${consultation.reason}
    Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
    Généré le: ${new Date().toLocaleString()}
  `;

  return (
   <Modal
      key={consultation.id}
      show={showQRModal === consultation.id}
      onHide={() => setShowQRModal(null)}
      size="lg"
      centered
    >
   <Modal.Header closeButton>
     <Modal.Title>QR Code - Consultation</Modal.Title>
   </Modal.Header>
   <Modal.Body className="text-center">
     <QRCode
       value={qrData}
       size={400}
       bgColor="#FFFFFF"
       fgColor="#000000"
       level="H"
       style={{
         width: "100%",
         maxWidth: "400px",
         padding: "20px"
       }}
     />
   </Modal.Body>
   <Modal.Footer>
     <Button variant="secondary" onClick={() => setShowQRModal(null)}>
       Fermer
     </Button>
     <Button
       variant="primary"
       onClick={() => {
         window.print();
       }}
     >
       <i className="fas fa-print me-2"></i>
       Imprimer
     </Button>
   </Modal.Footer>
 </Modal>
  );
})}

          {acceptedConsultations.length === 0 && (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Aucune demande de consultation acceptée
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Assigned Doctor and Current Appointment Section */}
{(activeTab === 'all' || activeTab === 'current') && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-gradient bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" />
            Mon Médecin Assigné et Rendez-vous Actuel
          </h5>
          <ButtonGroup>
            <Button 
              variant={viewMode === 'grid' ? 'light' : 'primary'} 
              onClick={() => setViewMode('grid')}
            >
              <FaThLarge />
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'light' : 'primary'} 
              onClick={() => setViewMode('table')}
            >
              <FaList />
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body className="p-0">
          {viewMode === 'grid' ? (
            // Grid View
            <div className="p-3">
              {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => (
                <Row key={appointment.id} className="g-4 mb-4">
                   <Col md={6}>
<Card className="h-100 border-0 bg-light">
<Card.Body>
<h5 className="text-primary mb-4">Information du Médecin</h5>
{appointment.doctorInfo && (
<>
<div className="d-flex align-items-center mb-4">
{appointment.doctorInfo.photo ? (
<img
src={appointment.doctorInfo.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '64px', height: '64px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '64px', height: '64px' }}>
<FaUserMd size={30} className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {appointment.doctorInfo.nom} {appointment.doctorInfo.prenom}</h6>
<Badge bg="primary">{appointment.doctorInfo.specialite}</Badge>
</div>
</div>
<div className="contact-info">
<p className="mb-2">
<FaPhone className="me-2 text-primary" />
{appointment.doctorInfo.telephone}
</p>
<p className="mb-2">
<FaEnvelope className="me-2 text-primary" />
{appointment.doctorInfo.email}
</p>
<p className="mb-0">
<FaClock className="me-2 text-primary" />
{appointment.doctorInfo.heureDebut} - {appointment.doctorInfo.heureFin}
</p>
</div>
</>
)}
</Card.Body>
</Card>
</Col>
<Col md={6}>
<Card className="h-100 border-0 bg-light">
<Card.Body>
<h5 className="text-primary mb-4">Rendez-vous Actuel</h5>
<div className="appointment-info">
<p className="mb-1">
<FaCalendarAlt className="me-2 text-primary" />
<strong>Date:</strong> {appointment.day}
</p>
<p className="mb-1">
<FaClock className="me-2 text-primary" />
<strong>Heure:</strong> {appointment.timeSlot}
</p>
<Badge bg="success" className="px-3 py-2">
<i className="fas fa-check-circle me-2"></i>
Rendez-vous Confirmé
</Badge>

</div>
<Button
   variant="primary"
  size="lg"
    className=" mt-3"
    onClick={() => setShowQRModal(appointment.id)}
   >
  <FaQrcode className="me-1" />
     Voir le Code QR
   </Button>
</Card.Body>
</Card>
</Col>

                </Row>
              ))}
            </div>
          ) : (
            // Table View
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Médecin</th>
                    <th>Spécialité</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {appointment.doctorInfo.photo ? (
                            <img
                              src={appointment.doctorInfo.photo}
                              alt="Doctor"
                              className="rounded-circle me-2"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div className="rounded-circle bg-primary bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}>
                              <FaUserMd size={20} className="text-primary" />
                            </div>
                          )}
                          <div>Dr. {appointment.doctorInfo.nom} {appointment.doctorInfo.prenom}</div>
                        </div>
                      </td>
                      <td><Badge bg="primary">{appointment.doctorInfo.specialite}</Badge></td>
                      <td>{appointment.day}</td>
                      <td>{appointment.timeSlot}</td>
                      <td>
                        <small className="d-block">{appointment.doctorInfo.telephone}</small>
                        <small className="d-block">{appointment.doctorInfo.email}</small>
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowQRModal(appointment.id)}
                        >
                          <FaQrcode className="me-1" />
                          QR Code
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

{appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').map(appointment => {
            const qrData = `
              CONFIRMATION DE RENDEZ-VOUS
              PATIENT
              Nom: ${patientData.nom}
              Prénom: ${patientData.prenom}
              ID: ${patientData.id}
              Tel: ${patientData.telephone}
              MÉDECIN
              Dr. ${appointment.doctorInfo.nom} ${appointment.doctorInfo.prenom}
              Spécialité: ${appointment.doctorInfo.specialite}
              RENDEZ-VOUS
              Date: ${appointment.day}
              Heure: ${appointment.timeSlot}
              Status: ${appointment.status}
              ID RDV: ${appointment.id}
              Généré le: ${new Date().toLocaleString()}
            `;

            return (
              <Row key={appointment.id} className="g-4">
                



                {/* QR Code Modal */}
                <Modal
                  show={showQRModal === appointment.id}
                  onHide={() => setShowQRModal(null)}
                  size="lg"
                  centered
                >
                  <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                      <FaQrcode className="me-2" />
                      Code QR - Rendez-vous avec Dr. {appointment.doctorInfo.nom}
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center p-4">
                    <div className="mb-4">
                      <QRCode
                        value={qrData}
                        size={400}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="H"
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          padding: "20px"
                        }}
                      />
                    </div>
                    <div className="text-muted">
                      <small>Scannez ce code QR pour accéder aux détails de votre rendez-vous</small>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowQRModal(null)}>
                      <FaTimes className="me-2" />
                      Fermer
                    </Button>
                    <Button 
                      variant="primary"
                      onClick={() => {
                        window.print();
                      }}
                    >
                      <FaPrint className="me-2" />
                      Imprimer
                    </Button>
                    <Button 
                      variant="success"
                      onClick={() => {
                        const qrImage = document.querySelector('canvas');
                        if (qrImage) {
                          const link = document.createElement('a');
                          link.download = `rdv-qr-${appointment.id}.png`;
                          link.href = qrImage.toDataURL();
                          link.click();
                        }
                      }}
                    >
                      <FaDownload className="me-2" />
                      Télécharger
                    </Button>
                  </Modal.Footer>
                </Modal>
              </Row>
            );
          })}          
          {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'extended').length === 0 && (
            <Alert variant="info" className="m-3">
              <i className="fas fa-info-circle me-2"></i>
              Aucun rendez-vous actif pour le moment
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Details patient Section */}
<Modal
show={showPatientDetailsModal}
onHide={() => setShowPatientDetailsModal(false)}
size="lg"
>
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
<FaUser className="me-2" />
Détails du Patient
</Modal.Title>
</Modal.Header>
<Modal.Body>
{selectedPatientDetails && (
<div>
<Row>
<Col md={4} className="text-center mb-4">
{selectedPatientDetails.photo ? (
<img
src={selectedPatientDetails.photo}
alt="Patient"
className="rounded-circle mb-3"
style={{ width: '150px', height: '150px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 mb-3 mx-auto d-flex align-items-center justify-content-center"
style={{ width: '150px', height: '150px' }}>
<span className="h1 mb-0">{selectedPatientDetails.nom?.[0]}{selectedPatientDetails.prenom?.[0]}</span>
</div>
)}
<h4>{selectedPatientDetails.nom} {selectedPatientDetails.prenom}</h4>
<Badge bg="primary">{selectedPatientDetails.status || 'Actif'}</Badge>
</Col>
<Col md={8}>
<Card className="mb-3">
<Card.Body>
<h5 className="mb-3">Informations personnelles</h5>
<Row className="mb-2">
<Col sm={4} className="text-muted">Âge:</Col>
<Col sm={8}>{selectedPatientDetails.age} ans</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Sexe:</Col>
<Col sm={8}>{selectedPatientDetails.sexe}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Email:</Col>
<Col sm={8}>{selectedPatientDetails.email}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Téléphone:</Col>
<Col sm={8}>{selectedPatientDetails.telephone}</Col>
</Row>
</Card.Body>
</Card>

{structureDetails && (
<Card className="mb-3">
<Card.Body>
<h5 className="mb-3">Structure d'affectation</h5>
<Row className="mb-2">
<Col sm={4} className="text-muted">Nom:</Col>
<Col sm={8}>{structureDetails.name}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Adresse:</Col>
<Col sm={8}>{structureDetails.address}</Col>
</Row>
<Row className="mb-2">
<Col sm={4} className="text-muted">Contact:</Col>
<Col sm={8}>{structureDetails.phones?.mobile}</Col>
</Row>
</Card.Body>
</Card>
)}


{assignedDoctorsDetails.length > 0 && (
<Card>
<Card.Body>
<h5 className="mb-3">Médecins assignés</h5>
{assignedDoctorsDetails.map(doctor => (
<div key={doctor.id} className="mb-3 p-3 border rounded">
<div className="d-flex align-items-center">
{doctor.photo ? (
<img
src={doctor.photo}
alt="Doctor"
className="rounded-circle me-3"
style={{ width: '50px', height: '50px', objectFit: 'cover' }}
/>
) : (
<div className="rounded-circle bg-primary bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
style={{ width: '50px', height: '50px' }}>
<FaUserMd className="text-primary" />
</div>
)}
<div>
<h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
<Badge bg="info">{doctor.specialite}</Badge>
</div>
</div>
<div className="mt-2">
<small className="text-muted d-block">
<FaEnvelope className="me-2" />
{doctor.email}
</small>
<small className="text-muted d-block">
<FaPhone className="me-2" />
{doctor.telephone}
</small>
</div>
</div>
))}
</Card.Body>
</Card>
)}
</Col>
</Row>
</div>
)}
</Modal.Body>
</Modal>

<Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)} size="lg">
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
<i className="fas fa-calendar-plus me-2"></i>
Demande de consultation
</Modal.Title>
</Modal.Header>
<Modal.Body>
<Form>
<Form.Group className="mb-3">
<Form.Label>Sélectionner un médecin</Form.Label>
<Form.Select
onChange={(e) => {
const doctor = availableDoctors.find(d => d.id === e.target.value);
setSelectedDoctor(doctor);
}}
>
<option value="">Choisir un médecin...</option>
{availableDoctors.map(doctor => (
<option key={doctor.id} value={doctor.id}>
Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
</option>
))}
</Form.Select>
</Form.Group>

{selectedDoctor && (
<>
<Form.Group className="mb-3">
<Form.Label>Jour souhaité</Form.Label>
<Form.Select onChange={(e) => setSelectedDay(e.target.value)}>
<option value="">Choisir un jour...</option>
{selectedDoctor.disponibilite?.map(jour => (
<option key={jour} value={jour}>{jour}</option>
))}
</Form.Select>
</Form.Group>

<Row>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>Heure de début</Form.Label>
<Form.Control
type="time"
min={selectedDoctor.heureDebut}
max={selectedDoctor.heureFin}
onChange={(e) => setSelectedTimeSlot(e.target.value)}
/>
<Form.Text className="text-muted">
Disponible de {selectedDoctor.heureDebut} à {selectedDoctor.heureFin}
</Form.Text>
</Form.Group>
</Col>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>Heure de fin</Form.Label>
<Form.Control
type="time"
min={selectedTimeSlot || selectedDoctor.heureDebut}
max={selectedDoctor.heureFin}
onChange={(e) => setSelectedEndTime(e.target.value)}
/>
</Form.Group>
</Col>
</Row>

<Form.Group className="mb-3">
<Form.Label>Motif de consultation</Form.Label>
<Form.Control
as="textarea"
rows={3}
placeholder="Décrivez brièvement le motif de votre consultation..."
onChange={(e) => setConsultationReason(e.target.value)}
/>
</Form.Group>
</>
)}
</Form>
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowConsultationModal(false)}>
<i className="fas fa-times me-2"></i>
Annuler
</Button>
<Button
variant="primary"
onClick={handleConsultationRequest}
disabled={!selectedDoctor || !selectedDay || !selectedTimeSlot}
>
<i className="fas fa-paper-plane me-2"></i>
Envoyer la demande
</Button>
</Modal.Footer>
</Modal>
</Container>
);
};
export default PatientsDashboard