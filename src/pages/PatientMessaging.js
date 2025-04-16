import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Offcanvas, Alert, Dropdown } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaPaperPlane, FaUser, FaFile, FaEllipsisV, FaComment, FaTrash, FaEdit, FaUsers, FaTimes, FaBars, FaArrowLeft, FaPaperclip, FaEnvelope } from 'react-icons/fa';

const PatientMessaging = ({ patientId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [messageCountByDoctor, setMessageCountByDoctor] = useState({});

  const patientInfo = JSON.parse(localStorage.getItem('patientData'));

  // Fonction pour compter les messages reçus par médecin
  const fetchMessageCounts = async () => {
    try {
      if (!patientId) return;
      
      const counts = {};
      
      for (const doctor of assignedDoctors) {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', `${doctor.id}_${patientId}`),
          where('senderId', '==', doctor.id) // Uniquement les messages envoyés par le médecin
        );
        
        const snapshot = await getDocs(messagesQuery);
        counts[doctor.id] = snapshot.docs.length;
      }
      
      setMessageCountByDoctor(counts);
    } catch (err) {
      console.error("Erreur lors du comptage des messages:", err);
    }
  };

  // Fonction pour récupérer les médecins assignés au patient
  useEffect(() => {
    const fetchAssignedDoctors = async () => {
      setLoading(true);
      try {
        if (patientId) {
          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', patientId)
          );
          const snapshot = await getDocs(appointmentsQuery);
          
          const doctorIds = new Set();
          snapshot.docs.forEach(doc => {
            const appointmentData = doc.data();
            if (appointmentData.doctorId) {
              doctorIds.add(appointmentData.doctorId);
            }
          });

          const doctorsData = await Promise.all(
            Array.from(doctorIds).map(async (doctorId) => {
              const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
              if (doctorDoc.exists()) {
                return { id: doctorDoc.id, ...doctorDoc.data() };
              }
              return null;
            })
          );

          const validDoctors = doctorsData.filter(d => d !== null);
          setAssignedDoctors(validDoctors);
          
          // Sélectionner automatiquement le premier médecin si la liste n'est pas vide
          if (validDoctors.length > 0 && selectedDoctors.length === 0) {
            setSelectedDoctors([validDoctors[0]]);
          }
          
          // Charger le comptage des messages après avoir obtenu la liste des médecins
          setTimeout(() => {
            fetchMessageCounts();
          }, 500);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des médecins:", err);
        setError("Impossible de charger vos médecins. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedDoctors();
  }, [patientId]);

  // Récupérer les messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        if (selectedDoctors.length > 0) {
          const allMessages = [];
          for (const doctor of selectedDoctors) {
            const messagesQuery = query(
              collection(db, 'messages'),
              where('conversationId', '==', `${doctor.id}_${patientId}`)
            );
            const snapshot = await getDocs(messagesQuery);
            const messagesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            allMessages.push(...messagesData);
          }
          setMessages(allMessages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
          
          // Mettre à jour le comptage des messages après avoir chargé les messages
          fetchMessageCounts();
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des messages:", err);
        setError("Impossible de charger vos messages. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedDoctors, patientId]);

  const handleDoctorSelection = (doctor) => {
    if (selectedDoctors.find(d => d.id === doctor.id)) {
      setSelectedDoctors(selectedDoctors.filter(d => d.id !== doctor.id));
    } else {
      setSelectedDoctors([...selectedDoctors, doctor]);
    }
    setShowSidebar(false); // Fermer le sidebar sur mobile après sélection
  };

  const handleFileUpload = async (file) => {
    if (!file) return '';
    try {
      setFileUploading(true);
      const fileRef = ref(storage, `messages/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      return getDownloadURL(fileRef);
    } catch (err) {
      console.error("Erreur lors du téléchargement du fichier:", err);
      setError("Impossible de télécharger le fichier. Veuillez réessayer.");
      return '';
    } finally {
      setFileUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((newMessage.trim() || selectedFile) && selectedDoctors.length > 0) {
      try {
        setLoading(true);
        const fileUrl = selectedFile ? await handleFileUpload(selectedFile) : '';

        for (const doctor of selectedDoctors) {
          const messageData = {
            conversationId: `${doctor.id}_${patientId}`,
            senderId: patientId,
            receiverId: doctor.id,
            content: newMessage.trim(),
            fileUrl,
            fileName: selectedFile?.name || '',
            timestamp: serverTimestamp(),
            senderName: `${patientInfo.prenom} ${patientInfo.nom}`,
            senderType: 'patient',
            comments: []
          };

          await addDoc(collection(db, 'messages'), messageData);
        }

        setNewMessage('');
        setSelectedFile(null);

        // Rafraîchir les messages
        const allMessages = [];
        for (const doctor of selectedDoctors) {
          const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', `${doctor.id}_${patientId}`)
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allMessages.push(...messagesData);
        }
        
        setMessages(allMessages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
        
        // Mettre à jour le comptage des messages
        fetchMessageCounts();
        
        // Faire défiler automatiquement vers le bas
        setTimeout(() => {
          const chatBody = document.querySelector('.chat-body');
          if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
          }
        }, 100);
      } catch (err) {
        console.error("Erreur lors de l'envoi du message:", err);
        setError("Impossible d'envoyer votre message. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'messages', messageId));
        setMessages(messages.filter(m => m.id !== messageId));
        
        // Mettre à jour le comptage après suppression
        fetchMessageCounts();
      } catch (err) {
        console.error("Erreur lors de la suppression du message:", err);
        setError("Impossible de supprimer le message. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditMessage = async (messageId) => {
    if (editContent.trim()) {
      try {
        setLoading(true);
        await updateDoc(doc(db, 'messages', messageId), {
          content: editContent,
          edited: true,
          editedAt: serverTimestamp()
        });
        setMessages(messages.map(m => 
          m.id === messageId ? {...m, content: editContent, edited: true} : m
        ));
        setEditingMessage(null);
        setEditContent('');
      } catch (err) {
        console.error("Erreur lors de la modification du message:", err);
        setError("Impossible de modifier le message. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddComment = async (messageId) => {
    if (commentText.trim()) {
      try {
        setLoading(true);
        const messageRef = doc(db, 'messages', messageId);
        const message = messages.find(m => m.id === messageId);
        const newComment = {
          content: commentText.trim(),
          timestamp: new Date().getTime(),
          senderName: `${patientInfo.prenom} ${patientInfo.nom}`,
          senderId: patientId
        };
        
        const updatedComments = [...(message.comments || []), newComment];
        await updateDoc(messageRef, { comments: updatedComments });
        
        setMessages(messages.map(m => 
          m.id === messageId ? {...m, comments: updatedComments} : m
        ));
        setCommentText('');
      } catch (err) {
        console.error("Erreur lors de l'ajout du commentaire:", err);
        setError("Impossible d'ajouter votre commentaire. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Formater la date pour l'affichage
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Effet pour faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    const chatBody = document.querySelector('.chat-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, [messages]);

  return (
    <Container fluid className="py-2 px-2 messaging-container">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm border-0 messaging-card">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Button 
              variant="link" 
              className="text-white me-2 d-md-none" 
              onClick={() => setShowSidebar(true)}
            >
              <FaBars size={20} />
            </Button>
            <h5 className="mb-0">
              Messagerie
            </h5>
          </div>
          <Badge bg="light" text="dark">
            {selectedDoctors.length} médecin(s)
          </Badge>
        </Card.Header>
        
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Liste des médecins (visible uniquement sur desktop) */}
            <Col md={4} className="d-none d-md-block border-end">
              <div className="p-3 bg-light">
                <h6 className="mb-3">
                  <FaUsers className="me-2" />
                  Mes médecins ({assignedDoctors.length})
                </h6>
                <div className="doctor-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {loading && assignedDoctors.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                      <p className="mt-2">Chargement de vos médecins...</p>
                    </div>
                  ) : assignedDoctors.length === 0 ? (
                    <div className="text-center py-4">
                      <FaUser size={30} className="text-muted mb-2" />
                      <p className="text-muted mb-1">Aucun médecin assigné</p>
                      <small className="text-muted">Prenez rendez-vous pour commencer.</small>
                    </div>
                  ) : (
                    assignedDoctors.map(doctor => (
                      <div 
                        key={doctor.id}
                        className={`doctor-item p-2 mb-2 rounded d-flex align-items-center ${
                          selectedDoctors.some(d => d.id === doctor.id) ? 'bg-primary text-white' : 'bg-white border'
                        }`}
                        onClick={() => handleDoctorSelection(doctor)}
                      >
                        <div className={`doctor-avatar me-2 rounded-circle bg-${selectedDoctors.some(d => d.id === doctor.id) ? 'white text-primary' : 'primary text-white'}`}
                             style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FaUser />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">Dr. {doctor.nom} {doctor.prenom}</div>
                          <small>{doctor.specialite}</small>
                        </div>
                        {/* Affichage du nombre de messages reçus */}
                        {messageCountByDoctor[doctor.id] > 0 && (
                          <Badge bg="danger" pill className="ms-1">
                            <FaEnvelope className="me-1" size={10} />
                            {messageCountByDoctor[doctor.id]}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Col>
            
            {/* Zone de chat */}
            <Col md={8} xs={12}>
              <div className="chat-container d-flex flex-column" style={{ height: '70vh' }}>
                {/* En-tête du chat */}
                <div className="chat-header p-3 border-bottom bg-light">
                  {selectedDoctors.length > 0 ? (
                    <div className="d-flex align-items-center">
                      <div className="doctor-avatar me-2 rounded-circle bg-primary text-white"
                           style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedDoctors.length === 1 ? <FaUser /> : <FaUsers />}
                      </div>
                      <div>
                        <h6 className="mb-0">
                          {selectedDoctors.length === 1 
                            ? `Dr. ${selectedDoctors[0].nom} ${selectedDoctors[0].prenom}` 
                            : `${selectedDoctors.length} médecins sélectionnés`}
                        </h6>
                        {selectedDoctors.length === 1 && (
                          <small className="text-muted">{selectedDoctors[0].specialite}</small>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted">
                      <FaUsers className="me-2" />
                      Sélectionnez un médecin pour commencer
                    </div>
                  )}
                </div>
                
                {/* Corps du chat */}
                <div className="chat-body p-3 flex-grow-1" style={{ overflowY: 'auto' }}>
                  {loading && messages.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                      <p className="mt-2">Chargement des messages...</p>
                    </div>
                  ) : messages.length === 0 && selectedDoctors.length > 0 ? (
                    <div className="text-center py-5">
                      <FaComment size={40} className="text-muted mb-3" />
                      <p className="text-muted">
                        Aucun message dans cette conversation. 
                        <br />
                        Commencez à échanger avec {selectedDoctors.length > 1 ? 'vos médecins' : 'votre médecin'}.
                      </p>
                    </div>
                  ) : selectedDoctors.length === 0 ? (
                    <div className="text-center py-5">
                      <FaUsers size={40} className="text-muted mb-3" />
                      <p className="text-muted">
                        Veuillez sélectionner un médecin pour commencer à discuter.
                      </p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div key={message.id} className="mb-3">
                        <div className={`d-flex ${message.senderId === patientId ? 'justify-content-end' : 'justify-content-start'}`}>
                          <div className={`message-bubble p-3 rounded ${
                            message.senderId === patientId ? 'bg-primary text-white' : 'bg-light'
                          }`} style={{ maxWidth: '80%', position: 'relative' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="fw-bold">{message.senderName}</small>
                              <small className="ms-2">{formatTimestamp(message.timestamp)}</small>
                            </div>
                            
                            {editingMessage === message.id ? (
                              <Form onSubmit={(e) => {
                                e.preventDefault();
                                handleEditMessage(message.id);
                              }}>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  autoFocus
                                  className="mb-2"
                                />
                                <div className="d-flex gap-2">
                                  <Button size="sm" type="submit">Sauvegarder</Button>
                                  <Button size="sm" variant="secondary" onClick={() => {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }}>Annuler</Button>
                                </div>
                              </Form>
                            ) : (
                              <>
                                <div className="message-content">{message.content}</div>
                                {message.fileUrl && (
                                  <a href={message.fileUrl} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className={`d-flex align-items-center mt-2 ${message.senderId === patientId ? 'text-white' : 'text-primary'}`}>
                                    <FaFile className="me-2" />
                                    <span className="text-truncate">{message.fileName}</span>
                                  </a>
                                )}
                                {message.edited && (
                                  <small className="d-block mt-1 fst-italic">
                                    (modifié)
                                  </small>
                                )}
                              </>
                            )}
                            
                            {/* Actions sur le message */}
                            {message.senderId === patientId && !editingMessage && (
                              <div className="message-actions position-absolute top-0 end-0 p-1">
                                <Dropdown align="end">
                                  <Dropdown.Toggle as="div" className="cursor-pointer">
                                    <FaEllipsisV size={14} />
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => {
                                      setEditingMessage(message.id);
                                      setEditContent(message.content);
                                    }}>
                                      <FaEdit className="me-2" /> Modifier
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleDeleteMessage(message.id)}>
                                      <FaTrash className="me-2" /> Supprimer
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            )}
                            
                            {/* Commentaires */}
                            <div className="mt-2">
                              <Button
                                variant="link"
                                size="sm"
                                className={`p-0 ${message.senderId === patientId ? 'text-white' : 'text-primary'}`}
                                onClick={() => setShowComments({...showComments, [message.id]: !showComments[message.id]})}
                              >
                                <FaComment className="me-1" />
                                {message.comments?.length || 0} commentaire{message.comments?.length !== 1 ? 's' : ''}
                              </Button>
                              
                              {showComments[message.id] && (
                                <div className="comments-section mt-2 pt-2 border-top">
                                  {message.comments?.map((comment, index) => (
                                    <div key={index} className={`comment p-2 mb-1 rounded ${
                                      comment.senderId === patientId ? 'bg-info bg-opacity-75 text-white' : 'bg-light text-dark'
                                    }`}>
                                      <div className="d-flex justify-content-between">
                                        <small className="fw-bold">{comment.senderName}</small>
                                        <small>{new Date(comment.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>
                                      </div>
                                      <div>{comment.content}</div>
                                    </div>
                                  ))}
                                  
                                  <Form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddComment(message.id);
                                  }} className="mt-2">
                                    <div className="d-flex gap-2">
                                      <Form.Control
                                        size="sm"
                                        type="text"
                                        placeholder="Ajouter un commentaire..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                      />
                                      <Button size="sm" type="submit" disabled={!commentText.trim()}>
                                        <FaPaperPlane />
                                      </Button>
                                    </div>
                                  </Form>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Zone de saisie du message */}
                <div className="chat-footer p-2 border-top">
                  <Form onSubmit={handleSendMessage}>
                    {selectedFile && (
                      <div className="selected-file p-2 mb-2 bg-light rounded d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center text-truncate">
                          <FaFile className="me-2 text-primary" />
                          <span className="text-truncate">{selectedFile.name}</span>
                        </div>
                        <Button
                          variant="link"
                          className="p-0 text-danger"
                          onClick={() => setSelectedFile(null)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    )}
                    
                    <div className="d-flex gap-2">
                      <Form.Control
                        as="textarea"
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={selectedDoctors.length > 0 ? "Écrivez votre message..." : "Sélectionnez un médecin pour commencer"}
                        disabled={selectedDoctors.length === 0 || fileUploading}
                        style={{ resize: 'none' }}
                      />
                      
                      <Form.Control
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      
                      <div className="d-flex">
                        <Button
                          variant="outline-secondary"
                          onClick={() => document.getElementById('file-upload').click()}
                          disabled={selectedDoctors.length === 0 || fileUploading}
                          title="Joindre un fichier"
                          className="rounded-end-0"
                        >
                          <FaPaperclip />
                        </Button>
                        
                        <Button 
                          type="submit" 
                          disabled={selectedDoctors.length === 0 || (!newMessage.trim() && !selectedFile) || fileUploading || loading}
                          className="rounded-start-0"
                        >
                          {fileUploading || loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <FaPaperPlane />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Sidebar mobile pour la sélection des médecins */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <FaUsers className="me-2" />
            Mes médecins
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
        </Offcanvas.Body>
      </Offcanvas>
      
      <style jsx>{`
        .messaging-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .doctor-item {
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .doctor-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .message-bubble {
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          word-break: break-word;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .messaging-card {
            height: calc(100vh - 120px);
          }
          
          .chat-container {
            height: calc(100vh - 140px) !important;
          }
          
          .chat-body {
            padding: 10px !important;
          }
          
          .message-bubble {
            max-width: 85% !important;
          }
        }
        
        .chat-header {
          flex-shrink: 0;
        }
        
        .chat-footer {
          flex-shrink: 0;
        }
        
        .chat-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .chat-body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        .chat-body::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        
        .chat-body::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
        
        .message-actions {
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        
        .message-bubble:hover .message-actions {
          opacity: 1;
        }
        
        .selected-file {
          max-width: 100%;
        }
        
        .doctor-avatar {
          flex-shrink: 0;
        }
        
        .unread-badge {
          position: relative;
          top: -2px;
        }
      `}</style>
    </Container>
  );
};

export default PatientMessaging;
