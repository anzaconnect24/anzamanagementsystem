# AnzaConnect M&E Platform Audit and Implementation Plan

## Audit scope and current architecture

Repository audited: `anzamanagementsystem` (React/Vite frontend).

- Frontend: React 18, React Router 6, Tailwind CSS, Axios.
- Charts: ApexCharts, Chart.js, React Chart.js 2.
- Exports: XLSX, jsPDF and jsPDF AutoTable already installed.
- Authentication: token/header-based API authentication; user and role state are exposed by `DashboardLayout` through `UserContext`.
- Current roles: `Admin`, `Staff`, `Reviewer`, `Finance`, `ME` (Monitoring & Evaluation Officer), `Mentor`, `Enterprenuer`, and `Investor`.
- Route protection: `RoleRoute` and `ProgramMemberRoute`; server-side enforcement cannot be audited in this repository.
- Backend: external API (`/api` through the Vite proxy in development and `https://api.anzaconnect.co.tz` in production). Backend source, database models and migrations are not in this repository.
- Storage: file-upload controllers and CRAT attachment APIs exist; the storage provider and secure-object authorization live in the unavailable backend.
- Notifications: API notification controller plus header dropdown exist; reminder scheduling lives in the unavailable backend.

## Existing M&E capabilities to preserve and reuse

- `CohortProgram` and `CohortMembership` API resources already separate programme participation from permanent business records and support multiple programme memberships.
- Programme setup, roster enrollment, membership status and reporting status exist in `StartupPrograms`, `ProgramStartups` and `cohort_controller`.
- Programme dashboard aggregates are served by `/cohort-programs/:uuid/dashboard` and `/analytics`.
- Results framework and indicator registry exist in `ProgramME` and `me_controller`.
- Existing M&E APIs cover overview, framework, impact/outcome/output results, indicator CRUD, actual-value submission and indicator history.
- Indicator presentation already distinguishes calculated, verified, self-reported and excluded-unverified values and includes RAG presentation.
- CRAT provides configurable assessment questions, answers, evidence, submission, review and reports.
- Grant milestones, reporting, coaching sessions and mentor reports are existing reusable workflows.
- Programme sessions, learning modules, surveys, files, PDF reports, CSV export, notifications and user activity logs already exist.

## Material gaps

1. Programme and cohort are currently represented by a combined `CohortProgram`; the required one-programme-to-many-cohorts hierarchy is not demonstrably available.
2. Participation lacks the full programme-specific assignment, baseline/endline, attendance and completion fields.
3. No auditable reusable baseline/midline/endline assessment API is exposed outside CRAT.
4. No API contract is present for periodic entrepreneur check-ins, longitudinal business metrics, jobs, funding/linkages, custom impact records or centralized evidence links.
5. Activity attendance and disaggregated delivery metrics are incomplete.
6. Verification workflows, data-quality rules, risk flags and audit events are incomplete or unavailable.
7. Portfolio/M&E dashboard aggregates and drill-down APIs are incomplete.
8. ~~Existing role names do not explicitly distinguish Programme Officer and M&E Officer.~~ Resolved: the `ME` role now owns Monitoring & Evaluation, and it was removed from Staff/Reviewer.
9. Backend source and schema are unavailable, so database safety, tenant scoping, endpoint authorization and aggregate-query performance cannot be verified.

## Backward-compatible target model

Preserve `Business` as the permanent record. Add or extend these backend entities:

