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
  const { userDetails } = useContext(UserContext);
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
      <div className="flex border-b border-black/10 mb-0 px-2">
        <button
          className={`px-4 py-2 ${
            activeTab === "content"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("content")}
        >
          Content
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "comments"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({comments.length})
        </button>
      </div>
      <div className="bg-white flex mt-2 rounded-lg border h-[70vh] w-full border-gray/10">
        <div className="w-3/12 border-r-2 border-black/10 p-5 h-[70vh] overflow-y-auto">
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
        <div className="w-9/12 ml-auto py-5 h-full flex flex-col text-lg">
          {activeTab === "content" ? (
            <div className="flex flex-col h-full justify-between">
              <div className="px-6">
                <h1 className="font-bold text-xl mb-2">
                  {modules[currentSlide]?.title}
                </h1>
                {modules[currentSlide]?.content}
              </div>

              <div className="flex justify-end space-x-5 mt-auto p-5">
                <button
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
                </button>
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
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white cursor-pointer"
                  }`}
                >
                  Next
                </button>
                {modules.length == currentSlide + 1 &&
                  progressPercentage <
                    100(
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
                    )}
              </div>
            </div>
          ) : (
            <div className="px-6 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-black/10 py-2"
                  >
                    <div className="flex items-center space-x-2">
                      <div>
                        <Image
                          height={1000}
                          width={1000}
                          className=" h-8 w-8 object-cover rounded-full"
                          src={comment.User.image}
                        />
                      </div>
                      <div>
                        <p className="font-semibold ">{comment.User.name}</p>
                        <p className="text-xs text-gray-600 ">
                          {moment(comment.createdAt).format("MMM DD, yyy")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1">{comment.message}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full rounded border-stroke "
                  rows="3"
                />
                <button
                  onClick={handleCommentSubmit}
                  className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary/80"
                >
                  Post Comment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
