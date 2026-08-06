import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Download, X, Sparkles, Play } from 'lucide-react';
import { parseBankStatementCSV, generateSampleCSVString, CSVParseResult } from '../../utils/csvParser';
import { useUploadStatement } from '../../api/useCashflowQuery';
import { useCashflowStore } from '../../store/useCashflowStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const FileUploader: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadStatement();
  const { setTransactions, setLastUploadedFilename, setActiveTab } = useCashflowStore();

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseResult({
        valid: false,
        transactions: [],
        errors: ['Invalid file type. Only CSV files (.csv) are accepted.'],
        totalRows: 0,
        columnsFound: [],
      });
      setSelectedFile(file);
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const result = await parseBankStatementCSV(file);
      setParseResult(result);
    } catch (err: any) {
      setParseResult({
        valid: false,
        transactions: [],
        errors: [`Failed to parse CSV file: ${err.message}`],
        totalRows: 0,
        columnsFound: [],
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmUpload = () => {
    if (!selectedFile || !parseResult?.valid) return;

    uploadMutation.mutate(selectedFile, {
      onSuccess: () => {
        setTransactions(parseResult.transactions);
        setLastUploadedFilename(selectedFile.name);
        setActiveTab('forecast');
      },
    });
  };

  const handleLoadDemoDataset = () => {
    const demoCSV = generateSampleCSVString();
    const demoFile = new File([demoCSV], 'q3_bank_statement_demo.csv', { type: 'text/csv' });
    handleFileSelect(demoFile);
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = generateSampleCSVString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_bank_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        aria-label="Upload Bank Statement CSV File"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        className={`glass-panel rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          dragOver
            ? 'border-teal-400 bg-teal-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-teal-500/50 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-100">Upload Bank Statement</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Drag and drop your transaction CSV here, or <span className="text-teal-400 underline font-semibold">browse files</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">Supports CSV exports from Chase, BofA, Stripe, Brex & Plaid</p>

        {/* Quick Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadDemoDataset();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Load Sample Demo Statement
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadSampleCSV();
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            Download CSV Template
          </button>
        </div>
      </div>

      {/* Parsing Loading State */}
      {isParsing && (
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
          <span className="text-sm text-slate-300 font-medium">Validating CSV format & extracting cashflow transactions...</span>
        </div>
      )}

      {/* Parse Result & Preview */}
      {selectedFile && parseResult && !isParsing && (
        <div className="glass-panel rounded-2xl p-6 space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100">{selectedFile.name}</h4>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {parseResult.totalRows} Rows Parsed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setParseResult(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>

              {parseResult.valid && (
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploadMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Running ML Inference...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      Execute Upload & Forecast
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {!parseResult.valid && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                CSV Validation Failed
              </div>
              <ul className="list-disc list-inside space-y-1">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Preview Table */}
          {parseResult.valid && parseResult.transactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Data Preview (First 5 Transactions)
                </h5>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Schema Validated & Ready for ML Inference
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Account</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parseResult.transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2 text-slate-300 font-medium">{formatDate(tx.date)}</td>
                        <td className="px-4 py-2 text-slate-200">{tx.description}</td>
                        <td className="px-4 py-2 text-slate-400">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-400">{tx.account}</td>
                        <td
                          className={`px-4 py-2 text-right font-bold ${
                            tx.type === 'inflow' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'inflow' ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
