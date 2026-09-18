import { Response } from 'express';
import { Expense } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { createAuditLog } from '../services/auditService.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';
import { cleanObjectId } from '../utils/sanitize.ts';

export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, category, status } = req.query;
    const filter: any = {};
    const pId = cleanObjectId(projectId);
    const sId = cleanObjectId(siteId);
    if (pId) filter.projectId = pId;
    if (sId) filter.siteId = sId;
    if (category && category !== 'ALL') filter.category = category;
    if (status && status !== 'ALL') filter.status = status;

    const expenses = await Expense.find(filter)
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    return res.json({ success: true, data: expenses });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createExpense(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    const {
      category,
      description,
      amount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      date,
      attachment,
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be greater than zero.' });
    }

    const desc = String(description || body.notes || category || 'Expense').trim();
    if (!desc) {
      return res.status(400).json({
        success: false,
        message: 'Expense description is required.',
      });
    }

    const pId = cleanObjectId(body.projectId);
    const sId = cleanObjectId(body.siteId);

    const expense = await Expense.create({
      projectId: pId,
      siteId: sId,
      category: category || 'OTHER',
      description: desc,
      amount: numAmount,
      paymentMethod: paymentMethod || 'CASH',
      onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      transactionReference: transactionReference || '',
      date: date ? new Date(date) : new Date(),
      attachment: attachment || '',
      status: 'PAID',
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      entityId: expense._id.toString(),
      projectId: pId,
      description: `Incurred ${expense.category} expense of ₹${numAmount.toLocaleString('en-IN')}: "${desc}"`,
      ipAddress: req.ip,
    });

    const updatedFinancials = pId ? await calculateProjectFinancials(pId) : null;

    return res.status(201).json({
      success: true,
      data: expense,
      financials: updatedFinancials,
      message: `Expense of ₹${numAmount.toLocaleString('en-IN')} logged.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reverseExpense(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reversal reason is required.' });
    }

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found.' });

    if (expense.status === 'REVERSED') {
      return res.status(400).json({ success: false, message: 'Expense is already reversed.' });
    }

    expense.status = 'REVERSED';
    expense.reversedBy = req.user?.id as any;
    expense.reversedAt = new Date();
    expense.reversalReason = reason;
    await expense.save();

    const pIdStr = expense.projectId ? expense.projectId.toString() : undefined;

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'EXPENSE_REVERSED',
      entityType: 'Expense',
      entityId: expense._id.toString(),
      projectId: pIdStr,
      description: `Reversed ${expense.category} expense of ₹${expense.amount}. Reason: ${reason}`,
      ipAddress: req.ip,
    });

    const updatedFinancials = pIdStr ? await calculateProjectFinancials(pIdStr) : null;

    return res.json({
      success: true,
      data: expense,
      financials: updatedFinancials,
      message: 'Expense reversed.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
