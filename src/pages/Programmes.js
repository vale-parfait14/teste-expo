import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Modal, Form, Row, Col, ButtonGroup, Table } from 'react-bootstrap';
import { db } from '../components/firebase-config.js';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  FaCalendarAlt, FaClock, FaUser, FaPhone, FaEnvelope, 
  FaNotesMedical, FaCheckCircle, FaTimesCircle, FaThLarge, 
  FaList, FaVideo, FaComment, FaTrash, FaInfoCircle 
} from 'react-icons/fa';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [viewType, setViewType] = useState('grid');

  useEffect(() => {
    const doctorData = JSON.parse(localStorage.getItem('doctorData'));
    if (!doctorData) {
      setError("Aucun médecin connecté");
      setLoading(false);
      return;
    }

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorData.id)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
      try {
        const appointmentsData = [];
        const patientUpdates = {};

        for (const change of snapshot.docChanges()) {
          const appointmentData = {
            id: change.doc.id,
            ...change.doc.data()
          };

          if (change.type === 'added' || change.type === 'modified') {
            appointmentsData.push(appointmentData);
            
            if (!patients[appointmentData.patientId]) {
              const patientDoc = await getDoc(doc(db, 'patients', appointmentData.patientId));
              if (patientDoc.exists()) {
                patientUpdates[appointmentData.patientId] = {
                  id: patientDoc.id,
                  ...patientDoc.data()
                };
              }
            }
          }
        }

        if (Object.keys(patientUpdates).length > 0) {
          setPatients(prev => ({
            ...prev,
            ...patientUpdates
          }));
        }

        appointmentsData.sort((a, b) => {
          if (a.day === b.day) return a.timeSlot.localeCompare(b.timeSlot);
          return a.day.localeCompare(b.day);
        });

        setAppointments(appointmentsData);
        setLoading(false);
      } catch (error) {
        setError("Erreur de synchronisation: " + error.message);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      setError("Erreur lors de la mise à jour du statut");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
    } catch (error) {
      setError("Erreur lors de l'annulation du rendez-vous");
    }
  };

  const handleContactPatient = (method, contact) => {
    switch (method) {
      case 'email':
        window.location.href = `mailto:${contact}`;
        break;
      case 'phone':
        window.location.href = `tel:${contact}`;
        break;
      case 'video':
        // Implement video call logic
        break;
      default:
        break;
    }
  };

  const groupedAppointments = appointments.reduce((groups, apt) => {
    if (!groups[apt.day]) {
      groups[apt.day] = [];
    }
    groups[apt.day].push(apt);
    return groups;
  }, {});

  if (loading) return <div className="loading-spinner">Chargement des rendez-vous...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="appointments-container">
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-gradient bg-primary text-white py-3">
          <div className="d-flex justify-content-between align-items-center px-3">
            <h5 className="mb-0 d-flex align-items-center">
              <FaCalendarAlt className="me-2" size={24} />
              <span className="d-none d-sm-inline">Mes Rendez-vous</span>
              <span className="d-sm-none">RDV</span>
            </h5>

            <div className="d-flex align-items-center gap-3">
              <ButtonGroup>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setViewType('grid')}
                  active={viewType === 'grid'}
                >
                  <FaThLarge />
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setViewType('table')}
                  active={viewType === 'table'}
                >
                  <FaList />
                </Button>
              </ButtonGroup>

              <div className="d-none d-md-flex gap-2">
                {Object.keys(groupedAppointments).map(day => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "light" : "outline-light"}
                    size="sm"
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>

              <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                {appointments.length} rendez-vous
              </Badge>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {viewType === 'grid' ? (
            <Row className="g-4 p-4">
              {Object.entries(groupedAppointments)
                .filter(([day]) => !selectedDay || day === selectedDay)
                .map(([day, dayAppointments]) => (
                  dayAppointments.map(apt => (
                    <Col key={apt.id} xs={12} md={6} lg={4} xl={3}>
                      <Card className="h-100 shadow-sm hover-lift">
                        <Card.Body>
                          <div className="text-center mb-3">
                            <div className="rounded-circle bg-light mx-auto mb-2 d-flex align-items-center justify-content-center"
                              style={{ width: "80px", height: "80px" }}>
                              <span className="h4 mb-0">
                                {patients[apt.patientId]?.nom[0]}
                                {patients[apt.patientId]?.prenom[0]}
                              </span>
                            </div>
                            <h6 className="mb-1">
                              {patients[apt.patientId]?.nom} {patients[apt.patientId]?.prenom}
                            </h6>
                            
                            <div className="d-flex justify-content-center gap-2 mb-2">
                              <Badge bg="primary">{apt.timeSlot}</Badge>
                              <Form.Select
                                size="sm"
                                value={apt.status}
                                onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                                style={{ width: 'auto' }}
                              >
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmé</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                              </Form.Select>
                            </div>
                          </div>

                          <div className="d-grid gap-2">
                            <ButtonGroup size="sm">
                              <Button variant="outline-primary" 
                                onClick={() => handleContactPatient("email", patients[apt.patientId]?.email)}>
                                <FaEnvelope className="me-1" />
                                Email
                              </Button>
                              <Button variant="outline-success"
                                onClick={() => handleContactPatient("phone", patients[apt.patientId]?.telephone)}>
                                <FaPhone className="me-1" />
                                Appeler
                              </Button>
                            </ButtonGroup>
                            
                            <ButtonGroup size="sm">
                              <Button variant="outline-info"
                                onClick={() => handleContactPatient("video", apt.patientId)}>
                                <FaVideo className="me-1" />
                                Vidéo
                              </Button>
                              <Button variant="outline-danger"
                                onClick={() => handleCancelAppointment(apt.id)}>
                                <FaTrash className="me-1" />
                                Annuler
                              </Button>
                            </ButtonGroup>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ))}
            </Row>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 px-3 py-3">Patient</th>
                    <th className="border-0 px-3 py-3">Horaire</th>
                    <th className="border-0 px-3 py-3">Statut</th>
                    <th className="border-0 px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedAppointments)
                    .filter(([day]) => !selectedDay || day === selectedDay)
                    .map(([day, dayAppointments]) => (
                      dayAppointments.map(apt => (
                        <tr key={apt.id}>
                          <td className="px-3 py-3">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                                style={{ width: "48px", height: "48px" }}>
                                <span className="h6 mb-0">
                                  {patients[apt.patientId]?.nom[0]}
                                  {patients[apt.patientId]?.prenom[0]}
                                </span>
                              </div>
                              <div>
                                <h6 className="mb-0">
                                  {patients[apt.patientId]?.nom} {patients[apt.patientId]?.prenom}
                                </h6>
                                <small className="text-muted">
                                  {patients[apt.patientId]?.telephone}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="d-flex flex-column">
                              <small className="text-muted">
                                <FaCalendarAlt className="me-2" />{apt.day}
                              </small>
                              <small className="text-muted">
                                <FaClock className="me-2" />{apt.timeSlot}
                              </small>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <Form.Select
                              size="sm"
                              value={apt.status}
                              onChange={(e) => handleStatusUpdate(apt.id, e.target.value)}
                            >
                              <option value="pending">En attente</option>
                              <option value="confirmed">Confirmé</option>
                              <option value="completed">Terminé</option>
                              <option value="cancelled">Annulé</option>
                            </Form.Select>
                          </td>
                          <td className="px-3 py-3">
                            <ButtonGroup size="sm">
                              <Button variant="outline-primary"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowDetailsModal(true);
                                }}>
                                <FaInfoCircle className="me-1" />
                                Détails
                              </Button>
                              <Button variant="outline-danger"
                                onClick={() => handleCancelAppointment(apt.id)}>
                                <FaTrash className="me-1" />
                                Annuler
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))
                    ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        {selectedAppointment && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Détails du rendez-vous</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Statut du rendez-vous</Form.Label>
                  <Form.Select
                    value={selectedAppointment.status}
                    onChange={(e) => handleStatusUpdate(selectedAppointment.id, e.target.value)}
                  >
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes de consultation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </Button>
              <Button variant="primary" onClick={() => {
                handleStatusUpdate(selectedAppointment.id, 'completed');
              }}>
              Terminer la consultation
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>

    <style jsx>{`
      .appointments-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .appointment-card {
        transition: transform 0.2s;
        border-left: 4px solid #007bff;
        cursor: pointer;
      }
      .appointment-card:hover {
        transform: translateX(5px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .hover-lift {
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important;
      }
    `}</style>
  </div>
);
};

export default DoctorAppointments;
