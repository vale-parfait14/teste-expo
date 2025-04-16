import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Accueil() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Accueil</h2>
      
      {/* User Information Section */}
      <div className="user-info">
        <h3>Mes Informations</h3>
        {userData && (
          <div>
            <p>Nom et prénom: {userData.fullName}</p>
            <p>Age: {userData.age}</p>
            <p>Sexe: {userData.gender}</p>
            <p>Téléphone: {userData.phone}</p>
            <p>Adresse: {userData.address}</p>
            <p>Pathologie: {userData.pathology}</p>
          </div>
        )}
      </div>

      {/* Appointment Dashboard Section */}
      <div className="appointment-dashboard">
        <h3>Tableau de bord des rendez-vous</h3>
        <button onClick={() => setAppointments([...appointments, { date: '', doctor: '', specialty: '' }])}>
          Nouveau rendez-vous
        </button>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Médecin</th>
              <th>Spécialité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt, index) => (
              <tr key={index}>
                <td><input type="datetime-local" /></td>
                <td><input type="text" placeholder="Nom du médecin" /></td>
                <td>
                  <select>
                    <option value="">Sélectionner une spécialité</option>
                    <option value="generaliste">Généraliste</option>
                    <option value="cardiologue">Cardiologue</option>
                    <option value="dermatologue">Dermatologue</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => {/* Save appointment logic */}}>Sauvegarder</button>
                  <button onClick={() => {/* Delete appointment logic */}}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}

export default Accueil;
