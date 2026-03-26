import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { connectSocket, socket } from '../socket'
import { useSelector } from 'react-redux'
import {Chessboard} from '@gustavotoyota/react-chessboard'

function Room() {
  const {roomCode}=useParams()
  const [room,setRoom]=useState(null)
  const navigate=useNavigate()
   const [fen, setFen] = useState(null);
  const [turn, setTurn] = useState(null);
  const [color, setColor] = useState(null);
  const loginuser=useSelector((state)=>state.auth.user)
  //console.log(loginuser.user._id,"username")
  useEffect(()=>{
    connectSocket();
    socket.emit("room:join",roomCode,(response)=>{
      if(!response?.ok){
        return alert(response?.message || "Failing to join room") 
      }
      setRoom(response.room)
      setColor(
        loginuser.user._id == room?.whiteId ? "White" : "Black",
      );
    })
    socket.emit("game:state", roomCode, (response) => {
      if (!response?.ok)
        return alert(response?.message || "Failed to fetch game state");
      setFen(response?.state?.fen);
      setTurn(response?.state?.turn);
    });

      const onPresence=(data)=>{
        setRoom(data);
      }

      const onUpdate = (state) => {
      console.log(state.fen);
      setFen(state.fen);
      setTurn(state.turn);
    };
    function onEnd(res){
      alert(res)
    }

    socket.on("game:update", onUpdate);
    // Add "game:over" event listener

    socket.on("game:over", onEnd);
      socket.on("room:presence",onPresence)
      return ()=>{
        socket.off("room:presence",onPresence)
        socket.off("game:over", onEnd);
      }
  },[roomCode,room?.whiteId, loginuser._id]);

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
      // setRoom(res.room)
    })
    console.log(room,"after leaving ")
  }


  // We emit "game:move"
  function onDrop(sourceSquare, targetSquare) {
    connectSocket();
    if (!fen) return false;
    socket.emit(
      "game:move",
      roomCode,
      sourceSquare,
      targetSquare,
      "q",
      (response) => {
        if (!response?.ok) return alert(response?.message || "Invalid move");
      },
    );

    return true;
  }


 //console.log(room,"members in room")
  return (
    <div>
       {`roomcode:${roomCode}`}
     
      <p>room status:{room?.status}</p>
      <ul>
         {room?.players.map((item)=>{
        return item.userId==loginuser.user._id?<li>{item.name +"(me)" +color}</li> :<li>{item.name}</li>
      })}
      </ul>
      <div className='flex gap-2'>
      {/* {room?.status=="ready" && <button className='bg-green-500 p-4 rounded'>start game</button>} */}
      <button className='bg-red-500 p-4 rounded' onClick={handleLeaveRoom}>leave game</button>
      </div>
       {room?.status === "ready" && (
      <div className="w-[480px]">
          <div>Turn: {turn === "w" ? "White" : "Black"}</div>
          <Chessboard
            id="room-board"
            position={fen || "start"}
            onPieceDrop={onDrop}
          />
        </div>
      )}
    
    </div>
  )
}

export default Room
