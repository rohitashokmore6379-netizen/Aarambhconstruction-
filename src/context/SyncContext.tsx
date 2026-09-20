import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import api from '../services/api.ts';
import { SyncConnectionState, DatabaseSyncInfo, SyncStatusData } from '../types.ts';

interface SyncContextType extends SyncStatusData {
  isChecking: boolean;
  checkSync: (silent?: boolean) => Promise<void>;
  showOfflineBanner: boolean;
  dismissOfflineBanner: () => void;
  reconnectedAlert: boolean;
  dismissReconnectedAlert: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [status, setStatus] = useState<SyncConnectionState>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'OFFLINE';
    }
    return 'CONNECTED';
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => new Date());
  const [database, setDatabase] = useState<DatabaseSyncInfo | null>({
    status: 'CONNECTED',
    readyState: 1,
    name: 'arambh_construction',
    host: 'localhost',
    isMemory: true,
  });
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);
  const [reconnectedAlert, setReconnectedAlert] = useState<boolean>(false);

  const prevStatusRef = useRef<SyncConnectionState>(status);

  // Ping backend database status
  const checkSync = useCallback(async (silent: boolean = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setStatus('OFFLINE');
      setIsDbConnected(false);
      setLatencyMs(null);
      setError('Browser network offline');
      setShowOfflineBanner(true);
      return;
    }

    if (!silent) {
      setIsChecking(true);
    }

    const startTime = performance.now();

    try {
      // Add timestamp query parameter to prevent browser HTTP caching
      const res = await api.get(`/sync/status?_t=${Date.now()}`, {
        timeout: 5000,
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setIsOnline(true);

      const dbData = res.data?.database;
      const isConnected = !!(res.data?.connected || (dbData && dbData.readyState === 1));

      if (dbData) {
        setDatabase({
          status: dbData.status || (isConnected ? 'CONNECTED' : 'DISCONNECTED'),
          readyState: dbData.readyState !== undefined ? dbData.readyState : isConnected ? 1 : 0,
          name: dbData.name || 'arambh_construction',
          host: dbData.host || 'localhost',
          isMemory: !!dbData.isMemory,
        });
      }

      if (isConnected) {
        setStatus('CONNECTED');
        setIsDbConnected(true);
        setLastSyncedAt(new Date());
        setError(null);
        setShowOfflineBanner(false);

        // If transitioning from offline or disconnected, trigger reconnected toast
        if (prevStatusRef.current === 'OFFLINE' || prevStatusRef.current === 'DB_DISCONNECTED') {
          setReconnectedAlert(true);
          setTimeout(() => setReconnectedAlert(false), 5000);
        }
      } else {
        setStatus('DB_DISCONNECTED');
        setIsDbConnected(false);
        setError('Database server disconnected or starting up');
        setShowOfflineBanner(true);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setStatus('OFFLINE');
        setIsDbConnected(false);
        setError('No internet connection');
      } else {
        // Server could be restarting or unreachable
        setIsOnline(true);
        setStatus('DB_DISCONNECTED');
        setIsDbConnected(false);
        setError(err?.message || 'Failed to reach database service');
      }
      setShowOfflineBanner(true);
    } finally {
      setIsChecking(false);
      prevStatusRef.current = status;
    }
  }, [status]);

  // Initial check on mount
  useEffect(() => {
    checkSync(false);
  }, []);

  // Periodic heartbeat polling every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkSync(true);
    }, 12000);

    return () => clearInterval(interval);
  }, [checkSync]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus('SYNCING');
      checkSync(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('OFFLINE');
      setIsDbConnected(false);
      setLatencyMs(null);
      setShowOfflineBanner(true);
      setError('Network connection lost');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSync(true);
      }
    };

    const handleApiSuccess = () => {
      setLastSyncedAt(new Date());
      if (status !== 'CONNECTED' && navigator.onLine) {
        setStatus('CONNECTED');
        setIsDbConnected(true);
        setShowOfflineBanner(false);
      }
    };

    const handleApiNetworkError = () => {
      if (!navigator.onLine) {
        setStatus('OFFLINE');
      } else {
        setStatus('DB_DISCONNECTED');
      }
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('arambh-sync-success', handleApiSuccess);
    window.addEventListener('arambh-sync-network-error', handleApiNetworkError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('arambh-sync-success', handleApiSuccess);
      window.removeEventListener('arambh-sync-network-error', handleApiNetworkError);
    };
  }, [checkSync, status]);

  const dismissOfflineBanner = () => {
    setShowOfflineBanner(false);
  };

  const dismissReconnectedAlert = () => {
    setReconnectedAlert(false);
  };

  return (
    <SyncContext.Provider
      value={{
        state: status,
        isOnline,
        isDbConnected,
        latencyMs,
        lastSyncedAt,
        database,
        error,
        isChecking,
        checkSync,
        showOfflineBanner,
        dismissOfflineBanner,
        reconnectedAlert,
        dismissReconnectedAlert,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
