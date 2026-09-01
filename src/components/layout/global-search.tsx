"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  LayoutGrid,
  Phone,
  Search,
  UserCog,
  UserPlus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth-context";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { navSections, hasAccess } from "@/components/layout/admin-nav";
import { releaseUiLock } from "@/lib/release-ui-lock";

/** Per-group result cap — keeps the list readable and the DOM small. */
const MAX_PER_GROUP = 6;

interface StudentDoc {
  id: string;
  name?: string;
  appNo?: string;
  class?: string;
  parentName?: string;
  phone?: string;
  status?: string;
  branchId: string;
}

interface StaffDoc {
  id: string;
  name?: string;
  staffId?: string;
  role?: string;
  phone?: string;
  status?: string;
  branchId: string;
}

interface EnquiryDoc {
  id: string;
  name?: string;
  enquiryNo?: string;
  phone?: string;
  classInterested?: string;
  status?: string;
  branchId: string;
}

interface SearchResult {
  id: string;
  label: string;
  hint: string;
  href: string;
  /** Everything matchable, lowercased — the needle is tested against this. */
  haystack: string;
}

/** Values arrive from Firestore untyped; render only what is actually text. */
function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function buildHaystack(...parts: unknown[]): string {
  return parts.map(text).filter(Boolean).join(" ").toLowerCase();
}

/** Joins the non-empty bits of a subtitle with a middot. */
function hint(...parts: unknown[]): string {
  return parts.map(text).filter(Boolean).join(" · ");
}

export function GlobalSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const userRole = user?.role ?? "admin";

  // Only subscribe once the palette has been opened — the header is on every
  // admin page, and these are three whole collections.
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);
  const branch = everOpened ? currentBranch : undefined;

  const { data: students } = useFirestoreCollection<StudentDoc>("students", branch);
  const { data: staff } = useFirestoreCollection<StaffDoc>("staff", branch);
  const { data: enquiries } = useFirestoreCollection<EnquiryDoc>("enquiries", branch);

  // ⌘K / Ctrl+K anywhere in the admin area.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Every nav destination the current role may reach, flattened. A few pages
  // are linked from two sections (Print Marksheet sits under both Academics and
  // Examination); search wants one row per destination, so first link wins.
  const pages = useMemo<SearchResult[]>(() => {
    const byHref = new Map<string, SearchResult>();
    navSections.forEach((section) => {
      if (!hasAccess(section.roles, userRole)) return;
      const sectionLabel = section.label ?? "";
      section.items.forEach((item) => {
        if (!hasAccess(item.roles, userRole) || byHref.has(item.href)) return;
        byHref.set(item.href, {
          id: `page:${item.href}`,
          label: item.label,
          hint: sectionLabel,
          href: item.href,
          haystack: buildHaystack(item.label, sectionLabel, item.href),
        });
      });
    });
    return [...byHref.values()];
  }, [userRole]);

  const needle = query.trim().toLowerCase();

  const match = useCallback(
    (results: SearchResult[]) =>
      needle ? results.filter((r) => r.haystack.includes(needle)).slice(0, MAX_PER_GROUP) : [],
    [needle]
  );

  const studentResults = useMemo(
    () =>
      match(
        students.map((s) => ({
          id: `student:${s.id}`,
          label: text(s.name) || "Unnamed student",
          hint: hint(s.appNo, s.class, s.parentName && `Parent: ${text(s.parentName)}`),
          href: `/admin/students/${s.id}`,
          haystack: buildHaystack(s.name, s.appNo, s.class, s.parentName, s.phone),
        }))
      ),
    [students, match]
  );

  const staffResults = useMemo(
    () =>
      match(
        staff.map((s) => ({
          id: `staff:${s.id}`,
          label: text(s.name) || "Unnamed staff",
          hint: hint(s.staffId, s.role, s.phone),
          href: `/admin/hr/staff/${s.id}`,
          haystack: buildHaystack(s.name, s.staffId, s.role, s.phone),
        }))
      ),
    [staff, match]
  );

  const enquiryResults = useMemo(
    () =>
      match(
        enquiries.map((e) => ({
          id: `enquiry:${e.id}`,
          label: text(e.name) || "Unnamed enquiry",
          hint: hint(e.enquiryNo, e.classInterested, e.status),
          href: `/admin/leads/${e.id}`,
          haystack: buildHaystack(e.name, e.enquiryNo, e.classInterested, e.phone, e.status),
        }))
      ),
    [enquiries, match]
  );

  const pageResults = useMemo(() => match(pages), [pages, match]);

  // With no query, offer the handful of places people actually jump to.
  const suggestions = useMemo(
    () =>
      [
        "/admin/students",
        "/admin/leads",
        "/admin/fees/collect",
        "/admin/attendance/students",
        "/admin/hr",
      ]
        .map((href) => pages.find((p) => p.href === href))
        .filter((p): p is SearchResult => Boolean(p)),
    [pages]
  );

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    // CommandDialog is a modal Radix layer; navigating unmounts it before its
    // cleanup runs, which would leave the next page inert (tasks/lessons.md).
    releaseUiLock();
    router.push(href);
  };

  const renderGroup = (
    heading: string,
    icon: ReactNode,
    results: SearchResult[]
  ) =>
    results.length > 0 && (
      <CommandGroup heading={heading}>
        {results.map((r) => (
          <CommandItem key={r.id} value={`${r.haystack} ${r.id}`} onSelect={() => go(r.href)}>
            <span className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{r.label}</span>
              {r.hint && (
                <span className="block truncate text-xs text-muted-foreground">{r.hint}</span>
              )}
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
    );

  const hasResults =
    pageResults.length + studentResults.length + staffResults.length + enquiryResults.length > 0;

  return (
    <>
      {/* Desktop: the pill. Mobile: an icon button, so search is reachable there too. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="hidden items-center rounded-full bg-muted px-3 py-1.5 text-left transition-colors hover:bg-muted/70 md:flex"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Search...</span>
        <kbd className="ml-6 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search students, staff, enquiries and admin pages."
      >
        <CommandInput
          placeholder="Search students, staff, enquiries or pages..."
          className="pr-10"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {needle === "" ? (
            <CommandGroup heading="Jump to">
              {suggestions.map((s) => (
                <CommandItem key={s.id} value={`${s.haystack} ${s.id}`} onSelect={() => go(s.href)}>
                  <span className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate text-sm">{s.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <>
              {!hasResults && <CommandEmpty>No results for “{query.trim()}”.</CommandEmpty>}
              {renderGroup("Students", <GraduationCap className="h-3.5 w-3.5" />, studentResults)}
              {renderGroup("Staff", <UserCog className="h-3.5 w-3.5" />, staffResults)}
              {renderGroup("Enquiries", <UserPlus className="h-3.5 w-3.5" />, enquiryResults)}
              {(studentResults.length > 0 ||
                staffResults.length > 0 ||
                enquiryResults.length > 0) &&
                pageResults.length > 0 && <CommandSeparator />}
              {renderGroup("Pages", <LayoutGrid className="h-3.5 w-3.5" />, pageResults)}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
