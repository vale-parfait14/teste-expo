import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import Select from 'react-select';

const QRRegister = () => {
  const { structureId } = useParams();
  const navigate = useNavigate();
  const [structure, setStructure] = useState(null);
  const [userType, setUserType] = useState(null); // 'doctor' ou 'patient'
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    specialite: '', // Pour médecin uniquement
    age: '', // Pour patient uniquement
    sexe: '', // Pour patient uniquement
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [newDoctor, setNewDoctor] = useState({
    nom: '',
    prenom: '',
    specialite: '',
    telephone: '',
    email: '',
    password: '',
    disponibilite: [],
    photo: null,
    certifications: [],
    heureDebut: '',
    heureFin: '',
    joursDisponibles: [],
    visibility: 'private',
    structures: [],
    maxPatientsPerDay: 1,
    consultationDuration: 30,
    bookedSlots: {},
    insurances: []
  });

  const [newPatient, setNewPatient] = useState({
    nom: '',
    prenom: '',
    age: '',
    sexe: '',
    telephone: '',
    email: '',
    password: '',
    photo: null,
    visibility: 'private',
    structures: [],
    insurances: [],
    documents: [],
    antecedents: []
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [certFiles, setCertFiles] = useState([]);
  const [medicalDocs, setMedicalDocs] = useState([]);

  const insuranceOptions = [
    { value: 'CNAM', label: 'CNAM' },
    { value: 'CNSS', label: 'CNSS' },
    { value: 'CNRPS', label: 'CNRPS' },
    { value: 'Assurance privée', label: 'Assurance privée' },
    { value: 'Autre', label: 'Autre' }
  ];

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        if (structureDoc.exists()) {
          setStructure(structureDoc.data());
        } else {
          setError('Structure non trouvée');
        }
      } catch (err) {
        setError('Erreur lors du chargement de la structure');
      }
    };

    fetchStructure();
  }, [structureId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const commonData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        visibility: 'private'
      };

      // Vérifier si c'est une inscription via structure ou médecin
      if (structureId.startsWith('med_')) {
        // Inscription via médecin
        const doctorId = structureId.replace('med_', '');
        await setDoc(doc(db, 'patients', userCredential.user.uid), {
          ...commonData,
          age: formData.age,
          sexe: formData.sexe,
          medecinId: doctorId,
          status: 'pending'
        });

        // Mettre à jour le médecin
        await updateDoc(doc(db, 'medecins', doctorId), {
          patients: arrayUnion(userCredential.user.uid)
        });
      } else {
        // Inscription via structure (code existant)
        const updateField = userType === 'doctor' ? 'doctors' : 'patients';
        await updateDoc(doc(db, 'structures', structureId), {
          [updateField]: arrayUnion(userCredential.user.uid)
        });

        // Définir le rôle de l'utilisateur
        await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
          role: userType,
          structureId: structureId
        });
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorForm = () => (
    <Form onSubmit={handleSubmit}>
      {/* Copier exactement le même formulaire que dans le modal AddDoctor de StructureDashboard */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              value={newDoctor.nom}
              onChange={(e) => setNewDoctor({...newDoctor, nom: e.target.value})}
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
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={newDoctor.email}
              onChange={(e) => setNewDoctor({...newDoctor, email: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              value={newDoctor.password}
              onChange={(e) => setNewDoctor({...newDoctor, password: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Téléphone</Form.Label>
            <Form.Control
              type="tel"
              value={newDoctor.telephone}
              onChange={(e) => setNewDoctor({...newDoctor, telephone: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Assurances acceptées</Form.Label>
            <Select
              isMulti
              name="insurances"
              options={insuranceOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              value={insuranceOptions.filter(option => 
                newDoctor.insurances?.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                setNewDoctor({
                  ...newDoctor,
                  insurances: selectedOptions.map(option => option.value)
                });
              }}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Heure début</Form.Label>
            <Form.Control
              type="time"
              value={newDoctor.heureDebut}
              onChange={(e) => setNewDoctor({...newDoctor, heureDebut: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Heure fin</Form.Label>
            <Form.Control
              type="time"
              value={newDoctor.heureFin}
              onChange={(e) => setNewDoctor({...newDoctor, heureFin: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre maximum de patients par jour</Form.Label>
            <Form.Control
              type="number"
              value={newDoctor.maxPatientsPerDay}
              onChange={(e) => setNewDoctor({
                ...newDoctor, 
                maxPatientsPerDay: parseInt(e.target.value)
              })}
              min="1"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Durée de consultation (minutes)</Form.Label>
            <Form.Control
              type="number"
              value={newDoctor.consultationDuration}
              onChange={(e) => setNewDoctor({
                ...newDoctor,
                consultationDuration: parseInt(e.target.value)
              })}
              min="15"
              step="15"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Photo</Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => setPhotoFile(e.target.files[0])}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Certifications</Form.Label>
        <Form.Control
          type="file"
          multiple
          onChange={(e) => setCertFiles(Array.from(e.target.files))}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Jours disponibles</Form.Label>
        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
          <Form.Check
            key={day}
            type="checkbox"
            label={day}
            onChange={(e) => {
              if (e.target.checked) {
                setNewDoctor({
                  ...newDoctor,
                  disponibilite: [...newDoctor.disponibilite, day]
                });
              } else {
                setNewDoctor({
                  ...newDoctor,
                  disponibilite: newDoctor.disponibilite.filter(d => d !== day)
                });
              }
            }}
          />
        ))}
      </Form.Group>

      <div className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={() => setUserType(null)}>
          Retour
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </Button>
      </div>
    </Form>
  );

  const renderPatientForm = () => (
    <Form onSubmit={handleSubmit}>
      {/* Copier exactement le même formulaire que dans le modal AddPatient de StructureDashboard */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              type="text"
              value={newPatient.nom}
              onChange={(e) => setNewPatient({...newPatient, nom: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Prénom</Form.Label>
            <Form.Control
              type="text"
              value={newPatient.prenom}
              onChange={(e) => setNewPatient({...newPatient, prenom: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Age</Form.Label>
            <Form.Control
              type="number"
              value={newPatient.age}
              onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Sexe</Form.Label>
            <Form.Select
              value={newPatient.sexe}
              onChange={(e) => setNewPatient({...newPatient, sexe: e.target.value})}
            >
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={newPatient.email}
              onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              value={newPatient.password}
              onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Téléphone</Form.Label>
            <Form.Control
              type="tel"
              value={newPatient.telephone}
              onChange={(e) => setNewPatient({...newPatient, telephone: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Assurance</Form.Label>
            <Select
              isMulti
              name="insurances"
              options={insuranceOptions}
              className="basic-multi-select"
              classNamePrefix="select"
              value={insuranceOptions.filter(option => 
                newPatient.insurances?.includes(option.value)
              )}
              onChange={(selectedOptions) => {
                setNewPatient({
                  ...newPatient,
                  insurances: selectedOptions.map(option => option.value)
                });
              }}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Photo</Form.Label>
        <Form.Control
          type="file"
          onChange={(e) => setPhotoFile(e.target.files[0])}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Documents Médicaux</Form.Label>
        <Form.Control
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setMedicalDocs(Array.from(e.target.files))}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Antécédents médicaux</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={newPatient.antecedents?.join('\n') || ''}
          onChange={(e) => setNewPatient({
            ...newPatient,
            antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
          })}
        />
      </Form.Group>

      <div className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={() => setUserType(null)}>
          Retour
        </Button>
        <Button type="submit" variant="success" disabled={loading}>
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </Button>
      </div>
    </Form>
  );

  if (!structure) {
    return <Container className="mt-5 text-center">Chargement...</Container>;
  }

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Inscription à {structure.name}</h4>
        </Card.Header>
        <Card.Body>
          {!userType ? (
            <div className="text-center">
              <h5 className="mb-4">Je souhaite m'inscrire en tant que :</h5>
              <Row className="justify-content-center">
                <Col md={4}>
                  <Button
                    variant="outline-primary"
                    className="w-100 py-3"
                    onClick={() => setUserType('doctor')}
                  >
                    <i className="fas fa-user-md fa-2x mb-2"></i>
                    <div>Médecin</div>
                  </Button>
                </Col>
                <Col md={4}>
                  <Button
                    variant="outline-success"
                    className="w-100 py-3"
                    onClick={() => setUserType('patient')}
                  >
                    <i className="fas fa-user fa-2x mb-2"></i>
                    <div>Patient</div>
                  </Button>
                </Col>
              </Row>
            </div>
          ) : (
            userType === 'doctor' ? renderDoctorForm() : renderPatientForm()
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default QRRegister;
