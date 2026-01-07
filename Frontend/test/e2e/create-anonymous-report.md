# E2E UI Manual Testing – Story PT15: Anonymous Report Submission

## Overview

This section provides manual E2E UI testing procedures for verifying the Anonymous Report functionality in the Report Form (ReportForm.tsx). It focuses on user choice, privacy protection, UI behavior, and correct public display of reports.

**Testing Date:** December 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB)

### Feature Description

The Report Creation flow allows authenticated citizens to:
Create a new report using the Report Form.
Choose whether the report is anonymous via a dedicated toggle/button.
Submit reports either:
Non-anonymous → citizen name visible publicly.
Anonymous → citizen identity hidden in public views.
Ensure the anonymity choice is stored and respected across the system.
The anonymity option is selected at issue description time and cannot be changed after submission.

## Test Suite 1: Report Form UI & Initial State

### Test Case 1.1: Anonymous Option Is Visible

Objective: Verify the anonymous option is available on the Report Form.

Steps
Login as a Citizen.
Navigate to the report creation page.
Observe the issue description section.

Expected Result
An "Anonymous Report" checkbox or toggle button is visible.
Label clearly explains the purpose (e.g., "Submit report anonymously").
Option is positioned near issue description fields.
Default state is OFF (non-anonymous).

Actual Result: [PASS]

### Test Case 1.2: Anonymous Option Default State

Objective: Verify default behavior when no action is taken.

Steps
Open the Report Form.
Do not interact with the anonymous option.
Expected Result
Anonymous option remains unchecked.
Report will be submitted as non-anonymous by default.

Actual Result: [PASS]

## Test Suite 2: Functional Behavior

### Test Case 2.1: Submit Non-Anonymous Report

Objective: Verify citizen identity is visible when anonymity is not selected.

Steps
Fill in required report fields.
Ensure Anonymous option is OFF.
Submit the report.
Navigate to the public reports list or map.
Expected Result
Report is created successfully.
Citizen name is visible in:
Public reports list
Map popup (if applicable)
Report detail view
No anonymity indicators are shown.

Actual Result: [PASS]

### Test Case 2.2: Submit Anonymous Report

Objective: Verify anonymous report submission hides citizen identity.

Steps
Fill in required report fields.
Enable Anonymous option.
Submit the report.
Navigate to the public reports list or map.

Expected Result
Report is created successfully.
Citizen name is not displayed.
Author field shows:
“Anonymous” OR
Is hidden entirely (as per UI design).
No personal identifiers are visible.

Actual Result: [PASS]

### Test Case 2.3: Anonymity Choice Is Locked After Submission

Objective: Ensure anonymity cannot be changed after report creation.

Steps
Submit a report (anonymous or non-anonymous).
Navigate to report edit page (if available).

Expected Result
Anonymous option is:
Disabled, or
Not displayed during edit.
User cannot change anonymity status post-submission.

Actual Result: [PASS]

## Test Suite 3: Privacy & Public Visibility

### Test Case 3.1: Anonymous Report in Public List

Objective: Verify privacy protection in public views.

Steps:
Submit an anonymous report.
Log out or open application as an unregistered user.
Navigate to the public reports list/map.

Expected Result
Report appears normally.
Citizen name is hidden.
No user profile links are available.

Actual Result: [PASS]

### Test Case 3.2: Anonymous Report in Citizen View

Objective: Verify report owner can still recognize their report.

Steps
Login as the citizen who created an anonymous report.
Navigate to “My Reports”.

Expected Result
Report appears in user’s personal list.
Report is marked as Anonymous.
Ownership is clear only to the creator.

Actual Result: [PASS]

## Test Suite 4: Validation & Error Handling

### Test Case 4.1: Anonymous Option Does Not Affect Validation

Objective: Ensure anonymity toggle does not interfere with form validation.

Steps
Enable anonymous option.
Leave required fields empty.
Click "Submit".

Expected Result

Standard validation errors appear.
Anonymous option does not bypass required fields.

Actual Result: [PASS]

### Test Case 4.2: Backend Error Handling

Objective: Verify system behavior on submission failure.

Steps
Enable anonymous option.
Simulate backend failure (500 error).
Submit report.

Expected Result
Error alert appears.
Report is not created.
Anonymous choice remains selected.

Actual Result: [PASS]

## Test Suite 5: Responsive Layout

### Test Case 5.1: Anonymous Option on Mobile Devices

Objective: Ensure anonymity option is usable on small screens.

Steps:
Open DevTools → Mobile View (iPhone SE / Pixel 5).
Navigate to the Report Form.

Expected Result
Anonymous option is visible and readable.
Toggle/checkbox is easily tappable.
Layout does not break or overlap.

Actual Result: [PASS]

T## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome/Firefox/Safari
- **Screen Resolutions Tested:** 1920x1080, 1366x768, 375x667 (mobile)
