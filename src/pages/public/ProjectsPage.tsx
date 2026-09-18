import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Search, ArrowRight, Filter } from 'lucide-react';
import api from '../../services/api.ts';

export function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/public/projects');
        if (res.data.success) {
          setProjects(res.data.data);
          setFilteredProjects(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load public projects', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    let list = [...projects];
    if (selectedType !== 'ALL') {
      list = list.filter((p) => p.projectType.toLowerCase().includes(selectedType.toLowerCase()));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    setFilteredProjects(list);
  }, [selectedType, searchTerm, projects]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div>
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          Arambh Portfolio Showcase
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Landmark Construction Projects</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl">
          Browse our active and completed infrastructure landmarks across Maharashtra. All project specifications, milestone tracking, and site visuals are audited directly by site engineers.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'Residential', 'Commercial', 'Industrial'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedType === type
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Projects' : type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading project showcase portfolio...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900/50 rounded-2xl border border-slate-800">
          No projects matched your selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all group flex flex-col shadow-lg"
            >
              <div className="relative h-56 bg-slate-950 overflow-hidden">
                <img
                  src={p.publicImages?.[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80'}
                  alt={p.projectName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-amber-400">
                  {p.projectType}
                </div>
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono font-bold text-white">
                  {p.publicProgress}%
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {p.projectName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{p.location}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                      <span>Phase: {p.publicStatus || 'Active Execution'}</span>
                      <span className="font-bold text-white">{p.publicProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${p.publicProgress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/projects/${p._id}`}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Project Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
