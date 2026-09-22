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
  BarChart2,
  Flag,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api.ts';
import { WorkScheduleItem, Site, Project, Worker } from '../../types.ts';
import { D3GanttChart } from './D3GanttChart.tsx';
import { InitializeScheduleModal } from './InitializeScheduleModal.tsx';
import { CreateActivityModal } from './CreateActivityModal.tsx';
import { UpdateProgressModal } from './UpdateProgressModal.tsx';
import { WorkScheduleDetailDrawer } from './WorkScheduleDetailDrawer.tsx';

interface Props {
  projectId: string;
  projectName: string;
  project?: Project;
  sites: Site[];
  onProjectUpdated?: () => void;
}

export function ProjectGanttTab({
  projectId,
  projectName,
  project,
  sites,
  onProjectUpdated,
}: Props) {
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Drawer
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
      if (res.data.success) {
        setWorkers(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load workers:', e);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/work-schedules', {
        params: { projectId },
      });
      if (res.data.success) {
        setSchedules(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load project work schedules for D3 Gantt:', e);
    } finally {
      setLoading(false);
    }
  };

  // Milestone summaries
  const milestoneStages = schedules.filter(
    (s) =>
      s.workName.toLowerCase().includes('milestone') ||
      s.workName.toLowerCase().includes('handover') ||
      s.workName.toLowerCase().includes('foundation') ||
      s.workName.toLowerCase().includes('slab') ||
      s.workOrder % 5 === 0
  );

  const completedMilestones = milestoneStages.filter((m) => m.status === 'COMPLETED').length;
  const delayedStages = schedules.filter((s) => s.status === 'DELAYED');

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-black text-white tracking-tight">
              Interactive D3 Construction Gantt Chart
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Real-time visual schedule comparing planned baseline against actual site execution with dependency tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadSchedules}
            disabled={loading}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-colors"
            title="Refresh Gantt Timeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {schedules.length === 0 ? (
            <button
              onClick={() => setIsInitModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize 26 Construction Stages</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Work Stage</span>
            </button>
          )}
        </div>
      </div>

      {/* Delayed Alert Warning if any */}
      {delayedStages.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-rose-300">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-white">
              Critical Timeline Alert: {delayedStages.length} Construction Stage(s) Behind Schedule
            </div>
            <p className="text-xs text-rose-200/80">
              The following stages have exceeded their planned baseline finish dates:{' '}
              {delayedStages.map((d) => `#${d.workOrder} ${d.workName}`).join(', ')}. Review successor stage dependencies below.
            </p>
          </div>
        </div>
      )}

      {/* Main D3 Gantt Visualization Component */}
      {loading ? (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-mono">Rendering D3.js vector timeline & dependency network...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-3xl space-y-4">
          <Layers className="w-12 h-12 text-amber-400 mx-auto opacity-60" />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No Construction Stages Configured</h4>
            <p className="text-slate-400 max-w-md mx-auto text-xs">
              Initialize standard Indian civil engineering sequence (from Site Survey and Excavation up to Handover) with planned dates and predecessor dependencies.
            </p>
          </div>
          <button
            onClick={() => setIsInitModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 26 Stages Now</span>
          </button>
        </div>
      ) : (
        <D3GanttChart
          schedules={schedules}
          projectName={projectName}
          onSelectActivity={(activityId) => setSelectedScheduleIdForDrawer(activityId)}
          onUpdateActivity={(item) => setSelectedScheduleForUpdate(item)}
        />
      )}

      {/* Milestone Checkpoint Cards */}
      {schedules.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Construction Milestone Tracking ({completedMilestones} / {milestoneStages.length} Achieved)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {Math.round((completedMilestones / Math.max(1, milestoneStages.length)) * 100)}% Milestone Progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {milestoneStages.map((m) => {
              const isDone = m.status === 'COMPLETED';
              const isInProg = m.status === 'IN_PROGRESS';
              const isDelayed = m.status === 'DELAYED';

              return (
                <div
                  key={m._id}
                  onClick={() => setSelectedScheduleIdForDrawer(m._id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500'
                      : isDelayed
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500'
                      : isInProg
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                      STAGE #{m.workOrder}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDelayed
                          ? 'bg-rose-500/20 text-rose-400'
                          : isInProg
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-white text-xs mb-1 line-clamp-1">{m.workName}</h5>
                  <div className="text-[10px] text-slate-400 font-mono mb-2">
                    Planned: {new Date(m.plannedEndDate).toLocaleDateString()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-300">
                      <span>Progress</span>
                      <span className="font-bold">{m.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isDone ? 'bg-emerald-500' : isDelayed ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${m.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Details Drawer */}
      <WorkScheduleDetailDrawer
        scheduleId={selectedScheduleIdForDrawer}
        isOpen={Boolean(selectedScheduleIdForDrawer)}
        onClose={() => setSelectedScheduleIdForDrawer(null)}
        onOpenUpdateModal={(item) => {
          setSelectedScheduleForUpdate(item);
        }}
      />

      {/* Update Progress Modal */}
      <UpdateProgressModal
        schedule={selectedScheduleForUpdate}
        isOpen={Boolean(selectedScheduleForUpdate)}
        onClose={() => setSelectedScheduleForUpdate(null)}
        onSuccess={() => {
          setSelectedScheduleForUpdate(null);
          loadSchedules();
          if (onProjectUpdated) onProjectUpdated();
        }}
      />

      {/* Initialize Schedule Modal */}
      {project && (
        <InitializeScheduleModal
          projects={[project]}
          sites={sites}
          isOpen={isInitModalOpen}
          onClose={() => setIsInitModalOpen(false)}
          onSuccess={() => {
            setIsInitModalOpen(false);
            loadSchedules();
            if (onProjectUpdated) onProjectUpdated();
          }}
          defaultProjectId={projectId}
        />
      )}

      {/* Create Activity Modal */}
      <CreateActivityModal
        projects={project ? [project] : []}
        sites={sites}
        workers={workers}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadSchedules();
          if (onProjectUpdated) onProjectUpdated();
        }}
        defaultProjectId={projectId}
      />
    </div>
  );
}
