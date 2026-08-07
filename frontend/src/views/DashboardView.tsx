import React from 'react';
import { useCashflowStore } from '../store/useCashflowStore';
import { KpiCard } from '../components/ui/KpiCard';
import { CashflowChart } from '../components/charts/CashflowChart';
import { TransactionTable } from '../components/table/TransactionTable';
import { formatCurrency } from '../utils/formatters';
import { DollarSign, Flame, Clock, TrendingUp, Calendar, Landmark, Upload } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    forecastResult,
    transactions,
    dateRange,
    setDateRange,
    selectedAccount,
    setSelectedAccount,
    setActiveTab,
  } = useCashflowStore();

  const currentBalance = forecastResult?.current_balance || 145800;
  const burnRate30d = forecastResult?.historical_burn_rate_30d || 84500;
  const runwayDays = forecastResult?.runway_days || 48;
  const nextDayCashflow = forecastResult?.next_day_cashflow || 4820;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-100">
            Cashflow & Liquidity Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time financial position, 30-day burn rate, and AI liquidity monitoring
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Filter */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Landmark className="w-4 h-4 text-teal-400" />
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All Accounts (Consolidated)</option>
              <option value="checking" className="bg-slate-900">Primary Operating (*4910)</option>
              <option value="payroll" className="bg-slate-900">Payroll Checking (*1088)</option>
              <option value="credit" className="bg-slate-900">Corporate Credit (*9921)</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(['7d', '30d', '90d', 'ytd'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 font-semibold rounded-lg uppercase transition-all ${
                  dateRange === r ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-teal-400" /> Upload Statement
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Current Cash Balance"
          value={formatCurrency(currentBalance)}
          subtitle="Total available liquid funds"
          change={+4.2}
          icon={DollarSign}
          iconBgColor="bg-emerald-500/15"
          iconTextColor="text-emerald-400"
          badgeText="Healthy"
          badgeType="success"
        />

        <KpiCard
          title="30-Day Cash Burn Rate"
          value={formatCurrency(burnRate30d)}
          subtitle="Operating expenses burn"
          change={-2.1}
          changeLabel="vs previous 30d"
          icon={Flame}
          iconBgColor="bg-rose-500/15"
          iconTextColor="text-rose-400"
          badgeText="Normal"
          badgeType="neutral"
        />

        <KpiCard
          title="Estimated Runway"
          value={`${runwayDays} Days`}
          subtitle="Days of operation remaining"
          change={+6}
          changeLabel="+6 days buffer"
          icon={Clock}
          iconBgColor="bg-teal-500/15"
          iconTextColor="text-teal-400"
          badgeText="Low Risk"
          badgeType="success"
        />

        <KpiCard
          title="Next-Day Forecast Net"
          value={`${nextDayCashflow >= 0 ? '+' : ''}${formatCurrency(nextDayCashflow)}`}
          subtitle="ML model next-day net"
          change={+12.4}
          icon={TrendingUp}
          iconBgColor="bg-teal-500/15"
          iconTextColor="text-teal-400"
          badgeText={forecastResult?.risk || 'Stable'}
          badgeType={forecastResult?.risk === 'Stable' ? 'success' : 'warning'}
        />
      </div>

      {/* Time-Series Chart */}
      <div className="w-full">
        <CashflowChart points={forecastResult?.points || []} />
      </div>

      {/* Recent Transactions Table */}
      <div className="w-full">
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
};
