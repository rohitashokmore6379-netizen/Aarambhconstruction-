import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Receipt, Building2, User, CreditCard } from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site } from '../../types.ts';
import { formatCurrency } from '../../utils/formatters.ts';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  initialProjectId?: string;
  initialSiteId?: string;
}

export function ReceivePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialProjectId,
  initialSiteId,
}: ReceivePaymentModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || '');
  const [ownerName, setOwnerName] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('ONLINE');
  const [onlineMethod, setOnlineMethod] = useState<string>('UPI');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Overpayment dialog state
  const [showOverpaymentWarning, setShowOverpaymentWarning] = useState<boolean>(false);
  const [overpaymentDetails, setOverpaymentDetails] = useState<{
    overpaymentAmount: number;
    currentReceived: number;
    totalCost: number;
    attemptedAmount: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (initialSiteId) {
      setSelectedSiteId(initialSiteId);
    }
  }, [initialSiteId]);

  useEffect(() => {
    if (selectedProjectId) {
      loadSites(selectedProjectId);
      const proj = projects.find((p) => p._id === selectedProjectId);
      if (proj && !ownerName) {
        setOwnerName(proj.client?.name || '');
      }
    } else {
      setSites([]);
    }
  }, [selectedProjectId, projects]);

  const loadProjects = async () => {
    try {
      const res = await api.get('/admin/projects');
      if (res.data.success) {
        setProjects(res.data.data);
        if (!selectedProjectId && res.data.data.length > 0) {
          setSelectedProjectId(res.data.data[0]._id);
          setOwnerName(res.data.data[0].client?.name || '');
        }
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const loadSites = async (projId: string) => {
    try {
      const res = await api.get(`/admin/sites?projectId=${projId}`);
      if (res.data.success) {
        setSites(res.data.data);
        if (res.data.data.length > 0 && !selectedSiteId) {
          setSelectedSiteId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load sites', err);
    }
  };

  const handleSubmit = async (allowOverpayment = false) => {
    setError('');
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!selectedProjectId || !selectedSiteId || !ownerName.trim()) {
      setError('Project, Site, and Site Owner are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        projectId: selectedProjectId,
        siteId: selectedSiteId,
        ownerName: ownerName.trim(),
        paymentDate,
        amount: numAmount,
        paymentMethod,
        onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
        transactionReference: transactionReference.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        description: description.trim() || undefined,
        allowOverpayment,
      };

      const res = await api.post('/admin/client-payments', payload);
      if (res.data.success) {
        onSuccess(res.data);
        onClose();
        resetForm();
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.requiresOverpaymentConfirmation) {
        setOverpaymentDetails({
          overpaymentAmount: err.response.data.overpaymentAmount,
          currentReceived: err.response.data.currentReceived,
          totalCost: err.response.data.totalCost,
          attemptedAmount: err.response.data.attemptedAmount,
        });
        setShowOverpaymentWarning(true);
      } else {
        setError(err.response?.data?.message || 'Failed to record client payment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setTransactionReference('');
    setReceiptNumber('');
    setShowOverpaymentWarning(false);
    setOverpaymentDetails(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Receive Site Owner Payment</h2>
              <p className="text-xs text-slate-400">Record milestone payment inflow from client with automatic ledger reconciliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overpayment Confirmation Warning Banner */}
          {showOverpaymentWarning && overpaymentDetails && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-200">Overpayment Confirmation Required</h4>
                  <p className="text-xs text-amber-300/90 mt-1">
                    This payment of <strong>{formatCurrency(overpaymentDetails.attemptedAmount)}</strong> exceeds the total project cost of <strong>{formatCurrency(overpaymentDetails.totalCost)}</strong>.
                  </p>
                  <p className="text-xs text-amber-300/90 mt-1">
                    Excess Amount: <strong>{formatCurrency(overpaymentDetails.overpaymentAmount)}</strong>. Pending balance will remain ₹0, and the surplus will be logged as an authorized client overpayment.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setShowOverpaymentWarning(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Edit Amount
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Authorize Overpayment
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Project *</label>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Site Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Site *</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">Select Site</option>
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Site Owner Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Site Owner / Client Name *</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Mr. Arvind B. Chavan"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500000"
                  min="1"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {amount && Number(amount) > 0 && (
                <span className="text-[11px] text-amber-400/80 mt-1 block">
                  {formatCurrency(Number(amount))}
                </span>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Method *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'ONLINE'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
                      : 'bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  ONLINE
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-semibold shadow-sm'
                      : 'bg-slate-950/40 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  CASH
                </button>
              </div>
            </div>
          </div>

          {paymentMethod === 'ONLINE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Online Method</label>
                <select
                  value={onlineMethod}
                  onChange={(e) => setOnlineMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, BHIM)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="OTHER">Other Online</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Transaction Ref / UTR / Cheque #</label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="e.g. UPI-HDFC-992381029182"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Receipt Number (Optional)</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Leave blank for auto-generated (AR-REC-...)"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description / Milestone Stage</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Ground Floor RCC Slab milestone"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-800/80 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Record Payment & Generate Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}
