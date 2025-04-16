import React, { useState, useEffect } from 'react';
import { db } from '../components/firebase-config.js';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Container, Row, Col, Card, Button, Modal, Nav, ButtonGroup, Form } from 'react-bootstrap';

const translations = {
  en: {
    title: 'Structures Attributions',
    email: 'Email',
    address: 'Address',
    creationYear: 'Creation Year',
    responsible: 'Responsible',
    website: 'Website',
    mobile: 'Mobile',
    landline: 'Landline',
    insurance: 'Insurance',
    documents: 'Documents',
    structureDoc: 'Structure Document',
    stateDoc: 'State Document',
    preview: 'Preview',
    close: 'Close',
    openInNewTab: 'Open in New Tab',
    doctors: 'Doctors',
    specialty: 'Specialty',
    availability: 'Availability',
    contact: 'Contact',
    viewCertifications: 'View Certifications',
    schedule: 'Schedule',
    startTime: 'Start Time',
    endTime: 'End Time',
    availableDays: 'Available Days',
    timeSlots: 'Time Slots',
    name: 'Name',
    firstName: 'First Name',
    age: 'Age',
    gender: 'Gender',
    phone: 'Phone',
    password: 'Password',
    male: 'Male',
    female: 'Female',
    select: 'Select',
    download: 'Download',
    viewDocs: 'View documents',
    actions: 'Actions',
    patients: 'Patients',
    assignDoctors: 'Assign Doctors',
    affiliatedDoctors: 'Affiliated Doctors',
    selectDoctors: 'Select Doctors',
    save: 'Save',
    structures: 'Structures',
    selectView: 'Select View',
    maxDoctors: 'Maximum Doctors',
    doctorsLimit: 'Maximum number of doctors reached',
    remainingSlots: 'Remaining slots',
    affiliatedStructures: 'Affiliated Structures',
    menu: 'Menu',
    assignPatients: 'Assign Patients',
    affiliatedPatients: 'Affiliated Patients',
    maxPatients: 'Maximum Patients',
    remainingPatientSlots: 'Remaining Patient Slots',
    monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      TimeSlots:"Time Slots",
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
  },
  fr: {
    title: 'Attributions des Structures',
    email: 'Email',
    address: 'Adresse',
    creationYear: 'Année de création',
    responsible: 'Responsable',
    website: 'Site web',
    mobile: 'Mobile',
    landline: 'Fixe',
    insurance: 'Assurance',
    documents: 'Documents',
    structureDoc: 'Document de structure',
    stateDoc: 'Document d\'état',
    preview: 'Aperçu',
    close: 'Fermer',
    openInNewTab: 'Ouvrir dans un nouvel onglet',
    doctors: 'Médecins',
    specialty: 'Spécialité',
    availability: 'Disponibilité',
    contact: 'Contact',
    viewCertifications: 'Voir les certifications',
    schedule: 'Horaires',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    availableDays: 'Jours disponibles',
    timeSlots: 'Créneaux',
    name: 'Nom',
    firstName: 'Prénom',
    age: 'Age',
    gender: 'Sexe',
    phone: 'Téléphone',
    password: 'Mot de passe',
    male: 'Masculin',
    female: 'Féminin',
    select: 'Sélectionner',
    download: 'Télécharger',
    viewDocs: 'Voir documents',
    actions: 'Actions',
    patients: 'Patients',
    assignDoctors: 'Affecter des Médecins',
    affiliatedDoctors: 'Médecins Affiliés',
    selectDoctors: 'Sélectionner des Médecins',
    save: 'Enregistrer',
    structures: 'Structures',
    selectView: 'Sélectionner la Vue',
    maxDoctors: 'Nombre maximum de médecins',
    doctorsLimit: 'Nombre maximum de médecins atteint',
    remainingSlots: 'Places restantes',
    affiliatedStructures: 'Structures Affiliées',
    menu: 'Menu',
    assignPatients: 'Affecter des Patients',
    affiliatedPatients: 'Patients Affiliés',
    maxPatients: 'Nombre maximum de patients',
    remainingPatientSlots: 'Places patients restantes',
    monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
      TimeSlots:"Créneaux",
      monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  }
};
const Attributions = () => {
  const [structures, setStructures] = useState([]);
  const [language, setLanguage] = useState('fr');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeSection, setActiveSection] = useState('structures');
  const [showAffiliatedDoctors, setShowAffiliatedDoctors] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedDoctorsIds, setSelectedDoctorsIds] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeView, setActiveView] = useState('structures');
  const [showAffiliatedPatients, setShowAffiliatedPatients] = useState(false);
  const [selectedPatientsIds, setSelectedPatientsIds] = useState([]);
  
  const t = translations[language];

  // Add this function after the useEffect hooks
