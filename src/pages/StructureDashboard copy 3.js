import React, { useContext, useState, useEffect, useMemo } from "react";
import { db, storage, auth } from "../components/firebase-config.js";
import {
  orderBy,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  setDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Modal,
  Form,
  ButtonGroup,
  Dropdown,
  Offcanvas,
  Tabs,
  Tab,
  Badge,
  ListGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { Calendar } from "react-calendar";

import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../contexts/AuthContext.js";

import "./StructureDashboard.css";
import CreatableSelect from "react-select/creatable";
import Select from "react-select/creatable";
import emailjs from "@emailjs/browser";

const StructuresDashboard = () => {
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // États pour la section d'annonces
  const [showAnnouncementSection, setShowAnnouncementSection] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] =
    useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    priority: "normal", // 'high', 'normal', 'low'
    targetAudience: "all", // 'all', 'affiliated', 'specialty'
    selectedSpecialties: [],
    expiryDate: "",
    attachments: [],
  });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showAnnouncementDetailsModal, setShowAnnouncementDetailsModal] =
    useState(false);
  const [showDateDetails, setShowDateDetails] = useState(false);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementStats, setAnnouncementStats] = useState({});
  const [activeTab, setActiveTab] = useState("daily");
  // États pour la gestion des rendez-vous rapides
  const [showQuickAppointmentSection, setShowQuickAppointmentSection] =
    useState(false);
  const [quickAppointments, setQuickAppointments] = useState([]);
  const [quickAppointmentFilter, setQuickAppointmentFilter] = useState("all"); // 'all', 'pending', 'confirmed', 'rejected'
  const [showQuickAppointmentDetails, setShowQuickAppointmentDetails] =
    useState(false);
  const [selectedQuickAppointment, setSelectedQuickAppointment] =
    useState(null);
  const [quickAppointmentResponse, setQuickAppointmentResponse] = useState("");
  const [quickAppointmentSearchQuery, setQuickAppointmentSearchQuery] =
    useState("");

  // Filtrer les médecins qui ont un tarif défini

  useEffect(() => {
    if (showMenuSidebar) {
      setShowProfileSidebar(false);
    }
    if (showProfileSidebar) {
      setShowMenuSidebar(false);
    }
  }, [showMenuSidebar, showProfileSidebar]);

  // Fonction pour afficher le récapitulatif
  const showRevenueSummary = (doctorId) => {
    const data = generateRevenueSummary(doctorId);
    if (data) {
      setSummaryData(data);
      setShowSummaryModal(true);
    } else {
      setMessage("Erreur lors de la génération du récapitulatif");
    }
  };

  // Fonction utilitaire pour formater les dates Firestore de manière sécurisée
  const formatFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return null;

    try {
      // Vérifier si c'est un timestamp Firestore
      if (
        firestoreDate &&
        typeof firestoreDate === "object" &&
        typeof firestoreDate.toDate === "function"
      ) {
        return firestoreDate.toDate();
      }

      // Sinon, essayer de créer une date à partir de la valeur
      return new Date(firestoreDate);
    } catch (error) {
      console.error("Erreur lors de la conversion de date:", error);
      return new Date(); // Valeur par défaut
    }
  };

  const [structure, setStructure] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [message, setMessage] = useState("");
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
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const { currentUser } = useAuth();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentRequestType, setCurrentRequestType] = useState(""); // 'patient', 'consultation', 'appointment'
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [quickAppointmentRequests, setQuickAppointmentRequests] = useState([]);

  const [showAddToStructureModal, setShowAddToStructureModal] = useState(false);
  const [showStructureSearchModal, setShowStructureSearchModal] =
    useState(false);
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [searchStructureQuery, setSearchStructureQuery] = useState("");
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [showStructureListModal, setShowStructureListModal] = useState(false);
  // Ajoutez cet état dans le composant StructuresDashboard
  const [patientRequests, setPatientRequests] = useState([]);
  const [consultationRequests, setConsultationRequests] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  // Ajoutez ces états à votre composant
  const [filteredDate, setFilteredDate] = useState(null);
  const [filteredStatus, setFilteredStatus] = useState(null);
  const [filteredDoctor, setFilteredDoctor] = useState(null);

  const [viewMode, setViewMode] = useState("calendar"); // 'doctors', 'patients', 'both'
  const [displayMode, setDisplayMode] = useState("grid"); // 'grid', 'table'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]); // Chaque élément sera un objet { date: "YYYY-MM-DD", day: "Lundi" }
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState("Lundi");

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
  const [selectedDoctorAppointments, setSelectedDoctorAppointments] =
    useState(null);
  const [showDoctorScheduleModal, setShowDoctorScheduleModal] = useState(false);
  const [selectedDoctorDetails, setSelectedDoctorDetails] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Ajoutez cette fonction pour gérer le clic sur un médecin
  const handleDoctorClick = (doctor) => {
    setSelectedDoctorDetails(doctor);
    setShowDoctorScheduleModal(true);
  };

  // Ajoutez ces états au début du composant, avec les autres états
  const [doctorAnnouncements, setDoctorAnnouncements] = useState([]);
  const [showDoctorAnnouncementsModal, setShowDoctorAnnouncementsModal] =
    useState(false);
  const [selectedDoctorAnnouncement, setSelectedDoctorAnnouncement] =
    useState(null);
  const [
    showDoctorAnnouncementDetailsModal,
    setShowDoctorAnnouncementDetailsModal,
  ] = useState(false);
  const [doctorAnnouncementFilter, setDoctorAnnouncementFilter] =
    useState("all"); // 'all', 'unread', 'read'

  // Ajoutez cette fonction pour charger les annonces des médecins
  const loadDoctorAnnouncements = async () => {
    try {
      if (!structure || !structure.id) {
        console.log(
          "Structure non définie ou sans ID, impossible de charger les annonces des médecins"
        );
        return;
      }

      // Récupérer toutes les annonces où la structure est mentionnée dans targetAudience
      // ou toutes les annonces destinées à toutes les structures
      const announcementsRef = collection(db, "announcements");
      const q = query(
        announcementsRef,
        where("createdBy", "!=", structure.id), // Exclure les annonces créées par la structure elle-même
        where("targetAudience", "in", ["all_with_structures", "structures"]), // Annonces destinées aux structures
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        responses: doc.data().responses || [],
        isFromDoctor: true, // Marquer comme venant d'un médecin
      }));

      setDoctorAnnouncements(announcementsData);

      // Charger les statistiques de lecture
      const readsRef = collection(db, "announcementReads");
      const readsQuery = query(
        readsRef,
        where("structureId", "==", structure.id)
      );
      const readsSnapshot = await getDocs(readsQuery);
      const readAnnouncementIds = readsSnapshot.docs.map(
        (doc) => doc.data().announcementId
      );

      // Marquer les annonces lues
      const updatedAnnouncements = announcementsData.map((announcement) => ({
        ...announcement,
        read: readAnnouncementIds.includes(announcement.id),
      }));

      setDoctorAnnouncements(updatedAnnouncements);

      console.log(`Chargé ${announcementsData.length} annonces de médecins`);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des annonces des médecins:",
        error
      );
      setMessage("Erreur lors du chargement des annonces des médecins");
    }
  };

  // Fonction pour marquer une annonce comme lue
  const markDoctorAnnouncementAsRead = async (announcementId) => {
    try {
      // Vérifier si l'annonce est déjà marquée comme lue
      const readQuery = query(
        collection(db, "announcementReads"),
        where("structureId", "==", structure.id),
        where("announcementId", "==", announcementId)
      );

      const readSnapshot = await getDocs(readQuery);

      if (readSnapshot.empty) {
        // Ajouter une entrée dans la collection des lectures
        await addDoc(collection(db, "announcementReads"), {
          structureId: structure.id,
          announcementId: announcementId,
          readAt: new Date().toISOString(),
        });

        // Mettre à jour l'état local
        setDoctorAnnouncements((prevAnnouncements) =>
          prevAnnouncements.map((a) =>
            a.id === announcementId ? { ...a, read: true } : a
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors du marquage de l'annonce comme lue:", error);
    }
  };

  // Fonction pour afficher les détails d'une annonce de médecin
  const viewDoctorAnnouncementDetails = async (announcement) => {
    setSelectedDoctorAnnouncement(announcement);

    // Marquer comme lue si ce n'est pas déjà fait
    if (!announcement.read) {
      await markDoctorAnnouncementAsRead(announcement.id);
    }

    setShowDoctorAnnouncementDetailsModal(true);
  };

  // Ajoutez cet useEffect pour charger les annonces des médecins au démarrage
  useEffect(() => {
    if (structure?.id) {
      loadDoctorAnnouncements();
    }
  }, [structure?.id]);

  const [insuranceOptions, setInsuranceOptions] = useState([
    { value: "CNAM", label: "CNAM" },
    { value: "CNSS", label: "CNSS" },
    { value: "CNRPS", label: "CNRPS" },
    { value: "Assurance privée", label: "Assurance privée" },
    { value: "ASKIA ASSURANCES", label: "ASKIA ASSURANCES" },
    { value: "AMSA ASSURANCES", label: "AMSA ASSURANCES" },
    {
      value: "WILLIS TOWERS WATSON CONSULTING",
      label: "WILLIS TOWERS WATSON CONSULTING",
    },
    { value: "ASCOMA SENEGAL", label: "ASCOMA SENEGAL" },
    { value: "PREVOYANCE ASSURANCES", label: "PREVOYANCE ASSURANCES" },
    { value: "WAFA ASSURANCES", label: "WAFA ASSURANCES" },
    { value: "G.G.A SENEGAL", label: "G.G.A SENEGAL" },
    { value: "OLEA SANTE", label: "OLEA SANTE" },
    { value: "AXA ASSURANCES", label: "AXA ASSURANCES" },
    { value: "NSIA ASSURANCES", label: "NSIA ASSURANCES" },
    { value: "SONAM ASSURANCES", label: "SONAM ASSURANCES" },
    { value: "SALAMA ASSURANCES", label: "SALAMA ASSURANCES" },
    { value: "TRANSVIE", label: "TRANSVIE" },
    { value: "SEN’EAU", label: "SEN’EAU" },
    { value: "BAOBAB", label: "BAOBAB" },
    { value: "BENEDICTION", label: "BENEDICTION" },
    { value: "LA POSTE", label: "LA POSTE" },
    { value: "SENELEC IPM", label: "SENELEC IPM" },
    { value: "SONATEL", label: "SONATEL" },
    { value: "ASSEMBLEE NATIONALE", label: "ASSEMBLEE NATIONALE" },
    { value: "IPM CMS", label: "IPM CMS" },
    { value: "IPM PROFESSIONS LIBERALES", label: "IPM PROFESSIONS LIBERALES" },
  ]);

  const [specialtyOptions, setSpecialtyOptions] = useState([
    { value: "Médecine-générale", label: "Médecine générale" },
    { value: "Cardiologie", label: "Cardiologie" },
    {
      value: "Réadaptation-Cardiovasculaire",
      label: "Réadaptation Cardiovasculaire",
    },
    {
      value: "Chirurgie-Cardiovasculaire",
      label: "Chirurgie Cardiovasculaire",
    },
    { value: "Pneumologie", label: "Pneumologie" },
    { value: "Gastroentérologie", label: "Gastroentérologie" },
    { value: "Endoscopie-Cigestive", label: "Endoscopie Cigestive" },
    { value: "Pédiatrie", label: "Pédiatrie" },
    { value: "Endocrinologie", label: "Endocrinologie" },
    { value: "Nutrition", label: "Nutrition" },
    { value: "Nutrithérapie", label: "Nutrithérapie" },
    { value: "Diabétologie", label: "Diabétologie" },
    { value: "Gynécologie", label: "Gynécologie" },
    { value: "Anesthésie", label: "Anesthésie" },
    { value: "Réanimation", label: "Réanimation" },
    { value: "Dermatologie", label: "Dermatologie" },
    { value: "Rhumatologie", label: "Rhumatologie" },
    { value: "Cancérologie", label: "Cancérologie" },
    { value: "Hématologie", label: "Hématologie" },
    { value: "Urologie", label: "Urologie" },
    { value: "Orthopédie", label: "Orthopédie" },
    { value: "Gériatrie", label: "Gériatrie" },
    { value: "MédecinePhysique", label: "MédecinePhysique" },
    { value: "Rééducation", label: "Rééducation" },
    { value: "Ostéopathie", label: "Ostéopathie" },
    { value: "Échographie", label: "Échographie" },
    { value: "Psychiatrie", label: "Psychiatrie" },
    { value: "Addictologie", label: "Addictologie" },
    { value: "Thérapie-capillaire", label: "Thérapie capillaire" },
    {
      value: "Thérapie-cognitivo-comportementale",
      label: "Thérapie cognitivo comportementale",
    },
    { value: "Kinésithérapie", label: "Kinésithérapie" },
    { value: "Yoga", label: "Yoga" },
  ]);

  const [associationRequests, setAssociationRequests] = useState([]);

  const auth = getAuth();

  const [showAssignedDoctorModal, setShowAssignedDoctorModal] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [assignedAppointments, setAssignedAppointments] = useState([]);

  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState({});
  const [announcementReplies, setAnnouncementReplies] = useState({});
  const [newAnnouncementReply, setNewAnnouncementReply] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [showCalendarView, setShowCalendarView] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarAppointments, setCalendarAppointments] = useState({});
  const [dailyDoctorSchedule, setDailyDoctorSchedule] = useState([]);
  const navigate = useNavigate();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [unreadAnnouncementReplies, setUnreadAnnouncementReplies] = useState(0);
  const [hasNewReplies, setHasNewReplies] = useState(false);

  // État pour la modale d'édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);

  // Fonction pour ouvrir la modale d'édition
  const handleEditAppointment = (appointment) => {
    setAppointmentToEdit({ ...appointment });
    setShowEditModal(true);
  };

  // Fonction pour enregistrer les modifications
  const handleSaveEditedAppointment = async () => {
    try {
      // Mettre à jour le rendez-vous dans Firestore
      await updateDoc(doc(db, "appointments", appointmentToEdit.id), {
        patientId: appointmentToEdit.patientId,
        date: appointmentToEdit.date,
        day: appointmentToEdit.day,
        timeSlot: appointmentToEdit.timeSlot,
        status: appointmentToEdit.status,
        ...(appointmentToEdit.status === "completed" && {
          completedAt: appointmentToEdit.completedAt,
        }),
      });

      // Mettre à jour l'état local des rendez-vous
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentToEdit.id ? appointmentToEdit : apt
        )
      );

      // Fermer la modale
      setShowEditModal(false);
      setAppointmentToEdit(null);

      // Afficher un message de confirmation
      setMessage("Rendez-vous modifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la modification du rendez-vous:", error);
      setMessage("Erreur lors de la modification du rendez-vous");
    }
  };

  // Ajoutez ces états à votre composant
  const [calendarViewMode, setCalendarViewMode] = useState("days"); // 'days' ou 'dates'
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth().toString()
  );
  const currentMonth = new Date().getMonth().toString();

  // Liste des dates disponibles (extraite des rendez-vous)
  const availableDates = [
    ...new Set(
      appointments
        .filter((apt) => apt.date) // S'assurer que la date existe
        .map((apt) => apt.date)
    ),
  ];

  // Médecins groupés par date
  const doctorsByDate = useMemo(() => {
    const result = {};

    // Pour chaque date disponible
    availableDates.forEach((date) => {
      // Trouver tous les rendez-vous pour cette date
      const dateAppointments = appointments.filter((apt) => apt.date === date);

      // Regrouper les rendez-vous par médecin
      const doctorsMap = {};
      dateAppointments.forEach((apt) => {
        if (!doctorsMap[apt.doctorId]) {
          const doctor = doctors.find((d) => d.id === apt.doctorId);
          if (doctor) {
            doctorsMap[apt.doctorId] = {
              ...doctor,
              dateAppointments: [],
            };
          }
        }

        if (doctorsMap[apt.doctorId]) {
          doctorsMap[apt.doctorId].dateAppointments.push(apt);
        }
      });

      // Convertir en tableau
      result[date] = Object.values(doctorsMap);
    });

    return result;
  }, [appointments, doctors, availableDates]);

  const [newDoctor, setNewDoctor] = useState({
    nom: "",
    prenom: "",
    specialite: "",
    telephone: "",
    email: "",
    password: "",
    disponibilite: [],
    photo: null,
    certifications: [],
    heureDebut: "",
    heureFin: "",
    joursDisponibles: [],
    visibility: "private",
    structures: [],
    maxPatientsPerDay: 1,
    consultationDuration: 5, // in minutes
    bookedSlots: {},
    insurances: [],
  });
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [patientPhotoFile, setPatientPhotoFile] = useState(null);
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
    structures: [],
    insurances: [],
    diagnostic: "", // Ajout du champ diagnostic
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    doctors: [],
    patients: [],
  });

  // Ajouter ces states au début du composant
  const [sortOrder, setSortOrder] = useState("time"); // 'time', 'patient', 'status'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [lastReorganization, setLastReorganization] = useState({});

  const updateAppointmentOrder = async (appointmentId, newOrder) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        orderNumber: newOrder,
        lastReorganized: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rendez-vous:", error);
    }
  };


  const moveAppointment = async (appointmentId, direction) => {
    try {
      // Vérifier que selectedDoctorDetails et appointments existent
      if (!selectedDoctorDetails || !selectedDoctorDetails.appointments) {
        console.error("Les détails du médecin ou les rendez-vous sont indéfinis");
        return;
      }
      
      // Trouver l'index actuel du rendez-vous
      const currentIndex = selectedDoctorDetails.appointments.findIndex(
        (apt) => apt.id === appointmentId
      );
      
      // Vérifier que l'index est valide
      if (currentIndex === -1) {
        console.error("Rendez-vous non trouvé");
        return;
      }
      
      // Déterminer le nouvel index
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      
      // Vérifier que le nouvel index est valide
      if (newIndex < 0 || newIndex >= selectedDoctorDetails.appointments.length) {
        return;
      }
      
      // Créer une copie du tableau des rendez-vous
      const updatedAppointments = [...selectedDoctorDetails.appointments];
      
      // Échanger les positions
      const temp = updatedAppointments[currentIndex];
      updatedAppointments[currentIndex] = updatedAppointments[newIndex];
      updatedAppointments[newIndex] = temp;
      
      // Mettre à jour les numéros d'ordre dans les objets
      updatedAppointments.forEach((apt, index) => {
        apt.orderNumber = index + 1;
      });
      
      // Mettre à jour l'état local immédiatement pour une UI réactive
      setSelectedDoctorDetails({
        ...selectedDoctorDetails,
        appointments: updatedAppointments,
      });
      
      // Enregistrer l'heure de la dernière réorganisation localement
      const currentTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      setLastReorganization(prev => ({
        ...prev,
        [appointmentId]: currentTime
      }));
      
      // Utiliser un batch pour mettre à jour tous les rendez-vous en une seule transaction
      const batch = writeBatch(db);
      
      updatedAppointments.forEach((apt) => {
        const appointmentRef = doc(db, "appointments", apt.id);
        batch.update(appointmentRef, { 
          orderNumber: apt.orderNumber,
          lastReorganizedAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'ordre:", error);
      setMessage("Erreur lors de la mise à jour de l'ordre des rendez-vous");
    }
  };
  
  
  

  const loadAppointments = () => {
    try {
      // Créer un écouteur en temps réel sur la collection des rendez-vous
      const unsubscribe = onSnapshot(
        collection(db, "appointments"),
        (snapshot) => {
          let appointmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Trier par orderNumber si disponible
          appointmentsData = appointmentsData.sort((a, b) => {
            if (a.orderNumber && b.orderNumber) {
              return a.orderNumber - b.orderNumber;
            }
            
            if (a.date !== b.date) {
              return new Date(a.date || 0) - new Date(b.date || 0);
            }
            
            // Vérifier que timeSlot existe avant d'appeler localeCompare
            if (a.timeSlot && b.timeSlot) {
              return a.timeSlot.localeCompare(b.timeSlot);
            } else if (a.timeSlot) {
              return -1; // a a un timeSlot mais pas b, donc a vient avant
            } else if (b.timeSlot) {
              return 1;  // b a un timeSlot mais pas a, donc b vient avant
            }
            return 0;    // aucun des deux n'a de timeSlot, considérés égaux
          });
          
          setAppointments(appointmentsData);
        },
        (error) => {
          console.error("Erreur lors de l'écoute des rendez-vous:", error);
          setMessage("Erreur lors du chargement des rendez-vous");
        }
      );
      
      // Retourner la fonction de désabonnement pour le nettoyage
      return unsubscribe;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'écouteur:", error);
      setMessage("Erreur lors de l'initialisation de l'écouteur");
      return () => {};
    }
  };
  
  




  

  const countUnreadReplies = (announcementRepliesData) => {
    let count = 0;

    Object.keys(announcementRepliesData).forEach((announcementId) => {
      const replies = announcementRepliesData[announcementId] || [];
      // Comptez les réponses qui ne sont pas de la structure et qui n'ont pas été lues
      const unreadReplies = replies.filter(
        (reply) => !reply.isFromStructure && !reply.readByStructure
      );
      count += unreadReplies.length;
    });

    return count;
  };

  // Fonction pour charger tous les rendez-vous rapides
  const loadQuickAppointments = async () => {
    try {
      const appointmentsRef = collection(db, "appointments");
      // Vous pouvez ajuster cette requête selon votre structure de données
      const q = query(
        appointmentsRef,
        where("structureEmail", "==", "pmgs@gmail.com"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const appointmentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAtDate: doc.data().createdAt
          ? typeof doc.data().createdAt.toDate === "function"
            ? doc.data().createdAt.toDate()
            : new Date(doc.data().createdAt)
          : new Date(),
      }));

      setQuickAppointments(appointmentsData);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des rendez-vous rapides:",
        error
      );
      setMessage("Erreur lors du chargement des rendez-vous rapides");
    }
  };

  // Ajoutez ceci dans votre useEffect principal ou créez un nouveau useEffect
  useEffect(() => {
    if (structure?.id) {
      loadQuickAppointments();
    }
  }, [structure?.id]);

  // Fonction pour filtrer les rendez-vous rapides
  const getFilteredQuickAppointments = () => {
    return quickAppointments.filter((appointment) => {
      // Filtrer par statut
      if (
        quickAppointmentFilter !== "all" &&
        appointment.status !== quickAppointmentFilter
      ) {
        return false;
      }

      // Filtrer par recherche
      if (quickAppointmentSearchQuery) {
        const searchTerms = quickAppointmentSearchQuery
          .toLowerCase()
          .split(" ");
        const searchableFields = [
          appointment.patientName,
          appointment.patientEmail,
          appointment.patientPhone,
          appointment.service,
          appointment.accessCode,
        ]
          .filter(Boolean)
          .map((field) => field.toLowerCase());

        return searchTerms.every((term) =>
          searchableFields.some((field) => field.includes(term))
        );
      }

      return true;
    });
  };

  // Fonction de recherche
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults({ doctors: [], patients: [] });
      return;
    }

    const searchTerms = query.toLowerCase().split(" ");

    // Recherche dans les médecins
    const filteredDoctors = doctors.filter((doctor) => {
      // Traiter les champs simples
      const basicFields = [
        doctor.nom,
        doctor.prenom,
        doctor.specialite,
        doctor.email,
        doctor.telephone,
      ]
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      // Traiter le tableau disponibilite séparément
      const disponibiliteFields = (doctor.disponibilite || [])
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      // Combiner tous les champs de recherche
      const allSearchableFields = [...basicFields, ...disponibiliteFields];

      return searchTerms.every((term) =>
        allSearchableFields.some((field) => field.includes(term))
      );
    });

    // Recherche dans les patients
    const filteredPatients = patients.filter((patient) => {
      const searchableFields = [
        patient.nom,
        patient.prenom,
        patient.email,
        patient.telephone,
        patient.age?.toString(),
        patient.sexe,
        patient.adresse,
      ]
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    });

    setSearchResults({
      doctors: filteredDoctors,
      patients: filteredPatients,
    });
  };

  // Fonction pour ouvrir la modale de notes lors du refus
  const openRejectNoteModal = (requestId, type) => {
    setCurrentRequestId(requestId);
    setCurrentRequestType(type);
    setRejectNote("");
    setShowNotesModal(true);
  };

  // Fonction pour soumettre le refus avec note
  const handleRejectWithNote = () => {
    if (currentRequestType === "patient") {
      const request = patientRequests.find(
        (req) => req.id === currentRequestId
      );
      handlePatientRequest(
        currentRequestId,
        false,
        rejectNote,
        request?.patientInfo
      );
    } else if (currentRequestType === "consultation") {
      handleConsultationRequest(currentRequestId, false, rejectNote);
    } else if (currentRequestType === "appointment") {
      handleAppointmentRequest(currentRequestId, false, rejectNote);
    }
    setShowNotesModal(false);
  };

  const viewRequestDetails = (request, type) => {
    // Formater les dates de manière sécurisée
    const formattedRequest = { ...request, type };

    if (request.requestDate) {
      formattedRequest.requestDateFormatted = formatFirestoreDate(
        request.requestDate
      );
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
          {searchResults.doctors.length > 0 ||
          searchResults.patients.length > 0 ? (
            <>
              {searchResults.doctors.length > 0 && (
                <div className="doctors-results mb-3">
                  <h6 className="text-primary mb-2">
                    <i className="fas fa-user-md me-2"></i>
                    Médecins ({searchResults.doctors.length})
                  </h6>
                  <div className="list-group">
                    {searchResults.doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="list-group-item list-group-item-action"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">
                              {doctor.nom} {doctor.prenom}
                            </h6>
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
                    {searchResults.patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="list-group-item list-group-item-action"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">
                              {patient.nom} {patient.prenom}
                            </h6>
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
        /* Ajoutez ces styles à la section style jsx */
        .reply-item {
          border-left: 4px solid transparent;
          transition: all 0.2s ease;
        }

        .reply-item:hover {
          background-color: #f8f9fa;
        }

        .bg-light-primary {
          background-color: rgba(13, 110, 253, 0.05);
        }

        .border-left-primary {
          border-left-color: #0d6efd;
        }

        .replies-list {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }

        .replies-list::-webkit-scrollbar {
          width: 6px;
        }

        .replies-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .replies-list::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
        }

        .reply-content {
          white-space: pre-line;
        }

        .search-input {
          border-radius: 20px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          border: 1px solid #dee2e6;
          transition: all 0.2s;
        }

        .search-input:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
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
        for (const selectedDay of selectedDays) {
          for (const timeSlot of selectedTimeSlots) {
            assignments.push({
              doctorId: selectedDoctor.id,
              patientId,
              timeSlot,
              day: selectedDay.day, // Le jour de la semaine (ex: "Lundi")
              date: selectedDay.date, // La date complète (ex: "2025-03-24")
              status: "scheduled",
              structureId: structure.id,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      await Promise.all(
        assignments.map((assignment) =>
          addDoc(collection(db, "appointments"), assignment)
        )
      );

      await Promise.all(
        selectedPatientIds.map((patientId) =>
          updateDoc(doc(db, "patients", patientId), {
            medecinId: selectedDoctor.id,
            structureId: structure.id,
            lastUpdated: new Date().toISOString(),
          })
        )
      );

      setMessage("Assignations effectuées avec succès");
      setShowAssignPatientsModal(false);

      setSelectedPatientIds([]);
      setSelectedDays([]);
      setSelectedTimeSlots([]);
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors des assignations");
    }
  };

  useEffect(() => {
    const structureData = JSON.parse(localStorage.getItem("structureData"));
    if (!structureData) {
      navigate("/");
      return;
    }
  
    // Tableau pour stocker toutes les fonctions de désabonnement
    const unsubscribes = [];
  
    // Écouteur pour la structure
    const structureUnsubscribe = onSnapshot(
      doc(db, "structures", structureData.id),
      (doc) => {
        setStructure({ id: doc.id, ...doc.data() });
      }
    );
    unsubscribes.push(structureUnsubscribe);
  
    // Écouteur pour les médecins
    const doctorsUnsubscribe = onSnapshot(
      query(
        collection(db, "medecins"),
        where("structures", "array-contains", structureData.id)
      ),
      (snapshot) => {
        const doctorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorsData);
      }
    );
    unsubscribes.push(doctorsUnsubscribe);
  
    // Écouteur pour les patients
    const patientsUnsubscribe = onSnapshot(
      query(
        collection(db, "patients"),
        where("structures", "array-contains", structureData.id)
      ),
      (snapshot) => {
        const patientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientsData);
      }
    );
    unsubscribes.push(patientsUnsubscribe);
  
    // Écouteur pour tous les rendez-vous
    const appointmentsUnsubscribe = loadAppointments();
    unsubscribes.push(appointmentsUnsubscribe);
  
    // Si un médecin est sélectionné, écoutez ses rendez-vous spécifiques
    if (selectedDoctor) {
      const doctorAppointmentsUnsubscribe = fetchDoctorAppointments(selectedDoctor.id);
      unsubscribes.push(doctorAppointmentsUnsubscribe);
    }
  
    // Nettoyage : désabonnez-vous de tous les écouteurs lors du démontage
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [navigate, selectedDoctor]);
  
  // Fonction pour traiter une demande de rendez-vous rapide
  const handleQuickAppointmentResponse = async (appointmentId, accepted) => {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);

      if (accepted) {
        // Accepter la demande
        await updateDoc(appointmentRef, {
          status: "confirmed",
          response:
            quickAppointmentResponse ||
            "Votre demande de rendez-vous a été acceptée.",
          respondedAt: serverTimestamp(),
          isRead: true,
        });

        setMessage("Demande de rendez-vous acceptée");
      } else {
        // Refuser la demande
        await updateDoc(appointmentRef, {
          status: "rejected",
          response:
            quickAppointmentResponse ||
            "Votre demande de rendez-vous a été refusée.",
          respondedAt: serverTimestamp(),
          isRead: true,
        });

        setMessage("Demande de rendez-vous refusée");
      }

      // Fermer la modale et réinitialiser les états
      setShowQuickAppointmentDetails(false);
      setSelectedQuickAppointment(null);
      setQuickAppointmentResponse("");
    } catch (error) {
      console.error("Erreur lors du traitement de la demande:", error);
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  // D'abord, ajoutez cette fonction utilitaire
  const cleanForFirestore = (obj) => {
    // Si null ou undefined, retourner null (valeur acceptée par Firestore)
    if (obj == null) return null;

    // Si c'est un tableau, nettoyer chaque élément
    if (Array.isArray(obj)) {
      return obj.map((item) => cleanForFirestore(item));
    }

    // Si ce n'est pas un objet, le retourner tel quel
    if (typeof obj !== "object") return obj;

    const clean = {};

    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        // Si c'est un objet imbriqué, le nettoyer récursivement
        if (typeof obj[key] === "object" && obj[key] !== null) {
          clean[key] = cleanForFirestore(obj[key]);
        } else {
          clean[key] = obj[key];
        }
      }
    });

    return clean;
  };

  const handlePatientRequest = async (
    requestId,
    patientInfo,
    accepted,
    notes = ""
  ) => {
    try {
      const requestRef = doc(db, "structureRequests", requestId);

      if (accepted) {
        // Vérifier si le patient existe déjà dans la collection patients
        const patientQuery = query(
          collection(db, "patients"),
          where("email", "==", patientInfo.email)
        );
        const patientSnapshot = await getDocs(patientQuery);

        let patientRef;
        let patientDocId;

        if (!patientSnapshot.empty) {
          // Le patient existe déjà, mettre à jour ses structures
          patientDocId = patientSnapshot.docs[0].id;
          patientRef = doc(db, "patients", patientDocId);
          await updateDoc(patientRef, {
            structures: arrayUnion(structure.id),
          });
        } else {
          // Créer un nouveau patient
          let patientData = cleanForFirestore({
            ...patientInfo,
            structures: [structure.id],
            visibility: "affiliated",
            createdAt: new Date().toISOString(),
            status: "active",
          });

          const newPatientRef = await addDoc(
            collection(db, "patients"),
            patientData
          );
          patientDocId = newPatientRef.id;
          patientRef = newPatientRef;
        }

        // Mettre à jour la demande avec commentaire
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "accepted",
            acceptedDate: new Date().toISOString(),
            patientDocId: patientDocId,
            notes: notes,
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Ajouter le patient au tableau local si c'est un nouveau patient
        if (!patientSnapshot.empty) {
          const updatedPatient = await getDoc(patientRef);
          const patientData = {
            id: updatedPatient.id,
            ...updatedPatient.data(),
          };
          setPatients((prevPatients) => {
            const existingIndex = prevPatients.findIndex(
              (p) => p.id === patientDocId
            );
            if (existingIndex >= 0) {
              const updatedPatients = [...prevPatients];
              updatedPatients[existingIndex] = patientData;
              return updatedPatients;
            } else {
              return [...prevPatients, patientData];
            }
          });
        } else {
          const newPatient = { id: patientDocId, ...patientData };
          setPatients((prevPatients) => [...prevPatients, newPatient]);
        }

        // Créer une notification pour le patient
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: patientInfo.id,
            type: "request_accepted",
            title: "Demande acceptée",
            message: `Votre demande d'affiliation à ${structure.name} a été acceptée.`,
            structureId: structure.id,
            structureName: structure.name,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Patient ajouté avec succès");
      } else {
        // Refuser la demande avec commentaire
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "rejected",
            rejectionDate: new Date().toISOString(),
            notes: notes,
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Créer une notification pour le patient
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: patientInfo.id,
            type: "request_rejected",
            title: "Demande refusée",
            message: `Votre demande d'affiliation à ${structure.name} a été refusée.`,
            structureId: structure.id,
            structureName: structure.name,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Demande refusée");
      }

      // Retirer la demande de la liste
      setPatientRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Erreur lors du traitement de la demande:", error);
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  const confirmExcludeDoctorWithDataDeletion = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    const doctorName = doctor ? `${doctor.nom} ${doctor.prenom}` : "ce médecin";

    // Créer une modale de confirmation personnalisée
    const confirmModal = document.createElement("div");
    confirmModal.className = "custom-confirm-modal";
    confirmModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header bg-danger text-white">
        <h5>Confirmation de suppression</h5>
        <button type="button" class="btn-close" data-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p>Vous êtes sur le point de retirer <strong>${doctorName}</strong> du tableau de gestion des revenus.</p>
        <p class="text-danger"><strong>Attention :</strong> Cette action supprimera définitivement :</p>
        <ul>
          <li>Toutes les données financières associées à ce médecin</li>
          <li>L'historique des revenus générés</li>
          <li>Les statistiques de consultations terminées</li>
          <li>Les récapitulatifs associés</li>
        </ul>
        <p>Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-action="cancel">Annuler</button>
        <button type="button" class="btn btn-danger" data-action="confirm">
          <i class="fas fa-trash me-2"></i>Supprimer définitivement
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(confirmModal);

    // Gérer les actions
    confirmModal
      .querySelector('[data-action="cancel"]')
      .addEventListener("click", () => {
        document.body.removeChild(confirmModal);
      });

    confirmModal
      .querySelector('[data-action="confirm"]')
      .addEventListener("click", () => {
        document.body.removeChild(confirmModal);
        excludeDoctorFromRevenueTable(doctorId);
      });

    confirmModal.querySelector(".btn-close").addEventListener("click", () => {
      document.body.removeChild(confirmModal);
    });

    // Styles pour la modale
    const style = document.createElement("style");
    style.textContent = `
    .custom-confirm-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    .custom-confirm-modal .modal-content {
      width: 500px;
      max-width: 90%;
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    }
    .custom-confirm-modal .modal-header,
    .custom-confirm-modal .modal-body,
    .custom-confirm-modal .modal-footer {
      padding: 1rem;
    }
    .custom-confirm-modal .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .custom-confirm-modal .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: white;
    }
  `;
    document.head.appendChild(style);
  };

  // Fonction pour nettoyer les récapitulatifs existants
  const cleanupSummaryData = async (doctorId) => {
    try {
      // Chercher tous les documents de récapitulatifs qui pourraient contenir des données du médecin
      const summariesQuery = query(
        collection(db, "revenueSummaries"),
        where("doctorIds", "array-contains", doctorId)
      );

      const summariesSnapshot = await getDocs(summariesQuery);

      if (!summariesSnapshot.empty) {
        const batch = writeBatch(db);

        summariesSnapshot.docs.forEach((doc) => {
          const summaryData = doc.data();

          // Si le récapitulatif ne concerne que ce médecin, le supprimer
          if (summaryData.doctorIds.length === 1) {
            batch.delete(doc.ref);
          }
          // Sinon, mettre à jour le récapitulatif pour retirer les données du médecin
          else {
            // Filtrer les données du médecin
            const updatedDoctorIds = summaryData.doctorIds.filter(
              (id) => id !== doctorId
            );

            // Retirer les données du médecin des statistiques
            if (summaryData.doctorStats && summaryData.doctorStats[doctorId]) {
              delete summaryData.doctorStats[doctorId];
            }

            // Recalculer les totaux si nécessaire
            if (
              summaryData.totalRevenue &&
              summaryData.doctorRevenues &&
              summaryData.doctorRevenues[doctorId]
            ) {
              summaryData.totalRevenue -= summaryData.doctorRevenues[doctorId];
              delete summaryData.doctorRevenues[doctorId];
            }

            batch.update(doc.ref, {
              doctorIds: updatedDoctorIds,
              doctorStats: summaryData.doctorStats,
              totalRevenue: summaryData.totalRevenue || 0,
              doctorRevenues: summaryData.doctorRevenues,
            });
          }
        });

        await batch.commit();
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage des récapitulatifs:", error);
    }
  };

  // Fonction pour gérer les demandes de consultation
  const handleConsultationRequest = async (requestId, accepted, notes = "") => {
    try {
      const requestRef = doc(db, "consultationRequests", requestId);
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
          status: "scheduled",
          createdAt: new Date().toISOString(),
          notes: notes,
        });

        // Ajouter à la collection consultations
        const consultationRef = await addDoc(
          collection(db, "consultations"),
          consultationData
        );

        // Mettre à jour la demande
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "accepted",
            acceptedDate: new Date().toISOString(),
            consultationId: consultationRef.id,
            notes: notes,
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Créer une notification
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: requestData.patientId,
            type: "consultation_accepted",
            title: "Demande de consultation acceptée",
            message: `Votre demande de consultation à ${structure.name} a été acceptée.`,
            structureId: structure.id,
            structureName: structure.name,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Consultation programmée avec succès");
      } else {
        // Refuser la demande
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "rejected",
            rejectionDate: new Date().toISOString(),
            notes: notes,
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Créer une notification
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: requestData.patientId,
            type: "consultation_rejected",
            title: "Demande de consultation refusée",
            message: `Votre demande de consultation à ${structure.name} a été refusée.`,
            structureId: structure.id,
            structureName: structure.name,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Demande de consultation refusée");
      }

      // Retirer la demande de la liste
      setConsultationRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );
    } catch (error) {
      console.error(
        "Erreur lors du traitement de la demande de consultation:",
        error
      );
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  // Fonction pour gérer les demandes de rendez-vous
  const handleAppointmentRequest = async (requestId, accepted, notes = "") => {
    try {
      const requestRef = doc(db, "appointmentRequests", requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();

      if (accepted) {
        // Extraire les informations du texte récapitulatif
        const requestText = requestData.requestText || "";

        // Créer un rendez-vous
        const appointmentData = cleanForFirestore({
          patientId: requestData.patientId,
          patientName: `${requestData.patientInfo?.nom || ""} ${
            requestData.patientInfo?.prenom || ""
          }`,
          doctorId: requestData.doctorId,
          structureId: structure.id,
          structureName: structure.name,
          specialty: requestData.specialty,
          requestText: requestText,
          status: "scheduled",
          createdAt: new Date().toISOString(),
          notes: typeof notes === "string" ? notes : "",
          orderNumber:
            typeof notes === "object" && notes.orderNumber
              ? notes.orderNumber
              : 0,
        });

        // Ajouter à la collection appointments
        const appointmentRef = await addDoc(
          collection(db, "appointments"),
          appointmentData
        );

        // Mettre à jour la demande
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "accepted",
            acceptedDate: new Date().toISOString(),
            appointmentId: appointmentRef.id,
            notes: typeof notes === "string" ? notes : "",
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Créer une notification pour le patient
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: requestData.patientId,
            type: "appointment_accepted",
            title: "Demande de rendez-vous acceptée",
            message: `Votre demande de rendez-vous à ${structure.name} a été acceptée.`,
            structureId: structure.id,
            structureName: structure.name,
            appointmentId: appointmentRef.id,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Rendez-vous programmé avec succès");
      } else {
        // Refuser la demande
        await updateDoc(
          requestRef,
          cleanForFirestore({
            status: "rejected",
            rejectionDate: new Date().toISOString(),
            notes: typeof notes === "string" ? notes : "",
            respondedBy: {
              userId: currentUser?.uid,
              name: currentUser?.displayName || "Administrateur",
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Créer une notification pour le patient
        await addDoc(
          collection(db, "notifications"),
          cleanForFirestore({
            userId: requestData.patientId,
            type: "appointment_rejected",
            title: "Demande de rendez-vous refusée",
            message: `Votre demande de rendez-vous à ${
              structure.name
            } a été refusée.${notes ? " Motif: " + notes : ""}`,
            structureId: structure.id,
            structureName: structure.name,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );

        setMessage("Demande de rendez-vous refusée");
      }

      // Retirer la demande de la liste
      setAppointmentRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );
    } catch (error) {
      console.error(
        "Erreur lors du traitement de la demande de rendez-vous:",
        error
      );
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  // Fonction pour retirer un médecin et supprimer toutes ses données de gestion des revenus
  const excludeDoctorFromRevenueTable = async (doctorId) => {
    try {
      if (
        window.confirm(
          "Êtes-vous sûr de vouloir retirer ce médecin et supprimer toutes ses données de gestion des revenus ? Cette action est irréversible."
        )
      ) {
        // 1. Supprimer l'entrée dans doctorFees
        await deleteDoc(doc(db, "doctorFees", doctorId));

        // 2. Supprimer toutes les entrées de revenus liées à ce médecin
        const revenuesQuery = query(
          collection(db, "revenues"),
          where("doctorId", "==", doctorId)
        );
        const revenuesSnapshot = await getDocs(revenuesQuery);

        // Utiliser un batch pour supprimer efficacement plusieurs documents
        const batch = writeBatch(db);
        revenuesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // 3. Supprimer également les entrées dans revenueHistory
        const historyQuery = query(
          collection(db, "revenueHistory"),
          where("doctorId", "==", doctorId)
        );
        const historySnapshot = await getDocs(historyQuery);

        const historyBatch = writeBatch(db);
        historySnapshot.docs.forEach((doc) => {
          historyBatch.delete(doc.ref);
        });
        await historyBatch.commit();

        // 4. Nettoyer les données du localStorage
        // Récupérer les données actuelles
        const storedData = localStorage.getItem("revenueData");
        if (storedData) {
          const revenueData = JSON.parse(storedData);
          // Supprimer les données du médecin
          if (revenueData[doctorId]) {
            delete revenueData[doctorId];
            // Sauvegarder les données mises à jour
            localStorage.setItem("revenueData", JSON.stringify(revenueData));
          }
        }
        // Ajouter cet appel dans la fonction excludeDoctorFromRevenueTable
        await cleanupSummaryData(doctorId);

        // 5. Mettre à jour l'état local
        setDoctorFees((prev) => {
          const updated = { ...prev };
          delete updated[doctorId];
          return updated;
        });

        // 6. Supprimer les entrées dans completedAppointments
        setCompletedAppointments((prev) =>
          prev.filter((apt) => apt.doctorId !== doctorId)
        );

        setMessage(
          "Médecin retiré du tableau de gestion des revenus et toutes ses données ont été supprimées"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setMessage("Erreur lors du retrait du médecin");
    }
  };

  // Fonctions pour gérer les demandes
  const handleAssociationResponse = async (requestId, doctorId, accepted) => {
    try {
      if (accepted) {
        // Mise à jour du statut de la demande
        await updateDoc(doc(db, "associationRequests", requestId), {
          status: "accepted",
          acceptedDate: new Date().toISOString(),
        });

        // Ajout de la structure dans le tableau des structures du médecin
        const doctorRef = doc(db, "medecins", doctorId);
        await updateDoc(doctorRef, {
          structures: arrayUnion(structure.id),
          visibility: "affiliated", // Marquer le médecin comme affilié
        });

        // Récupérer les données du médecin
        const doctorDoc = await getDoc(doctorRef);
        const doctorData = { id: doctorDoc.id, ...doctorDoc.data() };

        // Ajouter le médecin au tableau local
        setDoctors((prevDoctors) => [...prevDoctors, doctorData]);

        setMessage("Médecin associé avec succès");
      } else {
        await updateDoc(doc(db, "associationRequests", requestId), {
          status: "rejected",
          rejectionDate: new Date().toISOString(),
        });

        setMessage("Demande refusée");
      }
    } catch (error) {
      console.error("Erreur association:", error);
      setMessage("Erreur lors du traitement de la demande");
    }
  };

  const sendConfirmationEmail = async (changes) => {
    try {
      const confirmationToken = Math.random().toString(36).substr(2);

      // Store pending changes with token
      await setDoc(doc(db, "pendingChanges", structure.id), {
        changes,
        token: confirmationToken,
        timestamp: new Date().toISOString(),
      });

      // Send confirmation email using Firebase Functions
      const sendMail = httpsCallable(functions, "sendConfirmationEmail");
      await sendMail({
        email: structure.email,
        token: confirmationToken,
        changes: changes,
      });

      setMessage("Email de confirmation envoyé");
      setPendingChanges(changes);
    } catch (error) {
      setMessage("Erreur lors de l'envoi de l'email");
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
      horaires: editedStructure.horaires,
    };

    await sendConfirmationEmail(changes);
    setShowEditForm(false);
  };

  const fetchStructureData = async (structureId) => {
    try {
      const structureDoc = await getDoc(doc(db, "structures", structureId));
      const structureData = { id: structureDoc.id, ...structureDoc.data() };
      setStructure(structureData);

      // Fetch affiliated doctors
      const doctorsPromises = (structureData.affiliatedDoctors || []).map(
        (id) => getDoc(doc(db, "medecins", id))
      );
      const doctorsData = await Promise.all(doctorsPromises);
      const affiliatedDoctors = doctorsData.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch private doctors
      const privateQuery = query(
        collection(db, "medecins"),
        where("structures", "array-contains", structureId),
        where("visibility", "==", "private")
      );
      const privateDoctorsSnapshot = await getDocs(privateQuery);
      const privateDoctors = privateDoctorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine both types of doctors
      setDoctors([...affiliatedDoctors, ...privateDoctors]);

      // First fetch affiliated patients
      const patientsPromises = (structureData.affiliatedPatients || []).map(
        (id) => getDoc(doc(db, "patients", id))
      );
      const patientsData = await Promise.all(patientsPromises);
      const affiliatedPatients = patientsData.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Then fetch private patients
      const privatePatientQuery = query(
        collection(db, "patients"),
        where("structures", "array-contains", structureId),
        where("visibility", "==", "private")
      );
      const privatePatientSnapshot = await getDocs(privatePatientQuery);
      const privatePatients = privatePatientSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine both types of patients
      setPatients([...affiliatedPatients, ...privatePatients]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Erreur lors du chargement des données");
    }
  };

  const fetchDoctorAppointments = (doctorId) => {
    setIsLoadingAppointments(true);
    
    try {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId),
          orderBy("orderNumber", "asc")
        ),
        (snapshot) => {
          const appointmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            orderNumber: doc.data().orderNumber || 0
          }));
          
          setAppointments(appointmentsData);
          
          if (selectedDoctorDetails && selectedDoctorDetails.id === doctorId) {
            setSelectedDoctorDetails({
              ...selectedDoctorDetails,
              appointments: appointmentsData
            });
          }
          
          setIsLoadingAppointments(false);
        },
        (error) => {
          console.error("Erreur lors de l'écoute des rendez-vous:", error);
          setIsLoadingAppointments(false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de l'écouteur:", error);
      setIsLoadingAppointments(false);
      return () => {};
    }
  };
   
  

  const handleAddDoctor = async () => {
    try {
      // Validate required fields
      if (
        !newDoctor.email ||
        !newDoctor.password ||
        !newDoctor.nom ||
        !newDoctor.prenom
      ) {
        setMessage("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newDoctor.email,
        newDoctor.password
      );

      // Add doctor role
      await setDoc(doc(db, "userRoles", userCredential.user.uid), {
        role: "doctor",
        structureId: structure.id,
      });

      let photoUrl = "";
      let certUrls = [];

      if (photoFile) {
        const photoRef = ref(
          storage,
          `doctors/${structure.id}/${photoFile.name}`
        );
        await uploadBytes(photoRef, photoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      for (const certFile of certFiles) {
        const certRef = ref(
          storage,
          `certifications/${structure.id}/${certFile.name}`
        );
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
        status: "active",
        insurances: newDoctor.insurances || [],
      };

      const docRef = await addDoc(collection(db, "medecins"), doctorData);
      const newDoctorWithId = { id: docRef.id, ...doctorData };

      setDoctors([...doctors, newDoctorWithId]);
      setShowAddDoctorModal(false);
      setMessage("Médecin ajouté avec succès");

      // Reset form
      setNewDoctor({
        nom: "",
        prenom: "",
        specialite: "",
        telephone: "",
        email: "",
        password: "",
        disponibilite: [],
        photo: null,
        certifications: [],
        heureDebut: "",
        heureFin: "",
        joursDisponibles: [],
        visibility: "private",
        structures: [],
        maxPatientsPerDay: 1,
        consultationDuration: 5,
        bookedSlots: {},
      });

      if (structure?.whatsappSettings?.enableDoctors && newDoctor.telephone) {
        const messageData = {
          nom: newDoctor.nom,
          prenom: newDoctor.prenom,
          specialite: newDoctor.specialite,
          email: newDoctor.email
        };
        
        const message = generateTemplateMessage(
          structure.whatsappSettings.doctorTemplate || 
          "Bonjour Dr. {nom} {prenom}, bienvenue à {structureName}! Votre compte a été créé avec succès.",
          messageData
        );
        
        // Afficher une option pour envoyer le message WhatsApp
        const shouldSend = window.confirm(`Voulez-vous envoyer un message WhatsApp de bienvenue au Dr. ${newDoctor.nom} ${newDoctor.prenom}?`);
        
        if (shouldSend) {
          sendWhatsAppMessage(newDoctor.telephone, message);
        }
      }


      setPhotoFile(null);
      setCertFiles([]);
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

  // Ajoutez cette fonction de recherche spécifique aux médecins privés
  const [privateDoctorSearchQuery, setPrivateDoctorSearchQuery] = useState("");
  const [filteredPrivateDoctors, setFilteredPrivateDoctors] = useState([]);

  const handlePrivateDoctorSearch = (query) => {
    setPrivateDoctorSearchQuery(query);

    if (!query.trim()) {
      setFilteredPrivateDoctors([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(" ");

    // Filtrer uniquement les médecins privés
    const privateDoctors = doctors.filter(
      (doctor) => doctor.visibility === "private"
    );

    const filtered = privateDoctors.filter((doctor) => {
      // Traiter les champs simples
      const basicFields = [
        doctor.nom,
        doctor.prenom,
        doctor.specialite,
        doctor.email,
        doctor.telephone,
      ]
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      // Traiter le tableau disponibilite séparément
      const disponibiliteFields = (doctor.disponibilite || [])
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      // Combiner tous les champs de recherche
      const allSearchableFields = [...basicFields, ...disponibiliteFields];

      return searchTerms.every((term) =>
        allSearchableFields.some((field) => field.includes(term))
      );
    });

    setFilteredPrivateDoctors(filtered);
  };

  // Ajoutez ce composant de barre de recherche pour les médecins privés
  const privateDoctorSearchBar = (
    <div className="search-container mb-3 p-3 bg-white rounded-3 shadow-sm">
      <Form.Group>
        <Form.Control
          type="text"
          placeholder="Rechercher parmi les médecins privés... (nom, spécialité, email, téléphone, etc.)"
          value={privateDoctorSearchQuery}
          onChange={(e) => handlePrivateDoctorSearch(e.target.value)}
          className="search-input"
        />
      </Form.Group>

      {privateDoctorSearchQuery && (
        <div className="search-results mt-3">
          {filteredPrivateDoctors.length > 0 ? (
            <div className="doctors-results">
              <h6 className="text-primary mb-2">
                <i className="fas fa-user-md me-2"></i>
                Médecins privés ({filteredPrivateDoctors.length})
              </h6>
              <div className="list-group">
                {filteredPrivateDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="list-group-item list-group-item-action"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">
                          Dr. {doctor.nom} {doctor.prenom}
                        </h6>
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
          ) : (
            <p className="text-muted text-center my-3">
              <i className="fas fa-search me-2"></i>
              Aucun médecin privé trouvé
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
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
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

  const handleAddPatient = async () => {
    try {
      // Validate required fields
      if (
        !newPatient.email ||
        !newPatient.password ||
        !newPatient.nom ||
        !newPatient.prenom
      ) {
        setMessage("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newPatient.email,
        newPatient.password
      );

      // Add patient role
      await setDoc(doc(db, "userRoles", userCredential.user.uid), {
        role: "patient",
        structureId: structure.id,
      });

      let photoUrl = "";
      if (patientPhotoFile) {
        const photoRef = ref(
          storage,
          `patients/${structure.id}/${patientPhotoFile.name}`
        );
        await uploadBytes(photoRef, patientPhotoFile);
        photoUrl = await getDownloadURL(photoRef);
      }

      const docUrls = await Promise.all(
        medicalDocs.map(async (file) => {
          const docRef = ref(
            storage,
            `patients/${structure.id}/${userCredential.user.uid}/documents/${file.name}`
          );
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
        status: "active",
        antecedents: [],
        allergies: [],
        traitements: [],
        lastVisit: null,
        nextAppointment: null,
        insurances: newPatient.insurances || [],
        diagnostic: newPatient.diagnostic || "", // Ajout du diagnostic
      };

      const docRef = await addDoc(collection(db, "patients"), patientData);
      const newPatientWithId = { id: docRef.id, ...patientData };

      setPatients([...patients, newPatientWithId]);
      setShowAddPatientModal(false);
      setMessage("Patient ajouté avec succès");

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
        documents: null,
        visibility: "private",
        structures: [],
      });

      // Dans handleAddPatient, après avoir ajouté avec succès le patient:
      if (structure?.whatsappSettings?.enablePatients && newPatient.telephone) {
        const messageData = {
          nom: newPatient.nom,
          prenom: newPatient.prenom,
          age: newPatient.age,
          email: newPatient.email
        };
        
        const message = generateTemplateMessage(
          structure.whatsappSettings.patientTemplate || 
          "Bonjour {nom} {prenom}, bienvenue à {structureName}! Votre compte patient a été créé avec succès.",
          messageData
        );
        
        // Afficher une option pour envoyer le message WhatsApp
        const shouldSend = window.confirm(`Voulez-vous envoyer un message WhatsApp de bienvenue à ${newPatient.nom} ${newPatient.prenom}?`);
        
        if (shouldSend) {
          sendWhatsAppMessage(newPatient.telephone, message);
        }
      }


      setPatientPhotoFile(null);
      setMedicalDocs([]);
      setPreviewDocs([]);
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

  const handleDeleteDoctor = async (doctorId) => {
    try {
      await deleteDoc(doc(db, "medecins", doctorId));
      setDoctors(doctors.filter((d) => d.id !== doctorId));
      setMessage("Médecin supprimé avec succès");
    } catch (error) {
      setMessage("Erreur lors de la suppression");
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      await deleteDoc(doc(db, "patients", patientId));
      setPatients(patients.filter((p) => p.id !== patientId));
      setMessage("Patient supprimé avec succès");
    } catch (error) {
      setMessage("Erreur lors de la suppression");
    }
  };

  const handleUnaffiliation = async (type, id) => {
    try {
      if (type === "doctor") {
        // Mise à jour du médecin
        const doctorRef = doc(db, "medecins", id);
        await updateDoc(doctorRef, {
          structures: arrayRemove(structure.id),
        });

        // Mise à jour des patients
        const patientsQuery = query(
          collection(db, "patients"),
          where("medecinId", "==", id),
          where("structureId", "==", structure.id)
        );

        const patientsSnapshot = await getDocs(patientsQuery);
        const batch = writeBatch(db);

        patientsSnapshot.docs.forEach((patientDoc) => {
          batch.update(patientDoc.ref, {
            medecinId: null,
            structureId: null,
          });
        });

        await batch.commit();

        // Mise à jour immédiate de l'interface
        setDoctors(doctors.filter((doc) => doc.id !== id));
        setPatients(patients.filter((pat) => pat.medecinId !== id));

        setMessage("Médecin désaffilié avec succès");
      } else {
        // Mise à jour du patient
        const patientRef = doc(db, "patients", id);
        await updateDoc(patientRef, {
          structures: arrayRemove(structure.id),
          structureId: null,
          medecinId: null,
        });

        setPatients(patients.filter((pat) => pat.id !== id));
        setMessage("Patient retiré avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur lors de la modification");
    }
  };

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

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const completedAt = new Date().toISOString();

      // Récupérer les détails du rendez-vous
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      const appointmentData = appointmentSnap.exists()
        ? appointmentSnap.data()
        : null;

      if (!appointmentData) {
        console.error("Rendez-vous non trouvé");
        return;
      }

      // Mettre à jour le statut du rendez-vous
      await updateDoc(appointmentRef, {
        status: "completed",
        completedAt: completedAt,
      });

      // Créer une entrée de revenu
      const doctorId = appointmentData.doctorId;
      const fee = doctorFees[doctorId] || 0;

      const revenueData = {
        doctorId: doctorId,
        patientId: appointmentData.patientId,
        appointmentId: appointmentId,
        structureId: structure.id,
        amount: fee,
        date: completedAt,
        day: appointmentData.day || "",
        isDeleted: false,
      };

      // Ajouter à la collection revenues
      await addDoc(collection(db, "revenues"), revenueData);

      // Mettre à jour l'interface utilisateur
      setAppointments(
        appointments.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status: "completed", completedAt: completedAt }
            : apt
        )
      );

      setMessage("Rendez-vous marqué comme terminé et revenu enregistré");
    } catch (error) {
      console.error("Erreur lors de la complétion du rendez-vous:", error);
      setMessage("Erreur lors de la mise à jour du rendez-vous");
    }
  };

  // Fonction pour supprimer un rendez-vous
async function handleDeleteAppointment(appointmentId) {
  try {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?")) {
      // Récupérer le rendez-vous avant suppression
      const appointmentRef = doc(db, "appointments", appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      const appointmentData = appointmentSnap.exists() ? appointmentSnap.data() : null;

      if (appointmentData && appointmentData.status === "completed") {
        // Rechercher l'entrée de revenu correspondante
        const revenueQuery = query(
          collection(db, "revenues"),
          where("appointmentId", "==", appointmentId)
        );
        const revenueSnap = await getDocs(revenueQuery);

        if (!revenueSnap.empty) {
          const revenueData = revenueSnap.docs[0].data();
          const revenueId = revenueSnap.docs[0].id;

          // Marquer l'entrée comme supprimée mais conserver toutes les informations
          await updateDoc(doc(db, "revenues", revenueId), {
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedReason: "Rendez-vous supprimé",
            // Archiver les informations importantes pour les récapitulatifs
            archivedData: {
              doctorName: `${selectedDoctor?.nom || ""} ${
                selectedDoctor?.prenom || ""
              }`,
              patientName: appointmentData.patientName || "Patient inconnu",
              amount: revenueData.amount || 0,
              date: revenueData.date,
              day: appointmentData.day || "",
              timeSlot: appointmentData.timeSlot || "",
              originalStatus: "completed",
            },
          });

          // Ajouter également à une collection d'historique pour faciliter les rapports
          await addDoc(collection(db, "revenueHistory"), {
            revenueId: revenueId,
            appointmentId: appointmentId,
            doctorId: appointmentData.doctorId,
            patientId: appointmentData.patientId,
            structureId: structure.id,
            doctorName: `${selectedDoctor?.nom || ""} ${
              selectedDoctor?.prenom || ""
            }`,
            patientName: appointmentData.patientName || "Patient inconnu",
            amount: revenueData.amount || 0,
            date: revenueData.date,
            completedAt: appointmentData.completedAt,
            deletedAt: new Date().toISOString(),
            action: "deleted",
            day: appointmentData.day || "",
            timeSlot: appointmentData.timeSlot || "",
          });
        }
      }

      // Supprimer le rendez-vous
      await deleteDoc(appointmentRef);

      // Message de confirmation
      setMessage("Rendez-vous supprimé avec succès");
      
      // Pas besoin de mettre à jour l'état manuellement si vous avez configuré 
      // correctement les écouteurs onSnapshot - ils devraient détecter le changement
      // et mettre à jour automatiquement l'interface
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du rendez-vous:", error);
    setMessage("Erreur lors de la suppression du rendez-vous");
  }
}


  // Ajoutez ces états au début du composant
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);

  // Fonction pour exporter les données de revenus d'un médecin
  const exportRevenueData = (doctorId) => {
    try {
      const doctor = doctors.find((d) => d.id === doctorId);
      if (!doctor) return;

      // Filtrer les revenus du médecin
      const doctorRevenues = completedAppointments.filter(
        (rev) => rev.doctorId === doctorId
      );

      // Préparer les données pour l'export
      const exportData = doctorRevenues.map((rev) => {
        const patient = patients.find((p) => p.id === rev.patientId);
        return {
          Date: new Date(rev.date).toLocaleDateString(),
          Patient: patient
            ? `${patient.nom} ${patient.prenom}`
            : rev.patientName || "Patient inconnu",
          Montant: rev.amount?.toFixed(2) || "0.00",
          Statut: rev.isDeleted ? "Supprimé" : "Terminé",
          Jour: rev.day || "",
          DateSuppression: rev.deletedAt
            ? new Date(rev.deletedAt).toLocaleDateString()
            : "",
        };
      });

      // Convertir en CSV
      const headers = Object.keys(exportData[0] || {}).join(",");
      const rows = exportData.map((row) => Object.values(row).join(","));
      const csv = [headers, ...rows].join("\n");

      // Créer un blob et un lien de téléchargement
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `revenus_${doctor.nom}_${doctor.prenom}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("Données exportées avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      setMessage("Erreur lors de l'export des données");
    }
  };

  const generateRevenueSummary = (doctorId) => {
    try {
      const doctor = doctors.find((d) => d.id === doctorId);
      if (!doctor) return;

      // Filtrer les revenus du médecin (incluant les supprimés)
      const doctorRevenues = completedAppointments.filter(
        (rev) => rev.doctorId === doctorId
      );
      const activeRevenues = doctorRevenues.filter((rev) => !rev.isDeleted);
      const deletedRevenues = doctorRevenues.filter((rev) => rev.isDeleted);

      // Obtenir les dates importantes
      const today = getTodayDate();
      const startOfWeek = getStartOfWeek();
      const endOfWeek = getEndOfWeek();
      const currentMonth = getCurrentMonth();
      const currentYear = new Date().getFullYear().toString();

      // Calculer les statistiques globales
      const totalRevenue = doctorRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const activeRevenue = activeRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const deletedRevenue = deletedRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );

      const totalAppointments = doctorRevenues.length;
      const activeAppointments = activeRevenues.length;
      const deletedAppointments = deletedRevenues.length;

      // Statistiques journalières
      const dailyRevenues = doctorRevenues.filter((rev) =>
        rev.date.startsWith(today)
      );
      const dailyActiveRevenues = dailyRevenues.filter((rev) => !rev.isDeleted);
      const dailyRevenue = dailyRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const dailyActiveRevenue = dailyActiveRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const dailyAppointments = dailyRevenues.length;
      const dailyActiveAppointments = dailyActiveRevenues.length;

      // Statistiques hebdomadaires
      const weeklyRevenues = doctorRevenues.filter(
        (rev) => rev.date >= startOfWeek && rev.date <= endOfWeek
      );
      const weeklyActiveRevenues = weeklyRevenues.filter(
        (rev) => !rev.isDeleted
      );
      const weeklyRevenue = weeklyRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const weeklyActiveRevenue = weeklyActiveRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const weeklyAppointments = weeklyRevenues.length;
      const weeklyActiveAppointments = weeklyActiveRevenues.length;

      // Statistiques mensuelles
      const monthlyRevenues = doctorRevenues.filter((rev) =>
        rev.date.startsWith(currentMonth)
      );
      const monthlyActiveRevenues = monthlyRevenues.filter(
        (rev) => !rev.isDeleted
      );
      const monthlyRevenue = monthlyRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const monthlyActiveRevenue = monthlyActiveRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const monthlyAppointments = monthlyRevenues.length;
      const monthlyActiveAppointments = monthlyActiveRevenues.length;

      // Statistiques annuelles
      const yearlyRevenues = doctorRevenues.filter((rev) =>
        rev.date.startsWith(currentYear)
      );
      const yearlyActiveRevenues = yearlyRevenues.filter(
        (rev) => !rev.isDeleted
      );
      const yearlyRevenue = yearlyRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const yearlyActiveRevenue = yearlyActiveRevenues.reduce(
        (sum, rev) => sum + (rev.amount || 0),
        0
      );
      const yearlyAppointments = yearlyRevenues.length;
      const yearlyActiveAppointments = yearlyActiveRevenues.length;

      // Répartition par jour de la semaine
      const weeklyBreakdown = {};
      const daysOfWeek = [
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
        "Dimanche",
      ];
      weeklyRevenues.forEach((rev) => {
        const date = new Date(rev.date);
        const dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        const dayName = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1]; // Convertir pour que Lundi soit le premier jour

        if (!weeklyBreakdown[dayName]) {
          weeklyBreakdown[dayName] = { count: 0, amount: 0 };
        }
        weeklyBreakdown[dayName].count++;
        weeklyBreakdown[dayName].amount += rev.amount || 0;
      });

      // Répartition par jour du mois
      const monthlyBreakdownByDay = {};
      monthlyRevenues.forEach((rev) => {
        const date = rev.date;
        if (!monthlyBreakdownByDay[date]) {
          monthlyBreakdownByDay[date] = { count: 0, amount: 0 };
        }
        monthlyBreakdownByDay[date].count++;
        monthlyBreakdownByDay[date].amount += rev.amount || 0;
      });

      // Répartition par semaine du mois
      const monthlyBreakdownByWeek = {};
      monthlyRevenues.forEach((rev) => {
        const date = new Date(rev.date);
        // Calculer le numéro de la semaine dans le mois (1-5)
        const weekOfMonth = Math.ceil(date.getDate() / 7);

        if (!monthlyBreakdownByWeek[weekOfMonth]) {
          monthlyBreakdownByWeek[weekOfMonth] = { count: 0, amount: 0 };
        }
        monthlyBreakdownByWeek[weekOfMonth].count++;
        monthlyBreakdownByWeek[weekOfMonth].amount += rev.amount || 0;
      });

      // Répartition par mois de l'année
      const yearlyBreakdownByMonth = {};
      yearlyRevenues.forEach((rev) => {
        const month = rev.date.substring(5, 7); // Format YYYY-MM-DD, extraire MM

        if (!yearlyBreakdownByMonth[month]) {
          yearlyBreakdownByMonth[month] = {
            count: 0,
            amount: 0,
            daysWithAppointments: new Set(),
          };
        }
        yearlyBreakdownByMonth[month].count++;
        yearlyBreakdownByMonth[month].amount += rev.amount || 0;
        yearlyBreakdownByMonth[month].daysWithAppointments.add(rev.date);
      });

      // Convertir les ensembles en nombres pour la sérialisation JSON
      Object.keys(yearlyBreakdownByMonth).forEach((month) => {
        yearlyBreakdownByMonth[month].daysWithAppointments =
          yearlyBreakdownByMonth[month].daysWithAppointments.size;
      });

      // Répartition par jour de la semaine (tous revenus confondus)
      const revenueByDayOfWeek = {};
      daysOfWeek.forEach((day) => {
        revenueByDayOfWeek[day] = { count: 0, amount: 0 };
      });

      doctorRevenues.forEach((rev) => {
        const date = new Date(rev.date);
        const dayIndex = date.getDay();
        const dayName = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1];

        revenueByDayOfWeek[dayName].count++;
        revenueByDayOfWeek[dayName].amount += rev.amount || 0;
      });

      // Calculer les jours/semaines/mois avec des rendez-vous
      const daysWithAppointmentsThisWeek = new Set(
        weeklyRevenues.map((rev) => rev.date)
      ).size;
      const daysWithAppointmentsThisMonth = new Set(
        monthlyRevenues.map((rev) => rev.date)
      ).size;
      const weeksWithAppointmentsThisMonth = new Set(
        monthlyRevenues.map((rev) => {
          const date = new Date(rev.date);
          return Math.ceil(date.getDate() / 7);
        })
      ).size;
      const monthsWithAppointmentsThisYear = new Set(
        yearlyRevenues.map((rev) => rev.date.substring(5, 7))
      ).size;
      const weeksWithAppointmentsThisYear = new Set(
        yearlyRevenues.map((rev) => {
          const date = new Date(rev.date);
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
          return Math.ceil((days + startOfYear.getDay() + 1) / 7);
        })
      ).size;

      // Créer l'objet de données pour le récapitulatif
      const summaryData = {
        doctorName: `${doctor.nom} ${doctor.prenom}`,
        specialite: doctor.specialite || "Non spécifiée",

        // Dates importantes
        today,
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        month: currentMonth,
        monthName: getMonthName(parseInt(currentMonth.substring(5, 7))),
        year: currentYear,

        // Statistiques globales
        totalRevenue,
        activeRevenue,
        deletedRevenue,
        totalAppointments,
        activeAppointments,
        deletedAppointments,

        // Statistiques journalières
        dailyRevenue,
        dailyActiveRevenue,
        dailyAppointments,
        dailyActiveAppointments,

        // Statistiques hebdomadaires
        weeklyRevenue,
        weeklyActiveRevenue,
        weeklyAppointments,
        weeklyActiveAppointments,
        weeklyBreakdown,
        daysWithAppointmentsThisWeek,

        // Statistiques mensuelles
        monthlyRevenue,
        monthlyActiveRevenue,
        monthlyAppointments,
        monthlyActiveAppointments,
        monthlyBreakdownByDay,
        monthlyBreakdownByWeek,
        daysWithAppointmentsThisMonth,
        // Statistiques mensuelles (suite)
        weeksWithAppointmentsThisMonth,

        // Statistiques annuelles
        yearlyRevenue,
        yearlyActiveRevenue,
        yearlyAppointments,
        yearlyActiveAppointments,
        yearlyBreakdownByMonth,
        monthsWithAppointmentsThisYear,
        weeksWithAppointmentsThisYear,

        // Répartition par jour de la semaine
        revenueByDayOfWeek,

        // Répartition par jour (tous revenus confondus)
        revenueByDay: monthlyBreakdownByDay,

        // Période et date de génération
        period: `${startOfWeek} au ${endOfWeek}`,
        generatedAt: new Date().toLocaleString("fr-FR"),
      };

      return summaryData;
    } catch (error) {
      console.error("Erreur lors de la génération du récapitulatif:", error);
      return null;
    }
  };
  // Fonction pour obtenir le nom du mois à partir de son numéro
  const getMonthName = (monthNumber) => {
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return monthNames[monthNumber - 1] || "";
  };

  // Fonction pour exporter le récapitulatif en format CSV
  const exportSummaryDataCSV = (doctorId) => {
    try {
      const summaryData = generateRevenueSummary(doctorId);
      if (!summaryData) return;

      // Créer les données CSV
      let csvContent = "Type,Période,Consultations,Revenus,Moyenne\n";

      // Données journalières
      csvContent += `Journalier,${summaryData.today},${
        summaryData.dailyAppointments
      },${summaryData.dailyRevenue.toFixed(2)},${
        summaryData.dailyAppointments > 0
          ? (summaryData.dailyRevenue / summaryData.dailyAppointments).toFixed(
              2
            )
          : "0.00"
      }\n`;

      // Données hebdomadaires
      csvContent += `Hebdomadaire,${summaryData.weekStart} au ${
        summaryData.weekEnd
      },${summaryData.weeklyAppointments},${summaryData.weeklyRevenue.toFixed(
        2
      )},${
        summaryData.weeklyAppointments > 0
          ? (
              summaryData.weeklyRevenue / summaryData.weeklyAppointments
            ).toFixed(2)
          : "0.00"
      }\n`;

      // Données mensuelles
      csvContent += `Mensuel,${summaryData.monthName},${
        summaryData.monthlyAppointments
      },${summaryData.monthlyRevenue.toFixed(2)},${
        summaryData.monthlyAppointments > 0
          ? (
              summaryData.monthlyRevenue / summaryData.monthlyAppointments
            ).toFixed(2)
          : "0.00"
      }\n`;

      // Données annuelles
      csvContent += `Annuel,${summaryData.year},${
        summaryData.yearlyAppointments
      },${summaryData.yearlyRevenue.toFixed(2)},${
        summaryData.yearlyAppointments > 0
          ? (
              summaryData.yearlyRevenue / summaryData.yearlyAppointments
            ).toFixed(2)
          : "0.00"
      }\n`;

      // Séparateur pour la section suivante
      csvContent += "\n\nDétail par jour de la semaine\n";
      csvContent += "Jour,Consultations,Revenus,Moyenne\n";

      // Détail par jour de la semaine
      Object.entries(summaryData.revenueByDayOfWeek).forEach(([day, data]) => {
        csvContent += `${day},${data.count},${data.amount.toFixed(2)},${
          data.count > 0 ? (data.amount / data.count).toFixed(2) : "0.00"
        }\n`;
      });

      // Séparateur pour la section suivante
      csvContent += "\n\nDétail par mois de l'année\n";
      csvContent += "Mois,Consultations,Revenus,Moyenne par jour\n";

      // Détail par mois de l'année
      Object.entries(summaryData.yearlyBreakdownByMonth).forEach(
        ([month, data]) => {
          csvContent += `${getMonthName(parseInt(month))},${
            data.count
          },${data.amount.toFixed(2)},${
            data.daysWithAppointments > 0
              ? (data.amount / data.daysWithAppointments).toFixed(2)
              : "0.00"
          }\n`;
        }
      );

      // Créer un blob et télécharger le fichier
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `recap_${summaryData.doctorName.replace(/\s+/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage("Récapitulatif exporté en CSV avec succès");
    } catch (error) {
      console.error("Erreur lors de l'export du récapitulatif en CSV:", error);
      setMessage("Erreur lors de l'export du récapitulatif");
    }
  };

  // Fonction pour exporter le récapitulatif en PDF
  const exportSummaryData = (doctorId) => {
    try {
      const summaryData = generateRevenueSummary(doctorId);
      if (!summaryData) return;

      // Cette fonction nécessite une bibliothèque comme jsPDF ou pdfmake
      // Voici un exemple avec jsPDF (nécessite d'installer la bibliothèque)

      // Exemple simplifié (à adapter selon la bibliothèque utilisée)
      alert("Fonctionnalité d'export PDF à implémenter avec jsPDF ou pdfmake");

      // Pour une implémentation complète, vous devrez:
      // 1. Installer jsPDF ou pdfmake
      // 2. Créer un document PDF avec tous les éléments du récapitulatif
      // 3. Générer et télécharger le PDF

      setMessage("L'export PDF sera disponible prochainement");
    } catch (error) {
      console.error("Erreur lors de l'export du récapitulatif en PDF:", error);
      setMessage("Erreur lors de l'export du récapitulatif");
    }
  };

  // Ajoutez ces états
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // Fonction pour sauvegarder un résumé des revenus quotidiens
  const saveRevenueSnapshot = async () => {
    try {
      const today = getTodayDate();
      const totalRevenue = calculateTotalRevenue("daily");

      await setDoc(doc(db, "revenueSnapshots", today), {
        date: today,
        structureId: structure.id,
        total: totalRevenue,
        byDoctor: doctors.reduce((acc, doctor) => {
          acc[doctor.id] = calculateDailyRevenue(doctor.id);
          return acc;
        }, {}),
        createdAt: new Date().toISOString(),
      });

      console.log("Snapshot de revenus sauvegardé");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du snapshot:", error);
    }
  };

  // Vous pouvez appeler cette fonction à la fin de la journée ou périodiquement

  const refreshDoctorData = async (doctorId) => {
    try {
      const doctorDoc = await getDoc(doc(db, "medecins", doctorId));
      if (doctorDoc.exists()) {
        const updatedDoctor = { id: doctorDoc.id, ...doctorDoc.data() };
        setDoctors(doctors.map((d) => (d.id === doctorId ? updatedDoctor : d)));
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    }
  };

  const handleEditDoctor = async (doctor) => {
    try {
      const doctorRef = doc(db, "medecins", doctor.id);

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
      setDoctors(
        doctors.map((d) => (d.id === doctor.id ? { ...d, ...updateData } : d))
      );
      setShowEditDoctorModal(false);
      setMessage("Médecin modifié avec succès");

      // Rafraîchir les données
      await fetchStructureData(structure.id);
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      setMessage("Erreur lors de la modification du médecin");
    }
  };

  async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?"
      )
    ) {
      try {
        // Supprimer le rendez-vous de Firestore (base de données)
        await deleteDoc(doc(db, "appointments", apt.id));

        // Mettre à jour l'état local pour l'interface utilisateur
        const updatedAppointments = selectedDoctorDetails.appointments.filter(
          (a) => a.id !== apt.id
        );

        setSelectedDoctorDetails({
          ...selectedDoctorDetails,
          appointments: updatedAppointments,
        });

        // Mettre à jour l'état global des rendez-vous
        setAppointments((prev) => prev.filter((a) => a.id !== apt.id));

        setMessage("Rendez-vous supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression du rendez-vous:", error);
        setMessage("Erreur lors de la suppression du rendez-vous");
      }
    }
  };

  const handleEditPatient = async (patient) => {
    try {
      const patientRef = doc(db, "patients", patient.id);

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
        diagnostic: patient.diagnostic || "",
        antecedents: patient.antecedents || [], // Ajout des antécédents médicaux
        allergies: patient.allergies || [], // Ajout des allergies si nécessaire
        traitements: patient.traitements || [], // Ajout des traitements en cours si nécessaire
        adresse: patient.adresse || "", // Ajout de l'adresse si nécessaire
      };

      // Gestion de la photo - ne l'ajouter que si elle est définie
      if (patientPhotoFile) {
        const photoRef = ref(
          storage,
          `patients/${structure.id}/${patientIdentifier}/photo`
        );
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
            const docRef = ref(
              storage,
              `patients/${structure.id}/${patientIdentifier}/documents/${file.name}`
            );
            await uploadBytes(docRef, file);
            return getDownloadURL(docRef);
          })
        );
        updateData.documents = [...(patient.documents || []), ...newDocUrls];
      }

      // Mise à jour dans Firestore
      await updateDoc(patientRef, updateData);

      // Mise à jour de l'état local
      setPatients(
        patients.map((p) => (p.id === patient.id ? { ...p, ...updateData } : p))
      );
      setShowEditPatientModal(false);
      setMessage("Patient modifié avec succès");

      // Réinitialisation des états
      setEditMedicalDocs([]);
      setEditPreviewDocs([]);
      setPatientPhotoFile(null);
    } catch (error) {
      console.error("Erreur de modification:", error);
      setMessage("Erreur lors de la modification du patient");
    }
  };

  const handleShowAssignedDoctor = async (patient) => {
    try {
      // Récupérer tous les rendez-vous du patient
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, "appointments"),
          where("patientId", "==", patient.id)
        )
      );

      // Extraire les IDs uniques des médecins
      const doctorIds = [
        ...new Set(appointmentsSnapshot.docs.map((doc) => doc.data().doctorId)),
      ];

      // Récupérer les informations de tous les médecins
      const doctorsData = await Promise.all(
        doctorIds.map(async (doctorId) => {
          const doctorDoc = await getDoc(doc(db, "medecins", doctorId));
          if (doctorDoc.exists()) {
            return { id: doctorDoc.id, ...doctorDoc.data() };
          }
          return null;
        })
      );

      // Filtrer les médecins null et les organiser avec leurs rendez-vous
      const validDoctors = doctorsData.filter((d) => d !== null);
      const appointments = {};

      appointmentsSnapshot.docs.forEach((doc) => {
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
      console.error("Erreur:", error);
      setMessage("Erreur lors de la récupération des informations");
    }
  };

  const sendModificationLink = async () => {
    try {
      // Créer un lien de modification sécurisé
      const actionCodeSettings = {
        url: `${window.location.origin}/edit-structure?id=${structure.id}`,
        handleCodeInApp: true,
      };

      // Envoyer l'email avec Firebase Auth
      await sendSignInLinkToEmail(auth, structure.email, actionCodeSettings);

      // Sauvegarder l'email pour la vérification
      localStorage.setItem("emailForModification", structure.email);

      setMessage("Un lien de modification a été envoyé à votre email");
      setShowSettingsModal(false);
    } catch (error) {
      setMessage("Erreur lors de l'envoi du lien: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Sign out from Firebase
      await signOut(auth);

      // 2. Clear all localStorage data
      localStorage.clear();

      // 3. Navigate to home page
      navigate("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const weekdayOrder = {
    Lundi: 1,
    Mardi: 2,
    Mercredi: 3,
    Jeudi: 4,
    Vendredi: 5,
    Samedi: 6,
    Dimanche: 7,
  };

  const fadeAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const cardVariants = {
    hover: { scale: 1.02, transition: { duration: 0.3 } },
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
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user-md fa-2x"></i>
              </div>
            )}
          </div>
          <div>
            <h5 className="mb-0">
              Dr. {doctor.nom} {doctor.prenom}
            </h5>
            <span className="text-muted">{doctor.specialite}</span>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {doctor.disponibilite?.map((day) => (
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
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user fa-2x"></i>
              </div>
            )}
          </div>
          <div>
            <h5 className="mb-0">
              {patient.nom} {patient.prenom}
            </h5>
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
          onClick={() => onChange({ target: { value: "" } })}
        >
          <i
            className="fas fa-ti
        "
          ></i>
        </Button>
      )}
    </div>
  );

  const fetchAllAppointments = async () => {
    try {
      const structureId = JSON.parse(localStorage.getItem("structureData"))?.id;
      if (!structureId) return;

      // Récupérer tous les rendez-vous de la structure
      const appointmentsSnapshot = await getDocs(
        query(
          collection(db, "appointments"),
          where("structureId", "==", structureId)
        )
      );

      // Organiser les rendez-vous par jour
      const appointmentsByDay = {
        Lundi: [],
        Mardi: [],
        Mercredi: [],
        Jeudi: [],
        Vendredi: [],
        Samedi: [],
        Dimanche: [],
      };

      appointmentsSnapshot.docs.forEach((doc) => {
        const appt = { id: doc.id, ...doc.data() };
        // Vérifier que appt.day existe et qu'il est une clé valide dans appointmentsByDay
        if (appt.day && appointmentsByDay[appt.day]) {
          appointmentsByDay[appt.day].push(appt);
        } else {
          // Gérer le cas où le jour n'est pas défini ou n'est pas valide
          console.warn(
            `Rendez-vous avec jour non valide: ${appt.id}, jour: ${appt.day}`
          );
        }
      });

      // Récupérer les détails des médecins pour chaque jour
      const dailySchedule = await Promise.all(
        Object.entries(appointmentsByDay).map(
          async ([day, dayAppointments]) => {
            const doctorIds = [
              ...new Set(dayAppointments.map((apt) => apt.doctorId)),
            ];
            const doctorsWithAppointments = await Promise.all(
              doctorIds.map(async (doctorId) => {
                const doctorDoc = await getDoc(doc(db, "medecins", doctorId));
                const doctorData = doctorDoc.data();

                // Vérification si doctorData existe
                if (!doctorData) {
                  console.warn(`Médecin avec ID ${doctorId} non trouvé`);
                  return {
                    id: doctorId,
                    nom: "Inconnu",
                    prenom: "Médecin",
                    specialite: "Inconnue",
                    heureDebut: "",
                    heureFin: "",
                    appointments: dayAppointments.filter(
                      (apt) => apt.doctorId === doctorId
                    ),
                  };
                }

                return {
                  id: doctorId,
                  nom: doctorData.nom,
                  prenom: doctorData.prenom,
                  specialite: doctorData.specialite,
                  heureDebut: doctorData.heureDebut,
                  heureFin: doctorData.heureFin,
                  appointments: dayAppointments.filter(
                    (apt) => apt.doctorId === doctorId
                  ),
                };
              })
            );

            return {
              day,
              doctors: doctorsWithAppointments.filter(
                (d) => d.appointments.length > 0
              ),
            };
          }
        )
      );

      setDailyDoctorSchedule(dailySchedule);

      // Sélectionner automatiquement le lundi et son premier médecin
      const mondaySchedule = dailySchedule.find(
        (schedule) => schedule.day === "Lundi"
      );
      if (mondaySchedule && mondaySchedule.doctors.length > 0) {
        setSelectedDoctorDetails(mondaySchedule.doctors[0]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des rendez-vous:", error);
      setMessage("Erreur lors de la récupération des rendez-vous");
    }
  };

  useEffect(() => {
    const structureData = JSON.parse(localStorage.getItem("structureData"));
    if (!structureData) {
      navigate("/");
      return;
    }
  
    // Tableau pour stocker toutes les fonctions de désabonnement
    const unsubscribes = [];
  
    // Écouteur pour la structure
    const structureUnsubscribe = onSnapshot(
      doc(db, "structures", structureData.id),
      (doc) => {
        setStructure({ id: doc.id, ...doc.data() });
      }
    );
    unsubscribes.push(structureUnsubscribe);
  
    // Écouteur pour les médecins
    const doctorsUnsubscribe = onSnapshot(
      query(
        collection(db, "medecins"),
        where("structures", "array-contains", structureData.id)
      ),
      (snapshot) => {
        const doctorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorsData);
      }
    );
    unsubscribes.push(doctorsUnsubscribe);
  
    // Écouteur pour les patients
    const patientsUnsubscribe = onSnapshot(
      query(
        collection(db, "patients"),
        where("structures", "array-contains", structureData.id)
      ),
      (snapshot) => {
        const patientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientsData);
      }
    );
    unsubscribes.push(patientsUnsubscribe);
  
    // Écouteur pour tous les rendez-vous
    const appointmentsUnsubscribe = loadAppointments();
    unsubscribes.push(appointmentsUnsubscribe);
  
    // Si un médecin est sélectionné, écoutez ses rendez-vous spécifiques
    if (selectedDoctor) {
      const doctorAppointmentsUnsubscribe = fetchDoctorAppointments(selectedDoctor.id);
      unsubscribes.push(doctorAppointmentsUnsubscribe);
    }
  
    // Nettoyage : désabonnez-vous de tous les écouteurs lors du démontage
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [navigate, selectedDoctor]);

  const updateCalendarData = () => {
    if (!structure?.id) return;
    
    // Utilisez onSnapshot pour écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      query(
        collection(db, "appointments"),
        where("structureId", "==", structure.id)
      ),
      async (snapshot) => {
        // Organisez les rendez-vous par date ET jour
        const appointmentsByDateAndDay = {};
        
        snapshot.docs.forEach((doc) => {
          const appt = { id: doc.id, ...doc.data() };
          
          // Vérifier que l'appointment a une date et un jour
          if (appt.date && appt.day) {
            // Utiliser la date comme clé principale
            if (!appointmentsByDateAndDay[appt.date]) {
              appointmentsByDateAndDay[appt.date] = {
                day: appt.day,
                appointments: []
              };
            }
            appointmentsByDateAndDay[appt.date].appointments.push(appt);
          } 
          // Si seulement le jour est défini (ancien format), utiliser une structure différente
          else if (appt.day) {
            if (!appointmentsByDateAndDay[appt.day]) {
              appointmentsByDateAndDay[appt.day] = {
                isLegacy: true,  // Marquer comme ancien format
                appointments: []
              };
            }
            appointmentsByDateAndDay[appt.day].appointments.push(appt);
          }
        });
        
        // Trier les rendez-vous par orderNumber dans chaque groupe
        Object.keys(appointmentsByDateAndDay).forEach(key => {
          appointmentsByDateAndDay[key].appointments.sort((a, b) => {
            if (a.orderNumber && b.orderNumber) {
              return a.orderNumber - b.orderNumber;
            }
            return a.timeSlot?.localeCompare(b.timeSlot || "") || 0;
          });
        });
        
        // Créer le dailyDoctorSchedule
        const dailySchedule = await Promise.all(
          Object.entries(appointmentsByDateAndDay).map(async ([dateOrDay, data]) => {
            const appointments = data.appointments;
            const day = data.day || dateOrDay; // Utiliser le jour stocké ou la clé si c'est l'ancien format
            
            // Regrouper par médecin
            const doctorIds = [...new Set(appointments.map(apt => apt.doctorId))];
            const doctorsWithAppointments = await Promise.all(
              doctorIds.map(async (doctorId) => {
                const doctorDoc = await getDoc(doc(db, "medecins", doctorId));
                const doctorData = doctorDoc.data();
                
                if (!doctorData) {
                  return {
                    id: doctorId,
                    nom: "Inconnu",
                    prenom: "Médecin",
                    specialite: "Inconnue",
                    heureDebut: "",
                    heureFin: "",
                    appointments: appointments.filter(apt => apt.doctorId === doctorId)
                      .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)),
                  };
                }
                
                return {
                  id: doctorId,
                  nom: doctorData.nom,
                  prenom: doctorData.prenom,
                  specialite: doctorData.specialite,
                  heureDebut: doctorData.heureDebut,
                  heureFin: doctorData.heureFin,
                  appointments: appointments.filter(apt => apt.doctorId === doctorId)
                    .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0)),
                };
              })
            );
            
            return {
              day,
              date: data.isLegacy ? null : dateOrDay, // Stocker la date si disponible
              doctors: doctorsWithAppointments.filter(d => d.appointments.length > 0),
            };
          })
        );
        
        setDailyDoctorSchedule(dailySchedule);
      },
      (error) => {
        console.error("Erreur lors de la récupération des rendez-vous:", error);
        setMessage("Erreur lors de la récupération des rendez-vous");
      }
    );
    
    return unsubscribe;
  };
  
  

useEffect(() => {
  if (showCalendarView && structure?.id) {
    const unsubscribe = updateCalendarData();
    return () => unsubscribe && unsubscribe();
  }
}, [showCalendarView, structure?.id]);


  const calendarButton = (
    <Button
      variant={showCalendarView ? "primary" : "light"}
      onClick={() => {
        setShowCalendarView(!showCalendarView);
        setShowMenuSidebar(false);
      }}
      className="ms-2"
    >
      <i className="fas fa-calendar-alt me-2"></i>
      Calendrier
    </Button>
  );

  // Ajoutez cette fonction de recherche spécifique aux patients privés
  const [privatePatientSearchQuery, setPrivatePatientSearchQuery] =
    useState("");
  const [filteredPrivatePatients, setFilteredPrivatePatients] = useState([]);

  const handlePrivatePatientSearch = (query) => {
    setPrivatePatientSearchQuery(query);

    if (!query.trim()) {
      setFilteredPrivatePatients([]);
      return;
    }

    const searchTerms = query.toLowerCase().split(" ");

    // Filtrer uniquement les patients privés
    const privatePatients = patients.filter(
      (patient) => patient.visibility === "private"
    );

    const filtered = privatePatients.filter((patient) => {
      const searchableFields = [
        patient.nom,
        patient.prenom,
        patient.email,
        patient.telephone,
        patient.age?.toString(),
        patient.sexe,
        patient.adresse,
      ]
        .filter((field) => typeof field === "string")
        .map((field) => field.toLowerCase());

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    });

    setFilteredPrivatePatients(filtered);
  };

  // Ajoutez ce composant de barre de recherche pour les patients privés
  const privatePatientSearchBar = (
    <div className="search-container mb-3 p-3 bg-white rounded-3 shadow-sm">
      <Form.Group>
        <Form.Control
          type="text"
          placeholder="Rechercher parmi les patients privés... (nom, âge, email, téléphone, etc.)"
          value={privatePatientSearchQuery}
          onChange={(e) => handlePrivatePatientSearch(e.target.value)}
          className="search-input"
        />
      </Form.Group>

      {privatePatientSearchQuery && (
        <div className="search-results mt-3">
          {filteredPrivatePatients.length > 0 ? (
            <div className="patients-results">
              <h6 className="text-success mb-2">
                <i className="fas fa-users me-2"></i>
                Patients privés ({filteredPrivatePatients.length})
              </h6>
              <div className="list-group">
                {filteredPrivatePatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="list-group-item list-group-item-action"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">
                          {patient.nom} {patient.prenom}
                        </h6>
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
          ) : (
            <p className="text-muted text-center my-3">
              <i className="fas fa-search me-2"></i>
              Aucun patient privé trouvé
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
          box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.15);
          border-color: #28a745;
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

  // Ajoutez ces états et fonctions à votre composant
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Fonction pour générer les jours de la semaine avec leurs dates
  const weekDays = useMemo(() => {
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const today = new Date();
  
    // Calculer le premier jour de la semaine actuelle (lundi)
    const firstDayOfWeek = new Date();
    const currentDay = firstDayOfWeek.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const diff = firstDayOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    firstDayOfWeek.setDate(diff);
  
    // Appliquer le décalage de semaine
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() + currentWeekOffset * 7);
  
    // Générer les dates pour chaque jour de la semaine
    return days.map((dayName, index) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + index);
      
      const formattedDate = date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
      });
      
      // Ajouter la date au format ISO pour faciliter la comparaison
      const isoDate = date.toISOString().split('T')[0];
  
      return {
        dayName,
        date,
        formattedDate,
        isoDate
      };
    });
  }, [currentWeekOffset]);
  

  // Fonction pour vérifier si une date est aujourd'hui
  const isDateToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Dans votre composant, ajoutez un effet pour initialiser la date sélectionnée
useEffect(() => {
  // Trouver le jour actuel dans weekDays
  const today = new Date();
  const todayDayIndex = weekDays.findIndex(day => isDateToday(day.date));
  
  if (todayDayIndex !== -1) {
    setSelectedDay(weekDays[todayDayIndex].dayName);
    setSelectedDate(weekDays[todayDayIndex].isoDate);
  } else {
    // Si aujourd'hui n'est pas dans la semaine affichée, sélectionner le premier jour
    setSelectedDay(weekDays[0].dayName);
    setSelectedDate(weekDays[0].isoDate);
  }
}, [weekDays]);


  // Fonction pour passer à la semaine précédente
  const handlePreviousWeek = () => {
    setCurrentWeekOffset((prev) => prev - 1);
  };

  // Fonction pour passer à la semaine suivante
  const handleNextWeek = () => {
    setCurrentWeekOffset((prev) => prev + 1);
  };

  // Fonction pour obtenir la plage de dates de la semaine actuelle
  const getWeekDateRange = () => {
    if (weekDays.length === 0) return "";

    const firstDay = weekDays[0].date;
    const lastDay = weekDays[6].date;

    const firstDayFormatted = firstDay.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });

    const lastDayFormatted = lastDay.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });

    return `${firstDayFormatted} au ${lastDayFormatted}`;
  };

  const getSelectedDayDate = () => {
    if (!selectedDay) return "";
    
    // Si une date spécifique est sélectionnée, l'utiliser
    if (selectedDate) {
      return `(${new Date(selectedDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })})`;
    }
    
    // Sinon, utiliser la date de la semaine courante
    const dayIndex = weekDays.findIndex((day) => day.dayName === selectedDay);
    if (dayIndex === -1) return "";
    
    const date = weekDays[dayIndex].date;
    return `(${date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })})`;
  };

  const calendarView = showCalendarView && (
    <Card className="calendar-view-card mb-4">
      <Card.Header className="calendar-header py-3">
        {/* L'en-tête reste inchangé */}
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <div className="header-icon-container me-2">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <span className="header-title">Planning</span>
          </h5>
          <div className="current-datetime d-none d-md-block">
            {new Date().toLocaleString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="mobile-actions d-md-none">
            <Button
              variant="link"
              className="text-white p-0"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <i className="fas fa-sliders-h"></i>
            </Button>
          </div>
        </div>
      </Card.Header>
  
      {/* Sélecteur de semaine et jours (visible uniquement sur mobile quand activé) */}
      <div
        className={`mobile-filters d-md-none ${
          showMobileFilters ? "show" : ""
        }`}
      >
        <div className="p-3">
          <div className="week-selector mb-3 d-flex align-items-center justify-content-between">
            <Button
              variant="outline-primary"
              onClick={() => handlePreviousWeek()}
              className="week-nav-btn"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
  
            <span className="week-range">{getWeekDateRange()}</span>
  
            <Button
              variant="outline-primary"
              onClick={() => handleNextWeek()}
              className="week-nav-btn"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
  
          <div className="days-scroll-container">
            {weekDays.map(({ dayName, date, formattedDate, isoDate }) => {
              // Modification ici : utiliser isoDate pour trouver les rendez-vous
              const daySchedule = dailyDoctorSchedule.find(
                (schedule) => schedule.date === isoDate || 
                             (schedule.day === dayName && !schedule.date)
              );
              
              const appointmentCount = daySchedule
                ? daySchedule.doctors.reduce(
                    (total, doctor) => total + doctor.appointments.length,
                    0
                  )
                : 0;
                
              const isToday = isDateToday(date);
  
              return (
                <div
                  key={isoDate} // Utiliser isoDate comme clé unique
                  className={`mobile-day-item ${
                    selectedDay === dayName && selectedDate === isoDate ? "day-selected" : ""
                  } ${isToday ? "day-today" : ""}`}
                  onClick={() => {
                    setSelectedDay(dayName);
                    setSelectedDate(isoDate); // Ajouter cette ligne pour stocker la date
                    setShowMobileFilters(false);
                  }}
                >
                  <div className="day-content">
                    <div className="day-name-container">
                      <span className="day-name">
                        {dayName.substring(0, 3)}
                      </span>
                      {isToday && <div className="today-dot"></div>}
                    </div>
                    <div className="day-date">
                      {formattedDate.split(" ")[0]}
                    </div>
                    <div className="appointment-count">{appointmentCount}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  
      <Card.Body className="p-0">
        <Row className="g-0">
          {/* Sidebar avec les jours (visible uniquement sur desktop) */}
          <Col md={3} className="d-none d-md-block sidebar-container">
            <div className="weekdays-list p-3">
              <div className="week-selector mb-3 d-flex align-items-center justify-content-between">
                <Button
                  variant="outline-primary"
                  onClick={() => handlePreviousWeek()}
                  className="week-nav-btn"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
  
                <span className="week-range">{getWeekDateRange()}</span>
  
                <Button
                  variant="outline-primary"
                  onClick={() => handleNextWeek()}
                  className="week-nav-btn"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
              </div>
  
              <div className="days-container">
                {weekDays.map(({ dayName, date, formattedDate, isoDate }) => {
                  // Modification ici : utiliser isoDate pour trouver les rendez-vous
                  const daySchedule = dailyDoctorSchedule.find(
                    (schedule) => schedule.date === isoDate || 
                                 (schedule.day === dayName && !schedule.date)
                  );
                  
                  const appointmentCount = daySchedule
                    ? daySchedule.doctors.reduce(
                        (total, doctor) => total + doctor.appointments.length,
                        0
                      )
                    : 0;
                    
                  const isToday = isDateToday(date);
  
                  return (
                    <div
                      key={isoDate} // Utiliser isoDate comme clé unique
                      className={`day-item ${
                        selectedDay === dayName && selectedDate === isoDate ? "day-selected" : ""
                      } ${isToday ? "day-today" : ""}`}
                      onClick={() => {
                        setSelectedDay(dayName);
                        setSelectedDate(isoDate); // Ajouter cette ligne pour stocker la date
                      }}
                    >
                      <div className="day-content">
                        <div className="day-name-container">
                          <span className="day-name">{dayName} </span>
                          {isToday && (
                            <div className="today-indicator">Aujourd'hui</div>
                          )}
                          <div className="appointment-count">
                          <i className="fas fa-calendar-check me-1"></i>
                          {appointmentCount}
                        </div>
                          
                        </div>
  
                        <div className="day-date">{formattedDate}</div>
  
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>
  
          <Col xs={12} md={9}>
            <div className="daily-schedule p-3">
              {/* Barre de navigation mobile pour les jours (toujours visible) */}
              <div className="d-md-none mobile-day-nav mb-3">
                {weekDays.map(({ dayName, date, isoDate }, index) => {
                  const isToday = isDateToday(date);
                  const dayNum = new Date(date).getDate();
                  const dayShort = dayName.substring(0, 1);
  
                  return (
                    <div
                      key={isoDate} // Utiliser isoDate comme clé unique
                      className={`mobile-day-nav-item ${
                        selectedDay === dayName && selectedDate === isoDate ? "active" : ""
                      } ${isToday ? "today" : ""}`}
                      onClick={() => {
                        setSelectedDay(dayName);
                        setSelectedDate(isoDate); // Ajouter cette ligne pour stocker la date
                      }}
                    >
                      <div className="day-short">{dayShort}</div>
                      <div className="day-num">{dayNum}</div>
                    </div>
                  );
                })}
              </div>
  
              {selectedDay ? (
                <>
                  <div className="selected-day-header mb-3">
                    <div className="day-title">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-calendar-day me-2"></i>
                        <span className="d-none d-sm-inline">Planning du  <span>{selectedDay} {getSelectedDayDate()}</span> </span>
                      </div>
                      <div className="appointment-total-badge">
                        {dailyDoctorSchedule
                          .find((schedule) => 
                            (schedule.day === selectedDay && schedule.date === selectedDate) ||
                            (schedule.day === selectedDay && !schedule.date) ||
                            (schedule.day === selectedDay && !selectedDate)
                          )
                          ?.doctors.reduce(
                            (total, doctor) =>
                              total + doctor.appointments.length,
                            0
                          ) || 0}{" "}
                        RDV
                      </div>
                    </div>
                  </div>
  
                  {dailyDoctorSchedule.find(
                    (schedule) => 
                      (schedule.day === selectedDay && schedule.date === selectedDate) ||
                      (schedule.day === selectedDay && !schedule.date) ||
                      (schedule.day === selectedDay && !selectedDate)
                  )?.doctors.length > 0 ? (
                    <div className="doctors-list">
                      {dailyDoctorSchedule
                        .find((schedule) => 
                          (schedule.day === selectedDay && schedule.date === selectedDate) ||
                          (schedule.day === selectedDay && !schedule.date) ||
                          (schedule.day === selectedDay && !selectedDate)
                        )
                        .doctors.map((doctor) => (
                          <div
                            key={doctor.id}
                            className="doctor-card"
                            onClick={() => handleDoctorClick(doctor)}
                          >
                            <div className="doctor-card-header">
                              <div className="doctor-info">
                                <div className="doctor-avatar">
                                  <i className="fas fa-user-md"></i>
                                </div>
                                <div className="doctor-details">
                                  <h6 className="doctor-name">
                                    Dr. {doctor.nom} {doctor.prenom}
                                  </h6>
                                  <div className="doctor-meta">
                                    <span className="doctor-specialty">
                                      <i className="fas fa-stethoscope me-1"></i>
                                      {doctor.specialite}
                                    </span>
                                    <span className="doctor-schedule">
                                      <i className="far fa-clock me-1"></i>
                                      {doctor.heureDebut} - {doctor.heureFin}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="doctor-appointments-count">
                                <span className="count-badge">
                                  {doctor.appointments.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="fas fa-calendar-times"></i>
                      </div>
                      <div className="empty-message">
                        Aucun médecin disponible ce jour
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-calendar"></i>
                  </div>
                  <div className="empty-message">
                    Sélectionnez un jour pour voir les rendez-vous
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>

      <style jsx>{`
        /* Variables de couleurs */
        :root {
          --primary-color: #2c7be5;
          --primary-light: #edf2ff;
          --primary-dark: #1a68d1;
          --secondary-color: #6e84a3;
          --success-color: #00cc8d;
          --warning-color: #f6c343;
          --danger-color: #e63757;
          --info-color: #39afd1;
          --light-color: #f9fbfd;
          --dark-color: #12263f;
          --white: #ffffff;
          --gray-100: #f9fbfd;
          --gray-200: #edf2f9;
          --gray-300: #e3ebf6;
          --gray-400: #d2ddec;
          --gray-500: #b1c2d9;
          --gray-600: #95aac9;
          --gray-700: #6e84a3;
          --gray-800: #3b506c;
          --gray-900: #12263f;
          --border-radius: 0.5rem;
          --box-shadow: 0 0.5rem 1rem rgba(18, 38, 63, 0.05);
          --transition: all 0.2s ease-in-out;
        }

        /* Styles généraux */
        .calendar-view-card {
          border: none;
          border-radius: var(--border-radius);
          box-shadow: var(--box-shadow);
          overflow: hidden;
          background-color: var(--white);
          max-height: 80vh;
        }

        /* En-tête du calendrier */
        .calendar-header {
          background: linear-gradient(
            45deg,
            var(--primary-color),
            var(--primary-dark)
          );
          color: var(--white);
          border-bottom: none;
        }

        .header-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.2);
          font-size: 1rem;
        }

        .header-title {
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .current-datetime {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 2rem;
          font-weight: 500;
          font-size: 0.85rem;
          padding: 0.35rem 0.75rem;
        }

        /* Filtres mobiles */
        .mobile-filters {
          background-color: var(--white);
          border-bottom: 1px solid var(--gray-200);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .mobile-filters.show {
          max-height: 150px;
        }

        .days-scroll-container {
          display: flex;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          gap: 0.5rem;
          scrollbar-width: none;
        }

        .days-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .mobile-day-item {
          min-width: 80px;
          background-color: var(--gray-100);
          border-radius: var(--border-radius);
          padding: 0.5rem;
          text-align: center;
          cursor: pointer;
          border: 1px solid var(--gray-200);
        }

        .mobile-day-item.day-selected {
          background-color: var(--primary-color);
          color: var(--white);
        }

        .today-dot {
          width: 6px;
          height: 6px;
          background-color: var(--warning-color);
          border-radius: 50%;
          position: absolute;
          top: 5px;
          right: 5px;
        }

        /* Navigation des jours sur mobile */
        .mobile-day-nav {
          display: flex;
          justify-content: space-between;
          background-color: var(--white);
          border-radius: var(--border-radius);
          overflow: hidden;
          border: 1px solid var(--gray-200);
        }

        .mobile-day-nav-item {
          flex: 1;
          text-align: center;
          padding: 0.5rem 0;
          cursor: pointer;
          font-size: 0.8rem;
          transition: var(--transition);
        }

        .mobile-day-nav-item.active {
          background-color: var(--primary-color);
          color: var(--white);
        }

        .mobile-day-nav-item.today {
          position: relative;
        }

        .mobile-day-nav-item.today::after {
          content: "";
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: var(--warning-color);
          border-radius: 50%;
          top: 2px;
          right: calc(50% - 10px);
        }

        .day-short {
          font-weight: 600;
          font-size: 0.7rem;
          opacity: 0.8;
        }

        .day-num {
          font-weight: 700;
          font-size: 0.9rem;
        }

        /* Sidebar avec les jours */
        .sidebar-container {
          background-color: var(--gray-100);
          border-right: 1px solid var(--gray-200);
          max-height: calc(80vh - 60px);
          overflow-y: auto;
        }

        /* Sélecteur de semaine */
        .week-selector {
          background-color: var(--white);
          padding: 0.5rem;
          border-radius: var(--border-radius);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .week-range {
          font-weight: 600;
          color: var(--primary-color);
          font-size: 0.85rem;
        }

        .week-nav-btn {
          width: 24px;
          height: 24px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--primary-color);
          border-color: var(--primary-color);
          background-color: transparent;
          transition: var(--transition);
          font-size: 0.7rem;
        }

        .week-nav-btn:hover {
          background-color: var(--primary-color);
          color: var(--white);
        }

        /* Boutons des jours */
        .days-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .day-item {
          background-color: var(--white);
          border-radius: var(--border-radius);
          padding: 0.5rem;
          cursor: pointer;
          transition: var(--transition);
          border: 1px solid var(--gray-200);
          position: relative;
        }

        .day-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .day-selected {
          background: linear-gradient(
            45deg,
            var(--primary-color),
            var(--primary-dark)
          );
          color: var(--white);
          border-color: var(--primary-color);
          box-shadow: 0 2px 6px rgba(44, 123, 229, 0.3);
        }

        .day-today {
          border: 1px solid var(--info-color);
        }

        .day-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .day-name-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .day-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .today-indicator {
          font-size: 0.6rem;
          background-color: var(--warning-color);
          color: var(--dark-color);
          padding: 0.1rem 0.4rem;
          border-radius: 1rem;
          font-weight: 600;
        }

        .day-selected .today-indicator {
          background-color: rgba(255, 255, 255, 0.25);
          color: var(--white);
        }

        .day-date {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .appointment-count {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          padding: 0.15rem 0.4rem;
          background-color: var(--gray-200);
          border-radius: 1rem;
          display: inline-flex;
          align-items: center;
        }

        .day-selected .appointment-count {
          background-color: rgba(255, 255, 255, 0.2);
        }

        /* Planning quotidien */
        .daily-schedule {
          background-color: var(--white);
          max-height: calc(80vh - 60px);
          overflow-y: auto;
        }

        .selected-day-header {
          margin-bottom: 1rem;
        }

        .day-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--primary-color);
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .appointment-total-badge {
          background-color: var(--info-color);
          color: var(--white);
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 1rem;
          font-weight: 500;
        }

        /* Liste des médecins */
        .doctors-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .doctor-card {
          background-color: var(--white);
          border-radius: var(--border-radius);
          overflow: hidden;
          transition: var(--transition);
          border: 1px solid var(--gray-200);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .doctor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }

        .doctor-card-header {
          padding: 0.75rem;
          background-color: var(--gray-100);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .doctor-info {
          display: flex;
          align-items: center;
        }

        .doctor-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          margin-right: 0.75rem;
        }

        .doctor-details {
          flex: 1;
        }

        .doctor-name {
          font-weight: 600;
          margin-bottom: 0.1rem;
          color: var(--dark-color);
          font-size: 0.9rem;
        }

        .doctor-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: var(--gray-700);
        }

        .doctor-appointments-count {
          display: flex;
          align-items: center;
        }

        .count-badge {
          background-color: var(--primary-color);
          color: var(--white);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Liste des rendez-vous */
        .appointments-container {
          padding: 0.5rem;
        }

        .appointments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
           .recently-updated {
            animation: highlight-update 3s ease-in-out;
          }
          
          @keyframes highlight-update {
            0% { background-color: rgba(255, 193, 7, 0.3); }
            100% { background-color: transparent; }
          }

        .appointment-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--border-radius);
          background-color: var(--gray-100);
          position: relative;
        }

        .appointment-scheduled {
          border-left: 3px solid var(--warning-color);
        }

        .appointment-completed {
          border-left: 3px solid var(--success-color);
        }

        .appointment-time {
          font-weight: 600;
          color: var(--dark-color);
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .patient-name {
          font-size: 0.8rem;
          color: var(--gray-700);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .appointment-status {
          font-size: 0.65rem;
          padding: 0.1rem 0.4rem;
          border-radius: 1rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-scheduled {
          background-color: var(--warning-color);
          color: var(--dark-color);
        }

        .status-completed {
          background-color: var(--success-color);
          color: var(--white);
        }

        /* États vides */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 2rem;
          color: var(--gray-400);
          margin-bottom: 1rem;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: var(--gray-100);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-message {
          font-size: 0.9rem;
          color: var(--gray-600);
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 767px) {
          .calendar-view-card {
            max-height: 100vh; /* Utiliser 100vh au lieu de 90vh */
            overflow: hidden; /* Cacher tout débordement au niveau de la carte */
          }

          .daily-schedule {
            max-height: calc(100vh - 120px); /* Ajuster pour tenir compte de l'en-tête */
            overflow-y: auto;
            -webkit-overflow-scrolling: touch; /* Pour une meilleure expérience de défilement sur iOS */
          }
          
          .doctors-list {
            overflow-y: auto;
            max-height: 70vh; /* Limiter la hauteur de la liste des médecins */
          }
          
          .appointments-list {
            overflow-y: auto;
            max-height: 40vh; /* Limiter la hauteur de la liste des rendez-vous */
          }

          .daily-schedule {
            max-height: calc(90vh - 60px);
          }

          .doctor-meta {
            flex-direction: column;
            gap: 0.25rem;
          }

          .appointment-item {
            grid-template-columns: 1fr auto;
            grid-template-rows: auto auto;
          }

          .appointment-time {
            grid-column: 1;
            grid-row: 1;
          }

          .patient-name {
            grid-column: 1;
            grid-row: 2;
          }

          .appointment-status {
            grid-column: 2;
            grid-row: 1 / span 2;
            align-self: center;
          }
        }
      `}</style>
    </Card>
  );

  // Ajoutez ces états au début du composant StructuresDashboard
  const [doctorFees, setDoctorFees] = useState({});
  const [showRevenueSection, setShowRevenueSection] = useState(false);
  const [newFee, setNewFee] = useState("");
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] =
    useState(null);
  const [showWeeklyDetails, setShowWeeklyDetails] = useState(false);
  const [completedAppointments, setCompletedAppointments] = useState([]);

  // Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // Fonction pour obtenir la date de début de semaine
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer le lundi
    const monday = new Date(today.setDate(diff));
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(monday.getDate()).padStart(2, "0")}`;
  };

  // Fonction pour obtenir la date de fin de semaine
  const getEndOfWeek = () => {
    const startOfWeek = new Date(getStartOfWeek());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${endOfWeek.getFullYear()}-${String(
      endOfWeek.getMonth() + 1
    ).padStart(2, "0")}-${String(endOfWeek.getDate()).padStart(2, "0")}`;
  };

  // Fonction pour obtenir le mois actuel au format YYYY-MM
  const getCurrentMonth = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  // Fonction pour charger les tarifs des médecins
  const loadDoctorFees = async () => {
    try {
      const feesRef = collection(db, "doctorFees");
      const feesSnapshot = await getDocs(feesRef);
      const feesData = {};

      feesSnapshot.docs.forEach((doc) => {
        feesData[doc.id] = parseFloat(doc.data().amount || 0);
      });

      setDoctorFees(feesData);
    } catch (error) {
      console.error("Erreur lors du chargement des tarifs:", error);
      setMessage("Erreur lors du chargement des tarifs des médecins");
    }
  };

  const loadCompletedAppointments = async () => {
    try {
      const structureId = structure?.id;
      if (!structureId) return;

      // Récupérer toutes les entrées de revenus de la structure, y compris les supprimées
      const revenuesRef = collection(db, "revenues");
      const q = query(revenuesRef, where("structureId", "==", structureId));

      const revenuesSnapshot = await getDocs(q);
      const revenuesData = revenuesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Conserver toutes les entrées, même supprimées
      setCompletedAppointments(revenuesData);
      console.log(
        `Chargé ${revenuesData.length} entrées de revenus (dont ${
          revenuesData.filter((r) => r.isDeleted).length
        } supprimées)`
      );
    } catch (error) {
      console.error("Erreur lors du chargement des revenus:", error);
      setMessage("Erreur lors du calcul des revenus");
    }
  };

  // Fonction pour obtenir le premier jour du mois
  const getStartOfMonth = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-01`;
  };

  // Fonction pour obtenir le dernier jour du mois
  const getEndOfMonth = () => {
    const today = new Date();
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${lastDay}`;
  };

  // Fonction pour enregistrer le tarif d'un médecin
  const saveDoctorFee = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !newFee) {
      setMessage("Veuillez sélectionner un médecin et saisir un tarif");
      return;
    }

    try {
      const numericFee = parseFloat(newFee) || 0;

      await setDoc(doc(db, "doctorFees", selectedDoctor.id), {
        amount: numericFee,
        doctorName: `${selectedDoctor.nom} ${selectedDoctor.prenom}`,
        specialite: selectedDoctor.specialite,
        updatedAt: new Date().toISOString(),
      });

      // Mettre à jour l'état local
      setDoctorFees((prev) => ({
        ...prev,
        [selectedDoctor.id]: numericFee,
      }));

      setMessage("Tarif enregistré avec succès");
      setNewFee("");
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du tarif:", error);
      setMessage("Erreur lors de l'enregistrement du tarif");
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    loadDoctorFees();
    loadCompletedAppointments();

    // Rafraîchir les données toutes les 5 minutes
    const intervalId = setInterval(() => {
      loadCompletedAppointments();
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [structure?.id]);

  // Fonction pour obtenir le nombre de rendez-vous terminés aujourd'hui pour un médecin
  const getCompletedAppointmentsToday = (doctorId) => {
    const today = getTodayDate();
    return completedAppointments.filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.status === "completed" &&
        (apt.completedAt ? apt.completedAt.startsWith(today) : true)
    ).length;
  };

  // Fonction pour obtenir le nombre de rendez-vous terminés cette semaine pour un médecin
  const getCompletedAppointmentsThisWeek = (doctorId) => {
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();

    return completedAppointments.filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.status === "completed" &&
        (apt.completedAt
          ? apt.completedAt >= startOfWeek && apt.completedAt <= endOfWeek
          : true)
    ).length;
  };

  // Fonction pour obtenir le nombre de rendez-vous terminés ce mois pour un médecin
  const getCompletedAppointmentsThisMonth = (doctorId) => {
    const currentMonth = getCurrentMonth();

    return completedAppointments.filter(
      (apt) =>
        apt.doctorId === doctorId &&
        apt.status === "completed" &&
        (apt.completedAt ? apt.completedAt.startsWith(currentMonth) : true)
    ).length;
  };

  const calculateDailyRevenue = (doctorId) => {
    const today = getTodayDate();
    // Utiliser les données de la collection revenues
    const doctorRevenues = completedAppointments.filter(
      (rev) =>
        rev.doctorId === doctorId &&
        rev.date.startsWith(today) &&
        !rev.isDeleted
    );

    return doctorRevenues.reduce((total, rev) => total + (rev.amount || 0), 0);
  };

  const calculateWeeklyRevenue = (doctorId) => {
    const startOfWeek = getStartOfWeek();
    const endOfWeek = getEndOfWeek();

    const doctorRevenues = completedAppointments.filter(
      (rev) =>
        rev.doctorId === doctorId &&
        rev.date >= startOfWeek &&
        rev.date <= endOfWeek &&
        !rev.isDeleted
    );

    return doctorRevenues.reduce((total, rev) => total + (rev.amount || 0), 0);
  };

  const calculateMonthlyRevenue = (doctorId) => {
    const currentMonth = getCurrentMonth();

    const doctorRevenues = completedAppointments.filter(
      (rev) =>
        rev.doctorId === doctorId &&
        rev.date.startsWith(currentMonth) &&
        !rev.isDeleted
    );

    return doctorRevenues.reduce((total, rev) => total + (rev.amount || 0), 0);
  };

  const doctorsWithFees = doctors.filter((doctor) => doctorFees[doctor.id] > 0);

  // Fonction pour calculer les totaux
  const calculateTotalRevenue = (type) => {
    const doctorsWithFees = doctors.filter(
      (doctor) => doctorFees[doctor.id] > 0
    );

    switch (type) {
      case "daily":
        return doctorsWithFees.reduce((total, doctor) => {
          return total + calculateDailyRevenue(doctor.id);
        }, 0);
      case "weekly":
        return doctorsWithFees.reduce((total, doctor) => {
          return total + calculateWeeklyRevenue(doctor.id);
        }, 0);
      case "monthly":
        return doctorsWithFees.reduce((total, doctor) => {
          return total + calculateMonthlyRevenue(doctor.id);
        }, 0);
      default:
        return 0;
    }
  };

  // Ajouter à vos effets existants
  useEffect(() => {
    if (structure?.id) {
      loadAnnouncements();
    }
  }, [structure?.id]);

  // Ajoutez cette fonction pour charger les réponses aux annonces
  const loadAnnouncementReplies = async (announcementId) => {
    try {
      // Récupérer l'annonce avec ses réponses
      const announcementRef = doc(db, "announcements", announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const announcementData = announcementDoc.data();
        // Si l'annonce a des réponses, les stocker dans l'état
        if (announcementData.responses) {
          setAnnouncementReplies({
            ...announcementReplies,
            [announcementId]: announcementData.responses,
          });
        } else {
          // Si l'annonce n'a pas de réponses, initialiser avec un tableau vide
          setAnnouncementReplies({
            ...announcementReplies,
            [announcementId]: [],
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réponses:", error);
      setMessage("Erreur lors du chargement des réponses");
    }
  };

  // Fonction pour répondre à une annonce
  const handleSubmitAnnouncementReply = async (announcementId) => {
    if (!newAnnouncementReply.trim()) return;

    try {
      setIsSubmittingReply(true);

      // Créer l'objet de réponse
      const replyData = {
        structureId: structure.id,
        structureName: structure.name,
        content: newAnnouncementReply,
        createdAt: new Date().toISOString(),
        isFromStructure: true,
        readByDoctor: false,
      };

      // Récupérer l'annonce actuelle
      const announcementRef = doc(db, "announcements", announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        // Ajouter la réponse à l'annonce
        const currentResponses = announcementDoc.data().responses || [];
        await updateDoc(announcementRef, {
          responses: [...currentResponses, replyData],
        });

        // Mettre à jour l'état local
        if (
          selectedAnnouncement &&
          selectedAnnouncement.id === announcementId
        ) {
          setSelectedAnnouncement({
            ...selectedAnnouncement,
            responses: [...(selectedAnnouncement.responses || []), replyData],
          });
        }

        if (
          selectedDoctorAnnouncement &&
          selectedDoctorAnnouncement.id === announcementId
        ) {
          setSelectedDoctorAnnouncement({
            ...selectedDoctorAnnouncement,
            responses: [
              ...(selectedDoctorAnnouncement.responses || []),
              replyData,
            ],
          });
        }

        // Réinitialiser le champ de réponse
        setNewAnnouncementReply("");
        setMessage("Votre réponse a été envoyée avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
      setMessage("Erreur lors de l'envoi de la réponse");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Ajoutez cette fonction pour supprimer une réponse
  const handleDeleteAnnouncementReply = async (announcementId, replyIndex) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette réponse ?"))
      return;

    try {
      // Récupérer l'annonce actuelle
      const announcementRef = doc(db, "announcements", announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const currentResponses = announcementDoc.data().responses || [];

        // Vérifier que la réponse existe
        if (replyIndex >= 0 && replyIndex < currentResponses.length) {
          // Supprimer la réponse
          const updatedResponses = [...currentResponses];
          updatedResponses.splice(replyIndex, 1);

          // Mettre à jour dans Firestore
          await updateDoc(announcementRef, {
            responses: updatedResponses,
          });

          // Mettre à jour l'état local
          setAnnouncementReplies({
            ...announcementReplies,
            [announcementId]: updatedResponses,
          });

          // Mettre à jour l'annonce sélectionnée si elle est affichée
          if (
            selectedAnnouncement &&
            selectedAnnouncement.id === announcementId
          ) {
            setSelectedAnnouncement({
              ...selectedAnnouncement,
              responses: updatedResponses,
            });
          }

          setMessage("Réponse supprimée avec succès");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la réponse:", error);
      setMessage("Erreur lors de la suppression de la réponse");
    }
  };

  // Modifiez la fonction viewAnnouncementDetails pour charger les réponses
  const viewAnnouncementDetails = async (announcement) => {
    setSelectedAnnouncement(announcement);
    await loadAnnouncementReplies(announcement.id);

    // Marquer toutes les réponses comme lues
    try {
      const announcementRef = doc(db, "announcements", announcement.id);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const responses = announcementDoc.data().responses || [];
        const updatedResponses = responses.map((response) => {
          if (!response.isFromStructure && !response.readByStructure) {
            return {
              ...response,
              readByStructure: true,
              readAt: new Date().toISOString(),
            };
          }
          return response;
        });

        // Mettre à jour dans Firestore seulement si des modifications ont été faites
        if (JSON.stringify(responses) !== JSON.stringify(updatedResponses)) {
          await updateDoc(announcementRef, {
            responses: updatedResponses,
          });

          // Mettre à jour l'état local
          setAnnouncementReplies((prev) => ({
            ...prev,
            [announcement.id]: updatedResponses,
          }));

          // Recalculer le nombre de réponses non lues
          const newRepliesMap = {
            ...announcementReplies,
            [announcement.id]: updatedResponses,
          };
          const newUnreadCount = countUnreadReplies(newRepliesMap);
          setUnreadAnnouncementReplies(newUnreadCount);
          setHasNewReplies(newUnreadCount > 0);
        }
      }
    } catch (error) {
      console.error("Erreur lors du marquage des réponses comme lues:", error);
    }

    setShowAnnouncementDetailsModal(true);
  };

  const markReplyAsRead = async (announcementId, replyIndex) => {
    try {
      // Récupérer l'annonce actuelle
      const announcementRef = doc(db, "announcements", announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const currentResponses = announcementDoc.data().responses || [];

        // Vérifier que la réponse existe
        if (replyIndex >= 0 && replyIndex < currentResponses.length) {
          // Marquer la réponse comme lue
          const updatedResponses = [...currentResponses];
          updatedResponses[replyIndex] = {
            ...updatedResponses[replyIndex],
            readByStructure: true,
            readAt: new Date().toISOString(),
          };

          // Mettre à jour dans Firestore
          await updateDoc(announcementRef, {
            responses: updatedResponses,
          });

          // Mettre à jour l'état local
          setAnnouncementReplies((prev) => {
            const updated = { ...prev };
            if (updated[announcementId]) {
              updated[announcementId] = updatedResponses;
            }
            return updated;
          });

          // Recalculer le nombre de réponses non lues
          const newUnreadCount = countUnreadReplies({
            ...announcementReplies,
            [announcementId]: updatedResponses,
          });
          setUnreadAnnouncementReplies(newUnreadCount);
          setHasNewReplies(newUnreadCount > 0);
        }
      }
    } catch (error) {
      console.error("Erreur lors du marquage de la réponse comme lue:", error);
    }
  };

  // Modifiez la fonction loadAnnouncements pour inclure les réponses
  const loadAnnouncements = async () => {
    try {
      // Vérifier si structure existe et a un ID
      if (!structure || !structure.id) {
        console.log(
          "Structure non définie ou sans ID, impossible de charger les annonces"
        );
        return;
      }

      const announcementsRef = collection(db, "announcements");
      const q = query(
        announcementsRef,
        where("structureId", "==", structure.id),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const announcementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        responses: doc.data().responses || [],
      }));

      setAnnouncements(announcementsData);

      // Charger les statistiques pour chaque annonce
      const statsPromises = announcementsData.map(async (announcement) => {
        const readsRef = collection(db, "announcementReads");
        const readsQuery = query(
          readsRef,
          where("announcementId", "==", announcement.id)
        );
        const readsSnapshot = await getDocs(readsQuery);

        return {
          announcementId: announcement.id,
          readCount: readsSnapshot.size,
          readers: readsSnapshot.docs.map((doc) => doc.data().doctorId),
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};
      statsResults.forEach((stat) => {
        statsMap[stat.announcementId] = {
          readCount: stat.readCount,
          readers: stat.readers,
        };
      });

      setAnnouncementStats(statsMap);

      // Initialiser les réponses pour chaque annonce
      const repliesMap = {};
      announcementsData.forEach((announcement) => {
        repliesMap[announcement.id] = announcement.responses || [];
      });
      setAnnouncementReplies(repliesMap);
    } catch (error) {
      console.error("Erreur lors du chargement des annonces:", error);
      setMessage("Erreur lors du chargement des annonces");
    }
  };

  useEffect(() => {
    // Initialiser les réponses pour chaque annonce et compter les non lues
    const repliesMap = {};
    let totalUnread = 0;

    announcements.forEach((announcement) => {
      const replies = announcement.responses || [];
      repliesMap[announcement.id] = replies;

      // Compter les réponses non lues
      const unreadReplies = replies.filter(
        (reply) => !reply.isFromStructure && !reply.readByStructure
      );
      totalUnread += unreadReplies.length;
    });

    setAnnouncementReplies(repliesMap);
    setUnreadAnnouncementReplies(totalUnread);
    setHasNewReplies(totalUnread > 0);
  }, [announcements]); // Dépendance à announcements

  // Créer une nouvelle annonce
  const handleAddAnnouncement = async () => {
    try {
      if (!structure || !structure.id) {
        setMessage("Erreur: Informations de la structure non disponibles");
        return;
      }
      // Validation
      if (!newAnnouncement.title || !newAnnouncement.content) {
        setMessage("Veuillez remplir le titre et le contenu de l'annonce");
        return;
      }

      // Télécharger les pièces jointes
      const attachmentUrls = await Promise.all(
        attachmentFiles.map(async (file) => {
          const fileRef = ref(
            storage,
            `announcements/${structure.id}/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        })
      );

      // Préparer les données de l'annonce
      const announcementData = {
        ...newAnnouncement,
        attachments: attachmentUrls,
        structureId: structure.id,
        structureName: structure.name,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.uid,
        creatorName: structure.name,
        status: "active",
        expiryDate: newAnnouncement.expiryDate || null,
      };

      // Ajouter l'annonce à Firestore
      const docRef = await addDoc(
        collection(db, "announcements"),
        announcementData
      );

      // Créer des notifications pour les médecins ciblés
      let targetDoctors = [];

      if (newAnnouncement.targetAudience === "all") {
        // Récupérer tous les médecins de la base de données
        const allDoctorsQuery = query(collection(db, "medecins"));
        const allDoctorsSnapshot = await getDocs(allDoctorsQuery);
        targetDoctors = allDoctorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else if (newAnnouncement.targetAudience === "affiliated") {
        // Uniquement les médecins affiliés à cette structure
        targetDoctors = doctors;
      } else if (newAnnouncement.targetAudience === "specialty") {
        // Médecins avec les spécialités sélectionnées
        const specialtiesQuery = query(
          collection(db, "medecins"),
          where(
            "specialite",
            "array-contains-any",
            newAnnouncement.selectedSpecialties
          )
        );
        const specialtiesSnapshot = await getDocs(specialtiesQuery);
        targetDoctors = specialtiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      // Créer des notifications pour chaque médecin ciblé
      const batch = writeBatch(db);
      targetDoctors.forEach((doctor) => {
        const notificationRef = doc(collection(db, "notifications"));
        batch.set(notificationRef, {
          userId: doctor.uid,
          type: "announcement",
          title: `Nouvelle annonce: ${newAnnouncement.title}`,
          message: `${structure.name} a publié une nouvelle annonce: ${newAnnouncement.title}`,
          announcementId: docRef.id,
          structureId: structure.id,
          structureName: structure.name,
          priority: newAnnouncement.priority,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });

      await batch.commit();

      // Réinitialiser le formulaire et fermer la modale
      setNewAnnouncement({
        title: "",
        content: "",
        priority: "normal",
        targetAudience: "all",
        selectedSpecialties: [],
        expiryDate: "",
        attachments: [],
      });
      setAttachmentFiles([]);
      setShowAddAnnouncementModal(false);

      // Recharger les annonces
      await loadAnnouncements();

      setMessage(`Annonce créée et envoyée à ${targetDoctors.length} médecins`);
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce:", error);
      setMessage("Erreur lors de la création de l'annonce");
    }
  };

  // Supprimer une annonce
  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      try {
        // Supprimer l'annonce
        await deleteDoc(doc(db, "announcements", announcementId));

        // Supprimer les notifications associées
        const notificationsQuery = query(
          collection(db, "notifications"),
          where("announcementId", "==", announcementId)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);

        const batch = writeBatch(db);
        notificationsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Supprimer les statistiques de lecture
        const readsQuery = query(
          collection(db, "announcementReads"),
          where("announcementId", "==", announcementId)
        );
        const readsSnapshot = await getDocs(readsQuery);

        readsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        // Mettre à jour l'état local
        setAnnouncements(announcements.filter((a) => a.id !== announcementId));
        setMessage("Annonce supprimée avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression de l'annonce:", error);
        setMessage("Erreur lors de la suppression de l'annonce");
      }
    }
  };

  // Modifier une annonce
  const handleEditAnnouncement = async () => {
    try {
      if (!editingAnnouncement.title || !editingAnnouncement.content) {
        setMessage("Veuillez remplir le titre et le contenu de l'annonce");
        return;
      }

      // Télécharger les nouvelles pièces jointes
      const newAttachmentUrls = await Promise.all(
        attachmentFiles.map(async (file) => {
          const fileRef = ref(
            storage,
            `announcements/${structure.id}/${Date.now()}_${file.name}`
          );
          await uploadBytes(fileRef, file);
          return getDownloadURL(fileRef);
        })
      );

      // Combiner avec les pièces jointes existantes
      const updatedAttachments = [
        ...(editingAnnouncement.attachments || []),
        ...newAttachmentUrls,
      ];

      // Mettre à jour l'annonce
      await updateDoc(doc(db, "announcements", editingAnnouncement.id), {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        priority: editingAnnouncement.priority,
        targetAudience: editingAnnouncement.targetAudience,
        selectedSpecialties: editingAnnouncement.selectedSpecialties,
        expiryDate: editingAnnouncement.expiryDate,
        attachments: updatedAttachments,
        updatedAt: new Date().toISOString(),
      });

      // Réinitialiser et fermer la modale
      setEditingAnnouncement(null);
      setAttachmentFiles([]);
      setShowAddAnnouncementModal(false);

      // Recharger les annonces
      await loadAnnouncements();

      setMessage("Annonce modifiée avec succès");
    } catch (error) {
      console.error("Erreur lors de la modification de l'annonce:", error);
      setMessage("Erreur lors de la modification de l'annonce");
    }
  };

  // Configuration EmailJS

  const EMAIL_SERVICE_ID = "service_g89ryqp";
  const EMAIL_TEMPLATE_ID = "template_1l42jc8";
  const EMAIL_PUBLIC_KEY = "MCVx8ryDmfsqT_R_P";

  // Charger les patients de la structure
  const loadPatients = async () => {
    try {
      const patientsRef = collection(db, "patients");
      const q = query(
        patientsRef,
        where("structureId", "==", structure.id),
        orderBy("lastName"),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const patientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPatients(patientsData);
    } catch (error) {
      console.error("Erreur lors du chargement des patients:", error);
    }
  };

  // Sélectionner un patient
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPhoneNumber(patient.phoneNumber || "");
    setShowPatientSelector(false);
  };

  // Filtrer les patients selon le terme de recherche
  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName || ""} ${
      patient.lastName || ""
    }`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber || "").includes(searchTerm)
    );
  });

  // Initialisation
  useEffect(() => {
    // Initialiser EmailJS
    emailjs.init(EMAIL_PUBLIC_KEY);

    // Charger les patients si une structure est sélectionnée
    if (structure?.id) {
      loadPatients();
    }
  }, [structure?.id]);

  const determineGateway = (phoneNumber) => {
    // Nettoyez le numéro
    const cleanNumber = phoneNumber.replace(/\+|\s|-/g, "");

    // Pour Orange Sénégal
    if (
      cleanNumber.startsWith("22177") ||
      cleanNumber.startsWith("77") ||
      cleanNumber.startsWith("22178") ||
      cleanNumber.startsWith("78")
    ) {
      return "sms.orange.sn";
    }
    // Pour Free Sénégal
    else if (cleanNumber.startsWith("22176") || cleanNumber.startsWith("76")) {
      return "sms.free.sn";
    }
    // Pour Expresso Sénégal
    else if (cleanNumber.startsWith("22170") || cleanNumber.startsWith("70")) {
      return "sms.expresso.sn";
    }

    // Passerelle par défaut (Orange)
    return "sms.orange.sn";
  };

  const sendSmsViaEmail = async (phoneNumber, message) => {
    try {
      // Nettoyez le numéro (supprimez les espaces, tirets, etc.)
      const cleanNumber = phoneNumber.replace(/\+|\s|-/g, "");

      // Déterminez la passerelle
      const gateway = determineGateway(phoneNumber);

      // Préparez les paramètres pour EmailJS - C'EST CETTE PARTIE QUI EST CRUCIALE
      const templateParams = {
        to_email: `${cleanNumber}@${gateway}`, // Format correct: numeroTel@passerelle
        message_body: message,
      };

      // Envoyez l'email
      const response = await emailjs.send(
        EMAIL_SERVICE_ID,
        EMAIL_TEMPLATE_ID,
        templateParams,
        EMAIL_PUBLIC_KEY
      );

      console.log("Email envoyé avec succès:", response);
      return { success: true, response };
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS via email:", error);
      return { success: false, error };
    }
  };

  const sendSms = async () => {
    // Validation du numéro de téléphone
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      alert("Veuillez saisir un numéro de téléphone valide");
      return;
    }

    // Validation du message
    if (!smsMessage.trim()) {
      alert("Veuillez saisir un message");
      return;
    }

    try {
      setIsSendingSms(true);

      // Envoi du SMS via EmailJS
      const result = await sendSmsViaEmail(phoneNumber, smsMessage);

      if (result.success) {
        // Enregistrement dans Firestore si vous utilisez Firebase
        if (db) {
          await addDoc(collection(db, "smsHistory"), {
            structureId: structure?.id,
            phoneNumber: phoneNumber,
            message: smsMessage,
            sentAt: new Date().toISOString(),
            status: "sent",
          });
        }

        alert(`SMS envoyé au numéro ${phoneNumber}`);
        setSmsMessage(""); // Réinitialiser le message
      } else {
        alert("Erreur lors de l'envoi du SMS. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS:", error);
      alert("Erreur lors de l'envoi du SMS");
    } finally {
      setIsSendingSms(false);
    }
  };

  // Fonction pour supprimer un rendez-vous rapide
  const handleDeleteQuickAppointment = async (appointmentId) => {
    try {
      if (
        window.confirm(
          "Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?"
        )
      ) {
        // Supprimer le document de la collection appointments
        await deleteDoc(doc(db, "appointments", appointmentId));

        // Mettre à jour l'état local pour refléter la suppression
        setQuickAppointments((prevAppointments) =>
          prevAppointments.filter(
            (appointment) => appointment.id !== appointmentId
          )
        );

        // Fermer la modale de détails si elle est ouverte
        setShowQuickAppointmentDetails(false);

        // Afficher un message de confirmation
        setMessage("Rendez-vous supprimé avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du rendez-vous:", error);
      setMessage("Erreur lors de la suppression du rendez-vous");
    }
  };


  const sendWhatsAppMessage = (phoneNumber, message) => {
    // Nettoyer le numéro de téléphone (supprimer espaces, tirets, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    
    // Vérifier si le numéro commence par "+" ou par un chiffre local
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : 
                           cleanPhone.startsWith("221") ? "+" + cleanPhone : 
                           "+221" + cleanPhone;
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    
    // Créer le lien WhatsApp
    const whatsappLink = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    // Ouvrir le lien dans un nouvel onglet
    window.open(whatsappLink, '_blank');
    
    // Enregistrer dans l'historique
    try {
      addDoc(collection(db, "whatsappHistory"), {
        phoneNumber: formattedPhone,
        message: message,
        sentAt: new Date().toISOString(),
        structureId: structure?.id,
        status: "sent"
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du message WhatsApp:", error);
    }
  };

  
  const generateTemplateMessage = (template, data) => {
    let message = template;
    
    // Remplacer les variables pour les médecins ou les patients
    Object.keys(data).forEach(key => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), data[key] || '');
    });
    
    // Ajouter les variables de la structure
    message = message.replace(/{structureName}/g, structure?.name || '');
    message = message.replace(/{structureTel}/g, structure?.phones?.mobile || structure?.phones?.landline || '');
    
    return message;
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
                variant={viewMode === "both" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("both");
                  setShowCalendarView(false);
                }}
                className="px-4 py-2 fw-semibold"
              >
                <i className="fas fa-th-large me-2"></i>
                Tous
              </Button>

              <Button
                variant={
                  viewMode === "annonces" || viewMode === "doctorAnnouncements"
                    ? "primary"
                    : "light"
                }
                onClick={() => {
                  setShowAnnouncementsModal(true);
                }}
                className="px-4 py-2 fw-semibold position-relative"
              >
                <i className="fas fa-bullhorn me-2"></i>
                Annonces
                {(hasNewReplies ||
                  doctorAnnouncements.filter((a) => !a.read).length > 0) && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.6rem", padding: "0.25rem 0.4rem" }}
                  >
                    {unreadAnnouncementReplies +
                      doctorAnnouncements.filter((a) => !a.read).length}
                  </Badge>
                )}
              </Button>

              <Modal
                show={showAnnouncementsModal}
                onHide={() => setShowAnnouncementsModal(false)}
                size="sm"
                aria-labelledby="announcements-modal"
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title id="announcements-modal">Annonces</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setViewMode("annonces");
                        setShowRevenueSection(false);
                        setShowAnnouncementsModal(false);
                        setShowCalendarView(false);
                      }}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <i className="fas fa-bullhorn me-2"></i>
                        Annonces de la structure
                      </div>
                      {hasNewReplies > 0 && (
                        <Badge bg="danger" pill>
                          {unreadAnnouncementReplies}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setViewMode("doctorAnnouncements");
                        setShowDoctorAnnouncementsModal(true);
                        setShowAnnouncementsModal(false);
                        setShowCalendarView(true);
                      }}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <i className="fas fa-user-md me-2"></i>
                        Annonces des médecins
                      </div>
                      {doctorAnnouncements.filter((a) => !a.read).length >
                        0 && (
                        <Badge bg="danger" pill>
                          {doctorAnnouncements.filter((a) => !a.read).length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </Modal.Body>
              </Modal>

              <Button
                variant={viewMode === "doctors" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("doctors");
                  setShowCalendarView(false);
                }}
                className="px-4 py-2 fw-semibold"
              >
                <i className="fas fa-user-md me-2"></i>
                Médecins
              </Button>
              <Button
                variant={viewMode === "patients" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("patients");
                  setShowCalendarView(false);
                }}
                className="px-4 py-2 fw-semibold"
              >
                <i className="fas fa-users me-2"></i>
                Patients
              </Button>

              <Button
                variant={viewMode === "gestions" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("gestions");
                  setShowCalendarView(false);
                  setShowRevenueSection(!showRevenueSection);

                }}
                className=" fw-semibold"
              >
                Gestions
              </Button>
              <Button
                variant={viewMode === "sms" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("sms");
                  setShowCalendarView(false);
                }}
                className="px-4 py-2 fw-semibold"
              >
                <i className="fas fa-users me-2"></i>
                SmS
              </Button>
              <Button
                variant={viewMode === "quickAppointments" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("quickAppointments");
                  setShowCalendarView(false);
                  setShowQuickAppointmentSection(true);
                }}
                className="px-4 py-2 fw-semibold position-relative"
              >
                <i className="fas fa-calendar-check me-2"></i>
                Rv
                {quickAppointmentRequests.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.6rem", padding: "0.25rem 0.4rem" }}
                  >
                    {quickAppointmentRequests.length}
                  </Badge>
                )}
              </Button>
            </ButtonGroup>

            {calendarButton}

            <div className="ms-3 d-flex gap-2">
              {patientRequests.length > 0 && (
                <Badge
                  bg="info"
                  pill
                  className="d-flex align-items-center px-3 py-2"
                >
                  <i className="fas fa-user-plus me-2"></i>
                  {patientRequests.length} demande(s) d'affiliation
                </Badge>
              )}
              {consultationRequests.length > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="d-flex align-items-center px-3 py-2"
                >
                  <i className="fas fa-stethoscope me-2"></i>
                  {consultationRequests.length} demande(s) de consultation
                </Badge>
              )}
              {appointmentRequests.length > 0 && (
                <Badge
                  bg="primary"
                  pill
                  className="d-flex align-items-center px-3 py-2"
                >
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
              className="btn shadow-sm"
              onClick={() => {
                setShowSettingsModal(true);
                setShowMenuSidebar(false);
                setShowProfileSidebar(false);
                setShowCalendarView(false);
              }}
            >
              <i className="fas fa-hospital me-2">Profil</i>
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
        <Offcanvas
          show={showMenuSidebar}
          onHide={() => setShowMenuSidebar(false)}
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menu Navigation</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="d-flex flex-column gap-2">
              <Button
                variant={viewMode === "both" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("both");
                  setShowMenuSidebar(false);
                  setShowCalendarView(false);
                }}
                className="w-100 text-start"
              >
                <i className="fas fa-th-large me-2"></i>
                Tous
              </Button>
              <Button
                variant={
                  viewMode === "annonces" || viewMode === "doctorAnnouncements"
                    ? "primary"
                    : "light"
                }
                onClick={() => setShowAnnouncementsModal(true)}
                className="px-4 py-2 fw-semibold position-relative"
              >
                <i className="fas fa-bullhorn me-2"></i>
                Annonces
                {(hasNewReplies ||
                  doctorAnnouncements.filter((a) => !a.read).length > 0) && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.6rem", padding: "0.25rem 0.4rem" }}
                  >
                    {unreadAnnouncementReplies +
                      doctorAnnouncements.filter((a) => !a.read).length}
                  </Badge>
                )}
              </Button>

              <Modal
                show={showAnnouncementsModal}
                onHide={() => setShowAnnouncementsModal(false)}
                size="sm"
                aria-labelledby="announcements-modal"
                centered
              >
                <Modal.Header closeButton>
                  <Modal.Title id="announcements-modal">Annonces</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div className="d-grid gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setViewMode("annonces");
                        setShowRevenueSection(false);
                        setShowAnnouncementsModal(false);
                        setShowCalendarView(false);
                      }}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <i className="fas fa-bullhorn me-2"></i>
                        Annonces de la structure
                      </div>
                      {hasNewReplies > 0 && (
                        <Badge bg="danger" pill>
                          {unreadAnnouncementReplies}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setViewMode("doctorAnnouncements");
                        setShowDoctorAnnouncementsModal(true);
                        setShowAnnouncementsModal(false);
                        setShowCalendarView(true);
                      }}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <i className="fas fa-user-md me-2"></i>
                        Annonces des médecins
                      </div>
                      {doctorAnnouncements.filter((a) => !a.read).length >
                        0 && (
                        <Badge bg="danger" pill>
                          {doctorAnnouncements.filter((a) => !a.read).length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </Modal.Body>
              </Modal>

              <Button
                variant={viewMode === "doctors" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("doctors");
                  setShowMenuSidebar(false);
                  setShowCalendarView(false);
                }}
                className="w-100 text-start"
              >
                <i className="fas fa-user-md me-2"></i>
                Médecins
              </Button>
              <Button
                variant={viewMode === "patients" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("patients");
                  setShowMenuSidebar(false);
                  setShowCalendarView(false);
                }}
                className="w-100 text-start"
              >
                <i className="fas fa-users me-2"></i>
                Patients
              </Button>
              <Button
                variant={viewMode === "gestions" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("gestions");
                  setShowMenuSidebar(false);
                  setShowCalendarView(false);
                  setShowRevenueSection(!showRevenueSection);
                }}
                className="w-100 text-start"
              >
                Gestions
              </Button>
              <Button
                variant={viewMode === "pasnstients" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("sms");
                  setShowMenuSidebar(false);
                  setShowCalendarView(false);
                }}
                className="w-100 text-start"
              >
                SmS
              </Button>
              <Button
                variant={viewMode === "quickAppointments" ? "primary" : "light"}
                onClick={() => {
                  setViewMode("quickAppointments");
                  setShowCalendarView(false);
                  setShowQuickAppointmentSection(true);
                }}
                className="px-4 py-2 fw-semibold position-relative"
              >
                <i className="fas fa-calendar-check me-2"></i>
                RDV Rapides
                {quickAppointmentRequests.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: "0.6rem", padding: "0.25rem 0.4rem" }}
                  >
                    {quickAppointmentRequests.length}
                  </Badge>
                )}
              </Button>

              <div className="ms-3 d-flex gap-2">
                {patientRequests.length > 0 && (
                  <Badge
                    bg="info"
                    pill
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    {patientRequests.length} demande(s) d'affiliation
                  </Badge>
                )}
                {consultationRequests.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="fas fa-stethoscope me-2"></i>
                    {consultationRequests.length} demande(s) de consultation
                  </Badge>
                )}
                {appointmentRequests.length > 0 && (
                  <Badge
                    bg="primary"
                    pill
                    className="d-flex align-items-center px-3 py-2"
                  >
                    <i className="fas fa-calendar-alt me-2"></i>
                    {appointmentRequests.length} demande(s) de RDV
                  </Badge>
                )}
              </div>

              <hr />
              <div className="d-flex gap-2 mb-2">{calendarButton}</div>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Profile Sidebar */}
        <Offcanvas
          show={showProfileSidebar}
          onHide={() => setShowProfileSidebar(false)}
          placement="end"
        >
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
              {patientRequests.map((request) => (
                <ListGroup.Item key={request.id} className="p-3">
                  <Row className="align-items-center">
                    <Col md={2} className="text-center mb-3 mb-md-0">
                      {request.patientInfo.photoURL ? (
                        <img
                          src={request.patientInfo.photoURL}
                          alt={request.patientInfo.nom}
                          className="rounded-circle"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="avatar-placeholder rounded-circle bg-light d-flex align-items-center justify-content-center"
                          style={{ width: "60px", height: "60px" }}
                        >
                          <i className="fas fa-user fa-2x text-secondary"></i>
                        </div>
                      )}
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-1">
                        {request.patientInfo.nom} {request.patientInfo.prenom}
                      </h6>
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
                      {request.patientInfo.insurances &&
                        request.patientInfo.insurances.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">Assurances:</small>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {request.patientInfo.insurances.map(
                                (insurance, idx) => (
                                  <span
                                    key={idx}
                                    className="badge bg-light text-dark"
                                  >
                                    {insurance}
                                  </span>
                                )
                              )}
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
                          onClick={() =>
                            handlePatientRequest(
                              request.id,
                              request.patientInfo,
                              true
                            )
                          }
                        >
                          <i className="fas fa-check me-1"></i>
                          Accepter
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="rounded-pill mb-2"
                          onClick={() => viewRequestDetails(request, "patient")}
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
                        Demande reçue le{" "}
                        {new Date(
                          request.requestDate?.toDate()
                        ).toLocaleDateString()}
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
              {consultationRequests.map((request) => (
                <ListGroup.Item key={request.id} className="p-3">
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6 className="mb-1">
                        <i className="fas fa-user me-2"></i>
                        {request.patientName || "Patient"}
                      </h6>
                      <p className="mb-1 text-muted small">
                        <i className="fas fa-calendar-alt me-1"></i>
                        Date souhaitée:{" "}
                        {request.preferredDate
                          ? typeof request.preferredDate.toDate === "function"
                            ? new Date(
                                request.preferredDate.toDate()
                              ).toLocaleDateString()
                            : new Date(
                                request.preferredDate
                              ).toLocaleDateString()
                          : "Non spécifiée"}
                      </p>
                      <p className="mb-0 text-muted small">
                        <i className="fas fa-comment me-1"></i>
                        Motif: {request.reason || "Non spécifié"}
                      </p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1">
                        <i className="fas fa-user-md me-1"></i>
                        <strong>Médecin:</strong>{" "}
                        {request.doctorName || "Non spécifié"}
                      </p>
                      <p className="mb-0">
                        <i className="fas fa-clock me-1"></i>
                        <strong>Demandé le:</strong>{" "}
                        {request.requestDate
                          ? typeof request.requestDate.toDate === "function"
                            ? new Date(
                                request.requestDate.toDate()
                              ).toLocaleDateString()
                            : new Date(request.requestDate).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </p>
                    </Col>
                    <Col md={3} className="text-end">
                      <div className="d-flex flex-column gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          className="rounded-pill"
                          onClick={() =>
                            handleConsultationRequest(request.id, true)
                          }
                        >
                          <i className="fas fa-check me-1"></i>
                          Accepter
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="rounded-pill mb-2"
                          onClick={() =>
                            viewRequestDetails(request, "consultation")
                          }
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
              {appointmentRequests.map((request) => (
                <ListGroup.Item key={request.id} className="p-3">
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6 className="mb-1">
                        <i className="fas fa-user me-2"></i>
                        {request.patientInfo?.nom
                          ? `${request.patientInfo.nom} ${
                              request.patientInfo.prenom || ""
                            }`
                          : request.patientName || "Patient"}
                      </h6>
                      <p className="mb-1 text-muted small">
                        <i className="fas fa-calendar-day me-1"></i>
                        Jours préférés:{" "}
                        {request.requestText?.includes("Jours préférés")
                          ? request.requestText
                              .split("Jours préférés:")[1]
                              ?.split("\n")[0]
                          : "Non spécifié"}
                      </p>
                      <p className="mb-0 text-muted small">
                        <i className="fas fa-clock me-1"></i>
                        Horaires:{" "}
                        {request.requestText?.includes("Horaires préférés")
                          ? request.requestText
                              .split("Horaires préférés:")[1]
                              ?.split("\n")[0]
                          : "Non spécifié"}
                      </p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1">
                        <i className="fas fa-stethoscope me-1"></i>
                        <strong>Spécialité:</strong>{" "}
                        {request.specialty || "Non spécifiée"}
                      </p>
                      <p className="mb-0">
                        <i className="fas fa-clock me-1"></i>
                        <strong>Demandé le:</strong>{" "}
                        {request.requestDate
                          ? typeof request.requestDate.toDate === "function"
                            ? new Date(
                                request.requestDate.toDate()
                              ).toLocaleDateString()
                            : new Date(request.requestDate).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </p>
                    </Col>
                    <Col md={3} className="text-end">
                      <div className="d-flex flex-column gap-2">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="rounded-pill mb-2"
                          onClick={() =>
                            viewRequestDetails(request, "appointment")
                          }
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
            {associationRequests.map((request) => (
              <div
                key={request.id}
                className="d-flex justify-content-between align-items-center mb-3"
              >
                <div>
                  <h6>
                    Dr. {request.doctorInfo.nom} {request.doctorInfo.prenom}
                  </h6>
                  <p className="text-muted mb-0">
                    {request.doctorInfo.specialite}
                  </p>
                </div>
                <div>
                  <Button
                    variant="success"
                    className="me-2"
                    onClick={() =>
                      handleAssociationResponse(
                        request.id,
                        request.doctorId,
                        true
                      )
                    }
                  >
                    Accepter
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      handleAssociationResponse(
                        request.id,
                        request.doctorId,
                        false
                      )
                    }
                  >
                    Refuser
                  </Button>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Section d'envoi de SMS */}
      {(viewMode === "both" || viewMode === "sms") && (
        <Card className="mb-4 shadow-lg">
          <Card.Header className="bg-gradient bg-primary text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-sms me-2"></i>
                Envoi de SMS
              </h5>
              <Button
                variant="light"
                size="sm"
                className="rounded-pill px-3"
                onClick={() => {
                  loadSmsHistory();
                  setShowSmsHistoryModal(true);
                }}
              >
                <i className="fas fa-history me-2"></i>
                Historique
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Form>
              {/* Affichage du patient sélectionné */}
              {selectedPatient && (
                <div className="mb-3 p-3 border rounded bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">Patient sélectionné:</h6>
                      <p className="mb-0 fw-bold">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <small className="text-muted">
                        {selectedPatient.phoneNumber}
                      </small>
                    </div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPhoneNumber("");
                      }}
                    >
                      <i className="fas fa-times"></i> Changer
                    </Button>
                  </div>
                </div>
              )}

              {/* Sélection du numéro de téléphone */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-phone me-2"></i>
                  Numéro de téléphone
                </Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: +221xxxxxxxxx"
                    className="rounded-start"
                  />
                  <Button
                    variant="outline-primary"
                    className="rounded-end"
                    onClick={() => {
                      setShowPatientSelector(true);
                      setSearchTerm("");
                    }}
                  >
                    <i className="fas fa-user-plus"></i>
                  </Button>
                </div>
                <Form.Text className="text-muted">
                  Entrez le numéro avec l'indicatif du pays ou sélectionnez un
                  patient
                </Form.Text>
              </Form.Group>

              {/* Saisie du message */}
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="fas fa-comment me-2"></i>
                  Message
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Saisissez votre message ici..."
                  className="rounded"
                  maxLength={160}
                />
                <div className="d-flex justify-content-between mt-2">
                  <Form.Text className="text-muted">
                    Maximum 160 caractères par SMS
                  </Form.Text>
                  <span
                    className={
                      smsMessage.length > 150 ? "text-danger" : "text-muted"
                    }
                  >
                    {smsMessage.length}/160 caractères
                  </span>
                </div>
              </Form.Group>

              {/* Modèles de messages prédéfinis */}
              <div className="mb-4">
                <p className="mb-2 fw-bold">
                  <i className="fas fa-bookmark me-2"></i>
                  Messages rapides:
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() =>
                      setSmsMessage(
                        `Bonjour, nous vous rappelons votre rendez-vous à ${structure.name} demain. Merci de confirmer votre présence.`
                      )
                    }
                  >
                    Rappel RDV
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() =>
                      setSmsMessage(
                        `Bonjour, vos résultats sont disponibles. Vous pouvez passer les récupérer à ${structure.name}.`
                      )
                    }
                  >
                    Résultats disponibles
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() =>
                      setSmsMessage(
                        `Bonjour, merci de votre visite à ${structure.name}. N'hésitez pas à nous contacter pour toute question.`
                      )
                    }
                  >
                    Remerciement
                  </Button>
                </div>
              </div>

              {/* Bouton d'envoi */}
              <div className="text-center mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={sendSms}
                  disabled={
                    isSendingSms || !phoneNumber.trim() || !smsMessage.trim()
                  }
                  className="rounded-pill px-5"
                >
                  {isSendingSms ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Envoyer le SMS
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour sélectionner un patient */}
      <Modal
        show={showPatientSelector}
        onHide={() => setShowPatientSelector(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-users me-2"></i>
            Sélectionner un patient
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Rechercher un patient par nom ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </Form.Group>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {filteredPatients.length > 0 ? (
              <ListGroup>
                {filteredPatients.map((patient) => (
                  <ListGroup.Item
                    key={patient.id}
                    action
                    onClick={() => selectPatient(patient)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <h6 className="mb-0">
                        {patient.firstName} {patient.lastName}
                      </h6>
                      {patient.phoneNumber ? (
                        <small className="text-muted">
                          {patient.phoneNumber}
                        </small>
                      ) : (
                        <small className="text-danger">
                          Pas de numéro enregistré
                        </small>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!patient.phoneNumber}
                    >
                      <i className="fas fa-check me-1"></i> Sélectionner
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-4">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <p className="text-muted">Aucun patient trouvé</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPatientSelector(false)}
          >
            Annuler
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Section des rendez-vous rapides */}
      {(viewMode === "both" || viewMode === "quickAppointments") && (
        <Card className="mb-4 shadow-lg">
          <Card.Header className="bg-gradient bg-success text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-calendar-check me-2"></i>
                Rendez-vous Rapides
              </h5>
              <p className="mt-1 d-block text-white">
                {new Date()
                  .toLocaleString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })
                  .replace("à", "à")}
              </p>
              {/*
        <Button
          variant="light"
          size="sm"
          className="rounded-pill px-3"
          onClick={loadQuickAppointments}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Actualiser
        </Button>
        */}
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="p-3 bg-light border-bottom">
              <Row className="align-items-center">
                <Col md={6}>
                  <Form.Control
                    type="text"
                    placeholder="Rechercher par nom, email, téléphone, service ou code d'accès..."
                    value={quickAppointmentSearchQuery}
                    onChange={(e) =>
                      setQuickAppointmentSearchQuery(e.target.value)
                    }
                    className="rounded-pill"
                  />
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-end">
                    <ButtonGroup>
                      <Button
                        variant={
                          quickAppointmentFilter === "all"
                            ? "success"
                            : "outline-success"
                        }
                        onClick={() => setQuickAppointmentFilter("all")}
                      >
                        Tous
                      </Button>
                      <Button
                        variant={
                          quickAppointmentFilter === "pending"
                            ? "warning"
                            : "outline-warning"
                        }
                        onClick={() => setQuickAppointmentFilter("pending")}
                      >
                        <i className="fas fa-clock me-1"></i>
                        En attente
                      </Button>
                      <Button
                        variant={
                          quickAppointmentFilter === "confirmed"
                            ? "primary"
                            : "outline-primary"
                        }
                        onClick={() => setQuickAppointmentFilter("confirmed")}
                      >
                        <i className="fas fa-check me-1"></i>
                        Confirmés
                      </Button>
                      <Button
                        variant={
                          quickAppointmentFilter === "rejected"
                            ? "danger"
                            : "outline-danger"
                        }
                        onClick={() => setQuickAppointmentFilter("rejected")}
                      >
                        <i className="fas fa-times me-1"></i>
                        Refusés
                      </Button>
                    </ButtonGroup>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="quick-appointments-list">
              {getFilteredQuickAppointments().length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover table-striped mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Patient</th>
                        <th>Service</th>
                        <th>Date/Heure</th>
                        <th>Statut</th>
                        <th>Code</th>
                        <th>Créé le</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredQuickAppointments().map((appointment) => (
                        <tr
                          key={appointment.id}
                          className={`appointment-row status-${appointment.status}`}
                        >
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold">
                                {appointment.patientName}
                              </span>
                              <small className="text-muted">
                                {appointment.patientEmail}
                              </small>
                            </div>
                          </td>
                          <td>{appointment.service}</td>
                          <td>
                            <div className="d-flex flex-column">
                              <span>
                                {new Date(
                                  appointment.appointmentDate
                                ).toLocaleDateString()}
                              </span>
                              <small className="text-muted">
                                {appointment.appointmentTime}
                              </small>
                            </div>
                          </td>
                          <td>
                            <Badge
                              bg={
                                appointment.status === "pending"
                                  ? "warning"
                                  : appointment.status === "confirmed"
                                  ? "success"
                                  : appointment.status === "rejected"
                                  ? "danger"
                                  : "secondary"
                              }
                              className="status-badge"
                            >
                              {appointment.status === "pending" && (
                                <i className="fas fa-clock me-1"></i>
                              )}
                              {appointment.status === "confirmed" && (
                                <i className="fas fa-check me-1"></i>
                              )}
                              {appointment.status === "rejected" && (
                                <i className="fas fa-times me-1"></i>
                              )}
                              {appointment.status === "pending"
                                ? "En attente"
                                : appointment.status === "confirmed"
                                ? "Confirmé"
                                : appointment.status === "rejected"
                                ? "Refusé"
                                : "Inconnu"}
                            </Badge>
                          </td>
                          <td>
                            <span className="access-code">
                              {appointment.accessCode}
                            </span>
                          </td>
                          <td>
                            {appointment.createdAtDate
                              ? appointment.createdAtDate.toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="btn-icon"
                                onClick={() => {
                                  setSelectedQuickAppointment(appointment);
                                  setQuickAppointmentResponse(
                                    appointment.response || ""
                                  );
                                  setShowQuickAppointmentDetails(true);
                                }}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>

                              {appointment.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="btn-icon"
                                    onClick={() => {
                                      setSelectedQuickAppointment(appointment);
                                      setQuickAppointmentResponse(
                                        "Votre demande de rendez-vous a été acceptée."
                                      );
                                      setShowQuickAppointmentDetails(true);
                                    }}
                                  >
                                    <i className="fas fa-check"></i>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="btn-icon"
                                    onClick={() => {
                                      setSelectedQuickAppointment(appointment);
                                      setQuickAppointmentResponse(
                                        "Votre demande de rendez-vous a été refusée."
                                      );
                                      setShowQuickAppointmentDetails(true);
                                    }}
                                  >
                                    <i className="fas fa-times"></i>
                                  </Button>
                                </>
                              )}

                              {(appointment.status === "confirmed" ||
                                appointment.status === "rejected") && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="btn-icon"
                                  onClick={() =>
                                    handleDeleteQuickAppointment(appointment.id)
                                  }
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h6 className="text-muted">
                    Aucun rendez-vous rapide trouvé
                  </h6>
                  <p className="text-muted">
                    {quickAppointmentSearchQuery
                      ? "Aucun résultat pour cette recherche"
                      : quickAppointmentFilter !== "all"
                      ? `Aucun rendez-vous avec le statut "${quickAppointmentFilter}"`
                      : "Aucun rendez-vous rapide n'a été demandé"}
                  </p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Section des annonces */}
      {(viewMode === "both" || viewMode === "annonces") && (
        <Card className="mb-4 shadow-lg">
          <Card.Header className="bg-gradient bg-info text-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-bullhorn me-2"></i>
                Annonces aux médecins
              </h5>
              <Button
                variant="light"
                size="sm"
                className="rounded-pill px-3"
                onClick={() => setShowAddAnnouncementModal(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Nouvelle annonce
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {announcements.length > 0 ? (
              <div className="announcements-list">
                {announcements.map((announcement) => {
                  const stats = announcementStats[announcement.id] || {
                    readCount: 0,
                    readers: [],
                  };
                  const readPercentage =
                    doctors.length > 0
                      ? Math.round((stats.readCount / doctors.length) * 100)
                      : 0;

                  // Calculer les réponses non lues pour cette annonce
                  const replies = announcementReplies[announcement.id] || [];
                  const unreadRepliesCount = replies.filter(
                    (reply) => !reply.isFromStructure && !reply.readByStructure
                  ).length;

                  return (
                    <div
                      key={announcement.id}
                      className={`announcement-item p-3 border-bottom ${
                        announcement.priority === "high"
                          ? "bg-light-danger"
                          : announcement.priority === "low"
                          ? "bg-light-info"
                          : "bg-white"
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 me-2">{announcement.title}</h6>
                            {announcement.priority === "high" && (
                              <Badge bg="danger" pill>
                                Prioritaire
                              </Badge>
                            )}
                            {unreadRepliesCount > 0 && (
                              <Badge bg="danger" pill className="ms-2">
                                {unreadRepliesCount} nouvelle
                                {unreadRepliesCount > 1 ? "s" : ""} réponse
                                {unreadRepliesCount > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted mb-1">
                            <i className="far fa-clock me-2"></i>
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mb-2">
                            {announcement.content.length > 100
                              ? `${announcement.content.substring(0, 100)}...`
                              : announcement.content}
                          </p>
                          <div className="announcement-meta d-flex flex-wrap gap-2">
                            <span className="badge bg-light text-dark">
                              <i className="fas fa-users me-1"></i>
                              Cible:{" "}
                              {announcement.targetAudience === "all"
                                ? "Tous les médecins"
                                : announcement.targetAudience === "affiliated"
                                ? "Médecins affiliés"
                                : "Spécialités spécifiques"}
                            </span>
                            {announcement.expiryDate && (
                              <span className="badge bg-light text-dark">
                                <i className="fas fa-calendar-times me-1"></i>
                                Expire le:{" "}
                                {new Date(
                                  announcement.expiryDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                            <span className="badge bg-light text-dark">
                              <i className="fas fa-paperclip me-1"></i>
                              {announcement.attachments?.length || 0} pièce(s)
                              jointe(s)
                            </span>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <div className="stats-badge mb-2">
                            <div
                              className="progress"
                              style={{ height: "8px", width: "100px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${readPercentage}%` }}
                                aria-valuenow={readPercentage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <small className="text-muted">
                              Lu par {stats.readCount} sur {doctors.length}{" "}
                              médecins
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() =>
                                viewAnnouncementDetails(announcement)
                              }
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => {
                                setEditingAnnouncement(announcement);
                                setShowAddAnnouncementModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteAnnouncement(announcement.id)
                              }
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-bullhorn fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">Aucune annonce publiée</h6>
                <p className="text-muted">
                  Créez votre première annonce pour informer les médecins
                </p>
              </div>
            )}
          </Card.Body>
          <style jsx>{`
            .announcements-list {
              max-height: 600px;
              overflow-y: auto;
            }

            .announcement-item {
              transition: all 0.2s ease;
            }

            .announcement-item:hover {
              background-color: #f8f9fa;
            }

            .bg-light-danger {
              background-color: rgba(220, 53, 69, 0.05);
              border-left: 4px solid #dc3545;
            }

            .bg-light-info {
              background-color: rgba(13, 202, 240, 0.05);
            }

            .stats-badge {
              text-align: center;
            }
          `}</style>
        </Card>
      )}

      {(viewMode === "both" || viewMode === "gestions") && (
        <Card className="mb-4 shadow">
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Gestion des revenus
              </h5>
              <p className="mt-1 d-block text-white">
                {new Date()
                  .toLocaleString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  })
                  .replace("à", "à")}
              </p>
              {/*
       <div className="btn-group">
         <Button
           variant={activeTab === 'daily' ? 'light' : 'outline-light'}
           size="sm"
           onClick={() => setActiveTab('daily')}
         >
           Jour
         </Button>
        
         <Button
           variant={activeTab === 'weekly' ? 'light' : 'outline-light'}
           size="sm"
           onClick={() => setActiveTab('weekly')}
         >
           Semaine
         </Button>
         <Button
           variant={activeTab === 'monthly' ? 'light' : 'outline-light'}
           size="sm"
           onClick={() => setActiveTab('monthly')}
         >
           Mois
         </Button>
       </div>
         */}
            </div>
          </Card.Header>
          <Card.Body>
            {/* Formulaire pour définir un tarif */}
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="mb-3">Définir un tarif de prestation</h6>
              <Form onSubmit={saveDoctorFee}>
                <Row className="g-3">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Sélectionner un médecin</Form.Label>
                      <Form.Select
                        value={selectedDoctor?.id || ""}
                        onChange={(e) => {
                          const doctor = doctors.find(
                            (d) => d.id === e.target.value
                          );
                          setSelectedDoctor(doctor);
                        }}
                        required
                      >
                        <option value="">Choisir un médecin</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.nom} {doctor.prenom} -{" "}
                            {doctor.specialite}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Tarif (fcfa)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={newFee}
                        onChange={(e) => setNewFee(e.target.value)}
                        placeholder="Montant"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button type="submit" variant="primary" className="w-100">
                      <i className="fas fa-save me-2"></i>
                      Enregistrer
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>

            {/* Statistiques */}
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div></div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={loadCompletedAppointments}
                className="d-flex align-items-center"
              >
                <i className="fas fa-sync-alt me-2"></i>
                Actualiser les données
              </Button>
            </div>

            {/* Tableau des médecins avec leurs tarifs et compteurs */}
            <div className="mb-4">
              <h6 className="mb-3">
                {activeTab === "daily" && "Revenus journaliers des médecins"}
                {activeTab === "weekly" && "Revenus hebdomadaires des médecins"}
                {activeTab === "monthly" && "Revenus mensuels des médecins"}
              </h6>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Médecin</th>
                      <th>Spécialité</th>
                      <th className="text-end">Tarif (fcfa)</th>
                      <th className="text-end">
                        Consultations terminées
                        {activeTab === "daily" && " aujourd'hui"}
                        {activeTab === "weekly" && " cette semaine"}
                        {activeTab === "monthly" && " ce mois"}
                      </th>
                      <th className="text-end">
                        Revenus
                        {activeTab === "daily" && " du jour"}
                        {activeTab === "weekly" && " de la semaine"}
                        {activeTab === "monthly" && " du mois"}
                        (fcfa)
                      </th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorsWithFees.length > 0 ? (
                      doctorsWithFees.map((doctor) => {
                        const fee = doctorFees[doctor.id] || 0;
                        let appointmentsCount = 0;
                        let revenue = 0;

                        if (activeTab === "daily") {
                          appointmentsCount = getCompletedAppointmentsToday(
                            doctor.id
                          );
                          revenue = calculateDailyRevenue(doctor.id);
                        } else if (activeTab === "weekly") {
                          appointmentsCount = getCompletedAppointmentsThisWeek(
                            doctor.id
                          );
                          revenue = calculateWeeklyRevenue(doctor.id);
                        } else if (activeTab === "monthly") {
                          appointmentsCount = getCompletedAppointmentsThisMonth(
                            doctor.id
                          );
                          revenue = calculateMonthlyRevenue(doctor.id);
                        }

                        return (
                          <tr
                            key={doctor.id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSelectedDoctorForDetails(doctor);
                              setShowWeeklyDetails(true);
                            }}
                          >
                            <td>
                              {doctor.nom} {doctor.prenom}
                            </td>
                            <td>{doctor.specialite}</td>
                            <td className="text-end">{fee.toFixed(2)}</td>
                            <td className="text-end">{appointmentsCount}</td>
                            <td className="text-end">{revenue.toFixed(2)}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  confirmExcludeDoctorWithDataDeletion(
                                    doctor.id
                                  )
                                }
                                title="Retirer du tableau et supprimer les données"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          Aucun médecin avec tarif défini
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-primary">
                    <tr>
                      <td colSpan="5" className="text-end fw-bold">
                        Total
                      </td>
                      <td className="text-end fw-bold">
                        {calculateTotalRevenue(activeTab).toFixed(2)} fcfa
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Détails hebdomadaires pour le médecin sélectionné */}
            {/* Détails hebdomadaires pour le médecin sélectionné */}
            {showWeeklyDetails && selectedDoctorForDetails && (
              <div className="mt-4 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    Détails des revenus - Dr. {selectedDoctorForDetails.nom}{" "}
                    {selectedDoctorForDetails.prenom}
                  </h6>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowWeeklyDetails(false)}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>

                {/* Liste des rendez-vous terminés pour ce médecin, incluant les supprimés */}
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="border-bottom pb-2">
                      <i className="fas fa-list-check me-2"></i>
                      Historique des rendez-vous
                    </h6>
                    <div>
                      <Form.Check
                        type="switch"
                        id="show-deleted"
                        label="Afficher les supprimés"
                        checked={showDeletedAppointments}
                        onChange={(e) =>
                          setShowDeletedAppointments(e.target.checked)
                        }
                        className="d-inline-block me-2"
                      />
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          exportRevenueData(selectedDoctorForDetails.id)
                        }
                      >
                        <i className="fas fa-download me-1"></i>
                        Exporter
                      </Button>
                    </div>
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Patient</th>
                          <th>Montant</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedAppointments
                          .filter(
                            (apt) =>
                              apt.doctorId === selectedDoctorForDetails.id
                          )
                          .filter((apt) =>
                            showDeletedAppointments ? true : !apt.isDeleted
                          )
                          .sort((a, b) =>
                            (b.date || "").localeCompare(a.date || "")
                          )
                          .map((apt) => {
                            const patient = patients.find(
                              (p) => p.id === apt.patientId
                            );
                            return (
                              <tr
                                key={apt.id}
                                className={
                                  apt.isDeleted ? "text-muted bg-light" : ""
                                }
                              >
                                <td>
                                  {new Date(apt.date).toLocaleDateString()}
                                </td>
                                <td>
                                  {patient
                                    ? `${patient.nom} ${patient.prenom}`
                                    : apt.patientName || "Patient inconnu"}
                                  {apt.isDeleted && (
                                    <span className="ms-2 badge bg-danger">
                                      Supprimé
                                    </span>
                                  )}
                                </td>
                                <td>{apt.amount?.toFixed(2) || "0.00"} fcfa</td>
                                <td>
                                  <Badge
                                    bg={apt.isDeleted ? "secondary" : "success"}
                                  >
                                    {apt.isDeleted ? "Archivé" : "Terminé"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bouton pour générer un récapitulatif */}
                <div className="text-center mt-4">
                  <Button
                    variant="info"
                    className="ms-2"
                    onClick={() =>
                      showRevenueSummary(selectedDoctorForDetails.id)
                    }
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    Voir récapitulatif
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Row>
        {(viewMode === "both" || viewMode === "doctors") && (
          <Col md={viewMode === "both" ? 6 : 12}>
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
                    un médecin privé
                  </Button>
                </div>
              </Card.Header>
              {privateDoctorSearchBar}

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
                  border: 1px solid rgba(0, 0, 0, 0.1);
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
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="doctor-card-item">
                        <div className="doctor-info p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0">
                              {doctor.nom} {doctor.prenom}
                            </h6>
                            <span
                              className={`badge ${
                                doctor.visibility === "private"
                                  ? "bg-info"
                                  : "bg-success"
                              }`}
                            >
                              {doctor.visibility === "private"
                                ? "Privé"
                                : "Affilié"}
                            </span>
                          </div>
                          <div className="mb-3">
                            <p className="text-muted mb-2">
                              <i className="fas fa-stethoscope me-2"></i>
                              Spécialité:
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                              {Array.isArray(doctor.specialite) ? (
                                doctor.specialite.map((specialty, index) => (
                                  <span
                                    key={index}
                                    className="badge bg-primary-subtle text-primary border-0 rounded-3 px-3 py-2"
                                  >
                                    <i className="fas fa-user-md me-2"></i>
                                    {specialty}
                                  </span>
                                ))
                              ) : doctor.specialite ? (
                                <span className="badge bg-primary-subtle text-primary border-0 rounded-3 px-3 py-2">
                                  <i className="fas fa-user-md me-2"></i>
                                  {doctor.specialite}
                                </span>
                              ) : (
                                <span className="text-muted fst-italic">
                                  Aucune spécialité spécifiée
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="insurances-section mb-3">
                            <p className="text-muted mb-2">
                              <i className="fas fa-file-medical me-2"></i>
                              Assurances acceptées:
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                              {doctor.insurances &&
                              doctor.insurances.length > 0 ? (
                                doctor.insurances.map((insurance, index) => (
                                  <span
                                    key={index}
                                    className="badge bg-info-subtle text-info border-0 rounded-3 px-3 py-2"
                                  >
                                    <i className="fas fa-file-medical me-2"></i>
                                    {insurance}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted fst-italic">
                                  Aucune assurance spécifiée
                                </span>
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

                              {doctor.visibility === "private" ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => handleDeleteDoctor(doctor.id)}
                                >
                                  <i className="fas fa-trash me-1"></i>{" "}
                                  Supprimer
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() =>
                                    handleUnaffiliation("doctor", doctor.id)
                                  }
                                >
                                  <i className="fas fa-unlink me-1"></i>{" "}
                                  Désaffilier
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
                                <i className="fas fa-user-plus me-1"></i>{" "}
                                Assigner
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
                                <i className="fas fa-calendar me-1"></i>{" "}
                                Rendez-vous
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

        {(viewMode === "both" || viewMode === "patients") && (
          <Col md={viewMode === "both" ? 6 : 12}>
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
                    patient privé
                  </Button>
                </div>
              </Card.Header>
              {privatePatientSearchBar}

              <Card.Body className="card-body-scroll">
                <div className="patient-list-container">
                  <div className="patient-grid">
                    {patients.map((patient) => (
                      <div key={patient.id} className="patient-item">
                        <div className="patient-content">
                          <div className="patient-header">
                            <div className="patient-info">
                              <h6 className="patient-name">
                                {patient.nom} {patient.prenom}
                              </h6>
                              <p className="patient-age">
                                <i className="fas fa-birthday-cake me-2"></i>
                                {patient.age} ans
                              </p>
                            </div>
                            <span
                              className={`status-badge ${
                                patient.visibility === "private"
                                  ? "badge-private"
                                  : "badge-affiliated"
                              }`}
                            >
                              <i
                                className={`fas ${
                                  patient.visibility === "private"
                                    ? "fa-lock"
                                    : "fa-link"
                                }`}
                              ></i>
                              {patient.visibility === "private"
                                ? "Privé"
                                : "Affilié"}
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

                              {patient.visibility === "private" ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="action-button"
                                  onClick={() =>
                                    handleDeletePatient(patient.id)
                                  }
                                >
                                  <i className="fas fa-trash"></i> Supprimer
                                </Button>
                              ) : (
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  className="action-button"
                                  onClick={() =>
                                    handleUnaffiliation("patient", patient.id)
                                  }
                                >
                                  <i className="fas fa-unlink"></i> Désaffilier
                                </Button>
                              )}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="action-button"
                                onClick={() =>
                                  handleShowAssignedDoctor(patient)
                                }
                                disabled={!patient.medecinId}
                              >
                                <i className="fas fa-user-md"></i> Médecin
                                assigné
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
                      grid-template-columns: repeat(
                        auto-fill,
                        minmax(300px, 1fr)
                      );
                    }

                    .patient-item {
                      background: white;
                      border-radius: 8px;
                      border: 1px solid rgba(0, 0, 0, 0.1);
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
      <Modal
        show={showAddDoctorModal}
        onHide={() => setShowAddDoctorModal(false)}
        size="lg"
      >
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
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, nom: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDoctor.prenom}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, prenom: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-stethoscope me-2"></i>
                Spécialité
              </Form.Label>
              <Select
                isMulti
                name="specialties"
                options={specialtyOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={specialtyOptions.filter((option) =>
                  Array.isArray(newDoctor.specialite)
                    ? newDoctor.specialite.includes(option.value)
                    : [newDoctor.specialite].includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setNewDoctor({
                    ...newDoctor,
                    specialite: selectedOptions.map((option) => option.value),
                  });
                }}
                onCreateOption={(inputValue) => {
                  // Créer une nouvelle option pour la spécialité personnalisée
                  const newOption = { value: inputValue, label: inputValue };
                  // Mettre à jour les options de spécialité
                  setSpecialtyOptions([...specialtyOptions, newOption]);
                  // Mettre à jour les spécialités sélectionnées
                  setNewDoctor({
                    ...newDoctor,
                    specialite: Array.isArray(newDoctor.specialite)
                      ? [...newDoctor.specialite, inputValue]
                      : [newDoctor.specialite, inputValue].filter(Boolean),
                  });
                }}
                isCreatable={true}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les spécialités..."
                noOptionsMessage={() => "Aucune spécialité disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                    borderColor: "#dee2e6",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#0d6efd",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#e9ecef",
                    borderRadius: "0.25rem",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#495057",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#495057",
                    ":hover": {
                      backgroundColor: "#dc3545",
                      color: "white",
                    },
                  }),
                }}
              />
              <Form.Text className="text-muted">
                Vous pouvez sélectionner des spécialités existantes ou en
                ajouter de nouvelles
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, email: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={newDoctor.password}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, password: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, telephone: e.target.value })
                    }
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
                    value={insuranceOptions.filter((option) =>
                      newDoctor.insurances?.includes(option.value)
                    )}
                    onChange={(selectedOptions) => {
                      setNewDoctor({
                        ...newDoctor,
                        insurances: selectedOptions.map(
                          (option) => option.value
                        ),
                      });
                    }}
                    onCreateOption={(inputValue) => {
                      // Créer une nouvelle option pour l'assurance personnalisée
                      const newOption = {
                        value: inputValue,
                        label: inputValue,
                      };
                      // Mettre à jour les options d'assurance
                      setInsuranceOptions([...insuranceOptions, newOption]);
                      // Mettre à jour les assurances sélectionnées
                      setNewDoctor({
                        ...newDoctor,
                        insurances: [
                          ...(newDoctor.insurances || []),
                          inputValue,
                        ],
                      });
                    }}
                    isCreatable={true}
                    formatCreateLabel={(inputValue) =>
                      `Ajouter "${inputValue}"`
                    }
                    placeholder="Sélectionnez ou saisissez les assurances..."
                    noOptionsMessage={() => "Aucune option disponible"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: "0.375rem",
                        borderColor: "#dee2e6",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#0d6efd",
                        },
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: "#e9ecef",
                        borderRadius: "0.25rem",
                      }),
                      multiValueLabel: (base) => ({
                        ...base,
                        color: "#495057",
                      }),
                      multiValueRemove: (base) => ({
                        ...base,
                        color: "#495057",
                        ":hover": {
                          backgroundColor: "#dc3545",
                          color: "white",
                        },
                      }),
                    }}
                  />
                  <Form.Text className="text-muted">
                    Vous pouvez sélectionner des assurances existantes ou en
                    ajouter de nouvelles
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
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, heureDebut: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure fin</Form.Label>
                  <Form.Control
                    type="time"
                    value={newDoctor.heureFin}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, heureFin: e.target.value })
                    }
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
                    onChange={(e) =>
                      setNewDoctor({
                        ...newDoctor,
                        maxPatientsPerDay: parseInt(e.target.value),
                      })
                    }
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
                    onChange={(e) =>
                      setNewDoctor({
                        ...newDoctor,
                        consultationDuration: parseInt(e.target.value),
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
              {[
                "Lundi",
                "Mardi",
                "Mercredi",
                "Jeudi",
                "Vendredi",
                "Samedi",
                "Dimanche",
              ].map((day) => (
                <Form.Check
                  key={day}
                  type="checkbox"
                  label={day}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewDoctor({
                        ...newDoctor,
                        disponibilite: [...newDoctor.disponibilite, day],
                      });
                    } else {
                      setNewDoctor({
                        ...newDoctor,
                        disponibilite: newDoctor.disponibilite.filter(
                          (d) => d !== day
                        ),
                      });
                    }
                  }}
                />
              ))}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddDoctorModal(false)}
          >
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddDoctor}>
            Ajouter
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        show={showEditDoctorModal}
        onHide={() => setShowEditDoctorModal(false)}
        size="lg"
      >
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
                    value={selectedDoctor?.nom || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        nom: e.target.value,
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
                    value={selectedDoctor?.prenom || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        prenom: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-stethoscope me-2"></i>
                Spécialité
              </Form.Label>
              <Select
                isMulti
                isCreatable
                name="specialties"
                options={specialtyOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={
                  Array.isArray(selectedDoctor?.specialite)
                    ? selectedDoctor?.specialite.map((spec) => ({
                        value: spec,
                        label: spec,
                      }))
                    : selectedDoctor?.specialite
                    ? [
                        {
                          value: selectedDoctor.specialite,
                          label: selectedDoctor.specialite,
                        },
                      ]
                    : []
                }
                onChange={(selectedOptions) => {
                  setSelectedDoctor({
                    ...selectedDoctor,
                    specialite: selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [],
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setSpecialtyOptions([...specialtyOptions, newOption]);
                  setSelectedDoctor({
                    ...selectedDoctor,
                    specialite: Array.isArray(selectedDoctor?.specialite)
                      ? [...selectedDoctor.specialite, inputValue]
                      : selectedDoctor?.specialite
                      ? [selectedDoctor.specialite, inputValue]
                      : [inputValue],
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les spécialités..."
                noOptionsMessage={() => "Aucune spécialité disponible"}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                    borderColor: "#dee2e6",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#0d6efd",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#e9ecef",
                    borderRadius: "0.25rem",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#495057",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#495057",
                    ":hover": {
                      backgroundColor: "#dc3545",
                      color: "white",
                    },
                  }),
                }}
              />
              <Form.Text className="text-muted">
                Vous pouvez sélectionner des spécialités existantes ou en
                ajouter de nouvelles
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={selectedDoctor?.email || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        email: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe:</Form.Label>
                  <Form.Control
                    type="password"
                    value={selectedDoctor?.password || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        password: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Téléphone</Form.Label>
                <Form.Control
                  type="tel"
                  value={selectedDoctor?.telephone || ""}
                  onChange={(e) =>
                    setSelectedDoctor({
                      ...selectedDoctor,
                      telephone: e.target.value,
                    })
                  }
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
                  value={insuranceOptions.filter((option) =>
                    selectedDoctor?.insurances?.includes(option.value)
                  )}
                  onChange={(selectedOptions) => {
                    setSelectedDoctor({
                      ...selectedDoctor,
                      insurances: selectedOptions
                        ? selectedOptions.map((option) => option.value)
                        : [],
                    });
                  }}
                  onCreateOption={(inputValue) => {
                    const newOption = { value: inputValue, label: inputValue };
                    setInsuranceOptions([...insuranceOptions, newOption]);
                    setSelectedDoctor({
                      ...selectedDoctor,
                      insurances: [
                        ...(selectedDoctor?.insurances || []),
                        inputValue,
                      ],
                    });
                  }}
                  formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                  placeholder="Sélectionnez ou saisissez les assurances..."
                  noOptionsMessage={() => "Aucune option disponible"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.375rem",
                      borderColor: "#dee2e6",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#0d6efd",
                      },
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#e9ecef",
                      borderRadius: "0.25rem",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#495057",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#495057",
                      ":hover": {
                        backgroundColor: "#dc3545",
                        color: "white",
                      },
                    }),
                  }}
                />
                <Form.Text className="text-muted">
                  Vous pouvez sélectionner des assurances existantes ou en
                  ajouter de nouvelles
                </Form.Text>
              </Form.Group>
            </Col>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure début</Form.Label>
                  <Form.Control
                    type="time"
                    value={selectedDoctor?.heureDebut || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        heureDebut: e.target.value,
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
                    value={selectedDoctor?.heureFin || ""}
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        heureFin: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        maxPatientsPerDay: parseInt(e.target.value),
                      })
                    }
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
                    onChange={(e) =>
                      setSelectedDoctor({
                        ...selectedDoctor,
                        consultationDuration: parseInt(e.target.value),
                      })
                    }
                    min="15"
                    step="15"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Jours disponibles</Form.Label>
              {[
                "Lundi",
                "Mardi",
                "Mercredi",
                "Jeudi",
                "Vendredi",
                "Samedi",
                "Dimanche",
              ].map((day) => (
                <Form.Check
                  key={day}
                  type="checkbox"
                  label={day}
                  checked={
                    selectedDoctor?.disponibilite?.includes(day) || false
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDoctor({
                        ...selectedDoctor,
                        disponibilite: [
                          ...(selectedDoctor?.disponibilite || []),
                          day,
                        ],
                      });
                    } else {
                      setSelectedDoctor({
                        ...selectedDoctor,
                        disponibilite:
                          selectedDoctor?.disponibilite?.filter(
                            (d) => d !== day
                          ) || [],
                      });
                    }
                  }}
                />
              ))}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditDoctorModal(false)}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => handleEditDoctor(selectedDoctor)}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Doctor Details Modal */}
      <Modal
        show={showDoctorDetails}
        onHide={() => setShowDoctorDetails(false)}
        size="lg"
      >
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
                  <h4>
                    {selectedDoctor.nom} {selectedDoctor.prenom}
                  </h4>
                  <p>
                    <strong>Spécialité:</strong> {selectedDoctor.specialite}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedDoctor.email}
                  </p>
                  <p>
                    <strong>Téléphone:</strong> {selectedDoctor.telephone}
                  </p>
                  <p>
                    <strong>Disponibilités:</strong>
                  </p>
                  <ul>
                    {selectedDoctor.disponibilite?.map((day) => (
                      <li key={day}>{day}</li>
                    ))}
                  </ul>
                  <p>
                    <strong>Horaires:</strong> {selectedDoctor.heureDebut} -{" "}
                    {selectedDoctor.heureFin}
                  </p>
                  {selectedDoctor.certifications &&
                    selectedDoctor.certifications.length > 0 && (
                      <div>
                        <p>
                          <strong>Certifications:</strong>
                        </p>
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
                    <Button
  variant="success"
  className="mt-2"
  onClick={() => {
    const messageData = {
      nom: selectedDoctor.nom,
      prenom: selectedDoctor.prenom,
      specialite: selectedDoctor.specialite,
    };
    
    const message = generateTemplateMessage(
      structure?.whatsappSettings?.doctorTemplate || 
      "Bonjour Dr. {nom} {prenom}, un message de {structureName}.",
      messageData
    );
    
    sendWhatsAppMessage(selectedDoctor.telephone, message);
  }}
>
  <i className="fab fa-whatsapp me-2"></i>
  Envoyer WhatsApp
</Button>

                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        show={showAddPatientModal}
        onHide={() => setShowAddPatientModal(false)}
        size="lg"
      >
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

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={newPatient.telephone}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        telephone: e.target.value,
                      })
                    }
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
                    value={insuranceOptions.filter((option) =>
                      newPatient.insurances?.includes(option.value)
                    )}
                    onChange={(selectedOptions) => {
                      setNewPatient({
                        ...newPatient,
                        insurances: selectedOptions
                          ? selectedOptions.map((option) => option.value)
                          : [],
                      });
                    }}
                    onCreateOption={(inputValue) => {
                      const newOption = {
                        value: inputValue,
                        label: inputValue,
                      };
                      setInsuranceOptions([...insuranceOptions, newOption]);
                      setNewPatient({
                        ...newPatient,
                        insurances: [
                          ...(newPatient.insurances || []),
                          inputValue,
                        ],
                      });
                    }}
                    formatCreateLabel={(inputValue) =>
                      `Ajouter "${inputValue}"`
                    }
                    placeholder="Sélectionnez ou saisissez les assurances..."
                    noOptionsMessage={() => "Aucune option disponible"}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-stethoscope me-2"></i>
                Diagnostic
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newPatient.diagnostic}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, diagnostic: e.target.value })
                }
                placeholder="Saisissez le diagnostic du patient..."
              />
              <Form.Text className="text-muted">
                Informations sur l'état de santé actuel et le diagnostic du
                patient
              </Form.Text>
            </Form.Group>

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
                  const previews = files.map((file) => ({
                    name: file.name,
                    url: URL.createObjectURL(file),
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
          <Button
            variant="secondary"
            onClick={() => setShowAddPatientModal(false)}
          >
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddPatient}>
            Ajouter
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        size="lg"
      >
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
      <Modal
        show={showPatientDetails}
        onHide={() => setShowPatientDetails(false)}
        size="lg"
      >
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
                  <h4>
                    {selectedPatient.nom} {selectedPatient.prenom}
                  </h4>
                  <p>
                    <strong>Age:</strong> {selectedPatient.age}
                  </p>
                  <p>
                    <strong>Sexe:</strong> {selectedPatient.sexe}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPatient.email}
                  </p>
                  <p>
                    <strong>Téléphone:</strong> {selectedPatient.telephone}
                  </p>
                  <p>
                    <strong>Adresse:</strong> {selectedPatient.adresse}
                  </p>
                  {/*<p><strong>Mot de passe:</strong>{selectedPatient.password}</p>*/}

                  {selectedPatient.antecedents && (
                    <div>
                      <p>
                        <strong>Antécédents médicaux:</strong>
                      </p>
                      <ul>
                        {selectedPatient.antecedents.map((ant, index) => (
                          <li key={index}>{ant}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPatient?.diagnostic && (
                    <div className="mt-3">
                      <h6 className="text-primary">
                        <i className="fas fa-stethoscope me-2"></i>
                        Diagnostic
                      </h6>
                      <div className="p-3 bg-light rounded">
                        {selectedPatient.diagnostic}
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          )}
          <div className="mb-3">
            <p>
              <strong>Assurances:</strong>
            </p>
            <div className="insurance-tags">
              {selectedPatient?.insurances &&
              selectedPatient.insurances.length > 0 ? (
                selectedPatient.insurances.map((insurance, index) => (
                  <span key={index} className="insurance-tag">
                    {insurance}
                    {index < selectedPatient.insurances.length - 1 ? ", " : ""}
                  </span>
                ))
              ) : (
                <span className="text-muted fst-italic">
                  Aucune assurance spécifiée
                </span>
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
                  {docUrl.includes(".pdf") ? (
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
                      onClick={() => window.open(docUrl, "_blank")}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button
  variant="success"
  className="mt-2"
  onClick={() => {
    const messageData = {
      nom: selectedPatient.nom,
      prenom: selectedPatient.prenom,
    };
    
    const message = generateTemplateMessage(
      structure?.whatsappSettings?.doctorTemplate || 
      "Bonjour  {nom} {prenom}, un message de {structureName}.",
      messageData
    );
    
    sendWhatsAppMessage(selectedDoctor.telephone, message);
  }}
>
  <i className="fab fa-whatsapp me-2"></i>
  Envoyer WhatsApp
</Button>

          </div>
        </Modal.Body>
      </Modal>

      {/* Assign Patients Modal */}
      <Modal
        show={showAssignPatientsModal}
        onHide={() => setShowAssignPatientsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-user-md me-2"></i>
            Assignations multiples - Dr. {selectedDoctor?.nom}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light p-4">
          <Form>
            {/* Calendar Selection */}
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group className="bg-white p-3 rounded shadow-sm">
                  <Form.Label className="fw-bold text-primary mb-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Sélection des dates
                  </Form.Label>

                  {/* Affichage des jours disponibles pour référence */}
                  <div className="mb-3">
                    <p className="mb-2 text-muted">
                      <i className="fas fa-info-circle me-2"></i>
                      Jours disponibles du médecin:
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {(selectedDoctor?.disponibilite || []).map((day) => (
                        <span key={day} className="badge bg-light text-primary">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Calendrier */}
                  <div className="calendar-container mb-3">
                    <Calendar
                      onChange={(date) => {
                        // Convertir la date en jour de la semaine en français
                        const dayOfWeek = date.toLocaleDateString("fr-FR", {
                          weekday: "long",
                        });
                        // Capitaliser la première lettre
                        const capitalizedDay =
                          dayOfWeek.charAt(0).toUpperCase() +
                          dayOfWeek.slice(1);

                        // Vérifier si ce jour est disponible pour le médecin
                        if (
                          (selectedDoctor?.disponibilite || []).includes(capitalizedDay)
                        ) {
                          // Format de date pour l'affichage et le stockage: YYYY-MM-DD
                          const formattedDate = date
                            .toISOString()
                            .split("T")[0];

                          setSelectedDays((prev) =>
                            prev.some((d) => d.date === formattedDate)
                              ? prev.filter((d) => d.date !== formattedDate)
                              : [
                                  ...prev,
                                  { date: formattedDate, day: capitalizedDay },
                                ]
                          );
                        } else {
                          setMessage(
                            `Le médecin n'est pas disponible le ${capitalizedDay}`
                          );
                        }
                      }}
                      tileDisabled={({ date, view }) => {
                        // Désactiver les jours où le médecin n'est pas disponible
                        if (view === "month") {
                          const dayOfWeek = date.toLocaleDateString("fr-FR", {
                            weekday: "long",
                          });
                          const capitalizedDay =
                            dayOfWeek.charAt(0).toUpperCase() +
                            dayOfWeek.slice(1);
                          return !(selectedDoctor?.disponibilite || []).includes(capitalizedDay);
                        }
                        return false;
                      }}
                      
                      tileClassName={({ date, view }) => {
                        // Mettre en évidence les jours sélectionnés
                        if (view === "month") {
                          const formattedDate = date
                            .toISOString()
                            .split("T")[0];
                          if (
                            selectedDays.some((d) => d.date === formattedDate)
                          ) {
                            return "selected-date";
                          }
                        }
                        return null;
                      }}
                      locale="fr-FR"
                    />
                  </div>

                  {/* Affichage des dates sélectionnées */}
                  {selectedDays.length > 0 && (
                    <div className="selected-dates mb-3">
                      <p className="mb-2 fw-bold text-primary">
                        <i className="fas fa-check-circle me-2"></i>
                        Dates sélectionnées:
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedDays.map((selectedDay) => (
                          <Badge
                            key={selectedDay.date}
                            bg="primary"
                            className="p-2 d-flex align-items-center"
                          >
                            <span>
                              {new Date(selectedDay.date).toLocaleDateString(
                                "fr-FR",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                }
                              )}
                            </span>
                            <Button
                              variant="link"
                              className="p-0 ms-2 text-white"
                              onClick={() =>
                                setSelectedDays((prev) =>
                                  prev.filter(
                                    (d) => d.date !== selectedDay.date
                                  )
                                )
                              }
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
                    ).map((slot) => (
                      <Button
                        key={slot}
                        variant={
                          selectedTimeSlots.includes(slot)
                            ? "primary"
                            : "outline-primary"
                        }
                        className="rounded-pill shadow-sm m-1"
                        onClick={() => {
                          setSelectedTimeSlots((prev) =>
                            prev.includes(slot)
                              ? prev.filter((s) => s !== slot)
                              : [...prev, slot]
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
                      onClick={() =>
                        setSelectedPatientIds(patients.map((p) => p.id))
                      }
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
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="patient-item p-2 rounded hover-effect"
                        >
                        <Form.Check
                          type="checkbox"
                          className="d-flex align-items-center"
                          label={
                            <div className="ms-2">
                              <span className="fw-bold">
                                {patient.nom} {patient.prenom}
                              </span>
                              <small className="text-muted ms-2">
                                <i className="fas fa-phone-alt me-1"></i>
                                {patient.telephone}
                              </small>
                            </div>
                          }
                          checked={selectedPatientIds.includes(patient.id)}
                          onChange={(e) => {
                            setSelectedPatientIds((prev) =>
                              e.target.checked
                                ? [...prev, patient.id]
                                : prev.filter((id) => id !== patient.id)
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <style jsx>
                    {`
                      .calendar-container {
                        margin: 0 auto;
                        max-width: 100%;
                        background-color: #fff;
                        border-radius: 8px;
                        overflow: hidden;
                      }

                      /* Styles pour le calendrier React-Calendar */
                      .react-calendar {
                        width: 100%;
                        border: none;
                        font-family: inherit;
                      }

                      .react-calendar__tile--active {
                        background: #0d6efd;
                        color: white;
                      }

                      .react-calendar__tile--now {
                        background: #f0f9ff;
                      }

                      .react-calendar__tile:disabled {
                        background-color: #f8f9fa;
                        color: #adb5bd;
                        cursor: not-allowed;
                      }

                      .selected-date {
                        background-color: #0d6efd !important;
                        color: white !important;
                        font-weight: bold;
                      }

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
              
              <div className="d-flex">
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
                  disabled={
                    !selectedPatientIds.length ||
                    !selectedDays.length ||
                    !selectedTimeSlots.length
                  }
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
      <Modal
        show={showEditPatientModal}
        onHide={() => setShowEditPatientModal(false)}
        size="lg"
      >
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
                    value={selectedPatient?.nom || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        nom: e.target.value,
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
                    value={selectedPatient?.prenom || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        prenom: e.target.value,
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
                    value={selectedPatient?.age || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        age: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexe</Form.Label>
                  <Form.Select
                    value={selectedPatient?.sexe || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        sexe: e.target.value,
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
                    value={selectedPatient?.email || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        email: e.target.value,
                      })
                    }
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
                    value={selectedPatient?.telephone || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        telephone: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Adresse</Form.Label>
                  <Form.Control
                    type="text"
                    value={selectedPatient?.adresse || ""}
                    onChange={(e) =>
                      setSelectedPatient({
                        ...selectedPatient,
                        adresse: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Antécédents médicaux</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={selectedPatient?.antecedents?.join("\n") || ""}
                onChange={(e) =>
                  setSelectedPatient({
                    ...selectedPatient,
                    antecedents: e.target.value
                      .split("\n")
                      .filter((item) => item.trim() !== ""),
                  })
                }
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
                value={insuranceOptions.filter((option) =>
                  selectedPatient?.insurances?.includes(option.value)
                )}
                onChange={(selectedOptions) => {
                  setSelectedPatient({
                    ...selectedPatient,
                    insurances: selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [],
                  });
                }}
                onCreateOption={(inputValue) => {
                  const newOption = { value: inputValue, label: inputValue };
                  setInsuranceOptions([...insuranceOptions, newOption]);
                  setSelectedPatient({
                    ...selectedPatient,
                    insurances: [
                      ...(selectedPatient?.insurances || []),
                      inputValue,
                    ],
                  });
                }}
                formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
                placeholder="Sélectionnez ou saisissez les assurances..."
                noOptionsMessage={() => "Aucune option disponible"}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                <i className="fas fa-stethoscope me-2"></i>
                Diagnostic
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={selectedPatient?.diagnostic || ""}
                onChange={(e) =>
                  setSelectedPatient({
                    ...selectedPatient,
                    diagnostic: e.target.value,
                  })
                }
                placeholder="Saisissez le diagnostic du patient..."
              />
              <Form.Text className="text-muted">
                Informations sur l'état de santé actuel et le diagnostic du
                patient
              </Form.Text>
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
                        height: "150px",
                        width: "150px",
                        objectFit: "cover",
                        border: "4px solid white",
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
                    onClick={() => window.open(doc, "_blank")}
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

                  const previews = files.map((file) => ({
                    name: file.name,
                    url: URL.createObjectURL(file),
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
                    Prévisualiser les nouveaux documents (
                    {editPreviewDocs.length})
                  </Button>
                </div>
              )}
            </Form.Group>
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
            variant="primary"
            onClick={() => handleEditPatient(selectedPatient)}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showAppointmentsModal}
        onHide={() => setShowAppointmentsModal(false)}
        size="lg"
        className="appointments-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>
            <div className="d-flex align-items-center">
              <div className="header-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="header-title">
                Rendez-vous de {selectedDoctor?.nom}
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0">
          {/* Filtres de date */}
          <div className="filter-section">
            <div className="filter-container">
              <div className="filter-header">
                <i className="fas fa-filter"></i>
                <span>Filtrer les rendez-vous</span>
              </div>

              <div className="date-filters">
                <div className="filter-group">
                  <div className="filter-label">Par date:</div>
                  <div className="filter-options">
                    <button
                      className={`filter-btn ${!selectedDate ? "active" : ""}`}
                      onClick={() => setSelectedDate(null)}
                    >
                      <i className="fas fa-calendar-day"></i>
                      <span className="d-none d-sm-inline">Tous</span>
                    </button>

                    {[...new Set(appointments.map((app) => app.date))]
                      .sort((a, b) => new Date(a) - new Date(b))
                      .map((date) => {
                        const formattedDate = new Date(date).toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          }
                        );

                        const displayDate =
                          formattedDate.charAt(0).toUpperCase() +
                          formattedDate.slice(1);

                        return (
                          <button
                            key={date}
                            className={`filter-btn ${
                              selectedDate === date ? "active" : ""
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <i className="far fa-calendar"></i>
                            <span>{displayDate}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="filter-group">
                  <div className="filter-label">Par jour:</div>
                  <div className="filter-options">
                    <button
                      className={`filter-btn ${!selectedDay ? "active" : ""}`}
                      onClick={() => setSelectedDay(null)}
                    >
                      <i className="fas fa-times"></i>
                      <span className="d-none d-sm-inline">Tous</span>
                    </button>

                    {[...new Set(appointments.map((app) => app.day))]
                      .sort((a, b) => weekdayOrder[a] - weekdayOrder[b])
                      .map((day) => (
                        <button
                          key={day}
                          className={`filter-btn ${
                            selectedDay === day ? "active" : ""
                          }`}
                          onClick={() => setSelectedDay(day)}
                        >
                          <i className="far fa-calendar"></i>
                          <span>{day}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des rendez-vous */}
          <div className="appointments-list">
            {appointments
              .filter(
                (app) =>
                  (!selectedDate || app.date === selectedDate) &&
                  (!selectedDay || app.day === selectedDay)
              )
              .sort((a, b) => {
                if (a.date && b.date) {
                  const dateComparison = new Date(a.date) - new Date(b.date);
                  if (dateComparison !== 0) return dateComparison;
                }

                const dayDiff = weekdayOrder[a.day] - weekdayOrder[b.day];
                if (dayDiff !== 0) return dayDiff;

                return a.timeSlot.localeCompare(b.timeSlot);
              })
              .map((appointment, index) => {
                const patient = patients.find(
                  (p) => p.id === appointment.patientId
                );

                const formattedDate = appointment.date
                  ? new Date(appointment.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Non spécifié";

                const displayDate =
                  formattedDate.charAt(0).toUpperCase() +
                  formattedDate.slice(1);

                return (
                  <div
                    key={appointment.id}
                    className={`appointment-card ${
                      appointment.status === "completed"
                        ? "completed"
                        : "scheduled"
                    }`}
                  >
                    <div className="appointment-header">
                      <div className="patient-info">
                        <div className="order-badge">
                          {appointment.orderNumber || index + 1}
                        </div>
                        <div className="patient-name">
                          <i className="fas fa-user"></i>
                          <span>
                            {patient?.nom} {patient?.prenom}
                          </span>
                        </div>
                      </div>
                      <div className="appointment-status">
                        {appointment.status === "completed"
                          ? "Terminé"
                          : "Planifié"}
                      </div>
                    </div>

                    <div className="appointment-details">
                      <div className="detail-item">
                        <div className="detail-label">
                          <i className="far fa-calendar-alt"></i>
                          <span>Date:</span>
                        </div>
                        <div className="detail-value">{displayDate}</div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">
                          <i className="far fa-clock"></i>
                          <span>Horaire:</span>
                        </div>
                        <div className="detail-value">
                          {appointment.timeSlot}
                        </div>
                      </div>
                    </div>

                    <div className="appointment-actions">
                      {/* Bouton de modification */}
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <i className="fas fa-edit"></i>
                        <span className="d-none d-sm-inline">Modifier</span>
                      </button>

                      {appointment.status === "scheduled" && (
                        <button
                          className="action-btn complete"
                          onClick={() =>
                            handleCompleteAppointment(appointment.id)
                          }
                        >
                          <i className="fas fa-check"></i>
                          <span className="d-none d-sm-inline">Terminer</span>
                        </button>
                      )}

                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteAppointment(appointment.id)}
                      >
                        <i className="fas fa-trash"></i>
                        <span className="d-none d-sm-inline">Supprimer</span>
                      </button>
                    </div>
                  </div>
                );
              })}

            {appointments.filter(
              (app) =>
                (!selectedDate || app.date === selectedDate) &&
                (!selectedDay || app.day === selectedDay)
            ).length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <div className="empty-message">
                  Aucun rendez-vous ne correspond à vos critères
                </div>
              </div>
            )}
          </div>
        </Modal.Body>

        {/* Modal pour modifier un rendez-vous */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          size="md"
          centered
          className="edit-appointment-modal"
        >
          <Modal.Header closeButton className="edit-modal-header">
            <Modal.Title>
              <i className="fas fa-edit me-2"></i>
              Modifier le rendez-vous
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {appointmentToEdit && (
              <div className="edit-form">
                <div className="form-group mb-3">
                  <label className="form-label">Patient</label>
                  <div className="patient-select-container">
                    <select
                      className="form-select"
                      value={appointmentToEdit.patientId}
                      onChange={(e) =>
                        setAppointmentToEdit({
                          ...appointmentToEdit,
                          patientId: e.target.value,
                        })
                      }
                    >
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.nom} {patient.prenom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={appointmentToEdit.date}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const dayOfWeek = new Date(
                        selectedDate
                      ).toLocaleDateString("fr-FR", { weekday: "long" });
                      setAppointmentToEdit({
                        ...appointmentToEdit,
                        date: selectedDate,
                        day:
                          dayOfWeek.charAt(0).toUpperCase() +
                          dayOfWeek.slice(1),
                      });
                    }}
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Horaire</label>
                  <input
                    type="time"
                    className="form-control"
                    value={appointmentToEdit.timeSlot}
                    onChange={(e) =>
                      setAppointmentToEdit({
                        ...appointmentToEdit,
                        timeSlot: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Statut</label>
                  <div className="status-options">
                    <div className="form-check">
                      <input
                        type="radio"
                        id="status-scheduled"
                        name="status"
                        className="form-check-input"
                        checked={appointmentToEdit.status === "scheduled"}
                        onChange={() =>
                          setAppointmentToEdit({
                            ...appointmentToEdit,
                            status: "scheduled",
                          })
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor="status-scheduled"
                      >
                        Planifié
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        id="status-completed"
                        name="status"
                        className="form-check-input"
                        checked={appointmentToEdit.status === "completed"}
                        onChange={() =>
                          setAppointmentToEdit({
                            ...appointmentToEdit,
                            status: "completed",
                            completedAt: new Date().toISOString(),
                          })
                        }
                      />
                      <label
                        className="form-check-label"
                        htmlFor="status-completed"
                      >
                        Terminé
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="edit-modal-footer">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveEditedAppointment}>
              <i className="fas fa-save me-1"></i>
              Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>

        <style jsx>{`
          /* Variables */
          :root {
            --primary: #2c7be5;
            --primary-light: #edf2ff;
            --primary-dark: #1a68d1;
            --secondary: #6e84a3;
            --success: #00cc8d;
            --warning: #f6c343;
            --danger: #e63757;
            --light: #f9fbfd;
            --dark: #12263f;
            --white: #ffffff;
            --gray-100: #f9fbfd;
            --gray-200: #edf2f9;
            --gray-300: #e3ebf6;
            --gray-400: #d2ddec;
            --gray-500: #b1c2d9;
            --gray-600: #95aac9;
            --gray-700: #6e84a3;
            --gray-800: #3b506c;
            --gray-900: #12263f;
            --border-radius: 0.375rem;
            --transition: all 0.2s ease-in-out;
          }

          /* Modal principal */
          .appointments-modal :global(.modal-content) {
            border: none;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: 0 0.5rem 1.5rem rgba(18, 38, 63, 0.1);
          }

          .modal-header {
            background: linear-gradient(
              45deg,
              var(--primary),
              var(--primary-dark)
            );
            color: var(--white);
            border-bottom: none;
            padding: 1rem;
          }

          .header-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            margin-right: 0.75rem;
          }

          .header-title {
            font-weight: 600;
            font-size: 1rem;
            letter-spacing: 0.5px;
          }

          /* Section des filtres */
          .filter-section {
            background-color: var(--gray-100);
            border-bottom: 1px solid var(--gray-200);
          }

          .filter-container {
            padding: 1rem;
          }

          .filter-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
            color: var(--primary);
            font-size: 0.9rem;
          }

          .date-filters {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .filter-label {
            font-size: 0.8rem;
            color: var(--gray-700);
            font-weight: 500;
          }

          .filter-options {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .filter-btn {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.35rem 0.75rem;
            background-color: var(--white);
            border: 1px solid var(--gray-300);
            border-radius: 1rem;
            font-size: 0.8rem;
            color: var(--gray-700);
            cursor: pointer;
            transition: var(--transition);
          }

          .filter-btn:hover {
            background-color: var(--gray-200);
          }

          .filter-btn.active {
            background-color: var(--primary);
            color: var(--white);
            border-color: var(--primary);
          }

          /* Liste des rendez-vous */
          .appointments-list {
            padding: 1rem;
            max-height: 60vh;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--gray-400) transparent;
          }

          .appointments-list::-webkit-scrollbar {
            width: 4px;
          }

          .appointments-list::-webkit-scrollbar-track {
            background: transparent;
          }

          .appointments-list::-webkit-scrollbar-thumb {
            background-color: var(--gray-400);
            border-radius: 4px;
          }

          /* Carte de rendez-vous */
          .appointment-card {
            background-color: var(--white);
            border-radius: var(--border-radius);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin-bottom: 1rem;
            overflow: hidden;
            transition: var(--transition);
            border-left: 4px solid var(--warning);
          }

          .appointment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
          }

          .appointment-card.completed {
            border-left-color: var(--success);
          }

          .appointment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background-color: var(--gray-100);
            border-bottom: 1px solid var(--gray-200);
          }

          .patient-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .order-badge {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: var(--primary);
            color: var(--white);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .patient-name {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--dark);
          }

          .appointment-status {
            font-size: 0.7rem;
            font-weight: 500;
            padding: 0.2rem 0.5rem;
            border-radius: 1rem;
            background-color: var(--warning);
            color: var(--dark);
          }

          .completed .appointment-status {
            background-color: var(--success);
            color: var(--white);
          }

          .appointment-details {
            padding: 0.75rem 1rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
          }

          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .detail-label {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            color: var(--gray-700);
          }

          .detail-value {
            font-size: 0.85rem;
            color: var(--dark);
            font-weight: 500;
          }

          .appointment-actions {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--gray-200);
            background-color: var(--gray-50);
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.75rem;
            border-radius: var(--border-radius);
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            border: none;
          }

          .action-btn.edit {
            background-color: var(--primary-light);
            color: var(--primary);
          }

          .action-btn.edit:hover {
            background-color: var(--primary);
            color: var(--white);
          }

          .action-btn.complete {
            background-color: rgba(0, 204, 141, 0.1);
            color: var(--success);
          }

          .action-btn.complete:hover {
            background-color: var(--success);
            color: var(--white);
          }

          .action-btn.delete {
            background-color: rgba(230, 55, 87, 0.1);
            color: var(--danger);
          }

          .action-btn.delete:hover {
            background-color: var(--danger);
            color: var(--white);
          }

          /* État vide */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1rem;
            text-align: center;
          }

          .empty-icon {
            font-size: 2rem;
            color: var(--gray-400);
            margin-bottom: 1rem;
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background-color: var(--gray-100);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .empty-message {
            font-size: 0.9rem;
            color: var(--gray-600);
            font-weight: 500;
          }

          /* Modal d'édition */
          .edit-appointment-modal :global(.modal-content) {
            border: none;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: 0 0.5rem 1.5rem rgba(18, 38, 63, 0.1);
          }

          .edit-modal-header {
            background-color: var(--primary);
            color: var(--white);
            border-bottom: none;
            padding: 0.75rem 1rem;
          }

          .edit-form {
            padding: 0.5rem;
          }

          .form-label {
            font-weight: 500;
            font-size: 0.85rem;
            color: var(--gray-800);
            margin-bottom: 0.35rem;
          }

          .patient-select-container {
            position: relative;
          }

          .status-options {
            display: flex;
            gap: 1.5rem;
          }

          .edit-modal-footer {
            border-top: 1px solid var(--gray-200);
            padding: 0.75rem 1rem;
          }

          /* Responsive */
          @media (max-width: 767px) {
            .date-filters {
              gap: 1rem;
            }

            .filter-group {
              overflow-x: auto;
              padding-bottom: 0.5rem;
              margin-bottom: -0.5rem;
            }

            .filter-options {
              flex-wrap: nowrap;
              overflow-x: auto;
              padding-bottom: 0.25rem;
              scrollbar-width: none;
            }

            .filter-options::-webkit-scrollbar {
              display: none;
            }

            .appointment-details {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
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
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
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
                    <p>
                      <strong>Nombre de médecins:</strong> {doctors.length}
                    </p>
                    <p>
                      <strong>Nombre de patients:</strong> {patients.length}
                    </p>
                    <p>
                      <strong>Date d'inscription:</strong>{" "}
                      {new Date(structure.dateInscription).toLocaleDateString()}
                    </p>
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
        <Modal.Header
          closeButton
          className="bg-gradient bg-primary text-white py-3"
        >
          <Modal.Title className="d-flex align-items-center">
            <i className="fas fa-hospital-alt me-3 fa-2x"></i>
            <div>
              <h5 className="mb-0">
                {isEditing
                  ? "Modifier les informations"
                  : "Profil de la Structure"}
              </h5>
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
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                    }}
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
                            <strong>Responsable:</strong>{" "}
                            {structure?.responsible}
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
                          <span
                            key={index}
                            className="badge bg-info rounded-pill px-3 py-2"
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            {ins}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="info-section mb-4 bg-white rounded shadow-sm">
                    <h5 className="section-title border-bottom pb-2">
                      <i className="fas fa-stethoscope me-2 text-primary"></i>
                      Spécialités médicales gérées
                    </h5>
                    <div className="info-item p-3">
                      <div className="d-flex flex-wrap gap-2">
                        {structure?.specialties?.map((specialty, index) => (
                          <span
                            key={index}
                            className="badge bg-primary-subtle text-primary border-0 rounded-3 px-3 py-2"
                          >
                            <i className="fas fa-user-md me-2"></i>
                            {specialty}
                          </span>
                        ))}
                        {(!structure?.specialties ||
                          structure.specialties.length === 0) && (
                          <p className="text-muted fst-italic mb-0 d-flex align-items-center">
                            <i className="fas fa-info-circle me-2"></i>
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
                              <h3 className="mb-0">
                                {structure?.dateInscription
                                  ? new Date(
                                      structure.dateInscription
                                    ).toLocaleDateString()
                                  : "-"}
                              </h3>
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
                          setMessage("Email de réinitialisation envoyé");
                        } catch (error) {
                          setMessage("Erreur: " + error.message);
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
                            value={structure?.name || ""}
                            onChange={async (e) => {
                              const updatedStructure = {
                                ...structure,
                                name: e.target.value,
                              };
                              await updateDoc(
                                doc(db, "structures", structure.id),
                                {
                                  name: e.target.value,
                                }
                              );
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
                            value={structure?.email || ""}
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
                            value={structure?.phones?.mobile || ""}
                            onChange={async (e) => {
                              const updatedStructure = {
                                ...structure,
                                phones: {
                                  ...structure.phones,
                                  mobile: e.target.value,
                                },
                              };
                              await updateDoc(
                                doc(db, "structures", structure.id),
                                {
                                  "phones.mobile": e.target.value,
                                }
                              );
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
                            value={structure?.phones?.landline || ""}
                            onChange={async (e) => {
                              const updatedStructure = {
                                ...structure,
                                phones: {
                                  ...structure.phones,
                                  landline: e.target.value,
                                },
                              };
                              await updateDoc(
                                doc(db, "structures", structure.id),
                                {
                                  "phones.landline": e.target.value,
                                }
                              );
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
                            value={structure?.creationYear || ""}
                            onChange={async (e) => {
                              const updatedStructure = {
                                ...structure,
                                creationYear: e.target.value,
                              };
                              await updateDoc(
                                doc(db, "structures", structure.id),
                                {
                                  creationYear: e.target.value,
                                }
                              );
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
                            value={structure?.responsible || ""}
                            onChange={async (e) => {
                              const updatedStructure = {
                                ...structure,
                                responsible: e.target.value,
                              };
                              await updateDoc(
                                doc(db, "structures", structure.id),
                                {
                                  responsible: e.target.value,
                                }
                              );
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
                        value={structure?.address || ""}
                        onChange={async (e) => {
                          const updatedStructure = {
                            ...structure,
                            address: e.target.value,
                          };
                          await updateDoc(doc(db, "structures", structure.id), {
                            address: e.target.value,
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
                        value={structure?.website || ""}
                        onChange={async (e) => {
                          const updatedStructure = {
                            ...structure,
                            website: e.target.value,
                          };
                          await updateDoc(doc(db, "structures", structure.id), {
                            website: e.target.value,
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
                        value={
                          structure?.insurance?.map((insurance) => ({
                            value: insurance,
                            label: insurance,
                          })) || []
                        }
                        onChange={async (selectedOptions) => {
                          const insuranceArray = selectedOptions.map(
                            (option) => option.value
                          );
                          const updatedStructure = {
                            ...structure,
                            insurance: insuranceArray,
                          };
                          await updateDoc(doc(db, "structures", structure.id), {
                            insurance: insuranceArray,
                          });
                          setStructure(updatedStructure);
                        }}
                        onCreateOption={async (inputValue) => {
                          const newOption = {
                            value: inputValue,
                            label: inputValue,
                          };
                          setInsuranceOptions([...insuranceOptions, newOption]);
                          const updatedInsurance = [
                            ...(structure?.insurance || []),
                            inputValue,
                          ];
                          const updatedStructure = {
                            ...structure,
                            insurance: updatedInsurance,
                          };
                          await updateDoc(doc(db, "structures", structure.id), {
                            insurance: updatedInsurance,
                          });
                          setStructure(updatedStructure);
                        }}
                        formatCreateLabel={(inputValue) =>
                          `Ajouter "${inputValue}"`
                        }
                        placeholder="Sélectionnez ou saisissez les assurances..."
                        noOptionsMessage={() => "Aucune assurance disponible"}
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: "0.375rem",
                            borderColor: "#dee2e6",
                            boxShadow: "none",
                            "&:hover": {
                              borderColor: "#0d6efd",
                            },
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e9ecef",
                            borderRadius: "0.25rem",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#495057",
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: "#495057",
                            ":hover": {
                              backgroundColor: "#dc3545",
                              color: "white",
                            },
                          }),
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
                        value={
                          structure?.specialties?.map((specialty) => ({
                            value: specialty,
                            label: specialty,
                          })) || []
                        }
                        onChange={async (selectedOptions) => {
                          const specialtiesArray = selectedOptions.map(
                            (option) => option.value
                          );
                          const updatedStructure = {
                            ...structure,
                            specialties: specialtiesArray,
                          };
                          // Sauvegarder dans Firestore
                          await updateDoc(doc(db, "structures", structure.id), {
                            specialties: specialtiesArray,
                          });
                          setStructure(updatedStructure);
                        }}
                        onCreateOption={async (inputValue) => {
                          const newOption = {
                            value: inputValue,
                            label: inputValue,
                          };
                          setSpecialtyOptions([...specialtyOptions, newOption]);
                          const updatedSpecialties = [
                            ...(structure?.specialties || []),
                            inputValue,
                          ];
                          const updatedStructure = {
                            ...structure,
                            specialties: updatedSpecialties,
                          };
                          // Sauvegarder dans Firestore
                          await updateDoc(doc(db, "structures", structure.id), {
                            specialties: updatedSpecialties,
                          });
                          setStructure(updatedStructure);
                        }}
                        formatCreateLabel={(inputValue) =>
                          `Ajouter "${inputValue}"`
                        }
                        placeholder="Sélectionnez ou saisissez les spécialités..."
                        noOptionsMessage={() => "Aucune spécialité disponible"}
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: "0.375rem",
                            borderColor: "#dee2e6",
                            boxShadow: "none",
                            "&:hover": {
                              borderColor: "#0d6efd",
                            },
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e9ecef",
                            borderRadius: "0.25rem",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#495057",
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: "#495057",
                            ":hover": {
                              backgroundColor: "#dc3545",
                              color: "white",
                            },
                          }),
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
                            const photoRef = ref(
                              storage,
                              `structures/${structure.id}/photo`
                            );
                            await uploadBytes(photoRef, file);
                            const photoUrl = await getDownloadURL(photoRef);
                            await updateDoc(
                              doc(db, "structures", structure.id),
                              {
                                photoUrl: photoUrl,
                              }
                            );
                            setStructure({ ...structure, photoUrl: photoUrl });
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
                  setMessage("Modifications enregistrées");
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
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
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
            assignedDoctors.map((doctor) => (
              <div key={doctor.id} className="assigned-doctor-info mb-4">
                <div className="doctor-profile p-3 bg-light rounded shadow-sm mb-3">
                  <h5 className="border-bottom pb-2 text-primary">
                    <i className="fas fa-user-md me-2"></i>
                    Dr. {doctor.nom} {doctor.prenom}
                  </h5>
                  <Row>
                    <Col md={6}>
                      <p>
                        <strong>Spécialité:</strong> {doctor.specialite}
                      </p>
                      <p>
                        <strong>Téléphone:</strong> {doctor.telephone}
                      </p>
                      <p>
                        <strong>Email:</strong> {doctor.email}
                      </p>
                      <p>
                        <strong>Structure:</strong> {structure?.name}
                      </p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <strong>Horaires:</strong> {doctor.heureDebut} -{" "}
                        {doctor.heureFin}
                      </p>
                      <p>
                        <strong>Jours disponibles:</strong>
                      </p>
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {doctor.disponibilite?.map((day) => (
                          <span key={day} className="badge bg-info">
                            {day}
                          </span>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="appointments-section">
                  <h6 className="text-muted mb-3">
                    <i className="fas fa-calendar-check me-2"></i>
                    Rendez-vous avec ce médecin à {structure?.name}
                  </h6>

                  {doctorAppointments[doctor.id]?.length > 0 ? (
                    <div className="appointments-list p-2 border rounded">
                      {/* Filtres pour les rendez-vous */}
                      <div className="filters mb-3 p-2 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0 text-primary">
                            <i className="fas fa-filter me-1"></i>
                            Filtrer les rendez-vous
                          </h6>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setFilteredDoctor(null);
                              setFilteredDate(null);
                              setFilteredStatus(null);
                            }}
                            className="rounded-pill"
                          >
                            <i className="fas fa-times me-1"></i>
                            Réinitialiser
                          </Button>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          <div className="me-2">
                            <Form.Select
                              size="sm"
                              value={filteredStatus || ""}
                              onChange={(e) =>
                                setFilteredStatus(e.target.value || null)
                              }
                              className="rounded-pill"
                            >
                              <option value="">Tous les statuts</option>
                              <option value="scheduled">Planifiés</option>
                              <option value="completed">Terminés</option>
                            </Form.Select>
                          </div>

                          <div>
                            <Form.Select
                              size="sm"
                              value={filteredDate || ""}
                              onChange={(e) =>
                                setFilteredDate(e.target.value || null)
                              }
                              className="rounded-pill"
                            >
                              <option value="">Toutes les dates</option>
                              {[
                                ...new Set(
                                  doctorAppointments[doctor.id]
                                    .filter((apt) => apt.date) // S'assurer que la date existe
                                    .map((apt) => apt.date)
                                ),
                              ]
                                .sort((a, b) => new Date(a) - new Date(b))
                                .map((date) => {
                                  const formattedDate = new Date(
                                    date
                                  ).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  });
                                  const displayDate =
                                    formattedDate.charAt(0).toUpperCase() +
                                    formattedDate.slice(1);

                                  return (
                                    <option key={date} value={date}>
                                      {displayDate}
                                    </option>
                                  );
                                })}
                            </Form.Select>
                          </div>
                        </div>
                      </div>

                      {/* Liste des rendez-vous */}
                      {doctorAppointments[doctor.id]
                        .filter(
                          (apt) =>
                            (!filteredStatus ||
                              apt.status === filteredStatus) &&
                            (!filteredDate || apt.date === filteredDate)
                        )
                        .sort((a, b) => {
                          // D'abord trier par date si disponible
                          if (a.date && b.date) {
                            const dateComparison =
                              new Date(a.date) - new Date(b.date);
                            if (dateComparison !== 0) return dateComparison;
                          }

                          // Ensuite par jour de la semaine
                          const dayDiff =
                            weekdayOrder[a.day] - weekdayOrder[b.day];
                          if (dayDiff !== 0) return dayDiff;

                          // Enfin par créneau horaire
                          return a.timeSlot.localeCompare(b.timeSlot);
                        })
                        .map((apt) => {
                          // Formatage de la date pour l'affichage
                          const formattedDate = apt.date
                            ? new Date(apt.date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })
                            : apt.day; // Fallback sur le jour de la semaine si pas de date

                          // Capitaliser la première lettre
                          const displayDate =
                            formattedDate.charAt(0).toUpperCase() +
                            formattedDate.slice(1);

                          return (
                            <div
                              key={apt.id}
                              className="appointment-item p-3 mb-2 bg-white rounded border hover-effect"
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <p className="mb-1">
                                    <i className="fas fa-calendar-day me-2 text-primary"></i>
                                    <strong>Date:</strong> {displayDate}
                                  </p>
                                  <p className="mb-1">
                                    <i className="fas fa-clock me-2 text-primary"></i>
                                    <strong>Heure:</strong> {apt.timeSlot}
                                  </p>
                                  {apt.patientId && (
                                    <p className="mb-0">
                                      <i className="fas fa-user me-2 text-primary"></i>
                                      <strong>Patient:</strong>{" "}
                                      {patients.find(
                                        (p) => p.id === apt.patientId
                                      )?.nom +
                                        " " +
                                        patients.find(
                                          (p) => p.id === apt.patientId
                                        )?.prenom}
                                    </p>
                                  )}
                                </div>
                                <div className="d-flex flex-column align-items-end">
                                  <span
                                    className={`badge ${
                                      apt.status === "completed"
                                        ? "bg-success"
                                        : "bg-warning"
                                    } mb-2`}
                                  >
                                    {apt.status === "completed"
                                      ? "Terminé"
                                      : "Planifié"}
                                  </span>
                                  <div className="btn-group">
                                    {apt.status === "scheduled" && (
                                      <Button
                                        variant="outline-success"
                                        size="sm"
                                        className="rounded-pill"
                                        onClick={() =>
                                          handleCompleteAppointment(apt.id)
                                        }
                                      >
                                        <i className="fas fa-check me-1"></i>
                                        Terminer
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="rounded-pill ms-1"
                                      onClick={() =>
                                        handleDeleteAppointment(apt.id)
                                      }
                                    >
                                      <i className="fas fa-trash me-1"></i>
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {/* Message si aucun rendez-vous ne correspond aux filtres */}
                      {doctorAppointments[doctor.id].filter(
                        (apt) =>
                          (!filteredStatus || apt.status === filteredStatus) &&
                          (!filteredDate || apt.date === filteredDate)
                      ).length === 0 && (
                        <div className="text-center p-3 bg-light rounded">
                          <i className="fas fa-calendar-times text-muted mb-2 fa-2x"></i>
                          <p className="mb-0">
                            Aucun rendez-vous ne correspond aux filtres
                            sélectionnés
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-light rounded">
                      <i className="fas fa-calendar-alt fa-2x text-muted mb-3"></i>
                      <p className="text-muted fst-italic">
                        Aucun rendez-vous programmé
                      </p>
                    </div>
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

          <style jsx>
            {`
              .hover-effect {
                transition: transform 0.2s ease-in-out;
              }

              .hover-effect:hover {
                transform: translateY(-2px);
              }

              .appointments-list {
                max-height: 400px;
                overflow-y: auto;
              }

              .appointments-list::-webkit-scrollbar {
                width: 6px;
              }

              .appointments-list::-webkit-scrollbar-track {
                background: #f1f1f1;
              }

              .appointments-list::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 3px;
              }
            `}
          </style>
        </Modal.Body>
      </Modal>

    {/* Modale pour les details des rdvs */}
<Modal
  show={showDoctorScheduleModal}
  onHide={() => {
    setShowDoctorScheduleModal(false);
    setSelectedDoctorDetails({ appointments: [] });
  }}
    
  size="lg"
  className="doctor-schedule-modal"
>
  <Modal.Header closeButton className="modal-header">
    <Modal.Title className="d-flex align-items-center">
      <div className="doctor-avatar me-2">
        <i className="fas fa-user-md"></i>
      </div>
      <div className="doctor-title">
        <div className="doctor-name">
          Docteur. {selectedDoctorDetails?.nom} {selectedDoctorDetails?.prenom}
        </div>
        <div className="doctor-meta d-none d-sm-flex">
          <span className="doctor-specialty">
            <i className="fas fa-stethoscope me-1"></i>
            {selectedDoctorDetails?.specialite}
          </span>
          <span className="schedule-time">
            <i className="far fa-clock me-1"></i>
            {selectedDoctorDetails?.heureDebut} -{" "}
            {selectedDoctorDetails?.heureFin}
          </span>
        </div>
      </div>
    </Modal.Title>
  </Modal.Header>

  <div className="modal-subheader d-sm-none">
    <div className="d-flex justify-content-between">
      <span className="doctor-specialty">
        <i className="fas fa-stethoscope me-1"></i>
        {selectedDoctorDetails?.specialite}
      </span>
      <span className="schedule-time">
        <i className="far fa-clock me-1"></i>
        {selectedDoctorDetails?.heureDebut} -{" "}
        {selectedDoctorDetails?.heureFin}
      </span>
    </div>
  </div>

  <Modal.Body className="p-0">
    <div className="schedule-actions">
      <div className="day-indicator">
        <i className="fas fa-calendar-day me-2"></i>
        {selectedDay}
      </div>
      
      {/* Nouveau bouton pour voir tous les rendez-vous */}
      <div className="action-buttons">
        <Button 
          variant="primary"
          size="sm"
          className="view-all-btn"
          onClick={() => {
            // Fermer la modale actuelle
            setShowDoctorScheduleModal(false);
            
            // Définir le médecin sélectionné pour la deuxième modale
            setSelectedDoctor(selectedDoctorDetails);
            
            // Ouvrir la modale des rendez-vous
            setShowAssignPatientsModal(true);
          }}
        >
          <i className="fas fa-calendar-alt me-1"></i>
          <span>Ajouter un rendez-vous</span>
        </Button>
      </div>
    </div>

    <div className="appointments-container">
    {(selectedDoctorDetails?.appointments || []).length > 0 ? (
  <div className="appointments-list">
    {(selectedDoctorDetails?.appointments || []).map((apt, index) => {
            const patient = patients?.find((p) => p?.id === apt?.patientId);
            return (
              <div
                key={apt.id}
                className={`appointment-item ${
                  apt.status === "completed" ? "completed" : "scheduled"
                }`}
              >
                <div className="appointment-order">
                  <span className="order-number">
                    {apt.orderNumber || index + 1}
                  </span>
                </div>

                <div className="appointment-time">
                  <i className="fas fa-clock me-1"></i>
                  {apt.timeSlot}
                </div>

                <div className="appointment-patient">
                  <div className="patient-name">
                    {patient?.nom} {patient?.prenom}
                  </div>
                  <div className="patient-phone">
                    <i className="fas fa-phone me-1"></i>
                    {patient?.telephone}
                  </div>
                  {lastReorganization && lastReorganization[apt.id] && (
                    <div className="history-info">
                      <i className="fas fa-history me-1"></i>
                      Modifié: {lastReorganization[apt.id]}
                    </div>
                  )}
                </div>

                <div className="appointment-status">
                  <div className="status-badge">
                    {apt.status === "completed"
                      ? "Terminé"
                      : "En attente"}
                  </div>
                </div>

                <div className="appointment-actions">
                  <div className="order-actions">
                    <button
                      className="order-btn up"
                      onClick={() => moveAppointment(apt.id, "up")}
                      disabled={index === 0}
                    >
                      <i className="fas fa-chevron-up"></i>
                    </button>
                    <button
                      className="order-btn down"
                      onClick={() => moveAppointment(apt.id, "down")}
                      disabled={
                        index ===
                        selectedDoctorDetails?.appointments?.length - 1
                      }
                    >
                      <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>

                  <div className="main-actions">
                    {apt.status !== "completed" && (
                      <button
                        className="action-btn complete"
                        onClick={async () => {
                          if (!selectedDoctorDetails?.appointments) return;
                          
                          try {
                            await updateDoc(
                              doc(db, "appointments", apt.id),
                              {
                                status: "completed",
                                completedAt: new Date().toISOString(),
                              }
                            );

                            // Mettre à jour l'état local
                            const updatedAppointments =
                              selectedDoctorDetails?.appointments.map(
                                (a) =>
                                  a.id === apt.id
                                    ? { ...a, status: "completed" }
                                    : a
                              );

                            setSelectedDoctorDetails({
                              ...selectedDoctorDetails,
                              appointments: updatedAppointments,
                            });

                            setMessage(
                              "Rendez-vous marqué comme terminé"
                            );
                          } catch (error) {
                            console.error("Erreur:", error);
                            setMessage(
                              "Erreur lors de la mise à jour du rendez-vous"
                            );
                          }
                        }}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={async () => {
                        if (!selectedDoctorDetails?.appointments) return;
                        
                        if (
                          window.confirm(
                            "Êtes-vous sûr de vouloir supprimer définitivement ce rendez-vous ?"
                          )
                        ) {
                          try {
                            // Supprimer le rendez-vous de Firestore
                            await deleteDoc(
                              doc(db, "appointments", apt.id)
                            );

                            // Mettre à jour l'état local
                            const updatedAppointments =
                              selectedDoctorDetails?.appointments.filter(
                                (a) => a.id !== apt.id
                              );

                            setSelectedDoctorDetails({
                              ...selectedDoctorDetails,
                              appointments: updatedAppointments,
                            });

                            // Mettre à jour l'état global des rendez-vous
                            setAppointments((prev) =>
                              prev.filter((a) => a.id !== apt.id)
                            );

                            setMessage(
                              "Rendez-vous supprimé avec succès"
                            );
                          } catch (error) {
                            console.error("Erreur:", error);
                            setMessage(
                              "Erreur lors de la suppression du rendez-vous"
                            );
                          }
                        }
                      }}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-calendar-times"></i>
          </div>
          <p className="empty-message">
            Aucun rendez-vous programmé pour ce jour
          </p>
        </div>
      )}
    </div>
  </Modal.Body>

  <Modal.Footer className="modal-footer">
    <Button
      variant="secondary"
      onClick={() => setShowDoctorScheduleModal(false)}
    >
      Fermer
    </Button>
  </Modal.Footer>

  <style jsx>{`
    /* Variables */
    :root {
      --primary: #2c7be5;
      --primary-light: #edf2ff;
      --primary-dark: #1a68d1;
      --secondary: #6e84a3;
      --success: #00cc8d;
      --warning: #f6c343;
      --danger: #e63757;
      --light: #f9fbfd;
      --dark: #12263f;
      --white: #ffffff;
      --gray-100: #f9fbfd;
      --gray-200: #edf2f9;
      --gray-300: #e3ebf6;
      --gray-400: #d2ddec;
      --gray-500: #b1c2d9;
      --gray-600: #95aac9;
      --gray-700: #6e84a3;
      --gray-800: #3b506c;
      --gray-900: #12263f;
      --border-radius: 0.375rem;
      --transition: all 0.2s ease-in-out;
    }

    /* Modal styling */
    .doctor-schedule-modal :global(.modal-content) {
      border: none;
      border-radius: var(--border-radius);
      overflow: hidden;
      box-shadow: 0 0.5rem 1.5rem rgba(18, 38, 63, 0.1);
    }

    .modal-header {
      background: linear-gradient(
        45deg,
        var(--primary),
        var(--primary-dark)
      );
      color: var(--white);
      border-bottom: none;
      padding: 1rem;
    }

    .doctor-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .doctor-title {
      display: flex;
      flex-direction: column;
    }

    .doctor-name {
      font-weight: 600;
      font-size: 1rem;
      letter-spacing: 0.5px;
    }

    .doctor-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      opacity: 0.9;
    }

    .modal-subheader {
      background-color: var(--primary-dark);
      color: var(--white);
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }

    .schedule-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: var(--gray-100);
      border-bottom: 1px solid var(--gray-200);
    }

    .day-indicator {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--primary);
      display: flex;
      align-items: center;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.35rem 0.75rem;
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      font-weight: 500;
      transition: var(--transition);
    }

    /* Appointments container */
    .appointments-container {
      max-height: 60vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--gray-400) transparent;
    }

    .appointments-container::-webkit-scrollbar {
      width: 4px;
    }

    .appointments-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .appointments-container::-webkit-scrollbar-thumb {
      background-color: var(--gray-400);
      border-radius: 4px;
    }

    /* Appointment items */
    .appointment-item {
      display: grid;
      grid-template-columns: auto auto 1fr auto auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--gray-200);
      transition: var(--transition);
      position: relative;
    }

    .appointment-item:hover {
      background-color: var(--gray-100);
    }

    .appointment-item.completed {
      background-color: rgba(0, 204, 141, 0.05);
    }

    .appointment-order {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .order-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--primary);
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .appointment-time {
      font-weight: 600;
      color: var(--primary);
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .appointment-patient {
      overflow: hidden;
    }

    .patient-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .patient-phone {
      font-size: 0.8rem;
      color: var(--gray-700);
      margin-top: 0.25rem;
    }

    .history-info {
      font-size: 0.75rem;
      color: var(--gray-600);
      margin-top: 0.25rem;
      font-style: italic;
    }

    .appointment-status {
      white-space: nowrap;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.2rem 0.5rem;
      border-radius: 1rem;
      background-color: var(--warning);
      color: var(--dark);
    }

    .completed .status-badge {
      background-color: var(--success);
      color: var(--white);
    }

    .appointment-actions {
      display: flex;
      gap: 0.5rem;
    }

    .order-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .order-btn {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      border: 1px solid var(--gray-300);
      background-color: var(--white);
      color: var(--gray-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      cursor: pointer;
      transition: var(--transition);
    }

    .order-btn:hover:not(:disabled) {
      background-color: var(--gray-200);
      color: var(--gray-900);
    }

    .order-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .main-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      cursor: pointer;
      transition: var(--transition);
    }

    .action-btn.complete {
      background-color: var(--success);
      color: var(--white);
    }

    .action-btn.delete {
      background-color: var(--danger);
      color: var(--white);
    }

    .action-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 2rem;
      color: var(--gray-400);
      margin-bottom: 1rem;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: var(--gray-100);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-message {
      font-size: 0.9rem;
      color: var(--gray-600);
      font-weight: 500;
    }

    /* Modal footer */
    .modal-footer {
      border-top: 1px solid var(--gray-200);
      padding: 0.75rem 1rem;
    }

    /* Responsive styles */
    @media (max-width: 767px) {
      .appointment-item {
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto auto;
        padding: 0.75rem;
        gap: 0.5rem;
      }

      .appointment-order {
        grid-row: 1;
        grid-column: 1;
      }

      .appointment-time {
        grid-row: 1;
        grid-column: 2;
      }

      .appointment-status {
        grid-row: 1;
        grid-column: 3;
      }

      .appointment-patient {
        grid-row: 2;
        grid-column: 1 / span 2;
        padding-left: 2rem;
      }

      .appointment-actions {
        grid-row: 2;
        grid-column: 3;
        flex-direction: row;
      }

      .order-actions {
        flex-direction: row;
      }

      .main-actions {
        flex-direction: row;
      }
    }

    /* Ajout des styles pour le nouveau bouton */
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.75rem;
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      font-weight: 500;
      background: linear-gradient(45deg, var(--primary), var(--primary-dark));
      border: none;
      color: var(--white);
      transition: var(--transition);
      box-shadow: 0 2px 4px rgba(44, 123, 229, 0.2);
    }
    
    .view-all-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(44, 123, 229, 0.25);
    }
    
    .schedule-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background-color: var(--gray-100);
      border-bottom: 1px solid var(--gray-200);
    }
  `}</style>
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
        <Modal.Header
          closeButton
          className={`bg-${
            selectedRequest?.type === "patient"
              ? "info"
              : selectedRequest?.type === "consultation"
              ? "danger"
              : "primary"
          } text-white`}
        >
          <Modal.Title>
            <i
              className={`fas fa-${
                selectedRequest?.type === "patient"
                  ? "user-plus"
                  : selectedRequest?.type === "consultation"
                  ? "stethoscope"
                  : "calendar-alt"
              } me-2`}
            ></i>
            Détails de la demande
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div className="request-details">
              {selectedRequest.type === "patient" && (
                <>
                  <Row className="mb-4">
                    <Col md={3} className="text-center">
                      {selectedRequest.patientInfo?.photoURL ? (
                        <img
                          src={selectedRequest.patientInfo.photoURL}
                          alt="Photo du patient"
                          className="img-fluid rounded-circle mb-2"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="placeholder-avatar bg-light rounded-circle d-flex align-items-center justify-content-center mb-2"
                          style={{
                            width: "100px",
                            height: "100px",
                            margin: "0 auto",
                          }}
                        >
                          <i className="fas fa-user fa-3x text-secondary"></i>
                        </div>
                      )}
                    </Col>
                    <Col md={9}>
                      <p className="mb-1">
                        <strong>Nom:</strong>{" "}
                        {selectedRequest.patientInfo?.nom
                          ? `${selectedRequest.patientInfo.nom} ${
                              selectedRequest.patientInfo.prenom || ""
                            }`
                          : selectedRequest.patientName || "Patient"}
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
                          : selectedRequest.patientEmail ||
                            "Email non disponible"}
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
                        {selectedRequest.patientInfo?.insurances?.map(
                          (insurance, idx) => (
                            <Badge key={idx} bg="light" text="dark">
                              {insurance}
                            </Badge>
                          )
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Date de la demande:</strong>
                      </p>
                      <p>
                        {new Date(
                          selectedRequest.requestDate?.toDate()
                        ).toLocaleDateString()}
                      </p>
                    </Col>
                  </Row>
                  {selectedRequest.documents &&
                    selectedRequest.documents.length > 0 && (
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
                              onClick={() => window.open(doc, "_blank")}
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

              {selectedRequest.type === "consultation" && (
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
                        <strong>Date souhaitée:</strong>{" "}
                        {selectedRequest.preferredDateFormatted
                          ? selectedRequest.preferredDateFormatted.toLocaleDateString()
                          : "Non spécifiée"}
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
                        <strong>Date de la demande:</strong>{" "}
                        {selectedRequest?.requestDate
                          ? typeof selectedRequest.requestDate.toDate ===
                            "function"
                            ? new Date(
                                selectedRequest.requestDate.toDate()
                              ).toLocaleDateString()
                            : new Date(
                                selectedRequest.requestDate
                              ).toLocaleDateString()
                          : "Non spécifiée"}
                      </p>
                    </Col>
                  </Row>
                  <hr />
                  <h6 className="mb-3">
                    <i className="fas fa-comment-medical me-2"></i>
                    Motif de la consultation
                  </h6>
                  <div className="p-3 bg-light rounded">
                    {selectedRequest.reason || "Aucun motif spécifié"}
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

              {selectedRequest.type === "appointment" && (
                <>
                  <Row className="mb-4">
                    <Col md={6}>
                      <h6 className="mb-3">
                        <i className="fas fa-user me-2"></i>
                        Informations du patient
                      </h6>
                      <p className="mb-1">
                        <strong>Nom:</strong> {selectedRequest.patientInfo?.nom}{" "}
                        {selectedRequest.patientInfo?.prenom}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong>{" "}
                        {selectedRequest.patientInfo?.email}
                      </p>
                      <p className="mb-1">
                        <strong>Téléphone:</strong>{" "}
                        {selectedRequest.patientInfo?.telephone}
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
                        <strong>Date de la demande:</strong>{" "}
                        {selectedRequest.requestDateFormatted
                          ? selectedRequest.requestDateFormatted.toLocaleDateString()
                          : "Non spécifiée"}
                      </p>
                    </Col>
                  </Row>
                  <hr />
                  <h6 className="mb-3">
                    <i className="fas fa-comment-medical me-2"></i>
                    Récapitulatif de la demande
                  </h6>
                  <div className="p-3 bg-light rounded">
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                      {selectedRequest.requestText || "Aucun détail fourni"}
                    </pre>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRequestDetailsModal(false)}
          >
            Fermer
          </Button>
          {selectedRequest && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  if (selectedRequest.type === "patient") {
                    handlePatientRequest(
                      selectedRequest.id,
                      true,
                      "",
                      selectedRequest.patientInfo
                    );
                  } else if (selectedRequest.type === "consultation") {
                    handleConsultationRequest(selectedRequest.id, true);
                  } else if (selectedRequest.type === "appointment") {
                    handleAppointmentRequest(selectedRequest.id, true, {
                      day: selectedRequest.day,
                      timeSlot: selectedRequest.timeSlot,
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

      <Modal
        show={showSummaryModal}
        onHide={() => setShowSummaryModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-file-invoice-dollar me-2"></i>
            Récapitulatif des revenus
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {summaryData && (
            <div className="summary-container">
              <div className="text-center mb-4">
                <h4>Récapitulatif financier</h4>
                <h5>Dr. {summaryData.doctorName}</h5>
                <p className="text-muted">Période: {summaryData.period}</p>
                <p className="text-muted small">
                  Généré le {summaryData.generatedAt}
                </p>
              </div>

              {/* Onglets pour les différentes périodes */}
              <Tabs defaultActiveKey="total" className="mb-4">
                <Tab eventKey="total" title="Total">
                  <Row className="mt-3 mb-4">
                    <Col md={4}>
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <h3>{summaryData.totalRevenue.toFixed(2)} fcfa</h3>
                          <p className="mb-0">Revenus totaux</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="card bg-success text-white">
                        <div className="card-body text-center">
                          <h3>{summaryData.activeRevenue.toFixed(2)} fcfa</h3>
                          <p className="mb-0">Revenus actifs</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="card bg-secondary text-white">
                        <div className="card-body text-center">
                          <h3>{summaryData.deletedRevenue.toFixed(2)} fcfa</h3>
                          <p className="mb-0">Revenus archivés</p>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="stats-section p-3 bg-light rounded mb-4">
                    <h6 className="border-bottom pb-2">
                      Statistiques des consultations
                    </h6>
                    <Row>
                      <Col md={4}>
                        <p>
                          <strong>Total des consultations:</strong>{" "}
                          {summaryData.totalAppointments}
                        </p>
                      </Col>
                      <Col md={4}>
                        <p>
                          <strong>Consultations actives:</strong>{" "}
                          {summaryData.activeAppointments}
                        </p>
                      </Col>
                      <Col md={4}>
                        <p>
                          <strong>Consultations archivées:</strong>{" "}
                          {summaryData.deletedAppointments}
                        </p>
                      </Col>
                    </Row>
                  </div>
                </Tab>

                <Tab eventKey="daily" title="Journalier">
                  <div className="mt-3 p-3 border rounded">
                    <h6 className="border-bottom pb-2 mb-3">
                      Revenus du jour ({summaryData.today})
                    </h6>
                    <h6 className="border-bottom pb-2 mb-3">
                      Action ({summaryData.today})
                    </h6>

                    <Row>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-primary">
                            {summaryData.dailyRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Total du jour</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-success">
                            {summaryData.dailyActiveRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Revenus actifs</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-secondary">
                            {(
                              summaryData.dailyRevenue -
                              summaryData.dailyActiveRevenue
                            ).toFixed(2)}{" "}
                            fcfa
                          </h3>
                          <p className="mb-0">Revenus archivés</p>
                        </div>
                      </Col>
                    </Row>
                    <hr />
                    <p>
                      <strong>Consultations du jour:</strong>{" "}
                      {summaryData.dailyAppointments} (
                      {summaryData.dailyActiveAppointments} actives,{" "}
                      {summaryData.dailyAppointments -
                        summaryData.dailyActiveAppointments}{" "}
                      archivées)
                    </p>
                    <p>
                      <strong>Moyenne par consultation:</strong>{" "}
                      {summaryData.dailyAppointments > 0
                        ? (
                            summaryData.dailyRevenue /
                            summaryData.dailyAppointments
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                  </div>
                </Tab>

                <Tab eventKey="weekly" title="Hebdomadaire">
                  <div className="mt-3 p-3 border rounded">
                    <h6 className="border-bottom pb-2 mb-3">
                      Revenus de la semaine ({summaryData.weekStart} au{" "}
                      {summaryData.weekEnd})
                    </h6>
                    <Row>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-primary">
                            {summaryData.weeklyRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Total de la semaine</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-success">
                            {summaryData.weeklyActiveRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Revenus actifs</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-secondary">
                            {(
                              summaryData.weeklyRevenue -
                              summaryData.weeklyActiveRevenue
                            ).toFixed(2)}{" "}
                            fcfa
                          </h3>
                          <p className="mb-0">Revenus archivés</p>
                        </div>
                      </Col>
                    </Row>
                    <hr />
                    <p>
                      <strong>Consultations de la semaine:</strong>{" "}
                      {summaryData.weeklyAppointments} (
                      {summaryData.weeklyActiveAppointments} actives,{" "}
                      {summaryData.weeklyAppointments -
                        summaryData.weeklyActiveAppointments}{" "}
                      archivées)
                    </p>
                    <p>
                      <strong>Moyenne par jour:</strong>{" "}
                      {summaryData.daysWithAppointmentsThisWeek > 0
                        ? (
                            summaryData.weeklyRevenue /
                            summaryData.daysWithAppointmentsThisWeek
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                    <p>
                      <strong>Moyenne par consultation:</strong>{" "}
                      {summaryData.weeklyAppointments > 0
                        ? (
                            summaryData.weeklyRevenue /
                            summaryData.weeklyAppointments
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Répartition par jour de la semaine
                      </h6>
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Jour</th>
                            <th className="text-end">Consultations</th>
                            <th className="text-end">Revenus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(summaryData.weeklyBreakdown).map(
                            ([day, data]) => (
                              <tr key={day}>
                                <td>{day}</td>
                                <td className="text-end">{data.count}</td>
                                <td className="text-end">
                                  {data.amount.toFixed(2)} fcfa
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Tab>

                <Tab eventKey="monthly" title="Mensuel">
                  <div className="mt-3 p-3 border rounded">
                    <h6 className="border-bottom pb-2 mb-3">
                      Revenus du mois ({summaryData.monthName})
                    </h6>
                    <Row>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-primary">
                            {summaryData.monthlyRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Total du mois</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-success">
                            {summaryData.monthlyActiveRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Revenus actifs</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-secondary">
                            {(
                              summaryData.monthlyRevenue -
                              summaryData.monthlyActiveRevenue
                            ).toFixed(2)}{" "}
                            fcfa
                          </h3>
                          <p className="mb-0">Revenus archivés</p>
                        </div>
                      </Col>
                    </Row>
                    <hr />
                    <p>
                      <strong>Consultations du mois:</strong>{" "}
                      {summaryData.monthlyAppointments} (
                      {summaryData.monthlyActiveAppointments} actives,{" "}
                      {summaryData.monthlyAppointments -
                        summaryData.monthlyActiveAppointments}{" "}
                      archivées)
                    </p>
                    <p>
                      <strong>Moyenne par jour:</strong>{" "}
                      {summaryData.daysWithAppointmentsThisMonth > 0
                        ? (
                            summaryData.monthlyRevenue /
                            summaryData.daysWithAppointmentsThisMonth
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                    <p>
                      <strong>Moyenne par semaine:</strong>{" "}
                      {summaryData.weeksWithAppointmentsThisMonth > 0
                        ? (
                            summaryData.monthlyRevenue /
                            summaryData.weeksWithAppointmentsThisMonth
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                    <p>
                      <strong>Moyenne par consultation:</strong>{" "}
                      {summaryData.monthlyAppointments > 0
                        ? (
                            summaryData.monthlyRevenue /
                            summaryData.monthlyAppointments
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Répartition par semaine du mois
                      </h6>
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Semaine</th>
                            <th className="text-end">Consultations</th>
                            <th className="text-end">Revenus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            summaryData.monthlyBreakdownByWeek
                          ).map(([week, data]) => (
                            <tr key={week}>
                              <td>Semaine {week}</td>
                              <td className="text-end">{data.count}</td>
                              <td className="text-end">
                                {data.amount.toFixed(2)} fcfa
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Répartition par jour du mois
                      </h6>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <table className="table table-striped table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th className="text-end">Consultations</th>
                              <th className="text-end">Revenus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(
                              summaryData.monthlyBreakdownByDay
                            ).map(([date, data]) => (
                              <tr key={date}>
                                <td>{date}</td>
                                <td className="text-end">{data.count}</td>
                                <td className="text-end">
                                  {data.amount.toFixed(2)} fcfa
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab eventKey="yearly" title="Annuel">
                  <div className="mt-3 p-3 border rounded">
                    <h6 className="border-bottom pb-2 mb-3">
                      Revenus de l'année {summaryData.year}
                    </h6>
                    <Row>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-primary">
                            {summaryData.yearlyRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Total de l'année</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-success">
                            {summaryData.yearlyActiveRevenue.toFixed(2)} fcfa
                          </h3>
                          <p className="mb-0">Revenus actifs</p>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="text-center">
                          <h3 className="text-secondary">
                            {(
                              summaryData.yearlyRevenue -
                              summaryData.yearlyActiveRevenue
                            ).toFixed(2)}{" "}
                            fcfa
                          </h3>
                          <p className="mb-0">Revenus archivés</p>
                        </div>
                      </Col>
                    </Row>
                    <hr />
                    <p>
                      <strong>Consultations de l'année:</strong>{" "}
                      {summaryData.yearlyAppointments} (
                      {summaryData.yearlyActiveAppointments} actives,{" "}
                      {summaryData.yearlyAppointments -
                        summaryData.yearlyActiveAppointments}{" "}
                      archivées)
                    </p>
                    <p>
                      <strong>Moyenne par mois:</strong>{" "}
                      {summaryData.monthsWithAppointmentsThisYear > 0
                        ? (
                            summaryData.yearlyRevenue /
                            summaryData.monthsWithAppointmentsThisYear
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                    <p>
                      <strong>Moyenne par semaine:</strong>{" "}
                      {summaryData.weeksWithAppointmentsThisYear > 0
                        ? (
                            summaryData.yearlyRevenue /
                            summaryData.weeksWithAppointmentsThisYear
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>
                    <p>
                      <strong>Moyenne par consultation:</strong>{" "}
                      {summaryData.yearlyAppointments > 0
                        ? (
                            summaryData.yearlyRevenue /
                            summaryData.yearlyAppointments
                          ).toFixed(2)
                        : "0.00"}{" "}
                      fcfa
                    </p>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Répartition par mois
                      </h6>
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Mois</th>
                            <th className="text-end">Consultations</th>
                            <th className="text-end">Revenus</th>
                            <th className="text-end">Moyenne/Jour</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(
                            summaryData.yearlyBreakdownByMonth
                          ).map(([month, data]) => (
                            <tr key={month}>
                              <td>{getMonthName(parseInt(month))}</td>
                              <td className="text-end">{data.count}</td>
                              <td className="text-end">
                                {data.amount.toFixed(2)} fcfa
                              </td>
                              <td className="text-end">
                                {data.daysWithAppointments > 0
                                  ? (
                                      data.amount / data.daysWithAppointments
                                    ).toFixed(2)
                                  : "0.00"}{" "}
                                fcfa
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Évolution mensuelle
                      </h6>
                      <div style={{ height: "300px" }}>
                        {/* Ici, vous pourriez intégrer un graphique avec Chart.js ou une autre bibliothèque */}
                        <div style={{ height: "300px" }}>
                          <Bar
                            data={{
                              labels: Object.keys(
                                summaryData.yearlyBreakdownByMonth
                              ).map((month) => getMonthName(parseInt(month))),
                              datasets: [
                                {
                                  label: "Revenus mensuels",
                                  data: Object.values(
                                    summaryData.yearlyBreakdownByMonth
                                  ).map((data) => data.amount),
                                  backgroundColor: "rgba(53, 162, 235, 0.5)",
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "top",
                                },
                                title: {
                                  display: true,
                                  text: `Évolution des revenus mensuels ${summaryData.year}`,
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                <Tab eventKey="days" title="Par jour">
                  <div className="mt-3">
                    <h6 className="border-bottom pb-2 mb-3">
                      Répartition par jour de la semaine
                    </h6>
                    <Row>
                      {Object.entries(summaryData.revenueByDayOfWeek).map(
                        ([day, data]) => (
                          <Col md={4} key={day} className="mb-3">
                            <div className="p-3 border rounded">
                              <h6 className="text-primary">{day}</h6>
                              <div className="d-flex justify-content-between">
                                <span>Consultations:</span>
                                <strong>{data.count}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Revenus:</span>
                                <strong>{data.amount.toFixed(2)} fcfa</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Moyenne/consultation:</span>
                                <strong>
                                  {data.count > 0
                                    ? (data.amount / data.count).toFixed(2)
                                    : "0.00"}{" "}
                                  fcfa
                                </strong>
                              </div>
                            </div>
                          </Col>
                        )
                      )}
                    </Row>

                    <div className="mt-4">
                      <h6 className="border-bottom pb-2">
                        Comparaison des jours
                      </h6>
                      <div style={{ height: "300px" }}>
                        {/* Ici, vous pourriez intégrer un graphique avec Chart.js ou une autre bibliothèque */}
                        <div style={{ height: "300px" }}>
                          <Bar
                            data={{
                              labels: Object.keys(
                                summaryData.revenueByDayOfWeek
                              ),
                              datasets: [
                                {
                                  label: "Revenus par jour",
                                  data: Object.values(
                                    summaryData.revenueByDayOfWeek
                                  ).map((data) => data.amount),
                                  backgroundColor: "rgba(75, 192, 192, 0.5)",
                                },
                                {
                                  label: "Nombre de consultations",
                                  data: Object.values(
                                    summaryData.revenueByDayOfWeek
                                  ).map((data) => data.count),
                                  backgroundColor: "rgba(255, 159, 64, 0.5)",
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "top",
                                },
                                title: {
                                  display: true,
                                  text: "Comparaison des revenus par jour de la semaine",
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>

              <div className="text-center mt-4">
                <Button
                  variant="primary"
                  onClick={() => exportSummaryData(selectedDoctorForDetails.id)}
                >
                  <i className="fas fa-file-pdf me-2"></i>
                  Télécharger en PDF
                </Button>
                <Button
                  variant="outline-primary"
                  className="ms-2"
                  onClick={() =>
                    exportSummaryDataCSV(selectedDoctorForDetails.id)
                  }
                >
                  <i className="fas fa-file-csv me-2"></i>
                  Exporter en CSV
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modale pour ajouter/modifier une annonce */}
      <Modal
        show={showAddAnnouncementModal}
        onHide={() => {
          setShowAddAnnouncementModal(false);
          setEditingAnnouncement(null);
          setAttachmentFiles([]);
        }}
        size="lg"
      >
        <Modal.Header
          closeButton
          className={
            editingAnnouncement ? "bg-warning text-dark" : "bg-info text-white"
          }
        >
          <Modal.Title>
            <i className="fas fa-bullhorn me-2"></i>
            {editingAnnouncement ? "Modifier l'annonce" : "Nouvelle annonce"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre de l'annonce</Form.Label>
              <Form.Control
                type="text"
                value={
                  editingAnnouncement
                    ? editingAnnouncement.title
                    : newAnnouncement.title
                }
                onChange={(e) => {
                  if (editingAnnouncement) {
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      title: e.target.value,
                    });
                  } else {
                    setNewAnnouncement({
                      ...newAnnouncement,
                      title: e.target.value,
                    });
                  }
                }}
                placeholder="Titre concis et informatif"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contenu de l'annonce</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={
                  editingAnnouncement
                    ? editingAnnouncement.content
                    : newAnnouncement.content
                }
                onChange={(e) => {
                  if (editingAnnouncement) {
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      content: e.target.value,
                    });
                  } else {
                    setNewAnnouncement({
                      ...newAnnouncement,
                      content: e.target.value,
                    });
                  }
                }}
                placeholder="Détails de l'annonce..."
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Priorité</Form.Label>
                  <Form.Select
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.priority
                        : newAnnouncement.priority
                    }
                    onChange={(e) => {
                      if (editingAnnouncement) {
                        setEditingAnnouncement({
                          ...editingAnnouncement,
                          priority: e.target.value,
                        });
                      } else {
                        setNewAnnouncement({
                          ...newAnnouncement,
                          priority: e.target.value,
                        });
                      }
                    }}
                  >
                    <option value="high">Haute - Urgent</option>
                    <option value="normal">Normale</option>
                    <option value="low">Basse - Information</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date d'expiration (optionnelle)</Form.Label>
                  <Form.Control
                    type="date"
                    value={
                      editingAnnouncement
                        ? editingAnnouncement.expiryDate
                          ? editingAnnouncement.expiryDate.substring(0, 10)
                          : ""
                        : newAnnouncement.expiryDate
                    }
                    onChange={(e) => {
                      if (editingAnnouncement) {
                        setEditingAnnouncement({
                          ...editingAnnouncement,
                          expiryDate: e.target.value,
                        });
                      } else {
                        setNewAnnouncement({
                          ...newAnnouncement,
                          expiryDate: e.target.value,
                        });
                      }
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Audience cible</Form.Label>
              <Form.Select
                value={
                  editingAnnouncement
                    ? editingAnnouncement.targetAudience
                    : newAnnouncement.targetAudience
                }
                onChange={(e) => {
                  if (editingAnnouncement) {
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      targetAudience: e.target.value,
                    });
                  } else {
                    setNewAnnouncement({
                      ...newAnnouncement,
                      targetAudience: e.target.value,
                    });
                  }
                }}
              >
                <option value="all">
                  Tous les médecins (même non affiliés)
                </option>
                <option value="affiliated">
                  Uniquement les médecins affiliés
                </option>
                <option value="specialty">Par spécialité</option>
              </Form.Select>
            </Form.Group>

            {(editingAnnouncement
              ? editingAnnouncement.targetAudience
              : newAnnouncement.targetAudience) === "specialty" && (
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner les spécialités</Form.Label>
                <Select
                  isMulti
                  name="specialties"
                  options={specialtyOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={
                    editingAnnouncement
                      ? editingAnnouncement.selectedSpecialties.map((s) => ({
                          value: s,
                          label: s,
                        }))
                      : newAnnouncement.selectedSpecialties.map((s) => ({
                          value: s,
                          label: s,
                        }))
                  }
                  onChange={(selectedOptions) => {
                    const selectedValues = selectedOptions.map(
                      (option) => option.value
                    );
                    if (editingAnnouncement) {
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        selectedSpecialties: selectedValues,
                      });
                    } else {
                      setNewAnnouncement({
                        ...newAnnouncement,
                        selectedSpecialties: selectedValues,
                      });
                    }
                  }}
                  placeholder="Sélectionnez les spécialités..."
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Pièces jointes (optionnelles)</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => setAttachmentFiles(Array.from(e.target.files))}
              />
              <Form.Text className="text-muted">
                Vous pouvez joindre des documents, images ou fichiers PDF (max
                5MB par fichier)
              </Form.Text>
            </Form.Group>

            {editingAnnouncement &&
              editingAnnouncement.attachments &&
              editingAnnouncement.attachments.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2">Pièces jointes existantes:</p>
                  <div className="d-flex flex-wrap gap-2">
                    {editingAnnouncement.attachments.map(
                      (attachment, index) => (
                        <Button
                          key={index}
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => window.open(attachment, "_blank")}
                        >
                          <i className="fas fa-paperclip me-1"></i>
                          Pièce jointe {index + 1}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddAnnouncementModal(false);
              setEditingAnnouncement(null);
              setAttachmentFiles([]);
            }}
          >
            Annuler
          </Button>
          <Button
            variant={editingAnnouncement ? "warning" : "info"}
            onClick={
              editingAnnouncement
                ? handleEditAnnouncement
                : handleAddAnnouncement
            }
          >
            <i
              className={`fas ${
                editingAnnouncement ? "fa-save" : "fa-paper-plane"
              } me-2`}
            ></i>
            {editingAnnouncement
              ? "Enregistrer les modifications"
              : "Publier l'annonce"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale pour afficher les détails d'une annonce */}
      {/* Modale pour afficher les détails d'une annonce */}
      <Modal
        show={showAnnouncementDetailsModal}
        onHide={() => setShowAnnouncementDetailsModal(false)}
        size="lg"
      >
        <Modal.Header
          closeButton
          className={
            selectedAnnouncement?.priority === "high"
              ? "bg-danger text-white"
              : selectedAnnouncement?.priority === "low"
              ? "bg-info text-white"
              : "bg-primary text-white"
          }
        >
          <Modal.Title>
            <i className="fas fa-bullhorn me-2"></i>
            {selectedAnnouncement?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAnnouncement && (
            <div className="announcement-details">
              <div className="announcement-meta mb-4">
                <div className="d-flex flex-wrap gap-3">
                  <div>
                    <i className="far fa-calendar-alt me-2 text-muted"></i>
                    <strong>Publiée le:</strong>{" "}
                    {new Date(
                      selectedAnnouncement.createdAt
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div>
                    <i className="fas fa-flag me-2 text-muted"></i>
                    <strong>Priorité:</strong>{" "}
                    {selectedAnnouncement.priority === "high"
                      ? "Haute (Urgent)"
                      : selectedAnnouncement.priority === "low"
                      ? "Basse (Information)"
                      : "Normale"}
                  </div>
                  <div>
                    <i className="fas fa-users me-2 text-muted"></i>
                    <strong>Cible:</strong>{" "}
                    {selectedAnnouncement.targetAudience === "all"
                      ? "Tous les médecins"
                      : selectedAnnouncement.targetAudience === "affiliated"
                      ? "Médecins affiliés"
                      : "Spécialités spécifiques"}
                  </div>
                </div>

                {selectedAnnouncement.expiryDate && (
                  <div className="mt-2">
                    <i className="fas fa-calendar-times me-2 text-muted"></i>
                    <strong>Expire le:</strong>{" "}
                    {new Date(
                      selectedAnnouncement.expiryDate
                    ).toLocaleDateString()}
                  </div>
                )}

                {selectedAnnouncement.targetAudience === "specialty" &&
                  selectedAnnouncement.selectedSpecialties && (
                    <div className="mt-3">
                      <p className="mb-2">
                        <strong>Spécialités ciblées:</strong>
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedAnnouncement.selectedSpecialties.map(
                          (specialty, index) => (
                            <span key={index} className="badge bg-primary">
                              {specialty}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <div className="announcement-content mb-4">
                <h6 className="border-bottom pb-2 mb-3">
                  Contenu de l'annonce
                </h6>
                <div className="p-3 bg-light rounded">
                  {selectedAnnouncement.content
                    .split("\n")
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>
              </div>

              {selectedAnnouncement.attachments &&
                selectedAnnouncement.attachments.length > 0 && (
                  <div className="announcement-attachments mb-4">
                    <h6 className="border-bottom pb-2 mb-3">Pièces jointes</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {selectedAnnouncement.attachments.map(
                        (attachment, index) => {
                          const isImage = attachment.match(
                            /\.(jpeg|jpg|gif|png)$/i
                          );
                          const isPdf = attachment.match(/\.(pdf)$/i);

                          return (
                            <div
                              key={index}
                              className="attachment-item border rounded p-2 text-center"
                            >
                              {isImage ? (
                                <div>
                                  <img
                                    src={attachment}
                                    alt={`Pièce jointe ${index + 1}`}
                                    className="img-thumbnail mb-2"
                                    style={{
                                      maxWidth: "150px",
                                      maxHeight: "150px",
                                    }}
                                  />
                                  <div>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-external-link-alt me-1"></i>
                                      Ouvrir
                                    </Button>
                                  </div>
                                </div>
                              ) : isPdf ? (
                                <div>
                                  <div className="pdf-icon mb-2">
                                    <i className="fas fa-file-pdf fa-3x text-danger"></i>
                                  </div>
                                  <div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-file-pdf me-1"></i>
                                      Ouvrir le PDF
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="file-icon mb-2">
                                    <i className="fas fa-file fa-3x text-primary"></i>
                                  </div>
                                  <div>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-download me-1"></i>
                                      Télécharger
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Section des réponses des médecins */}
              <div className="announcement-replies mb-4">
                <h6 className="border-bottom pb-2 mb-3">
                  <i className="fas fa-comments me-2"></i>
                  Réponses des médecins
                  {announcementReplies[selectedAnnouncement.id]?.length > 0 && (
                    <Badge bg="primary" pill className="ms-2">
                      {announcementReplies[selectedAnnouncement.id].length}
                    </Badge>
                  )}
                </h6>

                {announcementReplies[selectedAnnouncement.id]?.length > 0 ? (
                  <div
                    className="replies-list mb-4"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {announcementReplies[selectedAnnouncement.id].map(
                      (reply, index) => (
                        <div
                          key={index}
                          className={`reply-item p-3 mb-3 rounded ${
                            reply.isFromStructure
                              ? "bg-light-primary border-left-primary"
                              : "bg-light"
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center">
                              <div className="me-2">
                                {reply.isFromStructure ? (
                                  <i className="fas fa-hospital fa-2x text-primary"></i>
                                ) : reply.doctorPhoto ? (
                                  <img
                                    src={reply.doctorPhoto}
                                    alt=""
                                    className="rounded-circle"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                                    style={{ width: "40px", height: "40px" }}
                                  >
                                    <i className="fas fa-user-md"></i>
                                  </div>
                                )}
                              </div>
                              <div>
                                <strong>
                                  {reply.isFromStructure
                                    ? `${structure.name} (Structure)`
                                    : reply.doctorName || "Médecin"}
                                </strong>
                                <div className="text-muted small">
                                  <i className="far fa-clock me-1"></i>
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleDateString()}{" "}
                                  à{" "}
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>

                            {reply.isFromStructure && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAnnouncementReply(
                                    selectedAnnouncement.id,
                                    index
                                  )
                                }
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            )}
                          </div>
                          <div className="reply-content mt-2">
                            {reply.content}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted fst-italic">
                    Aucune réponse pour le moment.
                  </p>
                )}

                {/* Formulaire pour répondre à l'annonce */}
                <div className="reply-form mt-4">
                  <h6 className="mb-3">
                    <i className="fas fa-reply me-2"></i>
                    Répondre à cette annonce
                  </h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={newAnnouncementReply}
                        onChange={(e) =>
                          setNewAnnouncementReply(e.target.value)
                        }
                        placeholder="Écrivez votre réponse ici..."
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        onClick={() =>
                          handleSubmitAnnouncementReply(selectedAnnouncement.id)
                        }
                        disabled={
                          !newAnnouncementReply.trim() || isSubmittingReply
                        }
                      >
                        {isSubmittingReply ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Envoyer la réponse
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>

              <div className="announcement-stats">
                <h6 className="border-bottom pb-2 mb-3">
                  Statistiques de lecture
                </h6>

                {announcementStats[selectedAnnouncement.id] ? (
                  <div>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Taux de lecture:</span>
                        <span>
                          {announcementStats[selectedAnnouncement.id].readCount}{" "}
                          sur {doctors.length} médecins (
                          {doctors.length > 0
                            ? Math.round(
                                (announcementStats[selectedAnnouncement.id]
                                  .readCount /
                                  doctors.length) *
                                  100
                              )
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width: `${
                              doctors.length > 0
                                ? Math.round(
                                    (announcementStats[selectedAnnouncement.id]
                                      .readCount /
                                      doctors.length) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                          aria-valuenow={
                            doctors.length > 0
                              ? Math.round(
                                  (announcementStats[selectedAnnouncement.id]
                                    .readCount /
                                    doctors.length) *
                                    100
                                )
                              : 0
                          }
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>

                    {announcementStats[selectedAnnouncement.id].readers.length >
                      0 && (
                      <div>
                        <p className="mb-2">
                          <strong>Lu par:</strong>
                        </p>
                        <div
                          className="readers-list"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          <table className="table table-sm table-striped">
                            <thead>
                              <tr>
                                <th>Médecin</th>
                                <th>Spécialité</th>
                                <th>Date de lecture</th>
                              </tr>
                            </thead>
                            <tbody>
                              {announcementStats[
                                selectedAnnouncement.id
                              ].readers.map((readerId, index) => {
                                const doctor = doctors.find(
                                  (d) => d.id === readerId
                                );
                                return doctor ? (
                                  <tr key={index}>
                                    <td>
                                      {doctor.nom} {doctor.prenom}
                                    </td>
                                    <td>{doctor.specialite}</td>
                                    <td>-</td>
                                  </tr>
                                ) : null;
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted">
                    Aucune statistique disponible pour cette annonce.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAnnouncementDetailsModal(false)}
          >
            Fermer
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setEditingAnnouncement(selectedAnnouncement);
              setShowAnnouncementDetailsModal(false);
              setShowAddAnnouncementModal(true);
            }}
          >
            <i className="fas fa-edit me-2"></i>
            Modifier
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              handleDeleteAnnouncement(selectedAnnouncement.id);
              setShowAnnouncementDetailsModal(false);
            }}
          >
            <i className="fas fa-trash me-2"></i>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale pour les détails de rendez-vous rapide */}
      <Modal
        show={showQuickAppointmentDetails}
        onHide={() => setShowQuickAppointmentDetails(false)}
        size="lg"
      >
        <Modal.Header
          closeButton
          className={
            selectedQuickAppointment?.status === "pending"
              ? "bg-warning text-dark"
              : selectedQuickAppointment?.status === "confirmed"
              ? "bg-success text-white"
              : selectedQuickAppointment?.status === "rejected"
              ? "bg-danger text-white"
              : "bg-primary text-white"
          }
        >
          <Modal.Title>
            <i className="fas fa-calendar-check me-2"></i>
            Détails du rendez-vous rapide
            {selectedQuickAppointment?.status === "pending" && (
              <Badge bg="light" text="dark" className="ms-2">
                En attente
              </Badge>
            )}
            {selectedQuickAppointment?.status === "confirmed" && (
              <Badge bg="light" text="success" className="ms-2">
                Confirmé
              </Badge>
            )}
            {selectedQuickAppointment?.status === "rejected" && (
              <Badge bg="light" text="danger" className="ms-2">
                Refusé
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQuickAppointment && (
            <div className="request-details">
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-3 border-bottom pb-2">
                  <i className="fas fa-info-circle me-2"></i>
                  Informations générales
                </h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Code d'accès:</strong>{" "}
                      <span className="badge bg-primary">
                        {selectedQuickAppointment.accessCode}
                      </span>
                    </p>
                    <p className="mb-2">
                      <strong>Date de création:</strong>{" "}
                      {selectedQuickAppointment.createdAtDate
                        ? selectedQuickAppointment.createdAtDate.toLocaleString()
                        : "Non spécifiée"}
                    </p>
                    <p className="mb-2">
                      <strong>Statut actuel:</strong>{" "}
                      <Badge
                        bg={
                          selectedQuickAppointment.status === "pending"
                            ? "warning"
                            : selectedQuickAppointment.status === "confirmed"
                            ? "success"
                            : selectedQuickAppointment.status === "rejected"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {selectedQuickAppointment.status === "pending"
                          ? "En attente"
                          : selectedQuickAppointment.status === "confirmed"
                          ? "Confirmé"
                          : selectedQuickAppointment.status === "rejected"
                          ? "Refusé"
                          : "Inconnu"}
                      </Badge>
                    </p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Service demandé:</strong>{" "}
                      {selectedQuickAppointment.service}
                    </p>
                    <p className="mb-2">
                      <strong>Date du rendez-vous:</strong>{" "}
                      {new Date(
                        selectedQuickAppointment.appointmentDate
                      ).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mb-2">
                      <strong>Heure du rendez-vous:</strong>{" "}
                      {selectedQuickAppointment.appointmentTime}
                    </p>
                  </Col>
                </Row>
              </div>

              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-3 border-bottom pb-2">
                  <i className="fas fa-user me-2"></i>
                  Informations du patient
                </h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-2">
                      <strong>Nom complet:</strong>{" "}
                      {selectedQuickAppointment.patientName}
                    </p>
                    <p className="mb-2">
                      <strong>Email:</strong>{" "}
                      {selectedQuickAppointment.patientEmail}
                    </p>
                    <p className="mb-2">
                      <strong>Téléphone:</strong>{" "}
                      {selectedQuickAppointment.patientPhone}
                    </p>
                  </Col>
                  <Col md={6}>
                    {selectedQuickAppointment.message &&
                      selectedQuickAppointment.message !==
                        "Aucun message supplémentaire" && (
                        <div>
                          <p className="mb-2">
                            <strong>Message du patient:</strong>
                          </p>
                          <div className="p-2 bg-white border rounded">
                            {selectedQuickAppointment.message}
                          </div>
                        </div>
                      )}
                  </Col>
                </Row>
              </div>

              <div className="mt-4">
                <h6 className="mb-3 border-bottom pb-2">
                  <i className="fas fa-reply me-2"></i>
                  Votre réponse
                </h6>
                <Form.Group className="mb-3">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={quickAppointmentResponse}
                    onChange={(e) =>
                      setQuickAppointmentResponse(e.target.value)
                    }
                    placeholder="Écrivez votre réponse ici..."
                  />
                  <Form.Text className="text-muted">
                    Cette réponse sera visible par le patient lorsqu'il
                    consultera le statut de sa demande avec son code d'accès.
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowQuickAppointmentDetails(false)}
          >
            Fermer
          </Button>

          {selectedQuickAppointment?.status === "pending" && (
            <>
              <Button
                variant="danger"
                onClick={() =>
                  handleQuickAppointmentResponse(
                    selectedQuickAppointment.id,
                    false
                  )
                }
              >
                <i className="fas fa-times me-1"></i>
                Refuser la demande
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  handleQuickAppointmentResponse(
                    selectedQuickAppointment.id,
                    true
                  )
                }
              >
                <i className="fas fa-check me-1"></i>
                Accepter la demande
              </Button>
            </>
          )}

          {(selectedQuickAppointment?.status === "confirmed" ||
            selectedQuickAppointment?.status === "rejected") && (
            <>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    const appointmentRef = doc(
                      db,
                      "appointments",
                      selectedQuickAppointment.id
                    );
                    await updateDoc(appointmentRef, {
                      response: quickAppointmentResponse,
                      updatedAt: serverTimestamp(),
                    });
                    setMessage("Réponse mise à jour avec succès");
                    setShowQuickAppointmentDetails(false);
                  } catch (error) {
                    console.error(
                      "Erreur lors de la mise à jour de la réponse:",
                      error
                    );
                    setMessage("Erreur lors de la mise à jour de la réponse");
                  }
                }}
              >
                <i className="fas fa-save me-1"></i>
                Mettre à jour la réponse
              </Button>

              <Button
                variant="danger"
                onClick={() =>
                  handleDeleteQuickAppointment(selectedQuickAppointment.id)
                }
              >
                <i className="fas fa-trash me-1"></i>
                Supprimer
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modale pour afficher la liste des annonces des médecins */}
      <Modal
        show={showDoctorAnnouncementsModal}
        onHide={() => setShowDoctorAnnouncementsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-bullhorn me-2"></i>
            Annonces des médecins
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="p-3 bg-light border-bottom">
            <Row className="align-items-center">
              <Col md={8}>
                <h6 className="mb-0">
                  {doctorAnnouncements.length} annonce(s) -
                  {doctorAnnouncements.filter((a) => !a.read).length} non lue(s)
                </h6>
              </Col>
              <Col md={4}>
                <ButtonGroup className="w-100">
                  <Button
                    variant={
                      doctorAnnouncementFilter === "all"
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => setDoctorAnnouncementFilter("all")}
                  >
                    Toutes
                  </Button>
                  <Button
                    variant={
                      doctorAnnouncementFilter === "unread"
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => setDoctorAnnouncementFilter("unread")}
                  >
                    Non lues
                  </Button>
                  <Button
                    variant={
                      doctorAnnouncementFilter === "read"
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() => setDoctorAnnouncementFilter("read")}
                  >
                    Lues
                  </Button>
                </ButtonGroup>
              </Col>
            </Row>
          </div>

          <div
            className="announcements-list"
            style={{ maxHeight: "600px", overflowY: "auto" }}
          >
            {doctorAnnouncements.filter((announcement) => {
              if (doctorAnnouncementFilter === "unread")
                return !announcement.read;
              if (doctorAnnouncementFilter === "read") return announcement.read;
              return true;
            }).length > 0 ? (
              doctorAnnouncements
                .filter((announcement) => {
                  if (doctorAnnouncementFilter === "unread")
                    return !announcement.read;
                  if (doctorAnnouncementFilter === "read")
                    return announcement.read;
                  return true;
                })
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`announcement-item p-3 border-bottom ${
                      !announcement.read ? "bg-light" : ""
                    } ${
                      announcement.priority === "high"
                        ? "border-left-danger"
                        : announcement.priority === "low"
                        ? "border-left-info"
                        : ""
                    }`}
                    onClick={() => viewDoctorAnnouncementDetails(announcement)}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <h6 className="mb-0 me-2">{announcement.title}</h6>
                          {announcement.priority === "high" && (
                            <Badge bg="danger" pill>
                              Prioritaire
                            </Badge>
                          )}
                          {!announcement.read && (
                            <Badge bg="primary" pill className="ms-2">
                              Nouveau
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted mb-1">
                          <i className="far fa-user-md me-1"></i>
                          De: {announcement.creatorName || "Médecin"}
                          <span className="mx-2">|</span>
                          <i className="far fa-clock me-1"></i>
                          {new Date(announcement.createdAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <p className="mb-2">
                          {announcement.content.length > 100
                            ? `${announcement.content.substring(0, 100)}...`
                            : announcement.content}
                        </p>

                        {announcement.attachments?.length > 0 && (
                          <small className="text-muted">
                            <i className="fas fa-paperclip me-1"></i>
                            {announcement.attachments.length} pièce(s) jointe(s)
                          </small>
                        )}
                      </div>

                      <div className="ms-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-circle"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">
                  Aucune annonce{" "}
                  {doctorAnnouncementFilter === "unread"
                    ? "non lue"
                    : doctorAnnouncementFilter === "read"
                    ? "lue"
                    : ""}
                </h5>
                <p className="text-muted">
                  Les annonces des médecins apparaîtront ici
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDoctorAnnouncementsModal(false)}
          >
            Fermer
          </Button>
          <Button variant="primary" onClick={loadDoctorAnnouncements}>
            <i className="fas fa-sync-alt me-2"></i>
            Actualiser
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modale pour afficher les détails d'une annonce de médecin */}
      <Modal
        show={showDoctorAnnouncementDetailsModal}
        onHide={() => setShowDoctorAnnouncementDetailsModal(false)}
        size="lg"
      >
        <Modal.Header
          closeButton
          className={
            selectedDoctorAnnouncement?.priority === "high"
              ? "bg-danger text-white"
              : selectedDoctorAnnouncement?.priority === "low"
              ? "bg-info text-white"
              : "bg-primary text-white"
          }
        >
          <Modal.Title>
            <i className="fas fa-bullhorn me-2"></i>
            {selectedDoctorAnnouncement?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDoctorAnnouncement && (
            <div className="announcement-details">
              <div className="announcement-meta mb-4">
                <div className="d-flex flex-wrap gap-3">
                  <div className="creator-info d-flex align-items-center mb-2">
                    {selectedDoctorAnnouncement.creatorPhoto ? (
                      <img
                        src={selectedDoctorAnnouncement.creatorPhoto}
                        alt=""
                        className="rounded-circle me-2"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                        style={{ width: "40px", height: "40px" }}
                      >
                        <i className="fas fa-user-md"></i>
                      </div>
                    )}
                    <div>
                      <strong>Publié par:</strong>{" "}
                      {selectedDoctorAnnouncement.creatorName || "Médecin"}
                      {selectedDoctorAnnouncement.creatorSpecialty && (
                        <small className="d-block text-muted">
                          {selectedDoctorAnnouncement.creatorSpecialty}
                        </small>
                      )}
                    </div>
                  </div>

                  <div>
                    <i className="far fa-calendar-alt me-2 text-muted"></i>
                    <strong>Publiée le:</strong>{" "}
                    {new Date(
                      selectedDoctorAnnouncement.createdAt
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div>
                    <i className="fas fa-flag me-2 text-muted"></i>
                    <strong>Priorité:</strong>{" "}
                    {selectedDoctorAnnouncement.priority === "high"
                      ? "Haute (Urgent)"
                      : selectedDoctorAnnouncement.priority === "low"
                      ? "Basse (Information)"
                      : "Normale"}
                  </div>
                </div>

                {selectedDoctorAnnouncement.expiryDate && (
                  <div className="mt-2">
                    <i className="fas fa-calendar-times me-2 text-muted"></i>
                    <strong>Expire le:</strong>{" "}
                    {new Date(
                      selectedDoctorAnnouncement.expiryDate
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="announcement-content mb-4">
                <h6 className="border-bottom pb-2 mb-3">
                  Contenu de l'annonce
                </h6>
                <div className="p-3 bg-light rounded">
                  {selectedDoctorAnnouncement.content
                    .split("\n")
                    .map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                </div>
              </div>

              {selectedDoctorAnnouncement.attachments &&
                selectedDoctorAnnouncement.attachments.length > 0 && (
                  <div className="announcement-attachments mb-4">
                    <h6 className="border-bottom pb-2 mb-3">Pièces jointes</h6>
                    <div className="d-flex flex-wrap gap-3">
                      {selectedDoctorAnnouncement.attachments.map(
                        (attachment, index) => {
                          const isImage = attachment.match(
                            /\.(jpeg|jpg|gif|png)$/i
                          );
                          const isPdf = attachment.match(/\.(pdf)$/i);

                          return (
                            <div
                              key={index}
                              className="attachment-item border rounded p-2 text-center"
                            >
                              {isImage ? (
                                <div>
                                  <img
                                    src={attachment}
                                    alt={`Pièce jointe ${index + 1}`}
                                    className="img-thumbnail mb-2"
                                    style={{
                                      maxWidth: "150px",
                                      maxHeight: "150px",
                                    }}
                                  />
                                  <div>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-external-link-alt me-1"></i>
                                      Ouvrir
                                    </Button>
                                  </div>
                                </div>
                              ) : isPdf ? (
                                <div>
                                  <div className="pdf-icon mb-2">
                                    <i className="fas fa-file-pdf fa-3x text-danger"></i>
                                  </div>
                                  <div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-file-pdf me-1"></i>
                                      Ouvrir le PDF
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="file-icon mb-2">
                                    <i className="fas fa-file fa-3x text-primary"></i>
                                  </div>
                                  <div>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() =>
                                        window.open(attachment, "_blank")
                                      }
                                    >
                                      <i className="fas fa-download me-1"></i>
                                      Télécharger
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Section des réponses */}
              <div className="announcement-replies mb-4">
                <h6 className="border-bottom pb-2 mb-3">
                  <i className="fas fa-comments me-2"></i>
                  Réponses
                  {selectedDoctorAnnouncement.responses?.length > 0 && (
                    <Badge bg="primary" pill className="ms-2">
                      {selectedDoctorAnnouncement.responses.length}
                    </Badge>
                  )}
                </h6>

                {selectedDoctorAnnouncement.responses?.length > 0 ? (
                  <div
                    className="replies-list mb-4"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {selectedDoctorAnnouncement.responses.map(
                      (reply, index) => (
                        <div
                          key={index}
                          className={`reply-item p-3 mb-3 rounded ${
                            reply.isFromStructure
                              ? "bg-light-primary border-left-primary"
                              : "bg-light"
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center">
                              <div className="me-2">
                                {reply.isFromStructure ? (
                                  <i className="fas fa-hospital fa-2x text-primary"></i>
                                ) : reply.responderPhoto ? (
                                  <img
                                    src={reply.responderPhoto}
                                    alt=""
                                    className="rounded-circle"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                                    style={{ width: "40px", height: "40px" }}
                                  >
                                    <i className="fas fa-user-md"></i>
                                  </div>
                                )}
                              </div>
                              <div>
                                <strong>
                                  {reply.isFromStructure
                                    ? `${structure.name} (Structure)`
                                    : reply.responderName || "Médecin"}
                                </strong>
                                <div className="text-muted small">
                                  <i className="far fa-clock me-1"></i>
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleDateString()}{" "}
                                  à{" "}
                                  {new Date(
                                    reply.createdAt
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="reply-content mt-2">
                            {reply.content}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted fst-italic">
                    Aucune réponse pour le moment.
                  </p>
                )}

                {/* Formulaire pour répondre à l'annonce */}
                <div className="reply-form mt-4">
                  <h6 className="mb-3">
                    <i className="fas fa-reply me-2"></i>
                    Répondre à cette annonce
                  </h6>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={newAnnouncementReply}
                        onChange={(e) =>
                          setNewAnnouncementReply(e.target.value)
                        }
                        placeholder="Écrivez votre réponse ici..."
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        onClick={() =>
                          handleSubmitAnnouncementReply(
                            selectedDoctorAnnouncement.id
                          )
                        }
                        disabled={
                          !newAnnouncementReply.trim() || isSubmittingReply
                        }
                      >
                        {isSubmittingReply ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Envoyer la réponse
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDoctorAnnouncementDetailsModal(false)}
          >
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StructuresDashboard;