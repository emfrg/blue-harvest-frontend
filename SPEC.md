# Mortgage pricing exceptions — frontend specification

## Revision history

| Revision | Timestamp (Europe/Amsterdam) | Changes and reason | Author | Review |
|---|---|---|---|---|
| 0.1 | 2026-11-08 10:01:01 +01:00 | Initial frontend requirements for submission, review, history and current approval. | Codex, for project-author review | Approved by project author |
| 0.2 | 2026-11-09 08:45:42 +01:00 | Recorded the 8 November UI decisions: user selection at sign-in, fixed session identity, newest-first history and focused application screens without walkthrough controls. Established the backend API as the source of records and available choices. | Codex, following project-author instruction | Approved by project author |
| 0.3 | 2026-11-09 09:34:39 +01:00 | Required failed refreshes to preserve unsent form input through recovery. | Codex, following project-author instruction | Approved by project author |
| 0.4 | 2026-11-09 10:02:05 +01:00 | Added repeatable quality checks, commit hooks, browser tests and separate real-API verification. | Codex, following project-author instruction | Approved by project author |
| 0.5 | 2026-11-09 14:28:57 +01:00 | Rewrote UI-FR-01 to UI-FR-12 and UI-QR-01 to UI-QR-04 as required frontend behaviour. Clarified the boundary with backend business rules and updated UI-AC-01 to UI-AC-12 to retain the interaction and display criteria. Requirement IDs are unchanged. | Codex, following project-author feedback | Approved by project author |

