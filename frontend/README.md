# Decision Support Cashflow — Frontend Application

Production-grade, highly responsive, and accessible (WCAG AA) React + TypeScript frontend web application for the **Decision Support Cashflow** system. Built with Vite, Tailwind CSS, TanStack Query (React Query), Zustand, Recharts, Vitest, Storybook, and Playwright.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### 1. Installation
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

### 2. Run Local Development Server
Start the Vite dev server with proxy routing to FastAPI backend (`http://localhost:8000`):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Unit & Component Tests
Run Vitest unit tests for component business logic, API mapping, and state management:
```bash
npm test
```

### 4. Build Production Bundle
Compile TypeScript and generate optimized, code-split production build artifacts:
```bash
npm run build
```

### 5. Launch Storybook Component Catalog
Develop and inspect components in isolation using Storybook:
```bash
npm run storybook
```
Open [http://localhost:6006](http://localhost:6006) to explore interactive UI stories.

### 6. Run Playwright E2E Tests
Execute end-to-end user workflows (Upload -> Parse -> Forecast -> Liquidity Simulator):
```bash
npm run test:e2e
```

---

## 🎨 Design System & Style Guide

- **Typography**: Inter / System Sans UI font stack with high contrast ratio.
- **Glassmorphism Backdrop**: Subdued glass cards (`backdrop-blur-md`, `border: rgba(255,255,255,0.08)`) with modern dark palette (`#070c1b` base).
- **Color Tokens**:
  - **Surplus / Positive Cashflow**: `#10b981` (Emerald-500) / `#059669` (Teal-600)
  - **Outflow / Expenses**: `#e11d48` (Rose-600) / `#f43f5e` (Rose-500)
  - **Liquidity Warning / Moderate Risk**: `#f59e0b` (Amber-500)
  - **Primary Action Accent**: `#10b981` (Teal Accent)
- **Accessibility (WCAG AA)**:
  - 2px visible focus ring (`outline: 2px solid #10b981`) on all interactive controls (`:focus-visible`).
  - Semantic HTML elements (`<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`).
  - ARIA tags (`aria-live`, `aria-label`, `role="alert"`, `role="button"`) across toasts, upload dropzone, and tables.

---

## 🔌 API Integration & Data Contracts

The frontend seamlessly connects to the FastAPI backend API or falls back to an offline client-side ML engine when offline:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload/` | Upload bank statement CSV; triggers preprocessing, feature engineering & predictions |
| `POST` | `/predict/` | Recalculate predictions with custom scenario parameters (`inflow_multiplier`, `outflow_multiplier`) |
| `GET` | `/health` | Health check endpoint returning backend status |

### Data Mapping Layer (`src/api/mapper.ts`)
The backend returns single-point outputs: `{ predicted_cashflow, liquidity_score, risk, recommendations }`. The frontend mapping layer transforms this into a multi-day time series with **95% Confidence Intervals** (`lower_ci`, `upper_ci`), model metadata (RMSE, MAE, R²), and feature weights for interactive charting.

---

## ✅ UI Acceptance Checklist

- [x] **Auth Stub / Role Selector**: Financial Analyst, Finance Manager, and CFO views with persistent session state.
- [x] **File Uploader**: Drag & drop CSV, parse validation, preview table (first 5 rows), progress bar, error alerts, sample CSV template download.
- [x] **Dashboard**: Key metrics cards (Current balance, 30d burn rate, Runway in days, Net forecast), 7d/30d/90d filter controls, account selector, paginated transaction ledger.
- [x] **Forecast View**: Run model prediction trigger button, model metadata card, confidence interval time-series chart (`lower_ci` / `upper_ci`), feature importance chart, CSV & JSON output downloads.
- [x] **Liquidity Assessment**: Liquidity index score gauge, risk level badge, AI treasury recommendations, interactive scenario sliders (adjust inflows/outflows with live forecast recalculation).
- [x] **Settings & Logs**: API URL toggle, Live vs Mock mode switch, theme switcher, last run artifact JSON viewer.
- [x] **Testing & Quality**: Vitest unit tests, Playwright E2E test, Storybook stories for UI components, ESLint + Prettier.
