"use client";
import { getMyInfo, updateUser } from "@/controllers/user_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "@/utils/navigation";
import { useState } from "react";
import Image from "@/utils/image";
import Link from "@/utils/link";
import { logout } from "@/utils/local_storage";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

const Page = ({ params }) => {
  const [loading, setloading] = useState(false);
  const router = useRouter();
  return (
    <div className="bg-white">
      <div className="text-center w-5/12 mx-auto h-screen flex items-center justify-center">
        <div className="">
          <Link href="/signin" className="flex justify-center">
            <Image
              alt="Email confirmation logo"
              height={100}
              width={100}
              src={"/anza.png"}
            />
          </Link>
          <div className="text-4xl font-bold text-black pb-3 pt-2">
            Confirmation
          </div>
          <div className=" text-base ">
            Click button below to confirm your account.
          </div>

          <div
            onClick={() => {
              setloading(true);
              updateUser({ emailConfirmed: true }, useParams().uuid).then(
                (data) => {
                  setloading(false);
                  toast.success("Confirmed successfull");
                  router.push("/signin");
                }
              );
            }}
            className="py-3 px-4 mt-5 bg-primary text-white rounded
             hover:opacity-95 cursor-pointer flex justify-center"
          >
            {loading ? <Spinner /> : "Confirm"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
