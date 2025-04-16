import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import { waveService } from '../services/waveService.js';

const WavePaymentModal = ({ show, onHide, structureId, selectedPack }) => {
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (show && selectedPack) {
      generateQR();
    }
  }, [show, selectedPack]);

  const generateQR = async () => {
    const result = await waveService.generateQRCode(
      structureId,
      selectedPack.id,
      selectedPack.price
    );

    if (result.demoQR) {
      setIsDemo(true);
      setQrData(result.qrData);
      setError(result.message);
    } else if (result.success) {
      setQrData(result.qrData);
      startPolling(result.transactionId);
    } else {
      setError(result.message);
    }
  };

  const startPolling = async (transactionId) => {
    const interval = setInterval(async () => {
      const status = await waveService.checkPaymentStatus(transactionId);
      setStatus(status);
      
      if (status === 'completed') {
        clearInterval(interval);
        onHide();
        // Déclencher la mise à jour du pack
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Paiement Wave - {selectedPack?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {error && (
          <Alert variant="warning">
            {error}
            {isDemo && " - Mode démonstration activé"}
          </Alert>
        )}
        
        {qrData && (
          <div className="qr-container p-4">
            <QRCodeSVG value={qrData} size={256} level="H"/>
            <p className="mt-3">
              Scannez ce code QR avec l'application Wave pour payer
              <br />
              <strong>{selectedPack?.price} FCFA</strong>
            </p>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">En attente du paiement...</span>
            </div>
            <p className="mt-2">En attente du paiement...</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annuler
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WavePaymentModal;
