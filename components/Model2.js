import React from "react";

const Modal2 = ({
  isOpen = false, // Default value
  onClose,
  message = "Are you sure you want to proceed?", // Default message
  onDelete,
  bgColor = "white", // Default background color
  closeButtonText = "Close", // Default close button text
  deleteButtonText = "Confirm", // Default confirm button text
  closeButtonColor = "blue-500", // Default close button color
  deleteButtonColor = "red-500", // Default delete button color
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div
       className="bg-white rounded-lg shadow-lg z-10 p-6"
    
      >
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Alert</h2>
        <p className="text-black dark:text-gray-300">{message}</p>
        <div className="flex justify-end mt-4 gap-2">
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`px-6 py-2 bg-${closeButtonColor} text-black rounded hover:bg-opacity-90`}
          >
            {closeButtonText}
          </button>
          {/* Confirm Button */}
          <button
            onClick={onDelete}
            className={`px-4 py-2 bg-${deleteButtonColor} text-white rounded hover:bg-opacity-90`}
          >
            {deleteButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal2;
