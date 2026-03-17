import React from 'react'
import { signup } from '../slices/AuthSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const dispatch=useDispatch()
  const navigate=useNavigate()
 async function handleSubmit(e){
     e.preventDefault();
        const formdata=new FormData(e.target);
        const email=formdata.get("email")
        const password=formdata.get("password")
         const name=formdata.get("name")
        //dispatch(login({email,password}))
       // console.log(email,password)
       try{
          await dispatch(signup({email,password,name})).unwrap()
            // await dispatch(fetchMe())
            navigate("/login")
         }catch(err){
          console.log(err)
         }
  }
  return (
     <div className='flex items-center justify-center h-screen '>
      <div className='border border-black rounded p-20'>
        <form onSubmit={handleSubmit} 
        className='flex flex-col gap-10'>
        <label>
          Name
          <input type="text"
          name="name"
           placeholder='Enter name' 
           className='border rounded ml-12 p-1'/>
        </label>
        <label>
          Email
          <input type="email" 
          name="email"
          placeholder='Enter email' 
          className='border rounded ml-4 p-1'/>
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
        value="signup" 
        className='bg-sky-600 p-2 rounded'/>
      </form>
      </div>
      
    </div>
  )
}

export default Signup
