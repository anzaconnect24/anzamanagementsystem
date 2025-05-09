"use client";
import { useState } from "react";

interface CheckboxTwoProps {
  label: string;
  clickable?: boolean; // Whether the checkbox is clickable
  disabled?: boolean; // Whether the checkbox is disabled
  id: string;
  defaultChecked?: boolean; // Default checked state
}

const CheckboxTwo = ({ label, clickable = true, disabled = false, id, defaultChecked = false }: CheckboxTwoProps) => {
  const [isChecked, setIsChecked] = useState<boolean>(defaultChecked); // Use defaultChecked as initial state

  const handleCheckboxChange = () => {
    if (clickable && !disabled) {
      setIsChecked(!isChecked);
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={`flex cursor-pointer select-none items-center ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="sr-only"
            checked={isChecked}
            onChange={handleCheckboxChange}
            disabled={disabled} // Disable input if the disabled prop is true
          />
          <div
            className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${
              isChecked ? "border-green-500 bg-green-100" : "border-stroke"
            }`}
          >
            <span className={`opacity-0 ${isChecked ? "!opacity-100" : ""}`}>
              <svg
                width="11"
                height="8"
                viewBox="0 0 11 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                  fill="#00B74A" // Green color for the checkmark
                  stroke="#00B74A" // Green color for the checkmark
                  strokeWidth="0.4"
                ></path>
              </svg>
            </span>
          </div>
        </div>
        {label}
      </label>
    </div>
  );
};

export default CheckboxTwo;
