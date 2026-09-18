import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, ArrowUpRight, ArrowDownRight, RefreshCw, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api.ts';
import { InventoryLog, Material, Project } from '../../types.ts';
import { formatDate } from '../../utils/formatters.ts';

export function InventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Adjustment Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [changeType, setChangeType] = useState<'USAGE' | 'MANUAL_ADJUSTMENT'>('USAGE');
  const [quantity, setQuantity] = useState<string>('10');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logRes, matRes, projRes] = await Promise.all([
        api.get('/admin/inventory-logs'),
        api.get('/admin/materials'),
        api.get('/admin/projects'),
      ]);

      if (logRes.data.success) setLogs(logRes.data.data);
      if (matRes.data.success) {
        setMaterials(matRes.data.data);
        if (matRes.data.data.length > 0) setSelectedMaterialId(matRes.data.data[0]._id);
      }
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) setProjectId(projRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load inventory logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialId || !quantity) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/inventory-logs', {
        materialId: selectedMaterialId,
        projectId: projectId || undefined,
        type: changeType,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        setModalOpen(false);
        setNotes('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to record stock adjustment', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Stock Inventory Audit Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable physical stock audit trail: Procurements, slab pours consumption, and site tally reconciliation.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Audit Type</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-center">Previous Stock</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4 text-center">New Balance</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading stock audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No inventory movement records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isPositive = log.type === 'PROCUREMENT';
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {typeof log.materialId === 'object' ? log.materialId?.name : 'Material'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            log.type === 'PROCUREMENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : log.type === 'USAGE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {typeof log.projectId === 'object' ? log.projectId?.projectName : 'Depot'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {log.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={isPositive ? 'text-emerald-400' : 'text-amber-400'}>
                          {isPositive ? '+' : '-'}{log.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {log.newStock}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{log.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Adjust Stock Balance</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Material *</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {materials.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} (Current: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Action Type</label>
                  <select
                    value={changeType}
                    onChange={(e: any) => setChangeType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="USAGE">Site Consumption / Pour (-)</option>
                    <option value="MANUAL_ADJUSTMENT">Physical Audit Count Adjust</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Site Allocation</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Central Depot / Warehouse</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audit Reason / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ground floor slab casting cement consumption"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
