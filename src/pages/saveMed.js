donc si un patient scanne le code qr il peut soit s'incrire et alors il est  ajouter comme patient privé du medecin en question et une fois avoir soumis le formulaire il est rediriger vers :"General.js" pour se connecter avec le mait ainsi que le mot de passe saisie,ou si il est deja en possesion d'un compte il peut faire une demande de consultation et un fois avoir



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
  import QRCode from 'qrcode.react';


  const MedecinsDashboard = () => {
    const navigate = useNavigate();
    const [showPatientFiles, setShowPatientFiles] = useState(false);
    const [doctorData, setDoctorData] = useState([]);
    const { currentUser } = useAuth();

    const [structurePatients, setStructurePatients] = useState([]);
    const [privatePatients, setPrivatePatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointment, setAppointment] = useState([]);

useEffect(() => {
  const fetchAppointments = async () => {
    const appointmentsRef = collection(db, 'appointments');
    const querySnapshot = await getDocs(appointmentsRef);
    const appointmentsData = [];
    
    querySnapshot.forEach((doc) => {
      appointmentsData.push({ id: doc.id, ...doc.data() });
    });
    
    setAppointments(appointmentsData);
  };

  fetchAppointments();
}, []);

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

    const [showStructureModal, setShowStructureModal] = useState(false);
    const [availableStructures, setAvailableStructures] = useState([]);
    const [selectedStructures, setSelectedStructures] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editedPatientInfo, setEditedPatientInfo] = useState(null);
// Au début du composant avec les autres états
const [patientsData, setPatientsData] = useState({});

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
          status: "active",
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
                patientData.structure = {
                  id: structureDoc.id,
                  ...structureDoc.data()
                };
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
              <QRCode
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


  const MedecinsDashboard = () => {
    const navigate = useNavigate();
    const [showPatientFiles, setShowPatientFiles] = useState(false);
    const [doctorData, setDoctorData] = useState([]);
    const { currentUser } = useAuth();

    const [structurePatients, setStructurePatients] = useState([]);
    const [privatePatients, setPrivatePatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointment, setAppointment] = useState([]);

useEffect(() => {
  const fetchAppointments = async () => {
    const appointmentsRef = collection(db, 'appointments');
    const querySnapshot = await getDocs(appointmentsRef);
    const appointmentsData = [];
    
    querySnapshot.forEach((doc) => {
      appointmentsData.push({ id: doc.id, ...doc.data() });
    });
    
    setAppointments(appointmentsData);
  };

  fetchAppointments();
}, []);

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

    const [showStructureModal, setShowStructureModal] = useState(false);
    const [availableStructures, setAvailableStructures] = useState([]);
    const [selectedStructures, setSelectedStructures] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editedPatientInfo, setEditedPatientInfo] = useState(null);
// Au début du composant avec les autres états
const [patientsData, setPatientsData] = useState({});

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
          status: "active",
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
                patientData.structure = {
                  id: structureDoc.id,
                  ...structureDoc.data()
                };
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
      </Container>
    );
  };

  export default MedecinsDashboard;



















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
    onSnapshot
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
  import { createUserWithEmailAndPassword, getAuth ,signOut} from "firebase/auth";
  import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
  // Add to existing imports
  import MessageriesPatients from "./MessageriesPatients.js";
  import { useAuth } from '../contexts/AuthContext.js';


  const MedecinsDashboard = () => {
    const navigate = useNavigate();
    const [showPatientFiles, setShowPatientFiles] = useState(false);
    const [doctorData, setDoctorData] = useState([]);
    const { currentUser } = useAuth();

    const [structurePatients, setStructurePatients] = useState([]);
    const [privatePatients, setPrivatePatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [appointment, setAppointment] = useState([]);

useEffect(() => {
  const fetchAppointments = async () => {
    const appointmentsRef = collection(db, 'appointments');
    const querySnapshot = await getDocs(appointmentsRef);
    const appointmentsData = [];
    
    querySnapshot.forEach((doc) => {
      appointmentsData.push({ id: doc.id, ...doc.data() });
    });
    
    setAppointments(appointmentsData);
  };

  fetchAppointments();
}, []);

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

    const [showStructureModal, setShowStructureModal] = useState(false);
    const [availableStructures, setAvailableStructures] = useState([]);
    const [selectedStructures, setSelectedStructures] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showEditPatientModal, setShowEditPatientModal] = useState(false);
    const [editedPatientInfo, setEditedPatientInfo] = useState(null);
// Au début du composant avec les autres états
const [patientsData, setPatientsData] = useState({});

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
          status: "active",
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
                patientData.structure = {
                  id: structureDoc.id,
                  ...structureDoc.data()
                };
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
      </Container>
    );
  };

  export default MedecinsDashboard;
