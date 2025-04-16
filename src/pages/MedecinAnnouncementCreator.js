import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Modal,
  Alert,
  ListGroup,
  Dropdown
} from "react-bootstrap";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db, storage } from "../components/firebase-config.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import {
  FaPlus,
  FaComment,
  FaTrash,
  FaEdit,
  FaPaperclip,
  FaEye,
  FaThumbsUp,
  FaFilter,
  FaSearch,
  FaUserMd
} from "react-icons/fa";

const AnnoncesMedecins = () => {
  const [annonces, setAnnonces] = useState([]);
  const [showNewAnnonceModal, setShowNewAnnonceModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [newAnnonceData, setNewAnnonceData] = useState({
    titre: "",
    contenu: "",
    categorie: "Général",
    fichiers: []
  });
  const [reponse, setReponse] = useState("");
  const [reponseFiles, setReponseFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailedAnnonce, setDetailedAnnonce] = useState(null);
  
  const doctorInfo = JSON.parse(localStorage.getItem("doctorData"));
  
  // Catégories d'annonces
  const categories = ["Général", "Cas clinique", "Formation", "Équipement", "Remplacement", "Collaboration", "Autre"];

  // Charger les annonces depuis Firestore
  useEffect(() => {
    const fetchAnnonces = () => {
      const annoncesRef = collection(db, "annonces_medecins");
      const q = query(annoncesRef, orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const annoncesData = [];
        
        snapshot.forEach(async (doc) => {
          const data = { id: doc.id, ...doc.data() };
          
            if (data.createdBy) {
              try {
                const medecinRef = doc(db, "medecins", data.createdBy);
                const medecinSnap = await getDoc(medecinRef);
                if (medecinSnap.exists()) {
                  data.creatorInfo = medecinSnap.data();
                }
              } catch (error) {
                console.error("Erreur lors de la récupération du médecin:", error);
              }
            }

          
          annoncesData.push(data);
        });
        
        setAnnonces(annoncesData);
      });
      
      return unsubscribe;
    };
    
    const unsubscribe = fetchAnnonces();
    return () => unsubscribe();
  }, []);
  
  // Filtrer les annonces
  const filteredAnnonces = annonces.filter(annonce => {
    // Filtrer par catégorie
    if (filter !== "all" && annonce.categorie !== filter) {
      return false;
    }
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        annonce.titre.toLowerCase().includes(searchLower) ||
        annonce.contenu.toLowerCase().includes(searchLower) ||
        annonce.creatorInfo?.nom?.toLowerCase().includes(searchLower) ||
        annonce.creatorInfo?.prenom?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Créer une nouvelle annonce
  const handleCreateAnnonce = async () => {
    if (!newAnnonceData.titre || !newAnnonceData.contenu) {
      setMessage("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Préparer les données de l'annonce
      const annonceData = {
        titre: newAnnonceData.titre,
        contenu: newAnnonceData.contenu,
        categorie: newAnnonceData.categorie,
        createdBy: doctorInfo.id,
        createdAt: serverTimestamp(),
        creatorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        creatorSpecialite: doctorInfo.specialite,
        reponses: [],
        fichiers: []
      };
      
      // Ajouter l'annonce à Firestore
      const docRef = await addDoc(collection(db, "annonces_medecins"), annonceData);
      
      // Uploader les fichiers si présents
      if (newAnnonceData.fichiers.length > 0) {
        const uploadedFiles = await Promise.all(
          newAnnonceData.fichiers.map(async (file) => {
            const storageRef = ref(storage, `annonces_medecins/${docRef.id}/${file.name}`);
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
        
        // Mettre à jour l'annonce avec les fichiers
        await updateDoc(doc(db, "annonces_medecins", docRef.id), {
          fichiers: uploadedFiles
        });
      }
      
      // Réinitialiser le formulaire
      setNewAnnonceData({
        titre: "",
        contenu: "",
        categorie: "Général",
        fichiers: []
      });
      
      setShowNewAnnonceModal(false);
      setMessage("Annonce publiée avec succès");
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce:", error);
      setMessage("Erreur lors de la publication de l'annonce");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Répondre à une annonce
  const handleRepondreAnnonce = async () => {
    if (!reponse.trim()) {
      setMessage("Veuillez saisir une réponse");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Préparer la réponse
      const nouvelleReponse = {
        contenu: reponse,
        createdBy: doctorInfo.id,
        createdAt: new Date().toISOString(),
        creatorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        creatorSpecialite: doctorInfo.specialite,
        fichiers: []
      };
      
      // Uploader les fichiers si présents
      if (reponseFiles.length > 0) {
        const uploadedFiles = await Promise.all(
          reponseFiles.map(async (file) => {
            const storageRef = ref(storage, `annonces_medecins/${selectedAnnonce.id}/reponses/${file.name}`);
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
      const annonceRef = doc(db, "annonces_medecins", selectedAnnonce.id);
      await updateDoc(annonceRef, {
        reponses: [...(selectedAnnonce.reponses || []), nouvelleReponse]
      });
      
      setReponse("");
      setReponseFiles([]);
      setShowResponseModal(false);
      setMessage("Réponse publiée avec succès");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la réponse:", error);
      setMessage("Erreur lors de la publication de la réponse");
    } finally {
      setIsLoading(false);
    }
  };
  
 // Supprimer une annonce
const handleDeleteAnnonce = async (annonceId) => {
  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
    try {
      setIsLoading(true);
      
      // Supprimer les fichiers associés à l'annonce
      const annonceRef = doc(db, "annonces_medecins", annonceId);
      
      // Remplacer getDocs par getDoc pour obtenir un document unique
      const annonceSnap = await getDoc(annonceRef);
      
      if (annonceSnap.exists()) {
        const annonceData = annonceSnap.data();
        
        // Supprimer les fichiers de l'annonce
        if (annonceData.fichiers && annonceData.fichiers.length > 0) {
          await Promise.all(
            annonceData.fichiers.map(async (file) => {
              if (file.path) {
                const fileRef = ref(storage, file.path);
                await deleteObject(fileRef);
              }
            })
          );
        }
        
        // Supprimer les fichiers des réponses
        if (annonceData.reponses && annonceData.reponses.length > 0) {
          await Promise.all(
            annonceData.reponses.flatMap(reponse => 
              (reponse.fichiers || []).map(async (file) => {
                if (file.path) {
                  const fileRef = ref(storage, file.path);
                  await deleteObject(fileRef);
                }
              })
            )
          );
        }
      }
      
      // Supprimer l'annonce
      await deleteDoc(annonceRef);
      setMessage("Annonce supprimée avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annonce:", error);
      setMessage("Erreur lors de la suppression de l'annonce");
    } finally {
      setIsLoading(false);
    }
  }
};

  
  // Afficher les détails d'une annonce
  const handleViewDetails = (annonce) => {
    setDetailedAnnonce(annonce);
    setShowDetailsModal(true);
  };

  // Formater la date
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

  return (
    <Container fluid className="py-4">
      {message && (
        <Alert variant="info" onClose={() => setMessage("")} dismissible>
          {message}
        </Alert>
      )}
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaUserMd className="me-2" /> Forum des Médecins
          </h5>
          <Button 
            variant="light" 
            size="sm" 
            onClick={() => setShowNewAnnonceModal(true)}
          >
            <FaPlus className="me-1" /> Nouvelle annonce
          </Button>
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="mb-3 mb-md-0">
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher dans les annonces..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm("")}
                    >
                      &times;
                    </Button>
                  )}
                </div>
              </Form.Group>
            </Col>
            <Col md={6}>
              <div className="d-flex justify-content-md-end">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-filter">
                    <FaFilter className="me-2" />
                    {filter === "all" ? "Toutes les catégories" : filter}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      active={filter === "all"} 
                      onClick={() => setFilter("all")}
                    >
                      Toutes les catégories
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    {categories.map(categorie => (
                      <Dropdown.Item 
                        key={categorie}
                        active={filter === categorie}
                        onClick={() => setFilter(categorie)}
                      >
                        {categorie}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>
          
          {filteredAnnonces.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <FaSearch size={50} className="text-muted opacity-25" />
              </div>
              <h5 className="text-muted mb-3">Aucune annonce trouvée</h5>
              <p className="text-muted mb-4">
                {searchTerm || filter !== "all" 
                  ? "Aucune annonce ne correspond à vos critères de recherche."
                  : "Soyez le premier à publier une annonce !"}
              </p>
              <Button 
                variant="outline-primary" 
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                }}
                className="rounded-pill shadow-sm px-4 py-2"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {filteredAnnonces.map(annonce => (
                <Col key={annonce.id}>
                  <Card className="h-100 shadow-sm hover-lift">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                      <Badge bg="info" pill>
                        {annonce.categorie}
                      </Badge>
                      <small className="text-muted">
                        {formatDate(annonce.createdAt)}
                      </small>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>{annonce.titre}</Card.Title>
                      <Card.Text className="text-truncate">
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
                            onClick={() => handleViewDetails(annonce)}
                          >
                            <FaEye className="me-1" /> Voir
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => {
                              setSelectedAnnonce(annonce);
                              setShowResponseModal(true);
                            }}
                          >
                            <FaComment className="me-1" /> Répondre
                          </Button>
                          {annonce.createdBy === doctorInfo.id && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteAnnonce(annonce.id)}
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal pour créer une nouvelle annonce */}
      <Modal 
        show={showNewAnnonceModal} 
        onHide={() => setShowNewAnnonceModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle annonce</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={newAnnonceData.titre}
                onChange={(e) => setNewAnnonceData({...newAnnonceData, titre: e.target.value})}
                placeholder="Titre de l'annonce"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Catégorie</Form.Label>
              <Form.Select
                value={newAnnonceData.categorie}
                onChange={(e) => setNewAnnonceData({...newAnnonceData, categorie: e.target.value})}
              >
                {categories.map(categorie => (
                  <option key={categorie} value={categorie}>
                    {categorie}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Contenu</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={newAnnonceData.contenu}
                onChange={(e) => setNewAnnonceData({...newAnnonceData, contenu: e.target.value})}
                placeholder="Détaillez votre annonce ici..."
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Fichiers (facultatif)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => setNewAnnonceData({
                  ...newAnnonceData, 
                  fichiers: Array.from(e.target.files)
                })}
              />
              <Form.Text className="text-muted">
                Vous pouvez joindre des images, des PDF ou d'autres documents.
              </Form.Text>
            </Form.Group>
            
            {newAnnonceData.fichiers.length > 0 && (
              <div className="mb-3">
                <p>Fichiers sélectionnés:</p>
                <ListGroup>
                  {Array.from(newAnnonceData.fichiers).map((file, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <div>
                        <FaPaperclip className="me-2" />
                        {file.name}
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          const newFiles = [...newAnnonceData.fichiers];
                          newFiles.splice(index, 1);
                          setNewAnnonceData({...newAnnonceData, fichiers: newFiles});
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewAnnonceModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateAnnonce}
            disabled={isLoading || !newAnnonceData.titre || !newAnnonceData.contenu}
          >
            {isLoading ? "Publication en cours..." : "Publier l'annonce"}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour répondre à une annonce */}
      <Modal 
        show={showResponseModal} 
        onHide={() => setShowResponseModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Répondre à l'annonce</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAnnonce && (
            <>
              <div className="mb-3">
                <h5>{selectedAnnonce.titre}</h5>
                <p className="text-muted">
                  Publié par {selectedAnnonce.creatorName} • {formatDate(selectedAnnonce.createdAt)}
                </p>
              </div>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Votre réponse</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
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
            onClick={handleRepondreAnnonce}
            disabled={isLoading || !reponse.trim()}
          >
            {isLoading ? "Publication en cours..." : "Publier la réponse"}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour afficher les détails d'une annonce */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Détails de l'annonce</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailedAnnonce && (
            <>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4>{detailedAnnonce.titre}</h4>
                  <Badge bg="info" pill>{detailedAnnonce.categorie}</Badge>
                </div>
                
                <div className="d-flex align-items-center mb-3">
                  <div className="me-2">
                    {detailedAnnonce.creatorInfo?.photo ? (
                      <img
                        src={detailedAnnonce.creatorInfo.photo}
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
                          {detailedAnnonce.creatorName?.[0] || "D"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-0 fw-bold">{detailedAnnonce.creatorName}</p>
                    <small className="text-muted">{detailedAnnonce.creatorSpecialite}</small>
                  </div>
                  <div className="ms-auto">
                    <small className="text-muted">
                      {formatDate(detailedAnnonce.createdAt)}
                    </small>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p style={{ whiteSpace: 'pre-line' }}>{detailedAnnonce.contenu}</p>
                </div>
                
                {detailedAnnonce.fichiers?.length > 0 && (
                  <div className="mb-4">
                    <h6>Fichiers joints:</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {detailedAnnonce.fichiers.map((file, index) => (
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
                    {detailedAnnonce.reponses?.length || 0}
                  </Badge>
                </h5>
                
                {(!detailedAnnonce.reponses || detailedAnnonce.reponses.length === 0) ? (
                  <div className="text-center py-4">
                    <p className="text-muted">Aucune réponse pour le moment</p>
                    <Button 
                      variant="outline-primary"
                      onClick={() => {
                        setSelectedAnnonce(detailedAnnonce);
                        setShowDetailsModal(false);
                        setShowResponseModal(true);
                      }}
                    >
                      <FaComment className="me-2" />
                      Soyez le premier à répondre
                    </Button>
                  </div>
                ) : (
                  <>
                    {detailedAnnonce.reponses.map((reponse, index) => (
                      <Card key={index} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle bg-light me-2 d-flex align-items-center justify-content-center"
                                style={{ width: "35px", height: "35px" }}
                              >
                                <span className="text-primary">
                                  {reponse.creatorName?.[0] || "D"}
                                </span>
                              </div>
                              <div>
                                <p className="mb-0 fw-bold">{reponse.creatorName}</p>
                                <small className="text-muted">{reponse.creatorSpecialite}</small>
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
                          
                          {reponse.createdBy === doctorInfo.id && (
                            <div className="mt-3 text-end">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={async () => {
                                  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réponse ?")) {
                                    try {
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
                                      const annonceRef = doc(db, "annonces_medecins", detailedAnnonce.id);
                                      await updateDoc(annonceRef, {
                                        reponses: detailedAnnonce.reponses.filter((_, i) => i !== index)
                                      });
                                      
                                      setMessage("Réponse supprimée avec succès");
                                      setShowDetailsModal(false);
                                    } catch (error) {
                                      console.error("Erreur lors de la suppression de la réponse:", error);
                                      setMessage("Erreur lors de la suppression de la réponse");
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
                          setSelectedAnnonce(detailedAnnonce);
                          setShowDetailsModal(false);
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
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AnnoncesMedecins;
                
