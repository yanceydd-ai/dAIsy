'use client';

import { useState, useEffect, useCallback } from 'react';
import { nextFullSyncTime, nextDeltaSyncTime, lastSyncFailed } from '@/lib/audit/auditService';

interface SyncLog {
  id: string;
  syncType: string;
  startedAt: string;
  completedAt: string | null;
  studentsSynced: number | null;
  sessionsSynced: number | null;
  errorMessage: string | null;
}

export default function SyncClient() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/sync/status');
    if (res.ok) {
      const data = await res.json() as { logs: SyncLog[] };
      setLogs(data.logs ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5 * 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const triggerSync = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/sync/blackbaud', { method: 'POST' });
      if (res.ok) {
        showToast('Sync started successfully. Results will appear shortly.', 'success');
        setTimeout(() => void load(), 5000);
      } else {
        showToast('Failed to trigger sync. Please try again.', 'error');
      }
    } catch {
      showToast('Failed to trigger sync. Please try again.', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const lastFullSync = logs.find((l) => l.syncType === 'full');
  const lastDeltaSync = logs.find((l) => l.syncType === 'delta');
  const syncFailed = lastSyncFailed(
    logs.map((l) => ({ errorMessage: l.errorMessage, completedAt: l.completedAt ? new Date(l.completedAt) : null })),
  );

  const missingCreds = lastFullSync?.errorMessage?.toLowerCase().includes('auth') ||
    lastFullSync?.errorMessage?.toLowerCase().includes('credential') ||
    lastFullSync?.errorMessage?.toLowerCase().includes('401');

  const now = new Date();
  const nextFull = nextFullSyncTime(now);
  const nextDelta = nextDeltaSyncTime(now);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blackbaud Sync Status</h1>
        <button
          onClick={() => void triggerSync()}
          disabled={triggering}
          className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {triggering && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Trigger Manual Sync
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 p-4 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-status-missing border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Last sync failed warning */}
      {syncFailed && !missingCreds && (
        <div className="mb-4 p-4 bg-[#FDF2F2] border border-status-missing rounded-lg text-sm text-status-missing">
          <span className="font-semibold">Last sync failed</span>
          {lastFullSync?.errorMessage && ` — ${lastFullSync.errorMessage}`}. Presence data may be outdated.
        </div>
      )}

      {/* Missing credentials warning */}
      {missingCreds && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Blackbaud credentials are not configured. Contact your system administrator.
        </div>
      )}

      {/* Schedule summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SyncSummaryCard
          title="Full Sync"
          lastSync={lastFullSync ?? null}
          nextSync={nextFull}
        />
        <SyncSummaryCard
          title="Delta Sync"
          lastSync={lastDeltaSync ?? null}
          nextSync={nextDelta}
        />
      </div>

      {/* History table */}
      <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Sync History</h2>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date / Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className={log.errorMessage ? 'bg-[#FDF2F2]' : ''}>
                <td className="px-4 py-2 text-gray-700">
                  {new Date(log.startedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 capitalize text-gray-600">{log.syncType}</td>
                <td className="px-4 py-2">
                  {!log.completedAt ? (
                    <span className="text-yellow-600 font-medium">Running…</span>
                  ) : log.errorMessage ? (
                    <span className="text-status-missing font-medium">Failed</span>
                  ) : (
                    <span className="text-status-present font-medium">Success</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-600">{log.studentsSynced ?? '—'}</td>
                <td className="px-4 py-2 text-status-missing max-w-[200px] truncate">{log.errorMessage ?? ''}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No sync history yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SyncSummaryCard({ title, lastSync, nextSync }: { title: string; lastSync: SyncLog | null; nextSync: Date }) {
  const failed = lastSync?.errorMessage !== null && lastSync?.errorMessage !== undefined;
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{title}</h3>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-gray-500">Last: </span>
          {lastSync ? (
            <span className={failed ? 'text-status-missing font-medium' : 'text-gray-700'}>
              {new Date(lastSync.startedAt).toLocaleString()} — {failed ? 'Failed' : 'Success'}
            </span>
          ) : (
            <span className="text-gray-400">Never</span>
          )}
        </div>
        <div>
          <span className="text-gray-500">Next: </span>
          <span className="text-gray-700">{nextSync.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
