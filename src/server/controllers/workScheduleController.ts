import { Request, Response } from 'express';
import {
  WorkSchedule,
  WorkProgressUpdate,
  WorkImage,
  WorkQuantityRecord,
  WorkLaborRecord,
  Project,
  Site,
  Worker,
} from '../models/index.ts';
import { DEFAULT_CONSTRUCTION_ACTIVITIES } from '../../data/constructionActivities.ts';
import { createAuditLog } from '../services/auditService.ts';

// 1. Get Predefined 26 Activity Template Master List
export async function getPredefinedActivities(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      data: DEFAULT_CONSTRUCTION_ACTIVITIES,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 2. Initialize / Bulk Generate Work Schedule for a Project
export async function initializeProjectSchedule(req: Request, res: Response) {
  try {
    const { projectId, siteId, startDate, durationPerActivityDays = 7 } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let siteName = '';
    if (siteId) {
      const site = await Site.findById(siteId);
      if (site) siteName = site.siteName;
    }

    // Check if schedules already exist
    const existing = await WorkSchedule.find({ projectId });
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Work schedule already initialized for this project. Use add or edit to modify.',
        count: existing.length,
      });
    }

    const baseDate = startDate ? new Date(startDate) : new Date();
    const createdSchedules = [];

    for (const act of DEFAULT_CONSTRUCTION_ACTIVITIES) {
      const plannedStart = new Date(baseDate);
      plannedStart.setDate(plannedStart.getDate() + (act.order - 1) * durationPerActivityDays);

      const plannedEnd = new Date(plannedStart);
      plannedEnd.setDate(plannedEnd.getDate() + (durationPerActivityDays - 1));

      const schedule = await WorkSchedule.create({
        projectId: project._id,
        projectName: project.projectName,
        siteId: siteId || undefined,
        siteName: siteName || undefined,
        workName: act.name,
        workOrder: act.order,
        description: act.shortDefinition,
        plannedStartDate: plannedStart,
        plannedEndDate: plannedEnd,
        status: act.order === 1 ? 'SCHEDULED' : 'NOT_STARTED',
        progressPercentage: 0,
        priority: act.order <= 5 ? 'CRITICAL' : act.order <= 15 ? 'HIGH' : 'MEDIUM',
        unit: act.defaultUnit,
        targetQuantity: 0,
        completedQuantity: 0,
        prerequisites: act.prerequisites,
        createdBy: (req as any).user?._id,
      });

      createdSchedules.push(schedule);
    }

    await createAuditLog({
      userId: (req as any).user?._id,
      userName: (req as any).user?.name || 'Admin',
      action: 'INITIALIZE_SCHEDULE',
      entityType: 'WorkSchedule',
      entityId: project._id.toString(),
      description: `Initialized full 26-stage construction schedule for project ${project.projectName}`,
    });

    return res.status(201).json({
      success: true,
      message: `Initialized ${createdSchedules.length} construction activities successfully.`,
      data: createdSchedules,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 3. Get Schedules (with filtering by project, site, status, search)
export async function getWorkSchedules(req: Request, res: Response) {
  try {
    const { projectId, siteId, status, priority, search } = req.query;
    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (search) {
      filter.$or = [
        { workName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { assignedTeam: { $regex: search, $options: 'i' } },
      ];
    }

    const schedules = await WorkSchedule.find(filter)
      .sort({ workOrder: 1, plannedStartDate: 1 })
      .populate('assignedWorkerIds', 'name phone skill role')
      .lean();

    return res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 4. Get Single Work Schedule with full details (Images, labor, quantity, history)
export async function getWorkScheduleById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schedule = await WorkSchedule.findById(id)
      .populate('projectId', 'projectName projectCode location client')
      .populate('siteId', 'siteName location')
      .populate('assignedWorkerIds', 'name phone skill role dailyWageRate')
      .lean();

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const [images, laborRecords, quantityRecords, history] = await Promise.all([
      WorkImage.find({ workScheduleId: id }).sort({ uploadedAt: -1 }).lean(),
      WorkLaborRecord.find({ workScheduleId: id }).sort({ date: -1 }).lean(),
      WorkQuantityRecord.find({ workScheduleId: id }).sort({ date: -1 }).lean(),
      WorkProgressUpdate.find({ workScheduleId: id }).sort({ createdAt: -1 }).lean(),
    ]);

    // Find master activity metadata for completion criteria and stages
    const activityDef = DEFAULT_CONSTRUCTION_ACTIVITIES.find(
      (a) => a.name.toLowerCase().trim() === schedule.workName.toLowerCase().trim()
    );

    return res.json({
      success: true,
      data: {
        ...schedule,
        images,
        laborRecords,
        quantityRecords,
        history,
        activityDef,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 5. Create Custom Work Schedule Item
export async function createWorkSchedule(req: Request, res: Response) {
  try {
    const {
      projectId,
      siteId,
      workName,
      workOrder,
      description,
      plannedStartDate,
      plannedEndDate,
      status,
      priority,
      assignedTeam,
      assignedWorkerIds,
      targetQuantity,
      unit,
      remarks,
      prerequisites,
    } = req.body;

    if (!projectId || !workName || !plannedStartDate || !plannedEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Project, Work Name, Planned Start Date and End Date are required',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    let siteName = '';
    if (siteId) {
      const site = await Site.findById(siteId);
      if (site) siteName = site.siteName;
    }

    // Auto calculate order if not specified
    let order = Number(workOrder);
    if (!order) {
      const maxOrder = await WorkSchedule.findOne({ projectId }).sort({ workOrder: -1 }).select('workOrder');
      order = maxOrder ? maxOrder.workOrder + 1 : 1;
    }

    const schedule = await WorkSchedule.create({
      projectId,
      projectName: project.projectName,
      siteId: siteId || undefined,
      siteName: siteName || undefined,
      workName,
      workOrder: order,
      description,
      plannedStartDate: new Date(plannedStartDate),
      plannedEndDate: new Date(plannedEndDate),
      status: status || 'NOT_STARTED',
      progressPercentage: 0,
      priority: priority || 'MEDIUM',
      assignedTeam,
      assignedWorkerIds: assignedWorkerIds || [],
      targetQuantity: Number(targetQuantity) || 0,
      completedQuantity: 0,
      unit: unit || 'Sq.ft',
      remarks,
      prerequisites: prerequisites || [],
      createdBy: (req as any).user?._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Work schedule activity created successfully',
      data: schedule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 6. Update Work Schedule (Details, dates, workers, etc.)
export async function updateWorkSchedule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const updates = req.body;
    if (updates.plannedStartDate) updates.plannedStartDate = new Date(updates.plannedStartDate);
    if (updates.plannedEndDate) updates.plannedEndDate = new Date(updates.plannedEndDate);
    if (updates.actualStartDate) updates.actualStartDate = new Date(updates.actualStartDate);
    if (updates.actualEndDate) updates.actualEndDate = new Date(updates.actualEndDate);

    Object.assign(schedule, updates);
    await schedule.save();

    return res.json({
      success: true,
      message: 'Work schedule updated successfully',
      data: schedule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 7. Update Progress Percentage & Status (with Audit History)
export async function updateWorkProgress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { progressPercentage, status, remarks, actualStartDate, actualEndDate } = req.body;

    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const previousProgress = schedule.progressPercentage;
    const previousStatus = schedule.status;

    const newProgress = Number(progressPercentage);
    schedule.progressPercentage = Math.min(100, Math.max(0, newProgress));

    if (status) {
      schedule.status = status;
    } else {
      if (newProgress === 100) schedule.status = 'COMPLETED';
      else if (newProgress > 0 && schedule.status === 'NOT_STARTED') schedule.status = 'IN_PROGRESS';
    }

    if (actualStartDate) schedule.actualStartDate = new Date(actualStartDate);
    if (newProgress > 0 && !schedule.actualStartDate) schedule.actualStartDate = new Date();

    if (actualEndDate) schedule.actualEndDate = new Date(actualEndDate);
    if (newProgress === 100 && !schedule.actualEndDate) schedule.actualEndDate = new Date();

    if (remarks) schedule.remarks = remarks;

    await schedule.save();

    // Log progress history
    await WorkProgressUpdate.create({
      workScheduleId: schedule._id,
      projectId: schedule.projectId,
      previousProgress,
      newProgress: schedule.progressPercentage,
      previousStatus,
      newStatus: schedule.status,
      remarks,
      updatedBy: (req as any).user?.name || 'Er. Sudarshan Bajrang Naik',
      updatedById: (req as any).user?._id,
    });

    // Update parent project overall progress
    await syncProjectOverallProgress(schedule.projectId);

    return res.json({
      success: true,
      message: 'Work progress updated successfully',
      data: schedule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 8. Confirm Final Completion of Activity
export async function confirmWorkCompletion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { completionRemarks } = req.body;

    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    schedule.status = 'COMPLETED';
    schedule.progressPercentage = 100;
    if (schedule.targetQuantity && schedule.targetQuantity > 0) {
      schedule.completedQuantity = schedule.targetQuantity;
    }
    if (!schedule.actualEndDate) schedule.actualEndDate = new Date();
    schedule.completionRemarks = completionRemarks || 'Verified and approved by Chief Engineer.';
    schedule.confirmedCompletedAt = new Date();
    schedule.confirmedBy = (req as any).user?._id;

    await schedule.save();

    await WorkProgressUpdate.create({
      workScheduleId: schedule._id,
      projectId: schedule.projectId,
      previousProgress: schedule.progressPercentage,
      newProgress: 100,
      previousStatus: schedule.status,
      newStatus: 'COMPLETED',
      remarks: `Official completion confirmed: ${schedule.completionRemarks}`,
      updatedBy: (req as any).user?.name || 'Er. Sudarshan Bajrang Naik',
      updatedById: (req as any).user?._id,
    });

    await syncProjectOverallProgress(schedule.projectId);

    return res.json({
      success: true,
      message: `Activity '${schedule.workName}' marked as completed and verified.`,
      data: schedule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 9. Delete Work Schedule Item
export async function deleteWorkSchedule(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const projectId = schedule.projectId;
    await Promise.all([
      WorkSchedule.findByIdAndDelete(id),
      WorkProgressUpdate.deleteMany({ workScheduleId: id }),
      WorkImage.deleteMany({ workScheduleId: id }),
      WorkQuantityRecord.deleteMany({ workScheduleId: id }),
      WorkLaborRecord.deleteMany({ workScheduleId: id }),
    ]);

    await syncProjectOverallProgress(projectId);

    return res.json({
      success: true,
      message: 'Work schedule activity deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 10. Add Work Image (Before / During / Completed)
export async function addWorkImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { imageUrl, caption, imageType } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const image = await WorkImage.create({
      workScheduleId: schedule._id,
      projectId: schedule.projectId,
      imageUrl,
      caption,
      imageType: imageType || 'DURING',
      uploadedBy: (req as any).user?.name || 'Admin',
      uploadedById: (req as any).user?._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Image logged to construction activity successfully',
      data: image,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 11. Log Daily Quantity Achieved
export async function logWorkQuantity(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { date, quantity, unit, workerTeam, remarks } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const record = await WorkQuantityRecord.create({
      projectId: schedule.projectId,
      workScheduleId: schedule._id,
      date: date ? new Date(date) : new Date(),
      quantity: Number(quantity),
      unit: unit || schedule.unit || 'Sq.ft',
      workerTeam,
      remarks,
      createdBy: (req as any).user?.name || 'Admin',
    });

    // Recompute total completed quantity for schedule
    const allRecords = await WorkQuantityRecord.find({ workScheduleId: schedule._id });
    const totalQty = allRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
    schedule.completedQuantity = totalQty;

    // If target quantity exists, recalculate progress percentage automatically
    if (schedule.targetQuantity && schedule.targetQuantity > 0) {
      const calcProgress = Math.min(100, Math.round((totalQty / schedule.targetQuantity) * 100));
      schedule.progressPercentage = calcProgress;
      if (calcProgress >= 100) schedule.status = 'COMPLETED';
      else if (calcProgress > 0 && schedule.status === 'NOT_STARTED') schedule.status = 'IN_PROGRESS';
    }

    await schedule.save();
    await syncProjectOverallProgress(schedule.projectId);

    return res.status(201).json({
      success: true,
      message: 'Work quantity logged successfully',
      data: record,
      schedule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 12. Log Labor / Manpower for Activity
export async function logWorkLabor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      date,
      workerTeam,
      workers = [],
      totalWorkers,
      skilledWorkers,
      unskilledWorkers,
      regularHours = 8,
      overtimeHours = 0,
      supervisor,
      shift = 'DAY',
      remarks,
      estimatedLaborCost = 0,
      paymentStatus = 'UNPAID',
    } = req.body;

    const schedule = await WorkSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Work schedule item not found' });
    }

    const numTotal = Number(totalWorkers) || (Array.isArray(workers) ? workers.reduce((s: number, w: any) => s + (Number(w.count) || 1), 0) : 1);
    const totHours = (Number(regularHours) || 8) + (Number(overtimeHours) || 0);

    const record = await WorkLaborRecord.create({
      projectId: schedule.projectId,
      workScheduleId: schedule._id,
      date: date ? new Date(date) : new Date(),
      workerTeam: workerTeam || schedule.assignedTeam,
      workers,
      totalWorkers: numTotal,
      skilledWorkers: Number(skilledWorkers) || 0,
      unskilledWorkers: Number(unskilledWorkers) || 0,
      regularHours: Number(regularHours) || 8,
      overtimeHours: Number(overtimeHours) || 0,
      totalLaborHours: totHours * numTotal,
      supervisor: supervisor || 'Er. Sudarshan Bajrang Naik',
      shift,
      remarks,
      estimatedLaborCost: Number(estimatedLaborCost) || 0,
      paymentStatus,
      createdBy: (req as any).user?.name || 'Admin',
    });

    return res.status(201).json({
      success: true,
      message: 'Labor log recorded successfully for work schedule activity',
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 13. Get Overview Summary / Metrics across all work schedules
export async function getScheduleMetrics(req: Request, res: Response) {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    const schedules = await WorkSchedule.find(filter).lean();

    const total = schedules.length;
    const completed = schedules.filter((s) => s.status === 'COMPLETED').length;
    const inProgress = schedules.filter((s) => s.status === 'IN_PROGRESS').length;
    const scheduled = schedules.filter((s) => s.status === 'SCHEDULED' || s.status === 'NOT_STARTED').length;
    const delayed = schedules.filter((s) => s.status === 'DELAYED').length;

    const avgProgress = total > 0 ? Math.round(schedules.reduce((sum, s) => sum + s.progressPercentage, 0) / total) : 0;

    // Upcoming deadlines in next 14 days
    const now = new Date();
    const future14 = new Date();
    future14.setDate(future14.getDate() + 14);

    const upcoming = schedules
      .filter((s) => s.status !== 'COMPLETED' && new Date(s.plannedEndDate) <= future14)
      .sort((a, b) => new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime())
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        scheduled,
        delayed,
        avgProgress,
        upcoming,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// Helper: Synchronize Project progress percentage from work schedule activities
async function syncProjectOverallProgress(projectId: any) {
  try {
    const items = await WorkSchedule.find({ projectId }).select('progressPercentage');
    if (items.length === 0) return;
    const avg = Math.round(items.reduce((s, i) => s + (i.progressPercentage || 0), 0) / items.length);
    await Project.findByIdAndUpdate(projectId, {
      progressPercentage: avg,
      ...(avg === 100 ? { status: 'COMPLETED' } : {}),
    });
  } catch (e) {
    // silent catch
  }
}
