"use client";

/**
 * useNotifications
 *
 * Derives the header's notification feed from data that already lives in
 * Firestore for the active branch — overdue lead follow-ups, overdue fee dues
 * and today's new enquiries. Nothing is written server-side, so the feed can
 * never drift from the underlying records.
 *
 * Read-state is per user in localStorage: a derived alert has no document of
 * its own to flag, and "read" is a personal, device-level concern anyway.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "./useFirestoreCollection";

export type NotificationKind = "followup" | "fee" | "lead";
export type NotificationSeverity = "urgent" | "warning" | "info";

export interface AppNotification {
  /** Stable across refreshes — read-state is keyed on it. */
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  description: string;
  /** Where clicking the item takes the user. */
  href: string;
  /** Sort key, newest / most urgent first. */
  timestamp: number;
  read: boolean;
}

interface EnquiryDoc {
  id: string;
  name: string;
  phone?: string;
  classInterested?: string;
  /** Stored as YYYY-MM-DD by the leads form, but older records hold Timestamps. */
  followUpDate?: unknown;
  status?: string;
  createdAt?: unknown;
  branchId: string;
}

interface FeeDoc {
  id: string;
  studentName?: string;
  name?: string;
  class?: string;
  balance?: number;
  status?: string;
  /** Same story as followUpDate — normalise before comparing. */
  dueDate?: unknown;
  branchId: string;
}

const CLOSED_LEAD_STATUSES = ["Admitted", "Not Interested"];
/** Cap the feed so a branch with hundreds of dues cannot lock up the popover. */
const MAX_PER_SOURCE = 25;

/** Local (not UTC) YYYY-MM-DD — followUpDate / dueDate are stored in this form. */
function localDateKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Firestore Timestamp | Date | ISO string → ms, or null when unparseable. */
function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof (value as any)?.toDate === "function") return (value as any).toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Any stored date shape → local YYYY-MM-DD, or null when absent/unparseable.
 * Date fields in this app are written as YYYY-MM-DD strings by the newer forms
 * but survive as Firestore Timestamps in older records, so every comparison
 * has to go through here rather than assuming a string.
 */
function toDateKey(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  }
  const ms = toMillis(value);
  return ms === null ? null : localDateKey(new Date(ms));
}

function dateKeyToMillis(key: string): number {
  const parsed = new Date(`${key}T00:00:00`).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((dateKeyToMillis(toKey) - dateKeyToMillis(fromKey)) / 86_400_000);
}

/** Amounts are occasionally stored as strings; coerce before comparing. */
function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const fmtAmount = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

// ── Read-state persistence ───────────────────────────────────────────────────

const storageKey = (uid: string) => `ba:notifications:read:${uid}`;

