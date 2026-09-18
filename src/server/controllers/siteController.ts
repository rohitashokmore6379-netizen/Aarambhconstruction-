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

import { cleanObjectId } from '../utils/sanitize.js';

export async function createSite(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    const rawSiteName = body.siteName || body.name || '';
    const trimmedName = String(rawSiteName).trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Site Name is required.',
      });
    }

    let pId = cleanObjectId(body.projectId);
    let project = null;

    if (pId) {
      project = await Project.findById(pId);
    }

    if (!project) {
      // Find the first available project or create a default one
      project = await Project.findOne();
      if (!project) {
        project = await Project.create({
          projectCode: 'PRJ-001',
          projectName: `${trimmedName} Project`,
          location: body.location || 'Kolhapur, Maharashtra',
          client: { name: body.siteOwner || 'Direct Client' },
          contractValue: Number(body.totalCost) || 0,
          createdBy: req.user?.id,
        });
      }
    }

    const loc = String(body.location || body.address || project.location || 'Kolhapur, Maharashtra').trim();
    const owner = String(body.siteOwner || project.client?.name || 'Site Owner').trim();

    const site = await Site.create({
      projectId: project._id,
      siteName: trimmedName,
      location: loc,
      address: body.address || loc,
      siteOwner: owner,
      ownerContact: body.ownerContact || project.client?.phone || '',
      description: body.description || '',
      totalCost: Number(body.totalCost) || 0,
      status: body.status || 'ACTIVE',
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
