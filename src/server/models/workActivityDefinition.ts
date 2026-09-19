import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkActivityDefinition extends Document {
  name: string;
  order: number;
  category: 'PRE_CONSTRUCTION' | 'SUBSTRUCTURE' | 'SUPERSTRUCTURE' | 'MEP_SERVICES' | 'FINISHING' | 'EXTERNAL_WORKS' | 'OTHER';
  definition: string;
  completionCriteria: string[];
  unit: string;
  standardDurationDays: number;
  typicalTrades: string[];
  safetyPrecautions: string[];
  inspectionRequired: boolean;
  isDefaultTemplate: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkActivityDefinitionSchema = new Schema<IWorkActivityDefinition>(
  {
    name: { type: String, required: true, trim: true, index: true },
    order: { type: Number, required: true, default: 1, index: true },
    category: {
      type: String,
      enum: ['PRE_CONSTRUCTION', 'SUBSTRUCTURE', 'SUPERSTRUCTURE', 'MEP_SERVICES', 'FINISHING', 'EXTERNAL_WORKS', 'OTHER'],
      default: 'SUPERSTRUCTURE',
      index: true,
    },
    definition: { type: String, required: true, trim: true },
    completionCriteria: [{ type: String, trim: true }],
    unit: { type: String, default: 'Sq.ft', trim: true },
    standardDurationDays: { type: Number, default: 7, min: 1 },
    typicalTrades: [{ type: String, trim: true }],
    safetyPrecautions: [{ type: String, trim: true }],
    inspectionRequired: { type: Boolean, default: true },
    isDefaultTemplate: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WorkActivityDefinitionSchema.index({ order: 1 });
WorkActivityDefinitionSchema.index({ category: 1, order: 1 });

export const WorkActivityDefinition = mongoose.model<IWorkActivityDefinition>(
  'WorkActivityDefinition',
  WorkActivityDefinitionSchema
);
