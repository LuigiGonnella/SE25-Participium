# E2E Manual Testing - PT03: Admin - Staff Registration

## User Story
PT03 - As a system administrator, I want to assign roles to municipality users* 

*Possible roles: municipal public relations officer, municipal administrator, technical office staff member, external maintainer.

## Overview

This document provides **manual E2E UI testing procedures** for verifying the **registration of staff** feature inside:

- `RegistrationPage.tsx`
- `API.register`
- `authRoutes.ts` (Backend)
- `officeRoutes.ts` (Backend)

## Purpose of PT03
- Guarantee that **admin can register staff** with proper office assignment.
- Guarantee that **form validation works correctly** for all required fields.
- Guarantee correct **UI behavior**, **error handling**, and **navigation flows**.

## Test History

**Testing Date:** December 10, 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB)
**Browser:** Google Chrome
**Test Suites Executed:** 1
**Results:** TC 1.4 Failed: showed `Registration succesfully submitted`.

## Test Suite 1: EM Registration Flow

Trying to register Mario Rossi (Username: em_testuser, Email: em.test@external.com, Password: SecurePass123!) as an External Maintainer for the External Company - Water Supply.

**Preconditions**
- Backend server running (`http://localhost:8080`)
- Frontend server running (`http://localhost:5173`)
- Logged-in user is an **Administrator**.

### Test Case 1.1: Successful EM Registration - Complete Flow

**Test Steps**
1. **Login as an Administrator**
   - Open browser and go to: `http://localhost:5173/login`
   - Enter **Username** and **Password**
2. **Navigate to Registration Page**
   - Open browser and go to: `http://localhost:5173/municipality-registration`
   - **Expected**: Registration page loads with form fields

3. **Fill Registration Form**
   - Enter **Username**: `em_testuser`
   - Enter **Email**: `em.test@external.com`
   - Enter **Name**: `Mario`
   - Enter **Surname**: `Rossi`
   - Enter **Password**: `SecurePass123!`
   - Enter **Confirm Password**: `SecurePass123!`
   - Select **Role**: `External Maintainer` from dropdown
   - **Expected**: External Maintainer role appears in dropdown
   - **Expected**: Office selection dropdown appears below role

4. **Select Office**
   - Click on **Office** dropdown
   - **Expected**: List of available offices appears
   - Select: `External Company - Water Supply`
   - **Expected**: Office is selected and displayed

5. **Submit Registration**
   - Click **Submit** button
   - **Expected**: Registration succesfully submitted

6. **Login as EM**
   - Enter **Username**: `em_testuser`
   - Enter **Password**: `SecurePass123!`
   - Click **Login**
   - **Expected**: Successful login
   - **Expected**: Redirect to `/reports` dashboard
   - **Expected**: User role when hovering on profile shows "External Maintainer"

7. **Verify EM Access**
    - **Expected**: Navigation shows "Reports" section
    - **Expected**: No admin/MPRO/TOSM features visible
    - **Expected**: Can only see reports assigned to their office
    - **Expected**: Profile shows correct name, role, and office

**Expected Results**
- Registration completes successfully  
- EM can login successfully  
- EM has correct permissions and office assignment  

### Test Case 1.2: Form Validation - Missing Required Fields

**Test Steps**
1. Navigate to `/municipality-registration`
2. Leave **Username** empty
3. Fill other fields correctly

**Expected Results**: Error: "This field is required."

### Test Case 1.3: Password Validation Rules

**Test Steps**

1. Navigate to `/municipality-registration`
2. Enter **Password**: `short`
3. Enter **Confirm Password**: `short`
4. Fill other fields correctly

**Expected Results**: Error: "Must contain at least 8 characters."

### Test Case 1.4: Duplicate Username/Email

**Test Steps**

**Precondition**: EM `em_testuser` already registered

1. Navigate to `/municipality-registration`
2. Fill form with:
   - **Username**: `em_testuser` (existing)
   - **Email**: `new.email@test.com`
   - **Password**: `SecurePass123!`
   - **Role**: `External Maintainer`
   - **Office**: `External Company - Water Supply`

**Expected**: Error: "Username already exists."
**Expected**: Form remains on registration page