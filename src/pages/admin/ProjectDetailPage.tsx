import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  User,
  ArrowLeft,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  HardHat,
  Package,
  CreditCard,
  Banknote,
  FileText,
  Camera,
  Calendar,
  Layers,
  AlertTriangle,
  Printer,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site, UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { ReceivePaymentModal } from '../../components/payments/ReceivePaymentModal.tsx';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'payments';

  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [transactions, setTransactions] = useState<UnifiedPayment[]>([]);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // New Site Modal
  const [newSiteModalOpen, setNewSiteModalOpen] = useState<boolean>(false);
  const [newSiteName, setNewSiteName] = useState<string>('');
  const [newSiteLocation, setNewSiteLocation] = useState<string>('');
  const [newSiteCost, setNewSiteCost] = useState<string>('');
  const [creatingSite, setCreatingSite] = useState<boolean>(false);

  const loadProjectData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, finRes, sitesRes, payRes, workRes, expRes] = await Promise.all([
        api.get(`/admin/projects/${id}`),
        api.get(`/admin/projects/${id}/financial-summary`),
        api.get(`/admin/sites?projectId=${id}`),
        api.get(`/admin/projects/${id}/payments`),
        api.get(`/admin/work-logs?projectId=${id}`),
        api.get(`/admin/expenses?projectId=${id}`),
      ]);

      if (projRes.data.success) {
        const p = projRes.data.data;
        if (finRes.data.success) {
          p.financials = finRes.data.data;
        }
        setProject(p);
      }

      if (sitesRes.data.success) {
        setSites(sitesRes.data.data);
      }

      if (payRes.data.success) {
        setTransactions(payRes.data.data);
      }

      if (workRes.data.success) {
        setWorkLogs(workRes.data.data);
      }

      if (expRes.data.success) {
        setExpenses(expRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !id) return;
    setCreatingSite(true);
    try {
      const res = await api.post('/admin/sites', {
        projectId: id,
        siteName: newSiteName.trim(),
        location: newSiteLocation.trim() || project?.location || 'Kolhapur',
        siteOwner: project?.client?.name || 'Site Owner',
        totalCost: Number(newSiteCost) || 0,
      });
      if (res.data.success) {
        setNewSiteModalOpen(false);
        setNewSiteName('');
        setNewSiteLocation('');
        setNewSiteCost('');
        loadProjectData();
      }
    } catch (err) {
      console.error('Failed to create site', err);
    } finally {
      setCreatingSite(false);
    }
  };

  const handleRowClick = (item: any) => {
    const record: UnifiedPayment = {
      id: item.id || item._id,
      sourceType: item.sourceType || 'CLIENT_RECEIPT',
      displayType: item.displayType || 'Site Owner Receipt',
      flow: item.flow || (item.sourceType === 'CLIENT_RECEIPT' ? 'INFLOW' : 'OUTFLOW'),
      date: item.date || item.paymentDate,
      amount: item.amount,
      party: item.party || item.ownerName || 'Party',
      partyRole: item.partyRole || 'Contractor',
      projectName: project?.projectName || 'Project',
      siteName: item.siteName || (typeof item.siteId === 'object' ? item.siteId?.siteName : 'Main Site'),
      paymentMethod: item.paymentMethod,
      onlineMethod: item.onlineMethod,
      reference: item.transactionReference || item.receiptNumber,
      receiptNumber: item.receiptNumber,
      status: item.status || 'PAID',
      description: item.description,
      raw: item.raw || item,
    };
    setSelectedPayment(record);
    setDrawerOpen(true);
  };

  if (loading && !project) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        Loading project cockpit and financial records...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Project not found</h2>
        <Link to="/admin/projects" className="text-xs text-amber-400 underline">
          Return to Projects Directory
        </Link>
      </div>
    );
  }

  const fin = project.financials;

  const tabs = [
    { key: 'payments', label: 'Financial Ledger & Receipts', icon: Receipt },
    { key: 'sites', label: `Sites & Plots (${sites.length})`, icon: Layers },
    { key: 'worklogs', label: `Daily Labor (${workLogs.length})`, icon: HardHat },
    { key: 'expenses', label: `Direct Expenses (${expenses.length})`, icon: Banknote },
    { key: 'overview', label: 'Project Specs & Client', icon: Building2 },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Projects Directory</span>
        </Link>
      </div>

      {/* Cockpit Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {project.projectCode}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusBadgeClass(project.status)}`}>
              {project.status}
            </span>
            <span className="text-xs text-slate-400">• {project.projectType}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">{project.projectName}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {project.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Site Owner: <strong className="text-white">{project.client?.name}</strong> ({project.client?.phone || 'N/A'})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setReceiveModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>
          <button
            onClick={() => setNewSiteModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Site</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards (5-Metric Strip) */}
      {fin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Cost */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Project Cost
            </span>
            <div className="text-xl font-black text-white font-mono">{formatCurrency(fin.totalCost)}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Contracted Scope</span>
          </div>

          {/* Total Received */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Received
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(fin.totalReceived)}</div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block font-semibold">
              {fin.paymentProgress}% Settled by Client
            </span>
          </div>

          {/* Pending Amount */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Pending from Client
            </span>
            <div className="text-xl font-black text-amber-400 font-mono">{formatCurrency(fin.pendingAmount)}</div>
            <span className="text-[10px] text-amber-400/80 mt-1 block font-semibold">
              {100 - fin.paymentProgress}% Balance Due
            </span>
          </div>

          {/* Total Incurred Expenses */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Total Site Expenses
            </span>
            <div className="text-xl font-black text-rose-400 font-mono">{formatCurrency(fin.totalExpenses)}</div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Labor: {formatCurrency(fin.workerExpenses)} | Mat: {formatCurrency(fin.materialExpenses)}
            </span>
          </div>

          {/* Remaining Budget (Inflow - Outflow) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/30 shadow-md">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
              Remaining Budget
            </span>
            <div className="text-xl font-black text-white font-mono">{formatCurrency(fin.remainingBudget)}</div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
              Available Cash Liquidity
            </span>
          </div>
        </div>
      )}

      {/* Progress Bars */}
      {fin && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Client Payment Collection Progress</span>
              <span className="font-mono text-emerald-400 font-bold">{fin.paymentProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(fin.paymentProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Financial Ledger & Receipts */}
      {currentTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Financial Transaction Ledger ({transactions.length})
              </h3>
              <p className="text-xs text-slate-400">
                Full history of client milestone payments, labor wages, and material disbursements for this project
              </p>
            </div>
            <button
              onClick={() => setReceiveModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Client Receipt</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type / Source</th>
                    <th className="py-3 px-4">Beneficiary / Party</th>
                    <th className="py-3 px-4">Site Location</th>
                    <th className="py-3 px-4">Mode / Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No transactions recorded yet for this project.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => handleRowClick(t)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-300">{formatDate(t.date)}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{t.displayType}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{t.receiptNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-200 block">{t.party}</span>
                          <span className="text-[10px] text-slate-400">{t.partyRole}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{t.siteName}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-amber-400">{t.paymentMethod}</span>
                          {t.onlineMethod && (
                            <span className="text-[10px] text-slate-400 block font-mono">({t.onlineMethod})</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                          <span className={t.flow === 'INFLOW' ? 'text-emerald-400' : 'text-slate-300'}>
                            {t.flow === 'INFLOW' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(t);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sites & Plots */}
      {currentTab === 'sites' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Construction Sites / Sub-Plots ({sites.length})
              </h3>
              <p className="text-xs text-slate-400">
                Detailed cost allocations and owner receipts broken down by physical plot/unit
              </p>
            </div>
            <button
              onClick={() => setNewSiteModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Site</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map((site) => (
              <div key={site._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{site.siteName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{site.location}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(site.status)}`}>
                    {site.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Site Owner:</span>
                    <span className="font-semibold text-white">{site.siteOwner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Site Total Cost:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(site.totalCost)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Labor & Work Logs */}
      {currentTab === 'worklogs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Daily Labor Muster Records ({workLogs.length})
              </h3>
              <p className="text-xs text-slate-400">
                Daily worker muster entries calculated as (daysWorked × dailyRate = wage amount)
              </p>
            </div>
            <Link
              to="/admin/work-logs"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs transition-colors"
            >
              Open Muster Log →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Worker</th>
                  <th className="py-3 px-4">Work Trade</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Wage Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No daily labor muster logs recorded for this project yet.
                    </td>
                  </tr>
                ) : (
                  workLogs.map((w: any) => (
                    <tr key={w._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-300">{formatDate(w.workDate)}</td>
                      <td className="py-3 px-4 font-bold text-white">{w.workerId?.name || 'Worker'}</td>
                      <td className="py-3 px-4 text-slate-400">{w.workTypeId?.name || w.workerId?.skill || 'Labor'}</td>
                      <td className="py-3 px-4 font-mono">{w.daysWorked}</td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(w.dailyRate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-400">
                        {formatCurrency(w.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Direct Expenses */}
      {currentTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Direct Operational Expenses ({expenses.length})
              </h3>
              <p className="text-xs text-slate-400">
                Categorized overheads: Transport, Equipment, Utilities, Site Food & Refreshments
              </p>
            </div>
            <Link
              to="/admin/expenses"
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
            >
              + Log New Expense
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No direct operational expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e: any) => (
                    <tr key={e._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-300">{formatDate(e.date)}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-400">{e.category}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">{e.description}</td>
                      <td className="py-3 px-4 text-slate-400">{e.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Overview & Specs */}
      {currentTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client & Agreement Specifications</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Client / Site Owner:</span>
                <span className="font-bold text-white">{project.client?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Contact Phone:</span>
                <span className="font-mono text-white">{project.client?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Contract Value:</span>
                <span className="font-mono font-bold text-amber-400">{formatCurrency(project.contractValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Project Type:</span>
                <span className="font-semibold text-white">{project.projectType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Contract Agreement Date:</span>
                <span className="text-white">{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Civil Engineering Scope</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {project.description || 'Turnkey civil construction scope governed under Arambh Engineering specifications.'}
            </p>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <Clock className="w-4 h-4" />
                <span>Active Quality Control & Laboratory Compression Testing Done</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Payment Voucher Drawer */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReversalSuccess={loadProjectData}
      />

      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={receiveModalOpen}
        initialProjectId={project._id}
        onClose={() => setReceiveModalOpen(false)}
        onSuccess={loadProjectData}
      />

      {/* New Site Modal */}
      {newSiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Site / Sub-Plot</h3>
            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Site / Unit Name *</label>
                <input
                  type="text"
                  required
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. Ground Floor RCC / Plot 2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Location Details</label>
                <input
                  type="text"
                  value={newSiteLocation}
                  onChange={(e) => setNewSiteLocation(e.target.value)}
                  placeholder={project.location}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Cost Allocated (₹)</label>
                <input
                  type="number"
                  value={newSiteCost}
                  onChange={(e) => setNewSiteCost(e.target.value)}
                  placeholder="1200000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewSiteModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSite}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
                >
                  {creatingSite ? 'Adding...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
