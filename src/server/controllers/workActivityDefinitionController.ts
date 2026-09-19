import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { WorkActivityDefinitionService } from '../services/workActivityDefinitionService.ts';
import { createAuditLog } from '../services/auditService.ts';

export async function getWorkActivityDefinitions(req: AuthRequest, res: Response) {
  try {
    const { category, status, search } = req.query;
    const definitions = await WorkActivityDefinitionService.getAllDefinitions({
      category: category as string,
      status: status as string,
      search: search as string,
    });
    return res.json({ success: true, data: definitions });
  } catch (err: any) {
    console.error('Error fetching work activity definitions:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch activity definitions.' });
  }
}

export async function getWorkActivityDefinitionById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const definition = await WorkActivityDefinitionService.getDefinitionById(id);
    if (!definition) {
      return res.status(404).json({ success: false, message: 'Activity definition not found.' });
    }
    return res.json({ success: true, data: definition });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createWorkActivityDefinition(req: AuthRequest, res: Response) {
  try {
    const { name, definition, order, category, completionCriteria, unit, standardDurationDays, typicalTrades, safetyPrecautions, inspectionRequired } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Task Template Name is required.' });
    }

    if (!definition || !String(definition).trim()) {
      return res.status(400).json({ success: false, message: 'Task Definition / Scope of Work is required.' });
    }

    const created = await WorkActivityDefinitionService.createDefinition(
      {
        name,
        definition,
        order: order !== undefined ? Number(order) : undefined,
        category,
        completionCriteria,
        unit,
        standardDurationDays: Number(standardDurationDays) || 7,
        typicalTrades,
        safetyPrecautions,
        inspectionRequired: inspectionRequired !== undefined ? Boolean(inspectionRequired) : true,
      },
      req.user?.id
    );

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORK_ACTIVITY_DEFINITION_CREATED',
      entityType: 'WorkActivityDefinition',
      entityId: created._id.toString(),
      description: `Created new work activity template "${created.name}" (Order #${created.order})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Work Activity Definition created successfully.',
    });
  } catch (err: any) {
    console.error('Error creating work activity definition:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create activity definition.' });
  }
}

export async function updateWorkActivityDefinition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updated = await WorkActivityDefinitionService.updateDefinition(id, req.body);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Activity definition not found.' });
    }

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORK_ACTIVITY_DEFINITION_UPDATED',
      entityType: 'WorkActivityDefinition',
      entityId: updated._id.toString(),
      description: `Updated work activity template "${updated.name}" (Order #${updated.order})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Work Activity Definition updated successfully.',
    });
  } catch (err: any) {
    console.error('Error updating work activity definition:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to update activity definition.' });
  }
}

export async function deleteWorkActivityDefinition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const hard = req.query.hard === 'true';
    const success = await WorkActivityDefinitionService.deleteDefinition(id, hard);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Activity definition not found.' });
    }

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'WORK_ACTIVITY_DEFINITION_DELETED',
      entityType: 'WorkActivityDefinition',
      entityId: id,
      description: `Archived/Deleted work activity template (ID: ${id})`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Work Activity Definition deleted successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function reorderWorkActivityDefinitions(req: AuthRequest, res: Response) {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds must be an array of IDs.' });
    }

    await WorkActivityDefinitionService.reorderDefinitions(orderedIds);

    return res.json({
      success: true,
      message: 'Activity templates reordered successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function seedWorkActivityDefinitions(req: AuthRequest, res: Response) {
  try {
    const force = req.query.force === 'true';
    const result = await WorkActivityDefinitionService.seedDefaultDefinitions(force);

    return res.json({
      success: true,
      data: result,
      message: `Standard construction task templates initialized (${result.count} templates loaded).`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
