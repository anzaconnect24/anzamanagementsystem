import { useRef, useState } from "react";
import { FaPlus, FaTrash, FaEye, FaEdit } from "react-icons/fa";

interface ReactIconsProps {
  onAdd: (file: File | null) => void;
  onDelete: () => void;
  onView: () => void;
  onEdit: (comment: string) => void; // Add this line
  attachment: string | null;
  comment: string | null; // Accepting comment as a prop
}

const ReactIcons: React.FC<ReactIconsProps> = ({ onAdd, onDelete, onView, onEdit, attachment, comment }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textField, setTextField] = useState<string>(comment || ''); // Initialize with item.comment if available

  const handleAddClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger file input click
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      onAdd(file); // Pass the selected file to the onAdd function
    }
  };

  const handleEditClick = () => {
    setIsModalOpen(true); // Open modal when edit icon is clicked
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close modal
  };

  const handleInputChange = (value: string) => {
    setTextField(value);
  };

  const handleSaveComment = () => {
    onEdit(textField); // Call the onEdit callback with the updated text
    handleCloseModal();
  };

  //  onEdit = () => {
  //   console.log('printing here');
  //   setIsModalOpen(false); 
  // };

  // Determine if delete/view buttons should be disabled based on attachment presence
  const isDisabled = !attachment;

  return (
    <div className="flex space-x-3">
      <FaPlus
        className="text-primary hover:text-opacity-70 cursor-pointer"
        title="Add"
        onClick={handleAddClick}
      />
      <FaTrash
        className={`text-red-500 ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:text-opacity-70 cursor-pointer"}`}
        title="Delete"
        onClick={isDisabled ? undefined : onDelete}
        aria-disabled={isDisabled}
      />
      <FaEye
        className={`text-blue-500 ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:text-opacity-70 cursor-pointer"}`}
        title="View"
        onClick={isDisabled ? undefined : onView}
        aria-disabled={isDisabled}
      />
      <FaEdit
        className="text-yellow-500 hover:text-opacity-70 cursor-pointer"
        title="Edit"
        onClick={handleEditClick}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        style={{ display: 'none' }} // Hide the input element
        onChange={handleFileChange}
      />

      {/* Modal for editing */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-lg shadow-lg z-10 p-6 w-96">
            {comment ? (
              <>
                <h2 className="text-medium font-semibold mb-1">My comment:</h2>
                <h2 className="text-sm font-normal mb-4">{comment}</h2>
                <h2 className="text-medium font-semibold mb-4">Edit Comment</h2>
              </>
            ) : (
              <h2 className="text-medium font-semibold mb-4">New Comment</h2>
            )}

            <div className="mb-3">
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                value={textField}
                onChange={(e) => handleInputChange(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComment}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactIcons;
