import bcrypt from 'bcryptjs';
import {
  User,
  Project,
  Site,
  Worker,
  WorkType,
  WorkLog,
  WorkerPayment,
  Material,
  MaterialPurchase,
  InventoryTransaction,
  Vendor,
  VendorPayment,
  ClientPayment,
  Expense,
  CompanySettings,
  Notification,
  AuditLog,
} from '../models/index.ts';

export async function seedDatabase(forceRefresh = true) {
  try {
    console.log('Clearing old project and mock content for fresh Arambh Construction ERP initialization...');

    // Wipe all previous project content completely as requested
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Site.deleteMany({}),
      Worker.deleteMany({}),
      WorkType.deleteMany({}),
      WorkLog.deleteMany({}),
      WorkerPayment.deleteMany({}),
      Material.deleteMany({}),
      MaterialPurchase.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      Vendor.deleteMany({}),
      VendorPayment.deleteMany({}),
      ClientPayment.deleteMany({}),
      Expense.deleteMany({}),
      CompanySettings.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Seeding fresh enterprise data for Er. Sudarshan Bajrang Naik...');

    // 1. Seed Company Settings with exact details
    await CompanySettings.create({
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
      licenseNumber: 'PWD/KOP/2021/CLASS-A/0942',
    });

    // 2. Seed Admin Users (Both Er. Sudarshan Naik and backup login)
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    const sudarshanUser = await User.create({
      name: 'Er. Sudarshan Bajrang Naik',
      email: 'arambhconstruction9977@gmail.com',
      passwordHash,
      role: 'ROLE_ADMIN',
      phone: '+917796853434',
      status: 'ACTIVE',
    });

    // Secondary login for quick access
    await User.create({
      name: 'Er. Sudarshan Naik (Admin)',
      email: 'admin@arambh.com',
      passwordHash,
      role: 'ROLE_ADMIN',
      phone: '+917796853434',
      status: 'ACTIVE',
    });

    // 3. Work Types
    const masonWork = await WorkType.create({
      name: 'Structural Masonry & Plastering',
      code: 'WT-MASON',
      description: 'RCC framework brickwork, stone masonry, and waterproof plastering',
      standardRate: 900,
      unit: 'DAYS',
    });

    const carpenterWork = await WorkType.create({
      name: 'Centering & Plywood Shuttering',
      code: 'WT-SHUTTER',
      description: 'Beam, column and slab centering with steel props',
      standardRate: 950,
      unit: 'DAYS',
    });

    const barBenderWork = await WorkType.create({
      name: 'Steel Reinforcement Bar Bending',
      code: 'WT-STEEL',
      description: 'Fe-550D TMT cutting, bending and tying reinforcement cages',
      standardRate: 900,
      unit: 'DAYS',
    });

    const helperWork = await WorkType.create({
      name: 'Skilled Civil Labor',
      code: 'WT-HELPER',
      description: 'Concrete vibrator, batching helper, and site curing',
      standardRate: 550,
      unit: 'DAYS',
    });

    // 4. Labor Force / Workers (Local Kolhapur / Bhudargad Crew)
    const worker1 = await Worker.create({
      workerCode: 'WRK-201',
      name: 'Pandurang Naik',
      phone: '+91 94220 31821',
      role: 'Chief Mistri / Site Supervisor',
      skill: 'MISTRI',
      dailyWageRate: 950,
      joiningDate: new Date('2024-06-01'),
      status: 'ACTIVE',
      notes: 'Supervises government PWD and residential RCC structures',
    });

    const worker2 = await Worker.create({
      workerCode: 'WRK-202',
      name: 'Sambhaji Patil',
      phone: '+91 94220 55192',
      role: 'Head Shuttering Master',
      skill: 'CARPENTER',
      dailyWageRate: 950,
      joiningDate: new Date('2024-07-15'),
      status: 'ACTIVE',
    });

    const worker3 = await Worker.create({
      workerCode: 'WRK-203',
      name: 'Tanaji Kamble',
      phone: '+91 94220 88291',
      role: 'Senior Bar Bender',
      skill: 'BAR_BENDER',
      dailyWageRate: 900,
      joiningDate: new Date('2024-08-10'),
      status: 'ACTIVE',
    });

    const worker4 = await Worker.create({
      workerCode: 'WRK-204',
      name: 'Vitthal Bhosale',
      phone: '+91 94220 99482',
      role: 'Concrete Batching & Curing Labor',
      skill: 'HELPER',
      dailyWageRate: 550,
      joiningDate: new Date('2024-09-01'),
      status: 'ACTIVE',
    });

    // 5. Raw Materials Inventory
    const cement = await Material.create({
      name: 'Ultratech Super Cement (PPC 53 Grade)',
      category: 'Cement',
      unit: 'Bags',
      description: 'High durability Portland Pozzolana Cement for RCC',
      minimumStock: 60,
      currentStock: 240,
      status: 'ACTIVE',
    });

    const steel = await Material.create({
      name: 'Tata Tiscon / Jindal Fe 550D TMT Rebar',
      category: 'Steel',
      unit: 'Tons',
      description: 'Earthquake resistant primary reinforcement steel',
      minimumStock: 5,
      currentStock: 18,
      status: 'ACTIVE',
    });

    const sand = await Material.create({
      name: 'Washed VSI River Sand',
      category: 'Sand',
      unit: 'Brass',
      description: 'Double washed fine river aggregate for slab casting',
      minimumStock: 5,
      currentStock: 3, // Alert trigger: low stock
      status: 'ACTIVE',
    });

    const aggregates = await Material.create({
      name: 'Black Basalt Metal 20mm & 10mm',
      category: 'Aggregate',
      unit: 'Brass',
      description: 'Hard basalt stone blue metal from Gargoti quarry',
      minimumStock: 6,
      currentStock: 22,
      status: 'ACTIVE',
    });

    const bricks = await Material.create({
      name: 'Shengaon Kiln Clay Bricks',
      category: 'Bricks',
      unit: 'Nos',
      description: 'First quality kiln red bricks with 35 kg/cm2 crushing strength',
      minimumStock: 3000,
      currentStock: 12500,
      status: 'ACTIVE',
    });

    // 6. Registered Vendors
    const vendor1 = await Vendor.create({
      vendorCode: 'VND-101',
      name: 'Mr. Arvind Shah',
      companyName: 'Kolhapur Steel Syndicate Ltd',
      phone: '+91 98220 11990',
      email: 'kolhapursteel@gmail.com',
      address: 'Shahupuri 2nd Lane, Kolhapur',
      category: 'TMT Steel & Structural Sections',
      gstNumber: '27AABCK8491M1Z5',
      totalAmount: 1250000,
      paidAmount: 1050000,
      pendingAmount: 200000,
      status: 'ACTIVE',
    });

    const vendor2 = await Vendor.create({
      vendorCode: 'VND-102',
      name: 'Mr. Mahesh Desai',
      companyName: 'Bhudargad Crushing Industries',
      phone: '+91 98220 44882',
      email: 'bhudargadsand@gmail.com',
      address: 'Gargoti-Shengaon Bypass, Tal: Bhudargad',
      category: 'River Sand & Black Basalt Aggregates',
      gstNumber: '27AABCB3918P1Z2',
      totalAmount: 680000,
      paidAmount: 680000,
      pendingAmount: 0,
      status: 'ACTIVE',
    });

    const vendor3 = await Vendor.create({
      vendorCode: 'VND-103',
      name: 'Mr. Anandrao Naik',
      companyName: 'Shengaon Clay Industries',
      phone: '+91 98220 77331',
      email: 'shengaonbricks@gmail.com',
      address: 'At/Post Shengaon, Tal: Bhudargad, Kolhapur',
      category: 'Kiln Red Bricks & Cement Blocks',
      gstNumber: '27AABCS7712E1Z8',
      totalAmount: 340000,
      paidAmount: 290000,
      pendingAmount: 50000,
      status: 'ACTIVE',
    });

    // 7. Fresh Real Projects for Er. Sudarshan Bajrang Naik
    // Project 1: PWD Road & Box Culvert
    const proj1 = await Project.create({
      projectCode: 'AR-PRJ-2026-01',
      projectName: 'Shengaon-Kadgaon PWD Asphalt Road & RCC Box Culvert',
      description: 'Construction of 2.8 km heavy-duty asphalt carriage road with two double-cell RCC box culverts and side drainage.',
      projectType: 'Government Infrastructure (PWD)',
      location: 'Shengaon to Kadgaon, Tal: Bhudargad, Dist: Kolhapur',
      client: {
        name: 'Public Works Department (PWD Division Kolhapur)',
        phone: '+91 231 2654321',
        email: 'pwd.kolhapur@maharashtra.gov.in',
        address: 'PWD Executive Engineer Office, Tarabai Park, Kolhapur',
      },
      contractValue: 3850000,
      estimatedCost: 3850000,
      status: 'IN_PROGRESS',
      progressPercentage: 75,
      isPublic: true,
      publicStatus: 'Box Culvert Concrete Cured • Final WBM & Asphalt Layer In Progress',
      publicImages: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      ],
      privateNotes: 'Government tender under ZP & PWD Kolhapur. Billing running account 3 cleared.',
      createdBy: sudarshanUser._id,
    });

    // Project 2: Grampanchayat Administrative Complex
    const proj2 = await Project.create({
      projectCode: 'AR-PRJ-2026-02',
      projectName: 'Grampanchayat Administrative Complex & Sabhagruh',
      description: 'Modern G+1 administrative hall, e-seva digital center, sarpanch chamber, and 300-capacity public multipurpose hall.',
      projectType: 'Public & Institutional Building',
      location: 'Main Chowk, Shengaon, Tal: Bhudargad, Kolhapur - 416209',
      client: {
        name: 'Shengaon Grampanchayat (Sarpanch & Gramsevak)',
        phone: '+91 94220 18290',
        email: 'shengaon.gp@gmail.com',
        address: 'Central Square, At/Post Shengaon, Tal: Bhudargad, Kolhapur',
      },
      contractValue: 4500000,
      estimatedCost: 4500000,
      status: 'IN_PROGRESS',
      progressPercentage: 60,
      isPublic: true,
      publicStatus: 'First Floor Slab Casted • Electrical & Plumbing Conduit Piping In Progress',
      publicImages: [
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      ],
      privateNotes: 'Grampanchayat fund release milestone-based. Quality inspection report passed.',
      createdBy: sudarshanUser._id,
    });

    // Project 3: Elevated RCC Water Reservoir (ESR)
    const proj3 = await Project.create({
      projectCode: 'AR-PRJ-2026-03',
      projectName: 'Elevated RCC Water Storage Reservoir (1.5 Lakh Litres ESR)',
      description: 'Turnkey structural construction of 12m staging height elevated storage reservoir, pump house, and gravity feeder main.',
      projectType: 'Water Infrastructure / Jal Jeevan Mission',
      location: 'Hilltop Ward, Shengaon, Tal: Bhudargad, Kolhapur',
      client: {
        name: 'Zilla Parishad Rural Water Supply Division, Kolhapur',
        phone: '+91 231 2689100',
        email: 'zp.watersupply.kop@gmail.com',
        address: 'Z.P. Bhawan, Station Road, Kolhapur',
      },
      contractValue: 3200000,
      estimatedCost: 3200000,
      status: 'COMPLETED',
      progressPercentage: 100,
      isPublic: true,
      publicStatus: 'Hydrostatic Testing Completed • Successfully Commissioned & Dedicated to Village',
      publicImages: [
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
      ],
      privateNotes: 'Defect liability period active until 2027. Final retention deposit released.',
      createdBy: sudarshanUser._id,
    });

    // Project 4: Naik Prime Commercial Complex
    const proj4 = await Project.create({
      projectCode: 'AR-PRJ-2026-04',
      projectName: 'Naik Prime Commercial Complex & Market Showrooms',
      description: 'Commercial retail center with 14 double-height road-facing retail shops, ATM lobby, and commercial office suites.',
      projectType: 'Commercial Showrooms & Offices',
      location: 'Gargoti-Shengaon State Highway, Tal: Bhudargad, Kolhapur',
      client: {
        name: 'Mr. B. R. Naik & Brothers',
        phone: '+91 98220 99770',
        email: 'naikbrothers.shengaon@gmail.com',
        address: 'Highway Corner, Shengaon, Tal: Bhudargad, Kolhapur - 416209',
      },
      contractValue: 5500000,
      estimatedCost: 5500000,
      status: 'IN_PROGRESS',
      progressPercentage: 40,
      isPublic: true,
      publicStatus: 'Ground Floor Column Concreting Complete • Centering for Ground Slab underway',
      publicImages: [
        'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
      ],
      privateNotes: 'Client payment milestones strictly aligned to slab casting.',
      createdBy: sudarshanUser._id,
    });

    // Project 5: Patil Villa - Residential Bungalow
    const proj5 = await Project.create({
      projectCode: 'AR-PRJ-2026-05',
      projectName: 'Patil Residence - Modern 4BHK Country Villa',
      description: 'Contemporary RCC frame residential bungalow with stone cladding, cantilevered balconies, and solar rooftop integration.',
      projectType: 'Luxury Residential Bungalow',
      location: 'Shengaon Valley View, Tal: Bhudargad, Kolhapur',
      client: {
        name: 'Mr. Suresh S. Patil',
        phone: '+91 94220 66311',
        email: 'sureshpatil.shengaon@gmail.com',
        address: 'Plot 12, Valley View Heights, Shengaon, Tal: Bhudargad, Kolhapur',
      },
      contractValue: 2800000,
      estimatedCost: 2800000,
      status: 'IN_PROGRESS',
      progressPercentage: 85,
      isPublic: true,
      publicStatus: 'External Waterproof Plaster Complete • Vitrified Tiling & Painting in Progress',
      publicImages: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      ],
      privateNotes: 'Client pleased with quality and rapid pace. Handover scheduled next month.',
      createdBy: sudarshanUser._id,
    });

    // 8. Sites / Plots for these projects
    const site1 = await Site.create({
      projectId: proj1._id,
      siteName: 'Shengaon PWD Culvert & Road Stretch',
      location: 'Shengaon-Kadgaon Road Chainage 0/000 to 2/800',
      siteOwner: 'Public Works Department (PWD)',
      ownerContact: '+91 231 2654321',
      totalCost: 3850000,
      status: 'ACTIVE',
      progressPercentage: 75,
      isPublic: true,
      createdBy: sudarshanUser._id,
    });

    const site2 = await Site.create({
      projectId: proj2._id,
      siteName: 'Shengaon Grampanchayat Central Complex',
      location: 'Central Square, Shengaon, Tal: Bhudargad, Kolhapur',
      siteOwner: 'Grampanchayat Shengaon',
      ownerContact: '+91 94220 18290',
      totalCost: 4500000,
      status: 'ACTIVE',
      progressPercentage: 60,
      isPublic: true,
      createdBy: sudarshanUser._id,
    });

    const site3 = await Site.create({
      projectId: proj3._id,
      siteName: 'Shengaon Hilltop Water Reservoir Station',
      location: 'Survey No. 84, Hilltop Ward, Shengaon',
      siteOwner: 'Zilla Parishad Kolhapur',
      ownerContact: '+91 231 2689100',
      totalCost: 3200000,
      status: 'COMPLETED',
      progressPercentage: 100,
      isPublic: true,
      createdBy: sudarshanUser._id,
    });

    const site4 = await Site.create({
      projectId: proj4._id,
      siteName: 'Naik Prime Commercial Plaza',
      location: 'State Highway Junction, Shengaon',
      siteOwner: 'Mr. B. R. Naik',
      ownerContact: '+91 98220 99770',
      totalCost: 5500000,
      status: 'ACTIVE',
      progressPercentage: 40,
      isPublic: true,
      createdBy: sudarshanUser._id,
    });

    const site5 = await Site.create({
      projectId: proj5._id,
      siteName: 'Patil Country Villa Plot 12',
      location: 'Plot 12, Valley View, Shengaon',
      siteOwner: 'Mr. Suresh S. Patil',
      ownerContact: '+91 94220 66311',
      totalCost: 2800000,
      status: 'ACTIVE',
      progressPercentage: 85,
      isPublic: true,
      createdBy: sudarshanUser._id,
    });

    // 9. Client Payments (Receipts) - Authentic Government & Private Records
    // PWD Road Project: Received ₹28,00,000 via Treasury RTGS
    await ClientPayment.create({
      projectId: proj1._id,
      siteId: site1._id,
      ownerName: 'PWD Executive Engineer, Kolhapur',
      paymentDate: new Date('2025-01-20'),
      amount: 1400000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'RTGS',
      transactionReference: 'RBI-TREASURY-KOP-994821',
      receiptNumber: 'AR-REC-2025-001',
      description: 'PWD RA Bill-1 payment for earthwork, excavation and sub-base',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await ClientPayment.create({
      projectId: proj1._id,
      siteId: site1._id,
      ownerName: 'PWD Executive Engineer, Kolhapur',
      paymentDate: new Date('2025-02-28'),
      amount: 1400000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'RTGS',
      transactionReference: 'RBI-TREASURY-KOP-104928',
      receiptNumber: 'AR-REC-2025-002',
      description: 'PWD RA Bill-2 payment for double-cell box culvert structural concrete',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // Grampanchayat Complex: Received ₹27,00,000
    await ClientPayment.create({
      projectId: proj2._id,
      siteId: site2._id,
      ownerName: 'Shengaon Grampanchayat Fund',
      paymentDate: new Date('2025-01-25'),
      amount: 1500000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'BANK_TRANSFER',
      transactionReference: 'KDC-BANK-SHENGAON-883921',
      receiptNumber: 'AR-REC-2025-003',
      description: 'Mobilization advance & foundation casting grant release',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await ClientPayment.create({
      projectId: proj2._id,
      siteId: site2._id,
      ownerName: 'Shengaon Grampanchayat Fund',
      paymentDate: new Date('2025-03-02'),
      amount: 1200000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'BANK_TRANSFER',
      transactionReference: 'KDC-BANK-SHENGAON-992184',
      receiptNumber: 'AR-REC-2025-004',
      description: 'Ground and first floor slab casting milestone tranche',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // Elevated Reservoir (Jal Jeevan): 100% Received ₹32,00,000
    await ClientPayment.create({
      projectId: proj3._id,
      siteId: site3._id,
      ownerName: 'Zilla Parishad Water Supply Division',
      paymentDate: new Date('2024-11-15'),
      amount: 1600000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'NEFT',
      transactionReference: 'NEFT-SBIN-KOP-994821',
      receiptNumber: 'AR-REC-2024-008',
      description: 'Jal Jeevan Stage-1 staging and columns completion',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await ClientPayment.create({
      projectId: proj3._id,
      siteId: site3._id,
      ownerName: 'Zilla Parishad Water Supply Division',
      paymentDate: new Date('2025-02-10'),
      amount: 1600000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'NEFT',
      transactionReference: 'NEFT-SBIN-KOP-104928',
      receiptNumber: 'AR-REC-2025-005',
      description: 'Final reservoir container casting, water-tightness test & handover',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // Commercial Complex: Received ₹22,00,000
    await ClientPayment.create({
      projectId: proj4._id,
      siteId: site4._id,
      ownerName: 'Mr. B. R. Naik',
      paymentDate: new Date('2025-02-05'),
      amount: 1200000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'UPI',
      transactionReference: 'UPI-HDFC-99382109281',
      receiptNumber: 'AR-REC-2025-006',
      description: 'Plinth level construction milestone payment',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await ClientPayment.create({
      projectId: proj4._id,
      siteId: site4._id,
      ownerName: 'Mr. B. R. Naik',
      paymentDate: new Date('2025-02-25'),
      amount: 1000000,
      paymentMethod: 'CASH',
      receiptNumber: 'AR-REC-2025-007',
      description: 'Direct cash installment received at Shengaon office for steel procurement',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // Residential Villa: Received ₹24,00,000
    await ClientPayment.create({
      projectId: proj5._id,
      siteId: site5._id,
      ownerName: 'Mr. Suresh S. Patil',
      paymentDate: new Date('2025-01-10'),
      amount: 1200000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'UPI',
      transactionReference: 'UPI-ICICI-88392019',
      receiptNumber: 'AR-REC-2025-008',
      description: 'RCC Frame and roof slab completion milestone',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await ClientPayment.create({
      projectId: proj5._id,
      siteId: site5._id,
      ownerName: 'Mr. Suresh S. Patil',
      paymentDate: new Date('2025-03-01'),
      amount: 1200000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'NEFT',
      transactionReference: 'NEFT-BOI-KOP-994821',
      receiptNumber: 'AR-REC-2025-009',
      description: 'Plaster, plumbing and premium tile works advance',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // 10. Direct Site Expenses, Materials Purchases, and Labor Wage Payouts
    // Worker Payments
    await WorkerPayment.create({
      projectId: proj1._id,
      siteId: site1._id,
      workerId: worker1._id,
      workTypeId: masonWork._id,
      daysWorked: 95,
      dailyRate: 950,
      amount: 90250,
      paymentMethod: 'CASH',
      transactionReference: 'VCH-2025-001',
      paymentDate: new Date('2025-02-25'),
      notes: 'Road drainage and culvert headwall masonry labor payout',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await WorkerPayment.create({
      projectId: proj2._id,
      siteId: site2._id,
      workerId: worker2._id,
      workTypeId: carpenterWork._id,
      daysWorked: 80,
      dailyRate: 950,
      amount: 76000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'UPI',
      transactionReference: 'UPI-GPAY-992144',
      paymentDate: new Date('2025-03-01'),
      notes: 'Grampanchayat Sabhagruh roof slab shuttering contract settlement',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await WorkerPayment.create({
      projectId: proj4._id,
      siteId: site4._id,
      workerId: worker3._id,
      workTypeId: barBenderWork._id,
      daysWorked: 70,
      dailyRate: 900,
      amount: 63000,
      paymentMethod: 'CASH',
      transactionReference: 'VCH-2025-003',
      paymentDate: new Date('2025-02-28'),
      notes: 'Heavy column cages and footing bar reinforcement tying',
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // Material Purchases
    await MaterialPurchase.create({
      projectId: proj1._id,
      siteId: site1._id,
      materialId: cement._id,
      vendorId: vendor1._id,
      purchaseDate: new Date('2025-01-22'),
      quantity: 500,
      unit: 'Bags',
      unitPrice: 380,
      totalAmount: 190000,
      paidAmount: 190000,
      pendingAmount: 0,
      paymentMethod: 'ONLINE',
      onlineMethod: 'NEFT',
      invoiceNumber: 'GST-KOP-9948',
      status: 'COMPLETED',
      createdBy: sudarshanUser._id,
    });

    await MaterialPurchase.create({
      projectId: proj2._id,
      siteId: site2._id,
      materialId: steel._id,
      vendorId: vendor1._id,
      purchaseDate: new Date('2025-02-08'),
      quantity: 12,
      unit: 'Tons',
      unitPrice: 62000,
      totalAmount: 744000,
      paidAmount: 600000,
      pendingAmount: 144000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'RTGS',
      invoiceNumber: 'GST-TATA-2025-441',
      status: 'COMPLETED',
      createdBy: sudarshanUser._id,
    });

    await MaterialPurchase.create({
      projectId: proj1._id,
      siteId: site1._id,
      materialId: sand._id,
      vendorId: vendor2._id,
      purchaseDate: new Date('2025-02-12'),
      quantity: 25,
      unit: 'Brass',
      unitPrice: 8500,
      totalAmount: 212500,
      paidAmount: 212500,
      pendingAmount: 0,
      paymentMethod: 'ONLINE',
      onlineMethod: 'NEFT',
      invoiceNumber: 'CHALLAN-BHU-8841',
      status: 'COMPLETED',
      createdBy: sudarshanUser._id,
    });

    // Direct Expenses
    await Expense.create({
      projectId: proj1._id,
      siteId: site1._id,
      category: 'EQUIPMENT',
      description: 'JCB 3DX & Road Roller hire for road grading & compaction',
      amount: 85000,
      paymentMethod: 'CASH',
      transactionReference: 'VCH-2025-007',
      date: new Date('2025-02-18'),
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await Expense.create({
      projectId: proj2._id,
      siteId: site2._id,
      category: 'TRANSPORT',
      description: 'Tractor freight for transporting 12,000 bricks to Shengaon Chowk site',
      amount: 24000,
      paymentMethod: 'CASH',
      transactionReference: 'VCH-2025-008',
      date: new Date('2025-02-22'),
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    await Expense.create({
      projectId: proj1._id,
      siteId: site1._id,
      category: 'OTHER',
      description: 'PWD concrete cube test laboratory fees at Govt Polytechnic Kolhapur',
      amount: 15000,
      paymentMethod: 'ONLINE',
      onlineMethod: 'UPI',
      transactionReference: 'UPI-LAB-TEST-29182',
      date: new Date('2025-02-26'),
      status: 'PAID',
      createdBy: sudarshanUser._id,
    });

    // 11. Initial Notifications
    await Notification.create({
      title: 'PWD RA Bill-2 Cleared & Credited',
      message: '₹14,00,000 credited via Treasury RTGS for Shengaon-Kadgaon Road Box Culvert project.',
      type: 'PAYMENT_RECEIVED',
      isRead: false,
    });

    await Notification.create({
      title: 'VSI Sand Stock Safety Alert',
      message: 'River sand inventory is down to 3 Brass (Minimum recommended: 5 Brass) at Shengaon depot.',
      type: 'LOW_STOCK',
      isRead: false,
    });

    await Notification.create({
      title: 'Welcome to Arambh Construction ERP',
      message: 'Enterprise portal initialized for Er. Sudarshan Bajrang Naik, Shengaon, Bhudargad, Kolhapur.',
      type: 'ALERT',
      isRead: true,
    });

    // 12. Audit Log
    await AuditLog.create({
      userId: sudarshanUser._id,
      userName: 'Er. Sudarshan Bajrang Naik',
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'CompanySettings',
      entityId: 'ARAMBH-CORP-2026',
      description: 'System initialization and fresh database provisioning for Arambh Construction.',
      ipAddress: '127.0.0.1',
    });

    console.log('✅ Arambh Construction ERP database successfully refreshed with authentic projects for Er. Sudarshan Bajrang Naik!');
  } catch (error) {
    console.error('Error seeding fresh database:', error);
  }
}
