import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge ,Modal,ListGroup} from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Select from 'react-select';
import { 
  FaHospital, 
  FaUserMd, 
  FaCalendarAlt, 
  FaClock,
  FaCommentMedical,
  FaCheck
} from 'react-icons/fa';

const PatientRdv = () => {
  // États pour stocker les données de base
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [patientData, setPatientData] = useState(null);
  
  // États simplifiés pour les préférences
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [motif, setMotif] = useState('');
  
  // État pour le texte récapitulatif
  const [requestSummary, setRequestSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

// Ajoutez ces états au début du composant
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

  // Récupérer les données du patient connecté depuis localStorage
  useEffect(() => {
    const storedPatientData = localStorage.getItem('patientData');
    if (storedPatientData) {
      setPatientData(JSON.parse(storedPatientData));
    }
  }, []);

  // Charger les structures médicales depuis Firestore
  useEffect(() => {
    const fetchStructures = async () => {
      setLoading(true);
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresList = structuresSnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().name,
          specialties: doc.data().specialties || []
        }));
        setStructures(structuresList);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        setFeedback({
          type: 'danger',
          message: 'Impossible de charger les structures médicales.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStructures();
  }, []);

  // Mettre à jour les spécialités disponibles lorsqu'une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure) {
      const structureData = structures.find(s => s.value === selectedStructure.value);
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
  }, [selectedStructure, structures]);
  
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


  // Écouter les notifications en temps réel
useEffect(() => {
  if (!patientData?.id) return;

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', patientData.id),
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

  return () => unsubscribe();
}, [patientData?.id]);



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

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormComplete()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir tous les champs requis.'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Créer la demande de rendez-vous dans Firestore avec le texte récapitulatif
      const requestRef = await addDoc(collection(db, 'appointmentRequests'), {
        patientId: patientData?.id,
        patientInfo: {
          nom: patientData?.nom,
          prenom: patientData?.prenom,
          email: patientData?.email,
          telephone: patientData?.telephone,
          age: patientData?.age,
          sexe: patientData?.sexe,
          insurance: patientData?.insurance || []
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
        userId: patientData?.id,
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
      setLoading(false);
    }
  };



{/* Définissez ce composant dans le même fichier ou dans un fichier séparé */}
const RequestsTable = ({ patientId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  if (loading) {
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





  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {/* Ajoutez ce bouton près du titre ou dans un header */}
<div className="d-flex justify-content-between align-items-center mb-4">
  <h2 className="text-center">Demande de Rendez-vous</h2>
  
  {hasNewNotifications && (
    <Button 
      variant="outline-primary" 
      className="position-relative"
      onClick={() => setShowNotificationsModal(true)}
    >
      <i className="fas fa-bell"></i>
      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
        {notifications.length}
        <span className="visually-hidden">notifications non lues</span>
      </span>
    </Button>
  )}
</div>

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
                      options={structures}
                      value={selectedStructure}
                      onChange={setSelectedStructure}
                      placeholder="Sélectionnez une structure médicale"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={loading}
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
                      isDisabled={!selectedStructure || loading}
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
                      isDisabled={loading}
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
                      isDisabled={loading}
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
                      isDisabled={loading}
                    />
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      size="lg" 
                      disabled={loading || !isFormComplete()}
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
                      disabled={loading}
                    >
                      Modifier
                    </Button>
                    
                    <Button 
                      variant="success" 
                      onClick={handleSubmit}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
{/* Ajoutez ce composant après le formulaire de demande */}
<Card className="shadow-sm mt-4">
  <Card.Header className="bg-primary text-white">
    <h5 className="mb-0">
      <FaCalendarAlt className="me-2" />
      Mes demandes de rendez-vous
    </h5>
  </Card.Header>
  <Card.Body>
    {/* Tableau des demandes */}
    <RequestsTable patientId={patientData?.id} />
  </Card.Body>
</Card>


      {/* Ajoutez cette modale à la fin du composant, avant la fermeture de Container */}
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
                <i className="fas fa-check"></i> Marquer comme lu
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
        <i className="fas fa-check-double me-2"></i>
        Tout marquer comme lu
      </Button>
    )}
  </Modal.Footer>
</Modal>

    </Container>
  );
};

