import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Info,
  Sliders,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { WorkScheduleItem, WorkScheduleStatus } from '../../types.ts';

interface GanttChartProps {
  schedules: WorkScheduleItem[];
  projectName?: string;
  onSelectActivity?: (activityId: string) => void;
  onUpdateActivity?: (activity: WorkScheduleItem) => void;
}

type TimeScale = 'days' | 'weeks' | 'months';

export function GanttChart({
  schedules,
  projectName,
  onSelectActivity,
  onUpdateActivity,
}: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>('weeks');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [highlightDelayed, setHighlightDelayed] = useState<boolean>(true);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        if (statusFilter === 'ALL') return true;
        return s.status === statusFilter;
      })
      .sort((a, b) => a.workOrder - b.workOrder);
  }, [schedules, statusFilter]);

  // Determine overall timeline boundaries
  const { minDate, maxDate, totalDays, intervals } = useMemo(() => {
    if (schedules.length === 0) {
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 90);
      return {
        minDate: now,
        maxDate: end,
        totalDays: 90,
        intervals: [],
      };
    }

    let min = new Date(schedules[0].plannedStartDate || Date.now()).getTime();
    let max = new Date(schedules[0].plannedEndDate || Date.now()).getTime();

    schedules.forEach((s) => {
      if (s.plannedStartDate) {
        const pStart = new Date(s.plannedStartDate).getTime();
        if (!isNaN(pStart) && pStart < min) min = pStart;
      }
      if (s.plannedEndDate) {
        const pEnd = new Date(s.plannedEndDate).getTime();
        if (!isNaN(pEnd) && pEnd > max) max = pEnd;
      }
      if (s.actualStartDate) {
        const aStart = new Date(s.actualStartDate).getTime();
        if (!isNaN(aStart) && aStart < min) min = aStart;
      }
      if (s.actualEndDate) {
        const aEnd = new Date(s.actualEndDate).getTime();
        if (!isNaN(aEnd) && aEnd > max) max = aEnd;
      }
    });

    // Add padding days
    const minD = new Date(min);
    minD.setDate(minD.getDate() - 3);
    minD.setHours(0, 0, 0, 0);

    const maxD = new Date(max);
    maxD.setDate(maxD.getDate() + 7);
    maxD.setHours(23, 59, 59, 999);

    const diffDays = Math.max(14, Math.ceil((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)));

    // Generate intervals for header
    const headers: { label: string; date: Date; leftPct: number; widthPct: number }[] = [];
    const stepDays = timeScale === 'days' ? 2 : timeScale === 'weeks' ? 7 : 30;

    let curr = new Date(minD);
    while (curr <= maxD) {
      const startMs = curr.getTime() - minD.getTime();
      const leftPct = (startMs / (maxD.getTime() - minD.getTime())) * 100;

      const next = new Date(curr);
      next.setDate(next.getDate() + stepDays);
      const widthPct = Math.min(100 - leftPct, ((stepDays * 86400000) / (maxD.getTime() - minD.getTime())) * 100);

      let label = '';
      if (timeScale === 'days') {
        label = curr.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      } else if (timeScale === 'weeks') {
        label = `Wk ${curr.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      } else {
        label = curr.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      headers.push({ label, date: new Date(curr), leftPct, widthPct });
      curr = next;
    }

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: diffDays,
      intervals: headers,
    };
  }, [schedules, timeScale]);

  // Today marker calculation
  const todayMarker = useMemo(() => {
    const today = new Date().getTime();
    const minMs = minDate.getTime();
    const maxMs = maxDate.getTime();
    if (today >= minMs && today <= maxMs) {
      return ((today - minMs) / (maxMs - minMs)) * 100;
    }
    return null;
  }, [minDate, maxDate]);

  // Helper to calculate bar positioning percentage
  const getBarCoords = (startDateStr?: string, endDateStr?: string) => {
    if (!startDateStr || !endDateStr) return null;
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    if (isNaN(start) || isNaN(end)) return null;

    const minMs = minDate.getTime();
    const maxMs = maxDate.getTime();
    const range = maxMs - minMs;
    if (range <= 0) return null;

    const left = Math.max(0, Math.min(100, ((start - minMs) / range) * 100));
    const right = Math.max(0, Math.min(100, ((end - minMs) / range) * 100));
    const width = Math.max(1.2, right - left);

    return { left, width };
  };

  const getStatusColor = (status: WorkScheduleStatus, isActual = false) => {
    switch (status) {
      case 'COMPLETED':
        return isActual ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500/30 border-emerald-500/50';
      case 'IN_PROGRESS':
        return isActual ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/30 border-amber-500/50';
      case 'DELAYED':
        return isActual ? 'bg-rose-500 text-white' : 'bg-rose-500/30 border-rose-500/50';
      case 'ON_HOLD':
        return isActual ? 'bg-orange-500 text-white' : 'bg-orange-500/30 border-orange-500/50';
      default:
        return isActual ? 'bg-blue-500 text-white' : 'bg-slate-700/50 border-slate-600';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-xs">
      {/* Header Controls & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-black text-white tracking-tight">
              Interactive Civil Gantt Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Comparative visualization of <span className="text-slate-300 font-semibold">Planned Baseline</span> vs{' '}
            <span className="text-amber-400 font-semibold">Actual Execution & Physical Completion</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Activities</option>
              <option value="IN_PROGRESS" className="bg-slate-900 text-amber-400">In Progress</option>
              <option value="COMPLETED" className="bg-slate-900 text-emerald-400">Completed</option>
              <option value="SCHEDULED" className="bg-slate-900 text-blue-400">Scheduled</option>
              <option value="DELAYED" className="bg-slate-900 text-rose-400">Delayed</option>
            </select>
          </div>

          {/* Time Zoom Level */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setTimeScale('days')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                timeScale === 'days' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setTimeScale('weeks')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                timeScale === 'weeks' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weeks
            </button>
            <button
              onClick={() => setTimeScale('months')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                timeScale === 'months' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Months
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Milestone Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="font-bold text-slate-400 uppercase tracking-wider">Legend:</span>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-2.5 rounded bg-slate-700 border border-slate-600 border-dashed" />
            <span className="text-slate-300">Planned Baseline Schedule</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded bg-amber-500 shadow-sm" />
            <span className="text-slate-300">Actual Active Execution</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded bg-emerald-500 shadow-sm" />
            <span className="text-slate-300">100% Completed Stage</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded bg-rose-500 shadow-sm" />
            <span className="text-slate-300">Critical / Delayed</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-rose-500" />
            <span className="text-rose-400 font-semibold">Today Marker</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Showing <span className="text-amber-400 font-bold">{filteredSchedules.length}</span> of{' '}
          {schedules.length} stages • Timeline span: {totalDays} days
        </div>
      </div>

      {/* Gantt Matrix Container */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline Header Row */}
            <div className="grid grid-cols-12 bg-slate-950/90 border-b border-slate-800 sticky top-0 z-10">
              {/* Left Column: Activity Meta (4 cols) */}
              <div className="col-span-4 p-3.5 border-r border-slate-800 flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <span>Activity & Gang / Team</span>
                <span className="font-mono">Order</span>
              </div>

              {/* Right Column: Time Scale Axis (8 cols) */}
              <div className="col-span-8 relative h-11 border-b border-slate-800 flex items-center">
                {intervals.map((inv, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-l border-slate-800/80 pl-1.5 pt-2 text-[10px] font-mono text-slate-400 truncate"
                    style={{ left: `${inv.leftPct}%`, width: `${inv.widthPct}%` }}
                  >
                    {inv.label}
                  </div>
                ))}

                {/* Today Marker in Header */}
                {todayMarker !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20"
                    style={{ left: `${todayMarker}%` }}
                    title={`Today: ${new Date().toLocaleDateString()}`}
                  >
                    <span className="absolute -top-1 -left-4 px-1 py-0.5 rounded bg-rose-500 text-[8px] font-bold text-white uppercase">
                      Today
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Rows */}
            <div className="divide-y divide-slate-800/50">
              {filteredSchedules.map((activity) => {
                const plannedCoords = getBarCoords(activity.plannedStartDate, activity.plannedEndDate);
                const actualStartDate = activity.actualStartDate || (activity.status !== 'NOT_STARTED' ? activity.plannedStartDate : undefined);
                const actualEndDate = activity.actualEndDate || (activity.status === 'COMPLETED' ? activity.plannedEndDate : new Date().toISOString());
                const actualCoords = actualStartDate ? getBarCoords(actualStartDate, actualEndDate) : null;

                const isDelayed =
                  activity.status === 'DELAYED' ||
                  (activity.status !== 'COMPLETED' &&
                    new Date(activity.plannedEndDate).getTime() < new Date().getTime());

                return (
                  <div
                    key={activity._id}
                    onClick={() => onSelectActivity && onSelectActivity(activity._id)}
                    className="grid grid-cols-12 hover:bg-slate-800/30 transition-colors group cursor-pointer items-center min-h-[72px]"
                  >
                    {/* Left Meta Information */}
                    <div className="col-span-4 p-3.5 border-r border-slate-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                          {activity.workOrder}
                        </span>
                        <span className="font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {activity.workName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pl-8">
                        <span className="truncate max-w-[140px]">{activity.assignedTeam || 'Civil Squad'}</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              activity.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : activity.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/10 text-amber-400'
                                : isDelayed
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {activity.status.replace('_', ' ')}
                          </span>
                          <span className="text-white font-bold">{activity.progressPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Chart Visualization Axis */}
                    <div className="col-span-8 p-3.5 relative h-16 flex flex-col justify-center gap-1.5">
                      {/* Background Vertical Guidelines */}
                      <div className="absolute inset-0 pointer-events-none flex">
                        {intervals.map((inv, idx) => (
                          <div
                            key={idx}
                            className="absolute top-0 bottom-0 border-l border-slate-800/40"
                            style={{ left: `${inv.leftPct}%` }}
                          />
                        ))}
                      </div>

                      {/* Today Marker line */}
                      {todayMarker !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500/70 z-10 pointer-events-none"
                          style={{ left: `${todayMarker}%` }}
                        />
                      )}

                      {/* Track 1: Planned Schedule Bar (Dashed Baseline) */}
                      {plannedCoords && (
                        <div
                          className="absolute h-3 rounded-md bg-slate-800/90 border border-slate-700/80 border-dashed z-10 transition-all flex items-center px-1"
                          style={{
                            left: `${plannedCoords.left}%`,
                            width: `${plannedCoords.width}%`,
                            top: '12px',
                          }}
                          title={`Planned Baseline: ${new Date(activity.plannedStartDate).toLocaleDateString()} to ${new Date(activity.plannedEndDate).toLocaleDateString()}`}
                        >
                          <span className="text-[9px] font-mono text-slate-400 truncate opacity-80">
                            Planned: {new Date(activity.plannedStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      )}

                      {/* Track 2: Actual Execution & Completed Progress Bar */}
                      {plannedCoords && (
                        <div
                          className={`absolute h-5 rounded-lg border shadow-sm z-20 transition-all flex items-center justify-between px-2 cursor-pointer ${
                            activity.status === 'COMPLETED'
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                              : isDelayed
                              ? 'bg-rose-500/90 border-rose-400 text-white font-bold'
                              : activity.progressPercentage > 0
                              ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                          style={{
                            left: `${plannedCoords.left}%`,
                            width: `${Math.max(
                              4,
                              (plannedCoords.width * (activity.progressPercentage || (activity.status === 'COMPLETED' ? 100 : 8))) / 100
                            )}%`,
                            top: '28px',
                          }}
                          title={`Actual Progress: ${activity.progressPercentage}% (${activity.status})`}
                        >
                          <span className="text-[9px] font-mono truncate font-black">
                            {activity.progressPercentage}%
                          </span>

                          {activity.targetQuantity && (
                            <span className="text-[9px] font-mono hidden sm:inline-block truncate">
                              {activity.completedQuantity || 0}/{activity.targetQuantity} {activity.unit || ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Log Action Button on Hover */}
                      {onUpdateActivity && (
                        <div className="absolute right-2 top-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateActivity(activity);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] shadow-md shadow-amber-500/20 flex items-center gap-1"
                          >
                            <span>Log</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Helper Footer Note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Click on any activity row to expand its detailed labor log, photo attachments, and quality sign-offs.</span>
        </span>
        <span className="font-mono">
          Engineered for PWD / Construction Sequencing Standards
        </span>
      </div>
    </div>
  );
}
