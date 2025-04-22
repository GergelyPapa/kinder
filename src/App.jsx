import React from 'react';
import Profile from './Components/Profile';
import Login from './Components/Login';
import MainScreen from './Components/MainScreen';
import './Styles/Auth.css'
import Register from './Components/Register';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './Context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import Navbar from './Components/Navbar';


function App() {
  return(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/mainScreen" element={<MainScreen />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
  }
  export default App;