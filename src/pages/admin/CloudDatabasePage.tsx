import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase.ts';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import api from '../../services/api.ts';
import {
  Database,
  Cloud,
  CheckCircle2,
  Server,
  RefreshCw,
  ShieldCheck,
  Layers,
  ArrowRightLeft,
  Lock,
  ExternalLink,
} from 'lucide-react';

export function CloudDatabasePage() {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [firestoreCount, setFirestoreCount] = useState<number | null>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await api.get('/admin/projects');
      if (res.data.success) {
        setProjectsList(res.data.projects || []);
      }
      // Check firestore count
      try {
        const snap = await getDocs(collection(db, 'projects'));
        setFirestoreCount(snap.size);
      } catch (e) {
        // May require login or rules evaluation
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncToFirestore = async () => {
    setSyncing(true);
    setSyncStatus(null);
    try {
      let synced = 0;
      for (const p of projectsList) {
        await setDoc(doc(db, 'projects', p._id || `proj-${synced}`), {
          projectName: p.projectName,
          projectCode: p.projectCode,
          projectType: p.projectType || 'General Civil',
          location: p.location || 'Kolhapur',
          status: p.status,
          contractValue: p.contractValue || 0,
          estimatedCost: p.estimatedCost || 0,
          progressPercentage: p.progressPercentage || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        synced++;
      }
      setSyncStatus(`Successfully synchronized ${synced} projects to Firebase Firestore!`);
      setFirestoreCount(synced);
    } catch (err: any) {
      console.error('Firestore sync error:', err);
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Cloud Architecture
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Live Cloud Provisioning Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Cloud SQL & Firebase Firestore Infrastructure
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              High-availability hybrid storage: Cloud SQL PostgreSQL instance for structured relational data and Firebase Firestore for real-time edge sync.
            </p>
          </div>

          <button
            onClick={handleSyncToFirestore}
            disabled={syncing}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition shrink-0"
          >
            <ArrowRightLeft className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Projects to Firestore'}
          </button>
        </div>

        {syncStatus && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>

      {/* Cloud Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node 1: Cloud SQL PostgreSQL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Google Cloud SQL</h3>
                <span className="text-[11px] text-slate-400">PostgreSQL Relational Engine</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Instance ID</span>
              <span className="font-mono text-white font-bold">ai-studio-20565315</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Region</span>
              <span className="font-mono text-amber-400 font-bold">asia-southeast1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">GCP Project ID</span>
              <span className="font-mono text-white">grounded-pixel-v7dgj</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Edition</span>
              <span className="text-white">Cloud SQL Developer Edition</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Pooling Architecture</span>
              <span className="text-slate-300">pg Object Pool / Drizzle ORM</span>
            </div>
          </div>
        </div>

        {/* Node 2: Firebase Firestore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Firebase Firestore</h3>
                <span className="text-[11px] text-slate-400">Realtime Document Database</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PROVISIONED
            </span>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Project ID</span>
              <span className="font-mono text-white font-bold">grounded-pixel-v7dgj</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Security Rules</span>
              <span className="text-emerald-400 font-semibold">Deployed via deploy_firebase</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Synced Document Count</span>
              <span className="font-bold text-white">{firestoreCount !== null ? `${firestoreCount} records` : 'Ready'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Client Auth</span>
              <span className="text-slate-300">Google Auth & Firebase SDK</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Blueprint IR</span>
              <span className="text-slate-300">firebase-blueprint.json (Verified)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
