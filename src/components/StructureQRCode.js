import React from 'react';
import QRCode from 'qrcode.react';
import { Button, Modal, Alert } from 'react-bootstrap';

const StructureQRCode = ({ structureId, structureName, show, onHide }) => {
  // URL qui sera encodée dans le QR code
  const registrationUrl = `${window.location.origin}/register/${structureId}`;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Code QR d'inscription</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <h6 className="mb-4">Scanner pour rejoindre {structureName}</h6>
        
        <div className="qr-container p-4 bg-white rounded shadow-sm">
          <QRCode 
            value={registrationUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        <Alert variant="info" className="mt-4">
          <i className="fas fa-info-circle me-2"></i>
          Ce code QR permet aux médecins et patients de rejoindre directement votre structure
        </Alert>

        <Button 
          variant="outline-primary"
          onClick={() => {
            const link = document.createElement('a');
            link.download = `qr-code-${structureName}.png`;
            link.href = document.querySelector('canvas').toDataURL();
            link.click();
          }}
          className="mt-2"
        >
          <i className="fas fa-download me-2"></i>
          Télécharger le QR Code
        </Button>
      </Modal.Body>
    </Modal>
  );
};

export default StructureQRCode;
