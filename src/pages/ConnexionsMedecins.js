import React, { useState ,useEffect} from 'react';
import { db, storage } from '../components/firebase-config.js';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Container, Row, Col, Card, Form, Button, Alert, Modal,Tabs,Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ConnexionsMedecins = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showRegister, setShowRegister] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const navigate = useNavigate();

    const [newDoctor, setNewDoctor] = useState({
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
      joursDisponibles: [], // Initialize empty array
      structures: [], // Initialize empty array
      visibility: 'private'
  });
  

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            let photoUrl = '';
            if (photoFile) {
                const photoRef = ref(storage, `doctors/profile/${photoFile.name}`);
                await uploadBytes(photoRef, photoFile);
                photoUrl = await getDownloadURL(photoRef);
            }

            const doctorData = {
                ...newDoctor,
                photo: photoUrl,
                dateInscription: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'medecins'), doctorData);
            
            const doctorInfo = {
                id: docRef.id,
                ...doctorData
            };
            
            localStorage.setItem('doctorData', JSON.stringify(doctorInfo));
            navigate('/MedecinsDashboard');

        } catch (error) {
            setError('Erreur lors de l\'inscription');
            console.error('Registration error:', error);
        }
    };

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
          const q = query(
              collection(db, 'medecins'),
              where('email', '==', email),
              where('password', '==', password)
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
              const doctorData = {
                  id: querySnapshot.docs[0].id,
                  ...querySnapshot.docs[0].data()
              };
              localStorage.setItem('doctorData', JSON.stringify(doctorData));
              navigate('/MedecinsDashboard');
          } else {
              setError('Email ou mot de passe incorrect');
          }
      } catch (error) {
          setError('Erreur lors de la connexion');
          console.error('Login error:', error);
      }
  };
  
  const [structures, setStructures] = useState([]);

