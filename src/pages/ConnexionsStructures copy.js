import React, { useState } from 'react';
import { db, storage } from '../components/firebase-config.js';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Container, Form, Button, Card, Alert, Tabs, Tab, Row, Col } from 'react-bootstrap';

const StructureLogin = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');
  const [structure, setStructure] = useState({
    name: '',
    email: '',
    password: '',
    creationYear: '',
    address: '',
    website: '',
    responsible: '',
    insurance: [],
    phones: {
      mobile: '',
      landline: ''
    },
    photoUrl: '',
    documents: {
      structureDocUrl: '',
      stateDocUrl: ''
    }
  });
  const [affiliatedData, setAffiliatedData] = useState({ doctors: [], patients: [] });

  const t = {
    basicInfo: 'Basic Information',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    creationYear: 'Creation Year',
    address: 'Address',
    website: 'Website',
    responsible: 'Responsible',
    insurance: 'Insurance',
    insurancePlaceholder: 'Enter insurance providers separated by commas',
    contactInfo: 'Contact Information',
    mobile: 'Mobile',
    landline: 'Landline',
    mediaAndDocs: 'Media & Documents',
    photo: 'Photo',
    structureDoc: 'Structure Document',
    stateDoc: 'State Document',
    create: 'Create',
    update: 'Update'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const structuresRef = collection(db, 'structures');
      const q = query(
        structuresRef,
        where('email', '==', structure.email),
        where('password', '==', structure.password)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid credentials');
        return;
      }

      const structureData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      setStructure(structureData);
      await fetchAffiliatedData(structureData);
      setError('');
    } catch (error) {
      setError('An error occurred during login');
      console.error(error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const structuresRef = collection(db, 'structures');
      const q = query(structuresRef, where('email', '==', structure.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Email already exists');
        return;
      }

      // Handle image upload
      let photoUrl = '';
      if (selectedImage) {
        const imageRef = ref(storage, `structures/${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        photoUrl = await getDownloadURL(imageRef);
      }

      const newStructure = {
        ...structure,
        photoUrl,
        affiliatedDoctors: [],
        affiliatedPatients: [],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'structures'), newStructure);
      setStructure({ id: docRef.id, ...newStructure });
      setAffiliatedData({ doctors: [], patients: [] });
      setError('');
    } catch (error) {
      setError('An error occurred during signup');
      console.error(error);
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
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

  const fetchAffiliatedData = async (structureData) => {
    try {
      const doctors = [];
      const patients = [];

      if (structureData.affiliatedDoctors?.length) {
        const doctorsRef = collection(db, 'medecins');
        const doctorsSnapshot = await getDocs(doctorsRef);
        doctorsSnapshot.docs.forEach(doc => {
          if (structureData.affiliatedDoctors.includes(doc.id)) {
            doctors.push({ id: doc.id, ...doc.data() });
          }
        });
      }

      if (structureData.affiliatedPatients?.length) {
        const patientsRef = collection(db, 'patients');
        const patientsSnapshot = await getDocs(patientsRef);
        patientsSnapshot.docs.forEach(doc => {
          if (structureData.affiliatedPatients.includes(doc.id)) {
            patients.push({ id: doc.id, ...doc.data() });
          }
        });
      }

      setAffiliatedData({ doctors, patients });
    } catch (error) {
      console.error('Error fetching affiliated data:', error);
    }
  };

  return (
    <Container className="py-5">
      {!structure.id ? (
        <Card className="mx-auto" style={{ maxWidth: activeTab === 'signup' ? '800px' : '400px' }}>
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Structure Portal</h4>
          </Card.Header>
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => {
                setActiveTab(k);
                setCurrentPage(1);
              }}
              className="mb-3"
            >
              <Tab eventKey="login" title="Login">
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={structure.email}
                      onChange={(e) => setStructure({...structure, email: e.target.value})}
                      required
                      className="rounded-pill"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={structure.password}
                      onChange={(e) => setStructure({...structure, password: e.target.value})}
                      required
                      className="rounded-pill"
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="w-100 rounded-pill">
                    Login
                  </Button>
                </Form>
              </Tab>

              <Tab eventKey="signup" title="Sign Up">
                <Form onSubmit={handleSignup}>
                  <div className="page-container">
                    {/* Page 1 - Basic Information */}
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
                          <Form.Group className="mb-3">
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
                          <Form.Group className="mb-3">
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
                          <Form.Group className="mb-3">
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
                          <Form.Group className="mb-3">
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
                          <Form.Group className="mb-3">
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
                          <Form.Group className="mb-3">
                            <Form.Label>{t.insurance}</Form.Label>
                            <Form.Control
                              type="text"
                              value={structure.insurance.join(', ')}
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

                    {/* Page 2 - Contact & Media */}
                    <div className={`page ${currentPage === 2 ? 'active' : ''}`}>
                      <h5 className="text-primary mb-3">
                        <i className="bi bi-person-lines-fill me-2"></i>
                        {t.contactInfo}
                      </h5>
                      <Row>
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
                          className={`indicator ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </div>
                      ))}
                    </div>

                    {currentPage === totalPages ? (
                      <Button type="submit" variant="primary">
                        Sign Up
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
                </Form>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      ) : (
        <div>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">Welcome {structure.name}</h4>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setStructure({
                    name: '',
                    email: '',
                    password: '',
                    creationYear: '',
                    address: '',
                    website: '',
                    responsible: '',
                    insurance: [],
                    phones: {
                      mobile: '',
                      landline: ''
                    },
                    photoUrl: '',
                    documents: {
                      structureDocUrl: '',
                      stateDocUrl: ''
                    }
                  });
                  setAffiliatedData({ doctors: [], patients: [] });
                }}
              >
                Logout
              </Button>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Affiliated Doctors ({affiliatedData.doctors.length})</h5>
            </Card.Header>
            <Card.Body>
              {affiliatedData.doctors.map(doctor => (
                <div key={doctor.id} className="border-bottom p-3">
                  <h6>{doctor.nom} {doctor.prenom}</h6>
                  <p className="mb-1">Specialty: {doctor.specialite}</p>
                  <p className="mb-1">Email: {doctor.email}</p>
                  <p className="mb-0">Phone: {doctor.telephone}</p>
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Affiliated Patients ({affiliatedData.patients.length})</h5>
            </Card.Header>
            <Card.Body>
              {affiliatedData.patients.map(patient => (
                <div key={patient.id} className="border-bottom p-3">
                  <h6>{patient.nom} {patient.prenom}</h6>
                  <p className="mb-1">Age: {patient.age}</p>
                  <p className="mb-1">Email: {patient.email}</p>
                  <p className="mb-0">Phone: {patient.telephone}</p>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
      )}

      <style jsx>{`
        .page-container {
          position: relative;
          perspective: 1500px;
        }

        .page {
          display: none;
          transition: transform 0.5s;
        }

        .page.active {
          display: block;
        }

        .navigation-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
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
    </Container>
  );
};

export default StructureLogin;

