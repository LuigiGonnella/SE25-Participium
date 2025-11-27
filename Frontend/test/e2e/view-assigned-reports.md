# E2E UI Manual Testing – PT06&PT08: MPRO&TOSM Staff – View (Assigned) Reports

## User Story

PT06 - As a municipal public relations officer (MPRO), I want to review and approve or reject reports so that only valid reports are processed further.
PT08 — As a technical office staff member (TOSM), I want to see and filter the list of reports assigned to me so that I can get an overview of the maintenance to be done.

---

## Overview

This document provides **manual E2E UI testing procedures** for verifying the **Report List** and **Report Detail** pages for staff users, with a focus on MPRO and TOSM behavior.

- **Main components under test:**
  - `Frontend/src/components/ReportListPage.tsx`
  - `Frontend/src/components/ReportDetailPage.tsx`
- **Main routes:**
  - `/reports`
  - `/reports/{id}`
- **Testing Date:** November 26, 2025
- **Application Version:** 1.0.0
- **Frontend:** React + Vite + React-Bootstrap + design-react-kit
- **Environment:** Docker Compose (Backend + Frontend + DB)

### High-level behavior from code

#### `ReportListPage.tsx`

- Both **MPRO** and **TOSM** staff can access `/reports`.
- The page shows:
  - A **status filter** `<select>`.
  - For **TOSM only**, an `Assigned to me` checkbox.
  - A **list of reports** fetched via `API.getReports(filters)`.
- Status options depend on the staff role:
  - **MPRO**: `PENDING`, `ASSIGNED`, `REJECTED`.
  - **TOSM**: `ASSIGNED`, `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`.
- For TOSM, the backend filter also includes the staff member's **office category** derived from `user.officeName`.
- The `Assigned to me` checkbox, when checked, filters on the client side to `report.assignedStaff === user.username`.
- A **loading spinner** is shown while fetching.
- On errors, a red `Alert` is shown with error text.
- If no reports match the current filters, text `No reports found.` is shown.
- For TOSM, some `ASSIGNED` reports with no `assignedStaff` can show an **`Assign To Me`** button that calls `API.assignReportToSelf`.

#### `ReportDetailPage.tsx`

- Loads a single report by `id` from the route: `API.getReportById(Number(id))`.
- Shows a detailed view with title, timestamp, status (as colored badge), category, description, location (reverse geocoded when possible), citizen, photos carousel.
- Shows a **TOSM panel** (status update + chat) when:
  - `user` is TOSM **and**
  - `report.assignedStaff === user.username`.
- Shows an **MPRO panel** (manage report) when:
  - `user` is MPRO **and**
  - `report.status === PENDING`.
- TOSM can:
  - Update status to `IN_PROGRESS`, `SUSPENDED`, `RESOLVED` via `handleStatusUpdate` / `API.updateReport`.
  - Optionally add a comment when resolving.
  - Use a **chat** with citizen via `API.createMessage` and `API.getAllMessages`.
- MPRO can:
  - Switch between **Assign** and **Reject** actions.
  - When **Assign** is active, select a new `category` and confirm.
  - When **Reject** is active, input a mandatory comment and confirm.

---

## Test Suite 1: Access Control & Page Visibility (ReportListPage)

### Test Case 1.1: TOSM can access Report List page

**Objective:** Ensure TOSM users can open `/reports` and see the report list UI, including the `Assigned to me` filter.

**Steps:**
1. Login as **TOSM** (e.g., username: `tstm1`).
2. Navigate to `/reports` from the main navigation.
3. Observe the rendered page.

**Expected Result (from code):**
- `<h2 className="mb-4">Reports</h2>` is visible at the top.
- A **status filter** `<select>` is visible with:
  - First option `All statuses`.
  - Options: `ASSIGNED`, `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`.
- The `Assigned to me` checkbox section is rendered, because `isTOSM(user)` is true.
- A list of reports appears once loading finishes, restricted to the TOSM office category (via `filters.category`).

**Actual Result:** `[PASS]`

---

### Test Case 1.2: MPRO does not see TOSM-specific controls

