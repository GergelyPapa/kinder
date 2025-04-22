import '../Styles/Profile.css';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [error, setError] = useState('');
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        dob: '',
        bio: '',
        sex: '',
        searchedSex: '',
        ageRange: [18, 100],
        images: []  // Kezdetben üres lista
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/editProfile/getUser", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const datas = await response.json();
                console.log(datas);
                setUserData({
                    username: datas.username || "",
                    email: datas.email || "",
                    dob: datas.dob || "",
                    bio: datas.bio || "",
                    sex: datas.sex || "",
                    searchedSex: datas.searchedSex || "",
                    ageRange: [datas.minAge || 18, datas.maxAge || 100],
                    images: datas.images || []  // Kezdetben üres lista
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, [token, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSliderChange = (event, newValue) => {
        setUserData(prev => ({
            ...prev,
            ageRange: newValue
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setUserData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const uploadImagesToCloudinary = async (images) => {
        const formData = new FormData();
        formData.append('upload_preset', 'kinder'); // A preset neve
        images.forEach(image => {
          formData.append('file', image); // Az egyes képek feltöltése
        });
      
        try {
          const response = await fetch("https://api.cloudinary.com/v1_1/drrlfytpc/image/upload", {
            method: "POST",
            body: formData
          });
      
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(`Cloudinary error: ${data.error.message}`);
          }
      
          return data.secure_url; // Visszaadjuk az URL-t
        } catch (error) {
          throw new Error("Failed to upload image: " + error.message); // Hibakezelés
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            if (!token) {
                setError("Nincs érvényes token, jelentkezz be újra!");
                return;
            }
    
            const userId = jwtDecode(token).id; // A felhasználó ID-ja
    
            // Az új képek URL-jeinek letöltése
            let uploadedImageUrls = [];
            const existingImageUrls = userData.images.filter(image => typeof image === 'string');
    
            // Kiválasztjuk a még nem feltöltött képeket
            const newImages = userData.images.filter(image => typeof image !== 'string' && !existingImageUrls.includes(image));
    
            // Ha vannak új képek, akkor csak azokat töltjük fel és mentjük el a szerveren
            if (newImages.length > 0) {
                for (let image of newImages) {
                    const imageUrl = await uploadImagesToCloudinary([image]);
                    uploadedImageUrls.push(imageUrl);
                }
    
                // Képek frissítése a backend-en, ha van új kép
                const imageUpdateResponse = await fetch("http://localhost:5000/editProfile/saveUserImages", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: userId,
                        images: uploadedImageUrls // Csak az új képek URL-jeit küldjük el
                    })
                });
    
                const imageData = await imageUpdateResponse.json();
                if (!imageUpdateResponse.ok) {
                    throw new Error(imageData.message || "Hiba történt a képek mentésekor.");
                }
            }
    
            // Felhasználói adatok frissítése függetlenül a képektől
            const response = await fetch("http://localhost:5000/editProfile", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: userId,
                    searchedSex: userData.searchedSex,
                    minAge: userData.ageRange[0],
                    maxAge: userData.ageRange[1],
                    bio: userData.bio,
                })
            });
    
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Hiba történt a profil adatok mentésekor.");
            }
    
            alert("Adatok sikeresen elmentve!");
        } catch (err) {
            setError(err.message || "Szerverhiba történt");
        }
    };
    
    const handleDeleteImage = async (imageUrl) => {
        try {
            if (!token) {
                setError("Nincs érvényes token, jelentkezz be újra!");
                return;
            }

            const userId = jwtDecode(token).id; // A felhasználó ID-ja

            const response = await fetch("http://localhost:5000/editProfile/deleteUserImage", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    imageUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Hiba történt a kép törlésénél.");
            }

            // Frissítjük a képeket a törlés után
            setUserData((prev) => ({
                ...prev,
                images: prev.images.filter(img => img !== imageUrl)
            }));

            alert("Kép törölve!");
        } catch (error) {
            setError(error.message || "Hiba történt a kép törlésénél.");
        }
    };

    return (
        <div className="profile-container">
        {error && <p className="error-message">{error}</p>}

        <form className="profile-edit-form" onSubmit={handleSubmit}>
            <h2 className="profile-title">Profil szerkesztése</h2>
            <div className="form-row">
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" name="username" value={userData.username} disabled />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={userData.email} disabled />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="text" name="age" value={userData.dob} disabled />
                </div>

                <div className="form-group">
                    <label>Sex</label>
                    <select name="sex" value={userData.sex} disabled>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Interested in</label>
                    <select name="searchedSex" value={userData.searchedSex} onChange={handleChange}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="both">Both</option>
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group full-width">
                    <label>Preferred Age Range: {userData.ageRange[0]} - {userData.ageRange[1]}</label>
                    <Box sx={{ width: '100%', padding: '0 16px', marginTop: '20px' }} >
                        <Slider
                            value={userData.ageRange}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            min={18}
                            max={100}
                            disableSwap
                        />
                    </Box>
                </div>
            </div>

            <div className="form-group full-width">
                <label>Bio</label>
                <textarea name="bio" value={userData.bio} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
                <label>Uploaded Images</label>
                <div className="image-preview">
                    {userData.images.length > 0 ? (
                        userData.images.filter(image => typeof image === 'string').map((image, index) => (
                            <div key={index} className="image-preview-item">
                                <img src={image} alt={`Uploaded image ${index}`} className="preview-img" />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteImage(image)}
                                    className="delete-image-button"
                                    aria-label="Delete image"
                                    />
                            </div>
                        ))
                    ) : (
                        <p>No images uploaded yet.</p>
                    )}
                </div>
            </div>

            <label>Upload New Images</label>
            <div className="image-upload-box" onClick={() => document.getElementById("hiddenFileInput").click()}>
                Click here or drag & drop images
            </div>
            <input
                type="file"
                id="hiddenFileInput"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
            />
            <div className="image-preview">
                {userData.images.filter(image => typeof image !== 'string').map((image, index) => (
                    <img key={index} src={URL.createObjectURL(image)} alt="Uploaded Preview" className="preview-img" />
                ))}
            </div>

            <button type="submit" className="save-button">Save Changes</button>
        </form>
    </div>
    );
};

export default Profile;



