import { Response } from 'express';
import { Worker, WorkType, WorkLog, WorkerPayment, Project, Site } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { createAuditLog } from '../services/auditService.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';

// ---------------- WORKERS ----------------
export async function getWorkers(req: AuthRequest, res: Response) {
  try {
    const { status, skill, search } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (skill && skill !== 'ALL') filter.skill = skill;
    if (search && typeof search === 'string') {
      const r = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: r }, { workerCode: r }, { phone: r }];
    }

    const workers = await Worker.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: workers });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createWorker(req: AuthRequest, res: Response) {
  try {
    const { name, phone, address, role, skill, dailyWageRate, joiningDate, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Worker Name and Phone are required.' });
    }

    const count = await Worker.countDocuments();
    const workerCode = `WRK-${100 + count + 1}`;

    const worker = await Worker.create({
      workerCode,
      name: name.trim(),
      phone: phone.trim(),
      address,
      role: role || 'Construction Worker',
      skill: skill || 'MASON',
      dailyWageRate: Number(dailyWageRate) || 600,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'ACTIVE',
      notes,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORKER_CREATED',
      entityType: 'Worker',
      entityId: worker._id.toString(),
      description: `Enrolled new worker "${worker.name}" (${worker.workerCode}, ${worker.skill}) at ₹${worker.dailyWageRate}/day`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: worker, message: 'Worker registered successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateWorker(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const worker = await Worker.findByIdAndUpdate(id, req.body, { new: true });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    return res.json({ success: true, data: worker, message: 'Worker details updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------- WORK TYPES ----------------
export async function getWorkTypes(req: AuthRequest, res: Response) {
  try {
    const types = await WorkType.find().sort({ name: 1 });
    return res.json({ success: true, data: types });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createWorkType(req: AuthRequest, res: Response) {
  try {
    const { name, code, description, standardRate, unit } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and Code are required.' });
    }

    const wt = await WorkType.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description,
      standardRate: Number(standardRate) || 700,
      unit: unit || 'DAYS',
    });

    return res.status(201).json({ success: true, data: wt });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------- WORK LOGS ----------------
export async function getWorkLogs(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, workerId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (workerId) filter.workerId = workerId;

    const logs = await WorkLog.find(filter)
      .populate('workerId', 'name workerCode skill phone')
      .populate('workTypeId', 'name code standardRate unit')
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .sort({ workDate: -1 });

    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createWorkLog(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, workerId, workTypeId, workDate, daysWorked, dailyRate, notes } = req.body;

    const days = Number(daysWorked);
    const rate = Number(dailyRate);
    if (!days || days <= 0 || rate < 0) {
      return res.status(400).json({ success: false, message: 'Days worked must be > 0 and rate >= 0' });
    }

    const amount = Math.round(days * rate);

    const log = await WorkLog.create({
      projectId,
      siteId,
      workerId,
      workTypeId,
      workDate: workDate ? new Date(workDate) : new Date(),
      daysWorked: days,
      dailyRate: rate,
      amount,
      notes,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      data: log,
      message: `Work log logged: ${days} days @ ₹${rate} = ₹${amount}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------- WORKER PAYMENTS ----------------
export async function getWorkerPayments(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, workerId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (workerId) filter.workerId = workerId;
    if (status && status !== 'ALL') filter.status = status;

    const payments = await WorkerPayment.find(filter)
      .populate('workerId', 'name workerCode skill phone')
      .populate('workTypeId', 'name code')
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });

    return res.json({ success: true, data: payments });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createWorkerPayment(req: AuthRequest, res: Response) {
  try {
    const {
      projectId,
      siteId,
      workerId,
      workTypeId,
      workDate,
      daysWorked,
      dailyRate,
      amount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      paymentDate,
      notes,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Wage amount must be greater than zero.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const payment = await WorkerPayment.create({
      projectId,
      siteId,
      workerId,
      workTypeId,
      workDate: workDate ? new Date(workDate) : undefined,
      daysWorked: Number(daysWorked) || 1,
      dailyRate: Number(dailyRate) || worker.dailyWageRate,
      amount: numAmount,
      paymentMethod: paymentMethod || 'CASH',
      onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      transactionReference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      status: 'PAID',
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORKER_PAYMENT_CREATED',
      entityType: 'WorkerPayment',
      entityId: payment._id.toString(),
      projectId,
      description: `Disbursed wage payment of ₹${numAmount.toLocaleString('en-IN')} to ${worker.name} (${paymentMethod})`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(projectId);

    return res.status(201).json({
      success: true,
      data: payment,
      financials: updatedFinancials,
      message: `Wage payment of ₹${numAmount.toLocaleString('en-IN')} recorded for ${worker.name}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reverseWorkerPayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reversal reason is required.' });
    }

    const payment = await WorkerPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Worker payment not found.' });
    }

    payment.status = 'REVERSED';
    payment.reversedBy = req.user?.id as any;
    payment.reversedAt = new Date();
    payment.reversalReason = reason;
    await payment.save();

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORKER_PAYMENT_REVERSED',
      entityType: 'WorkerPayment',
      entityId: payment._id.toString(),
      projectId: payment.projectId.toString(),
      description: `Reversed worker wage payment of ₹${payment.amount}. Reason: ${reason}`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(payment.projectId.toString());

    return res.json({
      success: true,
      data: payment,
      financials: updatedFinancials,
      message: 'Worker payment successfully reversed.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
