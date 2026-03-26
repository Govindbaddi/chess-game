import React from 'react'
import { fetchMe, login } from '../slices/AuthSlice';
import {useDispatch} from 'react-redux'
import {useNavigate} from "react-router-dom"
import { useSnackbar } from 'notistack';
function Login() {
  const dispatch=useDispatch()
  const navigate=useNavigate()
  const {enqueueSnackbar, closeSnackbar}=useSnackbar()
  
 async function handleSubmit(e){
    e.preventDefault();
    const formdata=new FormData(e.target);
    const email=formdata.get("email")
    const password=formdata.get("password")
    //dispatch(login({email,password}))
   // console.log(email,password)
   try{
         await dispatch(login({email,password})).unwrap()
         await dispatch(fetchMe()).unwrap()
        enqueueSnackbar("Login succesfull",{ variant: 'success' })
       
        navigate("/lobby")
     }catch(err){

       enqueueSnackbar("Login failed",{ variant: 'error' })
      console.log(err)
      
     }
  }

  return (
    <div className='flex items-center justify-center h-screen '>
      <div className='border border-black rounded p-20'>
        <form onSubmit={handleSubmit} 
        className='flex flex-col gap-10'>
        <label>
          Email
          <input type="text"
          name="email"
           placeholder='Enter name' 
           className='border rounded ml-12 p-1'/>
        </label>
        <label>
          password
          <input type="password" 
          name="password"
          placeholder='Enter password' 
          className='border rounded ml-4 p-1'/>
        </label>
        <input 
        type="submit" 
        value="Login" 
        className='bg-sky-600 p-2 rounded'/>
      </form>
      </div>
      
    </div>
  )
}

export default Login
