import React from 'react'
import { connectSocket, socket } from '../socket'
import {useNavigate} from 'react-router-dom'
function Lobby() {
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
  }
  return (
    <div className='flex flex-col'>
      <button onClick={createRoom} className='bg-blue-400 rounded p-4'>create Room</button>
      <p>OR</p>
      <div>
        <input type="text" placeholder='enter code' />
        <button className='bg-blue-400 rounded p-4'
        onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  )
}

export default Lobby
