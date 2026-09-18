import React, { useState } from 'react';
import {
  X,
  Plus,
  Calendar,
  Layers,
  AlertCircle,
  Users,
  HardHat,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site, Worker } from '../../types.ts';
import { DEFAULT_CONSTRUCTION_ACTIVITIES } from '../../data/constructionActivities.ts';

interface Props {
  projects: Project[];
  sites: Site[];
  workers: Worker[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

export function CreateActivityModal({
  projects,
  sites,
  workers,
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}: Props) {
  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [siteId, setSiteId] = useState<string>('');
  const [workName, setWorkName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [workOrder, setWorkOrder] = useState<number>(1);
  const [plannedStartDate, setPlannedStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [plannedEndDate, setPlannedEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<string>('SCHEDULED');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [assignedTeam, setAssignedTeam] = useState<string>('');
  const [targetQuantity, setTargetQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('Sq.ft');
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const filteredSites = sites.filter(
    (s) => (typeof s.projectId === 'object' ? (s.projectId as any)?._id : s.projectId) === projectId
  );

  const handleSelectTemplate = (templateName: string) => {
    const act = DEFAULT_CONSTRUCTION_ACTIVITIES.find((a) => a.name === templateName);
    if (act) {
      setWorkName(act.name);
      setDescription(act.shortDefinition);
      setWorkOrder(act.order);
      setUnit(act.defaultUnit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !workName || !plannedStartDate || !plannedEndDate) {
      setError('Project, Work Name, Start Date and End Date are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/admin/work-schedules', {
        projectId,
        siteId: siteId || undefined,
        workName,
        description,
        workOrder: Number(workOrder) || 1,
        plannedStartDate,
        plannedEndDate,
        status,
        priority,
        assignedTeam,
        targetQuantity: Number(targetQuantity) || 0,
        unit,
        remarks,
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create activity');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add Construction Activity</h3>
              <p className="text-xs text-slate-400">
                Create a scheduled phase or custom civil engineering task
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Template Picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Select from Standard 26 Activities
            </label>
            <select
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose predefined activity template --</option>
              {DEFAULT_CONSTRUCTION_ACTIVITIES.map((act) => (
                <option key={act.order} value={act.name}>
                  {act.order}. {act.name} ({act.defaultUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Project & Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Project <span className="text-amber-400">*</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setSiteId('');
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Select Project --</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Site / Plot
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                disabled={!projectId || filteredSites.length === 0}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
              >
                <option value="">-- Main Site --</option>
                {filteredSites.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Work Name & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Activity / Task Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                placeholder="e.g. Column Casting, Slab Centering"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Sequence Order #
              </label>
              <input
                type="number"
                min="1"
                value={workOrder}
                onChange={(e) => setWorkOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Planned Start Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Planned End Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Priority & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Target Quantity (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Unit of Measurement
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Sq.ft, Cu.m, R.ft, Nos"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Assigned Team */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Assigned Contractor / Labor Team
            </label>
            <input
              type="text"
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
              placeholder="e.g. Pandurang Mistri Team, Bar Benders Crew"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Description & Technical Instructions */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Scope / Technical Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, mix ratios, structural references..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !projectId || !workName}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Creating Task...' : 'Save Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