Start with the [main project](https://github.com/emfrg/blue-harvest-assignment).
This repository implements the optional browser interface for the Blue Harvest
Agentic SDLC Engineering Assignment.

The [backend specification](https://github.com/emfrg/blue-harvest-assignment/blob/main/SPEC.md)
defines the business rules, permissions and request lifecycle. The
[API reference](https://github.com/emfrg/blue-harvest-assignment/blob/main/API.md)
defines the HTTP contract. This document adds the frontend requirements and
their acceptance checks; backend rules remain authoritative.

This project uses **spec-driven development (SDD)**: agree the required behaviour
in a written specification, then use it to guide design, implementation and
testing. Approved frontend requirement changes are recorded here before
implementation.

## 1. Purpose and boundaries

This specification covers user interaction, record visibility and feedback
about loading, confirmed results and failures. The backend specification governs
request validation, permissions, request transitions, retry semantics and the
current approved discount. The frontend presents the API results; it does not
make those business decisions.

The interface has five screens: sign-in, application selection, application
overview, request submission, and request details with reviewer actions.
Users and applications come from the backend. Sign-in selects an existing user
for a local session in one browser tab; it does not authenticate that person.

User or application management, editing or deleting requests, production
authentication and cloud deployment are outside this frontend's scope.

## 2. User scenarios

| ID | User story | Independent check |
|---|---|---|
| UI-US-01 | As a relationship manager, I want to submit a discount request for review. | Submit through the form and inspect the saved request. |
| UI-US-02 | As a reviewer, I want to approve a pending request. | Approve from its details page and inspect the result. |
| UI-US-03 | As a reviewer, I want to decline a pending request. | Decline from its details page and inspect the result. |
| UI-US-04 | As a relationship manager, I want to check a request's status. | Open requests in each status. |
| UI-US-05 | As a reviewer, I want to inspect an application's history and current approved discount. | Open an application and follow its request links. |
| UI-US-06 | As an internal user, I want to choose my user at sign-in and keep that identity until sign-out. | Sign in, choose an application, reload and sign out. |

## 3. Requirements

### Functional requirements

| ID | Required behaviour |
|---|---|
| UI-FR-01 | The interface must require selection of an available backend user before displaying application records or actions, and retain the selected identity until sign-out or its removal from the backend. |
| UI-FR-02 | Application navigation must allow a signed-in user to open any application returned by the API and return to the application list through the header. |
| UI-FR-03 | The interface must reload application history and current approval using the selected identity on entry, on Refresh, on returning to the tab and after a confirmed submission or decision. |
| UI-FR-04 | The application overview must display the application ID, all returned requests in descending request-ID order and the approved discount returned by the API with a link to its request, or explicitly indicate empty history or no approval. |
| UI-FR-05 | Request details must display the API's submission and decision information as read-only, including the full reason, discount, status, IDs, actors and UTC timestamps, or explicitly indicate that no decision has been recorded. |
| UI-FR-06 | The interface must provide relationship managers with a form for the requested discount in basis points and reason for the selected application, opening the saved request only after API confirmation. |
| UI-FR-07 | The interface must offer approve and decline controls only when the selected user is a reviewer and the displayed request is pending. |
| UI-FR-08 | The interface must show loading or saving progress and prevent repeated submission or decision actions while their response is pending. Responses for a previous page or identity must not replace the current view. |
| UI-FR-09 | The interface must distinguish invalid input, missing records, denied access, conflicts and unavailable service, retaining unresolved errors and entered values through recovery. Failed reads must offer retry. |
| UI-FR-10 | An unconfirmed submission must remain unresolved in the interface until an API response confirms its outcome, with a retry available to the original user under the API contract. |
| UI-FR-11 | After a conflicting or unconfirmed decision response, the interface must reload and display the saved status before offering another decision. |
| UI-FR-12 | The interface must acknowledge a confirmed successful action with a dismissible toast that expires four seconds after the latest success, without moving content or taking focus. |

### Quality requirements

| ID | Requirement | Verification approach |
|---|---|---|
| UI-QR-01 | Controls must be operable by keyboard, with visible input labels, textual status indicators and accessible notifications. | Complete the flows by keyboard and inspect labels, status text and notifications. |
| UI-QR-02 | Navigation, forms and records must remain readable and operable at desktop and mobile widths. | Inspect navigation, forms and records at both widths. |
| UI-QR-03 | TypeScript, lint and build checks must pass. Installed TypeScript and lint hooks must block failing commits without rewriting source files. | Run the documented checks and exercise the hook. |
| UI-QR-04 | Browser checks must be repeatable and identify whether they use prepared API responses or a real backend. Checks that write records must use disposable data. | Run the browser suites and a real-backend walkthrough; record which was used. |

## 4. Acceptance scenarios and behaviour checklist

These checks concern the interface's handling of backend data and responses.
The backend specification covers validation policy, request transitions,
concurrency and persistence.

| ID | Given / when | Expected result | Requirements |
|---|---|---|---|
| UI-AC-01 | A user signs in, opens an application, follows the header navigation and reloads. Include users and applications beyond the sample IDs. | The sign-in dropdown shows all returned users by ID and role. The selected identity remains visible and fixed; reload uses its current backend role. All returned applications are selectable. Applications and the complete Discount requests / Mortgage pricing logo return to the list. | UI-FR-01, UI-FR-02, UI-FR-03 |
| UI-AC-02 | A user signs out, then uses Back or opens a working URL. Separately reload after the selected user has been removed. | Sign-in appears without records or actions under the previous identity. The logo leads to sign-in while signed out. | UI-FR-01, UI-FR-02 |
| UI-AC-03 | A manager submits the form. Separately enter invalid fields or return a rejection from the API. Check form visibility as a reviewer. | Only managers have a submission form. Invalid fields are identified before sending. An API rejection is explained and the entered values remain editable. A confirmed submission opens the saved request. | UI-FR-06, UI-FR-09 |
| UI-AC-04 | A reviewer selects approve or decline on a pending request. Inspect the page as a manager and after an API-confirmed decision. | Decision controls appear only for reviewers on pending requests. After confirmation, the displayed status, reviewer, decision time and current approval match the API results. | UI-FR-03, UI-FR-05, UI-FR-07 |
| UI-AC-05 | A user opens an application and its requests in each status. Also return empty history and no approval from the API. | History is newest first by request ID. Details and current approval match the API; submitted fields cannot be edited. Empty results and undecided requests are explicit. Activity is newest first, with the latest event blue and earlier events gray, without a Latest label. Times use UTC. | UI-FR-04, UI-FR-05 |
| UI-AC-06 | A manager submits in one tab. A reviewer refreshes or focuses another tab and decides. The manager then refreshes. | Both tabs display the request and decision returned by the API while retaining their own selected identities. | UI-FR-01, UI-FR-03, UI-FR-07 |
| UI-AC-07 | An API response is delayed while a user repeats a submission or decision action, or navigates before a read finishes. | Loading or saving is visible, repeated clicks send no additional submission or decision while the response is pending, and an obsolete response cannot replace the current view. No success is shown without confirmation. | UI-FR-08, UI-FR-12 |
| UI-AC-08 | The API returns empty user or application lists, a read fails, access is denied, or a record is missing. Check each case separately. | Empty choices and errors are distinct. Unavailable choices cannot be selected. The interface shows the failure and offers retry for failed reads without displaying invented results. | UI-FR-01, UI-FR-02, UI-FR-09 |
| UI-AC-09 | A manager enters a draft, a refresh fails, and a retry succeeds. Separately leave the form or sign out. | The working page stays unavailable until its records load. Recovery restores the same input. Leaving or signing out clears an ordinary unsent draft. | UI-FR-09 |
| UI-AC-10 | A submission response is lost. Reload or sign out, then return as the original user and retry. | The attempt remains visibly unconfirmed across reload and sign-out. Its original identity, values and retry key are retained for retry. New submissions in that tab remain unavailable until the attempt is resolved; other users can still read records but cannot retry it. | UI-FR-08, UI-FR-10 |
| UI-AC-11 | The API rejects a decision because another reviewer decided first, or the decision response is lost. | The interface explains the conflict or uncertainty and reloads the saved status without claiming success. Decision controls return only if the refreshed request is pending and the selected user is a reviewer. | UI-FR-07, UI-FR-11 |
| UI-AC-12 | An action, including Refresh, succeeds. Repeat before the toast expires. Separately trigger a failure. | Each confirmed success restarts the four-second toast. It can be dismissed without moving content or taking focus. An unresolved error remains visible. | UI-FR-09, UI-FR-12 |
