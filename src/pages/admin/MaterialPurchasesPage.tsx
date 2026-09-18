import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, IndianRupee, RotateCcw, CreditCard, Banknote, X } from 'lucide-react';
import api from '../../services/api.ts';
import { MaterialPurchase, Material, Vendor, Project, Site, UnifiedPayment } from '../../types.ts';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters.ts';
import { PaymentDrawer } from '../../components/payments/PaymentDrawer.tsx';

export function MaterialPurchasesPage() {
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Purchase Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [materialId, setMaterialId] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('50');
  const [unitPrice, setUnitPrice] = useState<string>('380');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('ONLINE');
  const [onlineMethod, setOnlineMethod] = useState<string>('NEFT');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Drawer
  const [selectedPayment, setSelectedPayment] = useState<UnifiedPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purRes, matRes, venRes, projRes, siteRes] = await Promise.all([
        api.get('/admin/material-purchases'),
        api.get('/admin/materials'),
        api.get('/admin/vendors'),
        api.get('/admin/projects'),
        api.get('/admin/sites'),
      ]);

      if (purRes.data.success) setPurchases(purRes.data.data);
      if (matRes.data.success) {
        setMaterials(matRes.data.data);
        if (matRes.data.data.length > 0) {
          setMaterialId(matRes.data.data[0]._id);
          setUnitPrice(String(matRes.data.data[0].unitPrice || 380));
        }
      }
      if (venRes.data.success) {
        setVendors(venRes.data.data);
        if (venRes.data.data.length > 0) setVendorId(venRes.data.data[0]._id);
      }
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0) setProjectId(projRes.data.data[0]._id);
      }
      if (siteRes.data.success) {
        setSites(siteRes.data.data);
        if (siteRes.data.data.length > 0) setSiteId(siteRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMaterialChange = (matId: string) => {
    setMaterialId(matId);
    const m = materials.find((item) => item._id === matId);
    if (m && m.unitPrice) {
      setUnitPrice(String(m.unitPrice));
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !vendorId || !projectId) return;
    setSubmitting(true);
    try {
      const res = await api.post('/admin/material-purchases', {
        materialId,
        vendorId,
        projectId,
        siteId: siteId || undefined,
        quantity: Number(quantity) || 1,
        unitPrice: Number(unitPrice) || 0,
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentMethod,
        onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      });

      if (res.data.success) {
        setModalOpen(false);
        setInvoiceNumber('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to record material procurement', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (item: any) => {
    const unified: UnifiedPayment = {
      id: item._id,
      sourceType: 'MATERIAL_PURCHASE',
      displayType: 'Material Procurement Bill',
      flow: 'OUTFLOW',
      date: item.purchaseDate,
      amount: item.totalCost,
      party: typeof item.vendorId === 'object' ? item.vendorId?.name : 'Vendor',
      partyRole: 'Building Material Supplier',
      projectName: typeof item.projectId === 'object' ? item.projectId?.projectName : 'Project',
      siteName: typeof item.siteId === 'object' ? item.siteId?.siteName : 'Main Site',
      paymentMethod: item.paymentMethod,
      onlineMethod: item.onlineMethod,
      reference: item.invoiceNumber || item.receiptNumber,
      receiptNumber: item.receiptNumber,
      status: item.status,
      description: `${item.quantity} units of ${typeof item.materialId === 'object' ? item.materialId?.name : 'Material'} @ ₹${item.unitPrice}`,
      raw: item,
    };
    setSelectedPayment(unified);
    setDrawerOpen(true);
  };

  const totalProcurement = purchases.filter((p) => p.status !== 'REVERSED').reduce((acc, p) => acc + p.totalCost, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Material Procurement Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier bills, challans, GST invoices, and automatic stock level increments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase">Total Procurement Value</span>
            <span className="text-sm font-mono font-bold text-amber-400">{formatCurrency(totalProcurement)}</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>New Procurement Bill</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier / Vendor</th>
                <th className="py-3 px-4">Material Details</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Bill Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading procurement records...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No material purchase records logged yet.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{p.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {typeof p.vendorId === 'object' ? p.vendorId?.name : 'Vendor'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">
                        {typeof p.materialId === 'object' ? p.materialId?.name : 'Material'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.quantity} {typeof p.materialId === 'object' ? p.materialId?.unit : 'units'} @ ₹{p.unitPrice}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {typeof p.projectId === 'object' ? p.projectId?.projectName : 'Project'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-amber-400">{p.paymentMethod}</span>
                      {p.onlineMethod && (
                        <span className="text-[10px] text-slate-400 font-mono block">({p.onlineMethod})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                      -{formatCurrency(p.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(p);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] font-bold"
                      >
                        Voucher
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReversalSuccess={loadData}
      />

      {/* Add Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Material Procurement</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Material *</label>
                <select
                  value={materialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {materials.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.category}) - ₹{m.unitPrice}/{m.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Supplier / Vendor *</label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.materialSupplied})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
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
                  <label className="block text-slate-300 font-semibold mb-1">Site / Plot</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    {sites.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity Purchased *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
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
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Total Purchase Bill:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {formatCurrency((Number(quantity) || 0) * (Number(unitPrice) || 0))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="ONLINE">Online Transfer</option>
                    <option value="CASH">Physical Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Invoice / Challan #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="GST/2025/8492"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
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
                  {submitting ? 'Recording...' : 'Save & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
