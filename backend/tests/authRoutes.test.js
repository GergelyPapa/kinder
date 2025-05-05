const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("../routes/authRoutes"); // vagy ahová mentetted a kódod
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Mock env változók
process.env.JWT_SECRET = "testsecret";
process.env.JWT_REFRESH_SECRET = "testrefreshsecret";
process.env.REFRESH_SECRET = "testrefreshsecret";
process.env.SECRET_KEY = "testsecretkey";

// Express app setup
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/", authRoutes);

// Mock User model
jest.mock("../models/User");

describe("Auth Routes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /register", () => {
    it("should register a new user", async () => {
      User.findOne.mockResolvedValue(null); // No existing username/email
      User.create.mockResolvedValue({ id: 1 });

      const res = await request(app).post("/register").send({
        username: "testuser",
        password: "Test1234!",
        email: "test@example.com",
        dob: "2000-01-01",
        bio: "Hello",
        city: "Budapest",
        sex: "male",
        searchedSex: "female",
        minAge: 18,
        maxAge: 30,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User successfully registered!");
    });

    it("should return 400 if username exists", async () => {
      User.findOne.mockResolvedValueOnce({ username: "testuser" });

      const res = await request(app).post("/register").send({
        username: "testuser",
        email: "new@example.com",
        password: "pass",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Username already exists");
    });

    it("should return 400 if email exists", async () => {
      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ email: "test@example.com" });

      const res = await request(app).post("/register").send({
        username: "newuser",
        email: "test@example.com",
        password: "pass",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Email already in use");
    });
  });

  describe("POST /login", () => {
    it("should login user with valid credentials", async () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("Test1234!", 10),
        searchedSex: "female",
        minAge: 18,
        maxAge: 30,
      };

      User.findOne.mockResolvedValue(user);

      const res = await request(app)
        .post("/login")
        .send({ email: user.email, password: "Test1234!" });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it("should return 404 if user not found", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/login")
        .send({ email: "unknown@example.com", password: "password" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 400 for invalid password", async () => {
      const user = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("CorrectPassword", 10),
      };

      User.findOne.mockResolvedValue(user);

      const res = await request(app)
        .post("/login")
        .send({ email: user.email, password: "WrongPassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/Invalid username or password/);
    });
  });

  describe("POST /logout", () => {
    it("should clear refresh token", async () => {
      const res = await request(app)
        .post("/logout")
        .set("Cookie", ["refreshToken=sampletoken"]);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Logged out successfully");
    });
  });

  describe("GET /check", () => {
    it("should validate a correct token", async () => {
      const token = jwt.sign({ id: 1, username: "testuser" }, process.env.JWT_SECRET);

      const res = await request(app)
        .get("/check")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Token is valid");
    });

    it("should return 401 if token is missing", async () => {
      const res = await request(app).get("/check");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Access token is missing");
    });
  });
});
