'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type SessionType = 'scheduled' | 'custom';

interface FormErrors {
  label?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export default function NewSessionModal({ onClose, onCreated }: Props) {
  const [sessionType, setSessionType] = useState<SessionType>('custom');
  const [label, setLabel] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!label.trim()) {
      errs.label = 'Label is required';
    } else if (label.length > 200) {
      errs.label = 'Label must be 200 characters or fewer';
    }

    if (!scheduledStart) {
      errs.scheduledStart = 'Start time is required';
    } else {
      const start = new Date(scheduledStart);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (start < fiveMinutesAgo) {
        errs.scheduledStart = 'Start time must be in the future (or within the last 5 minutes)';
      }
    }

    if (!scheduledEnd) {
      errs.scheduledEnd = 'End time is required';
    } else if (scheduledStart && scheduledEnd) {
      if (new Date(scheduledEnd) <= new Date(scheduledStart)) {
        errs.scheduledEnd = 'End time must be after start time';
      }
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          scheduledStart: new Date(scheduledStart).toISOString(),
          scheduledEnd: new Date(scheduledEnd).toISOString(),
          rosterStudentIds: [],
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setServerError(data.error ?? `Failed to create session (${res.status})`);
        return;
      }

      onCreated();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Session</h2>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            {/* Session type selector */}
            <div className="mb-4">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['scheduled', 'custom'] as SessionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSessionType(type)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      sessionType === type
                        ? 'bg-brand-green text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'scheduled' ? 'Scheduled Period' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {sessionType === 'scheduled' && (
              <p className="text-sm text-gray-500 mb-4">
                Scheduled period integration with Blackbaud is available after roster sync completes.
              </p>
            )}

            {/* Label */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={200}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                  errors.label ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g. Period 3 PE — Gymnasium"
              />
              {errors.label && (
                <p className="mt-1 text-xs text-red-600">{errors.label}</p>
              )}
            </div>

            {/* Start time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                  errors.scheduledStart ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduledStart && (
                <p className="mt-1 text-xs text-red-600">{errors.scheduledStart}</p>
              )}
            </div>

            {/* End time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green ${
                  errors.scheduledEnd ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduledEnd && (
                <p className="mt-1 text-xs text-red-600">{errors.scheduledEnd}</p>
              )}
            </div>

            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
