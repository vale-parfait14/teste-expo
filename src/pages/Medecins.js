import React, { useState, useEffect } from 'react';
import { db, storage } from '../components/firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Table, Form, Button, Container, Row, Col, Card, ButtonGroup, Modal,Tab, Tabs } from 'react-bootstrap';

const Medecins = () => {
  const [medecins, setMedecins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [displayMode, setDisplayMode] = useState('both');
  const [language, setLanguage] = useState('fr');
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [structures, setStructures] = useState([]);
  const [selectedStructures, setSelectedStructures] = useState([]);
  

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    specialite: '',
    telephone: '',
    email: '',
    password: '',
    disponibilite: [],
    photo: null,
    certifications: null,
    heureDebut: '',
    heureFin: '',
    joursDisponibles: [],
    structures: [], // Add this field
  visibility: 'all',
    });

  const translations = {
    fr: {
      addDoctor: 'Ajouter un médecin',
      name: 'Nom',
      firstName: 'Prénom',
      age: 'Age',
      gender: 'Sexe',
      specialty: 'Spécialité',
      phone: 'Téléphone',
      email: 'Email',
      password: 'Mot de passe',
      availability: 'Disponibilité',
      photo: 'Photo',
      certifications: 'Certifications',
      save: 'Enregistrer',
      modify: 'Modifier',
      delete: 'Supprimer',
      search: 'Rechercher un médecin...',
      table: 'Tableau',
      grid: 'Grille',
      viewDocs: 'Voir documents',
      male: 'Masculin',
      female: 'Féminin',
      select: 'Sélectionner',
      download: 'Télécharger',
      viewInModal: 'Voir les certifications',
      actions: 'Actions',
      startTime: 'Heure de début',
      endTime: 'Heure de fin',
      availableDays: 'Jours disponibles',
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
    structures: 'Structures',
    visibilityAll: 'Visible par toutes les structures',
    visibilitySelected: 'Visible par les structures sélectionnées',
    selectStructures: 'Sélectionner les structures'
    },
    en: {
      addDoctor: 'Add Doctor',
      name: 'Name',
      firstName: 'First Name',
      age: 'Age',
      gender: 'Gender',
      specialty: 'Specialty',
      phone: 'Phone',
      email: 'Email',
      password: 'Password',
      availability: 'Availability',
      photo: 'Photo',
      certifications: 'Certifications',
      save: 'Save',
      modify: 'Edit',
      delete: 'Delete',
      search: 'Search for a doctor...',
      table: 'Table',
      grid: 'Grid',
      viewDocs: 'View documents',
      male: 'Male',
      female: 'Female',
      select: 'Select',
      download: 'Download',
      viewInModal: 'View Certifications',
      actions: 'Actions',
      startTime: 'Start Time',
      endTime: 'End Time',
      availableDays: 'Available Days',
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
      structures: 'Structures',
      visibilityAll: 'Visible to all structures',
      visibilitySelected: 'Visible to selected structures only',
      selectStructures: 'Select structures'


    }
};

  const medecinsCollectionRef = collection(db, "medecins");

  useEffect(() => {
    getMedecins();
  }, []);

  // Add this after your existing useEffect
