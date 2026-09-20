import { Response } from 'express';
import {
  Project,
  Site,
  Material,
  ClientPayment,
  WorkerPayment,
  MaterialPurchase,
  VendorPayment,
  Expense,
  Worker,
  WorkLog,
  WorkLaborRecord,
} from '../models/index.ts';
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

    // Monthly receipts, expenses and worker utilization trend data
    const workLogs = await WorkLog.find();
    const workLaborRecords = await WorkLaborRecord.find();
    const totalWorkersEnrolled = (await Worker.countDocuments({ status: 'ACTIVE' })) || (await Worker.countDocuments()) || 12;

    // Collect all dates to determine full chronological timeline
    const allDates: Date[] = [];
    clientPayments.forEach((p) => p.paymentDate && allDates.push(new Date(p.paymentDate)));
    allExpenses.forEach((e) => e.date && allDates.push(new Date(e.date)));
    allWorkerPays.forEach((w) => w.paymentDate && allDates.push(new Date(w.paymentDate)));
    allPurchases.forEach((m) => m.purchaseDate && allDates.push(new Date(m.purchaseDate)));
    allVendorPays.forEach((v) => v.paymentDate && allDates.push(new Date(v.paymentDate)));
    workLogs.forEach((l) => l.workDate && allDates.push(new Date(l.workDate)));
    workLaborRecords.forEach((r) => r.date && allDates.push(new Date(r.date)));

    // Determine start and end calendar months
    let minDate = new Date();
    minDate.setMonth(minDate.getMonth() - 11); // default past 12 months
    minDate.setDate(1);

    if (allDates.length > 0) {
      const earliest = new Date(Math.min(...allDates.map((d) => d.getTime())));
      earliest.setDate(1);
      if (earliest < minDate) {
        minDate = earliest;
      }
    }

    const maxDate = new Date();
    if (allDates.length > 0) {
      const latest = new Date(Math.max(...allDates.map((d) => d.getTime())));
      if (latest > maxDate) {
        maxDate.setTime(latest.getTime());
      }
    }

    // Build array of continuous YYYY-MM slots
    const monthSlots: Array<{ key: string; label: string; shortMonth: string; year: number; monthNum: number }> = [];
    const curCursor = new Date(minDate);
    curCursor.setDate(1);

    while (
      curCursor.getFullYear() < maxDate.getFullYear() ||
      (curCursor.getFullYear() === maxDate.getFullYear() && curCursor.getMonth() <= maxDate.getMonth())
    ) {
      const yr = curCursor.getFullYear();
      const mNum = curCursor.getMonth();
      const key = `${yr}-${String(mNum + 1).padStart(2, '0')}`;
      const shortMonth = curCursor.toLocaleString('en-US', { month: 'short' });
      const label = `${shortMonth} '${String(yr).slice(-2)}`;

      monthSlots.push({
        key,
        label,
        shortMonth,
        year: yr,
        monthNum: mNum,
      });

      curCursor.setMonth(curCursor.getMonth() + 1);
    }

    // Ensure at least 6 months are available
    while (monthSlots.length < 6) {
      const last = monthSlots[monthSlots.length - 1];
      const nextDate = new Date(last.year, last.monthNum + 1, 1);
      const yr = nextDate.getFullYear();
      const mNum = nextDate.getMonth();
      monthSlots.push({
        key: `${yr}-${String(mNum + 1).padStart(2, '0')}`,
        label: `${nextDate.toLocaleString('en-US', { month: 'short' })} '${String(yr).slice(-2)}`,
        shortMonth: nextDate.toLocaleString('en-US', { month: 'short' }),
        year: yr,
        monthNum: mNum,
      });
    }

    // Helper to calculate monthly trend items for a dataset
    const computeMonthlyTrendsForItems = (
      cPayments: typeof clientPayments,
      expList: typeof allExpenses,
      wPays: typeof allWorkerPays,
      purchList: typeof allPurchases,
      vPays: typeof allVendorPays,
      wLogs: typeof workLogs,
      wLabor: typeof workLaborRecords,
      workerCapacity: number
    ) => {
      const capacityDays = Math.max(1, workerCapacity) * 25; // 25 working days standard

      return monthSlots.map((slot) => {
        const isInMonth = (d: any) => {
          if (!d) return false;
          const dt = new Date(d);
          return dt.getFullYear() === slot.year && dt.getMonth() === slot.monthNum;
        };

        // Financial Inflows
        const monthReceipts = cPayments.filter((p) => isInMonth(p.paymentDate));
        const income = monthReceipts.reduce((acc, p) => acc + (p.amount || 0), 0);

        // Financial Outflows
        const monthWages = wPays.filter((w) => isInMonth(w.paymentDate));
        const workerExpenses = monthWages.reduce((acc, w) => acc + (w.amount || 0), 0);

        const monthPurchases = purchList.filter((m) => isInMonth(m.purchaseDate));
        const materialExpenses = monthPurchases.reduce((acc, m) => acc + (m.paidAmount || m.totalAmount || 0), 0);

        const monthVendorPays = vPays.filter((v) => isInMonth(v.paymentDate));
        const vendorExpenses = monthVendorPays.reduce((acc, v) => acc + (v.amount || 0), 0);

        const monthDirectExp = expList.filter((e) => isInMonth(e.date));
        const otherExpenses = monthDirectExp.reduce((acc, e) => acc + (e.amount || 0), 0);

        const totalExpenses = workerExpenses + materialExpenses + vendorExpenses + otherExpenses;
        const netCashFlow = income - totalExpenses;
        const marginPercentage =
          income > 0 ? Math.round(((income - totalExpenses) / income) * 100) : totalExpenses > 0 ? -100 : 0;

        // Workforce Utilization
        const monthLogs = wLogs.filter((l) => isInMonth(l.workDate));
        const logDays = monthLogs.reduce((acc, l) => acc + (l.daysWorked || 1), 0);
        const uniqueLogWorkers = new Set(monthLogs.map((l) => l.workerId?.toString()).filter(Boolean)).size;

        const monthLabor = wLabor.filter((r) => isInMonth(r.date));
        const laborShifts = monthLabor.reduce((acc, r) => acc + (r.totalWorkers || 0), 0);
        const laborHours = monthLabor.reduce((acc, r) => acc + (r.totalLaborHours || 0), 0);

        const wageDays = monthWages.reduce((acc, w) => acc + (w.daysWorked || Math.round((w.amount || 0) / 750)), 0);

        const workerDays = Math.max(logDays, laborShifts, wageDays, Math.round(workerExpenses / 750));
        const activeWorkers = Math.min(
          workerCapacity,
          Math.max(uniqueLogWorkers, Math.ceil(workerDays / 25), workerDays > 0 ? 1 : 0)
        );
        const totalLaborHours = laborHours > 0 ? laborHours : Math.round(workerDays * 8);
        const workerUtilizationRate =
          capacityDays > 0 ? Math.min(100, Math.round((workerDays / capacityDays) * 100)) : 0;

        return {
          month: slot.label,
          monthKey: slot.key,
          shortMonth: slot.shortMonth,
          year: slot.year,
          income,
          expenses: totalExpenses,
          receipts: income, // backward compatibility
          netCashFlow,
          marginPercentage,
          workerExpenses,
          materialExpenses,
          vendorExpenses,
          otherExpenses,
          workerDays,
          totalLaborHours,
          activeWorkers,
          totalCapacityDays: capacityDays,
          workerUtilizationRate,
        };
      });
    };

    // Overall Company-wide Monthly Trends
    const monthlyTrends = computeMonthlyTrendsForItems(
      clientPayments,
      allExpenses,
      allWorkerPays,
      allPurchases,
      allVendorPays,
      workLogs,
      workLaborRecords,
      totalWorkersEnrolled
    );

    // Per-Project Monthly Trends Breakdown for Drilldown
    const projectMonthlyTrends = projects.map((p) => {
      const pId = p._id.toString();
      const pClientPayments = clientPayments.filter((c) => c.projectId && c.projectId.toString() === pId);
      const pExpenses = allExpenses.filter((e) => e.projectId && e.projectId.toString() === pId);
      const pWorkerPays = allWorkerPays.filter((w) => w.projectId && w.projectId.toString() === pId);
      const pPurchases = allPurchases.filter((m) => m.projectId && m.projectId.toString() === pId);
      const pVendorPays = allVendorPays.filter((v) => v.projectId && v.projectId.toString() === pId);
      const pLogs = workLogs.filter((l) => l.projectId && l.projectId.toString() === pId);
      const pLabor = workLaborRecords.filter((r) => r.projectId && r.projectId.toString() === pId);

      return {
        projectId: pId,
        projectName: p.projectName,
        projectCode: p.projectCode,
        monthlyTrends: computeMonthlyTrendsForItems(
          pClientPayments,
          pExpenses,
          pWorkerPays,
          pPurchases,
          pVendorPays,
          pLogs,
          pLabor,
          Math.max(4, Math.ceil(totalWorkersEnrolled / Math.max(1, projects.length)))
        ),
      };
    });

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
          projectMonthlyTrends,
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
