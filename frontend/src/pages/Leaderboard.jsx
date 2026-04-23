import { useEffect } from "react";
import { api } from "../api/client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { TfiCup } from "react-icons/tfi";
import { IoShieldOutline } from "react-icons/io5";
import { FaGamepad } from "react-icons/fa";
import { AiFillFire } from "react-icons/ai";
import { FaStar } from "react-icons/fa6";
import { FaRegUserCircle } from "react-icons/fa";
import { GiPodiumWinner } from "react-icons/gi";
import { GiPodiumSecond } from "react-icons/gi";
import { GiPodiumThird } from "react-icons/gi";

function Leaderboard() {
  const loggedUser=useSelector((state)=>{ return state.auth.user})
  //console.log(loggedUser,"logged in usaear")
    const [data,setData]=useState([])
    useEffect(()=>{
       async function leaderboardData(){
            try{
                const res=await api.get("leader/usersAll")
                setData(res.data)
                
            }catch(err){
               alert(err.message)
            }
        }
        leaderboardData()
    },[])
   // console.log(data,"data is getting")
  function RankIcon({ rank }) {
    if (rank === 1) return <GiPodiumWinner color="#b18d18" size={34} />;
    else if (rank === 2) return <GiPodiumSecond color="#728b96" size={34} />;
    else if (rank === 3) return <GiPodiumThird color="#ae7c61" size={34} />;
    return rank;
  }

  function getTagColor(row) {
    const colors = [
      "bg-blue-200 text-blue-800",
      "bg-yellow-200 text-yellow-800",
      "bg-orange-200 text-orange-800",
      "bg-green-200 text-green-800",
    ];
    const index = row % colors.length;
    return colors[index];
  }

  return (
    <div className="flex flex-col gap-10 p-10 w-[100%]">
      <div className="flex gap-4 items-center">
        <div className="bg-blue-200 p-4 rounded">
          <TfiCup size={40} color="#2a3a8a" />
        </div>
        <div>
          <h1 className="text-4xl text-blue-900">Leaderboard</h1>
          <p className="text-gray-500">Top players ranked by performance</p>
        </div>
      </div>
      <div className="rounded rounded-[20px] w-[100%] overflow-hidden">
        <table className="rounded border text-xl w-[100%]">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="p-4">#</th>
              <th>
                <div className="flex items-center gap-2">Name</div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <TfiCup />
                  Wins
                </div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <IoShieldOutline />
                  Losses
                </div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <FaGamepad />
                  Games Played
                </div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <AiFillFire />
                  Streak
                </div>
              </th>
              <th>
                <div className="flex items-center gap-2">
                  <FaStar />
                  Rating
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {data.map((u) => (
              <tr
                className={
                  loggedUser._id.toString() === u._id.toString()
                    ? "bg-yellow-100 border border-l-[10px] border-l-yellow-400"
                    : "border"
                }
              >
                <td className="p-6">
                  <RankIcon rank={u.rank} />
                </td>
                <td>
                  <div className="flex gap-2 items-center">
                    <FaRegUserCircle size={30} />
                    {u.name}
                  </div>
                </td>
                <td className="text-green-700">{u.status.wins}</td>
                <td className="text-red-600">{u.status.looses}</td>
                <td>{u.status.gamesPlayed}</td>
                <td
                  className={u.status.currentStreak > 0 ? "text-green-600" : ""}
                >
                  <div className="flex gap-2 items-center">
                    <AiFillFire />
                    {u.status.currentStreak}
                  </div>
                </td>
                <td>
                  <div
                    className={
                      getTagColor(u.rank) +
                      " flex gap-4 items-center pt-2 pb-2 pl-6 pr-6 rounded rounded-full bg-blue-200 w-fit"
                    }
                  >
                    <FaStar />
                    {u.status.rating}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default Leaderboard;
