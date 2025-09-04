"use client";
import { useContext, useEffect, useState } from "react";

import {
  getMyInfo,
  updateMyInfo,
  updateUser,
  updatePassword,
} from "@/app/controllers/user_controller";
import toast from "react-hot-toast";
import Image from "next/image";
import Spinner from "@/components/spinner";
import { updateUserInformation } from "../../../controllers/user_controller";
import { uploadFile } from "../../../controllers/file_upload_controller";
import Loader from "@/components/common/Loader";
import UpdateInvestorProfile from "@/app/component/updateInvestorProfile";
import UpdateMentorProfile from "@/app/component/updateMentorProfile";
import { useTranslation } from "@/app/locales";
const AccountDetails = () => {
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setloading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [fileImage, setfileImage] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    getMyInfo().then((data) => {
      console.log(data);
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

            // Upload image first if a new file was selected
            if (e.target.file.files[0]) {
              const formData = new FormData();
              formData.append("file", e.target.file.files[0]);

              const imageUrl = await uploadFile(formData);
              data.image = imageUrl;
            }

            // Update user information with JSON data
            const response = await updateUserInformation(data);
            setRefresh(refresh + 1);
            setUpdating(false);
            toast.success(t('account.userDetailsUpdatedSuccess','User details updated successfully!'));
          } catch (error) {
            setUpdating(false);
            toast.error(error.message || t('account.userDetailsUpdatedFailed','Failed to update user details!'));
          }
        }}
      >
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <div className="flex justify-center">
              <label
                for="file-upload"
                className="aspect-squire h-34 w-34 flex justify-center items-center bg-graydark rounded-full cursor-pointer  "
              >
                {fileImage == null ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-12 text-white h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                ) : (
                  <Image
                    alt=""
                    src={fileImage}
                    className="rounded-full h-34 w-34 object-cover aspect-square"
                    height={3400}
                    width={3400}
                  />
                )}
              </label>

              <input
                id="file-upload"
                onChange={(e) => {
                  setfileImage(URL.createObjectURL(e.target.files[0]));
                }}
                name="file"
                className="form-style sr-only"
                placeholder="Name"
                type="file"
              />
            </div>
            {/* {fileImage} */}

            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t('account.accountInformation','Account Information')}
            </h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-3 pt-4">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.nameLabel','Name')}
                </label>
                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  className="form-style"
                  placeholder={t('account.nameLabel','Name')}
                  type="tel"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.emailAddressLabel','Email address')}
                </label>
                <input
                  name="email"
                  disabled
                  value={user.email}
                  required
                  className="form-style disabled:opacity-75"
                  placeholder={t('auth.email','Email')}
                  type="tel"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.phoneNumberLabel','Phone number')}
                </label>
                <input
                  name="phone"
                  defaultValue={user.phone}
                  required
                  className="form-style"
                  placeholder={t('account.phoneNumberLabel','Phone number')}
                  type="tel"
                />
              </div>
            </div>
            <div className="flex pt-8">
              <button
                type="submit"
                className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95"
              >
                <div>{updating ? <Spinner /> : t('account.updateDetails','Update details')}</div>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Password Update Section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const currentPassword = e.target.currentPassword.value;
          const newPassword = e.target.newPassword.value;
          const confirmPassword = e.target.confirmPassword.value;

          if (newPassword !== confirmPassword) {
            toast.error(t('account.passwordsDoNotMatch','New passwords do not match!'));
            return;
          }

          if (newPassword.length < 6) {
            toast.error(t('account.passwordTooShort','New password must be at least 6 characters long!'));
            return;
          }

          let data = {
            currentPassword,
            newPassword,
          };

          setUpdating(true);
          updateUserInformation(data)
            .then((response) => {
              setUpdating(false);
              console.log(response);
              toast.success(t('account.passwordUpdatedSuccess','Password updated successfully!'));
              e.target.reset();
            })
            .catch((error) => {
              setUpdating(false);
              toast.error(error.message || t('account.passwordUpdatedFailed','Failed to update password!'));
            });
        }}
      >
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t('account.changePassword','Change Password')}
            </h4>
            <div className="grid grid-cols-1 gap-y-3 gap-x-3 pt-4">
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.currentPassword','Current Password')}
                </label>
                <input
                  name="currentPassword"
                  required
                  className="form-style"
                  placeholder={t('account.enterCurrentPassword','Enter current password')}
                  type="password"
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.newPassword','New Password')}
                </label>
                <input
                  name="newPassword"
                  required
                  className="form-style"
                  placeholder={t('account.enterNewPassword','Enter new password')}
                  type="password"
                  minLength={6}
                />
              </div>
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('account.confirmNewPassword','Confirm New Password')}
                </label>
                <input
                  name="confirmPassword"
                  required
                  className="form-style"
                  placeholder={t('account.confirmNewPasswordPlaceholder','Confirm new password')}
                  type="password"
                  minLength={6}
                />
              </div>
            </div>
            <div className="flex pt-8">
              <button
                type="submit"
                className="py-3 px-4 flex justify-center bg-primary cursor-pointer text-white rounded hover:opacity-95"
              >
                <div>{updating ? <Spinner /> : t('account.updatePassword','Update Password')}</div>
              </button>
            </div>
          </div>
        </div>
      </form>

      {user.role == "Investor" && (
        <UpdateInvestorProfile
          refresh={refresh}
          setRefresh={setRefresh}
          user={user}
        />
      )}
      {user.role == "Mentor" && (
        <div>
          <UpdateMentorProfile
            refresh={refresh}
            setRefresh={setRefresh}
            user={user}
          />
        </div>
      )}
    </div>
  );
};

export default AccountDetails;
