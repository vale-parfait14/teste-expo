///Partie structure
// Ajoutez cette ligne en haut de votre fichier
import React, { useContext, useState, useEffect } from 'react';
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
import { useAuth } from '../contexts/AuthContext.js';

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




  // Fonction utilitaire pour formater les dates Firestore de manière sécurisée
const formatFirestoreDate = (firestoreDate) => {
  if (!firestoreDate) return null;
  
  try {
    // Vérifier si c'est un timestamp Firestore
    if (firestoreDate && typeof firestoreDate === 'object' && typeof firestoreDate.toDate === 'function') {
      return firestoreDate.toDate();
    }
    
    // Sinon, essayer de créer une date à partir de la valeur
    return new Date(firestoreDate);
  } catch (error) {
    console.error('Erreur lors de la conversion de date:', error);
    return new Date(); // Valeur par défaut
  }
};





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
const { currentUser } = useAuth();
const [showNotesModal, setShowNotesModal] = useState(false);
const [currentRequestType, setCurrentRequestType] = useState(''); // 'patient', 'consultation', 'appointment'
const [currentRequestId, setCurrentRequestId] = useState(null);
const [rejectNote, setRejectNote] = useState('');
const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
const [selectedRequest, setSelectedRequest] = useState(null);


const [showAddToStructureModal, setShowAddToStructureModal] = useState(false);
const [showStructureSearchModal, setShowStructureSearchModal] = useState(false);
const [structures, setStructures] = useState([]);
const [selectedStructure, setSelectedStructure] = useState(null);
const [searchStructureQuery, setSearchStructureQuery] = useState('');
const [loadingStructures, setLoadingStructures] = useState(true);
const [showStructureListModal, setShowStructureListModal] = useState(false);
// Ajoutez cet état dans le composant StructuresDashboard
const [patientRequests, setPatientRequests] = useState([]);
const [consultationRequests, setConsultationRequests] = useState([]);
const [appointmentRequests, setAppointmentRequests] = useState([]);


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


// Fonction pour ouvrir la modale de notes lors du refus
const openRejectNoteModal = (requestId, type) => {
  setCurrentRequestId(requestId);
  setCurrentRequestType(type);
  setRejectNote('');
  setShowNotesModal(true);
};

// Fonction pour soumettre le refus avec note
const handleRejectWithNote = () => {
  if (currentRequestType === 'patient') {
    const request = patientRequests.find(req => req.id === currentRequestId);
    handlePatientRequest(currentRequestId, false, rejectNote, request?.patientInfo);
  } else if (currentRequestType === 'consultation') {
    handleConsultationRequest(currentRequestId, false, rejectNote);
  } else if (currentRequestType === 'appointment') {
    handleAppointmentRequest(currentRequestId, false, rejectNote);
  }
  setShowNotesModal(false);
};



const viewRequestDetails = (request, type) => {
  // Formater les dates de manière sécurisée
  const formattedRequest = { ...request, type };
  
  if (request.requestDate) {
    formattedRequest.requestDateFormatted = formatFirestoreDate(request.requestDate);
  }
  
  setSelectedRequest(formattedRequest);
  setShowRequestDetailsModal(true);
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

  // Real-time consultation requests listener
const consultationRequestsUnsubscribe = onSnapshot(
  query(
    collection(db, 'consultationRequests'),
    where('structureId', '==', structureData.id),
    where('status', '==', 'pending')
  ),
  (snapshot) => {
    const requestsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setConsultationRequests(requestsData);
  }
);

// Real-time appointment requests listener
const appointmentRequestsUnsubscribe = onSnapshot(
  query(
    collection(db, 'appointmentRequests'),
    where('structureId', '==', structureData.id),
    where('status', '==', 'pending')
  ),
  (snapshot) => {
    const requestsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAppointmentRequests(requestsData);
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
    consultationRequestsUnsubscribe();
appointmentRequestsUnsubscribe();

  };

}, [navigate, selectedDoctor]);


// D'abord, ajoutez cette fonction utilitaire
const cleanForFirestore = (obj) => {
  // Si null ou undefined, retourner null (valeur acceptée par Firestore)
  if (obj == null) return null;
  
  // Si c'est un tableau, nettoyer chaque élément
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  
  // Si ce n'est pas un objet, le retourner tel quel
  if (typeof obj !== 'object') return obj;
  
  const clean = {};
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      // Si c'est un objet imbriqué, le nettoyer récursivement
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        clean[key] = cleanForFirestore(obj[key]);
      } else {
        clean[key] = obj[key];
      }
    }
  });
  
  return clean;
};

