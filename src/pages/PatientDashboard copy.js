import React, { useState,useRef,useCallback, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Nav,
  Tab,
  Badge,
  ListGroup,
  Spinner,
  Offcanvas,
  Form,
  Modal,
  InputGroup,
  ButtonGroup,
  Dropdown
  ,
  Pagination
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../components/firebase-config.js";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  orderBy,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  FaBell,
  FaList,
  FaMoneyBillWave,
  FaRegStar,
  FaThLarge,
  FaSearch,
  FaUser,
  FaHospital,
  FaCalendarAlt,
  FaFile,
  FaSignOutAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaUserMd,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaClock,
  FaBars,
  FaComment,
  FaTimes,
  FaInfoCircle,
  FaCalendarPlus,
  FaUsers,
  FaPaperclip,
  FaArrowLeft,
  FaPaperPlane,
  FaStar,
  FaQrcode,
  FaCommentMedical,
  FaCheck
} from "react-icons/fa";
import { useMediaQuery } from "react-responsive";
import Select from "react-select";
import PatientDemande from "./PatientDemande.js";
import PatientMessaging from "./PatientMessaging.js"
import { QRCodeCanvas } from "qrcode.react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PatientDashboard = () => {
  const [expandedStructures, setExpandedStructures] = useState({});

  const [patient, setPatient] = useState(null);
  const [structures, setStructures] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("appointments");
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});
  const navigate = useNavigate();
  const [hasNewMessages, setHasNewMessages] = useState(false);
const [unreadMessages, setUnreadMessages] = useState(0);

  // État pour le menu mobile
  const [showSidebar, setShowSidebar] = useState(false);

  // Détection du type d'appareil
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 991 });
  const isDesktop = useMediaQuery({ minWidth: 992 });

  // États pour PatientRdv
  const [structuresOptions, setStructuresOptions] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [rdvLoading, setRdvLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // États simplifiés pour les préférences
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [motif, setMotif] = useState("");
  // Nouvel état pour les médecins disponibles dans la structure sélectionnée
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // État pour le texte récapitulatif
  const [requestSummary, setRequestSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // États pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);


const [paymentMethod, setPaymentMethod] = useState("");
const [paymentLoading, setPaymentLoading] = useState(false);
const [paymentCompleted, setPaymentCompleted] = useState(false);
const [phoneNumber, setPhoneNumber] = useState("");
const [paymentError, setPaymentError] = useState("");



  // Nouvel état pour les médecins des structures du patient
  const [structureDoctors, setStructureDoctors] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedStructureForDoctors, setSelectedStructureForDoctors] =
    useState(null);

  // Options pour les jours de la semaine
  const daysOptions = [
    { value: "Lundi", label: "Lundi" },
    { value: "Mardi", label: "Mardi" },
    { value: "Mercredi", label: "Mercredi" },
    { value: "Jeudi", label: "Jeudi" },
    { value: "Vendredi", label: "Vendredi" },
    { value: "Samedi", label: "Samedi" },
    { value: "Dimanche", label: "Dimanche" }
  ];

  // Options pour les créneaux horaires
  const timeSlotOptions = [
    { value: "Matin (8h-12h)", label: "Matin (8h-12h)" },
    { value: "Midi (12h-14h)", label: "Midi (12h-14h)" },
    { value: "Après-midi (14h-18h)", label: "Après-midi (14h-18h)" },
    { value: "Soir (18h-20h)", label: "Soir (18h-20h)" }
  ];

  // Options pour les motifs de consultation
  const motifOptions = [
    { value: "Première consultation", label: "Première consultation" },
    { value: "Suivi médical", label: "Suivi médical" },
    { value: "Urgence", label: "Urgence" },
    {
      value: "Renouvellement d'ordonnance",
      label: "Renouvellement d'ordonnance"
    },
    { value: "Autre", label: "Autre" }
  ];

  // Ajoutez cette fonction pour vérifier les nouveaux messages
  const checkForNewMessages = useCallback(() => {
    if (!patient?.id) return () => {};
    
    try {
      // Requête pour obtenir les messages non lus adressés au patient
      const messagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', patient.id),
        where('read', '==', false)
      );
      
      // Configurer l'écoute en temps réel et retourner directement la fonction d'annulation
      return onSnapshot(messagesQuery, (snapshot) => {
        const unreadCount = snapshot.docs.length;
        setUnreadMessages(unreadCount);
        setHasNewMessages(unreadCount > 0);
      }, (error) => {
        console.error("Erreur lors de l'écoute des nouveaux messages:", error);
      });
    } catch (error) {
      console.error("Erreur lors de la configuration de l'écoute des messages:", error);
      return () => {};
    }
  }, [patient?.id]);
  
  useEffect(() => {
    const unsubscribe = checkForNewMessages();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [checkForNewMessages]);
  



  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si les données du patient sont dans le localStorage
        const patientData = localStorage.getItem("patientData");

        if (!patientData) {
          navigate("/");
          return;
        }

        const parsedData = JSON.parse(patientData);
        setPatient(parsedData);

        // Charger les structures associées au patient
        await loadStructures(parsedData);

        // Configurer l'écoute en temps réel des rendez-vous
        setupAppointmentsListener(parsedData.id);

        // Charger les structures pour le formulaire de rendez-vous
        await fetchStructuresForRdv();

        // Configurer l'écoute des notifications
        setupNotificationsListener(parsedData.id);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError("Une erreur est survenue lors du chargement de vos données.");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleShowQRCode = (appointment) => {
    setCurrentAppointment(appointment);
    setShowQRModal(true);
  };

  // Fonction pour générer les données du QR code
  const generateQRData = (appointment) => {
    const qrData = {
      id: appointment.id,
      patientName: `${patient?.nom} ${patient?.prenom}`,
      patientId: patient?.id,
      doctorName: `Dr. ${appointment.doctorInfo?.nom} ${appointment.doctorInfo?.prenom}`,
      doctorId: appointment.doctorId,
      structure: appointment.structureInfo?.name,
      structureId: appointment.structureId,
      day: appointment.day,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      specialty: appointment.doctorInfo?.specialite,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData);
  };



  const loadStructures = async (patientData) => {
    try {
      if (!patientData.structures || patientData.structures.length === 0) {
        return;
      }

      // Configurer l'écoute en temps réel des structures
      const unsubscribeStructures = [];

      patientData.structures.forEach((structureId) => {
        const unsubscribe = onSnapshot(
          doc(db, "structures", structureId),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              setStructures((prevStructures) => {
                // Vérifier si la structure existe déjà dans le tableau
                const existingIndex = prevStructures.findIndex(
                  (s) => s.id === structureId
                );
                const newStructure = {
                  id: docSnapshot.id,
                  ...docSnapshot.data()
                };

                if (existingIndex >= 0) {
                  // Mettre à jour la structure existante
                  const updatedStructures = [...prevStructures];
                  updatedStructures[existingIndex] = newStructure;
                  return updatedStructures;
                } else {
                  // Ajouter la nouvelle structure
                  return [...prevStructures, newStructure];
                }
              });
            }
          },
          (error) => {
            console.error(
              `Erreur lors de l'écoute de la structure ${structureId}:`,
              error
            );
          }
        );

        unsubscribeStructures.push(unsubscribe);
      });

      // Ajouter la fonction de nettoyage au useEffect
      return () => {
        unsubscribeStructures.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setError(
        "Une erreur est survenue lors du chargement des structures associées."
      );
    }
  };

  // Nouvelle fonction pour charger les médecins d'une structure spécifique
  const loadDoctorsForStructure = async (structureId) => {
    setLoadingDoctors(true);
    try {
      // Vérifier si nous avons déjà chargé les médecins pour cette structure
      if (structureDoctors[structureId]) {
        setSelectedStructureForDoctors(structureId);
        setLoadingDoctors(false);
        return;
      }

      const medecinQuery = query(
        collection(db, "medecins"),
        where("structures", "array-contains", structureId)
      );

      const medecinSnapshot = await getDocs(medecinQuery);
      const doctors = medecinSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Mettre à jour l'état avec les médecins de cette structure
      setStructureDoctors((prev) => ({
        ...prev,
        [structureId]: doctors
      }));

      setSelectedStructureForDoctors(structureId);
    } catch (error) {
      console.error("Erreur lors du chargement des médecins:", error);
      setError(
        "Une erreur est survenue lors du chargement des médecins de cette structure."
      );
    } finally {
      setLoadingDoctors(false);
    }
  };

  const setupAppointmentsListener = (patientId) => {
    try {
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("patientId", "==", patientId)
      );

      // Configurer l'écoute en temps réel des rendez-vous
      const unsubscribeAppointments = onSnapshot(
        appointmentsQuery,
        async (querySnapshot) => {
          if (querySnapshot.empty) {
            setAppointments([]);
            setAssignedDoctors([]);
            setDoctorAppointments({});
            setLoading(false);
            return;
          }

          // Structure pour stocker les rendez-vous par médecin
          const appointmentsByDoctor = {};
          // Ensemble pour stocker les IDs uniques des médecins
          const doctorIds = new Set();

          // Organiser les rendez-vous par médecin
          querySnapshot.docs.forEach((doc) => {
            const appointmentData = { id: doc.id, ...doc.data() };
            const doctorId = appointmentData.doctorId;

            if (doctorId) {
              doctorIds.add(doctorId);

              if (!appointmentsByDoctor[doctorId]) {
                appointmentsByDoctor[doctorId] = [];
              }

              appointmentsByDoctor[doctorId].push(appointmentData);
            }
          });

          // Récupérer les informations complètes des médecins
          const doctorsData = await Promise.all(
            Array.from(doctorIds).map(async (doctorId) => {
              const doctorDoc = await getDoc(doc(db, "medecins", doctorId));
              if (doctorDoc.exists()) {
                return { id: doctorDoc.id, ...doctorDoc.data() };
              }
              return null;
            })
          );

          // Filtrer les médecins null
          const validDoctors = doctorsData.filter((d) => d !== null);

          // Pour chaque rendez-vous, récupérer les infos de structure
          // Pour chaque rendez-vous, récupérer les infos de médecin et de structure
for (const doctorId in appointmentsByDoctor) {
  for (let i = 0; i < appointmentsByDoctor[doctorId].length; i++) {
    const apt = appointmentsByDoctor[doctorId][i];
    
    // Ajouter les informations du médecin
    const doctorInfo = validDoctors.find(d => d.id === doctorId);
    if (doctorInfo) {
      appointmentsByDoctor[doctorId][i].doctorInfo = doctorInfo;
    }
    
    // Ajouter les informations de structure
    if (apt.structureId) {
      const structureDoc = await getDoc(doc(db, "structures", apt.structureId));
      if (structureDoc.exists()) {
        appointmentsByDoctor[doctorId][i].structureInfo = {
          id: structureDoc.id,
          ...structureDoc.data()
        };
      }
    }
  }
}


          // Mettre à jour les états
          setAssignedDoctors(validDoctors);
          setDoctorAppointments(appointmentsByDoctor);
          setAppointments(Object.values(appointmentsByDoctor).flat());

          setLoading(false);
        },
        (error) => {
          console.error("Erreur lors de l'écoute des rendez-vous:", error);
          setError(
            "Une erreur est survenue lors du chargement de vos rendez-vous."
          );
          setLoading(false);
        }
      );

      // Configurer l'écoute en temps réel pour chaque médecin
      const doctorListeners = new Map();

      const setupDoctorListeners = async (doctorIds) => {
        // Nettoyer les listeners existants pour les médecins qui ne sont plus pertinents
        for (const [docId, unsubscribe] of doctorListeners.entries()) {
          if (!doctorIds.has(docId)) {
            unsubscribe();
            doctorListeners.delete(docId);
          }
        }

        // Ajouter de nouveaux listeners pour les nouveaux médecins
        for (const doctorId of doctorIds) {
          if (!doctorListeners.has(doctorId)) {
            const unsubscribe = onSnapshot(
              doc(db, "medecins", doctorId),
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  setAssignedDoctors((prevDoctors) => {
                    const existingIndex = prevDoctors.findIndex(
                      (d) => d.id === doctorId
                    );
                    const newDoctor = {
                      id: docSnapshot.id,
                      ...docSnapshot.data()
                    };

                    if (existingIndex >= 0) {
                      const updatedDoctors = [...prevDoctors];
                      updatedDoctors[existingIndex] = newDoctor;
                      return updatedDoctors;
                    } else {
                      return [...prevDoctors, newDoctor];
                    }
                  });
                }
              },
              (error) => {
                console.error(
                  `Erreur lors de l'écoute du médecin ${doctorId}:`,
                  error
                );
              }
            );

            doctorListeners.set(doctorId, unsubscribe);
          }
        }
      };

      // Observer les changements dans les IDs des médecins
      const unsubscribeDoctorIds = onSnapshot(
        appointmentsQuery,
        (querySnapshot) => {
          const newDoctorIds = new Set();
          querySnapshot.docs.forEach((doc) => {
            const doctorId = doc.data().doctorId;
            if (doctorId) {
              newDoctorIds.add(doctorId);
            }
          });

          setupDoctorListeners(newDoctorIds);
        }
      );

      // Fonction de nettoyage pour tous les listeners
      return () => {
        unsubscribeAppointments();
        unsubscribeDoctorIds();
        for (const unsubscribe of doctorListeners.values()) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration des listeners:", error);
      setError(
        "Une erreur est survenue lors de la configuration des mises à jour en temps réel."
      );
      setLoading(false);
    }
  };

  // Charger les structures pour le formulaire de rendez-vous
  const fetchStructuresForRdv = async () => {
    try {
      const structuresSnapshot = await getDocs(collection(db, "structures"));
      const structuresList = structuresSnapshot.docs.map((doc) => ({
        value: doc.id,
        label: doc.data().name,
        specialties: doc.data().specialties || []
      }));
      setStructuresOptions(structuresList);
    } catch (error) {
      console.error("Erreur lors du chargement des structures:", error);
      setFeedback({
        type: "danger",
        message: "Impossible de charger les structures médicales."
      });
    }
  };

  // Configurer l'écoute des notifications
  const setupNotificationsListener = (patientId) => {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", patientId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(newNotifications);

      // Vérifier s'il y a de nouvelles notifications concernant les demandes de rendez-vous
      const appointmentNotifications = newNotifications.filter((notif) =>
        [
          "appointment_accepted",
          "appointment_rejected",
          "request_pending"
        ].includes(notif.type)
      );

      if (appointmentNotifications.length > 0) {
        setHasNewNotifications(true);
      }
    });

    return unsubscribe;
  };



  // Fonction pour générer les données du QR code dans un format lisible
  const generateFormattedQRData = (appointment) => {
    // Vérifier que les informations nécessaires sont disponibles
    const doctorNom = appointment.doctorInfo?.nom || "Non spécifié";
    const doctorPrenom = appointment.doctorInfo?.prenom || "";
    const doctorSpecialite = appointment.doctorInfo?.specialite || "Non spécifiée";
    const structureName = appointment.structureInfo?.name || "Non spécifiée";
    const structureAddress = appointment.structureInfo?.address || "Non spécifiée";
  
    // Créer une chaîne formatée lisible quand le QR code est scanné
    const formattedData = `RENDEZ-VOUS MÉDICAL
  -------------------------------
  PATIENT: ${patient?.nom || ""} ${patient?.prenom || ""}
  ID PATIENT: ${patient?.id || ""}
  
  MÉDECIN: Dr. ${doctorNom} ${doctorPrenom}
  SPÉCIALITÉ: ${doctorSpecialite}
  
  STRUCTURE: ${structureName}
  ADRESSE: ${structureAddress}
  
  JOUR: ${appointment.day || ""}
  HEURE: ${appointment.timeSlot || ""}
  
  STATUT: ${appointment.status === "completed" ? "Terminé" : "En attente"}
  -------------------------------
  ID RENDEZ-VOUS: ${appointment.id}
  Généré le: ${new Date().toLocaleString('fr-FR')}`;
  
    return formattedData;
  };
  




  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("patientData");
      localStorage.removeItem("isAuthenticated");
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setError("Une erreur est survenue lors de la déconnexion.");
    }
  };

  const handleTabSelect = (key) => {
    setActiveTab(key);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Mettre à jour les spécialités et charger les médecins lorsqu'une structure est sélectionnée
  useEffect(() => {
    if (selectedStructure) {
      // Charger les spécialités disponibles
      const structureData = structuresOptions.find(
        (s) => s.value === selectedStructure.value
      );
      if (structureData && structureData.specialties) {
        const specialtiesOptions = structureData.specialties.map(
          (specialty) => ({
            value: specialty,
            label: specialty
          })
        );
        setSpecialties(specialtiesOptions);
      } else {
        setSpecialties([]);
      }

      // Charger les médecins de cette structure
      const loadDoctorsForSelectedStructure = async () => {
        try {
          const medecinQuery = query(
            collection(db, "medecins"),
            where("structures", "array-contains", selectedStructure.value)
          );

          const medecinSnapshot = await getDocs(medecinQuery);
          const doctors = medecinSnapshot.docs.map((doc) => ({
            value: doc.id,
            label: `Dr. ${doc.data().nom} ${doc.data().prenom} (${
              doc.data().specialite
            })`,
            specialite: doc.data().specialite,
            nom: doc.data().nom,
            prenom: doc.data().prenom,
            photoUrl: doc.data().photoUrl,
            disponibilite: doc.data().disponibilite || []
          }));

          setAvailableDoctors(doctors);
        } catch (error) {
          console.error("Erreur lors du chargement des médecins:", error);
          setFeedback({
            type: "danger",
            message: "Impossible de charger les médecins de cette structure."
          });
        }
      };

      loadDoctorsForSelectedStructure();
    } else {
      setSpecialties([]);
      setAvailableDoctors([]);
      setSelectedDoctor(null);
    }
  }, [selectedStructure, structuresOptions]);

  // Générer le texte récapitulatif
  // Générer le texte récapitulatif
  useEffect(() => {
    if (
      selectedStructure &&
      selectedSpecialty &&
      selectedDays.length > 0 &&
      selectedTimeSlots.length > 0 &&
      motif
    ) {
      const daysText = selectedDays.map((day) => day.label).join(", ");
      const timeSlotsText = selectedTimeSlots
        .map((slot) => slot.label)
        .join(", ");
  
      // Ajouter les informations du médecin au récapitulatif si un médecin est sélectionné
      const doctorText = selectedDoctor
        ? `\nMédecin demandé: Dr. ${selectedDoctor.prenom} ${selectedDoctor.nom} (${selectedDoctor.specialite})`
        : "\nMédecin: Non spécifié (la structure vous assignera un médecin disponible)";
  
      // Ajouter les informations de paiement
      const paymentText = paymentCompleted
        ? `\n\nPaiement: 
        Montant: 200 FCFA
        Méthode: ${
          paymentMethod === "orange-money" 
            ? "Orange Money" 
            : paymentMethod === "mtn-momo" 
              ? "MTN MoMo" 
              : "Wave"
        }
        Numéro: ${phoneNumber}
        Statut: Payé`
        : "";
  
      const summary = `
      Demande de rendez-vous:
      
      Structure: ${selectedStructure.label}
      Spécialité: ${selectedSpecialty.label}${doctorText}
      Jours préférés: ${daysText}
      Horaires préférés: ${timeSlotsText}
      Motif de consultation: ${motif.label}${paymentText}
    `;
  
      setRequestSummary(summary);
    } else {
      setRequestSummary("");
    }
  }, [
    selectedStructure,
    selectedSpecialty,
    selectedDoctor,
    selectedDays,
    selectedTimeSlots,
    motif,
    paymentCompleted,
    paymentMethod,
    phoneNumber
  ]);




  // Filtrer les médecins disponibles lorsqu'une spécialité est sélectionnée
  useEffect(() => {
    if (selectedSpecialty && availableDoctors.length > 0) {
      // Si le médecin actuellement sélectionné n'est pas de cette spécialité, réinitialiser
      if (
        selectedDoctor &&
        selectedDoctor.specialite !== selectedSpecialty.value
      ) {
        setSelectedDoctor(null);
      }
    }
  }, [selectedSpecialty, availableDoctors, selectedDoctor]);

  // Vérifier si le formulaire est complet
  const isFormComplete = () => {
    return (
      selectedStructure &&
      selectedSpecialty &&
      selectedDays.length > 0 &&
      selectedTimeSlots.length > 0 &&
      motif
    );
  };

  // Afficher le récapitulatif
// Afficher le récapitulatif
const handleShowSummary = (e) => {
  e.preventDefault();
  if (isFormComplete()) {
    // Collecter les informations de paiement sans effectuer le paiement
    if (!paymentMethod) {
      setPaymentMethod("orange-money"); // Valeur par défaut
    }
    if (!phoneNumber) {
      setPhoneNumber(patient?.telephone || ""); // Utiliser le numéro du patient par défaut
    }
    
    setShowSummary(true);
  } else {
    setFeedback({
      type: "warning",
      message: "Veuillez remplir tous les champs requis."
    });
  }
};


// Fonction pour gérer le paiement
const handlePayment = async () => {
  setPaymentLoading(true);
  setPaymentError("");
  
  try {
    // Simuler une requête de paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérifier si le numéro de téléphone est valide (simple validation)
    if (!phoneNumber || phoneNumber.length < 8) {
      throw new Error("Numéro de téléphone invalide");
    }
    
    // Simuler un paiement réussi
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    
    // Notification de paiement réussi
    toast.success("Paiement de 200 FCFA effectué avec succès !");
    
    // Continuer avec la soumission automatique
    handleSubmit({ preventDefault: () => {} });
  } catch (error) {
    console.error("Erreur de paiement:", error);
    setPaymentError(error.message || "Une erreur est survenue lors du paiement");
  } finally {
    setPaymentLoading(false);
  }
};



// État pour le paiement
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentAmount, setPaymentAmount] = useState(2000); // Montant en FCFA
const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', 'pending'
const [paymentReference, setPaymentReference] = useState("");

