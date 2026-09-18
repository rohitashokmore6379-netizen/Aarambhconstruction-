export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_STAFF';
  phone?: string;
}

export interface ProjectFinancials {
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

export interface SiteFinancials {
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

export interface Project {
  _id: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: string;
  location: string;
  client: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  contractValue: number;
  estimatedCost: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  progressPercentage: number;
  isPublic: boolean;
  publicStatus?: string;
  publicImages?: string[];
  privateNotes?: string;
  createdAt: string;
  updatedAt: string;
  sites?: Site[];
  financials?: ProjectFinancials;
}

export interface Site {
  _id: string;
  projectId: string | { _id: string; projectName: string; projectCode: string };
  siteName: string;
  location: string;
  address?: string;
  siteOwner: string;
  ownerContact?: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
  progressPercentage: number;
  totalCost: number;
  isPublic: boolean;
  financials?: SiteFinancials;
  createdAt: string;
}

export interface ClientPayment {
  _id: string;
  projectId: any;
  siteId: any;
  ownerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  receiptNumber: string;
  description?: string;
  attachment?: string;
  status: 'PAID' | 'REVERSED';
  overpaymentAmount?: number;
  reversedBy?: any;
  reversedAt?: string;
  reversalReason?: string;
  createdBy?: any;
  createdAt: string;
}

export interface Worker {
  _id: string;
  workerCode: string;
  name: string;
  phone: string;
  address?: string;
  role: string;
  skill: 'MISTRI' | 'MASON' | 'CARPENTER' | 'BAR_BENDER' | 'HELPER' | 'ELECTRICIAN' | 'PLUMBER' | 'PAINTER' | 'OTHER';
  dailyWageRate: number;
  dailyRate?: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface WorkType {
  _id: string;
  name: string;
  code: string;
  description?: string;
  standardRate: number;
  unit: 'DAYS' | 'HOURS' | 'SQFT';
}

export interface WorkLog {
  _id: string;
  projectId: any;
  siteId: any;
  workerId: any;
  workTypeId: any;
  workDate: string;
  daysWorked: number;
  dailyRate: number;
  amount: number;
  notes?: string;
}

export interface WorkerPayment {
  _id: string;
  projectId: any;
  siteId: any;
  workerId: any;
  workTypeId?: any;
  workDate?: string;
  daysWorked?: number;
  dailyRate?: number;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: string;
  transactionReference?: string;
  receiptNumber?: string;
  paymentDate: string;
  notes?: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: any;
  reversedAt?: string;
  reversalReason?: string;
}

export interface Material {
  _id: string;
  name: string;
  category: 'Cement' | 'Steel' | 'Sand' | 'Aggregate' | 'Bricks' | 'Tiles' | 'Electrical' | 'Plumbing' | 'Paint' | 'Hardware' | 'Other' | string;
  unit: string;
  unitPrice?: number;
  description?: string;
  minimumStock: number;
  currentStock: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MaterialPurchase {
  _id: string;
  projectId: any;
  siteId: any;
  materialId: any;
  vendorId: any;
  purchaseDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount?: number;
  totalCost?: any;
  paidAmount?: number;
  pendingAmount?: number;
  paymentMethod: 'CASH' | 'ONLINE' | 'CREDIT';
  onlineMethod?: string;
  transactionReference?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  status: 'COMPLETED' | 'PENDING' | 'REVERSED' | 'PAID';
  reversedBy?: any;
  reversedAt?: string;
  reversalReason?: string;
}

export interface InventoryLog {
  _id: string;
  materialId: any;
  projectId?: any;
  siteId?: any;
  type: 'PURCHASE' | 'USAGE' | 'RETURN' | 'ADJUSTMENT' | 'PROCUREMENT' | 'MANUAL_ADJUSTMENT' | string;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  date: string;
}

export interface InventoryTransaction {
  _id: string;
  materialId: any;
  projectId?: any;
  siteId?: any;
  transactionType: 'PURCHASE' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  date: string;
}

export interface Vendor {
  _id: string;
  vendorCode?: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  materialSupplied?: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  gstNumber?: string;
  totalAmount?: number;
  totalBilled?: number;
  paidAmount?: number;
  totalPaid?: number;
  pendingAmount?: number;
  pendingBalance?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface VendorPayment {
  _id: string;
  projectId: any;
  siteId: any;
  vendorId: any;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: string;
  transactionReference?: string;
  receiptNumber?: string;
  paymentDate: string;
  notes?: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: any;
  reversedAt?: string;
  reversalReason?: string;
}

export interface Expense {
  _id: string;
  projectId: any;
  siteId: any;
  category: 'WORKER' | 'MATERIAL' | 'VENDOR' | 'TRANSPORT' | 'EQUIPMENT' | 'OTHER' | string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: string;
  transactionReference?: string;
  receiptNumber?: string;
  date: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: any;
  reversedAt?: string;
  reversalReason?: string;
}

export interface UnifiedPayment {
  id: string;
  sourceType: 'CLIENT_RECEIPT' | 'WORKER_PAYMENT' | 'MATERIAL_PAYMENT' | 'MATERIAL_PURCHASE' | 'VENDOR_PAYMENT' | 'EXPENSE';
  displayType: string;
  flow: 'INFLOW' | 'OUTFLOW';
  date: string;
  amount: number;
  party: string;
  partyRole: string;
  projectId?: string;
  projectName: string;
  projectCode?: string;
  siteId?: string;
  siteName: string;
  paymentMethod: 'CASH' | 'ONLINE' | 'CREDIT';
  onlineMethod?: string;
  reference?: string;
  receiptNumber?: string;
  status: 'PAID' | 'REVERSED' | 'COMPLETED' | 'PENDING';
  description?: string;
  raw?: any;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_REVERSED' | 'WORKER_PAYMENT' | 'LOW_STOCK' | 'OVERPAYMENT' | 'ALERT';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  projectId?: any;
  description: string;
  metadata?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface CompanySettingsData {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  defaultCurrency: string;
  currencySymbol: string;
  receiptPrefix: string;
  invoicePrefix: string;
}

export interface DashboardData {
  cards: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalProjectCost: number;
    totalReceived: number;
    totalPending: number;
    totalExpenses: number;
    remainingBudget: number;
    workerPayments: number;
    materialExpenses: number;
    vendorPayments: number;
    transportExpenses: number;
    otherExpenses: number;
    cashReceived: number;
    onlineReceived: number;
    cashExpenses: number;
    onlineExpenses: number;
    lowStockCount: number;
    overallPaymentProgress: number;
    overallExpensePercentage: number;
  };
  charts: {
    projectPaymentProgress: Array<{
      id: string;
      name: string;
      code: string;
      cost: number;
      received: number;
      pending: number;
      progress: number;
    }>;
    expenseBreakdown: Array<{ name: string; value: number; color: string }>;
    cashVsOnlineReceipts: Array<{ name: string; value: number; color: string }>;
    cashVsOnlineExpenses: Array<{ name: string; value: number; color: string }>;
    onlineMethodsBreakdown: Array<{ method: string; amount: number }>;
    monthlyTrends: Array<{ month: string; receipts: number; expenses: number }>;
  };
  recentProjects: any[];
  recentTransactions: any[];
  lowStockMaterials: any[];
}
