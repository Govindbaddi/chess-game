require("dotenv").config()
const express=require("express")
const cors=require("cors")
const { authRouter } = require("./routes/auth.routes")
const { default: mongoose } = require("mongoose")
const cookieParser=require("cookie-parser")
const {Server}=require('socket.io')
const http=require('http')
const jwt=require('jsonwebtoken')
const {Chess}=require('chess.js')
const { User } = require("./models/usermodel")
const { leaderboard } = require("./routes/leaderboard.routes")
const { verifyAuth } = require("./middlewares/verifyAuth")
const parser = require("./utilities/uploads")
const {Game}=require('./models/gamemodel')

const app=express()
//middle wares
app.use(express.json())

app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true
}))
app.use(cookieParser())

app.use("/api/v1/auth/",authRouter)
app.use("/api/v1/leader/",leaderboard);
app.post("/api/v1/upload", verifyAuth, parser.single("file"), (req, res) => {
  // something inside upload.
  try {
    const url = req.file.path;
    return res.status(200).json({ avatar: url });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});


const PORT=process.env.PORT;
const MONGODB_URI=process.env.MONGODB_URI
// console.log(MONGODB_URI,"url is checkign")

const server=http.createServer(app);
const io=new Server(server,{cors:{
    origin:["http://localhost:5173"],
    credentials:true
}})


function getPublicState(room) {
  return {
    roomCode: room.roomCode,
    fen: room.game.fen(),
    turn: room.game.turn(),
    whiteId: room.whiteId,
    blackId: room.blackId,
    lastMove: room.lastMove,
  };
}

function getPublicClock(room) {
  return {
    ...room.clock,
    roomCode: room.roomCode,
  };
}

//rating calculation
function getExpectedScore(r1,r2){
  return 1/(1+Math.pow(10,(r2-r1)/400))
}

async function saveGameDetailsToUser(room, result, reason) {
  console.log("saving user details")
  const whiteId = room.whiteId;
  const blackId = room.blackId;
  const white = await User.findById(whiteId);
  const black = await User.findById(blackId);
  let K = 32;
  // eW - expected white score
  let eW = getExpectedScore(white.status.rating, black.status.rating);
  // eB - expected black score
  let eB = 1 - eW;
  // actual white and black scores
  let sW, sB;
  if (result === "white") {
    sW = 1;
    sB = 0;
  } else if (result === "black") {
    sW = 0;
    sB = 1;
  } else {
    sW = 0.5;
    sB = 0.5;
  }
  if (result === "draw") {
    white.status.draws += 1;
    white.status.gamesPlayed += 1;
    white.status.currentStreak = 0;
    black.status.draws += 1;
    black.status.gamesPlayed += 1;
    black.status.currentStreak = 0;
  } else if (result === "white") {
    white.status.wins += 1;
    white.status.gamesPlayed += 1;
    white.status.currentStreak += 1;
    white.status.bestStreak = Math.max(
      white.status.bestStreak,
      white.status.currentStreak,
    );
    black.status.looses += 1;
    black.status.gamesPlayed += 1;
    black.status.currentStreak = 0;
  } else if (result === "black") {
    black.status.wins += 1;
    black.status.gamesPlayed += 1;
    black.status.currentStreak += 1;
    black.status.bestStreak = Math.max(
      black.status.bestStreak,
      black.status.currentStreak,
    );
    white.status.lo0ses += 1;
    white.status.gamesPlayed += 1;
    white.status.currentStreak = 0;
  }
   white.status.rating = Math.round(white.status.rating + K * (sW - eW));
  black.status.rating = Math.round(black.status.rating + K * (sB - eB));
  await white.save();
  await black.save();
}
let rooms=new Map()

// Socket.io middleware
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";
    // cookieHeader = "cookie1=value1;cookie2=value2;accessToken=tokenValue;..."
    const cookiesArray = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        let idx = c.indexOf("=");
        //     [cookie name    , cookie value]
        return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      });
    // cookiesArray = [["cookie1", "value1"], ["cookie2", "value2"], ["accessToken", "tokenValue"] .... ]
    const cookies = Object.fromEntries(cookiesArray);
    // cookies = {cookie1: value1, cookie2: value2, accessToken: tokenValue, .......}
    let { accesstoken } = cookies;
    let {guestId,guestName}=socket.handshake.auth
    //console.log(guestId,guestName,"checking guest")
    if(accesstoken){
    const payload = jwt.verify(accesstoken, process.env.JWT_ACCESS_SECRET);
    // payload : { sub: value user._id, role: "USER" | "ADMIN" }
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      return next(new Error("Unable to find user"));
    }
    socket.user = user;
    return next();
  }
  if(guestId && guestName){
    socket.user={
      role:'guest',
      _id:guestId,
      name:guestName
    }
    return next();
  }
  if (!accesstoken) {
      return next(new Error("Missing accessToken"));
    }
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});


