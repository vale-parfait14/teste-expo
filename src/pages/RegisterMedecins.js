import React, { useState, useEffect } from 'react';
import { db, auth } from '../components/firebase-config.js';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Container, Form, Button, Modal, Row, Col, Alert } from 'react-bootstrap';

const RegisterMedecins = () => {
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    specialite: '',
    telephone: '',
    structureId: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchStructures = async () => {
      const structuresCollection = collection(db, 'structures');
      const structuresSnapshot = await getDocs(structuresCollection);
      const structuresList = structuresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStructures(structuresList);
    };

    fetchStructures();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // Add doctor to Firestore
      await addDoc(collection(db, 'medecins'), {
        uid: user.uid,
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        specialite: form.specialite,
        telephone: form.telephone,
        structureId: form.structureId
      });

      setSuccess('Médecin inscrit avec succès!');
      setForm({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        specialite: '',
        telephone: '',
        structureId: ''
      });
      setShowModal(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container>
      <Button variant="primary" onClick={() => setShowModal(true)}>
        S'inscrire comme médecin
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Inscription Médecin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Spécialité</Form.Label>
              <Form.Control
                type="text"
                name="specialite"
                value={form.specialite}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Structure</Form.Label>
              <Form.Select
                name="structureId"
                value={form.structureId}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une structure</option>
                {structures.map(structure => (
                  <option key={structure.id} value={structure.id}>
                    {structure.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              S'inscrire
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default RegisterMedecins;