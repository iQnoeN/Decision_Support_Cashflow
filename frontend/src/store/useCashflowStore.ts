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

  // Forecast data
  forecastResult: FullForecastResult | null;
  setForecastResult: (result: FullForecastResult) => void;

  // Uploaded file state
  lastUploadedFilename: string | null;
  setLastUploadedFilename: (filename: string | null) => void;
}

const initialScenario: ScenarioParams = {
  inflow_multiplier: 1.0,
  outflow_multiplier: 1.0,
  horizon_days: 14,
};

// Seed initial baseline dataset for instant rich dashboard rendering
const initialTransactions: TransactionItem[] = [
  { id: 'tx-001', date: '2026-08-06', description: 'Stripe Merchant Payout', amount: 14500.0, category: 'Revenue', account: 'Operating Checking (*4910)', type: 'inflow', balance: 145800.0 },
  { id: 'tx-002', date: '2026-08-05', description: 'AWS Infrastructure Services', amount: -3200.0, category: 'Cloud Infrastructure', account: 'Operating Checking (*4910)', type: 'outflow', balance: 131300.0 },
  { id: 'tx-003', date: '2026-08-04', description: 'Gusto Enterprise Payroll', amount: -28500.0, category: 'Payroll & HR', account: 'Payroll Checking (*1088)', type: 'outflow', balance: 134500.0 },
  { id: 'tx-004', date: '2026-08-03', description: 'Enterprise Subscription Collection', amount: 19800.0, category: 'Revenue', account: 'Operating Checking (*4910)', type: 'inflow', balance: 163000.0 },
  { id: 'tx-005', date: '2026-08-02', description: 'Google Cloud Platform', amount: -1450.0, category: 'Software Tools', account: 'Corporate Credit (*9921)', type: 'outflow', balance: 143200.0 },
  { id: 'tx-006', date: '2026-08-01', description: 'Salesforce License Renewal', amount: -4800.0, category: 'Software Tools', account: 'Corporate Credit (*9921)', type: 'outflow', balance: 144650.0 },
  { id: 'tx-007', date: '2026-07-31', description: 'Acme Corp Advisory Fee', amount: 8200.0, category: 'Consulting', account: 'Operating Checking (*4910)', type: 'inflow', balance: 149450.0 },
  { id: 'tx-008', date: '2026-07-30', description: 'WeWork Office Space Rent', amount: -6500.0, category: 'Facilities', account: 'Operating Checking (*4910)', type: 'outflow', balance: 141250.0 },
];

const initialForecast = mapBackendToFullForecast(
  {
    predicted_cashflow: 4820.50,
    liquidity_score: 82.5,
    risk: 'Stable',
    recommendations: [
      'Forecasted net cashflow remains positive (+ $4,820/day avg) over the next 14 days.',
      'Current cash reserves cover 48 days of operating expenses.',
      'Optimal window to re-invest $15,000 in short-term yield accounts.'
    ]
  },
  initialTransactions,
  initialScenario
);

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
      const updatedForecast = state.forecastResult
        ? mapBackendToFullForecast(
            {
              predicted_cashflow: state.forecastResult.next_day_cashflow,
              liquidity_score: state.forecastResult.liquidity_score,
              risk: state.forecastResult.risk,
              recommendations: state.forecastResult.recommendations,
            },
            state.transactions,
            updatedScenario
          )
        : null;
      return { scenario: updatedScenario, forecastResult: updatedForecast };
    }),
  resetScenario: () =>
    set((state) => {
      const updatedForecast = state.forecastResult
        ? mapBackendToFullForecast(
            {
              predicted_cashflow: state.forecastResult.next_day_cashflow,
              liquidity_score: state.forecastResult.liquidity_score,
              risk: state.forecastResult.risk,
              recommendations: state.forecastResult.recommendations,
            },
            state.transactions,
            initialScenario
          )
        : null;
      return { scenario: initialScenario, forecastResult: updatedForecast };
    }),

  transactions: initialTransactions,
  setTransactions: (txs) => set({ transactions: txs }),

  forecastResult: initialForecast,
  setForecastResult: (result) => set({ forecastResult: result }),

  lastUploadedFilename: 'q3_bank_statement_2026.csv',
  setLastUploadedFilename: (filename) => set({ lastUploadedFilename: filename }),
}));
