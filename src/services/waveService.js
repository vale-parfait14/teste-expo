import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { WAVE_CONFIG } from '../config/waveConfig.js';

export const waveService = {
  async generateQRCode(structureId, packType, amount) {
    try {
      const structureRef = doc(db, 'structures', structureId);
      const structureDoc = await getDoc(structureRef);
      const waveMerchantId = structureDoc.data()?.waveMerchantId;

      if (!waveMerchantId) {
        return {
          success: false,
          message: 'Aucun compte marchand Wave configuré',
          demoQR: true,
          qrData: `demo_${packType}_${amount}`
        };
      }

      // Créer une nouvelle transaction dans Firebase
      const transactionRef = doc(db, 'waveTransactions', `${structureId}_${Date.now()}`);
      await setDoc(transactionRef, {
        structureId,
        packType,
        amount,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Dans un environnement réel, vous appelleriez l'API Wave ici
      // Pour la démo, nous générons un QR fictif
      return {
        success: true,
        transactionId: transactionRef.id,
        qrData: `wave_${waveMerchantId}_${amount}_${transactionRef.id}`
      };
    } catch (error) {
      console.error('Error generating Wave QR:', error);
      return { success: false, message: error.message };
    }
  },

  async checkPaymentStatus(transactionId) {
    const transactionRef = doc(db, 'waveTransactions', transactionId);
    const transactionDoc = await getDoc(transactionRef);
    return transactionDoc.data()?.status || 'pending';
  },

  async updatePaymentStatus(transactionId, status) {
    const transactionRef = doc(db, 'waveTransactions', transactionId);
    await updateDoc(transactionRef, { status, updatedAt: new Date().toISOString() });
  }
};
