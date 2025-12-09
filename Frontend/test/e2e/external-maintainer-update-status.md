# E2E UI Manual Testing – External Maintainer: Update Report Status

**Date:** December 6, 2025  
**Application Version:** 1.0.0  
**Environment:** Docker Compose (MySQL + Backend + Frontend)

---

## User Story

**As an external maintainer  
I want to update the status of a report assigned to me  
So that I can update citizens about the intervention.**

---

## Features Covered

- External Maintainer (EM) can view reports assigned to them
- EM can update report status to: `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`
- EM can optionally add a comment when resolving a report
- Citizens receive notifications when EM updates the report status
- Status changes are reflected immediately in the UI

---

## Test Suite 1: Access Control & Report Assignment

### Prerequisites
- Application running via Docker Compose
- At least 1 report with status `ASSIGNED`
- Valid credentials:
  - TOSM account (to assign reports to EM)
  - External Maintainer account
  - Citizen account (report creator)

---

### Test Case 1.1: EM Can Only Access Reports Assigned to Them

**Objective:** Verify that External Maintainers can only see and update reports where they are assigned.

**Steps:**
1. Login as **TOSM**
2. Navigate to **Reports**
3. Open a report with status `ASSIGNED`
4. Assign the report to an External Maintainer using "Assign to External Maintainer" button
5. Logout from TOSM account
6. Login as the **External Maintainer** assigned to the report
7. Navigate to **Reports**
8. Click on the assigned report

**Expected Result:**
- The External Maintainer sees the report details page
- The right panel contains an "Update Status" section
- The update panel is visible because `report.assignedEM === user.username`
- Available status options are: `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`

**Actual Result:** [`PASSED`]

---

### Test Case 1.2: EM Cannot Access Non-Assigned Reports

**Objective:** Ensure External Maintainers cannot update reports not assigned to them.

**Steps:**
1. Login as **External Maintainer**
2. Navigate to a report that is assigned to a different EM or to a TOSM staff member
3. Observe the report detail page

**Expected Result:**
- The report details are visible (read-only)
- The "Update Status" panel is **NOT** displayed
- The conditional rendering `(report.assignedStaff === user.username || report.assignedEM === user.username)` evaluates to false

**Actual Result:** [`PASSED`]

---

## Test Suite 2: Status Update Functionality

### Test Case 2.1: Update Status to IN_PROGRESS

**Objective:** Verify EM can mark a report as "In Progress" and citizen receives notification.

**Setup:**
- EM logged in
- Report with status `ASSIGNED` assigned to current EM

**Steps:**
1. Navigate to `/reports/{id}` for the assigned report
2. In the **Update Status** section, select `IN_PROGRESS` from the dropdown
3. Click **Update Status** button
4. Observe the success message
5. Logout and login as the **Citizen** who created the report
6. Click on the notification bell icon

**Expected Result:**
- Success message: "Report updated successfully."
- Report status badge changes to `IN_PROGRESS` (blue badge)
- The status dropdown resets to "Select new status..."
- Citizen receives notification:
  - Title: **"Report In Progress"**
  - Message: *"Your report '{title}' has been assigned to {EM_username} and is now in progress."*
- Notification appears in bell icon popup with correct timestamp

**Actual Result:** [`PASSED`]

---

### Test Case 2.2: Update Status to SUSPENDED

**Objective:** Verify EM can suspend a report and appropriate notification is sent.

**Setup:**
- EM logged in
- Report with status `IN_PROGRESS` assigned to current EM

**Steps:**
1. Navigate to the report detail page
2. Select `SUSPENDED` from the status dropdown
3. Click **Update Status**
4. Verify the report status updates
5. Login as the **Citizen** and check notifications

**Expected Result:**
- Report status badge changes to `SUSPENDED` (yellow/warning badge)
- Success alert appears
- Citizen receives notification:
  - Title: **"Report Suspended"**
  - Message: *"Your report '{title}' has been suspended."*

**Actual Result:** [`PASSED`]

---

