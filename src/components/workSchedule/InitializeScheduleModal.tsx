import React, { useState } from 'react';
import {
  X,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site } from '../../types.ts';
import { DEFAULT_CONSTRUCTION_ACTIVITIES } from '../../data/constructionActivities.ts';

interface Props {
  projects: Project[];
  sites: Site[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

export function InitializeScheduleModal({
  projects,
  sites,
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [durationPerActivityDays, setDurationPerActivityDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const filteredSites = sites.filter(
    (s) => (typeof s.projectId === 'object' ? (s.projectId as any)?._id : s.projectId) === selectedProjectId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/admin/work-schedules/initialize', {
        projectId: selectedProjectId,
        siteId: selectedSiteId || undefined,
        startDate,
        durationPerActivityDays: Number(durationPerActivityDays) || 7,
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to initialize schedule');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error initializing schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Generate 26-Stage Construction Schedule</h3>
              <p className="text-xs text-slate-400">
                Bulk create the complete standard sequence from Site Lineout to Colour Painting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Select Target Project <span className="text-amber-400">*</span>
            </label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedSiteId('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectName} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Site / Plot (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Specific Site / Plot (Optional)
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              disabled={!selectedProjectId || filteredSites.length === 0}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              <option value="">-- All / Main Site --</option>
              {filteredSites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Work Commencement Date <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Average Duration per Stage (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={durationPerActivityDays}
                onChange={(e) => setDurationPerActivityDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 26 Standard Construction Stages Preview */}
          <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                26 Standard PWD & RCC Construction Activities
              </span>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                Sequenced
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_CONSTRUCTION_ACTIVITIES.map((act) => (
                <div
                  key={act.order}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {act.order}
                  </span>
                  <span className="text-slate-300 font-medium truncate">{act.name}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              Each activity will be initialized with planned start/end dates, dependencies, and completion criteria. You can fine-tune quantities, assigned teams, and individual milestones at any time.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProjectId}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Generating Pipeline...' : 'Generate 26 Stages'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
