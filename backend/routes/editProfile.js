const express = require("express");
const User = require("../models/User");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authenticateToken = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const UserImages = require('../models/UserImages');


dotenv.config();
const router = express.Router();

router.use(cookieParser());


router.use(authenticateToken);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

router.put("/", async (req, res) => {
    const { searchedSex, minAge, maxAge, bio } = req.body;
    const userId = req.user.id; 

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({ searchedSex, minAge, maxAge, bio });

        res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});


router.get("/getUser", async (req, res) => {
    const userId = req.user.id; 

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userImages = await UserImages.findAll({
            where: { userId: userId }
        });
        
        const imageUrls = userImages.map(img => img.imgUrl);

        res.status(200).json({
            username: user.username,
            email: user.email,
            dob: user.dob,
            bio: user.bio,
            sex: user.sex,
            searchedSex: user.searchedSex,
            minAge: user.minAge,
            maxAge: user.maxAge,
            images: imageUrls, 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});


router.post("/uploadImg", upload.array('files', 10), async (req, res) => {
    try {
      const uploadedFiles = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload_stream(
            { resource_type: 'auto' }, 
            (error, result) => {
              if (error) {
                console.error(error);
                return res.status(500).json({ message: "Error uploading file" });
              }
              return result;
            }
          )
        )
      );
  
      res.status(200).json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading files" });
    }
  });


  router.post('/saveUserImages', async (req, res) => {
    const { userId, images } = req.body; 

    if (!userId || !images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: 'A felhasználó ID-ja és legalább egy kép URL szükséges!' });
    }

    try {
       
        const savedImages = [];
        
        for (let imgUrl of images) {
            const newImage = await UserImages.create({
                userId: userId, 
                imgUrl: imgUrl,
                uploadDate: new Date() 
            });
            savedImages.push(newImage);
        }

       
        res.status(200).json({
            message: 'Képek sikeresen elmentve!',
            savedImages: savedImages
        });
    } catch (error) {
        console.error('Hiba a képek mentésekor:', error);
        res.status(500).json({ message: 'Hiba történt a képek mentésekor' });
    }
});


router.delete('/deleteUserImage', async (req, res) => {
    const { imageUrl, userId } = req.body;
  
    try {
     
      const publicId = extractPublicId(imageUrl);
      if (!publicId) {
        return res.status(400).json({ message: 'Invalid image URL.' });
      }
  
    
      await cloudinary.uploader.destroy(publicId);
  

      const deletedImage = await UserImages.destroy({
        where: {
          userId: userId,
          imgUrl: imageUrl, 
        },
      });
  
      if (deletedImage === 0) {
        return res.status(404).json({ message: 'Image not found in database.' });
      }
  
    
      res.json({ message: 'Image deleted successfully.' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Error deleting image.' });
    }
  });
  
 
  function extractPublicId(imageUrl) {
    const regex = /\/v[0-9]+\/(.*)\.[a-z]{3,4}$/;
    const match = imageUrl.match(regex);
    return match ? match[1] : null;
  }
  

module.exports = router;
