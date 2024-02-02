"use client"

import { UserContext } from "@/app/(dashboard)/layout";
import { useContext, useEffect, useState } from "react";
import {setDoc,collection, onSnapshot,doc,query, where, orderBy, Timestamp} from "firebase/firestore";
import {firestore} from "@/app/utils/firebase"
import Image from "next/image"


const MessageComponent = ({params}) => {
const [messages, setMessages] = useState([]);
const uuid = params.uuid;

useEffect(() => {
  const q = query(collection(firestore,"messages"),where("conversation_uuid","==",uuid))
  onSnapshot(q,(qs)=>{
    const data = qs.docs.map((item)=>item.data());
    setMessages(data)
  })
}, []);

const {userDetails} = useContext(UserContext)
  return (
    <div className="h-[70vh] ">
    <div className="bg-white py-4 px-8 rounded overflow-y-scroll h-[65vh]">
      <div className="flex flex-col  justify-end h-[60vh] space-y-4">
      {messages.map((item,key) => {
        return <div className={`flex ${userDetails.uuid==item.sender_uuid?"justify-end":"justify-start"} space-x-2 items-center`}>
                  <div className={`flex space-x-3 max-w-125  py-2 rounded-lg px-3 ${userDetails.uuid == item.sender_uuid?"bg-primary text-white":"bg-stroke"}`}>
                  <div className={`flex flex-col ${userDetails.uuid == item.sender_uuid?"items-end text-end":""}`}>
                  <div className="text-sm">@{item.senderName}</div>
                  <div className="text-xl" key={key}>{item.message}</div>
                  </div>
                  </div>
                  
              </div>  
      })}
      </div>
    </div>
      
<form onSubmit={(e)=>{
  e.preventDefault()
   const data  = {
      conversation_uuid:uuid,
      message: e.target.message.value,
      senderImage:userDetails.image,
      senderName:userDetails.name,
      sender_uuid:userDetails.uuid,
      createdAt:Timestamp.now()
   }
   setDoc(doc(collection(firestore,"messages")),data)
  e.target.message.value = "";

}} className="flex space-x-4 mt-2">
<input type="text" placeholder="Enter text here..." className="w-full py-3 px-2 rounded  border-stroke focus:ring-primary" name="message"/>
<button className="py-3 px-4 bg-primary text-white rounded" type="submit">Send</button>
</form>

    </div>
  );
};

export default MessageComponent;