**Objective:** Ensure MPRO staff see the report list but do **not** see the `Assigned to me` checkbox or TOSM-only assign button.

**Steps:**
1. Login as **MPRO**.
2. Navigate to `/reports`.

**Expected Result (from code):**
- Title `Reports` is visible.
- Status `<select>` shows options: `All statuses`, `PENDING`, `ASSIGNED`, `REJECTED` (from `getStatusOptions()` for MPRO).
- The `Assigned to me` checkbox is **not rendered** because that JSX is inside `{ isTOSM(user) && ... }`.
- Report items render inside the `isMPRO(user)` branch, each wrapped in a `Link` to `/reports/{id}`.
- No `Assign To Me` button is present in the MPRO branch.

**Actual Result:** `[PASS]`

---

## Test Suite 2: Loading and Error States

### Test Case 2.1: Loading Spinner shown while fetching reports

**Objective:** Ensure user sees a loading spinner during API loading.

**Steps:**
1. Login as **TOSM**.
2. (Optional) Introduce artificial delay in backend for the `/reports` API.
3. Navigate to `/reports`.

**Expected Result (from code):**
- `loading` is initially `true`.
- While `loading === true`, the component renders:
  - A centered `<Spinner animation="border" />` inside a `div.text-center.mt-5`.
- Once the API call completes, `setLoading(false)` is invoked in the `finally` block, and the spinner disappears, revealing the list or error state.

**Actual Result:** `[PASS]`

---

### Test Case 2.2: API error displays proper error alert

**Objective:** Confirm that backend failures show an error banner.

**Steps:**
1. Stop the backend container **or** force `API.getReports` to fail.
2. Navigate to `/reports` as TOSM.

**Expected Result (from code):**
- `catch (err)` in `loadReports` sets:
  - `setError(err.details || "Failed to load reports")`.
- After `loading` becomes `false`, JSX shows an error alert when `!loading && error`:
  - `<Alert variant="danger">{error}</Alert>`.
- No report list is rendered when the API call fails.

**Actual Result:** `[PASS]`

---

## Test Suite 3: Report List Correctness (TOSM)

### Test Case 3.1: Status and office filtering for TOSM

**Objective:** Ensure TOSM only sees reports for their office category and only with statuses that are allowed for TOSM.

**Setup:**
- TOSM user `tstm1` with `officeName = "Road Signs and Traffic Lights Office"` → `getOfficeCategoryFromName` returns `"RSTLO"`.
- Database contains at least these reports:
  - **Report A** → `category = RSTLO`, `status = ASSIGNED`.
  - **Report B** → `category = RSTLO`, `status = IN_PROGRESS`.
  - **Report C** → `category = WSO`,  `status = IN_PROGRESS`.
  - **Report D** → `category = RSTLO`, `status = PENDING`.

**Steps:**
1. Login as `tstm1` (TOSM).
2. Go to `/reports`.
3. Leave the status filter on `All statuses`.

**Expected Result (from code):**
- Backend request is made with `filters.category = "RSTLO"` and no `status` filter → backend should return only `RSTLO` reports.
- On the client, the final list is `reports.filter(...)` where:
  - `getStatusOptions().map(s => s.label)` for TOSM is `["ASSIGNED", "IN_PROGRESS", "SUSPENDED", "RESOLVED"]`.
  - Each report is kept only if its `status` is one of those labels.
- Therefore:
  - **Report A** (RSTLO, ASSIGNED) → **shown**.
  - **Report B** (RSTLO, IN_PROGRESS) → **shown**.
  - **Report C** (WSO, IN_PROGRESS) → should not even come from backend (filtered by category).
  - **Report D** (RSTLO, PENDING) → would be filtered out client-side, because `PENDING` is not in TOSM status options.

**Actual Result:** `[PASS]`

---

### Test Case 3.2: "Assigned to me" checkbox behavior (TOSM)

**Objective:** Ensure the `Assigned to me` checkbox correctly filters reports by `assignedStaff`.

