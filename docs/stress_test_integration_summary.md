# CashflowAI — Stress-Test Integration & Baseline/Scenario State Separation Report

## 1. Files Modified

1. [`frontend/src/store/useCashflowStore.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/store/useCashflowStore.ts): Separated global forecast state into `baselineForecastResult` and `scenarioForecastResult`. Updated `setScenario()`, `resetScenario()`, `setBaselineForecastResult()`, and `setScenarioForecastResult()`.
2. [`frontend/src/api/client.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/client.ts): Updated `predictCashflowApi()` to extract features dynamically from uploaded transactions using `extractFeaturesFromTransactions()`, removing all static hardcoded numbers (`12500`, `8600`, `145800`).
3. [`frontend/src/api/useCashflowQuery.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/api/useCashflowQuery.ts): Updated `useUploadStatement` to set `baselineForecastResult` and `usePredictCashflow` to set `scenarioForecastResult`.
4. [`frontend/src/views/DashboardView.tsx`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/views/DashboardView.tsx): Bound view to `baselineForecastResult` to guarantee pristine baseline displays.
5. [`frontend/src/views/ForecastView.tsx`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/views/ForecastView.tsx): Bound view to `baselineForecastResult` to guarantee pristine baseline forecast displays.
6. [`frontend/src/views/LiquidityView.tsx`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/views/LiquidityView.tsx): Bound view to `scenarioForecastResult || baselineForecastResult`. Added active scenario badge indicator (`Scenario Active`).

---

## 2. Files Created

1. [`frontend/src/utils/featureExtractor.ts`](file:///c:/Code/AI-Based-MicroBusiness-Cashflow/frontend/src/utils/featureExtractor.ts): Created `extractFeaturesFromTransactions()` utility to compute the 10 Track A engineered features (`cash_in`, `cash_out`, `end_balance`, `transaction_count`, `lag_1`, `lag_7`, `rolling_mean_7`, `rolling_std_7`, `rolling_cashin_7`, `rolling_cashout_7`) dynamically from parsed uploaded transactions.

---

## 3. Exact State-Flow Change

### Previous State Flow (Flawed)
```text
CSV Upload ──> setForecastResult() ──> forecastResult
                                             │
Scenario Sliders / Recalculate ──────────────┴──> Mutates forecastResult Directly ──> Overwrites Dashboard & AI Forecast
```

### New State Flow (Separated & Isolated)
```text
CSV Upload ──> setBaselineForecastResult() ──> baselineForecastResult ──┬──> DashboardView (Pristine Baseline)
                                                                       ├──> ForecastView (Pristine Baseline)
                                                                       └──> LiquidityView Baseline Mode

Scenario Sliders / Recalculate ──> setScenarioForecastResult() ──> scenarioForecastResult ──> LiquidityView Scenario Mode
```

---

## 4. Exact Stress-Test Payload Change

### Previous Static Payload (`client.ts`)
```typescript
// Hardcoded demo numbers overwrote uploaded statement analysis
const payload = {
  cash_in: 12500 * scenario.inflow_multiplier,
  cash_out: 8600 * scenario.outflow_multiplier,
  end_balance: 145800,
  transaction_count: 42,
  lag_1: 3900,
  lag_7: 2800,
  rolling_mean_7: 3400,
  rolling_std_7: 1200,
  rolling_cashin_7: 11800,
  rolling_cashout_7: 8400,
};
```

### New Dynamic Payload (`client.ts`)
```typescript
// Dynamically extracts feature parameters from active uploaded business statement
const baseFeatures = extractFeaturesFromTransactions(transactions);

const payload = {
  cash_in: baseFeatures.cash_in * scenario.inflow_multiplier,
  cash_out: baseFeatures.cash_out * scenario.outflow_multiplier,
  end_balance: baseFeatures.end_balance,
  transaction_count: baseFeatures.transaction_count,
  lag_1: baseFeatures.lag_1,
  lag_7: baseFeatures.lag_7,
  rolling_mean_7: Math.round(((baseFeatures.rolling_cashin_7 * scenario.inflow_multiplier - baseFeatures.rolling_cashout_7 * scenario.outflow_multiplier) / 7) * 100) / 100,
  rolling_std_7: baseFeatures.rolling_std_7,
  rolling_cashin_7: Math.round(baseFeatures.rolling_cashin_7 * scenario.inflow_multiplier * 100) / 100,
  rolling_cashout_7: Math.round(baseFeatures.rolling_cashout_7 * scenario.outflow_multiplier * 100) / 100,
};
```

---

## 5. Baseline vs. Scenario State Separation

1. **`baselineForecastResult`**:
   - Set upon successful statement upload via `uploadStatementApi`.
   - Immutable during scenario slider adjustments or stress-test recalculations.
   - Re-rendered on `DashboardView` and `ForecastView`.
2. **`scenarioForecastResult`**:
   - Updated dynamically on scenario slider adjustments or via `predictCashflowApi` when clicking "Recalculate Stress Test".
   - Strictly isolated to `LiquidityView`.
3. **`resetScenario()`**:
   - Resets multipliers to `1.0 / 1.0`.
   - Clears `scenarioForecastResult` to `null`.
   - Restores `LiquidityView` to `baselineForecastResult`.
   - `baselineForecastResult`, `DashboardView`, and `ForecastView` remain 100% unchanged.

---

## 6. Verification Test Results (Tests A through G)

| Test Case | Description | Result | Details |
| :--- | :--- | :--- | :--- |
| **TEST A** | Upload Datasets | **PASSED** | Uploaded `sample_test_statement.csv` (`-$737.66`, `58.74`, `Moderate Risk`) & `sample_daily_cashflow.csv`. |
| **TEST B** | Navigation | **PASSED** | Dashboard $\rightarrow$ AI Forecast $\rightarrow$ Liquidity Risk $\rightarrow$ Dashboard preserved identical baseline values. |
| **TEST C** | Slider Change | **PASSED** | Moving sliders updated Liquidity Risk scenario view. Dashboard and AI Forecast remained pristine baseline. |
| **TEST D** | Recalculate | **PASSED** | API called with extracted business features (`cash_in: 1700`, `cash_out: 650`, etc.). No hardcoded demo values used. `scenarioForecastResult` changed; `baselineForecastResult` untouched. |
| **TEST E** | Stress Presets | **PASSED** | Baseline, Recession Stress, Growth Surge, and Receivable Delay presets tested; each scenario isolated from baseline. |
| **TEST F** | Reset | **PASSED** | "Reset Baseline" restored multipliers to `1.0 / 1.0`, cleared scenario forecast, and returned Liquidity Risk to pristine baseline. |
| **TEST G** | Repeatability | **PASSED** | Re-uploading statement returned identical, 100% deterministic predictions. |

---

## 7. Test Suite Status

- **Backend Unit & Integration Tests**: **19 / 19 PASSED** (`powershell -Command "..\.venv\Scripts\python -m unittest discover -s tests"` in `backend/`).
- **Frontend TypeScript Verification**: **0 ERRORS** (`npx tsc --noEmit` in `frontend/`).
- **Frontend Production Build**: **PASSED** (`npm run build` in `frontend/`).

---

## 8. Confirmation of ML Artifact Integrity

- **`ml/models/`**: Unchanged (`xgboost_model.pkl`, `xgboost_classifier.pkl` untouched).
- **`ml/src/`**: Unchanged (no retraining or model code modifications).

---

## 9. Remaining Limitations

- **Session/Browser Refresh**: Application state remains strictly in-memory (Zustand). Browser refresh (F5) predictably clears session state to the empty initial view (by design; no `localStorage` persistence configured).
