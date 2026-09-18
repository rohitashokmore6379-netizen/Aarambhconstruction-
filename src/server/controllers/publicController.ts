import { Request, Response } from 'express';
import { Project, Inquiry } from '../models/index.ts';

export async function getPublicProjects(req: Request, res: Response) {
  try {
    const projects = await Project.find({ isPublic: true })
      .select('projectName projectType location description publicImages progressPercentage publicStatus createdAt')
      .sort({ createdAt: -1 });

    const sanitized = projects.map((p) => ({
      _id: p._id,
      projectName: p.projectName,
      projectType: p.projectType,
      location: p.location,
      description: p.description,
      publicImages: p.publicImages,
      publicProgress: p.progressPercentage,
      publicStatus: p.publicStatus,
    }));

    return res.json({
      success: true,
      data: sanitized,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPublicProjectById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, isPublic: true })
      .select('projectName projectType location description publicImages progressPercentage publicStatus createdAt');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Public project not found' });
    }

    const sanitized = {
      _id: project._id,
      projectName: project.projectName,
      projectType: project.projectType,
      location: project.location,
      description: project.description,
      publicImages: project.publicImages,
      publicProgress: project.progressPercentage,
      publicStatus: project.publicStatus,
    };

    return res.json({
      success: true,
      data: sanitized,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitInquiry(req: Request, res: Response) {
  try {
    const { name, email, phone, projectType, location, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and message are required',
      });
    }

    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      projectType: projectType || 'Residential',
      location: location || '',
      message: message.trim(),
      status: 'NEW',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Arambh Construction. Our senior engineering consultant will contact you within 24 hours.',
      inquiryId: inquiry._id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
