const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
  // Az Authorization fejlécből próbáljuk kinyerni a tokent
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; 


  
  if (!token) {
    return res.status(401).json({ message: "Nincs token, hozzáférés megtagadva!" });
  }

  try {
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    req.user = decoded;  
    next(); 
  } catch (error) {
    
    return res.status(403).json({ message: "Érvénytelen vagy lejárt token!" });

  }
};

module.exports = authenticateToken;
