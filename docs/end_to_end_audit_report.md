# CashflowAI — End-to-End Runtime Behavior, State Consistency & Integration Audit

## 1. Executive Summary

A comprehensive, **read-only diagnostic audit** of the CashflowAI web application was conducted across the frontend UI, Zustand state store, FastAPI backend services, Track A feature engineering modules, and XGBoost machine learning models.

No code, configurations, or model artifacts were modified during this audit. The system was tested using the repository's sample datasets ([`sample_test_statement.csv`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/data/raw/sample_test_statement.csv) and [`sample_daily_cashflow.csv`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/data/raw/sample_daily_cashflow.csv)).

### Summary Findings
1. **End-to-End Data Pipeline**: The core CSV upload $\rightarrow$ Track A preprocessing $\rightarrow$ XGBoost Regressor forecasting $\rightarrow$ XGBoost Classifier risk scoring $\rightarrow$ rule engine recommendation pipeline functions deterministically with 100% reproducibility.
2. **State Management**: Application state is stored strictly in-memory inside the Zustand frontend store ([`useCashflowStore.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/store/useCashflowStore.ts)). Browser refreshes predictably reset the application to its default initial state because persistent storage (`localStorage` / `sessionStorage` / DB) is intentionally unconfigured.
3. **Stress Test Discrepancy**: Moving scenario sliders applies real-time client-side transformations to displayed metrics. However, clicking **"Recalculate Stress Test"** triggers an API request with static, hardcoded payload numbers in [`client.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/client.ts#L100-L111) rather than deriving features from the uploaded statement.

---

## 2. Test Environment

- **Frontend Runtime**: Vite + React 18, Zustand state management (`http://localhost:5173`)
- **Backend Runtime**: FastAPI + Uvicorn (`http://localhost:8000`), Python `.venv`
- **ML Engines**:
  - **Forecasting**: `xgboost.sklearn.XGBRegressor` ([`ml/models/xgboost_model.pkl`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/models/xgboost_model.pkl))
  - **Liquidity Classification**: `xgboost.sklearn.XGBClassifier` ([`ml/models/xgboost_classifier.pkl`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/models/xgboost_classifier.pkl))
  - **Liquidity Rule Engine**: [`ml/src/liquidity/liquidity_inference.py`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/src/liquidity/liquidity_inference.py)

---

## 3. Datasets Tested

1. **`sample_test_statement.csv`**: Raw transaction schema (`transactionTimestamp`, `amount`, `type`, `currentBalance`, `txnId`). Contains 20 transactions across 10 days.
2. **`sample_daily_cashflow.csv`**: Daily aggregated schema (`Date`, `Cash_In`, `Cash_Out`, `Net_Cashflow`, `End_Balance`, `Transaction_Count`). Contains 10 days of daily aggregates.

---

## 4. Test Case Results (Empirical Diagnostics)

### Test Case 1 — Raw Transaction Upload
- **Input File**: [`sample_test_statement.csv`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/data/raw/sample_test_statement.csv)
- **HTTP Status**: `200 OK`
- **Backend JSON Response**:
  ```json
  {
    "predicted_cashflow": -737.657958984375,
    "liquidity_score": 58.74,
    "risk": "Moderate Risk",
    "recommendations": [
      "Delay non-essential purchases"
    ]
  }
  ```
- **Page Population**:
  - **Dashboard**: Mapped balance `$195,150.00`, 30-day burn rate `$51,960.00`, estimated runway `113 Days`, next-day net `-$737.66`, risk badge `Moderate Risk`.
  - **AI Forecast**: Next-day net `-$738`, 14-day historical chart, 14-day forecast with 95% confidence intervals, feature importance rankings.
  - **Liquidity Risk**: Risk Gauge `58.7` (`Moderate Risk`), AI recommendation `"Delay non-essential purchases"`, working capital `$195,150.00`.

### Test Case 2 — Page Navigation
- **Sequence**: Dashboard $\rightarrow$ AI Forecast $\rightarrow$ Liquidity Risk $\rightarrow$ Dashboard
- **Result**: All values remain **100% consistent**.
- **Explanation**: Views consume global state from `useCashflowStore`, which remains active in memory during SPA tab switching.

### Test Case 3 — Browser Refresh
- **Action**: Browser refresh (F5) on any page.
- **Result**: Application returns to initial empty state ("No Cashflow Data Available").
- **Explanation**: In-memory Zustand state resets to default values (`forecastResult: null`). No persistent browser or database storage is wired up.

### Test Case 4 — Re-upload Same Dataset
- **Action**: Re-upload [`sample_test_statement.csv`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/data/raw/sample_test_statement.csv) after refresh.
- **Result**: Identical response (`predicted_cashflow: -737.657958984375`, `liquidity_score: 58.74`, `risk: "Moderate Risk"`).
- **Explanation**: The ML inference pipeline is **100% deterministic**.

### Test Case 5 — Daily Cashflow Upload
- **Input File**: [`sample_daily_cashflow.csv`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/data/raw/sample_daily_cashflow.csv)
- **Result**: Identical response (`-737.657958984375`, `58.74`, `Moderate Risk`). Both raw transaction and daily aggregated CSV schemas process consistently.

### Test Case 6 — Liquidity Baseline
- **Baseline Values**: Liquidity Score `58.7`, Risk Label `Moderate Risk`, Projected Net `-$737.66`, Working Capital `$195,150.00`, Runway `113 Days`.

### Test Case 7 — Baseline Stress Test
- **Action**: Click "Recalculate Stress Test" without changing sliders (100% / 100%).
- **Result**: Display updates to `+$3,900.00` next-day net, `Stable` risk.
- **Explanation**: "Recalculate Stress Test" sends an API request via `predictCashflowApi()`, which contains static hardcoded baseline payload numbers (`cash_in: 12500`, `cash_out: 8600`, `end_balance: 145800`), overwriting the uploaded statement results.

### Test Cases 8–10 — Scenarios (Recession Stress, Growth Surge, Receivable Delay)
- **Slider Adjustments**: Instant client-side scaling of `next_day_cashflow`, 14-day forecast points, and runway days without triggering network requests.
- **Scope**: Modifies `forecastResult` in Zustand store, so changes are mirrored on Dashboard and AI Forecast tabs.
- **Backend State**: Unaffected until "Recalculate Stress Test" button is clicked.

### Test Case 11 — Reset Baseline
- **Action**: Click "Reset Baseline".
- **Result**: Restores multipliers to `1.0 / 1.0` and resets client-side projections.

### Test Case 12 — Cross-Page Data Consistency Matrix

| UI Value | Source | Backend/API Field | Calculation Location | Persistent? |
| :--- | :--- | :--- | :--- | :--- |
| **Current Cash Balance** | Mapped CSV Transactions | N/A (Client mapped) | Client ([`mapper.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/mapper.ts)) | No (In-memory) |
| **Next-Day Forecast Net** | Backend API + Scenario | `predicted_cashflow` | XGBoost Regressor + Client | No (In-memory) |
| **Liquidity Score / Index** | Backend API | `liquidity_score` | Rule Engine ([`liquidity_inference.py`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/src/liquidity/liquidity_inference.py)) | No (In-memory) |
| **Risk Label** | Backend API | `risk` | XGBoost Classifier ([`xgboost_classifier.pkl`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/ml/models/xgboost_classifier.pkl)) | No (In-memory) |
| **Working Capital Buffer** | Mapped CSV Transactions | `current_balance` | Client ([`mapper.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/mapper.ts)) | No (In-memory) |
| **Estimated Runway** | Client Calculation | Mapped from CSV | Client ([`mapper.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/mapper.ts)) | No (In-memory) |
| **Recommendations** | Backend API | `recommendations` | Backend Recommendation Engine | No (In-memory) |
| **Stress-Tested Net** | Client / Backend API | `predicted_cashflow` | Client ([`mapper.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/mapper.ts)) / Backend (`/predict/`) | No (In-memory) |

---

## 5. Architectural Data Flows

### Frontend State Flow
```text
FileUploader ──> parseBankStatementCSV() ──> apiClient.post('/upload/') ──> mapBackendToFullForecast() ──> setForecastResult() ──> Zustand Store ──> Components
```

### Backend & ML Inference Flow
```text
Uploaded CSV ──> Schema Validation ──> Track A Preprocessing ──> Feature Engineering ──> XGBoost Regressor (Target Forecast) ──> XGBoost Classifier (Risk Label) ──> Rule Engine (Liquidity Score & Recs) ──> JSON Response
```
- **No Target Leakage**: Verified that inference constructs the 11th feature (`Target`) dynamically using the output of the XGBoost forecasting model (`predicted_cashflow`). Actual future ground-truth targets are never supplied during inference.

---

## 6. Identified Issues & Diagnostics

### Issue 1: Hardcoded Payload in `predictCashflowApi`
- **File**: [`frontend/src/api/client.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/client.ts#L100-L111)
- **Component**: `predictCashflowApi()`
- **Observed Behavior**: Triggering "Recalculate Stress Test" sends static hardcoded feature values (`cash_in: 12500`, `end_balance: 145800`) to `/predict/`.
- **Reason**: `predictCashflowApi` constructs a fixed payload instead of deriving features from the active uploaded statement.
- **Impact**: Clicking "Recalculate Stress Test" replaces the uploaded CSV analysis with hardcoded sample predictions.
- **Classification**: Integration Issue / Potential Bug
- **Severity**: High

### Issue 2: Lack of Browser Session Persistence
- **File**: [`frontend/src/store/useCashflowStore.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/store/useCashflowStore.ts#L47-L116)
- **Component**: `useCashflowStore`
- **Observed Behavior**: Browser refresh wipes all active predictions and transactions.
- **Reason**: Zustand store is configured without `persist` middleware.
- **Impact**: Users must re-upload statements after browser refresh.
- **Classification**: Expected Behavior (MVP design choice)
- **Severity**: Medium

### Issue 3: Scenario Multiplier Leakage to Dashboard Tab
- **File**: [`frontend/src/store/useCashflowStore.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/store/useCashflowStore.ts#L74-L90)
- **Component**: `setScenario()`
- **Observed Behavior**: Adjusting sliders on the Liquidity page immediately changes metrics displayed on the Dashboard tab.
- **Reason**: `setScenario` mutates the global `forecastResult` object in Zustand.
- **Impact**: Dashboard shows scenario-adjusted metrics rather than pristine baseline metrics when sliders are modified.
- **Classification**: UI/UX Issue / Frontend State Issue
- **Severity**: Low

---

## 7. Recommended Changes (For Future Implementation)

*Note: As per strict audit guidelines, NO code changes were implemented during this task.*

1. **Fix `predictCashflowApi` Payload**: Modify `predictCashflowApi` in `client.ts` to extract features dynamically from `useCashflowStore.getState().transactions` or stored feature state rather than using static hardcoded defaults.
2. **Add Zustand Persistence (Optional)**: Wrap `useCashflowStore` with Zustand `persist` middleware backed by `sessionStorage` so analysis survives browser refreshes.
3. **Separate Scenario State from Baseline Forecast**: Maintain `baselineForecastResult` and `scenarioForecastResult` separately in Zustand so Dashboard retains pristine baseline metrics while Liquidity Risk displays stress-tested scenarios.

---

## 8. Final Verdict

### System Status: **READY FOR CONTINUED DEVELOPMENT**

The CashflowAI backend, ML inference engines (XGBoost Regressor & Classifier), Track A preprocessing, and core frontend components are solid, deterministic, and fully functional. The identified issues are isolated frontend state/API mapping discrepancies that can be addressed cleanly in subsequent development phases.
