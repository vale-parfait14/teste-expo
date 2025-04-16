import React, { useState, useRef, useCallback, useEffect } from "react";
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
  FaCheck,
  FaMoneyBillWave,
  FaCreditCard
} from "react-icons/fa";
import { useMediaQuery } from "react-responsive";
import Select from "react-select";
import PatientDemande from "./PatientDemande.js";
import PatientMessaging from "./PatientMessaging.js"
import { QRCodeCanvas } from "qrcode.react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Composant pour le paiement PayTech
const PayTechPayment = ({ 
  show, 
  onHide, 
  amount = 200, 
  description = "Frais de dossier pour rendez-vous médical", 
  patientInfo,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const payTechInitialized = useRef(false);
  
  // Fonction pour charger le script PayTech
  useEffect(() => {
    if (!show) return;
    
    const loadPayTechScript = () => {
      // Vérifier si le script est déjà chargé
      if (document.querySelector('script[src="https://paytech.sn/cdn/paytech.min.js"]')) {
        setScriptLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://paytech.sn/cdn/paytech.min.js';
      script.async = true;
      script.onload = () => {
        console.log("Script PayTech chargé avec succès");
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error("Échec du chargement du script PayTech");
        setError("Impossible de charger le système de paiement. Veuillez réessayer ultérieurement.");
      };
      
      document.body.appendChild(script);
    };
    
    // Charger également le CSS si nécessaire
    if (!document.querySelector('link[href="https://paytech.sn/cdn/paytech.min.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://paytech.sn/cdn/paytech.min.css';
      document.head.appendChild(link);
    }
    
    loadPayTechScript();
    
    // Nettoyage - réinitialiser l'état quand la modal se ferme
    return () => {
      payTechInitialized.current = false;
    };
  }, [show]);
  
  // Fonction pour initialiser le paiement
  const initializePayment = () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.PayTech) {
        throw new Error("Le module de paiement n'est pas disponible");
      }
      
      // Configuration du paiement
      const paymentConfig = {
        item_name: description,
        item_price: amount,
        currency: "XOF",
        ref_command: `RDV-${Date.now()}-${patientInfo?.id?.substring(0, 5) || Math.random().toString(36).substring(2, 7)}`,
        command_name: description,
        env: "test", // Utilisez "prod" pour la production
        ipn_url: "https://votre-backend.com/api/ipn-paytech", // URL pour recevoir les notifications de paiement
        success_url: window.location.href,
        cancel_url: window.location.href,
        customer_id: patientInfo?.id || `PATIENT-${Date.now()}`,
        customer_email: patientInfo?.email || "",
        customer_phone_number: patientInfo?.telephone || "",
        customer_address: patientInfo?.adresse || "",
        customer_city: "",
        customer_country: "SN",
        customer_state: "",
        customer_zip_code: ""
      };
      
      // Créer l'instance PayTech
      const paytech = new window.PayTech(paymentConfig);
      
      // Configurer les options
      paytech.withOption({
        requestTokenUrl: 'https://paytech.sn/api/payment/request-payment',
        method: 'POST',
        headers: {
          // Remplacez par vos clés API réelles
          'API_KEY': '0360fc1c628c4527a6035a75d63bbd9ec2ad27da5e56b39be53019a36578c80c',
          'API_SECRET': '3f2048b8e427fa67a3a6341bcfe3795abc05cdd68ad101d6f51ebe6734340b9c'
        },
        presentationMode: window.PayTech.OPEN_IN_POPUP,
        onComplete: (response) => {
          setLoading(false);
          
          // Analyser la réponse
          let parsedResponse = response;
          if (typeof response === 'string') {
            try {
              parsedResponse = JSON.parse(response);
            } catch (e) {
              console.warn("La réponse n'est pas au format JSON:", response);
            }
          }
          
          if (parsedResponse && parsedResponse.success) {
            // Paiement réussi
            if (onPaymentSuccess) {
              onPaymentSuccess({
                transactionId: parsedResponse.transactionId || parsedResponse.token || '',
                amount: amount,
                method: 'PayTech',
                reference: paymentConfig.ref_command
              });
            }
            onHide();
          } else {
            // Paiement échoué ou annulé
            setError("Le paiement a été annulé ou a échoué.");
            if (onPaymentError) {
              onPaymentError("Le paiement a été annulé ou a échoué.");
            }
          }
        }
      });
      
      // Envoyer la requête de paiement
      paytech.send();
      payTechInitialized.current = true;
      
    } catch (error) {
      console.error("Erreur lors de l'initialisation du paiement:", error);
      setError(`Erreur lors de l'initialisation du paiement: ${error.message}`);
      setLoading(false);
      if (onPaymentError) {
        onPaymentError(error.message);
      }
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          <FaMoneyBillWave className="me-2 text-success" />
          Paiement {description}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h3 className="fw-bold">{amount} FCFA</h3>
          <p>{description}</p>
          
          <div className="d-flex justify-content-center mb-3">
            <img 
              src="https://paytech.sn/assets/images/logo.png" 
              alt="PayTech" 
              height="40" 
              className="mx-1" 
              onError={(e) => e.target.style.display = 'none'}
            />
            <img 
              src="https://paytech.sn/assets/images/orange-money.png" 
              alt="Orange Money" 
              height="40" 
              className="mx-1" 
              onError={(e) => e.target.style.display = 'none'}
            />
            <img 
              src="https://paytech.sn/assets/images/wave.png" 
              alt="Wave" 
              height="40" 
              className="mx-1" 
              onError={(e) => e.target.style.display = 'none'}
            />
            <img 
              src="https://paytech.sn/assets/images/free-money.png" 
              alt="Free Money" 
              height="40" 
              className="mx-1" 
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <div className="alert alert-info">
          <div className="d-flex">
            <FaInfoCircle className="me-2 mt-1" />
            <div>
              <p className="mb-1"><strong>Comment ça marche :</strong></p>
              <ol className="mb-0 ps-3">
                <li>Cliquez sur "Procéder au paiement"</li>
                <li>Sélectionnez votre méthode de paiement préférée</li>
                <li>Suivez les instructions pour compléter le paiement</li>
                <li>Une fois le paiement effectué, vous serez redirigé automatiquement</li>
              </ol>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Annuler
        </Button>
        <Button 
          variant="success" 
          onClick={initializePayment}
          disabled={loading || !scriptLoaded || payTechInitialized.current}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
              Chargement...
            </>
          ) : (
            <>
              <FaMoneyBillWave className="me-2" /> Procéder au paiement
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

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
  
  // États pour le paiement PayTech
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  
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

  // Fonction pour gérer le succès du paiement
  const handlePaymentSuccess = (paymentInfo) => {
    setPaymentCompleted(true);
    setPaymentDetails(paymentInfo);
    toast.success("Paiement effectué avec succès !");
  };

  // Fonction pour gérer l'erreur de paiement
  const handlePaymentError = (errorMessage) => {
    toast.error(`Erreur de paiement: ${errorMessage}`);
  };

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
      const paymentText = paymentCompleted && paymentDetails
        ? `\n\nPaiement: 
        Montant: 200 FCFA
        Méthode: PayTech
        Référence: ${paymentDetails.reference || ""}
        Transaction ID: ${paymentDetails.transactionId || ""}
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
    paymentDetails
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
  const handleShowSummary = (e) => {
    e.preventDefault();
    if (isFormComplete()) {
      setShowSummary(true);
    } else {
      setFeedback({
        type: "warning",
        message: "Veuillez remplir tous les champs requis."
      });
    }
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete()) {
      setFeedback({
        type: "warning",
        message: "Veuillez remplir tous les champs requis."
      });
      return;
    }

    // Si le paiement n'est pas encore effectué, afficher la modal de paiement
    if (!paymentCompleted) {
      setShowPaymentModal(true);
      return;
    }

    setRdvLoading(true);

    try {
      // Créer la demande de rendez-vous dans Firestore
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
        payment: paymentDetails || {
          amount: 200,
          currency: "FCFA",
          method: "PayTech",
          status: "completed",
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
      setPaymentCompleted(false);
      setPaymentDetails(null);
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

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = async () => {
    if (!patient?.id) return;
    
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', patient.id),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(messagesQuery);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      setHasNewMessages(false);
      setUnreadMessages(0);
      toast.success("Tous les messages ont été marqués comme lus");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des messages:", error);
      toast.error("Impossible de marquer les messages comme lus");
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
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                  >
                    <option value="">Toutes les spécialités</option>
                    {specialtyOptions.map((specialty, index) => (
                      <option key={index} value={specialty}>
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
                    <option value="Lundi">Lundi</option>
                    <option value="Mardi">Mardi</option>
                    <option value="Mercredi">Mercredi</option>
                    <option value="Jeudi">Jeudi</option>
                    <option value="Vendredi">Vendredi</option>
                    <option value="Samedi">Samedi</option>
                    <option value="Dimanche">Dimanche</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <ButtonGroup className="w-100">
                    <Button
                      variant={viewMode === "card" ? "primary" : "outline-primary"}
                      onClick={() => setViewMode("card")}
                    >
                      <FaThLarge />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "primary" : "outline-primary"}
                      onClick={() => setViewMode("list")}
                    >
                      <FaList />
                    </Button>
                  </ButtonGroup>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={12}>
                  <ButtonGroup size="sm">
                    <Button
                      variant={sortBy === "name" ? "secondary" : "outline-secondary"}
                      onClick={() => setSortBy("name")}
                    >
                      Trier par nom
                    </Button>
                    <Button
                      variant={sortBy === "specialty" ? "secondary" : "outline-secondary"}
                      onClick={() => setSortBy("specialty")}
                    >
                      Trier par spécialité
                    </Button>
                    <Button
                      variant={sortBy === "availability" ? "secondary" : "outline-secondary"}
                      onClick={() => setSortBy("availability")}
                    >
                      Trier par disponibilité
                    </Button>
                    <Button
                      variant={sortBy === "favorites" ? "secondary" : "outline-secondary"}
                      onClick={() => setSortBy("favorites")}
                    >
                      <FaRegStar /> Favoris
                    </Button>
                  </ButtonGroup>
                </Col>
              </Row>
            </div>

            {/* Affichage des médecins */}
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">
                  Aucun médecin ne correspond à vos critères de recherche.
                </p>
              </div>
            ) : viewMode === "card" ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredDoctors.map((doctor) => (
                  <Col key={doctor.id}>
                    <Card className="h-100">
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={doctor.photoUrl || "https://via.placeholder.com/150?text=Dr"}
                          alt={`Dr. ${doctor.prenom} ${doctor.nom}`}
                          style={{ height: "180px", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150?text=Dr";
                          }}
                        />
                        <Button
                          variant="link"
                          className="position-absolute top-0 end-0 text-warning bg-light rounded-circle p-1 m-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(doctor.id);
                          }}
                        >
                          {favoritesDoctors.includes(doctor.id) ? (
                            <FaStar size={20} />
                          ) : (
                            <FaRegStar size={20} />
                          )}
                        </Button>
                      </div>
                      <Card.Body>
                        <Card.Title>Dr. {doctor.prenom} {doctor.nom}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                          {doctor.specialite}
                        </Card.Subtitle>
                        <div className="mb-2">
                          <small className="text-muted">
                            Disponible: {doctor.disponibilite?.join(", ") || "Non spécifié"}
                          </small>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100"
                          onClick={() => viewDoctorDetails(doctor)}
                        >
                          Voir le profil
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <ListGroup>
                {filteredDoctors.map((doctor) => (
                  <ListGroup.Item
                    key={doctor.id}
                    action
                    onClick={() => viewDoctorDetails(doctor)}
                    className="d-flex align-items-center"
                  >
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        overflow: "hidden",
                        borderRadius: "50%",
                        marginRight: "15px"
                      }}
                    >
                      <img
                        src={doctor.photoUrl || "https://via.placeholder.com/50?text=Dr"}
                        alt={`Dr. ${doctor.prenom} ${doctor.nom}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/50?text=Dr";
                        }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Dr. {doctor.prenom} {doctor.nom}</h6>
                        <Button
                          variant="link"
                          className="text-warning p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(doctor.id);
                          }}
                        >
                          {favoritesDoctors.includes(doctor.id) ? (
                            <FaStar size={16} />
                          ) : (
                            <FaRegStar size={16} />
                          )}
                        </Button>
                      </div>
                      <div className="text-muted small">{doctor.specialite}</div>
                      <div className="small">
                        <span className="text-muted">Disponible: </span>
                        {doctor.disponibilite?.join(", ") || "Non spécifié"}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">
              Veuillez sélectionner une structure pour voir ses médecins.
            </p>
          </div>
        )}

        {/* Modal de détails du médecin */}
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
                  Dr. {selectedDoctorDetails.prenom} {selectedDoctorDetails.nom}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center mb-3">
                      <img
                        src={selectedDoctorDetails.photoUrl || "https://via.placeholder.com/200?text=Dr"}
                        alt={`Dr. ${selectedDoctorDetails.prenom} ${selectedDoctorDetails.nom}`}
                        className="img-fluid rounded"
                        style={{ maxHeight: "250px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200?text=Dr";
                        }}
                      />
                      <Button
                        variant="outline-warning"
                        className="mt-2 w-100"
                        onClick={() => toggleFavorite(selectedDoctorDetails.id)}
                      >
                        {favoritesDoctors.includes(selectedDoctorDetails.id) ? (
                          <>
                            <FaStar className="me-1" /> Retirer des favoris
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
                    <h5 className="mb-3">Informations professionnelles</h5>
                    <p>
                      <strong>Spécialité:</strong> {selectedDoctorDetails.specialite}
                    </p>
                    <p>
                      <strong>Disponibilité:</strong>{" "}
                      {selectedDoctorDetails.disponibilite?.join(", ") || "Non spécifié"}
                    </p>
                    {selectedDoctorDetails.experience && (
                      <p>
                        <strong>Expérience:</strong> {selectedDoctorDetails.experience}
                      </p>
                    )}
                    {selectedDoctorDetails.education && (
                      <p>
                        <strong>Formation:</strong> {selectedDoctorDetails.education}
                      </p>
                    )}
                    {selectedDoctorDetails.languages && (
                      <p>
                        <strong>Langues parlées:</strong> {selectedDoctorDetails.languages}
                      </p>
                    )}
                    {selectedDoctorDetails.bio && (
                      <>
                        <h5 className="mt-4 mb-2">Biographie</h5>
                        <p>{selectedDoctorDetails.bio}</p>
                      </>
                    )}

                    <div className="mt-4">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setShowDoctorDetails(false);
                          setActiveTab("rdv");
                          // Préremplir le formulaire de RDV avec ce médecin
                          const structure = structures.find(s => 
                            s.id === selectedStructureForDoctors
                          );
                          if (structure) {
                            setSelectedStructure({
                              value: structure.id,
                              label: structure.name
                            });
                            
                            // Trouver la spécialité correspondante
                            if (selectedDoctorDetails.specialite) {
                              setSelectedSpecialty({
                                value: selectedDoctorDetails.specialite,
                                label: selectedDoctorDetails.specialite
                              });
                            }
                            
                            // Préremplir le médecin
                            setSelectedDoctor({
                              value: selectedDoctorDetails.id,
                              label: `Dr. ${selectedDoctorDetails.prenom} ${selectedDoctorDetails.nom} (${selectedDoctorDetails.specialite})`,
                              specialite: selectedDoctorDetails.specialite,
                              nom: selectedDoctorDetails.nom,
                              prenom: selectedDoctorDetails.prenom
                            });
                          }
                        }}
                      >
                        <FaCalendarPlus className="me-2" /> Prendre rendez-vous
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Modal.Body>
            </>
          )}
        </Modal>
      </div>
    );
  };

  const PatientRdv = () => {
    return (
      <div>
        {feedback.message && (
          <Alert
            variant={feedback.type}
            onClose={() => setFeedback({ type: "", message: "" })}
            dismissible
          >
            {feedback.message}
          </Alert>
        )}

        {showSummary ? (
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
                onClick={handleSubmit}
                disabled={rdvLoading}
              >
                {rdvLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Envoi en cours...
                  </>
                ) : !paymentCompleted ? (
                  <>
                    <FaMoneyBillWave className="me-2" /> Payer et envoyer
                  </>
                ) : (
                  <>
                    <FaCheck className="me-2" /> Confirmer et envoyer
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleShowSummary}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Structure médicale <span className="text-danger">*</span>
              </Form.Label>
              <Select
                value={selectedStructure}
                onChange={setSelectedStructure}
                options={structuresOptions}
                placeholder="Sélectionnez une structure médicale"
                noOptionsMessage={() => "Aucune structure disponible"}
                isSearchable
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Spécialité <span className="text-danger">*</span>
              </Form.Label>
              <Select
                value={selectedSpecialty}
                onChange={setSelectedSpecialty}
                options={specialties}
                placeholder="Sélectionnez une spécialité"
                noOptionsMessage={() =>
                  selectedStructure
                    ? "Aucune spécialité disponible"
                    : "Veuillez d'abord sélectionner une structure"
                }
                isSearchable
                isClearable
                isDisabled={!selectedStructure}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Form.Group>

            {selectedSpecialty && availableDoctors.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Médecin (optionnel)</Form.Label>
                <Select
                  value={selectedDoctor}
                  onChange={setSelectedDoctor}
                  options={availableDoctors.filter(
                    (doctor) => doctor.specialite === selectedSpecialty.value
                  )}
                  placeholder="Sélectionnez un médecin (optionnel)"
                  noOptionsMessage={() =>
                    "Aucun médecin disponible pour cette spécialité"
                  }
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
                <Form.Text className="text-muted">
                  Si vous ne sélectionnez pas de médecin, la structure vous
                  assignera un médecin disponible.
                </Form.Text>
              </Form.Group>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Jours préférés <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={selectedDays}
                    onChange={setSelectedDays}
                    options={daysOptions}
                    placeholder="Sélectionnez des jours"
                    noOptionsMessage={() => "Aucun jour disponible"}
                    isMulti
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Créneaux horaires <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={selectedTimeSlots}
                    onChange={setSelectedTimeSlots}
                    options={timeSlotOptions}
                    placeholder="Sélectionnez des créneaux"
                    noOptionsMessage={() => "Aucun créneau disponible"}
                    isMulti
                    isSearchable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">
                Motif de consultation <span className="text-danger">*</span>
              </Form.Label>
              <Select
                value={motif}
                onChange={setMotif}
                options={motifOptions}
                placeholder="Sélectionnez un motif"
                noOptionsMessage={() => "Aucun motif disponible"}
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit">
                Continuer
              </Button>
            </div>
          </Form>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
          <p className="mt-3">Chargement de votre tableau de bord...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={handleLogout}>
              Retour à l'accueil
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Barre de navigation mobile */}
      {isMobile && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button variant="light" onClick={() => setShowSidebar(true)}>
            <FaBars />
          </Button>
          <h5 className="mb-0">
            {activeTab === "appointments"
              ? "Mes rendez-vous"
              : activeTab === "rdv"
              ? "Demande de rendez-vous"
              : activeTab === "doctors"
              ? "Médecins"
              : activeTab === "messaging"
              ? "Messagerie"
              : activeTab === "demandes"
              ? "Mes demandes"
              : "Profil"}
          </h5>
          <div className="d-flex">
            {hasNewMessages && (
              <Button 
                variant="outline-primary" 
                className="position-relative me-2"
                onClick={() => handleTabSelect("messaging")}
              >
                <FaEnvelope />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              </Button>
            )}
            <Button
              variant="outline-primary"
              className="position-relative"
              onClick={() => setShowNotificationsModal(true)}
            >
              <FaBell />
              {hasNewNotifications && (
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                  <span className="visually-hidden">Nouvelles notifications</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar mobile */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="text-center mb-4">
            <div
              className="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{ width: "80px", height: "80px", fontSize: "2rem" }}
            >
              {patient?.prenom?.[0]}{patient?.nom?.[0]}
            </div>
            <h5>{patient?.prenom} {patient?.nom}</h5>
            <p className="text-muted mb-0">{patient?.email}</p>
          </div>

          <Nav className="flex-column">
            <Nav.Link
              active={activeTab === "appointments"}
              onClick={() => handleTabSelect("appointments")}
              className="d-flex align-items-center py-2"
            >
              <FaCalendarAlt className="me-3" />
              Mes rendez-vous
            </Nav.Link>
            <Nav.Link
              active={activeTab === "rdv"}
              onClick={() => handleTabSelect("rdv")}
              className="d-flex align-items-center py-2"
            >
              <FaCalendarPlus className="me-3" />
              Demande de rendez-vous
            </Nav.Link>
            <Nav.Link
              active={activeTab === "demandes"}
              onClick={() => handleTabSelect("demandes")}
              className="d-flex align-items-center py-2"
            >
              <FaFile className="me-3" />
              Mes demandes
            </Nav.Link>
            <Nav.Link
              active={activeTab === "doctors"}
              onClick={() => handleTabSelect("doctors")}
              className="d-flex align-items-center py-2"
            >
              <FaUserMd className="me-3" />
              Médecins
            </Nav.Link>
            <Nav.Link
              active={activeTab === "messaging"}
              onClick={() => handleTabSelect("messaging")}
              className="d-flex align-items-center py-2 position-relative"
            >
              <FaEnvelope className="me-3" />
              Messagerie
              {hasNewMessages && (
                <span className="position-absolute end-0 top-50 translate-middle-y me-2 badge rounded-pill bg-danger">
                  {unreadMessages}
                </span>
              )}
            </Nav.Link>
            <Nav.Link
              active={activeTab === "profile"}
              onClick={() => handleTabSelect("profile")}
              className="d-flex align-items-center py-2"
            >
              <FaUser className="me-3" />
              Mon profil
            </Nav.Link>
            <Nav.Link
              onClick={handleLogout}
              className="d-flex align-items-center py-2 text-danger"
            >
              <FaSignOutAlt className="me-3" />
              Déconnexion
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      <Row>
        {/* Sidebar pour tablette et desktop */}
        {!isMobile && (
          <Col lg={3} md={4} className="mb-4">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="text-center mb-4">
                  <div
                    className="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                  >
                    {patient?.prenom?.[0]}{patient?.nom?.[0]}
                  </div>
                  <h5>{patient?.prenom} {patient?.nom}</h5>
                  <p className="text-muted mb-0">{patient?.email}</p>
                </div>

                <Nav className="flex-column">
                  <Nav.Link
                    active={activeTab === "appointments"}
                    onClick={() => setActiveTab("appointments")}
                    className="d-flex align-items-center py-2"
                  >
                    <FaCalendarAlt className="me-3" />
                    Mes rendez-vous
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "rdv"}
                    onClick={() => setActiveTab("rdv")}
                    className="d-flex align-items-center py-2"
                  >
                    <FaCalendarPlus className="me-3" />
                    Demande de rendez-vous
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "demandes"}
                    onClick={() => setActiveTab("demandes")}
                    className="d-flex align-items-center py-2"
                  >
                    <FaFile className="me-3" />
                    Mes demandes
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "doctors"}
                    onClick={() => setActiveTab("doctors")}
                    className="d-flex align-items-center py-2"
                  >
                    <FaUserMd className="me-3" />
                    Médecins
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "messaging"}
                    onClick={() => setActiveTab("messaging")}
                    className="d-flex align-items-center py-2 position-relative"
                  >
                    <FaEnvelope className="me-3" />
                    Messagerie
                    {hasNewMessages && (
                      <span className="position-absolute end-0 top-50 translate-middle-y me-2 badge rounded-pill bg-danger">
                        {unreadMessages}
                      </span>
                    )}
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "profile"}
                    onClick={() => setActiveTab("profile")}
                    className="d-flex align-items-center py-2"
                  >
                    <FaUser className="me-3" />
                    Mon profil
                  </Nav.Link>
                  <Nav.Link
                    onClick={handleLogout}
                    className="d-flex align-items-center py-2 text-danger"
                  >
                    <FaSignOutAlt className="me-3" />
                    Déconnexion
                  </Nav.Link>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Contenu principal */}
        <Col lg={!isMobile ? 9 : 12} md={!isMobile ? 8 : 12}>
          {/* Barre d'en-tête pour tablette et desktop */}
          {!isMobile && (
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">
                {activeTab === "appointments"
                  ? "Mes rendez-vous"
                  : activeTab === "rdv"
                  ? "Demande de rendez-vous"
                  : activeTab === "doctors"
                  ? "Médecins"
                  : activeTab === "messaging"
                  ? "Messagerie"
                  : activeTab === "demandes"
                  ? "Mes demandes"
                  : "Mon profil"}
              </h4>
              <div className="d-flex">
                {hasNewMessages && (
                  <Button 
                    variant="outline-primary" 
                    className="position-relative me-2"
                    onClick={() => {
                      setActiveTab("messaging");
                      markMessagesAsRead();
                    }}
                  >
                    <FaEnvelope className="me-1" /> Messages
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  </Button>
                )}
                <Button
                  variant="outline-primary"
                  className="position-relative"
                  onClick={() => setShowNotificationsModal(true)}
                >
                  <FaBell className="me-1" /> Notifications
                  {hasNewNotifications && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                      <span className="visually-hidden">Nouvelles notifications</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Card className="shadow-sm">
            <Card.Body>
              {activeTab === "appointments" && (
                <div>
                  <h5 className="mb-4">Mes rendez-vous</h5>
                  {appointments.length === 0 ? (
                    <div className="text-center py-5">
                      <FaCalendarAlt className="text-muted mb-3" size={48} />
                      <h6 className="text-muted">
                        Vous n'avez pas de rendez-vous pour le moment
                      </h6>
                      <p className="text-muted">
                        Utilisez l'onglet "Demande de rendez-vous" pour en créer
                        un.
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setActiveTab("rdv")}
                      >
                        <FaCalendarPlus className="me-2" /> Prendre rendez-vous
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Médecin</th>
                              <th>Structure</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((appointment) => (
                              <tr key={appointment.id}>
                                <td>
                                  <div>{appointment.day}</div>
                                  <small className="text-muted">
                                    {appointment.timeSlot}
                                  </small>
                                </td>
                                <td>
                                  {appointment.doctorInfo ? (
                                    <div>
                                      Dr. {appointment.doctorInfo.prenom}{" "}
                                      {appointment.doctorInfo.nom}
                                      <div>
                                        <small className="text-muted">
                                          {appointment.doctorInfo.specialite}
                                        </small>
                                      </div>
                                    </div>
                                  ) : (
                                    "Non spécifié"
                                  )}
                                </td>
                                <td>
                                  {appointment.structureInfo ? (
                                    <div>
                                      {appointment.structureInfo.name}
                                      <div>
                                        <small className="text-muted">
                                          {appointment.structureInfo.address}
                                        </small>
                                      </div>
                                    </div>
                                  ) : (
                                    "Non spécifiée"
                                  )}
                                </td>
                                <td>
                                  <Badge
                                    bg={
                                      appointment.status === "pending"
                                        ? "warning"
                                        : appointment.status === "completed"
                                        ? "success"
                                        : appointment.status === "cancelled"
                                        ? "danger"
                                        : "primary"
                                    }
                                  >
                                    {appointment.status === "pending"
                                      ? "En attente"
                                      : appointment.status === "completed"
                                      ? "Terminé"
                                      : appointment.status === "cancelled"
                                      ? "Annulé"
                                      : "Confirmé"}
                                  </Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleShowQRCode(appointment)}
                                    title="Afficher le QR Code"
                                  >
                                    <FaQrcode />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "rdv" && <PatientRdv />}

              {activeTab === "demandes" && (
                <div>
                  <h5 className="mb-4">Mes demandes de rendez-vous</h5>
                  <RequestsTable patientId={patient?.id} />
                </div>
              )}

              {activeTab === "doctors" && <StructureDoctorsComponent />}

              {activeTab === "messaging" && (
                <PatientMessaging 
                  patientId={patient?.id} 
                  patientName={`${patient?.prenom} ${patient?.nom}`}
                  onNewMessageRead={() => {
                    setHasNewMessages(false);
                    setUnreadMessages(0);
                  }}
                />
              )}

              {activeTab === "profile" && (
                <div>
                  <h5 className="mb-4">Mon profil</h5>
                  <Row>
                    <Col md={4} className="mb-4 mb-md-0">
                      <div className="text-center">
                        <div
                          className="bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: "150px",
                            height: "150px",
                            fontSize: "4rem"
                          }}
                        >
                          {patient?.prenom?.[0]}{patient?.nom?.[0]}
                        </div>
                        <h5>
                          {patient?.prenom} {patient?.nom}
                        </h5>
                        <p className="text-muted">
                          Patient{patient?.sexe === "F" ? "e" : ""}
                        </p>
                      </div>
                    </Col>
                    <Col md={8}>
                      <Card>
                        <Card.Body>
                          <h6 className="mb-3">Informations personnelles</h6>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex">
                              <div className="me-3">
                                <FaIdCard className="text-primary" />
                              </div>
                              <div>
                                <div className="text-muted small">
                                  Nom complet
                                </div>
                                <div>
                                  {patient?.prenom} {patient?.nom}
                                </div>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex">
                              <div className="me-3">
                                <FaEnvelope className="text-primary" />
                              </div>
                              <div>
                                <div className="text-muted small">Email</div>
                                <div>{patient?.email}</div>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex">
                              <div className="me-3">
                                <FaPhoneAlt className="text-primary" />
                              </div>
                              <div>
                                <div className="text-muted small">Téléphone</div>
                                <div>{patient?.telephone}</div>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex">
                              <div className="me-3">
                                <FaMapMarkerAlt className="text-primary" />
                              </div>
                              <div>
                                <div className="text-muted small">Adresse</div>
                                <div>{patient?.adresse || "Non spécifiée"}</div>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex">
                              <div className="me-3">
                                <FaUser className="text-primary" />
                              </div>
                              <div className="d-flex w-100 justify-content-between">
                                <div>
                                  <div className="text-muted small">
                                    Âge et sexe
                                  </div>
                                  <div>
                                    {patient?.age} ans -{" "}
                                    {patient?.sexe === "M"
                                      ? "Masculin"
                                      : "Féminin"}
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    // Logique pour modifier le profil
                                    toast.info("Fonctionnalité de modification du profil à venir");
                                  }}
                                >
                                  <FaEdit /> Modifier
                                </Button>
                              </div>
                            </ListGroup.Item>
                          </ListGroup>
                        </Card.Body>
                      </Card>

                      {patient?.insurance && patient.insurance.length > 0 && (
                        <Card className="mt-3">
                          <Card.Body>
                            <h6 className="mb-3">Assurances</h6>
                            <ListGroup variant="flush">
                              {patient.insurance.map((ins, index) => (
                                <ListGroup.Item key={index}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>{ins.name}</strong>
                                      <div className="text-muted small">
                                        N° {ins.policyNumber}
                                      </div>
                                    </div>
                                    <Badge bg="success">Actif</Badge>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </Card.Body>
                        </Card>
                      )}
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal QR Code */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaQrcode className="me-2" /> QR Code du rendez-vous
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {currentAppointment && (
            <>
              <div className="mb-3">
                <QRCodeCanvas
                  value={generateFormattedQRData(currentAppointment)}
                  size={250}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="mb-3">
                <h6>
                  {currentAppointment.day} - {currentAppointment.timeSlot}
                </h6>
                <p className="mb-1">
                  <strong>Médecin:</strong> Dr.{" "}
                  {currentAppointment.doctorInfo?.prenom}{" "}
                  {currentAppointment.doctorInfo?.nom}
                </p>
                <p className="mb-1">
                  <strong>Structure:</strong>{" "}
                  {currentAppointment.structureInfo?.name}
                </p>
                <p className="mb-0">
                  <strong>Adresse:</strong>{" "}
                  {currentAppointment.structureInfo?.address}
                </p>
              </div>
              <p className="text-muted small">
                Présentez ce QR code à l'accueil de la structure médicale pour
                confirmer votre rendez-vous.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Notifications */}
      <Modal
        show={showNotificationsModal}
        onHide={() => setShowNotificationsModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBell className="me-2" /> Notifications
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">Vous n'avez pas de notifications.</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.map((notification) => (
                <ListGroup.Item key={notification.id} className="py-3">
                  <div className="d-flex">
                    <div
                      className={`me-3 rounded-circle d-flex align-items-center justify-content-center text-white`}
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor:
                          notification.type === "appointment_accepted"
                            ? "#28a745"
                            : notification.type === "appointment_rejected"
                            ? "#dc3545"
                            : "#ffc107"
                      }}
                    >
                      {notification.type === "appointment_accepted" ? (
                        <FaCheck />
                      ) : notification.type === "appointment_rejected" ? (
                        <FaTimes />
                      ) : (
                        <FaInfoCircle />
                      )}
                    </div>
                    <div>
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="mb-1">{notification.message}</p>
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowNotificationsModal(false)}
          >
            Fermer
          </Button>
          {notifications.length > 0 && (
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const batch = writeBatch(db);
                  notifications.forEach((notification) => {
                    const notifRef = doc(db, "notifications", notification.id);
                    batch.update(notifRef, { read: true });
                  });
                  await batch.commit();
                  setHasNewNotifications(false);
                  setShowNotificationsModal(false);
                  toast.success("Toutes les notifications ont été marquées comme lues");
                } catch (error) {
                  console.error("Erreur lors de la mise à jour des notifications:", error);
                  toast.error("Erreur lors de la mise à jour des notifications");
                }
              }}
            >
              Marquer tout comme lu
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de paiement PayTech */}
      <PayTechPayment
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        amount={200}
        description="Frais de dossier pour rendez-vous médical"
        patientInfo={patient}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </Container>
  );
};

export default PatientDashboard;
