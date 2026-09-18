import { Response } from 'express';
import { Expense } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { createAuditLog } from '../services/auditService.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';

export async function getExpenses(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, category, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
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
    const {
      projectId,
      siteId,
      category,
      description,
      amount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      date,
      attachment,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount must be greater than zero.' });
    }

    if (!projectId || !siteId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Project, Site, Category, and Description are required.',
      });
    }

    const expense = await Expense.create({
      projectId,
      siteId,
      category,
      description: description.trim(),
      amount: numAmount,
      paymentMethod: paymentMethod || 'CASH',
      onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      transactionReference,
      date: date ? new Date(date) : new Date(),
      attachment,
      status: 'PAID',
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      entityId: expense._id.toString(),
      projectId,
      description: `Incurred ${category} expense of ₹${numAmount.toLocaleString('en-IN')}: "${description}"`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(projectId);

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

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'EXPENSE_REVERSED',
      entityType: 'Expense',
      entityId: expense._id.toString(),
      projectId: expense.projectId.toString(),
      description: `Reversed ${expense.category} expense of ₹${expense.amount}. Reason: ${reason}`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(expense.projectId.toString());

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
