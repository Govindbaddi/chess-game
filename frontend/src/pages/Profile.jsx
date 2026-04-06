import React from 'react'
import { useState } from 'react'
import { api } from '../api/client'

function Profile() {
    const [file,setFile]=useState("")
   async function uploadingImage(e){
      console.log("checking")
        e.preventDefault()
        const formdata=new FormData(e.target)
        const image=formdata.get('file')
        console.log(image,"imgae url")
      const res= await api.post("/upload",image)
        console.log(res,"cloud url")
    }
  return (
    <div>
      profile page
      <div>
        <form onSubmit={uploadingImage}>
         <input type="file" 
        
          name="file"
         onChange={(e)=>{setFile(e.target.files[0])}}
        />
        <input type="submit" />
        </form>
      </div>
    </div>
  )
}

export default Profile
