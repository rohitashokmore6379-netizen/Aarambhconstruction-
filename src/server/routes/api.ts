import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

import * as authCtrl from '../controllers/authController.ts';
import * as publicCtrl from '../controllers/publicController.ts';
import * as projectCtrl from '../controllers/projectController.ts';
import * as siteCtrl from '../controllers/siteController.ts';
import * as clientPaymentCtrl from '../controllers/clientPaymentController.ts';
import * as workerCtrl from '../controllers/workerController.ts';
import * as materialCtrl from '../controllers/materialController.ts';
import * as vendorCtrl from '../controllers/vendorController.ts';
import * as expenseCtrl from '../controllers/expenseController.ts';
import * as paymentCtrl from '../controllers/paymentController.ts';
import * as dashboardCtrl from '../controllers/dashboardController.ts';
import * as searchCtrl from '../controllers/searchController.ts';
import * as notificationCtrl from '../controllers/notificationController.ts';
import * as auditCtrl from '../controllers/auditController.ts';
import * as settingsCtrl from '../controllers/settingsController.ts';
import * as workScheduleCtrl from '../controllers/workScheduleController.ts';

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (No Auth Required)
// ==========================================
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.post('/auth/forgot-password/request', authCtrl.forgotPasswordRequest);
router.post('/auth/forgot-password/reset', authCtrl.forgotPasswordReset);

router.get('/public/projects', publicCtrl.getPublicProjects);
router.get('/public/projects/:id', publicCtrl.getPublicProjectById);
router.post('/public/inquiry', publicCtrl.submitInquiry);

// ==========================================
// 2. ADMIN PROTECTED ROUTES (Requires JWT + ROLE_ADMIN)
// ==========================================
const admin = Router();
admin.use(authenticate, requireAdmin);

// Admin Profile & Security Credentials
admin.get('/profile', authCtrl.getMe);
admin.put('/profile', authCtrl.updateAdminProfile);
admin.put('/change-password', authCtrl.changeAdminPassword);

// Dashboard & Analytics
admin.get('/dashboard', dashboardCtrl.getDashboardMetrics);

// Global Search
admin.get('/search', searchCtrl.globalSearch);

// Projects
admin.get('/projects', projectCtrl.getProjects);
admin.get('/projects/:id', projectCtrl.getProjectById);
admin.post('/projects', projectCtrl.createProject);
admin.put('/projects/:id', projectCtrl.updateProject);
admin.get('/projects/:id/financial-summary', projectCtrl.getProjectFinancialSummary);
admin.get('/projects/:id/payments', projectCtrl.getProjectPayments);

// Sites
admin.get('/sites', siteCtrl.getSites);
admin.get('/sites/:id', siteCtrl.getSiteById);
admin.post('/sites', siteCtrl.createSite);
admin.put('/sites/:id', siteCtrl.updateSite);
admin.get('/sites/:id/financial-summary', siteCtrl.getSiteFinancialSummary);

// Site Owner / Client Payments (Receipts)
admin.get('/client-payments', clientPaymentCtrl.getClientPayments);
admin.post('/client-payments', clientPaymentCtrl.receiveClientPayment);
admin.post('/client-payments/:id/reverse', clientPaymentCtrl.reverseClientPayment);

// Workers & Wages
admin.get('/workers', workerCtrl.getWorkers);
admin.post('/workers', workerCtrl.createWorker);
admin.put('/workers/:id', workerCtrl.updateWorker);

// Work Types
admin.get('/work-types', workerCtrl.getWorkTypes);
admin.post('/work-types', workerCtrl.createWorkType);

// Work Logs
admin.get('/work-logs', workerCtrl.getWorkLogs);
admin.post('/work-logs', workerCtrl.createWorkLog);

// Worker Payments
admin.get('/worker-payments', workerCtrl.getWorkerPayments);
admin.post('/worker-payments', workerCtrl.createWorkerPayment);
admin.post('/worker-payments/:id/reverse', workerCtrl.reverseWorkerPayment);

// Materials Catalog
admin.get('/materials', materialCtrl.getMaterials);
admin.post('/materials', materialCtrl.createMaterial);
admin.put('/materials/:id', materialCtrl.updateMaterial);

// Material Purchases
admin.get('/material-purchases', materialCtrl.getMaterialPurchases);
admin.post('/material-purchases', materialCtrl.createMaterialPurchase);
admin.post('/material-purchases/:id/reverse', materialCtrl.reverseMaterialPurchase);

// Inventory
admin.get('/inventory/transactions', materialCtrl.getInventoryTransactions);
admin.post('/inventory/adjust', materialCtrl.adjustInventory);

// Vendors
admin.get('/vendors', vendorCtrl.getVendors);
admin.post('/vendors', vendorCtrl.createVendor);
admin.put('/vendors/:id', vendorCtrl.updateVendor);

// Vendor Payments
admin.get('/vendor-payments', vendorCtrl.getVendorPayments);
admin.post('/vendor-payments', vendorCtrl.createVendorPayment);
admin.post('/vendor-payments/:id/reverse', vendorCtrl.reverseVendorPayment);

// Expenses
admin.get('/expenses', expenseCtrl.getExpenses);
admin.post('/expenses', expenseCtrl.createExpense);
admin.post('/expenses/:id/reverse', expenseCtrl.reverseExpense);

// Unified Multi-Ledger Payments
admin.get('/payments', paymentCtrl.getAllUnifiedPayments);

// Notifications
admin.get('/notifications', notificationCtrl.getNotifications);
admin.patch('/notifications/:id/read', notificationCtrl.markNotificationRead);
admin.post('/notifications/read-all', notificationCtrl.markAllNotificationsRead);

// Audit Logs
admin.get('/audit-logs', auditCtrl.getAuditLogs);

// Settings & Documents
admin.get('/company-settings', settingsCtrl.getCompanySettings);
admin.put('/company-settings', settingsCtrl.updateCompanySettings);
admin.post('/company-settings/reset', settingsCtrl.resetData);
admin.get('/documents', settingsCtrl.getDocuments);
admin.post('/documents', settingsCtrl.createDocument);

// ==========================================
// WORK SCHEDULE MODULE ROUTES
// ==========================================
admin.get('/work-schedules/activities-template', workScheduleCtrl.getPredefinedActivities);
admin.get('/work-schedules/metrics', workScheduleCtrl.getScheduleMetrics);
admin.post('/work-schedules/initialize', workScheduleCtrl.initializeProjectSchedule);
admin.get('/work-schedules', workScheduleCtrl.getWorkSchedules);
admin.post('/work-schedules', workScheduleCtrl.createWorkSchedule);
admin.get('/work-schedules/:id', workScheduleCtrl.getWorkScheduleById);
admin.put('/work-schedules/:id', workScheduleCtrl.updateWorkSchedule);
admin.delete('/work-schedules/:id', workScheduleCtrl.deleteWorkSchedule);
admin.patch('/work-schedules/:id/progress', workScheduleCtrl.updateWorkProgress);
admin.post('/work-schedules/:id/confirm-completion', workScheduleCtrl.confirmWorkCompletion);
admin.post('/work-schedules/:id/images', workScheduleCtrl.addWorkImage);
admin.post('/work-schedules/:id/quantity', workScheduleCtrl.logWorkQuantity);
admin.post('/work-schedules/:id/labor', workScheduleCtrl.logWorkLabor);

router.use('/admin', admin);

export default router;
