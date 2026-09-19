"use client";

/**
 * Bulk student import from a CSV file.
 *
 * Deliberately self-contained: the students page only opens it. Nothing is
 * written until the admin has seen how many rows are ready and what is wrong
 * with the rest, so a bad file costs a click rather than a clean-up.
 *
 * A file exported from the students page imports straight back, and the same
 * loose column matching accepts a spreadsheet typed by hand.
 */

import { useMemo, useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { parseCSV, normalizeHeader } from "@/lib/parseCSV";
import { exportToCSV } from "@/lib/exportToCSV";
import { normalizeClassName } from "@/hooks/useStudentRecord";
import { addStudentsWithAppNos } from "@/lib/appNumber";
import { toast } from "@/hooks/use-toast";

/** A student already on file, enough of one to spot a duplicate. */
export interface ExistingStudent {
  appNo?: string;
  name: string;
  phone?: string;
}

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The branch every imported student is filed under. */
  branchId: string;
  existing: ExistingStudent[];
}

/**
 * Which spellings of a column heading map to which field.
 *
 * The first entry of each list is what the downloadable template uses. The
 * rest are the ways the same column turns up in files people actually send:
 * the export's own headings, and the shorthand a spreadsheet tends to carry.
 */
const COLUMNS: { field: string; label: string; aliases: string[] }[] = [
  { field: "name",            label: "Name",            aliases: ["name", "studentname", "fullname"] },
  { field: "class",           label: "Class",           aliases: ["class", "classname", "std", "standard"] },
  { field: "board",           label: "Board",           aliases: ["board"] },
  { field: "parentName",      label: "Parent Name",     aliases: ["parentname", "parent", "guardian", "guardianname"] },
  { field: "phone",           label: "Phone",           aliases: ["phone", "phonenumber", "mobile", "mobileno", "contact", "contactnumber"] },
  { field: "whatsapp",        label: "WhatsApp",        aliases: ["whatsapp", "whatsappnumber", "whatsappno"] },
  { field: "email",           label: "Email",           aliases: ["email", "emailaddress", "mail"] },
  { field: "subjects",        label: "Subjects",        aliases: ["subjects", "subject"] },
  { field: "mode",            label: "Mode",            aliases: ["mode", "studymode"] },
  { field: "status",          label: "Status",          aliases: ["status"] },
  { field: "appNo",           label: "App No",          aliases: ["appno", "applicationno", "applicationnumber"] },
  { field: "rollNo",          label: "Roll No",         aliases: ["rollno", "rollnumber"] },
  { field: "dob",             label: "Date of Birth",   aliases: ["dateofbirth", "dob", "birthdate"] },
  { field: "gender",          label: "Gender",          aliases: ["gender", "sex"] },
  { field: "school",          label: "School",          aliases: ["school", "schoolname", "schoolcollege"] },
  { field: "medium",          label: "Medium",          aliases: ["medium"] },
  { field: "address",         label: "Address",         aliases: ["address", "street"] },
  { field: "city",            label: "City",            aliases: ["city", "town"] },
  { field: "pincode",         label: "Pincode",         aliases: ["pincode", "pin", "postalcode", "zip"] },
  { field: "admissionDate",   label: "Admission Date",  aliases: ["admissiondate", "dateofjoining", "joindate", "joiningdate"] },
  { field: "batchPreference", label: "Batch",           aliases: ["batch", "batchpreference"] },
  { field: "feeType",         label: "Fee Type",        aliases: ["feetype"] },
  { field: "totalFee",        label: "Total Fee",       aliases: ["totalfee", "totalfeeamount", "fee", "feeamount"] },
];

/** Columns without which a record is not worth creating. */
const REQUIRED = ["name", "class"] as const;

type Row = Record<string, string>;

interface ReadyRow {
  /** Line in the file, counting the header as line 1, so it matches the spreadsheet. */
  line: number;
  data: Record<string, unknown>;
  name: string;
  className: string;
}

interface RejectedRow {
  line: number;
  name: string;
  reason: string;
}

interface Parsed {
  ready: ReadyRow[];
  rejected: RejectedRow[];
  /** Headings in the file that matched no known column. */
  unknownColumns: string[];
  totalRows: number;
}