### Test Case 2.3: Update Status to RESOLVED Without Comment

**Objective:** Verify EM can mark a report as resolved without adding a comment.

**Setup:**
- EM logged in
- Report with status `IN_PROGRESS` or `SUSPENDED` assigned to current EM

**Steps:**
1. Navigate to the report detail page
2. Select `RESOLVED` from the status dropdown
3. **Do not** enter any text in the optional comment field
4. Click **Update Status**

**Expected Result:**
- Report status badge changes to `RESOLVED` (green badge)
- Success message appears
- The comment field remains empty
- Citizen receives notification:
  - Title: **"Report Resolved"**
  - Message: *"Your report '{title}' has been marked as resolved."*
  - No comment text in the notification

**Actual Result:** [`PASSED`]

---

### Test Case 2.4: Update Status to RESOLVED With Comment

**Objective:** Verify EM can add an optional comment when resolving a report.

**Setup:**
- EM logged in
- Report with status `IN_PROGRESS` assigned to current EM

**Steps:**
1. Navigate to the report detail page
2. Select `RESOLVED` from the status dropdown
3. In the **Comment (Optional)** field, type: `"The pothole has been filled and the area is now safe."`
4. Click **Update Status**
5. Reload the page
6. Login as the **Citizen** and check notifications

**Expected Result:**
- Report status changes to `RESOLVED`
- Comment field appears only when `RESOLVED` is selected (conditional rendering)
- The comment is saved and visible in the report details under "Staff Comment"
- Citizen receives notification:
  - Title: **"Report Resolved"**
  - Message: *"Your report '{title}' has been marked as resolved. Comment: The pothole has been filled and the area is now safe."*

**Actual Result:** [`PASSED`]

---

## Test Suite 3: Validation & Error Handling

### Test Case 3.1: Cannot Update Without Selecting Status

**Objective:** Ensure the update button doesn't trigger API call without a status selection.

**Steps:**
1. Navigate to an assigned report as EM
2. Leave the status dropdown at "Select new status..."
3. Observe the **Update Status** button

**Expected Result:**
- The **Update Status** button is **NOT visible**
- The button only appears when `statusUpdate` is set (conditional rendering: `{statusUpdate && <Button>}`)
- No API call is made

**Actual Result:** [`PASSED`]
---

### Test Case 3.2: Status Dropdown Filters Current Status

**Objective:** Ensure the current status is not available in the dropdown.

**Setup:**
- Report with status `IN_PROGRESS` assigned to EM

**Steps:**
1. Open the report detail page
2. Click on the status dropdown
3. Observe available options

**Expected Result:**
- Dropdown contains only: `SUSPENDED` and `RESOLVED`
- `IN_PROGRESS` is **NOT** in the list
- Filter logic: `s[1] !== report.status && ["IN_PROGRESS", "SUSPENDED", "RESOLVED"].includes(s[0])`

**Actual Result:** [`PASSED`]

---

## Test Suite 4: UI/UX Behavior

### Test Case 4.1: Status Update Panel Only for Assigned EM

**Objective:** Verify the update panel appears only for the assigned External Maintainer.

**Setup:**
- Two EM accounts: `em1` and `em2`
- Report assigned to `em1`

**Steps:**
1. Login as **em1**
2. Navigate to the report → Verify update panel is visible
3. Logout
4. Login as **em2**
5. Navigate to the same report

**Expected Result:**
- For `em1`: Update Status panel is visible in the right column
- For `em2`: Update Status panel is **NOT** visible
- Conditional rendering: `((isTOSM(user) || isEM(user)) && (report.assignedStaff === user.username || report.assignedEM === user.username))`

**Actual Result:** [`PASSED`]

---

### Test Case 4.2: Comment Field Visibility Based on Status

**Objective:** Ensure the comment field only appears when status is `RESOLVED`.

**Steps:**
1. Login as EM with an assigned report
2. Select `IN_PROGRESS` from dropdown
3. Observe the form
4. Select `SUSPENDED` from dropdown
5. Observe the form
6. Select `RESOLVED` from dropdown
7. Observe the form

