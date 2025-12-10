# E2E UI Manual Testing – PT10: Municipality Staff Multi-Office Management

## User Story

As a **system administrator**,
I want to **modify roles / office assignments of municipality users**,
so that **staff can be more flexible (e.g. serving on more than one technical office, or being removed from an office)**.

## Overview

This document provides **manual E2E UI testing procedures** for verifying **multi-office assignment** and **modification for municipality staff**.

### Purpose of PT10

Guarantee that a TOSM can be assigned to multiple offices.

Guarantee that offices can be added / removed from a TOSM (modification includes cancellation).

Guarantee that admin-only flows and validation work correctly on:

Staff registration (municipal staff form).

TOSM office management page.

### Main Flows Covered

Admin registers a municipality staff member with a specific role and office(s).

Admin views list of TOSM and their assigned offices.

Admin edits a TOSM:

Adds an office.

Removes an office.

Updates multiple offices at once.

Validation and error handling if no office is selected or backend fails.

## Preconditions

Backend and frontend are running.

Database seeded with:

A set of offices with proper names and categories that match ROLE_OFFICE_MAP.

At least one:

Municipal Organization Office for admin-type roles.

Technical offices for TOSM role (e.g. Water Supply Office, Waste Office, etc.).

A default admin user exists:

username = "admin"

role = ADMIN

Admin login works via /login.

Routes are configured:

/municipality-registration – Municipality staff registration.

/tosms – TOSM management page (AllTOSM).

## Test Suite 1: Navigation & Visibility

### Test Case 1.1 — Admin sees “Staff Management” / TOSM page

**Steps**

Login as admin.

Check the navbar.

Click Staff Management (or equivalent) → it should route to /tosms.

**Expected**

Navbar shows Staff Management / link to TOSM management only for admin.

/tosms loads successfully without error.

### Test Case 1.2 — Non-admin staff cannot access /tosms

Steps

Login as a TOSM or MPRO user.

Observe navbar.

Manually navigate to /tosms (type it in address bar).

Expected

Navbar does not show Staff Management.

### Test Case 1.3 — Citizen cannot access /tosms

Steps

Login as Citizen.

Check navbar.

Manually navigate to /tosms.

Expected

No Staff Management in navbar.

Direct access to /tosms fails / is blocked.

Citizen never sees TOSM table or edit controls.

### Test Suite 2: Municipality Staff Registration – Role & Office Selection

Covers: MunicipalityRegistrationForm and API.municipalityRegister, ROLE_OFFICE_MAP.

## Test Case 2.1 — Role selection shows office dropdown

**Steps**

Login as admin.

Go to /municipality-registration.

Fill basic info for a new staff (name, surname, username, password).

In Role select a non-ADMIN role (e.g. TOSM or MPRO).

**Expected**

After selecting a role, office dropdown(s) appear.

For roles with only one allowed office (e.g. MPRO, MA, EM), only one select is shown.

For TOSM, at least one office select is shown.

### Test Case 2.2 — Validation: missing officeNames is not allowed

**Steps**

Same as 2.1, choose role TOSM.

Ensure office dropdown appears with one empty selection ("").

Try to submit without selecting any office.

**Expected**

Form shows validation error for office selection.

Submit fails; new staff is not created.

Office select is marked invalid (Bootstrap isInvalid styling).

### Test Case 2.3 — Register a TOSM with one office

**Steps**

On /municipality-registration, fill fields:

name, surname, username, password, confirm password.

Choose Role = TOSM.

In the first office dropdown:

Select e.g. “Water Supply Office”.

Ensure you leave other office selects empty (or only one exists).

Click Submit.

**Expected**

API call: POST /auth/register-municipality with role = "TOSM" and officeNames array containing exactly that office.

Success alert appears: “Registration successful!”.

Form resets (according to implementation).

New TOSM user appears later in /tosms with exactly one office badge.

### Test Case 2.4 — Register a TOSM with multiple offices

**Steps**

On /municipality-registration, create another TOSM:

Fill all fields.

Role = TOSM.

For first office dropdown, select e.g. “Waste Office”.

Click “Add another office” button.

In second office dropdown, select e.g. “Public Lighting Office”.

Submit.

**Expected**

Button “Add another office” is enabled only when the last select is filled.

API payload includes officeNames with two distinct offices.

Success alert appears.

In /tosms, this new TOSM shows two badges with those offices.

###Test Case 2.5 — EM/MPRO/MA roles show only allowed offices

**Steps**

On /municipality-registration, choose role EM.

Check office dropdown.

**Expected**

Office select options for EM are only external company offices, matching ROLE_OFFICE_MAP.EM.

For MPRO / MA, only Municipal Organization Office appears.

Add another office button is not shown for non-TOSM roles (or has no effect).

Test Suite 3: TOSM List & Office Display (/tosms)

Covers: AdminTOSMPage, API.getAllTOSM, API.getOffices.

### Test Case 3.1 — TOSM table loads correctly

_Steps_

Login as admin.

Open /tosms.

