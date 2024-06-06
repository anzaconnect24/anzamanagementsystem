"use client"
// import { deleteStory, getStory } from "@/app/controllers/story_controller";
import { useContext, useEffect, useState } from "react";
import Link from "next/link"
import Image from "next/image"
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
            setloading(true)
        getStoryDetails(uuid).then((data)=>{
            setloading(false)
            setStory(data)
        })
    }, []);

    return ( loading?<Loader/>:<div>
               <Breadcrumb prevLink={``} prevPage="Stories" pageName={"Read story"} />
         <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h1 className="font-bold text-3xl">{story.title}</h1>
        <p className="italic ">{timeAgo(story.createdAt)}</p>
        <Image alt="" width={2000} height={2000} className="flex  object-cover rounded-lg py-3" src={story.videoLink}/>
        <p dangerouslySetInnerHTML={{ __html:story.story }}></p>

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