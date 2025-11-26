# E2E Manual UI Testing – Story 5: Citizen Creates a Report

This section documents the comprehensive end-to-end manual UI testing performed for Story 5 (Create Report) of the Participium application.

## Overview

Story: PT05 — As a Citizen, I want to create a report so I can notify the municipality about issues.
Testing Date: November 26, 2025
Application Version: 1.0.0
Environment: Docker Compose (Backend + Frontend + DB)

This test suite verifies that Citizens can successfully create reports through the UI and validates all frontend-backend interactions involved in the process.

### Test Suite 1: Create Report Access

✔ Test Case 1.1 — Access Denied for Unauthenticated Users

Steps:

Open http://localhost:5173

Ensure not logged in

Click anywhere on the map

Expected:

“New Report” button does not appear

User cannot access the form

Result: PASS

### Test Case 1.2 — Access Granted for Authenticated Citizens

Steps:

Login as Citizen

Click inside Turin boundaries on the map

Click New Report button

Expected:

Report creation form opens

Coordinates are autocompleted

User can proceed

Result: PASS

## Test Suite 2: Report Form Validation

### Test Case 2.1 — Form Loads Correctly

Form shows:

Title

Description

Category

Anonymous toggle

Photo upload (1–3 files)

Submit button

Result: PASS

### Test Case 2.2 — Required Field Validation

Submitting incomplete form triggers validation.

Expected Errors:

Missing fields → “Missing required fields”

No photos → “At least one photo is required”

Result: PASS

### Test Case 2.3 — Photo Upload Rules

Accepts JPG / JPEG / PNG

Minimum 1 file, maximum 3

5MB file rejected

Invalid format rejected

Result: PASS

# Test Suite 3: Form Submission

### Test Case 3.1 — Successful Report Creation

Steps:

Fill valid form

Upload 1–3 photos

Submit

Backend Expected:
POST /api/v1/reports returns 201 Created

Frontend Expected:

Success message

Form closes

Map updates (pending reports hidden)

Result: PASS

### Test Case 3.2 — Backend Error Handling

Errors tested:

Missing fields

Missing photos

Invalid category

Invalid file type

Backend responds:
Appropriate 400 Bad Request messages.

Result: PASS

## Test Suite 4: Map Integration

### Test Case 4.1 — Pending Report Not Visible

Expected:

Newly created report is NOT visible on map

Pending reports are intentionally hidden

Result: PASS

### Test Case 4.2 — Report Appears After Status Update (MPRO/TOSM)

Steps:

Update report to ASSIGNED / IN_PROGRESS / RESOLVED / SUSPENDED

Refresh map as Citizen

Expected:

Report becomes visible

Added to cluster layer

Result: PASS

## Test Suite 5: UI/UX Behavior

### Test Case 5.1 — Responsive Design

Form becomes full screen on mobile

All fields remain accessible

Map interaction unaffected

Result: PASS

### Test Case 5.2 — Error Message Visibility

Errors shown below fields

Errors disappear when corrected

Submit disabled until valid

Result: PASS

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome/Firefox/Safari [specify version]
- **Screen Resolutions Tested:** 1920x1080, 1366x768, 375x667 (mobile)
