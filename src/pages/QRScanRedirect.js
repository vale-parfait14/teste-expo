import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { Container, Card, Button, Spinner } from 'react-bootstrap';

const QRScanRedirect = () => {
  const { structureId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [structureInfo, setStructureInfo] = useState(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Récupérer les informations de la structure
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        if (!structureDoc.exists()) {
          throw new Error('Structure non trouvée');
        }
        setStructureInfo(structureDoc.data());

        // Vérifier si l'utilisateur est connecté
        const user = auth.currentUser;
        if (user) {
          // Rediriger vers la page de sélection de spécialité
          navigate(`/structure-specialities/${structureId}`);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur:', error);
        navigate('/error');
      }
    };

    checkAuthAndRedirect();
  }, [structureId, navigate, auth]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Body className="text-center p-5">
          <i className="fas fa-hospital text-primary fa-3x mb-4"></i>
          <h4 className="mb-4">
            {structureInfo?.name}
          </h4>
          <p className="text-muted mb-4">
            Pour prendre rendez-vous, veuillez d'abord vous connecter ou créer un compte
          </p>
          <div className="d-grid gap-3">
            <Button 
              variant="primary"
              onClick={() => navigate('/login', { 
                state: { redirectTo: `/structure-specialities/${structureId}` }
              })}
            >
              <i className="fas fa-sign-in-alt me-2"></i>
              Se connecter
            </Button>
            <Button 
              variant="success"
              onClick={() => navigate('/register', {
                state: { redirectTo: `/structure-specialities/${structureId}` }
              })}
            >
              <i className="fas fa-user-plus me-2"></i>
              Créer un compte
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QRScanRedirect;
