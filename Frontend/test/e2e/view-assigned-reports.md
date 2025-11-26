# E2E UI Manual Testing – PT08: TOSM Staff – View Assigned Reports

User Story

PT08 — As a technical office staff member (TOSM), I want to see the list of reports assigned to me so that I can get an overview of the maintenance to be done.

## Overview

This document provides manual E2E UI testing procedures for verifying the Staff Profile page functionality for TOSM users, specifically ensuring they can view their assigned reports.

Testing Date: November 26, 2025
Application Version: 1.0.0
Frontend: React + Vite + React-Bootstrap
Environment: Docker Compose (Backend + Frontend + MySQL)

## Feature Description

The StaffProfile.tsx page allows TOSM users to:

View personal information (name, username, role, office)

View reports assigned to them

Only reports with:

AssignedStaff = username

status = IN_PROGRESS
should appear on the list.

MPRO users cannot see this section.

## Test Suite 1: Access Control & Page Visibility

Test Case 1.1: TOSM can access Staff Profile page

Objective: Ensure TOSM users can open /profile

Steps

Login as TOSM (e.g., username: tstm1)

Click on “Profile” in the navigation bar

Observe the page

Expected Result

Page loads successfully

"Profile" title is visible

Personal information card appears

"My Reports" section appears (because TOSM user)

Actual Result:[PASS]
Test Case 1.2: MPRO cannot see “My Reports”

Objective: Ensure MPRO staff do NOT see TOSM-only content.

Steps

Login as MPRO

Navigate to /profile

Expected Result

Personal Information is visible

"My Reports" section is NOT rendered

No API call is made with staff_username filter

No empty report list is shown

Actual Result: [PASS]

## Test Suite 2: Loading and Error States

Test Case 2.1: Loading Spinner shown while fetching reports

Objective: Ensure user sees Spinner during API loading.

Steps

Login as TOSM

Add artificial delay (optional)

Open Profile page

Expected Result

React-Bootstrap spinner appears

Spinner disappears when data finishes loading

Actual Result: [PASS]
Test Case 2.2: API error displays proper error alert

Objective: Confirm that backend failures show an error banner.

Steps

Stop backend container OR simulate API failure

Reload Staff Profile page

Expected Result

Red Alert variant="danger" appears

Text: “Failed to load reports”

Actual Result: [ ] PASS [ ] FAIL

## Test Suite 3: Report List Correctness

Test Case 3.1: Only IN_PROGRESS reports assigned to the user are shown

Objective: Ensure filtering is correct.

Steps

Login as TOSM

Ensure DB contains:

Report A → IN_PROGRESS, AssignedStaff = TOSM

Report B → RESOLVED, AssignedStaff = TOSM

Report C → IN_PROGRESS, AssignedStaff = OTHER user

Open profile page

Expected Result

Only Report A appears in the list.
Report B (wrong status) → ❌ not shown
Report C (wrong staff) → ❌ not shown

Actual Result: [PASS]
Test Case 3.2: Verify correctness of each listed report

Objective: Ensure each report card displays correct fields.

Steps

Click /profile as TOSM

Inspect report items

Expected Result

Each item shows:

Title

Status (IN_PROGRESS)

Category (e.g., WSO, RSTLO, etc.)

Assigned to: username

Timestamp formatted using toLocaleString()

Actual Result:[PASS]
Test Case 3.3: No reports assigned

Objective: Confirm correct messaging when list is empty.

Steps

Login as TOSM with no assigned reports

Open /profile

Expected Result

Blue Alert variant="info" appears:
“You have no reports assigned to you.”

Actual Result: [ ] PASS [ ] FAIL

## Test Suite 4: UI Layout and Responsiveness

Test Case 4.1: Proper 2-column personal information layout (desktop)

Objective: Ensure layout renders correctly at ≥ 992px width.

Expected Result

Left column → Name, Username

Right column → Role, Office

Card is well-spaced and readable

Actual Result: [PASS]
Test Case 4.2: Responsive behavior on mobile

Steps

Open DevTools → Mobile view

Load /profile

Expected Result

All content stacks vertically

No horizontal scrolling

Report items scale correctly

Actual Result: [PASS]

## Known Limitations

Only IN_PROGRESS reports are shown — by design

No sorting or pagination yet

No clicking-through to report details from profile

No real-time updates (requires manual reload)

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome/Firefox/Safari [specify version]
- **Screen Resolutions Tested:** 1920x1080, 1366x768, 375x667 (mobile)
