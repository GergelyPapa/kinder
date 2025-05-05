const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User'); 
const UserImages = require('../models/UserImages'); 
const authenticateToken = require('../middleware/authMiddleware');
const Swipe = require('../models/Swipe'); 
const Match = require('../models/Match'); 
const router = express.Router();

router.post("/swipe", authenticateToken, async (req, res) => {
  try {
    const { swipedUserId, swipeDirection } = req.body;
    const userId = req.user.id;

    
    const newSwipe = await Swipe.create({
      swiper_id: userId,
      swiped_id: swipedUserId,
      direction: swipeDirection,
    });

    if (swipeDirection === "right") {
      const reverseSwipe = await Swipe.findOne({
        where: {
          swiper_id: swipedUserId,
          swiped_id: userId,
          direction: "right",
        },
      });

      if (reverseSwipe) {

        const existingMatch = await Match.findOne({
          where: {
            [Op.or]: [
              { user1_id: userId, user2_id: swipedUserId },
              { user1_id: swipedUserId, user2_id: userId },
            ],
          },
        });

        if (!existingMatch) {
       
          const newMatch = await Match.create({
            user1_id: userId,
            user2_id: swipedUserId,
          });

    
          await Swipe.destroy({
            where: {
              [Op.or]: [
                { swiper_id: userId, swiped_id: swipedUserId },
                { swiper_id: swipedUserId, swiped_id: userId },
              ],
            },
          });

          return res.status(200).json({ message: "Match created!", match: newMatch });
        } else {
      
          await Swipe.destroy({
            where: {
              [Op.or]: [
                { swiper_id: userId, swiped_id: swipedUserId },
                { swiper_id: swipedUserId, swiped_id: userId },
              ],
            },
          });

          return res.status(200).json({ message: "Match already exists" });
        }
      }
    }

    res.status(200).json({ message: "Swipe recorded" });
  } catch (error) {
    console.error("Error in swipe endpoint:", error);
    res.status(500).json({ message: "Error recording swipe" });
  }
});


module.exports = router;



