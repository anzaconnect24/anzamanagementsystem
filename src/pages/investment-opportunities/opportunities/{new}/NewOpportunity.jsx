"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Link from "@/utils/link";
import { server_url } from "@/utils/endpoint";
import { headers } from "@/utils/headers";
import { BsArrowLeft, BsUpload } from "react-icons/bs";
import Spinner from "@/components/spinner";
import { useTranslation } from "@/locales";
import Breadcrumb from "@/component/Breadcrumb";

const NewInvestmentOpportunity = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    sector: "",
    amount: "",
    expireDate: "",
    investmentType: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Selected file:", file);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert(t("common.pleaseSelectImageFile", "Please select an image file"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t("common.fileSizeMustBeLess", "File size must be less than 5MB"));
      return;
    }

    // Store the file for later upload
    setSelectedFile(file);

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      image: previewUrl,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t("investment.titleIsRequired", "Title is required");
    }

    if (!formData.description.trim()) {
      newErrors.description = t(
        "investment.descriptionIsRequired",
        "Description is required"
      );
    }

    if (!formData.sector.trim()) {
      newErrors.sector = t("investment.sectorIsRequired", "Sector is required");
    }

    // amount optional: validate only when provided
    if (formData.amount && formData.amount.trim() !== "") {
      if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        newErrors.amount = t(
          "investment.pleaseEnterValidAmount",
          "Please enter a valid amount"
        );
      }
    }
    // investmentType optional: no required check

    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = t(
        "investment.pleaseEnterValidURL",
        "Please enter a valid URL"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      let imageUrl = "";

      // Upload image first if one is selected
      if (selectedFile) {
        console.log("Uploading image during form submission...");
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResponse = await fetch(`${server_url}/upload-file`, {
          method: "POST",
          headers: {
            Authorization: headers.Authorization,
          },
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();
        console.log("Upload response:", uploadData);

        if (uploadData.status) {
          imageUrl = uploadData.body;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          console.error("Upload failed:", uploadData);
          alert(
            t("investment.failedToUploadImage", "Failed to upload image") +
              ": " +
              (uploadData.message || t("common.unknownError", "Unknown error"))
          );
          return;
        }
      }

      // Prepare the final form data with the uploaded image URL
      const finalFormData = {
        ...formData,
        image: imageUrl,
        amount:
          formData.amount && formData.amount.trim() !== ""
            ? parseFloat(formData.amount)
            : null,
        investmentType:
          formData.investmentType && formData.investmentType.trim() !== ""
            ? formData.investmentType
            : null,
      };

      console.log("Submitting form data:", finalFormData);

      const response = await fetch(`${server_url}/investment-opportunities`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(finalFormData),
      });

      const data = await response.json();

      if (data.status) {
        // Clean up the preview URL
        if (formData.image && formData.image.startsWith("blob:")) {
          URL.revokeObjectURL(formData.image);
        }
        navigate("/opportunities");
      } else {
        alert(
          t(
            "investment.failedToCreateOpportunity",
            "Failed to create opportunity"
          ) +
            ": " +
            (data.message || t("common.unknownError", "Unknown error"))
        );
      }
    } catch (error) {
      console.error("Error creating opportunity:", error);
      alert(
        t("investment.errorCreatingOpportunity", "Error creating opportunity") +
          ": " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    {
      value: "Technology",
      label: t("investment.sectors.technology", "Technology"),
    },
    {
      value: "Healthcare",
      label: t("investment.sectors.healthcare", "Healthcare"),
    },
    { value: "Finance", label: t("investment.sectors.finance", "Finance") },
    {
      value: "Education",
      label: t("investment.sectors.education", "Education"),
    },
    {
      value: "Agriculture",
      label: t("investment.sectors.agriculture", "Agriculture"),
    },
    {
      value: "Manufacturing",
      label: t("investment.sectors.manufacturing", "Manufacturing"),
    },
    { value: "Retail", label: t("investment.sectors.retail", "Retail") },
    { value: "Energy", label: t("investment.sectors.energy", "Energy") },
    {
      value: "Real Estate",
      label: t("investment.sectors.realEstate", "Real Estate"),
    },
    {
      value: "Transportation",
      label: t("investment.sectors.transportation", "Transportation"),
    },
    {
      value: "Entertainment",
      label: t("investment.sectors.entertainment", "Entertainment"),
    },
    { value: "Other", label: t("investment.sectors.other", "Other") },
  ];

  const investmentTypes = [
    { value: "Equity", label: t("investment.types.equity", "Equity") },
    { value: "Debt", label: t("investment.types.debt", "Debt") },
    {
      value: "Convertible",
      label: t("investment.types.convertible", "Convertible"),
    },
    { value: "Grant", label: t("investment.types.grant", "Grant") },
    {
      value: "Revenue Share",
      label: t("investment.types.revenueShare", "Revenue Share"),
    },
    { value: "Hybrid", label: t("investment.types.hybrid", "Hybrid") },
  ];

  return (
    <div className="">
      <div>
        <Breadcrumb
          pageName={t(
            "investment.newInvestmentOpportunity",
            "New Investment Opportunity"
          )}
          prevLink={"/opportunities"}
          prevPage={t(
            "investment.investmentOpportunities",
            "Investment Opportunities"
          )}
        />
        <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Header */}
          <div className="p-6 border-b border-stroke dark:border-strokedark">
            <Link
              to="/dashboard/opportunities"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
            >
              <BsArrowLeft />
              {t("investment.backToOpportunities", "Back to Opportunities")}
            </Link>
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {t(
                "investment.addNewOpportunity",
                "Add New Investment Opportunity"
              )}
            </h4>
            <p className="mt-2 text-bodydark2">
              {t(
                "investment.createNewOpportunity",
                "Create a new investment opportunity to share with potential investors."
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.opportunityTitle", "Title")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.title ? "border-red-500" : ""
                  }`}
                  placeholder={t(
                    "investment.enterOpportunityTitle",
                    "Enter opportunity title"
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.description", "Description")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  placeholder={t(
                    "investment.describeTheInvestmentOpportunity",
                    "Describe the investment opportunity"
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Sector */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.sector", "Sector")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.sector ? "border-red-500" : ""
                  }`}
                >
                  <option value="">
                    {t("investment.selectSector", "Select a sector")}
                  </option>
                  {sectors.map((sector) => (
                    <option key={sector.value} value={sector.value}>
                      {sector.label}
                    </option>
                  ))}
                </select>
                {errors.sector && (
                  <p className="mt-1 text-sm text-red-600">{errors.sector}</p>
                )}
              </div>

              {/* Investment Amount (Optional) */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.investmentAmount", "Investment Amount (USD)")}
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.amount ? "border-red-500" : ""
                  }`}
                  placeholder={t(
                    "investment.enterInvestmentAmountOptional",
                    "Enter investment amount (optional)"
                  )}
                  min="0"
                  step="0.01"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Investment Type (Optional) */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.investmentType", "Investment Type")}
                </label>
                <select
                  name="investmentType"
                  value={formData.investmentType}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.investmentType ? "border-red-500" : ""
                  }`}
                >
                  <option value="">
                    {t(
                      "investment.selectInvestmentTypeOptional",
                      "Select investment type (optional)"
                    )}
                  </option>
                  {investmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.investmentType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.investmentType}
                  </p>
                )}
              </div>

              {/* Expire Date */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.expireDate", "Expire Date")}
                </label>
                <input
                  type="date"
                  name="expireDate"
                  value={formData.expireDate}
                  onChange={handleInputChange}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
                <p className="mt-1 text-sm text-bodydark2">
                  {t(
                    "investment.whenThisOpportunityExpires",
                    "When this opportunity expires and is no longer available"
                  )}
                </p>
              </div>

              {/* URL */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.detailsURLOptional", "Related URL (Optional)")}
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary ${
                    errors.url ? "border-red-500" : ""
                  }`}
                  placeholder="https://example.com"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                )}
                <p className="mt-1 text-sm text-bodydark2">
                  {t(
                    "investment.linkToExternalPage",
                    "Link to external page with more details about this opportunity"
                  )}
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t("investment.imageOptional", "Image (Optional)")}
                </label>

                {formData.image ? (
                  <div className="mb-4">
                    <img
                      src={formData.image}
                      alt="Opportunity"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-stroke dark:border-strokedark"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Clean up the preview URL if it's a blob URL
                        if (
                          formData.image &&
                          formData.image.startsWith("blob:")
                        ) {
                          URL.revokeObjectURL(formData.image);
                        }
                        setFormData((prev) => ({ ...prev, image: "" }));
                        setSelectedFile(null);
                      }}
                      className="mt-2 text-sm text-danger hover:text-danger/80"
                    >
                      {t("investment.removeImage", "Remove Image")}
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-stroke dark:border-strokedark border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-meta-4 hover:bg-gray-100 dark:hover:bg-meta-4/50"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <BsUpload className="w-8 h-8 mb-4 text-bodydark2" />
                          <p className="mb-2 text-sm text-bodydark2">
                            <span className="font-semibold">
                              {t(
                                "investment.clickToUploadImage",
                                "Click to upload"
                              )}
                            </span>{" "}
                            {t("common.orDragAndDrop", "or drag and drop")}
                          </p>
                          <p className="text-xs text-bodydark2">
                            {t(
                              "common.supportedImageFormats",
                              "PNG, JPG, JPEG (Max 5MB)"
                            )}
                          </p>
                        </div>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Spinner />
                      {t("investment.creating", "Creating...")}
                    </div>
                  ) : (
                    t("investment.createOpportunity", "Create Opportunity")
                  )}
                </button>
                <Link
                  to="/opportunities"
                  className="px-6 py-2 border border-stroke dark:border-strokedark text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-strokedark focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 text-center"
                >
                  {t("common.cancel", "Cancel")}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewInvestmentOpportunity;
