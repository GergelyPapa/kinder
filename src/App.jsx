import React from 'react';
import Login from './Components/Login';
import MainScreen from './Components/MainScreen';
import './Styles/Auth.css';
import Register from './Components/Register';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './Context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Profile from './Components/Profile';
import Chat from './Components/Chat'
import UserProfilePage from './Components/UserProfilePage';

function App() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ProtectedRoute-ot csak a védett útvonalak köré rakjuk */}
            <Route element={<ProtectedRoute />}>
              <Route path="/mainScreen" element={<MainScreen />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile/:userId" element={<UserProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;