**Setup:**
- Same TOSM user `tstm1` with `officeName` mapping to some category.
- Backend reports (for that category) include:
  - **Report A** → `status = IN_PROGRESS`, `assignedStaff = "tstm1"`.
  - **Report B** → `status = IN_PROGRESS`, `assignedStaff = "otherUser"`.

**Steps:**
1. Login as `tstm1`.
2. Navigate to `/reports`.
3. Ensure status filter is on `All statuses`.
4. Check the `Assigned to me` checkbox.

**Expected Result (from code):**
- State `assignedToMe` becomes `true`.
- Rendered list uses:
  ```ts
  reports.filter(
    r => (!assignedToMe || r.assignedStaff === user.username)
      && getStatusOptions().map(s => s.label).includes(r.status)
  )
  ```
- With `assignedToMe === true` and `user.username === "tstm1"`:
  - **Report A** satisfies `r.assignedStaff === "tstm1"` → **shown**.
  - **Report B** does not satisfy the condition → **hidden**.

**Actual Result:** `[PASS]`

---

### Test Case 3.3: "Assign To Me" button visibility and behavior (TOSM)

**Objective:** Verify when TOSM can assign a report to themselves and how the UI behaves when doing so.

**Setup:**
- Logged in as TOSM `tstm1`.
- Backend returns, for the correct office category:
  - **Report A** → `status = ASSIGNED`, `assignedStaff = null`.
  - **Report B** → `status = ASSIGNED`, `assignedStaff = "otherUser"`.

**Steps:**
1. Login as `tstm1`.
2. Navigate to `/reports`.
3. Find **Report A** and **Report B** in the list.
4. Click the `Assign To Me` button on **Report A**.

**Expected Result (from code):**
- Button visibility is controlled by `canAssign(report)`:
  - `isTOSM(user)` is `true`.
  - `report.status === ReportStatus.ASSIGNED`.
  - `!report.assignedStaff` must be `true`.
- Therefore:
  - **Report A** → `Assign To Me` button is **visible**.
  - **Report B** (already has `assignedStaff`) → `Assign To Me` button is **hidden**.
- On click:
  - `assigningId` is set to `reportId`.
  - Button becomes disabled and label changes to `Assigning...` (based on `assigningId === r.id`).
  - `API.assignReportToSelf(reportId)` is called.
  - After success, `loadReports()` is called again, refreshing the list.
  - When refreshed, if backend updated `assignedStaff` or status, `canAssign` likely becomes `false`, so the button disappears.

**Actual Result:** `[PASS]`

---

### Test Case 3.4: No reports matching filters

**Objective:** Confirm correct messaging when no reports match the current filters (status and/or `Assigned to me`).

**Setup:**
- Login as TOSM.
- Choose a combination of filters that yields zero matching reports, e.g.:
  - Status `RESOLVED` when there are no `RESOLVED` reports for that office.
  - Or check `Assigned to me` when no report has `assignedStaff = user.username`.

**Steps:**
1. Navigate to `/reports`.
2. Set the status filter to a value with no matching reports.
3. (Optional) Check `Assigned to me`.

**Expected Result (from code):**
- Final condition for the empty state is:
  ```ts
  !loading &&
  reports.filter(
    r => (!assignedToMe || r.assignedStaff === user.username) &&
         getStatusOptions().map(s => s.label).includes(r.status)
  ).length === 0
  ```
- When this is `true`, JSX renders:
  - `<p className="text-muted">No reports found.</p>`.
- No list items are shown.

**Actual Result:** `[PASS]`

---

## Test Suite 4: MPRO Report List Behavior

### Test Case 4.1: MPRO status filtering

**Objective:** Ensure MPRO sees only statuses relevant to their workflow and that the filter works as intended.

**Setup:**
- Login as MPRO.
- Backend contains reports with following statuses:
  - `PENDING`, `ASSIGNED`, `REJECTED`, `IN_PROGRESS`, `RESOLVED`.

**Steps:**
1. Navigate to `/reports` as MPRO.
2. Observe the status filter options.
3. Choose `PENDING` in the status filter.

