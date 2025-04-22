import { Navigate, Outlet } from "react-router-dom";
import Navbar from "./Components/Navbar";

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('accessToken');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      <Outlet /> {/* Itt jelennek meg a gyermek route-ok (pl. MainScreen) */}
    </>
  );
};


export default ProtectedRoute;