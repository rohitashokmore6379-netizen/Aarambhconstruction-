import { Response } from 'express';
import { Vendor, VendorPayment } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { createAuditLog } from '../services/auditService.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';

export async function getVendors(req: AuthRequest, res: Response) {
  try {
    const { search, category } = req.query;
    const filter: any = {};
    if (category && category !== 'ALL') filter.category = category;
    if (search && typeof search === 'string') {
      const r = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: r }, { companyName: r }, { vendorCode: r }, { phone: r }];
    }

    const vendors = await Vendor.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: vendors });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createVendor(req: AuthRequest, res: Response) {
  try {
    const { name, companyName, phone, email, address, category, gstNumber } = req.body;
    if (!name || !companyName || !phone) {
      return res.status(400).json({ success: false, message: 'Vendor Name, Company Name, and Phone are required.' });
    }

    const count = await Vendor.countDocuments();
    const vendorCode = `VND-${String(count + 1).padStart(3, '0')}`;

    const vendor = await Vendor.create({
      vendorCode,
      name: name.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      email,
      address,
      category: category || 'Building Materials',
      gstNumber,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      status: 'ACTIVE',
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'VENDOR_CREATED',
      entityType: 'Vendor',
      entityId: vendor._id.toString(),
      description: `Registered vendor "${vendor.name}" (${vendor.companyName}, ${vendor.vendorCode})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: vendor, message: 'Vendor added successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateVendor(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    return res.json({ success: true, data: vendor, message: 'Vendor updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getVendorPayments(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, vendorId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (vendorId) filter.vendorId = vendorId;
    if (status && status !== 'ALL') filter.status = status;

    const payments = await VendorPayment.find(filter)
      .populate('vendorId', 'name companyName vendorCode phone')
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('createdBy', 'name')
      .sort({ paymentDate: -1 });

    return res.json({ success: true, data: payments });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createVendorPayment(req: AuthRequest, res: Response) {
  try {
    const {
      projectId,
      siteId,
      vendorId,
      amount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      receiptNumber,
      paymentDate,
      notes,
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    if (!projectId || !siteId || !vendorId) {
      return res.status(400).json({ success: false, message: 'Project, Site, and Vendor are required.' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    let finalReceiptNumber = receiptNumber?.trim();
    if (!finalReceiptNumber) {
      const count = await VendorPayment.countDocuments();
      finalReceiptNumber = `VPAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    }

    const payment = await VendorPayment.create({
      projectId,
      siteId,
      vendorId,
      amount: numAmount,
      paymentMethod: paymentMethod || 'ONLINE',
      onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      transactionReference,
      receiptNumber: finalReceiptNumber,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      status: 'PAID',
      createdBy: req.user?.id,
    });

    // Update vendor ledger
    vendor.paidAmount += numAmount;
    vendor.pendingAmount = Math.max(vendor.totalAmount - vendor.paidAmount, 0);
    await vendor.save();

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'VENDOR_PAYMENT_CREATED',
      entityType: 'VendorPayment',
      entityId: payment._id.toString(),
      projectId,
      description: `Settled payment of ₹${numAmount.toLocaleString('en-IN')} to ${vendor.companyName} (${paymentMethod}, Ref: ${finalReceiptNumber})`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(projectId);

    return res.status(201).json({
      success: true,
      data: payment,
      financials: updatedFinancials,
      message: `Vendor payment of ₹${numAmount.toLocaleString('en-IN')} recorded.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reverseVendorPayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reversal reason is required.' });
    }

    const payment = await VendorPayment.findById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Vendor payment not found.' });

    if (payment.status === 'REVERSED') {
      return res.status(400).json({ success: false, message: 'Payment is already reversed.' });
    }

    payment.status = 'REVERSED';
    payment.reversedBy = req.user?.id as any;
    payment.reversedAt = new Date();
    payment.reversalReason = reason;
    await payment.save();

    // Revert vendor ledger
    const vendor = await Vendor.findById(payment.vendorId);
    if (vendor) {
      vendor.paidAmount = Math.max(vendor.paidAmount - payment.amount, 0);
      vendor.pendingAmount = Math.max(vendor.totalAmount - vendor.paidAmount, 0);
      await vendor.save();
    }

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'VENDOR_PAYMENT_REVERSED',
      entityType: 'VendorPayment',
      entityId: payment._id.toString(),
      projectId: payment.projectId.toString(),
      description: `Reversed vendor payment of ₹${payment.amount} (Receipt: ${payment.receiptNumber}). Reason: ${reason}`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(payment.projectId.toString());

    return res.json({
      success: true,
      data: payment,
      financials: updatedFinancials,
      message: 'Vendor payment reversed.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
