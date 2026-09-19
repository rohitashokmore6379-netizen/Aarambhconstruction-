import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, Upload, Check, AlertCircle, X, ArrowRight, Building2, MapPin } from 'lucide-react';
import { Site } from '../../types.ts';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  onSelectSite: (siteId: string, projectId: string) => void;
}

export function QRScannerModal({ isOpen, onClose, sites, onSelectSite }: QRScannerModalProps) {
  const [manualInput, setManualInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualInput('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Camera access is not supported by your browser in this mode. Please select a site below or paste the QR URL.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // If browser supports BarcodeDetector API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });

        const interval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              clearInterval(interval);
              stopCamera();
              processScannedValue(rawValue);
            }
          } catch (e) {
            // ignore scan frame errors
          }
        }, 500);
      }
    } catch (err: any) {
      console.warn('Camera error', err);
      setErrorMsg('Could not access camera (permission denied or no camera found). You can pick a site from the list below.');
      setCameraActive(false);
    }
  };

  const processScannedValue = (value: string) => {
    setErrorMsg('');
    const str = value.trim();

    // Check if it's a full URL containing siteId parameter
    try {
      if (str.includes('siteId=')) {
        const url = new URL(str, window.location.origin);
        const sId = url.searchParams.get('siteId') || '';
        const pId = url.searchParams.get('projectId') || '';
        if (sId) {
          onSelectSite(sId, pId);
          onClose();
          return;
        }
      }
    } catch (e) {
      // not a standard URL, continue with fallback matching
    }

    // Check if directly matches a site ID
    const matchedSite = sites.find(
      (s) => s._id === str || s.siteName.toLowerCase() === str.toLowerCase()
    );

    if (matchedSite) {
      const pId =
        typeof matchedSite.projectId === 'object' && matchedSite.projectId
          ? matchedSite.projectId._id
          : (matchedSite.projectId as string) || '';
      onSelectSite(matchedSite._id, pId);
      onClose();
      return;
    }

    setErrorMsg(`No matching construction site found for: "${str}". Please select from the active sites list.`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    processScannedValue(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scan Site QR Code</h3>
              <p className="text-[11px] text-slate-400">Log labor muster directly for the scanned site</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Camera View / Toggle */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-amber-500/50">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 border-2 border-amber-500/40 pointer-events-none rounded-xl flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-amber-400 rounded-2xl animate-pulse" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Stop Camera
                </button>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scan with Device Camera</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    Point your camera at any printed Arambh site QR placard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Camera Scanner</span>
                </button>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual URL / ID Input */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Or Enter Scanned URL / Site ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste URL or enter site ID..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors border border-slate-700 shrink-0"
              >
                Apply
              </button>
            </div>
          </form>

          {/* Quick Select from Sites (Instant Simulator) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Select Active Site ({sites.length}):
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {sites.map((site) => {
                const pId =
                  typeof site.projectId === 'object' && site.projectId
                    ? site.projectId._id
                    : (site.projectId as string) || '';
                const pName =
                  typeof site.projectId === 'object' && site.projectId
                    ? site.projectId.projectName
                    : 'Project';

                return (
                  <button
                    key={site._id}
                    type="button"
                    onClick={() => {
                      stopCamera();
                      onSelectSite(site._id, pId);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/50 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{site.siteName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {pName} • {site.location || 'Kolhapur'}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>Log Labor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
