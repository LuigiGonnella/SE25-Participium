# E2E Manual Testing - PT24: TOSM can assign a report to an EM

## User Story
PT24 - As a technical office staff member, I want to assign reports to external maintainers, so that specialized maintainers can handle and update the intervention.

## Overview

This document provides **manual E2E UI testing procedures** for verifying the **assignment of reports to external maintainers** feature inside:
- `ReportDetailsPage.tsx`
- `API.assignReportToMaintainer`
- `authRoutes.ts` (Backend)
- `reportRoutes.ts` (Backend)

## Purpose of PT24
- Guarantee that technical office staff members can **assign reports to external maintainers**.
- Guarantee that other roles **cannot assign reports** to external maintainers.

## Preconditions
- Backend server running (`http://localhost:8080`)
- Frontend server running (`http://localhost:5173`)

## Test History
**Testing Date:** December 10, 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB)
**Browser:** Google Chrome
**Test Suites Executed:** 1
**Results:** All test cases passed.

## Test Suite 1: Assign Report to EM Flow

**Preconditions**
- Backend server running (`http://localhost:8080`)
- Frontend server running (`http://localhost:5173`)

### Test Case 1.1: Successful EM Assignment - Complete Flow

**Preconditions**
- Existing report with ID `123` in status "Assigned".

**Test Steps**
1. Login as a Technical Office Staff Member
    - Open browser and go to: `http://localhost:5173/login`
    - Enter **Username** and **Password**
    - Click "Login"
    - **Expected**: Redirect to report details page: `http://localhost:5173/reports`
    - **Expected**: Report ID `123` is visible in the list
2. Assign Report to me
    - Click on "Assign to Me" button
    - **Expected**: "Assigning..." appears when loading
    - **Expected**: "Assigned:" shows TOSM username
    - **Expected**: "Assign to External Maintainer" appears
3. Select External Maintainer
    - Click on "Assign to External Maintainer" button
    - Select EM from dropdown list
    - Click "Assign"
    - **Expected**: "External Assigned:" shows EM username
4. Navigate to Report Details Page
    - Click on Report ID `123` to view details (`http://localhost:5173/reports/123`)
    - **Expected**: "External Maintainer:" in report description shows EM username
5. Logout
6. Login as the assigned External Maintainer
    - Open browser and go to: `http://localhost:5173/login`
    - Enter **Username** and **Password**
    - Click "Login"
    - **Expected**: Redirect to report details page: `http://localhost:5173/reports`
    - **Expected**: Report ID `123` is visible in the list
    - **Expected**: "Assigned:" shows TOSM username
    - **Expected**: "External Assigned:" shows EM username



