import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Users,
  Package,
  Plus,
  ArrowRight,
  RefreshCw,
  Wallet,
  Clock,
  CalendarCheck,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../../services/api.ts';
import { DashboardData, UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';
import { ReceivePaymentModal } from '../../components/payments/ReceivePaymentModal.tsx';
import { InteractiveTrendGraphs } from '../../components/dashboard/InteractiveTrendGraphs.tsx';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleCustomEvent = () => {
      loadDashboard();
    };
    window.addEventListener('arambh-payment-recorded', handleCustomEvent);
    return () => window.removeEventListener('arambh-payment-recorded', handleCustomEvent);
  }, []);

  const handleOpenPayment = (item: any) => {
    const unifiedRecord: UnifiedPayment = {
      id: item.id || item._id,
      sourceType: item.type || 'CLIENT_RECEIPT',
      displayType: item.displayType || 'Site Owner Receipt',
      flow: item.type === 'SITE_OWNER_RECEIPT' ? 'INFLOW' : 'OUTFLOW',
      date: item.date,
      amount: item.amount,
      party: item.party,
      partyRole: 'Site Owner',
      projectName: item.projectName,
      siteName: 'Main Plot',
      paymentMethod: item.method || 'ONLINE',
      onlineMethod: item.onlineMethod,
      reference: item.receiptNumber,
      receiptNumber: item.receiptNumber,
      status: 'PAID',
    };
    setSelectedPayment(unifiedRecord);
    setDrawerOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Aggregating multi-ledger project financials...</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards;
  const charts = data?.charts;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Central Executive Cockpit
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LIVE LEDGER
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-site financial health, labor disbursements, and material inventories across Maharashtra.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          <button
            onClick={() => setReceiveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>
          <Link
            to="/admin/work-schedules"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Work Schedule</span>
          </Link>
          <Link
            to="/admin/projects"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>New Project</span>
          </Link>
          <Link
            to="/admin/expenses"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Expense</span>
          </Link>
          <Link
            to="/admin/payments"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Full Ledger</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Project Cost */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Project Cost</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(cards?.totalProjectCost)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>{cards?.totalProjects} Total Projects</span>
            <span className="text-amber-400 font-semibold">{cards?.activeProjects} Active</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Received</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(cards?.totalReceived)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Progress: {cards?.overallPaymentProgress}%</span>
            <span className="text-slate-300">Cash: {formatCurrency(cards?.cashReceived)}</span>
          </div>
        </div>

        {/* Total Pending Balance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {formatCurrency(cards?.totalPending)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Remaining from Owners</span>
            <span className="text-amber-400 font-semibold">{100 - (cards?.overallPaymentProgress || 0)}% Due</span>
          </div>
        </div>

        {/* Remaining Budget (Cash Inflow - Expenses) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 transition-all shadow-lg space-y-2">
          <div className="flex justify-between items-center text-xs text-amber-400">
            <span className="font-bold uppercase tracking-wider">Remaining Budget</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(cards?.remainingBudget)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Expenses: {formatCurrency(cards?.totalExpenses)}</span>
            <span className="text-emerald-400 font-semibold">Healthy Liquidity</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Outflows Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block">Labor Wages Settled</span>
          <span className="text-lg font-bold text-sky-400 font-mono">{formatCurrency(cards?.workerPayments)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block">Materials Procured</span>
          <span className="text-lg font-bold text-amber-400 font-mono">{formatCurrency(cards?.materialExpenses)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block">Vendor Subcontracts</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(cards?.vendorPayments)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block">Direct Overheads & Transport</span>
          <span className="text-lg font-bold text-purple-400 font-mono">
            {formatCurrency((cards?.transportExpenses || 0) + (cards?.otherExpenses || 0))}
          </span>
        </div>
      </div>

      {/* Low Stock Alert Banner if any */}
      {cards?.lowStockCount && cards.lowStockCount > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-200">
                Low Inventory Warning: {cards.lowStockCount} Material(s) Below Critical Reserve
              </h4>
              <p className="text-[11px] text-amber-300/80">
                {data?.lowStockMaterials?.map((m) => `${m.name} (${m.currentStock}/${m.minimumStock} ${m.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            to="/admin/materials"
            className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors shrink-0"
          >
            Review Stock
          </Link>
        </div>
      ) : null}

      {/* Primary Interactive Monthly Trend Graphs (Recharts) */}
      <InteractiveTrendGraphs
        monthlyTrends={charts?.monthlyTrends || []}
        projectMonthlyTrends={charts?.projectMonthlyTrends || []}
        projects={charts?.projectPaymentProgress || []}
      />

      {/* Secondary Project & Expense Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Payment Progress */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Payment Collection</h3>
              <p className="text-xs text-slate-400">Total Project Contract Cost vs Actual Collected to date</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.projectPaymentProgress || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val / 100000}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(val), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="cost" name="Total Cost" fill="#475569" radius={[6, 6, 0, 0]} />
                <Bar dataKey="received" name="Received" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Donut */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Operational Expense Allocation</h3>
              <p className="text-xs text-slate-400">Cost distribution across workers, materials & overheads</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {formatCurrency(cards?.totalExpenses)} Total
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.expenseBreakdown || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {charts?.expenseBreakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(val), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash vs Online Distribution */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cash vs Online Channel Split</h3>
            <p className="text-xs text-slate-400">Bank transfers (UPI, NEFT, RTGS) vs physical cash vouchers</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Receipts Channel</span>
              <div className="text-emerald-400 font-mono font-bold text-base">
                Online: {formatCurrency(cards?.onlineReceived)}
              </div>
              <div className="text-slate-400 font-mono text-xs mt-1">
                Cash: {formatCurrency(cards?.cashReceived)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 font-semibold block mb-1">Disbursements Channel</span>
              <div className="text-purple-400 font-mono font-bold text-base">
                Online: {formatCurrency(cards?.onlineExpenses)}
              </div>
              <div className="text-slate-400 font-mono text-xs mt-1">
                Cash: {formatCurrency(cards?.cashExpenses)}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Online Method Volumes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {charts?.onlineMethodsBreakdown?.map((m) => (
                <div key={m.method} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{m.method}</span>
                  <span className="font-mono font-bold text-slate-200">{formatCurrency(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">6-Month Cashflow Trajectory</h3>
            <p className="text-xs text-slate-400">Monthly site owner milestone collections vs operational burn</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="receiptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 100000}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(val), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="receipts" name="Owner Receipts" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#receiptGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenditures" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables: Recent Projects & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Projects</h3>
              <p className="text-xs text-slate-400">Click any project to inspect sites and ledgers</p>
            </div>
            <Link
              to="/admin/projects"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {data?.recentProjects?.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/projects/${p.id}`)}
                className="p-3.5 rounded-2xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-amber-400 text-sm">
                      {p.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {p.location} • {p.client}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-white text-sm block">
                    {formatCurrency(p.contractValue)}
                  </span>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <span className="text-[11px] text-amber-400 font-semibold">{p.progress}%</span>
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Latest Financial Entries</h3>
              <p className="text-xs text-slate-400">Click to open payment voucher or audit details</p>
            </div>
            <Link
              to="/admin/payments"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Open Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {data?.recentTransactions?.map((t: any) => (
              <div
                key={t.id}
                onClick={() => handleOpenPayment(t)}
                className="p-3 rounded-2xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs group-hover:text-amber-400">
                        {t.party}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t.receiptNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.projectName} • {formatDate(t.date)} ({t.method})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +{formatCurrency(t.amount)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Voucher</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Slide-Over Drawer */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReversalSuccess={loadDashboard}
      />

      {/* Quick Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onSuccess={loadDashboard}
      />
    </div>
  );
}
