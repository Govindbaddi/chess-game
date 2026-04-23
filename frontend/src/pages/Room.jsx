import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { connectSocket, socket } from '../socket'
import { useSelector } from 'react-redux'
import { CgProfile } from "react-icons/cg";
import { IoPeopleCircleOutline } from "react-icons/io5";
import { IoPeopleSharp } from "react-icons/io5";
import { IoMdArrowRoundBack, IoMdPeople } from "react-icons/io";
import { FaCalendarAlt, FaClock, FaHashtag, FaUserCircle } from "react-icons/fa";
import { FaCircleInfo, FaRightToBracket } from "react-icons/fa6";
import { GoHorizontalRule } from "react-icons/go";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { MdAccessTime, MdOutlineAccessTime } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import { MdTipsAndUpdates } from "react-icons/md";
import { Chessboard } from "@gustavotoyota/react-chessboard";

function Room() {
  const {roomCode}=useParams()
  //const [messages,setMessages]=useState([]);
  const [room,setRoom]=useState(null)
 
   const [fen, setFen] = useState(null);
  const [turn, setTurn] = useState(null);
  const [color, setColor] = useState(null);
  const guest=JSON.parse(localStorage.getItem('guest'))
 // console.log(guest,"direact guest")

  const loginuser=useSelector((state)=>state.auth.user) || {_id:guest?.id,name:guest?.name}
//  console.log(loginuser,"user details in room")
  const [whiteMs,setwhiteMs]=useState(null)
  const [blackMs,setblackMs]=useState(null)
  const [messages,setMessages]=useState([])
  const [text,setText]=useState(null)
  const [isSpectator,setIsSpectator]=useState(false)
  const navigate=useNavigate()

  useEffect(()=>{
    connectSocket();
      const onPresence=(data)=>{
        setRoom(data);
      }

      const onUpdate = (state) => {
      console.log(state.fen);
      setFen(state.fen);
      setTurn(state.turn);
    };
    function onEnd(res){
      console.log('winner is response')
      alert(res,"is winner")
    }

    function onClock(ms){
      if(roomCode!==ms.roomCode){
        return;
      }
      setwhiteMs(ms.whiteMs)
      setblackMs(ms.blackMs)
    }
    socket.on("clock:update",onClock)

    socket.on("game:update", onUpdate);
    // Add "game:over" event listener

    function onChat(message){
      setMessages(prev=>[...prev,message])
    }
    //listening the entered text
    socket.on("chat:message",onChat)
    socket.on("game:over", onEnd);
    socket.on("room:presence",onPresence)
      return ()=>{
        socket.off("room:presence",onPresence)
        socket.off("game:over", onEnd);
        socket.off("game:update", onUpdate);
        socket.off("clock:update", onClock);
        socket.off("chat:message",onChat);
      }
  },[roomCode,room?.whiteId, loginuser._id]);


//antoher useeffect
  useEffect(()=>{
    connectSocket();
    socket.emit("room:join",roomCode,(response)=>{
      if(!response?.ok){
        return alert(response?.message || "Failing to join room") 
      }
      console.log(response?.room,"res after room:join")
      setRoom(response.room)
      setColor(
        loginuser._id == room?.whiteId ? "White" : "Black",
      );
      setIsSpectator(response?.room?.spectators?.some((s)=>s.userId.to))
    })
    socket.emit("game:state", roomCode, (response) => {
      if (!response?.ok)
        return alert(response?.message || "Failed to fetch game state");
      console.log(response?.state?.fen,"fen checking")
      setFen(response?.state?.fen);
      setTurn(response?.state?.turn);
      setwhiteMs(response?.clock.whiteMs)
      setblackMs(response?.clock.blackMs)
    });

    socket.emit("chat:history", roomCode, (response) => {
      if (!response?.ok) {
        alert(response?.message || "Failed top fetch history");
        return;
      }
      setMessages(response?.messages);
    });
  },[roomCode,loginuser._id])




  //leave room funciton
  function handleLeaveRoom(){
    console.log("leaving room")
     connectSocket();
    socket.emit("room:leave",roomCode,(res)=>{
      if(!res?.ok){
         return alert(res?.message || "Failing to leave room") 
      }
      //console.log(res,"response from")
      navigate("/lobby")
      // setRoom(res.room)
    })
    console.log(room,"after leaving ")
  }

  function convertTime(ms) {
    if (!ms) return "--:--";
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(Math.floor(total % 60)).padStart(2, "0");
    return `${m}:${s}`;
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

  function onSend() {
    connectSocket();
    socket.emit("chat:send", roomCode, text.trim(), (response) => {
      if (!response?.ok) {
        alert(response?.message || "Failed to send the message");
        return;
      }
      setText("");
    });
  }
 console.log("latest fen value",fen);

 console.log(room,"members in room")
  return (
    <div className='m-8 flex flex-col gap-3'>
      <div >
        <button className='flex flex-row items-center text-blue-700 text-xl cursor-pointer' onClick={()=>navigate('/lobby')} ><IoMdArrowRoundBack />Back to lobby</button>
      </div>
      <div className='flex gap-20'>
        <h1 className='flex items-center gap-5 text-xl'>
          <IoPeopleCircleOutline size={70} color='rgb(0,158,244)' />
          <div>
            <span className='font-semibold text-3xl'> Room:{roomCode} </span>
            {room?.status === "waiting" && 
            <p className='bg-orange-300 text-orange-900 rounded-2xl flex items-center gap-2 p-2 text-sm font-bold'><FaClock />waiting for an opponent</p>}
          </div>
         </h1>
        <button className='bg-red-500 flex items-center gap-4 text-white text-xl rounded h-[50%] p-3 ' onClick={handleLeaveRoom}><FaRightToBracket />Leave game</button>
      </div>
      <div className="border w-[100%]  h-[1px]"></div>
      <div className='flex gap-2 m-10'>
        <div className='w-[30%]  p-10 flex flex-col gap-4 h-[400px]'>
         <div className='shadow-lg rounded-lg bg-white flex flex-col gap-2 p-3 '>
          <h1 className='flex gap-2 items-center'>
              <IoPeopleSharp size={30}/>
              Players{room?.players.length === 1 ? "(1/2)" : "(2/2)"}
          </h1>
          {room?.players?.map((p)=>{
            return <div className="p-4 bg-blue-200 rounded flex gap-4 items-center">
                <CgProfile size={30} color="blue"/>
                <div className="flex flex-col gap-1">
                  <div className="text-xl font-bold">
                    {p.name}
                    {p.userId.toString() === loginuser._id.toString() && (
                      <span className="ml-4 bg-blue-400 pl-1 pr-2 pt-1 pb-1 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div>
                    Color:{" "}
                    {room?.status === "waiting"
                      ? "TBD"
                      : p.userId.toString() === room?.whiteId?.toString()
                        ? "White"
                        : "Black"}
                  </div>
                </div>
              </div>
              })}
               {room?.status === "waiting" && (
              <div className="p-4 bg-gray-200 rounded flex gap-4 items-center">
                <FaUserCircle size={40} />
                <div className="flex flex-col gap-1">
                  <div className="text-xl font-bold">Waiting for opponent</div>
                  <div>Share the roomcode to invite a friend</div>
                </div>
              </div>
            )}
           
         </div>
         <div className='bg-white border rounded-lg shadow-2xl p-4 flex flex-col gap-2'>
         <div className='flex gap-2 items-center font-bold'>
          <IoMdInformationCircleOutline />
          Room info
          </div>
          <div className='border w-[100%]'/>
          <div className='flex justify-between'>
            <div className='flex gap-2 items-center'><FaHashtag /> Room code</div>
            <h1 className='bg-blue-200 p-2 rounded'>{roomCode}</h1>
          </div>
          <div className='border w-[100%]'/>
          <div className='flex justify-between'>
            <div className='flex gap-2 items-center'><MdOutlineAccessTime /> Time control</div>
            <h1>05:00 min</h1>
          </div>
          <div className='border w-[100%]'/>
          <div className='flex justify-between'>
            <div className='flex gap-2 items-center'><SlCalender /> Created At</div>
            <h1>{room?.createdAt}</h1>
          </div>
         </div>
        </div>
      {room?.status === "waiting" ? 
      ( <div className='w-[70%] bg-white flex flex-col rounded-lg items-center gap-4 border shadow-xl  pt-10 pl-4 pr-4 pb-4'>
        <h1 className='font-semibold text-xl'>Waiting for an opponent</h1>
        <p>Please share roomCode to start the game</p>
        <div className='flex items-center'>
          <p className='border w-[30%] h-0'/>
          <h2>Room Code</h2>
          <p className='border w-[30%] h-0'/>
        </div>
        <h1 className='bg-blue-300 p-3 rounded-lg'>{roomCode}</h1>
        <p className='flex items-center gap-2 relative bottom-1'><MdTipsAndUpdates size={30} color='orange'/>Tip:Once other player joined, game will automatically started</p>
      </div>)
      :(
        <>
      <div className="w-[50%] border rounded shadow-xl pt-2 pb-2 bg-gray-100">
              <div className="flex justify-between pb-2 pl-4 pr-4">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <div
                    className={`w-[20px] h-[20px] border rounded rounded-full ${turn === "w" ? "bg-white" : "bg-black"}`}
                  ></div>
                  Turn: {turn === "w" ? "White" : "Black"}
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 items-center bg-white border rounded p-2 font-bold">
                    <MdAccessTime size={28} />
                    <div className="flex flex-col items-center">
                      <div className="text-sm">White Time</div>
                      <div>{convertTime(whiteMs)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center bg-gray-700 text-white border rounded p-2 font-bold">
                    <MdAccessTime size={28} />
                    <div className="flex flex-col items-center">
                      <div className="text-sm">Black Time</div>
                      <div>{convertTime(blackMs)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border w-[100%]"></div>
              <div className="p-2">
                <Chessboard
                  id="room-board"
                  position={fen || 'start'}
                  onPieceDrop={onDrop}
                />
              </div>
       </div> 
       <div className="fixed bottom-3 right-5 w-[300px]  border rounded shadow-xl bg-white">
              <div className="h-[45px] border flex items-center justify-center text-xl font-bold">
                Chat
              </div>
              <div className="h-[500px] flex flex-col gap-2 pt-2 pb-2 overflow-scroll">
                {messages.map((m) => (
                  <div
                    className={`${loginuser._id.toString() === m.userId ? "bg-blue-200" : "bg-gray-200"} flex flex-col gap-1 p-2 rounded ml-2 mr-2`}
                  >
                    <div className="flex gap-1 items-center font-bold text-blue-800">
                      <FaUserCircle size={18} />
                      {m.name}
                      
                    </div>
                   <h2>{m.text}</h2> 
                   </div>
                ))}
              </div>
              <div className="h-[80px] border flex items-center justify-between p-4 text-xl">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="border rounded p-2"
                />
                <button onClick={onSend} className="bg-blue-400 p-2 rounded">
                  Send
                </button>
              </div>
      </div>
       </>
      )}  
      </div>
      
    </div>
  )
}

export default Room
