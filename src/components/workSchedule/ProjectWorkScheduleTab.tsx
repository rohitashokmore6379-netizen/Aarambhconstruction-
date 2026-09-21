import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  Camera,
  Search,
  BarChart2,
  Table,
} from 'lucide-react';
import api from '../../services/api.ts';
import { WorkScheduleItem, Site, Worker } from '../../types.ts';
import { InitializeScheduleModal } from './InitializeScheduleModal.tsx';
import { CreateActivityModal } from './CreateActivityModal.tsx';
import { UpdateProgressModal } from './UpdateProgressModal.tsx';
import { WorkScheduleDetailDrawer } from './WorkScheduleDetailDrawer.tsx';
import { GanttChart } from './GanttChart.tsx';

interface Props {
  projectId: string;
  projectName: string;
  sites: Site[];
}

export function ProjectWorkScheduleTab({ projectId, projectName, sites }: Props) {
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('gantt');

  // Modals
  const [isInitModalOpen, setIsInitModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedScheduleForUpdate, setSelectedScheduleForUpdate] = useState<WorkScheduleItem | null>(null);
  const [selectedScheduleIdForDrawer, setSelectedScheduleIdForDrawer] = useState<string | null>(null);

  useEffect(() => {
    loadSchedules();
    loadWorkers();
  }, [projectId]);

  const loadWorkers = async () => {
    try {
      const res = await api.get('/admin/workers');
      if (res.data.success) setWorkers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/work-schedules', {
        params: { projectId },
      });
      if (res.data.success) {
        setSchedules(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = schedules.filter((s) =>
    searchQuery
      ? s.workName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.assignedTeam?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const completedCount = schedules.filter((s) => s.status === 'COMPLETED').length;
  const inProgressCount = schedules.filter((s) => s.status === 'IN_PROGRESS').length;
  const avgProg =
    schedules.length > 0
      ? Math.round(schedules.reduce((sum, s) => sum + s.progressPercentage, 0) / schedules.length)
      : 0;

  return (
    <div className="space-y-5 text-xs">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Work Schedule & Civil Sequence ({schedules.length} Stages)
            </h3>
            <p className="text-slate-400 text-xs">
              Live engineering stages from Lineout to Finishing
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800 font-mono">
            <span className="text-emerald-400 font-bold">{completedCount} Completed</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-bold">{inProgressCount} In Progress</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400 font-bold">{avgProg}% Overall</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'gantt'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Gantt Chart</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {schedules.length === 0 && (
            <button
              onClick={() => setIsInitModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate 26 Stages</span>
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading work schedule pipeline...</div>
      ) : schedules.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <Layers className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
          <h4 className="text-white font-bold">No Work Schedule Initialized Yet</h4>
          <p className="text-slate-400 max-w-sm mx-auto">
            Click below to generate the complete 26 standard construction activities for {projectName}.
          </p>
          <button
            onClick={() => setIsInitModalOpen(true)}
            className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Initialize 26 Construction Sequence</span>
          </button>
        </div>
      ) : viewMode === 'gantt' ? (
        <GanttChart
          schedules={filtered}
          projectName={projectName}
          onSelectActivity={(id) => setSelectedScheduleIdForDrawer(id)}
          onUpdateActivity={(item) => setSelectedScheduleForUpdate(item)}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Stage Name</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Gang / Contractor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => setSelectedScheduleIdForDrawer(item._id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.workOrder}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                        {item.workName}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.siteName || 'Main Plot'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {new Date(item.plannedStartDate).toLocaleDateString()} &rarr;{' '}
                      {new Date(item.plannedEndDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="font-bold text-white">{item.progressPercentage}%</span>
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
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[120px]">
                      {item.assignedTeam || '—'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedScheduleForUpdate(item)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold"
                      >
                        Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <InitializeScheduleModal
        projects={[{ _id: projectId, projectName } as any]}
        sites={sites}
        isOpen={isInitModalOpen}
        onClose={() => setIsInitModalOpen(false)}
        onSuccess={loadSchedules}
        defaultProjectId={projectId}
      />

      <CreateActivityModal
        projects={[{ _id: projectId, projectName } as any]}
        sites={sites}
        workers={workers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadSchedules}
        defaultProjectId={projectId}
      />

      <UpdateProgressModal
        schedule={selectedScheduleForUpdate}
        isOpen={!!selectedScheduleForUpdate}
        onClose={() => setSelectedScheduleForUpdate(null)}
        onSuccess={loadSchedules}
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
