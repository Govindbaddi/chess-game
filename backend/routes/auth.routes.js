const express=require("express");
const { login, signup, fetchMe, logout, refresh } = require("../controllers/auth.controller");
const { verifyAuth } = require("../middlewares/verifyAuth");

const authRouter=express.Router();


authRouter.post("/login",login)
authRouter.post("/signup",signup)
authRouter.post("/logout",logout)
authRouter.post("/refresh",refresh)
authRouter.get("/me",verifyAuth,fetchMe)


module.exports={authRouter}