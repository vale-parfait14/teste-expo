export const WAVE_CONFIG = {
  API_URL: 'https://api.wave.com/v1',
  SUCCESS_URL: `${window.location.origin}/payment-success`,
  CANCEL_URL: `${window.location.origin}/payment-cancel`,
  WEBHOOK_URL: `${process.env.REACT_APP_FIREBASE_FUNCTIONS_URL}/waveWebhook`
};

export const PACK_TYPES = {
  BASIC: {
    id: 'basic',
    name: 'Pack Basic',
    price: 5000,
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  },
  PREMIUM: {
    id: 'premium',
    name: 'Pack Premium',
    price: 10000,
    features: ['All Basic features', 'Feature 4', 'Feature 5']
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Pack Enterprise',
    price: 20000,
    features: ['All Premium features', 'Feature 6', 'Feature 7']
  }
};
