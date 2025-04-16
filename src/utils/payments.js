import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEXCHANGE_CONFIG } from '../config/dexchange';

export const recordPayment = async (structureId, packId, amount, transactionId) => {
  try {
    // Enregistrer le paiement
    await addDoc(collection(db, 'payments'), {
      structureId,
      packId,
      amount,
      transactionId,
      status: 'completed',
      date: new Date().toISOString()
    });

    // Mettre à jour le pack de la structure
    await updateDoc(doc(db, 'structures', structureId), {
      subscriptionPack: packId,
      lastPayment: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    throw error;
  }
};

export const validatePayment = async (transactionData) => {
  // Implémenter la validation du paiement selon les règles DEXCHANGE
  // ...
};

export const initializePayment = async (structure, pack) => {
  try {
    // Créer la session de paiement
    const paymentIntent = await fetch(`${DEXCHANGE_CONFIG.API_URL}/payment_intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEXCHANGE_CONFIG.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: pack.price * 100, // Montant en centimes
        currency: 'EUR',
        metadata: {
          structureId: structure.id,
          packId: pack.id,
          structureName: structure.name
        },
        description: `Pack ${pack.name} pour ${structure.name}`,
        receipt_email: structure.email
      })
    });

    const paymentData = await paymentIntent.json();

    // Enregistrer l'intention de paiement
    await addDoc(collection(db, 'paymentIntents'), {
      structureId: structure.id,
      packId: pack.id,
      amount: pack.price,
      status: 'pending',
      paymentIntentId: paymentData.id,
      createdAt: new Date().toISOString()
    });

    return paymentData;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (transactionId, status) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentDoc = await getDoc(doc(paymentsRef, transactionId));
    
    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }

    await updateDoc(doc(paymentsRef, transactionId), {
      status,
      updatedAt: new Date().toISOString()
    });

    // Si le paiement est réussi, mettre à jour le pack de la structure
    if (status === 'completed') {
      const { structureId, packId } = paymentDoc.data();
      await updateDoc(doc(db, 'structures', structureId), {
        subscriptionPack: packId,
        lastPayment: new Date().toISOString()
      });
    }

    return true;
  } catch (error) {
    console.error('Payment status update error:', error);
    throw error;
  }
};

// Fonction pour vérifier l'état d'un paiement
export const checkPaymentStatus = async (paymentIntentId) => {
  try {
    const response = await fetch(
      `${DEXCHANGE_CONFIG.API_URL}/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Bearer ${DEXCHANGE_CONFIG.API_KEY}`
        }
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
};
