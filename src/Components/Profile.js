import '../Styles/Profile.css';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { MdDelete } from 'react-icons/md';

const Profile = () => {
    const [userData, setUserData] = useState({
        username: 'john_doe123',
        email: 'john.doe@example.com',
        age: 28,
        bio: 'Software developer who loves hiking and photography.',
        sex: 'male',
        searchedSex: 'female',
        ageRange: [22, 35],
        images: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSliderChange = (event, newValue) => {
        setUserData(prev => {
            let [min, max] = newValue;
            // Ensure minimum 1 year difference between values
            if (max - min < 1) {
                const activeThumb = event?.activeThumb || 0;
                if (activeThumb === 0) {
                    min = Math.max(18, max - 1);
                } else {
                    max = Math.min(100, min + 1);
                }
            }
            return { ...prev, ageRange: [min, max] };
        });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setUserData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const handleImageDelete = (index) => {
        setUserData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="profile-container">
            <h2 className="profile-title">Profil szerkesztése</h2>

            <form className="profile-edit-form" onSubmit={(e) => { e.preventDefault(); alert('Profile updated successfully!'); }}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Felhasználónév</label>
                        <input type="text" name="username" value={userData.username} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={userData.email} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Név</label>
                        <input type="number" name="age" value={userData.age} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Nem</label>
                        <select name="sex" value={userData.sex} onChange={handleChange}>
                            <option value="male">Férfi</option>
                            <option value="female">Nő</option>
                            <option value="other">Egyéb</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Kit keres?</label>
                        <select name="searchedSex" value={userData.searchedSex} onChange={handleChange}>
                            <option value="male">Férfi</option>
                            <option value="female">Nő</option>
                            <option value="both">Mindenki</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group full-width">
                        <label>Keresett életkor: {userData.ageRange[0]} - {userData.ageRange[1]}</label>
                        <div className="age-range-slider-container">
                            <Box sx={{ width: '100%', padding: '0 16px', marginTop: '20px' }}>
                                <Slider
                                    value={userData.ageRange}
                                    onChange={handleSliderChange}
                                    valueLabelDisplay="auto"
                                    min={18}
                                    max={100}
                                    disableSwap
                                    getAriaLabel={() => 'Age range'}
                                    getAriaValueText={(value) => `${value} years`}
                                />
                            </Box>
                        </div>
                    </div>
                </div>

                <div className="form-group full-width">
                    <label>Bio</label>
                    <textarea name="bio" value={userData.bio} onChange={handleChange} />
                </div>

                <div className="form-group full-width">
                    <label>Képek</label>
                    <div className="image-upload-box" onClick={() => document.getElementById("hiddenFileInput").click()} >
                        Húzza ide a képeket vagy kattintson a feltöltéshez
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
                        {userData.images.map((image, index) => (
                             <div key={index} className="image-container">
                                <img key={index} src={URL.createObjectURL(image)} alt="Uploaded Preview" className="preview-img" />
                                <button type="button" className="delete-button" onClick={() => handleImageDelete(index)}><MdDelete className="delete-icon" /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="submit" className="save-button">Mentés</button>
            </form>
        </div>
    );
};

export default Profile;