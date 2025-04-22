const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authenticateToken = require("../middleware/authMiddleware");

dotenv.config();

const router = express.Router();
router.use(cookieParser());

const activeRefreshTokens = new Set(); // itt tároljuk a tokeneket
router.post("/register", async (req, res) => {
  const { username, password, email, dob, bio, sex, searchedSex, minAge, maxAge } = req.body;


  try {
    const existingUsername = await User.findOne({ where: { username } });
    const existingEmail = await User.findOne({ where: { email } });

    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      dob,
      bio,
      sex,
      searchedSex,
      minAge,
      maxAge,
    });

    res.status(201).json({ message: "User successfully registered!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(404).json({ message: "User not found" });

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword)
    return res.status(400).json({ message: "Invalid username or password " });

  const accessToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email ,searchedSex: user.searchedSex, minAge: user.minAge, maxAge: user.maxAge},
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "3h" }
  );

  activeRefreshTokens.add(refreshToken); // refresh token lementése, későbbre
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 3 * 60 * 60 * 1000,
  });
  res.json({ accessToken });
});
// REFRESH TOKEN
router.post("/refresh", (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  // If token was already used, block reuse
  if (!activeRefreshTokens.has(oldRefreshToken)) {
    return res
      .status(403)
      .json({ error: "Token has already been used or expired" });
  }

  jwt.verify(oldRefreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });

    activeRefreshTokens.delete(oldRefreshToken);

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.SECRET_KEY,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    activeRefreshTokens.add(newRefreshToken);
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken: newAccessToken });
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) activeRefreshTokens.delete(refreshToken);

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

router.get('/check', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    
    res.json({ message: 'Token is valid', user });
  });
});

module.exports = router;