**Expected Result:**
- When status is `IN_PROGRESS`: No comment field visible
- When status is `SUSPENDED`: No comment field visible
- When status is `RESOLVED`: Comment field appears with label "Comment (Optional)"
- Conditional rendering: `{statusUpdate === "RESOLVED" && <Col md={6}>...}`

**Actual Result:** [`PASSED`]

---

### Test Case 4.3: Form Resets After Successful Update

**Objective:** Verify that form fields reset after a successful status update.

**Steps:**
1. Login as EM
2. Navigate to assigned report with status `ASSIGNED`
3. Select `IN_PROGRESS`
4. Click **Update Status**
5. Wait for success message
6. Observe the status dropdown and comment field

**Expected Result:**
- Status dropdown resets to "Select new status..."
- Comment field is cleared
- Code: `setStatusUpdate(""); setCommentInput("");`
- Update button disappears (because `statusUpdate` is empty)

**Actual Result:** [`PASSED`]

---

### Test Case 4.4: Visual Feedback During Update

**Objective:** Ensure loading state is displayed while updating.

**Steps:**
1. Navigate to assigned report as EM
2. Select a new status
3. Click **Update Status**
4. Observe button text during API call

**Expected Result:**
- Button text changes from "Update Status" to "Updating..."
- Button is disabled during the update (`disabled={saving}`)
- After completion, button text returns to "Update Status"

**Actual Result:** [`PASSED`]

---

## Test Suite 5: Integration with Report Details

### Test Case 5.1: External Maintainer Name Displayed for TOSM

**Objective:** Verify TOSM can see which EM is assigned to a report.

**Steps:**
1. Login as **TOSM**
2. Assign a report to an External Maintainer
3. Navigate to the report detail page

**Expected Result:**
- In the left column, under citizen information, there is a section:
  - **"External Maintainer"**
  - Displays the EM's username: `{report.assignedEM}`
- Conditional rendering: `{isTOSM(user) && report.assignedEM && <><h5>External Maintainer</h5><p>{report.assignedEM}</p></>}`

**Actual Result:** [`PASSED`]

---

### Test Case 5.2: Status Badge Reflects Current State

**Objective:** Ensure the status badge updates correctly and uses appropriate colors.

**Steps:**
1. Login as EM
2. Navigate through reports with different statuses: `ASSIGNED`, `IN_PROGRESS`, `SUSPENDED`, `RESOLVED`
3. Observe the status badge colors

**Expected Result:**
- `ASSIGNED`: Blue badge (`bg-primary`)
- `IN_PROGRESS`: Blue badge (`bg-primary`)
- `SUSPENDED`: Yellow/Warning badge (`bg-warning`)
- `RESOLVED`: Green badge (`bg-success`)

**Actual Result:** [`PASSED`]

---

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome / Firefox / Edge
- **Screen Resolutions Tested:** 1920x1080 (Desktop), 768x1024 (Tablet)

---

## Test Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 | [`PASSED`]   | EM access to assigned reports |
| 1.2 | [`PASSED`]   | EM cannot access non-assigned reports |
| 2.1 | [`PASSED`]   | Update to IN_PROGRESS |
| 2.2 | [`PASSED`]   | Update to SUSPENDED |
| 2.3 | [`PASSED`]   | Update to RESOLVED without comment |
| 2.4 | [`PASSED`]   | Update to RESOLVED with comment |
| 3.1 | [`PASSED`]   | Cannot update without status |
| 3.2 | [`PASSED`]   | Status dropdown filters |
| 4.1 | [`PASSED`]   | Panel only for assigned EM |
| 4.2 | [`PASSED`]   | Comment field visibility |
| 4.3 | [`PASSED`]   | Form reset after update |
| 4.4 | [`PASSED`]   | Loading state feedback |
| 5.1 | [`PASSED`]   | EM name displayed for TOSM |
| 5.2 | [`PASSED`]   | Status badge colors |

---