// Référence pour vérifier si PayTech est chargé
const payTechLoaded = useRef(false);

const [paymentProcessing, setPaymentProcessing] = useState(false);

// Charger les scripts PayTech
useEffect(() => {
  // Charger le script PayTech
  const script = document.createElement('script');
  script.src = 'https://paytech.sn/cdn/paytech.min.js';
  script.async = true;
  document.body.appendChild(script);

  // Charger le CSS PayTech
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://paytech.sn/cdn/paytech.min.css';
  document.head.appendChild(link);

  return () => {
    // Nettoyer les scripts lors du démontage du composant
    if (script.parentNode) document.body.removeChild(script);
    if (link.parentNode) document.head.removeChild(link);
  };
}, []);



// Fonction pour initialiser le paiement
// Fonction pour initialiser le paiement
const handlePaymentInitiation = () => {
  if (!window.PayTech) {
    toast.error("Le système de paiement n'est pas encore chargé. Veuillez réessayer.");
    return;
  }
  
  setPaymentProcessing(true);
  
  // Générer une référence unique pour le paiement
  const paymentRef = `RDV-${patient?.id.substring(0, 5)}-${Date.now()}`;
  
  try {
    (new window.PayTech({
      item_name: "Frais de dossier - Demande de rendez-vous",
      item_price: paymentAmount,
      currency: "XOF",
      ref_command: paymentRef,
      command_name: `Rendez-vous médical - ${selectedStructure?.label || 'Structure médicale'}`,
      env: "test", // Utiliser "prod" en production
      ipn_url: "https://votre-backend.com/api/payment-callback", // URL de callback côté serveur
      success_url: window.location.href + "?payment=success",
      cancel_url: window.location.href + "?payment=cancel",
      customer_id: patient?.id,
      customer_email: patient?.email,
      customer_phone_number: patient?.telephone || "",
      customer_address: patient?.adresse || "",
      customer_city: "",
      customer_country: "SN",
      customer_state: "",
      customer_zip_code: ""
    })).withOption({
      requestTokenUrl: 'https://paytech.sn/api/payment/request-payment',
      method: 'POST',
      headers: {
        'API_KEY': '0360fc1c628c4527a6035a75d63bbd9ec2ad27da5e56b39be53019a36578c80c',
        'API_SECRET': '3f2048b8e427fa67a3a6341bcfe3795abc05cdd68ad101d6f51ebe6734340b9c'
      },
      presentationMode: window.PayTech.OPEN_IN_POPUP,
      onComplete: function(response) {
        setPaymentProcessing(false);
        
        if (response.status === "success") {
          // Soumettre la demande avec la référence de paiement
          handleSubmit(null, paymentRef);
          toast.success("Paiement effectué avec succès!");
        } else {
          toast.error("Le paiement a échoué. Veuillez réessayer.");
        }
      }
    }).send();
  } catch (error) {
    console.error("Erreur lors de l'initialisation du paiement:", error);
    toast.error("Une erreur est survenue lors de l'initialisation du paiement.");
    setPaymentProcessing(false);
  }
};

