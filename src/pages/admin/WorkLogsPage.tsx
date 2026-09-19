import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HardHat, Plus, Search, Calendar, Filter, ArrowRight, IndianRupee, X, QrCode, Sparkles, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../../services/api.ts';
import { WorkLog, Worker, Project, Site } from '../../types.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';
import { QRScannerModal } from '../../components/common/QRScannerModal.tsx';

export function WorkLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySiteId = searchParams.get('siteId') || '';
  const queryProjectId = searchParams.get('projectId') || '';
  const autoOpenParam = searchParams.get('autoOpen');

  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Scanner modal
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [isQrPrepopulated, setIsQrPrepopulated] = useState<boolean>(false);

  // Add Log Modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [daysWorked, setDaysWorked] = useState<string>('1');
  const [dailyRate, setDailyRate] = useState<string>('850');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, workRes, projRes, siteRes] = await Promise.all([
        api.get('/admin/work-logs'),
        api.get('/admin/workers'),
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);

      if (logsRes.data.success) setWorkLogs(logsRes.data.data);
      if (workRes.data.success) {
        setWorkers(workRes.data.data);
        if (workRes.data.data.length > 0) {
          setSelectedWorkerId(workRes.data.data[0]._id);
          setDailyRate(String(workRes.data.data[0].dailyRate || 850));
        }
      }

      const loadedProjects: Project[] = projRes.data.success ? projRes.data.data : [];
      const loadedSites: Site[] = siteRes.data.success ? siteRes.data.data : [];
      setProjects(loadedProjects);
      setSites(loadedSites);

      // Check if URL contains pre-populated siteId or projectId from QR code scan
      if (querySiteId) {
        setSelectedSiteId(querySiteId);
        setIsQrPrepopulated(true);

        if (queryProjectId) {
          setSelectedProjectId(queryProjectId);
        } else {
          const matched = loadedSites.find((s) => s._id === querySiteId);
          if (matched) {
            const pId =
              typeof matched.projectId === 'object' && matched.projectId
                ? matched.projectId._id
                : (matched.projectId as string);
            if (pId) setSelectedProjectId(pId);
          }
        }

        // Automatically open the muster creation modal when scanned
        if (autoOpenParam !== '0') {
          setAddModalOpen(true);
        }
      } else {
        if (loadedProjects.length > 0) setSelectedProjectId(loadedProjects[0]._id);
        if (loadedSites.length > 0) setSelectedSiteId(loadedSites[0]._id);
      }
    } catch (err) {
      console.error('Failed to load muster logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [querySiteId, queryProjectId]);

  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const w = workers.find((item) => item._id === workerId);
    if (w && w.dailyRate) {
      setDailyRate(String(w.dailyRate));
    }
  };

  const handleSiteSelectFromScanner = (siteId: string, projectId: string) => {
    setSelectedSiteId(siteId);
    setIsQrPrepopulated(true);
    if (projectId) {
      setSelectedProjectId(projectId);
    } else {
      const s = sites.find((item) => item._id === siteId);
      if (s) {
        const p = typeof s.projectId === 'object' && s.projectId ? s.projectId._id : (s.projectId as string);
        if (p) setSelectedProjectId(p);
      }
    }
    setAddModalOpen(true);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedProjectId) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/work-logs', {
        workerId: selectedWorkerId,
        projectId: selectedProjectId,
        siteId: selectedSiteId || undefined,
        workDate,
        daysWorked: Number(daysWorked) || 1,
        dailyRate: Number(dailyRate) || 800,
        notes,
      });

      if (res.data.success) {
        setAddModalOpen(false);
        setNotes('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to add work log', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalMusterAmount = workLogs.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const scannedSiteObj = sites.find((s) => s._id === (selectedSiteId || querySiteId));
  const scannedProjectObj = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Daily Labor Muster Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Site-level attendance, daily labor rates, and auto-computed wage liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block mr-2">
            <span className="text-[10px] text-slate-400 block uppercase">Total Accrued Muster</span>
            <span className="text-sm font-mono font-bold text-sky-400">{formatCurrency(totalMusterAmount)}</span>
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            title="Scan Site QR code"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Scan Site QR</span>
          </button>
          <button
            onClick={() => {
              setIsQrPrepopulated(false);
              setAddModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Record Daily Muster</span>
          </button>
        </div>
      </div>

      {/* QR Code Scanned Site Banner */}
      {querySiteId && scannedSiteObj && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Site QR Scan Active</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-extrabold">PRE-FILLED</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{scannedSiteObj.siteName}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({typeof scannedSiteObj.projectId === 'object' ? scannedSiteObj.projectId?.projectName : 'Parent Project'})
                </span>
                {scannedSiteObj.location && (
                  <span className="text-xs text-slate-500 flex items-center gap-0.5 font-normal">
                    <MapPin className="w-3 h-3 text-amber-500" /> {scannedSiteObj.location}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSiteId(scannedSiteObj._id);
                setAddModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Muster for this Site</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('siteId');
                p.delete('projectId');
                p.delete('autoOpen');
                setSearchParams(p);
                setIsQrPrepopulated(false);
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Muster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Worker Name</th>
                <th className="py-3 px-4">Trade Skill</th>
                <th className="py-3 px-4">Project & Site</th>
                <th className="py-3 px-4">Days Worked</th>
                <th className="py-3 px-4">Daily Rate</th>
                <th className="py-3 px-4 text-right">Computed Wage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading muster records...
                  </td>
                </tr>
              ) : workLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No daily muster logs found.
                  </td>
                </tr>
              ) : (
                workLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-medium">{formatDate(log.workDate)}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {typeof log.workerId === 'object' ? log.workerId?.name : 'Worker'}
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      {typeof log.workerId === 'object' ? log.workerId?.skill : 'Labor'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200 block">
                        {typeof log.projectId === 'object' ? log.projectId?.projectName : 'Project'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {typeof log.siteId === 'object' ? log.siteId?.siteName : 'Main Site'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {log.daysWorked} {log.daysWorked === 1 ? 'day' : 'days'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{formatCurrency(log.dailyRate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-400 text-sm">
                      {formatCurrency(log.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Log Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Daily Labor Muster</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Worker *</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => handleWorkerChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.skill}) - ₹{w.dailyRate}/day
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project *</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Site / Plot</label>
                    {isQrPrepopulated && (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                        <QrCode className="w-2.5 h-2.5" />
                        <span>QR Pre-filled</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => {
                      const newSiteId = e.target.value;
                      setSelectedSiteId(newSiteId);
                      const targetSite = sites.find((s) => s._id === newSiteId);
                      if (targetSite) {
                        const pId =
                          typeof targetSite.projectId === 'object' && targetSite.projectId
                            ? targetSite.projectId._id
                            : (targetSite.projectId as string);
                        if (pId) setSelectedProjectId(pId);
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-white ${
                      isQrPrepopulated ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-700'
                    }`}
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="3"
                    value={daysWorked}
                    onChange={(e) => setDaysWorked(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Total Wage Liability:</span>
                <span className="font-mono font-bold text-sky-400 text-sm">
                  {formatCurrency((Number(daysWorked) || 1) * (Number(dailyRate) || 800))}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Work Description / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sump tank excavation & leveling"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Muster Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner / Quick Simulator Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        sites={sites}
        onSelectSite={handleSiteSelectFromScanner}
      />
    </div>
  );
}
