import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
import {
  formatMonthLabel,
  getAdjacentMonth,
  getCurrentMonth,
  getRecentMonthsList,
} from '../../utils/dates';

interface MonthSelectorProps {
  currentMonth: string;
  onChange: (month: string) => void;
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const monthsList = getRecentMonthsList(18);
  const actualCurrentMonth = getCurrentMonth();
  const isCurrentMonth = currentMonth === actualCurrentMonth;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrev = () => onChange(getAdjacentMonth(currentMonth, -1));
  const handleNext = () => onChange(getAdjacentMonth(currentMonth, 1));

  return (
    <div className={`relative flex items-center bg-white border border-slate-200/80 rounded-2xl shadow-xs p-1 ${className}`} ref={dropdownRef}>
      {/* Prev Month */}
      <button
        onClick={handlePrev}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        title="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Current Month Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
      >
        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{formatMonthLabel(currentMonth)}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Next Month */}
      <button
        onClick={handleNext}
        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        title="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-slide-up">
          <div className="px-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Month</span>
            {!isCurrentMonth && (
              <button
                onClick={() => {
                  onChange(actualCurrentMonth);
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Jump to Current
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {monthsList.map((m) => {
              const selected = m.value === currentMonth;
              return (
                <button
                  key={m.value}
                  onClick={() => {
                    onChange(m.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                    selected
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{m.label}</span>
                  {selected && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
