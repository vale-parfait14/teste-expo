import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Dropdown } from 'react-bootstrap';
import { db, storage } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaPaperPlane, FaUser, FaFile, FaEllipsisV, FaComment, FaTrash, FaEdit, FaUsers } from 'react-icons/fa';

const MessageriesPatients = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});

  const doctorInfo = JSON.parse(localStorage.getItem('doctorData'));

  // Cette fonction fetchAssignedPatients récupère tous les patients assignés au médecin
  useEffect(() => {
    const fetchAssignedPatients = async () => {
      if (doctorInfo?.id) {
        const patientsQuery = query(
          collection(db, 'patients'),
          where('medecinId', '==', doctorInfo.id)
        );
        const snapshot = await getDocs(patientsQuery);
        const patientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssignedPatients(patientsData);
      }
    };
    fetchAssignedPatients();
  }, [doctorInfo]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedPatients.length > 0) {
        const allMessages = [];
        for (const patient of selectedPatients) {
          const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', `${doctorInfo.id}_${patient.id}`)
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allMessages.push(...messagesData);
        }
        setMessages(allMessages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedPatients, doctorInfo]);

  const handlePatientSelection = (patient) => {
    if (selectedPatients.find(p => p.id === patient.id)) {
      setSelectedPatients(selectedPatients.filter(p => p.id !== patient.id));
    } else {
      setSelectedPatients([...selectedPatients, patient]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return '';
    const fileRef = ref(storage, `messages/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((newMessage.trim() || selectedFile) && selectedPatients.length > 0) {
      const fileUrl = await handleFileUpload(selectedFile);

      for (const patient of selectedPatients) {
        const messageData = {
          conversationId: `${doctorInfo.id}_${patient.id}`,
          senderId: doctorInfo.id,
          receiverId: patient.id,
          content: newMessage.trim(),
          fileUrl,
          fileName: selectedFile?.name || '',
          timestamp: serverTimestamp(),
          senderName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
          senderType: 'doctor',
          comments: []
        };

        await addDoc(collection(db, 'messages'), messageData);
      }

      setNewMessage('');
      setSelectedFile(null);

      const allMessages = [];
      for (const patient of selectedPatients) {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', `${doctorInfo.id}_${patient.id}`)
        );
        const snapshot = await getDocs(messagesQuery);
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        allMessages.push(...messagesData);
      }
      
      setMessages(allMessages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      await deleteDoc(doc(db, 'messages', messageId));
      setMessages(messages.filter(m => m.id !== messageId));
    }
  };

  const handleEditMessage = async (messageId) => {
    if (editContent.trim()) {
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
    }
  };

  const handleAddComment = async (messageId) => {
    if (commentText.trim()) {
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      const newComment = {
        content: commentText.trim(),
        timestamp: new Date().getTime(),
        senderName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
        senderId: doctorInfo.id
      };
      
      const updatedComments = [...(message.comments || []), newComment];
      await updateDoc(messageRef, { comments: updatedComments });
      
      setMessages(messages.map(m => 
        m.id === messageId ? {...m, comments: updatedComments} : m
      ));
      setCommentText('');
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={4}>
          <Card className="mb-3 shadow">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Patients</h5>
              <span><FaUsers /> {selectedPatients.length} sélectionné(s)</span>
            </Card.Header>
            <ListGroup variant="flush">
              {assignedPatients.map(patient => (
                <ListGroup.Item
                  key={patient.id}
                  action
                  active={selectedPatients.some(p => p.id === patient.id)}
                  onClick={() => handlePatientSelection(patient)}
                  className="d-flex align-items-center"
                >
                  <Form.Check
                    type="checkbox"
                    checked={selectedPatients.some(p => p.id === patient.id)}
                    onChange={() => {}}
                    className="me-2"
                  />
                  <FaUser className="me-2" />
                  {patient.nom} {patient.prenom}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="chat-card shadow">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                {selectedPatients.length > 0 
                  ? `Chat avec ${selectedPatients.length} patient(s) sélectionné(s)` 
                  : 'Sélectionnez un ou plusieurs patients'}
              </h5>
            </Card.Header>
            <Card.Body className="chat-body" style={{ height: '500px', overflowY: 'auto' }}>
              {messages.map(message => (
                <div key={message.id} className="mb-3">
                  <div className={`d-flex ${message.senderId === doctorInfo.id ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div className={`message-container p-3 rounded ${message.senderId === doctorInfo.id ? 'bg-primary text-white' : 'bg-light'}`}
                         style={{ maxWidth: '75%' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small>{message.senderName}</small>
                        {message.senderId === doctorInfo.id && (
                          <div className="message-actions">
                            <Button variant="link" className="text-white p-0 me-2" onClick={() => {
                              setEditingMessage(message.id);
                              setEditContent(message.content);
                            }}>
                              <FaEdit />
                            </Button>
                            <Button variant="link" className="text-white p-0" onClick={() => handleDeleteMessage(message.id)}>
                              <FaTrash />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingMessage === message.id ? (
                        <Form onSubmit={(e) => {
                          e.preventDefault();
                          handleEditMessage(message.id);
                        }}>
                          <Form.Control
                            type="text"
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
                          <div>{message.content}</div>
                          {message.fileUrl && (
                            <a href={message.fileUrl} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className={`d-block mt-2 ${message.senderId === doctorInfo.id ? 'text-white' : 'text-primary'}`}>
                              <FaFile className="me-2" />
                              {message.fileName}
                            </a>
                          )}
                          {message.edited && (
                            <small className="d-block mt-1 fst-italic">
                              (modifié)
                            </small>
                          )}
                        </>
                      )}

                      <div className="mt-3">
                        <Button
                          variant="link"
                          className={`p-0 ${message.senderId === doctorInfo.id ? 'text-white' : 'text-primary'}`}
                          onClick={() => setShowComments({...showComments, [message.id]: !showComments[message.id]})}
                        >
                          <FaComment className="me-1" />
                          {message.comments?.length || 0} commentaires
                        </Button>
                        
                        {showComments[message.id] && (
                          <div className="mt-2">
                            {message.comments?.map((comment, index) => (
                              <div key={index} className={`p-2 mt-1 rounded ${
                                comment.senderId === doctorInfo.id ? 'bg-info text-white' : 'bg-light text-dark'
                              }`}>
                                <small className="fw-bold">{comment.senderName}</small>
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
                                <Button size="sm" type="submit">
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
              ))}
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    disabled={selectedPatients.length === 0}
                  />
                  <Form.Control
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => document.getElementById('file-upload').click()}
                    disabled={selectedPatients.length === 0}
                    title="Joindre un fichier"
                  >
                    <FaFile />
                  </Button>
                  <Button type="submit" disabled={selectedPatients.length === 0 || (!newMessage.trim() && !selectedFile)}>
                    <FaPaperPlane />
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Fichier sélectionné: {selectedFile.name}
                      <Button
                        variant="link"
                        className="p-0 ms-2 text-danger"
                        onClick={() => setSelectedFile(null)}
                      >
                        <FaTrash />
                      </Button>
                    </small>
                  </div>
                )}
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MessageriesPatients;
