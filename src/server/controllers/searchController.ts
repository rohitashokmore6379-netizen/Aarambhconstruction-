import { Response } from 'express';
import { Project, Site, Worker, Vendor, Material, ClientPayment, DocumentItem } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function globalSearch(req: AuthRequest, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.json({
        success: true,
        data: {
          projects: [],
          sites: [],
          workers: [],
          vendors: [],
          materials: [],
          transactions: [],
          documents: [],
        },
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const [projects, sites, workers, vendors, materials, transactions, documents] = await Promise.all([
      Project.find({
        $or: [{ projectName: regex }, { projectCode: regex }, { location: regex }, { 'client.name': regex }],
      })
        .limit(5)
        .select('projectName projectCode location status contractValue client'),
      Site.find({
        $or: [{ siteName: regex }, { location: regex }, { siteOwner: regex }],
      })
        .populate('projectId', 'projectName')
        .limit(5),
      Worker.find({
        $or: [{ name: regex }, { workerCode: regex }, { phone: regex }, { skill: regex }],
      })
        .limit(5)
        .select('name workerCode phone skill status dailyWageRate'),
      Vendor.find({
        $or: [{ name: regex }, { companyName: regex }, { vendorCode: regex }, { category: regex }],
      })
        .limit(5)
        .select('name companyName vendorCode phone category'),
      Material.find({
        $or: [{ name: regex }, { category: regex }],
      })
        .limit(5)
        .select('name category currentStock unit minimumStock'),
      ClientPayment.find({
        $or: [{ receiptNumber: regex }, { transactionReference: regex }, { ownerName: regex }],
      })
        .populate('projectId', 'projectName')
        .limit(5)
        .select('receiptNumber ownerName amount paymentDate paymentMethod transactionReference'),
      DocumentItem.find({
        $or: [{ name: regex }, { type: regex }],
      })
        .populate('projectId', 'projectName')
        .limit(5)
        .select('name type url projectId siteId sizeBytes createdAt'),
    ]);

    return res.json({
      success: true,
      data: {
        projects,
        sites,
        workers,
        vendors,
        materials,
        transactions,
        documents,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
