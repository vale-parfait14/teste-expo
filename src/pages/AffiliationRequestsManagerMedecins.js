import React, { useEffect, useState } from 'react';
import { doc, collection, query, where, getDocs, updateDoc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { getAuth } from 'firebase/auth';
import DoctorPlanning from  './DoctorPlanning.js'
import 'bootstrap/dist/css/bootstrap.min.css';

const AffiliationRequestsManager = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [affiliatedDoctors, setAffiliatedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState(null);
  
  const auth = getAuth();
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        // Récupérer les demandes en attente
        const pendingQuery = query(
          collection(db, 'affiliationRequests'),
          where('structureId', '==', user.uid),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingData = [];
        
        for (const docSnap of pendingSnapshot.docs) {
          const requestData = docSnap.data();
          // Récupérer les informations du médecin
          const medecinDoc = await getDoc(doc(db, 'medecins', requestData.medecinId));
          if (medecinDoc.exists()) {
            pendingData.push({
              id: docSnap.id,
              ...requestData,
              medecin: medecinDoc.data()
            });
          }
        }
        setPendingRequests(pendingData);
        
        // Récupérer les demandes traitées
        const processedQuery = query(
          collection(db, 'affiliationRequests'),
          where('structureId', '==', user.uid),
          where('status', 'in', ['approved', 'rejected'])
        );
        const processedSnapshot = await getDocs(processedQuery);
        const processedData = [];
        
        for (const docSnap of processedSnapshot.docs) {
          const requestData = docSnap.data();
          // Récupérer les informations du médecin
          const medecinDoc = await getDoc(doc(db, 'medecins', requestData.medecinId));
          if (medecinDoc.exists()) {
            processedData.push({
              id: docSnap.id,
              ...requestData,
              medecin: medecinDoc.data()
            });
          }
        }
        setProcessedRequests(processedData);
        
        // Récupérer les médecins déjà affiliés
        const affiliatedQuery = query(
          collection(db, 'medecins'),
          where('structureId', '==', user.uid)
        );
        const affiliatedSnapshot = await getDocs(affiliatedQuery);
        const affiliatedData = affiliatedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAffiliatedDoctors(affiliatedData);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        setMessage(`Erreur: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [auth]);
  
  const handleApproveRequest = async (request) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Mettre à jour le statut de la demande
      await updateDoc(doc(db, 'affiliationRequests', request.id), {
        status: 'approved',
        approvedBy: user.uid,
        approvedAt: Timestamp.now()
      });
      
      // Mettre à jour le médecin avec l'ID de la structure
      await updateDoc(doc(db, 'medecins', request.medecinId), {
        structureId: user.uid,
        structureAffiliationDate: Timestamp.now(),
        structureNom: request.structureName || '',
        isAffiliated: true
      });
      
      setMessage('Demande d\'affiliation approuvée avec succès.');
      
      // Rafraîchir les listes
      const updatedPending = pendingRequests.filter(req => req.id !== request.id);
      setPendingRequests(updatedPending);
      
      const updatedRequest = {
        ...request,
        status: 'approved',
        approvedBy: user.uid,
        approvedAt: Timestamp.now()
      };
      setProcessedRequests([updatedRequest, ...processedRequests]);
      
      // Ajouter le médecin à la liste des médecins affiliés
      const medecinDoc = await getDoc(doc(db, 'medecins', request.medecinId));
      if (medecinDoc.exists()) {
        const medecinData = medecinDoc.data();
        setAffiliatedDoctors([
          {
            id: request.medecinId,
            ...medecinData,
            structureId: user.uid,
            structureAffiliationDate: Timestamp.now(),
            isAffiliated: true
          },
          ...affiliatedDoctors
        ]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la demande:', error);
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  const handleRejectRequest = async (request) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Mettre à jour le statut de la demande
      await updateDoc(doc(db, 'affiliationRequests', request.id), {
        status: 'rejected',
        rejectedBy: user.uid,
        rejectedAt: Timestamp.now()
      });
      
      setMessage('Demande d\'affiliation rejetée.');
      
      // Rafraîchir les listes
      const updatedPending = pendingRequests.filter(req => req.id !== request.id);
      setPendingRequests(updatedPending);
      
      const updatedRequest = {
        ...request,
        status: 'rejected',
        rejectedBy: user.uid,
        rejectedAt: Timestamp.now()
      };
      setProcessedRequests([updatedRequest, ...processedRequests]);
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  const handleRemoveAffiliation = async (doctorId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affiliation ? Le médecin ne sera plus associé à votre structure.')) {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        // Mettre à jour le médecin pour retirer l'affiliation
        await updateDoc(doc(db, 'medecins', doctorId), {
          structureId: null,
          structureAffiliationDate: null,
          structureNom: '',
          isAffiliated: false
        });
        
        // Ajouter une entrée dans l'historique des affiliations
        await addDoc(collection(db, 'affiliationHistory'), {
          medecinId: doctorId,
          structureId: user.uid,
          action: 'removed',
          timestamp: Timestamp.now()
        });
        
        setMessage('Affiliation supprimée avec succès.');
        
        // Rafraîchir la liste des médecins affiliés
        const updatedAffiliatedDoctors = affiliatedDoctors.filter(doc => doc.id !== doctorId);
        setAffiliatedDoctors(updatedAffiliatedDoctors);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'affiliation:', error);
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };
  
  const viewDoctorDetails = async (doctorId) => {
    try {
      const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
      if (doctorDoc.exists()) {
        setDoctorDetails({
          id: doctorId,
          ...doctorDoc.data()
        });
        setShowModal(true);
      } else {
        setMessage('Informations du médecin non trouvées.');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du médecin:', error);
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  const closeModal = () => {
    setShowModal(false);
    setDoctorDetails(null);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    if (timestamp instanceof Timestamp) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des Affiliations Médecins</h2>
      
      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      
      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <div className="card-header bg-warning text-white">
              <h5 className="mb-0">Demandes d'affiliation en attente ({pendingRequests.length})</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Médecin</th>
                        <th>Spécialité</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Date de demande</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map(request => (
                        <tr key={request.id}>
                          <td>{request.medecin.prenom} {request.medecin.nom}</td>
                          <td>{request.medecin.specialite}</td>
                          <td>{request.medecin.email}</td>
                          <td>{request.medecin.telephone}</td>
                          <td>{formatDate(request.createdAt)}</td>
                          <td>
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-info me-1"
                                onClick={() => viewDoctorDetails(request.medecinId)}
                              >
                                <i className="bi bi-eye"></i> Détails
                              </button>
                              <button 
                                className="btn btn-sm btn-success me-1"
                                onClick={() => handleApproveRequest(request)}
                              >
                                <i className="bi bi-check-lg"></i> Accepter
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRejectRequest(request)}
                              >
                                <i className="bi bi-x-lg"></i> Refuser
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  Aucune demande d'affiliation en attente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Médecins affiliés ({affiliatedDoctors.length})</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : affiliatedDoctors.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Médecin</th>
                        <th>Spécialité</th>
                        <th>Email</th>
                        <th>Téléphone</th>
                        <th>Date d'affiliation</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affiliatedDoctors.map(doctor => (
                        <tr key={doctor.id}>
                          <td>
                            <span className="badge bg-success me-1">Affilié</span>
                            {doctor.prenom} {doctor.nom}
                          </td>
                          <td>{doctor.specialite}</td>
                          <td>{doctor.email}</td>
                          <td>{doctor.telephone}</td>
                          <td>{formatDate(doctor.structureAffiliationDate)}</td>
                          <td>
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-info me-1"
                                onClick={() => viewDoctorDetails(doctor.id)}
                              >
                                <i className="bi bi-eye"></i> Détails
                              </button>
                              <button 
                                className="btn btn-sm btn-primary me-1"
                                onClick={() => navigate(`/planning/${doctor.id}`)}
                              >
                                <i className="bi bi-calendar-check"></i> Planning
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRemoveAffiliation(doctor.id)}
                              >
                                <i className="bi bi-trash"></i> Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  Aucun médecin affilié à votre structure.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Historique des demandes traitées</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : processedRequests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Médecin</th>
                        <th>Spécialité</th>
                        <th>Date de demande</th>
                        <th>Statut</th>
                        <th>Date de traitement</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedRequests.map(request => (
                        <tr key={request.id}>
                          <td>{request.medecin.prenom} {request.medecin.nom}</td>
                          <td>{request.medecin.specialite}</td>
                          <td>{formatDate(request.createdAt)}</td>
                          <td>
                            <span className={`badge ${request.status === 'approved' ? 'bg-success' : 'bg-danger'}`}>
                              {request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                            </span>
                          </td>
                          <td>{formatDate(request.approvedAt || request.rejectedAt)}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => viewDoctorDetails(request.medecinId)}
                            >
                              <i className="bi bi-eye"></i> Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  Aucune demande d'affiliation traitée.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal pour afficher les détails du médecin */}
      {showModal && doctorDetails && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Détails du médecin</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Informations personnelles</h6>
                    <p><strong>Nom:</strong> {doctorDetails.nom}</p>
                    <p><strong>Prénom:</strong> {doctorDetails.prenom}</p>
                    <p><strong>Email:</strong> {doctorDetails.email}</p>
                    <p><strong>Téléphone:</strong> {doctorDetails.telephone}</p>
                    <p><strong>Spécialité:</strong> {doctorDetails.specialite} {doctorDetails.specialiteAutre ? `(${doctorDetails.specialiteAutre})` : ''}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Disponibilités</h6>
                    {doctorDetails.disponibilites && Array.isArray(doctorDetails.disponibilites) ? (
                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>Jour</th>
                            <th>Début</th>
                            <th>Fin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorDetails.disponibilites.map((dispo, index) => (
                            <tr key={index}>
                              <td>{dispo.jour}</td>
                              <td>{dispo.heureDebut}</td>
                              <td>{dispo.heureFin}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Aucune disponibilité définie</p>
                    )}
                  </div>
                </div>
                
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Assurances acceptées</h6>
                    <p>
                      {doctorDetails.assurances && doctorDetails.assurances.length > 0 ? (
                        doctorDetails.assurances.map((assurance, index) => (
                          <span key={index} className="badge bg-info me-1">{assurance}</span>
                        ))
                      ) : (
                        "Aucune assurance spécifiée"
                      )}
                      {doctorDetails.assuranceAutre && (
                        <span className="ms-2">(Autres: {doctorDetails.assuranceAutre})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DoctorPlanning/>
    </div>
  );
};

export default AffiliationRequestsManager;
