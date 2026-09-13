"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getCapitalAudit, getCapitalSettings, getPermissionMatrix, setRolePermission, updateCapitalSettings } from "@/controllers/capital_controller";
import { CapitalHero, Card, DataTable, Empty, Field, FilterBar, inputClass, LoadingBlock, Tabs, buttonClass } from "@/components/capital/CapitalUI";
import useCapitalAccess, { resetCapitalAccess } from "@/components/capital/useCapitalAccess";
import { changeSummary, dateTime } from "@/utils/capital_labels";

const ROLE_NAMES = { CFM: "Capital Facilitation Manager", Admin: "Administrator", BDA: "Business Development", ME: "M&E Officer", Finance: "Finance Officer" };

// ---- Settings ------------------------------------------------------------------
const SettingsTab = () => {
  const [rows, setRows] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCapitalSettings().then((response) => {
      if (response?.status === false) return toast.error(response.message || "Failed to load settings");
      setRows(response.body.data);
      setValues(Object.fromEntries(response.body.data.map((row) => [row.key, row.value])));
    });
  }, []);

  if (!rows) return <LoadingBlock label="Loading settings…" />;

  const save = async () => {
    setSaving(true);
    const response = await updateCapitalSettings(values);
    setSaving(false);
    if (response?.status === false) return toast.error(response.message || "Failed to save settings");
    toast.success("Settings saved");
    setRows(response.body.data);
  };

  return (
    <Card title="Reminders and alerts" action={<button type="button" className={buttonClass.primary} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save settings"}</button>}>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <Field key={row.key} label={row.label}>
            <input type="number" min={row.min} max={row.max} className={inputClass} value={values[row.key] ?? ""} onChange={(e) => setValues({ ...values, [row.key]: e.target.value })} />
            <span className="mt-1 block text-[11px] text-slate-400">Between {row.min} and {row.max}.</span>
          </Field>
        ))}
      </div>
    </Card>
  );
};

