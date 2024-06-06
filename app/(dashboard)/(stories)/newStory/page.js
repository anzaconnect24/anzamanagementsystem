'use client';

import { createSector } from "@/app/controllers/sector_controller";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from 'react-hot-toast';
import Spinner from "@/components/spinner";
import { getApprovedBusinesses } from "@/app/controllers/business_controller";
import { createSuccessStory } from "@/app/controllers/stories_controller";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const Page = () => {
    const [fields, setFields] = useState([]);
    const [description, setDescription] = useState("");
    const [imageURL, setImageURL] = useState(null);
    const [requirement, setRequirement] = useState("");
    const router = useRouter();
    
    const [applications, setApplications] = useState([]);
    const [ShowOptions, setShowOptions] = useState(false);
    const [uploadStory, setuploadStory] = useState(false);
    // const {setSelectedBusiness} = useContext(BusinessContext)
    const [loading, setloading] = useState(true);

    useEffect(() => {
        getApprovedBusinesses(1, 1000).then((data) => {
            setApplications(data.data);
            setloading(false);
        });
    }, []);

    return (loading ? <Loader /> : <div>
        {/* {applications.length} */}
        <Breadcrumb prevLink={``} prevPage="Stories" pageName="Create new story" />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
                <h4 className="text-xl font-semibold text-black dark:text-white">
                    Compose a story
                </h4>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setuploadStory(true);
                    const data = {
                        title: e.target.title.value,
                        story: description,
                        file: e.target.image.files[0],
                        business_uuid: e.target.business.value
                    };
                    createSuccessStory(data).then((data) => {
                        router.back();
                        setuploadStory(false);
                    });
                }}>
                    <div className="w-full flex flex-col items-center justify-center">
                        <input type="file" onChange={(e) => {
                            setImageURL(e.target.files[0]);
                        }} name="image" id="image" className="w-full rounded border-stroke sr-only" />
                        {imageURL == null ? <div>
                            <label htmlFor="image">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    strokeWidth={1.5} stroke="currentColor" className="size-4 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
                                </svg>
                                <div>Upload story image*</div>
                            </label>
                        </div> : <Image alt="" height={1000} width={1000} src={URL.createObjectURL(imageURL)} />}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 mt-6">
                        <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                Title
                            </label>
                            <input name="title" className="w-full rounded border-stroke"
                                placeholder="Enter story title" />
                        </div>
                        <div>
                            <label className="mb-2.5 block font-medium text-black dark:text-white">
                                Select business
                            </label>
                            <select name="business" className="w-full rounded border-stroke"
                                placeholder="Enter sector name">
                                <option>Select business</option>
                                {applications.map((item, key) => {
                                    return <option key={key} value={item.uuid}>{item.name}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                            Story
                        </label>
                        <ReactQuill theme="snow" placeholder="Write description here" value={description} onChange={setDescription} />
                    </div>
                    <button type="submit" className="py-3 px-4 mt-4 hover:opacity-95 rounded flex justify-center
                        bg-primary text-white">
                        <div>{uploadStory ? <Spinner /> : "Publish story"}</div>
                    </button>
                </form>
            </div>
        </div>
    </div>);
};

export default Page;
