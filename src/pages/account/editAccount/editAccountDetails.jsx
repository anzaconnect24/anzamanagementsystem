"use client";
import { useEffect, useState } from "react";

import { getMyInfo } from "@/controllers/user_controller";
import toast from "react-hot-toast";
import Spinner from "@/components/spinner";
import { updateUserInformation } from "../../../controllers/user_controller";
import { uploadFile } from "../../../controllers/file_upload_controller";
import Loader from "@/components/common/Loader";

const EditAccountDetails = () => {
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fileImage, setfileImage] = useState(null);

  useEffect(() => {
    getMyInfo().then((data) => {
      setUser(data);

      if (data.image) {
        setfileImage(data.image);
      }

      setloading(false);
    });
  }, [refresh]);

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setUpdating(true);

          try {
            let data = {
              name: e.target.name.value,
              phone: e.target.phone.value,
            };

            if (e.target.file.files[0]) {
              const formData = new FormData();
              formData.append("file", e.target.file.files[0]);

              const imageUrl = await uploadFile(formData);
              data.image = imageUrl;
            }

            await updateUserInformation(data);

            setRefresh(refresh + 1);
            setUpdating(false);

            toast.success("User details are updated successfully!");
          } catch (error) {
            setUpdating(false);
            toast.error(error.message || "Failed to update user details!");
          }
        }}
      >
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <div className="flex justify-center">
              <label
                htmlFor="file-upload"
                className="aspect-square flex h-34 w-34 cursor-pointer items-center justify-center rounded-full bg-graydark"
              >
                {fileImage == null ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-12 w-12 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                ) : (
                  <img
                    alt=""
                    src={fileImage}
                    className="aspect-square h-34 w-34 rounded-full object-cover"
                  />
                )}
              </label>

              <input
                id="file-upload"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setfileImage(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                name="file"
                className="form-style sr-only"
                type="file"
              />
            </div>

            <h4 className="text-xl font-semibold text-black dark:text-white">
              Account information
            </h4>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-4">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Name
                </label>

                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  className="form-style"
                  placeholder="Name"
                  type="text"
                />
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Email address
                </label>

                <input
                  name="email"
                  disabled
                  value={user.email}
                  required
                  className="form-style disabled:opacity-75"
                  placeholder="Enter email address"
                  type="email"
                />
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Phone number
                </label>

                <input
                  name="phone"
                  defaultValue={user.phone}
                  required
                  className="form-style"
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
            </div>

            <div className="flex pt-8">
              <button
                type="submit"
                className="flex cursor-pointer justify-center rounded bg-primary px-4 py-3 text-white hover:opacity-95"
              >
                <div>{updating ? <Spinner /> : "Update details"}</div>
              </button>
            </div>
          </div>
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const currentPassword = e.target.currentPassword.value;
          const newPassword = e.target.newPassword.value;
          const confirmPassword = e.target.confirmPassword.value;

          if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match!");
            return;
          }

          if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long!");
            return;
          }

          const data = {
            currentPassword,
            newPassword,
          };

          setUpdating(true);

          updateUserInformation(data)
            .then(() => {
              setUpdating(false);
              toast.success("Password updated successfully!");
              e.target.reset();
            })
            .catch((error) => {
              setUpdating(false);
              toast.error(error.message || "Failed to update password!");
            });
        }}
      >
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-4 py-6 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Change Password
            </h4>

            <div className="grid grid-cols-1 gap-x-3 gap-y-3 pt-4">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Current Password
                </label>

                <input
                  name="currentPassword"
                  required
                  className="form-style"
                  placeholder="Enter current password"
                  type="password"
                />
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  New Password
                </label>

                <input
                  name="newPassword"
                  required
                  className="form-style"
                  placeholder="Enter new password"
                  type="password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Confirm New Password
                </label>

                <input
                  name="confirmPassword"
                  required
                  className="form-style"
                  placeholder="Confirm new password"
                  type="password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex pt-8">
              <button
                type="submit"
                className="flex cursor-pointer justify-center rounded bg-primary px-4 py-3 text-white hover:opacity-95"
              >
                <div>{updating ? <Spinner /> : "Update Password"}</div>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAccountDetails;