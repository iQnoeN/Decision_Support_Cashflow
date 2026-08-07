import React, { useState, useMemo } from 'react';
import { TransactionItem } from '../../api/types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface TransactionTableProps {
  transactions: TransactionItem[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const pageSize = 8;

  // Extract unique categories
  const categories = useMemo(() => {
    const setCat = new Set<string>();
    transactions.forEach((t) => setCat.add(t.category));
    return Array.from(setCat);
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch =
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (sortField === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [transactions, searchTerm, categoryFilter, typeFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedItems = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = 'ID,Date,Description,Amount,Category,Account,Type,Balance\n';
    const rows = filteredTransactions
      .map((t) => `"${t.id}","${t.date}","${t.description.replace(/"/g, '""')}",${t.amount},"${t.category}","${t.account}","${t.type}",${t.balance}`)
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Recent Bank Transactions</h3>
          <p className="text-xs text-slate-400">Search, filter, and inspect detailed ledger transactions</p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900/80 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/80 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:border-teal-400 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Inflow / Outflow Filter */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                setTypeFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                typeFilter === 'all' ? 'bg-slate-800 text-teal-400' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setTypeFilter('inflow');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                typeFilter === 'inflow' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
              }`}
            >
              Inflows
            </button>
            <button
              onClick={() => {
                setTypeFilter('outflow');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                typeFilter === 'outflow' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400'
              }`}
            >
              Outflows
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Export filtered transactions CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accessible Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs" aria-label="Transactions Ledger">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('date')}>
                <div className="flex items-center gap-1">
                  Date <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right cursor-pointer hover:text-slate-200" onClick={() => toggleSort('amount')}>
                <div className="flex items-center justify-end gap-1">
                  Amount <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No transactions found matching active search filters.
                </td>
              </tr>
            ) : (
              paginatedItems.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-300">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 text-slate-100 font-semibold">{tx.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{tx.account}</td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      tx.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'inflow' ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 font-medium">
                    {formatCurrency(tx.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <div>
          Showing {filteredTransactions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
