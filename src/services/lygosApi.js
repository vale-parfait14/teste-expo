const LYGOS_API_BASE_URL = 'https://api.lygos.com/v1';

// Méthodes de paiement par défaut en cas d'échec de l'API
const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Carte bancaire',
    type: 'CARD',
    icon: 'credit-card'
  },
  {
    id: 'mobile',
    name: 'Mobile Money',
    type: 'MOBILE_MONEY',
    icon: 'mobile-alt'
  },
  {
    id: 'transfer',
    name: 'Virement bancaire',
    type: 'BANK_TRANSFER',
    icon: 'university'
  }
];

export const getPaymentMethods = async () => {
  try {
    const response = await fetch(`${LYGOS_API_BASE_URL}/payment-methods`, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_LYGOS_API_KEY}`
      }
    });

    if (!response.ok) {
      // En cas d'erreur, utiliser les méthodes par défaut
      console.warn('Failed to fetch payment methods from API, using defaults');
      return DEFAULT_PAYMENT_METHODS;
    }

    const data = await response.json();
    return data.methods || DEFAULT_PAYMENT_METHODS;
    
  } catch (error) {
    console.warn('Error fetching payment methods:', error);
    // En cas d'erreur réseau, utiliser les méthodes par défaut
    return DEFAULT_PAYMENT_METHODS;
  }
};

export const initiateLygosPayment = async (packDetails, paymentMethod, billingInfo) => {
  try {
    // Ajouter un timeout pour la requête
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${LYGOS_API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_LYGOS_API_KEY}`
      },
      body: JSON.stringify({
        amount: packDetails.price,
        currency: 'XOF',
        paymentMethod: paymentMethod,
        customer: billingInfo,
        metadata: {
          packId: packDetails.id,
          packName: packDetails.name
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Échec de l\'initiation du paiement');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré, veuillez réessayer');
    }
    throw error;
  }
};

export const verifyLygosPayment = async (paymentId) => {
  try {
    const response = await fetch(`${LYGOS_API_BASE_URL}/payments/${paymentId}/verify`, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_LYGOS_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
