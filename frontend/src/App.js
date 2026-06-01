import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/NavBar';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import Administration from './components/AdministrationPage';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import FooterPage from './components/FooterPage';
import DashBoardPage from './components/DashBoardPage';
import VehiculePage from './components/VehiculePage';
import ReleverPage from './components/ReleverPage';
import SimulationPage from './components/SimulationPage';
import UpdatePage from './components/UpdatePage';
import EntretienPage from './components/EntretienPage';
import { usePrivacy } from './privacy/PrivacyContext';

//import NotProtectedRoute from './components/NotProtectedRoute';

const NameApp = process.env.REACT_APP_NAME + " " + process.env.REACT_APP_VER;

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="vehicle-app-shell min-h-screen lg:pl-64">
        <div className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {children}
        </div>
        <FooterPage />
      </div>
    </>
  );
}

const routesMeta = {
  "/login": {
    title: `Connexion - ${NameApp}`,
    description: `Connectez-vous pour accéder à votre compte ${NameApp}.`,
  },
  "/register": {
    title: `Inscription - ${NameApp}`,
    description: `Créez un compte pour accéder à ${NameApp}.`,
  },
  "/profile": {
    title: `Profil - ${NameApp}`,
    description: "Bienvenue sur votre profil.",
  },
  "/settings": {
    title: `Paramètres - ${NameApp}`,
    description: "Bienvenue sur votre Paramètres.",
  },
  "/administration": {
    title: `Administration - ${NameApp}`,
    description: `Gérez les utilisateurs et les paramètres administratifs de ${NameApp}.`,
  },
  "/updates": {
    title: `Mises à jour - ${NameApp}`,
    description: `Consultez l'historique des mises à jour de ${NameApp}.`,
  },
  "/entretien": {
    title: `Entretien - ${NameApp}`,
    description: `Planifiez et suivez les entretiens de vos véhicules dans ${NameApp}.`,
  },
  // Ajoute d'autres routes ici...
};

function MetaUpdater() {
  const location = useLocation();
  const meta = routesMeta[location.pathname] || {
    title: `${NameApp}`,
    description: "Bienvenue sur VEHICLE, votre application de registre de véhicule privée.",
  };

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
    </Helmet>
  );
}

function PrivacyBlockedRoute({ children }) {
  const { isPrivacyMode } = usePrivacy();
  return isPrivacyMode ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Router>
      <MetaUpdater />
      <Routes>
        {/* Pages sans Navbar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Pages avec Navbar */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PrivacyBlockedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </PrivacyBlockedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/administration"
          element={
            <ProtectedAdminRoute>
              <PrivacyBlockedRoute>
                <AppLayout>
                  <Administration />
                </AppLayout>
              </PrivacyBlockedRoute>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedAdminRoute>
              <AppLayout>
                <DashBoardPage />
              </AppLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/vehicule"
          element={
            <ProtectedAdminRoute>
              <AppLayout>
                <VehiculePage />
              </AppLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/relever"
          element={
            <ProtectedAdminRoute>
              <PrivacyBlockedRoute>
                <AppLayout>
                  <ReleverPage />
                </AppLayout>
              </PrivacyBlockedRoute>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/simulation"
          element={
            <ProtectedAdminRoute>
              <AppLayout>
                <SimulationPage />
              </AppLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/entretien"
          element={
            <ProtectedAdminRoute>
              <AppLayout>
                <EntretienPage />
              </AppLayout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/updates"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UpdatePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Page d'accueil */}
        <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <DashBoardPage />
              </AppLayout>
            </ProtectedRoute>
          } />
      </Routes>
    </Router>
  );
}
