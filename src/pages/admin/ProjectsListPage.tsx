import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Receipt,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Project, Site } from '../../types.ts';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters.ts';
import { ReceivePaymentModal } from '../../components/payments/ReceivePaymentModal.tsx';
import { ProjectsSiteMap } from '../../components/maps/ProjectsSiteMap.tsx';

export function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState<boolean>(false);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const navigate = useNavigate();

  // Create Project Form State
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectType, setNewProjectType] = useState<string>('Residential Bungalow');
  const [newLocation, setNewLocation] = useState<string>('Kolhapur');
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newContractValue, setNewContractValue] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIsPublic, setNewIsPublic] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadProjectsAndSites = async () => {
    setLoading(true);
    try {
      const [projRes, siteRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);
      if (projRes.data.success) {
        setProjects(projRes.data.data);
      }
      if (siteRes.data.success) {
        setSites(siteRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load projects and sites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsAndSites();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newClientName.trim() || !newContractValue) {
      setFormError('Project Name, Client Name, and Contract Value are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/admin/projects', {
        projectName: newProjectName.trim(),
        projectType: newProjectType,
        location: newLocation.trim(),
        client: {
          name: newClientName.trim(),
          phone: newClientPhone.trim(),
        },
        contractValue: Number(newContractValue),
        description: newDescription.trim(),
        isPublic: newIsPublic,
        status: 'PLANNING',
      });

      if (res.data.success) {
        setCreateModalOpen(false);
        resetForm();
        loadProjectsAndSites();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewProjectName('');
    setNewClientName('');
    setNewClientPhone('');
    setNewContractValue('');
    setNewDescription('');
    setFormError('');
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      p.projectName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.projectCode.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Construction Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Master directory of all infrastructure contracts, active site locations, and balance ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Switcher: Cards vs Interactive Google Map */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cards Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sites Map</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <ProjectsSiteMap
          projects={projects}
          sites={sites}
          onSelectProject={(projId) => navigate(`/admin/projects/${projId}`)}
        />
      ) : (
        <>
          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'IN_PROGRESS', 'PLANNING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code, client, location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading project ledgers and sites...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900/50 rounded-2xl border border-slate-800">
          No projects matched your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const fin = p.financials;
            return (
              <div
                key={p._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all shadow-xl flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      {p.projectCode}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/admin/projects/${p._id}`)}
                    className="text-lg font-bold text-white group-hover:text-amber-400 cursor-pointer transition-colors"
                  >
                    {p.projectName}
                  </h3>

                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{p.location}</span>
                  </div>

                  <div className="text-xs text-slate-300 mt-2">
                    <strong className="text-slate-400 font-normal">Owner/Client: </strong>
                    <span className="font-semibold text-white">{p.client?.name}</span>
                  </div>
                </div>

                {/* Financial Summary Card Box */}
                {fin && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Project Cost:</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(fin.totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Total Received:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(fin.totalReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">Pending Amount:</span>
                      <span className="font-mono font-bold text-amber-400">{formatCurrency(fin.pendingAmount)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Payment Collection</span>
                        <span className="font-bold text-white">{fin.paymentProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(fin.paymentProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setTargetProjectId(p._id);
                      setReceiveModalOpen(true);
                    }}
                    className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Receive Pay</span>
                  </button>

                  <Link
                    to={`/admin/projects/${p._id}`}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create New Construction Project</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Shanti Niketan Residency"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Type</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Residential Bungalow">Residential Bungalow</option>
                    <option value="Commercial Complex">Commercial Complex</option>
                    <option value="Industrial Shed">Industrial Shed</option>
                    <option value="Township / Row Houses">Township / Row Houses</option>
                    <option value="Civil Infrastructure">Civil Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Gargoti, Kolhapur"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Owner / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Mr. Suresh Patil"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Phone</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+91 98220 12345"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Contract Value (₹) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newContractValue}
                  onChange={(e) => setNewContractValue(e.target.value)}
                  placeholder="3500000"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Civil Specs</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ground + 2 Storey residential construction with modern porch..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isPublicCheck" className="text-slate-300 font-medium">
                  Publish project milestone showcase on public portfolio website
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={receiveModalOpen}
        initialProjectId={targetProjectId}
        onClose={() => {
          setReceiveModalOpen(false);
          setTargetProjectId('');
        }}
        onSuccess={() => {
          loadProjectsAndSites();
        }}
      />
    </div>
  );
}
