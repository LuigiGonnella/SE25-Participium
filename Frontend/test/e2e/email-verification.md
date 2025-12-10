# E2E Manual Testing - PT27: Citizen Email Verification

## User Story
PT27 - As a citizen, I want to confirm my registration with a code, so that my account becomes valid and I can start using the system.

## Overview

This document provides **manual E2E UI testing procedures** for verifying the **citizen email verification** feature, including:
- Registration flow with email verification
- Verification code delivery via email
- Account activation upon successful verification
- Error handling for invalid/expired codes
- Resend verification code functionality

## Purpose
- Guarantee that citizens must verify their email before accessing the system
- Verify that verification codes are sent correctly
- Ensure proper validation and error handling
- Confirm that only verified accounts can log in

## Preconditions
- Backend server running (`http://localhost:8080`)
- Frontend server running (`http://localhost:5173`)
- Email service configured and working
- Access to test email account to receive verification codes

## Test History
**Testing Date:** December 10, 2025
**Application Version:** 1.0.0
**Environment:** Docker Compose (Backend + Frontend + DB + Email Service)
**Browser:** Google Chrome

---

## Test Suite 1: Complete Registration and Verification Flow

### Test Case 1.1: Successful Registration and Email Verification

**Preconditions**
- Valid email address for testing (e.g., `testcitizen@example.com`)
- Email service is running and accessible

**Test Steps**

1. **Access Registration Page**
   - Go to: `http://localhost:5173/register`
   - **Expected**: Registration form is displayed
   - **Expected**: Fields visible: Name, Surname, Username, Email, Password, Confirm Password

2. **Fill Registration Form**
   - Enter **Name**: `testname`
   - Enter **Surname**: `testsurname`
   - Enter **Username**: `testcitizen123`
   - Enter **Email**: `testcitizen@example.com`
   - Enter **Password**: `SecurePass123!`
   - Enter **Confirm Password**: `SecurePass123!`
   - Click "Submit" button
   - **Expected**: Registration successful message appears
   - **Expected**: Redirect to verification page

3. **Check Email Inbox**
   - Open email inbox for `testcitizen@example.com`
   - **Expected**: Email received with subject "Email Verification - Participium" 
   - **Expected**: Email contains:
     - Welcome message
     - 6-digit verification code (e.g., `123456`)
     - Expiration time ("This code will expire in 30 minutes.")

4. **Access Verification Page**
   - Go to: `http://localhost:5173/login`
   - Insert username and password
   - **Expected**: Redirect to `http://localhost:5173/verify-email`
   - **Expected**: Verification form is displayed
   - **Expected**: Fields visible:
     - Verification code input (6 digits)
     - "Verify Email" button
     - "Resend Verification Email" button
     - Info if the email hasn't been received

5. **Enter Verification Code**
   - Enter **Verification Code**: `123456` (from email)
   - Click "Verify Email" button
   - **Expected**: Loading indicator appears
   - **Expected**: Success message: "Email verified successfully!"
   - **Expected**: Redirect to login page after 2-3 seconds

6. **Logout**

7. **Login with Verified Account**
   - Go to: `http://localhost:5173/login`
   - Enter **Username**: `testcitizen123`
   - Enter **Password**: `SecurePass123!`
   - Click "Login"
   - **Expected**: Login successful
   - **Expected**: Redirect to home page
   - **Expected**: User is fully authenticated and can access all citizen features

---

## Test Suite 2: Error Handling and Validation

### Test Case 2.1: Invalid Verification Code

**Test Steps**

1. **Enter Wrong Verification Code**
   - Go to: `http://localhost:5173/login`
   - Enter **Username**: `testcitizen123`
   - Enter **Password**: `SecurePass123!`
   - Click "Login"
   - Enter **Wrong Code**: `000000`
   - Click "Verify"
   - **Expected**: Error message: "The verification code is invalid or has expired"
   - **Expected**: Verification does not succeed
   - **Expected**: Account remains unverified

---

### Test Case 2.2: Expired Verification Code

**Preconditions**
- Verification code has been sent more than 30 minutes ago 

**Test Steps**

1. **Enter Expired Code**
   - Go to verification page
   - Enter **Email/Username**: `testcitizen123`
   - Enter **Expired Code**: `123456`
   - Click "Verify"
   - **Expected**: Error message: "The verification code is invalid or has expired"
   - **Expected**: Prompt to request new code
   - **Expected**: Account remains unverified

2. **Request New Code**
   - Click "Resend Verification Email"
   - **Expected**: New code sent to email
   - **Expected**: Success message displayed
   - **Expected**: New code can be used successfully

3. **Request New Code Again**
   - Click "Resend Verification Email"
   - **Expected**: Error message: "A pending email verification already exists. Please check your email for the verification code"
   - **Expected**: Account remains unverified
---

### Test Case 2.3: Code Format Validation

**Test Steps**

1. **Enter Invalid Format**
   - Go to verification page
   - Enter **Code**: `12345` (5 digits instead of 6)
   - **Expected**: "Verify Email" button is disabled
   - **Expected**: Verification does not proceed

2. **Enter Non-Numeric Characters**
   - Enter **Code**: `12ABC4`
   - **Expected**: "Verify Email" button is disabled
   - **Expected**: Verification does not proceed

3. **Empty Code**
   - Leave code field empty
   - **Expected**: "Verify Email" button is disabled
   - **Expected**: Verification does not proceed

---


## Test Suite 3: UI/UX Verification

### Test Case 3.1: Verification Page Layout

**Test Steps**

1. **Access Verification Page**
   - Go to: `http://localhost:5173/verify-email`
   - **Expected**: Clean, user-friendly interface
   - **Expected**: Clear instructions visible
   - **Expected**: Input fields properly labeled
   - **Expected**: Verify button clearly visible
   - **Expected**: Resend code option accessible

2. **Check Responsive Design**
   - Test on mobile viewport (375px width)
   - **Expected**: Layout adapts properly
   - **Expected**: All elements remain accessible
   - **Expected**: Input fields are properly sized

---

### Test Case 3.2: Success Feedback

**Test Steps**

1. **Complete Verification**
   - Enter valid code
   - Click "Verify Email"
   - **Expected**: Success message with checkmark icon
   - **Expected**: Green color scheme for success
   - **Expected**: Clear next steps indicated
   - **Expected**: Auto-redirect countdown visible (optional)

---

### Test Case 3.3: Error Feedback

**Test Steps**

1. **Enter Invalid Code**
   - Enter wrong code
   - Click "Verify Email"
   - **Expected**: Error message in red
   - **Expected**: Error icon displayed
   - **Expected**: Error message is clear 

---

## Test Suite 4: Email Content Verification

### Test Case 4.1: Verification Email Format

**Test Steps**

1. **Check Email Content**
   - Receive verification email
   - **Expected**: Professional email format
   - **Expected**: Contains:
     - Greeting with username
     - Clear verification code (large, bold)
     - Instructions
     - Expiration time
     - Footer with info

2. **Check Email Deliverability**
   - Verify email not in spam folder
   - **Expected**: Email arrives in inbox
   - **Expected**: Delivery within 1-2 minutes

---

## Test Results Template

| Test Case | Status |
|-----------|--------|
| 1.1 - Complete Registration & Verification |  Pass  |
| 2.1 - Invalid Code |  Pass  |
| 2.2 - Expired Code |  Pass  |
| 2.3 - Code Format Validation |  Pass  |
| 3.1 - Verification Page Layout |  Pass  |
| 3.2 - Success Feedback |  Pass  |
| 3.3 - Error Feedback |  Pass  |
| 4.1 - Email Format |  Pass  |


