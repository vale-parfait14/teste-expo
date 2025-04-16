import React, { useState, useEffect } from 'react';
import { db, storage } from '../components/firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Table, Form, Button, Container, Row, Col, Card, ButtonGroup, Modal, Tab, Tabs } from 'react-bootstrap';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [displayMode, setDisplayMode] = useState('both');
  const [language, setLanguage] = useState('fr');
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    age: '',
    sexe: '',
    telephone: '',
    email: '',
    password: '',
    photo: null,
    certifications: null
  });

  const translations = {
    fr: {
      addPatient: 'Ajouter un patient',
      name: 'Nom',
      firstName: 'Prénom',
      age: 'Age',
      gender: 'Sexe',
      phone: 'Téléphone',
      email: 'Email',
      password: 'Mot de passe',
      photo: 'Photo',
      certifications: 'Documents médicaux',
      save: 'Enregistrer',
      modify: 'Modifier',
      delete: 'Supprimer',
      search: 'Rechercher un patient...',
      table: 'Tableau',
      grid: 'Grille',
      viewDocs: 'Voir documents',
      male: 'Masculin',
      female: 'Féminin',
      select: 'Sélectionner',
      download: 'Télécharger',
      viewInModal: 'Voir les documents',
      actions: 'Actions'
    },
    en: {
      addPatient: 'Add Patient',
      name: 'Name',
      firstName: 'First Name',
      age: 'Age',
      gender: 'Gender',
      phone: 'Phone',
      email: 'Email',
      password: 'Password',
      photo: 'Photo',
      certifications: 'Medical Documents',
      save: 'Save',
      modify: 'Edit',
      delete: 'Delete',
      search: 'Search for a patient...',
      table: 'Table',
      grid: 'Grid',
      viewDocs: 'View documents',
      male: 'Male',
      female: 'Female',
      select: 'Select',
      download: 'Download',
      viewInModal: 'View Documents',
      actions: 'Actions'
    }
  };

  const patientsCollectionRef = collection(db, "patients");

  useEffect(() => {
    getPatients();
  }, []);

  const getPatients = async () => {
    const data = await getDocs(patientsCollectionRef);
    setPatients(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'certifications') {
      setFormData({ ...formData, [name]: Array.from(files) });
    } else {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleShowCerts = (certifications, patient) => {
    setSelectedCerts(certifications);
    setSelectedPatient(patient);
    setShowCertModal(true);
  };

 // Modify the handleEdit function to automatically switch to form view
const handleEdit = (patient) => {
  setEditId(patient.id);
  setFormData({
    nom: patient.nom,
    prenom: patient.prenom,
    age: patient.age,
    sexe: patient.sexe,
    telephone: patient.telephone,
    email: patient.email,
    password: patient.password,
    photo: patient.photo,
    certifications: patient.certifications
  });
  // Add these lines to switch to form view
  setDisplayMode('both');
  // Scroll to the form
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = '';
      let certificationsUrls = [];
  
      // Handle photo upload
      if (formData.photo && formData.photo instanceof File) {
        const photoRef = ref(storage, `photos/${formData.photo.name}`);
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
      }
  
      // Handle certifications upload
      if (formData.certifications && Array.isArray(formData.certifications)) {
        for (const cert of formData.certifications) {
          if (cert instanceof File) {
            const certRef = ref(storage, `certifications/${cert.name}`);
            await uploadBytes(certRef, cert);
            const certUrl = await getDownloadURL(certRef);
            certificationsUrls.push(certUrl);
          }
        }
      }
  
      // Prepare update data
      const updateData = {
        ...formData,
        photo: photoUrl || formData.photo || null,
      };
  
      // Only include certifications if there are new ones or existing ones
      if (certificationsUrls.length > 0) {
        updateData.certifications = certificationsUrls;
      } else if (formData.certifications) {
        updateData.certifications = formData.certifications;
      } else {
        updateData.certifications = [];
      }
  
      if (editId) {
        await updateDoc(doc(db, "patients", editId), updateData);
        setEditId(null);
      } else {
        await addDoc(patientsCollectionRef, updateData);
      }
  
      getPatients();
      setFormData({
        nom: '',
        prenom: '',
        age: '',
        sexe: '',
        telephone: '',
        email: '',
        password: '',
        photo: null,
        certifications: null
      });
    } catch (error) {
      console.error("Error: ", error);
    }
  };
  

  const handleDelete = async (id, nomPatient) => {
    const confirmMessage = language === 'fr' 
      ? `Êtes-vous sûr de vouloir supprimer le patient ${nomPatient} ?`
      : `Are you sure you want to delete patient ${nomPatient}?`;
  
    const isConfirmed = window.confirm(confirmMessage);
    
    if (isConfirmed) {
      await deleteDoc(doc(db, "patients", id));
      getPatients();
    }
  };

  const filteredPatients = patients.filter(patient =>
    Object.values(patient).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Container fluid className="bg-light py-4">
      {/* Header Section */}
      <Row className="mb-3 fixed-top">
  <Col>
    <nav className="navbar navbar-expand-lg navbar-light bg-white rounded shadow-sm">
      <div className="container-fluid">
        {/* Mobile Toggle Button */}
        <Button
          className="navbar-toggler d-lg-none"
          onClick={() => setShowMobileMenu(true)}
        >
          <span className="navbar-toggler-icon"></span>
        </Button>

        {/* Desktop Menu */}
        <div className="navbar-nav me-auto d-none d-lg-flex">
          <Button
            variant={displayMode === 'form' ? 'primary' : 'light'}
            onClick={() => setDisplayMode('form')}
            className="me-2"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {translations[language].addPatient}
          </Button>
          <Button
            variant={displayMode === 'list' ? 'primary' : 'light'}
            onClick={() => setDisplayMode('list')}
            className="me-2"
          >
            <i className="fas fa-list me-2"></i>
            {translations[language].table}
          </Button>
          <Button
            variant={displayMode === 'both' ? 'primary' : 'light'}
            onClick={() => setDisplayMode('both')}
            className="me-2"
          >
            <i className="fas fa-columns me-2"></i>
            {translations[language].table} + {translations[language].addPatient}
          </Button>
        </div>

        <Button
          variant="outline-primary"
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="rounded-pill"
        >
          {language === 'en' ? 'Français' : 'English'}
        </Button>
      </div>
    </nav>

    {/* Mobile Menu Modal */}
    <Modal
      show={showMobileMenu}
      onHide={() => setShowMobileMenu(false)}
      centered
      size="sm"
    >
      <Modal.Header closeButton>
        <Modal.Title>{translations[language].menu}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column gap-2">
          <Button
            variant={displayMode === 'form' ? 'primary' : 'light'}
            onClick={() => {
              setDisplayMode('form');
              setShowMobileMenu(false);
            }}
            className="w-100"
          >
            <i className="fas fa-plus-circle me-2"></i>
            {translations[language].addPatient}
          </Button>
          <Button
            variant={displayMode === 'list' ? 'primary' : 'light'}
            onClick={() => {
              setDisplayMode('list');
              setShowMobileMenu(false);
            }}
            className="w-100"
          >
            <i className="fas fa-list me-2"></i>
            {translations[language].table}
          </Button>
          <Button
            variant={displayMode === 'both' ? 'primary' : 'light'}
            onClick={() => {
              setDisplayMode('both');
              setShowMobileMenu(false);
            }}
            className="w-100"
          >
            <i className="fas fa-columns me-2"></i>
            {translations[language].table} + {translations[language].addPatient}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  </Col>
</Row>

  
      <Row className="g-4 mt-3">
      {(displayMode === 'form' || displayMode === 'both') && (
  <Col md={displayMode === 'both' ? 4 : 12}>
    <div className={`bg-white shadow-sm rounded p-4 ${editId ? 'editing-form' : ''}`}>

        <Form onSubmit={handleSubmit}>
          <h3 className="border-bottom pb-3 mb-4">{translations[language].addPatient}</h3>
          
          {/* Navigation tabs for form pages */}
          <Tabs defaultActiveKey="page1" className="mb-1 nav-fill">
            <Tab eventKey="page1" title="Personal Info">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].name}</Form.Label>
                    <Form.Control type="text" name="nom" value={formData.nom} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].firstName}</Form.Label>
                    <Form.Control type="text" name="prenom" value={formData.prenom} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].age}</Form.Label>
                    <Form.Control type="number" name="age" value={formData.age} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].gender}</Form.Label>
                    <Form.Select name="sexe" value={formData.sexe} onChange={handleInputChange} className="shadow-sm">
                      <option value="">{translations[language].select}</option>
                      <option value="M">{translations[language].male}</option>
                      <option value="F">{translations[language].female}</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

             
            </Tab>

            <Tab eventKey="page2" title="Contact Info">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].phone}</Form.Label>
                    <Form.Control type="tel" name="telephone" value={formData.telephone} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].email}</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].password}</Form.Label>
                    <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
                
              </Row>
            </Tab>

            <Tab eventKey="page3" title="Documents">
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">{translations[language].photo}</Form.Label>
                <Form.Control type="file" name="photo" onChange={handleFileChange} className="shadow-sm" />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">{translations[language].certifications}</Form.Label>
                <Form.Control type="file" name="certifications" onChange={handleFileChange} multiple className="shadow-sm" />
              </Form.Group>
            </Tab>
          </Tabs>

          <Button variant="primary" type="submit" className="w-100 py-2 mt-4 shadow-sm">
            {editId ? translations[language].modify : translations[language].save}
          </Button>
        </Form>
      </div>
    </Col>
  )}
  <style jsx>{`
  .editing-form {
    animation: highlight 1s ease;
    border: 2px solid #007bff;
  }

  @keyframes highlight {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(0,123,255,0);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 20px rgba(0,123,255,0.3);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 rgba(0,123,255,0);
    }
  }
`}</style>

