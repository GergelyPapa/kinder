// src/Components/BottomNavbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// Győződj meg róla, hogy a helyes CSS fájlt importálod
import './../Styles/Navbar.css';

// NAV_ITEMS tömb frissítve SVG ikonokkal a 'label' helyett
const NAV_ITEMS = [
  {
    path: '/profile',
    label: ( // Profile SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="profile">
        <path d="M12,2A10,10,0,0,0,4.65,18.76h0a10,10,0,0,0,14.7,0h0A10,10,0,0,0,12,2Zm0,18a8,8,0,0,1-5.55-2.25,6,6,0,0,1,11.1,0A8,8,0,0,1,12,20ZM10,10a2,2,0,1,1,2,2A2,2,0,0,1,10,10Zm8.91,6A8,8,0,0,0,15,12.62a4,4,0,1,0-6,0A8,8,0,0,0,5.09,16,7.92,7.92,0,0,1,4,12a8,8,0,0,1,16,0A7.92,7.92,0,0,1,18.91,16Z"></path>
      </svg>
    ),
    name: 'Profil'
  },
  {
    path: '/mainScreen',
    label: ( // MainScreen (Home) SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="home">
         <path d="M20,8h0L14,2.74a3,3,0,0,0-4,0L4,8a3,3,0,0,0-1,2.26V19a3,3,0,0,0,3,3H18a3,3,0,0,0,3-3V10.25A3,3,0,0,0,20,8ZM14,20H10V15a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1Zm5-1a1,1,0,0,1-1,1H16V15a3,3,0,0,0-3-3H11a3,3,0,0,0-3,3v5H6a1,1,0,0,1-1-1V10.25a1,1,0,0,1,.34-.75l6-5.25a1,1,0,0,1,1.32,0l6,5.25a1,1,0,0,1,.34.75Z"></path>
      </svg>
    ),
    name: 'Keresés'
  },
  {
    path: '/chat',
    label: ( // Chat (Message) SVG
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="message">
        <path d="M19,4H5A3,3,0,0,0,2,7V17a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V7A3,3,0,0,0,19,4Zm-.41,2-5.88,5.88a1,1,0,0,1-1.42,0L5.41,6ZM20,17a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V7.41l5.88,5.88a3,3,0,0,0,4.24,0L20,7.41Z"></path>
      </svg>
    ),
    name: 'Chat'
  }
];

// Komponens neve legyen BottomNavbar
const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("Kijelentkezés...");
    localStorage.removeItem('accessToken');
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bottom-navbar">
      {/* Navigációs linkek */}
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          aria-label={item.name}
        >
          {/* A label most már közvetlenül az SVG kódot tartalmazza */}
          <span className="nav-icon">{item.label}</span>
          {/* <span className="nav-text">{item.name}</span> */}
        </NavLink>
      ))}

      {/* Kijelentkezés Gomb */}
      <button
        onClick={handleLogout}
        className="nav-item logout-button"
        aria-label="Kijelentkezés"
      >
        <span className="nav-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="logout">
            <path d="M12.59,13l-2.3,2.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l4-4a1,1,0,0,0,.21-.33,1,1,0,0,0,0-.76,1,1,0,0,0-.21-.33l-4-4a1,1,0,1,0-1.42,1.42L12.59,11H3a1,1,0,0,0,0,2ZM12,2A10,10,0,0,0,3,7.55a1,1,0,0,0,1.8.9A8,8,0,1,1,12,20a7.93,7.93,0,0,1-7.16-4.45,1,1,0,0,0-1.8.9A10,10,0,1,0,12,2Z"></path>
          </svg>
        </span>
      </button>
    </nav>
  );
};

// Export név javítása
export default Navbar;