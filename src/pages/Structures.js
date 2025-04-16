import React, { useState, useEffect } from 'react';
import { db, storage } from '../components/firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Container, Row, Col, Form, Button, Card, Table, ListGroup, Modal, Dropdown, Navbar, Nav, ButtonGroup } from 'react-bootstrap';
import './Structures.css'

const translations = {
  en: {
    title: 'Create New Structure',
    editTitle: 'Edit Structure',
    basicInfo: 'Basic Information',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    creationYear: 'Creation Year',
    address: 'Address',
    website: 'Website',
    responsible: 'Responsible',
    insurance: 'Insurance',
    contactInfo: 'Contact Information',
    mobile: 'Mobile Phone',
    landline: 'Landline',
    media: 'Media',
    photo: 'Photo',
    documents: 'Documents',
    structureDoc: 'Structure Document',
    stateDoc: 'State Document',
    cancel: 'Cancel',
    create: 'Create Structure',
    update: 'Update Structure',
    structuresList: 'Structures List',
    search: 'Search structures...',
    documentPreview: 'Document Preview',
    close: 'Close',
    openInNewTab: 'Open in New Tab',
     imagePreview: 'Image Preview',
    preview: 'Preview',
    namePhoto: 'Name/Photo',
    contactInfo: 'Contact Info',
    details: 'Details',
    password: 'Password',
    insurance: 'Insurance',
    documents: 'Documents',
    actions: 'Actions',
    created: 'Created',
    lead: 'Lead',
    structureDoc: 'Structure Doc',
    stateDoc: 'State Doc',
     editStructure: 'Edit Structure',
    createNewStructure: 'Create New Structure',
    searchStructures: 'Search structures...',
    structuresManagement: 'Structures Management',
    form: 'Form',
    list: 'List',
    both: 'Both Views', mediaAndDocs: 'Media & Documents',
    next: 'Next',
    previous: 'Previous',
    mediaAndDocs: 'Médias & Documents',
    next: 'Suivant',
    previous: 'Précédent'

  },
  fr: {
    title: 'Créer une nouvelle structure',
    editTitle: 'Modifier la structure',
    basicInfo: 'Informations de base',
    name: 'Nom',
    email: 'Email',
    password: 'Mot de passe',
    creationYear: 'Année de création',
    address: 'Adresse',
    website: 'Site web',
    responsible: 'Responsable',
    insurance: 'Assurance',
    contactInfo: 'Coordonnées',
    mobile: 'Téléphone mobile',
    landline: 'Téléphone fixe',
    media: 'Médias',
    photo: 'Photo',
    documents: 'Documents',
    structureDoc: 'Document de structure',
    stateDoc: 'Document d\'état',
    cancel: 'Annuler',
    create: 'Créer la structure',
    update: 'Mettre à jour la structure',
    structuresList: 'Liste des structures',
    search: 'Rechercher des structures...',
    documentPreview: 'Aperçu du document',
    close: 'Fermer',
    openInNewTab: 'Ouvrir dans un nouvel onglet',
    imagePreview: 'Aperçu de l\'image',
    preview: 'Aperçu',
    namePhoto: 'Nom/Photo',
    contactInfo: 'Coordonnées',
    details: 'Détails',
    password: 'Mot de passe',
    insurance: 'Assurance',
    documents: 'Documents',
    actions: 'Actions',
    created: 'Créé',
    lead: 'Responsable',
    structureDoc: 'Doc Structure',
    stateDoc: 'Doc État',
    editStructure: 'Modifier la structure',
    createNewStructure: 'Créer une nouvelle structure',
    searchStructures: 'Rechercher des structures...',
    structuresManagement: 'Gestion des Structures',
    form: 'Formulaire',
    list: 'Liste',
    both: 'Les Deux Vues',
    mediaAndDocs: 'Médias & Documents',
    next: 'Suivant',
    previous: 'Précédent'

  }
};
const Structures = () => {
  const [structure, setStructure] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    creationYear: '',
    responsible: '',
    website: '',
    insurance: [],
    phones: {
      mobile: '',
      landline: ''
    },
    photoUrl: null,
    documents: {
      structureDocUrl: null,
      stateDocUrl: null
    }
  });
  


  const [structures, setStructures] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  const [activeView, setActiveView] = useState('list'); // 'both', 'form', or 'list'
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;
  
 useEffect(() => {
   const handleResize = () => setIsMobile(window.innerWidth < 768);
   window.addEventListener('resize', handleResize);
   return () => window.removeEventListener('resize', handleResize);
 }, []);
 
 // Updated navigation component

 
  

  const handleImagePreview = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };
  
  useEffect(() => {
    fetchStructures();
  }, []);


  const fetchStructures = async () => {
    const querySnapshot = await getDocs(collection(db, 'structures'));
    const structuresData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setStructures(structuresData);
  };


  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };


  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      const docRef = ref(storage, `documents/${file.name}`);
      await uploadBytes(docRef, file);
      const url = await getDownloadURL(docRef);
      setStructure({
        ...structure,
        documents: {
          ...structure.documents,
          [docType]: url
        }
      });
    }
  };


  const handleDocumentPreview = (url) => {
    setSelectedDoc(url);
    setShowDocModal(true);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = structure.photoUrl;
  
      // Handle photo upload if there's a new image
      if (selectedImage instanceof File) {
        const imageRef = ref(storage, `structures/photos/${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        photoUrl = await getDownloadURL(imageRef);
      }
  
      // Prepare structure data
      const structureData = {
        name: structure.name,
        email: structure.email,
        password: structure.password,
        address: structure.address,
        creationYear: structure.creationYear,
        responsible: structure.responsible,
        website: structure.website,
        insurance: Array.isArray(structure.insurance) ? structure.insurance : [],
        phones: {
          mobile: structure.phones.mobile || '',
          landline: structure.phones.landline || ''
        },
        photoUrl: photoUrl || null,
        documents: {
          structureDocUrl: structure.documents.structureDocUrl || null,
          stateDocUrl: structure.documents.stateDocUrl || null
        }
      };
  
      if (editMode && editId) {
        // Update existing structure
        await updateDoc(doc(db, 'structures', editId), structureData);
      } else {
        // Create new structure
        await addDoc(collection(db, 'structures'), structureData);
      }
  
      // Reset form and refresh list
      resetForm();
      await fetchStructures();
      
      // Show success message
      alert(editMode ? 'Structure updated successfully!' : 'Structure created successfully!');
      
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };
  


  const handleEdit = (structure) => {
    setStructure(structure);
    setEditMode(true);
    setEditId(structure.id);
  };


  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'structures', id));
    fetchStructures();
  };


  const resetForm = () => {
    setStructure({
      name: '',
      address: '',
      email: '',
      password: '',
      insurance: [],
      creationYear: '',
      responsible: '',
      website: '',
      phones: {
        mobile: '',
        landline: ''
      },
      photoUrl: null,
      documents: {
        structureDocUrl: null,
        stateDocUrl: null
      }
    });
    setSelectedImage(null);
    setEditMode(false);
    setEditId(null);
  };


  const filteredStructures = structures.filter(structure =>
    structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  return (
    <Container fluid className="py-4 bg-light">
   <Row className="mb-3">
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
            variant={activeView === 'form' ? 'primary' : 'light'}
            onClick={() => setActiveView('form')}
            className="me-2"
          >
            <i className="bi bi-plus-circle me-2"></i>
            {t.createNewStructure}
          </Button>
          <Button 
            variant={activeView === 'list' ? 'primary' : 'light'}
            onClick={() => setActiveView('list')}
            className="me-2"
          >
            <i className="bi bi-list-ul me-2"></i>
            {t.structuresList}
          </Button>
        </div>
        <Button
          variant="outline-primary"
          onClick={toggleLanguage}
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
        <Modal.Title>{t.menu}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column gap-2">
          <Button 
            variant={activeView === 'form' ? 'primary' : 'light'}
            onClick={() => {
              setActiveView('form');
              setShowMobileMenu(false);
            }}
            className="w-100"
          >
            <i className="bi bi-plus-circle me-2"></i>
            {t.createNewStructure}
          </Button>
          <Button 
            variant={activeView === 'list' ? 'primary' : 'light'}
            onClick={() => {
              setActiveView('list');
              setShowMobileMenu(false);
              
            }}
            className="w-100 "
          >
            <i className="bi bi-list-ul me-2"></i>
            {t.structuresList}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  </Col>
</Row>



       <Row className="justify-content-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
    {/* Create/Edit Structure Form */}
    {activeView === 'form' && (
    <Col md={12}>
      <Card className="shadow-sm h-100">
        <Card.Header className="bg-primary text-white sticky-top">
{/*  <h4 className="mb-0">{editMode ? t.editStructure : t.createNewStructure}</h4> */}     
<div className="navigation-controls">
  <Button
    variant="secondary"
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
  >
    <i className="bi bi-chevron-left"></i>
  </Button>

  <div className="page-indicators">
    {[1, 2].map(page => (
      <div
        key={page}
        className={`indicator ${currentPage === page ? 'active' : ''} text-black`}
        onClick={() => handlePageChange(page)}
      >
        {page}
      </div>
    ))}
  </div>

  {currentPage === totalPages ? (
    <Button 
      type="submit" 
      variant="primary"
      onClick={handleSubmit}
      className="px-4"
    >
      {editMode ? t.update : t.create}
    </Button>
  ) : (
    <Button
      variant="secondary"
      onClick={() => handlePageChange(currentPage + 1)}
    >
      <i className="bi bi-chevron-right"></i>
    </Button>
  )}
</div>

        </Card.Header>
        <Card.Body className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
      
<Form onSubmit={handleSubmit} className="book-form">
  <div className="page-container">
      {/* Basic Information fields */}
      <div className={`page ${currentPage === 1 ? 'active' : ''}`}>
  <h5 className="text-primary mb-3">{t.basicInfo}</h5>
  <Row>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.name}</Form.Label>
        <Form.Control
          type="text"
          value={structure.name}
          onChange={(e) => setStructure({...structure, name: e.target.value})}
          required
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.email}</Form.Label>
        <Form.Control
          type="email"
          value={structure.email}
          onChange={(e) => setStructure({...structure, email: e.target.value})}
          required
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
  </Row>

  <Row>
    <Col md={6}>
      <Form.Group className="mb-1">
        <Form.Label>{t.password}</Form.Label>
        <Form.Control
          type="password"
          value={structure.password}
          onChange={(e) => setStructure({...structure, password: e.target.value})}
          required
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group className="mb-1">
        <Form.Label>{t.creationYear}</Form.Label>
        <Form.Control
          type="number"
          value={structure.creationYear}
          onChange={(e) => setStructure({...structure, creationYear: e.target.value})}
          required
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
  </Row>


  <Row>
  <Col md={6}>
  <Form.Group className="mb-1">
    <Form.Label>{t.address}</Form.Label>
    <Form.Control
      type="text"
      value={structure.address}
      onChange={(e) => setStructure({...structure, address: e.target.value})}
      required
      className="rounded-pill"
    />
  </Form.Group>
  </Col>
  <Col md={6}>

  <Form.Group className="mb-1">
    <Form.Label>{t.website}</Form.Label>
    <Form.Control
      type="url"
      value={structure.website}
      onChange={(e) => setStructure({...structure, website: e.target.value})}
      className="rounded-pill"
    />
  </Form.Group>
</Col>
</Row>


<Row>
  <Col md={6}>
  <Form.Group className="mb-1">
    <Form.Label>{t.responsible}</Form.Label>
    <Form.Control
      type="text"
      value={structure.responsible}
      onChange={(e) => setStructure({...structure, responsible: e.target.value})}
      required
      className="rounded-pill"
    />
  </Form.Group>
      </Col>
      <Col md={6}>
      <Form.Group className="mb-1">
  <Form.Label>{t.insurance}</Form.Label>
  <Form.Control
    type="text"
    value={structure.insurance ? structure.insurance.join(', ') : ''}
    onChange={(e) => setStructure({
      ...structure,
      insurance: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
    })}
    placeholder={t.insurancePlaceholder}
    className="rounded-pill"
  />
</Form.Group>
  </Col>
  </Row>
</div>
    

  

    <div className={`page ${currentPage === 2 ? 'active' : ''}`}>
      
      <div className={`page ${currentPage === 2 ? 'active' : ''}`}>
    
  <Row>
  <h5 className="text-primary mb-3">
  <i className="bi bi-person-lines-fill me-2"></i>
  {t.contactInfo}
</h5>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.mobile}</Form.Label>
        <Form.Control
          type="tel"
          value={structure.phones.mobile}
          onChange={(e) => setStructure({
            ...structure,
            phones: {...structure.phones, mobile: e.target.value}
          })}
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.landline}</Form.Label>
        <Form.Control
          type="tel"
          value={structure.phones.landline}
          onChange={(e) => setStructure({
            ...structure,
            phones: {...structure.phones, landline: e.target.value}
          })}
          className="rounded-pill"
        />
      </Form.Group>
    </Col>
  </Row>
  <h5 className="text-primary mb-3">
  <i className="bi bi-images me-2"></i>
  {t.mediaAndDocs}
</h5>  
  {/* Media Section */}
  <Form.Group className="mb-3">
    <Form.Label>{t.photo}</Form.Label>
    <Form.Control
      type="file"
      onChange={handleImageChange}
      accept="image/*"
      className="form-control-file"
    />
    {(selectedImage || structure.photoUrl) && (
      <div className="mt-2">
        <img
          src={selectedImage ? URL.createObjectURL(selectedImage) : structure.photoUrl}
          alt="Preview"
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            objectFit: 'cover',
            borderRadius: '8px'
          }}
        />
      </div>
    )}
  </Form.Group>

  {/* Documents Section */}
  <Row>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.structureDoc}</Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => handleDocumentUpload(e, 'structureDocUrl')}
          className="form-control-file"
        />
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>{t.stateDoc}</Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => handleDocumentUpload(e, 'stateDocUrl')}
          className="form-control-file"
        />
      </Form.Group>
    </Col>
  </Row>
</div>
    </div>
  </div>

 {/*
  <div className="navigation-controls">
    <Button 
      variant="light"
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <i className="bi bi-chevron-left"></i>
    </Button>

    <div className="page-indicators">
      {[1, 2, 3].map(page => (
        <div 
          key={page}
          className={`indicator ${currentPage === page ? 'active' : ''}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </div>
      ))}
    </div>

    {currentPage === totalPages ? (
      <Button type="submit" variant="primary">
        {editMode ? t.update : t.create}
      </Button>
    ) : (
      <Button 
        variant="light"
        onClick={() => handlePageChange(currentPage + 1)}
      >
        <i className="bi bi-chevron-right"></i>
      </Button>
    )}
  </div>
 */}
