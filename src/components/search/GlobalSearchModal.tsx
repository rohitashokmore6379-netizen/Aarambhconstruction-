import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Building2, MapPin, Users, Truck, Package, Receipt, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../services/api.ts';
import { formatCurrency } from '../../utils/formatters.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<any>({
    projects: [],
    sites: [],
    workers: [],
    vendors: [],
    materials: [],
    transactions: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({
        projects: [],
        sites: [],
        workers: [],
        vendors: [],
        materials: [],
        transactions: [],
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({
        projects: [],
        sites: [],
        workers: [],
        vendors: [],
        materials: [],
        transactions: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.data);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.projects.length +
    results.sites.length +
    results.workers.length +
    results.vendors.length +
    results.materials.length +
    results.transactions.length;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-700/80 bg-slate-800/60">
          <Search className="w-5 h-5 text-amber-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects (e.g. 'Gargoti', 'ABC'), sites, workers, materials, receipts..."
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
              ESC
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-sm">
          {!query.trim() && (
            <div className="py-8 text-center text-slate-500">
              <p className="text-xs">Type project code, site name, contractor, material name, or voucher reference.</p>
              <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-400">
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">PRJ-2026-001</span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Gargoti</span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Ultratech</span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">AR-REC-2025</span>
              </div>
            </div>
          )}

          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Projects ({results.projects.length})
              </div>
              <div className="space-y-1.5">
                {results.projects.map((p: any) => (
                  <div
                    key={p._id}
                    onClick={() => handleSelect(`/admin/projects/${p._id}`)}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-700/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-amber-300">{p.projectName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {p.projectCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</span>
                        <span>•</span>
                        <span>Client: {p.client?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(`/admin/projects/${p._id}?tab=payments`);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                      >
                        Payments
                      </button>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sites */}
          {results.sites.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Construction Sites ({results.sites.length})
              </div>
              <div className="space-y-1.5">
                {results.sites.map((s: any) => (
                  <div
                    key={s._id}
                    onClick={() => handleSelect(`/admin/projects/${s.projectId?._id || s.projectId}?tab=sites`)}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-sky-500/10 hover:border-sky-500/30 border border-slate-700/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-white group-hover:text-sky-300">{s.siteName}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {s.location} • Owner: {s.siteOwner} ({s.projectId?.projectName})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions / Receipts */}
          {results.transactions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Payments & Receipts ({results.transactions.length})
              </div>
              <div className="space-y-1.5">
                {results.transactions.map((t: any) => (
                  <div
                    key={t._id}
                    onClick={() => handleSelect(`/admin/payments?search=${t.receiptNumber}`)}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-slate-700/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <span className="font-mono font-bold text-white group-hover:text-emerald-300">{t.receiptNumber}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {t.ownerName} • {t.projectId?.projectName} • {t.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono">{formatCurrency(t.amount)}</span>
                      <span className="text-[10px] text-slate-500 block">Open Ledger</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workers */}
          {results.workers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Workers & Labor ({results.workers.length})
              </div>
              <div className="space-y-1.5">
                {results.workers.map((w: any) => (
                  <div
                    key={w._id}
                    onClick={() => handleSelect('/admin/workers')}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white">{w.name} ({w.workerCode})</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {w.skill} • {w.phone} • ₹{w.dailyWageRate}/day
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {results.materials.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Materials Inventory ({results.materials.length})
              </div>
              <div className="space-y-1.5">
                {results.materials.map((m: any) => (
                  <div
                    key={m._id}
                    onClick={() => handleSelect('/admin/materials')}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-amber-500/10 border border-slate-700/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-bold text-white">{m.name}</span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {m.category} • Stock: {m.currentStock} {m.unit}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      View Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-700/80 flex justify-between items-center text-[11px] text-slate-400">
          <span>Search index powered by Arambh Central Database</span>
          <button onClick={onClose} className="hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
