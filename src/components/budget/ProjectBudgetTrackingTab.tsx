import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  RefreshCw,
  Settings2,
  Package,
  Receipt,
  Layers,
  HardHat,
  Truck,
  Wrench,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api.ts';
import { Project, Site, ProjectBudgetTrackingData, BudgetCategoryComparison } from '../../types.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';
import { BudgetPlanConfigModal } from './BudgetPlanConfigModal.tsx';

interface ProjectBudgetTrackingTabProps {
  projectId: string;
  project: Project;
  sites: Site[];
  onProjectUpdated?: () => void;
}

export function ProjectBudgetTrackingTab({
  projectId,
  project,
  sites,
  onProjectUpdated,
}: ProjectBudgetTrackingTabProps) {
  const [data, setData] = useState<ProjectBudgetTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [activeChartTab, setActiveChartTab] = useState<'comparison' | 'trajectory' | 'composition'>('comparison');
  const [activeDrilldownTab, setActiveDrilldownTab] = useState<'overview' | 'materials' | 'expenses'>('overview');
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>('ALL');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string>('ALL');
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadBudgetData = async (isSilent = false) => {
    if (!projectId) return;
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    try {
      const siteParam = selectedSite !== 'ALL' ? `?siteId=${selectedSite}` : '';
      const res = await api.get(`/admin/projects/${projectId}/budget-tracking${siteParam}`);
      if (res.data.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load project budget tracking data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [projectId, selectedSite]);

  // Icon mapping for categories
  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'MATERIALS':
        return Package;
      case 'LABOR':
        return HardHat;
      case 'EQUIPMENT':
        return Wrench;
      case 'TRANSPORT':
        return Truck;
      case 'SUBCONTRACT':
        return Building;
      case 'OVERHEADS':
      default:
        return Receipt;
    }
  };

  // Prepare chart data for Planned vs Actual Comparison
  const comparisonChartData = useMemo(() => {
    if (!data) return [];
    return data.categoryComparisons.map((c) => ({
      name: c.label.replace(' Procurement', '').replace(' Rental', ''),
      Planned: c.plannedAmount,
      Actual: c.actualAmount,
      Variance: c.variance,
      isOverrun: c.isOverrun,
      percentUsed: c.percentUsed,
    }));
  }, [data]);

  // Prepare composition data for Pie Chart
  const compositionChartData = useMemo(() => {
    if (!data) return [];
    return data.categoryComparisons
      .filter((c) => c.actualAmount > 0)
      .map((c) => ({
        name: c.label,
        value: c.actualAmount,
        color: c.color,
      }));
  }, [data]);

  // Filter materials items
  const filteredMaterialCategories = useMemo(() => {
    if (!data) return [];
    if (selectedMaterialCategory === 'ALL') {
      return data.materialsBreakdown;
    }
    return data.materialsBreakdown.filter((m) => m.categoryName === selectedMaterialCategory);
  }, [data, selectedMaterialCategory]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-white">Aggregating Live Project Expenditures...</p>
        <p className="text-xs text-slate-500 mt-1">
          Synchronizing records from MaterialPurchases and Direct Expenses modules
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-white">Failed to calculate budget tracking</p>
        <button
          onClick={() => loadBudgetData()}
          className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, categoryComparisons, alerts, monthlyTrend } = data;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Cost Surveillance
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Synced: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Project Budget Tracking & Cost Overrun Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time variance analysis pulling dynamic records from MaterialPurchases, Expenses, and Site Labor.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Site Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">Site:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                All Sites / Entire Project ({sites.length})
              </option>
              {sites.map((s) => (
                <option key={s._id} value={s._id} className="bg-slate-900 text-white">
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadBudgetData(true)}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh budget expenditures from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Configure Targets Modal Trigger */}
          <button
            onClick={() => setConfigModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure Targets</span>
          </button>
        </div>
      </div>

      {/* 2. Cockpit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Planned Target */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Planned Budget Ceiling</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(summary.totalPlannedBudget)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Contingency Reserve:</span>
            <span className="font-mono text-slate-400">{summary.contingencyPercentage}%</span>
          </div>
        </div>

        {/* Actual Total Expenditures */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Actual Total Spend</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(summary.totalActualExpenditures)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Utilization Rate:</span>
            <span
              className={`font-mono font-bold ${
                summary.isOverrun
                  ? 'text-rose-400'
                  : summary.percentUsed >= summary.alertThresholdPercentage
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {summary.percentUsed}%
            </span>
          </div>
        </div>

        {/* Variance / Cost Overrun Status */}
        <div
          className={`p-5 rounded-3xl space-y-2 shadow-lg border ${
            summary.isOverrun
              ? 'bg-rose-950/20 border-rose-500/30'
              : summary.status === 'WARNING'
              ? 'bg-amber-950/20 border-amber-500/30'
              : 'bg-emerald-950/20 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-semibold ${
                summary.isOverrun
                  ? 'text-rose-400'
                  : summary.status === 'WARNING'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {summary.isOverrun ? 'Cost Overrun Deficit' : 'Budget Remaining'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                summary.isOverrun
                  ? 'bg-rose-500/20 text-rose-400'
                  : summary.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {summary.isOverrun ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-xl font-bold tracking-tight ${
              summary.isOverrun ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {summary.isOverrun
              ? `+${formatCurrency(summary.overrunAmount)}`
              : formatCurrency(summary.variance)}
          </div>
          <div className="text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                summary.isOverrun
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  : summary.status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {summary.isOverrun
                ? 'OVERRUN DETECTED'
                : summary.status === 'WARNING'
                ? 'NEAR CEILING'
                : 'UNDER BUDGET'}
            </span>
          </div>
        </div>

        {/* Material Purchases Module Pull */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Material Purchases Module</span>
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(summary.materialPurchasesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Pending Liabilities:</span>
            <span className="font-mono text-amber-400">
              {formatCurrency(summary.materialPendingAmount)}
            </span>
          </div>
        </div>

        {/* Direct Expenses Module Pull */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold">Direct Expenses Module</span>
            <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {formatCurrency(summary.directExpensesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Labor / Wages Spend:</span>
            <span className="font-mono text-slate-300">
              {formatCurrency(summary.workerWagesTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Cost Overrun Alerts Banner Section */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span>{alert.title}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </h4>
                    {alert.overrunAmount > 0 && (
                      <span className="text-xs font-mono font-bold text-rose-400">
                        Overrun: +{formatCurrency(alert.overrunAmount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">All Categories Operating Within Planned Baseline</span>
                <p className="text-[11px] text-emerald-400/80">
                  No cost overruns detected. Total actual spend is within safe limits (
                  {summary.percentUsed}% of ceiling).
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              HEALTHY VARIANCE
            </span>
          </div>
        )}
      </div>

      {/* 4. Interactive Visual Charts Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Planned vs. Actual Visual Analytics</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Comparative visualization of expenditure allocations and real-time consumption rates
            </p>
          </div>

          {/* Chart Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveChartTab('comparison')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeChartTab === 'comparison'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Category Comparison</span>
            </button>

            <button
              onClick={() => setActiveChartTab('trajectory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeChartTab === 'trajectory'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cumulative Burn Rate</span>
            </button>

            <button
              onClick={() => setActiveChartTab('composition')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeChartTab === 'composition'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Expenditure Share</span>
            </button>
          </div>
        </div>

        {/* Chart Render */}
        <div className="h-80 w-full">
          {activeChartTab === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const planned = Number(payload[0]?.value) || 0;
                      const actual = Number(payload[1]?.value) || 0;
                      const diff = planned - actual;
                      const isOver = actual > planned;
                      return (
                        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-blue-400">
                            Planned Budget: <strong>{formatCurrency(planned)}</strong>
                          </p>
                          <p className="text-amber-400">
                            Actual Expenditure: <strong>{formatCurrency(actual)}</strong>
                          </p>
                          <div className="pt-1 border-t border-slate-800 font-mono">
                            {isOver ? (
                              <span className="text-rose-400 font-bold">
                                Cost Overrun: +{formatCurrency(Math.abs(diff))}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">
                                Remaining Balance: {formatCurrency(diff)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
                <Bar dataKey="Planned" name="Planned Target (₹)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="Actual"
                  name="Actual Spent (₹)"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                >
                  {comparisonChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOverrun ? '#f43f5e' : entry.percentUsed >= 85 ? '#fbbf24' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'trajectory' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-amber-400">
                            Cumulative Actual: <strong>{formatCurrency(Number(payload[0]?.value))}</strong>
                          </p>
                          <p className="text-blue-400">
                            Planned Benchmark: <strong>{formatCurrency(Number(payload[1]?.value))}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeActual"
                  name="Cumulative Actual Spend (₹)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#actualGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="plannedTrajectory"
                  name="Planned Baseline Trajectory (₹)"
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#plannedGrad)"
                />
                <ReferenceLine
                  y={summary.totalPlannedBudget}
                  label={{
                    value: `Ceiling: ${formatCurrency(summary.totalPlannedBudget)}`,
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeChartTab === 'composition' && (
            <div className="h-full flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={compositionChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {compositionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Expenditure']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {compositionChartData.map((item) => {
                  const share =
                    summary.totalActualExpenditures > 0
                      ? Math.round((item.value / summary.totalActualExpenditures) * 100)
                      : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(item.value)} ({share}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Category Breakdown Table & Dual-Layer Progress Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Category Budget Baseline vs. Actual Expenditures
            </h3>
            <p className="text-[11px] text-slate-400">
              Granular breakdown across all construction expenditure heads with active overrun flags
            </p>
          </div>
          <button
            onClick={() => setConfigModalOpen(true)}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Edit Allocations</span>
          </button>
        </div>

        <div className="space-y-4">
          {categoryComparisons.map((cat: BudgetCategoryComparison) => {
            const Icon = getCategoryIcon(cat.key);
            const isOver = cat.isOverrun;
            const isNear = cat.status === 'WARNING';
            const progressPercent = Math.min(cat.percentUsed, 100);

            return (
              <div
                key={cat.key}
                className={`p-4 rounded-2xl border transition-all ${
                  isOver
                    ? 'bg-rose-950/10 border-rose-500/30'
                    : isNear
                    ? 'bg-amber-950/10 border-amber-500/20'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Top Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl border shrink-0"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}35`,
                        color: cat.color,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{cat.label}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                            isOver
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isNear
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOver ? 'COST OVERRUN' : isNear ? 'AT RISK' : 'WITHIN BUDGET'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({cat.itemsCount} transaction{cat.itemsCount === 1 ? '' : 's'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{cat.description}</p>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Planned Target</div>
                      <div className="font-bold text-slate-200">{formatCurrency(cat.plannedAmount)}</div>
                    </div>

                    <div className="text-slate-600">/</div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Actual Spent</div>
                      <div
                        className={`font-bold ${
                          isOver ? 'text-rose-400 font-extrabold' : 'text-amber-400'
                        }`}
                      >
                        {formatCurrency(cat.actualAmount)}
                      </div>
                    </div>

                    <div className="text-slate-600">/</div>

                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        {isOver ? 'Overrun Amount' : 'Remaining'}
                      </div>
                      <div
                        className={`font-bold ${
                          isOver ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isOver
                          ? `+${formatCurrency(cat.overrunAmount)}`
                          : formatCurrency(cat.variance)}
                      </div>
                    </div>

                    <div className="pl-2 border-l border-slate-800 min-w-[50px] text-right">
                      <div className="text-[10px] text-slate-500 uppercase">Utilized</div>
                      <div
                        className={`font-bold ${
                          isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {cat.percentUsed}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar (Dual-Layer) */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden flex relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {isOver && (
                    <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono">
                      <span>Exceeded planned allocation by {Math.round(cat.percentUsed - 100)}%</span>
                      <span>Action required: Reallocate from contingency</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Drilldown Feed Tabs (Pulling directly from MaterialPurchases & Expenses modules) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Real-Time Module Expenditure Logs</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct live feed of purchase orders and expense vouchers contributing to actual costs
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setActiveDrilldownTab('materials')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeDrilldownTab === 'materials'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>MaterialPurchases Module ({data.counts.materialPurchasesCount})</span>
            </button>

            <button
              onClick={() => setActiveDrilldownTab('expenses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                activeDrilldownTab === 'expenses'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Expenses Module ({data.counts.expensesCount})</span>
            </button>
          </div>
        </div>

        {/* MATERIAL PURCHASES DRILLDOWN */}
        {activeDrilldownTab === 'materials' && (
          <div className="space-y-4">
            {/* Material Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => setSelectedMaterialCategory('ALL')}
                className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
                  selectedMaterialCategory === 'ALL'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Raw Materials
              </button>
              {data.materialsBreakdown.map((m) => (
                <button
                  key={m.categoryName}
                  onClick={() => setSelectedMaterialCategory(m.categoryName)}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedMaterialCategory === m.categoryName
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{m.categoryName}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                    {formatCurrency(m.totalAmount)}
                  </span>
                </button>
              ))}
            </div>

            {/* Material Cards & Item Logs */}
            {filteredMaterialCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No material purchases recorded for this selection.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMaterialCategories.map((group) => (
                  <div
                    key={group.categoryName}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">{group.categoryName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({group.count} purchase orders)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {formatCurrency(group.totalAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          ({group.sharePercentage}% of total materials)
                        </span>
                      </div>
                    </div>

                    {/* Table of Individual Purchases */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2 font-semibold">Material Item</th>
                            <th className="pb-2 font-semibold">Vendor</th>
                            <th className="pb-2 font-semibold">Site / Plot</th>
                            <th className="pb-2 font-semibold text-right">Quantity</th>
                            <th className="pb-2 font-semibold text-right">Unit Price</th>
                            <th className="pb-2 font-semibold text-right">Total Cost</th>
                            <th className="pb-2 font-semibold text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 font-mono">
                          {group.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-800/30">
                              <td className="py-2 text-white font-sans font-medium">
                                {item.materialName}
                              </td>
                              <td className="py-2 text-slate-400">{item.vendor}</td>
                              <td className="py-2 text-slate-400">{item.siteName}</td>
                              <td className="py-2 text-right text-slate-300">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2 text-right text-slate-400">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2 text-right font-bold text-amber-400">
                                {formatCurrency(item.totalAmount)}
                              </td>
                              <td className="py-2 text-right text-slate-500 font-sans">
                                {formatDate(item.purchaseDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DIRECT EXPENSES DRILLDOWN */}
        {activeDrilldownTab === 'expenses' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">Direct Project Expenses</span>
                <p className="text-[11px] text-slate-400">
                  Total Operational Overhead: {formatCurrency(summary.directExpensesTotal)} across{' '}
                  {data.counts.expensesCount} vouchers
                </p>
              </div>
              <Link
                to="/admin/expenses"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <span>Open Expenses Directory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Expenses Summary by Heads */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {categoryComparisons
                .filter((c) => c.key !== 'MATERIALS' && c.key !== 'LABOR')
                .map((cat) => (
                  <div
                    key={cat.key}
                    className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1"
                  >
                    <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">
                      {cat.label}
                    </div>
                    <div className="text-xs font-bold text-white font-mono">
                      {formatCurrency(cat.actualAmount)}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      Planned: {formatCurrency(cat.plannedAmount)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Configuration Modal */}
      <BudgetPlanConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        projectId={projectId}
        projectName={project.projectName}
        initialTotalPlanned={summary.totalPlannedBudget}
        initialContingency={summary.contingencyPercentage}
        initialThreshold={summary.alertThresholdPercentage}
        initialCategoryTargets={categoryComparisons.map((c) => ({
          category: c.key,
          plannedAmount: c.plannedAmount,
        }))}
        onSaved={() => {
          loadBudgetData(true);
          if (onProjectUpdated) onProjectUpdated();
        }}
      />
    </div>
  );
}
