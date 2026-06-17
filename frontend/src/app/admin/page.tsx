"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useRequireAuth } from "@/lib/auth";
import {
  generateTicket,
  getAttendance,
  revokeTicket,
  type ApiError,
  type Session,
} from "@/lib/api";

export default function AdminPage() {
  const { ready } = useRequireAuth(["ADMIN"]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header title="Admin Dashboard" />
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <AttendancePanel />
        <div className="grid gap-6 md:grid-cols-2">
          <GeneratePanel />
          <RevokePanel />
        </div>
      </div>
    </main>
  );
}

function AttendancePanel() {
  const [stats, setStats] = useState<Record<Session, number>>({
    SESSION_1: 0,
    SESSION_2: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAttendance();
      const next: Record<Session, number> = { SESSION_1: 0, SESSION_2: 0 };
      for (const row of res.data) next[row._id] = row.count;
      setStats(next);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Attendance</h2>
        <button
          onClick={load}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm transition hover:bg-neutral-800"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Session 1 — Checked in" value={stats.SESSION_1} />
        <StatCard label="Session 2 — Checked in" value={stats.SESSION_2} />
        <StatCard
          label="Total Checked in"
          value={stats.SESSION_1 + stats.SESSION_2}
          accent
        />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <p
        className="text-3xl font-bold"
        style={accent ? { color: "var(--tedx-red)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-neutral-400">{label}</p>
    </div>
  );
}

function GeneratePanel() {
  const [userId, setUserId] = useState("");
  const [session, setSession] = useState<Session>("SESSION_1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    ticketId: string;
    qrCode: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await generateTicket(userId.trim(), session);
      setResult({ ticketId: res.data.ticketId, qrCode: res.data.qrCode });
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold">Generate Ticket</h2>
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">
            Attendee / User ID
          </label>
          <input
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. attendee@email.com or user _id"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-300">Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as Session)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-red-500"
          >
            <option value="SESSION_1">Session 1</option>
            <option value="SESSION_2">Session 2</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{ backgroundColor: "var(--tedx-red)" }}
        >
          {loading ? "Generating…" : "Generate QR Ticket"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-center">
          <p className="text-sm text-neutral-400">Ticket ID</p>
          <p className="mb-3 font-mono text-sm font-semibold">
            {result.ticketId}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qrCode}
            alt={`QR code for ${result.ticketId}`}
            className="mx-auto h-48 w-48 rounded bg-white p-2"
          />
          <a
            href={result.qrCode}
            download={`${result.ticketId}.png`}
            className="mt-4 inline-block rounded-md border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800"
          >
            Download QR
          </a>
        </div>
      )}
    </section>
  );
}

function RevokePanel() {
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await revokeTicket(ticketId.trim());
      setMsg({ ok: true, text: res.message || "Ticket revoked." });
      setTicketId("");
    } catch (err) {
      setMsg({ ok: false, text: (err as ApiError).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold">Revoke Ticket</h2>
      <form onSubmit={handleRevoke} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-300">
            Ticket ID
          </label>
          <input
            required
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="TEDXIITP-26-81-0001"
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm outline-none focus:border-red-500"
          />
        </div>

        {msg && (
          <p
            className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}
          >
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md border border-red-900 bg-red-950/40 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-950/70 disabled:opacity-50"
        >
          {loading ? "Revoking…" : "Revoke Ticket"}
        </button>
      </form>
      <p className="mt-3 text-xs text-neutral-600">
        A revoked ticket can no longer be checked in at the gate.
      </p>
    </section>
  );
}
