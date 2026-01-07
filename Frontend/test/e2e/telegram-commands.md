# E2E UI Manual Testing – Telegram Bot Commands

## Overview

 This document provides **manual E2E UI testing procedures** for verifying the Telegram bot commands:
 - `/start`: Start the bot and view welcome message
 - `/newreport`: Start a new report submission flow
 - `/reportstatus <id>`: View details of a specific report
 - `/myreports`: List all reports submitted by the user
 - `/faq`: View frequently asked questions
 - `/help`: View help and available commands
 - `/verify` and `/verify CODE`: Link your Telegram account to your Participium profile
 - `/contact`: Get contact information for Municipality support

The tests are based on the current Telegram bot implementation and the UI/UX as shown in the provided screenshots.

---

## Preconditions

- Telegram bot is running and accessible
- User is registered and linked to the system (citizen role)
- At least one report has been submitted by the user
- Some reports are assigned, some are pending

**Test Date:** January 7, 2026  
**Application Version:** 1.0.0  
**Environment:** Docker Compose (Backend + Frontend + DB + Telegram Bot)  
**Telegram Client:** Desktop/Web/Mobile

---

## Test Suite 1: /reportstatus <id>

### Test Case 1.1: View Details of an Assigned Report

**Preconditions:**
- User has at least one report with status "Assigned" (e.g., Report #1)

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/reportstatus 1`
3. Observe the bot's reply

**Result:**
- The bot replies with a formatted message containing:
	- Report number and separator
	- **Title** (e.g., "adada")
	- **Category** (e.g., "Water Supply")
	- **Date** (e.g., "10/12/2025")
	- **Status** (e.g., "Assigned")
	- **Assigned to** (e.g., "staff1")
	- **Description** (e.g., "cascaca")
- The message uses clear icons and formatting (see screenshot)
- Timestamp is shown at the bottom (Telegram default)

---

## Test Suite 2: /myreports

### Test Case 2.1: List All Reports Submitted by the User

**Preconditions:**
- User has submitted multiple reports (at least one assigned, others pending)

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/myreports`
3. Observe the bot's reply

**Result:**
- The bot replies with a formatted list of all reports submitted by the user, including:
	- Report number (e.g., #4, #7, #8)
	- **Status** (e.g., "Assigned", "Pending") with appropriate icon
	- **Title**
	- **Category**
	- **Date**
	- **Assigned to** (if assigned)
- The total number of reports is shown at the top (e.g., "Your Reports (3 total)")
- A hint is shown at the bottom: `Use '/reportstatus <id>' to see details of a specific report.`
- Formatting and icons match the screenshot

---

## Test Suite 3: /faq

### Test Case 3.1: View Frequently Asked Questions (FAQ)

**Preconditions:**
- User is registered and linked to the system

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/faq`
3. Observe the bot's reply

**Result:**
- The bot replies with a formatted FAQ message containing:
	- A red question mark icon and the title "Frequently Asked Questions (FAQ)"
	- Numbered questions (1-7), each with a blue icon and bolded question
	- Clear, concise answers for each question, including:
		- What is Participium?
		- Who can submit a report?
		- How to verify Telegram account (with `/verify CODE` usage)
		- Anonymous report submission
		- Required information for a report (location, title, description, category, photo, visibility)
		- Photo upload limits (up to 3 per report)
		- Handling invalid verification codes
- Formatting, icons, and line breaks match the screenshot
- No extraneous information is shown

---

## Test Suite 4: /start

### Test Case 4.1: Start Bot and View Welcome Message

**Preconditions:**
- User is registered and linked to the system

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/start`
3. Observe the bot's reply

**Result:**
- The bot replies with a welcome message:
	- Waving hand emoji and personalized greeting (e.g., "Hello Luigi!")
	- Confirmation of verification ("You are verified!")
	- Suggestion to use `/newreport` to submit an issue
- Formatting and icons match the screenshot

---

## Test Suite 5: /verify

### Test Case 5.1: Verify Telegram Account (Already Linked)

**Preconditions:**
- User's Telegram account is already linked to their Participium profile

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/verify`
3. Observe the bot's reply

**Result:**
- The bot replies with a green checkmark and the message: "Your Telegram account is already linked."
- Formatting and icons match the screenshot


### Test Case 5.2: Verify Telegram Account (Not Yet Linked)

**Preconditions:**
- User's Telegram account is NOT yet linked to their Participium profile

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/verify`
3. Observe the bot's reply

**Result:**
- The bot asks for a verification code, with instructions to obtain it from the webapp profile page
- User can then send `/verify CODE` to complete the process
- Formatting and instructions are clear

---

## Test Suite 6: /contact

### Test Case 6.1: View Municipality Support Contact Information

**Preconditions:**
- User is registered and linked to the system

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/contact`
3. Observe the bot's reply

**Result:**
- The bot replies with a card containing:
	- Municipality Support title with building icon
	- Support message: "If you need help beyond this bot, you can contact the Municipality:"
	- Email address (clickable mailto link)
	- Phone number
	- Website (clickable link)
- Formatting, icons, and line breaks match the screenshot
- No extraneous information is shown

---

## Test Suite 7: /help

### Test Case 7.1: View Help & Commands List

**Preconditions:**
- User is registered and linked to the system

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/help`
3. Observe the bot's reply

**Result:**
- The bot replies with a help card containing:
	- SOS icon and the title "Help & Commands"
	- Introductory text: "Here's what you can do with this bot:"
	- List of main commands, each with:
		- Command name (e.g., `/newreport`, `/verify CODE`, `/status`, `/faq`, `/contact`) in blue and bold
		- Short description for each command, matching the screenshot
	- Info icon and tip at the bottom: "You can type back at any time while creating a report to go to the previous step."
- Formatting, icons, and line breaks match the screenshot
- No extraneous information is shown

---

## Test Suite 8: /newreport

### Test Case 8.1: Complete New Report Submission Flow

**Preconditions:**
- User is registered and linked to the system

**Steps:**
1. Open Telegram and start a chat with the Participium bot
2. Send the command: `/newreport`
3. Follow the guided steps as described below:
	- **Step 1/6 — Location:**
		- Click the location button and select/send the exact location using Telegram's Location attachment.
		- **Expected:** Bot confirms receipt and proceeds to next step.
	- **Step 2/6 — Title:**
		- Write a concise title for the issue directly in chat.
		- **Expected:** Bot confirms and proceeds to next step.
	- **Step 3/6 — Description:**
		- Write a detailed description for the issue directly in chat.
		- **Expected:** Bot confirms and proceeds to next step.
	- **Step 4/6 — Category:**
		- Choose the category from multiple choice buttons provided by the bot.
		- **Expected:** Bot confirms and proceeds to next step.
	- **Step 5/6 — Photos:**
		- Send between 1 and 3 photos (as Telegram attachments).
		- After sending each photo, bot replies with "Photo added (n/3). Send more or type done."
		- After sending up to 3 photos, type `done` to proceed.
		- **Validation:**
			- If more than 3 photos are sent, bot returns an error and does not proceed.
			- If `done` is typed before at least 1 photo is sent, bot returns an error and does not proceed.
	- **Step 6/6 — Visibility:**
		- Choose between two buttons: "anonymous" or "not anonymous" for report visibility.
		- **Expected:** Bot confirms selection.
4. After all steps, bot replies with a green checkmark and a message: "Your report has been created with id #<id>! Thank you."

**Result:**
- Each step is clearly separated and uses appropriate icons and formatting (see screenshots)
- Location, title, and description are entered as described
- Category and visibility are selected via buttons
- Photo step enforces 1-3 photo limit and requires explicit completion with `done`
- Error messages are shown for invalid photo count or premature `done`
- Final confirmation includes the new report ID and a thank you message
- Formatting, icons, and line breaks match the screenshots
- No extraneous information is shown




