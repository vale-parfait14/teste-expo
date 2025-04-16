// PaytechPaymentDOM.js
export function initializePaytechPayment(config) {
    // Créer un conteneur pour le formulaire de paiement
    const paymentContainer = document.createElement('div');
    paymentContainer.id = 'paytech-payment-container';
    document.body.appendChild(paymentContainer);
  
    // Charger le CSS PayTech
    if (!document.querySelector('link[href="https://paytech.sn/cdn/paytech.min.css"]')) {
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://paytech.sn/cdn/paytech.min.css';
      document.head.appendChild(linkElement);
    }
  
    // Charger le script PayTech
    return new Promise((resolve, reject) => {
      if (window.PayTech) {
        // Si PayTech est déjà chargé, continuer
        processPayment(config, resolve, reject);
      } else {
        // Sinon, charger le script
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://paytech.sn/cdn/paytech.min.js';
        scriptElement.async = true;
        
        scriptElement.onload = () => {
          console.log('PayTech script chargé avec succès');
          // Attendre un peu pour s'assurer que PayTech est bien initialisé
          setTimeout(() => {
            processPayment(config, resolve, reject);
          }, 500);
        };
        
        scriptElement.onerror = () => {
          console.error('Erreur lors du chargement du script PayTech');
          reject(new Error("Impossible de charger le script de paiement"));
        };
        
        document.body.appendChild(scriptElement);
      }
    });
  }
  
  function processPayment(config, resolve, reject) {
    try {
      const refCommand = `REF-${Date.now()}`;
      const customerId = `CLIENT-${Date.now()}`;
      
      // Créer une instance PayTech avec les paramètres fournis
      const payTechInstance = new window.PayTech({
        item_name: config.item_name,
        item_price: config.item_price,
        currency: config.currency,
        ref_command: refCommand,
        command_name: `${config.item_name} via PayTech`,
        env: config.env || 'test',
        ipn_url: config.ipn_url,
        success_url: config.success_url,
        cancel_url: config.cancel_url,
        customer_id: customerId,
        customer_email: config.customer_email,
        customer_phone_number: config.customer_phone_number,
        customer_address: config.customer_address,
        customer_city: config.customer_city,
        customer_country: config.customer_country,
        customer_state: config.customer_state,
        customer_zip_code: config.customer_zip_code
      });
  
      // Configurer les options
      payTechInstance.withOption({
        requestTokenUrl: 'https://paytech.sn/api/payment/request-payment',
        method: 'POST',
        headers: {
          'API_KEY': config.api_key,
          'API_SECRET': config.api_secret
        },
        presentationMode: window.PayTech.OPEN_IN_POPUP,
        onComplete: function(response) {
          console.log('Paiement terminé:', response);
          
          if (response && response.success) {
            resolve({
              success: true,
              message: "Paiement effectué avec succès!",
              data: response
            });
          } else {
            resolve({
              success: false,
              message: response?.message || "Le paiement a échoué",
              data: response
            });
          }
        }
      });
  
      // Envoyer la demande de paiement
      payTechInstance.send();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      reject({
        success: false,
        message: "Une erreur est survenue lors de l'initialisation du paiement",
        error: error.message
      });
    }
  }
  