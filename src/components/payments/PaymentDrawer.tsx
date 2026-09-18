import React, { useState } from 'react';
import { X, Printer, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, FileText, Calendar, Building2, User, CreditCard } from 'lucide-react';
import api from '../../services/api.ts';
import { UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PrintableReceipt } from './PrintableReceipt.tsx';

interface PaymentDrawerProps {
  payment: UnifiedPayment | null;
  isOpen: boolean;
  onClose: () => void;
  onReversalSuccess?: () => void;
}

export function PaymentDrawer({ payment, isOpen, onClose, onReversalSuccess }: PaymentDrawerProps) {
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showReverseModal, setShowReverseModal] = useState<boolean>(false);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [reversing, setReversing] = useState<boolean>(false);
  const [reversalError, setReversalError] = useState<string>('');

  if (!isOpen || !payment) return null;

  const handleReverse = async () => {
    if (!reversalReason.trim()) {
      setReversalError('Please provide an official audit reason for reversing this transaction.');
      return;
    }

    setReversing(true);
    setReversalError('');

    try {
      let endpoint = '';
      if (payment.sourceType === 'CLIENT_RECEIPT') {
        endpoint = `/admin/client-payments/${payment.id}/reverse`;
      } else if (payment.sourceType === 'WORKER_PAYMENT') {
        endpoint = `/admin/worker-payments/${payment.id}/reverse`;
      } else if (payment.sourceType === 'MATERIAL_PAYMENT') {
        endpoint = `/admin/material-purchases/${payment.id}/reverse`;
      } else if (payment.sourceType === 'VENDOR_PAYMENT') {
        endpoint = `/admin/vendor-payments/${payment.id}/reverse`;
      } else if (payment.sourceType === 'EXPENSE') {
        endpoint = `/admin/expenses/${payment.id}/reverse`;
      }

      if (!endpoint) {
        throw new Error('Unsupported transaction type for reversal');
      }

      const res = await api.post(endpoint, { reason: reversalReason.trim() });
      if (res.data.success) {
        setShowReverseModal(false);
        if (onReversalSuccess) onReversalSuccess();
        onClose();
      }
    } catch (err: any) {
      setReversalError(err.response?.data?.message || 'Failed to reverse transaction.');
    } finally {
      setReversing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end">
        <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700/80 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {payment.receiptNumber || payment.reference}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{payment.displayType}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* Amount Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Transaction Value
              </span>
              <div className={`text-3xl font-extrabold font-mono tracking-tight ${payment.flow === 'INFLOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {payment.flow === 'INFLOW' ? '+' : '-'}{formatCurrency(payment.amount)}
              </div>
              <span className="text-xs text-slate-500 mt-1 inline-block">
                {payment.flow === 'INFLOW' ? 'Project Cash Inflow' : 'Project Operational Outflow'}
              </span>
            </div>

            {/* Core Info Grid */}
            <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Project
                </span>
                <span className="font-semibold text-white">{payment.projectName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Site
                </span>
                <span className="font-semibold text-white">{payment.siteName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Party / Beneficiary
                </span>
                <div className="text-right">
                  <span className="font-semibold text-white block">{payment.party}</span>
                  <span className="text-[11px] text-slate-400">{payment.partyRole}</span>
                </div>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Transaction Date
                </span>
                <span className="font-medium text-white">{formatDate(payment.date)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Mode
                </span>
                <span className="font-semibold text-amber-400">
                  {payment.paymentMethod} {payment.onlineMethod ? `(${payment.onlineMethod})` : ''}
                </span>
              </div>
              {payment.reference && (
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 text-xs">Txn / UTR Reference</span>
                  <span className="font-mono text-xs font-bold text-slate-300">{payment.reference}</span>
                </div>
              )}
              {payment.receiptNumber && (
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 text-xs">Voucher / Receipt #</span>
                  <span className="font-mono text-xs font-bold text-slate-300">{payment.receiptNumber}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {payment.description && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                  Description / Milestone Remarks
                </span>
                <p className="text-slate-300 leading-relaxed text-xs">{payment.description}</p>
              </div>
            )}

            {/* Reversal info if reversed */}
            {payment.status === 'REVERSED' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Transaction Reversed
                </div>
                <p className="text-xs text-rose-300/80">
                  Reversal Reason: {payment.raw?.reversalReason || 'Administrative Ledger Correction'}
                </p>
                {payment.raw?.reversedAt && (
                  <p className="text-[11px] text-rose-400">
                    Reversed on: {formatDateTime(payment.raw.reversedAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Official Voucher
            </button>

            {payment.status !== 'REVERSED' && (
              <button
                type="button"
                onClick={() => setShowReverseModal(true)}
                className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reverse Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Voucher Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white print:hidden"
            >
              <X className="w-6 h-6" />
            </button>
            <PrintableReceipt
              receipt={{
                receiptNumber: payment.receiptNumber || payment.reference || 'AR-VOUCHER',
                projectName: payment.projectName,
                siteName: payment.siteName,
                party: payment.party,
                partyRole: payment.partyRole,
                amount: payment.amount,
                paymentDate: payment.date,
                paymentMethod: payment.paymentMethod,
                onlineMethod: payment.onlineMethod,
                transactionReference: payment.reference,
                description: payment.description,
                status: payment.status,
              }}
            />
          </div>
        </div>
      )}

      {/* Payment Reversal Confirmation Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white">Reverse Financial Transaction</h4>
                <p className="text-xs text-slate-400">Action cannot be deleted permanently</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              You are about to reverse <strong>{formatCurrency(payment.amount)}</strong> for <strong>{payment.party}</strong> ({payment.receiptNumber}).
              This will update the project balance, ledger history, and create an immutable audit record.
            </p>

            {reversalError && (
              <div className="p-2.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                {reversalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Audit Reversal Reason *
              </label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Duplicate milestone entry / Wrong bank transaction reference"
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowReverseModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReverse}
                disabled={reversing}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {reversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
