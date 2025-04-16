import React, { useState } from 'react';
import { db } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Tabs, Tab,Row,Col } from 'react-bootstrap';
import { FaHospital, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt ,FaCalendar, FaUser, FaGlobe, FaMobile, FaFile, FaImage} from 'react-icons/fa';

const ConnexionsStructures = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [newStructure, setNewStructure] = useState({
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const structuresRef = collection(db, 'structures');
      const q = query(structuresRef,
        where('email', '==', email),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const structureData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        localStorage.setItem('structureData', JSON.stringify(structureData));
        navigate('/structure-dashboard');
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (error) {
      setError('Erreur de connexion');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const structuresRef = collection(db, 'structures');
      const docRef = await addDoc(structuresRef, {
        ...newStructure,
        dateCreation: new Date().toISOString(),
        status: 'pending'
      });
      const structureData = {
        id: docRef.id,
        ...newStructure
      };
      localStorage.setItem('structureData', JSON.stringify(structureData));
      navigate('/structure-dashboard');
    } catch (error) {
      setError('Erreur lors de l\'inscription');
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-0">
      <Card className="shadow-lg border-0 rounded-0 rounded-md-lg w-100">
        <Card.Header className="bg-primary text-white text-center p-4">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-0 border-0 nav-fill"
          >
            <Tab eventKey="login" title="Connexion" />
            <Tab eventKey="register" title="Inscription" />
          </Tabs>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          
          {activeTab === 'login' ? (
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <div className="input-group">
                  <span className="input-group-text"><FaEnvelope /></span>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <div className="input-group">
                  <span className="input-group-text"><FaLock /></span>
                  <Form.Control
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mb-3">
                Se connecter
              </Button>
              <Button variant="outline-primary" onClick={() => setActiveTab('register')} className="w-100">
                Créer un compte
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaHospital /></span>
                <Form.Control
                  type="text"
                  placeholder="Nom de la structure"
                  value={newStructure.name}
                  onChange={(e) => setNewStructure({...newStructure, name: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaEnvelope /></span>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={newStructure.email}
                  onChange={(e) => setNewStructure({...newStructure, email: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaLock /></span>
                <Form.Control
                  type="password"
                  placeholder="Mot de passe"
                  value={newStructure.password}
                  onChange={(e) => setNewStructure({...newStructure, password: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaMapMarkerAlt /></span>
                <Form.Control
                  type="text"
                  placeholder="Adresse"
                  value={newStructure.address}
                  onChange={(e) => setNewStructure({...newStructure, address: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaCalendar /></span>
                <Form.Control
                  type="number"
                  placeholder="Année de création"
                  value={newStructure.creationYear}
                  onChange={(e) => setNewStructure({...newStructure, creationYear: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaUser /></span>
                <Form.Control
                  type="text"
                  placeholder="Responsable"
                  value={newStructure.responsible}
                  onChange={(e) => setNewStructure({...newStructure, responsible: e.target.value})}
                  required
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaGlobe /></span>
                <Form.Control
                  type="url"
                  placeholder="Site web"
                  value={newStructure.website}
                  onChange={(e) => setNewStructure({...newStructure, website: e.target.value})}
                />
              </div>
            </Form.Group>
          
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><FaMobile /></span>
                    <Form.Control
                      type="tel"
                      placeholder="Téléphone mobile"
                      value={newStructure.phones.mobile}
                      onChange={(e) => setNewStructure({
                        ...newStructure,
                        phones: {...newStructure.phones, mobile: e.target.value}
                      })}
                      required
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text"><FaPhone /></span>
                    <Form.Control
                      type="tel"
                      placeholder="Téléphone fixe"
                      value={newStructure.phones.landline}
                      onChange={(e) => setNewStructure({
                        ...newStructure,
                        phones: {...newStructure.phones, landline: e.target.value}
                      })}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaImage /></span>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewStructure({
                    ...newStructure,
                    photoUrl: e.target.files[0]
                  })}
                  accept="image/*"
                />
              </div>
            </Form.Group>
          
            <Form.Group className="mb-3">
              <div className="input-group">
                <span className="input-group-text"><FaFile /></span>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewStructure({
                    ...newStructure,
                    documents: {...newStructure.documents, structureDocUrl: e.target.files[0]}
                  })}
                  accept=".pdf,.doc,.docx"
                />
                <Form.Text>Document de la structure</Form.Text>
              </div>
            </Form.Group>
          
            <Form.Group className="mb-4">
              <div className="input-group">
                <span className="input-group-text"><FaFile /></span>
                <Form.Control
                  type="file"
                  onChange={(e) => setNewStructure({
                    ...newStructure,
                    documents: {...newStructure.documents, stateDocUrl: e.target.files[0]}
                  })}
                  accept=".pdf,.doc,.docx"
                />
                <Form.Text>Document d'état</Form.Text>
              </div>
            </Form.Group>
          
            <Button variant="primary" type="submit" className="w-100 mb-3">
              S'inscrire
            </Button>
            <Button variant="outline-primary" onClick={() => setActiveTab('login')} className="w-100">
              Déjà inscrit ? Se connecter
            </Button>
          </Form>
          )}
        </Card.Body>
      </Card>

      <style jsx>{`
        .container-fluid {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .card {
          max-width: 500px;
          margin: 1rem;
        }
        
        @media (max-width: 768px) {
          .card {
            margin: 0;
            min-height: 100vh;
          }
        }
      `}</style>
    </Container>
  );
};

export default ConnexionsStructures;