**Expected**

Table shows columns:

Username, Name, Surname, Offices, Actions.

Each TOSM row shows:

Username, name, surname.

In Offices, a set of badges, one per office (text = office name).

No error alert initially.

###Test Case 3.2 — TOSM with multiple offices shows multiple badges

Steps

Ensure there is at least one TOSM registered with multiple offices (from Suite 2.4).

Open /tosms as admin.

Expected

That TOSM row shows multiple badges in the Offices column.

Badges contain the names used at registration.

No duplicates in the list.

### Test Suite 4: Editing TOSM Offices

Covers: clicking Edit, updating officeNames, calling API.updateTOSMOffices.

### Test Case 4.1 — Open edit panel with pre-filled offices

Steps

On /tosms, pick a TOSM row.

Click Edit.

Expected

An edit panel appears below the table:

Title like: “Edit Offices for <username>”.

For each existing office of that TOSM:

One office dropdown is shown.

The dropdown value equals the current office name.

Error/success alerts reset.

### Test Case 4.2 — Add a new office to TOSM

Steps

In the edit panel, click “Add another office”.

A new dropdown row appears with empty selection.

Choose an office that is not already selected in other dropdowns.

Click Save.

Expected

Validation:

If a new dropdown is left empty, Save shows error:
“At least one office must be selected.” or equivalent.

On proper selection:

API call: PATCH /auth/staff/{username}/offices with offices including original + new.

Success alert: “Offices updated successfully.”

Edit panel closes and TOSM row in the table updates.

Offices column now shows an extra badge.

### Test Case 4.3 — Remove an office from TOSM (cancellation)

Steps

Open edit panel again for a TOSM with 2+ offices.

For the second (or subsequent) office row, click the “-” button.

Click Save.

Expected

The row is removed from the local officeNames array.

API sends only the remaining offices.

Table row updates so that the removed office badge disappears.

This tests “modification includes cancellation”.

### Test Case 4.4 — Prevent empty office list on save

Steps

Open edit for a TOSM with 1 office.

Try to remove the only office (if possible), or clear its selection (set to empty).

Click Save.

Expected

If officeNames becomes empty or only "":

handleSave shows error alert:
“At least one office must be selected.”

API is not called.

Offices for that TOSM remain unchanged in the table.

### Test Case 4.5 — Cancel edit without saving

Steps

Open an edit panel for a TOSM.

Change one of the offices.

Click Cancel instead of Save.

Expected

Edit panel closes.

Table row remains unchanged (no office badges changed).

No API call is made.

### Test Case 4.6 — Backend error while saving

Steps

(Temporarily) misconfigure backend or make /auth/staff/{username}/offices return an error.

Open TOSM edit panel and modify offices.

Click Save.

Expected

An error alert appears:
“Failed to update offices”.

Edit panel stays open (or can be reopened).

Table row does not update.

Console logs backend error.

### Test Suite 5: Data Integrity & Filtering

### Test Case 5.1 — Only allowed TOSM offices appear in dropdown

Steps

Open /tosms → Edit any TOSM.

Check the options in the office dropdown.

Expected

Options list is filtered to only those offices whose names match ROLE_OFFICE_MAP.TOSM:

Water Supply Office

Architectural Barriers Office

Sewer System Office

Public Lighting Office

Waste Office

Road Signs and Traffic Lights Office

Roads and Urban Furnishings Office

Public Green Areas and Playgrounds Office

No unrelated / admin / external offices appear for TOSM.

## Test Case 5.2 — No duplicate office selection in edit form

Steps

In edit panel, ensure one office is selected (e.g. “Waste Office”).

Click Add another office.

Check dropdown options.

Expected

The new dropdown does not offer already selected offices as choices (except its own old value).

When you change one dropdown, other dropdown options update accordingly (no duplicates).

### Test Suite 6: End-to-End Scenario

### Test Case 6.1 — Full admin workflow for multi-office TOSM

Steps

As admin, go to /municipality-registration.

Register a new TOSM with:

officeNames = ["Waste Office", "Public Lighting Office"].

After success, go to /tosms.

Find that TOSM row:

Confirm two office badges.

Click Edit:

Add third office (e.g. “Roads and Urban Furnishings Office”).

Save.

Open edit again, remove one office using “-”.

Save.

Expected

New TOSM appears in /tosms with two offices, then updates to three, then back to two after removal.

No invalid state where office list becomes empty.

All updates happen via PATCH /auth/staff/{username}/offices and are reflected in UI.

##Known Limitations

No pagination or search on TOSM list (table may grow large).

No direct role change from /tosms (only office changes); role is set at registration.

No optimistic UI: table updates only after successful backend response.

Errors are generic; backend detailed messages may not be shown to the user.

## Test Environment

- **Frontend:** React, Bootstrap, design-react-kit
- **Backend:** Java + Express-style routers
- **DB:** MySQL 8
- **Environment:** Docker Compose
- **Browser:** Chrome latest

---

# End of PT10 Manual Testing Document
