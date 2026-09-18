import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Search, Calendar, Filter, ArrowRight, IndianRupee, X } from 'lucide-react';
import api from '../../services/api.ts';
import { WorkLog, Worker, Project, Site } from '../../types.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';

export function WorkLogsPage() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) {
          setSelectedProjectId(projRes.data.data[0]._id);
        }
      }
      if (siteRes.data.success) {
        setSites(siteRes.data.data);
        if (siteRes.data.data.length > 0) {
          setSelectedSiteId(siteRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load muster logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const w = workers.find((item) => item._id === workerId);
    if (w && w.dailyRate) {
      setDailyRate(String(w.dailyRate));
    }
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

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase">Total Accrued Muster</span>
            <span className="text-sm font-mono font-bold text-sky-400">{formatCurrency(totalMusterAmount)}</span>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Record Daily Muster</span>
          </button>
        </div>
      </div>

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
                  <label className="block text-slate-300 font-semibold mb-1">Site / Plot</label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
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
    </div>
  );
}
