import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/common/Loader";
import {
  listTrackerMilestones,
  submitTrackerMilestone,
} from "@/controllers/trackerController";

const EntrepreneurMilestones = () => {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [notesById, setNotesById] = useState({});

  const loadMilestones = async () => {
    setLoading(true);
    try {
      const data = await listTrackerMilestones();
      setMilestones(data || []);
    } catch (error) {
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  const onSubmitMilestone = async (uuid) => {
    try {
      await submitTrackerMilestone(uuid, notesById[uuid] || "");
      toast.success("Milestone submitted");
      loadMilestones();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to submit milestone",
      );
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-black">My Milestones</h1>
        <p className="text-sm text-black/60">
          Submit progress updates so your mentor can review them.
        </p>
      </div>

      <div className="space-y-3">
        {milestones.length === 0 && (
          <div className="rounded-lg border border-black/10 bg-white p-4 text-sm text-black/60">
            No milestones assigned yet.
          </div>
        )}

        {milestones.map((item) => (
          <div
            key={item.uuid}
            className="rounded-lg border border-black/10 bg-white p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="text-xs text-black/60">
                  Mentor: {item?.Mentor?.name || "N/A"}
                </p>
              </div>
              <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold">
                {item.status}
              </span>
            </div>

            <p className="mb-3 text-sm text-black/70">
              {item.description || "No description"}
            </p>

            <textarea
              className="w-full rounded-md border border-black/10 p-2 text-sm"
              placeholder="Add your submission notes"
              value={notesById[item.uuid] || ""}
              onChange={(e) =>
                setNotesById((prev) => ({
                  ...prev,
                  [item.uuid]: e.target.value,
                }))
              }
            />

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onSubmitMilestone(item.uuid)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
                disabled={
                  item.status === "submitted" || item.status === "completed"
                }
              >
                Submit milestone
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntrepreneurMilestones;