**Expected Result (from code):**
- `getStatusOptions()` for MPRO returns statuses: `PENDING`, `ASSIGNED`, `REJECTED`.
- When `statusFilter === "PENDING"`, `loadReports()` sends `filters.status = "PENDING"` to `API.getReports`.
- The rendered list is further filtered to keep only reports where `r.status` is one of the labels from `getStatusOptions()` → `IN_PROGRESS` and `RESOLVED` will never appear for MPRO.

**Actual Result:** `[PASS]`

---

### Test Case 4.2: MPRO navigation to report details

**Objective:** Ensure MPRO can navigate from the list to individual report details.

**Steps:**
1. Login as MPRO.
2. Navigate to `/reports`.
3. Click on any report in the list.

**Expected Result (from code):**
- Each MPRO-visible report item is wrapped in a `Link` with `to={"/reports/" + r.id}`.
- Clicking the item triggers client-side navigation to `/reports/{id}`.
- No `Assign To Me` button is shown for MPRO.

**Actual Result:** `[PASS]`

---

## Test Suite 5: UI Layout and Responsiveness

### Test Case 5.1: Desktop layout

**Objective:** Ensure layout renders correctly on desktop (≥ 992px width).

**Expected Result (from code and Bootstrap classes):**
- Outer wrapper is `<div className="container py-4">` → responsive centered container with vertical padding.
- Filter section uses `className="mb-4 d-flex"` with `gap: "1rem"` inline style, so select and checkbox (for TOSM) sit in a row with spacing between them.
- Report list uses `list-group` + `list-group-item p-3 d-flex justify-content-between align-items-center`:
  - Left side: Title, Status, Category, `Assigned to`.
  - Right side: timestamp, and, for TOSM, optional `Assign To Me` button stacked in a column.
- Text is clearly readable with no overlaps on standard desktop resolutions.

**Actual Result:** `[PASS]`

---

### Test Case 5.2: Responsive behavior on mobile

**Objective:** Verify that `ReportListPage.tsx` behaves reasonably on smaller screens.

**Steps:**
1. Open browser DevTools and enable mobile device emulation (e.g., iPhone 12, 375x812).
2. Login as TOSM.
3. Navigate to `/reports`.

**Expected Result (from code + Bootstrap defaults):**
- `.container` automatically adjusts width for small screens (Bootstrap responsive container).
- The filter `div.mb-4.d-flex` with `gap: 1rem` allows controls to wrap if needed; on very narrow screens, the status `<select>` and `Assigned to me` checkbox may wrap to multiple lines but remain usable.
- Each `.list-group-item` uses flex layout, so content (titles, timestamps, button) stacks or wraps without horizontal scroll on typical mobile widths.
- No fixed widths are imposed on list items, only `maxWidth: "250px"` on the status filter select, which still fits on mobile.

**Actual Result:** `[PASS]`

---

## Known Limitations (from `ReportListPage.tsx`)

- There is **no separate "My Reports" page**: TOSM uses a single list with an `Assigned to me` checkbox.
- TOSM cannot see `PENDING` or `REJECTED` reports from this page; these statuses do not appear in their status filter.
- MPRO cannot see `IN_PROGRESS`, `SUSPENDED`, or `RESOLVED` statuses via this list; their filter is limited to `PENDING`, `ASSIGNED`, `REJECTED`.
- No pagination or server-side sorting is implemented in `ReportListPage.tsx`.
- The empty state message is generic: `No reports found.` rather than a role-specific message.
- Real-time updates are not supported; the list refreshes only when filters change or after `Assign To Me` calls `loadReports()`.

---

## Test Suite 6: Report Detail – Common Behavior

> These tests apply regardless of MPRO/TOSM role (as long as a valid staff `user` is provided).

### Test Case 6.1: Report detail basic information

**Objective:** Verify that `ReportDetailPage.tsx` shows the main report information.

**Steps:**
1. Login as **MPRO** or **TOSM**.
2. From `/reports`, click on any report item to navigate to `/reports/{id}`.

**Expected Result (from code):**
- The page renders inside `<div className="container-fluid py-4">`.
- Header section shows:
  - Title (`report.title`).
  - Timestamp formatted with `new Date(report.timestamp).toLocaleString()`.
