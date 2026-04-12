import React from 'react'
import { useNavigate } from 'react-router-dom'

function Guest() {
    const navigate=useNavigate()
    function handleSubmit(e){
        e.preventDefault()
        const formdata=new FormData(e.target)
        const name=formdata.get("name")
        const guest = { id: crypto.randomUUID(), name };
        console.log(guest,"checing")
        localStorage.setItem("guest", JSON.stringify(guest));
        navigate("/lobby");
    }
  return (
   <div className='flex items-center justify-center h-screen '>
      <div className='flex flex-col border border-black rounded p-20  gap-4'>
        <form onSubmit={handleSubmit} 
        className='flex flex-col gap-10'>
        <label>
          Name
          <input type="text"
          name="name"
           placeholder='Enter name' 
           className='border rounded ml-12 p-1'/>
        </label>
        <input 
        type="submit" 
        value="Login as Guest" 
        className='bg-sky-600 p-2 rounded'/>
      </form>
      </div>    
      </div>
  )
}

export default Guest
