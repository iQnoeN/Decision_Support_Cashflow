import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useCashflowStore, ViewTab } from './store/useCashflowStore';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { UploadView } from './views/UploadView';
import { ForecastView } from './views/ForecastView';
import { LiquidityView } from './views/LiquidityView';
import { HelpView } from './views/HelpView';
import { ToastContainer } from './components/ui/ToastContainer';
import {
  TrendingUp,
  LayoutDashboard,
  Upload,
  LineChart,
  ShieldAlert,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

export const App: React.FC = () => {
  const { isAuthenticated, user, logout, switchRole } = useAuthStore();
  const { activeTab, setActiveTab, isDarkMode, toggleDarkMode } = useCashflowStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center">
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  const navItems: { id: ViewTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Statement', icon: Upload },
    { id: 'forecast', label: 'AI Forecast', icon: LineChart },
    { id: 'liquidity', label: 'Liquidity Risk', icon: ShieldAlert },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-100 font-sans">
                Cashflow<span className="text-teal-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-slate-700">
                Decision Support
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                    isActive
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-teal-400" />}
            </button>

            {/* Persona Role Switcher Pill */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 rounded-full object-cover border border-teal-500"
                />
                <span className="font-semibold text-slate-200">{user.name}</span>
                <select
                  value={user.role}
                  onChange={(e) => switchRole(e.target.value as any)}
                  className="bg-transparent text-[11px] font-bold text-teal-400 focus:outline-none cursor-pointer"
                >
                  <option value="financial_analyst" className="bg-slate-900">Analyst</option>
                  <option value="finance_manager" className="bg-slate-900">Manager</option>
                  <option value="cfo_executive" className="bg-slate-900">CFO Executive</option>
                </select>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={clsx(
                    'w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3',
                    isActive ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Workspace Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'upload' && <UploadView />}
        {activeTab === 'forecast' && <ForecastView />}
        {activeTab === 'liquidity' && <LiquidityView />}
        {activeTab === 'help' && <HelpView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Decision Support Cashflow AI System • Production React + TS Frontend</span>
          <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
            <UserCheck className="w-3.5 h-3.5" /> API Connected to /upload & /predict
          </span>
        </div>
      </footer>

      {/* Accessible Toast Host */}
      <ToastContainer />
    </div>
  );
};
