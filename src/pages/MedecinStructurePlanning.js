




import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../components/firebase-config.js';
import { getAuth } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

const MedecinStructurePlanning = () => {
  const [appointments, setAppointments] = useState([]);
  const [structureInfo, setStructureInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const auth = getAuth();
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }
        
        // Récupérer les informations du médecin
        const medecinDoc = await getDoc(doc(db, 'medecins', user.uid));
        if (!medecinDoc.exists()) {
          setMessage('Profil médecin non trouvé.');
          setLoading(false);
          return;
        }
        
        const medecinData = medecinDoc.data();
        
        // Vérifier si le médecin est affilié à une structure
        if (!medecinData.structureId) {
          setMessage('Vous n\'êtes pas affilié à une structure médicale.');
          setLoading(false);
          return;
        }
        
        // Récupérer les informations de la structure
        const structureDoc = await getDoc(doc(db, 'structures', medecinData.structureId));
        if (structureDoc.exists()) {
          setStructureInfo({
            id: medecinData.structureId,
            ...structureDoc.data()
          });
        }
        
        // Récupérer tous les rendez-vous du médecin
        const appointmentsQuery = query(
          collection(db, 'rendezvous'),
          where('medecinId', '==', user.uid)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        setMessage(`Erreur: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [auth]);
  
  // Fonction pour obtenir les dates d'une semaine
  function getWeekDates(date) {
    const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer le lundi
    
    const monday = new Date(date);
    monday.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      weekDates.push(nextDate);
    }
    
    return weekDates;
  }
  
  // Fonction pour obtenir les dates d'un mois
  function getMonthDates(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Obtenir le premier jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Convertir Dimanche de 0 à 7
    
    const calendarDays = [];
    
    // Ajouter les jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i + 1);
      calendarDays.push({ date, currentMonth: false });
    }
    
    // Ajouter les jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      calendarDays.push({ date, currentMonth: true });
    }
    
    // Ajouter les jours du mois suivant pour compléter la grille
    const remainingDays = 42 - calendarDays.length; // 6 semaines * 7 jours = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      calendarDays.push({ date, currentMonth: false });
    }
    
    return calendarDays;
  }
  
  // Passer à la semaine précédente
  const goToPrevWeek = () => {
    const prevWeekDate = new Date(currentWeek[0]);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    setCurrentWeek(getWeekDates(prevWeekDate));
  };
  
  // Passer à la semaine suivante
  const goToNextWeek = () => {
    const nextWeekDate = new Date(currentWeek[0]);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    setCurrentWeek(getWeekDates(nextWeekDate));
  };
  
  // Passer au mois précédent
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Passer au mois suivant
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Filtrer les rendez-vous par date
  const getAppointmentsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(app => app.date === dateString);
  };
  
  // Formater une date pour l'affichage
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  // Formater une date courte
  const formatShortDate = (date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  
  // Formater le mois et l'année
  const formatMonthYear = (month, year) => {
    const date = new Date(year, month);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="container mt-5 text-center"><div className="spinner-border" role="status"></div></div>;

  if (!structureInfo) return (
    <div className="container mt-5">
      <div className="alert alert-warning">{message || "Vous n'êtes pas affilié à une structure médicale."}</div>
      <button className="btn btn-primary" onClick={() => window.history.back()}>Retour</button>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Mon Planning - {structureInfo.nom}</h2>
        <button className="btn btn-secondary" onClick={() => window.history.back()}>Retour</button>
      </div>
      
      {message && (
        <div className={`alert ${message.includes('Erreur') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Planning des rendez-vous</h5>
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${viewMode === 'day' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setViewMode('day')}
              >
                Jour
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'week' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setViewMode('week')}
              >
                Semaine
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'month' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setViewMode('month')}
              >
                Mois
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Vue par jour */}
          {viewMode === 'day' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const prevDate = new Date(selectedDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    setSelectedDate(prevDate.toISOString().split('T')[0]);
                  }}
                >
                  <i className="bi bi-chevron-left"></i> Jour précédent
                </button>
                
                <div className="d-flex align-items-center">
                  <input
                    type="date"
                    className="form-control mx-2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <h5 className="mb-0 ms-2">{formatDate(new Date(selectedDate))}</h5>
                </div>
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const nextDate = new Date(selectedDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    setSelectedDate(nextDate.toISOString().split('T')[0]);
                  }}
                >
                  Jour suivant <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Heure</th>
                      <th>Rendez-vous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = `${i.toString().padStart(2, '0')}:00`;
                      const appointmentsAtHour = appointments.filter(app => 
                        app.date === selectedDate && app.heure.startsWith(i.toString().padStart(2, '0') + ':')
                      );
                      return (
                        <tr key={hour}>
                          <td className="fw-bold">{hour}</td>
                          <td>
                            {appointmentsAtHour.map(appointment => (
                              <div 
                                key={appointment.id}
                                className={`p-2 mb-1 rounded ${
                                  appointment.statut === 'annulé' ? 'bg-danger' :
                                  appointment.statut === 'terminé' ? 'bg-success' :
                                  appointment.statut === 'en cours' ? 'bg-primary' :
                                  appointment.statut === 'confirmé' ? 'bg-info' :
                                  appointment.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                                } text-white`}
                              >
                                <div className="d-flex justify-content-between">
                                  <span>{appointment.heure} - {appointment.patientNom || 'Patient'}</span>
                                  <span>{appointment.duree} min</span>
                                </div>
                                <small>{appointment.motif || 'Consultation'}</small>
                              </div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          
          {/* Vue par semaine */}
          {viewMode === 'week' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={goToPrevWeek}
                >
                  <i className="bi bi-chevron-left"></i> Semaine précédente
                </button>
                
                <h5 className="mb-0">
                  Semaine du {formatShortDate(currentWeek[0])} au {formatShortDate(currentWeek[6])}
                </h5>
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={goToNextWeek}
                >
                  Semaine suivante <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Heure</th>
                      {currentWeek.map((date, index) => (
                        <th key={index} className={date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] ? 'table-primary' : ''}>
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}<br />
                          {date.getDate()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => {
                      const hour = `${(i + 8).toString().padStart(2, '0')}:00`;
                      return (
                        <tr key={hour}>
                          <td className="fw-bold">{hour}</td>
                          {currentWeek.map((date, dayIndex) => {
                            const dateString = date.toISOString().split('T')[0];
                            const appointmentsAtHour = appointments.filter(app => 
                              app.date === dateString && 
                              app.heure.startsWith((i + 8).toString().padStart(2, '0') + ':')
                            );
                            return (
                              <td key={dayIndex} className={dateString === new Date().toISOString().split('T')[0] ? 'table-primary' : ''}>
                                {appointmentsAtHour.map(appointment => (
                                  <div 
                                    key={appointment.id}
                                    className={`p-1 mb-1 rounded ${
                                      appointment.statut === 'annulé' ? 'bg-danger' :
                                      appointment.statut === 'terminé' ? 'bg-success' :
                                      appointment.statut === 'en cours' ? 'bg-primary' :
                                      appointment.statut === 'confirmé' ? 'bg-info' :
                                      appointment.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                                    } text-white small`}
                                  >
                                    {appointment.heure} - {appointment.patientNom}
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Vue par mois */}
          {viewMode === 'month' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={goToPrevMonth}
                >
                  <i className="bi bi-chevron-left"></i> Mois précédent
                </button>
                
                <h5 className="mb-0">{formatMonthYear(currentMonth, currentYear)}</h5>
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={goToNextMonth}
                >
                  Mois suivant <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Lun</th>
                      <th>Mar</th>
                      <th>Mer</th>
                      <th>Jeu</th>
                      <th>Ven</th>
                      <th>Sam</th>
                      <th>Dim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const monthDates = getMonthDates(currentYear, currentMonth);
                      const rows = [];
                      for (let i = 0; i < monthDates.length; i += 7) {
                        rows.push(
                          <tr key={i}>
                            {monthDates.slice(i, i + 7).map((day, index) => {
                              const dateString = day.date.toISOString().split('T')[0];
                              const appointmentsOnDay = getAppointmentsForDate(day.date);
                              const isToday = dateString === new Date().toISOString().split('T')[0];
                              
                              return (
                                <td 
                                  key={index} 
                                  className={`${!day.currentMonth ? 'text-muted' : ''} ${isToday ? 'table-primary' : ''}`}
                                  style={{ height: '100px', width: '14%', verticalAlign: 'top' }}
                                >
                                  <div className="d-flex justify-content-between">
                                    <span className={`badge ${isToday ? 'bg-primary' : 'bg-light text-dark'}`}>
                                      {day.date.getDate()}
                                    </span>
                                    {appointmentsOnDay.length > 0 && (
                                      <span className="badge bg-info">{appointmentsOnDay.length}</span>
                                    )}
                                  </div>
                                  <div className="mt-1">
                                    {appointmentsOnDay.slice(0, 3).map(appointment => (
                                      <div 
                                        key={appointment.id}
                                        className={`p-1 mb-1 rounded ${
                                          appointment.statut === 'annulé' ? 'bg-danger' :
                                          appointment.statut === 'terminé' ? 'bg-success' :
                                          appointment.statut === 'en cours' ? 'bg-primary' :
                                          appointment.statut === 'confirmé' ? 'bg-info' :
                                          appointment.statut === 'absent' ? 'bg-warning' : 'bg-secondary'
                                        } text-white small`}
                                      >
                                        {appointment.heure}
                                      </div>
                                    ))}
                                    {appointmentsOnDay.length > 3 && (
                                      <small className="text-muted">+ {appointmentsOnDay.length - 3} autres</small>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Prochains rendez-vous</h5>
        </div>
        <div className="card-body">
          {appointments.filter(app => 
            app.date >= new Date().toISOString().split('T')[0] && 
            app.statut !== 'annulé' && 
            app.statut !== 'terminé'
          ).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.heure.localeCompare(b.heure);
          }).slice(0, 10).length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Durée</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.filter(app => 
                    app.date >= new Date().toISOString().split('T')[0] && 
                    app.statut !== 'annulé' && 
                    app.statut !== 'terminé'
                  ).sort((a, b) => {
                    if (a.date !== b.date) return a.date.localeCompare(b.date);
                    return a.heure.localeCompare(b.heure);
                  }).slice(0, 10).map(appointment => (
                    <tr key={appointment.id}>
                      <td>{new Date(appointment.date).toLocaleDateString()}</td>
                      <td>{appointment.heure}</td>
                      <td>{appointment.patientNom}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info">
              Aucun rendez-vous à venir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedecinStructurePlanning;