<style jsx>
  {`
  .nav-tabs .nav-link {
  transition: all 0.3s ease;
  position: relative;
}

.nav-tabs .nav-link.active {
  transform: scale(1.05);
  z-index: 1;
}

.tab-content {
  position: relative;
  transition: all 0.3s ease;
}

.tab-pane {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

  `}
</style>  
  {/* Rest of your existing list section code */}
  {(displayMode === 'list' || displayMode === 'both') && (
  <Col md={displayMode === 'both' ? 8 : 12}>
    <div className="bg-white shadow-sm rounded p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Form.Group className="flex-grow-1 me-3">
          <Form.Control
            type="text"
            placeholder={translations[language].search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-sm"
          />
        </Form.Group>
        <ButtonGroup className="shadow-sm">
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('table')}
          >
            <i className="fas fa-table me-2"></i>
            {translations[language].table}
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline-primary'}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th me-2"></i>
            {translations[language].grid}
          </Button>
        </ButtonGroup>
      </div>

      {viewMode === 'table' ? (
        <div className="table-responsive">
          <Table className="table-hover border">
            <thead className="bg-light">
              <tr>
                <th>{translations[language].photo}</th>
                <th>{translations[language].name}</th>
                <th>{translations[language].firstName}</th>
                <th>{translations[language].age}</th>
                <th>{translations[language].gender}</th>
                <th>{translations[language].phone}</th>
                <th>{translations[language].email}</th>
                <th>{translations[language].password}</th>
                <th>{translations[language].certifications}</th>
                <th>{translations[language].actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    {patient.photo && (
                      <img
                        src={patient.photo}
                        alt="Photo"
                        className="rounded-circle"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    )}
                  </td>
                  <td>{patient.nom}</td>
                  <td>{patient.prenom}</td>
                  <td>{patient.age}</td>
                  <td>{patient.sexe}</td>
                  <td>{patient.telephone}</td>
                  <td>{patient.email}</td>
                  <td>{patient.password}</td>
                  <td>
                    {patient.certifications && (
                      <Button
                        variant="link"
                        onClick={() => handleShowCerts(patient.certifications, patient)}
                        className="text-decoration-none"
                      >
                        <i className="fas fa-file-medical me-2"></i>
                        {translations[language].viewDocs}
                      </Button>
                    )}
                  </td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button
                        variant="warning"
                        onClick={() => handleEdit(patient)}
                        className="me-2"
                      >
                        <i className="fas fa-edit me-1"></i>
                        {translations[language].modify}
                      </Button>
                      <Button
  variant="danger"
  size="sm"
  onClick={() => handleDelete(patient.id, `${patient.nom} ${patient.prenom}`)}
>
  <i className="fas fa-trash-alt me-2"></i>
  {translations[language].delete}
</Button>

                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Row className="g-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
  {filteredPatients.map((patient) => (
    <Col key={patient.id} md={6} lg={4}>
      <div className="card-flip">
        <div className="card-inner">
          <div className="card-front">
            <Card className="h-100 shadow-sm hover-shadow">
              {patient.photo && (
                <Card.Img
                  variant="top"
                  src={patient.photo}
                  style={{ height: '400px', objectFit: 'cover' }}
                />
              )}
              <div className="text-center p-3">
                <h5>{patient.nom} {patient.prenom}</h5>
                <p className="text-muted">{patient.specialite}</p>
              </div>
            </Card>
          </div>
          
          <div className="card-back">
            <Card className="h-100 shadow-sm hover-shadow">
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Card.Title className="border-bottom pb-2">
                  {patient.nom} {patient.prenom}
                </Card.Title>
                <Card.Text>
                  
                  <div className="mb-2">
                    <strong>{translations[language].age}:</strong> {patient.age}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].gender}:</strong> {patient.sexe}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].phone}:</strong> {patient.telephone}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].email}:</strong> {patient.email}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].password}:</strong> {patient.password}
                  </div>
                 
                </Card.Text>
                {patient.certifications && (
                  <Button
                    variant="outline-primary"
                    onClick={() => handleShowCerts(patient.certifications, patient)}
                    className="w-100 mb-3"
                  >
                    <i className="fas fa-file-medical me-2"></i>
                    {translations[language].viewDocs}
                  </Button>
                )}
                <div className="d-grid gap-2">
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleEdit(patient)}
                  >
                    <i className="fas fa-edit me-2"></i>
                    {translations[language].modify}
                  </Button>
                  <Button
  variant="danger"
  size="sm"
  onClick={() => handleDelete(patient.id, `${patient.nom} ${patient.prenom}`)}
