import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckSquare,
  Clock,
  HardHat,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  X,
  Building2,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.ts';
import { WorkActivityDefinition } from '../../types.ts';

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; border: string; bg: string; text: string }
> = {
  PRE_CONSTRUCTION: {
    label: 'Pre-Construction',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
  },
  SUBSTRUCTURE: {
    label: 'Substructure / Foundation',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
  },
  SUPERSTRUCTURE: {
    label: 'Superstructure (RCC & Masonry)',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
  },
  MEP_SERVICES: {
    label: 'MEP & Utility Services',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
  },
  FINISHING: {
    label: 'Finishing & Architectural',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
  },
  EXTERNAL_WORKS: {
    label: 'External Works & Handover',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
  },
  OTHER: {
    label: 'Other Miscellaneous',
    color: 'text-slate-400',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
  },
};

export function WorkActivityDefinitionsPage() {
  const [definitions, setDefinitions] = useState<WorkActivityDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<WorkActivityDefinition | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    order: 1,
    category: 'SUPERSTRUCTURE' as WorkActivityDefinition['category'],
    definition: '',
    completionCriteriaText: '',
    unit: 'Sq.ft',
    standardDurationDays: 7,
    typicalTradesText: 'Mason, Helper',
    safetyPrecautionsText: 'Safety helmet mandatory',
    inspectionRequired: true,
  });

  const loadDefinitions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/work-activity-definitions');
      if (res.data.success) {
        setDefinitions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load activity definitions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  const openCreateModal = () => {
    const nextOrder = definitions.length > 0 ? Math.max(...definitions.map((d) => d.order)) + 1 : 1;
    setEditingItem(null);
    setFormData({
      name: '',
      order: nextOrder,
      category: 'SUPERSTRUCTURE',
      definition: '',
      completionCriteriaText: '',
      unit: 'Sq.ft',
      standardDurationDays: 7,
      typicalTradesText: 'Mason, Helper',
      safetyPrecautionsText: 'Safety helmets and shoes mandatory',
      inspectionRequired: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: WorkActivityDefinition) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      order: item.order,
      category: item.category,
      definition: item.definition,
      completionCriteriaText: (item.completionCriteria || []).join('\n'),
      unit: item.unit || 'Sq.ft',
      standardDurationDays: item.standardDurationDays || 7,
      typicalTradesText: (item.typicalTrades || []).join(', '),
      safetyPrecautionsText: (item.safetyPrecautions || []).join('\n'),
      inspectionRequired: item.inspectionRequired !== undefined ? item.inspectionRequired : true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.definition.trim()) return;

    setSaving(true);
    try {
      const criteria = formData.completionCriteriaText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const trades = formData.typicalTradesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const safety = formData.safetyPrecautionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        order: Number(formData.order) || 1,
        category: formData.category,
        definition: formData.definition.trim(),
        completionCriteria: criteria,
        unit: formData.unit.trim() || 'Sq.ft',
        standardDurationDays: Number(formData.standardDurationDays) || 7,
        typicalTrades: trades,
        safetyPrecautions: safety,
        inspectionRequired: formData.inspectionRequired,
      };

      if (editingItem) {
        await api.put(`/admin/work-activity-definitions/${editingItem._id}`, payload);
      } else {
        await api.post('/admin/work-activity-definitions', payload);
      }

      setIsModalOpen(false);
      loadDefinitions();
    } catch (err) {
      console.error('Failed to save activity definition', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/admin/work-activity-definitions/${id}?hard=true`);
      setDeleteConfirmId(null);
      loadDefinitions();
    } catch (err) {
      console.error('Failed to delete activity definition', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= definitions.length) return;

    const newDefs = [...definitions];
    const [moved] = newDefs.splice(index, 1);
    newDefs.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setDefinitions(newDefs);

    try {
      const orderedIds = newDefs.map((d) => d._id);
      await api.post('/admin/work-activity-definitions/reorder', { orderedIds });
      loadDefinitions();
    } catch (err) {
      console.error('Failed to reorder definitions', err);
      loadDefinitions();
    }
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('Reset/reload standard CPWD construction task templates?')) return;
    setLoading(true);
    try {
      await api.post('/admin/work-activity-definitions/seed?force=true');
      loadDefinitions();
    } catch (err) {
      console.error('Failed to seed templates', err);
      setLoading(false);
    }
  };

  // Filtered definitions
  const filtered = definitions.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      !searchTerm.trim() ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (item.completionCriteria || []).some((c) => c.toLowerCase().includes(searchTerm.toLowerCase().trim()));
    return matchesCategory && matchesSearch;
  });

  // Metrics
  const totalTemplates = definitions.length;
  const subCount = definitions.filter((d) => d.category === 'SUBSTRUCTURE').length;
  const superCount = definitions.filter((d) => d.category === 'SUPERSTRUCTURE').length;
  const finishingCount = definitions.filter((d) => d.category === 'FINISHING' || d.category === 'MEP_SERVICES').length;
  const inspectionCount = definitions.filter((d) => d.inspectionRequired).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Construction Task Templates</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard engineering activity definitions, sequential milestone orders, and formal completion criteria for site quality sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            title="Reload standard CPWD civil construction stages"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Activity Definition</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Templates</span>
          <span className="text-xl font-black text-white font-mono mt-0.5">{totalTemplates}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-amber-400 uppercase font-semibold block">Foundation / Sub</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-0.5">{subCount}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-blue-400 uppercase font-semibold block">Superstructure</span>
          <span className="text-xl font-black text-blue-400 font-mono mt-0.5">{superCount}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[10px] text-purple-400 uppercase font-semibold block">Finishing & MEP</span>
          <span className="text-xl font-black text-purple-400 font-mono mt-0.5">{finishingCount}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Sign-Off Gates</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5">{inspectionCount}</span>
        </div>
      </div>

      {/* Toolbar: Category Filters + Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Stages ({definitions.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const count = definitions.filter((d) => d.category === key).length;
            if (count === 0 && selectedCategory !== key) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {cfg.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates, criteria..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Activity Definitions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <p className="text-xs">Loading construction task definitions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Activity Definitions Found</h3>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            {searchTerm || selectedCategory !== 'ALL'
              ? 'No templates match the chosen category or search filter.'
              : 'No activity definitions found in the database. Click below to load standard templates.'}
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={handleSeedDefaults}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Load Standard CPWD Construction Templates
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => {
            const isExpanded = expandedId === item._id;
            const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER;

            return (
              <div
                key={item._id}
                className={`bg-slate-900 border rounded-2xl transition-all ${
                  isExpanded ? 'border-amber-500/50 shadow-xl' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Order badge & reorder arrows */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-black text-amber-400">
                        {item.order}
                      </div>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'UP')}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Move up in sequence"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === filtered.length - 1}
                          onClick={() => handleMoveOrder(index, 'DOWN')}
                          className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                          title="Move down in sequence"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-sm tracking-tight">{item.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                        >
                          {catCfg.label}
                        </span>
                        {item.inspectionRequired && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <ClipboardCheck className="w-3 h-3" />
                            <span>Quality Gate</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.definition}</p>
                    </div>
                  </div>

                  {/* Attributes & Quick Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                        {item.unit || 'Sq.ft'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>~{item.standardDurationDays || 7}d</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item._id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item._id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title={isExpanded ? 'Collapse' : 'View Criteria'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Definition & Completion Criteria */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 space-y-4 text-xs">
                    {/* Detailed Definition */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                        Task Definition & Scope of Work
                      </span>
                      <p className="text-slate-300 leading-relaxed">{item.definition}</p>
                    </div>

                    {/* Completion Criteria Checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Completion & Sign-Off Criteria Checklist ({item.completionCriteria?.length || 0})</span>
                      </span>

                      {item.completionCriteria && item.completionCriteria.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.completionCriteria.map((crit, cIdx) => (
                            <div
                              key={cIdx}
                              className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-slate-300 leading-snug">{crit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No specific completion criteria defined yet.</p>
                      )}
                    </div>

                    {/* Trades & Safety */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {item.typicalTrades && item.typicalTrades.length > 0 && (
                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                            <HardHat className="w-3 h-3 text-amber-500" />
                            <span>Typical Trades Involved</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.typicalTrades.map((trade, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                                {trade}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.safetyPrecautions && item.safetyPrecautions.length > 0 && (
                        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-rose-400 font-bold uppercase block mb-1 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>Safety Precautions</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.safetyPrecautions.map((safe, sIdx) => (
                              <span key={sIdx} className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded text-[10px]">
                                {safe}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? 'Edit Construction Task Template' : 'Create Construction Task Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Task Template Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. RCC Column Shuttering & Casting"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sequence Order *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Construction Stage / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as WorkActivityDefinition['category'] })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PRE_CONSTRUCTION">Pre-Construction</option>
                    <option value="SUBSTRUCTURE">Substructure / Foundation</option>
                    <option value="SUPERSTRUCTURE">Superstructure (RCC & Masonry)</option>
                    <option value="MEP_SERVICES">MEP & Utility Services</option>
                    <option value="FINISHING">Finishing & Architectural</option>
                    <option value="EXTERNAL_WORKS">External Works & Handover</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Sq.ft, Cu.m, Rft, Nos"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Standard Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.standardDurationDays}
                    onChange={(e) => setFormData({ ...formData, standardDurationDays: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Task Definition / Engineering Scope of Work *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  placeholder="Detailed specifications, materials used, structural guidelines, and installation methodology..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Completion Criteria (Checklist items, one per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.completionCriteriaText}
                  onChange={(e) => setFormData({ ...formData, completionCriteriaText: e.target.value })}
                  placeholder="Slump test within 75-100mm&#10;Cube strength tested at 28 days&#10;Plumb check verified within ±3mm tolerance&#10;Water pond curing maintained for 14 days"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Typical Trades (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.typicalTradesText}
                    onChange={(e) => setFormData({ ...formData, typicalTradesText: e.target.value })}
                    placeholder="Bar Bender, Mason, Helper, Shuttering Carpenter"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Safety Precautions (one per line)
                  </label>
                  <input
                    type="text"
                    value={formData.safetyPrecautionsText}
                    onChange={(e) => setFormData({ ...formData, safetyPrecautionsText: e.target.value })}
                    placeholder="Safety helmets, full body harness above 2m"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold block">Mandatory Quality Gate Inspection</span>
                  <span className="text-[11px] text-slate-400 block">
                    Requires site engineer or project manager sign-off before marking 100% completed
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.inspectionRequired}
                  onChange={(e) => setFormData({ ...formData, inspectionRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl disabled:opacity-50 transition-all shadow-md shadow-amber-500/10"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Template Deletion</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete this construction activity definition? This will remove this task template from default project schedule initializers.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
