# E2E UI Manual Testing – PT26: Internal Staff Communications on Reports (TOSM & EM)

## User Story

As a **Technical Office Staff Member (TOSM)** or an **External Maintainer (EM)**,  
I want to **exchange information and comments on the report internally**,  
so that **coordination happens without exposing internal notes to citizens**.

---

## Overview

This document provides **manual E2E UI testing procedures** for verifying the **Internal Communications (Private Notes)** feature between **TOSM** and **External Maintainers (EM)** inside:

- `ReportDetailPage.tsx`
- `API.createMessage`
- `API.getAllMessages`

### Purpose of PT26
- Guarantee that **internal messages are visible only to TOSM and EM**.
- Guarantee that **public messages remain separate** and visible to citizens.
- Guarantee correct **UI behavior**, **visibility rules**, and **message flows**.

### Main Flow Covered
- TOSM <→ EM messaging inside the report detail.
- Internal Notes section collapse/expand.
- Visibility rules depending on roles and assignment.
- Re-fetching after sending messages.

---

## Preconditions

- A report exists with:
  - `status = ASSIGNED`
  - `assignedStaff = <tosm_username>`
  - `assignedEM = <em_username>`
- Logged-in user is either:
  - **TOSM** who is assigned to the report, or
  - **EM** assigned to the same report.

- Backend endpoints:
  - `GET /reports/{id}`
  - `GET /reports/{id}/messages`
  - `POST /reports/{id}/messages`

---

## Test Suite 1: Visibility Rules

### Test Case 1.1 — Internal Notes visible only when TOSM or EM is assigned

**Steps**
1. Login as **unrelated TOSM** (not assigned).
2. Visit `/reports/{id}`.

**Expected**
- **Internal Notes section is NOT shown**.
- Page is full-width (`col-12`).
- No message panels appear.

---

### Test Case 1.2 — TOSM assigned to report sees Internal Notes

**Steps**
1. Login as assigned **TOSM**.
2. Open `/reports/{id}`.

**Expected**
- Right column appears (`col-md-4`).
- Card title “**Internal Notes**”.
- Collapse/expand arrow visible.
- Input textarea + “Send Message” button.

---

### Test Case 1.3 — EM assigned to report sees Internal Notes

**Steps**
1. Login as **assigned EM**.
2. Open `/reports/{id}`.

**Expected**
- Same behavior as TOSM:
  - Internal Notes panel present.
  - Messages visible.
  - Input visible.

---

### Test Case 1.4 — Citizen must never see internal messages

**Steps**
1. Login as **Citizen**.
2. Open `/reports/{id}`.

**Expected**
- **Internal Notes card is completely absent**.
- Only Public Messages card (if TOSM has written any).
- No leaking of private notes.

---

## Test Suite 2: Loading & Empty States

### Test Case 2.1 — Loading state while fetching private messages

**Steps**
1. Introduce backend delay.
2. Open report as TOSM/EM.

**Expected**
- Internal Notes message area shows:
Loading notes…
---

### Test Case 2.2 — Empty internal messages list

**Steps**
1. Ensure no private messages exist.
2. Open report as TOSM/EM.

**Expected**
- Message panel shows:
No internal notes yet.
---

## Test Suite 3: Sending a Private Message

### Test Case 3.1 — Successful message send

**Steps**
1. As TOSM, type “Test message” in Internal Notes textarea.
2. Click **Send Message**.

**Expected**
- Button becomes disabled and shows `Sending...`.
- On success:
- Textarea clears.
- Internal messages list reloads.
- New message appears at top.
- “You” label is shown for own messages.
- Timestamp updated.

---

### Test Case 3.2 — Reject message send on empty input

**Steps**
1. Leave textarea empty.
2. Click **Send Message**.

**Expected**
- Send button stays disabled OR error shown.
- No API call is sent.

---

### Test Case 3.3 — Backend error while sending

**Steps**
1. Stop backend temporarily or force error.
2. Try to send message.

**Expected**
- Error banner:
Failed to send message
- Input preserved.
- No message added.

---

## Test Suite 4: Message Display Logic

### Test Case 4.1 — Show “You” for messages from currently logged staff

**Steps**
1. Login as TOSM.
2. Ensure messages include some sent by same TOSM.

**Expected**
- Messages show:
You
instead of username.

---

### Test Case 4.2 — Show username of the *other* staff member

**Steps**
1. Login as TOSM.
2. Ensure EM has written one message.

**Expected**
- Message shows:
em_username
---

### Test Case 4.3 — Messages appear in reverse chronological order

**Steps**
1. Send 2 private messages.
2. Reload page.

**Expected**
- Most recent one at the top (due to `flex-column-reverse` container).

---

## Test Suite 5: Internal vs Public Message Separation

### Test Case 5.1 — Public messages never appear in Internal Notes

**Steps**
1. Citizen or TOSM writes a public message in Public Messages panel.
2. Reload as TOSM or EM.

**Expected**
- Internal Notes panel continues to show ONLY private messages:
- `msg.isPrivate === true`

---

### Test Case 5.2 — Private messages never appear in Public Messages

**Steps**
1. Write private message as TOSM.
2. Reload as Citizen.

**Expected**
- Citizen sees **no private messages**.
- Only public messages appear in their chat.

---

## Test Suite 6: Assignment-Dependent Behavior

### Test Case 6.1 — TOSM loses access to internal notes when unassigned

**Steps**
1. As MPRO, reassign report to another TOSM.
2. Login again as first TOSM.
3. Open `/reports/{id}`.

**Expected**
- Internal Notes panel disappears.
- Page becomes full-width.

---

### Test Case 6.2 — EM loses access when removed as assigned maintainer

**Steps**
1. MPRO removes EM or assigns someone else.
2. Login as old EM.

**Expected**
- Internal Notes panel disappears.
- No messages or input shown.

---

## Test Suite 7: UI/UX Requirements

### Test Case 7.1 — Internal Notes collapsible behavior

**Steps**
1. Click the expand/collapse arrow.

**Expected**
- Panel collapses smoothly.
- Messages hidden when collapsed.

---

### Test Case 7.2 — Textarea usability

**Steps**
1. Type long multi-line messages.

**Expected**
- Textarea expands vertically.
- No overflow issues.

---

### Test Case 7.3 — Desktop and mobile layouts

**Steps**
1. Test desktop: ≥ 1024px.
2. Test mobile: 375px width.

**Expected**
- Right column stacks under main content on mobile.
- No horizontal scrolling.
- Messages remain readable.

---

## Test Suite 8: End-to-End Scenario

### Test Case 8.1 — Full TOSM ↔ EM communication workflow

**Steps**
1. MPRO assigns report to TOSM + EM.
2. TOSM opens `/reports/{id}`, writes private note.
3. EM opens `/reports/{id}`, replies internally.
4. TOSM refreshes page and continues conversation.

**Expected**
- Messages alternate correctly.
- Only TOSM and EM can see conversation.
- Timestamp and ordering correct.
- No public messages polluted.

---

## Known Limitations

- No real-time WebSocket updates; messages refresh only after sending or page reload.
- Internal message list loads only on initial page load or after sending.
- No typing indicators or read receipts.
- Collapse transition depends on Bootstrap; animation may vary depending on browser.

---

## Test Environment

- **Frontend:** React, Bootstrap, design-react-kit
- **Backend:** Java + Express-style routers
- **DB:** MySQL 8
- **Environment:** Docker Compose
- **Browser:** Chrome latest

---

# End of PT26 Manual Testing Document