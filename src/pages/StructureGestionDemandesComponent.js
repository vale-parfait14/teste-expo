import React, { useState, useEffect } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useLocation } from 'react-router-dom';

const StructureGestionDemandesComponent = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // États généraux
  const [activeTab, setActiveTab] = useState('affiliations');
  const [activeSection, setActiveSection] = useState('liste'); // 'liste', 'nouveauPatient', 'nouveauRdv'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('en attente');
  
  // États pour les données de la structure
  const [structure, setStructure] = useState(null);
  
  // États pour les demandes
  const [demandesAffiliation, setDemandesAffiliation] = useState([]);
  const [demandesRdv, setDemandesRdv] = useState([]);
  const [patientsAffilies, setPatientsAffilies] = useState([]);
  const [medecins, setMedecins] = useState([]);
  
  // État pour les détails du patient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  
  // État pour le formulaire de nouveau patient
  const [patientFormData, setPatientFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    adresse: '',
    sexe: '',
    numeroAssurance: '',
    assurances: [],
    antecedentsMedicaux: ''
  });
  
  // État pour le formulaire de nouveau rendez-vous
  const [rdvFormData, setRdvFormData] = useState({
    patientId: location.state?.patientId || '',
    patientNom: location.state?.patientNom || '',
    medecinId: '',
    date: '',
    heure: '',
    duree: 30,
    motif: '',
    notes: '',
    urgent: false
  });
  
  // Charger les données de la structure au chargement de la page
  useEffect(() => {
    const fetchStructureData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }
      
      try {
        const structureDoc = await getDoc(doc(db, 'structures', auth.currentUser.uid));
        if (structureDoc.exists()) {
          const structureData = structureDoc.data();
          setStructure(structureData);
          
          // Charger les demandes d'affiliation
          fetchDemandesAffiliation();
          
          // Charger les demandes de rendez-vous
          fetchDemandesRdv();
          
          // Charger les patients affiliés
          fetchPatientsAffilies();
          
          // Charger les médecins de la structure
          fetchMedecins();
        } else {
          setError("Données de la structure non trouvées");
          navigate('/');
        }
      } catch (err) {
        setError("Erreur lors du chargement des données: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStructureData();
    
    // Si un patient est présélectionné pour un rendez-vous
    if (location.state?.patientId) {
      setActiveTab('rendezvous');
      setActiveSection('nouveauRdv');
      setRdvFormData({
        ...rdvFormData,
        patientId: location.state.patientId,
        patientNom: location.state.patientNom
      });
    }
  }, [auth.currentUser, navigate, location.state]);
  
  // Charger les demandes d'affiliation
  const fetchDemandesAffiliation = async () => {
    try {
      const affiliationsQuery = query(
        collection(db, 'affiliations'), 
        where('structureId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(affiliationsQuery, async (snapshot) => {
        const affiliationsList = [];
        
        for (const doc of snapshot.docs) {
          const affiliation = {
            id: doc.id,
            ...doc.data()
          };
          
          // Récupérer les informations du patient
          if (affiliation.patientId) {
            try {
              const patientDoc = await getDoc(doc(db, 'patients', affiliation.patientId));
              if (patientDoc.exists()) {
                affiliation.patient = patientDoc.data();
              }
            } catch (err) {
              console.error("Erreur lors de la récupération du patient:", err);
            }
          }
          
          affiliationsList.push(affiliation);
        }
        
        setDemandesAffiliation(affiliationsList);
      });
      
      return unsubscribe;
    } catch (err) {
      setError("Erreur lors du chargement des demandes d'affiliation: " + err.message);
    }
  };
  
  // Charger les demandes de rendez-vous
  const fetchDemandesRdv = async () => {
    try {
      const rdvQuery = query(
        collection(db, 'rendezvous'), 
        where('structureId', '==', auth.currentUser.uid),
        where('statut', '==', 'en attente')
      );
      
      const unsubscribe = onSnapshot(rdvQuery, async (snapshot) => {
        const rdvList = [];
        
        for (const doc of snapshot.docs) {
          const rdv = {
            id: doc.id,
            ...doc.data()
          };
          
          // Récupérer les informations du patient
          if (rdv.patientId) {
            try {
              const patientDoc = await getDoc(doc(db, 'patients', rdv.patientId));
              if (patientDoc.exists()) {
                rdv.patient = patientDoc.data();
              }
            } catch (err) {
              console.error("Erreur lors de la récupération du patient:", err);
            }
          }
          
          // Récupérer les informations du médecin
          if (rdv.medecinId) {
            try {
              const medecinDoc = await getDoc(doc(db, 'medecins', rdv.medecinId));
              if (medecinDoc.exists()) {
                const medecinData = medecinDoc.data();
                rdv.medecinNom = `Dr. ${medecinData.prenom} ${medecinData.nom}`;
                rdv.medecin = medecinData;
              }
            } catch (err) {
              console.error("Erreur lors de la récupération du médecin:", err);
            }
          }
          
          rdvList.push(rdv);
        }
        
        setDemandesRdv(rdvList);
      });
      
      return unsubscribe;
    } catch (err) {
      setError("Erreur lors du chargement des demandes de rendez-vous: " + err.message);
    }
  };
  
  // Charger les patients affiliés
  const fetchPatientsAffilies = async () => {
    try {
      const affiliationsQuery = query(
        collection(db, 'affiliations'), 
        where('structureId', '==', auth.currentUser.uid),
        where('statut', '==', 'acceptée')
      );
      
      const affiliationsSnapshot = await getDocs(affiliationsQuery);
      const patientIds = affiliationsSnapshot.docs.map(doc => doc.data().patientId);
      
      const patientsList = [];
      
      for (const patientId of patientIds) {
        try {
          const patientDoc = await getDoc(doc(db, 'patients', patientId));
          if (patientDoc.exists()) {
            patientsList.push({
              id: patientId,
              ...patientDoc.data(),
              affiliationId: affiliationsSnapshot.docs.find(doc => doc.data().patientId === patientId).id
            });
          }
        } catch (err) {
          console.error("Erreur lors de la récupération du patient:", err);
        }
      }
      
      setPatientsAffilies(patientsList);
    } catch (err) {
      setError("Erreur lors du chargement des patients affiliés: " + err.message);
    }
  };
  
  // Charger les médecins de la structure
  const fetchMedecins = async () => {
    try {
      const medecinsQuery = query(
        collection(db, 'medecins'), 
        where('structureId', '==', auth.currentUser.uid)
      );
      
      const medecinsSnapshot = await getDocs(medecinsQuery);
      const medecinsList = medecinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMedecins(medecinsList);
    } catch (err) {
      setError("Erreur lors du chargement des médecins: " + err.message);
    }
  };
  
  // Accepter une demande d'affiliation
  const handleAcceptAffiliation = async (affiliationId) => {
    try {
      await updateDoc(doc(db, 'affiliations', affiliationId), {
        statut: 'acceptée',
        dateAcceptation: Timestamp.now()
      });
      
      setMessage("Demande d'affiliation acceptée avec succès");
      fetchPatientsAffilies(); // Rafraîchir la liste des patients affiliés
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors de l'acceptation de la demande: " + err.message);
    }
  };
  
  // Refuser une demande d'affiliation
  const handleRejectAffiliation = async (affiliationId) => {
    try {
      await updateDoc(doc(db, 'affiliations', affiliationId), {
        statut: 'refusée',
        dateRefus: Timestamp.now()
      });
      
      setMessage("Demande d'affiliation refusée");
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors du refus de la demande: " + err.message);
    }
  };
  
  // Désaffilier un patient
  const handleDesaffiliation = async (affiliationId, patientId, patientNom) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désaffilier ${patientNom} ?`)) {
      try {
        await updateDoc(doc(db, 'affiliations', affiliationId), {
          statut: 'terminée',
          dateTerminaison: Timestamp.now()
        });
        
        setMessage(`Le patient ${patientNom} a été désaffilié avec succès`);
        fetchPatientsAffilies(); // Rafraîchir la liste des patients affiliés
        
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } catch (err) {
        setError("Erreur lors de la désaffiliation: " + err.message);
      }
    }
  };
  
  // Accepter une demande de rendez-vous
  const handleAcceptRdv = async (rdvId, medecinId) => {
    try {
      await updateDoc(doc(db, 'rendezvous', rdvId), {
        statut: 'confirmé',
        medecinId: medecinId,
        dateConfirmation: Timestamp.now()
      });
      
      // Vérifier si le patient est déjà affilié
      const rdv = demandesRdv.find(r => r.id === rdvId);
      if (rdv) {
        const affiliations = await getDocs(
          query(
            collection(db, 'affiliations'),
            where('patientId', '==', rdv.patientId),
            where('structureId', '==', auth.currentUser.uid),
            where('statut', '==', 'acceptée')
          )
        );
        
        // Si le patient n'est pas affilié, créer une affiliation automatique
        if (affiliations.empty) {
          const affiliationsEnAttente = await getDocs(
            query(
              collection(db, 'affiliations'),
              where('patientId', '==', rdv.patientId),
              where('structureId', '==', auth.currentUser.uid),
              where('statut', '==', 'en attente')
            )
          );
          
          if (!affiliationsEnAttente.empty) {
            // Accepter la demande d'affiliation en attente
            await updateDoc(doc(db, 'affiliations', affiliationsEnAttente.docs[0].id), {
              statut: 'acceptée',
              dateAcceptation: Timestamp.now()
            });
          } else {
            // Créer une nouvelle affiliation
            await addDoc(collection(db, 'affiliations'), {
              patientId: rdv.patientId,
              patientNom: rdv.patientNom,
              structureId: auth.currentUser.uid,
              structureNom: structure.nom,
              statut: 'acceptée',
              createdAt: Timestamp.now(),
              dateAcceptation: Timestamp.now()
            });
          }
          
          fetchPatientsAffilies(); // Rafraîchir la liste des patients affiliés
        }
      }
      if (props.onRdvAccepted) {
        props.onRdvAccepted();
      }
      setMessage("Rendez-vous confirmé avec succès");
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors de la confirmation du rendez-vous: " + err.message);
    }
  };
  
  // Refuser une demande de rendez-vous
  const handleRejectRdv = async (rdvId) => {
    try {
      await updateDoc(doc(db, 'rendezvous', rdvId), {
        statut: 'annulé',
        dateAnnulation: Timestamp.now()
      });
      
      setMessage("Rendez-vous annulé");
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors de l'annulation du rendez-vous: " + err.message);
    }
  };
  
  // Afficher les détails d'un patient
  const handleViewPatientDetails = async (patientId) => {
    try {
      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      if (patientDoc.exists()) {
        setSelectedPatient({
          id: patientId,
          ...patientDoc.data()
        });
        setShowPatientDetails(true);
      } else {
        setError("Patient non trouvé");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des détails du patient: " + err.message);
    }
  };
  
  // Gérer les changements dans le formulaire de nouveau patient
  const handlePatientFormChange = (e) => {
    const { name, value } = e.target;
    setPatientFormData({
      ...patientFormData,
      [name]: value
    });
  };
  
  // Ajouter/retirer une assurance
  const handleAssuranceChange = (assurance) => {
    const currentAssurances = [...patientFormData.assurances];
    if (currentAssurances.includes(assurance)) {
      setPatientFormData({
        ...patientFormData,
        assurances: currentAssurances.filter(a => a !== assurance)
      });
    } else {
      setPatientFormData({
        ...patientFormData,
        assurances: [...currentAssurances, assurance]
      });
    }
  };
  
  // Créer un nouveau patient
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Vérifier si l'email est déjà utilisé
      const emailCheck = await getDocs(
        query(collection(db, 'patients'), where('email', '==', patientFormData.email))
      );
      
      if (!emailCheck.empty) {
        setError("Un patient avec cet email existe déjà");
        setLoading(false);
        return;
      }
      
      // Générer un mot de passe aléatoire
      const password = Math.random().toString(36).slice(-8);
      
      // Créer un nouvel utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(getAuth(), patientFormData.email, password);
      const patientId = userCredential.user.uid;
      
      // Créer le document du patient dans Firestore
      await setDoc(doc(db, 'patients', patientId), {
        ...patientFormData,
        createdBy: auth.currentUser.uid,
        createdAt: Timestamp.now()
      });
      
      // Créer l'affiliation automatique
      await addDoc(collection(db, 'affiliations'), {
        patientId: patientId,
        patientNom: `${patientFormData.prenom} ${patientFormData.nom}`,
        structureId: auth.currentUser.uid,
        structureNom: structure.nom,
        statut: 'acceptée',
        createdAt: Timestamp.now(),
        dateAcceptation: Timestamp.now()
      });
      
      // Envoyer un email au patient avec ses identifiants
      // Cette fonctionnalité nécessite une configuration supplémentaire avec Firebase Functions
      // ou un service d'envoi d'emails tiers
      
      setMessage(`Patient créé avec succès. Mot de passe temporaire: ${password}`);
      
      // Réinitialiser le formulaire
      setPatientFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        dateNaissance: '',
        adresse: '',
        sexe: '',
        numeroAssurance: '',
        assurances: [],
        antecedentsMedicaux: ''
      });
      
      setTimeout(() => {
        setActiveSection('liste');
        fetchPatientsAffilies();
      }, 3000);
    } catch (err) {
      setError("Erreur lors de la création du patient: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer les changements dans le formulaire de rendez-vous
  const handleRdvFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRdvFormData({
      ...rdvFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Gérer la sélection d'un patient pour un rendez-vous
  const handlePatientSelect = (e) => {
    const patientId = e.target.value;
    const patient = patientsAffilies.find(p => p.id === patientId);
    
    setRdvFormData({
      ...rdvFormData,
      patientId: patientId,
      patientNom: patient ? `${patient.prenom} ${patient.nom}` : ''
    });
  };
  
  // Créer un nouveau rendez-vous
  const handleRdvSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!rdvFormData.patientId || !rdvFormData.medecinId || !rdvFormData.date || !rdvFormData.heure) {
        setError("Veuillez remplir tous les champs obligatoires");
        setLoading(false);
        return;
      }
      
      // Récupérer les informations du médecin
      const medecinDoc = await getDoc(doc(db, 'medecins', rdvFormData.medecinId));
      let medecinNom = '';
      
      if (medecinDoc.exists()) {
        const medecinData = medecinDoc.data();
        medecinNom = `Dr. ${medecinData.prenom} ${medecinData.nom}`;
      }
      
      // Créer le rendez-vous
      const rdvData = {
        patientId: rdvFormData.patientId,
        patientNom: rdvFormData.patientNom,
        structureId: auth.currentUser.uid,
        structureNom: structure.nom,
        medecinId: rdvFormData.medecinId,
        medecinNom: medecinNom,
        date: rdvFormData.date,
        heure: rdvFormData.heure,
        duree: parseInt(rdvFormData.duree),
        motif: rdvFormData.motif,
        notes: rdvFormData.notes,
        urgent: rdvFormData.urgent,
        statut: 'confirmé',
        createdAt: Timestamp.now(),
        dateConfirmation: Timestamp.now()
      };
      
      await addDoc(collection(db, 'rendezvous'), rdvData);
      
      setMessage("Rendez-vous créé avec succès");
      
      // Réinitialiser le formulaire
      setRdvFormData({
        patientId: '',
        patientNom: '',
        medecinId: '',
        date: '',
        heure: '',
        duree: 30,
        motif: '',
        notes: '',
        urgent: false
      });
      
      setTimeout(() => {
        setActiveSection('liste');
      }, 2000);
    } catch (err) {
      setError("Erreur lors de la création du rendez-vous: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrer les demandes d'affiliation
  const filteredAffiliations = demandesAffiliation.filter(affiliation => {
    const matchesStatus = filterStatus === 'tous' || affiliation.statut === filterStatus;
    const matchesSearch = searchTerm === '' || 
      (affiliation.patientNom && affiliation.patientNom.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });
  
  // Filtrer les patients affiliés
  const filteredPatients = patientsAffilies.filter(patient => {
    return searchTerm === '' || 
      (patient.nom && patient.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.prenom && patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const assurancesList = ['CNAMGS', 'MAAB', 'Ascoma', 'Allianz', 'Autre'];
  const sexeOptions = ['Homme', 'Femme', 'Autre'];
  
  if (loading && !structure) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col">
          <h2>Gestion des demandes - {structure?.nom}</h2>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'affiliations' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('affiliations');
              setActiveSection('liste');
            }}
          >
            Demandes d'affiliation
            {demandesAffiliation.filter(a => a.statut === 'en attente').length > 0 && (
              <span className="badge bg-danger ms-2">
                {demandesAffiliation.filter(a => a.statut === 'en attente').length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'rendezvous' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('rendezvous');
              setActiveSection('liste');
            }}
          >
            Demandes de rendez-vous
            {demandesRdv.length > 0 && (
              <span className="badge bg-danger ms-2">{demandesRdv.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('patients');
              setActiveSection('liste');
            }}
          >
            Patients affiliés
            <span className="badge bg-info ms-2">{patientsAffilies.length}</span>
          </button>
        </li>
      </ul>
      
      {/* Modal pour afficher les détails du patient */}
      {showPatientDetails && selectedPatient && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Détails du patient - {selectedPatient.prenom} {selectedPatient.nom}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPatientDetails(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Nom:</strong> {selectedPatient.nom}</p>
                    <p><strong>Prénom:</strong> {selectedPatient.prenom}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                    <p><strong>Téléphone:</strong> {selectedPatient.telephone || 'Non renseigné'}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Date de naissance:</strong> {selectedPatient.dateNaissance ? formatDate(selectedPatient.dateNaissance) : 'Non renseignée'}</p>
                    <p><strong>Sexe:</strong> {selectedPatient.sexe || 'Non renseigné'}</p>
                    <p><strong>Adresse:</strong> {selectedPatient.adresse || 'Non renseignée'}</p>
                    <p><strong>Numéro d'assurance:</strong> {selectedPatient.numeroAssurance || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h6>Assurances:</h6>
                  {selectedPatient.assurances && selectedPatient.assurances.length > 0 ? (
                    <div>
                      {selectedPatient.assurances.map((assurance, index) => (
                        <span key={index} className="badge bg-info me-1 mb-1">{assurance}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">Aucune assurance renseignée</p>
                  )}
                </div>
                
                <div className="mt-3">
                  <h6>Antécédents médicaux:</h6>
                  {selectedPatient.antecedentsMedicaux ? (
                    <p>{selectedPatient.antecedentsMedicaux}</p>
                  ) : (
                    <p className="text-muted">Aucun antécédent médical renseigné</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPatientDetails(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Onglet Demandes d'affiliation */}
      {activeTab === 'affiliations' && activeSection === 'liste' && (
        <div className="card">
                    <div className="card-header">
            <div className="row align-items-center">
              <div className="col-md-4">
                <h5 className="mb-0">Demandes d'affiliation</h5>
              </div>
              <div className="col-md-4">
                <select 
                  className="form-select" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="en attente">En attente</option>
                  <option value="acceptée">Acceptées</option>
                  <option value="refusée">Refusées</option>
                  <option value="tous">Toutes les demandes</option>
                </select>
              </div>
              <div className="col-md-4">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Rechercher un patient..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            {filteredAffiliations.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date de demande</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliations.map(affiliation => (
                      <tr key={affiliation.id}>
                        <td>
                          <button 
                            className="btn btn-link p-0" 
                            onClick={() => handleViewPatientDetails(affiliation.patientId)}
                          >
                            {affiliation.patientNom}
                          </button>
                        </td>
                        <td>{formatDate(affiliation.createdAt)}</td>
                        <td>
                          <span className={`badge ${
                            affiliation.statut === 'acceptée' ? 'bg-success' : 
                            affiliation.statut === 'refusée' ? 'bg-danger' : 
                            'bg-warning'
                          }`}>
                            {affiliation.statut}
                          </span>
                        </td>
                        <td>
                          {affiliation.statut === 'en attente' && (
                            <>
                              <button 
                                className="btn btn-sm btn-success me-2" 
                                onClick={() => handleAcceptAffiliation(affiliation.id)}
                              >
                                Accepter
                              </button>
                              <button 
                                className="btn btn-sm btn-danger" 
                                onClick={() => handleRejectAffiliation(affiliation.id)}
                              >
                                Refuser
                              </button>
                            </>
                          )}
                          {affiliation.statut === 'acceptée' && (
                            <span className="text-muted">
                              Acceptée le {formatDate(affiliation.dateAcceptation)}
                            </span>
                          )}
                          {affiliation.statut === 'refusée' && (
                            <span className="text-muted">
                              Refusée le {formatDate(affiliation.dateRefus)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted">
                {filterStatus === 'tous' 
                  ? "Aucune demande d'affiliation trouvée" 
                  : `Aucune demande d'affiliation ${filterStatus} trouvée`}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Onglet Demandes de rendez-vous */}
      {activeTab === 'rendezvous' && activeSection === 'liste' && (
        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="mb-0">Demandes de rendez-vous en attente</h5>
              </div>
              <div className="col-md-4 text-end">
                <button 
                  className="btn btn-primary" 
                  onClick={() => setActiveSection('nouveauRdv')}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nouveau rendez-vous
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {demandesRdv.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date souhaitée</th>
                      <th>Heure</th>
                      <th>Médecin</th>
                      <th>Motif</th>
                      <th>Urgent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandesRdv.map(rdv => (
                      <tr key={rdv.id} className={rdv.urgent ? 'table-danger' : ''}>
                        <td>
                          <button 
                            className="btn btn-link p-0" 
                            onClick={() => handleViewPatientDetails(rdv.patientId)}
                          >
                            {rdv.patientNom}
                          </button>
                          {!patientsAffilies.some(p => p.id === rdv.patientId) && (
                            <span className="badge bg-warning ms-1" title="Patient non affilié">
                              Nouveau
                            </span>
                          )}
                        </td>
                        <td>{formatDate(rdv.date).split(' à ')[0]}</td>
                        <td>{rdv.heure}</td>
                        <td>
                          {rdv.medecinNom || (
                            <select 
                              className="form-select form-select-sm" 
                              onChange={(e) => {
                                const updatedRdv = {...rdv, medecinId: e.target.value};
                                setDemandesRdv(demandesRdv.map(r => r.id === rdv.id ? updatedRdv : r));
                              }}
                              value={rdv.medecinId || ''}
                            >
                              <option value="">Sélectionner un médecin</option>
                              {medecins.map(medecin => (
                                <option key={medecin.id} value={medecin.id}>
                                  Dr. {medecin.prenom} {medecin.nom}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>{rdv.motif || '-'}</td>
                        <td>
                          {rdv.urgent ? (
                            <span className="badge bg-danger">Urgent</span>
                          ) : (
                            <span className="badge bg-secondary">Non</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-success me-2" 
                            onClick={() => handleAcceptRdv(rdv.id, rdv.medecinId)}
                            disabled={!rdv.medecinId}
                          >
                            Confirmer
                          </button>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => handleRejectRdv(rdv.id)}
                          >
                            Refuser
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted">Aucune demande de rendez-vous en attente</p>
            )}
          </div>
        </div>
      )}
      
      {/* Formulaire de nouveau rendez-vous */}
      {activeTab === 'rendezvous' && activeSection === 'nouveauRdv' && (
        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col">
                <h5 className="mb-0">Planifier un rendez-vous</h5>
              </div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleRdvSubmit}>
              <div className="mb-3">
                <label className="form-label">Patient <span className="text-danger">*</span></label>
                {rdvFormData.patientId && rdvFormData.patientNom ? (
                  <input 
                    type="text" 
                    className="form-control" 
                    value={rdvFormData.patientNom} 
                    disabled
                  />
                ) : (
                  <select 
                    className="form-select" 
                    name="patientId" 
                    value={rdvFormData.patientId} 
                    onChange={handlePatientSelect}
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patientsAffilies.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Médecin <span className="text-danger">*</span></label>
                <select 
                  className="form-select" 
                  name="medecinId" 
                  value={rdvFormData.medecinId} 
                  onChange={handleRdvFormChange}
                  required
                >
                  <option value="">Sélectionner un médecin</option>
                  {medecins.map(medecin => (
                    <option key={medecin.id} value={medecin.id}>
                      Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite || 'Généraliste'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Date <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="date" 
                    value={rdvFormData.date} 
                    onChange={handleRdvFormChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Heure <span className="text-danger">*</span></label>
                  <input 
                    type="time" 
                    className="form-control" 
                    name="heure" 
                    value={rdvFormData.heure} 
                    onChange={handleRdvFormChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Durée (minutes)</label>
                  <select 
                    className="form-select" 
                    name="duree" 
                    value={rdvFormData.duree} 
                    onChange={handleRdvFormChange}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 heure</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Motif de consultation</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="motif" 
                  value={rdvFormData.motif} 
                  onChange={handleRdvFormChange}
                  placeholder="Ex: Consultation de routine, Suivi, etc."
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Notes (visibles uniquement par le personnel médical)</label>
                <textarea 
                  className="form-control" 
                  name="notes" 
                  rows="3" 
                  value={rdvFormData.notes} 
                  onChange={handleRdvFormChange}
                  placeholder="Informations supplémentaires pour le médecin"
                ></textarea>
              </div>
              
              <div className="mb-3 form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="urgentCheck" 
                  name="urgent" 
                  checked={rdvFormData.urgent} 
                  onChange={handleRdvFormChange}
                />
                <label className="form-check-label" htmlFor="urgentCheck">Consultation urgente</label>
              </div>
              
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-secondary me-2" 
                  onClick={() => setActiveSection('liste')}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Création en cours...
                    </>
                  ) : (
                    'Planifier le rendez-vous'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Onglet Patients affiliés */}
      {activeTab === 'patients' && activeSection === 'liste' && (
        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col-md-4">
                <h5 className="mb-0">Patients affiliés</h5>
              </div>
              <div className="col-md-4">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Rechercher un patient..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4 text-end">
                <button 
                  className="btn btn-primary" 
                  onClick={() => setActiveSection('nouveauPatient')}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Ajouter un patient
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {filteredPatients.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Date d'affiliation</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map(patient => (
                      <tr key={patient.id}>
                        <td>
                          <button 
                            className="btn btn-link p-0" 
                            onClick={() => handleViewPatientDetails(patient.id)}
                          >
                            {patient.prenom} {patient.nom}
                          </button>
                          {patient.createdBy === auth.currentUser.uid && (
                            <span className="badge bg-primary ms-1" title="Patient créé par cette structure">
                              Créé ici
                            </span>
                          )}
                        </td>
                        <td>{patient.email}</td>
                        <td>{patient.telephone || '-'}</td>
                        <td>
                          {demandesAffiliation.find(a => 
                            a.patientId === patient.id && 
                            a.statut === 'acceptée'
                          )?.dateAcceptation ? 
                            formatDate(demandesAffiliation.find(a => 
                              a.patientId === patient.id && 
                              a.statut === 'acceptée'
                            ).dateAcceptation) : '-'}
                        </td>
                        <td>
                          <div className="btn-group">
                            <button 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => {
                                // Rediriger vers le dossier médical du patient
                                navigate(`/structure/patient/${patient.id}`);
                              }}
                            >
                              Dossier médical
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-success me-2"
                              onClick={() => {
                                setActiveTab('rendezvous');
                                setActiveSection('nouveauRdv');
                                setRdvFormData({
                                  ...rdvFormData,
                                  patientId: patient.id,
                                  patientNom: `${patient.prenom} ${patient.nom}`
                                });
                              }}
                            >
                              Planifier RDV
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDesaffiliation(
                                patient.affiliationId, 
                                patient.id, 
                                `${patient.prenom} ${patient.nom}`
                              )}
                            >
                              Désaffilier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted">Aucun patient affilié trouvé</p>
            )}
          </div>
        </div>
      )}
      
      {/* Formulaire de nouveau patient */}
      {activeTab === 'patients' && activeSection === 'nouveauPatient' && (
        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col">
                <h5 className="mb-0">Ajouter un nouveau patient</h5>
              </div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handlePatientSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nom <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="nom" 
                    value={patientFormData.nom} 
                    onChange={handlePatientFormChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Prénom <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="prenom" 
                    value={patientFormData.prenom} 
                    onChange={handlePatientFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Email <span className="text-danger">*</span></label>
                  <input 
                    type="email" 
                    className="form-control" 
                    name="email" 
                    value={patientFormData.email} 
                    onChange={handlePatientFormChange}
                    required
                  />
                  <small className="text-muted">
                    Le patient recevra ses identifiants à cette adresse email
                  </small>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Téléphone</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="telephone" 
                    value={patientFormData.telephone} 
                    onChange={handlePatientFormChange}
                  />
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Date de naissance</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="dateNaissance" 
                    value={patientFormData.dateNaissance} 
                    onChange={handlePatientFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Sexe</label>
                  <select 
                    className="form-select" 
                    name="sexe" 
                    value={patientFormData.sexe} 
                    onChange={handlePatientFormChange}
                  >
                    <option value="">Sélectionner</option>
                    {sexeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Adresse</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="adresse" 
                  value={patientFormData.adresse} 
                  onChange={handlePatientFormChange}
                />
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Numéro d'assurance</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="numeroAssurance" 
                    value={patientFormData.numeroAssurance} 
                    onChange={handlePatientFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Assurances</label>
                  <div>
                    {assurancesList.map(assurance => (
                      <div className="form-check form-check-inline" key={assurance}>
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id={`assurance-${assurance}`} 
                          value={assurance} 
                          checked={patientFormData.assurances.includes(assurance)}
                          onChange={() => handleAssuranceChange(assurance)}
                        />
                        <label className="form-check-label" htmlFor={`assurance-${assurance}`}>
                          {assurance}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Antécédents médicaux</label>
                <textarea 
                  className="form-control" 
                  name="antecedentsMedicaux" 
                  rows="3" 
                  value={patientFormData.antecedentsMedicaux} 
                  onChange={handlePatientFormChange}
                  placeholder="Allergies, maladies chroniques, etc."
                ></textarea>
              </div>
              
              <div className="d-flex justify-content-end">
                <button 
                  type="button" 
                  className="btn btn-secondary me-2" 
                  onClick={() => setActiveSection('liste')}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Création en cours...
                    </>
                  ) : (
                    'Créer le patient'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructureGestionDemandesComponent;

          
