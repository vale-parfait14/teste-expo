import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Card,
  ListGroup,
  Row,
  Col,
  Badge,
  Tabs,
  Tab,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  InputGroup
} from "react-bootstrap";
import { db, storage } from "../components/firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { FaPlus, FaComment, FaPaperclip, FaEye, FaTrash, FaSearch, FaFilter, FaUserMd, FaFile } from "react-icons/fa";

const AnnouncementSystem = ({ structure, doctors }) => {
  // États pour les annonces de structure (existants)
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementDetail, setAnnouncementDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [targetFilter, setTargetFilter] = useState('all');
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    targetType: "all",
    targetDoctors: [],
    priority: "normal",
    attachments: [],
    expiryDate: ""
  });
  
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [filter, setFilter] = useState("all");
  const [viewFilter, setViewFilter] = useState("all");
  
  const [doctorTypeStats, setDoctorTypeStats] = useState({
    all: 0,
    affiliated: 0,
    private: 0
  });

  // Nouveaux états pour les annonces des médecins
  const [medecinAnnonces, setMedecinAnnonces] = useState([]);
  const [showMedecinAnnonceModal, setShowMedecinAnnonceModal] = useState(false);
  const [detailedMedecinAnnonce, setDetailedMedecinAnnonce] = useState(null);
  const [reponseAnnonceMedecin, setReponseAnnonceMedecin] = useState('');
  const [reponseFiles, setReponseFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [medecinAnnonceFilter, setMedecinAnnonceFilter] = useState('all');
  const [searchTermMedecin, setSearchTermMedecin] = useState('');
  const [activeTab, setActiveTab] = useState('structure');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedMedecinAnnonce, setSelectedMedecinAnnonce] = useState(null);

  // Catégories d'annonces médecins
  const categories = ["Général", "Cas clinique", "Formation", "Équipement", "Remplacement", "Collaboration", "Autre"];
  
  // Chargement des annonces des médecins
  useEffect(() => {
    if (!structure?.id) return;
    
    const annoncesRef = collection(db, "annonces_medecins");
    const q = query(annoncesRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const annoncesData = [];
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        annoncesData.push(data);
      });
      
      setMedecinAnnonces(annoncesData);
    });
    
    return () => unsubscribe();
  }, [structure?.id]);

  // Code existant - Calcul des statistiques de médecins
  useEffect(() => {
    if (!doctors || !Array.isArray(doctors)) return;
    
    const stats = {
      all: doctors.length,
      affiliated: doctors.filter(d => d.visibility === "affiliated").length,
      private: doctors.filter(d => d.visibility !== "affiliated").length
    };
    
    setDoctorTypeStats(stats);
  }, [doctors]);
  
  // Code existant - Chargement des annonces de structure
  useEffect(() => {
    if (!structure?.id) return;
    
    const announcementsRef = collection(db, "structureAnnouncements");
    const q = query(announcementsRef, where("structureId", "==", structure.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setAnnouncements(announcementsData.sort((a, b) => b.createdAt - a.createdAt));
    });
    
    return () => unsubscribe();
  }, [structure?.id]);
  
  // Filtrer les annonces de structure (code existant)
  const filteredAnnouncements = announcements.filter(announcement => {
    const now = new Date();
    const expiryDate = announcement.expiryDate ? new Date(announcement.expiryDate) : null;
    
    switch(filter) {
      case "active":
        return !expiryDate || expiryDate > now;
      case "expired":
        return expiryDate && expiryDate <= now;
      default:
        return true;
    }
  });

  // Filtrer les annonces des médecins
  const filteredMedecinAnnonces = medecinAnnonces.filter(annonce => {
    // Filtrer par catégorie
    if (medecinAnnonceFilter !== "all" && annonce.categorie !== medecinAnnonceFilter) {
      return false;
    }
    
    // Filtrer par terme de recherche
    if (searchTermMedecin) {
      const searchLower = searchTermMedecin.toLowerCase();
      return (
        annonce.titre?.toLowerCase().includes(searchLower) ||
        annonce.contenu?.toLowerCase().includes(searchLower) ||
        annonce.creatorName?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Formatter la date pour les annonces des médecins
  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Si c'est aujourd'hui, afficher l'heure
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si c'est hier
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Sinon afficher la date complète
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonctions existantes
  const handleCreateAnnouncement = async () => {
    // Code existant...
    try {
      // Vérification que structure existe et a un ID
      if (!structure || !structure.id) {
        alert("Erreur: Informations de structure manquantes. Veuillez rafraîchir la page.");
        return;
      }
      
      // Vérification des champs obligatoires
      if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      
      // Vérification des médecins sélectionnés si mode "selected"
      if (newAnnouncement.targetType === "selected" && newAnnouncement.targetDoctors.length === 0) {
        alert("Veuillez sélectionner au moins un médecin destinataire");
        return;
      }
      
      const attachmentUrls = [];
      
      // Télécharger les fichiers joints
      for (const file of attachmentFiles) {
        const fileRef = ref(storage, `announcements/${structure.id}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        attachmentUrls.push({
          name: file.name,
          url: url,
          type: file.type
        });
      }
      
      // Créer l'annonce dans Firestore
      const announcementData = {
        structureId: structure.id,
        structureName: structure.name || "Structure médicale",
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        targetType: newAnnouncement.targetType,
        priority: newAnnouncement.priority,
        attachments: attachmentUrls,
        expiryDate: newAnnouncement.expiryDate ? new Date(newAnnouncement.expiryDate) : null,
        createdAt: serverTimestamp(),
        stats: {
          views: 0,
          replies: 0,
          reactions: {
            like: 0,
            important: 0,
            question: 0
          }
        },
        status: "active"
      };
      
      const docRef = await addDoc(collection(db, "structureAnnouncements"), announcementData);
      
      // Notification pour les médecins ciblés
      let targetedDoctorIds = [];
      
      // Vérifier que doctors est un tableau valide avant de l'utiliser
      if (Array.isArray(doctors) && doctors.length > 0) {
        switch (newAnnouncement.targetType) {
          case "all":
            targetedDoctorIds = doctors.map(d => d.id);
            break;
          case "affiliated":
            targetedDoctorIds = doctors.filter(d => d.visibility === "affiliated").map(d => d.id);
            break;
          case "private":
            targetedDoctorIds = doctors.filter(d => d.visibility !== "affiliated" && d.isPrivate).map(d => d.id);
            break;
          case "non-affiliated":
            targetedDoctorIds = doctors.filter(d => d.visibility !== "affiliated" && !d.isPrivate).map(d => d.id);
            break;
        }
  
        // Créer des notifications pour les médecins ciblés
        for (const doctorId of targetedDoctorIds) {
          await addDoc(collection(db, "notifications"), {
            userId: doctorId,
            type: "announcement",
            title: "Nouvelle annonce",
            message: `${structure.name} a publié une annonce: ${newAnnouncement.title}`,
            structureId: structure.id,
            structureName: structure.name || "Structure médicale",
            announcementId: docRef.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
      
      // Réinitialiser le formulaire
      setNewAnnouncement({
        title: "",
        content: "",
        targetType: "all",
        targetDoctors: [],
        priority: "normal",
        attachments: [],
        expiryDate: ""
      });
      setAttachmentFiles([]);
      setShowAnnouncementModal(false);
      
      // Message de confirmation
      alert("Annonce publiée avec succès!");
      
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce:", error);
      alert("Une erreur est survenue lors de la création de l'annonce.");
    }
  };
  
  const handleDeleteAnnouncement = async (announcementId) => {
    // Code existant...
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      try {
        await deleteDoc(doc(db, "structureAnnouncements", announcementId));
      } catch (error) {
        console.error("Erreur lors de la suppression de l'annonce:", error);
      }
    }
  };
  
  const handleViewAnnouncementDetails = async (announcement) => {
    // Code existant...
    try {
      // Récupérer les statistiques détaillées et les réponses
      const repliesRef = collection(db, "announcementReplies");
      const q = query(repliesRef, where("announcementId", "==", announcement.id));
      const repliesSnapshot = await getDocs(q);
      
      const replies = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Compter les lectures par médecin
      const viewsRef = collection(db, "announcementViews");
      const viewsQuery = query(viewsRef, where("announcementId", "==", announcement.id));
      const viewsSnapshot = await getDocs(viewsQuery);
      
      const views = viewsSnapshot.docs.map(doc => ({
        doctorId: doc.data().doctorId,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      // Récupérer les détails sur les médecins qui ont vu l'annonce
      const viewedDoctors = [];
      for (const view of views) {
        const doctor = doctors.find(d => d.id === view.doctorId);
        if (doctor) {
          viewedDoctors.push({
            id: doctor.id,
            name: `Dr. ${doctor.nom} ${doctor.prenom}`,
            specialite: doctor.specialite,
            visibility: doctor.visibility,
            timestamp: view.timestamp
          });
        }
      }
      
      setAnnouncementDetail({
        ...announcement,
        replies: replies.sort((a, b) => b.timestamp - a.timestamp),
        views: viewedDoctors.sort((a, b) => b.timestamp - a.timestamp)
      });
      
      setShowDetailModal(true);
      
    } catch (error) {
      console.error("Erreur lors du chargement des détails de l'annonce:", error);
    }
  };
  
  const handleReplyToAnnouncement = async (content) => {
    // Code existant...
    if (!announcementDetail || !content.trim()) return;
    
    try {
      await addDoc(collection(db, "announcementReplies"), {
        announcementId: announcementDetail.id,
        structureId: structure.id,
        isFromStructure: true,
        content: content,
        senderName: "Administration",
        senderType: "structure",
        timestamp: serverTimestamp(),
        readByDoctors: []
      });
      
      // Mettre à jour les stats de l'annonce
      await updateDoc(doc(db, "structureAnnouncements", announcementDetail.id), {
        "stats.replies": (announcementDetail.stats?.replies || 0) + 1
      });
      
      // Notifications pour les médecins qui ont déjà répondu
      const uniqueDoctorIds = [...new Set(
        announcementDetail.replies
          .filter(reply => !reply.isFromStructure)
          .map(reply => reply.doctorId)
      )];
      
      for (const doctorId of uniqueDoctorIds) {
        await addDoc(collection(db, "notifications"), {
          userId: doctorId,
          type: "announcement_reply",
          title: "Réponse à une annonce",
          message: `${structure.name} a répondu à une annonce à laquelle vous avez participé`,
          structureId: structure.id,
          structureName: structure.name,
          announcementId: announcementDetail.id,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      // Rafraîchir les détails après la réponse
      handleViewAnnouncementDetails(announcementDetail);
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
    }
  };
  
  const getFilteredViews = () => {
    // Code existant...
    if (!announcementDetail?.views) return [];
    
    switch(viewFilter) {
      case "affiliated":
        return announcementDetail.views.filter(v => v.visibility === "affiliated");
      case "private":
        return announcementDetail.views.filter(v => v.visibility !== "affiliated");
      default:
        return announcementDetail.views;
    }
  };
  
  // Nouvelles fonctions pour gérer les annonces des médecins
  
  // Afficher les détails d'une annonce médecin
  const handleViewMedecinAnnonceDetails = (annonce) => {
    setDetailedMedecinAnnonce(annonce);
    setShowMedecinAnnonceModal(true);
  };
  
  // Répondre à une annonce médecin
  const handleRepondreAnnonceMedecin = async () => {
    if (!reponseAnnonceMedecin.trim()) {
      setMessage("Veuillez saisir une réponse");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Préparer la réponse
      const nouvelleReponse = {
        contenu: reponseAnnonceMedecin,
        createdBy: structure.id,
        createdAt: new Date().toISOString(),
        creatorName: `${structure.name} (Établissement médical)`,
        creatorSpecialite: "Établissement de santé",
        isStructure: true, // Indiquer que c'est une structure qui répond
        fichiers: []
      };
      
      // Uploader les fichiers si présents
      if (reponseFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          reponseFiles.map(async (file) => {
            const storageRef = ref(storage, `annonces_medecins/${selectedMedecinAnnonce.id}/reponses/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            
            return {
              name: file.name,
              url: url,
              type: file.type,
              path: storageRef.fullPath
            };
          })
        );
        
        nouvelleReponse.fichiers = uploadedFiles;
      }
      
      // Mettre à jour l'annonce avec la nouvelle réponse
      const annonceRef = doc(db, "annonces_medecins", selectedMedecinAnnonce.id);
      await updateDoc(annonceRef, {
        reponses: [...(selectedMedecinAnnonce.reponses || []), nouvelleReponse]
      });
      
      // Créer une notification pour le médecin qui a publié l'annonce
      await addDoc(collection(db, "notifications"), {
        userId: selectedMedecinAnnonce.createdBy,
        type: "forum_reply",
        title: "Réponse à votre annonce",
        message: `${structure.name} a répondu à votre annonce: ${selectedMedecinAnnonce.titre}`,
        structureId: structure.id,
        structureName: structure.name,
        annonceId: selectedMedecinAnnonce.id,
        read: false,
        createdAt: serverTimestamp()
      });
      
      setReponseAnnonceMedecin("");
      setReponseFiles([]);
      setShowResponseModal(false);
      setMessage("Réponse publiée avec succès");
      
      // Rafraîchir les détails de l'annonce
      if (detailedMedecinAnnonce && detailedMedecinAnnonce.id === selectedMedecinAnnonce.id) {
        const updatedAnnonce = { ...selectedMedecinAnnonce };
        updatedAnnonce.reponses = [...(updatedAnnonce.reponses || []), nouvelleReponse];
        setDetailedMedecinAnnonce(updatedAnnonce);
      }
      
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réponse:", error);
      setMessage("Erreur lors de la publication de la réponse");
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu du composant principal avec les onglets
  return (
    <>
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white py-3">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-0 nav-tabs-light"
          >
            <Tab 
              eventKey="structure" 
              title={
                <span>
                  <i className="fas fa-bullhorn me-2"></i>
                  Vos annonces
                </span>
              }
            />
            <Tab 
              eventKey="medecins" 
              title={
                <span>
                  <i className="fas fa-user-md me-2"></i>
                  Forum des médecins
                </span>
              }
            />
          </Tabs>
        </Card.Header>

        <Card.Body>
          {activeTab === "structure" ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <h6 className="mb-0 me-3">Filtrer:</h6>
                  <div className="btn-group">
                    <Button
                      variant={filter === "all" ? "primary" : "outline-primary"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      Toutes
                    </Button>
                    <Button
                      variant={filter === "active" ? "primary" : "outline-primary"}
                      size="sm"
                      onClick={() => setFilter("active")}
                    >
                      Actives
                    </Button>
                    <Button
                      variant={filter === "expired" ? "primary" : "outline-primary"}
                      size="sm"
                      onClick={() => setFilter("expired")}
                    >
                      Expirées
                    </Button>
                  </div>
                </div>
                
                <div className="d-flex align-items-center">
                  <span className="me-2">Total: {announcements.length}</span>
                  <Badge bg="primary" className="me-3">{filteredAnnouncements.length} affichées</Badge>
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="rounded-pill" 
                    onClick={() => setShowAnnouncementModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Nouvelle annonce
                  </Button>
                </div>
              </div>
              
              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-5 bg-light rounded">
                  <i className="fas fa-bullhorn fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Aucune annonce disponible</h5>
                  <p className="text-muted">
                    Cliquez sur "Nouvelle annonce" pour communiquer avec vos médecins.
                  </p>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowAnnouncementModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Créer une annonce
                  </Button>
                </div>
              ) : (
                <ListGroup className="announcement-list">
                  {filteredAnnouncements.map((announcement) => {
                    const isExpired = announcement.expiryDate && new Date(announcement.expiryDate) < new Date();
                    const priorityClass = 
                      announcement.priority === "high" ? "border-danger" :
                      announcement.priority === "low" ? "border-info" :
                      "border-warning";
                    
                    return (
                      <ListGroup.Item 
                        key={announcement.id} 
                        className={`border-start ${priorityClass} ${isExpired ? 'bg-light opacity-75' : ''}`}
                        style={{ borderLeftWidth: "4px" }}
                      >
                        <Row>
                          <Col md={8}>
                            <div className="d-flex align-items-center mb-2">
                              {announcement.priority === "high" && (
                                <Badge bg="danger" className="me-2">Important</Badge>
                              )}
                              <h5 className="mb-0">{announcement.title}</h5>
                            </div>
                            <p className="text-muted small mb-1">
                              <i className="far fa-calendar-alt me-1"></i>
                              Publiée le {announcement.createdAt.toLocaleDateString('fr-FR')}
                              {announcement.expiryDate && 
                                ` — Expire le ${new Date(announcement.expiryDate).toLocaleDateString('fr-FR')}`}
                            </p>
                            <p className="text-muted small mb-1">
                              <i className="fas fa-user-md me-1"></i>
                              {announcement.targetType === "all" ? "Tous les médecins" : 
                               announcement.targetType === "affiliated" ? "Médecins affiliés uniquement" :
                               `${announcement.targetDoctors?.length || 0} médecins sélectionnés`}
                            </p>
                            <p className="mb-0 announcement-preview">
                              {announcement.content.length > 120 
                                ? `${announcement.content.substring(0, 120)}...` 
                                : announcement.content}
                            </p>
                          </Col>
                          <Col md={4} className="d-flex flex-column justify-content-center align-items-end">
                            <div className="stats mb-2">
                              <Badge bg="light" text="dark" className="me-1">
                                <i className="far fa-eye me-1"></i>
                                {announcement.stats?.views || 0}
                              </Badge>
                              <Badge bg="light" text="dark" className="me-1">
                                <i className="far fa-comment me-1"></i>
                                {announcement.stats?.replies || 0}
                              </Badge>
                              <Badge bg="light" text="dark">
                                <i className="far fa-thumbs-up me-1"></i>
                                {announcement.stats?.reactions?.like || 0}
                              </Badge>
                            </div>
                            <div className="actions">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => handleViewAnnouncementDetails(announcement)}
                              >
                                <i className="fas fa-eye me-1"></i>
                                Détails
                              </Button>
                              <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                              >
                                                <i className="fas fa-trash-alt me-1"></i>
                                                Supprimer
                                              </Button>
                                            </div>
                                          </Col>
                                        </Row>
                                      </ListGroup.Item>
                                    );
                                  })}
                                </ListGroup>
                              )}
                            </>
                          ) : (
                            // Onglet pour les annonces des médecins
                            <>
                              <div className="mb-4">
                                <Row>
                                  <Col md={6}>
                                    <InputGroup className="mb-3 mb-md-0">
                                      <InputGroup.Text>
                                        <FaSearch />
                                      </InputGroup.Text>
                                      <Form.Control
                                        type="text"
                                        placeholder="Rechercher dans le forum..."
                                        value={searchTermMedecin}
                                        onChange={(e) => setSearchTermMedecin(e.target.value)}
                                      />
                                      {searchTermMedecin && (
                                        <Button 
                                          variant="outline-secondary" 
                                          onClick={() => setSearchTermMedecin("")}
                                        >
                                          &times;
                                        </Button>
                                      )}
                                    </InputGroup>
                                  </Col>
                                  <Col md={6}>
                                    <div className="d-flex justify-content-md-end">
                                      <Dropdown>
                                        <Dropdown.Toggle variant="outline-primary" id="dropdown-filter">
                                          <FaFilter className="me-2" />
                                          {medecinAnnonceFilter === "all" ? "Toutes les catégories" : medecinAnnonceFilter}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                          <Dropdown.Item 
                                            active={medecinAnnonceFilter === "all"} 
                                            onClick={() => setMedecinAnnonceFilter("all")}
                                          >
                                            Toutes les catégories
                                          </Dropdown.Item>
                                          <Dropdown.Divider />
                                          {categories.map(categorie => (
                                            <Dropdown.Item 
                                              key={categorie}
                                              active={medecinAnnonceFilter === categorie}
                                              onClick={() => setMedecinAnnonceFilter(categorie)}
                                            >
                                              {categorie}
                                            </Dropdown.Item>
                                          ))}
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </div>
                                  </Col>
                                </Row>
                              </div>
                
                              {filteredMedecinAnnonces.length === 0 ? (
                                <div className="text-center py-5">
                                  <div className="mb-3">
                                    <FaSearch size={50} className="text-muted opacity-25" />
                                  </div>
                                  <h5 className="text-muted mb-3">Aucune annonce trouvée</h5>
                                  <p className="text-muted mb-4">
                                    {searchTermMedecin || medecinAnnonceFilter !== "all" 
                                      ? "Aucune annonce ne correspond à vos critères de recherche."
                                      : "Le forum des médecins est actuellement vide."}
                                  </p>
                                  <Button 
                                    variant="outline-primary" 
                                    onClick={() => {
                                      setSearchTermMedecin("");
                                      setMedecinAnnonceFilter("all");
                                    }}
                                    className="rounded-pill shadow-sm px-4 py-2"
                                  >
                                    Réinitialiser les filtres
                                  </Button>
                                </div>
                              ) : (
                                <Row xs={1} md={2} lg={3} className="g-4">
                                  {filteredMedecinAnnonces.map(annonce => (
                                    <Col key={annonce.id}>
                                      <Card className="h-100 shadow-sm hover-lift">
                                        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                                          <Badge bg="info" pill>
                                            {annonce.categorie || "Général"}
                                          </Badge>
                                          <small className="text-muted">
                                            {formatDate(annonce.createdAt)}
                                          </small>
                                        </Card.Header>
                                        <Card.Body>
                                          <Card.Title>{annonce.titre}</Card.Title>
                                          <Card.Text className="text-truncate mb-3">
                                            {annonce.contenu}
                                          </Card.Text>
                                          
                                          <div className="d-flex align-items-center mb-3">
                                            <div className="me-2">
                                              {annonce.creatorInfo?.photo ? (
                                                <img
                                                  src={annonce.creatorInfo.photo}
                                                  alt=""
                                                  className="rounded-circle"
                                                  style={{ width: "30px", height: "30px", objectFit: "cover" }}
                                                />
                                              ) : (
                                                <div
                                                  className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                  style={{ width: "30px", height: "30px" }}
                                                >
                                                  <span className="text-white small">
                                                    {annonce.creatorName?.[0] || "D"}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <small className="d-block">{annonce.creatorName}</small>
                                              <small className="text-muted">{annonce.creatorSpecialite}</small>
                                            </div>
                                          </div>
                                          
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              {annonce.fichiers?.length > 0 && (
                                                <Badge bg="light" text="dark" className="me-2">
                                                  <FaPaperclip className="me-1" />
                                                  {annonce.fichiers.length}
                                                </Badge>
                                              )}
                                              <Badge bg="light" text="dark">
                                                <FaComment className="me-1" />
                                                {annonce.reponses?.length || 0}
                                              </Badge>
                                            </div>
                                            
                                            <div className="btn-group">
                                              <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => handleViewMedecinAnnonceDetails(annonce)}
                                              >
                                                <FaEye className="me-1" /> Voir détails
                                              </Button>
                                              <Button
                                                variant="outline-success"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedMedecinAnnonce(annonce);
                                                  setShowResponseModal(true);
                                                }}
                                              >
                                                <FaComment className="me-1" /> Répondre
                                              </Button>
                                            </div>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              )}
                            </>
                          )}
                        </Card.Body>
                      </Card>
                      
                      {/* Modal pour créer une nouvelle annonce (code existant) */}
                      <Modal 
                        show={showAnnouncementModal} 
                        onHide={() => setShowAnnouncementModal(false)}
                        size="lg"
                      >
                        <Modal.Header closeButton className="bg-primary text-white">
                          <Modal.Title>
                            <i className="fas fa-bullhorn me-2"></i>
                            Nouvelle Annonce
                          </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Titre de l'annonce</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Entrez un titre clair et concis"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                              />
                            </Form.Group>
                            
                            <Row className="mb-3">
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>Priorité</Form.Label>
                                  <Form.Select
                                    value={newAnnouncement.priority}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                                  >
                                    <option value="high">Haute - Important</option>
                                    <option value="normal">Normale</option>
                                    <option value="low">Basse - Information</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group>
                                  <Form.Label>Date d'expiration (optionnel)</Form.Label>
                                  <Form.Control
                                    type="date"
                                    value={newAnnouncement.expiryDate}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, expiryDate: e.target.value})}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Destinataires</Form.Label>
                              <Form.Select
                                value={newAnnouncement.targetType}
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, targetType: e.target.value})}
                                className="mb-2"
                              >
                                <option value="all">Tous les médecins</option>
                                <option value="affiliated">Médecins affiliés uniquement</option>
                                <option value="private">Médecins privés uniquement</option>
                                <option value="non-affiliated">Médecins non-affiliés uniquement</option>
                              </Form.Select>
                              
                              <div className="mt-2 p-2 bg-light rounded border">
                                <div className="text-muted mb-1">Aperçu des destinataires :</div>
                                <div className="d-flex gap-2 flex-wrap">
                                  {newAnnouncement.targetType === "all" ? (
                                    <>
                                      <Badge bg="success" className="d-flex align-items-center">
                                        <i className="fas fa-user-check me-1"></i>
                                        Médecins affiliés ({doctorTypeStats.affiliated})
                                      </Badge>
                                      <Badge bg="warning" className="d-flex align-items-center">
                                        <i className="fas fa-user-md me-1"></i>
                                        Médecins privés ({doctorTypeStats.private})
                                      </Badge>
                                      <Badge bg="secondary" className="d-flex align-items-center">
                                        <i className="fas fa-user-slash me-1"></i>
                                        Médecins non-affiliés ({doctorTypeStats.nonAffiliated})
                                      </Badge>
                                    </>
                                  ) : newAnnouncement.targetType === "affiliated" ? (
                                    <Badge bg="success" className="d-flex align-items-center">
                                      <i className="fas fa-user-check me-1"></i>
                                      Médecins affiliés uniquement ({doctorTypeStats.affiliated})
                                    </Badge>
                                  ) : newAnnouncement.targetType === "private" ? (
                                    <Badge bg="warning" className="d-flex align-items-center">
                                      <i className="fas fa-user-md me-1"></i>
                                      Médecins privés uniquement ({doctorTypeStats.private})
                                    </Badge>
                                  ) : (
                                    <Badge bg="secondary" className="d-flex align-items-center">
                                      <i className="fas fa-user-slash me-1"></i>
                                      Médecins non-affiliés uniquement ({doctorTypeStats.nonAffiliated})
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Contenu de l'annonce</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Entrez le contenu de votre annonce..."
                                value={newAnnouncement.content}
                                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                              />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Pièces jointes (optionnel)</Form.Label>
                              <Form.Control
                                type="file"
                                multiple
                                onChange={(e) => setAttachmentFiles(Array.from(e.target.files))}
                              />
                              <Form.Text className="text-muted">
                                Vous pouvez joindre des documents (PDF, images, etc.) à votre annonce.
                              </Form.Text>
                              
                              {attachmentFiles.length > 0 && (
                                <div className="mt-2">
                                  <p className="mb-1">Fichiers sélectionnés:</p>
                                  <ListGroup variant="flush">
                                    {attachmentFiles.map((file, index) => (
                                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center py-2">
                                        <div>
                                          <i className={`far ${
                                            file.type.includes('pdf') ? 'fa-file-pdf' :
                                            file.type.includes('image') ? 'fa-file-image' :
                                            'fa-file'
                                          } me-2`}></i>
                                          {file.name}
                                          <span className="ms-2 text-muted small">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                          </span>
                                        </div>
                                        <Button
                                          variant="link"
                                          className="text-danger p-0"
                                          onClick={() => setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index))}
                                        >
                                          <i className="fas fa-times"></i>
                                        </Button>
                                      </ListGroup.Item>
                                    ))}
                                  </ListGroup>
                                </div>
                              )}
                            </Form.Group>
                          </Form>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowAnnouncementModal(false)}>
                            Annuler
                          </Button>
                          <Button 
                            variant="primary" 
                            onClick={handleCreateAnnouncement}
                            disabled={!newAnnouncement.title || !newAnnouncement.content}
                          >
                            <i className="fas fa-paper-plane me-2"></i>
                            Publier l'annonce
                          </Button>
                        </Modal.Footer>
                      </Modal>
                      
                      {/* Modal de détails de l'annonce (code existant) */}
                      <Modal 
                        show={showDetailModal} 
                        onHide={() => setShowDetailModal(false)}
                        size="lg"
                        dialogClassName="modal-90w"
                      >
                        {/* Contenu existant du modal de détails... */}
                        {/* (Garder le code existant du modal de détails des annonces) */}
                      </Modal>
                      
                      {/* Modal pour afficher les détails d'une annonce médecin */}
                      <Modal 
                        show={showMedecinAnnonceModal} 
                        onHide={() => setShowMedecinAnnonceModal(false)}
                        size="lg"
                        scrollable
                      >
                        <Modal.Header closeButton>
                          <Modal.Title>Détails de l'annonce médecin</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          {detailedMedecinAnnonce && (
                            <>
                              <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <h4>{detailedMedecinAnnonce.titre}</h4>
                                  <Badge bg="info" pill>{detailedMedecinAnnonce.categorie || "Général"}</Badge>
                                </div>
                                
                                <div className="d-flex align-items-center mb-3">
                                  <div className="me-2">
                                    {detailedMedecinAnnonce.creatorInfo?.photo ? (
                                      <img
                                        src={detailedMedecinAnnonce.creatorInfo.photo}
                                        alt=""
                                        className="rounded-circle"
                                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <div
                                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                        style={{ width: "40px", height: "40px" }}
                                      >
                                        <span className="text-white">
                                          {detailedMedecinAnnonce.creatorName?.[0] || "D"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="mb-0 fw-bold">{detailedMedecinAnnonce.creatorName}</p>
                                    <small className="text-muted">{detailedMedecinAnnonce.creatorSpecialite}</small>
                                  </div>
                                  <div className="ms-auto">
                                    <small className="text-muted">
                                      {formatDate(detailedMedecinAnnonce.createdAt)}
                                    </small>
                                  </div>
                                </div>
                                
                                <div className="mb-4 p-3 bg-light rounded">
                                  <p style={{ whiteSpace: 'pre-line' }}>{detailedMedecinAnnonce.contenu}</p>
                                </div>
                                
                                {detailedMedecinAnnonce.fichiers?.length > 0 && (
                                  <div className="mb-4">
                                    <h6>Fichiers joints:</h6>
                                    <div className="d-flex flex-wrap gap-3">
                                      {detailedMedecinAnnonce.fichiers.map((file, index) => (
                                        <Card key={index} style={{ width: '150px' }}>
                                          {file.type?.includes('image') ? (
                                            <Card.Img 
                                              variant="top" 
                                              src={file.url} 
                                              style={{ height: '100px', objectFit: 'cover' }}
                                              onClick={() => window.open(file.url, '_blank')}
                                              className="cursor-pointer"
                                            />
                                          ) : (
                                            <div 
                                              className="bg-light d-flex align-items-center justify-content-center"
                                              style={{ height: '100px' }}
                                              onClick={() => window.open(file.url, '_blank')}
                                              role="button"
                                            >
                                              <FaFile size={40} className="text-secondary" />
                                            </div>
                                          )}
                                          <Card.Body className="p-2">
                                            <small className="d-block text-truncate mb-1">{file.name}</small>
                                            <Button 
                                              variant="link" 
                                              size="sm" 
                                              className="p-0"
                                              onClick={() => window.open(file.url, '_blank')}
                                            >
                                              Télécharger
                                            </Button>
                                          </Card.Body>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <hr />
                              
                              <div className="mt-4">
                                <h5 className="mb-3">
                                  Réponses 
                                  <Badge bg="secondary" pill className="ms-2">
                                    {detailedMedecinAnnonce.reponses?.length || 0}
                                  </Badge>
                                </h5>
                                
                                {(!detailedMedecinAnnonce.reponses || detailedMedecinAnnonce.reponses.length === 0) ? (
                                  <div className="text-center py-4">
                                    <p className="text-muted">Aucune réponse pour le moment</p>
                                    <Button 
                                      variant="outline-primary"
                                      onClick={() => {
                                        setSelectedMedecinAnnonce(detailedMedecinAnnonce);
                                        setShowMedecinAnnonceModal(false);
                                        setShowResponseModal(true);
                                      }}
                                    >
                                      <FaComment className="me-2" />
                                      Soyez le premier à répondre
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    {detailedMedecinAnnonce.reponses.map((reponse, index) => (
                                      <Card key={index} className={`mb-3 ${reponse.isStructure ? 'border-primary' : ''}`}>
                                        <Card.Body className={reponse.isStructure ? 'bg-light' : ''}>
                                          <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center">
                                              <div
                                                className={`rounded-circle me-2 d-flex align-items-center justify-content-center ${reponse.isStructure ? 'bg-primary text-white' : 'bg-light text-primary'}`}
                                                style={{ width: "35px", height: "35px" }}
                                              >
                                                <span>
                                                  {reponse.isStructure ? 'S' : reponse.creatorName?.[0] || "D"}
                                                </span>
                                              </div>
                                              <div>
                                                <p className="mb-0 fw-bold">{reponse.creatorName}</p>
                                                <small className="text-muted">
                                                  {reponse.isStructure ? 'Structure médicale' : reponse.creatorSpecialite}
                                                  {reponse.isStructure && (
                                                    <Badge bg="primary" className="ms-2" pill>
                                                      Administrateur
                                                    </Badge>
                                                  )}
                                                </small>
                                              </div>
                                            </div>
                                            <small className="text-muted">
                                              {formatDate(reponse.createdAt)}
                                            </small>
                                          </div>
                                          
                                          <p style={{ whiteSpace: 'pre-line' }}>{reponse.contenu}</p>
                                          
                                          {reponse.fichiers?.length > 0 && (
                                            <div className="mt-3">
                                              <h6>Fichiers joints:</h6>
                                              <div className="d-flex flex-wrap gap-2">
                                                {reponse.fichiers.map((file, fileIndex) => (
                                                  <Button
                                                    key={fileIndex}
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="d-flex align-items-center"
                                                    onClick={() => window.open(file.url, '_blank')}
                                                  >
                                                    <FaPaperclip className="me-2" />
                                                    {file.name}
                                                  </Button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {reponse.isStructure && reponse.createdBy === structure.id && (
                                            <div className="mt-3 text-end">
                                              <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={async () => {
                                                  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réponse ?")) {
                                                    try {
                                                      setIsLoading(true);
                                                      // Supprimer les fichiers de la réponse
                                                      if (reponse.fichiers?.length > 0) {
                                                        await Promise.all(
                                                          reponse.fichiers.map(async (file) => {
                                                            if (file.path) {
                                                              const fileRef = ref(storage, file.path);
                                                              await deleteObject(fileRef);
                                                            }
                                                          })
                                                        );
                                                      }
                                                      
                                                      // Mettre à jour l'annonce en supprimant la réponse
                                                      const annonceRef = doc(db, "annonces_medecins", detailedMedecinAnnonce.id);
                                                      await updateDoc(annonceRef, {
                                                        reponses: detailedMedecinAnnonce.reponses.filter((_, i) => i !== index)
                                                      });
                                                      
                                                      // Mettre à jour l'état local
                                                      const updatedAnnonce = {...detailedMedecinAnnonce};
                                                      updatedAnnonce.reponses = updatedAnnonce.reponses.filter((_, i) => i !== index);
                                                      setDetailedMedecinAnnonce(updatedAnnonce);
                                                      
                                                      setMessage("Réponse supprimée avec succès");
                                                    } catch (error) {
                                                      console.error("Erreur lors de la suppression de la réponse:", error);
                                                      setMessage("Erreur lors de la suppression de la réponse");
                                                    } finally {
                                                      setIsLoading(false);
                                                    }
                                                  }
                                                }}
                                              >
                                                <FaTrash className="me-1" /> Supprimer
                                              </Button>
                                            </div>
                                          )}
                                        </Card.Body>
                                      </Card>
                                    ))}
                                    
                                    <div className="mt-4">
                                      <Button
                                        variant="primary"
                                        onClick={() => {
                                          setSelectedMedecinAnnonce(detailedMedecinAnnonce);
                                          setShowMedecinAnnonceModal(false);
                                          setShowResponseModal(true);
                                        }}
                                      >
                                        <FaComment className="me-2" />
                                        Répondre à cette annonce
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowMedecinAnnonceModal(false)}>
                            Fermer
                          </Button>
                        </Modal.Footer>
                      </Modal>
                      
                      {/* Modal pour répondre à une annonce médecin */}
                      <Modal 
                        show={showResponseModal} 
                        onHide={() => setShowResponseModal(false)}
                      >
                        <Modal.Header closeButton>
                          <Modal.Title>Répondre à l'annonce</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          {selectedMedecinAnnonce && (
                            <>
                              <div className="mb-3">
                                <h5>{selectedMedecinAnnonce.titre}</h5>
                                <p className="text-muted">
                                  Publié par {selectedMedecinAnnonce.creatorName} • {formatDate(selectedMedecinAnnonce.createdAt)}
                                </p>
                              </div>
                              
                              <Form>
                                <Form.Group className="mb-3">
                                  <Form.Label>Votre réponse</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={reponseAnnonceMedecin}
                                    onChange={(e) => setReponseAnnonceMedecin(e.target.value)}
                                    placeholder="Rédigez votre réponse ici..."
                                    required
                                  />
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                  <Form.Label>Fichiers (facultatif)</Form.Label>
                                  <Form.Control
                                    type="file"
                                    multiple
                                    onChange={(e) => setReponseFiles(Array.from(e.target.files))}
                                  />
                                </Form.Group>
                                
                                {reponseFiles.length > 0 && (
                                  <div className="mb-3">
                                    <p>Fichiers sélectionnés:</p>
                                    <ListGroup>
                                      {Array.from(reponseFiles).map((file, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                          <div>
                                            <FaPaperclip className="me-2" />
                                            {file.name}
                                          </div>
                                          <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => {
                                              const newFiles = [...reponseFiles];
                                              newFiles.splice(index, 1);
                                              setReponseFiles(newFiles);
                                            }}
                                          >
                                            <FaTrash />
                                          </Button>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  </div>
                                )}
                              </Form>
                            </>
                          )}
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
                            Annuler
                          </Button>
                          <Button 
                            variant="primary" 
                            onClick={handleRepondreAnnonceMedecin}
                            disabled={isLoading || !reponseAnnonceMedecin.trim()}
                          >
                            {isLoading ? "Publication en cours..." : "Publier la réponse"}
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </>
                  );
                };
                
                export default AnnouncementSystem;
                
