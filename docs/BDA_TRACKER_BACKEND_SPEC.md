# Tracker — BDA, KYC & Tranche Governance: Backend Spec

This document is the backend hand-off for the tracker work done on the frontend.
The **frontend is complete**; these backend changes are what make it persist and
function. Source of truth for status enums: `src/utils/trancheWorkflow.js`.

API base: `https://api.anzaconnect.co.tz` (see `src/utils/endpoint.js`).

---

## 0. Roles & terminology

- **BDA (Business Development Advisor)** = users with role **`Staff`** or
  **`Reviewer`**. (Signup stores the role as `Reviewer`; the UI labels it
  "Staff"/"BDA". Both strings must be treated as a BDA.)
- BDAs do the milestone tracking that mentors used to do. **Everywhere the
  tracker currently authorizes `Mentor`, also authorize `Staff` and `Reviewer`**,
  scoping data to the logged-in user as the owner.
- **Admin** sets up funding agreements and disburses tranches.
- **Entrepreneur** (`Enterprenuer`) fills KYC, proposes plans, reports KPI
  progress.

---

## 1. The blocking issue — permissions (causes "not allowed to perform this action")

The tracker enterprise routes currently reject `Staff`/`Reviewer`. Grant them
the same access as `Mentor` (owner = logged-in user) on:

| Method | Path | Purpose |
|---|---|---|
| POST | `/tracker/enterprises` | Register a startup (Set up tracking) |
| GET | `/tracker/enterprises` | List the BDA's startups |
| GET | `/tracker/enterprises/:uuid` | Startup detail (enterprise, milestones, sessions, trancheStages, stats) |
| PATCH | `/tracker/enterprises/:uuid` | Update startup / funding |
| DELETE | `/tracker/enterprises/:uuid` | Remove startup |
| PATCH | `/tracker/enterprises/:uuid/kpis` | Update KPIs |
| PATCH | `/tracker/enterprises/:uuid/tranche-stages` | Set tranche stages |
| POST | `/tracker/enterprises/:uuid/sessions` | Log coaching session |
| POST | `/tracker/enterprises/:uuid/weekly-logs` | Weekly log |
| POST | `/tracker/enterprises/:uuid/milestones` | Create milestone (BDA) |
| GET | `/tracker/milestones` | List milestones |
| POST | `/tracker/milestones` | Create milestone (entrepreneur) |
| PATCH | `/tracker/milestones/:uuid/submit` | Entrepreneur report / KPI progress |
| PATCH | `/tracker/milestones/:uuid/review` | BDA review / plan approval / verification |
| GET | `/tracker/mentor/overview` | BDA overview (frontend already reuses this) |
| GET | `/tracker/mentor/weekly-logs` | BDA weekly logs (frontend already reuses this) |

> The frontend already points `getStaffOverview`/`getStaffWeeklyLogs` at the
> `mentor` routes, so you do **not** need new `/tracker/staff/*` routes — just
> let BDAs call the routes above.

---

## 2. NEW milestone fields (tranche governance workflow)

Add these columns to the **milestone** model. Accept them on
create/submit/review, and **return them on every milestone read**. The frontend
tolerates `kpiPlan` arriving as a JSON array or a JSON string.

| Field | Type | Notes |
|---|---|---|
| `kpiPlan` | JSON array | KPI plan. Each item: `{ name, target, evidenceSource, currentValue, comment, evidenceUrl, updatedAt }` |
| `planStatus` | string enum | Plan approval lifecycle (see §5) |
| `verificationStatus` | string enum | Achievement outcome (see §5) |
| `verificationRequested` | boolean | Entrepreneur asked for verification (Phase 6) |
| `disbursed` | boolean | Tranche released (Phase 4) |

Existing milestone fields already in use (keep): `uuid`, `title`, `dueDate`,
`status`, `linkedTranche`, `trancheAmount`, `tranchePlannedUse`, `description`,
`submissionNotes`, `submissionAttachments` (JSON array of URLs),
`mentorReviewNotes`.

**Tranche ↔ milestone link:** a tranche stage and its milestone are linked by
`milestone.linkedTranche === trancheStage.title`.

---

## 3. Workflow endpoints — request bodies to accept

The frontend sends these via the **existing** endpoints. Persist any new fields.

### Phase 2 — entrepreneur proposes milestone + KPI plan
`POST /tracker/milestones`
```json
{
  "title": "Launch MVP and onboard first 20 pilot users",
  "dueDate": "2026-09-30",
  "linkedTranche": "Tranche 1",
  "trancheAmount": 20000000,
  "tranchePlannedUse": "MVP build + onboarding",
  "description": "...",
  "kpiPlan": [
    { "name": "20 pilot users onboarded", "target": "20", "evidenceSource": "Onboarding list" }
  ],
  "planStatus": "submitted"
}
```

