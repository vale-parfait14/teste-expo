import React, { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../components/firebase-config.js';
import { doc, updateDoc } from 'firebase/firestore';

const PaymentModal = ({ 
    show, 
    onHide, 
    structure = {}, // Valeur par défaut
    currentPack = {}, // Valeur par défaut
    onPaymentSuccess 
  }) => {
const [paymentMethod, setPaymentMethod] = useState(null);
const [qrCode, setQrCode] = useState(null);
const [paymentStatus, setPaymentStatus] = useState(null);

const generatePaymentQR = async (method) => {
  try {
    // Générer un identifiant unique pour la transaction
    const transactionId = `${structure.id}_${Date.now()}`;
    
    // Créer un document de transaction dans Firestore
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      structureId: structure.id,
      packId: currentPack.id,
      amount: currentPack.price,
      method: method,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Générer le QR code avec les informations de transaction
    const qrData = JSON.stringify({
      transactionId,
      amount: currentPack.price,
      method
    });

    setQrCode(qrData);
    setPaymentMethod(method);
    setPaymentStatus('waiting');
  } catch (error) {
    console.error('Erreur de génération de QR:', error);
    setPaymentStatus('error');
  }
};

const handlePaymentWebhook = async (transactionId, status) => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    
    if (status === 'success') {
      // Mettre à jour le statut de la transaction
      await updateDoc(transactionRef, { status: 'completed' });
      
      // Mettre à jour le pack de la structure
      const structureRef = doc(db, 'structures', structure.id);
      await updateDoc(structureRef, {
        subscriptionPack: currentPack.id,
        subscriptionDate: new Date().toISOString()
      });

      setPaymentStatus('success');
      onPaymentSuccess(currentPack.id);
    } else {
      await updateDoc(transactionRef, { status: 'failed' });
      setPaymentStatus('failed');
    }
  } catch (error) {
    console.error('Erreur webhook:', error);
    setPaymentStatus('error');
  }
};

return (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Paiement du Pack {currentPack.name}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {paymentStatus === null && (
        <div className="payment-methods">
          <Button 
            variant="outline-primary" 
            onClick={() => generatePaymentQR('wave')}
            className="me-2"
          >
            <img src="/wave-logo.png" alt="Wave" style={{height: '30px'}} />
            Payer avec Wave
          </Button>
          <Button 
            variant="outline-success" 
            onClick={() => generatePaymentQR('orange-money')}
          >
            <img src="/orange-money-logo.png" alt="Orange Money" style={{height: '30px'}} />
            Payer avec Orange Money
          </Button>
        </div>
      )}

      {paymentStatus === 'waiting' && qrCode && (
        <div className="text-center">
          <QRCodeSVG 
            value={qrCode}
            size={256}
            level="H"
          />
          <p className="mt-3">
            Scannez ce QR code avec l'application {paymentMethod === 'wave' ? 'Wave' : 'Orange Money'}
          </p>
          <Alert variant="info">
            Une fois le paiement effectué, le pack sera automatiquement appliqué.
          </Alert>
        </div>
      )}

      {paymentStatus === 'success' && (
        <Alert variant="success">
          Paiement réussi ! Votre pack {currentPack.name} est maintenant actif.
        </Alert>
      )}

      {paymentStatus === 'failed' && (
        <Alert variant="danger">
          Le paiement a échoué. Veuillez réessayer.
        </Alert>
      )}

      {paymentStatus === 'error' && (
        <Alert variant="warning">
          Une erreur est survenue. Contactez le support.
        </Alert>
      )}
    </Modal.Body>
  </Modal>
);
};

export default PaymentModal;