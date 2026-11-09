# Mortgage pricing exceptions — frontend

A browser interface for requesting and reviewing discounts on mortgage interest
rates. Relationship managers submit requests; reviewers approve or decline them.
Both roles can inspect request history and the current approved discount.

The frontend uses Next.js and TypeScript. The separate
[backend API](https://github.com/emfrg/blue-harvest-assignment) provides the users,
applications and saved records. The agreed behaviour is in [SPEC.md](SPEC.md);
the HTTP contract is in the backend's
[API.md](https://github.com/emfrg/blue-harvest-assignment/blob/main/API.md).

## Before You Start

You need:

- **Node.js 22 and npm.** The exact Node version is recorded in [.nvmrc](.nvmrc).
- **Git** and **a browser**.
- **The backend running.** Follow its
  [Run Locally instructions](https://github.com/emfrg/blue-harvest-assignment#run-locally),
  including the database and sample-record setup. Keep it running in its own terminal.
  The frontend uses `http://127.0.0.1:8000` by default; you can change the address
  with `BACKEND_URL`, as shown below.

The frontend does not need a Python environment or its own database.

## Run Locally

Use **Terminal on macOS** or **PowerShell on Windows**. The clone, install, run
and test commands are the same on both systems. The optional backend address
setting has separate examples below.

### 1. Clone the Repository

```sh
git clone https://github.com/emfrg/blue-harvest-frontend.git
cd blue-harvest-frontend
```

If you already have the repository, open a terminal in its root folder.
On macOS or Linux, if you use nvm, run `nvm use` to select the project's Node
version. Otherwise, use an installed Node.js 22.

### 2. Install the Dependencies and Commit Checks

```sh
npm ci
npm run hooks:install
```

The second command installs TypeScript and ESLint checks before each local
commit. They report problems without rewriting files. Install the hook once
per checkout; browser tests run separately.

### 3. Start the Frontend

```sh
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Keep both server terminals
open while using the application. Press `Ctrl+C` to stop a server.
When returning later, start the backend and run `npm run dev` again.

No configuration is needed when the backend runs at `http://127.0.0.1:8000`.
For a different address, set the `BACKEND_URL` environment variable. For example,
if the backend runs on port 8001:

**macOS or Linux (Terminal)**

```sh
BACKEND_URL=http://127.0.0.1:8001 npm run dev
```

**Windows (PowerShell)**

```powershell
$env:BACKEND_URL = "http://127.0.0.1:8001"
npm run dev
```

The PowerShell setting lasts for that terminal session. Open a new terminal to
use the default again.

Use the address where your backend is actually running. Restart the frontend
after changing it. For production, set `BACKEND_URL` when running `npm run build`.

## Try the Application

With the backend's sample records:

1. Select **User 1 — Relationship manager** and sign in.
2. Open **Application 1**, select **New request**, enter a discount in basis
   points and a reason, then submit it.
3. Sign out and sign in as **User 3 — Reviewer**. Open the same application,
   select **Review** on the pending request, then approve or decline it.
4. Check the request history and approved discount. Use **Refresh** to reload
   records after changes made elsewhere.

If the application already has a pending request, review it before submitting
another. Sign-in selects an existing backend user; there is no password check
or production authentication.

## Run Tests and Quality Checks

Check TypeScript types and ESLint rules:

```sh
npm run check
```

Install the test browsers once, then run the browser tests:

```sh
npx playwright install chromium webkit
npm test
```

Playwright checks the workflows in Chromium and WebKit using prepared API
responses. These tests do not require the backend or change its database.

To also check reads against your running backend:

```sh
npm run test:service
```

If the backend uses a different address, apply the same `BACKEND_URL` setting
to this command too. On macOS or Linux, for example:

```sh
BACKEND_URL=http://127.0.0.1:8001 npm run test:service
```

On Windows, the PowerShell setting above still applies in the same terminal.

This checks users, applications, history and request details without submitting
or deciding requests. Both test commands build the frontend and start their own
server: port **3100** for `npm test`, **3101** for `npm run test:service`.
Keep those ports free and run the commands one at a time.

## Project Files

| File or directory | Where to look |
|---|---|
| [SPEC.md](SPEC.md) | Requirements and acceptance scenarios. Start here when changing behaviour. |
| [app/](app/) | Pages, layouts and styling. |
| [components/](components/) | Screens, forms and shared interface components. |
| [hooks/](hooks/) | Request-form state and submission handling. |
| [lib/](lib/) | API calls, response types and shared helpers. |
| [tests/](tests/) | Browser workflows, error cases and backend read checks. |
| [next.config.ts](next.config.ts) | Forwards `/backend/*` calls to the API. |

Codex assisted with implementation, tests and documentation under the project
author's direction. Starter attribution is in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
