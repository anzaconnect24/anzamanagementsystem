"use client";

import { Empty, LoadingBlock } from "@/components/capital/CapitalUI";
import useCapitalAccess from "@/components/capital/useCapitalAccess";

// A capital facilitation page shown only to someone holding at least one of
// the permissions it needs. Capital permissions are granted per role from the
// matrix, so the role alone does not decide; the API checks again regardless.
const CapitalRoute = ({ need = [], children }) => {
  const { can, loading } = useCapitalAccess();

  if (loading) return <LoadingBlock label="Checking your access…" />;
  if (need.length && !can(...need)) {
    return (
      <div className="p-6">
        <Empty>You do not have access to this part of capital facilitation. An administrator can grant it from Capital Facilitation Settings.</Empty>
      </div>
    );
  }
  return children;
};

export default CapitalRoute;
