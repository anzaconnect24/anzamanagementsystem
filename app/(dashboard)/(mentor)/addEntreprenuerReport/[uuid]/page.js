"use client";
import { UserContext } from "@/app/(dashboard)/layout";
import Spinner from "@/components/spinner";
import { addMentorReport } from "@/app/controllers/mentorReportsController";
import { useContext, useState } from "react";
import Breadcrumb from "@/app/component/Breadcrumb";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Page = ({ params }) => {
  const entreprenuer_uuid = params.uuid;
  const { userDetails } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <div>
      <Breadcrumb
        prevLink={"/mentorEntreprenuers"}
        pageName={"Entreprenuers reports"}
        prevPage={"Mentors Entreprenuers"}
      />
      <div className="bg-white p-5 w-full">
        <div className="flex justify-between">
          <h1 className="font-bold text-2xl">Entreprenuer report</h1>
          <button
            type="submit"
            onClick={() => {
              window.open(
                "https://docs.google.com/document/d/1D0fEPdvXVOw1imIYViCD5p3bhNrxT1zJvzxLnw2e_2c/edit?usp=sharing",
                "_blank"
              );
            }}
            className="py-2 px-4  w-48 flex justify-center text-primary hover:scale-105  font-bold hover:bg-opacity-90 transition-all duration-300 rounded"
          >
            {loading ? <Spinner /> : "Use Google form"}
          </button>
        </div>
        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            var formData = new FormData();
            setLoading(true);
            formData.append("mentor_uuid", userDetails.uuid);
            formData.append("entreprenuer_uuid", entreprenuer_uuid);
            formData.append("title", e.target.title.value);
            formData.append("description", e.target.description.value);
            formData.append("file", e.target.file.files[0]);

            addMentorReport(formData).then((res) => {
              setLoading(false);
              toast.success("Report uploaded successfully");
              router.back();
            });
          }}
        >
          <div className="w-5/12">
            <h1>Report title</h1>
            <input className="input-style" required name="title" />
          </div>
          <div>
            <h1>Description</h1>
            <textarea className="input-style" required name="description" />
          </div>
          <div>
            <h1>Upload report document</h1>
            <input className="input-style" required type="file" name="file" />
          </div>
          <button
            type="submit"
            className="py-2 px-4 mt-5 bg-primary w-48 flex justify-center text-white hover:bg-opacity-90 transition-all duration-300 rounded"
          >
            {loading ? <Spinner /> : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Page;
