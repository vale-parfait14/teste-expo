// Dans votre fichier Home.jsx, ajoutez cette importation au début
import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';

// Puis remplacez le formulaire existant dans la section contact par ce composant
// Définir ContactForm comme un composant séparé qui reçoit medicalServices en prop
const ContactForm = ({ medicalServices }) => {
  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    info: { error: false, msg: null }
  });
  
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();
    
    setStatus({
      submitting: true,
      submitted: false,
      info: { error: false, msg: 'Envoi en cours...' }
    });

    // Remplacez ces valeurs par vos identifiants EmailJS
    const serviceId = 'YOUR_SERVICE_ID';
    const templateId = 'YOUR_TEMPLATE_ID';
    const publicKey = 'YOUR_PUBLIC_KEY';

    emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      .then((result) => {
        console.log('Email envoyé avec succès!', result.text);
        form.current.reset();
        setStatus({
          submitting: false,
          submitted: true,
          info: { error: false, msg: 'Message envoyé avec succès!' }
        });
      })
      .catch((error) => {
        console.error('Erreur lors de l\'envoi de l\'email:', error.text);
        setStatus({
          submitting: false,
          submitted: false,
          info: { error: true, msg: 'Une erreur est survenue lors de l\'envoi du message.' }
        });
      });
  };

  return (
    <div className="contact-form-container">
      <h3>Envoyez-nous un message</h3>
      <form className="contact-form" ref={form} onSubmit={sendEmail}>
        {/* Champs de formulaire comme avant */}
        <div className="form-group">
          <label htmlFor="user_name">Nom complet</label>
          <input 
            type="text" 
            name="user_name" 
            id="user_name" 
            className="form-control" 
            placeholder="Votre nom" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="user_email">Email</label>
          <input 
            type="email" 
            name="user_email" 
            id="user_email" 
            className="form-control" 
            placeholder="Votre email" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="user_phone">Téléphone</label>
          <input 
            type="tel" 
            name="user_phone" 
            id="user_phone" 
            className="form-control" 
            placeholder="Votre numéro de téléphone" 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="user_service">Service</label>
          <select 
            name="user_service" 
            id="user_service" 
            className="form-control"
            required
          >
            <option value="">Sélectionnez un service</option>
            {medicalServices && medicalServices.map((service, index) => (
              <option key={index} value={service.name}>{service.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea 
            name="message" 
            id="message" 
            className="form-control" 
            rows="5" 
            placeholder="Votre message"
            required
          ></textarea>
        </div>
        
        <Button 
          variant="primary" 
          type="submit" 
          className="submit-button" 
          disabled={status.submitting}
        >
          {status.submitting ? 'Envoi en cours...' : 'Envoyer le message'}
        </Button>
        
        {status.info.msg && (
          <div className={`alert mt-3 ${status.info.error ? 'alert-danger' : 'alert-success'}`}>
            {status.info.msg}
          </div>
        )}
      </form>
    </div>
  );
};

export default ContactForm;