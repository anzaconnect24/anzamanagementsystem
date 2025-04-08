"use client"

import { UserContext } from "@/app/(dashboard)/layout";
import { useContext, useEffect, useState } from "react";
import {setDoc,collection, onSnapshot,doc,query, where, orderBy, Timestamp} from "firebase/firestore";
import {firestore} from "@/app/utils/firebase"
import Image from "next/image"
import Breadcrumb from "@/app/component/Breadcrumb";
import { timeAgo } from "@/app/utils/time_ago";


const MessageComponent = ({params}) => {
const [messages, setMessages] = useState([]);
const uuid = params.uuid;

useEffect(() => {
  try {
    const q = query(collection(firestore,"messages"),where("conversation_uuid","==",uuid),orderBy("createdAt","asc"))
    onSnapshot(q,(qs)=>{
      const data = qs.docs.map((item)=>item.data());
      setMessages(data)
    })
  } catch (error) {
    throw error
    
  }
 
}, [uuid]);

const {userDetails} = useContext(UserContext)
  return (
    <div>
      <Breadcrumb pageName={"Chat page"} prevLink={""} prevPage={"Back"}/>

  <div className="bg-white rounded-lg  py-3 shadow-2xl px-3 ">

    <div className="bg-white py-4 flex space-y-4 flex-col px-8 rounded scroll-m-2 overflow-y-scroll  h-[55vh]">
 
      {messages.map((item,key) => {
        return <div key={key} className={`${userDetails.uuid==item.sender_uuid?"text-right":"text-start"}`}>
                 <div className={`flex ${userDetails.uuid==item.sender_uuid?"justify-end":"justify-start"} space-x-2 items-center`}>
                  <div className={`flex space-x-3 max-w-125  py-2 rounded-lg px-3 ${userDetails.uuid == item.sender_uuid?"bg-primary text-white":"bg-stroke text-black"}`}>
                  <div className={`flex flex-col ${userDetails.uuid == item.sender_uuid?"items-end text-end":""}`}>
                  <div className="text-sm">@{item.senderName}</div>
                  <div className="text-lg" key={key}>{item.message}</div>
                  </div>
                  </div> 
                </div>
              <div className="text-sm mt-1">{timeAgo(Date(item.createdAt))}</div>  
        </div>
        
      })}
      
    </div>
      
<form onSubmit={(e)=>{
  e.preventDefault()
  const id = Timestamp.now()
   const data  = {
      conversation_uuid:uuid,
      id:id.toDate().toString(),
      message: e.target.message.value,
      senderImage:userDetails.image,
      senderName:userDetails.name,
      sender_uuid:userDetails.uuid,
      createdAt:id
   }
   setDoc(doc(collection(firestore,"messages"),id.toDate().toString()),data)
  e.target.message.value = "";

}} className="flex space-x-4 mt-2">
<input type="text" placeholder="Enter text here..." className="w-full py-4 px-4 rounded-lg  bg-stroke text-black text-lg border-stroke focus:border-stroke focus:ring-stroke" name="message"/>
<button className="py-3 px-4 bg-success text-white rounded-lg" type="submit">Send</button>
</form>

    </div>
    </div>
  
  );
};

export default MessageComponent;
