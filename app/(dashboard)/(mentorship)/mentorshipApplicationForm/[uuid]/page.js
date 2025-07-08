"use client";
import Breadcrumb from "@/app/component/Breadcrumb";
import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendMentorshipApplication } from "@/app/controllers/mentorship_applications_controllers";
import toast from "react-hot-toast";

const Page = ({ params }) => {
  const mentor_uuid = params.uuid;
  const router = useRouter();
  const [loading, setloading] = useState(false);
  const [formValues, setFormValues] = useState({});
  return (
    <div>
      <Breadcrumb
        pageName={"Mentorship Application"}
        prevLink={""}
        prevPage={"Back"}
      />
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="py-6 px-4 md:px-6 xl:px-7.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setloading(true);
              const data = {
                mentor_uuid,
                challenges: e.target.challenges.value,
                mentorshipMode: e.target.mentorshipMode.value,
                availability: e.target.availability.value,
                mentorshipAreas: formValues.mentorshipAreas,
              };
              sendMentorshipApplication(data).then(() => {
                setloading(false);
                toast.success("Application sent successfully");
                router.back();
              });
            }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div className="col-span-2">
                <label
                  className="mb-2.5 block font-medium text-black
dark:text-white"
                >
                  What area do you need mentorship in? (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Business Strategy",
                    "Financial Management",
                    "Marketing & Sales",
                    "Product Development",
                    "Legal & Compliance",
                    "Investment Readiness",
                  ].map((focus) => (
                    <label key={focus} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="mentorshipAreas"
                        onChange={(e) => {
                          let newFormValues = {
                            mentorshipAreas: {},
                            ...formValues,
                          };
                          newFormValues.mentorshipAreas[
                            Object.keys(newFormValues.mentorshipAreas).length
                          ] = e.target.value;
                          setFormValues(newFormValues);
                        }}
                        value={focus}
                        className="form-checkbox"
                      />
                      <span>{focus}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Prefered Mode of mentorship?
                </label>
                <select
                  name="mentorshipMode"
                  className="w-full rounded border-stroke"
                  placeholder=""
                >
                  <option>Select mentorship mode</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Virtual (Zoom, Google Meet, etc.)">
                    Virtual (Zoom, Google Meet, etc.)
                  </option>
                  <option value="No preference">No preference</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Briefly describe the specific challenge or support you need:
              </label>
              <textarea
                name="challenges"
                placeholder="Write here..."
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <div className="mt-3">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Availability (Days/Times)
              </label>
              <textarea
                name="availability"
                placeholder="Write here..."
                className="border-stroke w-full rounded"
              ></textarea>
            </div>
            <button
              type="submit"
              className="py-2 px-3 mt-4 rounded flex justify-center bg-primary text-white"
            >
              {loading ? <Spinner /> : "Send Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
