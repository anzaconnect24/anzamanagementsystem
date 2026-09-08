"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaArrowRight,
  FaBookOpen,
  FaChalkboardTeacher,
  FaFolderOpen,
  FaPlus,
  FaUsers,
} from "react-icons/fa";
import Loader from "@/components/common/Loader";
import { UserContext } from "../../../layouts/DashboardLayout";
import {
  COURSE_STATUSES,
  archiveCourse,
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
} from "@/controllers/course_controller";
import { Field, Modal, inputClass } from "@/components/learning/formBits";

// Staff author the courses a programme runs. "Staff" is stored as either
// "Staff" or "Reviewer" (see SignUp).
const CAN_MANAGE_ROLES = ["Admin", "Staff", "Reviewer"];

const blank = {
  title: "",
  description: "",
  objectives: "",
  estimatedHours: "",
  startDate: "",
  endDate: "",
  status: "published",
  selfEnroll: true,
  required: false,
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB");
};

// The courses inside one programme. Opening a course leads to its modules,
// workshops, enrollment and resources.
const ProgramCourseList = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { userDetails } = useContext(UserContext);
  const canManage = CAN_MANAGE_ROLES.includes(userDetails?.role);
  // Only an Admin may destroy a course outright; the server enforces the same.
  const isAdmin = userDetails?.role === "Admin";

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCourses(uuid)
      .then((body) => {
        setProgram(body?.program || null);
        setCourses(Array.isArray(body?.data) ? body.data : []);
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error?.response?.status === 404
            ? "Program not found"
            : "Failed to load this program's courses",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [uuid]);

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Give the course a title");
      return;
    }

    setSaving(true);
    const payload = { ...form, title: form.title.trim() };

    const response = form.uuid
      ? await updateCourse(form.uuid, payload)
      : await createCourse(uuid, payload);
    setSaving(false);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to save the course");
      return;
    }

    toast.success(form.uuid ? "Course updated" : "Course created");
    setForm(null);
    load();
  };

  const remove = async (course) => {
    if (
      !window.confirm(
        `Archive "${course.title}"? Enrollments and learner progress are kept.`,
      )
    )
      return;

    const response = await archiveCourse(course.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to archive the course");
      return;
    }

    toast.success("Course archived");
    load();
  };

  // Irreversible, and it takes learner progress with it — so it names what
  // will be destroyed and asks for the course title back before it runs.
  const destroy = async (course) => {
    const parts = [
      `${course.modules} ${course.modules === 1 ? "module" : "modules"}`,
      `${course.workshops} ${course.workshops === 1 ? "workshop" : "workshops"}`,
      `${course.resources} ${course.resources === 1 ? "resource" : "resources"}`,
      `${course.enrolled} ${course.enrolled === 1 ? "enrollment" : "enrollments"}`,
    ].join(", ");

    const answer = window.prompt(
      `Permanently delete "${course.title}"?\n\nThis destroys ${parts}, along with all learner progress. It cannot be undone.\n\nType the course title to confirm.`,
    );

    if (answer === null) return;

    if (answer.trim() !== course.title.trim()) {
      toast.error("That did not match the course title. Nothing was deleted.");
      return;
    }

    const response = await deleteCourse(course.uuid);

    if (response?.status !== true) {
      toast.error(response?.message || "Failed to delete the course");
      return;
    }

    const removed = response.body?.removed;

    toast.success(
      removed
        ? `Course deleted — ${removed.modules} modules, ${removed.content} items, ${removed.workshops} workshops, ${removed.resources} resources`
        : "Course deleted",
    );
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen px-6 py-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-950">
          {program?.title || "Program"}
        </h1>

        {program?.description && (
          <p className="mb-6 max-w-3xl text-lg leading-7 text-[#6f6f72]">
            {program.description}
          </p>
        )}

        <div className="mb-8 flex flex-wrap items-center gap-8 border-y border-slate-200 py-4 text-sm text-[#6f6f72]">
          <span className="flex items-center gap-2">
            <FaBookOpen className="text-slate-400" />
            <strong className="text-slate-950">{courses.length}</strong>{" "}
            {courses.length === 1 ? "Course" : "Courses"}
          </span>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Courses in this Program
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              Startups enroll in a course. Its modules, workshops and resources
              live inside it.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setForm({ ...blank })}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
            >
              <FaPlus className="text-xs" />
              Add Course
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No courses have been created for this program yet.
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div
                key={course.uuid}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-black text-teal-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {course.status !== "published" && (
                          <span className="rounded-full bg-[#FFFAEB] px-3 py-1 text-xs font-bold capitalize text-[#B54708]">
                            {course.status}
                          </span>
                        )}

                        {course.required && (
                          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-bold text-[#3538CD]">
                            Required
                          </span>
                        )}

                        {!course.selfEnroll && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Staff enroll
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black leading-snug text-slate-950">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-[#6f6f72]">
                          {course.description}
                        </p>
                      )}

                      {(course.startDate || course.endDate) && (
                        <p className="mt-2 text-xs text-[#98A2B3]">
                          {formatDate(course.startDate)} &ndash;{" "}
                          {formatDate(course.endDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3">
                    {[
                      {
                        label: "Modules",
                        value: course.modules,
                        icon: FaBookOpen,
                      },
                      {
                        label: "Workshops",
                        value: course.workshops,
                        icon: FaChalkboardTeacher,
                      },
                      {
                        label: "Resources",
                        value: course.resources,
                        icon: FaFolderOpen,
                      },
                      {
                        label: "Enrolled",
                        value: course.enrolled,
                        icon: FaUsers,
                      },
                    ].map((box) => {
                      const Icon = box.icon;

                      return (
                        <div
                          key={box.label}
                          className="min-w-[104px] rounded-2xl bg-[#F9FAFB] p-4"
                        >
                          <Icon className="mb-1 text-xs text-[#98A2B3]" />
                          <p className="text-lg font-bold text-slate-950">
                            {box.value}
                          </p>
                          <p className="text-xs text-[#98A2B3]">{box.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/programManagement/program/${uuid}/course/${course.uuid}`,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                  >
                    Open course <FaArrowRight className="text-xs" />
                  </button>

                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...blank,
                            ...course,
                            estimatedHours: course.estimatedHours ?? "",
                            startDate: course.startDate || "",
                            endDate: course.endDate || "",
                          })
                        }
                        className="rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2563EB] transition hover:bg-[#DCE7FF]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => remove(course)}
                        className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                      >
                        Archive
                      </button>

                      {/* Destroying a course takes its content and every
                          learner's progress with it, so it is Admin-only and
                          asks the title to be typed back. */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => destroy(course)}
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#B42318] underline-offset-2 transition hover:underline"
                        >
                          Delete permanently
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {form && (
          <Modal
            title={form.uuid ? "Edit Course" : "Add Course"}
            onClose={() => setForm(null)}
          >
            <Field label="Course title">
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Financial Management"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description || ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field label="What learners will be able to do">
              <textarea
                rows={3}
                value={form.objectives || ""}
                onChange={(event) =>
                  setForm({ ...form, objectives: event.target.value })
                }
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Starts">
                <input
                  type="date"
                  value={form.startDate || ""}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Ends">
                <input
                  type="date"
                  value={form.endDate || ""}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Estimated hours">
                <input
                  type="number"
                  value={form.estimatedHours}
                  onChange={(event) =>
                    setForm({ ...form, estimatedHours: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                  className={inputClass}
                >
                  {COURSE_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.selfEnroll}
                onChange={(event) =>
                  setForm({ ...form, selfEnroll: event.target.checked })
                }
              />
              Startups may enroll themselves
            </label>

            <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(event) =>
                  setForm({ ...form, required: event.target.checked })
                }
              />
              Required for everyone on the program
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="w-full rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save course"}
            </button>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ProgramCourseList;
