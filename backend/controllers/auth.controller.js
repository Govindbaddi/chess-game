const { User } = require("../models/usermodel");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const login=async (req,res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({message:"please fill all the fields"})
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"user does not exists"})
        }
        //comparing passwordhash with created password by user
        const match=await bcrypt.compare(password,user.passwordHash)
        if(!match){
           return res.status(400).json({message:"user does not exists"}) 
        }
        //creating access and refresh tokens
        const accessToken=jwt.sign({sub:user._id,role:user.role},
            process.env.JWT_ACCESS_SECRET,
            {expiresIn:"15m"}
            )
            //console.log(accessToken,"getting in login")
        res.cookie("accesstoken",accessToken,{
            httpOnly:true,
            secure: process.env.NODE_ENV === "production", // send cookie only to https secure sites
            maxAge: 15 * 60 * 1000,
        })
        // console.log(res.accesstoken,"printing")
        //refresh token
        const refreshToken=jwt.sign({sub:user._id,role:user.role,type:"refresh"},
            process.env.JWT_REFRESH_SECRET,
            {expiresIn:"7d"}
            )
        res.cookie("refreshtoken",refreshToken,{
            httpOnly:true,
            secure: process.env.NODE_ENV === "production", // send cookie only to https secure sites
            maxAge: 7*24*60*60*1000,
             path: "/api/v1/auth/refresh"
        })
       // console.log(res.refreshtoken,"refresh")
        return res.status(200).json({message:"ok"})
    }
    catch(err){
        return res.status(200).json({message:err.message})
    }
}


//signup-----
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = new User({ name, email, passwordHash });
    const savedUser = await user.save();
    if (!savedUser) {
      return res.status(500).json({ message: "Unable to save user" });
    }
    return res.status(200).json({ message: "OK" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const fetchMe=async(req,res)=>{
  try{
     const user = req.user;
     //console.log(user,"user details")
    return res.status(200).json({ user });
  }
  catch(err){
    return res.status(500).json({message:err.message})
  }
}

//logout ---
const logout=(req,res)=>{
  try{
    res.clearCookie("accesstoken",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production"
    })
    res.clearCookie("refreshtoken",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      path:"/api/v1/auth/refresh"
    })
    return res.status(200).json({message:"ok"})
  }
  catch(err){
    return res.status(200).json({message:err.message})
  }
}

//refresh ---
const refresh=async(req,res)=>{
  try{
  const {refreshtoken}=req.cookies;
  if(!refreshtoken){
    return res.status(400).json({message:"Refresh token missing"})
  }
  const payload=jwt.verify(refreshtoken,process.env.JWT_REFRESH_SECRET)
  if(payload.type!="refresh"){
    return res.status(400).json({message:"token type not refresh"})
  }
  const id=payload.sub;
  const user=await User.findById(id);
  if(!user){
    res.clearCookie("refreshtoken",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      path:"/api/v1/auth/refresh"
    })
     return res.status(400).json({message:"user not found"})
  }
          const accessToken=await jwt.sign({sub:user._id,role:user.role},
            process.env.JWT_ACCESS_SECRET,
            {expiresIn:"15m"}
            )
        res.cookie("accesstoken",accessToken,{
            httpOnly:true,
            secure: process.env.NODE_ENV === "production", // send cookie only to https secure sites
            maxAge: 15 * 60 * 1000,
        })
        return res.status(200).json({message:"ok"})
    }
  catch(err){
     return res.status(200).json({message:err.message})
  }
}

module.exports={login,signup,fetchMe,logout,refresh}