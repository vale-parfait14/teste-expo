// src/services/maytapiService.js
import axios from 'axios';

const PRODUCT_ID ='5e994f76-4f49-4057-aca4-6bef3b1de795';
const API_TOKEN = 'a0b5ba45-b4da-429e-ba5b-127851d9b92e';
const PHONE_ID = '77695' || 'default'; // ID du téléphone par défaut

// Configuration de base pour axios
const maytapiAPI = axios.create({
  baseURL: `https://api.maytapi.com/api/${PRODUCT_ID}`,
  headers: {
    'Content-Type': 'application/json',
    'x-maytapi-key': API_TOKEN
  }
});

// Fonction pour envoyer un message WhatsApp
export const sendWhatsAppMessage = async (phoneNumber, message, phoneId = PHONE_ID) => {
  try {
    // Formater le numéro de téléphone (ajouter le code du pays si nécessaire)
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await maytapiAPI.post(`/${phoneId}/sendMessage`, {
      to_number: formattedPhone,
      message: message,
      type: 'text'
    });
    
    console.log('Message envoyé avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message WhatsApp:', error.response?.data || error.message);
    throw error;
  }
};

// Fonction pour envoyer un message avec un modèle (template)
export const sendTemplateMessage = async (phoneNumber, templateName, parameters = [], phoneId = PHONE_ID) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await maytapiAPI.post(`/${phoneId}/sendTemplate`, {
      to_number: formattedPhone,
      template: templateName,
      parameters: parameters,
      language: 'fr' // Ou la langue de votre choix
    });
    
    console.log('Message template envoyé avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du template:', error.response?.data || error.message);
    throw error;
  }
};

// Fonction pour vérifier si un numéro existe sur WhatsApp
export const checkWhatsAppNumber = async (phoneNumber, phoneId = PHONE_ID) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    const response = await maytapiAPI.get(`/${phoneId}/checkNumber`, {
      params: { number: formattedPhone }
    });
    
    return response.data.success && response.data.result;
  } catch (error) {
    console.error('Erreur lors de la vérification du numéro:', error.response?.data || error.message);
    return false;
  }
};

// Fonction pour obtenir le statut du téléphone
export const getPhoneStatus = async (phoneId = PHONE_ID) => {
  try {
    const response = await maytapiAPI.get(`/${phoneId}/status`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error.response?.data || error.message);
    throw error;
  }
};

// Fonction utilitaire pour formater les numéros de téléphone
const formatPhoneNumber = (phoneNumber) => {
  // Supprimer tous les caractères non numériques
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ajouter le préfixe +221 (Sénégal) si nécessaire
  if (cleaned.startsWith('221')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+221${cleaned.substring(1)}`;
  } else if (!cleaned.startsWith('+')) {
    return `+221${cleaned}`;
  }
  
  return `+${cleaned}`;
};

export default {
  sendWhatsAppMessage,
  sendTemplateMessage,
  checkWhatsAppNumber,
  getPhoneStatus
};
