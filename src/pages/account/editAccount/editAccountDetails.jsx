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
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    getMyInfo().then((data) => {
      setUser(data);

      if (data.image) {
        setfileImage(data.image);
      }

      setloading(false);
    });
  }, [refresh]);

  // The profile picture lives in its own card and saves as soon as a new
  // image is selected, so there is no separate "save" step for it.
  const onChangeProfilePicture = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setfileImage(URL.createObjectURL(selected));

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", selected);
      const imageUrl = await uploadFile(formData);

      await updateUserInformation({ image: imageUrl });

      setRefresh((r) => r + 1);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile picture!");
    } finally {
      setUploadingImage(false);
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="space-y-4">
      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="px-4 py-6 md:px-6 xl:px-7.5">
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Profile picture
          </h4>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="relative h-34 w-34">
              <label
                htmlFor="file-upload"
                className="block h-34 w-34 cursor-pointer overflow-hidden rounded-full bg-graydark ring-4 ring-gray-100 dark:ring-strokedark"
              >
                {fileImage == null ? (
                  <span className="flex h-full w-full items-center justify-center">
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
                  </span>
                ) : (
                  <img
                    alt=""
                    src={fileImage}
                    className="h-full w-full object-cover"
                  />
                )}
              </label>

              <label
                htmlFor="file-upload"
                title="Change profile picture"
                className="absolute bottom-1 right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-white shadow-md ring-2 ring-white transition hover:opacity-90 dark:ring-boxdark"
              >
                {uploadingImage ? (
                  <Spinner />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
                  </svg>
                )}
              </label>
            </div>

            <p className="text-xs text-bodydark2">
              Click the edit icon to upload a new picture. It is saved
              automatically.
            </p>

            <input
              id="file-upload"
              onChange={onChangeProfilePicture}
              name="file"
              className="sr-only"
              type="file"
              accept="image/*"
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setUpdating(true);

          try {
            let data = {
              name: e.target.name.value,
              phone: e.target.phone.value,
            };

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