// Modifier la fonction handleSubmit pour accepter la référence de paiement
const handleSubmit = async (e, paymentRef = null) => {
  if (e) e.preventDefault();

  if (!isFormComplete()) {
    setFeedback({
      type: "warning",
      message: "Veuillez remplir tous les champs requis."
    });
    return;
  }

  setRdvLoading(true);

  try {
    // Créer la demande de rendez-vous dans Firestore avec le texte récapitulatif
    const requestRef = await addDoc(collection(db, "appointmentRequests"), {
      patientId: patient?.id,
      patientInfo: {
        nom: patient?.nom,
        prenom: patient?.prenom,
        email: patient?.email,
        telephone: patient?.telephone,
        age: patient?.age,
        sexe: patient?.sexe,
        insurance: patient?.insurance || []
      },
      structureId: selectedStructure.value,
      structureName: selectedStructure.label,
      specialty: selectedSpecialty.value,
      // Ajouter les informations du médecin si sélectionné
      doctorId: selectedDoctor ? selectedDoctor.value : null,
      doctorInfo: selectedDoctor
        ? {
            nom: selectedDoctor.nom,
            prenom: selectedDoctor.prenom,
            specialite: selectedDoctor.specialite
          }
        : null,
      requestText: requestSummary.trim(),
      status: "pending",
      requestDate: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      // Ajouter les informations de paiement
      payment: {
        status: paymentRef ? "completed" : "pending",
        amount: paymentAmount,
        reference: paymentRef || "",
        date: new Date().toISOString()
      }
    });

    // Créer une notification pour le patient
    await addDoc(collection(db, "notifications"), {
      userId: patient?.id,
      title: "Demande de rendez-vous envoyée",
      message: `Votre demande de rendez-vous en ${selectedSpecialty.value} a été envoyée à ${selectedStructure.label}.`,
      type: "request_pending",
      requestId: requestRef.id,
      createdAt: new Date().toISOString(),
      read: false
    });

    setFeedback({
      type: "success",
      message: "Votre demande de rendez-vous a été envoyée avec succès!"
    });

    // Réinitialiser le formulaire
    setSelectedStructure(null);
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedDays([]);
    setSelectedTimeSlots([]);
    setMotif(null);
    setShowSummary(false);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande:", error);
    setFeedback({
      type: "danger",
      message: "Une erreur s'est produite lors de l'envoi de votre demande."
    });
  } finally {
    setRdvLoading(false);
  }
};


