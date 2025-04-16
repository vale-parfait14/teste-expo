import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../components/firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence, browserLocalPersistence 
} from 'firebase/auth';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUserShield, FaLock, FaUser, FaUserMd, FaUserPlus, FaEnvelope, FaPhone, FaCalendar, FaImage, FaClock, FaHospital, FaMapMarkerAlt, FaGlobe, FaMobile, FaFile } from 'react-icons/fa';

const General = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState('patient');
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [structures, setStructures] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [typedText, setTypedText] = useState('');
  
  useEffect(() => {
    setMounted(true);
    fetchStructures();
    
    setTimeout(() => {
      setShowLogo(false);
      setShowContent(true);
    }, 5000);
  }, []);

  useEffect(() => {
    const text = 'SEN';
    let index = 0;
    
    const typeWriter = () => {
      if (index < text.length) {
        setTypedText((prev) => prev + text.charAt(index));
        index++;
        setTimeout(typeWriter, 200);
      }
    };
    
    typeWriter();
  }, []);

  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });

  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });

  const [newUser, setNewUser] = useState({
    patient: {
      nom: '',
      prenom: '',
      age: '',
      sexe: '',
      telephone: '',
      email: '',
      password: '',
      adresse: '',
      antecedents: [],
      photo: null,
      visibility: 'private',
      structures: [],
      medecins: []
    },
    doctor: {
      nom: '',
      prenom: '',
      specialite: '',
      telephone: '',
      email: '',
      password: '',
      photo: null,
      certifications: [],
      heureDebut: '',
      heureFin: '',
      joursDisponibles: [],
      structures: [],
      visibility: 'private'
    },
    structure: {
      name: '',
      email: '',
      password: '',
      address: '',
      creationYear: '',
      responsible: '',
      website: '',
      insurance: [],
      phones: {
        mobile: '',
        landline: ''
      },
      photoUrl: null,
      documents: {
        structureDocUrl: null,
        stateDocUrl: null
      }
    }
  });

  const fetchStructures = async () => {
    try {
      const structuresSnapshot = await getDocs(collection(db, "structures"));
      const structuresList = structuresSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setStructures(structuresList);
    } catch (error) {
      setMessage('Erreur lors du chargement des structures');
    }
  };

  const handleRoleChange = (role) => {
    setMessage('');
    setShowRegister(false);
    setActiveRole(role);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const email = `${adminCredentials.username}@admin.com`;
      await signInWithEmailAndPassword(auth, email, adminCredentials.password);
      navigate('/Manager');
    } catch (error) {
      setMessage('Identifiants administrateur incorrects');
    }
    setLoading(false);
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginCredentials.email,
        loginCredentials.password
      );
      const user = userCredential.user;
      const userType = activeRole === 'patient' ? 'patients' :
                      activeRole === 'doctor' ? 'medecins' : 'structures';
      
      const q = query(
        collection(db, userType),
        where('uid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        localStorage.setItem(`${activeRole}Data`, JSON.stringify(userData));
        navigateToUserDashboard(activeRole);
      }
    } catch (error) {
      setMessage('Erreur de connexion: ' + error.message);
    }
    setLoading(false);
  };

  const navigateToUserDashboard = (role) => {
    switch(role) {
      case 'patient':
        navigate('/PatientsDashboard');
        break;
      case 'doctor':
        navigate('/MedecinsDashboard');
        break;
      case 'structure':
        navigate('/structure-dashboard');
        break;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser[activeRole].email,
        newUser[activeRole].password
      );
      const user = userCredential.user;

      let photoUrl = '';
      if (photoFile) {
        const folder = activeRole === 'patient' ? 'patients' : 
                      activeRole === 'doctor' ? 'doctors' : 'structures';
        const photoRef = ref(storage, `${folder}/photos/${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      const userData = {
        ...newUser[activeRole],
        photo: photoUrl,
        dateInscription: new Date().toISOString(),
        uid: user.uid
      };

      const collectionName = activeRole === 'patient' ? 'patients' :
                            activeRole === 'doctor' ? 'medecins' : 'structures';
      const docRef = await addDoc(collection(db, collectionName), userData);
      
      const completeUserData = { id: docRef.id, ...userData };
      localStorage.setItem(`${activeRole}Data`, JSON.stringify(completeUserData));
      navigateToUserDashboard(activeRole);

    } catch (error) {
      setMessage('Erreur lors de l\'inscription: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-0">
      <Row className="w-100 m-0">
      {showLogo && (
        <Col xs={12} className="text-center mb-4">
          <div className="logo-container">
            <Image
              src="/logo.png"
              alt="Logo SEN"
              className="logo"
            />
          </div>
          <h1 className="sen-title">
            <span className="typed-text">{typedText}</span>
            <span className="cursor">|</span>
          </h1>
        </Col>
      )}

        {showContent && (
          <Col xs={12} md={{ span: 8, offset: 2 }} lg={{ span: 6, offset: 3 }} xl={{ span: 5, offset: 3 }} className="p-0">
            <Card className="shadow-lg border-0 rounded-0 rounded-md-lg h-100">
              <Card.Header className="bg-primary text-white p-4">
                <Tabs
                  activeKey={activeRole}
                  onSelect={handleRoleChange}
                  className="mb-0 border-0 nav-fill"
                >
                  <Tab eventKey="patient" title={<><FaUser className="me-2" />Patient</>} />
                  <Tab eventKey="doctor" title={<><FaUserMd className="me-2" />Médecin</>} />
                  <Tab eventKey="structure" title={<><FaHospital className="me-2" />Structure</>} />
                  <Tab eventKey="admin" title={<><FaUserShield className="me-2" />Admin</>} />
                </Tabs>
              </Card.Header>
              {mounted && (
                <Card.Body className="p-4">
                  {message && (
                    <Alert variant="info" onClose={() => setMessage('')} dismissible>
                      {message}
                    </Alert>
                  )}

                  {activeRole === 'admin' ? (
                    <Form key="admin-form" onSubmit={handleAdminLogin} className="animate__animated animate__fadeIn">
                      <h4 className="text-center mb-4">
                        <FaUserShield className="me-2" />
                        Administration
                      </h4>
                      <Form.Group className="mb-3">
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaUser />
                          </span>
                          <Form.Control
                            type="text"
                            placeholder="Nom d'utilisateur"
                            value={adminCredentials.username}
                            onChange={(e) => setAdminCredentials({
                              ...adminCredentials,
                              username: e.target.value
                            })}
                            required
                          />
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaLock />
                          </span>
                          <Form.Control
                            type="password"
                            placeholder="Mot de passe"
                            value={adminCredentials.password}
                            onChange={(e) => setAdminCredentials({
                              ...adminCredentials,
                              password: e.target.value
                            })}
                            required
                          />
                        </div>
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-100 mb-3"
                        disabled={loading}
                      >
                        {loading ? 'Connexion...' : 'Connexion Administrateur'}
                      </Button>
                    </Form>
                  ) : (
                    !showRegister ? (
                      // Login Form for Patient/Doctor/Structure
                      <Form key="login-form" onSubmit={handleUserLogin} className="animate__animated animate__fadeIn">
                        <h4 className="text-center mb-4">
                          {activeRole === 'patient' ? (
                            <><FaUser className="me-2" />Connexion Patient</>
                          ) : activeRole === 'doctor' ? (
                            <><FaUserMd className="me-2" />Connexion Médecin</>
                          ) : (
                            <><FaHospital className="me-2" />Connexion Structure</>
                          )}
                        </h4>
                        
                        <Form.Group className="mb-3">
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaEnvelope />
                            </span>
                            <Form.Control
                              type="email"
                              placeholder="Email"
                              value={loginCredentials.email}
                              onChange={(e) => setLoginCredentials({
                                ...loginCredentials,
                                email: e.target.value
                              })}
                              required
                            />
                          </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaLock />
                            </span>
                            <Form.Control
                              type="password"
                              placeholder="Mot de passe"
                              value={loginCredentials.password}
                              onChange={(e) => setLoginCredentials({
                                ...loginCredentials,
                                password: e.target.value
                              })}
                              required
                            />
                          </div>
                        </Form.Group>

                        <div className="d-grid gap-2">
                          <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Connexion...' : 'Se connecter'}
                          </Button>
                          <Button variant="outline-primary" onClick={() => setShowRegister(true)}>
                            <FaUserPlus className="me-2" />
                            Créer un compte
                          </Button>
                        </div>
                      </Form>
                    ) : (
                      // Registration Form
                      <Form key="register-form" onSubmit={handleRegister} className="animate__animated animate__fadeIn">
                        <h4 className="text-center mb-4">
                          {activeRole === 'patient' ? (
                            <><FaUserPlus className="me-2" />Inscription Patient</>
                          ) : activeRole === 'doctor' ? (
                            <><FaUserMd className="me-2" />Inscription Médecin</>
                          ) : (
                            <><FaHospital className="me-2" />Inscription Structure</>
                          )}
                        </h4>

                        {activeRole !== 'structure' ? (
                          // Patient/Doctor Registration Fields
                          <>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <div className="input-group">
                                    <span className="input-group-text">
                                      <FaUser />
                                    </span>
                                    <Form.Control
                                      type="text"
                                      placeholder="Nom"
                                      value={newUser[activeRole].nom}
                                      onChange={(e) => setNewUser({
                                        ...newUser,
                                        [activeRole]: {...newUser[activeRole], nom: e.target.value}
                                      })}
                                      required
                                    />
                                  </div>
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <div className="input-group">
                                    <span className="input-group-text">
                                      <FaUser />
                                    </span>
                                    <Form.Control
                                      type="text"
                                      placeholder="Prénom"
                                      value={newUser[activeRole].prenom}
                                      onChange={(e) => setNewUser({
                                        ...newUser,
                                        [activeRole]: {...newUser[activeRole], prenom: e.target.value}
                                      })}
                                      required
                                    />
                                  </div>
                                </Form.Group>
                              </Col>
                            </Row>
                            {activeRole === 'patient' ? (
                              <Row>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <div className="input-group">
                                      <span className="input-group-text">
                                        <FaCalendar />
                                      </span>
                                      <Form.Control
                                        type="number"
                                        placeholder="Age"
                                        value={newUser.patient.age}
                                        onChange={(e) => setNewUser({
                                          ...newUser,
                                          patient: {...newUser.patient, age: e.target.value}
                                        })}
                                        required
                                      />
                                    </div>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group className="mb-3">
                                    <div className="input-group">
                                      <span className="input-group-text">
                                        <FaUser />
                                      </span>
                                      <Form.Select
                                        value={newUser.patient.sexe}
                                        onChange={(e) => setNewUser({
                                          ...newUser,
                                          patient: {...newUser.patient, sexe: e.target.value}
                                        })}
                                        required
                                      >
                                        <option value="">Sexe</option>
                                        <option value="M">Masculin</option>
                                        <option value="F">Féminin</option>
                                      </Form.Select>
                                    </div>
                                  </Form.Group>
                                </Col>
                              </Row>
                            ) : (
                              // Doctor specific fields
                              <>
                                <Form.Group className="mb-3">
                                  <div className="input-group">
                                    <span className="input-group-text">
                                      <FaUserMd />
                                    </span>
                                    <Form.Control
                                      type="text"
                                      placeholder="Spécialité"
                                      value={newUser.doctor.specialite}
                                      onChange={(e) => setNewUser({
                                        ...newUser,
                                        doctor: {...newUser.doctor, specialite: e.target.value}
                                      })}
                                      required
                                    />
                                  </div>
                                </Form.Group>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <div className="input-group">
                                        <span className="input-group-text">
                                          <FaClock />
                                        </span>
                                        <Form.Control
                                          type="time"
                                          value={newUser.doctor.heureDebut}
                                          onChange={(e) => setNewUser({
                                            ...newUser,
                                            doctor: {...newUser.doctor, heureDebut: e.target.value}
                                          })}
                                          required
                                        />
                                      </div>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-3">
                                      <div className="input-group">
                                        <span className="input-group-text">
                                          <FaClock />
                                        </span>
                                        <Form.Control
                                          type="time"
                                          value={newUser.doctor.heureFin}
                                          onChange={(e) => setNewUser({
                                            ...newUser,
                                            doctor: {...newUser.doctor, heureFin: e.target.value}
                                          })}
                                          required
                                        />
                                      </div>
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </>
                            )}

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text">
                                  <FaEnvelope />
                                </span>
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                  value={newUser[activeRole].email}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    [activeRole]: {...newUser[activeRole], email: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text">
                                  <FaLock />
                                </span>
                                <Form.Control
                                  type="password"
                                  placeholder="Mot de passe"
                                  value={newUser[activeRole].password}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    [activeRole]: {...newUser[activeRole], password: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text">
                                  <FaPhone />
                                </span>
                                <Form.Control
                                  type="tel"
                                  placeholder="Téléphone"
                                  value={newUser[activeRole].telephone}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    [activeRole]: {...newUser[activeRole], telephone: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text">
                                  <FaImage />
                                </span>
                                <Form.Control
                                  type="file"
                                  onChange={(e) => setPhotoFile(e.target.files[0])}
                                  accept="image/*"
                                />
                              </div>
                            </Form.Group>
                          </>
                        ) : (
                          // Structure Registration Fields
                          <>
                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaHospital /></span>
                                <Form.Control
                                  type="text"
                                  placeholder="Nom de la structure"
                                  value={newUser.structure.name}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, name: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <div className="input-group">
                                    <span className="input-group-text"><FaMobile /></span>
                                    <Form.Control
                                      type="tel"
                                      placeholder="Téléphone mobile"
                                      value={newUser.structure.phones.mobile}
                                      onChange={(e) => setNewUser({
                                        ...newUser,
                                        structure: {
                                          ...newUser.structure,
                                          phones: {...newUser.structure.phones, mobile: e.target.value}
                                        }
                                      })}
                                      required
                                    />
                                  </div>
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <div className="input-group">
                                    <span className="input-group-text"><FaPhone /></span>
                                    <Form.Control
                                      type="tel"
                                      placeholder="Téléphone fixe"
                                      value={newUser.structure.phones.landline}
                                      onChange={(e) => setNewUser({
                                        ...newUser,
                                        structure: {
                                          ...newUser.structure,
                                          phones: {...newUser.structure.phones, landline: e.target.value}
                                        }
                                      })}
                                    />
                                  </div>
                                </Form.Group>
                              </Col>
                            </Row>
                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaMapMarkerAlt /></span>
                                <Form.Control
                                  type="text"
                                  placeholder="Adresse"
                                  value={newUser.structure.address}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, address: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaCalendar /></span>
                                <Form.Control
                                  type="number"
                                  placeholder="Année de création"
                                  value={newUser.structure.creationYear}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, creationYear: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaUser /></span>
                                <Form.Control
                                  type="text"
                                  placeholder="Responsable"
                                  value={newUser.structure.responsible}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, responsible: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaGlobe /></span>
                                <Form.Control
                                  type="url"
                                  placeholder="Site web"
                                  value={newUser.structure.website}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, website: e.target.value}
                                  })}
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaEnvelope /></span>
                                <Form.Control
                                  type="email"
                                  placeholder="Email"
                                  value={newUser.structure.email}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, email: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaLock /></span>
                                <Form.Control
                                  type="password"
                                  placeholder="Mot de passe"
                                  value={newUser.structure.password}
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {...newUser.structure, password: e.target.value}
                                  })}
                                  required
                                />
                              </div>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <div className="input-group">
                                <span className="input-group-text"><FaImage /></span>
                                <Form.Control
                                  type="file"
                                  onChange={(e) => setPhotoFile(e.target.files[0])}
                                  accept="image/*"
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Text>Document de la structure</Form.Text>
                              <div className="input-group">
                                <span className="input-group-text"><FaFile /></span>
                                <Form.Control
                                  type="file"
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {
                                      ...newUser.structure,
                                      documents: {
                                        ...newUser.structure.documents,
                                        structureDocUrl: e.target.files[0]
                                      }
                                    }
                                  })}
                                  accept=".pdf,.doc,.docx"
                                />
                              </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                              <Form.Text>Document d'état</Form.Text>
                              <div className="input-group">
                                <span className="input-group-text"><FaFile /></span>
                                <Form.Control
                                  type="file"
                                  onChange={(e) => setNewUser({
                                    ...newUser,
                                    structure: {
                                      ...newUser.structure,
                                      documents: {
                                        ...newUser.structure.documents,
                                        stateDocUrl: e.target.files[0]
                                      }
                                    }
                                  })}
                                  accept=".pdf,.doc,.docx"
                                />
                              </div>
                            </Form.Group>
                          </>
                        )}
                        <div className="d-grid gap-2 mt-4">
                          <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Inscription...' : 'S\'inscrire'}
                          </Button>
                          <Button variant="outline-primary" onClick={() => setShowRegister(false)}>
                            Déjà inscrit ? Se connecter
                          </Button>
                        </div>
                      </Form>
                    )
                  )}
                </Card.Body>
              )}
            </Card>
          </Col>
        )}
      </Row>

      <style jsx>{`
        .container-fluid {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .logo-container {
          margin-bottom: 2rem;
        }
        
        .logo {
          max-width: 150px;
          height: auto;
          animation: fadeIn 1s ease-in;
        }
        
        .sen-title {
          font-size: 3.5rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .typed-text {
          white-space: nowrap;
          overflow: hidden;
          animation: typing 2s steps(30, end) forwards,
                     blinking 0.8s step-end infinite alternate;
        }
        
        .cursor {
          display: inline-block;
          width: 5px;
          background-color: white;
          animation: blinking 0.8s step-end infinite alternate;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        @keyframes blinking {
          50% {
            background-color: transparent;
          }
        }
        
        @keyframes wiggle {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .input-group-text {
          background-color: #f8f9fa;
          border-right: none;
        }
        
        .form-control {
          border-left: none;
        }
        
        .animate__animated {
          animation-duration: 0.5s;
        }
        
        .nav-tabs .nav-link {
          color: #fff;
          border: none;
          padding: 1rem;
          transition: all 0.3s ease;
        }
        
        .nav-tabs .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .nav-tabs .nav-link.active {
          background-color: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
        }
        
        @media (max-width: 768px) {
          .card {
            min-height: 100vh;
            border-radius: 0 !important;
          }
        }
        
        @media (min-width: 769px) {
          .container-fluid {
            padding: 2rem;
          }
          .card {
            margin: 2rem auto;
            max-width: 1200px;
          }
        }
      `}</style>
    </Container>
  );
};

export default General;