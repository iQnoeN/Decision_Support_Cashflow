import { test, expect } from '@playwright/test';

test.describe('Cashflow Decision Support E2E Flow', () => {
  test('User can log in, view dashboard KPIs, navigate tabs, and inspect forecast', async ({ page }) => {
    // 1. Visit App
    await page.goto('/');

    // 2. Expect Dashboard Title
    await expect(page.getByText('Cashflow & Liquidity Overview')).toBeVisible();

    // 3. Verify KPI Cards
    await expect(page.getByText('Current Cash Balance')).toBeVisible();
    await expect(page.getByText('30-Day Cash Burn Rate')).toBeVisible();
    await expect(page.getByText('Estimated Runway')).toBeVisible();

    // 4. Navigate to Upload Statement Tab
    await page.getByRole('button', { name: /Upload Statement/i }).first().click();
    await expect(page.getByText('Bank Statement Ingestion & ML Processing')).toBeVisible();

    // 5. Navigate to Forecast Tab
    await page.getByRole('button', { name: /ML Forecast/i }).first().click();
    await expect(page.getByText('ML Cashflow Forecasting & Confidence Bounds')).toBeVisible();
    await expect(page.getByText('Model Feature Importance')).toBeVisible();

    // 6. Navigate to Liquidity Risk Tab
    await page.getByRole('button', { name: /Liquidity Risk/i }).first().click();
    await expect(page.getByText('Liquidity Risk Assessment & Scenario Stress-Testing')).toBeVisible();
    await expect(page.getByText('Interactive Cashflow Scenario Simulator')).toBeVisible();
  });
});
