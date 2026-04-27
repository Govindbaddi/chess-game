import { useNavigate } from "react-router-dom";
import bg from "../assets/bg.jpg";
import blackPawn from "../assets/black-pawn.png";
import whitePawn from "../assets/white-pawn.png";
import { LiaChessKnightSolid } from "react-icons/lia";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Glass Card */}
      <div className="w-[90%] max-w-6xl rounded-2xl bg-white/40 backdrop-blur-lg border border-white/30 shadow-2xl p-6">

        {/* Navbar */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
          <LiaChessKnightSolid  size={38} className="w-10 h-10"/> CHESS
          </h1>

          <div className="hidden md:flex gap-8 text-gray-700">
            <p className="cursor-pointer">About</p>
            <p className="cursor-pointer">Contact</p>
            <p className="cursor-pointer">Community</p>
          </div>
          <div className="flex gap-3">
          <button className="bg-white px-4 py-1 rounded-full shadow" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="bg-white px-4 py-1 rounded-full shadow" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
          </div>
        </div>

        {/* Main Section */}
        <div className="flex flex-col items-center text-center">

          {/* Chess Pieces */}
          <div className="flex justify-between w-full max-w-3xl mb-6">
            <img src={blackPawn} className="w-28 md:w-40 drop-shadow-2xl" />
            <div className="px-4 max-w-xs">
      <p className="text-gray-1000 text-l md:text-base leading-relaxed">
        Chess is a timeless game of strategy and intelligence. 
        Plan your moves, outthink your opponent, and master the board.
      </p>
    </div>
            <img src={whitePawn} className="w-28 md:w-40 drop-shadow-2xl" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-black-300 tracking-wide">
            CHESS
          </h1>

          <h2 className="text-3xl md:text-4xl text-red-600 italic -mt-2">
            Game
          </h2>

          {/* Button */}
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-6 py-2 border border-gray-700 rounded-full hover:bg-black hover:text-white transition"
          >
            Get Started!
          </button>
        </div>
      </div>
    </div>
  );
}