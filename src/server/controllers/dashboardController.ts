import { Response } from 'express';
import { Project, Site, Material, ClientPayment, WorkerPayment, MaterialPurchase, VendorPayment, Expense } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { calculateProjectFinancials } from '../services/financialService.ts';

export async function getDashboardMetrics(req: AuthRequest, res: Response) {
  try {
    const projects = await Project.find();
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

    // Calculate aggregated project financials
    let totalProjectCost = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let totalExpenses = 0;
    let totalWorkerExpenses = 0;
    let totalMaterialExpenses = 0;
    let totalVendorExpenses = 0;
    let totalTransportExpenses = 0;
    let totalEquipmentExpenses = 0;
    let totalOtherExpenses = 0;

    const projectProgressList: any[] = [];

    for (const p of projects) {
      const fin = await calculateProjectFinancials(p._id.toString());
      totalProjectCost += fin.totalCost;
      totalReceived += fin.totalReceived;
      totalPending += fin.pendingAmount;
      totalExpenses += fin.totalExpenses;
      totalWorkerExpenses += fin.workerExpenses;
      totalMaterialExpenses += fin.materialExpenses;
      totalVendorExpenses += fin.vendorExpenses;
      totalTransportExpenses += fin.transportExpenses;
      totalEquipmentExpenses += fin.equipmentExpenses;
      totalOtherExpenses += fin.otherExpenses;

      projectProgressList.push({
        id: p._id.toString(),
        name: p.projectName,
        code: p.projectCode,
        cost: fin.totalCost,
        received: fin.totalReceived,
        pending: fin.pendingAmount,
        progress: fin.paymentProgress,
      });
    }

    const remainingBudget = totalReceived - totalExpenses;

    // Cash vs Online Analysis
    const clientPayments = await ClientPayment.find({ status: 'PAID' });
    let cashReceived = 0;
    let onlineReceived = 0;
    const onlineMethodsBreakdown: Record<string, number> = {
      UPI: 0,
      BANK_TRANSFER: 0,
      NEFT: 0,
      RTGS: 0,
      IMPS: 0,
      CHEQUE: 0,
      OTHER: 0,
    };

    clientPayments.forEach((cp) => {
      if (cp.paymentMethod === 'CASH') {
        cashReceived += cp.amount;
      } else {
        onlineReceived += cp.amount;
        const m = cp.onlineMethod || 'OTHER';
        onlineMethodsBreakdown[m] = (onlineMethodsBreakdown[m] || 0) + cp.amount;
      }
    });

    // Expenses Cash vs Online
    const allExpenses = await Expense.find({ status: 'PAID' });
    const allWorkerPays = await WorkerPayment.find({ status: 'PAID' });
    const allPurchases = await MaterialPurchase.find({ status: { $ne: 'REVERSED' } });
    const allVendorPays = await VendorPayment.find({ status: 'PAID' });

    let cashExpenses = 0;
    let onlineExpenses = 0;

    [...allExpenses, ...allWorkerPays, ...allPurchases, ...allVendorPays].forEach((item: any) => {
      const amt = item.amount || item.paidAmount || 0;
      if (item.paymentMethod === 'CASH') {
        cashExpenses += amt;
      } else {
        onlineExpenses += amt;
      }
    });

    // Low stock materials
    const materials = await Material.find({ status: 'ACTIVE' });
    const lowStockCount = materials.filter((m) => m.currentStock <= m.minimumStock).length;
    const lowStockMaterials = materials
      .filter((m) => m.currentStock <= m.minimumStock)
      .slice(0, 5)
      .map((m) => ({
        id: m._id,
        name: m.name,
        category: m.category,
        currentStock: m.currentStock,
        minimumStock: m.minimumStock,
        unit: m.unit,
      }));

    // Recent 5 projects
    const recentProjects = projects.slice(0, 5).map((p) => ({
      id: p._id,
      name: p.projectName,
      code: p.projectCode,
      client: p.client.name,
      location: p.location,
      status: p.status,
      progress: p.progressPercentage,
      contractValue: p.contractValue,
    }));

    // Recent 6 transactions
    const recentReceipts = await ClientPayment.find({ status: 'PAID' })
      .populate('projectId', 'projectName')
      .sort({ paymentDate: -1 })
      .limit(6);

    const recentTransactions = recentReceipts.map((r) => ({
      id: r._id,
      type: 'SITE_OWNER_RECEIPT',
      displayType: 'Client Receipt',
      party: r.ownerName,
      projectName: (r.projectId as any)?.projectName || 'Project',
      amount: r.amount,
      method: r.paymentMethod,
      onlineMethod: r.onlineMethod,
      date: r.paymentDate,
      receiptNumber: r.receiptNumber,
    }));

    // Monthly receipts and expenses trend data (last 6 months)
    const monthlyReceiptsMap: Record<string, number> = {};
    const monthlyExpensesMap: Record<string, number> = {};

    const months: string[] = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    months.forEach((m) => {
      monthlyReceiptsMap[m] = 0;
      monthlyExpensesMap[m] = 0;
    });

    clientPayments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const mName = d.toLocaleString('en-US', { month: 'short' });
      if (monthlyReceiptsMap[mName] !== undefined) {
        monthlyReceiptsMap[mName] += p.amount;
      }
    });

    [...allExpenses, ...allWorkerPays, ...allPurchases, ...allVendorPays].forEach((item: any) => {
      const amt = item.amount || item.paidAmount || 0;
      const d = new Date(item.paymentDate || item.date || item.purchaseDate);
      const mName = d.toLocaleString('en-US', { month: 'short' });
      if (monthlyExpensesMap[mName] !== undefined) {
        monthlyExpensesMap[mName] += amt;
      }
    });

    const monthlyTrends = months.map((m) => ({
      month: m,
      receipts: monthlyReceiptsMap[m] || 0,
      expenses: monthlyExpensesMap[m] || 0,
    }));

    return res.json({
      success: true,
      data: {
        cards: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalProjectCost,
          totalReceived,
          totalPending,
          totalExpenses,
          remainingBudget,
          workerPayments: totalWorkerExpenses,
          materialExpenses: totalMaterialExpenses,
          vendorPayments: totalVendorExpenses,
          transportExpenses: totalTransportExpenses,
          otherExpenses: totalOtherExpenses,
          cashReceived,
          onlineReceived,
          cashExpenses,
          onlineExpenses,
          lowStockCount,
          overallPaymentProgress: totalProjectCost > 0 ? Math.round((totalReceived / totalProjectCost) * 100) : 0,
          overallExpensePercentage: totalProjectCost > 0 ? Math.round((totalExpenses / totalProjectCost) * 100) : 0,
        },
        charts: {
          projectPaymentProgress: projectProgressList,
          expenseBreakdown: [
            { name: 'Workers', value: totalWorkerExpenses, color: '#3b82f6' },
            { name: 'Materials', value: totalMaterialExpenses, color: '#f59e0b' },
            { name: 'Vendors', value: totalVendorExpenses, color: '#10b981' },
            { name: 'Transport', value: totalTransportExpenses, color: '#8b5cf6' },
            { name: 'Equipment', value: totalEquipmentExpenses, color: '#06b6d4' },
            { name: 'Other Overheads', value: totalOtherExpenses, color: '#64748b' },
          ].filter((i) => i.value > 0),
          cashVsOnlineReceipts: [
            { name: 'Cash', value: cashReceived, color: '#10b981' },
            { name: 'Online', value: onlineReceived, color: '#3b82f6' },
          ],
          cashVsOnlineExpenses: [
            { name: 'Cash', value: cashExpenses, color: '#f59e0b' },
            { name: 'Online', value: onlineExpenses, color: '#8b5cf6' },
          ],
          onlineMethodsBreakdown: Object.entries(onlineMethodsBreakdown).map(([k, v]) => ({
            method: k,
            amount: v,
          })),
          monthlyTrends,
        },
        recentProjects,
        recentTransactions,
        lowStockMaterials,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
