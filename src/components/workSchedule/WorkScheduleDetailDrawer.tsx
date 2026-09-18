import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardHat,
  Camera,
  Layers,
  History,
  FileCheck,
  TrendingUp,
  Award,
} from 'lucide-react';
import api from '../../services/api.ts';
import { WorkScheduleItem } from '../../types.ts';

interface Props {
  scheduleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenUpdateModal: (item: WorkScheduleItem) => void;
}

export function WorkScheduleDetailDrawer({
  scheduleId,
  isOpen,
  onClose,
  onOpenUpdateModal,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'labor' | 'quantities' | 'photos' | 'history'>('overview');

  useEffect(() => {
    if (isOpen && scheduleId) {
      fetchDetail();
    } else {
      setData(null);
    }
  }, [isOpen, scheduleId]);

  const fetchDetail = async () => {
    if (!scheduleId) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/work-schedules/${scheduleId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full shadow-2xl flex flex-col text-xs">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
              #{data?.workOrder || '•'}
            </span>
            <div>
              <h2 className="text-base font-black text-white">{data?.workName || 'Activity Details'}</h2>
              <p className="text-xs text-slate-400">
                {data?.projectName} • {data?.siteName || 'Main Site'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={() => onOpenUpdateModal(data)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Update / Log</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-slate-400">Activity record not found</div>
        ) : (
          <>
            {/* Progress Ribbon */}
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-300">Phase Completion</span>
                  <span className="font-mono font-black text-amber-400">{data.progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      data.progressPercentage === 100
                        ? 'bg-emerald-500'
                        : data.progressPercentage > 50
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${data.progressPercentage}%` }}
                  />
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                  data.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : data.status === 'IN_PROGRESS'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : data.status === 'DELAYED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {data.status.replace('_', ' ')}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto font-bold">
              {[
                { key: 'overview', label: 'Overview & Criteria', icon: Layers },
                { key: 'quantities', label: `Quantities (${data.quantityRecords?.length || 0})`, icon: TrendingUp },
                { key: 'labor', label: `Labor Logs (${data.laborRecords?.length || 0})`, icon: HardHat },
                { key: 'photos', label: `Site Photos (${data.images?.length || 0})`, icon: Camera },
                { key: 'history', label: `Audit Log (${data.history?.length || 0})`, icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                      activeTab === tab.key
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panes */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Timeline Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="font-bold text-white uppercase tracking-wider text-[10px] block text-slate-400">
                      Engineering Timeline
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Planned Timeline</span>
                        <p className="font-semibold text-white">
                          {new Date(data.plannedStartDate).toLocaleDateString()} &rarr;{' '}
                          {new Date(data.plannedEndDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Actual Execution</span>
                        <p className="font-semibold text-amber-300">
                          {data.actualStartDate ? new Date(data.actualStartDate).toLocaleDateString() : 'Pending'}{' '}
                          &rarr; {data.actualEndDate ? new Date(data.actualEndDate).toLocaleDateString() : 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Description & Technical Guidelines */}
                  {data.activityDef && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <Award className="w-4 h-4" />
                        <span>PWD Engineering Standard Checklist</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{data.activityDef.detailedDescription}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Official Completion Criteria (Verification Standards)
                        </span>
                        <ul className="space-y-1">
                          {data.activityDef.completionCriteria.map((c: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Prerequisites & Team */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Assigned Contractor / Gang
                      </span>
                      <p className="text-white font-bold text-sm">
                        {data.assignedTeam || 'Unassigned / In-house Civil Squad'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Target vs Achieved Quantity
                      </span>
                      <p className="font-mono text-white font-bold text-sm">
                        {data.completedQuantity || 0} / {data.targetQuantity || 'N/A'} {data.unit || 'Sq.ft'}
                      </p>
                    </div>
                  </div>

                  {/* Verification Note if completed */}
                  {data.completionRemarks && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <FileCheck className="w-4 h-4" />
                        <span>Completion Verified by Chief Engineer</span>
                      </div>
                      <p className="text-xs">{data.completionRemarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUANTITIES */}
              {activeTab === 'quantities' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Daily Output Quantity Logs</span>
                    <button
                      onClick={() => onOpenUpdateModal(data)}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      + Log Output
                    </button>
                  </div>
                  {data.quantityRecords && data.quantityRecords.length > 0 ? (
                    <div className="space-y-2">
                      {data.quantityRecords.map((q: any) => (
                        <div
                          key={q._id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-black text-amber-400 text-sm">
                              +{q.quantity} {q.unit}
                            </span>
                            <p className="text-[11px] text-slate-400">{q.remarks || 'Standard daily output'}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(q.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      No quantity measurements logged yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LABOR LOGS */}
              {activeTab === 'labor' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Labor Deployment History</span>
                    <button
                      onClick={() => onOpenUpdateModal(data)}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      + Log Labor
                    </button>
                  </div>
                  {data.laborRecords && data.laborRecords.length > 0 ? (
                    <div className="space-y-2">
                      {data.laborRecords.map((l: any) => (
                        <div
                          key={l._id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{l.workerTeam || 'Site Workforce'}</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              ₹{l.estimatedLaborCost?.toLocaleString('en-IN') || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span>{l.totalWorkers} Workers ({l.skilledWorkers} skilled, {l.unskilledWorkers} unskilled)</span>
                            <span>•</span>
                            <span>{l.regularHours}h (+{l.overtimeHours}h OT)</span>
                            <span>•</span>
                            <span className="font-mono">{new Date(l.date).toLocaleDateString()}</span>
                          </div>
                          {l.remarks && <p className="text-[11px] text-slate-500 italic">{l.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      No manpower logs recorded for this activity.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SITE PHOTOS */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Construction Photographic Evidence</span>
                    <button
                      onClick={() => onOpenUpdateModal(data)}
                      className="text-amber-400 hover:underline font-bold"
                    >
                      + Upload Photo
                    </button>
                  </div>
                  {data.images && data.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {data.images.map((img: any) => (
                        <div
                          key={img._id}
                          className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden group relative"
                        >
                          <img
                            src={img.imageUrl}
                            alt={img.caption || 'Site Photo'}
                            className="w-full h-36 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="p-2.5 space-y-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-800 text-amber-400">
                              {img.imageType}
                            </span>
                            <p className="text-slate-300 font-medium truncate">{img.caption || 'Inspection photo'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      No photographic records uploaded yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT LOG */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <span className="font-bold text-white block">Activity Execution History</span>
                  {data.history && data.history.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {data.history.map((h: any) => (
                        <div key={h._id} className="relative pl-8 space-y-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute left-2.5 top-1.5 -translate-x-1/2 ring-4 ring-slate-900" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {h.previousProgress}% &rarr; {h.newProgress}% ({h.newStatus})
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(h.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {h.remarks && <p className="text-[11px] text-slate-400">{h.remarks}</p>}
                          <p className="text-[10px] text-slate-500">Updated by {h.updatedBy}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      No historical progress changes logged yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
