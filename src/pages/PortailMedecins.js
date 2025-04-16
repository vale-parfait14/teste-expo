import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

const PortailMedecins = () => {
  const navigate = useNavigate();

  const goToAccordMedecins = () => {
    navigate('/AccordMedecins');
  };

  return (
    <Container className="text-center mt-5">
      <h2>Portail Médecins</h2>
      <p>Bienvenue sur le portail des médecins. Veuillez vérifier et accepter ou rejeter les médecins créés.</p>
      <Button variant="primary" onClick={goToAccordMedecins}>Afficher les Médecins Créés</Button>
    </Container>
  );
};

export default PortailMedecins;