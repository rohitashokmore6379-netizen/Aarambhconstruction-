import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Download, Printer, Copy, Check, ExternalLink, X, MapPin, Building2, User, HardHat } from 'lucide-react';
import QRCode from 'qrcode';
import { Site } from '../../types.ts';

interface SiteQRCodeModalProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SiteQRCodeModal({ site, isOpen, onClose }: SiteQRCodeModalProps) {
  const navigate = useNavigate();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const placardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !site) return null;

  const projectIdStr =
    typeof site.projectId === 'object' && site.projectId
      ? site.projectId._id
      : (site.projectId as string) || '';

  const projectNameStr =
    typeof site.projectId === 'object' && site.projectId
      ? site.projectId.projectName
      : 'Main Project';

  const scanUrl = `${window.location.origin}/admin/work-logs?siteId=${site._id}&projectId=${projectIdStr}&autoOpen=1`;

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    QRCode.toDataURL(scanUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [site._id, scanUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownloadPlacard = () => {
    if (!qrDataUrl) return;

    // Draw high-resolution printable canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 1500;

    // Background gradient / clean card
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Header Banner (Dark Slate with Amber accent)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, 240);

    ctx.fillStyle = '#f59e0b'; // Amber-500
    ctx.fillRect(0, 230, canvas.width, 10);

    // Company Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ARAMBH INFRA & BUILDERS', canvas.width / 2, 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    ctx.fillText('DIGITAL LABOR MUSTER & SITE ENTRY PASS', canvas.width / 2, 150);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('OFFICIAL ON-SITE QR VERIFICATION', canvas.width / 2, 195);

    // Site Title Box
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(80, 280, canvas.width - 160, 200, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(site.siteName, canvas.width / 2, 345);

    ctx.fillStyle = '#475569';
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Project: ${projectNameStr}  •  Location: ${site.location || 'Kolhapur'}`, canvas.width / 2, 400);

    ctx.fillStyle = '#64748b';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Site Owner: ${site.siteOwner || 'Client Unit'}  •  Site ID: ${site._id}`, canvas.width / 2, 445);

    // QR Code Image
    const qrImg = new Image();
    qrImg.onload = () => {
      // Draw QR Code centered
      const qrSize = 540;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 530;

      // Draw white frame for QR
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
      ctx.fill();
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Instruction Box
      ctx.fillStyle = '#fef3c7'; // amber-100
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(100, 1140, canvas.width - 200, 190, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#92400e'; // amber-800
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('HOW TO LOG LABOR & WORK', canvas.width / 2, 1195);

      ctx.fillStyle = '#78350f';
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillText('1. Scan this QR code with any smartphone camera on site.', canvas.width / 2, 1245);
      ctx.fillText('2. The daily muster automatically selects this site & project.', canvas.width / 2, 1280);
      ctx.fillText('3. Pick the worker, confirm attendance days, and submit.', canvas.width / 2, 1315);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Generated by Arambh ERP • Printed on ${new Date().toLocaleDateString('en-IN')}`, canvas.width / 2, 1420);

      // Trigger download
      const a = document.createElement('a');
      a.download = `Site-QR-${site.siteName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    qrImg.src = qrDataUrl;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNavigateToLog = () => {
    onClose();
    navigate(`/admin/work-logs?siteId=${site._id}&projectId=${projectIdStr}&autoOpen=1`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Site Labor QR Code</h3>
              <p className="text-[11px] text-slate-400">Scan to automatically pre-populate Daily Work Log for this site</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Placard Preview */}
        <div className="p-6 space-y-5">
          {/* Printable Placard Card */}
          <div
            ref={placardRef}
            className="bg-white text-slate-950 rounded-2xl p-6 border-2 border-amber-500 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:m-0"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                  A
                </div>
                <div>
                  <span className="font-extrabold text-xs tracking-wider uppercase text-slate-900 block">
                    ARAMBH ERP
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    Construction Management
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Site Muster QR
              </span>
            </div>

            {/* Site Info */}
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{site.siteName}</h2>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  {projectNameStr}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {site.location || 'Kolhapur'}
                </span>
              </div>
              {site.siteOwner && (
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Owner: {site.siteOwner}
                </p>
              )}
            </div>

            {/* QR Image Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl my-3">
              {isGenerating ? (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                  Generating high-resolution QR...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${site.siteName}`}
                  className="w-56 h-56 object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-rose-500 text-xs">
                  Error generating QR
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono mt-2 tracking-wide">
                ID: {site._id}
              </span>
            </div>

            {/* Scanning Instructions */}
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center space-y-0.5">
              <p className="text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                Scan to Pre-populate Work Log
              </p>
              <p className="text-[11px] text-amber-900 leading-tight">
                Camera scan automatically opens this site's daily labor muster with project & plot pre-filled.
              </p>
            </div>
          </div>

          {/* Quick Direct Link Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="truncate text-slate-400 font-mono text-[11px]">
              <span className="text-amber-400 font-semibold select-none">Target URL: </span>
              <span className="text-slate-300">{scanUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs flex items-center gap-1 transition-colors shrink-0"
              title="Copy link to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={handleDownloadPlacard}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Download Placard</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>

            <button
              onClick={handleNavigateToLog}
              className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-sky-600/20"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Log Work Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
