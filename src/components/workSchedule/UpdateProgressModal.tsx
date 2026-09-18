import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  HardHat,
  Camera,
  Layers,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api.ts';
import { WorkScheduleItem } from '../../types.ts';

interface Props {
  schedule: WorkScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateProgressModal({ schedule, isOpen, onClose, onSuccess }: Props) {
  if (!isOpen || !schedule) return null;

  const [activeSubTab, setActiveSubTab] = useState<'progress' | 'labor' | 'quantity' | 'image'>('progress');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // 1. Progress state
  const [progress, setProgress] = useState<number>(schedule.progressPercentage || 0);
  const [status, setStatus] = useState<string>(schedule.status);
  const [remarks, setRemarks] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');

  // 2. Quantity state
  const [quantity, setQuantity] = useState<number>(0);
  const [quantityRemarks, setQuantityRemarks] = useState<string>('');

  // 3. Labor state
  const [laborTeam, setLaborTeam] = useState<string>(schedule.assignedTeam || '');
  const [skilledCount, setSkilledCount] = useState<number>(2);
  const [unskilledCount, setUnskilledCount] = useState<number>(3);
  const [hours, setHours] = useState<number>(8);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'OVERTIME'>('DAY');
  const [laborRemarks, setLaborRemarks] = useState<string>('');
  const [estCost, setEstCost] = useState<number>(4500);

  // 4. Image state
  const [imageUrl, setImageUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [imageType, setImageType] = useState<'BEFORE' | 'DURING' | 'COMPLETED'>('DURING');

  // Submit Progress
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/admin/work-schedules/${schedule._id}/progress`, {
        progressPercentage: Number(progress),
        status,
        remarks,
        actualEndDate: progress === 100 ? actualEndDate || new Date().toISOString() : undefined,
      });

      if (res.data.success) {
        setSuccessMsg('Progress updated successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating progress');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Final Completion
  const handleConfirmCompletion = async () => {
    if (!window.confirm(`Are you sure you want to mark ${schedule.workName} as 100% COMPLETED and verified?`)) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/admin/work-schedules/${schedule._id}/confirm-completion`, {
        completionRemarks: remarks || 'All completion criteria verified by Er. Sudarshan Bajrang Naik.',
      });
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error confirming completion');
    } finally {
      setLoading(false);
    }
  };

  // Submit Quantity
  const handleQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/admin/work-schedules/${schedule._id}/quantity`, {
        quantity: Number(quantity),
        unit: schedule.unit || 'Sq.ft',
        workerTeam: laborTeam,
        remarks: quantityRemarks,
      });

      if (res.data.success) {
        setSuccessMsg('Quantity logged successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error logging quantity');
    } finally {
      setLoading(false);
    }
  };

  // Submit Labor
  const handleLaborSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const totalWorkers = Number(skilledCount) + Number(unskilledCount);
      const res = await api.post(`/admin/work-schedules/${schedule._id}/labor`, {
        workerTeam: laborTeam,
        skilledWorkers: Number(skilledCount),
        unskilledWorkers: Number(unskilledCount),
        totalWorkers,
        regularHours: Number(hours),
        overtimeHours: Number(overtimeHours),
        shift,
        estimatedLaborCost: Number(estCost),
        remarks: laborRemarks,
      });

      if (res.data.success) {
        setSuccessMsg('Labor log recorded successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error recording labor');
    } finally {
      setLoading(false);
    }
  };

  // Submit Image
  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/admin/work-schedules/${schedule._id}/images`, {
        imageUrl,
        caption,
        imageType,
      });

      if (res.data.success) {
        setSuccessMsg('Image logged successfully');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error logging image');
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
            <span className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
              #{schedule.workOrder}
            </span>
            <div>
              <h3 className="text-base font-black text-white">{schedule.workName}</h3>
              <p className="text-xs text-slate-400">
                {schedule.projectName} • {schedule.siteName || 'Main Site'}
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

        {/* Action Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('progress')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'progress'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Update Progress & Status
          </button>
          <button
            onClick={() => setActiveSubTab('quantity')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'quantity'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log Output Quantity
          </button>
          <button
            onClick={() => setActiveSubTab('labor')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'labor'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Manpower / Labor
          </button>
          <button
            onClick={() => setActiveSubTab('image')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubTab === 'image'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Site Photos
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SUB-TAB 1: PROGRESS */}
          {activeSubTab === 'progress' && (
            <form onSubmit={handleProgressSubmit} className="space-y-4">
              {/* Progress Slider */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Progress Percentage
                  </label>
                  <span className="font-mono text-lg font-black text-amber-400">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setProgress(val);
                    if (val === 100) setStatus('COMPLETED');
                    else if (val > 0 && status === 'NOT_STARTED') setStatus('IN_PROGRESS');
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  {[0, 25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setProgress(preset);
                        if (preset === 100) setStatus('COMPLETED');
                        else if (preset > 0 && status === 'NOT_STARTED') setStatus('IN_PROGRESS');
                      }}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        progress === preset
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Workflow Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold / Weather Delay</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Site Engineer Remarks & Inspection Notes
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes on shuttering quality, cube test results, labor output..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify 100% Completion</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                  >
                    {loading ? 'Saving...' : 'Update Progress'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SUB-TAB 2: OUTPUT QUANTITY */}
          {activeSubTab === 'quantity' && (
            <form onSubmit={handleQuantitySubmit} className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Total Target</span>
                  <span className="font-mono text-white font-bold">
                    {schedule.targetQuantity || 0} {schedule.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Achieved So Far</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {schedule.completedQuantity || 0} {schedule.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Quantity Achieved Today ({schedule.unit || 'Sq.ft'}) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono text-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Execution Remarks
                </label>
                <input
                  type="text"
                  value={quantityRemarks}
                  onChange={(e) => setQuantityRemarks(e.target.value)}
                  placeholder="e.g. Completed north-east bay concrete casting"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || quantity <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Log Quantity'}
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 3: LABOR / MANPOWER */}
          {activeSubTab === 'labor' && (
            <form onSubmit={handleLaborSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Worker Gang / Subcontractor Team
                </label>
                <input
                  type="text"
                  value={laborTeam}
                  onChange={(e) => setLaborTeam(e.target.value)}
                  placeholder="e.g. Pandurang Mistri Shuttering Crew"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Skilled Workers (Masons/Carpenters)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={skilledCount}
                    onChange={(e) => setSkilledCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Unskilled Labor / Helpers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unskilledCount}
                    onChange={(e) => setUnskilledCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Regular Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Shift
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="DAY">Day Shift</option>
                    <option value="NIGHT">Night Shift</option>
                    <option value="OVERTIME">Continuous OT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Estimated Labor Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={estCost}
                  onChange={(e) => setEstCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Save Labor Log'}
                </button>
              </div>
            </form>
          )}

          {/* SUB-TAB 4: SITE PHOTOS */}
          {activeSubTab === 'image' && (
            <form onSubmit={handleImageSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Photo Stage Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BEFORE', 'DURING', 'COMPLETED'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImageType(t)}
                      className={`py-2 rounded-xl font-bold border transition-colors ${
                        imageType === t
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Image URL / Cloud Storage Link <span className="text-amber-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Photo Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Column reinforcement checked with cover blocks"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !imageUrl}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black disabled:opacity-50"
                >
                  {loading ? 'Logging...' : 'Upload Site Photo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
