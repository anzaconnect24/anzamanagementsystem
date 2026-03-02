// DropdownTwo.jsx
import React from "react";
import { useTranslation } from "../../locales";

const DropdownTwo = ({ value, onChange, disabledOptions = [] }) => {
  const { t } = useTranslation();
  return (
    <div className="relative w-32">
      {" "}
      {/* Container div with relative positioning */}
      <select
        value={value}
        onChange={onChange}
        className="border border-blue-500 rounded px-3 py-2 w-full pr-8 appearance-none text-sm" // Increased padding for top and bottom
      >
        <option
          value="Yes"
          disabled={disabledOptions.includes("Yes")}
          title={
            disabledOptions.includes("Yes")
              ? t("report.noAttachmentForYes", "Attachment required to set Yes")
              : undefined
          }
        >
          {t("common.yes", "Yes")}
        </option>
        <option value="No">{t("common.no", "No")}</option>
        <option value="Maybe">{t("common.maybe", "Maybe")}</option>
      </select>
    </div>
  );
};

export default DropdownTwo;
