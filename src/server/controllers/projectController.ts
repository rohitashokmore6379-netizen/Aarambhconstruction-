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

// ----------------------------------------------------
// PROJECT BUDGET TRACKING & COST OVERRUNS (REAL-TIME)
// ----------------------------------------------------
export async function getProjectBudgetTracking(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { siteId } = req.query;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const queryFilter: any = { projectId: project._id };
    if (siteId && siteId !== 'ALL') {
      queryFilter.siteId = siteId;
    }

    // Pull from Expenses, MaterialPurchases, WorkerPayments, and VendorPayments in parallel
    const [materialPurchases, expenses, workerPayments, vendorPayments] = await Promise.all([
      MaterialPurchase.find({ ...queryFilter, status: { $ne: 'REVERSED' } })
        .populate('materialId', 'name category unit')
        .populate('vendorId', 'name companyName')
        .populate('siteId', 'siteName')
        .sort({ purchaseDate: -1 }),
      Expense.find({ ...queryFilter, status: 'PAID' })
        .populate('siteId', 'siteName')
        .sort({ date: -1 }),
      WorkerPayment.find({ ...queryFilter, status: 'PAID' })
        .populate('workerId', 'name skill')
        .populate('siteId', 'siteName')
        .sort({ paymentDate: -1 }),
      VendorPayment.find({ ...queryFilter, status: 'PAID' })
        .populate('vendorId', 'name companyName')
        .populate('siteId', 'siteName')
        .sort({ paymentDate: -1 }),
    ]);

    // 1. Calculate Planned Budget Target
    const plannedTotal =
      Number(project.budgetPlan?.totalPlannedBudget) ||
      Number(project.estimatedCost) ||
      Number(project.contractValue) ||
      100000;

    const contingencyPct = Number(project.budgetPlan?.contingencyPercentage) ?? 5;
    const alertThresholdPct = Number(project.budgetPlan?.alertThresholdPercentage) ?? 85;

    // 2. Aggregate Material Purchases
    let materialPurchasesCost = 0;
    let materialPaidAmount = 0;
    let materialPendingAmount = 0;
    const materialsByCategory: Record<string, { totalAmount: number; count: number; items: any[] }> = {};

    materialPurchases.forEach((mp: any) => {
      const cost = Number(mp.totalAmount) || Number(mp.quantity * mp.unitPrice) || 0;
      const paid = Number(mp.paidAmount) || 0;
      const pending = Number(mp.pendingAmount) || Math.max(0, cost - paid);

      materialPurchasesCost += cost;
      materialPaidAmount += paid;
      materialPendingAmount += pending;

      const cat = mp.materialId?.category || 'Other Materials';
      if (!materialsByCategory[cat]) {
        materialsByCategory[cat] = { totalAmount: 0, count: 0, items: [] };
      }
      materialsByCategory[cat].totalAmount += cost;
      materialsByCategory[cat].count += 1;
      materialsByCategory[cat].items.push({
        id: mp._id,
        materialName: mp.materialId?.name || 'Material',
        vendor: mp.vendorId?.companyName || mp.vendorId?.name || 'Supplier',
        siteName: mp.siteId?.siteName || 'Site',
        quantity: mp.quantity,
        unit: mp.unit,
        unitPrice: mp.unitPrice,
        totalAmount: cost,
        paidAmount: paid,
        purchaseDate: mp.purchaseDate,
        invoiceNumber: mp.invoiceNumber,
      });
    });

    // 3. Aggregate Direct Expenses
    let directExpensesCost = 0;
    const expensesByCategory: Record<string, { totalAmount: number; count: number; items: any[] }> = {
      EQUIPMENT: { totalAmount: 0, count: 0, items: [] },
      TRANSPORT: { totalAmount: 0, count: 0, items: [] },
      WORKER: { totalAmount: 0, count: 0, items: [] },
      MATERIAL: { totalAmount: 0, count: 0, items: [] },
      VENDOR: { totalAmount: 0, count: 0, items: [] },
      OTHER: { totalAmount: 0, count: 0, items: [] },
    };

    expenses.forEach((exp: any) => {
      const amount = Number(exp.amount) || 0;
      directExpensesCost += amount;

      const catKey = exp.category?.toUpperCase() || 'OTHER';
      if (!expensesByCategory[catKey]) {
        expensesByCategory[catKey] = { totalAmount: 0, count: 0, items: [] };
      }
      expensesByCategory[catKey].totalAmount += amount;
      expensesByCategory[catKey].count += 1;
      expensesByCategory[catKey].items.push({
        id: exp._id,
        category: exp.category,
        description: exp.description,
        amount,
        date: exp.date,
        siteName: exp.siteId?.siteName || 'Site',
        paymentMethod: exp.paymentMethod,
        receiptNumber: exp.receiptNumber,
      });
    });

    // 4. Aggregate Worker Wages & Vendor Payments
    const workerWagesCost = workerPayments.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const vendorPaymentsCost = vendorPayments.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

    // 5. Consolidated Category Actuals
    // - Materials: MaterialPurchases + direct MATERIAL expenses
    const totalMaterialsActual = materialPurchasesCost + (expensesByCategory['MATERIAL']?.totalAmount || 0);
    // - Labor: WorkerPayments + direct WORKER expenses
    const totalLaborActual = workerWagesCost + (expensesByCategory['WORKER']?.totalAmount || 0);
    // - Equipment: EQUIPMENT expenses
    const totalEquipmentActual = expensesByCategory['EQUIPMENT']?.totalAmount || 0;
    // - Transport: TRANSPORT expenses
    const totalTransportActual = expensesByCategory['TRANSPORT']?.totalAmount || 0;
    // - Subcontractors/Vendors: VendorPayments + direct VENDOR expenses
    const totalSubcontractActual = vendorPaymentsCost + (expensesByCategory['VENDOR']?.totalAmount || 0);
    // - Site Overheads & Permits: OTHER expenses
    const totalOverheadsActual = expensesByCategory['OTHER']?.totalAmount || 0;

    const totalActualExpenditures =
      totalMaterialsActual +
      totalLaborActual +
      totalEquipmentActual +
      totalTransportActual +
      totalSubcontractActual +
      totalOverheadsActual;

    // 6. Category Target Allocations (Planned vs Actual)
    // Check if customized targets exist
    const customTargetsMap = new Map<string, number>();
    if (project.budgetPlan?.categoryTargets && Array.isArray(project.budgetPlan.categoryTargets)) {
      project.budgetPlan.categoryTargets.forEach((t) => {
        customTargetsMap.set(t.category.toUpperCase(), Number(t.plannedAmount) || 0);
      });
    }

    // Default distribution proportions if not customized
    const defaultProportions: Record<string, number> = {
      MATERIALS: 0.48, // 48%
      LABOR: 0.26, // 26%
      EQUIPMENT: 0.10, // 10%
      TRANSPORT: 0.06, // 6%
      SUBCONTRACT: 0.06, // 6%
      OVERHEADS: 0.04, // 4%
    };

    const categoryDefinitions = [
      {
        key: 'MATERIALS',
        label: 'Materials Procurement',
        description: 'Cement, steel, sand, aggregate, bricks & raw stock',
        actual: totalMaterialsActual,
        itemsCount: materialPurchases.length + (expensesByCategory['MATERIAL']?.count || 0),
        color: '#3b82f6', // blue
      },
      {
        key: 'LABOR',
        label: 'Site Labor & Wages',
        description: 'Masons, helpers, daily wages & subcontractor labor',
        actual: totalLaborActual,
        itemsCount: workerPayments.length + (expensesByCategory['WORKER']?.count || 0),
        color: '#f59e0b', // amber
      },
      {
        key: 'EQUIPMENT',
        label: 'Machinery & Equipment Rental',
        description: 'JCB, concrete mixer hire, vibrators, scaffolding',
        actual: totalEquipmentActual,
        itemsCount: expensesByCategory['EQUIPMENT']?.count || 0,
        color: '#8b5cf6', // purple
      },
      {
        key: 'TRANSPORT',
        label: 'Logistics & Fuel',
        description: 'Material freight, transport tractor/trucks, diesel',
        actual: totalTransportActual,
        itemsCount: expensesByCategory['TRANSPORT']?.count || 0,
        color: '#10b981', // emerald
      },
      {
        key: 'SUBCONTRACT',
        label: 'Vendors & Subcontractors',
        description: 'Specialist fabrications, plumbing, electrical contracts',
        actual: totalSubcontractActual,
        itemsCount: vendorPayments.length + (expensesByCategory['VENDOR']?.count || 0),
        color: '#06b6d4', // cyan
      },
      {
        key: 'OVERHEADS',
        label: 'Site Overheads & Permits',
        description: 'Municipal fees, testing lab, tea/refreshments, utility',
        actual: totalOverheadsActual,
        itemsCount: expensesByCategory['OTHER']?.count || 0,
        color: '#ec4899', // pink
      },
    ];

    const categoryComparisons = categoryDefinitions.map((cat) => {
      const planned = customTargetsMap.has(cat.key)
        ? customTargetsMap.get(cat.key)!
        : Math.round(plannedTotal * (defaultProportions[cat.key] || 0.05));

      const variance = planned - cat.actual; // positive = budget remaining, negative = cost overrun
      const isOverrun = cat.actual > planned;
      const overrunAmount = isOverrun ? cat.actual - planned : 0;
      const percentUsed = planned > 0 ? (cat.actual / planned) * 100 : cat.actual > 0 ? 100 : 0;

      let status: 'SAFE' | 'WARNING' | 'OVERRUN' = 'SAFE';
      if (isOverrun) {
        status = 'OVERRUN';
      } else if (percentUsed >= alertThresholdPct) {
        status = 'WARNING';
      }

      return {
        ...cat,
        plannedAmount: planned,
        actualAmount: cat.actual,
        variance,
        isOverrun,
        overrunAmount,
        percentUsed: Math.round(percentUsed * 10) / 10,
        status,
      };
    });

    // 7. Overall Variance & Status
    const totalVariance = plannedTotal - totalActualExpenditures;
    const isTotalOverrun = totalActualExpenditures > plannedTotal;
    const totalOverrunAmount = isTotalOverrun ? totalActualExpenditures - plannedTotal : 0;
    const totalPercentUsed = plannedTotal > 0 ? (totalActualExpenditures / plannedTotal) * 100 : 0;

    let overallStatus: 'SAFE' | 'WARNING' | 'OVERRUN' = 'SAFE';
    if (isTotalOverrun) {
      overallStatus = 'OVERRUN';
    } else if (totalPercentUsed >= alertThresholdPct) {
      overallStatus = 'WARNING';
    }

    // 8. Generate Real-Time Cost Overrun Alerts
    const alerts: any[] = [];
    if (isTotalOverrun) {
      alerts.push({
        id: 'total-overrun',
        severity: 'CRITICAL',
        title: 'Total Project Cost Overrun Alert',
        message: `Project total expenditures of ₹${totalActualExpenditures.toLocaleString()} have exceeded the planned budget ceiling of ₹${plannedTotal.toLocaleString()} by ₹${totalOverrunAmount.toLocaleString()} (${Math.round(totalPercentUsed)}% spent).`,
        category: 'OVERALL',
        overrunAmount: totalOverrunAmount,
      });
    } else if (totalPercentUsed >= alertThresholdPct) {
      alerts.push({
        id: 'total-warning',
        severity: 'WARNING',
        title: 'Project Budget Approaching Ceiling',
        message: `Project has utilized ${Math.round(totalPercentUsed)}% of its planned budget limit. Remaining buffer: ₹${Math.max(0, totalVariance).toLocaleString()}.`,
        category: 'OVERALL',
        overrunAmount: 0,
      });
    }

    // Category specific alerts
    categoryComparisons.forEach((cat) => {
      if (cat.isOverrun) {
        alerts.push({
          id: `overrun-${cat.key.toLowerCase()}`,
          severity: 'CRITICAL',
          title: `${cat.label} Overrun Detected`,
          message: `${cat.label} expenditures of ₹${cat.actualAmount.toLocaleString()} exceeded the planned allocation of ₹${cat.plannedAmount.toLocaleString()} by ₹${cat.overrunAmount.toLocaleString()} (${cat.percentUsed}% consumed).`,
          category: cat.key,
          overrunAmount: cat.overrunAmount,
        });
      } else if (cat.percentUsed >= alertThresholdPct) {
        alerts.push({
          id: `warning-${cat.key.toLowerCase()}`,
          severity: 'WARNING',
          title: `${cat.label} Near Budget Limit`,
          message: `${cat.label} is at ${cat.percentUsed}% of planned limit. ₹${cat.variance.toLocaleString()} remaining before cost overrun.`,
          category: cat.key,
          overrunAmount: 0,
        });
      }
    });

    // 9. Monthly Expenditure Trajectory (Time-Series)
    // Group all expenditures by month (YYYY-MM)
    const monthlyMap: Record<string, { materials: number; expenses: number; labor: number; total: number }> = {};

    materialPurchases.forEach((mp: any) => {
      const d = mp.purchaseDate ? new Date(mp.purchaseDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { materials: 0, expenses: 0, labor: 0, total: 0 };
      const amt = Number(mp.totalAmount) || Number(mp.quantity * mp.unitPrice) || 0;
      monthlyMap[monthKey].materials += amt;
      monthlyMap[monthKey].total += amt;
    });

    expenses.forEach((exp: any) => {
      const d = exp.date ? new Date(exp.date) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { materials: 0, expenses: 0, labor: 0, total: 0 };
      const amt = Number(exp.amount) || 0;
      monthlyMap[monthKey].expenses += amt;
      monthlyMap[monthKey].total += amt;
    });

    workerPayments.forEach((w: any) => {
      const d = w.paymentDate ? new Date(w.paymentDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { materials: 0, expenses: 0, labor: 0, total: 0 };
      const amt = Number(w.amount) || 0;
      monthlyMap[monthKey].labor += amt;
      monthlyMap[monthKey].total += amt;
    });

    const sortedMonths = Object.keys(monthlyMap).sort();
    let cumulative = 0;
    const monthlyTrend = sortedMonths.map((m, idx) => {
      const item = monthlyMap[m];
      cumulative += item.total;
      // Pro-rata planned trajectory target benchmark
      const plannedTrajectory = Math.round((plannedTotal / Math.max(sortedMonths.length, 6)) * (idx + 1));
      return {
        month: m,
        materials: item.materials,
        expenses: item.expenses,
        labor: item.labor,
        monthlyTotal: item.total,
        cumulativeActual: cumulative,
        plannedTrajectory: Math.min(plannedTrajectory, plannedTotal),
      };
    });

    // 10. Material Category Breakdown List
    const materialsBreakdownList = Object.keys(materialsByCategory).map((catName) => {
      const catData = materialsByCategory[catName];
      const shareOfMaterials = materialPurchasesCost > 0 ? (catData.totalAmount / materialPurchasesCost) * 100 : 0;
      return {
        categoryName: catName,
        totalAmount: catData.totalAmount,
        count: catData.count,
        sharePercentage: Math.round(shareOfMaterials * 10) / 10,
        items: catData.items.slice(0, 10),
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    return res.json({
      success: true,
      data: {
        project: {
          id: project._id,
          projectName: project.projectName,
          projectCode: project.projectCode,
          contractValue: project.contractValue,
          estimatedCost: project.estimatedCost,
          budgetPlan: project.budgetPlan,
        },
        summary: {
          totalPlannedBudget: plannedTotal,
          totalActualExpenditures,
          variance: totalVariance,
          variancePercentage: Math.round(((totalVariance) / plannedTotal) * 100),
          percentUsed: Math.round(totalPercentUsed * 10) / 10,
          isOverrun: isTotalOverrun,
          overrunAmount: totalOverrunAmount,
          status: overallStatus,
          contingencyPercentage: contingencyPct,
          alertThresholdPercentage: alertThresholdPct,
          materialPurchasesTotal: materialPurchasesCost,
          materialPaidAmount,
          materialPendingAmount,
          directExpensesTotal: directExpensesCost,
          workerWagesTotal: workerWagesCost,
          vendorPaymentsTotal: vendorPaymentsCost,
        },
        categoryComparisons,
        materialsBreakdown: materialsBreakdownList,
        monthlyTrend,
        alerts,
        counts: {
          materialPurchasesCount: materialPurchases.length,
          expensesCount: expenses.length,
          workerPaymentsCount: workerPayments.length,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProjectBudgetPlan(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { totalPlannedBudget, categoryTargets, contingencyPercentage, alertThresholdPercentage } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!project.budgetPlan) {
      project.budgetPlan = {};
    }

    if (totalPlannedBudget !== undefined) {
      project.budgetPlan.totalPlannedBudget = Number(totalPlannedBudget);
      project.estimatedCost = Number(totalPlannedBudget);
    }
    if (contingencyPercentage !== undefined) {
      project.budgetPlan.contingencyPercentage = Number(contingencyPercentage);
    }
    if (alertThresholdPercentage !== undefined) {
      project.budgetPlan.alertThresholdPercentage = Number(alertThresholdPercentage);
    }
    if (Array.isArray(categoryTargets)) {
      project.budgetPlan.categoryTargets = categoryTargets.map((t: any) => ({
        category: String(t.category).toUpperCase(),
        plannedAmount: Number(t.plannedAmount) || 0,
        notes: t.notes || '',
      }));
    }

    await project.save();

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'BUDGET_PLAN_UPDATED',
      entityType: 'Project',
      entityId: project._id.toString(),
      projectId: project._id.toString(),
      description: `Updated planned budget targets for project "${project.projectName}" (Ceiling: ₹${project.budgetPlan.totalPlannedBudget})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: project.budgetPlan,
      message: 'Project budget plan and category allocations updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
