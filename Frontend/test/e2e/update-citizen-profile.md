# E2E UI Manual Testing – Story 9: Citizen Profile Update

This section provides manual E2E UI testing procedures for verifying the **Citizen Profile** functionality (`CitizenProfile.tsx`). It focuses on updating optional fields, handling file uploads, and validating system feedback.

## Overview

Story PT09 — As a citizen I want to configure my account so that I can better manage notifications and my virtual presence.

**Testing Date:** November 27, 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB)

## Feature Description

The Citizen Profile page allows authenticated citizens to:
1. View immutable personal info (Name, Surname, Username, Email).
2. Update **Telegram Username**.
3. Toggle **Email Notifications** preference.
4. Upload a **Profile Picture** with instant preview.

## Test Suite 1: Page Access & Initial State

### Test Case 1.1: Profile Page Loads Correctly
**Objective:** Verify that the profile page renders with the user's existing data.

**Steps**
1. Login as **Citizen**.
2. Click on Citizen username in the navigation bar.
3. Observe the "Personal Information" card.

**Expected Result**
* **Immutable Fields:** Name, Surname, Username, and Email are displayed as text (not input fields).
* **Editable Fields:**
    * Telegram Username input is visible (pre-filled if exists).
    * "Receive email notifications" checkbox shows correct current state.
* **Profile Picture:** Shows current user photo or default placeholder image.
* **Buttons:** "Change Profile Picture" link and "Save Changes" button are visible.

**Actual Result:** [PASS]

## Test Suite 2: Functional Updates

### Test Case 2.1: Update Telegram Username
**Objective:** Ensure the input enforces the '@' prefix logic defined in `handleTelegramChange`.

**Steps**
1. Navigate to `/profile`.
2. Clear the **Telegram Username** field (if populated).
3. Type a username **without** the `@` symbol (e.g., `participium_user`).
4. Observe the input field while typing.
5. Click "Save Changes".

**Expected Result**
* **Auto-format:** The input automatically adds `@` at the start (displays `@participium_user`).
* **Submission:** Button text changes to "Saving...".
* **Feedback:** Green Alert appears: *"Profile updated successfully!"*.
* **Persistence:** Reload page; value remains `@participium_user`.

**Actual Result:** [PASS]

### Test Case 2.2: Toggle Email Notifications
**Objective:** Verify the user can change notification settings.

**Steps**
1. Navigate to `/profile`.
2. Toggle the "Receive email notifications" checkbox (change state).
3. Click "Save Changes".

**Expected Result**
* Success message appears.
* Reloading the page shows the checkbox in the new state.

**Actual Result:** [PASS]

### Test Case 2.3: Profile Picture Upload & Preview
**Objective:** Verify image selection, preview generation, and submission.

**Steps**
1. Click "Change Profile Picture".
2. Select a valid image file (JPG/PNG).
3. **Observe:** The circular image updates *immediately* to the new photo (Client-side preview).
4. Click "Save Changes".

**Expected Result**
* Preview works via `URL.createObjectURL`.
* Success message appears after API response.
* Input file selection is cleared internally after save.

**Actual Result:** [PASS]

### Test Case 2.4: Clear Telegram Username
**Objective:** Verify the user can remove their Telegram username.

**Steps**
1. Delete all text in the **Telegram Username** field.
2. Click "Save Changes".

**Expected Result**
* Field accepts empty string (does not force `@` if empty).
* Success message appears.
* Backend updates value to null/empty string.

**Actual Result:** [PASS]

## Test Suite 3: Validation & Error Handling

### Test Case 3.1: Prevent Submission with No Changes
**Objective:** Verify logic `if (Object.keys(updates).length === 0)`.

**Steps**
1. Open Profile page.
2. **Do not** change any field.
3. Click "Save Changes".

**Expected Result**
* **No API call** is made (check Network tab).
* Red Alert appears: *"No changes to save"*.
* "Saving..." state is NOT triggered.

**Actual Result:** [PASS]

### Test Case 3.2: API Error Handling
**Objective:** Ensure backend failures are displayed to the user.

**Steps**
1. Simulate backend failure (Stop Docker container or mock 500 error).
2. Change a field (e.g., toggle email).
3. Click "Save Changes".

**Expected Result**
* Red Alert variant="danger" appears.
* Text displays error message (e.g., *"Failed to update profile"*).
* Success message does NOT appear.

**Actual Result:** [PASS]

## Test Suite 4: Responsive Layout

### Test Case 4.1: Mobile View Responsiveness
**Objective:** Ensure profile card adapts to small screens.

**Steps**
1. Open DevTools → Mobile View (iPhone SE or Pixel 5).
2. Inspect the Profile Card.

**Expected Result**
* Card width adapts to screen width.
* Profile picture remains centered.
* "Save Changes" button is easily clickable.
* No horizontal scrolling.

**Actual Result:** [PASS]

## Test Environment Details

- **Backend URL:** http://localhost:8080/api/v1
- **Frontend URL:** http://localhost:5173
- **Database:** MySQL 8.0 (Docker container)
- **Browser Tested:** Chrome
- **Screen Resolutions Tested:** 1920x1080 (Desktop), 375x667 (Mobile)