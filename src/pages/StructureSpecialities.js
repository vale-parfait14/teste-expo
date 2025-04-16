import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { Container, Card, Row, Col, Button, Spinner } from 'react-bootstrap';

const StructureSpecialities = () => {
  const { structureId } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        if (structureDoc.exists()) {
          setStructure({ id: structureDoc.id, ...structureDoc.data() });
        }
        setLoading(false);
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };

    fetchStructure();
  }, [structureId]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!structure) {
    return (
      <Container className="py-5">
        <Card>
          <Card.Body className="text-center">
            <h4>Structure non trouvée</h4>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">{structure.name}</h4>
        </Card.Header>
        <Card.Body>
          <h5 className="mb-4">Sélectionnez une spécialité :</h5>
          <Row xs={1} md={2} lg={3} className="g-4">
            {structure.specialities?.map((speciality) => (
              <Col key={speciality}>
                <Card 
                  className="h-100 hover-lift cursor-pointer"
                  onClick={() => navigate(`/consultation-request/${structureId}/${speciality}`)}
                >
                  <Card.Body className="text-center">
                    <i className="fas fa-user-md fa-2x text-primary mb-3"></i>
                    <h5>{speciality}</h5>
                    <Button variant="outline-primary" className="mt-3">
                      Sélectionner
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StructureSpecialities;
