# E2E UI Manual Testing Documentation

## Overview
This document describes the manual testing procedures for the UI components of the Participium application, specifically focusing on the Map functionality for authenticated Citizens.

**Testing Date:** November 25, 2025  
**Application Version:** 1.0.0  
**Environment:** Docker Compose (MySQL + Backend + Frontend)

---

## Test Suite 1: Report Clustering on Map

### Feature Description
The map displays reports as clustered markers using the Supercluster library. Only non-PENDING and non-REJECTED reports are visible, and only to authenticated CITIZEN users.

### Prerequisites
- Application running via Docker Compose
- MySQL database initialized with test data
- At least 3-5 reports in the database with different statuses (ASSIGNED, IN_PROGRESS, RESOLVED, SUSPENDED)
- At least 1-2 reports with PENDING or REJECTED status (should NOT appear)
- Valid CITIZEN account credentials

### Test Case 1.1: Verify Access Control - Unauthenticated User
**Objective:** Ensure unauthenticated users cannot see report clusters

**Steps:**
1. Open browser and navigate to `http://localhost:5173`
2. Ensure you are NOT logged in (check navbar for login/register buttons)
3. Navigate to the Map page (usually the home page or /map route)
4. Wait for the map to fully load (Turin boundary should be visible)
5. Observe the map surface

**Expected Result:**
- The map loads successfully with Turin boundaries visible
- NO report markers or clusters are visible on the map
- The map is interactive (pan, zoom work)
- The masked area (outside Turin) is grayed out

**Actual Result:** [PASS]  

---

### Test Case 1.2: Verify Access Control - Authenticated CITIZEN User
**Objective:** Ensure authenticated CITIZEN users can see report clusters

**Steps:**
1. Click "Login" button in the navbar
2. Select "Login as Citizen" option
3. Enter valid CITIZEN credentials (username/password)
4. Click "Login" button
5. Wait for redirect to home/map page
6. Observe the map surface

**Expected Result:**
- After successful login, user is redirected to the map
- Report markers/clusters ARE visible on the map
- Clusters show a blue circular icon with a number indicating report count
- Individual reports (when zoomed in) show the default Leaflet marker icon (blue pin)
- Only reports with status: ASSIGNED, IN_PROGRESS, RESOLVED, or SUSPENDED are visible
- Reports with status PENDING or REJECTED are NOT visible

**Actual Result:** [PASS]  

---

### Test Case 1.3: Verify Report Filtering by Status
**Objective:** Ensure only allowed statuses are displayed on the map

**Prerequisites:**
- Logged in as CITIZEN
- Database contains reports with all statuses:
  - At least 2 reports with status PENDING
  - At least 1 report with status REJECTED
  - At least 3 reports with status ASSIGNED, IN_PROGRESS, RESOLVED, or SUSPENDED

**Steps:**
1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Refresh the map page
4. Find the request to `/api/v1/reports/public`
5. Inspect the response JSON

**Expected Result:**
- The API response contains ONLY reports with status: ASSIGNED, IN_PROGRESS, RESOLVED, SUSPENDED
- The API response does NOT contain reports with status: PENDING or REJECTED
- The number of markers on the map matches the count of reports in the API response

**Actual Result:** [PASS]  

---

### Test Case 1.4: Cluster Interaction - Zoom Levels
**Objective:** Verify cluster behavior at different zoom levels

**Prerequisites:**
- Logged in as CITIZEN
- At least 5 reports in a close geographic area (e.g., same neighborhood)

**Steps:**
1. Zoom out to minimum zoom level (zoom level 12)
2. Observe how reports are grouped into clusters
3. Note the cluster icon size and number displayed
4. Click on a cluster marker
5. Observe the map behavior
6. Gradually zoom in (zoom level 13, 14, 15...)
7. Observe cluster behavior at each level
8. Continue zooming until maximum zoom (level 18)

**Expected Result:**
- At low zoom levels (12-14): Multiple reports in proximity are grouped into a single cluster
- Cluster icon displays the count of reports in that cluster (e.g., "5")
- Cluster icon size increases proportionally with the number of reports
- Clicking a cluster zooms in and re-centers the map to expand that cluster
- As zoom level increases, clusters gradually split into smaller clusters or individual markers
- At maximum zoom (17-18), clusters are fully expanded into individual report markers
- No JavaScript errors in console during zoom interactions

**Actual Result:** [PASS]  

---

### Test Case 1.5: Individual Marker Popup
**Objective:** Verify individual report marker popup on hover/click

**Prerequisites:**
- Logged in as CITIZEN
- Zoomed in enough to see individual markers (not clusters)

