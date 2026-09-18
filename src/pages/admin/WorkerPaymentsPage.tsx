import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Search, IndianRupee, RotateCcw, CreditCard, Banknote, X } from 'lucide-react';
import api from '../../services/api.ts';
import { WorkerPayment, Worker, Project, Site, UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';

export function WorkerPaymentsPage() {
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Payout Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [workerId, setWorkerId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [onlineMethod, setOnlineMethod] = useState<string>('UPI');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Drawer
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, workRes, projRes, siteRes] = await Promise.all([
        api.get('/admin/worker-payments'),
        api.get('/admin/workers'),
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);

      if (payRes.data.success) setPayments(payRes.data.data);
      if (workRes.data.success) {
        setWorkers(workRes.data.data);
        if (workRes.data.data.length > 0) setWorkerId(workRes.data.data[0]._id);
      }
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) setProjectId(projRes.data.data[0]._id);
      }
      if (siteRes.data.success) {
        setSites(siteRes.data.data);
        if (siteRes.data.data.length > 0) setSiteId(siteRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load worker payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId || !projectId || !amount) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/worker-payments', {
        workerId,
        projectId,
        siteId: siteId || undefined,
        amount: Number(amount),
        paymentMethod,
        onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
        transactionReference: reference.trim(),
        notes: notes.trim(),
      });

      if (res.data.success) {
        setModalOpen(false);
        setAmount('');
        setReference('');
        setNotes('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to disburse worker wage', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (item: any) => {
    const unified: UnifiedPayment = {
      id: item._id,
      sourceType: 'WORKER_PAYMENT',
      displayType: 'Worker Wage Payout',
      flow: 'OUTFLOW',
      date: item.paymentDate,
      amount: item.amount,
      party: typeof item.workerId === 'object' ? item.workerId?.name : 'Worker',
      partyRole: typeof item.workerId === 'object' ? item.workerId?.skill : 'Labor',
      projectName: typeof item.projectId === 'object' ? item.projectId?.projectName : 'Project',
      siteName: typeof item.siteId === 'object' ? item.siteId?.siteName : 'Main Site',
      paymentMethod: item.paymentMethod,
      onlineMethod: item.onlineMethod,
      reference: item.transactionReference,
      receiptNumber: item.receiptNumber,
      status: item.status,
      description: item.notes,
      raw: item,
    };
    setSelectedPayment(unified);
    setDrawerOpen(true);
  };

  const totalPaid = payments.filter((p) => p.status !== 'REVERSED').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Labor Wage Disbursements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cash vouchers and UPI wage payouts disbursed to site mistris and labor teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase">Total Wage Settled</span>
            <span className="text-sm font-mono font-bold text-sky-400">{formatCurrency(totalPaid)}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Disburse Worker Wage</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Project & Site</th>
                <th className="py-3 px-4">Mode / Ref</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading wage disbursements...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No worker wage payments logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{p.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {typeof p.workerId === 'object' ? p.workerId?.name : 'Worker'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200 block">
                        {typeof p.projectId === 'object' ? p.projectId?.projectName : 'Project'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {typeof p.siteId === 'object' ? p.siteId?.siteName : 'Main Site'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-400">{p.paymentMethod}</span>
                      {p.onlineMethod && (
                        <span className="text-[10px] text-slate-400 font-mono block">({p.onlineMethod})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-400 text-sm">
                      -{formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p);
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

      {/* Disburse Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Disburse Labor Wage Payment</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayWorker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker *</label>
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.skill})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.projectName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site / Plot</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Disbursement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm"
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
                    <option value="CASH">Physical Cash</option>
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
                      <option value="IMPS">IMPS</option>
                      <option value="NEFT">NEFT</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>

              {paymentMethod === 'ONLINE' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UTR / Ref Number</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. UPI/492819283921"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Weekly advance for shuttering team"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

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
                  {submitting ? 'Disbursing...' : 'Disburse Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
