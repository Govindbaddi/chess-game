import React from 'react'
import { useState } from 'react'
import { api } from '../api/client'

function Profile() {
    const [file,setFile]=useState("")
    const [url,setUrl]=useState('')

    //uploading image function
   async function uploadingImage(e){
      console.log("checking")
        e.preventDefault()
        const formdata=new FormData(e.target)
        const image=formdata.get('file')
        console.log(image,"imgae url")
      const res= await api.post("/upload",formdata)
      setUrl(res.data.avatar)
        console.log(res.data,"cloud url")
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
      <img src={url} alt="" />
    </div>
  )
}

export default Profile
