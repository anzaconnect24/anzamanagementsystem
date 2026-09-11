import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBullseye,
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaLayerGroup,
  FaPaperclip,
  FaUsers,
} from "react-icons/fa";
import StatCard from "@/components/tracker/StatCard";
import { getMyCohortPrograms } from "@/controllers/cohort_controller";
import { downloadMeEvidence, getMeActivities, getMeAssessments, getMeEmployment, getMeEvidence, getMeFunding, getMeGoals, getMeImpact, getMeMetrics, getMeReports, getMyMeDashboard, saveMeAssessment, saveMeEmployment, saveMeFunding, saveMeGoal, saveMeImpact, saveMeReport, submitMeReport, uploadMeEvidence } from "@/controllers/me_controller";

// The overview tiles. Each reads straight off the dashboard payload, so a
// metric the API has not sent yet shows 0 rather than breaking the row.
const OVERVIEW_TILES = [
  { label: "Current goals", value: (d) => d.goals?.length, icon: <FaBullseye />, tone: "text-[#0b2b5c]" },
  { label: "Upcoming reports", value: (d) => d.reportsDue, icon: <FaCalendarAlt />, tone: "text-amber-500" },
  { label: "Verified reports", value: (d) => d.reportsVerified, icon: <FaCheckCircle />, tone: "text-emerald-600" },
  { label: "Assessments", value: (d) => d.assessments?.length, icon: <FaClipboardCheck />, tone: "text-[#0b2b5c]" },
  { label: "Mentorship sessions", value: (d) => d.sessions?.length, icon: <FaUsers />, tone: "text-[#0b2b5c]" },
  { label: "Evidence pending", value: (d) => d.evidencePending, icon: <FaPaperclip />, tone: "text-amber-500" },
  { label: "Open risks", value: (d) => d.risks?.length, icon: <FaExclamationTriangle />, tone: "text-rose-600" },
];

