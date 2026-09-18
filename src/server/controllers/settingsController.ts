import { Response } from 'express';
import { CompanySettings, DocumentItem } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { seedDatabase } from '../seed/seedData.ts';

export async function getCompanySettings(req: AuthRequest, res: Response) {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'ARAMBH CONSTRUCTION',
        tagline: 'इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर',
        directorName: 'Er. Sudarshan Bajrang Naik',
        phone: '+917796853434',
        email: 'arambhconstruction9977@gmail.com',
        address: 'At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, Maharashtra - PIN 416209',
        gstNumber: '27AAQFN4918L1Z9',
        defaultCurrency: 'INR',
        currencySymbol: '₹',
        receiptPrefix: 'AR-REC-',
        invoicePrefix: 'AR-INV-',
      });
    }
    return res.json({ success: true, data: settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCompanySettings(req: AuthRequest, res: Response) {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    Object.assign(settings, req.body);
    await settings.save();

    return res.json({ success: true, data: settings, message: 'Company settings updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDocuments(req: AuthRequest, res: Response) {
  try {
    const { projectId, siteId, entityType } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (siteId) filter.siteId = siteId;
    if (entityType) filter.entityType = entityType;

    const docs = await DocumentItem.find(filter)
      .populate('projectId', 'projectName')
      .populate('siteId', 'siteName')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: docs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    const { name, type, url, projectId, siteId, entityType, entityId, sizeBytes } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'Document name and URL are required.' });
    }

    const doc = await DocumentItem.create({
      name: name.trim(),
      type: type || 'PDF',
      url,
      projectId,
      siteId,
      entityType,
      entityId,
      sizeBytes: sizeBytes || 102400,
      uploadedBy: req.user?.id,
    });

    return res.status(201).json({ success: true, data: doc, message: 'Document uploaded.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function resetData(req: AuthRequest, res: Response) {
  try {
    await seedDatabase(true);
    return res.json({
      success: true,
      message: 'Arambh ERP refreshed with pristine data for Er. Sudarshan Bajrang Naik.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
