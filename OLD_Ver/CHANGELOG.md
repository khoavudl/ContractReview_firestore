# Changelog

All notable changes to the **Contract Review System** will be documented in this file.

---

## [2026-09-17]
### Fixed
- **Single Threaded Multi-Recipient TO**: Consolidated multi-recipient TO lists (Legal and HOL teams) into a single comma-separated email dispatch rather than looping individual emails.
- **TO/CC Deduplication**: Automatically stripped CC recipients if already present in TO to eliminate duplicate notifications.
- **Enhanced Whitelist Filtering**: Added granular per-email parsing for comma-separated and array recipient lists in `sendEmail_`.

---

## [2026-09-16]
### Added
- **Non-blocking Asynchronous Email Flow**: Decoupled contract status updates from email sending. Backend returns `emailContext` and Frontend triggers `sendWorkflowEmail` in the background after unlocking the UI (~1s).
- **Direct Approved Doc Link**: Attached direct Google Doc link (`{contractId}_approved`) in the Head approval email for immediate WeSign submission.
- **Top-Right Toast Notification**: Fixed `#toast-container` CSS selector mismatch, positioned fixed at top: 24px, right: 24px with `z-index: 99999` to ensure visibility over Sidebar and Modals without page scrolling.
- **Workflow State Transition Email Triggers**: Integrated automatic email dispatch across all lifecycle stages (Draft→Legal, Legal→User, Legal→Head, Head Approve, Head Reject) with full CC support and safe testing whitelist (`EMAIL_WHITELIST`).

### Changed
- **Email Subject Standardization**: Changed subject line format to use `contractId` (`[Contract Review] ...: CTR-YYMM-XXXX`) instead of variable-length contract titles.
- **Terminology Normalization**: Standardized all references to "Head of Legal" instead of "Trưởng phòng / Trưởng phòng Pháp lý".
- **Email Compatibility**: Replaced gradient styling with HTML `bgcolor="#1a237e"` attribute and fallback background color for Microsoft Outlook desktop clients.
- **GAS Unicode Fix**: Removed raw Unicode emojis from email templates to eliminate `????` encoding artifacts in Gmail.

### Fixed
- **Users Sheet Column Mapping**: Corrected 0-indexed column access in `getUserEmail_` (index 1 / column B) and `getEmailsByRole_` (index 3 / column D).

---

## [2026-08-25]
### Optimized
- Increased search debounce to 800ms across Dashboard and Archived views.
- Isolated search input DOM element during status and list re-renders to preserve focus and Vietnamese IME buffer.

---

## [2026-08-24]
### Added
- Restricted contract file uploads strictly to Word formats (`.doc`, `.docx`) <= 10MB.
- Format validation safeguards in drag-and-drop and contract creation forms.

---

## [2026-08-21]
### Added
- Reference Files tab (`Tài liệu`) supporting multi-file attachments (PDF, Excel, Word, etc.) up to 10 files/case, 10MB/file.
- Automated file-level sharing permissions on Google Drive (`COMMENT` for contract docs, `VIEW` for reference files).
- Decoupled Archive DB from Dashboard stats calculation for 0ms tab switching.
