// Login.js
import React, { useState } from 'react';
import '../Styles/Auth.css';
import { Link,useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',  // Email helyett username
    password: '',
  });
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        withCredentials: true, // Cookie-hoz szükséges
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

   

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bejelentkezési hiba');
      }

      // Token és felhasználói adatok mentése

      localStorage.setItem("accessToken", data.accessToken);

      if(response.ok)
      {
        navigate("/mainScreen");
        console.log("bejelentkezes")
      }

    } catch (err) {
      setError(err.message || 'Szerverhiba történt');
    }
  };

  return (
    <div className="auth-container">
      <h2>Üdv újra!</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="email">Email</label> {/* <-- IDE ADD HOZZÁ htmlFor="email" */}
          <input
            type="text"
            id='email'
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Jelszó</label> {/* <-- IDE ADD HOZZÁ htmlFor="password" */}
          <input
            type="password"
            id='password'
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="auth-button">Bejelentkezés</button>
      </form>

      <p className="auth-link">Ha nincs fiókja
        <Link to="/register"> Regisztráljon itt</Link>
      </p>
    </div>
  );
};

export default Login;