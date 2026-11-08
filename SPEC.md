# Mortgage pricing exception interface — specification

## Sources and preparation

The source of the requested capabilities is *Blue Harvest Agentic SDLC Engineering Assignment*. Its UI bonus covers creating, reviewing and inspecting pricing exception requests.

The structure follows the backend's adaptation of [GitHub Spec Kit's feature-specification template](https://github.com/github/spec-kit/blob/ba8363f8ab56b2da456a81299cfdbfee1ef7b871/templates/spec-template.md), linking user stories, requirements and acceptance scenarios. Spec Kit's CLI is not used.

Business rules and roles come from the [backend specification, revision 1.3](https://github.com/emfrg/blue-harvest-assignment/blob/f43e8d1724eae9cbd0f1d71ed927043d37fd5471/SPEC.md). Integration follows the [API contract, revision 0.2](https://github.com/emfrg/blue-harvest-assignment/blob/f43e8d1724eae9cbd0f1d71ed927043d37fd5471/API.md).

Codex assisted with drafting and checking; the project author directs the scope and reviews the requirements.

## 1. Purpose and boundaries

This specification covers a browser interface for submitting, reviewing and inspecting mortgage pricing exception requests.

The frontend has its own repository and dependencies. It uses only the existing HTTP API. Removing it leaves the backend and saved records intact.

Application and user management, request editing, deletion and withdrawal, a global review queue, production authentication, deployment, charts and AI chat are outside scope.

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

### Local demonstration assumptions

The service supplies sample applications and both user roles. The selected demonstration identity is trusted locally. Both applications run locally without paid services.

### Submission validation

The form requires an application ID, a positive whole-number discount in basis points and a non-blank reason. The service checks application existence and business rules. No product-specific ceiling is added.

### Access rules

| Action | Permitted role |
|---|---|
| Submit a request | Relationship manager |
| Approve or decline | Reviewer |
| Read requests, history or the current approved discount | Either role |

The interface offers these actions by role; the service enforces permissions.

## 3. User scenarios

The five backend user stories apply to the interface. Prepared records support independent checks.

| ID | User story | Independent check |
|---|---|---|
| UI-US-01 | As a relationship manager, I want to submit a discount request so that a reviewer can consider it. | Submit valid details and inspect the pending request (AC-03). |
| UI-US-02 | As a reviewer, I want to approve a pending request so that its exact discount is authorised for use. | Approve a request and inspect the current discount (AC-06). |
| UI-US-03 | As a reviewer, I want to decline a pending request so that it does not authorise a discount. | Decline a request and inspect its outcome (AC-07). |
| UI-US-04 | As a relationship manager, I want to check a request’s status so that I know whether it is awaiting a decision. | Open pending, approved and declined requests (AC-08). |
| UI-US-05 | As a reviewer, I want to inspect an application’s request history so that I can trace how its current approved discount was reached. | Inspect history and current approval (AC-09 to AC-11). |

## 4. Business decisions

The [backend business decisions](https://github.com/emfrg/blue-harvest-assignment/blob/f43e8d1724eae9cbd0f1d71ed927043d37fd5471/SPEC.md#4-business-decisions) remain unchanged: immutable submissions, one pending request per application and one final decision per request. Only a later approval replaces the current discount.

Browser recovery is specified below. Layout and storage choices belong in the implementation plan.

## 5. Requirements

### Functional requirements

All IDs below refer to this specification.

| ID | Required behaviour |
|---|---|
| UI-FR-01 | Each mortgage operation must use the demonstration identity shown for that operation. |
| UI-FR-02 | The selected identity, role and application ID must be visible alongside the relevant actions and records. |
| UI-FR-03 | Submitting a request as a relationship manager must open the saved request after service acceptance. |
| UI-FR-04 | The form must prevent submission of inputs that fail the validation rules in section 2. |
| UI-FR-05 | A rejected submission must leave the entered values available for correction. |
| UI-FR-06 | The request view must display the fields defined in section 2, explicitly identifying pending requests as undecided. |
| UI-FR-07 | The interface must allow a reviewer to approve only the displayed pending request. |
| UI-FR-08 | The interface must allow a reviewer to decline only the displayed pending request. |
| UI-FR-09 | Submitted request details must remain read-only in every status. |
| UI-FR-10 | Application history must show all returned requests or an explicit empty result. |
| UI-FR-11 | The approval view must show the service's current discount and request ID, or no approval. |
| UI-FR-12 | Retrying an uncertain submission must reuse its original identity, retry key and submitted values, including after refreshing the same tab. |
| UI-FR-13 | An uncertain submission must prevent new submissions while its preserved details and application history remain accessible. |
| UI-FR-14 | Repeated submission actions must not send additional calls while a response is pending. |
| UI-FR-15 | The interface must distinguish service-confirmed success or rejection from an unknown outcome after a lost response. |
| UI-FR-16 | History and current approval must reload after a confirmed submission, confirmed decision or user-requested refresh. |
| UI-FR-17 | Failures must identify invalid input, missing records, denied access, conflicts or an unavailable service. |
| UI-FR-18 | Pending operations must show an in-progress state. |
| UI-FR-19 | After a decision conflict or lost response, saved status must be retrieved before another decision is offered. |

### Quality requirements

| ID | Requirement | Verification approach |
|---|---|---|
| UI-QR-01 | All controls must be operable with a keyboard. | Complete the five flows without a mouse. |
| UI-QR-02 | Each form input must have a visible label identifying its purpose. | Inspect the identity, application and submission inputs. |
| UI-QR-03 | Request status must be communicated in text. | Identify each status without relying on colour. |

## 6. Acceptance scenarios and behaviour checklist

| ID | Given / when | Expected result | Requirements |
|---|---|---|---|
| AC-01 | Select each demonstration role and use its permitted actions. | Identity and role are visible; calls use that identity. Only relationship managers can submit; only reviewers can decide. Both can read. | UI-FR-01, UI-FR-02, UI-FR-03, UI-FR-07, UI-FR-08 |
| AC-02 | Open application 1, then application 2. | Forms and records show their actual application ID, selected identity and role. | UI-FR-02 |
| AC-03 | A relationship manager submits 25 basis points and a reason for an application without a pending request. | The saved request opens with its ID, original fields and PENDING status. | UI-FR-03, UI-FR-06 |
| AC-04 | Try a missing application ID, non-positive or fractional discount, and blank reason separately. | Invalid fields are identified, values remain and nothing is submitted. | UI-FR-04, UI-FR-05, UI-FR-17 |
| AC-05 | Submit against a missing application or an application with a pending request. | Rejection is explained, values remain and no success appears. | UI-FR-05, UI-FR-15, UI-FR-17 |
| AC-06 | A reviewer approves a pending request for 25 basis points. | APPROVED, reviewer and decision time appear; the current approval shows 25 and its request ID. | UI-FR-06, UI-FR-07, UI-FR-11, UI-FR-16 |
| AC-07 | A reviewer declines a pending request. | DECLINED, reviewer and time appear; any previous approval remains current. | UI-FR-06, UI-FR-08, UI-FR-11, UI-FR-16 |
| AC-08 | Open requests in each status. | All fields are readable; pending has no decision. No edit, delete or withdrawal actions appear; final requests offer no decision action. | UI-FR-06, UI-FR-07, UI-FR-08, UI-FR-09 |
| AC-09 | Open an application with several requests, then one without requests. | Every historical request appears, including earlier approvals; the second history is explicitly empty. | UI-FR-10 |
| AC-10 | Open an application without an approval. | No approved discount is explicitly shown. | UI-FR-11 |
| AC-11 | An approval for 25 exists and a later request for 40 is pending, declined or approved. Check separately. | The discount is respectively 25, 25 or 40, with the corresponding request ID. | UI-FR-11 |
| AC-12 | Another reviewer decides first; attempt a decision from an outdated view. | The conflict and saved decision appear; the failed attempt is not shown as accepted. | UI-FR-15, UI-FR-17, UI-FR-19 |
| AC-13 | Lose a successful submission's response. Retry before and after a same-tab refresh separately. | Saving is shown as unconfirmed before retry. The original identity and application remain visible; retry reuses the identity, key and values and returns the original request and current state without duplication. | UI-FR-01, UI-FR-02, UI-FR-06, UI-FR-12, UI-FR-15 |
| AC-14 | While submission is uncertain, try changed identity, application, discount or reason separately. | New submissions are blocked; preserved details, including the reason, and history remain accessible. The original submission can be retried. If rejected, a corrected submission can then be sent. | UI-FR-05, UI-FR-13 |
| AC-15 | Delay each operation separately. Repeat submission while waiting. | Each shows progress. Repeat submission sends no extra call; success waits for confirmation. | UI-FR-14, UI-FR-15, UI-FR-18 |
| AC-16 | Confirm a submission or decision. Separately, change records elsewhere and request refresh as each role. | History and current approval reload with the service's latest values in each case. | UI-FR-16 |
| AC-17 | Look up missing records, receive denied access and disconnect the service separately. | The error identifies the cause; no successful empty result appears. | UI-FR-17 |
| AC-18 | Lose a decision response with saved PENDING, APPROVED and DECLINED outcomes separately. | Saved status is retrieved; only PENDING permits another decision. | UI-FR-07, UI-FR-08, UI-FR-19 |

## 7. Delivery success criteria

- The author personally verifies the five flows against the local service.
- Acceptance and quality checks have recorded results, distinguishing assistant checks from author confirmation.
- Focused retry and error-handling tests, strict TypeScript checking, linting and the build pass.
- The frontend runs independently of backend source files and can be removed without service changes.
