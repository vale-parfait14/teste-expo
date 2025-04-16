import React, { useState, useEffect } from 'react';
import { getAuth, signOut, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Alert, Card } from 'react-bootstrap';

const PatientDashboard = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profil');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  
  // États pour les données du patient
  const [patient, setPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    adresse: '',
    sexe: '',
    numeroAssurance: '',
    assurances: [],
    antecedentsMedicaux: ''
  });
  
  // États pour les structures et médecins
  const [structures, setStructures] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('');
  const [medecins, setMedecins] = useState([]);
  const [filteredMedecins, setFilteredMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  
  // États pour les rendez-vous
  const [rendezvous, setRendezvous] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  
  // État pour le formulaire de demande de rendez-vous
  const [rdvFormData, setRdvFormData] = useState({
    date: '',
    heure: '',
    motif: '',
    structureId: '',
    medecinId: '',
    urgent: false
  });
  
  // État pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Nouvel état pour la recherche de structures
  const [structureSearchTerm, setStructureSearchTerm] = useState('');
  
  // Nouvel état pour le formulaire de demande d'affiliation directe
  const [affiliationFormData, setAffiliationFormData] = useState({
    structureId: '',
    motif: ''
  });

  // Nouveaux états pour les notifications
  const [newRendezvousCount, setNewRendezvousCount] = useState(0);
  const [newAffiliationsCount, setNewAffiliationsCount] = useState(0);
  const [viewedRdv, setViewedRdv] = useState([]);
  const [viewedAffiliations, setViewedAffiliations] = useState([]);

  // États pour le paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [currentPaymentRequest, setCurrentPaymentRequest] = useState(null);

  // Configuration PayTech
  const payTechConfig = {
    api_key: "0360fc1c628c4527a6035a75d63bbd9ec2ad27da5e56b39be53019a36578c80c",
    api_secret: "3f2048b8e427fa67a3a6341bcfe3795abc05cdd68ad101d6f51ebe6734340b9c",
    env: "test",
    ipn_url: "https://plateau-mgs.vercel.app/PatientsDashboard/ipn",
    success_url: "https://plateau-mgs.vercel.app/PatientsDashboard",
    cancel_url: "https://plateau-mgs.vercel.app/PatientsDashboard"
  };

  // Vérifier si l'appareil est mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Charger les données du patient au chargement de la page
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!auth.currentUser) {
        navigate('/');
        return;
      }
      
      try {
        const patientDoc = await getDoc(doc(db, 'patients', auth.currentUser.uid));
        if (patientDoc.exists()) {
          const patientData = patientDoc.data();
          setPatient(patientData);
          setFormData({
            nom: patientData.nom || '',
            prenom: patientData.prenom || '',
            email: patientData.email || '',
            telephone: patientData.telephone || '',
            dateNaissance: patientData.dateNaissance || '',
            adresse: patientData.adresse || '',
            sexe: patientData.sexe || '',
            numeroAssurance: patientData.numeroAssurance || '',
            assurances: patientData.assurances || [],
            antecedentsMedicaux: patientData.antecedentsMedicaux || ''
          });
          
          // Charger les structures médicales
          fetchStructures();
          
          // Charger les affiliations
          const unsubscribeAffiliations = fetchAffiliations();
          
          // Charger les rendez-vous
          const unsubscribeRdv = fetchRendezvous();
          
          // Charger les rendez-vous et affiliations déjà vus
          const viewedRdvData = localStorage.getItem(`viewedRdv_${auth.currentUser.uid}`);
          if (viewedRdvData) {
            setViewedRdv(JSON.parse(viewedRdvData));
          }
          
          const viewedAffiliationsData = localStorage.getItem(`viewedAffiliations_${auth.currentUser.uid}`);
          if (viewedAffiliationsData) {
            setViewedAffiliations(JSON.parse(viewedAffiliationsData));
          }
          
          return () => {
            if (unsubscribeAffiliations) unsubscribeAffiliations();
            if (unsubscribeRdv) unsubscribeRdv();
          };
        } else {
          setError("Données du patient non trouvées");
          navigate('/');
        }
      } catch (err) {
        setError("Erreur lors du chargement des données: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [auth.currentUser, navigate]);
  
  // Vérifier le statut du paiement au chargement de la page (retour de PayTech)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Récupérer les paramètres d'URL pour vérifier le retour de paiement
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_status');
      const requestId = urlParams.get('request_id');
      
      if (paymentStatus && requestId) {
        try {
          setLoading(true);
          
          // Récupérer les données complètes depuis Firestore
          const pendingRequestRef = doc(db, "pendingPaymentRequests", requestId);
          const pendingRequestDoc = await getDoc(pendingRequestRef);
          
          if (pendingRequestDoc.exists()) {
            const requestData = pendingRequestDoc.data();
            
            // Mettre à jour l'état du composant avec les données récupérées
            setCurrentPaymentRequest(requestData);
            
            if (paymentStatus === 'success') {
              // Mettre à jour le statut dans Firestore
              await updateDoc(pendingRequestRef, {
                status: "payment_success",
                completedAt: new Date().toISOString()
              });
              
              // Finaliser la demande avec les données de Firestore
              await finalizeRequest(requestData);
              
              // Afficher un message de succès
              setMessage("Paiement réussi! Votre demande a été enregistrée.");
            } else if (paymentStatus === 'cancel') {
              // Mettre à jour le statut dans Firestore
              await updateDoc(pendingRequestRef, {
                status: "payment_cancelled",
                cancelledAt: new Date().toISOString()
              });
              
              setPaymentStatus({
                success: false,
                message: "Le paiement a été annulé."
              });
              
              // Afficher une notification d'annulation
              setError("Le paiement a été annulé.");
            }
            
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error("La demande de paiement n'a pas été trouvée dans Firestore");
            setError("Impossible de retrouver les détails de votre paiement.");
          }
        } catch (error) {
          console.error("Erreur lors du traitement du retour de paiement:", error);
          setError("Une erreur est survenue lors du traitement de votre paiement.");
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkPaymentStatus();
  }, []);
  
  // Mettre à jour les compteurs de notifications
  useEffect(() => {
    // Compter les nouveaux rendez-vous
    const newRdv = rendezvous.filter(rdv => 
      !viewedRdv.includes(rdv.id) && 
      new Date(rdv.createdAt?.toDate() || Date.now()) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    setNewRendezvousCount(newRdv.length);
    
    // Compter les nouvelles affiliations
    const newAffiliations = affiliations.filter(affiliation => 
      !viewedAffiliations.includes(affiliation.id) && 
      (affiliation.statut === 'acceptée' || affiliation.statut === 'refusée') &&
      new Date(affiliation.updatedAt?.toDate() || affiliation.createdAt?.toDate() || Date.now()) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    setNewAffiliationsCount(newAffiliations.length);
  }, [rendezvous, affiliations, viewedRdv, viewedAffiliations]);
  
  // Marquer les rendez-vous comme vus lorsqu'on visite l'onglet
  useEffect(() => {
    if (activeTab === 'rendezvous' && newRendezvousCount > 0) {
      const newViewedRdv = [...viewedRdv];
      
      rendezvous.forEach(rdv => {
        if (!newViewedRdv.includes(rdv.id)) {
          newViewedRdv.push(rdv.id);
        }
      });
      
      setViewedRdv(newViewedRdv);
      localStorage.setItem(`viewedRdv_${auth.currentUser.uid}`, JSON.stringify(newViewedRdv));
      setNewRendezvousCount(0);
    }
  }, [activeTab, rendezvous, newRendezvousCount, viewedRdv, auth.currentUser]);
  
  // Marquer les affiliations comme vues lorsqu'on visite l'onglet
  useEffect(() => {
    if (activeTab === 'affiliations' && newAffiliationsCount > 0) {
      const newViewedAffiliations = [...viewedAffiliations];
      
      affiliations.forEach(affiliation => {
        if (!newViewedAffiliations.includes(affiliation.id)) {
          newViewedAffiliations.push(affiliation.id);
        }
      });
      
      setViewedAffiliations(newViewedAffiliations);
      localStorage.setItem(`viewedAffiliations_${auth.currentUser.uid}`, JSON.stringify(newViewedAffiliations));
      setNewAffiliationsCount(0);
    }
  }, [activeTab, affiliations, newAffiliationsCount, viewedAffiliations, auth.currentUser]);
  
  // Charger les structures médicales
  const fetchStructures = async () => {
    try {
      const structuresSnapshot = await getDocs(collection(db, 'structures'));
      const structuresList = structuresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStructures(structuresList);
    } catch (err) {
      setError("Erreur lors du chargement des structures: " + err.message);
    }
  };
  
  // Charger les affiliations du patient
  const fetchAffiliations = async () => {
    try {
      const affiliationsQuery = query(
        collection(db, 'affiliations'), 
        where('patientId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(affiliationsQuery, (snapshot) => {
        const affiliationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAffiliations(affiliationsList);
      });
      
      return unsubscribe;
    } catch (err) {
      setError("Erreur lors du chargement des affiliations: " + err.message);
      return null;
    }
  };
  
  // Charger les rendez-vous du patient
  const fetchRendezvous = async () => {
    try {
      const rdvQuery = query(
        collection(db, 'rendezvous'), 
        where('patientId', '==', auth.currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(rdvQuery, (snapshot) => {
        const rdvList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRendezvous(rdvList);
      });
      
      return unsubscribe;
    } catch (err) {
      setError("Erreur lors du chargement des rendez-vous: " + err.message);
      return null;
    }
  };
  
  // Charger les médecins d'une structure
  const fetchMedecins = async (structureId) => {
    try {
      const medecinsQuery = query(
        collection(db, 'medecins'), 
        where('structureId', '==', structureId)
      );
      
      const medecinsSnapshot = await getDocs(medecinsQuery);
      const medecinsList = medecinsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMedecins(medecinsList);
      setFilteredMedecins(medecinsList);
    } catch (err) {
      setError("Erreur lors du chargement des médecins: " + err.message);
    }
  };
  
  // Gérer le changement de structure sélectionnée
  const handleStructureChange = (e) => {
    const structureId = e.target.value;
    setSelectedStructure(structureId);
    setRdvFormData({...rdvFormData, structureId: structureId, medecinId: ''});
    setSelectedMedecin('');
    
    if (structureId) {
      fetchMedecins(structureId);
    } else {
      setMedecins([]);
      setFilteredMedecins([]);
    }
  };
  
  // Filtrer les médecins par spécialité
  const handleSpecialiteFilter = (specialite) => {
    if (specialite === '') {
      setFilteredMedecins(medecins);
    } else {
      const filtered = medecins.filter(medecin => 
        medecin.specialite.toLowerCase().includes(specialite.toLowerCase())
      );
      setFilteredMedecins(filtered);
    }
  };
  
  // Gérer le changement de médecin sélectionné
  const handleMedecinChange = (e) => {
    const medecinId = e.target.value;
    setSelectedMedecin(medecinId);
    setRdvFormData({...rdvFormData, medecinId: medecinId});
  };
  
  // Mettre à jour les données du profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      await updateDoc(doc(db, 'patients', auth.currentUser.uid), {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        dateNaissance: formData.dateNaissance,
        adresse: formData.adresse,
        sexe: formData.sexe,
        numeroAssurance: formData.numeroAssurance,
        assurances: formData.assurances,
        antecedentsMedicaux: formData.antecedentsMedicaux
      });
      
      setPatient({...patient, ...formData});
      setEditMode(false);
      setMessage("Profil mis à jour avec succès");
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors de la mise à jour du profil: " + err.message);
    }
  };
  
  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    try {
      await updatePassword(auth.currentUser, passwordData.newPassword);
      setMessage("Mot de passe mis à jour avec succès");
      setPasswordData({newPassword: '', confirmPassword: ''});
      
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError("Erreur lors du changement de mot de passe: " + err.message);
    }
  };
  
  // Ajouter/retirer une assurance
  const handleAssuranceChange = (assurance) => {
    const currentAssurances = [...formData.assurances];
    if (currentAssurances.includes(assurance)) {
      setFormData({
        ...formData,
        assurances: currentAssurances.filter(a => a !== assurance)
      });
    } else {
      setFormData({
        ...formData,
        assurances: [...currentAssurances, assurance]
      });
    }
  };
  
  // Gérer les changements dans le formulaire de rendez-vous
  const handleRdvFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRdvFormData({
      ...rdvFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Fonction d'initialisation du paiement
  const initiatePayment = async (requestData) => {
    try {
      setIsProcessingPayment(true);
      setPaymentStatus(null);
      
      // Générer un ID unique pour cette demande de paiement
      const paymentRequestId = `pay_${Date.now()}_${auth.currentUser.uid.substring(0, 8)}`;
      const refCommand = `RDV-${paymentRequestId}`;
      const customerId = `PATIENT-${auth.currentUser.uid}`;
      
      // 1. Sauvegarder d'abord la demande dans Firestore
      const pendingRequestRef = doc(db, "pendingPaymentRequests", paymentRequestId);
      await setDoc(pendingRequestRef, {
        ...requestData,
        paymentRequestId,
        paymentRef: refCommand,
        status: "pending_payment",
        createdAt: new Date().toISOString(),
        patientId: auth.currentUser.uid
      });
      
      // Montant du paiement (consultation)
      const consultationFee = 200; // 200 XOF
      
      // 2. Préparer les URLs avec l'ID de la demande en paramètre
      const successUrl = `${payTechConfig.success_url}?payment_status=success&request_id=${paymentRequestId}`;
      const cancelUrl = `${payTechConfig.cancel_url}?payment_status=cancel&request_id=${paymentRequestId}`;
      
      const paymentData = {
        item_name: `Consultation ${requestData.specialite || 'médicale'}`,
        item_price: consultationFee,
        currency: "XOF",
        ref_command: refCommand,
        command_name: `Consultation médicale via PayTech`,
        env: payTechConfig.env,
        ipn_url: payTechConfig.ipn_url,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_id: customerId,
        customer_email: patient?.email || "",
        customer_phone_number: patient?.telephone || "",
        customer_address: patient?.adresse || "",
        customer_city: "Dakar",
        customer_country: "SN",
        customer_state: "Dakar",
        customer_zip_code: "12345"
      };
      
      console.log("Envoi des données à PayTech:", paymentData);
      
      const response = await fetch('https://paytech.sn/api/payment/request-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': payTechConfig.api_key,
          'API_SECRET': payTechConfig.api_secret
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Réponse de PayTech:", responseData);
      
      if (responseData && responseData.success) {
        // 3. Mettre à jour la demande dans Firestore avec le token PayTech
        await updateDoc(pendingRequestRef, {
          paymentToken: responseData.token,
          paymentAmount: consultationFee,
          paymentUrl: responseData.redirect_url,
          lastUpdated: new Date().toISOString()
        });
        
        // 4. Rediriger vers l'URL de paiement
        window.location.href = responseData.redirect_url;
      } else {
        setIsProcessingPayment(false);
        setPaymentStatus({
          success: false,
          message: responseData?.message || "Le paiement a échoué",
          data: responseData
        });
        
        // Mettre à jour le statut dans Firestore
        await updateDoc(pendingRequestRef, {
          status: "payment_failed",
          errorMessage: responseData?.message || "Le paiement a échoué",
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      setIsProcessingPayment(false);
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      setPaymentStatus({
        success: false,
        message: "Une erreur est survenue lors de l'initialisation du paiement",
        error: error.message
      });
    }
  };
  
  // Fonction pour finaliser la demande après un paiement réussi
  const finalizeRequest = async (requestData) => {
    setLoading(true);
    try {
      // Date actuelle pour l'horodatage du paiement
      const paymentDate = new Date().toISOString();
      
      // Créer la demande de rendez-vous dans Firestore avec les détails de paiement
      const requestRef = await addDoc(collection(db, "rendezvous"), {
        patientId: auth.currentUser.uid,
        patientNom: `${patient.prenom} ${patient.nom}`,
        structureId: requestData.structureId,
        medecinId: requestData.medecinId,
        date: requestData.date,
        heure: requestData.heure,
        motif: requestData.motif,
        urgent: requestData.urgent || false,
        statut: "en attente",
        createdAt: new Date(),
        paymentStatus: "completed",
        paymentRef: requestData.paymentRef,
        paymentToken: requestData.paymentToken,
        paymentAmount: requestData.paymentAmount || 200,
        paymentDate: paymentDate,
        paymentMethod: "PayTech",
        paymentCurrency: "XOF",
        paymentRequestId: requestData.paymentRequestId
      });

      // Créer une notification pour le patient
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        title: "Demande de rendez-vous envoyée",
        message: `Votre demande de rendez-vous a été envoyée. Paiement effectué.`,
        type: "request_pending",
        requestId: requestRef.id,
        createdAt: paymentDate,
        read: false
      });

      // Créer une entrée de transaction de paiement
      await addDoc(collection(db, "payments"), {
        userId: auth.currentUser.uid,
        requestId: requestRef.id,
        amount: requestData.paymentAmount || 200,
        currency: "XOF",
        paymentRef: requestData.paymentRef,
        paymentToken: requestData.paymentToken,
        paymentMethod: "PayTech",
        paymentType: "appointment",
        status: "completed",
        createdAt: paymentDate,
        structureId: requestData.structureId,
        originalRequestId: requestData.paymentRequestId
      });

      setMessage("Votre demande de rendez-vous a été envoyée avec succès! Paiement confirmé.");

      // Réinitialiser le formulaire
      setRdvFormData({
        date: '',
        heure: '',
        motif: '',
        structureId: '',
        medecinId: '',
        urgent: false
      });
      
      setShowPaymentModal(false);
      setCurrentPaymentRequest(null);
      setPaymentStatus(null);
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      setError("Une erreur s'est produite lors de l'envoi de votre demande.");
    } finally {
      setLoading(false);
    }
  };
  
  // Soumettre une demande de rendez-vous
  const handleRdvSubmit = async (e) => {
    e.preventDefault();
    
    if (!rdvFormData.structureId || !rdvFormData.medecinId || !rdvFormData.date || !rdvFormData.heure) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    try {
      // Créer l'objet de demande de rendez-vous
      const requestData = {
        patientId: auth.currentUser.uid,
        patientNom: `${patient.prenom} ${patient.nom}`,
        structureId: rdvFormData.structureId,
        structureName: getStructureName(rdvFormData.structureId),
        medecinId: rdvFormData.medecinId,
        date: rdvFormData.date,
        heure: rdvFormData.heure,
        motif: rdvFormData.motif,
        urgent: rdvFormData.urgent,
        specialite: medecins.find(m => m.id === rdvFormData.medecinId)?.specialite || "Consultation générale"
      };

      // Afficher la modale de paiement
      setCurrentPaymentRequest(requestData);
      setShowPaymentModal(true);
    } catch (err) {
      setError("Erreur lors de la préparation de la demande: " + err.message);
    }
  };
  
  // Gérer les changements dans le formulaire d'affiliation
  const handleAffiliationFormChange = (e) => {
    const { name, value } = e.target;
    setAffiliationFormData({
      ...affiliationFormData,
      [name]: value
    });
  };

  // Soumettre une demande d'affiliation directe
  const handleAffiliationSubmit = async (e) => {
    e.preventDefault();
    
    if (!affiliationFormData.structureId) {
      setError("Veuillez sélectionner une structure médicale");
      return;
    }
    
    try {
      // Vérifier si le patient est déjà affilié à la structure
      const isAffiliated = affiliations.some(
        affiliation => affiliation.structureId === affiliationFormData.structureId && affiliation.statut === 'acceptée'
      );
      
      if (isAffiliated) {
        setError("Vous êtes déjà affilié à cette structure médicale");
        return;
      }
      
      // Vérifier si une demande d'affiliation est déjà en cours
      const existingAffiliation = affiliations.find(
        affiliation => 
          affiliation.structureId === affiliationFormData.structureId && 
          affiliation.statut === 'en attente'
      );
      
      if (existingAffiliation) {
        setError("Une demande d'affiliation est déjà en cours pour cette structure");
        return;
      }
      const structureInfo = structures.find(s => s.id === affiliationFormData.structureId);
      
      // Créer la demande d'affiliation
      await addDoc(collection(db, 'affiliations'), {
        patientId: auth.currentUser.uid,
        patientNom: `${patient.prenom} ${patient.nom}`,
        structureId: affiliationFormData.structureId,
        structureNom: structureInfo?.nom || "Structure médicale",
        motif: affiliationFormData.motif,
        statut: 'en attente',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setMessage("Votre demande d'affiliation a été envoyée avec succès");
      
      // Réinitialiser le formulaire
      setAffiliationFormData({
        structureId: '',
        motif: ''
      });
    } catch (err) {
      setError("Erreur lors de l'envoi de la demande d'affiliation: " + err.message);
    }
  };
  
  // Obtenir le nom d'une structure à partir de son ID
  const getStructureName = (structureId) => {
    const structure = structures.find(s => s.id === structureId);
    return structure ? structure.nom : "Structure inconnue";
  };
  
  // Obtenir le nom d'un médecin à partir de son ID
  const getMedecinName = (medecinId) => {
    const medecin = medecins.find(m => m.id === medecinId);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : "Médecin inconnu";
  };
  
  // Se déconnecter
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      setError("Erreur lors de la déconnexion: " + err.message);
    }
  };
  
  // Formater la date
  const formatDate = (date) => {
    if (!date) return "Date non spécifiée";
    
    if (date instanceof Date) {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    
    return date;
  };
  
  // Composant Modal de paiement
  const PaymentModal = () => (
    <Modal
      show={showPaymentModal}
      onHide={() => setShowPaymentModal(false)}
      centered
      size="lg"
      className="payment-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <i className="bi bi-credit-card-2-front me-2 text-primary"></i>
          Paiement de la consultation
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {paymentStatus && (
          <Alert 
            variant={paymentStatus.success ? "success" : "danger"}
            onClose={() => setPaymentStatus(null)} 
            dismissible
            className="animate__animated animate__fadeIn"
          >
            {paymentStatus.message}
          </Alert>
        )}
        
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-gradient-primary text-white py-3">
            <h5 className="mb-0">Détails du paiement</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
              <span>Frais de consultation:</span>
              <span className="fw-bold">200 XOF</span>
            </div>
            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
              <span>Frais de dossier:</span>
              <span className="fw-bold">0 XOF</span>
            </div>
            <div className="d-flex justify-content-between pt-2">
              <span className="fw-bold fs-5">Total à payer:</span>
              <span className="fw-bold fs-5 text-primary">200 XOF</span>
            </div>
            
            <div className="mt-4 bg-light p-3 rounded">
              <p className="mb-0 d-flex align-items-center">
                <i className="bi bi-shield-check text-success me-2 fs-5"></i>
                <span>Le paiement est sécurisé par PayTech. Vous serez redirigé vers une interface sécurisée pour finaliser votre paiement.</span>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-secondary" 
          onClick={() => setShowPaymentModal(false)}
          disabled={isProcessingPayment}
          className="px-4"
        >
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={() => initiatePayment(currentPaymentRequest)}
          disabled={isProcessingPayment}
          className="px-4 d-flex align-items-center"
        >
          {isProcessingPayment ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Traitement en cours...</span>
              </div>
              Traitement en cours...
            </>
          ) : (
            <>
              <i className="bi bi-credit-card me-2"></i> Procéder au paiement
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
  
  // Animation variants pour Framer Motion
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeInOut" }
  };
  
  // Rendu principal
  return (
    <div className="dashboard-container bg-light min-vh-100 d-flex flex-column">
      {/* Barre de navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow-sm sticky-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <span className="fw-bold">IMTEC</span>
          </a>
          
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              {patient && (
                <li className="nav-item me-3">
                  <span className="text-white opacity-75">
                    <i className="bi bi-person-circle me-1"></i>
                    {patient.prenom} {patient.nom}
                  </span>
                </li>
              )}
              <li className="nav-item">
                <button className="btn btn-light btn-sm rounded-pill px-3 py-2" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i> Déconnexion
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      {/* Contenu principal */}
      <div className="container py-4 flex-grow-1">
        {loading ? (
          <div className="text-center py-5 my-5">
            <div className="spinner-grow text-primary" role="status" style={{width: "3rem", height: "3rem"}}>
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-3 text-primary fw-medium">Chargement en cours...</p>
          </div>
        ) : (
          <div className="row g-4">
            {/* Sidebar */}
            <div className="col-lg-3 col-md-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top" style={{top: "90px"}}>
                <div className="card-body p-4 text-center">
                  <div className="avatar mb-3">
                    <div className="avatar-img rounded-circle bg-gradient-primary text-white d-flex align-items-center justify-content-center mx-auto" style={{width: '90px', height: '90px'}}>
                      <span className="fs-1 fw-bold">{patient?.prenom?.charAt(0)}{patient?.nom?.charAt(0)}</span>
                    </div>
                  </div>
                  <h5 className="card-title mb-1">{patient?.prenom} {patient?.nom}</h5>
                  <p className="text-muted small mb-3">{patient?.email}</p>
                  <div className="d-grid">
                    <button 
                      className="btn btn-sm btn-outline-primary rounded-pill" 
                      onClick={() => {setActiveTab('profil'); setEditMode(true);}}
                    >
                      <i className="bi bi-pencil-square me-1"></i> Modifier profil
                    </button>
                  </div>
                </div>
                
                <div className="list-group list-group-flush">
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'profil' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('profil')}
                  >
                    <i className={`bi bi-person-vcard me-2 ${activeTab === 'profil' ? '' : 'text-primary'}`}></i> Mon profil
                  </button>
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 d-flex justify-content-between align-items-center ${activeTab === 'rendezvous' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('rendezvous')}
                  >
                    <span>
                      <i className={`bi bi-calendar-check me-2 ${activeTab === 'rendezvous' ? '' : 'text-primary'}`}></i> Mes rendez-vous
                    </span>
                    {newRendezvousCount > 0 && (
                      <span className="badge bg-danger rounded-pill">{newRendezvousCount}</span>
                    )}
                  </button>
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'nouveauRdv' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('nouveauRdv')}
                  >
                    <i className={`bi bi-calendar-plus me-2 ${activeTab === 'nouveauRdv' ? '' : 'text-primary'}`}></i> Nouveau rendez-vous
                  </button>
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 d-flex justify-content-between align-items-center ${activeTab === 'affiliations' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('affiliations')}
                  >
                    <span>
                      <i className={`bi bi-building me-2 ${activeTab === 'affiliations' ? '' : 'text-primary'}`}></i> Mes affiliations
                    </span>
                    {newAffiliationsCount > 0 && (
                      <span className="badge bg-danger rounded-pill">{newAffiliationsCount}</span>
                    )}
                  </button>
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'nouvelleAffiliation' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('nouvelleAffiliation')}
                  >
                    <i className={`bi bi-building-add me-2 ${activeTab === 'nouvelleAffiliation' ? '' : 'text-primary'}`}></i> Nouvelle affiliation
                  </button>
                  <button 
                    className={`list-group-item list-group-item-action border-0 py-3 ${activeTab === 'securite' ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab('securite')}
                  >
                    <i className={`bi bi-shield-lock me-2 ${activeTab === 'securite' ? '' : 'text-primary'}`}></i> Sécurité
                  </button>
                </div>
              </div>
            </div>
            
            {/* Contenu principal */}
            <div className="col-lg-9 col-md-8">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show rounded-4 shadow-sm d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                  <div className="flex-grow-1">{error}</div>
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              
              {message && (
                <div className="alert alert-success alert-dismissible fade show rounded-4 shadow-sm d-flex align-items-center" role="alert">
                  <i className="bi bi-check-circle-fill me-2 fs-4"></i>
                  <div className="flex-grow-1">{message}</div>
                  <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={pageTransition.initial}
                  animate={pageTransition.animate}
                  exit={pageTransition.exit}
                  transition={pageTransition.transition}
                >
                  {/* Profil */}
                  {activeTab === 'profil' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-person-circle me-2 text-primary"></i>
                          Mon profil
                        </h5>
                        <button 
                          className={`btn btn-sm ${editMode ? 'btn-outline-danger' : 'btn-outline-primary'} rounded-pill px-3`}
                          onClick={() => setEditMode(!editMode)}
                        >
                          {editMode ? (
                            <><i className="bi bi-x-lg me-1"></i> Annuler</>
                          ) : (
                            <><i className="bi bi-pencil-square me-1"></i> Modifier</>
                          )}
                        </button>
                      </div>
                      
                      <div className="card-body p-4">
                        {editMode ? (
                          <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Nom</label>
                                <input 
                                  type="text" 
                                  className="form-control form-control-lg rounded-3" 
                                  value={formData.nom}
                                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                  required
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Prénom</label>
                                <input 
                                  type="text" 
                                  className="form-control form-control-lg rounded-3" 
                                  value={formData.prenom}
                                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Email</label>
                                <input 
                                  type="email" 
                                  className="form-control form-control-lg rounded-3 bg-light" 
                                  value={formData.email}
                                  disabled
                                />
                                <small className="text-muted">L'email ne peut pas être modifié</small>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Téléphone</label>
                                <input 
                                  type="tel" 
                                  className="form-control form-control-lg rounded-3" 
                                  value={formData.telephone}
                                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Date de naissance</label>
                                <input 
                                  type="date" 
                                  className="form-control form-control-lg rounded-3" 
                                  value={formData.dateNaissance}
                                  onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                                  required
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium">Sexe</label>
                                <select 
                                  className="form-select form-select-lg rounded-3" 
                                  value={formData.sexe}
                                  onChange={(e) => setFormData({...formData, sexe: e.target.value})}
                                  required
                                >
                                  <option value="">Sélectionner</option>
                                  <option value="M">Masculin</option>
                                  <option value="F">Féminin</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label fw-medium">Adresse</label>
                              <input 
                                type="text" 
                                className="form-control form-control-lg rounded-3" 
                                value={formData.adresse}
                                onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                                required
                              />
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label fw-medium">Numéro d'assurance</label>
                              <input 
                                type="text" 
                                className="form-control form-control-lg rounded-3" 
                                value={formData.numeroAssurance}
                                onChange={(e) => setFormData({...formData, numeroAssurance: e.target.value})}
                              />
                            </div>
                            
                            <div className="mb-3">
                              <label className="form-label fw-medium">Assurances</label>
                              <div className="d-flex flex-wrap gap-3 mt-2">
                                {['IPRES', 'IPM', 'SUNU', 'NSIA', 'AXA', 'AMSA'].map((assurance) => (
                                  <div key={assurance} className="form-check form-check-inline bg-light p-3 rounded-3">
                                    <input 
                                      type="checkbox" 
                                      className="form-check-input" 
                                      id={`assurance-${assurance}`}
                                      checked={formData.assurances.includes(assurance)}
                                      onChange={() => handleAssuranceChange(assurance)}
                                    />
                                    <label className="form-check-label fw-medium" htmlFor={`assurance-${assurance}`}>
                                      {assurance}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <label className="form-label fw-medium">Antécédents médicaux</label>
                              <textarea 
                                className="form-control form-control-lg rounded-3" 
                                rows="4"
                                value={formData.antecedentsMedicaux}
                                onChange={(e) => setFormData({...formData, antecedentsMedicaux: e.target.value})}
                              ></textarea>
                            </div>
                            
                            <div className="d-grid">
                              <button type="submit" className="btn btn-primary btn-lg rounded-pill">
                                <i className="bi bi-save me-2"></i> Enregistrer les modifications
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="profile-view">
                            <div className="row g-4 mb-4">
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Nom</h6>
                                  <p className="fs-5 fw-medium">{patient?.nom || '-'}</p>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Prénom</h6>
                                  <p className="fs-5 fw-medium">{patient?.prenom || '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="row g-4 mb-4">
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Email</h6>
                                  <p className="fs-5">{patient?.email || '-'}</p>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Téléphone</h6>
                                  <p className="fs-5">{patient?.telephone || '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="row g-4 mb-4">
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Date de naissance</h6>
                                  <p className="fs-5">{patient?.dateNaissance || '-'}</p>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="profile-item">
                                  <h6 className="text-muted mb-2">Sexe</h6>
                                  <p className="fs-5">{patient?.sexe === 'M' ? 'Masculin' : patient?.sexe === 'F' ? 'Féminin' : '-'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="profile-item mb-4">
                              <h6 className="text-muted mb-2">Adresse</h6>
                              <p className="fs-5">{patient?.adresse || '-'}</p>
                            </div>
                            
                            <div className="profile-item mb-4">
                              <h6 className="text-muted mb-2">Numéro d'assurance</h6>
                              <p className="fs-5">{patient?.numeroAssurance || '-'}</p>
                            </div>
                            
                            <div className="profile-item mb-4">
                              <h6 className="text-muted mb-2">Assurances</h6>
                              <div className="d-flex flex-wrap gap-2 mt-1">
                                {patient?.assurances?.length > 0 ? (
                                  patient.assurances.map((assurance) => (
                                    <span key={assurance} className="badge bg-primary bg-opacity-10 text-primary py-2 px-3 rounded-pill fs-6">{assurance}</span>
                                  ))
                                ) : (
                                  <span className="text-muted">Aucune assurance enregistrée</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="profile-item">
                              <h6 className="text-muted mb-2">Antécédents médicaux</h6>
                              <div className="p-3 bg-light rounded-3">
                                <p className="mb-0">{patient?.antecedentsMedicaux || 'Aucun antécédent médical enregistré'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Rendez-vous */}
                  {activeTab === 'rendezvous' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-calendar-check me-2 text-primary"></i>
                          Mes rendez-vous
                        </h5>
                      </div>
                      
                      <div className="card-body p-4">
                        {rendezvous.length === 0 ? (
                          <div className="text-center py-5">
                            <div className="empty-state">
                              <i className="bi bi-calendar-x text-muted display-1 mb-3"></i>
                              <h5 className="mb-3">Vous n'avez pas encore de rendez-vous</h5>
                              <button 
                                className="btn btn-primary rounded-pill px-4 py-2"
                                onClick={() => setActiveTab('nouveauRdv')}
                              >
                                <i className="bi bi-calendar-plus me-2"></i> Prendre un rendez-vous
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="appointments-list">
                            {rendezvous.map((rdv) => {
                              const structure = structures.find(s => s.id === rdv.structureId);
                              return (
                                <div key={rdv.id} className="appointment-card p-4 mb-3 bg-white rounded-4 shadow-sm border-start border-5 border-primary">
                                  <div className="row align-items-center">
                                    <div className="col-md-2 text-center mb-3 mb-md-0">
                                      <div className="date-badge bg-light rounded-3 p-2">
                                        <div className="day fw-bold fs-4 text-primary">{rdv.date.split('-')[2]}</div>
                                        <div className="month text-muted">{new Date(rdv.date).toLocaleString('fr-FR', {month: 'short'})}</div>
                                      </div>
                                    </div>
                                    <div className="col-md-7 mb-3 mb-md-0">
                                      <h5 className="mb-1">{structure?.nom || "Structure inconnue"}</h5>
                                      <p className="mb-1 text-muted">
                                        <i className="bi bi-clock me-1"></i> {rdv.heure} - 
                                        <i className="bi bi-person-badge ms-2 me-1"></i> {getMedecinName(rdv.medecinId)}
                                      </p>
                                      <p className="mb-0 small text-truncate">
                                        <i className="bi bi-chat-left-text me-1"></i> {rdv.motif}
                                      </p>
                                    </div>
                                    <div className="col-md-3 text-md-end">
                                      <div className="mb-2">
                                        <span className={`badge ${
                                          rdv.statut === 'confirmé' ? 'bg-success' : 
                                          rdv.statut === 'annulé' ? 'bg-danger' : 
                                          'bg-warning'
                                        } py-2 px-3 rounded-pill`}>
                                          {rdv.statut}
                                        </span>
                                      </div>
                                      <div>
                                        {rdv.paymentStatus === 'completed' ? (
                                          <span className="badge bg-success bg-opacity-10 text-success py-2 px-3 rounded-pill">
                                            <i className="bi bi-check-circle me-1"></i> Payé
                                          </span>
                                        ) : (
                                          <span className="badge bg-danger bg-opacity-10 text-danger py-2 px-3 rounded-pill">
                                            <i className="bi bi-exclamation-circle me-1"></i> Non payé
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Nouveau rendez-vous */}
                  {activeTab === 'nouveauRdv' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-calendar-plus me-2 text-primary"></i>
                          Nouveau rendez-vous
                        </h5>
                      </div>
                      
                      <div className="card-body p-4">
                        <form onSubmit={handleRdvSubmit} className="appointment-form">
                          <div className="mb-4">
                            <label className="form-label fw-medium">Structure médicale</label>
                            <div className="input-group mb-3">
                              <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-primary"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-lg ps-0 border-start-0"
                                placeholder="Rechercher une structure..."
                                value={structureSearchTerm}
                                onChange={(e) => setStructureSearchTerm(e.target.value)}
                              />
                            </div>
                            <select 
                              className="form-select form-select-lg rounded-3" 
                              name="structureId"
                              value={rdvFormData.structureId}
                              onChange={handleStructureChange}
                              required
                            >
                              <option value="">Sélectionner une structure</option>
                              {structures
                                .filter(structure => 
                                  structure.nom && structure.nom.toLowerCase().includes(structureSearchTerm.toLowerCase())
                                )
                                .map((structure) => (
                                  <option key={structure.id} value={structure.id}>
                                    {structure.nom}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          {rdvFormData.structureId && (
                            <div className="mb-4">
                              <label className="form-label fw-medium">Médecin</label>
                              <div className="mb-3">
                                <div className="specialties-filter d-flex flex-wrap gap-2">
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={() => handleSpecialiteFilter('')}
                                  >
                                    Tous
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={() => handleSpecialiteFilter('Généraliste')}
                                  >
                                    Généralistes
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={() => handleSpecialiteFilter('Cardio')}
                                  >
                                    Cardiologues
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={() => handleSpecialiteFilter('Pédiatre')}
                                  >
                                    Pédiatres
                                  </button>
                                </div>
                              </div>
                              
                              {filteredMedecins.length > 0 ? (
                                <div className="doctor-select">
                                  <select 
                                    className="form-select form-select-lg rounded-3" 
                                    name="medecinId"
                                    value={rdvFormData.medecinId}
                                    onChange={handleMedecinChange}
                                    required
                                  >
                                    <option value="">Sélectionner un médecin</option>
                                    {filteredMedecins.map((medecin) => (
                                      <option key={medecin.id} value={medecin.id}>
                                        Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="alert alert-info rounded-3">
                                  Aucun médecin disponible pour cette structure ou spécialité.
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="row g-4 mb-4">
                            <div className="col-md-6">
                              <label className="form-label fw-medium">Date</label>
                              <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-calendar-date text-primary"></i>
                                </span>
                                <input 
                                  type="date" 
                                  className="form-control form-control-lg ps-0 border-start-0" 
                                  name="date"
                                  value={rdvFormData.date}
                                  onChange={handleRdvFormChange}
                                  min={new Date().toISOString().split('T')[0]}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-medium">Heure</label>
                              <div className="input-group">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-clock text-primary"></i>
                                </span>
                                <input 
                                  type="time" 
                                  className="form-control form-control-lg ps-0 border-start-0" 
                                  name="heure"
                                  value={rdvFormData.heure}
                                  onChange={handleRdvFormChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="form-label fw-medium">Motif de la consultation</label>
                            <textarea 
                              className="form-control form-control-lg rounded-3" 
                              name="motif"
                              value={rdvFormData.motif}
                              onChange={handleRdvFormChange}
                              rows="4"
                              placeholder="Décrivez brièvement le motif de votre consultation..."
                              required
                            ></textarea>
                          </div>
                          
                          <div className="mb-4">
                            <div className="form-check form-switch">
                              <input 
                                type="checkbox" 
                                className="form-check-input" 
                                id="urgentCheck"
                                name="urgent"
                                checked={rdvFormData.urgent}
                                onChange={handleRdvFormChange}
                                role="switch"
                              />
                              <label className="form-check-label fw-medium" htmlFor="urgentCheck">
                                Consultation urgente
                              </label>
                            </div>
                            {rdvFormData.urgent && (
                              <div className="alert alert-warning rounded-3 mt-2">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Les consultations urgentes sont traitées en priorité, mais peuvent être soumises à des frais supplémentaires.
                              </div>
                            )}
                          </div>
                          
                          <div className="alert alert-info rounded-3 d-flex p-3 mb-4">
                            <div className="alert-icon me-3 fs-3">
                              <i className="bi bi-info-circle-fill text-primary"></i>
                            </div>
                            <div>
                              <h6 className="alert-heading">Information de paiement</h6>
                              <p className="mb-0">
                                Les frais de consultation s'élèvent à <strong>200 XOF</strong>. Le paiement est requis pour confirmer votre rendez-vous.
                              </p>
                            </div>
                          </div>
                          
                          <div className="d-grid">
                            <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3">
                              <i className="bi bi-calendar-plus me-2"></i> Demander un rendez-vous
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  
                  {/* Affiliations */}
                  {activeTab === 'affiliations' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-building me-2 text-primary"></i>
                          Mes affiliations
                        </h5>
                      </div>
                      
                      <div className="card-body p-4">
                        {affiliations.length === 0 ? (
                          <div className="text-center py-5">
                            <div className="empty-state">
                              <i className="bi bi-building-x text-muted display-1 mb-3"></i>
                              <h5 className="mb-3">Vous n'êtes affilié à aucune structure médicale</h5>
                              <button 
                                className="btn btn-primary rounded-pill px-4 py-2"
                                onClick={() => setActiveTab('nouvelleAffiliation')}
                              >
                                <i className="bi bi-building-add me-2"></i> Demander une affiliation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="affiliations-list">
                            {affiliations.map((affiliation) => (
                              <div key={affiliation.id} className="affiliation-card p-4 mb-3 bg-white rounded-4 shadow-sm">
                                <div className="row align-items-center">
                                  <div className="col-md-1 text-center mb-3 mb-md-0">
                                    <div className="icon-badge bg-light rounded-circle p-3">
                                      <i className="bi bi-building fs-3 text-primary"></i>
                                    </div>
                                  </div>
                                  <div className="col-md-7 mb-3 mb-md-0">
                                    <h5 className="mb-1">{affiliation.structureNom}</h5>
                                    <p className="mb-1 text-muted">
                                      <i className="bi bi-calendar me-1"></i> Demande: {formatDate(affiliation.createdAt)}
                                    </p>
                                    <p className="mb-0 small">
                                      <i className="bi bi-clock-history me-1"></i> Mise à jour: {formatDate(affiliation.updatedAt)}
                                    </p>
                                  </div>
                                  <div className="col-md-4 text-md-end">
                                    <span className={`badge ${
                                      affiliation.statut === 'acceptée' ? 'bg-success' : 
                                      affiliation.statut === 'refusée' ? 'bg-danger' : 
                                      'bg-warning'
                                    } py-2 px-3 rounded-pill`}>
                                      {affiliation.statut}
                                    </span>
                                    
                                    {affiliation.statut === 'acceptée' && (
                                      <div className="mt-2">
                                        <button 
                                          className="btn btn-sm btn-outline-primary rounded-pill"
                                          onClick={() => {
                                            setRdvFormData({...rdvFormData, structureId: affiliation.structureId});
                                            setActiveTab('nouveauRdv');
                                          }}
                                        >
                                          <i className="bi bi-calendar-plus me-1"></i> Prendre RDV
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Nouvelle affiliation */}
                  {activeTab === 'nouvelleAffiliation' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-building-add me-2 text-primary"></i>
                          Nouvelle affiliation
                        </h5>
                      </div>
                      
                      <div className="card-body p-4">
                        <form onSubmit={handleAffiliationSubmit} className="affiliation-form">
                          <div className="mb-4">
                            <label className="form-label fw-medium">Structure médicale</label>
                            <div className="input-group mb-3">
                              <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-primary"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-lg ps-0 border-start-0"
                                placeholder="Rechercher une structure..."
                                value={structureSearchTerm}
                                onChange={(e) => setStructureSearchTerm(e.target.value)}
                              />
                            </div>
                            <select 
                              className="form-select form-select-lg rounded-3" 
                              name="structureId"
                              value={affiliationFormData.structureId}
                              onChange={handleAffiliationFormChange}
                              required
                            >
                              <option value="">Sélectionner une structure</option>
                              {structures
                                .filter(structure => 
                                  structure.nom && structure.nom.toLowerCase().includes(structureSearchTerm.toLowerCase())
                                )
                                .map((structure) => (
                                  <option key={structure.id} value={structure.id}>
                                    {structure.nom}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          <div className="mb-4">
                            <label className="form-label fw-medium">Motif de la demande d'affiliation</label>
                            <textarea 
                              className="form-control form-control-lg rounded-3" 
                              name="motif"
                              value={affiliationFormData.motif}
                              onChange={handleAffiliationFormChange}
                              rows="4"
                              placeholder="Expliquez pourquoi vous souhaitez vous affilier à cette structure médicale..."
                              required
                            ></textarea>
                          </div>
                          
                          <div className="alert alert-info rounded-3 d-flex p-3 mb-4">
                            <div className="alert-icon me-3 fs-3">
                              <i className="bi bi-info-circle-fill text-primary"></i>
                            </div>
                            <div>
                              <h6 className="alert-heading">Qu'est-ce qu'une affiliation ?</h6>
                              <p className="mb-0">
                                L'affiliation à une structure médicale vous permet d'accéder plus facilement à ses services et de bénéficier d'un suivi personnalisé. Votre demande sera examinée par la structure concernée.
                              </p>
                            </div>
                          </div>
                          
                          <div className="d-grid">
                            <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3">
                              <i className="bi bi-building-add me-2"></i> Demander une affiliation
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  
                  {/* Sécurité */}
                  {activeTab === 'securite' && (
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                      <div className="card-header bg-white p-4 border-0">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="bi bi-shield-lock me-2 text-primary"></i>
                          Sécurité
                        </h5>
                      </div>
                      
                      <div className="card-body p-4">
                        <form onSubmit={handleChangePassword} className="security-form">
                          <div className="alert alert-warning rounded-3 d-flex p-3 mb-4">
                            <div className="alert-icon me-3 fs-3">
                              <i className="bi bi-shield-exclamation text-warning"></i>
                            </div>
                            <div>
                              <h6 className="alert-heading">Conseils de sécurité</h6>
                              <p className="mb-0">
                                Utilisez un mot de passe fort contenant au moins 8 caractères, incluant des lettres majuscules, minuscules, des chiffres et des caractères spéciaux.
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="form-label fw-medium">Nouveau mot de passe</label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-key text-primary"></i>
                              </span>
                              <input 
                                type="password" 
                                className="form-control form-control-lg ps-0 border-start-0" 
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                required
                                minLength="8"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <label className="form-label fw-medium">Confirmer le nouveau mot de passe</label>
                            <div className="input-group">
                              <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-key-fill text-primary"></i>
                              </span>
                              <input 
                                type="password" 
                                className="form-control form-control-lg ps-0 border-start-0" 
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                required
                                minLength="8"
                              />
                            </div>
                          </div>
                          
                          <div className="d-grid">
                            <button type="submit" className="btn btn-primary btn-lg rounded-pill py-3">
                              <i className="bi bi-shield-check me-2"></i> Changer le mot de passe
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-white py-4 mt-auto border-top">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0 text-muted">&copy; 2025 IMTEC. Tous droits réservés.</p>
            </div>
           
          </div>
        </div>
      </footer>
      
      {/* Styles personnalisés */}
      <style jsx>{`
        /* Variables */
        :root {
          --primary: #0d6efd;
          --primary-light: #e6f0ff;
          --border-radius: 1rem;
          --box-shadow: 0 .5rem 1rem rgba(0,0,0,.08);
          --transition: all .3s ease;
        }
        
        /* Styles généraux */
        .dashboard-container {
          background-color: #f8f9fa;
        }
        
        /* Gradient backgrounds */
        .bg-gradient-primary {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
        }
        
        /* Cards */
        .card {
          transition: var(--transition);
        }
        
        .card:hover {
          transform: translateY(-3px);
          box-shadow: var(--box-shadow);
        }
        
        .rounded-4 {
          border-radius: var(--border-radius) !important;
        }
        
        /* Sidebar */
        .list-group-item {
          border-left: 4px solid transparent;
          transition: var(--transition);
          padding-left: 1.5rem;
        }
        
        .list-group-item:hover:not(.active) {
          background-color: var(--primary-light);
          border-left-color: var(--primary);
        }
        
        .list-group-item.active {
          border-left-color: white;
        }
        
        /* Profile view */
        .profile-item {
          padding-bottom: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }
        
        /* Appointments */
        .appointment-card {
          transition: var(--transition);
          border-left: 5px solid var(--primary);
        }
        
        .appointment-card:hover {
          transform: translateX(3px);
          box-shadow: var(--box-shadow);
        }
        
        .date-badge {
          width: 80px;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
        }
        
        /* Forms */
        .form-control, .form-select {
          padding: 0.75rem 1rem;
          border-color: #e0e0e0;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
        }
        
        /* Buttons */
        .btn {
          transition: var(--transition);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
          border: none;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #0a58ca, #084298);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
        }
        
        /* Empty states */
        .empty-state {
          padding: 2rem;
        }
        
        /* Payment modal */
        .payment-modal .modal-content {
          border-radius: var(--border-radius);
          border: none;
          overflow: hidden;
        }
      `}</style>
      
      {/* Modal de paiement */}
      <PaymentModal />
    </div>
  );
};

export default PatientDashboard;
