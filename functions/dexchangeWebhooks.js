const functions = require('firebase-functions');
const { verifyDexchangeSignature } = require('../src/config/dexchange');
const { recordPayment } = require('../src/utils/payments');

exports.dexchangeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-dexchange-signature'];
  
  if (!signature || !verifyDexchangeSignature(req.body, signature)) {
    console.error('Invalid signature');
    return res.status(401).send('Invalid signature');
  }

  const { 
    event_type,
    data: {
      transaction_id,
      status,
      amount,
      metadata: {
        structureId,
        packId
      }
    }
  } = req.body;

  try {
    switch (event_type) {
      case 'payment.success':
        await recordPayment(structureId, packId, amount, transaction_id);
        break;
        
      case 'payment.failed':
        await updatePaymentStatus(transaction_id, 'failed');
        break;
        
      case 'payment.pending':
        await updatePaymentStatus(transaction_id, 'pending');
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal error');
  }
});
