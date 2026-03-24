'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeviceRecord, HeartbeatHistoryRow } from '@/lib/devices/deviceService';

export default function DevicesClient() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [logsModal, setLogsModal] = useState<{ deviceId: string; label: string } | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/devices');
    if (res.ok) {
      const data = await res.json() as { devices: DeviceRecord[] };
      setDevices(data.devices);
    }
  }, []);

  useEffect(() => {
    void reload();
    const timer = setInterval(() => void reload(), 60_000);
    return () => clearInterval(timer);
  }, [reload]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Device Health</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onViewLogs={() => setLogsModal({ deviceId: device.id, label: device.doorId ?? device.id })}
          />
        ))}
        {devices.length === 0 && (
          <p className="text-gray-400 text-sm col-span-2">No devices registered.</p>
        )}
      </div>

      {logsModal && (
        <HeartbeatLogsModal
          deviceId={logsModal.deviceId}
          label={logsModal.label}
          onClose={() => setLogsModal(null)}
        />
      )}
    </div>
  );
}

function DeviceCard({ device, onViewLogs }: { device: DeviceRecord; onViewLogs: () => void }) {
  const isOffline = device.status === 'offline';
  const doorLabel = (device.doorId ?? device.id).toUpperCase();

  const secondsAgo = device.secondsSinceHeartbeat;
  const lastSeenText = secondsAgo === null ? '—' : secondsAgo < 60 ? `${secondsAgo}s` : `${Math.round(secondsAgo / 60)}m`;

  return (
    <div
      className={`rounded-xl border-2 p-5 ${
        isOffline ? 'border-status-missing bg-[#FDF2F2]' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">{doorLabel}</h2>
        <StatusDot status={device.status} />
      </div>
      <div className="text-xs text-gray-500 mb-1">Last seen: {lastSeenText} ago</div>

      <div className="text-xs text-gray-600 space-y-0.5 mt-3">
        <div>Reader: {device.readerConnected === null ? '—' : device.readerConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Zone A: {device.zoneAReadRate !== null ? `${device.zoneAReadRate} r/s` : '—'}</div>
        <div>Zone B: {device.zoneBReadRate !== null ? `${device.zoneBReadRate} r/s` : '—'}</div>
        <div>Queue: {device.queueDepth !== null ? device.queueDepth : '—'}</div>
      </div>

      <button
        onClick={onViewLogs}
        className="mt-4 text-xs font-semibold text-brand-green underline hover:opacity-80"
      >
        View Logs
      </button>
    </div>
  );
}

function StatusDot({ status }: { status: 'online' | 'offline' | 'unknown' }) {
  const colours = { online: 'bg-status-present', offline: 'bg-status-missing', unknown: 'bg-gray-400' };
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold capitalize">
      <span className={`w-2.5 h-2.5 rounded-full ${colours[status]}`} />
      {status}
    </span>
  );
}

function HeartbeatLogsModal({ deviceId, label, onClose }: { deviceId: string; label: string; onClose: () => void }) {
  const [rows, setRows] = useState<HeartbeatHistoryRow[]>([]);

  useEffect(() => {
    fetch(`/api/devices/${deviceId}/heartbeats`)
      .then((r) => r.json() as Promise<{ heartbeats: HeartbeatHistoryRow[] }>)
      .then((d) => setRows(d.heartbeats))
      .catch(() => undefined);
  }, [deviceId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{label.toUpperCase()} — Heartbeat Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white border-b border-gray-200">
              <tr>
                <th className="text-left py-2 pr-4 font-semibold text-gray-600">Timestamp</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-600">Reader</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-600">Queue</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-600">Zone A r/s</th>
                <th className="text-left py-2 font-semibold text-gray-600">Zone B r/s</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => {
                const p = r.payload;
                return (
                  <tr key={r.id}>
                    <td className="py-1.5 pr-4 text-gray-700">{new Date(r.ts).toLocaleTimeString()}</td>
                    <td className="py-1.5 pr-4">{String(p.readerConnected ?? '—')}</td>
                    <td className="py-1.5 pr-4">{String(p.queueDepth ?? '—')}</td>
                    <td className="py-1.5 pr-4">{String(p.zoneAReadRate ?? '—')}</td>
                    <td className="py-1.5">{String(p.zoneBReadRate ?? '—')}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">No heartbeat records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
