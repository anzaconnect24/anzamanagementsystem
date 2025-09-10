import React from "react";
import { useParams } from "react-router-dom";

const SectorBusinessesWithUuid = () => {
  const { uuid } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sector Businesses</h1>
      <p>
        Sector businesses page content will be implemented here for UUID: {uuid}
      </p>
    </div>
  );
};

export default SectorBusinessesWithUuid;
