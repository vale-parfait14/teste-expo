import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase.js';
import { getAuth, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Offcanvas, Form, Alert, Modal, Table } from 'react-bootstrap';
import { motion } from 'framer-motion';
import {
  FaUsers, FaUserMd, FaHospital, FaFileAlt,
  FaTasks, FaEnvelope, FaClock, FaCalendarAlt,
  FaSignOutAlt, FaBars, FaTimes, FaUserPlus
} from 'react-icons/fa';
import LogoutButton from '../components/LogoutButton.js';
import { collection, addDoc, getDocs, updateDoc, query, where, doc } from 'firebase/firestore';

function Manager() {
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminsList, setAdminsList] = useState([]);
  const [showAdminsList, setShowAdminsList] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditAdmin, setShowEditAdmin] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [currentAdminPermissions, setCurrentAdminPermissions] = useState({});
  
  const [adminInfo, setAdminInfo] = useState({
    email: '',
    lastLogin: '',
    creationTime: ''
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [adminPermissions, setAdminPermissions] = useState({
    canManagePatients: false,
    canManageDoctors: false,
    canManageStructures: false,
    canViewReports: false,
    canManageAssignments: false
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const permissionMenuMap = {
    canManagePatients: { path: '/patients', icon: <FaUsers />, title: 'Patients' },
    canManageDoctors: { path: '/medecins', icon: <FaUserMd />, title: 'Médecins' },
    canManageStructures: { path: '/structures', icon: <FaHospital />, title: 'Structures' },
    canViewReports: { path: '/rapports', icon: <FaFileAlt />, title: 'Rapports' },
    canManageAssignments: { path: '/attributions', icon: <FaTasks />, title: 'Attributions' }
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const isSuperAdminUser = user.email === "admin@gmail.com";
        setIsSuperAdmin(isSuperAdminUser);
        
        if (!isSuperAdminUser) {
          const adminsRef = collection(db, "admins");
          const q = query(adminsRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setCurrentAdminPermissions(querySnapshot.docs[0].data().permissions);
          }
        }
        
        setAdminInfo({
          email: user.email,
          lastLogin: user.metadata.lastSignInTime,
          creationTime: user.metadata.creationTime
        });
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const adminsSnapshot = await getDocs(collection(db, "admins"));
      const adminsList = adminsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(admin => admin.status !== 'deleted');
      setAdminsList(adminsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des admins:", error);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'danger', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      await addDoc(collection(db, "admins"), {
        email: formData.email,
        creationTime: new Date().toISOString(),
        createdBy: auth.currentUser.email,
        lastLogin: null,
        permissions: adminPermissions,
        status: 'active'
      });

      setMessage({ type: 'success', text: 'Administrateur créé avec succès' });
      setFormData({ email: '', password: '', confirmPassword: '' });
      setAdminPermissions({
        canManagePatients: false,
        canManageDoctors: false,
        canManageStructures: false,
        canViewReports: false,
        canManageAssignments: false
      });
      await fetchAdmins();
      setTimeout(() => setShowCreateAdmin(false), 2000);
    } catch (error) {
      setMessage({ type: 'danger', text: `Erreur: ${error.message}` });
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "admins", selectedAdmin.id), {
        permissions: adminPermissions,
        lastModified: new Date().toISOString(),
        modifiedBy: auth.currentUser.email
      });
      
      setMessage({ type: 'success', text: 'Permissions mises à jour avec succès' });
      await fetchAdmins();
      setTimeout(() => setShowEditAdmin(false), 2000);
    } catch (error) {
      setMessage({ type: 'danger', text: `Erreur: ${error.message}` });
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur ${adminEmail}?`)) {
      try {
        await updateDoc(doc(db, "admins", adminId), {
          status: 'deleted',
          deletedAt: new Date().toISOString(),
          deletedBy: auth.currentUser.email
        });
        setMessage({ type: 'success', text: 'Administrateur supprimé avec succès' });
        await fetchAdmins();
      } catch (error) {
        setMessage({ type: 'danger', text: `Erreur lors de la suppression: ${error.message}` });
      }
    }
  };

  const SidebarContent = () => {
    const authorizedMenuItems = Object.entries(permissionMenuMap)
      .filter(([permission]) => isSuperAdmin || currentAdminPermissions[permission])
      .map(([_, menuItem]) => menuItem);

    return (
      <div className="sidebar-content">
        <h3 className="text-white mb-4 text-center d-flex align-items-center justify-content-between">
          Tableau de bord
          <Button
            variant="link"
            className="d-md-none text-white"
            onClick={() => setShowSidebar(false)}
          >
            <FaTimes size={24} />
          </Button>
        </h3>
        <div className="d-flex flex-column gap-2">
          {authorizedMenuItems.map((item) => (
            <motion.div
              key={item.path}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline-light"
                className="w-100 text-start d-flex align-items-center gap-2 p-3"
                onClick={() => {
                  navigate(item.path);
                  setShowSidebar(false);
                }}
              >
                {item.icon}
                <span className="menu-title">{item.title}</span>
              </Button>
            </motion.div>
          ))}
          
          {isSuperAdmin && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline-light"
                  className="w-100 text-start d-flex align-items-center gap-2 p-3"
                  onClick={() => setShowCreateAdmin(true)}
                >
                  <FaUserPlus />
                  <span className="menu-title">Créer Admin</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline-light"
                  className="w-100 text-start d-flex align-items-center gap-2 p-3"
                  onClick={() => setShowAdminsList(true)}
                >
                  <FaUsers />
                  <span className="menu-title">Liste des Admins</span>
                </Button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    );
  };

  

  
    
  

  return (
    <Container fluid className="p-0">
      <div className="d-md-none mobile-header">
        <Button
          variant="link"
          className="text-danger"
          onClick={() => setShowSidebar(true)}
        >
          <FaBars size={24} />
        </Button>
        <h4 className="mb-0 text-secondary">Tableau de bord</h4>
        <div style={{width: '24px'}}></div>
      </div>

      <Row className="g-0">
        <Col md={3} className="bg-dark min-vh-100 p-3 d-none d-md-block">
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SidebarContent />
          </motion.div>
        </Col>

        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          className="bg-dark d-md-none"
        >
          <Offcanvas.Body>
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        <Col md={9} xs={12} className="p-md-4 p-2 content-area">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Profil Administrateur</h4>
              </Card.Header>
              <Card.Body>
                <Row className="g-4">
                  {[
                    { icon: <FaEnvelope />, label: 'Email', value: adminInfo.email },
                    { icon: <FaClock />, label: 'Dernière connexion', value: adminInfo.lastLogin },
                    { icon: <FaCalendarAlt />, label: 'Création du compte', value: adminInfo.creationTime }
                  ].map((item, index) => (
                    <Col md={4} sm={6} xs={12} key={index}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="p-3 bg-light rounded info-card"
                      >
                        <div className="d-flex align-items-center gap-1">
                          <span className="text-primary">{item.icon}</span>
                          <div>
                            <small className="text-muted">{item.label}</small>
                            <p className="mb-0 text-break">{item.value}</p>
                          </div>
                        </div>
                      </motion.div>
                    </Col>
                  ))}
                </Row>

                <div className="mt-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogoutButton variant="danger" className="d-flex align-items-center gap-2 w-md-auto"/>
                  </motion.div>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Modal show={showAdminsList} onHide={() => setShowAdminsList(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Liste des Administrateurs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Email</th>
              <th>Date de création</th>
              <th>Dernière connexion</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminsList.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.email}</td>
                <td>{admin.creationTime}</td>
                <td>{admin.lastLogin}</td>
                <td>
                  {admin.permissions && Object.entries(admin.permissions)
                    .filter(([key, value]) => value)
                    .map(([key]) => key.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                    .join(', ')}
                </td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setAdminPermissions(admin.permissions || {});
                      setShowEditAdmin(true);
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                  >
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>

    </Modal>

        <Modal show={showEditAdmin} onHide={() => setShowEditAdmin(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Modifier les permissions - {selectedAdmin?.email}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleEditAdmin}>
          {Object.keys(adminPermissions).map((permission) => (
            <Form.Check
              key={permission}
              type="switch"
              id={permission}
              label={permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
              checked={adminPermissions[permission]}
              onChange={(e) => setAdminPermissions({
                ...adminPermissions,
                [permission]: e.target.checked
              })}
            />
          ))}
          <Button type="submit" variant="primary" className="mt-3">
            Enregistrer les modifications
          </Button>
        </Form>
      </Modal.Body>
    </Modal>

        {/* Modal pour créer un admin */}
        <Modal show={showCreateAdmin} onHide={() => setShowCreateAdmin(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Créer un nouvel administrateur</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {message.text && (
              <Alert variant={message.type} dismissible
                onClose={() => setMessage({ type: '', text: '' })}>
                {message.text}
              </Alert>
            )}
            <Form onSubmit={handleCreateAdmin}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="Entrez l'email"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="Entrez le mot de passe"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirmer le mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  placeholder="Confirmez le mot de passe"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Permissions</Form.Label>
                {Object.keys(adminPermissions).map((permission) => (
                  <Form.Check
                    key={permission}
                    type="switch"
                    id={`create-${permission}`}
                    label={permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                    checked={adminPermissions[permission]}
                    onChange={(e) => setAdminPermissions({
                      ...adminPermissions,
                      [permission]: e.target.checked
                    })}
                  />
                ))}
              </Form.Group>

              <Button variant="primary" type="submit">
                Créer l'administrateur
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        <style jsx>{`
          .mobile-header {
            background: linear-gradient(145deg,rgb(34, 39, 68),rgb(184, 192, 186));
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
          }

          .bg-dark {
            background: linear-gradient(145deg,rgba(133, 157, 160, 0.91),rgb(206, 157, 157));
          }

          .btn-outline-light:hover {
            background: linear-gradient(145deg, #2196f3,rgb(46, 95, 145));
            border: none;
          }

          .card {
            border: none;
            border-radius: 15px;
            margin-bottom: 1rem;
          }

          .info-card {
            background: #f8f9fa !important;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            height: 100%;
          }

          .content-area {
            margin-top: 0;
            padding-top: 1rem;
          }

          @media (max-width: 768px) {
            .content-area {
              margin-top: 0;
            }

            .menu-title {
              font-size: 0.9rem;
            }

            .info-card {
              font-size: 0.9rem;
            }
          }

          .offcanvas {
            max-width: 80%;
          }
        `}</style>
      </Row>
    </Container>
  );
}

export default Manager;

