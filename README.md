# Aladdin Clone

A simplified clone of an Aladdin-style investment management platform: React frontend, Python (FastAPI) backend, and CSV-backed storage. Users can log in and manage portfolios, risk scenarios, orders, operations, private markets, reports, ESG data, wealth models, integrations, and preferences.

## Prerequisites

- **Backend:** Python 3.11+
- **Frontend:** Node.js 18+ and npm

## Backend

1. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate   # macOS/Linux
   pip install -r requirements.txt
   ```

2. (Optional) Seed a default user and ensure `data/` exists (run from `backend/`):

   ```bash
   python -m scripts.seed_data
   ```

   If you skip this, the API will create the default user on first startup.

3. (Optional) Populate believable demo data for the demo account (portfolios, holdings, risk scenarios, orders, accounts, integrations, etc.):

   ```bash
   python -m scripts.seed_demo_data
   ```

   This clears any existing demo data and repopulates it. Log in as `demo` / `demo` to see the data.

4. Run the API (from the `backend/` directory):

   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   The API will serve at `http://127.0.0.1:8000`. Data is stored under `backend/data/` as CSV files (one file per table).

## Frontend

1. Install dependencies and start the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The app will be at `http://localhost:5173`. It proxies `/api` to the backend (port 8000).

2. Log in with the default user:

   - **Username:** `demo`  
   - **Password:** `demo`

## Project layout

- **backend/** — FastAPI app
  - `app/main.py` — App entry, CORS, lifespan
  - `app/core/` — Config, auth (JWT)
  - `app/db/csv_store.py` — CSV read/write abstraction
  - `app/api/` — Auth and v1 routers (portfolios, risk, trading, operations, private-markets, data-analytics, esg-climate, wealth, ecosystem, design-principles)
  - `data/` — CSV tables (created at runtime)
- **frontend/** — Vite + React + TypeScript
  - `src/` — App, router, auth context, API client, layout, and feature pages with CRUD UI

## Features (from report)

1. **Whole-Portfolio Management** — Portfolios and holdings  
2. **Risk Analytics** — Scenarios and results  
3. **Trading and Order Management** — Orders  
4. **Operations and Accounting** — Accounts and transactions  
5. **Private Markets and Alternatives** — Funds and commitments  
6. **Data and Analytics** — Saved reports  
7. **ESG and Climate** — Portfolio ESG scores  
8. **Wealth Management** — Model portfolios and client accounts  
9. **Ecosystem and Infrastructure** — Integrations  
10. **Design Principles** — User preferences (key/value)

All data is user-scoped; the backend filters by the authenticated user’s ID.
