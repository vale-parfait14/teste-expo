import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Row, Col, Modal } from 'react-bootstrap';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';

const StructureConsultationRequests = ({ structureId }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(
          collection(db, 'consultationRequests'),
          where('structureId', '==', structureId),
          where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(q);
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Vérifier l'inscription pour chaque patient
        const requestsWithRegistration = await Promise.all(
          requestsData.map(async (request) => {
            const patientRef = collection(db, 'structures', structureId, 'patients');
            const patientQuery = query(patientRef, where('id', '==', request.patientId));
            const patientSnapshot = await getDocs(patientQuery);
            
            return {
              ...request,
              requiresRegistration: patientSnapshot.empty
            };
          })
        );
        
        setRequests(requestsWithRegistration);
      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
      }
    };

    if (structureId) {
      fetchRequests();
    }
  }, [structureId]);

  const handleRequestResponse = async (requestId, response) => {
    try {
      await updateDoc(doc(db, 'consultationRequests', requestId), {
        status: response,
        responseDate: new Date().toISOString()
      });

      setRequests(requests.filter(req => req.id !== requestId));
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
    }
  };

  return (
    <>
      <Card className="consultation-requests-card shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-calendar-check me-2"></i>
            Demandes de consultation
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {requests.length > 0 ? (
            <div className="requests-list">
              {requests.map((request) => (
                <div 
                  key={request.id} 
                  className="request-item p-3 border-bottom hover-effect"
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowDetailsModal(true);
                  }}
                >
                  <Row className="align-items-center">
                    <Col md={3}>
                      <h6 className="mb-1">
                        {request.patientInfo.nom} {request.patientInfo.prenom}
                      </h6>
                      <small className="text-muted">
                        <i className="fas fa-phone me-1"></i>
                        {request.patientInfo.telephone}
                      </small>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1">
                        <i className="fas fa-user-md me-1"></i>
                        Dr. {request.doctorInfo.nom}
                      </p>
                      <small className="text-muted">
                        {request.doctorInfo.specialite}
                      </small>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1">
                        <i className="fas fa-calendar me-1"></i>
                        {request.day}
                      </p>
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        {request.timeSlot}
                      </small>
                    </Col>
                    <Col md={3} className="text-end">
                      <Badge 
                        bg={request.requiresRegistration ? "warning" : "info"}
                        className="rounded-pill px-3 py-2"
                      >
                        {request.requiresRegistration ? (
                          <>
                            <i className="fas fa-user-plus me-1"></i>
                            RDV + Inscription
                          </>
                        ) : (
                          <>
                            <i className="fas fa-calendar-check me-1"></i>
                            RDV Simple
                          </>
                        )}
                      </Badge>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
              <p className="text-muted">Aucune demande en attente</p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-info-circle me-2"></i>
            Détails de la demande
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div className="request-details">
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-primary mb-3">Information patient</h6>
                  <p><strong>Nom:</strong> {selectedRequest.patientInfo.nom}</p>
                  <p><strong>Prénom:</strong> {selectedRequest.patientInfo.prenom}</p>
                  <p><strong>Téléphone:</strong> {selectedRequest.patientInfo.telephone}</p>
                  <p><strong>Email:</strong> {selectedRequest.patientInfo.email}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-primary mb-3">Information rendez-vous</h6>
                  <p><strong>Médecin:</strong> Dr. {selectedRequest.doctorInfo.nom}</p>
                  <p><strong>Spécialité:</strong> {selectedRequest.doctorInfo.specialite}</p>
                  <p><strong>Jour:</strong> {selectedRequest.day}</p>
                  <p><strong>Heure:</strong> {selectedRequest.timeSlot}</p>
                </Col>
              </Row>

              <div className="mb-4">
                <h6 className="text-primary mb-3">Motif de la consultation</h6>
                <p className="bg-light p-3 rounded">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.requiresRegistration && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Ce patient nécessite une inscription dans votre structure
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDetailsModal(false)}
          >
            Fermer
          </Button>
          <Button 
            variant="danger"
            onClick={() => handleRequestResponse(selectedRequest.id, 'rejected')}
          >
            <i className="fas fa-times me-2"></i>
            Refuser
          </Button>
          <Button 
            variant="success"
            onClick={() => handleRequestResponse(selectedRequest.id, 'accepted')}
          >
            <i className="fas fa-check me-2"></i>
            Accepter
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .consultation-requests-card {
          border: none;
          border-radius: 1rem;
          overflow: hidden;
        }

        .requests-list {
          max-height: 500px;
          overflow-y: auto;
        }

        .request-item {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .request-item:hover {
          background-color: #f8f9fa;
          transform: translateX(5px);
        }

        .hover-effect {
          transition: all 0.2s ease;
        }

        .hover-effect:hover {
          background-color: #f8f9fa;
        }

        .request-details p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </>
  );
};

export default StructureConsultationRequests;