**Steps:**
1. Locate an individual report marker (blue pin icon)
2. Hover the mouse over the marker (do NOT click yet)
3. Observe the popup behavior
4. Move mouse away from the marker
5. Observe the popup behavior
6. Hover over the marker again
7. Inspect the popup content

**Expected Result:**
- On mouse hover (mouseover), a popup appears above the marker
- The popup displays:
  - **Report ID:** [number]
  - **Category:** [category name, e.g., "WSO", "RSTLO"]
  - **Status:** [current status, e.g., "ASSIGNED", "IN_PROGRESS"]
- The popup does NOT have a close button (closeButton: false)
- On mouse leave (mouseout), the popup automatically closes
- The popup appears smoothly without lag
- The popup content is readable and properly formatted

**Actual Result:** [PASS]  

---

### Test Case 1.6: Dynamic Report Updates
**Objective:** Verify new reports appear on map after creation

**Prerequisites:**
- Logged in as CITIZEN

**Steps:**
1. Observe current number of markers/clusters on the map
2. Click on a location inside Turin boundaries
3. Wait for the street name popup to appear
4. Click the "New Report" button (blue button at bottom center)
5. Fill out the report form:
   - Title: "E2E Test Report"
   - Description: "Testing map update functionality"
   - Category: Select any category (e.g., "Road Signs and Traffic Lights")
   - Upload 1-3 photos
6. Click "Submit" button
7. Wait for success message/form to close
8. Observe the map

**Expected Result:**
- After successful submission, the report form closes automatically
- The map reloads the reports (API call to `/reports/public` is made)
- A new marker appears at the location where the report was created
- The new marker is visible immediately (or after a few seconds)
- The marker displays correct information in the popup (ID, Category, Status)

**Actual Result:** [PASS]  

---

### Test Case 1.7: Access Control - STAFF User
**Objective:** Verify STAFF users cannot see clusters via /public endpoint

**Prerequisites:**
- Valid STAFF account credentials (TOSM or MPRO role)

**Steps:**
1. Logout from CITIZEN account (if logged in)
2. Click "Login" button
3. Select "Login as Staff" option
4. Enter valid STAFF credentials
5. Navigate to the map page (if available in navigation)
6. Observe the map

**Expected Result:**
- STAFF users should NOT be able to access the `/reports/public` endpoint (requires CITIZEN authentication)
- The map loads but shows NO report markers/clusters (API call fails with 403)

**Actual Result:** [PASS]  

---

## Test Suite 2: Report Details Panel

### Feature Description
When a CITIZEN user clicks on an individual report marker on the map, a side panel slides in from the right displaying detailed information about that specific report.

### Prerequisites
- Application running via Docker Compose
- Logged in as authenticated CITIZEN user
- At least 1 report visible on the map (not in a cluster)
- Report should have all fields populated (title, description, photos, assigned staff, etc.)

---

### Test Case 2.1: Opening Report Details Panel
**Objective:** Verify clicking a marker opens the details panel

**Steps:**
1. Ensure logged in as CITIZEN
2. Locate an individual report marker on the map (zoom in if needed to expand clusters)
3. Click on the marker
4. Observe the UI changes

**Expected Result:**
- Clicking the marker triggers the `setSelectedReport()` function
- A side panel slides in from the right side of the screen
- The panel takes up approximately 40-50% of the screen width on desktop (col-lg-5)
- On mobile, the panel covers the full screen (col-12)
- The panel has a white background
- The panel appears smoothly with animation
- The map resizes to accommodate the panel (col-lg-7 instead of col-12)
- The marker popup closes automatically when the panel opens

**Actual Result:** [PASS]  

---

### Test Case 2.2: Report Details Content Verification
**Objective:** Verify all report details are correctly displayed

**Prerequisites:**
- Report details panel is open
- Selected report has complete data (title, description, photos, category, status, assigned staff, etc.)

**Steps:**
1. Inspect the content of the Report Details Panel
2. Verify each field is present and correctly formatted
3. Cross-reference with the data shown in the marker popup

**Expected Result:**
The panel displays the following information:
- **Title:** Full report title
- **Description:** Full report description text
- **Category:** Report category (e.g., "Road Signs and Traffic Lights Office")
- **Status:** Current status with appropriate color/badge (e.g., ASSIGNED, IN_PROGRESS)
- **Location Coordinates:** Latitude and Longitude values
- **Photos:** Up to 3 report photos displayed as thumbnails or carousel
  - Photos load correctly from `/uploads/reports/` path
  - Each photo is clickable/expandable (if implemented)