// ---- Permission matrix -----------------------------------------------------------
const PermissionsTab = () => {
  const [matrix, setMatrix] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const response = await getPermissionMatrix();
    if (response?.status === false) toast.error(response.message || "Failed to load permissions");
    else setMatrix(response.body);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!matrix) return <LoadingBlock label="Loading permissions…" />;

  const toggle = async (key, role, granted) => {
    setBusy(`${key}:${role}`);
    const response = await setRolePermission({ key, role, granted });
    setBusy(null);
    if (response?.status === false) return toast.error(response.message || "Failed to change the permission");
    toast.success(`${granted ? "Granted" : "Revoked"}: ${key} for ${ROLE_NAMES[role] || role}`);
    resetCapitalAccess();
    load();
  };

  return (
    <Card title="Who can do what in capital facilitation" padded={false}>
      <p className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500">
        Changes apply at the user's next page load and are recorded in the audit trail. Enterprises and capital providers are never granted these permissions; they see only their own requests and opportunities. Assign the Capital Facilitation Manager role from <Link to="/dashboard/users" className="font-semibold text-[#082d77] hover:underline">Users</Link>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Permission</th>
              {matrix.roles.map((role) => <th key={role} className="px-3 py-3 text-center normal-case">{ROLE_NAMES[role] || role}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.data.map((permission) => (
              <tr key={permission.key} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5">
                  <span className="block font-mono text-xs text-slate-800">{permission.key}</span>
                  {permission.description ? <span className="block text-xs text-slate-500">{permission.description}</span> : null}
                </td>
                {matrix.roles.map((role) => {
                  const granted = permission.roles.includes(role);
                  const locked = role === "Admin" && permission.key === "capital.permissions.manage";
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${permission.key} for ${ROLE_NAMES[role] || role}`}
                        checked={granted}
                        disabled={locked || busy === `${permission.key}:${role}`}
                        title={locked ? "Administrators always keep this permission" : undefined}
                        onChange={() => toggle(permission.key, role, !granted)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ---- Audit trail -------------------------------------------------------------------
const AuditTab = () => {
  const [filters, setFilters] = useState({ action: "", dateFrom: "", dateTo: "", page: 1 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries({ ...filters, limit: 100 }).filter(([, value]) => value));
    const timer = setTimeout(() => {
      getCapitalAudit(params).then((response) => {
        if (response?.status === false) toast.error(response.message || "Failed to load the audit trail");
        else setResult(response.body);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value, page: key === "page" ? value : 1 }));

  return (
    <>
      <FilterBar onReset={() => setFilters({ action: "", dateFrom: "", dateTo: "", page: 1 })}>
        <Field label="Action" className="w-56">
          <select className={inputClass} value={filters.action} onChange={(e) => set("action")(e.target.value)}>
            <option value="">All actions</option>
            {["request", "matching", "introduction", "opportunity", "communication", "document", "dealroom", "duediligence", "intervention", "note", "provider", "settings", "permissions"].map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </Field>
        <Field label="From" className="w-36"><input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => set("dateFrom")(e.target.value)} /></Field>
        <Field label="To" className="w-36"><input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => set("dateTo")(e.target.value)} /></Field>
      </FilterBar>

      {!result ? (
        <LoadingBlock label="Loading the audit trail…" />
      ) : (
        <Card title={`${result.count} audit entries`} padded={false} action={<span className="text-xs text-slate-500">Permanent: entries cannot be edited or deleted</span>}>
          <DataTable
            rows={result.data}
            empty="No audit entries match these filters."
            columns={[
              { key: "when", label: "When", className: "whitespace-nowrap", render: (row) => dateTime(row.createdAt) },
              { key: "who", label: "Who", render: (row) => <><span className="block text-slate-800">{row.user?.name || "System"}</span><span className="block text-xs text-slate-500">{row.role || ""}</span></> },
              { key: "action", label: "Action", render: (row) => <><span className="block text-slate-800">{row.action}</span><span className="block font-mono text-[11px] text-slate-400">{row.actionKey}</span></> },
              { key: "change", label: "Change", render: (row) => <span className="text-xs text-slate-600">{changeSummary(row.oldValue, row.newValue) || "—"}</span> },
              { key: "opportunity", label: "Opportunity", render: (row) => (row.opportunity ? <Link to={`/dashboard/capital/opportunities/${row.opportunity.uuid}`} className="text-xs font-semibold text-[#082d77] hover:underline">{row.opportunity.reference}</Link> : "—") },
              { key: "ip", label: "IP address", render: (row) => <span className="text-xs text-slate-500">{row.ipAddress || "—"}</span> },
            ]}
          />
          {result.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
              <span className="text-slate-500">Page {result.page} of {result.totalPages}</span>
              <div className="flex gap-2">
                <button type="button" className={buttonClass.secondary} disabled={result.page <= 1} onClick={() => set("page")(result.page - 1)}>Previous</button>
                <button type="button" className={buttonClass.secondary} disabled={result.page >= result.totalPages} onClick={() => set("page")(result.page + 1)}>Next</button>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </>
  );
};

// Settings, permissions and the audit trail - each tab only for those allowed.
const CapitalSettings = () => {
  const { can, loading } = useCapitalAccess();
  const tabs = [
    can("capital.settings.manage") && { key: "settings", label: "Settings" },
    can("capital.permissions.manage") && { key: "permissions", label: "Permissions" },
    can("capital.audit.view") && { key: "audit", label: "Audit trail" },
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab && tabs.some((item) => item.key === tab) ? tab : tabs[0]?.key;

  if (loading) return <LoadingBlock label="Checking your access…" />;

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <CapitalHero title="Capital Facilitation Settings" description="Reminder timings, which roles may do what, and the permanent record of every capital facilitation action." />
      {tabs.length ? (
        <>
          <Tabs tabs={tabs} active={active} onChange={setTab} />
          {active === "settings" ? <SettingsTab /> : null}
          {active === "permissions" ? <PermissionsTab /> : null}
          {active === "audit" ? <AuditTab /> : null}
        </>
      ) : (
        <Empty>You do not have access to capital facilitation settings.</Empty>
      )}
    </div>
  );
};

export default CapitalSettings;
