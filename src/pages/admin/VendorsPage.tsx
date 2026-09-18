import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Phone, Mail, FileText, IndianRupee, X } from 'lucide-react';
import api from '../../services/api.ts';
import { Vendor, Project } from '../../types.ts';
import { formatCurrency } from '../../utils/formatters.ts';

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Add Vendor Modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');
  const [materialSupplied, setMaterialSupplied] = useState<string>('Cement & Steel');
  const [address, setAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Settle Vendor Modal
  const [settleModalOpen, setSettleModalOpen] = useState<boolean>(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleProjectId, setSettleProjectId] = useState<string>('');
  const [settleMethod, setSettleMethod] = useState<'CASH' | 'ONLINE'>('ONLINE');
  const [settleOnlineMethod, setSettleOnlineMethod] = useState<string>('NEFT');
  const [settleRef, setSettleRef] = useState<string>('');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [settling, setSettling] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [venRes, projRes] = await Promise.all([
        api.get('/admin/vendors'),
        api.get('/admin/projects'),
      ]);

      if (venRes.data.success) setVendors(venRes.data.data);
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) setSettleProjectId(projRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/vendors', {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstNumber: gstNumber.trim(),
        materialSupplied: materialSupplied.trim(),
        address: address.trim(),
      });

      if (res.data.success) {
        setAddModalOpen(false);
        setName('');
        setContactPerson('');
        setPhone('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to add vendor', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettleVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !settleAmount || !settleProjectId) return;
    setSettling(true);
    try {
      const res = await api.post('/admin/vendor-payments', {
        vendorId: selectedVendor._id,
        projectId: settleProjectId,
        amount: Number(settleAmount),
        paymentMethod: settleMethod,
        onlineMethod: settleMethod === 'ONLINE' ? settleOnlineMethod : undefined,
        transactionReference: settleRef.trim(),
        notes: settleNotes.trim(),
      });

      if (res.data.success) {
        setSettleModalOpen(false);
        setSettleAmount('');
        setSettleRef('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to disburse vendor payment', err);
    } finally {
      setSettling(false);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.materialSupplied?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Material Suppliers & Vendors
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier accounts, GSTIN verification, outstanding invoice balances, and bank settlements.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading vendor directories...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
          No suppliers registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((v) => (
            <div
              key={v._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{v.name}</h3>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mt-0.5">
                      {v.materialSupplied}
                    </span>
                  </div>
                  {v.gstNumber && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      GSTIN
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{v.contactPerson} ({v.phone || 'No phone'})</span>
                  </div>
                  {v.gstNumber && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      GST: {v.gstNumber}
                    </div>
                  )}
                </div>

                {/* Financial Ledger Box */}
                <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Billed:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(v.totalBilled || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid to Date:</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(v.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-amber-400 font-semibold">Pending Balance:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {formatCurrency(v.pendingBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedVendor(v);
                    setSettleModalOpen(true);
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors"
                >
                  Disburse Settlement Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Register Building Material Supplier</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mahalakshmi Steel Traders"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Mr. Deepak Shah"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 00000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplied Trade</label>
                  <input
                    type="text"
                    value={materialSupplied}
                    onChange={(e) => setMaterialSupplied(e.target.value)}
                    placeholder="TMT Steel / Cement"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="27AABCM8291M1Z4"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Address / Depot Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="MIDC Shiroli, Kolhapur"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
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
                  {submitting ? 'Registering...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Vendor Modal */}
      {settleModalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Settle Payout: {selectedVendor.name}
              </h3>
              <button onClick={() => setSettleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Charge Against Project *</label>
                <select
                  value={settleProjectId}
                  onChange={(e) => setSettleProjectId(e.target.value)}
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
                <label className="block text-slate-300 font-semibold mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Method</label>
                  <select
                    value={settleMethod}
                    onChange={(e: any) => setSettleMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ONLINE">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                {settleMethod === 'ONLINE' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Channel</label>
                    <select
                      value={settleOnlineMethod}
                      onChange={(e) => setSettleOnlineMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              {settleMethod === 'ONLINE' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UTR / Cheque Number</label>
                  <input
                    type="text"
                    value={settleRef}
                    onChange={(e) => setSettleRef(e.target.value)}
                    placeholder="CMS/2025/1928392"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Part payment for 20 tons TMT steel invoice"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50"
                >
                  {settling ? 'Settling...' : 'Disburse Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
