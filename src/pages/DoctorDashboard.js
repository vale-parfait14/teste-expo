import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

const MedecinsDashboard = () => {
  const location = useLocation();
  const medecin = location.state.medecin;

  return (
    <Container className="mt-5">
      <h2>Tableau de Bord du Médecin</h2>
      <Card>
        <Card.Body>
          <Card.Title>{medecin.nom} {medecin.prenom}</Card.Title>
          <Card.Text>
            <strong>Spécialité:</strong> {medecin.specialite}<br />
            <strong>Email:</strong> {medecin.email}<br />
            <strong>Téléphone:</strong> {medecin.telephone}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MedecinsDashboard;