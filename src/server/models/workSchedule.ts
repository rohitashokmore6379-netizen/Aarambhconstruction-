import mongoose, { Schema, Document, Types } from 'mongoose';

// ====================================================
// 1. WORK SCHEDULE MODEL
// ====================================================
export interface IWorkSchedule extends Document {
  projectId: Types.ObjectId;
  projectName?: string;
  siteId?: Types.ObjectId;
  siteName?: string;
  workName: string;
  workOrder: number;
  description?: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'NOT_STARTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  progressPercentage: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTeam?: string;
  assignedWorkerIds?: Types.ObjectId[];
  targetQuantity?: number;
  completedQuantity?: number;
  unit?: string;
  remarks?: string;
  prerequisites?: string[];
  completionRemarks?: string;
  confirmedCompletedAt?: Date;
  confirmedBy?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkScheduleSchema = new Schema<IWorkSchedule>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectName: { type: String, trim: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', index: true },
    siteName: { type: String, trim: true },
    workName: { type: String, required: true, trim: true },
    workOrder: { type: Number, required: true, default: 1 },
    description: { type: String, trim: true },
    plannedStartDate: { type: Date, required: true, index: true },
    plannedEndDate: { type: Date, required: true, index: true },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'DELAYED', 'CANCELLED'],
      default: 'NOT_STARTED',
      index: true,
    },
    progressPercentage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assignedTeam: { type: String, trim: true },
    assignedWorkerIds: [{ type: Schema.Types.ObjectId, ref: 'Worker' }],
    targetQuantity: { type: Number, default: 0, min: 0 },
    completedQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'Sq.ft', trim: true },
    remarks: { type: String, trim: true },
    prerequisites: [{ type: String }],
    completionRemarks: { type: String, trim: true },
    confirmedCompletedAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WorkScheduleSchema.index({ projectId: 1, workOrder: 1 });
WorkScheduleSchema.index({ projectId: 1, status: 1 });

// ====================================================
// 2. PROGRESS UPDATE HISTORY MODEL
// ====================================================
export interface IWorkProgressUpdate extends Document {
  workScheduleId: Types.ObjectId;
  projectId: Types.ObjectId;
  previousProgress: number;
  newProgress: number;
  previousStatus: string;
  newStatus: string;
  remarks?: string;
  updatedBy: string;
  updatedById?: Types.ObjectId;
  createdAt: Date;
}

const WorkProgressUpdateSchema = new Schema<IWorkProgressUpdate>(
  {
    workScheduleId: { type: Schema.Types.ObjectId, ref: 'WorkSchedule', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    previousProgress: { type: Number, required: true, min: 0, max: 100 },
    newProgress: { type: Number, required: true, min: 0, max: 100 },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    remarks: { type: String, trim: true },
    updatedBy: { type: String, default: 'Admin' },
    updatedById: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ====================================================
// 3. WORK IMAGE MODEL (Before, During, Completed)
// ====================================================
export interface IWorkImage extends Document {
  workScheduleId: Types.ObjectId;
  projectId: Types.ObjectId;
  imageUrl: string;
  caption?: string;
  imageType: 'BEFORE' | 'DURING' | 'COMPLETED';
  uploadedBy?: string;
  uploadedById?: Types.ObjectId;
  uploadedAt: Date;
}

const WorkImageSchema = new Schema<IWorkImage>(
  {
    workScheduleId: { type: Schema.Types.ObjectId, ref: 'WorkSchedule', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, trim: true },
    imageType: {
      type: String,
      enum: ['BEFORE', 'DURING', 'COMPLETED'],
      default: 'DURING',
      required: true,
    },
    uploadedBy: { type: String, default: 'Admin' },
    uploadedById: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ====================================================
// 4. WORK QUANTITY LOG MODEL
// ====================================================
export interface IWorkQuantityRecord extends Document {
  projectId: Types.ObjectId;
  workScheduleId: Types.ObjectId;
  date: Date;
  quantity: number;
  unit: string;
  workerTeam?: string;
  remarks?: string;
  createdBy?: string;
  createdAt: Date;
}

const WorkQuantityRecordSchema = new Schema<IWorkQuantityRecord>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workScheduleId: { type: Schema.Types.ObjectId, ref: 'WorkSchedule', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    workerTeam: { type: String, trim: true },
    remarks: { type: String, trim: true },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

// ====================================================
// 5. DAILY LABOR / MANPOWER RECORD MODEL
// ====================================================
export interface IWorkLaborWorker {
  workerId?: Types.ObjectId;
  workerType: string;
  count: number;
  hours: number;
  overtimeHours: number;
}

export interface IWorkLaborRecord extends Document {
  projectId: Types.ObjectId;
  workScheduleId: Types.ObjectId;
  date: Date;
  workerTeam?: string;
  workers: IWorkLaborWorker[];
  totalWorkers: number;
  skilledWorkers: number;
  unskilledWorkers: number;
  regularHours: number;
  overtimeHours: number;
  totalLaborHours: number;
  supervisor?: string;
  shift: 'DAY' | 'NIGHT' | 'OVERTIME';
  remarks?: string;
  estimatedLaborCost?: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  createdBy?: string;
  createdAt: Date;
}

const WorkLaborRecordSchema = new Schema<IWorkLaborRecord>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    workScheduleId: { type: Schema.Types.ObjectId, ref: 'WorkSchedule', required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    workerTeam: { type: String, trim: true },
    workers: [
      {
        workerId: { type: Schema.Types.ObjectId, ref: 'Worker' },
        workerType: { type: String, required: true },
        count: { type: Number, required: true, default: 1, min: 0 },
        hours: { type: Number, required: true, default: 8, min: 0 },
        overtimeHours: { type: Number, default: 0, min: 0 },
      },
    ],
    totalWorkers: { type: Number, required: true, min: 0 },
    skilledWorkers: { type: Number, default: 0, min: 0 },
    unskilledWorkers: { type: Number, default: 0, min: 0 },
    regularHours: { type: Number, default: 0, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 },
    totalLaborHours: { type: Number, required: true, min: 0 },
    supervisor: { type: String, trim: true },
    shift: { type: String, enum: ['DAY', 'NIGHT', 'OVERTIME'], default: 'DAY' },
    remarks: { type: String, trim: true },
    estimatedLaborCost: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], default: 'UNPAID' },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

// Exports
export const WorkSchedule = mongoose.model<IWorkSchedule>('WorkSchedule', WorkScheduleSchema);
export const WorkProgressUpdate = mongoose.model<IWorkProgressUpdate>('WorkProgressUpdate', WorkProgressUpdateSchema);
export const WorkImage = mongoose.model<IWorkImage>('WorkImage', WorkImageSchema);
export const WorkQuantityRecord = mongoose.model<IWorkQuantityRecord>('WorkQuantityRecord', WorkQuantityRecordSchema);
export const WorkLaborRecord = mongoose.model<IWorkLaborRecord>('WorkLaborRecord', WorkLaborRecordSchema);
