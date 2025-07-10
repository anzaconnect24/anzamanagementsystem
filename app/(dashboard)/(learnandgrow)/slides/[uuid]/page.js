"use client";
import { useContext, useEffect, useState } from "react";
import { getModules } from "../../../../controllers/modules_controller";
import Link from "next/link";
import { UserContext } from "../../../layout";
import {
  deleteSlide,
  getSlides,
  markRead,
} from "@/app/controllers/slides_controller";
import {
  createComment,
  getComments,
} from "@/app/controllers/comment_controllers";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { BsTrash } from "react-icons/bs";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";
import moment from "moment";
import Image from "next/image";

const Page = ({ params }) => {
  const { uuid } = params;
  const [modules, setModules] = useState([]);
  const { userDetails, hideSidebar } = useContext(UserContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [activeTab, setActiveTab] = useState("content");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadData();
    loadComments();
  }, []);

  let loadData = () => {
    getSlides({ module_uuid: uuid }).then((res) => {
      console.log(res);
      setModules(res.data);
      setProgress(
        res.data.reduce(
          (prev, curr) => prev + (curr.SlideReaders.length > 0 ? 1 : 0),
          0
        )
      );
      setModule(res.module);
      setLoading(false);
    });
  };
  let loadComments = () => {
    getComments({ module_uuid: uuid }).then((res) => {
      console.log(res.data);
      setComments(res.data);
    });
  };
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const payload = {
      module_uuid: uuid,
      message: newComment,
    };
    createComment(payload).then((res) => {
      loadComments();
      setNewComment("");
    });
  };

  // Calculate progress percentage
  const progressPercentage =
    modules.length > 0 ? (progress / modules.length) * 100 : 0;

  return loading ? (
    <Loader />
  ) : (
    <div>
      <Breadcrumb prevLink={""} pageName={module.title} prevPage={"Back"} />
      {/* Progress Bar */}
      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-1 text-green-700">
          Progress: {progress}/{modules.length} slides completed
        </p>
        <div className="w-full bg-black/10 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="bg-primary/10 p-6 rounded-lg mb-4 mt-4">
        <p>{module.description}</p>
      </div>

      <div className="bg-white flex mt-2 rounded-lg border h-[70vh] w-full border-gray/10">
        <div
          className={`w-2/12
          }  border-r-2 border-black/10 p-5 h-[70vh] overflow-y-auto`}
        >
          <div className="space-y-4">
            {modules.map((item, index) => {
              const isRead = item.SlideReaders.length > 0;
              return (
                <div
                  onClick={() => {
                    if (isRead) {
                      setCurrentSlide(index);
                    } else {
                      if (index == currentSlide + 1) {
                        if (modules[currentSlide].SlideReaders.length == 0) {
                          setCurrentSlide(index);
                          markRead({
                            slide_uuid: modules[currentSlide].uuid,
                          }).then((res) => {
                            loadData();
                          });
                        } else {
                          setCurrentSlide(index);
                        }
                      } else {
                        toast.error("You need to read in order");
                      }
                    }
                  }}
                  className={`${
                    index == currentSlide ? "text-primary" : "text-graydark"
                  } flex space-x-3 items-center justify-between w-full cursor-pointer `}
                  key={item.uuid}
                >
                  <p>
                    {index + 1}. {item.title}
                  </p>
                  <div>
                    {["Admin"].includes(userDetails.role) && (
                      <BsTrash
                        className="hover:text-red-400 cursor-pointer text-sm"
                        onClick={() => {
                          deleteSlide(item.uuid).then((res) => {
                            loadData();
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            {["Admin"].includes(userDetails.role) && (
              <Link
                href={`/slides/add/?uuid=${uuid}`}
                className="text-white bg-primary py-2 px-3 cursor-pointer rounded"
              >
                Add Slide
              </Link>
            )}
          </div>
        </div>
        <div
          className={`w-7/12 border-r-2 border-black/10 ml-auto py-4 bg-white h-full flex flex-col text-lg`}
        >
          {modules[currentSlide]?.type == "file" ? (
            <div className="h-full w-full relative">
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(
                  modules[currentSlide]?.file
                )}&embedded=true`}
                style={{ width: "100%", height: "100%" }}
                frameBorder="0"
                className="pointer-events-auto bg-white h-full w-full"
              />
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              <div className="px-6">
                <h1 className="font-bold text-xl mb-2">
                  {modules[currentSlide]?.title}
                </h1>
                {modules[currentSlide]?.content}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-5 text-sm  px-3 mt-3 ">
            {/* <button
              onClick={() =>
                setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
              }
              disabled={currentSlide === 0}
              className={`py-2 px-3 rounded ${
                currentSlide === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-primary/10 text-black cursor-pointer"
              }`}
            >
              Previous
            </button> */}

            {modules.length == currentSlide + 1 && progressPercentage < 100 ? (
              <button
                onClick={() => {
                  markRead({
                    slide_uuid: modules[currentSlide].uuid,
                  }).then((res) => {
                    toast.success("Completed successfully");
                    loadData();
                  });
                }}
                className="bg-green-500 py-2 px-4 cursor-pointer text-white rounded-lg"
              >
                Complete Module
              </button>
            ) : (
              <button
                onClick={() => {
                  if (modules[currentSlide].SlideReaders.length == 0) {
                    console.log("marking read");
                    markRead({ slide_uuid: modules[currentSlide].uuid }).then(
                      (res) => {
                        loadData();
                      }
                    );
                  }
                  setCurrentSlide((prev) =>
                    prev < modules.length - 1 ? prev + 1 : prev
                  );
                }}
                disabled={currentSlide === modules.length - 1}
                className={`py-2 px-3 rounded ${
                  currentSlide === modules.length - 1
                    ? "bg-gray-300 text-gray-500 text-white cursor-not-allowed"
                    : "bg-primary text-white cursor-pointer"
                }`}
              >
                Next
              </button>
            )}
          </div>
        </div>
        <div className="w-3/12 h-[70vh] flex flex-col justify-between space-y-3 px-4 pt-5">
          <div className="px-0  ">
            <h1 className="font-bold ">Comments</h1>
            <div className="flex-1 overflow-y-auto text-sm text-black/50 ">
              {comments.length == 0 && (
                <div className="pt-4">
                  No Comments, Be the first to share your thoughts.
                </div>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-black/10 py-2">
                  <div className="flex items-center space-x-2">
                    <div>
                      <Image
                        height={1000}
                        width={1000}
                        className=" h-7 w-7 object-cover rounded-full"
                        src={comment.User.image}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm ">
                        {comment.User.name}
                      </p>
                      <p className="text-xs text-gray-600 ">
                        {moment(comment.createdAt).format("MMM DD, yyy")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-sm">{comment.message}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded border-stroke "
              rows="2"
            />
            <button
              onClick={handleCommentSubmit}
              className=" bg-primary text-white py-2 px-4 rounded hover:bg-primary/80"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
