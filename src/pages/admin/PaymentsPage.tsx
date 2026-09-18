import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  RotateCcw,
  Printer,
  ChevronDown,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api.ts';
import { UnifiedPayment, Project, Site } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';
import { ReceivePaymentModal } from '../../components/payments/ReceivePaymentModal.tsx';

export function PaymentsPage() {
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterSite, setFilterSite] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Drawer
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);

  // Aggregated Totals
  const [totals, setTotals] = useState({
    inflow: 0,
    outflow: 0,
    net: 0,
  });

  const loadAllPayments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (filterProject !== 'ALL') params.projectId = filterProject;
      if (filterSite !== 'ALL') params.siteId = filterSite;
      if (filterMethod !== 'ALL') params.paymentMethod = filterMethod;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [payRes, projRes, siteRes] = await Promise.all([
        api.get('/admin/payments', { params }),
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);

      if (payRes.data.success) {
        setPayments(payRes.data.data);
        if (payRes.data.totals) {
          setTotals(payRes.data.totals);
        }
      }

      if (projRes.data.success) {
        setProjects(projRes.data.data);
      }

      if (siteRes.data.success) {
        setSites(siteRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load unified payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPayments();

    const handleCustomEvent = () => {
      loadAllPayments();
    };
    window.addEventListener('arambh-payment-recorded', handleCustomEvent);
    return () => window.removeEventListener('arambh-payment-recorded', handleCustomEvent);
  }, [filterType, filterProject, filterSite, filterMethod, filterStatus, filterStartDate, filterEndDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAllPayments();
  };

  const handleRowClick = (payment: UnifiedPayment) => {
    setSelectedPayment(payment);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setFilterType('ALL');
    setFilterProject('ALL');
    setFilterSite('ALL');
    setFilterMethod('ALL');
    setFilterStatus('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Unified Multi-Ledger Register
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ALL 5 FLOWS
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete synchronized financial journal: Site Owner Receipts, Worker Payouts, Materials, Vendors & Overheads.
          </p>
        </div>

        <button
          onClick={() => setReceiveModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Payment</span>
        </button>
      </div>

      {/* Aggregate Totals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Inflows (Site Owners)
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              +{formatCurrency(totals.inflow)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Outflows (Procurement/Wages)
            </span>
            <div className="text-2xl font-black font-mono text-rose-400">
              -{formatCurrency(totals.outflow)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Net Working Capital
            </span>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrency(totals.net)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Multi-Ledger Audit Filters</span>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Row 1: Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Flow / Type */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Flow Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Financial Flows</option>
              <option value="SITE_OWNER_RECEIPT">Site Owner Receipts (+)</option>
              <option value="WORKER_PAYMENT">Worker Wage Payments (-)</option>
              <option value="MATERIAL_PURCHASE">Material Purchases (-)</option>
              <option value="VENDOR_PAYMENT">Vendor Settlements (-)</option>
              <option value="EXPENSE">Direct Overheads (-)</option>
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Project</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectCode} - {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Site */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Site / Plot</label>
            <select
              value={filterSite}
              onChange={(e) => setFilterSite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Sites</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          {/* Method */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Payment Channels</option>
              <option value="ONLINE">Online (UPI / NEFT / RTGS)</option>
              <option value="CASH">Physical Cash</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID / Active</option>
              <option value="REVERSED">REVERSED</option>
            </select>
          </div>
        </div>

        {/* Row 2: Search & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by party, receipt #, UTR, note..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </form>

          <div>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Unified Multi-Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Receipt / Voucher #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Flow</th>
                <th className="py-3.5 px-4">Ledger Type</th>
                <th className="py-3.5 px-4">Party / Beneficiary</th>
                <th className="py-3.5 px-4">Project & Site</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Synchronizing multi-ledger records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    No payment entries match the selected filters.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200 group-hover:text-amber-400">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          p.flow === 'INFLOW'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.flow}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {p.displayType}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200 block">{p.party}</span>
                      <span className="text-[10px] text-slate-400">{p.partyRole}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-white block font-medium">{p.projectName}</span>
                      <span className="text-[10px] text-slate-400">{p.siteName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {p.paymentMethod === 'ONLINE' ? (
                          <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="font-semibold text-slate-200">{p.paymentMethod}</span>
                      </div>
                      {p.onlineMethod && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {p.onlineMethod}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                      <span className={p.flow === 'INFLOW' ? 'text-emerald-400' : 'text-slate-200'}>
                        {p.flow === 'INFLOW' ? '+' : '-'}{formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p);
                        }}
                        className="px-2.5 py-1 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Drawer */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReversalSuccess={loadAllPayments}
      />

      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onSuccess={loadAllPayments}
      />
    </div>
  );
}
