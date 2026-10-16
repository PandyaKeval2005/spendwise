import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { api } from '../../api/client';
import { formatMonthLabel } from '../../utils/dates';
import { Download, CheckCircle2, ExternalLink } from 'lucide-react';

export const ExportReportModal: React.FC = () => {
  const { isExportOpen, closeExportModal, currentMonth } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [exportType, setExportType] = useState<'monthly' | 'expenses' | 'income' | 'all'>('monthly');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExportOpen) {
      setSelectedMonth(currentMonth);
      setError(null);
      setDownloadSuccess(false);
    }
  }, [isExportOpen, currentMonth]);

  const token = api.getToken();

  const apiBase = ((import.meta.env.VITE_API_URL as string) || '/api').replace(/\/+$/, '');
  const directDownloadUrl = exportType === 'monthly'
    ? `${apiBase}/export/monthly-xlsx?month=${selectedMonth}${token ? `&token=${encodeURIComponent(token)}` : ''}`
    : `${apiBase}/export/transactions-xlsx?month=${selectedMonth}&type=${exportType === 'all' ? 'all' : exportType === 'expenses' ? 'expense' : 'income'}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      if (exportType === 'monthly') {
        await api.downloadFile(
          `/export/monthly-xlsx?month=${selectedMonth}`,
          `SpendWise-Monthly-Report-${selectedMonth}.xlsx`
        );
      } else {
        const typeParam = exportType === 'all' ? 'all' : exportType === 'expenses' ? 'expense' : 'income';
        await api.downloadFile(
          `/export/transactions-xlsx?month=${selectedMonth}&type=${typeParam}`,
          `SpendWise-${exportType}-${selectedMonth}.xlsx`
        );
      }
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        closeExportModal();
      }, 1500);
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download report. Please use the direct download link below.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isExportOpen}
      onClose={closeExportModal}
      title="Download Financial Reports"
      subtitle={`Export real Excel (XLSX) spreadsheets for ${formatMonthLabel(selectedMonth)}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Reporting Month */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Selected Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Report Type Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Report Type
          </label>
          <div className="space-y-2">
            {[
              {
                id: 'monthly',
                title: 'Complete Monthly Report (Full Workbook)',
                description: 'Full 6-sheet workbook: Summary, Expenses, Income, Daily trends, Category Breakdown & Monthly Comparison',
                badge: '6 Sheets',
              },
              {
                id: 'expenses',
                title: 'Expenses Only (.xlsx)',
                description: 'Detailed list of all spending transactions with category, payment method, notes, and totals',
                badge: 'XLSX',
              },
              {
                id: 'income',
                title: 'Income Only (.xlsx)',
                description: 'Salary, bonuses, freelance, and gifts records with subtotals',
                badge: 'XLSX',
              },
              {
                id: 'all',
                title: 'All Transactions (.xlsx)',
                description: 'Unified chronological ledger with both income and expenses',
                badge: 'XLSX',
              },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  exportType === option.id
                    ? 'bg-emerald-50/70 border-emerald-500/80 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value={option.id}
                  checked={exportType === option.id}
                  onChange={() => setExportType(option.id as any)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{option.title}</span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Success indicator */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Excel workbook generated and downloaded!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeExportModal}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Excel...' : 'Download XLSX'}</span>
            </button>
          </div>

          {/* Direct browser link backup */}
          <div className="text-center pt-1">
            <a
              href={directDownloadUrl}
              download
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-400 underline-offset-2"
            >
              <span>Direct Download Link (Click here if popup is blocked)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};
