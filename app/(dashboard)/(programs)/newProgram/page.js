"use client";
import { addProgram } from "@/app/controllers/program_controller";
import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/common/Loader";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { useTranslation } from "../../../locales";

// import {Breadcrumb} from "@/app/component/Breadcrumb"
const Page = () => {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [requirement, setRequirement] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <Breadcrumb prevLink={``} prevPage={t("programs.programs", "Programs")} pageName={t("programs.newProgram", "New program")} />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5 space-y-4 ">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            {t("programs.createNewProgram", "Create new program")}
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = {
                type: e.target.type.value,
                title: e.target.title.value,
                expireDate: e.target.expireDate.value,
                description: e.target.description.value,
                requirements: fields,
              };
              addProgram(data).then(() => {
                router.back();
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.programTitle", "Program title")}
                </label>
                <input
                  name="title"
                  className="w-full rounded border-stroke"
                  placeholder={t("programs.enterProgramTitle", "Enter program title")}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.expireDate", "Expire Date")}
                </label>
                <input
                  type="date"
                  name="expireDate"
                  className="w-full rounded border-stroke"
                  placeholder={t("programs.enterExpireDate", "Enter expire date")}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("programs.programType", "Program type")}
                </label>
                <select
                  name="type"
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>{t("programs.selectProgramType", "Select program type")}</option>
                  <option value="bfa">{t("programs.businessFoundationAccelerator", "Business foundation accelerator")}</option>
                  <option value="ira">{t("programs.investmentReadinessAccelerator", "Investment Readiness Accelerator")}</option>
                  <option value="consultance">{t("programs.consultancePrograms", "Consultance programs")}</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("programs.programDescription", "Program description")}
              </label>
              <textarea
                name="description"
                placeholder={t("programs.writeDescription", "Write description")}
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="pt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t("programs.addListOfRequiredDocuments", "Add list of required documents")}
              </label>
              <div className="flex space-x-4">
                <input
                  placeholder={t("programs.requiredField", "Required field")}
                  value={requirement}
                  onChange={(e) => {
                    setRequirement(e.target.value);
                  }}
                  className="w-full border-stroke rounded"
                />{" "}
                <div
                  onClick={() => {
                    if (requirement != "") {
                      fields.push(requirement);
                      setFields(fields);
                      setRequirement("");
                    } else {
                      toast.error(t("programs.enterFieldFirst", "Enter field first"));
                    }
                  }}
                  className="py-2 px-3 rounded bg-primary text-white"
                >
                  {t("common.add", "Add")}
                </div>
              </div>
            </div>

            <div className="space-y-2 py-4">
              {fields.map((item, index) => (
                <div className="text-black flex space-x-1" key={item}>
                  <div className="font-bold">{index + 1}.</div>
                  <div>{item}</div>
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      let array = fields.filter((item) => item != item);
                      setFields(array);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      class="w-6 h-6 hover:text-danger"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="py-2 px-3 rounded flex justify-center bg-primary text-white"
            >
              {loading ? <Spinner /> : t("programs.publishProgram", "Publish program")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
