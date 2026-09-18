import mongoose, { Types } from 'mongoose';
import {
  Project,
  Site,
  ClientPayment,
  WorkerPayment,
  MaterialPurchase,
  VendorPayment,
  Expense,
} from '../models/index.ts';

export interface ProjectFinancialSummary {
  projectId: string;
  projectName: string;
  projectCode: string;
  totalCost: number;
  totalReceived: number;
  pendingAmount: number;
  totalExpenses: number;
  workerExpenses: number;
  materialExpenses: number;
  vendorExpenses: number;
  transportExpenses: number;
  equipmentExpenses: number;
  otherExpenses: number;
  remainingBudget: number;
  paymentProgress: number;
  expensePercentage: number;
  statusText: string;
  isOverpaid: boolean;
  overpaymentAmount: number;
}

export interface SiteFinancialSummary {
  siteId: string;
  siteName: string;
  projectId: string;
  totalCost: number;
  totalReceived: number;
  pendingAmount: number;
  totalExpenses: number;
  workerExpenses: number;
  materialExpenses: number;
  vendorExpenses: number;
  transportExpenses: number;
  equipmentExpenses: number;
  otherExpenses: number;
  remainingBudget: number;
  paymentProgress: number;
  expensePercentage: number;
  statusText: string;
}

export async function calculateProjectFinancials(projectIdStr: string): Promise<ProjectFinancialSummary> {
  const projectId = new mongoose.Types.ObjectId(projectIdStr);
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // 1. Client Payments Received (only PAID status)
  const clientPayments = await ClientPayment.find({
    projectId,
    status: 'PAID',
  });
  const totalReceived = clientPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 2. Worker Payments
  const workerPayments = await WorkerPayment.find({
    projectId,
    status: 'PAID',
  });
  const workerExpenses = workerPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 3. Material Purchases (Paid amount portion)
  const materialPurchases = await MaterialPurchase.find({
    projectId,
    status: { $ne: 'REVERSED' },
  });
  const materialExpenses = materialPurchases.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

  // 4. Vendor direct payments
  const vendorPayments = await VendorPayment.find({
    projectId,
    status: 'PAID',
  });
  const vendorExpenses = vendorPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 5. Categorized Expenses
  const expenses = await Expense.find({
    projectId,
    status: 'PAID',
  });

  let transportExpenses = 0;
  let equipmentExpenses = 0;
  let otherExpenses = 0;
  let directWorkerExpenses = 0;
  let directMaterialExpenses = 0;
  let directVendorExpenses = 0;

  for (const exp of expenses) {
    switch (exp.category) {
      case 'TRANSPORT':
        transportExpenses += exp.amount;
        break;
      case 'EQUIPMENT':
        equipmentExpenses += exp.amount;
        break;
      case 'WORKER':
        directWorkerExpenses += exp.amount;
        break;
      case 'MATERIAL':
        directMaterialExpenses += exp.amount;
        break;
      case 'VENDOR':
        directVendorExpenses += exp.amount;
        break;
      case 'OTHER':
      default:
        otherExpenses += exp.amount;
        break;
    }
  }

  const consolidatedWorkerExpenses = workerExpenses + directWorkerExpenses;
  const consolidatedMaterialExpenses = materialExpenses + directMaterialExpenses;
  const consolidatedVendorExpenses = vendorExpenses + directVendorExpenses;

  const totalExpenses =
    consolidatedWorkerExpenses +
    consolidatedMaterialExpenses +
    consolidatedVendorExpenses +
    transportExpenses +
    equipmentExpenses +
    otherExpenses;

  const totalCost = project.contractValue || project.estimatedCost || 0;
  const pendingAmount = Math.max(totalCost - totalReceived, 0);
  const isOverpaid = totalReceived > totalCost;
  const overpaymentAmount = isOverpaid ? totalReceived - totalCost : 0;

  const paymentProgress = totalCost > 0 ? Math.min(Math.round((totalReceived / totalCost) * 100), 100) : 0;
  const expensePercentage = totalCost > 0 ? Math.round((totalExpenses / totalCost) * 100) : 0;
  const remainingBudget = totalReceived - totalExpenses;

  let statusText = 'IN_PROGRESS';
  if (totalReceived >= totalCost && totalCost > 0) {
    statusText = 'FULLY_RECEIVED';
  } else if (totalReceived === 0) {
    statusText = 'PENDING';
  } else {
    statusText = 'PARTIALLY_RECEIVED';
  }

  return {
    projectId: project._id.toString(),
    projectName: project.projectName,
    projectCode: project.projectCode,
    totalCost,
    totalReceived,
    pendingAmount,
    totalExpenses,
    workerExpenses: consolidatedWorkerExpenses,
    materialExpenses: consolidatedMaterialExpenses,
    vendorExpenses: consolidatedVendorExpenses,
    transportExpenses,
    equipmentExpenses,
    otherExpenses,
    remainingBudget,
    paymentProgress,
    expensePercentage,
    statusText,
    isOverpaid,
    overpaymentAmount,
  };
}