- `Programme`: programme metadata, objectives, dates, donor, manager, frequency, status and configurable RAG thresholds.
- `Cohort`: belongs to Programme; dates, target, staff and status.
- `ProgrammeParticipation`: unique `(business_uuid, programme_uuid, cohort_uuid)`; enrollment, status, completion, mentor/advisor assignments, baseline/endline state, attendance and notes.
- `ResultNode` and `Indicator`: preserve current M&E records; extend calculation method, data type, disaggregation, verification, target date and configuration.
- `IndicatorValue`: append-only actual values by period with verification and evidence.
- `AssessmentTemplate`, `AssessmentQuestion`, `Assessment`, `AssessmentAnswer`.
- `PeriodicReport` and `PeriodicReportMetric`.
- `Activity`, `ActivityAttendance` and `ActivityEvaluation`.
- `BusinessMetric`: append-only business values by reporting period.
- `Goal` and `GoalMilestone` (adapt existing tracker milestones where ownership is compatible).
- `FundingLinkage`, `EmploymentRecord`, `ImpactRecord`.
- `Evidence`: polymorphic link with explicit authorization and verification fields.
- `DataQualityFlag`, `BusinessRiskFlag`, `Intervention`, `AuditEvent`, `Reminder`.

All new tables require UUID primary keys, tenant/programme scope, timestamps, actor fields, foreign keys and indexes on scope, business, programme, cohort, period, status and due-date fields. Existing records must be backfilled without deletion; legacy `CohortProgram` identifiers should be retained as aliases during transition.

## API plan

Add versioned server endpoints/services for programmes, cohorts, participation, assessments, periodic reports, activities/attendance, metrics, goals, funding, employment, impact, evidence, data quality, dashboards and reports. Dashboard totals must be database aggregates, never browser-wide record scans.

Every endpoint must enforce tenant plus role/programme/business scope server-side. Entrepreneur endpoints must derive the business identity from the authenticated user rather than accepting an arbitrary business UUID. Investor endpoints must use an explicit approved-projection service.

## Frontend plan

Reuse the existing programme-management shell and design system.

1. Extend programme setup with separate cohort management, staff, targets, frequency and indicator selection.
2. Add programme tabs: Overview, Cohorts, Participants, Results Framework, Assessments, Activities, Reports, Mentorship, Performance, Funding, Jobs, Impact, Evidence and Data Quality.
3. Add a reusable business M&E profile with the specified drill-down tabs.
4. Extend `ProgramME` rather than replacing it; add configurable calculation and verification controls.
5. Add entrepreneur check-in and evidence workflows with draft/autosave behavior.
6. Add management, programme, entrepreneur and M&E dashboards using backend aggregates.
7. Add accessible searchable/sortable/paginated tables and reuse current charts and export libraries.

## RBAC changes

- Done: the `ME` role (Monitoring & Evaluation Officer) owns the M&E framework, indicators, verification and portfolio dashboard; Admin keeps oversight, Finance and Mentor read only, and Staff/Reviewer no longer have M&E access.
- Introduce capability checks (`programme.manage`, `indicator.verify`, `report.review`, `evidence.verify`, etc.) while preserving current roles.
- Enforce capabilities in both routes/UI and backend middleware/services.

## Delivery phases

### Phase 1

Programme/cohort separation and participation migration; results framework extensions; reusable assessments; periodic reports; activities/attendance; mentorship integration; longitudinal metrics; evidence; programme/M&E dashboards; server-generated exports; reminders; authorization and tests.

### Phase 2

Goals/milestones, funding/linkages, employment, configurable impact, assessment comparison, data quality and portfolio analytics.

### Phase 3

Narrative reports, assisted analysis, benchmarking, forecasting and integrations after the underlying data is reliable.

## Test plan

Backend integration tests must cover creation, enrollment uniqueness, multi-programme businesses, assessments, reporting, calculations (including zero baseline/target), attendance, mentorship, verification, evidence access, deduplication, aggregates, filters, tenant boundaries and migration rollback safety. Frontend tests should cover permissions, forms, loading/error/empty states and drill-down navigation.

## Backend located

The local backend is at `C:\Users\Pc\New folder\anzamanagmentbackend`. It uses Express, Sequelize and MySQL and runs on port 4000; MySQL runs on port 3306. The first backward-compatible programme/participation migration has been created there. It has intentionally not been executed against the database until the local database is confirmed as a safe development database and a backup/rollback point is available.
