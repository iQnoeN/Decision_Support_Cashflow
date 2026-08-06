import { describe, it, expect } from 'vitest';
import { mapBackendToFullForecast } from '../src/api/mapper';

describe('API Mapper', () => {
  it('correctly maps raw backend prediction response into FullForecastResult contract', () => {
    const rawBackend = {
      predicted_cashflow: 5000.0,
      liquidity_score: 85.0,
      risk: 'Stable',
      recommendations: ['Maintain current operating cash reserves.'],
    };

    const result = mapBackendToFullForecast(rawBackend);

    expect(result.next_day_cashflow).toBe(5000);
    expect(result.liquidity_score).toBe(85.0);
    expect(result.risk).toBe('Stable');
    expect(result.points.length).toBeGreaterThan(14);
    expect(result.metrics.model_name).toContain('XGBoost');
    expect(result.feature_importance.length).toBeGreaterThan(0);
  });

  it('adjusts predictions when scenario multipliers are applied', () => {
    const rawBackend = {
      predicted_cashflow: 5000.0,
      liquidity_score: 70.0,
      risk: 'Moderate Risk',
      recommendations: [],
    };

    const scenario = { inflow_multiplier: 1.2, outflow_multiplier: 0.9, horizon_days: 14 };
    const result = mapBackendToFullForecast(rawBackend, [], scenario);

    expect(result.next_day_cashflow).toBeGreaterThan(5000);
    expect(result.points.filter((p) => p.is_forecast).length).toBe(14);
  });
});
