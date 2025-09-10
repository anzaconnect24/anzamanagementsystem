import React from "react";
import { useParams } from "react-router-dom";

const UploadMaterialWithType = () => {
  const { type } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Material - {type}</h1>
      <p>
        Upload material page content will be implemented here for type: {type}
      </p>
    </div>
  );
};

export default UploadMaterialWithType;
