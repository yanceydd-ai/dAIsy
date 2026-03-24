'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  sessionId: string | null;
  onClose: () => void;
}

type FormatState = 'idle' | 'loading' | 'done' | 'error';

export default function ExportModal({ sessionId, onClose }: Props) {
  const [pdfState, setPdfState] = useState<FormatState>('idle');
  const [csvState, setCsvState] = useState<FormatState>('idle');
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDownload = async (format: 'pdf' | 'csv') => {
    const setState = format === 'pdf' ? setPdfState : setCsvState;
    if ((format === 'pdf' ? pdfState : csvState) !== 'idle') return;
    setState('loading');
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, format }),
      });
      if (!res.ok) throw new Error('Export failed');
      const { downloadUrl } = (await res.json()) as { downloadUrl: string; expiresAt: string };
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `emergency-roster-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[480px] p-6" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        <h2 id="export-modal-title" className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-4">
          Emergency Roster Export
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Missing-first sort. Includes: name, grade, status, last seen.
        </p>

        <div className="flex gap-3 mb-6">
          <DownloadButton format="pdf" state={pdfState} onClick={() => void handleDownload('pdf')} />
          <DownloadButton format="csv" state={csvState} onClick={() => void handleDownload('csv')} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function DownloadButton({ format, state, onClick }: { format: 'pdf' | 'csv'; state: FormatState; onClick: () => void }) {
  const label = format.toUpperCase();
  return (
    <button
      onClick={onClick}
      disabled={state === 'loading'}
      className="flex-1 bg-brand-green text-white font-semibold uppercase tracking-widest px-4 py-3 rounded-lg hover:opacity-90 disabled:opacity-60 transition-all"
      aria-label={`Download ${label}`}
    >
      {state === 'loading' && (
        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-text-bottom" />
      )}
      {state === 'done' ? `✓ ${label} Ready` : state === 'error' ? 'Error — Retry' : `Download ${label}`}
    </button>
  );
}
