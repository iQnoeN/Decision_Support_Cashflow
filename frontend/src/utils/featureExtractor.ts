import { TransactionItem } from '../api/types';

export interface ExtractedFeatures {
  cash_in: number;
  cash_out: number;
  end_balance: number;
  transaction_count: number;
  lag_1: number;
  lag_7: number;
  rolling_mean_7: number;
  rolling_std_7: number;
  rolling_cashin_7: number;
  rolling_cashout_7: number;
}

/**
 * Extracts 10 engineered feature values from parsed transactions
 * matching Track A feature engineering definitions.
 * Requires at least 8 consecutive days of daily cashflow data.
 */
export function extractFeaturesFromTransactions(transactions: TransactionItem[]): ExtractedFeatures {
  if (!transactions || transactions.length === 0) {
    throw new Error(
      'Insufficient transaction history for feature engineering. At least 8 consecutive days of cashflow data are required.'
    );
  }

  // Group transactions by date
  const dateMap = new Map<
    string,
    { cashIn: number; cashOut: number; net: number; endBalance: number; count: number }
  >();

  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sorted.forEach((tx) => {
    const d = tx.date;
    const existing = dateMap.get(d) || { cashIn: 0, cashOut: 0, net: 0, endBalance: tx.balance, count: 0 };
    if (tx.type === 'inflow') {
      existing.cashIn += Math.abs(tx.amount);
    } else {
      existing.cashOut += Math.abs(tx.amount);
    }
    existing.net = existing.cashIn - existing.cashOut;
    existing.endBalance = tx.balance;
    existing.count += 1;
    dateMap.set(d, existing);
  });

  const dates = Array.from(dateMap.keys());
  if (dates.length < 8) {
    throw new Error(
      `Insufficient transaction history: Found ${dates.length} daily date(s). At least 8 consecutive days of cashflow data are required.`
    );
  }

  const dailyData = dates.map((d) => ({ date: d, ...dateMap.get(d)! }));

  const latestIndex = dailyData.length - 1;
  const latest = dailyData[latestIndex];

  // Lags (Track A definition)
  const lag1Obj = dailyData[latestIndex - 1];
  const lag7Obj = dailyData[latestIndex - 7];

  // 7-day rolling window
  const rolling7Window = dailyData.slice(latestIndex - 6, latestIndex + 1);
  const rolling_cashin_7 = rolling7Window.reduce((acc, curr) => acc + curr.cashIn, 0);
  const rolling_cashout_7 = rolling7Window.reduce((acc, curr) => acc + curr.cashOut, 0);
  const netValues = rolling7Window.map((curr) => curr.net);
  const rolling_mean_7 = netValues.reduce((acc, curr) => acc + curr, 0) / netValues.length;

  // Sample Standard Deviation (ddof=1) to achieve 100% parity with pandas rolling(7).std()
  const variance =
    netValues.length > 1
      ? netValues.reduce((acc, curr) => acc + Math.pow(curr - rolling_mean_7, 2), 0) / (netValues.length - 1)
      : 0;
  const rolling_std_7 = Math.sqrt(variance);

  return {
    cash_in: latest.cashIn,
    cash_out: latest.cashOut,
    end_balance: latest.endBalance,
    transaction_count: latest.count,
    lag_1: lag1Obj.net,
    lag_7: lag7Obj.net,
    rolling_mean_7: Math.round(rolling_mean_7 * 100) / 100,
    rolling_std_7: Math.round(rolling_std_7 * 100) / 100,
    rolling_cashin_7: Math.round(rolling_cashin_7 * 100) / 100,
    rolling_cashout_7: Math.round(rolling_cashout_7 * 100) / 100,
  };
}
