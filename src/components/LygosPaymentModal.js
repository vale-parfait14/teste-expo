import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { getPaymentMethods, initiateLygosPayment, verifyLygosPayment } from '../services/lygosApi.js';

const LygosPaymentModal = ({ show, onHide, pack, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (show) {
      fetchPaymentMethods();
    }
  }, [show]);

  const fetchPaymentMethods = async () => {
    try {
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError('Erreur lors du chargement des méthodes de paiement');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const paymentResponse = await initiateLygosPayment(pack, selectedMethod, billingInfo);
      const verificationResponse = await verifyLygosPayment(paymentResponse.paymentId);

      if (verificationResponse.status === 'success') {
        onPaymentSuccess(pack);
        onHide();
      } else {
        setError('La vérification du paiement a échoué');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodForm = () => {
    switch (selectedMethod?.type) {
      case 'CARD':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Numéro de carte</Form.Label>
              <Form.Control
                type="text"
                maxLength="16"
                required
              />
            </Form.Group>
            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date d'expiration</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="MM/YY"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>CVV</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength="3"
                    required
                  />
                </Form.Group>
              </div>
            </div>
          </>
        );

      case 'MOBILE_MONEY':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Numéro de téléphone</Form.Label>
            <Form.Control
              type="tel"
              required
              value={billingInfo.phone}
              onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
            />
          </Form.Group>
        );

      case 'BANK_TRANSFER':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Nom de la banque</Form.Label>
              <Form.Control
                type="text"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Numéro de compte</Form.Label>
              <Form.Control
                type="text"
                required
              />
            </Form.Group>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-shopping-cart me-2"></i>
          Paiement du pack {pack?.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="pack-summary mb-4">
          <Card.Body>
            <Card.Title className="h6 mb-3">Résumé de l'achat</Card.Title>
            <div className="mb-2"><strong>Pack:</strong> {pack?.name}</div>
            <div className="mb-0"><strong>Prix:</strong> {pack?.price} XOF/mois</div>
          </Card.Body>
        </Card>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <h6 className="mb-3">Choisir un mode de paiement</h6>
        
        {/* Afficher un message de chargement/erreur si pas de méthodes */}
        {paymentMethods.length === 0 ? (
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            {loading ? "Chargement des méthodes de paiement..." : "Aucune méthode de paiement disponible pour le moment"}
          </Alert>
        ) : (
          <div className="payment-methods mb-4">
            <div className="row g-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="col-md-4">
                  <Card 
                    className={`h-100 cursor-pointer ${selectedMethod?.id === method.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedMethod(method)}
                  >
                    <Card.Body className="text-center">
                      <i className={`fas fa-${method.icon} fa-2x mb-2 text-primary`}></i>
                      <div className="method-name">{method.name}</div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMethod && (
          <Form onSubmit={handleSubmit}>
            <h6 className="mb-3">Informations de facturation</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom complet</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    required
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                  />
                </Form.Group>
              </div>
            </div>

            {renderPaymentMethodForm()}

            <div className="d-grid mt-4">
              <Button 
                type="submit"
                variant="primary"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock me-2"></i>
                    Payer {pack?.price} XOF
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default LygosPaymentModal;