### Phase 3 — BDA reviews/approves plan
`PATCH /tracker/milestones/:uuid/review`
```json
{ "planStatus": "plan_approved", "mentorReviewNotes": "Realistic and measurable." }
```
`planStatus` will be one of: `plan_approved`, `revision_requested`, `rejected`.

### Phase 4 — admin disburses (gated on approval)
`PATCH /tracker/milestones/:uuid/review`
```json
{ "planStatus": "disbursed", "disbursed": true }
```
**Business rule to enforce server-side:** only allow `disbursed` when the
milestone's current `planStatus` is `plan_approved` (or `sent_to_finance`).

### Phase 5 — entrepreneur logs KPI actuals
`PATCH /tracker/milestones/:uuid/submit`
```json
{
  "kpiPlan": [
    { "name": "20 pilot users onboarded", "target": "20", "evidenceSource": "Onboarding list",
      "currentValue": "12", "comment": "8 more in pipeline" }
  ],
  "submissionNotes": "...",
  "requestVerification": false
}
```

### Phase 6 — entrepreneur submits for verification
Same endpoint with `"requestVerification": true` → set
`verificationRequested = true`.

### Phase 7 — BDA verifies achievement
`PATCH /tracker/milestones/:uuid/review`
```json
{ "verificationStatus": "achieved", "mentorReviewNotes": "Thresholds met." }
```
`verificationStatus` ∈ `achieved | partially_achieved | not_achieved | need_more_evidence`.

---

## 4. Phase 1 — funding agreement (admin)

Admin page `Funding Agreements` operates on a tracker enterprise:

- Total funding + BDA: `PATCH /tracker/enterprises/:uuid` with
  `{ "grantUsd": 60000000, "assignedBda": "Jane" }`.
- Tranche shells (equal split): `PATCH /tracker/enterprises/:uuid/tranche-stages`
  with `{ "trancheStages": [ { "title": "Tranche 1", "date": "", "amount": 20000000 }, ... ] }`.

The admin startup list is read from **`GET /tracker/admin/businesses`** (and
`GET /tracker/enterprises`). `getAdminBusinesses` must return objects whose
`uuid` is the **tracker-enterprise uuid** (so the PATCH calls above work) and
include `name`, `grantUsd`, `assignedBda`, `trancheStages`.

Admins must be authorized on `PATCH /tracker/enterprises/:uuid` and
`/tracker/enterprises/:uuid/tranche-stages`, and
`PATCH /tracker/milestones/:uuid/review` (for disbursement).

---

## 5. Status enums (exact string values)

`planStatus`:
```
draft | submitted | under_review | revision_requested | resubmitted
| plan_approved | rejected | sent_to_finance | disbursed
```

`verificationStatus`:
```
"" (not verified) | achieved | partially_achieved | not_achieved | need_more_evidence
```

---

## 6. Entrepreneur KYC (self-service)

`PATCH /tracker/entrepreneur/enterprise` — the logged-in entrepreneur updates
their own enterprise KYC. Body includes the KYC fields in §7. Must be authorized
for `Enterprenuer` and infer the enterprise from the auth token (no uuid in path).

The frontend also **pre-fills** KYC from signup data (User `name/email/phone` +
their Business `name/phone/location/description`), so no double entry — backend
just needs to store/return the KYC fields.

---

## 7. Enterprise model — KYC & funding columns

Add/confirm these columns on the **enterprise** model (accepted on
`POST/PATCH /tracker/enterprises*` and returned on reads):

Personal/representative KYC: `firstName`, `lastName`, `representativeEmail`,
`representativePhone`, `gender`, `nationalId`, `tin`, `representativeName`.

Business KYC: `registeredBusinessName`, `displayName`, `businessPhone`,
`country`, `district` (region), `businessDescription`, `latitude`, `longitude`,
`documents` (JSON map of `{ "<Doc label>": "<url>" }`, labels: Passport Photo,
Front ID, Back ID, Business Name Cert, Business Logo, TRA Certificate).

Funding/program: `grantUsd`, `awardDate`, `assignedBda`, `category`,
`program_uuid`, `ceSector`, `entreprenuer_uuid`.

KPIs (per-enterprise): `monthlyRevenue`, `employees`, `activeCustomers`
(+ legacy `wasteDiverted`, `ceReadinessScore`, `capitalMobilised`).

`trancheStages`: JSON (array or stringified) of `{ title, date, amount }`.

---

## 8. BDA ⇄ entrepreneur assignment (already working via reuse)

The frontend currently performs BDA assignment by **reusing the
`/mentor-entreprenuers` endpoints** (the BDA's user id is stored as
`mentor_uuid`):

