import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Printer,
  Download,
  Users,
  HardHat,
  Ruler,
  Image as ImageIcon,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, DailySiteReportData } from '../../types.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';
import { printDailySiteReport } from '../../utils/dailySiteReportPdf.ts';

interface DailySiteReportGeneratorProps {
  initialProjectId?: string;
}

export function DailySiteReportGenerator({ initialProjectId }: DailySiteReportGeneratorProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to a date that may have data (e.g., Feb 27, 2025 or today)
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  
  const [report, setReport] = useState<DailySiteReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'labor' | 'quantities' | 'images' | 'remarks'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fetch projects for dropdown
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/admin/projects');
        if (res.data.success) {
          setProjects(res.data.data);
          if (!selectedProjectId && res.data.data.length > 0) {
            // Pick either initialProjectId or project 5 (Patil Residence) or first project
            const p5 = res.data.data.find((p: any) => p.projectCode === 'PRJ-2025-005' || p.projectName.includes('Patil'));
            setSelectedProjectId(p5 ? p5._id : res.data.data[0]._id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load projects', err);
      }
    }
    loadProjects();
  }, []);

  // Fetch report data whenever project or date changes
  const fetchReport = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/work-schedules/daily-report', {
        params: {
          projectId: selectedProjectId,
          date: selectedDate,
        },
      });
      if (res.data.success) {
        setReport(res.data.data);
      } else {
        setError(res.data.message || 'Failed to generate Daily Site Report');
      }
    } catch (err: any) {
      console.error('Error fetching Daily Site Report', err);
      setError(err.response?.data?.message || 'Failed to connect to server for Daily Site Report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchReport();
    }
  }, [selectedProjectId, selectedDate]);

  const handlePrint = () => {
    if (report) {
      printDailySiteReport(report);
    } else {
      window.print();
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Project Selector, Date Picker, Refresh & Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Inputs Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {/* Project Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Construction Project</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id} className="bg-slate-900 text-white">
                    {p.projectName} ({p.projectCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Report Date (Site Log Day)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  title="Reset to Today"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2 lg:pt-0 self-end lg:self-center">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleBrowserPrint}
              disabled={!report || loading}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Quick browser print"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Quick Print</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!report || loading}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF / Official Print</span>
            </button>
          </div>
        </div>

        {/* Preset Date Quick-Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Quick jump:</span>
          <button
            onClick={() => setSelectedDate('2025-02-27')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              selectedDate === '2025-02-27'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Sample Log: 27 Feb 2025 (Tile Work & Quantities)
          </button>
          <button
            onClick={() => setSelectedDate('2025-02-28')}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              selectedDate === '2025-02-28'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            28 Feb 2025
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              selectedDate === new Date().toISOString().slice(0, 10)
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            Today's Live Site
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-200">Compiling Daily Site Report...</p>
          <p className="text-xs text-slate-400 mt-1">Aggregating labor crews, quantity records, inspection photos, and engineering remarks</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="text-xs">
            <span className="font-bold">Error compiling report: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Aggregated Daily Site Report View */}
      {report && !loading && (
        <div
          id="printable-daily-site-report"
          className="printable-area bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:p-0 print:m-0"
        >
          {/* 1. Official Construction Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 print:border-black gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.jpg"
                alt="आरंभ कन्स्ट्रक्शन"
                referrerPolicy="no-referrer"
                className="h-16 w-auto object-contain rounded-xl border border-slate-700 bg-black print:border-black"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight">
                  {report.company.companyName || 'ARAMBH CONSTRUCTION'}
                </h2>
                <div className="text-xs font-bold text-amber-400 print:text-black">
                  {report.company.directorName || 'Er. Sudarshan Bajrang Naik'} • {report.company.tagline || 'इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर'}
                </div>
                <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5 max-w-xl">
                  {report.company.address || 'At/Post Shengaon, Tal: Bhudargad, Dist: Kolhapur - 416209'} • Tel: {report.company.phone || '+91 7796853434'}
                </p>
                <div className="text-[10px] text-slate-500 print:text-gray-500 font-mono mt-0.5">
                  PWD Lic: {report.company.licenseNumber || 'PWD/KOP/2021/CLASS-A/0942'} | GST: {report.company.gstNumber || '27AAQFA4918L1Z8'}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs self-stretch sm:self-auto bg-slate-950/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-800/80 sm:border-none print:p-0 print:border-none">
              <div className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-bold text-[11px] uppercase tracking-wider print:bg-gray-100 print:text-black print:border-black">
                Daily Site Report (DSR)
              </div>
              <div className="text-sm font-black text-white print:text-black mt-1.5">
                {report.formattedDate}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                Project Code: {report.project.code}
              </div>
            </div>
          </div>

          {/* 2. Project & Site Overview Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 print:bg-gray-50 print:border-gray-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500 tracking-wider">Project Name</div>
              <div className="text-sm font-bold text-white print:text-black mt-0.5">{report.project.name}</div>
              <div className="text-[11px] text-slate-400 print:text-gray-600">{report.project.type}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500 tracking-wider">Location / Site</div>
              <div className="text-sm font-bold text-slate-200 print:text-black mt-0.5">{report.project.location || 'Shengaon, Kolhapur'}</div>
              <div className="text-[11px] text-slate-400 print:text-gray-600">Site Status: {report.project.status}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500 tracking-wider">Client / Department</div>
              <div className="text-sm font-bold text-slate-200 print:text-black mt-0.5">{report.project.clientName || 'Private Client'}</div>
              <div className="text-[11px] text-slate-400 print:text-gray-600">{report.project.clientPhone || '-'}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 print:text-gray-500 tracking-wider">Project Milestones</div>
              <div className="text-sm font-black text-amber-400 print:text-black mt-0.5 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>{report.project.progressPercentage}% Completed</span>
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">
                Target: {formatDate(report.project.expectedEndDate)}
              </div>
            </div>
          </div>

          {/* 3. Daily Executive KPIs Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-blue-400 print:text-black" />
                <span>Labor Force</span>
              </div>
              <div className="text-xl font-black text-white print:text-black mt-1">
                {report.metrics.totalWorkersCount}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">
                {report.metrics.totalSkilledWorkers} Skilled • {report.metrics.totalUnskilledWorkers} Helpers
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                <span>Man-Hours</span>
              </div>
              <div className="text-xl font-black text-white print:text-black mt-1">
                {report.metrics.totalLaborHours} <span className="text-xs font-medium text-slate-400">hrs</span>
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">Total Shift Execution</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <Ruler className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                <span>Work Quantities</span>
              </div>
              <div className="text-xl font-black text-emerald-400 print:text-black mt-1">
                {report.quantities.length}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">Output items verified</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400 print:text-black" />
                <span>Site Photos</span>
              </div>
              <div className="text-xl font-black text-purple-300 print:text-black mt-1">
                {report.images.length}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">Inspection captures</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <MessageSquareQuote className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                <span>Site Remarks</span>
              </div>
              <div className="text-xl font-black text-cyan-300 print:text-black mt-1">
                {report.remarks.length}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">Notes & observations</div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 print:bg-white print:border-gray-300">
              <div className="flex items-center gap-2 text-slate-400 print:text-gray-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 print:text-black" />
                <span>Est. Labor Cost</span>
              </div>
              <div className="text-base font-black text-amber-300 print:text-black mt-1 font-mono">
                {formatCurrency(report.metrics.totalEstimatedLaborCost)}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500">Daily labor allocation</div>
            </div>
          </div>

          {/* Interactive Screen Navigation Tabs (Hidden during print) */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 no-print overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setActiveTab('labor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'labor'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Labor ({report.labor.records.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('quantities')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'quantities'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Quantities ({report.quantities.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'images'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos ({report.images.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('remarks')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'remarks'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Remarks ({report.remarks.length})</span>
            </button>
          </div>

          {/* SECTION A: LABOR ALLOCATION & WORKERS LOG */}
          {(activeTab === 'all' || activeTab === 'labor') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white print:text-black flex items-center gap-2">
                  <span className="w-2 h-5 bg-amber-500 rounded-sm"></span>
                  1. Labor Allocation & Manpower Log
                </h3>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  Total Deployed: <strong className="text-white print:text-black">{report.labor.totalWorkers} Workers</strong> ({report.labor.totalHours} hrs)
                </span>
              </div>

              {report.labor.records.length > 0 ? (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl print:border-gray-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 print:bg-gray-100 text-slate-400 print:text-gray-700 border-b border-slate-800 print:border-gray-300">
                        <th className="p-3 font-bold">#</th>
                        <th className="p-3 font-bold">Work Activity / Stage</th>
                        <th className="p-3 font-bold">Crew / Team</th>
                        <th className="p-3 font-bold">Shift & Supervisor</th>
                        <th className="p-3 font-bold text-center">Labor Breakdown</th>
                        <th className="p-3 font-bold text-center">Hours</th>
                        <th className="p-3 font-bold text-right">Est. Wages</th>
                        <th className="p-3 font-bold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                      {report.labor.records.map((rec, idx) => (
                        <tr key={rec._id || idx} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-white print:text-black">
                            {rec.workName}
                            <span className="block text-[10px] text-amber-400 print:text-gray-500 font-normal">
                              Stage #{rec.workOrder}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 print:text-gray-800">{rec.workerTeam || 'In-House Civil Team'}</td>
                          <td className="p-3 text-slate-300 print:text-gray-800">
                            <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-[10px] mr-1 print:bg-gray-200">
                              {rec.shift}
                            </span>
                            {rec.supervisor || 'Site Engineer'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-white print:text-black">{rec.totalWorkers}</span>
                            <span className="text-[10px] text-slate-400 print:text-gray-500 block">
                              ({rec.skilledWorkers} Skilled / {rec.unskilledWorkers} Helpers)
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-300 print:text-gray-800 font-medium">
                            {rec.totalLaborHours} hrs
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400 print:text-black">
                            {formatCurrency(rec.estimatedLaborCost || 0)}
                          </td>
                          <td className="p-3 text-slate-400 print:text-gray-600 max-w-xs truncate">
                            {rec.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-950 font-bold text-white print:bg-gray-100 print:text-black">
                        <td colSpan={4} className="p-3 text-right">Daily Total Labor Deployed:</td>
                        <td className="p-3 text-center">{report.labor.totalWorkers} Workers</td>
                        <td className="p-3 text-center">{report.labor.totalHours} hrs</td>
                        <td className="p-3 text-right text-amber-400 print:text-black">{formatCurrency(report.labor.cost)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 print:text-gray-600">
                  No specialized work-schedule labor records logged for this date.
                  {report.labor.directLogs.length > 0 && (
                    <div className="mt-2 text-xs text-amber-400">
                      ({report.labor.directLogs.length} worker daily attendance logs recorded in labor payroll module)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: WORK QUANTITIES EXECUTED */}
          {(activeTab === 'all' || activeTab === 'quantities') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white print:text-black flex items-center gap-2">
                  <span className="w-2 h-5 bg-emerald-500 rounded-sm"></span>
                  2. Daily Work Quantity Executed (Measurements & Output)
                </h3>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  {report.quantities.length} Tasks Measured
                </span>
              </div>

              {report.quantities.length > 0 ? (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl print:border-gray-300">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 print:bg-gray-100 text-slate-400 print:text-gray-700 border-b border-slate-800 print:border-gray-300">
                        <th className="p-3 font-bold">#</th>
                        <th className="p-3 font-bold">Work Activity / Item</th>
                        <th className="p-3 font-bold">Executing Team</th>
                        <th className="p-3 font-bold text-right">Today's Executed Quantity</th>
                        <th className="p-3 font-bold text-right">Cumulative Finished</th>
                        <th className="p-3 font-bold">Engineer Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                      {report.quantities.map((q, idx) => (
                        <tr key={q._id || idx} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-white print:text-black">
                            {q.workName}
                            <span className="block text-[10px] text-emerald-400 print:text-gray-500 font-normal">
                              Stage #{q.workOrder}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 print:text-gray-800">{q.workerTeam || 'General Construction Crew'}</td>
                          <td className="p-3 text-right">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg font-black text-sm print:border-none print:text-black">
                              +{q.quantity} {q.unit}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-300 print:text-gray-800 font-medium">
                            {q.totalCompletedQuantity} {q.unit}
                            {q.targetQuantity > 0 && (
                              <span className="text-[10px] text-slate-500 block">
                                Target: {q.targetQuantity} {q.unit}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 print:text-gray-800">
                            {q.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 print:text-gray-600">
                  No quantitative measurements logged on this date.
                </div>
              )}
            </div>
          )}

          {/* SECTION C: ACTIVE ACTIVITIES STATUS SNAPSHOT */}
          {activeTab === 'all' && report.activeActivities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-black text-white print:text-black flex items-center gap-2">
                <span className="w-2 h-5 bg-sky-500 rounded-sm"></span>
                3. Active Activities & Milestones Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.activeActivities.slice(0, 6).map((act) => (
                  <div
                    key={act._id}
                    className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col justify-between print:bg-white print:border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          Stage {act.workOrder}
                        </div>
                        <h4 className="text-sm font-bold text-white print:text-black">{act.workName}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 print:bg-gray-100 print:text-black">
                        {act.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-white print:text-black">{act.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden print:bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                          style={{ width: `${act.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION D: SITE PHOTOGRAPHS (IMAGES) */}
          {(activeTab === 'all' || activeTab === 'images') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white print:text-black flex items-center gap-2">
                  <span className="w-2 h-5 bg-purple-500 rounded-sm"></span>
                  4. Site Progress Photographs & Visual Verification
                </h3>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  {report.images.length} Captures Attached
                </span>
              </div>

              {report.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {report.images.map((img, idx) => (
                    <div
                      key={img._id || idx}
                      className="group bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all print:border-gray-300 print:bg-white"
                    >
                      <div className="relative aspect-video bg-slate-800 overflow-hidden">
                        <img
                          src={img.imageUrl}
                          alt={img.caption || 'Site Photograph'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => setPreviewImage(img.imageUrl)}
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute(
                              'src',
                              'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?auto=format&fit=crop&w=800&q=80'
                            );
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {img.imageType}
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-200 print:text-black line-clamp-2">
                          {img.caption || img.workName || 'Site execution photograph'}
                        </p>
                        <div className="text-[10px] text-slate-400 print:text-gray-500 flex items-center justify-between pt-1">
                          <span>Stage: {img.workName}</span>
                          <span>{img.uploadedBy || 'Site Engineer'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 print:text-gray-600">
                  No inspection photographs were uploaded for this date.
                </div>
              )}
            </div>
          )}

          {/* SECTION E: SITE OBSERVATIONS, REMARKS & SAFETY */}
          {(activeTab === 'all' || activeTab === 'remarks') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white print:text-black flex items-center gap-2">
                  <span className="w-2 h-5 bg-cyan-500 rounded-sm"></span>
                  5. Daily Observations, Quality & Safety Remarks
                </h3>
                <span className="text-xs text-slate-400 print:text-gray-600">
                  {report.remarks.length} Logged Entries
                </span>
              </div>

              {report.remarks.length > 0 ? (
                <div className="space-y-2.5">
                  {report.remarks.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950/70 border-l-4 border-amber-500 border-t border-r border-b border-slate-800/80 rounded-r-2xl print:bg-gray-50 print:border-gray-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-amber-400 print:text-black uppercase tracking-wider">
                          {item.source} • {item.activityName}
                        </span>
                        <span className="text-[10px] text-slate-400 print:text-gray-500">
                          Logged by: {item.author || 'Site Supervisor'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 print:text-gray-800 leading-relaxed">
                        "{item.remark}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 print:text-gray-600">
                  No special remarks or non-conformances noted for this date.
                </div>
              )}
            </div>
          )}

          {/* 6. Official Signatures Footer Block (Engineering Submittal) */}
          <div className="pt-8 border-t border-slate-800 print:border-black mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="h-14 flex items-end justify-center">
                  <span className="font-script text-slate-500 italic text-sm">Site Supervisor</span>
                </div>
                <div className="pt-2 border-t border-slate-700 print:border-black">
                  <div className="text-xs font-bold text-white print:text-black">Prepared By (Site Supervisor)</div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600">Arambh Construction In-Charge</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-14 flex items-end justify-center">
                  <span className="font-script text-amber-400 print:text-black italic font-bold text-sm">
                    Er. S. B. Naik
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700 print:border-black">
                  <div className="text-xs font-bold text-white print:text-black">Verified By (Project Engineer)</div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600">
                    {report.company.directorName || 'Er. Sudarshan Bajrang Naik'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-14 flex items-end justify-center">
                  <span className="font-script text-slate-500 italic text-sm">Client / PWD Representative</span>
                </div>
                <div className="pt-2 border-t border-slate-700 print:border-black">
                  <div className="text-xs font-bold text-white print:text-black">Acknowledged By (Client / PWD)</div>
                  <div className="text-[10px] text-slate-400 print:text-gray-600">
                    {report.project.clientName || 'Site Owner'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-[10px] text-slate-500 print:text-gray-400">
              Arambh Construction Real-Time ERP Cockpit • Official Daily Site Record • ISO Compliant Project Tracking
            </div>
          </div>
        </div>
      )}

      {/* Image Full-Size Modal Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black text-white rounded-full text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