- Left column (`col-md-8` or `col-12` depending on role/assignment) shows:
  - **Status** with a colored Bootstrap badge using report status:
    - `PENDING` → `bg-info`
    - `ASSIGNED` or `IN_PROGRESS` → `bg-primary`
    - `REJECTED` → `bg-danger`
    - `SUSPENDED` → `bg-warning`
    - `RESOLVED` → `bg-success`
  - **Category** (`report.category`).
  - **Description** (`report.description`).
  - **Location** text:
    - A human-readable street name if reverse geocoding succeeded, otherwise `Unknown location`.
    - Coordinates in a smaller muted text `(lat, lng)`.
  - **Citizen**:
    - `report.citizenUsername` when available.
    - Otherwise italic `Unknown`.
  - **Photos**: a `Carousel` with each image loaded from `${STATIC_URL}${photo}`.

**Actual Result:** `[PASS]`

### Test Case 6.2: Loading and error states

**Objective:** Ensure generic loading and error behaviors work.

**Steps:**
1. Temporarily slow down or stop the backend for `/reports/{id}`.
2. Navigate to `/reports/{id}` as staff.

**Expected Result (from code):**
- Initially, while `loading === true`, the component returns:
  - `<p className="p-5 text-center">Loading...</p>`.
- If `API.getReportById` throws and no report is set:
  - `error` is set (e.g. `err.details` or `"Failed to load report"`).
  - Component returns `<p className="p-5 text-danger text-center">{error}</p>`.
- If no report is found at all (e.g., 404 case mapped to null):
  - Returns `<p className="p-5 text-center">Report not found</p>`.

**Actual Result:** `[PASS]`

---

## Test Suite 7: Report Detail – MPRO Behavior

These tests cover **MPRO**-specific logic in `ReportDetailPage.tsx` when `report.status === PENDING`.

### Test Case 7.1: MPRO sees Manage Report panel only for PENDING reports

**Objective:** Ensure MPRO sees the management panel only when the report is pending.

**Setup:**
- Logged in as `mpro1` (role MPRO).
- Two reports in DB:
  - Report P → `status = PENDING`.
  - Report A → `status = ASSIGNED`.

**Steps:**
1. Open `/reports/{id_P}` (PENDING report).
2. Open `/reports/{id_A}` (ASSIGNED report).

**Expected Result (from code):**
- For Report P:
  - Right column (`col-md-4`) contains a card with title `Manage Report`.
  - Success and error `<div className="alert ...">` areas exist inside this card.
- For Report A:
  - The MPRO manage card is **not rendered** because JSX is wrapped in:
    - `{user && isMPRO(user) && report.status === ReportStatus.PENDING && (...)}`.

**Actual Result:** `[PASS]`

### Test Case 7.2: MPRO toggles between Assign and Reject actions

**Objective:** Verify the two large buttons correctly switch between assigning and rejecting modes.

**Setup:**
- Logged in as MPRO.
- Load a report with `status = PENDING`.

**Steps:**
1. On `/reports/{id}`, look at the `Manage Report` card.
2. Observe the two big buttons: `Assign` (green) and `Reject` (red).
3. Click `Assign` once, then again.
4. Click `Reject` once, then again.

**Expected Result (from code):**
- Internal state `statusInput` is toggled:
  - When clicking `Assign`:
    - If `statusInput !== ReportStatus.ASSIGNED` → `statusInput` becomes `ASSIGNED` and `commentInput` is cleared.
    - If already `ASSIGNED` → `statusInput` and `categoryInput` are cleared.
  - When clicking `Reject`:
    - If `statusInput !== ReportStatus.REJECTED` → `statusInput` becomes `REJECTED` and `categoryInput` is cleared.
    - If already `REJECTED` → `statusInput` and `commentInput` are cleared.
- Visually:
  - Active button has normal opacity (no `opacity-50`).
  - Inactive button has `opacity-50` class applied.

**Actual Result:** `[PASS]`

### Test Case 7.3: MPRO assigns a report

**Objective:** Verify assign flow and payload when MPRO assigns a report.

**Setup:**
- MPRO user, `report.status = PENDING`.