// Update the existing useEffect to use the new function
useEffect(() => {
  const fetchData = async () => {
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const structuresSnapshot = await getDocs(collection(db, 'structures'));
    
    await fetchDoctorsData();
    setPatients(patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setStructures(structuresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  fetchData();
}, []);


  const handleImagePreview = (structure) => {
    setSelectedStructure(structure);
    setShowImageModal(true);
  };

  const handleDocPreview = (docUrl) => {
    setSelectedDoc(docUrl);
    setShowDocModal(true);
  };

  const handleSaveAffiliation = async () => {
    if (selectedStructure) {
      try {
        // Mise à jour des médecins affiliés à la structure
        await updateDoc(doc(db, 'structures', selectedStructure.id), {
          affiliatedDoctors: selectedDoctorsIds
        });
  
        // Mise à jour de la liste des structures pour chaque médecin
        const allDoctorsToUpdate = doctors.filter(doctor => 
          // Inclure les médecins sélectionnés ET désélectionnés
          selectedDoctorsIds.includes(doctor.id) || 
          (doctor.structures && doctor.structures.includes(selectedStructure.id))
        );
  
        const updatePromises = allDoctorsToUpdate.map(doctor => {
          let updatedStructures;
          if (selectedDoctorsIds.includes(doctor.id)) {
            // Ajouter la structure
            updatedStructures = [...new Set([...(doctor.structures || []), selectedStructure.id])];
          } else {
            // Retirer la structure
            updatedStructures = (doctor.structures || []).filter(id => id !== selectedStructure.id);
          }
          
          return updateDoc(doc(db, 'medecins', doctor.id), {
            structures: updatedStructures
          });
        });
  
        await Promise.all(updatePromises);
  
        // Mise à jour de l'état local
        const updatedDoctors = doctors.map(doctor => {
          if (selectedDoctorsIds.includes(doctor.id)) {
            return {
              ...doctor,
              structures: [...new Set([...(doctor.structures || []), selectedStructure.id])]
            };
          } else if (doctor.structures?.includes(selectedStructure.id)) {
            return {
              ...doctor,
              structures: doctor.structures.filter(id => id !== selectedStructure.id)
            };
          }
          return doctor;
        });
  
        setDoctors(updatedDoctors);
        setStructures(structures.map(structure =>
          structure.id === selectedStructure.id
            ? { ...structure, affiliatedDoctors: selectedDoctorsIds }
            : structure
        ));
  
        setShowAffiliatedDoctors(false);
        
      } catch (error) {
        console.error("Erreur lors de la mise à jour des affiliations:", error);
      }
    }
  };
  
  

  const handleSavePatientAffiliation = async () => {
    if (selectedStructure) {
      try {
        await updateDoc(doc(db, 'structures', selectedStructure.id), {
          affiliatedPatients: selectedPatientsIds
        });
        
        setStructures(structures.map(structure => 
          structure.id === selectedStructure.id 
            ? { ...structure, affiliatedPatients: selectedPatientsIds }
            : structure
        ));
        
        setShowAffiliatedPatients(false);
      } catch (error) {
        console.error("Error updating affiliations:", error);
      }
    }
  };

  const fetchDoctorsData = async () => {
    const doctorsSnapshot = await getDocs(collection(db, 'medecins'));
    const doctorsData = doctorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      disponibilite: doc.data().disponibilite || [],
      joursDisponibles: doc.data().joursDisponibles || [],
      heureDebut: doc.data().heureDebut || '',
      heureFin: doc.data().heureFin || '',
      visibility: doc.data().visibility || 'all',
      structures: doc.data().structures || []
    }));
    setDoctors(doctorsData);
  };

  return (
    <Container fluid className="py-4">
      {/* Navigation Section */}
      <Row className="mb-5 fixed-top bg-white shadow-sm py-3">
        <Col>
          <div className="d-flex d-md-none justify-content-between align-items-center">
            <Button
              variant="primary"
              onClick={() => setShowMobileMenu(true)}
              className="py-2 shadow-sm"
              style={{ width: '20%' }}
            >
              <i className="bi bi-list me-2"></i>
              {t.menu}
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="rounded-pill px-3 py-2 shadow-sm"
            >
              <i className="bi bi-globe me-2"></i>
              {language === 'en' ? 'FR' : 'EN'}
            </Button>
          </div>

          <div className="d-none d-md-flex justify-content-between align-items-center">
            <ButtonGroup className="shadow-sm">
              <Button
                variant={activeView === 'structures' ? 'primary' : 'light'}
                onClick={() => setActiveView('structures')}
                className="px-4 py-2"
              >
                <i className="bi bi-building me-2"></i>
                {t.structures}
              </Button>
              <Button
                variant={activeView === 'doctors' ? 'primary' : 'light'}
                onClick={() => setActiveView('doctors')}
                className="px-4 py-2"
              >
                <i className="bi bi-person-badge me-2"></i>
                {t.doctors}
              </Button>
              <Button
                variant={activeView === 'patients' ? 'primary' : 'light'}
                onClick={() => setActiveView('patients')}
                className="px-4 py-2"
              >
                <i className="bi bi-people me-2"></i>
                {t.patients}
              </Button>
            </ButtonGroup>

            <Button
              variant="outline-primary"
              onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
              className="rounded-pill px-4 py-2 shadow-sm"
            >
              <i className="bi bi-globe me-2"></i>
              {language === 'en' ? 'Français' : 'English'}
            </Button>
          </div>
        </Col>
      </Row>
      {/* Main Content */}
      <Row className="mt-5">
        <Col>
          {/* Structures View */}
          {activeView === 'structures' && (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">{t.title}</h4>
              </Card.Header>
              <Card.Body>
                {structures.map(structure => (
                  <div key={structure.id} className="mb-4 p-3 border rounded">
                    <h5>{structure.name}</h5>
                    <div className="row">
                      <div className="col-md-3">
                        <p><strong>{t.email}:</strong> {structure.email}</p>
                        <p><strong>{t.password}:</strong> {structure.password}</p> {/* Added password field */}
                        <p><strong>{t.address}:</strong> {structure.address}</p>
                        <p><strong>{t.creationYear}:</strong> {structure.creationYear}</p>
                        <p><strong>{t.responsible}:</strong> {structure.responsible}</p>
                      </div>
                      <div className="col-md-3">
                        <p><strong>{t.website}:</strong> {structure.website}</p>
                        <p><strong>{t.mobile}:</strong> {structure.phones?.mobile}</p>
                        <p><strong>{t.landline}:</strong> {structure.phones?.landline}</p>
                        <p><strong>{t.insurance}:</strong> {structure.insurance?.join(', ')}</p>
                      </div>
                      <div className="col-md-3">
  <div className="mb-3">
    <label htmlFor="maxDoctors" className="form-label">
      <strong>{t.maxDoctors}:</strong>
    </label>
    <input
      type="number"
      className="form-control"
      id="maxDoctors"
      value={structure.maxDoctors || ''}
      onChange={async (e) => {
        const newValue = parseInt(e.target.value) || 0;
        await updateDoc(doc(db, 'structures', structure.id), {
          maxDoctors: newValue
        });
        setStructures(structures.map(s => 
          s.id === structure.id 
            ? {...s, maxDoctors: newValue}
            : s
        ));
      }}
      min="0"
    />
  </div>
  {structure.maxDoctors > 0 && (
    <p><strong>{t.remainingSlots}:</strong> {structure.maxDoctors - (structure.affiliatedDoctors?.length || 0)}</p>
  )}
  <p><strong>{t.affiliatedDoctors}:</strong> {structure.affiliatedDoctors?.length || 0}</p>
</div>

<div className="col-md-3">
  {/* Existing maxDoctors input */}
  <div className="mb-3">
    <label htmlFor="maxPatients" className="form-label">
      <strong>{t.maxPatients}:</strong>
    </label>
    <input
      type="number"
      className="form-control"
      id="maxPatients"
      value={structure.maxPatients || ''}
      onChange={async (e) => {
        const newValue = parseInt(e.target.value) || 0;
        await updateDoc(doc(db, 'structures', structure.id), {
          maxPatients: newValue
        });
        setStructures(structures.map(s => 
          s.id === structure.id 
            ? {...s, maxPatients: newValue}
            : s
        ));
      }}
      min="0"
    />
  </div>
  {structure.maxPatients > 0 && (
    <p><strong>{t.remainingSlots}:</strong> {structure.maxPatients - (structure.affiliatedPatients?.length || 0)}</p>
  )}
  <p><strong>{t.affiliatedPatients}:</strong> {structure.affiliatedPatients?.length || 0}</p>
</div>

                      <div className="col-md-3">
                        <h6>{t.documents}:</h6>
                        {structure.documents?.structureDocUrl && (
                          <Button
                            variant="link"
                            onClick={() => handleDocPreview(structure.documents.structureDocUrl)}
                          >
                            <i className="bi bi-file-earmark-text"></i> {t.structureDoc}
                          </Button>
                        )}
                        {structure.documents?.stateDocUrl && (
                          <Button
                            variant="link"
                            onClick={() => handleDocPreview(structure.documents.stateDocUrl)}
                          >
                            <i className="bi bi-file-earmark-text"></i> {t.stateDoc}
                          </Button>
                        )}
                      </div>
                    </div>

                    
                    <div className="d-flex gap-2 mt-3">
                      {structure.photoUrl && (
                        <img
                          src={structure.photoUrl}
                          alt={structure.name}
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', cursor: 'pointer' }}
                          className="mt-2 rounded"
                          onClick={() => handleImagePreview(structure)}
                        />
                      )}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedStructure(structure);
                          setSelectedDoctorsIds(structure.affiliatedDoctors || []);
                          setShowAffiliatedDoctors(true);
                        }}
                      >
                        <i className="bi bi-people-fill me-2"></i>
                        {t.assignDoctors}
                      </Button>
                      <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedStructure(structure);
                            setSelectedPatientsIds(structure.affiliatedPatients || []);
                            setShowAffiliatedPatients(true);
                          }}
                        >
                          <i className="bi bi-people-fill me-2"></i>
                          {t.assignPatients}
                        </Button>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
          {/* Doctors View */}
          {activeView === 'doctors' && (
            <Card>
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">{t.doctors}</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                {doctors.map(doctor => (
  <Col key={doctor.id} md={4} className="mb-4">
    <Card className="h-100 shadow-sm">
      {doctor.photo && (
        <Card.Img
          variant="top"
          src={doctor.photo}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      )}
      <Card.Body>
        <Card.Title>{doctor.nom} {doctor.prenom}</Card.Title>
        <Card.Text>
  <p><strong>{t.specialty}:</strong> {doctor.specialite}</p>
  <p><strong>{t.affiliatedStructures}:</strong></p>
  <ul className="list-unstyled">
    {structures
      .filter(structure => 
        doctor.visibility === 'all' || 
        (doctor.structures && doctor.structures.includes(structure.id))
      )
      .map(structure => (
        <li key={structure.id} className="mb-2">
          <i className="bi bi-building me-2"></i>
          {structure.name}
        </li>
      ))
    }
  </ul>
  <p><strong>{t.availability}:</strong></p>
  <ul className="list-unstyled">
    {doctor.disponibilite?.map(day => (
      <li key={day} className="mb-1">
        <i className="bi bi-calendar-check me-2"></i>
        {t[day]}
      </li>
    ))}
  </ul>
  <p><strong>{t.schedule}:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
  <p><strong>{t.contact}:</strong></p>
  <p>{t.email}: {doctor.email}</p>
  <p>{t.phone}: {doctor.telephone}</p>
</Card.Text>

      </Card.Body>
    </Card>
  </Col>
))}

                </Row>
              </Card.Body>
            </Card>
          )}
          {/* Patients View */}
          {activeView === 'patients' && (
  <Card>
    <Card.Header className="bg-primary text-white">
      <h4 className="mb-0">{t.patients}</h4>
    </Card.Header>
    <Card.Body>
      <Row>
        {patients.map(patient => (
          <Col key={patient.id} md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              {patient.photo && (
                <Card.Img
                  variant="top"
                  src={patient.photo}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <Card.Body>
                <Card.Title>{patient.nom} {patient.prenom}</Card.Title>
                <Card.Text>
                  <p><strong>{t.age}:</strong> {patient.age}</p>
                  <p><strong>{t.gender}:</strong> {patient.sexe}</p>
                  <p><strong>{t.affiliatedStructures}:</strong></p>
                  <ul className="list-unstyled">
                    {structures
                      .filter(structure => structure.affiliatedPatients?.includes(patient.id))
                      .map(structure => (
                        <li key={structure.id} className="mb-1">
                          <i className="bi bi-building me-2"></i>
                          {structure.name}
                        </li>
                      ))
                    }
                  </ul>
                  <p><strong>{t.contact}:</strong></p>
                  <p>{t.email}: {patient.email}</p>
                  <p>{t.phone}: {patient.telephone}</p>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Card.Body>
  </Card>
)}

        </Col>
      </Row>

      {/* Modals */}
      {/* Structure Image Modal with Affiliated Doctors */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedStructure?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <img
              src={selectedStructure?.photoUrl}
              alt={selectedStructure?.name}
              style={{ maxWidth: '100%', maxHeight: '300px' }}
            />
          </div>
          <h5 className="mb-3">{t.affiliatedDoctors}</h5>
          <Row>
            {doctors
              .filter(doc => selectedStructure?.affiliatedDoctors?.includes(doc.id))
              .map(doctor => (
                <Col key={doctor.id} md={6} className="mb-3">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <Card.Title>{doctor.nom} {doctor.prenom}</Card.Title>
                      <Card.Text>
                        <p><strong>{t.specialty}:</strong> {doctor.specialite}</p>
                        <p><strong>{t.contact}:</strong> {doctor.telephone}</p>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
          </Row>
        </Modal.Body>
      </Modal>
      

      {/* Modal patient affilied*/}
      <Modal
  show={showAffiliatedPatients}
  onHide={() => setShowAffiliatedPatients(false)}
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>
      {t.assignPatients} - {selectedStructure?.name}
      {selectedStructure?.maxPatients && (
        <small className="d-block text-muted">
          {t.remainingPatientSlots}: {selectedStructure.maxPatients - selectedPatientsIds.length}
        </small>
      )}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      {patients.map(patient => {
        const isChecked = selectedPatientsIds.includes(patient.id);
        const isDisabled = !isChecked && 
          selectedStructure?.maxPatients && 
          selectedPatientsIds.length >= selectedStructure.maxPatients;

        return (
          <Form.Check
            key={patient.id}
            type="checkbox"
            id={`patient-${patient.id}`}
            label={`${patient.nom} ${patient.prenom}`}
            checked={isChecked}
            disabled={isDisabled}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPatientsIds([...selectedPatientsIds, patient.id]);
              } else {
                setSelectedPatientsIds(selectedPatientsIds.filter(id => id !== patient.id));
              }
            }}
            className="mb-2"
          />
        );
      })}
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowAffiliatedPatients(false)}>
      {t.close}
    </Button>
    <Button variant="primary" onClick={handleSavePatientAffiliation}>
      {t.save}
    </Button>
  </Modal.Footer>
</Modal>


      {/* Assign Doctors Modal */}
      <Modal
        show={showAffiliatedDoctors}
        onHide={() => setShowAffiliatedDoctors(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {t.assignDoctors} - {selectedStructure?.name}
            {selectedStructure?.maxDoctors && (
              <small className="d-block text-muted">
                {t.remainingSlots}: {selectedStructure.maxDoctors - selectedDoctorsIds.length}
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>


<Form>
  {doctors.map(doctor => {
    const isChecked = selectedDoctorsIds.includes(doctor.id) || 
                     (doctor.structures && doctor.structures.includes(selectedStructure?.id));
    const isDisabled = !isChecked &&
      selectedStructure?.maxDoctors &&
      selectedDoctorsIds.length >= selectedStructure.maxDoctors;

    return (
      <Form.Check
        key={doctor.id}
        type="checkbox"
        id={`doctor-${doctor.id}`}
        label={
          <span className={isDisabled ? 'text-muted' : ''}>
            {doctor.nom} {doctor.prenom} - {doctor.specialite}
            {doctor.structures?.includes(selectedStructure?.id) && 
              <span className="text-success ms-2">(Déjà affilié)</span>}
          </span>
        }
        checked={isChecked}
        disabled={isDisabled}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedDoctorsIds([...selectedDoctorsIds, doctor.id]);
          } else {
            setSelectedDoctorsIds(selectedDoctorsIds.filter(id => id !== doctor.id));
          }
        }}
        className="mb-2"
      />
    );
  })}
</Form>

        </Modal.Body>
        <Modal.Footer>
  <Button variant="secondary" onClick={() => setShowAffiliatedDoctors(false)}>
    {t.close}
  </Button>
  <Button variant="primary" onClick={handleSaveAffiliation}>
    {t.save}
  </Button>
</Modal.Footer>

      </Modal>
      {/* Document Preview Modal */}
      <Modal show={showDocModal} onHide={() => setShowDocModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t.preview}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <iframe
            src={selectedDoc}
            width="100%"
            height="600px"
            title="Document Preview"
            style={{ border: 'none' }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocModal(false)}>
            {t.close}
          </Button>
          <Button
            variant="primary"
            href={selectedDoc}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.openInNewTab}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Doctor Certifications Modal */}
      <Modal show={showDoctorModal} onHide={() => setShowDoctorModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedDoctor?.nom} {selectedDoctor?.prenom} - {t.viewCertifications}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {selectedDoctor?.certifications?.map((cert, index) => (
              <Col key={index} md={6} className="mb-3">
                <div className="certification-preview">
                  <iframe
                    src={cert}
                    title={`Certification ${index + 1}`}
                    width="100%"
                    height="400"
                    className="border rounded"
                  />
                  <a
                    href={cert}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mt-2 w-100"
                  >
                    {t.openInNewTab}
                  </a>
                </div>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .mobile-nav-modal .modal-content {
          border-radius: 1rem;
          border: none;
        }

        .mobile-nav-modal .modal-header {
          padding: 1.5rem;
        }

        .mobile-nav-modal .modal-title {
          font-weight: 600;
        }

        .mobile-nav-modal .btn {
          border-radius: 0.75rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .mobile-nav-modal .btn:hover {
          transform: translateY(-2px);
        }

        .btn-group .btn:focus {
          box-shadow: none;
        }

        .rounded-pill {
          transition: all 0.3s ease;
        }

        .rounded-pill:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </Container>
  );
};

export default Attributions;
