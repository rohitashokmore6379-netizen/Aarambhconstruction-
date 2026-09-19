import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Search, Building2, MapPin, IndianRupee, X, QrCode } from 'lucide-react';
import api from '../../services/api.ts';
import { Site, Project } from '../../types.ts';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters.ts';
import { SiteQRCodeModal } from '../../components/common/SiteQRCodeModal.tsx';

export function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Site QR Code Modal
  const [qrSite, setQrSite] = useState<Site | null>(null);

  // Add Site Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [siteName, setSiteName] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [siteOwner, setSiteOwner] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [siteRes, projRes] = await Promise.all([
        api.get('/admin/sites'),
        api.get('/admin/projects'),
      ]);

      if (siteRes.data.success) setSites(siteRes.data.data);
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) {
          setProjectId(projRes.data.data[0]._id);
          setSiteOwner(projRes.data.data[0].client?.name || '');
          setLocation(projRes.data.data[0].location || '');
        }
      }
    } catch (err) {
      console.error('Failed to load sites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProjectSelect = (pId: string) => {
    setProjectId(pId);
    const p = projects.find((item) => item._id === pId);
    if (p) {
      setSiteOwner(p.client?.name || '');
      setLocation(p.location || '');
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !projectId) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/sites', {
        projectId,
        siteName: siteName.trim(),
        location: location.trim() || 'Kolhapur',
        siteOwner: siteOwner.trim() || 'Site Owner',
        totalCost: Number(totalCost) || 0,
      });

      if (res.data.success) {
        setModalOpen(false);
        setSiteName('');
        setTotalCost('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to create site', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSites = sites.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      s.siteName.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.siteOwner.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Site Locations & Plots
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical plots, building wings, and construction units under management.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Site / Plot</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading construction sites...</div>
      ) : filteredSites.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
          No active sites found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{site.siteName}</h3>
                    <span className="text-[11px] text-amber-400 block mt-0.5">
                      {typeof site.projectId === 'object' ? site.projectId?.projectName : 'Parent Project'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(site.status)}`}>
                    {site.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{site.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-400">Site Owner:</span>
                    <strong className="text-white">{site.siteOwner}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-400">Allocated Cost:</span>
                    <strong className="text-emerald-400 font-mono">{formatCurrency(site.totalCost)}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setQrSite(site)}
                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Generate Site QR Code Placard"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Site QR Code</span>
                </button>

                {typeof site.projectId === 'object' && (
                  <Link
                    to={`/admin/projects/${site.projectId?._id}?tab=sites`}
                    className="text-slate-400 hover:text-amber-400 font-medium transition-colors"
                  >
                    Cockpit →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Site QR Code Modal */}
      <SiteQRCodeModal
        site={qrSite}
        isOpen={Boolean(qrSite)}
        onClose={() => setQrSite(null)}
      />

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Construction Site / Plot</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Parent Project *</label>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Site / Plot Name *</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Ground Floor RCC / Plot 3"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Site Owner</label>
                  <input
                    type="text"
                    value={siteOwner}
                    onChange={(e) => setSiteOwner(e.target.value)}
                    placeholder="Owner name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allocated Cost (₹)</label>
                  <input
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="1200000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Location Details</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Gargoti, Kolhapur"
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
                  {submitting ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
