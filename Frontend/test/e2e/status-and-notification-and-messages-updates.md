# E2E UI Manual Testing — Staff Status Updates + Citizen Notifications + (TOSM → Citizen Messaging Only)

**Date:** November 26, 2025  
**Application Version:** 1.0.0  
**Environment:** Docker Compose (MySQL + Backend + Frontend)

---

# User Story  
**As a Technical Office Staff Member (MPRO or TOSM), I want to update report statuses so that citizens are informed of the report’s progress.  
TOSM staff can send messages to citizens.  
Citizens cannot send messages yet.**

---

# Features Covered  
- Staff (MPRO, TOSM) can update report status  
- Citizen receives a platform notification for each status change  
- **TOSM can send messages to Citizens**  
- Citizen sees the messages but **cannot send messages**  
- Notifications appear:  
  - In Notifications popup  
  - As badge on bell icon  

---

# Test Suite 1: Report Status Update (Staff → Citizen Notifications)

## Prerequisites
- Application running via Docker Compose  
- At least 1 report created by a CITIZEN  
- Valid credentials:
  - CITIZEN account  
  - STAFF MPRO account  
  - STAFF TOSM account  
- Reports with at least PENDING status  

---

## Test Case 1.1: MPRO Updates Status → Citizen Receives Notification  
### MPRO Allowed Status Updates:
- PENDING → ASSIGNED  
- PENDING → REJECTED  

### Steps (MPRO):
1. Login as **MPRO**  
2. Go to **Reports → Report Details**  
3. Select report with status **PENDING**  
4. Choose one:
   - **ASSIGNED**
   - **REJECTED (with reason)**  
5. Click **Update Status**

### Expected Result:
- Notification created for the citizen  
- Notification appears with:
  - Correct title  
  - Correct message  
  - Correct timestamp  
- Notification visible in bell icon + popup  

---

## Test Case 1.2: TOSM Updates Status → Citizen Receives Notification  
### TOSM Allowed Status Updates:
| Current Status | Allowed Updates           |
|----------------|---------------------------|
| ASSIGNED       | IN_PROGRESS               |
| IN_PROGRESS    | RESOLVED, SUSPENDED       |

### Steps (TOSM):
1. Login as **TOSM**  
2. Open a report assigned to them  
3. Select a new valid status  
4. Click **Update Status**

### Expected Result:
Citizen receives one of the following notifications:
- **Report In Progress**  
- **Report Resolved**  
- **Report Suspended**  

All containing correct timestamps + message text.

---

# Test Suite 2: TOSM → Citizen Messaging  
**IMPORTANT:**  
- **Only TOSM can send messages**  
- **Citizen cannot reply yet**

## Test Case 2.1: TOSM Sends a Message to Citizen  
### Steps:
1. Login as **TOSM**  
2. Go to **Reports → Report Details**  
3. Scroll to the **Messages** panel on the right  
4. Type a message  
5. Press **Send Message**

### Expected Result:
- Message appears instantly in the Messages list  
- Sender label shows **You** (from TOSM view)  
- Timestamp is correct  
- Message saved in backend  
- Citizen sees this message in read-only mode  

---

## Test Case 2.2: Citizen View of Messages (Read-Only)  
### Steps (Citizen):
1. Login as **Citizen**  
2. Open **Reports → Report Details** for a report with messages  
3. View the Messages panel

### Expected UI Result:
- Messages appear in chronological order  
- Citizen cannot type in the message box  
- "Send Message" button is disabled or completely hidden  
- No input allowed  

---

# Test Suite 3: Notification UI Behavior

## Test Case 3.1: Bell Icon Badge  
### Steps:
1. Login as Citizen  
2. Trigger at least one unread notification  
3. Observe the bell icon  

### Expected:
- Badge shows correct unread count (e.g., **1**)  
- Badge disappears after opening notifications  

---

## Test Case 3.2: Notifications List  
### Steps:
1. Click bell icon  
2. Observe the dropdown  

### Expected:
- Title **Notifications** at top  
- List sorted newest → oldest  
- Each item shows:
  - Title  
  - Message text  
  - Timestamp  
- Unread notifications highlighted  

---

## Test Case 3.3: Mark as Read  
### Steps:
1. Open the notifications list  
2. Observe a previously unread notification  

### Expected:
- Automatically becomes `isRead = true`  
- Bell badge updates  
- Notification loses "unread" styling  

---

# Test Suite 4: Edge Cases

## Test Case 4.1: No Notifications  
### Steps:
1. Login with a new Citizen account  
2. Open notifications  

### Expected:
- Message like: *“No notifications yet”*  
- No items displayed  

---

## Test Case 4.2: Multiple Notifications  
### Steps:
1. Trigger status changes  
2. Open notifications  

### Expected:
- Entire list displayed  
- Scrollable  
- No UI overlap  

---

# Test Environment Details  
- **Backend:** http://localhost:8080/api/v1  
- **Frontend:** http://localhost:5173  
- **Database:** MySQL 8  
- **Browsers:** Chrome, Brave

---
