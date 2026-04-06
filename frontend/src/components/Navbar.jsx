import { useDispatch, useSelector } from "react-redux";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../slices/AuthSlice";
import { LiaChessKnightSolid } from "react-icons/lia";
import { FaTrophy } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { FiLogOut } from "react-icons/fi";
import { PiLineVerticalBold } from "react-icons/pi";

 const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const usersta = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();
  const navigate=useNavigate()
  console.log(usersta,"status checking")
  function handleLogout() {
    dispatch(logout());
  }

  return (
    <div className="bg-[url(/img/chessbg2.jpg)] bg-cover bg-center h-screen w-screen">
      <div className="p-4 bg-blue-600 flex flex-row justify-between items-center text-lg  text-white ">
        <div>
          <Link to="/lobby" className="flex gap-2 items-center justify-center"><LiaChessKnightSolid  className="w-10 h-10"/>Lobby</Link>
        </div>
        <div>
          {user ? (
            <div className="flex gap-2">
              <Link to="/profile" className="flex gap-2"><CgProfile className="w-6 h-6"/>Profile</Link>
              <PiLineVerticalBold className="h-6"/>
              <Link to="/leaderboard" className="flex gap-2"><FaTrophy className="w-6 h-6"/>LeaderBoard</Link>
              <PiLineVerticalBold className="h-6"/>
            <button onClick={handleLogout} className="flex gap-2"><FiLogOut className="w-6 h-6"/>Logout</button>
            </div>
            
          ) : (
            <div className="flex flex-row gap-4">
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </div>
          )}
        </div>
      </div>
      <div >
         {/* <div className="absolute inset-0 bg-white opacity-10"></div> */}
        <Outlet />
      </div>
    </div>
  );
};

export default Navbar;
