// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { WAVE_CONFIG } = require('../src/utils/waveConfig');

admin.initializeApp();

exports.initializePayment = functions.https.onCall(async (data, context) => {
  const { amount, currency, paymentMethod, transactionId } = data;

  // Configuration selon le mode de paiement
  const config = paymentMethod === 'wave' ? {
    apiKey: process.env.WAVE_API_KEY,
    secretKey: process.env.WAVE_SECRET_KEY,
    apiUrl: 'https://api.wave.com/v1/checkout'
  } : {
    apiKey: process.env.ORANGE_API_KEY,
    secretKey: process.env.ORANGE_SECRET_KEY,
    apiUrl: 'https://api.orange.com/orange-money-webpay/dev/v1'
  };

  try {
    // Créer la session de paiement avec l'API correspondante
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        transactionId,
        callbackUrl: `${process.env.WEBHOOK_BASE_URL}/payment-webhook`
      })
    });

    const result = await response.json();
    return { qrCodeUrl: result.qrCodeUrl };

  } catch (error) {
    console.error('Payment initialization error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    // Mettre à jour le statut de la transaction
    await admin.firestore()
      .collection('transactions')
      .doc(transactionId)
      .update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).send({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send({ error: error.message });
  }
});

exports.handleWaveWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Vérifier la signature du webhook
    const signature = req.headers['x-wave-signature'];
    if (!verifyWaveSignature(signature, req.body, WAVE_CONFIG.WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }

    const { event, data } = req.body;

    if (event === 'payment.success') {
      const { transactionId, merchantReference } = data;
      
      // Mettre à jour le statut du paiement dans Firestore
      await admin.firestore()
        .collection('payments')
        .doc(transactionId)
        .update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

    } else if (event === 'payment.failed') {
      // Gérer l'échec du paiement
      const { transactionId } = data;
      await admin.firestore()
        .collection('payments')
        .doc(transactionId)
        .update({
          status: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Fonction pour vérifier la signature du webhook
const verifyWaveSignature = (signature, payload, secret) => {
  const crypto = require('crypto');
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
};

exports.waveWebhook = functions.https.onRequest(async (request, response) => {
  try {
    const { transactionId, status } = request.body;
    
    const transactionRef = admin.firestore()
      .collection('waveTransactions')
      .doc(transactionId);
    
    await transactionRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (status === 'completed') {
      const transaction = await transactionRef.get();
      const { structureId, packType } = transaction.data();
      
      // Mettre à jour le pack de la structure
      await admin.firestore()
        .collection('structures')
        .doc(structureId)
        .update({
          currentPack: packType,
          packUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    response.status(500).json({ error: error.message });
  }
});