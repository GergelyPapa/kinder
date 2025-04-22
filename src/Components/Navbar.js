import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../Styles/Navbar.css";
import profileIcon from '../images/profile_icon.png';
import { useNavigate } from "react-router-dom";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const userMenuRef = useRef();


  const handleProfileEdit = () => {
    navigate('/profile'); // Átirányítás
    setIsDropdownOpen(false);
  };



  const handleMessages = () => {
    console.log("Üzenetek");
    setIsDropdownOpen(false);
  };



  const handleLogout = () => {
    console.log("Kijelentkezés");
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    <div className="user-menu" ref={userMenuRef}>
          <button 
            className="user-icon" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <img src={profileIcon} alt="Profil ikon" id="profilkep"/>
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleProfileEdit}>Profil Szerkesztése</button>
              <button onClick={handleMessages}>Üzenetek</button>
              <button onClick={handleLogout}>Kijelentkezés</button>
            </div>
          )}
        </div>
  );
};

export default Navbar;