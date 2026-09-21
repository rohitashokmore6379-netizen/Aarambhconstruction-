import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  HardHat,
  ArrowUpDown,
  FileSpreadsheet,
  Download,
  Sparkles,
  Building2,
  Play,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site, Worker, WorkScheduleItem } from '../../types.ts';
import { InitializeScheduleModal } from '../../components/workSchedule/InitializeScheduleModal.tsx';
import { CreateActivityModal } from '../../components/workSchedule/CreateActivityModal.tsx';
import { UpdateProgressModal } from '../../components/workSchedule/UpdateProgressModal.tsx';
import { WorkScheduleDetailDrawer } from '../../components/workSchedule/WorkScheduleDetailDrawer.tsx';

export function WorkSchedulePage() {
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table');

  // Modals
  const [isInitModalOpen, setIsInitModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedScheduleForUpdate, setSelectedScheduleForUpdate] = useState<WorkScheduleItem | null>(null);
  const [selectedScheduleIdForDrawer, setSelectedScheduleIdForDrawer] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchMetrics();
  }, [selectedProjectId, statusFilter, searchQuery]);

  const fetchInitialData = async () => {
    try {
      const [projRes, siteRes, workerRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/sites'),
        api.get('/admin/workers'),
      ]);
      if (projRes.data.success) setProjects(projRes.data.data);
      if (siteRes.data.success) setSites(siteRes.data.data);
      if (workerRes.data.success) setWorkers(workerRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/admin/work-schedules', { params });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const params: any = {};
      if (selectedProjectId) params.projectId = selectedProjectId;
      const res = await api.get('/admin/work-schedules/metrics', { params });
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteActivity = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete stage '${name}'?`)) return;
    try {
      await api.delete(`/admin/work-schedules/${id}`);
      fetchSchedules();
      fetchMetrics();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-xs">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h1 className="text-2xl font-black text-white tracking-tight">Work Schedule & Activities</h1>
          </div>
          <p className="text-slate-400">
            Phase 1 to 26 Engineering sequence, milestone tracking, and site output management
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span>Daily Site Report (DSR)</span>
          </Link>

          <button
            onClick={() => setIsInitModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 26 Stages</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Activity</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Activities
          </span>
          <span className="font-mono text-2xl font-black text-white">{metrics?.total || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Completed (100%)
          </span>
          <span className="font-mono text-2xl font-black text-emerald-400">{metrics?.completed || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="font-mono text-2xl font-black text-amber-400">{metrics?.inProgress || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
            Upcoming / Scheduled
          </span>
          <span className="font-mono text-2xl font-black text-blue-400">{metrics?.scheduled || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
            Average Progress
          </span>
          <span className="font-mono text-2xl font-black text-purple-400">{metrics?.avgProgress || 0}%</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Project Filter */}
          <div className="w-full sm:w-64">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-semibold"
            >
              <option value="">-- All Projects --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="DELAYED">Delayed</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stage (e.g. Centering, Plaster, Tile)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            List Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'cards' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pipeline Cards
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              viewMode === 'timeline' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gantt Timeline
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">No Work Schedules Found</h3>
            <p className="text-slate-400 mt-1 max-w-md mx-auto">
              Initialize the standard 26 construction stages for your project with one click, or create custom activities.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsInitModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate 26 Stages</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: DATA TABLE */}
          {viewMode === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Activity Name</th>
                      <th className="py-3.5 px-4">Project / Site</th>
                      <th className="py-3.5 px-4">Planned Dates</th>
                      <th className="py-3.5 px-4">Progress</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Contractor Team</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {schedules.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedScheduleIdForDrawer(item._id)}
                      >
                        <td className="py-3.5 px-4 font-mono font-black text-amber-400">
                          {item.workOrder}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {item.workName}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-300 block truncate max-w-[160px]">
                            {item.projectName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.siteName || 'Main Plot'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          <div>{new Date(item.plannedStartDate).toLocaleDateString()}</div>
                          <div className="text-slate-500">&rarr; {new Date(item.plannedEndDate).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-white font-bold">{item.progressPercentage}%</span>
                              <span className="text-slate-500">
                                {item.completedQuantity ? `${item.completedQuantity} ${item.unit || ''}` : ''}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.progressPercentage === 100
                                    ? 'bg-emerald-500'
                                    : item.progressPercentage > 50
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${item.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : item.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : item.status === 'DELAYED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium truncate max-w-[140px]">
                          {item.assignedTeam || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedScheduleForUpdate(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold transition-colors"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(item._id, item.workName)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              &times;
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: PIPELINE CARDS */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedScheduleIdForDrawer(item._id)}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-black flex items-center justify-center text-xs">
                        #{item.workOrder}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white hover:text-amber-400 transition-colors">
                        {item.workName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Target Progress</span>
                        <span className="font-mono font-bold text-white">{item.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.progressPercentage === 100
                              ? 'bg-emerald-500'
                              : item.progressPercentage > 50
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[150px]">
                      {item.assignedTeam || 'In-house Crew'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScheduleForUpdate(item);
                      }}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      Update / Log &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 3: GANTT TIMELINE SEQUENCE */}
          {viewMode === 'timeline' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 overflow-x-auto">
              <div className="min-w-[700px] space-y-3">
                <div className="flex justify-between text-slate-400 font-bold pb-2 border-b border-slate-800">
                  <span>Sequence & Milestone Name</span>
                  <span>Timeline Span</span>
                </div>
                {schedules.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedScheduleIdForDrawer(item._id)}
                    className="p-3 bg-slate-950/60 hover:bg-slate-800/50 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 w-72 shrink-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 font-mono font-black flex items-center justify-center text-xs">
                        {item.workOrder}
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-xs">{item.workName}</h4>
                        <p className="text-[10px] text-slate-500">{item.projectName}</p>
                      </div>
                    </div>

                    {/* Visual Gantt Bar */}
                    <div className="flex-1 px-4">
                      <div className="w-full bg-slate-900 h-6 rounded-xl border border-slate-800 p-1 relative flex items-center">
                        <div
                          className={`h-full rounded-lg transition-all ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/80'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/80'
                              : 'bg-slate-700'
                          }`}
                          style={{ width: `${Math.max(8, item.progressPercentage)}%` }}
                        />
                        <span className="absolute left-3 text-[10px] font-mono font-bold text-white">
                          {item.progressPercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-48 text-right font-mono text-[11px] text-slate-400 shrink-0">
                      <span>{new Date(item.plannedStartDate).toLocaleDateString()}</span> &rarr;{' '}
                      <span>{new Date(item.plannedEndDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals & Drawers */}
      <InitializeScheduleModal
        projects={projects}
        sites={sites}
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
        onSuccess={() => {
          fetchSchedules();
          fetchMetrics();
        }}
        defaultProjectId={selectedProjectId}
      />

      <CreateActivityModal
        projects={projects}
        sites={sites}
        workers={workers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchSchedules();
          fetchMetrics();
        }}
        defaultProjectId={selectedProjectId}
      />

      <UpdateProgressModal
        schedule={selectedScheduleForUpdate}
        isOpen={!!selectedScheduleForUpdate}
        onClose={() => setSelectedScheduleForUpdate(null)}
        onSuccess={() => {
          fetchSchedules();
          fetchMetrics();
          if (selectedScheduleIdForDrawer) {
            // refresh drawer
            setSelectedScheduleIdForDrawer(selectedScheduleIdForDrawer);
          }
        }}
      />

      <WorkScheduleDetailDrawer
        scheduleId={selectedScheduleIdForDrawer}
        isOpen={!!selectedScheduleIdForDrawer}
        onClose={() => setSelectedScheduleIdForDrawer(null)}
        onOpenUpdateModal={(item) => setSelectedScheduleForUpdate(item)}
      />
    </div>
  );
}
export default WorkSchedulePage;