//helper function----
function getRoomCode(len=6){
    let chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let code =""
    for(let i=0;i<len;i++){
        code+=chars[Math.floor(Math.random()*chars.length)];
    }
    return code;
}

// helper function to remove game object from the room
function getPublicRoom(room) {
  return {
    roomCode: room.roomCode,
    players: room.players.map((p) => ({ userId: p.userId, name: p.name })),
    spectators:room.spectators,
    status: room.status,
    createdAt: room.createdAt,
    fen: room.fen,
    whiteId: room.whiteId,
    blackId: room.blackId,
    lastMove: room.lastMove,
  };
}



io.on('connection',(socket)=>{
    
    socket.on("room:create",(ack=>{
        try{
            let roomCode=getRoomCode()
            while(rooms.has(roomCode)){
                roomCode=getRoomCode()
            }
           // console.log(rooms,"rooms name in ")
            const newRoom={
                roomCode,
                players:[],
                spectators:[],
                status:"waiting",
                createdAt:Date.now(),
                 game:new Chess(),
                fen:new Chess().fen(),
                whiteId:null,
                blackId:null,
                lastmove:null
            }
            socket.join(roomCode);
            newRoom.players.push({
                name:socket.user.name,
                socketId:socket.user.name,
                userId:socket.user._id,
            })
            //console.log(newRoom,"added players into room")
            // all the clock related information
            const baseMs=5*60*1000
            const incrementMs=0
            newRoom.timeControl={baseMs,incrementMs}
            newRoom.clock={
                whiteMs:baseMs,
                blackMs:baseMs,
                active:'w',
                lastSwitchAt:null,
                running:false
            }
            newRoom.chat=[]
            rooms.set(roomCode,newRoom)
            io.to(roomCode).emit("room:presence",getPublicRoom(newRoom));
            //console.log(rooms,"created room")
            return ack?.({ok:true,room:getPublicRoom(newRoom)})
        }
    catch(err){
        return ack?.({ok:false,message:err.message || "create room failed"})
    }}))
    
    //room:join event
    socket.on("room:join",(roomCode,ack)=>{
        console.log(`A user tried to join the room ${roomCode}, ${socket.user.name}`)
        try{
         // console.log(roomCode,"roomcode in room-join")
          console.log(rooms.size,"all rooms")
        const existingRoom=rooms.get(roomCode)
          //console.log(existingRoom,"checking room")
        if(!existingRoom){
            return ack?.({ok:false,message:"room does not exist"})
        }

        const already=existingRoom.players.some((p)=>
        p.userId.toString()===socket.user._id.toString())
        const spectator=existingRoom.spectators.some((p)=>{
          return p.userId.toString()===socket.user._id.toString()
        })
        if(spectator){
            return ack?.({ok:true,room:getPublicRoom(existingRoom)});
        }
        if(!already){
            if(existingRoom.players.length==2){
                return ack?.({ok:false,message:"room is full"})
            }
            existingRoom.players.push({
                name:socket.user.name,
                socketId:socket.id,
                userId:socket.user._id, 
            })
        }
        else{
            existingRoom.players=existingRoom.players.map((p)=>{
                if(p.userId.toString()===socket.user._id.toString()){
                    return {...p,socketId:socket.id}
                }
                return p;
            })
        }
        // existingRoom.status=existingRoom.players.length==2?"ready":"waiting"
            if(existingRoom.players.length==2){
                existingRoom.status="ready"
                existingRoom.whiteId=existingRoom.players[0].userId
                existingRoom.blackId=existingRoom.players[1].userId

                //initializing the clock
                existingRoom.clock.running=true
                existingRoom.clock.lastSwitchAt=Date.now()
                existingRoom.clock.active='w'
            }
            socket.join(roomCode)
            //console.log(existingRoom)
            io.to(roomCode).emit("clock:update",getPublicClock(existingRoom))
            io.to(roomCode).emit("room:presence",getPublicRoom(existingRoom));
            return ack?.({ok:true, room: getPublicRoom(existingRoom)})
        }
    catch(err){
        return ack?.({ok:false,message:err.message || "join in room failed"})
    }

    })
    //console.log(`A user connected  on socket ${socket.id}`)
    socket.on("room:leave",(roomCode,ack)=>{
        try{
        const existingRoom=rooms.get(roomCode)
        //console.log(rooms,"rooms in leave room")
        if(!existingRoom){
            return ack?.({ok:false,message:"room does not exist"})
        }
        let remainingPlayers=existingRoom.players.filter((p)=>{
            return p.userId.toString()!==socket.user._id.toString()
        })

        existingRoom.players=remainingPlayers
       existingRoom.spectators=existingRoom.spectators.filter((s)=>{
        return s.userId.toString()===socket.user._id.toString()
       })
       if( remainingPlayers.length==1)
        {
            existingRoom.status="waiting"
             io.to(roomCode).emit("room:presence",getPublicRoom(existingRoom));
            return ack?.({ok:true,room:getPublicRoom(existingRoom)})
        } 
        else{
            rooms.delete(roomCode)
            return ack?.({ok:true})
        }
        
        //console.log("remainging ",remainingPlayers)
         
        }
        catch(err){
             return ack?.({ok:false,message:err.message || "failed to leave room"})
        }
        })

      //joining as spectator----
      socket.on("room:join-spectator", (roomCode, ack) => {
      try {
      //console.log(`User tried to join room as spectator ${roomCode}`);
      const existingRoom = rooms.get(roomCode);
      if (!existingRoom)
        return ack?.({ ok: false, message: "Room does not exist" });
      const already = existingRoom.spectators.some(
        (s) => s.userId.toString() === socket.user._id.toString(),
      );
      if (already) {
        existingRoom.spectators = existingRoom.spectators.map((s) => {
          if (s.userId.toString() === socket.user._id.toString()) {
            return { ...s, socketId: socket.id };
          }
          return p;
        });
      } else {
        if (existingRoom.spectators.length === 50) {
          return ack?.({ ok: false, message: "Room is full" });
        }
        existingRoom.spectators.push({
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role,
          socketId: socket.id,
        });
      }
      
      socket.join(roomCode);
      io.to(roomCode).emit("room:presence", getPublicRoom(existingRoom));
      return ack?.({ ok: true, room: getPublicRoom(existingRoom) });
    } catch (err) {
      return ack?.({
        ok: false,
        message: err.message || "Unable to join room as a spectator",
      });
    }
  });



     //*********************----game related events-------- */
        // "game:state" event listener
    socket.on("game:state", (roomCode, ack) => {
        const room = rooms.get(roomCode);
        if (!room) return ack?.({ ok: false, message: "Room does not exist" });
        return ack?.({ ok: true, state: getPublicState(room),clock:getPublicClock(room) });
    });
  

    //----game :move event
        socket.on("game:move",async(roomCode,from,to,promotion,ack)=>{
            const room=rooms.get(roomCode)
        try{
            if(!room){
                return ack?.({ok:false,message:"Room does not exist"})
            }
            let player="none"
            if(socket.user._id.toString()===room.whiteId.toString()){
                player="w"
            }
           else if(socket.user._id.toString()===room.blackId.toString()){
                player="b"
            }
            if(player=='none'){
                return ack?.({ok:false,message:"Invalid user"})
            }
            const turn=room.game.turn();
            if(player!==turn){
                return ack?.({ok:false,message:"not your turn"})
            }
            const move=room.game.move({
                from,to,promotion:'q',
            });
            if(!move){
                return ack?.({ok:false,message:"Invalid move"})
            }
            room.lastMove={from,to}
            //update the clock---
            const now=Date.now()
            const elapsed=now-room.clock.lastSwitchAt;
            if(player=='w'){
                room.clock.whiteMs-=elapsed;
                room.clock.whiteMs+=room.timeControl.incrementMs;
                room.clock.active="b"
            }
            else{
                room.clock.blackMs-=elapsed;
                room.clock.blackMs+=room.timeControl.incrementMs;
                room.clock.active="b"
            }
            room.clock.whiteMs=Math.max(0,room.clock.whiteMs)
            room.clock.blackMs=Math.max(0,room.clock.blackMs)
            room.clock.lastSwitchAt=now
            io.to(roomCode).emit("clock:update",getPublicClock(room))
            //game is over----
        if(room.clock.whiteMs===0 || room.clock.blackMs===0){
                room.clock.running=false
                const result=room.clock.whiteMs===0 ? "black":"white"
                const reason="timeout"
                io.to(roomCode).emit("game:over", result);
                if(socket.user.role==='guest'){
                  return;
                }
                const game = new Game({
                    roomCode,
                    whiteId: room.whiteId,
                    blackId: room.blackId,
                    reason,
                    result,
                    startedAt: new Date(room.createdAt),
                    endedAt: Date.now(),
                    duration: Date.now() - room.createdAt,
                    });
                    await game.save();
                    await saveGameDetailsToUser(room, result, reason);

            }

            io.to(roomCode).emit("game:update",getPublicState(room))
            //check if game is over or not
         if (room.game.isGameOver()) {
                let reason = "other";
                let result = "draw";
                if (room.game.isCheckmate()) {
                reason = "checkmate";
                result = turn === "w" ? "white" : "black";
                } else if (room.game.isDraw()) {
                result = "draw";
                reason = "draw";
                }
                const game = new Game({
                roomCode,
                whiteId: room.whiteId,
                blackId: room.blackId,
                reason,
                result,
                startedAt: new Date(room.createdAt),
                endedAt: Date.now(),
                duration: Date.now() - room.createdAt,
                });
                await game.save();
                await saveGameDetailsToUser(room, result, reason);
                io.to(roomCode).emit("game:over", result);
            }
          }
          catch(err){
               return ack?.({ok:false,message:err.message||"Invalid move"})
            }
         })  
    //chat box wvents
  socket.on("chat:send", (roomCode, text, ack) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) return ack?.({ ok: false, message: "Room does not exist" });
      // Basic validation on text
      const clean = text.trim();
      if (!clean) return ack?.({ ok: false, message: "Empty message" });
      if (clean.length > 300)
        return ack?.({ ok: false, message: "Text too long" });
      let isPlayer = room.players.some(
        (p) => p.userId.toString() === socket.user._id.toString(),
      );
      //spectator sending messages
      const isSpectator=room.spectators.some((s)=>s.userId.toString()===socket.user._id.toString())
      let isMember= isPlayer || isSpectator
      if (!isMember) return ack?.({ ok: false, message: "Not a valid user" });
      const message = {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        text: clean,
        timestamp: Date.now(),
      };
      room.chat.push(message);
      // If chat history is more that 50, remove the oldest chat
      if (room.chat.length > 50) room.chat.shift();
      io.to(roomCode).emit("chat:message", message);
      return ack?.({ ok: true, message });
    } catch (err) {
      return ack?.({
        ok: false,
        message: err.message || "Failed to send message",
      });
    }
    }); 

    //history event---
    socket.on("chat:history", (roomCode, ack) => {
    try {
      const room = rooms.get(roomCode);
      if (!room) return ack?.({ ok: false, message: "Room does not exist" });
      return ack?.({ ok: true, messages: room.chat || [] });
    } catch (err) {
      return ack?.({
        ok: false,
        message: err.message || "Failed to get chat history",
      });
    }
  });
  //disconnnect event-----
  socket.on("disconnect", () => {
    console.log("disconnect is happening on refrsh")
    for (let [roomCode, room] of rooms.entries()) {
      room.players = room.players.filter((p) => p.socketId !== socket.id);
      
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        continue;
      }
      room.status = room.players.length === 2 ? "ready" : "waiting";
    }
  });
})


//server 
server.listen(PORT,()=>{
    console.log(`server running on port: ${PORT}`)
})


mongoose
    .connect(MONGODB_URI)
    .then(()=>{ console.log("connected to DB successfully")})
    .catch((err)=>{console.log("failed to connect",err.message)})