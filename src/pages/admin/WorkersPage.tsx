import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Plus, Search, Phone, IndianRupee, Clock, CheckCircle2, User, X } from 'lucide-react';
import api from '../../services/api.ts';
import { Worker } from '../../types.ts';
import { formatCurrency, formatDate } from '../../utils/formatters.ts';

export function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');

  // Add Worker Modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [skill, setSkill] = useState<string>('Mason / Mistri');
  const [dailyRate, setDailyRate] = useState<string>('850');
  const [address, setAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/workers');
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load workers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/workers', {
        name: name.trim(),
        phone: phone.trim(),
        skill: skill.trim(),
        dailyRate: Number(dailyRate) || 800,
        address: address.trim(),
      });
      if (res.data.success) {
        setAddModalOpen(false);
        setName('');
        setPhone('');
        setAddress('');
        loadWorkers();
      }
    } catch (err) {
      console.error('Failed to add worker', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSkill = skillFilter === 'ALL' || w.skill.toLowerCase().includes(skillFilter.toLowerCase());
    const matchesSearch =
      !searchTerm.trim() ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      w.phone?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      w.skill.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesSkill && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Labor Force & Mistri Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered on-site workforce, daily wage rates, trade skills, and wage disbursement records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/work-logs"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-colors"
          >
            Daily Muster Roll →
          </Link>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Worker</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'Mistri', 'Carpenter', 'Bar Bender', 'Helper'].map((sk) => (
            <button
              key={sk}
              onClick={() => setSkillFilter(sk)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                skillFilter === sk ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {sk === 'ALL' ? 'All Trades' : sk}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search worker by name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading workforce directory...</div>
      ) : filteredWorkers.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
          No workers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((w) => (
            <div
              key={w._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{w.name}</h3>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mt-0.5">
                      {w.skill}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{w.phone || 'No phone recorded'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily Rate: <strong className="text-white font-mono">{formatCurrency(w.dailyRate)} / day</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Registered on muster</span>
                <Link
                  to={`/admin/work-logs?workerId=${w._id}`}
                  className="text-amber-400 hover:text-amber-300 font-bold"
                >
                  View Muster Logs →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Enroll Site Worker</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Babar"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trade / Skill</label>
                  <select
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Head Mistri">Head Mistri</option>
                    <option value="Mason / Bricklayer">Mason / Bricklayer</option>
                    <option value="Carpenter / Shuttering">Carpenter / Shuttering</option>
                    <option value="Bar Bender (Steel)">Bar Bender (Steel)</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="General Helper">General Helper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Daily Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="850"
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
                  {submitting ? 'Enrolling...' : 'Enroll Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