// Fonction améliorée pour gérer les demandes de patients
const handlePatientRequest = async (requestId, patientInfo, accepted, notes = '') => {
  try {
    const requestRef = doc(db, 'structureRequests', requestId);
    
    if (accepted) {
      // Créer un nouvel utilisateur patient
      let patientData = cleanForFirestore({
        ...patientInfo,
        structures: [structure.id],
        visibility: 'affiliated',
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      
      // Ajouter le patient à la collection patients
      const patientRef = await addDoc(collection(db, 'patients'), patientData);
      
      // Mettre à jour la demande avec commentaire
      await updateDoc(requestRef, cleanForFirestore({
        status: 'accepted',
        acceptedDate: new Date().toISOString(),
        patientDocId: patientRef.id,
        notes: notes,
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Ajouter le patient au tableau local
      const newPatient = { id: patientRef.id, ...patientData };
      setPatients(prevPatients => [...prevPatients, newPatient]);
      
      // Créer une notification pour le patient
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: patientInfo.id,
        type: 'request_accepted',
        title: 'Demande acceptée',
        message: `Votre demande d'affiliation à ${structure.name} a été acceptée.`,
        structureId: structure.id,
        structureName: structure.name,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Patient ajouté avec succès');
    } else {
      // Refuser la demande avec commentaire
      await updateDoc(requestRef, cleanForFirestore({
        status: 'rejected',
        rejectionDate: new Date().toISOString(),
        notes: notes,
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Créer une notification pour le patient
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: patientInfo.id,
        type: 'request_rejected',
        title: 'Demande refusée',
        message: `Votre demande d'affiliation à ${structure.name} a été refusée.`,
        structureId: structure.id,
        structureName: structure.name,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Demande refusée');
    }
    
    // Retirer la demande de la liste
    setPatientRequests(prev => prev.filter(req => req.id !== requestId));
    
  } catch (error) {
    console.error('Erreur lors du traitement de la demande:', error);
    setMessage('Erreur lors du traitement de la demande');
  }
};



// Fonction pour gérer les demandes de consultation
const handleConsultationRequest = async (requestId, accepted, notes = '') => {
  try {
    const requestRef = doc(db, 'consultationRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    const requestData = requestDoc.data();
    
    if (accepted) {
      // Créer une consultation
      const consultationData = cleanForFirestore({
        patientId: requestData.patientId,
        doctorId: requestData.doctorId,
        structureId: structure.id,
        date: requestData.preferredDate || new Date().toISOString(),
        reason: requestData.reason,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        notes: notes
      });
      
      // Ajouter à la collection consultations
      const consultationRef = await addDoc(collection(db, 'consultations'), consultationData);
      
      // Mettre à jour la demande
      await updateDoc(requestRef, cleanForFirestore({
        status: 'accepted',
        acceptedDate: new Date().toISOString(),
        consultationId: consultationRef.id,
        notes: notes,
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Créer une notification
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: requestData.patientId,
        type: 'consultation_accepted',
        title: 'Demande de consultation acceptée',
        message: `Votre demande de consultation à ${structure.name} a été acceptée.`,
        structureId: structure.id,
        structureName: structure.name,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Consultation programmée avec succès');
    } else {
      // Refuser la demande
      await updateDoc(requestRef, cleanForFirestore({
        status: 'rejected',
        rejectionDate: new Date().toISOString(),
        notes: notes,
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Créer une notification
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: requestData.patientId,
        type: 'consultation_rejected',
        title: 'Demande de consultation refusée',
        message: `Votre demande de consultation à ${structure.name} a été refusée.`,
        structureId: structure.id,
        structureName: structure.name,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Demande de consultation refusée');
    }
    
    // Retirer la demande de la liste
    setConsultationRequests(prev => prev.filter(req => req.id !== requestId));
    
  } catch (error) {
    console.error('Erreur lors du traitement de la demande de consultation:', error);
    setMessage('Erreur lors du traitement de la demande');
  }
};

// Fonction pour gérer les demandes de rendez-vous
const handleAppointmentRequest = async (requestId, accepted, notes = '') => {
  try {
    const requestRef = doc(db, 'appointmentRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    const requestData = requestDoc.data();
    
    if (accepted) {
      // Extraire les informations du texte récapitulatif
      const requestText = requestData.requestText || '';
      
      // Créer un rendez-vous
      const appointmentData = cleanForFirestore({
        patientId: requestData.patientId,
        patientName: `${requestData.patientInfo?.nom || ''} ${requestData.patientInfo?.prenom || ''}`,
        doctorId: requestData.doctorId,
        structureId: structure.id,
        structureName: structure.name,
        specialty: requestData.specialty,
        requestText: requestText,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        notes: typeof notes === 'string' ? notes : '',
        orderNumber: typeof notes === 'object' && notes.orderNumber ? notes.orderNumber : 0
      });
      
      // Ajouter à la collection appointments
      const appointmentRef = await addDoc(collection(db, 'appointments'), appointmentData);
      
      // Mettre à jour la demande
      await updateDoc(requestRef, cleanForFirestore({
        status: 'accepted',
        acceptedDate: new Date().toISOString(),
        appointmentId: appointmentRef.id,
        notes: typeof notes === 'string' ? notes : '',
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Créer une notification pour le patient
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: requestData.patientId,
        type: 'appointment_accepted',
        title: 'Demande de rendez-vous acceptée',
        message: `Votre demande de rendez-vous à ${structure.name} a été acceptée.`,
        structureId: structure.id,
        structureName: structure.name,
        appointmentId: appointmentRef.id,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Rendez-vous programmé avec succès');
    } else {
      // Refuser la demande
      await updateDoc(requestRef, cleanForFirestore({
        status: 'rejected',
        rejectionDate: new Date().toISOString(),
        notes: typeof notes === 'string' ? notes : '',
        respondedBy: {
          userId: currentUser?.uid,
          name: currentUser?.displayName || 'Administrateur',
          timestamp: new Date().toISOString()
        }
      }));
      
      // Créer une notification pour le patient
      await addDoc(collection(db, 'notifications'), cleanForFirestore({
        userId: requestData.patientId,
        type: 'appointment_rejected',
        title: 'Demande de rendez-vous refusée',
        message: `Votre demande de rendez-vous à ${structure.name} a été refusée.${notes ? ' Motif: ' + notes : ''}`,
        structureId: structure.id,
        structureName: structure.name,
        read: false,
        createdAt: new Date().toISOString()
      }));
      
      setMessage('Demande de rendez-vous refusée');
    }
    
    // Retirer la demande de la liste
    setAppointmentRequests(prev => prev.filter(req => req.id !== requestId));
    
  } catch (error) {
    console.error('Erreur lors du traitement de la demande de rendez-vous:', error);
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
<div className="ms-3 d-flex gap-2">
  {patientRequests.length > 0 && (
    <Badge bg="info" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-user-plus me-2"></i>
      {patientRequests.length} demande(s) d'affiliation
    </Badge>
  )}
  {consultationRequests.length > 0 && (
    <Badge bg="danger" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-stethoscope me-2"></i>
      {consultationRequests.length} demande(s) de consultation
    </Badge>
  )}
  {appointmentRequests.length > 0 && (
    <Badge bg="primary" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-calendar-alt me-2"></i>
      {appointmentRequests.length} demande(s) de RDV
    </Badge>
  )}
</div>

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
<div className="ms-3 d-flex gap-2">
  {patientRequests.length > 0 && (
    <Badge bg="info" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-user-plus me-2"></i>
      {patientRequests.length} demande(s) d'affiliation
    </Badge>
  )}
  {consultationRequests.length > 0 && (
    <Badge bg="danger" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-stethoscope me-2"></i>
      {consultationRequests.length} demande(s) de consultation
    </Badge>
  )}
  {appointmentRequests.length > 0 && (
    <Badge bg="primary" pill className="d-flex align-items-center px-3 py-2">
      <i className="fas fa-calendar-alt me-2"></i>
      {appointmentRequests.length} demande(s) de RDV
    </Badge>
  )}
</div>

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
                    variant="outline-info"
                    size="sm"
                    className="rounded-pill mb-2"
                    onClick={() => viewRequestDetails(request, 'patient')}
                  >
                    <i className="fas fa-info-circle me-1"></i>
                    Détails
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

{/* Section des demandes de consultation */}
{consultationRequests.length > 0 && (
  <Card className="mb-4">
    <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">
        <i className="fas fa-stethoscope me-2"></i>
        Demandes de consultation ({consultationRequests.length})
      </h5>
      <Badge bg="light" text="dark" pill>
        {consultationRequests.length} en attente
      </Badge>
    </Card.Header>
    <Card.Body className="p-0">
      <ListGroup variant="flush">
      {consultationRequests.map(request => (
  <ListGroup.Item key={request.id} className="p-3">
    <Row className="align-items-center">
      <Col md={6}>
        <h6 className="mb-1">
          <i className="fas fa-user me-2"></i>
          {request.patientName || 'Patient'}
        </h6>
        <p className="mb-1 text-muted small">
          <i className="fas fa-calendar-alt me-1"></i>
          Date souhaitée: {
            request.preferredDate ? 
              (typeof request.preferredDate.toDate === 'function' 
                ? new Date(request.preferredDate.toDate()).toLocaleDateString() 
                : new Date(request.preferredDate).toLocaleDateString())
              : 'Non spécifiée'
          }
        </p>
        <p className="mb-0 text-muted small">
          <i className="fas fa-comment me-1"></i>
          Motif: {request.reason || 'Non spécifié'}
        </p>
      </Col>
      <Col md={3}>
        <p className="mb-1">
          <i className="fas fa-user-md me-1"></i>
          <strong>Médecin:</strong> {request.doctorName || 'Non spécifié'}
        </p>
        <p className="mb-0">
          <i className="fas fa-clock me-1"></i>
          <strong>Demandé le:</strong> {
            request.requestDate ? 
              (typeof request.requestDate.toDate === 'function' 
                ? new Date(request.requestDate.toDate()).toLocaleDateString() 
                : new Date(request.requestDate).toLocaleDateString())
              : new Date().toLocaleDateString()
          }
        </p>
      </Col>
              <Col md={3} className="text-end">
                <div className="d-flex flex-column gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => handleConsultationRequest(request.id, true)}
                  >
                    <i className="fas fa-check me-1"></i>
                    Accepter
                  </Button>
                  <Button
  variant="outline-info"
  size="sm"
  className="rounded-pill mb-2"
  onClick={() => viewRequestDetails(request, 'consultation')}
>
  <i className="fas fa-info-circle me-1"></i>
  Détails
</Button>
                </div>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card.Body>
  </Card>
)}

{/* Section des demandes de rendez-vous */}
{appointmentRequests.length > 0 && (
  <Card className="mb-4">
    <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">
        <i className="fas fa-calendar-alt me-2"></i>
        Demandes de rendez-vous ({appointmentRequests.length})
      </h5>
      <Badge bg="light" text="dark" pill>
        {appointmentRequests.length} en attente
      </Badge>
    </Card.Header>
    <Card.Body className="p-0">
      <ListGroup variant="flush">
        {appointmentRequests.map(request => (
          <ListGroup.Item key={request.id} className="p-3">
            <Row className="align-items-center">
              <Col md={6}>
                <h6 className="mb-1">
                  <i className="fas fa-user me-2"></i>
                  {request.patientInfo?.nom 
                    ? `${request.patientInfo.nom} ${request.patientInfo.prenom || ''}`
                    : (request.patientName || 'Patient')}
                </h6>
                <p className="mb-1 text-muted small">
                  <i className="fas fa-calendar-day me-1"></i>
                  Jours préférés: {request.requestText?.includes('Jours préférés') 
                    ? request.requestText.split('Jours préférés:')[1]?.split('\n')[0] 
                    : 'Non spécifié'}
                </p>
                <p className="mb-0 text-muted small">
                  <i className="fas fa-clock me-1"></i>
                  Horaires: {request.requestText?.includes('Horaires préférés') 
                    ? request.requestText.split('Horaires préférés:')[1]?.split('\n')[0] 
                    : 'Non spécifié'}
                </p>
              </Col>
              <Col md={3}>
                <p className="mb-1">
                  <i className="fas fa-stethoscope me-1"></i>
                  <strong>Spécialité:</strong> {request.specialty || 'Non spécifiée'}
                </p>
                <p className="mb-0">
                  <i className="fas fa-clock me-1"></i>
                  <strong>Demandé le:</strong> {
                    request.requestDate ? 
                      (typeof request.requestDate.toDate === 'function' 
                        ? new Date(request.requestDate.toDate()).toLocaleDateString() 
                        : new Date(request.requestDate).toLocaleDateString())
                      : new Date().toLocaleDateString()
                  }
                </p>
              </Col>
              <Col md={3} className="text-end">
                <div className="d-flex flex-column gap-2">
                  
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="rounded-pill mb-2"
                    onClick={() => viewRequestDetails(request, 'appointment')}
                  >
                    <i className="fas fa-info-circle me-1"></i>
                    Détails
                  </Button>
                 


                </div>
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


{/* Modale pour les notes de refus */}
<Modal show={showNotesModal} onHide={() => setShowNotesModal(false)}>
  <Modal.Header closeButton className="bg-danger text-white">
    <Modal.Title>
      <i className="fas fa-comment-slash me-2"></i>
      Motif du refus
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group>
        <Form.Label>Veuillez indiquer le motif du refus :</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Ce motif sera visible par le demandeur"
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
      Annuler
    </Button>
    <Button variant="danger" onClick={handleRejectWithNote}>
      <i className="fas fa-times me-1"></i>
      Confirmer le refus
    </Button>
  </Modal.Footer>
</Modal>

{/* Modale pour les détails d'une demande */}
<Modal 
          show={showRequestDetailsModal} 
          onHide={() => setShowRequestDetailsModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className={`bg-${
            selectedRequest?.type === 'patient' ? 'info' : 
            selectedRequest?.type === 'consultation' ? 'danger' : 'primary'
          } text-white`}>
            <Modal.Title>
              <i className={`fas fa-${
                selectedRequest?.type === 'patient' ? 'user-plus' : 
                selectedRequest?.type === 'consultation' ? 'stethoscope' : 'calendar-alt'
              } me-2`}></i>
              Détails de la demande
            </Modal.Title>
          </Modal.Header>
              <Modal.Body>
                {selectedRequest && (
                  <div className="request-details">
                    {selectedRequest.type === 'patient' && (
                      <>
                        <Row className="mb-4">
                          <Col md={3} className="text-center">
                            {selectedRequest.patientInfo?.photoURL ? (
                              <img 
                                src={selectedRequest.patientInfo.photoURL} 
                                alt="Photo du patient"
                                className="img-fluid rounded-circle mb-2"
                                style={{width: "100px", height: "100px", objectFit: "cover"}}
                              />
                            ) : (
                              <div className="placeholder-avatar bg-light rounded-circle d-flex align-items-center justify-content-center mb-2" style={{width: "100px", height: "100px", margin: "0 auto"}}>
                                <i className="fas fa-user fa-3x text-secondary"></i>
                              </div>
                            )}
                          </Col>
                          <Col md={9}>
                          <p className="mb-1">
                      <strong>Nom:</strong> {
                        selectedRequest.patientInfo?.nom 
                          ? `${selectedRequest.patientInfo.nom} ${selectedRequest.patientInfo.prenom || ''}`
                          : (selectedRequest.patientName || 'Patient')
                      }
                    </p>
                            <p className="text-muted mb-1">
                              <i className="fas fa-birthday-cake me-2"></i>
                              {selectedRequest.patientInfo?.age} ans
                            </p>
                            
                            <p className="text-muted mb-1">
                              <i className="fas fa-venus-mars me-2"></i>
                              {selectedRequest.patientInfo?.sexe}
                            </p>
                            <p className="text-muted mb-1">
                            <i className="fas fa-envelope me-2"></i>
                            {selectedRequest.patientInfo?.email 
                              ? selectedRequest.patientInfo.email
                              : (selectedRequest.patientEmail || 'Email non disponible')}
                          </p>



                <p className="text-muted mb-1">
                  <i className="fas fa-phone me-2"></i>
                  {selectedRequest.patientInfo?.telephone}
                </p>
              </Col>
            </Row>
            <hr />
            <h6 className="mb-3">
              <i className="fas fa-file-medical me-2"></i>
              Informations médicales
            </h6>
            <Row className="mb-3">
              <Col md={6}>
                <p className="mb-2">
                  <strong>Assurances:</strong>
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {selectedRequest.patientInfo?.insurances?.map((insurance, idx) => (
                    <Badge key={idx} bg="light" text="dark">{insurance}</Badge>
                  ))}
                </div>
              </Col>
              <Col md={6}>
                <p className="mb-2">
                  <strong>Date de la demande:</strong>
                </p>
                <p>{new Date(selectedRequest.requestDate?.toDate()).toLocaleDateString()}</p>
              </Col>
            </Row>
            {selectedRequest.documents && selectedRequest.documents.length > 0 && (
              <div className="mt-3">
                <h6 className="mb-3">
                  <i className="fas fa-file-medical-alt me-2"></i>
                  Documents fournis
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {selectedRequest.documents.map((doc, idx) => (
                    <Button 
                      key={idx}
                      variant="outline-primary"
                      size="sm"
                      onClick={() => window.open(doc, '_blank')}
                    >
                      <i className="fas fa-file me-2"></i>
                      Document {idx + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

  {selectedRequest.type === 'consultation' && (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <h6 className="mb-3">
                  <i className="fas fa-user me-2"></i>
                  Informations du patient
                </h6>
                <p className="mb-1">
                  <strong>Nom:</strong> {selectedRequest.patientName}
                </p>
                <p className="mb-1">
                  <strong>ID Patient:</strong> {selectedRequest.patientId}
                </p>
                <p className="mb-1">
                  <strong>Date souhaitée:</strong> {
                    selectedRequest.preferredDateFormatted 
                      ? selectedRequest.preferredDateFormatted.toLocaleDateString() 
                      : 'Non spécifiée'
                  }
                </p>
                      </Col>
              <Col md={6}>
                <h6 className="mb-3">
                  <i className="fas fa-user-md me-2"></i>
                  Informations du médecin
                </h6>
                <p className="mb-1">
                  <strong>Nom:</strong> {selectedRequest.doctorName}
                </p>
                <p className="mb-1">
                  <strong>ID Médecin:</strong> {selectedRequest.doctorId}
                </p>
               {/* Exemple de rendu sécurisé d'une date */}
               <p className="mb-1">
            <strong>Date de la demande:</strong> {
              selectedRequest?.requestDate ? 
                (typeof selectedRequest.requestDate.toDate === 'function' 
                  ? new Date(selectedRequest.requestDate.toDate()).toLocaleDateString() 
                  : new Date(selectedRequest.requestDate).toLocaleDateString())
                : 'Non spécifiée'
            }
          </p>


              </Col>
            </Row>
            <hr />
            <h6 className="mb-3">
              <i className="fas fa-comment-medical me-2"></i>
              Motif de la consultation
            </h6>
            <div className="p-3 bg-light rounded">
              {selectedRequest.reason || 'Aucun motif spécifié'}
            </div>
            {selectedRequest.additionalInfo && (
              <div className="mt-3">
                <h6 className="mb-3">
                  <i className="fas fa-info-circle me-2"></i>
                  Informations complémentaires
                </h6>
                <div className="p-3 bg-light rounded">
                  {selectedRequest.additionalInfo}
                </div>
              </div>
            )}
          </>
  )}

{selectedRequest.type === 'appointment' && (
  <>
    <Row className="mb-4">
      <Col md={6}>
        <h6 className="mb-3">
          <i className="fas fa-user me-2"></i>
          Informations du patient
        </h6>
        <p className="mb-1">
          <strong>Nom:</strong> {selectedRequest.patientInfo?.nom} {selectedRequest.patientInfo?.prenom}
        </p>
        <p className="mb-1">
          <strong>Email:</strong> {selectedRequest.patientInfo?.email}
        </p>
        <p className="mb-1">
          <strong>Téléphone:</strong> {selectedRequest.patientInfo?.telephone}
        </p>
      </Col>
      <Col md={6}>
        <h6 className="mb-3">
          <i className="fas fa-stethoscope me-2"></i>
          Détails de la demande
        </h6>
        <p className="mb-1">
          <strong>Spécialité:</strong> {selectedRequest.specialty}
        </p>
        <p className="mb-1">
          <strong>Date de la demande:</strong> {
            selectedRequest.requestDateFormatted 
              ? selectedRequest.requestDateFormatted.toLocaleDateString() 
              : 'Non spécifiée'
          }
        </p>
      </Col>
    </Row>
    <hr />
    <h6 className="mb-3">
      <i className="fas fa-comment-medical me-2"></i>
      Récapitulatif de la demande
    </h6>
    <div className="p-3 bg-light rounded">
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {selectedRequest.requestText || 'Aucun détail fourni'}
      </pre>
    </div>
  </>
)}

                </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRequestDetailsModal(false)}>
            Fermer
          </Button>
          {selectedRequest && (
            <>
        <Button 
          variant="success" 
          onClick={() => {
            if (selectedRequest.type === 'patient') {
              handlePatientRequest(selectedRequest.id, true, '', selectedRequest.patientInfo);
            } else if (selectedRequest.type === 'consultation') {
              handleConsultationRequest(selectedRequest.id, true);
            } else if (selectedRequest.type === 'appointment') {
              handleAppointmentRequest(selectedRequest.id, true, {
                day: selectedRequest.day,
                timeSlot: selectedRequest.timeSlot
              });
            }
            setShowRequestDetailsModal(false);
          }}
        >
          <i className="fas fa-check me-1"></i>
          Accepter
        </Button>
        <Button 
          variant="danger" 
          onClick={() => {
            openRejectNoteModal(selectedRequest.id, selectedRequest.type);
            setShowRequestDetailsModal(false);
          }}
        >
          <i className="fas fa-times me-1"></i>
          Refuser
        </Button>
      </>
    )}
  </Modal.Footer>

</Modal>



<style jsx>
      {`

        .request-card {
        transition: transform 0.2s ease;
        border-left: 4px solid transparent;
      }

      .request-card:hover {
        transform: translateX(5px);
        border-left-color: #0d6efd;
      }

      .request-card.patient-request:hover {
        border-left-color: #17a2b8;
      }

      .request-card.consultation-request:hover {
        border-left-color: #dc3545;
      }

      .request-card.appointment-request:hover {
        border-left-color: #0d6efd;
      }

      .badge-counter {
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
      }

      .request-details .form-control:disabled {
        background-color: #f8f9fa;
        opacity: 1;
      }

      .request-details hr {
        margin: 1.5rem 0;
        opacity: 0.15;
      }

      .request-details h6 {
        color: #495057;
        font-weight: 600;
      }

      .placeholder-avatar {
        background-color: #f8f9fa;
      }

      `}
</style>


  </Container>
);
};

export default StructuresDashboard;

//2


<Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-hospital me-2"></i>
          Rechercher une structure médicale
        </Modal.Title>
      </Modal.Header>
  
      <Modal.Body className="bg-light p-4">
        <Form>
          {message && (
            <Alert 
              variant={message.includes('succès') ? 'success' : 'danger'}
              dismissible
              onClose={() => setMessage('')}
            >
              {message}
            </Alert>
          )}
  
          {/* Step 1: Structure Selection */}
          {step === 1 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-hospital me-2"></i>
                    Sélectionner une structure
                  </Form.Label>
                  <div className="structures-grid">
                    {structures.map(structure => (
                      <Card 
                        key={structure.id}
                        className={`mb-3 cursor-pointer ${selectedStructure?.id === structure.id ? 'border-primary' : ''}`}
                        onClick={() => handleStructureSelect(structure)}
                      >
                        <Card.Body>
                          <h6>{structure.name}</h6>
                          <p className="text-muted small mb-2">
                            <i className="fas fa-map-marker-alt me-2"></i>
                            {structure.address}
                          </p>
                          {structure.insurance && (
                            <div className="d-flex flex-wrap gap-1">
                              {structure.insurance.map((ins, index) => (
                                <Badge 
                                  key={index}
                                  bg={patient?.insurances?.includes(ins) ? 'success' : 'secondary'}
                                  className="rounded-pill"
                                >
                                  {ins}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
  
          {/* Step 2: Doctor Selection */}
          {step === 2 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-user-md me-2"></i>
                    Sélectionner un médecin
                  </Form.Label>
                  <div className="doctors-grid">
                    {doctors.map(doctor => (
                      <Card 
                        key={doctor.id}
                        className={`mb-3 cursor-pointer ${selectedDoctor?.id === doctor.id ? 'border-primary' : ''}`}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <Card.Body>
                          <h6>Dr. {doctor.nom} {doctor.prenom}</h6>
                          <p className="text-muted small mb-2">
                            <i className="fas fa-stethoscope me-2"></i>
                            {doctor.specialite}
                          </p>
                          <div className="d-flex flex-wrap gap-1 mb-2">
                      {doctor.insurances?.map((insurance, index) => (
                        <Badge 
                          key={index}
                          bg="info"
                          className="rounded-pill"
                        >
                          <i className="fas fa-shield-alt me-1"></i>
                          {insurance}
                        </Badge>
                      ))}
                      {(!doctor.insurances || doctor.insurances.length === 0) && (
                        <Badge 
                          bg="warning"
                          className="rounded-pill"
                        >
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Aucune assurance
                        </Badge>
                      )}
                    </div>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {doctor.disponibilite?.map(day => (
                              <Badge key={day} bg="light" text="dark" className="border">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          )}
  
          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Détails du rendez-vous
                  </Form.Label>
                  
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Jour</Form.Label>
                        <Form.Select
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(e.target.value)}
                          className="rounded-pill"
                        >
                          <option value="">Sélectionnez un jour</option>
                          {selectedDoctor?.disponibilite?.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Horaire</Form.Label>
                        <Form.Select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="rounded-pill"
                        >
                          <option value="">Sélectionnez un horaire</option>
                          {availableTimeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
  
                  <Form.Group>
                    <Form.Label>Motif de la consultation</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={consultationReason}
                      onChange={(e) => setConsultationReason(e.target.value)}
                      placeholder="Décrivez brièvement le motif de votre consultation..."
                    />
                  </Form.Group>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Form>
      </Modal.Body>
  
      <Modal.Footer className="bg-light border-top">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div className="steps-indicator">
              Étape {step}/3
            </div>
            <div className="d-flex gap-2">
              {step > 1 && (
                <Button
                  variant="outline-secondary"
                  onClick={() => setStep(step - 1)}
                  className="rounded-pill"
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Retour
                </Button>
              )}
              {step < 3 ? (
                <Button 
                  variant="primary"
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !selectedStructure) || (step === 2 && !selectedDoctor)}
                  className="rounded-pill"
                >
                  Suivant
                  <i className="fas fa-arrow-right ms-1"></i>
                </Button>
              ) : (
                <Button 
                  variant="success"
                  onClick={handleSubmit}
                  disabled={!selectedDay || !selectedTimeSlot || !consultationReason}
                  className="rounded-pill"
                >
                  <i className="fas fa-check me-1"></i>
                  Confirmer la demande
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal.Footer>
//1
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













///Partie medecin


import React, { useState, useEffect } from "react";
  import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Table,
    Alert,
    Modal,
    Form,
    ButtonGroup,
    Badge,
    Collapse,
    ListGroup,
    Dropdown,
    InputGroup
  } from "react-bootstrap";
  import { useNavigate } from "react-router-dom";
  import { db, storage ,auth} from "../components/firebase-config.js";
  import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    updateDoc,
    addDoc,
    setDoc,
    onSnapshot,
    writeBatch,
    arrayRemove
  } from "firebase/firestore";
  import {
    FaCheck, FaRedo, FaCalendarCheck ,
    FaEnvelope,
    FaInfoCircle,
    FaClock,
    FaUser,
    FaPhone,
    FaVideo,
    FaComment,
    FaCalendarAlt,
    FaUserMd,
    FaHospital,
    FaEdit,
    FaTrash,
    FaSignOutAlt,
    FaSearch,
    FaCalendar,
    FaTimes,
    FaEye
  } from "react-icons/fa";
  import { createUserWithEmailAndPassword, getAuth ,signOut, deleteUser} from "firebase/auth";
  import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
  // Add to existing imports
  import MessageriesPatients from "./MessageriesPatients.js";
  import { useAuth } from '../contexts/AuthContext.js';
  import { QRCodeCanvas } from 'qrcode.react';


  const MedecinsDashboard = () => {
    const navigate = useNavigate();
    const [patientsData, setPatientsData] = useState({});
    const [structuresInfo, setStructuresInfo] = useState({});
    const [appointment, setAppointment] = useState([]);
    
    const [showPatientFiles, setShowPatientFiles] = useState(false);
    const [doctorData, setDoctorData] = useState([]);
    const { currentUser } = useAuth();

    const [structurePatients, setStructurePatients] = useState([]);
    const [privatePatients, setPrivatePatients] = useState([]);
    const [appointments, setAppointments] = useState([]);

// Modifier la fonction fetchAppointments dans le useEffect correspondant
useEffect(() => {
  const fetchAppointments = async () => {
    const appointmentsRef = collection(db, 'appointments');
    const querySnapshot = await getDocs(appointmentsRef);
    const appointmentsData = [];
    
    for (const doc of querySnapshot.docs) {
      const appointmentData = { id: doc.id, ...doc.data() };
      
      // Récupérer les informations du patient
      if (appointmentData.patientId && patientsData[appointmentData.patientId]) {
        const patientInfo = patientsData[appointmentData.patientId];
        appointmentData.patientName = `${patientInfo.nom} ${patientInfo.prenom}`;
        
        // Ajouter les informations de la structure si le patient est assigné par une structure
        if (patientInfo.structureId && structuresInfo[patientInfo.structureId]) {
          appointmentData.structureName = structuresInfo[patientInfo.structureId].nom;
        }
      }
      
      appointmentsData.push(appointmentData);
    }
    
    setAppointments(appointmentsData);
  };

  if (Object.keys(patientsData).length > 0 && Object.keys(structuresInfo).length > 0) {
    fetchAppointments();
  }
}, [patientsData, structuresInfo]);

    const [message, setMessage] = useState("");
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [newAppointmentDate, setNewAppointmentDate] = useState("");
    const [newAppointmentTime, setNewAppointmentTime] = useState("");
    const [emailContent, setEmailContent] = useState("");
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [patientPhotoFile, setPatientPhotoFile] = useState(null);
    const [selectedDays, setSelectedDays] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [viewMode, setViewMode] = useState("both"); // 'private', 'structure', 'both'
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extensionDays, setExtensionDays] = useState("");
    const [extensionTime, setExtensionTime] = useState("");
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editedDoctorInfo, setEditedDoctorInfo] = useState(null);
    const [patientDocs, setPatientDocs] = useState([]);
    const [showDocumentPreviewModal, setShowDocumentPreviewModal] =
      useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
// Ajouter avec les autres états au début du composant
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [availableStructures, setAvailableStructures] = useState([]);
    const [selectedStructures, setSelectedStructures] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editedPatientInfo, setEditedPatientInfo] = useState(null);

// Ajoutez cette fonction useEffect pour charger les données des patients
useEffect(() => {
  const fetchPatientsData = async () => {
    const querySnapshot = await getDocs(collection(db, 'patients'));
    const patientsObject = {};
    
    querySnapshot.forEach((doc) => {
      patientsObject[doc.id] = { id: doc.id, ...doc.data() };
    });
    
    setPatientsData(patientsObject);
  };

  fetchPatientsData();
}, []);

// Dans le rendu, remplacez la ligne existante par
const patient = patientsData[appointment.patientId];

    const [viewType, setViewType] = useState("grid");
    const [showProfInfo, setShowProfInfo] = useState(false);
    const [showCompletedPatients, setShowCompletedPatients] = useState(false);
    const [showCompletedAndArchived, setShowCompletedAndArchived] =
      useState(false);
      const [patients, setPatients] = useState([]);
     
      
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
    const [selectedPatientForNotes, setSelectedPatientForNotes] = useState(null);
    const [noteContent, setNoteContent] = useState("");
    const [noteFiles, setNoteFiles] = useState([]);
    const [patientNotes, setPatientNotes] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);

// Add this before the return statement
const appointmentsByDay = appointments.reduce((groups, apt) => {
  if (!groups[apt.day]) {
    groups[apt.day] = [];
  }
  groups[apt.day].push(apt);
  return groups;
}, {});

    const [showFilePreview, setShowFilePreview] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const [editingNote, setEditingNote] = useState(null);
    const [editedNoteContent, setEditedNoteContent] = useState("");

    const [consultationSummaries, setConsultationSummaries] = useState({});
    const [showDoctorAssociationModal, setShowDoctorAssociationModal] =
      useState(false);
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [doctorAssociations, setDoctorAssociations] = useState([]);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
    const [showPatientInfoModal, setShowPatientInfoModal] = useState(false);
    const [medicalDocs, setMedicalDocs] = useState([]);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    // Ajoutez ces états
    const [consultationRequests, setConsultationRequests] = useState([]);
    const [showConsultationRequestsModal, setShowConsultationRequestsModal] =
      useState(false);

    const [pendingDoctorRequests, setPendingDoctorRequests] = useState([]);
    // Add to existing state declarations
    const [showMessagerieModal, setShowMessagerieModal] = useState(false);
    const [sharedPatients, setSharedPatients] = useState([]);

    const handlePinPatient = (patient) => {
      const isPinned = pinnedPatients.find((p) => p.id === patient.id);
      if (isPinned) {
        const newPinnedPatients = pinnedPatients.filter(
          (p) => p.id !== patient.id
        );
        setPinnedPatients(newPinnedPatients);
        localStorage.setItem("pinnedPatients", JSON.stringify(newPinnedPatients));
      } else {
        const newPinnedPatients = [...pinnedPatients, patient];
        setPinnedPatients(newPinnedPatients);
        localStorage.setItem("pinnedPatients", JSON.stringify(newPinnedPatients));
      }
    };

    const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [assignedPatients, setAssignedPatients] = useState([]);


    const [pinnedPatients, setPinnedPatients] = useState(() => {
      const saved = localStorage.getItem("pinnedPatients");
      return saved ? JSON.parse(saved) : [];
    });

    const [newPatient, setNewPatient] = useState({
      nom: "",
      prenom: "",
      age: "",
      sexe: "",
      telephone: "",
      email: "",
      password: "",
      photo: null,
      visibility: "private",
      medecinId: null,
      heureDebut: "",
      heureFin: "",
      joursDisponibles: [],
      consultationDuration: 30,
      status: "En attente" // Add this line
    });

    const handleViewPatientDetails = async (patient) => {
      setSelectedPatient(patient);

      // Récupérer les documents du patient
      const patientRef = doc(db, "patients", patient.id);
      const patientDoc = await getDoc(patientRef);
      const documents = patientDoc.data().documents || [];
      setPatientDocs(documents);

      setShowPatientDetailsModal(true);
    };

    const sharePatientWithDoctor = async (patient, targetDoctorId) => {
      try {
        // Get all patient notes
        const notesQuery = query(
          collection(db, "patientNotes"),
          where("patientId", "==", patient.id)
        );
        const notesSnapshot = await getDocs(notesQuery);
        const patientNotes = notesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          files: doc.data().files || [] // S'assurer que les fichiers sont inclus
        }));

        // Créer une copie des notes pour le médecin destinataire
        for (const note of patientNotes) {
          await addDoc(collection(db, "patientNotes"), {
            ...note,
            originalNoteId: note.id,
            sharedBy: doctorInfo.id,
            sharedAt: new Date().toISOString(),
            targetDoctorId: targetDoctorId
          });
        }

        // Get all appointments
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("patientId", "==", patient.id)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const patientAppointments = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        const sharedPatientData = {
          patientId: patient.id,
          sourceDoctorId: doctorInfo.id,
          targetDoctorId: targetDoctorId,
          sharedAt: new Date().toISOString(),
          patientData: {
            ...patient,
            notes: patientNotes,
            appointments: patientAppointments,
            sharedFrom: doctorInfo.id,
            originalStatus: patient.status,
            consultationSummaries: consultationSummaries[patient.id] || [],
            appointmentSettings: patient.appointmentSettings || {},
            joursDisponibles: patient.joursDisponibles || [],
            photo: patient.photo || null
          }
        };

        await addDoc(collection(db, "sharedPatients"), sharedPatientData);
        setMessage("Patient partagé avec succès avec toutes les informations");
      } catch (error) {
        setMessage("Erreur lors du partage du patient");
      }
    };

    const handleAddNote = async () => {
      try {
        const noteData = {
          content: noteContent,
          date: new Date().toISOString(),
          files: [],
          doctorId: doctorInfo.id,
          patientId: selectedPatientForNotes.id
        };

        // Upload files if any
        if (noteFiles.length > 0) {
          const uploadedFiles = await Promise.all(
            noteFiles.map(async (file) => {
              const fileRef = ref(
                storage,
                `patient-notes/${selectedPatientForNotes.id}/${Date.now()}_${
                  file.name
                }`
              );
              await uploadBytes(fileRef, file);
              const url = await getDownloadURL(fileRef);
              return {
                name: file.name,
                url: url,
                date: new Date().toISOString()
              };
            })
          );
          noteData.files = uploadedFiles;
        }

        // Add note to Firestore and get the document reference
        const docRef = await addDoc(collection(db, "patientNotes"), noteData);

        // Include the document ID in noteData
        const noteWithId = {
          ...noteData,
          id: docRef.id
        };

        // Update local state with the ID included
        setPatientNotes({
          ...patientNotes,
          [selectedPatientForNotes.id]: [
            ...(patientNotes[selectedPatientForNotes.id] || []),
            noteWithId
          ]
        });

        setNoteContent("");
        setNoteFiles([]);
        setShowNotesModal(false);
        setMessage("Note ajoutée avec succès");
      } catch (error) {
        setMessage("Erreur lors de l'ajout de la note");
      }
    };

    const auth = getAuth();
    const doctorInfo = JSON.parse(localStorage.getItem("doctorData"));
    // Helper function to generate time slots
    const generateTimeSlots = (startTime, endTime, duration) => {
      const slots = [];
      let currentTime = new Date(`2000/01/01 ${startTime}`);
      const endDateTime = new Date(`2000/01/01 ${endTime}`);
      while (currentTime < endDateTime) {
        slots.push(
          currentTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          })
        );
        currentTime.setMinutes(currentTime.getMinutes() + duration);
      }
      return slots;
    };

    const fetchAvailableDoctors = async () => {
      const doctorsRef = collection(db, "medecins");
      const doctorsSnapshot = await getDocs(doctorsRef);
      const doctorsData = doctorsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((doc) => doc.id !== doctorInfo.id); // Exclude current doctor
      setAvailableDoctors(doctorsData);
    };
    const handleDoctorAssociationRequest = async () => {
      if (!selectedDoctor) return;

      try {
        const associationData = {
          requestingDoctorId: doctorInfo.id,
          requestingDoctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
          targetDoctorId: selectedDoctor.id,
          targetDoctorName: `Dr. ${selectedDoctor.nom} ${selectedDoctor.prenom}`,
          status: "pending",
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "doctorAssociations"), associationData);
        setMessage("Demande d'association envoyée");
        setShowDoctorAssociationModal(false);
      } catch (error) {
        setMessage("Erreur lors de l'envoi de la demande");
      }
    };

    useEffect(() => {
      const fetchDoctorAssociations = async () => {
        const associationsQuery = query(
          collection(db, "doctorAssociations"),
          where("requestingDoctorId", "==", doctorInfo.id),
          where("status", "==", "accepted")
        );
        const snapshot = await getDocs(associationsQuery);
        setDoctorAssociations(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      };

      if (doctorInfo?.id) {
        fetchDoctorAssociations();
      }
    }, [doctorInfo?.id]);

    const handleMedicalDocUpload = async (patientId, files) => {
      setUploadingDocs(true);
      const uploadedUrls = [];

      try {
        for (const file of files) {
          const fileRef = ref(
            storage,
            `patients/${patientId}/medical-docs/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          uploadedUrls.push(url);
        }

        // Update patient document list in Firestore
        const patientRef = doc(db, "patients", patientId);
        await updateDoc(patientRef, {
          documents: arrayUnion(...uploadedUrls)
        });

        setMessage("Documents médicaux ajoutés avec succès");
        setMedicalDocs([...medicalDocs, ...uploadedUrls]);
      } catch (error) {
        setMessage("Erreur lors du téléchargement des documents");
      } finally {
        setUploadingDocs(false);
      }
    };


    const handleAddPatient = async () => {
      try {
        if (
          !newPatient.email ||
          !newPatient.password ||
          !newPatient.nom ||
          !newPatient.prenom
        ) {
          setMessage("Veuillez remplir tous les champs obligatoires");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newPatient.email,
          newPatient.password
        );

        await setDoc(doc(db, "userRoles", userCredential.user.uid), {
          role: "patient",
          medecinId: doctorInfo.id
        });

        let photoUrl = "";
        if (patientPhotoFile) {
          const photoRef = ref(
            storage,
            `patients/${doctorInfo.id}/${patientPhotoFile.name}`
          );
          await uploadBytes(photoRef, patientPhotoFile);
          photoUrl = await getDownloadURL(photoRef);
        }
        let documentUrls = [];
        if (newPatient.documents?.length > 0) {
          documentUrls = await Promise.all(
            newPatient.documents.map(async (file) => {
              const docRef = ref(
                storage,
                `patients/${doctorInfo.id}/documents/${Date.now()}_${file.name}`
              );
              await uploadBytes(docRef, file);
              return getDownloadURL(docRef);
            })
          );
        }

        const patientData = {
          ...newPatient,
          uid: userCredential.user.uid,
          photo: photoUrl,
          documents: documentUrls,
          medecinId: doctorInfo.id,
          createdBy: doctorInfo.id,
          createdAt: new Date().toISOString(),
          status: "inactif",
          joursDisponibles: selectedDays,
          appointmentSettings: {
            heureDebut: newPatient.heureDebut,
            heureFin: newPatient.heureFin,
            consultationDuration: newPatient.consultationDuration
          }
        };

        const docRef = await addDoc(collection(db, "patients"), patientData);
        const newPatientWithId = { id: docRef.id, ...patientData };
        setPrivatePatients([...privatePatients, newPatientWithId]);
        setShowAddPatientModal(false);
        setMessage("Patient privé ajouté avec succès");
        // Reset form
        setNewPatient({
          nom: "",
          prenom: "",
          age: "",
          sexe: "",
          telephone: "",
          email: "",
          password: "",
          photo: null,
          visibility: "private",
          medecinId: doctorInfo.id,
          heureDebut: "",
          heureFin: "",
          joursDisponibles: [],
          consultationDuration: 30
        });
        setPatientPhotoFile(null);
        setSelectedDays([]);
      } catch (error) {
        switch (error.code) {
          case "auth/email-already-in-use":
            setMessage("Cet email est déjà utilisé");
            break;
          case "auth/invalid-email":
            setMessage("Format d'email invalide");
            break;
          case "auth/weak-password":
            setMessage("Le mot de passe doit contenir au moins 6 caractères");
            break;
          default:
            setMessage("Erreur lors de la création: " + error.message);
        }
        console.error("Error details:", error);
      }
    };

    const fetchAvailableStructures = async () => {
      const structuresSnapshot = await getDocs(collection(db, "structures"));
      const structuresData = structuresSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableStructures(structuresData);
    };

    const handleAssociationRequest = async () => {
      try {
        // Validate doctor info
        if (!doctorInfo || !doctorInfo.id) {
          setMessage("Information du médecin non disponible");
          return;
        }
        // Validate selected structures
        if (selectedStructures.length === 0) {
          setMessage("Veuillez sélectionner au moins une structure");
          return;
        }
        // Check for existing pending requests
        for (const structureId of selectedStructures) {
          const existingRequestsQuery = query(
            collection(db, "associationRequests"),
            where("doctorId", "==", doctorInfo.id),
            where("structureId", "==", structureId),
            where("status", "==", "pending")
          );

          const existingRequestsSnapshot = await getDocs(existingRequestsQuery);
          if (!existingRequestsSnapshot.empty) {
            setMessage(
              "Une demande est déjà en attente pour une ou plusieurs structures sélectionnées"
            );
            return;
          }
        }
        // Create new requests
        const requests = selectedStructures.map((structureId) => ({
          doctorId: doctorInfo.id,
          structureId: structureId,
          status: "pending",
          requestDate: new Date().toISOString(),
          doctorInfo: {
            nom: doctorInfo.nom,
            prenom: doctorInfo.prenom,
            specialite: doctorInfo.specialite,
            email: doctorInfo.email,
            telephone: doctorInfo.telephone
          }
        }));
        // Add all requests to Firestore
        await Promise.all(
          requests.map((request) =>
            addDoc(collection(db, "associationRequests"), request)
          )
        );
        setMessage("Demandes d'association envoyées avec succès");
        setShowStructureModal(false);
        setSelectedStructures([]);
        // Refresh pending requests
        const requestsQuery = query(
          collection(db, "associationRequests"),
          where("doctorId", "==", doctorInfo.id),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setPendingRequests(
          requestsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      } catch (error) {
        console.error("Error sending association requests:", error);
        setMessage("Erreur lors de l'envoi des demandes: " + error.message);
      }
    };

    const handleScheduleAppointment = async (patientId) => {
      try {
        const appointmentData = {
          patientId,
          doctorId: doctorInfo.id,
          day: newAppointmentDate,
          timeSlot: newAppointmentTime,
          status: "scheduled",
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, "appointments"), appointmentData);
        setMessage("Rendez-vous programmé avec succès");
        setShowRescheduleModal(false);
      } catch (error) {
        setMessage("Erreur lors de la programmation du rendez-vous");
      }
    };
    useEffect(() => {
      const fetchPatients = async () => {
        if (doctorInfo?.id) {
          // Fetch structure-assigned patients
          const structureQuery = query(
            collection(db, "patients"),
            where("medecinId", "==", doctorInfo.id),
            where("structureId", "!=", null)
          );
          const structureSnapshot = await getDocs(structureQuery);
          const structureData = [];

          // Fetch private patients
          const privateQuery = query(
            collection(db, "patients"),
            where("medecinId", "==", doctorInfo.id),
            where("createdBy", "==", doctorInfo.id)
          );
          const privateSnapshot = await getDocs(privateQuery);
          const privateData = [];

          // Fetch all appointments
          const appointmentsQuery = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorInfo.id)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          // Remplacer uniquement le bloc de code pour le traitement des patients de structure
for (const docSnapshot of structureSnapshot.docs) {
  const patientData = { id: docSnapshot.id, ...docSnapshot.data() };
  const patientAppointment = appointmentsData.find(
    (apt) => apt.patientId === patientData.id
  );
  if (patientAppointment) {
    patientData.appointment = patientAppointment;
  }
  if (patientData.structureId) {
    const structureDoc = await getDoc(
      doc(db, "structures", patientData.structureId)
    );
    if (structureDoc.exists()) {
      const structureData = structureDoc.data();
      patientData.structure = {
        id: structureDoc.id,
        ...structureData
      };
      // Ajouter directement le nom de la structure pour un accès facile
      patientData.structureName = structureData.nom;
    }
  }
  structureData.push(patientData);
}
          // Process private patients
          for (const docSnapshot of privateSnapshot.docs) {
            const patientData = { id: docSnapshot.id, ...docSnapshot.data() };
            const patientAppointment = appointmentsData.find(
              (apt) => apt.patientId === patientData.id
            );
            if (patientAppointment) {
              patientData.appointment = patientAppointment;
            }
            privateData.push(patientData);
          }

          setStructurePatients(structureData);
          setPrivatePatients(privateData);
          setAppointments(appointmentsData);
        }
      };

      const fetchPendingRequests = async () => {
        const requestsQuery = query(
          collection(db, "associationRequests"),
          where("doctorId", "==", doctorInfo.id),
          where("status", "==", "pending")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        setPendingRequests(
          requestsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      };
      fetchPendingRequests();

      fetchPatients();
    }, [doctorInfo.id]);

    useEffect(() => {
      const fetchPendingAssociationRequests = async () => {
        const requestsQuery = query(
          collection(db, "doctorAssociations"),
          where("targetDoctorId", "==", doctorInfo.id),
          where("status", "==", "pending")
        );
        const snapshot = await getDocs(requestsQuery);
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingDoctorRequests(requests);
      };

      fetchPendingAssociationRequests();
    }, [doctorInfo.id]);

    useEffect(() => {
      const fetchSharedPatients = async () => {
        const sharedQuery = query(
          collection(db, "sharedPatients"),
          where("targetDoctorId", "==", doctorInfo.id)
        );
        const sharedSnapshot = await getDocs(sharedQuery);
        const sharedData = sharedSnapshot.docs.map((doc) => ({
          ...doc.data().patientData,
          sharedBy: doc.data().sourceDoctorId,
          sharedAt: doc.data().sharedAt
        }));
        setSharedPatients(sharedData);
      };

      if (doctorInfo?.id) {
        fetchSharedPatients();
      }
    }, [doctorInfo?.id]);

    const fetchPatientNotes = async (patientId) => {
      const notesRef = collection(db, "patientNotes");
      const q = query(notesRef, where("patientId", "==", patientId));
      const snapshot = await getDocs(q);
      const notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatientNotes({
        ...patientNotes,
        [patientId]: notes
      });
    };

    const handleEditNote = async (noteId, newContent) => {
      if (!noteId || !selectedPatientForNotes?.id) {
        return;
      }

      const noteRef = doc(db, "patientNotes", noteId);

      await updateDoc(noteRef, {
        content: newContent,
        updatedAt: new Date().toISOString()
      });

      const updatedNotes = patientNotes[selectedPatientForNotes.id].map((note) =>
        note.id === noteId ? { ...note, content: newContent } : note
      );

      setPatientNotes({
        ...patientNotes,
        [selectedPatientForNotes.id]: updatedNotes
      });

      setEditingNote(null);
      setEditedNoteContent("");
      setMessage("Note modifiée avec succès");
    };

    useEffect(() => {
      const loadAllPatientNotes = async () => {
        const notesRef = collection(db, "patientNotes");

        // Query for doctor's own notes
        const ownNotesQuery = query(
          notesRef,
          where("doctorId", "==", doctorInfo.id)
        );

        // Query for notes shared with this doctor
        const sharedNotesQuery = query(
          notesRef,
          where("targetDoctorId", "==", doctorInfo.id)
        );

        // Execute both queries in parallel
        const [ownNotesSnapshot, sharedNotesSnapshot] = await Promise.all([
          getDocs(ownNotesQuery),
          getDocs(sharedNotesQuery)
        ]);

        const notesData = {};

        // Process own notes
        ownNotesSnapshot.docs.forEach((doc) => {
          const note = { id: doc.id, ...doc.data(), isShared: false };
          const patientId = note.patientId;
          if (!notesData[patientId]) notesData[patientId] = [];
          notesData[patientId].push(note);
        });

        // Process shared notes
        sharedNotesSnapshot.docs.forEach((doc) => {
          const note = { id: doc.id, ...doc.data(), isShared: true };
          const patientId = note.patientId;
          if (!notesData[patientId]) notesData[patientId] = [];
          notesData[patientId].push(note);
        });

        setPatientNotes(notesData);
      };

      if (doctorInfo?.id) {
        loadAllPatientNotes();
      }
    }, [doctorInfo?.id]);

    const handleDeleteNote = async (noteId) => {
      if (!noteId) {
        setMessage("Erreur: Identifiant de note invalide");
        return;
      }

      try {
        const noteRef = doc(db, "patientNotes", noteId);
        await deleteDoc(noteRef);

        if (selectedPatientForNotes && selectedPatientForNotes.id) {
          const updatedNotes = patientNotes[selectedPatientForNotes.id].filter(
            (note) => note.id !== noteId
          );

          setPatientNotes({
            ...patientNotes,
            [selectedPatientForNotes.id]: updatedNotes
          });

          setMessage("Note supprimée avec succès");
        }
      } catch (error) {
        console.error("Error deleting note:", error);
        setMessage("Erreur lors de la suppression de la note");
      }
    };

    const showPatientDetails = async (patient) => {
      setSelectedPatientForNotes(patient);
      await fetchPatientNotes(patient.id);
      setShowPatientDetailsModal(true);
    };

    // For regular patients (structure or private)
    const handleDeletePatient = async (patientId, isPrivate = false) => {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "patients", patientId));

        // Delete related data
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("patientId", "==", patientId)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        await Promise.all(
          appointmentsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
        );

        // Update local state
        if (isPrivate) {
          setPrivatePatients((prevPatients) =>
            prevPatients.filter((p) => p.id !== patientId)
          );
        } else {
          setStructurePatients((prevPatients) =>
            prevPatients.filter((p) => p.id !== patientId)
          );
        }

        setMessage("Patient supprimé avec succès");
      } catch (error) {
        setMessage("Erreur lors de la suppression");
        console.error("Delete error:", error);
      }
    };

    // For completed and archived patients
    const handleDeleteCompletedPatient = async (patientId) => {
      try {
        // Check if patient is pinned
        const isPinned = pinnedPatients.find((p) => p.id === patientId);

        if (!isPinned) {
          await deleteDoc(doc(db, "patients", patientId));

          // Delete related data
          const appointmentsQuery = query(
            collection(db, "appointments"),
            where("patientId", "==", patientId)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          await Promise.all(
            appointmentsSnapshot.docs.map((doc) => deleteDoc(doc.ref))
          );

          const notesQuery = query(
            collection(db, "patientNotes"),
            where("patientId", "==", patientId)
          );
          const notesSnapshot = await getDocs(notesQuery);
          await Promise.all(notesSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

          // Update local states
          setStructurePatients((prev) => prev.filter((p) => p.id !== patientId));
          setPrivatePatients((prev) => prev.filter((p) => p.id !== patientId));
          setSharedPatients((prev) => prev.filter((p) => p.id !== patientId));

          setMessage("Patient supprimé définitivement");
        } else {
          setMessage("Impossible de supprimer un patient épinglé");
        }
      } catch (error) {
        setMessage("Erreur lors de la suppression");
        console.error("Delete error:", error);
      }
    };

    const handleContactPatient = (type, value, patient) => {
      switch (type) {
        case "email":
          window.location.href = `mailto:${value}`;
          break;
        case "phone":
          window.location.href = `tel:${value}`;
          break;
        case "video":
          window.open(`https://meet.google.com/new`, "_blank");
          break;
        case "message":
          setSelectedPatient(patient);
          setShowMessagerieModal(true);
          break;
        default:
          break;
      }
    };

    const handleToggleStatus = async (appointmentId, currentStatus) => {
      try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        const appointment = await getDoc(appointmentRef);
        const appointmentData = appointment.data();
        
        // Mettre à jour le status du rendez-vous
        await updateDoc(appointmentRef, {
          status: currentStatus === "scheduled" ? "completed" : "scheduled"
        });
    
        // Mettre à jour le patient avec le status du rendez-vous
        const patientRef = doc(db, "patients", appointmentData.patientId);
        await updateDoc(patientRef, {
          appointment: {
            ...appointmentData,
            status: currentStatus === "scheduled" ? "completed" : "scheduled"
          }
        });
    
        // Mettre à jour l'état local
        setAppointments(appointments.map(apt => 
          apt.id === appointmentId 
            ? {...apt, status: currentStatus === "scheduled" ? "completed" : "scheduled"} 
            : apt
        ));
        
        setMessage(`Rendez-vous ${currentStatus === "scheduled" ? "terminé" : "réactivé"} avec succès`);
      } catch (error) {
        setMessage("Erreur lors de la modification du statut");
        console.error(error);
      }
    };
    
    const handleDeleteAppointment = async (appointmentId) => {
      try {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
          const appointmentRef = doc(db, "appointments", appointmentId);
          await deleteDoc(appointmentRef);
          
          // Mise à jour locale de l'état
          setAppointments(appointments.filter(apt => apt.id !== appointmentId));
          setMessage("Rendez-vous supprimé avec succès");
        }
      } catch (error) {
        setMessage("Erreur lors de la suppression du rendez-vous");
        console.error(error);
      }
    };
    

    const handleExtendAppointment = async (appointmentId) => {
      try {
        // Mise à jour dans Firestore
        await updateDoc(doc(db, "appointments", appointmentId), {
          extendedDays: extensionDays,
          extendedTime: extensionTime,
          status: "extended", // Add this line

          updatedAt: new Date().toISOString()
        });
        // Mise à jour locale des patients de la structure
        const updatedStructurePatients = structurePatients.map((patient) => {
          if (patient.appointment?.id === appointmentId) {
            return {
              ...patient,
              appointment: {
                ...patient.appointment,
                day: extensionDays.join(", "), // Afficher les nouveaux jours
                timeSlot: `${patient.appointment.timeSlot} - ${extensionTime}`, // Afficher le nouveau créneau
                extendedDays: extensionDays,
                extendedTime: extensionTime,
                status: "extended" // Add this line
              }
            };
          }
          return patient;
        });
        // Mettre à jour l'état
        setStructurePatients(updatedStructurePatients);
        setShowExtendModal(false);
        setMessage("Rendez-vous modifié avec succès");
        // Réinitialiser les valeurs
        setExtensionDays([]);
        setExtensionTime("");
      } catch (error) {
        console.error("Erreur modification RDV:", error);
        setMessage("Erreur lors de la modification du rendez-vous");
      }
    };

    const handleAcceptDoctorAssociation = async (request) => {
      try {
        const docRef = doc(db, "doctorAssociations", request.id);
        await updateDoc(docRef, {
          status: "accepted",
          acceptedAt: new Date().toISOString()
        });
        
        // Update local state to reflect the change
        setDoctorAssociations(prev =>
          prev.map(assoc =>
            assoc.id === request.id
              ? { ...assoc, status: "accepted" }
              : assoc
          )
        );

        // Remove from pending requests
        setPendingDoctorRequests(prev =>
          prev.filter(req => req.id !== request.id)
        );

        setMessage("Association acceptée avec succès");
      } catch (error) {
        console.error("Erreur lors de l'acceptation de l'association:", error);
        setMessage("Erreur lors de l'acceptation de l'association");
      }
    };

    const handleRejectDoctorAssociation = async (request) => {
      try {
        await updateDoc(doc(db, "doctorAssociations", request.id), {
          status: "rejected",
          rejectedAt: new Date().toISOString()
        });

        setPendingDoctorRequests((prev) =>
          prev.filter((req) => req.id !== request.id)
        );

        setMessage("Association refusée");
      } catch (error) {
        setMessage("Erreur lors du refus de l'association");
      }
    };

    

    useEffect(() => {
      if (doctorInfo?.id) {
        const unsubscribe = onSnapshot(
          query(
            collection(db, "sharedPatients"),
            where("targetDoctorId", "==", doctorInfo.id)
          ),
          (snapshot) => {
            const sharedData = snapshot.docs.map((doc) => ({
              ...doc.data().patientData,
              sharedBy: doc.data().sourceDoctorId,
              sharedAt: doc.data().sharedAt
            }));
            setSharedPatients(sharedData);
          }
        );

        return () => unsubscribe();
      }
    }, [doctorInfo?.id]);

    useEffect(() => {
      if (doctorInfo?.id) {
        const unsubscribe = onSnapshot(
          query(
            collection(db, "consultationRequests"),
            where("doctorId", "==", doctorInfo.id),
            where("status", "==", "pending")
          ),
          (snapshot) => {
            const requests = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
            }));
            setConsultationRequests(requests);
          }
        );
        return () => unsubscribe();
      }
    }, [doctorInfo?.id]);



    // Update the handleAcceptConsultation function
    const handleAcceptConsultation = async (request) => {
      try {
        // Update request status
        await updateDoc(doc(db, "consultationRequests", request.id), {
          status: "accepted",
          acceptedAt: new Date().toISOString()
        });

        // Create complete patient data with default appointment settings
        const patientData = {
          nom: request.patientInfo.nom,
          prenom: request.patientInfo.prenom,
          email: request.patientInfo.email,
          telephone: request.patientInfo.telephone,
          age: request.patientInfo.age,
          sexe: request.patientInfo.sexe,
          photo: request.patientInfo.photo || null,
          status: "active",
          medecinId: doctorInfo.id,
          createdBy: doctorInfo.id,
          createdAt: new Date().toISOString(),
          joursDisponibles: [request.preferredDay],
          appointmentSettings: {
            heureDebut: request.preferredTimeStart || "08:00", // Default start time
            heureFin: request.preferredTimeEnd || "18:00", // Default end time
            consultationDuration: 30 // Default duration
          },
          uid: request.patientId
        };
        // Add to Firestore
        const patientRef = await addDoc(collection(db, "patients"), patientData);

        // Add ID to patient data
        const newPatientWithId = { id: patientRef.id, ...patientData };

        // Update local state
        setPrivatePatients((prevPatients) => [...prevPatients, newPatientWithId]);

        // Create appointment
        await addDoc(collection(db, "appointments"), {
          patientId: patientRef.id,
          doctorId: doctorInfo.id,
          day: request.preferredDay,
          timeSlot: request.preferredTimeStart,
          status: "scheduled",
          createdAt: new Date().toISOString()
        });

        setMessage("Nouvelle consultation programmée");
        setShowConsultationRequestsModal(false);
      } catch (error) {
        console.error("Error details:", error);
        setMessage("Erreur: " + error.message);
      }
    };

    const handleRejectConsultation = async (request) => {
      try {
        await updateDoc(doc(db, "consultationRequests", request.id), {
          status: "rejected",
          rejectedAt: new Date().toISOString()
        });
        setMessage("Demande de consultation refusée");
      } catch (error) {
        setMessage("Erreur lors du refus de la demande");
      }
    };

    const [selectedPatientForRecording, setSelectedPatientForRecording] =
      useState(null);
    const [selectedPatientFiles, setSelectedPatientFiles] = useState([]);
    const [recordingData, setRecordingData] = useState(null);

  
    // Authentication check on component mount
    useEffect(() => {
      const checkAuth = () => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const doctorData = localStorage.getItem('doctorData');
        
        if (!isAuthenticated || !doctorData || !auth.currentUser) {
          handleLogout();
        }
      };

      checkAuth();
      // Add auth state listener
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          handleLogout();
        }
      });

      return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
      try {
        await signOut(auth);
        localStorage.clear(); // Clear all localStorage data
        navigate('/'); // Redirect to General.js
      } catch (error) {
        console.error('Logout error:', error);
      }
    };


    useEffect(() => {
      const fetchAssignedPatients = async () => {
        if (doctorData?.id) {
          const patientsQuery = query(
            collection(db, 'patients'),
            where('medecinId', '==', doctorData.id)
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
    }, [doctorData]);

    
    // Message fetching
  useEffect(() => {
    if (selectedPatient && doctorData) {
      const conversationId = `${doctorData.id}_${selectedPatient.id}`;
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId)
      );
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        setMessages(messagesData);
      });
      
      return () => unsubscribe();
    }
  }, [selectedPatient, doctorData]);

  // Message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((newMessage.trim() || selectedFile) && selectedPatient) {
      try {
        let fileUrl = '';
        let fileName = '';
        
        if (selectedFile) {
          const fileRef = ref(storage, `messages/${Date.now()}_${selectedFile.name}`);
          await uploadBytes(fileRef, selectedFile);
          fileUrl = await getDownloadURL(fileRef);
          fileName = selectedFile.name;
        }

        const messageData = {
          conversationId: `${doctorData.id}_${selectedPatient.id}`,
          senderId: doctorData.id,
          receiverId: selectedPatient.id,
          content: newMessage.trim(),
          fileUrl,
          fileName,
          timestamp: serverTimestamp(),
          senderName: `Dr. ${doctorData.nom} ${doctorData.prenom}`,
          senderType: 'doctor'
        };

        await addDoc(collection(db, 'messages'), messageData);
        setNewMessage('');
        setSelectedFile(null);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessage('Erreur lors de l\'envoi du message');
      }
    }
  };

    const [appointmentViewType, setAppointmentViewType] = useState("grid"); // Add this line

    // Ajouter après les autres déclarations d'états
const [searchTerm, setSearchTerm] = useState("");
const [searchResults, setSearchResults] = useState([]);

// Ajouter la fonction de recherche
const handleSearch = (term) => {
  setSearchTerm(term);
  if (!term.trim()) {
    setSearchResults([]);
    return;
  }

  const searchTermLower = term.toLowerCase();
  
  // Recherche dans les patients privés et de structure
  const allPatients = [...privatePatients, ...structurePatients];
  
  // Recherche dans les rendez-vous
  const appointmentResults = appointments.map(apt => {
    const patient = patientsData[apt.patientId];
    return {
      ...apt,
      patient,
      type: 'appointment'
    };
  });

  // Combiner et filtrer les résultats
  const results = [
    ...allPatients.map(p => ({ ...p, type: 'patient' })),
    ...appointmentResults
  ].filter(item => {
    if (item.type === 'patient') {
      return (
        item.nom?.toLowerCase().includes(searchTermLower) ||
        item.prenom?.toLowerCase().includes(searchTermLower) ||
        item.email?.toLowerCase().includes(searchTermLower) ||
        item.telephone?.toLowerCase().includes(searchTermLower) ||
        item.status?.toLowerCase().includes(searchTermLower) ||
        item.age?.toString().includes(searchTermLower)
      );
    } else {
      return (
        item.patient?.nom?.toLowerCase().includes(searchTermLower) ||
        item.patient?.prenom?.toLowerCase().includes(searchTermLower) ||
        item.day?.toLowerCase().includes(searchTermLower) ||
        item.timeSlot?.toLowerCase().includes(searchTermLower) ||
        item.status?.toLowerCase().includes(searchTermLower)
      );
    }
  });

  setSearchResults(results);
};

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    const handleDeleteDoctor = async () => {
      try {
        // 1. Supprimer tous les liens avec les structures et patients
        const batch = writeBatch(db);
        
        // Retirer le médecin des structures
        for (const structure of doctorData.structures) {
          const structureRef = doc(db, 'structures', structure);
          batch.update(structureRef, {
            doctors: arrayRemove(doctorData.id)
          });
        }
  
        // Mettre à jour les patients
        const patientsQuery = query(
          collection(db, 'patients'),
          where('medecinId', '==', doctorData.id)
        );
        const patientsDocs = await getDocs(patientsQuery);
        patientsDocs.forEach((patientDoc) => {
          batch.update(patientDoc.ref, {
            medecinId: null
          });
        });
  
        await batch.commit();
  
        // 2. Supprimer tous les rendez-vous
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorData.id)
        );
        const appointmentsDocs = await getDocs(appointmentsQuery);
        const appointmentsBatch = writeBatch(db);
        appointmentsDocs.forEach((doc) => {
          appointmentsBatch.delete(doc.ref);
        });
        await appointmentsBatch.commit();
  
        // 3. Supprimer le document du médecin
        await deleteDoc(doc(db, 'medecins', doctorData.id));
  
        // 4. Supprimer le compte authentification
        const auth = getAuth();
        await deleteUser(auth.currentUser);
  
        // 5. Déconnexion et redirection
        await auth.signOut();
        localStorage.removeItem('doctorData');
        navigate('/');
  
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setMessage('Erreur lors de la suppression du compte');
      }
    };



    // Ajouter après les autres useEffect
useEffect(() => {
  const fetchStructuresInfo = async () => {
    const structuresSnapshot = await getDocs(collection(db, "structures"));
    const structuresData = {};
    structuresSnapshot.docs.forEach((doc) => {
      structuresData[doc.id] = { id: doc.id, ...doc.data() };
    });
    setStructuresInfo(structuresData);
  };

  fetchStructuresInfo();
}, []);


    return (
      <Container fluid className="py-4">
        {message && (
          <Alert variant="info" onClose={() => setMessage("")} dismissible>
            {message}
          </Alert>
        )}


        {/* Doctor Header */}

        <Row className="mb-4 g-4">
          <div className="container-fluid mt-3">
            <div className="card shadow">
              <div className="card-body">
                <div className="row g-3">
                  {/* Mobile Header */}
                  <div className="d-lg-none w-100">
                    <div className="d-flex justify-content-between align-items-center">
                      {/* Profile Photo */}
                      <div className="position-relative">
                        {doctorInfo.photo ? (
                          <img
                            src={doctorInfo.photo}
                            alt={`Dr. ${doctorInfo.nom}`}
                            className="rounded-circle"
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover"
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                            style={{ width: "60px", height: "60px" }}
                          >
                            <i className="bi bi-person fs-3 text-white"></i>
                          </div>
                        )}
                        <span className="position-absolute bottom-0 end-0 badge rounded-circle bg-success p-1">
                          <i className="bi bi-check text-white"></i>
                        </span>
                      </div>

                      {/* Mobile Menu Button */}
                      <div className="dropdown">
                        <button
                          className="btn btn-primary"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="bi bi-list"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => setViewMode("both")}
                            >
                              <i className="bi bi-person me-2"></i>Tous
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => setViewMode("structure")}
                            >
                              <i className="bi bi-building me-2"></i>Structures
                            </button>
                          </li>
                          <li>
                          <button
                            className="dropdown-item"
                            onClick={() =>
                              setShowCompletedAndArchived(
                                !showCompletedAndArchived
                              )
                            }
                          >
                            <i className="bi bi-archive me-1"></i>Archives
                          </button>
                            </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => setViewMode("private")}
                            >
                              <i className="bi bi-person me-2"></i>Privés
                            </button>
                          </li>
                          <li>
                          <button className= "dropdown-item"
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setShowMessagerieModal(true);
                                      }}>
                                <FaComment className="me-1" />Message
                              </button>
                            </li>
                        
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                fetchAvailableStructures();
                                setShowStructureModal(true);
                              }}
                            >
                              <i className="bi bi-building me-2"></i>Structure
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                fetchAvailableDoctors();
                                setShowDoctorAssociationModal(true);
                              }}
                            >
                              <i className="bi bi-person me-2"></i>Médecins
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item position-relative"
                              onClick={() =>
                                setShowConsultationRequestsModal(true)
                              }
                            >
                              <i className="bi bi-calendar me-2"></i>Consultations
                              {consultationRequests.length > 0 && (
                                <span className="position-absolute top-50 end-0 translate-middle badge rounded-pill bg-danger">
                                  {consultationRequests.length}
                                </span>
                              )}
                            </button>
                          </li>

                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() =>
                                setShowPatientFiles(!showPatientFiles)
                              }
                            >
                              <i
                                className={`bi bi-chevron-${
                                  showPatientFiles ? "up" : "down"
                                } me-2`}
                              ></i>
                              {showPatientFiles ? "Masquer" : "Afficher"} fichiers
                            </button>
                          </li>

                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => setShowProfInfo(!showProfInfo)}
                            >
                              <i
                                className={`bi bi-chevron-${
                                  showProfInfo ? "up" : "down"
                                } me-2`}
                              ></i>
                              {showProfInfo ? "Masquer" : "Afficher"} Profil
                            </button>
                          </li>
                          <li>
                            <hr className="dropdown-divider" />
                          </li>
                          <li>
                          <Button 
            variant="danger" 
            onClick={handleLogout}
            className="d-flex align-items-center gap-2"
          >
            <FaSignOutAlt /> Déconnexion
          </Button>                        </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View - Hidden on Mobile */}
                  <div className="d-none d-lg-block">
                    <div className="row g-3">
                      {/* Profile Section */}
                      <div className="col-lg-4">
                        <div className="d-flex align-items-center">
                          {/* Original Profile Content */}
                          <div className="position-relative">
                            {doctorInfo.photo ? (
                              <img
                                src={doctorInfo.photo}
                                alt={`Dr. ${doctorInfo.nom}`}
                                className="rounded-circle"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "cover"
                                }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                style={{ width: "100px", height: "100px" }}
                              >
                                <i className="bi bi-person fs-1 text-white"></i>
                              </div>
                            )}
                            <span className="position-absolute bottom-0 end-0 badge rounded-circle bg-success p-2">
                              <i className="bi bi-check text-white"></i>
                            </span>
                          </div>

                          <div className="ms-3">
                            <h5 className="fw-bold mb-1">
                              Dr. {doctorInfo.nom} {doctorInfo.prenom}
                            </h5>
                            <h6 className="text-primary">
                              {doctorInfo.specialite}
                            </h6>
                          </div>
                        </div>
                      </div>

                      {/* View Controls */}
                      <div className="col-lg-4">
                        <div className="btn-group w-100">
                          {/* Original View Control Buttons */}
                          <button
                            className={`btn ${
                              viewMode === "both"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setViewMode("both")}
                          >
                            <i className="bi bi-person me-1"></i>Tous
                          </button>
                          <button
                            className={`btn ${
                              viewMode === "structure"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setViewMode("structure")}
                          >
                            <i className="bi bi-building me-1"></i>Structures
                          </button>
                          <button
                            className={`btn ${
                              viewMode === "private"
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setViewMode("private")}
                          >
                            <i className="bi bi-person me-1"></i>Privés
                          </button>
                          <button
                            className={`btn ${
                              showCompletedAndArchived
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() =>
                              setShowCompletedAndArchived(
                                !showCompletedAndArchived
                              )
                            }
                          >
                            <i className="bi bi-archive me-1"></i>Archives
                          </button>
                          <button className= "btn btn-outline-primary"
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setShowMessagerieModal(true);
                                      }}>
                                <FaComment className="me-1" />Message
                              </button>
                        
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="col-lg-4">
                        <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                          {/* Original Action Buttons */}
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              fetchAvailableStructures();
                              setShowStructureModal(true);
                            }}
                          >
                            <i className="bi bi-building me-1"></i>Structure
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              fetchAvailableDoctors();
                              setShowDoctorAssociationModal(true);
                            }}
                          >
                            <i className="bi bi-person me-1"></i>Médecins
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm position-relative"
                            onClick={() => setShowConsultationRequestsModal(true)}
                          >
                            <i className="bi bi-calendar me-1"></i>Consultations
                            {consultationRequests.length > 0 && (
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {consultationRequests.length}
                              </span>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowProfInfo(!showProfInfo)}
                          >
                            <i
                              className={`bi bi-chevron-${
                                showProfInfo ? "up" : "down"
                              } me-1`}
                            ></i>
                            {showProfInfo ? "Masquer" : "Afficher"} Profil
                          </button>

                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setShowPatientFiles(!showPatientFiles)}
                          >
                            <i
                              className={`bi bi-chevron-${
                                showPatientFiles ? "up" : "down"
                              } me-1`}
                            ></i>
                            {showPatientFiles ? "Masquer" : "Afficher"} fichiers
                          </button>
                          <Button 
            variant="danger" 
            onClick={handleLogout}
            className="d-flex align-items-center gap-2"
          >
            <FaSignOutAlt /> Déconnexion
          </Button> 
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {pendingDoctorRequests.length > 0 && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-warning">
                <h5 className="mb-0">Demandes d'association en attente</h5>
              </Card.Header>
              <Card.Body>
                {pendingDoctorRequests.map((request) => (
                  <div
                    key={request.id}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <span>Demande de {request.requestingDoctorName}</span>
                    <ButtonGroup>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAcceptDoctorAssociation(request)}
                      >
                        <i className="fas fa-check me-2"></i>
                        Accepter
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectDoctorAssociation(request)}
                      >
                        <i className="fas fa-times me-2"></i>
                        Refuser
                      </Button>
                    </ButtonGroup>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}



<Row className="mt-4">
  <Col>
    <InputGroup className="shadow-sm">
      <InputGroup.Text className="bg-primary text-white">
        <FaSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder="Rechercher un patient, un rendez-vous, un statut..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="py-2"
      />
      {searchTerm && (
        <Button 
          variant="outline-secondary" 
          onClick={() => {
            setSearchTerm("");
            setSearchResults([]);
          }}
        >
          <FaTimes />
        </Button>
      )}
    </InputGroup>
  </Col>
</Row>

{/* Résultats de recherche */}
{searchResults.length > 0 && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <FaSearch className="me-2" />
            Résultats de recherche ({searchResults.length})
          </h5>
        </Card.Header>
        <Card.Body>
          <Row xs={1} md={2} lg={3} className="g-4">
            {searchResults.map((result, index) => (
              <Col key={index}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body>
                    {result.type === 'patient' ? (
                      // Affichage d'un patient
                      <>
                        <div className="d-flex align-items-center mb-3">
                          {result.photo ? (
                            <img
                              src={result.photo}
                              alt=""
                              className="rounded-circle me-3"
                              style={{width: "60px", height: "60px", objectFit: "cover"}}
                            />
                          ) : (
                            <div className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                                 style={{width: "60px", height: "60px"}}>
                              <span className="h4 mb-0">{result.nom?.[0]}{result.prenom?.[0]}</span>
                            </div>
                          )}
                          <div>
                            <h6 className="mb-1">{result.nom} {result.prenom}</h6>
                            <Badge bg={
                              result.status === 'active' ? 'success' :
                              result.status === 'pending' ? 'warning' : 'secondary'
                            }>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <FaEnvelope className="me-2" />{result.email}
                          </small>
                          <small className="text-muted d-block">
                            <FaPhone className="me-2" />{result.telephone}
                          </small>
                        </div>
                      </>
                    ) : (
                      // Affichage d'un rendez-vous
                      <>
                        <div className="d-flex align-items-center mb-3">
                          <div className="rounded-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center"
                               style={{width: "60px", height: "60px"}}>
                            <FaCalendarAlt size={24} />
                          </div>
                          <div>
                            <h6 className="mb-1">RDV: {result.patient?.nom} {result.patient?.prenom}</h6>
                            <Badge bg={
                              result.status === 'completed' ? 'success' :
                              result.status === 'scheduled' ? 'primary' : 'warning'
                            }>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <FaCalendar className="me-2" />{result.day}
                          </small>
                          <small className="text-muted d-block">
                            <FaClock className="me-2" />{result.timeSlot}
                          </small>
                        </div>
                      </>
                    )}
                    <div className="d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          if (result.type === 'patient') {
                            setSelectedPatient(result);
                            setShowPatientDetailsModal(true);
                          } else {
                            setSelectedAppointment(result);
                            setShowRescheduleModal(true);
                          }
                        }}
                      >
                        <FaEye className="me-2" />
                        Voir les détails
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
          <Collapse in={showProfInfo}>
            <Card className="shadow-lg border-0 rounded-3">
              <Card.Header className="bg-gradient bg-primary text-white p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaUserMd className="me-2" size={20} />
                    <span className="d-none d-sm-inline">
                      Informations professionnelles
                    </span>
                    <span className="d-sm-none">Infos pro</span>
                  </h5>
                </div>
              </Card.Header>

              <Card.Body className="p-3 p-md-4">
                <Row className="g-4">
                  <Col lg={4} className="text-center">
                    <div className="position-relative d-inline-block mb-4">
                      {doctorInfo.photo ? (
                        <img
                          src={doctorInfo.photo}
                          alt="Profile"
                          className="rounded-circle border border-5 border-light shadow"
                          style={{
                            width: "180px",
                            height: "180px",
                            objectFit: "cover"
                          }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-light border border-5 border-white shadow d-flex align-items-center justify-content-center"
                          style={{ width: "180px", height: "180px" }}
                        >
                          <FaUserMd size={70} className="text-primary" />
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle p-2"
                        onClick={() => {
                          setEditedDoctorInfo({ ...doctorInfo });
                          setShowEditProfileModal(true);
                        }}
                      >
                        <i className="fas fa-camera"></i>
                      </Button>
                    </div>

                    <div className="d-flex flex-column align-items-center gap-2 mb-4">
                      <h4 className="fw-bold mb-0">
                        Dr. {doctorInfo.nom} {doctorInfo.prenom}
                      </h4>
                      <span className="badge bg-primary px-3 py-2 rounded-pill">
                        {doctorInfo.specialite}
                      </span>
                    </div>

                    <div className="d-grid gap-2 d-md-flex justify-content-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setEditedDoctorInfo({ ...doctorInfo });
                          setShowEditProfileModal(true);
                        }}
                      >
                        <i className="fas fa-edit me-2"></i>
                        Modifier profil
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await sendPasswordResetEmail(auth, doctorInfo.email);
                            setMessage("Email de réinitialisation envoyé");
                          } catch (error) {
                            setMessage("Erreur: " + error.message);
                          }
                        }}
                      >
                        <i className="fas fa-key me-2"></i>
                        Mot de passe
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => setShowQRModal(true)}
                      >
                        <i className="fas fa-qr-code me-2"></i>
                        Afficher QR Code
                      </Button>
                    </div>
                  </Col>

                  <Col lg={8}>
                    <Row className="g-4">
                      <Col md={6}>
                        <Card className="h-100 border-0 bg-light">
                          <Card.Body>
                            <h6 className="text-primary mb-3 d-flex align-items-center">
                              <FaEnvelope className="me-2" />
                              Contact
                            </h6>
                            <ul className="list-unstyled mb-0">
                              <li className="mb-3 d-flex align-items-center">
                                <i className="fas fa-envelope text-muted me-2"></i>
                                <span className="text-break">
                                  {doctorInfo.email}
                                </span>
                              </li>
                              <li className="d-flex align-items-center">
                                <i className="fas fa-phone text-muted me-2"></i>
                                {doctorInfo.telephone}
                              </li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={6}>
                        <Card className="h-100 border-0 bg-light">
                          <Card.Body>
                            <h6 className="text-primary mb-3 d-flex align-items-center">
                              <FaCalendarAlt className="me-2" />
                              Horaires
                            </h6>
                            <ul className="list-unstyled mb-0">
                              <li className="mb-2 d-flex align-items-center">
                                <i className="fas fa-clock text-muted me-2"></i>
                                {doctorInfo.heureDebut} - {doctorInfo.heureFin}
                              </li>
                              <li className="mb-2 d-flex align-items-center">
                                <i className="fas fa-hourglass text-muted me-2"></i>
                                {doctorInfo.consultationDuration} min /
                                consultation
                              </li>
                              <li className="d-flex align-items-center">
                                <i className="fas fa-users text-muted me-2"></i>
                                Max {doctorInfo.maxPatientsPerDay} patients/jour
                              </li>
                            </ul>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12}>
                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <h6 className="text-primary mb-3 d-flex align-items-center">
                              <FaCalendarAlt className="me-2" />
                              Jours de consultation
                            </h6>
                            <div className="d-flex flex-wrap gap-2">
                              {doctorInfo.disponibilite?.map((day) => (
                                <Badge
                                  key={day}
                                  bg="primary"
                                  className="px-3 py-2 rounded-pill"
                                >
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      {doctorInfo.certifications?.length > 0 && (
                        <Col xs={12}>
                          <Card className="border-0 bg-light">
                            <Card.Body>
                              <h6 className="text-primary mb-3 d-flex align-items-center">
                                <i className="fas fa-certificate me-2"></i>
                                Certifications
                              </h6>
                              <div className="d-flex flex-wrap gap-2">
                                {doctorInfo.certifications.map((cert, index) => (
                                  <Button
                                    key={index}
                                    variant="outline-primary"
                                    size="sm"
                                    href={cert}
                                    target="_blank"
                                    className="rounded-pill"
                                  >
                                    <i className="fas fa-award me-2"></i>
                                    Certification {index + 1}
                                  </Button>
                                ))}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                    </Row>
                  </Col>
                </Row>
                <div className="text-center mt-4 pt-4 border-top">
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    className="rounded-pill px-4"
                  >
                    <i className="fas fa-trash-alt me-2"></i>
                    Supprimer mon compte
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Collapse>
        </Row>

        <Collapse in={showPatientFiles}>
          <div>
            {/* Patient Files Section */}
            <Row className="mb-5">
              <Col xs={12}>
                <Card className="shadow-lg border-0 rounded-3">
                  <Card.Header className="bg-gradient bg-primary text-white p-4">
                    <h4 className="mb-0 d-flex align-items-center">
                      <i className="fas fa-folder-medical me-3 fa-lg"></i>
                      Gestion des fichiers patients
                    </h4>
                  </Card.Header>

                  <Card.Body className="p-4">
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="form-floating">
                          <Form.Select
                            className="form-select form-select-lg shadow-sm"
                            onChange={(e) => {
                              const patient = [
                                ...privatePatients,
                                ...structurePatients
                              ].find((p) => p.id === e.target.value);
                              setSelectedPatientForRecording(patient);
                            }}
                          >
                            <option value="">Sélectionner un patient</option>
                            {[...privatePatients, ...structurePatients].map(
                              (patient) => (
                                <option key={patient.id} value={patient.id}>
                                  {patient.nom} {patient.prenom}
                                </option>
                              )
                            )}
                          </Form.Select>
                          <label>Patient</label>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="upload-zone p-4 bg-light rounded-3 text-center border-2 border-dashed">
                          <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                          <Form.Group>
                            <Form.Label className="d-block fw-bold mb-3">
                              Documents du patient
                            </Form.Label>
                            <Form.Control
                              type="file"
                              multiple
                              className="form-control form-control-lg"
                              onChange={(e) =>
                                setSelectedPatientFiles(
                                  Array.from(e.target.files)
                                )
                              }
                            />
                          </Form.Group>
                        </div>
                      </Col>
                    </Row>

                    {selectedPatientForRecording && (
                      <div className="mt-5">
                        <Card className="shadow-sm border-0 rounded-3">
                          <Card.Header className="bg-gradient bg-info text-white p-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="mb-0">
                                <i className="fas fa-file-medical me-2"></i>
                                Dossier de {selectedPatientForRecording.nom}{" "}
                                {selectedPatientForRecording.prenom}
                              </h5>
                              <Badge
                                bg="light"
                                text="dark"
                                className="px-3 py-2 rounded-pill"
                              >
                                {selectedPatientFiles.length} fichiers
                              </Badge>
                            </div>
                          </Card.Header>

                          <Card.Body className="p-4">
                            <Row className="g-4">
                              <Col md={7}>
                                <div className="files-list">
                                  <h6 className="text-primary mb-3">
                                    Documents sélectionnés
                                  </h6>
                                  <ListGroup variant="flush">
                                    {selectedPatientFiles.map((file, index) => (
                                      <ListGroup.Item
                                        key={index}
                                        className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                      >
                                        <div className="d-flex align-items-center">
                                          <div className="file-icon me-3">
                                            <i
                                              className={`fas fa-${
                                                file.type.includes("pdf")
                                                  ? "file-pdf text-danger"
                                                  : "file-image text-primary"
                                              } fa-2x`}
                                            ></i>
                                          </div>
                                          <div>
                                            <h6 className="mb-0">{file.name}</h6>
                                            <small className="text-muted">
                                              {file.type
                                                .split("/")[1]
                                                .toUpperCase()}
                                            </small>
                                          </div>
                                        </div>
                                        <Badge
                                          bg="primary"
                                          className="px-3 py-2 rounded-pill"
                                        >
                                          {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                          MB
                                        </Badge>
                                      </ListGroup.Item>
                                    ))}
                                  </ListGroup>
                                </div>
                              </Col>

                              <Col md={5}>
                                <div className="recording-details h-100">
                                  {recordingData ? (
                                    <div className="bg-light rounded-3 p-4 h-100">
                                      <h6 className="text-primary border-bottom pb-3 mb-4">
                                        Informations d'enregistrement
                                      </h6>
                                      <div className="details-list">
                                        <div className="detail-item mb-3">
                                          <i className="fas fa-calendar-alt text-primary me-2"></i>
                                          <strong>Date:</strong>{" "}
                                          {new Date().toLocaleDateString()}
                                        </div>
                                        <div className="detail-item mb-3">
                                          <i className="fas fa-user-md text-primary me-2"></i>
                                          <strong>Médecin:</strong> Dr.{" "}
                                          {doctorInfo.nom} {doctorInfo.prenom}
                                        </div>
                                        <div className="detail-item mb-3">
                                          <i className="fas fa-folder-open text-primary me-2"></i>
                                          <strong>Dossier:</strong>{" "}
                                          {selectedPatientForRecording.nom}_
                                          {selectedPatientForRecording.prenom}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="d-flex align-items-center justify-content-center h-100">
                                      <div className="text-center text-muted">
                                        <i className="fas fa-info-circle fa-3x mb-3"></i>
                                        <p>
                                          Les détails apparaîtront après
                                          l'enregistrement
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>

                          <Card.Footer className="bg-light p-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex gap-2">
                                <Badge bg="info" className="px-3 py-2">
                                  <i className="fas fa-file me-2"></i>
                                  {selectedPatientFiles.length} fichiers
                                </Badge>
                                {recordingData && (
                                  <Badge bg="success" className="px-3 py-2">
                                    <i className="fas fa-check-circle me-2"></i>
                                    Enregistré
                                  </Badge>
                                )}
                              </div>

                              <ButtonGroup>
                                <Button
                                  variant="outline-secondary"
                                  className="px-4"
                                  onClick={() => {
                                    setSelectedPatientFiles([]);
                                    setRecordingData(null);
                                  }}
                                >
                                  <i className="fas fa-redo me-2"></i>
                                  Réinitialiser
                                </Button>
                                <Button
                                  variant="primary"
                                  className="px-4"
                                  onClick={async () => {
                                    try {
                                      const recordingInfo = {
                                        patientId: selectedPatientForRecording.id,
                                        doctorId: doctorInfo.id,
                                        date: new Date().toISOString(),
                                        fileCount: selectedPatientFiles.length
                                      };

                                      const uploadedFiles = await Promise.all(
                                        selectedPatientFiles.map(async (file) => {
                                          const fileRef = ref(
                                            storage,
                                            `patients/${
                                              selectedPatientForRecording.id
                                            }/recordings/${Date.now()}_${
                                              file.name
                                            }`
                                          );
                                          await uploadBytes(fileRef, file);
                                          const url = await getDownloadURL(
                                            fileRef
                                          );
                                          return {
                                            name: file.name,
                                            url: url,
                                            type: file.type,
                                            size: file.size,
                                            uploadDate: new Date().toISOString()
                                          };
                                        })
                                      );

                                      const recordingRef = await addDoc(
                                        collection(db, "recordings"),
                                        {
                                          ...recordingInfo,
                                          files: uploadedFiles,
                                          patientName: `${selectedPatientForRecording.nom} ${selectedPatientForRecording.prenom}`,
                                          doctorName: `Dr. ${doctorInfo.nom} ${doctorInfo.prenom}`,
                                          status: "completed"
                                        }
                                      );

                                      setRecordingData({
                                        ...recordingInfo,
                                        id: recordingRef.id,
                                        files: uploadedFiles
                                      });

                                      setMessage("Enregistrement réussi");
                                    } catch (error) {
                                      setMessage("Erreur: " + error.message);
                                    }
                                  }}
                                  disabled={selectedPatientFiles.length === 0}
                                >
                                  <i className="fas fa-save me-2"></i>
                                  Enregistrer
                                </Button>
                              </ButtonGroup>
                            </div>
                          </Card.Footer>
                        </Card>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        </Collapse>

        <style jsx>{`
          .border-dashed {
            border-style: dashed !important;
          }

          .upload-zone {
            transition: all 0.3s ease;
          }

          .upload-zone:hover {
            background-color: #f8f9fa !important;
            border-color: #0d6efd !important;
          }

          .file-icon {
            width: 40px;
            text-align: center;
          }

          .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
        `}</style>

        {showCompletedAndArchived && (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-lg border-0 rounded-3">
                <Card.Header className="bg-success text-white py-3">
                  <div className="d-flex justify-content-between align-items-center px-3">
                    <h5 className="mb-0">
                      <i className="fas fa-check-circle me-2" />
                      Patients Complétés et Archivés
                    </h5>
                    <Badge
                      bg="light"
                      text="dark"
                      className="px-3 py-2 rounded-pill"
                    >
                      {
                        [
                          ...new Set([
                            ...structurePatients,
                            ...privatePatients,
                            ...pinnedPatients,
                            ...sharedPatients
                          ])
                        ].filter(
                          (patient) =>
                            patient.appointment?.status === "completed" ||
                            patient.status === "archived" ||
                            patient.sharedBy ||
                            pinnedPatients.find((p) => p.id === patient.id)
                        ).length
                      }{" "}
                      patients
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row className="g-4">
                    {[...new Set([...structurePatients, ...privatePatients, ...pinnedPatients, ...sharedPatients])]
                      .filter(
                        (patient) =>
                          patient.appointment?.status === "completed" || // Rendez-vous complété
                          patient.status === "archived" ||              // Patient archivé
                          patient.sharedBy ||                          // Patient partagé
                          pinnedPatients.find((p) => p.id === patient.id) // Patient épinglé
                      )
                      .map((patient) => (
                        <Col key={patient.id} xs={12} md={6} lg={4}>
                          <Card className="h-100 shadow-sm hover-lift">
                            <Card.Body>
                              <div className="d-flex flex-column flex-sm-row align-items-start gap-3">
                                <div className="patient-image-container">
                                  {patient.photo ? (
                                    <img
                                      src={patient.photo}
                                      alt=""
                                      className="rounded-circle"
                                      style={{
                                        width: "80px",
                                        height: "80px",
                                        objectFit: "cover"
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="patient-avatar bg-light rounded-circle d-flex align-items-center justify-content-center"
                                      style={{ width: "80px", height: "80px" }}
                                    >
                                      <span className="h4 mb-0">
                                        {patient.nom[0]}
                                        {patient.prenom[0]}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-grow-1">
                                  <div className="position-absolute top-0 end-0 p-2">
                                    <Button
                                      variant={
                                        pinnedPatients.find(
                                          (p) => p.id === patient.id
                                        )
                                          ? "warning"
                                          : "light"
                                      }
                                      size="sm"
                                      className="rounded-circle"
                                      onClick={() => handlePinPatient(patient)}
                                    >
                                      <i className="fas fa-thumbtack"></i>
                                    </Button>
                                  </div>

                                  <h5 className="mb-2">
                                    {patient.nom} {patient.prenom}
                                  </h5>
                                  <div className="d-flex flex-wrap gap-2 mb-3">
                                    <Badge bg="secondary">
                                      {patient.age} ans
                                    </Badge>
                                    <Badge bg="info">{patient.sexe}</Badge>
                                    <Badge
                                      bg={
                                        patient.status === "archived"
                                          ? "danger"
                                          : "success"
                                      }
                                    >
                                      {patient.status === "archived"
                                        ? "Archivé"
                                        : "Complété"}
                                    </Badge>
                                  </div>

                                  {patient.appointment && (
                                    <div className="mb-3 p-2 bg-light rounded">
                                      <small className="text-muted d-block">
                                        <FaCalendarAlt className="me-1" />
                                        {patient.appointment.day}
                                      </small>
                                      <small className="text-muted d-block">
                                        <i className="fas fa-clock me-1"></i>
                                        {patient.appointment.timeSlot}
                                      </small>
                                    </div>
                                  )}

                                  <div className="contact-info mb-3">
                                    <div className="d-flex align-items-center mb-1">
                                      <FaEnvelope className="me-2 text-muted" />
                                      <small>{patient.email}</small>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <FaPhone className="me-2 text-muted" />
                                      <small>{patient.telephone}</small>
                                    </div>
                                  </div>

                                  <div className="availability-section bg-light p-2 rounded mb-3">
                                    <h6 className="text-primary mb-2">
                                      <FaCalendarAlt className="me-2" />
                                      Disponibilités
                                    </h6>
                                    <div className="d-flex flex-wrap gap-1">
                                      {patient.joursDisponibles?.map((jour) => (
                                        <Badge
                                          key={jour}
                                          bg="white"
                                          text="dark"
                                          className="border"
                                        >
                                          {jour}
                                        </Badge>
                                      ))}
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                      <i className="fas fa-clock me-1"></i>
                                      {
                                        patient.appointmentSettings?.heureDebut
                                      } - {patient.appointmentSettings?.heureFin}
                                    </small>
                                  </div>

                                  <div className="d-grid gap-2">
                                    <ButtonGroup size="sm">
                                      <Button
                                        variant="outline-primary"
                                        onClick={() =>
                                          handleContactPatient(
                                            "email",
                                            patient.email,
                                            patient
                                          )
                                        }
                                      >
                                        <FaEnvelope className="me-1" />
                                        Email
                                      </Button>
                                      <Button
                                        variant="outline-success"
                                        onClick={() =>
                                          handleContactPatient(
                                            "phone",
                                            patient.telephone,
                                            patient
                                          )
                                        }
                                      >
                                        <FaPhone className="me-1" />
                                        Appeler
                                      </Button>
                                      <Button
                                        variant="outline-info"
                                        onClick={() =>
                                          handleContactPatient(
                                            "video",
                                            null,
                                            patient
                                          )
                                        }
                                      >
                                        <FaVideo className="me-1" />
                                        Vidéo
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              "Êtes-vous sûr de vouloir supprimer définitivement ce patient ?"
                                            )
                                          ) {
                                            handleDeleteCompletedPatient(
                                              patient.id
                                            );
                                          }
                                        }}
                                      >
                                        <i className="fas fa-trash-alt me-2"></i>
                                        Supprimer définitivement
                                      </Button>
                                    </ButtonGroup>
                                    <ButtonGroup size="sm" className="mt-2">
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          setSelectedPatientDetails(patient);
                                          setShowPatientInfoModal(true);
                                        }}
                                      >
                                        <i className="fas fa-folder-open me-2"></i>
                                        Documents Médicaux
                                      </Button>
                                    </ButtonGroup>

                                    <ButtonGroup size="sm" className="mt-2">
                                      <Button
                                        variant="outline-primary"
                                        onClick={() => {
                                          setSelectedPatientForNotes(patient);
                                          setShowNotesModal(true);
                                        }}
                                      >
                                        <i className="fas fa-sticky-note me-1"></i>
                                        Ajouter une note
                                      </Button>
                                      <Button
                                        variant="outline-info"
                                        onClick={() => {
                                          setSelectedPatientForNotes(patient);
                                          setShowPatientDetailsModal(true);
                                        }}
                                      >
                                        <i className="fas fa-file-medical me-1"></i>
                                        Voir les notes
                                      </Button>
                                    </ButtonGroup>
                                    <ButtonGroup size="sm">
                                      {doctorAssociations
                                        .filter(
                                          (assoc) => assoc.status === "accepted"
                                        )
                                        .map((assoc) => (
                                          <Button
                                            key={assoc.targetDoctorId}
                                            variant="outline-primary"
                                            onClick={() =>
                                              sharePatientWithDoctor(
                                                patient,
                                                assoc.targetDoctorId
                                              )
                                            }
                                          >
                                            <i className="fas fa-share-alt me-2"></i>
                                            Partager avec Dr.{" "}
                                            {assoc.targetDoctorName}
                                          </Button>
                                        ))}
                                    </ButtonGroup>
                                  </div>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Add this modal for document preview */}
        <Modal
          show={showPatientInfoModal}
          onHide={() => setShowPatientInfoModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-secondary text-white">
            <Modal.Title>
              <i className="fas fa-folder-open me-2"></i>
              Documents Médicaux - {selectedPatientDetails?.nom}{" "}
              {selectedPatientDetails?.prenom}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              {selectedPatientDetails?.documents?.map((doc, index) => (
                <Col key={index} xs={12} sm={6} md={4}>
                  <Card className="h-100 hover-lift">
                    {doc.toLowerCase().endsWith(".pdf") ? (
                      <Card.Body className="text-center">
                        <i className="fas fa-file-pdf text-danger fa-3x mb-2"></i>
                        <p className="mb-2">Document {index + 1}</p>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDocumentPreviewModal(true);
                          }}
                        >
                          <i className="fas fa-eye me-2"></i>
                          Voir
                        </Button>
                      </Card.Body>
                    ) : (
                      <div className="position-relative">
                        <Card.Img
                          src={doc}
                          style={{ height: "200px", objectFit: "cover" }}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDocumentPreviewModal(true);
                          }}
                        />
                        <div className="position-absolute bottom-0 start-0 end-0 p-2 bg-dark bg-opacity-75 text-white">
                          <small>Image {index + 1}</small>
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Modal.Body>
        </Modal>

      {/* Section des Rendez-vous */}
{(viewMode === "both" || viewMode === "structure") && (
  <Row className="mb-4">
    <Col>
      <Card className="shadow-lg border-0 rounded-3">
        <Card.Header className="bg-gradient bg-primary text-white py-3">
          <div className="d-flex justify-content-between align-items-center px-3">
            <h5 className="mb-0 d-flex align-items-center">
              <FaCalendarAlt className="me-2" size={24} />
              <span>Patients et Rendez-vous assignés </span>
            </h5>
            <div className="d-flex align-items-center gap-3">
              <ButtonGroup>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setAppointmentViewType("grid")}
                >
                  <i className="fas fa-th-large"></i>
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setAppointmentViewType("table")}
                >
                  <i className="fas fa-list"></i>
                </Button>
              </ButtonGroup>
              <Badge bg="light" text="dark" className="px-3 py-2 rounded-pill">
                {appointments.length} rendez-vous
              </Badge>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="bg-light">
          {/* Sélection des jours */}
          <div className="mb-4 p-3 bg-white rounded shadow-sm">
            <h6 className="text-primary mb-3">
              <FaClock className="me-2" />
              Sélectionner un jour:
            </h6>
            <div className="d-flex gap-2 flex-wrap">
              {Object.keys(appointmentsByDay).map(day => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "primary" : "outline-primary"}
                  onClick={() => setSelectedDay(day)}
                  className="rounded-pill shadow-sm"
                >
                  <FaCalendarAlt className="me-1" />
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste des rendez-vous */}
          {appointmentViewType === "grid" ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {appointmentsByDay[selectedDay]?.map(appointment => {
                const patient = patientsData[appointment.patientId];
                return (
                  <Col key={appointment.id}>
                    <Card className="h-100 shadow-sm hover-effect bg-white">
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          {patient?.photo ? (
                            <img
                              src={patient.photo}
                              alt=""
                              className="rounded-circle me-3"
                              style={{width: "60px", height: "60px", objectFit: "cover"}}
                            />
                          ) : (
                            <div className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                                 style={{width: "60px", height: "60px"}}>
                              <span className="h4 mb-0">{patient?.nom?.[0]}{patient?.prenom?.[0]}</span>
                            </div>
                          )}
                          <div>
                            <h6 className="mb-1">{patient?.nom} {patient?.prenom}</h6>
                            <Badge bg={appointment.status === "completed" ? "success" : 
                                     appointment.status === "scheduled" ? "primary" : "warning"}>
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <FaClock className="me-2" />
                            Horaire: {appointment.timeSlot}
                          </small>
                        </div>
                       

                        <div className="d-grid gap-2">
                          <ButtonGroup size="sm">
                            <Button variant="outline-primary" onClick={() => handleContactPatient("email", patient?.email)}>
                              <FaEnvelope className="me-1" />Email
                            </Button>
                            <Button variant="outline-success" onClick={() => handleContactPatient("phone", patient?.telephone)}>
                              <FaPhone className="me-1" />Appeler
                            </Button>
                            <Button variant="outline-info" onClick={() => handleContactPatient("video", patient?.id)}>
                              <FaVideo className="me-1" />Vidéo
                            </Button>
                          </ButtonGroup>
                          
                          <ButtonGroup size="sm">
                            <Button variant="outline-warning" 
                                    onClick={() => handleToggleStatus(appointment.id, appointment.status)}>
                              <FaCalendarCheck className="me-1" />
                              {appointment.status === "scheduled" ? "Terminer" : "Réactiver"}
                            </Button>
                            {appointment.status === "completed" && (
                              <Button variant="outline-danger" onClick={() => handleDeleteAppointment(appointment.id)}>
                                <FaTrash className="me-1" />Supprimer
                              </Button>
                            )}
                          </ButtonGroup>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div className="table-responsive bg-white rounded shadow-sm">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Horaire</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsByDay[selectedDay]?.map(appointment => {
                    const patient = patientsData[appointment.patientId];
                    return (
                      <tr key={appointment.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {patient?.photo ? (
                              <img src={patient.photo} alt="" className="rounded-circle me-2"
                                   style={{width: "40px", height: "40px", objectFit: "cover"}} />
                            ) : (
                              <div className="rounded-circle bg-light me-2 d-flex align-items-center justify-content-center"
                                   style={{width: "40px", height: "40px"}}>
                                <span className="h6 mb-0">{patient?.nom?.[0]}{patient?.prenom?.[0]}</span>
                              </div>
                            )}
                            <div>
                              <h6 className="mb-0">{patient?.nom} {patient?.prenom}</h6>
                              <small className="text-muted">{patient?.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{appointment.timeSlot}</td>
                        <td>
                          <Badge bg={appointment.status === "completed" ? "success" : 
                                   appointment.status === "scheduled" ? "primary" : "warning"}>
                            {appointment.status}
                          </Badge>
                        </td>
                        <td>
                          <ButtonGroup size="sm">
                            <Button variant="outline-primary" onClick={() => handleContactPatient("email", patient?.email)}>
                              <FaEnvelope />
                            </Button>
                            <Button variant="outline-success" onClick={() => handleContactPatient("phone", patient?.telephone)}>
                              <FaPhone />
                            </Button>
                            <Button variant="outline-info" onClick={() => handleContactPatient("video", patient?.id)}>
                              <FaVideo />
                            </Button>
                            <Button variant="outline-warning" 
                                    onClick={() => handleToggleStatus(appointment.id, appointment.status)}>
                              {appointment.status === "scheduled" ? <FaCheck /> : <FaRedo />}
                            </Button>
                            {appointment.status === "completed" && (
                              <Button variant="outline-danger" onClick={() => handleDeleteAppointment(appointment.id)}>
                                <FaTrash />
                              </Button>
                            )}
                          </ButtonGroup>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}
{/* Structure Patients Section */}
{(viewMode === "both" || viewMode === "structure") && (
<Row className="mb-4">
<Col>
<Card className="shadow-lg border-0 rounded-3">
<Card.Header className="bg-gradient bg-primary text-white py-3">
<div className="d-flex justify-content-between align-items-center px-3">
<h5 className="mb-0 d-flex align-items-center">
<FaHospital className="me-2" size={24} />
<span className="d-none d-sm-inline">
Patients assignés par les structures
</span>
<span className="d-sm-none">Patients structures</span>
</h5>
<div className="d-flex align-items-center gap-3">
<ButtonGroup>
<Button
variant="light"
size="sm"
onClick={() => setViewType("grid")}
>
<i className="fas fa-th-large"></i>
</Button>
<Button
variant="light"
size="sm"
onClick={() => setViewType("table")}
>
<i className="fas fa-list"></i>
</Button>
</ButtonGroup>
<Badge
bg="light"
text="dark"
className="px-3 py-2 rounded-pill"
>
{structurePatients.length} patients
</Badge>
</div>
</div>
</Card.Header>


<Card.Body className="p-0">
{viewType === "grid" ? (
<Row className="g-4 p-4">
{structurePatients.map((patient) => (
<Col key={patient.id} xs={12} md={6} lg={4} xl={3}>
<Card className="h-100 shadow-sm hover-lift">
<Card.Body>
<div className="text-center mb-3">
{patient.photo ? (
<img
src={patient.photo}
alt=""
className="rounded-circle mb-2 shadow-sm"
style={{
width: "80px",
height: "80px",
objectFit: "cover"
}}
/>
) : (
<div
className="rounded-circle bg-light mx-auto mb-2 d-flex align-items-center justify-content-center"
style={{ width: "80px", height: "80px" }}
>
<span className="h4 mb-0">
{patient.nom[0]}
{patient.prenom[0]}
</span>
</div>
)}
<h6 className="mb-1">
{patient.nom} {patient.prenom}
</h6>
<div className="d-flex justify-content-center gap-2 mb-2">
<Badge bg="secondary">{patient.age} ans</Badge>
<Badge bg="info">{patient.sexe}</Badge>
</div>
<Badge bg="primary" className="mb-3">
{patient.structure?.name}
</Badge>
</div>


{patient.appointment && (
<div className="bg-light p-3 rounded mb-3">
<small className="d-block text-muted mb-1">
<FaCalendarAlt className="me-2" />
{patient.appointment.day}
</small>
<small className="d-block text-muted mb-2">
<i className="fas fa-clock me-2"></i>
{patient.appointment.timeSlot}
</small>
<Badge
bg={
patient.appointment.status === "completed"
? "success"
: patient.appointment.status ===
"scheduled"
? "primary"
: "warning"
}
className="w-100 py-2"
>
{patient.appointment.status}
</Badge>
</div>
)}


<div className="d-grid gap-2">
<ButtonGroup size="sm">
<Button
variant="outline-primary"
onClick={() =>
handleContactPatient("email", patient.email)
}
>
<FaEnvelope className="me-1" />
Email
</Button>
<Button
variant="outline-success"
onClick={() =>
handleContactPatient(
"phone",
patient.telephone
)
}
>
<FaPhone className="me-1" />
Appeler
</Button>
</ButtonGroup>
<ButtonGroup size="sm">
<Button
variant="outline-info"
onClick={() =>
handleContactPatient("video", patient.id)
}
>
<FaVideo className="me-1" />
Vidéo
</Button>
<Button
variant="outline-info"
onClick={() => {
setSelectedPatient(patient);
setShowMessagerieModal(true);
}}
>
<FaComment className="me-1" />
Message
</Button>
</ButtonGroup>


{patient.appointment && (
<ButtonGroup size="sm">
<Button
variant="outline-warning"
onClick={() =>
handleToggleStatus(
patient.appointment.id,
patient.appointment.status
)
}
>
<FaCalendarAlt className="me-1" />
{patient.appointment.status === "scheduled"
? "Terminer"
: "Réactiver"}
</Button>


{patient.appointment.status ===
"completed" && (
<Button
variant="outline-danger"
onClick={() =>
handleDeleteAppointment(
patient.appointment.id
)
}
>
<i className="fas fa-trash me-1"></i>
Supprimer
</Button>
)}


<Button
variant="outline-primary"
onClick={() => {
setSelectedAppointment(
patient.appointment
);
setShowExtendModal(true);
}}
>
<FaCalendarAlt className="me-1" />
Prolonger
</Button>
<Button
variant="outline-info"
size="sm"
onClick={() => {
setSelectedPatientDetails(patient);
setShowPatientInfoModal(true);
}}
>
<i className="fas fa-info-circle me-1"></i>
Détails
</Button>
</ButtonGroup>
)}
</div>
</Card.Body>
</Card>
</Col>
))}
</Row>
) : (
<div className="table-responsive">
<Table hover className="align-middle mb-0">
<thead className="bg-light">
<tr>
<th className="border-0 px-3 py-3">Patient</th>
<th className="border-0 px-3 py-3 d-none d-md-table-cell">
Structure
</th>
<th className="border-0 px-3 py-3">Rendez-vous</th>
<th className="border-0 px-3 py-3 d-none d-lg-table-cell">
Contact
</th>
<th className="border-0 px-3 py-3">Actions</th>
</tr>
</thead>
<tbody>
{structurePatients.map((patient) => (
<tr key={patient.id} className="border-bottom">
<td className="px-3 py-3">
<div className="d-flex align-items-center">
{patient.photo ? (
<img
src={patient.photo}
alt=""
className="rounded-circle me-3 shadow-sm"
style={{
width: "48px",
height: "48px",
objectFit: "cover"
}}
/>
) : (
<div
className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
style={{ width: "48px", height: "48px" }}
>
<span className="h5 mb-0">
{patient.nom[0]}
{patient.prenom[0]}
</span>
</div>
)}
<div>
<h6 className="mb-1">
{patient.nom} {patient.prenom}
</h6>
<div className="d-flex gap-2">
<small className="text-muted">
{patient.age} ans
</small>
<small className="text-muted">
{patient.sexe}
</small>
</div>
</div>
</div>
</td>


<td className="px-3 py-3 d-none d-md-table-cell">
<span className="badge bg-info bg-opacity-10 text-info px-3 py-2">
{patient.structure?.name}
</span>
</td>


<td className="px-3 py-3">
{patient.appointment ? (
<div className="d-flex flex-column gap-1">
<small className="text-muted">
<FaCalendarAlt className="me-2" />
{patient.appointment.day}
</small>
<small className="text-muted">
<i className="fas fa-clock me-2"></i>
{patient.appointment.timeSlot}
</small>
<Badge
bg={
patient.appointment.status === "completed"
? "success"
: patient.appointment.status ===
"scheduled"
? "primary"
: "warning"
}
className="rounded-pill px-3"
>
{patient.appointment.status}
</Badge>
</div>
) : (
<Badge
bg="secondary"
className="rounded-pill px-3"
>
Pas de RDV
</Badge>
)}
</td>


<td className="px-3 py-3 d-none d-lg-table-cell">
<div className="d-flex flex-column gap-1">
<small>
<FaEnvelope className="me-2 text-muted" />
{patient.email}
</small>
<small>
<FaPhone className="me-2 text-muted" />
{patient.telephone}
</small>
</div>
</td>


<td className="px-3 py-3">
<div className="d-flex flex-column gap-2">
<ButtonGroup size="sm">
<Button
variant="outline-primary"
onClick={() =>
handleContactPatient(
"email",
patient.email
)
}
>
<FaEnvelope className="me-1" />
Email
</Button>
<Button
variant="outline-success"
onClick={() =>
handleContactPatient(
"phone",
patient.telephone
)
}
>
<FaPhone className="me-1" />
Appeler
</Button>
</ButtonGroup>


<ButtonGroup size="sm">
<Button
variant="outline-info"
onClick={() =>
handleContactPatient("video", patient.id)
}
>
<FaVideo className="me-1" />
Vidéo
</Button>
<Button
variant="outline-info"
onClick={() => {
setSelectedPatient(patient);
setShowMessagerieModal(true);
}}
>
<FaComment className="me-1" />
Message
</Button>
</ButtonGroup>


{patient.appointment && (
<ButtonGroup size="sm">
<Button
variant="outline-warning"
onClick={() =>
handleToggleStatus(
patient.appointment.id,
patient.appointment.status
)
}
>
<FaCalendarAlt className="me-1" />
{patient.appointment.status ===
"scheduled"
? "Terminer"
: "Réactiver"}
</Button>


{patient.appointment.status ===
"completed" && (
<Button
variant="outline-danger"
onClick={() =>
handleDeleteAppointment(
patient.appointment.id
)
}
>
<i className="fas fa-trash me-1"></i>
Supprimer
</Button>
)}


<Button
variant="outline-primary"
onClick={() => {
setSelectedAppointment(
patient.appointment
);
setShowExtendModal(true);
}}
>
<FaCalendarAlt className="me-1" />
Prolonger
</Button>
</ButtonGroup>
)}
</div>
</td>
</tr>
))}
</tbody>
</Table>
</div>
)}
</Card.Body>
</Card>
</Col>
</Row>
)}




{(viewMode === 'both' || viewMode === 'private') && (
  <Row className="g-4">
    <Col xs={12}>
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
          <h5 className="mb-0 d-flex align-items-center">
            <FaUserMd className="me-2" />
            Patients et Rendez-vous  privés
          </h5>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <Badge bg="light" text="dark" className="px-3 py-2">
              {privatePatients.length} patients
            </Badge>
            <Button
variant="light"
size="sm"
onClick={() => setShowAddPatientModal(true)}
>
<i className="fas fa-plus me-2"></i>
Nouveau patient privé
</Button>
          </div>
        </Card.Header>

        <Card.Body className="p-3">
          <Row xs={1} md={2} lg={3} className="g-4">
            {privatePatients.map(patient => (
              <Col key={patient.id}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Body>
                    <div className="d-flex flex-column flex-sm-row align-items-start gap-3">
                      <div className="patient-image-container">
                        {patient.photo ? (
                          <img
                            src={patient.photo}
                            alt=""
                            className="rounded-circle"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="patient-avatar bg-light rounded-circle d-flex align-items-center justify-content-center" 
                               style={{ width: '80px', height: '80px' }}>
                            <span className="h4 mb-0">{patient.nom[0]}{patient.prenom[0]}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow-1">
                        <h5 className="mb-2">{patient.nom} {patient.prenom}</h5>
                        <div className="d-flex flex-wrap gap-2 mb-3">
        
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-3">
  <Badge bg="secondary">{patient.age} ans</Badge>
  <Badge bg="info">{patient.sexe}</Badge>
  <Badge bg={
    patient.status === 'active' ? 'success' :
    patient.status === 'pending' ? 'warning' :
    patient.status === 'inactive' ? 'danger' :
    'secondary'
  }>
    {patient.status === 'active' ? 'Actif' :
     patient.status === 'pending' ? 'En attente' :
     patient.status === 'inactive' ? 'Inactif' :
     'Archivé'
    }
  </Badge>
</div>


                        {/* Appointment Status */}
                        {patient.appointment && (
                          <div className="mb-3 p-2 bg-light rounded">
                            <Badge bg={
                              patient.appointment.status === 'completed' ? 'success' :
                              patient.appointment.status === 'scheduled' ? 'primary' : 'warning'
                            } className="d-block mb-2">
                              {patient.appointment.status === 'completed' ? 'Terminé' : 'Programmé'}
                            </Badge>
                            <small className="text-muted d-block">
                              <FaCalendarAlt className="me-1" />
                              {patient.appointment.day}
                            </small>
                            <small className="text-muted d-block">
                              <i className="fas fa-clock me-1"></i>
                              {patient.appointment.timeSlot}
                            </small>
                          </div>
                        )}

                        <div className="contact-info mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <FaEnvelope className="me-2 text-muted" />
                            <small>{patient.email}</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <FaPhone className="me-2 text-muted" />
                            <small>{patient.telephone}</small>
                          </div>
                        </div>

                        <div className="availability-section bg-light p-2 rounded mb-3">
                          <h6 className="text-primary mb-2">
                            <FaCalendarAlt className="me-2" />
                            Disponibilités
                          </h6>
                          <div className="d-flex flex-wrap gap-1">
                            {patient.joursDisponibles?.map(jour => (
                              <Badge key={jour} bg="white" text="dark" className="border">
                                {jour}
                              </Badge>
                            ))}
                          </div>
                          <small className="text-muted d-block mt-2">
                            <i className="fas fa-clock me-1"></i>
                            {patient.appointmentSettings?.heureDebut} - {patient.appointmentSettings?.heureFin}
                          </small>
                        </div>

                        <div className="actions">
                          <div className="d-grid gap-2">
                        

                            <ButtonGroup size="sm" className="w-100 flex-wrap">
                              <Button variant="outline-info" className="flex-grow-1" 
                                      onClick={() => handleContactPatient('email', patient.email, patient)}>
                                <FaEnvelope className="me-1" />Email
                              </Button>
                              <Button variant="outline-success" className="flex-grow-1" 
                                      onClick={() => handleContactPatient('phone', patient.telephone, patient)}>
                                <FaPhone className="me-1" />Appeler
                              </Button>
                              <Button variant="outline-primary" className="flex-grow-1" 
                                      onClick={() => handleContactPatient('video', null, patient)}>
                                <FaVideo className="me-1" />Vidéo
                              </Button>
                            </ButtonGroup>

                            <ButtonGroup size="sm" className="w-100">
                                {/*
                              <Button variant="outline-info" className="flex-grow-1" 
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setShowMessagerieModal(true);
                                      }}>
                                <FaComment className="me-1" />Message
                              </Button>*/}
                              <Button variant="outline-warning" className="flex-grow-1" 
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setEditedPatientInfo({...patient});
                                        setShowEditPatientModal(true);
                                      }}>
                                <FaEdit className="me-1" />Modifier
                              </Button>
                              <Button variant="outline-danger" className="flex-grow-1" 
                                      onClick={() => handleDeletePatient(patient.id, true)}>
                                <FaTrash className="me-1" />Supprimer
                              </Button>
                            </ButtonGroup>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}



        {/* Add Private Patient Modal */}
        <Modal
          show={showAddPatientModal}
          onHide={() => setShowAddPatientModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>
              <i className="fas fa-user-plus me-2"></i>
              Ajouter un patient privé
            </Modal.Title>
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
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, nom: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={newPatient.prenom}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, prenom: e.target.value })
                      }
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
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, age: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sexe</Form.Label>
                    <Form.Select
                      value={newPatient.sexe}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, sexe: e.target.value })
                      }
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
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, email: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPatient.password}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, password: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={newPatient.telephone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, telephone: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={newPatient.status}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, status: e.target.value })
                  }
                >
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="inactive">Inactif</option>
                  <option value="archived">Archivé</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Jours disponibles</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    "Lundi",
                    "Mardi",
                    "Mercredi",
                    "Jeudi",
                    "Vendredi",
                    "Samedi"
                  ].map((day) => (
                    <Form.Check
                      key={day}
                      type="checkbox"
                      label={day}
                      checked={selectedDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDays([...selectedDays, day]);
                        } else {
                          setSelectedDays(selectedDays.filter((d) => d !== day));
                        }
                      }}
                      className="me-3"
                    />
                  ))}
                </div>
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure début</Form.Label>
                    <Form.Control
                      type="time"
                      value={newPatient.heureDebut}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          heureDebut: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={newPatient.heureFin}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, heureFin: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Durée consultation (min)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newPatient.consultationDuration}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          consultationDuration: parseInt(e.target.value)
                        })
                      }
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
                  onChange={(e) => setPatientPhotoFile(e.target.files[0])}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Documents Médicaux</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setNewPatient({
                      ...newPatient,
                      documents: files
                    });
                  }}
                />
                <Form.Text className="text-muted">
                  Formats acceptés: PDF, JPG, JPEG, PNG
                </Form.Text>
              </Form.Group>

              {newPatient.documents && newPatient.documents.length > 0 && (
                <div className="mb-3">
                  <h6>Documents sélectionnés:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {newPatient.documents.map((doc, index) => (
                      <Badge
                        key={index}
                        bg="info"
                        className="d-flex align-items-center"
                      >
                        <span className="me-2">
                          <i
                            className={`fas fa-${
                              doc.type.includes("pdf") ? "file-pdf" : "file-image"
                            }`}
                          ></i>
                          {doc.name}
                        </span>
                        <Button
                          variant="link"
                          className="p-0 text-white"
                          onClick={() => {
                            setNewPatient({
                              ...newPatient,
                              documents: newPatient.documents.filter(
                                (_, i) => i !== index
                              )
                            });
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddPatientModal(false)}
            >
              Annuler
            </Button>
            <Button variant="success" onClick={handleAddPatient}>
              Ajouter le patient
            </Button>
          </Modal.Footer>
        </Modal>

        <style jsx>{`
          .private-patients-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            padding: 1rem;
          }

          .patient-card {
            transition: transform 0.2s ease-in-out;
          }

          .patient-card:hover {
            transform: translateY(-5px);
          }

          .patient-avatar {
            width: 60px;
            height: 60px;
            background-color: #e9ecef;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: bold;
            color: #6c757d;
          }

          .days-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        `}</style>

        <Modal show={showExtendModal} onHide={() => setShowExtendModal(false)}>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-calendar-plus me-2"></i>
              Modifier le rendez-vous
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label>
                  <i className="fas fa-calendar-day me-2"></i>
                  Sélectionner les jours
                </Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {doctorInfo.disponibilite?.map((day) => (
                    <Button
                      key={day}
                      variant={
                        extensionDays.includes(day)
                          ? "primary"
                          : "outline-primary"
                      }
                      className="rounded-pill"
                      onClick={() => {
                        if (extensionDays.includes(day)) {
                          setExtensionDays(
                            extensionDays.filter((d) => d !== day)
                          );
                        } else {
                          setExtensionDays([...extensionDays, day]);
                        }
                      }}
                    >
                      <i className="fas fa-calendar-check me-2"></i>
                      {day}
                    </Button>
                  ))}
                </div>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="fas fa-clock me-2"></i>
                      Nouvelle heure de début
                    </Form.Label>
                    <Form.Control
                      type="time"
                      value={selectedAppointment?.timeSlot || ""}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <i className="fas fa-clock me-2"></i>
                      Nouvelle heure de fin
                    </Form.Label>
                    <Form.Control
                      type="time"
                      value={extensionTime}
                      onChange={(e) => setExtensionTime(e.target.value)}
                      className="border-primary"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowExtendModal(false)}
            >
              <i className="fas fa-times me-2"></i>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleExtendAppointment(selectedAppointment.id)}
              disabled={extensionDays.length === 0 || !extensionTime}
            >
              <i className="fas fa-save me-2"></i>
              Confirmer les modifications
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          show={showEditProfileModal}
          onHide={() => setShowEditProfileModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-edit me-2"></i>
              Modifier mon profil
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedDoctorInfo?.nom || ""}
                      onChange={(e) =>
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          nom: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedDoctorInfo?.prenom || ""}
                      onChange={(e) =>
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          prenom: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Spécialité</Form.Label>
                <Form.Control
                  type="text"
                  value={editedDoctorInfo?.specialite || ""}
                  onChange={(e) =>
                    setEditedDoctorInfo({
                      ...editedDoctorInfo,
                      specialite: e.target.value
                    })
                  }
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={editedDoctorInfo?.email || ""}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={editedDoctorInfo?.telephone || ""}
                      onChange={(e) =>
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          telephone: e.target.value
                        })
                      }
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
                      value={editedDoctorInfo?.heureDebut || ""}
                      onChange={(e) =>
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          heureDebut: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={editedDoctorInfo?.heureFin || ""}
                      onChange={(e) =>
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          heureFin: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Jours disponibles</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    "Lundi",
                    "Mardi",
                    "Mercredi",
                    "Jeudi",
                    "Vendredi",
                    "Samedi",
                    "Dimanche"
                  ].map((day) => (
                    <Form.Check
                      key={day}
                      type="checkbox"
                      label={day}
                      checked={editedDoctorInfo?.disponibilite?.includes(day)}
                      onChange={(e) => {
                        const updatedDays = e.target.checked
                          ? [...(editedDoctorInfo?.disponibilite || []), day]
                          : editedDoctorInfo?.disponibilite?.filter(
                              (d) => d !== day
                            );
                        setEditedDoctorInfo({
                          ...editedDoctorInfo,
                          disponibilite: updatedDays
                        });
                      }}
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Photo de profil</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const photoRef = ref(
                        storage,
                        `doctors/${doctorInfo.id}/profile`
                      );
                      await uploadBytes(photoRef, file);
                      const photoUrl = await getDownloadURL(photoRef);
                      setEditedDoctorInfo({
                        ...editedDoctorInfo,
                        photo: photoUrl
                      });
                    }
                  }}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditProfileModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await updateDoc(
                    doc(db, "medecins", doctorInfo.id),
                    editedDoctorInfo
                  );
                  localStorage.setItem(
                    "doctorData",
                    JSON.stringify(editedDoctorInfo)
                  );
                  window.location.reload();
                  setMessage("Profil mis à jour avec succès");
                  setShowEditProfileModal(false);
                } catch (error) {
                  setMessage("Erreur lors de la mise à jour: " + error.message);
                }
              }}
            >
              Enregistrer les modifications
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal pour choisir les structures */}
        <Modal
          show={showStructureModal}
          onHide={() => setShowStructureModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>S'associer à des structures</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              {availableStructures.map((structure) => (
                <Form.Check
                  key={structure.id}
                  type="checkbox"
                  label={structure.name}
                  checked={selectedStructures.includes(structure.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStructures([
                        ...selectedStructures,
                        structure.id
                      ]);
                    } else {
                      setSelectedStructures(
                        selectedStructures.filter((id) => id !== structure.id)
                      );
                    }
                  }}
                />
              ))}
            </Form>

            {pendingRequests.length > 0 && (
              <div className="mt-3">
                <h6>Demandes en attente:</h6>
                {pendingRequests.map((request) => (
                  <div key={request.id} className="text-muted">
                    {
                      availableStructures.find(
                        (s) => s.id === request.structureId
                      )?.name
                    }
                    <Badge bg="warning" className="ms-2">
                      En attente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowStructureModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAssociationRequest}
              disabled={selectedStructures.length === 0}
            >
              Envoyer la demande
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showMessagerieModal}
          onHide={() => setShowMessagerieModal(false)}
          size="xl"
          fullscreen
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaComment className="me-2" />
              Messagerie Patient
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <MessageriesPatients
              selectedPatient={selectedPatient}
              onClose={() => setShowMessagerieModal(false)}
            />
          </Modal.Body>
        </Modal>

        {/* Modal d'édition du patient */}
        <Modal
          show={showEditPatientModal}
          onHide={() => setShowEditPatientModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-warning text-white">
            <Modal.Title>
              <FaEdit className="me-2" />
              Modifier le patient
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedPatientInfo?.nom || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          nom: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prénom</Form.Label>
                    <Form.Control
                      type="text"
                      value={editedPatientInfo?.prenom || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          prenom: e.target.value
                        })
                      }
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
                      value={editedPatientInfo?.age || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          age: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sexe</Form.Label>
                    <Form.Select
                      value={editedPatientInfo?.sexe || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          sexe: e.target.value
                        })
                      }
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
                      value={editedPatientInfo?.email || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          email: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={editedPatientInfo?.telephone || ""}
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          telephone: e.target.value
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={editedPatientInfo?.status || ""}
                    onChange={(e) =>
                      setEditedPatientInfo({
                        ...editedPatientInfo,
                        status: e.target.value
                      })
                    }
                  >
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="inactive">Inactif</option>
                    <option value="archived">Archivé</option>
                  </Form.Select>
                </Form.Group>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Jours disponibles</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    "Lundi",
                    "Mardi",
                    "Mercredi",
                    "Jeudi",
                    "Vendredi",
                    "Samedi"
                  ].map((day) => (
                    <Form.Check
                      key={day}
                      type="checkbox"
                      label={day}
                      checked={editedPatientInfo?.joursDisponibles?.includes(day)}
                      onChange={(e) => {
                        const updatedDays = e.target.checked
                          ? [...(editedPatientInfo?.joursDisponibles || []), day]
                          : editedPatientInfo?.joursDisponibles?.filter(
                              (d) => d !== day
                            );
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          joursDisponibles: updatedDays
                        });
                      }}
                    />
                  ))}
                </div>
              </Form.Group>
              {/* Add this inside the Edit Patient Modal Form */}
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure début</Form.Label>
                    <Form.Control
                      type="time"
                      value={
                        editedPatientInfo?.appointmentSettings?.heureDebut || ""
                      }
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          appointmentSettings: {
                            ...editedPatientInfo.appointmentSettings,
                            heureDebut: e.target.value
                          }
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heure fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={
                        editedPatientInfo?.appointmentSettings?.heureFin || ""
                      }
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          appointmentSettings: {
                            ...editedPatientInfo.appointmentSettings,
                            heureFin: e.target.value
                          }
                        })
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Durée consultation (min)</Form.Label>
                    <Form.Control
                      type="number"
                      value={
                        editedPatientInfo?.appointmentSettings
                          ?.consultationDuration || 30
                      }
                      onChange={(e) =>
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          appointmentSettings: {
                            ...editedPatientInfo.appointmentSettings,
                            consultationDuration: parseInt(e.target.value)
                          }
                        })
                      }
                      min="15"
                      step="15"
                    />
                  </Form.Group>
                </Col>
                <Form.Group className="mb-3">
                  <Form.Label>Photo de profil</Form.Label>
                  {editedPatientInfo?.photo && (
                    <div className="mb-2">
                      <img
                        src={editedPatientInfo.photo}
                        alt="Current"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover"
                        }}
                        className="rounded"
                      />
                    </div>
                  )}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const photoRef = ref(
                          storage,
                          `patients/${editedPatientInfo.id}/profile`
                        );
                        await uploadBytes(photoRef, file);
                        const photoUrl = await getDownloadURL(photoRef);
                        setEditedPatientInfo({
                          ...editedPatientInfo,
                          photo: photoUrl
                        });
                      }
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Documents Médicaux</Form.Label>
                  <div className="mb-2">
                    {editedPatientInfo?.documents?.map((doc, index) => (
                      <div key={index} className="d-flex align-items-center mb-2">
                        <i
                          className={`fas fa-${
                            doc.includes(".pdf") ? "file-pdf" : "image"
                          } me-2`}
                        ></i>
                        <span>{`Document ${index + 1}`}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => {
                            const newDocs = editedPatientInfo.documents.filter(
                              (_, i) => i !== index
                            );
                            setEditedPatientInfo({
                              ...editedPatientInfo,
                              documents: newDocs
                            });
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Form.Control
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files);
                      const uploadedUrls = await Promise.all(
                        files.map(async (file) => {
                          const fileRef = ref(
                            storage,
                            `patients/${
                              editedPatientInfo.id
                            }/medical-docs/${Date.now()}_${file.name}`
                          );
                          await uploadBytes(fileRef, file);
                          return getDownloadURL(fileRef);
                        })
                      );
                      setEditedPatientInfo({
                        ...editedPatientInfo,
                        documents: [
                          ...(editedPatientInfo.documents || []),
                          ...uploadedUrls
                        ]
                      });
                    }}
                  />
                </Form.Group>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEditPatientModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="warning"
              onClick={async () => {
                try {
                  await updateDoc(
                    doc(db, "patients", editedPatientInfo.id),
                    editedPatientInfo
                  );
                  setPrivatePatients(
                    privatePatients.map((p) =>
                      p.id === editedPatientInfo.id ? editedPatientInfo : p
                    )
                  );
                  setShowEditPatientModal(false);
                  setMessage("Patient modifié avec succès");
                } catch (error) {
                  setMessage("Erreur lors de la modification: " + error.message);
                }
              }}
            >
              Enregistrer les modifications
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Notes Modal */}
        <Modal
          show={showNotesModal}
          onHide={() => setShowNotesModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-sticky-note me-2"></i>
              Ajouter une note - {selectedPatientForNotes?.nom}{" "}
              {selectedPatientForNotes?.prenom}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Saisissez votre note ici..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fichiers</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) => setNoteFiles(Array.from(e.target.files))}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddNote}>
              Enregistrer la note
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Patient Details Modal */}
        <Modal
          show={showPatientDetailsModal}
          onHide={() => setShowPatientDetailsModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>
              <i className="fas fa-user-circle me-2"></i>
              Détails du patient
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatientForNotes && (
              <div>
                <div className="d-flex align-items-center mb-4">
                  {selectedPatientForNotes.photo ? (
                    <img
                      src={selectedPatientForNotes.photo}
                      alt=""
                      className="rounded-circle me-3"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-light me-3 d-flex align-items-center justify-content-center"
                      style={{ width: "100px", height: "100px" }}
                    >
                      <span className="h3 mb-0">
                        {selectedPatientForNotes.nom[0]}
                        {selectedPatientForNotes.prenom[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4>
                      {selectedPatientForNotes.nom}{" "}
                      {selectedPatientForNotes.prenom}
                    </h4>
                    <p className="text-muted mb-0">
                      {selectedPatientForNotes.email}
                    </p>
                  </div>
                </div>

                <h5 className="mb-3">Notes et fichiers</h5>
                {patientNotes[selectedPatientForNotes.id]?.map((note) => (
                  <Card key={note.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <small className="text-muted">
                            <i className="fas fa-calendar-alt me-2"></i>
                            {new Date(note.date).toLocaleDateString()}
                          </small>
                          {note.isShared && (
                            <Badge bg="info" className="ms-2">
                              <i className="fas fa-share-alt me-1"></i>
                              Partagé
                            </Badge>
                          )}
                        </div>
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-warning"
                            onClick={() => {
                              setEditingNote(note.id);
                              setEditedNoteContent(note.content);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Êtes-vous sûr de vouloir supprimer cette note ?"
                                )
                              ) {
                                handleDeleteNote(note.id);
                              }
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </ButtonGroup>
                      </div>

                      {editingNote === note.id ? (
                        <Form className="mb-3">
                          <Form.Group>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={editedNoteContent}
                              onChange={(e) =>
                                setEditedNoteContent(e.target.value)
                              }
                            />
                          </Form.Group>
                          <div className="d-flex justify-content-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingNote(null);
                                setEditedNoteContent("");
                              }}
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                handleEditNote(note.id, editedNoteContent)
                              }
                            >
                              Enregistrer
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <p className="mb-3">{note.content}</p>
                      )}

                      {note.files?.length > 0 && (
                        <div>
                          <h6 className="mb-2">Fichiers joints:</h6>
                          <Carousel
                            activeIndex={carouselIndex}
                            onSelect={(selectedIndex) =>
                              setCarouselIndex(selectedIndex)
                            }
                            className="file-preview-carousel mb-3"
                          >
                            {note.files.map((file, fileIndex) => (
                              <Carousel.Item key={fileIndex}>
                                {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="d-block w-100 cursor-pointer"
                                    style={{
                                      height: "300px",
                                      objectFit: "contain"
                                    }}
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setShowFilePreview(true);
                                    }}
                                  />
                                ) : file.url.match(/\.(pdf)$/i) ? (
                                  <div
                                    className="d-flex align-items-center justify-content-center bg-light"
                                    style={{ height: "300px" }}
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setShowFilePreview(true);
                                    }}
                                  >
                                    <i className="fas fa-file-pdf fa-3x text-danger"></i>
                                  </div>
                                ) : (
                                  <div
                                    className="d-flex align-items-center justify-content-center bg-light"
                                    style={{ height: "300px" }}
                                  >
                                    <i className="fas fa-file fa-3x text-secondary"></i>
                                  </div>
                                )}
                                <Carousel.Caption className="bg-dark bg-opacity-50">
                                  <p className="mb-0">{file.name}</p>
                                </Carousel.Caption>
                              </Carousel.Item>
                            ))}
                          </Carousel>
                          <div className="d-flex flex-wrap gap-2">
                            {note.files.map((file, fileIndex) => (
                              <Button
                                key={fileIndex}
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedFile(file);
                                  setShowFilePreview(true);
                                }}
                              >
                                <i className="fas fa-file me-2"></i>
                                {file.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Fullscreen File Preview Modal */}
        <Modal
          show={showFilePreview}
          onHide={() => setShowFilePreview(false)}
          fullscreen
        >
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title>{selectedFile?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="bg-dark d-flex align-items-center justify-content-center p-0">
            {selectedFile &&
              (selectedFile.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100vh",
                    objectFit: "contain"
                  }}
                />
              ) : selectedFile.url.match(/\.(pdf)$/i) ? (
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.name}
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                />
              ) : (
                <div className="text-white text-center">
                  <i className="fas fa-file fa-5x mb-3"></i>
                  <h4>Ce type de fichier ne peut pas être prévisualisé</h4>
                  <Button
                    variant="light"
                    href={selectedFile.url}
                    target="_blank"
                    className="mt-3"
                  >
                    Télécharger le fichier
                  </Button>
                </div>
              ))}
          </Modal.Body>
        </Modal>

        <style jsx>{`
          .file-preview-carousel {
            background-color: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
          }

          .cursor-pointer {
            cursor: pointer;
          }

          .carousel-caption {
            border-radius: 4px;
          }
        `}</style>
        <Modal
          show={showDoctorAssociationModal}
          onHide={() => setShowDoctorAssociationModal(false)}
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-md me-2"></i>
              Association avec un médecin
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner un médecin</Form.Label>
                <Form.Select
                  value={selectedDoctor?.id || ""}
                  onChange={(e) => {
                    const doctor = availableDoctors.find(
                      (d) => d.id === e.target.value
                    );
                    setSelectedDoctor(doctor);
                  }}
                >
                  <option value="">Choisir un médecin...</option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>

            {doctorAssociations.map((assoc) => (
              <Alert
                key={assoc.id}
                variant={assoc.status === "pending" ? "warning" : "success"}
              >
                Association avec {assoc.targetDoctorName} - {assoc.status}
              </Alert>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDoctorAssociationModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleDoctorAssociationRequest}
              disabled={!selectedDoctor}
            >
              Envoyer la demande
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Patient Info Modal */}
        <Modal
          show={showPatientInfoModal}
          onHide={() => setShowPatientInfoModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-user-circle me-2"></i>
              Informations du patient
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatientDetails && (
              <div className="patient-details">
                <Row>
                  <Col md={4} className="text-center mb-4">
                    {selectedPatientDetails.photo ? (
                      <img
                        src={selectedPatientDetails.photo}
                        alt="Patient"
                        className="rounded-circle mb-3"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      <div
                        className="avatar-placeholder rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center"
                        style={{
                          width: "150px",
                          height: "150px",
                          backgroundColor: "#e9ecef"
                        }}
                      >
                        <span className="h1 mb-0 text-secondary">
                          {selectedPatientDetails.nom?.[0]}
                          {selectedPatientDetails.prenom?.[0]}
                        </span>
                      </div>
                    )}
                    <h4>
                      {selectedPatientDetails.nom} {selectedPatientDetails.prenom}
                    </h4>
                    <Badge bg="primary" className="mb-2">
                      {selectedPatientDetails.status}
                    </Badge>
                  </Col>

                  <Col md={8}>
                    <Card className="mb-3">
                      <Card.Body>
                        <h5 className="mb-3">Informations personnelles</h5>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Âge:
                          </Col>
                          <Col sm={8}>{selectedPatientDetails.age} ans</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Sexe:
                          </Col>
                          <Col sm={8}>{selectedPatientDetails.sexe}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Email:
                          </Col>
                          <Col sm={8}>{selectedPatientDetails.email}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Téléphone:
                          </Col>
                          <Col sm={8}>{selectedPatientDetails.telephone}</Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    <Card className="mb-3">
                      <Card.Body>
                        <h5 className="mb-3">Disponibilités</h5>
                        <div className="mb-2">
                          <strong className="text-muted">Jours:</strong>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {selectedPatientDetails.joursDisponibles?.map(
                              (jour) => (
                                <Badge key={jour} bg="info" className="px-3 py-2">
                                  {jour}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <strong className="text-muted">Heures:</strong>
                          <p className="mb-0 mt-2">
                            {
                              selectedPatientDetails.appointmentSettings
                                ?.heureDebut
                            }{" "}
                            -{" "}
                            {selectedPatientDetails.appointmentSettings?.heureFin}
                          </p>
                        </div>
                      </Card.Body>
                    </Card>

                    {selectedPatientDetails.appointment && (
                      <Card>
                        <Card.Body>
                          <h5 className="mb-3">Rendez-vous actuel</h5>
                          <Row className="mb-2">
                            <Col sm={4} className="text-muted">
                              Date:
                            </Col>
                            <Col sm={8}>
                              {selectedPatientDetails.appointment.day}
                            </Col>
                          </Row>
                          <Row className="mb-2">
                            <Col sm={4} className="text-muted">
                              Heure:
                            </Col>
                            <Col sm={8}>
                              {selectedPatientDetails.appointment.timeSlot}
                            </Col>
                          </Row>
                          <Row>
                            <Col sm={4} className="text-muted">
                              Statut:
                            </Col>
                            <Col sm={8}>
                              <Badge
                                bg={
                                  selectedPatientDetails.appointment.status ===
                                  "completed"
                                    ? "success"
                                    : selectedPatientDetails.appointment
                                        .status === "scheduled"
                                    ? "primary"
                                    : "warning"
                                }
                              >
                                {selectedPatientDetails.appointment.status}
                              </Badge>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </Col>
                  <Col xs={12}>
                    <Card className="mt-3">
                      <Card.Body>
                        <h5 className="mb-3">Documents Médicaux</h5>
                        <Row className="g-3">
                          {selectedPatientDetails.documents?.map((doc, index) => (
                            <Col key={index} xs={6} md={4} lg={3}>
                              {doc.toLowerCase().endsWith(".pdf") ? (
                                <Card className="h-100">
                                  <Card.Body className="d-flex flex-column align-items-center">
                                    <i className="fas fa-file-pdf text-danger fa-2x mb-2"></i>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDocument(doc);
                                        setShowDocumentPreviewModal(true);
                                      }}
                                    >
                                      Document {index + 1}
                                    </Button>
                                  </Card.Body>
                                </Card>
                              ) : (
                                <Card className="h-100">
                                  <Card.Img
                                    variant="top"
                                    src={doc}
                                    style={{
                                      height: "120px",
                                      objectFit: "cover"
                                    }}
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowDocumentPreviewModal(true);
                                    }}
                                  />
                                  <Card.Body className="p-2 text-center">
                                    <small>Image {index + 1}</small>
                                  </Card.Body>
                                </Card>
                              )}
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal
          show={showDocumentPreviewModal}
          onHide={() => {
            setShowDocumentPreviewModal(false);
            setZoomLevel(1);
          }}
          size="xl"
          fullscreen
        >
          <Modal.Header closeButton className="bg-dark text-white">
            <Modal.Title>Aperçu du document</Modal.Title>
            <div className="ms-auto me-3">
              <Button
                variant="light"
                onClick={() => setZoomLevel((prev) => prev + 0.1)}
              >
                <i className="fas fa-search-plus"></i>
              </Button>
              <Button
                variant="light"
                className="ms-2"
                onClick={() => setZoomLevel((prev) => prev - 0.1)}
              >
                <i className="fas fa-search-minus"></i>
              </Button>
            </div>
          </Modal.Header>
          <Modal.Body className="bg-dark d-flex align-items-center justify-content-center">
            {selectedDocument?.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={selectedDocument}
                style={{
                  width: "100%",
                  height: "100vh",
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center"
                }}
              />
            ) : (
              <img
                src={selectedDocument}
                alt="Document preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s"
                }}
              />
            )}
          </Modal.Body>
        </Modal>

        <Modal
          show={showConsultationRequestsModal}
          onHide={() => setShowConsultationRequestsModal(false)}
          size="lg"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-calendar-plus me-2"></i>
              Demandes de consultation ({consultationRequests.length})
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {consultationRequests.length === 0 ? (
              <Alert variant="info">
                Aucune demande de consultation en attente
              </Alert>
            ) : (
              consultationRequests.map((request) => (
                <Card key={request.id} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h5>{request.patientName}</h5>
                        <p className="text-muted mb-2">
                          <i className="fas fa-calendar me-2"></i>
                          {request.preferredDay} à {request.preferredTime}
                        </p>
                        <p className="mb-0">{request.reason}</p>
                      </div>
                      <ButtonGroup>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAcceptConsultation(request)}
                        >
                          <i className="fas fa-check me-2"></i>
                          Accepter
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectConsultation(request)}
                        >
                          <i className="fas fa-times me-2"></i>
                          Refuser
                        </Button>
                      </ButtonGroup>
                    </div>
                  </Card.Body>
                </Card>
              ))
            )}
          </Modal.Body>
        </Modal>
        <Modal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)}>
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Suppression du compte
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-0">
              Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et entraînera :
            </p>
            <ul className="mt-3">
              <li>La suppression de toutes vos données</li>
              <li>La désaffiliation de toutes vos structures</li>
              <li>La suppression de tous les rendez-vous associés</li>
              <li>La suppression des liens avec vos patients</li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteDoctor}>
              <i className="fas fa-trash-alt me-2"></i>
              Confirmer la suppression
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={showQRModal}
          onHide={() => setShowQRModal(false)}
          size="md"
          centered
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-qr-code me-2"></i>
              Mon QR Code
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center p-4">
            <div className="mb-4">
              <QRCodeCanvas
                id="doctor-qr-code"
                value={`${window.location.origin}/qr-scan/${doctorInfo.id}`}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-muted mb-4">
              Les patients peuvent scanner ce code QR pour prendre rendez-vous avec vous.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                const canvas = document.getElementById("doctor-qr-code");
                const pngUrl = canvas
                  .toDataURL("image/png")
                  .replace("image/png", "image/octet-stream");
                let downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `qr-code-dr-${doctorInfo.nom}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }}
            >
              <i className="fas fa-download me-2"></i>
              Télécharger le QR Code
            </Button>
          </Modal.Body>
        </Modal>
      </Container>
    );
  };

  export default MedecinsDashboard;























///Partie Patient 



import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  ButtonGroup,
  Table,
  ListGroup,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../components/firebase-config.js";
import { QRCode } from "react-qr-code";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import {
  FaMapMarkerAlt,
  FaPlus,
  FaCheckCircle,
  FaInfoCircle,
  FaHospital,
  FaSearch,
  FaPaperPlane,
  FaFile,
  FaComment,
  FaTrash,
  FaEdit,
  FaQrcode,
  FaTimes,
  FaPrint,
  FaDownload,
  FaUser,
  FaUserMd,
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaSignOutAlt,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import "./PatientDashboard.css";

import Select from "react-select";

const PatientsDashboard = () => {
  const navigate = useNavigate();
  const patientData = JSON.parse(localStorage.getItem("patientData"));
  const [docRequests, setDocRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [createdByDoctors, setCreatedByDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [message, setMessage] = useState("");
  const [confirmedDoctors, setConfirmedDoctors] = useState(() => {
    const saved = localStorage.getItem("confirmedDoctors");
    return saved ? JSON.parse(saved) : {};
  });
  const [permanentConfirmations, setPermanentConfirmations] = useState(() => {
    const saved = localStorage.getItem("permanentConfirmations");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeTab, setActiveTab] = useState("accepted"); // Default tab is 'accepted'
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [consultationReason, setConsultationReason] = useState("");

  const [structures, setStructures] = useState([]);
  const [showStructureListModal, setShowStructureListModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [showAddToStructureModal, setShowAddToStructureModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);


  const [qrRefreshKey, setQrRefreshKey] = useState(Date.now());
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [selectedDays, setSelectedDays] = useState({});
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [structureDetails, setStructureDetails] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editContent, setEditContent] = useState("");
  const fetchPatientDetails = async (patientId) => {
    try {
      const patientRef = doc(db, "patients", patientId);
      const patientDoc = await getDoc(patientRef);
      const patientData = patientDoc.data();

     

      let structureData = null;
      if (patientData.structureId) {
        const structureRef = doc(db, "structures", patientData.structureId);
        const structureDoc = await getDoc(structureRef);
        if (structureDoc.exists()) {
          structureData = {
            id: structureDoc.id,
            ...structureDoc.data(),
          };
        }
      }

      setSelectedPatientDetails(patientData);
      setAssignedDoctorsDetails(assignedDocs);
      setStructureDetails(structureData);
      setShowPatientDetailsModal(true);
    } catch (error) {
      setMessage("Erreur lors du chargement des détails");
    }
  };

  useEffect(() => {
    const fetchDoctorAvailability = async () => {
      const doctorsRef = collection(db, "medecins");
      const snapshot = await getDocs(doctorsRef);
      const doctorsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        joursDisponibles: doc.data().disponibilite || [],
      }));
      setAvailableDoctors(doctorsData);
    };
    fetchDoctorAvailability();
  }, []);
  useEffect(() => {
    if (patientData?.id) {
      fetchCreatedByDoctors();
      fetchAvailableDoctors();
      fetchAppointments();
    }
  }, [patientData?.id]);

  const fetchCreatedByDoctors = async () => {
    try {
      const patientRef = doc(db, "patients", patientData.id);
      const patientDoc = await getDoc(patientRef);
      if (patientDoc.exists() && patientDoc.data().createdBy) {
        const doctorRef = doc(db, "medecins", patientDoc.data().createdBy);
        const doctorDoc = await getDoc(doctorRef);
        if (doctorDoc.exists()) {
          setCreatedByDoctors([
            {
              id: doctorDoc.id,
              ...doctorDoc.data(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      setMessage("Erreur lors du chargement des données du médecin");
    }
  };

  const fetchAvailableDoctors = async () => {
    const doctorsQuery = query(collection(db, "medecins"));
    const snapshot = await getDocs(doctorsQuery);
    setAvailableDoctors(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  const fetchAppointments = () => {
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", patientData.id)
    );
    const unsubscribe = onSnapshot(appointmentsQuery, async (snapshot) => {
      const appointmentsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          // Change 'doc' to 'docSnapshot'
          const appointmentData = docSnapshot.data();
          const doctorRef = doc(db, "medecins", appointmentData.doctorId);
          const doctorDoc = await getDoc(doctorRef);
          return {
            id: docSnapshot.id,
            ...appointmentData,
            doctorInfo: doctorDoc.exists() ? doctorDoc.data() : null,
          };
        })
      );
      setAppointments(appointmentsData);
    });
    return unsubscribe;
  };
  const handleConsultationRequest = async () => {
    try {
      if (
        !selectedDoctor ||
        !selectedDay ||
        !selectedTimeSlot ||
        !selectedEndTime
      ) {
        setMessage("Veuillez remplir tous les champs");
        return;
      }
      const consultationRequest = {
        patientId: patientData.id,
        doctorId: selectedDoctor.id,
        patientInfo: patientData,
        doctorInfo: {
          nom: selectedDoctor.nom,
          prenom: selectedDoctor.prenom,
          specialite: selectedDoctor.specialite,
        },
        requestDate: new Date().toISOString(),
        status: "pending",
        preferredDay: selectedDay,
        preferredTimeStart: selectedTimeSlot,
        preferredTimeEnd: selectedEndTime,
        reason: consultationReason,
      };
      await addDoc(collection(db, "consultationRequests"), consultationRequest);
      setMessage("Demande de consultation envoyée avec succès");
      setShowConsultationModal(false);
      resetForm();
    } catch (error) {
      setMessage("Erreur lors de l'envoi de la demande");
      console.error(error);
    }
  };
  const resetForm = () => {
    setSelectedDoctor(null);
    setSelectedDay("");
    setSelectedTimeSlot("");
    setSelectedEndTime("");
    setConsultationReason("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setQrRefreshKey(Date.now());
    }, 24 * 60 * 60 * 1000); // Rafraîchit toutes les 24h
    return () => clearInterval(interval);
  }, []);

  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    let currentTime = new Date(`2000/01/01 ${startTime}`);
    const endDateTime = new Date(`2000/01/01 ${endTime}`);
    while (currentTime < endDateTime) {
      slots.push(
        currentTime.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }
    return slots;
  };

  const [acceptedConsultations, setAcceptedConsultations] = useState([]);
  // Add this useEffect to fetch accepted consultations
  useEffect(() => {
    if (patientData?.id) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "consultationRequests"),
          where("patientId", "==", patientData.id),
          where("status", "==", "accepted")
        ),
        async (snapshot) => {
          const consultationsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                acceptedAt: data.acceptedAt,
              };
            })
          );
          setAcceptedConsultations(consultationsData);
        }
      );
      return () => unsubscribe();
    }
  }, [patientData?.id]);

  const [documentRequests, setDocumentRequests] = useState([]);
  const [showDocumentRequestModal, setShowDocumentRequestModal] =
    useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);

  useEffect(() => {
    if (patientData?.id) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "documentRequests"),
          where("patientId", "==", patientData.id)
        ),
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDocumentRequests(requests);
        }
      );
      return () => unsubscribe();
    }
  }, [patientData?.id]);

  const handleDocumentRequest = async (requestId, isAccepted) => {
    try {
      if (isAccepted) {
        await updateDoc(doc(db, "documentRequests", requestId), {
          status: "accepted",
          respondedAt: new Date().toISOString(),
        });
        setShowDocumentRequestModal(true);
      } else {
        await updateDoc(doc(db, "documentRequests", requestId), {
          status: "rejected",
          respondedAt: new Date().toISOString(),
        });
      }
      setMessage(`Demande ${isAccepted ? "acceptée" : "refusée"} avec succès`);
    } catch (error) {
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  const handleShareDocuments = async (requestId, doctorId) => {
    try {
      const uploadedDocs = await Promise.all(
        selectedDocuments.map(async (file) => {
          const fileRef = ref(
            storage,
            `shared-documents/${patientData.id}/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return {
            name: file.name,
            url: url,
            sharedAt: new Date().toISOString(),
          };
        })
      );

      await updateDoc(doc(db, "patients", patientData.id), {
        sharedDocuments: arrayUnion(...uploadedDocs),
      });

      await updateDoc(doc(db, "documentRequests", requestId), {
        sharedDocuments: uploadedDocs,
        status: "completed",
      });

      setShowDocumentRequestModal(false);
      setMessage("Documents partagés avec succès");
    } catch (error) {
      setMessage("Erreur lors du partage des documents");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  useEffect(() => {
    const fetchCreatedByDoctors = async () => {
      try {
        if (!patientData?.id) {
          console.warn("Patient data is not available");
          return;
        }

        const patientRef = doc(db, "patients", patientData.id);
        const patientDoc = await getDoc(patientRef);

        if (patientDoc.exists() && patientDoc.data().createdBy) {
          const doctorRef = doc(db, "medecins", patientDoc.data().createdBy);
          const doctorDoc = await getDoc(doctorRef);

          if (doctorDoc.exists()) {
            setCreatedByDoctors([
              {
                id: doctorDoc.id,
                ...doctorDoc.data(),
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      }
    };

    fetchCreatedByDoctors();
  }, [patientData?.id]);

  const fetchAllStructures = async () => {
    setLoadingStructures(true);
    try {
      const structuresRef = collection(db, "structures");
      const querySnapshot = await getDocs(structuresRef);

      const structuresData = [];
      querySnapshot.forEach((doc) => {
        structuresData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setStructures(structuresData);
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setMessage("Erreur lors du chargement des structures");
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleShowStructureList = () => {
    setShowStructureListModal(true);
    fetchAllStructures();
  };

  // Ajoutez cette fonction pour envoyer la demande d'ajout à une structure
  {
    /*
const handleAddToStructure = async () => {
  try {
    if (!selectedStructure || !patientData) {
      setMessage('Données manquantes');
      return;
    }

    // Préparer les données de la demande
    const structureRequestData = {
      patientId: patientData.id,
      structureId: selectedStructure.id,
      structureName: selectedStructure.name,
      patientInfo: {
        nom: patientData.nom,
        prenom: patientData.prenom,
        age: patientData.age,
        sexe: patientData.sexe,
        email: patientData.email,
        telephone: patientData.telephone,
        photoURL: patientData.photoURL || null,
        insurances: patientData.insurances || []
      },
      status: 'pending',
      requestDate: serverTimestamp(),
      documents: patientData.documents || []
    };

    // Enregistrer la demande dans Firestore
    await addDoc(collection(db, 'structureRequests'), structureRequestData);
    
    // Mettre à jour l'état pour afficher la confirmation
    setRequestSent(true);
    setMessage('Demande envoyée avec succès à ' + selectedStructure.name);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande:', error);
    setMessage('Erreur lors de l\'envoi de la demande: ' + error.message);
  }
};*/
  }

  const handleSelectStructure = (structure) => {
    setSelectedStructure(structure);
    setShowStructureListModal(false);
    setShowAddToStructureModal(true);
  };

  const handleAddToStructure = async () => {
    try {
      if (!selectedStructure || !patientData) {
        setMessage("Données manquantes");
        return;
      }

      // Préparer les données de la demande
      const structureRequestData = {
        patientId: patientData.id,
        structureId: selectedStructure.id,
        structureName: selectedStructure.name,
        patientInfo: {
          nom: patientData.nom,
          prenom: patientData.prenom,
          age: patientData.age,
          sexe: patientData.sexe,
          email: patientData.email,
          telephone: patientData.telephone,
          photoURL: patientData.photoURL || null,
          insurances: patientData.insurances || [],
        },
        status: "pending",
        requestDate: serverTimestamp(),
        documents: patientData.documents || [],
      };

      // Enregistrer la demande dans Firestore
      await addDoc(collection(db, "structureRequests"), structureRequestData);

      // Mettre à jour l'état pour afficher la confirmation
      setRequestSent(true);
      setShowAddToStructureModal(false);
      setMessage("Demande envoyée avec succès à " + selectedStructure.name);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      setMessage("Erreur lors de l'envoi de la demande: " + error.message);
    }
  };

  return (
    <Container fluid className="py-4">
      {message && (
        <Alert
          variant={message.includes("succès") ? "success" : "danger"}
          onClose={() => setMessage("")}
          dismissible
          className="mb-3"
        >
          {message}
        </Alert>
      )}
      <div className="row mb-4">
        <div className="col">
          <div className="card border-0 rounded-4 shadow-lg transition-transform">
            <div className="card-header bg-primary bg-gradient p-1">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                {/* Patient Name Section */}
                <div className="patient-info flex-grow-0">
                  <div
                    onClick={() => fetchPatientDetails(patientData.id)}
                    className="text-white position-relative patient-link"
                  >
                    <h4 className="mb-0 d-flex align-items-center fw-bold fs-responsive">
                      <i className="bi bi-person-fill me-2"></i>
                      {patientData.nom}
                    </h4>
                  </div>
                </div>

                {/* Buttons Section */}
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowConsultationModal(true)}
                    className="btn btn-light px-2 py-1 d-flex align-items-center consultation-btn btn-responsive"
                  >
                    <i className="bi bi-person-vcard-fill me-1"></i>
                    <span className="button-text">Consultation</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light px-2 py-1 d-flex align-items-center logout-btn btn-responsive"
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    <span className="button-text">Déconnexion</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="nav nav-tabs mt-1 border-0 flex-nowrap overflow-auto">
                <button
                  className={`nav-link text-white ${
                    activeTab === "all" ? "active bg-info text-primary" : ""
                  }`}
                  onClick={() => setActiveTab("all")}
                  title="Afficher tous les champs"
                >
                  <i className="bi bi-grid-fill me-1"></i>
                  <span className="tab-text">Tout</span>
                </button>
                <button
                  className={`nav-link text-white ${
                    activeTab === "creators"
                      ? "active bg-info text-primary"
                      : ""
                  }`}
                  onClick={() => setActiveTab("creators")}
                  title="Médecins créateurs"
                >
                  <i className="bi bi-people-fill me-1"></i>
                  <span className="tab-text">Créateurs</span>
                </button>
               
                <button
                  className={`nav-link text-white ${
                    activeTab === "accepted"
                      ? "active bg-info text-primary"
                      : ""
                  }`}
                  onClick={() => setActiveTab("accepted")}
                  title="Médecins acceptés"
                >
                  <i className="bi bi-check-circle-fill me-1"></i>
                  <span className="tab-text">Acceptés</span>
                </button>
              
                <button
                  onClick={() => navigate("/PatientMessaging")}
                  className="btn btn-info px-2 py-1 d-flex align-items-center messaging-btn btn-responsive"
                >
                  <FaEnvelope className="me-1" />
                  <span className="button-text">Messagerie</span>
                </button>
                <Button
                  variant="success"
                  className="me-2"
                  onClick={handleShowStructureList}
                >
                  <FaHospital className="me-2" />
                  Rejoindre une structure
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Created By Doctors Section */}
      {(activeTab === "all" || activeTab === "creators") && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-lg border-0 rounded-4 hover-lift">
              <Card.Header className="bg-success text-white p-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-people-fill me-2"></i>
                  <span className="fs-responsive">Médecins créateurs</span>
                </h5>

                {/* View Toggle Buttons */}
                <ButtonGroup>
                  <Button
                    variant={viewMode === "grid" ? "light" : "outline-light"}
                    onClick={() => setViewMode("grid")}
                  >
                    <i className="bi bi-grid"></i>
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "light" : "outline-light"}
                    onClick={() => setViewMode("table")}
                  >
                    <i className="bi bi-list"></i>
                  </Button>
                </ButtonGroup>
              </Card.Header>

              <Card.Body className="p-3">
                {viewMode === "grid" ? (
                  // Original Grid View
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {createdByDoctors.map((doctor) => {
                      const qrData = `
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}
                INFORMATIONS MÉDECIN
                Médecin: Dr. ${doctor.nom} ${doctor.prenom}
                Spécialité: ${doctor.specialite}
                Tel: ${doctor.telephone}
                Email: ${doctor.email}
                CONSULTATIONS
                Jours: ${patientData.joursDisponibles?.join(", ")}
                Horaires: ${patientData.appointmentSettings?.heureDebut} - ${
                        patientData.appointmentSettings?.heureFin
                      }
                Durée: ${
                  patientData.appointmentSettings?.consultationDuration
                } minutes
                Généré le: ${new Date().toLocaleString()}
                Valide jusqu'au: ${new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toLocaleString()}
              `;

                      return (
                        <Col key={doctor.id}>
                          <Card
                            className={`h-100 border-0 shadow-sm hover-lift-sm rounded-4 
                    ${
                      confirmedDoctors[doctor.id]
                        ? "bg-success bg-opacity-5"
                        : ""
                    }`}
                          >
                            <Card.Body className="p-responsive">
                              {/* Doctor Header */}
                              <div className="d-flex align-items-center mb-3">
                                <div className="doctor-avatar me-3">
                                  {doctor.photo ? (
                                    <img
                                      src={doctor.photo}
                                      alt="Doctor"
                                      className="rounded-circle"
                                    />
                                  ) : (
                                    <div className="avatar-placeholder">
                                      <i className="bi bi-person-fill"></i>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h5 className="fs-responsive mb-1">
                                    Dr. {doctor.nom} {doctor.prenom}
                                  </h5>
                                  <Badge
                                    bg="primary"
                                    className="badge-responsive"
                                  >
                                    {doctor.specialite}
                                  </Badge>
                                </div>
                              </div>

                              {/* Consultation Days */}
                              <div className="info-section mb-3">
                                <h6 className="text-muted fs-responsive mb-2">
                                  <i className="bi bi-calendar-week me-2"></i>
                                  Jours de consultation
                                </h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {patientData.joursDisponibles?.map((jour) => (
                                    <Badge
                                      key={jour}
                                      bg="info"
                                      className="badge-responsive"
                                    >
                                      {jour}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Schedule Info */}
                              <div className="info-section mb-3">
                                <div className="d-flex align-items-center mb-2">
                                  <FaClock className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {
                                      patientData.appointmentSettings
                                        ?.heureDebut
                                    }{" "}
                                    -{patientData.appointmentSettings?.heureFin}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center">
                                  <FaClock className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    Durée:{" "}
                                    {
                                      patientData.appointmentSettings
                                        ?.consultationDuration
                                    }{" "}
                                    min
                                  </span>
                                </div>
                              </div>

                              {/* Contact Info */}
                              <div className="info-section mb-3">
                                <div className="contact-item">
                                  <FaPhone className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {doctor.telephone}
                                  </span>
                                </div>
                                <div className="contact-item">
                                  <FaEnvelope className="text-primary me-2" />
                                  <span className="fs-responsive">
                                    {doctor.email}
                                  </span>
                                </div>
                              </div>

                              <div className="d-grid gap-2">
                                {!permanentConfirmations[doctor.id] ? (
                                  <Button
                                    variant="success"
                                    className="btn-responsive"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(
                                          doc(db, "medecins", doctor.id),
                                          {
                                            isConfirmed: true,
                                            confirmedAt:
                                              new Date().toISOString(),
                                            isPermanentlyConfirmed: true,
                                          }
                                        );
                                        const newPermanentConfirmations = {
                                          ...permanentConfirmations,
                                          [doctor.id]: true,
                                        };
                                        setPermanentConfirmations(
                                          newPermanentConfirmations
                                        );
                                        localStorage.setItem(
                                          "permanentConfirmations",
                                          JSON.stringify(
                                            newPermanentConfirmations
                                          )
                                        );
                                        setMessage(
                                          "Consultation confirmée définitivement"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la confirmation"
                                        );
                                      }
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer définitivement
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="info"
                                      className="btn-responsive w-100 mb-2"
                                      onClick={() => {
                                        setSelectedQRData(qrData);
                                        setShowQRModal(true);
                                      }}
                                    >
                                      <i className="fas fa-qr-code me-2"></i>
                                      Voir Code QR
                                    </Button>

                                    <ButtonGroup size="sm">
                                      <Button
                                        variant="outline-primary"
                                        className="btn-responsive"
                                        onClick={() => {
                                          setSelectedDoctor(doctor);
                                          setShowConsultationModal(true);
                                        }}
                                      >
                                        <i className="fas fa-calendar-plus me-2"></i>
                                        Nouvelle consultation
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        className="btn-responsive"
                                        onClick={async () => {
                                          if (
                                            window.confirm(
                                              "Êtes-vous sûr de vouloir annuler cette consultation ?"
                                            )
                                          ) {
                                            try {
                                              const newPermanentConfirmations =
                                                { ...permanentConfirmations };
                                              delete newPermanentConfirmations[
                                                doctor.id
                                              ];
                                              setPermanentConfirmations(
                                                newPermanentConfirmations
                                              );
                                              localStorage.setItem(
                                                "permanentConfirmations",
                                                JSON.stringify(
                                                  newPermanentConfirmations
                                                )
                                              );

                                              await updateDoc(
                                                doc(db, "medecins", doctor.id),
                                                {
                                                  isConfirmed: false,
                                                  confirmedAt: null,
                                                  isPermanentlyConfirmed: false,
                                                }
                                              );
                                              setMessage(
                                                "Consultation annulée avec succès"
                                              );
                                            } catch (error) {
                                              setMessage(
                                                "Erreur lors de l'annulation: " +
                                                  error.message
                                              );
                                            }
                                          }
                                        }}
                                      >
                                        <i className="fas fa-times-circle me-2"></i>
                                        Annuler consultation
                                      </Button>
                                    </ButtonGroup>
                                  </>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  // New Table View
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Spécialité</th>
                          <th>Jours</th>
                          <th>Horaires</th>
                          <th>Contact</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdByDoctors.map((doctor) => {
                          const qrData = `
    INFORMATIONS PATIENT
    Nom: ${patientData?.nom || "N/A"}
    Prénom: ${patientData?.prenom || "N/A"}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}
    INFORMATIONS MÉDECIN
    Médecin: Dr. ${doctor.nom} ${doctor.prenom}
    Spécialité: ${doctor.specialite}
    Tel: ${doctor.telephone}
    Email: ${doctor.email}
    CONSULTATIONS
    Jours: ${patientData.joursDisponibles?.join(", ")}
    Horaires: ${patientData.appointmentSettings?.heureDebut} - ${
                            patientData.appointmentSettings?.heureFin
                          }
    Durée: ${patientData.appointmentSettings?.consultationDuration} minutes
    Généré le: ${new Date().toLocaleString()}
    Valide jusqu'au: ${new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toLocaleString()}
  `;

                          return (
                            <tr
                              key={doctor.id}
                              className={
                                confirmedDoctors[doctor.id]
                                  ? "bg-success bg-opacity-5"
                                  : ""
                              }
                            >
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="doctor-avatar me-2">
                                    {doctor.photo ? (
                                      <img
                                        src={doctor.photo}
                                        alt="Doctor"
                                        className="rounded-circle"
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                        }}
                                      />
                                    ) : (
                                      <div className="avatar-placeholder">
                                        <i className="bi bi-person-fill"></i>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="mb-0">
                                      Dr. {doctor.nom} {doctor.prenom}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="primary">{doctor.specialite}</Badge>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {patientData.joursDisponibles?.map((jour) => (
                                    <Badge
                                      key={jour}
                                      bg="info"
                                      className="badge-responsive"
                                    >
                                      {jour}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FaClock className="text-primary me-2" />
                                  <small>
                                    {
                                      patientData.appointmentSettings
                                        ?.heureDebut
                                    }{" "}
                                    -{patientData.appointmentSettings?.heureFin}
                                    <br />
                                    Durée:{" "}
                                    {
                                      patientData.appointmentSettings
                                        ?.consultationDuration
                                    }{" "}
                                    min
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="contact-item">
                                  <FaPhone className="text-primary me-2" />
                                  <small>{doctor.telephone}</small>
                                </div>
                                <div className="contact-item">
                                  <FaEnvelope className="text-primary me-2" />
                                  <small>{doctor.email}</small>
                                </div>
                              </td>
                              <td>
                                {!permanentConfirmations[doctor.id] ? (
                                  <Button
                                    variant="success"
                                    className="btn-responsive"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(
                                          doc(db, "medecins", doctor.id),
                                          {
                                            isConfirmed: true,
                                            confirmedAt:
                                              new Date().toISOString(),
                                            isPermanentlyConfirmed: true,
                                          }
                                        );
                                        const newPermanentConfirmations = {
                                          ...permanentConfirmations,
                                          [doctor.id]: true,
                                        };
                                        setPermanentConfirmations(
                                          newPermanentConfirmations
                                        );
                                        localStorage.setItem(
                                          "permanentConfirmations",
                                          JSON.stringify(
                                            newPermanentConfirmations
                                          )
                                        );
                                        setMessage(
                                          "Consultation confirmée définitivement"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la confirmation"
                                        );
                                      }
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer définitivement
                                  </Button>
                                ) : (
                                  <ButtonGroup size="sm">
                                    <Button
                                      variant="info"
                                      className="btn-responsive w-100 mb-2"
                                      onClick={() => {
                                        setSelectedQRData(qrData);
                                        setShowQRModal(true);
                                      }}
                                    >
                                      <i className="fas fa-qr-code me-2"></i>
                                      Voir Code QR
                                    </Button>

                                    <Button
                                      variant="outline-primary"
                                      className="btn-responsive"
                                      onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setShowConsultationModal(true);
                                      }}
                                    >
                                      <i className="fas fa-calendar-plus me-2"></i>
                                      Nouvelle consultation
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      className="btn-responsive"
                                      onClick={async () => {
                                        if (
                                          window.confirm(
                                            "Êtes-vous sûr de vouloir annuler cette consultation ?"
                                          )
                                        ) {
                                          try {
                                            const newPermanentConfirmations = {
                                              ...permanentConfirmations,
                                            };
                                            delete newPermanentConfirmations[
                                              doctor.id
                                            ];
                                            setPermanentConfirmations(
                                              newPermanentConfirmations
                                            );
                                            localStorage.setItem(
                                              "permanentConfirmations",
                                              JSON.stringify(
                                                newPermanentConfirmations
                                              )
                                            );

                                            await updateDoc(
                                              doc(db, "medecins", doctor.id),
                                              {
                                                isConfirmed: false,
                                                confirmedAt: null,
                                                isPermanentlyConfirmed: false,
                                              }
                                            );
                                            setMessage(
                                              "Consultation annulée avec succès"
                                            );
                                          } catch (error) {
                                            setMessage(
                                              "Erreur lors de l'annulation: " +
                                                error.message
                                            );
                                          }
                                        }
                                      }}
                                    >
                                      <i className="fas fa-times-circle me-2"></i>
                                      Annuler consultation
                                    </Button>
                                  </ButtonGroup>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* QR Code Modal */}
            <Modal
              show={showQRModal}
              onHide={() => setShowQRModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton className="bg-primary text-white">
                <Modal.Title>
                  <i className="fas fa-qr-code me-2"></i>
                  Code QR de consultation
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center p-4">
                {selectedQRData && (
                  <>
                    <QRCode
                      value={selectedQRData}
                      size={400}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      level="H"
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        height: "auto",
                        padding: "20px",
                      }}
                    />
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => {
                        const printWindow = window.open(
                          "",
                          "",
                          "width=600,height=600"
                        );
                        printWindow.document.write(`
                   <html>
                     <head>
                       <title>Code QR Consultation</title>
                       <style>
                         body {
                           display: flex;
                           flex-direction: column;
                           align-items: center;
                           justify-content: center;
                           height: 100vh;
                           margin: 0;
                           font-family: Arial, sans-serif;
                         }
                         .qr-container {
                           text-align: center;
                           padding: 20px;
                         }
                       </style>
                     </head>
                     <body>
                       <div class="qr-container">
                         ${document.querySelector(".modal-body").innerHTML}
                       </div>
                     </body>
                   </html>
                 `);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }}
                    >
                      <i className="fas fa-print me-2"></i>
                      Imprimer le Code QR
                    </Button>
                  </>
                )}
              </Modal.Body>
            </Modal>

            <style jsx>{`
              /* Your existing styles plus: */
              .modal-content {
                border-radius: 1rem;
                border: none;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
              }
              .modal-header {
                border-top-left-radius: 1rem;
                border-top-right-radius: 1rem;
              }
              .modal-body {
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              @media (max-width: 576px) {
                .modal-body {
                  padding: 1rem;
                }
              }

              .table-responsive {
                overflow-x: auto;
              }

              .avatar-placeholder {
                width: 40px;
                height: 40px;
                background-color: #e9ecef;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
              }

              .contact-item {
                display: flex;
                align-items: center;
                margin-bottom: 0.25rem;
              }

              .table td {
                vertical-align: middle;
              }

              .btn-group .btn {
                padding: 0.25rem 0.5rem;
              }

              @media (max-width: 768px) {
                .table-responsive {
                  font-size: 0.875rem;
                }
              }
            `}</style>
          </Col>
        </Row>
      )}
    


      {/* Accepted Doctors Section */}
      {(activeTab === "all" || activeTab === "accepted") && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-check-circle me-2"></i>
                  Demandes de consultation acceptées
                </h5>
                <ButtonGroup>
                  <Button
                    variant={viewMode === "grid" ? "light" : "success"}
                    onClick={() => setViewMode("grid")}
                  >
                    <FaThLarge />
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "light" : "success"}
                    onClick={() => setViewMode("table")}
                  >
                    <FaList />
                  </Button>
                </ButtonGroup>
              </Card.Header>
              <Card.Body>
                {viewMode === "grid" ? (
                  // Grid View
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {acceptedConsultations.map((consultation) => {
                      const qrData = `
                CONFIRMATION DE CONSULTATION
                INFORMATIONS PATIENT
                Nom: ${patientData.nom}
                Prénom: ${patientData.prenom}
                Age: ${patientData.age} ans
                Tel: ${patientData.telephone}
                Email: ${patientData.email}

                INFORMATIONS MÉDECIN
                Médecin: Dr. ${consultation.doctorInfo.nom} ${
                        consultation.doctorInfo.prenom
                      }
                Spécialité: ${consultation.doctorInfo.specialite}
                CONSULTATION
                Jour: ${consultation.preferredDay}
                Horaires: ${consultation.preferredTimeStart} - ${
                        consultation.preferredTimeEnd
                      }
                Motif: ${consultation.reason}
                Acceptée le: ${new Date(
                  consultation.acceptedAt
                ).toLocaleDateString()}
                Généré le: ${new Date().toLocaleString()}
              `;

                      return (
                        <Col key={consultation.id}>
                          <Card className="h-100">
                            <Card.Body>
                              {/* Doctor Info Section */}
                              <div className="d-flex align-items-center mb-3">
                                <div
                                  className="rounded-circle bg-success bg-opacity-10 me-3 d-flex align-items-center justify-content-center"
                                  style={{ width: "64px", height: "64px" }}
                                >
                                  <FaUserMd
                                    size={30}
                                    className="text-success"
                                  />
                                </div>
                                <div>
                                  <h6 className="mb-1">
                                    Dr. {consultation.doctorInfo.nom}{" "}
                                    {consultation.doctorInfo.prenom}
                                  </h6>
                                  <Badge bg="success">
                                    {consultation.doctorInfo.specialite}
                                  </Badge>
                                </div>
                              </div>

                              {/* Appointment Details */}
                              <div className="mb-3">
                                <h6 className="text-muted mb-2">
                                  Détails du rendez-vous:
                                </h6>
                                <p className="mb-1">
                                  <FaCalendarAlt className="me-2 text-success" />
                                  Jour: {consultation.preferredDay}
                                </p>
                                <p className="mb-1">
                                  <FaClock className="me-2 text-success" />
                                  De: {consultation.preferredTimeStart} À:{" "}
                                  {consultation.preferredTimeEnd}
                                </p>
                              </div>

                              {/* Reason Section */}
                              <div className="mb-3">
                                <h6 className="text-muted mb-2">Motif:</h6>
                                <p className="mb-0">{consultation.reason}</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="d-grid gap-2">
                                {!confirmedDoctors[consultation.id] ? (
                                  <Button
                                    variant="success"
                                    onClick={() => {
                                      const newConfirmedDoctors = {
                                        ...confirmedDoctors,
                                        [consultation.id]: true,
                                      };
                                      setConfirmedDoctors(newConfirmedDoctors);
                                      localStorage.setItem(
                                        "confirmedDoctors",
                                        JSON.stringify(newConfirmedDoctors)
                                      );
                                      setMessage("Consultation confirmée");
                                    }}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Confirmer la consultation
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    onClick={() =>
                                      setShowQRModal(consultation.id)
                                    }
                                  >
                                    <i className="fas fa-qrcode me-2"></i>
                                    Voir QR Code
                                  </Button>
                                )}

                                <Button
                                  variant="danger"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?"
                                      )
                                    ) {
                                      try {
                                        await deleteDoc(
                                          doc(
                                            db,
                                            "consultationRequests",
                                            consultation.id
                                          )
                                        );
                                        const newConfirmedDoctors = {
                                          ...confirmedDoctors,
                                        };
                                        delete newConfirmedDoctors[
                                          consultation.id
                                        ];
                                        setConfirmedDoctors(
                                          newConfirmedDoctors
                                        );
                                        localStorage.setItem(
                                          "confirmedDoctors",
                                          JSON.stringify(newConfirmedDoctors)
                                        );
                                        setMessage(
                                          "Consultation supprimée avec succès"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la suppression: " +
                                            error.message
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <i className="fas fa-trash-alt me-2"></i>
                                  Supprimer définitivement
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>

                          {/* QR Code Modal */}
                          <Modal
                            show={showQRModal === consultation.id}
                            onHide={() => setShowQRModal(null)}
                            size="lg"
                            centered
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>QR Code - Consultation</Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="text-center">
                              <QRCode
                                value={qrData}
                                size={400}
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="H"
                                style={{
                                  width: "100%",
                                  maxWidth: "400px",
                                  padding: "20px",
                                }}
                              />
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                variant="secondary"
                                onClick={() => setShowQRModal(null)}
                              >
                                Fermer
                              </Button>
                              <Button
                                variant="primary"
                                onClick={() => {
                                  window.print();
                                }}
                              >
                                <i className="fas fa-print me-2"></i>
                                Imprimer
                              </Button>
                            </Modal.Footer>
                          </Modal>
                        </Col>
                      );
                    })}

                    {acceptedConsultations.length === 0 && (
                      <Col xs={12}>
                        <Alert variant="info">
                          <i className="fas fa-info-circle me-2"></i>
                          Aucune demande de consultation acceptée
                        </Alert>
                      </Col>
                    )}
                  </Row>
                ) : (
                  // Table View
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Date</th>
                          <th>Horaires</th>
                          <th>Motif</th>
                          <th>Statut</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acceptedConsultations.map((consultation) => (
                          <tr key={consultation.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-success bg-opacity-10 me-2 d-flex align-items-center justify-content-center"
                                  style={{ width: "40px", height: "40px" }}
                                >
                                  <FaUserMd
                                    size={20}
                                    className="text-success"
                                  />
                                </div>
                                <div>
                                  <div>
                                    Dr. {consultation.doctorInfo.nom}{" "}
                                    {consultation.doctorInfo.prenom}
                                  </div>
                                  <Badge bg="success">
                                    {consultation.doctorInfo.specialite}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td>{consultation.preferredDay}</td>
                            <td>
                              {consultation.preferredTimeStart} -{" "}
                              {consultation.preferredTimeEnd}
                            </td>
                            <td>{consultation.reason}</td>
                            <td>
                              {confirmedDoctors[consultation.id] ? (
                                <Badge bg="success">Confirmée</Badge>
                              ) : (
                                <Badge bg="warning">En attente</Badge>
                              )}
                            </td>
                            <td>
                              <ButtonGroup>
                                {!confirmedDoctors[consultation.id] ? (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                      const newConfirmedDoctors = {
                                        ...confirmedDoctors,
                                        [consultation.id]: true,
                                      };
                                      setConfirmedDoctors(newConfirmedDoctors);
                                      localStorage.setItem(
                                        "confirmedDoctors",
                                        JSON.stringify(newConfirmedDoctors)
                                      );
                                      setMessage("Consultation confirmée");
                                    }}
                                  >
                                    <i className="fas fa-check-circle"></i>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() =>
                                      setShowQRModal(consultation.id)
                                    }
                                  >
                                    <i className="fas fa-qrcode"></i>
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Êtes-vous sûr de vouloir supprimer définitivement cette consultation ?"
                                      )
                                    ) {
                                      try {
                                        await deleteDoc(
                                          doc(
                                            db,
                                            "consultationRequests",
                                            consultation.id
                                          )
                                        );
                                        const newConfirmedDoctors = {
                                          ...confirmedDoctors,
                                        };
                                        delete newConfirmedDoctors[
                                          consultation.id
                                        ];
                                        setConfirmedDoctors(
                                          newConfirmedDoctors
                                        );
                                        localStorage.setItem(
                                          "confirmedDoctors",
                                          JSON.stringify(newConfirmedDoctors)
                                        );
                                        setMessage(
                                          "Consultation supprimée avec succès"
                                        );
                                      } catch (error) {
                                        setMessage(
                                          "Erreur lors de la suppression: " +
                                            error.message
                                        );
                                      }
                                    }
                                  }}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </Button>
                              </ButtonGroup>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
                {/* Global QR Code Modal - Place this outside the mapping functions */}
                {acceptedConsultations.map((consultation) => {
                  const qrData = `
    CONFIRMATION DE CONSULTATION
    INFORMATIONS PATIENT
    Nom: ${patientData.nom}
    Prénom: ${patientData.prenom}
    Age: ${patientData.age} ans
    Tel: ${patientData.telephone}
    Email: ${patientData.email}

    INFORMATIONS MÉDECIN
    Médecin: Dr. ${consultation.doctorInfo.nom} ${
                    consultation.doctorInfo.prenom
                  }
    Spécialité: ${consultation.doctorInfo.specialite}
    CONSULTATION
    Jour: ${consultation.preferredDay}
    Horaires: ${consultation.preferredTimeStart} - ${
                    consultation.preferredTimeEnd
                  }
    Motif: ${consultation.reason}
    Acceptée le: ${new Date(consultation.acceptedAt).toLocaleDateString()}
    Généré le: ${new Date().toLocaleString()}
  `;

                  return (
                    <Modal
                      key={consultation.id}
                      show={showQRModal === consultation.id}
                      onHide={() => setShowQRModal(null)}
                      size="lg"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>QR Code - Consultation</Modal.Title>
                      </Modal.Header>
                      <Modal.Body className="text-center">
                        <QRCode
                          value={qrData}
                          size={400}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          level="H"
                          style={{
                            width: "100%",
                            maxWidth: "400px",
                            padding: "20px",
                          }}
                        />
                      </Modal.Body>
                      <Modal.Footer>
                        <Button
                          variant="secondary"
                          onClick={() => setShowQRModal(null)}
                        >
                          Fermer
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            window.print();
                          }}
                        >
                          <i className="fas fa-print me-2"></i>
                          Imprimer
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  );
                })}

                {acceptedConsultations.length === 0 && (
                  <Alert variant="info">
                    <i className="fas fa-info-circle me-2"></i>
                    Aucune demande de consultation acceptée
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
     



     
      {/* Details patient Section */}
      <Modal
        show={showPatientDetailsModal}
        onHide={() => setShowPatientDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaUser className="me-2" />
            Détails du Patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPatientDetails && (
            <div>
              <Row>
                <Col md={4} className="text-center mb-4">
                  {selectedPatientDetails.photo ? (
                    <img
                      src={selectedPatientDetails.photo}
                      alt="Patient"
                      className="rounded-circle mb-3"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary bg-opacity-10 mb-3 mx-auto d-flex align-items-center justify-content-center"
                      style={{ width: "150px", height: "150px" }}
                    >
                      <span className="h1 mb-0">
                        {selectedPatientDetails.nom?.[0]}
                        {selectedPatientDetails.prenom?.[0]}
                      </span>
                    </div>
                  )}
                  <h4>
                    {selectedPatientDetails.nom} {selectedPatientDetails.prenom}
                  </h4>
                  <Badge bg="primary">
                    {selectedPatientDetails.status || "Actif"}
                  </Badge>
                </Col>
                <Col md={8}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5 className="mb-3">Informations personnelles</h5>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Âge:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.age} ans</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Sexe:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.sexe}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Email:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.email}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col sm={4} className="text-muted">
                          Téléphone:
                        </Col>
                        <Col sm={8}>{selectedPatientDetails.telephone}</Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {structureDetails && (
                    <Card className="mb-3">
                      <Card.Body>
                        <h5 className="mb-3">Structure d'affectation</h5>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Nom:
                          </Col>
                          <Col sm={8}>{structureDetails.name}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Adresse:
                          </Col>
                          <Col sm={8}>{structureDetails.address}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col sm={4} className="text-muted">
                            Contact:
                          </Col>
                          <Col sm={8}>{structureDetails.phones?.mobile}</Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}

                  
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        show={showConsultationModal}
        onHide={() => setShowConsultationModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-calendar-plus me-2"></i>
            Demande de consultation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sélectionner un médecin</Form.Label>
              <Form.Select
                onChange={(e) => {
                  const doctor = availableDoctors.find(
                    (d) => d.id === e.target.value
                  );
                  setSelectedDoctor(doctor);
                }}
              >
                <option value="">Choisir un médecin...</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {selectedDoctor && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Jour souhaité</Form.Label>
                  <Form.Select onChange={(e) => setSelectedDay(e.target.value)}>
                    <option value="">Choisir un jour...</option>
                    {selectedDoctor.disponibilite?.map((jour) => (
                      <option key={jour} value={jour}>
                        {jour}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de début</Form.Label>
                      <Form.Control
                        type="time"
                        min={selectedDoctor.heureDebut}
                        max={selectedDoctor.heureFin}
                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        Disponible de {selectedDoctor.heureDebut} à{" "}
                        {selectedDoctor.heureFin}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Heure de fin</Form.Label>
                      <Form.Control
                        type="time"
                        min={selectedTimeSlot || selectedDoctor.heureDebut}
                        max={selectedDoctor.heureFin}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Motif de consultation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    onChange={(e) => setConsultationReason(e.target.value)}
                  />
                </Form.Group>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConsultationModal(false)}
          >
            <i className="fas fa-times me-2"></i>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConsultationRequest}
            disabled={!selectedDoctor || !selectedDay || !selectedTimeSlot}
          >
            <i className="fas fa-paper-plane me-2"></i>
            Envoyer la demande
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de liste des structures */}
      <Modal
        show={showStructureListModal}
        onHide={() => setShowStructureListModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaHospital className="me-2" />
            Sélectionner une structure médicale
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingStructures ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-2">Chargement des structures...</p>
            </div>
          ) : structures.length > 0 ? (
            <div className="structure-list">
              <ListGroup>
                {structures.map((structure) => (
                  <ListGroup.Item
                    key={structure.id}
                    action
                    onClick={() => handleSelectStructure(structure)}
                    className="d-flex justify-content-between align-items-center p-3"
                  >
                    <div>
                      <div className="d-flex align-items-center">
                        <div className="structure-icon me-3 bg-light rounded-circle p-2">
                          <FaHospital size={24} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-1">{structure.name}</h6>
                          <small className="text-muted">
                            {structure.address || "Adresse non spécifiée"}
                          </small>
                        </div>
                      </div>
                      {structure.description && (
                        <p className="text-muted small mt-2 mb-0">
                          {structure.description.length > 100
                            ? structure.description.substring(0, 100) + "..."
                            : structure.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="rounded-pill"
                    >
                      <FaPlus className="me-1" /> Rejoindre
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : (
            <Alert variant="info">
              <FaInfoCircle className="me-2" />
              Aucune structure disponible pour le moment
            </Alert>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal de confirmation d'ajout à une structure */}
      <Modal
        show={showAddToStructureModal}
        onHide={() => setShowAddToStructureModal(false)}
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaHospital className="me-2" />
            Rejoindre {selectedStructure?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {requestSent ? (
            <Alert variant="success">
              <FaCheckCircle className="me-2" />
              Votre demande a été envoyée avec succès à{" "}
              {selectedStructure?.name}. Vous serez notifié lorsque la structure
              aura traité votre demande.
            </Alert>
          ) : (
            <>
              <p>
                Vous êtes sur le point d'envoyer une demande pour rejoindre{" "}
                <strong>{selectedStructure?.name}</strong>.
              </p>
              <p>
                Les informations suivantes seront partagées avec la structure :
              </p>
              <ListGroup className="mb-3">
                <ListGroup.Item>Nom: {patientData.nom}</ListGroup.Item>
                <ListGroup.Item>Prénom: {patientData.prenom}</ListGroup.Item>
                <ListGroup.Item>Email: {patientData.email}</ListGroup.Item>
                <ListGroup.Item>
                  Téléphone: {patientData.telephone || "Non spécifié"}
                </ListGroup.Item>
              </ListGroup>
              <p className="text-muted small">
                <FaInfoCircle className="me-1" />
                La structure devra accepter votre demande avant que vous
                puissiez accéder à ses services.
              </p>
            </>
          )}
        </Modal.Body>
        {!requestSent && (
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddToStructureModal(false)}
            >
              Annuler
            </Button>
            <Button variant="success" onClick={handleAddToStructure}>
              <FaPaperPlane className="me-2" />
              Envoyer la demande
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Container>
  );
};
export default PatientsDashboard;











import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { auth, db } from '../components/firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { signOut } from 'firebase/auth';
import { Button, Card, Modal, Form, Badge } from 'react-bootstrap';
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from 'qrcode.react'; // Update this line

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [showDoctorInfo, setShowDoctorInfo] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scannedAppointment, setScannedAppointment] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [appointmentRequest, setAppointmentRequest] = useState({
    date: '',
    time: '',
    reason: '',
    specialty: ''
  });

  const handleShowQRCode = (appointment) => {
    setSelectedAppointment(appointment);
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedAppointment(null);
  };

  const [consultationRequest, setConsultationRequest] = useState({
    reason: '',
    preferredDate: '',
    symptoms: ''
  });

  const [sourceInfo, setSourceInfo] = useState({
    medecins: {},
    structures: {}
  });

  const [appointmentSources, setAppointmentSources] = useState({
    structures: {},
    medecins: {}
  });

  const handleScannerClose = () => {
    setShowScanner(false);
    setScannedData(null);
  };

  const initializeScanner = () => {
    const newScanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    newScanner.render(success, error => {
      console.error(error);
    });

    setScanner(newScanner);
  };

  const success = async (decodedText) => {
    if (decodedText) {
      try {
        const appointmentData = JSON.parse(decodedText);
        const appointmentMatch = appointments.find(apt => apt.id === appointmentData.id);
        
        if (appointmentMatch) {
          setScannedAppointment(appointmentMatch);
          if (scanner) {
            scanner.clear();
          }
          setShowScanner(false);
        }
      } catch (error) {
        console.error('Invalid QR code data:', error);
      }
    }
  };

  useEffect(() => {
    if (showScanner) {
      initializeScanner();
    }
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [showScanner]);

  useEffect(() => {
    const fetchSourceInfo = async () => {
      try {
        const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
        const medecinsData = {};
        medecinsSnapshot.forEach(doc => {
          medecinsData[doc.id] = { id: doc.id, ...doc.data() };
        });

        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = {};
        structuresSnapshot.forEach(doc => {
          structuresData[doc.id] = { id: doc.id, ...doc.data() };
        });

        setSourceInfo({
          medecins: medecinsData,
          structures: structuresData
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des sources:", error);
      }
    };

    fetchSourceInfo();
  }, []);

  useEffect(() => {
    const fetchAppointmentSources = async () => {
      try {
        const structuresSnapshot = await getDocs(collection(db, 'structures'));
        const structuresData = {};
        structuresSnapshot.forEach(doc => {
          structuresData[doc.id] = { id: doc.id, ...doc.data() };
        });

        const medecinsSnapshot = await getDocs(collection(db, 'medecins'));
        const medecinsData = {};
        medecinsSnapshot.forEach(doc => {
          medecinsData[doc.id] = { id: doc.id, ...doc.data() };
        });

        setAppointmentSources({
          structures: structuresData,
          medecins: medecinsData
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des sources:", error);
      }
    };

    fetchAppointmentSources();
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const patientQuery = query(
          collection(db, 'patients'),
          where('email', '==', currentUser.email)
        );
        const patientSnapshot = await getDocs(patientQuery);
        
        if (!patientSnapshot.empty) {
          const patientDoc = patientSnapshot.docs[0];
          setPatientData({ id: patientDoc.id, ...patientDoc.data() });

          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', patientDoc.id)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAppointments(appointmentsData);

          const notesQuery = query(
            collection(db, 'patientNotes'),
            where('patientId', '==', patientDoc.id)
          );
          const notesSnapshot = await getDocs(notesQuery);
          const notesData = notesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMedicalNotes(notesData);

          if (patientDoc.data().documents) {
            setDocuments(patientDoc.data().documents);
          }
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (patientData && patientData.medecinId) {
        try {
          const doctorRef = doc(db, 'medecins', patientData.medecinId);
          const doctorSnap = await getDoc(doctorRef);
          
          if (doctorSnap.exists()) {
            setDoctorInfo({
              id: doctorSnap.id,
              ...doctorSnap.data()
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des informations du médecin:", error);
        }
      }
    };

    if (patientData) {
      fetchDoctorInfo();
    }
  }, [patientData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    setShowConsultationForm(false);
  };

  const fetchStructures = async () => {
    try {
      const structuresRef = collection(db, 'structures');
      const structuresSnapshot = await getDocs(structuresRef);
      const structuresData = structuresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStructures(structuresData);
    } catch (error) {
      console.error('Error fetching structures:', error);
      setError('Erreur lors du chargement des structures');
    }
  };

  const handleAppointmentRequest = async () => {
    try {
      const appointmentData = {
        patientId: currentUser.uid,
        structureId: selectedStructure.id,
        specialty: selectedSpecialty,
        status: 'pending',
        date: appointmentRequest.date,
        time: appointmentRequest.time,
        reason: appointmentRequest.reason,
        createdAt: new Date().toISOString(),
        patientName: `${patientData.nom} ${patientData.prenom}`,
        patientAge: patientData.age,
        structureName: selectedStructure.name
      };

      const appointmentRef = collection(db, 'appointments');
      await addDoc(appointmentRef, appointmentData);

      setShowStructureModal(false);
      setSelectedStructure(null);
      setSelectedSpecialty(null);
      setAppointmentRequest({
        date: '',
        time: '',
        reason: '',
        specialty: ''
      });

      setError('');
      setMessage('Demande de rendez-vous envoyée avec succès');
      
      setTimeout(() => {
        setMessage('');
      }, 5000);

    } catch (error) {
      console.error('Error creating appointment:', error);
      setMessage('');
      setError('Erreur lors de la création du rendez-vous');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Mes Documents Médicaux</h3>
            </div>
            <div className="card-body">
              {documents.length > 0 ? (
                <div className="list-group">
                  {documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="list-group-item list-group-item-action"
                    >
                      Document {index + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Aucun document médical disponible</p>
              )}
            </div>
          </div>
        );

        case 'appointments':
          return (
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Mes Rendez-vous</h3>
              </div>
              <div className="card-body">
                {appointments.length > 0 ? (
                  <div className="list-group">
                    {appointments.map(apt => (
                      <div key={apt.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 className="mb-1">Rendez-vous du {apt.day}</h5>
                            <p className="mb-1">Heure: {apt.timeSlot}</p>
                            {apt.structureId ? (
                              <p className="mb-1 text-muted">
                                Structure: {appointmentSources.structures[apt.structureId]?.name}
                              </p>
                            ) : (
                              <p className="mb-1 text-muted">
                                Médecin: Dr. {appointmentSources.medecins[apt.doctorId]?.nom}
                              </p>
                            )}
                            <button
                              className="btn btn-primary btn-sm mt-2"
                              onClick={() => handleShowQRCode(apt)}
                            >
                              Afficher QR Code
                            </button>
                          </div>
                          <span className={`badge ${
                            apt.status === 'completed' ? 'bg-success' : 
                            apt.status === 'pending' ? 'bg-warning' : 'bg-primary'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Aucun rendez-vous programmé</p>
                )}
              </div>
            </div>
          );



      case 'consultation':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Demande de Consultation</h3>
            </div>
            <div className="card-body">
              {showConsultationForm ? (
                <form onSubmit={handleConsultationSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Motif de consultation</label>
                    <input
                      type="text"
                      className="form-control"
                      value={consultationRequest.reason}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        reason: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date souhaitée</label>
                    <input
                      type="date"
                      className="form-control"
                      value={consultationRequest.preferredDate}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        preferredDate: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Symptômes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={consultationRequest.symptoms}
                      onChange={(e) => setConsultationRequest({
                        ...consultationRequest,
                        symptoms: e.target.value
                      })}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Envoyer la demande
                  </button>
                </form>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConsultationForm(true)}
                >
                  Nouvelle demande de consultation
                </button>
              )}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="card">
            <div className="card-header">
              <h3 className="mb-0">Messagerie</h3>
            </div>
            <div className="card-body">
              <p className="text-muted">Service de messagerie à venir</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="alert alert-warning m-3" role="alert">
        Aucune donnée patient trouvée
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">
            {patientData?.prenom} {patientData?.nom}
          </span>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('documents')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Documents Médicaux
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}
                >
                  <i className="bi bi-calendar-check me-2"></i>
                  Rendez-vous
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'consultation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consultation')}
                >
                  <i className="bi bi-clipboard-plus me-2"></i>
                  Consultation
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('messages')}
                >
                  <i className="bi bi-chat-dots me-2"></i>
                  Messagerie
                </button>
              </li>
            </ul>
            
            <button
              onClick={handleLogout}
              className="btn btn-outline-light"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Déconnexion
            </button>
            <Button
              variant="primary"
              className="mb-3"
              onClick={() => {
                fetchStructures();
                setShowStructureModal(true);
              }}
            >
              <i className="fas fa-hospital me-2"></i>
              Prendre un rendez-vous avec une structure
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            {activeTab === 'documents' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Mes Documents Médicaux
                  </h5>
                  {documents.length > 0 ? (
                    <div className="list-group">
                      {documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action d-flex align-items-center"
                        >
                          <i className="bi bi-file-earmark-text me-3 text-primary"></i>
                          Document {index + 1}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Aucun document médical disponible
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">
                    <i className="bi bi-calendar-check me-2"></i>
                    Mes Rendez-vous
                  </h5>
                  {appointments.map(apt => (
                    <div key={apt.id} className="card mb-3 border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">
                              <i className="bi bi-clock me-2 text-primary"></i>
                              {apt.day} à {apt.timeSlot}
                            </h6>
                            <p className="text-muted mb-2">
                              {apt.structureId ? (
                                <>
                                  <i className="bi bi-hospital me-2"></i>
                                  {appointmentSources.structures[apt.structureId]?.name}
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-person me-2"></i>
                                  Dr. {appointmentSources.medecins[apt.doctorId]?.nom}
                                </>
                              )}
                            </p>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleShowQRCode(apt)}
                            >
                              <i className="bi bi-qr-code me-2"></i>
                              QR Code
                            </button>
                          </div>
                          <span className={`badge ${
                            apt.status === 'completed' ? 'bg-success' : 
                            apt.status === 'pending' ? 'bg-warning' : 'bg-primary'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'consultation' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">
                    <i className="bi bi-clipboard-plus me-2"></i>
                    Demande de Consultation
                  </h5>
                  {showConsultationForm ? (
                    <form onSubmit={handleConsultationSubmit} className="needs-validation">
                      <div className="mb-3">
                        <label className="form-label">Motif de consultation</label>
                        <input
                          type="text"
                          className="form-control"
                          value={consultationRequest.reason}
                          onChange={(e) => setConsultationRequest({
                            ...consultationRequest,
                            reason: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Date souhaitée</label>
                        <input
                          type="date"
                          className="form-control"
                          value={consultationRequest.preferredDate}
                          onChange={(e) => setConsultationRequest({
                            ...consultationRequest,
                            preferredDate: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Symptômes</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={consultationRequest.symptoms}
                          onChange={(e) => setConsultationRequest({
                            ...consultationRequest,
                            symptoms: e.target.value
                          })}
                          required
                        ></textarea>
                      </div>
                      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" className="btn btn-primary">
                          <i className="bi bi-send me-2"></i>
                          Envoyer la demande
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center">
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowConsultationForm(true)}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Nouvelle demande de consultation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title mb-4">
                    <i className="bi bi-chat-dots me-2"></i>
                    Messagerie
                  </h5>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Service de messagerie à venir
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal show={showQRModal} onHide={handleCloseQRModal} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Détails du Rendez-vous
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 text-center border-end">
              {selectedAppointment && (
                <div className="p-3">
                  <QRCodeSVG
                    value={JSON.stringify({
                      id: selectedAppointment.id,
                      date: selectedAppointment.day,
                      heure: selectedAppointment.timeSlot,
                      structure: appointmentSources.structures[selectedAppointment.structureId]?.name,
                      medecin: appointmentSources.medecins[selectedAppointment.doctorId]?.nom,
                      status: selectedAppointment.status
                    })}
                    size={256}
                    level="H"
                  />
                </div>
              )}
            </div>
            <div className="col-md-6">
              {selectedAppointment && (
                <div className="p-3">
                  <h5 className="border-bottom pb-2 mb-3">Informations du rendez-vous</h5>
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Date et Heure</h6>
                    <p className="mb-1">
                      <i className="bi bi-calendar-event me-2 text-primary"></i>
                      {selectedAppointment.day}
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-clock me-2 text-primary"></i>
                      {selectedAppointment.timeSlot}
                    </p>
                  </div>

                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Médecin</h6>
                    <p className="mb-1">
                      <i className="bi bi-person-badge me-2 text-primary"></i>
                      Dr. {appointmentSources.medecins[selectedAppointment.doctorId]?.nom}
                    </p>
                    {appointmentSources.medecins[selectedAppointment.doctorId]?.specialite && (
                      <p className="mb-0">
                        <i className="bi bi-briefcase me-2 text-primary"></i>
                        {appointmentSources.medecins[selectedAppointment.doctorId]?.specialite}
                      </p>
                    )}
                  </div>

                  {appointmentSources.structures[selectedAppointment.structureId]?.name && (
                    <div className="mb-3">
                      <h6 className="text-muted mb-2">Structure</h6>
                      <p className="mb-0">
                        <i className="bi bi-hospital me-2 text-primary"></i>
                        {appointmentSources.structures[selectedAppointment.structureId]?.name}
                      </p>
                    </div>
                  )}

                  <div>
                    <h6 className="text-muted mb-2">Statut</h6>
                    <span className={`badge ${
                      selectedAppointment.status === 'completed' ? 'bg-success' : 
                      selectedAppointment.status === 'pending' ? 'bg-warning' : 'bg-primary'
                    } px-3 py-2`}>
                      <i className="bi bi-check-circle me-2"></i>
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>
            Imprimer
          </Button>
          <Button variant="secondary" onClick={handleCloseQRModal}>
            <i className="bi bi-x-circle me-2"></i>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStructureModal} onHide={() => setShowStructureModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Prendre un rendez-vous</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedStructure ? (
            <div>
              <h5>Sélectionnez une structure</h5>
              <div className="structure-grid">
                {structures.map(structure => (
                  <Card key={structure.id} className="mb-3 structure-card">
                    <Card.Body>
                      <Card.Title>{structure.name}</Card.Title>
                      <Card.Text>
                        <i className="fas fa-map-marker-alt me-2"></i>
                        {structure.address}
                      </Card.Text>
                      <div className="specialties-tags">
                        {structure.specialties?.map((specialty, index) => (
                          <Badge key={index} bg="info" className="me-2 mb-2">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setSelectedStructure(structure)}
                      >
                        Sélectionner
                      </Button>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h5>Détails du rendez-vous - {selectedStructure.name}</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Spécialité</Form.Label>
                  <Form.Select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez une spécialité</option>
                    {selectedStructure.specialties?.map((specialty, index) => (
                      <option key={index} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date souhaitée</Form.Label>
                  <Form.Control
                    type="date"
                    value={appointmentRequest.date}
                    onChange={(e) => setAppointmentRequest({
                      ...appointmentRequest,
                      date: e.target.value
                    })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Heure souhaitée</Form.Label>
                  <Form.Control
                    type="time"
                    value={appointmentRequest.time}
                    onChange={(e) => setAppointmentRequest({
                      ...appointmentRequest,
                      time: e.target.value
                    })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Motif de la consultation</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={appointmentRequest.reason}
                    onChange={(e) => setAppointmentRequest({
                      ...appointmentRequest,
                      reason: e.target.value
                    })}
                    required
                  />
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowStructureModal(false);
            setSelectedStructure(null);
            setSelectedSpecialty(null);
            setAppointmentRequest({
              date: '',
              time: '',
              reason: '',
              specialty: ''
            });
          }}>
            Annuler
          </Button>
          {selectedStructure && (
            <Button
              variant="primary"
              onClick={handleAppointmentRequest}
              disabled={!selectedSpecialty || !appointmentRequest.date || !appointmentRequest.time || !appointmentRequest.reason}
            >
              Envoyer la demande
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .structure-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .structure-card {
          transition: transform 0.2s;
        }

        .structure-card:hover {
          transform: translateY(-5px);
        }

        .specialties-tags {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;