import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';

const Home = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const backgroundImages = [
    'http://cliniquecroixbleue.com/img/cities/facadeclinique.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/courinterieure.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/blocopperatoire.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/sallepediatrie.jpg',
    'http://cliniquecroixbleue.com/img/cities/pediatrie2.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/couveuse.jpg'
  
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container fluid className="min-vh-100 home-container p-0">
      <div className="background-overlay"></div>
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className="background-image"
          style={{
            backgroundImage: `url(${image})`,
            opacity: currentImageIndex === index ? 1 : 0
          }}
        />
      ))}
      
      <Row className="h-100 m-0 position-relative">
        <Col md={6} className="d-flex flex-column justify-content-center text-white p-5">
          <p className="mb-4 display-4 fw-bold">Bienvenue à la CLINIQUE CROIX BLEUE</p>
          <p className="lead mb-4">
            Au  service de vos familles depuis 1964
          </p>
          <div className="features mb-4">
            <h5>✓ Accès aux professionnels de santé</h5>
            <h5>✓ Gestion des rendez-vous médicaux</h5>
            <h5>✓ NOS PRESTATIONS: Accouchement ,Cancéroligie, Dépistage ...</h5>
          </div>
          <Button 
            size="lg" 
            className="start-button w-50"
            onClick={() => navigate('/auth')}
          >
            Commencer
          </Button>
        </Col>
      </Row>

      <style jsx>{`
        .home-container {
          position: relative;
          overflow: hidden;
        }

        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          transition: opacity 1s ease-in-out;
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.8) 0%,
            rgba(0, 0, 0, 0.6) 50%,
            rgba(0, 0, 0, 0.4) 100%
          );
          z-index: 1;
        }

        .row {
          z-index: 2;
        }

        .start-button {
          background: linear-gradient(-45deg, rgb(201, 201, 201), rgb(40, 98, 197), rgb(182, 219, 224));
          background-size: 400% 400%;
          animation: backgroundMove 10s infinite linear;
          border: none;
          transition: transform 0.3s ease;
        }

        .start-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .features h5 {
          margin-bottom: 1rem;
          opacity: 0;
          animation: fadeIn 0.5s ease forwards;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .features h5:nth-child(1) { animation-delay: 0.5s; }
        .features h5:nth-child(2) { animation-delay: 1s; }
        .features h5:nth-child(3) { animation-delay: 1.5s; }

        h1, .lead {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes backgroundMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Container>
  );
};

export default Home;
