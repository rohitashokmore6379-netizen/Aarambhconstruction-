import { Response } from 'express';
import { Project, Site, ClientPayment, WorkerPayment, MaterialPurchase, VendorPayment, Expense } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';
import { createAuditLog } from '../services/auditService.ts';

export async function getProjects(req: AuthRequest, res: Response) {
  try {
    const { search, status } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { projectName: regex },
        { projectCode: regex },
        { location: regex },
        { 'client.name': regex },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    // Attach calculated financial overview to each project
    const projectsWithFinancials = await Promise.all(
      projects.map(async (p) => {
        try {
          const fin = await calculateProjectFinancials(p._id.toString());
          return {
            ...p.toObject(),
            financials: fin,
          };
        } catch (e) {
          return {
            ...p.toObject(),
            financials: null,
          };
        }
      })
    );

    return res.json({
      success: true,
      data: projectsWithFinancials,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProjectById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const sites = await Site.find({ projectId: project._id });
    const financials = await calculateProjectFinancials(project._id.toString());

    return res.json({
      success: true,
      data: {
        ...project.toObject(),
        sites,
        financials,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    const rawName = body.projectName || body.name || '';
    const trimmedName = String(rawName).trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Project Name is required.',
      });
    }

    // Auto-generate project code if missing or empty
    let code = (body.projectCode || body.code || '').trim().toUpperCase();
    if (!code) {
      const count = await Project.countDocuments();
      code = `PRJ-${String(count + 1).padStart(3, '0')}`;
      const existingWithCode = await Project.findOne({ projectCode: code });
      if (existingWithCode) {
        code = `PRJ-${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
      }
    } else {
      const existing = await Project.findOne({ projectCode: code });
      if (existing) {
        code = `${code}-${Date.now().toString().slice(-4)}`;
      }
    }

    // Resolve client structure safely
    let clientObj: any = { name: 'Direct Client', phone: '', email: '', address: '' };
    if (typeof body.client === 'object' && body.client !== null) {
      clientObj = {
        name: String(body.client.name || body.clientName || 'Direct Client').trim(),
        phone: String(body.client.phone || body.clientPhone || '').trim(),
        email: String(body.client.email || '').trim(),
        address: String(body.client.address || '').trim(),
      };
    } else if (typeof body.client === 'string' && body.client.trim()) {
      clientObj.name = body.client.trim();
      if (body.clientPhone) clientObj.phone = String(body.clientPhone).trim();
    } else if (body.clientName && String(body.clientName).trim()) {
      clientObj.name = String(body.clientName).trim();
      if (body.clientPhone) clientObj.phone = String(body.clientPhone).trim();
    }

    const loc = String(body.location || body.address || 'Kolhapur, Maharashtra').trim();
    const contractVal = Number(body.contractValue) || 0;
    const estimatedVal = Number(body.estimatedCost) || contractVal || 0;

    const project = await Project.create({
      projectCode: code,
      projectName: trimmedName,
      description: body.description || '',
      projectType: body.projectType || 'Residential',
      location: loc,
      client: clientObj,
      contractValue: contractVal,
      estimatedCost: estimatedVal,
      status: body.status || 'IN_PROGRESS',
      progressPercentage: Number(body.progressPercentage) || 0,
      isPublic: body.isPublic ?? true,
      publicStatus: body.publicStatus || 'Planning & Site Mobilization',
      publicImages: Array.isArray(body.publicImages) ? body.publicImages : [],
      privateNotes: body.privateNotes || '',
      createdBy: req.user?.id,
    });

    // Automatically create primary site for this project
    await Site.create({
      projectId: project._id,
      siteName: `${project.projectName} - Main Site`,
      location: project.location,
      siteOwner: project.client.name,
      ownerContact: project.client.phone,
      totalCost: project.contractValue,
      status: 'ACTIVE',
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: project._id.toString(),
      projectId: project._id.toString(),
      description: `Created new project "${project.projectName}" (${project.projectCode}) with contract value ₹${project.contractValue}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully with default primary site.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    Object.assign(project, req.body);
    if (req.body.contractValue !== undefined) {
      project.contractValue = Number(req.body.contractValue);
    }
    if (req.body.progressPercentage !== undefined) {
      project.progressPercentage = Number(req.body.progressPercentage);
    }

    await project.save();

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project._id.toString(),
      projectId: project._id.toString(),
      description: `Updated project "${project.projectName}" status to ${project.status}, progress to ${project.progressPercentage}%`,
      ipAddress: req.ip,
    });

    const financials = await calculateProjectFinancials(project._id.toString());

    return res.json({
      success: true,
      data: {
        ...project.toObject(),
        financials,
      },
      message: 'Project updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProjectFinancialSummary(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const financials = await calculateProjectFinancials(id);
    return res.json({
      success: true,
      data: financials,
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

export async function getProjectPayments(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { siteId, paymentType, paymentMethod, status, search, fromDate, toDate } = req.query;

    const projectId = id;

    // Retrieve and normalize all 5 financial flows for this project:
    const [clientReceipts, workerPays, materialPays, vendorPays, directExpenses] = await Promise.all([
      ClientPayment.find({ projectId }).populate('siteId', 'siteName').sort({ paymentDate: -1 }),
      WorkerPayment.find({ projectId }).populate('siteId', 'siteName').populate('workerId', 'name workerCode skill').sort({ paymentDate: -1 }),
      MaterialPurchase.find({ projectId }).populate('siteId', 'siteName').populate('materialId', 'name category').populate('vendorId', 'name companyName').sort({ purchaseDate: -1 }),
      VendorPayment.find({ projectId }).populate('siteId', 'siteName').populate('vendorId', 'name companyName').sort({ paymentDate: -1 }),
      Expense.find({ projectId }).populate('siteId', 'siteName').sort({ date: -1 }),
    ]);

    let unified: any[] = [];

    // Client receipts (Money IN)
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
        siteName: (c.siteId as any)?.siteName || 'Site',
        siteId: (c.siteId as any)?._id?.toString() || c.siteId?.toString(),
        paymentMethod: c.paymentMethod,
        onlineMethod: c.onlineMethod,
        reference: c.transactionReference || c.receiptNumber,
        receiptNumber: c.receiptNumber,
        status: c.status,
        description: c.description || 'Milestone payment received',
        raw: c,
      });
    });

    // Worker payments (Money OUT)
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
        siteName: (w.siteId as any)?.siteName || 'Site',
        siteId: (w.siteId as any)?._id?.toString() || w.siteId?.toString(),
        paymentMethod: w.paymentMethod,
        onlineMethod: w.onlineMethod,
        reference: w.transactionReference || `WAGE-${w.daysWorked || 1}d`,
        receiptNumber: `WPAY-${w._id.toString().slice(-6).toUpperCase()}`,
        status: w.status,
        description: w.notes || `Labor wage for ${w.daysWorked || 1} day(s)`,
        raw: w,
      });
    });

    // Material purchases (Money OUT)
    materialPays.forEach((m) => {
      unified.push({
        id: m._id.toString(),
        sourceType: 'MATERIAL_PAYMENT',
        displayType: 'Material Procurement',
        flow: 'OUTFLOW',
        date: m.purchaseDate,
        amount: m.paidAmount || m.totalAmount,
        party: (m.vendorId as any)?.name || 'Supplier',
        partyRole: (m.materialId as any)?.name || 'Materials',
        siteName: (m.siteId as any)?.siteName || 'Site',
        siteId: (m.siteId as any)?._id?.toString() || m.siteId?.toString(),
        paymentMethod: m.paymentMethod,
        onlineMethod: m.onlineMethod,
        reference: m.invoiceNumber,
        receiptNumber: m.invoiceNumber,
        status: m.status === 'REVERSED' ? 'REVERSED' : 'PAID',
        description: `${m.quantity} ${m.unit} ${(m.materialId as any)?.name || ''}`,
        raw: m,
      });
    });

    // Vendor payments (Money OUT)
    vendorPays.forEach((v) => {
      unified.push({
        id: v._id.toString(),
        sourceType: 'VENDOR_PAYMENT',
        displayType: 'Vendor Settlement',
        flow: 'OUTFLOW',
        date: v.paymentDate,
        amount: v.amount,
        party: (v.vendorId as any)?.companyName || (v.vendorId as any)?.name || 'Vendor',
        partyRole: 'Vendor / Contractor',
        siteName: (v.siteId as any)?.siteName || 'Site',
        siteId: (v.siteId as any)?._id?.toString() || v.siteId?.toString(),
        paymentMethod: v.paymentMethod,
        onlineMethod: v.onlineMethod,
        reference: v.transactionReference || v.receiptNumber,
        receiptNumber: v.receiptNumber,
        status: v.status,
        description: v.notes || 'Vendor account settlement',
        raw: v,
      });
    });

    // Expenses (Money OUT)
    directExpenses.forEach((e) => {
      unified.push({
        id: e._id.toString(),
        sourceType: 'EXPENSE',
        displayType: `${e.category} Overhead`,
        flow: 'OUTFLOW',
        date: e.date,
        amount: e.amount,
        party: e.category,
        partyRole: 'Operational Expense',
        siteName: (e.siteId as any)?.siteName || 'Site',
        siteId: (e.siteId as any)?._id?.toString() || e.siteId?.toString(),
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

    // Apply filters
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
          t.receiptNumber?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.siteName?.toLowerCase().includes(q)
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
