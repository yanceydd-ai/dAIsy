'use client';

import { useState, useEffect, useCallback } from 'react';
import NewSessionModal from './NewSessionModal';

interface SessionRow {
  id: string;
  label: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: string;
}

export default function SessionsClient() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
      const data = (await res.json()) as { sessions: SessionRow[] };
      setSessions(data.sessions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const handleStart = async (id: string) => {
    setActionPending(id);
    try {
      const res = await fetch(`/api/sessions/${id}/start`, { method: 'PATCH' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Failed to start session: ${res.status}`);
      }
      await fetchSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setActionPending(null);
    }
  };

  const handleEnd = async (id: string) => {
    if (!confirm('End this session?')) return;
    setActionPending(id);
    try {
      const res = await fetch(`/api/sessions/${id}/end`, { method: 'PATCH' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `Failed to end session: ${res.status}`);
      }
      await fetchSessions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setActionPending(null);
    }
  };

  const activeSession = sessions.find((s) => s.status === 'active');
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading sessions…</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-green">Sessions</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          + New Session
        </button>
      </div>

      {/* Active session card */}
      {activeSession && (
        <div className="mb-6 rounded-xl border-2 border-status-present bg-green-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full bg-status-present text-white text-xs font-bold uppercase tracking-wider">
              Active
            </span>
            <h2 className="text-lg font-semibold text-gray-900">{activeSession.label}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Started: {activeSession.actualStart
              ? new Date(activeSession.actualStart).toLocaleTimeString()
              : '—'}
          </p>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-opacity-90"
            >
              View Dashboard
            </a>
            <button
              onClick={() => void handleEnd(activeSession.id)}
              disabled={actionPending === activeSession.id}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {actionPending === activeSession.id ? 'Ending…' : 'End Session'}
            </button>
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Upcoming Today
          </h2>
          <div className="space-y-2">
            {upcomingSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">{s.label}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(s.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => void handleStart(s.id)}
                  disabled={!!actionPending || !!activeSession}
                  className="px-3 py-1.5 bg-brand-green text-white rounded text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
                >
                  {actionPending === s.id ? 'Starting…' : 'Start Session'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No sessions message */}
      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-1">No sessions today</p>
          <p className="text-sm">Create a new session or wait for Blackbaud sync.</p>
        </div>
      )}

      {/* New Session Modal */}
      {showNewModal && (
        <NewSessionModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false);
            void fetchSessions();
          }}
        />
      )}
    </div>
  );
}
