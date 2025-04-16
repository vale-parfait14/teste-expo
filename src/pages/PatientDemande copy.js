import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaHospital, FaStethoscope, FaFileUpload } from 'react-icons/fa';
import Select from 'react-select';

const PatientDemande = () => {
  // États pour stocker les données
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [documents, setDocuments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);

  // Récupérer les informations du patient connecté
  useEffect(() => {
    const fetchPatientInfo = () => {
      try {
        const storedPatient = localStorage.getItem('patientData');
        if (storedPatient) {
          const patientData = JSON.parse(storedPatient);
          setPatientInfo(patientData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données du patient:', error);
        setMessage({ 
          type: 'danger', 
          text: 'Impossible de récupérer vos informations. Veuillez vous reconnecter.' 
        });
      }
    };

    fetchPatientInfo();
  }, []);

  // Récupérer la liste des structures
  useEffect(() => {
    const fetchStructures = async () => {
      setLoading(true);
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresList = structuresSnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().name,
          data: doc.data()
        }));
        setStructures(structuresList);
      } catch (error) {
        console.error('Erreur lors du chargement des structures:', error);
        setMessage({ type: 'danger', text: 'Erreur lors du chargement des structures' });
      } finally {
        setLoading(false);
      }
    };

    fetchStructures();
  }, []);

  // Mettre à jour les spécialités lorsqu'une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure) {
      const specialtiesList = selectedStructure.data.specialties || [];
      setSpecialties(specialtiesList.map(specialty => ({
        value: specialty,
        label: specialty
      })));
    } else {
      setSpecialties([]);
    }
    setSelectedSpecialty(null);
  }, [selectedStructure]);

  // Gérer le changement de structure
  const handleStructureChange = (selected) => {
    setSelectedStructure(selected);
  };

  // Gérer le changement de spécialité
  const handleSpecialtyChange = (selected) => {
    setSelectedSpecialty(selected);
  };

  // Gérer le téléchargement de documents
  const handleDocumentsChange = (e) => {
    setDocuments(Array.from(e.target.files));
  };

  // Soumettre la demande
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patientInfo) {
      setMessage({ type: 'danger', text: 'Veuillez vous connecter pour faire une demande' });
      return;
    }

    if (!selectedStructure || !selectedSpecialty) {
      setMessage({ type: 'danger', text: 'Veuillez sélectionner une structure et une spécialité' });
      return;
    }

    setLoading(true);

    try {
      // Télécharger les documents si présents
      const documentUrls = [];
      if (documents.length > 0) {
        for (const file of documents) {
          const storageRef = ref(storage, `patientRequests/${patientInfo.id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadUrl = await getDownloadURL(storageRef);
          documentUrls.push(downloadUrl);
        }
      }

      // Créer la demande dans Firestore
      const requestData = {
        patientId: patientInfo.id,
        patientInfo: {
          nom: patientInfo.nom,
          prenom: patientInfo.prenom,
          age: patientInfo.age,
          sexe: patientInfo.sexe,
          email: patientInfo.email,
          telephone: patientInfo.telephone,
          photoURL: patientInfo.photo || null,
          insurances: patientInfo.insurance || []
        },
        structureId: selectedStructure.value,
        structureName: selectedStructure.label,
        specialty: selectedSpecialty.value,
        documents: documentUrls,
        status: 'pending',
        requestDate: new Date(),
        notes: ''
      };

      await addDoc(collection(db, 'structureRequests'), requestData);

      setMessage({ 
        type: 'success', 
        text: `Votre demande a été envoyée avec succès à ${selectedStructure.label}. Vous serez notifié lorsqu'elle sera traitée.` 
      });
      
      // Réinitialiser le formulaire
      setSelectedStructure(null);
      setSelectedSpecialty(null);
      setDocuments([]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      setMessage({ type: 'danger', text: 'Erreur lors de l\'envoi de la demande. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <FaHospital className="me-2" />
                Demande d'ajout à une structure médicale
              </h4>
            </Card.Header>
            <Card.Body>
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              {patientInfo ? (
                <Form onSubmit={handleSubmit}>
                  <div className="patient-info-summary mb-4 p-3 bg-light rounded">
                    <h5 className="border-bottom pb-2 mb-3">Vos informations</h5>
                    <Row>
                      <Col md={6}>
                        <p><strong>Nom:</strong> {patientInfo.nom}</p>
                        <p><strong>Prénom:</strong> {patientInfo.prenom}</p>
                        <p><strong>Âge:</strong> {patientInfo.age} ans</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Sexe:</strong> {patientInfo.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                        <p><strong>Email:</strong> {patientInfo.email}</p>
                        <p><strong>Téléphone:</strong> {patientInfo.telephone}</p>
                      </Col>
                    </Row>
                    {patientInfo.insurance && patientInfo.insurance.length > 0 && (
                      <div>
                        <p><strong>Assurances:</strong> {patientInfo.insurance.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaHospital className="me-2" />
                      Sélectionnez une structure médicale
                    </Form.Label>
                    <Select
                      options={structures}
                      value={selectedStructure}
                      onChange={handleStructureChange}
                      isLoading={loading}
                      placeholder="Choisir une structure..."
                      noOptionsMessage={() => "Aucune structure disponible"}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaStethoscope className="me-2" />
                      Sélectionnez une spécialité
                    </Form.Label>
                    <Select
                      options={specialties}
                      value={selectedSpecialty}
                      onChange={handleSpecialtyChange}
                      isDisabled={!selectedStructure}
                      placeholder={selectedStructure ? "Choisir une spécialité..." : "Veuillez d'abord sélectionner une structure"}
                      noOptionsMessage={() => "Aucune spécialité disponible pour cette structure"}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaFileUpload className="me-2" />
                      Documents médicaux (facultatif)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleDocumentsChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Form.Text className="text-muted">
                      Vous pouvez joindre des documents médicaux pertinents pour faciliter votre prise en charge.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading || !selectedStructure || !selectedSpecialty}
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
              ) : (
                <Alert variant="warning">
                  Vous devez être connecté en tant que patient pour faire une demande. Veuillez vous connecter.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .react-select-container {
          margin-bottom: 1rem;
        }
        .react-select__control {
          border-radius: 0.375rem !important;
          border-color: #dee2e6 !important;
        }
        .react-select__control:hover {
          border-color: #0d6efd !important;
        }
        .react-select__control--is-focused {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
          border-color: #0d6efd !important;
        }
        .react-select__option--is-selected {
          background-color: #0d6efd !important;
        }
        .patient-info-summary {
          border-left: 4px solid #0d6efd;
        }
      `}</style>
    </Container>
  );
};

export default PatientDemande;





















import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { FaHospital, FaUserMd, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import Select from 'react-select';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PatientDemande = ({ show, onHide, patient }) => {
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [consultationReason, setConsultationReason] = useState('');
  const [insuranceMatches, setInsuranceMatches] = useState({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [patientPhotoFile, setPatientPhotoFile] = useState(null);
  const [medicalDocs, setMedicalDocs] = useState([]);
  const [previewDocs, setPreviewDocs] = useState([]);
  const [registrationData, setRegistrationData] = useState({
    nom: patient?.nom || '',
    prenom: patient?.prenom || '',
    age: '',
    sexe: '',
    email: patient?.email || '',
    telephone: patient?.telephone || '',
    insurances: patient?.insurances || [],
    documents: []
  });

  useEffect(() => {
    const fetchStructures = async () => {
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = structuresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStructures(structuresData);
      } catch (error) {
        setMessage('Erreur lors du chargement des structures');
        console.error(error);
      }
    };

    fetchStructures();
  }, []);

  const handleStructureSelect = async (structure) => {
    setSelectedStructure(structure);
    try {
      // Vérifier si le patient est déjà enregistré
      const patientsRef = collection(db, 'structures', structure.id, 'patients');
      const q = query(patientsRef, where('id', '==', patient.id));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage("Vous devez d'abord vous inscrire dans cette structure");
        setShowRegistrationForm(true);
        return;
      }

      setIsRegistered(true);
      // Charger les médecins
      const doctorsQuery = query(
        collection(db, 'medecins'),
        where('structures', 'array-contains', structure.id)
      );
      const doctorsSnapshot = await getDocs(doctorsQuery);
      const doctorsData = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);

      const matches = {};
      doctorsData.forEach(doctor => {
        if (doctor.insurances && doctor.insurances.length > 0 && 
            patient?.insurances && patient.insurances.length > 0) {
          matches[doctor.id] = doctor.insurances.some(insurance => 
            patient.insurances.includes(insurance)
          );
        } else {
          matches[doctor.id] = false;
        }
      });
      
      setInsuranceMatches(matches);
      setStep(2);
    } catch (error) {
      setMessage('Erreur lors de la vérification');
      console.error(error);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    generateAvailableTimeSlots(doctor);
    setStep(3);
  };

  const generateAvailableTimeSlots = (doctor) => {
    const slots = [];
    const [startHour, startMinute] = doctor.heureDebut.split(':');
    const [endHour, endMinute] = doctor.heureFin.split(':');
    const duration = doctor.consultationDuration || 30;

    let currentTime = new Date();
    currentTime.setHours(parseInt(startHour), parseInt(startMinute), 0);
    const endTime = new Date();
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

    while (currentTime < endTime) {
      slots.push(currentTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }));
      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }

    setAvailableTimeSlots(slots);
  };

  const handleRegistration = async () => {
    try {
      const storage = getStorage();
      let photoUrl = null;
      let documentUrls = [];

      // Upload photo
      if (patientPhotoFile) {
        const photoRef = ref(storage, `patients/${patient.id}/photo/${patientPhotoFile.name}`);
        await uploadBytes(photoRef, patientPhotoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      // Upload documents
      if (medicalDocs.length > 0) {
        for (const doc of medicalDocs) {
          const docRef = ref(storage, `patients/${patient.id}/documents/${doc.name}`);
          await uploadBytes(docRef, doc);
          const url = await getDownloadURL(docRef);
          documentUrls.push(url);
        }
      }

      // Créer le patient dans la structure
      await addDoc(collection(db, 'structures', selectedStructure.id, 'patients'), {
        ...registrationData,
        id: patient.id,
        photo: photoUrl,
        documents: documentUrls,
        visibility: 'private',
        createdAt: new Date().toISOString()
      });

      setShowRegistrationForm(false);
      setIsRegistered(true);
      setMessage('Inscription réussie');
      
      // Continuer avec la sélection des médecins
      handleStructureSelect(selectedStructure);
    } catch (error) {
      setMessage("Erreur lors de l'inscription");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedDoctor || !selectedDay || !selectedTimeSlot || !consultationReason) {
        setMessage('Veuillez remplir tous les champs');
        return;
      }

      const consultationRequest = {
        patientId: patient.id,
        patientInfo: {
          nom: patient.nom,
          prenom: patient.prenom,
          telephone: patient.telephone,
          email: patient.email
        },
        doctorId: selectedDoctor.id,
        structureId: selectedStructure.id,
        doctorInfo: {
          nom: selectedDoctor.nom,
          prenom: selectedDoctor.prenom,
          specialite: selectedDoctor.specialite
        },
        day: selectedDay,
        timeSlot: selectedTimeSlot,
        reason: consultationReason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'consultationRequests'), consultationRequest);
      setMessage('Demande de consultation envoyée avec succès');
      setTimeout(() => {
        onHide();
        resetForm();
      }, 2000);
    } catch (error) {
      setMessage('Erreur lors de l\'envoi de la demande');
      console.error(error);
    }
  };

  const resetForm = () => {
    setSelectedStructure(null);
    setSelectedDoctor(null);
    setSelectedDay('');
    setSelectedTimeSlot('');
    setConsultationReason('');
    setStep(1);
    setShowRegistrationForm(false);
    setIsRegistered(false);
  };

  return (
    <>
      
      <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-hospital me-2"></i>
          Rechercher une structure médicale
        </Modal.Title>
      </Modal.Header>
  
      <Modal.Body className="bg-light p-4">
        <Form>
          {message && (
            <Alert 
              variant={message.includes('succès') ? 'success' : 'danger'}
              dismissible
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          )}
  
          {/* Step 1: Structure Selection */}
          {step === 1 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-hospital me-2"></i>
                    Sélectionner une structure
                  </Form.Label>
                  <div className="structures-grid">
                    {structures.map(structure => (
                      <Card 
                        key={structure.id}
                        className={`mb-3 cursor-pointer ${selectedStructure?.id === structure.id ? 'border-primary' : ''}`}
                        onClick={() => handleStructureSelect(structure)}
                      >
                        <Card.Body>
                          <h6>{structure.name}</h6>
                          <p className="text-muted small mb-2">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {structure.address}
                          </p>
                          {structure.insurance && (
                            <div className="d-flex flex-wrap gap-1">
                              {structure.insurance.map((ins, index) => (
                                <Badge 
                                  key={index}
                                  bg={patient?.insurances?.includes(ins) ? 'success' : 'secondary'}
                                  className="rounded-pill"
                                >
                                  {ins}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
  
          {/* Step 2: Doctor Selection */}
          {step === 2 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-user-md me-2"></i>
                    Sélectionner un médecin
                  </Form.Label>
                  <div className="doctors-grid">
                    {doctors.map(doctor => (
                      <Card 
                        key={doctor.id}
                        className={`mb-3 cursor-pointer ${selectedDoctor?.id === doctor.id ? 'border-primary' : ''}`}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <Card.Body>
                          <h6>Dr. {doctor.nom} {doctor.prenom}</h6>
                          <p className="text-muted small mb-2">
                            <i className="fas fa-stethoscope me-2"></i>
                            {doctor.specialite}
                          </p>
                          <div className="d-flex flex-wrap gap-1 mb-2">
                      {doctor.insurances?.map((insurance, index) => (
                        <Badge 
                          key={index}
                          bg="info"
                          className="rounded-pill"
                        >
                          <i className="fas fa-shield-alt me-1"></i>
                          {insurance}
                        </Badge>
                      ))}
                      {(!doctor.insurances || doctor.insurances.length === 0) && (
                        <Badge 
                          bg="warning"
                          className="rounded-pill"
                        >
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Aucune assurance
                        </Badge>
                      )}
                    </div>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {doctor.disponibilite?.map(day => (
                              <Badge key={day} bg="light" text="dark" className="border">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
  
          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Détails du rendez-vous
                  </Form.Label>
                  
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Jour</Form.Label>
                        <Form.Select
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(e.target.value)}
                          className="rounded-pill"
                        >
                          <option value="">Sélectionnez un jour</option>
                          {selectedDoctor?.disponibilite?.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Horaire</Form.Label>
                        <Form.Select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="rounded-pill"
                        >
                          <option value="">Sélectionnez un horaire</option>
                          {availableTimeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
  
                  <Form.Group>
                    <Form.Label>Motif de la consultation</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={consultationReason}
                      onChange={(e) => setConsultationReason(e.target.value)}
                      placeholder="Décrivez brièvement le motif de votre consultation..."
                    />
                  </Form.Group>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Form>
      </Modal.Body>
  
      <Modal.Footer className="bg-light border-top">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div className="steps-indicator">
              Étape {step}/3
            </div>
            <div className="d-flex gap-2">
              {step > 1 && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setStep(step - 1)}
                  className="rounded-pill"
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Retour
                </Button>
              )}
              {step < 3 ? (
                <Button 
                  variant="primary"
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !selectedStructure) || (step === 2 && !selectedDoctor)}
                  className="rounded-pill"
                >
                  Suivant
                  <i className="fas fa-arrow-right ms-1"></i>
                </Button>
              ) : (
                <Button 
                  variant="success"
                  onClick={handleSubmit}
                  disabled={!selectedDay || !selectedTimeSlot || !consultationReason}
                  className="rounded-pill"
                >
                  <i className="fas fa-check me-1"></i>
                  Confirmer la demande
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal.Footer>
  </Modal>

      {/* Modal d'inscription */}
      <Modal show={showRegistrationForm} onHide={() => setShowRegistrationForm(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Inscription dans la structure</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            Vous devez vous inscrire dans cette structure avant de pouvoir prendre rendez-vous.
          </Alert>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control
                    type="text"
                    value={registrationData.nom}
                    onChange={(e) => setRegistrationData({...registrationData, nom: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    value={registrationData.prenom}
                    onChange={(e) => setRegistrationData({...registrationData, prenom: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    value={registrationData.age}
                    onChange={(e) => setRegistrationData({...registrationData, age: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexe</Form.Label>
                  <Form.Select
                    value={registrationData.sexe}
                    onChange={(e) => setRegistrationData({...registrationData, sexe: e.target.value})}
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={registrationData.telephone}
                    onChange={(e) => setRegistrationData({...registrationData, telephone: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="fas fa-file-medical me-2"></i>
                    Assurance
                  </Form.Label>
                  <Select
                    isMulti
                    name="insurances"
                    options={selectedStructure?.insurance?.map(ins => ({
                      value: ins,
                      label: ins
                    })) || []}
                    value={registrationData.insurances.map(ins => ({
                      value: ins,
                      label: ins
                    }))}
                    onChange={(selected) => setRegistrationData({
                      ...registrationData,
                      insurances: selected.map(option => option.value)
                    })}
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Photo</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setPatientPhotoFile(e.target.files[0])}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Documents Médicaux</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setMedicalDocs(files);
                  setPreviewDocs(files.map(file => ({
                    name: file.name,
                    url: URL.createObjectURL(file)
                  })));
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRegistrationForm(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleRegistration}>
            S'inscrire
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .structures-grid,
        .doctors-grid {
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 5px;
        }

        .cursor-pointer {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cursor-pointer:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .basic-multi-select {
          .select__control--is-focused {
            border-color: #0d6efd;
            box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.25);
          }

          .select__multi-value {
            background-color: #e7f5ff;
            border-radius: 20px;
            padding: 2px 8px;
          }

          .select__multi-value__remove {
            border-radius: 50%;
            padding: 2px;
            margin-left: 4px;
          }
        }
      `}</style>
    </>
  );
};

export default PatientDemande;


