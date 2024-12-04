import React from "react";

const Modal2 = ({ isOpen, onClose, message, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-lg z-10 p-6">
        <h2 className="text-xl font-semibold mb-4">Alert</h2>
        <p>{message}</p>
        <div className="flex justify-end mt-4 ">
          <button
            onClick={onClose}
            className="px-6 py-2  bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
          <button
            onClick={onDelete}
            className="px-4 ml-2 py-2 bg-red-500 text-white rounded hover:bg-blue-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal2;
