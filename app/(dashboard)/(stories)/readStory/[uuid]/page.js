"use client"
// import { deleteStory, getStory } from "@/app/controllers/story_controller";
import { useContext, useEffect, useState } from "react";
import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../../../component/Breadcrumb";
import { timeAgo } from "@/app/utils/time_ago";
import { UserContext } from "@/app/(dashboard)/layout";
import {deleteSuccessStory, getStoryDetails} from "@/app/controllers/stories_controller"
// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const router = useRouter()
    const {userDetails}= useContext(UserContext)
    const [story, setStory] = useState(null);
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getStoryDetails(uuid).then((data)=>setStory(data))
    }, []);

    return ( story&&<div>
               <Breadcrumb prevLink={``} prevPage="Stories" pageName="Read story" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
      <div className="grid grid-cols-1 gap-y-4">
    {[
        {title:"Title",value:story.title},
        {title:"Published",value:timeAgo(story.createdAt)},
        {title:"Story",value:story.story},
        // {title:"Video",value:},

        // {title:"Published",value:timeAgo(story.createdAt)},

   
].map((item,key)=>{
        return <div className="flex" key={key}>
            <div className="w-4/12">
                {item.title}:
            </div>
            <div className="w-8/12 text-black">
                {item.value}
            </div>

        </div>
    })}
</div>
      
       {userDetails.role == "Admin"&&<div>
       <div className="flex mt-5 space-x-4">
        <Link href={`/editStory/${story.uuid}`}className="py-3 px-4 bg-primary 
        rounded hover:opacity-95 text-white">Edit</Link>
        <div onClick={()=>{
            deleteSuccessStory(story.uuid).then((item)=>{
                router.back()
            })
        }} className="py-3 px-4 bg-danger hover:opacity-95 cursor-pointer text-white rounded">Delete</div>
        </div>
        </div>}
      </div>
      
      </div>
    </div> );
}

export default Page;