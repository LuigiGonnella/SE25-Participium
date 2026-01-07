# E2E UI Manual Testing – Story PT28: Public Approved Reports Map

This section provides manual E2E UI testing procedures for verifying the Public Reports Map functionality for unregistered users. It focuses on map rendering, approved report visibility, interactivity and system feedback.

## Overview

Story PT28 — As an unregistered user, I want to see approved reports on an interactive map so that I can know about issues in my area and beyond.

**Testing Date:** January 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB)

## Feature Description

The Public Reports Map allows unregistered (guest) users to:

1. Access the application without authentication.
2. View only approved reports displayed as markers on an interactive map.
3. Interact with map markers to view report details.
4. Navigate and explore reports across different geographic areas.

## Test Suite 1: Page Access & Initial State

### Test Case 1.1: Public Map Page Loads Successfully

**Objective:** Verify that an unregistered user can access the map page.

Steps

Open the application in an incognito/private browser window.

Ensure the user is not logged in.

Navigate to the public map route (e.g., /map or landing page).

Expected Result

Map component loads without authentication.

No login prompt or redirect is triggered.

Page renders without console errors.

Map is centered on a default location (city/country level).

Actual Result: [PASS]

### Test Case 1.2: Initial Map State Displays Approved Reports Only

Objective: Verify only approved reports are visible to unregistered users.

Steps

Open the public map page.

Observe the visible map markers.

Compare with backend data (or seeded test data).

Expected Result

Only reports with status = APPROVED appear as markers.

Reports with PENDING / REJECTED / DRAFT status are not visible.

Marker count matches approved reports returned by API.

Actual Result: [PASS]

## Test Suite 2: Map Interactivity

### Test Case 2.1: Map Navigation (Pan & Zoom)

Objective: Ensure the map supports basic navigation.

Steps

Click and drag the map to pan across locations.

Use mouse scroll or zoom controls to zoom in and out.

Expected Result

Map pans smoothly without lag.

Zoom levels update correctly.

Markers reposition correctly during navigation.

No visual glitches occur.

Actual Result: [PASS]

### Test Case 2.2: Marker Interaction & Report Preview

Objective: Verify report details are accessible from markers.

Steps

Click on an approved report marker.

Observe the popup/modal/card that appears.

Expected Result

Marker click opens a report preview.

Preview displays:

Report title

Category

Description (truncated if long)

Location information

No edit or action buttons are visible (read-only mode).

Actual Result: [PASS]

### Test Case 2.3: Multiple Markers in Same Area

Objective: Verify handling of closely located reports.

Steps

Zoom into an area with multiple reports.

Click on overlapping or clustered markers (if clustering is enabled).

Expected Result

Markers separate clearly at higher zoom levels OR

Cluster expands to show individual reports.

All approved reports remain accessible.

Actual Result: [PASS]

## Test Suite 3: Data Handling & Restrictions

### Test Case 3.1: Guest User Permissions

Objective: Ensure unregistered users have read-only access.

Steps

Click on a report marker.

Inspect available UI actions.

Expected Result

No buttons for:

Edit

Delete

Comment

Upvote / Downvote (if exists for citizens)

UI clearly presents information-only view.

Actual Result: [PASS]

### Test Case 3.2: API Authorization Handling

Objective: Ensure backend enforces access rules.

Steps

Open browser DevTools → Network tab.

Reload the map page.

Inspect the API request fetching reports.

Expected Result

Public API endpoint is called (no Authorization header).

API response contains only approved reports.

No 401 or 403 errors occur.

Actual Result: [PASS]

## Test Suite 4: Error Handling

### Test Case 4.1: Backend Unavailable

Objective: Verify graceful handling of API failure.

Steps

Stop the backend service or simulate a 500 error.

Reload the public map page.

Expected Result

User-friendly error message appears (e.g., "Unable to load reports").

Map container does not crash.

No infinite loading spinner.

Actual Result: [PASS]

### Test Case 4.2: No Approved Reports Available

Objective: Verify behavior when no data is returned.

Steps

Ensure database contains zero approved reports.

Load the public map page.

Expected Result

Map still loads successfully.

Informational message appears (e.g., "No reports available at the moment").

No markers are shown.

Actual Result: [PASS]

## Test Suite 5: Responsive Layout

### Test Case 5.1: Mobile View Responsiveness

Objective: Ensure map usability on small screens.

Steps

Open DevTools → Mobile View (iPhone SE / Pixel 5).

Interact with the map.

Expected Result

Map occupies available viewport correctly.

Markers are tappable.

Popups remain readable.

No horizontal scrolling.

Actual Result: [PASS]

Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome
- **Screen Resolutions Tested:** 1920x1080 (Desktop), 375x667 (Mobile)
