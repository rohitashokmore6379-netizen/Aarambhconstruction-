import { Response } from 'express';
import { Site, Project } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { calculateSiteFinancials } from '../services/financialService.ts';
import { createAuditLog } from '../services/auditService.ts';

export async function getSites(req: AuthRequest, res: Response) {
  try {
    const { projectId, search } = req.query;
    const filter: any = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (search && typeof search === 'string') {
      filter.siteName = new RegExp(search.trim(), 'i');
    }

    const sites = await Site.find(filter).populate('projectId', 'projectName projectCode').sort({ createdAt: -1 });

    const sitesWithFinancials = await Promise.all(
      sites.map(async (s) => {
        try {
          const fin = await calculateSiteFinancials(s._id.toString());
          return {
            ...s.toObject(),
            financials: fin,
          };
        } catch {
          return {
            ...s.toObject(),
            financials: null,
          };
        }
      })
    );

    return res.json({
      success: true,
      data: sitesWithFinancials,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSiteById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const site = await Site.findById(id).populate('projectId', 'projectName projectCode contractValue');
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    const financials = await calculateSiteFinancials(site._id.toString());

    return res.json({
      success: true,
      data: {
        ...site.toObject(),
        financials,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createSite(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteName, location, address, siteOwner, ownerContact, description, totalCost } = req.body;
    if (!projectId || !siteName || !location || !siteOwner) {
      return res.status(400).json({
        success: false,
        message: 'Project, Site Name, Location, and Site Owner are required.',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Target project does not exist.' });
    }

    const site = await Site.create({
      projectId,
      siteName: siteName.trim(),
      location: location.trim(),
      address,
      siteOwner: siteOwner.trim(),
      ownerContact,
      description,
      totalCost: Number(totalCost) || 0,
      status: 'ACTIVE',
      createdBy: req.user?.id,
    });

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'SITE_CREATED',
      entityType: 'Site',
      entityId: site._id.toString(),
      projectId: project._id.toString(),
      description: `Created site "${site.siteName}" for project "${project.projectName}"`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: site,
      message: 'Site created successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateSite(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const site = await Site.findById(id);
    if (!site) {
      return res.status(404).json({ success: false, message: 'Site not found' });
    }

    Object.assign(site, req.body);
    if (req.body.totalCost !== undefined) {
      site.totalCost = Number(req.body.totalCost);
    }
    if (req.body.progressPercentage !== undefined) {
      site.progressPercentage = Number(req.body.progressPercentage);
    }

    await site.save();

    await createAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'SITE_UPDATED',
      entityType: 'Site',
      entityId: site._id.toString(),
      projectId: site.projectId.toString(),
      description: `Updated site "${site.siteName}" status to ${site.status}`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: site,
      message: 'Site updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getSiteFinancialSummary(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const financials = await calculateSiteFinancials(id);
    return res.json({
      success: true,
      data: financials,
    });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
}
