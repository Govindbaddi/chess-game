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

const app=express()
//middle wares
app.use(express.json())

app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true
}))
app.use(cookieParser())

app.use("/api/v1/auth/",authRouter)

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
    if (!accesstoken) {
      return next(new Error("Missing accessToken"));
    }
    const payload = jwt.verify(accesstoken, process.env.JWT_ACCESS_SECRET);
    // payload : { sub: value user._id, role: "USER" | "ADMIN" }
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      return next(new Error("Unable to find user"));
    }
    socket.user = user;
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



let rooms=new Map()
io.on('connection',(socket)=>{
    function getPublicRoom(room) {
  return {
    roomCode: room.roomCode,
    players: room.players.map((p) => ({ userId: p.userId, name: p.name })),
    status: room.status,
    createdAt: room.createdAt,
    fen: room.fen,
    whiteId: room.whiteId,
    blackId: room.blackId,
    lastMove: room.lastMove,
  };
}
    socket.on("room:create",(ack=>{
        try{
            let roomCode=getRoomCode()
            while(rooms.has(roomCode)){
                roomCode=getRoomCode()
            }
            const newRoom={
                roomCode,
                players:[],
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
            rooms.set(roomCode,newRoom)
            io.to(roomCode).emit("room:presence",getPublicRoom(newRoom));
            //console.log(newRoom,"created room")
            return ack?.({ok:true,room:getPublicRoom(newRoom)})
        }
    catch(err){
        return ack?.({ok:false,message:err.message || "create room failed"})
    }}))

    //room:join event
    socket.on("room:join",(roomCode,ack)=>{
        //console.log(`A user tried to join the room ${roomCode}`)
        try{
        const existingRoom=rooms.get(roomCode)
        if(!existingRoom){
            return ack?.({ok:false,message:"room does not exist"})
        }

        const already=existingRoom.players.some((p)=>
        p.userId.toString()===socket.user._id.toString()
        )
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
            }
            socket.join(roomCode)
            //console.log(existingRoom)
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
        if(!existingRoom){
            return ack?.({ok:false,message:"room does not exist"})
        }
        let remainingPlayers=existingRoom.players.filter((p)=>{
            return p.userId.toString()!==socket.user._id.toString()
        })

        existingRoom.players=remainingPlayers
       
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


     //*********************----game related events-------- */
        // "game:state" event listener
    socket.on("game:state", (roomCode, ack) => {
        const room = rooms.get(roomCode);
        if (!room) return ack?.({ ok: false, message: "Room does not exist" });
        return ack?.({ ok: true, state: getPublicState(room) });
    });
  

    //----game :move event
        socket.on("game:move",(roomCode,from,to,promotion,ack)=>{
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
            io.to(roomCode).emit("game:update",getPublicState(room))
            //check if game is over or not
            if(room.game.isGameOver()){
                let result="gameover"
                if(room.game.isCheckmate()){
                    result= turn==='w'?'white':'black'
                }
                if(room.game.isDraw()){
                    result="draw"
                }
                io.to(roomCode).emit("game:over",result)
            }
            }
        catch(err){
                return ack?.({ok:false,message:err.message||"Invalid move"})
            }
        })     
})


//server 
server.listen(PORT,()=>{
    console.log(`server running on port: ${PORT}`)
})


mongoose
    .connect(MONGODB_URI)
    .then(()=>{ console.log("connected to DB successfully")})
    .catch((err)=>{console.log("failed to connect",err.message)})