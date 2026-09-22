import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, RefreshCw, Calculator, ShieldCheck } from 'lucide-react';
import api from '../../services/api.ts';
import { formatCurrency } from '../../utils/formatters.ts';

interface BudgetPlanConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  initialTotalPlanned?: number;
  initialContingency?: number;
  initialThreshold?: number;
  initialCategoryTargets?: { category: string; plannedAmount: number; notes?: string }[];
  onSaved: () => void;
}

const DEFAULT_CATEGORIES = [
  { key: 'MATERIALS', label: 'Materials Procurement', defaultPct: 48 },
  { key: 'LABOR', label: 'Site Labor & Wages', defaultPct: 26 },
  { key: 'EQUIPMENT', label: 'Machinery & Equipment Rental', defaultPct: 10 },
  { key: 'TRANSPORT', label: 'Logistics & Fuel', defaultPct: 6 },
  { key: 'SUBCONTRACT', label: 'Vendors & Subcontractors', defaultPct: 6 },
  { key: 'OVERHEADS', label: 'Site Overheads & Permits', defaultPct: 4 },
];

export function BudgetPlanConfigModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialTotalPlanned = 1000000,
  initialContingency = 5,
  initialThreshold = 85,
  initialCategoryTargets = [],
  onSaved,
}: BudgetPlanConfigModalProps) {
  const [totalPlanned, setTotalPlanned] = useState<number>(initialTotalPlanned);
  const [contingencyPct, setContingencyPct] = useState<number>(initialContingency);
  const [thresholdPct, setThresholdPct] = useState<number>(initialThreshold);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTotalPlanned(initialTotalPlanned || 1000000);
      setContingencyPct(initialContingency ?? 5);
      setThresholdPct(initialThreshold ?? 85);

      const targetMap: Record<string, number> = {};
      DEFAULT_CATEGORIES.forEach((cat) => {
        const existing = initialCategoryTargets.find((t) => t.category.toUpperCase() === cat.key);
        if (existing && existing.plannedAmount !== undefined) {
          targetMap[cat.key] = existing.plannedAmount;
        } else {
          targetMap[cat.key] = Math.round((initialTotalPlanned || 1000000) * (cat.defaultPct / 100));
        }
      });
      setTargets(targetMap);
      setError('');
    }
  }, [isOpen, initialTotalPlanned, initialContingency, initialThreshold, initialCategoryTargets]);

  if (!isOpen) return null;

  const currentAllocatedSum = Object.values(targets).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const allocatedDiff = totalPlanned - currentAllocatedSum;

  const handleAutoDistribute = () => {
    const updated: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach((cat) => {
      updated[cat.key] = Math.round(totalPlanned * (cat.defaultPct / 100));
    });
    setTargets(updated);
  };

  const handleCategoryChange = (key: string, value: number) => {
    setTargets((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPlanned <= 0) {
      setError('Planned total budget must be greater than zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const categoryTargetsArray = Object.keys(targets).map((key) => ({
        category: key,
        plannedAmount: targets[key],
      }));

      const res = await api.put(`/admin/projects/${projectId}/budget-plan`, {
        totalPlannedBudget: totalPlanned,
        contingencyPercentage: contingencyPct,
        alertThresholdPercentage: thresholdPct,
        categoryTargets: categoryTargetsArray,
      });

      if (res.data.success) {
        onSaved();
        onClose();
      } else {
        setError(res.data.message || 'Failed to save budget configuration');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error updating budget plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Budget Baseline Configuration
            </span>
            <h2 className="text-lg font-bold text-white mt-1">Configure Planned Budget Targets</h2>
            <p className="text-xs text-slate-400">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Total Planned & Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Planned Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={totalPlanned}
                onChange={(e) => setTotalPlanned(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alert Warning Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="99"
                value={thresholdPct}
                onChange={(e) => setThresholdPct(Number(e.target.value) || 85)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                title="Alert triggers when category reaches this % of planned limit"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Warning at {thresholdPct}%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contingency Reserve (%)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={contingencyPct}
                onChange={(e) => setContingencyPct(Number(e.target.value) || 5)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                ₹{Math.round((totalPlanned * contingencyPct) / 100).toLocaleString()} reserved
              </span>
            </div>
          </div>

          {/* Allocation Summary Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Category Allocation Balance:</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  Allocated: <strong className="text-white">{formatCurrency(currentAllocatedSum)}</strong> /{' '}
                  {formatCurrency(totalPlanned)}
                </span>
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="px-2.5 py-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Auto-Distribute (Civil Standards)</span>
                </button>
              </div>
            </div>

            {/* Difference status */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="text-slate-500">
                {allocatedDiff === 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Exact 100% distribution
                  </span>
                ) : allocatedDiff > 0 ? (
                  <span className="text-amber-400">
                    Unallocated Buffer: {formatCurrency(allocatedDiff)} (
                    {Math.round((allocatedDiff / totalPlanned) * 100)}%)
                  </span>
                ) : (
                  <span className="text-rose-400">
                    Over-allocated by: {formatCurrency(Math.abs(allocatedDiff))}
                  </span>
                )}
              </div>
              <span className="font-mono text-slate-400">
                {Math.round((currentAllocatedSum / (totalPlanned || 1)) * 100)}% Allocated
              </span>
            </div>
          </div>

          {/* Category Input Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Category Planned Allocations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {DEFAULT_CATEGORIES.map((cat) => {
                const amount = targets[cat.key] || 0;
                const pct = totalPlanned > 0 ? Math.round((amount / totalPlanned) * 100) : 0;
                return (
                  <div
                    key={cat.key}
                    className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{cat.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {pct}% of Total
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={amount}
                        onChange={(e) => handleCategoryChange(cat.key, Number(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Targets...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Planned Targets</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