</Form>

<style jsx>{`
  .book-form {
    position: relative;
    perspective: 1500px;
  }

  .page-container {
    position: relative;
    height: 100%;
    transform-style: preserve-3d;
  }

  .page {
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 20px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    transform-origin: left center;
    transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
    backface-visibility: hidden;
    opacity: 0;
    pointer-events: none;
  }

  .page.active {
    opacity: 1;
    pointer-events: all;
    position: relative;
    transform: rotateY(0deg);
  }

  .page:not(.active) {
    transform: rotateY(-180deg);
  }

  .navigation-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding: 10px;
  }

  .page-indicators {
    display: flex;
    gap: 10px;
  }

  .indicator {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #f8f9fa;
    transition: all 0.3s;
  }

  .indicator.active {
    background: #0d6efd;
    color: white;
  }
`}</style>


    </Card.Body>
  </Card>
</Col>
  )}

  
{activeView === 'list' && (
    <Col md={12}>
      <Card className="shadow-sm h-100">
        <Card.Header className="bg-primary text-white sticky-top d-flex justify-content-between align-items-center">
        <Form.Control
  type="text"
  placeholder={t.searchStructures}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="mb-1 rounded-pill sticky-top bg-white "
  style={{ top: 0, zIndex: 1000 , width: '50%' }}
/>
        <div className="d-flex align-items-center">
            <Button variant="light" size="sm" onClick={() => setViewMode('grid')} className="me-2">
              <i className="bi bi-grid"></i>
            </Button>
            <Button variant="light" size="sm" onClick={() => setViewMode('table')}>
              <i className="bi bi-list"></i>
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
       

  
  {viewMode === 'grid' ? (
  <Row className="g-4">
  {filteredStructures.map(structure => (
    <Col md={6} key={structure.id}>
    <div className="card-flip-container" style={{height: '400px'}}>
      <div className="card-flip">
        {/* Front Side */}
        <div className="card-front">
          <Card className="h-100 shadow-sm">
            <div className="image-container" style={{height: '300px'}}>
              {structure.photoUrl ? (
                <Card.Img
                  src={structure.photoUrl}
                  style={{height: '100%', width: '100%', objectFit: 'cover'}}
                />
              ) : (
                <div className="default-image-placeholder d-flex align-items-center justify-content-center h-100 bg-light">
                  <i className="bi bi-building fs-1"></i>
                </div>
              )}
            </div>
            <Card.Body className="text-center">
              <Card.Title className="text-primary fw-bold cursor-pointer mb-0">
                {structure.name}
              </Card.Title>
              <small className="text-muted">{t.clickToSeeDetails}</small>
            </Card.Body>
          </Card>
        </div>
  
        {/* Back Side */}
        <div className="card-back">
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-3">
              <h5 className="text-primary text-center mb-3">{structure.name}</h5>
              <div className="mt-3">
                <Button variant="outline-primary" size="sm" onClick={() => handleEdit(structure)} className="me-2">
                  <i className="bi bi-pencil me-1"></i> {t.edit}
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(structure.id)}>
                  <i className="bi bi-trash me-1"></i> {t.delete}
                </Button>
              </div>
              <div className="info-container">
                <div className="info-item">
                  <i className="bi bi-geo-alt-fill text-primary"></i>
                  <span className="text-truncate">{structure.address}</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-envelope-fill text-primary"></i>
                  <span className="text-truncate">{structure.email}</span>
                </div>
                <div className="info-item">
  <i className="bi bi-shield-fill-check text-primary"></i>
  <span className="text-truncate">
    {t.insurance}: {(structure.insurance || []).join(', ')}
  </span>
</div>

                <div className="info-item">
                  <i className="bi bi-calendar-fill text-primary"></i>
                  <span>{t.created}: {structure.creationYear}</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-person-fill text-primary"></i>
                  <span className="text-truncate">{structure.responsible}</span>
                </div>
                <div className="info-item">
                  <i className="bi bi-globe text-primary"></i>
                  <span className="text-truncate">{structure.website}</span>
                </div>
                <div className="info-item">
  <i className="bi bi-telephone-fill text-primary"></i>
  <span>
    <div>📱 {structure?.phones?.mobile || '-'}</div>
    <div>☎️ {structure?.phones?.landline || '-'}</div>
  </span>
</div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  </Col>
  
  ))}
  <style jsx>{`
  .card-flip-container {
    perspective: 1000px;
  }


  .card-flip {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.8s;
    transform-style: preserve-3d;
    cursor: pointer;
  }


  .card-flip-container:hover .card-flip {
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


  .info-container {
    height: calc(100% - 100px);
    overflow-y: auto;
    padding-right: 5px;
  }


  .info-item {
    display: flex;
    align-items: start;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }


  .info-item:last-child {
    border-bottom: none;
  }


  .info-item i {
    width: 20px;
    text-align: center;
  }


  .info-item span {
    flex: 1;
    font-size: 0.9rem;
  }
`}</style>
</Row>




) : (
  <>
  <div className="table-responsive">
    <Table hover className="align-middle custom-table">
      <thead className="bg-light">
        <tr>
          <th className="fixed-column">{t.namePhoto}</th>
          <th>{t.contactInfo}</th>
          <th>{t.details}</th>
          <th>{t.password}</th>
          <th>{t.insurance}</th>
          <th>{t.documents}</th>
          <th>{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {filteredStructures.map(structure => (
          <tr key={structure.id}>
            <td className="fixed-column">
              <div className="d-flex align-items-center">
              {structure.photoUrl ? (
                <img
                  src={structure.photoUrl}
                  alt=""
                  className="rounded-circle me-2 cursor-pointer"
                  style={{width: '50px', height: '40px', objectFit: 'cover'}}
                  onClick={() => handleImagePreview(structure.photoUrl)}
                />
              ) : (
                <div className="placeholder-image me-2">
                  <i className="bi bi-building"></i>
                </div>
              )}
              <div>
                <div className="fw-bold">{structure.name}</div>
                <small className="text-muted">{structure.address}</small>
              </div>
            </div>
          </td>
          <td>
  <div className="contact-info">
    <div><i className="bi bi-envelope text-primary"></i> {structure.email}</div>
    <div><i className="bi bi-globe text-primary"></i> {structure.website}</div>
    <div><i className="bi bi-phone text-primary"></i> {structure?.phones?.mobile || '-'}</div>
    <div><i className="bi bi-telephone text-primary"></i> {structure?.phones?.landline || '-'}</div>
  </div>
</td>
          <td>
            <div className="details-info">
              <div><i className="bi bi-calendar-event text-primary"></i> {t.created}: {structure.creationYear}</div>
              <div><i className="bi bi-person text-primary"></i> {t.lead}: {structure.responsible}</div>
            </div>
          </td>
          <td>
            <div className="password-field">
              <i className="bi bi-key text-primary"></i> {structure.password}
            </div>
          </td>
          <td>
            <div className="insurance-tags">
              {structure.insurance.map((ins, idx) => (
                <span key={idx} className="badge bg-info me-1">{ins}</span>
              ))}
            </div>
          </td>
          <td>
            <div className="d-flex flex-column gap-2">
              {structure.documents.structureDocUrl && (
                <div
                  className="document-link"
                  onClick={() => handleDocumentPreview(structure.documents.structureDocUrl)}
                >
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  <span>{t.structureDoc}</span>
                </div>
              )}
              {structure.documents.stateDocUrl && (
                <div
                  className="document-link"
                  onClick={() => handleDocumentPreview(structure.documents.stateDocUrl)}
                >
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  <span>{t.stateDoc}</span>
                </div>
              )}
            </div>
          </td>
          <td>
            <div className="action-buttons">
              <Button variant="outline-primary" size="sm" onClick={() => handleEdit(structure)} className="me-1">
                <i className="bi bi-pencil"></i>
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => handleDelete(structure.id)}>
                <i className="bi bi-trash"></i>
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
</div>



  {/* Document Preview Modal */}
  <Modal show={showDocModal} onHide={() => setShowDocModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>{t.documentPreview}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <iframe
      src={selectedDoc}
      width="100%"
      height="600px"
      title={t.documentPreview}
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



  {/* Image Preview Modal */}
  <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>{t.imagePreview}</Modal.Title>
  </Modal.Header>
  <Modal.Body className="text-center p-0">
    <img
      src={selectedImage}
      alt={t.preview}
      style={{maxWidth: '100%', maxHeight: '80vh'}}
    />
  </Modal.Body>
</Modal>



  <style jsx>{`
    .custom-table {
      font-size: 0.9rem;
    }


    .placeholder-image {
      width: 40px;
      height: 40px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }


    .document-link {
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }


    .document-link:hover {
      background-color: #f8f9fa;
      color: #0d6efd;
    }


    .document-link span {
      text-decoration: underline;
    }


    .cursor-pointer {
      cursor: pointer;
    }


    .contact-info div,
    .details-info div {
      margin-bottom: 4px;
    }


    .contact-info i,
    .details-info i {
      width: 20px;
    }


    .insurance-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }


    .action-buttons {
      display: flex;
      gap: 4px;
    }

    .table-container {
    position: relative;
    overflow: hidden;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .fixed-column {
    position: sticky;
    left: 0;
    background: white;
    z-index: 1;
    border-right: 1px solid #dee2e6;
  }

  .fixed-column::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(to right, rgba(0,0,0,0.05), transparent);
  }
  `}</style>
</>


)}


            </Card.Body>
          </Card>
          </Col>
  )}    
    </Row>
      
    </Container>
  );
  
};


export default Structures;