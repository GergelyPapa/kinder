// routes/chat.js
const express = require('express');
const { Op } = require('sequelize');
const authenticateToken = require('../middleware/authMiddleware');
const Match = require('../models/Match'); 
const User = require('../models/User'); 
const UserImages = require('../models/UserImages'); 
const ChatMessage = require('../models/ChatMessages');
const { differenceInYears } = require('date-fns');

const router = express.Router();


router.get('/matches', authenticateToken, async (req, res) => {
    const userId = req.user.id; 

    try {
      
        const matches = await Match.findAll({
            where: {
                [Op.or]: [
                    { user1_id: userId },
                    { user2_id: userId }
                ]
            },
        
            include: [
                {
                    model: User,
                    as: 'user1', 
                    attributes: ['id', 'username','dob'] 
                },
                {
                    model: User,
                    as: 'user2',
                    attributes: ['id', 'username','dob']
                }
            ]
        });

        if (!matches || matches.length === 0) {
            return res.status(200).json([]); 
        }


        const matchedUsersPromises = matches.map(async (match) => {

            const otherUser = match.user1_id === userId ? match.user2 : match.user1;


            const profileImage = await UserImages.findOne({
                where: { userId: otherUser.id },
                attributes: ['imgUrl'],
               
            });

            return {
                matchId: match.id, 
                userId: otherUser.id,
                username: otherUser.username,
                profileImageUrl: profileImage ? profileImage.imgUrl : null 
            };
        });

      
        const matchedUsers = await Promise.all(matchedUsersPromises);

        res.status(200).json(matchedUsers);

    } catch (error) {
        console.error("Hiba a matchek lekérdezésekor:", error);
        res.status(500).json({ message: "Szerverhiba történt a matchek lekérdezése közben." });
    }
});



router.get('/matches/:matchId/messages', authenticateToken, async (req, res) => {
    const userId = req.user.id; 
    const { matchId } = req.params; 

    try {
        
        const match = await Match.findOne({
            where: {
                id: matchId, 
                [Op.or]: [ 
                    { user1_id: userId },
                    { user2_id: userId }
                ]
            }
        });

        
        if (!match) {
            return res.status(403).json({ message: "Nincs jogosultságod ennek a chatnek a megtekintéséhez." });
        }


        const messages = await ChatMessage.findAll({
            where: { match_id: matchId },
            order: [['createdAt', 'ASC']],
            include: [{ 
                model: User,
                as: 'sender',
                attributes: ['id', 'username'], 
                include: [{ 
                    model: UserImages,
                    as: 'images', 
                    attributes: ['imgUrl'], 
                    limit: 1, 
                    required: false
                }]
            }]
        });

        const formattedMessages = messages.map(msg => {
            const messageJson = msg.toJSON(); 
            return {
                ...messageJson,
                sender: {
                    ...messageJson.sender,
                  
                    profileImageUrl: messageJson.sender.images && messageJson.sender.images.length > 0
                        ? messageJson.sender.images[0].imgUrl
                        : null 
                },
               
            };
         });
       
        res.status(200).json(formattedMessages);

    } catch (error) {
        console.error(`Hiba a(z) ${matchId} match üzeneteinek lekérdezésekor:`, error);
        res.status(500).json({ message: "Szerverhiba történt az üzenetek lekérdezése közben." });
    }
});



router.get('/users/:userId', authenticateToken, async (req, res) => {
    const requestedUserId = req.params.userId;
    try {
        const user = await User.findByPk(requestedUserId, {
            attributes: { exclude: ['passwordHash'] }
        });
        if (!user) return res.status(404).json({ message: 'Felhasználó nem található' });

        const images = await UserImages.findAll({
            where: { userId: requestedUserId },
            attributes: ['id', 'imgUrl'],
            order: [['id', 'ASC']]
        });

        let age = null;
        if (user.dob) {
            try { age = differenceInYears(new Date(), new Date(user.dob)); } catch (e) { console.error("DOB Hiba:", e); }
        }

        const profileData = {
            id: user.id,
            username: user.username,
            age: age,
            city: user.city,
            bio: user.bio,
            profileImageUrl: images.length > 0 ? images[0].imgUrl : null,
            photos: images.map(img => ({ id: img.id, url: img.imgUrl })),
            // interests: [] // Ha lennének érdeklődési körök
        };
        res.status(200).json(profileData);
    } catch (error) {
        console.error(`Hiba a(z) ${requestedUserId} felhasználó adatainak lekérésekor:`, error);
        res.status(500).json({ message: 'Szerverhiba történt a profiladatok lekérése közben.' });
    }
});

module.exports = router; 