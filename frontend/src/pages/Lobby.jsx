import React, { useState } from 'react'
import { connectSocket, socket } from '../socket'
import {useNavigate} from 'react-router-dom'
function Lobby() {
  const [roomCode, setRoomCode] = useState("")
  const navigate=useNavigate()
  //creating room----
  function createRoom(){
    console.log("creating room")
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
    <div className='flex flex-col'>
      <button onClick={createRoom} className='bg-blue-400 rounded p-4'>create Room</button>
      <p>OR</p>
      <div>
        <input type="text" placeholder='enter code' value={roomCode} onChange={(e)=>{setRoomCode(e.target.value)}} />
        <button className='bg-blue-400 rounded p-4'
  
        onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  )
}

export default Lobby
