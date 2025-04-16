







import React, { useState, useEffect } from 'react';
import { db, storage,auth } from '../components/firebase-config.js';
import { orderBy,doc, updateDoc, getDoc, addDoc, collection, deleteDoc, query, where, getDocs,onSnapshot,setDoc,arrayUnion,arrayRemove, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Container, Row, Col, Card, Button, Alert, Modal, Form ,ButtonGroup,Dropdown,Offcanvas,Badge,ListGroup} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  sendSignInLinkToEmail,
  sendPasswordResetEmail ,
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {Calendar } from 'react-calendar';
import { QRCodeSVG } from 'qrcode.react';

import './StructureDashboard.css';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select/creatable';

const StructuresDashboard = () => {

  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
const [showProfileSidebar, setShowProfileSidebar] = useState(false);
const [showQRModal, setShowQRModal] = useState(false);


  useEffect(() => {
    if (showMenuSidebar) {
      setShowProfileSidebar(false);
    }
    if (showProfileSidebar) {
      setShowMenuSidebar(false);
    }
  }, [showMenuSidebar, showProfileSidebar]);

  
const [structure, setStructure] = useState(null);
const [doctors, setDoctors] = useState([]);
const [patients, setPatients] = useState([]);
const [message, setMessage] = useState('');
const [showDoctorDetails, setShowDoctorDetails] = useState(false);
const [showPatientDetails, setShowPatientDetails] = useState(false);
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [selectedPatient, setSelectedPatient] = useState(null);
const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
const [photoFile, setPhotoFile] = useState(null);
const [certFiles, setCertFiles] = useState([]);
const [showAssignPatientsModal, setShowAssignPatientsModal] = useState(false);
const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(1);
const [bookedSlots, setBookedSlots] = useState({});
const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState('');
const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
const [appointments, setAppointments] = useState([]);
const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
const [showEditPatientModal, setShowEditPatientModal] = useState(false);


const [showAddToStructureModal, setShowAddToStructureModal] = useState(false);
const [showStructureSearchModal, setShowStructureSearchModal] = useState(false);
const [structures, setStructures] = useState([]);
const [selectedStructure, setSelectedStructure] = useState(null);
const [searchStructureQuery, setSearchStructureQuery] = useState('');
const [loadingStructures, setLoadingStructures] = useState(true);
const [showStructureListModal, setShowStructureListModal] = useState(false);
// Ajoutez cet état dans le composant StructuresDashboard
const [patientRequests, setPatientRequests] = useState([]);


const [viewMode, setViewMode] = useState('calendar'); // 'doctors', 'patients', 'both'
const [displayMode, setDisplayMode] = useState('grid'); // 'grid', 'table'
const [showProfileModal, setShowProfileModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

const [selectedPatientIds, setSelectedPatientIds] = useState([]);
const [selectedDays, setSelectedDays] = useState([]);
const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
const [selectedDay, setSelectedDay] = useState('Lundi');

const [showEditForm, setShowEditForm] = useState(false);
const [pendingChanges, setPendingChanges] = useState(null);
const [editedStructure, setEditedStructure] = useState(null);

const [isEditing, setIsEditing] = useState(false);
const [lastEditDate, setLastEditDate] = useState(null);
const [medicalDocs, setMedicalDocs] = useState([]);
const [previewDocs, setPreviewDocs] = useState([]);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [editMedicalDocs, setEditMedicalDocs] = useState([]);
const [editPreviewDocs, setEditPreviewDocs] = useState([]);
const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState(null);
const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);

// Ajoutez cette fonction pour gérer le clic sur un médecin
const handleDoctorClick = (doctor) => {
setSelectedDoctorDetails(doctor);
setShowDoctorScheduleModal(true);
};

const [insuranceOptions, setInsuranceOptions] = useState([
{ value: 'CNAM', label: 'CNAM' },
{ value: 'CNSS', label: 'CNSS' },
{ value: 'CNRPS', label: 'CNRPS' },
{ value: 'Assurance privée', label: 'Assurance privée' },
{ value: 'Autre', label: 'Autre' }
]);
const [specialtyOptions, setSpecialtyOptions] = useState([
{ value: 'Médecine générale', label: 'Médecine générale' },
{ value: 'Cardiologie', label: 'Cardiologie' },
{ value: 'Pédiatrie', label: 'Pédiatrie' },
{ value: 'Dentisterie', label: 'Dentisterie' },
{ value: 'Dermatologie', label: 'Dermatologie' },
{ value: 'Gynécologie', label: 'Gynécologie' },
{ value: 'Ophtalmologie', label: 'Ophtalmologie' },
{ value: 'Orthopédie', label: 'Orthopédie' },
{ value: 'Neurologie', label: 'Neurologie' },
{ value: 'Psychiatrie', label: 'Psychiatrie' },
{ value: 'ORL', label: 'ORL' },
{ value: 'Rhumatologie', label: 'Rhumatologie' },
{ value: 'Pneumologie', label: 'Pneumologie' },
{ value: 'Endocrinologie', label: 'Endocrinologie' },
{ value: 'Autre', label: 'Autre' }
]);

const [associationRequests, setAssociationRequests] = useState([]);

const auth = getAuth();

const [showAssignedDoctorModal, setShowAssignedDoctorModal] = useState(false);
const [assignedDoctor, setAssignedDoctor] = useState(null);
const [assignedAppointments, setAssignedAppointments] = useState([]);

const [assignedDoctors, setAssignedDoctors] = useState([]);
const [doctorAppointments, setDoctorAppointments] = useState({});

const [showCalendarView, setShowCalendarView] = useState(true);
const [selectedDate, setSelectedDate] = useState(null);
const [calendarAppointments, setCalendarAppointments] = useState({});
const [dailyDoctorSchedule, setDailyDoctorSchedule] = useState([]);
const navigate = useNavigate();


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
consultationDuration: 5, // in minutes
bookedSlots: {},
insurances: []

});


const [showAddPatientModal, setShowAddPatientModal] = useState(false);
const [patientPhotoFile, setPatientPhotoFile] = useState(null);
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

});

const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState({
  doctors: [],
  patients: []
});


// Ajouter ces states au début du composant
const [sortOrder, setSortOrder] = useState('time'); // 'time', 'patient', 'status'
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [lastReorganization, setLastReorganization] = useState({});

const updateAppointmentOrder = async (appointmentId, newOrder) => {
try {
await updateDoc(doc(db, 'appointments', appointmentId), {
  orderNumber: newOrder,
  lastReorganized: new Date().toISOString()
});
} catch (error) {
console.error('Erreur lors de la mise à jour du rendez-vous:', error);
}
};

// Ajouter cette fonction pour gérer la réorganisation des rendez-vous
const moveAppointment = async (appointmentId, direction) => {
try {
const currentAppointments = [...selectedDoctorDetails.appointments];
const currentIndex = currentAppointments.findIndex(apt => apt.id === appointmentId);

if (direction === 'up' && currentIndex > 0) {
  // Échange avec l'élément précédent
  const temp = currentAppointments[currentIndex];
  currentAppointments[currentIndex] = currentAppointments[currentIndex - 1];
  currentAppointments[currentIndex - 1] = temp;
} else if (direction === 'down' && currentIndex < currentAppointments.length - 1) {
  // Échange avec l'élément suivant
  const temp = currentAppointments[currentIndex];
  currentAppointments[currentIndex] = currentAppointments[currentIndex + 1];
  currentAppointments[currentIndex + 1] = temp;
}

// Mettre à jour les numéros d'ordre
const updatedAppointments = currentAppointments.map((apt, index) => ({
  ...apt,
  orderNumber: index + 1
}));

// Mettre à jour Firestore et l'état local
await Promise.all(
  updatedAppointments.map(apt => 
    updateAppointmentOrder(apt.id, apt.orderNumber)
  )
);

// Mettre à jour les deux états
setSelectedDoctorDetails({
  ...selectedDoctorDetails,
  appointments: updatedAppointments
});

setAppointments(prev => {
  const updated = prev.map(apt => {
    const updatedApt = updatedAppointments.find(a => a.id === apt.id);
    return updatedApt || apt;
  });
  return updated;
});

// Mettre à jour la dernière réorganisation
setLastReorganization(prev => ({
  ...prev,
  [appointmentId]: new Date().toLocaleTimeString()
}));

} catch (error) {
console.error('Erreur lors du déplacement du rendez-vous:', error);
}
};
// Fonction de recherche
const handleSearch = (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    setSearchResults({ doctors: [], patients: [] });
    return;
  }

  const searchTerms = query.toLowerCase().split(' ');
  
  // Recherche dans les médecins
  const filteredDoctors = doctors.filter(doctor => {
    const searchableFields = [
      doctor.nom,
      doctor.prenom,
      doctor.specialite,
      doctor.email,
      doctor.telephone,
      ...(doctor.disponibilite || [])
    ].map(field => field?.toLowerCase() || '');

    return searchTerms.every(term =>
      searchableFields.some(field => field.includes(term))
    );
  });

  // Recherche dans les patients
  const filteredPatients = patients.filter(patient => {
    const searchableFields = [
      patient.nom,
      patient.prenom,
      patient.email,
      patient.telephone,
      patient.age?.toString(),
      patient.sexe,
      patient.adresse
    ].map(field => field?.toLowerCase() || '');

    return searchTerms.every(term =>
      searchableFields.some(field => field.includes(term))
    );
  });

  setSearchResults({
    doctors: filteredDoctors,
    patients: filteredPatients
  });
};

const searchBar = (
  <div className="search-container mb-4 p-3 bg-white rounded-3 shadow-sm">
    <Form.Group>
      <Form.Control
        type="text"
        placeholder="Rechercher médecins ou patients... (nom, spécialité, email, téléphone, etc.)"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />
    </Form.Group>
    
    {searchQuery && (
      <div className="search-results mt-3">
        {(searchResults.doctors.length > 0 || searchResults.patients.length > 0) ? (
          <>
            {searchResults.doctors.length > 0 && (
              <div className="doctors-results mb-3">
                <h6 className="text-primary mb-2">
                  <i className="fas fa-user-md me-2"></i>
                  Médecins ({searchResults.doctors.length})
                </h6>
                <div className="list-group">
                  {searchResults.doctors.map(doctor => (
                    <div key={doctor.id} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{doctor.nom} {doctor.prenom}</h6>
                          <p className="mb-1 text-muted small">
                            <span className="me-3">
                              <i className="fas fa-stethoscope me-1"></i>
                              {doctor.specialite}
                            </span>
                            <span>
                              <i className="fas fa-phone me-1"></i>
                              {doctor.telephone}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDoctorDetails(true);
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {searchResults.patients.length > 0 && (
              <div className="patients-results">
                <h6 className="text-success mb-2">
                  <i className="fas fa-users me-2"></i>
                  Patients ({searchResults.patients.length})
                </h6>
                <div className="list-group">
                  {searchResults.patients.map(patient => (
                    <div key={patient.id} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{patient.nom} {patient.prenom}</h6>
                          <p className="mb-1 text-muted small">
                            <span className="me-3">
                              <i className="fas fa-birthday-cake me-1"></i>
                              {patient.age} ans
                            </span>
                            <span>
                              <i className="fas fa-phone me-1"></i>
                              {patient.telephone}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowPatientDetails(true);
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted text-center my-3">
            <i className="fas fa-search me-2"></i>
            Aucun résultat trouvé
          </p>
        )}
      </div>
    )}
    
    <style jsx>{`
      .search-input {
        border-radius: 20px;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border: 1px solid #dee2e6;
        transition: all 0.2s;
      }
      
      .search-input:focus {
        box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
        border-color: #0d6efd;
      }
      
      .search-results {
        max-height: 500px;
        overflow-y: auto;
      }
      
      .list-group-item {
        transition: all 0.2s;
      }
      
      .list-group-item:hover {
        background-color: #f8f9fa;
        transform: translateX(5px);
      }
    `}</style>
  </div>
);

const handleMultipleAssignments = async () => {
  try {
    const assignments = [];
    
    for (const patientId of selectedPatientIds) {
      for (const day of selectedDays) {
        for (const timeSlot of selectedTimeSlots) {
          assignments.push({
            doctorId: selectedDoctor.id,
            patientId,
            timeSlot,
            day,
            status: 'scheduled',
            structureId: structure.id,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    await Promise.all(
      assignments.map(assignment => 
        addDoc(collection(db, 'appointments'), assignment)
      )
    );

    await Promise.all(
      selectedPatientIds.map(patientId =>
        updateDoc(doc(db, 'patients', patientId), {
          medecinId: selectedDoctor.id,
          structureId: structure.id,
          lastUpdated: new Date().toISOString()
        })
      )
    );

    setMessage('Assignations effectuées avec succès');
    setShowAssignPatientsModal(false);
    
    setSelectedPatientIds([]);
    setSelectedDays([]);
    setSelectedTimeSlots([]);
    
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors des assignations');
  }
};


useEffect(() => {
  const structureData = JSON.parse(localStorage.getItem('structureData'));
  if (!structureData) {
    navigate('/');
    return;
  }

  // Real-time structure listener
  const structureUnsubscribe = onSnapshot(
    doc(db, 'structures', structureData.id),
    (doc) => {
      setStructure({ id: doc.id, ...doc.data() });
    }
  );

  // Real-time doctors listener 
  const doctorsUnsubscribe = onSnapshot(
    query(
      collection(db, 'medecins'),
      where('structures', 'array-contains', structureData.id)
    ),
    (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);
    }
  );

  // Real-time patients listener
const patientsUnsubscribe = onSnapshot(
  query(
    collection(db, 'patients'), 
    where('structures', 'array-contains', structureData.id)
  ),
  (snapshot) => {
    const patientsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPatients(patientsData);
  }
);


  // Real-time patient requests listener
const patientRequestsUnsubscribe = onSnapshot(
  query(
    collection(db, 'structureRequests'),
    where('structureId', '==', structureData.id),
    where('status', '==', 'pending')
  ),
  (snapshot) => {
    const requestsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPatientRequests(requestsData);
  }
);

  // Real-time appointments listener
  const appointmentsUnsubscribe = selectedDoctor && onSnapshot(
    query(
      collection(db, 'appointments'),
      where('doctorId', '==', selectedDoctor.id)
    ),
    (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);
    }
  );

  // Real-time association requests listener
  const requestsUnsubscribe = onSnapshot(
    query(
      collection(db, 'associationRequests'),
      where('structureId', '==', structureData.id),
      where('status', '==', 'pending')
    ),
    (snapshot) => {
      setAssociationRequests(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
  );

  // Charger tous les rendez-vous au démarrage
  fetchAllAppointments();
  
  // Cleanup all listeners
  return () => {
    structureUnsubscribe();
    doctorsUnsubscribe();
    patientsUnsubscribe();
    if (appointmentsUnsubscribe) appointmentsUnsubscribe();
    requestsUnsubscribe();
    patientRequestsUnsubscribe(); // Ajoutez cette ligne
  };

}, [navigate, selectedDoctor]);


// Fonction pour gérer les demandes de patients
const handlePatientRequest = async (requestId, patientInfo, accepted) => {
  try {
    const requestRef = doc(db, 'structureRequests', requestId);
    
    if (accepted) {
      // Créer un nouvel utilisateur patient
      let patientData = {
        ...patientInfo,
        structures: [structure.id],
        visibility: 'affiliated',
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Ajouter le patient à la collection patients
      const patientRef = await addDoc(collection(db, 'patients'), patientData);
      
      // Mettre à jour la demande
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedDate: new Date().toISOString(),
        patientDocId: patientRef.id
      });
      
      // Ajouter le patient au tableau local
      const newPatient = { id: patientRef.id, ...patientData };
      setPatients(prevPatients => [...prevPatients, newPatient]);
      
      setMessage('Patient ajouté avec succès');
    } else {
      // Refuser la demande
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectionDate: new Date().toISOString()
      });
      
      setMessage('Demande refusée');
    }
    
    // Retirer la demande de la liste
    setPatientRequests(prev => prev.filter(req => req.id !== requestId));
    
  } catch (error) {
    console.error('Erreur lors du traitement de la demande:', error);
    setMessage('Erreur lors du traitement de la demande');
  }
};


// Fonctions pour gérer les demandes
const handleAssociationResponse = async (requestId, doctorId, accepted) => {
  try {
    if (accepted) {
      // Mise à jour du statut de la demande
      await updateDoc(doc(db, 'associationRequests', requestId), {
        status: 'accepted',
        acceptedDate: new Date().toISOString()
      });

      // Ajout de la structure dans le tableau des structures du médecin
      const doctorRef = doc(db, 'medecins', doctorId);
      await updateDoc(doctorRef, {
        structures: arrayUnion(structure.id),
        visibility: 'affiliated'  // Marquer le médecin comme affilié
      });

      // Récupérer les données du médecin
      const doctorDoc = await getDoc(doctorRef);
      const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

      // Ajouter le médecin au tableau local
      setDoctors(prevDoctors => [...prevDoctors, doctorData]);

      setMessage('Médecin associé avec succès');
    } else {
      await updateDoc(doc(db, 'associationRequests', requestId), {
        status: 'rejected',
        rejectionDate: new Date().toISOString()
      });

      setMessage('Demande refusée');
    }
  } catch (error) {
    console.error('Erreur association:', error);
    setMessage('Erreur lors du traitement de la demande');
  }
};


const sendConfirmationEmail = async (changes) => {
  try {
    const confirmationToken = Math.random().toString(36).substr(2);
    
    // Store pending changes with token
    await setDoc(doc(db, 'pendingChanges', structure.id), {
      changes,
      token: confirmationToken,
      timestamp: new Date().toISOString()
    });

    // Send confirmation email using Firebase Functions
    const sendMail = httpsCallable(functions, 'sendConfirmationEmail');
    await sendMail({
      email: structure.email,
      token: confirmationToken,
      changes: changes
    });

    setMessage('Email de confirmation envoyé');
    setPendingChanges(changes);
  } catch (error) {
    setMessage('Erreur lors de l\'envoi de l\'email');
  }
};

const handleSubmitChanges = async (e) => {
  e.preventDefault();
  const changes = {
    name: editedStructure.name,
    type: editedStructure.type,
    specialite: editedStructure.specialite,
    description: editedStructure.description,
    email: editedStructure.email,
    telephone: editedStructure.telephone,
    adresse: editedStructure.adresse,
    siteWeb: editedStructure.siteWeb,
    horaires: editedStructure.horaires
  };

  await sendConfirmationEmail(changes);
  setShowEditForm(false);
};


const fetchStructureData = async (structureId) => {
  try {
    const structureDoc = await getDoc(doc(db, 'structures', structureId));
    const structureData = { id: structureDoc.id, ...structureDoc.data() };
    setStructure(structureData);

    // Fetch affiliated doctors
    const doctorsPromises = (structureData.affiliatedDoctors || [])
      .map(id => getDoc(doc(db, 'medecins', id)));
    const doctorsData = await Promise.all(doctorsPromises);
    const affiliatedDoctors = doctorsData.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch private doctors
    const privateQuery = query(
      collection(db, 'medecins'),
      where('structures', 'array-contains', structureId),
      where('visibility', '==', 'private')
    );
    const privateDoctorsSnapshot = await getDocs(privateQuery);
    const privateDoctors = privateDoctorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine both types of doctors
    setDoctors([...affiliatedDoctors, ...privateDoctors]);

    // First fetch affiliated patients
    const patientsPromises = (structureData.affiliatedPatients || [])
      .map(id => getDoc(doc(db, 'patients', id)));
    const patientsData = await Promise.all(patientsPromises);
    const affiliatedPatients = patientsData.map(doc => ({ id: doc.id, ...doc.data() }));

    // Then fetch private patients
    const privatePatientQuery = query(
      collection(db, 'patients'),
      where('structures', 'array-contains', structureId),
      where('visibility', '==', 'private')
    );
    const privatePatientSnapshot = await getDocs(privatePatientQuery);
    const privatePatients = privatePatientSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine both types of patients
    setPatients([...affiliatedPatients, ...privatePatients]);

  } catch (error) {
    console.error('Error fetching data:', error);
    setMessage('Erreur lors du chargement des données');
  }
};

const fetchDoctorAppointments = async (doctorId) => {
  try {
    const appointmentsSnapshot = await getDocs(query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      orderBy('orderNumber', 'asc')
    ));

    const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      orderNumber: doc.data().orderNumber || 0
    }));

    setAppointments(appointmentsData);
    
    if (selectedDoctorDetails) {
      setSelectedDoctorDetails({
        ...selectedDoctorDetails,
        appointments: appointmentsData
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
  }
};

const handleAddDoctor = async () => {
  try {
    // Validate required fields
    if (!newDoctor.email || !newDoctor.password || !newDoctor.nom || !newDoctor.prenom) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newDoctor.email,
      newDoctor.password
    );

    // Add doctor role
    await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
      role: 'doctor',
      structureId: structure.id
    });

    let photoUrl = '';
    let certUrls = [];

    if (photoFile) {
      const photoRef = ref(storage, `doctors/${structure.id}/${photoFile.name}`);
      await uploadBytes(photoRef, photoFile);
      photoUrl = await getDownloadURL(photoRef);
    }

    for (const certFile of certFiles) {
      const certRef = ref(storage, `certifications/${structure.id}/${certFile.name}`);
      await uploadBytes(certRef, certFile);
      const certUrl = await getDownloadURL(certRef);
      certUrls.push(certUrl);
    }

    const doctorData = {
      ...newDoctor,
      uid: userCredential.user.uid,
      photo: photoUrl,
      certifications: certUrls,
      structures: [structure.id],
      createdBy: structure.id,
      createdAt: new Date().toISOString(),
      consultationDuration: 30,
      maxPatientsPerDay: 100,
      disponibilite: newDoctor.disponibilite,
      heureDebut: newDoctor.heureDebut,
      heureFin: newDoctor.heureFin,
      status: 'active',
      insurances: newDoctor.insurances || [],

    };

    const docRef = await addDoc(collection(db, 'medecins'), doctorData);
    const newDoctorWithId = { id: docRef.id, ...doctorData };
    
    setDoctors([...doctors, newDoctorWithId]);
    setShowAddDoctorModal(false);
    setMessage('Médecin ajouté avec succès');

    // Reset form
    setNewDoctor({
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
      consultationDuration: 5,
      bookedSlots: {}
    });
    setPhotoFile(null);
    setCertFiles([]);

  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setMessage('Cet email est déjà utilisé');
        break;
      case 'auth/invalid-email':
        setMessage('Format d\'email invalide');
        break;
      case 'auth/weak-password':
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        break;
      default:
        setMessage('Erreur lors de la création: ' + error.message);
    }
    console.error('Error details:', error);
  }
};

  
const handleAddPatient = async () => {
  try {
    // Validate required fields
    if (!newPatient.email || !newPatient.password || !newPatient.nom || !newPatient.prenom) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newPatient.email,
      newPatient.password
    );

    // Add patient role
    await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
      role: 'patient',
      structureId: structure.id
    });

    let photoUrl = '';
    if (patientPhotoFile) {
      const photoRef = ref(storage, `patients/${structure.id}/${patientPhotoFile.name}`);
      await uploadBytes(photoRef, patientPhotoFile);
      photoUrl = await getDownloadURL(photoRef);
    }

    const docUrls = await Promise.all(
      medicalDocs.map(async (file) => {
        const docRef = ref(storage, `patients/${structure.id}/${userCredential.user.uid}/documents/${file.name}`);
        await uploadBytes(docRef, file);
        return getDownloadURL(docRef);
      })
    );

    const patientData = {
      ...newPatient,
      uid: userCredential.user.uid,
      photo: photoUrl,
      documents: docUrls,
      structures: [structure.id],
      createdBy: structure.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      antecedents: [],
      allergies: [],
      traitements: [],
      lastVisit: null,
      nextAppointment: null,
      insurances: newPatient.insurances || [],

    };

    const docRef = await addDoc(collection(db, 'patients'), patientData);
    const newPatientWithId = { id: docRef.id, ...patientData };
    
    setPatients([...patients, newPatientWithId]);
    setShowAddPatientModal(false);
    setMessage('Patient ajouté avec succès');
    
    // Reset form
    setNewPatient({
      nom: '',
      prenom: '',
      age: '',
      sexe: '',
      telephone: '',
      email: '',
      password: '',
      photo: null,
      documents: null,
      visibility: 'private',
      structures: []
    });

    setPatientPhotoFile(null);
    setMedicalDocs([]);
    setPreviewDocs([]);

  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setMessage('Cet email est déjà utilisé');
        break;
      case 'auth/invalid-email':
        setMessage('Format d\'email invalide');
        break;
      case 'auth/weak-password':
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        break;
      default:
        setMessage('Erreur lors de la création: ' + error.message);
    }
    console.error('Error details:', error);
  }
};



const handleDeleteDoctor = async (doctorId) => {
try {
await deleteDoc(doc(db, 'medecins', doctorId));
setDoctors(doctors.filter(d => d.id !== doctorId));
setMessage('Médecin supprimé avec succès');
} catch (error) {
setMessage('Erreur lors de la suppression');
}
};

const handleDeletePatient = async (patientId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId));
    setPatients(patients.filter(p => p.id !== patientId));
    setMessage('Patient supprimé avec succès');
  } catch (error) {
    setMessage('Erreur lors de la suppression');
  }
};

const handleUnaffiliation = async (type, id) => {
  try {
    if (type === 'doctor') {
      // Mise à jour du médecin
      const doctorRef = doc(db, 'medecins', id);
      await updateDoc(doctorRef, {
        structures: arrayRemove(structure.id)
      });

      // Mise à jour des patients
      const patientsQuery = query(
        collection(db, 'patients'),
        where('medecinId', '==', id),
        where('structureId', '==', structure.id)
      );
      
      const patientsSnapshot = await getDocs(patientsQuery);
      const batch = writeBatch(db);
      
      patientsSnapshot.docs.forEach(patientDoc => {
        batch.update(patientDoc.ref, {
          medecinId: null,
          structureId: null
        });
      });
      
      await batch.commit();

      // Mise à jour immédiate de l'interface
      setDoctors(doctors.filter(doc => doc.id !== id));
      setPatients(patients.filter(pat => pat.medecinId !== id));
      
      setMessage('Médecin désaffilié avec succès');
    } else {
      // Mise à jour du patient
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        structures: arrayRemove(structure.id),
        structureId: null,
        medecinId: null,
      });

      setPatients(patients.filter(pat => pat.id !== id));
      setMessage('Patient retiré avec succès');
    }
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors de la modification');
  }
};

const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  let currentTime = new Date(`2000/01/01 ${startTime}`);
  const endDateTime = new Date(`2000/01/01 ${endTime}`);
  
  while (currentTime < endDateTime) {
    slots.push(currentTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
    currentTime.setMinutes(currentTime.getMinutes() + duration);
  }
  
  return slots;
};

const handleCompleteAppointment = async (appointmentId) => {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'completed'
  });
  setAppointments(appointments.map(apt => 
    apt.id === appointmentId ? {...apt, status: 'completed'} : apt
  ));
};

const handleDeleteAppointment = async (appointmentId) => {
  await deleteDoc(doc(db, 'appointments', appointmentId));
  setAppointments(appointments.filter(apt => apt.id !== appointmentId));
};


const refreshDoctorData = async (doctorId) => {
  try {
      const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
      if (doctorDoc.exists()) {
          const updatedDoctor = { id: doctorDoc.id, ...doctorDoc.data() };
          setDoctors(doctors.map(d => d.id === doctorId ? updatedDoctor : d));
      }
  } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
  }
};


const handleEditDoctor = async (doctor) => {
  try {
      const doctorRef = doc(db, 'medecins', doctor.id);
      
      // Créez un objet avec uniquement les champs à mettre à jour
      const updateData = {
          nom: doctor.nom,
          prenom: doctor.prenom,
          specialite: doctor.specialite,
          telephone: doctor.telephone,
          email: doctor.email,
          password: doctor.password,
          disponibilite: doctor.disponibilite || [],
          heureDebut: doctor.heureDebut,
          heureFin: doctor.heureFin,
          maxPatientsPerDay: doctor.maxPatientsPerDay || 1,
          consultationDuration: doctor.consultationDuration || 30,
          joursDisponibles: doctor.joursDisponibles || [],
          insurances: doctor.insurances || [],

      };

      // Mise à jour dans Firestore
      await updateDoc(doctorRef, updateData);

      // Mise à jour locale
      setDoctors(doctors.map(d => d.id === doctor.id ? {...d, ...updateData} : d));
      setShowEditDoctorModal(false);
      setMessage('Médecin modifié avec succès');
      
      // Rafraîchir les données
      await fetchStructureData(structure.id);
  } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setMessage('Erreur lors de la modification du médecin');
  }
};


const handleEditPatient = async (patient) => {
  try {
    const patientRef = doc(db, 'patients', patient.id);
    
    // Utiliser patient.id si uid n'est pas disponible
    const patientIdentifier = patient.uid || patient.id;
    
    // Créer un objet pour stocker les données à mettre à jour
    const updateData = {
      nom: patient.nom,
      prenom: patient.prenom,
      age: patient.age,
      sexe: patient.sexe,
      telephone: patient.telephone,
      email: patient.email,
      insurances: patient.insurances || [],
    };
    
    // Gestion de la photo - ne l'ajouter que si elle est définie
    if (patientPhotoFile) {
      const photoRef = ref(storage, `patients/${structure.id}/${patientIdentifier}/photo`);
      await uploadBytes(photoRef, patientPhotoFile);
      updateData.photo = await getDownloadURL(photoRef);
    } else if (patient.photo) {
      // Conserver la photo existante si aucune nouvelle n'est fournie
      updateData.photo = patient.photo;
    }
    // Ne pas inclure le champ photo si aucune photo n'est disponible

    // Gestion des documents médicaux
    if (editMedicalDocs.length > 0) {
      const newDocUrls = await Promise.all(
        editMedicalDocs.map(async (file) => {
          const docRef = ref(storage, `patients/${structure.id}/${patientIdentifier}/documents/${file.name}`);
          await uploadBytes(docRef, file);
          return getDownloadURL(docRef);
        })
      );
      updateData.documents = [...(patient.documents || []), ...newDocUrls];
    }

    // Mise à jour dans Firestore
    await updateDoc(patientRef, updateData);

    // Mise à jour de l'état local
    setPatients(patients.map(p => p.id === patient.id ? {...p, ...updateData} : p));
    setShowEditPatientModal(false);
    setMessage('Patient modifié avec succès');
    
    // Réinitialisation des états
    setEditMedicalDocs([]);
    setEditPreviewDocs([]);
    setPatientPhotoFile(null);
    
  } catch (error) {
    console.error('Erreur de modification:', error);
    setMessage('Erreur lors de la modification du patient');
  }
};



const handleShowAssignedDoctor = async (patient) => {
  try {
    // Récupérer tous les rendez-vous du patient
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'appointments'),
        where('patientId', '==', patient.id)
      )
    );
    
    // Extraire les IDs uniques des médecins
    const doctorIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().doctorId))];
    
    // Récupérer les informations de tous les médecins
    const doctorsData = await Promise.all(
      doctorIds.map(async (doctorId) => {
        const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
        if (doctorDoc.exists()) {
          return { id: doctorDoc.id, ...doctorDoc.data() };
        }
        return null;
      })
    );

    // Filtrer les médecins null et les organiser avec leurs rendez-vous
    const validDoctors = doctorsData.filter(d => d !== null);
    const appointments = {};
    
    appointmentsSnapshot.docs.forEach(doc => {
      const apt = { id: doc.id, ...doc.data() };
      if (!appointments[apt.doctorId]) {
        appointments[apt.doctorId] = [];
      }
      appointments[apt.doctorId].push(apt);
    });

    setAssignedDoctors(validDoctors);
    setDoctorAppointments(appointments);
    setShowAssignedDoctorModal(true);
    
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors de la récupération des informations');
  }
};

const sendModificationLink = async () => {
  try {
    // Créer un lien de modification sécurisé
    const actionCodeSettings = {
      url: `${window.location.origin}/edit-structure?id=${structure.id}`,
      handleCodeInApp: true
    };

    // Envoyer l'email avec Firebase Auth
    await sendSignInLinkToEmail(auth, structure.email, actionCodeSettings);

    // Sauvegarder l'email pour la vérification
    localStorage.setItem('emailForModification', structure.email);

    setMessage('Un lien de modification a été envoyé à votre email');
    setShowSettingsModal(false);
  } catch (error) {
    setMessage('Erreur lors de l\'envoi du lien: ' + error.message);
  }
};

const handleLogout = async () => {
  try {
    // 1. Sign out from Firebase
    await signOut(auth);
    
    // 2. Clear all localStorage data
    localStorage.clear();
    
    // 3. Navigate to home page
    navigate('/');
    
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

const weekdayOrder = {
  'Lundi': 1,
  'Mardi': 2,
  'Mercredi': 3,
  'Jeudi': 4,
  'Vendredi': 5,
  'Samedi': 6,
  'Dimanche': 7
};

const fadeAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  hover: { scale: 1.02, transition: { duration: 0.3 } }
};

const DoctorCard = ({ doctor, onDetails, onEdit, onDelete, onAssign }) => (
  <div className="card card-hover fade-in">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="doctor-avatar me-3">
          {doctor.photo ? (
            <img 
              src={doctor.photo} 
              alt={doctor.nom}
              className="rounded-circle"
              style={{width: "50px", height: "50px", objectFit: "cover"}}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="fas fa-user-md fa-2x"></i>
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-0">Dr. {doctor.nom} {doctor.prenom}</h5>
          <span className="text-muted">{doctor.specialite}</span>
        </div>
      </div>
      
      <div className="d-flex flex-wrap gap-2 mb-3">
        {doctor.disponibilite?.map(day => (
          <span key={day} className="badge bg-light text-primary">
            {day}
          </span>
        ))}
      </div>

      <div className="action-buttons d-flex gap-2">
        <Button 
          variant="outline-primary" 
          className="btn-float btn-icon-pulse"
          onClick={() => onDetails(doctor)}
        >
          <i className="fas fa-eye me-2"></i>
          Détails
        </Button>
        {/* ... autres boutons ... */}
      </div>
    </div>
  </div>
);

const PatientCard = ({ patient, onDetails, onEdit, onDelete }) => (
  <div className="card card-hover fade-in">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="patient-avatar me-3">
          {patient.photo ? (
            <img 
              src={patient.photo} 
              alt={patient.nom}
              className="rounded-circle"
              style={{width: "50px", height: "50px", objectFit: "cover"}}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="fas fa-user fa-2x"></i>
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-0">{patient.nom} {patient.prenom}</h5>
          <span className="text-muted">{patient.age} ans</span>
        </div>
      </div>
      
      <div className="patient-info mb-3">
        <p className="mb-1">
          <i className="fas fa-phone-alt me-2 text-primary"></i>
          {patient.telephone}
        </p>
        <p className="mb-0">
          <i className="fas fa-envelope me-2 text-primary"></i>
          {patient.email}
        </p>
      </div>

      <div className="action-buttons d-flex gap-2">
        <Button 
          variant="outline-primary" 
          className="btn-float btn-icon-pulse"
          onClick={() => onDetails(patient)}
        >
          <i className="fas fa-eye me-2"></i>
          Détails
        </Button>
        {/* ... autres boutons ... */}
      </div>
    </div>
  </div>
);

const SearchBar = ({ value, onChange }) => (
  <div className="search-container">
    <div className="position-relative">
      <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
      <input
        type="text"
        className="form-control search-input"
        placeholder="Rechercher..."
        value={value}
        onChange={onChange}
      />
    </div>
    {value && (
      <Button
        variant="link"
        className="position-absolute top-50 end-0 translate-middle-y me-2"
        onClick={() => onChange({ target: { value: '' } })}
      >
        <i className="fas fa-ti
        "></i>
      </Button>
    )}
  </div>
);


const fetchAllAppointments = async () => {
  try {
    const structureId = JSON.parse(localStorage.getItem('structureData'))?.id;
    if (!structureId) return;

    // Récupérer tous les rendez-vous de la structure
    const appointmentsSnapshot = await getDocs(query(
      collection(db, 'appointments'),
      where('structureId', '==', structureId)
    ));

    // Organiser les rendez-vous par jour
    const appointmentsByDay = {
      'Lundi': [],
      'Mardi': [],
      'Mercredi': [],
      'Jeudi': [],
      'Vendredi': [],
      'Samedi': [],
      'Dimanche': []
    };

    appointmentsSnapshot.docs.forEach(doc => {
      const appt = { id: doc.id, ...doc.data() };
      if (appt.day) {
        appointmentsByDay[appt.day].push(appt);
      }
    });

    // Récupérer les détails des médecins pour chaque jour
    const dailySchedule = await Promise.all(
      Object.entries(appointmentsByDay).map(async ([day, dayAppointments]) => {
        const doctorIds = [...new Set(dayAppointments.map(apt => apt.doctorId))];
       const doctorsWithAppointments = await Promise.all(
         doctorIds.map(async (doctorId) => {
           const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
           const doctorData = doctorDoc.data();
           
           // Add null check before accessing doctorData
           if (!doctorData) {
             console.warn(`Doctor with ID ${doctorId} not found`);
             return {
               id: doctorId,
               nom: 'Unknown',
               prenom: 'Doctor',
               specialite: 'Unknown',
               heureDebut: '',
               heureFin: '',
               appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
             };
           }
           
           return {
             id: doctorId,
             nom: doctorData.nom,
             prenom: doctorData.prenom,
             specialite: doctorData.specialite,
             heureDebut: doctorData.heureDebut,
             heureFin: doctorData.heureFin,
             appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
           };
         })
       );
        return {
          day,
          doctors: doctorsWithAppointments.filter(d => d.appointments.length > 0)
        };
      })
    );

    setDailyDoctorSchedule(dailySchedule);

    // Sélectionner automatiquement le lundi et son premier médecin
    const mondaySchedule = dailySchedule.find(schedule => schedule.day === 'Lundi');
    if (mondaySchedule && mondaySchedule.doctors.length > 0) {
      setSelectedDoctorDetails(mondaySchedule.doctors[0]);
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    setMessage('Erreur lors de la récupération des rendez-vous');
  }
};

useEffect(() => {
  const structureData = JSON.parse(localStorage.getItem('structureData'));
  if (!structureData) {
    navigate('/');
    return;
  }

  // Initialiser les listeners
  const unsubscribes = [
    // ... existing listeners ...
  ];

  // Charger les rendez-vous immédiatement
  fetchAllAppointments();
  
  // Activer automatiquement la vue calendrier
  setShowCalendarView(true);
  setSelectedDay('Lundi');

  return () => {
    unsubscribes.forEach(unsubscribe => unsubscribe());
  };
}, [navigate]);

const calendarButton = (
  <Button
    variant={showCalendarView ? 'primary' : 'light'}
    onClick={() => {setShowCalendarView(!showCalendarView);
      setShowMenuSidebar(false);

    }
    }
    className="ms-2"
  >
    <i className="fas fa-calendar-alt me-2"></i>
    Calendrier
  </Button>
);



const calendarView = showCalendarView && (
  <Card className="calendar-view-card mb-4 shadow-lg">
    <Card.Header className="bg-gradient bg-primary text-white py-3">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-calendar-alt me-2"></i>
          Planning des rendez-vous
        </h5>
        <p className="mt-1 d-block text-white">
  {new Date().toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace('à', 'à')}
</p>
      </div>
    </Card.Header>
    <Card.Body className="p-0">
      <Row className="g-0">
        {/* Colonne des jours - devient pleine largeur sur mobile */}
        <Col xs={12} md={3} className="border-end-md">
          <div className="weekdays-list p-3">
            <h6 className="text-primary mb-3 d-flex align-items-center">
              <i className="fas fa-calendar-week me-2"></i>
              Jours de la semaine
            </h6>
            <div className="d-md-block d-flex flex-row flex-nowrap overflow-auto">
              {dailyDoctorSchedule.map(({ day, doctors }) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'primary' : 'light'}
                  className="d-flex align-items-center justify-content-between w-100 mb-2 mx-1 py-2 px-3 rounded-pill shadow-sm"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="d-flex align-items-center">
                    <i className={`fas fa-${selectedDay === day ? 'calendar-check' : 'calendar-day'} me-2`}></i>
                    <span className="d-none d-md-inline">{day}</span>
                    <span className="d-md-none">{day.substring(0, 3)}</span>
                  </div>
                  <Badge bg={selectedDay === day ? 'light' : 'primary'}
                    text={selectedDay === day ? 'primary' : 'white'}
                    className="rounded-pill ms-2">
                    {doctors.reduce((total, doctor) => total + doctor.appointments.length, 0)}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Col>

        <Col xs={12} md={9}>
      <div className="daily-schedule p-3 p-md-4">
        {selectedDay ? (
          <>
            <div className="selected-day-header mb-4">
              <h5 className="text-primary mb-3 border-bottom pb-3 d-flex align-items-center flex-wrap">
                <i className="fas fa-clock me-2"></i>
                Planning du {selectedDay}
                <Badge bg="info" className="ms-2 rounded-pill">
                  {dailyDoctorSchedule
                    .find(schedule => schedule.day === selectedDay)?.doctors
                    .reduce((total, doctor) => total + doctor.appointments.length, 0)} rendez-vous
                </Badge>
              </h5>
            </div>

            {dailyDoctorSchedule
              .find(schedule => schedule.day === selectedDay)?.doctors.length > 0 ? (
              dailyDoctorSchedule
                .find(schedule => schedule.day === selectedDay)
                .doctors.map(doctor => (
                  <div 
                    key={doctor.id} 
                    className="doctor-schedule-card mb-3 cursor-pointer" 
                    onClick={() => handleDoctorClick(doctor)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="doctor-header bg-light p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                          <div className="doctor-avatar me-3">
                            <i className="fas fa-user-md fa-2x text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
                            <span className="text-muted small">
                              <i className="fas fa-stethoscope me-2"></i>
                              {doctor.specialite}
                            </span>
                          </div>
                        </div>
                        <Badge bg="primary" className="rounded-pill px-3">
                          <i className="far fa-clock me-2"></i>
                          {doctor.heureDebut} - {doctor.heureFin}
                        </Badge>
                      </div>
                      <div className="mt-2 text-end">
                        <Badge bg="info" className="rounded-pill">
                          <i className="fas fa-calendar-check me-2"></i>
                          {doctor.appointments.length} rendez-vous
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">Aucun médecin disponible ce jour</h6>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5">
            <i className="fas fa-calendar fa-3x text-primary mb-3"></i>
            <h6 className="text-primary">Sélectionnez un jour</h6>
          </div>
        )}
      </div>
    </Col>
        </Row>
    </Card.Body>

    <style jsx>{`
      .calendar-view-card {
        border: none;
        border-radius: 1rem;
        overflow: hidden;
      }

      .border-end-md {
        @media (min-width: 768px) {
          border-right: 1px solid #dee2e6;
        }
      }

      .weekdays-list {
        @media (max-width: 767px) {
          border-bottom: 1px solid #dee2e6;
        }
      }

      .timeline {
        @media (max-width: 767px) {
          padding-left: 40px;
        }
      }

      .appointment-card {
        @media (max-width: 767px) {
          margin-left: 5px;
        }
      }

      /* Ajout des styles pour le scroll horizontal sur mobile */
      .overflow-auto {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }

      /* Optimisations pour les petits écrans */
      @media (max-width: 767px) {
        .doctor-schedule-card {
          margin-bottom: 1rem;
        }

        .time-marker {
          left: -45px;
        }

        .appointment-card {
          padding: 0.75rem !important;
        }
      }
    `}</style>
  </Card>
);




return (
  <Container fluid className="py-4">
    <div className="dashboard-header py-4 px-3 bg-white shadow-sm rounded-3 mb-4">
    <div className="d-flex justify-content-between align-items-center">
{/* Mobile Menu Button */}
<div className="d-lg-none">
<Button
  variant="light"
  className="menu-btn shadow-sm"
  onClick={() => {
    setShowMenuSidebar(true);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-bars"></i>
</Button>
</div>

{/* Desktop Navigation */}
<div className="d-none d-lg-flex align-items-center">
<ButtonGroup className="me-4 shadow-sm">
  <Button
    variant={viewMode === 'both' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('both');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-th-large me-2"></i>
    Tous
  </Button>
  <Button
    variant={viewMode === 'doctors' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('doctors');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-user-md me-2"></i>
    Médecins
  </Button>
  <Button
    variant={viewMode === 'patients' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('patients');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-users me-2"></i>
    Patients
  </Button>
</ButtonGroup>


  {calendarButton}
  <Button
variant="outline-primary"
className="ms-2"
onClick={() => {
setShowQRModal(true);
setShowCalendarView(false);
}}
>
<i className="fas fa-qrcode me-2"></i>
Code QR d'inscription
</Button>
</div>

{/* Mobile Profile Button */}
<div className="d-lg-none">
<Button
  variant="light"
  className="profile-btn shadow-sm"
  onClick={() => {
    setShowProfileSidebar(true);
    setShowMenuSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-user"></i>
</Button>
</div>

{/* Desktop Profile Buttons */}
<div className="d-none d-lg-flex gap-2">
<Button
  variant="light"
  className="btn-icon-hover shadow-sm"
  onClick={() => {
    setShowSettingsModal(true);
    setShowMenuSidebar(false);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-hospital me-2"></i>
  Profil
</Button>

<Button 
  variant="danger" 
  className="w-100 w-md-auto shadow-sm"
  onClick={() => {
    handleLogout();
    setShowMenuSidebar(false);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-sign-out-alt me-md-2"></i>
  <span className="d-none d-md-inline"></span>
  {/*<span className="d-none d-md-inline">Déconnexion</span>
*/}
</Button>

</div>
</div>

{/* Menu Sidebar */}
<Offcanvas show={showMenuSidebar} onHide={() => setShowMenuSidebar(false)} placement="start">
<Offcanvas.Header closeButton>
  <Offcanvas.Title>Menu Navigation</Offcanvas.Title>
</Offcanvas.Header>
<Offcanvas.Body>
  <div className="d-flex flex-column gap-2">
    <Button
      variant={viewMode === 'both' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('both');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-th-large me-2"></i>
      Tous
    </Button>
    <Button
      variant={viewMode === 'doctors' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('doctors');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-user-md me-2"></i>
      Médecins
    </Button>
    <Button
      variant={viewMode === 'patients' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('patients');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-users me-2"></i>
      Patients
    </Button>
    <Button
variant="outline-primary"
className="w-100 text-start"
onClick={() => {
setShowQRModal(true);
setShowCalendarView(false);
}}
>
<i className="fas fa-qrcode me-2"></i>
Code QR d'inscription
</Button>
    <hr />
    <div className="d-flex gap-2 mb-2">
      
      {calendarButton}
    </div>
  </div>
</Offcanvas.Body>
</Offcanvas>

{/* Profile Sidebar */}
<Offcanvas show={showProfileSidebar} onHide={() => setShowProfileSidebar(false)} placement="end">
<Offcanvas.Header closeButton>
  <Offcanvas.Title>Menu Profil</Offcanvas.Title>
</Offcanvas.Header>
<Offcanvas.Body>
  <div className="d-flex flex-column gap-2">
    <Button
      variant="light"
      className="w-100 text-start"
      onClick={() => {
        setShowProfileModal(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-hospital me-2"></i>
      Profil Structure
    </Button>
    <Button
      variant="light"
      className="w-100 text-start"
      onClick={() => {
        setShowSettingsModal(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-cog me-2"></i>
      Paramètres
    </Button>
    <Button 
variant="danger" 
className="w-100 w-md-auto shadow-sm"
onClick={() => {
handleLogout();
setShowCalendarView(false);
}}
>
<i className="fas fa-sign-out-alt me-md-2"></i>
<span className="d-none d-md-inline">Déconnexion</span>
</Button>
  </div>
</Offcanvas.Body>
</Offcanvas>
</div>


    {/* Rest of the JSX */}
    {searchBar}
    {calendarView}
    
    {message && (
      <Alert variant="info" className="mb-4">
        {message}
      </Alert>
    )}


{/* Section des demandes de patients */}
{patientRequests.length > 0 && (
  <Card className="mb-4">
    <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">
        <i className="fas fa-user-plus me-2"></i>
        Demandes de patients ({patientRequests.length})
      </h5>
      <Badge bg="light" text="dark" pill>
        {patientRequests.length} en attente
      </Badge>
    </Card.Header>
    <Card.Body className="p-0">
      <ListGroup variant="flush">
        {patientRequests.map(request => (
          <ListGroup.Item key={request.id} className="p-3">
            <Row className="align-items-center">
              <Col md={2} className="text-center mb-3 mb-md-0">
                {request.patientInfo.photoURL ? (
                  <img 
                    src={request.patientInfo.photoURL} 
                    alt={request.patientInfo.nom}
                    className="rounded-circle"
                    style={{width: "60px", height: "60px", objectFit: "cover"}}
                  />
                ) : (
                  <div className="avatar-placeholder rounded-circle bg-light d-flex align-items-center justify-content-center" style={{width: "60px", height: "60px"}}>
                    <i className="fas fa-user fa-2x text-secondary"></i>
                  </div>
                )}
              </Col>
              <Col md={6}>
                <h6 className="mb-1">{request.patientInfo.nom} {request.patientInfo.prenom}</h6>
                <p className="mb-1 text-muted small">
                  <i className="fas fa-birthday-cake me-1"></i>
                  {request.patientInfo.age} ans
                  <span className="mx-2">|</span>
                  <i className="fas fa-venus-mars me-1"></i>
                  {request.patientInfo.sexe}
                </p>
                <p className="mb-0 text-muted small">
                  <i className="fas fa-envelope me-1"></i>
                  {request.patientInfo.email}
                  <span className="mx-2">|</span>
                  <i className="fas fa-phone me-1"></i>
                  {request.patientInfo.telephone}
                </p>
                {request.patientInfo.insurances && request.patientInfo.insurances.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">Assurances:</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {request.patientInfo.insurances.map((insurance, idx) => (
                        <span key={idx} className="badge bg-light text-dark">{insurance}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <div className="d-flex flex-column flex-md-row gap-2 justify-content-md-end">
                  <Button
                    variant="success"
                    size="sm"
                    className="rounded-pill px-3"
                    onClick={() => handlePatientRequest(request.id, request.patientInfo, true)}
                  >
                    <i className="fas fa-check me-1"></i>
                    Accepter
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="rounded-pill px-3"
                    onClick={() => handlePatientRequest(request.id, request.patientInfo, false)}
                  >
                    <i className="fas fa-times me-1"></i>
                    Refuser
                  </Button>
                  {request.documents && request.documents.length > 0 && (
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => {
                        // Vous pouvez ajouter une fonction pour prévisualiser les documents
                        setPreviewDocs(request.documents);
                        setShowPreviewModal(true);
                      }}
                    >
                      <i className="fas fa-file-medical me-1"></i>
                      Documents ({request.documents.length})
                    </Button>
                  )}
                </div>
                <small className="text-muted d-block mt-2">
                  <i className="fas fa-clock me-1"></i>
                  Demande reçue le {new Date(request.requestDate?.toDate()).toLocaleDateString()}
                </small>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card.Body>
  </Card>
)}



    {/* Ajouter dans le JSX, avant la liste des médecins */}
    {associationRequests.length > 0 && (
      <Card className="mb-4">
        <Card.Header className="bg-warning">
          <h5>Demandes d'association ({associationRequests.length})</h5>
        </Card.Header>
        <Card.Body>
          {associationRequests.map(request => (
            <div key={request.id} className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6>Dr. {request.doctorInfo.nom} {request.doctorInfo.prenom}</h6>
                <p className="text-muted mb-0">{request.doctorInfo.specialite}</p>
              </div>
              <div>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => handleAssociationResponse(request.id, request.doctorId, true)}
                >
                  Accepter
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAssociationResponse(request.id, request.doctorId, false)}
                >
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>
    )}
    <Row>
      {(viewMode === 'both' || viewMode === 'doctors') && (
        <Col md={viewMode === 'both' ? 6 : 12}>
          <Card className="doctor-card mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-user-md me-2"></i>
                  Médecins
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  className="rounded-pill px-3"
                  onClick={() => setShowAddDoctorModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Ajouter un médecin privé
                </Button>
              </div>
            </Card.Header>
            <style jsx>{`
              .card-body-scroll {
                  padding: 0;
                  height: calc(100vh - 200px);
                  overflow: hidden;
              }

              .doctor-list-container {
                  height: 100%;
                  overflow-y: auto;
                  padding: 1rem;
              }

              .doctor-grid {
                  display: grid;
                  gap: 1rem;
                  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              }

              .doctor-item {
                  background: white;
                  border-radius: 8px;
                  border: 1px solid rgba(0,0,0,0.1);
                  transition: transform 0.2s;
              }

              .doctor-content {
                  padding: 1rem;
              }

              .doctor-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 1rem;
              }

              .doctor-name {
                  font-weight: 600;
                  margin-bottom: 0.25rem;
              }

              .doctor-specialty {
                  color: #6c757d;
                  margin: 0;
                  font-size: 0.9rem;
              }

              .status-badge {
                  padding: 0.25rem 0.75rem;
                  border-radius: 20px;
                  font-size: 0.8rem;
                  display: inline-flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .badge-private {
                  background: #17a2b8;
                  color: white;
              }

              .badge-affiliated {
                  background: #28a745;
                  color: white;
              }

              .actions-wrapper {
                  overflow-x: auto;
                  margin: 0 -0.5rem;
              }

              .actions-row {
                  display: flex;
                  gap: 0.5rem;
                  padding: 0.5rem;
                  min-width: min-content;
              }

              .action-button {
                  white-space: nowrap;
                  display: inline-flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              @media (max-width: 768px) {
                  .card-body-scroll {
                      height: calc(100vh - 150px);
                  }

                  .doctor-grid {
                      grid-template-columns: 1fr;
                  }

                  .actions-row {
                      padding: 0.25rem;
                      gap: 0.25rem;
                  }

                  .action-button {
                      padding: 0.25rem 0.5rem;
                      font-size: 0.8rem;
                  }
              }
            `}</style>

            <Card.Body className="card-body-scroll">
              <div className="doctor-cards-container">
                <div className="doctor-cards-scroll px-3 py-2">
                  {doctors.map(doctor => (
                    <div key={doctor.id} className="doctor-card-item">
                      <div className="doctor-info p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0">{doctor.nom} {doctor.prenom}</h6>
                          <span className={`badge ${doctor.visibility === 'private' ? 'bg-info' : 'bg-success'}`}>
                            {doctor.visibility === 'private' ? 'Privé' : 'Affilié'}
                          </span>
                        </div>
                        <p className="text-muted mb-3">
                          <i className="fas fa-stethoscope me-2"></i>
                          {doctor.specialite}
                        </p>
                        
                        <div className="insurances-section mb-3">
<p className="text-muted mb-2">
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées:
</p>
<div className="insurance-tags">
{doctor.insurances ? (
  doctor.insurances.map((insurance, index) => (
    <span key={index} className="insurance-tag">
      {insurance}{index < doctor.insurances.length - 1 ? ', ' : ''}
    </span>
  ))
) : (
  <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
)}
</div>
</div>
                        <div className="actions-scroll-container">
                          <div className="actions-scroll">
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowDoctorDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i> Détails
                            </Button>

                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowEditDoctorModal(true);
                              }}
                            >
                              <i className="fas fa-edit me-1"></i> Modifier
                            </Button>

                            {doctor.visibility === 'private' ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-btn"
                                onClick={() => handleDeleteDoctor(doctor.id)}
                              >
                                <i className="fas fa-trash me-1"></i> Supprimer
                              </Button>
                            ) : (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="action-btn"
                                onClick={() => handleUnaffiliation('doctor', doctor.id)}
                              >
                                <i className="fas fa-unlink me-1"></i> Désaffilier
                              </Button>
                            )}

                            <Button
                              variant="outline-success"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowAssignPatientsModal(true);
                              }}
                            >
                              <i className="fas fa-user-plus me-1"></i> Assigner
                            </Button>

                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                fetchDoctorAppointments(doctor.id);
                                setShowAppointmentsModal(true);
                              }}
                            >
                              <i className="fas fa-calendar me-1"></i> Rendez-vous
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )}

      {(viewMode === 'both' || viewMode === 'patients') && (
        <Col md={viewMode === 'both' ? 6 : 12}>
          <Card className="patient-card shadow-sm">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-users me-2"></i>
                  Patients
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  className="rounded-pill px-3"
                  onClick={() => setShowAddPatientModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Ajouter un patient privé
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="card-body-scroll">
              <div className="patient-list-container">
                <div className="patient-grid">
                  {patients.map(patient => (
                    <div key={patient.id} className="patient-item">
                      <div className="patient-content">
                        <div className="patient-header">
                          <div className="patient-info">
                            <h6 className="patient-name">{patient.nom} {patient.prenom}</h6>
                            <p className="patient-age">
                              <i className="fas fa-birthday-cake me-2"></i>
                              {patient.age} ans
                            </p>
                          </div>
                          <span className={`status-badge ${patient.visibility === 'private' ? 'badge-private' : 'badge-affiliated'}`}>
                            <i className={`fas ${patient.visibility === 'private' ? 'fa-lock' : 'fa-link'}`}></i>
                            {patient.visibility === 'private' ? 'Privé' : 'Affilié'}
                          </span>
                        </div>

                        <div className="actions-wrapper">
                          <div className="actions-row">
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-button"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientDetails(true);
                              }}
                            >
                              <i className="fas fa-eye"></i> Détails
                            </Button>

                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="action-button"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowEditPatientModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i> Modifier
                            </Button>

                            {patient.visibility === 'private' ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-button"
                                onClick={() => handleDeletePatient(patient.id)}
                              >
                                <i className="fas fa-trash"></i> Supprimer
                              </Button>
                            ) : (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="action-button"
                                onClick={() => handleUnaffiliation('patient', patient.id)}
                              >
                                <i className="fas fa-unlink"></i> Désaffilier
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="action-button"
                              onClick={() => handleShowAssignedDoctor(patient)}
                              disabled={!patient.medecinId}
                            >
                              <i className="fas fa-user-md"></i> Médecin assigné
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <style jsx>
                {`

                .insurance-tags {
display: flex;
flex-wrap: wrap;
gap: 0.5rem;
margin-top: 0.5rem;
}

.insurance-tag {
background-color: #e9ecef;
color: #495057;
padding: 0.25rem 0.75rem;
border-radius: 1rem;
font-size: 0.8rem;
display: inline-flex;
align-items: center;
transition: all 0.2s;
}

.insurance-tag:hover {
background-color: #dee2e6;
transform: translateY(-1px);
}

                  .card-body-scroll {
                    padding: 0;
                    height: calc(100vh - 200px);
                    overflow: hidden;
                  }

                  .patient-list-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 1rem;
                  }

                  .patient-grid {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  }

                  .patient-item {
                    background: white;
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                  }

                  .patient-content {
                    padding: 1rem;
                  }

                  .patient-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                  }

                  .patient-name {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                  }

                  .patient-age {
                    color: #6c757d;
                    margin: 0;
                    font-size: 0.9rem;
                  }

                  .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                  }

                  .badge-private {
                    background: #17a2b8;
                    color: white;
                  }

                  .badge-affiliated {
                    background: #28a745;
                    color: white;
                  }

                  .actions-wrapper {
                    overflow-x: auto;
                    margin: 0 -0.5rem;
                  }

                  .actions-row {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    min-width: min-content;
                  }

                  .action-button {
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                  }

                  @media (max-width: 768px) {
                    .card-body-scroll {
                      height: calc(100vh - 150px);
                    }

                    .patient-grid {
                      grid-template-columns: 1fr;
                    }

                    .actions-row {
                      padding: 0.25rem;
                      gap: 0.25rem;
                    }

                    .action-button {
                      padding: 0.25rem 0.5rem;
                      font-size: 0.8rem;
                    }
                  }
                `}
              </style>
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>

    {/* Add Doctor Modal */}
    <Modal show={showAddDoctorModal} onHide={() => setShowAddDoctorModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un médecin privé</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
<Form.Label>
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées
</Form.Label>
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
onCreateOption={(inputValue) => {
  // Créer une nouvelle option pour l'assurance personnalisée
  const newOption = { value: inputValue, label: inputValue };
  // Mettre à jour les options d'assurance
  setInsuranceOptions([...insuranceOptions, newOption]);
  // Mettre à jour les assurances sélectionnées
  setNewDoctor({
    ...newDoctor,
    insurances: [...(newDoctor.insurances || []), inputValue]
  });
}}
isCreatable={true}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les assurances..."
noOptionsMessage={() => "Aucune option disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
<Form.Text className="text-muted">
Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
</Form.Text>
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddDoctorModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleAddDoctor}>
          Ajouter
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Edit Doctor Modal */}
    <Modal show={showEditDoctorModal} onHide={() => setShowEditDoctorModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier le médecin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.nom || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, nom: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.prenom || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, prenom: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Spécialité</Form.Label>
            <Form.Control
              type="text"
              value={selectedDoctor?.specialite || ''}
              onChange={(e) => setSelectedDoctor({...selectedDoctor, specialite: e.target.value})}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedDoctor?.email || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe:</Form.Label>
                <Form.Control
                  type="password"
                  value={selectedDoctor?.password || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, password: e.target.value})}
                />
              </Form.Group>
            </Col>
            
          </Row>
          <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={selectedDoctor?.telephone || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, telephone: e.target.value})}
                />
              </Form.Group>
            </Col>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>
  <i className="fas fa-file-medical me-2"></i>
  Assurances acceptées
</Form.Label>
<Select
  isMulti
  isCreatable
  name="insurances"
  options={insuranceOptions}
  className="basic-multi-select"
  classNamePrefix="select"
  value={insuranceOptions.filter(option => 
    selectedDoctor?.insurances?.includes(option.value)
  )}
  onChange={(selectedOptions) => {
    setSelectedDoctor({
      ...selectedDoctor,
      insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
    });
  }}
  onCreateOption={(inputValue) => {
    const newOption = { value: inputValue, label: inputValue };
    setInsuranceOptions([...insuranceOptions, newOption]);
    setSelectedDoctor({
      ...selectedDoctor,
      insurances: [...(selectedDoctor?.insurances || []), inputValue]
    });
  }}
  formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
  placeholder="Sélectionnez ou saisissez les assurances..."
  noOptionsMessage={() => "Aucune option disponible"}
  styles={{
    control: (base) => ({
      ...base,
      borderRadius: '0.375rem',
      borderColor: '#dee2e6',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0d6efd'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e9ecef',
      borderRadius: '0.25rem'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#495057'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#495057',
      ':hover': {
        backgroundColor: '#dc3545',
        color: 'white'
      }
    })
  }}
/>
<Form.Text className="text-muted">
  Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
</Form.Text>
</Form.Group>
</Col>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Heure début</Form.Label>
                <Form.Control
                  type="time"
                  value={selectedDoctor?.heureDebut || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, heureDebut: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Heure fin</Form.Label>
                <Form.Control
                  type="time"
                  value={selectedDoctor?.heureFin || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, heureFin: e.target.value})}
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
                  value={selectedDoctor?.maxPatientsPerDay || 0}
                  onChange={(e) => setSelectedDoctor({
                    ...selectedDoctor,
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
                  value={selectedDoctor?.consultationDuration || 30}
                  onChange={(e) => setSelectedDoctor({
                    ...selectedDoctor,
                    consultationDuration: parseInt(e.target.value)
                  })}
                  min="15"
                  step="15"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Jours disponibles</Form.Label>
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
              <Form.Check
                key={day}
                type="checkbox"
                label={day}
                checked={selectedDoctor?.disponibilite?.includes(day) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDoctor({
                      ...selectedDoctor,
                      disponibilite: [...(selectedDoctor?.disponibilite || []), day]
                    });
                  } else {
                    setSelectedDoctor({
                      ...selectedDoctor,
                      disponibilite: selectedDoctor?.disponibilite?.filter(d => d !== day) || []
                    });
                  }
                }}
              />
            ))}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditDoctorModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={() => handleEditDoctor(selectedDoctor)}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Doctor Details Modal */}
    <Modal show={showDoctorDetails} onHide={() => setShowDoctorDetails(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Détails du Médecin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedDoctor && (
          <div>
            <Row>
              <Col md={6}>
                {selectedDoctor.photo && (
                  <img
                    src={selectedDoctor.photo}
                    alt={`${selectedDoctor.nom}`}
                    className="img-fluid rounded mb-3"
                  />
                )}
              </Col>
              <Col md={6}>
                <h4>{selectedDoctor.nom} {selectedDoctor.prenom}</h4>
                <p><strong>Spécialité:</strong> {selectedDoctor.specialite}</p>
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Téléphone:</strong> {selectedDoctor.telephone}</p>
                <p><strong>Disponibilités:</strong></p>
                <ul>
                  {selectedDoctor.disponibilite?.map(day => (
                    <li key={day}>{day}</li>
                  ))}
                </ul>
                <p><strong>Horaires:</strong> {selectedDoctor.heureDebut} - {selectedDoctor.heureFin}</p>
                {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
                  <div>
                    <p><strong>Certifications:</strong></p>
                    {selectedDoctor.certifications.map((cert, index) => (
                      <Button
                        key={index}
                        variant="link"
                        href={cert}
                        target="_blank"
                      >
                        Certification {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal.Body>
    </Modal>

    {/* Add Patient Modal */}
    <Modal show={showAddPatientModal} onHide={() => setShowAddPatientModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un patient privé</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurance
  </Form.Label>
  <Select
    isMulti
    isCreatable
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
        insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
      });
    }}
    onCreateOption={(inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      setNewPatient({
        ...newPatient,
        insurances: [...(newPatient.insurances || []), inputValue]
      });
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
  />
</Form.Group>
</Col>
</Row>
          <Form.Group className="mb-3">
            <Form.Label>Photo</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setPatientPhotoFile(e.target.files[0])}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-file-medical me-2"></i>
              Documents Médicaux
            </Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                setMedicalDocs(files);
                
                // Create preview URLs
                const previews = files.map(file => ({
                  name: file.name,
                  url: URL.createObjectURL(file)
                }));
                setPreviewDocs(previews);
              }}
            />
            {previewDocs.length > 0 && (
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <i className="fas fa-eye me-2"></i>
                  Prévisualiser les documents ({previewDocs.length})
                </Button>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleAddPatient}>
          Ajouter
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-medical me-2"></i>
          Documents Médicaux
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="documents-grid">
          {previewDocs.map((doc, index) => (
            <div key={index} className="document-preview-card">
              {doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                <img 
                  src={doc.url} 
                  alt={doc.name}
                  className="img-fluid rounded"
                />
              ) : (
                <div className="pdf-preview">
                  <i className="fas fa-file-pdf fa-3x text-danger"></i>
                  <p className="mt-2">{doc.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>

    <style jsx>{`

    .basic-multi-select {
.select__control--is-focused {
border-color: #0d6efd !important;
box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
}

.select__multi-value {
background-color: #e7f5ff !important;
border-radius: 20px !important;
padding: 2px 8px !important;
}

.select__multi-value__remove {
border-radius: 50% !important;
padding: 2px !important;
margin-left: 4px !important;
}
}
      .documents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }
      
      .document-preview-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
      }
      
      .pdf-preview {
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
      }
    `}</style>

    {/* Patient Details Modal */}
    <Modal show={showPatientDetails} onHide={() => setShowPatientDetails(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Détails du Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedPatient && (
          <div>
            <Row>
              <Col md={6}>
                {selectedPatient.photo && (
                  <img
                    src={selectedPatient.photo}
                    alt={`${selectedPatient.nom}`}
                    className="img-fluid rounded mb-3"
                  />
                )}
              </Col>
              <Col md={6}>
                <h4>{selectedPatient.nom} {selectedPatient.prenom}</h4>
                <p><strong>Age:</strong> {selectedPatient.age}</p>
                <p><strong>Sexe:</strong> {selectedPatient.sexe}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p><strong>Téléphone:</strong> {selectedPatient.telephone}</p>
                <p><strong>Adresse:</strong> {selectedPatient.adresse}</p>
                {/*<p><strong>Mot de passe:</strong>{selectedPatient.password}</p>*/}
              
                {selectedPatient.antecedents && (
                  <div>
                    <p><strong>Antécédents médicaux:</strong></p>
                    <ul>
                      {selectedPatient.antecedents.map((ant, index) => (
                        <li key={index}>{ant}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}
        <div className="mb-3">
<p><strong>Assurances:</strong></p>
<div className="insurance-tags">
{selectedPatient?.insurances && selectedPatient.insurances.length > 0 ? (
  selectedPatient.insurances.map((insurance, index) => (
    <span key={index} className="insurance-tag">
      {insurance}
      {index < selectedPatient.insurances.length - 1 ? ', ' : ''}
    </span>
  ))
) : (
  <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
)}
</div>
</div>
        <div className="documents-section mt-4">
          <h5 className="mb-3">
            <i className="fas fa-file-medical me-2"></i>
            Documents Médicaux
          </h5>
          <div className="documents-grid">
            {selectedPatient?.documents?.map((docUrl, index) => (
              <div key={index} className="document-item">
                {docUrl.includes('.pdf') ? (
                  <a 
                    href={docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-file-pdf me-2"></i>
                    Document {index + 1}
                  </a>
                ) : (
                  <img 
                    src={docUrl} 
                    alt={`Document ${index + 1}`}
                    className="img-fluid rounded"
                    onClick={() => window.open(docUrl, '_blank')}
                    style={{cursor: 'pointer'}}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>

    {/* Assign Patients Modal */}
    <Modal show={showAssignPatientsModal} onHide={() => setShowAssignPatientsModal(false)} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-user-md me-2"></i>
          Assignations multiples - Dr. {selectedDoctor?.nom}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light p-4">
        <Form>
          {/* Days Selection */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-calendar-day me-2"></i>
                  Jours disponibles
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {selectedDoctor?.disponibilite.map(day => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(day) ? "primary" : "outline-primary"}
                      className="rounded-pill shadow-sm"
                      onClick={() => {
                        setSelectedDays(prev =>
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                    >
                      <i className="far fa-calendar me-1"></i>
                      {day}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Time Slots */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-clock me-2"></i>
                  Créneaux horaires
                </Form.Label>
                <div className="time-slots-container">
                  {generateTimeSlots(
                    selectedDoctor?.heureDebut,
                    selectedDoctor?.heureFin,
                    selectedDoctor?.consultationDuration
                  ).map(slot => (
                    <Button
                      key={slot}
                      variant={selectedTimeSlots.includes(slot) ? "primary" : "outline-primary"}
                      className="rounded-pill shadow-sm m-1"
                      onClick={() => {
                        setSelectedTimeSlots(prev =>
                          prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                        );
                      }}
                    >
                      <i className="far fa-clock me-1"></i>
                      {slot}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Patients Selection */}
          <Row>
            <Col md={12}>
              <span className="badge bg-primary">
                <i className="fas fa-users me-1"></i>
                {selectedPatientIds.length} patient(s) sélectionné(s)
              </span>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-users me-2"></i>
                  Sélection des patients
                </Form.Label>
                
                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setSelectedPatientIds(patients.map(p => p.id))}
                    className="me-2 rounded-pill"
                  >
                    <i className="fas fa-check-double me-1"></i>
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSelectedPatientIds([])}
                    className="rounded-pill"
                  >
                    <i className="fas fa-times me-1"></i>
                    Tout désélectionner
                  </Button>
                </div>

                <div className="patients-list">
                  {patients.map(patient => (
                    <div key={patient.id} className="patient-item p-2 rounded hover-effect">
                      <Form.Check
                        type="checkbox"
                        className="d-flex align-items-center"
                        label={
                          <div className="ms-2">
                            <span className="fw-bold">{patient.nom} {patient.prenom}</span>
                            <small className="text-muted ms-2">
                              <i className="fas fa-phone-alt me-1"></i>
                              {patient.telephone}
                            </small>
                          </div>
                        }
                        checked={selectedPatientIds.includes(patient.id)}
                        onChange={(e) => {
                          setSelectedPatientIds(prev =>
                            e.target.checked
                              ? [...prev, patient.id]
                              : prev.filter(id => id !== patient.id)
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                <style jsx>
                  {`
                    .time-slots-container {
                      max-height: 200px;
                      overflow-y: auto;
                      padding: 10px;
                      border-radius: 8px;
                    }

                    .patients-list {
                      max-height: 300px;
                      overflow-y: auto;
                      border: 1px solid #dee2e6;
                      border-radius: 8px;
                      padding: 10px;
                    }

                    .patient-item {
                      transition: background-color 0.2s ease;
                    }

                    .patient-item:hover {
                      background-color: #f8f9fa;
                    }

                    .hover-effect {
                      transition: transform 0.2s ease;
                    }

                    .hover-effect:hover {
                      transform: translateX(5px);
                    }

                    /* Scrollbar styling */
                    .time-slots-container::-webkit-scrollbar,
                    .patients-list::-webkit-scrollbar {
                      width: 6px;
                    }

                    .time-slots-container::-webkit-scrollbar-track,
                    .patients-list::-webkit-scrollbar-track {
                      background: #f1f1f1;
                    }

                    .time-slots-container::-webkit-scrollbar-thumb,
                    .patients-list::-webkit-scrollbar-thumb {
                      background: #888;
                      border-radius: 3px;
                    }
                  `}
                </style>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div className="selected-count">
              
            </div>
            <div className='d-flex'> 
              <Button
                variant="outline-secondary"
                onClick={() => setShowAssignPatientsModal(false)}
                className="me-2 rounded-pill"
              >
                <i className="fas fa-times me-1"></i>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleMultipleAssignments}
                disabled={!selectedPatientIds.length || !selectedDays.length || !selectedTimeSlots.length}
                className="rounded-pill"
              >
                <i className="fas fa-check me-1"></i>
                Confirmer les assignations
              </Button>
            </div>
          </div>
        </div>
      </Modal.Footer>
    </Modal>

    {/* Edit Patient Modal */}
    <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier le patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.nom || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, nom: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.prenom || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, prenom: e.target.value})}
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
                  value={selectedPatient?.age || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, age: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  value={selectedPatient?.sexe || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, sexe: e.target.value})}
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
                  value={selectedPatient?.email || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                />
              </Form.Group>
            </Col>
            {/*
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  value={selectedPatient?.password || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, password: e.target.value})}
                />
              </Form.Group>
            </Col>
            */}
            
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={selectedPatient?.telephone || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, telephone: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Adresse</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.adresse || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, adresse: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Antécédents médicaux</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={selectedPatient?.antecedents?.join('\n') || ''}
              onChange={(e) => setSelectedPatient({
                ...selectedPatient,
                antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
              })}
            />
          </Form.Group>
        
<Form.Group className="mb-3">
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurance
  </Form.Label>  
  <Select
    isMulti
    isCreatable
    name="insurances" 
    options={insuranceOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={insuranceOptions.filter(option => 
      selectedPatient?.insurances?.includes(option.value)
    )}
    onChange={(selectedOptions) => {
      setSelectedPatient({
        ...selectedPatient,
        insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
      });
    }}
    onCreateOption={(inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      setSelectedPatient({
        ...selectedPatient, 
        insurances: [...(selectedPatient?.insurances || []), inputValue]
      });
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
  />
</Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              <i className="fas fa-camera me-2"></i>
              Photo du patient
            </Form.Label>
            
            <div className="current-photo-container text-center p-3 bg-light rounded mb-3">
              {selectedPatient?.photo ? (
                <div className="position-relative d-inline-block">
                  <img 
                    src={selectedPatient.photo} 
                    alt="Photo actuelle" 
                    className="rounded-circle shadow"
                    style={{
                      height: '150px',
                      width: '150px',
                      objectFit: 'cover',
                      border: '4px solid white'
                    }}
                  />
                  <div className="photo-label mt-2 text-muted">
                    <small>Photo actuelle</small>
                  </div>
                </div>
              ) : (
                <div className="default-avatar">
                  <i className="fas fa-user-circle fa-5x text-secondary"></i>
                  <div className="mt-2 text-muted">
                    <small>Aucune photo</small>
                  </div>
                </div>
              )}
            </div>

            <div className="upload-section">
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                className="form-control-sm"
              />
              <small className="text-muted mt-1 d-block">
                Formats acceptés: JPG, PNG, GIF
              </small>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Documents Médicaux Actuels</Form.Label>
            <div className="current-docs mb-2">
              {selectedPatient?.documents?.map((doc, index) => (
                <Button 
                  key={index}
                  variant="outline-info"
                  size="sm"
                  className="me-2 mb-2"
                  onClick={() => window.open(doc, '_blank')}
                >
                  <i className="fas fa-file-medical me-2"></i>
                  Document {index + 1}
                </Button>
              ))}
            </div>
            
            <Form.Label>Ajouter de nouveaux documents</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setEditMedicalDocs(files);
                
                const previews = files.map(file => ({
                  name: file.name,
                  url: URL.createObjectURL(file)
                }));
                setEditPreviewDocs(previews);
              }}
            />
            
            {editPreviewDocs.length > 0 && (
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <i className="fas fa-eye me-2"></i>
                  Prévisualiser les nouveaux documents ({editPreviewDocs.length})
                </Button>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={() => handleEditPatient(selectedPatient)}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showAppointmentsModal} onHide={() => setShowAppointmentsModal(false)} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-calendar-alt me-2"></i>
          Rendez-vous de {selectedDoctor?.nom}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light">
        {/* Days selection */}
        <div className="mb-4 p-3 bg-white rounded shadow-sm">
          <h6 className="text-primary mb-3">
            <i className="fas fa-clock me-2"></i>
            Sélectionner un jour:
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            {[...new Set(appointments.map(app => app.day))]
              .sort((a, b) => weekdayOrder[a] - weekdayOrder[b])
              .map(day => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "primary" : "outline-primary"}
                  onClick={() => setSelectedDay(day)}
                  className="rounded-pill shadow-sm"
                >
                  <i className="far fa-calendar me-1"></i>
                  {day}
                </Button>
              ))}
          </div>
        </div>

        {/* Appointments list */}
        <div className="appointments-container">
{appointments
.filter(app => !selectedDay || app.day === selectedDay)
.sort((a, b) => {
  if (a.orderNumber && b.orderNumber) {
    return a.orderNumber - b.orderNumber;
  }
  const dayDiff = weekdayOrder[a.day] - weekdayOrder[b.day];
  if (dayDiff !== 0) return dayDiff;
  return a.timeSlot.localeCompare(b.timeSlot);
})
.map((appointment, index) => {
  const patient = patients.find(p => p.id === appointment.patientId);
  return (
    <div key={appointment.id} className="mb-3 p-4 bg-white rounded shadow-sm hover-effect">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <span className="badge bg-primary rounded-circle me-2">
            {appointment.orderNumber || index + 1}
          </span>
          <h6 className="text-primary mb-0">
            <i className="fas fa-user me-2"></i>
            {patient?.nom} {patient?.prenom}
          </h6>
        </div>
        <span className={`badge ${appointment.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
          {appointment.status}
        </span>
      </div>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <p className="mb-1">
                        <i className="far fa-calendar-alt me-2 text-muted"></i>
                        <strong>Jour:</strong>
                      </p>
                      <p className="text-muted">{appointment.day || 'Non spécifié'}</p>
                    </div>
                    
                    <div className="col-md-4">
                      <p className="mb-1">
                        <i className="far fa-clock me-2 text-muted"></i>
                        <strong>Horaire:</strong>
                      </p>
                      <p className="text-muted">{appointment.timeSlot}</p>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="success"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleCompleteAppointment(appointment.id)}
                      >
                        <i className="fas fa-check me-1"></i>
                        Marquer comme terminé
                      </Button>
                    )}
                    {appointment.status === 'completed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        <style jsx>
          {`
            .hover-effect {
              transition: transform 0.2s ease-in-out;
            }

            .hover-effect:hover {
              transform: translateY(-2px);
            }

            .appointments-container {
              max-height: 60vh;
              overflow-y: auto;
              padding-right: 5px;
            }

            .appointments-container::-webkit-scrollbar {
              width: 6px;
            }

            .appointments-container::-webkit-scrollbar-track {
              background: #f1f1f1;
            }

            .appointments-container::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 3px;
            }
          `}
        </style>
      </Modal.Body>
    </Modal>

    <Modal 
      show={showProfileModal} 
      onHide={() => setShowProfileModal(false)}
      dialogClassName="modal-right"
      className="sidebar-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-hospital-alt me-2"></i>
          Profil de la Structure
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {structure && (
          <div className="structure-profile">
            <div className="profile-header text-center p-4 bg-light">
              {structure.photo ? (
                <img 
                  src={structure.photo} 
                  alt={structure.name}
                  className="img-fluid rounded-circle profile-image mb-3"
                  style={{width: '150px', height: '150px', objectFit: 'cover'}}
                />
              ) : (
                <div className="default-avatar mb-3">
                  <i className="fas fa-hospital fa-4x"></i>
                </div>
              )}
              <h3 className="fw-bold">{structure.name}</h3>
              <span className="badge bg-success">Structure Médicale</span>
            </div>

            <div className="profile-content p-4">

              <div className="info-section mb-4">
                <h5 className="section-title border-bottom pb-2">
                  <i className="fas fa-chart-bar me-2"></i>
                  Statistiques
                </h5>
                <div className="info-item">
                  <p><strong>Nombre de médecins:</strong> {doctors.length}</p>
                  <p><strong>Nombre de patients:</strong> {patients.length}</p>
                  <p><strong>Date d'inscription:</strong> {new Date(structure.dateInscription).toLocaleDateString()}</p>
                </div>
              </div>

            
            </div>
          </div>
        )}
      
      </Modal.Body>
    </Modal>

    <Modal 
      show={showSettingsModal} 
      onHide={() => setShowSettingsModal(false)} 
      size="lg"
      dialogClassName="modal-90w"
      className="structure-settings-modal"
    >
      <Modal.Header closeButton className="bg-gradient bg-primary text-white py-3">
        <Modal.Title className="d-flex align-items-center">
          <i className="fas fa-hospital-alt me-3 fa-2x"></i>
          <div>
            <h5 className="mb-0">{isEditing ? 'Modifier les informations' : 'Profil de la Structure'}</h5>
            <small>{structure?.name}</small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div className="structure-profile bg-light">
          <div className="profile-header text-center p-4 bg-white shadow-sm">
            <div className="position-relative d-inline-block">
              {structure?.photoUrl ? (
                <img
                  src={structure.photoUrl}
                  alt={structure.name}
                  className="img-fluid rounded-circle profile-image mb-3 shadow"
                  style={{width: '150px', height: '150px', objectFit: 'cover'}}
                />
              ) : (
                <div className="default-avatar mb-3 rounded-circle bg-primary bg-opacity-10 p-4">
                  <i className="fas fa-hospital fa-4x text-primary"></i>
                </div>
              )}
              {!isEditing && (
                <Button 
                  variant="primary"
                  size="sm"
                  className="position-absolute bottom-0 end-0 rounded-circle p-2"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-pencil-alt"></i>
                </Button>
              )}
            </div>
            <h3 className="fw-bold mb-2">{structure?.name}</h3>
            <span className="badge bg-success rounded-pill px-3 py-2">
              <i className="fas fa-check-circle me-2"></i>
              Structure Médicale
            </span>
          </div>

          <div className="profile-content p-4">
            {!isEditing ? (
              <div className="view-mode">
                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Informations Générales
                  </h5>
                  <div className="info-item p-3">
                    <Row className="g-3">
                      <Col md={6}>
                        <p className="mb-2">
                          <i className="fas fa-envelope text-primary me-2"></i>
                          <strong>Email:</strong> {structure?.email}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-mobile-alt text-primary me-2"></i>
                          <strong>Mobile:</strong> {structure?.phones?.mobile}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-phone text-primary me-2"></i>
                          <strong>Fixe:</strong> {structure?.phones?.landline}
                        </p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-2">
                          <i className="fas fa-map-marker-alt text-primary me-2"></i>
                          <strong>Adresse:</strong> {structure?.address}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-calendar-alt text-primary me-2"></i>
                          <strong>Création:</strong> {structure?.creationYear}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-user text-primary me-2"></i>
                          <strong>Responsable:</strong> {structure?.responsible}
                        </p>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-file-medical me-2"></i>
                    Assurances acceptées
                  </h5>
                  <div className="info-item p-3">
                    <div className="d-flex flex-wrap gap-2">
                      {structure?.insurance?.map((ins, index) => (
                        <span key={index} className="badge bg-info rounded-pill px-3 py-2">
                          <i className="fas fa-check-circle me-2"></i>
                          {ins}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
<div className="info-section mb-4 bg-white rounded shadow-sm">
<h5 className="section-title border-bottom pb-2">
<i className="fas fa-stethoscope me-2"></i>
Spécialités médicales gérées
</h5>
<div className="info-item p-3">
<div className="d-flex flex-wrap gap-2">
  {structure?.specialties?.map((specialty, index) => (
    <span key={index} className="badge bg-primary rounded-pill px-3 py-2">
      <i className="fas fa-user-md me-2"></i>
      {specialty}
    </span>
  ))}
  {(!structure?.specialties || structure.specialties.length === 0) && (
    <p className="text-muted fst-italic mb-0">
      Aucune spécialité spécifiée
    </p>
  )}
</div>
</div>
</div>

                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-chart-bar me-2"></i>
                    Statistiques
                  </h5>
                  <div className="info-item p-3">
                    <Row className="g-3">
                      <Col md={4}>
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{doctors.length}</h3>
                            <small>Médecins</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="card bg-success text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{patients.length}</h3>
                            <small>Patients</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="card bg-info text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{structure?.dateInscription ? new Date(structure.dateInscription).toLocaleDateString() : '-'}</h3>
                            <small>Inscription</small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    className="me-2 rounded-pill px-4"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Modifier les informations
                  </Button>

                  <Button
                    variant="outline-primary"
                    onClick={async () => {
                      try {
                        await sendPasswordResetEmail(auth, structure.email);
                        setMessage('Email de réinitialisation envoyé');
                      } catch (error) {
                        setMessage('Erreur: ' + error.message);
                      }
                    }}
                    className="rounded-pill px-4"
                  >
                    <i className="fas fa-lock me-2"></i>
                    Réinitialiser le mot de passe
                  </Button>
                </div>
              </div>
            ) : (
              <div className="edit-mode bg-white rounded shadow-sm p-4">
                <Form className="structure-edit-form">
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-building me-2"></i>
                          Nom de la structure
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.name || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, name: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              name: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-envelope me-2"></i>
                          Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={structure?.email || ''}
                          disabled
                          className="bg-light rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-mobile-alt me-2"></i>
                          Téléphone mobile
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          value={structure?.phones?.mobile || ''}
                          onChange={async (e) => {
                            const updatedStructure = {
                              ...structure,
                              phones: {...structure.phones, mobile: e.target.value}
                            };
                            await updateDoc(doc(db, 'structures', structure.id), {
                              'phones.mobile': e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-phone me-2"></i>
                          Téléphone fixe
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          value={structure?.phones?.landline || ''}
                          onChange={async (e) => {
                            const updatedStructure = {
                              ...structure,
                              phones: {...structure.phones, landline: e.target.value}
                            };
                            await updateDoc(doc(db, 'structures', structure.id), {
                              'phones.landline': e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-calendar-alt me-2"></i>
                          Année de création
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={structure?.creationYear || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, creationYear: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              creationYear: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-user me-2"></i>
                          Responsable
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.responsible || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, responsible: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              responsible: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Adresse
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={structure?.address || ''}
                      onChange={async (e) => {
                        const updatedStructure = {...structure, address: e.target.value};
                        await updateDoc(doc(db, 'structures', structure.id), {
                          address: e.target.value
                        });
                        setStructure(updatedStructure);
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-globe me-2"></i>
                      Site web
                    </Form.Label>
                    <Form.Control
                      type="url"
                      value={structure?.website || ''}
                      onChange={async (e) => {
                        const updatedStructure = {...structure, website: e.target.value};
                        await updateDoc(doc(db, 'structures', structure.id), {
                          website: e.target.value
                        });
                        setStructure(updatedStructure);
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>

<Form.Group className="mb-4">
<Form.Label>
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées
</Form.Label>
<Select
isMulti
isCreatable
name="insurances"
options={insuranceOptions}
className="basic-multi-select"
classNamePrefix="select"
value={structure?.insurance?.map(insurance => ({
  value: insurance,
  label: insurance
})) || []}
onChange={async (selectedOptions) => {
  const insuranceArray = selectedOptions.map(option => option.value);
  const updatedStructure = { ...structure, insurance: insuranceArray };
  await updateDoc(doc(db, 'structures', structure.id), {
    insurance: insuranceArray
  });
  setStructure(updatedStructure);
}}
onCreateOption={async (inputValue) => {
  const newOption = { value: inputValue, label: inputValue };
  setInsuranceOptions([...insuranceOptions, newOption]);
  const updatedInsurance = [...(structure?.insurance || []), inputValue];
  const updatedStructure = { ...structure, insurance: updatedInsurance };
  await updateDoc(doc(db, 'structures', structure.id), {
    insurance: updatedInsurance
  });
  setStructure(updatedStructure);
}}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les assurances..."
noOptionsMessage={() => "Aucune assurance disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
</Form.Group>
                
<Form.Group className="mb-4">
<Form.Label>
<i className="fas fa-stethoscope me-2"></i>
Spécialités médicales gérées
</Form.Label>
<Select
isMulti
isCreatable
name="specialties"
options={specialtyOptions}
className="basic-multi-select"
classNamePrefix="select"
value={structure?.specialties?.map(specialty => ({
  value: specialty,
  label: specialty
})) || []}
onChange={async (selectedOptions) => {
  const specialtiesArray = selectedOptions.map(option => option.value);
  const updatedStructure = { ...structure, specialties: specialtiesArray };
  // Sauvegarder dans Firestore
  await updateDoc(doc(db, 'structures', structure.id), {
    specialties: specialtiesArray
  });
  setStructure(updatedStructure);
}}
onCreateOption={async (inputValue) => {
  const newOption = { value: inputValue, label: inputValue };
  setSpecialtyOptions([...specialtyOptions, newOption]);
  const updatedSpecialties = [...(structure?.specialties || []), inputValue];
  const updatedStructure = { ...structure, specialties: updatedSpecialties };
  // Sauvegarder dans Firestore
  await updateDoc(doc(db, 'structures', structure.id), {
    specialties: updatedSpecialties
  });
  setStructure(updatedStructure);
}}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les spécialités..."
noOptionsMessage={() => "Aucune spécialité disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
</Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-camera me-2"></i>
                      Photo de la structure
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const photoRef = ref(storage, `structures/${structure.id}/photo`);
                          await uploadBytes(photoRef, file);
                          const photoUrl = await getDownloadURL(photoRef);
                          await updateDoc(doc(db, 'structures', structure.id), {
                            photoUrl: photoUrl
                          });
                          setStructure({...structure, photoUrl: photoUrl});
                        }
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>
                </Form>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top">
        {isEditing ? (
          <div className="w-100 d-flex justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={() => setIsEditing(false)}
              className="rounded-pill px-4"
            >
              <i className="fas fa-times me-2"></i>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={() => {
                setIsEditing(false);
                setMessage('Modifications enregistrées');
              }}
              className="rounded-pill px-4"
            >
              <i className="fas fa-save me-2"></i>
              Enregistrer
            </Button>
          </div>
        ) : (
          <div className="w-100 text-end">
            <Button
              variant="secondary"
              onClick={() => setShowSettingsModal(false)}
              className="rounded-pill px-4"
            >
              <i className="fas fa-times me-2"></i>
              Fermer
            </Button>
          </div>
        )}
      </Modal.Footer>

      <style jsx>{`
        .structure-settings-modal .modal-content {
          border-radius: 1rem;
          overflow: hidden;
        }

        .profile-image {
          transition: transform 0.3s ease;
          border: 4px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .profile-image:hover {
          transform: scale(1.05);
        }

        .info-section {
          transition: transform 0.2s ease;
        }

        .info-section:hover {
          transform: translateY(-2px);
        }

        .section-title {
          color: #2c3e50;
          font-weight: 600;
        }

        .info-item p {
          margin-bottom: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background: #f8f9fa;
          transition: background-color 0.2s ease;
        }

        .info-item p:hover {
          background: #e9ecef;
        }

        .structure-edit-form .form-control {
          border: 1px solid #dee2e6;
          padding: 0.75rem 1.25rem;
          transition: all 0.2s ease;
        }

        .structure-edit-form .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
        }

        .card {
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-3px);
        }
      `}</style>
    </Modal>

    <Modal 
      show={showAssignedDoctorModal} 
      onHide={() => setShowAssignedDoctorModal(false)}
      size="lg"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-user-md me-2"></i>
          Médecins et Rendez-vous 
          </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {assignedDoctors.length > 0 ? (
          assignedDoctors.map(doctor => (
            <div key={doctor.id} className="assigned-doctor-info mb-4">
              <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                <h5 className="border-bottom pb-2 text-primary">
                  <i className="fas fa-user-md me-2"></i>
                  Dr. {doctor.nom} {doctor.prenom}
                </h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                    <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                    <p><strong>Email:</strong> {doctor.email}</p>
                    <p><strong>Structure:</strong>{structure?.name}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                    <p><strong>Jours disponibles:</strong></p>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {doctor.disponibilite?.map(day => (
                        <span key={day} className="badge bg-info">{day}</span>
                      ))}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="appointments-section">
                <h6 className="text-muted mb-3">Rendez-vous avec ce médecin à {structure?.name}</h6>
                {doctorAppointments[doctor.id]?.length > 0 ? (
                  <div className="appointments-list">
                    {doctorAppointments[doctor.id]
                      .sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day])
                      .map(apt => (
                        <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="mb-1">
                                <i className="fas fa-calendar-day me-2 text-primary"></i>
                                <strong>Jour:</strong> {apt.day}
                              </p>
                              <p className="mb-0">
                                <i className="fas fa-clock me-2 text-primary"></i>
                                <strong>Heure:</strong> {apt.timeSlot}
                              </p>
                            </div>
                            <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4">
            <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
            <p>Aucun médecin assigné pour le moment</p>
          </div>
        )}
      </Modal.Body>
    </Modal>

    <Modal 
show={showDoctorScheduleModal} 
onHide={() => {
setShowDoctorScheduleModal(false);
setSelectedDoctorDetails(null);
}}
size="lg"
>
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
  <i className="fas fa-calendar-check me-2"></i>
  Rendez-vous du Dr. {selectedDoctorDetails?.nom} {selectedDoctorDetails?.prenom}
</Modal.Title>
</Modal.Header>
<Modal.Body>
<div className="doctor-info mb-4 p-3 bg-light rounded">
  <Row>
    <Col md={6}>
      <p className="mb-2">
        <i className="fas fa-stethoscope me-2 text-primary"></i>
        <strong>Spécialité:</strong> {selectedDoctorDetails?.specialite}
      </p>
    </Col>
    <Col md={6}>
      <p className="mb-2">
        <i className="fas fa-clock me-2 text-primary"></i>
        <strong>Horaires:</strong> {selectedDoctorDetails?.heureDebut} - {selectedDoctorDetails?.heureFin}
      </p>
    </Col>
  </Row>
</div>

<div className="d-flex justify-content-between align-items-center mb-4">
  <h6 className="mb-0">Rendez-vous du {selectedDay}</h6>
  <ButtonGroup size="sm">
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => 
          a.timeSlot.localeCompare(b.timeSlot)
        );
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-clock me-2"></i>
      Par heure
    </Button>
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
          const patientA = patients.find(p => p.id === a.patientId)?.nom;
          const patientB = patients.find(p => p.id === b.patientId)?.nom;
          return patientA?.localeCompare(patientB);
        });
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-user me-2"></i>
      Par patient
    </Button>
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return 0;
        });
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-tasks me-2"></i>
      Par statut
    </Button>
  </ButtonGroup>
</div>

<div className="appointments-list">
{selectedDoctorDetails?.appointments?.length > 0 ? (
<div className="list-group">
{selectedDoctorDetails.appointments.map((apt, index) => {
  const patient = patients.find(p => p.id === apt.patientId);
  return (
    <div 
      key={apt.id} 
      className="list-group-item list-group-item-action appointment-item"
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="me-3">
          <span className="badge bg-primary rounded-circle">
            {apt.orderNumber || index + 1}
          </span>
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold text-primary">
            <i className="fas fa-clock me-2"></i>
            {apt.timeSlot}
          </div>
          <div className="mt-2">
            <div className="fw-bold">{patient?.nom} {patient?.prenom}</div>
            <small className="text-muted">
              <i className="fas fa-phone me-2"></i>
              {patient?.telephone}
            </small>
            {lastReorganization[apt.id] && (
              <div className="mt-1">
                <small className="text-muted fst-italic">
                  <i className="fas fa-history me-1"></i>
                  Dernière modification: {lastReorganization[apt.id]}
                </small>
              </div>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge 
            bg={apt.status === 'completed' ? 'success' : 'warning'}
            className="rounded-pill"
          >
            {apt.status === 'completed' ? 'Terminé' : 'En attente'}
          </Badge>
          <ButtonGroup vertical size="sm">
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="btn-icon"
              onClick={() => moveAppointment(apt.id, 'up')}
              disabled={index === 0}
            >
              <i className="fas fa-arrow-up"></i>
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="btn-icon"
              onClick={() => moveAppointment(apt.id, 'down')}
              disabled={index === selectedDoctorDetails.appointments.length - 1}
            >
              <i className="fas fa-arrow-down"></i>
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
})}
</div>
) : (
<div className="text-center py-4">
<i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
<p className="text-muted">Aucun rendez-vous programmé pour ce jour</p>
</div>
)}
</div>
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowDoctorScheduleModal(false)}>
  Fermer
</Button>
</Modal.Footer>
</Modal>

<style jsx>{`

.badge.rounded-circle {
width: 25px;
height: 25px;
display: flex;
align-items: center;
justify-content: center;
font-size: 0.8rem;
}

.appointment-item {
transition: all 0.2s ease;
}

.appointment-item:hover {
transform: translateX(5px);
background-color: #f8f9fa;
}

.appointment-item .text-muted small {
font-size: 0.85em;
}

.appointment-item .history-info {
font-size: 0.8em;
color: #6c757d;
}
.cursor-pointer:hover {
transform: translateY(-2px);
box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.appointments-list {
max-height: 60vh;
overflow-y: auto;
padding-right: 5px;
}

.appointment-item {
transition: transform 0.2s;
border: 1px solid rgba(0,0,0,.125);
margin-bottom: 0.5rem;
}

.appointment-item:hover {
transform: translateX(5px);
background-color: #f8f9fa;
}

.btn-icon {
padding: 0.2rem 0.4rem;
}

.list-group-item {
border-left: 4px solid transparent;
}

.list-group-item:hover {
border-left-color: #0d6efd;
}
`}</style>

<Modal show={showQRModal} onHide={() => setShowQRModal(false)}>
<Modal.Header closeButton>
<Modal.Title>Code QR d'inscription</Modal.Title>
</Modal.Header>
<Modal.Body className="text-center">
<QRCodeSVG 
  value={`${window.location.origin}/qr-register/${structure?.id}`}
  size={256}
  level="H"
/>
<p className="mt-3">
  Scannez ce code QR pour permettre aux médecins et patients de s'inscrire directement dans votre structure.
</p>
</Modal.Body>
</Modal>

  </Container>
);
};

export default StructuresDashboard;













donc les patient qui souhaitent s'inscrire  le peuvent  maintenent et les patient qui veulent une consultation chez une structure specifique peuvent reserver un rendez-vous avec un medecin de la structure en question rapide et il peut voir les rendez-vous qu'il a reserver depuis son tableau de bord? et est ce que  un code qr est gener pour chaque rendez-vous permettant a medecin ou a la structure concerner de verifier le rendez-vous ?est ce que la structure peut voir sur sont tableau de bord le patient qui s'est inscrit et ainsi que les rendez-vous  qu'il a reverser et est ce que ces rendez-vous s'affiche comme tous les autres ? 




import React, { useState, useEffect } from 'react';
import { db, storage,auth } from '../components/firebase-config.js';
import { doc, updateDoc, getDoc, addDoc, collection, deleteDoc, query, where, getDocs,onSnapshot,setDoc,arrayUnion,arrayRemove, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Container, Row, Col, Card, Button, Alert, Modal, Form ,ButtonGroup,Dropdown,Offcanvas,Badge} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  sendSignInLinkToEmail,
  sendPasswordResetEmail ,
  getAuth,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';

import {Calendar } from 'react-calendar';
import { QRCodeSVG } from 'qrcode.react';

import './StructureDashboard.css';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select/creatable';

const StructuresDashboard = () => {

  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
const [showProfileSidebar, setShowProfileSidebar] = useState(false);
const [showQRModal, setShowQRModal] = useState(false);


  useEffect(() => {
    if (showMenuSidebar) {
      setShowProfileSidebar(false);
    }
    if (showProfileSidebar) {
      setShowMenuSidebar(false);
    }
  }, [showMenuSidebar, showProfileSidebar]);

  
const [structure, setStructure] = useState(null);
const [doctors, setDoctors] = useState([]);
const [patients, setPatients] = useState([]);
const [message, setMessage] = useState('');
const [showDoctorDetails, setShowDoctorDetails] = useState(false);
const [showPatientDetails, setShowPatientDetails] = useState(false);
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [selectedPatient, setSelectedPatient] = useState(null);
const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
const [photoFile, setPhotoFile] = useState(null);
const [certFiles, setCertFiles] = useState([]);
const [showAssignPatientsModal, setShowAssignPatientsModal] = useState(false);
const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(1);
const [bookedSlots, setBookedSlots] = useState({});
const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
const [selectedPatientId, setSelectedPatientId] = useState('');
const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
const [appointments, setAppointments] = useState([]);
const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
const [showEditPatientModal, setShowEditPatientModal] = useState(false);

const [viewMode, setViewMode] = useState('calendar'); // 'doctors', 'patients', 'both'
const [displayMode, setDisplayMode] = useState('grid'); // 'grid', 'table'
const [showProfileModal, setShowProfileModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

const [selectedPatientIds, setSelectedPatientIds] = useState([]);
const [selectedDays, setSelectedDays] = useState([]);
const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
const [selectedDay, setSelectedDay] = useState('Lundi');

const [showEditForm, setShowEditForm] = useState(false);
const [pendingChanges, setPendingChanges] = useState(null);
const [editedStructure, setEditedStructure] = useState(null);

const [isEditing, setIsEditing] = useState(false);
const [lastEditDate, setLastEditDate] = useState(null);
const [medicalDocs, setMedicalDocs] = useState([]);
const [previewDocs, setPreviewDocs] = useState([]);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [editMedicalDocs, setEditMedicalDocs] = useState([]);
const [editPreviewDocs, setEditPreviewDocs] = useState([]);
const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState(null);
const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);

// Ajoutez cette fonction pour gérer le clic sur un médecin
const handleDoctorClick = (doctor) => {
setSelectedDoctorDetails(doctor);
setShowDoctorScheduleModal(true);
};

const [insuranceOptions, setInsuranceOptions] = useState([
{ value: 'CNAM', label: 'CNAM' },
{ value: 'CNSS', label: 'CNSS' },
{ value: 'CNRPS', label: 'CNRPS' },
{ value: 'Assurance privée', label: 'Assurance privée' },
{ value: 'Autre', label: 'Autre' }
]);
const [specialtyOptions, setSpecialtyOptions] = useState([
{ value: 'Médecine générale', label: 'Médecine générale' },
{ value: 'Cardiologie', label: 'Cardiologie' },
{ value: 'Pédiatrie', label: 'Pédiatrie' },
{ value: 'Dentisterie', label: 'Dentisterie' },
{ value: 'Dermatologie', label: 'Dermatologie' },
{ value: 'Gynécologie', label: 'Gynécologie' },
{ value: 'Ophtalmologie', label: 'Ophtalmologie' },
{ value: 'Orthopédie', label: 'Orthopédie' },
{ value: 'Neurologie', label: 'Neurologie' },
{ value: 'Psychiatrie', label: 'Psychiatrie' },
{ value: 'ORL', label: 'ORL' },
{ value: 'Rhumatologie', label: 'Rhumatologie' },
{ value: 'Pneumologie', label: 'Pneumologie' },
{ value: 'Endocrinologie', label: 'Endocrinologie' },
{ value: 'Autre', label: 'Autre' }
]);

const [associationRequests, setAssociationRequests] = useState([]);

const auth = getAuth();

const [showAssignedDoctorModal, setShowAssignedDoctorModal] = useState(false);
const [assignedDoctor, setAssignedDoctor] = useState(null);
const [assignedAppointments, setAssignedAppointments] = useState([]);

const [assignedDoctors, setAssignedDoctors] = useState([]);
const [doctorAppointments, setDoctorAppointments] = useState({});

const [showCalendarView, setShowCalendarView] = useState(true);
const [selectedDate, setSelectedDate] = useState(null);
const [calendarAppointments, setCalendarAppointments] = useState({});
const [dailyDoctorSchedule, setDailyDoctorSchedule] = useState([]);
const navigate = useNavigate();


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
consultationDuration: 5, // in minutes
bookedSlots: {},
insurances: []

});


const [showAddPatientModal, setShowAddPatientModal] = useState(false);
const [patientPhotoFile, setPatientPhotoFile] = useState(null);
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

});

const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState({
  doctors: [],
  patients: []
});


// Ajouter ces states au début du composant
const [sortOrder, setSortOrder] = useState('time'); // 'time', 'patient', 'status'
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [lastReorganization, setLastReorganization] = useState({});

const updateAppointmentOrder = async (appointmentId, newOrder) => {
try {
await updateDoc(doc(db, 'appointments', appointmentId), {
  orderNumber: newOrder,
  lastReorganized: new Date().toISOString()
});
} catch (error) {
console.error('Erreur lors de la mise à jour du rendez-vous:', error);
}
};

// Ajouter cette fonction pour gérer la réorganisation des rendez-vous
const moveAppointment = async (appointmentId, direction) => {
try {
const currentAppointments = [...selectedDoctorDetails.appointments];
const currentIndex = currentAppointments.findIndex(apt => apt.id === appointmentId);

if (direction === 'up' && currentIndex > 0) {
  // Échange avec l'élément précédent
  const temp = currentAppointments[currentIndex];
  currentAppointments[currentIndex] = currentAppointments[currentIndex - 1];
  currentAppointments[currentIndex - 1] = temp;
} else if (direction === 'down' && currentIndex < currentAppointments.length - 1) {
  // Échange avec l'élément suivant
  const temp = currentAppointments[currentIndex];
  currentAppointments[currentIndex] = currentAppointments[currentIndex + 1];
  currentAppointments[currentIndex + 1] = temp;
}

// Mettre à jour les numéros d'ordre
const updatedAppointments = currentAppointments.map((apt, index) => ({
  ...apt,
  orderNumber: index + 1
}));

// Mettre à jour Firestore et l'état local
await Promise.all(
  updatedAppointments.map(apt => 
    updateAppointmentOrder(apt.id, apt.orderNumber)
  )
);

// Mettre à jour les deux états
setSelectedDoctorDetails({
  ...selectedDoctorDetails,
  appointments: updatedAppointments
});

setAppointments(prev => {
  const updated = prev.map(apt => {
    const updatedApt = updatedAppointments.find(a => a.id === apt.id);
    return updatedApt || apt;
  });
  return updated;
});

// Mettre à jour la dernière réorganisation
setLastReorganization(prev => ({
  ...prev,
  [appointmentId]: new Date().toLocaleTimeString()
}));

} catch (error) {
console.error('Erreur lors du déplacement du rendez-vous:', error);
}
};
// Fonction de recherche
const handleSearch = (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    setSearchResults({ doctors: [], patients: [] });
    return;
  }

  const searchTerms = query.toLowerCase().split(' ');
  
  // Recherche dans les médecins
  const filteredDoctors = doctors.filter(doctor => {
    const searchableFields = [
      doctor.nom,
      doctor.prenom,
      doctor.specialite,
      doctor.email,
      doctor.telephone,
      ...(doctor.disponibilite || [])
    ].map(field => field?.toLowerCase() || '');

    return searchTerms.every(term =>
      searchableFields.some(field => field.includes(term))
    );
  });

  // Recherche dans les patients
  const filteredPatients = patients.filter(patient => {
    const searchableFields = [
      patient.nom,
      patient.prenom,
      patient.email,
      patient.telephone,
      patient.age?.toString(),
      patient.sexe,
      patient.adresse
    ].map(field => field?.toLowerCase() || '');

    return searchTerms.every(term =>
      searchableFields.some(field => field.includes(term))
    );
  });

  setSearchResults({
    doctors: filteredDoctors,
    patients: filteredPatients
  });
};

const searchBar = (
  <div className="search-container mb-4 p-3 bg-white rounded-3 shadow-sm">
    <Form.Group>
      <Form.Control
        type="text"
        placeholder="Rechercher médecins ou patients... (nom, spécialité, email, téléphone, etc.)"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-input"
      />
    </Form.Group>
    
    {searchQuery && (
      <div className="search-results mt-3">
        {(searchResults.doctors.length > 0 || searchResults.patients.length > 0) ? (
          <>
            {searchResults.doctors.length > 0 && (
              <div className="doctors-results mb-3">
                <h6 className="text-primary mb-2">
                  <i className="fas fa-user-md me-2"></i>
                  Médecins ({searchResults.doctors.length})
                </h6>
                <div className="list-group">
                  {searchResults.doctors.map(doctor => (
                    <div key={doctor.id} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{doctor.nom} {doctor.prenom}</h6>
                          <p className="mb-1 text-muted small">
                            <span className="me-3">
                              <i className="fas fa-stethoscope me-1"></i>
                              {doctor.specialite}
                            </span>
                            <span>
                              <i className="fas fa-phone me-1"></i>
                              {doctor.telephone}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDoctorDetails(true);
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {searchResults.patients.length > 0 && (
              <div className="patients-results">
                <h6 className="text-success mb-2">
                  <i className="fas fa-users me-2"></i>
                  Patients ({searchResults.patients.length})
                </h6>
                <div className="list-group">
                  {searchResults.patients.map(patient => (
                    <div key={patient.id} className="list-group-item list-group-item-action">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{patient.nom} {patient.prenom}</h6>
                          <p className="mb-1 text-muted small">
                            <span className="me-3">
                              <i className="fas fa-birthday-cake me-1"></i>
                              {patient.age} ans
                            </span>
                            <span>
                              <i className="fas fa-phone me-1"></i>
                              {patient.telephone}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowPatientDetails(true);
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted text-center my-3">
            <i className="fas fa-search me-2"></i>
            Aucun résultat trouvé
          </p>
        )}
      </div>
    )}
    
    <style jsx>{`
      .search-input {
        border-radius: 20px;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border: 1px solid #dee2e6;
        transition: all 0.2s;
      }
      
      .search-input:focus {
        box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
        border-color: #0d6efd;
      }
      
      .search-results {
        max-height: 500px;
        overflow-y: auto;
      }
      
      .list-group-item {
        transition: all 0.2s;
      }
      
      .list-group-item:hover {
        background-color: #f8f9fa;
        transform: translateX(5px);
      }
    `}</style>
  </div>
);

const handleMultipleAssignments = async () => {
  try {
    const assignments = [];
    
    for (const patientId of selectedPatientIds) {
      for (const day of selectedDays) {
        for (const timeSlot of selectedTimeSlots) {
          assignments.push({
            doctorId: selectedDoctor.id,
            patientId,
            timeSlot,
            day,
            status: 'scheduled',
            structureId: structure.id,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    await Promise.all(
      assignments.map(assignment => 
        addDoc(collection(db, 'appointments'), assignment)
      )
    );

    await Promise.all(
      selectedPatientIds.map(patientId =>
        updateDoc(doc(db, 'patients', patientId), {
          medecinId: selectedDoctor.id,
          structureId: structure.id,
          lastUpdated: new Date().toISOString()
        })
      )
    );

    setMessage('Assignations effectuées avec succès');
    setShowAssignPatientsModal(false);
    
    setSelectedPatientIds([]);
    setSelectedDays([]);
    setSelectedTimeSlots([]);
    
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors des assignations');
  }
};


useEffect(() => {
  const structureData = JSON.parse(localStorage.getItem('structureData'));
  if (!structureData) {
    navigate('/');
    return;
  }

  // Real-time structure listener
  const structureUnsubscribe = onSnapshot(
    doc(db, 'structures', structureData.id),
    (doc) => {
      setStructure({ id: doc.id, ...doc.data() });
    }
  );

  // Real-time doctors listener 
  const doctorsUnsubscribe = onSnapshot(
    query(
      collection(db, 'medecins'),
      where('structures', 'array-contains', structureData.id)
    ),
    (snapshot) => {
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDoctors(doctorsData);
    }
  );

  // Real-time patients listener
  const patientsUnsubscribe = onSnapshot(
    query(
      collection(db, 'patients'), 
      where('structures', 'array-contains', structureData.id)
    ),
    (snapshot) => {
      const patientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(patientsData);
    }
  );

  // Real-time appointments listener
  const appointmentsUnsubscribe = selectedDoctor && onSnapshot(
    query(
      collection(db, 'appointments'),
      where('doctorId', '==', selectedDoctor.id)
    ),
    (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);
    }
  );

  // Real-time association requests listener
  const requestsUnsubscribe = onSnapshot(
    query(
      collection(db, 'associationRequests'),
      where('structureId', '==', structureData.id),
      where('status', '==', 'pending')
    ),
    (snapshot) => {
      setAssociationRequests(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
  );

  // Charger tous les rendez-vous au démarrage
  fetchAllAppointments();
  
  // Cleanup all listeners
  return () => {
    structureUnsubscribe();
    doctorsUnsubscribe();
    patientsUnsubscribe();
    if (appointmentsUnsubscribe) appointmentsUnsubscribe();
    requestsUnsubscribe();
  };

}, [navigate, selectedDoctor]);


// Fonctions pour gérer les demandes
const handleAssociationResponse = async (requestId, doctorId, accepted) => {
  try {
    if (accepted) {
      // Mise à jour du statut de la demande
      await updateDoc(doc(db, 'associationRequests', requestId), {
        status: 'accepted',
        acceptedDate: new Date().toISOString()
      });

      // Ajout de la structure dans le tableau des structures du médecin
      const doctorRef = doc(db, 'medecins', doctorId);
      await updateDoc(doctorRef, {
        structures: arrayUnion(structure.id),
        visibility: 'affiliated'  // Marquer le médecin comme affilié
      });

      // Récupérer les données du médecin
      const doctorDoc = await getDoc(doctorRef);
      const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

      // Ajouter le médecin au tableau local
      setDoctors(prevDoctors => [...prevDoctors, doctorData]);

      setMessage('Médecin associé avec succès');
    } else {
      await updateDoc(doc(db, 'associationRequests', requestId), {
        status: 'rejected',
        rejectionDate: new Date().toISOString()
      });

      setMessage('Demande refusée');
    }
  } catch (error) {
    console.error('Erreur association:', error);
    setMessage('Erreur lors du traitement de la demande');
  }
};


const sendConfirmationEmail = async (changes) => {
  try {
    const confirmationToken = Math.random().toString(36).substr(2);
    
    // Store pending changes with token
    await setDoc(doc(db, 'pendingChanges', structure.id), {
      changes,
      token: confirmationToken,
      timestamp: new Date().toISOString()
    });

    // Send confirmation email using Firebase Functions
    const sendMail = httpsCallable(functions, 'sendConfirmationEmail');
    await sendMail({
      email: structure.email,
      token: confirmationToken,
      changes: changes
    });

    setMessage('Email de confirmation envoyé');
    setPendingChanges(changes);
  } catch (error) {
    setMessage('Erreur lors de l\'envoi de l\'email');
  }
};

const handleSubmitChanges = async (e) => {
  e.preventDefault();
  const changes = {
    name: editedStructure.name,
    type: editedStructure.type,
    specialite: editedStructure.specialite,
    description: editedStructure.description,
    email: editedStructure.email,
    telephone: editedStructure.telephone,
    adresse: editedStructure.adresse,
    siteWeb: editedStructure.siteWeb,
    horaires: editedStructure.horaires
  };

  await sendConfirmationEmail(changes);
  setShowEditForm(false);
};


const fetchStructureData = async (structureId) => {
  try {
    const structureDoc = await getDoc(doc(db, 'structures', structureId));
    const structureData = { id: structureDoc.id, ...structureDoc.data() };
    setStructure(structureData);

    // Fetch affiliated doctors
    const doctorsPromises = (structureData.affiliatedDoctors || [])
      .map(id => getDoc(doc(db, 'medecins', id)));
    const doctorsData = await Promise.all(doctorsPromises);
    const affiliatedDoctors = doctorsData.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch private doctors
    const privateQuery = query(
      collection(db, 'medecins'),
      where('structures', 'array-contains', structureId),
      where('visibility', '==', 'private')
    );
    const privateDoctorsSnapshot = await getDocs(privateQuery);
    const privateDoctors = privateDoctorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine both types of doctors
    setDoctors([...affiliatedDoctors, ...privateDoctors]);

    // First fetch affiliated patients
    const patientsPromises = (structureData.affiliatedPatients || [])
      .map(id => getDoc(doc(db, 'patients', id)));
    const patientsData = await Promise.all(patientsPromises);
    const affiliatedPatients = patientsData.map(doc => ({ id: doc.id, ...doc.data() }));

    // Then fetch private patients
    const privatePatientQuery = query(
      collection(db, 'patients'),
      where('structures', 'array-contains', structureId),
      where('visibility', '==', 'private')
    );
    const privatePatientSnapshot = await getDocs(privatePatientQuery);
    const privatePatients = privatePatientSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine both types of patients
    setPatients([...affiliatedPatients, ...privatePatients]);

  } catch (error) {
    console.error('Error fetching data:', error);
    setMessage('Erreur lors du chargement des données');
  }
};

const fetchDoctorAppointments = async (doctorId) => {
  try {
    const appointmentsSnapshot = await getDocs(query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      orderBy('orderNumber', 'asc')
    ));

    const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      orderNumber: doc.data().orderNumber || 0
    }));

    setAppointments(appointmentsData);
    
    if (selectedDoctorDetails) {
      setSelectedDoctorDetails({
        ...selectedDoctorDetails,
        appointments: appointmentsData
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
  }
};

const handleAddDoctor = async () => {
  try {
    // Validate required fields
    if (!newDoctor.email || !newDoctor.password || !newDoctor.nom || !newDoctor.prenom) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newDoctor.email,
      newDoctor.password
    );

    // Add doctor role
    await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
      role: 'doctor',
      structureId: structure.id
    });

    let photoUrl = '';
    let certUrls = [];

    if (photoFile) {
      const photoRef = ref(storage, `doctors/${structure.id}/${photoFile.name}`);
      await uploadBytes(photoRef, photoFile);
      photoUrl = await getDownloadURL(photoRef);
    }

    for (const certFile of certFiles) {
      const certRef = ref(storage, `certifications/${structure.id}/${certFile.name}`);
      await uploadBytes(certRef, certFile);
      const certUrl = await getDownloadURL(certRef);
      certUrls.push(certUrl);
    }

    const doctorData = {
      ...newDoctor,
      uid: userCredential.user.uid,
      photo: photoUrl,
      certifications: certUrls,
      structures: [structure.id],
      createdBy: structure.id,
      createdAt: new Date().toISOString(),
      consultationDuration: 30,
      maxPatientsPerDay: 100,
      disponibilite: newDoctor.disponibilite,
      heureDebut: newDoctor.heureDebut,
      heureFin: newDoctor.heureFin,
      status: 'active',
      insurances: newDoctor.insurances || [],

    };

    const docRef = await addDoc(collection(db, 'medecins'), doctorData);
    const newDoctorWithId = { id: docRef.id, ...doctorData };
    
    setDoctors([...doctors, newDoctorWithId]);
    setShowAddDoctorModal(false);
    setMessage('Médecin ajouté avec succès');

    // Reset form
    setNewDoctor({
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
      consultationDuration: 5,
      bookedSlots: {}
    });
    setPhotoFile(null);
    setCertFiles([]);

  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setMessage('Cet email est déjà utilisé');
        break;
      case 'auth/invalid-email':
        setMessage('Format d\'email invalide');
        break;
      case 'auth/weak-password':
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        break;
      default:
        setMessage('Erreur lors de la création: ' + error.message);
    }
    console.error('Error details:', error);
  }
};

  
const handleAddPatient = async () => {
  try {
    // Validate required fields
    if (!newPatient.email || !newPatient.password || !newPatient.nom || !newPatient.prenom) {
      setMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newPatient.email,
      newPatient.password
    );

    // Add patient role
    await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
      role: 'patient',
      structureId: structure.id
    });

    let photoUrl = '';
    if (patientPhotoFile) {
      const photoRef = ref(storage, `patients/${structure.id}/${patientPhotoFile.name}`);
      await uploadBytes(photoRef, patientPhotoFile);
      photoUrl = await getDownloadURL(photoRef);
    }

    const docUrls = await Promise.all(
      medicalDocs.map(async (file) => {
        const docRef = ref(storage, `patients/${structure.id}/${userCredential.user.uid}/documents/${file.name}`);
        await uploadBytes(docRef, file);
        return getDownloadURL(docRef);
      })
    );

    const patientData = {
      ...newPatient,
      uid: userCredential.user.uid,
      photo: photoUrl,
      documents: docUrls,
      structures: [structure.id],
      createdBy: structure.id,
      createdAt: new Date().toISOString(),
      status: 'active',
      antecedents: [],
      allergies: [],
      traitements: [],
      lastVisit: null,
      nextAppointment: null,
      insurances: newPatient.insurances || [],

    };

    const docRef = await addDoc(collection(db, 'patients'), patientData);
    const newPatientWithId = { id: docRef.id, ...patientData };
    
    setPatients([...patients, newPatientWithId]);
    setShowAddPatientModal(false);
    setMessage('Patient ajouté avec succès');
    
    // Reset form
    setNewPatient({
      nom: '',
      prenom: '',
      age: '',
      sexe: '',
      telephone: '',
      email: '',
      password: '',
      photo: null,
      documents: null,
      visibility: 'private',
      structures: []
    });

    setPatientPhotoFile(null);
    setMedicalDocs([]);
    setPreviewDocs([]);

  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setMessage('Cet email est déjà utilisé');
        break;
      case 'auth/invalid-email':
        setMessage('Format d\'email invalide');
        break;
      case 'auth/weak-password':
        setMessage('Le mot de passe doit contenir au moins 6 caractères');
        break;
      default:
        setMessage('Erreur lors de la création: ' + error.message);
    }
    console.error('Error details:', error);
  }
};



const handleDeleteDoctor = async (doctorId) => {
try {
await deleteDoc(doc(db, 'medecins', doctorId));
setDoctors(doctors.filter(d => d.id !== doctorId));
setMessage('Médecin supprimé avec succès');
} catch (error) {
setMessage('Erreur lors de la suppression');
}
};

const handleDeletePatient = async (patientId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId));
    setPatients(patients.filter(p => p.id !== patientId));
    setMessage('Patient supprimé avec succès');
  } catch (error) {
    setMessage('Erreur lors de la suppression');
  }
};

const handleUnaffiliation = async (type, id) => {
  try {
    if (type === 'doctor') {
      // Mise à jour du médecin
      const doctorRef = doc(db, 'medecins', id);
      await updateDoc(doctorRef, {
        structures: arrayRemove(structure.id)
      });

      // Mise à jour des patients
      const patientsQuery = query(
        collection(db, 'patients'),
        where('medecinId', '==', id),
        where('structureId', '==', structure.id)
      );
      
      const patientsSnapshot = await getDocs(patientsQuery);
      const batch = writeBatch(db);
      
      patientsSnapshot.docs.forEach(patientDoc => {
        batch.update(patientDoc.ref, {
          medecinId: null,
          structureId: null
        });
      });
      
      await batch.commit();

      // Mise à jour immédiate de l'interface
      setDoctors(doctors.filter(doc => doc.id !== id));
      setPatients(patients.filter(pat => pat.medecinId !== id));
      
      setMessage('Médecin désaffilié avec succès');
    } else {
      // Mise à jour du patient
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        structureId: null,
        medecinId: null,

      });

      setPatients(patients.filter(pat => pat.id !== id));
      setMessage('Patient retiré avec succès');
    }
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors de la modification');
  }
};

const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  let currentTime = new Date(`2000/01/01 ${startTime}`);
  const endDateTime = new Date(`2000/01/01 ${endTime}`);
  
  while (currentTime < endDateTime) {
    slots.push(currentTime.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
    currentTime.setMinutes(currentTime.getMinutes() + duration);
  }
  
  return slots;
};

const handleCompleteAppointment = async (appointmentId) => {
  await updateDoc(doc(db, 'appointments', appointmentId), {
    status: 'completed'
  });
  setAppointments(appointments.map(apt => 
    apt.id === appointmentId ? {...apt, status: 'completed'} : apt
  ));
};

const handleDeleteAppointment = async (appointmentId) => {
  await deleteDoc(doc(db, 'appointments', appointmentId));
  setAppointments(appointments.filter(apt => apt.id !== appointmentId));
};


const refreshDoctorData = async (doctorId) => {
  try {
      const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
      if (doctorDoc.exists()) {
          const updatedDoctor = { id: doctorDoc.id, ...doctorDoc.data() };
          setDoctors(doctors.map(d => d.id === doctorId ? updatedDoctor : d));
      }
  } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
  }
};


const handleEditDoctor = async (doctor) => {
  try {
      const doctorRef = doc(db, 'medecins', doctor.id);
      
      // Créez un objet avec uniquement les champs à mettre à jour
      const updateData = {
          nom: doctor.nom,
          prenom: doctor.prenom,
          specialite: doctor.specialite,
          telephone: doctor.telephone,
          email: doctor.email,
          password: doctor.password,
          disponibilite: doctor.disponibilite || [],
          heureDebut: doctor.heureDebut,
          heureFin: doctor.heureFin,
          maxPatientsPerDay: doctor.maxPatientsPerDay || 1,
          consultationDuration: doctor.consultationDuration || 30,
          joursDisponibles: doctor.joursDisponibles || [],
          insurances: doctor.insurances || [],

      };

      // Mise à jour dans Firestore
      await updateDoc(doctorRef, updateData);

      // Mise à jour locale
      setDoctors(doctors.map(d => d.id === doctor.id ? {...d, ...updateData} : d));
      setShowEditDoctorModal(false);
      setMessage('Médecin modifié avec succès');
      
      // Rafraîchir les données
      await fetchStructureData(structure.id);
  } catch (error) {
      console.error('Erreur lors de la modification:', error);
      setMessage('Erreur lors de la modification du médecin');
  }
};

const handleEditPatient = async (patient) => {
  try {
    const patientRef = doc(db, 'patients', patient.id);
    
    // Gestion de la photo
    let photoUrl = patient.photo;
    if (patientPhotoFile) {
      const photoRef = ref(storage, `patients/${structure.id}/${patient.uid}/photo`);
      await uploadBytes(photoRef, patientPhotoFile);
      photoUrl = await getDownloadURL(photoRef);
    }

    // Gestion des documents médicaux
    const newDocUrls = await Promise.all(
      editMedicalDocs.map(async (file) => {
        const docRef = ref(storage, `patients/${structure.id}/${patient.uid}/documents/${file.name}`);
        await uploadBytes(docRef, file);
        return getDownloadURL(docRef);
      })
    );

    const updatedDocs = [...(patient.documents || []), ...newDocUrls];

    await updateDoc(patientRef, {
      nom: patient.nom,
      prenom: patient.prenom,
      age: patient.age,
      sexe: patient.sexe,
      telephone: patient.telephone,
      email: patient.email,
      photo: photoUrl,
      documents: updatedDocs,
      insurances: patient.insurances || [], // Assurez-vous que c'est un tableau
    });

    setPatients(patients.map(p => p.id === patient.id ? {...p, photo: photoUrl, documents: updatedDocs} : p));
    setShowEditPatientModal(false);
    setMessage('Patient modifié avec succès');
    
    // Réinitialisation des états
    setEditMedicalDocs([]);
    setEditPreviewDocs([]);
    setPatientPhotoFile(null);
    
  } catch (error) {
    setMessage('Erreur lors de la modification du patient');
  }
};

const handleShowAssignedDoctor = async (patient) => {
  try {
    // Récupérer tous les rendez-vous du patient
    const appointmentsSnapshot = await getDocs(
      query(
        collection(db, 'appointments'),
        where('patientId', '==', patient.id)
      )
    );
    
    // Extraire les IDs uniques des médecins
    const doctorIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().doctorId))];
    
    // Récupérer les informations de tous les médecins
    const doctorsData = await Promise.all(
      doctorIds.map(async (doctorId) => {
        const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
        if (doctorDoc.exists()) {
          return { id: doctorDoc.id, ...doctorDoc.data() };
        }
        return null;
      })
    );

    // Filtrer les médecins null et les organiser avec leurs rendez-vous
    const validDoctors = doctorsData.filter(d => d !== null);
    const appointments = {};
    
    appointmentsSnapshot.docs.forEach(doc => {
      const apt = { id: doc.id, ...doc.data() };
      if (!appointments[apt.doctorId]) {
        appointments[apt.doctorId] = [];
      }
      appointments[apt.doctorId].push(apt);
    });

    setAssignedDoctors(validDoctors);
    setDoctorAppointments(appointments);
    setShowAssignedDoctorModal(true);
    
  } catch (error) {
    console.error('Erreur:', error);
    setMessage('Erreur lors de la récupération des informations');
  }
};

const sendModificationLink = async () => {
  try {
    // Créer un lien de modification sécurisé
    const actionCodeSettings = {
      url: `${window.location.origin}/edit-structure?id=${structure.id}`,
      handleCodeInApp: true
    };

    // Envoyer l'email avec Firebase Auth
    await sendSignInLinkToEmail(auth, structure.email, actionCodeSettings);

    // Sauvegarder l'email pour la vérification
    localStorage.setItem('emailForModification', structure.email);

    setMessage('Un lien de modification a été envoyé à votre email');
    setShowSettingsModal(false);
  } catch (error) {
    setMessage('Erreur lors de l\'envoi du lien: ' + error.message);
  }
};

const handleLogout = async () => {
  try {
    // 1. Sign out from Firebase
    await signOut(auth);
    
    // 2. Clear all localStorage data
    localStorage.clear();
    
    // 3. Navigate to home page
    navigate('/');
    
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

const weekdayOrder = {
  'Lundi': 1,
  'Mardi': 2,
  'Mercredi': 3,
  'Jeudi': 4,
  'Vendredi': 5,
  'Samedi': 6,
  'Dimanche': 7
};

const fadeAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  hover: { scale: 1.02, transition: { duration: 0.3 } }
};

const DoctorCard = ({ doctor, onDetails, onEdit, onDelete, onAssign }) => (
  <div className="card card-hover fade-in">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="doctor-avatar me-3">
          {doctor.photo ? (
            <img 
              src={doctor.photo} 
              alt={doctor.nom}
              className="rounded-circle"
              style={{width: "50px", height: "50px", objectFit: "cover"}}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="fas fa-user-md fa-2x"></i>
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-0">Dr. {doctor.nom} {doctor.prenom}</h5>
          <span className="text-muted">{doctor.specialite}</span>
        </div>
      </div>
      
      <div className="d-flex flex-wrap gap-2 mb-3">
        {doctor.disponibilite?.map(day => (
          <span key={day} className="badge bg-light text-primary">
            {day}
          </span>
        ))}
      </div>

      <div className="action-buttons d-flex gap-2">
        <Button 
          variant="outline-primary" 
          className="btn-float btn-icon-pulse"
          onClick={() => onDetails(doctor)}
        >
          <i className="fas fa-eye me-2"></i>
          Détails
        </Button>
        {/* ... autres boutons ... */}
      </div>
    </div>
  </div>
);

const PatientCard = ({ patient, onDetails, onEdit, onDelete }) => (
  <div className="card card-hover fade-in">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="patient-avatar me-3">
          {patient.photo ? (
            <img 
              src={patient.photo} 
              alt={patient.nom}
              className="rounded-circle"
              style={{width: "50px", height: "50px", objectFit: "cover"}}
            />
          ) : (
            <div className="avatar-placeholder">
              <i className="fas fa-user fa-2x"></i>
            </div>
          )}
        </div>
        <div>
          <h5 className="mb-0">{patient.nom} {patient.prenom}</h5>
          <span className="text-muted">{patient.age} ans</span>
        </div>
      </div>
      
      <div className="patient-info mb-3">
        <p className="mb-1">
          <i className="fas fa-phone-alt me-2 text-primary"></i>
          {patient.telephone}
        </p>
        <p className="mb-0">
          <i className="fas fa-envelope me-2 text-primary"></i>
          {patient.email}
        </p>
      </div>

      <div className="action-buttons d-flex gap-2">
        <Button 
          variant="outline-primary" 
          className="btn-float btn-icon-pulse"
          onClick={() => onDetails(patient)}
        >
          <i className="fas fa-eye me-2"></i>
          Détails
        </Button>
        {/* ... autres boutons ... */}
      </div>
    </div>
  </div>
);

const SearchBar = ({ value, onChange }) => (
  <div className="search-container">
    <div className="position-relative">
      <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
      <input
        type="text"
        className="form-control search-input"
        placeholder="Rechercher..."
        value={value}
        onChange={onChange}
      />
    </div>
    {value && (
      <Button
        variant="link"
        className="position-absolute top-50 end-0 translate-middle-y me-2"
        onClick={() => onChange({ target: { value: '' } })}
      >
        <i className="fas fa-times"></i>
      </Button>
    )}
  </div>
);


const fetchAllAppointments = async () => {
  try {
    const structureId = JSON.parse(localStorage.getItem('structureData'))?.id;
    if (!structureId) return;

    // Récupérer tous les rendez-vous de la structure
    const appointmentsSnapshot = await getDocs(query(
      collection(db, 'appointments'),
      where('structureId', '==', structureId)
    ));

    // Organiser les rendez-vous par jour
    const appointmentsByDay = {
      'Lundi': [],
      'Mardi': [],
      'Mercredi': [],
      'Jeudi': [],
      'Vendredi': [],
      'Samedi': [],
      'Dimanche': []
    };

    appointmentsSnapshot.docs.forEach(doc => {
      const appt = { id: doc.id, ...doc.data() };
      if (appt.day) {
        appointmentsByDay[appt.day].push(appt);
      }
    });

    // Récupérer les détails des médecins pour chaque jour
    const dailySchedule = await Promise.all(
      Object.entries(appointmentsByDay).map(async ([day, dayAppointments]) => {
        const doctorIds = [...new Set(dayAppointments.map(apt => apt.doctorId))];
       const doctorsWithAppointments = await Promise.all(
         doctorIds.map(async (doctorId) => {
           const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
           const doctorData = doctorDoc.data();
           
           // Add null check before accessing doctorData
           if (!doctorData) {
             console.warn(`Doctor with ID ${doctorId} not found`);
             return {
               id: doctorId,
               nom: 'Unknown',
               prenom: 'Doctor',
               specialite: 'Unknown',
               heureDebut: '',
               heureFin: '',
               appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
             };
           }
           
           return {
             id: doctorId,
             nom: doctorData.nom,
             prenom: doctorData.prenom,
             specialite: doctorData.specialite,
             heureDebut: doctorData.heureDebut,
             heureFin: doctorData.heureFin,
             appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
           };
         })
       );
        return {
          day,
          doctors: doctorsWithAppointments.filter(d => d.appointments.length > 0)
        };
      })
    );

    setDailyDoctorSchedule(dailySchedule);

    // Sélectionner automatiquement le lundi et son premier médecin
    const mondaySchedule = dailySchedule.find(schedule => schedule.day === 'Lundi');
    if (mondaySchedule && mondaySchedule.doctors.length > 0) {
      setSelectedDoctorDetails(mondaySchedule.doctors[0]);
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    setMessage('Erreur lors de la récupération des rendez-vous');
  }
};

useEffect(() => {
  const structureData = JSON.parse(localStorage.getItem('structureData'));
  if (!structureData) {
    navigate('/');
    return;
  }

  // Initialiser les listeners
  const unsubscribes = [
    // ... existing listeners ...
  ];

  // Charger les rendez-vous immédiatement
  fetchAllAppointments();
  
  // Activer automatiquement la vue calendrier
  setShowCalendarView(true);
  setSelectedDay('Lundi');

  return () => {
    unsubscribes.forEach(unsubscribe => unsubscribe());
  };
}, [navigate]);

const calendarButton = (
  <Button
    variant={showCalendarView ? 'primary' : 'light'}
    onClick={() => {setShowCalendarView(!showCalendarView);
      setShowMenuSidebar(false);

    }
    }
    className="ms-2"
  >
    <i className="fas fa-calendar-alt me-2"></i>
    Calendrier
  </Button>
);



const calendarView = showCalendarView && (
  <Card className="calendar-view-card mb-4 shadow-lg">
    <Card.Header className="bg-gradient bg-primary text-white py-3">
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-calendar-alt me-2"></i>
          Planning des rendez-vous
        </h5>
        <p className="mt-1 d-block text-white">
  {new Date().toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace('à', 'à')}
</p>
      </div>
    </Card.Header>
    <Card.Body className="p-0">
      <Row className="g-0">
        {/* Colonne des jours - devient pleine largeur sur mobile */}
        <Col xs={12} md={3} className="border-end-md">
          <div className="weekdays-list p-3">
            <h6 className="text-primary mb-3 d-flex align-items-center">
              <i className="fas fa-calendar-week me-2"></i>
              Jours de la semaine
            </h6>
            <div className="d-md-block d-flex flex-row flex-nowrap overflow-auto">
              {dailyDoctorSchedule.map(({ day, doctors }) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'primary' : 'light'}
                  className="d-flex align-items-center justify-content-between w-100 mb-2 mx-1 py-2 px-3 rounded-pill shadow-sm"
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="d-flex align-items-center">
                    <i className={`fas fa-${selectedDay === day ? 'calendar-check' : 'calendar-day'} me-2`}></i>
                    <span className="d-none d-md-inline">{day}</span>
                    <span className="d-md-none">{day.substring(0, 3)}</span>
                  </div>
                  <Badge bg={selectedDay === day ? 'light' : 'primary'}
                    text={selectedDay === day ? 'primary' : 'white'}
                    className="rounded-pill ms-2">
                    {doctors.reduce((total, doctor) => total + doctor.appointments.length, 0)}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </Col>

        <Col xs={12} md={9}>
      <div className="daily-schedule p-3 p-md-4">
        {selectedDay ? (
          <>
            <div className="selected-day-header mb-4">
              <h5 className="text-primary mb-3 border-bottom pb-3 d-flex align-items-center flex-wrap">
                <i className="fas fa-clock me-2"></i>
                Planning du {selectedDay}
                <Badge bg="info" className="ms-2 rounded-pill">
                  {dailyDoctorSchedule
                    .find(schedule => schedule.day === selectedDay)?.doctors
                    .reduce((total, doctor) => total + doctor.appointments.length, 0)} rendez-vous
                </Badge>
              </h5>
            </div>

            {dailyDoctorSchedule
              .find(schedule => schedule.day === selectedDay)?.doctors.length > 0 ? (
              dailyDoctorSchedule
                .find(schedule => schedule.day === selectedDay)
                .doctors.map(doctor => (
                  <div 
                    key={doctor.id} 
                    className="doctor-schedule-card mb-3 cursor-pointer" 
                    onClick={() => handleDoctorClick(doctor)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="doctor-header bg-light p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                          <div className="doctor-avatar me-3">
                            <i className="fas fa-user-md fa-2x text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
                            <span className="text-muted small">
                              <i className="fas fa-stethoscope me-2"></i>
                              {doctor.specialite}
                            </span>
                          </div>
                        </div>
                        <Badge bg="primary" className="rounded-pill px-3">
                          <i className="far fa-clock me-2"></i>
                          {doctor.heureDebut} - {doctor.heureFin}
                        </Badge>
                      </div>
                      <div className="mt-2 text-end">
                        <Badge bg="info" className="rounded-pill">
                          <i className="fas fa-calendar-check me-2"></i>
                          {doctor.appointments.length} rendez-vous
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">Aucun médecin disponible ce jour</h6>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5">
            <i className="fas fa-calendar fa-3x text-primary mb-3"></i>
            <h6 className="text-primary">Sélectionnez un jour</h6>
          </div>
        )}
      </div>
    </Col>
        </Row>
    </Card.Body>

    <style jsx>{`
      .calendar-view-card {
        border: none;
        border-radius: 1rem;
        overflow: hidden;
      }

      .border-end-md {
        @media (min-width: 768px) {
          border-right: 1px solid #dee2e6;
        }
      }

      .weekdays-list {
        @media (max-width: 767px) {
          border-bottom: 1px solid #dee2e6;
        }
      }

      .timeline {
        @media (max-width: 767px) {
          padding-left: 40px;
        }
      }

      .appointment-card {
        @media (max-width: 767px) {
          margin-left: 5px;
        }
      }

      /* Ajout des styles pour le scroll horizontal sur mobile */
      .overflow-auto {
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        &::-webkit-scrollbar {
          display: none;
        }
      }

      /* Optimisations pour les petits écrans */
      @media (max-width: 767px) {
        .doctor-schedule-card {
          margin-bottom: 1rem;
        }

        .time-marker {
          left: -45px;
        }

        .appointment-card {
          padding: 0.75rem !important;
        }
      }
    `}</style>
  </Card>
);




return (
  <Container fluid className="py-4">
    <div className="dashboard-header py-4 px-3 bg-white shadow-sm rounded-3 mb-4">
    <div className="d-flex justify-content-between align-items-center">
{/* Mobile Menu Button */}
<div className="d-lg-none">
<Button
  variant="light"
  className="menu-btn shadow-sm"
  onClick={() => {
    setShowMenuSidebar(true);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-bars"></i>
</Button>
</div>

{/* Desktop Navigation */}
<div className="d-none d-lg-flex align-items-center">
<ButtonGroup className="me-4 shadow-sm">
  <Button
    variant={viewMode === 'both' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('both');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-th-large me-2"></i>
    Tous
  </Button>
  <Button
    variant={viewMode === 'doctors' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('doctors');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-user-md me-2"></i>
    Médecins
  </Button>
  <Button
    variant={viewMode === 'patients' ? 'primary' : 'light'}
    onClick={() => {
      setViewMode('patients');
      setShowCalendarView(false);
    }}
    className="px-4 py-2 fw-semibold"
  >
    <i className="fas fa-users me-2"></i>
    Patients
  </Button>
</ButtonGroup>


  {calendarButton}
  <Button
variant="outline-primary"
className="ms-2"
onClick={() => {
setShowQRModal(true);
setShowCalendarView(false);
}}
>
<i className="fas fa-qrcode me-2"></i>
Code QR d'inscription
</Button>
</div>

{/* Mobile Profile Button */}
<div className="d-lg-none">
<Button
  variant="light"
  className="profile-btn shadow-sm"
  onClick={() => {
    setShowProfileSidebar(true);
    setShowMenuSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-user"></i>
</Button>
</div>

{/* Desktop Profile Buttons */}
<div className="d-none d-lg-flex gap-2">
<Button
  variant="light"
  className="btn-icon-hover shadow-sm"
  onClick={() => {
    setShowSettingsModal(true);
    setShowMenuSidebar(false);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-hospital me-2"></i>
  Profil
</Button>

<Button 
  variant="danger" 
  className="w-100 w-md-auto shadow-sm"
  onClick={() => {
    handleLogout();
    setShowMenuSidebar(false);
    setShowProfileSidebar(false);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-sign-out-alt me-md-2"></i>
  <span className="d-none d-md-inline"></span>
  {/*<span className="d-none d-md-inline">Déconnexion</span>
*/}
</Button>

</div>
</div>

{/* Menu Sidebar */}
<Offcanvas show={showMenuSidebar} onHide={() => setShowMenuSidebar(false)} placement="start">
<Offcanvas.Header closeButton>
  <Offcanvas.Title>Menu Navigation</Offcanvas.Title>
</Offcanvas.Header>
<Offcanvas.Body>
  <div className="d-flex flex-column gap-2">
    <Button
      variant={viewMode === 'both' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('both');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-th-large me-2"></i>
      Tous
    </Button>
    <Button
      variant={viewMode === 'doctors' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('doctors');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-user-md me-2"></i>
      Médecins
    </Button>
    <Button
      variant={viewMode === 'patients' ? 'primary' : 'light'}
      onClick={() => {
        setViewMode('patients');
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
      className="w-100 text-start"
    >
      <i className="fas fa-users me-2"></i>
      Patients
    </Button>
    <Button
variant="outline-primary"
className="w-100 text-start"
onClick={() => {
setShowQRModal(true);
setShowCalendarView(false);
}}
>
<i className="fas fa-qrcode me-2"></i>
Code QR d'inscription
</Button>
    <hr />
    <div className="d-flex gap-2 mb-2">
      
      {calendarButton}
    </div>
  </div>
</Offcanvas.Body>
</Offcanvas>

{/* Profile Sidebar */}
<Offcanvas show={showProfileSidebar} onHide={() => setShowProfileSidebar(false)} placement="end">
<Offcanvas.Header closeButton>
  <Offcanvas.Title>Menu Profil</Offcanvas.Title>
</Offcanvas.Header>
<Offcanvas.Body>
  <div className="d-flex flex-column gap-2">
    <Button
      variant="light"
      className="w-100 text-start"
      onClick={() => {
        setShowProfileModal(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-hospital me-2"></i>
      Profil Structure
    </Button>
    <Button
      variant="light"
      className="w-100 text-start"
      onClick={() => {
        setShowSettingsModal(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-cog me-2"></i>
      Paramètres
    </Button>
    <Button 
variant="danger" 
className="w-100 w-md-auto shadow-sm"
onClick={() => {
handleLogout();
setShowCalendarView(false);
}}
>
<i className="fas fa-sign-out-alt me-md-2"></i>
<span className="d-none d-md-inline">Déconnexion</span>
</Button>
  </div>
</Offcanvas.Body>
</Offcanvas>
</div>


    {/* Rest of the JSX */}
    {searchBar}
    {calendarView}
    
    {message && (
      <Alert variant="info" className="mb-4">
        {message}
      </Alert>
    )}

    {/* Ajouter dans le JSX, avant la liste des médecins */}
    {associationRequests.length > 0 && (
      <Card className="mb-4">
        <Card.Header className="bg-warning">
          <h5>Demandes d'association ({associationRequests.length})</h5>
        </Card.Header>
        <Card.Body>
          {associationRequests.map(request => (
            <div key={request.id} className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6>Dr. {request.doctorInfo.nom} {request.doctorInfo.prenom}</h6>
                <p className="text-muted mb-0">{request.doctorInfo.specialite}</p>
              </div>
              <div>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => handleAssociationResponse(request.id, request.doctorId, true)}
                >
                  Accepter
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAssociationResponse(request.id, request.doctorId, false)}
                >
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>
    )}
    <Row>
      {(viewMode === 'both' || viewMode === 'doctors') && (
        <Col md={viewMode === 'both' ? 6 : 12}>
          <Card className="doctor-card mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-user-md me-2"></i>
                  Médecins
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  className="rounded-pill px-3"
                  onClick={() => setShowAddDoctorModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Ajouter un médecin privé
                </Button>
              </div>
            </Card.Header>
            <style jsx>{`
              .card-body-scroll {
                  padding: 0;
                  height: calc(100vh - 200px);
                  overflow: hidden;
              }

              .doctor-list-container {
                  height: 100%;
                  overflow-y: auto;
                  padding: 1rem;
              }

              .doctor-grid {
                  display: grid;
                  gap: 1rem;
                  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              }

              .doctor-item {
                  background: white;
                  border-radius: 8px;
                  border: 1px solid rgba(0,0,0,0.1);
                  transition: transform 0.2s;
              }

              .doctor-content {
                  padding: 1rem;
              }

              .doctor-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 1rem;
              }

              .doctor-name {
                  font-weight: 600;
                  margin-bottom: 0.25rem;
              }

              .doctor-specialty {
                  color: #6c757d;
                  margin: 0;
                  font-size: 0.9rem;
              }

              .status-badge {
                  padding: 0.25rem 0.75rem;
                  border-radius: 20px;
                  font-size: 0.8rem;
                  display: inline-flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              .badge-private {
                  background: #17a2b8;
                  color: white;
              }

              .badge-affiliated {
                  background: #28a745;
                  color: white;
              }

              .actions-wrapper {
                  overflow-x: auto;
                  margin: 0 -0.5rem;
              }

              .actions-row {
                  display: flex;
                  gap: 0.5rem;
                  padding: 0.5rem;
                  min-width: min-content;
              }

              .action-button {
                  white-space: nowrap;
                  display: inline-flex;
                  align-items: center;
                  gap: 0.5rem;
              }

              @media (max-width: 768px) {
                  .card-body-scroll {
                      height: calc(100vh - 150px);
                  }

                  .doctor-grid {
                      grid-template-columns: 1fr;
                  }

                  .actions-row {
                      padding: 0.25rem;
                      gap: 0.25rem;
                  }

                  .action-button {
                      padding: 0.25rem 0.5rem;
                      font-size: 0.8rem;
                  }
              }
            `}</style>

            <Card.Body className="card-body-scroll">
              <div className="doctor-cards-container">
                <div className="doctor-cards-scroll px-3 py-2">
                  {doctors.map(doctor => (
                    <div key={doctor.id} className="doctor-card-item">
                      <div className="doctor-info p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0">{doctor.nom} {doctor.prenom}</h6>
                          <span className={`badge ${doctor.visibility === 'private' ? 'bg-info' : 'bg-success'}`}>
                            {doctor.visibility === 'private' ? 'Privé' : 'Affilié'}
                          </span>
                        </div>
                        <p className="text-muted mb-3">
                          <i className="fas fa-stethoscope me-2"></i>
                          {doctor.specialite}
                        </p>
                        
                        <div className="insurances-section mb-3">
<p className="text-muted mb-2">
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées:
</p>
<div className="insurance-tags">
{doctor.insurances ? (
  doctor.insurances.map((insurance, index) => (
    <span key={index} className="insurance-tag">
      {insurance}{index < doctor.insurances.length - 1 ? ', ' : ''}
    </span>
  ))
) : (
  <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
)}
</div>
</div>
                        <div className="actions-scroll-container">
                          <div className="actions-scroll">
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowDoctorDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i> Détails
                            </Button>

                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowEditDoctorModal(true);
                              }}
                            >
                              <i className="fas fa-edit me-1"></i> Modifier
                            </Button>

                            {doctor.visibility === 'private' ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-btn"
                                onClick={() => handleDeleteDoctor(doctor.id)}
                              >
                                <i className="fas fa-trash me-1"></i> Supprimer
                              </Button>
                            ) : (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="action-btn"
                                onClick={() => handleUnaffiliation('doctor', doctor.id)}
                              >
                                <i className="fas fa-unlink me-1"></i> Désaffilier
                              </Button>
                            )}

                            <Button
                              variant="outline-success"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowAssignPatientsModal(true);
                              }}
                            >
                              <i className="fas fa-user-plus me-1"></i> Assigner
                            </Button>

                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-btn"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                fetchDoctorAppointments(doctor.id);
                                setShowAppointmentsModal(true);
                              }}
                            >
                              <i className="fas fa-calendar me-1"></i> Rendez-vous
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )}

      {(viewMode === 'both' || viewMode === 'patients') && (
        <Col md={viewMode === 'both' ? 6 : 12}>
          <Card className="patient-card shadow-sm">
            <Card.Header className="bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-users me-2"></i>
                  Patients
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  className="rounded-pill px-3"
                  onClick={() => setShowAddPatientModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Ajouter un patient privé
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="card-body-scroll">
              <div className="patient-list-container">
                <div className="patient-grid">
                  {patients.map(patient => (
                    <div key={patient.id} className="patient-item">
                      <div className="patient-content">
                        <div className="patient-header">
                          <div className="patient-info">
                            <h6 className="patient-name">{patient.nom} {patient.prenom}</h6>
                            <p className="patient-age">
                              <i className="fas fa-birthday-cake me-2"></i>
                              {patient.age} ans
                            </p>
                          </div>
                          <span className={`status-badge ${patient.visibility === 'private' ? 'badge-private' : 'badge-affiliated'}`}>
                            <i className={`fas ${patient.visibility === 'private' ? 'fa-lock' : 'fa-link'}`}></i>
                            {patient.visibility === 'private' ? 'Privé' : 'Affilié'}
                          </span>
                        </div>

                        <div className="actions-wrapper">
                          <div className="actions-row">
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="action-button"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientDetails(true);
                              }}
                            >
                              <i className="fas fa-eye"></i> Détails
                            </Button>

                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="action-button"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowEditPatientModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i> Modifier
                            </Button>

                            {patient.visibility === 'private' ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="action-button"
                                onClick={() => handleDeletePatient(patient.id)}
                              >
                                <i className="fas fa-trash"></i> Supprimer
                              </Button>
                            ) : (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="action-button"
                                onClick={() => handleUnaffiliation('patient', patient.id)}
                              >
                                <i className="fas fa-unlink"></i> Désaffilier
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="action-button"
                              onClick={() => handleShowAssignedDoctor(patient)}
                              disabled={!patient.medecinId}
                            >
                              <i className="fas fa-user-md"></i> Médecin assigné
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <style jsx>
                {`

                .insurance-tags {
display: flex;
flex-wrap: wrap;
gap: 0.5rem;
margin-top: 0.5rem;
}

.insurance-tag {
background-color: #e9ecef;
color: #495057;
padding: 0.25rem 0.75rem;
border-radius: 1rem;
font-size: 0.8rem;
display: inline-flex;
align-items: center;
transition: all 0.2s;
}

.insurance-tag:hover {
background-color: #dee2e6;
transform: translateY(-1px);
}

                  .card-body-scroll {
                    padding: 0;
                    height: calc(100vh - 200px);
                    overflow: hidden;
                  }

                  .patient-list-container {
                    height: 100%;
                    overflow-y: auto;
                    padding: 1rem;
                  }

                  .patient-grid {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  }

                  .patient-item {
                    background: white;
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.1);
                    transition: transform 0.2s;
                  }

                  .patient-content {
                    padding: 1rem;
                  }

                  .patient-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                  }

                  .patient-name {
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                  }

                  .patient-age {
                    color: #6c757d;
                    margin: 0;
                    font-size: 0.9rem;
                  }

                  .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                  }

                  .badge-private {
                    background: #17a2b8;
                    color: white;
                  }

                  .badge-affiliated {
                    background: #28a745;
                    color: white;
                  }

                  .actions-wrapper {
                    overflow-x: auto;
                    margin: 0 -0.5rem;
                  }

                  .actions-row {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    min-width: min-content;
                  }

                  .action-button {
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                  }

                  @media (max-width: 768px) {
                    .card-body-scroll {
                      height: calc(100vh - 150px);
                    }

                    .patient-grid {
                      grid-template-columns: 1fr;
                    }

                    .actions-row {
                      padding: 0.25rem;
                      gap: 0.25rem;
                    }

                    .action-button {
                      padding: 0.25rem 0.5rem;
                      font-size: 0.8rem;
                    }
                  }
                `}
              </style>
            </Card.Body>
          </Card>
        </Col>
      )}
    </Row>

    {/* Add Doctor Modal */}
    <Modal show={showAddDoctorModal} onHide={() => setShowAddDoctorModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un médecin privé</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
<Form.Label>
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées
</Form.Label>
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
onCreateOption={(inputValue) => {
  // Créer une nouvelle option pour l'assurance personnalisée
  const newOption = { value: inputValue, label: inputValue };
  // Mettre à jour les options d'assurance
  setInsuranceOptions([...insuranceOptions, newOption]);
  // Mettre à jour les assurances sélectionnées
  setNewDoctor({
    ...newDoctor,
    insurances: [...(newDoctor.insurances || []), inputValue]
  });
}}
isCreatable={true}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les assurances..."
noOptionsMessage={() => "Aucune option disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
<Form.Text className="text-muted">
Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
</Form.Text>
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
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddDoctorModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleAddDoctor}>
          Ajouter
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Edit Doctor Modal */}
    <Modal show={showEditDoctorModal} onHide={() => setShowEditDoctorModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier le médecin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.nom || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, nom: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.prenom || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, prenom: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Spécialité</Form.Label>
            <Form.Control
              type="text"
              value={selectedDoctor?.specialite || ''}
              onChange={(e) => setSelectedDoctor({...selectedDoctor, specialite: e.target.value})}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedDoctor?.email || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe:</Form.Label>
                <Form.Control
                  type="password"
                  value={selectedDoctor?.password || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, password: e.target.value})}
                />
              </Form.Group>
            </Col>
            
          </Row>
          <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={selectedDoctor?.telephone || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, telephone: e.target.value})}
                />
              </Form.Group>
            </Col>
<Col md={6}>
<Form.Group className="mb-3">
<Form.Label>
  <i className="fas fa-file-medical me-2"></i>
  Assurances acceptées
</Form.Label>
<Select
  isMulti
  isCreatable
  name="insurances"
  options={insuranceOptions}
  className="basic-multi-select"
  classNamePrefix="select"
  value={insuranceOptions.filter(option => 
    selectedDoctor?.insurances?.includes(option.value)
  )}
  onChange={(selectedOptions) => {
    setSelectedDoctor({
      ...selectedDoctor,
      insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
    });
  }}
  onCreateOption={(inputValue) => {
    const newOption = { value: inputValue, label: inputValue };
    setInsuranceOptions([...insuranceOptions, newOption]);
    setSelectedDoctor({
      ...selectedDoctor,
      insurances: [...(selectedDoctor?.insurances || []), inputValue]
    });
  }}
  formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
  placeholder="Sélectionnez ou saisissez les assurances..."
  noOptionsMessage={() => "Aucune option disponible"}
  styles={{
    control: (base) => ({
      ...base,
      borderRadius: '0.375rem',
      borderColor: '#dee2e6',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0d6efd'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e9ecef',
      borderRadius: '0.25rem'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#495057'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#495057',
      ':hover': {
        backgroundColor: '#dc3545',
        color: 'white'
      }
    })
  }}
/>
<Form.Text className="text-muted">
  Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
</Form.Text>
</Form.Group>
</Col>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Heure début</Form.Label>
                <Form.Control
                  type="time"
                  value={selectedDoctor?.heureDebut || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, heureDebut: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Heure fin</Form.Label>
                <Form.Control
                  type="time"
                  value={selectedDoctor?.heureFin || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, heureFin: e.target.value})}
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
                  value={selectedDoctor?.maxPatientsPerDay || 0}
                  onChange={(e) => setSelectedDoctor({
                    ...selectedDoctor,
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
                  value={selectedDoctor?.consultationDuration || 30}
                  onChange={(e) => setSelectedDoctor({
                    ...selectedDoctor,
                    consultationDuration: parseInt(e.target.value)
                  })}
                  min="15"
                  step="15"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Jours disponibles</Form.Label>
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
              <Form.Check
                key={day}
                type="checkbox"
                label={day}
                checked={selectedDoctor?.disponibilite?.includes(day) || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDoctor({
                      ...selectedDoctor,
                      disponibilite: [...(selectedDoctor?.disponibilite || []), day]
                    });
                  } else {
                    setSelectedDoctor({
                      ...selectedDoctor,
                      disponibilite: selectedDoctor?.disponibilite?.filter(d => d !== day) || []
                    });
                  }
                }}
              />
            ))}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditDoctorModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={() => handleEditDoctor(selectedDoctor)}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>

    {/* Doctor Details Modal */}
    <Modal show={showDoctorDetails} onHide={() => setShowDoctorDetails(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Détails du Médecin</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedDoctor && (
          <div>
            <Row>
              <Col md={6}>
                {selectedDoctor.photo && (
                  <img
                    src={selectedDoctor.photo}
                    alt={`${selectedDoctor.nom}`}
                    className="img-fluid rounded mb-3"
                  />
                )}
              </Col>
              <Col md={6}>
                <h4>{selectedDoctor.nom} {selectedDoctor.prenom}</h4>
                <p><strong>Spécialité:</strong> {selectedDoctor.specialite}</p>
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Téléphone:</strong> {selectedDoctor.telephone}</p>
                <p><strong>Disponibilités:</strong></p>
                <ul>
                  {selectedDoctor.disponibilite?.map(day => (
                    <li key={day}>{day}</li>
                  ))}
                </ul>
                <p><strong>Horaires:</strong> {selectedDoctor.heureDebut} - {selectedDoctor.heureFin}</p>
                {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
                  <div>
                    <p><strong>Certifications:</strong></p>
                    {selectedDoctor.certifications.map((cert, index) => (
                      <Button
                        key={index}
                        variant="link"
                        href={cert}
                        target="_blank"
                      >
                        Certification {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal.Body>
    </Modal>

    {/* Add Patient Modal */}
    <Modal show={showAddPatientModal} onHide={() => setShowAddPatientModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Ajouter un patient privé</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurance
  </Form.Label>
  <Select
    isMulti
    isCreatable
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
        insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
      });
    }}
    onCreateOption={(inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      setNewPatient({
        ...newPatient,
        insurances: [...(newPatient.insurances || []), inputValue]
      });
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
  />
</Form.Group>
</Col>
</Row>
          <Form.Group className="mb-3">
            <Form.Label>Photo</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setPatientPhotoFile(e.target.files[0])}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-file-medical me-2"></i>
              Documents Médicaux
            </Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                setMedicalDocs(files);
                
                // Create preview URLs
                const previews = files.map(file => ({
                  name: file.name,
                  url: URL.createObjectURL(file)
                }));
                setPreviewDocs(previews);
              }}
            />
            {previewDocs.length > 0 && (
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <i className="fas fa-eye me-2"></i>
                  Prévisualiser les documents ({previewDocs.length})
                </Button>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleAddPatient}>
          Ajouter
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-medical me-2"></i>
          Documents Médicaux
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="documents-grid">
          {previewDocs.map((doc, index) => (
            <div key={index} className="document-preview-card">
              {doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                <img 
                  src={doc.url} 
                  alt={doc.name}
                  className="img-fluid rounded"
                />
              ) : (
                <div className="pdf-preview">
                  <i className="fas fa-file-pdf fa-3x text-danger"></i>
                  <p className="mt-2">{doc.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>

    <style jsx>{`

    .basic-multi-select {
.select__control--is-focused {
border-color: #0d6efd !important;
box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
}

.select__multi-value {
background-color: #e7f5ff !important;
border-radius: 20px !important;
padding: 2px 8px !important;
}

.select__multi-value__remove {
border-radius: 50% !important;
padding: 2px !important;
margin-left: 4px !important;
}
}
      .documents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }
      
      .document-preview-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
      }
      
      .pdf-preview {
        padding: 2rem;
        background: #f8f9fa;
        border-radius: 8px;
      }
    `}</style>

    {/* Patient Details Modal */}
    <Modal show={showPatientDetails} onHide={() => setShowPatientDetails(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Détails du Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedPatient && (
          <div>
            <Row>
              <Col md={6}>
                {selectedPatient.photo && (
                  <img
                    src={selectedPatient.photo}
                    alt={`${selectedPatient.nom}`}
                    className="img-fluid rounded mb-3"
                  />
                )}
              </Col>
              <Col md={6}>
                <h4>{selectedPatient.nom} {selectedPatient.prenom}</h4>
                <p><strong>Age:</strong> {selectedPatient.age}</p>
                <p><strong>Sexe:</strong> {selectedPatient.sexe}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p><strong>Téléphone:</strong> {selectedPatient.telephone}</p>
                <p><strong>Adresse:</strong> {selectedPatient.adresse}</p>
                {/*<p><strong>Mot de passe:</strong>{selectedPatient.password}</p>*/}
              
                {selectedPatient.antecedents && (
                  <div>
                    <p><strong>Antécédents médicaux:</strong></p>
                    <ul>
                      {selectedPatient.antecedents.map((ant, index) => (
                        <li key={index}>{ant}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Col>
            </Row>
          </div>
        )}
        <div className="mb-3">
<p><strong>Assurances:</strong></p>
<div className="insurance-tags">
{selectedPatient?.insurances && selectedPatient.insurances.length > 0 ? (
  selectedPatient.insurances.map((insurance, index) => (
    <span key={index} className="insurance-tag">
      {insurance}
      {index < selectedPatient.insurances.length - 1 ? ', ' : ''}
    </span>
  ))
) : (
  <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
)}
</div>
</div>
        <div className="documents-section mt-4">
          <h5 className="mb-3">
            <i className="fas fa-file-medical me-2"></i>
            Documents Médicaux
          </h5>
          <div className="documents-grid">
            {selectedPatient?.documents?.map((docUrl, index) => (
              <div key={index} className="document-item">
                {docUrl.includes('.pdf') ? (
                  <a 
                    href={docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-file-pdf me-2"></i>
                    Document {index + 1}
                  </a>
                ) : (
                  <img 
                    src={docUrl} 
                    alt={`Document ${index + 1}`}
                    className="img-fluid rounded"
                    onClick={() => window.open(docUrl, '_blank')}
                    style={{cursor: 'pointer'}}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal.Body>
    </Modal>

    {/* Assign Patients Modal */}
    <Modal show={showAssignPatientsModal} onHide={() => setShowAssignPatientsModal(false)} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-user-md me-2"></i>
          Assignations multiples - Dr. {selectedDoctor?.nom}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light p-4">
        <Form>
          {/* Days Selection */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-calendar-day me-2"></i>
                  Jours disponibles
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {selectedDoctor?.disponibilite.map(day => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(day) ? "primary" : "outline-primary"}
                      className="rounded-pill shadow-sm"
                      onClick={() => {
                        setSelectedDays(prev =>
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                    >
                      <i className="far fa-calendar me-1"></i>
                      {day}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Time Slots */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-clock me-2"></i>
                  Créneaux horaires
                </Form.Label>
                <div className="time-slots-container">
                  {generateTimeSlots(
                    selectedDoctor?.heureDebut,
                    selectedDoctor?.heureFin,
                    selectedDoctor?.consultationDuration
                  ).map(slot => (
                    <Button
                      key={slot}
                      variant={selectedTimeSlots.includes(slot) ? "primary" : "outline-primary"}
                      className="rounded-pill shadow-sm m-1"
                      onClick={() => {
                        setSelectedTimeSlots(prev =>
                          prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                        );
                      }}
                    >
                      <i className="far fa-clock me-1"></i>
                      {slot}
                    </Button>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Patients Selection */}
          <Row>
            <Col md={12}>
              <span className="badge bg-primary">
                <i className="fas fa-users me-1"></i>
                {selectedPatientIds.length} patient(s) sélectionné(s)
              </span>
              <Form.Group className="bg-white p-3 rounded shadow-sm">
                <Form.Label className="fw-bold text-primary mb-3">
                  <i className="fas fa-users me-2"></i>
                  Sélection des patients
                </Form.Label>
                
                <div className="mb-3">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setSelectedPatientIds(patients.map(p => p.id))}
                    className="me-2 rounded-pill"
                  >
                    <i className="fas fa-check-double me-1"></i>
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setSelectedPatientIds([])}
                    className="rounded-pill"
                  >
                    <i className="fas fa-times me-1"></i>
                    Tout désélectionner
                  </Button>
                </div>

                <div className="patients-list">
                  {patients.map(patient => (
                    <div key={patient.id} className="patient-item p-2 rounded hover-effect">
                      <Form.Check
                        type="checkbox"
                        className="d-flex align-items-center"
                        label={
                          <div className="ms-2">
                            <span className="fw-bold">{patient.nom} {patient.prenom}</span>
                            <small className="text-muted ms-2">
                              <i className="fas fa-phone-alt me-1"></i>
                              {patient.telephone}
                            </small>
                          </div>
                        }
                        checked={selectedPatientIds.includes(patient.id)}
                        onChange={(e) => {
                          setSelectedPatientIds(prev =>
                            e.target.checked
                              ? [...prev, patient.id]
                              : prev.filter(id => id !== patient.id)
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                <style jsx>
                  {`
                    .time-slots-container {
                      max-height: 200px;
                      overflow-y: auto;
                      padding: 10px;
                      border-radius: 8px;
                    }

                    .patients-list {
                      max-height: 300px;
                      overflow-y: auto;
                      border: 1px solid #dee2e6;
                      border-radius: 8px;
                      padding: 10px;
                    }

                    .patient-item {
                      transition: background-color 0.2s ease;
                    }

                    .patient-item:hover {
                      background-color: #f8f9fa;
                    }

                    .hover-effect {
                      transition: transform 0.2s ease;
                    }

                    .hover-effect:hover {
                      transform: translateX(5px);
                    }

                    /* Scrollbar styling */
                    .time-slots-container::-webkit-scrollbar,
                    .patients-list::-webkit-scrollbar {
                      width: 6px;
                    }

                    .time-slots-container::-webkit-scrollbar-track,
                    .patients-list::-webkit-scrollbar-track {
                      background: #f1f1f1;
                    }

                    .time-slots-container::-webkit-scrollbar-thumb,
                    .patients-list::-webkit-scrollbar-thumb {
                      background: #888;
                      border-radius: 3px;
                    }
                  `}
                </style>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div className="selected-count">
              
            </div>
            <div className='d-flex'> 
              <Button
                variant="outline-secondary"
                onClick={() => setShowAssignPatientsModal(false)}
                className="me-2 rounded-pill"
              >
                <i className="fas fa-times me-1"></i>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleMultipleAssignments}
                disabled={!selectedPatientIds.length || !selectedDays.length || !selectedTimeSlots.length}
                className="rounded-pill"
              >
                <i className="fas fa-check me-1"></i>
                Confirmer les assignations
              </Button>
            </div>
          </div>
        </div>
      </Modal.Footer>
    </Modal>

    {/* Edit Patient Modal */}
    <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Modifier le patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.nom || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, nom: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prénom</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.prenom || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, prenom: e.target.value})}
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
                  value={selectedPatient?.age || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, age: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sexe</Form.Label>
                <Form.Select
                  value={selectedPatient?.sexe || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, sexe: e.target.value})}
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
                  value={selectedPatient?.email || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                />
              </Form.Group>
            </Col>
            {/*
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  value={selectedPatient?.password || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, password: e.target.value})}
                />
              </Form.Group>
            </Col>
            */}
            
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={selectedPatient?.telephone || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, telephone: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Adresse</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedPatient?.adresse || ''}
                  onChange={(e) => setSelectedPatient({...selectedPatient, adresse: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Antécédents médicaux</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={selectedPatient?.antecedents?.join('\n') || ''}
              onChange={(e) => setSelectedPatient({
                ...selectedPatient,
                antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
              })}
            />
          </Form.Group>
        
<Form.Group className="mb-3">
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurance
  </Form.Label>  
  <Select
    isMulti
    isCreatable
    name="insurances" 
    options={insuranceOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={insuranceOptions.filter(option => 
      selectedPatient?.insurances?.includes(option.value)
    )}
    onChange={(selectedOptions) => {
      setSelectedPatient({
        ...selectedPatient,
        insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
      });
    }}
    onCreateOption={(inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      setSelectedPatient({
        ...selectedPatient, 
        insurances: [...(selectedPatient?.insurances || []), inputValue]
      });
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
  />
</Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">
              <i className="fas fa-camera me-2"></i>
              Photo du patient
            </Form.Label>
            
            <div className="current-photo-container text-center p-3 bg-light rounded mb-3">
              {selectedPatient?.photo ? (
                <div className="position-relative d-inline-block">
                  <img 
                    src={selectedPatient.photo} 
                    alt="Photo actuelle" 
                    className="rounded-circle shadow"
                    style={{
                      height: '150px',
                      width: '150px',
                      objectFit: 'cover',
                      border: '4px solid white'
                    }}
                  />
                  <div className="photo-label mt-2 text-muted">
                    <small>Photo actuelle</small>
                  </div>
                </div>
              ) : (
                <div className="default-avatar">
                  <i className="fas fa-user-circle fa-5x text-secondary"></i>
                  <div className="mt-2 text-muted">
                    <small>Aucune photo</small>
                  </div>
                </div>
              )}
            </div>

            <div className="upload-section">
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                className="form-control-sm"
              />
              <small className="text-muted mt-1 d-block">
                Formats acceptés: JPG, PNG, GIF
              </small>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Documents Médicaux Actuels</Form.Label>
            <div className="current-docs mb-2">
              {selectedPatient?.documents?.map((doc, index) => (
                <Button 
                  key={index}
                  variant="outline-info"
                  size="sm"
                  className="me-2 mb-2"
                  onClick={() => window.open(doc, '_blank')}
                >
                  <i className="fas fa-file-medical me-2"></i>
                  Document {index + 1}
                </Button>
              ))}
            </div>
            
            <Form.Label>Ajouter de nouveaux documents</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setEditMedicalDocs(files);
                
                const previews = files.map(file => ({
                  name: file.name,
                  url: URL.createObjectURL(file)
                }));
                setEditPreviewDocs(previews);
              }}
            />
            
            {editPreviewDocs.length > 0 && (
              <div className="mt-2">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <i className="fas fa-eye me-2"></i>
                  Prévisualiser les nouveaux documents ({editPreviewDocs.length})
                </Button>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
          Annuler
        </Button>
        <Button variant="primary" onClick={() => handleEditPatient(selectedPatient)}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>

    <Modal show={showAppointmentsModal} onHide={() => setShowAppointmentsModal(false)} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-calendar-alt me-2"></i>
          Rendez-vous de {selectedDoctor?.nom}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light">
        {/* Days selection */}
        <div className="mb-4 p-3 bg-white rounded shadow-sm">
          <h6 className="text-primary mb-3">
            <i className="fas fa-clock me-2"></i>
            Sélectionner un jour:
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            {[...new Set(appointments.map(app => app.day))]
              .sort((a, b) => weekdayOrder[a] - weekdayOrder[b])
              .map(day => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "primary" : "outline-primary"}
                  onClick={() => setSelectedDay(day)}
                  className="rounded-pill shadow-sm"
                >
                  <i className="far fa-calendar me-1"></i>
                  {day}
                </Button>
              ))}
          </div>
        </div>

        {/* Appointments list */}
        <div className="appointments-container">
{appointments
.filter(app => !selectedDay || app.day === selectedDay)
.sort((a, b) => {
  if (a.orderNumber && b.orderNumber) {
    return a.orderNumber - b.orderNumber;
  }
  const dayDiff = weekdayOrder[a.day] - weekdayOrder[b.day];
  if (dayDiff !== 0) return dayDiff;
  return a.timeSlot.localeCompare(b.timeSlot);
})
.map((appointment, index) => {
  const patient = patients.find(p => p.id === appointment.patientId);
  return (
    <div key={appointment.id} className="mb-3 p-4 bg-white rounded shadow-sm hover-effect">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <span className="badge bg-primary rounded-circle me-2">
            {appointment.orderNumber || index + 1}
          </span>
          <h6 className="text-primary mb-0">
            <i className="fas fa-user me-2"></i>
            {patient?.nom} {patient?.prenom}
          </h6>
        </div>
        <span className={`badge ${appointment.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
          {appointment.status}
        </span>
      </div>
                  
                  <div className="row g-3">
                    <div className="col-md-4">
                      <p className="mb-1">
                        <i className="far fa-calendar-alt me-2 text-muted"></i>
                        <strong>Jour:</strong>
                      </p>
                      <p className="text-muted">{appointment.day || 'Non spécifié'}</p>
                    </div>
                    
                    <div className="col-md-4">
                      <p className="mb-1">
                        <i className="far fa-clock me-2 text-muted"></i>
                        <strong>Horaire:</strong>
                      </p>
                      <p className="text-muted">{appointment.timeSlot}</p>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="success"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleCompleteAppointment(appointment.id)}
                      >
                        <i className="fas fa-check me-1"></i>
                        Marquer comme terminé
                      </Button>
                    )}
                    {appointment.status === 'completed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                      >
                        <i className="fas fa-trash me-1"></i>
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
        <style jsx>
          {`
            .hover-effect {
              transition: transform 0.2s ease-in-out;
            }

            .hover-effect:hover {
              transform: translateY(-2px);
            }

            .appointments-container {
              max-height: 60vh;
              overflow-y: auto;
              padding-right: 5px;
            }

            .appointments-container::-webkit-scrollbar {
              width: 6px;
            }

            .appointments-container::-webkit-scrollbar-track {
              background: #f1f1f1;
            }

            .appointments-container::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 3px;
            }
          `}
        </style>
      </Modal.Body>
    </Modal>

    <Modal 
      show={showProfileModal} 
      onHide={() => setShowProfileModal(false)}
      dialogClassName="modal-right"
      className="sidebar-modal"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-hospital-alt me-2"></i>
          Profil de la Structure
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {structure && (
          <div className="structure-profile">
            <div className="profile-header text-center p-4 bg-light">
              {structure.photo ? (
                <img 
                  src={structure.photo} 
                  alt={structure.name}
                  className="img-fluid rounded-circle profile-image mb-3"
                  style={{width: '150px', height: '150px', objectFit: 'cover'}}
                />
              ) : (
                <div className="default-avatar mb-3">
                  <i className="fas fa-hospital fa-4x"></i>
                </div>
              )}
              <h3 className="fw-bold">{structure.name}</h3>
              <span className="badge bg-success">Structure Médicale</span>
            </div>

            <div className="profile-content p-4">

              <div className="info-section mb-4">
                <h5 className="section-title border-bottom pb-2">
                  <i className="fas fa-chart-bar me-2"></i>
                  Statistiques
                </h5>
                <div className="info-item">
                  <p><strong>Nombre de médecins:</strong> {doctors.length}</p>
                  <p><strong>Nombre de patients:</strong> {patients.length}</p>
                  <p><strong>Date d'inscription:</strong> {new Date(structure.dateInscription).toLocaleDateString()}</p>
                </div>
              </div>

            
            </div>
          </div>
        )}
      
      </Modal.Body>
    </Modal>

    <Modal 
      show={showSettingsModal} 
      onHide={() => setShowSettingsModal(false)} 
      size="lg"
      dialogClassName="modal-90w"
      className="structure-settings-modal"
    >
      <Modal.Header closeButton className="bg-gradient bg-primary text-white py-3">
        <Modal.Title className="d-flex align-items-center">
          <i className="fas fa-hospital-alt me-3 fa-2x"></i>
          <div>
            <h5 className="mb-0">{isEditing ? 'Modifier les informations' : 'Profil de la Structure'}</h5>
            <small>{structure?.name}</small>
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div className="structure-profile bg-light">
          <div className="profile-header text-center p-4 bg-white shadow-sm">
            <div className="position-relative d-inline-block">
              {structure?.photoUrl ? (
                <img
                  src={structure.photoUrl}
                  alt={structure.name}
                  className="img-fluid rounded-circle profile-image mb-3 shadow"
                  style={{width: '150px', height: '150px', objectFit: 'cover'}}
                />
              ) : (
                <div className="default-avatar mb-3 rounded-circle bg-primary bg-opacity-10 p-4">
                  <i className="fas fa-hospital fa-4x text-primary"></i>
                </div>
              )}
              {!isEditing && (
                <Button 
                  variant="primary"
                  size="sm"
                  className="position-absolute bottom-0 end-0 rounded-circle p-2"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-pencil-alt"></i>
                </Button>
              )}
            </div>
            <h3 className="fw-bold mb-2">{structure?.name}</h3>
            <span className="badge bg-success rounded-pill px-3 py-2">
              <i className="fas fa-check-circle me-2"></i>
              Structure Médicale
            </span>
          </div>

          <div className="profile-content p-4">
            {!isEditing ? (
              <div className="view-mode">
                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-info-circle me-2"></i>
                    Informations Générales
                  </h5>
                  <div className="info-item p-3">
                    <Row className="g-3">
                      <Col md={6}>
                        <p className="mb-2">
                          <i className="fas fa-envelope text-primary me-2"></i>
                          <strong>Email:</strong> {structure?.email}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-mobile-alt text-primary me-2"></i>
                          <strong>Mobile:</strong> {structure?.phones?.mobile}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-phone text-primary me-2"></i>
                          <strong>Fixe:</strong> {structure?.phones?.landline}
                        </p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-2">
                          <i className="fas fa-map-marker-alt text-primary me-2"></i>
                          <strong>Adresse:</strong> {structure?.address}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-calendar-alt text-primary me-2"></i>
                          <strong>Création:</strong> {structure?.creationYear}
                        </p>
                        <p className="mb-2">
                          <i className="fas fa-user text-primary me-2"></i>
                          <strong>Responsable:</strong> {structure?.responsible}
                        </p>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-file-medical me-2"></i>
                    Assurances acceptées
                  </h5>
                  <div className="info-item p-3">
                    <div className="d-flex flex-wrap gap-2">
                      {structure?.insurance?.map((ins, index) => (
                        <span key={index} className="badge bg-info rounded-pill px-3 py-2">
                          <i className="fas fa-check-circle me-2"></i>
                          {ins}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
<div className="info-section mb-4 bg-white rounded shadow-sm">
<h5 className="section-title border-bottom pb-2">
<i className="fas fa-stethoscope me-2"></i>
Spécialités médicales gérées
</h5>
<div className="info-item p-3">
<div className="d-flex flex-wrap gap-2">
  {structure?.specialties?.map((specialty, index) => (
    <span key={index} className="badge bg-primary rounded-pill px-3 py-2">
      <i className="fas fa-user-md me-2"></i>
      {specialty}
    </span>
  ))}
  {(!structure?.specialties || structure.specialties.length === 0) && (
    <p className="text-muted fst-italic mb-0">
      Aucune spécialité spécifiée
    </p>
  )}
</div>
</div>
</div>

                <div className="info-section mb-4 bg-white rounded shadow-sm">
                  <h5 className="section-title border-bottom pb-2">
                    <i className="fas fa-chart-bar me-2"></i>
                    Statistiques
                  </h5>
                  <div className="info-item p-3">
                    <Row className="g-3">
                      <Col md={4}>
                        <div className="card bg-primary text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{doctors.length}</h3>
                            <small>Médecins</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="card bg-success text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{patients.length}</h3>
                            <small>Patients</small>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="card bg-info text-white">
                          <div className="card-body text-center">
                            <h3 className="mb-0">{structure?.dateInscription ? new Date(structure.dateInscription).toLocaleDateString() : '-'}</h3>
                            <small>Inscription</small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    className="me-2 rounded-pill px-4"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Modifier les informations
                  </Button>

                  <Button
                    variant="outline-primary"
                    onClick={async () => {
                      try {
                        await sendPasswordResetEmail(auth, structure.email);
                        setMessage('Email de réinitialisation envoyé');
                      } catch (error) {
                        setMessage('Erreur: ' + error.message);
                      }
                    }}
                    className="rounded-pill px-4"
                  >
                    <i className="fas fa-lock me-2"></i>
                    Réinitialiser le mot de passe
                  </Button>
                </div>
              </div>
            ) : (
              <div className="edit-mode bg-white rounded shadow-sm p-4">
                <Form className="structure-edit-form">
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-building me-2"></i>
                          Nom de la structure
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.name || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, name: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              name: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-envelope me-2"></i>
                          Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={structure?.email || ''}
                          disabled
                          className="bg-light rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-mobile-alt me-2"></i>
                          Téléphone mobile
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          value={structure?.phones?.mobile || ''}
                          onChange={async (e) => {
                            const updatedStructure = {
                              ...structure,
                              phones: {...structure.phones, mobile: e.target.value}
                            };
                            await updateDoc(doc(db, 'structures', structure.id), {
                              'phones.mobile': e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-phone me-2"></i>
                          Téléphone fixe
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          value={structure?.phones?.landline || ''}
                          onChange={async (e) => {
                            const updatedStructure = {
                              ...structure,
                              phones: {...structure.phones, landline: e.target.value}
                            };
                            await updateDoc(doc(db, 'structures', structure.id), {
                              'phones.landline': e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-calendar-alt me-2"></i>
                          Année de création
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={structure?.creationYear || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, creationYear: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              creationYear: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <i className="fas fa-user me-2"></i>
                          Responsable
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.responsible || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, responsible: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              responsible: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Adresse
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={structure?.address || ''}
                      onChange={async (e) => {
                        const updatedStructure = {...structure, address: e.target.value};
                        await updateDoc(doc(db, 'structures', structure.id), {
                          address: e.target.value
                        });
                        setStructure(updatedStructure);
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-globe me-2"></i>
                      Site web
                    </Form.Label>
                    <Form.Control
                      type="url"
                      value={structure?.website || ''}
                      onChange={async (e) => {
                        const updatedStructure = {...structure, website: e.target.value};
                        await updateDoc(doc(db, 'structures', structure.id), {
                          website: e.target.value
                        });
                        setStructure(updatedStructure);
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>

<Form.Group className="mb-4">
<Form.Label>
<i className="fas fa-file-medical me-2"></i>
Assurances acceptées
</Form.Label>
<Select
isMulti
isCreatable
name="insurances"
options={insuranceOptions}
className="basic-multi-select"
classNamePrefix="select"
value={structure?.insurance?.map(insurance => ({
  value: insurance,
  label: insurance
})) || []}
onChange={async (selectedOptions) => {
  const insuranceArray = selectedOptions.map(option => option.value);
  const updatedStructure = { ...structure, insurance: insuranceArray };
  await updateDoc(doc(db, 'structures', structure.id), {
    insurance: insuranceArray
  });
  setStructure(updatedStructure);
}}
onCreateOption={async (inputValue) => {
  const newOption = { value: inputValue, label: inputValue };
  setInsuranceOptions([...insuranceOptions, newOption]);
  const updatedInsurance = [...(structure?.insurance || []), inputValue];
  const updatedStructure = { ...structure, insurance: updatedInsurance };
  await updateDoc(doc(db, 'structures', structure.id), {
    insurance: updatedInsurance
  });
  setStructure(updatedStructure);
}}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les assurances..."
noOptionsMessage={() => "Aucune assurance disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
</Form.Group>
                
<Form.Group className="mb-4">
<Form.Label>
<i className="fas fa-stethoscope me-2"></i>
Spécialités médicales gérées
</Form.Label>
<Select
isMulti
isCreatable
name="specialties"
options={specialtyOptions}
className="basic-multi-select"
classNamePrefix="select"
value={structure?.specialties?.map(specialty => ({
  value: specialty,
  label: specialty
})) || []}
onChange={async (selectedOptions) => {
  const specialtiesArray = selectedOptions.map(option => option.value);
  const updatedStructure = { ...structure, specialties: specialtiesArray };
  // Sauvegarder dans Firestore
  await updateDoc(doc(db, 'structures', structure.id), {
    specialties: specialtiesArray
  });
  setStructure(updatedStructure);
}}
onCreateOption={async (inputValue) => {
  const newOption = { value: inputValue, label: inputValue };
  setSpecialtyOptions([...specialtyOptions, newOption]);
  const updatedSpecialties = [...(structure?.specialties || []), inputValue];
  const updatedStructure = { ...structure, specialties: updatedSpecialties };
  // Sauvegarder dans Firestore
  await updateDoc(doc(db, 'structures', structure.id), {
    specialties: updatedSpecialties
  });
  setStructure(updatedStructure);
}}
formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
placeholder="Sélectionnez ou saisissez les spécialités..."
noOptionsMessage={() => "Aucune spécialité disponible"}
styles={{
  control: (base) => ({
    ...base,
    borderRadius: '0.375rem',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0d6efd'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#e9ecef',
    borderRadius: '0.25rem'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#495057'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#495057',
    ':hover': {
      backgroundColor: '#dc3545',
      color: 'white'
    }
  })
}}
/>
</Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <i className="fas fa-camera me-2"></i>
                      Photo de la structure
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const photoRef = ref(storage, `structures/${structure.id}/photo`);
                          await uploadBytes(photoRef, file);
                          const photoUrl = await getDownloadURL(photoRef);
                          await updateDoc(doc(db, 'structures', structure.id), {
                            photoUrl: photoUrl
                          });
                          setStructure({...structure, photoUrl: photoUrl});
                        }
                      }}
                      className="rounded-pill"
                    />
                  </Form.Group>
                </Form>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top">
        {isEditing ? (
          <div className="w-100 d-flex justify-content-between">
            <Button
              variant="outline-secondary"
              onClick={() => setIsEditing(false)}
              className="rounded-pill px-4"
            >
              <i className="fas fa-times me-2"></i>
              Annuler
            </Button>
            <Button
              variant="success"
              onClick={() => {
                setIsEditing(false);
                setMessage('Modifications enregistrées');
              }}
              className="rounded-pill px-4"
            >
              <i className="fas fa-save me-2"></i>
              Enregistrer
            </Button>
          </div>
        ) : (
          <div className="w-100 text-end">
            <Button
              variant="secondary"
              onClick={() => setShowSettingsModal(false)}
              className="rounded-pill px-4"
            >
              <i className="fas fa-times me-2"></i>
              Fermer
            </Button>
          </div>
        )}
      </Modal.Footer>

      <style jsx>{`
        .structure-settings-modal .modal-content {
          border-radius: 1rem;
          overflow: hidden;
        }

        .profile-image {
          transition: transform 0.3s ease;
          border: 4px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .profile-image:hover {
          transform: scale(1.05);
        }

        .info-section {
          transition: transform 0.2s ease;
        }

        .info-section:hover {
          transform: translateY(-2px);
        }

        .section-title {
          color: #2c3e50;
          font-weight: 600;
        }

        .info-item p {
          margin-bottom: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background: #f8f9fa;
          transition: background-color 0.2s ease;
        }

        .info-item p:hover {
          background: #e9ecef;
        }

        .structure-edit-form .form-control {
          border: 1px solid #dee2e6;
          padding: 0.75rem 1.25rem;
          transition: all 0.2s ease;
        }

        .structure-edit-form .form-control:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
        }

        .card {
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-3px);
        }
      `}</style>
    </Modal>

    <Modal 
      show={showAssignedDoctorModal} 
      onHide={() => setShowAssignedDoctorModal(false)}
      size="lg"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-user-md me-2"></i>
          Médecins et Rendez-vous
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {assignedDoctors.length > 0 ? (
          assignedDoctors.map(doctor => (
            <div key={doctor.id} className="assigned-doctor-info mb-4">
              <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                <h5 className="border-bottom pb-2 text-primary">
                  <i className="fas fa-user-md me-2"></i>
                  Dr. {doctor.nom} {doctor.prenom}
                </h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                    <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                    <p><strong>Email:</strong> {doctor.email}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                    <p><strong>Jours disponibles:</strong></p>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                      {doctor.disponibilite?.map(day => (
                        <span key={day} className="badge bg-info">{day}</span>
                      ))}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="appointments-section">
                <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
                {doctorAppointments[doctor.id]?.length > 0 ? (
                  <div className="appointments-list">
                    {doctorAppointments[doctor.id]
                      .sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day])
                      .map(apt => (
                        <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="mb-1">
                                <i className="fas fa-calendar-day me-2 text-primary"></i>
                                <strong>Jour:</strong> {apt.day}
                              </p>
                              <p className="mb-0">
                                <i className="fas fa-clock me-2 text-primary"></i>
                                <strong>Heure:</strong> {apt.timeSlot}
                              </p>
                            </div>
                            <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4">
            <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
            <p>Aucun médecin assigné pour le moment</p>
          </div>
        )}
      </Modal.Body>
    </Modal>

    <Modal 
show={showDoctorScheduleModal} 
onHide={() => {
setShowDoctorScheduleModal(false);
setSelectedDoctorDetails(null);
}}
size="lg"
>
<Modal.Header closeButton className="bg-primary text-white">
<Modal.Title>
  <i className="fas fa-calendar-check me-2"></i>
  Rendez-vous du Dr. {selectedDoctorDetails?.nom} {selectedDoctorDetails?.prenom}
</Modal.Title>
</Modal.Header>
<Modal.Body>
<div className="doctor-info mb-4 p-3 bg-light rounded">
  <Row>
    <Col md={6}>
      <p className="mb-2">
        <i className="fas fa-stethoscope me-2 text-primary"></i>
        <strong>Spécialité:</strong> {selectedDoctorDetails?.specialite}
      </p>
    </Col>
    <Col md={6}>
      <p className="mb-2">
        <i className="fas fa-clock me-2 text-primary"></i>
        <strong>Horaires:</strong> {selectedDoctorDetails?.heureDebut} - {selectedDoctorDetails?.heureFin}
      </p>
    </Col>
  </Row>
</div>

<div className="d-flex justify-content-between align-items-center mb-4">
  <h6 className="mb-0">Rendez-vous du {selectedDay}</h6>
  <ButtonGroup size="sm">
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => 
          a.timeSlot.localeCompare(b.timeSlot)
        );
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-clock me-2"></i>
      Par heure
    </Button>
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
          const patientA = patients.find(p => p.id === a.patientId)?.nom;
          const patientB = patients.find(p => p.id === b.patientId)?.nom;
          return patientA?.localeCompare(patientB);
        });
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-user me-2"></i>
      Par patient
    </Button>
    <Button 
      variant="outline-primary"
      onClick={() => {
        const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return 0;
        });
        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: sorted
        });
      }}
    >
      <i className="fas fa-tasks me-2"></i>
      Par statut
    </Button>
  </ButtonGroup>
</div>

<div className="appointments-list">
{selectedDoctorDetails?.appointments?.length > 0 ? (
<div className="list-group">
{selectedDoctorDetails.appointments.map((apt, index) => {
  const patient = patients.find(p => p.id === apt.patientId);
  return (
    <div 
      key={apt.id} 
      className="list-group-item list-group-item-action appointment-item"
    >
      <div className="d-flex justify-content-between align-items-start">
        <div className="me-3">
          <span className="badge bg-primary rounded-circle">
            {apt.orderNumber || index + 1}
          </span>
        </div>
        <div className="flex-grow-1">
          <div className="fw-bold text-primary">
            <i className="fas fa-clock me-2"></i>
            {apt.timeSlot}
          </div>
          <div className="mt-2">
            <div className="fw-bold">{patient?.nom} {patient?.prenom}</div>
            <small className="text-muted">
              <i className="fas fa-phone me-2"></i>
              {patient?.telephone}
            </small>
            {lastReorganization[apt.id] && (
              <div className="mt-1">
                <small className="text-muted fst-italic">
                  <i className="fas fa-history me-1"></i>
                  Dernière modification: {lastReorganization[apt.id]}
                </small>
              </div>
            )}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge 
            bg={apt.status === 'completed' ? 'success' : 'warning'}
            className="rounded-pill"
          >
            {apt.status === 'completed' ? 'Terminé' : 'En attente'}
          </Badge>
          <ButtonGroup vertical size="sm">
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="btn-icon"
              onClick={() => moveAppointment(apt.id, 'up')}
              disabled={index === 0}
            >
              <i className="fas fa-arrow-up"></i>
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              className="btn-icon"
              onClick={() => moveAppointment(apt.id, 'down')}
              disabled={index === selectedDoctorDetails.appointments.length - 1}
            >
              <i className="fas fa-arrow-down"></i>
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
})}
</div>
) : (
<div className="text-center py-4">
<i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
<p className="text-muted">Aucun rendez-vous programmé pour ce jour</p>
</div>
)}
</div>
</Modal.Body>
<Modal.Footer>
<Button variant="secondary" onClick={() => setShowDoctorScheduleModal(false)}>
  Fermer
</Button>
</Modal.Footer>
</Modal>

<style jsx>{`

.badge.rounded-circle {
width: 25px;
height: 25px;
display: flex;
align-items: center;
justify-content: center;
font-size: 0.8rem;
}

.appointment-item {
transition: all 0.2s ease;
}

.appointment-item:hover {
transform: translateX(5px);
background-color: #f8f9fa;
}

.appointment-item .text-muted small {
font-size: 0.85em;
}

.appointment-item .history-info {
font-size: 0.8em;
color: #6c757d;
}
.cursor-pointer:hover {
transform: translateY(-2px);
box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.appointments-list {
max-height: 60vh;
overflow-y: auto;
padding-right: 5px;
}

.appointment-item {
transition: transform 0.2s;
border: 1px solid rgba(0,0,0,.125);
margin-bottom: 0.5rem;
}

.appointment-item:hover {
transform: translateX(5px);
background-color: #f8f9fa;
}

.btn-icon {
padding: 0.2rem 0.4rem;
}

.list-group-item {
border-left: 4px solid transparent;
}

.list-group-item:hover {
border-left-color: #0d6efd;
}
`}</style>

<Modal show={showQRModal} onHide={() => setShowQRModal(false)}>
<Modal.Header closeButton>
<Modal.Title>Code QR d'inscription</Modal.Title>
</Modal.Header>
<Modal.Body className="text-center">
<QRCodeSVG 
  value={`${window.location.origin}/qr-register/${structure?.id}`}
  size={256}
  level="H"
/>
<p className="mt-3">
  Scannez ce code QR pour permettre aux médecins et patients de s'inscrire directement dans votre structure.
</p>
</Modal.Body>
</Modal>

  </Container>
);
};

export default StructuresDashboard;











import React, { useState, useEffect } from 'react';
    import { db, storage,auth } from '../components/firebase-config.js';
    import { doc, updateDoc, getDoc, addDoc, collection, deleteDoc, query, where, getDocs,onSnapshot,setDoc,arrayUnion,arrayRemove, writeBatch } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { Container, Row, Col, Card, Button, Alert, Modal, Form ,ButtonGroup,Dropdown,Offcanvas,Badge} from 'react-bootstrap';
    import { useNavigate } from 'react-router-dom';
    import { 
      sendSignInLinkToEmail,
      sendPasswordResetEmail ,
      getAuth,
      createUserWithEmailAndPassword,
      signOut
    } from 'firebase/auth';
    
import {Calendar } from 'react-calendar';
import { QRCodeSVG } from 'qrcode.react';

    import './StructureDashboard.css';
    import CreatableSelect from 'react-select/creatable';
    import Select from 'react-select/creatable';


    
    const StructuresDashboard = () => {

      const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  

      useEffect(() => {
        if (showMenuSidebar) {
          setShowProfileSidebar(false);
        }
        if (showProfileSidebar) {
          setShowMenuSidebar(false);
        }
      }, [showMenuSidebar, showProfileSidebar]);

      
    const [structure, setStructure] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [message, setMessage] = useState('');
    const [showDoctorDetails, setShowDoctorDetails] = useState(false);
    const [showPatientDetails, setShowPatientDetails] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [certFiles, setCertFiles] = useState([]);
    const [showAssignPatientsModal, setShowAssignPatientsModal] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(1);
    const [bookedSlots, setBookedSlots] = useState({});
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);

    const [viewMode, setViewMode] = useState('calendar'); // 'doctors', 'patients', 'both'
    const [displayMode, setDisplayMode] = useState('grid'); // 'grid', 'table'
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [selectedPatientIds, setSelectedPatientIds] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
    const [selectedDay, setSelectedDay] = useState('Lundi');

    const [showEditForm, setShowEditForm] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(null);
    const [editedStructure, setEditedStructure] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [lastEditDate, setLastEditDate] = useState(null);
    const [medicalDocs, setMedicalDocs] = useState([]);
    const [previewDocs, setPreviewDocs] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [editMedicalDocs, setEditMedicalDocs] = useState([]);
    const [editPreviewDocs, setEditPreviewDocs] = useState([]);
const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState(null);
const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
const [currentPack, setCurrentPack] = useState(null);
const [showPackModal, setShowPackModal] = useState(false);
const [changingPack, setChangingPack] = useState(false);
// Ajoutez cette fonction pour gérer le clic sur un médecin
const handleDoctorClick = (doctor) => {
  setSelectedDoctorDetails(doctor);
  setShowDoctorScheduleModal(true);
};

const [insuranceOptions, setInsuranceOptions] = useState([
  { value: 'CNAM', label: 'CNAM' },
  { value: 'CNSS', label: 'CNSS' },
  { value: 'CNRPS', label: 'CNRPS' },
  { value: 'Assurance privée', label: 'Assurance privée' },
  { value: 'Autre', label: 'Autre' }
]);
const [specialtyOptions, setSpecialtyOptions] = useState([
  { value: 'Médecine générale', label: 'Médecine générale' },
  { value: 'Cardiologie', label: 'Cardiologie' },
  { value: 'Pédiatrie', label: 'Pédiatrie' },
  { value: 'Dentisterie', label: 'Dentisterie' },
  { value: 'Dermatologie', label: 'Dermatologie' },
  { value: 'Gynécologie', label: 'Gynécologie' },
  { value: 'Ophtalmologie', label: 'Ophtalmologie' },
  { value: 'Orthopédie', label: 'Orthopédie' },
  { value: 'Neurologie', label: 'Neurologie' },
  { value: 'Psychiatrie', label: 'Psychiatrie' },
  { value: 'ORL', label: 'ORL' },
  { value: 'Rhumatologie', label: 'Rhumatologie' },
  { value: 'Pneumologie', label: 'Pneumologie' },
  { value: 'Endocrinologie', label: 'Endocrinologie' },
  { value: 'Autre', label: 'Autre' }
]);

    const [associationRequests, setAssociationRequests] = useState([]);

    const auth = getAuth();

    const [showAssignedDoctorModal, setShowAssignedDoctorModal] = useState(false);
    const [assignedDoctor, setAssignedDoctor] = useState(null);
    const [assignedAppointments, setAssignedAppointments] = useState([]);

    const [assignedDoctors, setAssignedDoctors] = useState([]);
    const [doctorAppointments, setDoctorAppointments] = useState({});

    const [showCalendarView, setShowCalendarView] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [calendarAppointments, setCalendarAppointments] = useState({});
    const [dailyDoctorSchedule, setDailyDoctorSchedule] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
      if (structure?.subscriptionPack) {
        setCurrentPack(SUBSCRIPTION_PACKS[structure.subscriptionPack.toUpperCase()]);
      }
    }, [structure]);

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
    consultationDuration: 5, // in minutes
    bookedSlots: {},
    insurances: []

    });


    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [patientPhotoFile, setPatientPhotoFile] = useState(null);
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

    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({
      doctors: [],
      patients: []
    });


    // Ajouter ces states au début du composant
const [sortOrder, setSortOrder] = useState('time'); // 'time', 'patient', 'status'
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [lastReorganization, setLastReorganization] = useState({});

const updateAppointmentOrder = async (appointmentId, newOrder) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      orderNumber: newOrder,
      lastReorganized: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rendez-vous:', error);
  }
};

// Ajouter cette fonction pour gérer la réorganisation des rendez-vous
const moveAppointment = async (appointmentId, direction) => {
  try {
    const currentAppointments = [...selectedDoctorDetails.appointments];
    const currentIndex = currentAppointments.findIndex(apt => apt.id === appointmentId);
    
    if (direction === 'up' && currentIndex > 0) {
      // Échange avec l'élément précédent
      const temp = currentAppointments[currentIndex];
      currentAppointments[currentIndex] = currentAppointments[currentIndex - 1];
      currentAppointments[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < currentAppointments.length - 1) {
      // Échange avec l'élément suivant
      const temp = currentAppointments[currentIndex];
      currentAppointments[currentIndex] = currentAppointments[currentIndex + 1];
      currentAppointments[currentIndex + 1] = temp;
    }

    // Mettre à jour les numéros d'ordre
    const updatedAppointments = currentAppointments.map((apt, index) => ({
      ...apt,
      orderNumber: index + 1
    }));

    // Mettre à jour Firestore et l'état local
    await Promise.all(
      updatedAppointments.map(apt => 
        updateAppointmentOrder(apt.id, apt.orderNumber)
      )
    );

    // Mettre à jour les deux états
    setSelectedDoctorDetails({
      ...selectedDoctorDetails,
      appointments: updatedAppointments
    });

    setAppointments(prev => {
      const updated = prev.map(apt => {
        const updatedApt = updatedAppointments.find(a => a.id === apt.id);
        return updatedApt || apt;
      });
      return updated;
    });

    // Mettre à jour la dernière réorganisation
    setLastReorganization(prev => ({
      ...prev,
      [appointmentId]: new Date().toLocaleTimeString()
    }));

  } catch (error) {
    console.error('Erreur lors du déplacement du rendez-vous:', error);
  }
};
    // Fonction de recherche
    const handleSearch = (query) => {
      setSearchQuery(query);
      
      if (!query.trim()) {
        setSearchResults({ doctors: [], patients: [] });
        return;
      }
  
      const searchTerms = query.toLowerCase().split(' ');
      
      // Recherche dans les médecins
      const filteredDoctors = doctors.filter(doctor => {
        const searchableFields = [
          doctor.nom,
          doctor.prenom,
          doctor.specialite,
          doctor.email,
          doctor.telephone,
          ...(doctor.disponibilite || [])
        ].map(field => field?.toLowerCase() || '');
  
        return searchTerms.every(term =>
          searchableFields.some(field => field.includes(term))
        );
      });
  
      // Recherche dans les patients
      const filteredPatients = patients.filter(patient => {
        const searchableFields = [
          patient.nom,
          patient.prenom,
          patient.email,
          patient.telephone,
          patient.age?.toString(),
          patient.sexe,
          patient.adresse
        ].map(field => field?.toLowerCase() || '');
  
        return searchTerms.every(term =>
          searchableFields.some(field => field.includes(term))
        );
      });
  
      setSearchResults({
        doctors: filteredDoctors,
        patients: filteredPatients
      });
    };

    const searchBar = (
      <div className="search-container mb-4 p-3 bg-white rounded-3 shadow-sm">
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Rechercher médecins ou patients... (nom, spécialité, email, téléphone, etc.)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </Form.Group>
        
        {searchQuery && (
          <div className="search-results mt-3">
            {(searchResults.doctors.length > 0 || searchResults.patients.length > 0) ? (
              <>
                {searchResults.doctors.length > 0 && (
                  <div className="doctors-results mb-3">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-user-md me-2"></i>
                      Médecins ({searchResults.doctors.length})
                    </h6>
                    <div className="list-group">
                      {searchResults.doctors.map(doctor => (
                        <div key={doctor.id} className="list-group-item list-group-item-action">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{doctor.nom} {doctor.prenom}</h6>
                              <p className="mb-1 text-muted small">
                                <span className="me-3">
                                  <i className="fas fa-stethoscope me-1"></i>
                                  {doctor.specialite}
                                </span>
                                <span>
                                  <i className="fas fa-phone me-1"></i>
                                  {doctor.telephone}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowDoctorDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.patients.length > 0 && (
                  <div className="patients-results">
                    <h6 className="text-success mb-2">
                      <i className="fas fa-users me-2"></i>
                      Patients ({searchResults.patients.length})
                    </h6>
                    <div className="list-group">
                      {searchResults.patients.map(patient => (
                        <div key={patient.id} className="list-group-item list-group-item-action">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{patient.nom} {patient.prenom}</h6>
                              <p className="mb-1 text-muted small">
                                <span className="me-3">
                                  <i className="fas fa-birthday-cake me-1"></i>
                                  {patient.age} ans
                                </span>
                                <span>
                                  <i className="fas fa-phone me-1"></i>
                                  {patient.telephone}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted text-center my-3">
                <i className="fas fa-search me-2"></i>
                Aucun résultat trouvé
              </p>
            )}
          </div>
        )}
        
        <style jsx>{`
          .search-input {
            border-radius: 20px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border: 1px solid #dee2e6;
            transition: all 0.2s;
          }
          
          .search-input:focus {
            box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
            border-color: #0d6efd;
          }
          
          .search-results {
            max-height: 500px;
            overflow-y: auto;
          }
          
          .list-group-item {
            transition: all 0.2s;
          }
          
          .list-group-item:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
          }
        `}</style>
      </div>
    );

    const handleMultipleAssignments = async () => {
      try {
        const assignments = [];
        
        for (const patientId of selectedPatientIds) {
          for (const day of selectedDays) {
            for (const timeSlot of selectedTimeSlots) {
              assignments.push({
                doctorId: selectedDoctor.id,
                patientId,
                timeSlot,
                day,
                status: 'scheduled',
                structureId: structure.id,
                createdAt: new Date().toISOString()
              });
            }
          }
        }

        await Promise.all(
          assignments.map(assignment => 
            addDoc(collection(db, 'appointments'), assignment)
          )
        );

        await Promise.all(
          selectedPatientIds.map(patientId =>
            updateDoc(doc(db, 'patients', patientId), {
              medecinId: selectedDoctor.id,
              structureId: structure.id,
              lastUpdated: new Date().toISOString()
            })
          )
        );

        setMessage('Assignations effectuées avec succès');
        setShowAssignPatientsModal(false);
        
        setSelectedPatientIds([]);
        setSelectedDays([]);
        setSelectedTimeSlots([]);
        
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors des assignations');
      }
    };


    useEffect(() => {
       const structureData = JSON.parse(localStorage.getItem('structureData'));
       if (!structureData) {
         navigate('/');
         return;
       }
 
       // Real-time structure listener
       const structureUnsubscribe = onSnapshot(
         doc(db, 'structures', structureData.id),
         (doc) => {
           setStructure({ id: doc.id, ...doc.data() });
         }
       );
 
       // Real-time doctors listener 
       const doctorsUnsubscribe = onSnapshot(
         query(
           collection(db, 'medecins'),
           where('structures', 'array-contains', structureData.id)
         ),
         (snapshot) => {
           const doctorsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setDoctors(doctorsData);
         }
       );
 
       // Real-time patients listener
       const patientsUnsubscribe = onSnapshot(
         query(
           collection(db, 'patients'), 
           where('structures', 'array-contains', structureData.id)
         ),
         (snapshot) => {
           const patientsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setPatients(patientsData);
         }
       );
 
       // Real-time appointments listener
       const appointmentsUnsubscribe = selectedDoctor && onSnapshot(
         query(
           collection(db, 'appointments'),
           where('doctorId', '==', selectedDoctor.id)
         ),
         (snapshot) => {
           const appointmentsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setAppointments(appointmentsData);
         }
       );
 
       // Real-time association requests listener
       const requestsUnsubscribe = onSnapshot(
         query(
           collection(db, 'associationRequests'),
           where('structureId', '==', structureData.id),
           where('status', '==', 'pending')
         ),
         (snapshot) => {
           setAssociationRequests(snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           })));
         }
       );
 
       // Charger tous les rendez-vous au démarrage
       fetchAllAppointments();
       
       // Cleanup all listeners
       return () => {
         structureUnsubscribe();
         doctorsUnsubscribe();
         patientsUnsubscribe();
         if (appointmentsUnsubscribe) appointmentsUnsubscribe();
         requestsUnsubscribe();
       };
 
     }, [navigate, selectedDoctor]);


    // Fonctions pour gérer les demandes
    const handleAssociationResponse = async (requestId, doctorId, accepted) => {
      try {
        if (accepted) {
          // Mise à jour du statut de la demande
          await updateDoc(doc(db, 'associationRequests', requestId), {
            status: 'accepted',
            acceptedDate: new Date().toISOString()
          });

          // Ajout de la structure dans le tableau des structures du médecin
          const doctorRef = doc(db, 'medecins', doctorId);
          await updateDoc(doctorRef, {
            structures: arrayUnion(structure.id),
            visibility: 'affiliated'  // Marquer le médecin comme affilié
          });

          // Récupérer les données du médecin
          const doctorDoc = await getDoc(doctorRef);
          const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

          // Ajouter le médecin au tableau local
          setDoctors(prevDoctors => [...prevDoctors, doctorData]);

          setMessage('Médecin associé avec succès');
        } else {
          await updateDoc(doc(db, 'associationRequests', requestId), {
            status: 'rejected',
            rejectionDate: new Date().toISOString()
          });

          setMessage('Demande refusée');
        }
      } catch (error) {
        console.error('Erreur association:', error);
        setMessage('Erreur lors du traitement de la demande');
      }
    };


    const sendConfirmationEmail = async (changes) => {
      try {
        const confirmationToken = Math.random().toString(36).substr(2);
        
        // Store pending changes with token
        await setDoc(doc(db, 'pendingChanges', structure.id), {
          changes,
          token: confirmationToken,
          timestamp: new Date().toISOString()
        });

        // Send confirmation email using Firebase Functions
        const sendMail = httpsCallable(functions, 'sendConfirmationEmail');
        await sendMail({
          email: structure.email,
          token: confirmationToken,
          changes: changes
        });

        setMessage('Email de confirmation envoyé');
        setPendingChanges(changes);
      } catch (error) {
        setMessage('Erreur lors de l\'envoi de l\'email');
      }
    };

    const handleSubmitChanges = async (e) => {
      e.preventDefault();
      const changes = {
        name: editedStructure.name,
        type: editedStructure.type,
        specialite: editedStructure.specialite,
        description: editedStructure.description,
        email: editedStructure.email,
        telephone: editedStructure.telephone,
        adresse: editedStructure.adresse,
        siteWeb: editedStructure.siteWeb,
        horaires: editedStructure.horaires
      };

      await sendConfirmationEmail(changes);
      setShowEditForm(false);
    };


    const fetchStructureData = async (structureId) => {
      try {
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        const structureData = { id: structureDoc.id, ...structureDoc.data() };
        setStructure(structureData);

        // Fetch affiliated doctors
        const doctorsPromises = (structureData.affiliatedDoctors || [])
          .map(id => getDoc(doc(db, 'medecins', id)));
        const doctorsData = await Promise.all(doctorsPromises);
        const affiliatedDoctors = doctorsData.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch private doctors
        const privateQuery = query(
          collection(db, 'medecins'),
          where('structures', 'array-contains', structureId),
          where('visibility', '==', 'private')
        );
        const privateDoctorsSnapshot = await getDocs(privateQuery);
        const privateDoctors = privateDoctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combine both types of doctors
        setDoctors([...affiliatedDoctors, ...privateDoctors]);

        // First fetch affiliated patients
        const patientsPromises = (structureData.affiliatedPatients || [])
          .map(id => getDoc(doc(db, 'patients', id)));
        const patientsData = await Promise.all(patientsPromises);
        const affiliatedPatients = patientsData.map(doc => ({ id: doc.id, ...doc.data() }));

        // Then fetch private patients
        const privatePatientQuery = query(
          collection(db, 'patients'),
          where('structures', 'array-contains', structureId),
          where('visibility', '==', 'private')
        );
        const privatePatientSnapshot = await getDocs(privatePatientQuery);
        const privatePatients = privatePatientSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combine both types of patients
        setPatients([...affiliatedPatients, ...privatePatients]);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Erreur lors du chargement des données');
      }
    };

    const fetchDoctorAppointments = async (doctorId) => {
      try {
        const appointmentsSnapshot = await getDocs(query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorId),
          orderBy('orderNumber', 'asc')
        ));
    
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderNumber: doc.data().orderNumber || 0
        }));
    
        setAppointments(appointmentsData);
        
        if (selectedDoctorDetails) {
          setSelectedDoctorDetails({
            ...selectedDoctorDetails,
            appointments: appointmentsData
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
      }
    };

    const handleAddDoctor = async () => {
      try {
        // Validate required fields
        if (!newDoctor.email || !newDoctor.password || !newDoctor.nom || !newDoctor.prenom) {
          setMessage('Veuillez remplir tous les champs obligatoires');
          return;
        }
        if (doctors.length >= currentPack?.maxDoctors) {
          setMessage(`Limite de médecins atteinte pour le pack ${currentPack.name}`);
          return;
        }
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newDoctor.email,
          newDoctor.password
        );

        // Add doctor role
        await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
          role: 'doctor',
          structureId: structure.id
        });

        let photoUrl = '';
        let certUrls = [];

        if (photoFile) {
          const photoRef = ref(storage, `doctors/${structure.id}/${photoFile.name}`);
          await uploadBytes(photoRef, photoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        for (const certFile of certFiles) {
          const certRef = ref(storage, `certifications/${structure.id}/${certFile.name}`);
          await uploadBytes(certRef, certFile);
          const certUrl = await getDownloadURL(certRef);
          certUrls.push(certUrl);
        }

        const doctorData = {
          ...newDoctor,
          uid: userCredential.user.uid,
          photo: photoUrl,
          certifications: certUrls,
          structures: [structure.id],
          createdBy: structure.id,
          createdAt: new Date().toISOString(),
          consultationDuration: 30,
          maxPatientsPerDay: 100,
          disponibilite: newDoctor.disponibilite,
          heureDebut: newDoctor.heureDebut,
          heureFin: newDoctor.heureFin,
          status: 'active',
          insurances: newDoctor.insurances || [],

        };

        const docRef = await addDoc(collection(db, 'medecins'), doctorData);
        const newDoctorWithId = { id: docRef.id, ...doctorData };
        
        setDoctors([...doctors, newDoctorWithId]);
        setShowAddDoctorModal(false);
        setMessage('Médecin ajouté avec succès');

        // Reset form
        setNewDoctor({
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
          consultationDuration: 5,
          bookedSlots: {}
        });
        setPhotoFile(null);
        setCertFiles([]);

      } catch (error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setMessage('Cet email est déjà utilisé');
            break;
          case 'auth/invalid-email':
            setMessage('Format d\'email invalide');
            break;
          case 'auth/weak-password':
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            break;
          default:
            setMessage('Erreur lors de la création: ' + error.message);
        }
        console.error('Error details:', error);
      }
    };

      
    const handleAddPatient = async () => {
      try {
        // Validate required fields
        if (!newPatient.email || !newPatient.password || !newPatient.nom || !newPatient.prenom) {
          setMessage('Veuillez remplir tous les champs obligatoires');
          return;
        }

        if (patients.length >= currentPack?.maxPatients) {
          setMessage(`Limite de patients atteinte pour le pack ${currentPack.name}`);
          return;
        }

        
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newPatient.email,
          newPatient.password
        );

        // Add patient role
        await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
          role: 'patient',
          structureId: structure.id
        });

        let photoUrl = '';
        if (patientPhotoFile) {
          const photoRef = ref(storage, `patients/${structure.id}/${patientPhotoFile.name}`);
          await uploadBytes(photoRef, patientPhotoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        const docUrls = await Promise.all(
          medicalDocs.map(async (file) => {
            const docRef = ref(storage, `patients/${structure.id}/${userCredential.user.uid}/documents/${file.name}`);
            await uploadBytes(docRef, file);
            return getDownloadURL(docRef);
          })
        );

        const patientData = {
          ...newPatient,
          uid: userCredential.user.uid,
          photo: photoUrl,
          documents: docUrls,
          structures: [structure.id],
          createdBy: structure.id,
          createdAt: new Date().toISOString(),
          status: 'active',
          antecedents: [],
          allergies: [],
          traitements: [],
          lastVisit: null,
          nextAppointment: null,
          insurances: newPatient.insurances || [],

        };

        const docRef = await addDoc(collection(db, 'patients'), patientData);
        const newPatientWithId = { id: docRef.id, ...patientData };
        
        setPatients([...patients, newPatientWithId]);
        setShowAddPatientModal(false);
        setMessage('Patient ajouté avec succès');
        
        // Reset form
        setNewPatient({
          nom: '',
          prenom: '',
          age: '',
          sexe: '',
          telephone: '',
          email: '',
          password: '',
          photo: null,
          documents: null,
          visibility: 'private',
          structures: []
        });

        setPatientPhotoFile(null);
        setMedicalDocs([]);
        setPreviewDocs([]);

      } catch (error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setMessage('Cet email est déjà utilisé');
            break;
          case 'auth/invalid-email':
            setMessage('Format d\'email invalide');
            break;
          case 'auth/weak-password':
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            break;
          default:
            setMessage('Erreur lors de la création: ' + error.message);
        }
        console.error('Error details:', error);
      }
    };



    const handleDeleteDoctor = async (doctorId) => {
    try {
    await deleteDoc(doc(db, 'medecins', doctorId));
    setDoctors(doctors.filter(d => d.id !== doctorId));
    setMessage('Médecin supprimé avec succès');
    } catch (error) {
    setMessage('Erreur lors de la suppression');
    }
    };

    const handleDeletePatient = async (patientId) => {
      try {
        await deleteDoc(doc(db, 'patients', patientId));
        setPatients(patients.filter(p => p.id !== patientId));
        setMessage('Patient supprimé avec succès');
      } catch (error) {
        setMessage('Erreur lors de la suppression');
      }
    };

    const handleUnaffiliation = async (type, id) => {
      try {
        if (type === 'doctor') {
          // Mise à jour du médecin
          const doctorRef = doc(db, 'medecins', id);
          await updateDoc(doctorRef, {
            structures: arrayRemove(structure.id)
          });

          // Mise à jour des patients
          const patientsQuery = query(
            collection(db, 'patients'),
            where('medecinId', '==', id),
            where('structureId', '==', structure.id)
          );
          
          const patientsSnapshot = await getDocs(patientsQuery);
          const batch = writeBatch(db);
          
          patientsSnapshot.docs.forEach(patientDoc => {
            batch.update(patientDoc.ref, {
              medecinId: null,
              structureId: null
            });
          });
          
          await batch.commit();

          // Mise à jour immédiate de l'interface
          setDoctors(doctors.filter(doc => doc.id !== id));
          setPatients(patients.filter(pat => pat.medecinId !== id));
          
          setMessage('Médecin désaffilié avec succès');
        } else {
          // Mise à jour du patient
          const patientRef = doc(db, 'patients', id);
          await updateDoc(patientRef, {
            structureId: null,
            medecinId: null,

          });

          setPatients(patients.filter(pat => pat.id !== id));
          setMessage('Patient retiré avec succès');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors de la modification');
      }
    };

    const generateTimeSlots = (startTime, endTime, duration) => {
      const slots = [];
      let currentTime = new Date(`2000/01/01 ${startTime}`);
      const endDateTime = new Date(`2000/01/01 ${endTime}`);
      
      while (currentTime < endDateTime) {
        slots.push(currentTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        currentTime.setMinutes(currentTime.getMinutes() + duration);
      }
      
      return slots;
    };

    const handleCompleteAppointment = async (appointmentId) => {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'completed'
      });
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? {...apt, status: 'completed'} : apt
      ));
    };

    const handleDeleteAppointment = async (appointmentId) => {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      setAppointments(appointments.filter(apt => apt.id !== appointmentId));
    };


    const refreshDoctorData = async (doctorId) => {
      try {
          const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
          if (doctorDoc.exists()) {
              const updatedDoctor = { id: doctorDoc.id, ...doctorDoc.data() };
              setDoctors(doctors.map(d => d.id === doctorId ? updatedDoctor : d));
          }
      } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
      }
    };


    const handleEditDoctor = async (doctor) => {
      try {
          const doctorRef = doc(db, 'medecins', doctor.id);
          
          // Créez un objet avec uniquement les champs à mettre à jour
          const updateData = {
              nom: doctor.nom,
              prenom: doctor.prenom,
              specialite: doctor.specialite,
              telephone: doctor.telephone,
              email: doctor.email,
              password: doctor.password,
              disponibilite: doctor.disponibilite || [],
              heureDebut: doctor.heureDebut,
              heureFin: doctor.heureFin,
              maxPatientsPerDay: doctor.maxPatientsPerDay || 1,
              consultationDuration: doctor.consultationDuration || 30,
              joursDisponibles: doctor.joursDisponibles || [],
              insurances: doctor.insurances || [],

          };

          // Mise à jour dans Firestore
          await updateDoc(doctorRef, updateData);

          // Mise à jour locale
          setDoctors(doctors.map(d => d.id === doctor.id ? {...d, ...updateData} : d));
          setShowEditDoctorModal(false);
          setMessage('Médecin modifié avec succès');
          
          // Rafraîchir les données
          await fetchStructureData(structure.id);
      } catch (error) {
          console.error('Erreur lors de la modification:', error);
          setMessage('Erreur lors de la modification du médecin');
      }
    };

    const handleEditPatient = async (patient) => {
      try {
        const patientRef = doc(db, 'patients', patient.id);
        
        // Gestion de la photo
        let photoUrl = patient.photo;
        if (patientPhotoFile) {
          const photoRef = ref(storage, `patients/${structure.id}/${patient.uid}/photo`);
          await uploadBytes(photoRef, patientPhotoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        // Gestion des documents médicaux
        const newDocUrls = await Promise.all(
          editMedicalDocs.map(async (file) => {
            const docRef = ref(storage, `patients/${structure.id}/${patient.uid}/documents/${file.name}`);
            await uploadBytes(docRef, file);
            return getDownloadURL(docRef);
          })
        );

        const updatedDocs = [...(patient.documents || []), ...newDocUrls];

        await updateDoc(patientRef, {
          nom: patient.nom,
          prenom: patient.prenom,
          age: patient.age,
          sexe: patient.sexe,
          telephone: patient.telephone,
          email: patient.email,
          photo: photoUrl,
          documents: updatedDocs,
          insurances: patient.insurances || [], // Assurez-vous que c'est un tableau
        });

        setPatients(patients.map(p => p.id === patient.id ? {...p, photo: photoUrl, documents: updatedDocs} : p));
        setShowEditPatientModal(false);
        setMessage('Patient modifié avec succès');
        
        // Réinitialisation des états
        setEditMedicalDocs([]);
        setEditPreviewDocs([]);
        setPatientPhotoFile(null);
        
      } catch (error) {
        setMessage('Erreur lors de la modification du patient');
      }
    };

    const handleShowAssignedDoctor = async (patient) => {
      try {
        // Récupérer tous les rendez-vous du patient
        const appointmentsSnapshot = await getDocs(
          query(
            collection(db, 'appointments'),
            where('patientId', '==', patient.id)
          )
        );
        
        // Extraire les IDs uniques des médecins
        const doctorIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().doctorId))];
        
        // Récupérer les informations de tous les médecins
        const doctorsData = await Promise.all(
          doctorIds.map(async (doctorId) => {
            const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
            if (doctorDoc.exists()) {
              return { id: doctorDoc.id, ...doctorDoc.data() };
            }
            return null;
          })
        );

        // Filtrer les médecins null et les organiser avec leurs rendez-vous
        const validDoctors = doctorsData.filter(d => d !== null);
        const appointments = {};
        
        appointmentsSnapshot.docs.forEach(doc => {
          const apt = { id: doc.id, ...doc.data() };
          if (!appointments[apt.doctorId]) {
            appointments[apt.doctorId] = [];
          }
          appointments[apt.doctorId].push(apt);
        });

        setAssignedDoctors(validDoctors);
        setDoctorAppointments(appointments);
        setShowAssignedDoctorModal(true);
        
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors de la récupération des informations');
      }
    };

    const sendModificationLink = async () => {
      try {
        // Créer un lien de modification sécurisé
        const actionCodeSettings = {
          url: `${window.location.origin}/edit-structure?id=${structure.id}`,
          handleCodeInApp: true
        };

        // Envoyer l'email avec Firebase Auth
        await sendSignInLinkToEmail(auth, structure.email, actionCodeSettings);

        // Sauvegarder l'email pour la vérification
        localStorage.setItem('emailForModification', structure.email);

        setMessage('Un lien de modification a été envoyé à votre email');
        setShowSettingsModal(false);
      } catch (error) {
        setMessage('Erreur lors de l\'envoi du lien: ' + error.message);
      }
    };

    const handleLogout = async () => {
      try {
        // 1. Sign out from Firebase
        await signOut(auth);
        
        // 2. Clear all localStorage data
        localStorage.clear();
        
        // 3. Navigate to home page
        navigate('/');
        
      } catch (error) {
        console.error('Erreur de déconnexion:', error);
      }
    };

    const weekdayOrder = {
      'Lundi': 1,
      'Mardi': 2,
      'Mercredi': 3,
      'Jeudi': 4,
      'Vendredi': 5,
      'Samedi': 6,
      'Dimanche': 7
    };

    const fadeAnimation = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    const cardVariants = {
      hover: { scale: 1.02, transition: { duration: 0.3 } }
    };

    const DoctorCard = ({ doctor, onDetails, onEdit, onDelete, onAssign }) => (
      <div className="card card-hover fade-in">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="doctor-avatar me-3">
              {doctor.photo ? (
                <img 
                  src={doctor.photo} 
                  alt={doctor.nom}
                  className="rounded-circle"
                  style={{width: "50px", height: "50px", objectFit: "cover"}}
                />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fas fa-user-md fa-2x"></i>
                </div>
              )}
            </div>
            <div>
              <h5 className="mb-0">Dr. {doctor.nom} {doctor.prenom}</h5>
              <span className="text-muted">{doctor.specialite}</span>
            </div>
          </div>
          
          <div className="d-flex flex-wrap gap-2 mb-3">
            {doctor.disponibilite?.map(day => (
              <span key={day} className="badge bg-light text-primary">
                {day}
              </span>
            ))}
          </div>
    
          <div className="action-buttons d-flex gap-2">
            <Button 
              variant="outline-primary" 
              className="btn-float btn-icon-pulse"
              onClick={() => onDetails(doctor)}
            >
              <i className="fas fa-eye me-2"></i>
              Détails
            </Button>
            {/* ... autres boutons ... */}
          </div>
        </div>
      </div>
    );
    
    const PatientCard = ({ patient, onDetails, onEdit, onDelete }) => (
      <div className="card card-hover fade-in">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="patient-avatar me-3">
              {patient.photo ? (
                <img 
                  src={patient.photo} 
                  alt={patient.nom}
                  className="rounded-circle"
                  style={{width: "50px", height: "50px", objectFit: "cover"}}
                />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fas fa-user fa-2x"></i>
                </div>
              )}
            </div>
            <div>
              <h5 className="mb-0">{patient.nom} {patient.prenom}</h5>
              <span className="text-muted">{patient.age} ans</span>
            </div>
          </div>
          
          <div className="patient-info mb-3">
            <p className="mb-1">
              <i className="fas fa-phone-alt me-2 text-primary"></i>
              {patient.telephone}
            </p>
            <p className="mb-0">
              <i className="fas fa-envelope me-2 text-primary"></i>
              {patient.email}
            </p>
          </div>
    
          <div className="action-buttons d-flex gap-2">
            <Button 
              variant="outline-primary" 
              className="btn-float btn-icon-pulse"
              onClick={() => onDetails(patient)}
            >
              <i className="fas fa-eye me-2"></i>
              Détails
            </Button>
            {/* ... autres boutons ... */}
          </div>
        </div>
      </div>
    );
    
    const SearchBar = ({ value, onChange }) => (
      <div className="search-container">
        <div className="position-relative">
          <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Rechercher..."
            value={value}
            onChange={onChange}
          />
        </div>
        {value && (
          <Button
            variant="link"
            className="position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={() => onChange({ target: { value: '' } })}
          >
            <i className="fas fa-times"></i>
          </Button>
        )}
      </div>
    );
    

    const fetchAllAppointments = async () => {
      try {
        const structureId = JSON.parse(localStorage.getItem('structureData'))?.id;
        if (!structureId) return;
    
        // Récupérer tous les rendez-vous de la structure
        const appointmentsSnapshot = await getDocs(query(
          collection(db, 'appointments'),
          where('structureId', '==', structureId)
        ));
    
        // Organiser les rendez-vous par jour
        const appointmentsByDay = {
          'Lundi': [],
          'Mardi': [],
          'Mercredi': [],
          'Jeudi': [],
          'Vendredi': [],
          'Samedi': [],
          'Dimanche': []
        };
    
        appointmentsSnapshot.docs.forEach(doc => {
          const appt = { id: doc.id, ...doc.data() };
          if (appt.day) {
            appointmentsByDay[appt.day].push(appt);
          }
        });
    
        // Récupérer les détails des médecins pour chaque jour
        const dailySchedule = await Promise.all(
          Object.entries(appointmentsByDay).map(async ([day, dayAppointments]) => {
            const doctorIds = [...new Set(dayAppointments.map(apt => apt.doctorId))];
            
            const doctorsWithAppointments = await Promise.all(
              doctorIds.map(async (doctorId) => {
                const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
                const doctorData = doctorDoc.data();
                
                return {
                  id: doctorId,
                  nom: doctorData.nom,
                  prenom: doctorData.prenom,
                  specialite: doctorData.specialite,
                  heureDebut: doctorData.heureDebut,
                  heureFin: doctorData.heureFin,
                  appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
                };
              })
            );
    
            return {
              day,
              doctors: doctorsWithAppointments.filter(d => d.appointments.length > 0)
            };
          })
        );
    
        setDailyDoctorSchedule(dailySchedule);
    
        // Sélectionner automatiquement le lundi et son premier médecin
        const mondaySchedule = dailySchedule.find(schedule => schedule.day === 'Lundi');
        if (mondaySchedule && mondaySchedule.doctors.length > 0) {
          setSelectedDoctorDetails(mondaySchedule.doctors[0]);
        }
    
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        setMessage('Erreur lors de la récupération des rendez-vous');
      }
    };

    useEffect(() => {
      const structureData = JSON.parse(localStorage.getItem('structureData'));
      if (!structureData) {
        navigate('/');
        return;
      }
  
      // Initialiser les listeners
      const unsubscribes = [
        // ... existing listeners ...
      ];
  
      // Charger les rendez-vous immédiatement
      fetchAllAppointments();
      
      // Activer automatiquement la vue calendrier
      setShowCalendarView(true);
      setSelectedDay('Lundi');
  
      return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
      };
    }, [navigate]);

    const calendarButton = (
      <Button
        variant={showCalendarView ? 'primary' : 'light'}
        onClick={() => {setShowCalendarView(!showCalendarView);
          setShowMenuSidebar(false);

        }
        }
        className="ms-2"
      >
        <i className="fas fa-calendar-alt me-2"></i>
        Calendrier
      </Button>
    );

  

    const calendarView = showCalendarView && (
      <Card className="calendar-view-card mb-4 shadow-lg">
        <Card.Header className="bg-gradient bg-primary text-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-calendar-alt me-2"></i>
              Planning des rendez-vous
            </h5>
            <p className="mt-1 d-block text-white">
      {new Date().toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace('à', 'à')}
    </p>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Colonne des jours - devient pleine largeur sur mobile */}
            <Col xs={12} md={3} className="border-end-md">
              <div className="weekdays-list p-3">
                <h6 className="text-primary mb-3 d-flex align-items-center">
                  <i className="fas fa-calendar-week me-2"></i>
                  Jours de la semaine
                </h6>
                <div className="d-md-block d-flex flex-row flex-nowrap overflow-auto">
                  {dailyDoctorSchedule.map(({ day, doctors }) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? 'primary' : 'light'}
                      className="d-flex align-items-center justify-content-between w-100 mb-2 mx-1 py-2 px-3 rounded-pill shadow-sm"
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className="d-flex align-items-center">
                        <i className={`fas fa-${selectedDay === day ? 'calendar-check' : 'calendar-day'} me-2`}></i>
                        <span className="d-none d-md-inline">{day}</span>
                        <span className="d-md-none">{day.substring(0, 3)}</span>
                      </div>
                      <Badge bg={selectedDay === day ? 'light' : 'primary'}
                        text={selectedDay === day ? 'primary' : 'white'}
                        className="rounded-pill ms-2">
                        {doctors.reduce((total, doctor) => total + doctor.appointments.length, 0)}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
    
            <Col xs={12} md={9}>
          <div className="daily-schedule p-3 p-md-4">
            {selectedDay ? (
              <>
                <div className="selected-day-header mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-3 d-flex align-items-center flex-wrap">
                    <i className="fas fa-clock me-2"></i>
                    Planning du {selectedDay}
                    <Badge bg="info" className="ms-2 rounded-pill">
                      {dailyDoctorSchedule
                        .find(schedule => schedule.day === selectedDay)?.doctors
                        .reduce((total, doctor) => total + doctor.appointments.length, 0)} rendez-vous
                    </Badge>
                  </h5>
                </div>

                {dailyDoctorSchedule
                  .find(schedule => schedule.day === selectedDay)?.doctors.length > 0 ? (
                  dailyDoctorSchedule
                    .find(schedule => schedule.day === selectedDay)
                    .doctors.map(doctor => (
                      <div 
                        key={doctor.id} 
                        className="doctor-schedule-card mb-3 cursor-pointer" 
                        onClick={() => handleDoctorClick(doctor)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div className="doctor-header bg-light p-3 rounded">
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center">
                              <div className="doctor-avatar me-3">
                                <i className="fas fa-user-md fa-2x text-primary"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
                                <span className="text-muted small">
                                  <i className="fas fa-stethoscope me-2"></i>
                                  {doctor.specialite}
                                </span>
                              </div>
                            </div>
                            <Badge bg="primary" className="rounded-pill px-3">
                              <i className="far fa-clock me-2"></i>
                              {doctor.heureDebut} - {doctor.heureFin}
                            </Badge>
                          </div>
                          <div className="mt-2 text-end">
                            <Badge bg="info" className="rounded-pill">
                              <i className="fas fa-calendar-check me-2"></i>
                              {doctor.appointments.length} rendez-vous
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">Aucun médecin disponible ce jour</h6>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-calendar fa-3x text-primary mb-3"></i>
                <h6 className="text-primary">Sélectionnez un jour</h6>
              </div>
            )}
          </div>
        </Col>
            </Row>
        </Card.Body>
    
        <style jsx>{`
          .calendar-view-card {
            border: none;
            border-radius: 1rem;
            overflow: hidden;
          }
    
          .border-end-md {
            @media (min-width: 768px) {
              border-right: 1px solid #dee2e6;
            }
          }
    
          .weekdays-list {
            @media (max-width: 767px) {
              border-bottom: 1px solid #dee2e6;
            }
          }
    
          .timeline {
            @media (max-width: 767px) {
              padding-left: 40px;
            }
          }
    
          .appointment-card {
            @media (max-width: 767px) {
              margin-left: 5px;
            }
          }
    
          /* Ajout des styles pour le scroll horizontal sur mobile */
          .overflow-auto {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            &::-webkit-scrollbar {
              display: none;
            }
          }
    
          /* Optimisations pour les petits écrans */
          @media (max-width: 767px) {
            .doctor-schedule-card {
              margin-bottom: 1rem;
            }
    
            .time-marker {
              left: -45px;
            }
    
            .appointment-card {
              padding: 0.75rem !important;
            }
          }
        `}</style>
      </Card>
    );

    const SUBSCRIPTION_PACKS = {
      FREE: {
        id: 'free',
        name: 'Pack Free',
        maxDoctors: 5,
        maxPatients: 5,
        price: 0,
        color: 'secondary'
      },
      BASIC: {
        id: 'basic',
        name: 'Pack Basic',
        maxDoctors: 5,
        maxPatients: 15,
        price: 29.99,
        color: 'info'
      },
      NORMAL: {
        id: 'normal',
        name: 'Pack Normal',
        maxDoctors: 5,
        maxPatients: 50,
        price: 49.99,
        color: 'primary'
      },
      ENTREPRISE: {
        id: 'entreprise',
        name: 'Pack Entreprise',
        maxDoctors: 5,
        maxPatients: 90,
        price: 99.99,
        color: 'success'
      },
      TERANGA: {
        id: 'teranga',
        name: 'Pack Teranga',
        maxDoctors: 5,
        maxPatients: 500,
        price: 199.99,
        color: 'warning'
      }
    };
    
    const handlePackChange = async (packId) => {
      try {
        // Mise à jour du pack dans Firestore
        await updateDoc(doc(db, 'structures', structure.id), {
          subscriptionPack: packId,
          subscriptionDate: new Date().toISOString()
        });
    
        // Mise à jour locale
        setStructure({
          ...structure,
          subscriptionPack: packId,
          subscriptionDate: new Date().toISOString()
        });
        
        setCurrentPack(SUBSCRIPTION_PACKS[packId.toUpperCase()]);
        setChangingPack(false);
        setMessage('Pack mis à jour avec succès');
      } catch (error) {
        console.error('Erreur lors du changement de pack:', error);
        setMessage('Erreur lors du changement de pack');
      }
    };




    return (
      <Container fluid className="py-4">
        <div className="dashboard-header py-4 px-3 bg-white shadow-sm rounded-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
  {/* Mobile Menu Button */}
  <div className="d-lg-none">
    <Button
      variant="light"
      className="menu-btn shadow-sm"
      onClick={() => {
        setShowMenuSidebar(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-bars"></i>
    </Button>
  </div>

  {/* Desktop Navigation */}
  <div className="d-none d-lg-flex align-items-center">
    <ButtonGroup className="me-4 shadow-sm">
      <Button
        variant={viewMode === 'both' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('both');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-th-large me-2"></i>
        Tous
      </Button>
      <Button
        variant={viewMode === 'doctors' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('doctors');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-user-md me-2"></i>
        Médecins
      </Button>
      <Button
        variant={viewMode === 'patients' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('patients');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-users me-2"></i>
        Patients
      </Button>
    </ButtonGroup>

    <Button 
  variant="outline-primary" 
  onClick={() => setShowPackModal(true)}
  className="ms-2"
>
  <i className="fas fa-cube me-2"></i>
  Mon Pack
</Button>
      {calendarButton}
      <Button
  variant="outline-primary"
  className="ms-2"
  onClick={() => {
    setShowQRModal(true);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-qrcode me-2"></i>
  Code QR d'inscription
</Button>
  </div>

  {/* Mobile Profile Button */}
  <div className="d-lg-none">
    <Button
      variant="light"
      className="profile-btn shadow-sm"
      onClick={() => {
        setShowProfileSidebar(true);
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-user"></i>
    </Button>
  </div>

  {/* Desktop Profile Buttons */}
  <div className="d-none d-lg-flex gap-2">
    <Button
      variant="light"
      className="btn-icon-hover shadow-sm"
      onClick={() => {
        setShowSettingsModal(true);
        setShowMenuSidebar(false);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-hospital me-2"></i>
      Profil
    </Button>
    
    <Button 
      variant="danger" 
      className="w-100 w-md-auto shadow-sm"
      onClick={() => {
        handleLogout();
        setShowMenuSidebar(false);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-sign-out-alt me-md-2"></i>
      <span className="d-none d-md-inline"></span>
      {/*<span className="d-none d-md-inline">Déconnexion</span>
 */}
    </Button>
    
  </div>
</div>

  {/* Menu Sidebar */}
  <Offcanvas show={showMenuSidebar} onHide={() => setShowMenuSidebar(false)} placement="start">
    <Offcanvas.Header closeButton>
      <Offcanvas.Title>Menu Navigation</Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body>
      <div className="d-flex flex-column gap-2">
        <Button
          variant={viewMode === 'both' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('both');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-th-large me-2"></i>
          Tous
        </Button>
        <Button
          variant={viewMode === 'doctors' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('doctors');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-user-md me-2"></i>
          Médecins
        </Button>
        <Button
          variant={viewMode === 'patients' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('patients');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-users me-2"></i>
          Patients
        </Button>
        <Button 
  variant="outline-primary" 
  onClick={() => setShowPackModal(true)}
  className="ms-2"
>
  <i className="fas fa-cube me-2"></i>
  Mon Pack
</Button>
        <Button
  variant="outline-primary"
  className="w-100 text-start"
  onClick={() => {
    setShowQRModal(true);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-qrcode me-2"></i>
  Code QR d'inscription
</Button>
        <hr />
        <div className="d-flex gap-2 mb-2">
          
          {calendarButton}
        </div>
      </div>
    </Offcanvas.Body>
  </Offcanvas>

  {/* Profile Sidebar */}
  <Offcanvas show={showProfileSidebar} onHide={() => setShowProfileSidebar(false)} placement="end">
    <Offcanvas.Header closeButton>
      <Offcanvas.Title>Menu Profil</Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body>
      <div className="d-flex flex-column gap-2">
        <Button
          variant="light"
          className="w-100 text-start"
          onClick={() => {
            setShowProfileModal(true);
            setShowProfileSidebar(false);
            setShowCalendarView(false);
          }}
        >
          <i className="fas fa-hospital me-2"></i>
          Profil Structure
        </Button>
        <Button
          variant="light"
          className="w-100 text-start"
          onClick={() => {
            setShowSettingsModal(true);
            setShowProfileSidebar(false);
            setShowCalendarView(false);
          }}
        >
          <i className="fas fa-cog me-2"></i>
          Paramètres
        </Button>
        <Button 
  variant="danger" 
  className="w-100 w-md-auto shadow-sm"
  onClick={() => {
    handleLogout();
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-sign-out-alt me-md-2"></i>
  <span className="d-none d-md-inline">Déconnexion</span>
</Button>
      </div>
    </Offcanvas.Body>
  </Offcanvas>
</div>


        {/* Rest of the JSX */}
        {searchBar}
        {calendarView}
        
        {message && (
          <Alert variant="info" className="mb-4">
            {message}
          </Alert>
        )}

        {/* Ajouter dans le JSX, avant la liste des médecins */}
        {associationRequests.length > 0 && (
          <Card className="mb-4">
            <Card.Header className="bg-warning">
              <h5>Demandes d'association ({associationRequests.length})</h5>
            </Card.Header>
            <Card.Body>
              {associationRequests.map(request => (
                <div key={request.id} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6>Dr. {request.doctorInfo.nom} {request.doctorInfo.prenom}</h6>
                    <p className="text-muted mb-0">{request.doctorInfo.specialite}</p>
                  </div>
                  <div>
                    <Button
                      variant="success"
                      className="me-2"
                      onClick={() => handleAssociationResponse(request.id, request.doctorId, true)}
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleAssociationResponse(request.id, request.doctorId, false)}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
        <Row>
          {(viewMode === 'both' || viewMode === 'doctors') && (
            <Col md={viewMode === 'both' ? 6 : 12}>
              <Card className="doctor-card mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="fas fa-user-md me-2"></i>
                      Médecins
                    </h5>
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => setShowAddDoctorModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Ajouter un médecin privé
                    </Button>
                  </div>
                </Card.Header>
                <style jsx>{`
                .pack-selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
}

.pack-card {
  transition: transform 0.2s;
}

.pack-card:hover {
  transform: translateY(-5px);
}
                  .card-body-scroll {
                      padding: 0;
                      height: calc(100vh - 200px);
                      overflow: hidden;
                  }

                  .doctor-list-container {
                      height: 100%;
                      overflow-y: auto;
                      padding: 1rem;
                  }

                  .doctor-grid {
                      display: grid;
                      gap: 1rem;
                      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  }

                  .doctor-item {
                      background: white;
                      border-radius: 8px;
                      border: 1px solid rgba(0,0,0,0.1);
                      transition: transform 0.2s;
                  }

                  .doctor-content {
                      padding: 1rem;
                  }

                  .doctor-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      margin-bottom: 1rem;
                  }

                  .doctor-name {
                      font-weight: 600;
                      margin-bottom: 0.25rem;
                  }

                  .doctor-specialty {
                      color: #6c757d;
                      margin: 0;
                      font-size: 0.9rem;
                  }

                  .status-badge {
                      padding: 0.25rem 0.75rem;
                      border-radius: 20px;
                      font-size: 0.8rem;
                      display: inline-flex;
                      align-items: center;
                      gap: 0.5rem;
                  }

                  .badge-private {
                      background: #17a2b8;
                      color: white;
                  }

                  .badge-affiliated {
                      background: #28a745;
                      color: white;
                  }

                  .actions-wrapper {
                      overflow-x: auto;
                      margin: 0 -0.5rem;
                  }

                  .actions-row {
                      display: flex;
                      gap: 0.5rem;
                      padding: 0.5rem;
                      min-width: min-content;
                  }

                  .action-button {
                      white-space: nowrap;
                      display: inline-flex;
                      align-items: center;
                      gap: 0.5rem;
                  }

                  @media (max-width: 768px) {
                      .card-body-scroll {
                          height: calc(100vh - 150px);
                      }

                      .doctor-grid {
                          grid-template-columns: 1fr;
                      }

                      .actions-row {
                          padding: 0.25rem;
                          gap: 0.25rem;
                      }

                      .action-button {
                          padding: 0.25rem 0.5rem;
                          font-size: 0.8rem;
                      }
                  }
                `}</style>

                <Card.Body className="card-body-scroll">
                  <div className="doctor-cards-container">
                    <div className="doctor-cards-scroll px-3 py-2">
                      {doctors.map(doctor => (
                        <div key={doctor.id} className="doctor-card-item">
                          <div className="doctor-info p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold mb-0">{doctor.nom} {doctor.prenom}</h6>
                              <span className={`badge ${doctor.visibility === 'private' ? 'bg-info' : 'bg-success'}`}>
                                {doctor.visibility === 'private' ? 'Privé' : 'Affilié'}
                              </span>
                            </div>
                            <p className="text-muted mb-3">
                              <i className="fas fa-stethoscope me-2"></i>
                              {doctor.specialite}
                            </p>
                            
                            <div className="insurances-section mb-3">
  <p className="text-muted mb-2">
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées:
  </p>
  <div className="insurance-tags">
    {doctor.insurances ? (
      doctor.insurances.map((insurance, index) => (
        <span key={index} className="insurance-tag">
          {insurance}{index < doctor.insurances.length - 1 ? ', ' : ''}
        </span>
      ))
    ) : (
      <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
    )}
  </div>
</div>
                            <div className="actions-scroll-container">
                              <div className="actions-scroll">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowDoctorDetails(true);
                                  }}
                                >
                                  <i className="fas fa-eye me-1"></i> Détails
                                </Button>

                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowEditDoctorModal(true);
                                  }}
                                >
                                  <i className="fas fa-edit me-1"></i> Modifier
                                </Button>

                                {doctor.visibility === 'private' ? (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-btn"
                                    onClick={() => handleDeleteDoctor(doctor.id)}
                                  >
                                    <i className="fas fa-trash me-1"></i> Supprimer
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="action-btn"
                                    onClick={() => handleUnaffiliation('doctor', doctor.id)}
                                  >
                                    <i className="fas fa-unlink me-1"></i> Désaffilier
                                  </Button>
                                )}

                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowAssignPatientsModal(true);
                                  }}
                                >
                                  <i className="fas fa-user-plus me-1"></i> Assigner
                                </Button>

                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    fetchDoctorAppointments(doctor.id);
                                    setShowAppointmentsModal(true);
                                  }}
                                >
                                  <i className="fas fa-calendar me-1"></i> Rendez-vous
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}

          {(viewMode === 'both' || viewMode === 'patients') && (
            <Col md={viewMode === 'both' ? 6 : 12}>
              <Card className="patient-card shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="fas fa-users me-2"></i>
                      Patients
                    </h5>
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => setShowAddPatientModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Ajouter un patient privé
                    </Button>
                  </div>
                </Card.Header>

                <Card.Body className="card-body-scroll">
                  <div className="patient-list-container">
                    <div className="patient-grid">
                      {patients.map(patient => (
                        <div key={patient.id} className="patient-item">
                          <div className="patient-content">
                            <div className="patient-header">
                              <div className="patient-info">
                                <h6 className="patient-name">{patient.nom} {patient.prenom}</h6>
                                <p className="patient-age">
                                  <i className="fas fa-birthday-cake me-2"></i>
                                  {patient.age} ans
                                </p>
                              </div>
                              <span className={`status-badge ${patient.visibility === 'private' ? 'badge-private' : 'badge-affiliated'}`}>
                                <i className={`fas ${patient.visibility === 'private' ? 'fa-lock' : 'fa-link'}`}></i>
                                {patient.visibility === 'private' ? 'Privé' : 'Affilié'}
                              </span>
                            </div>

                            <div className="actions-wrapper">
                              <div className="actions-row">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowPatientDetails(true);
                                  }}
                                >
                                  <i className="fas fa-eye"></i> Détails
                                </Button>

                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowEditPatientModal(true);
                                  }}
                                >
                                  <i className="fas fa-edit"></i> Modifier
                                </Button>

                                {patient.visibility === 'private' ? (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-button"
                                    onClick={() => handleDeletePatient(patient.id)}
                                  >
                                    <i className="fas fa-trash"></i> Supprimer
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="action-button"
                                    onClick={() => handleUnaffiliation('patient', patient.id)}
                                  >
                                    <i className="fas fa-unlink"></i> Désaffilier
                                  </Button>
                                )}
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => handleShowAssignedDoctor(patient)}
                                  disabled={!patient.medecinId}
                                >
                                  <i className="fas fa-user-md"></i> Médecin assigné
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <style jsx>
                    {`

                    .insurance-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .insurance-tag {
    background-color: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }

  .insurance-tag:hover {
    background-color: #dee2e6;
    transform: translateY(-1px);
  }

                      .card-body-scroll {
                        padding: 0;
                        height: calc(100vh - 200px);
                        overflow: hidden;
                      }

                      .patient-list-container {
                        height: 100%;
                        overflow-y: auto;
                        padding: 1rem;
                      }

                      .patient-grid {
                        display: grid;
                        gap: 1rem;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                      }

                      .patient-item {
                        background: white;
                        border-radius: 8px;
                        border: 1px solid rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                      }

                      .patient-content {
                        padding: 1rem;
                      }

                      .patient-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1rem;
                      }

                      .patient-name {
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                      }

                      .patient-age {
                        color: #6c757d;
                        margin: 0;
                        font-size: 0.9rem;
                      }

                      .status-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                      }

                      .badge-private {
                        background: #17a2b8;
                        color: white;
                      }

                      .badge-affiliated {
                        background: #28a745;
                        color: white;
                      }

                      .actions-wrapper {
                        overflow-x: auto;
                        margin: 0 -0.5rem;
                      }

                      .actions-row {
                        display: flex;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        min-width: min-content;
                      }

                      .action-button {
                        white-space: nowrap;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                      }

                      @media (max-width: 768px) {
                        .card-body-scroll {
                          height: calc(100vh - 150px);
                        }

                        .patient-grid {
                          grid-template-columns: 1fr;
                        }

                        .actions-row {
                          padding: 0.25rem;
                          gap: 0.25rem;
                        }

                        .action-button {
                          padding: 0.25rem 0.5rem;
                          font-size: 0.8rem;
                        }
                      }
                    `}
                  </style>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Add Doctor Modal */}
        <Modal show={showAddDoctorModal} onHide={() => setShowAddDoctorModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Ajouter un médecin privé</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
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
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées
  </Form.Label>
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
    onCreateOption={(inputValue) => {
      // Créer une nouvelle option pour l'assurance personnalisée
      const newOption = { value: inputValue, label: inputValue };
      // Mettre à jour les options d'assurance
      setInsuranceOptions([...insuranceOptions, newOption]);
      // Mettre à jour les assurances sélectionnées
      setNewDoctor({
        ...newDoctor,
        insurances: [...(newDoctor.insurances || []), inputValue]
      });
    }}
    isCreatable={true}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
  <Form.Text className="text-muted">
    Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
  </Form.Text>
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
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddDoctorModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddDoctor}>
              Ajouter
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Doctor Modal */}
        <Modal show={showEditDoctorModal} onHide={() => setShowEditDoctorModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Modifier le médecin</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDoctor?.nom || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, nom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDoctor?.prenom || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, prenom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Spécialité</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.specialite || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, specialite: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={selectedDoctor?.email || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe:</Form.Label>
                    <Form.Control
                      type="password"
                      value={selectedDoctor?.password || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, password: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                
              </Row>
              <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={selectedDoctor?.telephone || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, telephone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
<Col md={6}>
  <Form.Group className="mb-3">
    <Form.Label>
      <i className="fas fa-file-medical me-2"></i>
      Assurances acceptées
    </Form.Label>
    <Select
      isMulti
      isCreatable
      name="insurances"
      options={insuranceOptions}
      className="basic-multi-select"
      classNamePrefix="select"
      value={insuranceOptions.filter(option => 
        selectedDoctor?.insurances?.includes(option.value)
      )}
      onChange={(selectedOptions) => {
        setSelectedDoctor({
          ...selectedDoctor,
          insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
        });
      }}
      onCreateOption={(inputValue) => {
        const newOption = { value: inputValue, label: inputValue };
        setInsuranceOptions([...insuranceOptions, newOption]);
        setSelectedDoctor({
          ...selectedDoctor,
          insurances: [...(selectedDoctor?.insurances || []), inputValue]
        });
      }}
      formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
      placeholder="Sélectionnez ou saisissez les assurances..."
      noOptionsMessage={() => "Aucune option disponible"}
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#dee2e6',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#0d6efd'
          }
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: '#e9ecef',
          borderRadius: '0.25rem'
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: '#495057'
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: '#495057',
          ':hover': {
            backgroundColor: '#dc3545',
            color: 'white'
          }
        })
      }}
    />
    <Form.Text className="text-muted">
      Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
    </Form.Text>
  </Form.Group>
</Col>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure début</Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedDoctor?.heureDebut || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, heureDebut: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedDoctor?.heureFin || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, heureFin: e.target.value})}
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
                      value={selectedDoctor?.maxPatientsPerDay || 0}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
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
                      value={selectedDoctor?.consultationDuration || 30}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        consultationDuration: parseInt(e.target.value)
                      })}
                      min="15"
                      step="15"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Jours disponibles</Form.Label>
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                  <Form.Check
                    key={day}
                    type="checkbox"
                    label={day}
                    checked={selectedDoctor?.disponibilite?.includes(day) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDoctor({
                          ...selectedDoctor,
                          disponibilite: [...(selectedDoctor?.disponibilite || []), day]
                        });
                      } else {
                        setSelectedDoctor({
                          ...selectedDoctor,
                          disponibilite: selectedDoctor?.disponibilite?.filter(d => d !== day) || []
                        });
                      }
                    }}
                  />
                ))}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditDoctorModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => handleEditDoctor(selectedDoctor)}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Doctor Details Modal */}
        <Modal show={showDoctorDetails} onHide={() => setShowDoctorDetails(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Détails du Médecin</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDoctor && (
              <div>
                <Row>
                  <Col md={6}>
                    {selectedDoctor.photo && (
                      <img
                        src={selectedDoctor.photo}
                        alt={`${selectedDoctor.nom}`}
                        className="img-fluid rounded mb-3"
                      />
                    )}
                  </Col>
                  <Col md={6}>
                    <h4>{selectedDoctor.nom} {selectedDoctor.prenom}</h4>
                    <p><strong>Spécialité:</strong> {selectedDoctor.specialite}</p>
                    <p><strong>Email:</strong> {selectedDoctor.email}</p>
                    <p><strong>Téléphone:</strong> {selectedDoctor.telephone}</p>
                    <p><strong>Disponibilités:</strong></p>
                    <ul>
                      {selectedDoctor.disponibilite?.map(day => (
                        <li key={day}>{day}</li>
                      ))}
                    </ul>
                    <p><strong>Horaires:</strong> {selectedDoctor.heureDebut} - {selectedDoctor.heureFin}</p>
                    {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
                      <div>
                        <p><strong>Certifications:</strong></p>
                        {selectedDoctor.certifications.map((cert, index) => (
                          <Button
                            key={index}
                            variant="link"
                            href={cert}
                            target="_blank"
                          >
                            Certification {index + 1}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Add Patient Modal */}
        <Modal show={showAddPatientModal} onHide={() => setShowAddPatientModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Ajouter un patient privé</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
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
      <Form.Label>
        <i className="fas fa-file-medical me-2"></i>
        Assurance
      </Form.Label>
      <Select
        isMulti
        isCreatable
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
            insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
          });
        }}
        onCreateOption={(inputValue) => {
          const newOption = { value: inputValue, label: inputValue };
          setInsuranceOptions([...insuranceOptions, newOption]);
          setNewPatient({
            ...newPatient,
            insurances: [...(newPatient.insurances || []), inputValue]
          });
        }}
        formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
        placeholder="Sélectionnez ou saisissez les assurances..."
        noOptionsMessage={() => "Aucune option disponible"}
      />
    </Form.Group>
  </Col>
</Row>
              <Form.Group className="mb-3">
                <Form.Label>Photo</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-file-medical me-2"></i>
                  Documents Médicaux
                </Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    setMedicalDocs(files);
                    
                    // Create preview URLs
                    const previews = files.map(file => ({
                      name: file.name,
                      url: URL.createObjectURL(file)
                    }));
                    setPreviewDocs(previews);
                  }}
                />
                {previewDocs.length > 0 && (
                  <div className="mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      Prévisualiser les documents ({previewDocs.length})
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddPatient}>
              Ajouter
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-file-medical me-2"></i>
              Documents Médicaux
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="documents-grid">
              {previewDocs.map((doc, index) => (
                <div key={index} className="document-preview-card">
                  {doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img 
                      src={doc.url} 
                      alt={doc.name}
                      className="img-fluid rounded"
                    />
                  ) : (
                    <div className="pdf-preview">
                      <i className="fas fa-file-pdf fa-3x text-danger"></i>
                      <p className="mt-2">{doc.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Modal.Body>
        </Modal>

        <style jsx>{`

        .basic-multi-select {
  .select__control--is-focused {
    border-color: #0d6efd !important;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
  }

  .select__multi-value {
    background-color: #e7f5ff !important;
    border-radius: 20px !important;
    padding: 2px 8px !important;
  }

  .select__multi-value__remove {
    border-radius: 50% !important;
    padding: 2px !important;
    margin-left: 4px !important;
  }
}
          .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            padding: 1rem;
          }
          
          .document-preview-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
          }
          
          .pdf-preview {
            padding: 2rem;
            background: #f8f9fa;
            border-radius: 8px;
          }
        `}</style>

        {/* Patient Details Modal */}
        <Modal show={showPatientDetails} onHide={() => setShowPatientDetails(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Détails du Patient</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatient && (
              <div>
                <Row>
                  <Col md={6}>
                    {selectedPatient.photo && (
                      <img
                        src={selectedPatient.photo}
                        alt={`${selectedPatient.nom}`}
                        className="img-fluid rounded mb-3"
                      />
                    )}
                  </Col>
                  <Col md={6}>
                    <h4>{selectedPatient.nom} {selectedPatient.prenom}</h4>
                    <p><strong>Age:</strong> {selectedPatient.age}</p>
                    <p><strong>Sexe:</strong> {selectedPatient.sexe}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                    <p><strong>Téléphone:</strong> {selectedPatient.telephone}</p>
                    <p><strong>Adresse:</strong> {selectedPatient.adresse}</p>
                    {/*<p><strong>Mot de passe:</strong>{selectedPatient.password}</p>*/}
                   
                    {selectedPatient.antecedents && (
                      <div>
                        <p><strong>Antécédents médicaux:</strong></p>
                        <ul>
                          {selectedPatient.antecedents.map((ant, index) => (
                            <li key={index}>{ant}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}
            <div className="mb-3">
  <p><strong>Assurances:</strong></p>
  <div className="insurance-tags">
    {selectedPatient?.insurances && selectedPatient.insurances.length > 0 ? (
      selectedPatient.insurances.map((insurance, index) => (
        <span key={index} className="insurance-tag">
          {insurance}
          {index < selectedPatient.insurances.length - 1 ? ', ' : ''}
        </span>
      ))
    ) : (
      <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
    )}
  </div>
</div>
            <div className="documents-section mt-4">
              <h5 className="mb-3">
                <i className="fas fa-file-medical me-2"></i>
                Documents Médicaux
              </h5>
              <div className="documents-grid">
                {selectedPatient?.documents?.map((docUrl, index) => (
                  <div key={index} className="document-item">
                    {docUrl.includes('.pdf') ? (
                      <a 
                        href={docUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary"
                      >
                        <i className="fas fa-file-pdf me-2"></i>
                        Document {index + 1}
                      </a>
                    ) : (
                      <img 
                        src={docUrl} 
                        alt={`Document ${index + 1}`}
                        className="img-fluid rounded"
                        onClick={() => window.open(docUrl, '_blank')}
                        style={{cursor: 'pointer'}}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>
        </Modal>

        {/* Assign Patients Modal */}
        <Modal show={showAssignPatientsModal} onHide={() => setShowAssignPatientsModal(false)} size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-md me-2"></i>
              Assignations multiples - Dr. {selectedDoctor?.nom}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-light p-4">
            <Form>
              {/* Days Selection */}
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-calendar-day me-2"></i>
                      Jours disponibles
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedDoctor?.disponibilite.map(day => (
                        <Button
                          key={day}
                          variant={selectedDays.includes(day) ? "primary" : "outline-primary"}
                          className="rounded-pill shadow-sm"
                          onClick={() => {
                            setSelectedDays(prev =>
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                        >
                          <i className="far fa-calendar me-1"></i>
                          {day}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Time Slots */}
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-clock me-2"></i>
                      Créneaux horaires
                    </Form.Label>
                    <div className="time-slots-container">
                      {generateTimeSlots(
                        selectedDoctor?.heureDebut,
                        selectedDoctor?.heureFin,
                        selectedDoctor?.consultationDuration
                      ).map(slot => (
                        <Button
                          key={slot}
                          variant={selectedTimeSlots.includes(slot) ? "primary" : "outline-primary"}
                          className="rounded-pill shadow-sm m-1"
                          onClick={() => {
                            setSelectedTimeSlots(prev =>
                              prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                            );
                          }}
                        >
                          <i className="far fa-clock me-1"></i>
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Patients Selection */}
              <Row>
                <Col md={12}>
                  <span className="badge bg-primary">
                    <i className="fas fa-users me-1"></i>
                    {selectedPatientIds.length} patient(s) sélectionné(s)
                  </span>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-users me-2"></i>
                      Sélection des patients
                    </Form.Label>
                    
                    <div className="mb-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setSelectedPatientIds(patients.map(p => p.id))}
                        className="me-2 rounded-pill"
                      >
                        <i className="fas fa-check-double me-1"></i>
                        Tout sélectionner
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSelectedPatientIds([])}
                        className="rounded-pill"
                      >
                        <i className="fas fa-times me-1"></i>
                        Tout désélectionner
                      </Button>
                    </div>

                    <div className="patients-list">
                      {patients.map(patient => (
                        <div key={patient.id} className="patient-item p-2 rounded hover-effect">
                          <Form.Check
                            type="checkbox"
                            className="d-flex align-items-center"
                            label={
                              <div className="ms-2">
                                <span className="fw-bold">{patient.nom} {patient.prenom}</span>
                                <small className="text-muted ms-2">
                                  <i className="fas fa-phone-alt me-1"></i>
                                  {patient.telephone}
                                </small>
                              </div>
                            }
                            checked={selectedPatientIds.includes(patient.id)}
                            onChange={(e) => {
                              setSelectedPatientIds(prev =>
                                e.target.checked
                                  ? [...prev, patient.id]
                                  : prev.filter(id => id !== patient.id)
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <style jsx>
                      {`
                        .time-slots-container {
                          max-height: 200px;
                          overflow-y: auto;
                          padding: 10px;
                          border-radius: 8px;
                        }

                        .patients-list {
                          max-height: 300px;
                          overflow-y: auto;
                          border: 1px solid #dee2e6;
                          border-radius: 8px;
                          padding: 10px;
                        }

                        .patient-item {
                          transition: background-color 0.2s ease;
                        }

                        .patient-item:hover {
                          background-color: #f8f9fa;
                        }

                        .hover-effect {
                          transition: transform 0.2s ease;
                        }

                        .hover-effect:hover {
                          transform: translateX(5px);
                        }

                        /* Scrollbar styling */
                        .time-slots-container::-webkit-scrollbar,
                        .patients-list::-webkit-scrollbar {
                          width: 6px;
                        }

                        .time-slots-container::-webkit-scrollbar-track,
                        .patients-list::-webkit-scrollbar-track {
                          background: #f1f1f1;
                        }

                        .time-slots-container::-webkit-scrollbar-thumb,
                        .patients-list::-webkit-scrollbar-thumb {
                          background: #888;
                          border-radius: 3px;
                        }
                      `}
                    </style>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>

          <Modal.Footer className="bg-light border-top">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-center">
                <div className="selected-count">
                  
                </div>
                <div className='d-flex'> 
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowAssignPatientsModal(false)}
                    className="me-2 rounded-pill"
                  >
                    <i className="fas fa-times me-1"></i>
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleMultipleAssignments}
                    disabled={!selectedPatientIds.length || !selectedDays.length || !selectedTimeSlots.length}
                    className="rounded-pill"
                  >
                    <i className="fas fa-check me-1"></i>
                    Confirmer les assignations
                  </Button>
                </div>
              </div>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Edit Patient Modal */}
        <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Modifier le patient</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.nom || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, nom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.prenom || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, prenom: e.target.value})}
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
                      value={selectedPatient?.age || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, age: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sexe</Form.Label>
                    <Form.Select
                      value={selectedPatient?.sexe || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, sexe: e.target.value})}
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
                      value={selectedPatient?.email || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                {/*
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={selectedPatient?.password || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, password: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                */}
                
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={selectedPatient?.telephone || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, telephone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.adresse || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, adresse: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Antécédents médicaux</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedPatient?.antecedents?.join('\n') || ''}
                  onChange={(e) => setSelectedPatient({
                    ...selectedPatient,
                    antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
                  })}
                />
              </Form.Group>
             
    <Form.Group className="mb-3">
      <Form.Label>
        <i className="fas fa-file-medical me-2"></i>
        Assurance
      </Form.Label>  
      <Select
        isMulti
        isCreatable
        name="insurances" 
        options={insuranceOptions}
        className="basic-multi-select"
        classNamePrefix="select"
        value={insuranceOptions.filter(option => 
          selectedPatient?.insurances?.includes(option.value)
        )}
        onChange={(selectedOptions) => {
          setSelectedPatient({
            ...selectedPatient,
            insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
          });
        }}
        onCreateOption={(inputValue) => {
          const newOption = { value: inputValue, label: inputValue };
          setInsuranceOptions([...insuranceOptions, newOption]);
          setSelectedPatient({
            ...selectedPatient, 
            insurances: [...(selectedPatient?.insurances || []), inputValue]
          });
        }}
        formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
        placeholder="Sélectionnez ou saisissez les assurances..."
        noOptionsMessage={() => "Aucune option disponible"}
      />
    </Form.Group>
 
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <i className="fas fa-camera me-2"></i>
                  Photo du patient
                </Form.Label>
                
                <div className="current-photo-container text-center p-3 bg-light rounded mb-3">
                  {selectedPatient?.photo ? (
                    <div className="position-relative d-inline-block">
                      <img 
                        src={selectedPatient.photo} 
                        alt="Photo actuelle" 
                        className="rounded-circle shadow"
                        style={{
                          height: '150px',
                          width: '150px',
                          objectFit: 'cover',
                          border: '4px solid white'
                        }}
                      />
                      <div className="photo-label mt-2 text-muted">
                        <small>Photo actuelle</small>
                      </div>
                    </div>
                  ) : (
                    <div className="default-avatar">
                      <i className="fas fa-user-circle fa-5x text-secondary"></i>
                      <div className="mt-2 text-muted">
                        <small>Aucune photo</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="upload-section">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                    className="form-control-sm"
                  />
                  <small className="text-muted mt-1 d-block">
                    Formats acceptés: JPG, PNG, GIF
                  </small>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Documents Médicaux Actuels</Form.Label>
                <div className="current-docs mb-2">
                  {selectedPatient?.documents?.map((doc, index) => (
                    <Button 
                      key={index}
                      variant="outline-info"
                      size="sm"
                      className="me-2 mb-2"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <i className="fas fa-file-medical me-2"></i>
                      Document {index + 1}
                    </Button>
                  ))}
                </div>
                
                <Form.Label>Ajouter de nouveaux documents</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditMedicalDocs(files);
                    
                    const previews = files.map(file => ({
                      name: file.name,
                      url: URL.createObjectURL(file)
                    }));
                    setEditPreviewDocs(previews);
                  }}
                />
                
                {editPreviewDocs.length > 0 && (
                  <div className="mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      Prévisualiser les nouveaux documents ({editPreviewDocs.length})
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => handleEditPatient(selectedPatient)}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAppointmentsModal} onHide={() => setShowAppointmentsModal(false)} size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-calendar-alt me-2"></i>
              Rendez-vous de {selectedDoctor?.nom}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-light">
            {/* Days selection */}
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
              <h6 className="text-primary mb-3">
                <i className="fas fa-clock me-2"></i>
                Sélectionner un jour:
              </h6>
              <div className="d-flex gap-2 flex-wrap">
                {[...new Set(appointments.map(app => app.day))]
                  .sort((a, b) => weekdayOrder[a] - weekdayOrder[b])
                  .map(day => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "primary" : "outline-primary"}
                      onClick={() => setSelectedDay(day)}
                      className="rounded-pill shadow-sm"
                    >
                      <i className="far fa-calendar me-1"></i>
                      {day}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Appointments list */}
            <div className="appointments-container">
  {appointments
    .filter(app => !selectedDay || app.day === selectedDay)
    .sort((a, b) => {
      if (a.orderNumber && b.orderNumber) {
        return a.orderNumber - b.orderNumber;
      }
      const dayDiff = weekdayOrder[a.day] - weekdayOrder[b.day];
      if (dayDiff !== 0) return dayDiff;
      return a.timeSlot.localeCompare(b.timeSlot);
    })
    .map((appointment, index) => {
      const patient = patients.find(p => p.id === appointment.patientId);
      return (
        <div key={appointment.id} className="mb-3 p-4 bg-white rounded shadow-sm hover-effect">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <span className="badge bg-primary rounded-circle me-2">
                {appointment.orderNumber || index + 1}
              </span>
              <h6 className="text-primary mb-0">
                <i className="fas fa-user me-2"></i>
                {patient?.nom} {patient?.prenom}
              </h6>
            </div>
            <span className={`badge ${appointment.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
              {appointment.status}
            </span>
          </div>
                      
                      <div className="row g-3">
                        <div className="col-md-4">
                          <p className="mb-1">
                            <i className="far fa-calendar-alt me-2 text-muted"></i>
                            <strong>Jour:</strong>
                          </p>
                          <p className="text-muted">{appointment.day || 'Non spécifié'}</p>
                        </div>
                        
                        <div className="col-md-4">
                          <p className="mb-1">
                            <i className="far fa-clock me-2 text-muted"></i>
                            <strong>Horaire:</strong>
                          </p>
                          <p className="text-muted">{appointment.timeSlot}</p>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        {appointment.status === 'scheduled' && (
                          <Button
                            variant="success"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                          >
                            <i className="fas fa-check me-1"></i>
                            Marquer comme terminé
                          </Button>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <style jsx>
              {`
                .hover-effect {
                  transition: transform 0.2s ease-in-out;
                }

                .hover-effect:hover {
                  transform: translateY(-2px);
                }

                .appointments-container {
                  max-height: 60vh;
                  overflow-y: auto;
                  padding-right: 5px;
                }

                .appointments-container::-webkit-scrollbar {
                  width: 6px;
                }

                .appointments-container::-webkit-scrollbar-track {
                  background: #f1f1f1;
                }

                .appointments-container::-webkit-scrollbar-thumb {
                  background: #888;
                  border-radius: 3px;
                }
              `}
            </style>
          </Modal.Body>
        </Modal>

        <Modal 
          show={showProfileModal} 
          onHide={() => setShowProfileModal(false)}
          dialogClassName="modal-right"
          className="sidebar-modal"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-hospital-alt me-2"></i>
              Profil de la Structure
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            {structure && (
              <div className="structure-profile">
                <div className="profile-header text-center p-4 bg-light">
                  {structure.photo ? (
                    <img 
                      src={structure.photo} 
                      alt={structure.name}
                      className="img-fluid rounded-circle profile-image mb-3"
                      style={{width: '150px', height: '150px', objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="default-avatar mb-3">
                      <i className="fas fa-hospital fa-4x"></i>
                    </div>
                  )}
                  <h3 className="fw-bold">{structure.name}</h3>
                  <span className="badge bg-success">Structure Médicale</span>
                </div>

                <div className="profile-content p-4">

                  <div className="info-section mb-4">
                    <h5 className="section-title border-bottom pb-2">
                      <i className="fas fa-chart-bar me-2"></i>
                      Statistiques
                    </h5>
                    <div className="info-item">
                      <p><strong>Nombre de médecins:</strong> {doctors.length}</p>
                      <p><strong>Nombre de patients:</strong> {patients.length}</p>
                      <p><strong>Date d'inscription:</strong> {new Date(structure.dateInscription).toLocaleDateString()}</p>
                    </div>
                  </div>

                
                </div>
              </div>
            )}
          
          </Modal.Body>
        </Modal>

        <Modal 
          show={showSettingsModal} 
          onHide={() => setShowSettingsModal(false)} 
          size="lg"
          dialogClassName="modal-90w"
          className="structure-settings-modal"
        >
          <Modal.Header closeButton className="bg-gradient bg-primary text-white py-3">
            <Modal.Title className="d-flex align-items-center">
              <i className="fas fa-hospital-alt me-3 fa-2x"></i>
              <div>
                <h5 className="mb-0">{isEditing ? 'Modifier les informations' : 'Profil de la Structure'}</h5>
                <small>{structure?.name}</small>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-0">
            <div className="structure-profile bg-light">
              <div className="profile-header text-center p-4 bg-white shadow-sm">
                <div className="position-relative d-inline-block">
                  {structure?.photoUrl ? (
                    <img
                      src={structure.photoUrl}
                      alt={structure.name}
                      className="img-fluid rounded-circle profile-image mb-3 shadow"
                      style={{width: '150px', height: '150px', objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="default-avatar mb-3 rounded-circle bg-primary bg-opacity-10 p-4">
                      <i className="fas fa-hospital fa-4x text-primary"></i>
                    </div>
                  )}
                  {!isEditing && (
                    <Button 
                      variant="primary"
                      size="sm"
                      className="position-absolute bottom-0 end-0 rounded-circle p-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                  )}
                </div>
                <h3 className="fw-bold mb-2">{structure?.name}</h3>
                <span className="badge bg-success rounded-pill px-3 py-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Structure Médicale
                </span>
              </div>

              <div className="profile-content p-4">
                {!isEditing ? (
                  <div className="view-mode">
                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-info-circle me-2"></i>
                        Informations Générales
                      </h5>
                      <div className="info-item p-3">
                        <Row className="g-3">
                          <Col md={6}>
                            <p className="mb-2">
                              <i className="fas fa-envelope text-primary me-2"></i>
                              <strong>Email:</strong> {structure?.email}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-mobile-alt text-primary me-2"></i>
                              <strong>Mobile:</strong> {structure?.phones?.mobile}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-phone text-primary me-2"></i>
                              <strong>Fixe:</strong> {structure?.phones?.landline}
                            </p>
                          </Col>
                          <Col md={6}>
                            <p className="mb-2">
                              <i className="fas fa-map-marker-alt text-primary me-2"></i>
                              <strong>Adresse:</strong> {structure?.address}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-calendar-alt text-primary me-2"></i>
                              <strong>Création:</strong> {structure?.creationYear}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-user text-primary me-2"></i>
                              <strong>Responsable:</strong> {structure?.responsible}
                            </p>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-file-medical me-2"></i>
                        Assurances acceptées
                      </h5>
                      <div className="info-item p-3">
                        <div className="d-flex flex-wrap gap-2">
                          {structure?.insurance?.map((ins, index) => (
                            <span key={index} className="badge bg-info rounded-pill px-3 py-2">
                              <i className="fas fa-check-circle me-2"></i>
                              {ins}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
<div className="info-section mb-4 bg-white rounded shadow-sm">
  <h5 className="section-title border-bottom pb-2">
    <i className="fas fa-stethoscope me-2"></i>
    Spécialités médicales gérées
  </h5>
  <div className="info-item p-3">
    <div className="d-flex flex-wrap gap-2">
      {structure?.specialties?.map((specialty, index) => (
        <span key={index} className="badge bg-primary rounded-pill px-3 py-2">
          <i className="fas fa-user-md me-2"></i>
          {specialty}
        </span>
      ))}
      {(!structure?.specialties || structure.specialties.length === 0) && (
        <p className="text-muted fst-italic mb-0">
          Aucune spécialité spécifiée
        </p>
      )}
    </div>
  </div>
</div>

                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-chart-bar me-2"></i>
                        Statistiques
                      </h5>
                      <div className="info-item p-3">
                        <Row className="g-3">
                          <Col md={4}>
                            <div className="card bg-primary text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{doctors.length}</h3>
                                <small>Médecins</small>
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="card bg-success text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{patients.length}</h3>
                                <small>Patients</small>
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="card bg-info text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{structure?.dateInscription ? new Date(structure.dateInscription).toLocaleDateString() : '-'}</h3>
                                <small>Inscription</small>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="me-2 rounded-pill px-4"
                      >
                        <i className="fas fa-edit me-2"></i>
                        Modifier les informations
                      </Button>

                      <Button
                        variant="outline-primary"
                        onClick={async () => {
                          try {
                            await sendPasswordResetEmail(auth, structure.email);
                            setMessage('Email de réinitialisation envoyé');
                          } catch (error) {
                            setMessage('Erreur: ' + error.message);
                          }
                        }}
                        className="rounded-pill px-4"
                      >
                        <i className="fas fa-lock me-2"></i>
                        Réinitialiser le mot de passe
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-mode bg-white rounded shadow-sm p-4">
                    <Form className="structure-edit-form">
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-building me-2"></i>
                              Nom de la structure
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={structure?.name || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, name: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  name: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-envelope me-2"></i>
                              Email
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={structure?.email || ''}
                              disabled
                              className="bg-light rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-mobile-alt me-2"></i>
                              Téléphone mobile
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={structure?.phones?.mobile || ''}
                              onChange={async (e) => {
                                const updatedStructure = {
                                  ...structure,
                                  phones: {...structure.phones, mobile: e.target.value}
                                };
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  'phones.mobile': e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-phone me-2"></i>
                              Téléphone fixe
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={structure?.phones?.landline || ''}
                              onChange={async (e) => {
                                const updatedStructure = {
                                  ...structure,
                                  phones: {...structure.phones, landline: e.target.value}
                                };
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  'phones.landline': e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-calendar-alt me-2"></i>
                              Année de création
                            </Form.Label>
                            <Form.Control
                              type="number"
                              value={structure?.creationYear || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, creationYear: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  creationYear: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-user me-2"></i>
                              Responsable
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={structure?.responsible || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, responsible: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  responsible: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-map-marker-alt me-2"></i>
                          Adresse
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.address || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, address: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              address: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-globe me-2"></i>
                          Site web
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={structure?.website || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, website: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              website: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>

<Form.Group className="mb-4">
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées
  </Form.Label>
  <Select
    isMulti
    isCreatable
    name="insurances"
    options={insuranceOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={structure?.insurance?.map(insurance => ({
      value: insurance,
      label: insurance
    })) || []}
    onChange={async (selectedOptions) => {
      const insuranceArray = selectedOptions.map(option => option.value);
      const updatedStructure = { ...structure, insurance: insuranceArray };
      await updateDoc(doc(db, 'structures', structure.id), {
        insurance: insuranceArray
      });
      setStructure(updatedStructure);
    }}
    onCreateOption={async (inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      const updatedInsurance = [...(structure?.insurance || []), inputValue];
      const updatedStructure = { ...structure, insurance: updatedInsurance };
      await updateDoc(doc(db, 'structures', structure.id), {
        insurance: updatedInsurance
      });
      setStructure(updatedStructure);
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune assurance disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
</Form.Group>
                    
<Form.Group className="mb-4">
  <Form.Label>
    <i className="fas fa-stethoscope me-2"></i>
    Spécialités médicales gérées
  </Form.Label>
  <Select
    isMulti
    isCreatable
    name="specialties"
    options={specialtyOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={structure?.specialties?.map(specialty => ({
      value: specialty,
      label: specialty
    })) || []}
    onChange={async (selectedOptions) => {
      const specialtiesArray = selectedOptions.map(option => option.value);
      const updatedStructure = { ...structure, specialties: specialtiesArray };
      // Sauvegarder dans Firestore
      await updateDoc(doc(db, 'structures', structure.id), {
        specialties: specialtiesArray
      });
      setStructure(updatedStructure);
    }}
    onCreateOption={async (inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setSpecialtyOptions([...specialtyOptions, newOption]);
      const updatedSpecialties = [...(structure?.specialties || []), inputValue];
      const updatedStructure = { ...structure, specialties: updatedSpecialties };
      // Sauvegarder dans Firestore
      await updateDoc(doc(db, 'structures', structure.id), {
        specialties: updatedSpecialties
      });
      setStructure(updatedStructure);
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les spécialités..."
    noOptionsMessage={() => "Aucune spécialité disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
</Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-camera me-2"></i>
                          Photo de la structure
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const photoRef = ref(storage, `structures/${structure.id}/photo`);
                              await uploadBytes(photoRef, file);
                              const photoUrl = await getDownloadURL(photoRef);
                              await updateDoc(doc(db, 'structures', structure.id), {
                                photoUrl: photoUrl
                              });
                              setStructure({...structure, photoUrl: photoUrl});
                            }
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Form>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="bg-light border-top">
            {isEditing ? (
              <div className="w-100 d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={() => setIsEditing(false)}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-times me-2"></i>
                  Annuler
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage('Modifications enregistrées');
                  }}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-save me-2"></i>
                  Enregistrer
                </Button>
              </div>
            ) : (
              <div className="w-100 text-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-times me-2"></i>
                  Fermer
                </Button>
              </div>
            )}
          </Modal.Footer>

          <style jsx>{`
            .structure-settings-modal .modal-content {
              border-radius: 1rem;
              overflow: hidden;
            }

            .profile-image {
              transition: transform 0.3s ease;
              border: 4px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .profile-image:hover {
              transform: scale(1.05);
            }

            .info-section {
              transition: transform 0.2s ease;
            }

            .info-section:hover {
              transform: translateY(-2px);
            }

            .section-title {
              color: #2c3e50;
              font-weight: 600;
            }

            .info-item p {
              margin-bottom: 0.5rem;
              padding: 0.75rem;
              border-radius: 0.5rem;
              background: #f8f9fa;
              transition: background-color 0.2s ease;
            }

            .info-item p:hover {
              background: #e9ecef;
            }

            .structure-edit-form .form-control {
              border: 1px solid #dee2e6;
              padding: 0.75rem 1.25rem;
              transition: all 0.2s ease;
            }

            .structure-edit-form .form-control:focus {
              border-color: #0d6efd;
              box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
            }

            .card {
              transition: transform 0.2s ease;
            }

            .card:hover {
              transform: translateY(-3px);
            }
          `}</style>
        </Modal>

        <Modal 
          show={showAssignedDoctorModal} 
          onHide={() => setShowAssignedDoctorModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-md me-2"></i>
              Médecins et Rendez-vous
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {assignedDoctors.length > 0 ? (
              assignedDoctors.map(doctor => (
                <div key={doctor.id} className="assigned-doctor-info mb-4">
                  <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                    <h5 className="border-bottom pb-2 text-primary">
                      <i className="fas fa-user-md me-2"></i>
                      Dr. {doctor.nom} {doctor.prenom}
                    </h5>
                    <Row>
                      <Col md={6}>
                        <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                        <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                        <p><strong>Email:</strong> {doctor.email}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                        <p><strong>Jours disponibles:</strong></p>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {doctor.disponibilite?.map(day => (
                            <span key={day} className="badge bg-info">{day}</span>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="appointments-section">
                    <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
                    {doctorAppointments[doctor.id]?.length > 0 ? (
                      <div className="appointments-list">
                        {doctorAppointments[doctor.id]
                          .sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day])
                          .map(apt => (
                            <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="mb-1">
                                    <i className="fas fa-calendar-day me-2 text-primary"></i>
                                    <strong>Jour:</strong> {apt.day}
                                  </p>
                                  <p className="mb-0">
                                    <i className="fas fa-clock me-2 text-primary"></i>
                                    <strong>Heure:</strong> {apt.timeSlot}
                                  </p>
                                </div>
                                <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4">
                <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                <p>Aucun médecin assigné pour le moment</p>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal 
  show={showDoctorScheduleModal} 
  onHide={() => {
    setShowDoctorScheduleModal(false);
    setSelectedDoctorDetails(null);
  }}
  size="lg"
>
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <i className="fas fa-calendar-check me-2"></i>
      Rendez-vous du Dr. {selectedDoctorDetails?.nom} {selectedDoctorDetails?.prenom}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="doctor-info mb-4 p-3 bg-light rounded">
      <Row>
        <Col md={6}>
          <p className="mb-2">
            <i className="fas fa-stethoscope me-2 text-primary"></i>
            <strong>Spécialité:</strong> {selectedDoctorDetails?.specialite}
          </p>
        </Col>
        <Col md={6}>
          <p className="mb-2">
            <i className="fas fa-clock me-2 text-primary"></i>
            <strong>Horaires:</strong> {selectedDoctorDetails?.heureDebut} - {selectedDoctorDetails?.heureFin}
          </p>
        </Col>
      </Row>
    </div>

    <div className="d-flex justify-content-between align-items-center mb-4">
      <h6 className="mb-0">Rendez-vous du {selectedDay}</h6>
      <ButtonGroup size="sm">
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => 
              a.timeSlot.localeCompare(b.timeSlot)
            );
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-clock me-2"></i>
          Par heure
        </Button>
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
              const patientA = patients.find(p => p.id === a.patientId)?.nom;
              const patientB = patients.find(p => p.id === b.patientId)?.nom;
              return patientA?.localeCompare(patientB);
            });
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-user me-2"></i>
          Par patient
        </Button>
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
              if (a.status === 'completed' && b.status !== 'completed') return 1;
              if (a.status !== 'completed' && b.status === 'completed') return -1;
              return 0;
            });
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-tasks me-2"></i>
          Par statut
        </Button>
      </ButtonGroup>
    </div>
    
    <div className="appointments-list">
    {selectedDoctorDetails?.appointments?.length > 0 ? (
  <div className="list-group">
    {selectedDoctorDetails.appointments.map((apt, index) => {
      const patient = patients.find(p => p.id === apt.patientId);
      return (
        <div 
          key={apt.id} 
          className="list-group-item list-group-item-action appointment-item"
        >
          <div className="d-flex justify-content-between align-items-start">
            <div className="me-3">
              <span className="badge bg-primary rounded-circle">
                {apt.orderNumber || index + 1}
              </span>
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold text-primary">
                <i className="fas fa-clock me-2"></i>
                {apt.timeSlot}
              </div>
              <div className="mt-2">
                <div className="fw-bold">{patient?.nom} {patient?.prenom}</div>
                <small className="text-muted">
                  <i className="fas fa-phone me-2"></i>
                  {patient?.telephone}
                </small>
                {lastReorganization[apt.id] && (
                  <div className="mt-1">
                    <small className="text-muted fst-italic">
                      <i className="fas fa-history me-1"></i>
                      Dernière modification: {lastReorganization[apt.id]}
                    </small>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Badge 
                bg={apt.status === 'completed' ? 'success' : 'warning'}
                className="rounded-pill"
              >
                {apt.status === 'completed' ? 'Terminé' : 'En attente'}
              </Badge>
              <ButtonGroup vertical size="sm">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="btn-icon"
                  onClick={() => moveAppointment(apt.id, 'up')}
                  disabled={index === 0}
                >
                  <i className="fas fa-arrow-up"></i>
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="btn-icon"
                  onClick={() => moveAppointment(apt.id, 'down')}
                  disabled={index === selectedDoctorDetails.appointments.length - 1}
                >
                  <i className="fas fa-arrow-down"></i>
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      );
    })}
  </div>
) : (
  <div className="text-center py-4">
    <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
    <p className="text-muted">Aucun rendez-vous programmé pour ce jour</p>
  </div>
)}
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowDoctorScheduleModal(false)}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>

<style jsx>{`

.badge.rounded-circle {
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.appointment-item {
  transition: all 0.2s ease;
}

.appointment-item:hover {
  transform: translateX(5px);
  background-color: #f8f9fa;
}

.appointment-item .text-muted small {
  font-size: 0.85em;
}

.appointment-item .history-info {
  font-size: 0.8em;
  color: #6c757d;
}
  .cursor-pointer:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .appointments-list {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 5px;
  }
  
  .appointment-item {
    transition: transform 0.2s;
    border: 1px solid rgba(0,0,0,.125);
    margin-bottom: 0.5rem;
  }
  
  .appointment-item:hover {
    transform: translateX(5px);
    background-color: #f8f9fa;
  }

  .btn-icon {
    padding: 0.2rem 0.4rem;
  }

  .list-group-item {
    border-left: 4px solid transparent;
  }

  .list-group-item:hover {
    border-left-color: #0d6efd;
  }
`}</style>

<Modal show={showQRModal} onHide={() => setShowQRModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Code QR d'inscription</Modal.Title>
  </Modal.Header>
  <Modal.Body className="text-center">
    <QRCodeSVG 
      value={`${window.location.origin}/qr-register/${structure?.id}`}
      size={256}
      level="H"
    />
    <p className="mt-3">
      Scannez ce code QR pour permettre aux médecins et patients de s'inscrire directement dans votre structure.
    </p>
  </Modal.Body>
</Modal>

<Modal 
  show={showPackModal} 
  onHide={() => setShowPackModal(false)}
  size="lg"
>
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <i className="fas fa-cube me-2"></i>
      Gestion du Pack
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="current-pack-info mb-4">
      <h5 className="border-bottom pb-2">Pack Actuel</h5>
      {currentPack ? (
        <div className="p-3 bg-light rounded">
          <h6 className={`text-${currentPack.color}`}>
            <i className="fas fa-star me-2"></i>
            {currentPack.name}
          </h6>
          <p className="mb-2">
            <i className="fas fa-user-md me-2"></i>
            Maximum médecins : {currentPack.maxDoctors}
          </p>
          <p className="mb-2">
            <i className="fas fa-users me-2"></i>
            Maximum patients : {currentPack.maxPatients}
          </p>
          <p className="mb-0">
            <i className="fas fa-dollar-sign me-2"></i>
            Prix : {currentPack.price} €/mois
          </p>
        </div>
      ) : (
        <p className="text-muted">Aucun pack sélectionné</p>
      )}
    </div>

    {changingPack ? (
      <div className="pack-selection">
        <h5 className="border-bottom pb-2">Choisir un nouveau pack</h5>
        <Row className="g-3">
          {Object.values(SUBSCRIPTION_PACKS).map((pack) => (
            <Col md={6} key={pack.id}>
              <Card 
                className={`h-100 ${currentPack?.id === pack.id ? 'border-primary' : ''}`}
                onClick={() => handlePackChange(pack.id)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <Card.Title className={`text-${pack.color}`}>
                    <i className="fas fa-cube me-2"></i>
                    {pack.name}
                  </Card.Title>
                  <Card.Text>
                    <p className="mb-2">
                      <i className="fas fa-user-md me-2"></i>
                      Maximum médecins : {pack.maxDoctors}
                    </p>
                    <p className="mb-2">
                      <i className="fas fa-users me-2"></i>
                      Maximum patients : {pack.maxPatients}
                    </p>
                    <p className="mb-0">
                      <i className="fas fa-dollar-sign me-2"></i>
                      Prix : {pack.price} €/mois
                    </p>
                  </Card.Text>
                </Card.Body>
                {currentPack?.id === pack.id && (
                  <div className="pack-selected-badge">
                    <i className="fas fa-check-circle text-primary"></i>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    ) : (
      <div className="text-center">
        <Button 
          variant="primary"
          onClick={() => setChangingPack(true)}
        >
          <i className="fas fa-exchange-alt me-2"></i>
          Changer de pack
        </Button>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => {
      setShowPackModal(false);
      setChangingPack(false);
    }}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>

      </Container>
    );
  };

  export default StructuresDashboard;













import React, { useState, useEffect } from 'react';
    import { db, storage,auth } from '../components/firebase-config.js';
    import { doc, updateDoc, getDoc, addDoc, collection, deleteDoc, query, where, getDocs,onSnapshot,setDoc,arrayUnion,arrayRemove, writeBatch } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { Container, Row, Col, Card, Button, Alert, Modal, Form ,ButtonGroup,Dropdown,Offcanvas,Badge} from 'react-bootstrap';
    import { useNavigate } from 'react-router-dom';
    import { 
      sendSignInLinkToEmail,
      sendPasswordResetEmail ,
      getAuth,
      createUserWithEmailAndPassword,
      signOut
    } from 'firebase/auth';
    
import {Calendar } from 'react-calendar';
import { QRCodeSVG } from 'qrcode.react';

    import './StructureDashboard.css';
    import CreatableSelect from 'react-select/creatable';
    import Select from 'react-select/creatable';

    const StructuresDashboard = () => {

      const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  

      useEffect(() => {
        if (showMenuSidebar) {
          setShowProfileSidebar(false);
        }
        if (showProfileSidebar) {
          setShowMenuSidebar(false);
        }
      }, [showMenuSidebar, showProfileSidebar]);

      
    const [structure, setStructure] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [message, setMessage] = useState('');
    const [showDoctorDetails, setShowDoctorDetails] = useState(false);
    const [showPatientDetails, setShowPatientDetails] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [certFiles, setCertFiles] = useState([]);
    const [showAssignPatientsModal, setShowAssignPatientsModal] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [maxPatientsPerSlot, setMaxPatientsPerSlot] = useState(1);
    const [bookedSlots, setBookedSlots] = useState({});
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
    const [showEditPatientModal, setShowEditPatientModal] = useState(false);

    const [viewMode, setViewMode] = useState('calendar'); // 'doctors', 'patients', 'both'
    const [displayMode, setDisplayMode] = useState('grid'); // 'grid', 'table'
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [selectedPatientIds, setSelectedPatientIds] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
    const [selectedDay, setSelectedDay] = useState('Lundi');

    const [showEditForm, setShowEditForm] = useState(false);
    const [pendingChanges, setPendingChanges] = useState(null);
    const [editedStructure, setEditedStructure] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [lastEditDate, setLastEditDate] = useState(null);
    const [medicalDocs, setMedicalDocs] = useState([]);
    const [previewDocs, setPreviewDocs] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [editMedicalDocs, setEditMedicalDocs] = useState([]);
    const [editPreviewDocs, setEditPreviewDocs] = useState([]);
const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState(null);
const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);

// Ajoutez cette fonction pour gérer le clic sur un médecin
const handleDoctorClick = (doctor) => {
  setSelectedDoctorDetails(doctor);
  setShowDoctorScheduleModal(true);
};

const [insuranceOptions, setInsuranceOptions] = useState([
  { value: 'CNAM', label: 'CNAM' },
  { value: 'CNSS', label: 'CNSS' },
  { value: 'CNRPS', label: 'CNRPS' },
  { value: 'Assurance privée', label: 'Assurance privée' },
  { value: 'Autre', label: 'Autre' }
]);
const [specialtyOptions, setSpecialtyOptions] = useState([
  { value: 'Médecine générale', label: 'Médecine générale' },
  { value: 'Cardiologie', label: 'Cardiologie' },
  { value: 'Pédiatrie', label: 'Pédiatrie' },
  { value: 'Dentisterie', label: 'Dentisterie' },
  { value: 'Dermatologie', label: 'Dermatologie' },
  { value: 'Gynécologie', label: 'Gynécologie' },
  { value: 'Ophtalmologie', label: 'Ophtalmologie' },
  { value: 'Orthopédie', label: 'Orthopédie' },
  { value: 'Neurologie', label: 'Neurologie' },
  { value: 'Psychiatrie', label: 'Psychiatrie' },
  { value: 'ORL', label: 'ORL' },
  { value: 'Rhumatologie', label: 'Rhumatologie' },
  { value: 'Pneumologie', label: 'Pneumologie' },
  { value: 'Endocrinologie', label: 'Endocrinologie' },
  { value: 'Autre', label: 'Autre' }
]);

    const [associationRequests, setAssociationRequests] = useState([]);

    const auth = getAuth();

    const [showAssignedDoctorModal, setShowAssignedDoctorModal] = useState(false);
    const [assignedDoctor, setAssignedDoctor] = useState(null);
    const [assignedAppointments, setAssignedAppointments] = useState([]);

    const [assignedDoctors, setAssignedDoctors] = useState([]);
    const [doctorAppointments, setDoctorAppointments] = useState({});

    const [showCalendarView, setShowCalendarView] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [calendarAppointments, setCalendarAppointments] = useState({});
    const [dailyDoctorSchedule, setDailyDoctorSchedule] = useState([]);
    const navigate = useNavigate();


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
    consultationDuration: 5, // in minutes
    bookedSlots: {},
    insurances: []

    });


    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [patientPhotoFile, setPatientPhotoFile] = useState(null);
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

    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({
      doctors: [],
      patients: []
    });


    // Ajouter ces states au début du composant
const [sortOrder, setSortOrder] = useState('time'); // 'time', 'patient', 'status'
const [selectedAppointment, setSelectedAppointment] = useState(null);
const [lastReorganization, setLastReorganization] = useState({});

const updateAppointmentOrder = async (appointmentId, newOrder) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      orderNumber: newOrder,
      lastReorganized: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rendez-vous:', error);
  }
};

// Ajouter cette fonction pour gérer la réorganisation des rendez-vous
const moveAppointment = async (appointmentId, direction) => {
  try {
    const currentAppointments = [...selectedDoctorDetails.appointments];
    const currentIndex = currentAppointments.findIndex(apt => apt.id === appointmentId);
    
    if (direction === 'up' && currentIndex > 0) {
      // Échange avec l'élément précédent
      const temp = currentAppointments[currentIndex];
      currentAppointments[currentIndex] = currentAppointments[currentIndex - 1];
      currentAppointments[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < currentAppointments.length - 1) {
      // Échange avec l'élément suivant
      const temp = currentAppointments[currentIndex];
      currentAppointments[currentIndex] = currentAppointments[currentIndex + 1];
      currentAppointments[currentIndex + 1] = temp;
    }

    // Mettre à jour les numéros d'ordre
    const updatedAppointments = currentAppointments.map((apt, index) => ({
      ...apt,
      orderNumber: index + 1
    }));

    // Mettre à jour Firestore et l'état local
    await Promise.all(
      updatedAppointments.map(apt => 
        updateAppointmentOrder(apt.id, apt.orderNumber)
      )
    );

    // Mettre à jour les deux états
    setSelectedDoctorDetails({
      ...selectedDoctorDetails,
      appointments: updatedAppointments
    });

    setAppointments(prev => {
      const updated = prev.map(apt => {
        const updatedApt = updatedAppointments.find(a => a.id === apt.id);
        return updatedApt || apt;
      });
      return updated;
    });

    // Mettre à jour la dernière réorganisation
    setLastReorganization(prev => ({
      ...prev,
      [appointmentId]: new Date().toLocaleTimeString()
    }));

  } catch (error) {
    console.error('Erreur lors du déplacement du rendez-vous:', error);
  }
};
    // Fonction de recherche
    const handleSearch = (query) => {
      setSearchQuery(query);
      
      if (!query.trim()) {
        setSearchResults({ doctors: [], patients: [] });
        return;
      }
  
      const searchTerms = query.toLowerCase().split(' ');
      
      // Recherche dans les médecins
      const filteredDoctors = doctors.filter(doctor => {
        const searchableFields = [
          doctor.nom,
          doctor.prenom,
          doctor.specialite,
          doctor.email,
          doctor.telephone,
          ...(doctor.disponibilite || [])
        ].map(field => field?.toLowerCase() || '');
  
        return searchTerms.every(term =>
          searchableFields.some(field => field.includes(term))
        );
      });
  
      // Recherche dans les patients
      const filteredPatients = patients.filter(patient => {
        const searchableFields = [
          patient.nom,
          patient.prenom,
          patient.email,
          patient.telephone,
          patient.age?.toString(),
          patient.sexe,
          patient.adresse
        ].map(field => field?.toLowerCase() || '');
  
        return searchTerms.every(term =>
          searchableFields.some(field => field.includes(term))
        );
      });
  
      setSearchResults({
        doctors: filteredDoctors,
        patients: filteredPatients
      });
    };

    const searchBar = (
      <div className="search-container mb-4 p-3 bg-white rounded-3 shadow-sm">
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Rechercher médecins ou patients... (nom, spécialité, email, téléphone, etc.)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </Form.Group>
        
        {searchQuery && (
          <div className="search-results mt-3">
            {(searchResults.doctors.length > 0 || searchResults.patients.length > 0) ? (
              <>
                {searchResults.doctors.length > 0 && (
                  <div className="doctors-results mb-3">
                    <h6 className="text-primary mb-2">
                      <i className="fas fa-user-md me-2"></i>
                      Médecins ({searchResults.doctors.length})
                    </h6>
                    <div className="list-group">
                      {searchResults.doctors.map(doctor => (
                        <div key={doctor.id} className="list-group-item list-group-item-action">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{doctor.nom} {doctor.prenom}</h6>
                              <p className="mb-1 text-muted small">
                                <span className="me-3">
                                  <i className="fas fa-stethoscope me-1"></i>
                                  {doctor.specialite}
                                </span>
                                <span>
                                  <i className="fas fa-phone me-1"></i>
                                  {doctor.telephone}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowDoctorDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.patients.length > 0 && (
                  <div className="patients-results">
                    <h6 className="text-success mb-2">
                      <i className="fas fa-users me-2"></i>
                      Patients ({searchResults.patients.length})
                    </h6>
                    <div className="list-group">
                      {searchResults.patients.map(patient => (
                        <div key={patient.id} className="list-group-item list-group-item-action">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{patient.nom} {patient.prenom}</h6>
                              <p className="mb-1 text-muted small">
                                <span className="me-3">
                                  <i className="fas fa-birthday-cake me-1"></i>
                                  {patient.age} ans
                                </span>
                                <span>
                                  <i className="fas fa-phone me-1"></i>
                                  {patient.telephone}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowPatientDetails(true);
                              }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted text-center my-3">
                <i className="fas fa-search me-2"></i>
                Aucun résultat trouvé
              </p>
            )}
          </div>
        )}
        
        <style jsx>{`
          .search-input {
            border-radius: 20px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            border: 1px solid #dee2e6;
            transition: all 0.2s;
          }
          
          .search-input:focus {
            box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
            border-color: #0d6efd;
          }
          
          .search-results {
            max-height: 500px;
            overflow-y: auto;
          }
          
          .list-group-item {
            transition: all 0.2s;
          }
          
          .list-group-item:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
          }
        `}</style>
      </div>
    );

    const handleMultipleAssignments = async () => {
      try {
        const assignments = [];
        
        for (const patientId of selectedPatientIds) {
          for (const day of selectedDays) {
            for (const timeSlot of selectedTimeSlots) {
              assignments.push({
                doctorId: selectedDoctor.id,
                patientId,
                timeSlot,
                day,
                status: 'scheduled',
                structureId: structure.id,
                createdAt: new Date().toISOString()
              });
            }
          }
        }

        await Promise.all(
          assignments.map(assignment => 
            addDoc(collection(db, 'appointments'), assignment)
          )
        );

        await Promise.all(
          selectedPatientIds.map(patientId =>
            updateDoc(doc(db, 'patients', patientId), {
              medecinId: selectedDoctor.id,
              structureId: structure.id,
              lastUpdated: new Date().toISOString()
            })
          )
        );

        setMessage('Assignations effectuées avec succès');
        setShowAssignPatientsModal(false);
        
        setSelectedPatientIds([]);
        setSelectedDays([]);
        setSelectedTimeSlots([]);
        
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors des assignations');
      }
    };


    useEffect(() => {
       const structureData = JSON.parse(localStorage.getItem('structureData'));
       if (!structureData) {
         navigate('/');
         return;
       }
 
       // Real-time structure listener
       const structureUnsubscribe = onSnapshot(
         doc(db, 'structures', structureData.id),
         (doc) => {
           setStructure({ id: doc.id, ...doc.data() });
         }
       );
 
       // Real-time doctors listener 
       const doctorsUnsubscribe = onSnapshot(
         query(
           collection(db, 'medecins'),
           where('structures', 'array-contains', structureData.id)
         ),
         (snapshot) => {
           const doctorsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setDoctors(doctorsData);
         }
       );
 
       // Real-time patients listener
       const patientsUnsubscribe = onSnapshot(
         query(
           collection(db, 'patients'), 
           where('structures', 'array-contains', structureData.id)
         ),
         (snapshot) => {
           const patientsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setPatients(patientsData);
         }
       );
 
       // Real-time appointments listener
       const appointmentsUnsubscribe = selectedDoctor && onSnapshot(
         query(
           collection(db, 'appointments'),
           where('doctorId', '==', selectedDoctor.id)
         ),
         (snapshot) => {
           const appointmentsData = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           }));
           setAppointments(appointmentsData);
         }
       );
 
       // Real-time association requests listener
       const requestsUnsubscribe = onSnapshot(
         query(
           collection(db, 'associationRequests'),
           where('structureId', '==', structureData.id),
           where('status', '==', 'pending')
         ),
         (snapshot) => {
           setAssociationRequests(snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
           })));
         }
       );
 
       // Charger tous les rendez-vous au démarrage
       fetchAllAppointments();
       
       // Cleanup all listeners
       return () => {
         structureUnsubscribe();
         doctorsUnsubscribe();
         patientsUnsubscribe();
         if (appointmentsUnsubscribe) appointmentsUnsubscribe();
         requestsUnsubscribe();
       };
 
     }, [navigate, selectedDoctor]);


    // Fonctions pour gérer les demandes
    const handleAssociationResponse = async (requestId, doctorId, accepted) => {
      try {
        if (accepted) {
          // Mise à jour du statut de la demande
          await updateDoc(doc(db, 'associationRequests', requestId), {
            status: 'accepted',
            acceptedDate: new Date().toISOString()
          });

          // Ajout de la structure dans le tableau des structures du médecin
          const doctorRef = doc(db, 'medecins', doctorId);
          await updateDoc(doctorRef, {
            structures: arrayUnion(structure.id),
            visibility: 'affiliated'  // Marquer le médecin comme affilié
          });

          // Récupérer les données du médecin
          const doctorDoc = await getDoc(doctorRef);
          const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

          // Ajouter le médecin au tableau local
          setDoctors(prevDoctors => [...prevDoctors, doctorData]);

          setMessage('Médecin associé avec succès');
        } else {
          await updateDoc(doc(db, 'associationRequests', requestId), {
            status: 'rejected',
            rejectionDate: new Date().toISOString()
          });

          setMessage('Demande refusée');
        }
      } catch (error) {
        console.error('Erreur association:', error);
        setMessage('Erreur lors du traitement de la demande');
      }
    };


    const sendConfirmationEmail = async (changes) => {
      try {
        const confirmationToken = Math.random().toString(36).substr(2);
        
        // Store pending changes with token
        await setDoc(doc(db, 'pendingChanges', structure.id), {
          changes,
          token: confirmationToken,
          timestamp: new Date().toISOString()
        });

        // Send confirmation email using Firebase Functions
        const sendMail = httpsCallable(functions, 'sendConfirmationEmail');
        await sendMail({
          email: structure.email,
          token: confirmationToken,
          changes: changes
        });

        setMessage('Email de confirmation envoyé');
        setPendingChanges(changes);
      } catch (error) {
        setMessage('Erreur lors de l\'envoi de l\'email');
      }
    };

    const handleSubmitChanges = async (e) => {
      e.preventDefault();
      const changes = {
        name: editedStructure.name,
        type: editedStructure.type,
        specialite: editedStructure.specialite,
        description: editedStructure.description,
        email: editedStructure.email,
        telephone: editedStructure.telephone,
        adresse: editedStructure.adresse,
        siteWeb: editedStructure.siteWeb,
        horaires: editedStructure.horaires
      };

      await sendConfirmationEmail(changes);
      setShowEditForm(false);
    };


    const fetchStructureData = async (structureId) => {
      try {
        const structureDoc = await getDoc(doc(db, 'structures', structureId));
        const structureData = { id: structureDoc.id, ...structureDoc.data() };
        setStructure(structureData);

        // Fetch affiliated doctors
        const doctorsPromises = (structureData.affiliatedDoctors || [])
          .map(id => getDoc(doc(db, 'medecins', id)));
        const doctorsData = await Promise.all(doctorsPromises);
        const affiliatedDoctors = doctorsData.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch private doctors
        const privateQuery = query(
          collection(db, 'medecins'),
          where('structures', 'array-contains', structureId),
          where('visibility', '==', 'private')
        );
        const privateDoctorsSnapshot = await getDocs(privateQuery);
        const privateDoctors = privateDoctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combine both types of doctors
        setDoctors([...affiliatedDoctors, ...privateDoctors]);

        // First fetch affiliated patients
        const patientsPromises = (structureData.affiliatedPatients || [])
          .map(id => getDoc(doc(db, 'patients', id)));
        const patientsData = await Promise.all(patientsPromises);
        const affiliatedPatients = patientsData.map(doc => ({ id: doc.id, ...doc.data() }));

        // Then fetch private patients
        const privatePatientQuery = query(
          collection(db, 'patients'),
          where('structures', 'array-contains', structureId),
          where('visibility', '==', 'private')
        );
        const privatePatientSnapshot = await getDocs(privatePatientQuery);
        const privatePatients = privatePatientSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Combine both types of patients
        setPatients([...affiliatedPatients, ...privatePatients]);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Erreur lors du chargement des données');
      }
    };

    const fetchDoctorAppointments = async (doctorId) => {
      try {
        const appointmentsSnapshot = await getDocs(query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorId),
          orderBy('orderNumber', 'asc')
        ));
    
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderNumber: doc.data().orderNumber || 0
        }));
    
        setAppointments(appointmentsData);
        
        if (selectedDoctorDetails) {
          setSelectedDoctorDetails({
            ...selectedDoctorDetails,
            appointments: appointmentsData
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
      }
    };

    const handleAddDoctor = async () => {
      try {
        // Validate required fields
        if (!newDoctor.email || !newDoctor.password || !newDoctor.nom || !newDoctor.prenom) {
          setMessage('Veuillez remplir tous les champs obligatoires');
          return;
        }

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newDoctor.email,
          newDoctor.password
        );

        // Add doctor role
        await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
          role: 'doctor',
          structureId: structure.id
        });

        let photoUrl = '';
        let certUrls = [];

        if (photoFile) {
          const photoRef = ref(storage, `doctors/${structure.id}/${photoFile.name}`);
          await uploadBytes(photoRef, photoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        for (const certFile of certFiles) {
          const certRef = ref(storage, `certifications/${structure.id}/${certFile.name}`);
          await uploadBytes(certRef, certFile);
          const certUrl = await getDownloadURL(certRef);
          certUrls.push(certUrl);
        }

        const doctorData = {
          ...newDoctor,
          uid: userCredential.user.uid,
          photo: photoUrl,
          certifications: certUrls,
          structures: [structure.id],
          createdBy: structure.id,
          createdAt: new Date().toISOString(),
          consultationDuration: 30,
          maxPatientsPerDay: 100,
          disponibilite: newDoctor.disponibilite,
          heureDebut: newDoctor.heureDebut,
          heureFin: newDoctor.heureFin,
          status: 'active',
          insurances: newDoctor.insurances || [],

        };

        const docRef = await addDoc(collection(db, 'medecins'), doctorData);
        const newDoctorWithId = { id: docRef.id, ...doctorData };
        
        setDoctors([...doctors, newDoctorWithId]);
        setShowAddDoctorModal(false);
        setMessage('Médecin ajouté avec succès');

        // Reset form
        setNewDoctor({
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
          consultationDuration: 5,
          bookedSlots: {}
        });
        setPhotoFile(null);
        setCertFiles([]);

      } catch (error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setMessage('Cet email est déjà utilisé');
            break;
          case 'auth/invalid-email':
            setMessage('Format d\'email invalide');
            break;
          case 'auth/weak-password':
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            break;
          default:
            setMessage('Erreur lors de la création: ' + error.message);
        }
        console.error('Error details:', error);
      }
    };

      
    const handleAddPatient = async () => {
      try {
        // Validate required fields
        if (!newPatient.email || !newPatient.password || !newPatient.nom || !newPatient.prenom) {
          setMessage('Veuillez remplir tous les champs obligatoires');
          return;
        }

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newPatient.email,
          newPatient.password
        );

        // Add patient role
        await setDoc(doc(db, 'userRoles', userCredential.user.uid), {
          role: 'patient',
          structureId: structure.id
        });

        let photoUrl = '';
        if (patientPhotoFile) {
          const photoRef = ref(storage, `patients/${structure.id}/${patientPhotoFile.name}`);
          await uploadBytes(photoRef, patientPhotoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        const docUrls = await Promise.all(
          medicalDocs.map(async (file) => {
            const docRef = ref(storage, `patients/${structure.id}/${userCredential.user.uid}/documents/${file.name}`);
            await uploadBytes(docRef, file);
            return getDownloadURL(docRef);
          })
        );

        const patientData = {
          ...newPatient,
          uid: userCredential.user.uid,
          photo: photoUrl,
          documents: docUrls,
          structures: [structure.id],
          createdBy: structure.id,
          createdAt: new Date().toISOString(),
          status: 'active',
          antecedents: [],
          allergies: [],
          traitements: [],
          lastVisit: null,
          nextAppointment: null,
          insurances: newPatient.insurances || [],

        };

        const docRef = await addDoc(collection(db, 'patients'), patientData);
        const newPatientWithId = { id: docRef.id, ...patientData };
        
        setPatients([...patients, newPatientWithId]);
        setShowAddPatientModal(false);
        setMessage('Patient ajouté avec succès');
        
        // Reset form
        setNewPatient({
          nom: '',
          prenom: '',
          age: '',
          sexe: '',
          telephone: '',
          email: '',
          password: '',
          photo: null,
          documents: null,
          visibility: 'private',
          structures: []
        });

        setPatientPhotoFile(null);
        setMedicalDocs([]);
        setPreviewDocs([]);

      } catch (error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setMessage('Cet email est déjà utilisé');
            break;
          case 'auth/invalid-email':
            setMessage('Format d\'email invalide');
            break;
          case 'auth/weak-password':
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            break;
          default:
            setMessage('Erreur lors de la création: ' + error.message);
        }
        console.error('Error details:', error);
      }
    };



    const handleDeleteDoctor = async (doctorId) => {
    try {
    await deleteDoc(doc(db, 'medecins', doctorId));
    setDoctors(doctors.filter(d => d.id !== doctorId));
    setMessage('Médecin supprimé avec succès');
    } catch (error) {
    setMessage('Erreur lors de la suppression');
    }
    };

    const handleDeletePatient = async (patientId) => {
      try {
        await deleteDoc(doc(db, 'patients', patientId));
        setPatients(patients.filter(p => p.id !== patientId));
        setMessage('Patient supprimé avec succès');
      } catch (error) {
        setMessage('Erreur lors de la suppression');
      }
    };

    const handleUnaffiliation = async (type, id) => {
      try {
        if (type === 'doctor') {
          // Mise à jour du médecin
          const doctorRef = doc(db, 'medecins', id);
          await updateDoc(doctorRef, {
            structures: arrayRemove(structure.id)
          });

          // Mise à jour des patients
          const patientsQuery = query(
            collection(db, 'patients'),
            where('medecinId', '==', id),
            where('structureId', '==', structure.id)
          );
          
          const patientsSnapshot = await getDocs(patientsQuery);
          const batch = writeBatch(db);
          
          patientsSnapshot.docs.forEach(patientDoc => {
            batch.update(patientDoc.ref, {
              medecinId: null,
              structureId: null
            });
          });
          
          await batch.commit();

          // Mise à jour immédiate de l'interface
          setDoctors(doctors.filter(doc => doc.id !== id));
          setPatients(patients.filter(pat => pat.medecinId !== id));
          
          setMessage('Médecin désaffilié avec succès');
        } else {
          // Mise à jour du patient
          const patientRef = doc(db, 'patients', id);
          await updateDoc(patientRef, {
            structureId: null,
            medecinId: null,

          });

          setPatients(patients.filter(pat => pat.id !== id));
          setMessage('Patient retiré avec succès');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors de la modification');
      }
    };

    const generateTimeSlots = (startTime, endTime, duration) => {
      const slots = [];
      let currentTime = new Date(`2000/01/01 ${startTime}`);
      const endDateTime = new Date(`2000/01/01 ${endTime}`);
      
      while (currentTime < endDateTime) {
        slots.push(currentTime.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
        currentTime.setMinutes(currentTime.getMinutes() + duration);
      }
      
      return slots;
    };

    const handleCompleteAppointment = async (appointmentId) => {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'completed'
      });
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? {...apt, status: 'completed'} : apt
      ));
    };

    const handleDeleteAppointment = async (appointmentId) => {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      setAppointments(appointments.filter(apt => apt.id !== appointmentId));
    };


    const refreshDoctorData = async (doctorId) => {
      try {
          const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
          if (doctorDoc.exists()) {
              const updatedDoctor = { id: doctorDoc.id, ...doctorDoc.data() };
              setDoctors(doctors.map(d => d.id === doctorId ? updatedDoctor : d));
          }
      } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
      }
    };


    const handleEditDoctor = async (doctor) => {
      try {
          const doctorRef = doc(db, 'medecins', doctor.id);
          
          // Créez un objet avec uniquement les champs à mettre à jour
          const updateData = {
              nom: doctor.nom,
              prenom: doctor.prenom,
              specialite: doctor.specialite,
              telephone: doctor.telephone,
              email: doctor.email,
              password: doctor.password,
              disponibilite: doctor.disponibilite || [],
              heureDebut: doctor.heureDebut,
              heureFin: doctor.heureFin,
              maxPatientsPerDay: doctor.maxPatientsPerDay || 1,
              consultationDuration: doctor.consultationDuration || 30,
              joursDisponibles: doctor.joursDisponibles || [],
              insurances: doctor.insurances || [],

          };

          // Mise à jour dans Firestore
          await updateDoc(doctorRef, updateData);

          // Mise à jour locale
          setDoctors(doctors.map(d => d.id === doctor.id ? {...d, ...updateData} : d));
          setShowEditDoctorModal(false);
          setMessage('Médecin modifié avec succès');
          
          // Rafraîchir les données
          await fetchStructureData(structure.id);
      } catch (error) {
          console.error('Erreur lors de la modification:', error);
          setMessage('Erreur lors de la modification du médecin');
      }
    };

    const handleEditPatient = async (patient) => {
      try {
        const patientRef = doc(db, 'patients', patient.id);
        
        // Gestion de la photo
        let photoUrl = patient.photo;
        if (patientPhotoFile) {
          const photoRef = ref(storage, `patients/${structure.id}/${patient.uid}/photo`);
          await uploadBytes(photoRef, patientPhotoFile);
          photoUrl = await getDownloadURL(photoRef);
        }

        // Gestion des documents médicaux
        const newDocUrls = await Promise.all(
          editMedicalDocs.map(async (file) => {
            const docRef = ref(storage, `patients/${structure.id}/${patient.uid}/documents/${file.name}`);
            await uploadBytes(docRef, file);
            return getDownloadURL(docRef);
          })
        );

        const updatedDocs = [...(patient.documents || []), ...newDocUrls];

        await updateDoc(patientRef, {
          nom: patient.nom,
          prenom: patient.prenom,
          age: patient.age,
          sexe: patient.sexe,
          telephone: patient.telephone,
          email: patient.email,
          photo: photoUrl,
          documents: updatedDocs,
          insurances: patient.insurances || [], // Assurez-vous que c'est un tableau
        });

        setPatients(patients.map(p => p.id === patient.id ? {...p, photo: photoUrl, documents: updatedDocs} : p));
        setShowEditPatientModal(false);
        setMessage('Patient modifié avec succès');
        
        // Réinitialisation des états
        setEditMedicalDocs([]);
        setEditPreviewDocs([]);
        setPatientPhotoFile(null);
        
      } catch (error) {
        setMessage('Erreur lors de la modification du patient');
      }
    };

    const handleShowAssignedDoctor = async (patient) => {
      try {
        // Récupérer tous les rendez-vous du patient
        const appointmentsSnapshot = await getDocs(
          query(
            collection(db, 'appointments'),
            where('patientId', '==', patient.id)
          )
        );
        
        // Extraire les IDs uniques des médecins
        const doctorIds = [...new Set(appointmentsSnapshot.docs.map(doc => doc.data().doctorId))];
        
        // Récupérer les informations de tous les médecins
        const doctorsData = await Promise.all(
          doctorIds.map(async (doctorId) => {
            const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
            if (doctorDoc.exists()) {
              return { id: doctorDoc.id, ...doctorDoc.data() };
            }
            return null;
          })
        );

        // Filtrer les médecins null et les organiser avec leurs rendez-vous
        const validDoctors = doctorsData.filter(d => d !== null);
        const appointments = {};
        
        appointmentsSnapshot.docs.forEach(doc => {
          const apt = { id: doc.id, ...doc.data() };
          if (!appointments[apt.doctorId]) {
            appointments[apt.doctorId] = [];
          }
          appointments[apt.doctorId].push(apt);
        });

        setAssignedDoctors(validDoctors);
        setDoctorAppointments(appointments);
        setShowAssignedDoctorModal(true);
        
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur lors de la récupération des informations');
      }
    };

    const sendModificationLink = async () => {
      try {
        // Créer un lien de modification sécurisé
        const actionCodeSettings = {
          url: `${window.location.origin}/edit-structure?id=${structure.id}`,
          handleCodeInApp: true
        };

        // Envoyer l'email avec Firebase Auth
        await sendSignInLinkToEmail(auth, structure.email, actionCodeSettings);

        // Sauvegarder l'email pour la vérification
        localStorage.setItem('emailForModification', structure.email);

        setMessage('Un lien de modification a été envoyé à votre email');
        setShowSettingsModal(false);
      } catch (error) {
        setMessage('Erreur lors de l\'envoi du lien: ' + error.message);
      }
    };

    const handleLogout = async () => {
      try {
        // 1. Sign out from Firebase
        await signOut(auth);
        
        // 2. Clear all localStorage data
        localStorage.clear();
        
        // 3. Navigate to home page
        navigate('/');
        
      } catch (error) {
        console.error('Erreur de déconnexion:', error);
      }
    };

    const weekdayOrder = {
      'Lundi': 1,
      'Mardi': 2,
      'Mercredi': 3,
      'Jeudi': 4,
      'Vendredi': 5,
      'Samedi': 6,
      'Dimanche': 7
    };

    const fadeAnimation = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    };

    const cardVariants = {
      hover: { scale: 1.02, transition: { duration: 0.3 } }
    };

    const DoctorCard = ({ doctor, onDetails, onEdit, onDelete, onAssign }) => (
      <div className="card card-hover fade-in">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="doctor-avatar me-3">
              {doctor.photo ? (
                <img 
                  src={doctor.photo} 
                  alt={doctor.nom}
                  className="rounded-circle"
                  style={{width: "50px", height: "50px", objectFit: "cover"}}
                />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fas fa-user-md fa-2x"></i>
                </div>
              )}
            </div>
            <div>
              <h5 className="mb-0">Dr. {doctor.nom} {doctor.prenom}</h5>
              <span className="text-muted">{doctor.specialite}</span>
            </div>
          </div>
          
          <div className="d-flex flex-wrap gap-2 mb-3">
            {doctor.disponibilite?.map(day => (
              <span key={day} className="badge bg-light text-primary">
                {day}
              </span>
            ))}
          </div>
    
          <div className="action-buttons d-flex gap-2">
            <Button 
              variant="outline-primary" 
              className="btn-float btn-icon-pulse"
              onClick={() => onDetails(doctor)}
            >
              <i className="fas fa-eye me-2"></i>
              Détails
            </Button>
            {/* ... autres boutons ... */}
          </div>
        </div>
      </div>
    );
    
    const PatientCard = ({ patient, onDetails, onEdit, onDelete }) => (
      <div className="card card-hover fade-in">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="patient-avatar me-3">
              {patient.photo ? (
                <img 
                  src={patient.photo} 
                  alt={patient.nom}
                  className="rounded-circle"
                  style={{width: "50px", height: "50px", objectFit: "cover"}}
                />
              ) : (
                <div className="avatar-placeholder">
                  <i className="fas fa-user fa-2x"></i>
                </div>
              )}
            </div>
            <div>
              <h5 className="mb-0">{patient.nom} {patient.prenom}</h5>
              <span className="text-muted">{patient.age} ans</span>
            </div>
          </div>
          
          <div className="patient-info mb-3">
            <p className="mb-1">
              <i className="fas fa-phone-alt me-2 text-primary"></i>
              {patient.telephone}
            </p>
            <p className="mb-0">
              <i className="fas fa-envelope me-2 text-primary"></i>
              {patient.email}
            </p>
          </div>
    
          <div className="action-buttons d-flex gap-2">
            <Button 
              variant="outline-primary" 
              className="btn-float btn-icon-pulse"
              onClick={() => onDetails(patient)}
            >
              <i className="fas fa-eye me-2"></i>
              Détails
            </Button>
            {/* ... autres boutons ... */}
          </div>
        </div>
      </div>
    );
    
    const SearchBar = ({ value, onChange }) => (
      <div className="search-container">
        <div className="position-relative">
          <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input
            type="text"
            className="form-control search-input"
            placeholder="Rechercher..."
            value={value}
            onChange={onChange}
          />
        </div>
        {value && (
          <Button
            variant="link"
            className="position-absolute top-50 end-0 translate-middle-y me-2"
            onClick={() => onChange({ target: { value: '' } })}
          >
            <i className="fas fa-times"></i>
          </Button>
        )}
      </div>
    );
    

    const fetchAllAppointments = async () => {
      try {
        const structureId = JSON.parse(localStorage.getItem('structureData'))?.id;
        if (!structureId) return;
    
        // Récupérer tous les rendez-vous de la structure
        const appointmentsSnapshot = await getDocs(query(
          collection(db, 'appointments'),
          where('structureId', '==', structureId)
        ));
    
        // Organiser les rendez-vous par jour
        const appointmentsByDay = {
          'Lundi': [],
          'Mardi': [],
          'Mercredi': [],
          'Jeudi': [],
          'Vendredi': [],
          'Samedi': [],
          'Dimanche': []
        };
    
        appointmentsSnapshot.docs.forEach(doc => {
          const appt = { id: doc.id, ...doc.data() };
          if (appt.day) {
            appointmentsByDay[appt.day].push(appt);
          }
        });
    
        // Récupérer les détails des médecins pour chaque jour
        const dailySchedule = await Promise.all(
          Object.entries(appointmentsByDay).map(async ([day, dayAppointments]) => {
            const doctorIds = [...new Set(dayAppointments.map(apt => apt.doctorId))];
            
            const doctorsWithAppointments = await Promise.all(
              doctorIds.map(async (doctorId) => {
                const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
                const doctorData = doctorDoc.data();
                
                return {
                  id: doctorId,
                  nom: doctorData.nom,
                  prenom: doctorData.prenom,
                  specialite: doctorData.specialite,
                  heureDebut: doctorData.heureDebut,
                  heureFin: doctorData.heureFin,
                  appointments: dayAppointments.filter(apt => apt.doctorId === doctorId)
                };
              })
            );
    
            return {
              day,
              doctors: doctorsWithAppointments.filter(d => d.appointments.length > 0)
            };
          })
        );
    
        setDailyDoctorSchedule(dailySchedule);
    
        // Sélectionner automatiquement le lundi et son premier médecin
        const mondaySchedule = dailySchedule.find(schedule => schedule.day === 'Lundi');
        if (mondaySchedule && mondaySchedule.doctors.length > 0) {
          setSelectedDoctorDetails(mondaySchedule.doctors[0]);
        }
    
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        setMessage('Erreur lors de la récupération des rendez-vous');
      }
    };

    useEffect(() => {
      const structureData = JSON.parse(localStorage.getItem('structureData'));
      if (!structureData) {
        navigate('/');
        return;
      }
  
      // Initialiser les listeners
      const unsubscribes = [
        // ... existing listeners ...
      ];
  
      // Charger les rendez-vous immédiatement
      fetchAllAppointments();
      
      // Activer automatiquement la vue calendrier
      setShowCalendarView(true);
      setSelectedDay('Lundi');
  
      return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
      };
    }, [navigate]);

    const calendarButton = (
      <Button
        variant={showCalendarView ? 'primary' : 'light'}
        onClick={() => {setShowCalendarView(!showCalendarView);
          setShowMenuSidebar(false);

        }
        }
        className="ms-2"
      >
        <i className="fas fa-calendar-alt me-2"></i>
        Calendrier
      </Button>
    );

  

    const calendarView = showCalendarView && (
      <Card className="calendar-view-card mb-4 shadow-lg">
        <Card.Header className="bg-gradient bg-primary text-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-calendar-alt me-2"></i>
              Planning des rendez-vous
            </h5>
            <p className="mt-1 d-block text-white">
      {new Date().toLocaleString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace('à', 'à')}
    </p>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Colonne des jours - devient pleine largeur sur mobile */}
            <Col xs={12} md={3} className="border-end-md">
              <div className="weekdays-list p-3">
                <h6 className="text-primary mb-3 d-flex align-items-center">
                  <i className="fas fa-calendar-week me-2"></i>
                  Jours de la semaine
                </h6>
                <div className="d-md-block d-flex flex-row flex-nowrap overflow-auto">
                  {dailyDoctorSchedule.map(({ day, doctors }) => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? 'primary' : 'light'}
                      className="d-flex align-items-center justify-content-between w-100 mb-2 mx-1 py-2 px-3 rounded-pill shadow-sm"
                      onClick={() => setSelectedDay(day)}
                    >
                      <div className="d-flex align-items-center">
                        <i className={`fas fa-${selectedDay === day ? 'calendar-check' : 'calendar-day'} me-2`}></i>
                        <span className="d-none d-md-inline">{day}</span>
                        <span className="d-md-none">{day.substring(0, 3)}</span>
                      </div>
                      <Badge bg={selectedDay === day ? 'light' : 'primary'}
                        text={selectedDay === day ? 'primary' : 'white'}
                        className="rounded-pill ms-2">
                        {doctors.reduce((total, doctor) => total + doctor.appointments.length, 0)}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </Col>
    
            <Col xs={12} md={9}>
          <div className="daily-schedule p-3 p-md-4">
            {selectedDay ? (
              <>
                <div className="selected-day-header mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-3 d-flex align-items-center flex-wrap">
                    <i className="fas fa-clock me-2"></i>
                    Planning du {selectedDay}
                    <Badge bg="info" className="ms-2 rounded-pill">
                      {dailyDoctorSchedule
                        .find(schedule => schedule.day === selectedDay)?.doctors
                        .reduce((total, doctor) => total + doctor.appointments.length, 0)} rendez-vous
                    </Badge>
                  </h5>
                </div>

                {dailyDoctorSchedule
                  .find(schedule => schedule.day === selectedDay)?.doctors.length > 0 ? (
                  dailyDoctorSchedule
                    .find(schedule => schedule.day === selectedDay)
                    .doctors.map(doctor => (
                      <div 
                        key={doctor.id} 
                        className="doctor-schedule-card mb-3 cursor-pointer" 
                        onClick={() => handleDoctorClick(doctor)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div className="doctor-header bg-light p-3 rounded">
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center">
                              <div className="doctor-avatar me-3">
                                <i className="fas fa-user-md fa-2x text-primary"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">Dr. {doctor.nom} {doctor.prenom}</h6>
                                <span className="text-muted small">
                                  <i className="fas fa-stethoscope me-2"></i>
                                  {doctor.specialite}
                                </span>
                              </div>
                            </div>
                            <Badge bg="primary" className="rounded-pill px-3">
                              <i className="far fa-clock me-2"></i>
                              {doctor.heureDebut} - {doctor.heureFin}
                            </Badge>
                          </div>
                          <div className="mt-2 text-end">
                            <Badge bg="info" className="rounded-pill">
                              <i className="fas fa-calendar-check me-2"></i>
                              {doctor.appointments.length} rendez-vous
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h6 className="text-muted">Aucun médecin disponible ce jour</h6>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-calendar fa-3x text-primary mb-3"></i>
                <h6 className="text-primary">Sélectionnez un jour</h6>
              </div>
            )}
          </div>
        </Col>
            </Row>
        </Card.Body>
    
        <style jsx>{`
          .calendar-view-card {
            border: none;
            border-radius: 1rem;
            overflow: hidden;
          }
    
          .border-end-md {
            @media (min-width: 768px) {
              border-right: 1px solid #dee2e6;
            }
          }
    
          .weekdays-list {
            @media (max-width: 767px) {
              border-bottom: 1px solid #dee2e6;
            }
          }
    
          .timeline {
            @media (max-width: 767px) {
              padding-left: 40px;
            }
          }
    
          .appointment-card {
            @media (max-width: 767px) {
              margin-left: 5px;
            }
          }
    
          /* Ajout des styles pour le scroll horizontal sur mobile */
          .overflow-auto {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            &::-webkit-scrollbar {
              display: none;
            }
          }
    
          /* Optimisations pour les petits écrans */
          @media (max-width: 767px) {
            .doctor-schedule-card {
              margin-bottom: 1rem;
            }
    
            .time-marker {
              left: -45px;
            }
    
            .appointment-card {
              padding: 0.75rem !important;
            }
          }
        `}</style>
      </Card>
    );

    


    return (
      <Container fluid className="py-4">
        <div className="dashboard-header py-4 px-3 bg-white shadow-sm rounded-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
  {/* Mobile Menu Button */}
  <div className="d-lg-none">
    <Button
      variant="light"
      className="menu-btn shadow-sm"
      onClick={() => {
        setShowMenuSidebar(true);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-bars"></i>
    </Button>
  </div>

  {/* Desktop Navigation */}
  <div className="d-none d-lg-flex align-items-center">
    <ButtonGroup className="me-4 shadow-sm">
      <Button
        variant={viewMode === 'both' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('both');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-th-large me-2"></i>
        Tous
      </Button>
      <Button
        variant={viewMode === 'doctors' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('doctors');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-user-md me-2"></i>
        Médecins
      </Button>
      <Button
        variant={viewMode === 'patients' ? 'primary' : 'light'}
        onClick={() => {
          setViewMode('patients');
          setShowCalendarView(false);
        }}
        className="px-4 py-2 fw-semibold"
      >
        <i className="fas fa-users me-2"></i>
        Patients
      </Button>
    </ButtonGroup>

     
      {calendarButton}
      <Button
  variant="outline-primary"
  className="ms-2"
  onClick={() => {
    setShowQRModal(true);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-qrcode me-2"></i>
  Code QR d'inscription
</Button>
  </div>

  {/* Mobile Profile Button */}
  <div className="d-lg-none">
    <Button
      variant="light"
      className="profile-btn shadow-sm"
      onClick={() => {
        setShowProfileSidebar(true);
        setShowMenuSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-user"></i>
    </Button>
  </div>

  {/* Desktop Profile Buttons */}
  <div className="d-none d-lg-flex gap-2">
    <Button
      variant="light"
      className="btn-icon-hover shadow-sm"
      onClick={() => {
        setShowSettingsModal(true);
        setShowMenuSidebar(false);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-hospital me-2"></i>
      Profil
    </Button>
    
    <Button 
      variant="danger" 
      className="w-100 w-md-auto shadow-sm"
      onClick={() => {
        handleLogout();
        setShowMenuSidebar(false);
        setShowProfileSidebar(false);
        setShowCalendarView(false);
      }}
    >
      <i className="fas fa-sign-out-alt me-md-2"></i>
      <span className="d-none d-md-inline"></span>
      {/*<span className="d-none d-md-inline">Déconnexion</span>
 */}
    </Button>
    
  </div>
</div>

  {/* Menu Sidebar */}
  <Offcanvas show={showMenuSidebar} onHide={() => setShowMenuSidebar(false)} placement="start">
    <Offcanvas.Header closeButton>
      <Offcanvas.Title>Menu Navigation</Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body>
      <div className="d-flex flex-column gap-2">
        <Button
          variant={viewMode === 'both' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('both');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-th-large me-2"></i>
          Tous
        </Button>
        <Button
          variant={viewMode === 'doctors' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('doctors');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-user-md me-2"></i>
          Médecins
        </Button>
        <Button
          variant={viewMode === 'patients' ? 'primary' : 'light'}
          onClick={() => {
            setViewMode('patients');
            setShowMenuSidebar(false);
            setShowCalendarView(false);
          }}
          className="w-100 text-start"
        >
          <i className="fas fa-users me-2"></i>
          Patients
        </Button>
        <Button
  variant="outline-primary"
  className="w-100 text-start"
  onClick={() => {
    setShowQRModal(true);
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-qrcode me-2"></i>
  Code QR d'inscription
</Button>
        <hr />
        <div className="d-flex gap-2 mb-2">
          
          {calendarButton}
        </div>
      </div>
    </Offcanvas.Body>
  </Offcanvas>

  {/* Profile Sidebar */}
  <Offcanvas show={showProfileSidebar} onHide={() => setShowProfileSidebar(false)} placement="end">
    <Offcanvas.Header closeButton>
      <Offcanvas.Title>Menu Profil</Offcanvas.Title>
    </Offcanvas.Header>
    <Offcanvas.Body>
      <div className="d-flex flex-column gap-2">
        <Button
          variant="light"
          className="w-100 text-start"
          onClick={() => {
            setShowProfileModal(true);
            setShowProfileSidebar(false);
            setShowCalendarView(false);
          }}
        >
          <i className="fas fa-hospital me-2"></i>
          Profil Structure
        </Button>
        <Button
          variant="light"
          className="w-100 text-start"
          onClick={() => {
            setShowSettingsModal(true);
            setShowProfileSidebar(false);
            setShowCalendarView(false);
          }}
        >
          <i className="fas fa-cog me-2"></i>
          Paramètres
        </Button>
        <Button 
  variant="danger" 
  className="w-100 w-md-auto shadow-sm"
  onClick={() => {
    handleLogout();
    setShowCalendarView(false);
  }}
>
  <i className="fas fa-sign-out-alt me-md-2"></i>
  <span className="d-none d-md-inline">Déconnexion</span>
</Button>
      </div>
    </Offcanvas.Body>
  </Offcanvas>
</div>


        {/* Rest of the JSX */}
        {searchBar}
        {calendarView}
        
        {message && (
          <Alert variant="info" className="mb-4">
            {message}
          </Alert>
        )}

        {/* Ajouter dans le JSX, avant la liste des médecins */}
        {associationRequests.length > 0 && (
          <Card className="mb-4">
            <Card.Header className="bg-warning">
              <h5>Demandes d'association ({associationRequests.length})</h5>
            </Card.Header>
            <Card.Body>
              {associationRequests.map(request => (
                <div key={request.id} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6>Dr. {request.doctorInfo.nom} {request.doctorInfo.prenom}</h6>
                    <p className="text-muted mb-0">{request.doctorInfo.specialite}</p>
                  </div>
                  <div>
                    <Button
                      variant="success"
                      className="me-2"
                      onClick={() => handleAssociationResponse(request.id, request.doctorId, true)}
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleAssociationResponse(request.id, request.doctorId, false)}
                    >
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        )}
        <Row>
          {(viewMode === 'both' || viewMode === 'doctors') && (
            <Col md={viewMode === 'both' ? 6 : 12}>
              <Card className="doctor-card mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="fas fa-user-md me-2"></i>
                      Médecins
                    </h5>
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => setShowAddDoctorModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Ajouter un médecin privé
                    </Button>
                  </div>
                </Card.Header>
                <style jsx>{`
                  .card-body-scroll {
                      padding: 0;
                      height: calc(100vh - 200px);
                      overflow: hidden;
                  }

                  .doctor-list-container {
                      height: 100%;
                      overflow-y: auto;
                      padding: 1rem;
                  }

                  .doctor-grid {
                      display: grid;
                      gap: 1rem;
                      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                  }

                  .doctor-item {
                      background: white;
                      border-radius: 8px;
                      border: 1px solid rgba(0,0,0,0.1);
                      transition: transform 0.2s;
                  }

                  .doctor-content {
                      padding: 1rem;
                  }

                  .doctor-header {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      margin-bottom: 1rem;
                  }

                  .doctor-name {
                      font-weight: 600;
                      margin-bottom: 0.25rem;
                  }

                  .doctor-specialty {
                      color: #6c757d;
                      margin: 0;
                      font-size: 0.9rem;
                  }

                  .status-badge {
                      padding: 0.25rem 0.75rem;
                      border-radius: 20px;
                      font-size: 0.8rem;
                      display: inline-flex;
                      align-items: center;
                      gap: 0.5rem;
                  }

                  .badge-private {
                      background: #17a2b8;
                      color: white;
                  }

                  .badge-affiliated {
                      background: #28a745;
                      color: white;
                  }

                  .actions-wrapper {
                      overflow-x: auto;
                      margin: 0 -0.5rem;
                  }

                  .actions-row {
                      display: flex;
                      gap: 0.5rem;
                      padding: 0.5rem;
                      min-width: min-content;
                  }

                  .action-button {
                      white-space: nowrap;
                      display: inline-flex;
                      align-items: center;
                      gap: 0.5rem;
                  }

                  @media (max-width: 768px) {
                      .card-body-scroll {
                          height: calc(100vh - 150px);
                      }

                      .doctor-grid {
                          grid-template-columns: 1fr;
                      }

                      .actions-row {
                          padding: 0.25rem;
                          gap: 0.25rem;
                      }

                      .action-button {
                          padding: 0.25rem 0.5rem;
                          font-size: 0.8rem;
                      }
                  }
                `}</style>

                <Card.Body className="card-body-scroll">
                  <div className="doctor-cards-container">
                    <div className="doctor-cards-scroll px-3 py-2">
                      {doctors.map(doctor => (
                        <div key={doctor.id} className="doctor-card-item">
                          <div className="doctor-info p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold mb-0">{doctor.nom} {doctor.prenom}</h6>
                              <span className={`badge ${doctor.visibility === 'private' ? 'bg-info' : 'bg-success'}`}>
                                {doctor.visibility === 'private' ? 'Privé' : 'Affilié'}
                              </span>
                            </div>
                            <p className="text-muted mb-3">
                              <i className="fas fa-stethoscope me-2"></i>
                              {doctor.specialite}
                            </p>
                            
                            <div className="insurances-section mb-3">
  <p className="text-muted mb-2">
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées:
  </p>
  <div className="insurance-tags">
    {doctor.insurances ? (
      doctor.insurances.map((insurance, index) => (
        <span key={index} className="insurance-tag">
          {insurance}{index < doctor.insurances.length - 1 ? ', ' : ''}
        </span>
      ))
    ) : (
      <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
    )}
  </div>
</div>
                            <div className="actions-scroll-container">
                              <div className="actions-scroll">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowDoctorDetails(true);
                                  }}
                                >
                                  <i className="fas fa-eye me-1"></i> Détails
                                </Button>

                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowEditDoctorModal(true);
                                  }}
                                >
                                  <i className="fas fa-edit me-1"></i> Modifier
                                </Button>

                                {doctor.visibility === 'private' ? (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-btn"
                                    onClick={() => handleDeleteDoctor(doctor.id)}
                                  >
                                    <i className="fas fa-trash me-1"></i> Supprimer
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="action-btn"
                                    onClick={() => handleUnaffiliation('doctor', doctor.id)}
                                  >
                                    <i className="fas fa-unlink me-1"></i> Désaffilier
                                  </Button>
                                )}

                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setShowAssignPatientsModal(true);
                                  }}
                                >
                                  <i className="fas fa-user-plus me-1"></i> Assigner
                                </Button>

                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    fetchDoctorAppointments(doctor.id);
                                    setShowAppointmentsModal(true);
                                  }}
                                >
                                  <i className="fas fa-calendar me-1"></i> Rendez-vous
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}

          {(viewMode === 'both' || viewMode === 'patients') && (
            <Col md={viewMode === 'both' ? 6 : 12}>
              <Card className="patient-card shadow-sm">
                <Card.Header className="bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                      <i className="fas fa-users me-2"></i>
                      Patients
                    </h5>
                    <Button
                      variant="light"
                      size="sm"
                      className="rounded-pill px-3"
                      onClick={() => setShowAddPatientModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Ajouter un patient privé
                    </Button>
                  </div>
                </Card.Header>

                <Card.Body className="card-body-scroll">
                  <div className="patient-list-container">
                    <div className="patient-grid">
                      {patients.map(patient => (
                        <div key={patient.id} className="patient-item">
                          <div className="patient-content">
                            <div className="patient-header">
                              <div className="patient-info">
                                <h6 className="patient-name">{patient.nom} {patient.prenom}</h6>
                                <p className="patient-age">
                                  <i className="fas fa-birthday-cake me-2"></i>
                                  {patient.age} ans
                                </p>
                              </div>
                              <span className={`status-badge ${patient.visibility === 'private' ? 'badge-private' : 'badge-affiliated'}`}>
                                <i className={`fas ${patient.visibility === 'private' ? 'fa-lock' : 'fa-link'}`}></i>
                                {patient.visibility === 'private' ? 'Privé' : 'Affilié'}
                              </span>
                            </div>

                            <div className="actions-wrapper">
                              <div className="actions-row">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowPatientDetails(true);
                                  }}
                                >
                                  <i className="fas fa-eye"></i> Détails
                                </Button>

                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowEditPatientModal(true);
                                  }}
                                >
                                  <i className="fas fa-edit"></i> Modifier
                                </Button>

                                {patient.visibility === 'private' ? (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="action-button"
                                    onClick={() => handleDeletePatient(patient.id)}
                                  >
                                    <i className="fas fa-trash"></i> Supprimer
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-warning"
                                    size="sm"
                                    className="action-button"
                                    onClick={() => handleUnaffiliation('patient', patient.id)}
                                  >
                                    <i className="fas fa-unlink"></i> Désaffilier
                                  </Button>
                                )}
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="action-button"
                                  onClick={() => handleShowAssignedDoctor(patient)}
                                  disabled={!patient.medecinId}
                                >
                                  <i className="fas fa-user-md"></i> Médecin assigné
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <style jsx>
                    {`

                    .insurance-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .insurance-tag {
    background-color: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s;
  }

  .insurance-tag:hover {
    background-color: #dee2e6;
    transform: translateY(-1px);
  }

                      .card-body-scroll {
                        padding: 0;
                        height: calc(100vh - 200px);
                        overflow: hidden;
                      }

                      .patient-list-container {
                        height: 100%;
                        overflow-y: auto;
                        padding: 1rem;
                      }

                      .patient-grid {
                        display: grid;
                        gap: 1rem;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                      }

                      .patient-item {
                        background: white;
                        border-radius: 8px;
                        border: 1px solid rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                      }

                      .patient-content {
                        padding: 1rem;
                      }

                      .patient-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1rem;
                      }

                      .patient-name {
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                      }

                      .patient-age {
                        color: #6c757d;
                        margin: 0;
                        font-size: 0.9rem;
                      }

                      .status-badge {
                        padding: 0.25rem 0.75rem;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                      }

                      .badge-private {
                        background: #17a2b8;
                        color: white;
                      }

                      .badge-affiliated {
                        background: #28a745;
                        color: white;
                      }

                      .actions-wrapper {
                        overflow-x: auto;
                        margin: 0 -0.5rem;
                      }

                      .actions-row {
                        display: flex;
                        gap: 0.5rem;
                        padding: 0.5rem;
                        min-width: min-content;
                      }

                      .action-button {
                        white-space: nowrap;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                      }

                      @media (max-width: 768px) {
                        .card-body-scroll {
                          height: calc(100vh - 150px);
                        }

                        .patient-grid {
                          grid-template-columns: 1fr;
                        }

                        .actions-row {
                          padding: 0.25rem;
                          gap: 0.25rem;
                        }

                        .action-button {
                          padding: 0.25rem 0.5rem;
                          font-size: 0.8rem;
                        }
                      }
                    `}
                  </style>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Add Doctor Modal */}
        <Modal show={showAddDoctorModal} onHide={() => setShowAddDoctorModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Ajouter un médecin privé</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
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
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées
  </Form.Label>
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
    onCreateOption={(inputValue) => {
      // Créer une nouvelle option pour l'assurance personnalisée
      const newOption = { value: inputValue, label: inputValue };
      // Mettre à jour les options d'assurance
      setInsuranceOptions([...insuranceOptions, newOption]);
      // Mettre à jour les assurances sélectionnées
      setNewDoctor({
        ...newDoctor,
        insurances: [...(newDoctor.insurances || []), inputValue]
      });
    }}
    isCreatable={true}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune option disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
  <Form.Text className="text-muted">
    Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
  </Form.Text>
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
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddDoctorModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddDoctor}>
              Ajouter
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Doctor Modal */}
        <Modal show={showEditDoctorModal} onHide={() => setShowEditDoctorModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Modifier le médecin</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDoctor?.nom || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, nom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedDoctor?.prenom || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, prenom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Spécialité</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedDoctor?.specialite || ''}
                  onChange={(e) => setSelectedDoctor({...selectedDoctor, specialite: e.target.value})}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={selectedDoctor?.email || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe:</Form.Label>
                    <Form.Control
                      type="password"
                      value={selectedDoctor?.password || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, password: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                
              </Row>
              <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={selectedDoctor?.telephone || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, telephone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
<Col md={6}>
  <Form.Group className="mb-3">
    <Form.Label>
      <i className="fas fa-file-medical me-2"></i>
      Assurances acceptées
    </Form.Label>
    <Select
      isMulti
      isCreatable
      name="insurances"
      options={insuranceOptions}
      className="basic-multi-select"
      classNamePrefix="select"
      value={insuranceOptions.filter(option => 
        selectedDoctor?.insurances?.includes(option.value)
      )}
      onChange={(selectedOptions) => {
        setSelectedDoctor({
          ...selectedDoctor,
          insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
        });
      }}
      onCreateOption={(inputValue) => {
        const newOption = { value: inputValue, label: inputValue };
        setInsuranceOptions([...insuranceOptions, newOption]);
        setSelectedDoctor({
          ...selectedDoctor,
          insurances: [...(selectedDoctor?.insurances || []), inputValue]
        });
      }}
      formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
      placeholder="Sélectionnez ou saisissez les assurances..."
      noOptionsMessage={() => "Aucune option disponible"}
      styles={{
        control: (base) => ({
          ...base,
          borderRadius: '0.375rem',
          borderColor: '#dee2e6',
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#0d6efd'
          }
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: '#e9ecef',
          borderRadius: '0.25rem'
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: '#495057'
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: '#495057',
          ':hover': {
            backgroundColor: '#dc3545',
            color: 'white'
          }
        })
      }}
    />
    <Form.Text className="text-muted">
      Vous pouvez sélectionner des assurances existantes ou en ajouter de nouvelles
    </Form.Text>
  </Form.Group>
</Col>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure début</Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedDoctor?.heureDebut || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, heureDebut: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedDoctor?.heureFin || ''}
                      onChange={(e) => setSelectedDoctor({...selectedDoctor, heureFin: e.target.value})}
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
                      value={selectedDoctor?.maxPatientsPerDay || 0}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
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
                      value={selectedDoctor?.consultationDuration || 30}
                      onChange={(e) => setSelectedDoctor({
                        ...selectedDoctor,
                        consultationDuration: parseInt(e.target.value)
                      })}
                      min="15"
                      step="15"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Jours disponibles</Form.Label>
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                  <Form.Check
                    key={day}
                    type="checkbox"
                    label={day}
                    checked={selectedDoctor?.disponibilite?.includes(day) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDoctor({
                          ...selectedDoctor,
                          disponibilite: [...(selectedDoctor?.disponibilite || []), day]
                        });
                      } else {
                        setSelectedDoctor({
                          ...selectedDoctor,
                          disponibilite: selectedDoctor?.disponibilite?.filter(d => d !== day) || []
                        });
                      }
                    }}
                  />
                ))}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditDoctorModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => handleEditDoctor(selectedDoctor)}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Doctor Details Modal */}
        <Modal show={showDoctorDetails} onHide={() => setShowDoctorDetails(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Détails du Médecin</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedDoctor && (
              <div>
                <Row>
                  <Col md={6}>
                    {selectedDoctor.photo && (
                      <img
                        src={selectedDoctor.photo}
                        alt={`${selectedDoctor.nom}`}
                        className="img-fluid rounded mb-3"
                      />
                    )}
                  </Col>
                  <Col md={6}>
                    <h4>{selectedDoctor.nom} {selectedDoctor.prenom}</h4>
                    <p><strong>Spécialité:</strong> {selectedDoctor.specialite}</p>
                    <p><strong>Email:</strong> {selectedDoctor.email}</p>
                    <p><strong>Téléphone:</strong> {selectedDoctor.telephone}</p>
                    <p><strong>Disponibilités:</strong></p>
                    <ul>
                      {selectedDoctor.disponibilite?.map(day => (
                        <li key={day}>{day}</li>
                      ))}
                    </ul>
                    <p><strong>Horaires:</strong> {selectedDoctor.heureDebut} - {selectedDoctor.heureFin}</p>
                    {selectedDoctor.certifications && selectedDoctor.certifications.length > 0 && (
                      <div>
                        <p><strong>Certifications:</strong></p>
                        {selectedDoctor.certifications.map((cert, index) => (
                          <Button
                            key={index}
                            variant="link"
                            href={cert}
                            target="_blank"
                          >
                            Certification {index + 1}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Add Patient Modal */}
        <Modal show={showAddPatientModal} onHide={() => setShowAddPatientModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Ajouter un patient privé</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
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
      <Form.Label>
        <i className="fas fa-file-medical me-2"></i>
        Assurance
      </Form.Label>
      <Select
        isMulti
        isCreatable
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
            insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
          });
        }}
        onCreateOption={(inputValue) => {
          const newOption = { value: inputValue, label: inputValue };
          setInsuranceOptions([...insuranceOptions, newOption]);
          setNewPatient({
            ...newPatient,
            insurances: [...(newPatient.insurances || []), inputValue]
          });
        }}
        formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
        placeholder="Sélectionnez ou saisissez les assurances..."
        noOptionsMessage={() => "Aucune option disponible"}
      />
    </Form.Group>
  </Col>
</Row>
              <Form.Group className="mb-3">
                <Form.Label>Photo</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-file-medical me-2"></i>
                  Documents Médicaux
                </Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    setMedicalDocs(files);
                    
                    // Create preview URLs
                    const previews = files.map(file => ({
                      name: file.name,
                      url: URL.createObjectURL(file)
                    }));
                    setPreviewDocs(previews);
                  }}
                />
                {previewDocs.length > 0 && (
                  <div className="mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      Prévisualiser les documents ({previewDocs.length})
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddPatientModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddPatient}>
              Ajouter
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-file-medical me-2"></i>
              Documents Médicaux
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="documents-grid">
              {previewDocs.map((doc, index) => (
                <div key={index} className="document-preview-card">
                  {doc.name.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img 
                      src={doc.url} 
                      alt={doc.name}
                      className="img-fluid rounded"
                    />
                  ) : (
                    <div className="pdf-preview">
                      <i className="fas fa-file-pdf fa-3x text-danger"></i>
                      <p className="mt-2">{doc.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Modal.Body>
        </Modal>

        <style jsx>{`

        .basic-multi-select {
  .select__control--is-focused {
    border-color: #0d6efd !important;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
  }

  .select__multi-value {
    background-color: #e7f5ff !important;
    border-radius: 20px !important;
    padding: 2px 8px !important;
  }

  .select__multi-value__remove {
    border-radius: 50% !important;
    padding: 2px !important;
    margin-left: 4px !important;
  }
}
          .documents-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            padding: 1rem;
          }
          
          .document-preview-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
          }
          
          .pdf-preview {
            padding: 2rem;
            background: #f8f9fa;
            border-radius: 8px;
          }
        `}</style>

        {/* Patient Details Modal */}
        <Modal show={showPatientDetails} onHide={() => setShowPatientDetails(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Détails du Patient</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatient && (
              <div>
                <Row>
                  <Col md={6}>
                    {selectedPatient.photo && (
                      <img
                        src={selectedPatient.photo}
                        alt={`${selectedPatient.nom}`}
                        className="img-fluid rounded mb-3"
                      />
                    )}
                  </Col>
                  <Col md={6}>
                    <h4>{selectedPatient.nom} {selectedPatient.prenom}</h4>
                    <p><strong>Age:</strong> {selectedPatient.age}</p>
                    <p><strong>Sexe:</strong> {selectedPatient.sexe}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                    <p><strong>Téléphone:</strong> {selectedPatient.telephone}</p>
                    <p><strong>Adresse:</strong> {selectedPatient.adresse}</p>
                    {/*<p><strong>Mot de passe:</strong>{selectedPatient.password}</p>*/}
                   
                    {selectedPatient.antecedents && (
                      <div>
                        <p><strong>Antécédents médicaux:</strong></p>
                        <ul>
                          {selectedPatient.antecedents.map((ant, index) => (
                            <li key={index}>{ant}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )}
            <div className="mb-3">
  <p><strong>Assurances:</strong></p>
  <div className="insurance-tags">
    {selectedPatient?.insurances && selectedPatient.insurances.length > 0 ? (
      selectedPatient.insurances.map((insurance, index) => (
        <span key={index} className="insurance-tag">
          {insurance}
          {index < selectedPatient.insurances.length - 1 ? ', ' : ''}
        </span>
      ))
    ) : (
      <span className="text-muted fst-italic">Aucune assurance spécifiée</span>
    )}
  </div>
</div>
            <div className="documents-section mt-4">
              <h5 className="mb-3">
                <i className="fas fa-file-medical me-2"></i>
                Documents Médicaux
              </h5>
              <div className="documents-grid">
                {selectedPatient?.documents?.map((docUrl, index) => (
                  <div key={index} className="document-item">
                    {docUrl.includes('.pdf') ? (
                      <a 
                        href={docUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary"
                      >
                        <i className="fas fa-file-pdf me-2"></i>
                        Document {index + 1}
                      </a>
                    ) : (
                      <img 
                        src={docUrl} 
                        alt={`Document ${index + 1}`}
                        className="img-fluid rounded"
                        onClick={() => window.open(docUrl, '_blank')}
                        style={{cursor: 'pointer'}}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Modal.Body>
        </Modal>

        {/* Assign Patients Modal */}
        <Modal show={showAssignPatientsModal} onHide={() => setShowAssignPatientsModal(false)} size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-md me-2"></i>
              Assignations multiples - Dr. {selectedDoctor?.nom}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-light p-4">
            <Form>
              {/* Days Selection */}
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-calendar-day me-2"></i>
                      Jours disponibles
                    </Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedDoctor?.disponibilite.map(day => (
                        <Button
                          key={day}
                          variant={selectedDays.includes(day) ? "primary" : "outline-primary"}
                          className="rounded-pill shadow-sm"
                          onClick={() => {
                            setSelectedDays(prev =>
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                        >
                          <i className="far fa-calendar me-1"></i>
                          {day}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Time Slots */}
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-clock me-2"></i>
                      Créneaux horaires
                    </Form.Label>
                    <div className="time-slots-container">
                      {generateTimeSlots(
                        selectedDoctor?.heureDebut,
                        selectedDoctor?.heureFin,
                        selectedDoctor?.consultationDuration
                      ).map(slot => (
                        <Button
                          key={slot}
                          variant={selectedTimeSlots.includes(slot) ? "primary" : "outline-primary"}
                          className="rounded-pill shadow-sm m-1"
                          onClick={() => {
                            setSelectedTimeSlots(prev =>
                              prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
                            );
                          }}
                        >
                          <i className="far fa-clock me-1"></i>
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Patients Selection */}
              <Row>
                <Col md={12}>
                  <span className="badge bg-primary">
                    <i className="fas fa-users me-1"></i>
                    {selectedPatientIds.length} patient(s) sélectionné(s)
                  </span>
                  <Form.Group className="bg-white p-3 rounded shadow-sm">
                    <Form.Label className="fw-bold text-primary mb-3">
                      <i className="fas fa-users me-2"></i>
                      Sélection des patients
                    </Form.Label>
                    
                    <div className="mb-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setSelectedPatientIds(patients.map(p => p.id))}
                        className="me-2 rounded-pill"
                      >
                        <i className="fas fa-check-double me-1"></i>
                        Tout sélectionner
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSelectedPatientIds([])}
                        className="rounded-pill"
                      >
                        <i className="fas fa-times me-1"></i>
                        Tout désélectionner
                      </Button>
                    </div>

                    <div className="patients-list">
                      {patients.map(patient => (
                        <div key={patient.id} className="patient-item p-2 rounded hover-effect">
                          <Form.Check
                            type="checkbox"
                            className="d-flex align-items-center"
                            label={
                              <div className="ms-2">
                                <span className="fw-bold">{patient.nom} {patient.prenom}</span>
                                <small className="text-muted ms-2">
                                  <i className="fas fa-phone-alt me-1"></i>
                                  {patient.telephone}
                                </small>
                              </div>
                            }
                            checked={selectedPatientIds.includes(patient.id)}
                            onChange={(e) => {
                              setSelectedPatientIds(prev =>
                                e.target.checked
                                  ? [...prev, patient.id]
                                  : prev.filter(id => id !== patient.id)
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <style jsx>
                      {`
                        .time-slots-container {
                          max-height: 200px;
                          overflow-y: auto;
                          padding: 10px;
                          border-radius: 8px;
                        }

                        .patients-list {
                          max-height: 300px;
                          overflow-y: auto;
                          border: 1px solid #dee2e6;
                          border-radius: 8px;
                          padding: 10px;
                        }

                        .patient-item {
                          transition: background-color 0.2s ease;
                        }

                        .patient-item:hover {
                          background-color: #f8f9fa;
                        }

                        .hover-effect {
                          transition: transform 0.2s ease;
                        }

                        .hover-effect:hover {
                          transform: translateX(5px);
                        }

                        /* Scrollbar styling */
                        .time-slots-container::-webkit-scrollbar,
                        .patients-list::-webkit-scrollbar {
                          width: 6px;
                        }

                        .time-slots-container::-webkit-scrollbar-track,
                        .patients-list::-webkit-scrollbar-track {
                          background: #f1f1f1;
                        }

                        .time-slots-container::-webkit-scrollbar-thumb,
                        .patients-list::-webkit-scrollbar-thumb {
                          background: #888;
                          border-radius: 3px;
                        }
                      `}
                    </style>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>

          <Modal.Footer className="bg-light border-top">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-center">
                <div className="selected-count">
                  
                </div>
                <div className='d-flex'> 
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowAssignPatientsModal(false)}
                    className="me-2 rounded-pill"
                  >
                    <i className="fas fa-times me-1"></i>
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleMultipleAssignments}
                    disabled={!selectedPatientIds.length || !selectedDays.length || !selectedTimeSlots.length}
                    className="rounded-pill"
                  >
                    <i className="fas fa-check me-1"></i>
                    Confirmer les assignations
                  </Button>
                </div>
              </div>
            </div>
          </Modal.Footer>
        </Modal>

        {/* Edit Patient Modal */}
        <Modal show={showEditPatientModal} onHide={() => setShowEditPatientModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Modifier le patient</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.nom || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, nom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.prenom || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, prenom: e.target.value})}
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
                      value={selectedPatient?.age || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, age: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sexe</Form.Label>
                    <Form.Select
                      value={selectedPatient?.sexe || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, sexe: e.target.value})}
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
                      value={selectedPatient?.email || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                {/*
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={selectedPatient?.password || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, password: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                */}
                
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={selectedPatient?.telephone || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, telephone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Adresse</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedPatient?.adresse || ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, adresse: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Antécédents médicaux</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedPatient?.antecedents?.join('\n') || ''}
                  onChange={(e) => setSelectedPatient({
                    ...selectedPatient,
                    antecedents: e.target.value.split('\n').filter(item => item.trim() !== '')
                  })}
                />
              </Form.Group>
             
    <Form.Group className="mb-3">
      <Form.Label>
        <i className="fas fa-file-medical me-2"></i>
        Assurance
      </Form.Label>  
      <Select
        isMulti
        isCreatable
        name="insurances" 
        options={insuranceOptions}
        className="basic-multi-select"
        classNamePrefix="select"
        value={insuranceOptions.filter(option => 
          selectedPatient?.insurances?.includes(option.value)
        )}
        onChange={(selectedOptions) => {
          setSelectedPatient({
            ...selectedPatient,
            insurances: selectedOptions ? selectedOptions.map(option => option.value) : []
          });
        }}
        onCreateOption={(inputValue) => {
          const newOption = { value: inputValue, label: inputValue };
          setInsuranceOptions([...insuranceOptions, newOption]);
          setSelectedPatient({
            ...selectedPatient, 
            insurances: [...(selectedPatient?.insurances || []), inputValue]
          });
        }}
        formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
        placeholder="Sélectionnez ou saisissez les assurances..."
        noOptionsMessage={() => "Aucune option disponible"}
      />
    </Form.Group>
 
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <i className="fas fa-camera me-2"></i>
                  Photo du patient
                </Form.Label>
                
                <div className="current-photo-container text-center p-3 bg-light rounded mb-3">
                  {selectedPatient?.photo ? (
                    <div className="position-relative d-inline-block">
                      <img 
                        src={selectedPatient.photo} 
                        alt="Photo actuelle" 
                        className="rounded-circle shadow"
                        style={{
                          height: '150px',
                          width: '150px',
                          objectFit: 'cover',
                          border: '4px solid white'
                        }}
                      />
                      <div className="photo-label mt-2 text-muted">
                        <small>Photo actuelle</small>
                      </div>
                    </div>
                  ) : (
                    <div className="default-avatar">
                      <i className="fas fa-user-circle fa-5x text-secondary"></i>
                      <div className="mt-2 text-muted">
                        <small>Aucune photo</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="upload-section">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                    className="form-control-sm"
                  />
                  <small className="text-muted mt-1 d-block">
                    Formats acceptés: JPG, PNG, GIF
                  </small>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Documents Médicaux Actuels</Form.Label>
                <div className="current-docs mb-2">
                  {selectedPatient?.documents?.map((doc, index) => (
                    <Button 
                      key={index}
                      variant="outline-info"
                      size="sm"
                      className="me-2 mb-2"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <i className="fas fa-file-medical me-2"></i>
                      Document {index + 1}
                    </Button>
                  ))}
                </div>
                
                <Form.Label>Ajouter de nouveaux documents</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditMedicalDocs(files);
                    
                    const previews = files.map(file => ({
                      name: file.name,
                      url: URL.createObjectURL(file)
                    }));
                    setEditPreviewDocs(previews);
                  }}
                />
                
                {editPreviewDocs.length > 0 && (
                  <div className="mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => setShowPreviewModal(true)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      Prévisualiser les nouveaux documents ({editPreviewDocs.length})
                    </Button>
                  </div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditPatientModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => handleEditPatient(selectedPatient)}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAppointmentsModal} onHide={() => setShowAppointmentsModal(false)} size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-calendar-alt me-2"></i>
              Rendez-vous de {selectedDoctor?.nom}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="bg-light">
            {/* Days selection */}
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
              <h6 className="text-primary mb-3">
                <i className="fas fa-clock me-2"></i>
                Sélectionner un jour:
              </h6>
              <div className="d-flex gap-2 flex-wrap">
                {[...new Set(appointments.map(app => app.day))]
                  .sort((a, b) => weekdayOrder[a] - weekdayOrder[b])
                  .map(day => (
                    <Button
                      key={day}
                      variant={selectedDay === day ? "primary" : "outline-primary"}
                      onClick={() => setSelectedDay(day)}
                      className="rounded-pill shadow-sm"
                    >
                      <i className="far fa-calendar me-1"></i>
                      {day}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Appointments list */}
            <div className="appointments-container">
  {appointments
    .filter(app => !selectedDay || app.day === selectedDay)
    .sort((a, b) => {
      if (a.orderNumber && b.orderNumber) {
        return a.orderNumber - b.orderNumber;
      }
      const dayDiff = weekdayOrder[a.day] - weekdayOrder[b.day];
      if (dayDiff !== 0) return dayDiff;
      return a.timeSlot.localeCompare(b.timeSlot);
    })
    .map((appointment, index) => {
      const patient = patients.find(p => p.id === appointment.patientId);
      return (
        <div key={appointment.id} className="mb-3 p-4 bg-white rounded shadow-sm hover-effect">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <span className="badge bg-primary rounded-circle me-2">
                {appointment.orderNumber || index + 1}
              </span>
              <h6 className="text-primary mb-0">
                <i className="fas fa-user me-2"></i>
                {patient?.nom} {patient?.prenom}
              </h6>
            </div>
            <span className={`badge ${appointment.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
              {appointment.status}
            </span>
          </div>
                      
                      <div className="row g-3">
                        <div className="col-md-4">
                          <p className="mb-1">
                            <i className="far fa-calendar-alt me-2 text-muted"></i>
                            <strong>Jour:</strong>
                          </p>
                          <p className="text-muted">{appointment.day || 'Non spécifié'}</p>
                        </div>
                        
                        <div className="col-md-4">
                          <p className="mb-1">
                            <i className="far fa-clock me-2 text-muted"></i>
                            <strong>Horaire:</strong>
                          </p>
                          <p className="text-muted">{appointment.timeSlot}</p>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        {appointment.status === 'scheduled' && (
                          <Button
                            variant="success"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleCompleteAppointment(appointment.id)}
                          >
                            <i className="fas fa-check me-1"></i>
                            Marquer comme terminé
                          </Button>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="rounded-pill"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            <style jsx>
              {`
                .hover-effect {
                  transition: transform 0.2s ease-in-out;
                }

                .hover-effect:hover {
                  transform: translateY(-2px);
                }

                .appointments-container {
                  max-height: 60vh;
                  overflow-y: auto;
                  padding-right: 5px;
                }

                .appointments-container::-webkit-scrollbar {
                  width: 6px;
                }

                .appointments-container::-webkit-scrollbar-track {
                  background: #f1f1f1;
                }

                .appointments-container::-webkit-scrollbar-thumb {
                  background: #888;
                  border-radius: 3px;
                }
              `}
            </style>
          </Modal.Body>
        </Modal>

        <Modal 
          show={showProfileModal} 
          onHide={() => setShowProfileModal(false)}
          dialogClassName="modal-right"
          className="sidebar-modal"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-hospital-alt me-2"></i>
              Profil de la Structure
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            {structure && (
              <div className="structure-profile">
                <div className="profile-header text-center p-4 bg-light">
                  {structure.photo ? (
                    <img 
                      src={structure.photo} 
                      alt={structure.name}
                      className="img-fluid rounded-circle profile-image mb-3"
                      style={{width: '150px', height: '150px', objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="default-avatar mb-3">
                      <i className="fas fa-hospital fa-4x"></i>
                    </div>
                  )}
                  <h3 className="fw-bold">{structure.name}</h3>
                  <span className="badge bg-success">Structure Médicale</span>
                </div>

                <div className="profile-content p-4">

                  <div className="info-section mb-4">
                    <h5 className="section-title border-bottom pb-2">
                      <i className="fas fa-chart-bar me-2"></i>
                      Statistiques
                    </h5>
                    <div className="info-item">
                      <p><strong>Nombre de médecins:</strong> {doctors.length}</p>
                      <p><strong>Nombre de patients:</strong> {patients.length}</p>
                      <p><strong>Date d'inscription:</strong> {new Date(structure.dateInscription).toLocaleDateString()}</p>
                    </div>
                  </div>

                
                </div>
              </div>
            )}
          
          </Modal.Body>
        </Modal>

        <Modal 
          show={showSettingsModal} 
          onHide={() => setShowSettingsModal(false)} 
          size="lg"
          dialogClassName="modal-90w"
          className="structure-settings-modal"
        >
          <Modal.Header closeButton className="bg-gradient bg-primary text-white py-3">
            <Modal.Title className="d-flex align-items-center">
              <i className="fas fa-hospital-alt me-3 fa-2x"></i>
              <div>
                <h5 className="mb-0">{isEditing ? 'Modifier les informations' : 'Profil de la Structure'}</h5>
                <small>{structure?.name}</small>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-0">
            <div className="structure-profile bg-light">
              <div className="profile-header text-center p-4 bg-white shadow-sm">
                <div className="position-relative d-inline-block">
                  {structure?.photoUrl ? (
                    <img
                      src={structure.photoUrl}
                      alt={structure.name}
                      className="img-fluid rounded-circle profile-image mb-3 shadow"
                      style={{width: '150px', height: '150px', objectFit: 'cover'}}
                    />
                  ) : (
                    <div className="default-avatar mb-3 rounded-circle bg-primary bg-opacity-10 p-4">
                      <i className="fas fa-hospital fa-4x text-primary"></i>
                    </div>
                  )}
                  {!isEditing && (
                    <Button 
                      variant="primary"
                      size="sm"
                      className="position-absolute bottom-0 end-0 rounded-circle p-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </Button>
                  )}
                </div>
                <h3 className="fw-bold mb-2">{structure?.name}</h3>
                <span className="badge bg-success rounded-pill px-3 py-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Structure Médicale
                </span>
              </div>

              <div className="profile-content p-4">
                {!isEditing ? (
                  <div className="view-mode">
                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-info-circle me-2"></i>
                        Informations Générales
                      </h5>
                      <div className="info-item p-3">
                        <Row className="g-3">
                          <Col md={6}>
                            <p className="mb-2">
                              <i className="fas fa-envelope text-primary me-2"></i>
                              <strong>Email:</strong> {structure?.email}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-mobile-alt text-primary me-2"></i>
                              <strong>Mobile:</strong> {structure?.phones?.mobile}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-phone text-primary me-2"></i>
                              <strong>Fixe:</strong> {structure?.phones?.landline}
                            </p>
                          </Col>
                          <Col md={6}>
                            <p className="mb-2">
                              <i className="fas fa-map-marker-alt text-primary me-2"></i>
                              <strong>Adresse:</strong> {structure?.address}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-calendar-alt text-primary me-2"></i>
                              <strong>Création:</strong> {structure?.creationYear}
                            </p>
                            <p className="mb-2">
                              <i className="fas fa-user text-primary me-2"></i>
                              <strong>Responsable:</strong> {structure?.responsible}
                            </p>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-file-medical me-2"></i>
                        Assurances acceptées
                      </h5>
                      <div className="info-item p-3">
                        <div className="d-flex flex-wrap gap-2">
                          {structure?.insurance?.map((ins, index) => (
                            <span key={index} className="badge bg-info rounded-pill px-3 py-2">
                              <i className="fas fa-check-circle me-2"></i>
                              {ins}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
<div className="info-section mb-4 bg-white rounded shadow-sm">
  <h5 className="section-title border-bottom pb-2">
    <i className="fas fa-stethoscope me-2"></i>
    Spécialités médicales gérées
  </h5>
  <div className="info-item p-3">
    <div className="d-flex flex-wrap gap-2">
      {structure?.specialties?.map((specialty, index) => (
        <span key={index} className="badge bg-primary rounded-pill px-3 py-2">
          <i className="fas fa-user-md me-2"></i>
          {specialty}
        </span>
      ))}
      {(!structure?.specialties || structure.specialties.length === 0) && (
        <p className="text-muted fst-italic mb-0">
          Aucune spécialité spécifiée
        </p>
      )}
    </div>
  </div>
</div>

                    <div className="info-section mb-4 bg-white rounded shadow-sm">
                      <h5 className="section-title border-bottom pb-2">
                        <i className="fas fa-chart-bar me-2"></i>
                        Statistiques
                      </h5>
                      <div className="info-item p-3">
                        <Row className="g-3">
                          <Col md={4}>
                            <div className="card bg-primary text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{doctors.length}</h3>
                                <small>Médecins</small>
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="card bg-success text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{patients.length}</h3>
                                <small>Patients</small>
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="card bg-info text-white">
                              <div className="card-body text-center">
                                <h3 className="mb-0">{structure?.dateInscription ? new Date(structure.dateInscription).toLocaleDateString() : '-'}</h3>
                                <small>Inscription</small>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <Button
                        variant="primary"
                        onClick={() => setIsEditing(true)}
                        className="me-2 rounded-pill px-4"
                      >
                        <i className="fas fa-edit me-2"></i>
                        Modifier les informations
                      </Button>

                      <Button
                        variant="outline-primary"
                        onClick={async () => {
                          try {
                            await sendPasswordResetEmail(auth, structure.email);
                            setMessage('Email de réinitialisation envoyé');
                          } catch (error) {
                            setMessage('Erreur: ' + error.message);
                          }
                        }}
                        className="rounded-pill px-4"
                      >
                        <i className="fas fa-lock me-2"></i>
                        Réinitialiser le mot de passe
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-mode bg-white rounded shadow-sm p-4">
                    <Form className="structure-edit-form">
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-building me-2"></i>
                              Nom de la structure
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={structure?.name || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, name: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  name: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-envelope me-2"></i>
                              Email
                            </Form.Label>
                            <Form.Control
                              type="email"
                              value={structure?.email || ''}
                              disabled
                              className="bg-light rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-mobile-alt me-2"></i>
                              Téléphone mobile
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={structure?.phones?.mobile || ''}
                              onChange={async (e) => {
                                const updatedStructure = {
                                  ...structure,
                                  phones: {...structure.phones, mobile: e.target.value}
                                };
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  'phones.mobile': e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-phone me-2"></i>
                              Téléphone fixe
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              value={structure?.phones?.landline || ''}
                              onChange={async (e) => {
                                const updatedStructure = {
                                  ...structure,
                                  phones: {...structure.phones, landline: e.target.value}
                                };
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  'phones.landline': e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-calendar-alt me-2"></i>
                              Année de création
                            </Form.Label>
                            <Form.Control
                              type="number"
                              value={structure?.creationYear || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, creationYear: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  creationYear: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>
                              <i className="fas fa-user me-2"></i>
                              Responsable
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={structure?.responsible || ''}
                              onChange={async (e) => {
                                const updatedStructure = {...structure, responsible: e.target.value};
                                await updateDoc(doc(db, 'structures', structure.id), {
                                  responsible: e.target.value
                                });
                                setStructure(updatedStructure);
                              }}
                              className="rounded-pill"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-map-marker-alt me-2"></i>
                          Adresse
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={structure?.address || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, address: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              address: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-globe me-2"></i>
                          Site web
                        </Form.Label>
                        <Form.Control
                          type="url"
                          value={structure?.website || ''}
                          onChange={async (e) => {
                            const updatedStructure = {...structure, website: e.target.value};
                            await updateDoc(doc(db, 'structures', structure.id), {
                              website: e.target.value
                            });
                            setStructure(updatedStructure);
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>

<Form.Group className="mb-4">
  <Form.Label>
    <i className="fas fa-file-medical me-2"></i>
    Assurances acceptées
  </Form.Label>
  <Select
    isMulti
    isCreatable
    name="insurances"
    options={insuranceOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={structure?.insurance?.map(insurance => ({
      value: insurance,
      label: insurance
    })) || []}
    onChange={async (selectedOptions) => {
      const insuranceArray = selectedOptions.map(option => option.value);
      const updatedStructure = { ...structure, insurance: insuranceArray };
      await updateDoc(doc(db, 'structures', structure.id), {
        insurance: insuranceArray
      });
      setStructure(updatedStructure);
    }}
    onCreateOption={async (inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setInsuranceOptions([...insuranceOptions, newOption]);
      const updatedInsurance = [...(structure?.insurance || []), inputValue];
      const updatedStructure = { ...structure, insurance: updatedInsurance };
      await updateDoc(doc(db, 'structures', structure.id), {
        insurance: updatedInsurance
      });
      setStructure(updatedStructure);
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les assurances..."
    noOptionsMessage={() => "Aucune assurance disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
</Form.Group>
                    
<Form.Group className="mb-4">
  <Form.Label>
    <i className="fas fa-stethoscope me-2"></i>
    Spécialités médicales gérées
  </Form.Label>
  <Select
    isMulti
    isCreatable
    name="specialties"
    options={specialtyOptions}
    className="basic-multi-select"
    classNamePrefix="select"
    value={structure?.specialties?.map(specialty => ({
      value: specialty,
      label: specialty
    })) || []}
    onChange={async (selectedOptions) => {
      const specialtiesArray = selectedOptions.map(option => option.value);
      const updatedStructure = { ...structure, specialties: specialtiesArray };
      // Sauvegarder dans Firestore
      await updateDoc(doc(db, 'structures', structure.id), {
        specialties: specialtiesArray
      });
      setStructure(updatedStructure);
    }}
    onCreateOption={async (inputValue) => {
      const newOption = { value: inputValue, label: inputValue };
      setSpecialtyOptions([...specialtyOptions, newOption]);
      const updatedSpecialties = [...(structure?.specialties || []), inputValue];
      const updatedStructure = { ...structure, specialties: updatedSpecialties };
      // Sauvegarder dans Firestore
      await updateDoc(doc(db, 'structures', structure.id), {
        specialties: updatedSpecialties
      });
      setStructure(updatedStructure);
    }}
    formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
    placeholder="Sélectionnez ou saisissez les spécialités..."
    noOptionsMessage={() => "Aucune spécialité disponible"}
    styles={{
      control: (base) => ({
        ...base,
        borderRadius: '0.375rem',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#0d6efd'
        }
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e9ecef',
        borderRadius: '0.25rem'
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: '#495057'
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: '#495057',
        ':hover': {
          backgroundColor: '#dc3545',
          color: 'white'
        }
      })
    }}
  />
</Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>
                          <i className="fas fa-camera me-2"></i>
                          Photo de la structure
                        </Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const photoRef = ref(storage, `structures/${structure.id}/photo`);
                              await uploadBytes(photoRef, file);
                              const photoUrl = await getDownloadURL(photoRef);
                              await updateDoc(doc(db, 'structures', structure.id), {
                                photoUrl: photoUrl
                              });
                              setStructure({...structure, photoUrl: photoUrl});
                            }
                          }}
                          className="rounded-pill"
                        />
                      </Form.Group>
                    </Form>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="bg-light border-top">
            {isEditing ? (
              <div className="w-100 d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={() => setIsEditing(false)}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-times me-2"></i>
                  Annuler
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage('Modifications enregistrées');
                  }}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-save me-2"></i>
                  Enregistrer
                </Button>
              </div>
            ) : (
              <div className="w-100 text-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-pill px-4"
                >
                  <i className="fas fa-times me-2"></i>
                  Fermer
                </Button>
              </div>
            )}
          </Modal.Footer>

          <style jsx>{`
            .structure-settings-modal .modal-content {
              border-radius: 1rem;
              overflow: hidden;
            }

            .profile-image {
              transition: transform 0.3s ease;
              border: 4px solid #fff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .profile-image:hover {
              transform: scale(1.05);
            }

            .info-section {
              transition: transform 0.2s ease;
            }

            .info-section:hover {
              transform: translateY(-2px);
            }

            .section-title {
              color: #2c3e50;
              font-weight: 600;
            }

            .info-item p {
              margin-bottom: 0.5rem;
              padding: 0.75rem;
              border-radius: 0.5rem;
              background: #f8f9fa;
              transition: background-color 0.2s ease;
            }

            .info-item p:hover {
              background: #e9ecef;
            }

            .structure-edit-form .form-control {
              border: 1px solid #dee2e6;
              padding: 0.75rem 1.25rem;
              transition: all 0.2s ease;
            }

            .structure-edit-form .form-control:focus {
              border-color: #0d6efd;
              box-shadow: 0 0 0 0.25rem rgba(13,110,253,0.15);
            }

            .card {
              transition: transform 0.2s ease;
            }

            .card:hover {
              transform: translateY(-3px);
            }
          `}</style>
        </Modal>

        <Modal 
          show={showAssignedDoctorModal} 
          onHide={() => setShowAssignedDoctorModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-md me-2"></i>
              Médecins et Rendez-vous
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {assignedDoctors.length > 0 ? (
              assignedDoctors.map(doctor => (
                <div key={doctor.id} className="assigned-doctor-info mb-4">
                  <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                    <h5 className="border-bottom pb-2 text-primary">
                      <i className="fas fa-user-md me-2"></i>
                      Dr. {doctor.nom} {doctor.prenom}
                    </h5>
                    <Row>
                      <Col md={6}>
                        <p><strong>Spécialité:</strong> {doctor.specialite}</p>
                        <p><strong>Téléphone:</strong> {doctor.telephone}</p>
                        <p><strong>Email:</strong> {doctor.email}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Horaires:</strong> {doctor.heureDebut} - {doctor.heureFin}</p>
                        <p><strong>Jours disponibles:</strong></p>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {doctor.disponibilite?.map(day => (
                            <span key={day} className="badge bg-info">{day}</span>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="appointments-section">
                    <h6 className="text-muted mb-3">Rendez-vous avec ce médecin</h6>
                    {doctorAppointments[doctor.id]?.length > 0 ? (
                      <div className="appointments-list">
                        {doctorAppointments[doctor.id]
                          .sort((a, b) => weekdayOrder[a.day] - weekdayOrder[b.day])
                          .map(apt => (
                            <div key={apt.id} className="appointment-item p-3 mb-2 bg-white rounded border">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="mb-1">
                                    <i className="fas fa-calendar-day me-2 text-primary"></i>
                                    <strong>Jour:</strong> {apt.day}
                                  </p>
                                  <p className="mb-0">
                                    <i className="fas fa-clock me-2 text-primary"></i>
                                    <strong>Heure:</strong> {apt.timeSlot}
                                  </p>
                                </div>
                                <span className={`badge ${apt.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>
                                  {apt.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-muted fst-italic">Aucun rendez-vous programmé</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4">
                <i className="fas fa-user-md fa-3x text-muted mb-3"></i>
                <p>Aucun médecin assigné pour le moment</p>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal 
  show={showDoctorScheduleModal} 
  onHide={() => {
    setShowDoctorScheduleModal(false);
    setSelectedDoctorDetails(null);
  }}
  size="lg"
>
  <Modal.Header closeButton className="bg-primary text-white">
    <Modal.Title>
      <i className="fas fa-calendar-check me-2"></i>
      Rendez-vous du Dr. {selectedDoctorDetails?.nom} {selectedDoctorDetails?.prenom}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="doctor-info mb-4 p-3 bg-light rounded">
      <Row>
        <Col md={6}>
          <p className="mb-2">
            <i className="fas fa-stethoscope me-2 text-primary"></i>
            <strong>Spécialité:</strong> {selectedDoctorDetails?.specialite}
          </p>
        </Col>
        <Col md={6}>
          <p className="mb-2">
            <i className="fas fa-clock me-2 text-primary"></i>
            <strong>Horaires:</strong> {selectedDoctorDetails?.heureDebut} - {selectedDoctorDetails?.heureFin}
          </p>
        </Col>
      </Row>
    </div>

    <div className="d-flex justify-content-between align-items-center mb-4">
      <h6 className="mb-0">Rendez-vous du {selectedDay}</h6>
      <ButtonGroup size="sm">
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => 
              a.timeSlot.localeCompare(b.timeSlot)
            );
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-clock me-2"></i>
          Par heure
        </Button>
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
              const patientA = patients.find(p => p.id === a.patientId)?.nom;
              const patientB = patients.find(p => p.id === b.patientId)?.nom;
              return patientA?.localeCompare(patientB);
            });
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-user me-2"></i>
          Par patient
        </Button>
        <Button 
          variant="outline-primary"
          onClick={() => {
            const sorted = [...selectedDoctorDetails.appointments].sort((a, b) => {
              if (a.status === 'completed' && b.status !== 'completed') return 1;
              if (a.status !== 'completed' && b.status === 'completed') return -1;
              return 0;
            });
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: sorted
            });
          }}
        >
          <i className="fas fa-tasks me-2"></i>
          Par statut
        </Button>
      </ButtonGroup>
    </div>
    
    <div className="appointments-list">
    {selectedDoctorDetails?.appointments?.length > 0 ? (
  <div className="list-group">
    {selectedDoctorDetails.appointments.map((apt, index) => {
      const patient = patients.find(p => p.id === apt.patientId);
      return (
        <div 
          key={apt.id} 
          className="list-group-item list-group-item-action appointment-item"
        >
          <div className="d-flex justify-content-between align-items-start">
            <div className="me-3">
              <span className="badge bg-primary rounded-circle">
                {apt.orderNumber || index + 1}
              </span>
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold text-primary">
                <i className="fas fa-clock me-2"></i>
                {apt.timeSlot}
              </div>
              <div className="mt-2">
                <div className="fw-bold">{patient?.nom} {patient?.prenom}</div>
                <small className="text-muted">
                  <i className="fas fa-phone me-2"></i>
                  {patient?.telephone}
                </small>
                {lastReorganization[apt.id] && (
                  <div className="mt-1">
                    <small className="text-muted fst-italic">
                      <i className="fas fa-history me-1"></i>
                      Dernière modification: {lastReorganization[apt.id]}
                    </small>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Badge 
                bg={apt.status === 'completed' ? 'success' : 'warning'}
                className="rounded-pill"
              >
                {apt.status === 'completed' ? 'Terminé' : 'En attente'}
              </Badge>
              <ButtonGroup vertical size="sm">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="btn-icon"
                  onClick={() => moveAppointment(apt.id, 'up')}
                  disabled={index === 0}
                >
                  <i className="fas fa-arrow-up"></i>
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  className="btn-icon"
                  onClick={() => moveAppointment(apt.id, 'down')}
                  disabled={index === selectedDoctorDetails.appointments.length - 1}
                >
                  <i className="fas fa-arrow-down"></i>
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      );
    })}
  </div>
) : (
  <div className="text-center py-4">
    <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
    <p className="text-muted">Aucun rendez-vous programmé pour ce jour</p>
  </div>
)}
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowDoctorScheduleModal(false)}>
      Fermer
    </Button>
  </Modal.Footer>
</Modal>

<style jsx>{`

.badge.rounded-circle {
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.appointment-item {
  transition: all 0.2s ease;
}

.appointment-item:hover {
  transform: translateX(5px);
  background-color: #f8f9fa;
}

.appointment-item .text-muted small {
  font-size: 0.85em;
}

.appointment-item .history-info {
  font-size: 0.8em;
  color: #6c757d;
}
  .cursor-pointer:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  .appointments-list {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 5px;
  }
  
  .appointment-item {
    transition: transform 0.2s;
    border: 1px solid rgba(0,0,0,.125);
    margin-bottom: 0.5rem;
  }
  
  .appointment-item:hover {
    transform: translateX(5px);
    background-color: #f8f9fa;
  }

  .btn-icon {
    padding: 0.2rem 0.4rem;
  }

  .list-group-item {
    border-left: 4px solid transparent;
  }

  .list-group-item:hover {
    border-left-color: #0d6efd;
  }
`}</style>

<Modal show={showQRModal} onHide={() => setShowQRModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Code QR d'inscription</Modal.Title>
  </Modal.Header>
  <Modal.Body className="text-center">
    <QRCodeSVG 
      value={`${window.location.origin}/qr-register/${structure?.id}`}
      size={256}
      level="H"
    />
    <p className="mt-3">
      Scannez ce code QR pour permettre aux médecins et patients de s'inscrire directement dans votre structure.
    </p>
  </Modal.Body>
</Modal>

      </Container>
    );
  };

  export default StructuresDashboard;


  {/*Medecins  */}



  {/*Patients */}


