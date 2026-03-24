'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TagRow } from '@/lib/tags/tagService';

interface TagsData {
  tags: TagRow[];
  untaggedCount: number;
}

export default function TagsClient() {
  const [data, setData] = useState<TagsData | null>(null);
  const [search, setSearch] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<TagRow | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: Array<{ row: number; reason: string }> } | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/tags');
    if (res.ok) setData(await res.json() as TagsData);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const filteredTags = (data?.tags ?? []).filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.studentName?.toLowerCase().includes(q) ?? false) ||
      t.epc.toLowerCase().includes(q)
    );
  });

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await fetch('/api/tags/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: revokeTarget.tagId, reason: revokeReason }),
    });
    setRevokeTarget(null);
    setRevokeReason('');
    await reload();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/tags/import', { method: 'POST', body: form });
    if (res.ok) {
      setImportResult(await res.json() as typeof importResult);
      await reload();
    }
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tag Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setAssignModalOpen(true)}
            className="px-4 py-2 bg-brand-green text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            + Assign Tag
          </button>
          <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Untagged alert */}
      {(data?.untaggedCount ?? 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-yellow-800 text-sm font-medium">
            {data!.untaggedCount} student{data!.untaggedCount === 1 ? '' : 's'} have no assigned tag
          </span>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="text-sm font-semibold text-yellow-800 underline"
          >
            Assign Tags
          </button>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 text-sm font-medium">
            {importResult.created} tags assigned, {importResult.skipped} skipped, {importResult.errors.length} errors.
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-700 space-y-0.5">
              {importResult.errors.map((e) => (
                <li key={e.row}>Row {e.row}: {e.reason}</li>
              ))}
            </ul>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-500 underline">Dismiss</button>
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        placeholder="Search by student name or EPC..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-4"
      />

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Grade</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 font-mono">Tag EPC</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTags.map((tag) => (
              <tr key={tag.tagId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{tag.studentName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{tag.grade ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{tag.epc}</td>
                <td className="px-4 py-3 text-gray-600">
                  {tag.assignedAt ? new Date(tag.assignedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tag.status} />
                </td>
                <td className="px-4 py-3">
                  {tag.status === 'active' && (
                    <button
                      onClick={() => { setRevokeTarget(tag); setRevokeReason(''); }}
                      className="text-sm text-status-missing font-medium hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredTags.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No tags found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revoke confirmation */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold mb-3">
              Revoke tag for {revokeTarget.studentName ?? revokeTarget.epc}?
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter reason:</label>
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="Reason for revocation…"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleRevoke()}
                disabled={!revokeReason.trim()}
                className="px-4 py-2 bg-status-missing text-white rounded-lg text-sm disabled:opacity-50"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal placeholder — full implementation wires to /api/tags/assign */}
      {assignModalOpen && (
        <AssignTagModal onClose={() => setAssignModalOpen(false)} onSuccess={reload} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: 'bg-status-present text-white',
    revoked: 'bg-gray-300 text-gray-700',
    lost: 'bg-status-missing text-white',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-widest ${variants[status] ?? 'bg-gray-200 text-gray-600'}`}>
      {status}
    </span>
  );
}

function AssignTagModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => Promise<void> }) {
  const [epc, setEpc] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epc.trim() || !studentId.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/tags/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epc: epc.trim(), studentId: studentId.trim() }),
      });
      if (res.status === 409) { setError('This EPC is already assigned to an active student.'); return; }
      if (!res.ok) { setError('Assignment failed — please try again.'); return; }
      await onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold mb-4">Assign Tag</h2>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Student UUID…"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag EPC</label>
            <input
              type="text"
              value={epc}
              onChange={(e) => setEpc(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="E200…"
            />
          </div>
          {error && <p className="text-sm text-status-missing mb-3">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !epc.trim() || !studentId.trim()} className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm disabled:opacity-50">
              {submitting ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