const reportDefaults = { reportingPeriod: "", periodStart: "", periodEnd: "", revenue: "", employees: "", jobsCreated: "", customersServed: "", fundingReceived: "", keyMilestone: "", biggestChallenge: "", supportRequired: "" };
const assessmentDefaults = { assessmentType: "baseline", assessmentDate: "", monthlyRevenue: "", annualRevenue: "", permanentEmployees: "", temporaryEmployees: "", customers: "", capitalRaised: "", monthlyExpenses: "", marketsServed: "" };
const unwrap = (response) => response?.body ?? response;
const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#082d77] focus:ring-2 focus:ring-[#082d77]/20";
const formatDate = (value) => { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB") : "N/A"; };
const prettyStatus = (value) => String(value).replace(/[_-]/g, " ");
const label = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
function QuickEntry({fields,values,setValues,onSave}){return <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50"><h2 className="text-xl font-black">Add record</h2><div className="mt-4 grid gap-4 md:grid-cols-3">{fields.map(k=><label key={k}><span className="mb-1 block text-sm font-semibold">{label(k)}</span><input type={/Date$/.test(k)?"date":/amount|target|Value|Male|Female|jobs/i.test(k)?"number":"text"} value={values[k]||""} onChange={e=>setValues({...values,[k]:e.target.value})} className={inputClass}/></label>)}</div><button onClick={onSave} className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 font-bold text-white">Save record</button></div>}
function EvidenceRecords({rows,programUuid}){const open=async r=>{if(!r.storageKey)return window.open(r.fileUrl,"_blank","noopener");try{const x=await downloadMeEvidence(programUuid,r.uuid),url=URL.createObjectURL(x.data);window.open(url,"_blank","noopener");setTimeout(()=>URL.revokeObjectURL(url),30000)}catch{toast.error("Unable to open evidence")}};return <div className="space-y-2">{rows.length?rows.map(r=><div key={r.uuid} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm shadow-slate-200/50"><div><b>{r.evidenceType}</b><p className="text-sm text-slate-500">{r.description||r.entityType}</p></div><button onClick={()=>open(r)} className="font-semibold text-[#082d77]">Open · {r.verificationStatus}</button></div>):<div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm shadow-slate-200/50">No evidence yet.</div>}</div>}

export default function MyMEProgress() {
  const [programs, setPrograms] = useState([]); const [programUuid, setProgramUuid] = useState(""); const [business, setBusiness] = useState(null);
  const [tab, setTab] = useState("overview"); const [records, setRecords] = useState([]); const [report, setReport] = useState(reportDefaults); const [assessment, setAssessment] = useState(assessmentDefaults); const [saving, setSaving] = useState(false);
  const [entry,setEntry]=useState({});
  const [evidence,setEvidence]=useState({entityType:"report",entityUuid:"",evidenceType:"document",description:"",file:null});
  useEffect(() => { getMyCohortPrograms().then((result) => { setPrograms(result.data || []); setBusiness(result.business); setProgramUuid(result.data?.[0]?.uuid || ""); }); }, []);
  const load = async () => { if (!programUuid) return setRecords([]); const calls={overview:getMyMeDashboard,reports:getMeReports,assessments:getMeAssessments,performance:getMeMetrics,activities:getMeActivities,goals:getMeGoals,funding:getMeFunding,employment:getMeEmployment,impact:getMeImpact,evidence:getMeEvidence}; const response=await calls[tab](programUuid); const value=unwrap(response); setRecords(tab === "reports" ? value?.data || [] : tab==="overview" ? value||{} : Array.isArray(value) ? value : []); };
  useEffect(() => { load(); }, [programUuid, tab]);
  const submitReport = async () => { if (!report.reportingPeriod) return toast.error("Reporting period is required"); setSaving(true); const savedResponse = await saveMeReport(programUuid, report); const saved = unwrap(savedResponse); if (savedResponse?.status === false) toast.error(savedResponse.message); else { const response = await submitMeReport(programUuid, saved.uuid); response?.status === false ? toast.error(response.message) : (toast.success("Progress report submitted"), setReport(reportDefaults), load()); } setSaving(false); };
  const submitAssessment = async () => { if (!assessment.assessmentDate) return toast.error("Assessment date is required"); setSaving(true); const { assessmentType, assessmentDate, ...performanceMetrics } = assessment; const response = await saveMeAssessment(programUuid, { assessmentType, assessmentDate, performanceMetrics, status: "submitted" }); response?.status === false ? toast.error(response.message) : (toast.success("Assessment submitted"), setAssessment(assessmentDefaults), load()); setSaving(false); };
  const activeProgram = programs.find((p) => p.uuid === programUuid) || null;
  if (!programs.length) return <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><h1 className="text-2xl font-black">Monitoring and Evaluation</h1><p className="mt-2 text-slate-500">This workspace becomes available when your business is enrolled in a programme.</p></div>;
  return <div className="space-y-6"><Hero business={business} program={activeProgram} programCount={programs.length}/>
    <div className="flex flex-wrap gap-3"><select value={programUuid} onChange={(e) => setProgramUuid(e.target.value)} className={`${inputClass} max-w-md`}>{programs.map((p) => <option key={p.uuid} value={p.uuid}>{p.title}</option>)}</select>{["overview","reports","assessments","performance","activities","goals","funding","employment","impact","evidence"].map((key) => <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${tab === key ? "bg-[#082d77] text-white" : "bg-white text-slate-600"}`}>{key}</button>)}</div>
    {tab === "overview" && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OVERVIEW_TILES.map((tile) => (
          <StatCard
            key={tile.label}
            label={tile.label}
            value={tile.value(records) ?? 0}
            icon={tile.icon}
            tone={tile.tone}
          />
        ))}
      </div>
    )}
    {tab === "reports" && <><Editor title="Submit progress report" values={report} setValues={setReport} dateKeys={["periodStart", "periodEnd"]} numberKeys={["revenue", "employees", "jobsCreated", "customersServed", "fundingReceived"]} onSubmit={submitReport} saving={saving}/><Records rows={records} columns={["reportingPeriod", "revenue", "jobsCreated", "customersServed", "status"]}/></>}
    {tab === "assessments" && <><div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50"><h2 className="text-xl font-black">Baseline, midline or endline</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{Object.keys(assessmentDefaults).map((key) => <label key={key}><span className="mb-1 block text-sm font-semibold text-slate-700">{label(key)}</span>{key === "assessmentType" ? <select value={assessment[key]} onChange={(e) => setAssessment({ ...assessment, [key]: e.target.value })} className={inputClass}>{["baseline", "midline", "endline", "custom"].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select> : <input type={key === "assessmentDate" ? "date" : "number"} value={assessment[key]} onChange={(e) => setAssessment({ ...assessment, [key]: e.target.value })} className={inputClass}/>}</label>)}</div><button disabled={saving} onClick={submitAssessment} className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 font-bold text-white disabled:opacity-50">Submit assessment</button></div><Records rows={records} columns={["assessmentType", "assessmentDate", "status"]}/></>}
    {tab === "performance" && <Records rows={records} columns={["metricCode", "reportingDate", "numericValue", "unit", "verificationStatus"]}/>}
    {tab === "activities" && <Records rows={records} columns={["name","activityType","activityDate","status"]}/>}
    {tab === "goals" && <><QuickEntry fields={["title","description","target","unit","targetDate"]} values={entry} setValues={setEntry} onSave={()=>saveQuick(saveMeGoal,"Goal saved")}/><Records rows={records} columns={["title","target","unit","targetDate","progressPercentage","status"]}/></>}
    {tab === "funding" && <><QuickEntry fields={["opportunityType","counterparty","fundingType","amountRequested","currency","status"]} values={entry} setValues={setEntry} onSave={()=>saveQuick(saveMeFunding,"Funding linkage saved")}/><Records rows={records} columns={["opportunityType","counterparty","amountRequested","amountReceived","currency","status"]}/></>}
    {tab === "employment" && <><QuickEntry fields={["reportingPeriod","reportingDate","permanentMale","permanentFemale","temporaryMale","temporaryFemale","jobsCreated"]} values={entry} setValues={setEntry} onSave={()=>saveQuick(saveMeEmployment,"Employment record saved")}/><Records rows={records} columns={["reportingPeriod","permanentMale","permanentFemale","temporaryMale","temporaryFemale","jobsCreated","verificationStatus"]}/></>}
    {tab === "impact" && <><QuickEntry fields={["metricCode","metricName","category","unit","baselineValue","currentValue","reportingPeriod"]} values={entry} setValues={setEntry} onSave={()=>saveQuick(saveMeImpact,"Impact record saved")}/><Records rows={records} columns={["metricName","category","baselineValue","currentValue","unit","reportingPeriod","verificationStatus"]}/></>}
    {tab === "evidence" && <><div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50"><h2 className="text-xl font-black">Upload evidence</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><input placeholder="Linked record UUID" value={evidence.entityUuid} onChange={e=>setEvidence({...evidence,entityUuid:e.target.value})} className={inputClass}/><select value={evidence.entityType} onChange={e=>setEvidence({...evidence,entityType:e.target.value})} className={inputClass}>{["report","assessment","goal","activity","impact"].map(x=><option key={x} value={x}>{label(x)}</option>)}</select><input placeholder="Description" value={evidence.description} onChange={e=>setEvidence({...evidence,description:e.target.value})} className={inputClass}/><input type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" onChange={e=>setEvidence({...evidence,file:e.target.files?.[0]})} className={inputClass}/></div><button onClick={uploadEvidence} className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 font-bold text-white">Upload evidence</button></div><EvidenceRecords rows={records} programUuid={programUuid}/></>}</div>;

  async function saveQuick(fn,message){setSaving(true);const response=await fn(programUuid,entry);response?.status===false?toast.error(response.message):(toast.success(message),setEntry({}),load());setSaving(false)}
  async function uploadEvidence(){if(!evidence.file||!evidence.entityUuid)return toast.error("Choose a file and enter the linked record UUID");const form=new FormData();Object.entries(evidence).forEach(([k,v])=>v!=null&&form.append(k,v));const response=await uploadMeEvidence(programUuid,form);response?.status===false?toast.error(response.message):(toast.success("Evidence uploaded"),setEvidence({...evidence,entityUuid:"",description:"",file:null}),load())}
}

function Hero({ business, program, programCount }) {
  return <header className="relative min-h-[240px] overflow-hidden rounded-2xl bg-black shadow-sm">
    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/mentor_hero.svg')" }}/>
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-[#c9672b]/30"/>
    <div className="relative z-10 max-w-3xl p-10 text-white">
      <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-sm font-medium shadow-sm"><span className="h-2 w-2 rounded-full bg-[#f08a3c]"/>Monitoring &amp; Evaluation</span>
      <h1 className="mb-3 text-3xl font-bold leading-tight drop-shadow-lg md:text-4xl">{business?.name || "My business progress"}</h1>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-white/85 drop-shadow-md">Submit programme updates and follow verified growth over time.</p>
      <div className="flex flex-wrap items-center gap-6 text-sm text-white/85">
        <span className="flex items-center gap-2"><FaLayerGroup/>{program?.title || `${programCount} ${programCount === 1 ? "programme" : "programmes"}`}</span>
        {(program?.startDate || program?.endDate) && <span className="flex items-center gap-2"><FaCalendarAlt/>{formatDate(program?.startDate)} &ndash; {formatDate(program?.endDate)}</span>}
        {program?.reportingStatus && <span className="flex items-center gap-2 capitalize"><FaCheckCircle/>{prettyStatus(program.reportingStatus)}</span>}
      </div>
    </div>
  </header>;
}

function Editor({ title, values, setValues, dateKeys, numberKeys, onSubmit, saving }) { return <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200/50"><h2 className="text-xl font-black">{title}</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{Object.keys(values).map((key) => <label key={key}><span className="mb-1 block text-sm font-semibold text-slate-700">{label(key)}</span><input type={dateKeys.includes(key) ? "date" : numberKeys.includes(key) ? "number" : "text"} value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className={inputClass}/></label>)}</div><button disabled={saving} onClick={onSubmit} className="mt-5 rounded-lg bg-[#16a34a] px-5 py-2.5 font-bold text-white disabled:opacity-50">{saving ? "Submitting..." : "Submit report"}</button></div>; }
function Records({ rows, columns }) { return <div className="overflow-x-auto rounded-2xl bg-white shadow-sm shadow-slate-200/50"><table className="w-full text-left"><thead className="bg-slate-50"><tr>{columns.map((c) => <th key={c} className="px-4 py-3 text-xs font-semibold text-slate-500">{label(c)}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.uuid} className="border-t border-slate-100">{columns.map((c) => <td key={c} className="px-4 py-3 text-sm">{row[c] ?? "—"}</td>)}</tr>) : <tr><td colSpan={columns.length} className="p-10 text-center text-slate-500">No records yet.</td></tr>}</tbody></table></div>; }