useEffect(() => {
  const fetchStructures = async () => {
    const structuresCollection = collection(db, "structures");
    const structuresSnapshot = await getDocs(structuresCollection);
    const structuresList = structuresSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setStructures(structuresList);
  };

  fetchStructures();
}, []);

  const getMedecins = async () => {
    const data = await getDocs(medecinsCollectionRef);
    setMedecins(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
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
  const t = translations[language];

  const days = [
    { key: 'monday', label: t.monday },
    { key: 'tuesday', label: t.tuesday },
    { key: 'wednesday', label: t.wednesday },
    { key: 'thursday', label: t.thursday },
    { key: 'friday', label: t.friday },
    { key: 'saturday', label: t.saturday },
    { key: 'sunday', label: t.sunday }
  ];
  const handleShowCerts = (certifications, doctor) => {
    setSelectedCerts(certifications);
    setSelectedDoctor(doctor);
    setShowCertModal(true);
  };
  
  const handleEdit = (medecin) => {
    setEditId(medecin.id);
    setFormData({
      nom: medecin.nom,
      prenom: medecin.prenom,
      specialite: medecin.specialite,
      telephone: medecin.telephone,
      email: medecin.email,
      password: medecin.password,
      disponibilite: medecin.disponibilite,
      heureDebut: medecin.heureDebut,
      heureFin: medecin.heureFin,
      joursDisponibles: medecin.joursDisponibles,
      photo: medecin.photo,
      certifications: medecin.certifications,
      structures: medecin.structures || [],
    visibility: medecin.visibility || 'all'
    });
    setDisplayMode('both');
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = '';
      let certificationsUrls = [];
  
      if (formData.photo && formData.photo instanceof File) {
        const photoRef = ref(storage, `photos/${formData.photo.name}`);
        await uploadBytes(photoRef, formData.photo);
        photoUrl = await getDownloadURL(photoRef);
      }
  
      if (formData.certifications && formData.certifications.length > 0) {
        for (const cert of formData.certifications) {
          const certRef = ref(storage, `certifications/${cert.name}`);
          await uploadBytes(certRef, cert);
          const certUrl = await getDownloadURL(certRef);
          certificationsUrls.push(certUrl);
        }
      }
  
      const doctorData = {
        nom: formData.nom || '',
        prenom: formData.prenom || '',
        specialite: formData.specialite || '',
        telephone: formData.telephone || '',
        email: formData.email || '',
        password: formData.password || '',
        disponibilite: formData.disponibilite || [],
        heureDebut: formData.heureDebut || '',
        heureFin: formData.heureFin || '',
        joursDisponibles: formData.joursDisponibles || [],
        visibility: formData.visibility || 'all',
        structures: formData.visibility === 'selected' ? (formData.structures || []) : [],
        dateCreation: new Date().toISOString()
      };
  
      if (photoUrl) {
        doctorData.photo = photoUrl;
      }
      
      if (certificationsUrls.length > 0) {
        doctorData.certifications = certificationsUrls;
      }
  
      if (editId) {
        await updateDoc(doc(db, "medecins", editId), doctorData);
        setEditId(null);
      } else {
        await addDoc(medecinsCollectionRef, doctorData);
      }
  
      getMedecins();
      setFormData({
        nom: '',
        prenom: '',
        specialite: '',
        telephone: '',
        email: '',
        password: '',
        disponibilite: [],
        photo: null,
        certifications: null,
        heureDebut: '',
        heureFin: '',
        joursDisponibles: [],
        visibility: 'all',
        structures: []
      });
  
      // Afficher une notification de succès
      alert(language === 'fr' ? 'Médecin enregistré avec succès!' : 'Doctor saved successfully!');
  
    } catch (error) {
      console.error("Error: ", error);
      // Afficher une notification d'erreur
      alert(language === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error while saving');
    }
  };
  

  const handleDelete = async (id, nomMedecin) => {
    const confirmMessage = language === 'fr' 
      ? `Êtes-vous sûr de vouloir supprimer Dr. ${nomMedecin} ?`
      : `Are you sure you want to delete Dr. ${nomMedecin}?`;
  
    const isConfirmed = window.confirm(confirmMessage);
    
    if (isConfirmed) {
      await deleteDoc(doc(db, "medecins", id));
      getMedecins();
    }
  };
  
  

  const filteredMedecins = medecins.filter(medecin =>
    Object.values(medecin).some(value =>
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
            <i className="fas fa-plus-circle me-5"></i>
            {translations[language].addDoctor}
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
            {translations[language].table} + {translations[language].addDoctor}
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
            {translations[language].addDoctor}
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
            {translations[language].table} + {translations[language].addDoctor}
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
          <h3 className="border-bottom pb-3 mb-4">{translations[language].addDoctor}</h3>
          
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


              <Form.Group className="mb-1">
                <Form.Label className="fw-bold">{translations[language].specialty}</Form.Label>
                <Form.Control type="text" name="specialite" value={formData.specialite} onChange={handleInputChange} className="shadow-sm" />
              </Form.Group>
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
                <Col md={12}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">{translations[language].password}</Form.Label>
                    <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} className="shadow-sm" />
                  </Form.Group>
                </Col>
                   
            <Row> 

              <Row>
                <Col md={6}>
                <Form.Group className="mb-4">
  <Form.Label className="fw-bold">{translations[language].structures}</Form.Label>
  <Form.Select
    name="visibility"
    value={formData.visibility || 'all'}
    onChange={handleInputChange}
    className="shadow-sm"
  >
    <option value="all">{translations[language].visibilityAll}</option>
    <option value="selected">{translations[language].visibilitySelected}</option>
  </Form.Select>
</Form.Group>
{formData.visibility === 'selected' && (
  <Form.Group className="mb-4">
    <Form.Label className="fw-bold">Select Structures</Form.Label>
    <div className="d-flex flex-wrap gap-2">
      {structures.map(structure => (
        <Form.Check
          key={structure.id}
          type="checkbox"
          label={structure.name}
          checked={formData.structures?.includes(structure.id)}
          onChange={(e) => {
            const updatedStructures = e.target.checked
              ? [...(formData.structures || []), structure.id]
              : formData.structures.filter(id => id !== structure.id);
            setFormData({...formData, structures: updatedStructures});
          }}
        />
      ))}
    </div>
  </Form.Group>
)}


                </Col>
              </Row>

      <Row>
      <Col md={6}>
        <div className="d-flex gap-1 mb-4">
        <Form.Label className="fw-bold">{translations[language].TimeSlots}</Form.Label>

          <Form.Control
            type="time"
            name="heureDebut"
            value={formData.heureDebut}
            onChange={handleInputChange}
            className="shadow-sm"
            placeholder="Début"
          />
          <span className="align-self-center">-</span>

          <Form.Control
            type="time"
            name="heureFin"
            value={formData.heureFin}
            onChange={handleInputChange}
            className="shadow-sm"
            placeholder="Fin"
          />
        </div>
      </Col>
    </Row>
      <Row>
      <Col md={6}>
      <Form.Group className="mb-3">
      <Form.Label className="fw-bold">{translations[language].availability}</Form.Label>
      <div className="d-flex flex-wrap gap-3">
      {days.map(day => (
  <Form.Check
    key={day.key}
    type="checkbox"
    label={day.label}
    checked={formData.disponibilite?.includes(day.key)}
    onChange={(e) => {
      const updatedDays = e.target.checked
        ? [...(formData.disponibilite || []), day.key]
        : (formData.disponibilite || []).filter(d => d !== day.key);
      setFormData({...formData, disponibilite: updatedDays});
    }}
  />
))}

        </div>
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

        </Form.Group>
                   </Col>

      </Row>
    </Row>

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
                <th>{translations[language].specialty}</th>
                <th>{translations[language].structures}</th>

                <th>{translations[language].phone}</th>
                <th>{translations[language].email}</th>
                <th>{translations[language].password}</th>
                <th>{translations[language].availability}</th>
                <th>{translations[language].startTime}</th>
                <th>{translations[language].endTime}</th>
                <th>{translations[language].certifications}</th>
                <th>{translations[language].actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedecins.map((medecin) => (
                <tr key={medecin.id}>
                  <td>
                    {medecin.photo && (
                      <img
                        src={medecin.photo}
                        alt="Photo"
                        className="rounded-circle"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    )}
                  </td>
                  <td>{medecin.nom}</td>
                  <td>{medecin.prenom}</td>
                  <td>{medecin.specialite}</td>
                  <td>{medecin.structures}</td>
                  <td>{medecin.telephone}</td>
                  <td>{medecin.email}</td>
                  <td>{medecin.password}</td>
                  <td>
  {Array.isArray(medecin.disponibilite) ? (
    <div className="d-flex flex-wrap gap-2">
      {days.map(day => (
        <div key={day.key} className="availability-tag">
          {medecin.disponibilite.includes(day.key) && (
            <span>{day.label}</span>
          )}
        </div>
      ))}
    </div>
  ) : null}
</td>
   
                  <td>{medecin.heureDebut}</td>
                  <td>{medecin.heureFin}</td>
                  <td>
                    {medecin.certifications && (
                      <Button
                        variant="link"
                        onClick={() => handleShowCerts(medecin.certifications, medecin)}
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
                        onClick={() => handleEdit(medecin)}
                        className="me-2"
                      >
                        <i className="fas fa-edit me-1"></i>
                        {translations[language].modify}
                      </Button>
                      <Button
  variant="danger"
  size="sm"
  onClick={() => handleDelete(medecin.id, `${medecin.nom} ${medecin.prenom}`)}
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
  {filteredMedecins.map((medecin) => (
    <Col key={medecin.id} md={6} lg={4}>
      <div className="card-flip">
        <div className="card-inner">
          <div className="card-front">
            <Card className="h-100 shadow-sm hover-shadow">
              {medecin.photo && (
                <Card.Img
                  variant="top"
                  src={medecin.photo}
                  style={{ height: '400px', objectFit: 'cover' }}
                />
              )}
              <div className="text-center p-3">
                <h5>{medecin.nom} {medecin.prenom}</h5>
                <p className="text-muted">{medecin.specialite}</p>
              </div>
            </Card>
          </div>
          
          <div className="card-back">
            <Card className="h-100 shadow-sm hover-shadow">
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Card.Title className="border-bottom pb-2">
                  {medecin.nom} {medecin.prenom}
                </Card.Title>
                <Card.Text>
                  <div className="mb-2">
                    <strong>{translations[language].specialty}:</strong> {medecin.specialite}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].structures}:</strong> {medecin.email}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].phone}:</strong> {medecin.telephone}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].email}:</strong> {medecin.email}
                  </div>
               
                  <div className="mb-2">
  <strong>{translations[language].availability}:</strong>
  <div className="d-flex flex-wrap gap-2 ms-2">
    {days.map(day => (
      <div key={day.key} className="availability-badge">
        {medecin.disponibilite?.includes(day.key) && (
          <span>{day.label}</span>
        )}
      </div>
    ))}
  </div>
</div>

                  <div className="mb-2">
                    <strong>{translations[language].startTime}:</strong> {medecin.heureDebut}
                  </div>
                  <div className="mb-2">
                    <strong>{translations[language].endTime}:</strong> {medecin.heureFin}
                  </div>
                      
                </Card.Text>

                {medecin.certifications && (
                  <Button
                    variant="outline-primary"
                    onClick={() => handleShowCerts(medecin.certifications, medecin)}
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
                    onClick={() => handleEdit(medecin)}
                  >
                    <i className="fas fa-edit me-2"></i>
                    {translations[language].modify}
                  </Button>
                  <Button
  variant="danger"
  size="sm"
  onClick={() => handleDelete(medecin.id, `${medecin.nom} ${medecin.prenom}`)}
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
    
    .availability-badge {
  background-color: #e9ecef;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.9em;
}

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
          Dr. {selectedDoctor?.nom} {selectedDoctor?.prenom}
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

export default Medecins;
