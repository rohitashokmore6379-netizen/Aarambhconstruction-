import React, { useState, useRef, useEffect } from 'react';
import {
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  HardDrive,
  X,
  Zap,
} from 'lucide-react';
import { useSync } from '../../context/SyncContext.tsx';

export function SyncStatusIndicator() {
  const {
    state,
    isOnline,
    isDbConnected,
    latencyMs,
    lastSyncedAt,
    database,
    isChecking,
    checkSync,
    error,
  } = useSync();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute live relative time for last sync
  const [relativeTime, setRelativeTime] = useState<string>('Just now');

  useEffect(() => {
    function updateRelative() {
      if (!lastSyncedAt) {
        setRelativeTime('Pending');
        return;
      }
      const seconds = Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 1000);
      if (seconds < 5) setRelativeTime('Just now');
      else if (seconds < 60) setRelativeTime(`${seconds}s ago`);
      else if (seconds < 3600) setRelativeTime(`${Math.floor(seconds / 60)}m ago`);
      else setRelativeTime(`${Math.floor(seconds / 3600)}h ago`);
    }

    updateRelative();
    const interval = setInterval(updateRelative, 3000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  // Status visual variants
  const getBadgeConfig = () => {
    if (!isOnline || state === 'OFFLINE') {
      return {
        label: 'Offline Mode',
        shortLabel: 'Offline',
        dotColor: 'bg-rose-500',
        pingColor: 'bg-rose-400',
        containerBorder: 'border-rose-500/30 hover:border-rose-500/60',
        containerBg: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300',
        icon: WifiOff,
      };
    }
    if (state === 'DB_DISCONNECTED' || !isDbConnected) {
      return {
        label: 'DB Disconnected',
        shortLabel: 'No DB',
        dotColor: 'bg-amber-500',
        pingColor: 'bg-amber-400',
        containerBorder: 'border-amber-500/30 hover:border-amber-500/60',
        containerBg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
        icon: AlertTriangle,
      };
    }
    if (state === 'SYNCING' || isChecking) {
      return {
        label: 'Syncing...',
        shortLabel: 'Syncing',
        dotColor: 'bg-sky-400',
        pingColor: 'bg-sky-300',
        containerBorder: 'border-sky-500/30 hover:border-sky-500/60',
        containerBg: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300',
        icon: RefreshCw,
      };
    }
    // Connected & Online
    return {
      label: 'DB Connected',
      shortLabel: 'Live Sync',
      dotColor: 'bg-emerald-400',
      pingColor: 'bg-emerald-400',
      containerBorder: 'border-emerald-500/30 hover:border-emerald-500/50',
      containerBg: 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300',
      icon: Database,
    };
  };

  const badge = getBadgeConfig();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Database & Network Synchronization Status"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${badge.containerBorder} ${badge.containerBg}`}
      >
        {/* Animated Pulse Dot */}
        <span className="relative flex h-2 w-2">
          {state === 'CONNECTED' && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.pingColor}`}
            />
          )}
          {state === 'OFFLINE' && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-rose-400"
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dotColor}`} />
        </span>

        <badge.icon
          className={`w-3.5 h-3.5 shrink-0 ${isChecking ? 'animate-spin' : ''}`}
        />

        <span className="hidden sm:inline font-mono tracking-tight">{badge.label}</span>
        <span className="sm:hidden font-mono text-[11px]">{badge.shortLabel}</span>

        {/* Latency Pill (when connected) */}
        {state === 'CONNECTED' && latencyMs !== null && (
          <span className="hidden lg:inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900/80 text-emerald-400 border border-emerald-500/20">
            {latencyMs}ms
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 text-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  state === 'CONNECTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : state === 'OFFLINE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {state === 'OFFLINE' ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="font-black text-white text-sm">Database & Sync Status</h4>
                <p className="text-[11px] text-slate-400">Real-time database connection monitor</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Status Summary Banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              state === 'CONNECTED'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : state === 'OFFLINE'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            }`}
          >
            {state === 'CONNECTED' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : state === 'OFFLINE' ? (
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold text-white text-xs">
                {state === 'CONNECTED'
                  ? 'Active Live Database Sync'
                  : state === 'OFFLINE'
                  ? 'Application in Offline Mode'
                  : 'Database Server Connection Issue'}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {state === 'CONNECTED'
                  ? 'All records, expenditures, and work logs are saving directly to MongoDB in real time.'
                  : state === 'OFFLINE'
                  ? 'You are disconnected from the network. Cached records are available for review. Modifications will sync once reconnected.'
                  : error || 'Database communication is temporarily degraded or reconnecting.'}
              </p>
            </div>
          </div>

          {/* Detailed Metric Rows */}
          <div className="space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
            {/* Database Instance */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>Database Engine:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">
                  {database?.name || 'arambh_construction'}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isDbConnected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isDbConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Network Connection */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-slate-500" />
                <span>Internet / Network:</span>
              </div>
              <span
                className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Round-trip Latency */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>Ping Latency:</span>
              </div>
              <span className="text-white font-bold flex items-center gap-1">
                {latencyMs !== null ? (
                  <>
                    <span>{latencyMs} ms</span>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        latencyMs < 50
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : latencyMs < 200
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {latencyMs < 50 ? 'Fast' : latencyMs < 200 ? 'Normal' : 'Slow'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">N/A</span>
                )}
              </span>
            </div>

            {/* Last Synced */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Synchronized:</span>
              </div>
              <span className="text-amber-400 font-bold">{relativeTime}</span>
            </div>
          </div>

          {/* Sync Action Button */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Auto-pings every 12s</span>
            </div>

            <button
              type="button"
              disabled={isChecking}
              onClick={() => checkSync(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl border border-slate-700 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Sync Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Top notification banner when offline or disconnected
 */
export function OfflineModeBanner() {
  const { state, isOnline, showOfflineBanner, dismissOfflineBanner, checkSync, isChecking } =
    useSync();

  if (!showOfflineBanner || state === 'CONNECTED') {
    return null;
  }

  const isDisconnected = state === 'DB_DISCONNECTED';

  return (
    <div
      className={`px-4 py-2 border-b flex items-center justify-between text-xs transition-colors ${
        isDisconnected
          ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
          : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isDisconnected ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        )}
        <span className="font-semibold truncate">
          {isDisconnected
            ? 'Database Service Unreachable: Retrying connection in background...'
            : 'Working in Offline Mode: Internet connection lost. Viewing cached records.'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => checkSync(false)}
          disabled={isChecking}
          className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 font-bold border border-white/10 hover:border-white/20 transition-all flex items-center gap-1 text-[11px]"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Connecting...' : 'Retry'}</span>
        </button>
        <button
          onClick={dismissOfflineBanner}
          className="p-1 hover:bg-black/30 rounded-md transition-colors"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Reconnected brief toast
 */
export function ReconnectedToast() {
  const { reconnectedAlert, dismissReconnectedAlert } = useSync();

  if (!reconnectedAlert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs text-emerald-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div>
        <div className="font-black text-white">Connection Restored</div>
        <div className="text-[11px] text-emerald-300">Live database sync has resumed.</div>
      </div>
      <button
        onClick={dismissReconnectedAlert}
        className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