**Steps:**
1. On `/reports/{id}`, click `Assign`.
2. In the **Assign** form:
   - Choose a new category from the `<select>`.
   - Click `Confirm`.

**Expected Result (from code):**
- `handleUpdate` is triggered with:
  - `payload.status = ReportStatus.ASSIGNED`.
  - `payload.category = categoryInput` only if a category was selected.
- `API.updateReport(report.id, payload, user.role)` is called.
- On success:
  - `setReport(updated)` refreshes the report object.
  - `success` message `Report updated successfully.` is displayed.
  - `statusInput`, `categoryInput`, `commentInput` are reset.

**Actual Result:** `[PASS]`

### Test Case 7.4: MPRO rejects a report with mandatory comment

**Objective:** Verify reject flow and mandatory comment rule.

**Setup:**
- MPRO user, `report.status = PENDING`.

**Steps:**
1. On `/reports/{id}`, click `Reject`.
2. In the **Reject** form:
   - Leave the `Reason` textarea empty.
   - Click `Confirm`.
3. Then, fill a comment and submit again.

**Expected Result (from code):**
- When submitting without comment:
  - `statusInput === ReportStatus.REJECTED` branch is used.
  - If `!commentInput.trim()`:
    - `setError("Comment is required when rejecting a report")`.
    - `setSaving(false)`.
    - API is **not** called.
- When submitting with a comment:
  - `payload.status = ReportStatus.REJECTED`.
  - `payload.comment = commentInput.trim()`.
  - `API.updateReport` is called and `report` is updated.
  - `success` message is shown; `statusInput`, `categoryInput`, `commentInput` are cleared.

**Actual Result:** `[PASS]`

---

## Test Suite 8: Report Detail – TOSM Behavior

These tests cover **TOSM**-specific logic in `ReportDetailPage.tsx` when the TOSM is the **assigned staff**.

### Test Case 8.1: TOSM sees status update + chat only when assigned

**Objective:** Ensure TOSM sees the right column chat and status update section only when they are assigned to the report.

**Setup:**
- TOSM user `tstm1`.
- Two reports:
  - Report X → `status = ASSIGNED`, `assignedStaff = "tstm1"`.
  - Report Y → `status = ASSIGNED`, `assignedStaff = "otherUser"`.

**Steps:**
1. Open `/reports/{id_X}` as `tstm1`.
2. Open `/reports/{id_Y}` as `tstm1`.

**Expected Result (from code):**
- Left column width:
  - If `(isTOSM(user) && report.assignedStaff === user.username) || report.status === ReportStatus.PENDING`:
    - CSS class is `col-md-8` (indicating right column present).
  - Otherwise `col-12`.
- TOSM status update section (inside left card bottom) is rendered only when:
  - `isTOSM(user)` and `report.assignedStaff === user.username`.
- Right column **Messages** card is rendered only when:
  - `user && isTOSM(user) && report.assignedStaff === user.username`.
- Therefore:
  - Report X → both status update section and chat card visible.
  - Report Y → full width `col-12` and no TOSM tools visible.

**Actual Result:** `[PASS]`

### Test Case 8.2: TOSM status update options and flow

**Objective:** Verify that TOSM can update the status from the detail page.

**Setup:**
- TOSM `tstm1`, `assignedStaff = "tstm1"`.

**Steps:**
1. Open `/reports/{id}`.
2. In the **Update Status** form:
   - Open the `<select>` dropdown.
   - Choose a status different from the current one (among `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`).
3. Click `Update Status`.

**Expected Result (from code):**
- `<Form.Select>` is populated with:
  - `Object.entries(ReportStatus)` filtered by:
    - Exclude the current `report.status`.
    - Include only keys in `["IN_PROGRESS", "SUSPENDED", "RESOLVED"]`.
- When `statusUpdate` is set and `Update Status` button is clicked:
  - `handleStatusUpdate` runs.
  - If `!statusUpdate || !report || !isStaff(user)` → early return (no update).
  - Otherwise:
    - `const data: any = { status: statusUpdate }`.
    - If `statusUpdate === "RESOLVED"` and `commentInput` is set:
      - `data.comment = commentInput`.
    - Calls `API.updateReport(report.id, data, user.role)`.
    - Updates `report` with returned data and clears `statusUpdate` and `commentInput`.

