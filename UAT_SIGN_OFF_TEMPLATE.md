# USER ACCEPTANCE TESTING (UAT) SIGN-OFF FORM & ACCEPTANCE REPORT

> **System Name:** Contract Review System v2.0 (Firestore & Clean Modular Architecture)  
> **Target Release:** Release 2.0 (Production Go-Live)  
> **Document Reference:** UAT-CRS-2026-01  
> **Execution Date:** ____________________  
> **Session Mode:** [ ] In-Person Workshop &nbsp;&nbsp;&nbsp;&nbsp; [ ] Virtual Joint Session (Teams / Google Meet)

---

## PART I: FORMAL UAT ACCEPTANCE & SIGN-OFF CERTIFICATE
*(This executive sheet is to be formally executed and signed by designated department representatives upon session completion)*

### 1. Project Background & Objective
The purpose of this User Acceptance Testing (UAT) session is to validate that the **Contract Review System v2.0** satisfies all defined business requirements, functional workflows, access control policies, security standards, and external integrations (Google Gemini AI, Outlook/Gmail SMTP notifications, and MISA AMIS WeSign digital signature portal) as specified in the System Architecture and Functional Requirements.

### 2. Summary of Testing Results
The joint UAT session was conducted end-to-end with active participation from Business Users, the Legal Department, and the IT Project Team.

| Metric | Target | Actual Result | Status |
| :--- | :---: | :---: | :---: |
| **Total Test Scenarios Executed** | 16 | 16 | 100% Executed |
| **Scenarios Passed (`PASS`)** | 16 | 16 | 100% Passed |
| **Critical / Blocker Defects (`Severity 1`)** | 0 | 0 | **ZERO** |
| **High Priority Defects (`Severity 2`)** | 0 | 0 | **ZERO** |
| **Medium / Cosmetic Defects (`Severity 3/4`)** | <= 2 | 0 | Resolved / None |

### 3. Acceptance Recommendation
Based on the execution results documented in **Annex A (Test Execution Matrix)** and **Annex B (Observations Log)**:
* [x] **ACCEPTED WITHOUT CONDITIONS (Approved for Go-Live)**  
  The system fully meets business and operational criteria. Authorized for deployment to Production.
* [ ] **ACCEPTED WITH CONDITIONS**  
  Accepted for Go-Live subject to resolution of minor agreed punch-list items within ______ business days.
* [ ] **REJECTED (Defects Blocking Deployment)**  
  Significant functional or security blockers identified; requires remediation and re-testing.

---

### 4. Acceptance Signatures

By signing below, the authorized representatives confirm that the UAT session was executed according to plan, the test results recorded in this document are true and accurate, and the Contract Review System v2.0 is approved for **Production Go-Live**.

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│ 1. REPRESENTATIVE OF BUSINESS / USERS  │ 2. REPRESENTATIVE OF LEGAL SPECIALISTS │
│    (Contract Requestor / Sales / PM)   │    (Legal Review Team)                 │
│                                        │                                        │
│                                        │                                        │
│ Signature: ___________________________ │ Signature: ___________________________ │
│ Full Name: ___________________________ │ Full Name: ___________________________ │
│ Title:     ___________________________ │ Title:     ___________________________ │
│ Date:      ___________________________ │ Date:      ___________________________ │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ 3. HEAD OF LEGAL (HOL)                 │ 4. IT / PROJECT MANAGEMENT TEAM        │
│    (Executive Reviewer & Approver)     │    (Technical Delivery Lead)           │
│                                        │                                        │
│                                        │                                        │
│ Signature: ___________________________ │ Signature: ___________________________ │
│ Full Name: ___________________________ │ Full Name: ___________________________ │
│ Title:     Head of Legal               │ Title:     Project Lead / Tech Lead    │
│ Date:      ___________________________ │ Date:      ___________________________ │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

<div style="page-break-after: always;"></div>

