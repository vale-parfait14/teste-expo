import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';

const QRRegistration = () => {
  const { structureId } = useParams();
  const [structure, setStructure] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchStructure = async () => {
      if (structureId) {
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        if (structureDoc.exists()) {
          setStructure({ id: structureDoc.id, ...structureDoc.data() });
        }
      }
    };
    fetchStructure();
  }, [structureId]);

  if (!structure) {
    return <div>Chargement...</div>;
  }

  return (
    <Container className="py-5">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h4>Inscription via QR Code - {structure.name}</h4>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 hover-effect" onClick={() => navigate(`/register/doctor/${structureId}`)}>
                <Card.Body className="text-center py-5">
                  <i className="fas fa-user-md fa-3x text-primary mb-3"></i>
                  <h5>Je suis médecin</h5>
                  <p className="text-muted">Créer un compte médecin pour rejoindre {structure.name}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 hover-effect" onClick={() => navigate(`/register/patient/${structureId}`)}>
                <Card.Body className="text-center py-5">
                  <i className="fas fa-user fa-3x text-success mb-3"></i>
                  <h5>Je suis patient</h5>
                  <p className="text-muted">Créer un compte patient pour rejoindre {structure.name}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QRRegistration;