function loadReadIds(uid: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveReadIds(uid: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(ids));
  } catch {
    /* private mode / quota — read-state is a convenience, not worth failing over */
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const uid = user?.uid ?? "anonymous";

  const { data: enquiries, loading: enquiriesLoading } =
    useFirestoreCollection<EnquiryDoc>("enquiries", currentBranch);
  const { data: fees, loading: feesLoading } =
    useFirestoreCollection<FeeDoc>("fees", currentBranch);

  const [readIds, setReadIds] = useState<string[]>([]);

  // Hydrate read-state on the client only, so SSR and the first client render
  // agree (localStorage is unavailable during SSR).
  useEffect(() => {
    setReadIds(loadReadIds(uid));
  }, [uid]);

  const derived = useMemo<Omit<AppNotification, "read">[]>(() => {
    const todayKey = localDateKey();
    const items: Omit<AppNotification, "read">[] = [];

    // 1. Lead follow-ups that are overdue or due today.
    enquiries
      .map((lead) => ({ lead, dueKey: toDateKey(lead.followUpDate) }))
      .filter(
        (entry): entry is { lead: EnquiryDoc; dueKey: string } =>
          entry.dueKey !== null &&
          entry.dueKey <= todayKey &&
          !CLOSED_LEAD_STATUSES.includes(entry.lead.status ?? "")
      )
      .sort((a, b) => (a.dueKey < b.dueKey ? -1 : a.dueKey > b.dueKey ? 1 : 0))
      .slice(0, MAX_PER_SOURCE)
      .forEach(({ lead, dueKey }) => {
        const overdueBy = daysBetween(dueKey, todayKey);
        items.push({
          id: `followup:${lead.id}:${dueKey}`,
          kind: "followup",
          severity: overdueBy > 0 ? "urgent" : "warning",
          title: overdueBy > 0 ? "Follow-up overdue" : "Follow-up due today",
          description:
            overdueBy > 0
              ? `${lead.name} — ${overdueBy} day${overdueBy === 1 ? "" : "s"} overdue`
              : `${lead.name}${lead.classInterested ? ` — ${lead.classInterested}` : ""}`,
          href: `/admin/leads/${lead.id}`,
          // Older due dates are more urgent, so they sort to the top.
          timestamp: -dateKeyToMillis(dueKey),
        });
      });

    // 2. Fee dues past their due date.
    fees
      .map((fee) => ({ fee, dueKey: toDateKey(fee.dueDate), balance: toNumber(fee.balance) }))
      .filter(
        (entry): entry is { fee: FeeDoc; dueKey: string; balance: number } =>
          entry.balance > 0 && entry.dueKey !== null && entry.dueKey < todayKey
      )
      .sort((a, b) => (a.dueKey < b.dueKey ? -1 : a.dueKey > b.dueKey ? 1 : 0))
      .slice(0, MAX_PER_SOURCE)
      .forEach(({ fee, dueKey, balance }) => {
        const student = fee.studentName ?? fee.name ?? "Student";
        items.push({
          id: `fee:${fee.id}:${dueKey}`,
          kind: "fee",
          severity: "urgent",
          title: "Fee payment overdue",
          description: `${student} — ${fmtAmount(balance)} pending since ${dueKey}`,
          href: "/admin/fees/balance",
          timestamp: -dateKeyToMillis(dueKey),
        });
      });

    // 3. Enquiries that came in today and nobody has moved yet.
    enquiries
      .filter((lead) => {
        if ((lead.status ?? "New") !== "New") return false;
        const created = toMillis(lead.createdAt);
        return created !== null && localDateKey(new Date(created)) === todayKey;
      })
      .slice(0, MAX_PER_SOURCE)
      .forEach((lead) => {
        items.push({
          id: `lead:${lead.id}`,
          kind: "lead",
          severity: "info",
          title: "New enquiry received",
          description: `${lead.name}${lead.classInterested ? ` — ${lead.classInterested}` : ""}`,
          href: `/admin/leads/${lead.id}`,
          timestamp: toMillis(lead.createdAt) ?? 0,
        });
      });

    return items;
  }, [enquiries, fees]);

  // Drop read-ids whose alert has since resolved, so the stored list tracks the
  // live feed instead of growing without bound.
  useEffect(() => {
    if (enquiriesLoading || feesLoading || readIds.length === 0) return;
    const live = new Set(derived.map((n) => n.id));
    const pruned = readIds.filter((id) => live.has(id));
    if (pruned.length !== readIds.length) {
      setReadIds(pruned);
      saveReadIds(uid, pruned);
    }
  }, [derived, readIds, uid, enquiriesLoading, feesLoading]);

  const notifications = useMemo<AppNotification[]>(() => {
    const read = new Set(readIds);
    const severityRank: Record<NotificationSeverity, number> = { urgent: 0, warning: 1, info: 2 };
    return derived
      .map((n) => ({ ...n, read: read.has(n.id) }))
      .sort((a, b) => {
        // Unread first, then by severity, then most recent / most overdue.
        if (a.read !== b.read) return a.read ? 1 : -1;
        if (a.severity !== b.severity) return severityRank[a.severity] - severityRank[b.severity];
        return b.timestamp - a.timestamp;
      });
  }, [derived, readIds]);

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        saveReadIds(uid, next);
        return next;
      });
    },
    [uid]
  );

  const markAllAsRead = useCallback(() => {
    const all = derived.map((n) => n.id);
    setReadIds(all);
    saveReadIds(uid, all);
  }, [derived, uid]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    loading: enquiriesLoading || feesLoading,
    markAsRead,
    markAllAsRead,
  };
}
