'use client';

import { useState, useEffect } from 'react';
import type { RetentionConfig } from '@/lib/audit/auditService';

export default function RetentionClient() {
  const [config, setConfig] = useState<RetentionConfig>({ rawReadsDays: 30, crossingEventsDays: 365, presenceSessionsDays: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config/retention')
      .then((r) => r.json() as Promise<RetentionConfig>)
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/config/retention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Retention Configuration</h1>
      <p className="text-sm text-gray-500 mb-6">Configure how long raw data is retained before automatic deletion. Changes take effect at the next nightly purge (3:00 AM).</p>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        <RetentionField
          label="Raw Reads Retention"
          description="How long individual RFID reads are retained (default: 30 days)"
          value={config.rawReadsDays}
          onChange={(v) => setConfig((c) => ({ ...c, rawReadsDays: v }))}
        />
        <RetentionField
          label="Crossing Events Retention"
          description="How long derived crossing events are retained (default: 365 days)"
          value={config.crossingEventsDays}
          onChange={(v) => setConfig((c) => ({ ...c, crossingEventsDays: v }))}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Presence Sessions Retention</label>
          <p className="text-xs text-gray-400 mb-2">How long session presence records are retained. "Indefinite" keeps all records.</p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={config.presenceSessionsDays === null}
                onChange={() => setConfig((c) => ({ ...c, presenceSessionsDays: null }))}
              />
              Indefinite
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={config.presenceSessionsDays !== null}
                onChange={() => setConfig((c) => ({ ...c, presenceSessionsDays: 730 }))}
              />
              Limited:
            </label>
            {config.presenceSessionsDays !== null && (
              <input
                type="number"
                min={1}
                value={config.presenceSessionsDays}
                onChange={(e) => setConfig((c) => ({ ...c, presenceSessionsDays: parseInt(e.target.value) || 1 }))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              />
            )}
            {config.presenceSessionsDays !== null && <span className="text-sm text-gray-500">days</span>}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-green text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}

function RetentionField({ label, description, value, onChange }: { label: string; description: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
          className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-gray-500">days</span>
      </div>
    </div>
  );
}