>
  <i className="fas fa-trash-alt me-2"></i>
  {translations[language].delete}
</Button>


                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </Col>
  ))}

  <style jsx>
    {`
    
    .card-flip {
  perspective: 1000px;
  height: 400px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
  cursor: pointer;
}

.card-flip:hover .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
`}
</style>
</Row>

      )}
    </div>
  </Col>
)}

</Row>

  
      <Modal 
        show={showCertModal} 
        onHide={() => setShowCertModal(false)} 
        size="lg"
        className="shadow"
      >
        <Modal.Header closeButton className="bg-light">
  <Modal.Title className="fw-bold">
    <div className="d-flex align-items-center">
      <i className="fas fa-file-medical me-2"></i>
      <div>
        <div>{translations[language].certifications}</div>
        <div className="fs-6 text-muted">
          Patient : {selectedPatient?.nom} {selectedPatient?.prenom}
        </div>
      </div>
    </div>
  </Modal.Title>
</Modal.Header>

        <Modal.Body className="p-4">
          <Row className="g-4">
            {selectedCerts.map((cert, index) => (
              <Col md={6} key={index}>
                <div className="certification-preview border rounded p-3">
                  <div className="ratio ratio-4x3 mb-3">
                    <iframe 
                      src={cert} 
                      title={`Certification ${index + 1}`}
                      className="rounded"
                      allowFullScreen
                  />
                </div>
                <a 
                  href={cert} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary w-100"
                >
                  <i className="fas fa-download me-2"></i>
                  {translations[language].download}
                </a>
              </div>
            </Col>
          ))}
        </Row>
      </Modal.Body>
    </Modal>

  </Container>
);

};

export default Patients;
