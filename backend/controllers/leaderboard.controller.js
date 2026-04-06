const { User } = require("../models/usermodel")

const leaderboardData=async(req,res)=>{

    try{
        const users=await User.find().select("-passwordHash").sort({"stats.wins":-1}).limit(50).lean()
        const data=users.map((u,ind)=>{
            return {...u,rank:ind+1}
        })
        return res.status(200).json(data)
    }
    catch(err){
        return res.status(500).json({message:err.message})
    }
}
module.exports={leaderboardData}