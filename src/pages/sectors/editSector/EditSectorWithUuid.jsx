import React from "react";
import { useParams } from "react-router-dom";

const EditSectorWithUuid = () => {
  const { uuid } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Sector</h1>
      <p>Edit sector page content will be implemented here for UUID: {uuid}</p>
    </div>
  );
};

export default EditSectorWithUuid;
