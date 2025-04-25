// src/Components/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../Styles/UserProfilePage.css'; // Készítsünk majd egy CSS fájlt is

const UserProfilePage = () => {
    const { userId } = useParams(); // User ID kiolvasása az URL-ből
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setError('Nincs hitelesítve.');
                setIsLoading(false);
                navigate('/login'); // Opcionálisan átirányítás
                return;
            }

            if (!userId) {
                setError('Hiányzó felhasználói azonosító az URL-ben.');
                setIsLoading(false);
                return;
            }

            try {
                // A már meglévő backend végpontot hívjuk
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Nem sikerült lekérni a profil adatokat (${response.status})`);
                }

                const data = await response.json();
                setProfileData(data);
            } catch (err) {
                console.error('Profil lekérési hiba:', err);
                setError(err.message || 'Hiba történt a profil lekérése közben');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [userId, navigate, BACKEND_URL]); // Függőségek

    if (isLoading) {
        return <div className="profile-page-loading">Profil betöltése...</div>;
    }

    if (error) {
        return (
            <div className="profile-page-error">
                Hiba: {error}
                <br />
                <Link to="/chat">Vissza a chathez</Link>
            </div>
        );
    }

    if (!profileData) {
        return <div className="profile-page-error">Profiladatok nem találhatóak.</div>;
    }

    // Profil megjelenítése
    return (
        <div className="user-profile-container">
            <button onClick={() => navigate(-1)} className="back-button-profile">
                &larr; Vissza
            </button>
            <div className="profile-header">
                <img
                    src={profileData.profileImageUrl || `https://avatar.iran.liara.run/username?username=${encodeURIComponent(profileData.username)}&length=1`}
                    alt={`${profileData.username} profilképe`}
                    className="profile-avatar"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/ffffff?text=?'; }}
                />
                <div className="profile-header-info">
                    <h1>{profileData.username}</h1>
                    <p>{profileData.age ? `${profileData.age} éves` : ''}{profileData.location ? `, ${profileData.location}` : ''}</p>
                </div>
            </div>

            {profileData.bio && (
                <div className="profile-section">
                    <h2>Bemutatkozás</h2>
                    <p>{profileData.bio}</p>
                </div>
            )}

            {profileData.photos && profileData.photos.length > 0 && (
                <div className="profile-section">
                    <h2>Képek</h2>
                    <div className="profile-gallery">
                        {profileData.photos.map((photo) => (
                            <div key={photo.id || photo.url} className="gallery-image-container">
                                <img
                                    src={photo.url}
                                    alt={`${profileData.username} galéria képe`}
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150/cccccc/ffffff?text=Hiba'; }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ide jöhetnek további szekciók, pl. érdeklődési körök */}
            {/*
            {profileData.interests && profileData.interests.length > 0 && (
                <div className="profile-section">
                    <h2>Érdeklődési körök</h2>
                    <div className="interests-tags">
                        {profileData.interests.map((interest, index) => (
                            <span key={index} className="interest-tag">{interest}</span>
                        ))}
                    </div>
                </div>
            )}
            */}
        </div>
    );
};

export default UserProfilePage;