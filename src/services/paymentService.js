import { db } from '../components/firebase-config.js';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';

const WAVE_API_KEY = process.env.REACT_APP_WAVE_API_KEY;
const ORANGE_API_KEY = process.env.REACT_APP_ORANGE_API_KEY;

export const generateWaveQRCode = async (amount, reference) => {
  try {
    const response = await fetch('https://api.wave.com/v1/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        reference: reference
      })
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const generateOrangeQRCode = async (amount, reference) => {
  try {
    const response = await fetch('https://api.orange.com/payment/qrcode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ORANGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        reference: reference
      })
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const createPaymentRecord = async (paymentData) => {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return paymentRef.id;
  } catch (error) {
    throw error;
  }
};

export const verifyPaymentStatus = async (paymentId) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    const response = await fetch(`/api/verify-payment/${paymentId}`);
    const { status } = await response.json();
    
    if (status === 'completed') {
      await updateDoc(paymentRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }
    
    return status;
  } catch (error) {
    throw error;
  }
};
