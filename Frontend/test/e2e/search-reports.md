# E2E UI Manual Testing – Search Reports by Address (Citizen / Unregistered User)

## User Story

**As a citizen or unregistered user**  
I want to search for reports in a specific area by typing an address  
So that I can easily explore and analyze existing reports in that specific area.

---

## Overview

This document describes the **manual end-to-end frontend testing** for the address-based search functionality on the map page.  
The feature allows unauthenticated users and citizens to search for reports by entering an address and optionally refining results using filters.

The focus is on:
- Address search
- Map interaction
- Result visualization
- Filter behavior
- Zoom and radius control

---

## Scope

### In Scope
- Accessing the map without authentication
- Searching for reports using an address
- Adjusting search radius (zoom level)
- Filtering results by status and category
- Viewing search results list
- Viewing markers on the map

### Out of Scope
- Login / registration
- Report creation
- Report assignment or status updates
- Profile management

---

## Preconditions

- Frontend application is running
- Backend API is available
- Database contains reports located in Turin
- User is **not logged in** or logged in as a **citizen**

---

## Test Suite 1 – Map Access

### Test Case 1.1 – Open map as unregistered user

**Steps**
1. Open the application in a clean browser session.
2. Navigate to `/map`.

**Expected Result**
- The map loads correctly.
- The default view is centered on Turin.
- No authentication is required.
- The “Search” button is visible.

---

## Test Suite 2 – Search Panel

### Test Case 2.1 – Open search panel

**Steps**
1. On the map page, click the **Search** button.

**Expected Result**
- A search panel opens on the right side of the screen.
- An input field with placeholder text (e.g. “Search an address in Turin”) is visible.
- Filters section is hidden or collapsed by default.

---

### Test Case 2.2 – Close search panel

**Steps**
1. Open the search panel.
2. Click the **X** close icon.

**Expected Result**
- The panel closes.
- The map remains fully interactive.
- No UI glitches occur.

---

## Test Suite 3 – Address Search

### Test Case 3.1 – Search for a valid address

**Steps**
1. Open the search panel.
2. Type a valid address (e.g. `via roma`).
3. Trigger the search (Enter key or search icon).

**Expected Result**
- The map centers on the searched address.
- The zoom level updates according to the selected radius.
- The search results section appears.
- Matching reports are listed.

---

### Test Case 3.2 – Search for an address with no reports

**Steps**
1. Search for a valid address with no nearby reports.
2. Observe the results.

**Expected Result**
- “Search Results (0)” is displayed.
- A message such as “No reports found with the selected filters” is shown.
- Filters remain usable.

---

### Test Case 3.3 – Search for an invalid address

**Steps**
1. Enter an invalid or random address.
2. Trigger the search.

**Expected Result**
- No unexpected map movement.
- A clear message indicating no results or invalid address.
- Application remains stable.

---

## Test Suite 4 – Radius / Zoom Control

### Test Case 4.1 – Change search radius

**Steps**
1. Perform a valid address search.
2. Adjust the radius slider (e.g. from 1 km to 3 km).

**Expected Result**
- The search radius updates.
- The number of results changes accordingly.
- The map reflects the new search area.

---

### Test Case 4.2 – Manual zoom after search

**Steps**
1. Perform an address search.
2. Manually zoom in and out using map controls.

**Expected Result**
- Zoom controls work as expected.
- Map interaction remains smooth.
- No unexpected reset of search results.

---

## Test Suite 5 – Filters

### Test Case 5.1 – Filter by status

**Steps**
1. Perform a valid address search.
2. Set the **Status** filter (e.g. “In Progress”).

**Expected Result**
- Only reports with the selected status are shown.
- Result count updates correctly.

---

### Test Case 5.2 – Filter by category

**Steps**
1. Perform a valid address search.
2. Set the **Category** filter.

**Expected Result**
- Only reports from the selected category are displayed.
- Result count updates correctly.

---

### Test Case 5.3 – Reset filters

**Steps**
1. Modify radius, status, and category filters.
2. Click **Reset**.

**Expected Result**
- Radius resets to default.
- Status and category return to “Any”.
- Results update accordingly.

---

## Test Suite 6 – Search Results Interaction

### Test Case 6.1 – View report summary

**Steps**
1. Perform a valid search with at least one result.
2. Observe a report card in the results list.

**Expected Result**
- Each result shows:
  - Report title
  - Status
  - Category
  - Distance from searched address
  - Author (if applicable)

---

## Test Suite 7 – Responsiveness

### Test Case 7.1 – Desktop layout

**Steps**
1. Open the map on a desktop screen.
2. Open the search panel and perform a search.

**Expected Result**
- Map occupies the left side.
- Search panel is visible on the right.
- No overlapping elements.

---

### Test Case 7.2 – Mobile layout

**Steps**
1. Open the application on a mobile device or emulator.
2. Open the search panel and perform a search.

**Expected Result**
- Search panel is readable and scrollable.
- Close button is accessible.
- No horizontal scrolling issues.

---

## Open Points

- Zoom behavior after address search is not explicitly specified.
- Final behavior will be validated based on product owner feedback.