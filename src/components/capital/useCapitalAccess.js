"use client";

import { useEffect, useState } from "react";
import { getCapitalPermissions } from "@/controllers/capital_controller";
import { headers } from "@/utils/headers";

// The signed-in user's capital facilitation permissions, fetched once per
// session and shared by every component that asks. The API enforces every
// permission regardless; this only decides which actions a page offers.
// The cache belongs to the session token, so signing in as someone else
// never reuses the previous user's permissions.
let cached = null;
let pending = null;

const currentToken = () => headers.Authorization || "";

const load = () => {
  const token = currentToken();
  if (cached && cached.token === token) return Promise.resolve(cached);
  if (!pending || pending.token !== token) {
    const request = getCapitalPermissions().then((response) => {
      const value = response?.status
        ? { token, role: response.body.role, permissions: new Set(response.body.permissions || []) }
        : { token, role: null, permissions: new Set() };
      if (currentToken() === token) cached = value;
      if (pending === request) pending = null;
      return value;
    });
    request.token = token;
    pending = request;
  }
  return pending;
};

// Forget the cache, e.g. after an administrator changes the matrix.
export const resetCapitalAccess = () => {
  cached = null;
};

const useCapitalAccess = () => {
  const [state, setState] = useState(cached || { role: null, permissions: new Set(), loading: true });

  useEffect(() => {
    let alive = true;
    load().then((value) => alive && setState({ ...value, loading: false }));
    return () => {
      alive = false;
    };
  }, []);

  return {
    role: state.role,
    loading: !!state.loading,
    can: (...keys) => keys.some((key) => state.permissions.has(key)),
  };
};

export default useCapitalAccess;