useEffect(() => {
    const fetchStructures = async () => {
        const structuresCollection = collection(db, "structures");
        const structuresSnapshot = await getDocs(structuresCollection);
        const structuresList = structuresSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        setStructures(structuresList);
    };

    fetchStructures();
}, []);

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white text-center py-3">
                            <h4 className="mb-0">
                                <i className="fas fa-user-md me-2"></i>
                                {showRegister ? 'Inscription Médecin' : 'Connexion Médecin'}
                            </h4>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {error && (
                                <Alert variant="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}
                            
                            {!showRegister ? (
                                <>
                                    <Form onSubmit={handleLogin}>
    <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrez votre email"
            required
        />
    </Form.Group>

    <Form.Group className="mb-3">
        <Form.Label>Mot de passe</Form.Label>
        <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
            required
        />
    </Form.Group>

    <Button 
        variant="primary" 
        type="submit" 
        className="w-100 py-2"
    >
        <i className="fas fa-sign-in-alt me-2"></i>
        Se connecter
    </Button>
</Form>

                                    <div className="text-center mt-3">
                                        <Button 
                                            variant="link" 
                                            onClick={() => setShowRegister(true)}
                                        >
                                            Nouveau médecin ? Inscrivez-vous ici
                                        </Button>
                                    </div>
                                </>
                            ) : (
                              <Form onSubmit={handleRegister}>
                              <Tabs defaultActiveKey="page1" className="mb-4 nav-fill">
                                  <Tab eventKey="page1" title="Informations Personnelles">
                                      <Row>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Nom</Form.Label>
                                                  <Form.Control
                                                      type="text"
                                                      value={newDoctor.nom}
                                                      onChange={(e) => setNewDoctor({...newDoctor, nom: e.target.value})}
                                                      required
                                                  />
                                              </Form.Group>
                                          </Col>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Prénom</Form.Label>
                                                  <Form.Control
                                                      type="text"
                                                      value={newDoctor.prenom}
                                                      onChange={(e) => setNewDoctor({...newDoctor, prenom: e.target.value})}
                                                      required
                                                  />
                                              </Form.Group>
                                          </Col>
                                      </Row>
                          
                                      <Form.Group className="mb-3">
                                          <Form.Label>Spécialité</Form.Label>
                                          <Form.Control
                                              type="text"
                                              value={newDoctor.specialite}
                                              onChange={(e) => setNewDoctor({...newDoctor, specialite: e.target.value})}
                                              required
                                          />
                                      </Form.Group>
                                  </Tab>
                          
                                  <Tab eventKey="page2" title="Contact & Disponibilités">
                                      <Row>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Email</Form.Label>
                                                  <Form.Control
                                                      type="email"
                                                      value={newDoctor.email}
                                                      onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
                                                      required
                                                  />
                                              </Form.Group>
                                          </Col>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Téléphone</Form.Label>
                                                  <Form.Control
                                                      type="tel"
                                                      value={newDoctor.telephone}
                                                      onChange={(e) => setNewDoctor({...newDoctor, telephone: e.target.value})}
                                                      required
                                                  />
                                              </Form.Group>
                                          </Col>
                                      </Row>
                          
                                      <Form.Group className="mb-3">
                                          <Form.Label>Mot de passe</Form.Label>
                                          <Form.Control
                                              type="password"
                                              value={newDoctor.password}
                                              onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
                                              required
                                          />
                                      </Form.Group>
                          
                                      <Row>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Heure de début</Form.Label>
                                                  <Form.Control
                                                      type="time"
                                                      value={newDoctor.heureDebut}
                                                      onChange={(e) => setNewDoctor({...newDoctor, heureDebut: e.target.value})}
                                                  />
                                              </Form.Group>
                                          </Col>
                                          <Col md={6}>
                                              <Form.Group className="mb-3">
                                                  <Form.Label>Heure de fin</Form.Label>
                                                  <Form.Control
                                                      type="time"
                                                      value={newDoctor.heureFin}
                                                      onChange={(e) => setNewDoctor({...newDoctor, heureFin: e.target.value})}
                                                  />
                                              </Form.Group>
                                          </Col>
                                      </Row>
                          
                                      <Form.Group className="mb-3">
                                          <Form.Label>Jours disponibles</Form.Label>
                                          <div className="d-flex flex-wrap gap-3">
                                              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((jour) => (
                                                  <Form.Check
                                                      key={jour}
                                                      type="checkbox"
                                                      label={jour}
                                                      checked={newDoctor.joursDisponibles.includes(jour)}
                                                      onChange={(e) => {
                                                          const updatedJours = e.target.checked
                                                              ? [...newDoctor.joursDisponibles, jour]
                                                              : newDoctor.joursDisponibles.filter(j => j !== jour);
                                                          setNewDoctor({...newDoctor, joursDisponibles: updatedJours});
                                                      }}
                                                  />
                                              ))}
                                          </div>
                                      </Form.Group>
                                  </Tab>
                          
                                  <Tab eventKey="page3" title="Documents & Structures">
                                      <Form.Group className="mb-3">
                                          <Form.Label>Photo de profil</Form.Label>
                                          <Form.Control
                                              type="file"
                                              onChange={(e) => setPhotoFile(e.target.files[0])}
                                              accept="image/*"
                                          />
                                      </Form.Group>
                          
                                      <Form.Group className="mb-3">
                                          <Form.Label>Certifications</Form.Label>
                                          <Form.Control
                                              type="file"
                                              multiple
                                              onChange={(e) => setNewDoctor({...newDoctor, certifications: Array.from(e.target.files)})}
                                              accept=".pdf,.doc,.docx"
                                          />
                                      </Form.Group>
                          
                                      <Form.Group className="mb-3">
                                          <Form.Label>Visibilité</Form.Label>
                                          <Form.Select
                                              value={newDoctor.visibility}
                                              onChange={(e) => setNewDoctor({...newDoctor, visibility: e.target.value})}
                                          >
                                              <option value="private">Privée</option>
                                              <option value="selected">Structures sélectionnées</option>
                                          </Form.Select>
                                      </Form.Group>
                          
                                      {newDoctor.visibility === 'selected' && (
                                          <Form.Group className="mb-3">
                                              <Form.Label>Sélectionner les structures</Form.Label>
                                              <div className="d-flex flex-wrap gap-2">
                                                  {structures.map(structure => (
                                                      <Form.Check
                                                          key={structure.id}
                                                          type="checkbox"
                                                          label={structure.name}
                                                          checked={newDoctor.structures.includes(structure.id)}
                                                          onChange={(e) => {
                                                              const updatedStructures = e.target.checked
                                                                  ? [...newDoctor.structures, structure.id]
                                                                  : newDoctor.structures.filter(id => id !== structure.id);
                                                              setNewDoctor({...newDoctor, structures: updatedStructures});
                                                          }}
                                                      />
                                                  ))}
                                              </div>
                                          </Form.Group>
                                      )}
                                  </Tab>
                              </Tabs>
                          
                              <Button variant="primary" type="submit" className="w-100 py-2">
                                  <i className="fas fa-user-plus me-2"></i>
                                  S'inscrire
                              </Button>

                              <div className="text-center mt-3">
                                        <Button 
                                            variant="link" 
                                            onClick={() => setShowRegister(false)}
                                        >
                                            Déjà inscrit ? Connectez-vous ici
                                        </Button>
                                    </div>

                          </Form>
                          
                            )}
                        </Card.Body>
                        
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ConnexionsMedecins;
