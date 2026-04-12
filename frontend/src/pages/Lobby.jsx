import React, { useState } from 'react'
import { connectSocket, socket } from '../socket'
import {useNavigate} from 'react-router-dom'
import { IoIosAddCircle } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { LuLogIn } from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa";
import { PiLineVertical } from "react-icons/pi";
import { FcIdea } from "react-icons/fc";
import { TbCircleNumber1Filled } from "react-icons/tb";
import { TbCircleNumber2Filled } from "react-icons/tb";
import { TbCircleNumber3Filled } from "react-icons/tb";

function Lobby() {
  const [roomCode, setRoomCode] = useState("")
  const navigate=useNavigate()
  //creating room----
  function createRoom(){

    connectSocket()
    socket.emit("room:create",(Response)=>{
      if(!Response?.ok){
       return alert(Response.message)
      }
      navigate(`/rooms/${Response.room.roomCode}`)
    })
  }
  //joining room-----
  function joinRoom(){
    connectSocket()
    socket.emit("room:join",roomCode,(Response)=>{
      console.log(Response,"checking response")
      if(!Response?.ok){
       return alert(Response.message || "failed to join")
      }
      navigate(`/rooms/${Response.room.roomCode}`)
    })
  }
  return (
    <div className='flex flex-col  gap-10 items-center pt-5'>
      <div className='flex flex-col items-center gap-4'>
        <h1 className='font-bold text-4xl text-blue-800 '>Welcome to chess</h1>
        <p className='text-black-600 text-xl'>create a room or join a existing one to start playing</p>
      </div>
      <div className='flex  gap-8'>
        <div className='shadow-xl flex w-[390px]  border flex-col rounded items-center gap-4 p-4 bg-white'>
          <IoIosAddCircle 
          size={58} 
          color='#3B82F6' 
          onClick={createRoom} 
          className='cursor-pointer'/>
          <h2 className='font-bold text-3xl text-blue-800'>Create Room</h2>
          <p className='text-black-600 text-xl w-[53%] text-center'>start a new game and share room code with your opponent</p>
          <button onClick={createRoom} className='bg-blue-500 rounded p-4 font-bold text-white text-xl flex gap-3 items-center cursor-pointer w-[80%] justify-center'>
            <IoMdAdd size={30}/>Create Room</button>
        </div>
        <div className='flex flex-col items-center justify-center'>
          <PiLineVertical color='white' size={70}/>
          <p className='bg-white rounded-[70%] p-2'>OR</p>
          <PiLineVertical color='white' size={70}/>
        </div>
        <div className='shadow-xl flex w-[390px]  border flex-col rounded items-center gap-4 p-4 bg-white'>
          <LuLogIn 
          size={48} 
          color='green' 
          background='green'
          onClick={createRoom} 
          className='cursor-pointer'/>
          <h2 className='font-bold text-3xl text-green-900'>Join Room</h2>
          <p className='text-black-600 text-xl w-[53%] text-center'>Enter a room code to join a room</p>
          <input type="text"
           placeholder='#enter code'
          value={roomCode}
          className='border p-2 bg-gray text-black w-[80%] text-xl'
           onChange={(e)=>{setRoomCode(e.target.value)}} />
          <button className='bg-green-600 rounded p-4 flex gap-3 items-center w-[80%] justify-center'
        onClick={joinRoom}><FaArrowRight />Join Room</button>
        </div>
      
      </div>
      <div className='flex flex-col bg-[rgb(221,236,249)] w-[60%] p-6 border rounded-lg text-xl gap-3'>
        <h1 className='flex gap-2 items-center'><FcIdea size={20}/>How it works?</h1>
        <div className='flex gap-8'>
          <h2 className='flex gap-2 items-center'><TbCircleNumber1Filled size={30}/>create or join a room</h2>
          <h2 className='flex gap-2 items-center'><TbCircleNumber2Filled color='blue'size={30}/>Wait for an opponent</h2>
          <h2 className='flex gap-2 items-center'><TbCircleNumber3Filled color='green' size={30}/>play chess in real-time</h2>
        </div>
      </div>
    </div>
  )
}

export default Lobby
