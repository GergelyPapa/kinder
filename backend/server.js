// server.js
const express = require("express");
const sequelize = require('./config/db');
const http = require('http'); 
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require("cors");

// Route importok
const authRoutes = require('./routes/authRoutes');
const editProfile = require('./routes/editProfile');
const findPeople = require('./routes/findPeople');
const swipe = require('./routes/swipe');
const chatRoutes = require('./routes/Chat');


const initializeSocket = require('./socket/socketHandler'); 

dotenv.config();

const app = express();


const httpServer = http.createServer(app); 


const corsOptions = {
  origin: "http://localhost:3000", 
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
};

// Middleware-k
app.use(cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser());

// Route-ok
app.use('/auth', authRoutes);

app.use('/editProfile', editProfile);
app.use('/api', findPeople);
app.use("/api", swipe);
app.use('/api', chatRoutes);


initializeSocket(httpServer, corsOptions); 


sequelize.sync().then(() => {
    const PORT = process.env.PORT || 4000;
   
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
       
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});