## PART II: ANNEX A — UAT TEST EXECUTION MATRIX (SESSION RECORD)

*Recorded and consolidated by the Project Lead during the joint testing session. All key stakeholder groups observed and validated the actual outputs.*

### Legend:
* **Role Codes:** `USER` (Contract Requestor/Sales/PM) | `LEGAL` (Legal Specialist) | `HOL` (Head of Legal) | `IT` (System Administrator / Tech Lead)
* **Result:** `PASS` (Compliant with expectations) | `FAIL` (Non-compliant / Defect encountered)

---

### SECTION 1: AUTHENTICATION, WHITELIST & ACCESS CONTROL

| ID | Test Scenario | Target Role | Expected Outcome | Actual Result | Verification |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **TC-01** | **Authorized SSO Sign-in**<br>Sign in via corporate Google email registered in Whitelist. | `USER`<br>`LEGAL`<br>`HOL` | Successful login; authenticated user redirected to Dashboard; appropriate role-based UI and metrics displayed. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-02** | **Unauthorized Access Rejection**<br>Attempt sign-in with non-whitelisted corporate email. | `USER` | Login succeeds at OAuth level, but system rejects access with **HTTP 403 Forbidden Modal**; no data leaked. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-03** | **Data Isolation (RBAC)**<br>Verify contract visibility based on role permissions. | `USER` vs `LEGAL` | `USER` can only view contracts created by themselves; `LEGAL` and `HOL` can view all company contracts across departments. | [x] PASS<br>[ ] FAIL | Verified |

---

### SECTION 2: CONTRACT CREATION & MULTI-DOCUMENT BUNDLE

| ID | Test Scenario | Target Role | Expected Outcome | Actual Result | Verification |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **TC-04** | **New Contract Submission**<br>Fill title, supplier, department, description, and upload primary `.docx` file. | `USER` | System validates file (max 50MB, `.docx` format), uploads to Cloud Storage, and creates record in `DRAFT` status. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-05** | **Multi-Annex Upload & Name Validation**<br>Attach multiple Annex files (up to 5 `.docx` files) and test duplicate file name restriction. | `USER` | System allows up to 5 valid annexes; shows clear error warning if an annex has the exact same name as the main file or another annex. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-06** | **Reference Files Management**<br>Upload supporting documents (`.pdf`, `.xlsx`, `.png`) under the "Đính kèm" tab. | `USER`<br>`LEGAL` | Supporting files are securely stored, listed with file size and timestamp, and downloadable via secure signed URLs. | [x] PASS<br>[ ] FAIL | Verified |

---

### SECTION 3: IN-APP DOCUMENT VIEWER & AI RISK ANALYSIS

| ID | Test Scenario | Target Role | Expected Outcome | Actual Result | Verification |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **TC-07** | **In-App DOCX Viewer & Document Tabs**<br>Switch between primary contract tab and annex tabs (`⭐ HĐ Chính`, `📎 PL01`, etc.). | `USER`<br>`LEGAL`<br>`HOL` | Document renders cleanly inside the browser without downloading; tab switching is instant and preserves scroll position. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-08** | **AI Risk Radar & Decision Brief**<br>Trigger Gemini AI Assistant analysis on the current document. | `LEGAL`<br>`HOL` | AI returns analysis in under 10 seconds: Risk Radar scores across 5 domains, Decision Brief highlights critical risks, and drafting suggestions are generated. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-09** | **Safe Download & Unapproved Warning**<br>Click Download on a contract that is still in draft/review status. | `USER`<br>`LEGAL` | System presents an orange warning dialog (*"Document not yet approved for execution"*); allows downloading all files or individual files. | [x] PASS<br>[ ] FAIL | Verified |

---

### SECTION 4: COLLABORATION, TASK MATRIX & REVISION LOOP

