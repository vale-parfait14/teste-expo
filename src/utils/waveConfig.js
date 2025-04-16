export const WAVE_CONFIG = {
  MERCHANT_ID: "YOUR_MERCHANT_ID", // ID du compte marchand Wave
  API_KEY: "YOUR_WAVE_API_KEY",
  API_URL: "https://api.wave.com",
  WEBHOOK_SECRET: "YOUR_WEBHOOK_SECRET"
};

export const generateWaveQRCode = async (amount, currency = "XOF") => {
  try {
    const response = await fetch(`${WAVE_CONFIG.API_URL}/v1/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        merchantId: WAVE_CONFIG.MERCHANT_ID
      })
    });

    const data = await response.json();
    return data.qrCodeUrl;
  } catch (error) {
    console.error("Erreur lors de la génération du QR code Wave:", error);
    return null;
  }
};

export const checkWavePaymentStatus = async (transactionId) => {
  try {
    const response = await fetch(`${WAVE_CONFIG.API_URL}/v1/checkout/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${WAVE_CONFIG.API_KEY}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement:", error);
    return null;
  }
};