/** "Physics; Maths" and "Physics, Maths" both become two subjects. */
const splitSubjects = (value: string): string[] =>
  value.split(/[;,|]/).map(s => s.trim()).filter(Boolean);

/** Today, as the "YYYY-MM-DD" the rest of the CRM writes. */
const today = () => new Date().toISOString().split("T")[0];

const makeRollNo = (seed: number) =>
  `ROLL-${(Date.now() + seed).toString(36).toUpperCase()}`;

/** A name and phone reduced to one comparable key, for spotting the same person twice. */
const identityKey = (name: string, phone: string) =>
  `${name.trim().toLowerCase()}|${(phone ?? "").replace(/\D/g, "")}`;

export function ImportStudentsDialog({
  open, onOpenChange, branchId, existing,
}: ImportStudentsDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [importing, setImporting] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  const existingAppNos = useMemo(
    () => new Set(existing.map(s => (s.appNo ?? "").trim().toLowerCase()).filter(Boolean)),
    [existing],
  );
  const existingIdentities = useMemo(
    () => new Set(existing.map(s => identityKey(s.name ?? "", s.phone ?? ""))),
    [existing],
  );

  const reset = () => {
    setFileName("");
    setParsed(null);
    setReadError(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const close = () => {
    if (importing) return;
    reset();
    onOpenChange(false);
  };

  const handleTemplate = () => {
    const headers = COLUMNS.map(c => c.label);
    const sample = COLUMNS.map(c => {
      switch (c.field) {
        case "name":      return "Ravi Kumar";
        case "class":     return "9";
        case "board":     return "CBSE";
        case "parentName":return "Suresh Kumar";
        case "phone":     return "9876543210";
        case "subjects":  return "Physics; Maths";
        case "mode":      return "Offline";
        case "status":    return "Active";
        default:          return "";
      }
    });
    exportToCSV(headers, [sample], "student-import-template");
  };

  const handleFile = async (file: File) => {
    setReadError(null);
    setFileName(file.name);
    try {
      const rows = parseCSV(await file.text());
      if (rows.length < 2) {
        setParsed(null);
        setReadError("That file has a heading row but no students under it.");
        return;
      }
      setParsed(analyse(rows));
    } catch {
      setParsed(null);
      setReadError("That file could not be read. Save it as CSV and try again.");
    }
  };

  /** Turn raw rows into records ready to write, and reasons for the ones that are not. */
  const analyse = (rows: string[][]): Parsed => {
    const headings = rows[0].map(normalizeHeader);

    // Which column index feeds which field.
    const indexOf: Record<string, number> = {};
    COLUMNS.forEach(col => {
      const found = headings.findIndex(h => col.aliases.includes(h));
      if (found !== -1) indexOf[col.field] = found;
    });

    const known = new Set(COLUMNS.flatMap(c => c.aliases));
    const unknownColumns = rows[0].filter((h, i) => h.trim() !== "" && !known.has(headings[i]));

    const ready: ReadyRow[] = [];
    const rejected: RejectedRow[] = [];

    // Duplicates are judged against the file so far as well as the database, so
    // a file that repeats a student does not import them twice.
    const seenAppNos = new Set(existingAppNos);
    const seenIdentities = new Set(existingIdentities);

    rows.slice(1).forEach((cells, i) => {
      const line = i + 2; // header is line 1
      const value = (field: string) =>
        (indexOf[field] !== undefined ? cells[indexOf[field]] ?? "" : "").trim();

      const name = value("name");
      const className = normalizeClassName(value("class"));

      const missing = REQUIRED.filter(f => (f === "class" ? !className : !value(f)));
      if (missing.length > 0) {
        rejected.push({
          line,
          name: name || "(no name)",
          reason: `Missing ${missing.map(f => (f === "class" ? "class" : "name")).join(" and ")}`,
        });
        return;
      }

      const appNo = value("appNo");
      const phone = value("phone");
      const appKey = appNo.toLowerCase();
      const idKey = identityKey(name, phone);

      if (appNo && seenAppNos.has(appKey)) {
        rejected.push({ line, name, reason: `Application number ${appNo} is already on file` });
        return;
      }
      if (!appNo && seenIdentities.has(idKey)) {
        rejected.push({ line, name, reason: "A student with this name and phone is already on file" });
        return;
      }

      const subjects = splitSubjects(value("subjects"));
      const totalFeeRaw = value("totalFee").replace(/[^0-9.]/g, "");

      // Only what the file actually says, plus the fields the CRM needs to file
      // the record. Nothing is invented to fill a blank column.
      const data: Record<string, unknown> = {
        appNo,
        rollNo: value("rollNo") || makeRollNo(i),
        name,
        class: className,
        board: value("board"),
        parentName: value("parentName"),
        phone,
        whatsapp: value("whatsapp") || phone,
        email: value("email"),
        dob: value("dob"),
        gender: value("gender"),
        school: value("school"),
        medium: value("medium"),
        address: value("address"),
        city: value("city"),
        pincode: value("pincode"),
        subjects,
        mode: value("mode") || "Offline",
        batchPreference: value("batchPreference"),
        feeType: value("feeType"),
        totalFee: Number(totalFeeRaw) || 0,
        status: value("status") || "Active",
        admissionDate: value("admissionDate") || today(),
        photo: "",
        branchId,
      };

      if (appNo) seenAppNos.add(appKey);
      seenIdentities.add(idKey);
      ready.push({ line, data, name, className });
    });

    return { ready, rejected, unknownColumns, totalRows: rows.length - 1 };
  };

  const handleImport = async () => {
    if (!parsed || parsed.ready.length === 0) return;
    setImporting(true);
    try {
      // Rows without an App No get the next numbers in sequence, in file order
      await addStudentsWithAppNos(parsed.ready.map(r => r.data));

      toast({
        title: "Import complete",
        description: `${parsed.ready.length} student(s) added to ${branchId}.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Student import failed:", err);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Nothing was saved. Check your connection and try again.",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file. Nothing is saved until you have seen what it contains.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pick a file */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Button variant="outline" className="gap-2" onClick={() => fileInput.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4" /> Choose CSV
            </Button>
            <Button variant="ghost" className="gap-2 text-[#0D7C8F]" onClick={handleTemplate} disabled={importing}>
              <Download className="h-4 w-4" /> Download template
            </Button>
            {fileName && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName}
                {!importing && (
                  <button onClick={reset} aria-label="Clear file" className="hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            )}
          </div>

          {!parsed && !readError && (
            <p className="text-xs text-muted-foreground">
              Name and class are required on every row. Everything else is optional, and a file
              exported from this page can be imported straight back.
            </p>
          )}

          {readError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{readError}</div>
          )}

          {parsed && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Rows in file", value: parsed.totalRows, tone: "text-[#1E2A4A]" },
                  { label: "Ready to import", value: parsed.ready.length, tone: "text-green-600" },
                  { label: "Skipped", value: parsed.rejected.length, tone: parsed.rejected.length ? "text-amber-600" : "text-muted-foreground" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border bg-white p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-xl font-bold ${s.tone}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {parsed.unknownColumns.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ignored column(s): {parsed.unknownColumns.join(", ")}
                </p>
              )}

              {parsed.rejected.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" /> These rows will not be imported
                  </p>
                  <ul className="mt-2 max-h-28 space-y-0.5 overflow-y-auto text-xs text-amber-800">
                    {parsed.rejected.map(r => (
                      <li key={r.line}>Row {r.line} — {r.name}: {r.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed.ready.length > 0 && (
                <div className="overflow-hidden rounded-lg border">
                  <div className="max-h-56 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-16">Row</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Board</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.ready.slice(0, 50).map(r => (
                          <TableRow key={r.line}>
                            <TableCell className="text-xs text-muted-foreground">{r.line}</TableCell>
                            <TableCell className="text-sm font-medium text-[#1E2A4A]">{r.name}</TableCell>
                            <TableCell className="text-sm">Class {r.className}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {String(r.data.board || "—")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {String(r.data.phone || "—")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsed.ready.length > 50 && (
                    <p className="border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                      Showing the first 50 of {parsed.ready.length}. All of them will be imported.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close} disabled={importing}>Cancel</Button>
          <Button
            className="gap-2 bg-[#1E2A4A] hover:bg-[#0D7C8F]"
            onClick={handleImport}
            disabled={importing || !parsed || parsed.ready.length === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            {importing
              ? "Importing…"
              : parsed?.ready.length
                ? `Import ${parsed.ready.length} Student(s)`
                : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
