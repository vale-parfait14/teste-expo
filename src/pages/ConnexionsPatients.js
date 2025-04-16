import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../components/firebase-config.js';
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ConnexionsPatients = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register states
  const [newPatient, setNewPatient] = useState({
    nom: '',
    prenom: '',
    age: '',
    sexe: '',
    telephone: '',
    email: '',
    password: '',
    adresse: '',
    antecedents: [],
    photo: null,
    visibility: 'private',
    structures: [],
    medecins: []
  });
  const [photoFile, setPhotoFile] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(
        patientsRef,
        where('email', '==', loginEmail),
        where('password', '==', loginPassword)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const patientDoc = querySnapshot.docs[0];
        const patientData = { id: patientDoc.id, ...patientDoc.data() };

        // Fetch assigned doctors
        const assignedDoctors = [];
        if (patientData.medecins) {
          const doctorsPromises = patientData.medecins.map(id => 
            getDoc(doc(db, 'medecins', id))
          );
          const doctorsData = await Promise.all(doctorsPromises);
          doctorsData.forEach(doc => {
            if (doc.exists()) {
              assignedDoctors.push({ id: doc.id, ...doc.data() });
            }
          });
        }

        // Fetch affiliated structures
        const affiliatedStructures = [];
        if (patientData.structures) {
          const structuresPromises = patientData.structures.map(id =>
            getDoc(doc(db, 'structures', id))
          );
          const structuresData = await Promise.all(structuresPromises);
          structuresData.forEach(doc => {
            if (doc.exists()) {
              affiliatedStructures.push({ id: doc.id, ...doc.data() });
            }
          });
        }

        // Store complete patient data
        const completePatientData = {
          ...patientData,
          assignedDoctors,
          affiliatedStructures
        };

        localStorage.setItem('patientData', JSON.stringify(completePatientData));
        navigate('/PatientsDashboard');
      } else {
        setMessage('Email ou mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de la connexion');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        const photoRef = ref(storage, `patients/photos/${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      const patientData = {
        ...newPatient,
        photo: photoUrl,
        dateInscription: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'patients'), patientData);
      const completePatientData = { id: docRef.id, ...patientData };
      
      localStorage.setItem('patientData', JSON.stringify(completePatientData));
      navigate('/PatientsDashboard');
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur lors de l\'inscription');
    }
    setLoading(false);
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow-lg">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h4 className="mb-0">
                {showLogin ? 'Connexion Patient' : 'Inscription Patient'}
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              {message && (
                <Alert variant="info" onClose={() => setMessage('')} dismissible>
                  {message}
                </Alert>
              )}

              {showLogin ? (
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowLogin(false)}
                    >
                      Créer un compte
                    </Button>
                  </div>
                </Form>
              ) : (
                <Form onSubmit={handleRegister}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom</Form.Label>
                        <Form.Control
                          type="text"
                          value={newPatient.nom}
                          onChange={(e) => setNewPatient({...newPatient, nom: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Prénom</Form.Label>
                        <Form.Control
                          type="text"
                          value={newPatient.prenom}
                          onChange={(e) => setNewPatient({...newPatient, prenom: e.target.value})}
                          required
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
                          value={newPatient.age}
                          onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sexe</Form.Label>
                        <Form.Select
                          value={newPatient.sexe}
                          onChange={(e) => setNewPatient({...newPatient, sexe: e.target.value})}
                          required
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPatient.password}
                      onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={newPatient.telephone}
                      onChange={(e) => setNewPatient({...newPatient, telephone: e.target.value})}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      type="text"
                      value={newPatient.adresse}
                      onChange={(e) => setNewPatient({...newPatient, adresse: e.target.value})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Antécédents médicaux</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newPatient.antecedents.join('\n')}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
                      })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Photo</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => setPhotoFile(e.target.files[0])}
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Inscription...' : 'S\'inscrire'}
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowLogin(true)}
                    >
                      Déjà inscrit ? Se connecter
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ConnexionsPatients;
