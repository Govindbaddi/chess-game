const mongoose=require("mongoose")

const userSchema=mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    passwordHash:{type:String,required:true},
    role:{enum:["USER","ADMIN"],type:String,default:"USER"},
    avatar:{type:String,default:""},
    status:{
        rating:{type:Number,default:1200},
        wins:{type:Number,default:0},
        looses:{type:Number,default:0},
        draws:{type:Number,default:0},
        gamesPlayed:{type:Number,default:0},
        currentStreak:{type:Number,default:0},
        maxStreak:{type:Number,default:0},
    }
},
{timestamps:true}
)

const User=mongoose.model("User",userSchema)
module.exports={User}