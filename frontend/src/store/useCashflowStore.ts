import { create } from 'zustand';
import { FullForecastResult, ScenarioParams, TransactionItem } from '../api/types';
import { mapBackendToFullForecast } from '../api/mapper';

export type ViewTab = 'dashboard' | 'upload' | 'forecast' | 'liquidity' | 'help';

interface CashflowState {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;

  // Mode settings
  isMockMode: boolean;
  setIsMockMode: (mock: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Filters
  dateRange: '7d' | '30d' | '90d' | 'ytd';
  setDateRange: (range: '7d' | '30d' | '90d' | 'ytd') => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;

  // Scenario
  scenario: ScenarioParams;
  setScenario: (params: Partial<ScenarioParams>) => void;
  resetScenario: () => void;

  // Transactions
  transactions: TransactionItem[];
  setTransactions: (txs: TransactionItem[]) => void;

  // Forecast data separation: Pristine Baseline vs Active Scenario
  baselineForecastResult: FullForecastResult | null;
  scenarioForecastResult: FullForecastResult | null;
  setBaselineForecastResult: (result: FullForecastResult | null) => void;
  setScenarioForecastResult: (result: FullForecastResult | null) => void;

  // Backward compatibility alias for single-view getters
  forecastResult: FullForecastResult | null;
  setForecastResult: (result: FullForecastResult | null) => void;

  // Uploaded file state
  lastUploadedFilename: string | null;
  setLastUploadedFilename: (filename: string | null) => void;
}

export const initialScenario: ScenarioParams = {
  inflow_multiplier: 1.0,
  outflow_multiplier: 1.0,
  horizon_days: 14,
};

export const useCashflowStore = create<CashflowState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isMockMode: false,
  setIsMockMode: (mock) => set({ isMockMode: mock }),
  isDarkMode: true,
  toggleDarkMode: () => {
    set((state) => {
      const nextDark = !state.isDarkMode;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      return { isDarkMode: nextDark };
    });
  },

  dateRange: '30d',
  setDateRange: (range) => set({ dateRange: range }),
  selectedAccount: 'all',
  setSelectedAccount: (account) => set({ selectedAccount: account }),

  scenario: initialScenario,
  setScenario: (params) =>
    set((state) => {
      const updatedScenario = { ...state.scenario, ...params };
      const isBaselineScenario =
        updatedScenario.inflow_multiplier === 1.0 && updatedScenario.outflow_multiplier === 1.0;

      if (isBaselineScenario) {
        return {
          scenario: updatedScenario,
          scenarioForecastResult: null,
        };
      }

      // Calculate scenario-adjusted forecast strictly for scenarioForecastResult without mutating baseline
      const updatedScenarioForecast = state.baselineForecastResult
        ? mapBackendToFullForecast(
            {
              predicted_cashflow: state.baselineForecastResult.next_day_cashflow,
              liquidity_score: state.baselineForecastResult.liquidity_score,
              risk: state.baselineForecastResult.risk,
              recommendations: state.baselineForecastResult.recommendations,
            },
            state.transactions,
            updatedScenario
          )
        : null;

      return {
        scenario: updatedScenario,
        scenarioForecastResult: updatedScenarioForecast,
      };
    }),

  resetScenario: () =>
    set({
      scenario: initialScenario,
      scenarioForecastResult: null,
    }),

  transactions: [],
  setTransactions: (txs) => set({ transactions: txs }),

  baselineForecastResult: null,
  scenarioForecastResult: null,

  setBaselineForecastResult: (result) =>
    set({
      baselineForecastResult: result,
      scenarioForecastResult: null,
      scenario: initialScenario,
      forecastResult: result,
    }),

  setScenarioForecastResult: (result) =>
    set({
      scenarioForecastResult: result,
    }),

  // Backward compatibility wrapper
  forecastResult: null,
  setForecastResult: (result) =>
    set({
      baselineForecastResult: result,
      scenarioForecastResult: null,
      scenario: initialScenario,
      forecastResult: result,
    }),

  lastUploadedFilename: null,
  setLastUploadedFilename: (filename) => set({ lastUploadedFilename: filename }),
}));
