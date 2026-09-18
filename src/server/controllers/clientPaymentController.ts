import { Response } from 'express';
import { ClientPayment, Project, Site, CompanySettings } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { calculateProjectFinancials, calculateSiteFinancials } from '../services/financialService.ts';
import { createAuditLog, createNotification } from '../services/auditService.ts';
import { cleanObjectId } from '../utils/sanitize.ts';

export async function getClientPayments(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, status } = req.query;
    const filter: any = {};
    const pId = cleanObjectId(projectId);
    const sId = cleanObjectId(siteId);
    if (pId) filter.projectId = pId;
    if (sId) filter.siteId = sId;
    if (status && status !== 'ALL') filter.status = status;

    const payments = await ClientPayment.find(filter)
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('createdBy', 'name')
      .populate('reversedBy', 'name')
      .sort({ paymentDate: -1 });

    return res.json({
      success: true,
      data: payments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function receiveClientPayment(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    const {
      paymentDate,
      amount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      receiptNumber,
      description,
      attachment,
      allowOverpayment,
    } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.',
      });
    }

    let pId = cleanObjectId(body.projectId);
    let project = null;
    if (pId) {
      project = await Project.findById(pId);
    }

    if (!project) {
      project = await Project.findOne();
      if (!project) {
        project = await Project.create({
          projectCode: 'PRJ-001',
          projectName: 'Main Project',
          location: 'Kolhapur',
          client: { name: body.ownerName || 'Direct Client' },
          contractValue: numAmount,
          createdBy: req.user?.id,
        });
      }
      pId = project._id.toString();
    }

    let sId = cleanObjectId(body.siteId);
    let site = null;
    if (sId) {
      site = await Site.findById(sId);
    }
    if (!site) {
      site = await Site.findOne({ projectId: project._id });
      if (site) {
        sId = site._id.toString();
      }
    }

    const resolvedOwner = String(body.ownerName || project.client?.name || 'Site Owner').trim();

    // Check current financial position
    const currentFin = await calculateProjectFinancials(pId);
    const newTotalReceived = currentFin.totalReceived + numAmount;
    const totalCost = currentFin.totalCost;

    let isOverpayment = false;
    let overpaymentAmt = 0;

    if (totalCost > 0 && newTotalReceived > totalCost) {
      isOverpayment = true;
      overpaymentAmt = newTotalReceived - totalCost;

      // If overpayment not explicitly confirmed by Admin, respond with confirmation requirement
      if (!allowOverpayment) {
        return res.status(409).json({
          success: false,
          requiresOverpaymentConfirmation: true,
          overpaymentAmount: overpaymentAmt,
          currentReceived: currentFin.totalReceived,
          totalCost: totalCost,
          attemptedAmount: numAmount,
          message: `Payment of ₹${numAmount.toLocaleString('en-IN')} exceeds the project cost of ₹${totalCost.toLocaleString('en-IN')}. Do you want to record this as an overpayment?`,
        });
      }
    }

    // Generate receipt number if not provided
    let finalReceiptNumber = receiptNumber?.trim();
    if (!finalReceiptNumber) {
      const settings = await CompanySettings.findOne();
      const prefix = settings?.receiptPrefix || 'AR-REC-';
      const count = await ClientPayment.countDocuments();
      finalReceiptNumber = `${prefix}${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const payment = await ClientPayment.create({
      projectId: project._id,
      siteId: site ? site._id : undefined,
      ownerName: resolvedOwner,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      amount: numAmount,
      paymentMethod: paymentMethod || 'ONLINE',
      onlineMethod: (paymentMethod === 'ONLINE' || !paymentMethod) ? (onlineMethod || 'UPI') : undefined,
      transactionReference: transactionReference || '',
      receiptNumber: finalReceiptNumber,
      description: description || '',
      attachment: attachment || '',
      status: 'PAID',
      overpaymentAmount: overpaymentAmt,
      createdBy: req.user?.id,
    });

    // Recalculate financials immediately
    const updatedProjectFinancials = await calculateProjectFinancials(pId);
    const updatedSiteFinancials = sId ? await calculateSiteFinancials(sId) : null;

    // Audit log
    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'PAYMENT_CREATED',
      entityType: 'ClientPayment',
      entityId: payment._id.toString(),
      projectId: pId,
      description: `Received payment of ₹${numAmount.toLocaleString('en-IN')} from ${resolvedOwner} under receipt ${finalReceiptNumber}${isOverpayment ? ' [OVERPAYMENT CONFIRMED]' : ''}`,
      metadata: {
        receiptNumber: finalReceiptNumber,
        amount: numAmount,
        isOverpayment,
        overpaymentAmount: overpaymentAmt,
      },
      ipAddress: req.ip,
    });

    // Send notification
    await createNotification({
      title: 'Payment Received',
      message: `₹${numAmount.toLocaleString('en-IN')} received from ${resolvedOwner} for ${project.projectName}.`,
      type: isOverpayment ? 'OVERPAYMENT' : 'PAYMENT_RECEIVED',
      link: `/admin/projects/${pId}?tab=payments`,
    });

    return res.status(201).json({
      success: true,
      data: payment,
      financials: updatedProjectFinancials,
      siteFinancials: updatedSiteFinancials,
      message: `Payment of ₹${numAmount.toLocaleString('en-IN')} successfully recorded. Receipt: ${finalReceiptNumber}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reverseClientPayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid reversal reason is required to reverse a financial transaction.',
      });
    }

    const payment = await ClientPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'REVERSED') {
      return res.status(400).json({ success: false, message: 'This payment is already reversed.' });
    }

    payment.status = 'REVERSED';
    payment.reversedBy = req.user?.id as any;
    payment.reversedAt = new Date();
    payment.reversalReason = reason.trim();
    await payment.save();

    // Recalculate project and site financials
    const updatedProjectFinancials = await calculateProjectFinancials(payment.projectId.toString());
    const updatedSiteFinancials = await calculateSiteFinancials(payment.siteId.toString());

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'PAYMENT_REVERSED',
      entityType: 'ClientPayment',
      entityId: payment._id.toString(),
      projectId: payment.projectId.toString(),
      description: `Reversed payment of ₹${payment.amount.toLocaleString('en-IN')} (Receipt: ${payment.receiptNumber}). Reason: ${reason}`,
      metadata: {
        receiptNumber: payment.receiptNumber,
        reversedAmount: payment.amount,
        reason,
      },
      ipAddress: req.ip,
    });

    await createNotification({
      title: 'Payment Reversed',
      message: `Receipt ${payment.receiptNumber} for ₹${payment.amount.toLocaleString('en-IN')} has been reversed.`,
      type: 'PAYMENT_REVERSED',
      link: `/admin/projects/${payment.projectId}?tab=payments`,
    });

    return res.json({
      success: true,
      data: payment,
      financials: updatedProjectFinancials,
      siteFinancials: updatedSiteFinancials,
      message: `Payment ${payment.receiptNumber} successfully reversed. Financial metrics updated.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
