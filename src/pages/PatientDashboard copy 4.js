import React, { useState, useEffect, useRef } from 'react';

const PayTechPaymentPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showIframe, setShowIframe] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const iframeRef = useRef(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: 'client@example.com',
    phoneNumber: '221777777777'
  });
  
  // Configuration du paiement - à personnaliser selon vos besoins
  const paymentConfig = {
    item_name: "Réservation de rendez-vous",
    item_price: 5000,
    currency: "XOF",
    customer_email: customerInfo.email,
    customer_phone_number: customerInfo.phoneNumber,
    customer_address: "Dakar, Sénégal",
    customer_city: "Dakar",
    customer_country: "SN",
    customer_state: "Dakar",
    customer_zip_code: "12345",
    api_key: "0360fc1c628c4527a6035a75d63bbd9ec2ad27da5e56b39be53019a36578c80c",
    api_secret: "3f2048b8e427fa67a3a6341bcfe3795abc05cdd68ad101d6f51ebe6734340b9c",
    env: "test",
    ipn_url: "https://ccb-omega.vercel.app/PatientsDashboard/ipn",
    success_url: "https://ccb-omega.vercel.app/PatientsDashboard",
    cancel_url: "https://ccb-omega.vercel.app/PatientsDashboard"
  };

  // Fonction pour initialiser le paiement PayTech et obtenir l'URL de l'iframe
  const initiatePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus(null);
      
      const refCommand = `RDV-${Date.now()}`;
      const customerId = `CLIENT-${Date.now()}`;
      
      const paymentData = {
        item_name: `${paymentConfig.item_name} (${selectedDate} à ${selectedTime})`,
        item_price: paymentConfig.item_price,
        currency: paymentConfig.currency,
        ref_command: refCommand,
        command_name: `${paymentConfig.item_name} via PayTech`,
        env: paymentConfig.env,
        ipn_url: paymentConfig.ipn_url,
        success_url: paymentConfig.success_url,
        cancel_url: paymentConfig.cancel_url,
        customer_id: customerId,
        customer_email: customerInfo.email,
        customer_phone_number: customerInfo.phoneNumber,
        customer_address: paymentConfig.customer_address,
        customer_city: paymentConfig.customer_city,
        customer_country: paymentConfig.customer_country,
        customer_state: paymentConfig.customer_state,
        customer_zip_code: paymentConfig.customer_zip_code
      };
      
      console.log("Envoi des données à PayTech:", paymentData);
      
      const response = await fetch('https://paytech.sn/api/payment/request-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': paymentConfig.api_key,
          'API_SECRET': paymentConfig.api_secret
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("Réponse de PayTech:", responseData);
      
      if (responseData && responseData.success) {
        // Stocker l'URL de paiement pour l'iframe
        setPaymentUrl(responseData.redirect_url);
        setShowIframe(true);
      } else {
        setIsProcessing(false);
        setPaymentStatus({
          success: false,
          message: responseData?.message || "Le paiement a échoué",
          data: responseData
        });
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      setPaymentStatus({
        success: false,
        message: "Une erreur est survenue lors de l'initialisation du paiement",
        error: error.message
      });
    }
  };

  // Écouter les messages de l'iframe pour détecter le succès ou l'échec du paiement
  useEffect(() => {
    const handleMessage = (event) => {
      // Vérifier que le message vient de PayTech (à adapter selon la documentation PayTech)
      if (event.origin === 'https://paytech.sn') {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data.status === 'success') {
            setPaymentStatus({
              success: true,
              message: "Paiement effectué avec succès! Votre rendez-vous est confirmé.",
              data: data
            });
            setShowIframe(false);
            setIsProcessing(false);
          } else if (data.status === 'failed' || data.status === 'cancelled') {
            setPaymentStatus({
              success: false,
              message: data.message || "Le paiement a échoué ou a été annulé",
              data: data
            });
            setShowIframe(false);
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message:', error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Gérer le changement des inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      setSelectedDate(value);
    } else if (name === 'time') {
      setSelectedTime(value);
    } else {
      setCustomerInfo({
        ...customerInfo,
        [name]: value
      });
    }
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    return (
      customerInfo.fullName.trim() !== '' &&
      customerInfo.email.trim() !== '' &&
      customerInfo.phoneNumber.trim() !== '' &&
      selectedDate !== '' &&
      selectedTime !== ''
    );
  };

  // Fermer l'iframe de paiement
  const closeIframe = () => {
    setShowIframe(false);
    setIsProcessing(false);
  };

  // Styles CSS pour la page
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '30px',
      fontFamily: '"Poppins", "Segoe UI", Roboto, sans-serif',
      color: '#333',
      backgroundColor: '#f8f9fa',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    headerTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#2a9d8f',
      marginBottom: '10px'
    },
    headerSubtitle: {
      fontSize: '16px',
      color: '#666',
      maxWidth: '600px',
      margin: '0 auto'
    },
    twoColumnLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      marginBottom: '30px',
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr'
      }
    },
    appointmentCard: {
      backgroundColor: 'white',
      border: '1px solid #eaeaea',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.03)'
    },
    appointmentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '20px',
      borderBottom: '1px solid #f0f0f0',
      paddingBottom: '15px'
    },
    appointmentTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#264653',
      marginBottom: '5px'
    },
    appointmentType: {
      fontSize: '14px',
      color: '#2a9d8f',
      fontWeight: '600',
      backgroundColor: 'rgba(42, 157, 143, 0.1)',
      padding: '4px 12px',
      borderRadius: '20px',
      display: 'inline-block'
    },
    appointmentPrice: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#e76f51',
      textAlign: 'right'
    },
    priceCurrency: {
      fontSize: '14px',
      color: '#666'
    },
    appointmentDescription: {
      color: '#666',
      lineHeight: '1.6',
      fontSize: '15px',
      marginBottom: '25px',
      padding: '15px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      borderLeft: '3px solid #2a9d8f'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#555'
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      fontSize: '15px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    },
    dateTimeContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px'
    },
    payButton: {
      backgroundColor: '#2a9d8f',
      color: 'white',
      border: 'none',
      padding: '14px 25px',
      fontSize: '16px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      boxShadow: '0 5px 15px rgba(42, 157, 143, 0.2)',
      width: '100%',
      marginTop: '10px'
    },
    payButtonHover: {
      backgroundColor: '#238b7e',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(42, 157, 143, 0.3)'
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      cursor: 'not-allowed',
      boxShadow: 'none'
    },
    statusMessage: {
      padding: '15px',
      borderRadius: '8px',
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '15px'
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      animation: 'spin 1s linear infinite',
      marginRight: '10px'
    },
    infoCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.03)'
    },
    infoTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#264653',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    infoList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    infoListItem: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '15px',
      fontSize: '15px',
      color: '#555'
    },
    infoIcon: {
      color: '#2a9d8f',
      marginRight: '10px',
      flexShrink: 0,
      marginTop: '3px'
    },
    securityBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#e8f4f2',
      padding: '12px 15px',
      borderRadius: '8px',
      marginTop: '20px'
    },
    securityIcon: {
      color: '#2a9d8f'
    },
    securityText: {
      fontSize: '14px',
      color: '#2a9d8f'
    },
    footer: {
      textAlign: 'center',
      marginTop: '30px',
      color: '#95a5a6',
      fontSize: '14px'
    },
    // Styles pour l'iframe et l'overlay
    iframeOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    iframeContainer: {
      position: 'relative',
      width: '100%',
      maxWidth: '600px',
      height: '600px',
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none'
    },
    closeButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      zIndex: 10
    }
  };

  // Style pour l'animation du spinner
  const spinnerKeyframes = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Icônes SVG
  const icons = {
    calendar: (
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    )
  };

  // Disponibilités des rendez-vous (à personnaliser)
  const availableDates = [
    { date: '2025-03-10', slots: ['09:00', '10:30', '14:00', '16:30'] },
    { date: '2025-03-11', slots: ['08:30', '11:00', '13:30', '15:00'] },
    { date: '2025-03-12', slots: ['10:00', '11:30', '14:30', '17:00'] },
    { date: '2025-03-13', slots: ['09:30', '12:00', '15:30', '16:00'] },
    { date: '2025-03-14', slots: ['08:00', '10:00', '13:00', '15:30'] }
  ];

  // Obtenir les créneaux disponibles pour la date sélectionnée
  const getAvailableSlots = () => {
    const dateInfo = availableDates.find(d => d.date === selectedDate);
    return dateInfo ? dateInfo.slots : [];
  };

  // Composant pour l'iframe de paiement
  const PaymentIframe = () => {
    if (!showIframe) return null;

    return (
      <div style={styles.iframeOverlay}>
        <div style={styles.iframeContainer}>
          <button style={styles.closeButton} onClick={closeIframe}>
            {icons.close}
          </button>
          <iframe 
            ref={iframeRef}
            src={paymentUrl}
            style={styles.iframe}
            title="PayTech Payment"
            allow="payment"
          />
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{spinnerKeyframes}</style>
      
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Réservation de Rendez-vous</h1>
        <p style={styles.headerSubtitle}>
          Réservez votre consultation médicale en quelques clics et payez en ligne en toute sécurité
        </p>
      </div>

      <div style={styles.twoColumnLayout}>
        {/* Carte d'information du rendez-vous */}
        <div style={styles.appointmentCard}>
          <div style={styles.appointmentHeader}>
            <div>
              <h2 style={styles.appointmentTitle}>Consultation Médicale</h2>
              <span style={styles.appointmentType}>Rendez-vous spécialiste</span>
            </div>
            <div style={styles.appointmentPrice}>
              {paymentConfig.item_price.toLocaleString()} <span style={styles.priceCurrency}>{paymentConfig.currency}</span>
            </div>
          </div>
          
          <p style={styles.appointmentDescription}>
            Cette consultation vous permet de rencontrer un médecin spécialiste pour discuter de votre situation médicale. 
            La durée de la consultation est de 45 minutes. Le paiement en ligne vous garantit votre créneau horaire et 
            réduit votre temps d'attente lors de votre visite.
          </p>
          
          {/* Formulaire de réservation */}
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="fullName">Nom complet</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={customerInfo.fullName}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Entrez votre nom complet"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="email">Adresse email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Entrez votre adresse email"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="phoneNumber">Numéro de téléphone</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={customerInfo.phoneNumber}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Entrez votre numéro de téléphone"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Choisissez une date et un horaire</label>
              <div style={styles.dateTimeContainer}>
                <select 
                  name="date" 
                  value={selectedDate} 
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Sélectionnez une date</option>
                  {availableDates.map(dateInfo => (
                    <option key={dateInfo.date} value={dateInfo.date}>
                      {new Date(dateInfo.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </option>
                  ))}
                </select>
                
                <select 
                  name="time" 
                  value={selectedTime} 
                  onChange={handleInputChange}
                  style={styles.input}
                  disabled={!selectedDate}
                  required
                >
                  <option value="">Sélectionnez un horaire</option>
                  {getAvailableSlots().map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <button 
            onClick={initiatePayment}
            disabled={isProcessing || !isFormValid()}
            style={{
              ...styles.payButton,
              ...(isProcessing || !isFormValid() ? styles.disabledButton : {})
            }}
          >
            {isProcessing && <div style={styles.loadingSpinner}></div>}
            {isProcessing ? "Traitement en cours..." : "Payer et confirmer le rendez-vous"}
          </button>
          
          {paymentStatus && (
            <div 
              style={{
                ...styles.statusMessage,
                ...(paymentStatus.success ? styles.successMessage : styles.errorMessage)
              }}
            >
              {paymentStatus.message}
            </div>
          )}
          
          <div style={styles.securityBadge}>
            <span style={styles.securityIcon}>{icons.lock}</span>
            <p style={styles.securityText}>
              Paiement sécurisé via PayTech, conforme aux normes de sécurité bancaires
            </p>
          </div>
        </div>
        
        {/* Carte d'informations complémentaires */}
        <div>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>
              {icons.info} Informations importantes
            </h3>
            
            <ul style={styles.infoList}>
              <li style={styles.infoListItem}>
                <span style={styles.infoIcon}>{icons.check}</span>
                <span>Durée de la consultation : <strong>45 minutes</strong></span>
              </li>
              <li style={styles.infoListItem}>
                <span style={styles.infoIcon}>{icons.check}</span>
                <span>Lieu : <strong>Clinique Médicale, Dakar Centre</strong></span>
              </li>
              <li style={styles.infoListItem}>
                <span style={styles.infoIcon}>{icons.check}</span>
                <span>Confirmation immédiate par email et SMS</span>
              </li>
              <li style={styles.infoListItem}>
                <span style={styles.infoIcon}>{icons.check}</span>
                <span>Documents à apporter : Carte d'identité, dossier médical</span>
              </li>
            </ul>
          </div>
          
          <div style={{...styles.infoCard, marginTop: '20px'}}>
            <h3 style={styles.infoTitle}>
              {icons.calendar} Politique d'annulation
            </h3>
            
            <p style={{color: '#555', lineHeight: '1.6', marginBottom: '15px'}}>
              En cas d'annulation 24h avant le rendez-vous, vous serez intégralement remboursé. Pour toute annulation tardive, 
              des frais de 50% seront retenus.
            </p>
            
            <p style={{color: '#555', lineHeight: '1.6'}}>
              Pour annuler ou reporter votre rendez-vous, veuillez nous contacter au <strong>+221 33 123 45 67</strong> ou par email 
              à <strong>contact@clinique.sn</strong>
            </p>
          </div>
          
          <div style={{...styles.infoCard, marginTop: '20px'}}>
            <h3 style={styles.infoTitle}>
              {icons.info} Méthodes de paiement acceptées
            </h3>
            
            <p style={{color: '#555', lineHeight: '1.6', marginBottom: '15px'}}>
              PayTech vous permet de payer via plusieurs méthodes sécurisées, notamment par carte bancaire (Visa, Mastercard), 
              Orange Money, Free Money et Wave. [[3]](#__3)
            </p>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '15px',
              justifyContent: 'center'
            }}>
              <img src="https://paytech.sn/assets/images/visa.png" alt="Visa" height="30" />
              <img src="https://paytech.sn/assets/images/mastercard.png" alt="Mastercard" height="30" />
              <img src="https://paytech.sn/assets/images/om.png" alt="Orange Money" height="30" />
              <img src="https://paytech.sn/assets/images/free.png" alt="Free Money" height="30" />
              <img src="https://paytech.sn/assets/images/wave.png" alt="Wave" height="30" />
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} Clinique Médicale. Tous droits réservés.</p>
        <p style={{fontSize: '12px', marginTop: '5px'}}>
          <strong>Note:</strong> Ceci est une démo en environnement de test. Aucun prélèvement réel ne sera effectué. [[2]](#__2)
        </p>
      </div>
      
      {/* Iframe de paiement PayTech */}
      <PaymentIframe />
    </div>
  );
};

export default PayTechPaymentPage;
