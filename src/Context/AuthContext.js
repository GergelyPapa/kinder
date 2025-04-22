import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem("accessToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
  const [isLoading, setIsLoading] = useState(true);

  // Frissítse a tokent, ha lejár
  const refreshToken = async () => {
    try {
      const refreshResponse = await fetch("http://localhost:5000/auth/refresh", {
        method: "POST",
        credentials: "include",  // szükséges a cookie-k kezeléséhez
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem("accessToken", data.accessToken);
        setAuthToken(data.accessToken);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      setIsAuthenticated(false);
    }
  };

  // Ellenőrizze, hogy a token érvényes-e minden egyes oldal betöltésekor
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      // Itt meghívhatod a refreshToken-t is, ha szükséges
      refreshToken().then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, setAuthToken, setIsAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
