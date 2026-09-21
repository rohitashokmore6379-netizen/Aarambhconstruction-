/**
 * Daily Site Report Print & PDF Export Service
 * Provides both standard window.print() targeting the report DOM
 * and a standalone high-definition print/save-as-PDF window generator
 * formatted specifically for A4 landscape/portrait engineering submittals.
 */

import { DailySiteReportData } from '../types.ts';
import { formatCurrency, formatDate } from '../utils/formatters.ts';

export function printDailySiteReport(report: DailySiteReportData) {
  // Try opening a dedicated clean print window with pristine light-mode PDF styling
  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  
  if (!printWindow) {
    // Fallback if popup blocked: trigger browser print on the current page container
    window.print();
    return;
  }

  const { project, company, formattedDate, labor, quantities, images, remarks, metrics, activeActivities } = report;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Daily Site Report - ${project.name} - ${formattedDate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .logo-box {
      width: 70px;
      vertical-align: top;
    }
    .logo-img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .company-title {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .company-sub {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      margin-top: 1px;
    }
    .company-meta {
      font-size: 9.5px;
      color: #475569;
      margin-top: 3px;
      line-height: 1.35;
    }
    .report-title-cell {
      text-align: right;
      vertical-align: top;
    }
    .report-badge {
      display: inline-block;
      background: #0f172a;
      color: #f8fafc;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .report-date {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6px;
    }
    .project-info-grid {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .project-info-grid td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    .label {
      font-weight: 700;
      color: #64748b;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .value {
      font-weight: 700;
      color: #0f172a;
    }
    .summary-pills {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .pill {
      flex: 1;
      border: 1px solid #cbd5e1;
      background: #f1f5f9;
      padding: 6px 8px;
      border-radius: 6px;
      text-align: center;
    }
    .pill-num {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .pill-label {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 1px;
    }
    .section-head {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      background: #e2e8f0;
      padding: 5px 8px;
      border-left: 4px solid #f59e0b;
      margin-top: 14px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .data-table td {
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      font-size: 10px;
      color: #1e293b;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 6px;
      margin-bottom: 10px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .photo-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 4px;
      display: block;
    }
    .photo-caption {
      font-size: 9px;
      color: #334155;
      margin-top: 4px;
      font-weight: 600;
      line-height: 1.25;
    }
    .photo-tag {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 8px;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 3px;
      margin-bottom: 2px;
    }
    .remark-item {
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      border-top: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 8px;
      margin-bottom: 6px;
      border-radius: 0 4px 4px 0;
      page-break-inside: avoid;
    }
    .remark-meta {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .remark-text {
      font-size: 10.5px;
      color: #0f172a;
      line-height: 1.35;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      border-top: 1px dashed #94a3b8;
      padding-top: 12px;
      page-break-inside: avoid;
    }
    .signature-col {
      width: 33.3%;
      vertical-align: top;
      padding: 8px 10px 0 10px;
      text-align: center;
    }
    .sign-line {
      height: 40px;
    }
    .sign-title {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      border-top: 1px solid #475569;
      padding-top: 4px;
    }
    .sign-role {
      font-size: 8.5px;
      color: #64748b;
    }
    .empty-state {
      padding: 10px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      color: #64748b;
      text-align: center;
      border-radius: 4px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <!-- Letterhead Header -->
  <table class="header-table">
    <tr>
      <td class="logo-box">
        <img src="/logo.jpg" class="logo-img" alt="Logo" onerror="this.style.display='none'" />
      </td>
      <td style="vertical-align: top; padding-left: 8px;">
        <div class="company-title">${company.companyName || 'ARAMBH CONSTRUCTION'}</div>
        <div class="company-sub">${company.directorName || 'Er. Sudarshan Bajrang Naik'} • ${company.tagline || 'इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर'}</div>
        <div class="company-meta">
          Licence: ${company.licenseNumber || 'PWD/KOP/2021/CLASS-A/0942'} • GST: ${company.gstNumber || '27AAQFA4918L1Z8'}<br/>
          ${company.address || 'At/Post Shengaon, Tal: Bhudargad, Kolhapur - 416209'} • Tel: ${company.phone || '+91 7796853434'}
        </div>
      </td>
      <td class="report-title-cell">
        <div class="report-badge">Daily Site Report (DSR)</div>
        <div class="report-date">${formattedDate}</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Doc Ref: DSR-${project.code || 'PRJ'}-${new Date().toISOString().slice(0, 10)}</div>
      </td>
    </tr>
  </table>

  <!-- Project & Site Summary -->
  <table class="project-info-grid">
    <tr>
      <td style="width: 25%;">
        <div class="label">Project Name</div>
        <div class="value">${project.name} (${project.code})</div>
      </td>
      <td style="width: 25%;">
        <div class="label">Location / Site</div>
        <div class="value">${project.location || 'Shengaon, Kolhapur'}</div>
      </td>
      <td style="width: 25%;">
        <div class="label">Client / Department</div>
        <div class="value">${project.clientName || 'PWD Government of Maharashtra'}</div>
      </td>
      <td style="width: 25%;">
        <div class="label">Overall Progress</div>
        <div class="value" style="color: #b45309;">${project.progressPercentage}% Completed</div>
      </td>
    </tr>
  </table>

  <!-- Daily High Level Metrics Summary -->
  <div class="summary-pills">
    <div class="pill">
      <div class="pill-num">${metrics.totalWorkersCount}</div>
      <div class="pill-label">Total Labor Deployed</div>
    </div>
    <div class="pill">
      <div class="pill-num">${metrics.totalSkilledWorkers} / ${metrics.totalUnskilledWorkers}</div>
      <div class="pill-label">Skilled / Helper Ratio</div>
    </div>
    <div class="pill">
      <div class="pill-num">${metrics.totalLaborHours} hrs</div>
      <div class="pill-label">Total Man-Hours</div>
    </div>
    <div class="pill">
      <div class="pill-num">${quantities.length}</div>
      <div class="pill-label">Quantities Logged</div>
    </div>
    <div class="pill">
      <div class="pill-num">${images.length}</div>
      <div class="pill-label">Site Photos Attached</div>
    </div>
    <div class="pill">
      <div class="pill-num">${formatCurrency(metrics.totalEstimatedLaborCost)}</div>
      <div class="pill-label">Est. Daily Labor Cost</div>
    </div>
  </div>

  <!-- SECTION 1: LABOR & MANPOWER DEPLOYMENT -->
  <div class="section-head">1. Labor Deployment & Manpower Log</div>
  ${
    labor.records.length > 0
      ? `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 26%;">Work Activity / Stage</th>
          <th style="width: 18%;">Team / Contractor</th>
          <th style="width: 16%;">Shift & Supervisor</th>
          <th style="width: 12%;" class="text-center">Labor Count</th>
          <th style="width: 10%;" class="text-center">Total Hours</th>
          <th style="width: 14%;" class="text-right">Estimated Wages</th>
        </tr>
      </thead>
      <tbody>
        ${labor.records
          .map(
            (rec, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${rec.workName}</strong></td>
            <td>${rec.workerTeam || 'In-House Crew'}</td>
            <td>${rec.shift} Shift • ${rec.supervisor || 'Site Engineer'}</td>
            <td class="text-center">
              <strong>${rec.totalWorkers}</strong> 
              <span style="font-size: 8.5px; color: #64748b;">(${rec.skilledWorkers}S / ${rec.unskilledWorkers}U)</span>
            </td>
            <td class="text-center">${rec.totalLaborHours} hrs</td>
            <td class="text-right font-mono">${formatCurrency(rec.estimatedLaborCost || 0)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr style="background: #f8fafc; font-weight: 800;">
          <td colspan="4" class="text-right">TOTAL MANPOWER AGGREGATION:</td>
          <td class="text-center">${labor.totalWorkers} Workers</td>
          <td class="text-center">${labor.totalHours} hrs</td>
          <td class="text-right">${formatCurrency(labor.cost)}</td>
        </tr>
      </tfoot>
    </table>
  `
      : `<div class="empty-state">No specialized schedule labor entries were logged for this date. (Workforce logs from attendance: ${labor.directLogs.length} workers recorded)</div>`
  }

  <!-- SECTION 2: WORK QUANTITY EXECUTION -->
  <div class="section-head">2. Daily Work Quantity Executed (Measurements)</div>
  ${
    quantities.length > 0
      ? `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 32%;">Activity / Item Description</th>
          <th style="width: 18%;">Worker Team</th>
          <th style="width: 15%;" class="text-right">Today's Executed Qty</th>
          <th style="width: 15%;" class="text-right">Cumulative Finished</th>
          <th style="width: 16%;">Engineer Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${quantities
          .map(
            (q, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${q.workName}</strong></td>
            <td>${q.workerTeam || 'General Team'}</td>
            <td class="text-right" style="color: #047857; font-weight: 800;">+${q.quantity} ${q.unit}</td>
            <td class="text-right">${q.totalCompletedQuantity} / ${q.targetQuantity > 0 ? q.targetQuantity : '-'} ${q.unit}</td>
            <td>${q.remarks || '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `
      : `<div class="empty-state">No measurable physical quantities were recorded on this date.</div>`
  }

  <!-- SECTION 3: SITE PROGRESS UPDATES & MILESTONES -->
  <div class="section-head">3. Stage Progress Updates & Milestone Status</div>
  ${
    activeActivities.length > 0
      ? `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 5%;">Order</th>
          <th style="width: 35%;">Activity Name</th>
          <th style="width: 20%;">Planned Dates</th>
          <th style="width: 15%;">Status</th>
          <th style="width: 25%;">Completion Progress</th>
        </tr>
      </thead>
      <tbody>
        ${activeActivities.slice(0, 8).map(
          (act) => `
          <tr>
            <td class="text-center">${act.workOrder}</td>
            <td><strong>${act.workName}</strong></td>
            <td style="font-size: 9px; color: #475569;">
              ${formatDate(act.plannedStartDate)} to ${formatDate(act.plannedEndDate)}
            </td>
            <td>
              <span style="font-weight: 700; font-size: 9px; color: ${
                act.status === 'COMPLETED' ? '#047857' : act.status === 'IN_PROGRESS' ? '#b45309' : '#0f172a'
              };">
                ${act.status}
              </span>
            </td>
            <td>
              <div style="font-weight: 800; font-size: 10px;">${act.progressPercentage}% Completed</div>
            </td>
          </tr>
        `
        ).join('')}
      </tbody>
    </table>
  `
      : `<div class="empty-state">No specific stage progress updates recorded on this date.</div>`
  }

  <!-- SECTION 4: SITE PHOTOS & VISUAL EVIDENCE -->
  ${
    images.length > 0
      ? `
    <div class="section-head">4. Site Progress Photographs & Visual Evidence (${images.length} Captures)</div>
    <div class="gallery-grid">
      ${images
        .map(
          (img) => `
        <div class="photo-card">
          <img src="${img.imageUrl}" class="photo-img" alt="${img.caption || 'Site Photo'}" />
          <div style="padding: 2px;">
            <span class="photo-tag">${img.imageType}</span>
            <div class="photo-caption">${img.caption || img.workName || 'Site execution photograph'}</div>
            <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Stage: ${img.workName}</div>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : `
    <div class="section-head">4. Site Progress Photographs</div>
    <div class="empty-state">No photographs were uploaded or attached to this date's report.</div>
  `
  }

  <!-- SECTION 5: SITE REMARKS, SAFETY & INSTRUCTIONS -->
  <div class="section-head">5. Site Observations, Quality & Safety Remarks</div>
  ${
    remarks.length > 0
      ? `
    <div>
      ${remarks
        .map(
          (rem) => `
        <div class="remark-item">
          <div class="remark-meta">Source: ${rem.source} • Activity: ${rem.activityName} • Logger: ${rem.author || 'Site Engineer'}</div>
          <div class="remark-text">"${rem.remark}"</div>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : `<div class="empty-state">No special remarks or safety deviations recorded for today.</div>`
  }

  <!-- Signatures Footer -->
  <table class="signatures-table">
    <tr>
      <td class="signature-col">
        <div class="sign-line"></div>
        <div class="sign-title">Prepared By (Site Supervisor)</div>
        <div class="sign-role">Arambh Construction Site In-Charge</div>
      </td>
      <td class="signature-col">
        <div class="sign-line"></div>
        <div class="sign-title">Verified By (Project Engineer)</div>
        <div class="sign-role">${company.directorName || 'Er. Sudarshan Bajrang Naik'}</div>
      </td>
      <td class="signature-col">
        <div class="sign-line"></div>
        <div class="sign-title">Client / Dept. Acknowledgment</div>
        <div class="sign-role">${project.clientName || 'PWD / Grampanchayat / Owner'}</div>
      </td>
    </tr>
  </table>

  <div style="font-size: 8px; color: #94a3b8; text-align: center; margin-top: 18px;">
    This is a computer generated official Daily Site Report from Arambh Construction ERP Cockpit. All quantities and labor records are logged in real time.
  </div>

  <script>
    window.onload = function() {
      // Auto-open print dialog in the pop-up window
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
