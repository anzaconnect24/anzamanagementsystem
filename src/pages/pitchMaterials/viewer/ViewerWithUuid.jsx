import React from "react";
import { useParams } from "react-router-dom";

const ViewerWithUuid = () => {
  const { uuid } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pitch Material Viewer</h1>
      <p>Viewer page content will be implemented here for UUID: {uuid}</p>
    </div>
  );
};

export default ViewerWithUuid;