export async function calculateSiteFinancials(siteIdStr: string): Promise<SiteFinancialSummary> {
  const siteId = new mongoose.Types.ObjectId(siteIdStr);
  const site = await Site.findById(siteId);
  if (!site) {
    throw new Error('Site not found');
  }

  const clientPayments = await ClientPayment.find({ siteId, status: 'PAID' });
  const totalReceived = clientPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const workerPayments = await WorkerPayment.find({ siteId, status: 'PAID' });
  const workerExpenses = workerPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const materialPurchases = await MaterialPurchase.find({ siteId, status: { $ne: 'REVERSED' } });
  const materialExpenses = materialPurchases.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

  const vendorPayments = await VendorPayment.find({ siteId, status: 'PAID' });
  const vendorExpenses = vendorPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const expenses = await Expense.find({ siteId, status: 'PAID' });
  let transportExpenses = 0;
  let equipmentExpenses = 0;
  let otherExpenses = 0;
  let directWorkerExpenses = 0;
  let directMaterialExpenses = 0;
  let directVendorExpenses = 0;

  for (const exp of expenses) {
    switch (exp.category) {
      case 'TRANSPORT':
        transportExpenses += exp.amount;
        break;
      case 'EQUIPMENT':
        equipmentExpenses += exp.amount;
        break;
      case 'WORKER':
        directWorkerExpenses += exp.amount;
        break;
      case 'MATERIAL':
        directMaterialExpenses += exp.amount;
        break;
      case 'VENDOR':
        directVendorExpenses += exp.amount;
        break;
      case 'OTHER':
      default:
        otherExpenses += exp.amount;
        break;
    }
  }

  const consolidatedWorkerExpenses = workerExpenses + directWorkerExpenses;
  const consolidatedMaterialExpenses = materialExpenses + directMaterialExpenses;
  const consolidatedVendorExpenses = vendorExpenses + directVendorExpenses;

  const totalExpenses =
    consolidatedWorkerExpenses +
    consolidatedMaterialExpenses +
    consolidatedVendorExpenses +
    transportExpenses +
    equipmentExpenses +
    otherExpenses;

  const totalCost = site.totalCost || 0;
  const pendingAmount = Math.max(totalCost - totalReceived, 0);
  const paymentProgress = totalCost > 0 ? Math.min(Math.round((totalReceived / totalCost) * 100), 100) : 0;
  const expensePercentage = totalCost > 0 ? Math.round((totalExpenses / totalCost) * 100) : 0;
  const remainingBudget = totalReceived - totalExpenses;

  let statusText = 'IN_PROGRESS';
  if (totalReceived >= totalCost && totalCost > 0) {
    statusText = 'FULLY_RECEIVED';
  } else if (totalReceived === 0) {
    statusText = 'PENDING';
  }

  return {
    siteId: site._id.toString(),
    siteName: site.siteName,
    projectId: site.projectId.toString(),
    totalCost,
    totalReceived,
    pendingAmount,
    totalExpenses,
    workerExpenses: consolidatedWorkerExpenses,
    materialExpenses: consolidatedMaterialExpenses,
    vendorExpenses: consolidatedVendorExpenses,
    transportExpenses,
    equipmentExpenses,
    otherExpenses,
    remainingBudget,
    paymentProgress,
    expensePercentage,
    statusText,
  };
}