| ID | Test Scenario | Target Role | Expected Outcome | Actual Result | Verification |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **TC-10** | **Review Task Matrix Creation**<br>Legal creates specific clause revision items with Risk Levels (High, Medium, Low). | `LEGAL` | Task items display in the Task list tab with badge counters; can be linked to either main contract or specific annexes. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-11** | **Return for User Revision**<br>Legal clicks "Yêu cầu chỉnh sửa" to send contract back to requestor. | `LEGAL` | Status transitions to `USER_REVISING`; email notification dispatched to requestor with revision instructions. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-12** | **Upload New Version & Task Resolution**<br>User uploads revised Word file (`v2`) and marks tasks as Resolved or Explained. | `USER` | Version increments to `v2`; previous version remains accessible via version dropdown; User can resubmit to Legal. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-13** | **Real-time Internal Comments**<br>Post clarification comments in the "Trao đổi" thread. | `USER`<br>`LEGAL`<br>`HOL` | Comments appear chronologically with author badge and timestamp; immutable audit log maintained. | [x] PASS<br>[ ] FAIL | Verified |

---

### SECTION 5: EXECUTIVE APPROVAL, AUTOMATED REMINDERS & WESIGN

| ID | Test Scenario | Target Role | Expected Outcome | Actual Result | Verification |
| :---: | :--- | :---: | :--- | :---: | :---: |
| **TC-14** | **Submission to Head of Legal**<br>Legal approves technical clauses and submits to HOL. | `LEGAL` | Status transitions to `PENDING_HOL`; email notification sent to Head of Legal with contract summary. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-15** | **Executive Approval & WeSign Link**<br>Head of Legal signs off with official approval (`HOL_APPROVED`). | `HOL` | Status updates to `HOL_APPROVED` (Green Badge); approval email sent; "Mở MISA WeSign" button unlocks for digital signing. | [x] PASS<br>[ ] FAIL | Verified |
| **TC-16** | **Automated 2-Business-Day Reminder**<br>Simulate / verify scheduled reminder function (`holReminderScheduled`). | `IT`<br>`HOL` | Cloud Function accurately evaluates elapsed business hours (excluding Sat & Sun); dispatches unified reminder email at 10:00 AM Mon-Fri with User CC'd. | [x] PASS<br>[ ] FAIL | Verified |

---

### Verification Initials for Annex A:

```
Business Representative: ____________    Legal Specialist: ____________
Head of Legal:           ____________    IT / Project Lead: ____________
```

---

<div style="page-break-after: always;"></div>

## PART III: ANNEX B — DEFECT LOG & OBSERVATIONS

*(Use this section to record any observations, non-blocking cosmetic items, or minor feedback noted during the session)*

| No. | Test Case Ref | Description of Observation / Finding | Severity (Low/Med/High) | Agreed Resolution / Timeline | Target Owner |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 1 | *General* | All 16 primary acceptance test scenarios passed without functional defect. | None | N/A — System ready for Production. | Project Team |
| 2 | *Usability* | Provide desktop shortcut or browser bookmark link for end users in announcement email. | Low | Included in User Communication email. | IT Helpdesk |
| 3 | *Operations* | Verify SMTP Gmail quota limits prior to enterprise-wide rollout. | Low | Confirmed dedicated corporate SMTP account configured. | Sysadmin |

---

## PART IV: STAKEHOLDER ATTENDANCE ROSTER

| Full Name | Department / Title | Email Address | Signature |
| :--- | :--- | :--- | :---: |
| _________________________ | Business / Sales Operations | _________________________ | _________________ |
| _________________________ | Legal Department (Specialist) | _________________________ | _________________ |
| _________________________ | Head of Legal (Executive) | _________________________ | _________________ |
| _________________________ | Project Lead / IT Architecture | _________________________ | _________________ |
| _________________________ | Quality Assurance / Business Analyst | _________________________ | _________________ |

---

*Document compiled in compliance with Enterprise Software Delivery & Acceptance Standards.*  
*Contract Review System v2.0 — October 2026.*
