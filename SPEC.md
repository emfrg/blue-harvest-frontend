# Mortgage pricing exception interface — specification

## Sources and preparation

The source of the requested capabilities is *Blue Harvest Agentic SDLC Engineering Assignment*. Its UI bonus covers creating, reviewing and inspecting pricing exception requests.

The structure follows the backend's adaptation of [GitHub Spec Kit's feature-specification template](https://github.com/github/spec-kit/blob/ba8363f8ab56b2da456a81299cfdbfee1ef7b871/templates/spec-template.md), linking user stories, requirements and acceptance scenarios. Spec Kit's CLI is not used.

Business rules and roles come from the [backend specification, revision 1.6](https://github.com/emfrg/blue-harvest-assignment/blob/9ce0a64e3d0b02c2fd594c0623806fd606a8b684/SPEC.md). Integration follows the [API contract, revision 0.6](https://github.com/emfrg/blue-harvest-assignment/blob/9ce0a64e3d0b02c2fd594c0623806fd606a8b684/API.md).

Codex assisted with drafting and checking; the project author directs the scope and reviews the requirements.

On 2026-11-08, the author requested a local sign-in flow that selects an available user, corrected request ordering and application screens without demonstration or walkthrough controls. This specification sets newest-first ordering and refines the previously selected focused-page layout; the service's mortgage business rules remain unchanged.

## 1. Purpose and boundaries

This specification covers a browser interface for submitting, reviewing and inspecting mortgage pricing exception requests.

The frontend has its own repository and dependencies. It uses only the existing HTTP API. Removing it leaves the backend and saved records intact.

Application and user management, request editing, deletion and withdrawal, a global review queue, production authentication, deployment, charts and AI chat are outside scope.

A local sign-in screen is in scope. It selects an existing user for a session, with the role taken from that user's record; it does not introduce passwords, account creation or a new authentication service. The frontend now uses the existing backend for all request records and decisions. It does not maintain a browser request database, generate request IDs or timestamps, or reproduce the service’s business rules. The approved screens and styling remain.

## 2. Domain concepts and assumptions

### Domain concepts

| Concept | Meaning |
|---|---|
| Mortgage application | An existing application identified by an application ID. |
| Request | Its ID, application ID, discount, reason, submitter, submission time and status. |
| Discount | A reduction expressed in basis points; one basis point equals 0.01 percentage points. |
| Decision | The outcome, reviewer ID and decision time; absent while the request is pending. |
| Current approved discount | The applicable discount and request ID returned by the service. |
| Retry key | An identifier used by the service to recognise a repeated submission. |
| Uncertain submission | A submission sent without receiving a response confirming acceptance or rejection. |
| Local session | The identity chosen on the sign-in screen, retained in the same browser tab until sign-out or the tab is closed. |

### Local demonstration assumptions

The service supplies sample applications and both user roles. The identity selected at sign-in is trusted locally. Both applications run locally without paid services.

### Sign-in and navigation

An unsigned-in visitor sees a dedicated **Sign in** page with one visibly labelled **User** dropdown and a **Sign in** button. The dropdown requires a selection and displays every user returned by `GET /demo/users`, labelled with their ID and role. The supplied seed data includes users 1 and 2 as relationship managers and users 3 and 4 as reviewers; these are examples, not a fixed frontend list. Sign-in uses the selected user's ID and existing role; there is no separate role selector. The interface does not create users or silently change recorded submitters or reviewers.

After sign-in, the person reaches **Open an application** and selects an available application from the list. Each list entry identifies the application by ID and opens its overview directly. There is no manual application-ID field or separate **Open application** button. The interface must not automatically select or open an application. An **Applications** navigation link returns to this selection screen.

The header uses the approved name **Discount requests**, with **Mortgage pricing** underneath and the existing arrow mark alongside it. The mark and both text lines form one link with a single clickable area and keyboard focus target. Hovering anywhere in the group highlights the whole group with one subtle rounded background; keyboard focus uses the same background and a visible outline around the group. Do not underline only the title. While signed in, clicking anywhere in that group opens Applications without changing the session. While signed out, it leads to Sign in. Keep the existing colours and typography and the separate Applications navigation link.

The sign-in dropdown loads `GET /demo/users` without an identity header. After sign-in, the application screen loads `GET /demo/applications` with the selected user’s `X-User-Id`. Both lists display the returned records in service order, including users and applications added beyond the seed data. Keep role values from the API (`RELATIONSHIP_MANAGER` or `REVIEWER`) and translate them only for display. There are no hardcoded user IDs, application IDs or fallback lists in the frontend.

Load users when the app starts and when signing out to choose another user; load applications when entering the application selection screen. While loading, show progress and prevent selecting unavailable choices. An empty response shows **No users available** or **No applications available**, with sign-in disabled when there are no users. A failed read shows an error and **Try again**, never a fabricated list or a successful empty result. Ignore responses from reads cancelled after navigation, sign-out or a newer read.

The signed-in identity and role are visible as read-only information, with **Sign out**. There is no identity or role selector on application, form or request pages. Changing user requires signing out and signing in again, including when both users have the same role. Direct navigation to a working page without a session returns to sign-in. Signing out removes access to those screens, including through the browser Back button, until another sign-in. This is local navigation behaviour, not a claim of production security.

Refreshing the same tab retains the selected user ID and looks up that user and their current role in the returned user list. If the stored ID is no longer present, clear that selection and show sign-in; never substitute another user. If the list cannot be loaded, show the read error and allow retry before displaying working records. Signing out clears that session and its ordinary unsent form draft, but not submitted requests or decisions. An unresolved submission is preserved separately, with its original identity and values; another identity cannot retry it. The original identity must sign in again to resume that submission. Other signed-in users may still inspect application history, and new submissions remain blocked while the attempt is unresolved.

All requests, statuses, timestamps, decisions and approved discounts come from the API. Each tab remembers its selected user and sends that ID in X-User-Id. Opening an application, pressing Refresh, returning focus to its tab, and completing a confirmed write reload the service records. There is no polling or client-side record synchronization. Old browser-only demonstration records are ignored and are not imported into the backend. Browser storage may retain only the selected identity and one unresolved submission’s original identity, body and retry key, as required for a safe retry; it is never used as the request history.

### Application presentation

The approved focused-page structure remains: application selection, application overview, new-request form and request details. Keep its professional colours, typography and control styling, adjusting the specific layout elements described here.

- Screens are compact workspaces for internal staff. Use restrained headings, aligned fields and tables, and ordinary task buttons. Do not use hero sections, oversized summary numbers, promotional calls to action or panels encouraging the user to take a next step. Keep helpful validation and concise feedback about actions they performed.
- Successful actions, including Refresh, use a compact dismissible toast that disappears after four seconds and does not move the page content. Announce it politely without taking keyboard focus. Each new success restarts the timer. Failures remain visible beside the affected task until dismissed, retried or left; do not hide unresolved errors on a timer.
- A failed application refresh, including one triggered by returning to the tab, must preserve an unsent form's entered values in memory. Show the read error and **Try again** while keeping the working page unavailable until both reads succeed; retrying restores the same draft. Do not add browser draft storage. Signing out or leaving the form still discards an ordinary unsent draft.
- An application overview identifies the application and gives relationship managers one **New request** button in its action bar. Reviewers see **Review** on a pending request's table row. Both roles can inspect every request and refresh the records. Form submission and decision buttons belong beside the corresponding form or request; do not repeat them in banners or unrelated page sections.
- Current approval is a compact summary with the approved discount and a link to its source request together. It must remain clearly distinct from a new request's proposed discount.
- Request history displays all returned records **newest first, by descending request ID**. For example, requests 101, 102 and 103 appear as 103, 102 and 101. Sorting does not change status, filter out earlier requests or determine which discount is currently approved; the service supplies current approval separately.
- Request activity reads chronologically from bottom to top: the latest recorded event appears at the top. An approval or decline appears above its submission. Use blue for the latest event's marker and heading and gray for earlier events. Do not add a **Latest** label; ordering and timestamps show the sequence. For a pending request, submission is the latest recorded event; show awaiting-decision status separately without inventing a decision event or timestamp.
- Use ordinary navigation, field labels, statuses and useful inline validation. Remove the header's **Demo user** selector, demonstration-labelled shortcuts, mockup footer, walkthrough-style **Next step**, **Need a different discount?** or **After you submit** panels, and repeated explanatory history/approval copy. The available-application list is a normal navigation control. Keep concise form help where it helps someone enter a valid value. Empty states should state what is missing without repeating actions already available on the page.
- The request page still shows the full original reason, submission fields and decision fields. Decisions belong to that displayed request. Implementation details and sample-data limitations belong in project documentation, not in the working screen's footer or success messages.

### Submission validation

The request uses the selected application's ID. The form requires a positive whole-number discount in basis points and a non-blank reason. The service checks application existence and business rules. Invalid or missing records opened through direct URLs must still show the appropriate error. No product-specific ceiling is added.

### Access rules

| Action | Permitted role |
|---|---|
| Submit a request | Relationship manager |
| Approve or decline | Reviewer |
| Read requests, history or the current approved discount | Either role |

The interface offers these actions by role; the service enforces permissions.

## 3. User scenarios

The five backend user stories apply to the interface, with one frontend story for entering and leaving the application. Prepared records support independent checks.

| ID | User story | Independent check |
|---|---|---|
| UI-US-01 | As a relationship manager, I want to submit a discount request so that a reviewer can consider it. | Submit valid details and inspect the pending request (AC-03). |
| UI-US-02 | As a reviewer, I want to approve a pending request so that its exact discount is authorised for use. | Approve a request and inspect the current discount (AC-06). |
| UI-US-03 | As a reviewer, I want to decline a pending request so that it does not authorise a discount. | Decline a request and inspect its outcome (AC-07). |
| UI-US-04 | As a relationship manager, I want to check a request’s status so that I know whether it is awaiting a decision. | Open pending, approved and declined requests (AC-08). |
| UI-US-05 | As a reviewer, I want to inspect an application’s request history so that I can trace how its current approved discount was reached. | Inspect history and current approval (AC-09 to AC-11). |
| UI-US-06 | As an internal user, I want to select my user at sign-in and keep that identity until I sign out, so that my actions belong to the correct person. | Sign in, open an application, refresh, sign out and sign in as another available user (AC-19 to AC-22). |

## 4. Business decisions

The [backend business decisions](https://github.com/emfrg/blue-harvest-assignment/blob/9ce0a64e3d0b02c2fd594c0623806fd606a8b684/SPEC.md#4-business-decisions) remain unchanged: immutable submissions, one pending request per application and one final decision per request. Only a later approval replaces the current discount.

User-visible session, presentation and recovery behaviour is specified here. Component structure belongs in the implementation plan. The author requested a clean restart on 2026-11-08 using the sibling backend API.md and SPEC.md, with straightforward code they can explain line by line. The earlier browser-record store and its recovery approach are superseded.

## 5. Requirements

### Functional requirements

All IDs below refer to this specification.

| ID | Required behaviour |
|---|---|
| UI-FR-01 | Each mortgage operation must use the signed-in identity shown for that operation. |
| UI-FR-02 | The signed-in identity and role must be visible as read-only context, with the application ID alongside the relevant actions and records. Working pages must not offer an identity or role switcher. |
| UI-FR-03 | Submitting a request as a relationship manager must open the saved request after service acceptance. |
| UI-FR-04 | The form must prevent submission of inputs that fail the validation rules in section 2. |
| UI-FR-05 | A rejected submission must leave the entered values available for correction. |
| UI-FR-06 | The request view must display the fields defined in section 2, explicitly identifying pending requests as undecided. |
| UI-FR-07 | The interface must allow a reviewer to approve only the displayed pending request. |
| UI-FR-08 | The interface must allow a reviewer to decline only the displayed pending request. |
| UI-FR-09 | Submitted request details must remain read-only in every status. |
| UI-FR-10 | Application history must show all returned requests in descending request-ID order (newest first), or an explicit empty result. This display order must not change the current approval. |
| UI-FR-11 | The approval view must show the service's current discount and request ID, or no approval. |
| UI-FR-12 | Retrying an uncertain submission must reuse its original identity, retry key and submitted values, including after refreshing the same tab or signing out and back in. Only a session for the original identity may retry it. |
| UI-FR-13 | An uncertain submission must prevent new submissions while its preserved details and application history remain accessible to signed-in users. Signing out must not discard the preserved attempt. |
| UI-FR-14 | Repeated submission actions must not send additional calls while a response is pending. |
| UI-FR-15 | The interface must distinguish service-confirmed success or rejection from an unknown outcome after a lost response. |
| UI-FR-16 | History and current approval must reload after a confirmed submission, confirmed decision or user-requested refresh. |
| UI-FR-17 | Failures must identify invalid input, missing records, denied access, conflicts or an unavailable service. |
| UI-FR-18 | Pending operations must show an in-progress state. |
| UI-FR-19 | After a decision conflict or lost response, saved status must be retrieved before another decision is offered. |
| UI-FR-20 | The local sign-in page must require selection of an existing user from a labelled dropdown, with each user's role shown. All users returned by the public user-list endpoint must be available, including records beyond the supplied seed data. Sign-in establishes that user's identity and role and opens the application selection screen; it must not automatically select an application. |
| UI-FR-21 | Sign-out must end the session and return to sign-in. Without a session, working pages must not display records or offer actions, including through direct URLs or browser Back navigation. Changing user requires a new sign-in even when the role is the same. |
| UI-FR-22 | The signed-in session must survive same-tab reloads. Sign-out clears ordinary unsent drafts, while submitted records and unresolved attempts remain intact. |
| UI-FR-23 | The backend is the sole source of request records and decisions. Read through the documented API; use service-generated IDs, timestamps and approved discounts. Refresh and tab focus reload records. Do not persist, seed, migrate, lock or reconcile a browser request database. |
| UI-FR-24 | Working screens must follow the application presentation in section 2: compact information, clear navigation and role-appropriate task controls, without promotional calls to action, oversized summary numbers, duplicated actions, demo selectors, demonstration-labelled shortcuts, walkthrough panels or mockup messages. |
| UI-FR-25 | The entry screen loads and lists every application ID returned by the service for the signed-in identity, including applications without requests, for either role. Each entry opens its overview directly, without manual ID entry or a separate open button. The service checks application existence. |
| UI-FR-26 | Request activity must show recorded events newest first, with the latest event highlighted in blue and earlier events gray, without a Latest label. Pending requests show submission as the sole recorded event and must not show an unrecorded decision as an activity event. |
| UI-FR-27 | Show successful action feedback in a dismissible, politely announced toast that expires after four seconds without shifting content or taking focus. Restart expiry for each new success. Keep unresolved failures visible rather than automatically dismissing them. |
| UI-FR-28 | User and application choices must come only from the documented list endpoints, with their required identity headers. Show loading, empty and retryable error states; cancel obsolete reads. Restore a selected user from the returned list on reload, taking its current role, and return to sign-in if that user no longer exists. |
| UI-FR-29 | An application refresh failure must preserve ordinary unsent form input in memory, whether triggered by Refresh or tab focus. Keep the working page unavailable through failed and pending retries, and restore it with the same input only after history and current approval both load successfully. Leaving the form or signing out still discards the ordinary draft. |

### Quality requirements

| ID | Requirement | Verification approach |
|---|---|---|
| UI-QR-01 | All controls must be operable with a keyboard. | Complete sign-in, sign-out and the five mortgage flows without a mouse. |
| UI-QR-02 | Each form input must have a visible label identifying its purpose. | Inspect the sign-in user and request-submission inputs. |
| UI-QR-03 | Request status must be communicated in text. | Identify each status without relying on colour. |
| UI-QR-04 | Frontend code must be understandable in small pieces: each component or function has a clear purpose, named functions have short purpose comments, and validation, HTTP calls, submission state and page markup have explicit responsibilities. Prefer direct control flow over deeply nested conditions or general-purpose frameworks. | Review the submission and decision paths from user input to API response, using the local code guide to identify each responsibility. |
| UI-QR-05 | Readability cleanup must preserve the agreed screens, styling, HTTP contract, identity handling, exact submission retries and success/error feedback. It must not add business rules, dependencies or backend changes. | Run strict TypeScript checking, lint, the production build and the existing browser workflow/error tests; compare changes against the functional requirements above. |
| UI-QR-06 | Quality checks must be repeatable: fast lint/type checks before commits, browser workflow checks against a fresh build, and a separate check of the real API connection. Tests using prepared responses must reject undocumented endpoints and fail on unexpected browser exceptions. | Run the quality command and Chromium/WebKit suites; distinguish simulated API tests from real-service checks and record any remaining coverage gaps. |

## 6. Acceptance scenarios and behaviour checklist

| ID | Given / when | Expected result | Requirements |
|---|---|---|---|
| AC-01 | Sign in as each of the four available users separately, signing out before changing users, and use their permitted actions. | The selected user's identity and existing role are visible and fixed for the session; calls use that identity. Only relationship managers can submit; only reviewers can decide. Both can read. | UI-FR-01, UI-FR-02, UI-FR-03, UI-FR-07, UI-FR-08, UI-FR-20, UI-FR-21 |
| AC-02 | Open application 1, then application 2. | Forms and records show their actual application ID, selected identity and role. | UI-FR-02 |
| AC-03 | A relationship manager submits 25 basis points and a reason for an application without a pending request. | The saved request opens with its ID, original fields and PENDING status. | UI-FR-03, UI-FR-06 |
| AC-04 | Try a non-positive or fractional discount and a blank reason separately. | Invalid fields are identified, values remain and nothing is submitted. | UI-FR-04, UI-FR-05, UI-FR-17 |
| AC-05 | Submit against a missing application or an application with a pending request. | Rejection is explained, values remain and no success appears. | UI-FR-05, UI-FR-15, UI-FR-17 |
| AC-06 | A reviewer approves a pending request for 25 basis points. | APPROVED, reviewer and decision time appear; the current approval shows 25 and its request ID. | UI-FR-06, UI-FR-07, UI-FR-11, UI-FR-16 |
| AC-07 | A reviewer declines a pending request. | DECLINED, reviewer and time appear; any previous approval remains current. | UI-FR-06, UI-FR-08, UI-FR-11, UI-FR-16 |
| AC-08 | Open requests in each status. | All fields are readable; pending has no decision. No edit, delete or withdrawal actions appear; final requests offer no decision action. | UI-FR-06, UI-FR-07, UI-FR-08, UI-FR-09 |
| AC-09 | Open an application with requests 101, 102 and 103, then one without requests. | The first history shows 103, 102, 101, retaining every status and earlier approval. Current approval remains correct regardless of table order. The second history is explicitly empty. | UI-FR-10, UI-FR-11 |
| AC-10 | Open an application without an approval. | No approved discount is explicitly shown. | UI-FR-11 |
| AC-11 | An approval for 25 exists and a later request for 40 is pending, declined or approved. Check separately. | The discount is respectively 25, 25 or 40, with the corresponding request ID. | UI-FR-11 |
| AC-12 | Another reviewer decides first; attempt a decision from an outdated view. | The conflict and saved decision appear; the failed attempt is not shown as accepted. | UI-FR-15, UI-FR-17, UI-FR-19 |
| AC-13 | Lose a successful submission's response. Retry before and after a same-tab refresh separately. | Saving is shown as unconfirmed before retry. The original identity and application remain visible; retry reuses the identity, key and values and returns the original request and current state without duplication. | UI-FR-01, UI-FR-02, UI-FR-06, UI-FR-12, UI-FR-15 |
| AC-14 | While submission is uncertain, sign out and sign in as another user, including one with the same role; separately try another application or changed form values. Return to the original identity. | New submissions remain blocked and original values are preserved. Signed-in users can inspect details and history, but another identity cannot retry. The original identity can retry after signing back in. If rejected, a corrected submission can then be sent. | UI-FR-01, UI-FR-05, UI-FR-12, UI-FR-13, UI-FR-21, UI-FR-22 |
| AC-15 | Delay each operation separately. Repeat submission while waiting. | Each shows progress. Repeat submission sends no extra call; success waits for confirmation. | UI-FR-14, UI-FR-15, UI-FR-18 |
| AC-16 | Confirm a submission or decision. Separately, change records elsewhere and request refresh as each role. | History and current approval reload with the service's latest values in each case. Success appears as a dismissible toast that expires after four seconds without moving the page. A subsequent success restarts the timer; failures stay visible. | UI-FR-16, UI-FR-27 |
| AC-17 | Open direct URLs with invalid IDs or missing records, receive denied access and disconnect the service separately. | The error identifies the cause; no successful empty result appears. | UI-FR-17 |
| AC-18 | Lose a decision response with saved PENDING, APPROVED and DECLINED outcomes separately. | Saved status is retrieved; only PENDING permits another decision. | UI-FR-07, UI-FR-08, UI-FR-19 |
| AC-19 | Open the app without a session; try signing in without choosing a user, then choose each of the four users separately. | A labelled User dropdown and Sign in button appear. Every option shows the user's ID and role. No session starts without a selection. The session uses exactly the selected user's ID and existing role. Sign-in opens application selection with no application preselected. | UI-FR-01, UI-FR-20 |
| AC-20 | While signed out, open application, form and request URLs. Separately sign out from a working page, then use Back. | Sign-in appears instead of working records or actions. No user-switching dropdown appears on working screens after signing in. | UI-FR-02, UI-FR-21 |
| AC-21 | Sign in, open an application and reload the tab. Enter an ordinary unsent draft, sign out, then sign back in. | Reload preserves the signed-in identity. Sign-out ends that session; the ordinary draft is cleared. Submitted records are not removed. | UI-FR-21, UI-FR-22 |
| AC-22 | Sign in as a manager and reviewer in separate tabs, submit in the first, then refresh or focus the second and decide. Refresh the manager’s view and reload both tabs. | Both users see the backend’s same request and decision, retaining their own identities. IDs, actors, timestamps and current approval match API responses. Old browser demonstration records do not affect the displayed data or block entry. | UI-FR-01, UI-FR-22, UI-FR-23 |
| AC-23 | Inspect sign-in, application selection, overview, form, request details and empty history as both roles. Activate the header mark/name by pointer and keyboard. | The approved colours, typography and controls remain. Discount requests / Mortgage pricing and the arrow mark form one link to Applications while signed in, or Sign in while signed out. Identity is read-only with Sign out; navigation preserves the session. Approval amount and source are compact and grouped. Task actions match the role and are not duplicated. Promotional prompts, oversized summary numbers, demo labels, demonstration-labelled shortcuts, walkthrough panels, mockup footer and repeated explanatory banners are absent. | UI-FR-02, UI-FR-11, UI-FR-21, UI-FR-24 |
| AC-24 | Sign in as each role and open applications 1 and 2 from the list. Return through Applications. | Both applications are listed by ID, including the application with no requests. Each list entry opens the correct overview directly while retaining the signed-in user. No application-ID input or separate open button appears. | UI-FR-01, UI-FR-02, UI-FR-25 |
| AC-25 | Inspect pending, approved and declined request activity. | For a decided request, the decision is above the submission; its marker and heading are blue. The earlier submission is gray. For a pending request, submission is the sole recorded event, highlighted in blue, with awaiting-decision status shown separately. No Latest label appears. Original actors and timestamps remain accurate. | UI-FR-06, UI-FR-26 |
| AC-26 | The API returns users and applications beyond the seed IDs. Sign in as each role and open a returned application. | All returned choices appear in service order. Role controls use the returned role. Users are fetched without X-User-Id; application listing and later mortgage calls use the chosen user ID. No seeded fallback choices appear. | UI-FR-01, UI-FR-20, UI-FR-25, UI-FR-28 |
| AC-27 | Delay each list request, return an empty list, and fail then retry it separately. | Loading is visible; empty users disable sign-in, empty applications show no links. Failures remain visible with Try again. Retrying loads the returned choices without changing the selected identity. Obsolete responses cannot replace a newer screen. | UI-FR-17, UI-FR-18, UI-FR-28 |
| AC-28 | Reload a tab with a selected user; separately change that user’s stored role or remove the user before reload. | An existing user retains their ID with the API’s current role. A removed user returns to sign-in with no substitute selected. A failed user-list request offers retry and does not display working records under an unverified role. | UI-FR-01, UI-FR-21, UI-FR-22, UI-FR-28 |
| AC-29 | Enter a discount and reason, then fail either application read during Refresh or tab focus. Retry once while the service still fails, then retry with successful reads. | The read error remains visible and the working page stays unavailable during failed and pending retries. Successful recovery restores the exact entered values without submitting them or writing a browser draft. A later sign-out or navigation away clears an ordinary draft. | UI-FR-17, UI-FR-22, UI-FR-23, UI-FR-29 |

## 7. Delivery success criteria

- A simple pre-commit hook runs TypeScript and ESLint without rewriting source files. Browser tests run separately and in CI; they use isolated test ports and never reuse an unrelated server. Real-service smoke checks are read-only. Automated submission/decision integration tests require a disposable backend database and must not use the author's working data.
- The author personally verifies sign-in/sign-out and the five mortgage flows against the local service. Automated tests distinguish controlled HTTP responses from verification against the real API.
- Acceptance and quality checks have recorded results, distinguishing assistant checks from author confirmation.
- Focused retry and error-handling tests, strict TypeScript checking, linting and the build pass.
- The frontend runs independently of backend source files and can be removed without service changes.