// Composant de tableau des demandes de rendez-vous
const RequestsTable = ({ patientId }) => {
  const [requests, setRequests] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestToAction, setRequestToAction] = useState(null);
  const [actionType, setActionType] = useState(null); // "delete" ou "cancel"
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState("success");

  useEffect(() => {
    if (!patientId) return;

    const requestsQuery = query(
      collection(db, "appointmentRequests"),
      where("patientId", "==", patientId)
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setRequests(requestsData);
      setTableLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  // Fonction pour afficher une alerte
  const showAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000); // L'alerte disparaît après 5 secondes
  };

  // Fonction pour ouvrir la modal de confirmation de suppression
  const handleDeleteClick = (request) => {
    setRequestToAction(request);
    setActionType("delete");
    setShowConfirmModal(true);
  };

  // Fonction pour ouvrir la modal de confirmation d'annulation
  const handleCancelClick = (request) => {
    setRequestToAction(request);
    setActionType("cancel");
    setShowConfirmModal(true);
  };

  // Fonction pour confirmer l'action (suppression ou annulation)
  const handleConfirmAction = async () => {
    if (!requestToAction) return;
    
    setActionLoading(true);
    try {
      if (actionType === "delete") {
        // Suppression complète de la demande
        await deleteDoc(doc(db, "appointmentRequests", requestToAction.id));
        showAlert("La demande a été supprimée avec succès", "success");
      } else if (actionType === "cancel") {
        // Mise à jour du statut en "cancelled"
        await updateDoc(doc(db, "appointmentRequests", requestToAction.id), {
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelledBy: "patient"
        });
        showAlert("Le rendez-vous a été annulé avec succès", "success");
      }
    } catch (error) {
      console.error("Erreur lors de l'action:", error);
      showAlert(`Erreur lors de l'${actionType === "delete" ? "suppression" : "annulation"} de la demande`, "danger");
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setRequestToAction(null);
      setActionType(null);
    }
  };

  if (tableLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">
          Vous n'avez pas encore fait de demande de rendez-vous.
        </p>
      </div>
    );
  }

  return (
    <>
      {alertMessage && (
        <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
          {alertMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlertMessage(null)}
            aria-label="Fermer"
          ></button>
        </div>
      )}
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Date de demande</th>
              <th>Structure</th>
              <th>Spécialité</th>
              <th>Médecin</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className={request.status === "cancelled" ? "text-muted" : ""}>
                <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                <td>{request.structureName}</td>
                <td>{typeof request.specialty === 'string' ? request.specialty : ''}</td>
                <td>
                  {request.doctorInfo ? (
                    `Dr. ${request.doctorInfo.prenom || ''} ${request.doctorInfo.nom || ''}`
                  ) : (
                    <span className="text-muted">Non spécifié</span>
                  )}
                </td>
                <td>
                  <Badge
                    bg={
                      request.status === "pending"
                        ? "warning"
                        : request.status === "accepted"
                        ? "success"
                        : request.status === "cancelled"
                        ? "secondary"
                        : "danger"
                    }
                  >
                    {request.status === "pending"
                      ? "En attente"
                      : request.status === "accepted"
                      ? "Acceptée"
                      : request.status === "cancelled"
                      ? "Annulée"
                      : "Refusée"}
                  </Badge>
                  {request.status === "rejected" && request.notes && (
                    <div className="mt-1">
                      <small className="text-muted">
                        Motif: {request.notes}
                      </small>
                    </div>
                  )}
                  {request.status === "accepted" &&
                    request.appointmentDetails &&
                    request.appointmentDetails.doctorInfo && (
                      <div className="mt-1">
                        <small className="text-success">
                          Rendez-vous avec Dr.{" "}
                          {request.appointmentDetails.doctorInfo.prenom || ''}{" "}
                          {request.appointmentDetails.doctorInfo.nom || ''}
                        </small>
                      </div>
                    )}
                </td>
                <td>
                  {request.status === "accepted" ? (
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={() => handleCancelClick(request)}
                      title="Annuler le rendez-vous"
                      className="me-1"
                    >
                      <i className="bi bi-calendar-x"></i> Annuler
                    </Button>
                  ) : request.status !== "cancelled" && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteClick(request)}
                      title="Supprimer la demande"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmation */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === "delete" ? "Confirmer la suppression" : "Confirmer l'annulation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionType === "delete" ? (
            <>
              Êtes-vous sûr de vouloir supprimer définitivement cette demande de rendez-vous ?
              {requestToAction?.status === "pending" && (
                <div className="mt-2 alert alert-warning">
                  Cette demande est encore en attente de traitement.
                </div>
              )}
            </>
          ) : (
            <>
              Êtes-vous sûr de vouloir annuler ce rendez-vous ?
              <div className="mt-2 alert alert-info">
                L'établissement de santé sera notifié de cette annulation.
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Retour
          </Button>
          <Button 
            variant={actionType === "delete" ? "danger" : "warning"} 
            onClick={handleConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">
                  {actionType === "delete" ? "Suppression..." : "Annulation..."}
                </span>
              </>
            ) : (
              actionType === "delete" ? "Supprimer" : "Annuler le rendez-vous"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};


  // Composant pour afficher les médecins d'une structure
 // Composant pour afficher les médecins d'une structure
const StructureDoctorsComponent = () => {
  // États supplémentaires
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [viewMode, setViewMode] = useState("card"); // "card" ou "list"
  const [sortBy, setSortBy] = useState("name"); // "name", "specialty", "availability"
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
  const [specialtyOptions, setSpecialtyOptions] = useState([]);
  const [favoritesDoctors, setFavoritesDoctors] = useState([]);

  // Effet pour charger les médecins favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteDoctors');
    if (savedFavorites) {
      setFavoritesDoctors(JSON.parse(savedFavorites));
    }
  }, []);

  // Fonction pour ajouter/retirer un médecin des favoris
  const toggleFavorite = (doctorId) => {
    setFavoritesDoctors(prev => {
      let newFavorites;
      if (prev.includes(doctorId)) {
        newFavorites = prev.filter(id => id !== doctorId);
      } else {
        newFavorites = [...prev, doctorId];
      }
      localStorage.setItem('favoriteDoctors', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Effet pour extraire les spécialités uniques
  useEffect(() => {
    if (selectedStructureForDoctors && structureDoctors[selectedStructureForDoctors]) {
      const specialties = [...new Set(structureDoctors[selectedStructureForDoctors]
        .map(doctor => doctor.specialite)
        .filter(Boolean))];
      setSpecialtyOptions(specialties);
    }
  }, [selectedStructureForDoctors, structureDoctors]);

 // Fonction pour filtrer et trier les médecins
const getFilteredDoctors = () => {
  if (!selectedStructureForDoctors || !structureDoctors[selectedStructureForDoctors]) {
    return [];
  }

  let doctors = [...structureDoctors[selectedStructureForDoctors]];

  // Filtrer par recherche
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    doctors = doctors.filter(doctor => {
      // Convertir explicitement en chaînes de caractères ou utiliser une chaîne vide
      const nom = typeof doctor.nom === 'string' ? doctor.nom.toLowerCase() : '';
      const prenom = typeof doctor.prenom === 'string' ? doctor.prenom.toLowerCase() : '';
      const specialite = typeof doctor.specialite === 'string' ? doctor.specialite.toLowerCase() : '';
      
      return nom.includes(term) || prenom.includes(term) || specialite.includes(term);
    });
  }

  // Filtrer par spécialité
  if (filterSpecialty) {
    doctors = doctors.filter(doctor => doctor.specialite === filterSpecialty);
  }

  // Filtrer par jour de disponibilité
  if (filterDay) {
    doctors = doctors.filter(doctor => 
      doctor.disponibilite && doctor.disponibilite.includes(filterDay)
    );
  }

  // Trier les médecins
  switch (sortBy) {
    case "name":
      doctors.sort((a, b) => {
        const nameA = `${typeof a.nom === 'string' ? a.nom : ''} ${typeof a.prenom === 'string' ? a.prenom : ''}`;
        const nameB = `${typeof b.nom === 'string' ? b.nom : ''} ${typeof b.prenom === 'string' ? b.prenom : ''}`;
        return nameA.localeCompare(nameB);
      });
      break;
    case "specialty":
      doctors.sort((a, b) => {
        const specA = typeof a.specialite === 'string' ? a.specialite : '';
        const specB = typeof b.specialite === 'string' ? b.specialite : '';
        return specA.localeCompare(specB);
      });
      break;
    case "availability":
      doctors.sort((a, b) => {
        const aAvail = a.disponibilite?.length || 0;
        const bAvail = b.disponibilite?.length || 0;
        return bAvail - aAvail;
      });
      break;
    case "favorites":
      doctors.sort((a, b) => {
        const aIsFav = favoritesDoctors.includes(a.id) ? -1 : 1;
        const bIsFav = favoritesDoctors.includes(b.id) ? -1 : 1;
        return aIsFav - bIsFav;
      });
      break;
  }

  return doctors;
};


  // Fonction pour afficher les détails d'un médecin
  const viewDoctorDetails = (doctor) => {
    setSelectedDoctorDetails(doctor);
    setShowDoctorDetails(true);
  };

  if (!structures || structures.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">
          Vous n'êtes affilié à aucune structure médicale.
        </p>
      </div>
    );
  }

  const filteredDoctors = selectedStructureForDoctors ? getFilteredDoctors() : [];

  return (
    <div>
      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">
          Sélectionnez une structure
        </Form.Label>
        <Form.Select
          value={selectedStructureForDoctors || ""}
          onChange={(e) => {
            if (e.target.value) {
              loadDoctorsForStructure(e.target.value);
              // Réinitialiser les filtres
              setSearchTerm("");
              setFilterSpecialty("");
              setFilterDay("");
            } else {
              setSelectedStructureForDoctors(null);
            }
          }}
        >
          <option value="">Choisir une structure</option>
          {structures.map((structure) => (
            <option key={structure.id} value={structure.id}>
              {structure.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {loadingDoctors ? (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">
              Chargement des médecins...
            </span>
          </Spinner>
        </div>
      ) : selectedStructureForDoctors ? (
        <>
          {/* Barre de recherche et filtres */}
          <div className="mb-4 p-3 bg-light rounded">
            <Row className="g-2">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Rechercher un médecin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                >
                  <option value="">Toutes les spécialités</option>
                  {specialtyOptions.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                >
                  <option value="">Tous les jours</option>
                  {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Trier par nom</option>
                  <option value="specialty">Trier par spécialité</option>
                  <option value="availability">Trier par disponibilité</option>
                  <option value="favorites">Favoris en premier</option>
                </Form.Select>
              </Col>
            </Row>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <Badge bg="primary" className="me-2">
                  {filteredDoctors.length} médecin(s) trouvé(s)
                </Badge>
                {searchTerm && (
                  <Badge bg="info">
                    Recherche: "{searchTerm}"
                  </Badge>
                )}
              </div>
              <ButtonGroup>
                <Button
                  variant={viewMode === "card" ? "primary" : "outline-primary"}
                  onClick={() => setViewMode("card")}
                >
                  <FaThLarge /> Cartes
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "outline-primary"}
                  onClick={() => setViewMode("list")}
                >
                  <FaList /> Liste
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Affichage des médecins */}
          {filteredDoctors.length > 0 ? (
            viewMode === "card" ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredDoctors.map((doctor) => (
                  <Col key={doctor.id}>
                    <Card className="h-100 shadow-sm doctor-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <div className="d-flex align-items-center mb-3">
                            {doctor.photoUrl ? (
                              <img
                                src={doctor.photoUrl}
                                alt={`Dr. ${doctor.nom} ${doctor.prenom}`}
                                className="me-3 rounded-circle"
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover"
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{ width: "60px", height: "60px" }}
                              >
                                <FaUserMd size={25} className="text-primary" />
                              </div>
                            )}
                            <div>
                              <Card.Title className="mb-0">
                                Dr. {doctor.nom} {doctor.prenom}
                              </Card.Title>
                              <Badge bg="info" className="mt-1">
                                {doctor.specialite}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="link" 
                            className="p-0 text-warning"
                            onClick={() => toggleFavorite(doctor.id)}
                          >
                            {favoritesDoctors.includes(doctor.id) ? (
                              <FaStar size={20} />
                            ) : (
                              <FaRegStar size={20} />
                            )}
                          </Button>
                        </div>

                        <ListGroup variant="flush" className="small">
                          <ListGroup.Item className="px-0 py-2">
                            <FaPhoneAlt className="me-2 text-primary" />
                            {doctor.telephone || "Non renseigné"}
                          </ListGroup.Item>
                          <ListGroup.Item className="px-0 py-2 text-break">
                            <FaEnvelope className="me-2 text-primary" />
                            {doctor.email || "Non renseigné"}
                          </ListGroup.Item>
                          <ListGroup.Item className="px-0 py-2">
                            <FaClock className="me-2 text-primary" />
                            {doctor.heureDebut} - {doctor.heureFin}
                          </ListGroup.Item>
                        </ListGroup>

                        {doctor.disponibilite &&
                          doctor.disponibilite.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1 fw-bold">
                                Jours de consultation:
                              </p>
                              <div className="d-flex flex-wrap gap-1">
                                {doctor.disponibilite.map((day) => (
                                  <Badge
                                    key={day}
                                    bg="light"
                                    text="dark"
                                    className="p-2"
                                  >
                                    {day}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </Card.Body>
                      <Card.Footer className="bg-white">
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => viewDoctorDetails(doctor)}
                          >
                            <FaInfoCircle className="me-1" /> Détails
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-grow-1"
                            onClick={() => {
                              // Préremplir le formulaire de demande de RDV avec ce médecin
                              const structureOption = structuresOptions.find(
                                (s) => s.value === selectedStructureForDoctors
                              );
                              if (structureOption) {
                                setSelectedStructure(structureOption);
                                const specialtyOption = {
                                  value: doctor.specialite,
                                  label: doctor.specialite
                                };
                                setSelectedSpecialty(specialtyOption);

                                // Préremplir également le médecin
                                const doctorOption = {
                                  value: doctor.id,
                                  label: `Dr. ${doctor.nom} ${doctor.prenom} (${doctor.specialite})`,
                                  specialite: doctor.specialite,
                                  nom: doctor.nom,
                                  prenom: doctor.prenom,
                                  photoUrl: doctor.photoUrl,
                                  disponibilite: doctor.disponibilite || []
                                };
                                setSelectedDoctor(doctorOption);

                                setActiveTab("rdv");
                              }
                            }}
                          >
                            <FaCalendarPlus className="me-1" /> Rendez-vous
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <ListGroup>
                {filteredDoctors.map((doctor) => (
                                   <ListGroup.Item 
                                   key={doctor.id}
                                   className="mb-2 border rounded"
                                 >
                                   <Row className="align-items-center">
                                     <Col xs={12} md={1} className="text-center mb-2 mb-md-0">
                                       {doctor.photoUrl ? (
                                         <img
                                           src={doctor.photoUrl}
                                           alt={`Dr. ${doctor.nom} ${doctor.prenom}`}
                                           className="rounded-circle"
                                           style={{
                                             width: "50px",
                                             height: "50px",
                                             objectFit: "cover"
                                           }}
                                         />
                                       ) : (
                                         <div
                                           className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                                           style={{ width: "50px", height: "50px" }}
                                         >
                                           <FaUserMd size={20} className="text-primary" />
                                         </div>
                                       )}
                                     </Col>
                                     <Col xs={12} md={3}>
                                       <div className="d-flex align-items-center">
                                         <h6 className="mb-0">Dr. {doctor.nom} {doctor.prenom}</h6>
                                         <Button 
                                           variant="link" 
                                           className="p-0 ms-2 text-warning"
                                           onClick={() => toggleFavorite(doctor.id)}
                                         >
                                           {favoritesDoctors.includes(doctor.id) ? (
                                             <FaStar size={16} />
                                           ) : (
                                             <FaRegStar size={16} />
                                           )}
                                         </Button>
                                       </div>
                                       <Badge bg="info" className="mt-1">
                                         {doctor.specialite}
                                       </Badge>
                                     </Col>
                                     <Col xs={12} md={3}>
                                       <div className="small">
                                         <div><FaPhoneAlt className="me-2 text-primary" /> {doctor.telephone || "Non renseigné"}</div>
                                         <div className="text-truncate"><FaEnvelope className="me-2 text-primary" /> {doctor.email || "Non renseigné"}</div>
                                       </div>
                                     </Col>
                                     <Col xs={12} md={3}>
                                       <div className="small">
                                         <div><FaClock className="me-2 text-primary" /> {doctor.heureDebut} - {doctor.heureFin}</div>
                                         <div className="d-flex flex-wrap gap-1 mt-1">
                                           {doctor.disponibilite && doctor.disponibilite.map((day) => (
                                             <Badge
                                               key={day}
                                               bg="light"
                                               text="dark"
                                               className="p-1"
                                             >
                                               {day.substring(0, 3)}
                                             </Badge>
                                           ))}
                                         </div>
                                       </div>
                                     </Col>
                                     <Col xs={12} md={2} className="mt-2 mt-md-0">
                                       <div className="d-flex gap-2">
                                         <Button
                                           variant="outline-primary"
                                           size="sm"
                                           onClick={() => viewDoctorDetails(doctor)}
                                         >
                                           <FaInfoCircle />
                                         </Button>
                                         <Button
                                           variant="primary"
                                           size="sm"
                                           className="flex-grow-1"
                                           onClick={() => {
                                             // Préremplir le formulaire de demande de RDV avec ce médecin
                                             const structureOption = structuresOptions.find(
                                               (s) => s.value === selectedStructureForDoctors
                                             );
                                             if (structureOption) {
                                               setSelectedStructure(structureOption);
                                               const specialtyOption = {
                                                 value: doctor.specialite,
                                                 label: doctor.specialite
                                               };
                                               setSelectedSpecialty(specialtyOption);
               
                                               // Préremplir également le médecin
                                               const doctorOption = {
                                                 value: doctor.id,
                                                 label: `Dr. ${doctor.nom} ${doctor.prenom} (${doctor.specialite})`,
                                                 specialite: doctor.specialite,
                                                 nom: doctor.nom,
                                                 prenom: doctor.prenom,
                                                 photoUrl: doctor.photoUrl,
                                                 disponibilite: doctor.disponibilite || []
                                               };
                                               setSelectedDoctor(doctorOption);
               
                                               setActiveTab("rdv");
                                             }
                                           }}
                                         >
                                           Rendez-vous
                                         </Button>
                                       </div>
                                     </Col>
                                   </Row>
                                 </ListGroup.Item>
                               ))}
                             </ListGroup>
                           )
                         ) : (
                           <div className="text-center py-4">
                             <FaSearch size={40} className="text-muted mb-3" />
                             <p className="text-muted">
                               Aucun médecin ne correspond à vos critères de recherche.
                             </p>
                             <Button 
                               variant="outline-primary" 
                               onClick={() => {
                                 setSearchTerm("");
                                 setFilterSpecialty("");
                                 setFilterDay("");
                               }}
                             >
                               Réinitialiser les filtres
                             </Button>
                           </div>
                         )}
               
                         {/* Pagination si nécessaire */}
                         {filteredDoctors.length > 12 && (
                           <div className="d-flex justify-content-center mt-4">
                             <Pagination>
                               <Pagination.Prev />
                               <Pagination.Item active>{1}</Pagination.Item>
                               <Pagination.Item>{2}</Pagination.Item>
                               <Pagination.Item>{3}</Pagination.Item>
                               <Pagination.Ellipsis />
                               <Pagination.Next />
                             </Pagination>
                           </div>
                         )}
                       </>
                     ) : (
                       <div className="text-center py-4">
                         <p className="text-muted">
                           Veuillez sélectionner une structure pour voir les médecins.
                         </p>
                       </div>
                     )}
               
                     {/* Modal pour afficher les détails d'un médecin */}
                     <Modal
                       show={showDoctorDetails}
                       onHide={() => setShowDoctorDetails(false)}
                       size="lg"
                       centered
                     >
                       {selectedDoctorDetails && (
                         <>
                           <Modal.Header closeButton>
                             <Modal.Title>
                               Profil du Dr. {selectedDoctorDetails.nom} {selectedDoctorDetails.prenom}
                             </Modal.Title>
                           </Modal.Header>
                           <Modal.Body>
                             <Row>
                               <Col md={4} className="text-center mb-4">
                                 {selectedDoctorDetails.photoUrl ? (
                                   <img
                                     src={selectedDoctorDetails.photoUrl}
                                     alt={`Dr. ${selectedDoctorDetails.nom} ${selectedDoctorDetails.prenom}`}
                                     className="img-fluid rounded-circle mb-3"
                                     style={{
                                       width: "150px",
                                       height: "150px",
                                       objectFit: "cover"
                                     }}
                                   />
                                 ) : (
                                   <div
                                     className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                     style={{ width: "150px", height: "150px" }}
                                   >
                                     <FaUserMd size={60} className="text-primary" />
                                   </div>
                                 )}
                                 <h4>Dr. {selectedDoctorDetails.nom} {selectedDoctorDetails.prenom}</h4>
                                 <Badge bg="info" className="fs-6 mb-2">
                                   {selectedDoctorDetails.specialite}
                                 </Badge>
                                 <div className="d-flex justify-content-center mt-2">
                                   <Button 
                                     variant={favoritesDoctors.includes(selectedDoctorDetails.id) ? "warning" : "outline-warning"}
                                     size="sm"
                                     onClick={() => toggleFavorite(selectedDoctorDetails.id)}
                                   >
                                     {favoritesDoctors.includes(selectedDoctorDetails.id) ? (
                                       <>
                                         <FaStar className="me-1" /> Retiré des favoris
                                       </>
                                     ) : (
                                       <>
                                         <FaRegStar className="me-1" /> Ajouter aux favoris
                                       </>
                                     )}
                                   </Button>
                                 </div>
                               </Col>
                               <Col md={8}>
                                 <Card className="mb-3">
                                   <Card.Header className="bg-primary text-white">
                                     <FaInfoCircle className="me-2" /> Informations de contact
                                   </Card.Header>
                                   <Card.Body>
                                     <ListGroup variant="flush">
                                       <ListGroup.Item className="d-flex">
                                         <div className="me-3">
                                           <FaPhoneAlt className="text-primary" />
                                         </div>
                                         <div>
                                           <div className="fw-bold">Téléphone</div>
                                           <div>{selectedDoctorDetails.telephone || "Non renseigné"}</div>
                                         </div>
                                       </ListGroup.Item>
                                       <ListGroup.Item className="d-flex">
                                         <div className="me-3">
                                           <FaEnvelope className="text-primary" />
                                         </div>
                                         <div>
                                           <div className="fw-bold">Email</div>
                                           <div>{selectedDoctorDetails.email || "Non renseigné"}</div>
                                         </div>
                                       </ListGroup.Item>
                                     </ListGroup>
                                   </Card.Body>
                                 </Card>
               
                                 <Card className="mb-3">
                                   <Card.Header className="bg-primary text-white">
                                     <FaClock className="me-2" /> Horaires et disponibilités
                                   </Card.Header>
                                   <Card.Body>
                                     <Row className="mb-3">
                                       <Col xs={6}>
                                         <div className="fw-bold">Heures de consultation</div>
                                         <div>{selectedDoctorDetails.heureDebut} - {selectedDoctorDetails.heureFin}</div>
                                       </Col>
                                       <Col xs={6}>
                                         <div className="fw-bold">Durée moyenne de consultation</div>
                                         <div>{selectedDoctorDetails.dureeMoyenneConsultation || "30"} minutes</div>
                                       </Col>
                                     </Row>
                                     <div className="fw-bold mb-2">Jours de consultation</div>
                                     <div className="d-flex flex-wrap gap-2">
                                       {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                                         <Badge
                                           key={day}
                                           bg={selectedDoctorDetails.disponibilite?.includes(day) ? "success" : "light"}
                                           text={selectedDoctorDetails.disponibilite?.includes(day) ? "white" : "secondary"}
                                           className="p-2"
                                         >
                                           {day}
                                         </Badge>
                                       ))}
                                     </div>
                                   </Card.Body>
                                 </Card>
               
                                 {selectedDoctorDetails.biographie && (
                                   <Card className="mb-3">
                                     <Card.Header className="bg-primary text-white">
                                       <FaUserMd className="me-2" /> Biographie
                                     </Card.Header>
                                     <Card.Body>
                                       <p>{selectedDoctorDetails.biographie}</p>
                                     </Card.Body>
                                   </Card>
                                 )}
                               </Col>
                             </Row>
                           </Modal.Body>
                           <Modal.Footer>
                             <Button variant="secondary" onClick={() => setShowDoctorDetails(false)}>
                               Fermer
                             </Button>
                             <Button
                               variant="primary"
                               onClick={() => {
                                 // Préremplir le formulaire de demande de RDV avec ce médecin
                                 const structureOption = structuresOptions.find(
                                   (s) => s.value === selectedStructureForDoctors
                                 );
                                 if (structureOption) {
                                   setSelectedStructure(structureOption);
                                   const specialtyOption = {
                                     value: selectedDoctorDetails.specialite,
                                     label: selectedDoctorDetails.specialite
                                   };
                                   setSelectedSpecialty(specialtyOption);
               
                                   // Préremplir également le médecin
                                   const doctorOption = {
                                     value: selectedDoctorDetails.id,
                                     label: `Dr. ${selectedDoctorDetails.nom} ${selectedDoctorDetails.prenom} (${selectedDoctorDetails.specialite})`,
                                     specialite: selectedDoctorDetails.specialite,
                                     nom: selectedDoctorDetails.nom,
                                     prenom: selectedDoctorDetails.prenom,
                                     photoUrl: selectedDoctorDetails.photoUrl,
                                     disponibilite: selectedDoctorDetails.disponibilite || []
                                   };
                                   setSelectedDoctor(doctorOption);
               
                                   setShowDoctorDetails(false);
                                   setActiveTab("rdv");
                                 }
                               }}
                             >
                               Demander un rendez-vous
                             </Button>
                           </Modal.Footer>
                         </>
                       )}
                     </Modal>
                   </div>
                 );
               };
               



  if (loading) {
    return (



      <Container className="d-flex justify-content-center align-items-center vh-100">

        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Chargement de vos données...</span>
      </Container>
    );
  }

 // Composant de barre latérale de navigation
 const SidebarNavigation = () => (
  <Card className="shadow-sm border-0 h-100">
    <Card.Body className="p-0">
      <Nav
        variant="pills"
        className="flex-column"
        activeKey={activeTab}
        onSelect={handleTabSelect}
      >
        <Nav.Item>
          <Nav.Link eventKey="profile" className="d-flex align-items-center">
            <FaUser className="me-2" />
            Mon profil
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            eventKey="structures"
            className="d-flex align-items-center"
          >
            <FaHospital className="me-2" />
            Mes structures
            <Badge bg="primary" className="ms-auto">
              {structures.length}
            </Badge>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link
            eventKey="appointments"
            className="d-flex align-items-center"
          >
            <FaCalendarAlt className="me-2" />
            Mes rendez-vous
            <Badge bg="primary" className="ms-auto">
              {appointments.length}
            </Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="doctors" className="d-flex align-items-center">
            <FaUserMd className="me-2" />
            Médecins
          </Nav.Link>
        </Nav.Item>
       {/* Version avec animation */}
<Nav.Item>
  <Nav.Link eventKey="messaging" className="d-flex align-items-center position-relative">
    <FaComment className="me-2" />
    Messagerie
    {hasNewMessages && (
      <>
        <Badge 
          bg="danger" 
          className="ms-auto message-badge pulse-animation"
          pill
        >
          {unreadMessages}
        </Badge>
        {/* Ajouter ce style dans votre CSS */}
        
        
      </>
    )}
  </Nav.Link>
</Nav.Item>

        <Nav.Item>
          <Nav.Link eventKey="rdv" className="d-flex align-items-center">
            <FaCalendarAlt className="me-2" />
            Demander un RDV
            {hasNewNotifications && (
              <Badge bg="danger" className="ms-auto">
                {notifications.length}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="demande" className="d-flex align-items-center">
            <FaCalendarAlt className="me-2" />
            S'inscrire dans une structure
            {hasNewNotifications && (
              <Badge bg="danger" className="ms-auto"></Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </Card.Body>
    <style jsx>
    {`/* Variables globales - Design moderne et épuré */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: rgba(99, 102, 241, 0.1);
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --light: #f9fafb;
  --dark: #111827;
  --gray: #6b7280;
  --gray-light: #e5e7eb;
  --gray-dark: #374151;
  --white: #ffffff;
  --border-radius: 0.75rem;
  --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --box-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --transition: all 0.2s ease;
  --vh: 1vh;
}

/* Styles généraux */
body {
  font-family: 'Inter', sans-serif;
  background-color: #f3f4f6;
  color: var(--dark);
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

.patient-dashboard {
  min-height: 100vh;
  padding-bottom: 2rem;
}

/* Styles de carte - Design épuré */
.card {
  border: none;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: var(--transition);
  overflow: hidden;
  background-color: var(--white);
}

.card:hover {
  box-shadow: var(--box-shadow-lg);
}

.card-header {
  padding: 1.25rem;
  border-bottom: none;
  background-color: var(--white);
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--gray-light);
  background-color: var(--white);
}

/* Styles d'en-tête - Design moderne */
.card-header.bg-primary {
  background: var(--primary) !important;
  color: var(--white);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

/* Styles de navigation - Minimaliste */
.nav-pills .nav-link {
  color: var(--gray-dark);
  border-radius: var(--border-radius);
  padding: 0.75rem 1.25rem;
  margin-bottom: 0.5rem;
  transition: var(--transition);
  font-weight: 500;
}

.nav-pills .nav-link:hover {
  background-color: var(--primary-light);
  color: var(--primary);
}

.nav-pills .nav-link.active {
  background-color: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

/* Styles de bouton - Design moderne */
.btn {
  border-radius: var(--border-radius);
  padding: 0.625rem 1.25rem;
  transition: var(--transition);
  font-weight: 500;
  border: none;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--white);
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

.btn-success {
  background-color: var(--success);
  color: var(--white);
  box-shadow: 0 1px 2px rgba(16, 185, 129, 0.25);
}

.btn-success:hover {
  background-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
}

.btn-outline-primary {
  color: var(--primary);
  border: 1px solid var(--primary);
  background-color: transparent;
}

.btn-outline-primary:hover {
  background-color: var(--primary);
  color: var(--white);
}

.btn-link {
  text-decoration: none;
  color: var(--primary);
  padding: 0;
  font-weight: 500;
}

.btn-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Styles de badge - Design épuré */
.badge {
  font-weight: 500;
  padding: 0.35em 0.75em;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.badge.bg-primary {
  background-color: var(--primary-light) !important;
  color: var(--primary) !important;
}

.badge.bg-success {
  background-color: rgba(16, 185, 129, 0.1) !important;
  color: var(--success) !important;
}

.badge.bg-warning {
  background-color: rgba(245, 158, 11, 0.1) !important;
  color: var(--warning) !important;
}

.badge.bg-danger {
  background-color: rgba(239, 68, 68, 0.1) !important;
  color: var(--danger) !important;
}

.badge.bg-info {
  background-color: rgba(6, 182, 212, 0.1) !important;
  color: #06b6d4 !important;
}

.badge.bg-light {
  background-color: var(--light) !important;
  color: var(--gray-dark) !important;
}

/* Styles de liste - Design moderne */
.list-group-item {
  padding: 1rem 1.25rem;
  border-color: var(--gray-light);
  transition: var(--transition);
}

.list-group-item:first-child {
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.list-group-item:last-child {
  border-bottom-left-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

.list-group-item:hover {
  background-color: var(--primary-light);
}

/* Styles d'avatar - Design moderne */
.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  background-color: var(--primary);
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
}

/* Styles de formulaire - Design épuré */
.form-control {
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  border: 1px solid var(--gray-light);
  height: 48px;
  transition: var(--transition);
  font-size: 0.95rem;
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--gray-dark);
}

.form-text {
  color: var(--gray);
  font-size: 0.875rem;
  margin-top: 0.375rem;
}

.input-group-text {
  background-color: var(--light);
  border: 1px solid var(--gray-light);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
}

/* Styles pour les cartes de médecin - Design moderne */
.doctor-card {
  transition: var(--transition);
  border: 1px solid var(--gray-light);
  border-radius: var(--border-radius);
  overflow: hidden;
  background-color: var(--white);
}

.doctor-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-lg);
  border-color: var(--primary);
}

/* Styles pour les rendez-vous - Design épuré */
.appointment-item {
  transition: var(--transition);
  border: 1px solid var(--gray-light);
  border-radius: var(--border-radius);
  background-color: var(--white);
  margin-bottom: 1rem;
}

.appointment-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow);
  border-color: var(--primary);
}

/* Styles pour les alertes - Design moderne */
.alert {
  border-radius: var(--border-radius);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border: none;
}

.alert-dismissible .btn-close {
  padding: 1.25rem;
}

/* Styles pour les modales - Design épuré */
.modal-content {
  border-radius: var(--border-radius);
  border: none;
  box-shadow: var(--box-shadow-lg);
  overflow: hidden;
}

.modal-header {
  border-bottom: 1px solid var(--gray-light);
  padding: 1.25rem;
  background-color: var(--white);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  border-top: 1px solid var(--gray-light);
  padding: 1.25rem;
  background-color: var(--white);
}

/* Styles pour les notifications - Design moderne */
.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  background-color: var(--danger);
  color: var(--white);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animations - Design moderne */
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.message-badge {
  animation: pulse 2s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

/* Styles pour la messagerie - Design moderne */
.message-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 1.25rem;
  background-color: #f9fafb;
  border-radius: var(--border-radius);
}

.message {
  margin-bottom: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 1rem;
  max-width: 80%;
  position: relative;
}

.message-sent {
  background-color: var(--primary);
  color: var(--white);
  margin-left: auto;
  border-bottom-right-radius: 0;
}

.message-received {
  background-color: var(--light);
  color: var(--dark);
  border-bottom-left-radius: 0;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 0.25rem;
  opacity: 0.8;
  text-align: right;
}

.message-input {
  border-radius: 9999px;
  padding-left: 1.25rem;
  padding-right: 4rem;
  height: 50px;
}

.message-send-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary);
  color: var(--white);
}

/* Styles pour les onglets - Design moderne */
.custom-tabs {
  display: flex;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  scrollbar-width: none;
  gap: 0.5rem;
}

.custom-tabs::-webkit-scrollbar {
  display: none;
}

.custom-tab {
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius);
  color: var(--gray-dark);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  font-weight: 500;
  background-color: var(--white);
  box-shadow: var(--box-shadow);
}

.custom-tab.active {
  background-color: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

.custom-tab:hover:not(.active) {
  background-color: var(--primary-light);
  color: var(--primary);
}

/* Styles pour les boutons flottants - Design moderne */
.floating-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary);
  color: var(--white);
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.4);
  z-index: 1030;
  transition: var(--transition);
  font-size: 1.25rem;
}

.floating-button:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 6px 15px rgba(99, 102, 241, 0.5);
}

/* Styles pour les cartes d'info - Design moderne */
.info-card {
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: var(--white);
  box-shadow: var(--box-shadow);
  transition: var(--transition);
  border-left: 4px solid var(--primary);
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-lg);
}

.info-card-title {
  color: var(--gray);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-card-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 0.25rem;
}

.info-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

/* Styles pour le profil - Design moderne */
.profile-header {
  background-color: var(--white);
  color: var(--dark);
  padding: 2rem;
  margin-bottom: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(to right, var(--primary), var(--primary-dark));
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-light);
  color: var(--primary);
  font-size: 1.75rem;
  font-weight: 600;
}

/* Mode sombre - Design moderne */
@media (prefers-color-scheme: dark) {
  :root {
    --light: #1f2937;
    --dark: #f9fafb;
    --gray: #9ca3af;
    --gray-light: #374151;
    --gray-dark: #d1d5db;
    --white: #111827;
  }
  
  body {
    background-color: #0f172a;
    color: #f9fafb;
  }
  
  .card, .modal-content, .doctor-card, .appointment-item, .info-card {
    background-color: #1e293b;
    border-color: #334155;
  }
  
  .form-control, .input-group-text {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .custom-tab {
    background-color: #1e293b;
  }
  
  .message-received {
    background-color: #1f2937;
    color: #f9fafb;
  }
  
  .message-container {
    background-color: #111827;
  }
}
`}
    </style>
  </Card>
  
);



  return (
    <Container fluid className="patient-dashboard py-4">
      {/* Header - Adapté pour mobile et desktop */}

      {/* Ajoutez ce code juste après la balise d'ouverture de Container dans PatientDashboard */}
            {hasNewMessages && (
              <Alert variant="info" className="d-flex justify-content-between align-items-center mb-3 shadow-sm">
                <div className="d-flex align-items-center">
                  <FaComment className="me-2 text-primary" size={20} />
                  <span>
                    <strong>Nouveau(x) message(s) !</strong> Vous avez {unreadMessages} message(s) non lu(s) de votre médecin.
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setActiveTab("messaging")}
                  >
                    <FaComment className="me-1" /> Voir les messages
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => markMessagesAsRead()}
                  >
                    <FaCheck className="me-1" /> Marquer comme lu
                  </Button>
                </div>
              </Alert>
            )}

                      <Row className="mb-4">
                        <Col>
                          <Card className="shadow-sm border-0">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  {isMobile && (
                                    <Button
                                      variant="light"
                                      className="me-2 d-md-none"
                                      onClick={() => setShowSidebar(true)}
                                    >
                                      <FaBars />
                                    </Button>
                                  )}
                                  <div className="patient-avatar me-3">
                                    {patient?.photo ? (
                                      <img
                                        src={patient.photo}
                                        alt={`${patient.nom} ${patient.prenom}`}
                                        className="rounded-circle"
                                        style={{
                                          width: isMobile ? "40px" : "60px",
                                          height: isMobile ? "40px" : "60px",
                                          objectFit: "cover"
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className="avatar-placeholder rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                        style={{
                                          width: isMobile ? "40px" : "60px",
                                          height: isMobile ? "40px" : "60px"
                                        }}
                                      >
                                        <FaUser size={isMobile ? 20 : 30} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className={`mb-0 ${isMobile ? "fs-5" : ""}`}>
                                      {patient?.nom} {patient?.prenom}
                                    </h4>
                                    <p className="text-muted mb-0">
                                      <FaIdCard className="me-1" />
                                      Patient
                                    </p>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center">
                                  {hasNewNotifications && (
                                    <Button
                                      variant="outline-primary"
                                      className="position-relative me-2"
                                      onClick={() => setShowNotificationsModal(true)}
                                    >
                                      <FaBell />
                                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        {notifications.length}
                                      </span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline-danger"
                                    onClick={handleLogout}
                                    className="d-flex align-items-center"
                                    size={isMobile ? "sm" : ""}
                                  >
                                    <FaSignOutAlt className={isMobile ? "" : "me-2"} />
                                    {!isMobile && "Déconnexion"}
                                  </Button>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                     {/* {error && (
                        <Alert variant="danger" onClose={() => setError("")} dismissible>
                          {error}
                        </Alert>
                      )} */}

                      {/* Version mobile: Sidebar comme Offcanvas */}
                      {isMobile && (
                        <Offcanvas
                          show={showSidebar}
                          onHide={() => setShowSidebar(false)}
                          placement="start"
                        >
                          <Offcanvas.Header closeButton>
                            <Offcanvas.Title>Menu</Offcanvas.Title>
                          </Offcanvas.Header>
                          <Offcanvas.Body className="p-0">
                            <SidebarNavigation />
                          </Offcanvas.Body>
                        </Offcanvas>
                      )}

                      <Row>
                        {/* Sidebar pour desktop et tablette */}
                        {!isMobile && (
                          <Col md={3} lg={3} className="mb-4">
                            <SidebarNavigation />
                          </Col>
                        )}

                        {/* Contenu principal - s'adapte à la largeur complète sur mobile */}
                        <Col xs={12} md={9} lg={9}>
                          <Tab.Content>
                            {/* Onglet Profil */}
                            <Tab.Pane eventKey="profile" active={activeTab === "profile"}>
                              <Card className="shadow-sm border-0">
                                <Card.Header className="bg-primary text-white">
                                  <h5 className={`mb-0 ${isMobile ? "fs-6" : ""}`}>
                                    <FaUser className="me-2" />
                                    Informations personnelles
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  <Row>
                                    <Col xs={12} md={6}>
                                      <ListGroup variant="flush">
                                        <ListGroup.Item>
                                          <strong>Nom:</strong> {patient?.nom}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <strong>Prénom:</strong> {patient?.prenom}
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <strong>Âge:</strong> {patient?.age} ans
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                          <strong>Sexe:</strong>{" "}
                                          {patient?.sexe === "M" ? "Masculin" : "Féminin"}
                                        </ListGroup.Item>
                                      </ListGroup>
                                    </Col>
                                    <Col xs={12} md={6} className={isMobile ? "mt-3" : ""}>
                                      <ListGroup variant="flush">
                                        <ListGroup.Item className="d-flex align-items-center">
                                          <FaEnvelope className="me-2 text-primary" />
                                          <div className="text-break">
                                            <strong>Email:</strong>
                                            <br />
                                            {patient?.email}
                                          </div>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                          <FaPhoneAlt className="me-2 text-primary" />
                                          <div>
                                            <strong>Téléphone:</strong>
                                            <br />
                                            {patient?.telephone || "Non renseigné"}
                                          </div>
                                        </ListGroup.Item>
                                        <ListGroup.Item className="d-flex align-items-center">
                                          <FaMapMarkerAlt className="me-2 text-primary" />
                                          <div className="text-break">
                                            <strong>Adresse:</strong>
                                            <br />
                                            {patient?.adresse || "Non renseignée"}
                                          </div>
                                        </ListGroup.Item>
                                      </ListGroup>
                                    </Col>
                                  </Row>

                                  {patient?.insurance && patient.insurance.length > 0 && (
                                    <div className="mt-4">
                                      <h6>Assurances:</h6>
                                      <div className="d-flex flex-wrap gap-2">
                                        {patient.insurance.map((ins, index) => (
                                          <Badge key={index} bg="info" className="p-2">
                                            {ins}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {patient?.antecedents && patient.antecedents.length > 0 && (
                                    <div className="mt-4">
                                      <h6>Antécédents médicaux:</h6>
                                      <ListGroup>
                                        {patient.antecedents.map((ant, index) => (
                                          <ListGroup.Item key={index}>{ant}</ListGroup.Item>
                                        ))}
                                      </ListGroup>
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            </Tab.Pane>

                            {/* Onglet Structures */}
                            <Tab.Pane eventKey="structures" active={activeTab === "structures"}>
                              <Card className="shadow-sm border-0">
                                <Card.Header className="bg-primary text-white">
                                  <h5 className={`mb-0 ${isMobile ? "fs-6" : ""}`}>
                                    <FaHospital className="me-2" />
                                    Mes structures médicales
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  {structures.length > 0 ? (
                                    <Row xs={1} md={isTablet ? 1 : 2} className="g-4">
                                      {structures.map((structure) => (
                                        <Col key={structure.id}>
                                          <Card className="h-100 shadow-sm">
                                            <Card.Body>
                                              <div className="d-flex align-items-center mb-3">
                                                {structure.photoUrl ? (
                                                  <img
                                                    src={structure.photoUrl}
                                                    alt={structure.name}
                                                    className="me-3 rounded"
                                                    style={{
                                                      width: isMobile ? "40px" : "50px",
                                                      height: isMobile ? "40px" : "50px",
                                                      objectFit: "cover"
                                                    }}
                                                  />
                                                ) : (
                                                  <div
                                                    className="bg-light rounded d-flex align-items-center justify-content-center me-3"
                                                    style={{
                                                      width: isMobile ? "40px" : "50px",
                                                      height: isMobile ? "40px" : "50px"
                                                    }}
                                                  >
                                                    <FaHospital
                                                      size={isMobile ? 20 : 25}
                                                      className="text-primary"
                                                    />
                                                  </div>
                                                )}
                                                <div>
                                                  <Card.Title
                                                    className={`mb-0 ${isMobile ? "fs-6" : ""}`}
                                                  >
                                                    {structure.name}
                                                  </Card.Title>
                                                  {structure.specialties &&
                                                    structure.specialties.length > 0 && (
                                                      <small className="text-muted">
                                                        {structure.specialties
                                                          .slice(0, 2)
                                                          .join(", ")}
                                                        {structure.specialties.length > 2 &&
                                                          "..."}
                                                      </small>
                                                    )}
                                                </div>
                                              </div>

                                              <ListGroup variant="flush" className="small">
                                                <ListGroup.Item className="px-0 py-2 text-break">
                                                  <FaMapMarkerAlt className="me-2 text-primary" />
                                                  {structure.address ||
                                                    "Adresse non renseignée"}
                                                </ListGroup.Item>
                                                <ListGroup.Item className="px-0 py-2">
                                                  <FaPhoneAlt className="me-2 text-primary" />
                                                  {structure.phones?.mobile ||
                                                    structure.phones?.landline ||
                                                    "Téléphone non renseigné"}
                                                </ListGroup.Item>
                                                <ListGroup.Item className="px-0 py-2 text-break">
                                                  <FaEnvelope className="me-2 text-primary" />
                                                  {structure.email || "Email non renseigné"}
                                                </ListGroup.Item>
                                              </ListGroup>
                                            </Card.Body>

                                            <Card.Footer className="bg-white">
                                              <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-muted d-none d-md-block">
                                                  Affilié depuis:{" "}
                                                  {new Date(
                                                    patient?.dateInscription || Date.now()
                                                  ).toLocaleDateString()}
                                                </small>
                                                <Button
                                                  variant="outline-primary"
                                                  size="sm"
                                                  className="w-100 w-md-auto"
                                                  onClick={() => {
                                                    loadDoctorsForStructure(structure.id);
                                                    setActiveTab("doctors");
                                                  }}
                                                >
                                                  Voir les médecins
                                                </Button>
                                              </div>
                                            </Card.Footer>
                                          </Card>
                                        </Col>
                                      ))}
                                    </Row>
                                  ) : (
                                    <div className="text-center py-5">
                                      <FaHospital
                                        size={isMobile ? 30 : 40}
                                        className="text-muted mb-3"
                                      />
                                      <h5 className={isMobile ? "fs-6" : ""}>
                                        Aucune structure associée
                                      </h5>
                                      <p className="text-muted">
                                        Vous n'êtes actuellement affilié à aucune structure
                                        médicale.
                                      </p>
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            </Tab.Pane>

                            {/* Onglet Rendez-vous */}
                  
                            <Tab.Pane
                              eventKey="appointments"
                              active={activeTab === "appointments"}
                            >
                              <Card className="shadow-sm border-0">
                                <Card.Header className="bg-primary text-white">
                                  <h5 className={`mb-0 ${isMobile ? "fs-6" : ""}`}>
                                    <FaCalendarAlt className="me-2" />
                                    Mes rendez-vous
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  {appointments.length > 0 ? (
                                    (() => {
                                      // Créer un objet qui regroupe les rendez-vous par structureId
                                      const appointmentsByStructure = {};
                                      appointments.forEach(apt => {
                                        if (!appointmentsByStructure[apt.structureId]) {
                                          appointmentsByStructure[apt.structureId] = [];
                                        }
                                        appointmentsByStructure[apt.structureId].push(apt);
                                      });
                                      
                                      // Fonction pour basculer l'état d'expansion d'une structure
                                      const toggleStructureExpand = (structureId) => {
                                        setExpandedStructures(prev => ({
                                          ...prev,
                                          [structureId]: !prev[structureId]
                                        }));
                                      };
                                      
                                      return Object.entries(appointmentsByStructure).map(([structureId, structureAppointments]) => {
                                        // Obtenir les informations de la structure à partir du premier rendez-vous
                                        const structureInfo = structureAppointments[0].structureInfo || {};
                                        
                                        return (
                                          <Card key={structureId} className="mb-3 shadow-sm">
                                            <Card.Header 
                                              className="bg-light d-flex justify-content-between align-items-center"
                                              onClick={() => toggleStructureExpand(structureId)}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              <div>
                                                <h6 className="mb-0">
                                                  <FaHospital className="me-2 text-primary" />
                                                  {structureInfo.name || "Structure non spécifiée"}
                                                </h6>
                                                <small className="text-muted">
                                                  {structureInfo.address || "Adresse non spécifiée"}
                                                </small>
                                              </div>
                                              <Badge bg="primary" pill>
                                                {structureAppointments.length} rendez-vous
                                              </Badge>
                                            </Card.Header>
                                            
                                            <Card.Body className={expandedStructures[structureId] ? "" : "d-none"}>
                                              {structureAppointments.map((apt) => {
                                                // Trouver le médecin correspondant
                                                const doctor = assignedDoctors.find(d => d.id === apt.doctorId) || {};
                                                
                                                return (
                                                  <div
                                                    key={apt.id}
                                                    className="appointment-item p-3 mb-2 bg-white rounded border"
                                                  >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                      <div>
                                                        <h6 className="mb-2">
                                                          <FaUserMd className="me-2 text-primary" />
                                                          Dr. {doctor.nom} {doctor.prenom}
                                                          <Badge bg="info" className="ms-2">
                                                            {doctor.specialite}
                                                          </Badge>
                                                        </h6>
                                                        <p className="mb-1">
                                                          <FaCalendarAlt className="me-2 text-primary" />
                                                          <strong>Jour:</strong> {apt.day}
                                                        </p>
                                                        <p className="mb-1">
                                                          <FaClock className="me-2 text-primary" />
                                                          <strong>Heure:</strong> {apt.timeSlot}
                                                        </p>
                                                      </div>
                                                      <div className="d-flex flex-column align-items-end">
                                                        <span
                                                          className={`badge ${
                                                            apt.status === "completed"
                                                              ? "bg-success"
                                                              : "bg-warning"
                                                          } mb-2`}
                                                        >
                                                          {apt.status === "completed" ? "Terminé" : "En attente"}
                                                        </span>
                                                        
                                                        {/* Bouton pour afficher le QR code */}
                                                        <Button 
                                                          variant="outline-primary" 
                                                          size="sm"
                                                          onClick={(e) => {
                                                            e.stopPropagation(); // Empêcher la propagation au clic
                                                            handleShowQRCode(apt);
                                                          }}
                                                        >
                                                          <FaQrcode className="me-1" /> Code QR
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </Card.Body>
                                          </Card>
                                        );
                                      });
                                    })()
                                  ) : (
                                    <div className="text-center p-4">
                                      <FaCalendarAlt
                                        size={isMobile ? 30 : 40}
                                        className="text-muted mb-3"
                                      />
                                      <p>Aucun rendez-vous programmé</p>
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            </Tab.Pane>

                            {/* Nouvel onglet pour les médecins */}
                            <Tab.Pane eventKey="doctors" active={activeTab === "doctors"}>
                              <Card className="shadow-sm border-0">
                                <Card.Header className="bg-primary text-white">
                                  <h5 className={`mb-0 ${isMobile ? "fs-6" : ""}`}>
                                    <FaUserMd className="me-2" />
                                    Médecins de mes structures
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  <StructureDoctorsComponent />
                                </Card.Body>
                              </Card>
                            </Tab.Pane>

                            {/* Onglet pour la demande de rendez-vous */}
                            <Tab.Pane eventKey="rdv" active={activeTab === "rdv"}>
                              <Card className="shadow-sm border-0">
                                <Card.Header className="bg-primary text-white">
                                  <h5 className={`mb-0 ${isMobile ? "fs-6" : ""}`}>
                                    <FaCalendarAlt className="me-2" />
                                    Demande de rendez-vous
                                  </h5>
                                </Card.Header>
                                <Card.Body>
                                  {feedback.message && (
                                    <Alert
                                      variant={feedback.type}
                                      onClose={() => setFeedback({ type: "", message: "" })}
                                      dismissible
                                    >
                                      {feedback.message}
                                    </Alert>
                                  )}

                                  {!showSummary ? (
                                    <Form onSubmit={handleShowSummary}>
                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaHospital className="me-2" />
                                          Structure médicale
                                        </Form.Label>
                                        <Select
                                          options={structuresOptions}
                                          value={selectedStructure}
                                          onChange={setSelectedStructure}
                                          placeholder="Sélectionnez une structure médicale"
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={rdvLoading}
                                          isSearchable
                                        />
                                      </Form.Group>

                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaUserMd className="me-2" />
                                          Spécialité médicale
                                        </Form.Label>
                                        <Select
                                          options={specialties}
                                          value={selectedSpecialty}
                                          onChange={setSelectedSpecialty}
                                          placeholder="Sélectionnez une spécialité"
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={!selectedStructure || rdvLoading}
                                          noOptionsMessage={() =>
                                            "Aucune spécialité disponible pour cette structure"
                                          }
                                          isSearchable
                                        />
                                      </Form.Group>

                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaUserMd className="me-2" />
                                          Médecin (optionnel)
                                        </Form.Label>
                                        <Select
                                          options={
                                            selectedSpecialty
                                              ? availableDoctors.filter(
                                                  (doctor) =>
                                                    doctor.specialite ===
                                                    selectedSpecialty.value
                                                )
                                              : availableDoctors
                                          }
                                          value={selectedDoctor}
                                          onChange={setSelectedDoctor}
                                          placeholder="Sélectionnez un médecin (facultatif)"
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={!selectedSpecialty || rdvLoading}
                                          noOptionsMessage={() =>
                                            selectedSpecialty
                                              ? "Aucun médecin disponible pour cette spécialité"
                                              : "Veuillez d'abord sélectionner une spécialité"
                                          }
                                          isSearchable
                                          isClearable
                                        />
                                        <Form.Text className="text-muted">
                                          Vous pouvez laisser ce champ vide pour que la
                                          structure vous assigne un médecin disponible.
                                        </Form.Text>
                                      </Form.Group>

                                      {selectedDoctor && (
                                        <Form.Group className="mb-4">
                                          <Form.Label className="fw-bold">
                                            <FaUserMd className="me-2" />
                                            Médecin sélectionné
                                          </Form.Label>
                                          <div className="d-flex align-items-center p-3 border rounded">
                                            <div className="doctor-avatar me-3">
                                              {selectedDoctor.photoUrl ? (
                                                <img
                                                  src={selectedDoctor.photoUrl}
                                                  alt={`Dr. ${selectedDoctor.nom}`}
                                                  className="rounded-circle"
                                                  style={{
                                                    width: "50px",
                                                    height: "50px",
                                                    objectFit: "cover"
                                                  }}
                                                />
                                              ) : (
                                                <div
                                                  className="avatar-placeholder rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                                                  style={{ width: "50px", height: "50px" }}
                                                >
                                                  <FaUserMd size={25} />
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <h6 className="mb-0">
                                                Dr. {selectedDoctor.nom} {selectedDoctor.prenom}
                                              </h6>
                                              <p className="mb-0 small text-muted">
                                                {selectedDoctor.specialite}
                                              </p>
                                            </div>
                                          </div>
                                        </Form.Group>
                                      )}

                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaCalendarAlt className="me-2" />
                                          Jours préférés
                                        </Form.Label>
                                        <Select
                                          options={daysOptions}
                                          value={selectedDays}
                                          onChange={setSelectedDays}
                                          placeholder="Sélectionnez un ou plusieurs jours"
                                          isMulti
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={rdvLoading}
                                        />
                                        <Form.Text className="text-muted">
                                          Vous pouvez sélectionner plusieurs jours qui vous
                                          conviennent.
                                        </Form.Text>
                                      </Form.Group>

                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaClock className="me-2" />
                                          Horaires préférés
                                        </Form.Label>
                                        <Select
                                          options={timeSlotOptions}
                                          value={selectedTimeSlots}
                                          onChange={setSelectedTimeSlots}
                                          placeholder="Sélectionnez un ou plusieurs créneaux horaires"
                                          isMulti
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={rdvLoading}
                                        />
                                        <Form.Text className="text-muted">
                                          Vous pouvez sélectionner plusieurs créneaux horaires
                                          qui vous conviennent.
                                        </Form.Text>
                                      </Form.Group>

                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-bold">
                                          <FaCommentMedical className="me-2" />
                                          Motif de consultation
                                        </Form.Label>
                                        <Select
                                          options={motifOptions}
                                          value={motif}
                                          onChange={setMotif}
                                          placeholder="Sélectionnez un motif de consultation"
                                          className="react-select-container"
                                          classNamePrefix="react-select"
                                          isDisabled={rdvLoading}
                                        />
                                      </Form.Group>

                                      <div className="d-grid">
                                        <Button
                                          variant="primary"
                                          type="submit"
                                          size="lg"
                                          disabled={rdvLoading || !isFormComplete()}
                                        >
                                          Continuer
                                        </Button>
                                      </div>
                                    </Form>
                                  ) : (
                                    
                                      <div>
                                        <div className="border rounded p-3 mb-4 bg-light">
                                          <h5 className="mb-3">Récapitulatif de votre demande</h5>
                                          <pre
                                            className="mb-0"
                                            style={{ whiteSpace: "pre-wrap" }}
                                          >
                                            {requestSummary}
                                          </pre>
                                          
                                          {/* Badge de confirmation de paiement */}
                                          {paymentCompleted && (
                                            <div className="mt-3 text-center">
                                              <Badge bg="success" className="p-2">
                                                <FaCheck className="me-1" /> Paiement de 200 FCFA effectué
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                    
                                        <div className="d-flex justify-content-between">
  <Button
    variant="outline-secondary"
    onClick={() => setShowSummary(false)}
    disabled={rdvLoading}
  >
    Modifier
  </Button>

  <Button
  variant="success"
  onClick={handlePaymentInitiation}
  disabled={rdvLoading || paymentProcessing}
>
  {paymentProcessing || rdvLoading ? (
    <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-2"
      />
      Traitement en cours...
    </>
  ) : (
    <>
      <FaCheck className="me-2" />
      Payer et confirmer ({paymentAmount} FCFA)
    </>
  )}
</Button>
</div>
                                      </div>
                                  
                                    
                                  )}

                                  {/* Tableau des demandes de rendez-vous */}
                                  <Card className="shadow-sm mt-4">
                                    <Card.Header className="bg-light">
                                      <h6 className="mb-0">
                                        <FaCalendarAlt className="me-2" />
                                        Mes demandes de rendez-vous
                                      </h6>
                                    </Card.Header>
                                    <Card.Body>
                                      <RequestsTable patientId={patient?.id} />
                                    </Card.Body>
                                  </Card>
                                </Card.Body>
                              </Card>
                            </Tab.Pane>

                            {/* Onglet pour s'inscrire dans une structure */}
                            <Tab.Pane eventKey="demande" active={activeTab === "demande"}>
                              <Card className="shadow-sm border-0">
                                <Card.Body>
                                  <PatientDemande patientId={patient?.id} />
                                </Card.Body>
                              </Card>
                            </Tab.Pane>
                            <Tab.Pane eventKey="messaging" active={activeTab === "messaging"}>
                              <PatientMessaging patientId={patient?.id} />
                            </Tab.Pane>

                          </Tab.Content>
                        </Col>
                      </Row>

                      {/* Modal des notifications */}
                      <Modal
                        show={showNotificationsModal}
                        onHide={() => setShowNotificationsModal(false)}
                        size="lg"
                      >
                        <Modal.Header closeButton>
                          <Modal.Title>
                            <FaBell className="me-2" />
                            Notifications
                          </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          {notifications.length > 0 ? (
                            <ListGroup>
                              {notifications.map((notif) => (
                                <ListGroup.Item
                                  key={notif.id}
                                  className="d-flex justify-content-between align-items-start"
                                >
                                  <div className="ms-2 me-auto">
                                    <div className="fw-bold">{notif.title}</div>
                                    <p className="mb-1">{notif.message}</p>
                                    <small className="text-muted">
                                      {new Date(notif.createdAt).toLocaleString()}
                                    </small>
                                  </div>
                                  <Badge
                                    bg={
                                      notif.type === "appointment_accepted"
                                        ? "success"
                                        : notif.type === "appointment_rejected"
                                        ? "danger"
                                        : "warning"
                                    }
                                    pill
                                  >
                                    {notif.type === "appointment_accepted"
                                      ? "Accepté"
                                      : notif.type === "appointment_rejected"
                                      ? "Refusé"
                                      : "En attente"}
                                  </Badge>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <p className="text-center py-4 text-muted">
                              Aucune notification non lue
                            </p>
                          )}
                        </Modal.Body>
                        <Modal.Footer>
                          <Button
                            variant="primary"
                            onClick={async () => {
                              try {
                                // Marquer toutes les notifications comme lues
                                const batch = writeBatch(db);
                                notifications.forEach((notif) => {
                                  const notifRef = doc(db, "notifications", notif.id);
                                  batch.update(notifRef, { read: true });
                                });
                                await batch.commit();

                                setHasNewNotifications(false);
                                setShowNotificationsModal(false);
                              } catch (error) {
                                console.error(
                                  "Erreur lors de la mise à jour des notifications:",
                                  error
                                );
                              }
                            }}
                          >
                            Marquer comme lu
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setShowNotificationsModal(false)}
                          >
                            Fermer
                          </Button>
                        </Modal.Footer>
                      </Modal>

                      {/* Modal pour afficher le QR code */}
                      <Modal
                        show={showQRModal}
                        onHide={() => setShowQRModal(false)}
                        centered
                      >
                        <Modal.Header closeButton>
                          <Modal.Title>
                            <FaQrcode className="me-2" />
                            Code QR de votre rendez-vous
                          </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="text-center">
                          {currentAppointment && (
                            <>
                              <div className="mb-4">
                                <QRCodeCanvas 
                                  value={generateFormattedQRData(currentAppointment)}
                                  size={250}
                                  level="H"
                                  includeMargin={true}
                                  id="qrcode-canvas"
                                />
                              </div>
                              
                              
                              
                              <div className="d-grid gap-2">
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => {
                                    // Fonction pour télécharger le QR code
                                    const canvas = document.getElementById("qrcode-canvas");
                                    if (canvas) {
                                      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                                      let downloadLink = document.createElement("a");
                                      downloadLink.href = pngUrl;
                                      downloadLink.download = `rdv-qrcode-${currentAppointment.id}.png`;
                                      document.body.appendChild(downloadLink);
                                      downloadLink.click();
                                      document.body.removeChild(downloadLink);
                                    }
                                  }}
                                >
                                  <FaFile className="me-2" /> Télécharger le QR code
                                </Button>
                              </div>
                            </>
                          )}
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
                            Fermer
                          </Button>
                        </Modal.Footer>
                      </Modal>



                      {/* Modal de paiement */}
<Modal
  show={showPaymentModal}
  onHide={() => setShowPaymentModal(false)}
  backdrop="static"
  keyboard={false}
  centered
>
  <Modal.Header closeButton={!paymentLoading}>
    <Modal.Title>
      <FaMoneyBillWave className="me-2 text-success" />
      Paiement des frais de dossier
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="text-center mb-4">
      <h4 className="fw-bold">200 FCFA</h4>
      <p className="text-muted">
        Des frais de dossier de 200 FCFA sont requis pour soumettre votre demande de rendez-vous.
      </p>
    </div>

    {paymentError && (
      <Alert variant="danger" onClose={() => setPaymentError("")} dismissible>
        {paymentError}
      </Alert>
    )}

    <Form.Group className="mb-3">
      <Form.Label className="fw-bold">Méthode de paiement</Form.Label>
      <div className="d-flex flex-wrap gap-2">
        <Button
          variant={paymentMethod === "orange-money" ? "warning" : "outline-warning"}
          className="d-flex align-items-center"
          onClick={() => setPaymentMethod("orange-money")}
          disabled={paymentLoading}
        >
          <img 
            src="/images/orange-money-logo.png" 
            alt="Orange Money" 
            width="30" 
            height="30"
            className="me-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          Orange Money
        </Button>
        <Button
          variant={paymentMethod === "mtn-momo" ? "warning" : "outline-warning"}
          className="d-flex align-items-center"
          onClick={() => setPaymentMethod("mtn-momo")}
          disabled={paymentLoading}
        >
          <img 
            src="/images/mtn-momo-logo.png" 
            alt="MTN MoMo" 
            width="30" 
            height="30"
            className="me-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          MTN MoMo
        </Button>
        <Button
          variant={paymentMethod === "wave" ? "info" : "outline-info"}
          className="d-flex align-items-center"
          onClick={() => setPaymentMethod("wave")}
          disabled={paymentLoading}
        >
          <img 
            src="/images/wave-logo.png" 
            alt="Wave" 
            width="30" 
            height="30"
            className="me-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          Wave
        </Button>
      </div>
    </Form.Group>

    {paymentMethod && (
      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">Numéro de téléphone</Form.Label>
        <InputGroup>
          <InputGroup.Text>
            <FaPhoneAlt />
          </InputGroup.Text>
          <Form.Control
            type="tel"
            placeholder="Entrez votre numéro de téléphone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={paymentLoading}
          />
        </InputGroup>
        <Form.Text className="text-muted">
          Entrez le numéro associé à votre compte {
            paymentMethod === "orange-money" ? "Orange Money" : 
            paymentMethod === "mtn-momo" ? "MTN MoMo" : 
            "Wave"
          }
        </Form.Text>
      </Form.Group>
    )}

    <div className="alert alert-info mt-3">
      <div className="d-flex">
        <FaInfoCircle className="me-2 mt-1" />
        <div>
          <p className="mb-1">
            <strong>Comment ça marche :</strong>
          </p>
          <ol className="mb-0 ps-3">
            <li>Sélectionnez votre méthode de paiement préférée</li>
            <li>Entrez votre numéro de téléphone</li>
            <li>Cliquez sur "Payer maintenant"</li>
            <li>Vous recevrez un message de confirmation sur votre téléphone</li>
            <li>Validez le paiement sur votre téléphone</li>
          </ol>
        </div>
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button 
      variant="secondary" 
      onClick={() => setShowPaymentModal(false)}
      disabled={paymentLoading}
    >
      Annuler
    </Button>
    <Button 
      variant="success" 
      onClick={handlePayment}
      disabled={!paymentMethod || !phoneNumber || paymentLoading}
    >
      {paymentLoading ? (
        <>
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
          Traitement en cours...
        </>
      ) : (
        <>
          <FaMoneyBillWave className="me-2" /> Payer maintenant (200 FCFA)
        </>
      )}
    </Button>
  </Modal.Footer>
</Modal>




                      <ToastContainer position="top-right" autoClose={5000} />


    </Container>
  );
};

export default PatientDashboard;
