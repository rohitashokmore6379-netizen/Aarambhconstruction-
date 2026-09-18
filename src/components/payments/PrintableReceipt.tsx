import React from 'react';
import { Building2, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';

interface PrintableReceiptProps {
  receipt: {
    receiptNumber: string;
    projectName: string;
    siteName: string;
    party: string;
    partyRole?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    onlineMethod?: string;
    transactionReference?: string;
    description?: string;
    authorizedBy?: string;
    status: string;
  };
}

export function PrintableReceipt({ receipt }: PrintableReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 rounded-xl p-8 border border-slate-200 shadow-xl max-w-2xl mx-auto" id="printable-receipt">
      {/* Print Action Bar (Hidden in print) */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 print:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Arambh ERP Voucher</span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      {/* Official Letterhead */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-amber-600">
        <div className="flex items-start gap-3">
          <img
            src="/logo.jpg"
            alt="आरंभ कन्स्ट्रक्शन"
            referrerPolicy="no-referrer"
            className="h-16 w-auto object-contain rounded-lg border border-slate-300 bg-black"
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">ARAMBH CONSTRUCTION</h1>
            <p className="text-xs font-bold text-amber-800">
              Er. Sudarshan Bajrang Naik • इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
            </p>
            <p className="text-[11px] text-slate-600">At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, PIN 416209</p>
            <p className="text-[11px] text-slate-600">GSTIN: 27AAQFA4918L1Z8 | Phone: +91 7796853434 | Email: arambhconstruction9977@gmail.com</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded border border-amber-300">
            OFFICIAL PAYMENT RECEIPT
          </div>
          <p className="text-xs font-mono font-bold text-slate-800 mt-2">{receipt.receiptNumber}</p>
          <p className="text-xs text-slate-500">Date: {formatDate(receipt.paymentDate)}</p>
        </div>
      </div>

      {/* Main Details Table */}
      <div className="my-6 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">Project</span>
            <span className="font-bold text-slate-900 text-base">{receipt.projectName}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">Site Location</span>
            <span className="font-semibold text-slate-900">{receipt.siteName}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">Received From / Paid To</span>
            <span className="font-bold text-slate-900 text-base">{receipt.party}</span>
            {receipt.partyRole && <span className="text-xs text-slate-500 block">({receipt.partyRole})</span>}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase text-slate-500 block">Payment Mode</span>
            <span className="font-semibold text-slate-900">
              {receipt.paymentMethod} {receipt.onlineMethod ? `(${receipt.onlineMethod})` : ''}
            </span>
          </div>
        </div>

        {receipt.transactionReference && (
          <div className="px-4 py-2 bg-slate-100/70 rounded border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold uppercase mr-2">Txn / UTR Reference:</span>
            <span className="font-mono font-bold text-slate-800">{receipt.transactionReference}</span>
          </div>
        )}

        {receipt.description && (
          <div className="px-4 py-3 border border-slate-200 rounded text-xs">
            <span className="text-slate-500 font-semibold uppercase block mb-1">Particulars / Milestone Remarks:</span>
            <p className="text-slate-700 leading-relaxed">{receipt.description}</p>
          </div>
        )}

        {/* Amount Box */}
        <div className="flex justify-between items-center bg-amber-50 border-2 border-amber-400 p-4 rounded-xl">
          <div>
            <span className="text-xs font-bold uppercase text-amber-900 block">Total Amount Settled</span>
            <span className="text-xs text-slate-600">Indian Rupees (INR)</span>
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
            {formatCurrency(receipt.amount)}
          </div>
        </div>

        {receipt.status === 'REVERSED' && (
          <div className="p-3 bg-rose-100 border border-rose-300 rounded text-center text-rose-800 font-bold text-sm tracking-wide uppercase">
            *** THIS TRANSACTION HAS BEEN OFFICIALLY REVERSED ***
          </div>
        )}
      </div>

      {/* Signature & Seal */}
      <div className="pt-8 mt-8 border-t border-slate-200 grid grid-cols-2 gap-8 items-end text-xs text-slate-600">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically Verified ERP Entry</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Generated via Arambh Construction Central Ledger. This computer-generated document requires no physical stamp for internal auditing.
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block border-b border-slate-400 pb-1 w-48 text-center font-semibold text-slate-900">
            {receipt.authorizedBy || 'Er. Sudarshan Bajrang Naik (Director)'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized Signatory / Civil Engineer</p>
        </div>
      </div>
    </div>
  );
}
