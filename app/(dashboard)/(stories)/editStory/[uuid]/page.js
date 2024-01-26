"use client"
import { createSector} from "@/app/controllers/sector_controller"
import { useEffect, useState } from "react";
// import Link from "next/link"
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
// import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";
import { getApprovedBusinesses } from "@/app/controllers/business_controller";
import { createSuccessStory,getStoryDetails,getSuccessStory,updateSuccessStory } from "@/app/controllers/stories_controller";

// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = ({params}) => {
    const uuid = params.uuid
    const [fields, setFields] = useState([]);
    const [requirement, setRequirement] = useState("");
    const router = useRouter()
    
    const [applications, setApplications] = useState([]);
    const [ShowOptions, setShowOptions] = useState(false);
    const [uploadStory, setuploadStory] = useState(false);

    const [story, setStory] = useState(null);
    const [loading, setloading] = useState(true);
  useEffect(() => {
        getStoryDetails(uuid).then((data)=>setStory(data))
    }, []);
    useEffect(() => {
          getApprovedBusinesses(1,1000).then((data)=>{
            setApplications(data.data)
            setloading(false)
          })
    }, []);
    return ( loading?<Loader/>: <div>
      {/* {applications.length} */}
               <Breadcrumb prevLink={``} prevPage="Stories" pageName="Create new story" />
         <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
        <h4 className="text-xl font-semibold text-black dark:text-white">
           Update a story
        </h4>
        <form onSubmit={(e)=>{
             e.preventDefault();
             setuploadStory(true)
            const data = {
               title:e.target.title.value,
               story:e.target.story.value,
               videoLink:e.target.videoLink.value,
               business_uuid:e.target.business.value
             }
           updateSuccessStory(uuid,data).then((data)=>{
            router.back()
            setuploadStory(false)

           })
        }}>
        <div className="grid grid-cols-3 gap-x-3">
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
            Title
            </label>
         <input defaultValue={story.title} name="title" className="w-full rounded border-stroke" 
         placeholder="Enter story title"/>

            </div>
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
            Video link
            </label>
         <input defaultValue={story.videoLink} name="videoLink" className="w-full rounded border-stroke" 
         placeholder="Enter video link"/>

            </div>
            <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
            Select business
            </label>
         <select defaultValue={story.Business.uuid} name="business" className="w-full rounded border-stroke" 
         placeholder="Enter sector name">
            <option>Select business</option>
            {applications.map((item,key)=>{
                return <option value={item.uuid}>{item.name}</option>
            })}
         </select>

            </div>
            </div>
            <div className="mt-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
            Story
            </label>
         <textarea name="story" defaultValue={story.story} className="w-full rounded border-stroke" 
         placeholder="Write a story"/>

            </div>
            
        
        
     <button type="submit" className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center
      bg-primary text-white">
        <div>{uploadStory?<Spinner/>:"Update story"}</div>
        </button>
       
        </form>
        
      

      </div>
      </div>

    </div> );
}
 
export default Page;