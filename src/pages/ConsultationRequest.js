import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../components/firebase-config.js';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

const ConsultationRequest = () => {
  const { structureId, speciality } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [structure, setStructure] = useState(null);
  const [requestForm, setRequestForm] = useState({
    preferredDate: '',
    preferredTime: '',
    reason: '',
    urgency: 'normal'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchStructure = async () => {
      const structureDoc = await getDoc(doc(db, 'structures', structureId));
      if (structureDoc.exists()) {
        setStructure({ id: structureDoc.id, ...structureDoc.data() });
      }
    };

    fetchStructure();
  }, [structureId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const consultationRequest = {
        structureId,
        speciality,
        patientId: auth.currentUser.uid,
        patientName: auth.currentUser.displayName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...requestForm
      };

      await addDoc(collection(db, 'consultationRequests'), consultationRequest);
      setSuccess(true);
      setTimeout(() => {
        navigate('/patient-dashboard');
      }, 3000);
    } catch (error) {
      setError('Une erreur est survenue lors de la soumission de la demande');
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Demande de consultation - {speciality}</h4>
        </Card.Header>
        <Card.Body>
          {success ? (
            <Alert variant="success">
              Votre demande a été envoyée avec succès ! Vous allez être redirigé...
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Date souhaitée</Form.Label>
                <Form.Control
                  type="date"
                  value={requestForm.preferredDate}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    preferredDate: e.target.value
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Heure souhaitée</Form.Label>
                <Form.Control
                  type="time"
                  value={requestForm.preferredTime}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    preferredTime: e.target.value
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Motif de la consultation</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    reason: e.target.value
                  })}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Niveau d'urgence</Form.Label>
                <Form.Select
                  value={requestForm.urgency}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    urgency: e.target.value
                  })}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="very-urgent">Très urgent</option>
                </Form.Select>
              </Form.Group>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <div className="d-grid">
                <Button type="submit" variant="primary">
                  Envoyer la demande
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConsultationRequest;
