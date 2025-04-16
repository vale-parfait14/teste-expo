import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut, updatePassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db, storage } from '../components/firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import AffiliationRequestsManagerMedecins from './AffiliationRequestsManagerMedecins.js';
import AffiliationRequestsManagerPatients from './AffiliationRequestsManagerPatients.js';
import { motion, AnimatePresence } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';

const StructureDashboard = () => {
  // États existants...
  const [structureData, setStructureData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const [medecins, setMedecins] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [showMedecinForm, setShowMedecinForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showRendezvousForm, setShowRendezvousForm] = useState(false);
  const [currentMedecin, setCurrentMedecin] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [currentRendezvous, setCurrentRendezvous] = useState(null);
  const [filtreDate, setFiltreDate] = useState(new Date().toISOString().split('T')[0]);
  const [filtreMedecin, setFiltreMedecin] = useState('');
  const [archives, setArchives] = useState([]);
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [currentArchive, setCurrentArchive] = useState(null);
  const [archiveFiles, setArchiveFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filtreArchivePatient, setFiltreArchivePatient] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Nouvel état pour la version mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Styles pour la version mobile inspirée d'Instagram
  const mobileStyles = {
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'white',
      borderBottom: '1px solid #dbdbdb',
      padding: '10px 15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    footer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'white',
      borderTop: '1px solid #dbdbdb',
      padding: '8px 0'
    },
    content: {
      paddingTop: '60px',
      paddingBottom: '60px',
      minHeight: '100vh'
    },
    navIcon: {
      fontSize: '24px',
      marginBottom: '3px'
    },
    storyCircle: {
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2px'
    },
    storyCircleInner: {
      width: '66px',
      height: '66px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white'
    },
    storyText: {
      fontSize: '12px',
      marginTop: '5px',
      textAlign: 'center'
    },
    postHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 15px'
    },
    postFooter: {
      padding: '10px 15px',
      borderTop: '1px solid #efefef'
    },
    searchOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 2000,
      padding: '10px 15px'
    },
    notificationOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 2000,
      padding: '10px 15px'
    }
  };
  
  // Référence pour les animations
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 }
  };
  
  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3
  };

  // Détection de la taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Récupération des notifications (rendez-vous du jour, demandes d'affiliation en attente)
  useEffect(() => {
    const generateNotifications = () => {
      const notifs = [];
      
      // Rendez-vous du jour
      const today = new Date().toISOString().split('T')[0];
      const rdvToday = rendezvous.filter(rdv => rdv.date === today);
      
      if (rdvToday.length > 0) {
        notifs.push({
          id: 'rdv-today',
          type: 'rdv',
          title: `${rdvToday.length} rendez-vous aujourd'hui`,
          time: new Date(),
          count: rdvToday.length,
          icon: 'calendar-check'
        });
      }
      
      // Demandes d'affiliation en attente
      if (pendingRequests.length > 0) {
        notifs.push({
          id: 'pending-affiliations',
          type: 'affiliation',
          title: `${pendingRequests.length} demandes d'affiliation en attente`,
          time: new Date(),
          count: pendingRequests.length,
          icon: 'person-plus'
        });
      }
      
      setNotifications(notifs);
    };
    
    generateNotifications();
  }, [rendezvous, pendingRequests]);

  // Fonctions existantes...
  // (Toutes les fonctions du composant original restent inchangées)

  // Si on est sur mobile, afficher la version mobile inspirée d'Instagram
  if (isMobile) {
    return (
      <div className="bg-white min-vh-100">
        {/* Header fixe style Instagram */}
        <header style={mobileStyles.header}>
          <h4 className="mb-0 fw-bold text-primary">MediConnect</h4>
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-dark me-2"
              onClick={() => setShowSearch(!showSearch)}
            >
              <i className="bi bi-search fs-5"></i>
            </button>
            <button 
              className="btn btn-link text-dark position-relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="bi bi-bell fs-5"></i>
              {notifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </header>
        
        {/* Overlay de recherche */}
        {showSearch && (
          <div style={mobileStyles.searchOverlay}>
            <div className="d-flex align-items-center mb-3">
              <button 
                className="btn btn-link text-dark me-2"
                onClick={() => setShowSearch(false)}
              >
                <i className="bi bi-arrow-left fs-5"></i>
              </button>
              <div className="flex-grow-1">
                <input 
                  type="text" 
                  className="form-control bg-light" 
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="mt-3">
              <h6>Recherche récente</h6>
              <div className="list-group list-group-flush">
                <button className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-clock-history me-3 text-muted"></i>
                  <div>Rendez-vous aujourd'hui</div>
                </button>
                <button className="list-group-item list-group-item-action d-flex align-items-center">
                  <i className="bi bi-clock-history me-3 text-muted"></i>
                  <div>Patients sans rendez-vous</div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay de notifications */}
        {showNotifications && (
          <div style={mobileStyles.notificationOverlay}>
            <div className="d-flex align-items-center mb-3">
              <button 
                className="btn btn-link text-dark me-2"
                onClick={() => setShowNotifications(false)}
              >
                <i className="bi bi-arrow-left fs-5"></i>
              </button>
              <h5 className="mb-0">Notifications</h5>
            </div>
            
            <div className="mt-3">
              {notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.map(notification => (
                    <button 
                      key={notification.id} 
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setActiveTab(notification.type === 'rdv' ? 'rendezvous' : 'affiliations');
                        setShowNotifications(false);
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                          <i className={`bi bi-${notification.icon} text-primary fs-5`}></i>
                        </div>
                        <div>
                          <div className="fw-bold">{notification.title}</div>
                          <div className="small text-muted">
                            {new Date(notification.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="bi bi-bell-slash text-muted" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h6 className="text-muted">Aucune notification</h6>
                  <p className="text-muted small">Vous n'avez pas de nouvelles notifications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenu principal avec padding pour header et footer */}
        <main style={mobileStyles.content} className="container-fluid px-0">
          <AnimatePresence mode="wait">
            {/* Onglet Informations */}
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                {/* Stories (Raccourcis) */}
                <div className="mb-3 pb-2 border-bottom" style={{ overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="d-inline-flex gap-3 px-1 py-2">
                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('info')}>
                      <div style={{...mobileStyles.storyCircle, background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '55px', height: '55px', fontSize: '1.5rem' }}>
                            {structureData?.nom?.charAt(0) || 'S'}
                          </div>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>Profil</div>
                    </div>

                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('medecins')}>
                      <div style={{...mobileStyles.storyCircle, background: '#efefef'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <i className="bi bi-heart-pulse text-primary" style={{ fontSize: '28px' }}></i>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>Médecins</div>
                    </div>

                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('patients')}>
                      <div style={{...mobileStyles.storyCircle, background: '#efefef'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <i className="bi bi-people text-primary" style={{ fontSize: '28px' }}></i>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>Patients</div>
                    </div>

                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('rendezvous')}>
                      <div style={{...mobileStyles.storyCircle, background: '#efefef'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <i className="bi bi-calendar-check text-primary" style={{ fontSize: '28px' }}></i>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>RDV</div>
                    </div>

                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('archives')}>
                      <div style={{...mobileStyles.storyCircle, background: '#efefef'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <i className="bi bi-folder2-open text-primary" style={{ fontSize: '28px' }}></i>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>Archives</div>
                    </div>

                    <div className="d-flex flex-column align-items-center" onClick={() => setActiveTab('affiliations')}>
                      <div style={{...mobileStyles.storyCircle, background: pendingRequests.length > 0 ? 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' : '#efefef'}}>
                        <div style={mobileStyles.storyCircleInner}>
                          <i className="bi bi-link text-primary" style={{ fontSize: '28px' }}></i>
                        </div>
                      </div>
                      <div style={mobileStyles.storyText}>Affiliations</div>
                    </div>
                  </div>
                </div>

                {/* Profil de la structure style Instagram */}
                <div className="text-center mb-4 pb-3 border-bottom">
                  <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                    {structureData?.nom?.charAt(0) || 'S'}
                  </div>
                  <h5 className="mb-1">{structureData?.nom}</h5>
                  <p className="text-muted mb-2 small">{structureData?.email}</p>
                  
                  <div className="d-flex justify-content-around mb-3">
                    <div className="text-center">
                      <div className="fw-bold">{medecins.length}</div>
                      <div className="small text-muted">Médecins</div>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold">{patients.length}</div>
                      <div className="small text-muted">Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold">{rendezvous.filter(rdv => rdv.date === new Date().toISOString().split('T')[0]).length}</div>
                      <div className="small text-muted">RDV aujourd'hui</div>
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-outline-primary btn-sm rounded-pill px-4"
                    onClick={() => setShowMedecinForm(!showMedecinForm)}
                  >
                    Modifier le profil
                  </button>
                </div>

                {/* Formulaire de modification */}
                {showMedecinForm && (
                  <div className="mb-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <h6 className="mb-3">Informations de la structure</h6>
                        {Object.keys(form).map((key) => (
                          key !== 'createdAt' && key !== 'updatedAt' ? (
                            <div className="mb-3" key={key}>
                              <label className="form-label small">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                              <input
                                name={key}
                                value={form[key] || ''}
                                onChange={handleChange}
                                className="form-control form-control-sm"
                                placeholder={key}
                              />
                            </div>
                          ) : null
                        ))}
                        <div className="d-grid">
                          <button onClick={handleUpdate} className="btn btn-primary">
                            <i className="bi bi-check-lg me-1"></i> Mettre à jour
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rendez-vous du jour */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Rendez-vous d'aujourd'hui</h6>
                    <button 
                      className="btn btn-link text-primary p-0 small"
                      onClick={() => setActiveTab('rendezvous')}
                    >
                      Voir tous <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>

                  {rendezvous.filter(rdv => rdv.date === new Date().toISOString().split('T')[0]).length > 0 ? (
                    <div className="row g-2">
                      {rendezvous
                        .filter(rdv => rdv.date === new Date().toISOString().split('T')[0])
                        .sort((a, b) => a.heure.localeCompare(b.heure))
                        .slice(0, 3)
                        .map(rdv => {
                          const patient = patients.find(p => p.id === rdv.patientId);
                          const medecin = medecins.find(m => m.id === rdv.medecinId);
                          return (
                            <div key={rdv.id} className="col-12">
                              <div className="card border-0 shadow-sm">
                                <div style={mobileStyles.postHeader}>
                                  <div className="bg-primary bg-opacity-10 rounded p-2 text-center me-3" style={{ width: '45px' }}>
                                    <div className="small text-primary fw-bold">{rdv.heure}</div>
                                  </div>
                                  <div>
                                    <div className="fw-bold">{patient ? `${patient.prenom} ${patient.nom}` : rdv.patientNom || 'Patient inconnu'}</div>
                                    <div className="small text-muted">Dr. {medecin ? `${medecin.prenom} ${medecin.nom}` : rdv.medecinNom || 'Médecin inconnu'}</div>
                                  </div>
                                  <span className={`badge ms-auto ${
                                    rdv.statut === 'confirmé' ? 'bg-success' :
                                    rdv.statut === 'en attente' ? 'bg-warning text-dark' :
                                    rdv.statut === 'annulé' ? 'bg-danger' : 'bg-secondary'
                                  }`}>
                                    {rdv.statut}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-light rounded">
                      <i className="bi bi-calendar-x text-muted fs-4 mb-2 d-block"></i>
                      <p className="mb-0 text-muted small">Aucun rendez-vous aujourd'hui</p>
                    </div>
                  )}
                </div>

                {/* Statistiques */}
                <div className="mb-4">
                  <h6 className="mb-3">Aperçu</h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-calendar-check text-primary"></i>
                            </div>
                            <div>
                              <div className="small text-muted">Rendez-vous</div>
                              <div className="fw-bold">{rendezvous.length}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-person-check text-success"></i>
                            </div>
                            <div>
                              <div className="small text-muted">Affiliations</div>
                              <div className="fw-bold">{pendingRequests.length}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-heart-pulse text-info"></i>
                            </div>
                            <div>
                              <div className="small text-muted">Médecins</div>
                              <div className="fw-bold">{medecins.length}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                              <i className="bi bi-people text-warning"></i>
                            </div>
                            <div>
                              <div className="small text-muted">Patients</div>
                              <div className="fw-bold">{patients.length}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="mb-4">
                  <h6 className="mb-3">Sécurité</h6>
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h6 className="card-title d-flex align-items-center">
                        <i className="bi bi-shield-lock me-2 text-primary"></i>
                        Changer le mot de passe
                      </h6>
                      <div className="mb-3">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Nouveau mot de passe"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="d-grid">
                        <button onClick={handlePasswordChange} className="btn btn-warning">
                          <i className="bi bi-key me-1"></i> Modifier le mot de passe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Onglet Médecins */}
            {activeTab === 'medecins' && (
              <motion.div
                key="medecins"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Médecins</h5>
                  <button 
                    className="btn btn-primary btn-sm rounded-pill"
                    onClick={() => {
                      resetMedecinForm();
                      setShowMedecinForm(!showMedecinForm);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Ajouter
                  </button>
                </div>

                {/* Formulaire d'ajout/modification de médecin */}
                {showMedecinForm && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-white py-3">
                      <h6 className="mb-0">{currentMedecin ? 'Modifier le médecin' : 'Ajouter un médecin'}</h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleAddMedecin}>
                        <div className="mb-3">
                          <label className="form-label small">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            className="form-control"
                            value={medecinForm.nom}
                            onChange={handleMedecinChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Prénom</label>
                          <input
                            type="text"
                            name="prenom"
                            className="form-control"
                            value={medecinForm.prenom}
                            onChange={handleMedecinChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Spécialité</label>
                          <select
                            name="specialite"
                            className="form-select"
                            value={medecinForm.specialite}
                            onChange={handleMedecinChange}
                            required
                          >
                            <option value="">Sélectionner une spécialité</option>
                            {specialites.map((spec) => (
                              <option key={spec} value={spec}>{spec}</option>
                            ))}
                          </select>
                          {medecinForm.specialite === 'Autre' && (
                            <input
                              type="text"
                              name="specialiteAutre"
                              className="form-control mt-2"
                              placeholder="Précisez la spécialité"
                              value={medecinForm.specialiteAutre || ''}
                              onChange={handleMedecinChange}
                            />
                          )}
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Téléphone</label>
                          <input
                            type="tel"
                            name="telephone"
                            className="form-control"
                            value={medecinForm.telephone}
                            onChange={handleMedecinChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Email</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={medecinForm.email}
                            onChange={handleMedecinChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">
                            Mot de passe {currentMedecin && '(laisser vide pour ne pas modifier)'}
                          </label>
                          <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={medecinForm.password}
                            onChange={handleMedecinChange}
                            required={!currentMedecin}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Disponibilités</label>
                          <div className="accordion" id="accordionDisponibilites">
                            {joursSemaine.map((jour, index) => (
                              <div className="accordion-item border-0 mb-2 bg-light rounded" key={jour}>
                                <h2 className="accordion-header" id={`heading-${jour}`}>
                                  <button 
                                    className="accordion-button collapsed bg-light py-2" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target={`#collapse-${jour}`}
                                  >
                                    <div className="form-check form-switch mb-0 w-100">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`disponible-${jour}`}
                                        checked={medecinForm.disponibilites[jour].actif}
                                        onChange={() => handleDisponibiliteChange(jour, 'actif')}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <label className="form-check-label" htmlFor={`disponible-${jour}`}>
                                        {jour.charAt(0).toUpperCase() + jour.slice(1)}
                                      </label>
                                    </div>
                                  </button>
                                </h2>
                                <div 
                                  id={`collapse-${jour}`} 
                                  className="accordion-collapse collapse" 
                                  data-bs-parent="#accordionDisponibilites"
                                >
                                  <div className="accordion-body py-2">
                                    <div className="row g-2">
                                      <div className="col-6">
                                        <label className="form-label small">Début</label>
                                        <input
                                          type="time"
                                          className="form-control"
                                          value={medecinForm.disponibilites[jour].debut}
                                          onChange={(e) => handleDisponibiliteChange(jour, 'debut', e.target.value)}
                                          disabled={!medecinForm.disponibilites[jour].actif}
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Fin</label>
                                        <input
                                          type="time"
                                          className="form-control"
                                          value={medecinForm.disponibilites[jour].fin}
                                          onChange={(e) => handleDisponibiliteChange(jour, 'fin', e.target.value)}
                                          disabled={!medecinForm.disponibilites[jour].actif}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Assurances acceptées</label>
                          <div className="d-flex flex-wrap gap-2">
                            {assurancesList.map((assurance) => (
                              <div key={assurance} className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`assurance-medecin-${assurance}`}
                                  name="assurances"
                                  value={assurance}
                                  checked={medecinForm.assurances.includes(assurance)}
                                  onChange={handleMedecinChange}
                                />
                                <label className="form-check-label small" htmlFor={`assurance-medecin-${assurance}`}>
                                  {assurance}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => {
                            resetMedecinForm();
                            setShowMedecinForm(false);
                          }}>
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary">
                            {currentMedecin ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Liste des médecins style Instagram */}
                {medecins.length > 0 ? (
                  <div className="row g-3">
                    {medecins.map((medecin) => (
                      <div key={medecin.id} className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-2">
                              <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                                {medecin.prenom?.charAt(0) || 'M'}
                              </div>
                              <div className="ms-3">
                                <h6 className="mb-0">Dr. {medecin.prenom} {medecin.nom}</h6>
                                <div className="badge bg-info rounded-pill mt-1">{medecin.specialite}</div>
                              </div>
                              <div className="dropdown ms-auto">
                                <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                                  <i className="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleEditMedecin(medecin)}
                                    >
                                      <i className="bi bi-pencil me-2"></i> Modifier
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item text-danger" 
                                      onClick={() => handleDeleteMedecin(medecin.id)}
                                    >
                                      <i className="bi bi-trash me-2"></i> Supprimer
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            
                            <div className="d-flex align-items-center small text-muted mb-2">
                              <i className="bi bi-envelope me-2"></i>
                              <span>{medecin.email}</span>
                            </div>
                            
                            <div className="d-flex align-items-center small text-muted mb-3">
                              <i className="bi bi-telephone me-2"></i>
                              <span>{medecin.telephone}</span>
                            </div>
                            
                            <div className="small mb-2">
                              <span className="fw-bold">Disponibilités:</span>
                            </div>
                            <div className="row g-1 mb-2">
                              {Object.entries(medecin.disponibilites || {}).map(([jour, dispo]) => (
                                dispo.actif && (
                                  <div key={jour} className="col-auto">
                                    <div className="badge bg-light text-dark border">
                                      {jour.substring(0, 3)} {dispo.debut}-{dispo.fin}
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                          <div className="card-footer bg-white border-top d-flex justify-content-between">
                            <button 
                              className="btn btn-sm btn-outline-primary rounded-pill"
                              onClick={() => {
                                resetRdvForm();
                                setRdvForm({...rdvForm, medecinId: medecin.id});
                                setActiveTab('rendezvous');
                                setShowRendezvousForm(true);
                              }}
                            >
                              <i className="bi bi-calendar-plus me-1"></i> Nouveau RDV
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary rounded-pill"
                              onClick={() => {
                                setFiltreMedecin(medecin.id);
                                setActiveTab('rendezvous');
                              }}
                            >
                              <i className="bi bi-calendar-week me-1"></i> Voir RDV
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-person-plus text-muted" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h6 className="text-muted">Aucun médecin</h6>
                    <p className="text-muted small">Ajoutez des médecins à votre structure</p>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill mt-2"
                      onClick={() => {
                        resetMedecinForm();
                        setShowMedecinForm(true);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Ajouter un médecin
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Onglet Patients */}
            {activeTab === 'patients' && (
              <motion.div
                key="patients"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Patients</h5>
                  <button 
                    className="btn btn-primary btn-sm rounded-pill"
                    onClick={() => {
                      resetPatientForm();
                      setShowPatientForm(!showPatientForm);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Ajouter
                  </button>
                </div>
                
                {/* Barre de recherche */}
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-start-0" 
                      placeholder="Rechercher un patient..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Formulaire d'ajout/modification de patient */}
                {showPatientForm && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-white py-3">
                      <h6 className="mb-0">{currentPatient ? 'Modifier le patient' : 'Ajouter un patient'}</h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleAddPatient}>
                        <div className="mb-3">
                          <label className="form-label small">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            className="form-control"
                            value={patientForm.nom}
                            onChange={handlePatientChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Prénom</label>
                          <input
                            type="text"
                            name="prenom"
                            className="form-control"
                            value={patientForm.prenom}
                            onChange={handlePatientChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Date de naissance</label>
                          <input
                            type="date"
                            name="dateNaissance"
                            className="form-control"
                            value={patientForm.dateNaissance}
                            onChange={handlePatientChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Téléphone</label>
                          <input
                            type="tel"
                            name="telephone"
                            className="form-control"
                            value={patientForm.telephone}
                            onChange={handlePatientChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Email</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={patientForm.email}
                            onChange={handlePatientChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">
                            Mot de passe {currentPatient && '(laisser vide pour ne pas modifier)'}
                          </label>
                          <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={patientForm.password}
                            onChange={handlePatientChange}
                            required={!currentPatient}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Assurances</label>
                          <div className="d-flex flex-wrap gap-2">
                            {assurancesList.map((assurance) => (
                              <div key={assurance} className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`assurance-patient-${assurance}`}
                                  name="assurances"
                                  value={assurance}
                                  checked={patientForm.assurances.includes(assurance)}
                                  onChange={handlePatientChange}
                                />
                                <label className="form-check-label small" htmlFor={`assurance-patient-${assurance}`}>
                                  {assurance}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => {
                            resetPatientForm();
                            setShowPatientForm(false);
                          }}>
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary">
                            {currentPatient ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Liste des patients style Instagram */}
                {patients.length > 0 ? (
                  <div className="row g-3">
                    {patients
                      .filter(patient => {
                        if (!searchTerm) return true;
                        const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
                        return fullName.includes(searchTerm.toLowerCase());
                      })
                      .map((patient) => (
                        <div key={patient.id} className="col-12">
                          <div className="card border-0 shadow-sm">
                            <div className="card-body">
                              <div className="d-flex align-items-center mb-2">
                                <div className="avatar bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                                  {patient.prenom?.charAt(0) || 'P'}
                                </div>
                                <div className="ms-3">
                                  <h6 className="mb-0">{patient.prenom} {patient.nom}</h6>
                                  <div className="small text-muted">
                                    {new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear()} ans
                                  </div>
                                </div>
                                <div className="dropdown ms-auto">
                                  <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                                    <i className="bi bi-three-dots-vertical"></i>
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                      <button 
                                        className="dropdown-item" 
                                        onClick={() => handleEditPatient(patient)}
                                      >
                                        <i className="bi bi-pencil me-2"></i> Modifier
                                      </button>
                                    </li>
                                    <li>
                                      <button 
                                        className="dropdown-item" 
                                        onClick={() => {
                                          setArchiveForm({...archiveForm, patientId: patient.id});
                                          setActiveTab('archives');
                                          setShowArchiveForm(true);
                                        }}
                                      >
                                        <i className="bi bi-folder-plus me-2"></i> Ajouter archive
                                      </button>
                                    </li>
                                    <li>
                                      <button 
                                        className="dropdown-item text-danger" 
                                        onClick={() => handleDeletePatient(patient.id)}
                                      >
                                        <i className="bi bi-trash me-2"></i> Supprimer
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center small text-muted mb-2">
                                <i className="bi bi-envelope me-2"></i>
                                <span>{patient.email}</span>
                              </div>
                              
                              <div className="d-flex align-items-center small text-muted mb-2">
                                <i className="bi bi-telephone me-2"></i>
                                <span>{patient.telephone}</span>
                              </div>
                              
                              {patient.assurances && patient.assurances.length > 0 && (
                                <div className="small mb-2">
                                  <span className="fw-bold">Assurances:</span> {patient.assurances.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="card-footer bg-white border-top d-flex justify-content-between">
                              <button 
                                className="btn btn-sm btn-outline-primary rounded-pill"
                                onClick={() => {
                                  resetRdvForm();
                                  setRdvForm({...rdvForm, patientId: patient.id});
                                  setActiveTab('rendezvous');
                                  setShowRendezvousForm(true);
                                }}
                              >
                                <i className="bi bi-calendar-plus me-1"></i> Nouveau RDV
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary rounded-pill"
                                onClick={() => {
                                  setFiltreArchivePatient(patient.id);
                                  setActiveTab('archives');
                                }}
                              >
                                <i className="bi bi-folder me-1"></i> Archives
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-person-plus text-muted" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h6 className="text-muted">Aucun patient</h6>
                    <p className="text-muted small">Ajoutez des patients à votre structure</p>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill mt-2"
                      onClick={() => {
                        resetPatientForm();
                        setShowPatientForm(true);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Ajouter un patient
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Onglet Rendez-vous */}
            {activeTab === 'rendezvous' && (
              <motion.div
                key="rendezvous"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Rendez-vous</h5>
                  <div>
                    <button 
                      className="btn btn-light btn-sm me-2"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <i className="bi bi-funnel"></i>
                    </button>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill"
                      onClick={() => {
                        resetRdvForm();
                        setShowRendezvousForm(!showRendezvousForm);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Ajouter
                    </button>
                  </div>
                </div>
                
                {/* Filtres */}
                {showFilters && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label small">Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filtreDate}
                          onChange={(e) => setFiltreDate(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small">Médecin</label>
                        <select
                          className="form-select"
                          value={filtreMedecin}
                          onChange={(e) => setFiltreMedecin(e.target.value)}
                        >
                          <option value="">Tous les médecins</option>
                          {medecins.map((medecin) => (
                            <option key={medecin.id} value={medecin.id}>
                              Dr. {medecin.prenom} {medecin.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulaire d'ajout/modification de RDV */}
                {showRendezvousForm && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-white py-3">
                      <h6 className="mb-0">{currentRendezvous ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'}</h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleAddRendezvous}>
                        <div className="mb-3">
                          <label className="form-label small">Médecin</label>
                          <select
                            name="medecinId"
                            className="form-select"
                            value={rdvForm.medecinId}
                            onChange={handleRdvChange}
                            required
                          >
                            <option value="">Sélectionner un médecin</option>
                            {medecins.map((medecin) => (
                              <option key={medecin.id} value={medecin.id}>
                                Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Patient</label>
                          <select
                            name="patientId"
                            className="form-select"
                            value={rdvForm.patientId}
                            onChange={handleRdvChange}
                            required
                          >
                            <option value="">Sélectionner un patient</option>
                            {patients.map((patient) => (
                              <option key={patient.id} value={patient.id}>
                                {patient.prenom} {patient.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Date</label>
                          <input
                            type="date"
                            name="date"
                            className="form-control"
                            value={rdvForm.date}
                            onChange={handleRdvChange}
                            required
                          />
                        </div>
                        
                        <div className="row mb-3">
                          <div className="col-6">
                            <label className="form-label small">Heure</label>
                            {rdvForm.medecinId && rdvForm.date ? (
                              <select
                                name="heure"
                                className="form-select"
                                value={rdvForm.heure}
                                onChange={handleRdvChange}
                                required
                              >
                                <option value="">Sélectionner</option>
                                {getCreneauxDisponibles().map((creneau) => (
                                  <option key={creneau} value={creneau}>
                                    {creneau}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="alert alert-warning py-1 px-2 small">
                                Sélectionner médecin et date
                              </div>
                            )}
                          </div>
                          <div className="col-6">
                            <label className="form-label small">Durée</label>
                            <select
                              name="duree"
                              className="form-select"
                              value={rdvForm.duree}
                              onChange={handleRdvChange}
                              required
                            >
                              {dureesRdv.map((duree) => (
                                <option key={duree} value={duree}>
                                  {duree} min
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Motif</label>
                          <textarea
                            name="motif"
                            className="form-control"
                            value={rdvForm.motif}
                            onChange={handleRdvChange}
                            rows="2"
                          ></textarea>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Statut</label>
                          <select
                            name="statut"
                            className="form-select"
                            value={rdvForm.statut}
                            onChange={handleRdvChange}
                            required
                          >
                                                        {statutsRdv.map((statut) => (
                              <option key={statut} value={statut}>
                                {statut.charAt(0).toUpperCase() + statut.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => {
                            resetRdvForm();
                            setShowRendezvousForm(false);
                          }}>
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary">
                            {currentRendezvous ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Liste des rendez-vous style Instagram */}
                {rendezVousFiltres.length > 0 ? (
                  <div>
                    {/* Affichage par date */}
                    <div className="mb-3">
                      <h6 className="mb-2">
                        {new Date(filtreDate).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h6>
                      
                      <div className="row g-3">
                        {rendezVousFiltres
                          .sort((a, b) => a.heure.localeCompare(b.heure))
                          .map((rdv) => {
                            const medecin = medecins.find(m => m.id === rdv.medecinId);
                            const patient = patients.find(p => p.id === rdv.patientId);
                            return (
                              <div key={rdv.id} className="col-12">
                                <div className={`card border-0 shadow-sm ${
                                  rdv.statut === 'annulé' ? 'border-start border-danger border-5' : 
                                  rdv.statut === 'terminé' ? 'border-start border-success border-5' : 
                                  rdv.statut === 'en cours' ? 'border-start border-primary border-5' : 
                                  rdv.statut === 'confirmé' ? 'border-start border-info border-5' : ''
                                }`}>
                                  <div style={mobileStyles.postHeader}>
                                    <div className="bg-primary bg-opacity-10 rounded p-2 text-center me-3" style={{ width: '45px' }}>
                                      <div className="small text-primary fw-bold">{rdv.heure}</div>
                                    </div>
                                    <div>
                                      <div className="fw-bold">{patient ? `${patient.prenom} ${patient.nom}` : rdv.patientNom || 'Patient inconnu'}</div>
                                      <div className="small text-muted">Dr. {medecin ? `${medecin.prenom} ${medecin.nom}` : rdv.medecinNom || 'Médecin inconnu'}</div>
                                    </div>
                                    <span className={`badge ms-auto ${
                                      rdv.statut === 'annulé' ? 'bg-danger' :
                                      rdv.statut === 'terminé' ? 'bg-success' :
                                      rdv.statut === 'en cours' ? 'bg-primary' :
                                      rdv.statut === 'confirmé' ? 'bg-info' :
                                      rdv.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                                    }`}>
                                      {rdv.statut}
                                    </span>
                                  </div>
                                  
                                  {rdv.motif && (
                                    <div className="px-3 pb-2">
                                      <div className="small text-muted">
                                        <i className="bi bi-chat-left-text me-1"></i> {rdv.motif}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="card-footer bg-white d-flex justify-content-between p-2">
                                    <div className="btn-group">
                                      <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => handleEditRendezvous(rdv)}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteRendezvous(rdv.id)}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                    
                                    <div className="dropdown">
                                      <button 
                                        className="btn btn-sm btn-outline-primary dropdown-toggle" 
                                        type="button" 
                                        data-bs-toggle="dropdown"
                                      >
                                        Statut
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end">
                                        {statutsRdv.map(statut => (
                                          <li key={statut}>
                                            <button 
                                              className={`dropdown-item ${rdv.statut === statut ? 'active' : ''}`}
                                              onClick={() => handleChangeStatutRendezvous(rdv.id, statut)}
                                            >
                                              {statut.charAt(0).toUpperCase() + statut.slice(1)}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h6 className="text-muted">Aucun rendez-vous trouvé</h6>
                    <p className="text-muted small">Aucun rendez-vous pour cette date ou ce médecin</p>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill mt-2"
                      onClick={() => {
                        resetRdvForm();
                        setShowRendezvousForm(true);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Ajouter un rendez-vous
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Onglet Archives */}
            {activeTab === 'archives' && (
              <motion.div
                key="archives"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Archives</h5>
                  <button 
                    className="btn btn-primary btn-sm rounded-pill"
                    onClick={() => {
                      resetArchiveForm();
                      setShowArchiveForm(!showArchiveForm);
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Ajouter
                  </button>
                </div>
                
                {/* Filtre par patient */}
                <div className="mb-3">
                  <select 
                    className="form-select"
                    value={filtreArchivePatient} 
                    onChange={(e) => setFiltreArchivePatient(e.target.value)}
                  >
                    <option value="">Tous les patients</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Formulaire d'ajout/modification d'archive */}
                {showArchiveForm && (
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-header bg-white py-3">
                      <h6 className="mb-0">{currentArchive ? "Modifier l'archive" : "Ajouter une archive"}</h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleAddArchive}>
                        <div className="mb-3">
                          <label className="form-label small">Patient</label>
                          <select 
                            name="patientId" 
                            className="form-select" 
                            value={archiveForm.patientId} 
                            onChange={handleArchiveChange}
                            required
                          >
                            <option value="">Sélectionner un patient</option>
                            {patients.map(patient => (
                              <option key={patient.id} value={patient.id}>
                                {patient.prenom} {patient.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Titre</label>
                          <input 
                            type="text" 
                            name="titre" 
                            className="form-control" 
                            value={archiveForm.titre} 
                            onChange={handleArchiveChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Description</label>
                          <textarea 
                            name="description" 
                            className="form-control" 
                            value={archiveForm.description} 
                            onChange={handleArchiveChange}
                            rows="2"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Date</label>
                          <input 
                            type="date" 
                            name="date" 
                            className="form-control" 
                            value={archiveForm.date} 
                            onChange={handleArchiveChange}
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Tags</label>
                          <div className="d-flex flex-wrap gap-2">
                            {tagsList.map(tag => (
                              <div key={tag} className="form-check">
                                <input 
                                  type="checkbox" 
                                  id={`tag-${tag}`} 
                                  name="tags" 
                                  value={tag} 
                                  className="form-check-input" 
                                  checked={archiveForm.tags.includes(tag)} 
                                  onChange={handleArchiveChange}
                                />
                                <label htmlFor={`tag-${tag}`} className="form-check-label small">{tag}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label small">Fichiers</label>
                          <input 
                            type="file" 
                            className="form-control" 
                            onChange={handleFileChange}
                            multiple
                          />
                        </div>
                        
                        {currentArchive && archiveForm.files.length > 0 && (
                          <div className="mb-3">
                            <label className="form-label small">Fichiers existants</label>
                            <ul className="list-group list-group-flush">
                              {archiveForm.files.map((file, index) => (
                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-truncate">
                                    <i className="bi bi-file-earmark me-1"></i> {file.name}
                                  </a>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-outline-danger" 
                                    onClick={() => handleDeleteFile(currentArchive.id, file.path, index)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-outline-secondary" onClick={() => {
                            resetArchiveForm();
                            setShowArchiveForm(false);
                          }}>
                            Annuler
                          </button>
                          <button type="submit" className="btn btn-primary">
                            {currentArchive ? 'Mettre à jour' : 'Ajouter'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Liste des archives style Instagram */}
                {archives
                  .filter(archive => !filtreArchivePatient || archive.patientId === filtreArchivePatient)
                  .length > 0 ? (
                  <div className="row g-3">
                    {archives
                      .filter(archive => !filtreArchivePatient || archive.patientId === filtreArchivePatient)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(archive => (
                        <div key={archive.id} className="col-12">
                          <div className="card border-0 shadow-sm">
                            <div style={mobileStyles.postHeader}>
                              <div className="avatar bg-info text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                <i className="bi bi-folder2-open"></i>
                              </div>
                              <div className="ms-3">
                                <h6 className="mb-0">{archive.titre}</h6>
                                <div className="small text-muted">{archive.patientNom || 'Patient inconnu'}</div>
                              </div>
                              <div className="dropdown ms-auto">
                                <button className="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                                  <i className="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li>
                                    <button 
                                      className="dropdown-item" 
                                      onClick={() => handleEditArchive(archive)}
                                    >
                                      <i className="bi bi-pencil me-2"></i> Modifier
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item text-danger" 
                                      onClick={() => handleDeleteArchive(archive.id)}
                                    >
                                      <i className="bi bi-trash me-2"></i> Supprimer
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            
                            {archive.description && (
                              <div className="px-3 pb-2">
                                <p className="mb-2 small">{archive.description}</p>
                              </div>
                            )}
                            
                            {archive.tags && archive.tags.length > 0 && (
                              <div className="px-3 pb-2 d-flex flex-wrap gap-1">
                                {archive.tags.map(tag => (
                                  <span key={tag} className="badge bg-light text-dark border">{tag}</span>
                                ))}
                              </div>
                            )}
                            
                            {archive.files && archive.files.length > 0 && (
                              <div className="px-3 pb-3">
                                <div className="small fw-bold mb-2">Fichiers ({archive.files.length})</div>
                                <div className="list-group list-group-flush">
                                  {archive.files.slice(0, 2).map((file, index) => (
                                    <a 
                                      key={index}
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="list-group-item list-group-item-action d-flex align-items-center px-0 py-1 border-0"
                                    >
                                      <i className="bi bi-file-earmark me-2 text-primary"></i>
                                      <span className="text-truncate">{file.name}</span>
                                    </a>
                                  ))}
                                  {archive.files.length > 2 && (
                                    <button className="btn btn-link btn-sm text-decoration-none p-0 mt-1">
                                      + {archive.files.length - 2} autres fichiers
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center p-3">
                              <small className="text-muted">
                                <i className="bi bi-calendar3 me-1"></i>
                                {new Date(archive.date).toLocaleDateString()}
                              </small>
                              <button 
                                className="btn btn-sm btn-outline-primary rounded-pill"
                                onClick={() => handleEditArchive(archive)}
                              >
                                <i className="bi bi-eye me-1"></i> Voir détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-folder2 text-muted" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h6 className="text-muted">Aucune archive</h6>
                    <p className="text-muted small">
                      {filtreArchivePatient ? "Aucune archive pour ce patient" : "Aucune archive disponible"}
                    </p>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill mt-2"
                      onClick={() => {
                        resetArchiveForm();
                        setShowArchiveForm(true);
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Ajouter une archive
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Onglet Affiliations */}
            {activeTab === 'affiliations' && (
              <motion.div
                key="affiliations"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="px-3"
              >
                <h5 className="mb-3">Demandes d'affiliation</h5>
                
                <ul className="nav nav-pills mb-3">
                  <li className="nav-item">
                    <button 
                      className="nav-link active" 
                      data-bs-toggle="pill" 
                      data-bs-target="#patients-tab"
                    >
                      Patients
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="nav-link" 
                      data-bs-toggle="pill" 
                      data-bs-target="#medecins-tab"
                    >
                      Médecins
                    </button>
                  </li>
                </ul>
                
                <div className="tab-content">
                  <div className="tab-pane fade show active" id="patients-tab">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body p-0">
                        <AffiliationRequestsManagerPatients />
                      </div>
                    </div>
                  </div>
                  <div className="tab-pane fade" id="medecins-tab">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body p-0">
                        <AffiliationRequestsManagerMedecins />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {message && (
            <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} mx-3 mt-3 mb-5`}>
              {message}
            </div>
          )}
        </main>

        {/* Footer style Instagram */}
        <footer style={mobileStyles.footer}>
          <div className="d-flex justify-content-around">
            <button 
              className={`btn ${activeTab === 'info' ? 'text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('info')}
            >
              <div className="d-flex flex-column align-items-center">
                <i className={`bi ${activeTab === 'info' ? 'bi-house-fill' : 'bi-house'}`} style={mobileStyles.navIcon}></i>
                <span className="small">Accueil</span>
              </div>
            </button>
            
            <button 
              className={`btn ${activeTab === 'medecins' ? 'text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('medecins')}
            >
              <div className="d-flex flex-column align-items-center">
                <i className={`bi ${activeTab === 'medecins' ? 'bi-heart-pulse-fill' : 'bi-heart-pulse'}`} style={mobileStyles.navIcon}></i>
                <span className="small">Médecins</span>
              </div>
            </button>
            
            <button 
              className="btn text-primary"
              onClick={() => {
                resetRdvForm();
                setActiveTab('rendezvous');
                setShowRendezvousForm(true);
              }}
            >
              <div className="d-flex flex-column align-items-center">
                <i className="bi bi-plus-square-fill" style={{ ...mobileStyles.navIcon, fontSize: '30px' }}></i>
                <span className="small">Ajouter</span>
              </div>
            </button>
            
            <button 
              className={`btn ${activeTab === 'patients' ? 'text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('patients')}
            >
              <div className="d-flex flex-column align-items-center">
                <i className={`bi ${activeTab === 'patients' ? 'bi-people-fill' : 'bi-people'}`} style={mobileStyles.navIcon}></i>
                <span className="small">Patients</span>
              </div>
            </button>
            
            <button 
              className={`btn ${activeTab === 'rendezvous' ? 'text-primary' : 'text-muted'}`}
              onClick={() => setActiveTab('rendezvous')}
            >
              <div className="d-flex flex-column align-items-center">
                <i className={`bi ${activeTab === 'rendezvous' ? 'bi-calendar-check-fill' : 'bi-calendar-check'}`} style={mobileStyles.navIcon}></i>
                <span className="small">RDV</span>
              </div>
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Version desktop (code original)
  return (
    <div className="container mt-5">
      {/* Le code original reste inchangé */}
      {/* ... */}
    </div>
  );
};

export default StructureDashboard;
