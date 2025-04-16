import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../components/firebase-config.js';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

const AccordMedecins = () => {
  const [medecins, setMedecins] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedecins = async () => {
      const medecinsCollection = collection(db, 'medecins');
      const q = query(medecinsCollection, orderBy('createdAt', 'desc')); // Order by creation date
      const medecinsSnapshot = await getDocs(q);
      const medecinsList = medecinsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(medecin => medecin.source === 'register'); // Filtrer par source 'register'
      setMedecins(medecinsList);
    };

    fetchMedecins();
  }, []);

  const handleAccept = async (medecin) => {
    try {
      const medecinRef = doc(db, 'medecins', medecin.id);
      await updateDoc(medecinRef, { status: 'accepted', visible: true });
      navigate.push('/MedecinsDashboard', { medecin });
    } catch (error) {
      console.error('Error accepting medecin:', error);
    }
  };

  const handleReject = async (medecinId) => {
    try {
      await deleteDoc(doc(db, 'medecins', medecinId));
      setMedecins(medecins.filter(medecin => medecin.id !== medecinId));
    } catch (error) {
      console.error('Error deleting medecin:', error);
    }
  };

  return (
    <Container>
      <h2>Médecins Créés</h2>
      <Row>
        {medecins.filter(medecin => medecin.status === 'pending').map(medecin => (
          <Col key={medecin.id} md={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>{medecin.nom} {medecin.prenom}</Card.Title>
                <Card.Text>
                  <strong>Spécialité:</strong> {medecin.specialite}<br />
                  <strong>Email:</strong> {medecin.email}<br />
                  <strong>Téléphone:</strong> {medecin.telephone}
                </Card.Text>
                <Button variant="success" onClick={() => handleAccept(medecin)}>Accepter</Button>
                <Button variant="danger" className="ms-2" onClick={() => handleReject(medecin.id)}>Rejeter</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AccordMedecins;