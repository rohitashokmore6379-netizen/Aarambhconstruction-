import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, AlertTriangle, CheckCircle2, TrendingDown, X, ShoppingCart } from 'lucide-react';
import api from '../../services/api.ts';
import { Material } from '../../types.ts';
import { formatCurrency } from '../../utils/formatters.ts';

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Add Material Modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Cement');
  const [unit, setUnit] = useState<string>('Bags');
  const [unitPrice, setUnitPrice] = useState<string>('380');
  const [currentStock, setCurrentStock] = useState<string>('100');
  const [minimumStock, setMinimumStock] = useState<string>('50');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/materials');
      if (res.data.success) {
        setMaterials(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load materials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/materials', {
        name: name.trim(),
        category,
        unit,
        unitPrice: Number(unitPrice) || 0,
        currentStock: Number(currentStock) || 0,
        minimumStock: Number(minimumStock) || 10,
      });

      if (res.data.success) {
        setAddModalOpen(false);
        setName('');
        loadMaterials();
      }
    } catch (err) {
      console.error('Failed to create material', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = categoryFilter === 'ALL' || m.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSearch =
      !searchTerm.trim() ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minimumStock).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Material Master & Stock Levels
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Civil engineering materials, brass volume measures, rebar steel gauges, and inventory reserves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/material-purchases"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>Procurement Bills →</span>
          </Link>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>New Material</span>
          </button>
        </div>
      </div>

      {/* Low stock warning banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-amber-200">
              <strong>{lowStockCount} Material(s)</strong> are currently below minimum safety stock levels!
            </span>
          </div>
          <Link
            to="/admin/material-purchases"
            className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400"
          >
            Create Purchase Order
          </Link>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Cement', 'Steel', 'Sand', 'Aggregates', 'Bricks', 'Chemicals'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search material by name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading materials stock...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
          No materials found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m) => {
            const isLow = m.currentStock <= m.minimumStock;
            return (
              <div
                key={m._id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 ${
                  isLow ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-base">{m.name}</h3>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mt-0.5">
                        {m.category}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isLow
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isLow ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Balance:</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {m.currentStock} {m.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Safety Minimum:</span>
                      <span className="font-mono text-slate-300">
                        {m.minimumStock} {m.unit}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Current Unit Rate:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(m.unitPrice)} / {m.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <Link
                    to="/admin/inventory"
                    className="text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <span>Audit Trail</span>
                  </Link>
                  <Link
                    to="/admin/material-purchases"
                    className="text-amber-400 hover:text-amber-300 font-bold"
                  >
                    Order Stock →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Construction Material</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. UltraTech Cement 53 Grade (PPC)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Cement">Cement</option>
                    <option value="Steel / Rebar">Steel / Rebar</option>
                    <option value="Sand / Crush">Sand / Crush</option>
                    <option value="Aggregates">Aggregates</option>
                    <option value="Bricks & Blocks">Bricks & Blocks</option>
                    <option value="Chemicals & Admixtures">Chemicals & Admixtures</option>
                    <option value="Plumbing & Electrical">Plumbing & Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit of Measurement</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Kg">Kg</option>
                    <option value="Tons">Tons</option>
                    <option value="Brass">Brass</option>
                    <option value="Nos">Nos</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="380"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min. Alert Stock</label>
                  <input
                    type="number"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
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
                  {submitting ? 'Saving...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
