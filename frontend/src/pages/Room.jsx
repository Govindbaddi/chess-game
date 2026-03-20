import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { connectSocket, socket } from '../socket'
import { useSelector } from 'react-redux'

function Room() {
  const {roomCode}=useParams()
  const [room,setRoom]=useState(null)
  const navigate=useNavigate()
  const loginuser=useSelector((state)=>state.auth.user)
  //console.log(loginuser.user._id,"username")
  useEffect(()=>{
    connectSocket();
    socket.emit("room:join",roomCode,(response)=>{
      if(!response?.ok){
        return alert(response?.message || "Failing to join room") 
      }
      setRoom(response.room)
    })
      const onPresence=(data)=>{
        setRoom(data);
      }
      socket.on("room:presence",onPresence)
      return ()=>{
        socket.off("room:presence",onPresence)
      }
  },[roomCode]);

  //leave room funciton
  function handleLeaveRoom(){
    console.log("leaving room")
     connectSocket();
    socket.emit("room:leave",roomCode,(res)=>{
      if(!res?.ok){
         return alert(res?.message || "Failing to leave room") 
      }
      console.log(res,"response from")
      navigate("/lobby")
      setRoom(res.room)
    })
    console.log(room,"after leaving ")
  }


 //console.log(room,"members in room")
  return (
    <div>
       {`roomcode:${roomCode}`}
     
      <p>room status:{room?.status}</p>
      <ul>
         {room?.players.map((item)=>{
        return item.userId==loginuser.user._id?<li>{item.name +"(me)"}</li> :<li>{item.name}</li>
      })}
      </ul>
      <div className='flex gap-2'>
      {room?.status=="ready" && <button className='bg-green-500 p-4 rounded'>start game</button>}
      <button className='bg-red-500 p-4 rounded' onClick={handleLeaveRoom}>leave game</button>
      </div>
      
    </div>
  )
}

export default Room
