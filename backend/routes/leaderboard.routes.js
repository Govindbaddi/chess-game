const express=require('express')
const { leaderboardData } = require('../controllers/leaderboard.controller')
const { verifyAuth } = require('../middlewares/verifyAuth')

const leaderboard=express.Router()

leaderboard.get("/usersAll",verifyAuth,leaderboardData)

module.exports={leaderboard}