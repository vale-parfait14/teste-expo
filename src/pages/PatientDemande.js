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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Détecter la taille de l'écran pour l'affichage responsive
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Déterminer si l'affichage est mobile
  const isMobile = windowWidth < 768;

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

  // Styles spécifiques pour les select en version mobile
        const mobileSelectStyles = {
                control: (provided) => ({
                  ...provided,
                  minHeight: '38px',
                  fontSize: '0.875rem',
                }),
                valueContainer: (provided) => ({
                  ...provided,
                  padding: '0 8px',
                }),
                input: (provided) => ({
                  ...provided,
                  margin: '0',
                  padding: '0',
                }),
                indicatorsContainer: (provided) => ({
                  ...provided,
                  height: '38px',
                }),
                option: (provided) => ({
                  ...provided,
                  fontSize: '0.875rem',
                  padding: '8px 12px',
                }),
        };


  return (
    <Container fluid className="p-0 h-100">
      <Row className="g-0 h-100">
        <Col xs={12} className="h-100">
          <Card className="shadow border-0 rounded-0 h-100">
            <Card.Header className="bg-primary text-white">
              <h4 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>
                <FaHospital className="me-2" />
                Demande d'ajout à une structure médicale
              </h4>
            </Card.Header>
            <Card.Body className={`${isMobile ? 'p-2' : 'p-4'} overflow-auto`}>
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              {patientInfo ? (
                <Form onSubmit={handleSubmit} className="w-100">
                  <div className="patient-info-summary mb-4 p-3 bg-light rounded">
                    <h5 className={`border-bottom pb-2 mb-3 ${isMobile ? 'fs-6' : ''}`}>Vos informations</h5>
                    <Row>
                      <Col xs={12} md={6}>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Nom:</strong> {patientInfo.nom}</p>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Prénom:</strong> {patientInfo.prenom}</p>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Âge:</strong> {patientInfo.age} ans</p>
                      </Col>
                      <Col xs={12} md={6}>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Sexe:</strong> {patientInfo.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Email:</strong> {patientInfo.email}</p>
                        <p className={isMobile ? 'mb-2 small' : 'mb-2'}><strong>Téléphone:</strong> {patientInfo.telephone}</p>
                      </Col>
                    </Row>
                    {patientInfo.insurance && patientInfo.insurance.length > 0 && (
                      <div>
                        <p className={isMobile ? 'mb-1 small' : 'mb-2'}><strong>Assurances:</strong> {patientInfo.insurance.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  <Form.Group className="mb-3 mb-md-4">
                    <Form.Label className={isMobile ? 'fs-6' : ''}>
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
                      styles={isMobile ? mobileSelectStyles : {}}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 mb-md-4">
                    <Form.Label className={isMobile ? 'fs-6' : ''}>
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
                      styles={isMobile ? mobileSelectStyles : {}}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 mb-md-4">
                    <Form.Label className={isMobile ? 'fs-6' : ''}>
                      <FaFileUpload className="me-2" />
                      Documents médicaux (facultatif)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleDocumentsChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      size={isMobile ? 'sm' : undefined}
                    />
                    <Form.Text className={`text-muted ${isMobile ? 'small' : ''}`}>
                      Vous pouvez joindre des documents médicaux pertinents pour faciliter votre prise en charge.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading || !selectedStructure || !selectedSpecialty}
                      size={isMobile ? 'sm' : undefined}
                      className="mt-2"
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
                <Alert variant="warning" className={isMobile ? 'p-2 small' : ''}>
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
          width: 100%;
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
          width: 100%;
        }
        
        @media (max-width: 767px) {
          .patient-info-summary {
            padding: 0.75rem !important;
          }
        }
      `}</style>
      
    </Container>
  );
};


export default PatientDemande;
