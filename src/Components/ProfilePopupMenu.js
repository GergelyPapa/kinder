import React, { useState, useEffect } from 'react';
import '../Styles/ProfilePopupMenu.css';

const ProfilePopupMenu = ({ partner, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Escape gomb lekezelés
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Profil adatainak lekérése
  useEffect(() => {
    const partnerIdToFetch = partner?.userId;
    if (!partnerIdToFetch) {
      setError('Hiányzó felhasználói azonosító.');
      setIsLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Nincs hitelesítve.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/users/${partnerIdToFetch}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Hiba (${response.status})`);
        }

        const data = await response.json();
        setProfileData(data);

        // Ha van képe, az első képet állítjuk be kezdetben
        if (data.photos && data.photos.length > 0) {
          setSelectedImage(data.photos[0].url);
        } else if (data.profileImageUrl) {
          setSelectedImage(data.profileImageUrl);
        } else {
          setSelectedImage(`https://avatar.iran.liara.run/username?username=${encodeURIComponent(data.username)}&length=1`);
        }
      } catch (err) {
        setError(err.message || 'Ismeretlen hiba történt');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [partner, BACKEND_URL]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="profile-popup-backdrop" onClick={handleBackdropClick}>
      <div className="profile-popup-container">
        <div className="profile-popup-header">
          <h3>{profileData?.username || partner?.username || 'Felhasználó'} profilja</h3>
          <button className="close-button" onClick={onClose} aria-label="Bezárás">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="profile-content">
          {isLoading && (
            <div className="profile-loading">
              <div className="spinner" />
              <p>Profil betöltése...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="profile-error">
              <p>{error}</p>
              <button onClick={onClose}>Bezárás</button>
            </div>
          )}

          {!isLoading && !error && profileData && (
            <>
              <div className="profile-main-section">
                <div className="profile-image-container">
                  <img
                    src={selectedImage}
                    alt={profileData.username}
                    className="profile-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/150/cccccc/ffffff?text=?';
                    }}
                  />
                </div>

                <div className="profile-basic-info">
                  <h4 className="profile-name">{profileData.username}</h4>
                  <p className="profile-details">
                    {profileData.age && <span>{profileData.age} éves</span>}
                    {profileData.age && profileData.city && <span> • </span>}
                    {profileData.city && <span>{profileData.city}</span>}
                  </p>
                </div>
              </div>

              {profileData.bio && (
                <div className="profile-bio">
                  <h5>Bemutatkozás</h5>
                  <p>{profileData.bio}</p>
                </div>
              )}

              {profileData.photos?.length > 1 && (
                <div className="profile-gallery">
                  <h5>Képek</h5>
                  <div className="gallery-grid">
                    {profileData.photos.map((photo) => (
                      <div 
                        className={`gallery-item ${selectedImage === photo.url ? 'active' : ''}`} 
                        key={photo.id || photo.url}
                      >
                        <img
                          src={photo.url}
                          alt={`${profileData.username} galéria képe`}
                          onClick={() => setSelectedImage(photo.url)}
                          className="gallery-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100/cccccc/ffffff?text=Hiba';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopupMenu;