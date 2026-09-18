import { Response } from 'express';
import { ClientPayment, WorkerPayment, MaterialPurchase, VendorPayment, Expense } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getAllUnifiedPayments(req: AuthRequest, res: Response) {
  try {
    const {
      projectId,
      siteId,
      paymentType,
      paymentMethod,
      status,
      fromDate,
      toDate,
      search,
    } = req.query;

    const [clientReceipts, workerPays, materialPays, vendorPays, directExpenses] = await Promise.all([
      ClientPayment.find()
        .populate('projectId', 'projectName projectCode')
        .populate('siteId', 'siteName')
        .sort({ paymentDate: -1 }),
      WorkerPayment.find()
        .populate('projectId', 'projectName projectCode')
        .populate('siteId', 'siteName')
        .populate('workerId', 'name workerCode skill')
        .sort({ paymentDate: -1 }),
      MaterialPurchase.find()
        .populate('projectId', 'projectName projectCode')
        .populate('siteId', 'siteName')
        .populate('materialId', 'name category unit')
        .populate('vendorId', 'name companyName')
        .sort({ purchaseDate: -1 }),
      VendorPayment.find()
        .populate('projectId', 'projectName projectCode')
        .populate('siteId', 'siteName')
        .populate('vendorId', 'name companyName')
        .sort({ paymentDate: -1 }),
      Expense.find()
        .populate('projectId', 'projectName projectCode')
        .populate('siteId', 'siteName')
        .sort({ date: -1 }),
    ]);

    let unified: any[] = [];

    // 1. Client Receipts (Site Owner Payments received)
    clientReceipts.forEach((c) => {
      unified.push({
        id: c._id.toString(),
        sourceType: 'CLIENT_RECEIPT',
        displayType: 'Site Owner Receipt',
        flow: 'INFLOW',
        date: c.paymentDate,
        amount: c.amount,
        party: c.ownerName,
        partyRole: 'Site Owner / Client',
        projectId: (c.projectId as any)?._id?.toString() || c.projectId?.toString(),
        projectName: (c.projectId as any)?.projectName || 'Project',
        projectCode: (c.projectId as any)?.projectCode || '',
        siteId: (c.siteId as any)?._id?.toString() || c.siteId?.toString(),
        siteName: (c.siteId as any)?.siteName || 'Site',
        paymentMethod: c.paymentMethod,
        onlineMethod: c.onlineMethod,
        reference: c.transactionReference || c.receiptNumber,
        receiptNumber: c.receiptNumber,
        status: c.status,
        description: c.description || 'Milestone payment received from site owner',
        raw: c,
      });
    });

    // 2. Worker Payments
    workerPays.forEach((w) => {
      unified.push({
        id: w._id.toString(),
        sourceType: 'WORKER_PAYMENT',
        displayType: 'Worker Wage Payout',
        flow: 'OUTFLOW',
        date: w.paymentDate,
        amount: w.amount,
        party: (w.workerId as any)?.name || 'Worker',
        partyRole: (w.workerId as any)?.skill || 'Labor',
        projectId: (w.projectId as any)?._id?.toString() || w.projectId?.toString(),
        projectName: (w.projectId as any)?.projectName || 'Project',
        projectCode: (w.projectId as any)?.projectCode || '',
        siteId: (w.siteId as any)?._id?.toString() || w.siteId?.toString(),
        siteName: (w.siteId as any)?.siteName || 'Site',
        paymentMethod: w.paymentMethod,
        onlineMethod: w.onlineMethod,
        reference: w.transactionReference || `WAGE-${w.daysWorked || 1}d`,
        receiptNumber: `WPAY-${w._id.toString().slice(-6).toUpperCase()}`,
        status: w.status,
        description: w.notes || `Labor wage for ${w.daysWorked || 1} day(s)`,
        raw: w,
      });
    });

    // 3. Material Purchases
    materialPays.forEach((m) => {
      unified.push({
        id: m._id.toString(),
        sourceType: 'MATERIAL_PAYMENT',
        displayType: 'Material Procurement',
        flow: 'OUTFLOW',
        date: m.purchaseDate,
        amount: m.paidAmount || m.totalAmount,
        party: (m.vendorId as any)?.companyName || (m.vendorId as any)?.name || 'Supplier',
        partyRole: (m.materialId as any)?.name || 'Materials',
        projectId: (m.projectId as any)?._id?.toString() || m.projectId?.toString(),
        projectName: (m.projectId as any)?.projectName || 'Project',
        projectCode: (m.projectId as any)?.projectCode || '',
        siteId: (m.siteId as any)?._id?.toString() || m.siteId?.toString(),
        siteName: (m.siteId as any)?.siteName || 'Site',
        paymentMethod: m.paymentMethod,
        onlineMethod: m.onlineMethod,
        reference: m.invoiceNumber,
        receiptNumber: m.invoiceNumber,
        status: m.status === 'REVERSED' ? 'REVERSED' : 'PAID',
        description: `${m.quantity} ${m.unit} of ${(m.materialId as any)?.name || 'Materials'}`,
        raw: m,
      });
    });

    // 4. Vendor Payments
    vendorPays.forEach((v) => {
      unified.push({
        id: v._id.toString(),
        sourceType: 'VENDOR_PAYMENT',
        displayType: 'Vendor Settlement',
        flow: 'OUTFLOW',
        date: v.paymentDate,
        amount: v.amount,
        party: (v.vendorId as any)?.companyName || (v.vendorId as any)?.name || 'Vendor',
        partyRole: 'Vendor / Subcontractor',
        projectId: (v.projectId as any)?._id?.toString() || v.projectId?.toString(),
        projectName: (v.projectId as any)?.projectName || 'Project',
        projectCode: (v.projectId as any)?.projectCode || '',
        siteId: (v.siteId as any)?._id?.toString() || v.siteId?.toString(),
        siteName: (v.siteId as any)?.siteName || 'Site',
        paymentMethod: v.paymentMethod,
        onlineMethod: v.onlineMethod,
        reference: v.transactionReference || v.receiptNumber,
        receiptNumber: v.receiptNumber,
        status: v.status,
        description: v.notes || 'Direct vendor payment settlement',
        raw: v,
      });
    });

    // 5. Categorized Expenses
    directExpenses.forEach((e) => {
      unified.push({
        id: e._id.toString(),
        sourceType: 'EXPENSE',
        displayType: `${e.category} Overhead`,
        flow: 'OUTFLOW',
        date: e.date,
        amount: e.amount,
        party: e.category,
        partyRole: 'Site Operations',
        projectId: (e.projectId as any)?._id?.toString() || e.projectId?.toString(),
        projectName: (e.projectId as any)?.projectName || 'Project',
        projectCode: (e.projectId as any)?.projectCode || '',
        siteId: (e.siteId as any)?._id?.toString() || e.siteId?.toString(),
        siteName: (e.siteId as any)?.siteName || 'Site',
        paymentMethod: e.paymentMethod,
        onlineMethod: e.onlineMethod,
        reference: e.transactionReference || `EXP-${e._id.toString().slice(-6).toUpperCase()}`,
        receiptNumber: `EXP-${e._id.toString().slice(-6).toUpperCase()}`,
        status: e.status,
        description: e.description,
        raw: e,
      });
    });

    // Sort descending by date
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filtering
    if (projectId && projectId !== 'ALL') {
      unified = unified.filter((t) => t.projectId === projectId);
    }
    if (siteId && siteId !== 'ALL') {
      unified = unified.filter((t) => t.siteId === siteId);
    }
    if (paymentType && paymentType !== 'ALL') {
      unified = unified.filter((t) => t.sourceType === paymentType);
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      unified = unified.filter((t) => t.paymentMethod === paymentMethod);
    }
    if (status && status !== 'ALL') {
      unified = unified.filter((t) => t.status === status);
    }
    if (fromDate) {
      const from = new Date(fromDate as string);
      unified = unified.filter((t) => new Date(t.date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate as string);
      unified = unified.filter((t) => new Date(t.date) <= to);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      unified = unified.filter(
        (t) =>
          t.party.toLowerCase().includes(q) ||
          t.projectName.toLowerCase().includes(q) ||
          t.siteName.toLowerCase().includes(q) ||
          t.receiptNumber?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      data: unified,
      count: unified.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
