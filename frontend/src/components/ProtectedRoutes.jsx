import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoutes = () => {
  const user = useSelector((state) => state.auth.user);
  const guest=JSON.parse(localStorage.getItem('guest'))
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if(!isAuthenticated && !guest){
    return <h1>loading....</h1>
  }

  if (!user && !guest) {
    return <Navigate to="/login" replace={true} />;
  }

  return <Outlet />;
};