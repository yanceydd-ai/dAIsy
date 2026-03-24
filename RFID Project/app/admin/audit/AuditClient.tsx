'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AuditEntry, AuditPage } from '@/lib/audit/auditService';

export default function AuditClient() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userUpn, setUserUpn] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (userUpn) params.set('userUpn', userUpn);
    if (action) params.set('action', action);
    params.set('page', String(page));

    const res = await fetch(`/api/audit?${params.toString()}`);
    if (res.ok) setData(await res.json() as AuditPage);
  }, [from, to, userUpn, action, page]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <a
          href={`/api/audit/export?from=${from}&to=${to}&userUpn=${userUpn}&action=${action}`}
          className="px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Export Audit Log CSV
        </a>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <input
          type="date"
          value={from}
          onChange={(e) => { setPage(0); setFrom(e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setPage(0); setTo(e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="To date"
        />
        <input
          type="text"
          value={userUpn}
          onChange={(e) => { setPage(0); setUserUpn(e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="User UPN"
        />
        <input
          type="text"
          value={action}
          onChange={(e) => { setPage(0); setAction(e.target.value); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Action type"
        />
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Timestamp</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Resource</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.entries ?? []).map((entry) => (
              <AuditRow key={entry.id} entry={entry} expanded={expanded === entry.id} onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)} />
            ))}
            {data?.entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page + 1} of {totalPages} — {data?.total} total entries</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ entry, expanded, onToggle }: { entry: AuditEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{new Date(entry.ts).toLocaleString()}</td>
        <td className="px-4 py-2 text-gray-700 max-w-[160px] truncate">{entry.userUpn}</td>
        <td className="px-4 py-2 text-gray-500">{entry.userRole}</td>
        <td className="px-4 py-2 font-mono text-gray-800">{entry.action}</td>
        <td className="px-4 py-2 text-gray-500">{entry.resourceType}{entry.resourceId ? `:${entry.resourceId.slice(0, 8)}` : ''}</td>
        <td className="px-4 py-2 text-gray-400">{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(entry.detail, null, 2)}</pre>
          </td>
        </tr>
      )}
    </>
  );
}
