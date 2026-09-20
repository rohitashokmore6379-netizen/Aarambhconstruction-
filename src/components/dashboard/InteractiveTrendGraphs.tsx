import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Users,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Activity,
  ChevronDown,
  Building2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { MonthlyTrendItem, ProjectTrendSummary } from '../../types.ts';
import { formatCurrency } from '../../utils/formatters.ts';

type ViewMode = 'COMBINED' | 'CASHFLOW' | 'EXPENSES' | 'UTILIZATION';
type Timeframe = '6M' | '12M' | 'ALL';

interface InteractiveTrendGraphsProps {
  monthlyTrends: MonthlyTrendItem[];
  projectMonthlyTrends?: ProjectTrendSummary[];
  projects?: Array<{ id: string; name: string; code?: string }>;
}

export function InteractiveTrendGraphs({
  monthlyTrends = [],
  projectMonthlyTrends = [],
  projects = [],
}: InteractiveTrendGraphsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('COMBINED');
  const [timeframe, setTimeframe] = useState<Timeframe>('12M');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Series visibility toggles
  const [showIncome, setShowIncome] = useState<boolean>(true);
  const [showExpenses, setShowExpenses] = useState<boolean>(true);
  const [showUtilization, setShowUtilization] = useState<boolean>(true);
  const [showNetCashFlow, setShowNetCashFlow] = useState<boolean>(false);

  // 1. Resolve active dataset based on Project Selection
  const rawData: MonthlyTrendItem[] = useMemo(() => {
    if (selectedProjectId === 'ALL' || !projectMonthlyTrends?.length) {
      return monthlyTrends || [];
    }
    const found = projectMonthlyTrends.find((p) => p.projectId === selectedProjectId);
    return found ? found.monthlyTrends : monthlyTrends || [];
  }, [selectedProjectId, projectMonthlyTrends, monthlyTrends]);

  // 2. Filter dataset based on Timeframe
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    if (timeframe === '6M') {
      return rawData.slice(-6);
    }
    if (timeframe === '12M') {
      return rawData.slice(-12);
    }
    return rawData;
  }, [rawData, timeframe]);

  // 3. Compute High-Level Financial & Workforce KPIs for the active slice
  const kpis = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        avgMargin: 0,
        avgMonthlyIncome: 0,
        avgMonthlyBurn: 0,
        avgUtilization: 0,
        peakUtilization: 0,
        peakMonth: 'N/A',
        totalWorkerDays: 0,
      };
    }

    let incomeSum = 0;
    let expenseSum = 0;
    let utilizationSum = 0;
    let peakUtil = -1;
    let peakMon = '';
    let workerDaysSum = 0;

    filteredData.forEach((item) => {
      incomeSum += item.income || 0;
      expenseSum += item.expenses || 0;
      const util = item.workerUtilizationRate || 0;
      utilizationSum += util;
      workerDaysSum += item.workerDays || 0;

      if (util > peakUtil) {
        peakUtil = util;
        peakMon = item.month;
      }
    });

    const net = incomeSum - expenseSum;
    const avgMargin = incomeSum > 0 ? Math.round((net / incomeSum) * 100) : 0;
    const count = filteredData.length;

    return {
      totalIncome: incomeSum,
      totalExpenses: expenseSum,
      netCashFlow: net,
      avgMargin,
      avgMonthlyIncome: Math.round(incomeSum / count),
      avgMonthlyBurn: Math.round(expenseSum / count),
      avgUtilization: Math.round(utilizationSum / count),
      peakUtilization: peakUtil >= 0 ? peakUtil : 0,
      peakMonth: peakMon || 'N/A',
      totalWorkerDays: workerDaysSum,
    };
  }, [filteredData]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = [
      'Month',
      'Income (INR)',
      'Total Expenses (INR)',
      'Net Cash Flow (INR)',
      'Worker Wages (INR)',
      'Material Expenses (INR)',
      'Vendor Subcontracts (INR)',
      'Other Overheads (INR)',
      'Worker Days Deployed',
      'Worker Utilization (%)',
      'Total Labor Hours',
    ];

    const rows = filteredData.map((d) => [
      `"${d.month}"`,
      d.income,
      d.expenses,
      d.netCashFlow,
      d.workerExpenses,
      d.materialExpenses,
      d.vendorExpenses,
      d.otherExpenses,
      d.workerDays,
      `${d.workerUtilizationRate}%`,
      d.totalLaborHours,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monthly_trend_analytics_${selectedProjectId}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Interactive Tooltip
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload as MonthlyTrendItem;
    if (!d) return null;

    return (
      <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md text-xs space-y-3 min-w-[280px]">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-black text-white text-sm">{d.month}</span>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              d.netCashFlow >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {d.netCashFlow >= 0 ? `+${formatCurrency(d.netCashFlow)} Surplus` : `${formatCurrency(d.netCashFlow)} Deficit`}
          </span>
        </div>

        {/* Financial Flow Section */}
        <div className="space-y-1.5 font-mono">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Monthly Income:
            </span>
            <span className="font-bold text-emerald-400">{formatCurrency(d.income)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Total Outflows:
            </span>
            <span className="font-bold text-amber-400">{formatCurrency(d.expenses)}</span>
          </div>

          {/* Outflow Sub-breakdown */}
          <div className="pl-3.5 pr-1 py-1.5 bg-slate-900/70 rounded-xl space-y-1 text-[11px] border border-slate-800/60">
            <div className="flex justify-between text-slate-400">
              <span>Materials:</span>
              <span className="text-amber-300">{formatCurrency(d.materialExpenses)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Worker Wages:</span>
              <span className="text-sky-300">{formatCurrency(d.workerExpenses)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Vendor Subcontracts:</span>
              <span className="text-emerald-300">{formatCurrency(d.vendorExpenses)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Direct Overheads:</span>
              <span className="text-purple-300">{formatCurrency(d.otherExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Workforce Utilization Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              Worker Utilization:
            </span>
            <span className="font-bold text-sky-400 font-mono text-sm">{d.workerUtilizationRate}%</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1">
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-slate-500 block text-[9px] uppercase">Labor Shifts</span>
              <span className="font-bold text-white">{d.workerDays} days</span>
            </div>
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-slate-500 block text-[9px] uppercase">Labor Hours</span>
              <span className="font-bold text-white">{d.totalLaborHours} hrs</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
      {/* Decorative subtle background accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-white tracking-tight">
              Monthly Operational & Financial Trajectory
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              RECHARTS INTERACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic correlation of project disbursements, contract revenues, and site labor utilization over time.
          </p>
        </div>

        {/* Interactive Controls Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Scope Filter */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 pl-3 pr-8 py-1.5 rounded-xl font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Projects (Portfolio)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['6M', '12M', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tf === '6M' ? '6 Months' : tf === '12M' ? '12 Months' : 'All Time'}
              </button>
            ))}
          </div>

          {/* View Mode Selector Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('COMBINED')}
              title="Combined Inflow, Outflow & Workforce Utilization"
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'COMBINED'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Combined</span>
            </button>
            <button
              onClick={() => setViewMode('CASHFLOW')}
              title="Net Cashflow Trend"
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'CASHFLOW'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Cashflow</span>
            </button>
            <button
              onClick={() => setViewMode('EXPENSES')}
              title="Expense Category Trajectory"
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'EXPENSES'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3 h-3" />
              <span>Outflows</span>
            </button>
            <button
              onClick={() => setViewMode('UTILIZATION')}
              title="Worker Utilization & Shifts"
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'UTILIZATION'
                  ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Labor Force</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            title="Download Monthly Trend Data as CSV"
            className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executive KPI Micro-Cards for Current View Slice */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Income in View */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
            <span>Period Inflows</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(kpis.totalIncome)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Avg: {formatCurrency(kpis.avgMonthlyIncome)}/mo
          </div>
        </div>

        {/* Total Expenses in View */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
            <span>Period Outflows</span>
            <ArrowDownRight className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(kpis.totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Burn: {formatCurrency(kpis.avgMonthlyBurn)}/mo
          </div>
        </div>

        {/* Net Cashflow Margin */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
            <span>Net Liquidity</span>
            <Banknote className="w-3 h-3 text-purple-400" />
          </div>
          <div
            className={`text-base font-black font-mono tracking-tight ${
              kpis.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(kpis.netCashFlow)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Margin: {kpis.avgMargin}%</div>
        </div>

        {/* Avg Worker Utilization */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
            <span>Avg Utilization</span>
            <Activity className="w-3 h-3 text-sky-400" />
          </div>
          <div className="text-base font-black text-sky-400 font-mono tracking-tight">
            {kpis.avgUtilization}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {kpis.totalWorkerDays} shifts deployed
          </div>
        </div>

        {/* Peak Workforce Utilization */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
            <span>Peak Utilization</span>
            <Users className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-black text-white font-mono tracking-tight">
            {kpis.peakUtilization}%
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono truncate">{kpis.peakMonth}</div>
        </div>
      </div>

      {/* Series Visibility Toggles (for Combined Mode) */}
      {viewMode === 'COMBINED' && (
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mr-1">
            Display Metrics:
          </span>
          <button
            onClick={() => setShowIncome(!showIncome)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showIncome
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Monthly Income</span>
          </button>

          <button
            onClick={() => setShowExpenses(!showExpenses)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showExpenses
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Monthly Expenses</span>
          </button>

          <button
            onClick={() => setShowUtilization(!showUtilization)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showUtilization
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Worker Utilization (%)</span>
          </button>

          <button
            onClick={() => setShowNetCashFlow(!showNetCashFlow)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showNetCashFlow
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Net Cashflow Margin</span>
          </button>
        </div>
      )}

      {/* Main Chart Canvas */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'COMBINED' ? (
            <ComposedChart
              data={filteredData}
              margin={{ top: 15, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}k`}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke="#38bdf8"
                tick={{ fontSize: 10, fill: '#38bdf8' }}
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                iconType="circle"
              />

              {showIncome && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="income"
                  name="Monthly Inflow (Client Collections)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeAreaGrad)"
                />
              )}

              {showExpenses && (
                <Bar
                  yAxisId="left"
                  dataKey="expenses"
                  name="Monthly Outflow (Total Expenses)"
                  fill="url(#expenseBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              )}

              {showNetCashFlow && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="netCashFlow"
                  name="Net Cashflow"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#c084fc' }}
                />
              )}

              {showUtilization && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="workerUtilizationRate"
                  name="Worker Utilization Rate (%)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#38bdf8' }}
                />
              )}
            </ComposedChart>
          ) : viewMode === 'CASHFLOW' ? (
            <AreaChart
              data={filteredData}
              margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}k`}`}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="income"
                name="Project Inflow"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#incomeFill)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Project Expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fill="url(#expenseFill)"
              />
            </AreaChart>
          ) : viewMode === 'EXPENSES' ? (
            <BarChart
              data={filteredData}
              margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(0)}k`}`}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
              <Bar dataKey="materialExpenses" name="Materials" stackId="exp" fill="#f59e0b" />
              <Bar dataKey="workerExpenses" name="Labor Wages" stackId="exp" fill="#0284c7" />
              <Bar dataKey="vendorExpenses" name="Subcontractors" stackId="exp" fill="#10b981" />
              <Bar
                dataKey="otherExpenses"
                name="Direct Overheads"
                stackId="exp"
                fill="#a855f7"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          ) : (
            <ComposedChart
              data={filteredData}
              margin={{ top: 15, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis
                yAxisId="shifts"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(val) => `${val}d`}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                domain={[0, 100]}
                stroke="#38bdf8"
                tick={{ fontSize: 10, fill: '#38bdf8' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} iconType="circle" />
              <Bar
                yAxisId="shifts"
                dataKey="workerDays"
                name="Total Worker Days Deployed"
                fill="#0284c7"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="workerUtilizationRate"
                name="Workforce Capacity Utilization (%)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Dynamic Summary Strip at Bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Showing <strong className="text-slate-200 font-mono">{filteredData.length} active months</strong> of
            operational and labor data for{' '}
            <strong className="text-amber-400">
              {selectedProjectId === 'ALL'
                ? 'All Projects Portfolio'
                : projects.find((p) => p.id === selectedProjectId)?.name || 'Selected Project'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-400">
            Monthly Run-rate:{' '}
            <strong className="text-white">{formatCurrency(kpis.avgMonthlyBurn)}</strong>
          </span>
          <span className="text-slate-400">
            Workforce Efficiency:{' '}
            <strong className="text-sky-400">{kpis.avgUtilization}% Avg</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
