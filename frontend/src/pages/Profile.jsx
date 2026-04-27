import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { api } from "../api/client";
import { FaStar } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";
import { IoMdTrophy } from "react-icons/io";
import { FaWindowClose } from "react-icons/fa";
import { LiaChessBoardSolid } from "react-icons/lia";
import { MdOutlineHorizontalRule } from "react-icons/md";

function Profile() {
  const [file, setFile] = useState("");
  const [url, setUrl] = useState("");
  const loginUser = useSelector((state) => state.auth.user);

   async function uploadingImage(e) {
    e.preventDefault();
    const formdata = new FormData(e.target);
    const res = await api.post("/upload", formdata);
    localStorage.setItem('picurl',res.data.avatar);
    setUrl(res.data.avatar);
  }

  return (
    <div className="min-h-screen   p-6 w-[70%] mx-auto flex flex-col gap-8">
      
     {/* //profile section */}
      <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <img
            src={localStorage.getItem('picurl') || loginUser?.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?_=20150327203541"}
            alt=""
            className="w-20 h-20 rounded-full"
          />

          <div>
            <h2 className="text-2xl font-semibold">
              {loginUser?.name || "Jane Doe"}
            </h2>
            <p className="text-gray-500">
              {loginUser?.email || "jane@example.com"}
            </p>

            <form onSubmit={uploadingImage} className="mt-2 flex gap-2">
              <input
                type="file"
                name="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="text-sm"
              />
              <button className="px-3 py-1 bg-blue-500 text-white rounded">
                Upload
              </button>
            </form>
          </div>
        </div>

       
      </div>

      {/* //stats section--- */}
     <div className="flex flex-col gap-5 bg-gray-100 rounded-md p-6">
      <div className="flex items-center justify-center gap-8">
      <h1 className="text-2xl font-bold mt-5">User stats</h1>
     <div className="h-[1px] bg-gray-400 w-[80%]"></div>
      </div>
    <div className="flex justify-around">
       <div className="bg-white p-4 h-[150px] w-[200px] text-l shadow-xl rounded-md flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <FaStar color="orange" size={40}/>
           <h1 className="font-bold text-xl">Rating</h1>
        </div>
        <h1 className="font-bold text-xl">{Math.round(loginUser.status.rating)}</h1>
        </div>
      <div className="bg-white p-4 h-[150px] w-[200px] text-l shadow-xl rounded-md flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <LiaChessBoardSolid size={38} />
           <h1 className="font-bold text-xl">Games Played</h1>
        </div>
        <h1 className="font-bold text-xl">{loginUser.status.gamesPlayed}</h1>
        </div>
      <div className="bg-white p-4 h-[150px] w-[200px] text-l shadow-xl rounded-md flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <IoMdTrophy size={38} color="yellow"/>
           <h1 className="font-bold text-xl">Wins</h1>
        </div>
        <h1 className="font-bold text-xl">{loginUser.status.wins}</h1>
        </div>
       <div className="bg-white p-4 h-[150px] w-[200px] text-l shadow-xl rounded-md flex flex-col gap-4">
        <div className="flex gap-2 items-center">
          <FaWindowClose size={38}/>
           <h1 className="font-bold text-xl">Looses</h1>
        </div>
        <h1 className="font-bold text-xl">{loginUser.status.looses}</h1>
        </div>
     </div>
    </div>

      
     </div>  
  );
}

export default Profile;