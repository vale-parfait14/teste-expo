import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { getAuth } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

const DoctorPlanning = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  
  // État du formulaire de rendez-vous
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    heure: '08:00',
    duree: 30,
    motif: '',
    statut: 'planifié'
  });
  
  const auth = getAuth();
  
  useEffect(() => {
    const fetchDoctorAndAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !doctorId) {
          setLoading(false);
          return;
        }
        
        // Récupérer les informations du médecin
        const doctorDoc = await getDoc(doc(db, 'medecins', doctorId));
        if (!doctorDoc.exists()) {
          setMessage('Médecin non trouvé.');
          setLoading(false);
          return;
        }
        
        const doctorData = doctorDoc.data();
        // Vérifier que le médecin est bien affilié à cette structure
        if (doctorData.structureId !== user.uid) {
          setMessage('Ce médecin n\'est pas affilié à votre structure.');
          setLoading(false);
          return;
        }
        
        setDoctor({ id: doctorId, ...doctorData });
        
        // Récupérer les rendez-vous du médecin
        const appointmentsQuery = query(
          collection(db, 'rendezvous'),
          where('medecinId', '==', doctorId)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);
        
        // Récupérer les patients de la structure
        const patientsQuery = query(
          collection(db, 'patients'),
          where('structureId', '==', user.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientsData = patientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPatients(patientsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setMessage(`Erreur: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchDoctorAndAppointments();
  }, [auth, doctorId]);
  
  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm({ ...appointmentForm, [name]: value });
  };
  
  const resetAppointmentForm = () => {
    setAppointmentForm({
      patientId: '',
      date: selectedDate,
      heure: '08:00',
      duree: 30,
      motif: '',
      statut: 'planifié'
    });
    setCurrentAppointment(null);
  };
  
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // Vérifier la disponibilité
      const isAvailable = checkAvailability(
        appointmentForm.date, 
        appointmentForm.heure, 
        appointmentForm.duree,
        currentAppointment?.id
      );
      
      if (!isAvailable) {
        setMessage('Erreur: Ce créneau horaire n\'est pas disponible.');
        return;
      }
      
      const appointmentData = {
        ...appointmentForm,
        medecinId: doctorId,
        structureId: user.uid,
        createdBy: 'structure',
        createdById: user.uid
      };
      
      // Récupérer les informations du médecin et du patient pour les stocker dans le rendez-vous
      if (doctor) {
        appointmentData.medecinNom = `${doctor.prenom} ${doctor.nom}`;
        appointmentData.medecinSpecialite = doctor.specialite;
      }
      
      const patient = patients.find(p => p.id === appointmentForm.patientId);
      if (patient) {
        appointmentData.patientNom = `${patient.prenom} ${patient.nom}`;
      }
      
      if (currentAppointment) {
        // Mise à jour d'un rendez-vous existant
        await updateDoc(doc(db, 'rendezvous', currentAppointment.id), {
          ...appointmentData,
          updatedAt: Timestamp.now()
        });
        setMessage('Rendez-vous mis à jour avec succès.');
      } else {
        // Création d'un nouveau rendez-vous
        await addDoc(collection(db, 'rendezvous'), {
          ...appointmentData,
          createdAt: Timestamp.now()
        });
        setMessage('Rendez-vous ajouté avec succès.');
      }
      
      // Rafraîchir la liste des rendez-vous
      const appointmentsQuery = query(
        collection(db, 'rendezvous'),
        where('medecinId', '==', doctorId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);
      
      resetAppointmentForm();
      setShowAppointmentForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du rendez-vous:', error);
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  const handleEditAppointment = (appointment) => {
    setCurrentAppointment(appointment);
    setAppointmentForm({
      patientId: appointment.patientId || '',
      date: appointment.date || new Date().toISOString().split('T')[0],
      heure: appointment.heure || '08:00',
      duree: appointment.duree || 30,
      motif: appointment.motif || '',
      statut: appointment.statut || 'planifié'
    });
    setShowAppointmentForm(true);
  };
  
  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteDoc(doc(db, 'rendezvous', appointmentId));
        setMessage('Rendez-vous supprimé avec succès.');
        
        // Rafraîchir la liste des rendez-vous
        const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
        setAppointments(updatedAppointments);
      } catch (error) {
        console.error('Erreur lors de la suppression du rendez-vous:', error);
        setMessage(`Erreur: ${error.message}`);
      }
    }
  };
  
  const handleChangeAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'rendezvous', appointmentId), {
        statut: newStatus,
        updatedAt: Timestamp.now()
      });
      setMessage('Statut du rendez-vous mis à jour avec succès.');
      
      // Rafraîchir la liste des rendez-vous
      const updatedAppointments = appointments.map(app => {
        if (app.id === appointmentId) {
          return { ...app, statut: newStatus };
        }
        return app;
      });
      setAppointments(updatedAppointments);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setMessage(`Erreur: ${error.message}`);
    }
  };
  
  // Vérifier si un créneau horaire est disponible
  const checkAvailability = (date, heure, duree, excludeAppointmentId = null) => {
    if (!doctor || !doctor.disponibilites) return false;
    
    // Vérifier le jour de la semaine
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const daysMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = daysMap[dayOfWeek];
    
    // Vérifier si le médecin travaille ce jour-là
    let dayAvailability = null;
    if (Array.isArray(doctor.disponibilites)) {
      dayAvailability = doctor.disponibilites.find(d => 
        d.jour.toLowerCase() === dayName.toLowerCase()
      );
    } else if (doctor.disponibilites && doctor.disponibilites[dayName]) {
      dayAvailability = doctor.disponibilites[dayName].actif ? {
        heureDebut: doctor.disponibilites[dayName].debut,
        heureFin: doctor.disponibilites[dayName].fin
      } : null;
    }
    
    if (!dayAvailability) return false;
    
    // Vérifier si l'heure est dans la plage de disponibilité
    const startHour = dayAvailability.heureDebut || dayAvailability.debut;
    const endHour = dayAvailability.heureFin || dayAvailability.fin;
    
    if (heure < startHour || heure > endHour) return false;
    
    // Calculer l'heure de fin du rendez-vous
    const [hourH, hourM] = heure.split(':').map(Number);
    const appointmentEndTime = new Date();
    appointmentEndTime.setHours(hourH, hourM + parseInt(duree), 0, 0);
    const endTimeStr = `${appointmentEndTime.getHours().toString().padStart(2, '0')}:${appointmentEndTime.getMinutes().toString().padStart(2, '0')}`;
    
    if (endTimeStr > endHour) return false;
    
    // Vérifier les chevauchements avec d'autres rendez-vous
    const appointmentsOnDay = appointments.filter(app => 
      app.date === date && 
      app.statut !== 'annulé' &&
      app.id !== excludeAppointmentId
    );
    
    for (const app of appointmentsOnDay) {
      const [appHourH, appHourM] = app.heure.split(':').map(Number);
      const appStart = new Date();
      appStart.setHours(appHourH, appHourM, 0, 0);
      
      const appEnd = new Date();
      appEnd.setHours(appHourH, appHourM + parseInt(app.duree), 0, 0);
      
      const newAppStart = new Date();
      newAppStart.setHours(hourH, hourM, 0, 0);
      
      const newAppEnd = new Date();
      newAppEnd.setHours(hourH, hourM + parseInt(duree), 0, 0);
      
      // Vérifier s'il y a chevauchement
      if (
        (newAppStart >= appStart && newAppStart < appEnd) ||
        (newAppEnd > appStart && newAppEnd <= appEnd) ||
        (newAppStart <= appStart && newAppEnd >= appEnd)
      ) {
        return false;
      }
    }
    
    return true;
  };
  
  // Obtenir les créneaux disponibles pour une date donnée
  const getAvailableSlots = (date) => {
    if (!doctor || !doctor.disponibilites) return [];
    
    // Vérifier le jour de la semaine
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const daysMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayName = daysMap[dayOfWeek];
    
    // Obtenir les horaires du médecin pour ce jour
    let startHour = '08:00';
    let endHour = '18:00';
    
    if (Array.isArray(doctor.disponibilites)) {
      const dayAvailability = doctor.disponibilites.find(d => 
        d.jour.toLowerCase() === dayName.toLowerCase()
      );
      
      if (dayAvailability) {
        startHour = dayAvailability.heureDebut;
        endHour = dayAvailability.heureFin;
      } else {
        return []; // Le médecin ne travaille pas ce jour
      }
    } else if (doctor.disponibilites && doctor.disponibilites[dayName]) {
      if (!doctor.disponibilites[dayName].actif) {
        return []; // Le médecin ne travaille pas ce jour
      }
      startHour = doctor.disponibilites[dayName].debut;
      endHour = doctor.disponibilites[dayName].fin;
    } else {
      return []; // Pas de disponibilités pour ce jour
    }
    
    // Générer des créneaux de 15 minutes
    const slots = [];
    let currentHour = startHour;
    
    while (currentHour < endHour) {
      const [h, m] = currentHour.split(':').map(Number);
      const slotEndTime = new Date();
      slotEndTime.setHours(h, m + parseInt(appointmentForm.duree), 0, 0);
      const slotEndStr = `${slotEndTime.getHours().toString().padStart(2, '0')}:${slotEndTime.getMinutes().toString().padStart(2, '0')}`;
      
      if (slotEndStr <= endHour) {
        // Vérifier si le créneau est disponible
        const isAvailable = checkAvailability(
          date, 
          currentHour, 
          appointmentForm.duree,
          currentAppointment?.id
        );
        
        if (isAvailable) {
          slots.push(currentHour);
        }
      }
      
      // Passer au créneau suivant (par tranches de 15 minutes)
      const nextSlot = new Date();
      nextSlot.setHours(h, m + 15, 0, 0);
      currentHour = `${nextSlot.getHours().toString().padStart(2, '0')}:${nextSlot.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return slots;
  };
  
  // Filtrer les rendez-vous par date
  const filteredAppointments = appointments.filter(app => app.date === selectedDate);
  
  // Trier les rendez-vous par heure
  filteredAppointments.sort((a, b) => a.heure.localeCompare(b.heure));
  
  // Formater une date pour l'affichage
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) return <div className="container mt-5 text-center"><div className="spinner-border" role="status"></div></div>;

  if (!doctor) return (
    <div className="container mt-5">
      <div className="alert alert-danger">{message || "Médecin non trouvé ou non affilié à votre structure."}</div>
      <button className="btn btn-primary" onClick={() => window.history.back()}>Retour</button>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Planning du Dr. {doctor.prenom} {doctor.nom}</h2>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>Retour</button>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Informations du médecin</h5>
            <span className="badge bg-success">Affilié</span>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Spécialité:</strong> {doctor.specialite}</p>
              <p><strong>Email:</strong> {doctor.email}</p>
              <p><strong>Téléphone:</strong> {doctor.telephone}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Affilié depuis:</strong> {doctor.structureAffiliationDate ? new Date(doctor.structureAffiliationDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Assurances acceptées:</strong> {doctor.assurances ? doctor.assurances.join(', ') : 'Non spécifié'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Disponibilités</h5>
            </div>
            <div className="card-body">
              {doctor.disponibilites && Array.isArray(doctor.disponibilites) ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Début</th>
                      <th>Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctor.disponibilites.map((dispo, index) => (
                      <tr key={index}>
                        <td>{dispo.jour}</td>
                        <td>{dispo.heureDebut}</td>
                        <td>{dispo.heureFin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : doctor.disponibilites ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Disponible</th>
                      <th>Horaires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(doctor.disponibilites).map(([jour, dispo]) => (
                      <tr key={jour}>
                        <td>{jour.charAt(0).toUpperCase() + jour.slice(1)}</td>
                        <td>{dispo.actif ? 'Oui' : 'Non'}</td>
                        <td>{dispo.actif ? `${dispo.debut} - ${dispo.fin}` : 'Indisponible'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="alert alert-warning">Aucune disponibilité définie</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Gérer les rendez-vous</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="selectedDate" className="form-label">Sélectionner une date</label>
                <input
                  type="date"
                  id="selectedDate"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAppointmentForm({ ...appointmentForm, date: e.target.value });
                  }}
                />
              </div>
              
              <button 
                className="btn btn-primary w-100" 
                onClick={() => {
                  resetAppointmentForm();
                  setShowAppointmentForm(!showAppointmentForm);
                }}
              >
                {showAppointmentForm ? 'Annuler' : 'Ajouter un rendez-vous'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
      {showAppointmentForm && (
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{currentAppointment ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddAppointment}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="patientId" className="form-label">Patient</label>
                  <select
                    id="patientId"
                    name="patientId"
                    className="form-select"
                    value={appointmentForm.patientId}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="date" className="form-label">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={appointmentForm.date}
                    onChange={handleAppointmentChange}
                    required
                  />
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="heure" className="form-label">Heure</label>
                  <select
                    id="heure"
                    name="heure"
                    className="form-select"
                    value={appointmentForm.heure}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="">Sélectionner une heure</option>
                    {getAvailableSlots(appointmentForm.date).map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="duree" className="form-label">Durée (minutes)</label>
                  <select
                    id="duree"
                    name="duree"
                    className="form-select"
                    value={appointmentForm.duree}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="statut" className="form-label">Statut</label>
                  <select
                    id="statut"
                    name="statut"
                    className="form-select"
                    value={appointmentForm.statut}
                    onChange={handleAppointmentChange}
                    required
                  >
                    <option value="planifié">Planifié</option>
                    <option value="confirmé">Confirmé</option>
                    <option value="en cours">En cours</option>
                    <option value="terminé">Terminé</option>
                    <option value="annulé">Annulé</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="motif" className="form-label">Motif</label>
                <textarea
                  id="motif"
                  name="motif"
                  className="form-control"
                  rows="3"
                  value={appointmentForm.motif}
                  onChange={handleAppointmentChange}
                ></textarea>
              </div>
              
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={() => {
                  resetAppointmentForm();
                  setShowAppointmentForm(false);
                }}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {currentAppointment ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Rendez-vous du {formatDate(selectedDate)}</h5>
        </div>
        <div className="card-body">
          {filteredAppointments.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Durée</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appointment => {
                    const patient = patients.find(p => p.id === appointment.patientId);
                    return (
                      <tr key={appointment.id} className={
                        appointment.statut === 'annulé' ? 'table-danger' : 
                        appointment.statut === 'terminé' ? 'table-success' : 
                        appointment.statut === 'en cours' ? 'table-primary' : 
                        appointment.statut === 'confirmé' ? 'table-info' : ''
                      }>
                        <td>{appointment.heure}</td>
                        <td>{patient ? `${patient.prenom} ${patient.nom}` : appointment.patientNom || 'N/A'}</td>
                        <td>{appointment.duree} min</td>
                        <td>{appointment.motif || 'Non spécifié'}</td>
                        <td>
                          <span className={`badge ${
                            appointment.statut === 'annulé' ? 'bg-danger' :
                            appointment.statut === 'terminé' ? 'bg-success' :
                            appointment.statut === 'en cours' ? 'bg-primary' :
                            appointment.statut === 'confirmé' ? 'bg-info' :
                            appointment.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {appointment.statut.charAt(0).toUpperCase() + appointment.statut.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-info me-1"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            
                            <div className="dropdown">
                              <button className="btn btn-sm btn-secondary dropdown-toggle me-1" type="button" id={`statut-${appointment.id}`} data-bs-toggle="dropdown" aria-expanded="false">
                                Statut
                              </button>
                              <ul className="dropdown-menu" aria-labelledby={`statut-${appointment.id}`}>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'planifié')}>Planifié</button></li>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'confirmé')}>Confirmé</button></li>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'en cours')}>En cours</button></li>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'terminé')}>Terminé</button></li>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'annulé')}>Annulé</button></li>
                                <li><button className="dropdown-item" onClick={() => handleChangeAppointmentStatus(appointment.id, 'absent')}>Absent</button></li>
                              </ul>
                            </div>
                            
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucun rendez-vous planifié pour cette date.
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <h5>Vue calendrier</h5>
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Rendez-vous</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, i) => {
                const hour = `${i.toString().padStart(2, '0')}:00`;
                const appointmentsAtHour = filteredAppointments.filter(app => 
                  app.heure.startsWith(i.toString().padStart(2, '0') + ':')
                );
                return (
                  <tr key={hour}>
                    <td className="fw-bold" style={{ width: '100px' }}>{hour}</td>
                    <td>
                      {appointmentsAtHour.map(appointment => {
                        const patient = patients.find(p => p.id === appointment.patientId);
                        return (
                          <div 
                            key={appointment.id}
                            className={`p-2 mb-1 rounded ${
                              appointment.statut === 'annulé' ? 'bg-danger' :
                              appointment.statut === 'terminé' ? 'bg-success' :
                              appointment.statut === 'en cours' ? 'bg-primary' :
                              appointment.statut === 'confirmé' ? 'bg-info' :
                              appointment.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                            } text-white`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <div className="d-flex justify-content-between">
                              <span>{appointment.heure} - {patient ? `${patient.prenom} ${patient.nom}` : appointment.patientNom || 'N/A'}</span>
                              <span>{appointment.duree} min</span>
                            </div>
                            <small>{appointment.motif}</small>
                          </div>
                        );
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorPlanning;
