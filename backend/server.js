require("dotenv").config()
const express=require("express")
const cors=require("cors")
const { authRouter } = require("./routes/auth.routes")
const { default: mongoose } = require("mongoose")
const cookieParser=require("cookie-parser")
const {Server}=require('socket.io')
const http=require('http')
const jwt=require('jsonwebtoken')
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
let rooms=new Map()
io.on('connection',(socket)=>{
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
                createdAt:Date.now()
            }
            socket.join(roomCode);
            newRoom.players.push({
                name:socket.user.name,
                socketId:socket.user.name,
                userId:socket.user._id,
            })
            rooms.set(roomCode,newRoom)
            io.to(roomCode).emit("room:presence",newRoom);
            console.log(newRoom,"created room")
            return ack?.({ok:true,room:newRoom})
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
        existingRoom.status=existingRoom.players.length==2?"ready":"waiting"
            socket.join(roomCode)
            console.log(existingRoom)
            io.to(roomCode).emit("room:presence",existingRoom);
            return ack?.({ok:true, room: existingRoom})
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
        console.log("remainging ",remainingPlayers)
         return ack?.({ok:true, room: remainingPlayers})
        }
        catch(err){
             return ack?.({ok:false,message:err.message || "failed to leave room"})
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