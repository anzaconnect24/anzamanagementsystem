"use client";
import { getMyInfo } from "@/app/controllers/user_controller";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/utils/local_storage";
import { useTranslation } from "../../locales";

const Page = () => {
  const { t } = useTranslation();
  const [loading, setloading] = useState(false);
  const router = useRouter();
  return (
    <div className="bg-white">
      <div className="text-center w-5/12 mx-auto h-screen flex items-center justify-center">
        <div className="">
          <Link href="/signin" className="flex justify-center">
            <Image
              alt={t("auth.emailConfirmationLogo", "Email confirmation logo")}
              height={100}
              width={100}
              src={"/anza.png"}
            />
          </Link>
          <div className="text-4xl font-bold text-black pb-3 pt-2">
            {t("auth.emailConfirmation", "Email confirmation")}
          </div>
          <div className=" text-base ">
            {t(
              "auth.emailConfirmationMessage",
              "We have sent you a link to confirm your email address, open the link to confirm"
            )}
          </div>

          <div
            onClick={() => {
              window.open("https://mail.google.com/mail/u/0/", "_blank");
            }}
            className="py-3 px-4 mt-5 bg-primary text-white rounded
             hover:opacity-95 cursor-pointer flex justify-center"
          >
            {loading ? <Spinner /> : t("auth.openEmail", "Open Email")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