export default PatientRdv;

                

                

























import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Select from 'react-select';
import { 
  FaHospital, 
  FaUserMd, 
  FaCalendarAlt, 
  FaClock,
  FaCommentMedical,
  FaCheck
} from 'react-icons/fa';

const PatientRdv = () => {
  // États pour stocker les données de base
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [patientData, setPatientData] = useState(null);
  
  // États simplifiés pour les préférences
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [motif, setMotif] = useState('');
  
  // État pour le texte récapitulatif
  const [requestSummary, setRequestSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

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

  // Récupérer les données du patient connecté depuis localStorage
  useEffect(() => {
    const storedPatientData = localStorage.getItem('patientData');
    if (storedPatientData) {
      setPatientData(JSON.parse(storedPatientData));
    }
  }, []);

  // Charger les structures médicales depuis Firestore
  useEffect(() => {
    const fetchStructures = async () => {
      setLoading(true);
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresList = structuresSnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().name,
          specialties: doc.data().specialties || []
        }));
        setStructures(structuresList);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        setFeedback({
          type: 'danger',
          message: 'Impossible de charger les structures médicales.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStructures();
  }, []);

  // Mettre à jour les spécialités disponibles lorsqu'une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure) {
      const structureData = structures.find(s => s.value === selectedStructure.value);
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
  }, [selectedStructure, structures]);
  
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

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormComplete()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir tous les champs requis.'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Créer la demande de rendez-vous dans Firestore avec le texte récapitulatif
      const requestRef = await addDoc(collection(db, 'appointmentRequests'), {
        patientId: patientData?.id,
        patientInfo: {
          nom: patientData?.nom,
          prenom: patientData?.prenom,
          email: patientData?.email,
          telephone: patientData?.telephone,
          age: patientData?.age,
          sexe: patientData?.sexe,
          insurance: patientData?.insurance || []
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
        userId: patientData?.id,
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
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Demande de Rendez-vous</h2>
              
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
                      options={structures}
                      value={selectedStructure}
                      onChange={setSelectedStructure}
                      placeholder="Sélectionnez une structure médicale"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isDisabled={loading}
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
                      isDisabled={!selectedStructure || loading}
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
                      isDisabled={loading}
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
                      isDisabled={loading}
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
                      isDisabled={loading}
                    />
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      size="lg" 
                      disabled={loading || !isFormComplete()}
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
                      disabled={loading}
                    >
                      Modifier
                    </Button>
                    
                    <Button 
                      variant="success" 
                      onClick={handleSubmit}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientRdv;

                











import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup, ProgressBar } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Select from 'react-select';
import { 
  FaCalendarAlt, 
  FaHospital, 
  FaUserMd, 
  FaCommentMedical, 
  FaClock,
  FaBell, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSpinner,
  FaFile, 
  FaTrash, 
  FaUpload, 
  FaFilePdf, 
  FaFileImage, 
  FaFileAlt
} from 'react-icons/fa';

const PatientRdv = () => {
  // États pour stocker les données de base
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [patientData, setPatientData] = useState(null);
  
  // États pour l'amélioration 1 : Sélection d'horaires
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  
  // États pour l'amélioration 2 : Système de notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // États pour l'amélioration 3 : Ajout de documents médicaux
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState({});

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
  
  // Générer des créneaux horaires de 30 minutes
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8h du matin
    const endHour = 18; // 18h (6PM)
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minutes of ['00', '30']) {
        if (hour === endHour && minutes === '30') continue; // Ne pas ajouter 18:30
        const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
        slots.push({
          value: time,
          label: time
        });
      }
    }
    
    return slots;
  };
  
  const timeSlotOptions = generateTimeSlots();

  // Récupérer les données du patient connecté depuis localStorage
  useEffect(() => {
    const storedPatientData = localStorage.getItem('patientData');
    if (storedPatientData) {
      setPatientData(JSON.parse(storedPatientData));
    }
  }, []);

  // Charger les structures médicales depuis Firestore
  useEffect(() => {
    const fetchStructures = async () => {
      setLoading(true);
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresList = structuresSnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().name,
          specialties: doc.data().specialties || []
        }));
        setStructures(structuresList);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        setFeedback({
          type: 'danger',
          message: 'Impossible de charger les structures médicales.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStructures();
  }, []);

  // Mettre à jour les spécialités disponibles lorsqu'une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure) {
      const structureData = structures.find(s => s.value === selectedStructure.value);
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
  }, [selectedStructure, structures]);
  
  // Récupérer les notifications du patient
  useEffect(() => {
    if (!patientData?.id) return;
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', patientData.id)
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Trier par date (plus récentes en premier)
      notificationsList.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setNotifications(notificationsList);
      
      // Compter les notifications non lues
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
    });
    
    return () => unsubscribe();
  }, [patientData]);
  
  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  };
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        if (!notification.read) {
          batch.update(doc(db, 'notifications', notification.id), { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
    }
  };
  
  // Gérer l'ajout de documents
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Vérifier la taille des fichiers (max 5MB par fichier)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== files.length) {
      setFeedback({
        type: 'warning',
        message: 'Certains fichiers dépassent la taille maximale autorisée (5MB).'
      });
    }
    
    // Créer des aperçus pour les images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => ({
            ...prev,
            [file.name]: e.target.result
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    setDocuments([...documents, ...validFiles]);
  };
  
  // Supprimer un document
  const removeDocument = (index) => {
    const newDocuments = [...documents];
    const removedFile = newDocuments[index];
    
    // Supprimer l'aperçu si existant
    if (previewUrls[removedFile.name]) {
      const newPreviewUrls = { ...previewUrls };
      delete newPreviewUrls[removedFile.name];
      setPreviewUrls(newPreviewUrls);
    }
    
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };
  
  // Obtenir l'icône appropriée selon le type de fichier
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <FaFileImage className="text-primary" />;
    } else if (file.type === 'application/pdf') {
      return <FaFilePdf className="text-danger" />;
    } else {
      return <FaFileAlt className="text-secondary" />;
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStructure || !selectedSpecialty || selectedDays.length === 0 || 
        selectedTimeSlots.length === 0 || !message.trim()) {
      setFeedback({
        type: 'warning',
        message: 'Veuillez remplir tous les champs requis.'
      });
      return;
    }

    setLoading(true);
    setUploading(documents.length > 0);
    
    try {
      // Upload des documents
      let documentUrls = [];
      
      if (documents.length > 0) {
        for (let i = 0; i < documents.length; i++) {
          const file = documents[i];
          const storageRef = ref(storage, `patients/${patientData.id}/appointment_requests/${Date.now()}_${file.name}`);
          
          // Upload du fichier
          await uploadBytes(storageRef, file);
          
          // Mise à jour de la progression
          setUploadProgress(Math.round(((i + 1) / documents.length) * 100));
          
          // Obtenir l'URL de téléchargement
          const downloadUrl = await getDownloadURL(storageRef);
          documentUrls.push({
            name: file.name,
            url: downloadUrl,
            type: file.type,
            size: file.size
          });
        }
      }
      
      // Créer la demande de rendez-vous dans Firestore
      const requestRef = await addDoc(collection(db, 'appointmentRequests'), {
        patientId: patientData?.id,
        patientInfo: {
          nom: patientData?.nom,
          prenom: patientData?.prenom,
          email: patientData?.email,
          telephone: patientData?.telephone,
          age: patientData?.age,
          sexe: patientData?.sexe,
          insurance: patientData?.insurance || []
        },
        structureId: selectedStructure.value,
        structureName: selectedStructure.label,
        specialty: selectedSpecialty.value,
        preferredDays: selectedDays.map(day => day.value),
        preferredTimeSlots: selectedTimeSlots.map(slot => slot.value),
        message: message,
        documents: documentUrls,
        status: 'pending',
        requestDate: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      });
      
      // Créer une notification pour le patient
      await addDoc(collection(db, 'notifications'), {
        userId: patientData?.id,
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
      setMessage('');
      setDocuments([]);
      setPreviewUrls({});
      setUploadProgress(0);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      setFeedback({
        type: 'danger',
        message: 'Une erreur s\'est produite lors de l\'envoi de votre demande.'
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Container className="py-5">
      {/* Bouton de notifications avec badge */}
      <div className="position-fixed top-0 end-0 m-4 z-index-1000">
        <Button 
          variant="light" 
          className="rounded-circle shadow p-2" 
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell size={24} />
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
        
        {/* Panneau de notifications */}
        {showNotifications && (
          <Card className="position-absolute mt-2 shadow" style={{ width: '350px', right: 0, zIndex: 1050 }}>
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Notifications</h6>
              {unreadCount > 0 && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-decoration-none"
                  onClick={markAllAsRead}
                >
                                  Tout marquer comme lu
                </Button>
              )}
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <ListGroup.Item 
                    key={notification.id}
                    className={`d-flex align-items-start ${!notification.read ? 'bg-light' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                    action
                  >
                    <div className="me-3 pt-1">
                      {notification.type === 'request_accepted' && <FaCheckCircle className="text-success" size={20} />}
                      {notification.type === 'request_rejected' && <FaTimesCircle className="text-danger" size={20} />}
                      {notification.type === 'request_pending' && <FaSpinner className="text-warning" size={20} />}
                    </div>
                    <div>
                      <div className="fw-bold">{notification.title}</div>
                      <div className="small">{notification.message}</div>
                      <div className="text-muted small mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <Badge bg="primary" pill className="ms-auto">
                        Nouveau
                      </Badge>
                    )}
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-center py-4">
                  <div className="text-muted">Aucune notification</div>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        )}
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Demande de Rendez-vous</h2>
              
              {feedback.message && (
                <Alert 
                  variant={feedback.type} 
                  onClose={() => setFeedback({ type: '', message: '' })} 
                  dismissible
                >
                  {feedback.message}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FaHospital className="me-2" />
                    Structure médicale
                  </Form.Label>
                  <Select
                    options={structures}
                    value={selectedStructure}
                    onChange={setSelectedStructure}
                    placeholder="Sélectionnez une structure médicale"
                    className="react-select-container"
                    classNamePrefix="react-select"
                    isDisabled={loading}
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
                    isDisabled={!selectedStructure || loading}
                    noOptionsMessage={() => "Aucune spécialité disponible pour cette structure"}
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
                    isDisabled={loading}
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
                    isDisabled={loading}
                    noOptionsMessage={() => "Aucun créneau disponible"}
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
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <FaFile className="me-2" />
                    Documents médicaux (facultatif)
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      disabled={loading}
                      className="d-none"
                      id="documentInput"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Button 
                      variant="outline-primary" 
                      onClick={() => document.getElementById('documentInput').click()}
                      disabled={loading}
                      className="me-2"
                    >
                      <FaUpload className="me-2" />
                      Ajouter des documents
                    </Button>
                    <Form.Text className="text-muted">
                      Formats acceptés: PDF, JPG, PNG, DOC (max 5MB)
                    </Form.Text>
                  </div>
                  
                  {documents.length > 0 && (
                    <div className="mt-3 border rounded p-3">
                      <h6 className="mb-3">Documents joints ({documents.length})</h6>
                      <ListGroup>
                        {documents.map((file, index) => (
                          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                              {getFileIcon(file)}
                              <span className="ms-2">{file.name}</span>
                              <span className="ms-2 text-muted small">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button 
                              variant="link" 
                              className="text-danger p-0" 
                              onClick={() => removeDocument(index)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                      
                      {/* Aperçus des images */}
                      {Object.keys(previewUrls).length > 0 && (
                        <div className="mt-3">
                          <h6>Aperçus</h6>
                          <Row>
                            {Object.entries(previewUrls).map(([name, url], index) => (
                              <Col xs={6} md={4} lg={3} key={index} className="mb-3">
                                <img 
                                  src={url} 
                                  alt={name} 
                                  className="img-thumbnail" 
                                  style={{ maxHeight: '120px', objectFit: 'cover' }}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
                
                {uploading && (
                  <div className="mb-4">
                    <Form.Label>Téléchargement des documents</Form.Label>
                    <ProgressBar 
                      now={uploadProgress} 
                      label={`${uploadProgress}%`} 
                      variant="info" 
                      animated 
                    />
                  </div>
                )}
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
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
                        Envoi en cours...
                      </>
                    ) : (
                      'Envoyer ma demande'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PatientRdv;
