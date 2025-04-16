import { React, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Import your components
import Login from './components/Login.js';
import Manager from './pages/Manager.js';
import Patients from './pages/Patients.js';
import Medecins from './pages/Medecins.js';
import Structures from './pages/Structures.js';
import Attributions from './pages/Attributions.js';
import ConnexionsPatients from './pages/ConnexionsPatients.js';
import ConnexionsMedecins from './pages/ConnexionsMedecins.js';
import ConnexionsStructures from './pages/ConnexionsStructures.js';

import StructureDashboard from './pages/StructureDashboard.js';
import DoctorDashboard from './pages/DoctorDashboard.js';
import RegisterMedecins from './pages/RegisterMedecins.js';
import PortailMedecins from './pages/PortailMedecins.js';
import AccordMedecins from './pages/AccordMedecins.js';
import MedecinsDashboard from './pages/MedecinsDashboard.js';
import RegisterPatients from './pages/RegisterPatients.js';
import PortailPatients from './pages/PortailPatients.js';
import PatientDashboard from './pages/PatientDashboard.js';

import MessageriesPatients from './pages/MessageriesPatients.js';
import General from './components/General.js';
import AuthButtons from './components/AuthButtons.js';
import GeneralCroixBleue from './components/GeneralCroixBleue.js';

import PatientMessaging from './pages/PatientMessaging.js';
import Programmes from './pages/Programmes.js';
import { AuthProvider } from './contexts/AuthContext.js';
import Home from './pages/Home.js';
import QRRegistration from './pages/QRRegistration.js';
import QRRegister from './pages/QRRegister.js';
import QRScanRedirect from './pages/QRScanRedirect.js';
import StructureSpecialities from './pages/StructureSpecialities.js';
import ConsultationRequest from './pages/ConsultationRequest.js';
import HomeCroixBleue from './pages/HomeCroixBleue.js';
import HomeHopitalGeneral from './pages/HomeHopitalGeneral.js';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clinique-croix-bleue" element={<HomeCroixBleue />} /> {/* Route dynamique pour les structures */}
          <Route path="/hopital-general" element={<HomeHopitalGeneral />} /> {/* Route dynamique pour les structures */}

          <Route path="/auth-croix-bleue" element={<GeneralCroixBleue />} />
          <Route path="/auth" element={<General />} />
          <Route path='/AuthButtons' element={<AuthButtons/>}/>

          <Route path="/Manager" element={<Manager />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/medecins" element={<Medecins />} />
          <Route path="/structures" element={<Structures />} />
          <Route path="/attributions" element={<Attributions />} />
          <Route path="/connexionsPatients" element={<ConnexionsPatients />} />
          <Route path="/connexionsMedecins" element={<ConnexionsMedecins />} />
          <Route path="/ConnexionsStructures" element={<ConnexionsStructures />} />
          <Route path="/structuredashboard" element={<StructureDashboard />} />
          <Route path="/RegisterMedecins" element={<RegisterMedecins />} />
          <Route path="/PortailMedecins" element={<PortailMedecins />} />
          <Route path="/AccordMedecins" element={<AccordMedecins />} />
          <Route path="/medecindashboard" element={<MedecinsDashboard />} />
          <Route path="/RegisterPatients" element={<RegisterPatients />} />
          <Route path="/PortailPatients" element={<PortailPatients />} />
          <Route path="/patientdashboard" element={<PatientDashboard />} />
          <Route path="/messagerie/:patientId" element={<MessageriesPatients />} />
          <Route path="/PatientMessaging" element={<PatientMessaging />} />
          <Route path="/Programmes" element={<Programmes />} />
          <Route path="/register/:structureId" element={<QRRegistration />} />
          <Route path="/qr-register/:structureId" element={<QRRegister />} />
          <Route path="/qr-scan/:doctorId" element={<QRScanRedirect />} />
          <Route path="/structure-specialities/:structureId" element={<StructureSpecialities />} />
          <Route path="/consultation-request/:structureId/:speciality" element={<ConsultationRequest />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
