"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight, Upload, FileText, Trash2, Plus, Search, Paperclip,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { toast } from "@/hooks/use-toast";

type UploadCategory = "Notes" | "Past Papers" | "Worksheets" | "Syllabus" | "Other";
type FileType = "PDF" | "DOC" | "PPT" | "ZIP" | "XLSX";

interface WebsiteUpload {
  id: string;
  title: string;
  category: UploadCategory;
  subject: string;
  class: string;
  fileName: string;
  fileType: FileType;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  isPublic: boolean;
  downloadCount: number;
  downloadUrl?: string;
  storagePath?: string;
  branchId: string;
}

const CATEGORIES: UploadCategory[] = ["Notes", "Past Papers", "Worksheets", "Syllabus", "Other"];
const FILE_TYPES: FileType[]       = ["PDF", "DOC", "PPT", "ZIP", "XLSX"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Economics", "Computer Science", "Other"];
const CLASSES  = ["Class 9", "Class 10", "Class 11", "Class 12", "All Classes"];

const FILE_COLORS: Record<FileType, string> = {
  PDF:  "bg-red-100 text-red-600",
  DOC:  "bg-blue-100 text-blue-600",
  PPT:  "bg-orange-100 text-orange-600",
  ZIP:  "bg-purple-100 text-purple-600",
  XLSX: "bg-green-100 text-green-600",
};

const CAT_COLORS: Record<UploadCategory, string> = {
  "Notes":       "bg-blue-100 text-blue-700",
  "Past Papers": "bg-purple-100 text-purple-700",
  "Worksheets":  "bg-teal-100 text-teal-700",
  "Syllabus":    "bg-amber-100 text-amber-700",
  "Other":       "bg-slate-100 text-slate-600",
};

const BLANK = {
  title: "", category: "Notes" as UploadCategory, subject: "Physics",
  class: "Class 11", fileType: "PDF" as FileType, fileSize: "", uploadedBy: "Admin", isPublic: true,
};

export default function UploadContentPage() {
  const { currentBranch } = useBranch();

  const { data: uploads, loading } = useFirestoreCollection<WebsiteUpload>("websiteUploads", currentBranch);

  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ ...BLANK });
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteUpload | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    uploads
      .filter(u => catFilter === "All" || u.category === catFilter)
      .filter(u => !search || u.title.toLowerCase().includes(search.toLowerCase()) || u.subject.toLowerCase().includes(search.toLowerCase())),
    [uploads, catFilter, search]
  );

  const totalDownloads = filtered.reduce((s, u) => s + (u.downloadCount ?? 0), 0);
  const publicCount    = filtered.filter(u => u.isPublic).length;

  const togglePublic = async (u: WebsiteUpload) => {
    try {
      await updateDocument("websiteUploads", u.id, { isPublic: !u.isPublic });
    } catch {
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("websiteUploads", deleteTarget.id);
      if (deleteTarget.storagePath) {
        try { await deleteObject(ref(storage, deleteTarget.storagePath)); } catch { /* file may not exist */ }
      }
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      // Auto-detect file type
      const ext = file.name.split(".").pop()?.toUpperCase() as FileType;
      if (FILE_TYPES.includes(ext)) setForm(p => ({ ...p, fileType: ext }));
      // Auto-fill title if empty
      setForm(p => ({
        ...p,
        fileType: FILE_TYPES.includes(ext) ? ext : p.fileType,
        title: p.title || file.name.replace(/\.[^.]+$/, ""),
        fileSize: file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
          : (file.size / 1024).toFixed(0) + " KB",
      }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      let downloadUrl = "";
      let storagePath = "";

      if (selectedFile) {
        try {
          storagePath = `uploads/${currentBranch}/${Date.now()}_${selectedFile.name}`;
          const storageRef = ref(storage, storagePath);
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 20000)
          );
          const snapshot = await Promise.race([uploadBytes(storageRef, selectedFile), timeout]) as Awaited<ReturnType<typeof uploadBytes>>;
          downloadUrl = await getDownloadURL(snapshot.ref);
        } catch {
          // Storage upload failed — save metadata only, no file link
          storagePath = "";
          downloadUrl = "";
          toast({
            title: "File not stored",
            description: "Metadata saved. Deploy Firebase Storage rules to enable file uploads.",
          });
        }
      }

      await addDocument("websiteUploads", {
        title:         form.title.trim(),
        category:      form.category,
        subject:       form.subject,
        class:         form.class,
        fileName:      selectedFile?.name ?? form.title.toLowerCase().replace(/\s+/g, "_") + "." + form.fileType.toLowerCase(),
        fileType:      form.fileType,
        fileSize:      form.fileSize || "—",
        uploadedBy:    form.uploadedBy,
        uploadedAt:    new Date().toISOString().slice(0, 10),
        isPublic:      form.isPublic,
        downloadCount: 0,
        downloadUrl:   downloadUrl || null,
        storagePath:   storagePath || null,
        branchId:      currentBranch,
      });
      setForm({ ...BLANK });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowAdd(false);
      toast({ title: "Upload Added", description: form.title.trim() });
    } catch {
      toast({ title: "Error", description: "Failed to save record.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Upload Content" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Upload Content</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-[#1E2A4A]">Upload Content</h2>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Upload New
          </Button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Materials", value: filtered.length,                color: "text-[#1E2A4A]" },
            { label: "Public",          value: publicCount,                    color: "text-green-600" },
            { label: "Private / Draft", value: filtered.length - publicCount,  color: "text-amber-600" },
            { label: "Total Downloads", value: totalDownloads,                 color: "text-[#0D7C8F]" },
          ].map(c => (
            <Card key={c.label} className="border-none shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {loading
                  ? <Skeleton className="h-7 w-12 mt-1" />
                  : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search title or subject..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Class / Subject</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead className="text-center">Visibility</TableHead>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p>No uploads found{search || catFilter !== "All" ? " matching your filters" : `. Click "Upload New" to add one.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        {u.downloadUrl
                          ? <a href={u.downloadUrl} target="_blank" rel="noreferrer" className="font-medium text-sm text-[#0D7C8F] hover:underline">{u.title}</a>
                          : <p className="font-medium text-sm text-[#1E2A4A]">{u.title}</p>
                        }
                        <p className="text-xs text-muted-foreground">{u.fileName} {u.fileSize ? `· ${u.fileSize}` : ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CAT_COLORS[u.category] ?? "bg-slate-100 text-slate-600"}`}>{u.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.class} • {u.subject}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs font-mono ${FILE_COLORS[u.fileType] ?? "bg-slate-100 text-slate-600"}`}>{u.fileType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#0D7C8F]">{(u.downloadCount ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Switch checked={u.isPublic} onCheckedChange={() => togglePublic(u)} />
                      <span className="text-xs text-muted-foreground">{u.isPublic ? "Public" : "Draft"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{u.uploadedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8"
                      onClick={() => setDeleteTarget(u)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) { setSelectedFile(null); setForm({ ...BLANK }); if (fileInputRef.current) fileInputRef.current.value = ""; } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Upload New Material</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {/* File picker */}
              <div className="space-y-1.5">
                <Label>File (PDF, DOC, PPT, ZIP, XLSX)</Label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0D7C8F] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#1E2A4A]">
                      <Paperclip className="h-4 w-4 text-[#0D7C8F]" />
                      {selectedFile.name}
                      <span className="text-xs text-muted-foreground">({form.fileSize})</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6 opacity-40" />
                      <p className="text-xs">Click to select a file</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="e.g. Physics Chapter 5 Notes" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as UploadCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>File Type</Label>
                  <Select value={form.fileType} onValueChange={v => setForm(p => ({ ...p, fileType: v as FileType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FILE_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select value={form.class} onValueChange={v => setForm(p => ({ ...p, class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>File Size (e.g. 2.4 MB)</Label>
                  <Input placeholder="2.4 MB" value={form.fileSize}
                    onChange={e => setForm(p => ({ ...p, fileSize: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Uploaded By</Label>
                  <Input value={form.uploadedBy}
                    onChange={e => setForm(p => ({ ...p, uploadedBy: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublic} onCheckedChange={v => setForm(p => ({ ...p, isPublic: v }))} />
                <Label>Publish publicly on website</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSave} disabled={saving}>
                <Upload className="h-4 w-4" /> {saving ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Upload</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
