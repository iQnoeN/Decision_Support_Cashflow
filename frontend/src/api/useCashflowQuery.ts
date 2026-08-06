import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadStatementApi, predictCashflowApi } from './client';
import { ScenarioParams, TransactionItem } from './types';
import { useCashflowStore } from '../store/useCashflowStore';
import { useToastStore } from '../store/useToastStore';

export function useUploadStatement() {
  const queryClient = useQueryClient();
  const { isMockMode, transactions, setForecastResult, scenario } = useCashflowStore();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (file: File) => {
      return await uploadStatementApi(file, isMockMode, transactions, scenario);
    },
    onSuccess: (data) => {
      setForecastResult(data);
      queryClient.invalidateQueries({ queryKey: ['cashflowForecast'] });
      addToast({
        type: 'success',
        title: 'Statement Uploaded & Analyzed',
        message: `Successfully processed file. Next-day cashflow forecast: $${data.next_day_cashflow.toLocaleString()}`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to process bank statement. Please verify CSV format.',
      });
    },
  });
}

export function usePredictCashflow() {
  const { isMockMode, transactions, setForecastResult, scenario } = useCashflowStore();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (customScenario?: ScenarioParams) => {
      const activeScenario = customScenario || scenario;
      return await predictCashflowApi(activeScenario, isMockMode, transactions);
    },
    onSuccess: (data) => {
      setForecastResult(data);
      addToast({
        type: 'info',
        title: 'Forecast Updated',
        message: `Recalculated predictions. Risk status: ${data.risk} (Score: ${data.liquidity_score})`,
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Prediction Error',
        message: error.message || 'Unable to re-run forecast model.',
      });
    },
  });
}
