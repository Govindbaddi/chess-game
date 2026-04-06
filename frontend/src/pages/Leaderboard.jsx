import React from 'react'
import { useEffect } from 'react'
import { api } from '../api/client'
import { useState } from 'react'
import { useSelector } from 'react-redux'

function Leaderboard() {
  const loggedUser=useSelector((state)=>{ return state.auth.user})
  console.log(loggedUser,"logged in usaear")
    const [data,setData]=useState([])
    useEffect(()=>{
       async function leaderboardData(){
            try{
                const res=await api.get("leader/usersAll")
                setData(res.data)
                
            }catch(err){
               alert(err.message)
            }
        }
        leaderboardData()
    },[])
    console.log(data,"data is getting")
  return (
    <div>
      <table>
        <thead>
            <th>Rank</th>
            <th>Name</th>
            <th>wins</th>
            <th>Losses</th>
            <th>games Played</th>
            <th>streak</th>
        </thead>
        <tbody>
          {data.map(u=>
            <tr className={loggedUser.user._id.toString()===u._id.toString() ? "bg-yellow-200":""}>
              <td>{u.rank}</td>
              <td>{u.name}</td>
              <td>{u.status.wins}</td>
              <td>{u.status.losses}</td>
             
              <td>{u.status.gamesPlayed}</td>
              <td>{u.status.maxStreak}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Leaderboard
