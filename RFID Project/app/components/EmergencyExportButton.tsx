'use client';

import { useState } from 'react';
import ExportModal from './ExportModal';

interface Props {
  sessionId: string | null;
}

export default function EmergencyExportButton({ sessionId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="
          w-full sm:w-auto
          bg-status-missing text-white
          font-semibold uppercase tracking-widest
          px-6 py-3.5 rounded-lg
          shadow-md
          hover:opacity-90
          transition-all
          fixed bottom-4 left-4 right-4 sm:static
          sm:min-w-[220px]
          z-40
        "
        aria-label="Export emergency roster"
      >
        Export Emergency Roster
      </button>

      {modalOpen && (
        <ExportModal sessionId={sessionId} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
