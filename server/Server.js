// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou un autre service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Validation des données
const validateContactInput = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Le nom est requis';
  }
  
  if (!data.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(data.email)) {
    errors.email = 'Email invalide';
  }
  
  if (!data.message || data.message.trim() === '') {
    errors.message = 'Le message est requis';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// Route pour le formulaire de contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  // Validation
  const validation = validateContactInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      success: false, 
      message: 'Données invalides', 
      errors: validation.errors 
    });
  }
  
  // Configuration de l'email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Nouveau message de contact de ${name}`,
    text: `
      Nom: ${name}
      Email: ${email}
      
      Message:
      ${message}
    `,
    html: `
      <h3>Nouveau message de contact</h3>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  };
  
  try {
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
