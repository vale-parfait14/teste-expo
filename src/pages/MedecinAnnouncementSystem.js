import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Modal,
  Form,
  ListGroup,
  Tabs,
  Tab,
  Alert,
  Spinner,
  InputGroup
} from "react-bootstrap";
import { db, storage } from "../components/firebase-config.js";

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  FaBullhorn,
  FaCalendarAlt,
  FaComment,
  FaDownload,
  FaEye,
  FaFilter,
  FaHospital,
  FaPaperPlane,
  FaPaperclip,
  FaRegThumbsUp,
  FaReply,
  FaStar,
  FaStarHalfAlt,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaCheck
} from "react-icons/fa";

const MedecinAnnouncementSystem = ({ doctorInfo }) => {
  // États pour les annonces
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'important'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("announcements");
  
  // Référence pour faire défiler jusqu'aux nouvelles annonces
  const newAnnouncementRef = useRef(null);

  // Charger les annonces depuis Firestore
  useEffect(() => {
    if (!doctorInfo?.id) return;
    
    setLoading(true);
    
    // Créer une requête pour récupérer les annonces destinées à ce médecin
    const fetchAnnouncements = async () => {
      try {
        // Récupérer toutes les annonces (nous filtrerons côté client)
        const announcementsRef = collection(db, "structureAnnouncements");
        
        // Écouter les changements en temps réel
        const unsubscribe = onSnapshot(
          announcementsRef,
          async (snapshot) => {
            const announcementsData = [];
            
            // Pour chaque annonce, vérifier si elle est destinée à ce médecin
            for (const docSnapshot of snapshot.docs) {
              const announcementData = {
                id: docSnapshot.id,
                ...docSnapshot.data(),
                createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
                expiryDate: docSnapshot.data().expiryDate?.toDate() || null
              };
              
              // Déterminer si cette annonce est destinée à ce médecin
              const isTargeted = await isAnnouncementTargetingDoctor(announcementData, doctorInfo);
              
              if (isTargeted) {
                // Vérifier si le médecin a déjà vu cette annonce
                const viewsRef = collection(db, "announcementViews");
                const q = query(
                  viewsRef,
                  where("announcementId", "==", announcementData.id),
                  where("doctorId", "==", doctorInfo.id)
                );
                const viewSnapshot = await getDocs(q);
                
                // Marquer comme lue ou non
                announcementData.isRead = !viewSnapshot.empty;
                
                // Récupérer les réponses pour cette annonce
                const repliesRef = collection(db, "announcementReplies");
                const repliesQuery = query(
                  repliesRef,
                  where("announcementId", "==", announcementData.id),
                  orderBy("timestamp", "desc")
                );
                const repliesSnapshot = await getDocs(repliesQuery);
                
                // Ajouter les réponses à l'annonce
                announcementData.replies = repliesSnapshot.docs.map(replyDoc => ({
                  id: replyDoc.id,
                  ...replyDoc.data(),
                  timestamp: replyDoc.data().timestamp?.toDate() || new Date()
                }));
                
                // Vérifier si le médecin a déjà répondu
                announcementData.hasReplied = announcementData.replies.some(
                  reply => reply.doctorId === doctorInfo.id
                );
                
                // Vérifier si le médecin a déjà réagi
                announcementData.hasReacted = false; // À implémenter si nécessaire
                
                // Ajouter à la liste des annonces
                announcementsData.push(announcementData);
              }
            }
            
            // Trier par date de création (plus récente en premier)
            announcementsData.sort((a, b) => b.createdAt - a.createdAt);
            
            // Mettre à jour l'état
            setAnnouncements(announcementsData);
            
            // Compter les annonces non lues
            const unreadAnnouncements = announcementsData.filter(a => !a.isRead);
            setUnreadCount(unreadAnnouncements.length);
            
            setLoading(false);
          },
          (error) => {
            console.error("Erreur lors du chargement des annonces:", error);
            setError("Impossible de charger les annonces. Veuillez réessayer plus tard.");
            setLoading(false);
          }
        );
        
        // Nettoyer l'abonnement lors du démontage
        return () => unsubscribe();
      } catch (error) {
        console.error("Erreur lors du chargement des annonces:", error);
        setError("Impossible de charger les annonces. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [doctorInfo?.id]);
  
  // Fonction pour déterminer si une annonce cible ce médecin
  const isAnnouncementTargetingDoctor = async (announcement, doctor) => {
    // Si l'annonce est expirée, ne pas l'afficher
    if (announcement.expiryDate && announcement.expiryDate < new Date()) {
      return false;
    }
    
    switch (announcement.targetType) {
      case "all":
        // Toutes les annonces pour tous les médecins
        return true;
      
      case "affiliated":
        // Seulement pour les médecins affiliés à la structure
        // Vérifier si le médecin est affilié à cette structure
        if (doctor.visibility === "affiliated") {
          // Vérifier si le médecin est affilié à cette structure spécifique
          const associationRef = collection(db, "associationRequests");
          const q = query(
            associationRef,
            where("doctorId", "==", doctor.id),
            where("structureId", "==", announcement.structureId),
            where("status", "==", "accepted")
          );
          const snapshot = await getDocs(q);
          return !snapshot.empty;
        }
        return false;
      
      case "private":
        // Seulement pour les médecins privés
        return doctor.visibility !== "affiliated";
      
      case "selected":
        // Seulement pour les médecins spécifiquement sélectionnés
        return announcement.targetDoctors?.includes(doctor.id) || false;
      
      default:
        return false;
    }
  };

  // Filtrer les annonces selon le filtre actif
  const filteredAnnouncements = announcements.filter(announcement => {
    switch (filter) {
      case "unread":
        return !announcement.isRead;
      case "important":
        return announcement.priority === "high";
      default:
        return true;
    }
  });

  // Fonction pour marquer une annonce comme lue
  const markAnnouncementAsRead = async (announcementId) => {
    try {
      // Vérifier si l'annonce est déjà marquée comme lue
      const viewsRef = collection(db, "announcementViews");
      const q = query(
        viewsRef,
        where("announcementId", "==", announcementId),
        where("doctorId", "==", doctorInfo.id)
      );
      const viewSnapshot = await getDocs(q);
      
      if (viewSnapshot.empty) {
        // Ajouter une entrée dans la collection des vues
        await addDoc(viewsRef, {
          announcementId,
          doctorId: doctorInfo.id,
          doctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
          doctorSpeciality: doctorInfo.specialite,
          timestamp: serverTimestamp(),
          visibility: doctorInfo.visibility || "private"
        });
        
        // Mettre à jour le compteur de vues dans l'annonce
        const announcementRef = doc(db, "structureAnnouncements", announcementId);
        await updateDoc(announcementRef, {
          "stats.views": increment(1)
        });
        
        // Mettre à jour l'état local
        setAnnouncements(prevAnnouncements => 
          prevAnnouncements.map(announcement => 
            announcement.id === announcementId 
              ? { ...announcement, isRead: true } 
              : announcement
          )
        );
        
        // Mettre à jour le compteur d'annonces non lues
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error("Erreur lors du marquage de l'annonce comme lue:", error);
    }
  };

  // Fonction pour afficher les détails d'une annonce
  const handleViewAnnouncementDetails = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);
    
    // Marquer comme lue si ce n'est pas déjà fait
    if (!announcement.isRead) {
      await markAnnouncementAsRead(announcement.id);
    }
  };

  // Fonction pour réagir à une annonce (like, important, etc.)
  const handleReactToAnnouncement = async (announcementId, reactionType) => {
    try {
      // Mettre à jour les réactions dans l'annonce
      const announcementRef = doc(db, "structureAnnouncements", announcementId);
      
      // Ajouter la réaction
      await updateDoc(announcementRef, {
        [`stats.reactions.${reactionType}`]: increment(1)
      });
      
      // Enregistrer que ce médecin a réagi
      const reactionsRef = collection(db, "announcementReactions");
      await addDoc(reactionsRef, {
        announcementId,
        doctorId: doctorInfo.id,
        doctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        reactionType,
        timestamp: serverTimestamp()
      });
      
      // Mettre à jour l'état local
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => 
          announcement.id === announcementId 
            ? { 
                ...announcement, 
                hasReacted: true,
                stats: {
                  ...announcement.stats,
                  reactions: {
                    ...announcement.stats.reactions,
                    [reactionType]: (announcement.stats.reactions[reactionType] || 0) + 1
                  }
                }
              } 
            : announcement
        )
      );
    } catch (error) {
      console.error("Erreur lors de la réaction à l'annonce:", error);
    }
  };

  // Fonction pour envoyer une réponse à une annonce
  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() && replyFiles.length === 0) {
      return;
    }
    
    try {
      setSendingReply(true);
      
      // Télécharger les fichiers joints s'il y en a
      const uploadedFiles = [];
      
      if (replyFiles.length > 0) {
        for (const file of replyFiles) {
          const fileRef = ref(storage, `announcementReplies/${selectedAnnouncement.id}/${doctorInfo.id}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          
          uploadedFiles.push({
            name: file.name,
            url,
            type: file.type,
            size: file.size
          });
        }
      }
      
      // Créer la réponse dans Firestore
      const replyData = {
        announcementId: selectedAnnouncement.id,
        structureId: selectedAnnouncement.structureId,
        doctorId: doctorInfo.id,
        doctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        doctorSpeciality: doctorInfo.specialite,
        doctorType: doctorInfo.visibility || "private",
        content: replyContent,
        files: uploadedFiles,
        isFromStructure: false,
        timestamp: serverTimestamp(),
        readByStructure: false
      };
      
      const replyRef = await addDoc(collection(db, "announcementReplies"), replyData);
      
      // Mettre à jour le compteur de réponses dans l'annonce
      const announcementRef = doc(db, "structureAnnouncements", selectedAnnouncement.id);
      await updateDoc(announcementRef, {
        "stats.replies": increment(1)
      });
      
      // Créer une notification pour la structure
      await addDoc(collection(db, "notifications"), {
        userId: selectedAnnouncement.structureId,
        type: "announcement_reply",
        title: "Nouvelle réponse à une annonce",
        message: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom} a répondu à votre annonce: ${selectedAnnouncement.title}`,
        doctorId: doctorInfo.id,
        doctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        announcementId: selectedAnnouncement.id,
        announcementTitle: selectedAnnouncement.title,
        replyId: replyRef.id,
        read: false,
        createdAt: serverTimestamp()
      });
      
      // Mettre à jour l'état local
      const newReply = {
        id: replyRef.id,
        ...replyData,
        timestamp: new Date()
      };
      
      setSelectedAnnouncement(prev => ({
        ...prev,
        replies: [newReply, ...prev.replies],
        hasReplied: true
      }));
      
      // Réinitialiser le formulaire
      setReplyContent("");
      setReplyFiles([]);
      setSendingReply(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      setSendingReply(false);
    }
  };

  // Fonction pour télécharger une pièce jointe
  const handleDownloadAttachment = (attachment) => {
    window.open(attachment.url, "_blank");
  };

  // Rendu du composant
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FaBullhorn className="me-2" />
          Annonces des structures
          {unreadCount > 0 && (
            <Badge bg="danger" pill className="ms-2">
              {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </h5>
        <div className="d-flex gap-2">
          <Button
            variant="light"
            size="sm"
            className="d-flex align-items-center"
            onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
          >
            <FaFilter className="me-1" />
            {filter === "unread" ? "Toutes" : "Non lues"}
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-0 nav-fill"
        >
          <Tab 
            eventKey="announcements" 
            title={
              <span className="d-flex align-items-center">
                <FaBullhorn className="me-2" />
                Annonces
                {unreadCount > 0 && (
                  <Badge bg="danger" pill className="ms-2">
                    {unreadCount}
                  </Badge>
                )}
              </span>
            }
          >
            <div className="p-3">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des annonces...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="text-center py-5">
                  <FaBullhorn size={40} className="text-muted mb-3" />
                  <h5>Aucune annonce {filter === "unread" ? "non lue" : ""} disponible</h5>
                  <p className="text-muted">
                    {filter === "unread" 
                      ? "Vous avez lu toutes les annonces." 
                      : "Vous n'avez pas encore reçu d'annonces."}
                  </p>
                  {filter !== "all" && (
                    <Button variant="outline-primary" onClick={() => setFilter("all")}>
                      Afficher toutes les annonces
                    </Button>
                  )}
                </div>
              ) : (
                <div className="announcement-list">
                  {filteredAnnouncements.map((announcement, index) => {
                    const isNew = !announcement.isRead;
                    const isExpired = announcement.expiryDate && announcement.expiryDate < new Date();
                    const priorityClass = 
                      announcement.priority === "high" ? "border-danger" :
                      announcement.priority === "low" ? "border-info" :
                      "border-warning";
                    
                    return (
                      <div
                        key={announcement.id}
                        ref={isNew && index === 0 ? newAnnouncementRef : null}
                        className={`announcement-item mb-3 border rounded ${priorityClass} ${isNew ? 'bg-light' : ''}`}
                        style={{ borderLeftWidth: "4px" }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                {announcement.priority === "high" && (
                                  <Badge bg="danger" className="me-1">Important</Badge>
                                )}
                                <h5 className="mb-0">{announcement.title}</h5>
                                {isNew && (
                                  <Badge bg="danger" pill>Nouveau</Badge>
                                )}
                              </div>
                              <div className="text-muted small mt-1">
                                <FaHospital className="me-1" />
                                {announcement.structureName}
                                <span className="mx-2">•</span>
                                <FaCalendarAlt className="me-1" />
                                {announcement.createdAt.toLocaleDateString('fr-FR')}
                                {isExpired && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <Badge bg="secondary" className="opacity-75">Expirée</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="d-flex gap-2">
                              {announcement.hasReplied && (
                                <Badge bg="info" className="d-flex align-items-center">
                                  <FaReply className="me-1" /> Répondu
                                </Badge>
                              )}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewAnnouncementDetails(announcement)}
                              >
                                <FaEye className="me-1" /> Voir
                              </Button>
                            </div>
                          </div>
                          <div className="announcement-preview">
                            {announcement.content.length > 150 
                              ? `${announcement.content.substring(0, 150)}...` 
                              : announcement.content}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="d-flex gap-2">
                              {announcement.attachments?.length > 0 && (
                                <Badge bg="light" text="dark" className="d-flex align-items-center">
                                  <FaPaperclip className="me-1" />
                                  {announcement.attachments.length} fichier{announcement.attachments.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                              <Badge bg="light" text="dark" className="d-flex align-items-center">
                                <FaComment className="me-1" />
                                {announcement.stats?.replies || 0} réponse{(announcement.stats?.replies || 0) > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div>
                              {!announcement.hasReacted && !isExpired && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleReactToAnnouncement(announcement.id, "like")}
                                >
                                  <FaRegThumbsUp className="me-1" /> Utile
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Tab>
          <Tab 
            eventKey="important" 
            title={
              <span className="d-flex align-items-center">
                <FaStar className="me-2" />
                Importantes
              </span>
            }
          >
            <div className="p-3">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Chargement des annonces...</p>
                </div>
              ) : (
                <div className="announcement-list">
                  {announcements
                    .filter(a => a.priority === "high")
                    .map((announcement) => (
                      <div
                        key={announcement.id}
                        className="announcement-item mb-3 border rounded border-danger"
                        style={{ borderLeftWidth: "4px" }}
                      >
                        <div className="p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="danger" className="me-1">Important</Badge>
                                <h5 className="mb-0">{announcement.title}</h5>
                                {!announcement.isRead && (
                                  <Badge bg="danger" pill>Nouveau</Badge>
                                )}
                              </div>
                              <div className="text-muted small mt-1">
                                <FaHospital className="me-1" />
                                {announcement.structureName}
                                <span className="mx-2">•</span>
                                <FaCalendarAlt className="me-1" />
                                {announcement.createdAt.toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewAnnouncementDetails(announcement)}
                            >
                              <FaEye className="me-1" /> Voir
                            </Button>
                          </div>
                          <div className="announcement-preview">
                            {announcement.content.length > 150 
                              ? `${announcement.content.substring(0, 150)}...` 
                              : announcement.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {announcements.filter(a => a.priority === "high").length === 0 && (
                    <div className="text-center py-5">
                      <FaStar size={40} className="text-muted mb-3" />
                      <h5>Aucune annonce importante</h5>
                      <p className="text-muted">
                        Vous n'avez pas d'annonces marquées comme importantes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </Card.Body>

      {/* Modal de détail d'annonce */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
        dialogClassName="modal-90w"
      >
        {selectedAnnouncement && (
          <>
            <Modal.Header 
              closeButton 
              className={`
                ${selectedAnnouncement.priority === "high" ? "bg-danger" :
                  selectedAnnouncement.priority === "low" ? "bg-info" : "bg-warning"}
                text-white
              `}
            >
              <Modal.Title>
                <FaBullhorn className="me-2" />
                {selectedAnnouncement.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="announcement-header mb-4">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge bg="secondary" className="d-flex align-items-center gap-1">
                    <FaCalendarAlt />
                    <span className="ms-1">
                      Publiée le {selectedAnnouncement.createdAt.toLocaleDateString('fr-FR')}
                    </span>
                  </Badge>
                  
                  {selectedAnnouncement.expiryDate && (
                    <Badge 
                      bg={
                        selectedAnnouncement.expiryDate < new Date() ? "danger" : "info"
                      } 
                      className="d-flex align-items-center gap-1"
                    >
                      <FaClock />
                      <span className="ms-1">
                        {selectedAnnouncement.expiryDate < new Date()
                          ? `Expirée depuis le ${selectedAnnouncement.expiryDate.toLocaleDateString('fr-FR')}`
                          : `Expire le ${selectedAnnouncement.expiryDate.toLocaleDateString('fr-FR')}`
                        }
                      </span>
                    </Badge>
                  )}
                  
                  <Badge 
                    bg={
                      selectedAnnouncement.priority === "high" ? "danger" :
                      selectedAnnouncement.priority === "low" ? "info" : "warning"
                    } 
                    className="d-flex align-items-center gap-1"
                  >
                    {selectedAnnouncement.priority === "high" ? (
                      <>
                        <FaExclamationTriangle />
                        <span className="ms-1">Priorité haute</span>
                      </>
                    ) : selectedAnnouncement.priority === "low" ? (
                      <>
                        <FaInfoCircle />
                        <span className="ms-1">Priorité basse</span>
                      </>
                    ) : (
                      <>
                        <FaInfoCircle />
                        <span className="ms-1">Priorité normale</span>
                      </>
                    )}
                  </Badge>
                  
                  <Badge bg="primary" className="d-flex align-items-center gap-1">
                    <FaHospital />
                    <span className="ms-1">{selectedAnnouncement.structureName}</span>
                  </Badge>
                </div>
                
                <div className="announcement-content p-3 bg-light rounded mb-3">
                  <div className="content-text mb-3">
                    {selectedAnnouncement.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-1">{line}</p>
                    ))}
                  </div>
                  
                  {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                    <div className="attachments-section mb-3">
                      <h6 className="mb-2">
                        <FaPaperclip className="me-2" />
                        Pièces jointes ({selectedAnnouncement.attachments.length})
                      </h6>
                                            <div className="d-flex flex-wrap gap-2">
                        {selectedAnnouncement.attachments.map((attachment, idx) => (
                          <Button
                            key={idx}
                            variant="outline-secondary"
                            size="sm"
                            className="d-flex align-items-center"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <i className={`me-2 ${
                              attachment.type?.includes('pdf') ? 'far fa-file-pdf text-danger' :
                              attachment.type?.includes('image') ? 'far fa-file-image text-info' :
                              attachment.type?.includes('word') ? 'far fa-file-word text-primary' :
                              attachment.type?.includes('excel') ? 'far fa-file-excel text-success' :
                              'far fa-file text-secondary'
                            }`}></i>
                            <span>{attachment.name}</span>
                            <FaDownload className="ms-2" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Tabs defaultActiveKey="replies" className="mb-3">
                <Tab 
                  eventKey="replies" 
                  title={
                    <span><FaComment className="me-2" />Discussions</span>
                  }
                >
                  <div className="replies-container">
                    {selectedAnnouncement.replies?.length > 0 ? (
                      <div className="replies-list">
                        {selectedAnnouncement.replies.map((reply, idx) => (
                          <div 
                            key={idx} 
                            className={`reply-item p-3 mb-3 rounded ${
                              reply.isFromStructure ? 'border-primary bg-light' : 'border'
                            }`}
                          >
                            <div className="reply-header d-flex justify-content-between mb-2">
                              <div className="reply-sender">
                                <strong>{reply.senderName || reply.doctorName}</strong>
                                <Badge 
                                  bg={reply.isFromStructure ? "primary" : "info"} 
                                  className="ms-2"
                                >
                                  {reply.isFromStructure ? "Administration" : "Médecin"}
                                </Badge>
                                {!reply.isFromStructure && reply.doctorType && (
                                  <Badge 
                                    bg={reply.doctorType === "affiliated" ? "success" : "secondary"} 
                                    className="ms-2"
                                  >
                                    {reply.doctorType === "affiliated" ? "Affilié" : "Privé"}
                                  </Badge>
                                )}
                              </div>
                              <div className="reply-time text-muted">
                                {new Date(reply.timestamp).toLocaleString('fr-FR')}
                              </div>
                            </div>
                            <div className="reply-content">
                              {reply.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-1">{line}</p>
                              ))}
                            </div>
                            
                            {reply.files && reply.files.length > 0 && (
                              <div className="reply-files mt-2">
                                <div className="d-flex flex-wrap gap-2">
                                  {reply.files.map((file, fileIdx) => (
                                    <Button
                                      key={fileIdx}
                                      variant="outline-secondary"
                                      size="sm"
                                      className="d-flex align-items-center"
                                      onClick={() => window.open(file.url, "_blank")}
                                    >
                                      <i className={`me-2 ${
                                        file.type?.includes('pdf') ? 'far fa-file-pdf text-danger' :
                                        file.type?.includes('image') ? 'far fa-file-image text-info' :
                                        file.type?.includes('word') ? 'far fa-file-word text-primary' :
                                        file.type?.includes('excel') ? 'far fa-file-excel text-success' :
                                        'far fa-file text-secondary'
                                      }`}></i>
                                      <span>{file.name}</span>
                                      <FaDownload className="ms-2" />
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-light rounded">
                        <i className="far fa-comment-dots fa-3x text-muted mb-3"></i>
                        <h6 className="text-muted">Aucune réponse pour le moment</h6>
                        <p className="text-muted">Soyez le premier à répondre à cette annonce.</p>
                      </div>
                    )}
                    
                    {!selectedAnnouncement.expiryDate || selectedAnnouncement.expiryDate > new Date() ? (
                      <div className="reply-form mt-4">
                        <h6 className="mb-2">Répondre à l'annonce</h6>
                        <Form onSubmit={handleSendReply}>
                          <Form.Group className="mb-2">
                            <Form.Control 
                              as="textarea" 
                              rows={3} 
                              placeholder="Votre réponse..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              disabled={sendingReply}
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Joindre des fichiers (optionnel)</Form.Label>
                            <Form.Control
                              type="file"
                              multiple
                              onChange={(e) => setReplyFiles(Array.from(e.target.files))}
                              disabled={sendingReply}
                            />
                          </Form.Group>
                          
                          {replyFiles.length > 0 && (
                            <div className="selected-files mb-3">
                              <small className="text-muted">Fichiers sélectionnés:</small>
                              <ListGroup variant="flush">
                                {replyFiles.map((file, index) => (
                                  <ListGroup.Item key={index} className="py-1 px-0 d-flex justify-content-between align-items-center border-0">
                                    <div className="d-flex align-items-center">
                                      <i className={`me-2 ${
                                        file.type.includes('pdf') ? 'far fa-file-pdf text-danger' :
                                        file.type.includes('image') ? 'far fa-file-image text-info' :
                                        file.type.includes('word') ? 'far fa-file-word text-primary' :
                                        file.type.includes('excel') ? 'far fa-file-excel text-success' :
                                        'far fa-file text-secondary'
                                      }`}></i>
                                      <span>{file.name}</span>
                                      <span className="text-muted ms-2">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <Button
                                      variant="link"
                                      className="text-danger p-0"
                                      onClick={() => setReplyFiles(replyFiles.filter((_, i) => i !== index))}
                                      disabled={sendingReply}
                                    >
                                      <FaTimes />
                                    </Button>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-end">
                            <Button 
                              type="submit" 
                              variant="primary"
                              disabled={(!replyContent.trim() && replyFiles.length === 0) || sendingReply}
                            >
                              {sendingReply ? (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                  />
                                  Envoi en cours...
                                </>
                              ) : (
                                <>
                                  <FaPaperPlane className="me-2" />
                                  Envoyer la réponse
                                </>
                              )}
                            </Button>
                          </div>
                        </Form>
                      </div>
                    ) : (
                      <Alert variant="warning" className="mt-3">
                        <FaExclamationTriangle className="me-2" />
                        Cette annonce a expiré. Il n'est plus possible d'y répondre.
                      </Alert>
                    )}
                  </div>
                </Tab>
                
                <Tab 
                  eventKey="info" 
                  title={
                    <span><FaInfoCircle className="me-2" />Informations</span>
                  }
                >
                  <div className="info-container p-3 bg-light rounded">
                    <h6 className="mb-3">Détails de l'annonce</h6>
                    
                    <Row className="mb-4">
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Structure émettrice:</strong>
                          <div className="mt-1">
                            <Badge bg="primary" className="d-flex align-items-center w-auto">
                              <FaHospital className="me-2" />
                              {selectedAnnouncement.structureName}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <strong>Date de publication:</strong>
                          <div className="mt-1">
                            {selectedAnnouncement.createdAt.toLocaleDateString('fr-FR')} à {selectedAnnouncement.createdAt.toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                        
                        {selectedAnnouncement.expiryDate && (
                          <div className="mb-3">
                            <strong>Date d'expiration:</strong>
                            <div className="mt-1">
                              <Badge 
                                bg={selectedAnnouncement.expiryDate < new Date() ? "danger" : "info"}
                                className="d-flex align-items-center w-auto"
                              >
                                <FaClock className="me-2" />
                                {selectedAnnouncement.expiryDate.toLocaleDateString('fr-FR')}
                                {selectedAnnouncement.expiryDate < new Date() ? " (Expirée)" : ""}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </Col>
                      
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Priorité:</strong>
                          <div className="mt-1">
                            <Badge 
                              bg={
                                selectedAnnouncement.priority === "high" ? "danger" :
                                selectedAnnouncement.priority === "low" ? "info" : "warning"
                              }
                              className="d-flex align-items-center w-auto"
                            >
                              {selectedAnnouncement.priority === "high" ? (
                                <>
                                  <FaExclamationTriangle className="me-2" />
                                  Haute
                                </>
                              ) : selectedAnnouncement.priority === "low" ? (
                                <>
                                  <FaInfoCircle className="me-2" />
                                  Basse
                                </>
                              ) : (
                                <>
                                  <FaInfoCircle className="me-2" />
                                  Normale
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <strong>Destinataires:</strong>
                          <div className="mt-1">
                            <Badge bg="secondary" className="d-flex align-items-center w-auto">
                              {selectedAnnouncement.targetType === "all" ? (
                                <>
                                  <i className="fas fa-users me-2"></i>
                                  Tous les médecins
                                </>
                              ) : selectedAnnouncement.targetType === "affiliated" ? (
                                <>
                                  <i className="fas fa-user-check me-2"></i>
                                  Médecins affiliés uniquement
                                </>
                              ) : selectedAnnouncement.targetType === "private" ? (
                                <>
                                  <i className="fas fa-user-md me-2"></i>
                                  Médecins privés uniquement
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-user-tag me-2"></i>
                                  Médecins sélectionnés
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <strong>Statut:</strong>
                          <div className="mt-1">
                            <Badge 
                              bg={selectedAnnouncement.isRead ? "success" : "warning"}
                              className="d-flex align-items-center w-auto"
                            >
                              {selectedAnnouncement.isRead ? (
                                <>
                                  <FaCheck className="me-2" />
                                  Lue le {new Date().toLocaleDateString('fr-FR')}
                                </>
                              ) : (
                                <>
                                  <FaEye className="me-2" />
                                  Nouvelle
                                </>
                              )}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    <div className="statistics mb-3">
                      <h6 className="mb-2">Statistiques</h6>
                      <Row>
                        <Col md={4}>
                          <div className="stat-card text-center p-3 bg-white rounded shadow-sm">
                            <h3 className="text-primary mb-0">{selectedAnnouncement.stats?.views || 0}</h3>
                            <span className="text-muted">Vues</span>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="stat-card text-center p-3 bg-white rounded shadow-sm">
                            <h3 className="text-info mb-0">{selectedAnnouncement.stats?.replies || 0}</h3>
                            <span className="text-muted">Réponses</span>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="stat-card text-center p-3 bg-white rounded shadow-sm">
                            <h3 className="text-success mb-0">
                              {(selectedAnnouncement.stats?.reactions?.like || 0) + 
                               (selectedAnnouncement.stats?.reactions?.important || 0)}
                            </h3>
                            <span className="text-muted">Réactions</span>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    
                    {!selectedAnnouncement.hasReacted && (
                      <div className="reactions mt-4">
                        <h6 className="mb-2">Réagir à cette annonce</h6>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            onClick={() => handleReactToAnnouncement(selectedAnnouncement.id, "like")}
                          >
                            <FaRegThumbsUp className="me-2" />
                            Utile
                          </Button>
                          <Button
                            variant="outline-warning"
                            onClick={() => handleReactToAnnouncement(selectedAnnouncement.id, "important")}
                          >
                            <FaStar className="me-2" />
                            Important
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Fermer
              </Button>
              {!selectedAnnouncement.hasReacted && !selectedAnnouncement.expiryDate && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setActiveTab("replies");
                    document.querySelector('textarea').focus();
                  }}
                >
                  <FaReply className="me-2" />
                  Répondre
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>

    </Card>
  );
};

export default MedecinAnnouncementSystem;

