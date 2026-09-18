import React, { useState } from 'react';
import { GoogleMapsView } from '../../components/maps/GoogleMapsView.tsx';
import {
  ARAMBH_HQ_COORDS,
  ConstructionSiteMarker,
  INITIAL_CONSTRUCTION_SITES,
} from '../../services/googleMaps.ts';
import {
  MapPin,
  Building2,
  Navigation,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Compass,
  Phone,
  Mail,
  ShieldCheck,
  Search,
} from 'lucide-react';

export function GoogleMapsPage() {
  const [sites, setSites] = useState<ConstructionSiteMarker[]>(INITIAL_CONSTRUCTION_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(sites[0].id);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New site form state
  const [newSite, setNewSite] = useState({
    name: '',
    projectCode: '',
    locationName: '',
    lat: '16.2700',
    lng: '74.1500',
    progress: 10,
    contractValue: 5000000,
    siteOwner: '',
    ownerContact: '',
  });

  const filteredSites = sites.filter((site) => {
    const matchesFilter = filter === 'ALL' || site.status === filter;
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.name || !newSite.locationName) return;

    const created: ConstructionSiteMarker = {
      id: `site-${Date.now()}`,
      name: newSite.name,
      projectCode: newSite.projectCode || `AR-SITE-${Math.floor(100 + Math.random() * 900)}`,
      locationName: newSite.locationName,
      lat: parseFloat(newSite.lat) || ARAMBH_HQ_COORDS.lat,
      lng: parseFloat(newSite.lng) || ARAMBH_HQ_COORDS.lng,
      status: 'ACTIVE',
      progress: Number(newSite.progress) || 0,
      contractValue: Number(newSite.contractValue) || 1000000,
      siteOwner: newSite.siteOwner,
      ownerContact: newSite.ownerContact,
    };

    setSites([created, ...sites]);
    setSelectedSiteId(created.id);
    setShowAddModal(false);
    setNewSite({
      name: '',
      projectCode: '',
      locationName: '',
      lat: '16.2700',
      lng: '74.1500',
      progress: 10,
      contractValue: 5000000,
      siteOwner: '',
      ownerContact: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Google Maps Platform GIS
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Live Satellite & GPS Routing
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Site Locations & Civil Survey GIS Map
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Live mapping of all civil contracting sites across Kolhapur, Bhudargad, Shengaon, Kagal, and Gargoti with real-time GPS routes from Arambh HQ.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Pin New Site Plot
            </button>
          </div>
        </div>

        {/* Arambh HQ Info Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Headquarters Coordinates</span>
              <span className="font-semibold text-white">
                {ARAMBH_HQ_COORDS.lat}° N, {ARAMBH_HQ_COORDS.lng}° E
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Registered Base</span>
              <span className="font-semibold text-white truncate max-w-[240px] block">
                Shengaon, Tal. Bhudargad, Kolhapur
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Site Hotline / Director</span>
              <span className="font-semibold text-white">{ARAMBH_HQ_COORDS.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Site List & Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side Sites Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sites or codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 rounded-md font-semibold text-[11px] transition ${
                    filter === f
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f} ({sites.filter((s) => f === 'ALL' || s.status === f).length})
                </button>
              ))}
            </div>
          </div>

          {/* Site Cards List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredSites.map((site) => {
              const isSelected = selectedSiteId === site.id;
              const isCompleted = site.status === 'COMPLETED';

              return (
                <div
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {site.projectCode}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {site.status}
                        </span>
                      </div>
                      <h4 className="text-white font-bold text-xs sm:text-sm mt-1 line-clamp-1">
                        {site.name}
                      </h4>
                      <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5 line-clamp-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        {site.locationName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-white">{site.progress}%</div>
                      <div className="text-[10px] text-amber-400">
                        ₹{(site.contractValue / 100000).toFixed(1)}L
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${site.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {filteredSites.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No sites matching the current filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Side Map */}
        <div className="lg:col-span-8">
          <GoogleMapsView
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelectSite={(site) => site && setSelectedSiteId(site.id)}
            height="650px"
          />
        </div>
      </div>

      {/* Add New Site Plot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                Pin New Construction Site Plot
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSite} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolhapur Bridge RCC Abutment Work"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AR-KOP-2025-09"
                    value={newSite.projectCode}
                    onChange={(e) => setNewSite({ ...newSite, projectCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location / Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gargoti, Bhudargad"
                    value={newSite.locationName}
                    onChange={(e) => setNewSite({ ...newSite, locationName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GPS Latitude</label>
                  <input
                    type="text"
                    value={newSite.lat}
                    onChange={(e) => setNewSite({ ...newSite, lat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GPS Longitude</label>
                  <input
                    type="text"
                    value={newSite.lng}
                    onChange={(e) => setNewSite({ ...newSite, lng: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contract Value (₹)</label>
                  <input
                    type="number"
                    value={newSite.contractValue}
                    onChange={(e) => setNewSite({ ...newSite, contractValue: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSite.progress}
                    onChange={(e) => setNewSite({ ...newSite, progress: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client / Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zilla Parishad Kolhapur"
                    value={newSite.siteOwner}
                    onChange={(e) => setNewSite({ ...newSite, siteOwner: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Client Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={newSite.ownerContact}
                    onChange={(e) => setNewSite({ ...newSite, ownerContact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Save & Plot Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
