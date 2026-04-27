import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Lobby from './pages/Lobby'
import Navbar from './components/Navbar'
import { ProtectedRoutes } from './components/ProtectedRoutes'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from './slices/AuthSlice'
import Room from './pages/Room'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Guest from './pages/Guest'
import Home from './pages/Home'


function App() {

  const dispatch=useDispatch()
  //const data=useSelector((state)=>state.auth.user)
  useEffect(()=>{
    dispatch(fetchMe())
  },[dispatch])


  return (
    <>
    <Routes>
      <Route path="/" element={<Home/>}/>
     <Route  element={<Navbar/>}>
      <Route path="/login" element={<Login/>}/>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/guest" element={<Guest/>}/>
      <Route element={<ProtectedRoutes/>}>
      <Route path="/lobby" element={<Lobby/>}/>
      <Route path="/rooms/:roomCode" element={<Room/>}/>
      <Route path="/leaderboard" element={<Leaderboard/>}/>
      <Route path="/profile" element={<Profile/>}/>
      
      </Route>
      </Route>
    </Routes>
    </>
  )
}

export default App
