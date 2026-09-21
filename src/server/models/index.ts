import mongoose, { Schema, Document, Types } from 'mongoose';

// ----------------------------------------------------
// USER MODEL
// ----------------------------------------------------
export interface IWebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType?: string;
  deviceName?: string;
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  role: 'ROLE_ADMIN' | 'ROLE_STAFF';
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  resetOtp?: string;
  resetOtpExpiry?: Date;
  securityQuestion?: string;
  securityAnswer?: string;
  webauthnCredentials?: IWebAuthnCredential[];
  currentChallenge?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebAuthnCredentialSchema = new Schema(
  {
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    deviceType: { type: String },
    deviceName: { type: String, default: 'Admin Biometric Device' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ROLE_ADMIN', 'ROLE_STAFF'], default: 'ROLE_ADMIN' },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    resetOtp: { type: String, trim: true },
    resetOtpExpiry: { type: Date },
    securityQuestion: { type: String, trim: true },
    securityAnswer: { type: String, trim: true },
    webauthnCredentials: { type: [WebAuthnCredentialSchema], default: [] },
    currentChallenge: { type: String },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// PROJECT MODEL
// ----------------------------------------------------
export interface IProject extends Document {
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
  publicStatus: string;
  publicImages: string[];
  privateNotes?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    projectName: { type: String, required: true, trim: true, index: true },
    description: { type: String },
    projectType: { type: String, default: 'Residential' },
    location: { type: String, required: true, index: true },
    client: {
      name: { type: String, required: true, trim: true },
      phone: { type: String },
      email: { type: String },
      address: { type: String },
    },
    contractValue: { type: Number, required: true, default: 0, min: 0 },
    estimatedCost: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'IN_PROGRESS',
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    isPublic: { type: booleanSchema(), default: true },
    publicStatus: { type: String, default: 'Under Construction' },
    publicImages: [{ type: String }],
    privateNotes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

function booleanSchema() {
  return Boolean;
}

// ----------------------------------------------------
// SITE MODEL
// ----------------------------------------------------
export interface ISite extends Document {
  projectId: Types.ObjectId;
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
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISite>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    siteName: { type: String, required: true, trim: true, index: true },
    location: { type: String, required: true },
    address: { type: String },
    siteOwner: { type: String, required: true, trim: true },
    ownerContact: { type: String },
    description: { type: String },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED'], default: 'ACTIVE' },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    totalCost: { type: Number, default: 0, min: 0 },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// CLIENT PAYMENT MODEL (Site Owner Receipts)
// ----------------------------------------------------
export interface IClientPayment extends Document {
  projectId: Types.ObjectId;
  siteId?: Types.ObjectId;
  ownerName: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  receiptNumber: string;
  description?: string;
  attachment?: string;
  status: 'PAID' | 'REVERSED';
  overpaymentAmount: number;
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientPaymentSchema = new Schema<IClientPayment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    ownerName: { type: String, required: true, trim: true },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ['CASH', 'ONLINE'], required: true },
    onlineMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'OTHER'],
    },
    transactionReference: { type: String, trim: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    attachment: { type: String },
    status: { type: String, enum: ['PAID', 'REVERSED'], default: 'PAID', index: true },
    overpaymentAmount: { type: Number, default: 0 },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// WORKER MODEL
// ----------------------------------------------------
export interface IWorker extends Document {
  workerCode: string;
  name: string;
  phone: string;
  address?: string;
  role: string;
  skill: string;
  dailyWageRate: number;
  dailyRate?: number;
  joiningDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
  photo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerSchema = new Schema<IWorker>(
  {
    workerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, default: '-', trim: true },
    address: { type: String },
    role: { type: String, default: 'Construction Worker' },
    skill: {
      type: String,
      default: 'MASON',
      trim: true,
    },
    dailyWageRate: { type: Number, default: 600, min: 0 },
    dailyRate: { type: Number, default: 600, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    photo: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// WORK TYPE MODEL
// ----------------------------------------------------
export interface IWorkType extends Document {
  name: string;
  code: string;
  description?: string;
  standardRate: number;
  unit: 'DAYS' | 'HOURS' | 'SQFT';
}

const WorkTypeSchema = new Schema<IWorkType>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    standardRate: { type: Number, default: 700 },
    unit: { type: String, enum: ['DAYS', 'HOURS', 'SQFT'], default: 'DAYS' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// WORK LOG MODEL
// ----------------------------------------------------
export interface IWorkLog extends Document {
  projectId: Types.ObjectId;
  siteId?: Types.ObjectId;
  workerId: Types.ObjectId;
  workTypeId?: Types.ObjectId;
  workDate: Date;
  daysWorked: number;
  dailyRate: number;
  amount: number;
  notes?: string;
  createdBy?: Types.ObjectId;
}

const WorkLogSchema = new Schema<IWorkLog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
    workTypeId: { type: Schema.Types.ObjectId, ref: 'WorkType' },
    workDate: { type: Date, required: true, default: Date.now, index: true },
    daysWorked: { type: Number, required: true, min: 0.25 },
    dailyRate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// WORKER PAYMENT MODEL
// ----------------------------------------------------
export interface IWorkerPayment extends Document {
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  workerId: Types.ObjectId;
  workTypeId?: Types.ObjectId;
  workDate?: Date;
  daysWorked?: number;
  dailyRate?: number;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  paymentDate: Date;
  notes?: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy?: Types.ObjectId;
}

const WorkerPaymentSchema = new Schema<IWorkerPayment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
    workTypeId: { type: Schema.Types.ObjectId, ref: 'WorkType' },
    workDate: { type: Date },
    daysWorked: { type: Number },
    dailyRate: { type: Number },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ['CASH', 'ONLINE'], required: true },
    onlineMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'OTHER'],
    },
    transactionReference: { type: String },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String },
    status: { type: String, enum: ['PAID', 'REVERSED'], default: 'PAID', index: true },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// MATERIAL MODEL
// ----------------------------------------------------
export interface IMaterial extends Document {
  name: string;
  category: 'Cement' | 'Steel' | 'Sand' | 'Aggregate' | 'Bricks' | 'Tiles' | 'Electrical' | 'Plumbing' | 'Paint' | 'Hardware' | 'Other';
  unit: string;
  description?: string;
  minimumStock: number;
  currentStock: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const MaterialSchema = new Schema<IMaterial>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Cement', 'Steel', 'Sand', 'Aggregate', 'Bricks', 'Tiles', 'Electrical', 'Plumbing', 'Paint', 'Hardware', 'Other'],
      required: true,
      index: true,
    },
    unit: { type: String, required: true, default: 'Bags' },
    description: { type: String },
    minimumStock: { type: Number, default: 10, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// VENDOR MODEL
// ----------------------------------------------------
export interface IVendor extends Document {
  vendorCode: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  gstNumber?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const VendorSchema = new Schema<IVendor>(
  {
    vendorCode: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    category: { type: String, default: 'Building Materials' },
    gstNumber: { type: String },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// MATERIAL PURCHASE MODEL
// ----------------------------------------------------
export interface IMaterialPurchase extends Document {
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  materialId: Types.ObjectId;
  vendorId: Types.ObjectId;
  purchaseDate: Date;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: 'CASH' | 'ONLINE' | 'CREDIT';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  invoiceNumber: string;
  status: 'COMPLETED' | 'PENDING' | 'REVERSED';
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy?: Types.ObjectId;
}

const MaterialPurchaseSchema = new Schema<IMaterialPurchase>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    purchaseDate: { type: Date, required: true, default: Date.now, index: true },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    pendingAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'ONLINE', 'CREDIT'], default: 'ONLINE' },
    onlineMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'OTHER'],
    },
    transactionReference: { type: String },
    invoiceNumber: { type: String, required: true },
    status: { type: String, enum: ['COMPLETED', 'PENDING', 'REVERSED'], default: 'COMPLETED' },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// INVENTORY TRANSACTION MODEL
// ----------------------------------------------------
export interface IInventoryTransaction extends Document {
  materialId: Types.ObjectId;
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  transactionType: 'PURCHASE' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: Types.ObjectId;
  notes?: string;
  date: Date;
  createdBy?: Types.ObjectId;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    transactionType: {
      type: String,
      enum: ['PURCHASE', 'ISSUE', 'RETURN', 'ADJUSTMENT'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    notes: { type: String },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// VENDOR PAYMENT MODEL
// ----------------------------------------------------
export interface IVendorPayment extends Document {
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  vendorId: Types.ObjectId;
  purchaseId?: Types.ObjectId;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  receiptNumber: string;
  paymentDate: Date;
  notes?: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy?: Types.ObjectId;
}

const VendorPaymentSchema = new Schema<IVendorPayment>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'MaterialPurchase' },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ['CASH', 'ONLINE'], required: true },
    onlineMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'OTHER'],
    },
    transactionReference: { type: String },
    receiptNumber: { type: String, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    notes: { type: String },
    status: { type: String, enum: ['PAID', 'REVERSED'], default: 'PAID', index: true },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// EXPENSE MODEL
// ----------------------------------------------------
export interface IExpense extends Document {
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  category: 'WORKER' | 'MATERIAL' | 'VENDOR' | 'TRANSPORT' | 'EQUIPMENT' | 'OTHER';
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  onlineMethod?: 'UPI' | 'BANK_TRANSFER' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'OTHER';
  transactionReference?: string;
  date: Date;
  attachment?: string;
  status: 'PAID' | 'REVERSED';
  reversedBy?: Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  createdBy?: Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    category: {
      type: String,
      enum: ['WORKER', 'MATERIAL', 'VENDOR', 'TRANSPORT', 'EQUIPMENT', 'OTHER'],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, enum: ['CASH', 'ONLINE'], required: true },
    onlineMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'OTHER'],
    },
    transactionReference: { type: String },
    date: { type: Date, required: true, default: Date.now, index: true },
    attachment: { type: String },
    status: { type: String, enum: ['PAID', 'REVERSED'], default: 'PAID', index: true },
    reversedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reversedAt: { type: Date },
    reversalReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// DOCUMENT MODEL
// ----------------------------------------------------
export interface IDocumentItem extends Document {
  name: string;
  type: string;
  url: string;
  projectId?: Types.ObjectId;
  siteId?: Types.ObjectId;
  entityType?: 'PROJECT' | 'SITE' | 'PAYMENT' | 'WORKER' | 'VENDOR' | 'MATERIAL';
  entityId?: Types.ObjectId;
  sizeBytes?: number;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
}

const DocumentItemSchema = new Schema<IDocumentItem>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    entityType: {
      type: String,
      enum: ['PROJECT', 'SITE', 'PAYMENT', 'WORKER', 'VENDOR', 'MATERIAL'],
    },
    entityId: { type: Schema.Types.ObjectId },
    sizeBytes: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// SITE PHOTO MODEL
// ----------------------------------------------------
export interface ISitePhoto extends Document {
  projectId: Types.ObjectId;
  siteId: Types.ObjectId;
  caption?: string;
  photoUrl: string;
  phase: string;
  isPublic: boolean;
  takenAt: Date;
  uploadedBy?: Types.ObjectId;
}

const SitePhotoSchema = new Schema<ISitePhoto>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    caption: { type: String },
    photoUrl: { type: String, required: true },
    phase: { type: String, default: 'Foundation' },
    isPublic: { type: Boolean, default: true },
    takenAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// INQUIRY MODEL (Public Leads)
// ----------------------------------------------------
export interface IInquiry extends Document {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  location?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';
  createdAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    projectType: { type: String, default: 'Residential' },
    location: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['NEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED'], default: 'NEW' },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// NOTIFICATION MODEL
// ----------------------------------------------------
export interface INotification extends Document {
  title: string;
  message: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_REVERSED' | 'WORKER_PAYMENT' | 'LOW_STOCK' | 'OVERPAYMENT' | 'ALERT';
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['PAYMENT_RECEIVED', 'PAYMENT_REVERSED', 'WORKER_PAYMENT', 'LOW_STOCK', 'OVERPAYMENT', 'ALERT'],
      default: 'ALERT',
    },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// AUDIT LOG MODEL
// ----------------------------------------------------
export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId | string;
  projectId?: Types.ObjectId;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'Admin' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.Mixed },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// ----------------------------------------------------
// COMPANY SETTINGS MODEL
// ----------------------------------------------------
export interface ICompanySettings extends Document {
  companyName: string;
  directorName?: string;
  tagline?: string;
  licenseNumber?: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  defaultCurrency: string;
  currencySymbol: string;
  receiptPrefix: string;
  invoicePrefix: string;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, default: 'ARAMBH CONSTRUCTION' },
    directorName: { type: String, default: 'Er. Sudarshan Bajrang Naik' },
    tagline: { type: String, default: 'इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर' },
    licenseNumber: { type: String, default: 'PWD/KOP/2021/CLASS-A/0942' },
    logoUrl: { type: String, default: '/logo.jpg' },
    phone: { type: String, default: '+917796853434' },
    email: { type: String, default: 'arambhconstruction9977@gmail.com' },
    address: { type: String, default: 'At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, PIN 416209' },
    gstNumber: { type: String, default: '27AAQFA4918L1Z8' },
    defaultCurrency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    receiptPrefix: { type: String, default: 'ARAMBH-REC-' },
    invoicePrefix: { type: String, default: 'ARAMBH-INV-' },
  },
  { timestamps: true }
);

