import React, { useState, useEffect } from 'react';
import { Banknote, Plus, Search, IndianRupee, RotateCcw, CreditCard, X, Filter } from 'lucide-react';
import api from '../../services/api.ts';
import { Expense, Project, Site, UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Add Expense Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('Transport');
  const [projectId, setProjectId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [onlineMethod, setOnlineMethod] = useState<string>('UPI');
  const [reference, setReference] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Drawer
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, projRes, siteRes] = await Promise.all([
        api.get('/admin/expenses'),
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);

      if (expRes.data.success) setExpenses(expRes.data.data);
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) setProjectId(projRes.data.data[0]._id);
      }
      if (siteRes.data.success) {
        setSites(siteRes.data.data);
        if (siteRes.data.data.length > 0) setSiteId(siteRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/expenses', {
        category,
        projectId: projectId || undefined,
        siteId: siteId || undefined,
        amount: Number(amount),
        paymentMethod,
        onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
        transactionReference: reference.trim() || undefined,
        description: description.trim(),
      });

      if (res.data.success) {
        setModalOpen(false);
        setAmount('');
        setDescription('');
        setReference('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to log expense', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (item: any) => {
    const unified: UnifiedPayment = {
      id: item._id,
      sourceType: 'EXPENSE',
      displayType: `Direct Expense (${item.category})`,
      flow: 'OUTFLOW',
      date: item.date,
      amount: item.amount,
      party: item.description,
      partyRole: 'Payee / Overheads',
      projectName: typeof item.projectId === 'object' ? item.projectId?.projectName : 'General Project',
      siteName: typeof item.siteId === 'object' ? item.siteId?.siteName : 'Main Site',
      paymentMethod: item.paymentMethod,
      onlineMethod: item.onlineMethod,
      reference: item.transactionReference || item.receiptNumber,
      receiptNumber: item.receiptNumber,
      status: item.status,
      description: item.description,
      raw: item,
    };
    setSelectedPayment(unified);
    setDrawerOpen(true);
  };

  const filteredExpenses = expenses.filter((e) => {
    return categoryFilter === 'ALL' || e.category === categoryFilter;
  });

  const totalExpense = filteredExpenses
    .filter((e) => e.status !== 'REVERSED')
    .reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Direct Site Expenses & Overheads</h1>
          <p className="text-xs text-slate-400 mt-1">
            Transport freight, JCB equipment rentals, municipal water tankers, and site food provisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase">Total Incurred Overheads</span>
            <span className="text-sm font-mono font-bold text-rose-400">{formatCurrency(totalExpense)}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Log Site Expense</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        {['ALL', 'Transport', 'Equipment', 'Utilities', 'Food', 'Govt Fees', 'Other'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              categoryFilter === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Particulars / Payee</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading direct expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr
                    key={e._id}
                    onClick={() => handleRowClick(e)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{e.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{formatDate(e.date)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-400">{e.category}</span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{e.description}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {typeof e.projectId === 'object' ? e.projectId?.projectName : 'General Project'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-300">{e.paymentMethod}</span>
                      {e.onlineMethod && (
                        <span className="text-[10px] text-slate-400 font-mono block">({e.onlineMethod})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(e.status)}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleRowClick(e);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] font-bold"
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

      {/* Slide-over Drawer */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReversalSuccess={loadData}
      />

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Log Site Operational Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Transport">Transport / Freight</option>
                    <option value="Equipment">Equipment / JCB Rental</option>
                    <option value="Utilities">Water Tanker & Power</option>
                    <option value="Food">Site Tea & Food Provision</option>
                    <option value="Govt Fees">Municipal / Sanction Fees</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="3500"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Site Allocation</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Central Office / Headquarters</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Particulars / Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Tractor diesel fuel & hydraulic oil"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online Transfer</option>
                  </select>
                </div>
                {paymentMethod === 'ONLINE' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Channel</label>
                    <select
                      value={onlineMethod}
                      onChange={(e) => setOnlineMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="UPI">UPI</option>
                      <option value="NEFT">NEFT</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>

              {paymentMethod === 'ONLINE' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UTR / Ref #</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="UPI/Ref ID"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
