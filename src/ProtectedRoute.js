// src/ProtectedRoute.js
import { Navigate, Outlet } from "react-router-dom";
// Importáld az új navigációs sávot
import BottomNavbar from "./Components/Navbar"; // <<<--- ITT IMPORTÁLOD

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('accessToken');
  if (!isAuthenticated) {
    // Ha nincs bejelentkezve, átirányítás a login oldalra
    return <Navigate to="/login" replace />;
  }

  // Ha be van jelentkezve:
  return (
    <> {/* Vagy <div> */}
      {/* Az Outlet rendereli a védett útvonal tartalmát (pl. MainScreen) */}
      {/* Adj alsó paddingot a tartalomnak, hogy a fix nav ne takarja ki */}
      <div style={{ paddingBottom: '75px' }}>
        <Outlet />
      </div>

      {/* Az új alsó navigációs sáv MEGHÍVÁSA */}
      <BottomNavbar /> {/* <<<--- ITT HÍVOD MEG */}
    </>
  );
};

export default ProtectedRoute;