- **Citizen Username:** Username of the report creator (or "Anonymous" if anonymous)
- **Comment:** Any MPRO/TOSM comments (if present)
- **Close Button:** "X" or close icon at top-right of panel

**Actual Result:** [PASS]  

---

### Test Case 2.3: Photo Display and Loading
**Objective:** Verify report photos load correctly

**Prerequisites:**
- Selected report has 1-3 photos uploaded

**Steps:**
1. Open report details panel
2. Locate the photos section
3. Observe photo loading behavior
4. Check browser DevTools Network tab for image requests

**Expected Result:**
- Photos load from the correct URL: `http://localhost:8080/uploads/reports/{filename}`
- All uploaded photos (1-3) are displayed
- Photos render as images (not broken image icons)
- If report has only 1 photo, only 1 image is shown
- If report has 3 photos, all 3 are shown
- Images are appropriately sized (not too large or distorted)
- No errors in console

**Actual Result:** [PASS]  

---

### Test Case 2.4: Closing Report Details Panel
**Objective:** Verify panel can be closed and UI returns to normal state

**Steps:**
1. Open report details panel (click any marker)
2. Locate the close button/icon 
3. Click the close button
4. Observe the UI changes

**Expected Result:**
- Clicking close button triggers `onClose()` function which calls `setSelectedReport(undefined)`
- The panel slides out to the right and disappears
- The map expands back to full width (col-12)
- The map re-centers or remains at current position
- If user had clicked inside Turin earlier, the "New Report" button reappears (if coordinates are still selected)
- No errors in console
- The previously clicked marker is no longer highlighted or selected

**Actual Result:** [PASS]  

---

### Test Case 2.5: Switching Between Reports
**Objective:** Verify clicking different markers switches the panel content

**Prerequisites:**
- At least 2 individual report markers visible on the map

**Steps:**
1. Click on Report Marker A
2. Wait for panel to open with Report A details
3. Note the Report ID, Title, and Status
4. Without closing the panel, click on Report Marker B (different marker)
5. Observe the panel content

**Expected Result:**
- Clicking Report Marker B immediately updates the panel content
- The panel does NOT close and reopen; it smoothly transitions
- The panel now displays Report B details:
  - Different Report ID
  - Different Title, Description, Photos, etc.
- Report Marker A is deselected
- Report Marker B becomes the active/selected marker
- No layout glitches or flashing
- No duplicate panels appear

**Actual Result:** [PASS]  

---

### Test Case 2.6: Report Details Access Control - Unauthenticated User
**Objective:** Verify unauthenticated users cannot access report details

**Steps:**
1. Logout from CITIZEN account
2. Navigate to map page 
3. Attempt to view report markers

**Expected Result:**
- Since unauthenticated users cannot see markers (Test 1.1), they cannot click on them
- No report details panel can be opened
- If user tries to directly access a report via URL manipulation (e.g., /reports/123), they should be redirected to login page or receive 401 error

**Actual Result:** [PASS]  

---

### Test Case 2.8: Responsive Design - Mobile View
**Objective:** Verify report details panel works correctly on mobile screens

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device emulation 
3. Select a mobile device 
4. Refresh the page
5. Login as CITIZEN
6. Click on a report marker
7. Observe the panel behavior

**Expected Result:**
- On mobile screens (< 992px), the panel takes full screen width (col-12)
- The panel overlays the map completely (position-absolute)
- The panel has high z-index (1001) to appear on top
- The panel is scrollable if content exceeds screen height
- The close button is easily accessible (top-right corner)
- All content (photos, text, buttons) is readable and properly sized
- No horizontal scrolling required
- Touch interactions work smoothly (tap to close, swipe to scroll)

**Actual Result:** [PASS]  

---

## Known Issues and Limitations

1. **Report Status Filtering:**
   - Only reports with status ASSIGNED, IN_PROGRESS, RESOLVED, or SUSPENDED are visible
   - PENDING and REJECTED reports are excluded from map view
   - This is by design to show only "actionable" or "completed" reports to citizens

2. **Authentication Requirement:**
   - The `/reports/public` endpoint requires CITIZEN authentication
   - This prevents anonymous users from viewing reports
   - Consider renaming endpoint or making it truly public if citizen-only is not required

3. **Real-time Updates:**
   - Report clusters do not auto-refresh
   - User must manually refresh page or submit a new report to see updates
   - Consider implementing WebSocket or polling for live updates

4. **Performance:**
   - With large numbers of reports (1000+), clustering may become slow
   - Monitor performance with realistic data volumes

---

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome/Firefox/Safari [specify version]
- **Screen Resolutions Tested:** 1920x1080, 1366x768, 375x667 (mobile)

---