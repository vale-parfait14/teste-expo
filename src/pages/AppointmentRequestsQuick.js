import React, { useState, useEffect } from 'react';
import { collection, query, where,addDocs, getDocs, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarCheck, faCalendarTimes, faEye, faTrash, 
  faCheckCircle, faTimesCircle, faExclamationTriangle, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { Modal, Button, Form, Badge, Spinner } from 'react-bootstrap';

const QuickAppointmentRequests = ({ structureId, medecins, patients, onRequestProcessed }) => {
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [message, setMessage] = useState('');

  // Récupérer les demandes de rendez-vous
  const fetchAppointmentRequests = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'quickAppointmentRequests'),
        where('structureId', '==', structureId)
      );
      const querySnapshot = await getDocs(q);
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      setAppointmentRequests(requests);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes de rendez-vous:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (structureId) {
      fetchAppointmentRequests();
    }
  }, [structureId]);

  // Filtrer les demandes par statut
  const filteredRequests = appointmentRequests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  // Voir les détails d'une demande
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  // Accepter une demande de rendez-vous
  const handleAcceptRequest = async (requestId) => {
    try {
      const requestDoc = appointmentRequests.find(req => req.id === requestId);
      if (!requestDoc) return;

      // Mettre à jour le statut de la demande
      await updateDoc(doc(db, 'quickAppointmentRequests', requestId), {
        status: 'accepted',
        processedAt: new Date()
      });

      // Créer un nouveau rendez-vous dans la collection rendezvous
      const appointmentData = {
        structureId: structureId,
        medecinId: requestDoc.preferredDoctorId || '', // Si un médecin préféré a été spécifié
        patientNom: `${requestDoc.firstName} ${requestDoc.lastName}`,
        date: requestDoc.preferredDate,
        heure: requestDoc.preferredTime,
        duree: 30, // Durée par défaut
        motif: requestDoc.reason,
        statut: 'confirmé',
        createdAt: new Date(),
        // Informations de contact du patient
        patientEmail: requestDoc.email,
        patientPhone: requestDoc.phone,
        // Champ indiquant que ce rendez-vous provient d'une demande rapide
        fromQuickRequest: true,
        quickRequestId: requestId
      };

      // Si le patient existe déjà dans la base de données, associer son ID
      if (requestDoc.email) {
        const patientQuery = query(
          collection(db, 'patients'),
          where('email', '==', requestDoc.email)
        );
        const patientSnapshot = await getDocs(patientQuery);
        if (!patientSnapshot.empty) {
          appointmentData.patientId = patientSnapshot.docs[0].id;
        }
      }

      // Ajouter le rendez-vous
      await addDoc(collection(db, 'rendezvous'), appointmentData);

      setMessage('Demande acceptée et rendez-vous créé avec succès.');
      fetchAppointmentRequests();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande:", error);
      setMessage(`Erreur: ${error.message}`);
    }
  };

  // Rejeter une demande de rendez-vous
  const handleRejectRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'quickAppointmentRequests', requestId), {
        status: 'rejected',
        processedAt: new Date()
      });
      
      setMessage('Demande rejetée avec succès.');
      fetchAppointmentRequests();
      if (onRequestProcessed) onRequestProcessed();
    } catch (error) {
      console.error("Erreur lors du rejet de la demande:", error);
      setMessage(`Erreur: ${error.message}`);
    }
  };

  // Supprimer une demande de rendez-vous
  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      try {
        await deleteDoc(doc(db, 'quickAppointmentRequests', requestId));
        
        setMessage('Demande supprimée avec succès.');
        fetchAppointmentRequests();
        if (onRequestProcessed) onRequestProcessed();
      } catch (error) {
        console.error("Erreur lors de la suppression de la demande:", error);
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="quick-appointment-requests">
      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0">Demandes de rendez-vous rapides</h5>
        <div className="filter-buttons">
          <Button 
            variant={filterStatus === 'all' ? 'primary' : 'outline-secondary'} 
            size="sm" 
            className="me-2" 
            onClick={() => setFilterStatus('all')}
          >
            Toutes
          </Button>
          <Button 
            variant={filterStatus === 'pending' ? 'primary' : 'outline-secondary'} 
            size="sm" 
            className="me-2" 
            onClick={() => setFilterStatus('pending')}
          >
            En attente
          </Button>
          <Button 
            variant={filterStatus === 'accepted' ? 'primary' : 'outline-secondary'} 
            size="sm" 
            className="me-2" 
            onClick={() => setFilterStatus('accepted')}
          >
            Acceptées
          </Button>
          <Button 
            variant={filterStatus === 'rejected' ? 'primary' : 'outline-secondary'} 
            size="sm" 
            onClick={() => setFilterStatus('rejected')}
          >
            Rejetées
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Chargement des demandes...</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date souhaitée</th>
                <th>Heure</th>
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.firstName} {request.lastName}</td>
                  <td>{formatDate(request.preferredDate)}</td>
                  <td>{request.preferredTime || 'Non spécifié'}</td>
                  <td>{request.reason.length > 30 ? `${request.reason.substring(0, 30)}...` : request.reason}</td>
                  <td>
                    {request.status === 'pending' && (
                      <Badge bg="warning">En attente</Badge>
                    )}
                    {request.status === 'accepted' && (
                      <Badge bg="success">Acceptée</Badge>
                    )}
                    {request.status === 'rejected' && (
                      <Badge bg="danger">Rejetée</Badge>
                    )}
                  </td>
                  <td>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="me-1" 
                      onClick={() => handleViewDetails(request)}
                      title="Voir détails"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="me-1" 
                          onClick={() => handleAcceptRequest(request.id)}
                          title="Accepter"
                        >
                          <FontAwesomeIcon icon={faCalendarCheck} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="me-1" 
                          onClick={() => handleRejectRequest(request.id)}
                          title="Rejeter"
                        >
                          <FontAwesomeIcon icon={faCalendarTimes} />
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => handleDeleteRequest(request.id)}
                      title="Supprimer"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-muted mb-3" />
          <p className="text-muted">Aucune demande de rendez-vous {filterStatus !== 'all' ? `avec le statut "${filterStatus}"` : ''} trouvée.</p>
        </div>
      )}

      {/* Modal de détails */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails de la demande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <div className="mb-3">
                <h6 className="mb-2">Informations du patient</h6>
                <p><strong>Nom:</strong> {selectedRequest.firstName} {selectedRequest.lastName}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Téléphone:</strong> {selectedRequest.phone}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="mb-2">Détails du rendez-vous</h6>
                <p><strong>Date souhaitée:</strong> {formatDate(selectedRequest.preferredDate)}</p>
                <p><strong>Heure souhaitée:</strong> {selectedRequest.preferredTime || 'Non spécifiée'}</p>
                <p><strong>Médecin préféré:</strong> {
                  selectedRequest.preferredDoctorId 
                    ? medecins.find(m => m.id === selectedRequest.preferredDoctorId)
                      ? `Dr. ${medecins.find(m => m.id === selectedRequest.preferredDoctorId).prenom} ${medecins.find(m => m.id === selectedRequest.preferredDoctorId).nom}`
                      : 'Médecin non trouvé'
                    : 'Aucune préférence'
                }</p>
              </div>
              
              <div className="mb-3">
                <h6 className="mb-2">Motif</h6>
                <p>{selectedRequest.reason}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="mb-2">Informations supplémentaires</h6>
                <p>{selectedRequest.additionalInfo || 'Aucune information supplémentaire'}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="mb-2">Statut</h6>
                {selectedRequest.status === 'pending' && (
                  <Badge bg="warning">En attente</Badge>
                )}
                {selectedRequest.status === 'accepted' && (
                  <Badge bg="success">Acceptée</Badge>
                )}
                {selectedRequest.status === 'rejected' && (
                  <Badge bg="danger">Rejetée</Badge>
                )}
              </div>
              
              {selectedRequest.processedAt && (
                <div className="mb-3">
                  <h6 className="mb-2">Traité le</h6>
                  <p>{new Date(selectedRequest.processedAt.toDate()).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedRequest && selectedRequest.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleAcceptRequest(selectedRequest.id);
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                Accepter
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  handleRejectRequest(selectedRequest.id);
                  setShowDetailsModal(false);
                }}
              >
                <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                Rejeter
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuickAppointmentRequests;