- `POST /mentor-entreprenuers/` `{ mentor_uuid: <bdaUserId>, entreprenuer_uuid }`
- `GET /mentor-entreprenuers/mentor/:bdaUserId` → `[{ Entreprenuer: { ...Business } }]`
- `GET /mentor-entreprenuers/entreprenuer/:uuid`
- `DELETE /mentor-entreprenuers/:uuid`

**Optional clean-up:** add dedicated `/staff-entreprenuers` routes with the same
shapes and re-point `src/controllers/staffEntreprenuerController.js`. Caveat of
the current reuse: BDA assignments share the mentor-assignment table, which can
interfere with the real Mentor feature (e.g. `linkedWithMentor`).

---

## 9. Verification checklist (end-to-end)

1. BDA (`Staff`/`Reviewer`) can `POST /tracker/enterprises` → no 403.
2. Admin `Funding Agreements`: pick startup → set total + tranches → shells saved
   and returned.
3. Entrepreneur creates milestone with `kpiPlan` + `planStatus=submitted`; it
   reads back with both.
4. BDA detail page shows the plan; Approve sets `planStatus=plan_approved`.
5. Admin **Disburse** allowed only after approval; sets `disbursed=true`,
   `planStatus=disbursed`.
6. Entrepreneur sees "KPI progress", saves `currentValue`/`comment`, submits for
   verification (`verificationRequested=true`).
7. BDA marks `verificationStatus`; entrepreneur + admin see the outcome pill.

---

## 10. Program-based flow (current) & auto-creating the tracker enterprise

The grant-management flow has moved from a standalone "Funding Agreements" page
to **inside the program** (Finance Officer role). The Finance Officer:

1. Creates a program and **selects startups** into it from the entrepreneur pool.
2. Per selected startup, sets **grant amount**, **assigned BDA**, **utilized**,
   and a **disbursed** flag — all inside the program.

These per-startup "members" are currently persisted **inside the program
`description`** via a marker (frontend-only, no schema change needed):

```
<clean description>

__TRACKER_STARTUPS__:[
  { "entreprenuerUuid": "...", "businessUuid": "...", "name": "...",
    "grantUsd": "200000", "bdaUuid": "...", "bdaName": "Jane",
    "utilized": "95000", "disbursed": true, "overdueReports": 0 }
]
__TRACKER_CATEGORIES__:["Ideation"]
```

The Grant Management overview (`AdminTrackerOverview`) reads programs
(`GET /tracker/programs`, i.e. `getPrograms`) and rolls these members up into the
Program-Level Financial Summary (Approved/Disbursed/Utilized/Balance/Pending).

### Option B — create the tracker enterprise on program selection (RECOMMENDED)

**Problem:** an entrepreneur selected into a program is a *program member* but has
**no tracker enterprise**, so `GET /tracker/entrepreneur/dashboard` returns
"tracker not found" and their Enterprise Growth Dashboard is empty.

**Fix:** when the Finance Officer adds a startup to a program (or sets its
grant/BDA), the backend should **create-or-update a tracker enterprise** for that
entrepreneur so the dashboards light up automatically — no BDA "Set up tracking"
step required.

Recommended trigger + behaviour:

- On program save (`PATCH/POST /tracker/programs/...`), for each member in
  `__TRACKER_STARTUPS__`, **upsert** a tracker enterprise keyed by
  `(entreprenuer_uuid, program_uuid)` with:
  - `entreprenuer_uuid` = member.entreprenuerUuid
  - `program_uuid` = the program
  - `grantUsd` = member.grantUsd
  - `assignedBda` = member.bdaName (or resolve member.bdaUuid → name/uuid)
  - `name` = member.name (or the entrepreneur's business name)
- Removing a member from the program should **not** delete historical tracker data
  (soft-unlink, or leave the enterprise intact).
- After upsert, `GET /tracker/entrepreneur/dashboard` (logged-in entrepreneur)
  must return their enterprise so the Grant Management + Coaching Sessions pages
  render. The frontend already shows a graceful "workspace is being set up"
  empty state until this returns an enterprise.

Alternatively (Option A): keep enterprise creation as the BDA's "Set up tracking"
action and just grant the `Staff`/`Reviewer` role on `POST /tracker/enterprises`
(see §1). Option B is preferred because it removes a manual step and keeps grant
ownership with Finance.

### Roles to authorize on program + enterprise routes

- `Finance` (Finance Officer) must be allowed on the program routes
  (`GET/POST/PATCH/DELETE /tracker/programs*`) and, for Option B, on the
  enterprise upsert it performs server-side.
- `Finance` reuses the admin tracker reads: `GET /tracker/admin/overview`,
  `GET /tracker/admin/businesses`, `GET /tracker/programs`.
