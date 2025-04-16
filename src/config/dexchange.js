export const DEXCHANGE_CONFIG = {
  API_KEY: process.env.REACT_APP_DEXCHANGE_API_KEY,
  API_SECRET: process.env.REACT_APP_DEXCHANGE_API_SECRET,
  MERCHANT_ID: process.env.REACT_APP_DEXCHANGE_MERCHANT_ID,
  API_URL: process.env.REACT_APP_DEXCHANGE_API_URL || 'https://api.dexchange.com/v1',
  WEBHOOK_SECRET: process.env.REACT_APP_DEXCHANGE_WEBHOOK_SECRET
};

export const initDexchangePayment = async (amount, currency, description, customerEmail) => {
  try {
    const response = await fetch(`${DEXCHANGE_CONFIG.API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEXCHANGE_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
        merchant_id: DEXCHANGE_CONFIG.MERCHANT_ID,
        customer_email: customerEmail,
        callback_url: DEXCHANGE_CONFIG.CALLBACK_URL
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur DEXCHANGE:', error);
    throw error;
  }
};

// Fonction utilitaire pour la validation des signatures
export const verifyDexchangeSignature = (payload, signature) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', DEXCHANGE_CONFIG.WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return expectedSignature === signature;
};
