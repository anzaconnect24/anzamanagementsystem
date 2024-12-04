// DropdownTwo.tsx
import React from 'react';

// Define the interface for props
interface DropdownTwoProps {
  value: string; // Type of the value prop
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Type of the onChange handler
}

const DropdownTwo: React.FC<DropdownTwoProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-32"> {/* Container div with relative positioning */}
      <select
        value={value}
        onChange={onChange}
        className="border border-blue-500 rounded px-3 py-2 w-full pr-8 appearance-none text-sm" // Increased padding for top and bottom
      >
        <option value="Yes">Yes</option>
        <option value="No">No</option>
        <option value="Maybe">Maybe</option>
      </select>
    </div>
  );
};

export default DropdownTwo;
