import React, { useState, useEffect } from 'react';
import { FileText, Printer, ClipboardList } from 'lucide-react';
import api from '../../services/api.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';
import { DailySiteReportGenerator } from '../../components/reports/DailySiteReportGenerator.tsx';

export function ReportsPage() {
  const [reportType, setReportType] = useState<'daily-site-report' | 'financial-audit'>('daily-site-report');
  const [projects, setProjects] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      try {
        const [projRes, dashRes] = await Promise.all([
          api.get('/admin/projects'),
          api.get('/admin/dashboard'),
        ]);

        if (projRes.data.success) {
          setProjects(projRes.data.data);
        }
        if (dashRes.data.success) {
          setDashboard(dashRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const cards = dashboard?.cards;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Report Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Engineering & Operational Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate Daily Site Reports (DSR), labor manpower logs, executed quantities, site inspection photos, and financial audit statements.
          </p>
        </div>

        {/* Report Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setReportType('daily-site-report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'daily-site-report'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Daily Site Report (DSR)</span>
          </button>

          <button
            onClick={() => setReportType('financial-audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              reportType === 'financial-audit'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Financial Audit Statement</span>
          </button>
        </div>
      </div>

      {/* Report Content View */}
      {reportType === 'daily-site-report' ? (
        <DailySiteReportGenerator />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end no-print">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Audit Statement</span>
            </button>
          </div>

          {/* Printable Statement Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:p-0 print:m-0">
            {/* Company Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 print:border-black gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="आरंभ कन्स्ट्रक्शन"
                  referrerPolicy="no-referrer"
                  className="h-14 w-auto object-contain rounded-lg border border-slate-700 bg-black"
                />
                <div>
                  <h2 className="text-xl font-black text-white print:text-black tracking-tight">
                    ARAMBH CONSTRUCTION
                  </h2>
                  <div className="text-xs font-bold text-amber-400 print:text-black">
                    Er. Sudarshan Bajrang Naik • इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
                  </div>
                  <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">
                    At/Post Shengaon, Tal: Bhudargad, Dist: Kolhapur - 416209 • Contact: +91 7796853434
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="font-bold text-amber-400 print:text-black uppercase tracking-wider block">
                  Official Project Financial Audit
                </span>
                <span className="text-slate-400 print:text-gray-600">Generated: {formatDate(new Date())}</span>
                <div className="text-[10px] text-emerald-400 print:text-gray-700 font-mono mt-0.5">
                  PWD Class-A Contractor Ledger
                </div>
              </div>
            </div>

            {/* Global Executive KPIs */}
            {cards && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 font-semibold block uppercase">
                    Total Contract Portfolio
                  </span>
                  <span className="text-lg font-black font-mono text-white print:text-black mt-0.5 block">
                    {formatCurrency(cards.totalProjectCost)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 font-semibold block uppercase">
                    Realized Client Receipts
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-400 print:text-green-700 mt-0.5 block">
                    {formatCurrency(cards.totalReceived)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 font-semibold block uppercase">
                    Incurred Operational Burn
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400 print:text-red-700 mt-0.5 block">
                    {formatCurrency(cards.totalExpenses)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[11px] text-slate-400 print:text-gray-600 font-semibold block uppercase">
                    Net Operating Liquidity
                  </span>
                  <span className="text-lg font-black font-mono text-amber-400 print:text-black mt-0.5 block">
                    {formatCurrency(cards.remainingBudget)}
                  </span>
                </div>
              </div>
            )}

            {/* Project Profitability Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-black">
                Project-by-Project Margin Audit
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 print:bg-gray-200 print:border-black text-slate-400 print:text-black font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Project Code & Name</th>
                      <th className="py-2.5 px-3">Location & Owner</th>
                      <th className="py-2.5 px-3 text-right">Contract Value</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">Incurred Cost</th>
                      <th className="py-2.5 px-3 text-right">Net Margin</th>
                      <th className="py-2.5 px-3 text-center">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                    {projects.map((p) => {
                      const fin = p.financials || {};
                      const cost = fin.totalCost || p.contractValue || 0;
                      const rec = fin.totalReceived || 0;
                      const exp = fin.totalExpenses || 0;
                      const margin = rec - exp;

                      return (
                        <tr key={p._id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-amber-400 print:text-black block text-[11px]">
                              {p.projectCode}
                            </span>
                            <span className="font-bold text-white print:text-black">{p.projectName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 print:text-gray-700">
                            {p.location} • {p.client?.name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-white print:text-black">
                            {formatCurrency(cost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 print:text-green-700">
                            {formatCurrency(rec)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-400 print:text-red-700">
                            {formatCurrency(exp)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black">
                            {formatCurrency(margin)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400 print:text-black">
                            {fin.paymentProgress || 0}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Sign-off */}
            <div className="pt-8 border-t border-slate-800 print:border-black flex justify-between items-end text-xs">
              <div>
                <p className="text-slate-400 print:text-gray-600">
                  * Figures automatically consolidated from Arambh Construction ERP multi-ledger journal.
                </p>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-slate-700 print:border-black w-56 mb-1" />
                <span className="font-bold text-white print:text-black block">Er. Sudarshan Bajrang Naik</span>
                <span className="text-slate-400 print:text-gray-600 text-[10px]">Civil Engineer & Govt Contractor (Proprietor)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
