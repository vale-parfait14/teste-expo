import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, deleteDoc, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { getAuth } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

const AffiliationRequestsManager = () => {
  const [affiliationRequests, setAffiliationRequests] = useState([]);
  const [rendezVousRequests, setRendezVousRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('affiliations');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('en attente');
  const [filtrePatient, setFiltrePatient] = useState('');
  const [filtreMedecin, setFiltreMedecin] = useState('');
  const [structureData, setStructureData] = useState(null);
  
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
  
      try {
        // Récupérer les informations de la structure
        const structureDoc = await getDoc(doc(db, 'structures', auth.currentUser.uid));
        if (structureDoc.exists()) {
          setStructureData(structureDoc.data());
        }
        
        // Récupérer les médecins de cette structure uniquement
        const medecinsQuery = query(
          collection(db, 'medecins'),
          where("structureId", "==", auth.currentUser.uid)
        );
        const medecinsSnapshot = await getDocs(medecinsQuery);
        const medecinsData = medecinsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMedecins(medecinsData);
  
        // Mettre en place des écouteurs en temps réel pour les demandes d'affiliation
        const affiliationsQuery = query(
          collection(db, 'affiliations'),
          where('structureId', '==', auth.currentUser.uid)
        );
  
        const unsubscribeAffiliations = onSnapshot(affiliationsQuery, async (snapshot) => {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAtFormatted: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Date inconnue'
          }));
          setAffiliationRequests(requests);
          
          // Récupérer les IDs des patients qui ont fait des demandes
          const patientIds = [...new Set(requests.map(req => req.patientId))];
          
          // Récupérer les informations de ces patients
          if (patientIds.length > 0) {
            const patientsData = [];
            for (const patientId of patientIds) {
              const patientDoc = await getDoc(doc(db, 'patients', patientId));
              if (patientDoc.exists()) {
                patientsData.push({
                  id: patientDoc.id,
                  ...patientDoc.data()
                });
              }
            }
            
            // Fusionner avec les patients déjà affiliés à la structure
            const affiliatedPatientsQuery = query(
              collection(db, 'patients'),
              where("structureId", "==", auth.currentUser.uid)
            );
            const affiliatedPatientsSnapshot = await getDocs(affiliatedPatientsQuery);
            const affiliatedPatientsData = affiliatedPatientsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Combiner les deux ensembles de patients sans doublons
            const allPatients = [...patientsData];
            affiliatedPatientsData.forEach(patient => {
              if (!allPatients.some(p => p.id === patient.id)) {
                allPatients.push(patient);
              }
            });
            
            setPatients(allPatients);
          }
        });
  
        // Mettre en place des écouteurs en temps réel pour les demandes de rendez-vous
        const rendezVousQuery = query(
          collection(db, 'rendezvous'),
          where('structureId', '==', auth.currentUser.uid)
        );
  
        const unsubscribeRendezVous = onSnapshot(rendezVousQuery, (snapshot) => {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAtFormatted: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'Date inconnue'
          }));
          setRendezVousRequests(requests);
        });
  
        setLoading(false);
  
        return () => {
          unsubscribeAffiliations();
          unsubscribeRendezVous();
        };
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setMessage(`Erreur: ${error.message}`);
        setLoading(false);
      }
    };
  
    fetchData();
  }, [auth.currentUser]);

  // Gérer les demandes d'affiliation
  const handleAffiliationRequest = async (id, status) => {
    try {
      // Mettre à jour le statut de la demande d'affiliation
      await updateDoc(doc(db, 'affiliations', id), {
        statut: status,
        updatedAt: new Date()
      });
      
      // Si la demande est acceptée, ajouter/mettre à jour le patient dans la structure
      if (status === 'acceptée') {
        // Récupérer les détails de la demande d'affiliation
        const affiliationDoc = await getDoc(doc(db, 'affiliations', id));
        if (affiliationDoc.exists()) {
          const affiliationData = affiliationDoc.data();
          const patientId = affiliationData.patientId;
          
          // Récupérer les données du patient
          const patientDoc = await getDoc(doc(db, 'patients', patientId));
          if (patientDoc.exists()) {
            // Mettre à jour le patient avec l'ID de la structure
            await updateDoc(doc(db, 'patients', patientId), {
              structureId: auth.currentUser.uid,
              updatedAt: new Date()
            });
            
            // Ajouter une notification pour le patient
            await addDoc(collection(db, 'notifications'), {
              userId: patientId,
              titre: "Demande d'affiliation acceptée",
              message: `Votre demande d'affiliation à ${structureData?.nom || 'notre structure'} a été acceptée.`,
              lu: false,
              createdAt: new Date()
            });
          }
        }
      } else if (status === 'refusée') {
        // Si la demande est refusée, envoyer une notification au patient
        const affiliationDoc = await getDoc(doc(db, 'affiliations', id));
        if (affiliationDoc.exists()) {
          const affiliationData = affiliationDoc.data();
          const patientId = affiliationData.patientId;
          
          // Ajouter une notification pour le patient
          await addDoc(collection(db, 'notifications'), {
            userId: patientId,
            titre: "Demande d'affiliation refusée",
            message: `Votre demande d'affiliation à ${structureData?.nom || 'notre structure'} a été refusée.`,
            lu: false,
            createdAt: new Date()
          });
        }
      }
      
      setMessage(`Demande d'affiliation ${status === 'acceptée' ? 'acceptée' : 'refusée'} avec succès.`);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      setMessage(`Erreur: ${error.message}`);
    }
  };

  // Gérer les demandes de rendez-vous
  const handleRendezVousRequest = async (id, status) => {
    try {
      // Mettre à jour le statut de la demande de rendez-vous
      await updateDoc(doc(db, 'rendezvous', id), {
        statut: status,
        updatedAt: new Date()
      });
      
      // Si la demande est confirmée, ajouter le rendez-vous dans la liste des rendez-vous de la structure
      if (status === 'confirmé') {
        // Récupérer les détails de la demande de rendez-vous
        const rendezVousDoc = await getDoc(doc(db, 'rendezvous', id));
        if (rendezVousDoc.exists()) {
          const rendezVousData = rendezVousDoc.data();
          
          // Récupérer les informations du médecin et du patient pour les notifications
          const medecin = medecins.find(m => m.id === rendezVousData.medecinId);
          const patient = patients.find(p => p.id === rendezVousData.patientId);
          
          // Créer un nouveau rendez-vous dans la collection 'rendezvous' de la structure
          await addDoc(collection(db, 'rendezvous'), {
            patientId: rendezVousData.patientId,
            medecinId: rendezVousData.medecinId,
            date: rendezVousData.date,
            heure: rendezVousData.heure,
            duree: rendezVousData.duree || 30, // Durée par défaut si non spécifiée
            motif: rendezVousData.motif,
            statut: 'confirmé',
            structureId: auth.currentUser.uid,
            createdAt: new Date(),
            urgent: rendezVousData.urgent || false,
            patientNom: patient ? `${patient.prenom} ${patient.nom}` : rendezVousData.patientNom,
            medecinNom: medecin ? `${medecin.prenom} ${medecin.nom}` : rendezVousData.medecinNom,
            medecinSpecialite: medecin ? medecin.specialite : rendezVousData.medecinSpecialite
          });
          
          // Ajouter une notification pour le patient
          await addDoc(collection(db, 'notifications'), {
            userId: rendezVousData.patientId,
            titre: "Rendez-vous confirmé",
            message: `Votre rendez-vous du ${new Date(rendezVousData.date).toLocaleDateString()} à ${rendezVousData.heure} avec Dr. ${medecin?.prenom || ''} ${medecin?.nom || ''} a été confirmé.`,
            lu: false,
            createdAt: new Date()
          });
          
          // Ajouter une notification pour le médecin
          await addDoc(collection(db, 'notifications'), {
            userId: rendezVousData.medecinId,
            titre: "Nouveau rendez-vous",
            message: `Un rendez-vous avec ${patient?.prenom || ''} ${patient?.nom || ''} a été confirmé pour le ${new Date(rendezVousData.date).toLocaleDateString()} à ${rendezVousData.heure}.`,
            lu: false,
            createdAt: new Date()
          });
        }
      } else if (status === 'annulé') {
        // Si la demande est annulée, envoyer une notification au patient
        const rendezVousDoc = await getDoc(doc(db, 'rendezvous', id));
        if (rendezVousDoc.exists()) {
          const rendezVousData = rendezVousDoc.data();
          
          // Ajouter une notification pour le patient
          await addDoc(collection(db, 'notifications'), {
            userId: rendezVousData.patientId,
            titre: "Rendez-vous annulé",
            message: `Votre demande de rendez-vous pour le ${new Date(rendezVousData.date).toLocaleDateString()} a été annulée par la structure.`,
            lu: false,
            createdAt: new Date()
          });
        }
      }
      
      setMessage(`Demande de rendez-vous ${status === 'confirmé' ? 'acceptée' : 'refusée'} avec succès.`);
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      setMessage(`Erreur: ${error.message}`);
    }
  };

  // Supprimer une demande d'affiliation
  const deleteAffiliationRequest = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette demande d'affiliation ?")) {
      try {
        await deleteDoc(doc(db, 'affiliations', id));
        setMessage("Demande d'affiliation supprimée avec succès.");
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la demande:", error);
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };

  // Supprimer une demande de rendez-vous
  const deleteRendezVousRequest = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette demande de rendez-vous ?")) {
      try {
        await deleteDoc(doc(db, 'rendezvous', id));
        setMessage("Demande de rendez-vous supprimée avec succès.");
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error("Erreur lors de la suppression de la demande:", error);
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };

  // Obtenir les informations complètes d'un patient
  const getPatientInfo = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient : { nom: 'Patient inconnu', prenom: '' };
  };

  // Obtenir les informations complètes d'un médecin
  const getMedecinInfo = (medecinId) => {
    const medecin = medecins.find(m => m.id === medecinId);
    return medecin ? medecin : { nom: 'Médecin inconnu', prenom: '' };
  };

  // Filtrer les demandes d'affiliation
  const filteredAffiliationRequests = affiliationRequests.filter(request => {
    if (filtreStatut && request.statut !== filtreStatut) {
      return false;
    }
    if (filtrePatient && request.patientId !== filtrePatient) {
      return false;
    }
    return true;
  });

  // Filtrer les demandes de rendez-vous
  const filteredRendezVousRequests = rendezVousRequests.filter(request => {
    if (filtreStatut && request.statut !== filtreStatut) {
      return false;
    }
    if (filtrePatient && request.patientId !== filtrePatient) {
      return false;
    }
    if (filtreMedecin && request.medecinId !== filtreMedecin) {
      return false;
    }
    return true;
  });

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir la classe de badge pour un statut donné
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'acceptée':
      case 'confirmé':
        return 'bg-success';
      case 'en attente':
        return 'bg-warning';
      case 'refusée':
      case 'annulé':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Gestion des demandes</h2>

      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'affiliations' ? 'active' : ''}`} 
            onClick={() => setActiveTab('affiliations')}
          >
            Demandes d'affiliation
            {affiliationRequests.filter(req => req.statut === 'en attente').length > 0 && (
              <span className="badge bg-danger ms-2">
                {affiliationRequests.filter(req => req.statut === 'en attente').length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'rendezVous' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rendezVous')}
          >
            Demandes de rendez-vous
            {rendezVousRequests.filter(req => req.statut === 'en attente').length > 0 && (
              <span className="badge bg-danger ms-2">
                {rendezVousRequests.filter(req => req.statut === 'en attente').length}
              </span>
            )}
          </button>
        </li>
      </ul>

      {/* Filtres communs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Filtrer par statut</label>
              <select 
                className="form-select" 
                value={filtreStatut} 
                onChange={(e) => setFiltreStatut(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="en attente">En attente</option>
                <option value={activeTab === 'affiliations' ? 'acceptée' : 'confirmé'}>
                  {activeTab === 'affiliations' ? 'Acceptée' : 'Confirmé'}
                </option>
                <option value={activeTab === 'affiliations' ? 'refusée' : 'annulé'}>
                  {activeTab === 'affiliations' ? 'Refusée' : 'Annulé'}
                </option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrer par patient</label>
              <select 
                className="form-select" 
                value={filtrePatient} 
                onChange={(e) => setFiltrePatient(e.target.value)}
              >
                <option value="">Tous les patients</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.prenom} {patient.nom}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'rendezVous' && (
              <div className="col-md-4">
                <label className="form-label">Filtrer par médecin</label>
                <select 
                  className="form-select" 
                  value={filtreMedecin} 
                  onChange={(e) => setFiltreMedecin(e.target.value)}
                >
                  <option value="">Tous les médecins</option>
                  {medecins.map(medecin => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Affichage des demandes d'affiliation */}
      {activeTab === 'affiliations' && (
        <div>
          <h3 className="mb-3">Demandes d'affiliation</h3>
          
          {filteredAffiliationRequests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date de demande</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliationRequests.map(request => {
                    const patient = getPatientInfo(request.patientId);
                    return (
                      <tr key={request.id}>
                        <td>
                          <strong>{patient.prenom} {patient.nom}</strong>
                          {patient.email && <div className="small text-muted">{patient.email}</div>}
                          {patient.telephone && <div className="small text-muted">{patient.telephone}</div>}
                        </td>
                        <td>{request.createdAt ? formatDate(request.createdAt.toDate()) : request.createdAtFormatted}</td>
                        <td>{request.motif || 'Non spécifié'}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(request.statut)}`}>
                            {request.statut.charAt(0).toUpperCase() + request.statut.slice(1)}
                          </span>
                        </td>
                        <td>
                          {request.statut === 'en attente' ? (
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-success me-1" 
                                onClick={() => handleAffiliationRequest(request.id, 'acceptée')}
                              >
                                <i className="bi bi-check-lg"></i> Accepter
                              </button>
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleAffiliationRequest(request.id, 'refusée')}
                              >
                                <i className="bi bi-x-lg"></i> Refuser
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => deleteAffiliationRequest(request.id)}
                            >
                              <i className="bi bi-trash"></i> Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucune demande d'affiliation trouvée avec les critères sélectionnés.
            </div>
          )}
        </div>
      )}

      {/* Affichage des demandes de rendez-vous */}
      {activeTab === 'rendezVous' && (
        <div>
          <h3 className="mb-3">Demandes de rendez-vous</h3>
          
          {filteredRendezVousRequests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Médecin</th>
                    <th>Date & Heure</th>
                    <th>Motif</th>
                    <th>Urgent</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRendezVousRequests.map(request => {
                    const patient = getPatientInfo(request.patientId);
                    const medecin = getMedecinInfo(request.medecinId);
                    return (
                      <tr key={request.id} className={request.urgent ? 'table-warning' : ''}>
                        <td>
                          <strong>{patient.prenom} {patient.nom}</strong>
                          {patient.email && <div className="small text-muted">{patient.email}</div>}
                          {patient.telephone && <div className="small text-muted">{patient.telephone}</div>}
                        </td>
                        <td>
                          <strong>Dr. {medecin.prenom} {medecin.nom}</strong>
                          {medecin.specialite && <div className="small text-muted">{medecin.specialite}</div>}
                        </td>
                        <td>
                          <div>{formatDate(request.date)}</div>
                          <strong className="text-primary">{request.heure}</strong>
                        </td>
                        <td>{request.motif || 'Non spécifié'}</td>
                        <td>
                          {request.urgent ? (
                            <span className="badge bg-warning text-dark">Urgent</span>
                          ) : (
                            <span className="badge bg-light text-dark">Non</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(request.statut)}`}>
                            {request.statut.charAt(0).toUpperCase() + request.statut.slice(1)}
                          </span>
                        </td>
                        <td>
                          {request.statut === 'en attente' ? (
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-success me-1" 
                                onClick={() => handleRendezVousRequest(request.id, 'confirmé')}
                              >
                                <i className="bi bi-check-lg"></i> Confirmer
                              </button>
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleRendezVousRequest(request.id, 'annulé')}
                              >
                                <i className="bi bi-x-lg"></i> Annuler
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group">
                              <div className="dropdown">
                                <button 
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                  type="button" 
                                  data-bs-toggle="dropdown" 
                                  aria-expanded="false"
                                >
                                  Changer statut
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleRendezVousRequest(request.id, 'confirmé')}
                                    >
                                      Confirmé
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleRendezVousRequest(request.id, 'en cours')}
                                    >
                                      En cours
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleRendezVousRequest(request.id, 'terminé')}
                                    >
                                      Terminé
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleRendezVousRequest(request.id, 'annulé')}
                                    >
                                      Annulé
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleRendezVousRequest(request.id, 'absent')}
                                    >
                                      Patient absent
                                    </button>
                                  </li>
                                </ul>
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-danger ms-1" 
                                onClick={() => deleteRendezVousRequest(request.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucune demande de rendez-vous trouvée avec les critères sélectionnés.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AffiliationRequestsManager;
