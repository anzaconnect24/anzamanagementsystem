"use client";
import { getMyInfo } from "@/app/controllers/user_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/utils/local_storage";

const Page = () => {
  const [loading, setloading] = useState(false);
  const router = useRouter();
  return (
    <div className="bg-white">
      <div className="text-center w-5/12 mx-auto h-screen flex items-center justify-center">
        <div className="">
          <Link href="/signin" className="flex justify-center">
            <Image 
              alt="Authorization logo"
              height={100} 
              width={100} 
              src={"/anza.png"} 
            />
          </Link>
          <div className="text-4xl font-bold text-black pb-3 pt-2">
            Review on progress
          </div>
          <div className=" text-base ">
            We are currently reviewing your account informations, we will let
            you know via email when we are done.
          </div>

          <div
            onClick={() => {
              setloading(true);
              getMyInfo().then((data) => {
                if (data.activated) {
                  router.push("/");
                  setloading(false);
                } else {
                  setloading(false);
                }
              });
            }}
            className="py-3 px-4 mt-5 bg-primary text-white rounded
             hover:opacity-95 cursor-pointer flex justify-center"
          >
            {loading ? <Spinner /> : "Refresh"}
          </div>
          <div
            onClick={() => {
              logout();
              router.push("/signin");
            }}
            className=" font-bold text-danger pb-3 pt-3 cursor-pointer"
          >
            Logout
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