// Exports
export const User = mongoose.model<IUser>('User', UserSchema);
export const Project = mongoose.model<IProject>('Project', ProjectSchema);
export const Site = mongoose.model<ISite>('Site', SiteSchema);
export const ClientPayment = mongoose.model<IClientPayment>('ClientPayment', ClientPaymentSchema);
export const Worker = mongoose.model<IWorker>('Worker', WorkerSchema);
export const WorkType = mongoose.model<IWorkType>('WorkType', WorkTypeSchema);
export const WorkLog = mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);
export const WorkerPayment = mongoose.model<IWorkerPayment>('WorkerPayment', WorkerPaymentSchema);
export const Material = mongoose.model<IMaterial>('Material', MaterialSchema);
export const MaterialPurchase = mongoose.model<IMaterialPurchase>('MaterialPurchase', MaterialPurchaseSchema);
export const InventoryTransaction = mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);
export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
export const VendorPayment = mongoose.model<IVendorPayment>('VendorPayment', VendorPaymentSchema);
export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
export const DocumentItem = mongoose.model<IDocumentItem>('DocumentItem', DocumentItemSchema);
export const SitePhoto = mongoose.model<ISitePhoto>('SitePhoto', SitePhotoSchema);
export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const CompanySettings = mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema);

// Re-export Work Schedule & Labor models
export * from './workSchedule.ts';
export * from './workActivityDefinition.ts';