**Actual Result:** `[PASS]`

### Test Case 8.3: TOSM messages chat behavior

**Objective:** Ensure TOSM can send messages and see message list update.

**Setup:**
- TOSM `tstm1` assigned to the report.
- Backend exposes:
  - `API.getAllMessages(reportId)` → returns list of messages.
  - `API.createMessage(reportId, message)` → creates a new message.

**Steps:**
1. Open `/reports/{id}` as `tstm1`.
2. Scroll to **Messages** card on the right.
3. Type a message into the textarea and click `Send Message`.

**Expected Result (from code):**
- On page load:
  - `loadingMessages` is `true` until `API.getAllMessages` resolves.
  - Then `messages` is populated and `loadingMessages` is set to `false`.
- Chat list area:
  - If `loadingMessages` → shows `Loading messages...`.
  - If `messages.length === 0` → shows `No messages yet. Start the conversation!`.
  - Else → renders messages in `d-flex flex-column-reverse` order.
- On sending message:
  - `handleMessage` prevents default, checks `report` and `isTOSM(user)`.
  - Calls `API.createMessage(report.id, messageInput)`.
  - Clears `messageInput`.
  - Reloads messages via `API.getAllMessages(report.id)` and updates `messages`.
  - Refreshes report via `API.getReportById(report.id)`.
  - During send: `messageLoading === true`, button text changes to `Sending...`, textarea disabled.
  - On error: `messageError` is set and shown as a red alert.

**Actual Result:** `[PASS]`

---

## Test Suite 9: End-to-End Flow Scenarios

### Test Case 9.1: MPRO assigns a pending report and TOSM processes it

**Objective:** Validate the full flow from MPRO assigning a report to TOSM updating status.

**Setup:**
- Report initially `PENDING`, no `assignedStaff`.
- MPRO user `mpro1` and TOSM user `tstm1` with matching office category for the report after assignment.

**Steps:**
1. As **MPRO**:
   - Go to `/reports/{id}`.
   - Use `Manage Report` → `Assign` with correct category → `Confirm`.
2. As **TOSM** `tstm1`:
   - Go to `/reports`.
   - Use status filter and `Assigned to me` as needed to find the report.
   - Open `/reports/{id}`.
   - Use **Update Status** to set `IN_PROGRESS`.
   - Optionally send a message to the citizen.

**Expected Result (from code):**
- After step 1, report status becomes `ASSIGNED`, category possibly updated.
- On `/reports` as TOSM, report appears (category filter + allowed statuses).
- `Assigned to me` and `Assign To Me` behavior are consistent with list page logic:
  - If backend sets `assignedStaff` when assigning, the TOSM can see it as assigned.
- On detail page as TOSM, status update and messages behave as described in Suites 8 and 6.

**Actual Result:** `[PASS]`

---

## Known Limitations (from current implementation)

- There is **no separate "My Reports" page**: TOSM uses a single list with an `Assigned to me` checkbox in `ReportListPage`.
- TOSM cannot see `PENDING` or `REJECTED` reports from the list page; these statuses are only visible to MPRO.
- MPRO cannot see `IN_PROGRESS`, `SUSPENDED`, or `RESOLVED` on the list; these statuses are only visible to TOSM.
- `Assign To Me` button on the list page only appears for TOSM when `status === ASSIGNED` and `assignedStaff` is empty; exact backend behavior after assignment depends on API implementation.
- `ReportDetailPage` reverse geocoding relies on an external OpenStreetMap API (`nominatim`); in test environments without internet, location will fall back to `Unknown location`.
- No pagination or advanced filtering is implemented in `ReportListPage`.
- Real-time updates are not supported; lists and detail pages refresh data only on navigation, filter changes, or after specific actions (`Assign To Me`, status updates, messages).

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome/Firefox/Safari [specify version]
- **Screen Resolutions Tested:** 1920x1080, 1366x768, 375x667 (mobile)
