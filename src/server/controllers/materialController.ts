import { Response } from 'express';
import { Material, MaterialPurchase, InventoryTransaction, Vendor } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { createAuditLog, createNotification } from '../services/auditService.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';

// ---------------- MATERIALS ----------------
export async function getMaterials(req: AuthRequest, res: Response) {
  try {
    const { category, lowStock, search } = req.query;
    const filter: any = {};
    if (category && category !== 'ALL') filter.category = category;
    if (search && typeof search === 'string') {
      filter.name = new RegExp(search.trim(), 'i');
    }

    let materials = await Material.find(filter).sort({ name: 1 });

    if (lowStock === 'true') {
      materials = materials.filter((m) => m.currentStock <= m.minimumStock);
    }

    return res.json({ success: true, data: materials });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createMaterial(req: AuthRequest, res: Response) {
  try {
    const { name, category, unit, description, minimumStock, currentStock } = req.body;
    if (!name || !category || !unit) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Unit are required.' });
    }

    const material = await Material.create({
      name: name.trim(),
      category,
      unit,
      description,
      minimumStock: Number(minimumStock) || 10,
      currentStock: Number(currentStock) || 0,
      status: 'ACTIVE',
    });

    if (material.currentStock > 0) {
      await InventoryTransaction.create({
        materialId: material._id,
        transactionType: 'ADJUSTMENT',
        quantity: material.currentStock,
        previousStock: 0,
        newStock: material.currentStock,
        notes: 'Initial opening stock upon material creation',
        createdBy: req.user?.id,
      });
    }

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'MATERIAL_CREATED',
      entityType: 'Material',
      entityId: material._id.toString(),
      description: `Added new material "${material.name}" [${material.category}] with ${material.currentStock} ${material.unit}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: material, message: 'Material added successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMaterial(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const material = await Material.findByIdAndUpdate(id, req.body, { new: true });
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    return res.json({ success: true, data: material, message: 'Material updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------- MATERIAL PURCHASES ----------------
export async function getMaterialPurchases(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, materialId, vendorId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (materialId) filter.materialId = materialId;
    if (vendorId) filter.vendorId = vendorId;
    if (status && status !== 'ALL') filter.status = status;

    const purchases = await MaterialPurchase.find(filter)
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('materialId', 'name category unit')
      .populate('vendorId', 'name companyName phone')
      .populate('createdBy', 'name')
      .sort({ purchaseDate: -1 });

    return res.json({ success: true, data: purchases });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createMaterialPurchase(req: AuthRequest, res: Response) {
  try {
    const {
      projectId,
      siteId,
      materialId,
      vendorId,
      purchaseDate,
      quantity,
      unit,
      unitPrice,
      paidAmount,
      paymentMethod,
      onlineMethod,
      transactionReference,
      invoiceNumber,
    } = req.body;

    const numQty = Number(quantity);
    const numPrice = Number(unitPrice);
    if (!numQty || numQty <= 0 || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be > 0 and Unit Price >= 0' });
    }

    if (!projectId || !siteId || !materialId || !vendorId || !invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Project, Site, Material, Vendor, and Invoice Number are required.',
      });
    }

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const totalAmount = Math.round(numQty * numPrice);
    const numPaid = Number(paidAmount) || totalAmount;
    const pendingAmount = Math.max(totalAmount - numPaid, 0);

    // 1. Create purchase record
    const purchase = await MaterialPurchase.create({
      projectId,
      siteId,
      materialId,
      vendorId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      quantity: numQty,
      unit: unit || material.unit,
      unitPrice: numPrice,
      totalAmount,
      paidAmount: numPaid,
      pendingAmount,
      paymentMethod: paymentMethod || 'ONLINE',
      onlineMethod: paymentMethod === 'ONLINE' ? onlineMethod : undefined,
      transactionReference,
      invoiceNumber: invoiceNumber.trim(),
      status: 'COMPLETED',
      createdBy: req.user?.id,
    });

    // 2. Update material inventory stock
    const prevStock = material.currentStock;
    material.currentStock += numQty;
    await material.save();

    // 3. Log inventory transaction
    await InventoryTransaction.create({
      materialId: material._id,
      projectId,
      siteId,
      transactionType: 'PURCHASE',
      quantity: numQty,
      previousStock: prevStock,
      newStock: material.currentStock,
      referenceId: purchase._id,
      notes: `Procured via invoice #${invoiceNumber}`,
      date: purchase.purchaseDate,
      createdBy: req.user?.id,
    });

    // 4. Update vendor totals
    await Vendor.findByIdAndUpdate(vendorId, {
      $inc: {
        totalAmount: totalAmount,
        paidAmount: numPaid,
        pendingAmount: pendingAmount,
      },
    });

    // 5. Create audit log
    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'MATERIAL_PURCHASE_CREATED',
      entityType: 'MaterialPurchase',
      entityId: purchase._id.toString(),
      projectId,
      description: `Procured ${numQty} ${material.unit} of "${material.name}" for ₹${totalAmount.toLocaleString('en-IN')} (Inv: ${invoiceNumber})`,
      metadata: { invoiceNumber, totalAmount, paidAmount: numPaid, pendingAmount },
      ipAddress: req.ip,
    });

    // Check if stock became healthy or remains low
    if (material.currentStock <= material.minimumStock) {
      await createNotification({
        title: 'Material Stock Critical',
        message: `${material.name} current stock (${material.currentStock} ${material.unit}) is below minimum limit (${material.minimumStock} ${material.unit}).`,
        type: 'LOW_STOCK',
        link: '/admin/materials',
      });
    }

    const updatedFinancials = await calculateProjectFinancials(projectId);

    return res.status(201).json({
      success: true,
      data: purchase,
      currentMaterialStock: material.currentStock,
      financials: updatedFinancials,
      message: `Material purchase recorded. Stock increased to ${material.currentStock} ${material.unit}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reverseMaterialPurchase(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reversal reason is required.' });
    }

    const purchase = await MaterialPurchase.findById(id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });

    if (purchase.status === 'REVERSED') {
      return res.status(400).json({ success: false, message: 'This purchase is already reversed.' });
    }

    purchase.status = 'REVERSED';
    purchase.reversedBy = req.user?.id as any;
    purchase.reversedAt = new Date();
    purchase.reversalReason = reason;
    await purchase.save();

    // Revert material stock
    const material = await Material.findById(purchase.materialId);
    if (material) {
      const prev = material.currentStock;
      material.currentStock = Math.max(material.currentStock - purchase.quantity, 0);
      await material.save();

      await InventoryTransaction.create({
        materialId: material._id,
        projectId: purchase.projectId,
        siteId: purchase.siteId,
        transactionType: 'RETURN',
        quantity: -purchase.quantity,
        previousStock: prev,
        newStock: material.currentStock,
        referenceId: purchase._id,
        notes: `Reversed invoice #${purchase.invoiceNumber}: ${reason}`,
        createdBy: req.user?.id,
      });
    }

    // Revert vendor balances
    await Vendor.findByIdAndUpdate(purchase.vendorId, {
      $inc: {
        totalAmount: -purchase.totalAmount,
        paidAmount: -purchase.paidAmount,
        pendingAmount: -purchase.pendingAmount,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'MATERIAL_PURCHASE_REVERSED',
      entityType: 'MaterialPurchase',
      entityId: purchase._id.toString(),
      projectId: purchase.projectId.toString(),
      description: `Reversed material invoice #${purchase.invoiceNumber} (₹${purchase.totalAmount}). Reason: ${reason}`,
      ipAddress: req.ip,
    });

    const updatedFinancials = await calculateProjectFinancials(purchase.projectId.toString());

    return res.json({
      success: true,
      data: purchase,
      financials: updatedFinancials,
      message: `Purchase invoice #${purchase.invoiceNumber} reversed and stock deducted.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------- INVENTORY TRANSACTIONS ----------------
export async function getInventoryTransactions(req: AuthRequest, res: Response) {
  try {
    const { materialId } = req.query;
    const filter: any = {};
    if (materialId) filter.materialId = materialId;

    const txs = await InventoryTransaction.find(filter)
      .populate('materialId', 'name category unit')
      .populate('projectId', 'projectName projectCode')
      .populate('siteId', 'siteName')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    return res.json({ success: true, data: txs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function adjustInventory(req: AuthRequest, res: Response) {
  try {
    const { materialId, projectId, siteId, transactionType, quantity, notes } = req.body;
    const numQty = Number(quantity);

    if (!materialId || !transactionType || isNaN(numQty) || numQty === 0) {
      return res.status(400).json({ success: false, message: 'Material, Type, and non-zero quantity required' });
    }

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    const prevStock = material.currentStock;
    let newStock = prevStock;

    if (transactionType === 'PURCHASE' || transactionType === 'RETURN') {
      newStock = prevStock + Math.abs(numQty);
    } else if (transactionType === 'ISSUE') {
      newStock = Math.max(prevStock - Math.abs(numQty), 0);
    } else if (transactionType === 'ADJUSTMENT') {
      newStock = Math.max(numQty, 0);
    }

    material.currentStock = newStock;
    await material.save();

    const tx = await InventoryTransaction.create({
      materialId,
      projectId,
      siteId,
      transactionType,
      quantity: numQty,
      previousStock: prevStock,
      newStock,
      notes: notes || `Stock ${transactionType.toLowerCase()} update`,
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'INVENTORY_UPDATED',
      entityType: 'Material',
      entityId: material._id.toString(),
      projectId,
      description: `${transactionType} adjustment on "${material.name}": ${prevStock} -> ${newStock} ${material.unit}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: tx,
      currentStock: newStock,
      message: `Stock updated for ${material.name}. Current balance: ${newStock} ${material.unit}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
